/**
 * Mock billing adapter — no network, no key, no Stripe CLI.
 *
 * `verifyWebhook` does a real HMAC-SHA256 check against a test secret rather
 * than accepting anything, so the handler's signature-rejection path is
 * exercised by the suite instead of assumed. The event builders emit the SAME
 * payload shape the live adapter reads (including the 2025 `items.data[]`
 * period fields), because a hand-rolled event is a silent liar: it makes the
 * handler look correct against a payload Stripe never sends.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { SubscriptionStatus } from '../db/schema';
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

export type MockBillingOptions = {
  webhookSecret?: string;
  /**
   * Where the fake hosted Checkout page lives. In the template this is
   * `${APP_BASE_URL}/mock/checkout/{id}` — a local page that stands in for
   * Stripe's hosted page so the Playwright journey can complete a purchase
   * without the network. Production never reaches this adapter (env.ts refuses
   * ADAPTER_MODE=mock when NODE_ENV=production).
   */
  checkoutBaseUrl?: string;
  portalBaseUrl?: string;
};

export class MockBillingAdapter implements BillingAdapter {
  /**
   * A DISCRIMINATOR, not decoration. `instanceof MockBillingAdapter` is
   * unreliable across a Next.js app: the RSC graph and the route/action graph
   * are compiled separately, so each holds its OWN copy of this class, and an
   * instance created in one fails `instanceof` in the other. Observed as a mock
   * Checkout page 404-ing on a session the server action had just created.
   * Check `isMockBilling()` instead.
   */
  readonly mode = 'mock' as const;

  readonly sessions = new Map<string, CheckoutSession & { request: CheckoutRequest }>();
  readonly subscriptions = new Map<string, SubscriptionSnapshot>();
  readonly portalSessions: PortalRequest[] = [];
  private counter = 0;

  constructor(private readonly opts: MockBillingOptions = {}) {}

  private get webhookSecret(): string {
    return this.opts.webhookSecret ?? 'whsec_test';
  }

  async ensureCustomer(input: { orgId: string; email?: string; existingId?: string }): Promise<{ id: string }> {
    return { id: input.existingId ?? `cus_test_${input.orgId.replace(/[^a-z0-9]/gi, '').slice(-12)}` };
  }

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    this.counter += 1;
    const id = `cs_test_${String(this.counter).padStart(6, '0')}`;
    const base = this.opts.checkoutBaseUrl ?? 'https://checkout.stripe.test/pay';
    const session: CheckoutSession = { id, url: `${base}/${id}` };
    this.sessions.set(id, { ...session, request: req });
    return session;
  }

  async createPortalSession(req: PortalRequest): Promise<PortalSession> {
    this.portalSessions.push(req);
    const base = this.opts.portalBaseUrl ?? 'https://billing.stripe.test/portal';
    return { url: `${base}/${req.customerId}?return_url=${encodeURIComponent(req.returnUrl)}` };
  }

  async retrieveSubscription(subscriptionId: string): Promise<SubscriptionSnapshot> {
    const found = this.subscriptions.get(subscriptionId);
    if (!found) throw new Error(`MockBillingAdapter: unknown subscription ${subscriptionId}`);
    return found;
  }

  verifyWebhook(payload: string, signature: string): BillingWebhookEvent {
    const expected = this.sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new WebhookVerificationError('signature mismatch');
    }
    const parsed = JSON.parse(payload) as BillingWebhookEvent;
    if (!parsed.id || !parsed.type) throw new WebhookVerificationError('malformed event');
    return parsed;
  }

  /** Test/e2e helper: a valid signature for a payload. */
  sign(payload: string): string {
    return createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
  }

  // -- Event builders -------------------------------------------------------

  /** The raw subscription object Stripe would carry, in the 2025 item shape. */
  rawSubscription(input: {
    subscriptionId: string;
    customerId: string;
    orgId: string;
    priceId: string;
    status?: SubscriptionStatus;
    quantity?: number;
    periodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: Date;
  }): Record<string, unknown> {
    const periodEnd = input.periodEnd ?? new Date(Date.now() + 30 * 24 * 3600 * 1000);
    return {
      id: input.subscriptionId,
      object: 'subscription',
      customer: input.customerId,
      status: input.status ?? 'active',
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      ...(input.trialEnd ? { trial_end: Math.floor(input.trialEnd.getTime() / 1000) } : {}),
      metadata: { org_id: input.orgId },
      items: {
        object: 'list',
        data: [
          {
            id: `si_test_${input.subscriptionId.slice(-6)}`,
            quantity: input.quantity ?? 1,
            current_period_end: Math.floor(periodEnd.getTime() / 1000),
            price: { id: input.priceId, object: 'price' },
          },
        ],
      },
    };
  }

  /** Registers the subscription with this adapter and returns the event. */
  subscriptionEvent(
    type: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted',
    input: Parameters<MockBillingAdapter['rawSubscription']>[0],
  ): BillingWebhookEvent {
    const raw = this.rawSubscription(input);
    this.subscriptions.set(input.subscriptionId, normaliseSubscription(raw));
    return {
      id: `evt_test_${type}_${input.subscriptionId}`,
      type,
      data: { object: raw },
    };
  }

  /** `checkout.session.completed` for a session this adapter created. */
  completedCheckoutEvent(
    sessionId: string,
    overrides: { subscriptionId?: string; customerId?: string } = {},
  ): BillingWebhookEvent {
    const found = this.sessions.get(sessionId);
    if (!found) throw new Error(`MockBillingAdapter: unknown session ${sessionId}`);
    const { request } = found;
    const customerId =
      overrides.customerId ?? request.customerId ?? `cus_test_${sessionId.slice(-6)}`;
    const subscriptionId = overrides.subscriptionId ?? `sub_test_${sessionId.slice(-6)}`;

    // Register the subscription so the handler's reconciliation read succeeds,
    // exactly as a real `checkout.session.completed` would be followed by a
    // retrievable subscription.
    this.subscriptions.set(
      subscriptionId,
      normaliseSubscription(
        this.rawSubscription({
          subscriptionId,
          customerId,
          orgId: request.orgId,
          priceId: request.priceId,
          quantity: request.quantity ?? 1,
          status: request.trialDays ? 'trialing' : 'active',
          ...(request.trialDays
            ? { trialEnd: new Date(Date.now() + request.trialDays * 24 * 3600 * 1000) }
            : {}),
        }),
      ),
    );

    return {
      id: `evt_test_${sessionId}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          mode: 'subscription',
          status: 'complete',
          client_reference_id: request.orgId,
          customer: customerId,
          customer_details: { email: request.customerEmail ?? 'owner@example.test' },
          subscription: subscriptionId,
          metadata: {
            org_id: request.orgId,
            plan_key: request.planKey,
            ...(request.metadata ?? {}),
          },
        },
      },
    };
  }

  /** The signed (payload, signature) pair for any event. */
  signed(event: BillingWebhookEvent): { payload: string; signature: string } {
    const payload = JSON.stringify(event);
    return { payload, signature: this.sign(payload) };
  }
}

/** Cross-module-graph safe test for the mock adapter (see `mode` above). */
export function isMockBilling(adapter: unknown): adapter is MockBillingAdapter {
  return typeof adapter === 'object' && adapter !== null && (adapter as { mode?: string }).mode === 'mock';
}
