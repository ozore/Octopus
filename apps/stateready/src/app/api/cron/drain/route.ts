/**
 * GET /api/cron/drain — the ONE scheduled invocation, called by Vercel Cron.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. POST is accepted too, so
 * an operator can trigger a drain by hand during an incident.
 *
 * **The app's own daily work is ENQUEUED here and drained in the same
 * invocation.** Vercel Hobby permits exactly one cron a day and
 * `createCronDrainHandler` is drain-only (platform request P-1), so the alert
 * digests, the trial lifecycle, the deletion sweep and the knowledge-base drift
 * check are job KINDS deduped per day rather than four routes with four
 * schedules. Enqueue-then-drain means one HTTP request does all of it.
 *
 * THE SECRET IS CHECKED BEFORE ANYTHING IS ENQUEUED. The platform handler
 * checks it again and answers 401 on its own; this check exists because an
 * unauthenticated request must not be able to write a row, not because the
 * platform's is doubted.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { enqueueDailyJobs } from '@/lib/platform';
import { secretsMatch } from '@octopus/platform/auth';
import { getDb } from '@octopus/platform/db';
import { createCronDrainHandler } from '@octopus/platform/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Bounded work per invocation; Vercel kills the function at the plan limit. */
export const maxDuration = 60;

const drain = createCronDrainHandler();

function authorised(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return secretsMatch(bearer, secret) || secretsMatch(request.headers.get('x-cron-secret') ?? '', secret);
}

async function handler(request: Request): Promise<Response> {
  if (authorised(request)) {
    await enqueueDailyJobs(await getDb());
  }
  return drain(request);
}

export const GET = handler;
export const POST = handler;
