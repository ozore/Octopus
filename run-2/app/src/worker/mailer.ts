/**
 * The outbound mail adapter.
 *
 * Spec: ARCHITECTURE.md §11.3 — "an email attachment: the WD-change and
 * export-on-cancel emails carry A LINK to the authenticated route, NEVER the file";
 * §3.4 and the outbox's own header — outbound only, no inbound adapter, no reply-to
 * that routes into the product.
 *
 * WHAT THIS ADAPTER IS ALLOWED TO PUT IN A MESSAGE. A template key, an account id,
 * dates, and a link to an authenticated route. It is not allowed to put a worker
 * name, a rate, a deduction, an SSN or an artifact in one, because a mail provider
 * is not inside the boundary §11.3 draws around those — and the enforcement is that
 * `renderMessage` below reads only from a fixed field list of the payload, so a
 * payload that gained a sensitive field would not render it.
 *
 * EVERY SUBJECT LINE IS A STATEMENT ABOUT OUR OWN SYSTEM. None of them asks the
 * recipient to reply, none offers a person, and none contains an address — replies
 * land at a published address and are counted by G5 (§11.8), which is the honest
 * accounting rather than a channel we pretend not to have.
 */

import type { Mailer, OutboxMessage } from '../platform/ops/outbox';

interface Rendered {
  readonly subject: string;
  readonly body: string;
}

const SUBJECT: Readonly<Record<string, string>> = {
  magic_link: 'Your Ratepin sign-in link',
  dunning_payment_failed: 'A payment did not go through',
  dunning_hard_decline: 'That card was declined and will not be retried',
  dunning_grace_started: 'A payment failed — everything still works for now',
  dunning_restricted: 'New filings are paused; your archive and export stay open',
  archive_export_link: 'Your Ratepin archive, and how to download it',
  wd_change: 'A newer revision of a wage determination you pinned',
  staleness_credit: 'A service credit has been applied to your next invoice',
  deletion_scheduled: 'Your Ratepin account is scheduled for deletion',
  deletion_executed: 'Your Ratepin account has been deleted',
};

/** The only payload fields a message may carry into a mail provider. */
const ALLOWED_FIELDS: readonly string[] = [
  'effective_at',
  'undo_window_days',
  'next_transition_at',
  'reason',
  'archive_open',
  'export_open',
  'invoice_id',
  'decline_code',
  'wd_number',
  'revision',
  'week_ending',
  'banner',
  'link_path',
];

export function renderMessage(message: OutboxMessage, baseUrl: string): Rendered {
  const subject = SUBJECT[message.template] ?? 'Ratepin';
  const lines: string[] = [];
  for (const field of ALLOWED_FIELDS) {
    const value = message.payload[field];
    if (value === undefined || value === null) continue;
    lines.push(`${field}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
  }
  const path = typeof message.payload['link_path'] === 'string' ? message.payload['link_path'] : '/app';
  lines.push('', `Open Ratepin: ${baseUrl}${path}`);
  return { subject, body: lines.join('\n') };
}

/**
 * Resend, over its documented HTTP API rather than through its SDK — one POST, and
 * one fewer dependency in the production image. Constructed only when a key exists;
 * the offline suite uses `createRecordingMailer` and never reaches this file's
 * network call.
 */
export function createResendMailer(input: {
  readonly apiKey: string;
  readonly from: string;
  readonly baseUrl: string;
}): Mailer {
  return {
    async send(message: OutboxMessage): Promise<{ readonly id: string }> {
      const rendered = renderMessage(message, input.baseUrl);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: input.from,
          to: [message.to],
          subject: rendered.subject,
          text: rendered.body,
        }),
      });
      if (!response.ok) {
        throw new Error(`Resend responded ${String(response.status)} for template ${message.template}`);
      }
      const body: unknown = await response.json();
      const id =
        body !== null && typeof body === 'object' && typeof (body as { id?: unknown }).id === 'string'
          ? (body as { id: string }).id
          : `resend_${message.id}`;
      return { id };
    },
  };
}
