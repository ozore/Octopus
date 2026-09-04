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

import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import { getDetermination, type DeterminationCandidate } from '../kb';
import { payrolls, projectWdPinHistory, projects, type Project } from '../schema';

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

// ---------------------------------------------------------------------------
// WL-02 V7 — re-pinning after a certified payroll
// ---------------------------------------------------------------------------

/**
 * A certified payroll is a signed federal statement. Moving the project's pin
 * after one exists makes the signed document inconsistent with the project it
 * belongs to, so the move is refused unless the user has explicitly called it a
 * CORRECTION — which is then recorded as such in `project_wd_pin_history`
 * (V7). The guard lives here and not only in the screen: an action, a job and a
 * future API all come through this function.
 */
export class RepinNeedsConfirmationError extends Error {
  constructor(readonly certifiedPayrolls: number) {
    super(
      `This project has ${certifiedPayrolls} certified payroll${certifiedPayrolls === 1 ? '' : 's'} at its current modification. Re-pinning is a correction and must be confirmed.`,
    );
    this.name = 'RepinNeedsConfirmationError';
  }
}

/** How many payrolls on the project are certified. WL-05 owns the table; this
 *  reads it, because V7 is a rule about the PIN. */
export async function certifiedPayrollCount(db: Db, projectId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(payrolls)
    .where(and(eq(payrolls.projectId, projectId), eq(payrolls.status, 'certified')));
  return Number(row?.value ?? 0);
}

/**
 * `repinDetermination` with WL-02 V7's guard in front of it. `confirmed` is the
 * user's answer to the confirmation dialog, and it is the ONLY thing that turns
 * a refusal into a `reason = 'corrected'` history row.
 */
export async function repinDeterminationChecked(
  db: Db,
  input: {
    projectId: string;
    wdId: string;
    wdNumber: string;
    wdModificationNumber: number;
    wdPinnedSuperseded?: boolean;
    changedByUserId?: string;
    confirmed?: boolean;
  },
): Promise<{ reason: 'accepted_modification' | 'corrected'; certifiedPayrolls: number }> {
  const certified = await certifiedPayrollCount(db, input.projectId);
  if (certified > 0 && !input.confirmed) throw new RepinNeedsConfirmationError(certified);
  const reason = certified > 0 ? 'corrected' : 'accepted_modification';
  await repinDetermination(db, {
    projectId: input.projectId,
    wdId: input.wdId,
    wdNumber: input.wdNumber,
    wdModificationNumber: input.wdModificationNumber,
    ...(input.wdPinnedSuperseded !== undefined
      ? { wdPinnedSuperseded: input.wdPinnedSuperseded }
      : {}),
    reason,
    ...(input.changedByUserId ? { changedByUserId: input.changedByUserId } : {}),
  });
  return { reason, certifiedPayrolls: certified };
}

/** The open pin-history row: the one that says "why is the rate what it is",
 *  today. There is exactly one, or the pin was written without its history. */
export async function openPinHistory(db: Db, projectId: string) {
  const [row] = await db
    .select()
    .from(projectWdPinHistory)
    .where(
      and(eq(projectWdPinHistory.projectId, projectId), isNull(projectWdPinHistory.unpinnedAt)),
    )
    .limit(1);
  return row;
}

// ---------------------------------------------------------------------------
// WL-02 · the pin decision, in one testable place
// ---------------------------------------------------------------------------

export type PinDecision =
  | {
      status: 'ok';
      determination: DeterminationCandidate;
      /** entered_number | entered_number_and_modification | selected_from_1
       *  | selected_from_n */
      pinMethod: string;
      superseded: boolean;
      activeModification: number | null;
      activePublicationDate: string | null;
    }
  | { status: 'refused'; reason: 'not_found' | 'fetching' | 'superseded_not_named'; wdNumber: string; knownModifications: number[] };

/**
 * The three pin cases, and only three (WL-02, "Modification pinning, end to
 * end"). It is a function rather than a branch inside a server action because
 * it is the single most important decision in the product and it has to be
 * testable without a request:
 *
 *   no modification given          → the ACTIVE modification, `entered_number`
 *   modification given, active     → that one
 *   modification given, superseded → THAT ONE, `wdPinnedSuperseded`, never
 *                                    blocked (29 CFR 1.6 — the determination a
 *                                    contract incorporated governs the job)
 *   pair absent from the corpus    → refused. A typo, not a contract.
 *
 * **V3a lives here too:** a superseded modification is only pinnable when the
 * user NAMED it. A bare number that happens to resolve to a superseded row is
 * refused rather than silently pinned, because "never the default, never
 * inferred" has to be a property of the code and not of the screen.
 */
export async function resolvePin(
  db: Db,
  input: { wdNumber: string; modificationNumber?: number; chosenFromN?: number },
): Promise<PinDecision> {
  const resolved = await getDetermination(db, input.wdNumber, input.modificationNumber, {
    enqueueMissing: true,
  });

  if (resolved.resolution === 'not_found') {
    return {
      status: 'refused',
      reason: 'not_found',
      wdNumber: resolved.wdNumber,
      knownModifications: resolved.knownModifications,
    };
  }
  if (resolved.resolution === 'fetching') {
    return {
      status: 'refused',
      reason: 'fetching',
      wdNumber: resolved.wdNumber,
      knownModifications: [],
    };
  }

  const superseded = resolved.resolution === 'superseded';
  if (superseded && input.modificationNumber === undefined) {
    return {
      status: 'refused',
      reason: 'superseded_not_named',
      wdNumber: resolved.determination.wdNumber,
      knownModifications: [],
    };
  }

  const chosenFromN = input.chosenFromN ?? 0;
  const pinMethod =
    chosenFromN > 1
      ? 'selected_from_n'
      : chosenFromN === 1
        ? 'selected_from_1'
        : input.modificationNumber === undefined
          ? 'entered_number'
          : 'entered_number_and_modification';

  return {
    status: 'ok',
    determination: resolved.determination,
    pinMethod,
    superseded,
    activeModification: superseded ? resolved.activeModification : null,
    activePublicationDate: superseded ? resolved.activePublicationDate : null,
  };
}
