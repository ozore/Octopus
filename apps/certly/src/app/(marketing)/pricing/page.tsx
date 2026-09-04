import Link from 'next/link';

import { getEnv } from '@/env';
import { METER_SENTENCE, plans, TRIAL_DAYS, TRIAL_DISCLOSURE } from '@/lib/plans';
import { formatDate } from '@/lib/engine';
import { formatAmount, priceIdFor } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

function firstChargeDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + TRIAL_DAYS);
  return formatDate(date.toISOString().slice(0, 10));
}

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
              {plan.trialDays ? (
                <p className="c-small" data-testid={`trial-disclosure-${plan.key}`}>
                  {TRIAL_DISCLOSURE(firstChargeDate())}
                </p>
              ) : null}
              <ul className="small">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {configured ? (
                <Link className="c-btn c-btn--primary" href={`/settings/billing?plan=${plan.key}`}>
                  Start 14-day trial
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

      <h2>Before you subscribe</h2>
      <p className="c-small c-muted">
        Onboarding is un-gated up to and including your first compared certificate:{' '}
        {Object.entries(plans.freeLimits)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(' · ')}
        . Reminders stay off until a card exists, because nothing is sent on your behalf before then.
      </p>
      <h2>What a tracked vendor is</h2>
      <p className="c-small c-muted" data-testid="meter-sentence">
        {METER_SENTENCE}
      </p>

      <p className="disclaimer">
        Prices in USD, excluding any tax we are required to collect. {env.APP_NAME}, a{' '}
        {env.COMPANY_NAME} company.
      </p>
    </main>
  );
}
