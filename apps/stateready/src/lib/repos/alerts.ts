/**
 * M6's DATA MODEL and scheduling arithmetic. `specs/06`.
 *
 * Sub-wave A ships the model, the `nextSendAt` computation and the offset
 * selection — the three things the two regression tests in AC9 and AC10 are
 * about — and **not** the drain, the email or the screens, which belong to the
 * M6 agent (see `BUILD.md`). The reason for splitting it here rather than
 * leaving the whole module: both of those bugs are in the *arithmetic*, and the
 * arithmetic is what the rest of the module is built on top of.
 *
 * THE TWO BUGS, WRITTEN DOWN BECAUSE THEY ARE INVISIBLE UNTIL A LICENCE LAPSES:
 *
 *  1. **The Pacific deferral loop.** The obvious claim, `next_send_at <= now()`,
 *     defers every recipient west of the drain time *forever* on a once-a-day
 *     cron. The claim is `next_send_at <= now() + DRAIN_INTERVAL` —
 *     everything due before we can run again.
 *  2. **Exact-equality offsets delete alerts.** `due_on - today = offset` loses
 *     an alert entirely whenever a run is missed, a deploy lands in the window,
 *     or a deadline is created on the wrong side of midnight — and the alert it
 *     loses is as likely to be the 7-day one as the 90-day one. The test is
 *     `due_on - today <= offset`, taking the LARGEST unsent offset, so a missed
 *     run *delays* an alert and never *deletes* one.
 */

import { newId } from '@octopus/platform';
import { and, eq, inArray, lte } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { ALERT_OFFSETS } from '../cron';
import { daysBetween } from '../rules/dates';
import { alertRecipients, alerts, digests, notificationPreferences } from '../schema';

export type SuppressionReason =
  | 'added_after_offset'
  | 'muted_state'
  | 'recipient_paused'
  | 'address_suppressed'
  | 'subscription_paused';

/**
 * The next instant at which `hourLocal` occurs in `timezone`, at or after `from`.
 *
 * Time zones are resolved through `Intl`, not through a fixed offset, so DST is
 * handled by the platform's own tz database rather than by arithmetic we would
 * get wrong twice a year. The spring-forward hour that does not exist resolves
 * forward, which is the safe direction: an alert an hour early, never a day late.
 */
export function nextSendAt(from: Date, timezone: string, hourLocal: number): Date {
  const zone = safeZone(timezone);
  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1) {
    const probe = new Date(from.getTime() + dayOffset * 86_400_000);
    const parts = zonedParts(probe, zone);
    const candidate = utcForLocal(parts.year, parts.month, parts.day, hourLocal, zone);
    if (candidate.getTime() >= from.getTime()) return candidate;
  }
  /* c8 ignore next */
  return new Date(from.getTime() + 86_400_000);
}

function safeZone(timezone: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    // An unknown zone falls back rather than silently shifting someone's alerts,
    // and the caller raises an admin flag (`specs/06` §Validation).
    return 'America/Chicago';
  }
}

function zonedParts(date: Date, timezone: string): { year: number; month: number; day: number; hour: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
  };
}

/** The UTC instant for a local wall-clock time, found by one offset correction. */
function utcForLocal(year: number, month: number, day: number, hour: number, timezone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const seen = zonedParts(new Date(guess), timezone);
  const seenUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, 0, 0);
  const offset = seenUtc - guess;
  return new Date(guess - offset);
}

export async function ensureRecipient(
  db: Db,
  input: { userId: string; orgId: string; now?: Date; timezone?: string; hourLocal?: number },
) {
  const now = input.now ?? new Date();
  const rows = await db.select().from(alertRecipients).where(eq(alertRecipients.userId, input.userId)).limit(1);
  if (rows[0]) return rows[0];

  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, input.userId))
    .limit(1);
  const timezone = input.timezone ?? prefs[0]?.timezone ?? 'America/Chicago';
  const hourLocal = input.hourLocal ?? prefs[0]?.digestHourLocal ?? 7;

  if (!prefs[0]) {
    await db.insert(notificationPreferences).values({
      userId: input.userId,
      orgId: input.orgId,
      timezone,
      digestHourLocal: hourLocal,
    });
  }
  await db.insert(alertRecipients).values({
    userId: input.userId,
    orgId: input.orgId,
    nextSendAt: nextSendAt(now, timezone, hourLocal),
  });
  const inserted = await db.select().from(alertRecipients).where(eq(alertRecipients.userId, input.userId)).limit(1);
  return inserted[0]!;
}

/** THE CLAIM. `<= now + DRAIN_INTERVAL`, not `<= now` — see the header. */
export async function claimDueRecipients(db: Db, now: Date, drainIntervalMs: number) {
  const horizon = new Date(now.getTime() + drainIntervalMs);
  return db.select().from(alertRecipients).where(lte(alertRecipients.nextSendAt, horizon));
}

export type DueOffset = { deadlineId: string; offsetDays: number };

/**
 * The largest UNSENT offset for each deadline, by inequality. Given a deadline
 * 58 days out with the 90-day alert already sent, the answer is 60 — not 30,
 * and not nothing.
 */
export function selectDueOffsets(
  deadlinesDue: readonly { id: string; dueOn: string }[],
  alreadySent: ReadonlySet<string>,
  today: string,
  offsets: readonly number[] = ALERT_OFFSETS,
): DueOffset[] {
  const sorted = [...offsets].sort((a, b) => b - a);
  const out: DueOffset[] = [];
  for (const deadline of deadlinesDue) {
    const days = daysBetween(today, deadline.dueOn);
    let chosen: number | null = null;
    for (const offset of sorted) {
      if (days > offset) continue;
      if (alreadySent.has(`${deadline.id}|${offset}`)) continue;
      chosen = offset;
      break;
    }
    if (chosen !== null) out.push({ deadlineId: deadline.id, offsetDays: chosen });
  }
  return out;
}

export async function sentOffsets(db: Db, recipientUserId: string, deadlineIds: string[]) {
  if (deadlineIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ deadlineId: alerts.deadlineId, offsetDays: alerts.offsetDays })
    .from(alerts)
    .where(and(eq(alerts.recipientUserId, recipientUserId), inArray(alerts.deadlineId, deadlineIds)));
  return new Set(rows.map((r) => `${r.deadlineId}|${r.offsetDays}`));
}

export async function createDigest(
  db: Db,
  input: {
    orgId: string;
    recipientUserId: string;
    sendDate: string;
    subject: string;
    items: DueOffset[];
    status?: string;
  },
) {
  const digestId = newId('dig');
  await db.insert(digests).values({
    id: digestId,
    orgId: input.orgId,
    recipientUserId: input.recipientUserId,
    sendDate: input.sendDate,
    subject: input.subject,
    itemCount: input.items.length,
    status: input.status ?? 'queued',
  });
  for (const item of input.items) {
    await db.insert(alerts).values({
      id: newId('alr'),
      orgId: input.orgId,
      deadlineId: item.deadlineId,
      recipientUserId: input.recipientUserId,
      offsetDays: item.offsetDays,
      digestId,
      status: 'queued',
    });
  }
  return digestId;
}

/**
 * A suppressed alert is RECORDED, with a machine-readable reason, never
 * dropped: the five reasons are the carve-outs the Alert Guarantee is
 * adjudicated from, so adjudication is a query rather than an argument
 * (`specs/06`, wave-1b **B4**). Silence must be visible to us.
 */
export async function suppressAlert(
  db: Db,
  input: { orgId: string; deadlineId: string; recipientUserId: string; offsetDays: number; reason: SuppressionReason },
) {
  await db
    .insert(alerts)
    .values({
      id: newId('alr'),
      orgId: input.orgId,
      deadlineId: input.deadlineId,
      recipientUserId: input.recipientUserId,
      offsetDays: input.offsetDays,
      status: 'suppressed',
      suppressionReason: input.reason,
    })
    .onConflictDoNothing();
}

export async function advanceRecipient(
  db: Db,
  input: { userId: string; now: Date; timezone: string; hourLocal: number },
) {
  await db
    .update(alertRecipients)
    .set({
      lastSentAt: input.now,
      nextSendAt: nextSendAt(new Date(input.now.getTime() + 60_000), input.timezone, input.hourLocal),
    })
    .where(eq(alertRecipients.userId, input.userId));
}
