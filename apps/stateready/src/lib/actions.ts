'use server';

/**
 * Server actions — the app's only mutation surface for the UI.
 *
 * They live in the APP rather than in the platform because `'use server'` is a
 * compilation contract between Next.js and this app's bundle. Each wrapper is
 * thin, and the seam is where StateReady adds its own authorisation and product
 * rules: **entitlement is checked here, server-side, never in the UI**
 * (`specs/09` §Validation — `addOperatingState` refuses over `stateLimit`
 * regardless of what the client sends).
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { addMember, removeMember, requestMagicLink, updateOrganisation } from '@octopus/platform/auth';
import { getAdapters } from '@octopus/platform/adapters';
import { limitOf, openBillingPortal, startCheckout } from '@octopus/platform/billing';
import { track } from '@octopus/platform/events';
import { requireOrg, requireOwner, signOut } from '@octopus/platform/next';

import { isTrade } from '@/lib/kb/accessors';
import type { Trade } from '@/lib/kb/types';
import { saveCompanyProfile, setOperatingStates } from '@/lib/repos/company';
import { refreshDashboardSummary } from '@/lib/repos/dashboard';
import { deriveForOrganisation } from '@/lib/repos/deadlines';
import { runImport } from '@/lib/repos/technicians';
import { enterpriseEnquiries } from '@/lib/schema';
import { newId } from '@octopus/platform';

async function ctx() {
  const db = await getDb();
  return { db, adapters: getAdapters(), env: getEnv() };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Auth (unchanged from the template; one code path, not two) -------------

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
  const result = await removeMember(db, { orgId: org.id, userId: String(formData.get('userId') ?? '') });
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

// --- M2: company profile ----------------------------------------------------

export async function saveCompanyProfileAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await saveCompanyProfile(db, {
    orgId: org.id,
    legalName: String(formData.get('legalName') ?? '').trim(),
    technicianCountBand: String(formData.get('technicianCountBand') ?? '') || null,
    actorUserId: user.id,
  });
  redirect('/settings/company?saved=1');
}

/**
 * The cross product of states and trades, written as pairs.
 *
 * The form posts `state:trade` values, so a company that is electrical in Texas
 * and plumbing in Florida cannot accidentally be recorded as doing both
 * everywhere — the single most likely modelling mistake in this product
 * (`specs/02` §Edge cases).
 */
export async function setOperatingStatesAction(formData: FormData): Promise<void> {
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const pairs = formData
    .getAll('pair')
    .map(String)
    .map((value) => value.split(':'))
    .filter((parts): parts is [string, Trade] => parts.length === 2 && isTrade(parts[1] ?? ''))
    .map(([state, trade]) => ({ state: state.toUpperCase(), trade }));

  // Server-side entitlement, not a UI hint. Above the cap there is a REAL
  // route, not a dead end (`specs/09` §Above the cap).
  const distinctStates = new Set(pairs.map((p) => p.state));
  const stateLimit = limitOf(entitlement, 'states', 1);
  if (typeof stateLimit === 'number' && stateLimit > 0 && distinctStates.size > stateLimit) {
    await track(db, {
      name: 'plan_limit_hit',
      orgId: org.id,
      props: { limit: 'states', requested: distinctStates.size, allowed: stateLimit },
    });
    redirect(`/settings/company?error=state_limit&requested=${distinctStates.size}&allowed=${stateLimit}`);
  }

  const result = await setOperatingStates(db, { orgId: org.id, rows: pairs, actorUserId: user.id });
  for (const pair of pairs) {
    await track(db, { name: 'operating_state_added', orgId: org.id, props: { state: pair.state, trade: pair.trade } });
  }
  await deriveForOrganisation(db, org.id, { today: today(), userId: user.id });
  await refreshDashboardSummary(db, org.id, today());

  const refused = result.refused.length > 0 ? `&refused=${result.refused.length}` : '';
  redirect(`/settings/company?saved=1${refused}`);
}

/** The 16th state is a routable conversation, not a wall (`specs/09` M8). */
export async function enterpriseEnquiryAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await db.insert(enterpriseEnquiries).values({
    id: newId('ent'),
    orgId: org.id,
    userId: user.id,
    stateCount: Number(formData.get('stateCount') ?? 0),
    technicianCount: Number(formData.get('technicianCount') ?? 0),
    message: String(formData.get('message') ?? '') || null,
  });
  await track(db, {
    name: 'enterprise_enquiry_created',
    orgId: org.id,
    props: { stateCount: Number(formData.get('stateCount') ?? 0) },
  });
  redirect('/settings/company?enquiry=sent');
}

// --- M3: roster import ------------------------------------------------------

export async function runImportAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const text = String(formData.get('csv') ?? '');
  const format = String(formData.get('dateFormat') ?? 'mdy') === 'dmy' ? 'dmy' : 'mdy';
  if (!text.trim()) redirect('/roster/import?error=empty');

  const summary = await runImport(
    db,
    { orgId: org.id, userId: user.id, filename: String(formData.get('filename') ?? 'pasted.csv'), text, format },
    { today: today() },
  );
  await refreshDashboardSummary(db, org.id, today());
  redirect(
    `/roster?imported=${summary.created}&updated=${summary.updated}&skipped=${summary.skipped}`,
  );
}
