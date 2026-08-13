/**
 * THE BILLING VIEW — J11, assembled from the ledger and never from an intention.
 *
 * AUTHORITY: `USER_JOURNEY.md` §11.1 (why the plan surface is ours and cancellation
 * is Stripe's), §11.2 (the money state machine: non-payment never destroys data and
 * never closes the archive), §11.4 (upgrade and downgrade are symmetric; the
 * cancellation-deflection coupon is deliberately off), §11.5 (the self-serve refund,
 * with the policy shown before the click), §11.6 (the credit she did not ask for),
 * §11.7 ("Re-check my payment status"), `ARCHITECTURE.md` §9 (Stripe webhooks are
 * the only input that moves entitlement state — our database records, it never
 * decides).
 *
 * ===========================================================================
 * EVERY FIGURE ON THE BILLING SCREEN IS A ROW
 *
 * The overage is `assessUsage` over counted meter events. The credit is the POSTED
 * ledger, never an accrual. The refund is a quote computed from the period and the
 * filing count before the button is enabled. Nothing on this screen is a number
 * somebody typed into a template, which is the only way a billing page in a product
 * with no support channel can be trusted.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '@/db';
import { Cents } from '@/lib/money';
import { entitlementOf, readBillingAccount, type BillingAccount } from '@/platform/billing/account';
import { loadPlan, loadPlans, nextPlan } from '@/platform/billing/catalog';
import type { Entitlement } from '@/platform/billing/entitlement';
import { assessUsage, downgradeEffects, type PlanRow, type UsageAssessment } from '@/platform/billing/pricing';
import {
  quoteRateCardRefund,
  quoteSubscriptionRefund,
  type RefundQuote,
} from '@/platform/billing/refunds';

import { appClock } from './deps';

export interface CreditRow {
  readonly id: number;
  readonly cents: number;
  readonly reason: string;
  readonly createdAt: Date;
  readonly periodStart: Date | null;
}

export interface RefundRow {
  readonly id: number;
  readonly cents: number;
  readonly reasonCode: string;
  readonly requestedAt: Date;
  readonly executedAt: Date | null;
}

export interface PlanChangeRow {
  readonly id: number;
  readonly fromPlanId: string | null;
  readonly toPlanId: string | null;
  readonly kind: string;
  readonly at: Date;
  readonly revertedAt: Date | null;
}

export interface BillingView {
  readonly account: BillingAccount | null;
  readonly entitlement: Entitlement;
  readonly plan: PlanRow | null;
  readonly plans: readonly PlanRow[];
  readonly next: PlanRow | null;
  readonly usage: UsageAssessment | null;
  readonly billableThisPeriod: number;
  readonly draftsThisPeriod: number;
  readonly credits: readonly CreditRow[];
  readonly creditTotalCents: number;
  readonly refunds: readonly RefundRow[];
  readonly planChanges: readonly PlanChangeRow[];
  /** The auto-upgrade that has not been reverted, if any — §11.4's one-click undo. */
  readonly revertableUpgrade: PlanChangeRow | null;
  readonly refundQuote: RefundQuote | null;
  /** §3.5's refund on the one-time $49 card, for a buyer who has since signed in
   *  with the address they bought it with. The screen used to derive `refundQuote`
   *  from the SUBSCRIPTION alone, so a rate-card buyer with no subscription read
   *  "There is no subscription on this account to refund" directly under a policy
   *  table promising a full refund within fourteen days — the delivery page having
   *  told them the button was here. */
  readonly rateCardRefund: RateCardRefundView | null;
  readonly downgrades: readonly {
    readonly plan: PlanRow;
    readonly loses: readonly string[];
    readonly keeps: readonly string[];
  }[];
  readonly upgrades: readonly PlanRow[];
}

export async function billingView(
  db: Db,
  tx: Tx,
  input: { readonly accountId: string; readonly now?: Date },
): Promise<BillingView> {
  /**
   * ONE HANDLE, ONE TRANSACTION. Every read below — including the GLOBAL mirror
   * reads, which are not tenant-scoped — goes through `tx` rather than through the
   * pool handle. On a pooled driver a second handle is merely a second connection;
   * on a single-connection driver it is a query waiting for a transaction that is
   * waiting for it. `Tx` is a `PgDatabase`, so the mirror read model takes it
   * unchanged, and reading the rates inside the transaction that writes the row is
   * the correct semantics anyway.
   */
  const ex: Db = tx;

  const now = input.now ?? appClock().now();
  const account = await readBillingAccount(ex, input.accountId);
  const entitlement = account
    ? entitlementOf(account, { now: () => now })
    : entitlementOf(
        {
          accountId: input.accountId,
          stripeCustomerId: null,
          planId: null,
          priceCents: Cents.of(0),
          status: null,
          stateSince: now,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
        { now: () => now },
      );

  const plans = await loadPlans(ex);
  const plan = await loadPlan(ex, account?.planId ?? null);

  const periodStart = account?.currentPeriodStart ?? startOfMonth(now);
  const periodEnd = account?.currentPeriodEnd ?? endOfMonth(now);

  const counts = rowsOf<{ billable: number | string; drafts: number | string }>(
    await tx.execute(sql`
      SELECT
        count(*) FILTER (WHERE billable AND state = 'RELEASED')::int AS billable,
        count(*) FILTER (WHERE artifact_status = 'DRAFT_NOT_CERTIFIABLE')::int AS drafts
        FROM filings
       WHERE generated_at >= ${periodStart.toISOString()}::timestamptz
    `),
  )[0];
  const billableThisPeriod = Number(counts?.billable ?? 0);
  const draftsThisPeriod = Number(counts?.drafts ?? 0);

  const usage =
    plan === null
      ? null
      : assessUsage({ plan, nextPlan: nextPlan(plans, plan), billableFilings: billableThisPeriod });

  const credits = rowsOf<{
    id: number | string;
    cents: number | string;
    reason: string;
    created_at: string | Date;
    period_start: string | Date | null;
  }>(
    await tx.execute(sql`
      SELECT id, cents, reason, created_at, period_start FROM credits ORDER BY created_at DESC
    `),
  ).map((row) => ({
    id: Number(row.id),
    cents: Number(row.cents),
    reason: row.reason,
    createdAt: new Date(row.created_at),
    periodStart: row.period_start === null ? null : new Date(row.period_start),
  }));

  const refunds = rowsOf<{
    id: number | string;
    cents: number | string;
    reason_code: string;
    requested_at: string | Date;
    executed_at: string | Date | null;
  }>(
    await tx.execute(sql`
      SELECT id, cents, reason_code, requested_at, executed_at FROM refunds ORDER BY requested_at DESC
    `),
  ).map((row) => ({
    id: Number(row.id),
    cents: Number(row.cents),
    reasonCode: row.reason_code,
    requestedAt: new Date(row.requested_at),
    executedAt: row.executed_at === null ? null : new Date(row.executed_at),
  }));

  const planChanges = rowsOf<{
    id: number | string;
    from_plan_id: string | null;
    to_plan_id: string | null;
    kind: string;
    at: string | Date;
    reverted_at: string | Date | null;
  }>(
    await tx.execute(sql`
      SELECT id, from_plan_id, to_plan_id, kind::text AS kind, at, reverted_at
        FROM plan_changes ORDER BY at DESC LIMIT 25
    `),
  ).map((row) => ({
    id: Number(row.id),
    fromPlanId: row.from_plan_id,
    toPlanId: row.to_plan_id,
    kind: row.kind,
    at: new Date(row.at),
    revertedAt: row.reverted_at === null ? null : new Date(row.reverted_at),
  }));

  const incidentOpen = credits.some(
    (credit) => credit.periodStart !== null && credit.periodStart >= periodStart,
  );

  const refundQuote =
    plan === null
      ? null
      : quoteSubscriptionRefund({
          priceCents: plan.priceCents,
          period: { from: periodStart, to: periodEnd },
          now,
          certifiableFilingsThisPeriod: billableThisPeriod,
          incidentOpenThisPeriod: incidentOpen,
        });

  const downgrades =
    plan === null
      ? []
      : plans
          .filter((candidate) => candidate.priceCents < plan.priceCents)
          .map((candidate) => ({ plan: candidate, ...downgradeEffects(plan, candidate) }));

  const upgrades =
    plan === null
      ? plans
      : plans.filter((candidate) => candidate.priceCents > plan.priceCents);

  return {
    account,
    entitlement,
    plan,
    plans,
    next: plan === null ? null : nextPlan(plans, plan),
    usage,
    billableThisPeriod,
    draftsThisPeriod,
    credits,
    creditTotalCents: credits.reduce((total, credit) => total + credit.cents, 0),
    refunds,
    planChanges,
    revertableUpgrade:
      planChanges.find((change) => change.kind === 'auto_upgrade' && change.revertedAt === null) ??
      null,
    refundQuote,
    // Through `tx`, like every other read in this function: a second handle inside
    // an open transaction is a query waiting for a transaction that is waiting for it.
    rateCardRefund: await rateCardRefundView(tx, input.accountId, now),
    downgrades,
    upgrades,
  };
}

export interface RateCardRefundView {
  readonly purchaseId: string;
  readonly purchasedAt: Date;
  readonly quote: RefundQuote;
  /** `null` when the event ledger holds no charge for this purchase, which the
   *  screen renders as itself rather than as a button that fails at Stripe. */
  readonly paymentIntentId: string | null;
  readonly alreadyRefunded: boolean;
}

/**
 * The claimed rate-card purchase and what the policy says about refunding it.
 *
 * The charge is read out of `stripe_events` by the purchase's own Stripe session id,
 * because a rate-card checkout carries neither `metadata.account_id` nor
 * `client_reference_id` — there was no account when it was paid for, which is the
 * whole of J3. `latestPaymentIntent` therefore cannot see it, and that is why the
 * refund needs its own read rather than a widened one.
 */
export async function rateCardRefundView(
  db: Db | Tx,
  accountId: string,
  now: Date,
): Promise<RateCardRefundView | null> {
  const row = rowsOf<{
    id: string;
    cents: number | string;
    purchased_at: string | Date;
    payment_intent: string | null;
    refunded: boolean;
  }>(
    await db.execute(sql`
      SELECT p.id, p.cents, p.purchased_at,
             (SELECT coalesce(e.payload #>> '{data,object,payment_intent}',
                              e.payload #>> '{data,object,id}')
                FROM stripe_events e
               WHERE e.type = 'checkout.session.completed'
                 AND e.payload #>> '{data,object,id}' = p.stripe_session_id
               ORDER BY e.received_at DESC LIMIT 1) AS payment_intent,
             EXISTS (SELECT 1 FROM refunds r
                      WHERE r.account_id = ${accountId}::uuid
                        AND r.reason_code = 'rate_card_14_day') AS refunded
        FROM rate_card_purchases p
       WHERE p.claimed_by_account_id = ${accountId}::uuid
       ORDER BY p.purchased_at DESC
       LIMIT 1
    `),
  )[0];
  if (!row) return null;

  const purchasedAt = new Date(row.purchased_at);
  return {
    purchaseId: row.id,
    purchasedAt,
    quote: quoteRateCardRefund({ priceCents: Cents.of(Number(row.cents)), purchasedAt, now }),
    paymentIntentId: row.payment_intent === '' ? null : row.payment_intent,
    alreadyRefunded: row.refunded,
  };
}

/**
 * The most recent payment intent Stripe told us about, from the event ledger.
 *
 * `stripe_events` is the record of what Stripe said; nothing here infers a charge
 * that no event describes. `null` is a real answer and the refund screen renders it
 * as one — an account with no completed payment has nothing to refund, and saying so
 * is better than a button that fails at Stripe.
 */
export async function latestPaymentIntent(db: Db, accountId: string): Promise<string | null> {
  const row = rowsOf<{ payment_intent: string | null }>(
    await db.execute(sql`
      SELECT coalesce(
               payload #>> '{data,object,payment_intent}',
               payload #>> '{data,object,id}') AS payment_intent
        FROM stripe_events
       WHERE type IN ('invoice.payment_succeeded', 'checkout.session.completed',
                      'payment_intent.succeeded')
         AND (payload #>> '{data,object,metadata,account_id}' = ${accountId}
              OR payload #>> '{data,object,client_reference_id}' = ${accountId})
       ORDER BY received_at DESC
       LIMIT 1
    `),
  )[0];
  const value = row?.payment_intent ?? null;
  return value === null || value === '' ? null : value;
}

function startOfMonth(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
}

function endOfMonth(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));
}

export type { BillingAccount, Entitlement, PlanRow, RefundQuote, UsageAssessment };
