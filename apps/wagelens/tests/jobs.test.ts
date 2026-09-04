/**
 * The knowledge base's job handlers, drained through the platform's real queue.
 *
 * What matters here is not that a handler runs but that the PIPELINE is
 * idempotent the way WL-13 claims: `dedupe_key` makes a double enqueue a no-op
 * at the database level rather than in application code, and a new modification
 * fans out exactly one alert job per pinned project.
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createJobRegistry, drainJobs, enqueue } from '@octopus/platform/jobs';
import { events, jobs } from '@octopus/platform/db';

import { KB_JOB_KINDS } from '../src/lib/kb/job-kinds';
import { ingestDetermination } from '../src/lib/kb/ingest';
import { registerKbJobs } from '../src/lib/kb/jobs';
import { createProject } from '../src/lib/repositories/projects';
import { kbWageDeterminations, kbWdModifications } from '../src/lib/schema';
import { harrisIndexRecords, makeDb, makeSam, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let sam: ReturnType<typeof makeSam>;
let registry: ReturnType<typeof createJobRegistry>;

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  sam = makeSam();
  registry = createJobRegistry();
  registerKbJobs(registry, async () => ({ db, sam }));
});
afterEach(async () => {
  await harness.close();
});

const drain = () => drainJobs({ db, registry }, { batchSize: 50 });

describe('kb.fetch_determination', () => {
  it('ingests the pair and marks the revision’s text as held', async () => {
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1, trigger: 'index' },
      dedupeKey: 'kb.fetch:TX20260253:1',
    });
    const result = await drain();
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const [wd] = await db
      .select()
      .from(kbWageDeterminations)
      .where(eq(kbWageDeterminations.wdNumber, 'TX20260253'));
    expect(wd?.modificationNumber).toBe(1);

    const mods = await db
      .select()
      .from(kbWdModifications)
      .where(eq(kbWdModifications.wdNumber, 'TX20260253'));
    expect(mods.find((m) => m.modificationNumber === 1)?.textHeld).toBe(true);
  });

  it('a duplicate dedupe key is a no-op AT THE DATABASE LEVEL', async () => {
    const first = await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1 },
      dedupeKey: 'kb.fetch:TX20260253:1',
    });
    const second = await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1 },
      dedupeKey: 'kb.fetch:TX20260253:1',
    });
    expect(first).toBeDefined();
    expect(second).toBeUndefined();
    expect(await db.select().from(jobs)).toHaveLength(1);
  });

  it('a 404 fails that job alone and leaves the corpus untouched', async () => {
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 7 },
      dedupeKey: 'kb.fetch:TX20260253:7',
    });
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260031', modificationNumber: 1 },
      dedupeKey: 'kb.fetch:TX20260031:1',
    });
    const result = await drain();
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(await db.select().from(kbWageDeterminations)).toHaveLength(1);
  });
});

describe('kb.fetch_history', () => {
  it('stores every revision and fetches the text of only the ones asked for', async () => {
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchHistory,
      payload: { wdNumber: 'TX20260253', wantedRevisions: [0] },
      dedupeKey: 'kb.history:TX20260253',
    });
    await drain();

    const mods = await db
      .select()
      .from(kbWdModifications)
      .where(eq(kbWdModifications.wdNumber, 'TX20260253'));
    expect(mods).toHaveLength(2);
    // Nothing has been fetched yet — history is metadata (V11).
    expect(await db.select().from(kbWageDeterminations)).toHaveLength(0);

    // …but the wanted revision was enqueued, and draining it stores mod 0.
    await drain();
    const held = await db.select().from(kbWageDeterminations);
    expect(held).toHaveLength(1);
    expect(held[0]?.modificationNumber).toBe(0);
  });
});

describe('a new modification fans out', () => {
  it('enqueues one alert per pinned project and one watch notification', async () => {
    const { orgId, userId } = await seedOrg(db);
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: true,
    });
    for (const name of ['Job A', 'Job B']) {
      await createProject(db, {
        orgId,
        name,
        wdId: modZero.wdId,
        wdNumber: 'TX20260253',
        wdModificationNumber: 0,
        wdPinnedByUserId: userId,
        stateCode: 'TX',
      });
    }

    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1, trigger: 'index' },
      dedupeKey: 'kb.fetch:TX20260253:1',
    });
    await drain();

    const queued = await db.select().from(jobs);
    const alerts = queued.filter((j) => j.kind === KB_JOB_KINDS.modificationDetected);
    const watches = queued.filter((j) => j.kind === KB_JOB_KINDS.watchNotify);
    expect(alerts).toHaveLength(2);
    expect(watches).toHaveLength(1);
    expect(new Set(alerts.map((a) => a.dedupeKey)).size).toBe(2);

    const tracked = await db.select().from(events);
    const detected = tracked.find((e) => e.name === 'kb_modification_detected');
    expect((detected?.props as Record<string, unknown>)['pinned_projects']).toBe(2);
  });

  it('re-running the same detection enqueues no second alert', async () => {
    const { orgId, userId } = await seedOrg(db);
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: true,
    });
    await createProject(db, {
      orgId,
      name: 'Job A',
      wdId: modZero.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 0,
      wdPinnedByUserId: userId,
      stateCode: 'TX',
    });
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1 },
      dedupeKey: 'kb.fetch:TX20260253:1',
    });
    await drain();
    const first = (await db.select().from(jobs)).filter(
      (j) => j.kind === KB_JOB_KINDS.modificationDetected,
    ).length;

    // Second detection of the same modification: already held, so nothing fans out.
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: 'TX20260253', modificationNumber: 1 },
      dedupeKey: 'kb.fetch:TX20260253:1:again',
    });
    await drain();
    const second = (await db.select().from(jobs)).filter(
      (j) => j.kind === KB_JOB_KINDS.modificationDetected,
    ).length;
    expect(second).toBe(first);
  });
});

describe('the seams WL-08 and WL-14 take over', () => {
  it('registers them as no-ops, so a real modification is not parked as dead', async () => {
    expect(registry.get(KB_JOB_KINDS.modificationDetected)).toBeDefined();
    expect(registry.get(KB_JOB_KINDS.watchNotify)).toBeDefined();

    await enqueue(db, {
      kind: KB_JOB_KINDS.modificationDetected,
      payload: { projectId: 'p', wdNumber: 'TX20260253', fromModification: 0, toModification: 1 },
    });
    const result = await drain();
    expect(result.unhandled).toBe(0);
    expect(result.succeeded).toBe(1);
  });
});
