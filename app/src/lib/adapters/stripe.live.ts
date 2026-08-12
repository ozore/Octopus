/**
 * Live billing adapter — the only place that imports the Stripe SDK.
 *
 * Spec: ARCHITECTURE.md ADR-007. Hosted Checkout, card on file, webhooks as the
 * source of truth. The API version is pinned (Twelve-Factor X, dev/prod parity):
 * a silent Stripe version bump is a behaviour change we do not want arriving
 * with a redeploy.
 */

import Stripe from 'stripe';

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

export type LiveStripeOptions = {
  secretKey: string;
  webhookSecret: string;
  prices: Record<PaymentTier, string>;
};

export class LiveStripeAdapter implements StripeAdapter {
  private readonly client: Stripe;

  constructor(private readonly opts: LiveStripeOptions) {
    this.client = new Stripe(opts.secretKey);
  }

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    const params: Record<string, unknown> = {
      mode: req.tier === 'shield_monthly' ? 'subscription' : 'payment',
      line_items: [{ price: this.opts.prices[req.tier], quantity: 1 }],
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      // D6: the card is stored at the moment of the Rescue purchase so the
      // Shield decision 30 days later needs no second payment decision.
      ...(req.tier === 'shield_monthly'
        ? {}
        : { payment_intent_data: { setup_future_usage: req.saveCardForFutureUse ? 'off_session' : undefined } }),
      client_reference_id: req.caseId,
      metadata: {
        case_id: req.caseId,
        tier: req.tier,
        // Consent is separable from the purchase: it rides as metadata and is
        // never a required field (ADR-008 ¶1).
        consent_granted: String(req.consent?.granted ?? false),
        consent_text_version: req.consent?.textVersion ?? '',
        ...(req.metadata ?? {}),
      },
    };

    const session = (await this.client.checkout.sessions.create(
      params as unknown as Stripe.Checkout.SessionCreateParams,
    )) as unknown as { id: string; url: string | null; amount_total: number | null; currency: string | null };

    return {
      id: session.id,
      url: session.url ?? '',
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
    };
  }

  async retrieveSession(sessionId: string) {
    const s = (await this.client.checkout.sessions.retrieve(sessionId)) as unknown as {
      id: string;
      url: string | null;
      amount_total: number | null;
      currency: string | null;
      payment_intent: string | { id: string } | null;
      customer: string | { id: string } | null;
      customer_details: { email?: string | null } | null;
    };
    const paymentIntentId = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id;
    const customerId = typeof s.customer === 'string' ? s.customer : s.customer?.id;
    return {
      id: s.id,
      url: s.url ?? '',
      amountCents: s.amount_total ?? 0,
      currency: s.currency ?? 'usd',
      ...(paymentIntentId ? { paymentIntentId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(s.customer_details?.email ? { customerEmail: s.customer_details.email } : {}),
    };
  }

  verifyWebhook(payload: string, signature: string): StripeWebhookEvent {
    try {
      const event = this.client.webhooks.constructEvent(payload, signature, this.opts.webhookSecret);
      return {
        id: event.id,
        type: event.type,
        data: event.data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      throw new WebhookVerificationError(err instanceof Error ? err.message : String(err));
    }
  }

  async refund(req: RefundRequest): Promise<Refund> {
    const refund = (await this.client.refunds.create({
      payment_intent: req.paymentIntentId,
      ...(req.amountCents ? { amount: req.amountCents } : {}),
      metadata: { reason: req.reason },
    } as unknown as Stripe.RefundCreateParams)) as unknown as {
      id: string;
      amount: number;
      status: string | null;
    };
    return { id: refund.id, amountCents: refund.amount, status: refund.status ?? 'unknown' };
  }
}
