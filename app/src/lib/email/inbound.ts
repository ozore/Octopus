/**
 * Inbound ingest — the primary v1 monitoring mechanism (ADR-006).
 *
 * Spec: ARCHITECTURE.md §3.8, ADR-006. `EmailForwardNoticeSource` is a queue
 * reader, not a poller (adapters/notice-source.mock.ts's header comment): the
 * web process's inbound webhook route calls `receiveInboundNotice` below,
 * which does exactly three things — HMAC-verify (via the adapter), match the
 * opaque ingest token to a `shield_accounts` row, and persist + enqueue. Every
 * later step (classification, alerting) happens off the persisted row in the
 * worker, so a crash between "mail arrived" and "mail processed" never loses
 * the mail (Twelve-Factor IX).
 */

import { createHash } from 'node:crypto';

import type { Adapters } from '../adapters';
import type { InboundEmailPayload } from '../adapters/resend';
import * as inboundNoticesRepo from '../db/repositories/inbound-notices';
import * as shieldAccountsRepo from '../db/repositories/shield-accounts';
import type { InboundNotice, ShieldAccount } from '../db/repositories/types';
import type { Db } from '../db';
import { enqueueJob } from '../queue';

export class UnknownIngestTokenError extends Error {
  constructor(public readonly address: string) {
    super(`no shield account matches ingest address: ${address}`);
    this.name = 'UnknownIngestTokenError';
  }
}

/** `shield+{token}@{domain}` -> `{token}`. Tolerant of a display-name prefix
 *  some mail providers add (`"Alerts" <shield+abc@...>`). */
export function extractIngestToken(toAddress: string): string | undefined {
  const match = /shield\+([a-zA-Z0-9]+)@/.exec(toAddress);
  return match?.[1];
}

/**
 * The whole inbound path in one call: verify, match, persist, enqueue.
 * Returns the persisted row and its owning Shield account so the route
 * handler can 200 immediately — the actual classification-and-alert work
 * happens asynchronously via the `process_inbound_notice` job.
 */
export async function receiveInboundNotice(
  db: Db,
  adapters: Adapters,
  rawPayload: string,
  signature: string,
): Promise<{ notice: InboundNotice; account: ShieldAccount }> {
  const payload: InboundEmailPayload = adapters.email.verifyInboundWebhook(rawPayload, signature);

  const token = extractIngestToken(payload.to);
  if (!token) throw new UnknownIngestTokenError(payload.to);

  const account = await shieldAccountsRepo.getShieldAccountByToken(db, token);
  if (!account) throw new UnknownIngestTokenError(payload.to);

  const body = payload.text ?? '';

  // PERSIST AND ENQUEUE IN ONE TRANSACTION — this is the "queue reader, not a
  // poller" property this module's header claims, and before this fix it was
  // only claimed. The row was inserted and nothing ever enqueued
  // `process_inbound_notice`, so a forwarded deactivation notice landed in the
  // table, was never classified, and the seller was never alerted — the single
  // failure that makes D6's monitoring product not a product.
  //
  // One transaction, per ADR-005's stated reason for using the database as the
  // queue: "enqueueing is transactional with the business write." A row without
  // its job is mail we have and will never read; a job without its row is a
  // worker that fails forever on a missing id. Neither is reachable here.
  const notice = await db.transaction(async (tx) => {
    const row = await inboundNoticesRepo.insertInboundNotice(tx, {
      shieldAccountId: account.id,
      receivedAt: new Date(payload.receivedAt),
      fromAddress: payload.from,
      subject: payload.subject,
      // Encryption-at-rest for inbound mail is the same concern as
      // `notice_documents.raw_text_encrypted` (ARCHITECTURE.md §5.1) and is an
      // infrastructure-level concern (KMS-backed envelope encryption) that sits
      // outside this repository's boundary; this module stores plaintext today
      // and the column name documents the obligation for whoever wires the
      // encryption key.
      rawTextEncrypted: body,
      sha256: createHash('sha256').update(body).digest('hex'),
    });

    await enqueueJob(tx, 'process_inbound_notice', { inboundNoticeId: row.id });
    return row;
  });

  return { notice, account };
}
