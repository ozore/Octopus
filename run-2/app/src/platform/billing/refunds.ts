/**
 * The self-serve refund — a button, and the policy printed above it.
 *
 * Spec: ARCHITECTURE.md §9.3 and USER_JOURNEY §11.5. "There is no email address
 * here. There is a button, and above it the encoded policy, so there is nothing to
 * negotiate."
 *
 * | $49 bid rate card                         | Full refund within 14 days, no reason required |
 * | Subscription, ≤2 CERTIFIABLE filings      | Full refund of the current period              |
 * | Subscription, >2 filings                  | Prorated refund of the unused days             |
 * | Any period with an L2+ incident open      | Credit already accrued; the refund is ADDITIVE |
 *
 * The policy is a pure function so the sentence the customer reads and the amount
 * the button moves are computed by the same code. A refund screen that describes one
 * rule and executes another is the exact failure a product with no support channel
 * cannot survive: there is nobody to explain the difference to.
 *
 * The last row is the one worth restating. A period in which we broke the freshness
 * guarantee has already produced a credit; the refund does NOT net it off. Offsetting
 * would mean the guarantee paid nothing whenever the customer also left, which is
 * both mean and self-defeating in a small connected population (D8).
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { Cents } from '../../lib/money';
import { DAY_MS, systemClock, type Clock } from '../clock';
import { RATE_CARD_REFUND_WINDOW_DAYS } from './catalog';
import type { StripeGateway } from './gateway';

export type RefundKind = 'full_rate_card' | 'full_period' | 'prorated_period' | 'declined';

export interface RefundQuote {
  readonly kind: RefundKind;
  readonly cents: Cents;
  readonly reasonCode: string;
  /** The sentence shown BEFORE the click. */
  readonly policy: string;
  readonly eligible: boolean;
}

export const FULL_PERIOD_FILING_THRESHOLD = 2;

export function quoteRateCardRefund(input: {
  readonly priceCents: Cents;
  readonly purchasedAt: Date;
  readonly now: Date;
}): RefundQuote {
  const ageDays = (input.now.getTime() - input.purchasedAt.getTime()) / DAY_MS;
  if (ageDays <= RATE_CARD_REFUND_WINDOW_DAYS) {
    return {
      kind: 'full_rate_card',
      cents: input.priceCents,
      reasonCode: 'rate_card_14_day',
      policy: `Full refund of ${Cents.toDollarString(input.priceCents)}, within 14 days, no reason required.`,
      eligible: true,
    };
  }
  return {
    kind: 'declined',
    cents: Cents.of(0),
    reasonCode: 'rate_card_window_elapsed',
    policy:
      'The 14-day refund window on a one-time bid rate card has passed. ' +
      'The document you bought stays downloadable.',
    eligible: false,
  };
}

export function quoteSubscriptionRefund(input: {
  readonly priceCents: Cents;
  readonly period: { readonly from: Date; readonly to: Date };
  readonly now: Date;
  readonly certifiableFilingsThisPeriod: number;
  readonly incidentOpenThisPeriod: boolean;
}): RefundQuote {
  const additive = input.incidentOpenThisPeriod
    ? ' Any service credit already applied for an open incident this period stays applied — this refund is in addition to it, not instead of it.'
    : '';

  if (input.certifiableFilingsThisPeriod <= FULL_PERIOD_FILING_THRESHOLD) {
    return {
      kind: 'full_period',
      cents: input.priceCents,
      reasonCode: 'subscription_two_or_fewer_filings',
      policy:
        `You have ${String(input.certifiableFilingsThisPeriod)} certifiable filings this period, ` +
        `so the refund is the full ${Cents.toDollarString(input.priceCents)}.${additive}`,
      eligible: true,
    };
  }

  const totalDays = Math.max(1, Math.round((input.period.to.getTime() - input.period.from.getTime()) / DAY_MS));
  const unusedDays = Math.max(0, Math.floor((input.period.to.getTime() - input.now.getTime()) / DAY_MS));
  const cents = Cents.of(Math.floor((input.priceCents * unusedDays) / totalDays));

  return {
    kind: cents > 0 ? 'prorated_period' : 'declined',
    cents,
    reasonCode: 'subscription_prorated_unused_days',
    policy:
      `You have ${String(input.certifiableFilingsThisPeriod)} certifiable filings this period, ` +
      `so the refund is the unused part of it: ${String(unusedDays)} of ${String(totalDays)} days, ` +
      `${Cents.toDollarString(cents)}.${additive}`,
    eligible: cents > 0,
  };
}

export interface ExecutedRefund {
  readonly refundId: number;
  readonly stripeRefundId: string | null;
  readonly cents: Cents;
  readonly duplicate: boolean;
}

/**
 * Execute the quoted refund.
 *
 * Idempotent on `(account, reason, period)` rather than on a request id, because the
 * failure this defends against is a customer clicking twice on a slow Friday
 * connection — two requests, two ids, one intention.
 */
export async function executeRefund(
  db: Db,
  input: {
    readonly accountId: string;
    readonly quote: RefundQuote;
    readonly paymentIntentId: string;
    readonly periodStart: Date | null;
  },
  deps: { readonly stripe: StripeGateway; readonly clock?: Clock },
): Promise<ExecutedRefund | { readonly declined: true; readonly policy: string }> {
  if (!input.quote.eligible || input.quote.cents <= 0) {
    return { declined: true, policy: input.quote.policy };
  }
  const clock = deps.clock ?? systemClock;
  const key = `refund:${input.accountId}:${input.quote.reasonCode}:${input.periodStart?.toISOString() ?? 'one_time'}`;

  const claimed = await withTenant(db, { accountId: brandAccountId(input.accountId) }, async (tx) => {
    const result = await tx.execute(sql`
      INSERT INTO refunds (account_id, cents, reason_code, requested_at, idempotency_key)
      VALUES (${input.accountId}::uuid, ${input.quote.cents}, ${input.quote.reasonCode},
              ${clock.now().toISOString()}::timestamptz, ${key})
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `);
    return rowsOf<{ id: number | string }>(result)[0] ?? null;
  });

  if (!claimed) {
    const existing = await withTenant(db, { accountId: brandAccountId(input.accountId) }, async (tx) => {
      const result = await tx.execute(sql`
        SELECT id, stripe_refund_id, cents FROM refunds WHERE idempotency_key = ${key}
      `);
      return rowsOf<{ id: number | string; stripe_refund_id: string | null; cents: number | string }>(result)[0];
    });
    return {
      refundId: Number(existing?.id ?? 0),
      stripeRefundId: existing?.stripe_refund_id ?? null,
      cents: Cents.of(Number(existing?.cents ?? 0)),
      duplicate: true,
    };
  }

  const refund = await deps.stripe.createRefund({
    paymentIntentId: input.paymentIntentId,
    amountCents: input.quote.cents,
    reason: input.quote.reasonCode,
    idempotencyKey: key,
  });

  await withTenant(db, { accountId: brandAccountId(input.accountId) }, async (tx) => {
    await tx.execute(sql`
      UPDATE refunds
         SET stripe_refund_id = ${refund.id}, executed_at = ${clock.now().toISOString()}::timestamptz
       WHERE idempotency_key = ${key}
    `);
  });

  return {
    refundId: Number(claimed.id),
    stripeRefundId: refund.id,
    cents: input.quote.cents,
    duplicate: false,
  };
}

/**
 * The plan surface's refusal for the question D4 answers with a flat no.
 *
 * USER_JOURNEY §11.7: *"We sell four prices and they're all on this page. There's no
 * quote, no call and no custom tier — including for us."* It is a P-D — a declined
 * conclusion — rather than an apology, because the honest thing is to state the rule
 * and decline, not to imply that asking harder would work.
 */
export const NO_CUSTOM_TIER_COPY =
  'We sell four prices and they are all on this page. ' +
  'There is no quote, no call and no custom tier — including for us.';
