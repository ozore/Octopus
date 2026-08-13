/**
 * THE PRICE LADDER, RENDERED. Five cards, one meter, no badge that outweighs a
 * tier, no strikethrough and no scarcity device.
 *
 * AUTHORITY: `identity/landing/index.html` §PRICE (ported), D4 as amended by
 * `ARCHITECTURE.md` §16 Challenge 1, `USER_JOURNEY.md` §11.4 and §11.7,
 * `DESIGN_SYSTEM.md` §8.6 (the `.rp-price` component).
 *
 * EVERY FIGURE ARRIVES AS A PROP, computed by `_lib/plans.ts` from the `plans`
 * table and from `assessUsage`. There is no price literal in this file. That is
 * what makes the page unable to disagree with the invoice.
 *
 * WHAT THE FEATURE LISTS MAY SAY. Whether a tier includes the California eCPR,
 * modification-change alerts, portal export bundles or the full archive is read
 * from the plan row's own `features` blob — the same blob the entitlement engine
 * reads. A feature list that was typed here could promise something the engine
 * would then refuse.
 */

import type { LadderView, TierView } from '../_lib/plans';

function feature(tier: TierView, key: string): boolean {
  return tier.features[key] === true;
}

function Item({ on, children }: { on: boolean; children: React.ReactNode }): React.ReactElement {
  return (
    <li className={on ? 'rp-price__item' : 'rp-price__item rp-price__item--not'}>{children}</li>
  );
}

function allowance(tier: TierView): string {
  return tier.includedFilings === null ? 'unlimited' : String(tier.includedFilings);
}

function TierCard({
  tier,
  who,
  recommended,
}: {
  tier: TierView;
  who: string;
  recommended: boolean;
}): React.ReactElement {
  return (
    <div className={recommended ? 'rp-price rp-price--recommended' : 'rp-price'}>
      <span className="rp-price__tier">{tier.name}</span>
      <p className="rp-price__amount">
        {tier.monthly}
        <span className="rp-price__unit">/ month</span>
      </p>
      <p className="rp-price__who">{who}</p>
      <table className="rp-price__meter">
        <caption className="rp-sr-only">The meter for {tier.name}.</caption>
        <tbody>
          <tr>
            <th scope="row">Included filings</th>
            <td>{allowance(tier)}</td>
          </tr>
          <tr>
            <th scope="row">Then per filing</th>
            <td>{tier.overagePrice ?? '—'}</td>
          </tr>
          <tr>
            <th scope="row">Annual, billed at {tier.annualMonthsBilled} months</th>
            <td>{tier.annual}</td>
          </tr>
        </tbody>
      </table>
      <ul className="rp-price__list">
        <Item on>Pinned revision-of-record</Item>
        <Item on>Per-classification diff since award</Item>
        <Item on>Classification memory</Item>
        <Item on={feature(tier, 'ecpr')}>
          California eCPR XML <em>(generated, not acceptance-tested)</em>
        </Item>
        <Item on={feature(tier, 'wd_change_alerts')}>
          Modification-change alerts, one-click regenerate
        </Item>
        <Item on={feature(tier, 'portal_export')}>Portal export bundles</Item>
        <Item on={feature(tier, 'full_archive')}>Dispute-grade rate-of-record archive</Item>
      </ul>
      <p className="rp-price__terms">
        {tier.overageCap === null ? (
          <>
            No overage and no tier above this one. There is no &ldquo;contact us for
            enterprise&rdquo;.
          </>
        ) : (
          <>
            Overage stops at {tier.overageCap} — {String(tier.overageFilingsToCap ?? 0)} filings past
            the allowance — and the plan upgrades itself to {tier.autoUpgradeTo} there. A month on
            this tier can never cost more than {tier.maximumMonthly}.
          </>
        )}
      </p>
    </div>
  );
}

const WHO: Readonly<Record<string, string>> = {
  solo: 'One crew, one or two active projects.',
  crew: 'Multi-project, multi-county. This is who Ratepin is built for.',
  multi: 'Several entities, a wall of concurrent awards.',
};

export function PriceCards({ ladder }: { ladder: LadderView }): React.ReactElement {
  return (
    <div className="rp-lp-grid rp-lp-grid--5">
      <div className="rp-price">
        <span className="rp-price__tier">Free</span>
        <p className="rp-price__amount">
          $0<span className="rp-price__unit">no account</span>
        </p>
        <p className="rp-price__who">Anyone with a WH-347 to file this week.</p>
        <table className="rp-price__meter">
          <caption className="rp-sr-only">The meter for the free tier.</caption>
          <tbody>
            <tr>
              <th scope="row">Included filings</th>
              <td>unlimited</td>
            </tr>
            <tr>
              <th scope="row">Model calls</th>
              <td>0</td>
            </tr>
          </tbody>
        </table>
        <ul className="rp-price__list">
          <Item on>WH-347, both layouts</Item>
          <Item on>County × craft lookup</Item>
          <Item on>Provenance footer</Item>
          <Item on={false}>Pinned revision-of-record</Item>
          <Item on={false}>Diff since award</Item>
          <Item on={false}>Classification memory</Item>
          <Item on={false}>eCPR XML</Item>
        </ul>
        <p className="rp-price__terms">
          No email required. No interstitial. No upsell above the fold.
        </p>
      </div>

      <div className="rp-price">
        <span className="rp-price__tier">Bid Sheet</span>
        <p className="rp-price__amount">
          {ladder.rateCard.price}
          <span className="rp-price__unit">once</span>
        </p>
        <p className="rp-price__who">Pricing a job you have not won yet.</p>
        <table className="rp-price__meter">
          <caption className="rp-sr-only">The meter for the Bid Sheet.</caption>
          <tbody>
            <tr>
              <th scope="row">Included filings</th>
              <td>—</td>
            </tr>
            <tr>
              <th scope="row">Account needed</th>
              <td>no</td>
            </tr>
          </tbody>
        </table>
        <ul className="rp-price__list">
          <Item on>Every classification on one determination</Item>
          <Item on>Modification and publication date on the sheet</Item>
          <Item on>Buyable before an account exists</Item>
          <Item on={false}>Recurring anything</Item>
        </ul>
        <p className="rp-price__terms">
          A paid, pre-account proof of the rate-of-record claim. Refundable in full for{' '}
          {String(ladder.rateCard.refundWindowDays)} days, no reason required, and the refund is a
          button.
        </p>
      </div>

      {ladder.tiers.map((tier) => (
        <TierCard
          key={tier.id}
          tier={tier}
          who={WHO[tier.id] ?? ''}
          recommended={tier.id === 'crew'}
        />
      ))}
    </div>
  );
}
