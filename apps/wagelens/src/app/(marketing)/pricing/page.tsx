import Link from 'next/link';

import { StandingDisclaimer } from '@/components/disclaimer';
import { GcComingCard } from '@/components/gc-card';
import { StatusPill } from '@/components/primitives';
import { getEnv } from '@/env';
import { pricingCtaAction, trackPricingViewed } from '@/lib/billing-actions';
import { lookupKeyFor } from '@/lib/billing/sellable';
import { formatCents, TRIAL_CTA_LABEL } from '@/lib/billing/terms';
import { plans } from '@/lib/plans';
import { priceIdFor } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

/**
 * `/pricing` — the ladder, and the two rules that are decisions rather than
 * copy:
 *
 *  - **no call to action calls the trial free** (WL-09 V16a). The rate lookup
 *    is free forever and takes no card; the trial takes a card and charges on
 *    day 15, and saying otherwise is the kind of small lie that produces a
 *    chargeback. Every paid CTA reads `Start 14-day trial`, and
 *    `tests/naming.test.ts` fails the build on the alternative.
 *  - **the GC Roll-up tier is published and not for sale** (finding B2). It has
 *    no plan key and no price variable, so there is nothing to click even by
 *    accident; the card's only control joins a waitlist.
 *
 * The amount is rendered with `formatCents`, which always prints two decimals.
 * "$99" and "$99.00" are the same number and not the same disclosure.
 */
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const source = typeof params['source'] === 'string' ? params['source'] : 'direct';
  await trackPricingViewed(source);

  const gcState =
    params['gc'] === 'joined' ? 'joined' : params['gc'] === 'refused' ? 'refused' : undefined;

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
              <li>An email when a determination you name is modified</li>
            </ul>
            <p className="wl-xs wl-muted">Free. No card, no login, no demo call.</p>
            <p>
              <Link className="wl-btn wl-btn--secondary" href="/lookup">
                Look up a rate
              </Link>
            </p>
          </div>
        </section>

        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          const lookupKey = lookupKeyFor(plan);
          return (
            <section className="wl-panel" key={plan.key}>
              <div className="wl-panel__body wl-stack-2">
                <h2>
                  {plan.name} {plan.popular ? <StatusPill tone="filed">Most chosen</StatusPill> : null}
                </h2>
                <p className="wl-sm wl-muted">{plan.tagline}</p>
                <p className="wl-num" style={{ fontSize: 'var(--wl-text-2xl)', fontWeight: 700 }}>
                  {formatCents(plan.amountCents, plan.currency)}
                  <span className="wl-xs wl-muted"> /{plan.interval}</span>
                </p>
                <ul className="wl-xs wl-prose">
                  {(plan.features ?? []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.trialDays ? (
                  <p className="wl-xs wl-muted">
                    {plan.trialDays} days, then {formatCents(plan.amountCents, plan.currency)} a{' '}
                    {plan.interval} until you cancel. Card on file; the first charge is on day{' '}
                    {plan.trialDays + 1} and we email you four days before it.
                  </p>
                ) : null}
                {configured ? (
                  <form action={pricingCtaAction}>
                    <input type="hidden" name="lookupKey" value={lookupKey} />
                    <button
                      className="wl-btn wl-btn--primary"
                      type="submit"
                      data-testid={`pricing-cta-${plan.key}`}
                    >
                      {TRIAL_CTA_LABEL}
                    </button>
                  </form>
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

        {/* Published, not for sale. The card's only control is the waitlist;
            there is no plan key and no price variable behind it. */}
        <GcComingCard surface="pricing" waitlist {...(gcState ? { state: gcState } : {})} />
      </div>

      <StandingDisclaimer />
    </>
  );
}
