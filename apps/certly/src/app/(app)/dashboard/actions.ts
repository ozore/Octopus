'use server';

/**
 * M6's bulk actions — `specs/06` §5, `UX.md` §3.4.
 *
 * EXACTLY TWO, and no third. Chase the selected vendors, or export a gap report
 * for them. There is no bulk delete and no bulk status change, because **a
 * status is a conclusion drawn from a document and must not be settable by
 * hand** (`UX.md` §3.4). A product that lets somebody mark a vendor green is a
 * product whose green means nothing.
 */

import { redirect } from 'next/navigation';

import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { rosterForScope } from '@/lib/repos/dashboard';
import { enqueue } from '@octopus/platform/jobs';
import { requireOrg } from '@octopus/platform/next';

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

export async function bulkRemindAction(form: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const vendorIds = form.getAll('vendorId').map(String).filter(Boolean);

  if (vendorIds.length === 0) redirect('/dashboard?bulk=none');

  const vendors = await rosterForScope(db, { orgId: org.id, filter: { vendorIds } });
  const plan = planBulkRemind(vendors);

  // The SCHEDULING is M7's (`specs/07` §8) and the handler is registered in
  // `src/lib/platform.ts`; the dashboard's job is to choose who, to say who was
  // skipped and why, and to hand the work over transactionally.
  if (plan.queued.length > 0) {
    await enqueue(db, {
      kind: 'certly.schedule_reminders',
      payload: { orgId: org.id, vendorIds: plan.queued, requestedBy: user.id },
    });
  }

  await trackEvent(db, {
    name: 'bulk_remind_clicked',
    orgId: org.id,
    userId: user.id,
    props: { selected: vendorIds.length, queued: plan.queued.length, skipped: plan.skipped.length },
  });

  const params = new URLSearchParams({
    bulk: 'remind',
    queued: String(plan.queued.length),
    skipped: String(plan.skipped.length),
  });
  if (plan.skipped.length > 0) params.set('why', skipSentence(plan));
  redirect(`/dashboard?${params.toString()}`);
}
