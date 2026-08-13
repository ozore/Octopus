/**
 * `@/engine/canary` — THE MODULE THE PROMOTION PATH LOOKS FOR BY NAME.
 *
 * AUTHORITY: `ENGINE.md` §22 (the coverage floors), §24 (the same cases run in
 * three places, only one of which is a test run), §28 (what may be said once G1
 * clears); `ARCHITECTURE.md` §3.9 (`corpus/promotion` must not import `engine/**`),
 * §7.1 (the nightly ingest), `CORPUS_DESIGN.md` §9.2 (the canary stage).
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS AT ALL — a wiring defect, found during integration
 *
 * `src/scripts/corpus-ingest.ts` resolves the golden-suite runner through a
 * COMPUTED specifier — `['@', '/engine/canary'].join('')` — so that the type
 * checker cannot bind `promotion/**` to `engine/**` and quietly re-couple two
 * layers §3.9 separates. The late binding is correct. The module it binds to had
 * never been written: `src/engine/canary/` held `run.ts`, `build.ts`, `case.ts` and
 * `fixtures.ts` and no index, so `import('@/engine/canary')` threw on every run,
 * the `catch` fell through to the fail-closed runner, and the nightly ingest HELD
 * with the words *"no golden payroll suite is registered."*
 *
 * The outcome — HELD — was right. The REASON was false, and a false reason on a
 * fail-closed path is the expensive kind of bug: the gate reports a missing
 * component when what is actually missing is the corpus-drawn suite, so the true
 * shortfall stays invisible for exactly as long as the wiring stays broken. This
 * module makes the gate fail for the reason it actually fails.
 *
 * ===========================================================================
 * IT STILL DOES NOT PASS, AND THAT IS THE POINT
 *
 * `G1_SUITE_STATUS.suite` is `'skeleton'`. The eleven regulatory fixtures of
 * ENGINE.md §12.3 are implemented and they pass; the ≥500-line suite over ≥25
 * pinned determinations across ≥8 states is not drawn yet. `evaluateCoverage`
 * measures that gap in numbers and `runSuite` refuses to call the result green,
 * so `runGoldenSuite` returns `pass: false` with the shortfalls named.
 *
 * Wiring a runner is therefore NOT unlocking G1. `G1_SUITE_STATUS.claimUnlocked`
 * stays false, G1's reading stays locked, and no rendered string moves. There is no
 * env var that could say otherwise — see `src/lib/config.ts`.
 * A snapshot promoted tonight would be promoted on a suite that has not been
 * scored broadly enough to mean anything — which is precisely what §22's floors
 * exist to prevent, and why "the suite may not silently shrink" is a CI failure
 * rather than a warning.
 */

import {
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
} from './run';
import { CANARY_OBLIGATIONS, CLASS_1_CASE_IDS, REGULATORY_FIXTURES } from './fixtures';
import type { CanaryCase } from './case';

/**
 * The shape `corpus-ingest.ts` validates at run time before it will use this.
 *
 * It is duplicated there as a structural check rather than imported, deliberately:
 * an import would be the static edge §3.9 forbids. Keeping the type here as well
 * means the two ends of a deliberately dynamic boundary are both written down.
 */
export interface GoldenSuiteVerdict {
  readonly pass: boolean;
  /** Payroll lines scored — one worker-week-classification each. `COVERAGE_FLOORS`
   *  puts the floor at 500, and this is the number that has to reach it. */
  readonly lines: number;
  /** Why, in one paragraph, addressed to the ingest log and to nobody's inbox. */
  readonly detail: string;
}

function shortfallSentence(coverage: CoverageReport): string {
  return coverage.shortfalls
    .map((s) => `${s.dimension} ${formatMeasure(s.measured)} of ${formatMeasure(s.floor)}`)
    .join('; ');
}

function formatMeasure(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Score the golden payroll suite against the code as it stands.
 *
 * Called by the nightly ingest BEFORE promotion (`CORPUS_DESIGN.md` §9.2) with the
 * candidate snapshot already staged, and by `npm run canary` on its own. It takes
 * no arguments and reads no database: the cases carry their own pinned rate tables,
 * which is what makes a red result attributable to the engine rather than to
 * whatever the corpus happened to contain that night.
 *
 * NEVER THROWS. A thrown error inside the gate would surface to `resolveCanary`'s
 * `catch` as the generic fail-closed runner, and the specific reason — the thing
 * this module exists to preserve — would be lost again.
 */
export function runGoldenSuite(cases: readonly CanaryCase[] = REGULATORY_FIXTURES): GoldenSuiteVerdict {
  let suite: SuiteResult;
  try {
    suite = runSuite(cases);
  } catch (error: unknown) {
    return {
      pass: false,
      lines: 0,
      detail:
        `the golden suite could not be scored: ${String(error)}. An unscored corpus is an ` +
        'unverified corpus, so the snapshot is HELD, the previous snapshot stays current, and ' +
        'filings on pinned projects are unaffected.',
    };
  }

  const lines = suite.coverage.measured['payrollLines'] ?? 0;

  if (suite.green) {
    return {
      pass: true,
      lines,
      detail:
        `${suite.casesPassed} of ${suite.casesRun} cases matched their oracle on two consecutive ` +
        `runs, and every coverage floor was met over ${lines} payroll lines. This is evidence ` +
        'that the suite did not fail tonight; it is not a claim that the arithmetic is correct.',
    };
  }

  // Ordered by severity, not by convenience: NONDETERMINISM invalidates the gate
  // itself, so it is reported even when an arithmetic diff is also present.
  const failure: CanaryFailureKind =
    suite.firstFailure?.failure === 'NONDETERMINISM'
      ? 'NONDETERMINISM'
      : suite.firstFailure !== null
        ? (suite.firstFailure.failure ?? 'ARITHMETIC_DIFF')
        : 'COVERAGE_SHORTFALL';

  const cause =
    suite.firstFailure !== null
      ? `case ${suite.firstFailure.caseId} did not match its oracle ` +
        `(${suite.firstFailure.diffs.map((d) => d.field).join(', ') || 'no field diff recorded'})`
      : `the suite passed every case it has but does not have enough of them — ${shortfallSentence(suite.coverage)}`;

  return {
    pass: false,
    lines,
    detail:
      `${failure}: ${cause}. ${FAILURE_RESPONSE[failure]} The candidate snapshot is HELD, the ` +
      'previous snapshot stays current, and filings on pinned projects continue against the ' +
      'revision they pinned. ' +
      (G1_SUITE_STATUS.claimUnlocked
        ? ''
        : `G1 remains locked (${G1_SUITE_STATUS.suite}): ${G1_SUITE_STATUS.reason}`),
  };
}

export {
  CANARY_OBLIGATIONS,
  CLASS_1_CASE_IDS,
  COVERAGE_FLOORS,
  FAILURE_RESPONSE,
  G1_SUITE_STATUS,
  REGULATORY_FIXTURES,
  evaluateCoverage,
  runCase,
  runSuite,
};
export type { CanaryCase, CanaryFailureKind, CaseResult, CoverageReport, SuiteResult };
