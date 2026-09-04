/**
 * THE DRAIN — `specs/06` §Flow, run by the one cron invocation a day.
 *
 * The arithmetic it stands on was shipped by sub-wave A (`repos/alerts.ts`) and
 * carries the two bugs that are invisible until a licence lapses: the Pacific
 * deferral loop (the claim is `next_send_at <= now + DRAIN_INTERVAL`) and
 * exact-equality offsets (the test is `<=`, largest unsent). This module is
 * everything above them:
 *
 *   claim recipients → their due deadline-offsets → SUPPRESS what is not
 *   sendable, with a machine-readable reason → ONE digest per recipient →
 *   send through the one email path → advance `next_send_at`.
 *
 * TWO PROPERTIES WORTH ARGUING WITH:
 *
 *  1. **A suppressed alert is a ROW, never a silence.** The five reasons are
 *     the five carve-outs of the guarantee `OFFER.md` §5.3 drafts and holds
 *     back, so adjudication is a query rather than an argument. That is also
 *     why `added_after_offset` is written for offsets that were never due: a
 *     licence added 20 days before it expires gets the 7-day and day-0 alerts
 *     and an honest history of the three it could not have had.
 *  2. **An empty digest is not sent, and `next_send_at` still advances.** We
 *     never send "nothing to report" — that is how a useful email becomes
 *     background noise, and `notifications_paused` is the churn signal we watch
 *     hardest (`THRESHOLDS.md` §4).
 *
 * The whole module is idempotent: `unique(deadline_id, offset_days,
 * recipient_user_id)` and `unique(recipient_user_id, send_date)` mean a cron
 * that fires twice — which Vercel documents it may — sends once.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import type { Adapters } from '@octopus/platform/adapters';
import { users } from '@octopus/platform/db';
import { sendEmail } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';

import { ALERT_OFFSETS, DAY_MS } from '../cron';
import { getEntitlements } from '../entitlements';
import { daysBetween } from '../rules/dates';
import {
  advanceRecipient,
  claimDueRecipients,
  createDigest,
  selectDueOffsets,
  sentOffsets,
  suppressAlert,
  type DueOffset,
  type SuppressionReason,
} from '../repos/alerts';
import {
  alertRecipients,
  alerts,
  deadlines,
  digests,
  entities,
  licences,
  notificationPreferences,
  technicians,
} from '../schema';
import { renderDigest, type DigestItem } from './digest-email';

export { ALERTS_DRAIN_JOB } from './kinds';

export type AlertDrainContext = {
  db: Db;
  adapters: Adapters;
  env: {
    APP_NAME: string;
    APP_BASE_URL: string;
    COMPANY_NAME: string;
    SUPPORT_EMAIL: string;
    COMPANY_ADDRESS?: string | undefined;
  };
};

export type DrainSummary = {
  claimed: number;
  digestsSent: number;
  digestsEmpty: number;
  digestsSuppressed: number;
  alertsQueued: number;
  suppressed: Record<string, number>;
};

/** The recipient's LOCAL calendar date — what `digests.send_date` means. */
export function localDate(instant: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant);
  }
}

/** `specs/06` §Validation: a user cannot invent 45. */
export function validOffsets(raw: unknown): number[] {
  const allowed = new Set<number>(ALERT_OFFSETS);
  const list = Array.isArray(raw) ? raw.map(Number).filter((n) => allowed.has(n)) : [];
  return list.length > 0 ? list : [...ALERT_OFFSETS];
}

export function validMutedStates(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === 'string').map((v) => v.toUpperCase())
    : [];
}

type DeadlineRow = {
  id: string;
  licenceId: string | null;
  kind: string;
  dueOn: string;
  createdAt: Date;
  state: string | null;
  trade: string | null;
  licenceType: string | null;
  customTypeName: string | null;
  holderFirst: string | null;
  holderLast: string | null;
  entityName: string | null;
  citationUrl: string | null;
  citationText: string | null;
  citationLastVerified: string | null;
  confidence: string;
  needsHumanCheck: boolean;
  notes: unknown;
};

/** Live deadlines for an organisation, with everything a digest line needs. */
export async function digestCandidates(db: Db, orgId: string): Promise<DeadlineRow[]> {
  const rows = await db
    .select({
      id: deadlines.id,
      licenceId: deadlines.licenceId,
      kind: deadlines.kind,
      dueOn: deadlines.dueOn,
      createdAt: deadlines.createdAt,
      state: licences.state,
      trade: licences.trade,
      licenceType: licences.kbLicenceTypeId,
      customTypeName: licences.customTypeName,
      holderFirst: technicians.firstName,
      holderLast: technicians.lastName,
      entityName: entities.name,
      citationUrl: deadlines.citationUrl,
      citationText: deadlines.citationText,
      citationLastVerified: deadlines.citationLastVerified,
      confidence: deadlines.confidence,
      needsHumanCheck: deadlines.needsHumanCheck,
      notes: deadlines.notes,
    })
    .from(deadlines)
    .leftJoin(licences, eq(licences.id, deadlines.licenceId))
    .leftJoin(technicians, eq(technicians.id, licences.technicianId))
    .leftJoin(entities, eq(entities.id, licences.entityId))
    .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt)));
  return rows as DeadlineRow[];
}

const KIND_WORDS: Record<string, string> = {
  renewal: 'Renewal',
  ce: 'Continuing education',
  qualifier_replacement: 'Name a replacement qualifier',
};

function whatIsDue(row: DeadlineRow): string {
  return KIND_WORDS[row.kind] ?? row.kind.replace(/_/g, ' ');
}

function holderOf(row: DeadlineRow): string {
  if (row.holderFirst || row.holderLast) return `${row.holderFirst ?? ''} ${row.holderLast ?? ''}`.trim();
  return row.entityName ?? 'the company';
}

function licenceTypeOf(row: DeadlineRow): string {
  if (row.customTypeName) return row.customTypeName;
  if (!row.licenceType) return 'licence';
  const tail = row.licenceType.split('.').slice(2).join('.');
  return tail.replace(/_/g, ' ') || row.licenceType;
}

export function toDigestItem(row: DeadlineRow, today: string, baseUrl: string, offsetDays: number): DigestItem {
  return {
    deadlineId: row.id,
    licenceId: row.licenceId,
    offsetDays,
    daysAway: daysBetween(today, row.dueOn),
    dueOn: row.dueOn,
    state: row.state ?? '—',
    holder: holderOf(row),
    licenceType: licenceTypeOf(row),
    whatIsDue: whatIsDue(row),
    url: row.licenceId ? `${baseUrl}/licences/${row.licenceId}` : `${baseUrl}/dashboard`,
    citationUrl: row.citationUrl,
    citationText: row.citationText,
    citationLastVerified: row.citationLastVerified,
    confidence: row.confidence,
    needsHumanCheck: row.needsHumanCheck,
    notes: Array.isArray(row.notes) ? (row.notes as unknown[]).map(String) : [],
  };
}

/**
 * The offsets that were NEVER DUE for a deadline, because the deadline did not
 * exist when they passed. Recorded as suppressed with `added_after_offset` —
 * carve-out (a), and the reason a guarantee must not pay out on our own correct
 * behaviour (`OFFER.md` §5.3).
 */
export function offsetsNeverDue(
  dueOn: string,
  createdOn: string,
  offsets: readonly number[] = ALERT_OFFSETS,
): number[] {
  const daysAtCreation = daysBetween(createdOn, dueOn);
  return offsets.filter((offset) => daysAtCreation < offset);
}

async function preferencesFor(db: Db, userId: string, orgId: string) {
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

async function recordSuppression(
  db: Db,
  input: { orgId: string; deadlineId: string; recipientUserId: string; offsetDays: number; reason: SuppressionReason },
  tally: Record<string, number>,
): Promise<void> {
  await suppressAlert(db, input);
  tally[input.reason] = (tally[input.reason] ?? 0) + 1;
  await track(db, {
    name: 'alert_suppressed',
    orgId: input.orgId,
    userId: input.recipientUserId,
    props: { reason: input.reason, deadline_id: input.deadlineId, offset_days: input.offsetDays },
  });
}

/**
 * One pass of the drain. `now` is injected so the regression tests can freeze
 * the clock and skip a day; nothing in here reads the wall clock directly.
 */
export async function runAlertDrain(
  ctx: AlertDrainContext,
  options: { now?: Date; drainIntervalMs?: number } = {},
): Promise<DrainSummary> {
  const now = options.now ?? new Date();
  const drainIntervalMs = options.drainIntervalMs ?? DAY_MS;
  const { db } = ctx;

  const summary: DrainSummary = {
    claimed: 0,
    digestsSent: 0,
    digestsEmpty: 0,
    digestsSuppressed: 0,
    alertsQueued: 0,
    suppressed: {},
  };

  const claimed = await claimDueRecipients(db, now, drainIntervalMs);
  summary.claimed = claimed.length;

  for (const recipient of claimed) {
    const prefs = await preferencesFor(db, recipient.userId, recipient.orgId);
    const timezone = prefs.timezone;
    const today = localDate(now, timezone);
    const offsets = validOffsets(prefs.offsets);
    const muted = new Set(validMutedStates(prefs.mutedStates));

    const [account] = await db.select().from(users).where(eq(users.id, recipient.userId)).limit(1);
    const entitlements = await getEntitlements(db, recipient.orgId, { now });

    // The two organisation-wide carve-outs, decided once per recipient.
    const blanketReason: SuppressionReason | null = entitlements.readOnly
      ? 'subscription_paused'
      : prefs.paused
        ? 'recipient_paused'
        : recipient.suppressedAt
          ? 'address_suppressed'
          : null;

    const candidates = await digestCandidates(db, recipient.orgId);
    const byId = new Map(candidates.map((row) => [row.id, row]));

    // `added_after_offset` first, so the offsets that were never due are on the
    // record BEFORE selection and cannot be chosen.
    for (const row of candidates) {
      for (const offset of offsetsNeverDue(row.dueOn, localDate(row.createdAt, timezone), offsets)) {
        await recordSuppression(
          db,
          {
            orgId: recipient.orgId,
            deadlineId: row.id,
            recipientUserId: recipient.userId,
            offsetDays: offset,
            reason: 'added_after_offset',
          },
          summary.suppressed,
        );
      }
    }

    const already = await sentOffsets(db, recipient.userId, [...byId.keys()]);
    const due: DueOffset[] = selectDueOffsets(
      candidates.map((row) => ({ id: row.id, dueOn: row.dueOn })),
      already,
      today,
      offsets,
    );

    const sendable: DueOffset[] = [];
    for (const item of due) {
      const row = byId.get(item.deadlineId);
      if (!row) continue;
      const reason: SuppressionReason | null =
        blanketReason ?? (row.state && muted.has(row.state.toUpperCase()) ? 'muted_state' : null);
      if (reason) {
        await recordSuppression(
          db,
          {
            orgId: recipient.orgId,
            deadlineId: item.deadlineId,
            recipientUserId: recipient.userId,
            offsetDays: item.offsetDays,
            reason,
          },
          summary.suppressed,
        );
        continue;
      }
      sendable.push(item);
    }

    if (sendable.length === 0) {
      // No email. `next_send_at` still advances: silence must not become a loop.
      summary.digestsEmpty += 1;
      await advanceRecipient(db, {
        userId: recipient.userId,
        now,
        timezone,
        hourLocal: prefs.digestHourLocal,
      });
      continue;
    }

    const items = sendable.map((item) =>
      toDigestItem(byId.get(item.deadlineId)!, today, ctx.env.APP_BASE_URL, item.offsetDays),
    );
    const content = renderDigest(
      {
        appName: ctx.env.APP_NAME,
        companyName: ctx.env.COMPANY_NAME,
        supportEmail: ctx.env.SUPPORT_EMAIL,
        baseUrl: ctx.env.APP_BASE_URL,
        companyAddress: ctx.env.COMPANY_ADDRESS,
      },
      items,
      { digestHourLocal: prefs.digestHourLocal, timezone },
    );

    const digestId = await createDigest(db, {
      orgId: recipient.orgId,
      recipientUserId: recipient.userId,
      sendDate: today,
      subject: content.subject,
      items: sendable,
    });
    summary.alertsQueued += sendable.length;
    await track(db, {
      name: 'digest_queued',
      orgId: recipient.orgId,
      userId: recipient.userId,
      props: { items: sendable.length },
    });

    const result = account
      ? await sendEmail(db, ctx.adapters, {
          to: account.email,
          content,
          tags: { kind: 'digest', org_id: recipient.orgId, digest_id: digestId },
        })
      : ({ status: 'suppressed', email: '' } as const);

    if (result.status === 'suppressed') {
      // The platform's suppression list already knows this address. Record it
      // on the recipient too, so the drain stops choosing them and the reason
      // is readable without joining to the platform's table (platform P-5).
      summary.digestsSuppressed += 1;
      await db
        .update(digests)
        .set({ status: 'suppressed' })
        .where(eq(digests.id, digestId));
      await db
        .update(alerts)
        .set({ status: 'suppressed', suppressionReason: 'address_suppressed' })
        .where(eq(alerts.digestId, digestId));
      await db
        .update(alertRecipients)
        .set({ suppressedAt: now, suppressionReason: 'address_suppressed' })
        .where(eq(alertRecipients.userId, recipient.userId));
    } else {
      summary.digestsSent += 1;
      await db
        .update(digests)
        .set({ status: 'sent', providerMessageId: result.id })
        .where(eq(digests.id, digestId));
      await db
        .update(alerts)
        .set({ status: 'sent', sentAt: now })
        .where(eq(alerts.digestId, digestId));
      await track(db, {
        name: 'digest_sent',
        orgId: recipient.orgId,
        userId: recipient.userId,
        props: { items: sendable.length, message_id: result.id },
      });
    }

    await advanceRecipient(db, {
      userId: recipient.userId,
      now,
      timezone,
      hourLocal: prefs.digestHourLocal,
    });
  }

  return summary;
}

/**
 * A deadline that moved takes its unsent alerts with it (`specs/06` §Edge
 * cases). The customer is told ONCE that a date changed, not four times.
 * M7's `markRenewed` and M5's supersession both call this.
 *
 * `superseded` is deliberately NOT one of the five `SuppressionReason` values:
 * the five are the guarantee's carve-outs and adjudication reads exactly them,
 * so a cancellation caused by our own re-derivation must not be able to look
 * like one. `tests/alerts-drain.test.ts` asserts it is outside the set.
 */
export async function cancelPendingAlerts(db: Db, deadlineId: string): Promise<number> {
  const rows = await db
    .update(alerts)
    .set({ status: 'suppressed', suppressionReason: 'superseded' })
    .where(and(eq(alerts.deadlineId, deadlineId), eq(alerts.status, 'queued')))
    .returning();
  return rows.length;
}

/** `/alerts` — the customer's evidence that they were told. */
export async function alertHistory(db: Db, orgId: string, limit = 100) {
  return db
    .select({
      id: alerts.id,
      deadlineId: alerts.deadlineId,
      offsetDays: alerts.offsetDays,
      status: alerts.status,
      suppressionReason: alerts.suppressionReason,
      failureReason: alerts.failureReason,
      sentAt: alerts.sentAt,
      createdAt: alerts.createdAt,
      recipientEmail: users.email,
      digestSubject: digests.subject,
      digestStatus: digests.status,
      digestSendDate: digests.sendDate,
      dueOn: deadlines.dueOn,
      kind: deadlines.kind,
      state: licences.state,
      licenceId: deadlines.licenceId,
    })
    .from(alerts)
    .leftJoin(users, eq(users.id, alerts.recipientUserId))
    .leftJoin(digests, eq(digests.id, alerts.digestId))
    .leftJoin(deadlines, eq(deadlines.id, alerts.deadlineId))
    .leftJoin(licences, eq(licences.id, deadlines.licenceId))
    .where(eq(alerts.orgId, orgId))
    .orderBy(sql`${alerts.createdAt} desc`)
    .limit(limit);
}

/** The digest a recipient WOULD get today — `sendTestAlert()`, and the preview. */
export async function previewDigest(
  ctx: AlertDrainContext,
  input: { orgId: string; userId: string; now?: Date },
): Promise<{ items: DigestItem[]; content: ReturnType<typeof renderDigest> } | null> {
  const now = input.now ?? new Date();
  const prefs = await preferencesFor(ctx.db, input.userId, input.orgId);
  const today = localDate(now, prefs.timezone);
  const offsets = validOffsets(prefs.offsets);
  const muted = new Set(validMutedStates(prefs.mutedStates));

  const candidates = await digestCandidates(ctx.db, input.orgId);
  const visible = candidates.filter((row) => !(row.state && muted.has(row.state.toUpperCase())));
  const due = selectDueOffsets(
    visible.map((row) => ({ id: row.id, dueOn: row.dueOn })),
    new Set(),
    today,
    offsets,
  );
  const byId = new Map(visible.map((row) => [row.id, row]));
  const items = due.map((item) => toDigestItem(byId.get(item.deadlineId)!, today, ctx.env.APP_BASE_URL, item.offsetDays));
  if (items.length === 0) return null;

  return {
    items,
    content: renderDigest(
      {
        appName: ctx.env.APP_NAME,
        companyName: ctx.env.COMPANY_NAME,
        supportEmail: ctx.env.SUPPORT_EMAIL,
        baseUrl: ctx.env.APP_BASE_URL,
        companyAddress: ctx.env.COMPANY_ADDRESS,
      },
      items,
      { digestHourLocal: prefs.digestHourLocal, timezone: prefs.timezone },
    ),
  };
}

/** `/admin/health` — "last drain: N hours ago" (`specs/06` §Errors). */
export async function lastDrainAt(db: Db): Promise<Date | null> {
  const [row] = await db
    .select({ at: sql<Date | null>`max(${alertRecipients.lastSentAt})` })
    .from(alertRecipients);
  return row?.at ?? null;
}
