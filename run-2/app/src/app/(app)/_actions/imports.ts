'use server';

/**
 * Import and resolution mutations — J5 and J6.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.3 (the flow, including the duplicate branch),
 * §5.4 (unmapped deductions block), §6.2 (the click writes the crosswalk and the
 * question never returns), §6.3.1 (only her own confirmed answers auto-apply).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import type { DeductionCategory } from '@/lib/types';

import { requireSession, writeAs } from '../_lib/auth';
import { appClock } from '../_lib/deps';
import { categoriseDeduction, ingestPayroll, type PostedWorker, type StoredColumnMap } from '../_lib/imports';
import { currentPin, readProject } from '../_lib/projects';
import { confirmClassification } from '../_lib/resolve';
import { readWeek } from '../_lib/filings';

export async function ingestPayrollAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const session = await requireSession(`/app/projects/${projectId}/imports/new`);
  const now = appClock().now();

  const map = JSON.parse(String(formData.get('map') ?? '{}')) as StoredColumnMap;
  const workers = JSON.parse(String(formData.get('workers') ?? '[]')) as PostedWorker[];
  const weekEnding = String(formData.get('weekEnding') ?? '');

  const outcome = await writeAs(session, async (tx) => {
    const project = await readProject(tx, projectId);
    if (!project) return null;
    return ingestPayroll(tx, {
      accountId: session.accountId,
      userId: session.userId,
      now,
      projectId,
      weekEnding,
      workweekStartDay: project.workweekStartDay,
      contractValueBand: project.contractValueBand,
      map,
      sourceSha256: String(formData.get('sourceSha256') ?? ''),
      byteSize: Number(formData.get('byteSize') ?? 0),
      workers,
    });
  });

  if (outcome === null) redirect('/app');

  if (outcome.duplicate) {
    // §5.4 — idempotent on the file's digest. Not an error, and not silently
    // ignored: the two real choices are offered on the import screen.
    redirect(`/app/imports/${outcome.importId}/map?duplicate=1`);
  }

  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/imports/${outcome.importId}/resolve`);
}

export async function confirmClassificationAction(formData: FormData): Promise<void> {
  const importId = String(formData.get('importId') ?? '');
  const session = await requireSession(`/app/imports/${importId}/resolve`);
  const db = await getDb();
  const weekId = String(formData.get('weekId') ?? '');
  const rawTitle = String(formData.get('rawTitle') ?? '');
  const chosenOrdinal = Number(formData.get('chosenOrdinal') ?? -1);

  if (Number.isNaN(chosenOrdinal) || chosenOrdinal < 0) {
    redirect(`/app/imports/${importId}/resolve`);
  }

  await writeAs(session, async (tx) => {
    const week = await readWeek(tx, weekId);
    if (!week) return;
    const project = await readProject(tx, week.projectId);
    const pin = await currentPin(tx, week.projectId);
    if (!project || !pin) return;
    await confirmClassification(db, tx, {
      accountId: session.accountId,
      userId: session.userId,
      project,
      pin,
      weekId,
      rawTitle,
      chosenOrdinal,
    });
  });

  revalidatePath(`/app/imports/${importId}/resolve`);
  redirect(`/app/imports/${importId}/resolve`);
}

export async function categoriseDeductionAction(formData: FormData): Promise<void> {
  const importId = String(formData.get('importId') ?? '');
  const session = await requireSession(`/app/imports/${importId}/resolve`);
  const weekId = String(formData.get('weekId') ?? '');
  const rawLabel = String(formData.get('rawLabel') ?? '');
  const category = String(formData.get('category') ?? '') as DeductionCategory;

  if (category === 'UNMAPPED' || category === ('' as DeductionCategory)) {
    // Leaving it unmapped is a real choice and it leaves the rows blocked. There is
    // no "Other": 'Other' on a signed form asserts that the deduction is
    // permissible, which is a legal question about her specific deduction.
    redirect(`/app/imports/${importId}/resolve`);
  }

  await writeAs(session, async (tx) =>
    categoriseDeduction(tx, {
      weekId,
      importId,
      rawLabel,
      category: category as Exclude<DeductionCategory, 'UNMAPPED'>,
    }),
  );

  revalidatePath(`/app/imports/${importId}/resolve`);
  redirect(`/app/imports/${importId}/resolve`);
}
