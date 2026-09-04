/**
 * WL-09 V17–V19 · **"Not for sale" as a property of the code.**
 *
 * The GC Roll-up tier is published on the ladder at $299 and is NOT SELLABLE
 * until WL-24 ships (finding B2). Taking $299 a month for sub seats, weekly
 * collection and a per-sub status board that do not exist is misrepresentation
 * with a refund and a chargeback attached, so three things are true at once and
 * each is independently tested:
 *
 *  1. **There is no `gc` plan key and no `STRIPE_PRICE_GC*` variable**
 *     (`src/lib/plans.ts`), so Checkout has nothing to pass to Stripe.
 *  2. **The sellable set is a constant** and `startTrialCheckout` refuses any
 *     lookup key outside it with `tier_not_sellable` — belt as well as braces,
 *     because a plan map is a file somebody could edit and a refusal is a rule.
 *  3. **A live-mode GC price id fails the boot assertion.** The founder is told
 *     to create the GC rows in TEST MODE ONLY (OFFER.md §10); if a live
 *     deployment ever carries one, the app refuses to start rather than
 *     quietly becoming able to sell an unbuilt tier.
 *
 * Moving the GC keys into `SELLABLE_LOOKUP_KEYS` is a one-line, reviewable diff
 * on the day WL-24 ships. That is the whole design.
 */

import { findPlan, type PlanDefinition, type PlanMap } from '@octopus/platform/billing';

/** OFFER.md §10's lookup keys. Stable across a price change. */
export const LOOKUP_KEYS = {
  crewMonthly: 'wagelens_crew_monthly',
  crewAnnual: 'wagelens_crew_annual',
  shopMonthly: 'wagelens_shop_monthly',
  shopAnnual: 'wagelens_shop_annual',
  gcMonthly: 'wagelens_gc_monthly',
  gcAnnual: 'wagelens_gc_annual',
} as const;

export type LookupKey = (typeof LOOKUP_KEYS)[keyof typeof LOOKUP_KEYS];

/** V17. The GC keys are absent, and that absence is the feature. */
export const SELLABLE_LOOKUP_KEYS: readonly string[] = [
  LOOKUP_KEYS.crewMonthly,
  LOOKUP_KEYS.crewAnnual,
  LOOKUP_KEYS.shopMonthly,
  LOOKUP_KEYS.shopAnnual,
];

export const GC_LOOKUP_KEYS: readonly string[] = [LOOKUP_KEYS.gcMonthly, LOOKUP_KEYS.gcAnnual];

/** The env variables OFFER.md §10 names for the GC prices. None may resolve in
 *  live mode before WL-24 ships. `STRIPE_PRICE_GC*` is included because that is
 *  the shape this app's plan map would use if somebody added the plan. */
export const GC_PRICE_ENV_VARS = [
  'WAGELENS_PRICE_GC_MONTHLY',
  'WAGELENS_PRICE_GC_ANNUAL',
  'STRIPE_PRICE_GC',
  'STRIPE_PRICE_GC_MONTHLY',
  'STRIPE_PRICE_GC_ANNUAL',
] as const;

export function isSellable(lookupKey: string): boolean {
  return SELLABLE_LOOKUP_KEYS.includes(lookupKey);
}

/** `wagelens_shop_monthly` → `{ planKey: 'shop', interval: 'month' }`. */
export function parseLookupKey(
  lookupKey: string,
): { planKey: string; interval: 'month' | 'year' } | undefined {
  const match = /^wagelens_([a-z]+)_(monthly|annual)$/.exec(lookupKey);
  if (!match) return undefined;
  return { planKey: match[1] as string, interval: match[2] === 'annual' ? 'year' : 'month' };
}

export function lookupKeyFor(plan: PlanDefinition): string {
  return `wagelens_${plan.key}_${plan.interval === 'year' ? 'annual' : 'monthly'}`;
}

/**
 * The plan a sellable lookup key names, if this deployment's plan map has it.
 * A sellable key with no plan is not an error in the offer — the annual prices
 * are created in Stripe by the founder and added to the map in the same change
 * — it is `price_not_configured`, which the caller says out loud.
 */
export function planForLookupKey(plans: PlanMap, lookupKey: string): PlanDefinition | undefined {
  const parsed = parseLookupKey(lookupKey);
  if (!parsed) return undefined;
  const direct = findPlan(plans, lookupKey);
  if (direct) return direct;
  return plans.plans.find(
    (plan) => plan.key === parsed.planKey && plan.interval === parsed.interval,
  );
}

export class TierNotSellableError extends Error {
  readonly code = 'tier_not_sellable';
  constructor(readonly lookupKey: string) {
    super(`${lookupKey} is not sellable`);
    this.name = 'TierNotSellableError';
  }
}

/**
 * V18 — the boot assertion, called from the composition root.
 *
 * A Stripe price id carries no mode in its shape (`price_…` in both), so "a
 * live-mode GC price id" is exactly "a GC price id configured on a deployment
 * whose Stripe key is live". That is what this checks, and it throws rather
 * than warns: a warning in a deploy log is not a control.
 */
export function assertGcNotLive(env: Record<string, unknown>): void {
  const secret = typeof env['STRIPE_SECRET_KEY'] === 'string' ? env['STRIPE_SECRET_KEY'] : '';
  const liveMode =
    secret.startsWith('sk_live_') ||
    (env['NODE_ENV'] === 'production' && env['ADAPTER_MODE'] === 'live' && secret !== '' && !secret.startsWith('sk_test_'));
  if (!liveMode) return;

  const configured = GC_PRICE_ENV_VARS.filter((name) => {
    const value = env[name];
    return typeof value === 'string' && value.length > 0;
  });
  if (configured.length === 0) return;

  throw new Error(
    `The GC Roll-up tier is published and NOT SELLABLE until WL-24 ships (OFFER.md §10, WL-09 V18), ` +
      `but this deployment is in live mode and carries ${configured.join(', ')}. ` +
      `Create the GC prices in TEST MODE ONLY and leave the live-mode variables unset.`,
  );
}
