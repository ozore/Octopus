/**
 * Fixture builders for the engine's golden tests.
 *
 * Hand-writing a `coi.v1` payload is 200 lines of `{value, raw, page,
 * source_text, confidence}`, and a test nobody can read is a test nobody
 * maintains. These builders produce SCHEMA-SHAPED payloads — every value object
 * has all five keys, optionality is a null value and never an absent key — so
 * what the tests exercise is the same shape the extractor emits.
 *
 * They are deliberately NOT the golden set. The golden set is 17 real documents
 * in `tests/fixtures/coi/` with hand-labelled expected values (specs/03 §15);
 * these are the rule-by-rule table tests from `specs/05` §8 and §9.
 */

import type {
  BoolField,
  CoiExtraction,
  Coverage,
  CoverageType,
  DateField,
  EndorsementMention,
  LimitLabel,
  MoneyField,
  Requirement,
  RequirementSet,
  StringField,
} from '../../src/lib/engine';

let page = 1;

export function str(value: string | null, raw = value, confidence = 0.97): StringField {
  return { value, raw, page, source_text: raw, confidence };
}
export function date(value: string | null, raw = value, confidence = 0.97): DateField {
  return { value, raw, page, source_text: raw, confidence };
}
export function money(value: number | null, raw: string | null = value === null ? null : String(value), confidence = 0.97): MoneyField {
  return { value, raw, page, source_text: raw, confidence };
}
export function bool(value: boolean | null, raw: string | null = null, confidence = 0.97): BoolField {
  return { value, raw, page, source_text: raw, confidence };
}

export function limit(label: LimitLabel, amount: number | null, raw?: string | null, labelRaw?: string) {
  return {
    label,
    label_raw: str(labelRaw ?? label.replace(/_/g, ' ').toUpperCase()),
    amount: money(amount, raw === undefined ? (amount === null ? null : String(amount)) : raw),
  };
}

export function coverage(
  type: CoverageType,
  options: {
    limits?: ReturnType<typeof limit>[];
    addlInsd?: string | null;
    subrWvd?: string | null;
    eff?: string | null;
    exp?: string | null;
    formBasis?: string | null;
    aggregateAppliesPer?: string | null;
    typeLabelRaw?: string | null;
    policyNumber?: string | null;
    insrLetter?: string | null;
    wcOfficerExcluded?: string | null;
  } = {},
): Coverage {
  return {
    insr_letter: str(options.insrLetter ?? 'A'),
    type,
    type_label_raw: str(options.typeLabelRaw ?? type.replace(/_/g, ' ').toUpperCase()),
    addl_insd: str(options.addlInsd ?? null),
    subr_wvd: str(options.subrWvd ?? null),
    policy_number: str(options.policyNumber ?? 'POL-0001'),
    policy_eff: date(options.eff ?? '2026-01-01'),
    policy_exp: date(options.exp === undefined ? '2027-01-01' : options.exp),
    form_basis: str(options.formBasis ?? null),
    aggregate_applies_per: str(options.aggregateAppliesPer ?? null),
    wc_officer_excluded: str(options.wcOfficerExcluded ?? null),
    limits: options.limits ?? [],
  };
}

export function extraction(options: {
  coverages?: Coverage[];
  insuredName?: string | null;
  insuredAddress?: string | null;
  holder?: string | null;
  forms?: EndorsementMention[];
  descriptionOfOperations?: string | null;
  formEdition?: CoiExtraction['form_edition'];
} = {}): CoiExtraction {
  return {
    schema_version: 'coi.v1',
    document_kind: 'acord_25',
    form_edition: options.formEdition ?? '2016/03',
    certificate_date: date('2026-01-05'),
    producer: {
      name: str('Harbour & Vale Insurance Services'),
      address: str('900 Bay Street, Austin TX 78701'),
      contact_name: str(null),
      phone: str(null),
      fax: str(null),
      email: str(null),
    },
    insured: {
      name: str(options.insuredName === undefined ? 'ACME ROOFING, INC.' : options.insuredName),
      address: str(options.insuredAddress === undefined ? '12 Mill Road, Austin TX 78702' : options.insuredAddress),
    },
    insurers: [{ letter: 'A', name: str('Northbridge Casualty'), naic: str('12345') }],
    coverages: options.coverages ?? [],
    description_of_operations: str(options.descriptionOfOperations ?? null),
    endorsement_forms_mentioned: options.forms ?? [],
    certificate_holder: str(options.holder === undefined ? 'RIVERGATE PROPERTY MANAGEMENT' : options.holder),
    authorized_representative_present: bool(true),
    acord_101_attached: bool(false),
    notes: '',
  };
}

export function mention(
  form_number: string,
  context: EndorsementMention['context'],
  conditional = false,
  edition: string | null = null,
): EndorsementMention {
  return { form_number, edition, context, conditional };
}

let nextId = 0;
export function requirement(partial: Partial<Requirement> & Pick<Requirement, 'kind'>): Requirement {
  nextId += 1;
  return {
    id: partial.id ?? `req_${nextId}`,
    kind: partial.kind,
    coverage: partial.coverage ?? null,
    limitLabel: partial.limitLabel ?? null,
    minAmount: partial.minAmount ?? null,
    combinable: partial.combinable ?? false,
    endorsementKey: partial.endorsementKey ?? null,
    acceptsForms: partial.acceptsForms ?? [],
    condition: partial.condition ?? null,
    otherLabel: partial.otherLabel ?? null,
    label: partial.label ?? null,
    severity: partial.severity ?? 'blocking',
    note: partial.note ?? null,
    sortOrder: partial.sortOrder ?? nextId,
  };
}

export function requirementSet(requirements: Requirement[], version = 1): RequirementSet {
  return { id: 'set_test', name: 'Test set', audience: 'gc', version, requirements };
}

export const VENDOR = { name: 'Acme Roofing Inc' };
export const ORG = { entityBlock: 'Rivergate Property Management\n900 Bay Street\nAustin TX 78701' };

/** A date far enough out that no test accidentally trips the expiring window. */
export const TODAY = '2026-06-01';
export const FAR_EXPIRY = '2027-06-30';
