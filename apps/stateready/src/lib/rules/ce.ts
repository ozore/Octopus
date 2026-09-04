/**
 * Continuing education: the shortfall calculator.
 *
 * `hoursOutstanding` is NOT `required - recorded` (`specs/05` §CE rules). It is
 * computed per subject, then totalled, because "you need 3 more hours" and "you
 * need 1 hour of workers' compensation and 2 technical" are different
 * instructions and only one of them is actionable.
 *
 * ALLOCATION IS STRICT AND CONSERVATIVE, and that is a decision:
 *
 *  - a recorded hour satisfies a mandated subject only when its own subject
 *    matches that subject (normalised: case, punctuation and whitespace folded);
 *  - hours that match nothing go to an **unallocated pool**, and the pool
 *    satisfies only the *residual* requirement — `hours - Σ(breakdown hours)` —
 *    never a named mandate;
 *  - so Florida's fourteen hours taken entirely as "general" satisfy nothing,
 *    which is the failure the record's own note exists to describe: *"A licence
 *    holder who takes 14 hours of general construction CE has still failed to
 *    renew."*
 *
 * The alternative — guessing which mandate an unlabelled hour was meant for —
 * errs in the only direction that costs a customer their licence. The product
 * asks which subject instead; the licence type's own subject list is what the
 * UI offers.
 *
 * DELIVERY CONSTRAINTS ARE STATED, NOT COMPUTED. North Carolina electrical
 * requires "at least half the hours ... by in-person classroom or seminar
 * attendance", and the ontology carries that as prose. Turning "at least half"
 * into a number is an inference from the board's sentence, which is the class of
 * inference this product refuses; so the constraint renders verbatim beside the
 * meter (`UX.md` S13: *the rule is displayed next to the meter, always*) and a
 * classroom shortfall is computed only if the knowledge base ever carries a
 * machine-readable `min_classroom_fraction:<0..1>` token. Recorded as a
 * knowledge-base request in `BUILD.md`.
 */

import type { CeSubject, ContinuingEducation } from '../kb/types';

export type CeRecordInput = {
  hours: number;
  subject?: string | null;
  deliveryMode?: 'classroom' | 'online' | 'unknown' | null;
  completedOn?: string | null;
};

export type SubjectShortfall = { subject: string; required: number; recorded: number; outstanding: number };

export type CeComputation = {
  required: boolean;
  hoursRequired: number;
  hoursRecorded: number;
  hoursOutstanding: number;
  subjectShortfall: SubjectShortfall[];
  /** Hours recorded against no mandated subject, available only to the residual requirement. */
  unallocatedHours: number;
  /** `hours - Σ(breakdown)`; the part of the requirement with no named subject. */
  residualRequired: number;
  residualOutstanding: number;
  classroomHours: number;
  deliveryConstraintText: string | null;
  carryoverText: string | null;
  approvedProviderText: string | null;
};

function normaliseSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asSubjects(value: unknown): CeSubject[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (entry === null || typeof entry !== 'object') return [];
    const e = entry as Record<string, unknown>;
    if (typeof e['hours'] !== 'number' || typeof e['subject'] !== 'string') return [];
    return [{ hours: e['hours'], subject: e['subject'] }];
  });
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function computeCe(ce: ContinuingEducation, records: readonly CeRecordInput[], carriedInHours = 0): CeComputation {
  const required = ce.required.value === true;
  const hoursRequired = typeof ce.hours.value === 'number' ? ce.hours.value : 0;
  const breakdown = asSubjects(ce.subject_breakdown?.value);

  const hoursRecorded = records.reduce((sum, r) => sum + (Number.isFinite(r.hours) ? r.hours : 0), 0);
  const classroomHours = records
    .filter((r) => r.deliveryMode === 'classroom')
    .reduce((sum, r) => sum + r.hours, 0);

  const buckets = breakdown.map((b) => ({ ...b, key: normaliseSubject(b.subject), recorded: 0 }));
  let unallocated = carriedInHours;

  for (const record of records) {
    const key = record.subject ? normaliseSubject(record.subject) : '';
    const bucket = key ? buckets.find((b) => b.key === key) : undefined;
    if (bucket) bucket.recorded += record.hours;
    else unallocated += record.hours;
  }

  const subjectShortfall: SubjectShortfall[] = buckets
    .map((b) => ({
      subject: b.subject,
      required: b.hours,
      recorded: b.recorded,
      outstanding: Math.max(0, b.hours - b.recorded),
    }))
    .filter((b) => b.outstanding > 0);

  const breakdownTotal = buckets.reduce((sum, b) => sum + b.hours, 0);
  const residualRequired = Math.max(0, hoursRequired - breakdownTotal);
  const residualOutstanding = Math.max(0, residualRequired - unallocated);

  const hoursOutstanding = required
    ? subjectShortfall.reduce((sum, s) => sum + s.outstanding, 0) + residualOutstanding
    : 0;

  return {
    required,
    hoursRequired,
    hoursRecorded,
    hoursOutstanding,
    subjectShortfall: required ? subjectShortfall : [],
    unallocatedHours: unallocated,
    residualRequired,
    residualOutstanding,
    classroomHours,
    deliveryConstraintText: textOf(ce.delivery_constraint?.value),
    carryoverText: textOf(ce.carryover?.value),
    approvedProviderText: textOf(ce.approved_provider_rule?.value),
  };
}
