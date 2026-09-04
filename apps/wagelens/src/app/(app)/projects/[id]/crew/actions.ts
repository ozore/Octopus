'use server';

/**
 * WL-04's writes: the roster, the paste, and the mapping.
 *
 * **TWO RULES HERE ARE LAW, NOT PREFERENCE.**
 *
 * 1. *The last four digits, and nothing more.* 29 CFR 5.5(a)(3)(ii)(B): the
 *    weekly transmittal carries the last four digits of the identifying number,
 *    and full numbers must not appear. Anything matching a full number is
 *    REFUSED with the explanation and **never truncated to its last four** —
 *    truncating would silently accept data we are forbidden to hold. The
 *    refusal runs in the drawer, per pasted row, and again in the repository,
 *    because a paste does not go through the form.
 * 2. *Nothing is auto-classified, ever.* Classification is the customer's legal
 *    judgement (29 CFR 5.5(a)(1)(iii)(B) and OFFER §5.2 G4). There is no code
 *    path in this file that picks a classification for anyone; a row committed
 *    without one lands on the unmapped banner and blocks certification until a
 *    human maps it.
 */

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { requireOrg } from '@octopus/platform/next';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { searchClassifications } from '@/lib/kb';
import {
  IdentifyingNumberTooLongError,
  addWorker,
  archiveWorker,
  commitWorkerPaste,
  createApprenticeshipProgram,
  looksLikeFullIdentifyingNumber,
  mapClassification,
  nearDuplicateWorkers,
  parseWorkerPaste,
  unmapClassification,
  type PasteCommitRow,
  type WorkerPasteResult,
} from '@/lib/repositories/workers';
import { projects } from '@/lib/schema';

async function projectFor(projectId: string) {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, org.id)))
    .limit(1);
  if (!project) redirect('/projects');
  return { db, org, user, project };
}

export async function addWorkerAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);

  const text = (key: string) => String(formData.get(key) ?? '').trim();
  const firstName = text('firstName');
  const lastName = text('lastName');
  const middleInitial = text('middleInitial');
  const last4Raw = text('identifyingNoLast4');
  const status = text('defaultStatus') === 'RA' ? 'RA' : 'J';

  // V2 — the blocking error, with the reason, and nothing stored.
  if (looksLikeFullIdentifyingNumber(last4Raw)) {
    await emitEvent(db, 'ssn_full_entry_blocked', { orgId: org.id, userId: user.id });
    redirect(`/projects/${project.id}/crew?error=full_number`);
  }
  const last4 = last4Raw.replace(/\D/g, '');
  if (!firstName || !lastName || last4.length !== 4) {
    redirect(`/projects/${project.id}/crew?error=worker_fields`);
  }

  let apprenticeshipProgramId = text('apprenticeshipProgramId');
  const newProgram = text('newApprenticeshipProgram');
  if (status === 'RA' && !apprenticeshipProgramId && newProgram) {
    const created = await createApprenticeshipProgram(db, {
      orgId: org.id,
      programName: newProgram,
      registrar: text('registrar') === 'SAA' ? 'SAA' : 'OA',
    });
    apprenticeshipProgramId = created.id;
    await emitEvent(db, 'apprenticeship_program_created', {
      orgId: org.id,
      userId: user.id,
      props: { registrar: created.registrar },
    });
  }
  const registeredClassification = text('registeredClassification');
  // V4 — page 2 of the WH-347 needs both, so the save is refused without them.
  if (status === 'RA' && (!apprenticeshipProgramId || !registeredClassification)) {
    redirect(`/projects/${project.id}/crew?error=apprenticeship`);
  }

  const duplicates = await nearDuplicateWorkers(db, { orgId: org.id, lastName, last4 });
  if (duplicates.length > 0) {
    await emitEvent(db, 'worker_duplicate_warned', { orgId: org.id, userId: user.id });
  }

  try {
    await addWorker(db, {
      orgId: org.id,
      firstName,
      lastName,
      ...(middleInitial ? { middleInitial } : {}),
      identifyingNoLast4: last4,
      defaultStatus: status,
      ...(apprenticeshipProgramId ? { apprenticeshipProgramId } : {}),
      ...(registeredClassification ? { registeredClassification } : {}),
    });
  } catch (error) {
    if (error instanceof IdentifyingNumberTooLongError) {
      await emitEvent(db, 'ssn_full_entry_blocked', { orgId: org.id, userId: user.id });
      redirect(`/projects/${project.id}/crew?error=full_number`);
    }
    throw error;
  }

  await emitEvent(db, 'worker_added', {
    orgId: org.id,
    userId: user.id,
    props: { status },
  });
  redirect(
    `/projects/${project.id}/crew?added=1${duplicates.length > 0 ? '&duplicate=1' : ''}`,
  );
}

/**
 * **Pure, and it writes nothing** (V10). The preview is the whole point: every
 * parsed row is shown and editable, every skipped row is listed with its
 * reason, and the button is what writes.
 */
export async function previewPasteAction(
  _previous: WorkerPasteResult,
  formData: FormData,
): Promise<WorkerPasteResult> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const result = parseWorkerPaste({ text: String(formData.get('text') ?? '') });
  if (result.skipped.some((row) => row.reason.includes('full identifying number'))) {
    // Somebody tried. THRESHOLDS P5 counts this, and a rising count means the
    // help copy needs work rather than that the guard needs loosening.
    await emitEvent(db, 'ssn_full_entry_blocked', { orgId: org.id, userId: user.id });
  }
  return result;
}

export async function commitPasteAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);

  const lastNames = formData.getAll('lastName').map(String);
  const firstNames = formData.getAll('firstName').map(String);
  const middleInitials = formData.getAll('middleInitial').map(String);
  const last4s = formData.getAll('last4').map(String);
  const classifications = formData.getAll('classification').map(String);
  const skippedCount = Number(formData.get('skippedCount') ?? '0');

  const catalogue = await searchClassifications(db, project.wdId, { limit: 1000 });
  const rows: PasteCommitRow[] = [];
  for (let index = 0; index < lastNames.length; index += 1) {
    const last4 = (last4s[index] ?? '').replace(/\D/g, '');
    // The refusal runs again here: a preview can be edited before it is sent.
    if (looksLikeFullIdentifyingNumber(last4s[index] ?? '') || last4.length !== 4) {
      await emitEvent(db, 'ssn_full_entry_blocked', { orgId: org.id, userId: user.id });
      redirect(`/projects/${project.id}/crew/paste?error=full_number`);
    }
    const chosen = catalogue.rows.find((row) => row.id === classifications[index]);
    rows.push({
      lastName: lastNames[index] ?? '',
      firstName: firstNames[index] ?? '',
      middleInitial: middleInitials[index] ?? null,
      last4,
      ...(chosen
        ? {
            mapping: {
              kbClassificationId: chosen.id,
              classificationLabel: chosen.classificationLabel,
              baseRate: chosen.baseRate,
              fringeRate: chosen.fringeRate,
            },
          }
        : {}),
    });
  }

  if (rows.length === 0) redirect(`/projects/${project.id}/crew/paste?error=nothing_to_add`);

  const committed = await commitWorkerPaste(db, {
    orgId: org.id,
    projectId: project.id,
    wdNumber: project.wdNumber,
    wdModificationNumber: project.wdModificationNumber,
    mappedByUserId: user.id,
    rows,
  });

  await emitEvent(db, 'workers_pasted', {
    orgId: org.id,
    userId: user.id,
    props: { rows_parsed: committed.workers.length, rows_skipped: skippedCount },
  });
  redirect(`/projects/${project.id}/crew?pasted=${committed.workers.length}`);
}

/**
 * Map a worker to a classification. The label and BOTH rates are COPIED onto
 * the row: the payroll certified in March must print the same string and the
 * same numbers in December, even after the project moves to a new
 * modification.
 *
 * The classification is looked up **within the project's pinned determination**
 * (gate G9), so a classification that is not on it cannot be mapped at all.
 */
export async function mapClassificationAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  const workerId = String(formData.get('workerId') ?? '');
  const kbClassificationId = String(formData.get('kbClassificationId') ?? '');

  const catalogue = await searchClassifications(db, project.wdId, { limit: 1000 });
  const chosen = catalogue.rows.find((row) => row.id === kbClassificationId);
  if (!chosen) {
    redirect(`/projects/${project.id}/crew/${workerId}/map?error=not_on_determination`);
  }

  await mapClassification(db, {
    projectId: project.id,
    workerId,
    kbClassificationId: chosen.id,
    classificationLabel: chosen.classificationLabel,
    baseRate: chosen.baseRate,
    fringeRate: chosen.fringeRate,
    wdNumber: project.wdNumber,
    wdModificationNumber: project.wdModificationNumber,
    mappedByUserId: user.id,
  });

  await emitEvent(db, 'classification_mapped', {
    orgId: org.id,
    userId: user.id,
    props: {
      kb_classification_id: chosen.id,
      base_rate: chosen.baseRate,
      fringe_rate: chosen.fringeRate,
    },
  });
  redirect(`/projects/${project.id}/crew?mapped=1`);
}

export async function unmapClassificationAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  const workerId = String(formData.get('workerId') ?? '');
  await unmapClassification(db, { projectId: project.id, workerId });
  await emitEvent(db, 'classification_unmapped', { orgId: org.id, userId: user.id });
  redirect(`/projects/${project.id}/crew?unmapped=1`);
}

export async function archiveWorkerAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  await archiveWorker(db, org.id, String(formData.get('workerId') ?? ''));
  await emitEvent(db, 'worker_archived', { orgId: org.id, userId: user.id });
  redirect(`/projects/${project.id}/crew?archived=1`);
}

/** `classification_none_match_clicked {searches_before}` — the number that
 *  tells us whether people give up after one search (a picker problem) or
 *  after eight (a genuine conformance). */
export async function logNoneMatchAction(searchesBefore: number): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  await emitEvent(db, 'classification_none_match_clicked', {
    orgId: org.id,
    userId: user.id,
    props: { searches_before: searchesBefore },
  });
}
