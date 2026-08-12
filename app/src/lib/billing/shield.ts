/**
 * Shield activation and renewal.
 *
 * Spec: D6 (30 days included, card on file), ADR-006 (Shield adds one
 * adapter and zero new engines), ADR-007 ("Shield is a Stripe-managed
 * recurring price — we implement no subscription state machine").
 */

import * as shieldRepo from '../db/repositories/shield-accounts';
import type { Db } from '../db';
import type { ShieldAccount } from '../db/repositories/types';
import { SHIELD_INCLUDED_DAYS } from './pricing';

/** Called from fulfillment.ts when an appeal-tier payment completes. Creates
 *  the account with `includedUntil` 30 days out; no Stripe subscription
 *  exists yet — that is only created if/when the seller keeps Shield at the
 *  renewal decision (S15). */
export async function activateIncludedShield(
  db: Db,
  input: {
    customerId: string;
    caseId: string;
    marketplace: ShieldAccount['marketplace'];
    activatedAt?: Date;
  },
): Promise<ShieldAccount> {
  const activatedAt = input.activatedAt ?? new Date();
  const includedUntil = new Date(activatedAt.getTime() + SHIELD_INCLUDED_DAYS * 24 * 60 * 60 * 1000);
  return shieldRepo.createShieldAccount(db, {
    customerId: input.customerId,
    caseId: input.caseId,
    marketplace: input.marketplace,
    sourceKind: 'email_forward',
    includedUntil,
  });
}

/** S15 "keep" — a Stripe-managed recurring subscription now covers billing;
 *  we only record its id (ADR-007's "no subscription state machine"). */
export async function recordShieldRenewal(
  db: Db,
  shieldAccountId: string,
  stripeSubscriptionId: string,
): Promise<void> {
  await shieldRepo.attachShieldSubscription(db, shieldAccountId, stripeSubscriptionId);
}

/** S17 "let lapse" — one click, no penalty framing (USER_JOURNEY.md §3 S17). */
export async function lapseShield(db: Db, shieldAccountId: string): Promise<void> {
  await shieldRepo.cancelShieldAccount(db, shieldAccountId);
}
