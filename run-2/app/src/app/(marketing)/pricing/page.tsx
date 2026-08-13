/**
 * `/pricing` — the whole ladder, with the meter explained in the same place it is
 * charged.
 *
 * AUTHORITY: D4's four price points as amended by `ARCHITECTURE.md` §16 Challenge 1
 * (included-filing allowances, $2.50 overage, capped with automatic upgrade),
 * `USER_JOURNEY.md` §11.4 ("the upgrade must be defensible as *cheaper for her*, or
 * it is a trap"), §11.6–§11.7 (cancellation, export, refunds, and the sentence for
 * a customer who wants a plan we do not sell), `CORRECTIONS.md` X-4 (no setup-fee
 * boast, no demo-and-quote framing).
 *
 * ===========================================================================
 * WHAT THIS PAGE MAY NOT CONTAIN, AND DOES NOT
 *
 * A quote form. A "contact sales". A call booking. An enterprise tier with the
 * price removed. A seat count. A setup fee. A discount that expires. A countdown. A
 * "most popular" badge that outweighs the tiers either side of it — the Crew card
 * carries a rule on its top edge and nothing else, which is a recommendation a
 * reader can disagree with rather than a nudge.
 *
 * Every figure is read from the `plans` table and computed by `assessUsage`, the
 * same function that produces the invoice. If the catalogue changes, this page
 * changes with it; if it does not, this page could not have been right by accident.
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { Comparison } from '../_components/comparison';
import { PriceCards } from '../_components/price-cards';
import { readLadder } from '../_lib/plans';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing — Ratepin',
  description:
    'One meter: the certified filing. Included-filing allowances with capped overage and ' +
    'automatic upgrade. No seats, no setup fee, no quote, no call.',
};

export default async function PricingPage(): Promise<React.ReactElement> {
  const db = await getDb();
  const ladder = await readLadder(db);
  const metered = ladder.tiers.filter((tier) => tier.overageCap !== null);

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-lp-hero">
        <p className="rp-lp-eyebrow">These are the prices</p>
        <h1>One meter: the certified filing</h1>
        <p className="rp-lp-hero__sub">
          No project caps. No worker caps. No seats. No setup fee. No annual commitment required —
          annual is billed at {String(ladder.tiers[0]?.annualMonthsBilled ?? 0)} months if you want
          it. Beyond the included count, overage is {ladder.tiers[0]?.overagePrice ?? '—'} per
          certified filing and it stops at the difference to the tier above, where the plan upgrades
          itself. There is no quote and no call, at any tier, including the top one.
        </p>
      </section>

      <section>
        <PriceCards ladder={ladder} />
      </section>

      {/* --------------------------------------------------------- THE METER -- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The meter, stated as arithmetic</p>
          <h2>Why the bill can never exceed the tier above</h2>
          <p className="rp-lp-lead">
            &ldquo;Capped at the next tier&rsquo;s price&rdquo; has exactly one honest reading. The
            overage stops at the <em>difference</em> to the tier above — the point at which staying
            put stops being cheaper than moving up — and at that point the upgrade happens by itself.
            Read the other way, a metered month could cost more than the plan that includes
            everything, which is the trap this cap exists to close.
          </p>
        </div>

        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Included filings, overage price, cap and the maximum possible monthly bill per tier.
            </caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col" className="rp-th--num">
                  Monthly
                </th>
                <th scope="col" className="rp-th--num">
                  Included filings
                </th>
                <th scope="col" className="rp-th--num">
                  Then per filing
                </th>
                <th scope="col" className="rp-th--num">
                  Overage stops at
                </th>
                <th scope="col" className="rp-th--num">
                  Filings past the allowance
                </th>
                <th scope="col" className="rp-th--num">
                  Most a month can cost
                </th>
                <th scope="col">Upgrades to</th>
              </tr>
            </thead>
            <tbody>
              {ladder.tiers.map((tier) => (
                <tr key={tier.id}>
                  <th scope="row">{tier.name}</th>
                  <td className="rp-td--num">{tier.monthly}</td>
                  <td className="rp-td--num">
                    {tier.includedFilings === null ? 'unlimited' : tier.includedFilings}
                  </td>
                  <td className="rp-td--num">{tier.overagePrice ?? '—'}</td>
                  <td className="rp-td--num">{tier.overageCap ?? '—'}</td>
                  <td className="rp-td--num">{tier.overageFilingsToCap ?? '—'}</td>
                  <td className="rp-td--num">{tier.maximumMonthly}</td>
                  <td>{tier.autoUpgradeTo ?? 'nothing — this is the top'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2 rp-lp-actions">
          <div className="rp-lp-card rp-lp-card--ruled">
            <p className="rp-lp-card__t">A DRAFT filing is never billed</p>
            <p className="rp-lp-card__b">
              The meter posts on certifiable artifacts only, and the exclusion is applied at the
              query rather than in a policy. If Ratepin could not resolve a line it did not finish
              the job, and charging for a document with no signature block on it would be charging
              for our own refusal. A DRAFT does not count against your included filings either.
            </p>
          </div>
          <div className="rp-lp-card rp-lp-card--ruled">
            <p className="rp-lp-card__t">Annual is a multiplication, not a percentage</p>
            <p className="rp-lp-card__b">
              Annual plans are billed at {String(ladder.tiers[0]?.annualMonthsBilled ?? 0)} months of
              the monthly price. That is a number you can check with the figure beside it, which is
              why it is stated that way rather than as a discount percentage you would have to trust.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">The Bid Sheet is buyable before an account exists</p>
            <p className="rp-lp-card__b">
              {ladder.rateCard.price}, once, no subscription and no sign-up first: every
              classification on one determination with the modification and publication date printed
              on the sheet. It is refundable in full for{' '}
              {String(ladder.rateCard.refundWindowDays)} days with no reason required, and the refund
              is a button.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">If you want a plan we do not sell</p>
            <p className="rp-lp-card__b">
              We sell four prices and they are all on this page. There is no quote, no call and no
              custom tier — including for us. Upgrades, downgrades and cancellation are buttons in
              the product, and cancelling exports your full artifact archive rather than holding it.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- CAVEATS ---- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <h2>What the price does not buy</h2>
        </div>
        <ul className="rp-lp-notlist">
          <li>
            It does not buy a human. No one reviews any output at any tier, and there is no support
            queue behind any price on this page.
          </li>
          <li>
            It does not buy an acceptance guarantee. The California eCPR is validated against the
            published schema by content hash and is <strong>generated, not acceptance-tested</strong>
            .
          </li>
          <li>
            It does not buy union CBA fringe schedules, Service Contract Act determinations, or any
            state format beyond California&rsquo;s eCPR.
          </li>
          <li>
            It does not buy a legal conclusion — about whether a determination is effective for your
            contract, whether a fringe credit is annualized or bona fide, or whether a classification
            is correct.
          </li>
        </ul>
        <p className="rp-legal">
          {metered.length > 0
            ? `Overage applies on ${metered.map((tier) => tier.name).join(' and ')} only; the top tier has no overage because it has no next tier.`
            : 'No tier currently carries an overage price.'}{' '}
          Prices are in US dollars and are charged by Stripe. Tax, where it applies, is added by
          Stripe at checkout.
        </p>
      </section>

      <section className="rp-lp-section">
        <Comparison />
      </section>

      <section className="rp-stack">
        <div className="rp-btn-row">
          <Link className="rp-btn rp-btn--primary" href="/wh347">
            Make a WH-347 first — free, no account
          </Link>
          <Link className="rp-btn" href="/status">
            Read the status page
          </Link>
        </div>
      </section>
    </div>
  );
}
