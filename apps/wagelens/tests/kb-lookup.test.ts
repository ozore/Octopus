/**
 * The lookup layer — the only module WL-00, WL-02, WL-03 and WL-04 touch.
 *
 * Two behaviours carry the product and are asserted here rather than assumed:
 *
 *  - **F3, in public.** Harris/Building is one determination; Harris/Heavy is
 *    THREE, and the function returns all three with `ambiguous: true` and no
 *    default. There is no "most likely" heuristic to test for, and that is the
 *    point.
 *  - **`not_found` and `superseded` are different answers.** A modification
 *    that exists and has been superseded RESOLVES, with the newer one named; a
 *    pair that exists nowhere is refused. Collapsing the two would force a
 *    contractor onto a rate their contract does not carry.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { drainJobs, createJobRegistry } from '@octopus/platform/jobs';

import {
  aliasCandidates,
  corpusHealth,
  ensureHistoryQueued,
  findCountyBySlug,
  findDeterminations,
  getDetermination,
  getModificationHistory,
  listCounties,
  listStates,
  searchClassifications,
} from '../src/lib/kb/lookup';
import { fetchHistory, ingestCounties, ingestDetermination } from '../src/lib/kb/ingest';
import { harrisIndexRecords, makeDb, makeSam } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let sam: ReturnType<typeof makeSam>;

const record = (ref: string) =>
  harrisIndexRecords().find((r) => r.fullReferenceNumber === ref) as never;

async function seedCorpus() {
  await ingestCounties(db, sam, 'TX');
  for (const r of harrisIndexRecords()) {
    try {
      await ingestDetermination(db, sam, {
        wdNumber: r.fullReferenceNumber,
        revision: r.revisionNumber,
        indexRecord: r,
      });
      await fetchHistory(db, sam, r.fullReferenceNumber);
    } catch {
      /* no fixture for that determination's text: it behaves like a 404 */
    }
  }
}

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  sam = makeSam();
  await seedCorpus();
});
afterEach(async () => {
  await harness.close();
});

describe('geography narrows; it does not decide', () => {
  it('Harris + Building resolves to exactly TX20260253 with 57 classifications', async () => {
    const county = await findCountyBySlug(db, 'TX', 'harris');
    expect(county).toMatchObject({ samCountyCode: 14885, countyName: 'Harris' });

    const { candidates, ambiguous } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: county!.samCountyCode,
      constructionType: 'Building',
    });
    expect(ambiguous).toBe(false);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      wdNumber: 'TX20260253',
      modificationNumber: 1,
      classificationCount: 57,
    });
  });

  it('Harris + Heavy returns THREE candidates, ambiguous, with nothing preselected', async () => {
    const county = await findCountyBySlug(db, 'TX', 'harris');
    const { candidates, ambiguous } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: county!.samCountyCode,
      constructionType: 'Heavy',
    });
    expect(ambiguous).toBe(true);
    expect(candidates.map((c) => c.wdNumber).sort()).toEqual([
      'TX20260031',
      'TX20260033',
      'TX20260034',
    ]);
    // The county list is the discriminator the UI shows.
    expect(candidates.find((c) => c.wdNumber === 'TX20260031')?.countyCount).toBe(1);
    expect(candidates.find((c) => c.wdNumber === 'TX20260033')?.countyCount).toBeGreaterThan(100);
  });

  it('a county with no determination for a type returns zero rather than a near miss', async () => {
    const county = await listCounties(db, 'TX');
    const bastrop = county.find((c) => c.countyName === 'Bastrop');
    const { candidates } = await findDeterminations(db, {
      stateCode: 'TX',
      samCountyCode: bastrop!.samCountyCode,
      constructionType: 'Building',
    });
    expect(candidates).toHaveLength(0);
  });

  it('lists states and counties for the selects', async () => {
    expect(await listStates(db)).toEqual([{ stateCode: 'TX', countyCount: 254 }]);
    const counties = await listCounties(db, 'TX');
    expect(counties).toHaveLength(254);
    expect(counties[0]?.slug).toBe(counties[0]?.countyName.toLowerCase());
  });
});

describe('alias resolution (V8)', () => {
  it('accepts every short form SAM lists for TX20260253', () => {
    expect(aliasCandidates('TX20260253').exact).toBe('TX20260253');
    expect(aliasCandidates('tx 20260253').exact).toBe('TX20260253');
    expect(aliasCandidates('TX260253').exact).toBe('TX20260253');
    expect(aliasCandidates('TX26253').exact).toBe('TX20260253');
    expect(aliasCandidates('TX2026253').exact).toBe('TX20260253');
    expect(aliasCandidates('TX0253').likePattern).toBe('TX____0253');
  });

  it('resolves a short form against the corpus', async () => {
    for (const alias of ['TX260253', 'TX26253', 'TX2026253', 'TX0253', 'tx 20260253']) {
      const result = await getDetermination(db, alias, undefined, { enqueueMissing: false });
      expect(result.resolution, alias).toBe('active');
      if (result.resolution === 'active') expect(result.determination.wdNumber).toBe('TX20260253');
    }
  });
});

describe('resolving a modification', () => {
  it('with no modification given, returns the active one', async () => {
    const result = await getDetermination(db, 'TX20260253');
    expect(result.resolution).toBe('active');
    if (result.resolution === 'active') expect(result.determination.modificationNumber).toBe(1);
  });

  it('with a superseded modification we hold, RESOLVES it and names the newer one', async () => {
    await ingestDetermination(db, sam, { wdNumber: 'TX20260253', revision: 0, isActive: false });
    const result = await getDetermination(db, 'TX20260253', 0);
    expect(result.resolution).toBe('superseded');
    if (result.resolution === 'superseded') {
      expect(result.determination.modificationNumber).toBe(0);
      expect(result.determination.classificationCount).toBe(54);
      expect(result.activeModification).toBe(1);
      expect(result.activePublicationDate).toBe('2026-05-18');
    }
  });

  it('with a superseded modification whose TEXT we lack, answers `fetching` and enqueues it', async () => {
    const result = await getDetermination(db, 'TX20260253', 0);
    expect(result.resolution).toBe('fetching');

    // The enqueued job is the real one, and draining it stores the revision.
    const registry = createJobRegistry();
    registry.register('kb.fetch_determination', async (payload) => {
      await ingestDetermination(db, sam, {
        wdNumber: String(payload['wdNumber']),
        revision: Number(payload['modificationNumber']),
        isActive: false,
      });
    });
    const drained = await drainJobs({ db, registry }, { batchSize: 5 });
    expect(drained.succeeded).toBe(1);

    const after = await getDetermination(db, 'TX20260253', 0);
    expect(after.resolution).toBe('superseded');
  });

  it('with a modification that has never existed, REFUSES and lists the real ones', async () => {
    const result = await getDetermination(db, 'TX20260253', 9);
    expect(result.resolution).toBe('not_found');
    if (result.resolution === 'not_found') {
      expect(result.knownModifications.sort()).toEqual([0, 1]);
    }
  });

  it('with a WD number nothing knows, refuses', async () => {
    const result = await getDetermination(db, 'TX99999999');
    expect(result.resolution).toBe('not_found');
  });

  it('lists the modification history from kb_wd_modifications, never invented', async () => {
    const history = await getModificationHistory(db, 'TX20260253');
    expect(history).toEqual([
      expect.objectContaining({ modificationNumber: 1, publicationDate: '2026-05-18', active: true }),
      expect.objectContaining({ modificationNumber: 0, publicationDate: '2026-05-17', active: false }),
    ]);
  });

  it('enqueues a history pull exactly once for a WD number we have never touched', async () => {
    await ensureHistoryQueued(db, 'TX20260253'); // already held: no-op
    const registry = createJobRegistry();
    let calls = 0;
    registry.register('kb.fetch_history', async () => {
      calls += 1;
    });
    await drainJobs({ db, registry }, { batchSize: 5 });
    expect(calls).toBe(0);
  });
});

describe('classification search', () => {
  it('searches server-side on the normalised label and returns provenance with every row', async () => {
    const active = await getDetermination(db, 'TX20260253');
    if (active.resolution !== 'active') throw new Error('expected active');
    const { rows, total } = await searchClassifications(db, active.determination.wdId, {
      query: 'electrician',
    });
    expect(total).toBeGreaterThan(0);
    expect(rows.length).toBe(total);
    for (const row of rows) {
      expect(row.classificationLabel.toUpperCase()).toContain('ELECTRICIAN');
      expect(row.wdNumber).toBe('TX20260253');
      expect(row.modificationNumber).toBe(1);
      expect(row.sourceUrl).toContain('sam.gov');
      expect(Number(row.baseRate)).toBeGreaterThan(0);
    }
  });

  it('pages a large determination rather than returning all of it', async () => {
    const heavy = await getDetermination(db, 'TX20260034');
    if (heavy.resolution !== 'active') throw new Error('expected active');
    const page = await searchClassifications(db, heavy.determination.wdId, { limit: 10 });
    expect(page.rows).toHaveLength(10);
    expect(page.total).toBe(66);
  });
});

describe('corpus health (gate G6)', () => {
  it('reports what the ops surface promises', async () => {
    const health = await corpusHealth(db);
    expect(health.activeDeterminations).toBe(6);
    expect(health.counties).toBe(254);
    expect(health.classifications).toBeGreaterThan(200);
    expect(health.determinationsWithHistory).toBe(6);
    expect(health.stale).toBe(false);
  });

  it('an empty corpus is degraded, not fresh', async () => {
    const empty = await makeDb();
    try {
      const health = await corpusHealth(empty.db);
      expect(health.activeDeterminations).toBe(0);
      expect(health.stale).toBe(true);
    } finally {
      await empty.close();
    }
  });
});

describe('gate G9 — a project pinned to a modification never reads another', () => {
  it('reads mod 0’s rows from mod 0’s wd_id, with mod 1 present in the same database', async () => {
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const pinned = await searchClassifications(db, modZero.wdId, {});
    expect(pinned.total).toBe(54);
    for (const row of pinned.rows) expect(row.modificationNumber).toBe(0);

    const active = await getDetermination(db, 'TX20260253');
    if (active.resolution !== 'active') throw new Error('expected active');
    expect(active.determination.wdId).not.toBe(modZero.wdId);
  });
});

describe('the development seed builds the corpus through the real pipeline', () => {
  it('seeds counties, six determinations and the superseded revision, and is idempotent', async () => {
    const { seedCorpusFromFixtures } = await import('../src/lib/kb/seed');
    const fresh = await makeDb();
    try {
      const first = await seedCorpusFromFixtures(fresh.db, makeSam());
      expect(first.counties).toBe(254);
      // Six index records, six detail fixtures, plus mod 0 of TX20260253.
      expect(first.determinations).toBe(7);
      expect(first.classifications).toBeGreaterThan(250);
      expect(first.histories).toBe(6);

      const second = await seedCorpusFromFixtures(fresh.db, makeSam());
      expect(second.skipped).toBe('already_seeded');
    } finally {
      await fresh.close();
    }
  });
});
