/**
 * POST /api/stripe/webhook — the ONLY writer of entitlement.
 *
 * The RAW body is what Stripe signs, so it is read as text and never parsed
 * before verification. Everything else is in `lib/billing/webhook.ts`, so the
 * mock Checkout page runs the same code with the same signed payload.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { handleStateReadyWebhook } from '@/lib/billing/webhook';
import { getAdapters, WebhookVerificationError } from '@octopus/platform/adapters';
import { getDb } from '@octopus/platform/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('missing stripe-signature', { status: 400 });

  const raw = await request.text();
  try {
    const result = await handleStateReadyWebhook(
      { db: await getDb(), adapters: getAdapters(), env: getEnv() },
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
    console.error('[stateready] stripe webhook failed', error);
    return new Response('handler error', { status: 500 });
  }
}
