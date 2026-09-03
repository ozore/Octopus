import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  claimJobs,
  createJobRegistry,
  drainJobs,
  enqueue,
  enqueueNotification,
  PLATFORM_JOB_KINDS,
  queueDepth,
  reclaimStaleJobs,
} from '../src/jobs';
import { jobs, memberships, organisations, subscriptions, users } from '../src/db/schema';
import { newId } from '../src/ids';
import { createTestHarness, type TestHarness } from '../src/testing';

let h: TestHarness;
beforeEach(async () => {
  h = await createTestHarness();
});
afterEach(async () => {
  await h.close();
});

async function seedOrgWithOwner(email = 'owner@ridgeline.test') {
  const [org] = await h.db
    .insert(organisations)
    .values({ id: newId('org'), name: 'Ridgeline', slug: `ridgeline-${Math.random().toString(36).slice(2, 6)}` })
    .returning();
  const [user] = await h.db.insert(users).values({ id: newId('usr'), email }).returning();
  await h.db.insert(memberships).values({
    id: newId('mem'),
    orgId: org?.id as string,
    userId: user?.id as string,
    role: 'owner',
  });
  return { orgId: org?.id as string, userId: user?.id as string, email };
}

describe('queue', () => {
  it('enqueues and claims a job exactly once', async () => {
    await enqueue(h.db, { kind: 'test.hello', payload: { a: 1 } });
    const first = await claimJobs(h.db, { workerId: 'w1', limit: 10 });
    expect(first).toHaveLength(1);
    expect(first[0]?.kind).toBe('test.hello');
    expect(first[0]?.attempts).toBe(1);
    expect(first[0]?.maxAttempts).toBe(5);

    // A second invocation must not see a claimed row (FOR UPDATE SKIP LOCKED
    // plus the status flip).
    expect(await claimJobs(h.db, { workerId: 'w2', limit: 10 })).toHaveLength(0);
  });

  it('deduplicates by key', async () => {
    await enqueue(h.db, { kind: 'test.hello', dedupeKey: 'once' });
    const second = await enqueue(h.db, { kind: 'test.hello', dedupeKey: 'once' });
    expect(second).toBeUndefined();
    expect(await h.db.select().from(jobs)).toHaveLength(1);
  });

  it('does not claim a job scheduled for later', async () => {
    await enqueue(h.db, { kind: 'test.later', runAfter: new Date(Date.now() + 60_000) });
    expect(await claimJobs(h.db, { workerId: 'w1', limit: 5 })).toHaveLength(0);
  });

  it('filters by kind, so one cron path can drain a subset', async () => {
    await enqueue(h.db, { kind: 'a.one' });
    await enqueue(h.db, { kind: 'b.two' });
    const claimed = await claimJobs(h.db, { workerId: 'w1', limit: 10, kinds: ['b.two'] });
    expect(claimed.map((j) => j.kind)).toEqual(['b.two']);
  });

  it('reclaims a row whose invocation died holding the lock', async () => {
    await enqueue(h.db, { kind: 'test.stale' });
    await claimJobs(h.db, { workerId: 'dead-worker', limit: 1 });
    await h.db
      .update(jobs)
      .set({ lockedAt: new Date(Date.now() - 10 * 60 * 1000) })
      .where(eq(jobs.kind, 'test.stale'));

    expect(await reclaimStaleJobs(h.db)).toBe(1);
    expect(await claimJobs(h.db, { workerId: 'w2', limit: 1 })).toHaveLength(1);
  });

  it('reports depth by status', async () => {
    await enqueue(h.db, { kind: 'test.depth' });
    expect(await queueDepth(h.db)).toMatchObject({ pending: 1 });
  });
});

describe('drain', () => {
  it('runs handlers, marks done, and keeps going after one throws', async () => {
    const registry = createJobRegistry();
    const seen: string[] = [];
    registry.register('ok.job', async (payload) => {
      seen.push(String(payload['id']));
    });
    registry.register('bad.job', async () => {
      throw new Error('handler exploded');
    });

    await enqueue(h.db, { kind: 'ok.job', payload: { id: 'one' } });
    await enqueue(h.db, { kind: 'bad.job' });
    await enqueue(h.db, { kind: 'ok.job', payload: { id: 'two' } });

    const result = await drainJobs({ db: h.db, registry }, { batchSize: 10 });
    expect(result.claimed).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(seen.sort()).toEqual(['one', 'two']);

    const rows = await h.db.select().from(jobs);
    expect(rows.filter((r) => r.status === 'done')).toHaveLength(2);
    const failedRow = rows.find((r) => r.kind === 'bad.job');
    expect(failedRow?.status).toBe('pending');
    expect(failedRow?.lastError).toContain('handler exploded');
  });

  it('parks a job whose kind has no handler instead of retrying a typo', async () => {
    const registry = createJobRegistry();
    await enqueue(h.db, { kind: 'nobody.handles.this' });
    const result = await drainJobs({ db: h.db, registry }, { batchSize: 5 });
    expect(result.unhandled).toBe(1);
    const [row] = await h.db.select().from(jobs);
    expect(row?.status).toBe('dead');
    expect(row?.lastError).toContain('no handler registered');
  });

  it('dead-letters a job that exhausts its attempts', async () => {
    const registry = createJobRegistry();
    registry.register('flaky.job', async () => {
      throw new Error('still broken');
    });
    await enqueue(h.db, { kind: 'flaky.job', maxAttempts: 2 });

    for (let i = 0; i < 2; i += 1) {
      await h.db.update(jobs).set({ runAfter: new Date(Date.now() - 1000) });
      await drainJobs({ db: h.db, registry }, { batchSize: 5 });
    }
    const [row] = await h.db.select().from(jobs);
    expect(row?.status).toBe('dead');
    expect(row?.attempts).toBe(2);
  });

  it('hands a job back untouched when the invocation runs out of budget', async () => {
    const registry = createJobRegistry();
    let ran = 0;
    registry.register('slow.job', async () => {
      ran += 1;
    });
    await enqueue(h.db, { kind: 'slow.job' });

    // A budget already spent: the job is claimed and released without running.
    const result = await drainJobs({ db: h.db, registry }, { maxDurationMs: -1 });
    expect(result.claimed).toBe(1);
    expect(result.released).toBe(1);
    expect(ran).toBe(0);

    const [row] = await h.db.select().from(jobs);
    expect(row?.status).toBe('pending');
    // The retry budget must not be spent by a busy tick.
    expect(row?.attempts).toBe(0);

    const second = await drainJobs({ db: h.db, registry }, {});
    expect(second.succeeded).toBe(1);
    expect(ran).toBe(1);
  });

  it('respects the batch size, leaving the rest for the next tick', async () => {
    const registry = createJobRegistry();
    registry.register('many.job', async () => {});
    for (let i = 0; i < 5; i += 1) await enqueue(h.db, { kind: 'many.job' });

    const first = await drainJobs({ db: h.db, registry }, { batchSize: 2 });
    expect(first.claimed).toBe(2);
    const depth = await queueDepth(h.db);
    expect(depth['pending']).toBe(3);
  });
});

describe('platform jobs', () => {
  it('sends the welcome email queued at signup', async () => {
    const { orgId, userId, email } = await seedOrgWithOwner();
    await enqueue(h.db, {
      kind: PLATFORM_JOB_KINDS.welcomeEmail,
      payload: { userId, orgId, email },
    });
    const result = await drainJobs({ db: h.db, registry: h.registry }, {});
    expect(result.succeeded).toBe(1);
    expect(h.adapters.email.last()?.to).toBe(email);
    expect(h.adapters.email.last()?.subject).toContain('Welcome to Testbed');
  });

  it('mails the owners on an active subscription and on a failed payment', async () => {
    const { orgId } = await seedOrgWithOwner('billing@ridgeline.test');
    await enqueue(h.db, {
      kind: PLATFORM_JOB_KINDS.subscriptionActiveEmail,
      payload: { orgId, planKey: 'starter' },
    });
    await enqueue(h.db, { kind: PLATFORM_JOB_KINDS.paymentFailedEmail, payload: { orgId } });
    await drainJobs({ db: h.db, registry: h.registry }, {});

    const subjects = h.adapters.email.sent.map((m) => m.subject);
    expect(subjects).toContain('Testbed subscription active');
    expect(subjects).toContain('Payment failed for Testbed');
  });

  it('housekeeping warns about trials ending and purges expired rows', async () => {
    const { orgId } = await seedOrgWithOwner('trial@ridgeline.test');
    await h.db.insert(subscriptions).values({
      id: 'sub_trial_1',
      orgId,
      stripeCustomerId: 'cus_1',
      status: 'trialing',
      priceId: 'price_test_starter',
      trialEndsAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    });

    await enqueue(h.db, { kind: PLATFORM_JOB_KINDS.housekeeping });
    await drainJobs({ db: h.db, registry: h.registry }, {});

    const queued = await h.db.select().from(jobs);
    expect(queued.map((j) => j.kind)).toContain(PLATFORM_JOB_KINDS.trialEndingEmail);

    await h.db.update(jobs).set({ runAfter: new Date(Date.now() - 1000) });
    await drainJobs({ db: h.db, registry: h.registry }, {});
    expect(h.adapters.email.sent.map((m) => m.subject).join(' ')).toContain('trial ends in 2 days');
  });

  it('enqueues an app notification through the shared handler', async () => {
    await enqueueNotification(h.db, {
      to: 'crew@ridgeline.test',
      subject: 'Wage determination updated',
      paragraphs: ['DBRA rate for Electrician in Travis County changed.'],
      actionUrl: 'http://localhost:3000/dashboard',
      actionLabel: 'Review the change',
      dedupeKey: 'wd-change-1',
    });
    await drainJobs({ db: h.db, registry: h.registry }, {});
    expect(h.adapters.email.last()?.subject).toBe('Wage determination updated');
    expect(h.adapters.email.last()?.html).toContain('Review the change');
  });
});
