/**
 * Shield-account repository.
 *
 * Spec: ADR-006, D6. I4: an account is an opaque ingest token and nothing
 * else — no credential, cookie or session ever lives on this row. The token
 * is generated here (not accepted from a caller) so there is exactly one code
 * path that can mint one, and it never derives from an email address or
 * merchant token (schema.ts comment on `shield_accounts`).
 */

import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { shieldAccounts } from '../schema';
import type { NewShieldAccount, ShieldAccount } from './types';

export function generateIngestToken(): string {
  return randomBytes(16).toString('hex');
}

export async function createShieldAccount(
  db: Db,
  input: Omit<NewShieldAccount, 'ingestToken'> & { ingestToken?: string },
): Promise<ShieldAccount> {
  const ingestToken = input.ingestToken ?? generateIngestToken();
  const [created] = await db
    .insert(shieldAccounts)
    .values({ ...input, ingestToken })
    .returning();
  if (!created) throw new Error('createShieldAccount: insert returned no row');
  return created;
}

export async function getShieldAccountByToken(
  db: Db,
  ingestToken: string,
): Promise<ShieldAccount | undefined> {
  const rows = await db
    .select()
    .from(shieldAccounts)
    .where(eq(shieldAccounts.ingestToken, ingestToken))
    .limit(1);
  return rows[0];
}

export async function getShieldAccountById(db: Db, id: string): Promise<ShieldAccount | undefined> {
  const rows = await db.select().from(shieldAccounts).where(eq(shieldAccounts.id, id)).limit(1);
  return rows[0];
}

export async function getShieldAccountForCase(
  db: Db,
  caseId: string,
): Promise<ShieldAccount | undefined> {
  const rows = await db.select().from(shieldAccounts).where(eq(shieldAccounts.caseId, caseId)).limit(1);
  return rows[0];
}

/** S15 "keep": the renewal decision at the moment of relief (D6, peak-end
 *  rule) resolves to a Stripe-managed recurring subscription; we only record
 *  the resulting id, per ADR-007 "no subscription state machine". */
export async function attachShieldSubscription(
  db: Db,
  id: string,
  stripeSubscriptionId: string,
): Promise<void> {
  await db.update(shieldAccounts).set({ stripeSubscriptionId }).where(eq(shieldAccounts.id, id));
}

/** S17: one click, no penalty framing (USER_JOURNEY.md §3 S17). */
export async function cancelShieldAccount(db: Db, id: string): Promise<void> {
  await db.update(shieldAccounts).set({ cancelledAt: new Date() }).where(eq(shieldAccounts.id, id));
}
