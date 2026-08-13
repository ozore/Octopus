/**
 * `POST /api/stripe/webhook` — the endpoint ADR-007 calls the source of truth.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007 — "webhooks are the source of truth, not
 * the redirect." Every other module in `lib/billing/` was written against this
 * route's existence; without it, `startCheckout` opened a real hosted Checkout,
 * Stripe charged a real card, and nothing in the system ever moved the payment
 * out of `pending` — because `recordCheckoutReturn` deliberately grants nothing
 * in live mode. This file is what closes that loop.
 *
 * FOUR THINGS THIS HANDLER MUST DO THAT ARE NOT VISIBLE IN ITS SHAPE:
 *
 *  1. READ THE RAW BODY. Stripe's signature is computed over the exact bytes it
 *     sent. `await request.text()` before any parsing; a `request.json()`
 *     followed by a re-`stringify` produces a different byte sequence and every
 *     signature fails. This is why there is no body parsing in this file at all.
 *
 *  2. 400 ON A BAD SIGNATURE, WITHOUT TOUCHING THE DATABASE. An unverified
 *     payload is an unauthenticated write request. `verifyWebhook` throws
 *     `WebhookVerificationError` before `handleStripeWebhook` reaches any repo.
 *
 *  3. 500 — NOT 200 — ON A FULFILMENT FAILURE. Stripe retries a 5xx with
 *     backoff for up to three days; that retry schedule IS the recovery
 *     mechanism for a transient database failure mid-fulfilment, and swallowing
 *     the error into a 200 would silently abandon a customer who has paid.
 *     `fulfillCheckoutSession` is idempotent on `event.id` and rolls its
 *     idempotency claim back with the transaction, so a retry is safe.
 *
 *  4. NEVER ECHO THE PAYLOAD. The response body is a status word. An error
 *     message returned to an unauthenticated caller is a probing oracle.
 *
 * Runtime is Node, not Edge: the Stripe SDK's `constructEvent` needs node
 * crypto, and `fulfillCheckoutSession` opens a Postgres transaction.
 */

import { getAdapters } from '@/lib/adapters';
import { WebhookVerificationError } from '@/lib/adapters/stripe';
import { handleStripeWebhook } from '@/lib/billing/webhook';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature') ?? '';
  const rawPayload = await request.text();

  let result;
  try {
    const db = await getDb();
    result = await handleStripeWebhook(db, getAdapters(), rawPayload, signature);
  } catch (error) {
    // `name` as well as `instanceof`: Next compiles the RSC and route-handler
    // graphs separately, so a class can have two identities in one process and
    // `instanceof` can fail against an error the adapter genuinely threw. The
    // inbound-mail route hit exactly that and 500'd where it meant to 400. A
    // 500 on an unverifiable payload asks the sender to retry something we have
    // already refused.
    if (
      error instanceof WebhookVerificationError ||
      (error instanceof Error && error.name === 'WebhookVerificationError')
    ) {
      log('warn', 'stripe.webhook_unverified', { reason: (error as Error).message });
      return Response.json({ status: 'invalid_signature' }, { status: 400 });
    }
    // Twelve-Factor XI: the event stream is where this is diagnosed. The
    // RESPONSE stays a status word so an unauthenticated caller learns nothing.
    log('error', 'stripe.webhook_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ status: 'error' }, { status: 500 });
  }

  log('info', 'stripe.webhook_handled', { result: result.status });
  return Response.json(result, { status: 200 });
}

function log(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, proc: 'web', event, ...fields });
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}
