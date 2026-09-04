/**
 * The field map: every `SourcedValue` path a record can carry, the words the
 * pack calls it, which of the eight filing steps it belongs to, and — for a
 * boolean — what "true" and "false" actually mean in that field.
 *
 * **This table is the pack's completeness contract.** `assemble.ts` walks the
 * record with `walkSourcedValues()` and looks every path up here; a path with
 * no entry lands in a fallback group rather than being dropped, and
 * `tests/packs.test.ts` asserts the bijection over all nine committed records —
 * every walked value appears exactly once in the assembled pack, and no pack
 * item exists without a value behind it. That is what makes "every requirement
 * the board publishes" a checkable statement instead of an editorial one.
 *
 * A new ontology field therefore does not go missing quietly: it appears in the
 * fallback group of its step, and the bijection test still passes, and the
 * reviewer sees an unlabelled row rather than a silent omission.
 */

import type { BooleanWords } from './format';
import type { PackStepKey } from './types';

export type FieldSpec = {
  label: string;
  step: PackStepKey;
  /** What a `true`/`false` reads as. Ignored for non-booleans. */
  words?: BooleanWords;
  /** The question to put to the board when the value is not published. */
  ask?: string;
};

const REQUIRED: BooleanWords = { yes: 'required', no: 'not required' };

/**
 * Keyed by the walked path with array indices stripped
 * (`licence_types[0].exam.fee` → `licence_types.exam.fee`), so one entry covers
 * every licence type and every reciprocity entry.
 */
export const FIELD_SPECS: Readonly<Record<string, FieldSpec>> = {
  // 1 — classification
  'jurisdiction_model.summary': { label: 'How this state licenses the trade', step: 'classification' },
  'licence_types.who_must_hold': { label: 'Who must hold it', step: 'classification' },
  'licence_types.scope_note': { label: 'What it covers', step: 'classification' },

  // 2 — exam, experience and reciprocity
  'licence_types.exam.required': { label: 'Examination', step: 'exam_and_reciprocity', words: REQUIRED },
  'licence_types.exam.name': { label: 'Examination name', step: 'exam_and_reciprocity' },
  'licence_types.exam.provider': { label: 'Examination provider', step: 'exam_and_reciprocity' },
  'licence_types.experience.requirement': { label: 'Experience required', step: 'exam_and_reciprocity' },
  'licence_types.experience.alternatives': { label: 'Accepted alternatives to that experience', step: 'exam_and_reciprocity' },
  'reciprocity.grants': { label: 'What this state grants', step: 'exam_and_reciprocity' },
  'reciprocity.conditions': { label: 'On these conditions', step: 'exam_and_reciprocity' },
  'reciprocity.waives_exam': {
    label: 'Written examination',
    step: 'exam_and_reciprocity',
    words: { yes: 'waived', no: 'not waived' },
  },
  reciprocity_statement: { label: 'The board’s own summary of its agreements', step: 'exam_and_reciprocity' },

  // 3 — bond
  'licence_types.bond.required': {
    label: 'Bond',
    step: 'bond',
    words: REQUIRED,
    ask: 'Does this licence class require a surety bond, and in what amount?',
  },
  'licence_types.bond.amount': {
    label: 'Bond amount',
    step: 'bond',
    ask: 'What bond amount does this licence class require?',
  },
  'licence_types.bond.alternative': { label: 'Accepted instead of a bond', step: 'bond' },

  // 4 — insurance
  'licence_types.insurance.general_liability': {
    label: 'General liability minimum',
    step: 'insurance',
    ask: 'What general liability limit must the certificate show?',
  },
  'licence_types.insurance.property_damage': { label: 'Property damage minimum', step: 'insurance' },
  'licence_types.insurance.aggregate': { label: 'Aggregate minimum', step: 'insurance' },
  'licence_types.insurance.workers_compensation': {
    label: 'Workers’ compensation',
    step: 'insurance',
    words: REQUIRED,
    ask: 'Is workers’ compensation coverage a condition of this licence?',
  },
  'licence_types.insurance.financial_responsibility': { label: 'Financial responsibility', step: 'insurance' },

  // 5 — qualifier and the business entity
  'business_entity.qualifying_individual_rule': { label: 'Who qualifies the company', step: 'qualifier' },
  'business_entity.entity_registration': {
    label: 'Company registration',
    step: 'qualifier',
    ask: 'Must the company itself register with the board, separately from the qualifier’s licence?',
  },
  'business_entity.per_location_rule': { label: 'Per location or per company', step: 'qualifier' },
  'business_entity.change_notification_deadline': {
    label: 'Notice when the qualifier leaves',
    step: 'qualifier',
    ask: 'How long do we have to notify you when our qualifying individual leaves?',
  },

  // 6 — fees, renewal and continuing education
  'licence_types.application_fee': {
    label: 'Application fee',
    step: 'fees',
    ask: 'What is the current application fee for this licence class?',
  },
  'licence_types.exam.fee': { label: 'Examination fee', step: 'fees', ask: 'What is the current examination fee?' },
  'licence_types.renewal.cycle': { label: 'Renewal cycle', step: 'fees' },
  'licence_types.renewal.expiry_rule': { label: 'When it expires', step: 'fees' },
  'licence_types.renewal.fee': { label: 'Renewal fee', step: 'fees', ask: 'What is the current renewal fee?' },
  'licence_types.renewal.grace_period': { label: 'Grace period', step: 'fees' },
  'licence_types.renewal.late_fee': { label: 'Late renewal', step: 'fees' },
  'licence_types.continuing_education.required': {
    label: 'Continuing education',
    step: 'fees',
    words: REQUIRED,
  },
  'licence_types.continuing_education.hours': { label: 'CE hours', step: 'fees' },
  'licence_types.continuing_education.period': { label: 'CE period', step: 'fees' },
  'licence_types.continuing_education.subject_breakdown': { label: 'CE subjects', step: 'fees' },
  'licence_types.continuing_education.approved_provider_rule': { label: 'Approved providers', step: 'fees' },
  'licence_types.continuing_education.carryover': {
    label: 'Carry-over of surplus hours',
    step: 'fees',
    words: { yes: 'permitted', no: 'not permitted' },
    ask: 'May surplus CE hours be carried into the next period?',
  },
  'licence_types.continuing_education.delivery_constraint': { label: 'How the hours may be taken', step: 'fees' },

  // 7 — timeline
  typical_timeline: {
    label: 'Typical processing time',
    step: 'timeline',
    ask: 'How long does a complete application currently take to process?',
  },
};

/** `licence_types[0].exam.fee` → `licence_types.exam.fee`. */
export function specKey(path: string): string {
  return path.replace(/\[\d+\]/g, '');
}

export function fieldSpec(path: string): FieldSpec {
  const key = specKey(path);
  return (
    FIELD_SPECS[key] ?? {
      label: key.split('.').at(-1)?.replace(/_/g, ' ') ?? key,
      // A field the ontology gained and this table has not caught up with is
      // still PRINTED — in the step its prefix belongs to — rather than
      // dropped. Losing a requirement is the one failure the promise cannot
      // survive; printing an unlabelled one is merely untidy.
      step: defaultStep(key),
    }
  );
}

function defaultStep(key: string): PackStepKey {
  if (key.startsWith('reciprocity')) return 'exam_and_reciprocity';
  if (key.startsWith('business_entity')) return 'qualifier';
  if (key.includes('.bond.')) return 'bond';
  if (key.includes('.insurance.')) return 'insurance';
  if (key.includes('.renewal.') || key.includes('.continuing_education.') || key.includes('fee')) return 'fees';
  if (key.includes('.exam.') || key.includes('.experience.')) return 'exam_and_reciprocity';
  if (key.startsWith('jurisdiction_model') || key.startsWith('licence_types')) return 'classification';
  return 'timeline';
}

export const STEP_TITLES: Readonly<Record<PackStepKey, string>> = {
  classification: 'Which licence the work requires, and who must hold it',
  exam_and_reciprocity: 'Examination, experience — and whether a licence you already hold helps',
  bond: 'Bond',
  insurance: 'Insurance',
  qualifier: 'The qualifying individual and the company itself',
  fees: 'Fees, renewal and continuing education',
  timeline: 'The filing sequence, and how long it takes',
  sources: 'Every page we read, and the day we read it',
};

/**
 * The step ledes. Fixed prose, written once, and **digit-free** — asserted by
 * `tests/packs.test.ts`, because a number in a fixed sentence is a number with
 * no board behind it.
 */
export const STEP_LEDES: Readonly<Record<PackStepKey, string>> = {
  classification:
    'Start here. Writing to the wrong agency is the most expensive mistake in this process, so the board that issues each licence is named beside it.',
  exam_and_reciprocity:
    'Reciprocity usually runs one way. What follows is what this state’s own board publishes about licences issued elsewhere, matched against the licences you told us you hold.',
  bond: 'What the board publishes about surety bonds for this licence class — and, where it publishes nothing, that it publishes nothing.',
  insurance: 'The certificate of insurance the board asks for, with the limits it names.',
  qualifier:
    'Who in your company can hold the licence, whether the company registers separately, and what happens when that person leaves.',
  fees: 'What it costs to obtain the licence, what it costs to keep it, and the continuing education that keeps it current.',
  timeline:
    'Assembled only from durations the board actually publishes. Where it publishes none, this section says so and names the office to ring. We never write an estimate here.',
  sources:
    'Every page behind every value above, with the day we last read it. Open any of them beside this document; that is what it is for.',
};
