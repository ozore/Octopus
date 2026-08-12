/**
 * Billing adapter.
 *
 * Spec: ARCHITECTURE.md §3.5, ADR-007.
 *
 * Constraints encoded here that are invisible in the signatures:
 *
 *  - HOSTED CHECKOUT ONLY. There is no method that accepts a card number, a CVV
 *    or a payment-method token. No PAN ever touches our infrastructure; PCI
 *    scope stays SAQ-A. A method that took card data would be the bug.
 *
 *  - WEBHOOKS ARE THE SOURCE OF TRUTH, NOT THE REDIRECT. `verifyWebhook` is the
 *    only path that unlocks a case, and the caller is required to be idempotent
 *    on `event.id` (a unique constraint on `stripe_events.id`). Stripe retries,
 *    and a double-unlock would double-send the outcome sequence and poison L4.
 *
 *  - CONSENT IS SEPARABLE FROM THE PURCHASE (ADR-008 ¶1). It rides as metadata
 *    on the session; declining must not block or degrade the purchase, so it is
 *    never a required field on a checkout request.
 *
 *  - `setup_future_usage` is what makes D6 possible: 30 days of Shield included
 *    with every Rescue, with the retention decision landing 30 days later at the
 *    moment of relief rather than at the moment of panic.
 */

export type PaymentTier = 'rescue' | 'rescue_human' | 'shield_monthly';

export type CheckoutRequest = {
  caseId: string;
  tier: PaymentTier;
  successUrl: string;
  cancelUrl: string;
  /** Card on file for the included Shield period (D6). */
  saveCardForFutureUse: boolean;
  /** Versioned consent text shown at Checkout, stored verbatim (ADR-008 ¶1). */
  consent?: { granted: boolean; textVersion: string };
  metadata?: Record<string, string>;
};

export type CheckoutSession = {
  id: string;
  url: string;
  amountCents: number;
  currency: string;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export type RefundRequest = {
  paymentIntentId: string;
  /** e.g. 'slo_breach' — the 10-minute guarantee is enforced by an automatic
   *  refund job, not by goodwill (ARCHITECTURE §3.5, G6). */
  reason: string;
  amountCents?: number;
};

export type Refund = {
  id: string;
  amountCents: number;
  status: string;
};

export interface StripeAdapter {
  createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession>;
  retrieveSession(sessionId: string): Promise<CheckoutSession & { paymentIntentId?: string; customerId?: string; customerEmail?: string }>;
  /** Throws on a bad signature. The caller must then persist `event.id` under a
   *  unique constraint before acting on it. */
  verifyWebhook(payload: string, signature: string): StripeWebhookEvent;
  refund(req: RefundRequest): Promise<Refund>;
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}
