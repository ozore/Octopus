/**
 * Corpus-slice-ref repository — the retrieved slice, FROZEN for the life of
 * the case (ADR-002). A revision re-runs stages 3-4 only and must never
 * silently change which policy the document argues under, so this repository
 * refuses a second freeze for the same case rather than overwriting one.
 */

import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { corpusSliceRefs } from '../schema';
import type { CorpusSliceRef, NewCorpusSliceRef } from './types';

export class SliceAlreadyFrozenError extends Error {
  constructor(public readonly caseId: string) {
    super(`corpus slice already frozen for case ${caseId} (ADR-002 — a case's slice never changes)`);
    this.name = 'SliceAlreadyFrozenError';
  }
}

export async function freezeCorpusSlice(
  db: Db,
  input: NewCorpusSliceRef,
): Promise<CorpusSliceRef> {
  const existing = await getCorpusSliceForCase(db, input.caseId);
  if (existing) throw new SliceAlreadyFrozenError(input.caseId);

  const [created] = await db.insert(corpusSliceRefs).values(input).returning();
  if (!created) throw new Error('freezeCorpusSlice: insert returned no row');
  return created;
}

export async function getCorpusSliceForCase(
  db: Db,
  caseId: string,
): Promise<CorpusSliceRef | undefined> {
  const rows = await db
    .select()
    .from(corpusSliceRefs)
    .where(eq(corpusSliceRefs.caseId, caseId))
    .limit(1);
  return rows[0];
}
