/**
 * `GET /api/cron/kb-backfill-history` — one-off at launch, re-runnable.
 *
 * Enqueues `kb.fetch_history` for every determination above modification 1
 * (the current index shows 858 of them) plus any explicitly named on the query
 * string — the landing page's worked examples and the determination timeline.
 *
 * **The landing page must not be the first thing to discover an empty history
 * table.** That is the whole reason this route exists as a route rather than as
 * a note in a runbook.
 */
import '@/lib/platform';

import { gt } from 'drizzle-orm';

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

  const url = new URL(request.url);
  const named = (url.searchParams.get('wd') ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const db = await getDb();
  const aboveFirst = await db
    .selectDistinct({ wdNumber: kbWageDeterminations.wdNumber })
    .from(kbWageDeterminations)
    .where(gt(kbWageDeterminations.modificationNumber, 1));

  const wdNumbers = new Set<string>([...named, ...aboveFirst.map((r) => r.wdNumber)]);
  let enqueued = 0;
  for (const wdNumber of wdNumbers) {
    const job = await enqueue(db, {
      kind: KB_JOB_KINDS.fetchHistory,
      payload: { wdNumber },
      dedupeKey: `kb.history:${wdNumber}`,
    });
    if (job) enqueued += 1;
  }
  return Response.json({ candidates: wdNumbers.size, enqueued });
}
