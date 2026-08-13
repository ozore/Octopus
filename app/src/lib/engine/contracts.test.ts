/**
 * The JSON contracts between stages — the zod wire schemas and the wire→domain
 * mapping functions.
 *
 * Spec: LLM_ENGINE.md §5 ("a Zod schema validates every model response before it
 * becomes a domain value, and the same schema generates the JSON Schema sent as
 * `output_config.format`. One definition, two uses."), §5.1, §5.5, §6.1
 * (self-reported confidence is validated as a number, never trusted as a
 * probability), §7.1 (structured outputs are the ONLY thing stages 1 and 4 emit
 * — no citations on these calls, so the schema itself is the whole contract).
 *
 * `classify.test.ts` and `pipeline.test.ts` exercise these schemas indirectly,
 * through a full stage call. This file exercises them directly, at the
 * boundary where a malformed model response first meets the contract — because
 * that is the one place a defect here would actually be caught before it
 * produces either a thrown "hard error" (fine) or, worse, a silently-coerced
 * value (never fine — §6.2 control 6: malformed input is a hard error, never a
 * repaired one).
 */

import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';

import {
  CandidateWire,
  CLASSIFICATION_SCHEMA,
  CritiqueCriterionWire,
  CritiqueResponseWire,
  CRITIQUE_SCHEMA,
  ClassificationResponseWire,
  EvidenceSpanWire,
  computeReadinessScore,
  toCandidate,
  toClassificationResponse,
  toCritiqueCriteria,
  toEvidenceSpan,
} from './contracts';
import { CLASSIFIER_LABELS } from '../domain/reason-codes';
import type { CritiqueCriterion } from '../domain/types';

// ---------------------------------------------------------------------------
// ClassificationResponseWire
// ---------------------------------------------------------------------------

const validClassification = {
  marketplace: 'amazon' as const,
  scope: 'account' as const,
  notice_language: 'en',
  candidates: [
    {
      code: 'AMZ.PERF.ODR' as const,
      confidence: 0.9,
      evidence_spans: [{ quote: 'exceeded 1%', start: 0, end: 11 }],
    },
  ],
  notice_contains_instructions: false,
};

describe('ClassificationResponseWire', () => {
  it('accepts a well-formed response', () => {
    const result = ClassificationResponseWire.safeParse(validClassification);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown field — additionalProperties:false is load-bearing (strict output_config.format)', () => {
    const result = ClassificationResponseWire.safeParse({
      ...validClassification,
      extra_field_the_model_invented: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a code outside the closed taxonomy — a model cannot invent a 34th label', () => {
    const result = ClassificationResponseWire.safeParse({
      ...validClassification,
      candidates: [{ ...validClassification.candidates[0], code: 'AMZ.MADE_UP_CODE' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts UNCLASSIFIED as a member of the label space, not a schema failure', () => {
    const result = ClassificationResponseWire.safeParse({
      ...validClassification,
      candidates: [{ code: 'UNCLASSIFIED', confidence: 0.5, evidence_spans: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects confidence outside [0,1] — a malformed number is a hard error, not clamped', () => {
    expect(
      ClassificationResponseWire.safeParse({
        ...validClassification,
        candidates: [{ ...validClassification.candidates[0], confidence: 1.5 }],
      }).success,
    ).toBe(false);
    expect(
      ClassificationResponseWire.safeParse({
        ...validClassification,
        candidates: [{ ...validClassification.candidates[0], confidence: -0.1 }],
      }).success,
    ).toBe(false);
  });

  it('requires at least one candidate and rejects more than three', () => {
    expect(ClassificationResponseWire.safeParse({ ...validClassification, candidates: [] }).success).toBe(
      false,
    );
    const four = Array.from({ length: 4 }, () => validClassification.candidates[0]);
    expect(ClassificationResponseWire.safeParse({ ...validClassification, candidates: four }).success).toBe(
      false,
    );
  });

  it('does NOT require a non-empty evidence_spans array at the schema level (§5.1)', () => {
    // Deliberately not a schema constraint — an empty span list must reach the
    // threshold gate as `no_evidence_span`, not be rejected here as malformed.
    // The gate's job (classify.ts / applyThreshold) is escalation, not a throw.
    const result = ClassificationResponseWire.safeParse({
      ...validClassification,
      candidates: [{ code: 'AMZ.PERF.ODR', confidence: 0.9, evidence_spans: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown marketplace or scope enum value', () => {
    expect(
      ClassificationResponseWire.safeParse({ ...validClassification, marketplace: 'ebay' }).success,
    ).toBe(false);
    expect(
      ClassificationResponseWire.safeParse({ ...validClassification, scope: 'category' }).success,
    ).toBe(false);
  });

  it('rejects a candidate missing notice_contains_instructions or an evidence span missing a field', () => {
    const { notice_contains_instructions: _drop, ...withoutFlag } = validClassification;
    expect(ClassificationResponseWire.safeParse(withoutFlag).success).toBe(false);

    const badSpan = {
      ...validClassification,
      candidates: [{ ...validClassification.candidates[0], evidence_spans: [{ quote: 'x', start: 0 }] }],
    };
    expect(ClassificationResponseWire.safeParse(badSpan).success).toBe(false);
  });

  it('CandidateWire and EvidenceSpanWire validate in isolation the same way they do nested', () => {
    expect(CandidateWire.safeParse(validClassification.candidates[0]).success).toBe(true);
    expect(EvidenceSpanWire.safeParse(validClassification.candidates[0]!.evidence_spans[0]).success).toBe(
      true,
    );
    expect(EvidenceSpanWire.safeParse({ quote: '', start: 0, end: 0 }).success).toBe(false); // min(1)
  });
});

// ---------------------------------------------------------------------------
// CritiqueResponseWire
// ---------------------------------------------------------------------------

const validCritique = {
  criteria: [
    { id: 'supplier_invoices_referenced', met: false, deficiency: 'No invoices referenced.' },
    { id: 'tone_non_defensive', met: true, deficiency: null },
  ],
  blocking_deficiencies: ['supplier_invoices_referenced'],
  evidence_kit_gaps: ['supplier_invoice'],
};

describe('CritiqueResponseWire', () => {
  it('accepts a well-formed response', () => {
    expect(CritiqueResponseWire.safeParse(validCritique).success).toBe(true);
  });

  it('rejects an unknown field (strict, matching output_config.format)', () => {
    expect(
      CritiqueResponseWire.safeParse({ ...validCritique, readiness_score: 80 }).success,
    ).toBe(false);
  });

  it('requires at least one criterion — a critique that scores nothing is malformed, not vacuously clean', () => {
    expect(CritiqueResponseWire.safeParse({ ...validCritique, criteria: [] }).success).toBe(false);
  });

  it('requires deficiency to be present (string or explicit null), never omitted', () => {
    const { deficiency: _drop, ...withoutDeficiency } = validCritique.criteria[1]!;
    expect(
      CritiqueResponseWire.safeParse({ ...validCritique, criteria: [withoutDeficiency] }).success,
    ).toBe(false);
  });

  it('CritiqueCriterionWire rejects a non-boolean met', () => {
    expect(
      CritiqueCriterionWire.safeParse({ id: 'x', met: 'yes', deficiency: null }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Structured-output JSON Schema generation — "one definition, two uses"
// ---------------------------------------------------------------------------

describe('generated output_config.format schemas', () => {
  const ajv = new Ajv2020({ strict: false });

  it('CLASSIFICATION_SCHEMA accepts what the zod schema accepts and rejects what it rejects', () => {
    const validate = ajv.compile(CLASSIFICATION_SCHEMA.jsonSchema);
    expect(validate(validClassification)).toBe(true);
    expect(validate({ ...validClassification, marketplace: 'ebay' })).toBe(false);
    expect(validate({ ...validClassification, extra_field_the_model_invented: true })).toBe(false);
  });

  it('CRITIQUE_SCHEMA accepts what the zod schema accepts and rejects what it rejects', () => {
    const validate = ajv.compile(CRITIQUE_SCHEMA.jsonSchema);
    expect(validate(validCritique)).toBe(true);
    expect(validate({ ...validCritique, criteria: [] })).toBe(false);
  });

  it('names both schemas distinctly and carries a properties object', () => {
    expect(CLASSIFICATION_SCHEMA.name).toBe('classification_response');
    expect(CRITIQUE_SCHEMA.name).toBe('critique_response');
    expect(CLASSIFICATION_SCHEMA.jsonSchema).toHaveProperty('properties');
    expect(CRITIQUE_SCHEMA.jsonSchema).toHaveProperty('properties');
  });

  it('the classification schema enumerates the full closed label space, not a sample of it', () => {
    const schema = CLASSIFICATION_SCHEMA.jsonSchema as {
      $defs?: Record<string, unknown>;
      properties: { candidates: { items: { properties: { code: { enum?: string[] } } } } };
    };
    // zod v4 draft-2020-12 output may hoist the enum into $defs; either way the
    // full 34-label space (33 codes + UNCLASSIFIED) must be present somewhere.
    const serialised = JSON.stringify(schema);
    for (const label of CLASSIFIER_LABELS) expect(serialised).toContain(label);
  });
});

// ---------------------------------------------------------------------------
// Wire -> domain mapping
// ---------------------------------------------------------------------------

describe('wire -> domain mapping (pure, no defaulting or coercion)', () => {
  it('toEvidenceSpan carries the quote and offsets through unchanged', () => {
    const span = toEvidenceSpan({ quote: 'exceeded 1%', start: 5, end: 16 });
    expect(span).toEqual({ quote: 'exceeded 1%', start: 5, end: 16 });
  });

  it('toCandidate maps snake_case evidence_spans to camelCase evidenceSpans', () => {
    const candidate = toCandidate(validClassification.candidates[0]!);
    expect(candidate).toEqual({
      code: 'AMZ.PERF.ODR',
      confidence: 0.9,
      evidenceSpans: [{ quote: 'exceeded 1%', start: 0, end: 11 }],
    });
  });

  it('toClassificationResponse maps every field, including an empty candidate evidence list', () => {
    const domain = toClassificationResponse(validClassification);
    expect(domain).toEqual({
      marketplace: 'amazon',
      scope: 'account',
      noticeLanguage: 'en',
      candidates: [
        { code: 'AMZ.PERF.ODR', confidence: 0.9, evidenceSpans: [{ quote: 'exceeded 1%', start: 0, end: 11 }] },
      ],
      noticeContainsInstructions: false,
    });
  });

  it('preserves candidate order — the gate re-derives top-1/top-2, it does not trust model ordering, but order must still be transported faithfully', () => {
    const wire = {
      ...validClassification,
      candidates: [
        { code: 'AMZ.PERF.AHR' as const, confidence: 0.1, evidence_spans: [] },
        { code: 'AMZ.PERF.ODR' as const, confidence: 0.9, evidence_spans: [] },
      ],
    };
    const domain = toClassificationResponse(wire);
    expect(domain.candidates.map((c) => c.code)).toEqual(['AMZ.PERF.AHR', 'AMZ.PERF.ODR']);
  });
});

// ---------------------------------------------------------------------------
// toCritiqueCriteria — the rubric, not the model, decides what is scored
// ---------------------------------------------------------------------------

describe('toCritiqueCriteria', () => {
  const weights = new Map([
    ['supplier_invoices_referenced', 30],
    ['tone_non_defensive', 20],
    ['root_cause_specific', 25],
  ]);

  it('joins the model booleans to the rubric weights', () => {
    const parsed = CritiqueResponseWire.parse(validCritique);
    const criteria = toCritiqueCriteria(parsed, weights);
    expect(criteria).toContainEqual({
      id: 'supplier_invoices_referenced',
      met: false,
      weight: 30,
      deficiency: 'No invoices referenced.',
    });
    expect(criteria).toContainEqual({
      id: 'tone_non_defensive',
      met: true,
      weight: 20,
      deficiency: null,
    });
  });

  it('drops a criterion the model emitted that the rubric does not define', () => {
    const parsed = CritiqueResponseWire.parse({
      ...validCritique,
      criteria: [...validCritique.criteria, { id: 'not_in_rubric', met: true, deficiency: null }],
    });
    const criteria = toCritiqueCriteria(parsed, weights);
    expect(criteria.map((c) => c.id)).not.toContain('not_in_rubric');
  });

  it('treats a rubric criterion the model never mentioned as UNMET with an explicit deficiency — a model that stops emitting a criterion cannot silently raise the score', () => {
    const parsed = CritiqueResponseWire.parse({
      ...validCritique,
      criteria: [validCritique.criteria[0]!], // omits root_cause_specific and tone_non_defensive
    });
    const criteria = toCritiqueCriteria(parsed, weights);
    const rootCause = criteria.find((c) => c.id === 'root_cause_specific');
    expect(rootCause).toEqual({
      id: 'root_cause_specific',
      met: false,
      weight: 25,
      deficiency: 'Not assessed by the evaluator.',
    });
  });

  it('always emits exactly the rubric\'s criteria set, in the rubric\'s key order', () => {
    const parsed = CritiqueResponseWire.parse(validCritique);
    const criteria = toCritiqueCriteria(parsed, weights);
    expect(criteria.map((c) => c.id)).toEqual([...weights.keys()]);
  });

  it('forces deficiency to null when the model claims met:true, even if the model supplied text', () => {
    const parsed = CritiqueResponseWire.parse({
      ...validCritique,
      criteria: [{ id: 'tone_non_defensive', met: true, deficiency: 'some text anyway' }],
    });
    const criteria = toCritiqueCriteria(parsed, weights);
    expect(criteria.find((c) => c.id === 'tone_non_defensive')?.deficiency).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeReadinessScore — the aggregate is ours (§5.5), a weighted sum over
// booleans, never emitted by the model.
// ---------------------------------------------------------------------------

describe('computeReadinessScore', () => {
  const criterion = (met: boolean, weight: number): CritiqueCriterion => ({
    id: `c-${weight}-${met}`,
    met,
    weight,
    deficiency: met ? null : 'gap',
  });

  it('is a weighted percentage rounded to the nearest integer', () => {
    expect(computeReadinessScore([criterion(true, 30), criterion(false, 20), criterion(true, 50)])).toBe(
      80,
    );
  });

  it('is 100 when every criterion is met and 0 when none are', () => {
    expect(computeReadinessScore([criterion(true, 10), criterion(true, 20)])).toBe(100);
    expect(computeReadinessScore([criterion(false, 10), criterion(false, 20)])).toBe(0);
  });

  it('is 0, not NaN or a throw, for an empty criteria list or a zero total weight', () => {
    expect(computeReadinessScore([])).toBe(0);
    expect(computeReadinessScore([criterion(true, 0), criterion(false, 0)])).toBe(0);
  });

  it('rounds rather than truncates', () => {
    // 2/3 met by weight = 66.66...% -> rounds to 67, not floors to 66.
    expect(computeReadinessScore([criterion(true, 1), criterion(true, 1), criterion(false, 1)])).toBe(67);
  });
});
