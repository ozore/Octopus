/**
 * Delayed deletion — `specs/10` §Server actions, AC5, and its two edge cases.
 *
 * **Seven days, cancellable throughout, and every owner is told.** A deletion
 * that happens the instant it is clicked is a support ticket nobody can answer;
 * a deletion that never happens is a promise broken. The delay is the design:
 * it makes an accident recoverable and a decision final.
 *
 * TWO THINGS HAPPEN IN ORDER AND THE ORDER MATTERS:
 *
 *  1. **A live subscription is cancelled first.** A billed, deleted account is
 *     a chargeback (`specs/10` §Edge cases). The platform's billing port has no
 *     cancel method (`REQUESTS.md` P-7), so the sweep REFUSES to execute while a
 *     live subscription is mirrored and says which one — rather than deleting
 *     the account and leaving Stripe charging it. A refusal that names the
 *     blocker is recoverable; a silent double state is not.
 *  2. **The events keep their history and lose their subject.** `events.org_id`
 *     is set NULL before the organisation row goes, because the platform's
 *     foreign key cascades and `specs/13` wants the historical record to survive
 *     a deletion. The customer's data goes; the fact that a signup happened
 *     stays.
 *
 * After execution a schema walk finds ZERO rows carrying the organisation id
 * (AC5), which `tests/settings.test.ts` asserts table by table rather than by
 * trusting the cascade.
 */

import { and, eq, isNull, lte } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { events, memberships, organisations, subscriptions, users } from '@octopus/platform/db';
import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { enqueueNotification } from '@octopus/platform/jobs';

import { deletionRequests } from '../schema';

export { DELETION_JOB } from './kinds';
export const DELETION_DELAY_DAYS = 7;

/** Statuses that mean Stripe is still billing this organisation. */
const LIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'paused'] as const;

async function ownerEmails(db: Db, orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId));
  const owners = rows.filter((r) => r.role === 'owner').map((r) => r.email);
  return owners.length > 0 ? owners : rows.map((r) => r.email);
}

export async function openDeletionRequest(db: Db, orgId: string) {
  const rows = await db
    .select()
    .from(deletionRequests)
    .where(
      and(
        eq(deletionRequests.orgId, orgId),
        isNull(deletionRequests.cancelledAt),
        isNull(deletionRequests.executedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function requestDeletion(
  db: Db,
  input: {
    orgId: string;
    userId: string;
    reason?: string | null;
    typedName: string;
    organisationName: string;
    appName: string;
    baseUrl: string;
    now?: Date;
  },
): Promise<{ status: 'queued' | 'name_mismatch' | 'already_requested'; executeAfter?: Date }> {
  const now = input.now ?? new Date();
  // Typing the name is the last of the three gates (`specs/10` §Validation).
  if (input.typedName.trim() !== input.organisationName.trim()) return { status: 'name_mismatch' };
  if (await openDeletionRequest(db, input.orgId)) return { status: 'already_requested' };

  const executeAfter = new Date(now.getTime() + DELETION_DELAY_DAYS * 86_400_000);
  await db.insert(deletionRequests).values({
    id: newId('del'),
    orgId: input.orgId,
    requestedByUserId: input.userId,
    reason: input.reason ?? null,
    executeAfter,
  });

  for (const email of await ownerEmails(db, input.orgId)) {
    await enqueueNotification(db, {
      to: email,
      subject: `${input.organisationName} is scheduled for deletion on ${executeAfter.toISOString().slice(0, 10)}`,
      paragraphs: [
        `Somebody with owner access asked us to delete ${input.organisationName} and everything in it.`,
        `Nothing happens for ${DELETION_DELAY_DAYS} days. Any owner can cancel it in settings — and if you did not ask for this, cancel it now.`,
        'Export your data first if you want a copy: the export keeps working right up to the moment of deletion.',
      ],
      actionUrl: `${input.baseUrl}/settings/data`,
      actionLabel: 'Cancel the deletion',
      dedupeKey: `stateready.deletion_requested:${input.orgId}:${executeAfter.toISOString().slice(0, 10)}`,
    });
  }

  await track(db, {
    name: 'deletion_requested',
    orgId: input.orgId,
    userId: input.userId,
    // Read every one of these (`specs/10` §Analytics events).
    props: { reason: input.reason ?? '' },
  });
  return { status: 'queued', executeAfter };
}

export async function cancelDeletion(
  db: Db,
  input: { orgId: string; deletionId: string; userId: string; now?: Date },
): Promise<{ status: 'cancelled' | 'not_found' }> {
  const now = input.now ?? new Date();
  const rows = await db
    .update(deletionRequests)
    .set({ cancelledAt: now })
    .where(
      and(
        eq(deletionRequests.id, input.deletionId),
        eq(deletionRequests.orgId, input.orgId),
        isNull(deletionRequests.cancelledAt),
        isNull(deletionRequests.executedAt),
      ),
    )
    .returning();
  if (rows.length === 0) return { status: 'not_found' };
  await track(db, { name: 'deletion_cancelled', orgId: input.orgId, userId: input.userId });
  return { status: 'cancelled' };
}

export type DeletionSweep = { executed: number; blocked: Array<{ orgId: string; reason: string }> };

export async function runDeletionSweep(db: Db, options: { now?: Date } = {}): Promise<DeletionSweep> {
  const now = options.now ?? new Date();
  const summary: DeletionSweep = { executed: 0, blocked: [] };

  const due = await db
    .select()
    .from(deletionRequests)
    .where(
      and(
        isNull(deletionRequests.cancelledAt),
        isNull(deletionRequests.executedAt),
        lte(deletionRequests.executeAfter, now),
      ),
    );

  for (const request of due) {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.orgId, request.orgId));
    const live = subs.find((s) => (LIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(s.status));
    if (live) {
      summary.blocked.push({
        orgId: request.orgId,
        reason: `subscription ${live.id} is ${live.status} — cancel it in Stripe first (REQUESTS.md P-7)`,
      });
      continue;
    }

    // Stamped first, executed second: the request row itself carries the
    // organisation id and goes with the cascade, so an update afterwards would
    // touch nothing and the "executed" fact would live only in the log.
    await db
      .update(deletionRequests)
      .set({ executedAt: now })
      .where(eq(deletionRequests.id, request.id));
    await executeDeletion(db, request.orgId, now);
    summary.executed += 1;
    // The organisation row is gone, so the event carries no org id — which is
    // exactly the shape `specs/13` wants a deleted organisation's history in.
    await track(db, { name: 'deletion_executed', props: { at: now.toISOString() } });
  }

  return summary;
}

/**
 * The deletion itself. Every app table cascades from `organisations`, so this
 * is one DELETE plus the two things a cascade would get wrong.
 */
export async function executeDeletion(db: Db, orgId: string, now = new Date()): Promise<void> {
  // 1. Keep the history, lose the subject.
  await db.update(events).set({ orgId: null }).where(eq(events.orgId, orgId));
  // 2. Everything else hangs off `organisations` with `on delete cascade`, so
  //    one DELETE is the whole erasure — and `tests/settings.test.ts` walks the
  //    schema afterwards rather than trusting that sentence.
  void now;
  await db.delete(organisations).where(eq(organisations.id, orgId));
}
