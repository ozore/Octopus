import Link from 'next/link';

import { getEnv } from '@/env';
import { ENTERPRISE_QUOTE_PROMISE } from '@/lib/billing/enterprise';
import { ONE_OFF_SKUS } from '@/lib/billing/prices';
import { ENTRY_PACK_GUARANTEE } from '@/lib/guarantees';
import { ENTERPRISE_STATE_THRESHOLD, plans, TRIAL_COHORT_CAP, TRIAL_DAYS } from '@/lib/plans';
import { formatAmount } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

/**
 * `/pricing` — built from the plan map, which is built from `specs/09`'s
 * canonical table. Nothing on this page is typed twice.
 *
 * THREE THINGS THIS PAGE REFUSES TO DO:
 *
 *  1. **Invent an Enterprise price.** Above {ENTERPRISE_STATE_THRESHOLD} states
 *     the row says "contact us" and carries the one number we control — a quote
 *     within two business days. Three of this buyer's alternatives are
 *     quote-gated with no published price at all; being the one that says "here
 *     are three prices, and above them you have to ask" is still the most
 *     transparent card in the category.
 *  2. **Print a feature nobody has agreed to build.** The "contains" lists come
 *     from the plan map, and the rule from round 2 of the review (N2) is that a
 *     feature may appear only if it has a Must or a Should with a number.
 *  3. **Paraphrase a guarantee.** The Entry Pack Guarantee is carried VERBATIM
 *     here, as it is on `/legal/refunds` and on the pack's first page; a
 *     paraphrase is a different guarantee (`OFFER.md` §5.1, `specs/12` AC8).
 */
export default function PricingPage() {
  const env = getEnv();
  const monthly = plans.plans.filter((p) => p.interval === 'month');
  const annual = plans.plans.filter((p) => p.interval === 'year');

  return (
    <main>
      <h1>Pricing</h1>
      <p className="muted">
        Priced on <strong>states</strong>, because a state and trade is a rulebook we maintain and
        &ldquo;we&rsquo;re in seven states&rdquo; is the sentence you already use. Technicians are a fair-use
        band, not a per-seat charge: a sixty-technician shop in one state has one rulebook and should not
        pay like a multi-state one.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: 16 }}>
        {monthly.map((plan) => {
          const yearly = annual.find((p) => p.key === `${plan.key}_annual` || p.key.startsWith(plan.key));
          return (
            <section className="card" key={plan.key} data-testid={`plan-${plan.key}`}>
              <h2 style={{ marginTop: 0 }}>
                {plan.name} {plan.popular ? <span className="badge">Most chosen</span> : null}
              </h2>
              <p className="muted small">{plan.tagline}</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>
                {formatAmount(plan.amountCents, plan.currency)}
                <span className="small muted"> /month</span>
              </p>
              {yearly ? (
                <p className="small muted" data-testid={`annual-${plan.key}`}>
                  or {formatAmount(yearly.amountCents, yearly.currency)} a year — two months free
                </p>
              ) : null}
              <ul className="small">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className="button" href="/login">
                Start the free trial
              </Link>
            </section>
          );
        })}

        <section className="card" data-testid="plan-enterprise">
          <h2 style={{ marginTop: 0 }}>Enterprise</h2>
          <p className="muted small">Over {ENTERPRISE_STATE_THRESHOLD} states, or unlimited</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>Contact us</p>
          <p className="small">
            We publish three prices and no fourth. Above {ENTERPRISE_STATE_THRESHOLD} states we have no
            honest basis for a number, so we quote — and the one number on this row is one we control:{' '}
            {ENTERPRISE_QUOTE_PROMISE}.
          </p>
          <p className="small muted">There is no self-serve path here, and we would rather say so.</p>
          <Link className="button secondary" href="/login">
            Sign in and ask for a quote
          </Link>
        </section>
      </div>

      <h2>What happens after the trial</h2>
      <p>
        The trial is <strong>{TRIAL_DAYS} days, no credit card</strong>, for the first {TRIAL_COHORT_CAP}{' '}
        signups. On day {TRIAL_DAYS} the account becomes <strong>read-only</strong>: every licence, date,
        citation and document stays exactly where it is and the export keeps working. What pauses is new
        entries and the renewal alerts — and we tell you they are paused rather than going quiet.
      </p>

      <h2>State Entry Packs</h2>
      <p className="muted">
        One state and one trade, as a cited document plus the same data loaded into your account. Every
        requirement the state&rsquo;s board publishes, each with the page it came from and the day we
        checked it — and, on the first page, every requirement it does not publish.
      </p>
      <table data-testid="entry-pack-prices">
        <thead>
          <tr>
            <th>Pack</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your first state</td>
            <td className="mono">{formatAmount(ONE_OFF_SKUS.entry_pack_first.amountCents)}</td>
          </tr>
          <tr>
            <td>Each state and trade after that</td>
            <td className="mono">{formatAmount(ONE_OFF_SKUS.entry_pack.amountCents)}</td>
          </tr>
          <tr>
            <td>Acquisition Readiness Pack — up to three states</td>
            <td className="mono">{formatAmount(ONE_OFF_SKUS.acq_pack_3.amountCents)}</td>
          </tr>
          <tr>
            <td>Each additional state in a bundle</td>
            <td className="mono">{formatAmount(ONE_OFF_SKUS.entry_pack_additional.amountCents)}</td>
          </tr>
        </tbody>
      </table>
      <p className="small">
        <strong>Why the first one is {formatAmount(ONE_OFF_SKUS.entry_pack_first.amountCents)}.</strong> The
        first state you buy is a state whose rulebook we then maintain for every customer after you. You are
        paying for the research; we are keeping the asset. That is worth half the fee to us, and we would
        rather say so than pretend it is a launch discount. The full{' '}
        {formatAmount(ONE_OFF_SKUS.entry_pack_first.amountCents)} credits against an annual plan taken within
        90 days — one credit per customer, and the larger one if you buy more than one pack.
      </p>
      <p className="small" data-testid="entry-pack-guarantee">
        {ENTRY_PACK_GUARANTEE}
      </p>

      <p className="disclaimer">
        Prices in USD, excluding any tax we are required to collect. {env.APP_NAME}, a {env.COMPANY_NAME}{' '}
        company. <Link href="/legal/refunds">Refunds and guarantees</Link>.
      </p>
    </main>
  );
}
