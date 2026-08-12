/**
 * Classification repository — stage 1's persisted output (routing pattern).
 * Spec: ARCHITECTURE.md §3.2 stage 1, LLM_ENGINE.md §5. Code applies the
 * confidence threshold, never the model (I5) — this repository only persists
 * what the engine decided; it does not decide anything itself.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { classifications } from '../schema';
import type { Classification, NewClassification } from './types';

export async function insertClassification(
  db: Db,
  input: NewClassification,
): Promise<Classification> {
  const [created] = await db.insert(classifications).values(input).returning();
  if (!created) throw new Error('insertClassification: insert returned no row');
  return created;
}

export async function getLatestClassification(
  db: Db,
  caseId: string,
): Promise<Classification | undefined> {
  const rows = await db
    .select()
    .from(classifications)
    .where(eq(classifications.caseId, caseId))
    .orderBy(desc(classifications.createdAt))
    .limit(1);
  return rows[0];
}
