/**
 * Queue behaviour, against a real Postgres engine (PGlite) with no container and
 * no network.
 *
 * ADR-005 claims that `SELECT … FOR UPDATE SKIP LOCKED` is a correct queue at
 * our volume. That claim is worth a test rather than a sentence: the failure it
 * guards against — two workers claiming the same job and double-sending a
 * customer's outcome email — is silent and corrupts L4.
 */

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

import type { Db } from '../src/lib/db';
import { claimJobs, completeJob, enqueue, failJob, reclaimStaleJobs } from '../src/lib/db/queue';
import { schema } from '../src/lib/db/schema';
import { jobs as jobsTable } from '../src/lib/db/schema';

let client: PGlite;
let db: Db;

const DDL = `
  CREATE TYPE job_kind AS ENUM (
    'render_pdf','send_scheduled_email','redact_notice','promote_l4','sla_breach_refund',
    'cache_rewarm','process_inbound_notice','escalation_review','delete_subject_data');
  CREATE TYPE job_status AS ENUM ('pending','running','done','failed','dead');
  CREATE TABLE jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind job_kind NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status job_status NOT NULL DEFAULT 'pending',
    run_after timestamptz NOT NULL DEFAULT now(),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    locked_at timestamptz,
    locked_by text,
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
  );
`;

beforeAll(async () => {
  client = new PGlite();
  await client.exec(DDL);
  db = drizzle(client, { schema }) as Db;
});

afterAll(async () => {
  await client.close();
});

describe('postgres-as-queue (ADR-005)', () => {
  it('claims a due job exactly once and marks it running', async () => {
    await enqueue(db, { kind: 'render_pdf', payload: { caseId: 'case_001' } });

    const first = await claimJobs(db, { workerId: 'w1', limit: 10 });
    expect(first).toHaveLength(1);
    expect(first[0]?.status).toBe('running');
    expect(first[0]?.attempts).toBe(1);

    // A second worker must find nothing: the row is no longer pending.
    const second = await claimJobs(db, { workerId: 'w2', limit: 10 });
    expect(second).toHaveLength(0);

    await completeJob(db, first[0]!.id);
    const third = await claimJobs(db, { workerId: 'w3', limit: 10 });
    expect(third).toHaveLength(0);
  });

  it('does not claim a job scheduled for the future', async () => {
    await enqueue(db, {
      kind: 'send_scheduled_email',
      payload: { kind: 'd3' },
      runAfter: new Date(Date.now() + 60_000),
    });
    const claimed = await claimJobs(db, { workerId: 'w1', limit: 10 });
    expect(claimed).toHaveLength(0);
  });

  it('filters by kind so the worker can partition its loop', async () => {
    await enqueue(db, { kind: 'redact_notice', payload: {} });
    const wrongKind = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['promote_l4'] });
    expect(wrongKind).toHaveLength(0);
    const rightKind = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['redact_notice'] });
    expect(rightKind).toHaveLength(1);
  });
});

describe('retry and dead-letter (failJob)', () => {
  it('retries a failed job with a delayed run_after until max_attempts, then parks it as dead', async () => {
    const created = await enqueue(db, {
      kind: 'cache_rewarm',
      payload: { attempt: 'first' },
      maxAttempts: 3,
    });

    // Attempt 1: claim increments attempts to 1, fail with a negative delay so
    // the retried row is immediately due (no real-time sleep in a test).
    const [claim1] = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['cache_rewarm'] });
    expect(claim1?.attempts).toBe(1);
    await failJob(db, claim1!, new Error('transient failure #1'), -1000);

    const afterFail1 = (
      await db.select().from(jobsTable).where(eq(jobsTable.id, created.id))
    )[0];
    expect(afterFail1?.status).toBe('pending'); // 1 < maxAttempts(3): retried, not dead
    expect(afterFail1?.lastError).toMatch(/transient failure #1/);
    expect(afterFail1?.lockedAt).toBeNull();
    expect(afterFail1?.lockedBy).toBeNull();

    // Attempt 2: same story.
    const [claim2] = await claimJobs(db, { workerId: 'w2', limit: 10, kinds: ['cache_rewarm'] });
    expect(claim2?.attempts).toBe(2);
    await failJob(db, claim2!, new Error('transient failure #2'), -1000);
    const afterFail2 = (
      await db.select().from(jobsTable).where(eq(jobsTable.id, created.id))
    )[0];
    expect(afterFail2?.status).toBe('pending'); // 2 < maxAttempts(3): still retried

    // Attempt 3: attempts reaches max_attempts on this claim, so the next
    // failure exhausts retries and the row is dead-lettered, not retried.
    const [claim3] = await claimJobs(db, { workerId: 'w3', limit: 10, kinds: ['cache_rewarm'] });
    expect(claim3?.attempts).toBe(3);
    await failJob(db, claim3!, new Error('transient failure #3 — giving up'), -1000);

    const dead = (await db.select().from(jobsTable).where(eq(jobsTable.id, created.id)))[0];
    expect(dead?.status).toBe('dead');
    expect(dead?.lastError).toMatch(/giving up/);

    // A dead job is never claimed again — nothing silently retries forever.
    const claimAfterDead = await claimJobs(db, { workerId: 'w4', limit: 10, kinds: ['cache_rewarm'] });
    expect(claimAfterDead).toHaveLength(0);
  });

  it('dead-letters on the very first failure when max_attempts is 1', async () => {
    const created = await enqueue(db, {
      kind: 'sla_breach_refund',
      payload: {},
      maxAttempts: 1,
    });
    const [claim] = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['sla_breach_refund'] });
    expect(claim?.attempts).toBe(1);

    await failJob(db, claim!, new Error('unrecoverable'), -1000);

    const row = (await db.select().from(jobsTable).where(eq(jobsTable.id, created.id)))[0];
    expect(row?.status).toBe('dead');
  });

  it('truncates an oversized error message rather than storing it unbounded', async () => {
    await enqueue(db, { kind: 'process_inbound_notice', payload: {}, maxAttempts: 5 });
    const [claim] = await claimJobs(db, {
      workerId: 'w1',
      limit: 10,
      kinds: ['process_inbound_notice'],
    });
    const huge = 'x'.repeat(10_000);
    await failJob(db, claim!, new Error(huge), -1000);
    const row = (await db.select().from(jobsTable).where(eq(jobsTable.id, claim!.id)))[0];
    expect(row?.lastError?.length).toBeLessThanOrEqual(4000);
  });
});

describe('reclaimStaleJobs (a crashed worker never strands a job forever)', () => {
  it('returns a job whose lock is older than the timeout back to pending', async () => {
    const created = await enqueue(db, { kind: 'delete_subject_data', payload: {} });
    const [claimed] = await claimJobs(db, {
      workerId: 'crashed-worker',
      limit: 10,
      kinds: ['delete_subject_data'],
    });
    expect(claimed?.status).toBe('running');

    // Simulate a worker that claimed the job long ago and then died mid-job,
    // without going through completeJob or failJob.
    await db
      .update(jobsTable)
      .set({ lockedAt: new Date(Date.now() - 10 * 60 * 1000) })
      .where(eq(jobsTable.id, created.id));

    const reclaimedCount = await reclaimStaleJobs(db, 5 * 60 * 1000);
    expect(reclaimedCount).toBe(1);

    const row = (await db.select().from(jobsTable).where(eq(jobsTable.id, created.id)))[0];
    expect(row?.status).toBe('pending');
    expect(row?.lockedAt).toBeNull();
    expect(row?.lockedBy).toBeNull();

    // Now a fresh worker can pick it up.
    const [reclaimedByWorker] = await claimJobs(db, {
      workerId: 'w2',
      limit: 10,
      kinds: ['delete_subject_data'],
    });
    expect(reclaimedByWorker?.id).toBe(created.id);
  });

  it('leaves a freshly-locked running job alone', async () => {
    await enqueue(db, { kind: 'promote_l4', payload: {} });
    await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['promote_l4'] });
    // lockedAt was just set to now() by the claim above — well inside the
    // default 5-minute timeout, so nothing should be reclaimed.
    const reclaimedCount = await reclaimStaleJobs(db, 5 * 60 * 1000);
    expect(reclaimedCount).toBe(0);
  });
});

describe('concurrent claims never double-claim the same row (SKIP LOCKED)', () => {
  it('splits a batch of due jobs across two concurrent claimers with no overlap and no loss', async () => {
    const kind = 'escalation_review' as const;
    const total = 8;
    const created = await Promise.all(
      Array.from({ length: total }, (_, i) => enqueue(db, { kind, payload: { i } })),
    );

    // Two "workers" race to claim from the same pool at once. Correctness
    // here does not depend on true OS-level parallelism — it depends on
    // FOR UPDATE SKIP LOCKED making the two claiming transactions disjoint
    // regardless of how the driver interleaves them.
    const [batchA, batchB] = await Promise.all([
      claimJobs(db, { workerId: 'wA', limit: 5, kinds: [kind] }),
      claimJobs(db, { workerId: 'wB', limit: 5, kinds: [kind] }),
    ]);

    const claimedIds = [...batchA, ...batchB].map((j) => j.id);
    // No job claimed twice.
    expect(new Set(claimedIds).size).toBe(claimedIds.length);
    // Every created job was claimed by exactly one of the two workers.
    expect(claimedIds.sort()).toEqual(created.map((j) => j.id).sort());
    // Nothing left pending for this kind.
    const leftover = await claimJobs(db, { workerId: 'wC', limit: 10, kinds: [kind] });
    expect(leftover).toHaveLength(0);
  });
});
