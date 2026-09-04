/**
 * The engine's two inputs and one output, as types.
 *
 * The extraction half mirrors `specs/schema/coi.v1.schema.json` exactly — every
 * value object carries `value`, `raw`, `page`, `source_text` and `confidence`,
 * and optionality is a NULL VALUE, never an absent key. That is the schema's
 * rule and it matters here: `amount === null` with `raw === 'Excluded'` is the
 * difference between `undetermined` and a confident, wrong `gap` (specs/05 A7).
 *
 * The requirement half mirrors `specs/02` §4's `requirements` table, in the
 * runtime shape a repository hands the engine.
 */

// ---------------------------------------------------------------------------
// Extraction — coi.v1
// ---------------------------------------------------------------------------

export type StringField = {
  value: string | null;
  raw: string | null;
  page: number | null;
  source_text: string | null;
  confidence: number;
};

export type DateField = StringField;

export type MoneyField = {
  value: number | null;
  raw: string | null;
  page: number | null;
  source_text: string | null;
  confidence: number;
};

export type BoolField = {
  value: boolean | null;
  raw: string | null;
  page: number | null;
  source_text: string | null;
  confidence: number;
};

export const COVERAGE_TYPES = [
  'general_liability',
  'automobile_liability',
  'umbrella_liability',
  'excess_liability',
  'workers_compensation',
  'other',
] as const;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export const LIMIT_LABELS = [
  'each_occurrence',
  'damage_to_rented_premises',
  'med_exp',
  'personal_and_adv_injury',
  'general_aggregate',
  'products_comp_op_agg',
  'combined_single_limit',
  'bodily_injury_per_person',
  'bodily_injury_per_accident',
  'property_damage',
  'umbrella_each_occurrence',
  'umbrella_aggregate',
  'ded_retention',
  'el_each_accident',
  'el_disease_ea_employee',
  'el_disease_policy_limit',
  'other',
] as const;
export type LimitLabel = (typeof LIMIT_LABELS)[number];

export const FORM_EDITIONS = ['2010/05', '2014/01', '2016/03', '2025/12', 'unknown'] as const;
export type FormEdition = (typeof FORM_EDITIONS)[number];

export const DOCUMENT_KINDS = [
  'acord_25',
  'acord_27_or_28',
  'endorsement',
  'other',
  'unreadable',
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type CoverageLimit = {
  label: LimitLabel;
  label_raw: StringField;
  amount: MoneyField;
};

export type Coverage = {
  insr_letter: StringField;
  type: CoverageType;
  type_label_raw: StringField;
  addl_insd: StringField;
  subr_wvd: StringField;
  policy_number: StringField;
  policy_eff: DateField;
  policy_exp: DateField;
  form_basis: StringField;
  aggregate_applies_per: StringField;
  wc_officer_excluded: StringField;
  limits: CoverageLimit[];
};

export type EndorsementMention = {
  form_number: string;
  edition: string | null;
  context: 'description_of_operations' | 'attached_endorsement_page' | 'other';
  conditional: boolean;
};

export type Insurer = { letter: string; name: StringField; naic: StringField };

export type CoiExtraction = {
  schema_version: 'coi.v1';
  document_kind: DocumentKind;
  form_edition: FormEdition;
  certificate_date: DateField;
  producer: {
    name: StringField;
    address: StringField;
    contact_name: StringField;
    phone: StringField;
    fax: StringField;
    email: StringField;
  };
  insured: { name: StringField; address: StringField };
  insurers: Insurer[];
  coverages: Coverage[];
  description_of_operations: StringField;
  endorsement_forms_mentioned: EndorsementMention[];
  certificate_holder: StringField;
  authorized_representative_present: BoolField;
  acord_101_attached: BoolField;
  notes: string;
};

// ---------------------------------------------------------------------------
// Requirements — specs/02 §4
// ---------------------------------------------------------------------------

export const REQUIREMENT_KINDS = [
  'limit',
  'coverage_present',
  'endorsement',
  'policy_condition',
  'carrier',
] as const;
export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];

export const ENDORSEMENT_KEYS = [
  'additional_insured_ongoing',
  'additional_insured_completed',
  'primary_non_contributory',
  'waiver_of_subrogation_gl',
  'waiver_of_subrogation_wc',
  'auto_additional_insured',
  'auto_waiver_of_subrogation',
] as const;
export type EndorsementKey = (typeof ENDORSEMENT_KEYS)[number];

export type RequirementCondition = {
  formBasis?: 'occurrence' | 'claims_made';
  aggregateAppliesPer?: 'policy' | 'project' | 'loc';
  maxSir?: number;
  wcStopGapStates?: string[];
  amBestMin?: string;
  financialSizeMin?: string;
  /**
   * A contractual condition Certly does not read at launch — MCS-90, CA 99 48.
   * It resolves to `not_checked` and is NAMED in the report rather than
   * silently dropped, which is the same honesty `not_checked` exists for
   * (`specs/05` §2).
   */
  manualCheck?: string;
};

export type Requirement = {
  id: string;
  kind: RequirementKind;
  coverage: CoverageType | null;
  limitLabel: LimitLabel | null;
  minAmount: number | null;
  /** May be met by this coverage + umbrella/excess together (KB §B.0). */
  combinable: boolean;
  endorsementKey: EndorsementKey | null;
  /** ALWAYS a list (KB §B.0). ISO-shaped numbers and carrier proprietary forms. */
  acceptsForms: string[];
  condition: RequirementCondition | null;
  /** Matched against `coverages[].type_label_raw` when `coverage === 'other'`. */
  otherLabel: string | null;
  /** Overrides the generated row label, for a condition Certly names but does
   *  not read (e.g. "MCS-90"). Null for every ordinary row. */
  label: string | null;
  /** `advisory` rows appear in reports but never mark a vendor red (specs/02 §4). */
  severity: 'blocking' | 'advisory';
  note: string | null;
  sortOrder: number;
};

export type RequirementSet = {
  id: string;
  name: string;
  audience: 'pm' | 'hoa' | 'gc' | 'tenant';
  version: number;
  requirements: Requirement[];
};

// ---------------------------------------------------------------------------
// The engine's own input and output
// ---------------------------------------------------------------------------

export type VendorIdentity = {
  name: string;
  /** Used by the name match when present (specs/04 §4). */
  legalName?: string | null;
};

export type OrgIdentity = {
  /** The certificate-holder block — `specs/01` §4, captured in onboarding. */
  entityBlock?: string | null;
  /** Extra accepted holder strings, e.g. a managing agent (specs/05 §9). */
  alternateHolders?: string[];
};

export type CompareInput = {
  /** `null` means the vendor has no active certificate at all. */
  extraction: CoiExtraction | null;
  requirementSet: RequirementSet;
  /** The org's local "today" at 00:00, as `YYYY-MM-DD` (specs/05 §7). */
  evaluationDate: string;
  vendor: VendorIdentity;
  org?: OrgIdentity;
};

export type EvidencePointer = {
  /** A JSON pointer into `extractions.payload` (specs/05 §5). */
  path: string;
  /** The `raw` text at that pointer, so the report can quote the document. */
  raw: string | null;
  page: number | null;
};

export type ResultRow = {
  /** The requirement id, or `check:name` / `check:holder` / `check:dates`. */
  requirementId: string;
  /** Where the row came from: a template row, or a cross-cutting check. */
  origin: 'requirement' | 'cross_check';
  kind: RequirementKind | 'name_match' | 'holder_match' | 'dates';
  coverage: CoverageType | null;
  label: string;
  severity: 'blocking' | 'advisory';
  state: import('../status').RequirementState;
  statusState: import('../status').StatusState;
  foundAmount: number | null;
  foundRaw: string | null;
  foundForm: string | null;
  conditional: boolean;
  explanation: string;
  evidence: EvidencePointer[];
  sortOrder: number;
};

export type ComparisonResult = {
  engineVersion: string;
  requirementSetId: string;
  requirementSetVersion: number;
  evaluationDate: string;
  status: import('../status').VendorState;
  statusState: import('../status').StatusState;
  statusWord: string;
  metCount: number;
  gapCount: number;
  assertedOnlyCount: number;
  notCheckedCount: number;
  undeterminedCount: number;
  /** min(policy_exp) over the coverages a blocking requirement references. */
  earliestRequiredExpiry: string | null;
  results: ResultRow[];
};
