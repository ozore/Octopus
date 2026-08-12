/**
 * Refunds — the unconditional 10-minute guarantee, enforced by code.
 *
 * Spec: ARCHITECTURE.md §3.5 / §6.3 / G6 — "the guarantee is enforced by the
 * system, not by our goodwill"; `paid_at → document_ready_at` is measured
 * from day one regardless of whether the promise is advertised
 * (`env.TIME_GUARANTEE_ADVERTISED`).
 */

import { getEnv } from '../../env';
import type { Adapters } from '../adapters';
import * as casesRepo from '../db/repositories/cases';
import * as paymentsRepo from '../db/repositories/payments';
import type { Db } from '../db';

export type SloCheckResult =
  | { breached: false }
  | { breached: true; elapsedMinutes: number; sloMinutes: number };

/** Pure predicate — no I/O — so the SLO math is unit-testable without a
 *  database or a clock mock beyond passing `now`. */
export function checkSlo(
  paidAt: Date,
  documentReadyAt: Date | null,
  sloMinutes: number,
  now: Date = new Date(),
): SloCheckResult {
  if (documentReadyAt) return { breached: false }; // delivered, whenever that was
  const elapsedMinutes = (now.getTime() - paidAt.getTime()) / 60_000;
  if (elapsedMinutes <= sloMinutes) return { breached: false };
  return { breached: true, elapsedMinutes, sloMinutes };
}

export class NothingToRefundError extends Error {
  constructor(caseId: string) {
    super(`sloBreachRefund: no paid, unrefunded payment found for case ${caseId}`);
    this.name = 'NothingToRefundError';
  }
}

/**
 * Refunds the case's payment and moves it to the `refunded` terminal state.
 * Called by the `sla_breach_refund` job (see ./handlers.ts) — NOT by request
 * handlers, so the refund is always a consequence of the measured clock, not
 * of a support agent's judgment call (that would reopen exactly the
 * "goodwill, not guarantee" gap G6 exists to close).
 */
export async function sloBreachRefund(db: Db, adapters: Adapters, caseId: string): Promise<void> {
  const payment = await paymentsRepo.getLatestPaymentForCase(db, caseId);
  if (!payment || payment.status !== 'paid' || !payment.stripePaymentIntentId) {
    throw new NothingToRefundError(caseId);
  }

  const refund = await adapters.billing.refund({
    paymentIntentId: payment.stripePaymentIntentId,
    reason: 'slo_breach',
  });

  await db.transaction(async (tx) => {
    await paymentsRepo.markPaymentRefunded(tx, payment.id, 'slo_breach', new Date());
    await casesRepo.markRefunded(tx, caseId);
  });

  void refund; // Stripe's refund id is captured in `payments.refund_reason`'s
  // sibling `refunded_at`; the refund object itself carries nothing else this
  // schema persists (amount is already on `payments.amount_cents`).
}

/** Convenience the worker handler calls before refunding, using the pinned
 *  `SLO_MINUTES` env value (Twelve-Factor III). */
export async function checkAndRefundIfBreached(db: Db, adapters: Adapters, caseId: string): Promise<boolean> {
  const caseRow = await casesRepo.requireCase(db, caseId);
  if (!caseRow.paidAt) return false;
  const env = getEnv();
  const result = checkSlo(caseRow.paidAt, caseRow.documentReadyAt, env.SLO_MINUTES);
  if (!result.breached) return false;
  await sloBreachRefund(db, adapters, caseId);
  return true;
}
