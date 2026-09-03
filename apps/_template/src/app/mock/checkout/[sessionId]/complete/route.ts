/**
 * POST /mock/checkout/{id}/complete — the mock Checkout's "pay" button.
 *
 * It does NOT shortcut entitlement. It builds the exact
 * `checkout.session.completed` payload Stripe would send, signs it with the
 * mock adapter's HMAC, and runs it through the REAL webhook handler. That is
 * what makes the e2e journey evidence about the production path rather than
 * about a test fixture.
 */
import '@/lib/platform';

import { notFound, redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { plans } from '@/lib/plans';
import { getAdapters, isMockBilling } from '@octopus/platform/adapters';
import { handleBillingWebhook } from '@octopus/platform/billing';
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

  const event = billing.completedCheckoutEvent(sessionId);
  const { payload, signature } = billing.signed(event);
  const db = await getDb();

  await handleBillingWebhook({ db, adapters, plans, env }, payload, signature);

  redirect(session.request.successUrl);
}
