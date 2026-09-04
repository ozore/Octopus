/**
 * `/settings/reminders` as data — `specs/07` §5.
 *
 * The reply-to falls back to the ORG OWNER's own address rather than to a
 * product mailbox, because §6 item 6's promise is that "an agent's reply
 * reaches a human who can decide". A no-reply address on a request to a
 * stranger is the single easiest way to make the request ignorable.
 */

import { and, asc, eq } from 'drizzle-orm';

import { memberships, users } from '@octopus/platform/db';

import type { Db } from '../db';
import { reminderSettings } from '../schema';
import { RUNGS, parseLadder, type Rung } from './ladder';

export type ReminderSettings = typeof reminderSettings.$inferSelect;

export async function ensureReminderSettings(db: Db, orgId: string): Promise<ReminderSettings> {
  const [existing] = await db.select().from(reminderSettings).where(eq(reminderSettings.orgId, orgId));
  if (existing) return existing;
  const [created] = await db.insert(reminderSettings).values({ orgId }).returning();
  return created as ReminderSettings;
}

export async function ladderFor(db: Db, orgId: string): Promise<Rung[]> {
  const settings = await ensureReminderSettings(db, orgId);
  return parseLadder(settings.ladder ?? undefined);
}

/** The org owner's mailbox — the fallback reply-to. */
export async function ownerEmail(db: Db, orgId: string): Promise<string | null> {
  const [row] = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.orgId, orgId), eq(memberships.role, 'owner')))
    .orderBy(asc(memberships.createdAt))
    .limit(1);
  return row?.email ?? null;
}

export async function replyToFor(db: Db, orgId: string, fallback: string): Promise<string> {
  const settings = await ensureReminderSettings(db, orgId);
  return settings.replyToEmail ?? (await ownerEmail(db, orgId)) ?? fallback;
}

export type ReminderSettingsPatch = {
  ladder?: string[];
  sendingName?: string | null;
  replyToEmail?: string | null;
  weeklyDigestDay?: number;
  paused?: boolean;
};

export async function updateReminderSettings(
  db: Db,
  input: { orgId: string; patch: ReminderSettingsPatch },
): Promise<ReminderSettings> {
  await ensureReminderSettings(db, input.orgId);
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  // A rung that is not one of the ten is DROPPED, not stored: `specs/07` §2
  // says rungs can be removed and never invented, and a settings row is the
  // one place somebody could invent one.
  if (input.patch.ladder) patch['ladder'] = parseLadder(input.patch.ladder);
  if ('sendingName' in input.patch) patch['sendingName'] = input.patch.sendingName ?? null;
  if ('replyToEmail' in input.patch) patch['replyToEmail'] = input.patch.replyToEmail ?? null;
  if (typeof input.patch.weeklyDigestDay === 'number') {
    patch['weeklyDigestDay'] = Math.min(7, Math.max(1, Math.round(input.patch.weeklyDigestDay)));
  }
  if (typeof input.patch.paused === 'boolean') patch['paused'] = input.patch.paused;

  const [updated] = await db
    .update(reminderSettings)
    .set(patch)
    .where(eq(reminderSettings.orgId, input.orgId))
    .returning();
  return updated as ReminderSettings;
}

export { RUNGS };
