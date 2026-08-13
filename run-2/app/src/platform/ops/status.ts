/**
 * The status read model — one source, three surfaces, no drift.
 *
 * Spec: ARCHITECTURE.md §10.3 ("`/api/status` renders the open incidents, the
 * current ladder level and the credit-ceiling state as JSON; the app renders the
 * same state as a dated banner and the engine renders it as the footer sentence"),
 * USER_JOURNEY.md §0.6 S24 (`/status`, public, no login, **including the published
 * G5 autonomy counters**) and §11.8's published block.
 *
 * THE POINT OF PUTTING IT HERE RATHER THAN IN THE ROUTE. The route is a renderer.
 * If the banner, the footer and the JSON each queried for themselves, they would
 * drift, and the drift would be invisible — three surfaces disagreeing about how
 * stale the corpus is looks exactly like three surfaces agreeing, until a customer
 * screenshots two of them. `readStatus` is the single query set; S24, `/api/status`
 * and the in-app banner all render this one value.
 *
 * TWO THINGS THIS DELIBERATELY PUBLISHES THAT A COMPANY WOULD RATHER NOT.
 *
 *  - `creditCeiling.state = 'binding'` — our own liability cap, in public. §9.4: "a
 *    company that hides its own liability cap is running the same play as a
 *    competitor's silent rate lookup."
 *  - `autonomy` — G5's raw inbound count, before any filter, with the derived bulk
 *    figure beside it rather than instead of it. "If the numbers are small this
 *    costs nothing to publish. If they are not, G5 is the gate that was built to say
 *    so, and a gate that cannot embarrass its owner was never a gate."
 *
 * WHAT IS NOT HERE: an uptime percentage, a response-time figure, an "all systems
 * operational" banner. Every number on this page is one the system counted.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import type { CorpusLadderLevel, FreshnessState } from '../../lib/types';
import { systemClock, type Clock } from '../clock';
import { creditCeilingState, stalenessBanner, type CreditCeilingState } from '../billing/credits';
import { Cents } from '../../lib/money';
import { assessFreshness, type FreshnessThresholds } from './freshness';
import { currentCreditIncidentId, currentLadderLevel, openIncidents, type IncidentRow } from './incidents';
import { readGates, gateSentence, type GateReading } from './gates';
import { pendingOutboxCount } from './outbox';
import { unprocessedEventCount } from '../billing/webhook';

export interface StatusLimits extends FreshnessThresholds {
  readonly creditFloorCents: number;
  readonly creditCeilingPct: number;
}

export interface CorpusStatus {
  /** `max(promoted_at)` — the moment the mirror last accepted a snapshot. `null`
   *  before the first promotion, which renders as "no snapshot has been promoted",
   *  never as a date. */
  readonly verifiedAt: Date | null;
  readonly state: FreshnessState | null;
  readonly ageHours: number | null;
  readonly snapshotRef: string | null;
  /** D7, restated on every render: freshness never blocks a filing. */
  readonly blocksFiling: false;
  readonly blocksNewPins: boolean;
  readonly claim: string;
}

export interface WorkerHealth {
  readonly kind: string;
  readonly lastRunAt: Date | null;
  readonly lastOutcome: string | null;
  readonly consecutiveFailures: number;
}

export interface StatusView {
  readonly generatedAt: Date;
  readonly ladderLevel: CorpusLadderLevel;
  readonly incidents: readonly IncidentRow[];
  readonly corpus: CorpusStatus;
  readonly creditCeiling: CreditCeilingState;
  /** The exact sentence the in-app banner renders, generated from the POSTED
   *  credit and from nothing else, or `null` when there is nothing to narrow. */
  readonly banner: string | null;
  readonly gates: readonly {
    readonly reading: GateReading;
    readonly mechanism: string;
    readonly outcome: string | null;
  }[];
  readonly jobs: readonly WorkerHealth[];
  readonly queue: {
    readonly pendingEmails: number;
    readonly unprocessedStripeEvents: number;
  };
  /** §5.5 — the MEASURED oldest restorable timestamp the deletion screen quotes.
   *  `null` means `backup.verify` has not run, and the screen says that rather than
   *  quoting a vendor's undocumented number. */
  readonly oldestRestorableAt: Date | null;
}

export async function readStatus(
  db: Db,
  limits: StatusLimits,
  clock: Clock = systemClock,
): Promise<StatusView> {
  const now = clock.now();

  const corpusRow = rowsOf<{ promoted_at: string | Date | null; snapshot_ref: string | null }>(
    await db.execute(sql`
      SELECT promoted_at, snapshot_ref FROM corpus_snapshot
       WHERE state = 'promoted' ORDER BY promoted_at DESC LIMIT 1
    `),
  )[0];

  const verifiedAt = corpusRow?.promoted_at ? new Date(corpusRow.promoted_at) : null;
  const verdict =
    verifiedAt === null
      ? null
      : assessFreshness({
          verifiedAt,
          now,
          thresholds: { datedHours: limits.datedHours, slaHours: limits.slaHours },
        });

  const incidentId = await currentCreditIncidentId(db);
  const ceiling = await creditCeilingState(db, incidentId, {
    floorCents: limits.creditFloorCents,
    ceilingPct: limits.creditCeilingPct,
  });

  return {
    generatedAt: now,
    ladderLevel: await currentLadderLevel(db),
    incidents: await openIncidents(db),
    corpus: {
      verifiedAt,
      state: verdict?.state ?? null,
      ageHours: verdict === null ? null : Math.round(verdict.ageHours * 100) / 100,
      snapshotRef: corpusRow?.snapshot_ref ?? null,
      blocksFiling: false,
      blocksNewPins: verdict?.blocksNewPins ?? false,
      claim:
        verdict?.claim ??
        'No corpus snapshot has been promoted yet, so there is no newer-revision check to date.',
    },
    creditCeiling: ceiling,
    // The banner's only money input is the POSTED ledger figure. There is no code
    // path here from an intended credit to a customer's screen (§10.3).
    banner:
      verdict !== null && verdict.state === 'STALE'
        ? stalenessBanner({ verifiedAt: verdict.verifiedAt, postedCents: Cents.of(ceiling.postedCents) })
        : null,
    gates: (await readGates(db, clock)).map((reading) => ({ reading, ...gateSentence(reading) })),
    jobs: await workerHealth(db),
    queue: {
      pendingEmails: await pendingOutboxCount(db),
      unprocessedStripeEvents: await unprocessedEventCount(db),
    },
    oldestRestorableAt: await oldestRestorableAt(db),
  };
}

/**
 * Per-job health, from the run ledger.
 *
 * `consecutiveFailures` is the only "alarming" number on the page and it still does
 * not page anybody: a job that fails repeatedly leaves the mirror where it is, which
 * ages the freshness clock, which narrows the claim and starts a credit. The
 * degradation is the response (I7); this counter exists so a customer can see it
 * happening rather than infer it from a stale footer.
 */
export async function workerHealth(db: Db | Tx): Promise<readonly WorkerHealth[]> {
  const rows = rowsOf<{
    kind: string;
    last_run_at: string | Date | null;
    last_outcome: string | null;
    consecutive_failures: number | string;
  }>(
    await db.execute(sql`
      WITH ranked AS (
        SELECT kind, started_at, outcome,
               row_number() OVER (PARTITION BY kind ORDER BY started_at DESC) AS rn
          FROM job_runs
      )
      SELECT r.kind,
             MAX(r.started_at) FILTER (WHERE r.rn = 1) AS last_run_at,
             MAX(r.outcome)    FILTER (WHERE r.rn = 1) AS last_outcome,
             COALESCE(
               (SELECT COUNT(*)::int FROM ranked f
                 WHERE f.kind = r.kind
                   AND f.rn <= COALESCE((SELECT MIN(g.rn) FROM ranked g
                                          WHERE g.kind = r.kind AND g.outcome = 'ok'), 1000000) - 1
                   AND f.outcome = 'failed_closed'), 0) AS consecutive_failures
        FROM ranked r
       GROUP BY r.kind
       ORDER BY r.kind
    `),
  );
  return rows.map((row) => ({
    kind: row.kind,
    lastRunAt: row.last_run_at === null ? null : new Date(row.last_run_at),
    lastOutcome: row.last_outcome,
    consecutiveFailures: Number(row.consecutive_failures),
  }));
}

export async function oldestRestorableAt(db: Db | Tx): Promise<Date | null> {
  const row = rowsOf<{ oldest_restorable_at: string | Date | null }>(
    await db.execute(sql`
      SELECT oldest_restorable_at FROM backup_verifications
       WHERE restored AND oldest_restorable_at IS NOT NULL
       ORDER BY at DESC LIMIT 1
    `),
  )[0];
  return row?.oldest_restorable_at ? new Date(row.oldest_restorable_at) : null;
}

/**
 * The sentence the deletion screen quotes for the backup window.
 *
 * §5.5 is explicit that we do not assert a vendor number: Fly's Managed Postgres
 * advertises "automatic backups and recovery" without publishing a retention figure,
 * and "the only public figure is a community forum post asserting a 10-day window,
 * which is not a source we will make a privacy promise on." So this function returns
 * the measured timestamp or says it has not been measured. It never returns a
 * default.
 */
export function backupWindowSentence(oldest: Date | null): string {
  if (oldest === null) {
    return (
      'We have not yet measured how far back our database backups reach, so we do not ' +
      'state a number here. What we do state is enforced rather than promised: the ' +
      'per-account encryption key is destroyed at deletion, so Social Security numbers ' +
      'in any backup are permanently undecryptable.'
    );
  }
  return (
    `Our oldest restorable database backup, measured on the last verification run, is ` +
    `from ${oldest.toISOString().slice(0, 10)}. Backups roll forward past a deletion ` +
    `rather than being edited. The per-account encryption key is destroyed at deletion, ` +
    `so Social Security numbers in any backup are permanently undecryptable.`
  );
}
