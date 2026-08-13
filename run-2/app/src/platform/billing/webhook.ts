/**
 * The webhook — the only input that moves entitlement state.
 *
 * Spec: ARCHITECTURE.md ADR-007 ("Stripe is the source of truth for money; webhooks
 * decide, we record"), §9.1, §11.5 ("Stripe webhook signatures verified before the
 * body is parsed"), §7.1 `billing.replay` ("re-read Stripe `/v1/events` and replay
 * anything unprocessed — idempotent on `stripe_events.id`").
 *
 * THREE ORDERING RULES, EACH FOR A REASON THAT HAS BITTEN SOMEBODY:
 *
 * 1. **Verify before parse.** An unverified body is attacker-controlled JSON that
 *    moves money. `verifyStripeSignature` takes the raw string, and the parse
 *    happens after it returns ok.
 *
 * 2. **Record before process.** The ledger insert is `ON CONFLICT (id) DO NOTHING`,
 *    so a redelivery — Stripe retries for up to three days — is recognised as one it
 *    has already seen. The credits and refunds each carry their own idempotency key
 *    as well, because "we saw this event" and "we performed this effect" are
 *    different facts and only the second one protects the customer.
 *
 * 3. **Process, then stamp `processed_at`.** A handler that throws leaves the row
 *    unprocessed, which is exactly what the daily replay looks for. Stamping first
 *    would convert a transient failure into permanent silence.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '../../db';
import { Cents } from '../../lib/money';
import { systemClock, type Clock } from '../clock';
import { linkStripeCustomer, applySubscriptionState, findAccountByCustomer } from './account';
import { planIdForPrice, loadPlan } from './catalog';
import { recordRateCardPurchase, type BillingConfig } from './checkout';
import { isHardDecline, type StripeSubscriptionStatus } from './entitlement';
import { queueEmail } from '../ops/outbox';
import {
  verifyStripeSignature,
  type StripeEventEnvelope,
  type StripeGateway,
} from './gateway';

export interface WebhookDeps {
  readonly stripe: StripeGateway;
  readonly config: BillingConfig & { readonly STRIPE_WEBHOOK_SECRET?: string };
  readonly clock?: Clock;
}

export type WebhookResult =
  | { readonly ok: true; readonly eventId: string; readonly duplicate: boolean; readonly handled: boolean }
  | { readonly ok: false; readonly status: 400 | 401; readonly reason: string };

/**
 * The route handler's whole body. Takes the RAW request text, never a parsed object,
 * because the signature covers bytes and a re-serialised object is not those bytes.
 */
export async function handleStripeWebhook(
  db: Db,
  input: { readonly payload: string; readonly signature: string | null },
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const clock = deps.clock ?? systemClock;
  const secret = deps.config.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, status: 401, reason: 'webhook secret not configured' };
  if (!input.signature) return { ok: false, status: 401, reason: 'missing signature header' };

  const verified = verifyStripeSignature({
    payload: input.payload,
    header: input.signature,
    secret,
    nowSeconds: Math.floor(clock.now().getTime() / 1000),
  });
  if (!verified.ok) return { ok: false, status: 401, reason: verified.reason };

  let envelope: StripeEventEnvelope;
  try {
    envelope = JSON.parse(input.payload) as StripeEventEnvelope;
  } catch {
    return { ok: false, status: 400, reason: 'body is not JSON' };
  }
  if (typeof envelope.id !== 'string' || typeof envelope.type !== 'string') {
    return { ok: false, status: 400, reason: 'body is not a Stripe event' };
  }

  const recorded = await recordStripeEvent(db, envelope, clock);
  if (recorded.duplicate) {
    return { ok: true, eventId: envelope.id, duplicate: true, handled: false };
  }

  const handled = await processStripeEvent(db, envelope, deps);
  return { ok: true, eventId: envelope.id, duplicate: false, handled };
}

export async function recordStripeEvent(
  db: Db,
  envelope: StripeEventEnvelope,
  clock: Clock = systemClock,
): Promise<{ readonly duplicate: boolean }> {
  const result = await db.execute(sql`
    INSERT INTO stripe_events (id, type, payload, received_at)
    VALUES (${envelope.id}, ${envelope.type}, ${JSON.stringify(envelope)}::jsonb,
            ${clock.now().toISOString()}::timestamptz)
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `);
  return { duplicate: rowsOf(result).length === 0 };
}

/**
 * Dispatch. Unhandled types are recorded and marked processed — an event we do not
 * act on is not an error, and treating it as one would make the replay job chew the
 * same rows forever.
 */
export async function processStripeEvent(
  db: Db,
  envelope: StripeEventEnvelope,
  deps: WebhookDeps,
): Promise<boolean> {
  const clock = deps.clock ?? systemClock;
  let handled = false;
  try {
    switch (envelope.type) {
      case 'checkout.session.completed':
        handled = await onCheckoutCompleted(db, envelope, deps);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        handled = await onSubscriptionChanged(db, envelope, deps);
        break;
      case 'invoice.payment_failed':
        handled = await onPaymentFailed(db, envelope, deps);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.paid':
        handled = await onPaymentSucceeded(db, envelope, deps);
        break;
      case 'charge.dispute.created':
        handled = await onDisputeOpened(db, envelope, deps);
        break;
      default:
        handled = false;
    }
  } catch (error) {
    await db.execute(sql`
      UPDATE stripe_events SET error = ${String(error)} WHERE id = ${envelope.id}
    `);
    throw error;
  }

  await db.execute(sql`
    UPDATE stripe_events SET processed_at = ${clock.now().toISOString()}::timestamptz, error = NULL
     WHERE id = ${envelope.id}
  `);
  return handled;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function onCheckoutCompleted(
  db: Db,
  envelope: StripeEventEnvelope,
  deps: WebhookDeps,
): Promise<boolean> {
  const object = envelope.data.object;
  const mode = str(object['mode']);
  const customerId = str(object['customer']);
  const accountId = str(object['client_reference_id']);
  const email = str(object['customer_email']) ?? str(object['customer_details'], 'email');
  const clock = deps.clock ?? systemClock;

  if (mode === 'payment') {
    // J3 — bought before an account exists. There is nothing to attach it to yet and
    // that is the point; `claimRateCardPurchases` does it on first sign-in.
    if (!email) return false;
    await recordRateCardPurchase(
      db,
      {
        sessionId: str(object['id']) ?? envelope.id,
        email,
        cents: num(object['amount_total']) ?? undefined,
      },
      clock,
    );
    return true;
  }

  if (accountId && customerId) {
    await linkStripeCustomer(db, accountId, customerId, clock);
    return true;
  }
  return false;
}

async function onSubscriptionChanged(
  db: Db,
  envelope: StripeEventEnvelope,
  deps: WebhookDeps,
): Promise<boolean> {
  const object = envelope.data.object;
  const customerId = str(object['customer']);
  if (!customerId) return false;

  const account =
    (await findAccountByCustomer(db, customerId)) ??
    (await accountFromMetadata(db, object, customerId, deps));
  if (!account) return false;

  const priceId = subscriptionPriceId(object);
  const planId = planIdForPrice(priceId, deps.config);
  const plan = await loadPlan(db, planId);
  const status = (str(object['status']) ?? 'incomplete') as StripeSubscriptionStatus;

  await applySubscriptionState(
    db,
    {
      accountId: account.accountId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: str(object['id']),
      planId,
      priceCents: plan?.priceCents ?? Cents.of(0),
      status: envelope.type === 'customer.subscription.deleted' ? 'canceled' : status,
      currentPeriodStart: epoch(object['current_period_start']),
      currentPeriodEnd: epoch(object['current_period_end']),
      cancelAtPeriodEnd: object['cancel_at_period_end'] === true,
    },
    deps.clock ?? systemClock,
  );
  return true;
}

async function onPaymentFailed(db: Db, envelope: StripeEventEnvelope, deps: WebhookDeps): Promise<boolean> {
  const object = envelope.data.object;
  const customerId = str(object['customer']);
  if (!customerId) return false;
  const account = await findAccountByCustomer(db, customerId);
  if (!account) return false;

  const declineCode =
    str(object['last_payment_error'], 'decline_code') ?? str(object, 'last_finalization_error');
  const hard = isHardDecline(declineCode);

  // The state itself moves on `customer.subscription.updated`; this event exists so
  // the customer hears the right sentence. §9.2: hard declines are not retryable by
  // Stripe, so the copy switches from "we'll try again" to "we need a new card".
  await queueEmail(
    db,
    {
      accountId: account.accountId,
      template: hard ? 'dunning_hard_decline' : 'dunning_payment_failed',
      payload: { invoice_id: str(object['id']), decline_code: declineCode },
      idempotencyKey: `dunning:${str(object['id']) ?? envelope.id}:${hard ? 'hard' : 'soft'}`,
    },
    deps.clock ?? systemClock,
  );
  return true;
}

async function onPaymentSucceeded(db: Db, envelope: StripeEventEnvelope, deps: WebhookDeps): Promise<boolean> {
  const customerId = str(envelope.data.object['customer']);
  if (!customerId) return false;
  const account = await findAccountByCustomer(db, customerId);
  if (!account) return false;

  // A successful payment does not itself carry the subscription's new status, so the
  // authoritative move still arrives on `customer.subscription.updated`. What this
  // does is stop the dunning sequence immediately rather than a webhook later.
  await db.execute(sql`
    DELETE FROM email_outbox
     WHERE account_id = ${account.accountId}::uuid
       AND sent_at IS NULL
       AND template LIKE 'dunning_%'
  `);
  return true;
}

/**
 * A chargeback. USER_JOURNEY §11.7: "Subscription cancelled, archive export link
 * emailed immediately, dunning stops. We do not dun a customer who is disputing."
 * Note what is NOT here: no data deletion, no archive closure.
 */
async function onDisputeOpened(db: Db, envelope: StripeEventEnvelope, deps: WebhookDeps): Promise<boolean> {
  const customerId = str(envelope.data.object['customer']);
  if (!customerId) return false;
  const account = await findAccountByCustomer(db, customerId);
  if (!account) return false;
  const clock = deps.clock ?? systemClock;

  await db.execute(sql`
    DELETE FROM email_outbox
     WHERE account_id = ${account.accountId}::uuid AND sent_at IS NULL AND template LIKE 'dunning_%'
  `);
  await queueEmail(
    db,
    {
      accountId: account.accountId,
      template: 'archive_export_link',
      payload: { reason: 'dispute_opened' },
      idempotencyKey: `dispute:${envelope.id}`,
    },
    clock,
  );
  return true;
}

async function accountFromMetadata(
  db: Db,
  object: Record<string, unknown>,
  customerId: string,
  deps: WebhookDeps,
): Promise<{ readonly accountId: string } | null> {
  const metadata = object['metadata'];
  const accountId =
    metadata && typeof metadata === 'object' ? str(metadata as Record<string, unknown>, 'account_id') : null;
  if (!accountId) return null;
  await linkStripeCustomer(db, accountId, customerId, deps.clock ?? systemClock);
  return { accountId };
}

// ---------------------------------------------------------------------------
// Replay — §7.1 `billing.replay`, daily
// ---------------------------------------------------------------------------

/**
 * Re-read `/v1/events` and process anything the ledger has not marked processed.
 *
 * This is what makes a missed webhook a latency problem rather than a stuck
 * customer, and it is idempotent on the event id in two places: the ledger insert
 * and every effect's own key.
 */
export async function replayStripeEvents(
  db: Db,
  deps: WebhookDeps,
  options?: { readonly limit?: number },
): Promise<{ readonly fetched: number; readonly processed: number }> {
  const last = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM stripe_events ORDER BY received_at DESC LIMIT 1`),
  )[0];

  const events = await deps.stripe.listEventsSince({
    ...(last ? { after: last.id } : {}),
    limit: options?.limit ?? 100,
  });

  let processed = 0;
  for (const envelope of events) {
    const recorded = await recordStripeEvent(db, envelope, deps.clock ?? systemClock);
    if (recorded.duplicate) {
      const unprocessed = rowsOf(
        await db.execute(sql`
          SELECT id FROM stripe_events WHERE id = ${envelope.id} AND processed_at IS NULL
        `),
      );
      if (unprocessed.length === 0) continue;
    }
    await processStripeEvent(db, envelope, deps);
    processed += 1;
  }
  return { fetched: events.length, processed };
}

/** Rows the ledger holds but never finished. Surfaced on the status page as a count,
 *  never as an alert (I7 — there is nobody to alert). */
export async function unprocessedEventCount(db: Db): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM stripe_events WHERE processed_at IS NULL
  `);
  return Number(rowsOf<{ n: number }>(result)[0]?.n ?? 0);
}

// ---------------------------------------------------------------------------

function str(value: unknown, key?: string): string | null {
  if (key) {
    if (!value || typeof value !== 'object') return null;
    const inner = (value as Record<string, unknown>)[key];
    return typeof inner === 'string' ? inner : null;
  }
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function epoch(value: unknown): Date | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null;
}

function subscriptionPriceId(object: Record<string, unknown>): string | null {
  const items = object['items'];
  if (!items || typeof items !== 'object') return null;
  const data = (items as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const price = (item as { price?: unknown }).price;
    if (price && typeof price === 'object') {
      const id = (price as { id?: unknown }).id;
      if (typeof id === 'string') return id;
    }
  }
  return null;
}
