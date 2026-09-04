/**
 * WL-14 · The public determination watch.
 *
 * This is the only email list the product builds organically, and a list built
 * without consent is a liability rather than an asset — so every rule below is
 * a property of the code and not a policy note:
 *
 *  - **Double opt-in.** Nothing but the single confirmation is ever sent to a
 *    `pending` row (V2), and the confirmation link is two-step: GET renders,
 *    POST acts, so a corporate link scanner pre-fetching the URL cannot confirm
 *    a subscription on someone's behalf.
 *  - **Three per address** (V3), counted across determinations in one query
 *    because of `unique (email, wd_number)`.
 *  - **Rate limits** (V4): 5 requests per IP hash per hour and 20 per day, 3
 *    per address per hour. Over the limit returns the SAME copy as success —
 *    an error that reveals state is an enumeration oracle.
 *  - **Suppression is checked at request time and again at send time** (V6,
 *    V8): a suppressed address is a silent no-op that looks exactly like
 *    success, and a job enqueued before an unsubscribe does not send after it.
 *  - **No raw IP address is ever stored** — a salted hash answers "who asked,
 *    from where, when, and to what wording" without holding an identifier we do
 *    not need.
 *
 * `wd_watches` rows are NOT customer data of any organisation (V13): no export,
 * no admin screen and no CSV in WL-07 or WL-12 may select `wd_watches.email`.
 * The only aggregate exposed anywhere is a count.
 */

import { createHash } from 'node:crypto';
import { and, eq, lt, sql } from 'drizzle-orm';

import { consumeRateLimit } from '@octopus/platform/auth';
import type { Db } from '@octopus/platform/db';

import { WATCH_CONSENT_TEXT } from '../email/watch-templates';
import { signOpaque } from '../tokens';
import { isSuppressedFor, SUPPRESSION_REASONS, suppressWithReason } from '../email/send';
import {
  requestWatch as insertWatch,
  confirmWatch as confirmWatchRow,
  WATCHES_PER_EMAIL,
  WATCH_CONFIRM_TTL_DAYS,
  WATCH_RETENTION_MONTHS,
  WatchLimitReachedError,
} from '../repositories/alerts';
import { wdWatches, type WdWatch } from '../schema';

export { WATCHES_PER_EMAIL, WATCH_CONFIRM_TTL_DAYS, WATCH_RETENTION_MONTHS };

/** 30 days: an unconfirmed address is not a consent record, and keeping it is
 *  holding an address nobody agreed to give us. */
export const PENDING_RETENTION_DAYS = 30;

export function hashWatchToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The content hash of the checkbox label that was shown and ticked. If the
 *  wording changes the record still says what THIS person agreed to. */
export function consentVersion(wdNumber: string): string {
  return createHash('sha256').update(WATCH_CONSENT_TEXT(wdNumber)).digest('hex').slice(0, 32);
}

/**
 * THE UNSUBSCRIBE TOKEN IS DERIVED, NOT RANDOM — and that is a deliberate
 * departure from the repository's generator.
 *
 * `wd_watches` stores only `unsubscribe_token_hash`, and the spec requires the
 * token to be **stable for the life of the row** and present in **every**
 * message. A random token whose plaintext was returned once at request time
 * cannot be in the message we send eighteen months later, so the token is an
 * HMAC over the row id keyed on the server salt: stable, unguessable, in every
 * message, and still only ever stored as a hash. `requestWatch` below rewrites
 * the hash the repository generated with the hash of this token, which keeps
 * the repository (and its own unit tests) untouched.
 *
 * If `KB_IP_HASH_SALT` is rotated, existing unsubscribe links stop resolving
 * and `/watch/manage` is the way back. That is the safe direction, and it is
 * why the salt belongs in the environment rather than in a deploy step.
 */
export function unsubscribeTokenFor(watchId: string): string {
  return signOpaque('watch_unsubscribe', watchId);
}

export function isEmailShaped(email: string): boolean {
  const value = email.trim();
  // Syntax and an MX-SHAPED host only (V5). No live verification and no
  // third-party validation service: that would ship the address to a vendor.
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value) && value.length <= 254;
}

export type WatchRequestOutcome =
  | {
      status: 'pending';
      watch: WdWatch;
      confirmToken: string;
      unsubscribeToken: string;
      alreadyExisted: boolean;
    }
  | { status: 'already_confirmed' }
  /** Suppressed, rate-limited or otherwise silently declined. The caller shows
   *  the ordinary "check your inbox" copy — no enumeration, no state oracle. */
  | { status: 'silent' }
  | { status: 'limit_reached'; limit: number }
  | { status: 'invalid_email' }
  | { status: 'consent_required' };

export async function checkWatchRateLimits(
  db: Db,
  input: { ipHash: string; email: string },
): Promise<boolean> {
  const perIpHour = await consumeRateLimit(db, {
    bucket: `watch:ip:${input.ipHash}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  const perIpDay = await consumeRateLimit(db, {
    bucket: `watch:ip:day:${input.ipHash}`,
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000,
  });
  const perEmailHour = await consumeRateLimit(db, {
    bucket: `watch:email:${hashWatchToken(input.email.trim().toLowerCase())}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  return perIpHour.allowed && perIpDay.allowed && perEmailHour.allowed;
}

/**
 * Request a watch. Returns the RAW confirm token exactly once — only its hash
 * is stored. Every declining branch that could reveal state returns `silent`.
 */
export async function requestWatch(
  db: Db,
  input: {
    email: string;
    wdNumber: string;
    consent: boolean;
    ipHash: string;
    userAgentHash?: string;
    now?: Date;
  },
): Promise<WatchRequestOutcome> {
  // V1 — the box is required, unticked by default, and names the determination
  // in its own label. A submission without it writes nothing.
  if (!input.consent) return { status: 'consent_required' };
  if (!isEmailShaped(input.email)) return { status: 'invalid_email' };

  if (!(await checkWatchRateLimits(db, { ipHash: input.ipHash, email: input.email }))) {
    return { status: 'silent' };
  }

  // V6 — a suppressed address is never written and never emailed, and the
  // response is identical to the success case.
  if (await isSuppressedFor(db, input.email, 'marketing')) return { status: 'silent' };

  const email = input.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(wdWatches)
    .where(and(eq(wdWatches.email, email), eq(wdWatches.wdNumber, input.wdNumber)))
    .limit(1);
  if (existing?.status === 'confirmed') return { status: 'already_confirmed' };

  try {
    const result = await insertWatch(db, {
      email,
      wdNumber: input.wdNumber,
      consentTextVersion: consentVersion(input.wdNumber),
      createdIpHash: input.ipHash,
      ...(input.userAgentHash ? { createdUserAgentHash: input.userAgentHash } : {}),
      ...(input.now ? { now: input.now } : {}),
    });
    // The derived, stable unsubscribe token replaces the repository's random
    // one, so every future message can carry a working link (see above).
    const unsubscribeToken = unsubscribeTokenFor(result.watch.id);
    await db
      .update(wdWatches)
      .set({ unsubscribeTokenHash: hashWatchToken(unsubscribeToken) })
      .where(eq(wdWatches.id, result.watch.id));

    return {
      status: 'pending',
      watch: result.watch,
      confirmToken: result.confirmToken,
      unsubscribeToken,
      alreadyExisted: !result.created,
    };
  } catch (error) {
    if (error instanceof WatchLimitReachedError) {
      return { status: 'limit_reached', limit: error.limit };
    }
    throw error;
  }
}

export type ConfirmOutcome =
  | { status: 'confirmed'; watch: WdWatch; minutesToConfirm: number }
  | { status: 'already_confirmed'; watch: WdWatch }
  | { status: 'expired'; watch: WdWatch }
  | { status: 'invalid' };

export async function findByConfirmToken(db: Db, token: string): Promise<WdWatch | undefined> {
  const [row] = await db
    .select()
    .from(wdWatches)
    .where(eq(wdWatches.confirmTokenHash, hashWatchToken(token)))
    .limit(1);
  return row;
}

/** The POST half of the two-step. A GET must never reach this function. */
export async function confirmWatch(
  db: Db,
  input: { token: string; confirmedIpHash?: string; now?: Date },
): Promise<ConfirmOutcome> {
  const now = input.now ?? new Date();
  const existing = await findByConfirmToken(db, input.token);
  if (!existing) return { status: 'invalid' };
  if (existing.status === 'confirmed') return { status: 'already_confirmed', watch: existing };
  if (existing.status !== 'pending') return { status: 'invalid' };
  if (existing.confirmExpiresAt.getTime() <= now.getTime()) {
    return { status: 'expired', watch: existing };
  }

  const watch = await confirmWatchRow(db, {
    token: input.token,
    ...(input.confirmedIpHash ? { confirmedIpHash: input.confirmedIpHash } : {}),
    now,
  });
  if (!watch) return { status: 'invalid' };
  return {
    status: 'confirmed',
    watch,
    minutesToConfirm: Math.max(
      0,
      Math.round((now.getTime() - watch.consentedAt.getTime()) / 60_000),
    ),
  };
}

export async function findByUnsubscribeToken(db: Db, token: string): Promise<WdWatch | undefined> {
  const [row] = await db
    .select()
    .from(wdWatches)
    .where(eq(wdWatches.unsubscribeTokenHash, hashWatchToken(token)))
    .limit(1);
  return row;
}

/** Every watch on the address a token belongs to — the `/watch/manage` view. */
export async function watchesForToken(db: Db, token: string): Promise<WdWatch[]> {
  const watch = await findByUnsubscribeToken(db, token);
  if (!watch) return [];
  return db.select().from(wdWatches).where(eq(wdWatches.email, watch.email));
}

export type UnsubscribeOutcome =
  | { status: 'done'; scope: 'determination' | 'all'; wdNumber: string; email: string }
  | { status: 'invalid' };

/**
 * V7/V8 — the POST half. Scope `all` also writes `email_suppressions` with
 * reason `unsubscribed_watch`, which stops MARKETING mail to this address and
 * cannot stop a magic link, a billing notice or a paying customer's WL-08
 * project alert. `scope` may never be `transactional`.
 */
export async function unsubscribeWatch(
  db: Db,
  input: { token: string; scope: 'determination' | 'all'; now?: Date },
): Promise<UnsubscribeOutcome> {
  const watch = await findByUnsubscribeToken(db, input.token);
  if (!watch) return { status: 'invalid' };
  const now = input.now ?? new Date();

  await db
    .update(wdWatches)
    .set({ status: 'unsubscribed', unsubscribedAt: now, unsubscribeScope: input.scope })
    .where(eq(wdWatches.id, watch.id));

  if (input.scope === 'all') {
    await db
      .update(wdWatches)
      .set({ status: 'unsubscribed', unsubscribedAt: now, unsubscribeScope: 'all' })
      .where(eq(wdWatches.email, watch.email));
    await suppressWithReason(db, {
      email: watch.email,
      reason: SUPPRESSION_REASONS.watchUnsubscribe,
      note: 'watch scope: all determinations',
    });
  }

  return { status: 'done', scope: input.scope, wdNumber: watch.wdNumber, email: watch.email };
}

/** V11 — a hard bounce, or two soft bounces in a row, stop everything. */
export async function recordBounce(db: Db, input: { email: string; now?: Date }): Promise<void> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  await db
    .update(wdWatches)
    .set({ status: 'bounced', bouncedAt: now })
    .where(eq(wdWatches.email, email));
  await suppressWithReason(db, { email, reason: SUPPRESSION_REASONS.hardBounce });
}

/** Activity refreshes the retention clock: 18 months from the last alert. */
export async function recordAlertSent(db: Db, watchId: string, now = new Date()): Promise<void> {
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + WATCH_RETENTION_MONTHS);
  await db
    .update(wdWatches)
    .set({
      lastAlertSentAt: now,
      alertsSentCount: sql`${wdWatches.alertsSentCount} + 1`,
      expiresAt,
    })
    .where(eq(wdWatches.id, watchId));
}

export type SweepResult = { deletedPending: number; expired: Array<{ id: string; wdNumber: string }> };

/**
 * The daily sweep. Two retention rules, both of them columns rather than
 * policies: an unconfirmed row is DELETED after 30 days, and a confirmed row
 * expires 18 months after the later of consent and the last alert.
 */
export async function sweepWatches(db: Db, now = new Date()): Promise<SweepResult> {
  const pendingCutoff = new Date(now.getTime() - PENDING_RETENTION_DAYS * 24 * 3600 * 1000);

  const deleted = await db
    .delete(wdWatches)
    .where(and(eq(wdWatches.status, 'pending'), lt(wdWatches.createdAt, pendingCutoff)))
    .returning();

  const expired = await db
    .update(wdWatches)
    .set({ status: 'expired' })
    .where(and(eq(wdWatches.status, 'confirmed'), lt(wdWatches.expiresAt, now)))
    .returning();

  return {
    deletedPending: deleted.length,
    expired: expired.map((row) => ({ id: row.id, wdNumber: row.wdNumber })),
  };
}

/** The only aggregate any admin surface may see (V13). */
export async function watchCounts(db: Db): Promise<{ pending: number; confirmed: number }> {
  const rows = await db
    .select({ status: wdWatches.status, value: sql<number>`count(*)::int` })
    .from(wdWatches)
    .groupBy(wdWatches.status);
  const of = (status: string) => Number(rows.find((r) => r.status === status)?.value ?? 0);
  return { pending: of('pending'), confirmed: of('confirmed') };
}
