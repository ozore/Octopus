/**
 * M4 — the Requirements panel, as a model. `specs/04` §Screens, AC8, N4.
 *
 * **A field with no board answer is a rendered ROW, not a missing one.** That
 * is the whole design of this panel and the reason it exists as a model rather
 * than as JSX with `?.` sprinkled through it: the customer who reads "the board
 * does not publish this" learns something true and stops looking for it in a
 * competitor's product. A hidden row teaches nothing and a blank row reads as a
 * bug.
 *
 * The set of rows is therefore fixed by the ONTOLOGY, not by the data. Every
 * row below is emitted for every licence type; `published` decides whether it
 * carries a value and a source chip or the not-published wording and the note
 * recording what we read looking for it.
 *
 * `field` is the dotted knowledge-base path, and for the ten fields in
 * `DISCLOSED_SET` it is byte-identical to the entry there — that is what lets
 * `specs/04` AC8's content test walk `kb-data/` and assert the rendering for
 * every record without naming a single one of them.
 *
 * **Bond is the reason this is a spec and not a nicety.** Across the nine
 * committed records `bond.amount` is `unknown` 23 times out of 23
 * (`KNOWLEDGE_BASE.md` §9.1). Wave 1's wording promised "bond, with citations";
 * a developer building that would have shipped an empty panel 100% of the time.
 */

import { DISCLOSED_SET } from './kb/accessors';
import type { LicenceType, SourcedValue, StateTradeRecord } from './kb/types';
import { assessValue, type Citation } from './rules/assess';

export type RequirementGroup =
  | 'Continuing education'
  | 'Renewal'
  | 'Who must hold it'
  | 'Bond and insurance'
  | 'Getting the licence';

/** The wording `specs/04` AC8 fixes. One sentence, one place. */
export const NOT_PUBLISHED = 'the board does not publish this';

export type RequirementRow = {
  group: RequirementGroup;
  /** The dotted knowledge-base path. Matches `DISCLOSED_SET` where applicable. */
  field: string;
  label: string;
  /**
   * True only when the value is usable AND still asserted (the 180-day rule).
   * A published row carries a value and a source chip; an unpublished one
   * carries `NOT_PUBLISHED` and never a chip.
   */
  published: boolean;
  /** Rendered text of the value. Null whenever `published` is false. */
  display: string | null;
  /** The source chip. Null whenever `published` is false — AC8 asserts this. */
  citation: Citation | null;
  confidence: 'high' | 'medium' | 'low' | null;
  /** What we read looking for it, whether or not it was found. Always rendered. */
  note: string | null;
  /** In `DISCLOSED_SET`: never blocking, always named (`specs/08`). */
  disclosed: boolean;
  /** The board's own sentence, where there is one. */
  evidence: string | null;
};

const DISCLOSED = new Set<string>(DISCLOSED_SET);

const MONEY_UNITS = new Set([
  'usd',
  'USD',
  'per_occurrence_usd',
  'aggregate_usd',
  'usd_per_year',
]);

/**
 * A sourced value as a sentence.
 *
 * Formatting only. Nothing here computes, rounds, converts or infers: a value
 * the board did not publish never reaches this function, because `published` is
 * false and the row says so instead.
 */
export function displayValue(value: SourcedValue): string {
  const raw = value.value;
  const unit = value.unit ?? null;

  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (entry && typeof entry === 'object') {
          const e = entry as { hours?: number; subject?: string };
          if (typeof e.hours === 'number' && e.subject) return `${e.hours} h — ${e.subject}`;
          return JSON.stringify(entry);
        }
        return String(entry);
      })
      .join(' · ');
  }

  if (typeof raw === 'number') {
    if (unit && MONEY_UNITS.has(unit)) {
      const money = `$${raw.toLocaleString('en-US')}`;
      if (unit === 'per_occurrence_usd') return `${money} per occurrence`;
      if (unit === 'aggregate_usd') return `${money} aggregate`;
      if (unit === 'usd_per_year') return `${money} per year`;
      return money;
    }
    if (unit) return `${raw.toLocaleString('en-US')} ${unit.replace(/_/g, ' ')}`;
    return raw.toLocaleString('en-US');
  }

  return String(raw);
}

function row(
  group: RequirementGroup,
  field: string,
  label: string,
  value: SourcedValue | undefined | null,
  today: string,
): RequirementRow {
  const assessment = assessValue(value, today);
  // A stale value has stopped being asserted (`specs/14` invariant 2), so it is
  // NOT published either: the panel would otherwise show a chip whose date says
  // we last looked more than 180 days ago.
  const published = assessment.usable && assessment.effectiveStatus === 'verified';
  return {
    group,
    field,
    label,
    published,
    display: published && value ? displayValue(value) : null,
    citation: published ? assessment.citation : null,
    confidence: published ? assessment.confidence : null,
    note: assessment.note,
    disclosed: DISCLOSED.has(field),
    evidence: published ? assessment.citation.text : null,
  };
}

/**
 * Every requirement this licence type's board publishes, and every one it does
 * not — the same two sets `specs/08` promises for the paid Entry Pack, in the
 * same order, because a spec that promises more in the app than the paid
 * document does is where the next refund comes from.
 */
export function buildRequirements(
  record: StateTradeRecord,
  licenceType: LicenceType,
  today: string,
): RequirementRow[] {
  const ce = licenceType.continuing_education;
  const renewal = licenceType.renewal;

  return [
    // --- Continuing education ---------------------------------------------
    row('Continuing education', 'continuing_education.required', 'Required', ce.required, today),
    row('Continuing education', 'continuing_education.hours', 'Hours', ce.hours, today),
    row('Continuing education', 'continuing_education.period', 'Period', ce.period, today),
    row(
      'Continuing education',
      'continuing_education.subject_breakdown',
      'Subject breakdown',
      ce.subject_breakdown,
      today,
    ),
    row(
      'Continuing education',
      'continuing_education.approved_provider_rule',
      'Approved providers',
      ce.approved_provider_rule,
      today,
    ),
    row(
      'Continuing education',
      'continuing_education.delivery_constraint',
      'Delivery constraint',
      ce.delivery_constraint,
      today,
    ),
    row('Continuing education', 'continuing_education.carryover', 'Carry-over', ce.carryover, today),

    // --- Renewal ------------------------------------------------------------
    row('Renewal', 'renewal.cycle', 'Cycle', renewal.cycle, today),
    row('Renewal', 'renewal.expiry_rule', 'Expiry rule', renewal.expiry_rule, today),
    row('Renewal', 'renewal.grace_period', 'Grace period', renewal.grace_period, today),
    row('Renewal', 'renewal.late_fee', 'Late fee', renewal.late_fee, today),
    row('Renewal', 'renewal.fee', 'Renewal fee', renewal.fee, today),

    // --- Who must hold it ---------------------------------------------------
    row('Who must hold it', 'who_must_hold', 'Who must hold it', licenceType.who_must_hold, today),
    row('Who must hold it', 'scope_note', 'Scope', licenceType.scope_note, today),
    row(
      'Who must hold it',
      'business_entity.qualifying_individual_rule',
      'Qualifying individual',
      record.business_entity.qualifying_individual_rule,
      today,
    ),
    row(
      'Who must hold it',
      'business_entity.entity_registration',
      'Entity registration',
      record.business_entity.entity_registration,
      today,
    ),
    row(
      'Who must hold it',
      'business_entity.per_location_rule',
      'Per location',
      record.business_entity.per_location_rule,
      today,
    ),
    row(
      'Who must hold it',
      'business_entity.change_notification_deadline',
      'Replacing the qualifier',
      record.business_entity.change_notification_deadline,
      today,
    ),

    // --- Bond and insurance -------------------------------------------------
    // The four `insurance.*` rows and the two `bond.*` rows are DISCLOSED_SET
    // members: never blocking, always named, and `bond.amount` is unknown on
    // every one of the nine committed records.
    row('Bond and insurance', 'bond.required', 'Bond required', licenceType.bond.required, today),
    row('Bond and insurance', 'bond.amount', 'Bond amount', licenceType.bond.amount, today),
    row(
      'Bond and insurance',
      'insurance.general_liability',
      'General liability',
      licenceType.insurance.general_liability,
      today,
    ),
    row(
      'Bond and insurance',
      'insurance.property_damage',
      'Property damage',
      licenceType.insurance.property_damage,
      today,
    ),
    row('Bond and insurance', 'insurance.aggregate', 'Aggregate', licenceType.insurance.aggregate, today),
    row(
      'Bond and insurance',
      'insurance.workers_compensation',
      "Workers' compensation",
      licenceType.insurance.workers_compensation,
      today,
    ),

    // --- Getting the licence ------------------------------------------------
    row('Getting the licence', 'application_fee', 'Application fee', licenceType.application_fee, today),
    row('Getting the licence', 'exam.required', 'Exam required', licenceType.exam?.required, today),
    row('Getting the licence', 'exam.name', 'Exam', licenceType.exam?.name, today),
    row('Getting the licence', 'exam.fee', 'Exam fee', licenceType.exam?.fee, today),
    row(
      'Getting the licence',
      'experience.requirement',
      'Experience',
      licenceType.experience?.requirement,
      today,
    ),
    row('Getting the licence', 'typical_timeline', 'Typical processing time', record.typical_timeline, today),
  ];
}

export const REQUIREMENT_GROUPS: RequirementGroup[] = [
  'Renewal',
  'Continuing education',
  'Who must hold it',
  'Bond and insurance',
  'Getting the licence',
];

/** The board behind a licence type, for the "ask the board" link on every refusal. */
export function boardFor(record: StateTradeRecord, licenceType: LicenceType | null) {
  const board =
    record.boards.find((b) => b.board_id === licenceType?.board_id) ?? record.boards[0] ?? null;
  return board ? { name: board.name, url: board.url } : null;
}
