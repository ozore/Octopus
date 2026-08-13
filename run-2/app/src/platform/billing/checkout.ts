/**
 * Checkout, plan change, portal and the stuck-state button.
 *
 * Spec: ARCHITECTURE.md §9.6 and USER_JOURNEY §11.1. Verified in Stripe's own
 * documentation: for subscriptions using usage-based billing, "the customer can
 * cancel it in the portal, but can't update it." Our subscriptions carry a metered
 * price for filing overage, so the split is forced:
 *
 *   Cancel · payment method · invoices        → Stripe Customer Portal
 *   Upgrade · downgrade · auto-upgrade revert · refund · re-check payment → our screen
 *
 * A1 is the constraint every function here answers to: the $49 bid rate card is
 * purchasable BEFORE an account exists, and nothing on this path can require a
 * demo, a quote or an operator. There is no `contactSales`, no `requestQuote` and no
 * `customPlan` — the absence is the mechanism (D4: "no seats, no setup fee, no
 * quote, no call — ever, at any tier").
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { Cents } from '../../lib/money';
import { addDays, systemClock, type Clock } from '../clock';
import { newId, newToken } from '../ids';
import {
  linkStripeCustomer,
  readBillingAccount,
  recordPlanChange,
  type BillingAccount,
} from './account';
import { RATE_CARD_PRICE_CENTS, loadPlan, loadPlans, stripePriceFor } from './catalog';
import { currentSubscriptionId } from './meter';
import type { CheckoutSession, StripeGateway } from './gateway';

export interface BillingConfig {
  readonly APP_BASE_URL: string;
  readonly STRIPE_PRICE_RATE_CARD: string;
  readonly STRIPE_PRICE_SOLO: string;
  readonly STRIPE_PRICE_CREW: string;
  readonly STRIPE_PRICE_MULTI: string;
}

export interface BillingDeps {
  readonly stripe: StripeGateway;
  readonly config: BillingConfig;
  readonly clock?: Clock;
}

/**
 * J3 — the $49 bid rate card, bought by someone who has never signed in.
 *
 * No account is created here and none is required (§3.4 of the journey: "No account
 * is created"). The purchase is recorded when the webhook confirms payment, keyed to
 * the email, and it attaches itself to an account later if one ever appears
 * (`claimRateCardPurchases`).
 */
export async function startRateCardCheckout(
  input: { readonly email: string; readonly returnPath?: string },
  deps: BillingDeps,
): Promise<CheckoutSession> {
  const base = deps.config.APP_BASE_URL;
  return deps.stripe.createCheckoutSession({
    mode: 'payment',
    priceId: deps.config.STRIPE_PRICE_RATE_CARD,
    customerEmail: input.email,
    successUrl: new URL(input.returnPath ?? '/rate-card/ready', base).toString(),
    cancelUrl: new URL('/rate-card', base).toString(),
    metadata: { product: 'bid_rate_card' },
  });
}

export async function startSubscriptionCheckout(
  db: Db,
  input: { readonly accountId: string; readonly planId: string; readonly email: string },
  deps: BillingDeps,
): Promise<CheckoutSession | { readonly error: 'unknown_plan' }> {
  const priceId = stripePriceFor(input.planId, deps.config);
  if (!priceId) return { error: 'unknown_plan' };

  const existing = await readBillingAccount(db, input.accountId);
  const base = deps.config.APP_BASE_URL;

  return deps.stripe.createCheckoutSession({
    mode: 'subscription',
    priceId,
    ...(existing?.stripeCustomerId
      ? { customerId: existing.stripeCustomerId }
      : { customerEmail: input.email }),
    clientReferenceId: input.accountId,
    successUrl: new URL('/app/billing?checkout=complete', base).toString(),
    cancelUrl: new URL('/app/billing', base).toString(),
    metadata: { account_id: input.accountId, plan_id: input.planId },
  });
}

/** Cancel, card, invoices. Portal sessions expire after 5 minutes of inactivity
 *  (documented), so this is called freshly each time and never cached. */
export async function openBillingPortal(
  db: Db,
  accountId: string,
  deps: BillingDeps,
): Promise<{ readonly url: string } | { readonly error: 'no_customer' }> {
  const account = await readBillingAccount(db, accountId);
  if (!account?.stripeCustomerId) return { error: 'no_customer' };
  return deps.stripe.createPortalSession({
    customerId: account.stripeCustomerId,
    returnUrl: new URL('/app/billing', deps.config.APP_BASE_URL).toString(),
  });
}

export type PlanChangeResult =
  | { readonly ok: true; readonly kind: 'upgrade' | 'downgrade'; readonly effectiveAt: Date | null }
  | { readonly ok: false; readonly error: 'unknown_plan' | 'no_subscription' | 'same_plan' };

/**
 * Upgrade and downgrade, symmetric by construction (USER_JOURNEY §11.4).
 *
 * Upgrade is immediate and prorated. Downgrade is one click on the same screen and
 * takes effect at period end — not because it is harder, but because the customer
 * has already paid for the period and a mid-period downgrade would either refund
 * silently or delete entitlement she bought. Neither ever touches the archive.
 */
export async function changePlan(
  db: Db,
  input: { readonly accountId: string; readonly toPlanId: string },
  deps: BillingDeps,
): Promise<PlanChangeResult> {
  const clock = deps.clock ?? systemClock;
  const plans = await loadPlans(db);
  const to = plans.find((p) => p.id === input.toPlanId);
  if (!to) return { ok: false, error: 'unknown_plan' };

  const account = await readBillingAccount(db, input.accountId);
  const subscriptionId = await currentSubscriptionId(db, input.accountId);
  if (!account || !subscriptionId) return { ok: false, error: 'no_subscription' };
  if (account.planId === to.id) return { ok: false, error: 'same_plan' };

  const from = await loadPlan(db, account.planId);
  const priceId = stripePriceFor(to.id, deps.config);
  if (!priceId) return { ok: false, error: 'unknown_plan' };

  const isUpgrade = (from?.priceCents ?? Cents.of(0)) < to.priceCents;
  await deps.stripe.updateSubscriptionPrice({ subscriptionId, priceId, prorate: isUpgrade });

  const effectiveAt = isUpgrade ? clock.now() : account.currentPeriodEnd;
  await recordPlanChange(
    db,
    {
      accountId: input.accountId,
      fromPlanId: account.planId,
      toPlanId: to.id,
      kind: isUpgrade ? 'upgrade' : 'downgrade',
      effectiveAt,
    },
    clock,
  );

  return { ok: true, kind: isUpgrade ? 'upgrade' : 'downgrade', effectiveAt };
}

/**
 * The one-click revert on an automatic upgrade (USER_JOURNEY §11.4).
 *
 * An automatic change the customer cannot undo in one action is not a convenience,
 * it is a fait accompli — so the revert reads the `plan_changes` row the upgrade
 * wrote and puts the subscription back on the plan it names.
 */
export async function revertAutoUpgrade(
  db: Db,
  accountId: string,
  deps: BillingDeps,
): Promise<{ readonly ok: true; readonly toPlanId: string } | { readonly ok: false; readonly error: string }> {
  const clock = deps.clock ?? systemClock;
  const row = await latestAutoUpgrade(db, accountId);
  if (!row) return { ok: false, error: 'no_auto_upgrade' };

  const priceId = row.from_plan_id ? stripePriceFor(row.from_plan_id, deps.config) : null;
  const subscriptionId = await currentSubscriptionId(db, accountId);
  if (!priceId || !subscriptionId) return { ok: false, error: 'no_subscription' };

  await deps.stripe.updateSubscriptionPrice({ subscriptionId, priceId, prorate: true });
  await db.execute(sql`
    UPDATE plan_changes SET reverted_at = ${clock.now().toISOString()}::timestamptz WHERE id = ${row.id}
  `);
  await recordPlanChange(
    db,
    {
      accountId,
      fromPlanId: row.to_plan_id,
      toPlanId: row.from_plan_id,
      kind: 'revert',
      effectiveAt: clock.now(),
    },
    clock,
  );
  return { ok: true, toPlanId: row.from_plan_id ?? '' };
}

interface PlanChangeRow {
  readonly id: number;
  readonly from_plan_id: string | null;
  readonly to_plan_id: string | null;
}

async function latestAutoUpgrade(db: Db, accountId: string): Promise<PlanChangeRow | null> {
  const result = await db.execute(sql`
    SELECT id, from_plan_id, to_plan_id FROM plan_changes
     WHERE account_id = ${accountId}::uuid AND kind = 'auto_upgrade' AND reverted_at IS NULL
     ORDER BY at DESC LIMIT 1
  `);
  return rowsOf<PlanChangeRow>(result)[0] ?? null;
}

/**
 * "Re-check my payment status" — USER_JOURNEY §11.7.
 *
 * The single worst billing failure mode in a product with no support channel is a
 * stuck `restricted` state on a Friday: she has paid, Stripe agrees, and a dropped
 * webhook means we do not. This pulls the subscription synchronously and applies it.
 * The daily `/v1/events` replay converges the same state within a day; this button
 * makes it instant if she notices first, and it is the whole of the escalation path.
 */
export async function recheckPaymentStatus(
  db: Db,
  accountId: string,
  deps: BillingDeps & {
    readonly apply: (view: NonNullable<Awaited<ReturnType<StripeGateway['retrieveSubscription']>>>) => Promise<void>;
  },
): Promise<{ readonly checked: boolean; readonly status: string | null }> {
  const subscriptionId = await currentSubscriptionId(db, accountId);
  if (!subscriptionId) return { checked: false, status: null };
  const view = await deps.stripe.retrieveSubscription(subscriptionId);
  if (!view) return { checked: false, status: null };
  await deps.apply(view);
  return { checked: true, status: view.status };
}

/**
 * Record a completed rate-card purchase. Called from the webhook, never from the
 * browser: the browser's "success" redirect is a hint, and money is only ever
 * recorded from the event ledger (ADR-007).
 */
export async function recordRateCardPurchase(
  db: Db,
  input: {
    readonly sessionId: string;
    readonly email: string;
    readonly cents?: number;
  },
  clock: Clock = systemClock,
): Promise<{ readonly id: string; readonly deliveryToken: string; readonly duplicate: boolean }> {
  const now = clock.now();
  const id = newId();
  const token = newToken();
  const result = await db.execute(sql`
    INSERT INTO rate_card_purchases (id, stripe_session_id, email, cents, delivery_token,
                                     purchased_at, expires_at)
    VALUES (${id}::uuid, ${input.sessionId}, ${input.email.toLowerCase()},
            ${input.cents ?? RATE_CARD_PRICE_CENTS}, ${token},
            ${now.toISOString()}::timestamptz, ${addDays(now, 365).toISOString()}::timestamptz)
    ON CONFLICT (stripe_session_id) DO NOTHING
    RETURNING id, delivery_token
  `);
  const row = rowsOf<{ id: string; delivery_token: string }>(result)[0];
  if (row) return { id: row.id, deliveryToken: row.delivery_token, duplicate: false };

  const existing = rowsOf<{ id: string; delivery_token: string }>(
    await db.execute(sql`
      SELECT id, delivery_token FROM rate_card_purchases WHERE stripe_session_id = ${input.sessionId}
    `),
  )[0];
  return {
    id: existing?.id ?? id,
    deliveryToken: existing?.delivery_token ?? token,
    duplicate: true,
  };
}

export type { BillingAccount };
