/**
 * Adapter registry.
 *
 * Spec: ARCHITECTURE.md §2.2 Twelve-Factor IV — Postgres, Stripe, Resend and the
 * Anthropic API are attached resources addressed by credential in config, so
 * swapping one is a config change, not a code change. `ADAPTER_MODE=mock` binds
 * the in-repo fakes; `src/env.ts` refuses `mock` in production.
 *
 * This is the single composition root. No module outside `src/lib/adapters`
 * imports a vendor SDK — which is what keeps the test suite free of network
 * calls and API keys, and what makes ADR-006's future `SpApiNotificationSource`
 * a new file rather than a refactor.
 */

import { getEnv } from '../../env';
import type { AnthropicAdapter } from './anthropic';
import { LiveAnthropicAdapter } from './anthropic.live';
import { MockAnthropicAdapter } from './anthropic.mock';
import type { NoticeSource } from './notice-source';
import { InMemoryNoticeSource } from './notice-source.mock';
import type { ResendAdapter } from './resend';
import { LiveResendAdapter } from './resend.live';
import { MockResendAdapter } from './resend.mock';
import type { StripeAdapter } from './stripe';
import { LiveStripeAdapter } from './stripe.live';
import { MockStripeAdapter } from './stripe.mock';

export * from './anthropic';
export * from './notice-source';
export * from './resend';
export * from './stripe';

export type Adapters = {
  model: AnthropicAdapter;
  billing: StripeAdapter;
  email: ResendAdapter;
  noticeSource: NoticeSource;
};

let singleton: Adapters | undefined;

export function buildAdapters(): Adapters {
  const env = getEnv();

  if (env.ADAPTER_MODE === 'mock') {
    return {
      model: new MockAnthropicAdapter(),
      billing: new MockStripeAdapter(env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test'),
      email: new MockResendAdapter(
        env.RESEND_INBOUND_SIGNING_SECRET ?? 'inbound_test',
        env.SHIELD_INGEST_DOMAIN,
      ),
      noticeSource: new InMemoryNoticeSource(),
    };
  }

  return {
    model: new LiveAnthropicAdapter({
      apiKey: env.ANTHROPIC_API_KEY as string,
      baseUrl: env.ANTHROPIC_BASE_URL,
    }),
    billing: new LiveStripeAdapter({
      secretKey: env.STRIPE_SECRET_KEY as string,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET as string,
      prices: {
        rescue: env.STRIPE_PRICE_RESCUE,
        rescue_human: env.STRIPE_PRICE_RESCUE_HUMAN,
        shield_monthly: env.STRIPE_PRICE_SHIELD_MONTHLY,
      },
    }),
    email: new LiveResendAdapter({
      apiKey: env.RESEND_API_KEY as string,
      from: env.EMAIL_FROM,
      inboundSigningSecret: env.RESEND_INBOUND_SIGNING_SECRET,
      ingestDomain: env.SHIELD_INGEST_DOMAIN,
    }),
    // ADR-006 ship order: EmailForward is the v1 mechanism; the concrete reader
    // is wired by the worker, which owns the inbound queue.
    noticeSource: new InMemoryNoticeSource(),
  };
}

export function getAdapters(): Adapters {
  if (!singleton) singleton = buildAdapters();
  return singleton;
}

/** Test seam. */
export function setAdapters(adapters: Adapters | undefined): void {
  singleton = adapters;
}

export { LiveAnthropicAdapter, MockAnthropicAdapter };
export { LiveStripeAdapter, MockStripeAdapter };
export { LiveResendAdapter, MockResendAdapter };
export {
  EmailForwardNoticeSource,
  InMemoryNoticeSource,
  ManualReviewNoticeSource,
  StorefrontLivenessNoticeSource,
} from './notice-source.mock';
