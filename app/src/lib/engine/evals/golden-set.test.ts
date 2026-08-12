/**
 * The golden set, and the honesty of its coverage claim.
 *
 * Spec: LLM_ENGINE.md §8.1 (composition, provenance, the coverage manifest),
 * §8.2 (per-commit blocking checks), E7.
 *
 * The assertions about *shortfall* matter as much as the ones about passing. A
 * gate reporting 10/33 as green would report passing for 23 codes it never
 * tested, which §8.1 calls worse than no gate at all.
 */

import { describe, expect, it } from 'vitest';

import { GOLDEN_SET, GOLDEN_SET_CODES } from './golden-set';
import { formatConfusionMatrix, goldenSetViolations, runGoldenSet } from './harness';
import { isVerbatim } from '../classify';
import { REASON_CODES, isReasonCode } from '../../domain/reason-codes';

describe('the fixtures themselves', () => {
  it('is the initial 10-fixture slice of the ~53-notice set', () => {
    expect(GOLDEN_SET).toHaveLength(10);
    expect(new Set(GOLDEN_SET.map((f) => f.id)).size).toBe(10);
  });

  it('labels every fixture SYNTHETIC — none is evidence about real notices', () => {
    expect(GOLDEN_SET.every((f) => f.provenance === 'synthetic')).toBe(true);
  });

  it('covers the major taxonomy families across both marketplaces', () => {
    const families = new Set(GOLDEN_SET.map((f) => f.family));
    expect(families).toEqual(
      new Set([
        'AMZ.AUTH',
        'AMZ.PERF',
        'AMZ.COC',
        'AMZ.OPS',
        'AMZ.SAFETY',
        'AMZ.IP',
        'WMT.PERF',
        'WMT.COC',
      ]),
    );
    expect(GOLDEN_SET.filter((f) => f.marketplace === 'walmart')).toHaveLength(2);
  });

  it('labels every fixture with a code from the taxonomy', () => {
    for (const code of GOLDEN_SET_CODES) expect(isReasonCode(code)).toBe(true);
  });

  it('quotes only text that is actually in its own notice', () => {
    for (const fixture of GOLDEN_SET) {
      for (const candidate of fixture.recorded.candidates) {
        for (const quote of candidate.quotes) {
          expect(isVerbatim(quote, fixture.notice), `${fixture.id}: ${quote}`).toBe(true);
        }
      }
    }
  });

  it('carries a refused-category fixture, so the pre-payment triage gate is tested', () => {
    const refused = GOLDEN_SET.filter(
      (f) => f.expected.kind === 'escalate' && f.expected.reason === 'refused_category',
    );
    expect(refused.length).toBeGreaterThan(0);
  });
});

describe('the harness', () => {
  it('reproduces every fixture disposition, with no violations', async () => {
    const report = await runGoldenSet();
    expect(goldenSetViolations(report)).toEqual([]);
    expect(report.dispositionAccuracy).toBe(1);
    expect(report.fixtureIntegrity).toEqual([]);
    expect(report.totals.fixtures).toBe(10);
    expect(report.totals.drafted).toBe(9);
    expect(report.totals.escalated).toBe(1);
  });

  it('renders no draft without a citation, and reports leaks and injections as counters', async () => {
    const report = await runGoldenSet();
    expect(report.totals.renderedWithoutCitation).toBe(0);
    expect(report.totals.citationLeaks).toBe(0);
    expect(report.totals.injectionSignals).toBe(0);
  });

  it('reports coverage as the shortfall it is — 10 of 33, not "complete"', async () => {
    const report = await runGoldenSet();
    expect(report.coverage.totalCodes).toBe(REASON_CODES.length);
    expect(report.coverage.codesCovered).toHaveLength(10);
    expect(report.coverage.complete).toBe(false);
    expect(report.coverage.byProvenance).toEqual({ real: 0, synthetic: 10 });
    expect(goldenSetViolations(report, { requireFullCoverage: true })).toEqual([
      'coverage is 10/33 codes',
    ]);
  });

  it('reports a confusion matrix, not a single accuracy number', async () => {
    const report = await runGoldenSet();
    expect(report.confusion.size).toBe(10);
    for (const [label, row] of report.confusion) {
      expect(row.get(label)).toBe(1);
    }
    const rendered = formatConfusionMatrix(report);
    expect(rendered).toContain('AMZ.AUTH.INAUTHENTIC → AMZ.AUTH.INAUTHENTIC×1');
    // Synthetic rows are visually distinguished (§8.1).
    expect(rendered).toContain('~AMZ.AUTH.INAUTHENTIC');
    expect(rendered).toContain('coverage 10/33 codes');
  });

  it('runs the evaluator-optimizer revision only where the critique blocks', async () => {
    const report = await runGoldenSet();
    const revised = report.results.filter((r) => (r.iterations ?? 0) > 1);
    expect(revised.map((r) => r.fixtureId)).toEqual(['GS-05']);
  });

  it('fails loudly when a fixture disposition changes', async () => {
    const broken = GOLDEN_SET.map((fixture) =>
      fixture.id === 'GS-08'
        ? { ...fixture, expected: { kind: 'drafted' as const } }
        : fixture,
    );
    const report = await runGoldenSet({ fixtures: broken });
    expect(goldenSetViolations(report)).toHaveLength(1);
    expect(goldenSetViolations(report)[0]).toContain('GS-08');
  });
});
