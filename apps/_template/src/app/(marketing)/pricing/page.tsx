import Link from 'next/link';

import { getEnv } from '@/env';
import { plans } from '@/lib/plans';
import { formatAmount, priceIdFor } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  const env = getEnv();

  return (
    <main>
      <h1>Pricing</h1>
      <p className="muted">
        Every plan bills through Stripe. Cancel from the billing portal at any time; you keep access
        to the end of the period you paid for.
      </p>

      <div className="grid">
        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          return (
            <section className="card" key={plan.key}>
              <h2 style={{ marginTop: 0 }}>
                {plan.name} {plan.popular ? <span className="badge">Most chosen</span> : null}
              </h2>
              <p className="muted">{plan.tagline}</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>
                {formatAmount(plan.amountCents, plan.currency)}
                <span className="small muted"> /{plan.interval}</span>
              </p>
              {plan.trialDays ? <p className="small">{plan.trialDays}-day free trial.</p> : null}
              <ul className="small">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {configured ? (
                <Link className="button" href={`/settings/billing?plan=${plan.key}`}>
                  Choose {plan.name}
                </Link>
              ) : (
                <p className="small muted">
                  Not yet available — <code>{plan.priceEnvVar}</code> is not configured.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <h2>Free while you try it</h2>
      <p className="small muted">
        {Object.entries(plans.freeLimits)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(' · ')}
      </p>

      <p className="disclaimer">
        Prices in USD, excluding any tax we are required to collect. {env.APP_NAME}, a{' '}
        {env.COMPANY_NAME} company.
      </p>
    </main>
  );
}
