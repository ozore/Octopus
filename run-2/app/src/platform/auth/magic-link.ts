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
 * AND IT CROSSES THE TENANT BOUNDARY IN EXACTLY ONE NAMED PLACE. Those four inserts
 * cannot satisfy a policy keyed on `ratepin_current_account()`, because at that
 * moment there is no account. They therefore do not happen here: this module calls
 * `ratepin_provision_identity`, declared with the auth tables in
 * `src/platform/schema.ts` and running as a NOLOGIN, NOBYPASSRLS role that holds
 * four narrow policies and no grant on anything carrying a worker, a rate or a
 * filing. The web tier's role has no insert grant on `users`, `accounts` or
 * `memberships` at all, so this is not a convention — it is the only path there is.
 *
 * THE TOKEN IS NEVER AT REST, IN ANY FORM. Requesting a link writes a row with a
 * digest of a discarded token; `mintMagicLinkToken` creates the real one at the
 * moment the outbox hands the message to the mail provider. Nothing between the two
 * — not `email_outbox.payload`, not a log line, not a ciphertext column — holds a
 * string that redeems. The reasoning, and the two designs it was chosen over, are
 * on `requestMagicLink`.
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

/** The template key the outbox resolves at send time. It lives here because the
 *  resolution is this module's, not the mailer's. */
export const MAGIC_LINK_TEMPLATE = 'magic_link';

/**
 * What requesting a link produces: a REFERENCE, and no credential.
 *
 * There is deliberately no `url` and no `token` on this type. The token does not
 * exist yet when the request returns — it is minted by `mintMagicLinkToken` at the
 * moment the message is handed to a mail provider, which is the only moment anyone
 * needs it. See the header of `requestMagicLink`.
 */
export interface IssuedMagicLink {
  readonly id: string;
  readonly expiresAt: Date;
  readonly email: string;
}

/** The one place a live sign-in URL exists: a return value, in the process that is
 *  about to hand it to the mail provider. It is never written back to any row. */
export interface MintedMagicLink {
  /** The credential itself, already inside `url`. Named separately for the two
   *  callers that redeem it directly — the seed script and the test harness, both
   *  standing in for a mail client. Persisting it anywhere is the defect this whole
   *  design exists to remove. */
  readonly token: string;
  /** Absolute, for a mailer that renders a full URL. */
  readonly url: string;
  /** Relative, for `renderMessage`'s `link_path` field. */
  readonly linkPath: string;
  readonly expiresAt: Date;
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
 * Request a link. NOTHING REDEEMABLE EXISTS WHEN THIS RETURNS.
 *
 * SECURITY C-3. The queued sign-in mail used to carry the live URL in
 * `email_outbox.payload`, and `email_outbox` is a fleet surface: no tenant policy,
 * `SELECT` held by `ratepin_app`, rows kept forever. One read of one table was
 * therefore account takeover for every sign-in of the last fifteen minutes plus a
 * permanent list of every address that had ever signed in.
 *
 * THE DESIGN, AND WHY IT IS THIS ONE. Three were available. **Encrypting the
 * payload** puts a decryptable credential in the database and needs a key beside
 * `DATABASE_URL`; ARCHITECTURE §11.3's threat table already settled that argument
 * for `pgcrypto` — a key in a neighbouring env var "defends a stolen backup file
 * and NOTHING ELSE — not an application compromise, not a statement log, not a
 * leaked environment dump, not an insider with a shell", which is exactly the set
 * of reads that matter here. **Deriving the token** from a server secret and the
 * row id has the identical weakness with extra machinery. So the row carries a
 * REFERENCE — the link id — and the token is minted by the process that is about
 * to hand the message to the mail provider (`mintMagicLinkToken`, called from
 * `drainOutbox`). §11.5's "hashed-at-rest tokens" then holds without an exception:
 * the plaintext token exists in one process's memory and in one mailbox, and in no
 * row, in no ciphertext, at no time.
 *
 * WHY THE ROW IS STILL BORN WITH A DIGEST. `token_hash` is NOT NULL UNIQUE, and
 * relaxing it would make "a link row always has a digest" a thing to remember
 * rather than a thing the database enforces. The row is therefore created with the
 * digest of a token that is generated, never returned and immediately discarded —
 * so between request and send the link is not merely unsent, it is UNREDEEMABLE:
 * there is no string in the universe that hashes to it that anybody holds.
 */
export async function requestMagicLink(
  db: Db | Tx,
  request: MagicLinkRequest,
  options?: { readonly clock?: Clock },
): Promise<IssuedMagicLink> {
  const email = normalizeEmail(request.email);
  if (!isEmail(email)) throw new TypeError(`requestMagicLink: not an email address`);

  const clock = options?.clock ?? systemClock;
  const now = clock.now();
  const expiresAt = new Date(now.getTime() + MAGIC_LINK_TTL_MINUTES * 60_000);
  const id = newId();

  await db.execute(sql`
    INSERT INTO auth_magic_links (id, email, token_hash, created_at, expires_at, account_id)
    VALUES (${id}::uuid, ${email}, ${hashToken(newToken())},
            ${now.toISOString()}::timestamptz, ${expiresAt.toISOString()}::timestamptz,
            ${request.accountId ?? null}::uuid)
  `);

  return { id, expiresAt, email };
}

/**
 * Mint the token, at send time, for one link row. Returns `null` when there is
 * nothing to mail.
 *
 * It is an UPDATE rather than a read because the token is created here: the row's
 * digest is replaced with the digest of the token going into this message, so a
 * retried send invalidates the token of the attempt before it and there is never
 * more than one live token for a link. A row that is consumed, expired or purged
 * matches nothing and the caller declines to send — a mail carrying a link that is
 * already dead is worse than a mail that never arrives, because the screen it
 * lands on says "this link was already used" about a link the customer never used.
 */
export async function mintMagicLinkToken(
  db: Db | Tx,
  linkId: string,
  options: { readonly baseUrl: string; readonly next?: string | null; readonly clock?: Clock },
): Promise<MintedMagicLink | null> {
  const now = (options.clock ?? systemClock).now();
  const token = newToken();

  const claimed = rowsOf<{ expires_at: string | Date }>(
    await db.execute(sql`
      UPDATE auth_magic_links
         SET token_hash = ${hashToken(token)}
       WHERE id = ${linkId}::uuid
         AND consumed_at IS NULL
         AND expires_at > ${now.toISOString()}::timestamptz
      RETURNING expires_at
    `),
  )[0];
  if (!claimed) return null;

  const url = new URL('/auth/callback', options.baseUrl);
  url.searchParams.set('token', token);
  if (options.next !== undefined && options.next !== null && options.next !== '') {
    url.searchParams.set('next', options.next);
  }

  return {
    token,
    url: url.toString(),
    linkPath: `${url.pathname}${url.search}`,
    expiresAt: new Date(claimed.expires_at),
  };
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
 *
 * ALL OF IT IN ONE TRANSACTION, AND THAT IS A CORRECTNESS PROPERTY, NOT TIDINESS.
 * The consuming UPDATE used to commit on its own, before the provisioning inserts
 * ran. When those inserts failed the link was already burned, so the retry the
 * customer inevitably makes lands on "this link was already used", and requesting
 * another repeats it forever. Under A3 there is no support address and no
 * escalation path by design, so that state is an unrecoverable, self-inflicted
 * denial of signup — and the screen misdescribes the cause. Wrapping the redemption
 * means a failure anywhere in it rolls the consume back and the link still works.
 */
export async function redeemMagicLink(
  db: Db | Tx,
  token: string,
  options?: { readonly clock?: Clock; readonly accountName?: string },
): Promise<RedeemOutcome> {
  return db.transaction((tx) => redeemInTransaction(tx as Tx, token, options));
}

async function redeemInTransaction(
  db: Tx,
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

  // ONE CALL, ACROSS THE ONE BOUNDARY. Everything that used to be five statements
  // here — the identity lookup, the user, the account, the owner membership and the
  // billing index row — is `ratepin_provision_identity`, a SECURITY DEFINER function
  // owned by a NOLOGIN, NOBYPASSRLS role that holds four policies and nothing else
  // (src/platform/schema.ts). The statements are gone from this module on purpose:
  // an insert into `users` from the web tier's role is now refused by a missing
  // grant, so there is no second way to do this and no way to grow one by accident.
  //
  // The invitation account comes off the link row the token digest resolved, never
  // off the request. `p_now` is the injected clock, so a test can provision at a
  // fixed instant without the database's own `now()` leaking into the fixture.
  const provisioned = rowsOf<{
    user_id: string;
    account_id: string;
    created_account: boolean;
  }>(
    await db.execute(sql`
      SELECT user_id, account_id, created_account
        FROM ratepin_provision_identity(
               ${link.email},
               ${options?.accountName ?? defaultAccountName(link.email)},
               ${link.account_id}::uuid,
               ${now.toISOString()}::timestamptz)
    `),
  )[0];

  if (!provisioned) {
    throw new Error('redeemMagicLink: ratepin_provision_identity returned no identity');
  }

  const issued = await createSession(
    db,
    { userId: provisioned.user_id, accountId: provisioned.account_id, email: link.email },
    clock,
  );
  await claimRateCardPurchases(db, link.email, provisioned.account_id);
  return { ok: true, issued, createdAccount: provisioned.created_account };
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
