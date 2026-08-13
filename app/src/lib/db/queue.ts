/**
 * The queue, which is a table.
 *
 * Spec: ARCHITECTURE.md ADR-005. At ~30 jobs/day, `SELECT … FOR UPDATE SKIP
 * LOCKED` is a correct, durable, transactional queue that shares the database's
 * backup and failover story. No Redis, no SQS, no Kafka, no external cron.
 *
 * The property that matters and is not visible in the SQL: enqueueing is
 * transactional with the business write. A case cannot be marked paid without
 * its follow-up sequence being scheduled in the same transaction — a
 * correctness guarantee a separate broker would cost real effort to reproduce.
 *
 * Revisit when sustained throughput exceeds ~10 jobs/second. Neither that nor
 * user-visible queue latency is plausible inside 12 months at modelled volumes.
 */

import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';

import type { Db } from './index';
import { jobs } from './schema';
import type { Job, NewJob } from './schema';

export type JobKind = Job['kind'];

/** Rows a crashed worker left locked are reclaimed after this window. */
export const DEFAULT_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export async function enqueue(db: Db, job: NewJob): Promise<Job> {
  const [row] = await db.insert(jobs).values(job).returning();
  if (!row) throw new Error('enqueue: insert returned no row');
  return row;
}

/**
 * Claim up to `limit` due jobs atomically.
 *
 * SKIP LOCKED is what makes concurrent consumers correct without a broker: a
 * second worker steps over rows the first has locked instead of blocking on
 * them.
 */
export async function claimJobs(
  db: Db,
  opts: { workerId: string; limit: number; kinds?: JobKind[] },
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

/**
 * Failure handling: retry with a delay until `maxAttempts`, then park the row as
 * `dead`. Nothing is dropped — a paid customer's document must survive a restart
 * (Twelve-Factor VI/IX).
 */
export async function failJob(
  db: Db,
  job: Pick<Job, 'id' | 'attempts' | 'maxAttempts'>,
  error: unknown,
  retryDelayMs = 30_000,
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

/** Return rows whose worker died mid-job to the queue. */
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

/**
 * postgres-js returns an array; PGlite returns `{ rows }`. Normalise both —
 * AND remap each row's raw SQL (snake_case) column names to the camelCase
 * keys the rest of the codebase (the `Job` type, `failJob`'s
 * `job.maxAttempts` exhaustion check, `worker/index.ts`'s handler dispatch)
 * expects.
 *
 * `claimJobs` bypasses Drizzle's query builder (it needs a single atomic
 * `WITH … FOR UPDATE SKIP LOCKED … UPDATE … RETURNING`, which the builder
 * cannot express), so `db.execute(sql\`…RETURNING j.*\`)` hands back rows keyed
 * by the literal Postgres column names — `max_attempts`, not `maxAttempts`.
 * Every other read path in this codebase goes through `db.select().from(jobs)`,
 * which Drizzle remaps automatically; this is the one path that does not, so it
 * must remap by hand or every camelCase-keyed reader downstream silently reads
 * `undefined` instead of throwing.
 */
function normaliseRows<T>(result: unknown): T[] {
  const rows = extractRawRows(result);
  return rows.map((row) => remapSnakeCaseKeys(row)) as T[];
}

function extractRawRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

function remapSnakeCaseKeys(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key.replace(/_([a-z0-9])/g, (_match, c: string) => c.toUpperCase())] = value;
  }
  return mapped;
}
