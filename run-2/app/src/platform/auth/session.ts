/**
 * Sessions.
 *
 * Spec: ARCHITECTURE.md §11.5 (magic-link auth, hashed-at-rest tokens, no
 * passwords), §11.2 (two independent isolation mechanisms), ADR-011.
 *
 * The session row is the ONLY place a request's tenant comes from. It is written at
 * authentication time and never mutated to point somewhere else: a user who belongs
 * to two accounts holds two sessions. That is deliberate — a mutable "current
 * account" field turns tenancy into request state, and request state is exactly
 * what an attacker gets to influence.
 *
 * A3 note: nothing in this module can produce a contact affordance. An expired
 * session yields `{ ok: false, reason: 'expired' }`, and the screen that renders it
 * offers the one action that fixes it — send another link — because there is nobody
 * to email about it.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import {
  accountId as brandAccountId,
  withTenant,
  type AccountId,
  type TenantContext,
} from '../../db/tenant';
import { systemClock, type Clock } from '../clock';
import { hashToken, newId, newToken } from '../ids';

/** 14 days. Long enough that a weekly filer is not re-authenticating every Friday;
 *  short enough that a stolen laptop stops working inside a pay cycle. */
export const SESSION_TTL_DAYS = 14;

export const SESSION_COOKIE = 'rp_session';

export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly accountId: AccountId;
  readonly email: string;
  readonly expiresAt: Date;
}

export type SessionLookup =
  | { readonly ok: true; readonly session: Session }
  | { readonly ok: false; readonly reason: 'absent' | 'unknown' | 'expired' | 'revoked' };

export interface IssuedSession {
  /** Handed to the browser once, in a cookie. Never stored, never logged. */
  readonly token: string;
  readonly session: Session;
}

/**
 * Cookie attributes. `secure` is off only outside production, because a dev server
 * on http would otherwise drop the cookie and every local session would appear to
 * fail authentication for a reason nothing prints.
 */
export function sessionCookieOptions(
  expiresAt: Date,
  isProduction: boolean,
): {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: '/';
  readonly expires: Date;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    expires: expiresAt,
  };
}

export async function createSession(
  db: Db | Tx,
  input: { readonly userId: string; readonly accountId: string; readonly email: string },
  clock: Clock = systemClock,
): Promise<IssuedSession> {
  const token = newToken();
  const now = clock.now();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 86_400_000);
  const id = newId();

  await db.execute(sql`
    INSERT INTO auth_sessions (id, token_hash, user_id, account_id, email,
                               created_at, last_seen_at, expires_at)
    VALUES (${id}::uuid, ${hashToken(token)}, ${input.userId}::uuid, ${input.accountId}::uuid,
            ${input.email},
            ${now.toISOString()}::timestamptz, ${now.toISOString()}::timestamptz,
            ${expiresAt.toISOString()}::timestamptz)
  `);

  return {
    token,
    session: {
      id,
      userId: input.userId,
      accountId: brandAccountId(input.accountId),
      email: input.email,
      expiresAt,
    },
  };
}

interface SessionRow {
  readonly id: string;
  readonly user_id: string;
  readonly account_id: string;
  readonly email: string;
  readonly expires_at: string | Date;
  readonly revoked_at: string | Date | null;
}

/**
 * Resolve a bearer token to a session. The predicate is the token DIGEST, so the
 * table cannot be walked by guessing ids, and a leaked copy of it is not a set of
 * credentials.
 *
 * IT TOUCHES EXACTLY ONE TABLE, AND THAT IS THE POINT. This query runs on the pool
 * handle with no tenant context, because discovering the tenant is what it is for.
 * It therefore may not read any relation that carries a tenant policy. It used to
 * join `users` for the email, and `users` is scoped by membership against
 * `ratepin_current_account()` — which is NULL here — so on the NOBYPASSRLS role the
 * join matched nothing, every request resolved `unknown`, and the product was
 * reachable only as a superuser. The email now lives on the session row
 * (`src/platform/schema.ts`), and the rule is stated there: a pre-tenant relation is
 * never joined to a tenant-scoped one.
 */
export async function resolveSession(
  db: Db | Tx,
  token: string | undefined | null,
  clock: Clock = systemClock,
): Promise<SessionLookup> {
  if (!token) return { ok: false, reason: 'absent' };

  const result = await db.execute(sql`
    SELECT s.id, s.user_id, s.account_id, s.email, s.expires_at, s.revoked_at
      FROM auth_sessions s
     WHERE s.token_hash = ${hashToken(token)}
     LIMIT 1
  `);
  const row = rowsOf<SessionRow>(result)[0];
  if (!row) return { ok: false, reason: 'unknown' };
  if (row.revoked_at !== null) return { ok: false, reason: 'revoked' };

  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() <= clock.now().getTime()) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    session: {
      id: row.id,
      userId: row.user_id,
      accountId: brandAccountId(row.account_id),
      email: row.email,
      expiresAt,
    },
  };
}

/** Sign out. An UPDATE rather than a DELETE, so "this session ended and when" stays
 *  answerable; the hard delete happens at account deletion (§5.5). */
export async function revokeSession(db: Db | Tx, sessionId: string, clock: Clock = systemClock): Promise<void> {
  await db.execute(sql`
    UPDATE auth_sessions SET revoked_at = ${clock.now().toISOString()}::timestamptz
     WHERE id = ${sessionId}::uuid AND revoked_at IS NULL
  `);
}

export async function touchSession(db: Db | Tx, sessionId: string, clock: Clock = systemClock): Promise<void> {
  await db.execute(sql`
    UPDATE auth_sessions SET last_seen_at = ${clock.now().toISOString()}::timestamptz
     WHERE id = ${sessionId}::uuid
  `);
}

/** Every session for a user, for the deletion purge and for "sign out everywhere". */
export async function revokeAllSessionsForAccount(
  db: Db | Tx,
  account: string,
  clock: Clock = systemClock,
): Promise<number> {
  const result = await db.execute(sql`
    UPDATE auth_sessions SET revoked_at = ${clock.now().toISOString()}::timestamptz
     WHERE account_id = ${account}::uuid AND revoked_at IS NULL
  `);
  return rowsOf(result).length;
}

/**
 * The tenant context every repository requires (ADR-011, §11.2).
 *
 * It is derived from the session and from nothing else. There is no overload taking
 * an account id from a parameter, a header or a form field, because that overload is
 * how a per-object authorization check becomes a per-URL one (OWASP API1:2023).
 */
export function tenantContextFor(session: Session): TenantContext {
  return { accountId: session.accountId, userId: session.userId };
}

/**
 * Membership check — the second half of the boundary, in the one place a session's
 * account could ever have gone stale (a membership revoked after the session was
 * issued). RLS then makes the same statement a second time on every query.
 *
 * IT TAKES `Db` AND OPENS ITS OWN TENANT TRANSACTION. `memberships` is a
 * tenant-scoped relation, so the unscoped spelling this function used to carry
 * returned zero rows for every session on the application role — a check that
 * fails closed for everybody is not a check, and had it ever been called it would
 * have signed the whole customer base out. The context it sets is the session's own
 * account, which is the account the check is about; a session whose membership was
 * revoked sees no row and the caller treats that as `revoked`.
 */
export async function sessionStillAuthorized(db: Db, session: Session): Promise<boolean> {
  return withTenant(db, tenantContextFor(session), async (tx) => {
    const result = await tx.execute(sql`
      SELECT 1 FROM memberships
       WHERE account_id = ${session.accountId}::uuid AND user_id = ${session.userId}::uuid
       LIMIT 1
    `);
    return rowsOf(result).length > 0;
  });
}

/** What one purge removed, by class, so `retention.sweep` can report counts rather
 *  than a boolean. §7.1: "deletes are idempotent and logged as COUNTS." */
export interface PurgeCounts {
  readonly sessions: number;
  readonly magicLinks: number;
  readonly outboxPayloads: number;
}

/**
 * Purge expired and revoked rows. **Called by `retention.sweep`** — and that was
 * the whole of NEW-4: this function existed, was correct, and had zero production
 * callers, so dead sessions and consumed links accumulated forever. Deleting a dead
 * session is not a state change anyone can observe, which is why it is a sweep and
 * not an event.
 *
 * The third statement is not about sessions. `email_outbox` is a fleet surface —
 * outside RLS, readable by the whole web tier — and §5.4's minimisation rule applies
 * to it like anything else: once a message is sent, its payload has done its job. It
 * is no longer the last line of defence for security C-3 (a payload can no longer
 * contain a redeemable token: `_actions/auth.ts` queues a reference,
 * `assertNoRedeemableToken` refuses anything else, and the token is minted inside
 * the send), but a permanent record of who was mailed what is worth not keeping.
 */
export async function purgeDeadSessions(
  db: Db | Tx,
  clock: Clock = systemClock,
): Promise<PurgeCounts> {
  const sessions = await db.execute(sql`
    DELETE FROM auth_sessions
     WHERE expires_at < ${clock.now().toISOString()}::timestamptz
        OR revoked_at IS NOT NULL
    RETURNING id
  `);
  const magicLinks = await db.execute(sql`
    DELETE FROM auth_magic_links
     WHERE expires_at < ${clock.now().toISOString()}::timestamptz
        OR consumed_at IS NOT NULL
    RETURNING id
  `);
  const payloads = await db.execute(sql`
    UPDATE email_outbox
       SET payload = '{}'::jsonb
     WHERE sent_at IS NOT NULL AND payload <> '{}'::jsonb
    RETURNING id
  `);
  return {
    sessions: rowsOf(sessions).length,
    magicLinks: rowsOf(magicLinks).length,
    outboxPayloads: rowsOf(payloads).length,
  };
}
