/**
 * Human-edit repository — "the human's corrections are the product roadmap"
 * (ARCHITECTURE.md §3.6). Every `/ops` edit is captured as a structured diff
 * against the machine draft; this is a first-class input to the next L3
 * corpus release, so it is never overwritten or deduplicated away here.
 */

import { asc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { humanEdits } from '../schema';
import type { HumanEdit, NewHumanEdit } from './types';

export async function insertHumanEdit(db: Db, input: NewHumanEdit): Promise<HumanEdit> {
  const [created] = await db.insert(humanEdits).values(input).returning();
  if (!created) throw new Error('insertHumanEdit: insert returned no row');
  return created;
}

export async function listHumanEditsForDraft(db: Db, draftId: string): Promise<HumanEdit[]> {
  return db.select().from(humanEdits).where(eq(humanEdits.draftId, draftId)).orderBy(asc(humanEdits.createdAt));
}
