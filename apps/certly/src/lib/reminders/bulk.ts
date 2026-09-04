/**
 * The bulk-chase arithmetic, and the sentence it produces.
 *
 * These live OUTSIDE `dashboard/actions.ts` because that file is `'use server'`
 * and Next only lets such a module export async server actions. They are pure
 * on purpose: the counting is the part that must be testable without a queue,
 * a database or a request.
 *
 * `specs/06` §5, `UX.md` §3.4.
 */

export type BulkRemindPlan = {
  queued: string[];
  skipped: { vendorId: string; name: string; reason: 'no_mailbox' | 'reminders_paused' }[];
};

/**
 * `specs/06` A6 — WHO IS SKIPPED AND WHY, counted before anything is queued.
 *
 * Pure, so the arithmetic is testable without a queue: 10 selected, 2 with no
 * contact mailbox, 8 queued and the 2 named. "8 queued" on its own is the
 * answer that loses a customer the week they discover the other two were never
 * asked.
 */
export function planBulkRemind(
  vendors: { id: string; name: string; contactEmail: string | null; remindersPaused: boolean }[],
): BulkRemindPlan {
  const plan: BulkRemindPlan = { queued: [], skipped: [] };
  for (const vendor of vendors) {
    if (!vendor.contactEmail) {
      plan.skipped.push({ vendorId: vendor.id, name: vendor.name, reason: 'no_mailbox' });
      continue;
    }
    if (vendor.remindersPaused) {
      plan.skipped.push({ vendorId: vendor.id, name: vendor.name, reason: 'reminders_paused' });
      continue;
    }
    plan.queued.push(vendor.id);
  }
  return plan;
}

export function skipSentence(plan: BulkRemindPlan): string {
  if (plan.skipped.length === 0) return '';
  const noMailbox = plan.skipped.filter((s) => s.reason === 'no_mailbox');
  const paused = plan.skipped.filter((s) => s.reason === 'reminders_paused');
  const parts: string[] = [];
  if (noMailbox.length > 0) {
    parts.push(
      `${noMailbox.length} had no contact mailbox (${noMailbox.map((s) => s.name).join(', ')}) — Certly never guesses an address`,
    );
  }
  if (paused.length > 0) {
    parts.push(`${paused.length} have reminders paused (${paused.map((s) => s.name).join(', ')})`);
  }
  return `${plan.skipped.length} skipped: ${parts.join('; ')}.`;
}
