/**
 * Scoring — `specs/03` §15.1, `THRESHOLDS.md` §4.1.
 *
 * TWO RULES THAT ARE NOT NEGOTIABLE HERE.
 *
 *  1. **Never average.** Per field, with its own denominator. A 3% average that
 *     is 20% wrong on `policy_exp` is a broken product wearing a good number
 *     (BUILD.md M4, "Never").
 *  2. **A critical value is in the denominator only if it is printed on the
 *     document.** `D` is COMPUTED from the expected-value files, never
 *     estimated. `THRESHOLDS.md` §4.1's earlier "16 fixtures × 6 fields ≈ 96"
 *     was an estimate presented as arithmetic and it was wrong in both
 *     directions (REVIEW.md MJ-02).
 *
 * The comparison is on the extracted VALUE, not on `raw`, `page`, `source_text`
 * or `confidence`. Those four are provenance and are checked by the quote-gate
 * tests; scoring them here would make a right answer with a slightly different
 * quotation look like a wrong answer.
 */

import type { CoiExtraction } from '../../engine';
import { walkFields, type WalkedField } from '../fields';

/** `specs/03` §15.3 and `THRESHOLDS.md` §4.1's six. `policy_exp` leads because
 *  the whole product turns on it. */
export const CRITICAL_FIELDS = [
  'policy_exp',
  'each_occurrence',
  'general_aggregate',
  'insured.name',
  'addl_insd',
  'subr_wvd',
] as const;
export type CriticalField = (typeof CRITICAL_FIELDS)[number];

export const SHIP_CRITICAL_RATE = 0.03; // ≥ 97% exact
export const BLOCK_CRITICAL_RATE = 0.05; // < 95% blocks the deploy
export const SHIP_ALL_FIELD_RATE = 0.92; // ≥ 92% all fields
export const BLOCK_ALL_FIELD_RATE = 0.88;

/** Which critical bucket, if any, a walked field belongs to. */
export function criticalBucket(field: WalkedField): CriticalField | null {
  if (field.path === '/insured/name') return 'insured.name';
  if (field.path.endsWith('/policy_exp')) return 'policy_exp';
  if (field.path.endsWith('/addl_insd')) return 'addl_insd';
  if (field.path.endsWith('/subr_wvd')) return 'subr_wvd';
  if (field.path.endsWith('/amount')) {
    if (field.limitLabel === 'each_occurrence') return 'each_occurrence';
    if (field.limitLabel === 'general_aggregate') return 'general_aggregate';
  }
  return null;
}

export type FieldComparison = {
  path: string;
  label: string;
  critical: CriticalField | null;
  expected: unknown;
  actual: unknown;
  /** `missing` = the extraction has no field at this path at all. */
  outcome: 'match' | 'wrong' | 'missing';
};

export type FixtureScore = {
  goldenId: string;
  fixture: string;
  comparisons: FieldComparison[];
  /** Fields present in the extraction that the label does not have. */
  extraFields: string[];
};

function normaliseValue(value: unknown): unknown {
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ').toUpperCase();
  return value;
}

/**
 * Compare one extraction against one label.
 *
 * Only fields the LABEL has a non-null value for enter the denominator — that is
 * §15.1's "printed on the document" rule, made mechanical. A field the labeller
 * left null is a field nobody could read, and scoring an extractor on it would
 * measure the corpus, not the model.
 */
export function scoreFixture(input: {
  goldenId: string;
  fixture: string;
  expected: CoiExtraction;
  actual: CoiExtraction | null;
}): FixtureScore {
  const expectedFields = walkFields(input.expected);
  const actualFields = input.actual ? walkFields(input.actual) : [];
  const actualByPath = new Map(actualFields.map((f) => [f.path, f]));

  const comparisons: FieldComparison[] = [];
  for (const field of expectedFields) {
    if (field.field.value === null) continue; // not printed → not in any denominator
    const actual = actualByPath.get(field.path);
    const critical = criticalBucket(field);
    if (!actual) {
      comparisons.push({
        path: field.path,
        label: field.label,
        critical,
        expected: field.field.value,
        actual: undefined,
        outcome: 'missing',
      });
      continue;
    }
    const same = normaliseValue(actual.field.value) === normaliseValue(field.field.value);
    comparisons.push({
      path: field.path,
      label: field.label,
      critical,
      expected: field.field.value,
      actual: actual.field.value,
      outcome: same ? 'match' : 'wrong',
    });
  }

  const expectedPaths = new Set(expectedFields.map((f) => f.path));
  const extraFields = actualFields
    .filter((f) => f.field.value !== null && !expectedPaths.has(f.path))
    .map((f) => f.path);

  return { goldenId: input.goldenId, fixture: input.fixture, comparisons, extraFields };
}

export type PerFieldRow = {
  field: string;
  correct: number;
  denominator: number;
  /** Only ever printed WITH its denominator. */
  rate: number;
};

export type Gate = {
  /** D — the critical-field denominator, computed from the labels. */
  D: number;
  wrongCritical: number;
  nShip: number;
  nBlock: number;
  criticalPasses: boolean;
  criticalBlocks: boolean;
  allFieldCorrect: number;
  allFieldTotal: number;
  allFieldRate: number;
  allFieldPasses: boolean;
  allFieldBlocks: boolean;
};

export type EvalReport = {
  fixtures: FixtureScore[];
  perCriticalField: PerFieldRow[];
  perField: PerFieldRow[];
  gate: Gate;
};

/** Group a path into a reportable field name: `/coverages/3/policy_exp` → `policy_exp`. */
export function fieldGroup(path: string): string {
  const tail = path.split('/').filter(Boolean).pop() ?? path;
  if (tail === 'amount') {
    const parts = path.split('/');
    return `limit.${parts[parts.length - 2] ?? 'amount'}`;
  }
  return tail;
}

export function buildReport(fixtures: FixtureScore[]): EvalReport {
  const all = fixtures.flatMap((f) => f.comparisons);

  const perCritical = new Map<string, { correct: number; total: number }>();
  for (const field of CRITICAL_FIELDS) perCritical.set(field, { correct: 0, total: 0 });
  const perFieldGroup = new Map<string, { correct: number; total: number }>();

  for (const comparison of all) {
    if (comparison.critical) {
      const bucket = perCritical.get(comparison.critical)!;
      bucket.total += 1;
      if (comparison.outcome === 'match') bucket.correct += 1;
    }
    const group = fieldGroup(comparison.path);
    const bucket = perFieldGroup.get(group) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (comparison.outcome === 'match') bucket.correct += 1;
    perFieldGroup.set(group, bucket);
  }

  const row = ([field, b]: [string, { correct: number; total: number }]): PerFieldRow => ({
    field,
    correct: b.correct,
    denominator: b.total,
    rate: b.total === 0 ? 1 : b.correct / b.total,
  });

  const perCriticalField = [...perCritical.entries()].map(row);
  const perField = [...perFieldGroup.entries()].map(row).sort((a, b) => a.field.localeCompare(b.field));

  const criticalComparisons = all.filter((c) => c.critical);
  const D = criticalComparisons.length;
  const wrongCritical = criticalComparisons.filter((c) => c.outcome !== 'match').length;
  const nShip = Math.floor(D * SHIP_CRITICAL_RATE);
  const nBlock = Math.floor(D * BLOCK_CRITICAL_RATE);

  const allFieldTotal = all.length;
  const allFieldCorrect = all.filter((c) => c.outcome === 'match').length;
  const allFieldRate = allFieldTotal === 0 ? 1 : allFieldCorrect / allFieldTotal;

  return {
    fixtures,
    perCriticalField,
    perField,
    gate: {
      D,
      wrongCritical,
      nShip,
      nBlock,
      criticalPasses: wrongCritical <= nShip,
      criticalBlocks: wrongCritical > nBlock,
      allFieldCorrect,
      allFieldTotal,
      allFieldRate,
      allFieldPasses: allFieldRate >= SHIP_ALL_FIELD_RATE,
      allFieldBlocks: allFieldRate < BLOCK_ALL_FIELD_RATE,
    },
  };
}

/**
 * The report, as a table. VALUES ARE NEVER PRINTED — only field names, counts
 * and paths. `specs/03` §15.3 asks that no corpus name appear in eval output,
 * and the cheapest way to keep that promise is for the output never to contain
 * a value at all.
 */
export function renderReport(report: EvalReport): string {
  const lines: string[] = [];
  const pct = (r: PerFieldRow) => `${(r.rate * 100).toFixed(1)}% (${r.correct}/${r.denominator})`;

  lines.push('CRITICAL FIELDS — exact match required');
  for (const r of report.perCriticalField) lines.push(`  ${r.field.padEnd(20)} ${pct(r)}`);
  lines.push('');
  lines.push('ALL FIELDS — each with its own denominator');
  for (const r of report.perField) lines.push(`  ${r.field.padEnd(34)} ${pct(r)}`);
  lines.push('');
  const g = report.gate;
  lines.push(
    `D = ${g.D} critical values printed across the golden set; N_ship = ${g.nShip}, N_block = ${g.nBlock}.`,
  );
  lines.push(
    `Critical: ${g.wrongCritical} wrong out of ${g.D} — ${g.criticalPasses ? 'SHIP' : g.criticalBlocks ? 'BLOCKS THE DEPLOY' : 'below ship, above block'}.`,
  );
  lines.push(
    `All fields: ${(g.allFieldRate * 100).toFixed(1)}% (${g.allFieldCorrect}/${g.allFieldTotal}) — ${g.allFieldPasses ? 'SHIP' : g.allFieldBlocks ? 'BLOCKS THE DEPLOY' : 'below ship, above block'}.`,
  );
  if (!g.criticalPasses || !g.allFieldPasses) {
    lines.push('');
    lines.push('Fields that did not match, by path (values deliberately omitted):');
    for (const fixture of report.fixtures) {
      const bad = fixture.comparisons.filter((c) => c.outcome !== 'match');
      for (const c of bad) lines.push(`  ${fixture.goldenId} ${c.path} — ${c.outcome}`);
    }
  }
  return lines.join('\n');
}
