/**
 * Draft + citation repository.
 *
 * Spec: ARCHITECTURE.md §3.4 (I2 — the citation enforcement layer's storage
 * form), §5.1 (`drafts.revision_n` unique per case). `insertDraftWithCitations`
 * is the ONE write path from a pipeline result to these two tables, and it is
 * transactional: a draft row with an inconsistent citation set (some citations
 * written, some lost to a crash) would be a silent I2 violation waiting to
 * happen, so both tables commit together or not at all.
 */

import { and, desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { citations, drafts } from '../schema';
import type { Citation, Draft, NewCitation, NewDraft } from './types';

export async function getNextRevisionNumber(db: Db, caseId: string): Promise<number> {
  const rows = await db
    .select({ revisionN: drafts.revisionN })
    .from(drafts)
    .where(eq(drafts.caseId, caseId))
    .orderBy(desc(drafts.revisionN))
    .limit(1);
  return (rows[0]?.revisionN ?? -1) + 1;
}

/**
 * Constructs the draft row and its citation rows in one transaction.
 * `citationRows` must already be `CitedClause`-derived (I2 §3.4 point 1 — no
 * code path here accepts a bare string in the clause slot); this function
 * trusts its caller because enforcing the citation-object provenance is the
 * engine layer's job (`assertOnlyCitedClauses`), not this repository's.
 */
export async function insertDraftWithCitations(
  db: Db,
  draft: Omit<NewDraft, 'revisionN'> & { revisionN?: number },
  citationRows: Omit<NewCitation, 'draftId'>[],
): Promise<{ draft: Draft; citations: Citation[] }> {
  return db.transaction(async (tx) => {
    let revisionN = draft.revisionN;
    if (revisionN === undefined) {
      const prior = await tx
        .select({ revisionN: drafts.revisionN })
        .from(drafts)
        .where(eq(drafts.caseId, draft.caseId))
        .orderBy(desc(drafts.revisionN))
        .limit(1);
      revisionN = (prior[0]?.revisionN ?? -1) + 1;
    }
    const [createdDraft] = await tx
      .insert(drafts)
      .values({ ...draft, revisionN })
      .returning();
    if (!createdDraft) throw new Error('insertDraftWithCitations: draft insert returned no row');

    let createdCitations: Citation[] = [];
    if (citationRows.length > 0) {
      createdCitations = await tx
        .insert(citations)
        .values(citationRows.map((c) => ({ ...c, draftId: createdDraft.id })))
        .returning();
    }

    return { draft: createdDraft, citations: createdCitations };
  });
}

export async function getLatestDraft(db: Db, caseId: string): Promise<Draft | undefined> {
  const rows = await db
    .select()
    .from(drafts)
    .where(eq(drafts.caseId, caseId))
    .orderBy(desc(drafts.revisionN))
    .limit(1);
  return rows[0];
}

export async function getDraftByRevision(
  db: Db,
  caseId: string,
  revisionN: number,
): Promise<Draft | undefined> {
  const rows = await db
    .select()
    .from(drafts)
    .where(and(eq(drafts.caseId, caseId), eq(drafts.revisionN, revisionN)))
    .limit(1);
  return rows[0];
}

export async function listCitationsForDraft(db: Db, draftId: string): Promise<Citation[]> {
  return db.select().from(citations).where(eq(citations.draftId, draftId));
}

export async function getDraftWithCitations(
  db: Db,
  draftId: string,
): Promise<{ draft: Draft | undefined; citations: Citation[] }> {
  const [draftRows, citationRows] = await Promise.all([
    db.select().from(drafts).where(eq(drafts.id, draftId)).limit(1),
    listCitationsForDraft(db, draftId),
  ]);
  return { draft: draftRows[0], citations: citationRows };
}
