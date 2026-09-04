/**
 * M14 — the knowledge base, validated the way `kb-scripts/validate.py`
 * validates it, plus the accessors and the two predicates that decide what a
 * customer may see and what may be sold.
 *
 * The numbers asserted here are the Python's: **9 records, 0 failures, 3 G7
 * warnings** (Florida reciprocity, and all three are correct). Two
 * implementations of the same thirteen gates agreeing is what makes the port
 * trustworthy; if they ever diverge, this test says so before a deploy does.
 */

import { describe, expect, it } from 'vitest';

import {
  coverageTable,
  entryPackReadiness,
  getCoverage,
  getKbRecord,
  getLicenceType,
  listKbRecords,
  listLicenceTypes,
  LAUNCH_STATES,
  US_JURISDICTIONS,
} from '../src/lib/kb/accessors';
import { KB_RECORDS, KB_SOURCE_BASELINE, ONTOLOGY } from '../src/lib/kb/records';
import { assertKnowledgeBaseValid, validateKnowledgeBase, validateRecord } from '../src/lib/kb/validate';
import { walkSourcedValues } from '../src/lib/kb/walk';

const TODAY = '2026-09-03';

describe('validation — schema plus the thirteen gates', () => {
  const result = validateKnowledgeBase(TODAY);

  it('validates all nine committed records with zero failures', () => {
    expect(result.records).toHaveLength(9);
    expect(result.failures).toBe(0);
    expect(result.ok).toBe(true);
  });

  it('reports exactly the three G7 warnings the Python reports, and they are Florida reciprocity', () => {
    const warnings = result.records.flatMap((r) =>
      r.gateFindings.filter((f) => f.severity === 'warn').map((f) => ({ record: r.recordId, gate: f.gate })),
    );
    expect(warnings).toHaveLength(3);
    expect(new Set(warnings.map((w) => w.gate))).toEqual(new Set(['G7']));
    expect(warnings.map((w) => w.record).sort()).toEqual(['fl.electrical', 'fl.hvac', 'fl.plumbing']);
  });

  it('the boot assertion passes on the committed data', () => {
    expect(() => assertKnowledgeBaseValid(TODAY)).not.toThrow();
  });

  it('refuses a record that violates the ontology — the gate is real, not decorative', () => {
    const broken = structuredClone(KB_RECORDS[0]!) as Record<string, unknown>;
    delete broken['typical_timeline'];
    const check = validateRecord(broken as never, TODAY);
    expect(check.ok).toBe(false);
    expect(check.schemaErrors.join(' ')).toMatch(/missing required property 'typical_timeline'/);
  });

  it('G1 fires on a verified value with fewer than two distinct verifiers', () => {
    const record = structuredClone(KB_RECORDS[7]!);
    record.licence_types[0]!.renewal.cycle.verified_by = ['same', 'same'];
    const check = validateRecord(record, TODAY);
    expect(check.gateFindings.some((f) => f.gate === 'G1' && f.severity === 'fail')).toBe(true);
  });

  it('a null value that is not "unknown", or carries no note, is refused — G2, now mirrored in the schema', () => {
    // Wave-1b **m4** tightened `schema.sourced_value.json` so the ontology
    // enforces what gate G2 enforced: a null value is `unknown` and says what
    // was read. The two now overlap deliberately, and the SCHEMA rejects first,
    // which is why this asserts on the schema error rather than on the gate.
    // (Gates run only on a structurally sound record — see `validate.ts`.)
    const record = structuredClone(KB_RECORDS[7]!);
    record.typical_timeline = { value: null, status: 'verified', confidence: 'low' } as never;
    const check = validateRecord(record, TODAY);
    expect(check.ok).toBe(false);
    expect(check.schemaErrors.join(' ')).toMatch(/expected const "unknown"|missing required property 'note'/);

    // And with the status right but the note missing, it is still refused.
    const noNote = structuredClone(KB_RECORDS[7]!);
    noNote.typical_timeline = { value: null, status: 'unknown', confidence: 'low' } as never;
    expect(validateRecord(noNote, TODAY).ok).toBe(false);
  });

  it('G8 fires on an expiry rule the engine does not implement', () => {
    const record = structuredClone(KB_RECORDS[7]!);
    record.licence_types[0]!.renewal.expiry_rule.value = 'fixed_date_offset:birth_month';
    const check = validateRecord(record, TODAY);
    expect(check.gateFindings.some((f) => f.gate === 'G8' && f.severity === 'fail')).toBe(true);
  });

  it('G10 FAILS on a cited source whose hash moved, and only WARNS when nothing cites it', () => {
    const record = structuredClone(KB_RECORDS[7]!);
    const cited = record.provenance.sources.find((s) =>
      walkSourcedValues(record).some(({ value }) => value.source_url === s.url),
    )!;
    cited.content_sha256 = 'f'.repeat(64);
    const failing = validateRecord(record, TODAY);
    expect(failing.gateFindings.some((f) => f.gate === 'G10' && f.severity === 'fail')).toBe(true);

    const uncitedRecord = structuredClone(KB_RECORDS[7]!);
    const uncited = uncitedRecord.provenance.sources.find(
      (s) => !walkSourcedValues(uncitedRecord).some(({ value }) => value.source_url === s.url),
    );
    if (uncited) {
      uncited.content_sha256 = 'e'.repeat(64);
      const warned = validateRecord(uncitedRecord, TODAY);
      expect(warned.gateFindings.some((f) => f.gate === 'G10' && f.severity === 'warn')).toBe(true);
      expect(warned.gateFindings.some((f) => f.gate === 'G10' && f.severity === 'fail')).toBe(false);
    }
  });

  it('G13 fails a future verification date and warns past 400 days', () => {
    const record = structuredClone(KB_RECORDS[7]!);
    record.licence_types[0]!.renewal.cycle.last_verified = '2027-01-01';
    expect(validateRecord(record, TODAY).gateFindings.some((f) => f.gate === 'G13' && f.severity === 'fail')).toBe(
      true,
    );
    expect(
      validateRecord(KB_RECORDS[7]!, '2028-01-01').gateFindings.some(
        (f) => f.gate === 'G13' && f.severity === 'warn',
      ),
    ).toBe(true);
  });
});

describe('the ontology is present and is the one the records were authored against', () => {
  it('carries both schemas and the host allowlist', () => {
    expect(ONTOLOGY.stateTradeRecord['title']).toBe('StateTradeRecord');
    expect(ONTOLOGY.sourcedValue['title']).toBe('SourcedValue');
    expect(Object.keys(ONTOLOGY.officialHosts.hosts).length).toBeGreaterThan(5);
  });

  it('every provenance source is in the drift baseline', () => {
    for (const record of KB_RECORDS) {
      for (const source of record.provenance.sources) {
        expect(KB_SOURCE_BASELINE[source.source_id], `${record.record_id} ${source.source_id}`).toBeTruthy();
      }
    }
  });
});

describe('accessors — the only read path the product uses', () => {
  it('returns the nine publishable records and nothing else', () => {
    expect(listKbRecords()).toHaveLength(9);
    expect(getKbRecord('TX', 'hvac')?.record_id).toBe('tx.hvac');
    expect(getKbRecord('tx', 'hvac')?.record_id).toBe('tx.hvac');
  });

  it('returns null for an uncovered state, an unknown trade, and a state we do not hold', () => {
    expect(getKbRecord('OH', 'hvac')).toBeNull();
    expect(getKbRecord('TX', 'roofing')).toBeNull();
    expect(listLicenceTypes('OH', 'hvac')).toEqual([]);
  });

  it('resolves a licence type by id, across records', () => {
    expect(getLicenceType('nc.plumbing.plumbing_contractor')?.record.record_id).toBe('nc.plumbing');
    expect(getLicenceType('ga.hvac.anything')).toBeNull();
  });

  it('draws 51 jurisdictions and knows the fifteen launch states', () => {
    expect(US_JURISDICTIONS).toHaveLength(51);
    expect(US_JURISDICTIONS).toContain('DC');
    expect(LAUNCH_STATES).toHaveLength(15);
    expect(LAUNCH_STATES).toContain('CA');
  });
});

describe('coverage — computed from the knowledge base, never from a selection', () => {
  it('is honest about the nine we hold and the 144 we do not', () => {
    const table = coverageTable(TODAY);
    expect(table).toHaveLength(51 * 3);
    expect(table.filter((row) => row.covered)).toHaveLength(9);
    expect(getCoverage('TX', 'hvac', TODAY).covered).toBe(true);
    expect(getCoverage('OH', 'hvac', TODAY).covered).toBe(false);
  });

  it('counts verified and unknown values per record, and the counts are not zero', () => {
    const texas = getCoverage('TX', 'hvac', TODAY);
    expect(texas.verifiedValues).toBeGreaterThan(20);
    expect(texas.unknownValues).toBeGreaterThan(0);
    expect(texas.oldestLastVerified).toBe('2026-09-03');
  });

  it('marks every value stale once the 180-day rule bites, without changing the record', () => {
    const later = getCoverage('TX', 'hvac', '2027-06-01');
    expect(later.staleValues).toBeGreaterThan(0);
    expect(getKbRecord('TX', 'hvac')?.licence_types[0]?.renewal.cycle.status).toBe('verified');
  });
});

describe('entryPackReady is NOT publishable', () => {
  /**
   * `specs/08` states "All nine committed records pass" the CORE_SET. Against
   * the committed data, evaluated as the spec defines it, **six do and three do
   * not** — and the three are exactly the records `validate.py` already warns
   * about (G7, Florida reciprocity). This test asserts the TRUE state rather
   * than the spec's claim, and BUILD.md §Spec deviations carries the finding,
   * the evidence and the two ways out. Blocking is implemented rather than
   * softened, because the gate exists to stop a $750 document being sold
   * without the section that answers "does my existing licence help?".
   */
  it('six of the nine records pass the CORE_SET — and the three that do not are Florida', () => {
    const results = KB_RECORDS.map((record) => ({
      recordId: record.record_id,
      ...entryPackReadiness(record, TODAY),
    }));
    expect(results.filter((r) => r.ready).map((r) => r.recordId)).toEqual([
      'nc.electrical',
      'nc.hvac',
      'nc.plumbing',
      'tx.electrical',
      'tx.hvac',
      'tx.plumbing',
    ]);

    const blocked = results.filter((r) => !r.ready);
    expect(blocked.map((r) => r.recordId)).toEqual(['fl.electrical', 'fl.hvac', 'fl.plumbing']);
    // Every Florida record: neither reciprocity entries nor a reciprocity
    // statement — the same fact gate G7 warns about.
    for (const record of blocked) expect(record.missingCore).toContain('reciprocity');
    // And Florida electrical's REGISTERED class additionally has no expiry rule
    // and no CE hour count, so the pack could not say when it renews.
    expect(blocked[0]?.missingCore).toContain('fl.electrical.registered_electrical_contractor.renewal.expiry_rule');
  });

  it('a blocked record is offered as "in preparation", never as covered', () => {
    // `/coverage` renders `entryPackReady ? 'ready' : 'in preparation'`, and
    // `specs/08` AC5 refuses the purchase for a record that is publishable but
    // fails CORE_SET — the same treatment as an uncovered state.
    expect(getCoverage('FL', 'hvac', TODAY).covered).toBe(true);
    expect(getCoverage('FL', 'hvac', TODAY).entryPackReady).toBe(false);
    expect(getCoverage('TX', 'hvac', TODAY).entryPackReady).toBe(true);
  });

  it('every record discloses gaps, and Texas HVAC discloses bond and timeline BEFORE the card', () => {
    const texas = entryPackReadiness(getKbRecord('TX', 'hvac')!, TODAY);
    expect(texas.disclosedGaps.length).toBeGreaterThan(0);
    // `specs/08` AC5b, asserted against the committed record: bond and timeline
    // are unknown for tx.hvac and the purchase screen must say so.
    expect(texas.disclosedGaps.join(' | ')).toMatch(/bond/i);
    expect(texas.disclosedGaps.join(' | ')).toMatch(/processing time/i);
  });

  it('a record that loses a CORE_SET value stops being purchasable', () => {
    const record = structuredClone(getKbRecord('TX', 'hvac')!);
    record.licence_types[0]!.renewal.cycle = {
      value: null,
      status: 'unknown',
      confidence: 'low',
      note: 'not established',
    };
    const pack = entryPackReadiness(record, TODAY);
    expect(pack.ready).toBe(false);
    expect(pack.missingCore.join(' ')).toMatch(/renewal\.cycle/);
  });
});
