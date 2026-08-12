/**
 * The JSON contracts between stages.
 *
 * Spec: LLM_ENGINE.md §5 (the contracts), §5.1 (ClassificationResponse), §5.5
 * (Critique), §7.1 (structured outputs only on stages 1 and 4).
 *
 * ONE DEFINITION, TWO USES. Each Zod schema below both (a) validates the model's
 * response before it becomes a domain value and (b) generates the JSON Schema
 * sent as `output_config.format`. A schema that can drift from its validator is
 * a schema that will, so there is deliberately no hand-written JSON Schema
 * anywhere in this directory.
 *
 * Wire shape is snake_case (it is what the model emits and what the schema
 * describes); domain shape is camelCase. The mapping functions at the bottom are
 * the only crossing point, and they are pure — no defaulting, no coercion. A
 * malformed response is a hard error, never a repaired value (§6.2 control 6).
 */

import { z } from 'zod';

import { CLASSIFIER_LABELS, UNCLASSIFIED } from '../domain/reason-codes';
import type {
  Candidate,
  ClassificationResponse,
  CritiqueCriterion,
  EvidenceSpan,
} from '../domain/types';

// ---------------------------------------------------------------------------
// Stage 1 — classify
// ---------------------------------------------------------------------------

export const EvidenceSpanWire = z.strictObject({
  quote: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const CandidateWire = z.strictObject({
  code: z.enum(CLASSIFIER_LABELS),
  /**
   * Self-reported. Validated as a number in [0,1] and NOT treated as a
   * calibrated probability anywhere downstream — §6.1 makes it the weakest of
   * three signals, never the sole gate.
   */
  confidence: z.number().min(0).max(1),
  /**
   * §5.1 requires at least one span for any non-UNCLASSIFIED candidate. That
   * rule is deliberately NOT expressed here as a schema constraint: a schema
   * failure is a hard error, and the correct response to a missing evidence span
   * is to *escalate*, not to throw. The rule lives in the threshold gate, where
   * it produces `no_evidence_span` (§6.1) — an outcome, not an exception.
   */
  evidence_spans: z.array(EvidenceSpanWire),
});

export const ClassificationResponseWire = z.strictObject({
  marketplace: z.enum(['amazon', 'walmart', 'unknown']),
  /** N9: a listing-level notice is out of scope for v1. */
  scope: z.enum(['account', 'listing', 'unknown']),
  notice_language: z.string().min(2),
  /** Ordered, descending confidence, 1–3 entries. */
  candidates: z.array(CandidateWire).min(1).max(3),
  /** Injection tell: did the notice address the reader/AI? Logged, not acted on
   *  (§9 Q-E8) — we have no baseline rate, so any threshold would be invented. */
  notice_contains_instructions: z.boolean(),
});

export type ClassificationResponseWire = z.infer<typeof ClassificationResponseWire>;

// ---------------------------------------------------------------------------
// Stage 4 — critique
// ---------------------------------------------------------------------------

export const CritiqueCriterionWire = z.strictObject({
  id: z.string().min(1),
  met: z.boolean(),
  deficiency: z.string().nullable(),
});

export const CritiqueResponseWire = z.strictObject({
  criteria: z.array(CritiqueCriterionWire).min(1),
  blocking_deficiencies: z.array(z.string()),
  evidence_kit_gaps: z.array(z.string()),
});

export type CritiqueResponseWire = z.infer<typeof CritiqueResponseWire>;

/**
 * Two fields the model is NOT asked for, and the reason each is absent:
 *
 *  - `readiness_score` — §5.5: computed in code from criteria × weight. A
 *    model-authored aggregate is unauditable and drifts between prompt
 *    versions, which would make it useless as the cross-release regression
 *    signal §8.4 depends on.
 *  - `weight` — the weights belong to the corpus rubric (`RubricSpec`), which is
 *    frozen with the slice. Letting the model restate them would let a prompt
 *    change silently re-weight the score.
 */

// ---------------------------------------------------------------------------
// JSON Schema generation — the `output_config.format` payload
// ---------------------------------------------------------------------------

export type StructuredSchema = { name: string; jsonSchema: Record<string, unknown> };

function toStrictJsonSchema(name: string, schema: z.ZodType): StructuredSchema {
  const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12' }) as Record<string, unknown>;
  return { name, jsonSchema };
}

export const CLASSIFICATION_SCHEMA: StructuredSchema = toStrictJsonSchema(
  'classification_response',
  ClassificationResponseWire,
);

export const CRITIQUE_SCHEMA: StructuredSchema = toStrictJsonSchema(
  'critique_response',
  CritiqueResponseWire,
);

// ---------------------------------------------------------------------------
// Wire → domain
// ---------------------------------------------------------------------------

export function toEvidenceSpan(wire: z.infer<typeof EvidenceSpanWire>): EvidenceSpan {
  return { quote: wire.quote, start: wire.start, end: wire.end };
}

export function toCandidate(wire: z.infer<typeof CandidateWire>): Candidate {
  return {
    code: wire.code,
    confidence: wire.confidence,
    evidenceSpans: wire.evidence_spans.map(toEvidenceSpan),
  };
}

export function toClassificationResponse(wire: ClassificationResponseWire): ClassificationResponse {
  return {
    marketplace: wire.marketplace,
    scope: wire.scope,
    noticeLanguage: wire.notice_language,
    candidates: wire.candidates.map(toCandidate),
    noticeContainsInstructions: wire.notice_contains_instructions,
  };
}

/**
 * Joins the model's per-criterion booleans to the rubric's weights. Criteria the
 * rubric does not define are dropped — the rubric, not the model, decides what
 * is scored — and rubric criteria the model omitted are treated as unmet with an
 * explicit deficiency, so a model that simply stops emitting a criterion cannot
 * silently raise the readiness score.
 */
export function toCritiqueCriteria(
  wire: CritiqueResponseWire,
  rubricWeights: ReadonlyMap<string, number>,
): CritiqueCriterion[] {
  const byId = new Map(wire.criteria.map((c) => [c.id, c]));
  return [...rubricWeights.entries()].map(([id, weight]) => {
    const emitted = byId.get(id);
    if (!emitted) {
      return { id, met: false, weight, deficiency: 'Not assessed by the evaluator.' };
    }
    return { id, met: emitted.met, weight, deficiency: emitted.met ? null : emitted.deficiency };
  });
}

/** §5.5 — the aggregate is ours: a weighted sum over booleans, reproducible and
 *  diff-able across corpus releases. */
export function computeReadinessScore(criteria: readonly CritiqueCriterion[]): number {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (total <= 0) return 0;
  const met = criteria.reduce((sum, c) => (c.met ? sum + c.weight : sum), 0);
  return Math.round((met / total) * 100);
}

export { UNCLASSIFIED };
