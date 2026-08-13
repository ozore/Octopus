/**
 * THE JOB REGISTRY — every scheduled thing this company does, in one array.
 *
 * Spec: ARCHITECTURE.md §7.1 (the schedule table), §8 (fail-closed rules), §9.2/§9.4
 * (dunning and credits), §10.1 (I7 — every signal terminates in an automatic
 * response), §5.5 (deletion), USER_JOURNEY §11.8 (G5).
 *
 * ===========================================================================
 * WHAT A JOB DEFINITION IS OBLIGED TO DECLARE
 *
 * Four fields, and each one closes a specific way an unattended system rots:
 *
 *   `schedule`        — a SLOT, not a timer (see `schedule.ts`). The slot name is
 *                       the idempotency key, so scheduling is idempotent by
 *                       construction rather than by care.
 *   `failsClosedBy`   — the sentence from §7.1's "fails closed by" column, in the
 *                       code, next to the handler it describes. A job whose author
 *                       cannot write this sentence has not decided what happens when
 *                       it fails, which means what happens is whatever the bug does.
 *   `signalOnFailure` — a `Signal` from the closed union in `ops/response.ts`, or
 *                       `null` where failure is genuinely inert. Because `respond`
 *                       is total, declaring a signal picks one of exactly four
 *                       automatic responses; there is no fifth that means "tell
 *                       somebody".
 *   `run`             — the handler, returning what it decided. It never returns a
 *                       verdict about its own health; the ledger row does that.
 *
 * ===========================================================================
 * WHAT IS DELIBERATELY NOT A SEPARATE JOB
 *
 * §7.1 lists `ingest.sam.document` and `promote.snapshot` as rows of their own.
 * They are STAGES of `runIngest` here, not queue entries, because §7.2's whole
 * argument is that promotion must be a single transaction — "there is no window in
 * which half a snapshot is readable" — and two claimable jobs is precisely such a
 * window. `CORPUS_DESIGN.md` §9 owns the staged machine (OPEN → INDEXED → FETCHED →
 * PARSED → RECONCILED → CANARIED → PROMOTED) and it runs inside one call. The
 * separation §7.2 asks for is real and it is between STAGING and PROMOTION inside
 * that machine, not between two rows of this table.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../db';
import type { Config } from '../lib/config';
import { Cents } from '../lib/money';
import type { Clock } from '../platform/clock';
import { addDays } from '../platform/clock';
import { listBillingAccounts, readBillingAccount } from '../platform/billing/account';
import { stripePriceFor } from '../platform/billing/catalog';
import { issueStalenessCredits } from '../platform/billing/credits';
import { reconcileDunning } from '../platform/billing/dunning';
import type { StripeGateway } from '../platform/billing/gateway';
import { enforceOverageCap } from '../platform/billing/meter';
import { replayStripeEvents } from '../platform/billing/webhook';
import { assessFreshness } from '../platform/ops/freshness';
import { recordCanaryRun, recordReconciliation, refreshClaimGates } from '../platform/ops/gates';
import { closeIncident, currentCreditIncidentId, openIncident } from '../platform/ops/incidents';
import { ensurePublishedAddresses } from '../platform/ops/inbound';
import { drainOutbox, type Mailer } from '../platform/ops/outbox';
import type { ExportSink } from '../platform/account/export';
import { buildExport } from '../platform/account/export';
import { dueDeletions, executeAccountDeletion } from '../platform/account/deletion';
import { inDirCycleWindow, type Schedule } from './schedule';

// ===========================================================================
// Ports — every upstream is injected, so the whole registry runs offline
// ===========================================================================

export interface EcfrSectionVersion {
  readonly part: string;
  readonly section: string;
  /** ISO date, as eCFR reports it. */
  readonly amendmentDate: string;
}

/** The three watched values §7.1 names, read out of the fetched text. A source that
 *  cannot report one returns `null` for it — a missing observation is not a change. */
export interface WatchedConstants {
  readonly cwhssaThresholdCents: number | null;
  readonly liquidatedDamagesCents: number | null;
  /** 3.5's lettered paragraphs — currently ten, (a)–(j). The `DeductionCategory`
   *  enum is generated against this set, so a new (k) FAILS THE BUILD rather than
   *  silently blocking lines. */
  readonly cfr35Paragraphs: readonly string[] | null;
}

export interface UpstreamProbes {
  /** `versions/title-29.json?part=1,3,5`. */
  ecfrVersions(): Promise<{
    readonly sections: readonly EcfrSectionVersion[];
    readonly constants: WatchedConstants;
    readonly sourceUrl: string;
  }>;
  /** The DIR XSD's sha256, lowercase hex. */
  dirXsdSha256(): Promise<string>;
  /** The WH-347 page and PDF, hashed together. */
  whdFormSha256(): Promise<string>;
}

export interface BackupVerifier {
  /** Restore the newest backup into a scratch database, run the row-count and
   *  canary-subset check, and report the oldest restorable timestamp — the measured
   *  number §5.5's deletion screen quotes. */
  verify(): Promise<{
    readonly restored: boolean;
    readonly oldestRestorableAt: Date | null;
    readonly rowsChecked: number;
    readonly canarySubsetPass: boolean;
  }>;
}

export interface RetentionStore {
  /** Delete stored objects past a clock, returning how many went. Counts, never
   *  identities (§7.1's `retention.sweep` row). */
  purgeBefore(input: { readonly prefix: string; readonly before: Date }): Promise<number>;
}

export interface CanarySuiteVerdict {
  readonly pass: boolean;
  readonly total: number;
  readonly passed: number;
  readonly distinctWds: number;
  readonly distinctStates: number;
  readonly firstDivergence: Readonly<Record<string, unknown>> | null;
  /** Coverage shortfalls fail CI; they do not block promotion. `ENGINE.md` §27:
   *  COVERAGE_SHORTFALL → "Fail CI. The suite may not silently shrink." */
  readonly coverageShortfalls: readonly string[];
}

export interface IngestOutcome {
  readonly snapshotId: number;
  readonly state: 'promoted' | 'held' | 'frozen';
  readonly newRevisions: number;
  readonly blockingVariances: number;
  readonly quarantined: number;
  readonly holdReason: string | null;
  readonly ourActiveCount: number;
  readonly indexTotalActive: number;
}

export interface WorkerDeps {
  readonly db: Db;
  readonly clock: Clock;
  readonly config: Config;
  readonly stripe: StripeGateway;
  readonly mailer: Mailer;
  readonly canary: () => Promise<CanarySuiteVerdict>;
  /** `null` when no upstream is configured — in the offline suite, and in any
   *  environment where `ADAPTER_MODE=mock`. A job with no source does not invent
   *  one; it reports that it did not run, which is the same customer-visible
   *  outcome as a source that was down. */
  readonly ingest: (() => Promise<IngestOutcome>) | null;
  readonly probes: UpstreamProbes | null;
  readonly backups: BackupVerifier | null;
  readonly retention: RetentionStore | null;
  readonly exportSink: ExportSink;
  readonly buildSha: string;
}

export interface JobContext {
  readonly deps: WorkerDeps;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface JobResult {
  /** False when the job legitimately did nothing — no upstream configured, no rows
   *  due. Recorded, so "it ran and found nothing" and "it could not run" are
   *  different rows in the ledger rather than the same silence. */
  readonly performed: boolean;
  readonly detail: Readonly<Record<string, unknown>>;
}

import type { Signal } from '../platform/ops/response';

export interface JobDefinition {
  readonly kind: string;
  readonly schedule: Schedule;
  /** §7.1's "Does" column, in one line. */
  readonly does: string;
  /** §7.1's "Fails closed by" column, verbatim in spirit. */
  readonly failsClosedBy: string;
  /** The probes this job's failure is observable through (§8.2). */
  readonly probes: readonly string[];
  /** What an unhandled failure signals, or `null` where failure is inert. */
  readonly signalOnFailure: Signal | null;
  run(ctx: JobContext): Promise<JobResult>;
}

// ===========================================================================
// The jobs
// ===========================================================================

/**
 * §7.1 `ingest.sam.index` + `ingest.sam.document` + `promote.snapshot`, as the one
 * staged run §7.2 requires them to be.
 *
 * FAILS CLOSED BY DOING NOTHING. The mirror is unchanged, `corpus_verified_at` does
 * not move, and — this is the part that is easy to get backwards — the freshness
 * clock KEEPS RUNNING. A job that fails every night for four nights must produce the
 * same customer-visible outcome as a job that never ran, or the staleness guarantee
 * is a lie. So there is no "retry until it works" that hides the lapse: the banner
 * ages, the claim narrows, and the credit accrues.
 */
const ingestCorpusNightly: JobDefinition = {
  kind: 'ingest.corpus.nightly',
  schedule: { kind: 'daily', hourEt: 2, minuteEt: 0 },
  does: 'One index request at size=5000, document fetch for the delta, parse, reconcile, canary, promote.',
  failsClosedBy: 'HOLD: the mirror is unchanged and the freshness clock keeps running.',
  probes: ['P1', 'P2', 'P3', 'P4', 'P5', 'P8', 'P9'],
  // A failed ingest raises no signal of its own: the response is the freshness
  // ladder, which is driven by the ABSENCE of a promotion rather than by an error.
  signalOnFailure: null,
  async run({ deps }) {
    if (!deps.ingest) {
      return { performed: false, detail: { reason: 'no_upstream_configured' } };
    }
    const outcome = await deps.ingest();

    // G3's counter, written on every run whether or not the snapshot promoted —
    // reconciliation is an observation, and an observation we only record when it
    // is flattering is not a gate.
    const reconciliation = await recordReconciliation(
      deps.db,
      {
        snapshotId: outcome.snapshotId,
        ourActiveCount: outcome.ourActiveCount,
        indexTotalActive: outcome.indexTotalActive,
      },
      deps.clock,
    );

    if (outcome.state === 'frozen') {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'index_count_delta' },
          level: 'L5_RELEASE_FROZEN',
          scope: 'snapshot',
          cause: outcome.holdReason ?? 'ingest froze the product',
          detail: { snapshot_id: outcome.snapshotId, delta_pct: reconciliation.deltaPct },
        },
        deps.clock,
      );
    } else if (outcome.state === 'promoted') {
      await closeIncident(deps.db, { scope: 'snapshot', cause: 'corpus verification has not completed' }, deps.clock);
    }

    return {
      performed: true,
      detail: {
        snapshot_id: outcome.snapshotId,
        state: outcome.state,
        new_revisions: outcome.newRevisions,
        quarantined: outcome.quarantined,
        blocking_variances: outcome.blockingVariances,
        hold_reason: outcome.holdReason,
        delta_pct: reconciliation.deltaPct,
        reconciliation_verdict: reconciliation.verdict,
      },
    };
  },
};

/**
 * §7.1 `canary.golden`. G1's gate, and the only signal that rolls a release back.
 *
 * THE TWO GATES ARE DIFFERENT AND THE DIFFERENCE IS DELIBERATE:
 *   - EXACT MATCH gates promotion and the build. Anything other than 100% is L5.
 *   - COVERAGE gates CI only. `ENGINE.md` §27 assigns COVERAGE_SHORTFALL to "fail
 *     CI; the suite may not silently shrink", and treating a shortfall as a
 *     production freeze would freeze the product on the honest fact that the
 *     ≥500-line suite cannot exist before the corpus does.
 */
const canaryGolden: JobDefinition = {
  kind: 'canary.golden',
  schedule: { kind: 'daily', hourEt: 3, minuteEt: 0 },
  does: 'Re-score the golden payroll suite and write G1\'s counter.',
  failsClosedBy: '100% exact match required; anything else blocks index promotion and the build (L5).',
  probes: ['P8'],
  signalOnFailure: { kind: 'canary_red' },
  async run({ deps, payload }) {
    const trigger = ((): 'ci' | 'pre_promotion' | 'post_deploy' => {
      const value = payload['trigger'];
      return value === 'ci' || value === 'pre_promotion' || value === 'post_deploy' ? value : 'ci';
    })();

    const verdict = await deps.canary();
    const run = await recordCanaryRun(
      deps.db,
      {
        buildSha: deps.buildSha,
        corpusSnapshotId: null,
        trigger,
        total: verdict.total,
        passed: verdict.passed,
        distinctWds: verdict.distinctWds,
        distinctStates: verdict.distinctStates,
        firstDivergence: verdict.firstDivergence,
      },
      deps.clock,
    );

    if (!run.green) {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'canary_red' },
          level: 'L5_RELEASE_FROZEN',
          scope: trigger === 'post_deploy' ? 'release' : 'snapshot',
          cause: 'golden canary is not 100% exact match',
          detail: { trigger, total: verdict.total, passed: verdict.passed, first: verdict.firstDivergence },
        },
        deps.clock,
      );
    } else {
      await closeIncident(
        deps.db,
        { scope: trigger === 'post_deploy' ? 'release' : 'snapshot', cause: 'golden canary is not 100% exact match' },
        deps.clock,
      );
    }

    return {
      performed: true,
      detail: {
        canary_run_id: run.id,
        green: run.green,
        trigger,
        coverage_shortfalls: verdict.coverageShortfalls,
      },
    };
  },
};

/** §7.1 `ingest.ecfr`, Mondays 03:00 ET. Diff-only: it NEVER changes arithmetic. */
const ingestEcfr: JobDefinition = {
  kind: 'ingest.ecfr',
  schedule: { kind: 'weekly', weekdayEt: 1, hourEt: 3, minuteEt: 0 },
  does: 'Diff 29 CFR Parts 1, 3 and 5 section amendment dates and the three watched values.',
  failsClosedBy:
    'Diff-only; never changes arithmetic automatically. A new lettered paragraph in 3.5 fails the build rather than silently blocking lines.',
  probes: ['P7'],
  signalOnFailure: null,
  async run({ deps }) {
    if (!deps.probes) return { performed: false, detail: { reason: 'no_upstream_configured' } };
    const observed = await deps.probes.ecfrVersions();

    let newSections = 0;
    for (const section of observed.sections) {
      const inserted = await deps.db.execute(sql`
        INSERT INTO obligation_changelog (cfr_title, part, section, amendment_date, observed_at, source_url)
        VALUES (29, ${section.part}, ${section.section}, ${section.amendmentDate}::date,
                ${deps.clock.now().toISOString()}::timestamptz, ${observed.sourceUrl})
        ON CONFLICT (cfr_title, part, section, amendment_date) DO NOTHING
        RETURNING change_id
      `);
      if (rowsOf(inserted).length > 0) newSections += 1;
    }

    const today = deps.clock.now().toISOString().slice(0, 10);
    const constants: readonly { key: string; cents: number | null; text: string | null }[] = [
      { key: 'cwhssa_threshold_cents', cents: observed.constants.cwhssaThresholdCents, text: null },
      { key: 'liquidated_damages_cents', cents: observed.constants.liquidatedDamagesCents, text: null },
      {
        key: 'cfr_3_5_paragraphs',
        cents: null,
        text: observed.constants.cfr35Paragraphs?.join(',') ?? null,
      },
    ];
    let newConstants = 0;
    for (const constant of constants) {
      if (constant.cents === null && constant.text === null) continue;
      const inserted = await deps.db.execute(sql`
        INSERT INTO regulatory_constant (key, effective_from, value_cents, value_text, source_url, observed_at)
        VALUES (${constant.key}, ${today}::date, ${constant.cents}, ${constant.text},
                ${observed.sourceUrl}, ${deps.clock.now().toISOString()}::timestamptz)
        ON CONFLICT (key, effective_from) DO NOTHING
        RETURNING key
      `);
      if (rowsOf(inserted).length > 0) newConstants += 1;
    }

    // The one thing this job may block on: a paragraph that is not in the set the
    // DeductionCategory enum was generated against. It does not guess a category and
    // it does not drop the deduction; it refuses to record a silent extension.
    const paragraphs = observed.constants.cfr35Paragraphs;
    const expected = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const unexpected =
      paragraphs === null ? [] : paragraphs.filter((p) => !expected.includes(p.toLowerCase()));
    if (unexpected.length > 0) {
      throw new Error(
        `29 CFR 3.5 has gained paragraph(s) ${unexpected.join(', ')}. The DeductionCategory enum is ` +
          'generated against the ten lettered paragraphs (a)-(j); a new one must extend the enum ' +
          'deliberately rather than arrive as an UNMAPPED_DEDUCTION on somebody\'s filing.',
      );
    }

    return {
      performed: true,
      detail: {
        sections_seen: observed.sections.length,
        new_sections: newSections,
        new_constants: newConstants,
      },
    };
  },
};

/**
 * §7.1 `ingest.dir.xsd`. Weekly, and DAILY within ±14 days of the DIR's two
 * publication cycle dates.
 *
 * FAILS CLOSED AT L4: a hash mismatch blocks CA eCPR generation and NOTHING ELSE.
 * The WH-347 PDF and every federal path are untouched, because a California schema
 * change is not evidence about a federal form (ADR-009, §8.1).
 */
const ingestDirXsd: JobDefinition = {
  kind: 'ingest.dir.xsd',
  schedule: { kind: 'weekly', weekdayEt: 2, hourEt: 3, minuteEt: 30 },
  does: 'Fetch the CA DIR eCPR XSD and compare it to the pinned sha256.',
  failsClosedBy: 'Mismatch → L4: CA XML generation blocked and the hash diff shown. Federal paths untouched.',
  probes: ['P6'],
  signalOnFailure: { kind: 'xsd_hash_mismatch' },
  async run({ deps }) {
    if (!deps.probes) return { performed: false, detail: { reason: 'no_upstream_configured' } };
    const observed = await deps.probes.dirXsdSha256();
    const pinned = deps.config.DIR_XSD_SHA256;
    const matches = observed.toLowerCase() === pinned.toLowerCase();

    if (!matches) {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'xsd_hash_mismatch' },
          level: 'L4_XML_BLOCKED',
          scope: 'product',
          cause: 'the CA DIR eCPR schema hash does not match the pinned value',
          detail: { pinned, observed },
        },
        deps.clock,
      );
    } else {
      await closeIncident(
        deps.db,
        { scope: 'product', cause: 'the CA DIR eCPR schema hash does not match the pinned value' },
        deps.clock,
      );
    }
    return {
      performed: true,
      detail: { matches, observed, in_cycle_window: inDirCycleWindow(deps.clock.now()) },
    };
  },
};

/** §7.1 `ingest.whd.form`. A changed form is an incident and a changelog entry; it
 *  NEVER regenerates a filed artifact (ADR-013 — artifacts are immutable). */
const ingestWhdForm: JobDefinition = {
  kind: 'ingest.whd.form',
  schedule: { kind: 'weekly', weekdayEt: 3, hourEt: 3, minuteEt: 30 },
  does: 'Hash the WH-347 page and PDF and compare to the last observation.',
  failsClosedBy: 'Change → incident and layout-flag review; never regenerates a filed artifact.',
  probes: ['P7'],
  signalOnFailure: null,
  async run({ deps }) {
    if (!deps.probes) return { performed: false, detail: { reason: 'no_upstream_configured' } };
    const observed = await deps.probes.whdFormSha256();
    const previous = rowsOf<{ value_text: string }>(
      await deps.db.execute(sql`
        SELECT value_text FROM regulatory_constant
         WHERE key = 'whd_wh347_sha256' ORDER BY effective_from DESC LIMIT 1
      `),
    )[0]?.value_text;

    const changed = previous !== undefined && previous !== observed;
    if (previous !== observed) {
      await deps.db.execute(sql`
        INSERT INTO regulatory_constant (key, effective_from, value_text, source_url, observed_at)
        VALUES ('whd_wh347_sha256', ${deps.clock.now().toISOString().slice(0, 10)}::date, ${observed},
                ${deps.config.WHD_FORM_URL}, ${deps.clock.now().toISOString()}::timestamptz)
        ON CONFLICT (key, effective_from) DO NOTHING
      `);
    }
    if (changed) {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'wd_quarantine', wdNumber: 'WH-347' },
          level: 'L3_QUARANTINE',
          scope: 'product',
          cause: 'the published WH-347 form changed',
          detail: { previous, observed },
        },
        deps.clock,
      );
    }
    return { performed: true, detail: { changed, observed } };
  },
};

/**
 * §7.1 `freshness.sweep`, hourly. A pure function of timestamps.
 *
 * D7 in one line: this job can move a pin to L2 and it can open a credit incident,
 * and it can never block a filing. `assessFreshness` returns `blocksFiling: false`
 * in every branch and the type says `false` rather than `boolean`.
 */
const freshnessSweep: JobDefinition = {
  kind: 'freshness.sweep',
  schedule: { kind: 'hourly', minute: 5 },
  does: "Advance every pin's ladder level from freshness_checked_at.",
  failsClosedBy: 'Pure function of timestamps. It never blocks a filing.',
  probes: ['P10'],
  signalOnFailure: null,
  async run({ deps }) {
    const thresholds = {
      datedHours: deps.config.FRESHNESS_DATED_HOURS,
      slaHours: deps.config.FRESHNESS_SLA_HOURS,
    };
    const now = deps.clock.now();

    const promoted = rowsOf<{ promoted_at: string | Date }>(
      await deps.db.execute(sql`
        SELECT promoted_at FROM corpus_snapshot WHERE state = 'promoted'
         ORDER BY promoted_at DESC LIMIT 1
      `),
    )[0];

    // Every pin's own state, advanced from the last time WE verified that pin.
    const advanced = rowsOf(
      await deps.db.execute(sql`
        UPDATE wd_pins SET freshness_state = CASE
            WHEN freshness_checked_at IS NULL THEN 'STALE'::freshness_state
            WHEN freshness_checked_at > ${new Date(now.getTime() - thresholds.datedHours * 3_600_000).toISOString()}::timestamptz
              THEN 'FRESH'::freshness_state
            WHEN freshness_checked_at > ${new Date(now.getTime() - thresholds.slaHours * 3_600_000).toISOString()}::timestamptz
              THEN 'DATED'::freshness_state
            ELSE 'STALE'::freshness_state END
         WHERE superseded_by_pin_id IS NULL
         RETURNING id
      `),
    ).length;

    if (!promoted) {
      return { performed: true, detail: { pins_advanced: advanced, corpus: 'never_promoted' } };
    }

    const verdict = assessFreshness({ verifiedAt: new Date(promoted.promoted_at), now, thresholds });
    const cause = 'corpus verification has not completed';

    if (verdict.state === 'STALE') {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'freshness_stale' },
          level: 'L2_STALE',
          scope: 'product',
          cause,
          detail: { verified_at: verdict.verifiedAt.toISOString(), age_hours: Math.round(verdict.ageHours) },
        },
        deps.clock,
      );
    } else {
      await closeIncident(deps.db, { scope: 'product', cause }, deps.clock);
    }

    return {
      performed: true,
      detail: {
        pins_advanced: advanced,
        state: verdict.state,
        ladder: verdict.ladderLevel,
        blocks_filing: verdict.blocksFiling,
        blocks_new_pins: verdict.blocksNewPins,
      },
    };
  },
};

/**
 * §7.1 `billing.credit`, hourly. D7's risk reversal, and the safety valve on our own
 * money.
 *
 * Every accrual writes a ledger row whether or not it posts, so the ceiling is never
 * silent. The credit is per INCIDENT — one budget per staleness event — which is why
 * this job looks up the open credit incident rather than minting a new id per hour.
 */
const billingCredit: JobDefinition = {
  kind: 'billing.credit',
  schedule: { kind: 'hourly', minute: 15 },
  does: 'Accrue and post staleness credits; write a ledger row for every accrual, posted or withheld.',
  failsClosedBy: 'Per-incident ceiling max(CREDIT_FLOOR_CENTS, CREDIT_CEILING_PCT x MRR).',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const incidentId = await currentCreditIncidentId(deps.db);
    if (incidentId === null) return { performed: false, detail: { reason: 'no_open_credit_incident' } };

    const incident = rowsOf<{ opened_at: string | Date }>(
      await deps.db.execute(sql`SELECT opened_at FROM incidents WHERE id = ${incidentId}`),
    )[0];
    if (!incident) return { performed: false, detail: { reason: 'incident_disappeared' } };

    const result = await issueStalenessCredits(
      deps.db,
      {
        incidentId,
        window: { from: new Date(incident.opened_at), to: deps.clock.now() },
        floorCents: deps.config.CREDIT_FLOOR_CENTS,
        ceilingPct: deps.config.CREDIT_CEILING_PCT,
      },
      { stripe: deps.stripe, clock: deps.clock },
    );

    if (result.ceilingState === 'binding') {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'credit_ceiling_reached' },
          level: 'L2_STALE',
          scope: 'product',
          cause: 'the per-incident credit ceiling is binding',
          detail: {
            incident_id: incidentId,
            posted_cents: result.postedCents,
            withheld_cents: result.withheldCents,
            ceiling_cents: result.ceilingCents,
          },
        },
        deps.clock,
      );
    }

    return {
      performed: true,
      detail: {
        incident_id: incidentId,
        posted_cents: result.postedCents,
        withheld_cents: result.withheldCents,
        ceiling_state: result.ceilingState,
        rows: result.rows.length,
        skipped: result.skipped,
      },
    };
  },
};

/**
 * §7.1 `billing.dunning`, hourly reconcile.
 *
 * Webhooks move the STATUS; time moves the STATE. This job exists because nothing
 * tells us that 72 hours of grace have elapsed except the clock. It writes exactly
 * two kinds of row — an entitlement transition and an outbox message — and it
 * contains no DELETE and no revocation of export.
 */
const billingDunning: JobDefinition = {
  kind: 'billing.dunning',
  schedule: { kind: 'hourly', minute: 20 },
  does: 'Reconcile entitlement transitions against the clock, and queue the three notices.',
  failsClosedBy: 'Never deletes data and never closes the archive.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const result = await reconcileDunning(deps.db, { clock: deps.clock });
    return {
      performed: true,
      detail: { examined: result.examined, transitions: result.transitions.length },
    };
  },
};

/**
 * §9.5's overage cap, run per account on the same hourly beat as dunning.
 *
 * The auto-upgrade is a LOGGED event with a one-click revert, not a silent
 * subscription update, which is why it goes through `recordPlanChange` and why the
 * revert has a row to read.
 */
const billingOverage: JobDefinition = {
  kind: 'billing.overage',
  schedule: { kind: 'hourly', minute: 25 },
  does: 'Assess usage against each plan\'s overage cap and perform the announced auto-upgrade.',
  failsClosedBy: 'No upgrade without a next plan, a price id and a subscription; otherwise the assessment is reported and nothing moves.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const accounts = await listBillingAccounts(deps.db, { withSubscription: true });
    let upgraded = 0;
    let assessed = 0;
    for (const account of accounts) {
      const outcome = await enforceOverageCap(deps.db, account, {
        stripe: deps.stripe,
        clock: deps.clock,
        priceIdFor: (planId) => stripePriceFor(planId, deps.config),
      });
      if (outcome.assessment) assessed += 1;
      if (outcome.upgraded) upgraded += 1;
    }
    return { performed: true, detail: { accounts: accounts.length, assessed, upgraded } };
  },
};

/** §7.1 `billing.replay`, daily. What makes a missed webhook a latency problem
 *  rather than a stuck customer. */
const billingReplay: JobDefinition = {
  kind: 'billing.replay',
  schedule: { kind: 'daily', hourEt: 4, minuteEt: 0 },
  does: 'Re-read Stripe /v1/events and replay anything unprocessed.',
  failsClosedBy: 'Idempotent on stripe_events.id and on every effect\'s own key.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const result = await replayStripeEvents(deps.db, {
      stripe: deps.stripe,
      config: deps.config,
      clock: deps.clock,
    });
    return { performed: true, detail: { fetched: result.fetched, processed: result.processed } };
  },
};

/** The outbox drain. Nothing blocks on it, and a stuck message never blocks a
 *  filing. Attempts are capped: an address that bounces is a fact about the world. */
const outboxDrain: JobDefinition = {
  kind: 'outbox.drain',
  schedule: { kind: 'everyMinutes', minutes: 5 },
  does: 'Send queued outbound messages, once each, and record failures on the row.',
  failsClosedBy: 'Attempts capped at five; nothing about a stuck message blocks a filing.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const result = await drainOutbox(deps.db, { mailer: deps.mailer, clock: deps.clock });
    return { performed: true, detail: { sent: result.sent, failed: result.failed } };
  },
};

/**
 * §5.5's execution, hourly so the seven-day window is honoured to the hour rather
 * than to the day.
 *
 * The undo window is checked by `executeAccountDeletion` itself, not here: a job
 * that decided due-ness for itself would be a second implementation of the window,
 * and the window is the promise.
 */
const accountDeletionExecute: JobDefinition = {
  kind: 'account.deletion.execute',
  schedule: { kind: 'hourly', minute: 40 },
  does: 'Execute deletions whose 7-day undo window has closed, and write the erasure report.',
  failsClosedBy:
    'A step that throws leaves executed_at unset, so the account stays scheduled and the next run finishes it. Half a deletion is recoverable; a deletion marked complete that was not is permanent.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    const due = await dueDeletions(deps.db, deps.clock.now());
    let executed = 0;
    for (const account of due) {
      const result = await executeAccountDeletion(deps.db, account, {
        stripe: deps.stripe,
        clock: deps.clock,
      });
      if (result.ok) executed += 1;
    }
    return { performed: due.length > 0, detail: { due: due.length, executed } };
  },
};

/**
 * §7.1 `retention.sweep`, daily. Every row of §5.4, enforced.
 *
 * "Deletes are idempotent and logged as COUNTS, never as identities. A sweep that
 * cannot complete opens an incident and retries; it never skips a class silently."
 * Hence the per-class result object: a class that could not be swept is reported BY
 * NAME with its count, and the job throws rather than returning a partial success
 * that reads as a clean sweep.
 */
const retentionSweep: JobDefinition = {
  kind: 'retention.sweep',
  schedule: { kind: 'daily', hourEt: 5, minuteEt: 0 },
  does: 'Purge SSN ciphertext and PII-class objects past their 30-day clock, raw CSVs past 90 days, free-generator inputs past 24 hours.',
  failsClosedBy: 'A class that cannot be swept is reported by name, never skipped silently.',
  probes: ['P14'],
  signalOnFailure: null,
  async run({ deps }) {
    const now = deps.clock.now();
    const counts: Record<string, number> = {};

    // §5.4: `workers.ssn_ciphertext` is purged 30 days after export-on-cancel. The
    // ciphertext goes; `ssn_last4` stays on the three-year clock because it is the
    // number the federal rule requires on the transmittal.
    counts['ssn_ciphertext'] = rowsOf(
      await deps.db.execute(sql`
        UPDATE workers w
           SET ssn_ciphertext = NULL, ssn_purged_at = ${now.toISOString()}::timestamptz
          FROM accounts a
         WHERE a.id = w.account_id
           AND w.ssn_ciphertext IS NOT NULL
           AND a.status IN ('cancelled', 'deleted')
           AND a.deletion_requested_at IS NOT NULL
           AND a.deletion_requested_at < ${addDays(now, -30).toISOString()}::timestamptz
         RETURNING w.id
      `),
    ).length;

    if (deps.retention) {
      counts['ecpr_objects'] = await deps.retention.purgeBefore({
        prefix: 'pii/ecpr/',
        before: addDays(now, -30),
      });
      counts['raw_csv'] = await deps.retention.purgeBefore({
        prefix: 'payroll/raw/',
        before: addDays(now, -90),
      });
      counts['free_generator'] = await deps.retention.purgeBefore({
        prefix: 'free/',
        before: new Date(now.getTime() - 86_400_000),
      });
    }

    return { performed: true, detail: { counts, object_store: deps.retention !== null } };
  },
};

/** §7.1 `backup.verify`, daily. "A backup that has never been restored is a
 *  hypothesis, and a retention number that has never been measured is a marketing
 *  claim." The measured oldest-restorable timestamp is what the deletion screen
 *  quotes — see `backupWindowSentence`. */
const backupVerify: JobDefinition = {
  kind: 'backup.verify',
  schedule: { kind: 'daily', hourEt: 6, minuteEt: 0 },
  does: 'Restore the newest backup into a scratch database, run a row-count and canary-subset check, record the oldest restorable timestamp.',
  failsClosedBy: 'A failed restore opens an incident and blocks the next schema migration.',
  probes: ['P11'],
  signalOnFailure: null,
  async run({ deps }) {
    if (!deps.backups) return { performed: false, detail: { reason: 'no_backup_verifier_configured' } };
    const result = await deps.backups.verify();
    await deps.db.execute(sql`
      INSERT INTO backup_verifications (at, restored, oldest_restorable_at, rows_checked, canary_subset_pass)
      VALUES (${deps.clock.now().toISOString()}::timestamptz, ${result.restored},
              ${result.oldestRestorableAt?.toISOString() ?? null}::timestamptz,
              ${result.rowsChecked}, ${result.canarySubsetPass})
    `);
    if (!result.restored || !result.canarySubsetPass) {
      await openIncident(
        deps.db,
        {
          signal: { kind: 'index_zero_total' },
          level: 'L3_QUARANTINE',
          scope: 'product',
          cause: 'the daily backup restore did not verify',
          detail: { restored: result.restored, canary_subset_pass: result.canarySubsetPass },
        },
        deps.clock,
      );
    }
    return {
      performed: true,
      detail: {
        restored: result.restored,
        oldest_restorable_at: result.oldestRestorableAt?.toISOString() ?? null,
        canary_subset_pass: result.canarySubsetPass,
      },
    };
  },
};

/**
 * The gate refresh, hourly.
 *
 * It also applies the declared published-address set, because G5's scope is derived
 * from what we publish and the derivation has to be applied somewhere that runs
 * without anybody remembering to run it.
 */
const gatesRefresh: JobDefinition = {
  kind: 'gates.refresh',
  schedule: { kind: 'hourly', minute: 50 },
  does: 'Recompute G1..G6 from their counters into claim_gates, and apply the declared published-address set.',
  failsClosedBy: 'Derived from the counters on every run, so a gate cannot hold a state its evidence does not support.',
  probes: [],
  signalOnFailure: null,
  async run({ deps }) {
    await ensurePublishedAddresses(deps.db);
    const readings = await refreshClaimGates(deps.db, deps.clock);
    return {
      performed: true,
      detail: {
        gates: readings.map((r) => ({ key: r.key, state: r.state, measured: r.measured })),
      },
    };
  },
};

/**
 * The export-on-cancel bundle (§9.1: "export link emailed FIRST").
 *
 * On demand: it is enqueued by the dunning transition and by the deletion request,
 * not by the clock, because there is no daily moment at which somebody's account is
 * cancelled.
 */
const exportBundle: JobDefinition = {
  kind: 'account.export',
  schedule: { kind: 'onDemand' },
  does: 'Build the export bundle for one account and queue the link.',
  failsClosedBy: 'Export is open in every money state; a failure retries and never revokes access.',
  probes: [],
  signalOnFailure: null,
  async run({ deps, payload }) {
    const account = payload['account_id'];
    if (typeof account !== 'string') {
      throw new Error('account.export: payload.account_id is required');
    }
    const bundle = await buildExport(deps.db, account, {
      sink: deps.exportSink,
      clock: deps.clock,
    });
    const billing = await readBillingAccount(deps.db, account);
    return {
      performed: true,
      detail: {
        export_key: bundle.exportKey,
        filings: bundle.filingCount,
        files: bundle.entries.length,
        artifact_bytes: bundle.artifactBytes,
        // Present so the ledger shows the export ran for an account that still has
        // a money row, which is the case §9.1 cares about. Never a dollar figure.
        has_billing_row: billing !== null,
        price_cents: billing ? Cents.of(billing.priceCents) : null,
      },
    };
  },
};

export const JOB_REGISTRY: readonly JobDefinition[] = [
  ingestCorpusNightly,
  canaryGolden,
  ingestEcfr,
  ingestDirXsd,
  ingestWhdForm,
  freshnessSweep,
  billingCredit,
  billingDunning,
  billingOverage,
  billingReplay,
  outboxDrain,
  accountDeletionExecute,
  retentionSweep,
  backupVerify,
  gatesRefresh,
  exportBundle,
] as const;

export function jobByKind(kind: string): JobDefinition | null {
  return JOB_REGISTRY.find((job) => job.kind === kind) ?? null;
}
