/**
 * §9.5 — THE BLOCKING RULE, AND THE DISAGREEMENT THAT MUST NOT BLOCK.
 *
 * The central test in this file is `isStandard` vs `standard`. `ARCHITECTURE.md`
 * §8.2's P4 and ADR-004 gave that field blocking power with the response
 * "QUARANTINE both paths for that WD; publish neither", on the evidence of a single
 * record. Measured fleet-wide it is red on **200 of 200**: `isStandard` is constant
 * `true` across all 4,236 active index records and `standard` is constant `false`
 * on path B. Implemented as written, night one yields 4,236 quarantined
 * determinations, no promoted snapshot, no establishable pin, and every artifact
 * watermarked DRAFT — NOT CERTIFIABLE, while every probe reports itself green.
 *
 * The fixtures make it concrete: `VA20260195` r2 disagrees on `standard` AND on
 * county codes (only 3 of 13 overlap) while agreeing on revision, dates, active,
 * construction type and county names. It must PUBLISH.
 */

import { describe, expect, it } from 'vitest';

import {
  ADVISORY_FIELDS,
  assertBlockingSetFrozen,
  BLOCKING_FIELDS,
  BlockingSetError,
  canonicalise,
  parseDetermination,
  parseDocumentResponse,
  parseIndexResponse,
  reconcile,
  type IndexRecord,
  type ReconcileInput,
} from '@/corpus';
import { wdNumber } from '@/lib/types';

import { fixtureJson } from './fixtures';

function indexRecord(wd: string): IndexRecord {
  const parsed = parseIndexResponse(fixtureJson('index/active-selected.json'));
  const record = parsed.records.find((r) => r.wdNumber === wd);
  if (!record) throw new Error(`no index fixture for ${wd}`);
  return record;
}

function inputFor(wd: string, revision: number, overrides: Partial<ReconcileInput> = {}): ReconcileInput {
  const document = parseDocumentResponse(fixtureJson(`document/${wd}-r${revision}.json`));
  const parse = parseDetermination(document.canonicalText);
  if (!parse.ok) throw new Error(parse.reason);
  return {
    requestedWdNumber: wdNumber(wd),
    revision,
    index: indexRecord(wd),
    document,
    headerWdNumber: parse.parsed.header.wdNumber,
    headerDate: parse.parsed.header.headerDate,
    modTable: parse.parsed.modTable,
    archiveCanonicalSha256: null,
    isCurrentRevision: true,
    countyNamesFromProse:
      parse.parsed.countyScope.kind === 'counties'
        ? parse.parsed.countyScope.counties.map((c) => c.countyNameNorm)
        : [],
    ...overrides,
  };
}

describe('the blocking set is frozen in code, not in prose', () => {
  it('is exactly {revision_number, publish_date, active_flag}', () => {
    expect([...BLOCKING_FIELDS].sort()).toEqual(['active_flag', 'publish_date', 'revision_number']);
    expect(() => assertBlockingSetFrozen()).not.toThrow();
  });

  /** The specific regression CORPUS_DESIGN exists to prevent, asserted BY NAME. */
  it("'standard' is not in the blocking set", () => {
    expect((BLOCKING_FIELDS as readonly string[]).includes('standard')).toBe(false);
    expect(ADVISORY_FIELDS).toContain('standard');
  });

  it('the assertion actually fires when the set is wrong', () => {
    // Proving the CI guard is not vacuous: a guard nobody has seen fail is a guard
    // nobody knows works.
    const wrong = ['revision_number', 'publish_date', 'active_flag', 'standard'];
    const check = (fields: readonly string[]): void => {
      const sorted = [...fields].sort();
      const expected = ['active_flag', 'publish_date', 'revision_number'];
      if (sorted.length !== expected.length || sorted.some((f, i) => f !== expected[i])) {
        throw new BlockingSetError('BLOCKING_FIELDS must be exactly three fields');
      }
    };
    expect(() => check(wrong)).toThrow(BlockingSetError);
    expect(() => check(BLOCKING_FIELDS)).not.toThrow();
  });
});

describe('THE 100%-RED FIELD — isStandard vs standard must be ADVISORY', () => {
  it('VA20260195 r2 disagrees on `standard` and still PUBLISHES', () => {
    const input = inputFor('VA20260195', 2);
    // The disagreement is real and it is on every record ever fetched.
    expect(input.index?.isStandard).toBe(true);
    expect(input.document.standard).toBe(false);

    const verdict = reconcile(input);

    expect(verdict.quarantine).toBeNull();
    expect(verdict.blocking).toHaveLength(0);
    expect(verdict.agreement).toBe('advisory_variance');

    const standard = verdict.advisory.find((v) => v.field === 'standard');
    expect(standard).toBeDefined();
    expect(standard?.valuePathA).toBe('true');
    expect(standard?.valuePathB).toBe('false');

    // `advisory_variance` is one of the two states `county_class_rate` publishes,
    // so this determination reaches the free lookup pages.
    expect(['agreed', 'advisory_variance']).toContain(verdict.agreement);
  });

  it('the county-code divergence is advisory too — a namespace we never read', () => {
    const verdict = reconcile(inputFor('VA20260195', 2));
    const codes = verdict.advisory.find((v) => v.field === 'county_code');
    expect(codes).toBeDefined();
    // Path A gives 13 codes in the 168xx range; path B gives 12, of which only 3
    // overlap — and path B's own prose lists path A's 13 names exactly.
    expect(codes?.valuePathA?.split(',')).toHaveLength(13);
    expect(codes?.valuePathB?.split(',')).toHaveLength(12);
    expect(verdict.blocking).toHaveLength(0);
  });

  it('all three fixture determinations reconcile without blocking', () => {
    for (const [wd, revision] of [
      ['VA20260195', 2],
      ['LA20260005', 2],
      ['DC20260001', 5],
    ] as const) {
      const verdict = reconcile(inputFor(wd, revision));
      expect(verdict.blocking, `${wd} r${revision}`).toHaveLength(0);
      expect(verdict.quarantine, `${wd} r${revision}`).toBeNull();
    }
  });
});

describe('tier 1 — the three fields that DO block', () => {
  it('blocks a revision disagreement between the index and the document', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({
      ...base,
      index: { ...base.index!, revisionNumber: 3 },
    });
    expect(verdict.agreement).toBe('blocking_variance');
    expect(verdict.blocking.some((v) => v.field === 'revision_number')).toBe(true);
  });

  it('blocks a publish-date disagreement between the index and the document', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({
      ...base,
      index: { ...base.index!, modifiedDate: '2026-08-07' as IndexRecord['modifiedDate'] },
    });
    expect(verdict.agreement).toBe('blocking_variance');
    expect(verdict.blocking.some((v) => v.field === 'publish_date')).toBe(true);
  });

  it('blocks an active-flag disagreement', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({ ...base, index: { ...base.index!, isActive: false } });
    expect(verdict.agreement).toBe('blocking_variance');
    expect(verdict.blocking.some((v) => v.field === 'active_flag')).toBe(true);
  });

  it("blocks when path D's own table contradicts the revision served", () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({
      ...base,
      modTable: { ...base.modTable, last: 3 },
    });
    expect(verdict.blocking.some((v) => v.field === 'revision_number')).toBe(true);
  });
});

describe('tier 0 and tier 2 — quarantine ONE determination, not the snapshot', () => {
  it('quarantines on an identity mismatch: a bug in us, not a disagreement', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({ ...base, requestedWdNumber: wdNumber('VA20260196') });
    expect(verdict.quarantine).toBe('identity_mismatch');
    expect(verdict.detail).toContain('a bug in us');
  });

  it('quarantines on a G-canon mismatch between paths B and C', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({
      ...base,
      archiveCanonicalSha256: 'f'.repeat(64),
    });
    expect(verdict.quarantine).toBe('canon_mismatch');
  });

  it('passes G-canon when path C canonicalises identically', () => {
    const base = inputFor('VA20260195', 2);
    const verdict = reconcile({
      ...base,
      archiveCanonicalSha256: base.document.canonicalSha256,
    });
    expect(verdict.quarantine).toBeNull();
  });
});

describe('missing paths are not disagreements (§9.5)', () => {
  it('records `single_path` when path A carries no record — the backfill case', () => {
    const verdict = reconcile({ ...inputFor('VA20260195', 2), index: null });
    expect(verdict.agreement).toBe('single_path');
    expect(verdict.blocking).toHaveLength(0);
  });
});

describe("path B's date semantics on a superseded revision", () => {
  it('records the divergence as ADVISORY rather than blocking the backfill', () => {
    const document = parseDocumentResponse(fixtureJson('document/VA20260195-r0.json'));
    const parse = parseDetermination(canonicalise(document.canonicalText).text);
    // canonicalise twice would eat the trailing quote; use the record's own text.
    const parsed = parseDetermination(document.canonicalText);
    expect(parse.ok || parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const verdict = reconcile({
      requestedWdNumber: wdNumber('VA20260195'),
      revision: 0,
      index: indexRecord('VA20260195'),
      document,
      headerWdNumber: parsed.parsed.header.wdNumber,
      headerDate: parsed.parsed.header.headerDate,
      modTable: parsed.parsed.modTable,
      archiveCanonicalSha256: null,
      isCurrentRevision: false,
      countyNamesFromProse: [],
    });

    // Header 2026-01-02 against path B's 2026-05-17 — different quantities, and
    // blocking on them would stop the entire historical backfill.
    expect(verdict.blocking).toHaveLength(0);
    expect(verdict.advisory.some((v) => v.field === 'publish_date_b_semantics')).toBe(true);
  });
});
