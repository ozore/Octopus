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
import { TIER_AMOUNT_CENTS, TIER_LABELS } from '../src/lib/billing/pricing';
import * as casesRepo from '../src/lib/db/repositories/cases';
import * as consentsRepo from '../src/lib/db/repositories/consents';
import * as paymentsRepo from '../src/lib/db/repositories/payments';
import * as shieldAccountsRepo from '../src/lib/db/repositories/shield-accounts';
import type { StripeWebhookEvent } from '../src/lib/adapters/stripe';
import type { Db } from '../src/lib/db';
import { cases as casesTable, scheduledEmails as scheduledEmailsTable } from '../src/lib/db/schema';
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
