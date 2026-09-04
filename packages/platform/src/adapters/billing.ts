/**
 * Billing port — subscriptions, hosted Checkout only.
 *
 * Constraints encoded here that the signatures alone do not show:
 *
 *  - HOSTED CHECKOUT ONLY. No method accepts a card number, a CVV or a payment
 *    method token. No PAN reaches our infrastructure; PCI scope stays SAQ-A. A
 *    method that took card data would be the bug.
 *  - THE WEBHOOK IS THE SOURCE OF TRUTH, NOT THE REDIRECT. `verifyWebhook` is
 *    the only path that grants entitlement, and the caller must be idempotent
 *    on `event.id` (`stripe_events.id` is a primary key).
 *  - MIRRORED, NOT ASKED. `retrieveSubscription` exists for reconciliation, not
 *    for rendering: no page may call Stripe to decide what a customer may do.
 */

import type { SubscriptionStatus } from '../db/schema';

export type CheckoutRequest = {
  orgId: string;
  planKey: string;
  priceId: string;
  quantity?: number;
  /** An existing Stripe customer, when the org has bought before. */
  customerId?: string;
  customerEmail?: string;
  /** Free trial, from the plan map (billing/plans.ts). */
  trialDays?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CheckoutSession = {
  id: string;
  url: string;
};

export type PortalRequest = {
  customerId: string;
  returnUrl: string;
  configurationId?: string;
};

export type PortalSession = { url: string };

/** The subset of a Stripe subscription this platform mirrors. */
export type SubscriptionSnapshot = {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  priceId: string;
  quantity: number;
  currentPeriodEnd?: Date | undefined;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date | undefined;
  canceledAt?: Date | undefined;
  /** From subscription metadata — how a webhook finds the organisation. */
  orgId?: string | undefined;
};

export type BillingWebhookEvent = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export interface BillingAdapter {
  /** Idempotent: returns the existing customer for the org if there is one. */
  ensureCustomer(input: { orgId: string; email?: string; name?: string; existingId?: string }): Promise<{ id: string }>;
  createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession>;
  createPortalSession(req: PortalRequest): Promise<PortalSession>;
  retrieveSubscription(subscriptionId: string): Promise<SubscriptionSnapshot>;
  /** Throws `WebhookVerificationError` on a bad signature. */
  verifyWebhook(payload: string, signature: string): BillingWebhookEvent;
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

const STATUSES = new Set<SubscriptionStatus>([
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);

export function toSubscriptionStatus(value: unknown): SubscriptionStatus {
  return STATUSES.has(value as SubscriptionStatus) ? (value as SubscriptionStatus) : 'incomplete';
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const unixToDate = (value: unknown): Date | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : undefined;

const idOf = (value: unknown): string =>
  typeof value === 'string' ? value : String(asRecord(value)['id'] ?? '');

/**
 * Normalise a raw Stripe subscription object (from an event payload or from the
 * API) into the snapshot this platform mirrors.
 *
 * THE PERIOD FIELD MOVED. Stripe's 2025 API versions removed
 * `subscription.current_period_end` and put the period on each subscription
 * ITEM (`items.data[].current_period_end`). Reading only the top-level field
 * silently mirrors `null` — the entitlement then has no renewal date and a
 * "renews on" line renders empty for every paying customer. Both shapes are
 * read here, item first, so the mirror is correct on either API version.
 */
export function normaliseSubscription(raw: unknown): SubscriptionSnapshot {
  const sub = asRecord(raw);
  const items = asRecord(sub['items']);
  const first = asRecord((items['data'] as unknown[] | undefined)?.[0]);
  const price = asRecord(first['price']);
  const metadata = asRecord(sub['metadata']) as Record<string, string>;

  return {
    id: String(sub['id'] ?? ''),
    customerId: idOf(sub['customer']),
    status: toSubscriptionStatus(sub['status']),
    priceId: String(price['id'] ?? sub['price'] ?? ''),
    quantity: Number(first['quantity'] ?? sub['quantity'] ?? 1),
    currentPeriodEnd:
      unixToDate(first['current_period_end']) ?? unixToDate(sub['current_period_end']),
    cancelAtPeriodEnd: Boolean(sub['cancel_at_period_end']),
    trialEndsAt: unixToDate(sub['trial_end']),
    canceledAt: unixToDate(sub['canceled_at']),
    orgId: metadata['org_id'],
  };
}
