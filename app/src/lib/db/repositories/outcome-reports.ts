/**
 * Outcome-report repository — the day-3/10/21 self-report (B9).
 * Spec: ARCHITECTURE.md §3.7, §5.2 ¶4. `what_we_got_wrong` is a free-text
 * field we actually read — a primary input to the next corpus release, so it
 * is never truncated or dropped here.
 *
 * CORPUS_DESIGN.md §4.6 point 1: "Failures are worth more than successes ...
 * one-click 'Rejected' must be as prominent as one-click 'Reinstated'." This
 * repository treats every decision value identically — there is no code path
 * that special-cases `reinstated` over `rejected`.
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { outcomeReports } from '../schema';
import type { NewOutcomeReport, OutcomeReport } from './types';

export async function insertOutcomeReport(db: Db, input: NewOutcomeReport): Promise<OutcomeReport> {
  const [created] = await db.insert(outcomeReports).values(input).returning();
  if (!created) throw new Error('insertOutcomeReport: insert returned no row');
  return created;
}

export async function listOutcomeReportsForCase(db: Db, caseId: string): Promise<OutcomeReport[]> {
  return db
    .select()
    .from(outcomeReports)
    .where(eq(outcomeReports.caseId, caseId))
    .orderBy(desc(outcomeReports.reportedAt));
}

export async function getLatestOutcomeReport(
  db: Db,
  caseId: string,
): Promise<OutcomeReport | undefined> {
  const rows = await listOutcomeReportsForCase(db, caseId);
  return rows[0];
}
