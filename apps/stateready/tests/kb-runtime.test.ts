/**
 * M14's run-time half, on a real Postgres (PGlite) with the committed
 * migrations: snapshot load, the drift check, and the `no_change` behaviour
 * that decides whether `/admin/kb` is used or abandoned.
 *
 * **No network.** `runDriftCheck` takes an injected fetcher and every test here
 * passes a mock; `src/lib/kb/fetcher.ts` is the only module that can reach out,
 * and nothing in this file imports it.
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { appMigrationsDir } from '../src/lib/db';
import { closeAcceptedItems, resolveDriftItem, runDriftCheck, type Fetcher } from '../src/lib/kb/drift';
import { contentHash, normalise } from '../src/lib/kb/normalise';
import { KB_RECORDS } from '../src/lib/kb/records';
import { currentSnapshotId, loadSnapshot, recordsCitingSource } from '../src/lib/kb/snapshot';
import { kbDriftItems, kbRecords, kbSnapshots, kbSources, licences, technicians } from '../src/lib/schema';

const TODAY = '2026-09-03';

let db: Awaited<ReturnType<typeof createTestDb>>;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
});
afterEach(async () => {
  await db.close();
});

describe('snapshot load', () => {
  it('creates a snapshot with nine records, nine publishable, and flips isCurrent atomically', async () => {
    const result = await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    expect(result.recordCount).toBe(9);
    expect(result.publishableCount).toBe(9);
    // Six pass CORE_SET — see `kb.test.ts` and BUILD.md §Spec deviations.
    expect(result.entryPackReadyCount).toBe(6);
    expect(result.warnings).toBe(3);

    const rows = await db.db.select().from(kbSnapshots);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isCurrent).toBe(true);
    expect(await currentSnapshotId(db.db)).toBe(result.snapshotId);

    const records = await db.db.select().from(kbRecords);
    expect(records).toHaveLength(9);
    expect(records.every((r) => r.contentSha256.length === 64)).toBe(true);
  });

  it('seeds the drift baseline from kb-data/_sources.json, excerpts and all', async () => {
    await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const sources = await db.db.select().from(kbSources);
    expect(sources.length).toBeGreaterThan(30);
    const withExcerpt = sources.filter((s) => s.baselineHead && s.baselineHead.length > 0);
    expect(withExcerpt.length).toBeGreaterThan(30);
    expect(sources.every((s) => s.consecutiveFailures === 0)).toBe(true);
  });

  it('is idempotent across a repeated deploy hook', async () => {
    const first = await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const second = await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    expect(second.snapshotId).toBe(first.snapshotId);
    expect(second.created).toBe(false);
    expect(await db.db.select().from(kbSnapshots)).toHaveLength(1);
    expect(await db.db.select().from(kbRecords)).toHaveLength(9);
  });

  it('a new version supersedes the old one, and exactly one snapshot is current', async () => {
    const first = await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const second = await loadSnapshot(db.db, { today: TODAY, version: 'v2' });
    const rows = await db.db.select().from(kbSnapshots);
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.isCurrent)).toHaveLength(1);
    expect(await currentSnapshotId(db.db)).toBe(second.snapshotId);
    expect(second.snapshotId).not.toBe(first.snapshotId);
  });

  it('a corrupted record fails the load and the previous snapshot keeps serving', async () => {
    await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const previous = await currentSnapshotId(db.db);

    const corrupted = structuredClone(KB_RECORDS[0]!) as Record<string, unknown>;
    delete corrupted['boards'];
    await expect(
      loadSnapshot(db.db, { today: TODAY, version: 'v2', records: [corrupted as never] }),
    ).rejects.toThrow(/knowledge base is invalid/i);

    expect(await currentSnapshotId(db.db)).toBe(previous);
    expect(await db.db.select().from(kbSnapshots)).toHaveLength(1);
  });

  it('resolves which records cite a given source', async () => {
    await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const citing = await recordsCitingSource(db.db, 'https://www.tdlr.texas.gov/acr/contractor-renew.htm');
    expect(citing).toContain('tx.hvac');
    expect(citing).not.toContain('nc.plumbing');
  });
});

describe('the daily drift check', () => {
  const PAGE = '<html><body><p>Renewal fee is $65.</p></body></html>';

  function fetcherFor(bodies: Record<string, string>, status = 200): Fetcher {
    return async (url: string) => ({
      status: bodies[url] === undefined ? 404 : status,
      body: bodies[url] ?? '',
      contentType: 'text/html; charset=utf-8',
    });
  }

  async function seedOneSource(body: string) {
    await db.db.insert(kbSources).values({
      sourceId: 'tx.tdlr.acr_renew',
      url: 'https://www.tdlr.texas.gov/acr/contractor-renew.htm',
      kind: 'board_page',
      baselineSha256: contentHash(normalise(body)),
      baselineHead: normalise(body).slice(0, 4000),
      baselineTail: '',
    });
  }

  it('an unchanged page opens nothing and stamps the check', async () => {
    await seedOneSource(PAGE);
    const report = await runDriftCheck(
      db.db,
      fetcherFor({ 'https://www.tdlr.texas.gov/acr/contractor-renew.htm': PAGE }),
      { delayMs: 0 },
    );
    expect(report.unchanged).toBe(1);
    expect(report.drifted).toBe(0);
    expect(await db.db.select().from(kbDriftItems)).toHaveLength(0);
    const [source] = await db.db.select().from(kbSources);
    expect(source?.lastCheckedAt).toBeTruthy();
  });

  it('one changed byte opens exactly one item, with a readable diff summary', async () => {
    await seedOneSource(PAGE);
    const changed = PAGE.replace('$65', '$80');
    const report = await runDriftCheck(
      db.db,
      fetcherFor({ 'https://www.tdlr.texas.gov/acr/contractor-renew.htm': changed }),
      { delayMs: 0 },
    );
    expect(report.drifted).toBe(1);
    const items = await db.db.select().from(kbDriftItems);
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('content_changed');
    expect(items[0]?.diffSummary).toMatch(/\$65/);
    expect(items[0]?.diffSummary).toMatch(/\$80/);
  });

  it('never opens a second item for the same detected hash — cron delivery may repeat', async () => {
    await seedOneSource(PAGE);
    const changed = PAGE.replace('$65', '$80');
    const fetcher = fetcherFor({ 'https://www.tdlr.texas.gov/acr/contractor-renew.htm': changed });
    await runDriftCheck(db.db, fetcher, { delayMs: 0 });
    await runDriftCheck(db.db, fetcher, { delayMs: 0 });
    await runDriftCheck(db.db, fetcher, { delayMs: 0 });
    expect(await db.db.select().from(kbDriftItems)).toHaveLength(1);
  });

  it('orders the queue by blast radius: how many customers rely on the affected records', async () => {
    await loadSnapshot(db.db, { today: TODAY, version: 'v1' });
    const orgId = newId('org');
    await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical', slug: `sila-${orgId}` });
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'Dave', lastName: 'Alvarez' });
    await db.db.insert(licences).values({
      id: newId('lic'),
      orgId,
      holderKind: 'technician',
      technicianId: techId,
      state: 'TX',
      trade: 'hvac',
    });

    const url = 'https://www.tdlr.texas.gov/acr/contractor-renew.htm';
    await db.db.update(kbSources).set({ baselineSha256: 'stale' }).where(eq(kbSources.sourceId, 'tx.tdlr.acr_renew'));
    await runDriftCheck(db.db, fetcherFor({ [url]: PAGE }), { delayMs: 0, onlySourceIds: ['tx.tdlr.acr_renew'] });

    const [item] = await db.db.select().from(kbDriftItems);
    expect(item?.affectedRecordIds).toContain('tx.hvac');
    expect(item?.affectedOrganisations).toBe(1);
  });

  it('three consecutive failures open an "unreachable" item — a moved page is as important as a changed one', async () => {
    await seedOneSource(PAGE);
    const dead = fetcherFor({});
    await runDriftCheck(db.db, dead, { delayMs: 0 });
    expect(await db.db.select().from(kbDriftItems)).toHaveLength(0);
    await runDriftCheck(db.db, dead, { delayMs: 0 });
    expect(await db.db.select().from(kbDriftItems)).toHaveLength(0);
    await runDriftCheck(db.db, dead, { delayMs: 0 });

    const items = await db.db.select().from(kbDriftItems);
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('source_unreachable');
    expect(items[0]?.diffSummary).toMatch(/3 consecutive checks/);
  });

  it('a successful check resets the consecutive-failure counter', async () => {
    await seedOneSource(PAGE);
    await runDriftCheck(db.db, fetcherFor({}), { delayMs: 0 });
    await runDriftCheck(db.db, fetcherFor({ 'https://www.tdlr.texas.gov/acr/contractor-renew.htm': PAGE }), {
      delayMs: 0,
    });
    const [source] = await db.db.select().from(kbSources);
    expect(source?.consecutiveFailures).toBe(0);
  });

  it('a hash change with identical excerpts is reported as a PARITY signal, not as a rule change', async () => {
    // The head and tail excerpts match but the stored hash does not: that is the
    // app and kb-scripts normalising differently, and saying so is the
    // difference between a queue that is read and a queue that is abandoned.
    await db.db.insert(kbSources).values({
      sourceId: 'tx.tdlr.acr_apply',
      url: 'https://www.tdlr.texas.gov/acr/contractor-apply.htm',
      kind: 'board_page',
      baselineSha256: 'a-hash-from-a-different-normaliser',
      baselineHead: normalise(PAGE).slice(0, 4000),
      baselineTail: '',
    });
    const report = await runDriftCheck(
      db.db,
      fetcherFor({ 'https://www.tdlr.texas.gov/acr/contractor-apply.htm': PAGE }),
      { delayMs: 0 },
    );
    expect(report.parity).toBe(1);
    expect(report.drifted).toBe(0);
    const [item] = await db.db.select().from(kbDriftItems);
    expect(item?.kind).toBe('normalisation_parity');
    expect(item?.diffSummary).toMatch(/normalisation difference/i);
  });

  it('skips a binary payload visibly rather than hashing a PDF as if it were HTML', async () => {
    await seedOneSource(PAGE);
    const report = await runDriftCheck(
      db.db,
      async () => ({ status: 200, body: '%PDF-1.4 ...', contentType: 'application/pdf' }),
      { delayMs: 0 },
    );
    expect(report.skippedBinary).toBe(1);
    expect(await db.db.select().from(kbDriftItems)).toHaveLength(0);
  });
});

describe('resolving as no_change does not close the item until the baseline moves', () => {
  const PAGE = '<html><body><p>Renewal fee is $65.</p></body></html>';
  const CHANGED = '<html><body><p>Renewal fee is $65. Updated typography.</p></body></html>';
  const url = 'https://www.tdlr.texas.gov/acr/contractor-renew.htm';

  async function detect() {
    await db.db.insert(kbSources).values({
      sourceId: 'tx.tdlr.acr_renew',
      url,
      kind: 'board_page',
      baselineSha256: contentHash(normalise(PAGE)),
      baselineHead: normalise(PAGE).slice(0, 4000),
      baselineTail: '',
    });
    const fetcher: Fetcher = async () => ({ status: 200, body: CHANGED, contentType: 'text/html' });
    await runDriftCheck(db.db, fetcher, { delayMs: 0 });
    const [item] = await db.db.select().from(kbDriftItems);
    return { item: item!, fetcher };
  }

  it('leaves it "awaiting acceptance" with the exact command to run', async () => {
    const { item } = await detect();
    const outcome = await resolveDriftItem(db.db, { id: item.id, status: 'no_change', note: 'typography' });
    expect(outcome.awaitingAcceptance).toBe(true);
    expect(outcome.command).toBe(
      'python3 phase-4-revenue/stateready/kb-scripts/accept_drift.py --source-id tx.tdlr.acr_renew',
    );
  });

  /**
   * THE REGRESSION TEST `specs/14` AC6 ASKS FOR. The wave-1 behaviour —
   * "close it without touching any record" — meant the cron re-detected the
   * identical drift tomorrow and every day after, on the item class the spec
   * itself says will be the most common. This asserts it does not.
   */
  it('does not re-open an identical item on the next run', async () => {
    const { item, fetcher } = await detect();
    await resolveDriftItem(db.db, { id: item.id, status: 'no_change' });
    await runDriftCheck(db.db, fetcher, { delayMs: 0 });
    const items = await db.db.select().from(kbDriftItems);
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('no_change');
    expect(items[0]?.awaitingAcceptance).toBe(true);
  });

  it('closes automatically once a deploy lands whose baseline matches', async () => {
    const { item } = await detect();
    await resolveDriftItem(db.db, { id: item.id, status: 'no_change' });

    // `accept_drift.py` has run and the deploy carrying the new baseline arrives.
    await db.db
      .update(kbSources)
      .set({ baselineSha256: contentHash(normalise(CHANGED)) })
      .where(eq(kbSources.sourceId, 'tx.tdlr.acr_renew'));
    expect(await closeAcceptedItems(db.db)).toBe(1);

    const [closed] = await db.db.select().from(kbDriftItems);
    expect(closed?.awaitingAcceptance).toBe(false);
  });

  it('a corrected resolution closes immediately — the repo edit is the acceptance', async () => {
    const { item } = await detect();
    const outcome = await resolveDriftItem(db.db, { id: item.id, status: 'corrected' });
    expect(outcome.awaitingAcceptance).toBe(false);
    expect(outcome.command).toBeNull();
  });
});
