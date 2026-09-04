/**
 * `GET /api/cron/kb-full` — weekly. Enqueues a re-fetch of every ACTIVE pair,
 * ignoring the diff, so an in-place edit at the source is caught.
 *
 * It never re-fetches a superseded revision: those are immutable by definition,
 * and pulling 20,000 of them every week would be both pointless and rude to a
 * public service that asks us for no key.
 */
import '@/lib/platform';

import { eq } from 'drizzle-orm';

import { enqueue } from '@octopus/platform/jobs';

import { requireCronSecret } from '@/lib/cron-auth';
import { getDb } from '@/lib/db';
import { KB_JOB_KINDS } from '@/lib/kb';
import { kbWageDeterminations } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const refused = await requireCronSecret(request);
  if (refused) return refused;

  const db = await getDb();
  const active = await db
    .select({
      wdNumber: kbWageDeterminations.wdNumber,
      modificationNumber: kbWageDeterminations.modificationNumber,
    })
    .from(kbWageDeterminations)
    .where(eq(kbWageDeterminations.isActive, true));

  const stamp = new Date().toISOString().slice(0, 10);
  let enqueued = 0;
  for (const row of active) {
    const job = await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: row.wdNumber, modificationNumber: row.modificationNumber, trigger: 'index' },
      // Weekly, so the dedupe key carries the date: the same pair may be
      // re-checked next week but not twice this week.
      dedupeKey: `kb.full:${stamp}:${row.wdNumber}:${row.modificationNumber}`,
    });
    if (job) enqueued += 1;
  }
  return Response.json({ active: active.length, enqueued });
}
