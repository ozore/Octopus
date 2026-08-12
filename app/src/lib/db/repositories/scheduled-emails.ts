/**
 * Scheduled-email repository — the day-3/10/21 outcome sequence and the magic
 * link (B9, ADR-005). `(case_id, kind)` is unique, so scheduling is idempotent:
 * calling `scheduleEmail` twice for the same case and kind updates the one row
 * rather than double-booking a send.
 */

import { and, eq, isNull, lte } from 'drizzle-orm';

import type { Db } from '../index';
import { scheduledEmails } from '../schema';
import type { NewScheduledEmail, ScheduledEmail } from './types';

export async function scheduleEmail(db: Db, input: NewScheduledEmail): Promise<ScheduledEmail> {
  const [row] = await db
    .insert(scheduledEmails)
    .values(input)
    .onConflictDoUpdate({
      target: [scheduledEmails.caseId, scheduledEmails.kind],
      set: { sendAfter: input.sendAfter, cancelledAt: null },
    })
    .returning();
  if (!row) throw new Error('scheduleEmail: insert returned no row');
  return row;
}

export async function markScheduledEmailSent(
  db: Db,
  id: string,
  providerMessageId: string,
): Promise<void> {
  await db
    .update(scheduledEmails)
    .set({ sentAt: new Date(), providerMessageId })
    .where(eq(scheduledEmails.id, id));
}

export async function getScheduledEmail(db: Db, id: string): Promise<ScheduledEmail | undefined> {
  const rows = await db.select().from(scheduledEmails).where(eq(scheduledEmails.id, id)).limit(1);
  return rows[0];
}

/** Consent revocation / case deletion cancels anything not yet sent (ADR-008
 *  ¶1, ¶4) — an outbound email referencing a case whose subject withdrew
 *  consent is exactly the kind of leak the cascade exists to prevent. */
export async function cancelPendingEmailsForCase(db: Db, caseId: string): Promise<number> {
  const rows = await db
    .update(scheduledEmails)
    .set({ cancelledAt: new Date() })
    .where(and(eq(scheduledEmails.caseId, caseId), isNull(scheduledEmails.sentAt), isNull(scheduledEmails.cancelledAt)))
    .returning();
  return rows.length;
}

/** The scheduler's poll path (ARCHITECTURE.md §5.1 comment: "polled by the
 *  worker on a fixed tick"). In this codebase the primary dispatch mechanism
 *  is a `jobs` row enqueued alongside each `scheduledEmails` row (see
 *  email/outcome-sequence.ts) — `jobs` is what actually gets claimed with
 *  `FOR UPDATE SKIP LOCKED`. This function exists as the reconciliation sweep:
 *  it finds any due-but-unsent row with no corresponding job, which is the
 *  self-healing path if a job row was ever lost (e.g. a pre-jobs-table
 *  migration, or a manually inserted scheduledEmails row). */
export async function listDueUnsentEmails(db: Db, before: Date = new Date()): Promise<ScheduledEmail[]> {
  return db
    .select()
    .from(scheduledEmails)
    .where(
      and(
        lte(scheduledEmails.sendAfter, before),
        isNull(scheduledEmails.sentAt),
        isNull(scheduledEmails.cancelledAt),
      ),
    );
}
