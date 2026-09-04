/**
 * Generated documents and their share links (WL-06).
 *
 * **A SHARE LINK IS AN UNAUTHENTICATED URL THAT STREAMS WORKER NAMES, LAST-FOUR
 * IDENTIFIERS, HOURS AND PAY.** Every property of this module follows from that
 * one sentence (finding M10):
 *
 *  - the token is stored HASHED, so a database dump is not a set of live links;
 *  - it expires in 7 days and is re-issuable in one click — the general
 *    contractor's real need is "send it again", not "keep it forever";
 *  - it is REVOCABLE, because the answer to "I sent it to the wrong address"
 *    has to exist before it is needed;
 *  - every access is counted and timestamped, because you cannot revoke what
 *    you cannot see.
 *
 * `OFFER.md` bonus B5 originally promised a link the GC could bookmark. The
 * regulation forbids full identifying numbers on transmittals precisely because
 * this data travels; an unrevocable URL is that same risk in a new wrapper.
 */

import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import { documentShareLinks, documents, type DocumentRow, type DocumentShareLink } from '../schema';

export const SHARE_LINK_TTL_DAYS = 7;

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function recordDocument(
  db: Db,
  input: {
    payrollId: string;
    kind: 'wh347' | 'statement_of_compliance';
    storageKey: string;
    byteSize: number;
    sha256: string;
    pageCount?: number;
    wdNumber: string;
    wdModificationNumber: number;
    wdPublicationDate: string;
    generatorVersion: string;
  },
): Promise<DocumentRow> {
  const [row] = await db
    .insert(documents)
    .values({
      id: newId('doc'),
      payrollId: input.payrollId,
      kind: input.kind,
      storageKey: input.storageKey,
      byteSize: input.byteSize,
      sha256: input.sha256,
      pageCount: input.pageCount ?? 1,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      wdPublicationDate: input.wdPublicationDate,
      generatorVersion: input.generatorVersion,
    })
    .returning();
  return row as DocumentRow;
}

/** Returns the RAW token exactly once. It is never stored and never logged. */
export async function createShareLink(
  db: Db,
  input: { documentId: string; createdByUserId?: string; now?: Date },
): Promise<{ token: string; link: DocumentShareLink }> {
  const token = randomBytes(32).toString('base64url');
  const now = input.now ?? new Date();
  const [link] = await db
    .insert(documentShareLinks)
    .values({
      id: newId('shr'),
      documentId: input.documentId,
      tokenHash: hashShareToken(token),
      expiresAt: new Date(now.getTime() + SHARE_LINK_TTL_DAYS * 86_400_000),
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  return { token, link: link as DocumentShareLink };
}

/** Resolve a token to a live link, counting the access. Expired or revoked
 *  returns undefined — there is no "expired but still readable" state. */
export async function consumeShareLink(
  db: Db,
  token: string,
  now = new Date(),
): Promise<DocumentShareLink | undefined> {
  const [link] = await db
    .select()
    .from(documentShareLinks)
    .where(
      and(
        eq(documentShareLinks.tokenHash, hashShareToken(token)),
        isNull(documentShareLinks.revokedAt),
        gt(documentShareLinks.expiresAt, now),
      ),
    )
    .limit(1);
  if (!link) return undefined;
  await db
    .update(documentShareLinks)
    .set({
      accessedCount: sql`${documentShareLinks.accessedCount} + 1`,
      lastAccessedAt: now,
    })
    .where(eq(documentShareLinks.id, link.id));
  return link;
}

export async function revokeShareLink(
  db: Db,
  input: { linkId: string; revokedByUserId?: string },
): Promise<void> {
  await db
    .update(documentShareLinks)
    .set({ revokedAt: new Date(), revokedByUserId: input.revokedByUserId ?? null })
    .where(eq(documentShareLinks.id, input.linkId));
}

/** "Revoke every link on this payroll" — the control that has to exist beside
 *  the per-link one, because the mistake is usually plural. */
export async function revokeAllLinksForDocument(
  db: Db,
  input: { documentId: string; revokedByUserId?: string },
): Promise<number> {
  const rows = await db
    .update(documentShareLinks)
    .set({ revokedAt: new Date(), revokedByUserId: input.revokedByUserId ?? null })
    .where(
      and(
        eq(documentShareLinks.documentId, input.documentId),
        isNull(documentShareLinks.revokedAt),
      ),
    )
    .returning();
  return rows.length;
}

export async function liveShareLinks(
  db: Db,
  documentId: string,
  now = new Date(),
): Promise<DocumentShareLink[]> {
  return db
    .select()
    .from(documentShareLinks)
    .where(
      and(
        eq(documentShareLinks.documentId, documentId),
        isNull(documentShareLinks.revokedAt),
        gt(documentShareLinks.expiresAt, now),
      ),
    )
    .orderBy(desc(documentShareLinks.createdAt));
}
