/**
 * Stripe webhook entry point — signature verification, then routing.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007: "webhooks are the source of truth,
 * not the redirect." This module does the minimum before handing off to
 * fulfillment.ts: verify, extract the session id, dispatch. All persistence
 * decisions live in fulfillment.ts / refunds.ts so this file stays a router.
 */

import type { Adapters } from '../adapters';
import type { StripeWebhookEvent } from '../adapters/stripe';
import type { Db } from '../db';
import { fulfillCheckoutSession, type FulfillmentResult } from './fulfillment';

export type WebhookResult = FulfillmentResult | { status: 'ignored'; type: string };

/**
 * Both the live and mock adapters put the Stripe object under
 * `event.data.object` (the real Stripe shape); this module reads it
 * defensively so a test fixture using a flatter shape (`event.data` = the
 * object directly) still works, since `MockStripeAdapter.verifyWebhook` does
 * no reshaping of whatever payload the caller constructed.
 */
export function extractStripeObject(event: StripeWebhookEvent): Record<string, unknown> {
  const data = event.data as { object?: Record<string, unknown> } & Record<string, unknown>;
  return (data.object as Record<string, unknown> | undefined) ?? data;
}

export function extractCheckoutSessionId(event: StripeWebhookEvent): string {
  const obj = extractStripeObject(event);
  const id = obj['id'] ?? obj['sessionId'];
  if (typeof id !== 'string') {
    throw new Error(`webhook event ${event.id} (${event.type}) carries no session id`);
  }
  return id;
}

export function extractSessionMetadata(event: StripeWebhookEvent): Record<string, string> {
  const obj = extractStripeObject(event);
  const metadata = obj['metadata'];
  return metadata && typeof metadata === 'object' ? (metadata as Record<string, string>) : {};
}

/**
 * Handles the full webhook lifecycle: verify signature (throws
 * `WebhookVerificationError` on failure — the caller should respond 400
 * without touching the database), then route by event type.
 *
 * Every event is recorded for idempotency inside `fulfillCheckoutSession`
 * (or, for types we don't act on, is simply acknowledged) — Stripe's retry
 * behavior means "we already saw this" must be answerable before any side
 * effect runs, not after.
 */
export async function handleStripeWebhook(
  db: Db,
  adapters: Adapters,
  rawPayload: string,
  signature: string,
): Promise<WebhookResult> {
  const event = adapters.billing.verifyWebhook(rawPayload, signature);

  switch (event.type) {
    case 'checkout.session.completed':
      return fulfillCheckoutSession(db, adapters, event);
    default:
      return { status: 'ignored', type: event.type };
  }
}
