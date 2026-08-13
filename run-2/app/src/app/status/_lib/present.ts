/**
 * S24 — the public status page's read model, formatted.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.6 S24 (`/status`, public, no login, "including
 * the published G5 autonomy counters"), §11.8 (what the autonomy block carries and
 * why the raw total is the denominator of honesty), `ARCHITECTURE.md` §10.3 (one
 * source behind the banner, the footer and the JSON), §4.5 (the ladder).
 *
 * ===========================================================================
 * THE RULE THIS FILE EXISTS TO ENFORCE
 *
 * **Nothing here may round in our favour.** This page is the one surface whose
 * whole purpose is to be checkable by someone who does not trust us, so every
 * derived figure is rounded in the direction that makes Ratepin look WORSE:
 *
 *   - corpus age rounds UP, because a stale mirror is our problem, not the
 *     reader's, and 71.6 hours is not "71 hours";
 *   - the G5 minutes-per-customer ratio rounds UP, because that gate exists to
 *     embarrass its owner and a floor would let it clear a day early;
 *   - the reconciliation delta rounds UP, for the same reason;
 *   - counts are not rounded at all. `inboundTotal` is printed as counted.
 *
 * `roundAgainstUs` is the only rounding function in this module, and it only ever
 * ceilings. There is deliberately no matching `roundForUs`.
 *
 * WHAT IS NOT ON THIS PAGE: an uptime percentage, a response-time figure, an "all
 * systems operational" banner, and — like everywhere else in this product — any
 * address, form or queue that routes a reader to a person.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '@/db';
import type { CorpusLadderLevel } from '@/lib/types';
import { CORPUS_LADDER } from '@/lib/types';
import type { G5Report } from '@/platform/ops/inbound';
import type { GateReading, G5GateReading } from '@/platform/ops/gates';
import type { StatusView } from '@/platform/ops/status';

/**
 * Round to `dp` decimal places, always upward.
 *
 * The direction is the specification, not an implementation detail: every value
 * this function touches is one where a larger number is the less flattering one.
 * A caller that wants a value rounded the other way is a caller that wants this
 * page to be softer than the data, and there is no function here for that.
 */
export function roundAgainstUs(value: number, dp: number): number {
  const scale = 10 ** dp;
  return Math.ceil(value * scale - Number.EPSILON * Math.abs(value) * scale) / scale;
}

/** ISO-8601 to the minute, in UTC, with the zone named. A local timestamp on a
 *  public page is a timestamp two readers disagree about. */
export function stamp(at: Date | null): string | null {
  if (at === null) return null;
  return `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

// ===========================================================================
// The G1 canary's last result — the run itself, not the gate's streak
// ===========================================================================

export interface CanaryLastRun {
  readonly at: Date;
  readonly green: boolean;
  readonly total: number;
  readonly passed: number;
  readonly distinctWds: number;
  readonly distinctStates: number;
  readonly buildSha: string;
  readonly trigger: string;
  /** Present only on a red run. Published, because a divergence we hid would make
   *  every green run on this page worthless. */
  readonly firstDivergence: Readonly<Record<string, unknown>> | null;
}

export async function lastCanaryRun(db: Db): Promise<CanaryLastRun | null> {
  const row = rowsOf<{
    at: string | Date;
    green: boolean;
    total: number | string;
    passed: number | string;
    distinct_wds: number | string;
    distinct_states: number | string;
    build_sha: string;
    trigger: string;
    first_divergence: Record<string, unknown> | null;
  }>(
    await db.execute(sql`
      SELECT at, green, total, passed, distinct_wds, distinct_states, build_sha, trigger,
             first_divergence
        FROM canary_runs ORDER BY at DESC LIMIT 1
    `),
  )[0];
  if (!row) return null;
  return {
    at: new Date(row.at),
    green: row.green,
    total: Number(row.total),
    passed: Number(row.passed),
    distinctWds: Number(row.distinct_wds),
    distinctStates: Number(row.distinct_states),
    buildSha: row.build_sha,
    trigger: row.trigger,
    firstDivergence: row.first_divergence,
  };
}

// ===========================================================================
// The corpus counts — ours against the published index total
// ===========================================================================

export interface CorpusCounts {
  readonly at: Date;
  readonly ourActive: number;
  readonly indexTotalActive: number;
  readonly deltaPct: number;
  readonly explained: boolean;
  readonly verdict: string;
}

export async function corpusCounts(db: Db): Promise<CorpusCounts | null> {
  const row = rowsOf<{
    at: string | Date;
    our_active_count: number | string;
    index_total_active: number | string;
    delta_pct: string | number;
    explained: boolean;
    verdict: string;
  }>(
    await db.execute(sql`
      SELECT at, our_active_count, index_total_active, delta_pct, explained, verdict
        FROM corpus_reconciliation ORDER BY at DESC LIMIT 1
    `),
  )[0];
  if (!row) return null;
  return {
    at: new Date(row.at),
    ourActive: Number(row.our_active_count),
    indexTotalActive: Number(row.index_total_active),
    deltaPct: roundAgainstUs(Number(row.delta_pct), 2),
    explained: row.explained,
    verdict: row.verdict,
  };
}

// ===========================================================================
// Presentation
// ===========================================================================

/** The G5 reading carries its own raw report. Narrowing here rather than at the
 *  call site keeps the cast in one place and typed. */
export function g5ReportOf(reading: GateReading | undefined): G5Report | null {
  if (reading === undefined) return null;
  if (!('report' in reading)) return null;
  return (reading as G5GateReading).report;
}

export interface LadderView {
  readonly level: CorpusLadderLevel;
  readonly trigger: string;
  /** False at every level. D7: a filing on an already-pinned project always
   *  generates, and this page states that as a property rather than a promise. */
  readonly blocksFilingOnPinnedProject: false;
  readonly blocksNewPins: boolean;
  readonly suppressesNewRateAssertions: boolean;
  readonly blocksEcprGeneration: boolean;
  readonly accruesCredit: boolean;
  readonly primitive: string | null;
}

export function ladderView(level: CorpusLadderLevel): LadderView {
  const rule = CORPUS_LADDER[level];
  return {
    level,
    trigger: rule.trigger,
    blocksFilingOnPinnedProject: rule.blocksFilingOnPinnedProject,
    blocksNewPins: rule.blocksNewPins,
    suppressesNewRateAssertions: rule.suppressesNewRateAssertions,
    blocksEcprGeneration: rule.blocksEcprGeneration,
    accruesCredit: rule.accruesCredit,
    primitive: rule.primitive,
  };
}

export interface CorpusView {
  readonly snapshotRef: string | null;
  readonly promotedAt: string | null;
  readonly freshnessState: string;
  /** Rounded UP. */
  readonly ageHours: number | null;
  readonly claim: string;
  readonly blocksFiling: false;
  readonly blocksNewPins: boolean;
}

export function corpusView(status: StatusView): CorpusView {
  return {
    snapshotRef: status.corpus.snapshotRef,
    promotedAt: stamp(status.corpus.verifiedAt),
    // A mirror that has never been promoted says so. "FRESH" would be a claim.
    freshnessState: status.corpus.state ?? 'NEVER PROMOTED',
    ageHours: status.corpus.ageHours === null ? null : roundAgainstUs(status.corpus.ageHours, 2),
    claim: status.corpus.claim,
    blocksFiling: status.corpus.blocksFiling,
    blocksNewPins: status.corpus.blocksNewPins,
  };
}

export interface AutonomyView {
  readonly windowFrom: string;
  readonly windowTo: string;
  /** Every inbound message at every published address, as counted. Never filtered,
   *  never rounded, never our opinion. */
  readonly inboundTotal: number;
  readonly machineClassifiedBulk: number;
  readonly bulkByRule: readonly { readonly rule: string; readonly count: number }[];
  readonly countedAsHuman: number;
  readonly humanMinutes: number;
  readonly payingAccounts: number;
  /** `null` when there are no paying accounts: a ratio with a zero denominator is
   *  not a small number, it is no number, and printing 0.00 would be a claim. */
  readonly minutesPerCustomerPerMonth: number | null;
  readonly daysUnderCeiling: number;
  readonly daysRequired: number | null;
}

export function autonomyView(reading: GateReading | undefined): AutonomyView | null {
  const report = g5ReportOf(reading);
  if (report === null || reading === undefined) return null;
  return {
    windowFrom: report.from.toISOString().slice(0, 10),
    windowTo: report.to.toISOString().slice(0, 10),
    inboundTotal: report.inboundTotal,
    machineClassifiedBulk: report.machineClassifiedBulk,
    bulkByRule: report.bulkByRule,
    countedAsHuman: report.countedAsHuman,
    humanMinutes: report.humanMinutes,
    payingAccounts: report.payingAccounts,
    minutesPerCustomerPerMonth:
      report.minutesPerCustomerPerMonth === null
        ? null
        : roundAgainstUs(report.minutesPerCustomerPerMonth, 2),
    daysUnderCeiling: reading.consecutiveDays,
    daysRequired: reading.windowDays,
  };
}

export interface CanaryView {
  readonly at: string;
  readonly green: boolean;
  readonly passed: number;
  readonly total: number;
  readonly distinctWds: number;
  readonly distinctStates: number;
  readonly buildSha: string;
  readonly trigger: string;
  readonly divergence: string | null;
}

export function canaryView(run: CanaryLastRun | null): CanaryView | null {
  if (run === null) return null;
  return {
    at: stamp(run.at) ?? '',
    green: run.green,
    passed: run.passed,
    total: run.total,
    distinctWds: run.distinctWds,
    distinctStates: run.distinctStates,
    buildSha: run.buildSha,
    trigger: run.trigger,
    divergence: run.firstDivergence === null ? null : JSON.stringify(run.firstDivergence),
  };
}

/** The last successful run of each job, with the failure streak beside it. A job
 *  that is failing does not page anybody — it ages the mirror, which narrows the
 *  claim and starts a credit. This is where a customer can watch that happen. */
export interface JobView {
  readonly kind: string;
  readonly lastRunAt: string | null;
  readonly lastOutcome: string;
  readonly consecutiveFailures: number;
}

export function jobViews(status: StatusView): readonly JobView[] {
  return status.jobs.map((job) => ({
    kind: job.kind,
    lastRunAt: stamp(job.lastRunAt),
    lastOutcome: job.lastOutcome ?? 'no run recorded',
    consecutiveFailures: job.consecutiveFailures,
  }));
}

export const INGEST_JOB_KIND = 'ingest.corpus.nightly';

export function ingestJob(status: StatusView): JobView | null {
  return jobViews(status).find((job) => job.kind === INGEST_JOB_KIND) ?? null;
}
