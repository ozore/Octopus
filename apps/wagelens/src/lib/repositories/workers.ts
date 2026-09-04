/**
 * Workers and classification mappings (WL-04).
 *
 * **THE LAST FOUR DIGITS, AND NOTHING MORE.** 29 CFR 5.5(a)(3)(ii)(B) forbids
 * the full identifying number on a transmitted payroll, so the column is
 * `char(4)` and `addWorker` REJECTS anything longer before it reaches the
 * database. A schema that could hold a full number would be a schema that one
 * paste could fill.
 *
 * A mapping is never deleted, only `unmapped_at`-stamped: the payroll certified
 * in March must still print the classification and the rates it carried, so the
 * mapping's history is part of the record.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import {
  workerClassifications,
  workers,
  type Worker,
  type WorkerClassification,
} from '../schema';

export class IdentifyingNumberTooLongError extends Error {
  constructor() {
    super(
      'Only the LAST FOUR digits of a worker’s identifying number may be stored (29 CFR 5.5(a)(3)(ii)(B)).',
    );
    this.name = 'IdentifyingNumberTooLongError';
  }
}

export async function addWorker(
  db: Db,
  input: {
    id?: string;
    orgId: string;
    firstName: string;
    lastName: string;
    middleInitial?: string;
    identifyingNoLast4: string;
    defaultStatus?: 'J' | 'RA';
  },
): Promise<Worker> {
  const digits = input.identifyingNoLast4.replace(/\D/g, '');
  // The refusal is here and not only in the UI: a CSV paste, a job handler and
  // a future API all go through this function.
  if (digits.length > 4) throw new IdentifyingNumberTooLongError();
  const [row] = await db
    .insert(workers)
    .values({
      id: input.id ?? newId('wkr'),
      orgId: input.orgId,
      firstName: input.firstName,
      lastName: input.lastName,
      middleInitial: input.middleInitial ? input.middleInitial.slice(0, 1) : null,
      identifyingNoLast4: digits.padStart(4, '0'),
      defaultStatus: input.defaultStatus ?? 'J',
    })
    .returning();
  return row as Worker;
}

export async function listWorkers(db: Db, orgId: string): Promise<Worker[]> {
  return db
    .select()
    .from(workers)
    .where(and(eq(workers.orgId, orgId), isNull(workers.archivedAt)))
    .orderBy(asc(workers.lastName), asc(workers.firstName));
}

export async function archiveWorker(db: Db, orgId: string, workerId: string): Promise<void> {
  await db
    .update(workers)
    .set({ archivedAt: new Date() })
    .where(and(eq(workers.id, workerId), eq(workers.orgId, orgId)));
}

/**
 * Map a worker to a classification on a project. The label and BOTH rates are
 * copied onto the row, not joined: the payroll certified in March must print
 * the same string and the same numbers in December even if the project later
 * moves to a new modification.
 */
export async function mapClassification(
  db: Db,
  input: {
    projectId: string;
    workerId: string;
    kbClassificationId?: string;
    classificationLabel: string;
    baseRate: string;
    fringeRate: string;
    wdNumber: string;
    wdModificationNumber: number;
    source?: string;
    mappedByUserId?: string;
  },
): Promise<WorkerClassification> {
  // One live mapping per (project, worker): the previous one is closed, never
  // deleted.
  await db
    .update(workerClassifications)
    .set({ unmappedAt: new Date() })
    .where(
      and(
        eq(workerClassifications.projectId, input.projectId),
        eq(workerClassifications.workerId, input.workerId),
        isNull(workerClassifications.unmappedAt),
      ),
    );

  const [row] = await db
    .insert(workerClassifications)
    .values({
      id: newId('wcl'),
      projectId: input.projectId,
      workerId: input.workerId,
      kbClassificationId: input.kbClassificationId ?? null,
      classificationLabel: input.classificationLabel,
      baseRate: input.baseRate,
      fringeRate: input.fringeRate,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      source: input.source ?? 'wage_determination',
      mappedByUserId: input.mappedByUserId ?? null,
    })
    .returning();
  return row as WorkerClassification;
}

export async function liveMappings(db: Db, projectId: string): Promise<WorkerClassification[]> {
  return db
    .select()
    .from(workerClassifications)
    .where(
      and(
        eq(workerClassifications.projectId, projectId),
        isNull(workerClassifications.unmappedAt),
      ),
    );
}
