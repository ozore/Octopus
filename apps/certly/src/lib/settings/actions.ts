'use server';

/**
 * M13's server actions — `specs/13` §6.
 *
 * EVERY ONE DECLARES ITS MINIMUM ROLE AND CHECKS IT SERVER-SIDE (§7, A3).
 * Hiding a control is a courtesy; refusing the write is the control.
 *
 * The one that is not administrivia is `updateEntityBlockAction`. The entity
 * block is a FUNCTIONAL INPUT to M5's certificate-holder check, so changing it
 * changes verdicts — the UI says so before saving, and the change enqueues a
 * re-evaluation of every vendor rather than leaving yesterday's answers on
 * screen (A1).
 */

import { redirect } from 'next/navigation';

import { certlyEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import {
  cancelDeletion,
  inviteMember,
  requestDeletion,
  roleFor,
  setPreferences,
  setRole,
} from '@/lib/repos/settings';
import { ensureOrgSettings, updateOrgSettings } from '@/lib/repos';
import { isCertlyRole, requireCapability, type Capability, type CertlyRole } from '@/lib/settings/roles';
import { updateOrganisation } from '@octopus/platform/auth';
import { enqueue } from '@octopus/platform/jobs';
import { requireOrg } from '@octopus/platform/next';

async function guard(capability: Capability) {
  const { org, user, membership } = await requireOrg();
  const db = await getDb();
  const role: CertlyRole = await roleFor(db, {
    orgId: org.id,
    userId: user.id,
    platformRole: membership.role,
  });
  try {
    requireCapability(role, capability);
  } catch {
    redirect('/settings?error=forbidden');
  }
  return { db, org, user, role, actor: { kind: 'user' as const, userId: user.id, email: user.email } };
}

export async function updateOrgAction(formData: FormData): Promise<void> {
  const { db, org, actor } = await guard('settings.write');
  const name = String(formData.get('name') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? '').trim();
  if (name) await updateOrganisation(db, { orgId: org.id, name });
  if (timezone) await updateOrgSettings(db, { orgId: org.id, actor, patch: { timezone } });
  await trackEvent(db, { name: 'settings_viewed', orgId: org.id, props: { section: 'org' } });
  redirect('/settings/org?saved=1');
}

export async function updateEntityBlockAction(formData: FormData): Promise<void> {
  const { db, org, actor } = await guard('settings.write');
  const entityBlock = String(formData.get('entityBlock') ?? '').trim();
  if (entityBlock.length < 1 || entityBlock.length > 500) redirect('/settings/org?error=length');

  await updateOrgSettings(db, { orgId: org.id, actor, patch: { entityBlock } });

  // A1: changing the holder block is a change of MEANING, so every vendor is
  // re-compared rather than left showing a verdict computed against the old
  // string. The job is enqueued in the same request; the drain runs it.
  await enqueue(db, {
    kind: 'certly.run_comparison',
    payload: { orgId: org.id, cause: 'entity_block_changed' },
    dedupeKey: `certly.reevaluate:${org.id}:${Date.now()}`,
  });
  await trackEvent(db, {
    name: 'entity_block_changed',
    orgId: org.id,
    props: { reevaluated_vendors: 0 },
  });
  redirect('/settings/org?saved=entity');
}

export async function addAlternateHolderAction(formData: FormData): Promise<void> {
  const { db, org, actor } = await guard('settings.write');
  const holder = String(formData.get('holder') ?? '').trim();
  if (!holder) redirect('/settings/org?error=holder');

  const settings = await ensureOrgSettings(db, org.id);
  const holders = [...(settings.alternateHolders ?? [])];
  if (!holders.includes(holder)) holders.push(holder);
  await updateOrgSettings(db, { orgId: org.id, actor, patch: { alternateHolders: holders } });
  await trackEvent(db, { name: 'alternate_holder_added', orgId: org.id });
  redirect('/settings/org?saved=holder');
}

export async function inviteMemberAction(formData: FormData): Promise<void> {
  const { db, org, user, actor } = await guard('members.manage');
  const email = String(formData.get('email') ?? '');
  const role = String(formData.get('role') ?? 'editor');
  if (!isCertlyRole(role)) redirect('/settings/team?error=role');

  const entitlement = await certlyEntitlement(db, org.id);
  const result = await inviteMember(db, {
    orgId: org.id,
    email,
    role,
    invitedBy: user.id,
    actor,
    seatLimit: entitlement.seatLimit,
  });

  if (result.status === 'seat_limit') {
    redirect(
      `/settings/team?error=seat_limit&used=${result.used}&limit=${result.limit}&plan=${entitlement.planName}`,
    );
  }
  if (result.status === 'already_member') redirect('/settings/team?error=already_member');

  await trackEvent(db, { name: 'member_invited', orgId: org.id, props: { role } });
  // In mock mode the invitation link is shown on the page; a live deploy mails
  // it through the platform's one send path.
  redirect(`/settings/team?invited=1&token=${result.token}`);
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  const { db, org, actor } = await guard('members.manage');
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!isCertlyRole(role) || !userId) redirect('/settings/team?error=role');

  const result = await setRole(db, { orgId: org.id, userId, role, actor });
  if (result.status === 'last_owner') redirect('/settings/team?error=last_owner');
  await trackEvent(db, { name: 'role_changed', orgId: org.id, props: { role } });
  redirect('/settings/team?saved=role');
}

export async function updatePreferencesAction(formData: FormData): Promise<void> {
  const { db, org, user } = await guard('read');
  await setPreferences(db, {
    orgId: org.id,
    userId: user.id,
    preferences: {
      weeklyDigest: formData.get('weeklyDigest') === 'on',
      reviewAlerts: formData.get('reviewAlerts') === 'on',
      bounceAlerts: formData.get('bounceAlerts') === 'on',
    },
  });
  redirect('/settings/notifications?saved=1');
}

export async function requestDeletionAction(formData: FormData): Promise<void> {
  const { db, org, user, actor } = await guard('org.delete');
  // §10: a destructive action requires the org's name typed, never a bare
  // "are you sure".
  if (String(formData.get('confirm') ?? '').trim() !== org.name) {
    redirect('/settings/data?error=confirm');
  }
  const { scheduledFor } = await requestDeletion(db, { orgId: org.id, userId: user.id, actor });
  await trackEvent(db, { name: 'deletion_requested', orgId: org.id });
  redirect(`/settings/data?deletion=${scheduledFor.toISOString().slice(0, 10)}`);
}

export async function cancelDeletionAction(): Promise<void> {
  const { db, org, actor } = await guard('org.delete');
  await cancelDeletion(db, { orgId: org.id, actor });
  await trackEvent(db, { name: 'deletion_cancelled', orgId: org.id });
  redirect('/settings/data?cancelled=1');
}
