'use server';

/**
 * WL-08's server actions: accept a modification, dismiss an alert, and the
 * change-alert unsubscribe.
 *
 * Accepting is the one that matters. It re-pins the project, opens a new
 * `project_wd_pin_history` row and updates the OPEN worker mappings so FUTURE
 * payrolls carry the new rates — and it touches no certified payroll, no
 * payroll line and no generated document, ever. That is not a policy: a signed
 * WH-347 is a federal statement, and silently re-rating one would be a false
 * certification under 18 U.S.C. § 1001.
 *
 * "Stay on this modification" is a first-class choice and not a deferral. 29
 * CFR 1.6 fixes the applicable determination at solicitation or award, so a
 * project deliberately sitting on an older modification is correct and common;
 * dismissing says so, and the banner persists on draft payrolls afterwards
 * because dismissing is not the same as being right.
 */

import { redirect } from 'next/navigation';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { requireOrg } from '@octopus/platform/next';

import { acceptModification, dismissAlert, getAlert } from '@/lib/alerts/service';
import { setAlertEmails } from '@/lib/repositories/settings';
import { TOKEN_PURPOSES, verifyOpaque } from '@/lib/tokens';

export async function acceptModificationAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const alertId = String(formData.get('alertId') ?? '');

  const before = await getAlert(db, { orgId: org.id, alertId });
  const result = await acceptModification(db, { orgId: org.id, alertId, userId: user.id });

  if (result.status === 'blocked_by_removal') {
    await emitEvent(db, 'wd_classification_removed_blocking', {
      orgId: org.id,
      userId: user.id,
      props: { workers: before?.alert.affectedWorkerCount ?? 0 },
    });
    redirect(`/alerts/${alertId}?error=blocked_by_removal`);
  }
  if (result.status !== 'accepted') {
    // `determination_not_held` and `not_found` are both "we cannot do this
    // safely" — the pin stays where it is and the page says so.
    redirect(`/alerts/${alertId}?error=${result.status}`);
  }

  const hoursToDecide = before
    ? Math.max(0, Math.round((Date.now() - before.alert.createdAt.getTime()) / 3_600_000))
    : 0;
  await emitEvent(db, 'wd_modification_accepted', {
    orgId: org.id,
    userId: user.id,
    props: { affected_worker_count: result.affectedWorkerCount, hours_to_decide: hoursToDecide },
  });
  await emitEvent(db, 'project_repinned', {
    orgId: org.id,
    userId: user.id,
    props: { reason: 'accepted_modification' },
  });

  redirect('/alerts?accepted=1');
}

export async function dismissAlertAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const alertId = String(formData.get('alertId') ?? '');

  const result = await dismissAlert(db, { orgId: org.id, alertId, userId: user.id });
  if (result === 'not_found') redirect('/alerts');

  await emitEvent(db, 'wd_modification_dismissed', { orgId: org.id, userId: user.id });
  redirect('/alerts?dismissed=1');
}

/**
 * The unsubscribe in every change-alert email (V6). It lives at
 * `/email/unsubscribe`, OUTSIDE the signed-in shell — `/alerts/*` is behind
 * `requireOrg()`, and an unsubscribe that needs a login is not an unsubscribe. It turns off **change
 * alerts only** — the sign-in link, the trial reminder, the renewal notice and
 * every other transactional message keep sending, because those are messages
 * this customer needs and a marketing-shaped off switch may never stop them.
 *
 * No login: the token in the message is the authorisation, and the only thing
 * it can do is set one boolean to false.
 */
export async function unsubscribeAlertsAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const token = String(formData.get('token') ?? '');
  const orgId = verifyOpaque(TOKEN_PURPOSES.alertUnsubscribe, token);
  if (!orgId) redirect('/email/unsubscribe?state=invalid');

  await setAlertEmails(db, orgId, false);
  await emitEvent(db, 'wd_alert_unsubscribed', { orgId });
  redirect('/email/unsubscribe?state=done');
}
