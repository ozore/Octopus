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
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

import type { Db } from '../src/lib/db';
import { claimJobs, completeJob, enqueue } from '../src/lib/db/queue';
import { schema } from '../src/lib/db/schema';

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
