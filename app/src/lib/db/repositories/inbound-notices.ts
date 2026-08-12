/**
 * Inbound-notice repository — the durable landing spot for mail arriving at
 * `shield+{token}@{ingest_domain}` (ADR-006). Persisting here BEFORE
 * processing is what makes `EmailForwardNoticeSource` a queue reader rather
 * than a poller: the webhook's only job is HMAC-verify, match token, insert
 * row, enqueue `process_inbound_notice` — everything else happens off this
 * table, so a worker crash mid-classification never loses the inbound mail.
 */

import { and, eq, isNull } from 'drizzle-orm';

import type { Db } from '../index';
import { inboundNotices } from '../schema';
import type { InboundNotice, NewInboundNotice } from './types';

export async function insertInboundNotice(db: Db, input: NewInboundNotice): Promise<InboundNotice> {
  const [created] = await db.insert(inboundNotices).values(input).returning();
  if (!created) throw new Error('insertInboundNotice: insert returned no row');
  return created;
}

export async function getInboundNotice(db: Db, id: string): Promise<InboundNotice | undefined> {
  const rows = await db.select().from(inboundNotices).where(eq(inboundNotices.id, id)).limit(1);
  return rows[0];
}

export async function markInboundNoticeProcessed(
  db: Db,
  id: string,
  caseId?: string,
): Promise<void> {
  await db
    .update(inboundNotices)
    .set({ processedAt: new Date(), ...(caseId ? { caseId } : {}) })
    .where(eq(inboundNotices.id, id));
}

export async function listUnprocessedForAccount(
  db: Db,
  shieldAccountId: string,
): Promise<InboundNotice[]> {
  return db
    .select()
    .from(inboundNotices)
    .where(and(eq(inboundNotices.shieldAccountId, shieldAccountId), isNull(inboundNotices.processedAt)));
}
