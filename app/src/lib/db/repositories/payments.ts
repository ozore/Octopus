/**
 * Payment repository.
 *
 * Spec: ARCHITECTURE.md §3.5 / ADR-007. `stripe_session_id` is unique, so a
 * Checkout redirect landing twice (browser back-button, retry) inserts at
 * most one pending row — the row is created when the session is opened, not
 * when the webhook fires, matching "webhooks are the source of truth" for the
 * PAID transition while still tracking sessions that never convert.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { payments } from '../schema';
import type { NewPayment, Payment } from './types';

export async function insertPendingPayment(db: Db, input: NewPayment): Promise<Payment> {
  const [created] = await db
    .insert(payments)
    .values({ ...input, status: input.status ?? 'pending' })
    .returning();
  if (!created) throw new Error('insertPendingPayment: insert returned no row');
  return created;
}

export async function getPaymentBySessionId(
  db: Db,
  stripeSessionId: string,
): Promise<Payment | undefined> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.stripeSessionId, stripeSessionId))
    .limit(1);
  return rows[0];
}

export async function getLatestPaymentForCase(db: Db, caseId: string): Promise<Payment | undefined> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.caseId, caseId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return rows[0];
}

export async function markPaymentPaid(
  db: Db,
  stripeSessionId: string,
  fields: { stripePaymentIntentId?: string; stripeCustomerId?: string; paidAt?: Date },
): Promise<Payment | undefined> {
  const [updated] = await db
    .update(payments)
    .set({
      status: 'paid',
      paidAt: fields.paidAt ?? new Date(),
      ...(fields.stripePaymentIntentId ? { stripePaymentIntentId: fields.stripePaymentIntentId } : {}),
      ...(fields.stripeCustomerId ? { stripeCustomerId: fields.stripeCustomerId } : {}),
    })
    .where(eq(payments.stripeSessionId, stripeSessionId))
    .returning();
  return updated;
}

/** The 10-minute unconditional guarantee, enforced by code (§3.5, G6): the
 *  refund job calls this after `adapters.billing.refund()` succeeds. */
export async function markPaymentRefunded(
  db: Db,
  paymentId: string,
  reason: string,
  refundedAt: Date = new Date(),
): Promise<Payment | undefined> {
  const [updated] = await db
    .update(payments)
    .set({ status: 'refunded', refundedAt, refundReason: reason })
    .where(eq(payments.id, paymentId))
    .returning();
  return updated;
}
