/**
 * Ingestion: idempotency, supersession, history, and the superseded-revision
 * criteria finding B4 asked for.
 *
 * Everything runs against the mock adapter and the committed fixtures, so
 * "there is no lite ingest" (WL-13 V9) is something the test can actually
 * check: mod 0 of TX20260253 goes through the same `ingestDetermination` call,
 * the same parser, the same gates and the same transaction as mod 1.
 */

import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  fetchHistory,
  ingestCounties,
  ingestDetermination,
  refreshIndex,
} from '../src/lib/kb/ingest';
import { GateFailure } from '../src/lib/kb/gates';
import {
  kbClassifications,
  kbCounties,
  kbRateGroups,
  kbWageDeterminations,
  kbWdCounties,
  kbWdModifications,
} from '../src/lib/schema';
import { harrisIndexRecords, makeDb, makeSam } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let sam: ReturnType<typeof makeSam>;

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  sam = makeSam();
});
afterEach(async () => {
  await harness.close();
});

const record = (ref: string) =>
  harrisIndexRecords().find((r) => r.fullReferenceNumber === ref) as never;

describe('a single determination', () => {
  it('writes the text, the rate groups, the classifications and provenance on every row', async () => {
    const result = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });

    expect(result.status).toBe('inserted');
    expect(result.classifications).toBe(57);
    expect(result.rateGroups).toBe(15);

    const [wd] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, result.wdId));
    expect(wd?.documentText).toContain('General Decision Number: TX20260253');
    expect(wd?.documentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(wd?.isActive).toBe(true);
    expect(wd?.constructionTypes).toEqual(['Building']);
    expect(wd?.publicUrl).toBe('https://sam.gov/wage-determination/TX20260253/1');

    const rows = await db
      .select()
      .from(kbClassifications)
      .where(eq(kbClassifications.wdId, result.wdId));
    expect(rows).toHaveLength(57);
    // Gate G1: provenance is ON the row, not a join away.
    for (const row of rows) {
      expect(row.wdNumber).toBe('TX20260253');
      expect(row.modificationNumber).toBe(1);
      expect(row.publicationDate).toBeTruthy();
      expect(row.sourceUrl).toContain('/wdol/v1/wd/TX20260253/1');
      expect(row.lastVerified).toBeInstanceOf(Date);
    }

    const counties = await db
      .select()
      .from(kbWdCounties)
      .where(eq(kbWdCounties.wdId, result.wdId));
    // From the INDEX record — SAM's numeric code, which is what a county query
    // needs. The name alone returns zero, silently.
    expect(counties).toEqual([
      expect.objectContaining({ samCountyCode: 14885, countyName: 'Harris' }),
    ]);
  });

  it('keeps a rate group listed twice at different effective dates', async () => {
    const result = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });
    const iron = await db
      .select()
      .from(kbRateGroups)
      .where(and(eq(kbRateGroups.wdId, result.wdId), eq(kbRateGroups.identifier, 'IRON0084-012')));
    expect(iron.length).toBeGreaterThan(1);
    expect(new Set(iron.map((r) => r.effectiveDate)).size).toBe(iron.length);
  });
});

describe('idempotency', () => {
  it('re-ingesting the same pair writes nothing new and only moves last_verified', async () => {
    const first = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260031',
      revision: 1,
      indexRecord: record('TX20260031'),
    });
    const before = await db
      .select({ lastVerified: kbWageDeterminations.lastVerified })
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, first.wdId));

    const later = new Date(Date.now() + 60_000);
    const second = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260031',
      revision: 1,
      indexRecord: record('TX20260031'),
      now: later,
    });

    expect(second.status).toBe('already_held');
    expect(second.wdId).toBe(first.wdId);

    const all = await db.select().from(kbWageDeterminations);
    expect(all).toHaveLength(1);
    const rows = await db.select().from(kbClassifications);
    expect(rows).toHaveLength(19);

    const after = await db
      .select({ lastVerified: kbWageDeterminations.lastVerified })
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, first.wdId));
    expect(after[0]!.lastVerified.getTime()).toBeGreaterThan(before[0]!.lastVerified.getTime());
  });

  it('a full index refresh run twice enqueues nothing the second time', async () => {
    const first: string[] = [];
    await refreshIndex(db, sam, { onNewPair: async (p) => void first.push(p.wdNumber) });
    for (const wdNumber of first) {
      try {
        await ingestDetermination(db, sam, {
          wdNumber,
          revision: 1,
          indexRecord: record(wdNumber),
        });
      } catch {
        /* a fixture we do not hold behaves exactly like a 404 */
      }
    }
    const second: string[] = [];
    const result = await refreshIndex(db, sam, {
      onNewPair: async (p) => void second.push(p.wdNumber),
    });
    expect(second).toEqual([]);
    expect(result.status).toBe('ok');
    expect(result.reverified).toBe(first.length);
  });
});

describe('supersession — a new modification never mutates the old row', () => {
  it('inserts a new row, flags the old one, and leaves its text and rates untouched', async () => {
    // Mod 0 first, as the active revision of the day.
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: true,
    });
    const beforeText = (
      await db
        .select({ documentText: kbWageDeterminations.documentText })
        .from(kbWageDeterminations)
        .where(eq(kbWageDeterminations.id, modZero.wdId))
    )[0]!.documentText;
    const beforeRates = await db
      .select({ id: kbClassifications.id, baseRate: kbClassifications.baseRate })
      .from(kbClassifications)
      .where(eq(kbClassifications.wdId, modZero.wdId))
      .orderBy(kbClassifications.lineNo);

    // Then SAM publishes mod 1.
    const modOne = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });

    expect(modOne.supersededWdId).toBe(modZero.wdId);
    expect(modOne.supersededFromModification).toBe(0);

    const [old] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modZero.wdId));
    expect(old?.isActive).toBe(false);
    expect(old?.supersededById).toBe(modOne.wdId);
    expect(old?.documentText).toBe(beforeText);

    const afterRates = await db
      .select({ id: kbClassifications.id, baseRate: kbClassifications.baseRate })
      .from(kbClassifications)
      .where(eq(kbClassifications.wdId, modZero.wdId))
      .orderBy(kbClassifications.lineNo);
    expect(afterRates).toEqual(beforeRates);

    const [current] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modOne.wdId));
    expect(current?.isActive).toBe(true);
  });

  it('fetching mod 0 AFTER mod 1 does not flip mod 1 to inactive (V10)', async () => {
    const modOne = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });

    const [one] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modOne.wdId));
    const [zero] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modZero.wdId));

    expect(one?.isActive).toBe(true);
    expect(one?.supersededById).toBeNull();
    expect(zero?.isActive).toBe(false);
  });
});

describe('the superseded revision, ingested through the same path (B4)', () => {
  it('kb.fetch_history writes both revisions and touches no determination row (V11)', async () => {
    await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });
    const before = await db.select().from(kbWageDeterminations).orderBy(kbWageDeterminations.id);

    const result = await fetchHistory(db, sam, 'TX20260253');
    expect(result.revisions).toBe(2);

    const mods = await db
      .select()
      .from(kbWdModifications)
      .where(eq(kbWdModifications.wdNumber, 'TX20260253'));
    expect(mods).toHaveLength(2);
    const zero = mods.find((m) => m.modificationNumber === 0);
    const one = mods.find((m) => m.modificationNumber === 1);
    expect(zero).toMatchObject({ publicationDate: '2026-05-17', active: false, textHeld: false });
    expect(one).toMatchObject({ publicationDate: '2026-05-18', active: true, textHeld: true });
    for (const mod of mods) {
      expect(mod.historySourceUrl).toContain('/wdol/v1/wd/TX20260253/history');
      expect(mod.historyFetchedAt).toBeInstanceOf(Date);
    }

    const after = await db.select().from(kbWageDeterminations).orderBy(kbWageDeterminations.id);
    expect(after).toEqual(before);
  });

  it('stores mod 0 in full — text, rates and provenance — with mod 1 still active', async () => {
    const modOne = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });
    await fetchHistory(db, sam, 'TX20260253');

    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
      trigger: 'pin',
    });

    expect(modZero.status).toBe('inserted');
    expect(modZero.classifications).toBe(54);

    const [zero] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modZero.wdId));
    expect(zero?.isActive).toBe(false);
    expect(zero?.documentText.length).toBeGreaterThan(10_000);
    expect(zero?.documentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(zero?.parserVersion).toBeTruthy();

    const rows = await db
      .select()
      .from(kbClassifications)
      .where(eq(kbClassifications.wdId, modZero.wdId));
    expect(rows).toHaveLength(54);
    for (const row of rows) {
      expect(row.modificationNumber).toBe(0);
      expect(row.sourceUrl).toContain('/wdol/v1/wd/TX20260253/0');
      expect(row.lastVerified).toBeInstanceOf(Date);
      expect(Number(row.baseRate)).toBeGreaterThan(0);
    }

    const [one] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.id, modOne.wdId));
    expect(one?.isActive).toBe(true);
  });

  it('a superseded revision inherits the county set rather than inventing one', async () => {
    await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 1,
      indexRecord: record('TX20260253'),
    });
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const counties = await db
      .select()
      .from(kbWdCounties)
      .where(eq(kbWdCounties.wdId, modZero.wdId));
    expect(counties).toEqual([
      expect.objectContaining({ samCountyCode: 14885, countyName: 'Harris' }),
    ]);
  });

  it('a 404 on a superseded revision fails without repinning anything', async () => {
    await expect(
      ingestDetermination(db, sam, { wdNumber: 'TX20260253', revision: 7, isActive: false }),
    ).rejects.toThrow(/404/);
    const all = await db.select().from(kbWageDeterminations);
    expect(all).toHaveLength(0);
  });
});

describe('the gates', () => {
  it('G3 rolls a determination back rather than storing a partial classification set', async () => {
    const broken = makeSam();
    const original = broken.fetchDetermination.bind(broken);
    broken.fetchDetermination = async (ref: string, rev: number) => {
      const real = await original(ref, rev);
      // Break ONE rate line in a way the naive denominator still counts:
      // trailing prose after the fringe. Coverage falls below the floor while
      // the line still looks like a rate line to gate G3's counter, which is
      // exactly the failure the gate exists for — a parser that silently drops
      // a rate rather than one that visibly explodes.
      const lines = real.document.split('\n');
      const index = lines.findIndex((l) => /\.{2,}\$\s*[0-9]/.test(l));
      lines[index] = `${lines[index]} SEE FOOTNOTE BELOW FOR DETAIL`;
      return { ...real, document: lines.join('\n') };
    };

    await expect(
      ingestDetermination(db, broken, {
        wdNumber: 'TX20260031',
        revision: 1,
        indexRecord: record('TX20260031'),
      }),
    ).rejects.toBeInstanceOf(GateFailure);

    expect(await db.select().from(kbWageDeterminations)).toHaveLength(0);
    expect(await db.select().from(kbClassifications)).toHaveLength(0);
  });

  it('G4 refuses a rate of zero', async () => {
    const broken = makeSam();
    const original = broken.fetchDetermination.bind(broken);
    broken.fetchDetermination = async (ref: string, rev: number) => {
      const real = await original(ref, rev);
      return { ...real, document: real.document.replace(/\$ 38\.50/, '$ 0.00') };
    };
    await expect(
      ingestDetermination(db, broken, {
        wdNumber: 'TX20260253',
        revision: 1,
        indexRecord: record('TX20260253'),
      }),
    ).rejects.toThrow(/G4/);
  });

  it('V5 rejects an empty document rather than storing it', async () => {
    const broken = makeSam();
    broken.fetchDetermination = async () =>
      ({ fullReferenceNumber: 'TX20260253', revisionNumber: 1, document: '', publishDate: '2026-05-18', active: true }) as never;
    await expect(
      ingestDetermination(db, broken, { wdNumber: 'TX20260253', revision: 1 }),
    ).rejects.toThrow(/V5/);
  });

  it('V6 fails when SAM serves a different record than the one requested', async () => {
    const broken = makeSam();
    const original = broken.fetchDetermination.bind(broken);
    broken.fetchDetermination = async () => original('TX20260031', 1);
    await expect(
      ingestDetermination(db, broken, { wdNumber: 'TX20260253', revision: 1 }),
    ).rejects.toThrow(/requested TX20260253 but the document says TX20260031/);
  });

  it('G10 aborts the run when the index shrinks past the band, and writes nothing', async () => {
    // A first, healthy run establishes the expected size.
    await refreshIndex(db, sam, {});
    const shrunk = makeSam({ indexRecords: harrisIndexRecords().slice(0, 1) });
    const result = await refreshIndex(db, shrunk, {});
    expect(result.status).toBe('aborted_on_gate');
    expect(result.failureReason).toMatch(/G10/);
    expect(await db.select().from(kbWageDeterminations)).toHaveLength(0);
  });
});

describe('counties', () => {
  it('ingests SAM’s dictionary keyed on (state, code, name)', async () => {
    const count = await ingestCounties(db, sam, 'TX');
    expect(count).toBe(254);
    const rows = await db.select().from(kbCounties).where(eq(kbCounties.countyName, 'Harris'));
    expect(rows[0]).toMatchObject({ stateCode: 'TX', samCountyCode: 14885, slug: 'harris' });
    // Idempotent.
    await ingestCounties(db, sam, 'TX');
    expect(await db.select().from(kbCounties)).toHaveLength(254);
  });
});
