'use server';

/**
 * Onboarding's server actions — `specs/11` §6.
 *
 * Every one of them is entitlement-checked against REAL ROWS before the write,
 * and the entitlement an org with no subscription resolves to is the
 * free-onboarding allowance (`specs/10` §8.1), never a denial. Failing closed
 * here would block every new signup before it ever saw a finding, which is the
 * one failure mode that would make the activation threshold measure the paywall
 * rather than the product (REVIEW.md MJ-10).
 */

import { redirect } from 'next/navigation';

import { getEnv } from '@/env';
import { canAddDocument, canAddVendors, certlyEntitlement, importAllowance } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { orgToday } from '@/lib/engine';
import { applyTemplate, createVendor, updateOrgSettings } from '@/lib/repos';
import { ensureOrgSettings } from '@/lib/repos';
import { ingestFirstCertificate, stubReader } from '@/lib/onboarding/first-certificate';
import { parsePastedVendors } from '@/lib/onboarding/paste';
import { completeStep, ensureOnboarding, setAudience, skipOnboarding, startOnboarding } from '@/lib/onboarding/repo';
import { isAudience, isOnboardingStep } from '@/lib/onboarding/steps';
import { requireOrg } from '@octopus/platform/next';

async function context() {
  const { org, user } = await requireOrg();
  const db = await getDb();
  return {
    db,
    orgId: org.id,
    actor: { kind: 'user' as const, userId: user.id, email: user.email },
    userId: user.id,
  };
}

export async function setAudienceAction(formData: FormData): Promise<void> {
  const { db, orgId } = await context();
  const audience = String(formData.get('audience') ?? '');
  if (!isAudience(audience)) redirect('/onboarding/who?error=audience');

  await setAudience(db, { orgId, audience });
  await startOnboarding(db, { orgId, audience });
  await completeStep(db, { orgId, step: 'who' });
  redirect('/onboarding/entity');
}

export async function setEntityBlockAction(formData: FormData): Promise<void> {
  const { db, orgId, actor } = await context();
  const entityBlock = String(formData.get('entityBlock') ?? '').trim();
  // §7: 1–500 characters. A vague entity block produces a vague holder match
  // later, which is why this is a functional input rather than a profile field.
  if (entityBlock.length < 1 || entityBlock.length > 500) {
    redirect('/onboarding/entity?error=length');
  }
  await updateOrgSettings(db, { orgId, actor, patch: { entityBlock } });
  await completeStep(db, { orgId, step: 'entity' });
  redirect('/onboarding/requirements');
}

export async function applyTemplateAction(formData: FormData): Promise<void> {
  const { db, orgId, actor } = await context();
  const templateId = String(formData.get('templateId') ?? '');
  if (!templateId) redirect('/onboarding/requirements?error=template');

  await applyTemplate(db, { orgId, templateId, actor, makeDefault: true });
  await trackEvent(db, {
    name: 'template_applied',
    orgId,
    props: { template_id: templateId, rows: 0 },
  });
  await completeStep(db, { orgId, step: 'requirements' });
  redirect('/onboarding/vendors');
}

export async function pasteVendorsAction(formData: FormData): Promise<void> {
  const { db, orgId, actor } = await context();
  const parsed = parsePastedVendors(String(formData.get('vendors') ?? ''));
  if (parsed.vendors.length === 0) redirect('/onboarding/vendors?error=empty');

  const entitlement = await certlyEntitlement(db, orgId);
  // A10 / §9: import UP TO the limit and report the remainder. A 200-row import
  // that fails at row 51 is a lost customer.
  const allowance = importAllowance(entitlement, parsed.vendors.length);

  let created = 0;
  for (const vendor of parsed.vendors.slice(0, allowance.accepted)) {
    await createVendor(db, {
      orgId,
      actor,
      vendor: { name: vendor.name, contactEmail: vendor.email },
    });
    created += 1;
  }

  await trackEvent(db, {
    name: 'vendors_pasted',
    orgId,
    props: {
      lines: parsed.vendors.length + parsed.blank + parsed.duplicates,
      created,
      duplicates: parsed.duplicates,
      over_limit: allowance.overLimit,
    },
  });
  if (created > 0) await completeStep(db, { orgId, step: 'vendors' });

  const query = new URLSearchParams({
    created: String(created),
    duplicates: String(parsed.duplicates),
    blank: String(parsed.blank),
    over: String(allowance.overLimit + parsed.overflow),
  });
  redirect(`/onboarding/vendors?${query.toString()}`);
}

export async function uploadFirstCertificateAction(formData: FormData): Promise<void> {
  const { db, orgId, actor, userId } = await context();
  const env = getEnv();
  const vendorId = String(formData.get('vendorId') ?? '');
  const file = formData.get('file');

  if (!vendorId) redirect('/onboarding/certificate?error=vendor');
  if (!(file instanceof File) || file.size === 0) redirect('/onboarding/certificate?error=file');

  const entitlement = await certlyEntitlement(db, orgId, {
    env: env as unknown as Record<string, unknown>,
  });
  const verdict = canAddDocument(entitlement);
  if (!verdict.allowed) redirect(`/onboarding/certificate?error=${verdict.reason}`);

  // THE READER IS THE SEAM. Outside mock mode there is no stub: M4's extractor
  // is the only reader, and until it lands the step says so rather than
  // inventing a reading of a real customer's document.
  if (env.ADAPTER_MODE !== 'mock') redirect('/onboarding/certificate?error=reader_unavailable');

  const settings = await ensureOrgSettings(db, orgId);
  const today = orgToday(settings.timezone, new Date());
  const bytes = new Uint8Array(await file.arrayBuffer());

  await trackEvent(db, { name: 'coi_uploaded', orgId, props: { mime: file.type, bytes: file.size, source: 'app' } });

  const result = await ingestFirstCertificate({
    db,
    orgId,
    vendorId,
    actor,
    uploadedBy: userId,
    today,
    file: { bytes, mime: file.type || 'application/pdf', name: file.name },
    reader: stubReader(),
  });

  if (result.status === 'rejected') {
    redirect(`/onboarding/certificate?error=rejected&reason=${encodeURIComponent(result.reason)}`);
  }

  await completeStep(db, { orgId, step: 'certificate' });
  redirect('/onboarding/finding');
}

export async function addOneVendorAction(formData: FormData): Promise<void> {
  const { db, orgId, actor } = await context();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/onboarding/vendors?error=empty');

  const entitlement = await certlyEntitlement(db, orgId);
  const verdict = canAddVendors(entitlement, 1);
  if (!verdict.allowed) redirect(`/onboarding/vendors?error=${verdict.reason}`);

  await createVendor(db, {
    orgId,
    actor,
    vendor: { name, contactEmail: String(formData.get('email') ?? '').trim() || null },
  });
  await completeStep(db, { orgId, step: 'vendors' });
  redirect('/onboarding/vendors?created=1');
}

export async function completeStepAction(formData: FormData): Promise<void> {
  const { db, orgId } = await context();
  const step = String(formData.get('step') ?? '');
  if (!isOnboardingStep(step)) redirect('/onboarding');
  await completeStep(db, { orgId, step });
  redirect('/onboarding');
}

export async function skipOnboardingAction(): Promise<void> {
  const { db, orgId } = await context();
  await skipOnboarding(db, orgId);
  redirect('/dashboard?onboarding=skipped');
}

export async function resumeOnboardingAction(): Promise<void> {
  const { db, orgId } = await context();
  const view = await ensureOnboarding(db, orgId);
  const hours = Math.round((Date.now() - view.startedAt.getTime()) / 3_600_000);
  await trackEvent(db, {
    name: 'onboarding_resumed',
    orgId,
    props: { step: view.resume, hours_since: hours },
  });
  redirect(`/onboarding/${view.resume}`);
}
