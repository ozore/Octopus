/**
 * Recorded model responses for the per-commit eval lane.
 *
 * Spec: LLM_ENGINE.md §8.2 — per-commit evals run against RECORDED responses, so
 * the suite is deterministic and free; live-model evals run nightly (§8.3).
 *
 * The recordings are *derived from the corpus slice*, not pasted as literals.
 * That is deliberate: a citation literal would let a corpus edit leave a fixture
 * citing a clause id that no longer exists, and the eval would keep passing
 * while production broke. Deriving the citation from the slice means a clause
 * rename breaks the recording — loudly, in CI — which is the behaviour a golden
 * set exists to provide.
 */

import type { GoldenFixture } from './golden-set';
import type { CitedScript, StructuredScript } from '../../adapters/anthropic.mock';
import type { ModelCitation } from '../../adapters/anthropic';
import type { CorpusSlice } from '../../domain/types';
import { SECTION_SENTINELS } from '../prompts';

function span(notice: string, quote: string): { quote: string; start: number; end: number } {
  const start = notice.indexOf(quote);
  return start >= 0
    ? { quote, start, end: start + quote.length }
    : // The quote may wrap a line in the fixture; offsets are reported but never
      // trusted — the gate re-checks the quote against the notice itself (§6.1).
      { quote, start: 0, end: quote.length };
}

export function recordClassification(fixture: GoldenFixture): StructuredScript {
  return {
    json: {
      marketplace: fixture.marketplace,
      scope: fixture.scope,
      notice_language: 'en',
      candidates: fixture.recorded.candidates.map((candidate) => ({
        code: candidate.code,
        confidence: candidate.confidence,
        evidence_spans: candidate.quotes.map((quote) => span(fixture.notice, quote)),
      })),
      notice_contains_instructions: fixture.recorded.noticeContainsInstructions ?? false,
    },
  };
}

function cite(
  documentIndex: number,
  blockIndex: number,
  documentTitle: string,
  citedText: string,
): ModelCitation {
  return {
    citedText,
    documentIndex,
    documentTitle,
    startBlockIndex: blockIndex,
    endBlockIndex: blockIndex,
  };
}

export function recordDraft(
  fixture: GoldenFixture,
  slice: CorpusSlice,
  options: { revision?: boolean } = {},
): CitedScript {
  const prose = fixture.recorded.prose;
  if (!prose) throw new Error(`fixture ${fixture.id} has no recorded draft prose`);

  const policyDoc = slice.policyDocs[0];
  if (!policyDoc) throw new Error(`slice ${slice.code} has no policy document`);
  const first = policyDoc.clauses[0];
  const second = policyDoc.clauses[1] ?? first;
  if (!first || !second) throw new Error(`slice ${slice.code} has no clauses`);
  const patternIndex = slice.policyDocs.length;
  const patternClause = slice.patternDoc.clauses[0];
  if (!patternClause) throw new Error(`slice ${slice.code} pattern document has no clauses`);

  const closing = options.revision
    ? ' Every party involved is named above and the supporting agreement is attached.'
    : '';

  return {
    blocks: [
      {
        text: `${SECTION_SENTINELS.rootCause}\n${prose.rootCause}${closing} The policy we are held to reads: "${first.ourSummary}"\n\n`,
        citations: [cite(0, 0, policyDoc.title, first.ourSummary)],
      },
      {
        text: `${SECTION_SENTINELS.correctiveActions}\n${prose.correctiveActions} The requirement I worked to is: "${second.ourSummary}"\n\n`,
        citations: [cite(0, policyDoc.clauses[1] ? 1 : 0, policyDoc.title, second.ourSummary)],
      },
      {
        text: `${SECTION_SENTINELS.preventiveMeasures}\n${prose.preventiveMeasures} A strong plan for this case is described as: "${patternClause.ourSummary}"\n`,
        citations: [cite(patternIndex, 0, slice.patternDoc.title, patternClause.ourSummary)],
      },
    ],
  };
}

export function recordCritique(
  fixture: GoldenFixture,
  slice: CorpusSlice,
  options: { satisfied?: boolean } = {},
): StructuredScript {
  const spec = fixture.recorded.critique ?? { unmet: [], blocking: [], gaps: [] };
  const unmet = options.satisfied ? new Set<string>() : new Set(spec.unmet);
  return {
    json: {
      criteria: slice.rubric.criteria.map((criterion) => ({
        id: criterion.id,
        met: !unmet.has(criterion.id),
        deficiency: unmet.has(criterion.id)
          ? `The draft does not yet satisfy "${criterion.label}" for ${slice.code}.`
          : null,
      })),
      blocking_deficiencies: options.satisfied ? [] : spec.blocking,
      evidence_kit_gaps: options.satisfied ? [] : spec.gaps,
    },
  };
}

/**
 * Queue one fixture's full recorded pipeline onto a mock adapter, including the
 * extra draft+critique pair when the first critique reports a blocking
 * deficiency — the bounded evaluator-optimizer revision (§2.2 stage 4).
 */
export function queueFixture(
  mock: {
    queueStructured: (...s: StructuredScript[]) => unknown;
    queueCited: (...s: CitedScript[]) => unknown;
  },
  fixture: GoldenFixture,
  slice: CorpusSlice,
): void {
  mock.queueStructured(recordClassification(fixture));
  if (fixture.expected.kind === 'escalate' || !fixture.recorded.prose) return;

  mock.queueCited(recordDraft(fixture, slice));
  mock.queueStructured(recordCritique(fixture, slice));

  if ((fixture.recorded.critique?.blocking.length ?? 0) > 0) {
    mock.queueCited(recordDraft(fixture, slice, { revision: true }));
    mock.queueStructured(recordCritique(fixture, slice, { satisfied: true }));
  }
}
