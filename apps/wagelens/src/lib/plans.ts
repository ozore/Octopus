/**
 * The offer, as data (`OFFER.md` §6.1).
 *
 * TWO THINGS IN THIS FILE ARE DECISIONS, NOT NUMBERS:
 *
 * 1. **There is no `gc` plan key and no price variable for it.** The $299 GC Roll-up
 *    tier is published as "coming — join the list" and is NOT FOR SALE until
 *    WL-24 ships (finding B2). Absence is the strongest form of that: with no
 *    plan key and no price variable, Checkout has nothing to sell, and no
 *    future edit to a pricing page can accidentally make it sellable. WL-09's
 *    agent adds the waitlist card, not a plan.
 *
 * 2. **`freeLimits` is not a free tier.** `BACKLOG.md` puts a free tier under
 *    *Never*, and the settled trial (finding B1) is 14 days with a card on
 *    file. What these limits describe is the allowance BEFORE the card: one
 *    project may be set up so the buyer can see her own determination and her
 *    own crew — and `exports: false` means **nothing can be filed**. The free
 *    thing this product gives away is the public rate lookup, which needs no
 *    account at all (WL-00).
 *
 * `STRIPE_SETUP.md` (npm run stripe:setup) is generated from exactly this data,
 * so the founder's Stripe checklist can never drift from the code.
 */

import { definePlans } from '@octopus/platform/billing';

export const plans = definePlans({
  // Read from the environment so a rename is a redeploy, not a diff (WL-11 V8).
  appName: process.env['APP_NAME'] ?? 'App',
  freeLimits: { projects: 1, workers: 5, exports: false },
  plans: [
    {
      key: 'crew',
      name: 'Crew',
      tagline: 'The one- to three-job sub',
      priceEnvVar: 'STRIPE_PRICE_CREW',
      amountCents: 7900,
      currency: 'usd',
      interval: 'month',
      trialDays: 14,
      features: [
        'Up to 3 active projects and 15 workers',
        'Unlimited WH-347 and Statement of Compliance',
        'Modification pinning',
        'Determination change alerts',
        'Three-year archive',
      ],
      limits: { projects: 3, workers: 15, exports: true },
    },
    {
      key: 'shop',
      name: 'Shop',
      tagline: 'Many small covered jobs',
      priceEnvVar: 'STRIPE_PRICE_SHOP',
      amountCents: 9900,
      currency: 'usd',
      interval: 'month',
      trialDays: 14,
      features: [
        'Unlimited active projects, up to 100 workers',
        'Everything in Crew',
        'Audit binder export',
        "The prime's weekly link",
        'Conformance flags and multi-determination pinning',
        'Priority support',
      ],
      limits: { projects: -1, workers: 100, exports: true },
      popular: true,
    },
  ],
});

/**
 * The moment a signup got what the product promises: the first WH-347 that
 * exists. Defined once, here, and read by the admin metrics and by
 * `THRESHOLDS.md` §2 — one definition in one module (WL-12 V4).
 */
export const ACTIVATION_EVENT = 'wh347_generated';
