/**
 * The queue — a Postgres table, a claim loop, and a lease.
 *
 * Spec: ARCHITECTURE.md ADR-005 ("Postgres is the database, the queue, the scheduler
 * and the tenant boundary"), §7 ("`jobs` rows carry `run_after`, `lease_until` and a
 * unique `idempotency_key`, so a double-claim after a worker crash cannot double-bill,
 * double-credit or double-promote"), §10.4's "worker crash mid-job → lease expires,
 * job re-claimed, idempotency key prevents double effects".
 *
 * ===========================================================================
 * THREE MECHANISMS, AND WHAT EACH ONE ACTUALLY DEFENDS
 *
 * 1. `SELECT … FOR UPDATE SKIP LOCKED` — two workers never claim the same row.
 *    Defends against concurrency. Does NOT defend against a crash.
 *
 * 2. `lease_until` — a claimed row whose lease has expired goes back to `ready`.
 *    Defends against a crash. Does NOT defend against the crash having happened
 *    AFTER the side effect, which is the case that matters.
 *
 * 3. The unique `idempotency_key`, on the JOB and again on every effect the job
 *    performs (`meter_events.filing_id`, `credits.idempotency_key`,
 *    `email_outbox.idempotency_key`, Stripe's own key). This is the one that
 *    defends against the case the first two cannot: the job ran, moved money, and
 *    died before saying so. The re-run reaches the same unique constraint and loses.
 *
 * Only the third is load-bearing for correctness. The first two are for throughput
 * and liveness, and it is worth being clear about which is which — a queue that
 * relies on leases for correctness is a queue that double-charges the first time a
 * container is moved during a deploy.
 *
 * ===========================================================================
 * FAILURE IS A ROW, NOT AN EXCEPTION AND NOT A PAGE
 *
 * `job_runs` records every attempt with one of four outcomes and no fifth. A job
 * that has exhausted its attempts becomes `dead`, which is a state the status page
 * renders and nothing else consumes — because the customer-visible response to a
 * dead ingest job is not a fixed ingest job, it is the freshness clock ageing, the
 * claim narrowing and the credit accruing, which happen with nobody's involvement
 * (I7, §10.1).
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../db';
import { systemClock, type Clock } from '../platform/clock';

export type JobState = 'ready' | 'claimed' | 'done' | 'failed' | 'dead';
export type RunOutcome = 'ok' | 'failed_closed' | 'skipped_duplicate' | 'lease_expired';

/** After this many attempts a job stops retrying. It does not escalate; it stops,
 *  and the ladder covers what it was for. */
export const MAX_ATTEMPTS = 5;
export const DEFAULT_LEASE_SECONDS = 900;

export interface JobRow {
  readonly id: number;
  readonly kind: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly attempts: number;
  readonly idempotencyKey: string | null;
  readonly runAfter: Date;
}

interface RawJob {
  readonly id: number | string;
  readonly kind: string;
  readonly payload: Record<string, unknown> | null;
  readonly attempts: number | string;
  readonly idempotency_key: string | null;
  readonly run_after: string | Date;
}

function toJob(row: RawJob): JobRow {
  return {
    id: Number(row.id),
    kind: row.kind,
    payload: row.payload ?? {},
    attempts: Number(row.attempts),
    idempotencyKey: row.idempotency_key,
    runAfter: new Date(row.run_after),
  };
}

export interface EnqueueInput {
  readonly kind: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly runAfter?: Date;
  /** Omit only for work that is genuinely allowed to happen twice. Nothing in the
   *  registry omits it. */
  readonly idempotencyKey?: string;
}

/**
 * Enqueue, losing quietly on a duplicate key.
 *
 * `{ enqueued: false }` is the ordinary result of a second scheduler instance
 * computing the same slot, and it is not an error — it is the mechanism working.
 */
export async function enqueue(
  db: Db | Tx,
  input: EnqueueInput,
  clock: Clock = systemClock,
): Promise<{ readonly enqueued: boolean; readonly id: number | null }> {
  const runAfter = (input.runAfter ?? clock.now()).toISOString();
  const result = await db.execute(sql`
    INSERT INTO jobs (kind, payload, state, run_after, idempotency_key)
    VALUES (${input.kind}, ${JSON.stringify(input.payload ?? {})}::jsonb, 'ready',
            ${runAfter}::timestamptz, ${input.idempotencyKey ?? null})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id
  `);
  const row = rowsOf<{ id: number | string }>(result)[0];
  return row ? { enqueued: true, id: Number(row.id) } : { enqueued: false, id: null };
}

/**
 * Claim up to `limit` due jobs. One statement, so the read and the state change
 * cannot be separated by a crash.
 */
export async function claimJobs(
  db: Db | Tx,
  options?: { readonly limit?: number; readonly leaseSeconds?: number; readonly clock?: Clock },
): Promise<readonly JobRow[]> {
  const clock = options?.clock ?? systemClock;
  const now = clock.now();
  const leaseUntil = new Date(now.getTime() + (options?.leaseSeconds ?? DEFAULT_LEASE_SECONDS) * 1000);

  const result = await db.execute(sql`
    UPDATE jobs SET state = 'claimed',
                    claimed_at = ${now.toISOString()}::timestamptz,
                    lease_until = ${leaseUntil.toISOString()}::timestamptz,
                    attempts = attempts + 1
     WHERE id IN (
       SELECT id FROM jobs
        WHERE state = 'ready' AND run_after <= ${now.toISOString()}::timestamptz
        ORDER BY run_after
        FOR UPDATE SKIP LOCKED
        LIMIT ${options?.limit ?? 10}
     )
     RETURNING id, kind, payload, attempts, idempotency_key, run_after
  `);
  return rowsOf<RawJob>(result).map(toJob);
}

export async function completeJob(db: Db | Tx, id: number): Promise<void> {
  await db.execute(sql`
    UPDATE jobs SET state = 'done', lease_until = NULL, last_error = NULL WHERE id = ${id}
  `);
}

/**
 * Record a failure and decide whether there is another attempt.
 *
 * Backoff is exponential with a cap. It has no jitter here because the queue is
 * claimed rather than polled by many workers at once — §8.3's jitter requirement is
 * about upstream calls, and the adapters own it.
 */
export async function failJob(
  db: Db | Tx,
  input: { readonly id: number; readonly attempts: number; readonly error: string },
  clock: Clock = systemClock,
): Promise<{ readonly state: JobState; readonly retryAt: Date | null }> {
  if (input.attempts >= MAX_ATTEMPTS) {
    await db.execute(sql`
      UPDATE jobs SET state = 'dead', lease_until = NULL, last_error = ${input.error} WHERE id = ${input.id}
    `);
    return { state: 'dead', retryAt: null };
  }
  const delayMs = Math.min(3_600_000, 60_000 * 2 ** Math.max(0, input.attempts - 1));
  const retryAt = new Date(clock.now().getTime() + delayMs);
  await db.execute(sql`
    UPDATE jobs SET state = 'ready', lease_until = NULL, last_error = ${input.error},
                    run_after = ${retryAt.toISOString()}::timestamptz
     WHERE id = ${input.id}
  `);
  return { state: 'ready', retryAt };
}

/**
 * Return jobs whose lease has expired to the ready pool.
 *
 * This is the crash path, and it writes its own `job_runs` row so the ledger shows
 * "this attempt ended without ever reporting" rather than showing nothing — the two
 * are indistinguishable from the outside, and only one of them is worth knowing.
 */
export async function reclaimExpiredLeases(
  db: Db | Tx,
  clock: Clock = systemClock,
): Promise<number> {
  const now = clock.now().toISOString();
  const reclaimed = rowsOf<RawJob>(
    await db.execute(sql`
      UPDATE jobs SET state = 'ready', lease_until = NULL
       WHERE state = 'claimed' AND lease_until IS NOT NULL AND lease_until < ${now}::timestamptz
       RETURNING id, kind, payload, attempts, idempotency_key, run_after
    `),
  );
  for (const row of reclaimed) {
    await db.execute(sql`
      INSERT INTO job_runs (job_id, kind, idempotency_key, attempt, started_at, finished_at, outcome, detail)
      VALUES (${Number(row.id)}, ${row.kind}, ${row.idempotency_key}, ${Number(row.attempts)},
              ${now}::timestamptz, ${now}::timestamptz, 'lease_expired',
              '{"note":"the lease expired before the attempt reported an outcome"}'::jsonb)
    `);
  }
  return reclaimed.length;
}

// ---------------------------------------------------------------------------
// The run ledger
// ---------------------------------------------------------------------------

export interface RunRecordInput {
  readonly jobId: number | null;
  readonly kind: string;
  readonly idempotencyKey: string | null;
  readonly attempt: number;
  readonly startedAt: Date;
  readonly finishedAt: Date;
  readonly outcome: RunOutcome;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly error?: string | null;
}

export async function recordRun(db: Db | Tx, input: RunRecordInput): Promise<number> {
  const result = await db.execute(sql`
    INSERT INTO job_runs (job_id, kind, idempotency_key, attempt, started_at, finished_at,
                          outcome, detail, error)
    VALUES (${input.jobId}, ${input.kind}, ${input.idempotencyKey}, ${input.attempt},
            ${input.startedAt.toISOString()}::timestamptz, ${input.finishedAt.toISOString()}::timestamptz,
            ${input.outcome}, ${JSON.stringify(input.detail)}::jsonb, ${input.error ?? null})
    RETURNING id
  `);
  return Number(rowsOf<{ id: number | string }>(result)[0]?.id ?? 0);
}

export async function lastRun(
  db: Db | Tx,
  kind: string,
): Promise<{ readonly at: Date; readonly outcome: RunOutcome } | null> {
  const row = rowsOf<{ started_at: string | Date; outcome: RunOutcome }>(
    await db.execute(sql`
      SELECT started_at, outcome FROM job_runs WHERE kind = ${kind}
       ORDER BY started_at DESC LIMIT 1
    `),
  )[0];
  return row ? { at: new Date(row.started_at), outcome: row.outcome } : null;
}

export async function jobByIdempotencyKey(db: Db | Tx, key: string): Promise<JobRow | null> {
  const row = rowsOf<RawJob>(
    await db.execute(sql`
      SELECT id, kind, payload, attempts, idempotency_key, run_after
        FROM jobs WHERE idempotency_key = ${key}
    `),
  )[0];
  return row ? toJob(row) : null;
}
