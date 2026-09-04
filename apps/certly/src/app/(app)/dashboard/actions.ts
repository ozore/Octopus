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
import { planBulkRemind, skipSentence, type BulkRemindPlan } from '@/lib/reminders/bulk';
import { enqueue } from '@octopus/platform/jobs';
import { requireOrg } from '@octopus/platform/next';

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
