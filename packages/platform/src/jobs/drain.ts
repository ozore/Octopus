/**
 * Draining the queue from a cron invocation.
 *
 * There is no worker process on Vercel (PLAN.md A12), so "the worker" is a
 * bounded loop inside one HTTP request: reclaim stale locks, claim a batch,
 * run each handler, mark done or failed. BOUNDED is the operative word — a
 * serverless function has a wall-clock limit, so the batch size is configured
 * (`JOBS_BATCH_SIZE`) and whatever is left waits for the next tick rather than
 * being killed mid-flight.
 *
 * Failure is per job, never per batch: one handler throwing must not abandon
 * the nineteen jobs already claimed alongside it.
 */

import type { Db } from '../db';
import { claimJobs, completeJob, failJob, reclaimStaleJobs, releaseJob } from './queue';
import type { JobRegistry } from './registry';

export type DrainResult = {
  reclaimed: number;
  claimed: number;
  succeeded: number;
  failed: number;
  /** Claimed but handed back untouched: the invocation ran out of budget. */
  released: number;
  unhandled: number;
  durationMs: number;
  errors: Array<{ jobId: string; kind: string; error: string }>;
};

export type DrainOptions = {
  batchSize?: number;
  workerId?: string;
  kinds?: string[];
  /** Stop claiming when this much of the invocation budget is gone. */
  maxDurationMs?: number;
};

export async function drainJobs(
  ctx: { db: Db; registry: JobRegistry },
  options: DrainOptions = {},
): Promise<DrainResult> {
  const started = Date.now();
  const batchSize = options.batchSize ?? 20;
  const workerId = options.workerId ?? `cron-${Math.random().toString(36).slice(2, 8)}`;
  const maxDurationMs = options.maxDurationMs ?? 45_000;

  const result: DrainResult = {
    reclaimed: await reclaimStaleJobs(ctx.db),
    claimed: 0,
    succeeded: 0,
    failed: 0,
    released: 0,
    unhandled: 0,
    durationMs: 0,
    errors: [],
  };

  const jobs = await claimJobs(ctx.db, {
    workerId,
    limit: batchSize,
    ...(options.kinds ? { kinds: options.kinds } : {}),
  });
  result.claimed = jobs.length;

  for (const job of jobs) {
    if (Date.now() - started > maxDurationMs) {
      // Out of budget: hand the row back so the next tick takes it rather than
      // letting the platform kill us holding the lock. NOT `failJob` — an
      // unattempted job must not spend a retry on a busy tick.
      await releaseJob(ctx.db, job.id);
      result.released += 1;
      continue;
    }

    const handler = ctx.registry.get(job.kind);
    if (!handler) {
      result.unhandled += 1;
      result.errors.push({ jobId: job.id, kind: job.kind, error: 'no handler registered' });
      // A typo'd kind is a code bug, not a transient failure: park it now
      // instead of retrying it five times over an hour.
      await failJob(
        ctx.db,
        { ...job, attempts: job.maxAttempts },
        new Error(`no handler registered for kind "${job.kind}"`),
      );
      continue;
    }

    try {
      await handler((job.payload ?? {}) as Record<string, unknown>, {
        jobId: job.id,
        attempts: job.attempts,
      });
      await completeJob(ctx.db, job.id);
      result.succeeded += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        jobId: job.id,
        kind: job.kind,
        error: error instanceof Error ? error.message : String(error),
      });
      await failJob(ctx.db, job, error);
    }
  }

  result.durationMs = Date.now() - started;
  return result;
}
