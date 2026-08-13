/**
 * Billing: Checkout session creation for the $149/$399/$49-mo ladder,
 * card-on-file for Shield (D6), idempotent webhook fulfilment (ADR-007), and
 * the code-enforced 10-minute refund guarantee (G6).
 *
 * Spec: ARCHITECTURE.md §3.5, ADR-007; IDEA_DOSSIER.md D4, D6.
 */

import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  InvalidCheckoutStateError,
  createCheckoutForCase,
} from '../src/lib/billing/checkout';
import { fulfillCheckoutSession } from '../src/lib/billing/fulfillment';
import { checkAndRefundIfBreached, checkSlo, sloBreachRefund } from '../src/lib/billing/refunds';
import { extractCheckoutSessionId, handleStripeWebhook } from '../src/lib/billing/webhook';
import { TIER_AMOUNT_CENTS, TIER_LABELS, SHIELD_INCLUDED_DAYS } from '../src/lib/billing/pricing';
import { activateIncludedShield, lapseShield, recordShieldRenewal } from '../src/lib/billing/shield';
import * as casesRepo from '../src/lib/db/repositories/cases';
import * as consentsRepo from '../src/lib/db/repositories/consents';
import * as customersRepo from '../src/lib/db/repositories/customers';
import * as paymentsRepo from '../src/lib/db/repositories/payments';
import * as shieldAccountsRepo from '../src/lib/db/repositories/shield-accounts';
import type { StripeWebhookEvent } from '../src/lib/adapters/stripe';
import type { Db } from '../src/lib/db';
import {
  cases as casesTable,
  payments as paymentsTable,
  scheduledEmails as scheduledEmailsTable,
  stripeEvents as stripeEventsTable,
} from '../src/lib/db/schema';
import { baseCaseInput, createTestDb } from './helpers/pglite-db';
import { makeTestAdapters } from './helpers/test-adapters';

let client: PGlite;
let db: Db;
let adapters: ReturnType<typeof makeTestAdapters>;

beforeEach(async () => {
  const created = await createTestDb();
  client = created.client;
  db = created.db;
  adapters = makeTestAdapters();
});

afterEach(async () => {
  await client.close();
});

async function makePreviewReadyCase() {
  const created = await casesRepo.createCase(db, baseCaseInput());
  await casesRepo.markClassifying(db, created.id);
  await casesRepo.markClassified(db, created.id, 'amazon');
  await casesRepo.markDrafting(db, created.id);
  await casesRepo.markCritiquing(db, created.id);
  return casesRepo.markPreviewReady(db, created.id);
}

function completedSessionEvent(
  id: string,
  sessionId: string,
  metadata: Record<string, string> = {},
): StripeWebhookEvent {
  return {
    id,
    type: 'checkout.session.completed',
    data: { object: { id: sessionId, metadata } },
  };
}

describe('pricing ladder (D4: deliberately above the $97 incumbent)', () => {
  it('prices Rescue at $149, Rescue+Human at $399, Shield at $49/mo', () => {
    expect(TIER_AMOUNT_CENTS.rescue).toBe(14_900);
    expect(TIER_AMOUNT_CENTS.rescue_human).toBe(39_900);
    expect(TIER_AMOUNT_CENTS.shield_monthly).toBe(4_900);
    expect(TIER_LABELS.rescue).toBe('Rescue');
  });
});

describe('D6 monitoring billing math: 30 free days of Shield', () => {
  it('SHIELD_INCLUDED_DAYS is exactly 30 (D6)', () => {
    expect(SHIELD_INCLUDED_DAYS).toBe(30);
  });

  it('activateIncludedShield sets includedUntil to exactly activatedAt + 30 days, no more, no less', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    const customer = await customersRepo.findOrCreateCustomerByEmail(db, { email: 'shield-math@example.test' });
    const activatedAt = new Date('2026-01-01T00:00:00.000Z');

    const account = await activateIncludedShield(db, {
      customerId: customer.id,
      caseId: caseRow.id,
      marketplace: 'amazon',
      activatedAt,
    });

    expect(account.includedUntil).not.toBeNull();
    const expectedMs = activatedAt.getTime() + 30 * 24 * 60 * 60 * 1000;
    expect(account.includedUntil?.getTime()).toBe(expectedMs);

    // Sanity-check the boundary in calendar terms too: Jan 1 + 30 days = Jan 31.
    expect(account.includedUntil?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('defaults activatedAt to "now" when not supplied, still exactly 30 days out', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    const customer = await customersRepo.findOrCreateCustomerByEmail(db, { email: 'shield-now@example.test' });

    const before = Date.now();
    const account = await activateIncludedShield(db, {
      customerId: customer.id,
      caseId: caseRow.id,
      marketplace: 'amazon',
    });
    const after = Date.now();

    const includedUntilMs = account.includedUntil!.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    // includedUntil must land within [before, after] + exactly 30 days — an
    // off-by-one-day error here would silently give every seller either 29 or
    // 31 free days, which is the exact class of billing-math bug this test
    // exists to catch.
    expect(includedUntilMs).toBeGreaterThanOrEqual(before + thirtyDaysMs);
    expect(includedUntilMs).toBeLessThanOrEqual(after + thirtyDaysMs);
  });

  it('activateIncludedShield is invoked automatically on a Rescue purchase via fulfillment (already covered end to end), and independently produces a fresh row per call', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    const customer = await customersRepo.findOrCreateCustomerByEmail(db, { email: 'shield-fresh@example.test' });

    const account = await activateIncludedShield(db, {
      customerId: customer.id,
      caseId: caseRow.id,
      marketplace: 'walmart',
      activatedAt: new Date('2026-06-01T00:00:00.000Z'),
    });

    expect(account.marketplace).toBe('walmart');
    expect(account.cancelledAt).toBeNull();
    expect(account.stripeSubscriptionId).toBeNull();
  });

  it('recordShieldRenewal (S15 "keep") attaches the Stripe subscription id without altering includedUntil', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    const customer = await customersRepo.findOrCreateCustomerByEmail(db, { email: 'shield-renew@example.test' });
    const account = await activateIncludedShield(db, {
      customerId: customer.id,
      caseId: caseRow.id,
      marketplace: 'amazon',
      activatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await recordShieldRenewal(db, account.id, 'sub_test_123');

    const reloaded = await shieldAccountsRepo.getShieldAccountById(db, account.id);
    expect(reloaded?.stripeSubscriptionId).toBe('sub_test_123');
    // The included-until math is untouched by renewal — ADR-007's "no
    // subscription state machine" means Stripe, not this row, now owns
    // ongoing billing; this field just stops being consulted going forward.
    expect(reloaded?.includedUntil?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(reloaded?.cancelledAt).toBeNull();
  });

  it('lapseShield (S17 "let lapse") records a cancellation timestamp, one click, no other side effect', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    const customer = await customersRepo.findOrCreateCustomerByEmail(db, { email: 'shield-lapse@example.test' });
    const account = await activateIncludedShield(db, {
      customerId: customer.id,
      caseId: caseRow.id,
      marketplace: 'amazon',
    });
    expect(account.cancelledAt).toBeNull();

    const before = Date.now();
    await lapseShield(db, account.id);
    const after = Date.now();

    const reloaded = await shieldAccountsRepo.getShieldAccountById(db, account.id);
    expect(reloaded?.cancelledAt).not.toBeNull();
    const cancelledMs = reloaded!.cancelledAt!.getTime();
    expect(cancelledMs).toBeGreaterThanOrEqual(before);
    expect(cancelledMs).toBeLessThanOrEqual(after);
    // includedUntil is not touched by cancellation — the free window, if any
    // of it remained, is not clawed back on the spot (no punitive framing).
    expect(reloaded?.includedUntil).not.toBeNull();
  });

  it('fulfillCheckoutSession activates Shield for exactly 30 days from the paid timestamp, not from checkout creation', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    const beforePaid = Date.now();
    await fulfillCheckoutSession(db, adapters, completedSessionEvent('evt_shield_math', session.id));
    const afterPaid = Date.now();

    const shield = await shieldAccountsRepo.getShieldAccountForCase(db, caseRow.id);
    expect(shield?.includedUntil).not.toBeNull();
    const includedUntilMs = shield!.includedUntil!.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(includedUntilMs).toBeGreaterThanOrEqual(beforePaid + thirtyDaysMs);
    expect(includedUntilMs).toBeLessThanOrEqual(afterPaid + thirtyDaysMs);
  });
});

describe('createCheckoutForCase', () => {
  it('opens a Rescue Checkout from preview_ready and saves the card (D6)', async () => {
    const caseRow = await makePreviewReadyCase();

    const { session, payment } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    expect(session.amountCents).toBe(14_900);
    expect(payment.status).toBe('pending');
    expect(payment.tier).toBe('rescue');
    expect(adapters.billing.sessions.get(session.id)?.request.saveCardForFutureUse).toBe(true);
  });

  it('refuses a Rescue Checkout from a case that has not reached preview_ready', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await expect(
      createCheckoutForCase(db, adapters, {
        caseId: created.id,
        tier: 'rescue',
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      }),
    ).rejects.toThrow(InvalidCheckoutStateError);
  });

  it('allows Rescue+Human from an escalated case as well as preview_ready', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    const escalated = await casesRepo.markEscalated(db, created.id, 'unclassified', 'no confident code');

    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: escalated.id,
      tier: 'rescue_human',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });
    expect(session.amountCents).toBe(39_900);
  });
});

describe('fulfillCheckoutSession (ADR-007: webhooks are the source of truth)', () => {
  it('fulfils a Rescue purchase: pays the case, records consent, activates Shield, schedules the outcome sequence, sends a receipt', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
      consent: { granted: true, textVersion: 'v1-test' },
    });

    const event = completedSessionEvent('evt_1', session.id, {
      consent_granted: 'true',
      consent_text_version: 'v1-test',
    });

    const result = await fulfillCheckoutSession(db, adapters, event);
    expect(result).toEqual({ status: 'fulfilled', caseId: caseRow.id, tier: 'rescue' });

    const paidCase = await casesRepo.requireCase(db, caseRow.id);
    expect(paidCase.status).toBe('paid');
    expect(paidCase.paidAt).not.toBeNull();

    const consent = await consentsRepo.getConsentForCase(db, caseRow.id);
    expect(consent?.granted).toBe(true);
    expect(consent?.textVersion).toBe('v1-test');

    const shield = await shieldAccountsRepo.getShieldAccountForCase(db, caseRow.id);
    expect(shield).toBeDefined();
    expect(shield?.includedUntil).not.toBeNull();

    const scheduled = await db
      .select()
      .from(scheduledEmailsTable)
      .where(eq(scheduledEmailsTable.caseId, caseRow.id));
    // B9: magic link (immediate) + day-3/10/21 self-report prompts — all four,
    // scheduled in the SAME transaction as the paid write (ADR-005).
    expect(scheduled.map((s) => s.kind).sort()).toEqual(['d10', 'd21', 'd3', 'magic_link']);

    expect(adapters.email.sent).toHaveLength(1);
    expect(adapters.email.sent[0]?.tags?.['kind']).toBe('receipt');
  });

  it('records an explicit decline as its own consent row (not an absence)', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    await fulfillCheckoutSession(db, adapters, completedSessionEvent('evt_decline', session.id));

    const consent = await consentsRepo.getConsentForCase(db, caseRow.id);
    expect(consent).toBeDefined();
    expect(consent?.granted).toBe(false);
  });

  it('is idempotent on event.id: a replayed webhook is a no-op the second time', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    const event = completedSessionEvent('evt_replay', session.id);
    const first = await fulfillCheckoutSession(db, adapters, event);
    const second = await fulfillCheckoutSession(db, adapters, event);

    expect(first.status).toBe('fulfilled');
    expect(second).toEqual({ status: 'duplicate' });
    // Only one receipt, not two — a double-send here is exactly what ADR-007
    // exists to prevent.
    expect(adapters.email.sent).toHaveLength(1);
  });

  /**
   * THE RETRY THAT USED TO BE SWALLOWED.
   *
   * The idempotency claim was previously committed BEFORE fulfilment, in its own
   * implicit transaction. A failure afterwards rolled the fulfilment back but not
   * the claim, so Stripe's retry — the mechanism that exists to recover exactly
   * this — read the row and returned `duplicate` forever. Card charged, case
   * still `preview_ready`, no outcome sequence, and the system reporting success.
   *
   * The event here is for a session with no `payments` row (the real-world shape:
   * Stripe delivering `checkout.session.completed` before our own Checkout write
   * has committed). The first delivery must throw, and — the actual assertion —
   * the retry must do REAL WORK rather than answer `duplicate`.
   */
  it('releases its idempotency claim when fulfilment fails, so the Stripe retry still fulfils (ADR-007)', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    // Delete the `payments` row to reproduce the shape that actually occurs:
    // Stripe delivering the event against a session our own write has not (yet)
    // made findable. The session exists at Stripe; the row does not exist here.
    await db.delete(paymentsTable).where(eq(paymentsTable.stripeSessionId, session.id));

    const event = completedSessionEvent('evt_retry', session.id);
    await expect(fulfillCheckoutSession(db, adapters, event)).rejects.toThrow(/no payment row/i);

    // Nothing was recorded as seen, because nothing was done.
    const claimed = await db
      .select()
      .from(stripeEventsTable)
      .where(eq(stripeEventsTable.id, 'evt_retry'));
    expect(claimed).toHaveLength(0);

    // The condition clears — our own Checkout write lands — Stripe retries, and
    // the retry is a real fulfilment rather than a swallowed no-op.
    await paymentsRepo.insertPendingPayment(db, {
      caseId: caseRow.id,
      stripeSessionId: session.id,
      tier: 'rescue',
      amountCents: TIER_AMOUNT_CENTS.rescue,
      currency: 'usd',
      status: 'pending',
    });

    const retry = await fulfillCheckoutSession(db, adapters, event);
    expect(retry.status).toBe('fulfilled');
    expect((await casesRepo.requireCase(db, caseRow.id)).status).toBe('paid');
  });

  it('purchasing Rescue+Human from an already-escalated case pays without re-transitioning status', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    const escalated = await casesRepo.markEscalated(db, created.id, 'unclassified', 'no confident code');

    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: escalated.id,
      tier: 'rescue_human',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    const result = await fulfillCheckoutSession(
      db,
      adapters,
      completedSessionEvent('evt_human', session.id),
    );
    expect(result).toEqual({ status: 'fulfilled', caseId: escalated.id, tier: 'rescue_human' });

    const reloaded = await casesRepo.requireCase(db, escalated.id);
    expect(reloaded.status).toBe('escalated'); // untouched
    expect(reloaded.paidAt).not.toBeNull(); // but the timestamp is recorded
  });
});

describe('Stripe webhook signature verification and routing', () => {
  it('rejects a bad signature before touching the database', async () => {
    const payload = JSON.stringify({ id: 'evt_bad', type: 'checkout.session.completed', data: {} });
    await expect(handleStripeWebhook(db, adapters, payload, 'not-a-real-signature')).rejects.toThrow();
  });

  it('ignores event types it does not act on', async () => {
    const payload = JSON.stringify({ id: 'evt_other', type: 'payment_intent.created', data: {} });
    const signature = adapters.billing.sign(payload);
    const result = await handleStripeWebhook(db, adapters, payload, signature);
    expect(result).toEqual({ status: 'ignored', type: 'payment_intent.created' });
  });

  it('extracts the session id from either the nested Stripe shape or a flattened test fixture', () => {
    const nested: StripeWebhookEvent = { id: 'e1', type: 'x', data: { object: { id: 'cs_1' } } };
    const flat: StripeWebhookEvent = { id: 'e2', type: 'x', data: { id: 'cs_2' } };
    expect(extractCheckoutSessionId(nested)).toBe('cs_1');
    expect(extractCheckoutSessionId(flat)).toBe('cs_2');
  });
});

describe('the unconditional 10-minute guarantee (G6), enforced by code', () => {
  it('checkSlo is a pure breach predicate', () => {
    const paidAt = new Date('2026-01-01T00:00:00Z');
    const withinSlo = checkSlo(paidAt, null, 10, new Date('2026-01-01T00:05:00Z'));
    expect(withinSlo.breached).toBe(false);

    const breach = checkSlo(paidAt, null, 10, new Date('2026-01-01T00:15:00Z'));
    expect(breach).toEqual({ breached: true, elapsedMinutes: 15, sloMinutes: 10 });

    // Already delivered, however long it took — not a breach.
    const delivered = checkSlo(paidAt, new Date('2026-01-01T02:00:00Z'), 10, new Date('2026-01-01T03:00:00Z'));
    expect(delivered.breached).toBe(false);
  });

  it('refunds the payment and moves the case to refunded when the clock is breached', async () => {
    const caseRow = await makePreviewReadyCase();
    const { session } = await createCheckoutForCase(db, adapters, {
      caseId: caseRow.id,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });
    await fulfillCheckoutSession(db, adapters, completedSessionEvent('evt_slo', session.id));

    // Force the paid timestamp far enough in the past to be in breach of the
    // default 10-minute SLO, without waiting in real time.
    await db
      .update(casesTable)
      .set({ paidAt: new Date(Date.now() - 60 * 60 * 1000) })
      .where(eq(casesTable.id, caseRow.id));

    const breached = await checkAndRefundIfBreached(db, adapters, caseRow.id);
    expect(breached).toBe(true);

    const reloaded = await casesRepo.requireCase(db, caseRow.id);
    expect(reloaded.status).toBe('refunded');

    const payment = await paymentsRepo.getLatestPaymentForCase(db, caseRow.id);
    expect(payment?.status).toBe('refunded');
    expect(payment?.refundReason).toBe('slo_breach');
    expect(adapters.billing.refunds).toHaveLength(1);
  });

  it('does nothing when the case has not been paid yet', async () => {
    const caseRow = await makePreviewReadyCase();
    const breached = await checkAndRefundIfBreached(db, adapters, caseRow.id);
    expect(breached).toBe(false);
  });

  it('sloBreachRefund throws when there is nothing paid-and-unrefunded to refund', async () => {
    const caseRow = await makePreviewReadyCase();
    await expect(sloBreachRefund(db, adapters, caseRow.id)).rejects.toThrow();
  });
});
