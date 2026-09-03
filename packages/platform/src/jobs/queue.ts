/**
 * The queue, which is a table.
 *
 * `SELECT … FOR UPDATE SKIP LOCKED` is a correct, durable, transactional queue
 * that shares the database's backup and failover story — the same choice
 * Clausewright made, minus its worker process, because Vercel has none
 * (PLAN.md A12). Concurrency is real here even without workers: two overlapping
 * cron invocations, or a cron and a manual drain, must not process the same row
 * twice, and SKIP LOCKED is what makes the second one step over the first's
 * claim instead of blocking on it.
 *
 * The property that matters and is not visible in the SQL: enqueueing is
 * transactional with the business write. A subscription cannot be mirrored
 * without its welcome email being scheduled in the same transaction.
 */

import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';

import type { Db } from '../db';
import { jobs, type Job } from '../db/schema';
import { newId } from '../ids';

/** Rows a crashed invocation left locked are reclaimed after this window. */
export const DEFAULT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export type EnqueueInput = {
  kind: string;
  payload?: Record<string, unknown>;
  runAfter?: Date;
  maxAttempts?: number;
  /** Idempotency: the same key enqueued twice is one job. */
  dedupeKey?: string;
};

export async function enqueue(db: Db, input: EnqueueInput): Promise<Job | undefined> {
  const rows = await db
    .insert(jobs)
    .values({
      id: newId('job'),
      kind: input.kind,
      payload: (input.payload ?? {}) as Record<string, unknown>,
      ...(input.runAfter ? { runAfter: input.runAfter } : {}),
      ...(input.maxAttempts ? { maxAttempts: input.maxAttempts } : {}),
      ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
    })
    // A duplicate dedupe key is not an error: the work is already scheduled.
    .onConflictDoNothing({ target: jobs.dedupeKey })
    .returning();
  return rows[0];
}

/**
 * Claim up to `limit` due jobs atomically. The CTE + UPDATE … RETURNING is one
 * statement on purpose: claim and mark-running cannot be two round trips or a
 * crash between them loses the row.
 */
export async function claimJobs(
  db: Db,
  opts: { workerId: string; limit: number; kinds?: string[]; now?: Date },
): Promise<Job[]> {
  const kindFilter = opts.kinds?.length
    ? sql`AND kind IN (${sql.join(
        opts.kinds.map((k) => sql`${k}`),
        sql`, `,
      )})`
    : sql``;

  const result = await db.execute(sql`
    WITH claimed AS (
      SELECT id
      FROM ${jobs}
      WHERE status = 'pending'
        AND run_after <= now()
        ${kindFilter}
      ORDER BY run_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${opts.limit}
    )
    UPDATE ${jobs} AS j
    SET status = 'running',
        locked_at = now(),
        locked_by = ${opts.workerId},
        attempts = j.attempts + 1
    FROM claimed
    WHERE j.id = claimed.id
    RETURNING j.*;
  `);

  return normaliseRows<Job>(result);
}

export async function completeJob(db: Db, jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({ status: 'done', completedAt: new Date(), lockedAt: null, lockedBy: null })
    .where(eq(jobs.id, jobId));
}

/** Retry with a delay until `maxAttempts`, then park as `dead`. Nothing is
 *  dropped: a scheduled customer email must survive a failed invocation. */
export async function failJob(
  db: Db,
  job: Pick<Job, 'id' | 'attempts' | 'maxAttempts'>,
  error: unknown,
  retryDelayMs = 60_000,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const exhausted = job.attempts >= job.maxAttempts;
  await db
    .update(jobs)
    .set({
      status: exhausted ? 'dead' : 'pending',
      lastError: message.slice(0, 4000),
      lockedAt: null,
      lockedBy: null,
      runAfter: new Date(Date.now() + retryDelayMs),
    })
    .where(eq(jobs.id, job.id));
}

/**
 * Hand a claimed row back untouched — the drain ran out of invocation budget
 * before starting it. `attempts` is decremented because the claim already
 * incremented it: a job that is never attempted must not spend its retries on
 * a busy cron tick and end up dead-lettered without a single handler run.
 */
export async function releaseJob(db: Db, jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      attempts: sql`greatest(${jobs.attempts} - 1, 0)`,
    })
    .where(eq(jobs.id, jobId));
}

/** Rows whose invocation died mid-job return to the queue. */
export async function reclaimStaleJobs(
  db: Db,
  lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS,
): Promise<number> {
  const cutoff = new Date(Date.now() - lockTimeoutMs);
  const rows = await db
    .update(jobs)
    .set({ status: 'pending', lockedAt: null, lockedBy: null })
    .where(and(eq(jobs.status, 'running'), isNotNull(jobs.lockedAt), lt(jobs.lockedAt, cutoff)))
    .returning();
  return rows.length;
}

export async function queueDepth(db: Db): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: jobs.status, count: sql<number>`count(*)` })
    .from(jobs)
    .groupBy(jobs.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}

/**
 * postgres-js returns an array; PGlite returns `{ rows }`. Normalise both — and
 * remap snake_case to the camelCase keys the `Job` type uses, because
 * `claimJobs` bypasses the query builder (the builder cannot express
 * `FOR UPDATE SKIP LOCKED`) and therefore gets raw column names back. Without
 * the remap, `job.maxAttempts` is `undefined` and the exhaustion check silently
 * never fires.
 */
function normaliseRows<T>(result: unknown): T[] {
  const rows = Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : ((result as { rows?: Array<Record<string, unknown>> })?.rows ?? []);
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase())] = value;
    }
    return mapped;
  }) as T[];
}
