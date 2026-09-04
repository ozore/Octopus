/**
 * Projects and the pin (WL-02).
 *
 * The one rule this repository exists to enforce: **a pin is never written
 * without its history row.** `project_wd_pin_history` is why a payroll
 * certified in March under modification 1 stays explainable in December after
 * the project moved to modification 2 — the same reasoning that makes
 * `kb_wage_determinations` append-only. Two writes that must not come apart go
 * in one function, not in two call sites.
 */

import { and, desc, eq, isNull } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import { projectWdPinHistory, projects, type Project } from '../schema';

export type CreateProjectInput = {
  id?: string;
  orgId: string;
  name: string;
  projectOrContractNo?: string;
  locationDescription?: string;
  ourRole?: 'prime' | 'sub';
  primeContractorName?: string;
  awardingAgency?: string;
  filerOrganisationId?: string;
  wdId: string;
  wdNumber: string;
  wdModificationNumber: number;
  wdPinnedSuperseded?: boolean;
  wdPinMethod?: string;
  wdPinnedByUserId?: string;
  stateCode: string;
  samCountyCode?: number;
  countyName?: string;
  constructionType?: string;
};

export async function createProject(db: Db, input: CreateProjectInput): Promise<Project> {
  const id = input.id ?? newId('prj');
  return withTx(db, async (tx) => {
    const [row] = await tx
      .insert(projects)
      .values({
        id,
        orgId: input.orgId,
        name: input.name,
        projectOrContractNo: input.projectOrContractNo ?? '',
        locationDescription: input.locationDescription ?? '',
        ourRole: input.ourRole ?? 'sub',
        primeContractorName: input.primeContractorName ?? null,
        awardingAgency: input.awardingAgency ?? null,
        wdId: input.wdId,
        wdNumber: input.wdNumber,
        wdModificationNumber: input.wdModificationNumber,
        wdPinnedSuperseded: input.wdPinnedSuperseded ?? false,
        wdPinMethod: input.wdPinMethod ?? 'entered_number',
        wdPinnedByUserId: input.wdPinnedByUserId ?? null,
        stateCode: input.stateCode.toUpperCase(),
        samCountyCode: input.samCountyCode ?? null,
        countyName: input.countyName ?? null,
        constructionType: input.constructionType ?? null,
      })
      .returning();

    await tx.insert(projectWdPinHistory).values({
      id: newId('pin'),
      projectId: id,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      changedByUserId: input.wdPinnedByUserId ?? null,
      reason: 'initial',
    });

    return row as Project;
  });
}

export async function listProjects(db: Db, orgId: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.orgId, orgId), eq(projects.status, 'active')))
    .orderBy(desc(projects.createdAt));
}

export async function getProject(db: Db, orgId: string, id: string): Promise<Project | undefined> {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.orgId, orgId)))
    .limit(1);
  return row;
}

/** Every project pinned to a WD number, whatever modification. WL-08 reads this
 *  when a modification lands. */
export async function projectsPinnedTo(db: Db, wdNumber: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.wdNumber, wdNumber), eq(projects.status, 'active')));
}

/**
 * Move a pin. The open history row is CLOSED and a new one opened — nothing is
 * overwritten, because "why was the rate what it was" must stay answerable.
 * WL-02 V7 adds the certified-payroll guard on top of this.
 */
export async function repinDetermination(
  db: Db,
  input: {
    projectId: string;
    wdId: string;
    wdNumber: string;
    wdModificationNumber: number;
    wdPinnedSuperseded?: boolean;
    reason: 'accepted_modification' | 'corrected';
    changedByUserId?: string;
  },
): Promise<void> {
  await withTx(db, async (tx) => {
    await tx
      .update(projectWdPinHistory)
      .set({ unpinnedAt: new Date() })
      .where(
        and(eq(projectWdPinHistory.projectId, input.projectId), isNull(projectWdPinHistory.unpinnedAt)),
      );
    await tx.insert(projectWdPinHistory).values({
      id: newId('pin'),
      projectId: input.projectId,
      wdNumber: input.wdNumber,
      wdModificationNumber: input.wdModificationNumber,
      changedByUserId: input.changedByUserId ?? null,
      reason: input.reason,
    });
    await tx
      .update(projects)
      .set({
        wdId: input.wdId,
        wdNumber: input.wdNumber,
        wdModificationNumber: input.wdModificationNumber,
        wdPinnedSuperseded: input.wdPinnedSuperseded ?? false,
        wdPinMethod: 'selected_from_history',
        wdPinnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, input.projectId));
  });
}

export async function pinHistory(db: Db, projectId: string) {
  return db
    .select()
    .from(projectWdPinHistory)
    .where(eq(projectWdPinHistory.projectId, projectId))
    .orderBy(desc(projectWdPinHistory.pinnedAt));
}
