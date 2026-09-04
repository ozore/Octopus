/**
 * Certly's plan map — `OFFER.md` §8.2 and `specs/10` §2.1 as data.
 *
 * THE METER IS TRACKED VENDORS, and the sentence that defines it is canonical
 * and reproduced verbatim wherever the meter is explained (`METER_SENTENCE`
 * below). It is never paraphrased. `cert_limit` → `vendor_limit` and
 * "Certificate Pack" → "Vendor Pack" were renamed before the founder creates
 * any Stripe object, because renaming now costs a find-and-replace and renaming
 * afterwards costs a migration (REVIEW.md B-10).
 *
 * EVERY CTA READS "Start 14-day trial", NEVER "Start free" (REVIEW.md B-06).
 * The only genuinely free thing Certly offers is the Free Gap Report, and it
 * keeps the word "free" because it is true.
 *
 * The prices are the founder's to confirm (`PREREQUISITES.md` P12); the price
 * IDS come from env and no price is hardcoded (PLAN.md D2).
 *
 * SIX SUBSCRIPTION PRICES, NOT THREE (sub-wave B, M10). `OFFER.md` §12.2 lists
 * three tiers × two intervals; sub-wave A shipped the monthly three because the
 * annual ones had nowhere to render. The plan KEY carries the interval
 * (`standard_annual`) because the platform's plan map is keyed on one string
 * and the webhook resolves a subscription through `planForPriceId`; `tierOf()`
 * gives the three-value tier back wherever the product means "which tier".
 */

import { definePlans, type PlanDefinition } from '@octopus/platform/billing';

/**
 * `specs/10` §2.1, verbatim. Reproduced in `OFFER.md` §8.1, the landing page's
 * pricing block, help article 12 and `/settings/billing` — and nowhere
 * paraphrased. A test asserts the string is identical wherever it appears.
 */
export const METER_SENTENCE =
  'A tracked vendor is one non-archived vendor in your account. Certly tracks one current certificate per tracked vendor: renewals, re-uploads, corrections and endorsement pages never count again, and archived vendors count zero. A vendor who has not sent anything yet still occupies a slot — finding those is the point.';

/**
 * `specs/10` §3.1, verbatim, rendered ADJACENT TO THE BUTTON in body text and
 * never behind a link. `{date}` is the real computed first-charge date, not
 * "in 14 days".
 */
export const TRIAL_DISCLOSURE = (firstChargeDate: string): string =>
  `Card required. No charge until ${firstChargeDate}. Cancel in one click.`;

/** The label on every control that starts a trial. There is no second one. */
export const TRIAL_CTA = 'Start 14-day trial';

export const TRIAL_DAYS = 14;

/**
 * `specs/10` §A7 — a failed payment keeps the org fully writable while Stripe
 * retries, and only then drops to read-only. Cutting a paying customer off on
 * the first failure loses more revenue than it protects.
 */
export const DUNNING_GRACE_DAYS = 7;

/** `OFFER.md` §8.2's published tail rate. Invoiced by hand — never a demo. */
export const TAIL_RATE_CENTS_PER_VENDOR_MONTH = 55;
export const TAIL_THRESHOLD_VENDORS = 700;

// ---------------------------------------------------------------------------
// The three tiers, and the add-on
// ---------------------------------------------------------------------------

export const TIERS = ['starter', 'standard', 'portfolio'] as const;
export type Tier = (typeof TIERS)[number];
export type Interval = 'month' | 'year';

export type TierSpec = {
  tier: Tier;
  name: string;
  tagline: string;
  /** `vendor_limit` in the Stripe price metadata (`OFFER.md` §12.2). */
  vendorLimit: number;
  /** `seats` in the price metadata. Sold on the cards, so enforced (MJ-03). */
  seats: number;
  monthlyCents: number;
  annualCents: number;
  features: string[];
  popular?: boolean;
};

/**
 * The ladder. Annual is ten months for twelve (17%), matching the category
 * convention; the arithmetic is written out rather than derived so that a
 * founder reading this file sees the same numbers Stripe will hold.
 */
export const TIER_SPECS: Record<Tier, TierSpec> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    tagline: '50–200 units, or 5–15 associations',
    vendorLimit: 50,
    seats: 3,
    monthlyCents: 9900,
    annualCents: 99000,
    features: ['50 tracked vendors', '3 seats', 'Renewal reminders', 'Gap report export'],
  },
  standard: {
    tier: 'standard',
    name: 'Standard',
    tagline: '200–500 units or 15–45 associations',
    vendorLimit: 150,
    seats: 10,
    monthlyCents: 19900,
    annualCents: 199000,
    features: [
      '150 tracked vendors',
      '10 seats',
      'Per-property requirement sets',
      'We import your spreadsheet',
    ],
    popular: true,
  },
  portfolio: {
    tier: 'portfolio',
    name: 'Portfolio',
    tagline: 'Multi-market managers and small general contractors',
    vendorLimit: 400,
    seats: 25,
    monthlyCents: 29900,
    annualCents: 299000,
    features: ['400 tracked vendors', '25 seats', 'Everything in Standard'],
  },
};

/** The published growth path, so nobody has to call us to add fifty vendors. */
export const VENDOR_PACK = {
  name: 'Vendor Pack',
  /** `vendor_increment` in the price metadata. */
  increment: 50,
  monthlyCents: 3900,
  annualCents: 39000,
  minQuantity: 0,
  maxQuantity: 10,
  monthlyPriceEnvVar: 'STRIPE_PRICE_CERTLY_PACK50_MONTHLY',
  annualPriceEnvVar: 'STRIPE_PRICE_CERTLY_PACK50_ANNUAL',
} as const;

const ENV_VAR: Record<Tier, Record<Interval, string>> = {
  starter: {
    month: 'STRIPE_PRICE_CERTLY_STARTER_MONTHLY',
    year: 'STRIPE_PRICE_CERTLY_STARTER_ANNUAL',
  },
  standard: {
    month: 'STRIPE_PRICE_CERTLY_STANDARD_MONTHLY',
    year: 'STRIPE_PRICE_CERTLY_STANDARD_ANNUAL',
  },
  portfolio: {
    month: 'STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY',
    year: 'STRIPE_PRICE_CERTLY_PORTFOLIO_ANNUAL',
  },
};

/** `starter` + `month` → `starter`; `starter` + `year` → `starter_annual`. */
export function planKeyFor(tier: Tier, interval: Interval): string {
  return interval === 'year' ? `${tier}_annual` : tier;
}

/** The reverse: which of the three tiers a plan key belongs to. */
export function tierOf(planKey: string): Tier | null {
  const base = planKey.replace(/_annual$/, '');
  return (TIERS as readonly string[]).includes(base) ? (base as Tier) : null;
}

export function intervalOf(planKey: string): Interval {
  return planKey.endsWith('_annual') ? 'year' : 'month';
}

function planFor(tier: Tier, interval: Interval): PlanDefinition {
  const spec = TIER_SPECS[tier];
  return {
    key: planKeyFor(tier, interval),
    name: spec.name,
    tagline: spec.tagline,
    priceEnvVar: ENV_VAR[tier][interval],
    amountCents: interval === 'year' ? spec.annualCents : spec.monthlyCents,
    currency: 'usd',
    interval,
    trialDays: TRIAL_DAYS,
    features: spec.features,
    // `documents: -1` is unlimited by the platform's convention. The METER is
    // vendors; counting documents would punish uploading renewals, which is the
    // behaviour the product exists to cause (`specs/10` §2.1).
    limits: { vendors: spec.vendorLimit, documents: -1, seats: spec.seats, exports: true },
    ...(spec.popular ? { popular: true } : {}),
  };
}

export const plans = definePlans({
  appName: process.env['APP_NAME'] ?? 'Certly',
  /**
   * `specs/10` §8.1 — the org with NO subscription row. Onboarding is free and
   * un-gated up to and including the first comparison, because that first
   * comparison IS activation. Deliberately generous enough to reach it and
   * deliberately too small to run a portfolio on: three documents is one
   * certificate plus two retries.
   */
  freeLimits: { vendors: 25, documents: 3, seats: 1, exports: false },
  plans: [
    planFor('starter', 'month'),
    planFor('standard', 'month'),
    planFor('portfolio', 'month'),
    planFor('starter', 'year'),
    planFor('standard', 'year'),
    planFor('portfolio', 'year'),
  ],
});

/** The three cards a customer chooses between, in ladder order. */
export const TIER_LIST: TierSpec[] = [TIER_SPECS.starter, TIER_SPECS.standard, TIER_SPECS.portfolio];

export function amountCentsFor(tier: Tier, interval: Interval): number {
  return interval === 'year' ? TIER_SPECS[tier].annualCents : TIER_SPECS[tier].monthlyCents;
}

/** The Vendor Pack's price id env var for an interval. */
export function packPriceEnvVar(interval: Interval): string {
  return interval === 'year' ? VENDOR_PACK.annualPriceEnvVar : VENDOR_PACK.monthlyPriceEnvVar;
}

/** True when this price id is a Vendor Pack rather than a tier. */
export function isPackPriceId(priceId: string, env: Record<string, unknown>): boolean {
  if (!priceId) return false;
  return (
    env[VENDOR_PACK.monthlyPriceEnvVar] === priceId || env[VENDOR_PACK.annualPriceEnvVar] === priceId
  );
}

/**
 * THE ONLY ACTIVATION EVENT (`specs/11` §2, REVIEW.md B-05): the moment a
 * signup has seen its first compared certificate. Not a signup, not an upload —
 * the finding.
 */
export const ACTIVATION_EVENT = 'activated';
