/**
 * The offer, as data. `specs/09` §The plans and §Stripe product list — which is
 * the canonical list the founder types into Stripe (wave-1b **M6**); `OFFER.md`
 * §12 references it and does not restate it.
 *
 * **Tier on states, with technicians as a fair-use guardrail.** A state × trade
 * is a rulebook we maintain, so states are the actual cost driver, and "we're in
 * seven states" is the buyer's own sentence. Never per seat.
 *
 * **`trialDays` is 0 on every plan, deliberately.** D1 launches on a 14-day
 * free trial with **no credit card**, which is app-managed and never reaches
 * Stripe: no `trial_period_days` goes on any price. The trial lives in
 * `trial_grants` (`schema.ts`) and in `src/lib/trial.ts`. Setting `trialDays`
 * here would make Stripe start a trial at Checkout — i.e. a second, card-backed
 * trial after the app's — which is exactly the mistake `specs/09` warns about.
 */

import { definePlans } from '@octopus/platform/billing';

export const plans = definePlans({
  appName: 'StateReady',
  /**
   * What an organisation gets during the 14-day trial and after it ends without
   * paying. Read-only after day 14 is enforced by `trial.ts`, not by these
   * numbers: holding a customer's compliance data hostage is both wrong and,
   * for this buyer, unforgivable (`specs/09` §Validation).
   */
  freeLimits: { states: 1, technicians: 25, entryPacksIncluded: 0, exports: true },
  plans: [
    {
      key: 'single_state',
      name: 'Single State',
      tagline: 'One state, one rulebook, every date in it',
      priceEnvVar: 'STRIPE_PRICE_SINGLE_MONTHLY',
      amountCents: 14_900,
      currency: 'usd',
      interval: 'month',
      features: [
        '1 state',
        'Up to 25 technicians (fair use)',
        '90/60/30/7-day alerts',
        'Every rule with the board page it came from',
      ],
      limits: { states: 1, technicians: 25, entryPacksIncluded: 0, exports: true },
    },
    {
      key: 'single_state_annual',
      name: 'Single State, annual',
      tagline: 'Two months free',
      priceEnvVar: 'STRIPE_PRICE_SINGLE_ANNUAL',
      amountCents: 149_000,
      currency: 'usd',
      interval: 'year',
      features: ['Everything in Single State', 'Two months free'],
      limits: { states: 1, technicians: 25, entryPacksIncluded: 0, exports: true },
    },
    {
      key: 'multistate',
      name: 'Multi-State',
      tagline: 'The crossing-the-line plan',
      priceEnvVar: 'STRIPE_PRICE_MULTISTATE_MONTHLY',
      amountCents: 34_900,
      currency: 'usd',
      interval: 'month',
      features: [
        'Up to 5 states',
        'Up to 75 technicians (fair use)',
        'Reciprocity in both directions',
        'Shareable readiness link',
      ],
      limits: { states: 5, technicians: 75, entryPacksIncluded: 0, exports: true },
      popular: true,
    },
    {
      key: 'multistate_annual',
      name: 'Multi-State, annual',
      tagline: 'Two months free and one State Entry Pack',
      priceEnvVar: 'STRIPE_PRICE_MULTISTATE_ANNUAL',
      amountCents: 349_000,
      currency: 'usd',
      interval: 'year',
      features: ['Everything in Multi-State', 'Two months free', '1 State Entry Pack included'],
      limits: { states: 5, technicians: 75, entryPacksIncluded: 1, exports: true },
    },
    {
      key: 'platform',
      name: 'Platform',
      tagline: 'A roll-up with a licensing coordinator',
      priceEnvVar: 'STRIPE_PRICE_PLATFORM_MONTHLY',
      amountCents: 59_900,
      currency: 'usd',
      interval: 'month',
      features: [
        'Up to 15 states',
        'Up to 250 technicians (fair use)',
        'Multiple legal entities',
        'Qualifier watch',
      ],
      limits: { states: 15, technicians: 250, entryPacksIncluded: 0, exports: true },
    },
    {
      key: 'platform_annual',
      name: 'Platform, annual',
      tagline: 'Two months free and two State Entry Packs',
      priceEnvVar: 'STRIPE_PRICE_PLATFORM_ANNUAL',
      amountCents: 599_000,
      currency: 'usd',
      interval: 'year',
      features: ['Everything in Platform', 'Two months free', '2 State Entry Packs included'],
      limits: { states: 15, technicians: 250, entryPacksIncluded: 2, exports: true },
    },
  ],
});

/**
 * The activation event — `THRESHOLDS.md` T1 and `specs/13`.
 *
 * It is emitted **from the derivation service** (`specs/05` §Analytics), not
 * from the licence-create path: every route into derivation (create, CSV
 * import, profile change, KB publish, the nightly cron) must count, and
 * emitting it at creation counted only one of them (wave-1b **M4**).
 */
export const ACTIVATION_EVENT = 'licence_deadline_derived';

/** `specs/09` D1. Enforced by a counter, not aspiration (`trial.ts`). */
export const TRIAL_DAYS = 14;
export const TRIAL_COHORT_CAP = 100;

/**
 * One-off prices. These are NOT subscription plans, so they are not in the plan
 * map; they are Checkout line items (`specs/08`, `specs/09` lines 7–10).
 * `first_state_audit` is deferred by D1 and has no price and no code path.
 */
export const ONE_OFF_PRICES = {
  entryPackFirst: { envVar: 'STRIPE_PRICE_ENTRY_PACK_FIRST', amountCents: 75_000, label: 'State Entry Pack — first state' },
  entryPack: { envVar: 'STRIPE_PRICE_ENTRY_PACK', amountCents: 150_000, label: 'State Entry Pack — additional state × trade' },
  acquisitionPack3: { envVar: 'STRIPE_PRICE_ACQ_PACK_3', amountCents: 375_000, label: 'State Entry Pack — 3-state acquisition bundle' },
  entryPackAdditional: { envVar: 'STRIPE_PRICE_ENTRY_PACK_ADDL', amountCents: 100_000, label: 'Additional State — Entry Pack add-on' },
} as const;

/** Above 15 states there is no self-serve path and no invented price (`specs/09`). */
export const ENTERPRISE_STATE_THRESHOLD = 15;
