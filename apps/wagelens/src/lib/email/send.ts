/**
 * The send path, with the one thing the platform's shared list cannot express
 * yet: a **scope**.
 *
 * `email_suppressions` is shared with the outbound engine (PLAN.md D4) and has
 * no `scope` column — see `REQUESTS.md` request B3-2. Until it does, the scope
 * is encoded in `reason`, exactly as `BUILD.md` §2 (WL-14) instructs:
 *
 * | reason | stops |
 * |---|---|
 * | `unsubscribed_watch`, `unsubscribed_outbound`, `unsubscribe` | marketing only |
 * | `hard_bounce`, `bounce`, `complaint`, `manual` | everything |
 *
 * WHY THAT DISTINCTION IS NOT A DETAIL. WL-14 V7 and WL-09 V16c both say the
 * same thing from opposite ends: an unsubscribe from a public determination
 * watch may never suppress a magic link, a billing email or a paying
 * customer's WL-08 project alert; and a hard bounce must stop everything,
 * because continuing to send to a dead address is how a sending domain dies.
 * One list, two questions, and `reason` is what tells them apart.
 *
 * `scope: 'transactional'` therefore cannot go through the platform's
 * `sendEmail`, whose suppression check is unconditional and would let a
 * marketing unsubscribe stop a billing notice. This module performs the
 * scope-aware check instead and hands the message to the same Resend adapter.
 * Nothing here bypasses the adapter, so nothing bypasses the mock in tests: no
 * module in this app constructs an email client.
 */

import { eq } from 'drizzle-orm';

import type { Adapters } from '@octopus/platform/adapters';
import { normaliseEmail } from '@octopus/platform/auth';
import type { Db } from '@octopus/platform/db';
import { emailSuppressions } from '@octopus/platform/db';
import { brandFromEnv } from '@octopus/platform/email';

import type { AppEmailContent } from './layout';

export type SendScope = 'marketing' | 'transactional';

/** Reasons that stop marketing only; everything else stops all mail. */
const MARKETING_ONLY_REASONS = new Set([
  'unsubscribe',
  'unsubscribed_watch',
  'unsubscribed_outbound',
]);

export const SUPPRESSION_REASONS = {
  watchUnsubscribe: 'unsubscribed_watch',
  outboundUnsubscribe: 'unsubscribed_outbound',
  hardBounce: 'hard_bounce',
  complaint: 'complaint',
} as const;

export function suppressionScopeOf(reason: string): 'marketing' | 'all' {
  return MARKETING_ONLY_REASONS.has(reason) ? 'marketing' : 'all';
}

/** True when this address must not receive a message of this scope. */
export async function isSuppressedFor(db: Db, email: string, scope: SendScope): Promise<boolean> {
  const [row] = await db
    .select({ reason: emailSuppressions.reason })
    .from(emailSuppressions)
    .where(eq(emailSuppressions.email, normaliseEmail(email)))
    .limit(1);
  if (!row) return false;
  const suppressionScope = suppressionScopeOf(row.reason);
  return suppressionScope === 'all' || scope === 'marketing';
}

/**
 * Record an unsubscribe or a bounce. The platform's `suppressEmail` types
 * `reason` as its own four-value union, so this writes the row directly in
 * order to carry the scope-encoding vocabulary above. It is the same table.
 */
export async function suppressWithReason(
  db: Db,
  input: { email: string; reason: string; note?: string },
): Promise<void> {
  await db
    .insert(emailSuppressions)
    .values({
      email: normaliseEmail(input.email),
      reason: input.reason,
      note: input.note ?? null,
    })
    .onConflictDoNothing();
}

export type ScopedSendResult =
  | { status: 'sent'; id: string }
  | { status: 'suppressed'; email: string };

/**
 * Send one message, through the platform's Resend adapter (the mock in tests
 * and in the e2e lane — nothing in this app can reach a real inbox from a
 * test, because nothing here constructs a client).
 *
 * The suppression check happens HERE, at send time and not at enqueue time
 * (WL-14 V8): a job enqueued this morning for an address that unsubscribed at
 * noon must not send this afternoon.
 */
export async function sendScoped(
  db: Db,
  adapters: Adapters,
  input: {
    to: string;
    scope: SendScope;
    content: AppEmailContent;
    tags?: Record<string, string>;
  },
): Promise<ScopedSendResult> {
  if (await isSuppressedFor(db, input.to, input.scope)) {
    return { status: 'suppressed', email: input.to };
  }

  const sent = await adapters.email.send({
    to: input.to,
    subject: input.content.subject,
    html: input.content.html,
    text: input.content.text,
    ...(input.tags ? { tags: input.tags } : {}),
    // Extra field: the port has no `headers` today (request B3-1). The mock
    // records it, so the suite asserts the header the spec requires; the live
    // adapter ignores it until the port gains the field.
    ...(input.content.headers ? { headers: input.content.headers } : {}),
  } as Parameters<Adapters['email']['send']>[0]);

  return { status: 'sent', id: sent.id };
}

export { brandFromEnv };
