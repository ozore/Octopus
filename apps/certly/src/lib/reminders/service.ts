/**
 * M7 — SCHEDULING AND SENDING. `specs/07` §4, §8, §9.
 *
 * The three things that will bite, and where each is solved:
 *
 *  1. **The 72-hour per-recipient interval is in the CLAIM QUERY** (§9), not in
 *     a check after the claim. `recipient_sends` is keyed on the ADDRESS ALONE
 *     — not on (org, address) — because the promise in `UX.md` §3.3 and
 *     `LANDING_SPEC.md` §5 is made to the recipient, across every org, vendor,
 *     property and requirement. A rung inside the window is **deferred**: it is
 *     never claimed, so it stays `scheduled` and the next drain reconsiders it.
 *  2. **The per-expiry caps** — 6 per recipient, 10 per expiry — are counted
 *     against rows that actually went out, and a rung refused by them is
 *     `skipped` with `skippedReason: 'expiry_cap'` so the vendor page can say
 *     "we have stopped asking — chase this one yourself".
 *  3. **`SEND_ENABLED` is false outside production**: the message is rendered,
 *     recorded in `email_events` and shown on the email log, and nothing
 *     leaves the system (PLAN.md §A4's drafts-first discipline, applied to
 *     product email).
 *
 * WHY THIS CALLS `adapters.email.send` RATHER THAN THE PLATFORM'S `sendEmail`.
 * A V-email needs a `Reply-To` that is the CUSTOMER's mailbox (§6 item 6), and
 * the platform's one send path does not forward `replyTo` to the adapter. The
 * suppression check that path exists to guarantee is therefore performed here
 * explicitly, against BOTH lists: the platform's own `email_suppressions` and
 * Certly's org/global `suppressions`. Recorded as a platform request.
 */

import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { Adapters } from '@octopus/platform/adapters';
import { isSuppressed } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';
import { organisations } from '@octopus/platform/db';
import { normaliseEmail } from '@octopus/platform/auth';

import { writeAuditEvent, type AuditActor } from '../audit';
import type { Db } from '../db';
import { appOrigin, getEnv } from '../../env';
import { COVERAGE_PROSE, orgToday, type CoiExtraction } from '../engine';
import { newId } from '../ids';
import { ensureOrgSettings, loadRequirementSet, resolveRequirementSetId } from '../repos';
import { createUploadLink } from '../repos/upload-links';
import {
  certificates,
  coverages,
  emailEvents,
  extractions,
  recipientSends,
  reminders,
  vendors,
} from '../schema';
import { composeVendorEmail, type ComposedVendorEmail } from './email';
import {
  MAX_MESSAGES_PER_EXPIRY,
  MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY,
  RECIPIENT_MIN_INTERVAL_HOURS,
  RUNGS,
  computeLadder,
  totalForExpiry,
  type Rung,
} from './ladder';
import { ensureReminderSettings, ladderFor, replyToFor } from './settings';
import { requirementSummary } from './summary';
import { suppressionFor } from './unsubscribe';

export type RecipientKind = 'vendor' | 'producer';

/** Statuses that count as "a message reached a recipient" for the caps. */
const SENT_STATUSES = ['sent', 'delivered', 'bounced', 'complained'] as const;

/**
 * `specs/07` §3: the producer address is CC on T−60/T−30 and TO from T−14 —
 * the agent is copied while there is time and addressed once there is not.
 */
export function deliveryRole(rung: Rung, kind: RecipientKind): 'to' | 'cc' {
  if (kind === 'vendor') return 'to';
  return rung === 'T-60' || rung === 'T-30' ? 'cc' : 'to';
}

export type Recipient = { kind: RecipientKind; email: string };

/**
 * `specs/07` §3. NEVER an address Certly guessed, scraped, purchased or
 * inferred: only the mailbox the customer typed and the address printed on the
 * certificate the customer was given. No `info@` constructed from a domain.
 */
export function resolveRecipients(input: {
  contactEmail: string | null;
  producerEmail: string | null;
}): Recipient[] {
  const out: Recipient[] = [];
  const seen = new Set<string>();
  const push = (kind: RecipientKind, raw: string | null) => {
    if (!raw) return;
    const email = normaliseEmail(raw);
    if (!email.includes('@') || seen.has(email)) return;
    seen.add(email);
    out.push({ kind, email });
  };
  // Vendor first, so a shared address de-duplicates to the vendor row (§11).
  push('vendor', input.contactEmail);
  push('producer', input.producerEmail);
  return out;
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export type ScheduleOutcome = {
  vendorId: string;
  expiryDate: string | null;
  scheduled: number;
  cancelled: number;
  recipients: Recipient[];
  totalForExpiry: number;
  reason: 'ok' | 'no_contact' | 'no_expiry' | 'archived' | 'ladder_exhausted' | 'unknown_vendor';
};

type VendorContext = {
  vendorId: string;
  orgId: string;
  vendorName: string;
  contactEmail: string | null;
  archivedAt: Date | null;
  remindersPaused: boolean;
  timezone: string;
  expiryDate: string | null;
  certificateId: string | null;
  payload: CoiExtraction | null;
};

async function loadVendorContext(db: Db, orgId: string, vendorId: string): Promise<VendorContext | null> {
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.orgId, orgId)));
  if (!vendor) return null;

  const settings = await ensureOrgSettings(db, orgId);

  const [certificate] = await db
    .select({ id: certificates.id, extractionId: certificates.extractionId, earliestExpiry: certificates.earliestExpiry })
    .from(certificates)
    .where(and(eq(certificates.vendorId, vendorId), eq(certificates.orgId, orgId), eq(certificates.status, 'active')))
    .orderBy(desc(certificates.createdAt))
    .limit(1);

  let payload: CoiExtraction | null = null;
  if (certificate?.extractionId) {
    const [extraction] = await db
      .select({ payload: extractions.payload })
      .from(extractions)
      // THE PRODUCER ADDRESS IS USED ONLY IF IT CAME FROM A CERTIFICATE
      // BELONGING TO THIS ORG'S VENDOR (specs/07 §9). The org filter is the
      // whole point of this line.
      .where(and(eq(extractions.id, certificate.extractionId), eq(extractions.orgId, orgId)));
    payload = (extraction?.payload as CoiExtraction | null) ?? null;
  }

  return {
    vendorId,
    orgId,
    vendorName: vendor.name,
    contactEmail: vendor.contactEmail,
    archivedAt: vendor.archivedAt,
    remindersPaused: vendor.remindersPaused,
    timezone: settings.timezone,
    expiryDate: vendor.earliestRequiredExpiry ?? certificate?.earliestExpiry ?? null,
    certificateId: certificate?.id ?? null,
    payload,
  };
}

function producerEmailOf(payload: CoiExtraction | null): string | null {
  return payload?.producer?.email?.value ?? null;
}

/**
 * `scheduleLadder` — idempotent, and it cancels what it supersedes.
 *
 * Called by the comparison job whenever a vendor's earliest required expiry
 * moves. A2: a renewal uploaded mid-ladder cancels the open rungs for the OLD
 * expiry and schedules a fresh ladder from the new one; the rungs already sent
 * are history and are never touched.
 */
export async function scheduleLadder(
  db: Db,
  input: { orgId: string; vendorId: string; now?: Date; actor?: AuditActor },
): Promise<ScheduleOutcome> {
  const now = input.now ?? new Date();
  const context = await loadVendorContext(db, input.orgId, input.vendorId);
  const empty = (reason: ScheduleOutcome['reason'], expiryDate: string | null = null): ScheduleOutcome => ({
    vendorId: input.vendorId,
    expiryDate,
    scheduled: 0,
    cancelled: 0,
    recipients: [],
    totalForExpiry: 0,
    reason,
  });

  if (!context) return empty('unknown_vendor');
  if (context.archivedAt) {
    const cancelled = await cancelOpenRungs(db, input, null);
    return { ...empty('archived'), cancelled };
  }
  if (!context.expiryDate) {
    const cancelled = await cancelOpenRungs(db, input, null);
    return { ...empty('no_expiry'), cancelled };
  }

  const recipients = resolveRecipients({
    contactEmail: context.contactEmail,
    producerEmail: producerEmailOf(context.payload),
  });
  // A7: no mailbox and no producer address → NO LADDER, and the vendor shows on
  // the dashboard as "cannot chase — no contact". Guessing an address would be
  // the easy fix and is the one thing PLAN.md §D5 forbids.
  if (recipients.length === 0) {
    const cancelled = await cancelOpenRungs(db, input, null);
    return { ...empty('no_contact', context.expiryDate), cancelled };
  }

  const rungs = await ladderFor(db, input.orgId);
  const ladder = computeLadder({ expiryDate: context.expiryDate, timezone: context.timezone, now, rungs });
  const cancelled = await cancelOpenRungs(db, input, context.expiryDate);
  if (ladder.length === 0) return { ...empty('ladder_exhausted', context.expiryDate), cancelled };

  const expiryDate = context.expiryDate;
  const alreadySent = await countSentForExpiry(db, input.vendorId, expiryDate);
  const total = totalForExpiry({
    rungCount: ladder.length,
    recipientCount: recipients.length,
    alreadySent: alreadySent.total,
  });

  const rows = ladder.flatMap((entry) =>
    recipients.map((recipient) => ({
      id: newId('reminder'),
      orgId: input.orgId,
      vendorId: input.vendorId,
      certificateId: context.certificateId,
      totalForExpiry: total,
      rung: entry.rung,
      expiryDate,
      scheduledFor: entry.scheduledFor,
      status: 'scheduled',
      recipientKind: recipient.kind,
      recipientEmail: recipient.email,
    })),
  );

  // Two statements rather than one upsert-with-where: a row that has already
  // been SENT must never be dragged back to `scheduled` by a reschedule, and
  // "insert what is missing, then refresh only what is still open" says that
  // in a way no ON CONFLICT clause has to be read twice to confirm.
  await db.insert(reminders).values(rows).onConflictDoNothing();
  for (const row of rows) {
    await db
      .update(reminders)
      .set({ scheduledFor: row.scheduledFor, totalForExpiry: total, certificateId: context.certificateId })
      .where(
        and(
          eq(reminders.vendorId, row.vendorId),
          eq(reminders.rung, row.rung),
          eq(reminders.expiryDate, row.expiryDate),
          eq(reminders.recipientEmail, row.recipientEmail),
          eq(reminders.status, 'scheduled'),
        ),
      );
  }

  await track(db, {
    name: 'reminder_scheduled',
    orgId: input.orgId,
    props: { rung: ladder[0]?.rung ?? null, days_out: ladder.length },
  });

  if (input.actor) {
    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'reminder.scheduled',
      subjectType: 'vendor',
      subjectId: input.vendorId,
      payload: { vendorName: context.vendorName, total, firstRung: ladder[0]?.rung ?? null },
    });
  }

  return {
    vendorId: input.vendorId,
    expiryDate: context.expiryDate,
    scheduled: rows.length,
    cancelled,
    recipients,
    totalForExpiry: total,
    reason: 'ok',
  };
}

/** Open rungs for any OTHER expiry are cancelled; the current one is kept. */
async function cancelOpenRungs(
  db: Db,
  input: { orgId: string; vendorId: string },
  keepExpiry: string | null,
): Promise<number> {
  const conditions = [
    eq(reminders.orgId, input.orgId),
    eq(reminders.vendorId, input.vendorId),
    eq(reminders.status, 'scheduled'),
  ];
  const where = keepExpiry
    ? and(...conditions, sql`${reminders.expiryDate} <> ${keepExpiry}`)
    : and(...conditions);
  const rows = await db
    .update(reminders)
    .set({ status: 'cancelled', skippedReason: keepExpiry ? 'expiry_moved' : 'no_expiry' })
    .where(where)
    .returning();
  if (rows.length > 0) {
    await track(db, {
      name: 'reminder_cancelled',
      orgId: input.orgId,
      props: { cause: keepExpiry ? 'expiry_moved' : 'no_expiry' },
    });
  }
  return rows.length;
}

export async function countSentForExpiry(
  db: Db,
  vendorId: string,
  expiryDate: string,
): Promise<{ total: number; byRecipient: Record<string, number> }> {
  const rows = await db
    .select({ email: reminders.recipientEmail, status: reminders.status })
    .from(reminders)
    .where(
      and(
        eq(reminders.vendorId, vendorId),
        eq(reminders.expiryDate, expiryDate),
        inArray(reminders.status, [...SENT_STATUSES]),
      ),
    );
  const byRecipient: Record<string, number> = {};
  for (const row of rows) byRecipient[row.email] = (byRecipient[row.email] ?? 0) + 1;
  return { total: rows.length, byRecipient };
}

// ---------------------------------------------------------------------------
// Claiming
// ---------------------------------------------------------------------------

export type ClaimedReminder = {
  id: string;
  orgId: string;
  vendorId: string;
  certificateId: string | null;
  totalForExpiry: number;
  rung: Rung;
  expiryDate: string;
  scheduledFor: Date;
  recipientKind: RecipientKind;
  recipientEmail: string;
};

function normaliseRows<T>(result: unknown): T[] {
  const rows = Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : ((result as { rows?: Array<Record<string, unknown>> })?.rows ?? []);
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase())] = value;
    }
    return mapped;
  }) as T[];
}

/**
 * Claim due rungs, atomically, with the 72-hour interval INSIDE the query.
 *
 * `FOR UPDATE SKIP LOCKED` is what makes A6 true: two concurrent cron
 * invocations step over each other's claims instead of both sending. The
 * `NOT EXISTS` against `recipient_sends` is what makes A11 true, and it has to
 * be here rather than in the loop below — a check after the claim would mark
 * the row `sending` and then have to put it back, which is exactly the state a
 * crashed invocation leaves behind.
 */
export async function claimDueReminders(
  db: Db,
  options: { now?: Date; limit?: number } = {},
): Promise<ClaimedReminder[]> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 50;
  const cutoff = new Date(now.getTime() - RECIPIENT_MIN_INTERVAL_HOURS * 3600_000);

  const result = await db.execute(sql`
    WITH claimed AS (
      SELECT r.id
      FROM ${reminders} r
      WHERE r.status = 'scheduled'
        AND r.scheduled_for <= ${now}
        AND NOT EXISTS (
          SELECT 1 FROM ${recipientSends} rs
          WHERE rs.email = r.recipient_email AND rs.last_sent_at > ${cutoff}
        )
      ORDER BY r.scheduled_for ASC, r.id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE ${reminders} AS r
    SET status = 'sending'
    FROM claimed
    WHERE r.id = claimed.id
    RETURNING r.*;
  `);

  return normaliseRows<ClaimedReminder>(result).map((row) => ({
    ...row,
    scheduledFor: new Date(row.scheduledFor as unknown as string),
  }));
}

/** Rungs deferred by the 72-hour rule right now — the number the log shows. */
export async function countDeferred(db: Db, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - RECIPIENT_MIN_INTERVAL_HOURS * 3600_000);
  const result = await db.execute(sql`
    SELECT count(*)::int AS n FROM ${reminders} r
    WHERE r.status = 'scheduled' AND r.scheduled_for <= ${now}
      AND EXISTS (SELECT 1 FROM ${recipientSends} rs WHERE rs.email = r.recipient_email AND rs.last_sent_at > ${cutoff})
  `);
  const rows = normaliseRows<{ n: number }>(result);
  return Number(rows[0]?.n ?? 0);
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export type SendOutcome =
  | { status: 'sent'; reminderId: string; messageId: string; message: ComposedVendorEmail; delivered: boolean }
  | { status: 'skipped'; reminderId: string; reason: string }
  | { status: 'cancelled'; reminderId: string; reason: string };

async function markSkipped(db: Db, id: string, reason: string, orgId: string): Promise<SendOutcome> {
  await db.update(reminders).set({ status: 'skipped', skippedReason: reason }).where(eq(reminders.id, id));
  await track(db, { name: 'reminder_skipped', orgId, props: { reason } });
  return { status: 'skipped', reminderId: id, reason };
}

async function markCancelled(db: Db, id: string, reason: string, orgId: string): Promise<SendOutcome> {
  await db.update(reminders).set({ status: 'cancelled', skippedReason: reason }).where(eq(reminders.id, id));
  await track(db, { name: 'reminder_cancelled', orgId, props: { cause: reason } });
  return { status: 'cancelled', reminderId: id, reason };
}

/** Which coverages carry the earliest expiry, and what else is on the page. */
async function describePolicies(
  db: Db,
  certificateId: string | null,
  expiryDate: string,
): Promise<{ description: string; others: string[] }> {
  if (!certificateId) return { description: 'The policy on the certificate we hold', others: [] };
  const rows = await db
    .select({ type: coverages.type, exp: coverages.policyExp })
    .from(coverages)
    .where(eq(coverages.certificateId, certificateId))
    .orderBy(asc(coverages.policyExp));
  const named = rows.filter((row) => row.exp === expiryDate).map((row) => COVERAGE_PROSE[row.type as keyof typeof COVERAGE_PROSE] ?? row.type);
  const others = [...new Set(rows.filter((row) => row.exp && row.exp !== expiryDate).map((row) => row.exp as string))];
  return {
    description: named.length > 0 ? named.join(' and ') : 'The policy on the certificate we hold',
    others,
  };
}

/**
 * Send one claimed rung. Every refusal is recorded on the row with its reason,
 * because "why did this vendor stop getting emails" is a question the customer
 * asks and the email log has to answer.
 */
export async function sendClaimedReminder(
  db: Db,
  adapters: Adapters,
  claimed: ClaimedReminder,
  options: { now?: Date } = {},
): Promise<SendOutcome> {
  const now = options.now ?? new Date();
  const env = getEnv();
  const context = await loadVendorContext(db, claimed.orgId, claimed.vendorId);

  if (!context) return markCancelled(db, claimed.id, 'unknown_vendor', claimed.orgId);
  if (context.archivedAt) return markCancelled(db, claimed.id, 'vendor_archived', claimed.orgId);
  // A8: paused rungs are SKIPPED, not cancelled — resuming restores the ladder.
  if (context.remindersPaused) return markSkipped(db, claimed.id, 'paused', claimed.orgId);
  // §9: if the certificate was replaced since scheduling, the rung is cancelled.
  if (context.expiryDate !== claimed.expiryDate) return markCancelled(db, claimed.id, 'expiry_moved', claimed.orgId);

  const suppression = await suppressionFor(db, { email: claimed.recipientEmail, orgId: claimed.orgId });
  const platformSuppressed = await isSuppressed(db, claimed.recipientEmail);
  if (suppression.suppressed || platformSuppressed) {
    await track(db, {
      name: 'reminder_suppressed',
      orgId: claimed.orgId,
      props: { reason: suppression.reason ?? 'platform' },
    });
    return markSkipped(db, claimed.id, 'suppressed', claimed.orgId);
  }

  // The caps, counted against messages that actually went out (§9).
  const sent = await countSentForExpiry(db, claimed.vendorId, claimed.expiryDate);
  const toThisRecipient = sent.byRecipient[claimed.recipientEmail] ?? 0;
  if (sent.total >= MAX_MESSAGES_PER_EXPIRY || toThisRecipient >= MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY) {
    return markSkipped(db, claimed.id, 'expiry_cap', claimed.orgId);
  }

  const [org] = await db
    .select({ name: organisations.name })
    .from(organisations)
    .where(eq(organisations.id, claimed.orgId));
  const settings = await ensureOrgSettings(db, claimed.orgId);
  const reminderPrefs = await ensureReminderSettings(db, claimed.orgId);
  // An org-level pause is a kill switch distinct from a per-vendor one: it
  // stops the whole account without touching each vendor's own flag.
  if (reminderPrefs.paused) return markSkipped(db, claimed.id, 'org_paused', claimed.orgId);
  const setId = await resolveRequirementSetId(db, claimed.orgId, claimed.vendorId);
  const set = setId ? await loadRequirementSet(db, claimed.orgId, setId) : null;
  const holder = (settings.entityBlock?.split('\n')[0] ?? org?.name ?? 'the certificate holder').trim();

  // The link is minted PER MESSAGE, and the raw token is returned once and
  // never stored (specs/08 §5). `createdFor` names the rung that produced it,
  // which is how a revocation later says which request it belongs to.
  const link = await createUploadLink(db, {
    orgId: claimed.orgId,
    vendorId: claimed.vendorId,
    createdFor: `reminder:${claimed.rung}`,
    expiryDate: claimed.expiryDate,
    now,
  });

  const policies = await describePolicies(db, claimed.certificateId, claimed.expiryDate);

  const message = composeVendorEmail({
    brand: { appName: env.APP_NAME, companyAddress: env.COMPANY_ADDRESS, origin: appOrigin() },
    orgName: reminderPrefs.sendingName ?? org?.name ?? 'your customer',
    vendorName: context.vendorName,
    rung: claimed.rung,
    expiryDate: claimed.expiryDate,
    policyDescription: policies.description,
    otherExpiries: policies.others,
    requirements: set ? requirementSummary(set, holder) : [],
    uploadToken: link.token,
    unsubscribeToken: claimed.id,
    messageNumber: sent.total + 1,
    messageTotal: Math.max(claimed.totalForExpiry, sent.total + 1),
    replyTo: await replyToFor(db, claimed.orgId, env.SUPPORT_EMAIL),
    deliveryRole: deliveryRole(claimed.rung, claimed.recipientKind),
    recipientKind: claimed.recipientKind,
  });

  // SEND_ENABLED defaults to false outside production (§9, A10): the rendered
  // message is written to the email log and NOTHING leaves the system.
  const sendEnabled = env.SEND_ENABLED === true;
  let messageId = `local_${claimed.id}`;
  if (sendEnabled) {
    const result = await adapters.email.send({
      to: claimed.recipientEmail,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      tags: { rung: claimed.rung.replace(/[^A-Za-z0-9_]/g, '_'), kind: claimed.recipientKind },
    });
    messageId = result.id;
  }

  await db
    .update(reminders)
    .set({ status: 'sent', sentAt: now, messageId, uploadLinkId: link.id })
    .where(eq(reminders.id, claimed.id));

  // The 72-hour clock, keyed on the address alone.
  await db
    .insert(recipientSends)
    .values({ email: claimed.recipientEmail, lastSentAt: now })
    .onConflictDoUpdate({ target: recipientSends.email, set: { lastSentAt: now } });

  await db.insert(emailEvents).values({
    id: newId('emailEvent'),
    orgId: claimed.orgId,
    messageId,
    type: sendEnabled ? 'sent' : 'rendered_not_sent',
    payload: {
      to: claimed.recipientEmail,
      role: deliveryRole(claimed.rung, claimed.recipientKind),
      subject: message.subject,
      text: message.text,
      replyTo: message.replyTo,
      fromDisplayName: message.fromDisplayName,
      rung: claimed.rung,
      vendorId: claimed.vendorId,
      reminderId: claimed.id,
    },
    receivedAt: now,
  });

  await track(db, {
    name: 'reminder_sent',
    orgId: claimed.orgId,
    props: { rung: claimed.rung, recipient_kind: claimed.recipientKind },
  });
  await writeAuditEvent(db, {
    orgId: claimed.orgId,
    actor: { kind: 'system' },
    kind: 'reminder.sent',
    subjectType: 'vendor',
    subjectId: claimed.vendorId,
    payload: {
      vendorName: context.vendorName,
      recipientEmail: claimed.recipientEmail,
      rung: claimed.rung,
      expiryDate: claimed.expiryDate,
    },
  });

  return { status: 'sent', reminderId: claimed.id, messageId, message, delivered: sendEnabled };
}

export type DrainSummary = {
  claimed: number;
  sent: number;
  skipped: number;
  cancelled: number;
  deferred: number;
  reasons: Record<string, number>;
};

/** One cron tick. Failure is per rung: one bad row must not abandon the batch. */
export async function drainReminders(
  db: Db,
  adapters: Adapters,
  options: { now?: Date; limit?: number } = {},
): Promise<DrainSummary> {
  const now = options.now ?? new Date();
  const claimed = await claimDueReminders(db, options);
  const summary: DrainSummary = {
    claimed: claimed.length,
    sent: 0,
    skipped: 0,
    cancelled: 0,
    deferred: await countDeferred(db, now),
    reasons: {},
  };

  for (const row of claimed) {
    try {
      const outcome = await sendClaimedReminder(db, adapters, row, { now });
      if (outcome.status === 'sent') summary.sent += 1;
      else {
        summary[outcome.status === 'skipped' ? 'skipped' : 'cancelled'] += 1;
        summary.reasons[outcome.reason] = (summary.reasons[outcome.reason] ?? 0) + 1;
      }
    } catch (error) {
      // §12: a template render or provider failure must not send a broken
      // email — put the row back and let the next tick retry it.
      await db.update(reminders).set({ status: 'scheduled' }).where(eq(reminders.id, row.id));
      summary.reasons['error'] = (summary.reasons['error'] ?? 0) + 1;
      console.warn(`[reminders] ${row.id} failed:`, error);
    }
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Pause, resume, send-now, and the "we have stopped asking" flag
// ---------------------------------------------------------------------------

export async function pauseReminders(
  db: Db,
  input: { orgId: string; vendorId: string; paused: boolean; actor: AuditActor; now?: Date },
): Promise<void> {
  const now = input.now ?? new Date();
  await db
    .update(vendors)
    .set({ remindersPaused: input.paused, updatedAt: now })
    .where(and(eq(vendors.id, input.vendorId), eq(vendors.orgId, input.orgId)));

  if (!input.paused) {
    // A8: resuming RESTORES the remaining ladder. Rungs whose moment has
    // already gone by stay skipped — a resume must not fire four overdue
    // messages in one minute — but everything still ahead comes back.
    await db
      .update(reminders)
      .set({ status: 'scheduled', skippedReason: null })
      .where(
        and(
          eq(reminders.orgId, input.orgId),
          eq(reminders.vendorId, input.vendorId),
          eq(reminders.status, 'skipped'),
          eq(reminders.skippedReason, 'paused'),
          sql`${reminders.scheduledFor} > ${now}`,
        ),
      );
  } else {
    await track(db, { name: 'reminder_paused', orgId: input.orgId });
    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'reminder.paused',
      subjectType: 'vendor',
      subjectId: input.vendorId,
    });
  }
}

export type ChaseState = {
  stoppedAsking: boolean;
  sentForExpiry: number;
  cap: number;
  paused: boolean;
  cannotChase: boolean;
};

/**
 * What the dashboard and the vendor page print. `stoppedAsking` is the flag
 * `specs/07` §9 requires — *"we have stopped asking — chase this one
 * yourself"* — and it is derived from the rows rather than cached, because a
 * cached flag is a flag that can disagree with the log it summarises.
 */
export async function chaseState(db: Db, orgId: string, vendorId: string): Promise<ChaseState> {
  const context = await loadVendorContext(db, orgId, vendorId);
  const recipients = context
    ? resolveRecipients({ contactEmail: context.contactEmail, producerEmail: producerEmailOf(context.payload) })
    : [];
  if (!context?.expiryDate) {
    return {
      stoppedAsking: false,
      sentForExpiry: 0,
      cap: MAX_MESSAGES_PER_EXPIRY,
      paused: context?.remindersPaused ?? false,
      cannotChase: recipients.length === 0,
    };
  }
  const sent = await countSentForExpiry(db, vendorId, context.expiryDate);
  const [capped] = await db
    .select({ id: reminders.id })
    .from(reminders)
    .where(
      and(
        eq(reminders.vendorId, vendorId),
        eq(reminders.expiryDate, context.expiryDate),
        eq(reminders.skippedReason, 'expiry_cap'),
      ),
    )
    .limit(1);
  return {
    stoppedAsking: Boolean(capped) || sent.total >= MAX_MESSAGES_PER_EXPIRY,
    sentForExpiry: sent.total,
    cap: MAX_MESSAGES_PER_EXPIRY,
    paused: context.remindersPaused,
    cannotChase: recipients.length === 0,
  };
}

/** `sendReminderNow` — manual, rate-limited to one per vendor per hour (§8). */
export async function sendReminderNow(
  db: Db,
  input: { orgId: string; vendorId: string; now?: Date },
): Promise<{ queued: boolean; reason?: string }> {
  const now = input.now ?? new Date();
  const context = await loadVendorContext(db, input.orgId, input.vendorId);
  if (!context?.expiryDate) return { queued: false, reason: 'no_expiry' };

  const [recent] = await db
    .select({ sentAt: reminders.sentAt })
    .from(reminders)
    .where(
      and(
        eq(reminders.vendorId, input.vendorId),
        sql`${reminders.sentAt} > ${new Date(now.getTime() - 3600_000)}`,
      ),
    )
    .limit(1);
  if (recent) return { queued: false, reason: 'rate_limited' };

  const [next] = await db
    .select({ id: reminders.id })
    .from(reminders)
    .where(
      and(
        eq(reminders.orgId, input.orgId),
        eq(reminders.vendorId, input.vendorId),
        eq(reminders.status, 'scheduled'),
        eq(reminders.expiryDate, context.expiryDate),
      ),
    )
    .orderBy(asc(reminders.scheduledFor))
    .limit(1);
  if (!next) return { queued: false, reason: 'nothing_scheduled' };

  await db.update(reminders).set({ scheduledFor: now }).where(eq(reminders.id, next.id));
  return { queued: true };
}

/** The email log — `specs/07` §5, last 200 sends with their state. */
export async function listEmailLog(db: Db, orgId: string, limit = 200) {
  return db
    .select({
      id: reminders.id,
      vendorId: reminders.vendorId,
      vendorName: vendors.name,
      rung: reminders.rung,
      expiryDate: reminders.expiryDate,
      status: reminders.status,
      skippedReason: reminders.skippedReason,
      recipientKind: reminders.recipientKind,
      recipientEmail: reminders.recipientEmail,
      scheduledFor: reminders.scheduledFor,
      sentAt: reminders.sentAt,
      deliveredAt: reminders.deliveredAt,
      messageId: reminders.messageId,
      totalForExpiry: reminders.totalForExpiry,
    })
    .from(reminders)
    .leftJoin(vendors, eq(vendors.id, reminders.vendorId))
    .where(eq(reminders.orgId, orgId))
    .orderBy(desc(reminders.scheduledFor))
    .limit(limit);
}

/** The action items a hard bounce becomes — `specs/07` §5, A4. */
export async function listBounceActions(db: Db, orgId: string) {
  return db
    .select({
      recipientEmail: reminders.recipientEmail,
      recipientKind: reminders.recipientKind,
      vendorId: reminders.vendorId,
      vendorName: vendors.name,
    })
    .from(reminders)
    .leftJoin(vendors, eq(vendors.id, reminders.vendorId))
    .where(and(eq(reminders.orgId, orgId), inArray(reminders.status, ['bounced', 'complained'])))
    .orderBy(desc(reminders.sentAt))
    .limit(50);
}

/** Every vendor whose ladder cannot run for want of an address (A7). */
export async function listCannotChase(db: Db, orgId: string) {
  return db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors)
    .where(and(eq(vendors.orgId, orgId), isNull(vendors.archivedAt), isNull(vendors.contactEmail)))
    .orderBy(asc(vendors.name));
}

export { RUNGS, orgToday };
