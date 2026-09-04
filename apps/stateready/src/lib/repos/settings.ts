/**
 * Settings that are retention features rather than hygiene — `specs/10`.
 *
 * Two of the six items on that page are the reason a customer stays:
 * **notification preferences** are the alternative to muting us, and **export**
 * is the alternative to not adopting us. Everything here exists to make those
 * two cheap.
 *
 * THE TIME-ZONE RULE. Changing the zone reschedules the NEXT digest, never
 * today's: a digest already queued for today keeps its time and the UI says so
 * (`specs/10` §Edge cases). That is why `updateOrganisationSettings` recomputes
 * `next_send_at` from *now* rather than from the start of the day.
 */

import { createHash, randomBytes } from 'node:crypto';

import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { memberships, users } from '@octopus/platform/db';
import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';

import { ALERT_OFFSETS } from '../cron';
import { US_JURISDICTIONS } from '../kb/accessors';
import { recordAudit } from './audit';
import { ensureRecipient, nextSendAt } from './alerts';
import {
  alertRecipients,
  emailChangeRequests,
  notificationPreferences,
  organisationSettings,
} from '../schema';

/**
 * `specs/10` §Validation — a fixed list of US zones, not "any IANA string".
 * A zone the runtime does not know silently shifts somebody's alerts.
 */
export const US_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const;

/** 5–11: nobody wants a compliance email at 3 a.m., and after 11 it competes
 *  with the day's work (`specs/10` §Validation). */
export const DIGEST_HOUR_MIN = 5;
export const DIGEST_HOUR_MAX = 11;

export function isUsTimezone(value: string): value is (typeof US_TIMEZONES)[number] {
  return (US_TIMEZONES as readonly string[]).includes(value);
}

export function clampDigestHour(value: number): number {
  if (!Number.isFinite(value)) return 7;
  return Math.min(DIGEST_HOUR_MAX, Math.max(DIGEST_HOUR_MIN, Math.trunc(value)));
}

export function sanitiseOffsets(values: readonly unknown[]): number[] {
  const allowed = new Set<number>(ALERT_OFFSETS);
  const out = [...new Set(values.map(Number))].filter((n) => allowed.has(n));
  return out.sort((a, b) => b - a);
}

export function sanitiseStates(values: readonly unknown[]): string[] {
  const known = new Set<string>(US_JURISDICTIONS);
  return [...new Set(values.map((v) => String(v).toUpperCase()))].filter((s) => known.has(s)).sort();
}

export async function getOrganisationSettings(db: Db, orgId: string) {
  const [row] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.orgId, orgId))
    .limit(1);
  if (row) return row;
  await db.insert(organisationSettings).values({ orgId }).onConflictDoNothing();
  const [created] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.orgId, orgId))
    .limit(1);
  return created!;
}

export async function updateOrganisationSettings(
  db: Db,
  input: {
    orgId: string;
    actorUserId?: string | null;
    timezone?: string;
    digestHourLocal?: number;
    ccTechnicians?: boolean;
    dateFormat?: string;
    theme?: string;
    now?: Date;
  },
): Promise<{ status: 'saved' | 'bad_timezone' }> {
  const now = input.now ?? new Date();
  const before = await getOrganisationSettings(db, input.orgId);
  if (input.timezone !== undefined && !isUsTimezone(input.timezone)) return { status: 'bad_timezone' };

  const patch = {
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.digestHourLocal !== undefined ? { digestHourLocal: clampDigestHour(input.digestHourLocal) } : {}),
    ...(input.ccTechnicians !== undefined ? { ccTechnicians: input.ccTechnicians } : {}),
    ...(input.dateFormat !== undefined ? { dateFormat: input.dateFormat === 'dmy' ? 'dmy' : 'mdy' } : {}),
    ...(input.theme !== undefined ? { theme: input.theme } : {}),
    updatedAt: now,
  };
  await db.update(organisationSettings).set(patch).where(eq(organisationSettings.orgId, input.orgId));
  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'organisation_settings_updated',
    entityTable: 'organisation_settings',
    entityId: input.orgId,
    before,
    after: patch,
  });
  return { status: 'saved' };
}

export async function getNotificationPreferences(db: Db, userId: string, orgId: string) {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  if (row) return row;
  await db.insert(notificationPreferences).values({ userId, orgId }).onConflictDoNothing();
  const [created] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return created!;
}

export async function updateNotificationPreferences(
  db: Db,
  input: {
    userId: string;
    orgId: string;
    offsets?: readonly unknown[];
    mutedStates?: readonly unknown[];
    timezone?: string;
    digestHourLocal?: number;
    paused?: boolean;
    weeklyBrief?: boolean;
    now?: Date;
  },
): Promise<{ status: 'saved' | 'bad_timezone' }> {
  const now = input.now ?? new Date();
  const before = await getNotificationPreferences(db, input.userId, input.orgId);
  if (input.timezone !== undefined && !isUsTimezone(input.timezone)) return { status: 'bad_timezone' };

  const timezone = input.timezone ?? before.timezone;
  const digestHourLocal =
    input.digestHourLocal !== undefined ? clampDigestHour(input.digestHourLocal) : before.digestHourLocal;

  await db
    .update(notificationPreferences)
    .set({
      ...(input.offsets ? { offsets: sanitiseOffsets(input.offsets) as never } : {}),
      ...(input.mutedStates ? { mutedStates: sanitiseStates(input.mutedStates) as never } : {}),
      timezone,
      digestHourLocal,
      ...(input.paused !== undefined ? { paused: input.paused } : {}),
      ...(input.weeklyBrief !== undefined ? { weeklyBrief: input.weeklyBrief } : {}),
      updatedAt: now,
    })
    .where(eq(notificationPreferences.userId, input.userId));

  // A zone or hour change moves the NEXT digest. Today's, if it is already
  // queued, keeps the time it was queued with.
  await ensureRecipient(db, { userId: input.userId, orgId: input.orgId, now, timezone, hourLocal: digestHourLocal });
  if (input.timezone !== undefined || input.digestHourLocal !== undefined) {
    await db
      .update(alertRecipients)
      .set({ nextSendAt: nextSendAt(now, timezone, digestHourLocal) })
      .where(eq(alertRecipients.userId, input.userId));
  }

  await track(db, {
    name: 'notification_prefs_changed',
    orgId: input.orgId,
    userId: input.userId,
    props: {
      offsets: input.offsets ? sanitiseOffsets(input.offsets).length : before.offsets,
      muted_states: input.mutedStates ? sanitiseStates(input.mutedStates).length : undefined,
      timezone,
      digest_hour_local: digestHourLocal,
    },
  });

  // The churn leading indicator — it happens BEFORE the cancellation, not
  // after (`THRESHOLDS.md` §4, `specs/06` §Analytics).
  if (input.paused === true && !before.paused) {
    await track(db, { name: 'notifications_paused', orgId: input.orgId, userId: input.userId });
  }
  return { status: 'saved' };
}

/** Org-level: who receives a digest at all (`specs/10` §Screens). */
export async function listAlertRecipients(db: Db, orgId: string) {
  return db
    .select({
      userId: alertRecipients.userId,
      email: users.email,
      role: memberships.role,
      nextSendAt: alertRecipients.nextSendAt,
      lastSentAt: alertRecipients.lastSentAt,
      suppressedAt: alertRecipients.suppressedAt,
      suppressionReason: alertRecipients.suppressionReason,
      paused: notificationPreferences.paused,
      timezone: notificationPreferences.timezone,
      digestHourLocal: notificationPreferences.digestHourLocal,
      mutedStates: notificationPreferences.mutedStates,
    })
    .from(alertRecipients)
    .innerJoin(users, eq(users.id, alertRecipients.userId))
    .leftJoin(
      memberships,
      and(eq(memberships.userId, alertRecipients.userId), eq(memberships.orgId, orgId)),
    )
    .leftJoin(notificationPreferences, eq(notificationPreferences.userId, alertRecipients.userId))
    .where(eq(alertRecipients.orgId, orgId));
}

export async function setRecipientEnabled(
  db: Db,
  input: { orgId: string; userId: string; enabled: boolean; now?: Date },
): Promise<void> {
  const now = input.now ?? new Date();
  if (input.enabled) {
    await ensureRecipient(db, { userId: input.userId, orgId: input.orgId, now });
    await db
      .update(alertRecipients)
      .set({ suppressedAt: null, suppressionReason: null })
      .where(eq(alertRecipients.userId, input.userId));
    return;
  }
  await db.delete(alertRecipients).where(eq(alertRecipients.userId, input.userId));
}

/** Every member who could be a recipient, whether or not they are one. */
export async function candidateRecipients(db: Db, orgId: string) {
  const rows = await db
    .select({ userId: users.id, email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId));
  const current = await db
    .select({ userId: alertRecipients.userId })
    .from(alertRecipients)
    .where(eq(alertRecipients.orgId, orgId));
  const enabled = new Set(current.map((r) => r.userId));
  return rows.map((row) => ({ ...row, enabled: enabled.has(row.userId) }));
}

// ---------------------------------------------------------------------------
// Email change (`specs/10` AC4)
// ---------------------------------------------------------------------------

export const EMAIL_CHANGE_TTL_MINUTES = 30;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * The address does NOT move here. It moves when the new address consumes the
 * link, which is the only proof that the person asking owns it.
 */
export async function requestEmailChange(
  db: Db,
  input: { orgId: string; userId: string; newEmail: string; now?: Date },
): Promise<{ status: 'sent' | 'invalid' | 'taken'; token?: string; url?: string }> {
  const now = input.now ?? new Date();
  const email = input.newEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: 'invalid' };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0] && existing[0].id !== input.userId) return { status: 'taken' };

  const token = randomBytes(32).toString('hex');
  await db.insert(emailChangeRequests).values({
    id: newId('ecr'),
    orgId: input.orgId,
    userId: input.userId,
    newEmail: email,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + EMAIL_CHANGE_TTL_MINUTES * 60_000),
  });
  await track(db, { name: 'email_change_requested', orgId: input.orgId, userId: input.userId });
  return { status: 'sent', token };
}

export async function consumeEmailChange(
  db: Db,
  input: { token: string; now?: Date },
): Promise<{ status: 'changed' | 'invalid' | 'expired' | 'used'; email?: string }> {
  const now = input.now ?? new Date();
  const [row] = await db
    .select()
    .from(emailChangeRequests)
    .where(eq(emailChangeRequests.tokenHash, hashToken(input.token)))
    .limit(1);
  if (!row) return { status: 'invalid' };
  if (row.consumedAt) return { status: 'used' };
  if (row.expiresAt.getTime() < now.getTime()) return { status: 'expired' };

  // Single use, atomically: the UPDATE both claims and reads, so two clicks
  // 20 ms apart cannot both move the address (the platform's own login-token
  // property, for the same reason).
  const claimed = await db
    .update(emailChangeRequests)
    .set({ consumedAt: now })
    .where(and(eq(emailChangeRequests.id, row.id), isNull(emailChangeRequests.consumedAt)))
    .returning();
  if (claimed.length === 0) return { status: 'used' };

  await db.update(users).set({ email: row.newEmail }).where(eq(users.id, row.userId));
  await recordAudit(db, {
    orgId: row.orgId,
    actorUserId: row.userId,
    action: 'email_changed',
    entityTable: 'users',
    entityId: row.userId,
    after: { email: row.newEmail },
  });
  return { status: 'changed', email: row.newEmail };
}
