'use server';

/**
 * Server actions — the app's only mutation surface for the UI.
 *
 * They live in the APP rather than in the platform on purpose: `'use server'`
 * is a compilation contract between Next.js and this app's bundle, so the
 * platform exports plain async functions and the app wraps the handful it
 * needs. Each wrapper is a few lines, and the seam is where an app adds its own
 * authorisation and product rules.
 *
 * TWO RULES EVERY ACTION HERE FOLLOWS:
 *  - authorise first (`requireOrg` / `requireOwner`), and never take `orgId`
 *    from a form field;
 *  - check the ENTITLEMENT against real rows before the write, so the cap is
 *    enforced where the row is created rather than where the button is drawn.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { countTrackedVendors, createVendor } from '@/lib/repos';
import { addMember, removeMember, requestMagicLink, updateOrganisation } from '@octopus/platform/auth';
import { openBillingPortal, startCheckout, withinLimit } from '@octopus/platform/billing';
import { getAdapters } from '@octopus/platform/adapters';
import { requireOrg, requireOwner, signOut } from '@octopus/platform/next';

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
 * THE METER IS TRACKED VENDORS, so the cap is checked against the count of
 * non-archived vendors — not against certificates, and not against documents
 * (`specs/10` §2.1). A vendor who has never sent anything consumes a slot, and
 * that is deliberate: a manager who imports eighty vendors to find out which
 * are uncovered is buying exactly that finding.
 */
export async function createVendorAction(formData: FormData): Promise<void> {
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/vendors?state=invalid');

  const tracked = await countTrackedVendors(db, org.id);
  if (!withinLimit(entitlement, 'vendors', tracked)) redirect('/vendors?state=limit_reached');

  await createVendor(db, {
    orgId: org.id,
    actor: { kind: 'user', userId: user.id, email: user.email },
    vendor: {
      name,
      contactEmail: String(formData.get('contactEmail') ?? '').trim() || null,
      contactLabel: String(formData.get('contactLabel') ?? '').trim() || null,
    },
  });

  redirect('/vendors?state=created');
}
