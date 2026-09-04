/**
 * THE NEEDS-REVIEW QUEUE — `specs/06` A8, and `specs/12` §3 item 6.
 *
 * One list, two readers. The dashboard shows its depth as a badge and `/review`
 * lists it oldest first; the gap report prints the same rows under **"Read, but
 * not confident enough to compare (n)"**, with the reason in words. They share
 * this module for the reason the counters and the table share theirs: a report
 * that silently drops part of its input is not evidence (REVIEW.md B-09), and
 * the surest way to drop it silently is to compute the list twice.
 *
 * `specs/06` §8: a vendor whose only certificate is in `needs_review` is
 * `no_certificate` UNTIL review completes. An unreviewed extraction must never
 * colour a vendor green — so this queue is also the explanation for a count
 * that would otherwise look wrong.
 *
 * THE REASON IS A SENTENCE, built from what was persisted at extraction time
 * (`doc_confidence`, `gate_failures`, `failure_reason`). It is deliberately not
 * recomputed from the document: a report generated in June must give the reason
 * that was true in March.
 */

import { and, asc, count, eq, isNull } from 'drizzle-orm';

import type { Db } from '../db';
import { documents, extractions, vendors } from '../schema';

export type ReviewQueueItem = {
  extractionId: string;
  documentId: string;
  vendorId: string | null;
  vendorName: string | null;
  /** The stored object's name. `documents` carries no original filename yet —
   *  see REQUESTS.md, request R-1 to M4. */
  documentLabel: string;
  uploadedAt: Date;
  docConfidence: number | null;
  gateFailures: number;
  /** Why a person has to look, in words. */
  reason: string;
};

/** The basename of a DocumentStore key: `org/<id>/<sha>.pdf` → `<sha>.pdf`. */
export function documentLabel(storageKey: string): string {
  const parts = storageKey.split('/');
  return parts[parts.length - 1] ?? storageKey;
}

/**
 * `specs/03` §8's `needs_review`, said in English.
 *
 * Never "confidence 0.71". A number is a reason only to the person who chose
 * the threshold; everybody else needs the sentence.
 */
export function needsReviewReason(input: {
  docConfidence: number | null;
  gateFailures: number;
  failureReason: string | null;
}): string {
  if (input.failureReason) return input.failureReason;
  const parts: string[] = [];
  if (input.gateFailures > 0) {
    parts.push(
      `${input.gateFailures} ${input.gateFailures === 1 ? 'value was' : 'values were'} not found on the page they were read from`,
    );
  }
  if (input.docConfidence !== null && input.docConfidence < 0.9) {
    parts.push('at least one field was read below the confidence threshold');
  }
  if (parts.length === 0) parts.push('a field on this document was read below the confidence threshold');
  return `Certly read this document but ${parts.join(', and ')}, so it is waiting for a person.`;
}

export async function reviewQueueDepth(db: Db, orgId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(extractions)
    .where(and(eq(extractions.orgId, orgId), eq(extractions.status, 'needs_review')));
  return Number(row?.value ?? 0);
}

/** Oldest first — `specs/06` A8. A queue sorted newest-first is a queue whose
 *  tail is never worked. */
export async function reviewQueue(
  db: Db,
  orgId: string,
  options: { limit?: number; vendorIds?: string[] } = {},
): Promise<ReviewQueueItem[]> {
  const rows = await db
    .select({
      extractionId: extractions.id,
      documentId: documents.id,
      storageKey: documents.storageKey,
      uploadedAt: documents.uploadedAt,
      vendorId: documents.vendorId,
      vendorName: vendors.name,
      docConfidence: extractions.docConfidence,
      gateFailures: extractions.gateFailures,
      failureReason: extractions.failureReason,
    })
    .from(extractions)
    .innerJoin(documents, eq(documents.id, extractions.documentId))
    .leftJoin(vendors, eq(vendors.id, documents.vendorId))
    .where(and(eq(extractions.orgId, orgId), eq(extractions.status, 'needs_review'), isNull(vendors.archivedAt)))
    .orderBy(asc(documents.uploadedAt))
    .limit(options.limit ?? 100);

  const wanted = options.vendorIds ? new Set(options.vendorIds) : null;

  return rows
    .filter((row) => !wanted || (row.vendorId !== null && wanted.has(row.vendorId)))
    .map((row) => {
      const docConfidence = row.docConfidence === null ? null : Number(row.docConfidence);
      return {
        extractionId: row.extractionId,
        documentId: row.documentId,
        vendorId: row.vendorId,
        vendorName: row.vendorName,
        documentLabel: documentLabel(row.storageKey),
        uploadedAt: row.uploadedAt,
        docConfidence,
        gateFailures: row.gateFailures,
        reason: needsReviewReason({
          docConfidence,
          gateFailures: row.gateFailures,
          failureReason: row.failureReason,
        }),
      };
    });
}

/**
 * The newest document for one vendor that is still waiting for a person.
 *
 * The vendor detail embeds M4's review panel through `buildReviewView`, and
 * that needs three things this query returns together: the extraction id, the
 * payload it read, and the stored object the page texts come from. Fetching
 * them in one query is what keeps the panel from being three round trips on a
 * page that already makes several.
 */
export async function vendorNeedsReview(
  db: Db,
  orgId: string,
  vendorId: string,
): Promise<{
  extractionId: string;
  documentId: string;
  storageKey: string;
  payload: NonNullable<typeof extractions.$inferSelect.payload>;
} | null> {
  const [row] = await db
    .select({
      extractionId: extractions.id,
      documentId: documents.id,
      storageKey: documents.storageKey,
      payload: extractions.payload,
    })
    .from(extractions)
    .innerJoin(documents, eq(documents.id, extractions.documentId))
    .where(
      and(
        eq(extractions.orgId, orgId),
        eq(extractions.status, 'needs_review'),
        eq(documents.vendorId, vendorId),
      ),
    )
    .orderBy(asc(documents.uploadedAt))
    .limit(1);

  if (!row || !row.payload) return null;
  return {
    extractionId: row.extractionId,
    documentId: row.documentId,
    storageKey: row.storageKey,
    payload: row.payload,
  };
}
