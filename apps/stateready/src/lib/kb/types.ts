/**
 * The shapes `kb/kb-data/*.json` travel in, typed from
 * `kb/ontology/schema.state_trade_record.json` and `schema.sourced_value.json`.
 *
 * These are *structural* types over data the ontology already governs. They are
 * deliberately permissive where the schema is (a `SourcedValue.value` really can
 * be a number, a string, a boolean, an array or null) and strict where the
 * schema is (the three-state `status`, the three-state `confidence`), because
 * the honesty rules in `specs/05` invariant 2 key on exactly those two fields
 * and a widened union here would let a component read one and forget the other.
 *
 * Nothing in this file validates. Validation is `validate.ts`, which runs the
 * real JSON Schema from `kb/ontology/` plus the gates ported from
 * `kb-scripts/validate.py`, at boot and in tests.
 */

export const TRADES = ['hvac', 'plumbing', 'electrical'] as const;
export type Trade = (typeof TRADES)[number];

export type ValueStatus = 'verified' | 'unverified' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export type SourcedValueRaw =
  | number
  | string
  | boolean
  | ReadonlyArray<unknown>
  | null;

export type SourcedValue<T extends SourcedValueRaw = SourcedValueRaw> = {
  value: T;
  status: ValueStatus;
  confidence: Confidence;
  unit?: string;
  source_url?: string;
  source_title?: string;
  source_kind?: 'board_page' | 'board_pdf' | 'statute' | 'administrative_rule' | 'federal_statistics';
  evidence?: string;
  last_verified?: string;
  verified_by?: string[];
  note?: string;
};

export type CeSubject = { hours: number; subject: string };

export type ContinuingEducation = {
  required: SourcedValue;
  hours: SourcedValue;
  period: SourcedValue;
  subject_breakdown?: SourcedValue;
  approved_provider_rule: SourcedValue;
  carryover?: SourcedValue;
  delivery_constraint?: SourcedValue;
};

export type Renewal = {
  cycle: SourcedValue;
  fee: SourcedValue;
  expiry_rule: SourcedValue;
  grace_period?: SourcedValue;
  late_fee?: SourcedValue;
};

/**
 * Board-announced date rolls (`specs/05` §"Board-announced date rolls").
 *
 * The ontology gained this field mid-build (the knowledge-base fleet landed
 * M13's delegated schema work while this app was being scaffolded), and gate G8
 * — in `kb-scripts/validate.py` and mirrored in `gates.ts` — now asserts that an
 * override names a real date inside its own `cycle_year`, appears once per
 * cycle, carries two distinct verifiers, quotes 25 words or fewer, and cites a
 * host on the allowlist. No committed record carries one yet; the engine
 * implements the rule and the tests exercise it against a fixture, so the first
 * record that does needs no engine change.
 */
export type ExpiryOverride = {
  cycle_year: number;
  date: string;
  source_url: string;
  evidence: string;
  last_verified: string;
  verified_by: string[];
  confidence?: Confidence;
  note?: string;
};

export type LicenceType = {
  licence_type_id: string;
  name: string;
  level:
    | 'contractor'
    | 'master'
    | 'journeyman'
    | 'tradesman'
    | 'apprentice'
    | 'technician'
    | 'registration'
    | 'specialty'
    | 'qualifying_individual';
  issuer_level: 'state' | 'local' | 'state_or_local';
  board_id: string;
  who_must_hold: SourcedValue;
  scope_note?: SourcedValue;
  exam?: {
    required?: SourcedValue;
    name?: SourcedValue;
    provider?: SourcedValue;
    fee?: SourcedValue;
    note?: string;
  };
  experience?: { requirement?: SourcedValue; alternatives?: SourcedValue };
  application_fee?: SourcedValue;
  renewal: Renewal;
  continuing_education: ContinuingEducation;
  bond: { required: SourcedValue; amount: SourcedValue; alternative?: SourcedValue };
  insurance: {
    general_liability: SourcedValue;
    property_damage?: SourcedValue;
    aggregate?: SourcedValue;
    workers_compensation?: SourcedValue;
    financial_responsibility?: SourcedValue;
  };
  expiry_overrides?: ExpiryOverride[];
};

export type Board = {
  board_id: string;
  name: string;
  url: string;
  scope: string;
  licence_search_url?: string;
  phone?: string;
};

export type ReciprocityEntry = {
  with_state: string;
  direction: 'inbound' | 'outbound' | 'mutual';
  grants: SourcedValue;
  requires_from?: string;
  conditions: SourcedValue;
  waives_exam?: SourcedValue;
};

export type ProvenanceSource = {
  source_id: string;
  url: string;
  title?: string;
  kind: string;
  fetched_at: string;
  content_sha256: string;
  http_status?: number;
  bytes?: number;
};

export type StateTradeRecord = {
  record_id: string;
  schema_version: string;
  state: string;
  state_name: string;
  trade: Trade;
  jurisdiction_model: {
    level: 'state_only' | 'state_and_local' | 'local_only' | 'state_optional_local_required' | 'none';
    summary: SourcedValue;
    local_layer_note?: string;
  };
  boards: Board[];
  licence_types: LicenceType[];
  reciprocity: ReciprocityEntry[];
  reciprocity_statement?: SourcedValue;
  business_entity: {
    qualifying_individual_rule: SourcedValue;
    entity_registration?: SourcedValue;
    per_location_rule?: SourcedValue;
    change_notification_deadline?: SourcedValue;
  };
  typical_timeline: SourcedValue;
  provenance: {
    created_at: string;
    pass_a: { agent_id: string; date: string; method?: string };
    pass_b: {
      agent_id: string;
      date: string;
      method?: string;
      agreements?: number;
      disagreements?: number;
      unreachable?: number;
      agreement_rate_pct?: number;
      disagreement_detail?: string[];
    };
    sources: ProvenanceSource[];
    publishable?: boolean;
  };
  coverage_notes?: string[];
  disclaimer_profile?: 'standard' | 'local_layer_warning' | 'unverified_fields_present';
};

export type SourceBaselineEntry = {
  source_id: string;
  url: string;
  title?: string;
  kind: string;
  fetched_at: string;
  http_status: number;
  bytes: number;
  content_sha256: string | null;
  normalised_chars?: number;
  normalised_head?: string;
  normalised_tail?: string;
  error?: string;
};

/** A `SourcedValue` found anywhere in a record, with the json path that reached it. */
export type WalkedValue = { path: string; value: SourcedValue };
