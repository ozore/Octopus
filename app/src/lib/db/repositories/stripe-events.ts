/**
 * Stripe webhook idempotency repository.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007 — "the webhook handler is idempotent on
 * `event.id`." `stripeEvents.id` IS the Stripe event id and carries a primary
 * key (== unique) constraint; that constraint is the entire mechanism. Stripe
 * retries the same event on a timeout or a 5xx, and a double-fulfilment would
 * double-send the outcome sequence and poison L4 (ADR-007 "positive").
 */

import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { stripeEvents } from '../schema';
import type { NewStripeEventRow, StripeEventRow } from './types';

/**
 * Read-only replay check. Used as a cheap pre-check before the fulfilment
 * transaction opens, so an obvious Stripe retry costs one SELECT rather than a
 * transaction; it is deliberately NOT the authoritative claim, which
 * `recordStripeEventIfNew` takes inside that transaction so a rolled-back
 * fulfilment releases it (see `billing/fulfillment.ts`).
 */
export async function getStripeEvent(db: Db, id: string): Promise<StripeEventRow | undefined> {
  const rows = await db.select().from(stripeEvents).where(eq(stripeEvents.id, id)).limit(1);
  return rows[0];
}

/**
 * Returns `{ isNew: true }` and persists the row on first sight; returns
 * `{ isNew: false }` on a replay without touching anything else. Uses
 * `onConflictDoNothing` rather than a caught unique-violation exception so the
 * happy and replay paths are one query, not a query plus a try/catch.
 */
export async function recordStripeEventIfNew(
  db: Db,
  input: NewStripeEventRow,
): Promise<{ isNew: boolean; row: StripeEventRow | undefined }> {
  const inserted = await db
    .insert(stripeEvents)
    .values(input)
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning();

  if (inserted[0]) return { isNew: true, row: inserted[0] };

  const existing = await db.select().from(stripeEvents).where(eq(stripeEvents.id, input.id)).limit(1);
  return { isNew: false, row: existing[0] };
}
