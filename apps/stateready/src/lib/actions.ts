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
import { getSession, requireOrg, requireOwner, signOut } from '@octopus/platform/next';

import { isTrade } from '@/lib/kb/accessors';
import type { Trade } from '@/lib/kb/types';
import { createOneOffCheckout } from '@/lib/billing/one-off';
import type { OneOffSku } from '@/lib/billing/prices';
import { createEnterpriseEnquiry } from '@/lib/billing/enterprise';
import { EXPORT_JOB } from '@/lib/jobs/kinds';
import { cancelDeletion, requestDeletion } from '@/lib/jobs/deletion';
import { requestExport } from '@/lib/jobs/export';
import {
  requestEmailChange,
  setRecipientEnabled,
  updateNotificationPreferences,
  updateOrganisationSettings,
} from '@/lib/repos/settings';
import { brandFromEnv, notificationEmail, sendEmail } from '@octopus/platform/email';
import { enqueue } from '@octopus/platform/jobs';
import { saveCompanyProfile, setOperatingStates } from '@/lib/repos/company';
import { refreshDashboardSummary } from '@/lib/repos/dashboard';
import { deriveForLicence, deriveForOrganisation } from '@/lib/repos/deadlines';
import { runImport } from '@/lib/repos/technicians';
import { enterpriseEnquiries, licences } from '@/lib/schema';
import { newId } from '@octopus/platform';

// --- M4 / M7 / M16 / M17 (B1) ----------------------------------------------
import { and, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { getDocumentStore } from '@/lib/documents';
import { addCeRecord, archiveLicence, createLicence, uploadDocument } from '@/lib/repos/licences';
import { markRenewed, updateLicenceAndReschedule } from '@/lib/repos/renewals';
import {
  createSharedLink,
  ensureReadinessLink,
  revokeSharedLink,
} from '@/lib/repos/shared-links';

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

  // `specs/13` AC1: the app emits the names specs/01–12 document, not the
  // platform's own vocabulary. Both paths into a magic link count.
  await track(db, { name: 'magic_link_requested', props: { status: result.status } });
  if (result.status === 'sent') await track(db, { name: 'magic_link_sent', props: {} });

  const params = new URLSearchParams({ state: result.status });
  if (result.status === 'sent' && result.devUrl) params.set('dev', result.devUrl);
  redirect(`/login?${params.toString()}`);
}

export async function signOutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    const db = await getDb();
    await track(db, { name: 'signed_out', orgId: session.org.id, userId: session.user.id });
  }
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

// --- M4: licences, documents and CE records (specs/04) ----------------------

/**
 * Every mutation below re-materialises the dashboard summary before it
 * redirects. The summary is a read model recomputed synchronously on any
 * licence or deadline write (`specs/07` §Data model), so it is never stale in a
 * way the user can notice — and doing it here rather than in each repository
 * keeps the repositories usable from the nightly cron without a dashboard.
 */
async function refreshBoard(db: Db, orgId: string): Promise<void> {
  await refreshDashboardSummary(db, orgId, today());
}

/** Product errors are the customer's to read, so they travel in the URL. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Nothing was saved.';
}

export async function createLicenceAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();

  const state = String(formData.get('state') ?? '').toUpperCase();
  const trade = String(formData.get('trade') ?? '');
  const back = `/licences/new?state=${encodeURIComponent(state)}&trade=${encodeURIComponent(trade)}`;
  const holderKind = String(formData.get('holderKind') ?? 'technician') === 'entity' ? 'entity' : 'technician';
  const kbLicenceTypeId = String(formData.get('kbLicenceTypeId') ?? '').trim() || null;

  let created: { id: string } | null = null;
  let failure: string | null = null;
  try {
    const result = await createLicence(
      db,
      {
        orgId: org.id,
        holderKind,
        entityId: holderKind === 'entity' ? String(formData.get('entityId') ?? '') || null : null,
        technicianId:
          holderKind === 'technician' ? String(formData.get('technicianId') ?? '') || null : null,
        state,
        trade,
        kbLicenceTypeId,
        customTypeName: kbLicenceTypeId ? null : String(formData.get('customTypeName') ?? '').trim() || null,
        licenceNumber: String(formData.get('licenceNumber') ?? '').trim() || null,
        issuedOn: String(formData.get('issuedOn') ?? '') || null,
        expiresOn: String(formData.get('expiresOn') ?? '') || null,
        notes: String(formData.get('notes') ?? '').trim() || null,
        actorUserId: user.id,
      },
      { today: today() },
    );
    created = { id: result.licence.id };
  } catch (error) {
    failure = messageOf(error);
  }

  if (!created) redirect(`${back}&error=${encodeURIComponent(failure ?? 'unknown')}`);
  await refreshBoard(db, org.id);
  redirect(`/licences/${created.id}?created=1`);
}

export async function updateLicenceAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const licenceId = String(formData.get('licenceId') ?? '');

  let failure: string | null = null;
  try {
    await updateLicenceAndReschedule(
      db,
      {
        orgId: org.id,
        licenceId,
        actorUserId: user.id,
        patch: {
          licenceNumber: String(formData.get('licenceNumber') ?? '').trim() || null,
          issuedOn: String(formData.get('issuedOn') ?? '') || null,
          expiresOn: String(formData.get('expiresOn') ?? '') || null,
          notes: String(formData.get('notes') ?? '').trim() || null,
        },
      },
      { today: today() },
    );
  } catch (error) {
    failure = messageOf(error);
  }

  if (failure) redirect(`/licences/${licenceId}?error=${encodeURIComponent(failure)}`);
  await refreshBoard(db, org.id);
  redirect(`/licences/${licenceId}?saved=1`);
}

export async function archiveLicenceAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await archiveLicence(db, {
    orgId: org.id,
    licenceId: String(formData.get('licenceId') ?? ''),
    actorUserId: user.id,
  });
  await refreshBoard(db, org.id);
  redirect('/licences?archived=1');
}

/**
 * The upload runs THROUGH the `DocumentStore` interface, never past it: the
 * suite swaps in `MemoryDocumentStore` and never touches the network, and live
 * mode swaps in Vercel Blob without this code changing (platform request P-4).
 *
 * The declared content type is ignored. The magic number decides
 * (`specs/04` §Validation: a `.pdf` that is actually a `.exe`).
 */
export async function uploadDocumentAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const env = getEnv();
  const licenceId = String(formData.get('licenceId') ?? '');
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/licences/${licenceId}?error=${encodeURIComponent('Choose a photo or a PDF first.')}`);
  }

  let failure: string | null = null;
  try {
    await uploadDocument(
      db,
      getDocumentStore(env),
      {
        orgId: org.id,
        licenceId,
        filename: (file as File).name || 'document',
        body: new Uint8Array(await (file as File).arrayBuffer()),
        declaredContentType: (file as File).type,
        uploadedByUserId: user.id,
      },
    );
  } catch (error) {
    failure = messageOf(error);
  }

  if (failure) redirect(`/licences/${licenceId}?error=${encodeURIComponent(failure)}`);
  redirect(`/licences/${licenceId}?uploaded=1`);
}

export async function addCeRecordAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const licenceId = String(formData.get('licenceId') ?? '');
  const mode = String(formData.get('deliveryMode') ?? 'unknown');

  let failure: string | null = null;
  try {
    await addCeRecord(db, {
      orgId: org.id,
      licenceId,
      hours: Number(formData.get('hours') ?? 0),
      subject: String(formData.get('subject') ?? '').trim() || null,
      deliveryMode: mode === 'classroom' ? 'classroom' : mode === 'online' ? 'online' : 'unknown',
      provider: String(formData.get('provider') ?? '').trim() || null,
      completedOn: String(formData.get('completedOn') ?? '') || today(),
      actorUserId: user.id,
    });
  } catch (error) {
    failure = messageOf(error);
  }

  if (failure) redirect(`/licences/${licenceId}?error=${encodeURIComponent(failure)}`);
  redirect(`/licences/${licenceId}?ce=1`);
}

// --- M7: the board (specs/07) ----------------------------------------------

/**
 * The single most important button on the dashboard. `marked_renewed` is the
 * strongest retention signal in the product: the customer used us to do the
 * job, not merely to look at it.
 */
export async function markRenewedAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const back = String(formData.get('returnTo') ?? '/dashboard');

  let warning: string | null = null;
  let failure: string | null = null;
  try {
    const result = await markRenewed(
      db,
      {
        orgId: org.id,
        deadlineId: String(formData.get('deadlineId') ?? ''),
        newExpiry: String(formData.get('newExpiry') ?? ''),
        documentId: String(formData.get('documentId') ?? '') || null,
        actorUserId: user.id,
      },
      { today: today() },
    );
    warning = result.warning;
  } catch (error) {
    failure = messageOf(error);
  }

  const separator = back.includes('?') ? '&' : '?';
  if (failure) redirect(`${back}${separator}error=${encodeURIComponent(failure)}`);
  redirect(`${back}${separator}renewed=1${warning ? `&warn=${encodeURIComponent(warning)}` : ''}`);
}

// --- M16: the qualifier watch (UX.md S15) -----------------------------------

/**
 * Marking a qualifier disassociated is the HR event that starts the clock. It
 * re-derives immediately, because the whole value of the screen is that the
 * date exists before anyone thinks to look for it.
 */
export async function setQualifierDisassociationAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const licenceId = String(formData.get('licenceId') ?? '');
  const raw = String(formData.get('disassociatedOn') ?? '').trim();
  const disassociatedOn = raw === '' ? null : raw;

  if (disassociatedOn && disassociatedOn > today()) {
    redirect(
      `/qualifiers?error=${encodeURIComponent('A disassociation date cannot be in the future.')}`,
    );
  }

  await db
    .update(licences)
    .set({ qualifierDisassociatedOn: disassociatedOn, updatedAt: new Date() })
    .where(and(eq(licences.id, licenceId), eq(licences.orgId, org.id)));
  await deriveForLicence(db, licenceId, { today: today(), userId: user.id });
  await track(db, {
    name: disassociatedOn ? 'qualifier_disassociated' : 'qualifier_replaced',
    orgId: org.id,
    userId: user.id,
    props: { licence_id: licenceId },
  });
  await refreshBoard(db, org.id);
  redirect(`/qualifiers?${disassociatedOn ? 'started=1' : 'cleared=1'}`);
}

// --- M17: shared readiness links and technician cards (UX.md S19, S18) ------

export async function createReadinessLinkAction(): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await ensureReadinessLink(db, { orgId: org.id, createdByUserId: user.id });
  redirect('/dashboard?shared=1');
}

export async function createTechnicianCardAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const technicianId = String(formData.get('technicianId') ?? '');
  await createSharedLink(db, {
    orgId: org.id,
    kind: 'technician_card',
    subjectId: technicianId,
    createdByUserId: user.id,
  });
  redirect(`/technicians/${technicianId}?card=1`);
}

export async function revokeSharedLinkAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await revokeSharedLink(db, {
    orgId: org.id,
    linkId: String(formData.get('linkId') ?? ''),
    actorUserId: user.id,
  });
  redirect(String(formData.get('returnTo') ?? '/dashboard') + '?revoked=1');
}

// ---------------------------------------------------------------------------
// --- B2 · M6 alerts, M9 billing, M10 settings
//
// Every one of these checks entitlement and role SERVER-SIDE. A `member` cannot
// reach billing, team management or deletion by calling the action directly,
// which is what `specs/10` AC6 means by "or by direct action call": the UI
// hiding a button is a courtesy, not a control.
// ---------------------------------------------------------------------------

export async function updateNotificationPreferencesAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const result = await updateNotificationPreferences(db, {
    userId: user.id,
    orgId: org.id,
    offsets: formData.getAll('offset').map(String),
    mutedStates: formData.getAll('mutedState').map(String),
    timezone: String(formData.get('timezone') ?? 'America/Chicago'),
    digestHourLocal: Number(formData.get('digestHourLocal') ?? 7),
    paused: formData.get('paused') === 'on',
  });
  redirect(`/settings/notifications?${result.status === 'saved' ? 'saved=1' : 'error=timezone'}`);
}

/** Org-level: who receives a digest at all. Owner only. */
export async function setRecipientAction(formData: FormData): Promise<void> {
  const { org } = await requireOwner();
  const db = await getDb();
  await setRecipientEnabled(db, {
    orgId: org.id,
    userId: String(formData.get('userId') ?? ''),
    enabled: String(formData.get('enabled') ?? '') === 'true',
  });
  redirect('/settings/notifications?recipients=1');
}

/**
 * The digest they WOULD receive today. It removes all doubt during onboarding
 * and it is the cheapest trust builder in the product (`specs/06`).
 */
export async function sendTestAlertAction(): Promise<void> {
  const { org, user } = await requireOrg();
  const { db, adapters, env } = await ctx();
  const { previewDigest } = await import('@/lib/jobs/alerts-drain');
  const preview = await previewDigest({ db, adapters, env }, { orgId: org.id, userId: user.id });
  if (!preview) redirect('/settings/notifications?test=empty');

  await sendEmail(db, adapters, {
    to: user.email,
    content: preview.content,
    tags: { kind: 'test_digest', org_id: org.id },
  });
  await track(db, { name: 'test_alert_sent', orgId: org.id, userId: user.id, props: { items: preview.items.length } });
  redirect('/settings/notifications?test=sent');
}

export async function updateOrganisationSettingsAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const db = await getDb();
  const result = await updateOrganisationSettings(db, {
    orgId: org.id,
    actorUserId: user.id,
    timezone: String(formData.get('timezone') ?? 'America/Chicago'),
    digestHourLocal: Number(formData.get('digestHourLocal') ?? 7),
    ccTechnicians: formData.get('ccTechnicians') === 'on',
    dateFormat: String(formData.get('dateFormat') ?? 'mdy'),
  });
  redirect(`/settings/notifications?${result.status === 'saved' ? 'saved=1' : 'error=timezone'}`);
}

/** Any member may export: it is their compliance data too, and it is logged. */
export async function requestExportAction(): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const result = await requestExport(db, { orgId: org.id, userId: user.id });
  if (result.status === 'rate_limited') redirect('/settings/data?error=rate_limited');
  await enqueue(db, { kind: EXPORT_JOB, payload: { exportId: result.exportId }, dedupeKey: `${EXPORT_JOB}:${result.exportId}` });
  redirect('/settings/data?export=queued');
}

export async function requestDeletionAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const { db, env } = await ctx();
  const result = await requestDeletion(db, {
    orgId: org.id,
    userId: user.id,
    reason: String(formData.get('reason') ?? '') || null,
    typedName: String(formData.get('confirmName') ?? ''),
    organisationName: org.name,
    appName: env.APP_NAME,
    baseUrl: env.APP_BASE_URL,
  });
  redirect(`/settings/data?deletion=${result.status}`);
}

export async function cancelDeletionAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOwner();
  const db = await getDb();
  const result = await cancelDeletion(db, {
    orgId: org.id,
    deletionId: String(formData.get('deletionId') ?? ''),
    userId: user.id,
  });
  redirect(`/settings/data?deletion=${result.status}`);
}

/** The address moves when the NEW address consumes the link, never before. */
export async function requestEmailChangeAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const { db, adapters, env } = await ctx();
  const result = await requestEmailChange(db, {
    orgId: org.id,
    userId: user.id,
    newEmail: String(formData.get('newEmail') ?? ''),
  });
  if (result.status !== 'sent') redirect(`/settings/profile?error=${result.status}`);

  const url = `${env.APP_BASE_URL}/settings/profile/confirm?token=${result.token}`;
  await sendEmail(db, adapters, {
    to: String(formData.get('newEmail') ?? ''),
    content: notificationEmail(brandFromEnv(env), {
      subject: `Confirm your new ${env.APP_NAME} address`,
      paragraphs: [
        `Somebody asked to move a ${env.APP_NAME} account to this address. Nothing changes until you click.`,
        'If that was not you, ignore this message — the address stays where it is.',
      ],
      actionUrl: url,
      actionLabel: 'Confirm this address',
    }),
    tags: { kind: 'email_change', org_id: org.id },
  });
  redirect('/settings/profile?email=sent');
}

/**
 * The 16th state is a routable conversation, not a wall (`specs/09` §Above the
 * cap). The enquiry is written, BOTH parties are emailed, and the event that
 * measures how much of the target list the published ladder cannot serve is
 * emitted.
 */
export async function submitEnterpriseEnquiryAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const { db, adapters, env } = await ctx();
  await createEnterpriseEnquiry(
    { db, adapters, env },
    {
      orgId: org.id,
      userId: user.id,
      email: user.email,
      organisationName: org.name,
      message: String(formData.get('message') ?? '') || null,
    },
  );
  redirect('/settings/billing?enquiry=sent');
}

/** A State Entry Pack checkout. The readiness gate and the gap count are
 *  checked before the session exists (`specs/08` AC5b). */
export async function startEntryPackCheckoutAction(formData: FormData): Promise<void> {
  const { org, user, membership } = await requireOrg();
  if (membership.role !== 'owner') redirect('/expansion?error=owner_only');
  const { db, adapters, env } = await ctx();

  const result = await createOneOffCheckout(
    { db, adapters, env },
    {
      orgId: org.id,
      userId: user.id,
      email: user.email,
      sku: String(formData.get('sku') ?? 'entry_pack') as OneOffSku,
      ...(formData.get('state') ? { state: String(formData.get('state')).toUpperCase() } : {}),
      ...(formData.get('trade') && isTrade(String(formData.get('trade')))
        ? { trade: String(formData.get('trade')) as Trade }
        : {}),
      acknowledgedGapCount: Number(formData.get('gapCount') ?? -1),
      playbookId: String(formData.get('playbookId') ?? '') || null,
      today: today(),
    },
  );
  if (result.status !== 'ok') redirect(`/expansion?error=${result.status}`);
  redirect(result.url);
}
