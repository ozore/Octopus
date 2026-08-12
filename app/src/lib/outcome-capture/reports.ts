/**
 * Outcome-report capture — the day-3/10/21 self-report landing here from the
 * one-click email links (email/templates.ts's `outcomeRequestEmail`).
 *
 * Spec: ARCHITECTURE.md §3.7, CORPUS_DESIGN.md §4.6 point 1 — "one-click
 * 'Rejected' must be as prominent as one-click 'Reinstated'." This module
 * treats every decision identically; nothing here special-cases a good
 * outcome over a bad one.
 */

import * as casesRepo from '../db/repositories/cases';
import * as outcomeReportsRepo from '../db/repositories/outcome-reports';
import { enqueueJob } from '../queue';
import type { Db } from '../db';
import type { OutcomeReport } from '../db/repositories/types';

export type OutcomeDecision = OutcomeReport['decision'];

export type RecordOutcomeInput = {
  source?: OutcomeReport['source'];
  submitted?: boolean;
  decision: OutcomeDecision;
  roundsToDecision?: number;
  whatWeGotWrong?: string;
  reportedAt?: Date;
};

/**
 * Records a self-report and, for a terminal decision (`reinstated` or
 * `rejected`), enqueues `redact_notice` so the consented outcome loop can
 * pick the case up without the caller having to know that wiring. `unknown`/
 * `no_response` reports do NOT enqueue redaction — CORPUS_DESIGN.md §4.5's
 * "n is never claimed" discipline extends here: an unresolved case is not yet
 * evidence of anything.
 */
export async function recordOutcomeReport(
  db: Db,
  caseId: string,
  input: RecordOutcomeInput,
): Promise<OutcomeReport> {
  const caseRow = await casesRepo.requireCase(db, caseId);
  const daysToDecision = caseRow.paidAt
    ? Math.round(((input.reportedAt ?? new Date()).getTime() - caseRow.paidAt.getTime()) / 86_400_000)
    : undefined;

  const report = await outcomeReportsRepo.insertOutcomeReport(db, {
    caseId,
    source: input.source ?? 'email_form',
    submitted: input.submitted ?? true,
    decision: input.decision,
    ...(input.roundsToDecision !== undefined ? { roundsToDecision: input.roundsToDecision } : {}),
    ...(daysToDecision !== undefined ? { daysToDecision } : {}),
    ...(input.whatWeGotWrong ? { whatWeGotWrong: input.whatWeGotWrong } : {}),
    ...(input.reportedAt ? { reportedAt: input.reportedAt } : {}),
  });

  if (input.decision === 'reinstated' || input.decision === 'rejected') {
    await enqueueJob(db, 'redact_notice', { caseId });
  }

  return report;
}
