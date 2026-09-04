/**
 * The words the engine puts in an explanation.
 *
 * Every explanation is a templated SENTENCE with the requirement, the found
 * value and the `raw` text (`specs/05` §3 step 5) — never a code, never JSON.
 * They live here rather than inline in `compare.ts` so that the copy can be
 * reviewed as copy, and so that `tests/vocabulary.test.ts` has one file to
 * check against KB §F.5's banned words.
 *
 * BANNED, everywhere in this file: "verified", "compliant", "covered" as a
 * status. The noun *coverage* in its form-derived sense is fine — "the coverage
 * row", "coverage presence" name parts of the ACORD 25 (KB §F.5 rule 4).
 */

import type { CoverageType, EndorsementKey, LimitLabel } from './types';

export const COVERAGE_PROSE: Record<CoverageType, string> = {
  general_liability: 'General liability',
  automobile_liability: 'Automobile liability',
  umbrella_liability: 'Umbrella liability',
  excess_liability: 'Excess liability',
  workers_compensation: "Workers' compensation",
  other: 'Other coverage',
};

export const LIMIT_PROSE: Record<LimitLabel, string> = {
  each_occurrence: 'each occurrence',
  damage_to_rented_premises: 'damage to rented premises',
  med_exp: 'medical expense',
  personal_and_adv_injury: 'personal and advertising injury',
  general_aggregate: 'general aggregate',
  products_comp_op_agg: 'products/completed operations aggregate',
  combined_single_limit: 'combined single limit',
  bodily_injury_per_person: 'bodily injury per person',
  bodily_injury_per_accident: 'bodily injury per accident',
  property_damage: 'property damage',
  umbrella_each_occurrence: 'each occurrence',
  umbrella_aggregate: 'aggregate',
  ded_retention: 'deductible or retention',
  el_each_accident: "employers' liability each accident",
  el_disease_ea_employee: "employers' liability disease — each employee",
  el_disease_policy_limit: "employers' liability disease — policy limit",
  other: 'limit',
};

export const ENDORSEMENT_PROSE: Record<EndorsementKey, string> = {
  additional_insured_ongoing: 'Additional insured — ongoing operations',
  additional_insured_completed: 'Additional insured — completed operations',
  primary_non_contributory: 'Primary and non-contributory',
  waiver_of_subrogation_gl: 'Waiver of subrogation — general liability',
  waiver_of_subrogation_wc: "Waiver of subrogation — workers' compensation",
  auto_additional_insured: 'Additional insured — automobile liability',
  auto_waiver_of_subrogation: 'Waiver of subrogation — automobile liability',
};

/**
 * Which ACORD 25 tick column, if any, speaks to this endorsement — and the two
 * phrases the `asserted_only` sentence needs.
 *
 * `primary_non_contributory` has NO column: the form has `ADDL INSD` and
 * `SUBR WVD` and nothing else, so P&NC can only ever be evidenced by a form
 * number. That absence is data, not an oversight (KB §C.2).
 */
export const ENDORSEMENT_COLUMN: Record<
  EndorsementKey,
  { coverage: CoverageType; column: 'addl_insd' | 'subr_wvd'; claim: string; confers: string } | null
> = {
  additional_insured_ongoing: {
    coverage: 'general_liability',
    column: 'addl_insd',
    claim: 'additional insured',
    confers: 'additional-insured status',
  },
  additional_insured_completed: {
    coverage: 'general_liability',
    column: 'addl_insd',
    claim: 'additional insured',
    confers: 'additional-insured status',
  },
  primary_non_contributory: null,
  waiver_of_subrogation_gl: {
    coverage: 'general_liability',
    column: 'subr_wvd',
    claim: 'waiver of subrogation',
    confers: 'a waiver of subrogation',
  },
  waiver_of_subrogation_wc: {
    coverage: 'workers_compensation',
    column: 'subr_wvd',
    claim: 'waiver of subrogation',
    confers: 'a waiver of subrogation',
  },
  auto_additional_insured: {
    coverage: 'automobile_liability',
    column: 'addl_insd',
    claim: 'additional insured',
    confers: 'additional-insured status',
  },
  auto_waiver_of_subrogation: {
    coverage: 'automobile_liability',
    column: 'subr_wvd',
    claim: 'waiver of subrogation',
    confers: 'a waiver of subrogation',
  },
};

/** "General liability each occurrence" — the subject of a limit sentence. */
export function limitSubject(coverage: CoverageType, label: LimitLabel, otherLabel?: string | null): string {
  const head = coverage === 'other' && otherLabel ? otherLabel : COVERAGE_PROSE[coverage];
  return `${head} ${LIMIT_PROSE[label]}`;
}

/** `2026-09-12` → `12 September 2026`, the product's one date format. */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`;
}
