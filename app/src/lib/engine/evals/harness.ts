/**
 * The golden-set evaluation harness.
 *
 * Spec: LLM_ENGINE.md §8 (E7 — "without this, every prompt change is a coin
 * flip"), §8.1 (the set and its coverage manifest), §8.2 (what runs per commit,
 * blocking), §8.5 (the adversarial suite lives in the invariant test).
 *
 * WHAT THIS MEASURES, AND WHAT IT CANNOT. Run against recorded responses, this
 * harness measures the PIPELINE: that the gate escalates what it should, that
 * every drafted document carries an allowlisted citation, that contracts
 * validate, that the confusion matrix has no blind rows for the codes covered.
 * It does NOT measure classifier accuracy — recorded responses cannot, by
 * construction, disagree with themselves. Classifier accuracy is the nightly
 * live-model lane (§8.3), which is also where ADR-101's Sonnet-vs-Opus promotion
 * rule is re-tested. Reporting a recorded run as "accuracy" would be the kind of
 * green-that-means-nothing §8.1 warns about.
 *
 * Reported as a MATRIX, never as a single accuracy number: the codes are not
 * equally consequential, and a matrix shows *which* confusion appeared.
 */

import { createFixtureCorpus, fixtureSlice } from './fixture-corpus';
import { GOLDEN_SET, type GoldenFixture } from './golden-set';
import { queueFixture } from './recorded';
import { MockAnthropicAdapter } from '../../adapters/anthropic.mock';
import { REASON_CODES, UNCLASSIFIED, isReasonCode } from '../../domain/reason-codes';
import type { ClassifierLabel } from '../../domain/reason-codes';
import type { EscalationReason, NoticeDocument } from '../../domain/types';
import { engineConfigFromEnv, type EngineConfigOverrides } from '../config';
import type { CorpusProvider } from '../corpus-port';
import { CollectingEventSink } from '../events';
import { isVerbatim } from '../classify';
import { createEngine } from '../pipeline';
import {
  FIXTURE_CORPUS_RELEASE,
  FIXTURE_PROMPT_BUNDLE_HASH,
} from './fixture-corpus';

export type GoldenRunResult = {
  fixtureId: string;
  provenance: GoldenFixture['provenance'];
  family: string;
  label: ClassifierLabel;
  predicted: ClassifierLabel;
  expectedKind: 'drafted' | 'escalate';
  actualKind: 'drafted' | 'escalate';
  dispositionCorrect: boolean;
  expectedEscalation?: EscalationReason;
  actualEscalation?: EscalationReason;
  readinessScore?: number;
  iterations?: number;
  citedClauseCount: number;
  citationLeaks: number;
  injectionSignals: number;
  detail?: string;
};

export type CoverageManifest = {
  totalCodes: number;
  codesCovered: string[];
  /** §8.1: coverage below 33/33 fails the corpus build. This slice is 10/33, so
   *  the flag is honest rather than aspirational. */
  complete: boolean;
  byProvenance: { real: number; synthetic: number };
  perCode: Record<string, { real: number; synthetic: number }>;
};

export type GoldenSetReport = {
  results: GoldenRunResult[];
  /** expected label → predicted label → count. */
  confusion: Map<ClassifierLabel, Map<ClassifierLabel, number>>;
  coverage: CoverageManifest;
  dispositionAccuracy: number;
  totals: {
    fixtures: number;
    drafted: number;
    escalated: number;
    citationLeaks: number;
    injectionSignals: number;
    /** Drafted results that reached a rendered document with zero cited
     *  clauses. Structurally impossible; asserted because "impossible" is a
     *  claim and this is its test. */
    renderedWithoutCitation: number;
  };
  /** Fixture-integrity failures: a recorded evidence quote that is not verbatim
   *  in its own notice would make the whole set unfalsifiable. */
  fixtureIntegrity: string[];
};

export type RunGoldenSetOptions = {
  fixtures?: readonly GoldenFixture[];
  corpus?: CorpusProvider;
  config?: EngineConfigOverrides;
};

export async function runGoldenSet(options: RunGoldenSetOptions = {}): Promise<GoldenSetReport> {
  const fixtures = options.fixtures ?? GOLDEN_SET;
  const corpus = options.corpus ?? createFixtureCorpus();
  const config = engineConfigFromEnv({
    corpusRelease: FIXTURE_CORPUS_RELEASE,
    promptBundleHash: FIXTURE_PROMPT_BUNDLE_HASH,
    ...options.config,
  });

  const results: GoldenRunResult[] = [];
  const fixtureIntegrity: string[] = [];

  for (const fixture of fixtures) {
    for (const candidate of fixture.recorded.candidates) {
      for (const quote of candidate.quotes) {
        if (!isVerbatim(quote, fixture.notice)) {
          fixtureIntegrity.push(`${fixture.id}: quote is not verbatim in the notice — "${quote}"`);
        }
      }
    }

    const mock = new MockAnthropicAdapter();
    if (isReasonCode(fixture.label)) {
      queueFixture(mock, fixture, fixtureSlice(fixture.label));
    } else {
      queueFixture(mock, fixture, fixtureSlice(REASON_CODES[0]));
    }

    const events = new CollectingEventSink();
    const engine = createEngine({ model: mock, corpus, config, events });
    const notice: NoticeDocument = {
      caseId: `case_${fixture.id}`,
      text: fixture.notice,
      sha256: `sha-${fixture.id}`,
      receivedVia: 'paste',
    };

    const result = await engine.run(notice);

    const predicted: ClassifierLabel =
      result.kind === 'drafted' ? result.classification.code : result.candidates?.[0]?.code ?? UNCLASSIFIED;

    const expectedKind = fixture.expected.kind;
    const expectedEscalation =
      fixture.expected.kind === 'escalate' ? fixture.expected.reason : undefined;
    const actualEscalation = result.kind === 'escalate' ? result.reason : undefined;

    results.push({
      fixtureId: fixture.id,
      provenance: fixture.provenance,
      family: fixture.family,
      label: fixture.label,
      predicted,
      expectedKind,
      actualKind: result.kind,
      dispositionCorrect:
        expectedKind === result.kind &&
        (expectedEscalation === undefined || expectedEscalation === actualEscalation),
      ...(expectedEscalation ? { expectedEscalation } : {}),
      ...(actualEscalation ? { actualEscalation } : {}),
      ...(result.kind === 'drafted'
        ? {
            readinessScore: result.critique.readinessScore,
            iterations: result.iterations,
            citedClauseCount: result.draft.clauses.length,
            citationLeaks: result.draft.citationLeaks,
            injectionSignals: result.draft.injectionSignals,
          }
        : { citedClauseCount: 0, citationLeaks: 0, injectionSignals: 0, detail: result.detail }),
    });
  }

  return {
    results,
    confusion: buildConfusion(results),
    coverage: buildCoverage(fixtures),
    dispositionAccuracy:
      results.length === 0
        ? 0
        : results.filter((r) => r.dispositionCorrect).length / results.length,
    totals: {
      fixtures: results.length,
      drafted: results.filter((r) => r.actualKind === 'drafted').length,
      escalated: results.filter((r) => r.actualKind === 'escalate').length,
      citationLeaks: results.reduce((n, r) => n + r.citationLeaks, 0),
      injectionSignals: results.reduce((n, r) => n + r.injectionSignals, 0),
      renderedWithoutCitation: results.filter(
        (r) => r.actualKind === 'drafted' && r.citedClauseCount === 0,
      ).length,
    },
    fixtureIntegrity,
  };
}

function buildConfusion(
  results: readonly GoldenRunResult[],
): Map<ClassifierLabel, Map<ClassifierLabel, number>> {
  const matrix = new Map<ClassifierLabel, Map<ClassifierLabel, number>>();
  for (const result of results) {
    const row = matrix.get(result.label) ?? new Map<ClassifierLabel, number>();
    row.set(result.predicted, (row.get(result.predicted) ?? 0) + 1);
    matrix.set(result.label, row);
  }
  return matrix;
}

function buildCoverage(fixtures: readonly GoldenFixture[]): CoverageManifest {
  const perCode: Record<string, { real: number; synthetic: number }> = {};
  for (const fixture of fixtures) {
    const entry = perCode[fixture.label] ?? { real: 0, synthetic: 0 };
    entry[fixture.provenance] += 1;
    perCode[fixture.label] = entry;
  }
  const codesCovered = Object.keys(perCode).filter((code) => isReasonCode(code)).sort();
  return {
    totalCodes: REASON_CODES.length,
    codesCovered,
    complete: codesCovered.length === REASON_CODES.length,
    byProvenance: {
      real: fixtures.filter((f) => f.provenance === 'real').length,
      synthetic: fixtures.filter((f) => f.provenance === 'synthetic').length,
    },
    perCode,
  };
}

/**
 * The per-commit blocking conditions (§8.2). Returns the list of violations;
 * empty means green. Full 33/33 coverage is checked only when the caller asks
 * for it, because this slice is deliberately 10/33 and a gate that fails on a
 * known, documented shortfall trains people to ignore it.
 */
export function goldenSetViolations(
  report: GoldenSetReport,
  options: { requireFullCoverage?: boolean } = {},
): string[] {
  const violations: string[] = [...report.fixtureIntegrity];

  for (const result of report.results) {
    if (!result.dispositionCorrect) {
      violations.push(
        `${result.fixtureId}: expected ${result.expectedKind}${
          result.expectedEscalation ? `/${result.expectedEscalation}` : ''
        }, got ${result.actualKind}${result.actualEscalation ? `/${result.actualEscalation}` : ''}` +
          (result.detail ? ` — ${result.detail}` : ''),
      );
    }
    if (result.actualKind === 'drafted' && result.citedClauseCount === 0) {
      violations.push(`${result.fixtureId}: drafted with zero cited clauses`);
    }
  }

  if (options.requireFullCoverage && !report.coverage.complete) {
    violations.push(
      `coverage is ${report.coverage.codesCovered.length}/${report.coverage.totalCodes} codes`,
    );
  }

  return violations;
}

/** Rendered with synthetic rows marked, per §8.1. */
export function formatConfusionMatrix(report: GoldenSetReport): string {
  const lines: string[] = [];
  const syntheticOnly = new Set(
    Object.entries(report.coverage.perCode)
      .filter(([, counts]) => counts.real === 0)
      .map(([code]) => code),
  );
  for (const [expected, row] of [...report.confusion.entries()].sort()) {
    const cells = [...row.entries()]
      .sort()
      .map(([predicted, n]) => `${predicted}×${n}`)
      .join(', ');
    lines.push(`${syntheticOnly.has(expected) ? '~' : ' '}${expected} → ${cells}`);
  }
  lines.push('');
  lines.push(
    `coverage ${report.coverage.codesCovered.length}/${report.coverage.totalCodes} codes ` +
      `(${report.coverage.byProvenance.synthetic} synthetic, ${report.coverage.byProvenance.real} real) — ` +
      `rows marked ~ are synthetic-only`,
  );
  return lines.join('\n');
}
