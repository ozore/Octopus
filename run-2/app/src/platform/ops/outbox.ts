/**
 * The outbound mail queue.
 *
 * Spec: ARCHITECTURE.md §9.2 (three dunning emails), §9.1 (on archive, "export link
 * emailed FIRST"), §7.1 (`pages.rebuild` sends WD-change alerts), USER_JOURNEY §12.2
 * (the deletion confirmation carries a one-click undo).
 *
 * THREE RULES, ALL OF THEM A3.
 *
 * 1. **Outbound only.** There is no inbound adapter and no reply-to that routes into
 *    the product. A reply to anything we send lands at a published address, and every
 *    message at a published address increments G5's counter (§11.8). We do not get to
 *    have a mail channel that is invisible to the gate.
 *
 * 2. **A link, never a file.** §11.3: "An email attachment — the WD-change and
 *    export-on-cancel emails carry a link to the authenticated route, never the
 *    file." A payload here holds ids and dates; the recipient authenticates to get
 *    the bytes.
 *
 * 3. **Idempotent.** `idempotency_key` is unique. A dunning notice that arrives twice
 *    because a container restarted teaches a customer to ignore the next one.
 *
 * 4. **A row never holds a credential** (security C-3). `email_outbox` is a fleet
 *    surface: no tenant policy, `SELECT` held by the web role, rows kept until the
 *    retention sweep. A queued sign-in mail therefore carries the magic link's ID,
 *    and `drainOutbox` resolves it to a URL at the moment it hands the message to
 *    the mailer — the token is minted there and exists in no row at any time. The
 *    rule is enforced at the write site by `assertNoRedeemableToken`, so a future
 *    template cannot reintroduce the defect by putting a URL in a payload.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
import { MAGIC_LINK_TEMPLATE, mintMagicLinkToken } from '../auth/magic-link';
import { systemClock, type Clock } from '../clock';
import { newId } from '../ids';

export interface OutboxMessage {
  readonly id: string;
  readonly accountId: string | null;
  readonly to: string;
  readonly template: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface Mailer {
  send(message: OutboxMessage): Promise<{ readonly id: string }>;
}

/** The offline mailer: records, never sends. Used by the test suite and by
 *  `ADAPTER_MODE=mock`, where a real send would be an outbound side effect from a
 *  run that is supposed to have none. */
export function createRecordingMailer(): Mailer & { readonly sent: OutboxMessage[] } {
  const sent: OutboxMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
      return { id: `mock_${message.id}` };
    },
  };
}

/**
 * The shapes a SIGN-IN credential can take in a payload: the redemption route
 * itself, or a `token` / `session` / `secret` query parameter.
 *
 * What it deliberately does NOT catch, so that nobody reads it as a guarantee it
 * cannot make: a capability spelled as a path segment. `rate_card_ready` queues
 * `/rate-card/r/<delivery-token>` on purpose — that link IS the $49 document's
 * address, it grants a read of one PDF the recipient has already paid for, and it
 * is not a session. This is a tripwire on the one class that was account takeover,
 * not a parser and not a general secret detector.
 */
const CREDENTIAL_SHAPED = /\/auth\/callback|[?&](token|session|secret)=/i;

/**
 * The rule of §4, enforced where the row is written rather than reviewed.
 *
 * A queued message is durable, unscoped by tenancy and readable by the whole web
 * tier; a bearer token in one is a permanent credential store. Throwing here rather
 * than stripping is deliberate: a stripped field produces a mail with a dead link
 * and no failure anywhere, which is the same class of silent wrong the outbox's own
 * idempotency rule exists to prevent.
 */
export function assertNoRedeemableToken(
  template: string,
  payload: Readonly<Record<string, unknown>>,
): void {
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      if (CREDENTIAL_SHAPED.test(value)) {
        throw new TypeError(
          `queueEmail(${template}): payload.${path} looks like a bearer credential. ` +
            'An outbox row carries a reference the mailer resolves at send time, never ' +
            'a redeemable token (security C-3; see this module\'s header).',
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    }
  };
  for (const [key, value] of Object.entries(payload)) walk(value, key);
}

export async function queueEmail(
  db: Db,
  input: {
    readonly accountId: string | null;
    readonly template: string;
    readonly payload: Readonly<Record<string, unknown>>;
    readonly idempotencyKey: string;
    /** Omit to address the account's owner. */
    readonly to?: string;
  },
  clock: Clock = systemClock,
): Promise<{ readonly queued: boolean; readonly id: string | null }> {
  assertNoRedeemableToken(input.template, input.payload);
  const to = input.to ?? (input.accountId ? await ownerEmail(db, input.accountId) : null);
  if (!to) return { queued: false, id: null };

  const id = newId();
  const result = await db.execute(sql`
    INSERT INTO email_outbox (id, account_id, to_address, template, payload, queued_at, idempotency_key)
    VALUES (${id}::uuid, ${input.accountId}::uuid, ${to}, ${input.template},
            ${JSON.stringify(input.payload)}::jsonb, ${clock.now().toISOString()}::timestamptz,
            ${input.idempotencyKey})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id
  `);
  const row = rowsOf<{ id: string }>(result)[0];
  return row ? { queued: true, id: row.id } : { queued: false, id: null };
}

async function ownerEmail(db: Db, account: string): Promise<string | null> {
  return withTenant(db, { accountId: brandAccountId(account) }, async (tx: Tx) => {
    const result = await tx.execute(sql`
      SELECT u.email FROM users u
        JOIN memberships m ON m.user_id = u.id
       WHERE m.account_id = ${account}::uuid AND u.deleted_at IS NULL
       ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, m.created_at
       LIMIT 1
    `);
    return rowsOf<{ email: string }>(result)[0]?.email ?? null;
  });
}

interface OutboxRow {
  readonly id: string;
  readonly account_id: string | null;
  readonly to_address: string;
  readonly template: string;
  readonly payload: Record<string, unknown> | null;
  readonly attempts: number | string;
}

/**
 * Resolve a stored payload into the one the mailer is handed.
 *
 * For every template but the sign-in link this is the identity. For `magic_link`
 * the stored row holds `link_id`, and the token is created HERE — inside the send —
 * so the credential's whole life is this function's return value, the HTTP request
 * to the mail provider, and the customer's mailbox.
 *
 * `link_path` rather than `url` because `renderMessage` reads a fixed field list and
 * `link_path` is the one it renders as a link; a payload field the renderer does not
 * know about would produce a sign-in mail with no way to sign in.
 *
 * `null` means "do not send this message": the link is consumed, expired or already
 * purged, and there is no honest mail to make out of it.
 */
async function resolvePayload(
  db: Db,
  row: OutboxRow,
  deps: { readonly baseUrl: string; readonly clock: Clock },
): Promise<Readonly<Record<string, unknown>> | null> {
  const payload = row.payload ?? {};
  if (row.template !== MAGIC_LINK_TEMPLATE) return payload;

  const linkId = payload['link_id'];
  if (typeof linkId !== 'string') return null;
  const next = typeof payload['next'] === 'string' ? payload['next'] : null;

  const minted = await mintMagicLinkToken(db, linkId, {
    baseUrl: deps.baseUrl,
    next,
    clock: deps.clock,
  });
  if (!minted) return null;

  const { link_id: _link, next: _next, ...rest } = payload;
  return { ...rest, link_path: minted.linkPath, expires_at: minted.expiresAt.toISOString() };
}

/**
 * Drain the queue. Attempts are capped: a message that has failed five times is left
 * in the table with its error rather than retried forever, because an address that
 * bounces is a fact about the world and no amount of retrying is going to change it.
 * Nothing about a stuck message blocks a filing.
 *
 * A message whose payload cannot be resolved into something worth sending is
 * recorded as a failure BY NAME on the row, not silently dropped and not sent
 * half-formed.
 */
export async function drainOutbox(
  db: Db,
  deps: {
    readonly mailer: Mailer;
    /** Where a `link_path` becomes a URL, and where the sign-in link is minted. */
    readonly baseUrl: string;
    readonly clock?: Clock;
    readonly limit?: number;
  },
): Promise<{ readonly sent: number; readonly failed: number }> {
  const clock = deps.clock ?? systemClock;
  const rows = rowsOf<OutboxRow>(
    await db.execute(sql`
      SELECT id, account_id, to_address, template, payload, attempts
        FROM email_outbox
       WHERE sent_at IS NULL AND attempts < 5
       ORDER BY queued_at
       LIMIT ${deps.limit ?? 50}
    `),
  );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const payload = await resolvePayload(db, row, { baseUrl: deps.baseUrl, clock });
      if (payload === null) {
        await db.execute(sql`
          UPDATE email_outbox
             SET attempts = attempts + 1,
                 last_error = 'payload could not be resolved into a deliverable message'
           WHERE id = ${row.id}::uuid
        `);
        failed += 1;
        continue;
      }
      await deps.mailer.send({
        id: row.id,
        accountId: row.account_id,
        to: row.to_address,
        template: row.template,
        payload,
      });
      await db.execute(sql`
        UPDATE email_outbox
           SET sent_at = ${clock.now().toISOString()}::timestamptz, attempts = attempts + 1
         WHERE id = ${row.id}::uuid
      `);
      sent += 1;
    } catch (error) {
      await db.execute(sql`
        UPDATE email_outbox SET attempts = attempts + 1, last_error = ${String(error)}
         WHERE id = ${row.id}::uuid
      `);
      failed += 1;
    }
  }
  return { sent, failed };
}

export async function pendingOutboxCount(db: Db): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM email_outbox WHERE sent_at IS NULL
  `);
  return Number(rowsOf<{ n: number }>(result)[0]?.n ?? 0);
}
