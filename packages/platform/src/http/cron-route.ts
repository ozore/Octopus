/**
 * GET /api/cron/drain — the queue drain, called by Vercel Cron.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on every cron invocation
 * (docs: "Securing cron jobs"), so the check is a constant-time compare against
 * the env var. `x-cron-secret` is accepted too, for a manual curl during an
 * incident.
 *
 * The route is intentionally the ONLY scheduler: there is no worker process on
 * Vercel (PLAN.md A12). A duplicate invocation is safe — jobs are claimed with
 * `FOR UPDATE SKIP LOCKED` and every platform handler is idempotent — which is
 * the property Vercel's own docs ask for ("cron delivery is best effort … can
 * occasionally invoke the same scheduled run more than once").
 */

import { secretsMatch } from '../auth/tokens';
import { drainJobs, type DrainOptions } from '../jobs/drain';
import { enqueue } from '../jobs/queue';
import { PLATFORM_JOB_KINDS } from '../jobs/handlers';
import type { JobRegistry } from '../jobs/registry';
import { getContext, getPlatformConfig } from '../runtime';

export type CronDrainOptions = DrainOptions & {
  registry?: JobRegistry;
  /** Enqueue the daily housekeeping job on each drain (deduped per day). */
  scheduleHousekeeping?: boolean;
};

export function createCronDrainHandler(options: CronDrainOptions = {}) {
  return async (request: Request): Promise<Response> => {
    const ctx = await getContext();
    const secret = ctx.env.CRON_SECRET;

    const header = request.headers.get('authorization') ?? '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
    const alternative = request.headers.get('x-cron-secret') ?? '';

    if (!secret || !(secretsMatch(bearer, secret) || secretsMatch(alternative, secret))) {
      return new Response('unauthorized', { status: 401 });
    }

    const registry = options.registry ?? getPlatformConfig().jobs;
    if (!registry) {
      return Response.json({ error: 'no job registry configured' }, { status: 500 });
    }

    if (options.scheduleHousekeeping !== false) {
      await enqueue(ctx.db, {
        kind: PLATFORM_JOB_KINDS.housekeeping,
        dedupeKey: `${PLATFORM_JOB_KINDS.housekeeping}:${new Date().toISOString().slice(0, 10)}`,
      });
    }

    const result = await drainJobs(
      { db: ctx.db, registry },
      {
        batchSize: options.batchSize ?? ctx.env.JOBS_BATCH_SIZE,
        ...(options.workerId ? { workerId: options.workerId } : {}),
        ...(options.kinds ? { kinds: options.kinds } : {}),
        ...(options.maxDurationMs ? { maxDurationMs: options.maxDurationMs } : {}),
      },
    );

    return Response.json(result, { status: 200 });
  };
}
