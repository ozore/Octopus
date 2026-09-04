'use server';

/**
 * WL-10's server actions.
 *
 * The rule that surprises people, and which every one of these actions keeps:
 * **changing the company name or address does not regenerate any existing
 * document** (V7). The PDF that was filed is the record. Nothing here touches
 * `documents`, `payrolls` or `payroll_lines`, and the screen says so out loud
 * rather than leaving it to be discovered.
 */

import { and, eq, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { payrolls, projects } from '@/lib/schema';
import { updateOrganisation } from '@octopus/platform/auth';
import { requireOrg, requireOwner } from '@octopus/platform/next';

import {
  cancelDeletion,
  requestDeletion,
  setAlertEmails,
  SettingsValidationError,
  updateSettings,
} from '@/lib/repositories/settings';

const trimmed = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const orNull = (value: string): string | null => (value === '' ? null : value);

/** V8 — the workweek start day reorders WL-05's 7-element hours arrays, so it
 *  cannot move while a draft payroll is open. */
async function hasDraftPayroll(
  db: Awaited<ReturnType<typeof getDb>>,
  orgId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: payrolls.id })
    .from(payrolls)
    .innerJoin(projects, eq(projects.id, payrolls.projectId))
    .where(and(eq(projects.orgId, orgId), eq(payrolls.status, 'draft'), isNull(payrolls.certifiedAt)))
    .limit(1);
  return rows.length > 0;
}

export async function saveCompanyAction(formData: FormData): Promise<void> {
  const { org } = await requireOwner();
  const db = await getDb();

  const name = trimmed(formData, 'legalName');
  const workweekStartDay = Number(formData.get('workweekStartDay') ?? 0);
  const changed: string[] = [];

  // V1 — a form cannot print without these, so once set they cannot be blanked.
  if (!name) redirect('/settings?error=legal_name_required');

  if (name !== org.name) {
    await updateOrganisation(db, { orgId: org.id, name });
    changed.push('legal_name');
  }

  if (workweekStartDay !== Number(formData.get('currentWorkweekStartDay') ?? 0)) {
    if (await hasDraftPayroll(db, org.id)) {
      redirect('/settings?error=workweek_blocked');
    }
    changed.push('workweek_start_day');
  }

  try {
    await updateSettings(db, org.id, {
      businessAddressLine1: orNull(trimmed(formData, 'addressLine1')),
      businessAddressLine2: orNull(trimmed(formData, 'addressLine2')),
      businessCity: orNull(trimmed(formData, 'city')),
      businessStateCode: orNull(trimmed(formData, 'stateCode').toUpperCase()),
      businessPostalCode: orNull(trimmed(formData, 'postalCode')),
      ...(trimmed(formData, 'phone') ? { businessPhone: trimmed(formData, 'phone') } : {}),
      workweekStartDay,
      defaultDailyHours: trimmed(formData, 'defaultDailyHours') || '8.00',
    });
  } catch (error) {
    if (error instanceof SettingsValidationError) {
      redirect(`/settings?error=${error.field}`);
    }
    throw error;
  }

  changed.push('business_address');
  await emitEvent(db, 'organisation_updated', {
    orgId: org.id,
    props: { fields_changed: changed },
  });
  if (changed.includes('workweek_start_day')) {
    await emitEvent(db, 'workweek_start_changed', { orgId: org.id });
  }
  await emitEvent(db, 'default_daily_hours_changed', { orgId: org.id });
  redirect('/settings?saved=company');
}

export async function saveCertifyingOfficialAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const db = await getDb();
  try {
    await updateSettings(db, org.id, {
      defaultCertifyingName: orNull(trimmed(formData, 'certifyingName')),
      defaultCertifyingTitle: orNull(trimmed(formData, 'certifyingTitle')),
      ...(trimmed(formData, 'certifyingPhone')
        ? { defaultCertifyingPhone: trimmed(formData, 'certifyingPhone') }
        : {}),
      ...(trimmed(formData, 'certifyingEmail')
        ? { defaultCertifyingEmail: trimmed(formData, 'certifyingEmail') }
        : {}),
    });
  } catch (error) {
    if (error instanceof SettingsValidationError) redirect(`/settings?error=${error.field}`);
    throw error;
  }
  await emitEvent(db, 'certifying_official_set', { orgId: org.id });
  redirect('/settings?saved=certifying');
}

/** WL-08 V6's switch, from the inside. The unsubscribe link in the email sets
 *  the same boolean; this is where it is turned back on. */
export async function saveNotificationsAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const db = await getDb();
  const enabled = formData.get('alertEmails') === 'on';
  await setAlertEmails(db, org.id, enabled);
  await emitEvent(db, 'organisation_updated', {
    orgId: org.id,
    props: { fields_changed: ['alert_emails_enabled'] },
  });
  redirect('/settings?saved=notifications');
}

/**
 * V9 — deletion is a 30-day window and a typed confirmation, and the screen
 * states plainly that certified payrolls carry a three-year federal retention
 * obligation which is the contractor's, not ours. We are not the last copy of
 * somebody's compliance record, and we say so before we delete anything.
 */
export async function requestDeletionAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const db = await getDb();
  const typed = trimmed(formData, 'confirmName');
  if (typed !== org.name) redirect('/settings?error=confirm_name');

  await requestDeletion(db, { orgId: org.id, userId: user.id });
  await emitEvent(db, 'organisation_deletion_requested', { orgId: org.id, userId: user.id });
  redirect('/settings?saved=deletion_requested');
}

export async function cancelDeletionAction(): Promise<void> {
  const { org } = await requireOwner();
  const db = await getDb();
  await cancelDeletion(db, org.id);
  await emitEvent(db, 'organisation_deletion_cancelled', { orgId: org.id });
  redirect('/settings?saved=deletion_cancelled');
}
