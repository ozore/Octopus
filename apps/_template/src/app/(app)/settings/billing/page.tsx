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
    <main>
      <h1>Billing</h1>

      {params['checkout'] === 'success' ? (
        <p className="notice" data-testid="checkout-success">
          Payment received. Stripe emails the receipt; your plan is below.
        </p>
      ) : null}
      {params['checkout'] === 'cancelled' ? <p className="notice">Checkout cancelled — nothing was charged.</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="card" data-testid="current-plan">
        <h2 style={{ marginTop: 0 }}>Current plan</h2>
        <p>
          <strong data-testid="plan-name">{entitlement.planName}</strong>{' '}
          <span className="badge">{entitlement.status}</span>
        </p>
        <ul className="small muted">
          {Object.entries(entitlement.limits).map(([key, value]) => (
            <li key={key}>
              {key}: {typeof value === 'number' && value < 0 ? 'unlimited' : String(value)}
            </li>
          ))}
        </ul>
        {entitlement.currentPeriodEnd ? (
          <p className="small">
            {entitlement.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
            {entitlement.currentPeriodEnd.toISOString().slice(0, 10)}
          </p>
        ) : null}

        {entitlement.stripeCustomerId ? (
          <form action={openPortalAction}>
            <button className="button secondary" type="submit" disabled={!isOwner}>
              Manage billing in Stripe
            </button>
          </form>
        ) : null}
      </section>

      <h2>Plans</h2>
      <div className="grid">
        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          const current = entitlement.planKey === plan.key;
          return (
            <section className="card" key={plan.key}>
              <h3 style={{ marginTop: 0 }}>{plan.name}</h3>
              <p className="small muted">{plan.tagline}</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {formatAmount(plan.amountCents, plan.currency)}
                <span className="small muted"> /{plan.interval}</span>
              </p>
              {plan.trialDays ? <p className="small">{plan.trialDays}-day free trial</p> : null}
              {current ? (
                <p className="badge">Current plan</p>
              ) : configured ? (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="planKey" value={plan.key} />
                  <button
                    className="button"
                    type="submit"
                    disabled={!isOwner}
                    data-testid={`checkout-${plan.key}`}
                  >
                    {entitlement.active ? `Switch to ${plan.name}` : `Start ${plan.name}`}
                  </button>
                </form>
              ) : (
                <p className="small muted">
                  Not configured: <code>{plan.priceEnvVar}</code>
                </p>
              )}
            </section>
          );
        })}
      </div>

      {!isOwner ? <p className="small muted">Only an owner can change billing.</p> : null}
      <p className="disclaimer">
        Payments are processed by Stripe. We never see or store your card number.
      </p>
    </main>
  );
}
