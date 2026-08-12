/**
 * Customer repository.
 *
 * Spec: ARCHITECTURE.md §3.1 / N4 — a `customer` is a Stripe-side identity
 * captured at Checkout, never a login. This repository never accepts a
 * password, session token or credential, matching I4's "no code path accepts
 * one" for the marketplace side of the product.
 */

import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { customers } from '../schema';
import type { NewCustomer, Customer } from './types';

export async function findOrCreateCustomerByEmail(
  db: Db,
  input: { email: string; stripeCustomerId?: string | null },
): Promise<Customer> {
  const existing = await db.select().from(customers).where(eq(customers.email, input.email)).limit(1);
  const found = existing[0];
  if (found) {
    if (input.stripeCustomerId && found.stripeCustomerId !== input.stripeCustomerId) {
      const [updated] = await db
        .update(customers)
        .set({ stripeCustomerId: input.stripeCustomerId })
        .where(eq(customers.id, found.id))
        .returning();
      return updated ?? found;
    }
    return found;
  }

  const insert: NewCustomer = {
    email: input.email,
    stripeCustomerId: input.stripeCustomerId ?? null,
  };
  const [created] = await db.insert(customers).values(insert).returning();
  if (!created) throw new Error('findOrCreateCustomerByEmail: insert returned no row');
  return created;
}

export async function getCustomerById(db: Db, id: string): Promise<Customer | undefined> {
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0];
}

export async function getCustomerByStripeId(
  db: Db,
  stripeCustomerId: string,
): Promise<Customer | undefined> {
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return rows[0];
}

/**
 * GDPR/CCPA baseline (ADR-008 ¶4): deletion is a modelled state, not a
 * support ticket. The email is scrubbed rather than the row removed, so
 * foreign keys from `payments`/`shield_accounts` stay valid for accounting.
 */
export async function deleteCustomerPii(db: Db, id: string): Promise<void> {
  await db
    .update(customers)
    .set({ email: `deleted+${id}@clausewright.invalid`, deletedAt: new Date() })
    .where(eq(customers.id, id));
}
