'use server';

/**
 * Server actions — the app's only mutation surface for the UI.
 *
 * They live in the APP rather than in the platform on purpose: `'use server'`
 * is a compilation contract between Next.js and this app's bundle, so the
 * platform exports plain async functions and the app wraps the handful it
 * needs. Each wrapper is a few lines, and the seam is where an app adds its own
 * authorisation or product rules.
 */

import { count, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { getDetermination } from '@/lib/kb';
import { plans } from '@/lib/plans';
import { newId } from '@octopus/platform';
import { getAdapters } from '@octopus/platform/adapters';
import { addMember, removeMember, requestMagicLink, updateOrganisation } from '@octopus/platform/auth';
import { openBillingPortal, startCheckout, withinLimit } from '@octopus/platform/billing';
import { requireOrg, requireOwner, signOut } from '@octopus/platform/next';

import { createProject } from '@/lib/repositories/projects';
import { projects } from '@/lib/schema';

async function ctx() {
  const db = await getDb();
  return { db, adapters: getAdapters(), env: getEnv() };
}

export async function requestLoginAction(formData: FormData): Promise<void> {
  const { db, adapters, env } = await ctx();
  const requestHeaders = await headers();
  const email = String(formData.get('email') ?? '');
  const next = String(formData.get('next') ?? '') || null;

  const result = await requestMagicLink(
    { db, adapters, env },
    {
      email,
      redirectTo: next,
      ip: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: requestHeaders.get('user-agent'),
    },
  );

  // The event carries the OUTCOME and never the address (WL-EVENTS privacy).
  await emitEvent(db, result.status === 'sent' ? 'magic_link_sent' : 'magic_link_rate_limited', {
    props: { purpose: 'login' },
  });

  const params = new URLSearchParams({ state: result.status });
  // In mock mode there is no inbox: the link is handed back so that local
  // development and the Playwright journey can follow it. `env.ts` refuses
  // ADAPTER_MODE=mock in production, so this cannot leak from a real deploy.
  if (result.status === 'sent' && result.devUrl) params.set('dev', result.devUrl);
  redirect(`/login?${params.toString()}`);
}

export async function signOutAction(): Promise<void> {
  await signOut('/');
}

export async function renameOrganisationAction(formData: FormData): Promise<void> {
  const { org } = await requireOwner();
  const db = await getDb();
  const name = String(formData.get('name') ?? '').trim();
  if (name) await updateOrganisation(db, { orgId: org.id, name });
  redirect('/settings?saved=1');
}

export async function addMemberAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const { db, adapters, env } = await ctx();
  const result = await addMember(
    { db, adapters, env },
    { orgId: org.id, email: String(formData.get('email') ?? ''), invitedBy: user.id },
  );
  redirect(`/settings?member=${result.status}`);
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const { org } = await requireOwner();
  const db = await getDb();
  const result = await removeMember(db, {
    orgId: org.id,
    userId: String(formData.get('userId') ?? ''),
  });
  redirect(`/settings?member=${result.status}`);
}

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const { db, adapters, env } = await ctx();
  const planKey = String(formData.get('planKey') ?? '');
  await emitEvent(db, 'checkout_started', { orgId: org.id, userId: user.id, props: { plan: planKey } });
  const result = await startCheckout(
    { db, adapters, plans, env },
    { orgId: org.id, planKey, userId: user.id, email: user.email },
  );
  if (result.status !== 'ok') redirect(`/settings/billing?error=${result.status}`);
  redirect(result.url);
}

export async function openPortalAction(): Promise<void> {
  const { org } = await requireOwner();
  const { db, adapters, env } = await ctx();
  const result = await openBillingPortal(
    { db, adapters },
    { orgId: org.id, returnUrl: `${env.APP_BASE_URL}/settings/billing` },
  );
  if (result.status !== 'ok') redirect('/settings/billing?error=no_customer');
  redirect(result.url);
}

/**
 * Create a project and PIN a determination — the write the whole product hangs
 * off. **WL-02 owns the screen and will own this action**; the shape it must
 * keep is here: authorise → check the entitlement against real rows → resolve
 * the determination → refuse what does not exist → write the pin and its
 * history row in one call → track.
 *
 * A superseded modification the user NAMED is pinned (29 CFR 1.6); a pair that
 * exists nowhere in the corpus is refused. Those are different answers and this
 * function keeps them different.
 */
export async function createProjectAction(formData: FormData): Promise<void> {
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const [used] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.orgId, org.id));
  if (!withinLimit(entitlement, 'projects', Number(used?.value ?? 0))) {
    redirect('/projects?error=limit_reached');
  }

  const name = String(formData.get('name') ?? '').trim() || 'Untitled project';
  const wdInput = String(formData.get('wdNumber') ?? '').trim();
  const modInput = String(formData.get('wdModificationNumber') ?? '').trim();
  const modification = modInput === '' ? undefined : Number(modInput);

  const resolved = await getDetermination(db, wdInput, modification, { enqueueMissing: true });
  if (resolved.resolution === 'not_found' || resolved.resolution === 'fetching') {
    await emitEvent(db, 'wd_resolve_failed', {
      orgId: org.id,
      userId: user.id,
      props: { reason: resolved.resolution },
    });
    redirect(
      `/projects/new?error=wd_not_found&wd=${encodeURIComponent(wdInput)}${modInput ? `&mod=${modInput}` : ''}`,
    );
  }

  const determination = resolved.determination;
  const superseded = resolved.resolution === 'superseded';

  const project = await createProject(db, {
    id: newId('prj'),
    orgId: org.id,
    name,
    projectOrContractNo: String(formData.get('projectOrContractNo') ?? '').trim(),
    locationDescription: String(formData.get('locationDescription') ?? '').trim(),
    ourRole: String(formData.get('ourRole') ?? 'sub') === 'prime' ? 'prime' : 'sub',
    filerOrganisationId: org.id,
    wdId: determination.wdId,
    wdNumber: determination.wdNumber,
    wdModificationNumber: determination.modificationNumber,
    wdPinnedSuperseded: superseded,
    wdPinMethod: modification === undefined ? 'entered_number' : 'entered_number_and_modification',
    wdPinnedByUserId: user.id,
    stateCode: determination.wdNumber.slice(0, 2),
    ...(determination.countyCount === 1 && determination.countyNames[0]
      ? { countyName: determination.countyNames[0] }
      : {}),
    ...(determination.constructionTypes[0]
      ? { constructionType: determination.constructionTypes[0] }
      : {}),
  });

  await emitEvent(db, 'wd_pinned', {
    orgId: org.id,
    userId: user.id,
    props: {
      wd_number: determination.wdNumber,
      modification_number: determination.modificationNumber,
      pin_method: modification === undefined ? 'entered_number' : 'entered_number_and_modification',
      chosen_from_n: 1,
      is_superseded: superseded,
    },
  });
  await emitEvent(db, 'project_created', {
    orgId: org.id,
    userId: user.id,
    props: { our_role: project.ourRole, construction_type: project.constructionType },
  });

  redirect('/projects?created=1');
}
