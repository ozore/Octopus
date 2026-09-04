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
 */

import { definePlans } from '@octopus/platform/billing';

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

export const TRIAL_DAYS = 14;

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
    {
      key: 'starter',
      name: 'Starter',
      tagline: '50–200 units, or 5–15 associations',
      priceEnvVar: 'STRIPE_PRICE_CERTLY_STARTER_MONTHLY',
      amountCents: 9900,
      currency: 'usd',
      interval: 'month',
      trialDays: TRIAL_DAYS,
      features: ['50 tracked vendors', '3 seats', 'Renewal reminders', 'Gap report export'],
      limits: { vendors: 50, documents: -1, seats: 3, exports: true },
    },
    {
      key: 'standard',
      name: 'Standard',
      tagline: '200–500 units or 15–45 associations',
      priceEnvVar: 'STRIPE_PRICE_CERTLY_STANDARD_MONTHLY',
      amountCents: 19900,
      currency: 'usd',
      interval: 'month',
      trialDays: TRIAL_DAYS,
      features: ['150 tracked vendors', '10 seats', 'Per-property requirement sets', 'Migration help'],
      limits: { vendors: 150, documents: -1, seats: 10, exports: true },
      popular: true,
    },
    {
      key: 'portfolio',
      name: 'Portfolio',
      tagline: 'Multi-market managers and small general contractors',
      priceEnvVar: 'STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY',
      amountCents: 29900,
      currency: 'usd',
      interval: 'month',
      trialDays: TRIAL_DAYS,
      features: ['400 tracked vendors', '25 seats', 'Everything in Standard'],
      limits: { vendors: 400, documents: -1, seats: 25, exports: true },
    },
  ],
});

/**
 * THE ONLY ACTIVATION EVENT (`specs/11` §2, REVIEW.md B-05): the moment a
 * signup has seen its first compared certificate. Not a signup, not an upload —
 * the finding.
 */
export const ACTIVATION_EVENT = 'activated';
