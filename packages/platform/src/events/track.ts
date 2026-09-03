/**
 * Usage tracking (PLAN.md A14: our own events table; PostHog optional and never
 * authoritative).
 *
 * `track()` is deliberately fire-and-forget-safe: it never throws into a caller.
 * A metric that breaks a signup is worse than a metric that is missing, and the
 * one thing an analytics call must never do is take down the path it measures.
 */

import { and, eq, gte, lte, sql } from 'drizzle-orm';

import type { Db } from '../db';
import { events } from '../db/schema';
import { newId } from '../ids';

export type TrackInput = {
  name: string;
  orgId?: string | null;
  userId?: string | null;
  props?: Record<string, unknown>;
  ts?: Date;
};

/** The event names the platform itself emits. Apps add their own. */
export const PLATFORM_EVENTS = {
  signupRequested: 'signup_requested',
  loginRequested: 'login_requested',
  signedUp: 'signed_up',
  loggedIn: 'logged_in',
  loggedOut: 'logged_out',
  checkoutStarted: 'checkout_started',
  subscriptionActivated: 'subscription_activated',
  subscriptionCancelled: 'subscription_cancelled',
  paymentFailed: 'payment_failed',
  memberInvited: 'member_invited',
} as const;

export async function track(db: Db, input: TrackInput): Promise<void> {
  try {
    await db.insert(events).values({
      id: newId('evt'),
      name: input.name,
      orgId: input.orgId ?? null,
      userId: input.userId ?? null,
      props: (input.props ?? {}) as Record<string, unknown>,
      // One clock for both sides of every range comparison: the JS clock. The
      // database default (now()) can sit a few milliseconds ahead of Date.now()
      // on PGlite, which made an event recorded "now" fall outside a range
      // ending "now" (seen once in CI).
      ts: input.ts ?? new Date(),
    });
  } catch (error) {
    // Never break the path being measured.
    console.warn(`[events] failed to record ${input.name}:`, error);
  }
}

export async function countEvents(
  db: Db,
  input: { name: string; from: Date; to: Date; distinctOrgs?: boolean },
): Promise<number> {
  const where = and(eq(events.name, input.name), gte(events.ts, input.from), lte(events.ts, input.to));
  const [row] = await db
    .select({
      value: input.distinctOrgs
        ? sql<number>`count(distinct ${events.orgId})`
        : sql<number>`count(*)`,
    })
    .from(events)
    .where(where);
  return Number(row?.value ?? 0);
}
