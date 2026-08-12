/**
 * Stage 4 — CRITIQUE (evaluator-optimizer).
 *
 * Spec: LLM_ENGINE.md §2.2 (`claude-sonnet-5`, rubric JSON), §5.5 (the Critique
 * contract), §8.4 (the judge scores criteria, not vibes), E1.
 *
 * Two decisions are encoded here rather than argued in comments elsewhere:
 *
 *  - THE EVALUATOR IS NOT THE DRAFTER. A different model family gives
 *    decorrelated errors; a drafter critiquing itself shares its own blind
 *    spots. This is a flagged hypothesis (§9 Q-E2), not a finding — it is
 *    defensible because rubric scoring is verification against a checklist, not
 *    open-ended judgment, and §8.4 tests it by re-scoring with an Opus-tier
 *    judge and comparing deficiency recall.
 *
 *  - THE AGGREGATE IS OURS. `readinessScore` is a weighted sum over the model's
 *    booleans, computed in code from the rubric's weights (§5.5). A
 *    model-authored aggregate would drift between prompt versions and could not
 *    serve as the cross-release regression signal §8.4 depends on.
 */

import {
  CRITIQUE_SCHEMA,
  CritiqueResponseWire,
  computeReadinessScore,
  toCritiqueCriteria,
} from './contracts';
import type { EngineDeps } from './deps';
import { EngineError } from './errors';
import { callStructured } from './model-call';
import { assertPrefixIsCacheable, buildCritiqueInstruction, buildCritiquePrefix } from './prompts';
import type { StructuredRequest } from '../adapters/anthropic';
import type { CorpusSlice, Critique, DraftSections } from '../domain/types';
import { draftPlainText } from './draft';

export function buildCritiqueRequest(
  deps: EngineDeps,
  slice: CorpusSlice,
  sections: DraftSections,
  maxTokens: number,
): StructuredRequest {
  // The per-code rubric sits ABOVE the breakpoint: it is identical for every
  // case sharing a reason code, which makes stage 4 a 33-entry cache pool rather
  // than a per-case write (§3.2).
  const systemPrefix = buildCritiquePrefix(slice.rubric);
  assertPrefixIsCacheable(systemPrefix, deps.config);
  return {
    kind: 'structured',
    model: deps.config.models.critique,
    systemPrefix,
    maxTokens,
    effort: deps.config.effort.critique,
    cacheTtl: deps.config.cacheTtl,
    schemaName: CRITIQUE_SCHEMA.name,
    jsonSchema: CRITIQUE_SCHEMA.jsonSchema,
    userText: buildCritiqueInstruction(draftPlainText(sections), slice.code),
  };
}

export async function critiqueDraft(
  deps: EngineDeps,
  slice: CorpusSlice,
  sections: DraftSections,
): Promise<Critique> {
  const started = Date.now();
  const raw = await callStructured(deps, 'critique', (maxTokens) =>
    buildCritiqueRequest(deps, slice, sections, maxTokens),
  );

  const parsed = CritiqueResponseWire.safeParse(raw.json);
  if (!parsed.success) {
    throw new EngineError(
      'contract_validation_failure',
      `critique response failed its contract: ${parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'} ${i.message}`)
        .join('; ')}`,
      'critique',
    );
  }

  const weights = new Map(slice.rubric.criteria.map((c) => [c.id, c.weight]));
  const criteria = toCritiqueCriteria(parsed.data, weights);

  // Blocking deficiencies are intersected with the rubric: the evaluator may
  // name only criteria the corpus defines, so a hallucinated criterion id cannot
  // block a draft (and cannot silently unblock one either).
  const unmet = new Set(criteria.filter((c) => !c.met).map((c) => c.id));
  const blockingDeficiencies = [...new Set(parsed.data.blocking_deficiencies)].filter((id) =>
    unmet.has(id),
  );

  deps.events.emit({ type: 'stage_complete', stage: 'critique', durationMs: Date.now() - started });

  return {
    readinessScore: computeReadinessScore(criteria),
    criteria,
    blockingDeficiencies,
    evidenceKitGaps: [...new Set(parsed.data.evidence_kit_gaps)],
  };
}
