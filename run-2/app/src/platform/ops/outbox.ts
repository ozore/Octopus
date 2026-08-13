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
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db, type Tx } from '../../db';
import { withTenant, accountId as brandAccountId } from '../../db/tenant';
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
 * Drain the queue. Attempts are capped: a message that has failed five times is left
 * in the table with its error rather than retried forever, because an address that
 * bounces is a fact about the world and no amount of retrying is going to change it.
 * Nothing about a stuck message blocks a filing.
 */
export async function drainOutbox(
  db: Db,
  deps: { readonly mailer: Mailer; readonly clock?: Clock; readonly limit?: number },
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
      await deps.mailer.send({
        id: row.id,
        accountId: row.account_id,
        to: row.to_address,
        template: row.template,
        payload: row.payload ?? {},
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
