'use server';

/**
 * M7's server actions. `specs/07` §8.
 *
 * Each one authorises first and never takes `orgId` from a form field — the
 * rule `src/lib/actions.ts` sets for the whole app. They live beside the screen
 * rather than in the shared actions file so that M7 grows in its own directory.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireOrg } from '@octopus/platform/next';

import { getDb } from '@/lib/db';
import { pauseReminders, sendReminderNow, updateReminderSettings, RUNGS } from '@/lib/reminders';

export async function saveReminderSettingsAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const db = await getDb();

  const ladder = RUNGS.filter((rung) => formData.get(`rung:${rung}`) === 'on');
  const replyTo = String(formData.get('replyToEmail') ?? '').trim();
  const sendingName = String(formData.get('sendingName') ?? '').trim();

  await updateReminderSettings(db, {
    orgId: org.id,
    patch: {
      // An empty ladder would silently switch chasing off for the whole
      // account, which is a decision, not a form state. Refuse it.
      ladder: ladder.length > 0 ? [...ladder] : [...RUNGS],
      replyToEmail: replyTo || null,
      sendingName: sendingName || null,
      paused: formData.get('paused') === 'on',
      weeklyDigestDay: Number(formData.get('weeklyDigestDay') ?? 1),
    },
  });
  revalidatePath('/settings/reminders');
  redirect('/settings/reminders?saved=1');
}

export async function pauseVendorRemindersAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const vendorId = String(formData.get('vendorId') ?? '');
  if (!vendorId) redirect('/settings/reminders');
  await pauseReminders(db, {
    orgId: org.id,
    vendorId,
    paused: formData.get('paused') === 'on',
    actor: { kind: 'user', userId: user.id, email: user.email },
  });
  redirect('/settings/reminders?saved=1');
}

export async function sendReminderNowAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const db = await getDb();
  const vendorId = String(formData.get('vendorId') ?? '');
  const result = await sendReminderNow(db, { orgId: org.id, vendorId });
  redirect(`/settings/reminders/log?sent=${result.queued ? 'queued' : (result.reason ?? 'no')}`);
}
