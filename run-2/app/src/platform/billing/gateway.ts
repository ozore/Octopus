/**
 * The Stripe boundary, as a port.
 *
 * Spec: ARCHITECTURE.md ADR-007 — "Stripe is the source of truth for money;
 * webhooks decide, we record." §3.6 — `billing/**` owns every Stripe call and is
 * never callable from `engine/**`. §2.2 factor X — the unit suite is offline, so
 * the vendor SDK is behind an interface and the tests drive a fake with recorded
 * webhook fixtures.
 *
 * WHY A PORT RATHER THAN THE SDK DIRECTLY. Two reasons, neither of them taste.
 * First, `vitest.setup.ts` closes the socket: a test that reached the SDK would
 * fail with a network error rather than with a billing assertion. Second, and more
 * important, every money-moving call in this system carries an idempotency key, and
 * an interface is where that can be made non-optional — `createRefund` and
 * `createBalanceTransaction` cannot be called without one, because the parameter is
 * required in the type. A Stripe balance transaction cannot be deleted; a duplicate
 * one is a permanent over-credit whose only undo is a compensating debit that reads
 * to the customer as a surprise charge (CORPUS_DESIGN §11.4).
 */

import { createHmac } from 'node:crypto';

export interface CheckoutSessionInput {
  readonly mode: 'payment' | 'subscription';
  readonly priceId: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  /** J3: the $49 rate card is bought before an account exists, so there is an email
   *  and no customer. */
  readonly customerEmail?: string;
  readonly customerId?: string;
  readonly clientReferenceId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface CheckoutSession {
  readonly id: string;
  readonly url: string;
}

export interface PortalSession {
  readonly url: string;
}

export interface StripeSubscriptionView {
  readonly id: string;
  readonly customerId: string;
  readonly status:
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'unpaid'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'paused';
  readonly priceId: string | null;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
}

export interface RefundInput {
  readonly paymentIntentId: string;
  readonly amountCents: number;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface BalanceTransactionInput {
  readonly customerId: string;
  /**
   * NEGATIVE IS A CREDIT. Stripe's customer balance is a debit balance: a negative
   * amount is money we owe the customer, applied automatically to the next invoice.
   * The sign is part of the contract and is asserted by the adapter, because a
   * positive number here is a charge the customer never agreed to.
   */
  readonly amountCents: number;
  readonly currency: 'usd';
  readonly description: string;
  readonly idempotencyKey: string;
}

export interface MeterEventInput {
  readonly eventName: string;
  readonly customerId: string;
  readonly quantity: number;
  /** Keyed on `filing_id` (§3.6), so a retry cannot double-bill. */
  readonly identifier: string;
}

export interface StripeEventEnvelope {
  readonly id: string;
  readonly type: string;
  readonly created: number;
  readonly data: { readonly object: Record<string, unknown> };
}

export interface StripeGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;
  createPortalSession(input: { readonly customerId: string; readonly returnUrl: string }): Promise<PortalSession>;
  retrieveSubscription(subscriptionId: string): Promise<StripeSubscriptionView | null>;
  updateSubscriptionPrice(input: {
    readonly subscriptionId: string;
    readonly priceId: string;
    readonly prorate: boolean;
  }): Promise<StripeSubscriptionView>;
  cancelSubscription(input: {
    readonly subscriptionId: string;
    readonly atPeriodEnd: boolean;
  }): Promise<StripeSubscriptionView>;
  createRefund(input: RefundInput): Promise<{ readonly id: string; readonly amountCents: number }>;
  createBalanceTransaction(input: BalanceTransactionInput): Promise<{ readonly id: string }>;
  postMeterEvent(input: MeterEventInput): Promise<{ readonly id: string }>;
  /** The daily `/v1/events` replay (§7.1, `billing.replay`). */
  listEventsSince(input: { readonly after?: string; readonly limit?: number }): Promise<readonly StripeEventEnvelope[]>;
  /** §5.5 — deletion SUBMITS a redaction job and reports its state. It does not
   *  claim an erasure Stripe has told us it will not perform. */
  requestCustomerRedaction(customerId: string): Promise<{ readonly state: 'submitted' | 'unsupported' }>;
}

/**
 * Webhook signature verification, implemented here rather than through the SDK.
 *
 * Stripe's scheme is documented and small: the `Stripe-Signature` header carries
 * `t=<unix seconds>` and one or more `v1=<hex hmac>` values, where the HMAC is
 * SHA-256 over `${t}.${rawBody}` keyed by the endpoint secret. Implementing it costs
 * twenty lines and buys the property §11.5 asks for — "Stripe webhook signatures
 * verified BEFORE the body is parsed" — in a form the offline suite can exercise
 * against recorded fixtures without a live key.
 *
 * The timestamp tolerance is the replay defence. Without it a captured webhook body
 * is valid forever, and every webhook in this system moves money or entitlement.
 */
export function verifyStripeSignature(input: {
  readonly payload: string;
  readonly header: string;
  readonly secret: string;
  readonly nowSeconds: number;
  readonly toleranceSeconds?: number;
}): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  const tolerance = input.toleranceSeconds ?? 300;
  const parts = new Map<string, string[]>();
  for (const piece of input.header.split(',')) {
    const [key, value] = piece.trim().split('=', 2);
    if (!key || value === undefined) continue;
    const bucket = parts.get(key) ?? [];
    bucket.push(value);
    parts.set(key, bucket);
  }

  const timestamp = parts.get('t')?.[0];
  if (!timestamp) return { ok: false, reason: 'no timestamp in signature header' };
  const signatures = parts.get('v1') ?? [];
  if (signatures.length === 0) return { ok: false, reason: 'no v1 signature in header' };

  const age = Math.abs(input.nowSeconds - Number(timestamp));
  if (!Number.isFinite(age) || age > tolerance) {
    return { ok: false, reason: `signature timestamp outside tolerance (${String(age)}s)` };
  }

  const expected = signPayload(`${timestamp}.${input.payload}`, input.secret);
  const match = signatures.some((candidate) => constantTimeEquals(candidate, expected));
  return match ? { ok: true } : { ok: false, reason: 'no signature matched' };
}

/** Exposed so a fixture can be signed in a test exactly as Stripe signs one. */
export function stripeSignatureHeader(payload: string, secret: string, atSeconds: number): string {
  return `t=${String(atSeconds)},v1=${signPayload(`${String(atSeconds)}.${payload}`, secret)}`;
}

function signPayload(signedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
