'use server';

/**
 * The conformance path's writes.
 *
 * **This product never proposes a classification and never proposes a rate.**
 * 29 CFR 5.5(a)(1)(iii)(B): *"The conformance process may not be used to split,
 * subdivide, or otherwise avoid application of classifications listed in the
 * wage determination."* Every field below is the customer's, the comparison set
 * is the customer's, and what comes out is a worksheet for their contracting
 * agency — which is the party that submits to DBAConformance@dol.gov. Not us,
 * and not any vendor.
 */

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { requireOrg } from '@octopus/platform/next';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { searchClassifications } from '@/lib/kb';
import {
  ConformanceValidationError,
  completeConformance,
  recordConformanceOutcome,
  saveConformance,
  startConformance,
} from '@/lib/repositories/workers';
import { projects, type ComparedClassification } from '@/lib/schema';

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

/** Screen 2's button, and the ONLY way a worksheet comes into existence: the
 *  guide's look-again screen and its what-a-conformance-is screen both come
 *  first, by construction rather than by convention. */
export async function startConformanceAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  const workerId = String(formData.get('workerId') ?? '');
  const searchesBefore = Number(formData.get('searchesBefore') ?? '0') || 0;

  const worksheet = await startConformance(db, {
    projectId: project.id,
    ...(workerId ? { workerId } : {}),
    wdNumber: project.wdNumber,
    wdModificationNumber: project.wdModificationNumber,
    searchesBefore,
    createdByUserId: user.id,
  });
  await emitEvent(db, 'conformance_worksheet_started', { orgId: org.id, userId: user.id });
  redirect(`/projects/${project.id}/conformance/${worksheet.id}`);
}

function comparedFrom(
  formData: FormData,
  catalogue: Array<{ id: string; classificationLabel: string; baseRate: string; fringeRate: string }>,
): ComparedClassification[] {
  const ids = formData.getAll('compared').map(String).filter(Boolean);
  const compared: ComparedClassification[] = [];
  for (const id of ids) {
    const row = catalogue.find((entry) => entry.id === id);
    if (!row) continue;
    compared.push({
      kbClassificationId: row.id,
      label: row.classificationLabel,
      baseRate: row.baseRate,
      fringeRate: row.fringeRate,
    });
  }
  return compared;
}

export async function saveConformanceAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, project } = await projectFor(projectId);
  const id = String(formData.get('worksheetId') ?? '');
  const catalogue = await searchClassifications(db, project.wdId, { limit: 1000 });

  await saveConformance(db, {
    id,
    projectId: project.id,
    dutiesDescription: String(formData.get('dutiesDescription') ?? ''),
    proposedClassification: String(formData.get('proposedClassification') ?? ''),
    proposedBaseRate: String(formData.get('proposedBaseRate') ?? '0'),
    proposedFringeRate: String(formData.get('proposedFringeRate') ?? '0'),
    comparedClassifications: comparedFrom(formData, catalogue.rows),
  });
  redirect(`/projects/${project.id}/conformance/${id}?saved=1`);
}

export async function completeConformanceAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  const id = String(formData.get('worksheetId') ?? '');
  const catalogue = await searchClassifications(db, project.wdId, { limit: 1000 });
  const compared = comparedFrom(formData, catalogue.rows);

  try {
    await completeConformance(db, {
      id,
      projectId: project.id,
      dutiesDescription: String(formData.get('dutiesDescription') ?? ''),
      proposedClassification: String(formData.get('proposedClassification') ?? ''),
      proposedBaseRate: String(formData.get('proposedBaseRate') ?? '0'),
      proposedFringeRate: String(formData.get('proposedFringeRate') ?? '0'),
      comparedClassifications: compared,
    });
  } catch (error) {
    if (error instanceof ConformanceValidationError) {
      // The draft is saved first, so a validation failure never costs the user
      // the paragraph they wrote.
      await saveConformance(db, {
        id,
        projectId: project.id,
        dutiesDescription: String(formData.get('dutiesDescription') ?? ''),
        proposedClassification: String(formData.get('proposedClassification') ?? ''),
        proposedBaseRate: String(formData.get('proposedBaseRate') ?? '0'),
        proposedFringeRate: String(formData.get('proposedFringeRate') ?? '0'),
        comparedClassifications: compared,
      });
      redirect(
        `/projects/${project.id}/conformance/${id}?problems=${encodeURIComponent(error.problems.join('|'))}`,
      );
    }
    throw error;
  }

  await emitEvent(db, 'conformance_worksheet_completed', {
    orgId: org.id,
    userId: user.id,
    props: { compared_count: compared.length },
  });
  redirect(`/projects/${project.id}/conformance/${id}?completed=1`);
}

export async function recordOutcomeAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get('projectId') ?? '');
  const { db, org, user, project } = await projectFor(projectId);
  const id = String(formData.get('worksheetId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (status !== 'approved' && status !== 'denied' && status !== 'withdrawn') {
    redirect(`/projects/${project.id}/conformance/${id}`);
  }

  const { daysElapsed } = await recordConformanceOutcome(db, {
    id,
    projectId: project.id,
    status,
    note: String(formData.get('note') ?? ''),
  });
  await emitEvent(db, 'conformance_outcome_recorded', {
    orgId: org.id,
    userId: user.id,
    props: { status, days_elapsed: daysElapsed },
  });
  redirect(`/projects/${project.id}/conformance/${id}?outcome=${status}`);
}
