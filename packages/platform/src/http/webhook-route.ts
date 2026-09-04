/**
 * POST /api/stripe/webhook.
 *
 * The RAW body is what Stripe signs, so it is read as text and never parsed
 * before verification — `await request.json()` here would break every
 * signature. Next.js App Router route handlers do not buffer or transform the
 * body, so `request.text()` is the raw bytes as sent.
 */

import { WebhookVerificationError } from '../adapters/billing';
import { handleBillingWebhook } from '../billing/webhook';
import { getContext, requirePlans } from '../runtime';

export function createStripeWebhookHandler() {
  return async (request: Request): Promise<Response> => {
    const signature = request.headers.get('stripe-signature');
    if (!signature) return new Response('missing stripe-signature', { status: 400 });

    const raw = await request.text();
    const ctx = await getContext();

    try {
      const result = await handleBillingWebhook(
        { db: ctx.db, adapters: ctx.adapters, plans: requirePlans(), env: ctx.env },
        raw,
        signature,
      );
      // 200 on duplicate and on ignored: anything else makes Stripe retry an
      // event we have already handled or deliberately do not handle.
      return Response.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        return new Response(`signature verification failed: ${error.message}`, { status: 400 });
      }
      // A real failure must be a 500 so Stripe retries it.
      console.error('[stripe webhook] handler failed', error);
      return new Response('handler error', { status: 500 });
    }
  };
}
