/**
 * The hosted-checkout handoff, standing in for Stripe when `ADAPTER_MODE=mock`.
 *
 * Spec: ARCHITECTURE.md §3.5, ADR-007.
 *
 * WHY THIS PAGE EXISTS AT ALL. In `live` mode `startCheckout` redirects straight
 * to the session URL Stripe returned and this route is never reached: hosted
 * Checkout, no card data on our infrastructure, PCI scope SAQ-A. In `mock` mode
 * the adapter returns a `checkout.stripe.test` URL that resolves to nothing, so
 * the handoff would dead-end. Rather than special-casing the *action* — which
 * would mean the mock path exercised a different code path from the real one —
 * the action always calls the adapter, and this page shows the session that came
 * back and lets a developer continue.
 *
 * IT IS LABELLED, LOUDLY. A stand-in that looked like a real payment screen
 * would be the same defect class as C-1: a surface implying something the system
 * does not do. It renders only outside production, and `startCheckout` is the
 * only thing that links here.
 */

import { notFound } from 'next/navigation';

import { getCase } from '@/app/_lib/case-store';
import { adapterMode } from '@/app/_lib/runtime-env';
import { StatusPill } from '@/components/StatusPill';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Checkout handoff — Clausewright' };

export default async function CheckoutHandoffPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const sessionId = typeof query.session === 'string' ? query.session : '';

  const record = getCase(caseId);
  if (!record) notFound();
  // In live mode nobody arrives here; if they do, it is not a page to serve.
  if (adapterMode() === 'live') notFound();

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Development build</span>
        <h1 className="cw-screen__title">Stripe hosted Checkout would open here</h1>
        <p className="cw-screen__lede">
          The billing adapter created a real checkout session; there is no Stripe to redirect to in
          mock mode. In a live deploy this page does not exist — the seller goes straight to
          Stripe&rsquo;s own hosted page, and no card details ever reach us.
        </p>
      </div>

      <section className="cw-card cw-mat-0" aria-labelledby="session-title">
        <div className="cw-card__header">
          <h2 className="cw-card__title" id="session-title">
            The session the adapter returned
          </h2>
          <StatusPill tone="caution">Mock adapter</StatusPill>
        </div>
        <div className="cw-card__body">
          <dl className="cw-facts">
            <div className="cw-facts__row">
              <dt className="cw-facts__k">Checkout session</dt>
              <dd className="cw-facts__v cw-facts__v--code">{sessionId || '(none)'}</dd>
            </div>
            <div className="cw-facts__row">
              <dt className="cw-facts__k">Case</dt>
              <dd className="cw-facts__v cw-facts__v--code">{caseId}</dd>
            </div>
          </dl>
          <p className="cw-note">
            In production, payment is unlocked by the <code>checkout.session.completed</code>{' '}
            webhook and not by this redirect — Stripe retries, and the handler is idempotent on the
            event id. Following the link below records the return only.
          </p>
          <div className="cw-actions">
            <a
              className="cw-btn cw-btn--secondary"
              href={`/case/${caseId}/plan?session=${encodeURIComponent(sessionId)}`}
            >
              <span className="cw-btn__label">Continue as if payment completed</span>
            </a>
            <a className="cw-btn cw-btn--quiet cw-btn--sm" href={`/appeal/${caseId}`}>
              <span className="cw-btn__label">Back to the preview</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
