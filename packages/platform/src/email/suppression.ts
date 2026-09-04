/**
 * The suppression list. A hard bounce, a complaint or an unsubscribe lands
 * here, and `send()` refuses the address afterwards — including for a job that
 * was enqueued before the suppression existed, which is the case a
 * check-at-enqueue-time design gets wrong.
 */

import { eq, inArray } from 'drizzle-orm';

import type { Db } from '../db';
import { emailSuppressions } from '../db/schema';
import { normaliseEmail } from '../auth/normalise';

export type SuppressionReason = 'bounce' | 'complaint' | 'unsubscribe' | 'manual';

export async function suppressEmail(
  db: Db,
  input: { email: string; reason: SuppressionReason; note?: string },
): Promise<void> {
  await db
    .insert(emailSuppressions)
    .values({
      email: normaliseEmail(input.email),
      reason: input.reason,
      note: input.note ?? null,
    })
    .onConflictDoNothing();
}

export async function unsuppressEmail(db: Db, email: string): Promise<void> {
  await db.delete(emailSuppressions).where(eq(emailSuppressions.email, normaliseEmail(email)));
}

export async function isSuppressed(db: Db, email: string): Promise<boolean> {
  const rows = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(eq(emailSuppressions.email, normaliseEmail(email)))
    .limit(1);
  return rows.length > 0;
}

export async function listSuppressed(db: Db, emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const normalised = emails.map(normaliseEmail);
  const rows = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(inArray(emailSuppressions.email, normalised));
  return new Set(rows.map((r) => r.email));
}
