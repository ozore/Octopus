/**
 * Notice-document repository — the pasted or forwarded notice, encrypted at
 * rest with a retention clock. Never enters L4 directly (ADR-008 ¶2); it is
 * the raw material redaction reads from, via outcome-capture/.
 */

import { eq, lt } from 'drizzle-orm';

import type { Db } from '../index';
import { noticeDocuments } from '../schema';
import type { NewNoticeDocument, NoticeDocument } from './types';

export async function insertNoticeDocument(
  db: Db,
  input: NewNoticeDocument,
): Promise<NoticeDocument> {
  const [created] = await db.insert(noticeDocuments).values(input).returning();
  if (!created) throw new Error('insertNoticeDocument: insert returned no row');
  return created;
}

export async function getNoticeDocumentForCase(
  db: Db,
  caseId: string,
): Promise<NoticeDocument | undefined> {
  const rows = await db
    .select()
    .from(noticeDocuments)
    .where(eq(noticeDocuments.caseId, caseId))
    .limit(1);
  return rows[0];
}

/** Retention enforcement (ADR-008 ¶4 / §3.7): purge raw text past its clock,
 *  independent of whether the case's outcome was ever consented into L4. */
export async function listExpiredNoticeDocuments(db: Db, now: Date = new Date()) {
  return db.select().from(noticeDocuments).where(lt(noticeDocuments.retentionExpiresAt, now));
}

export async function purgeNoticeDocument(db: Db, id: string): Promise<void> {
  await db
    .update(noticeDocuments)
    .set({ rawTextEncrypted: '', deletedAt: new Date() })
    .where(eq(noticeDocuments.id, id));
}
