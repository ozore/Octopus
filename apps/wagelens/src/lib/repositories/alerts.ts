/**
 * Determination-change alerts (WL-08) and the public consented watch (WL-14).
 *
 * `wd_change_alerts` carries a unique index on
 * `(project_id, wd_number, to_modification)`, and that index IS the anti-spam
 * guarantee: a re-run of the ingest job cannot send a second email, because it
 * cannot create a second row. Making it a database constraint rather than an
 * application check is the difference between "we are careful" and "it cannot
 * happen".
 *
 * `wd_watches` is the consent record for an email address collected on a PUBLIC
 * page. Everything about it is shaped by that: a double opt-in token, a hashed
 * IP and never an address, the content hash of the exact wording that was
 * ticked, a stable unsubscribe token that goes in every message, a cap of three
 * per address, and an 18-month expiry that is a column rather than a policy.
 */

import { createHash, randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import { wdChangeAlerts, wdWatches, type WdChangeAlert, type WdWatch } from '../schema';

export const WATCHES_PER_EMAIL = 3;
export const WATCH_CONFIRM_TTL_DAYS = 7;
export const WATCH_RETENTION_MONTHS = 18;

export type AlertDiff = {
  changed: Array<{ label: string; oldRate: string; newRate: string; oldFringe: string; newFringe: string }>;
  removed: Array<{ label: string }>;
  added: Array<{ label: string; rate: string; fringe: string }>;
};

/** Idempotent by construction: the second call for the same modification
 *  returns the existing alert instead of creating one. */
export async function recordAlert(
  db: Db,
  input: {
    projectId: string;
    wdNumber: string;
    fromModification: number;
    toModification: number;
    diff: AlertDiff;
    affectedWorkerCount?: number;
  },
): Promise<{ alert: WdChangeAlert; created: boolean }> {
  const rows = await db
    .insert(wdChangeAlerts)
    .values({
      id: newId('alr'),
      projectId: input.projectId,
      wdNumber: input.wdNumber,
      fromModification: input.fromModification,
      toModification: input.toModification,
      diff: input.diff,
      affectedWorkerCount: input.affectedWorkerCount ?? 0,
    })
    .onConflictDoNothing()
    .returning();

  if (rows[0]) return { alert: rows[0] as WdChangeAlert, created: true };

  const [existing] = await db
    .select()
    .from(wdChangeAlerts)
    .where(
      and(
        eq(wdChangeAlerts.projectId, input.projectId),
        eq(wdChangeAlerts.wdNumber, input.wdNumber),
        eq(wdChangeAlerts.toModification, input.toModification),
      ),
    )
    .limit(1);
  return { alert: existing as WdChangeAlert, created: false };
}

export async function pendingAlerts(db: Db, projectId: string): Promise<WdChangeAlert[]> {
  return db
    .select()
    .from(wdChangeAlerts)
    .where(and(eq(wdChangeAlerts.projectId, projectId), eq(wdChangeAlerts.status, 'pending')));
}

export async function resolveAlert(
  db: Db,
  input: { alertId: string; status: 'accepted' | 'dismissed'; userId?: string },
): Promise<void> {
  await db
    .update(wdChangeAlerts)
    .set({ status: input.status, resolvedAt: new Date(), resolvedByUserId: input.userId ?? null })
    .where(eq(wdChangeAlerts.id, input.alertId));
}

// ---------------------------------------------------------------------------
// WL-14 · the public watch
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class WatchLimitReachedError extends Error {
  constructor(readonly limit: number) {
    super(`An address may watch at most ${limit} determinations.`);
    this.name = 'WatchLimitReachedError';
  }
}

/**
 * Request a watch. Returns the RAW confirm token exactly once — it is never
 * stored, only its hash. Submitting the same (email, wd number) twice is a
 * no-op at the database level, so a double-click does not send two emails.
 */
export async function requestWatch(
  db: Db,
  input: {
    email: string;
    wdNumber: string;
    /** Content hash of the checkbox label that was shown and ticked. */
    consentTextVersion: string;
    createdIpHash: string;
    createdUserAgentHash?: string;
    now?: Date;
  },
): Promise<{ watch: WdWatch; confirmToken: string; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const now = input.now ?? new Date();

  const [count] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(wdWatches)
    .where(and(eq(wdWatches.email, email), sql`${wdWatches.status} <> 'unsubscribed'`));
  if (Number(count?.value ?? 0) >= WATCHES_PER_EMAIL) {
    // Checkable in one query because of `unique (email, wd_number)`.
    const [already] = await db
      .select()
      .from(wdWatches)
      .where(and(eq(wdWatches.email, email), eq(wdWatches.wdNumber, input.wdNumber)))
      .limit(1);
    if (!already) throw new WatchLimitReachedError(WATCHES_PER_EMAIL);
  }

  const confirmToken = randomBytes(32).toString('base64url');
  const unsubscribeToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + WATCH_RETENTION_MONTHS);

  const rows = await db
    .insert(wdWatches)
    .values({
      id: newId('wch'),
      email,
      wdNumber: input.wdNumber,
      consentTextVersion: input.consentTextVersion,
      consentedAt: now,
      createdIpHash: input.createdIpHash,
      createdUserAgentHash: input.createdUserAgentHash ?? null,
      confirmTokenHash: hashToken(confirmToken),
      confirmExpiresAt: new Date(now.getTime() + WATCH_CONFIRM_TTL_DAYS * 86_400_000),
      unsubscribeTokenHash: hashToken(unsubscribeToken),
      expiresAt,
    })
    .onConflictDoNothing()
    .returning();

  if (rows[0]) return { watch: rows[0] as WdWatch, confirmToken, created: true };

  const [existing] = await db
    .select()
    .from(wdWatches)
    .where(and(eq(wdWatches.email, email), eq(wdWatches.wdNumber, input.wdNumber)))
    .limit(1);
  return { watch: existing as WdWatch, confirmToken, created: false };
}

/** Double opt-in: only a confirmed row is ever mailed an alert. */
export async function confirmWatch(
  db: Db,
  input: { token: string; confirmedIpHash?: string; now?: Date },
): Promise<WdWatch | undefined> {
  const now = input.now ?? new Date();
  const rows = await db
    .update(wdWatches)
    .set({ status: 'confirmed', confirmedAt: now, confirmedIpHash: input.confirmedIpHash ?? null })
    .where(
      and(
        eq(wdWatches.confirmTokenHash, hashToken(input.token)),
        eq(wdWatches.status, 'pending'),
        sql`${wdWatches.confirmExpiresAt} > ${now}`,
      ),
    )
    .returning();
  return rows[0] as WdWatch | undefined;
}

export async function unsubscribeWatch(
  db: Db,
  input: { token: string; scope?: 'determination' | 'all' },
): Promise<WdWatch | undefined> {
  const scope = input.scope ?? 'determination';
  const rows = await db
    .update(wdWatches)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date(), unsubscribeScope: scope })
    .where(eq(wdWatches.unsubscribeTokenHash, hashToken(input.token)))
    .returning();
  const watch = rows[0] as WdWatch | undefined;
  if (watch && scope === 'all') {
    await db
      .update(wdWatches)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date(), unsubscribeScope: 'all' })
      .where(eq(wdWatches.email, watch.email));
  }
  return watch;
}

export async function confirmedWatchers(db: Db, wdNumber: string): Promise<WdWatch[]> {
  return db
    .select()
    .from(wdWatches)
    .where(and(eq(wdWatches.wdNumber, wdNumber), eq(wdWatches.status, 'confirmed')));
}
