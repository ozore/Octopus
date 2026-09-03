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

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { projects } from '@/lib/schema';
import { addMember, removeMember, requestMagicLink, updateOrganisation } from '@octopus/platform/auth';
import { openBillingPortal, startCheckout, withinLimit } from '@octopus/platform/billing';
import { getAdapters } from '@octopus/platform/adapters';
import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { requireOrg, requireOwner, signOut } from '@octopus/platform/next';
import { count, eq } from 'drizzle-orm';

import { ACTIVATION_EVENT } from '@/lib/plans';

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
  const result = await startCheckout(
    { db, adapters, plans, env },
    { orgId: org.id, planKey: String(formData.get('planKey') ?? ''), userId: user.id, email: user.email },
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
 * A product action, shown here because it is the shape every app repeats:
 * authorise → check the ENTITLEMENT against real rows → write → track.
 */
export async function createProjectAction(formData: FormData): Promise<void> {
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const [used] = await db.select({ value: count() }).from(projects).where(eq(projects.orgId, org.id));
  if (!withinLimit(entitlement, 'projects', Number(used?.value ?? 0))) {
    redirect('/dashboard?error=limit_reached');
  }

  const name = String(formData.get('name') ?? '').trim() || 'Untitled project';
  await db.insert(projects).values({ id: newId('prj'), orgId: org.id, name, createdBy: user.id });
  await track(db, { name: ACTIVATION_EVENT, orgId: org.id, userId: user.id, props: { name } });
  redirect('/dashboard?created=1');
}
