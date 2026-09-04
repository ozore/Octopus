/**
 * M5 — the rules engine. `specs/05`.
 *
 * **Pure and synchronous.** Licence + knowledge-base record + today's civil date
 * in; deadlines out. No I/O, no database, no clock, no `Date.now()`. That is
 * what makes the whole thing table-testable against `kb-data/`, and it means a
 * wrong deadline is reproducible from two JSON blobs in a bug report
 * (`specs/05`, and D6: this module is built and proved before any schema
 * exists).
 *
 * Four invariants, all tested:
 *
 *  1. **No deadline without a citation.** A derived deadline always carries the
 *     URL and the evidence fragment of the value that produced it. The database
 *     enforces the same thing with a check constraint (`schema.ts`).
 *  2. **The honesty rule** — `assess.ts`. Medium-confidence verified values are
 *     allowed through and are never allowed to appear bare.
 *  3. **Unknown means silent.** A null knowledge-base value produces NO deadline
 *     — never a guessed one — and one `explanation` saying what we read and why
 *     we could not derive it.
 *  4. **Deterministic.** Same inputs, same output, asserted by the golden set.
 */

import type { Confidence, ExpiryOverride, LicenceType, StateTradeRecord } from '../kb/types';
import { assessValue, judgeGoverning, type Citation, type ValueAssessment } from './assess';
import { computeCe, type CeComputation, type CeRecordInput } from './ce';
import {
  addBusinessDays,
  addDays,
  addMonths,
  compareCivil,
  nextMonthDay,
  nextMonthDayWithParity,
  parseCivil,
  type CivilDate,
} from './dates';
import { parseCeWindow, parseExpiryRule } from './tokens';

export type DeadlineKind = 'renewal' | 'ce' | 'bond' | 'insurance' | 'qualifier_replacement' | 'other';

export type TraceStep = { label: string; detail: string };

export type DerivedDeadline = {
  kind: DeadlineKind;
  dueOn: CivilDate;
  source: 'derived' | 'entered';
  /** The `expiry_rule` token used, or the CE window rule. Null for entered dates. */
  rule: string | null;
  kbRecordId: string;
  kbLicenceTypeId: string | null;
  citation: Citation;
  confidence: Confidence;
  needsHumanCheck: boolean;
  /** Machine-readable reasons the flag fired. Empty when it did not. */
  flagReasons: string[];
  /** Notes that MUST render wherever this date appears (`specs/05` invariant 2). */
  notes: string[];
  detail: Record<string, unknown>;
  /** The full derivation trace, for `explainDeadline` / "why this date?". */
  trace: TraceStep[];
};

/** Why a deadline could not be derived. Never a date; always what we read. */
export type Explanation = {
  kind: DeadlineKind | 'coverage';
  reason:
    | 'no_kb_record'
    | 'licence_type_not_in_kb'
    | 'unknown_value'
    | 'unimplemented_rule'
    | 'missing_issue_date'
    | 'ce_not_required';
  message: string;
  citation: Citation | null;
  note: string | null;
};

export type LicenceInput = {
  state: string;
  trade: string;
  /** e.g. `tx.hvac.acr_contractor_class_a`; null when the state is not covered. */
  kbLicenceTypeId: string | null;
  issuedOn: CivilDate | null;
  /** What the customer typed, if anything. Never overwritten (`specs/04`). */
  expiresOn?: CivilDate | null;
  ceRecords?: readonly CeRecordInput[];
  /** Surplus hours carried in from a previous period, where the state allows it. */
  ceCarriedInHours?: number;
  /** Set when a qualifier has left; opens the replacement clock (`specs/05` §Event deadlines). */
  qualifierDisassociatedOn?: CivilDate | null;
};

export type DerivationResult = {
  renewal: DerivedDeadline | null;
  ce: DerivedDeadline | null;
  events: DerivedDeadline[];
  explanations: Explanation[];
  ceComputation: CeComputation | null;
  /** Present when the customer's own expiry date disagrees with the derived one. */
  expiryConflict: { entered: CivilDate; derived: CivilDate } | null;
};

const NO_CITATION: Citation = { url: null, text: null, title: null, lastVerified: null };

function findLicenceType(record: StateTradeRecord, id: string | null): LicenceType | null {
  if (!id) return null;
  return record.licence_types.find((lt) => lt.licence_type_id === id) ?? null;
}

function pickOverride(licenceType: LicenceType, cycleYear: number): ExpiryOverride | null {
  return (licenceType.expiry_overrides ?? []).find((o) => o.cycle_year === cycleYear) ?? null;
}

function citationFrom(assessments: ValueAssessment[]): Citation {
  // The citation is the first governing value that has one: for `anniversary`
  // that is the token (the sentence saying "valid for a period of 1 year"),
  // which is the sentence a customer asked "why this date?" wants to read.
  return assessments.find((a) => a.citation.url)?.citation ?? NO_CITATION;
}

/**
 * The renewal date, from the `expiry_rule` token, the cycle and the issue date.
 */
function deriveRenewal(
  record: StateTradeRecord,
  licenceType: LicenceType,
  input: LicenceInput,
  today: CivilDate,
  explanations: Explanation[],
): DerivedDeadline | null {
  const ruleValue = licenceType.renewal.expiry_rule;
  const cycleValue = licenceType.renewal.cycle;
  const ruleAssessment = assessValue(ruleValue, today);
  const cycleAssessment = assessValue(cycleValue, today);

  if (!ruleAssessment.usable) {
    explanations.push({
      kind: 'renewal',
      reason: 'unknown_value',
      message: `We could not derive a renewal date for ${licenceType.name}: the board's expiry rule is not established in our record.`,
      citation: ruleAssessment.citation,
      note: ruleAssessment.note,
    });
    return null;
  }

  const rule = parseExpiryRule(ruleValue.value);
  if (!rule) {
    explanations.push({
      kind: 'renewal',
      reason: 'unimplemented_rule',
      message: `We hold a renewal rule for ${licenceType.name} that this version of StateReady does not yet compute (${String(ruleValue.value)}).`,
      citation: ruleAssessment.citation,
      note: ruleAssessment.note,
    });
    return null;
  }

  if (!input.issuedOn) {
    if (rule.kind === 'anniversary') {
      explanations.push({
        kind: 'renewal',
        reason: 'missing_issue_date',
        message: `${record.state} ${licenceType.name} renews on the anniversary of its issue date. Add the issue date and we will work out the expiry.`,
        citation: ruleAssessment.citation,
        note: ruleAssessment.note,
      });
      return null;
    }
  }

  const governing: ValueAssessment[] = [ruleAssessment];
  const trace: TraceStep[] = [
    { label: 'Rule', detail: `${record.state_name} · ${licenceType.name} · ${String(ruleValue.value)}` },
  ];

  let dueOn: CivilDate;
  const anchor = input.issuedOn ?? today;

  if (rule.kind === 'anniversary') {
    if (!cycleAssessment.usable || typeof cycleValue.value !== 'number') {
      explanations.push({
        kind: 'renewal',
        reason: 'unknown_value',
        message: `${licenceType.name} renews on its anniversary, but the length of the licence term is not established in our record.`,
        citation: cycleAssessment.citation,
        note: cycleAssessment.note,
      });
      return null;
    }
    governing.push(cycleAssessment);
    dueOn = addMonths(anchor, cycleValue.value);
    trace.push({ label: 'Arithmetic', detail: `${anchor} + ${cycleValue.value} months (day clamped to month end) = ${dueOn}` });
  } else if (rule.kind === 'fixed_date') {
    dueOn = nextMonthDay(anchor, rule.month, rule.day);
    trace.push({ label: 'Arithmetic', detail: `first ${String(rule.month).padStart(2, '0')}-${String(rule.day).padStart(2, '0')} after ${anchor} = ${dueOn}` });
  } else {
    dueOn = nextMonthDayWithParity(anchor, rule.month, rule.day, rule.parity);
    trace.push({
      label: 'Arithmetic',
      detail: `first ${String(rule.month).padStart(2, '0')}-${String(rule.day).padStart(2, '0')} in an ${rule.parity} year after ${anchor} = ${dueOn}`,
    });
  }

  // Board-announced date rolls: an override for the derived cycle year WINS over
  // the token and carries its own citation (`specs/05` §M13).
  let citation = citationFrom(governing);
  let ruleToken = String(ruleValue.value);
  const override = pickOverride(licenceType, parseCivil(dueOn).year);
  if (override) {
    trace.push({
      label: 'Board announcement',
      detail: `${record.state_name}'s rule puts this on ${dueOn}; the board has published an extension to ${override.date}.`,
    });
    dueOn = override.date;
    ruleToken = `${ruleToken} + expiry_override:${override.cycle_year}`;
    citation = {
      url: override.source_url ?? citation.url,
      text: override.evidence ?? citation.text,
      title: citation.title,
      lastVerified: override.last_verified ?? citation.lastVerified,
    };
  }

  const verdict = judgeGoverning(governing);
  trace.push({
    label: 'Confidence',
    detail: verdict.needsHumanCheck
      ? `flagged for checking (${verdict.reasons.join(', ')})`
      : `${verdict.confidence} confidence, verified at the board's own page`,
  });

  return {
    kind: 'renewal',
    dueOn,
    source: 'derived',
    rule: ruleToken,
    kbRecordId: record.record_id,
    kbLicenceTypeId: licenceType.licence_type_id,
    citation,
    confidence: verdict.confidence,
    needsHumanCheck: verdict.needsHumanCheck,
    flagReasons: verdict.reasons,
    notes: verdict.notes,
    detail: {
      // The VALUE and the board's own sentence, together. North Carolina's
      // grace period is the number `0`, and the number on its own is not the
      // finding — "Contrary to popular belief, there is NO GRACE PERIOD" is.
      gracePeriod: licenceType.renewal.grace_period?.value ?? null,
      gracePeriodEvidence: licenceType.renewal.grace_period?.evidence ?? null,
      gracePeriodNote: licenceType.renewal.grace_period?.note ?? null,
      lateFee: licenceType.renewal.late_fee?.value ?? null,
      lateFeeEvidence: licenceType.renewal.late_fee?.evidence ?? null,
      renewalFee: licenceType.renewal.fee?.value ?? null,
      renewalFeeStatus: licenceType.renewal.fee?.status ?? 'unknown',
      overrideApplied: override ? override.cycle_year : null,
    },
    trace,
  };
}

function deriveCe(
  record: StateTradeRecord,
  licenceType: LicenceType,
  input: LicenceInput,
  today: CivilDate,
  renewal: DerivedDeadline | null,
  explanations: Explanation[],
): { deadline: DerivedDeadline | null; computation: CeComputation } {
  const ce = licenceType.continuing_education;
  const computation = computeCe(ce, input.ceRecords ?? [], input.ceCarriedInHours ?? 0);
  const requiredAssessment = assessValue(ce.required, today);
  const hoursAssessment = assessValue(ce.hours, today);
  const periodAssessment = assessValue(ce.period, today);

  if (!requiredAssessment.usable) {
    explanations.push({
      kind: 'ce',
      reason: 'unknown_value',
      message: `We could not establish whether ${licenceType.name} carries a continuing-education requirement.`,
      citation: requiredAssessment.citation,
      note: requiredAssessment.note,
    });
    return { deadline: null, computation };
  }

  if (ce.required.value === false) {
    // A verified `false` is a FINDING, not a gap: the board says so in terms, and
    // the customer is shown the sentence (`specs/05` AC6).
    explanations.push({
      kind: 'ce',
      reason: 'ce_not_required',
      message: `${record.state_name} does not require continuing education for ${licenceType.name}.`,
      citation: requiredAssessment.citation,
      note: hoursAssessment.note ?? requiredAssessment.note,
    });
    return { deadline: null, computation };
  }

  if (!hoursAssessment.usable) {
    explanations.push({
      kind: 'ce',
      reason: 'unknown_value',
      message: `${licenceType.name} requires continuing education, but the number of hours is not established in our record.`,
      citation: hoursAssessment.citation,
      note: hoursAssessment.note,
    });
    return { deadline: null, computation };
  }

  const window = parseCeWindow(ce.period.value);
  const governing: ValueAssessment[] = [requiredAssessment, hoursAssessment];
  const trace: TraceStep[] = [
    { label: 'Requirement', detail: `${String(ce.hours.value)} hours for ${licenceType.name}` },
  ];

  let dueOn: CivilDate | null;
  let ruleToken: string;
  if (window.kind === 'calendar_window') {
    governing.push(periodAssessment);
    dueOn = nextMonthDay(today, window.endMonth, window.endDay);
    ruleToken = `calendar_window:${String(window.endMonth).padStart(2, '0')}-${String(window.endDay).padStart(2, '0')}`;
    trace.push({
      label: 'Window',
      detail: `The CE period is a calendar window, not the licence year: it closes ${dueOn}.`,
    });
  } else {
    // No machine-readable window: the CE obligation falls due with the licence.
    dueOn = renewal?.dueOn ?? null;
    ruleToken = 'licence_term';
    trace.push({
      label: 'Window',
      detail: 'The hours are due by the licence renewal date; the board publishes no separate CE window we can compute.',
    });
    if (!dueOn) {
      explanations.push({
        kind: 'ce',
        reason: 'unknown_value',
        message: `${licenceType.name} requires ${String(ce.hours.value)} hours of continuing education. We cannot put a date on it until we can derive the renewal date.`,
        citation: hoursAssessment.citation,
        note: hoursAssessment.note,
      });
      return { deadline: null, computation };
    }
  }

  const verdict = judgeGoverning(governing);
  const notes = [...verdict.notes];
  if (window.kind === 'licence_term' && periodAssessment.note) notes.push(periodAssessment.note);

  return {
    deadline: {
      kind: 'ce',
      dueOn,
      source: 'derived',
      rule: ruleToken,
      kbRecordId: record.record_id,
      kbLicenceTypeId: licenceType.licence_type_id,
      citation: citationFrom(governing),
      confidence: verdict.confidence,
      needsHumanCheck: verdict.needsHumanCheck,
      flagReasons: verdict.reasons,
      notes: [...new Set(notes)],
      detail: {
        hoursRequired: computation.hoursRequired,
        hoursRecorded: computation.hoursRecorded,
        hoursOutstanding: computation.hoursOutstanding,
        subjectShortfall: computation.subjectShortfall,
        deliveryConstraint: computation.deliveryConstraintText,
        carryover: computation.carryoverText,
        approvedProviderRule: computation.approvedProviderText,
      },
      trace,
    },
    computation,
  };
}

function deriveQualifierEvent(
  record: StateTradeRecord,
  licenceType: LicenceType | null,
  input: LicenceInput,
  today: CivilDate,
  explanations: Explanation[],
): DerivedDeadline | null {
  if (!input.qualifierDisassociatedOn) return null;
  const value = record.business_entity.change_notification_deadline;
  const assessment = assessValue(value, today);
  if (!assessment.usable || typeof value?.value !== 'number') {
    explanations.push({
      kind: 'qualifier_replacement',
      reason: 'unknown_value',
      message: `${record.state_name} may require a replacement qualifier to be named within a fixed time, but we could not establish the deadline from a published page.`,
      citation: assessment.citation,
      note: assessment.note,
    });
    return null;
  }

  // `business_days` is Texas electrical's unit and it is the one that catches
  // people out: thirty business days is six weeks, not a month.
  const unit = value.unit ?? 'days';
  const dueOn =
    unit === 'business_days'
      ? addBusinessDays(input.qualifierDisassociatedOn, value.value)
      : addDays(input.qualifierDisassociatedOn, value.value);

  const verdict = judgeGoverning([assessment]);
  return {
    kind: 'qualifier_replacement',
    dueOn,
    source: 'derived',
    rule: `change_notification_deadline:${value.value}:${unit}`,
    kbRecordId: record.record_id,
    kbLicenceTypeId: licenceType?.licence_type_id ?? null,
    citation: assessment.citation,
    confidence: verdict.confidence,
    needsHumanCheck: verdict.needsHumanCheck,
    flagReasons: verdict.reasons,
    notes: verdict.notes,
    detail: { disassociatedOn: input.qualifierDisassociatedOn, window: value.value, unit },
    trace: [
      { label: 'Trigger', detail: `qualifier left on ${input.qualifierDisassociatedOn}` },
      { label: 'Rule', detail: `${value.value} ${unit.replace('_', ' ')} to name a replacement` },
      { label: 'Arithmetic', detail: `${input.qualifierDisassociatedOn} + ${value.value} ${unit.replace('_', ' ')} = ${dueOn}` },
    ],
  };
}


/**
 * The customer's own date, as a deadline row.
 *
 * A licence in a state we do not cover, or of a type we hold no rule for, still
 * has a date the customer typed — and that date is the thing they came to be
 * reminded about. Emitting nothing here would mean the promise "we will still
 * track the dates you enter" was false: no deadline row means no alert, and the
 * dashboard would render the licence NOT TRACKED while the customer was looking
 * at the expiry they had just typed in.
 *
 * It carries NO citation, because there is none — they are the source — and the
 * database check constraint allows exactly that for `source = 'entered'`.
 */
function enteredRenewal(
  input: LicenceInput,
  record: StateTradeRecord | null,
  licenceType: LicenceType | null,
): DerivedDeadline | null {
  if (!input.expiresOn) return null;
  return {
    kind: 'renewal',
    dueOn: input.expiresOn,
    source: 'entered',
    rule: null,
    kbRecordId: record?.record_id ?? `${input.state.toLowerCase()}.${input.trade}`,
    kbLicenceTypeId: licenceType?.licence_type_id ?? null,
    citation: NO_CITATION,
    confidence: 'high',
    needsHumanCheck: false,
    flagReasons: [],
    notes: [],
    detail: { enteredByCustomer: true },
    trace: [{ label: 'Source', detail: 'You entered this expiry date; we have kept it.' }],
  };
}

/**
 * THE FUNCTION. Everything else in this module is a helper for it.
 */
export function derive(
  input: LicenceInput,
  record: StateTradeRecord | null,
  today: CivilDate,
): DerivationResult {
  const explanations: Explanation[] = [];

  if (!record) {
    explanations.push({
      kind: 'coverage',
      reason: 'no_kb_record',
      message: `We do not hold ${input.trade} rules for ${input.state} yet, so we cannot derive deadlines for this licence. We will still track the dates you enter.`,
      citation: null,
      note: null,
    });
    return {
      renewal: enteredRenewal(input, null, null),
      ce: null,
      events: [],
      explanations,
      ceComputation: null,
      expiryConflict: null,
    };
  }

  const licenceType = findLicenceType(record, input.kbLicenceTypeId);
  if (!licenceType) {
    explanations.push({
      kind: 'coverage',
      reason: 'licence_type_not_in_kb',
      message: `This licence is recorded as a type we do not hold rules for in ${record.state_name} ${record.trade}. We will track the dates you enter.`,
      citation: null,
      note: null,
    });
    const events = deriveQualifierEvent(record, null, input, today, explanations);
    return {
      renewal: enteredRenewal(input, record, null),
      ce: null,
      events: events ? [events] : [],
      explanations,
      ceComputation: null,
      expiryConflict: null,
    };
  }

  const renewal = deriveRenewal(record, licenceType, input, today, explanations);
  const { deadline: ce, computation } = deriveCe(record, licenceType, input, today, renewal, explanations);
  const qualifier = deriveQualifierEvent(record, licenceType, input, today, explanations);

  // The customer's own date is never overwritten (`specs/04` §Edge cases): both
  // are shown and the disagreement is surfaced, because it is usually a typo and
  // finding it is worth the subscription.
  let expiryConflict: DerivationResult['expiryConflict'] = null;
  let effectiveRenewal = renewal;
  if (input.expiresOn) {
    if (renewal && compareCivil(input.expiresOn, renewal.dueOn) !== 0) {
      expiryConflict = { entered: input.expiresOn, derived: renewal.dueOn };
    }
    effectiveRenewal = {
      kind: 'renewal',
      dueOn: input.expiresOn,
      source: 'entered',
      rule: renewal?.rule ?? null,
      kbRecordId: record.record_id,
      kbLicenceTypeId: licenceType.licence_type_id,
      citation: renewal?.citation ?? NO_CITATION,
      confidence: renewal?.confidence ?? 'high',
      needsHumanCheck: renewal?.needsHumanCheck ?? false,
      flagReasons: renewal?.flagReasons ?? [],
      notes: renewal?.notes ?? [],
      detail: { ...(renewal?.detail ?? {}), enteredByCustomer: true },
      trace: [
        { label: 'Source', detail: 'You entered this expiry date; we have kept it.' },
        ...(renewal ? [{ label: `${record.state_name}'s rule would give`, detail: renewal.dueOn }] : []),
      ],
    };
  }

  return {
    renewal: effectiveRenewal,
    ce,
    events: qualifier ? [qualifier] : [],
    explanations,
    ceComputation: computation,
    expiryConflict,
  };
}

/** Every deadline the derivation produced, in due-date order. */
export function allDeadlines(result: DerivationResult): DerivedDeadline[] {
  return [result.renewal, result.ce, ...result.events]
    .filter((d): d is DerivedDeadline => d !== null)
    .sort((a, b) => compareCivil(a.dueOn, b.dueOn));
}
