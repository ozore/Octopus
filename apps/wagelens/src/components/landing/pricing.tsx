/**
 * §7 — THE PRICING BLOCK (LANDING_SPEC §8, OFFER.md §6).
 *
 * Below the fold, and outside the 450-word budget, because a man doing
 * arithmetic reads differently from a man deciding whether to keep reading.
 *
 * FOUR THINGS HERE ARE DECISIONS, NOT LAYOUT:
 *
 * 1. **No call to action that leads to a card calls the trial free** (finding
 *    B9, `specs/WL-09` V16a). Every paid button reads `Start 14-day trial`,
 *    and the terms — the amount, the day, the two-click cancel — sit ABOVE the
 *    buttons rather than under the table the visitor has already scrolled past.
 * 2. **The GC Roll-up card is a waitlist and contains no purchase control**
 *    (finding B2). It has no plan key and no price variable in `lib/plans.ts`,
 *    so there is nothing for Checkout to sell even by accident; its bullets are
 *    in the future tense because none of what they name exists yet.
 * 3. **The comparison table does not always win.** The honesty clause is not
 *    optional: at one job a year two competitors and a spreadsheet all beat us,
 *    and a table that never loses is not believed by a man who has been quoted
 *    by four vendors.
 * 4. **G1 and G3 ship verbatim from `OFFER.md` §5.2. G2 does not ship at all**
 *    until the founder and counsel sign its wording, and no refund sentence
 *    appears anywhere on this page without its cap in the same sentence
 *    (finding B8). There is no refund sentence on this page.
 */

import Link from 'next/link';

import { plans } from '@/lib/plans';

/** The ladder's annual prices (`OFFER.md` §6.1 — two months free). The monthly
 *  figures come from the plan map, which is what Checkout actually charges. */
const ANNUAL: Record<string, string> = { crew: '$790/yr', shop: '$990/yr' };

const COMPARISON: Array<[string, string, string, string, string]> = [
  ['By hand (Excel + the DOL’s free WH-347)', '$0 + 190.7 hours', '—', 'no', 'no'],
  ['CertifiedPayrollPro Starter ($49 + $5/report)', '$1,628', 'yes', 'not listed', 'not listed'],
  ['CertifiedPayrollPro Pro ($99 + $3/report)', '$1,812', 'yes', 'not listed', 'not listed'],
  ['LCPcertified Plus, 5 active projects', '$1,740', '—', 'no', 'no'],
  ['LCPcertified per report ($12)', '$2,496', 'yes', 'no', 'no'],
  ['Points North', 'price not published', 'reported yes', 'no', 'no'],
  ['eBacon · Elation · eMars · Foundation', 'price not published', '—', 'no', 'no'],
];

function money(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

export function PricingBlock({ supportEmail }: { supportEmail: string }) {
  return (
    <section
      className="wl-land__section"
      id="pricing"
      data-testid="landing-pricing"
      data-wl-view="pricing_viewed"
      data-wl-prop-source="landing"
    >
      <h2>Know the rate. File the form. Go home.</h2>
      <p className="wl-land__lede">
        Published in full. No demo call, no setup fee, no per-report charge.
      </p>

      {/* B9: the terms belong where the button is. */}
      <p className="wl-land__trial" data-testid="trial-terms">
        Your first two Fridays are free. Card on file, $99 charged on day 15, cancel in two clicks
        before then and you pay nothing.
      </p>

      <div className="wl-land__prices">
        <article className="wl-land__price" data-testid="price-lookup">
          <h3>Rate Lookup</h3>
          <p className="wl-land__amount">Free</p>
          <p className="wl-land__note">Anyone · no card, no login</p>
          <ul>
            <li>Every active federal determination</li>
            <li>Every classification, rate and fringe</li>
            <li>Determination, modification, date, link</li>
            <li>Read the modification you locked</li>
          </ul>
          <p>
            <Link className="wl-btn wl-btn--secondary" href="/lookup">
              Look up a rate
            </Link>
          </p>
        </article>

        {plans.plans.map((plan) => (
          <article
            className={
              plan.popular ? 'wl-land__price wl-land__price--recommended' : 'wl-land__price'
            }
            key={plan.key}
            data-testid={`price-${plan.key}`}
          >
            <h3>
              {plan.name}
              {plan.popular ? ' · recommended' : ''}
            </h3>
            <p className="wl-land__amount">
              {money(plan.amountCents)}
              <span className="wl-land__note"> /month</span>
            </p>
            <p className="wl-land__note">
              {ANNUAL[plan.key]} · {plan.tagline}
            </p>
            <ul>
              {(plan.features ?? []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p>
              <Link
                className={plan.popular ? 'wl-btn wl-btn--primary' : 'wl-btn wl-btn--secondary'}
                href={`/login?plan=${plan.key}`}
                data-testid={`pricing-cta-${plan.key}`}
                data-wl-click="pricing_cta_clicked"
                data-wl-prop-tier={plan.key}
                data-wl-prop-interval="month"
              >
                Start 14-day trial
              </Link>
            </p>
          </article>
        ))}

        {/* Published, and not for sale. There is no plan key behind this card. */}
        <article className="wl-land__price" data-testid="gc-waitlist">
          <h3>GC Roll-up</h3>
          <p className="wl-land__amount">
            $299<span className="wl-land__note"> /month</span>
          </p>
          <p className="wl-land__note">$2,990/yr · coming · small GCs carrying prime liability</p>
          <ul>
            <li>It will add unlimited sub seats</li>
            <li>It will collect every sub&rsquo;s payroll</li>
            <li>It will check every week for gaps</li>
            <li>It will assemble the prime&rsquo;s package</li>
          </ul>
          <p>
            <a
              className="wl-btn wl-btn--ghost"
              href={`mailto:${supportEmail}?subject=GC%20Roll-up`}
              data-testid="gc-join-the-list"
              data-wl-click="gc_tier_interest"
              data-wl-prop-plan="gc"
              data-wl-prop-surface="landing"
            >
              Join the list
            </a>
          </p>
          <p className="wl-land__note">
            None of that exists yet, so none of it is for sale yet.
          </p>
        </article>
      </div>

      <div
        className="wl-table-wrap wl-scroll-x"
        data-wl-view="comparison_table_viewed"
        data-testid="comparison-table"
      >
        <table className="wl-table">
          <caption>
            A sub with four active covered projects filing weekly — 208 forms a year. Competitor
            prices fetched 2026-09-03.
          </caption>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">Year-one cash</th>
              <th scope="col">Per-report meter</th>
              <th scope="col">Rate lookup</th>
              <th scope="col">Change alerts</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row[0]}>
                <th scope="row">{row[0]}</th>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
                <td>{row[4]}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Shop, here</th>
              <td>$990 annual / $1,188 monthly</td>
              <td>no</td>
              <td>yes</td>
              <td>yes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="wl-land__note" data-testid="honesty-clause">
        If you run one job at a time, LCPcertified&rsquo;s $12 a report and
        CertifiedPayrollPro&rsquo;s Starter plan can both come in under us — and doing it by hand
        costs no cash at all.
      </p>

      <p className="wl-land__lede">
        The person who does this on Friday afternoon is the one who has to trust it.
      </p>

      {/* OFFER.md §5.2 G1 and G3, verbatim. */}
      <div className="wl-land__trial" data-testid="guarantees">
        <p>
          <strong>The Friday guarantee.</strong> “Enter your hours by Friday and your WH-347 and
          Statement of Compliance are ready the same day. If they are not, that month is free.”
        </p>
        <p>
          <strong>The exit guarantee.</strong> “Cancel inside the product in two clicks. No call, no
          email, no retention offer. Your archive stays downloadable for 30 days after you leave.”
        </p>
      </div>
    </section>
  );
}
