/**
 * THE SESSION BOUNDARY for every authenticated screen.
 *
 * AUTHORITY: `ARCHITECTURE.md` §11.5 (magic link, no password, therefore no
 * password-reset flow, "one fewer support surface that does not exist"), §11.2 and
 * ADR-011 (the tenant context is transaction-scoped and every tenant query runs
 * inside `withTenant`), `USER_JOURNEY.md` §4.1 ("Signup is an email address").
 *
 * TWO RULES THIS MODULE EXISTS TO KEEP
 *
 * 1. **A screen never reads a cookie itself.** One function resolves the session, so
 *    the failure modes — absent, unknown, expired, revoked — are handled in one
 *    place and every one of them lands on `/signin` with a sentence, never on an
 *    error page and never on a request to write to anybody.
 * 2. **A screen never opens an unscoped transaction.** `readAs`/`writeAs` take the
 *    session and hand the callback a `Tx` that already carries the tenant GUC.
 *    Forgetting the context is a zero-row bug rather than a leak (`src/db/tenant.ts`),
 *    and these helpers make forgetting it awkward.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDb, type Db, type Tx } from '@/db';
import { withTenant } from '@/db/tenant';
import { SESSION_COOKIE, resolveSession, type Session } from '@/platform/auth/session';

import { appClock } from './deps';

export type { Session };

/** The session, or `null`. Used by surfaces that are legitimately reachable signed
 *  out — the rate-card configurator, which takes money without an account (D4). */
export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const db = await getDb();
  const lookup = await resolveSession(db, token, appClock());
  return lookup.ok ? lookup.session : null;
}

/**
 * The session, or a redirect to `/signin`.
 *
 * The `next` parameter carries the screen she was trying to reach, so signing in
 * returns her to it rather than to a dashboard — heuristic #6 applied to the least
 * interesting screen in the product.
 */
export async function requireSession(next?: string): Promise<Session> {
  const session = await currentSession();
  if (session) return session;
  const target = next === undefined ? '/signin' : `/signin?next=${encodeURIComponent(next)}`;
  redirect(target);
}

/** A tenant-scoped read. Nothing in this route group queries a tenant table any
 *  other way. */
export async function readAs<T>(session: Session, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const db = await getDb();
  return withTenant(db, { accountId: session.accountId, userId: session.userId }, fn);
}

/** A tenant-scoped write. Identical to `readAs` and named differently on purpose:
 *  the two are the same mechanism and a reader should be able to see which one a
 *  screen is doing without reading the callback. */
export async function writeAs<T>(session: Session, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return readAs(session, fn);
}

export async function db(): Promise<Db> {
  return getDb();
}
