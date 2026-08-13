/**
 * The offline Stripe.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X — "tests run against RECORDED upstream
 * responses … so the whole suite is offline, deterministic and free"; the rule that
 * no unit test may require a live Stripe.
 *
 * It is not a stub that returns `{}`. It reproduces the two behaviours the billing
 * code depends on for correctness, so a test that passes here is a test about the
 * real contract:
 *
 * 1. **Idempotency keys are honoured.** A second call with the same key returns the
 *    FIRST object and performs no second effect — which is what makes the crash
 *    window in `credits.ts` (row claimed, process dies, job retried) provably safe
 *    rather than argued to be.
 *
 * 2. **Meter event identifiers de-duplicate.** Stripe drops a repeated meter-event
 *    identifier; so does this, so "keyed on filing_id" is tested end to end.
 *
 * Ids are deterministic and derived from the input, so a snapshot of a billing run
 * is stable across machines and runs — the same property `ENGINE.md` E1 demands of
 * the artifacts.
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

export interface FakeStripeCall {
  readonly method: string;
  readonly idempotencyKey?: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface FakeStripe extends StripeGateway {
  readonly calls: readonly FakeStripeCall[];
  /** Every balance transaction actually created, in order. Negative is a credit. */
  readonly balanceTransactions: readonly { readonly id: string; readonly customerId: string; readonly amountCents: number }[];
  readonly meterEvents: readonly { readonly id: string; readonly identifier: string; readonly quantity: number }[];
  readonly refundsCreated: readonly { readonly id: string; readonly amountCents: number }[];
  seedSubscription(view: StripeSubscriptionView): void;
  seedEvents(events: readonly StripeEventEnvelope[]): void;
  callsTo(method: string): readonly FakeStripeCall[];
}

export function createFakeStripe(options?: { readonly failOn?: ReadonlySet<string> }): FakeStripe {
  const calls: FakeStripeCall[] = [];
  const idempotent = new Map<string, unknown>();
  const balanceTransactions: { id: string; customerId: string; amountCents: number }[] = [];
  const meterEvents: { id: string; identifier: string; quantity: number }[] = [];
  const meterIdentifiers = new Set<string>();
  const refundsCreated: { id: string; amountCents: number }[] = [];
  const subscriptions = new Map<string, StripeSubscriptionView>();
  let events: readonly StripeEventEnvelope[] = [];
  let sequence = 0;

  const nextId = (prefix: string): string => {
    sequence += 1;
    return `${prefix}_${String(sequence).padStart(4, '0')}`;
  };

  const guard = (method: string): void => {
    if (options?.failOn?.has(method)) throw new Error(`FakeStripe: forced failure on ${method}`);
  };

  const record = (method: string, payload: Record<string, unknown>, idempotencyKey?: string): void => {
    calls.push(idempotencyKey === undefined ? { method, payload } : { method, payload, idempotencyKey });
  };

  return {
    calls,
    balanceTransactions,
    meterEvents,
    refundsCreated,

    callsTo(method) {
      return calls.filter((c) => c.method === method);
    },

    seedSubscription(view) {
      subscriptions.set(view.id, view);
    },

    seedEvents(next) {
      events = next;
    },

    async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession> {
      guard('createCheckoutSession');
      record('createCheckoutSession', { ...input });
      const id = nextId('cs');
      return { id, url: `https://checkout.stripe.test/${id}` };
    },

    async createPortalSession(input): Promise<PortalSession> {
      guard('createPortalSession');
      record('createPortalSession', { ...input });
      return { url: `https://billing.stripe.test/${input.customerId}/${nextId('ps')}` };
    },

    async retrieveSubscription(subscriptionId): Promise<StripeSubscriptionView | null> {
      record('retrieveSubscription', { subscriptionId });
      return subscriptions.get(subscriptionId) ?? null;
    },

    async updateSubscriptionPrice(input): Promise<StripeSubscriptionView> {
      guard('updateSubscriptionPrice');
      record('updateSubscriptionPrice', { ...input });
      const existing = subscriptions.get(input.subscriptionId);
      const updated: StripeSubscriptionView = {
        id: input.subscriptionId,
        customerId: existing?.customerId ?? 'cus_fake',
        status: existing?.status ?? 'active',
        priceId: input.priceId,
        currentPeriodStart: existing?.currentPeriodStart ?? null,
        currentPeriodEnd: existing?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
      };
      subscriptions.set(input.subscriptionId, updated);
      return updated;
    },

    async cancelSubscription(input): Promise<StripeSubscriptionView> {
      guard('cancelSubscription');
      record('cancelSubscription', { ...input });
      const existing = subscriptions.get(input.subscriptionId);
      const updated: StripeSubscriptionView = {
        id: input.subscriptionId,
        customerId: existing?.customerId ?? 'cus_fake',
        status: input.atPeriodEnd ? (existing?.status ?? 'active') : 'canceled',
        priceId: existing?.priceId ?? null,
        currentPeriodStart: existing?.currentPeriodStart ?? null,
        currentPeriodEnd: existing?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: input.atPeriodEnd,
      };
      subscriptions.set(input.subscriptionId, updated);
      return updated;
    },

    async createRefund(input: RefundInput) {
      guard('createRefund');
      record('createRefund', { ...input }, input.idempotencyKey);
      const cached = idempotent.get(input.idempotencyKey);
      if (cached) return cached as { id: string; amountCents: number };
      const created = { id: nextId('re'), amountCents: input.amountCents };
      idempotent.set(input.idempotencyKey, created);
      refundsCreated.push(created);
      return created;
    },

    async createBalanceTransaction(input: BalanceTransactionInput) {
      guard('createBalanceTransaction');
      record('createBalanceTransaction', { ...input }, input.idempotencyKey);
      if (input.amountCents > 0) {
        // A positive amount on the customer balance is a CHARGE. Nothing in this
        // product is allowed to create one, so the fake refuses rather than
        // silently letting a sign error pass a test.
        throw new Error('FakeStripe: a customer-balance credit must be negative');
      }
      const cached = idempotent.get(input.idempotencyKey);
      if (cached) return cached as { id: string };
      const created = { id: nextId('cbtxn') };
      idempotent.set(input.idempotencyKey, created);
      balanceTransactions.push({
        id: created.id,
        customerId: input.customerId,
        amountCents: input.amountCents,
      });
      return created;
    },

    async postMeterEvent(input: MeterEventInput) {
      guard('postMeterEvent');
      record('postMeterEvent', { ...input }, input.identifier);
      if (meterIdentifiers.has(input.identifier)) {
        return { id: `me_dup_${input.identifier}` };
      }
      meterIdentifiers.add(input.identifier);
      const created = { id: nextId('me') };
      meterEvents.push({ id: created.id, identifier: input.identifier, quantity: input.quantity });
      return created;
    },

    async listEventsSince(input) {
      record('listEventsSince', { ...input });
      if (!input.after) return events.slice(0, input.limit ?? events.length);
      const index = events.findIndex((e) => e.id === input.after);
      return index < 0 ? events : events.slice(index + 1);
    },

    async requestCustomerRedaction(customerId) {
      record('requestCustomerRedaction', { customerId });
      return { state: 'submitted' as const };
    },
  };
}
