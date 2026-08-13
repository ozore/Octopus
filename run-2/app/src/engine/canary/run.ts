/**
 * THE CANARY RUNNER — exact match, the coverage floors, and the failure taxonomy.
 *
 * AUTHORITY: `ENGINE.md` §22 (coverage floors and the permutation matrix), §24
 * (where it runs and what each run gates), §25 (exact-match semantics), §27
 * (failure taxonomy → automatic response), §28 (from G1 to a published claim).
 *
 * ===========================================================================
 * WHAT THIS FILE IS, HONESTLY
 *
 * It is the RUNNER and the SCORING, complete. It is not the 500-line suite: that
 * suite is drawn from ≥25 pinned `(wd_number, revision)` pairs across ≥8 states and
 * cannot exist before the corpus does. `fixtures.ts` holds the eleven fixtures
 * `ENGINE.md` §12.3 enumerates — six class-1 whose expected values DOL authored and
 * five class-2 pinning this revision's four corrections — and `evaluateCoverage`
 * reports, in numbers, exactly how far short of §22 that is.
 *
 * Reporting the shortfall rather than asserting green is the whole point. §28: "the
 * gates are counters in a database, not statements in a document", and
 * `CORRECTIONS.md` F-1 forbids any correctness claim until G1's counter says 30
 * consecutive green days. A skeleton that returned "coverage: OK" would be the one
 * bug this file cannot be allowed to have.
 *
 * ===========================================================================
 * EXACT MATCH, AND WHY IT DOES NOT CONTRADICT P-19
 *
 * Tolerance: none. Integer cents, `expected === actual`. A one-cent difference is a
 * failure, because it means the rounding rule (§11) moved, and a rounding rule that
 * moves once will move again on a bigger number.
 *
 * That is not in tension with P-19's ±1-cent-per-site residual bound: P-19 bounds
 * the difference between TWO DIFFERENT ORDERS OF OPERATIONS, only one of which the
 * engine performs. The engine performs the §11.2 order, deterministically, so a
 * pinned expectation is exact. P-19 exists to prove the specified order is the one
 * implemented; G1 exists to prove it has not changed.
 *
 * ===========================================================================
 * `NONDETERMINISM` OUTRANKS `ARITHMETIC_DIFF`, DELIBERATELY
 *
 * A wrong-but-stable answer is a bug we can find. A different answer on each run
 * means every other result in the suite is unproven. So the runner computes each
 * case twice and compares the two runs to each other before comparing either to the
 * expectation.
 */

import type { ArtifactVerdict } from '@/lib/types';

import { computeFiling } from '../arithmetic/week';
import { deriveStatusForFiling } from '../status';
import { CANARY_FRESHNESS, flattenFiling, type CanaryCase, type FieldMap } from './case';

/**
 * §27's taxonomy, restricted to the failures a pure arithmetic runner can observe.
 *
 * `PARSE_DIFF` belongs to the promotion path (it compares a re-parsed snapshot's
 * class count and rate checksum against an unchanged revision), `RENDER_DIFF` to
 * the visual-regression job, and `SCHEMA_DIFF` to the CA XSD hash check. Naming
 * them here without being able to raise them would be the kind of aspirational
 * completeness that makes a taxonomy stop meaning anything.
 */
export type CanaryFailureKind = 'ARITHMETIC_DIFF' | 'NONDETERMINISM' | 'COVERAGE_SHORTFALL';

/** Each failure routes to exactly one of ADR-010's four verbs — degrade, freeze,
 *  credit, roll back — with NO ALERT TO A HUMAN (A3, A5). */
export const FAILURE_RESPONSE: Readonly<Record<CanaryFailureKind, string>> = {
  ARITHMETIC_DIFF: 'FREEZE build and index promotion; auto-rollback if post-deploy (L5).',
  NONDETERMINISM: 'FREEZE. The most serious failure available: it invalidates the gate itself (L5).',
  COVERAGE_SHORTFALL: 'Fail CI. The suite may not silently shrink.',
} as const;

export interface FieldDiff {
  readonly field: string;
  readonly expected: string | number | boolean | null;
  readonly actual: string | number | boolean | null | undefined;
}

export interface CaseResult {
  readonly caseId: string;
  readonly oracleClass: CanaryCase['oracleClass'];
  readonly passed: boolean;
  readonly failure: CanaryFailureKind | null;
  readonly diffs: readonly FieldDiff[];
  readonly actual: FieldMap;
  readonly verdict: ArtifactVerdict;
}

/**
 * Run one case twice and score it.
 *
 * The second run is not paranoia: the engine is a pure function of two values, so
 * two runs differing means something in the call graph is not — a `Map` iteration
 * order that depends on insertion timing, a `Date`, a floating-point path. Every
 * one of those makes the whole suite's green meaningless, which is why this check
 * comes first and its response is FREEZE.
 */
export function runCase(testCase: CanaryCase): CaseResult {
  const first = computeFiling(testCase.input);
  const second = computeFiling(testCase.input);
  const firstVerdict = deriveStatusForFiling(first, CANARY_FRESHNESS);
  const secondVerdict = deriveStatusForFiling(second, CANARY_FRESHNESS);

  const actual = flattenFiling(first, firstVerdict);
  const repeat = flattenFiling(second, secondVerdict);

  const nondeterministic: FieldDiff[] = [];
  for (const [field, value] of Object.entries(actual)) {
    if (repeat[field] !== value) {
      nondeterministic.push({ field, expected: value, actual: repeat[field] });
    }
  }
  if (nondeterministic.length > 0) {
    return {
      caseId: testCase.caseId,
      oracleClass: testCase.oracleClass,
      passed: false,
      failure: 'NONDETERMINISM',
      diffs: nondeterministic,
      actual,
      verdict: firstVerdict,
    };
  }

  const diffs: FieldDiff[] = [];
  for (const [field, expected] of Object.entries(testCase.expected)) {
    const observed = actual[field];
    if (observed !== expected) diffs.push({ field, expected, actual: observed });
  }

  return {
    caseId: testCase.caseId,
    oracleClass: testCase.oracleClass,
    passed: diffs.length === 0,
    failure: diffs.length === 0 ? null : 'ARITHMETIC_DIFF',
    diffs,
    actual,
    verdict: firstVerdict,
  };
}

export interface SuiteResult {
  readonly casesRun: number;
  readonly casesPassed: number;
  readonly firstFailure: CaseResult | null;
  readonly results: readonly CaseResult[];
  readonly coverage: CoverageReport;
  readonly green: boolean;
}

export function runSuite(cases: readonly CanaryCase[]): SuiteResult {
  const results = cases.map(runCase);
  const coverage = evaluateCoverage(cases);
  const firstFailure = results.find((r) => !r.passed) ?? null;
  return {
    casesRun: results.length,
    casesPassed: results.filter((r) => r.passed).length,
    firstFailure,
    results,
    coverage,
    /** GREEN MEANS BOTH: every case matched AND every floor was met. A suite that
     *  passes while quietly shrinking is the failure §22 exists to prevent. */
    green: firstFailure === null && coverage.shortfalls.length === 0,
  };
}

// ===========================================================================
// §22 — the coverage floors
// ===========================================================================

export interface CoverageFloor {
  readonly dimension: string;
  readonly floor: number;
  readonly unit: 'count' | 'fraction';
  readonly note: string;
}

/** CI fails if any is unmet, so the suite cannot quietly shrink. */
export const COVERAGE_FLOORS: readonly CoverageFloor[] = [
  { dimension: 'payrollLines', floor: 500, unit: 'count', note: 'Line = one worker-week-classification.' },
  { dimension: 'distinctWds', floor: 25, unit: 'count', note: 'Pinned (wd_number, revision) pairs.' },
  { dimension: 'states', floor: 8, unit: 'count', note: 'Chosen for parser diversity, weighted toward CA.' },
  { dimension: 'constructionTypes', floor: 4, unit: 'count', note: 'Building, Heavy, Highway, Residential.' },
  {
    dimension: 'unionGroupWds',
    floor: 3,
    unit: 'count',
    note: 'Drives BOTH union paths: the allowed all-cash discharge and the refused col6B credit (ES-4).',
  },
  {
    dimension: 'zeroFringeLineFraction',
    floor: 0.4,
    unit: 'fraction',
    note: 'Matches the observed distribution — 8 of 10 rows in §15.3’s live extract.',
  },
  {
    dimension: 'atOrUnder100kLineFraction',
    floor: 0.15,
    unit: 'fraction',
    note: '§7.0’s gate is a normal week, not an edge case.',
  },
] as const;

export interface CoverageReport {
  readonly measured: Readonly<Record<string, number>>;
  readonly shortfalls: readonly { readonly dimension: string; readonly floor: number; readonly measured: number }[];
}

export function evaluateCoverage(cases: readonly CanaryCase[]): CoverageReport {
  let payrollLines = 0;
  let zeroFringeLines = 0;
  let atOrUnder100kLines = 0;
  const wds = new Set<string>();
  const states = new Set<string>();
  const constructionTypes = new Set<string>();
  const unionGroupWds = new Set<string>();

  for (const testCase of cases) {
    const { week, rates } = testCase.input;
    wds.add(`${rates.wdNumber}:${rates.revision}`);
    states.add(testCase.stateCode);
    constructionTypes.add(testCase.constructionType);
    for (const worker of week.workers) {
      for (const line of worker.lines) {
        payrollLines += 1;
        if (week.contractValueBand === 'at_or_under_100k') atOrUnder100kLines += 1;
        const wdRate = line.classificationId === null ? null : rates.lookup(line.classificationId);
        if (wdRate !== null && wdRate.fringeRate === 0) zeroFringeLines += 1;
        if (wdRate !== null && wdRate.isUnionGroup) unionGroupWds.add(`${rates.wdNumber}:${rates.revision}`);
      }
    }
  }

  const measured: Record<string, number> = {
    payrollLines,
    distinctWds: wds.size,
    states: states.size,
    constructionTypes: constructionTypes.size,
    unionGroupWds: unionGroupWds.size,
    zeroFringeLineFraction: payrollLines === 0 ? 0 : zeroFringeLines / payrollLines,
    atOrUnder100kLineFraction: payrollLines === 0 ? 0 : atOrUnder100kLines / payrollLines,
  };

  const shortfalls = COVERAGE_FLOORS.filter((floor) => (measured[floor.dimension] ?? 0) < floor.floor).map(
    (floor) => ({ dimension: floor.dimension, floor: floor.floor, measured: measured[floor.dimension] ?? 0 }),
  );

  return { measured, shortfalls };
}

/**
 * WHAT MAY BE SAID ONCE THE SUITE CLEARS, AND WHAT MAY NEVER BE SAID.
 *
 * §28: "What we may say once it clears is narrow and true: 'Every rate on every
 * filing is re-scored against a 500-line golden payroll suite before any corpus
 * update goes live and before any release ships; 30 consecutive days green as of
 * {date}.' What we may not say, ever, is that our arithmetic is correct — a suite
 * that has not failed is evidence, not proof, and the honest claim is about the
 * mechanism and its record, not about the absence of bugs."
 *
 * The gate is a SQL query over `canary_runs`, not a constant, and the copy lint
 * reads the counter. This flag exists so nothing in this repository can mistake a
 * runner that works for a gate that has cleared.
 */
export const G1_SUITE_STATUS = {
  suite: 'skeleton',
  reason:
    'The eleven regulatory and frozen fixtures of ENGINE.md §12.3 are implemented; the ≥500-line ' +
    'suite over ≥25 pinned determinations across ≥8 states is drawn from the corpus and does not ' +
    'exist yet. evaluateCoverage reports the shortfall in numbers.',
  claimUnlocked: false,
} as const;
