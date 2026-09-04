/**
 * This app's plan map. REPLACE THE NUMBERS when you scaffold a real app —
 * the offer fleet's `OFFER.md` decides them, not this file.
 *
 * `limits` keys are the app's own vocabulary; the platform only compares them.
 * `STRIPE_SETUP.md` (npm run stripe:setup) is generated from exactly this data,
 * so the founder's Stripe checklist can never drift from the code.
 */

import { definePlans } from '@octopus/platform/billing';

export const plans = definePlans({
  appName: 'App Template',
  // What an organisation gets before it pays. Generous enough to prove value,
  // small enough that a working crew needs the paid plan within a week.
  freeLimits: { projects: 1, seats: 1, exports: false },
  plans: [
    {
      key: 'starter',
      name: 'Starter',
      tagline: 'One crew, everything that matters',
      priceEnvVar: 'STRIPE_PRICE_STARTER',
      amountCents: 4900,
      currency: 'usd',
      interval: 'month',
      trialDays: 14,
      features: ['Up to 25 projects', '3 seats', 'Exports', 'Email support'],
      limits: { projects: 25, seats: 3, exports: true },
      popular: true,
    },
    {
      key: 'pro',
      name: 'Pro',
      tagline: 'Several crews and the paperwork to match',
      priceEnvVar: 'STRIPE_PRICE_PRO',
      amountCents: 14900,
      currency: 'usd',
      interval: 'month',
      trialDays: 14,
      features: ['Unlimited projects', '10 seats', 'Exports', 'Priority support'],
      limits: { projects: -1, seats: 10, exports: true },
    },
  ],
});

/** The event that means "this signup got the value the product promises".
 *  Every app redefines it; the admin metrics read it. */
export const ACTIVATION_EVENT = 'project_created';
