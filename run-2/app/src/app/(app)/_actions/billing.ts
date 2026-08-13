'use server';

/**
 * Billing mutations — J11.
 *
 * AUTHORITY: `USER_JOURNEY.md` §11.1 (what is ours and what is Stripe's), §11.4
 * (upgrade and downgrade are symmetric; the auto-upgrade has a one-click revert;
 * the cancellation-deflection coupon is deliberately not enabled), §11.5 (the
 * self-serve refund, no email address, no reason field), §11.7 ("Re-check my
 * payment status"), `ARCHITECTURE.md` §9 (webhooks move entitlement; our screens
 * request, they never decide).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { Cents } from '@/lib/money';
import { applySubscriptionState, readBillingAccount } from '@/platform/billing/account';
import { loadPlan, planIdForPrice } from '@/platform/billing/catalog';
import {
  changePlan,
  openBillingPortal,
  recheckPaymentStatus,
  revertAutoUpgrade,
  startSubscriptionCheckout,
} from '@/platform/billing/checkout';
import { executeRefund, quoteSubscriptionRefund } from '@/platform/billing/refunds';

import { requireSession, writeAs } from '../_lib/auth';
import { appClock, billingDeps } from '../_lib/deps';
import { billingView, latestPaymentIntent, rateCardRefundView } from '../_lib/billing';

const BILLING_PATH = '/app/settings/billing';

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const planId = String(formData.get('planId') ?? '');
  const outcome = await startSubscriptionCheckout(
    db,
    { accountId: session.accountId, planId, email: session.email },
    billingDeps(),
  );
  if ('error' in outcome) redirect(`${BILLING_PATH}?error=unknown_plan`);
  redirect(outcome.url);
}

/** Upgrade and downgrade go through ONE action, because they are one decision with a
 *  sign. A separate "downgrade" path is where asymmetry gets introduced. */
export async function changePlanAction(formData: FormData): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const toPlanId = String(formData.get('planId') ?? '');
  const result = await changePlan(db, { accountId: session.accountId, toPlanId }, billingDeps());
  revalidatePath(BILLING_PATH);
  redirect(result.ok ? `${BILLING_PATH}?changed=${result.kind}` : `${BILLING_PATH}?error=${result.error}`);
}

/** §11.4 — the undo on an automatic upgrade. One click, same screen. */
export async function revertUpgradeAction(): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const result = await revertAutoUpgrade(db, session.accountId, billingDeps());
  revalidatePath(BILLING_PATH);
  redirect(result.ok ? `${BILLING_PATH}?reverted=1` : `${BILLING_PATH}?error=${result.error}`);
}

/**
 * Cancel, change the card, download invoices — Stripe's hosted portal.
 *
 * Portal sessions expire after five minutes of inactivity, so the URL is minted
 * fresh on every click and never cached. Stripe's cancellation-deflection coupon is
 * deliberately not enabled on this account: an exit is disproportionately what gets
 * remembered and repeated in a small connected trade.
 */
export async function openPortalAction(): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const outcome = await openBillingPortal(db, session.accountId, billingDeps());
  if ('error' in outcome) redirect(`${BILLING_PATH}?error=no_customer`);
  redirect(outcome.url);
}

/**
 * §11.7 — the stuck-restricted button, which is the whole of the escalation path.
 *
 * She has paid, Stripe agrees, a webhook was dropped, and it is Friday. This pulls
 * the subscription synchronously and applies it. There is no ticket to open because
 * there is nowhere to open one.
 */
export async function recheckPaymentAction(): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const deps = billingDeps();
  const outcome = await recheckPaymentStatus(db, session.accountId, {
    ...deps,
    apply: async (view) => {
      // The price id is Stripe's; the plan id and the price in cents are ours, and
      // they are looked up rather than assumed — a subscription on a price we do not
      // sell records as `planId: null` instead of guessing a tier.
      const planId = planIdForPrice(view.priceId, deps.config);
      const plan = await loadPlan(db, planId);
      await applySubscriptionState(db, {
        accountId: session.accountId,
        stripeSubscriptionId: view.id,
        stripeCustomerId: view.customerId,
        planId,
        priceCents: plan?.priceCents ?? Cents.of(0),
        status: view.status,
        currentPeriodStart: view.currentPeriodStart,
        currentPeriodEnd: view.currentPeriodEnd,
        cancelAtPeriodEnd: view.cancelAtPeriodEnd,
      });
    },
  });
  revalidatePath(BILLING_PATH);
  redirect(`${BILLING_PATH}?rechecked=${outcome.checked ? String(outcome.status ?? 'none') : 'no_subscription'}`);
}

/**
 * §11.5 — the refund, with the policy shown before the click.
 *
 * There is no reason field and no email address. The quote is recomputed here rather
 * than trusted from the form, so a crafted POST cannot ask for more than the policy
 * allows.
 */
export async function refundAction(): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const now = appClock().now();

  const account = await readBillingAccount(db, session.accountId);
  const plan = await loadPlan(db, account?.planId ?? null);
  if (!account || !plan) redirect(`${BILLING_PATH}?error=no_subscription`);

  const view = await writeAs(session, async (tx) =>
    billingView(db, tx, { accountId: session.accountId, now }),
  );

  const quote = quoteSubscriptionRefund({
    priceCents: plan.priceCents,
    period: {
      from: account.currentPeriodStart ?? now,
      to: account.currentPeriodEnd ?? now,
    },
    now,
    certifiableFilingsThisPeriod: view.billableThisPeriod,
    incidentOpenThisPeriod: view.creditTotalCents > 0,
  });

  if (!quote.eligible || quote.cents <= Cents.of(0)) {
    redirect(`${BILLING_PATH}?refund=declined`);
  }

  /**
   * A refund needs a charge to reverse, and the only place Ratepin holds one is the
   * Stripe event ledger — ADR-007's "our database records, it never decides" applied
   * to the money going the other way. No recorded payment means there is nothing to
   * refund, and the screen says exactly that rather than pretending to have tried.
   */
  const paymentIntentId = await latestPaymentIntent(db, session.accountId);
  if (paymentIntentId === null) redirect(`${BILLING_PATH}?refund=no_payment`);

  await executeRefund(
    db,
    {
      accountId: session.accountId,
      quote,
      paymentIntentId,
      periodStart: account.currentPeriodStart,
    },
    billingDeps(),
  );

  revalidatePath(BILLING_PATH);
  redirect(`${BILLING_PATH}?refund=done`);
}

/**
 * §3.5 — the refund on the one-time $49 bid rate card.
 *
 * The delivery page tells the buyer: "sign in with that address and the refund button
 * is on your billing screen". It was not. `billingView` derived its quote from the
 * subscription alone, so a buyer with no subscription read "There is no subscription
 * on this account to refund" underneath a policy table promising a full refund within
 * fourteen days, with no reason field, no address and nobody to ask — the exact shape
 * A3 forbids, on the one transaction A1 exists to prove.
 *
 * The quote is recomputed here from the purchase rather than trusted from the form,
 * and `executeRefund` claims the ledger row under a unique key before it calls
 * Stripe, so a double submit refunds once.
 */
export async function refundRateCardAction(): Promise<void> {
  const session = await requireSession(BILLING_PATH);
  const db = await getDb();
  const now = appClock().now();

  const view = await rateCardRefundView(db, session.accountId, now);
  if (view === null) redirect(`${BILLING_PATH}?refund=no_rate_card`);
  if (view.alreadyRefunded) redirect(`${BILLING_PATH}?refund=already_refunded`);
  if (!view.quote.eligible) redirect(`${BILLING_PATH}?refund=declined`);
  if (view.paymentIntentId === null) redirect(`${BILLING_PATH}?refund=no_payment`);

  await executeRefund(
    db,
    {
      accountId: session.accountId,
      quote: view.quote,
      paymentIntentId: view.paymentIntentId,
      // A one-time purchase has no period, and `executeRefund` keys it `one_time`.
      periodStart: null,
    },
    billingDeps(),
  );

  revalidatePath(BILLING_PATH);
  redirect(`${BILLING_PATH}?refund=done`);
}
