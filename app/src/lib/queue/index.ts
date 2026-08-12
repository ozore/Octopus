/**
 * The typed queue layer, built on `db/queue.ts`'s untyped `FOR UPDATE SKIP
 * LOCKED` primitives (ADR-005).
 *
 * Spec: ARCHITECTURE.md ADR-005 — "enqueue is transactional with the business
 * write... a case cannot be marked paid without its follow-up sequence being
 * scheduled in the same transaction." `enqueueJob` below accepts an optional
 * `Db` that may itself be a transaction handle (the return type of
 * `db.transaction(async (tx) => ...)`), which is what makes that guarantee
 * possible: callers pass `tx`, not `db`, from inside a transaction block.
 */

import type { Db } from '../db';
import { claimJobs, completeJob, DEFAULT_LOCK_TIMEOUT_MS, enqueue, failJob, reclaimStaleJobs } from '../db/queue';
import type { Job, NewJob } from '../db/schema';
import type { JobKind } from '../db/queue';
import { parseJobPayload, type JobPayloadFor } from './job-payloads';

export { DEFAULT_LOCK_TIMEOUT_MS, claimJobs, completeJob, failJob, reclaimStaleJobs };
export type { JobKind } from '../db/queue';
export * from './job-payloads';

export type EnqueueOptions = {
  runAfter?: Date;
  maxAttempts?: number;
};

/**
 * Validates the payload against its kind's schema BEFORE the insert, so a
 * malformed payload throws at the call site (inside the caller's transaction,
 * which then rolls back) rather than becoming a `jobs` row a worker claims and
 * fails on every retry until it goes `dead`.
 */
export async function enqueueJob<K extends JobKind>(
  db: Db,
  kind: K,
  payload: JobPayloadFor<K>,
  opts: EnqueueOptions = {},
): Promise<Job> {
  const validated = parseJobPayload(kind, payload);
  const values: NewJob = {
    kind,
    payload: validated,
    ...(opts.runAfter ? { runAfter: opts.runAfter } : {}),
    ...(opts.maxAttempts ? { maxAttempts: opts.maxAttempts } : {}),
  };
  return enqueue(db, values);
}
