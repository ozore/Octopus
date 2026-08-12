/**
 * Mock billing adapter. No network, no key, no Stripe CLI.
 *
 * `verifyWebhook` implements a real HMAC-SHA256 check against a test secret
 * rather than accepting anything, so the webhook handler's signature-rejection
 * path is exercised by the suite instead of being assumed.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentTier,
  Refund,
  RefundRequest,
  StripeAdapter,
  StripeWebhookEvent,
} from './stripe';
import { WebhookVerificationError } from './stripe';

/** D4: $149 / $399 / $49-mo — deliberately ABOVE the $97 incumbent. */
export const TIER_AMOUNT_CENTS: Record<PaymentTier, number> = {
  rescue: 14900,
  rescue_human: 39900,
  shield_monthly: 4900,
};

export class MockStripeAdapter implements StripeAdapter {
  readonly sessions = new Map<string, CheckoutSession & { request: CheckoutRequest }>();
  readonly refunds: Refund[] = [];

  private counter = 0;

  constructor(private readonly webhookSecret = 'whsec_test') {}

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    this.counter += 1;
    const id = `cs_test_${String(this.counter).padStart(6, '0')}`;
    const session: CheckoutSession = {
      id,
      url: `https://checkout.stripe.test/pay/${id}`,
      amountCents: TIER_AMOUNT_CENTS[req.tier],
      currency: 'usd',
    };
    this.sessions.set(id, { ...session, request: req });
    return session;
  }

  async retrieveSession(sessionId: string) {
    const found = this.sessions.get(sessionId);
    if (!found) throw new Error(`MockStripeAdapter: unknown session ${sessionId}`);
    return {
      id: found.id,
      url: found.url,
      amountCents: found.amountCents,
      currency: found.currency,
      paymentIntentId: `pi_test_${found.id.slice(-6)}`,
      customerId: `cus_test_${found.id.slice(-6)}`,
      customerEmail: 'seller@example.test',
    };
  }

  verifyWebhook(payload: string, signature: string): StripeWebhookEvent {
    const expected = this.sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new WebhookVerificationError('signature mismatch');
    }
    const parsed = JSON.parse(payload) as StripeWebhookEvent;
    if (!parsed.id || !parsed.type) {
      throw new WebhookVerificationError('malformed event');
    }
    return parsed;
  }

  async refund(req: RefundRequest): Promise<Refund> {
    const refund: Refund = {
      id: `re_test_${this.refunds.length + 1}`,
      amountCents: req.amountCents ?? TIER_AMOUNT_CENTS.rescue,
      status: 'succeeded',
    };
    this.refunds.push(refund);
    return refund;
  }

  /** Test helper: produce a valid signature for a payload. */
  sign(payload: string): string {
    return createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
  }

  /**
   * The `checkout.session.completed` event Stripe WOULD send for a session this
   * adapter created — including the session metadata, with the same keys
   * `stripe.live.ts` writes.
   *
   * This exists because a hand-rolled event is a silent liar. Fulfilment reads
   * consent off `metadata.consent_granted` (ADR-008 ¶1), so an event built by
   * hand with only `case_id` fulfils the payment and quietly drops the seller's
   * consent — the purchase looks fine and the outcome corpus never gets the row
   * it was promised. Anything simulating Stripe locally must therefore simulate
   * the payload, not an approximation of it.
   */
  completedSessionEvent(sessionId: string): StripeWebhookEvent {
    const found = this.sessions.get(sessionId);
    if (!found) throw new Error(`MockStripeAdapter: unknown session ${sessionId}`);
    const { request } = found;
    return {
      id: `evt_test_${sessionId}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          amount_total: found.amountCents,
          currency: found.currency,
          client_reference_id: request.caseId,
          metadata: {
            case_id: request.caseId,
            tier: request.tier,
            consent_granted: String(request.consent?.granted ?? false),
            consent_text_version: request.consent?.textVersion ?? '',
            ...(request.metadata ?? {}),
          },
        },
      },
    };
  }

  /** The signed (payload, signature) pair for the event above. */
  signedCompletedSession(sessionId: string): { payload: string; signature: string } {
    const payload = JSON.stringify(this.completedSessionEvent(sessionId));
    return { payload, signature: this.sign(payload) };
  }
}
