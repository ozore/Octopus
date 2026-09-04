import { notFound } from 'next/navigation';

import { getEnv } from '@/env';
import { getAdapters, isMockBilling } from '@octopus/platform/adapters';

export const dynamic = 'force-dynamic';

/**
 * THE LOCAL STAND-IN FOR STRIPE'S HOSTED CHECKOUT.
 *
 * It exists so the end-to-end journey — sign up, subscribe, see the entitlement
 * — can run with no network and no Stripe account, which is the same guarantee
 * the unit suite makes. It is reachable only when `ADAPTER_MODE=mock`, and
 * `env.ts` refuses that mode in production, so this page cannot exist on a real
 * deploy. Delete nothing when scaffolding: the e2e journey depends on it.
 */
export default async function MockCheckoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const env = getEnv();
  if (env.ADAPTER_MODE !== 'mock') notFound();

  const { sessionId } = await params;
  const billing = getAdapters().billing;
  if (!isMockBilling(billing)) notFound();

  const session = billing.sessions.get(sessionId);
  if (!session) notFound();

  return (
    <main className="narrow">
      <p className="badge">Mock Stripe Checkout · no money moves</p>
      <h1>Confirm subscription</h1>
      <p className="muted">
        Plan <strong>{session.request.planKey}</strong> · price{' '}
        <code>{session.request.priceId}</code>
        {session.request.trialDays ? ` · ${session.request.trialDays}-day trial` : ''}
      </p>
      <form action={`/mock/checkout/${sessionId}/complete`} method="post">
        <button className="button" type="submit" data-testid="mock-pay">
          Pay and subscribe
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 24 }}>
        Submitting signs the same <code>checkout.session.completed</code> payload Stripe would send
        and posts it through the real webhook handler — the redirect grants nothing on its own.
      </p>
    </main>
  );
}
