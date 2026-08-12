/**
 * Checkout session creation.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007 — hosted Checkout for both `Rescue`
 * ($149) and `Rescue + Human` ($399); card on file (`setup_future_usage`) is
 * what makes D6's included 30 days of Shield possible without a second
 * payment decision under panic. USER_JOURNEY.md §4: `PreviewReady ->
 * AwaitingPayment` (Rescue/Rescue+Human from a fresh case) and the
 * `Escalated` sequence diagram edge (Rescue+Human paid from an
 * already-escalated case) are both legal entry points; `shield_monthly` on
 * its own is the day-30 renewal Checkout (S15), decoupled from the appeal
 * case's status entirely.
 */

import type { Adapters } from '../adapters';
import type { CheckoutSession } from '../adapters/stripe';
import * as casesRepo from '../db/repositories/cases';
import * as paymentsRepo from '../db/repositories/payments';
import type { Db } from '../db';
import type { Payment } from '../db/repositories/types';
import { isAppealTier, type PaymentTier } from './pricing';

export class InvalidCheckoutStateError extends Error {
  constructor(caseId: string, tier: PaymentTier, status: string) {
    super(`case ${caseId} in status "${status}" cannot start ${tier} checkout`);
    this.name = 'InvalidCheckoutStateError';
  }
}

/** Where a Checkout for each tier is allowed to start from (USER_JOURNEY.md
 *  §4 and ARCHITECTURE.md §4.3's sequence diagram — the paywall sits after
 *  the free preview; the human tier is also reachable straight from an
 *  escalated case). */
const VALID_ORIGIN_STATUSES: Record<PaymentTier, readonly casesRepo.CaseStatus[]> = {
  rescue: ['preview_ready'],
  rescue_human: ['preview_ready', 'escalated'],
  // Shield renewal is decoupled from the appeal case's own status (D6,
  // USER_JOURNEY.md §4 reading notes) — any non-terminal-failure case may
  // start one.
  shield_monthly: ['paid', 'document_ready', 'escalated'],
};

export type CreateCheckoutInput = {
  caseId: string;
  tier: PaymentTier;
  successUrl: string;
  cancelUrl: string;
  consent?: { granted: boolean; textVersion: string };
  metadata?: Record<string, string>;
};

export async function createCheckoutForCase(
  db: Db,
  adapters: Adapters,
  input: CreateCheckoutInput,
): Promise<{ session: CheckoutSession; payment: Payment }> {
  const caseRow = await casesRepo.requireCase(db, input.caseId);
  if (!VALID_ORIGIN_STATUSES[input.tier].includes(caseRow.status)) {
    throw new InvalidCheckoutStateError(input.caseId, input.tier, caseRow.status);
  }

  const session = await adapters.billing.createCheckoutSession({
    caseId: input.caseId,
    tier: input.tier,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    // D6: card on file for every appeal-tier purchase, so the Shield decision
    // 30 days later needs no second payment decision.
    saveCardForFutureUse: isAppealTier(input.tier),
    ...(input.consent ? { consent: input.consent } : {}),
    metadata: { ...(input.metadata ?? {}) },
  });

  const payment = await paymentsRepo.insertPendingPayment(db, {
    caseId: input.caseId,
    stripeSessionId: session.id,
    tier: input.tier,
    amountCents: session.amountCents,
    currency: session.currency,
    status: 'pending',
  });

  return { session, payment };
}
