/**
 * THE DELIVERY WEBHOOK — `specs/07` §8, §14, A4, A13.
 *
 * Resend signs its webhooks with the Svix scheme, so the verification is
 * implemented here rather than pulled in as a dependency: it is fifteen lines
 * of HMAC and it is the only way the CONTRACT TEST in `specs/07` §14 can exist
 * at all. The mock adapter has to reproduce "delivered / bounced / complained
 * webhook shapes **and their signatures**" offline, which means the signing
 * function and the verifying function must be the same pair of functions the
 * production route uses. `signResendWebhook` is exported for exactly that and
 * is never called by shipped code.
 *
 * WHAT A BOUNCE MEANS. A HARD bounce or a complaint suppresses the address FOR
 * THE ORG (A4) — not globally: the address is real and its owner has not asked
 * us to stop, the mailbox simply refused this customer's message. Only the
 * statutory opt-out writes a global row (A13). A SOFT bounce suppresses
 * nothing; the mailbox was full, which is tomorrow's problem, not forever's.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { suppressEmail } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';

import { writeAuditEvent } from '../audit';
import type { Db } from '../db';
import { newId } from '../ids';
import { emailEvents, reminders, vendors } from '../schema';
import { suppress } from './unsubscribe';

/** Five minutes, the Svix default. An old signature is a replay. */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export type ResendWebhookHeaders = {
  id: string;
  timestamp: string;
  signature: string;
};

function secretKey(secret: string): Buffer {
  const raw = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  return Buffer.from(raw, 'base64');
}

/** `v1,<base64 hmac>` over `${id}.${timestamp}.${body}`. */
export function signResendWebhook(secret: string, headers: Omit<ResendWebhookHeaders, 'signature'>, body: string): string {
  const mac = createHmac('sha256', secretKey(secret))
    .update(`${headers.id}.${headers.timestamp}.${body}`)
    .digest('base64');
  return `v1,${mac}`;
}

export function verifyResendWebhook(
  secret: string,
  headers: ResendWebhookHeaders,
  body: string,
  now = new Date(),
): boolean {
  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Math.floor(now.getTime() / 1000) - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const expected = signResendWebhook(secret, { id: headers.id, timestamp: headers.timestamp }, body).slice(3);
  const expectedBuffer = Buffer.from(expected, 'base64');
  // The header may carry several space-separated versioned signatures during a
  // secret rotation; any one of them matching is a pass.
  for (const candidate of headers.signature.split(' ')) {
    const [version, value] = candidate.split(',');
    if (version !== 'v1' || !value) continue;
    const given = Buffer.from(value, 'base64');
    if (given.length === expectedBuffer.length && timingSafeEqual(given, expectedBuffer)) return true;
  }
  return false;
}

export type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked';

export type ResendEvent = {
  type: ResendEventType;
  created_at?: string;
  data: {
    email_id: string;
    to?: string[] | string;
    /** Resend reports `Permanent` / `Transient` on a bounce. */
    bounce?: { type?: string; subType?: string; message?: string };
  };
};

export type WebhookOutcome = {
  handled: boolean;
  reminderId: string | null;
  status: string | null;
  suppressed: boolean;
};

function isHardBounce(event: ResendEvent): boolean {
  const type = event.data.bounce?.type?.toLowerCase() ?? '';
  return type === 'permanent' || type === 'hard';
}

/** Apply one verified event. Idempotent: a repeated delivery changes nothing. */
export async function applyResendEvent(db: Db, event: ResendEvent, now = new Date()): Promise<WebhookOutcome> {
  const messageId = event.data.email_id;
  const [reminder] = await db
    .select({
      id: reminders.id,
      orgId: reminders.orgId,
      vendorId: reminders.vendorId,
      rung: reminders.rung,
      recipientEmail: reminders.recipientEmail,
      recipientKind: reminders.recipientKind,
      status: reminders.status,
    })
    .from(reminders)
    .where(eq(reminders.messageId, messageId))
    .limit(1);

  await db.insert(emailEvents).values({
    id: newId('emailEvent'),
    orgId: reminder?.orgId ?? null,
    messageId,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
    receivedAt: now,
  });

  if (!reminder) return { handled: false, reminderId: null, status: null, suppressed: false };

  switch (event.type) {
    case 'email.delivered': {
      await db
        .update(reminders)
        .set({ status: 'delivered', deliveredAt: now })
        .where(and(eq(reminders.id, reminder.id), eq(reminders.status, 'sent')));
      await track(db, { name: 'reminder_delivered', orgId: reminder.orgId, props: { rung: reminder.rung } });
      return { handled: true, reminderId: reminder.id, status: 'delivered', suppressed: false };
    }
    case 'email.bounced': {
      const hard = isHardBounce(event);
      await db.update(reminders).set({ status: 'bounced' }).where(eq(reminders.id, reminder.id));
      await track(db, {
        name: 'reminder_bounced',
        orgId: reminder.orgId,
        props: { kind: hard ? 'hard' : 'soft' },
      });
      if (hard) {
        await suppress(db, {
          email: reminder.recipientEmail,
          scope: 'org',
          orgId: reminder.orgId,
          reason: 'bounce',
        });
        await track(db, { name: 'reminder_suppressed', orgId: reminder.orgId, props: { reason: 'bounce' } });
        const [vendor] = await db
          .select({ name: vendors.name })
          .from(vendors)
          .where(eq(vendors.id, reminder.vendorId));
        await writeAuditEvent(db, {
          orgId: reminder.orgId,
          actor: { kind: 'system' },
          kind: 'reminder.bounced',
          subjectType: 'vendor',
          subjectId: reminder.vendorId,
          payload: { vendorName: vendor?.name ?? 'a vendor', recipientEmail: reminder.recipientEmail },
        });
      }
      return { handled: true, reminderId: reminder.id, status: 'bounced', suppressed: hard };
    }
    case 'email.complained': {
      await db.update(reminders).set({ status: 'complained' }).where(eq(reminders.id, reminder.id));
      await suppress(db, {
        email: reminder.recipientEmail,
        scope: 'org',
        orgId: reminder.orgId,
        reason: 'complaint',
      });
      // A complaint is also a signal about US, not only about this customer,
      // so the platform's own list takes it too and no app can mail it again.
      await suppressEmail(db, { email: reminder.recipientEmail, reason: 'complaint' });
      await track(db, { name: 'reminder_complained', orgId: reminder.orgId });
      await track(db, { name: 'reminder_suppressed', orgId: reminder.orgId, props: { reason: 'complaint' } });
      return { handled: true, reminderId: reminder.id, status: 'complained', suppressed: true };
    }
    default:
      return { handled: true, reminderId: reminder.id, status: reminder.status, suppressed: false };
  }
}
