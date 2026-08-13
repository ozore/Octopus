/**
 * THE ENGINE'S PUBLIC SURFACE.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.2 (the filing engine is an in-process library),
 * §3.9 (`engine/arithmetic/**` may read `domain/**` only and may never import
 * anything with an I/O surface), §3.10 (a CI step walks the TypeScript import graph
 * and fails on any edge in the "may never" column), `ENGINE.md` §14 (the boundary
 * drawn around the two model calls).
 *
 * ===========================================================================
 * WHAT IS NOT IMPORTED HERE, AND WHY THAT IS THE POINT
 *
 * Nothing under this directory reaches the Anthropic adapter, `fetch`, the database
 * or the ingest module. Read `ENGINE.md` §14's diagram for what is ABSENT: there is
 * no edge from any model node into the arithmetic. The only edge out of the ranking
 * path passes through a picker the customer clicks. The narrative model reads the
 * OUTPUT of `deriveStatus` and writes into slots the renderer places; it cannot
 * change the status, the numbers, or whether the signature block appears.
 *
 * Two consequences, both enforced by CI rather than by review:
 *
 *   - A model response cannot be an arithmetic input. `src/engine/arithmetic/**`
 *     may not transitively reach the Anthropic adapter.
 *   - Filing generation makes no network call at all — not to SAM, not to
 *     Anthropic. `src/engine/**` may not transitively reach `fetch`.
 *
 * The second one is why the whole class of "the CSV said to use a different rate"
 * is not a risk we mitigate but a risk we do not have (§1). The payroll CSV is
 * stranger input — a customer's export from a payroll system we do not control,
 * containing free-text titles and deduction labels — and because no path from that
 * text reaches an arithmetic decision, prompt injection cannot move a number. That
 * is a property of the architecture, not of a filter.
 *
 * ===========================================================================
 * HOW A CALLER USES THIS
 *
 *   const rates  = pinnedRateTable({ …resolved from src/mirror/read… });
 *   const result = computeFiling({ week, rates });
 *   const status = deriveStatusForFiling(result, freshnessOf(pin));
 *   const report = buildExceptionReport({ week, computation: result, obligations });
 *
 * Four calls, no I/O, no clock. The renderer formats; it never computes.
 */

export {
  computeFiling,
  computeWorkerWeek,
  straightTimeRatePaid,
  type EngineInput,
} from './arithmetic/week';

export {
  pinnedRateTable,
  assertTableMatchesPin,
  type CorpusValue,
  type DeductionParagraph,
  type ObligationValues,
  type PinnedRateTable,
  type WdRate,
} from './arithmetic/rates';

export {
  PREMIUM_BUCKETS,
  SELF_PRICED,
  type DeductionTotal,
  type FilingComputation,
  type LineComputation,
  type PremiumBucket,
  type StatementOfComplianceBoxes,
  type ViolationFinding,
  type WorkerComputation,
} from './arithmetic/model';

export {
  CWHSSA_THRESHOLD_HOURS,
  dtHours,
  otHours,
  stHours,
  statutoryOtHours,
  totalHours,
} from './arithmetic/hours';

export { baseRate, premiumHoursUnproven, type CwhssaResult, type PreparedLine } from './arithmetic/cwhssa';

export {
  CONDITION_BEARING_CATEGORIES,
  DEDUCTION_ORDER,
  computeDeductions,
  deductionParagraphsMatch,
} from './arithmetic/deductions';

export { col6AStraightTime } from './arithmetic/fringe';

export { premiumBelowStatutory } from './arithmetic/compliance';

export {
  EMPTY_LEDGER,
  roundingResidual,
  type NarrowingLedger,
  type NarrowingRecord,
} from './arithmetic/narrowing';

export { deriveStatus, deriveStatusForFiling, rendersSignatureBlock, type StatusLine } from './status';

export {
  buildExceptionReport,
  explainedBlockReasons,
  workersWithConditionBearingDeductions,
  type ExceptionInput,
} from './exceptions';

export { CITE, QUOTE } from './citations';

/**
 * THE CANARY SUITE — a production artifact, not a test fixture.
 *
 * §24 runs the same cases in three places and only one of them is a test run: the
 * PRE-PROMOTION run scores tonight's staged corpus snapshot before it becomes
 * visible to `src/mirror/read`, which is the only defence against "SAM is up and
 * wrong" or "SAM is up and our parser is wrong". So the runner is exported from the
 * engine's public surface, for the promotion path and `scripts/canary` to call.
 */
export {
  COVERAGE_FLOORS,
  FAILURE_RESPONSE,
  G1_SUITE_STATUS,
  evaluateCoverage,
  runCase,
  runSuite,
  type CanaryFailureKind,
  type CaseResult,
  type CoverageReport,
  type SuiteResult,
} from './canary/run';

export {
  CANARY_FRESHNESS,
  dollars,
  flattenFiling,
  hours,
  microDollars,
  rate,
  type CanaryCase,
  type ConstructionType,
  type FieldMap,
  type OracleClass,
} from './canary/case';

export { buildCase, daysFrom, daysFromTotals, type LineSpec, type WeekSpec, type WorkerSpec } from './canary/build';

export { CANARY_OBLIGATIONS, CLASS_1_CASE_IDS, REGULATORY_FIXTURES } from './canary/fixtures';
