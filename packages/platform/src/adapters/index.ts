/**
 * The vendor composition root. No module outside `src/adapters` imports a
 * vendor SDK, which is what keeps the test suite free of network calls and API
 * keys and makes "swap Resend for something else" a new file rather than a
 * refactor.
 *
 * PINNED TO `globalThis` for the reason `db/index.ts` is: Next.js compiles the
 * RSC graph and the route/action graph separately, and the MOCK adapters hold
 * state (checkout sessions, sent mail). Two instances means a session created
 * by a server action is unknown to the route handler that must complete it.
 */

import { getEnv } from '../env';
import type { BillingAdapter } from './billing';
import { LiveBillingAdapter } from './billing.live';
import { MockBillingAdapter } from './billing.mock';
export { isMockBilling } from './billing.mock';
import type { EmailAdapter } from './email';
import { LiveEmailAdapter } from './email.live';
import { MockEmailAdapter } from './email.mock';

export * from './billing';
export * from './email';
export { LiveBillingAdapter, MockBillingAdapter, LiveEmailAdapter, MockEmailAdapter };

export type Adapters = {
  billing: BillingAdapter;
  email: EmailAdapter;
};

const globalRef = globalThis as typeof globalThis & { __platformAdapters?: Adapters };

export function buildAdapters(): Adapters {
  const env = getEnv();

  if (env.ADAPTER_MODE === 'mock') {
    return {
      billing: new MockBillingAdapter({
        webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test',
        // The local stand-in for Stripe's hosted page (see the template's
        // /mock/checkout route) so the e2e journey can complete a purchase.
        checkoutBaseUrl: `${env.APP_BASE_URL}/mock/checkout`,
        portalBaseUrl: `${env.APP_BASE_URL}/mock/portal`,
      }),
      email: new MockEmailAdapter(),
    };
  }

  return {
    billing: new LiveBillingAdapter({
      secretKey: env.STRIPE_SECRET_KEY as string,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET as string,
      portalConfigurationId: env.STRIPE_PORTAL_CONFIGURATION_ID,
    }),
    email: new LiveEmailAdapter({
      apiKey: env.RESEND_API_KEY as string,
      from: env.EMAIL_FROM,
      replyTo: env.EMAIL_REPLY_TO,
    }),
  };
}

export function getAdapters(): Adapters {
  return (globalRef.__platformAdapters ??= buildAdapters());
}

/** Test seam. */
export function setAdapters(adapters: Adapters | undefined): void {
  if (adapters) globalRef.__platformAdapters = adapters;
  else delete globalRef.__platformAdapters;
}
