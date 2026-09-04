'use server';

/**
 * WL-02's writes: create a project with its pin, and move a pin.
 *
 * **Three pin cases, and only three** (WL-02, "Modification pinning, end to
 * end"):
 *
 *   a number with no modification          → the ACTIVE modification
 *   a number and the active modification   → that one
 *   a number and a SUPERSEDED modification → THAT ONE, `wdPinnedSuperseded`,
 *                                            never blocked, permanently
 *                                            annotated (29 CFR 1.6 — the
 *                                            determination a contract
 *                                            incorporated governs the job)
 *   a pair the corpus has never held       → refused. A typo, not a contract.
 *
 * `not_found` and `superseded` are different answers and this file keeps them
 * different. Collapsing them would force a contractor to file at a rate their
 * contract does not carry, which is the exact harm the product is sold against.
 */

import { count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { newId } from '@octopus/platform';
import { withinLimit } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { listCounties } from '@/lib/kb';
import {
  RepinNeedsConfirmationError,
  createProject,
  getProject,
  repinDeterminationChecked,
  resolvePin,
} from '@/lib/repositories/projects';
import { projects } from '@/lib/schema';

/** The step-1 answers, carried back into the URL so a validation failure never
 *  costs the user what they already typed. */
function draftQuery(form: FormData): string {
  const params = new URLSearchParams();
  for (const field of [
    'name',
    'projectOrContractNo',
    'locationDescription',
    'ourRole',
    'primeContractorName',
    'awardingAgency',
    'stateCode',
    'samCountyCode',
    'constructionType',
  ]) {
    const value = form.get(field);
    if (typeof value === 'string' && value.length > 0) params.set(field, value);
  }
  const wd = form.get('wdNumber');
  if (typeof wd === 'string' && wd.length > 0) params.set('wd', wd);
  const mod = form.get('wdModificationNumber');
  if (typeof mod === 'string' && mod.length > 0) params.set('mod', mod);
  return params.toString();
}

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

  const text = (key: string) => String(formData.get(key) ?? '').trim();
  const draft = draftQuery(formData);

  // --- V1 and V2: the fields the WH-347's own header cannot be printed without
  const name = text('name');
  const projectOrContractNo = text('projectOrContractNo');
  const locationDescription = text('locationDescription');
  const ourRole = text('ourRole') === 'prime' ? 'prime' : text('ourRole') === 'sub' ? 'sub' : '';
  const primeContractorName = text('primeContractorName');
  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!projectOrContractNo) missing.push('projectOrContractNo');
  if (!locationDescription) missing.push('locationDescription');
  if (!ourRole) missing.push('ourRole');
  if (ourRole === 'sub' && !primeContractorName) missing.push('primeContractorName');
  if (missing.length > 0) {
    redirect(`/projects/new?error=fields&missing=${missing.join(',')}&${draft}`);
  }

  // --- the pin ------------------------------------------------------------
  // A chosen candidate wins over a typed number: it is the more recent, more
  // deliberate answer, and its `chosen_from_n` is what makes F3 measurable.
  const candidate = text('candidate');
  let wdInput = text('wdNumber');
  let modification: number | undefined =
    text('wdModificationNumber') === '' ? undefined : Number(text('wdModificationNumber'));
  let chosenFromN = 0;

  if (candidate) {
    const [candidateWd, candidateMod, candidateCount] = candidate.split('|');
    wdInput = candidateWd ?? '';
    modification = candidateMod === undefined ? undefined : Number(candidateMod);
    chosenFromN = Math.max(1, Number(candidateCount ?? '1'));
  } else if (wdInput) {
    await emitEvent(db, 'wd_entered_by_number', {
      orgId: org.id,
      userId: user.id,
      props: { matched_alias: wdInput.toUpperCase().replace(/\s+/g, '') },
    });
  }

  if (!wdInput) {
    redirect(`/projects/new?error=wd_missing&${draft}`);
  }

  // The decision table lives in the repository, in one testable place.
  const decision = await resolvePin(db, {
    wdNumber: wdInput,
    ...(modification === undefined ? {} : { modificationNumber: modification }),
    chosenFromN,
  });
  if (decision.status === 'refused') {
    await emitEvent(db, 'wd_resolve_failed', {
      orgId: org.id,
      userId: user.id,
      props: { reason: decision.reason },
    });
    redirect(
      `/projects/new?error=${decision.reason === 'fetching' ? 'wd_fetching' : 'wd_not_found'}&${draft}`,
    );
  }

  const determination = decision.determination;
  const superseded = decision.superseded;
  const pinMethod = decision.pinMethod;

  const constructionType = text('constructionType');
  const samCountyCode = text('samCountyCode');
  const stateCode = text('stateCode') || determination.wdNumber.slice(0, 2);
  // The county NAME is resolved from the code, never typed: SAM matches on the
  // numeric code and a name string returns nothing at all (KNOWLEDGE_BASE KB-1).
  const countyName = samCountyCode
    ? ((await listCounties(db, stateCode)).find((c) => c.samCountyCode === Number(samCountyCode))
        ?.countyName ?? '')
    : '';

  const project = await createProject(db, {
    id: newId('prj'),
    orgId: org.id,
    name,
    projectOrContractNo,
    locationDescription,
    ourRole: ourRole as 'prime' | 'sub',
    ...(primeContractorName ? { primeContractorName } : {}),
    ...(text('awardingAgency') ? { awardingAgency: text('awardingAgency') } : {}),
    wdId: determination.wdId,
    wdNumber: determination.wdNumber,
    wdModificationNumber: determination.modificationNumber,
    wdPinnedSuperseded: superseded,
    wdPinMethod: pinMethod,
    wdPinnedByUserId: user.id,
    stateCode,
    ...(samCountyCode ? { samCountyCode: Number(samCountyCode) } : {}),
    ...(countyName
      ? { countyName }
      : determination.countyCount === 1 && determination.countyNames[0]
        ? { countyName: determination.countyNames[0] }
        : {}),
    ...(constructionType
      ? { constructionType }
      : determination.constructionTypes.length === 1 && determination.constructionTypes[0]
        ? { constructionType: determination.constructionTypes[0] }
        : {}),
  });

  await emitEvent(db, 'wd_pinned', {
    orgId: org.id,
    userId: user.id,
    props: {
      wd_number: determination.wdNumber,
      modification_number: determination.modificationNumber,
      pin_method: pinMethod,
      chosen_from_n: chosenFromN,
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

/**
 * Move a pin (V7). A project with a certified payroll needs an explicit
 * confirmation, because moving the pin makes an already-signed federal
 * statement inconsistent with the project it belongs to — so the move is
 * recorded as `reason = 'corrected'` rather than pretending to be routine.
 */
export async function repinProjectAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();

  const projectId = String(formData.get('projectId') ?? '');
  const project = await getProject(db, org.id, projectId);
  if (!project) redirect('/projects');

  const modification = Number(formData.get('modificationNumber') ?? '');
  const confirmed = String(formData.get('confirmed') ?? '') === '1';

  const resolved = await resolvePin(db, {
    wdNumber: project.wdNumber,
    modificationNumber: modification,
  });
  if (resolved.status === 'refused') {
    redirect(`/projects/${projectId}/determination?repin=${resolved.reason}`);
  }

  try {
    const { reason } = await repinDeterminationChecked(db, {
      projectId,
      wdId: resolved.determination.wdId,
      wdNumber: resolved.determination.wdNumber,
      wdModificationNumber: resolved.determination.modificationNumber,
      wdPinnedSuperseded: resolved.superseded,
      changedByUserId: user.id,
      confirmed,
    });
    await emitEvent(db, 'project_repinned', {
      orgId: org.id,
      userId: user.id,
      props: { reason },
    });
  } catch (error) {
    if (error instanceof RepinNeedsConfirmationError) {
      redirect(
        `/projects/${projectId}/determination?confirm_repin=${modification}&certified=${error.certifiedPayrolls}`,
      );
    }
    throw error;
  }

  redirect(`/projects/${projectId}/determination?repinned=1`);
}

/**
 * The trust event (WL-11 owns the name, this surface emits it with its own
 * `surface`). Someone left to check us against SAM.gov, and a high number is
 * good news rather than bad.
 */
export async function logOfficialLinkClick(wdNumber: string, surface: string): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await emitEvent(db, 'official_determination_link_clicked', {
    orgId: org.id,
    userId: user.id,
    props: { wd_number: wdNumber, surface },
  });
}
