/**
 * The typed read path into the knowledge base. `specs/14` §Server actions:
 * `getKbRecord({ state, trade })` is *the only read path the product uses*.
 *
 * Three rules are enforced here rather than at the call sites, because a rule
 * enforced at call sites is a rule that will be forgotten at one of them:
 *
 *  1. **A non-publishable record is invisible to the product** (`specs/14`
 *     invariant 3). The picker, the engine and the playbook generator all get
 *     `null` and all have a defined behaviour for `null`.
 *  2. **The 180-day staleness rule** (`specs/14` invariant 2) is computed at
 *     read time, per value, against the caller's civil date. Implemented in
 *     `../rules/assess.ts` so the engine and the renderer cannot disagree.
 *  3. **`entryPackReady` is not `publishable`** (`specs/08`, `specs/14`
 *     invariant 6). Agreement and completeness are different questions and
 *     conflating them is what let a document with four unknown sections be
 *     advertised as complete.
 */

import { assessValue } from '../rules/assess';
import { KB_LAUNCH_STATES, KB_RECORDS } from './records';
import type { LicenceType, StateTradeRecord, Trade } from './types';
import { TRADES } from './types';
import { walkSourcedValues } from './walk';

export { TRADES };

/** The 51 jurisdictions the tile grid draws, in the DOM reading order `specs/07` requires. */
export const US_JURISDICTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN',
  'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ',
  'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA',
  'WI', 'WV', 'WY',
] as const;

export const JURISDICTION_NAMES: Readonly<Record<string, string>> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine',
  MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', MT: 'Montana',
  NC: 'North Carolina', ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VA: 'Virginia', VT: 'Vermont', WA: 'Washington',
  WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
};

/** The fifteen states `PLAN.md` A11 scopes launch to, from `kb-data/_launch_states.json`. */
export const LAUNCH_STATES: readonly string[] = KB_LAUNCH_STATES.states.map((s) => s.state);

export function isTrade(value: string): value is Trade {
  return (TRADES as readonly string[]).includes(value);
}

function publishable(record: StateTradeRecord): boolean {
  return record.provenance.publishable === true;
}

/**
 * THE read path. Returns null for an uncovered state, an unknown trade, or a
 * record that is not publishable — three different facts with one honest
 * answer: we cannot derive this for you.
 */
export function getKbRecord(state: string, trade: string): StateTradeRecord | null {
  const s = state.toUpperCase();
  const record = KB_RECORDS.find((r) => r.state === s && r.trade === trade);
  if (!record || !publishable(record)) return null;
  return record;
}

/** Every publishable record, for `/coverage` and the admin screens. */
export function listKbRecords(): readonly StateTradeRecord[] {
  return KB_RECORDS.filter(publishable);
}

/** Every record, publishable or not — admin only (`specs/14` invariant 3). */
export function listAllKbRecords(): readonly StateTradeRecord[] {
  return KB_RECORDS;
}

export function listLicenceTypes(state: string, trade: string): LicenceType[] {
  return getKbRecord(state, trade)?.licence_types ?? [];
}

export function getLicenceType(licenceTypeId: string): { record: StateTradeRecord; licenceType: LicenceType } | null {
  for (const record of KB_RECORDS) {
    if (!publishable(record)) continue;
    const licenceType = record.licence_types.find((lt) => lt.licence_type_id === licenceTypeId);
    if (licenceType) return { record, licenceType };
  }
  return null;
}

export type Coverage = {
  state: string;
  stateName: string;
  trade: Trade;
  covered: boolean;
  /** Present only when covered. */
  recordId?: string;
  licenceTypeCount?: number;
  verifiedValues?: number;
  unknownValues?: number;
  staleValues?: number;
  oldestLastVerified?: string | null;
  entryPackReady?: boolean;
  disclosedGaps?: string[];
  coverageNotes?: string[];
};

/** `getCoverage()` from `specs/02`: per (state, trade), is there a publishable record? */
export function getCoverage(state: string, trade: Trade, today: string): Coverage {
  const s = state.toUpperCase();
  const record = getKbRecord(s, trade);
  const stateName = JURISDICTION_NAMES[s] ?? s;
  if (!record) return { state: s, stateName, trade, covered: false };

  const values = walkSourcedValues(record);
  let verified = 0;
  let unknown = 0;
  let stale = 0;
  let oldest: string | null = null;
  for (const { value } of values) {
    const a = assessValue(value, today);
    if (!a.usable) unknown += 1;
    else if (a.effectiveStatus === 'verified') verified += 1;
    if (a.stale) stale += 1;
    if (value.last_verified && (oldest === null || value.last_verified < oldest)) oldest = value.last_verified;
  }

  const pack = entryPackReadiness(record, today);
  return {
    state: s,
    stateName,
    trade,
    covered: true,
    recordId: record.record_id,
    licenceTypeCount: record.licence_types.length,
    verifiedValues: verified,
    unknownValues: unknown,
    staleValues: stale,
    oldestLastVerified: oldest,
    entryPackReady: pack.ready,
    disclosedGaps: pack.disclosedGaps,
    coverageNotes: record.coverage_notes ?? [],
  };
}

/** The whole grid for `/coverage` — 51 jurisdictions × 3 trades, honestly. */
export function coverageTable(today: string): Coverage[] {
  return US_JURISDICTIONS.flatMap((state) => TRADES.map((trade) => getCoverage(state, trade, today)));
}

/**
 * `entryPackReady` — `specs/08`'s purchasability gate, and NOT `publishable`.
 *
 * CORE_SET is blocking: without it the document has no spine (which licence,
 * who holds it, when it renews, what CE, does my existing licence help). All
 * nine committed records pass. DISCLOSED_SET is never blocking and is always
 * named before payment; the count is what `needsCheckCount` shows on the
 * purchase screen, *before* the Checkout session is created.
 */
export const DISCLOSED_SET = [
  'application_fee',
  'renewal.fee',
  'exam.fee',
  'bond.required',
  'bond.amount',
  'insurance.general_liability',
  'insurance.property_damage',
  'insurance.aggregate',
  'insurance.workers_compensation',
  'typical_timeline',
] as const;

export type EntryPackReadiness = {
  ready: boolean;
  missingCore: string[];
  disclosedGaps: string[];
};

export function entryPackReadiness(record: StateTradeRecord, today: string): EntryPackReadiness {
  const missingCore: string[] = [];
  const isVerified = (v: Parameters<typeof assessValue>[0]): boolean => {
    const a = assessValue(v, today);
    return a.usable && a.effectiveStatus === 'verified';
  };

  if (record.licence_types.length === 0) missingCore.push('licence_types');

  for (const lt of record.licence_types) {
    const id = lt.licence_type_id;
    if (!isVerified(lt.who_must_hold)) missingCore.push(`${id}.who_must_hold`);
    if (!isVerified(lt.renewal.cycle)) missingCore.push(`${id}.renewal.cycle`);
    if (!isVerified(lt.renewal.expiry_rule)) missingCore.push(`${id}.renewal.expiry_rule`);
    const ce = lt.continuing_education;
    const ceOk = ce.required.value === false ? isVerified(ce.required) : isVerified(ce.hours);
    if (!ceOk) missingCore.push(`${id}.continuing_education`);
  }

  const hasReciprocity =
    record.reciprocity.length > 0 || (record.reciprocity_statement?.value ?? null) !== null;
  if (!hasReciprocity) missingCore.push('reciprocity');
  if (!record.coverage_notes || record.coverage_notes.length === 0) missingCore.push('coverage_notes');

  const disclosedGaps: string[] = [];
  const push = (label: string, v: Parameters<typeof assessValue>[0]) => {
    if (!isVerified(v)) disclosedGaps.push(label);
  };
  push('typical processing time', record.typical_timeline);
  for (const lt of record.licence_types) {
    push(`${lt.name}: application fee`, lt.application_fee);
    push(`${lt.name}: renewal fee`, lt.renewal.fee);
    push(`${lt.name}: exam fee`, lt.exam?.fee);
    push(`${lt.name}: bond requirement`, lt.bond.required);
    push(`${lt.name}: bond amount`, lt.bond.amount);
    push(`${lt.name}: general liability minimum`, lt.insurance.general_liability);
  }

  return {
    ready: publishable(record) && missingCore.length === 0,
    missingCore,
    disclosedGaps: [...new Set(disclosedGaps)],
  };
}
