/**
 * Passwordless sign-in, and the whole of account provisioning.
 *
 * Spec: PLAN.md A1 — "signup … happen[s] with no human on the seller side. No
 * demos, no onboarding calls, NO MANUAL ACCOUNT PROVISIONING." ARCHITECTURE.md
 * §11.5 — "single-use, short-expiry, hashed-at-rest tokens; no passwords to leak."
 * D3 — the free tier needs no account at all, so nothing here is on the path to the
 * free WH-347 generator or the county × craft pages.
 *
 * REDEMPTION IS THE PROVISIONING STEP. A first-time redemption creates the user,
 * the account, the owner membership and the billing index row in ONE transaction.
 * There is no queue, no approval, no "we'll set you up" — the absence of a
 * provisioning table is the mechanism, exactly as §15 puts it for the review queue
 * that also does not exist.
 *
 * WHY THE OUTCOME IS NOT A `Refusal`. USER_JOURNEY §0.3 closes the refusal set at
 * four primitives and says a proposed fifth is "either a bug we should fix rather
 * than surface, or a request for a human, which is out of bounds." An expired login
 * link is neither: it is an ordinary state with an in-product fix (send another),
 * and dressing it as a compliance refusal would put a login error into the same
 * vocabulary as a withheld federal signature block. So it is its own small union.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { systemClock, type Clock } from '../clock';
import { hashToken, newId, newToken } from '../ids';
import { createSession, type IssuedSession } from './session';

/** 15 minutes. Short enough that a forwarded mail is usually already dead; long
 *  enough for a mail chain that adds a minute of greylisting. */
export const MAGIC_LINK_TTL_MINUTES = 15;

export interface MagicLinkRequest {
  readonly email: string;
  /** Set when the link is an invitation into an existing account. */
  readonly accountId?: string | null;
}

export interface IssuedMagicLink {
  readonly id: string;
  /** The URL to mail. The token appears here and nowhere else — not in the
   *  database, not in a log line, not in the outbox payload. */
  readonly url: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly email: string;
}

export type RedeemOutcome =
  | { readonly ok: true; readonly issued: IssuedSession; readonly createdAccount: boolean }
  | { readonly ok: false; readonly reason: 'unknown' | 'expired' | 'consumed' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

/**
 * Mint a link. The row stores the DIGEST; the caller mails the URL and then has no
 * way to recover it, which is the property that makes a database leak not a
 * takeover.
 */
export async function requestMagicLink(
  db: Db | Tx,
  request: MagicLinkRequest,
  options: { readonly baseUrl: string; readonly clock?: Clock },
): Promise<IssuedMagicLink> {
  const email = normalizeEmail(request.email);
  if (!isEmail(email)) throw new TypeError(`requestMagicLink: not an email address`);

  const clock = options.clock ?? systemClock;
  const now = clock.now();
  const expiresAt = new Date(now.getTime() + MAGIC_LINK_TTL_MINUTES * 60_000);
  const token = newToken();
  const id = newId();

  await db.execute(sql`
    INSERT INTO auth_magic_links (id, email, token_hash, created_at, expires_at, account_id)
    VALUES (${id}::uuid, ${email}, ${hashToken(token)},
            ${now.toISOString()}::timestamptz, ${expiresAt.toISOString()}::timestamptz,
            ${request.accountId ?? null}::uuid)
  `);

  const url = new URL('/auth/callback', options.baseUrl);
  url.searchParams.set('token', token);

  return { id, url: url.toString(), token, expiresAt, email };
}

interface LinkRow {
  readonly id: string;
  readonly email: string;
  readonly expires_at: string | Date;
  readonly consumed_at: string | Date | null;
  readonly account_id: string | null;
}

/**
 * Redeem a link, provisioning on first use.
 *
 * Single-use is enforced by a conditional UPDATE rather than by read-then-write:
 * two clicks arriving together (a mail client prefetching the link, then the human
 * clicking it) would otherwise both pass the read and both mint a session.
 */
export async function redeemMagicLink(
  db: Db | Tx,
  token: string,
  options?: { readonly clock?: Clock; readonly accountName?: string },
): Promise<RedeemOutcome> {
  const clock = options?.clock ?? systemClock;
  const now = clock.now();

  const claimed = await db.execute(sql`
    UPDATE auth_magic_links
       SET consumed_at = ${now.toISOString()}::timestamptz
     WHERE token_hash = ${hashToken(token)}
       AND consumed_at IS NULL
       AND expires_at > ${now.toISOString()}::timestamptz
    RETURNING id, email, expires_at, consumed_at, account_id
  `);
  const claimedRows = rowsOf<LinkRow>(claimed);
  const link = claimedRows[0];

  if (!link) {
    // Distinguish the three failures, because the screens differ: an expired link
    // offers a new one, a consumed link says "this link was already used" (which is
    // usually a second tab), and an unknown token says nothing more than that.
    const probe = rowsOf<LinkRow>(
      await db.execute(sql`
        SELECT id, email, expires_at, consumed_at, account_id
          FROM auth_magic_links WHERE token_hash = ${hashToken(token)} LIMIT 1
      `),
    );
    const found = probe[0];
    if (!found) return { ok: false, reason: 'unknown' };
    if (found.consumed_at !== null) return { ok: false, reason: 'consumed' };
    return { ok: false, reason: 'expired' };
  }

  const existing = rowsOf<{ user_id: string; account_id: string }>(
    await db.execute(sql`
      SELECT u.id AS user_id, m.account_id
        FROM users u
        LEFT JOIN memberships m ON m.user_id = u.id
       WHERE u.email = ${link.email} AND u.deleted_at IS NULL
       ORDER BY m.created_at ASC
       LIMIT 1
    `),
  )[0];

  if (existing?.account_id) {
    const issued = await createSession(
      db,
      { userId: existing.user_id, accountId: existing.account_id, email: link.email },
      clock,
    );
    await claimRateCardPurchases(db, link.email, existing.account_id);
    return { ok: true, issued, createdAccount: false };
  }

  const userId = existing?.user_id ?? newId();
  if (!existing) {
    await db.execute(sql`
      INSERT INTO users (id, email, created_at)
      VALUES (${userId}::uuid, ${link.email}, ${now.toISOString()}::timestamptz)
      ON CONFLICT (email) DO NOTHING
    `);
  }

  const account = link.account_id ?? newId();
  if (!link.account_id) {
    await db.execute(sql`
      INSERT INTO accounts (id, name, status, created_at)
      VALUES (${account}::uuid, ${options?.accountName ?? defaultAccountName(link.email)},
              'active', ${now.toISOString()}::timestamptz)
    `);
  }
  await db.execute(sql`
    INSERT INTO memberships (account_id, user_id, role, created_at)
    VALUES (${account}::uuid, ${userId}::uuid, 'owner', ${now.toISOString()}::timestamptz)
    ON CONFLICT (account_id, user_id) DO NOTHING
  `);

  // The free tier is a real state, not the absence of one: `entitlement_state =
  // 'none'` means "no subscription", and every generation gate reads it rather than
  // asking whether a subscriptions row exists.
  await db.execute(sql`
    INSERT INTO billing_account_index (account_id, entitlement_state, state_since, updated_at)
    VALUES (${account}::uuid, 'none', ${now.toISOString()}::timestamptz, ${now.toISOString()}::timestamptz)
    ON CONFLICT (account_id) DO NOTHING
  `);

  const issued = await createSession(db, { userId, accountId: account, email: link.email }, clock);
  await claimRateCardPurchases(db, link.email, account);
  return { ok: true, issued, createdAccount: !link.account_id };
}

/**
 * J3 heuristic #6: the $49 bid rate card is bought BEFORE an account exists, so a
 * purchase made at 15:40 on Thursday attaches itself to the account created at
 * 15:52 with the same email. Nobody reconciles it by hand, and nobody has to know
 * to ask.
 */
export async function claimRateCardPurchases(
  db: Db | Tx,
  email: string,
  account: string,
): Promise<number> {
  const claimed = await db.execute(sql`
    UPDATE rate_card_purchases
       SET claimed_by_account_id = ${account}::uuid
     WHERE email = ${normalizeEmail(email)} AND claimed_by_account_id IS NULL
    RETURNING id
  `);
  return rowsOf(claimed).length;
}

function defaultAccountName(email: string): string {
  const local = email.split('@')[0] ?? 'account';
  return local.replace(/[._-]+/g, ' ').trim() || 'New account';
}
