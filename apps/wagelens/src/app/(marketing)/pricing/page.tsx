import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { StatusPill } from '@/components/primitives';
import { getEnv } from '@/env';
import { plans } from '@/lib/plans';
import { formatAmount, priceIdFor } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

/**
 * `/pricing` — WL-09 owns this page and its trial-terms disclosure. What is
 * fixed here and must not regress:
 *
 *  - **no call to action calls the trial free** (WL-09 V16a). The rate lookup
 *    is free; the trial takes a card and charges on day 15, and saying
 *    otherwise is the kind of small lie that produces a chargeback;
 *  - **the GC Roll-up tier is published and not for sale** (finding B2). It has
 *    no plan key and no price variable, so there is nothing to click even by
 *    accident.
 */
export default function PricingPage() {
  const env = getEnv();

  return (
    <>
      <h1>Pricing</h1>
      <p className="wl-lead">
        The rate lookup is free forever, with no card and no login. What you pay for is the weekly
        form: the roster, the hours, the WH-347, the Statement of Compliance and the three-year
        archive.
      </p>

      <div className="wl-cols-2">
        <section className="wl-panel">
          <div className="wl-panel__body wl-stack-2">
            <h2>Rate Lookup</h2>
            <p className="wl-sm wl-muted">Anyone</p>
            <p className="wl-num" style={{ fontSize: 'var(--wl-text-2xl)', fontWeight: 700 }}>
              Free
            </p>
            <ul className="wl-xs wl-prose">
              <li>Every active federal determination, by state, county and construction type</li>
              <li>Every classification with its base rate and fringe</li>
              <li>The determination number, modification, date and SAM.gov link on every rate</li>
              <li>The modification picker — read the determination your contract locked</li>
            </ul>
            <p>
              <Link className="wl-btn wl-btn--secondary" href="/lookup">
                Look up a rate
              </Link>
            </p>
          </div>
        </section>

        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          return (
            <section className="wl-panel" key={plan.key}>
              <div className="wl-panel__body wl-stack-2">
                <h2>
                  {plan.name} {plan.popular ? <StatusPill tone="filed">Most chosen</StatusPill> : null}
                </h2>
                <p className="wl-sm wl-muted">{plan.tagline}</p>
                <p className="wl-num" style={{ fontSize: 'var(--wl-text-2xl)', fontWeight: 700 }}>
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
                    Your first two Fridays are free. Card on file, {formatAmount(plan.amountCents)}{' '}
                    charged on day {plan.trialDays + 1} unless you cancel first.
                  </p>
                ) : null}
                {configured ? (
                  <p>
                    <Link className="wl-btn wl-btn--primary" href={`/login?plan=${plan.key}`}>
                      Start 14-day trial
                    </Link>
                  </p>
                ) : (
                  <p className="wl-xs wl-muted">
                    Not on sale yet: <span className="wl-mono">{plan.priceEnvVar}</span> is not
                    configured.
                  </p>
                )}
              </div>
            </section>
          );
        })}

        <section className="wl-panel" data-testid="gc-waitlist">
          <div className="wl-panel__body wl-stack-2">
            <h2>GC Roll-up</h2>
            <p className="wl-sm wl-muted">Small general contractors carrying prime liability</p>
            <p className="wl-num" style={{ fontSize: 'var(--wl-text-2xl)', fontWeight: 700 }}>
              $299<span className="wl-xs wl-muted"> /month</span>
            </p>
            <StatusPill tone="draft">Coming — join the list</StatusPill>
            <ul className="wl-xs wl-prose">
              <li>It will add unlimited subcontractor seats</li>
              <li>It will collect and completeness-check every sub&rsquo;s weekly payroll</li>
              <li>It will show a per-sub status board and assemble the prime&rsquo;s package</li>
            </ul>
            <p className="wl-xs wl-muted">
              None of that exists yet, so none of it is for sale yet. Email{' '}
              <a href={`mailto:${env.SUPPORT_EMAIL}?subject=GC%20Roll-up`}>{env.SUPPORT_EMAIL}</a>{' '}
              and we will tell you when it ships.
            </p>
          </div>
        </section>
      </div>

      <StandingDisclaimer />
    </>
  );
}
