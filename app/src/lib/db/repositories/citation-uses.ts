/**
 * Citation-use repository — which clauses were cited, and whether the
 * citation survived human editing (CORPUS_DESIGN.md §4.6 — the rush-tier
 * quality signal: a clause a reviewer keeps is stronger evidence than one the
 * model merely proposed).
 */

import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { citationUses } from '../schema';
import type { CitationUse, NewCitationUse } from './types';

export async function recordCitationUse(db: Db, input: NewCitationUse): Promise<CitationUse> {
  const [created] = await db.insert(citationUses).values(input).returning();
  if (!created) throw new Error('recordCitationUse: insert returned no row');
  return created;
}

export async function markCitationSurvivedHumanEdit(
  db: Db,
  id: string,
  survived: boolean,
): Promise<void> {
  await db.update(citationUses).set({ survivedHumanEdit: survived }).where(eq(citationUses.id, id));
}

export async function listCitationUsesForClause(db: Db, clauseId: string): Promise<CitationUse[]> {
  return db.select().from(citationUses).where(eq(citationUses.clauseId, clauseId));
}
