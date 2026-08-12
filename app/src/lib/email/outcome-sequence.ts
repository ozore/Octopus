/**
 * Scheduling the day-3/10/21 outcome sequence and the magic link.
 *
 * Spec: ARCHITECTURE.md §3.7 / ADR-005 — "scheduled by the worker process off
 * a Postgres `scheduled_email` table, not an external scheduler." The actual
 * dispatch mechanism is a `jobs` row per `scheduledEmails` row: `jobs` is what
 * gets claimed with `FOR UPDATE SKIP LOCKED` (ADR-005's queue), and
 * `scheduledEmails` is the durable ledger that makes scheduling idempotent
 * and cancellable (ADR-008 ¶1/¶4 — a revoked consent must be able to cancel
 * an unsent email). See `db/repositories/scheduled-emails.ts`'s header for
 * the full reconciliation note.
 */

import * as scheduledEmailsRepo from '../db/repositories/scheduled-emails';
import { enqueueJob } from '../queue';
import type { Db } from '../db';

const DAY_MS = 24 * 60 * 60 * 1000;

export type OutcomeSequenceOptions = {
  /** Set false in tests that don't want real day-offsets. */
  now?: Date;
};

/**
 * Schedules all four rows for a case: the magic link (immediate) and the
 * day-3/10/21 self-report prompts. Called from billing/fulfillment.ts inside
 * the SAME transaction as the payment write (ADR-005: "a case cannot be
 * marked paid without its follow-up sequence being scheduled in the same
 * transaction").
 */
export async function scheduleOutcomeSequence(db: Db, caseId: string, opts: OutcomeSequenceOptions = {}) {
  const now = opts.now ?? new Date();
  const plan: { kind: 'magic_link' | 'd3' | 'd10' | 'd21'; sendAfter: Date }[] = [
    { kind: 'magic_link', sendAfter: now },
    { kind: 'd3', sendAfter: new Date(now.getTime() + 3 * DAY_MS) },
    { kind: 'd10', sendAfter: new Date(now.getTime() + 10 * DAY_MS) },
    { kind: 'd21', sendAfter: new Date(now.getTime() + 21 * DAY_MS) },
  ];

  const rows = [];
  for (const item of plan) {
    const row = await scheduledEmailsRepo.scheduleEmail(db, {
      caseId,
      kind: item.kind,
      sendAfter: item.sendAfter,
    });
    await enqueueJob(
      db,
      'send_scheduled_email',
      { scheduledEmailId: row.id },
      { runAfter: item.sendAfter },
    );
    rows.push(row);
  }
  return rows;
}
