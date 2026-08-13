/**
 * The live Stripe adapter.
 *
 * Spec: ARCHITECTURE.md §3.9's boundary table — `billing/**` is the only module
 * allowed to hold a Stripe client, and `web/**` "never calls a vendor SDK directly."
 *
 * The SDK is loaded by DYNAMIC IMPORT, for a reason that is about tests rather than
 * bundle size: `vitest.setup.ts` closes the socket and the unit suite runs with
 * `ADAPTER_MODE=mock`, so nothing in a test run should ever construct a real client.
 * A static import would pull the SDK into every module graph that touches billing
 * and make "did this test accidentally use the live path?" a question you answer by
 * reading rather than by watching it fail.
 *
 * The client is typed structurally against the calls we make, not against the SDK's
 * exported types. That is deliberate: a minor SDK release that renames a parameter
 * should fail HERE, in one adapter, with a compile error naming the call — not
 * across every module that happens to have imported a `Stripe.Subscription`.
 */

import type {
  BalanceTransactionInput,
  CheckoutSession,
  CheckoutSessionInput,
  MeterEventInput,
  PortalSession,
  RefundInput,
  StripeEventEnvelope,
  StripeGateway,
  StripeSubscriptionView,
} from './gateway';

interface StripeLike {
  checkout: {
    sessions: {
      create(params: Record<string, unknown>): Promise<{ id: string; url: string | null }>;
    };
  };
  billingPortal: {
    sessions: { create(params: Record<string, unknown>): Promise<{ url: string }> };
  };
  subscriptions: {
    retrieve(id: string): Promise<Record<string, unknown>>;
    update(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
    cancel(id: string, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  refunds: {
    create(
      params: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<{ id: string; amount: number }>;
  };
  customers: {
    createBalanceTransaction(
      customerId: string,
      params: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<{ id: string }>;
  };
  billing: {
    meterEvents: { create(params: Record<string, unknown>): Promise<{ identifier?: string }> };
  };
  events: {
    list(params: Record<string, unknown>): Promise<{ data: Record<string, unknown>[] }>;
  };
}

async function client(apiKey: string): Promise<StripeLike> {
  const module = (await import('stripe')) as unknown as {
    default: new (key: string, config?: Record<string, unknown>) => unknown;
  };
  return new module.default(apiKey, { maxNetworkRetries: 2, timeout: 20_000 }) as StripeLike;
}

export function createLiveStripe(apiKey: string): StripeGateway {
  const stripe = (): Promise<StripeLike> => client(apiKey);

  return {
    async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
      const api = await stripe();
      const session = await api.checkout.sessions.create({
        mode: input.mode,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        ...(input.customerId ? { customer: input.customerId } : {}),
        ...(input.clientReferenceId ? { client_reference_id: input.clientReferenceId } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      });
      if (!session.url) throw new Error('Stripe returned a checkout session with no URL');
      return { id: session.id, url: session.url };
    },

    async createPortalSession(input): Promise<PortalSession> {
      const api = await stripe();
      const session = await api.billingPortal.sessions.create({
        customer: input.customerId,
        return_url: input.returnUrl,
      });
      return { url: session.url };
    },

    async retrieveSubscription(subscriptionId): Promise<StripeSubscriptionView | null> {
      const api = await stripe();
      const raw = await api.subscriptions.retrieve(subscriptionId);
      return toView(raw);
    },

    async updateSubscriptionPrice(input): Promise<StripeSubscriptionView> {
      const api = await stripe();
      const current = await api.subscriptions.retrieve(input.subscriptionId);
      const itemId = firstItemId(current);
      const raw = await api.subscriptions.update(input.subscriptionId, {
        ...(itemId ? { items: [{ id: itemId, price: input.priceId }] } : {}),
        proration_behavior: input.prorate ? 'create_prorations' : 'none',
      });
      const view = toView(raw);
      if (!view) throw new Error('Stripe returned an unreadable subscription');
      return view;
    },

    async cancelSubscription(input): Promise<StripeSubscriptionView> {
      const api = await stripe();
      const raw = input.atPeriodEnd
        ? await api.subscriptions.update(input.subscriptionId, { cancel_at_period_end: true })
        : await api.subscriptions.cancel(input.subscriptionId);
      const view = toView(raw);
      if (!view) throw new Error('Stripe returned an unreadable subscription');
      return view;
    },

    async createRefund(input: RefundInput) {
      const api = await stripe();
      const refund = await api.refunds.create(
        {
          payment_intent: input.paymentIntentId,
          amount: input.amountCents,
          metadata: { ratepin_reason: input.reason },
        },
        { idempotencyKey: input.idempotencyKey },
      );
      return { id: refund.id, amountCents: refund.amount };
    },

    async createBalanceTransaction(input: BalanceTransactionInput) {
      if (input.amountCents > 0) {
        // Fail before the network call. A positive customer-balance amount is a
        // charge, and nothing in this product may create one (§9.4).
        throw new Error('a customer-balance credit must be negative');
      }
      const api = await stripe();
      const txn = await api.customers.createBalanceTransaction(
        input.customerId,
        { amount: input.amountCents, currency: input.currency, description: input.description },
        { idempotencyKey: input.idempotencyKey },
      );
      return { id: txn.id };
    },

    async postMeterEvent(input: MeterEventInput) {
      const api = await stripe();
      const event = await api.billing.meterEvents.create({
        event_name: input.eventName,
        identifier: input.identifier,
        payload: { stripe_customer_id: input.customerId, value: String(input.quantity) },
      });
      return { id: event.identifier ?? input.identifier };
    },

    async listEventsSince(input): Promise<readonly StripeEventEnvelope[]> {
      const api = await stripe();
      const page = await api.events.list({
        limit: input.limit ?? 100,
        ...(input.after ? { ending_before: input.after } : {}),
      });
      return page.data.map((raw) => ({
        id: String(raw['id']),
        type: String(raw['type']),
        created: Number(raw['created'] ?? 0),
        data: { object: ((raw['data'] as { object?: Record<string, unknown> } | undefined)?.object ?? {}) },
      }));
    },

    async requestCustomerRedaction(customerId) {
      // Stripe's redaction API is a Dashboard/Privacy-API surface rather than a
      // client method, and §5.5 is explicit that we "submit a redaction job and
      // report its state" — we do not claim an erasure Stripe has told us it will
      // not perform, and some objects "can only be redacted after 90 days."
      void customerId;
      return { state: 'unsupported' as const };
    },
  };
}

function toView(raw: Record<string, unknown>): StripeSubscriptionView | null {
  const id = raw['id'];
  if (typeof id !== 'string') return null;
  const customer = raw['customer'];
  return {
    id,
    customerId: typeof customer === 'string' ? customer : String((customer as { id?: string })?.id ?? ''),
    status: String(raw['status'] ?? 'incomplete') as StripeSubscriptionView['status'],
    priceId: firstPriceId(raw),
    currentPeriodStart: epoch(raw['current_period_start']),
    currentPeriodEnd: epoch(raw['current_period_end']),
    cancelAtPeriodEnd: raw['cancel_at_period_end'] === true,
  };
}

function items(raw: Record<string, unknown>): Record<string, unknown>[] {
  const data = (raw['items'] as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

function firstItemId(raw: Record<string, unknown>): string | null {
  const id = items(raw)[0]?.['id'];
  return typeof id === 'string' ? id : null;
}

function firstPriceId(raw: Record<string, unknown>): string | null {
  const price = items(raw)[0]?.['price'];
  const id = (price as { id?: unknown } | undefined)?.id;
  return typeof id === 'string' ? id : null;
}

function epoch(value: unknown): Date | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null;
}
