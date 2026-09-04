/**
 * Load-time half of M14 (`specs/14` §The two halves, A).
 *
 * `kb/kb-data/*.json` is committed to the repo and loaded into the database at
 * deploy as an **immutable snapshot**. The app never reads the files at request
 * time and never mutates a published record.
 *
 * Three properties, each with a test:
 *
 *  1. **Validation gates publication.** `assertKnowledgeBaseValid` runs first; a
 *     knowledge base that violates its own schema is never reachable. If it
 *     throws, nothing is written and the previous snapshot stays current
 *     (`specs/14` invariant 1, AC2).
 *  2. **The `isCurrent` flip is atomic.** One transaction clears the old flag,
 *     inserts the records and sets the new one, so a concurrent read sees
 *     exactly one current snapshot or the previous one — never zero.
 *  3. **Idempotent.** Re-running for the same `version` updates that snapshot in
 *     place rather than creating a second, because Vercel cron delivery is best
 *     effort and a deploy hook can fire twice.
 */

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';
import { and, eq, ne } from 'drizzle-orm';

import { kbRecords, kbSnapshots, kbSources } from '../schema';
import { entryPackReadiness } from './accessors';
import { contentHash } from './normalise';
import { KB_RECORDS, KB_SOURCE_BASELINE, kbVersion } from './records';
import { assertKnowledgeBaseValid } from './validate';
import type { StateTradeRecord } from './types';

export type SnapshotLoadResult = {
  snapshotId: string;
  version: string;
  recordCount: number;
  publishableCount: number;
  entryPackReadyCount: number;
  warnings: number;
  created: boolean;
};

function recordHash(record: StateTradeRecord): string {
  return contentHash(JSON.stringify(record));
}

export async function loadSnapshot(
  db: Db,
  options: { version?: string; today: string; records?: readonly StateTradeRecord[]; notes?: string } = {
    today: new Date().toISOString().slice(0, 10),
  },
): Promise<SnapshotLoadResult> {
  const today = options.today;
  const records = options.records ?? KB_RECORDS;
  // Validate WHAT IS BEING LOADED, not what happens to be committed: a caller
  // that passes records must have those records gated, or the assertion is
  // decorative for the one path that can carry a bad record.
  const validation = assertKnowledgeBaseValid(today, records);
  const version = options.version ?? kbVersion();

  return withTx(db, async (tx) => {
    const existing = await tx.select().from(kbSnapshots).where(eq(kbSnapshots.version, version)).limit(1);
    const snapshotId = existing[0]?.id ?? newId('kbs');
    const created = existing.length === 0;

    const publishableCount = records.filter((r) => r.provenance.publishable === true).length;
    let entryPackReadyCount = 0;

    if (created) {
      await tx.insert(kbSnapshots).values({
        id: snapshotId,
        version,
        recordCount: records.length,
        publishableCount,
        entryPackReadyCount: 0,
        isCurrent: false,
        notes: options.notes ?? null,
      });
    } else {
      await tx.delete(kbRecords).where(eq(kbRecords.snapshotId, snapshotId));
    }

    for (const record of records) {
      const pack = entryPackReadiness(record, today);
      if (pack.ready) entryPackReadyCount += 1;
      await tx.insert(kbRecords).values({
        id: newId('kbr'),
        snapshotId,
        recordId: record.record_id,
        state: record.state,
        trade: record.trade,
        publishable: record.provenance.publishable === true,
        entryPackReady: pack.ready,
        disclosedGaps: pack.disclosedGaps,
        document: record as unknown as Record<string, unknown>,
        contentSha256: recordHash(record),
      });
    }

    await tx
      .update(kbSnapshots)
      .set({ recordCount: records.length, publishableCount, entryPackReadyCount })
      .where(eq(kbSnapshots.id, snapshotId));

    // The flip, inside the same transaction as the writes.
    await tx.update(kbSnapshots).set({ isCurrent: false }).where(ne(kbSnapshots.id, snapshotId));
    await tx.update(kbSnapshots).set({ isCurrent: true }).where(eq(kbSnapshots.id, snapshotId));

    // Sources: the drift baseline the daily job compares against, seeded from
    // the Python baseline in `kb-data/_sources.json` so the two agree on day one.
    for (const entry of Object.values(KB_SOURCE_BASELINE)) {
      const rows = await tx.select().from(kbSources).where(eq(kbSources.sourceId, entry.source_id)).limit(1);
      const values = {
        url: entry.url,
        kind: entry.kind,
        baselineSha256: entry.content_sha256,
        baselineHead: entry.normalised_head ?? null,
        baselineTail: entry.normalised_tail ?? null,
      };
      if (rows.length === 0) await tx.insert(kbSources).values({ sourceId: entry.source_id, ...values });
      else await tx.update(kbSources).set(values).where(eq(kbSources.sourceId, entry.source_id));
    }

    return {
      snapshotId,
      version,
      recordCount: records.length,
      publishableCount,
      entryPackReadyCount,
      warnings: validation.warnings,
      created,
    };
  });
}

export async function currentSnapshotId(db: Db): Promise<string | null> {
  const rows = await db
    .select({ id: kbSnapshots.id })
    .from(kbSnapshots)
    .where(eq(kbSnapshots.isCurrent, true))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Every source a record's values actually cite — the coupling G10 scopes to. */
export async function recordsCitingSource(db: Db, sourceUrl: string): Promise<string[]> {
  const snapshot = await currentSnapshotId(db);
  if (!snapshot) return [];
  const rows = await db
    .select({ recordId: kbRecords.recordId, document: kbRecords.document })
    .from(kbRecords)
    .where(and(eq(kbRecords.snapshotId, snapshot), eq(kbRecords.publishable, true)));
  return rows
    .filter((r) => JSON.stringify(r.document).includes(sourceUrl))
    .map((r) => r.recordId);
}
