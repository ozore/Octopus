/**
 * THE AUTHENTICATED SURFACE'S DEPENDENCIES — one place that reads config, one place
 * that picks a Stripe gateway, one place that reads a clock.
 *
 * AUTHORITY: `ARCHITECTURE.md` §2.2 factor III (config in the environment), ADR-007
 * (Stripe webhooks are the only input that moves entitlement state, so nothing here
 * decides anything about money — it only opens hosted sessions and reads back),
 * `USER_JOURNEY.md` §11.1 (the split between our screen and Stripe's).
 *
 * WHY A MODULE RATHER THAN A CALL AT EACH SITE. `ADAPTER_MODE=mock` has to bind the
 * in-repo fake for every upstream, everywhere, or the offline suite is testing a
 * different program from the one that ships. Making the selection a single function
 * means a screen cannot accidentally construct a live client, and the test suite
 * cannot accidentally exercise a path production does not have.
 *
 * There is no support-desk client here, no ticketing adapter and no inbound mail
 * reader, because A3 forbids the escalation those would serve.
 */

import { getConfig, type Config } from '@/lib/config';
import { systemClock, type Clock } from '@/platform/clock';
import { createFakeStripe } from '@/platform/billing/stripe-fake';
import { createLiveStripe } from '@/platform/billing/stripe-live';
import type { StripeGateway } from '@/platform/billing/gateway';
import type { BillingConfig, BillingDeps } from '@/platform/billing/checkout';

export function appConfig(): Config {
  return getConfig();
}

export function appClock(): Clock {
  return systemClock;
}

/**
 * The gateway this process should use.
 *
 * `mock` is not a stub with different behaviour: `createFakeStripe` records the same
 * calls and returns the same shapes, so the screens under this route group run
 * identically in the offline suite and in production. A missing secret key in `live`
 * is a boot failure rather than a silent downgrade — a billing screen that quietly
 * stopped talking to Stripe would look like a working product.
 */
export function stripeGateway(config: Config = appConfig()): StripeGateway {
  if (config.ADAPTER_MODE === 'mock') return createFakeStripe();
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required when ADAPTER_MODE=live');
  }
  return createLiveStripe(config.STRIPE_SECRET_KEY);
}

export function billingConfigOf(config: Config = appConfig()): BillingConfig {
  return {
    APP_BASE_URL: config.APP_BASE_URL,
    STRIPE_PRICE_RATE_CARD: config.STRIPE_PRICE_RATE_CARD,
    STRIPE_PRICE_SOLO: config.STRIPE_PRICE_SOLO,
    STRIPE_PRICE_CREW: config.STRIPE_PRICE_CREW,
    STRIPE_PRICE_MULTI: config.STRIPE_PRICE_MULTI,
  };
}

export function billingDeps(clock: Clock = appClock()): BillingDeps {
  const config = appConfig();
  return { stripe: stripeGateway(config), config: billingConfigOf(config), clock };
}
