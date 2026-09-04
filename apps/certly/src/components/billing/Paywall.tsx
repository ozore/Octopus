/**
 * THE PAYWALL — `specs/10` §6 and A2.
 *
 * It names three things and never fewer: the cap, the CURRENT COUNT, and the
 * TWO ways out — the next tier, or a Vendor Pack. A paywall that says only "you
 * have reached your limit" makes the customer guess what they bought and how
 * much more costs what, and the Vendor Pack exists precisely so that growing by
 * fifty vendors is never a phone call.
 */

import Link from 'next/link';

import { TIER_SPECS, TIERS, VENDOR_PACK, type Tier } from '@/lib/plans';
import { formatAmount } from '@octopus/platform/billing';

export type PaywallProps = {
  /** What the customer tried to do — `specs/00`'s `paywall_viewed{trigger}`. */
  trigger: 'vendor' | 'document' | 'seat' | 'import';
  used: number;
  limit: number;
  tier: Tier | 'none';
  unit?: string;
};

const NEXT_TIER: Record<Tier, Tier | null> = {
  starter: 'standard',
  standard: 'portfolio',
  portfolio: null,
};

export function Paywall({ trigger, used, limit, tier, unit = 'tracked vendors' }: PaywallProps) {
  const next = tier === 'none' ? TIERS[0] : NEXT_TIER[tier];
  const nextSpec = next ? TIER_SPECS[next] : null;

  return (
    <section className="c-paywall" data-testid="paywall" data-trigger={trigger}>
      <h2 className="c-paywall__title">
        {trigger === 'document'
          ? `That is document ${used + 1} of ${limit} on free onboarding.`
          : `You are tracking ${used} of ${limit} ${unit}.`}
      </h2>
      <p className="c-small">
        {tier === 'none'
          ? 'Onboarding is free up to your first compared certificate. Past that, pick a plan — every one starts with a 14-day trial.'
          : 'Nothing is deleted and nothing is hidden. Adding new ones needs more room, and there are two ways to get it.'}
      </p>
      <ul className="c-paywall__ways">
        {nextSpec ? (
          <li data-testid="paywall-next-tier">
            <strong>{nextSpec.name}</strong> — {formatAmount(nextSpec.monthlyCents)}/month for{' '}
            <span className="c-num">{nextSpec.vendorLimit}</span> tracked vendors.
          </li>
        ) : null}
        <li data-testid="paywall-pack">
          <strong>{VENDOR_PACK.name}</strong> — {formatAmount(VENDOR_PACK.monthlyCents)}/month for{' '}
          <span className="c-num">{VENDOR_PACK.increment}</span> more, stackable to{' '}
          {VENDOR_PACK.maxQuantity}.
        </li>
      </ul>
      <Link className="c-btn c-btn--primary" href="/settings/billing">
        See plans
      </Link>
    </section>
  );
}
