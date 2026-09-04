/**
 * POST /api/stripe/webhook — the source of truth for entitlement.
 *
 * `dynamic = 'force-dynamic'` and the Node runtime are both required: the
 * handler reads the RAW body for signature verification and writes to Postgres.
 *
 * THREE THINGS HAPPEN HERE, IN THIS ORDER, AND THE ORDER IS THE POINT:
 *
 *  1. **Verify the signature.** An unverified payload is a stranger claiming a
 *     customer paid, so nothing below runs until the HMAC checks out (400).
 *  2. **Route a Vendor Pack event away from the platform mirror.** The
 *     platform's `subscriptions` table holds ONE live row per organisation and
 *     answers "what plan is this org on?"; a pack is a second line, and
 *     mirroring it there would make a customer who just bought fifty more
 *     vendors look like a customer on no plan (`schema.ts#billingAddons`).
 *  3. **Run the platform handler, then Certly's own effects** — the consent
 *     record, the funnel events, the pre-charge warning — and only when the
 *     platform actually processed the event, never on a Stripe retry.
 *
 * Certly's effects run OUTSIDE the platform's transaction on purpose: a failure
 * writing an analytics row must not roll back the entitlement the customer paid
 * for. Each effect is separately idempotent (one consent row per session, one
 * `trial_converted` per org).
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { applyCertlyBillingEffects, handlePackEvent, isPackEvent } from '@/lib/billing/webhook';
import { getAdapters } from '@octopus/platform/adapters';
import { WebhookVerificationError } from '@octopus/platform/adapters';
import { handleBillingWebhook } from '@octopus/platform/billing';
import { getDb } from '@octopus/platform/db';

import { plans } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('missing stripe-signature', { status: 400 });

  const raw = await request.text();
  const env = getEnv() as unknown as Record<string, unknown> & { APP_BASE_URL: string };
  const adapters = getAdapters();
  const db = await getDb();

  let event;
  try {
    event = adapters.billing.verifyWebhook(raw, signature);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response(`signature verification failed: ${error.message}`, { status: 400 });
    }
    return new Response('bad payload', { status: 400 });
  }

  try {
    if (isPackEvent(event, env)) {
      const pack = await handlePackEvent({ db, adapters, env }, event);
      return Response.json({ handler: 'certly.vendor_pack', ...pack }, { status: 200 });
    }

    const result = await handleBillingWebhook({ db, adapters, plans, env }, raw, signature);
    // A6: a redelivery is answered 200 and does nothing twice.
    if (result.status === 'duplicate') return Response.json(result, { status: 200 });

    const certly = await applyCertlyBillingEffects({ db, adapters, env }, event);
    return Response.json({ ...result, certly: certly.effects }, { status: 200 });
  } catch (error) {
    // A real failure must be a 500 so Stripe retries it.
    console.error('[stripe webhook] handler failed', error);
    return new Response('handler error', { status: 500 });
  }
}
