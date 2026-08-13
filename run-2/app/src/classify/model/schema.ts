/**
 * E6 — THE RESPONSE SCHEMA, AND THE FIVE GATES IT DOES NOT COVER.
 *
 * AUTHORITY: `ENGINE.md` §15.4 (the schema, in JSON), §15.5 (validation, and what
 * rejection costs), §16.3 (the digit ban), §19 (untrusted input), and
 * `ARCHITECTURE.md` §11.7's DO-NOT-ASSERT list.
 *
 * ===========================================================================
 * THE WRONG ANSWER IS UNREPRESENTABLE, NOT MERELY REJECTED
 *
 * There is no numeric field and no classification-name string anywhere in this
 * schema. A rate cannot be emitted because there is nowhere to put it; a
 * classification cannot be invented because the only classification-bearing field
 * is an INTEGER INDEX into a list this process retrieved from the pinned mirror.
 * That is **I2** expressed as a grammar rather than as a filter, and it is why
 * §19's prompt-injection table can say that the worst achievable outcome of a
 * hostile payroll title is a differently-*ordered* picker.
 *
 * ===========================================================================
 * WHY THE ENUM IS FIXED AT [0..11] REGARDLESS OF CANDIDATE COUNT
 *
 * Structured outputs compile the schema to a grammar and cache the compiled grammar
 * for 24 hours from last use; the cache is invalidated when the schema STRUCTURE
 * changes. An enum whose length tracked the candidate count would recompile on
 * nearly every request. K = 12 is fixed for the life of the product, one byte-stable
 * schema, one compiled grammar — and indices beyond `candidates.length` are rejected
 * in code below, belt and braces on top of the grammar.
 *
 * Array `maxItems` is NOT supported by structured outputs (only `minItems` of 0 or
 * 1), so array length is validated here rather than in the grammar.
 *
 * ===========================================================================
 * REJECTION IS CHEAP, WHICH IS WHAT MAKES IT HONEST
 *
 * The deterministic Stage-2 ordering already exists before the call is made. A
 * rejected response therefore degrades the picker's ORDERING and nothing else:
 * there is no state in which the product is worse off than if the model had been
 * unavailable. Every failure below routes to L-E — never to a retry loop, never to
 * a guess, and never to a person (A3).
 */

import { z } from 'zod';

import type { ClassificationId } from '@/lib/types';

import { spanQuotesTitle, type TitleNorm } from '../normalize';

/** ENGINE §15.4. Fixed for the life of the product; see the header. */
export const RANK_ENUM_K = 12;

/** Sent as `output_config.format.schema`. Changing this string changes the compiled
 *  grammar and the cache key, so it is versioned rather than edited. */
export const RANK_SCHEMA_NAME = 'ratepin_rank_v1';

const RANK_INDEX_ENUM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/**
 * The literal JSON Schema, byte-stable. `additionalProperties: false` on every
 * object is required by Anthropic's structured-outputs contract.
 */
export const RANK_RESPONSE_SCHEMA: Readonly<Record<string, unknown>> = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['ranked', 'confidence', 'rationale_span'],
  properties: {
    ranked: { type: 'array', items: { type: 'integer', enum: RANK_INDEX_ENUM } },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    rationale_span: { type: 'string' },
    no_suitable_candidate: { type: 'boolean', default: false },
  },
});

const RankResponse = z.strictObject({
  ranked: z.array(z.number().int().min(0).max(RANK_ENUM_K - 1)),
  confidence: z.enum(['high', 'medium', 'low']),
  rationale_span: z.string(),
  no_suitable_candidate: z.boolean().optional(),
});

export type RankResponse = z.infer<typeof RankResponse>;
export type RankConfidence = RankResponse['confidence'];

/**
 * **E7, the digit ban.** ENGINE §16.3, quoted:
 *
 * > Any digit, dollar sign, WD-number-shaped token or section symbol in any
 * > model-authored string rejects the entire response.
 *
 * §16.3 states it for the narrative job; it is applied here too, and the fit is
 * exact rather than decorative — `normalizeTitle` drops every token carrying a
 * digit, so a `rationale_span` containing one could not have been quoted from the
 * normalized title in the first place. The ban and the substring gate are the same
 * gate seen from two sides, and having both means a schema change on one cannot
 * silently remove the other.
 */
export const FORBIDDEN_PROSE = /[0-9$]|[A-Z]{2}\d{8}|§/;

/** `ARCHITECTURE.md` §11.7. A second lexical check on the same string: the model
 *  may order a list, and may not characterise the result. */
export const DO_NOT_ASSERT: readonly string[] = [
  'compliant',
  'approved',
  'accepted',
  'legal',
  'violation of law',
  'we recommend',
  'effective for this contract',
] as const;

export function assertsSomething(text: string): boolean {
  const lower = text.toLowerCase();
  return DO_NOT_ASSERT.some((phrase) => lower.includes(phrase));
}

/** Every way a response can fail, enumerated so `schema_reject_total` can be sliced
 *  by reason. A counter, not an alert: a silent regression with no functional
 *  symptom is exactly what a counter is for (`USER_JOURNEY.md` §6.4). */
export type RankRejection =
  | 'schema_invalid'
  | 'ranked_empty'
  | 'ranked_too_long'
  | 'ranked_duplicate_index'
  | 'index_out_of_range'
  | 'span_empty_or_mismatched'
  | 'forbidden_prose'
  | 'confidence_not_high'
  | 'transport_unreachable'
  | 'transport_refusal'
  | 'transport_max_tokens'
  | 'transport_malformed'
  | 'budget_exhausted';

export type RankVerdict =
  /** L-D. Schema-valid, `confidence == "high"`, span quotes the title, indices in
   *  range. The payload is ids the caller already held. */
  | {
      readonly kind: 'accepted';
      readonly ranked: readonly ClassificationId[];
      readonly span: string;
      readonly confidence: 'high';
    }
  /** L-F. The model declined, which is the useful signal a forced rank destroys. */
  | { readonly kind: 'declined' }
  /** L-E. */
  | { readonly kind: 'rejected'; readonly reason: RankRejection };

export interface RankValidationContext {
  /** In the order they were offered to the model — index `i` is `candidates[i]`. */
  readonly candidates: readonly ClassificationId[];
  readonly titleNorm: TitleNorm;
}

/**
 * ENGINE §15.5's five gates, in order, plus the two lexical checks on the model's
 * one prose field.
 *
 * Gate 5 — "each index maps through `candidates[i].classificationId`, a branded id
 * constructed from the mirror row" — is a TOTAL FUNCTION BY CONSTRUCTION here,
 * because the only ids this function can return are the ones its caller passed in.
 * There is no path by which a `ClassificationId` is minted from model output.
 */
export function validateRankResponse(raw: unknown, ctx: RankValidationContext): RankVerdict {
  const parsed = RankResponse.safeParse(raw);
  if (!parsed.success) return { kind: 'rejected', reason: 'schema_invalid' };
  const response = parsed.data;

  // The decline is read BEFORE the ordering gates: a model that says none of these
  // fit has told us something, and rejecting it for a short `ranked` array would
  // convert the most useful answer into the least.
  if (response.no_suitable_candidate === true) return { kind: 'declined' };

  if (FORBIDDEN_PROSE.test(response.rationale_span)) {
    return { kind: 'rejected', reason: 'forbidden_prose' };
  }
  if (assertsSomething(response.rationale_span)) {
    return { kind: 'rejected', reason: 'forbidden_prose' };
  }
  if (response.ranked.length === 0) return { kind: 'rejected', reason: 'ranked_empty' };
  if (response.ranked.length > ctx.candidates.length) {
    return { kind: 'rejected', reason: 'ranked_too_long' };
  }
  if (new Set(response.ranked).size !== response.ranked.length) {
    return { kind: 'rejected', reason: 'ranked_duplicate_index' };
  }
  if (response.ranked.some((index) => index >= ctx.candidates.length)) {
    return { kind: 'rejected', reason: 'index_out_of_range' };
  }
  if (!spanQuotesTitle(response.rationale_span, ctx.titleNorm)) {
    return { kind: 'rejected', reason: 'span_empty_or_mismatched' };
  }
  // E5: there is no confidence value at which the model RESOLVES a classification.
  // What confidence gates is whether its ordering is used at all — L-D versus L-E —
  // and both of those block the line and fill no radio.
  if (response.confidence !== 'high') {
    return { kind: 'rejected', reason: 'confidence_not_high' };
  }

  const ranked = response.ranked.map((index) => {
    const id = ctx.candidates[index];
    /* c8 ignore next */
    if (id === undefined) throw new Error('index_out_of_range survived its own gate');
    return id;
  });
  return { kind: 'accepted', ranked, span: response.rationale_span, confidence: 'high' };
}
