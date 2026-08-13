/**
 * `npm run canary` — score the golden payroll suite and print the verdict.
 *
 * AUTHORITY: `ENGINE.md` §22 (the coverage floors), §24 (the same cases run in
 * three places), §28 (what may be said once G1 clears).
 *
 * `package.json` has pointed at this path since the scaffold and the file was never
 * written; `src/engine/canary/index.ts` was missing for the same reason, which is
 * why the nightly ingest reported a missing runner rather than the real shortfall.
 * Both are now here, and both report the same thing, because there is one runner.
 *
 * IT EXITS NON-ZERO WHEN THE SUITE IS RED, and the suite is red today: the eleven
 * regulatory fixtures pass and the ≥500-line suite over ≥25 determinations does not
 * exist, so `evaluateCoverage` reports the gap and `runSuite` refuses to call it
 * green. That is §22 working — "the suite may not silently shrink" is a CI failure,
 * not a warning — and it is not a reason to lower a floor.
 */

import { runGoldenSuite } from '@/engine/canary';
import { COVERAGE_FLOORS, G1_SUITE_STATUS, REGULATORY_FIXTURES, evaluateCoverage } from '@/engine';

function main(): void {
  const verdict = runGoldenSuite();
  const coverage = evaluateCoverage(REGULATORY_FIXTURES);

  process.stdout.write(
    `${JSON.stringify({
      pass: verdict.pass,
      lines: verdict.lines,
      detail: verdict.detail,
      measured: coverage.measured,
      shortfalls: coverage.shortfalls,
      floors: COVERAGE_FLOORS.map((floor) => ({ dimension: floor.dimension, floor: floor.floor })),
      // The gate and the runner are different things, and a report that printed only
      // one of them would let a working runner be read as a cleared gate. The gate
      // state comes off the suite's own status, not off config: there is no longer an
      // env var that could say otherwise (build review claims H-1).
      g1: { suite: G1_SUITE_STATUS.suite, claimUnlocked: G1_SUITE_STATUS.claimUnlocked },
    })}\n`,
  );

  process.exit(verdict.pass ? 0 : 1);
}

main();
