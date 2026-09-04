import Link from 'next/link';

import { Panel, StatusPill } from '@/components/primitives';
import { formatDay } from '@/components/provenance';
import { getEnv } from '@/env';
import { openPortalAction, startCheckoutAction } from '@/lib/actions';
import { plans } from '@/lib/plans';
import { formatAmount, priceIdFor } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  unknown_plan: 'That plan does not exist.',
  price_not_configured: 'That plan is not on sale yet — its Stripe price is not configured.',
  no_customer: 'Nothing to manage yet: this organisation has never subscribed.',
};

/**
 * WL-09 owns the checkout surface, including the trial-terms disclosure and the
 * consent record that must be written before the card field is rendered
 * (finding B9), and the GC Roll-up waitlist card (finding B2). This page is the
 * platform's billing screen, themed — enough to prove the money path end to end
 * and no more.
 *
 * No control on it calls the trial free, here or anywhere else in the app: the
 * lookup is free, the trial takes a card, and WL-09 V16a makes the distinction
 * a build failure rather than a style note.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { entitlement, membership } = await requireOrg();
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;
  const isOwner = membership.role === 'owner';

  return (
    <>
      <h1>Billing</h1>

      {params['checkout'] === 'success' ? (
        <div className="wl-alert wl-alert--success" role="status" data-testid="checkout-success">
          <div>
            <p className="wl-alert__title">Payment method on file.</p>
            <p className="wl-alert__body">Stripe emails the receipt; your plan is below.</p>
          </div>
        </div>
      ) : null}
      {params['checkout'] === 'cancelled' ? (
        <div className="wl-alert wl-alert--info" role="status">
          <div>
            <p className="wl-alert__title">Checkout cancelled — nothing was charged.</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="wl-alert wl-alert--error" role="alert">
          <div>
            <p className="wl-alert__title">{error}</p>
          </div>
        </div>
      ) : null}

      <Panel title="Current plan">
        <p className="wl-row">
          <strong data-testid="plan-name">{entitlement.planName}</strong>
          <StatusPill tone={entitlement.active ? 'filed' : 'none'}>{entitlement.status}</StatusPill>
        </p>
        <ul className="wl-xs wl-muted wl-prose">
          {Object.entries(entitlement.limits).map(([key, value]) => (
            <li key={key}>
              {key}: {typeof value === 'number' && value < 0 ? 'unlimited' : String(value)}
            </li>
          ))}
        </ul>
        {entitlement.currentPeriodEnd ? (
          <p className="wl-sm">
            {entitlement.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
            {formatDay(entitlement.currentPeriodEnd)}
          </p>
        ) : null}
        {entitlement.stripeCustomerId ? (
          <form action={openPortalAction}>
            <button className="wl-btn wl-btn--secondary" type="submit" disabled={!isOwner}>
              Manage billing in Stripe
            </button>
          </form>
        ) : null}
      </Panel>

      <h2>Plans</h2>
      <div className="wl-cols-2">
        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          const current = entitlement.planKey === plan.key;
          return (
            <section className="wl-panel" key={plan.key}>
              <div className="wl-panel__body wl-stack-2">
                <h3>{plan.name}</h3>
                <p className="wl-sm wl-muted">{plan.tagline}</p>
                <p className="wl-num" style={{ fontSize: 'var(--wl-text-xl)', fontWeight: 700 }}>
                  {formatAmount(plan.amountCents, plan.currency)}
                  <span className="wl-xs wl-muted"> /{plan.interval}</span>
                </p>
                <ul className="wl-xs wl-prose">
                  {(plan.features ?? []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.trialDays ? (
                  <p className="wl-xs wl-muted">
                    {plan.trialDays}-day trial. Card on file; charged on day {plan.trialDays + 1}{' '}
                    unless you cancel before then.
                  </p>
                ) : null}
                {current ? (
                  <StatusPill tone="filed">Current plan</StatusPill>
                ) : configured ? (
                  <form action={startCheckoutAction}>
                    <input type="hidden" name="planKey" value={plan.key} />
                    <button
                      className="wl-btn wl-btn--primary"
                      type="submit"
                      disabled={!isOwner}
                      data-testid={`checkout-${plan.key}`}
                    >
                      {entitlement.active ? `Switch to ${plan.name}` : `Start 14-day trial`}
                    </button>
                  </form>
                ) : (
                  <p className="wl-xs wl-muted">
                    Not configured: <span className="wl-mono">{plan.priceEnvVar}</span>
                  </p>
                )}
              </div>
            </section>
          );
        })}

        {/* The GC Roll-up tier is published and NOT FOR SALE until WL-24 ships
            (finding B2). There is no plan key, no price variable and therefore
            no purchase control that could be added by accident. */}
        <section className="wl-panel" data-testid="gc-waitlist">
          <div className="wl-panel__body wl-stack-2">
            <h3>GC Roll-up</h3>
            <p className="wl-sm wl-muted">Small general contractors carrying prime liability for subs</p>
            <p className="wl-num" style={{ fontSize: 'var(--wl-text-xl)', fontWeight: 700 }}>
              $299<span className="wl-xs wl-muted"> /month</span>
            </p>
            <StatusPill tone="draft">Coming — join the list</StatusPill>
            <p className="wl-xs wl-muted">
              Not yet available. When it ships it will add subcontractor seats, weekly collection and
              completeness checking of every sub&rsquo;s certified payroll, and a per-sub status
              board. Nothing here can be purchased today.
            </p>
          </div>
        </section>
      </div>

      {!isOwner ? <p className="wl-xs wl-muted">Only an owner can change billing.</p> : null}
      <p className="wl-disclaimer">
        Payments are processed by Stripe. We never see or store your card number.{' '}
        <Link href="/legal/terms">Terms</Link>.
      </p>
    </>
  );
}
