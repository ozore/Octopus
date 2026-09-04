/**
 * GET /api/cron/drain — the queue drain, called by Vercel Cron (vercel.json).
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. POST is accepted too, so
 * an operator can trigger a drain by hand during an incident.
 *
 * IT ALSO SCHEDULES THIS APP'S DAILY TICK. The platform's handler enqueues
 * `platform.housekeeping` with a per-day dedupe key; `wl.daily` — WL-14's
 * retention sweep and WL-09's pre-charge and renewal notices — rides the same
 * invocation with the same shape of key. A third Vercel cron entry would have
 * been the tidier expression, but Vercel's Hobby plan allows one schedule a day
 * and `vercel.json` already spends two (BUILD.md, deploy notes): one more would
 * fail the deploy the founder is standing in front of. A duplicate invocation
 * is safe — the dedupe key makes it one job, and every handler is idempotent.
 */
import '@/lib/platform';

import { createCronDrainHandler } from '@octopus/platform/http';
import { enqueue } from '@octopus/platform/jobs';

import { getDb } from '@/lib/db';
import { APP_JOB_KINDS } from '@/lib/jobs/kinds';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Bounded work per invocation; Vercel kills the function at the plan limit. */
export const maxDuration = 60;

const drain = createCronDrainHandler();

async function handler(request: Request): Promise<Response> {
  // The secret is checked by the platform's handler; scheduling before that
  // check would let an unauthenticated request enqueue work, so the tick is
  // scheduled only once the drain has authorised the caller. The drain runs
  // first, the tick lands on the next invocation — which for a daily schedule
  // is tomorrow, and for the `*/5` schedule a Pro deploy uses is five minutes.
  const response = await drain(request);
  if (response.status === 200) {
    const db = await getDb();
    await enqueue(db, {
      kind: APP_JOB_KINDS.daily,
      dedupeKey: `${APP_JOB_KINDS.daily}:${new Date().toISOString().slice(0, 10)}`,
    });
  }
  return response;
}

export const GET = handler;
export const POST = handler;
