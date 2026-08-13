/**
 * G1..G6 — the six gates, as counters rather than as statements.
 *
 * Spec: ARCHITECTURE.md §14 ("where each is instrumented"), CORRECTIONS.md §0.2 and
 * §4 (the four claim families that are forbidden until a counter says otherwise),
 * USER_JOURNEY.md §11.8 (G5's redefinition), the `claim_gates` seed in
 * `drizzle/0000_init.sql` §11.
 *
 * ===========================================================================
 * THE ONE IDEA
 *
 * "All six are counters in the database, not statements in a document. The copy lint
 * that reads them is what makes the gates binding on marketing rather than on
 * intentions."
 *
 * So this module has two halves and no third:
 *
 *   WRITE — `recordCanaryRun`, `recordReconciliation`, `recordFilingDuration`,
 *           `recordAcceptanceConfirmation`, `recordChaosCreditRun`. Each is called
 *           from the one place the evidence is produced, and each one is an INSERT.
 *           None of them takes a verdict as a parameter; the verdict is computed
 *           from the numbers.
 *
 *   READ  — `readGate`, `readGates`, `refreshClaimGates`. `readGates` is the read
 *           model behind the public status page (S24), and `gateSentence` is the
 *           only function in the system permitted to produce a sentence about what
 *           the product achieves. While a gate is `locked` it returns the MECHANISM
 *           sentence — what we do — and declines the outcome sentence (P-D). That is
 *           CORRECTIONS §0.2 implemented as a return type: `outcome` is
 *           `string | null` and it is `null` until the query says otherwise.
 *
 * A measured claim that regresses narrows automatically (P-C): `evaluateGate` is a
 * pure function of the counters and the clock, so a gate that has cleared and stops
 * clearing goes back to `regressed` on the next refresh with nobody deciding.
 */

import { createHash } from 'node:crypto';

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { systemClock, type Clock } from '../clock';
import { payingAccountCount } from '../billing/account';
import { g5Report, type G5Report } from './inbound';

export type GateKey = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6';

export const GATE_KEYS: readonly GateKey[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'] as const;

/** The schema's `gate_state` enum. `regressed` is what makes P-C automatic. */
export type GateState = 'locked' | 'measuring' | 'unlocked' | 'regressed';

// ===========================================================================
// WRITE — where each counter is written
// ===========================================================================

export interface CanaryRunRecord {
  readonly buildSha: string;
  readonly corpusSnapshotId: number | null;
  readonly trigger: 'ci' | 'pre_promotion' | 'post_deploy';
  readonly total: number;
  readonly passed: number;
  readonly distinctWds: number;
  readonly distinctStates: number;
  readonly firstDivergence: Readonly<Record<string, unknown>> | null;
}

/**
 * G1. `green` is a GENERATED column (`passed = total`), so the row cannot claim to
 * be green while carrying a failure — the database computes the verdict, not the
 * caller.
 */
export async function recordCanaryRun(
  db: Db | Tx,
  run: CanaryRunRecord,
  clock: Clock = systemClock,
): Promise<{ readonly id: number; readonly green: boolean }> {
  const result = await db.execute(sql`
    INSERT INTO canary_runs (at, build_sha, corpus_snapshot_id, trigger, total, passed,
                             distinct_wds, distinct_states, first_divergence)
    VALUES (${clock.now().toISOString()}::timestamptz, ${run.buildSha}, ${run.corpusSnapshotId},
            ${run.trigger}, ${run.total}, ${run.passed}, ${run.distinctWds}, ${run.distinctStates},
            ${run.firstDivergence === null ? null : JSON.stringify(run.firstDivergence)}::jsonb)
    RETURNING id, green
  `);
  const row = rowsOf<{ id: number | string; green: boolean }>(result)[0];
  if (!row) throw new Error('canary_runs: the insert returned no row');
  return { id: Number(row.id), green: row.green };
}

/**
 * G3. `verdict` is derived from the delta against `COUNT_DELTA_CEILING`, and
 * `explained` defaults to false — an unexplained delta is the refusing value, and
 * §5.1's rule is that an added field backfills to the refusing value rather than to
 * the convenient one.
 */
export async function recordReconciliation(
  db: Db | Tx,
  input: {
    readonly snapshotId: number | null;
    readonly ourActiveCount: number;
    readonly indexTotalActive: number;
    readonly ceilingPct?: number;
    readonly explained?: boolean;
  },
  clock: Clock = systemClock,
): Promise<{ readonly deltaPct: number; readonly verdict: 'pass' | 'held' }> {
  const ceiling = input.ceilingPct ?? 0.5;
  const denominator = Math.max(1, input.indexTotalActive);
  const deltaPct =
    Math.round((Math.abs(input.ourActiveCount - input.indexTotalActive) / denominator) * 1_000_000) /
    10_000;
  const verdict: 'pass' | 'held' = deltaPct <= ceiling ? 'pass' : 'held';

  await db.execute(sql`
    INSERT INTO corpus_reconciliation (at, snapshot_id, our_active_count, index_total_active,
                                       delta_pct, explained, verdict)
    VALUES (${clock.now().toISOString()}::timestamptz, ${input.snapshotId}, ${input.ourActiveCount},
            ${input.indexTotalActive}, ${String(deltaPct)}::numeric, ${input.explained ?? false},
            ${verdict})
  `);
  return { deltaPct, verdict };
}

/**
 * G4. Measured upload → download, per filing, once. `real_filing` excludes our own
 * traffic BY FLAG rather than by judgement — the caller says which kind of traffic
 * it is at the moment it produces it, and nobody revisits the question later.
 */
export async function recordFilingDuration(
  db: Db | Tx,
  input: {
    readonly accountId: string;
    readonly filingId: string;
    readonly uploadAt: Date;
    readonly artifactAt: Date;
    readonly realFiling?: boolean;
  },
): Promise<{ readonly recorded: boolean; readonly seconds: number }> {
  const seconds = Math.max(
    0,
    Math.round((input.artifactAt.getTime() - input.uploadAt.getTime()) / 1000),
  );
  const result = await db.execute(sql`
    INSERT INTO filing_durations (account_id, filing_id, upload_at, artifact_at, seconds, real_filing)
    VALUES (${input.accountId}::uuid, ${input.filingId}::uuid,
            ${input.uploadAt.toISOString()}::timestamptz, ${input.artifactAt.toISOString()}::timestamptz,
            ${seconds}, ${input.realFiling ?? true})
    ON CONFLICT (filing_id) DO NOTHING
    RETURNING id
  `);
  return { recorded: rowsOf(result).length > 0, seconds };
}

/**
 * G2. Acceptance is unobservable from inside our system, which is exactly why the
 * gate exists: this row can only come from a customer telling us what a receiving
 * party did. Nothing in the product may infer it.
 */
export async function recordAcceptanceConfirmation(
  db: Db | Tx,
  input: {
    readonly id: string;
    readonly accountId: string;
    readonly filingId: string;
    readonly artifactKind: string;
    readonly receiver: 'gc' | 'agency' | 'dir_portal';
    readonly accepted: boolean;
    readonly rejectionDetail?: string | null;
    readonly confirmedBy?: string | null;
  },
  clock: Clock = systemClock,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO form_acceptance_confirmations (id, account_id, filing_id, artifact_kind, receiver,
                                               accepted, rejection_detail, confirmed_at, confirmed_by)
    VALUES (${input.id}::uuid, ${input.accountId}::uuid, ${input.filingId}::uuid,
            ${input.artifactKind}::artifact_kind, ${input.receiver}, ${input.accepted},
            ${input.rejectionDetail ?? null}, ${clock.now().toISOString()}::timestamptz,
            ${input.confirmedBy ?? null})
    ON CONFLICT (id) DO NOTHING
  `);
}

/**
 * G6. The staleness window a credit was posted against.
 *
 * `staleness_windows` had no writer of any kind, so `readG6`'s join could never
 * return a row and the gate could never leave zero — the same shape as G2 and G4.
 * This is called from the credit path itself, so the evidence is a by-product of the
 * guarantee firing rather than something anyone remembers to record.
 *
 * `chaosTest` marks a DRILL: the same code path, run deliberately against a synthetic
 * incident, which is what §14 requires G6 to be measured on. It is a parameter rather
 * than an inference, because a system that guessed which of its own runs were drills
 * would eventually guess in the flattering direction.
 */
export async function recordStalenessWindow(
  db: Db | Tx,
  input: {
    readonly id: string;
    readonly accountId: string;
    readonly verifiedAt: Date;
    readonly creditId: number | null;
    readonly chaosTest?: boolean;
  },
  clock: Clock = systemClock,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO staleness_windows (id, account_id, verified_at, opened_at, chaos_test, credit_id)
    VALUES (${input.id}::uuid, ${input.accountId}::uuid, ${input.verifiedAt.toISOString()}::timestamptz,
            ${clock.now().toISOString()}::timestamptz, ${input.chaosTest ?? false},
            ${input.creditId})
    ON CONFLICT (id) DO NOTHING
  `);
}

/**
 * G6's writer, named in this module's header since the first commit and never
 * written until now.
 *
 * A chaos run is a credit run: it opens a synthetic staleness window, posts through
 * the real credit path, and records the windows as `chaos_test`. The gate then reads
 * the number of DISTINCT SCALES at which that happened, because §9.4's MED-3
 * correction exists precisely because the ceiling used to bind at the scale where the
 * guarantee first fires — a drill that only ever ran where the ceiling is comfortable
 * has not tested the guarantee.
 */
export async function recordChaosCreditRun(
  db: Db | Tx,
  input: {
    readonly incidentId: number;
    readonly verifiedAt: Date;
    readonly credits: readonly { readonly id: number; readonly accountId: string }[];
  },
  clock: Clock = systemClock,
): Promise<{ readonly windows: number }> {
  let windows = 0;
  for (const credit of input.credits) {
    await recordStalenessWindow(
      db,
      {
        id: windowId(input.incidentId, credit.accountId),
        accountId: credit.accountId,
        verifiedAt: input.verifiedAt,
        creditId: credit.id,
        chaosTest: true,
      },
      clock,
    );
    windows += 1;
  }
  return { windows };
}

/** One window per incident per account, derived so a re-run records one fact. */
export function windowId(incidentId: number, accountId: string): string {
  const digest = createHash('sha256')
    .update(`staleness:${String(incidentId)}:${accountId}`)
    .digest('hex');
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `5${digest.slice(13, 16)}`,
    ((parseInt(digest.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + digest.slice(17, 20),
    digest.slice(20, 32),
  ].join('-');
}

// ===========================================================================
// READ — the model behind the status page, and the sentence permission
// ===========================================================================

export interface GateReading {
  readonly key: GateKey;
  readonly description: string;
  readonly state: GateState;
  /** The number the gate is measured on, in the gate's own unit. `null` when
   *  nothing has been counted — which is NOT zero, and is rendered as "not yet
   *  measured" rather than as a figure. */
  readonly measured: number | null;
  readonly unit: string;
  readonly denominator: number | null;
  readonly windowDays: number | null;
  readonly consecutiveDays: number;
  /** Every threshold this gate must clear, each with its current value, so the
   *  status page can show the shortfall rather than a red dot. */
  readonly thresholds: readonly {
    readonly name: string;
    readonly required: number;
    readonly actual: number;
    readonly met: boolean;
  }[];
}

/**
 * What may be said while the gate is in each state.
 *
 * MECHANISM sentences describe what the system does and are always available — they
 * are statements about our own code, which we can verify by reading it. OUTCOME
 * sentences describe what that achieves, and they are `null` until the counter says
 * otherwise. CORRECTIONS §4 lists the four claim families this shuts: correctness
 * (F-1), acceptance (F-2), coverage (F-3) and outcome (F-4).
 */
export const GATE_MECHANISM: Readonly<Record<GateKey, string>> = {
  G1:
    'Every rate on every filing is re-scored against a golden payroll suite before ' +
    'any corpus update goes live and before any release ships.',
  G2:
    'The California eCPR XML is validated against the pinned DIR schema and carries ' +
    'the schema hash it was validated against.',
  G3:
    'Our active wage-determination count is reconciled against the published index ' +
    'total every night, and a delta above 0.5% holds promotion.',
  G4:
    'The time from payroll-CSV upload to artifact download is measured in-product on ' +
    'every filing.',
  /**
   * G5's mechanism used to say "every address this company publishes", which implies
   * there is at least one. There is not: the A3 lint asserts that no mail address is
   * rendered anywhere on the site, and the rendered-HTML probe confirms it across
   * every public route. A reader who goes looking for the address, finds none, and
   * then reads the `0` as "messages we chose to acknowledge" has been misled by a
   * sentence whose whole purpose was to prove we are not misleading them. So the
   * sentence names the registry instead, which is a fact about our own code.
   */
  G5:
    'Every inbound message at every address in this company’s published-address ' +
    'registry is counted, with a one-minute floor per message and no category called ' +
    '"did not need an answer". The registry is empty today, so the count is of a ' +
    'channel that does not exist yet rather than of messages we chose to acknowledge.',
  /**
   * G6's used to read "…and a service credit accrues automatically" — a promise about
   * a money outcome, in the present indicative, on a public page, while the gate that
   * governs it was LOCKED. `CORRECTIONS.md` §4 F-4 names that string and gates it on
   * G6; `IDEA_DOSSIER.md` D10 G6 requires the auto-credit to fire correctly in a
   * chaos test **before** the guarantee is advertised anywhere. It is now what the
   * other five are — a description of what the code does — and the promise lives in
   * the outcome branch of `gateSentence`, which returns null until the counter says
   * otherwise.
   */
  G6:
    'Staleness beyond the published window is recorded as an incident with a dated ' +
    'window, the claim on the artifact narrows, a dated banner appears, and the credit ' +
    'path is exercised against that incident with its ceiling published beside what it ' +
    'posted.',
} as const;

/**
 * The outcome sentence, and the reason this function exists at all.
 *
 * It takes a `GateReading` — a value that can only come from the counters — and
 * returns `null` unless that value says `unlocked`. There is no parameter that
 * overrides it and no flag that forces it. A renderer that wants to state an
 * outcome has to hold a reading, and a reading has to have come from a query.
 */
export function gateSentence(reading: GateReading): {
  readonly mechanism: string;
  readonly outcome: string | null;
} {
  const mechanism = GATE_MECHANISM[reading.key];
  if (reading.state !== 'unlocked') return { mechanism, outcome: null };

  switch (reading.key) {
    case 'G1':
      return {
        mechanism,
        outcome: `${String(reading.consecutiveDays)} consecutive days green as of today.`,
      };
    case 'G2':
      return {
        mechanism,
        outcome: `${String(reading.measured ?? 0)} artifacts confirmed accepted by their receiving party.`,
      };
    case 'G3':
      return {
        mechanism,
        outcome: `${String(reading.consecutiveDays)} consecutive days with no unexplained delta.`,
      };
    case 'G4':
      return {
        mechanism,
        outcome: `Median ${String(Math.round((reading.measured ?? 0) / 60))} minutes over ${String(reading.denominator ?? 0)} filings.`,
      };
    case 'G5':
      return {
        mechanism,
        outcome:
          `${String(reading.measured ?? 0)} human minutes per customer per month over ` +
          `${String(reading.denominator ?? 0)} paying accounts.`,
      };
    case 'G6':
      return {
        mechanism,
        outcome:
          'The credit path has been exercised end to end in a chaos run at both scales, so a ' +
          'service credit accrues automatically when the corpus goes stale.',
      };
  }
}

const GATE_DESCRIPTION: Readonly<Record<GateKey, string>> = {
  G1: 'Rate correctness — the golden payroll suite, 100% exact match, 30 consecutive green days',
  G2: 'Form acceptance — 50 WH-347 and 25 CA eCPR confirmed accepted by their receiving party',
  G3: 'Corpus completeness — nightly delta against the index total at or under 0.5%, 60 days',
  G4: 'Time saved — measured in-product median from upload to download over 100 real filings',
  G5: 'Autonomy — 90 days below 2 human minutes per customer per month at 50 paying accounts',
  G6: 'Risk reversal — the staleness auto-credit fires correctly in a chaos run at both scales',
} as const;

/** §14's thresholds, in one place, so a gate cannot be cleared by a different number
 *  than the one the document names. */
export const GATE_THRESHOLDS = {
  G1: { consecutiveGreenDays: 30, lines: 500, wds: 25, states: 8 },
  G2: { wh347: 50, ecpr: 25 },
  G3: { cleanDays: 60, deltaCeilingPct: 0.5 },
  G4: { filings: 100 },
  G5: { days: 90, minutesPerCustomerMonth: 2, payingAccounts: 50 },
  G6: { scales: 2 },
} as const;

export async function readGates(db: Db | Tx, clock: Clock = systemClock): Promise<readonly GateReading[]> {
  const readings: GateReading[] = [];
  for (const key of GATE_KEYS) readings.push(await readGate(db, key, clock));
  return readings;
}

export async function readGate(db: Db | Tx, key: GateKey, clock: Clock = systemClock): Promise<GateReading> {
  switch (key) {
    case 'G1':
      return readG1(db, clock);
    case 'G2':
      return readG2(db);
    case 'G3':
      return readG3(db, clock);
    case 'G4':
      return readG4(db);
    case 'G5':
      return readG5(db, clock);
    case 'G6':
      return readG6(db);
  }
}

function assemble(
  key: GateKey,
  input: {
    readonly measured: number | null;
    readonly unit: string;
    readonly denominator: number | null;
    readonly windowDays: number | null;
    readonly consecutiveDays: number;
    readonly thresholds: readonly {
      readonly name: string;
      readonly required: number;
      readonly actual: number;
    }[];
    /** True when the gate has produced at least one measurement. A gate with no
     *  evidence at all is `locked`; a gate with evidence that falls short is
     *  `measuring`; a gate that cleared and stopped clearing is `regressed`. */
    readonly hasEvidence: boolean;
    readonly hadCleared?: boolean;
  },
): GateReading {
  const thresholds = input.thresholds.map((t) => ({ ...t, met: t.actual >= t.required }));
  const cleared = thresholds.every((t) => t.met);
  const state: GateState = cleared
    ? 'unlocked'
    : input.hadCleared === true
      ? 'regressed'
      : input.hasEvidence
        ? 'measuring'
        : 'locked';
  return {
    key,
    description: GATE_DESCRIPTION[key],
    state,
    measured: input.measured,
    unit: input.unit,
    denominator: input.denominator,
    windowDays: input.windowDays,
    consecutiveDays: input.consecutiveDays,
    thresholds,
  };
}

interface CanaryDayRow {
  readonly day: string;
  readonly green: boolean;
  readonly lines: number | string;
  readonly wds: number | string;
  readonly states: number | string;
}

/**
 * CONSECUTIVE MEANS CONSECUTIVE.
 *
 * Both `readG1` and `readG3` used to iterate the day-grouped rows of their evidence
 * table and break only on a BAD day, so a gap counted as a pass: thirty green runs
 * one every thirtieth day, the last of them fifteen months ago, satisfied "30
 * consecutive green days" and released the correctness claim family — while the
 * rendered sentence added "as of today", which was false. A monthly canary would have
 * cleared the gate that stands between this company and a correctness claim on a
 * signed federal certification.
 *
 * So the streak is walked over the CALENDAR from the most recent day that has
 * evidence, and a day with no evidence breaks it exactly as a red day does. The
 * anchor is checked separately: `STREAK_STALE_HOURS` since the last row, or the gate
 * reports a stale instrument and cannot hold itself open on old evidence.
 */
export const STREAK_STALE_HOURS = 48;

function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10);
}

function previousDay(key: string): string {
  return dayKey(new Date(new Date(`${key}T00:00:00Z`).getTime() - 86_400_000));
}

/** Walk back one day at a time from `from`, stopping at the first day the predicate
 *  refuses or has no answer for. */
function calendarStreak(from: string, good: (day: string) => boolean | undefined): number {
  let streak = 0;
  let cursor = from;
  for (let guard = 0; guard < 400; guard += 1) {
    if (good(cursor) !== true) break;
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

function hoursSince(at: Date | null, now: Date): number | null {
  return at === null ? null : (now.getTime() - at.getTime()) / 3_600_000;
}

async function readG1(db: Db | Tx, clock: Clock): Promise<GateReading> {
  const days = rowsOf<CanaryDayRow & { last_at: string | Date }>(
    await db.execute(sql`
      SELECT to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             bool_and(green) AS green,
             MAX(total)::int AS lines,
             MAX(distinct_wds)::int AS wds,
             MAX(distinct_states)::int AS states,
             MAX(at) AS last_at
        FROM canary_runs
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 400
    `),
  );

  const green = new Map(days.map((row) => [row.day, row.green]));
  const latest = days[0];
  const streak = latest === undefined ? 0 : calendarStreak(latest.day, (day) => green.get(day));

  const lines = Number(latest?.lines ?? 0);
  const stale = hoursSince(latest ? new Date(latest.last_at) : null, clock.now());
  const fresh = stale !== null && stale <= STREAK_STALE_HOURS ? 1 : 0;

  return assemble('G1', {
    measured: days.length === 0 ? null : streak,
    unit: 'consecutive green days',
    denominator: days.length === 0 ? null : lines,
    windowDays: GATE_THRESHOLDS.G1.consecutiveGreenDays,
    consecutiveDays: streak,
    hasEvidence: days.length > 0,
    thresholds: [
      { name: 'consecutive green days', required: GATE_THRESHOLDS.G1.consecutiveGreenDays, actual: streak },
      { name: 'payroll lines in the suite', required: GATE_THRESHOLDS.G1.lines, actual: lines },
      { name: 'distinct wage determinations', required: GATE_THRESHOLDS.G1.wds, actual: Number(latest?.wds ?? 0) },
      { name: 'distinct states', required: GATE_THRESHOLDS.G1.states, actual: Number(latest?.states ?? 0) },
      // A stale instrument may not hold a gate open. Expressed as a threshold rather
      // than as a separate flag so the status page shows the shortfall like any other.
      {
        name: `canary run in the last ${String(STREAK_STALE_HOURS)} hours`,
        required: 1,
        actual: fresh,
      },
    ],
  });
}

async function readG2(db: Db | Tx): Promise<GateReading> {
  const row = rowsOf<{ wh347: number | string; ecpr: number | string; total: number | string }>(
    await db.execute(sql`
      SELECT COUNT(*) FILTER (WHERE accepted AND artifact_kind = 'wh347_pdf')::int AS wh347,
             COUNT(*) FILTER (WHERE accepted AND artifact_kind = 'ecpr_xml')::int  AS ecpr,
             COUNT(*)::int AS total
        FROM form_acceptance_confirmations
    `),
  )[0];
  const wh347 = Number(row?.wh347 ?? 0);
  const ecpr = Number(row?.ecpr ?? 0);
  const total = Number(row?.total ?? 0);

  return assemble('G2', {
    measured: total === 0 ? null : wh347 + ecpr,
    unit: 'artifacts confirmed accepted',
    denominator: total === 0 ? null : total,
    windowDays: null,
    consecutiveDays: 0,
    hasEvidence: total > 0,
    thresholds: [
      { name: 'WH-347 accepted', required: GATE_THRESHOLDS.G2.wh347, actual: wh347 },
      { name: 'CA eCPR accepted', required: GATE_THRESHOLDS.G2.ecpr, actual: ecpr },
    ],
  });
}

async function readG3(db: Db | Tx, clock: Clock): Promise<GateReading> {
  const rows = rowsOf<{
    day: string;
    worst: string | number;
    unexplained: boolean;
    last_at: string | Date;
  }>(
    await db.execute(sql`
      SELECT to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             MAX(delta_pct) AS worst,
             bool_or(delta_pct > ${String(GATE_THRESHOLDS.G3.deltaCeilingPct)}::numeric AND NOT explained)
               AS unexplained,
             MAX(at) AS last_at
        FROM corpus_reconciliation
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 400
    `),
  );

  // Same correction as G1: a day with no reconciliation breaks the streak, because
  // "60 days of zero unexplained delta" is a claim about sixty days and not about
  // sixty rows written whenever the job happened to run.
  const clean = new Map(rows.map((row) => [row.day, !row.unexplained]));
  const latest = rows[0];
  const streak = latest === undefined ? 0 : calendarStreak(latest.day, (day) => clean.get(day));
  const stale = hoursSince(latest ? new Date(latest.last_at) : null, clock.now());
  const fresh = stale !== null && stale <= STREAK_STALE_HOURS ? 1 : 0;

  return assemble('G3', {
    measured: rows.length === 0 ? null : Number(rows[0]?.worst ?? 0),
    unit: 'percent delta against the index total',
    denominator: rows.length === 0 ? null : rows.length,
    windowDays: GATE_THRESHOLDS.G3.cleanDays,
    consecutiveDays: streak,
    hasEvidence: rows.length > 0,
    thresholds: [
      { name: 'clean days', required: GATE_THRESHOLDS.G3.cleanDays, actual: streak },
      {
        name: `reconciliation in the last ${String(STREAK_STALE_HOURS)} hours`,
        required: 1,
        actual: fresh,
      },
    ],
  });
}

async function readG4(db: Db | Tx): Promise<GateReading> {
  // MEDIAN, not mean. §14 states the claim shape as "median N minutes over N
  // filings", and a mean over a long tail of abandoned sessions is the number that
  // flatters us. `real_filing` excludes our own traffic by flag.
  const row = rowsOf<{ n: number | string; median: number | string | null }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS n,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds) AS median
        FROM filing_durations WHERE real_filing
    `),
  )[0];
  const n = Number(row?.n ?? 0);

  return assemble('G4', {
    measured: n === 0 || row?.median === null || row?.median === undefined ? null : Number(row.median),
    unit: 'seconds, median upload to download',
    denominator: n === 0 ? null : n,
    windowDays: null,
    consecutiveDays: 0,
    hasEvidence: n > 0,
    thresholds: [{ name: 'real filings measured', required: GATE_THRESHOLDS.G4.filings, actual: n }],
  });
}

export interface G5GateReading extends GateReading {
  readonly report: G5Report;
}

async function readG5(db: Db | Tx, clock: Clock): Promise<G5GateReading> {
  const now = clock.now();
  const from = new Date(now.getTime() - GATE_THRESHOLDS.G5.days * 86_400_000);
  const paying = await payingAccountCount(db);
  const report = await g5Report(db, { from, to: now }, paying);

  /**
   * CONSECUTIVE DAYS UNDER THE CEILING, OVER THE CALENDAR.
   *
   * This used to iterate the rows of a query grouped on `inbound_messages.
   * received_at`, so a day on which NO message arrived produced no row and did not
   * count as a day under the ceiling. The better the product performed the shorter
   * the streak: ninety days at zero minutes with sixty paying accounts returned
   * `consecutiveDays: 0`, and the only way to clear the one gate that exists to prove
   * the zero-human-minutes thesis was to receive at least one message on each of
   * ninety consecutive days. The instrument inverted the incentive it was built to
   * measure.
   *
   * A day is now a day. The series is the calendar, the messages are joined onto it,
   * and a day with no row is a day with zero minutes — which is a day under the
   * ceiling, because it is.
   */
  const daily = rowsOf<{ day: string; minutes: number | string }>(
    await db.execute(sql`
      SELECT to_char(received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             COALESCE(SUM(minutes_charged) FILTER (WHERE classification = 'human'), 0)::int AS minutes
        FROM inbound_messages
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 400
    `),
  );
  const minutesByDay = new Map(daily.map((row) => [row.day, Number(row.minutes)]));
  const streak =
    paying > 0
      ? calendarStreak(dayKey(now), (day) => {
          // A day's contribution to minutes/customer/month is (minutes / accounts) × 30.
          const perCustomerMonth = ((minutesByDay.get(day) ?? 0) / paying) * 30;
          return perCustomerMonth < GATE_THRESHOLDS.G5.minutesPerCustomerMonth;
        })
      : 0;

  const base = assemble('G5', {
    measured: report.minutesPerCustomerPerMonth,
    unit: 'human minutes per customer per month',
    denominator: paying,
    windowDays: GATE_THRESHOLDS.G5.days,
    consecutiveDays: streak,
    // A paying fleet with a silent inbox IS evidence — it is the evidence. Gating
    // `hasEvidence` on inbound traffic alone was the same inversion as the streak.
    hasEvidence: report.inboundTotal > 0 || paying > 0,
    thresholds: [
      { name: 'days under the ceiling', required: GATE_THRESHOLDS.G5.days, actual: streak },
      { name: 'paying accounts', required: GATE_THRESHOLDS.G5.payingAccounts, actual: paying },
    ],
  });
  return { ...base, report };
}

async function readG6(db: Db | Tx): Promise<GateReading> {
  // G6 is the only gate whose evidence is a test rather than traffic: a chaos run
  // that killed the upstream, reached L2, posted a credit and held idempotency on
  // re-run — asserted at BOTH scales, because §9.4's MED-3 correction exists
  // precisely because the ceiling used to bind at the scale where the guarantee
  // first fires.
  const rows = rowsOf<{ incident_id: number | string | null; accounts: number | string }>(
    await db.execute(sql`
      SELECT c.incident_id, COUNT(DISTINCT c.account_id)::int AS accounts
        FROM staleness_windows w
        JOIN credits c ON c.id = w.credit_id
       WHERE w.chaos_test AND c.reason = 'corpus_staleness'
       GROUP BY 1
    `),
  );
  // The two scales §14 names by number: "at >=50 accounts AND at 6 accounts". A run
  // that only ever fired where the ceiling is comfortable has not tested the
  // guarantee, which is the whole of the MED-3 correction.
  const small = rows.some((r) => Number(r.accounts) > 0 && Number(r.accounts) <= 6);
  const large = rows.some((r) => Number(r.accounts) >= 50);
  const scales = (small ? 1 : 0) + (large ? 1 : 0);

  return assemble('G6', {
    measured: rows.length === 0 ? null : scales,
    unit: 'scales at which the credit path posted',
    denominator: rows.length === 0 ? null : rows.length,
    windowDays: null,
    consecutiveDays: 0,
    hasEvidence: rows.length > 0,
    thresholds: [{ name: 'scales exercised', required: GATE_THRESHOLDS.G6.scales, actual: scales }],
  });
}

/**
 * Persist the readings into `claim_gates`, which is the cache the copy renderer and
 * the status page read.
 *
 * Every column is recomputed from the counters on every run, including the state. A
 * gate that cleared and stops clearing is written back as `regressed` here, with no
 * decision taken by anyone — which is P-C (the narrowed claim) applied to marketing
 * copy rather than to an artifact.
 */
export async function refreshClaimGates(
  db: Db | Tx,
  clock: Clock = systemClock,
): Promise<readonly GateReading[]> {
  const readings = await readGates(db, clock);
  const now = clock.now().toISOString();

  for (const reading of readings) {
    const previous = rowsOf<{ state: GateState; unlocked_at: string | null }>(
      await db.execute(sql`SELECT state, unlocked_at FROM claim_gates WHERE gate_key = ${reading.key}`),
    )[0];
    // `previous?.unlocked_at !== null` was TRUE when `previous` was undefined, so a
    // gate with no seeded row computed as `regressed` — inert only because the
    // following UPDATE matched nothing. A seventh gate added to `GATE_KEYS` without a
    // seed row would have silently never appeared on `/status`, which is the one
    // failure a gate ladder may not have.
    const hadCleared =
      previous !== undefined && (previous.state === 'unlocked' || previous.unlocked_at !== null);
    const state: GateState =
      reading.state === 'unlocked' ? 'unlocked' : hadCleared ? 'regressed' : reading.state;

    if (previous === undefined) {
      throw new Error(
        `claim_gates has no row for ${reading.key}. A gate with no row is a gate that never ` +
          'appears on the status page and never blocks a claim, so this is a boot failure rather ' +
          'than a silent absence.',
      );
    }

    await db.execute(sql`
      UPDATE claim_gates
         SET state            = ${state}::gate_state,
             measured_value   = ${reading.measured === null ? null : String(reading.measured)}::numeric,
             denominator      = ${reading.denominator},
             consecutive_days = ${reading.consecutiveDays},
             unlocked_at      = CASE WHEN ${state} = 'unlocked' THEN COALESCE(unlocked_at, ${now}::timestamptz)
                                     ELSE unlocked_at END,
             evidence         = ${JSON.stringify({ unit: reading.unit, thresholds: reading.thresholds })}::jsonb,
             updated_at       = ${now}::timestamptz
       WHERE gate_key = ${reading.key}
    `);
  }
  return readings;
}
