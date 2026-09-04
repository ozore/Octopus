/**
 * Live billing adapter — the only module in the platform that imports the
 * Stripe SDK. Hosted Checkout in subscription mode, Customer Portal, and
 * signature-verified webhooks.
 *
 * The API version is left to the pinned SDK major (stripe ^19) rather than
 * hard-coded here: `normaliseSubscription` reads BOTH the pre-2025 top-level
 * period field and the current per-item one, so a version bump cannot silently
 * empty the renewal date.
 */

import Stripe from 'stripe';

import type {
  BillingAdapter,
  BillingWebhookEvent,
  CheckoutRequest,
  CheckoutSession,
  PortalRequest,
  PortalSession,
  SubscriptionSnapshot,
} from './billing';
import { normaliseSubscription, WebhookVerificationError } from './billing';

export type LiveBillingOptions = {
  secretKey: string;
  webhookSecret: string;
  portalConfigurationId?: string | undefined;
};

export class LiveBillingAdapter implements BillingAdapter {
  private readonly client: Stripe;

  constructor(private readonly opts: LiveBillingOptions) {
    this.client = new Stripe(opts.secretKey);
  }

  async ensureCustomer(input: {
    orgId: string;
    email?: string;
    name?: string;
    existingId?: string;
  }): Promise<{ id: string }> {
    if (input.existingId) return { id: input.existingId };
    const customer = await this.client.customers.create({
      ...(input.email ? { email: input.email } : {}),
      ...(input.name ? { name: input.name } : {}),
      metadata: { org_id: input.orgId },
    });
    return { id: customer.id };
  }

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: req.priceId, quantity: req.quantity ?? 1 }],
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      client_reference_id: req.orgId,
      ...(req.customerId
        ? { customer: req.customerId }
        : req.customerEmail
          ? { customer_email: req.customerEmail }
          : {}),
      // The subscription itself carries org_id, so a `customer.subscription.*`
      // event that arrives without a checkout session still resolves to an
      // organisation. Without it, a plan change made in the Customer Portal
      // updates nothing on our side.
      subscription_data: {
        metadata: { org_id: req.orgId, plan_key: req.planKey },
        ...(req.trialDays ? { trial_period_days: req.trialDays } : {}),
      },
      metadata: { org_id: req.orgId, plan_key: req.planKey, ...(req.metadata ?? {}) },
      allow_promotion_codes: true,
    };

    const session = await this.client.checkout.sessions.create(params);
    return { id: session.id, url: session.url ?? '' };
  }

  async createPortalSession(req: PortalRequest): Promise<PortalSession> {
    const configuration = req.configurationId ?? this.opts.portalConfigurationId;
    const session = await this.client.billingPortal.sessions.create({
      customer: req.customerId,
      return_url: req.returnUrl,
      ...(configuration ? { configuration } : {}),
    });
    return { url: session.url };
  }

  async retrieveSubscription(subscriptionId: string): Promise<SubscriptionSnapshot> {
    const subscription = await this.client.subscriptions.retrieve(subscriptionId);
    return normaliseSubscription(subscription);
  }

  verifyWebhook(payload: string, signature: string): BillingWebhookEvent {
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
}
