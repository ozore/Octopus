/**
 * M6's arithmetic — the two bugs that are invisible until a customer's licence
 * lapses, and the per-recipient model that makes AC5 expressible at all.
 *
 * Sub-wave A owns the model and the arithmetic; the drain, the email and the
 * screens belong to the M6 agent (`BUILD.md`). These are the regression tests
 * `specs/06` AC9 and AC10 ask for, and they are written first because both bugs
 * are in the arithmetic everything else sits on.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations, users } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { ALERT_OFFSETS, AT_RISK_DAYS, assertCronSchedule, DAY_MS, drainIntervalMs, drainWatchdogHours, HOUR_MS } from '../src/lib/cron';
import { appMigrationsDir } from '../src/lib/db';
import {
  advanceRecipient,
  claimDueRecipients,
  createDigest,
  ensureRecipient,
  nextSendAt,
  selectDueOffsets,
  sentOffsets,
  suppressAlert,
} from '../src/lib/repos/alerts';
import { alerts, deadlines, digests } from '../src/lib/schema';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = newId('org');
  await db.db.insert(organisations).values({ id: orgId, name: 'Sila', slug: `sila-${orgId}` });
});
afterEach(async () => {
  await db.close();
});

async function makeUser(email: string) {
  const id = newId('usr');
  await db.db.insert(users).values({ id, email });
  return id;
}

async function makeDeadline(dueOn: string) {
  const id = newId('dln');
  await db.db.insert(deadlines).values({ id, orgId, kind: 'renewal', dueOn, source: 'entered' });
  return id;
}

describe('the schedule is one constant, shared with the map', () => {
  it('AT_RISK_DAYS IS the first alert offset — D7 made structural', () => {
    expect(AT_RISK_DAYS).toBe(ALERT_OFFSETS[0]);
    expect(AT_RISK_DAYS).toBe(90);
  });

  it('90 / 60 / 30 / 7 / 0 / −1, in that order', () => {
    expect([...ALERT_OFFSETS]).toEqual([90, 60, 30, 7, 0, -1]);
  });
});

describe('DRAIN_INTERVAL is derived from the cron expression, not written twice', () => {
  it('reads a daily, an hourly and an every-N-hours expression', () => {
    expect(drainIntervalMs('0 12 * * *')).toBe(DAY_MS);
    expect(drainIntervalMs('0 * * * *')).toBe(HOUR_MS);
    expect(drainIntervalMs('0 */4 * * *')).toBe(4 * HOUR_MS);
    expect(drainIntervalMs('*/5 * * * *')).toBe(5 * 60_000);
  });

  it('FAILS THE BUILD on a sub-daily schedule on Hobby — specs/06 AC11', () => {
    expect(() => assertCronSchedule('0 * * * *', 'hobby')).toThrow(/Vercel Hobby allows one cron invocation per day/);
    expect(() => assertCronSchedule('*/5 * * * *', 'hobby')).toThrow(/upgrade the project to Pro/);
    // The shipped configuration passes; on Pro the hourly one does too, and that
    // is the ONLY change needed — no code moves.
    expect(assertCronSchedule('0 12 * * *', 'hobby')).toBe(DAY_MS);
    expect(assertCronSchedule('0 * * * *', 'pro')).toBe(HOUR_MS);
  });

  it('refuses a malformed expression rather than guessing at it', () => {
    expect(() => drainIntervalMs('0 12 * *')).toThrow(/five fields/);
  });

  it('the watchdog tightens with the schedule: 26 hours daily, 3 hourly', () => {
    expect(drainWatchdogHours(DAY_MS)).toBe(26);
    expect(drainWatchdogHours(HOUR_MS)).toBe(3);
  });
});

describe('the local morning survives a once-a-day cron', () => {
  it('computes the next 07:00 local in each US zone, in UTC', () => {
    const from = new Date('2026-09-03T00:00:00Z');
    // 07:00 America/New_York in September is 11:00 UTC (EDT, UTC−4).
    expect(nextSendAt(from, 'America/New_York', 7).toISOString()).toBe('2026-09-03T11:00:00.000Z');
    // 07:00 America/Los_Angeles is 14:00 UTC (PDT, UTC−7).
    expect(nextSendAt(from, 'America/Los_Angeles', 7).toISOString()).toBe('2026-09-03T14:00:00.000Z');
    // 07:00 America/Chicago is 12:00 UTC (CDT, UTC−5).
    expect(nextSendAt(from, 'America/Chicago', 7).toISOString()).toBe('2026-09-03T12:00:00.000Z');
  });

  it('crosses both DST transitions without drifting an hour', () => {
    // After the November fall-back, Eastern is UTC−5, so 07:00 local is 12:00 UTC.
    const november = new Date('2026-11-05T00:00:00Z');
    expect(nextSendAt(november, 'America/New_York', 7).toISOString()).toBe('2026-11-05T12:00:00.000Z');
    // After the March spring-forward, Eastern is UTC−4 again.
    const april = new Date('2027-04-05T00:00:00Z');
    expect(nextSendAt(april, 'America/New_York', 7).toISOString()).toBe('2027-04-05T11:00:00.000Z');
  });

  it('falls back to America/Chicago on an unknown zone rather than shifting someone silently', () => {
    const from = new Date('2026-09-03T00:00:00Z');
    expect(nextSendAt(from, 'Mars/Olympus_Mons', 7).toISOString()).toBe(
      nextSendAt(from, 'America/Chicago', 7).toISOString(),
    );
  });

  it('handles hour 0 and hour 23', () => {
    const from = new Date('2026-09-03T15:00:00Z');
    expect(nextSendAt(from, 'America/Chicago', 0).toISOString()).toBe('2026-09-04T05:00:00.000Z');
    expect(nextSendAt(from, 'America/Chicago', 23).toISOString()).toBe('2026-09-04T04:00:00.000Z');
  });
});

/**
 * AC9 — THE PACIFIC DEFERRAL LOOP.
 *
 * The obvious claim, `next_send_at <= now()`, defers every recipient west of
 * the drain time forever on a once-a-day cron: the drain runs at 12:00 UTC, a
 * Los Angeles recipient's next send is 14:00 UTC, and tomorrow's run is at
 * 12:00 UTC again. This test fails against that formulation.
 */
describe('AC9 — a recipient west of the drain time is served the same day', () => {
  it('claims everything due before the next run can happen', async () => {
    const pacific = await makeUser(`pacific-${orgId}@example.test`);
    const eastern = await makeUser(`eastern-${orgId}@example.test`);
    await ensureRecipient(db.db, {
      userId: pacific,
      orgId,
      now: new Date('2026-09-03T00:00:00Z'),
      timezone: 'America/Los_Angeles',
      hourLocal: 7,
    });
    await ensureRecipient(db.db, {
      userId: eastern,
      orgId,
      now: new Date('2026-09-03T00:00:00Z'),
      timezone: 'America/New_York',
      hourLocal: 7,
    });

    const drainAt = new Date('2026-09-03T12:00:00Z');
    const claimedNaively = await claimDueRecipients(db.db, drainAt, 0);
    expect(claimedNaively.map((r) => r.userId)).toEqual([eastern]); // the bug

    const claimed = await claimDueRecipients(db.db, drainAt, DAY_MS);
    expect(claimed.map((r) => r.userId).sort()).toEqual([eastern, pacific].sort());
  });

  it('advances the recipient to their next local hour after a send', async () => {
    const userId = await makeUser(`adv-${orgId}@example.test`);
    await ensureRecipient(db.db, {
      userId,
      orgId,
      now: new Date('2026-09-03T00:00:00Z'),
      timezone: 'America/Chicago',
      hourLocal: 7,
    });
    await advanceRecipient(db.db, {
      userId,
      now: new Date('2026-09-03T12:00:00Z'),
      timezone: 'America/Chicago',
      hourLocal: 7,
    });
    const [row] = await claimDueRecipients(db.db, new Date('2026-09-04T12:00:00Z'), DAY_MS);
    expect(row?.nextSendAt.toISOString()).toBe('2026-09-04T12:00:00.000Z');
    expect(row?.lastSentAt?.toISOString()).toBe('2026-09-03T12:00:00.000Z');
  });
});

/**
 * AC10 — EXACT-EQUALITY OFFSETS DELETE ALERTS.
 *
 * `due_on - today = offset` loses an alert entirely whenever a run is missed, a
 * deploy lands in the window, or a deadline is created on the wrong side of
 * midnight — and the alert it loses is as likely to be the 7-day one as the
 * 90-day one.
 */
describe('AC10 — a skipped drain delays an alert, it never deletes one', () => {
  it('takes the largest UNSENT offset by inequality', () => {
    const deadline = { id: 'd1', dueOn: '2026-12-02' }; // 90 days out on 2026-09-03
    expect(selectDueOffsets([deadline], new Set(), '2026-09-03')).toEqual([{ deadlineId: 'd1', offsetDays: 90 }]);
    // The 90-day alert has gone; 58 days out, the answer is 60 — not 30.
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2026-11-01' }], new Set(['d1|90']), '2026-09-04')).toEqual([
      { deadlineId: 'd1', offsetDays: 60 },
    ]);
  });

  it('a run missed across the 7-day boundary still sends the 7-day alert, late', () => {
    const sent = new Set(['d1|90', 'd1|60', 'd1|30']);
    // The drain should have run on the 7-day mark and did not; two days later
    // the deadline is 5 days out. Exact equality would send NOTHING.
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2026-09-08' }], sent, '2026-09-03')).toEqual([
      { deadlineId: 'd1', offsetDays: 7 },
    ]);
  });

  it('sends the lapsed alert the day after expiry, and nothing before day 0', () => {
    const sent = new Set(['d1|90', 'd1|60', 'd1|30', 'd1|7']);
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2026-09-03' }], sent, '2026-09-03')).toEqual([
      { deadlineId: 'd1', offsetDays: 0 },
    ]);
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2026-09-02' }], new Set([...sent, 'd1|0']), '2026-09-03')).toEqual([
      { deadlineId: 'd1', offsetDays: -1 },
    ]);
  });

  it('says nothing when every offset for a deadline has already gone', () => {
    const sent = new Set(['d1|90', 'd1|60', 'd1|30', 'd1|7', 'd1|0', 'd1|-1']);
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2026-09-02' }], sent, '2026-09-03')).toEqual([]);
  });

  it('says nothing about a deadline outside the first gate', () => {
    expect(selectDueOffsets([{ id: 'd1', dueOn: '2027-06-01' }], new Set(), '2026-09-03')).toEqual([]);
  });
});

describe('AC5 — two recipients, one organisation, one deadline', () => {
  it('produces two alert rows and two digests, with independent delivery state', async () => {
    const a = await makeUser(`a-${orgId}@example.test`);
    const b = await makeUser(`b-${orgId}@example.test`);
    const deadlineId = await makeDeadline('2026-12-02');

    const digestA = await createDigest(db.db, {
      orgId,
      recipientUserId: a,
      sendDate: '2026-09-03',
      subject: '1 licence needs attention',
      items: [{ deadlineId, offsetDays: 90 }],
    });
    const digestB = await createDigest(db.db, {
      orgId,
      recipientUserId: b,
      sendDate: '2026-09-03',
      subject: '1 licence needs attention',
      items: [{ deadlineId, offsetDays: 90 }],
    });
    expect(digestA).not.toBe(digestB);

    expect(await db.db.select().from(alerts)).toHaveLength(2);
    expect(await db.db.select().from(digests)).toHaveLength(2);

    // What one recipient has been sent is not what the other has been sent.
    expect([...(await sentOffsets(db.db, a, [deadlineId]))]).toEqual([`${deadlineId}|90`]);
    expect([...(await sentOffsets(db.db, b, [deadlineId]))]).toEqual([`${deadlineId}|90`]);
  });
});

describe('a suppressed alert is recorded with a machine-readable reason', () => {
  it('stores each of the five Alert Guarantee carve-outs, so adjudication is a query', async () => {
    const userId = await makeUser(`s-${orgId}@example.test`);
    const reasons = [
      'added_after_offset',
      'muted_state',
      'recipient_paused',
      'address_suppressed',
      'subscription_paused',
    ] as const;

    for (const [i, reason] of reasons.entries()) {
      const deadlineId = await makeDeadline('2026-12-02');
      await suppressAlert(db.db, { orgId, deadlineId, recipientUserId: userId, offsetDays: 90 - i, reason });
    }

    const rows = await db.db.select().from(alerts);
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.status === 'suppressed')).toBe(true);
    expect(rows.map((r) => r.suppressionReason).sort()).toEqual([...reasons].sort());
  });

  it('cannot suppress the same (deadline, offset, recipient) twice', async () => {
    const userId = await makeUser(`s2-${orgId}@example.test`);
    const deadlineId = await makeDeadline('2026-12-02');
    await suppressAlert(db.db, { orgId, deadlineId, recipientUserId: userId, offsetDays: 90, reason: 'muted_state' });
    await suppressAlert(db.db, { orgId, deadlineId, recipientUserId: userId, offsetDays: 90, reason: 'muted_state' });
    expect(await db.db.select().from(alerts)).toHaveLength(1);
  });
});
