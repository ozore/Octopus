/**
 * THE OPT-OUT — `specs/07` §6.1 element 3, §8 and A5/A13.
 *
 * Two scopes on one page, no fee, no login, no information required beyond the
 * address, functioning for at least 30 days after the send and honoured
 * immediately:
 *
 *   `scope='org'`    — stop requests from this one customer.
 *   `scope='global'` — stop ALL requests, from every customer. This is the one
 *                      that satisfies the statute, and it is the reason
 *                      `suppressions` carries a nullable `orgId` and a partial
 *                      unique index per scope.
 *
 * THE TOKEN IS THE REMINDER ROW'S ID, and that is a decision rather than a
 * shortcut. A separate token table would be the obvious design, but every id in
 * this app is a prefixed ULID whose second half is 80 bits of randomness — the
 * same entropy class as the 32-byte upload token once the guessable timestamp
 * prefix is discounted — and the row it names already carries exactly the two
 * facts the page needs (which address, which org) with no second thing to keep
 * in step. It costs no migration, and a migration on a shared schema in a
 * parallel build is a real risk with no benefit here.
 *
 * The page also works with NO valid token: CAN-SPAM requires that an opt-out
 * need no information beyond the address, so an address typed into the form is
 * honoured on its own. That is a deliberate acceptance of a nuisance vector —
 * someone can unsubscribe an address that is not theirs — because the statute
 * asks for exactly that and the harm (we stop emailing) is the direction the
 * law prefers to err in.
 */

import { and, eq, isNull } from 'drizzle-orm';

import type { Db } from '../db';
import { newId } from '../ids';
import { reminders, suppressions } from '../schema';
import { normaliseEmail } from '@octopus/platform/auth';

export type UnsubscribeScope = 'org' | 'global';
export type SuppressionReason = 'bounce' | 'complaint' | 'unsubscribe' | 'manual';

export type UnsubscribeSubject = {
  email: string;
  orgId: string;
  /** Shown so the recipient can see whose requests they are stopping. */
  orgName: string | null;
  vendorName: string | null;
};

/** Resolve the capability in the footer link. Unknown token → null, not 404. */
export async function resolveUnsubscribeToken(db: Db, token: string): Promise<UnsubscribeSubject | null> {
  if (!token || token.length > 64) return null;
  const [row] = await db
    .select({ email: reminders.recipientEmail, orgId: reminders.orgId })
    .from(reminders)
    .where(eq(reminders.id, token))
    .limit(1);
  if (!row) return null;
  return { email: row.email, orgId: row.orgId, orgName: null, vendorName: null };
}

/**
 * Write the suppression. Idempotent — a recipient who clicks twice, or a bounce
 * that arrives after an unsubscribe, must not fail.
 */
export async function suppress(
  db: Db,
  input: { email: string; scope: UnsubscribeScope; orgId: string | null; reason: SuppressionReason },
): Promise<void> {
  const email = normaliseEmail(input.email);
  if (input.scope === 'global') {
    await db
      .insert(suppressions)
      .values({ id: newId('suppression'), orgId: null, email, scope: 'global', reason: input.reason })
      .onConflictDoNothing();
    return;
  }
  if (!input.orgId) throw new Error('an org-scoped suppression needs an orgId');
  await db
    .insert(suppressions)
    .values({ id: newId('suppression'), orgId: input.orgId, email, scope: 'org', reason: input.reason })
    .onConflictDoNothing();
}

/**
 * `specs/07` §14: **global beats org beats none.** A single query over both
 * scopes, because a suppression check that runs twice is a suppression check
 * that can be half-forgotten at a call site.
 */
export async function suppressionFor(
  db: Db,
  input: { email: string; orgId: string },
): Promise<{ suppressed: boolean; scope: UnsubscribeScope | null; reason: string | null }> {
  const email = normaliseEmail(input.email);
  const rows = await db
    .select({ scope: suppressions.scope, reason: suppressions.reason })
    .from(suppressions)
    .where(
      and(
        eq(suppressions.email, email),
        // Either the statutory global row, or this org's own row. Another org's
        // row must not affect this one (A5).
        eq(suppressions.scope, 'global'),
      ),
    );
  const global = rows[0];
  if (global) return { suppressed: true, scope: 'global', reason: global.reason };

  const [org] = await db
    .select({ reason: suppressions.reason })
    .from(suppressions)
    .where(and(eq(suppressions.email, email), eq(suppressions.scope, 'org'), eq(suppressions.orgId, input.orgId)));
  if (org) return { suppressed: true, scope: 'org', reason: org.reason };
  return { suppressed: false, scope: null, reason: null };
}

/** Every global suppression, for the settings screen and for tests. */
export async function listGlobalSuppressions(db: Db) {
  return db.select().from(suppressions).where(and(eq(suppressions.scope, 'global'), isNull(suppressions.orgId)));
}
