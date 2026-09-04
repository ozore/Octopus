/**
 * POST /mock/checkout/{id}/complete — the mock Checkout's "pay" button.
 *
 * It does NOT shortcut entitlement. It builds the exact payload Stripe would
 * send — a `mode=subscription` session for a plan, a `mode=payment` one for a
 * State Entry Pack — signs it with the mock adapter's HMAC, and runs it through
 * the REAL handler. That is what makes the e2e journey evidence about the
 * production path rather than about a test fixture.
 */
import '@/lib/platform';

import { notFound, redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { handleStateReadyWebhook } from '@/lib/billing/webhook';
import { getAdapters, isMockBilling } from '@octopus/platform/adapters';
import { getDb } from '@octopus/platform/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const env = getEnv();
  if (env.ADAPTER_MODE !== 'mock') notFound();

  const { sessionId } = await context.params;
  const adapters = getAdapters();
  const billing = adapters.billing;
  if (!isMockBilling(billing)) notFound();

  const session = billing.sessions.get(sessionId);
  if (!session) notFound();

  // A one-off is `mode=payment` and has no subscription, so the adapter's
  // subscription event is the wrong shape for it (`specs/09` rows 7–10).
  const oneOff = session.request.metadata?.['kind'] === 'one_off';
  const event = oneOff
    ? {
        id: `evt_test_${sessionId}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            object: 'checkout.session',
            mode: 'payment',
            status: 'complete',
            client_reference_id: session.request.orgId,
            customer: session.request.customerId ?? `cus_test_${sessionId.slice(-6)}`,
            payment_intent: `pi_test_${sessionId.slice(-6)}`,
            metadata: { org_id: session.request.orgId, ...(session.request.metadata ?? {}) },
          },
        },
      }
    : billing.completedCheckoutEvent(sessionId);

  const { payload, signature } = billing.signed(event);
  await handleStateReadyWebhook({ db: await getDb(), adapters, env }, payload, signature);

  redirect(session.request.successUrl);
}
