/**
 * PATH D — THE MODIFICATION TABLE, AND THE 17%-RED CASE.
 *
 * This file is the regression test for **Challenge C6**, the second of the two
 * corpus-killing bugs the specification found by measuring rather than by reading.
 *
 * §2.4 as first written asserted that a determination's modification table carries
 * "exactly `revisionNumber + 1` rows", and §3.3 hardened that into
 * `CHECK (mod_table_rows = revision + 1)`. Measured on a 200-WD live sample it was
 * **red on 34 (17.0%)**: WHD frequently declines to print modification 0. Because
 * it was a CHECK rather than a probe, seventeen percent of the active corpus would
 * have been literally UNWRITABLE — aborting the ingest transaction rather than
 * degrading.
 *
 * Two checked-in fixtures reproduce it against real bytes, and one of them is a
 * table that does not even start at 1.
 */

import { describe, expect, it } from 'vitest';

import { isoDate } from '@/lib/types';

import {
  canonicalise,
  extractModTable,
  isContiguousSuffix,
  parseDetermination,
  validateModTable,
} from '@/corpus';

import { fixtureJson } from './fixtures';

interface DocFixture {
  readonly document: string;
  readonly revisionNumber: number;
  readonly publishDate: string;
}

/**
 * `publishDate` here is PATH D's header date, not path B's `publishDate` field.
 * They are the same value on a current revision and DIFFERENT quantities on a
 * superseded one — see the last describe block, which is a finding rather than a
 * detail.
 */
function load(name: string): {
  readonly text: string;
  readonly revision: number;
  readonly publishDate: string;
  readonly pathBPublishDate: string;
} {
  const raw = fixtureJson<DocFixture>(`document/${name}.json`);
  const text = canonicalise(raw.document).text;
  const parse = parseDetermination(text);
  if (!parse.ok) throw new Error(`${name}: ${parse.reason}`);
  return {
    text,
    revision: raw.revisionNumber,
    publishDate: parse.parsed.header.headerDate,
    pathBPublishDate: raw.publishDate,
  };
}

describe('path D — the modification table in the SUFFIX form', () => {
  it('VA20260195 r2 prints the whole run 0..2 and validates', () => {
    const { text, revision, publishDate } = load('VA20260195-r2');
    const table = extractModTable(text);
    expect(table).not.toBeNull();
    expect(table?.rows).toEqual([
      { modification: 0, publicationDate: '2026-01-02' },
      { modification: 1, publicationDate: '2026-05-18' },
      { modification: 2, publicationDate: '2026-08-06' },
    ]);
    expect(validateModTable({ table: table!, revision, headerDate: publishDate })).toEqual({ ok: true });
  });

  /**
   * THE 17% CASE. `LA20260005` is revision 2 and its table lists rows 1 and 2 only.
   * The withdrawn row-count form would have refused the write; the suffix form
   * accepts it, because nothing is missing from the DETERMINATION — the table is a
   * contiguous suffix of 0…revision, not always the whole run.
   */
  it('LA20260005 r2 prints rows 1-2 only: rows != revision + 1, and it is VALID', () => {
    const { text, revision, publishDate } = load('LA20260005-r2');
    const table = extractModTable(text);
    expect(table?.first).toBe(1);
    expect(table?.last).toBe(2);
    expect(table?.count).toBe(2);

    // The withdrawn form, stated so the test names what it is defending against.
    expect(table?.count).not.toBe(revision + 1);

    expect(validateModTable({ table: table!, revision, headerDate: publishDate })).toEqual({ ok: true });
    expect(isContiguousSuffix(table!, revision)).toBe(true);
  });

  /** A table that starts at 3 — the sampled case §2.4 mentions, on real bytes. */
  it('DC20260001 r5 prints rows 3-5: the table need not start at 0 or 1', () => {
    const { text, revision, publishDate } = load('DC20260001-r5');
    const table = extractModTable(text);
    expect(table?.first).toBe(3);
    expect(table?.last).toBe(5);
    expect(table?.count).toBe(3);
    expect(table?.count).not.toBe(revision + 1);
    expect(validateModTable({ table: table!, revision, headerDate: publishDate })).toEqual({ ok: true });
  });

  it('a superseded revision carries its own shorter table', () => {
    const { text, revision, publishDate } = load('VA20260195-r0');
    const table = extractModTable(text);
    expect(table?.rows).toEqual([{ modification: 0, publicationDate: '2026-01-02' }]);
    expect(validateModTable({ table: table!, revision, headerDate: publishDate })).toEqual({ ok: true });
  });

  it('every checked-in fixture would FAIL the withdrawn row-count form on 2 of 4', () => {
    // The measured shape of C6, reproduced in miniature: the withdrawn form is red
    // on half this sample, the suffix form on none of it.
    const names = ['VA20260195-r2', 'LA20260005-r2', 'DC20260001-r5', 'VA20260195-r0'] as const;
    let rowCountRed = 0;
    let suffixRed = 0;
    for (const name of names) {
      const { text, revision, publishDate } = load(name);
      const table = extractModTable(text)!;
      if (table.count !== revision + 1) rowCountRed += 1;
      if (!validateModTable({ table, revision, headerDate: publishDate }).ok) suffixRed += 1;
    }
    expect(rowCountRed).toBe(2);
    expect(suffixRed).toBe(0);
  });
});

describe('the table is the STALE-INDEX signal, from inside the document', () => {
  it('refuses a table whose last row exceeds the revision we were served', () => {
    const { text, publishDate } = load('VA20260195-r2');
    const table = extractModTable(text)!;
    const verdict = validateModTable({ table, revision: 1, headerDate: publishDate });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.reason).toContain('the index is stale relative to the publisher');
    }
  });

  it('refuses a table whose last row falls short of the revision we were served', () => {
    const { text } = load('VA20260195-r2');
    const table = extractModTable(text)!;
    const verdict = validateModTable({ table, revision: 3, headerDate: '2026-08-06' });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain('expected 3');
  });

  it('refuses a non-contiguous table', () => {
    const verdict = validateModTable({
      table: {
        rows: [
          { modification: 0, publicationDate: isoDate('2026-01-02') },
          { modification: 2, publicationDate: isoDate('2026-08-06') },
        ],
        first: 0,
        last: 2,
        count: 2,
      },
      revision: 2,
      headerDate: '2026-08-06',
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain('not contiguous');
  });

  it('refuses decreasing publication dates', () => {
    const verdict = validateModTable({
      table: {
        rows: [
          { modification: 0, publicationDate: isoDate('2026-08-06') },
          { modification: 1, publicationDate: isoDate('2026-01-02') },
        ],
        first: 0,
        last: 1,
        count: 2,
      },
      revision: 1,
      headerDate: '2026-01-02',
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain('publication dates decrease');
  });

  it('refuses a last row whose date disagrees with the header date', () => {
    const { text, revision } = load('VA20260195-r2');
    const table = extractModTable(text)!;
    const verdict = validateModTable({ table, revision, headerDate: '2026-08-07' });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toContain('header date');
  });
});

/**
 * MEASURED WHILE BUILDING THIS, AND NOT IN THE SPECIFICATION.
 *
 * §2.5's publish_date comparison is measured at 0/200 — but explicitly "fetching
 * path B at each WD's CURRENT revision". On a SUPERSEDED revision path B's
 * `publishDate` is a different quantity: the revision's LAST DAY OF EFFECT.
 *
 * The consequence is not cosmetic. The historical backfill (§9.2's revision walk,
 * C2's whole point, and the basis of the eighteen-month reproduction) fetches
 * NOTHING BUT superseded revisions. Taking `publish_date` from path B there would
 * make §3.3's `wd_rev_dates CHECK (header_date = publish_date)` refuse the write on
 * every one of them, and comparing the two as a tier-1 field would raise a blocking
 * variance on every one of them.
 */
describe('path B\'s publishDate on a SUPERSEDED revision is its last day of effect', () => {
  it('VA20260195 r0: header says 2026-01-02, path B says 2026-05-17', () => {
    const r0 = load('VA20260195-r0');
    expect(r0.publishDate).toBe('2026-01-02');
    expect(r0.pathBPublishDate).toBe('2026-05-17');

    // And 2026-05-17 is the day before revision 1 published, which is what makes it
    // a valid-through date rather than a publication date.
    const r2 = load('VA20260195-r2');
    const modTable = extractModTable(r2.text)!;
    expect(modTable.rows[1]?.publicationDate).toBe('2026-05-18');
  });

  it('the two agree on a CURRENT revision, which is what §2.5 measured', () => {
    for (const name of ['VA20260195-r2', 'LA20260005-r2', 'DC20260001-r5'] as const) {
      const doc = load(name);
      expect(doc.publishDate, name).toBe(doc.pathBPublishDate);
    }
  });
});

describe('the header block', () => {
  it('names the determination, its date and its construction types', () => {
    const parse = parseDetermination(load('DC20260001-r5').text);
    expect(parse.ok).toBe(true);
    if (!parse.ok) return;
    expect(parse.parsed.header.wdNumber).toBe('DC20260001');
    expect(parse.parsed.header.headerDate).toBe('2026-07-30');
    expect(parse.parsed.header.stateName).toBe('District of Columbia');
    expect(parse.parsed.header.constructionTypes).toEqual(['Heavy', 'Highway']);
  });
});
