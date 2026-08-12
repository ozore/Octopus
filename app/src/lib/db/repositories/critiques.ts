/**
 * Critique repository — stage 4's persisted output (evaluator-optimizer
 * pattern), shown free, pre-paywall (ARCHITECTURE.md §3.2 stage 4). The
 * readiness score is computed in code from criteria x weight, never emitted
 * by the model (LLM_ENGINE.md §5.5) — this repository stores whatever the
 * engine computed; it does not compute it.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { critiques } from '../schema';
import type { Critique, NewCritique } from './types';

export async function insertCritique(db: Db, input: NewCritique): Promise<Critique> {
  const [created] = await db.insert(critiques).values(input).returning();
  if (!created) throw new Error('insertCritique: insert returned no row');
  return created;
}

export async function getLatestCritiqueForDraft(
  db: Db,
  draftId: string,
): Promise<Critique | undefined> {
  const rows = await db
    .select()
    .from(critiques)
    .where(eq(critiques.draftId, draftId))
    .orderBy(desc(critiques.createdAt))
    .limit(1);
  return rows[0];
}
