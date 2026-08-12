/**
 * Idempotent order fulfilment.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007 — "the webhook handler is idempotent
 * on `event.id`"; D6 (30 days of Shield included); ADR-008 ¶1 (consent
 * captured at Checkout, separable from the purchase); ARCHITECTURE.md §3.7
 * (the day-3/10/21 sequence scheduled in the SAME transaction as the paid
 * write, per ADR-005).
 *
 * This is the one function that turns a verified Stripe event into every
 * downstream effect of a completed purchase. Everything that must be
 * consistent with "the customer paid" — case status, consent, Shield,
 * the outcome sequence — commits in one transaction; everything that is a
 * side effect on another system (sending the receipt) happens after commit.
 */

import type { Adapters } from '../adapters';
import type { StripeWebhookEvent } from '../adapters/stripe';
import * as casesRepo from '../db/repositories/cases';
import * as customersRepo from '../db/repositories/customers';
import * as paymentsRepo from '../db/repositories/payments';
import * as stripeEventsRepo from '../db/repositories/stripe-events';
import * as shieldAccountsRepo from '../db/repositories/shield-accounts';
import type { Db } from '../db';
import * as send from '../email/send';
import { scheduleOutcomeSequence } from '../email/outcome-sequence';
import { recordConsentAtCheckout } from '../outcome-capture/consent';
import { activateIncludedShield, recordShieldRenewal } from './shield';
import { isAppealTier, TIER_LABELS, type PaymentTier } from './pricing';
import { extractCheckoutSessionId, extractSessionMetadata } from './webhook';

export type FulfillmentResult =
  | { status: 'duplicate' }
  | { status: 'fulfilled'; caseId: string; tier: PaymentTier };

export async function fulfillCheckoutSession(
  db: Db,
  adapters: Adapters,
  event: StripeWebhookEvent,
): Promise<FulfillmentResult> {
  // Idempotency FIRST (ADR-007): if we've already recorded this event id,
  // every side effect below has already happened (or is in flight) and must
  // not happen again — a double-send here is what poisons L4 (ADR-008).
  const { isNew } = await stripeEventsRepo.recordStripeEventIfNew(db, {
    id: event.id,
    type: event.type,
    payload: event.data,
  });
  if (!isNew) return { status: 'duplicate' };

  const sessionId = extractCheckoutSessionId(event);
  const payment = await paymentsRepo.getPaymentBySessionId(db, sessionId);
  if (!payment) {
    throw new Error(`fulfillCheckoutSession: no payment row for session ${sessionId} (event ${event.id})`);
  }
  if (!payment.caseId) {
    throw new Error(`fulfillCheckoutSession: payment ${payment.id} has no case_id`);
  }

  const sessionDetails = await adapters.billing.retrieveSession(sessionId);
  const metadata = extractSessionMetadata(event);
  const paidAt = new Date();
  const tier = payment.tier;

  let receiptTo: string | undefined;

  await db.transaction(async (tx) => {
    await paymentsRepo.markPaymentPaid(tx, sessionId, {
      paidAt,
      ...(sessionDetails.paymentIntentId ? { stripePaymentIntentId: sessionDetails.paymentIntentId } : {}),
      ...(sessionDetails.customerId ? { stripeCustomerId: sessionDetails.customerId } : {}),
    });

    let customerId: string | undefined;
    if (sessionDetails.customerEmail) {
      const customer = await customersRepo.findOrCreateCustomerByEmail(tx, {
        email: sessionDetails.customerEmail,
        stripeCustomerId: sessionDetails.customerId ?? null,
      });
      customerId = customer.id;
      receiptTo = customer.email;
      await casesRepo.attachCustomer(tx, payment.caseId as string, customer.id);
    }

    const caseRow = await casesRepo.requireCase(tx, payment.caseId as string);

    if (tier === 'shield_monthly') {
      // Renewal Checkout (S15 "keep"): the case's own status is untouched —
      // Shield is decoupled from the appeal case's lifecycle by design
      // (USER_JOURNEY.md §4 reading notes). Record the resulting subscription
      // id when Stripe's payload carries one (live: `object.subscription`);
      // the adapter interface itself does not surface a typed field for it
      // (ADR-007: "we implement no subscription state machine"), so this
      // reads the raw metadata/object defensively rather than widening the
      // StripeAdapter contract from this directory.
      const account = await shieldAccountsRepo.getShieldAccountForCase(tx, payment.caseId as string);
      const subscriptionId = metadata['subscription_id'];
      if (account && subscriptionId) {
        await recordShieldRenewal(tx, account.id, subscriptionId);
      }
    } else if (isAppealTier(tier)) {
      if (caseRow.status === 'preview_ready') {
        await casesRepo.markPaid(tx, payment.caseId as string, paidAt);
      } else {
        // Purchased from an already-`escalated` case (the $399 tier chosen
        // outright, or after post-rejection escalation) — status stays
        // `escalated`; only the payment timestamp is recorded.
        await casesRepo.recordPaidTimestamp(tx, payment.caseId as string, paidAt);
      }

      // ADR-008 ¶1: consent is separable from the purchase — it is recorded
      // here regardless of `granted`, because an explicit decline is itself
      // the record ("no consent, no promotion" must be answerable, not
      // inferred from absence).
      const consentGranted = metadata['consent_granted'] === 'true';
      const consentTextVersion = metadata['consent_text_version'];
      await recordConsentAtCheckout(tx, payment.caseId as string, {
        granted: consentGranted,
        ...(consentTextVersion ? { textVersion: consentTextVersion } : {}),
      });

      // D6: 30 days of Shield included with every appeal-tier purchase.
      if (customerId) {
        await activateIncludedShield(tx, {
          customerId,
          caseId: payment.caseId as string,
          marketplace: caseRow.marketplace,
          activatedAt: paidAt,
        });
      }

      // B9 / ADR-005: scheduled in the SAME transaction as the paid write.
      await scheduleOutcomeSequence(tx, payment.caseId as string, { now: paidAt });
    }
  });

  // Side effect on an external system — after commit, never inside the
  // transaction (a slow/failed Resend call must not hold a DB lock or roll
  // back an already-true payment).
  if (receiptTo && isAppealTier(tier)) {
    await send.sendReceiptEmail(adapters, receiptTo, {
      tierLabel: TIER_LABELS[tier],
      amountCents: payment.amountCents,
      currency: payment.currency,
      caseId: payment.caseId as string,
    });
  }

  return { status: 'fulfilled', caseId: payment.caseId as string, tier };
}
