/**
 * GET /api/cron/reminders — the reminder drain. `specs/07` §8.
 *
 * A SECOND CRON PATH, beside `/api/cron/drain`, and the separation is
 * deliberate. The queue drain runs arbitrary job handlers with a wall-clock
 * budget; the reminder drain claims a bounded batch of rungs and sends mail,
 * which is the one thing in this product that cannot be replayed if a batch is
 * killed halfway. Giving it its own invocation means its batch size and its
 * schedule can be tuned without touching every other job, and an incident in
 * one does not stop the other.
 *
 * Auth is the Vercel Cron secret, compared in constant time, exactly as the
 * platform's own drain does it. `x-cron-secret` is accepted for a manual curl.
 */
import '@/lib/platform';

import { getAdapters } from '@octopus/platform/adapters';
import { secretsMatch } from '@octopus/platform/auth';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { drainReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function handle(request: Request): Promise<Response> {
  const env = getEnv();
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const alternative = request.headers.get('x-cron-secret') ?? '';

  if (!env.CRON_SECRET || !(secretsMatch(bearer, env.CRON_SECRET) || secretsMatch(alternative, env.CRON_SECRET))) {
    return new Response('unauthorized', { status: 401 });
  }

  const db = await getDb();
  const summary = await drainReminders(db, getAdapters(), { limit: env.JOBS_BATCH_SIZE });
  // `sendEnabled` is reported so an operator can tell "nothing was due" from
  // "everything was rendered and nothing was sent" (specs/07 A10).
  return Response.json({ ...summary, sendEnabled: env.SEND_ENABLED === true }, { status: 200 });
}

export const GET = handle;
export const POST = handle;
