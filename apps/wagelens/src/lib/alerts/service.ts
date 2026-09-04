/**
 * WL-08 · Building an alert, and acting on one.
 *
 * THE INVARIANT THIS FILE EXISTS TO KEEP: **accepting a modification never
 * alters a certified payroll, a payroll line or a generated document.** Not one
 * byte. Silently re-rating a signed federal statement would be a false
 * certification under 18 U.S.C. § 1001 — so acceptance moves the pin, opens a
 * new `project_wd_pin_history` row and updates the OPEN worker mappings for
 * future payrolls, and touches nothing else. `tests/alerts.test.ts` hashes
 * every document and every payroll line before and after and asserts they are
 * identical; that test is what stands between us and a false certification.
 *
 * The second invariant is anti-spam, and it is a database constraint rather
 * than application logic: `unique (project_id, wd_number, to_modification)`
 * means a re-run of the ingest job cannot create a second alert, and the email
 * is enqueued only when the row was newly created.
 */

import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';

import type { Db } from '@octopus/platform/db';
import { withTx } from '@octopus/platform/db';

import {
  diffDetermination,
  type DiffClassification,
  type MappedWorker,
  type WdDiff,
} from '../domain/wd-diff';
import { repinDetermination } from '../repositories/projects';
import { recordAlert, type AlertDiff } from '../repositories/alerts';
import {
  kbClassifications,
  kbWageDeterminations,
  kbWdModifications,
  projects,
  wdChangeAlerts,
  workerClassifications,
  workers,
  type Project,
  type WdChangeAlert,
} from '../schema';

/**
 * What `wd_change_alerts.diff` holds. It is a superset of the repository's
 * `AlertDiff` — the two extra fields are the per-hour delta and the affected
 * workers' names, both of which the email needs and neither of which belongs in
 * an event. Declared standalone rather than as an intersection with `AlertDiff`
 * because an intersection of two array types indexes to the FIRST member's
 * element, which silently loses the extra fields.
 */
export type StoredDiff = {
  changed: Array<{
    label: string;
    oldRate: string;
    newRate: string;
    oldFringe: string;
    newFringe: string;
    delta?: string;
    workers?: string[];
  }>;
  removed: Array<{ label: string; workers?: string[] }>;
  added: Array<{ label: string; rate: string; fringe: string }>;
  mappedWorkerCount?: number;
  /** Set when the diff could not be computed: degraded, never silent. */
  degraded?: boolean;
};

async function determinationRows(
  db: Db,
  wdNumber: string,
  modificationNumber: number,
): Promise<{ wdId: string; rows: DiffClassification[] } | undefined> {
  const [determination] = await db
    .select({ id: kbWageDeterminations.id })
    .from(kbWageDeterminations)
    .where(
      and(
        eq(kbWageDeterminations.wdNumber, wdNumber),
        eq(kbWageDeterminations.modificationNumber, modificationNumber),
      ),
    )
    .limit(1);
  if (!determination) return undefined;

  const rows = await db
    .select({
      classificationLabel: kbClassifications.classificationLabel,
      searchLabel: kbClassifications.searchLabel,
      baseRate: kbClassifications.baseRate,
      fringeRate: kbClassifications.fringeRate,
    })
    .from(kbClassifications)
    .where(eq(kbClassifications.wdId, determination.id))
    .orderBy(asc(kbClassifications.lineNo));
  return { wdId: determination.id, rows };
}

/** The project's OPEN mappings, with the worker's name for the email. Names
 *  never reach an event — `emitEvent` drops person-shaped props — but the
 *  customer's own email about their own crew is exactly where a name belongs. */
export async function mappedCrew(db: Db, projectId: string): Promise<MappedWorker[]> {
  const rows = await db
    .select({
      workerId: workerClassifications.workerId,
      classificationLabel: workerClassifications.classificationLabel,
      baseRate: workerClassifications.baseRate,
      fringeRate: workerClassifications.fringeRate,
      firstName: workers.firstName,
      lastName: workers.lastName,
    })
    .from(workerClassifications)
    .innerJoin(workers, eq(workers.id, workerClassifications.workerId))
    .where(and(eq(workerClassifications.projectId, projectId), isNull(workerClassifications.unmappedAt)));

  return rows.map((row) => ({
    workerId: row.workerId,
    classificationLabel: row.classificationLabel,
    workerName: `${row.firstName} ${row.lastName}`.trim(),
  }));
}

/** The rates the mappings were made at — the honest `from` side when the old
 *  modification's text is no longer held. */
async function mappingRatesAsRows(db: Db, projectId: string): Promise<DiffClassification[]> {
  const rows = await db
    .select({
      classificationLabel: workerClassifications.classificationLabel,
      baseRate: workerClassifications.baseRate,
      fringeRate: workerClassifications.fringeRate,
    })
    .from(workerClassifications)
    .where(and(eq(workerClassifications.projectId, projectId), isNull(workerClassifications.unmappedAt)));
  return rows.map((row) => ({ ...row, searchLabel: null }));
}

export async function computeProjectDiff(
  db: Db,
  input: { projectId: string; wdNumber: string; fromModification: number; toModification: number },
): Promise<WdDiff> {
  const [from, to, mapped] = await Promise.all([
    determinationRows(db, input.wdNumber, input.fromModification),
    determinationRows(db, input.wdNumber, input.toModification),
    mappedCrew(db, input.projectId),
  ]);

  const fromRows = from?.rows ?? (await mappingRatesAsRows(db, input.projectId));
  return diffDetermination({ fromRows, toRows: to?.rows ?? [], mapped });
}

export type BuildAlertResult = {
  alert: WdChangeAlert;
  created: boolean;
  diff: WdDiff;
  supersededAlertIds: string[];
};

/**
 * V8 — when modification 3 lands while the alert for 2 is still pending, the
 * pending alert is marked `superseded` and ONE new alert is created for
 * `1 → 3`. Never two emails in a day, and never an alert whose `from` is a
 * modification the project was never on.
 */
export async function buildAlert(
  db: Db,
  input: { project: Project; toModification: number; now?: Date },
): Promise<BuildAlertResult> {
  const project = input.project;
  // The `from` side is the project's CURRENT pin, not whatever the ingest job
  // happened to supersede: those differ exactly when V8's case is happening.
  const fromModification = project.wdModificationNumber;

  const superseded = await db
    .update(wdChangeAlerts)
    .set({ status: 'superseded', resolvedAt: input.now ?? new Date() })
    .where(
      and(
        eq(wdChangeAlerts.projectId, project.id),
        eq(wdChangeAlerts.wdNumber, project.wdNumber),
        eq(wdChangeAlerts.status, 'pending'),
        lt(wdChangeAlerts.toModification, input.toModification),
      ),
    )
    // `.returning()` takes no selection here: `Db` is a union of the postgres-js
    // and PGlite database types and the parameterised overload does not survive
    // the union.
    .returning();

  let diff: WdDiff;
  let degraded = false;
  try {
    diff = await computeProjectDiff(db, {
      projectId: project.id,
      wdNumber: project.wdNumber,
      fromModification,
      toModification: input.toModification,
    });
  } catch (error) {
    // Degraded, never silent: the alert is still created with an empty diff and
    // the email says "modification n was published — review it".
    console.error('wd_diff_failed', { projectId: project.id, error: String(error) });
    degraded = true;
    diff = { changed: [], removed: [], added: [], affectedWorkerCount: 0, mappedWorkerCount: 0 };
  }

  const stored: StoredDiff = {
    changed: diff.changed,
    removed: diff.removed,
    added: diff.added,
    mappedWorkerCount: diff.mappedWorkerCount,
    ...(degraded ? { degraded: true } : {}),
  };

  const { alert, created } = await recordAlert(db, {
    projectId: project.id,
    wdNumber: project.wdNumber,
    fromModification,
    toModification: input.toModification,
    diff: stored as AlertDiff,
    affectedWorkerCount: diff.affectedWorkerCount,
  });

  return { alert, created, diff, supersededAlertIds: superseded.map((row) => row.id) };
}

export type PendingAlertRow = { alert: WdChangeAlert; project: Project };

export async function listPendingAlerts(db: Db, orgId: string): Promise<PendingAlertRow[]> {
  const rows = await db
    .select({ alert: wdChangeAlerts, project: projects })
    .from(wdChangeAlerts)
    .innerJoin(projects, eq(projects.id, wdChangeAlerts.projectId))
    .where(and(eq(projects.orgId, orgId), eq(wdChangeAlerts.status, 'pending')))
    .orderBy(asc(wdChangeAlerts.createdAt));
  return rows as PendingAlertRow[];
}

export async function listAlerts(db: Db, orgId: string): Promise<PendingAlertRow[]> {
  const rows = await db
    .select({ alert: wdChangeAlerts, project: projects })
    .from(wdChangeAlerts)
    .innerJoin(projects, eq(projects.id, wdChangeAlerts.projectId))
    .where(eq(projects.orgId, orgId))
    .orderBy(sql`${wdChangeAlerts.createdAt} desc`);
  return rows as PendingAlertRow[];
}

export async function getAlert(
  db: Db,
  input: { orgId: string; alertId: string },
): Promise<PendingAlertRow | undefined> {
  const [row] = await db
    .select({ alert: wdChangeAlerts, project: projects })
    .from(wdChangeAlerts)
    .innerJoin(projects, eq(projects.id, wdChangeAlerts.projectId))
    .where(and(eq(wdChangeAlerts.id, input.alertId), eq(projects.orgId, input.orgId)))
    .limit(1);
  return row as PendingAlertRow | undefined;
}

export async function modificationPublishedOn(
  db: Db,
  wdNumber: string,
  modificationNumber: number,
): Promise<string | undefined> {
  const [row] = await db
    .select({ publicationDate: kbWdModifications.publicationDate })
    .from(kbWdModifications)
    .where(
      and(
        eq(kbWdModifications.wdNumber, wdNumber),
        eq(kbWdModifications.modificationNumber, modificationNumber),
      ),
    )
    .limit(1);
  return row?.publicationDate;
}

export type AcceptResult =
  | { status: 'accepted'; affectedWorkerCount: number }
  | { status: 'blocked_by_removal'; labels: string[] }
  | { status: 'not_found' }
  | { status: 'determination_not_held' };

/**
 * V3/V4 — move the pin, update the OPEN mappings, leave every certified payroll
 * and every generated document exactly as they are.
 */
export async function acceptModification(
  db: Db,
  input: { orgId: string; alertId: string; userId?: string },
): Promise<AcceptResult> {
  const found = await getAlert(db, { orgId: input.orgId, alertId: input.alertId });
  if (!found) return { status: 'not_found' };
  const { alert, project } = found;

  const diff = alert.diff as StoredDiff;
  // V5 — a removed classification is a re-mapping decision, not a rate change.
  const removed = (diff.removed ?? []).filter((entry) => (entry.workers ?? []).length > 0);
  if (removed.length > 0) {
    return { status: 'blocked_by_removal', labels: removed.map((entry) => entry.label) };
  }

  const target = await determinationRows(db, alert.wdNumber, alert.toModification);
  if (!target) return { status: 'determination_not_held' };

  const byLabel = new Map<string, DiffClassification>();
  for (const row of target.rows) {
    const key = row.searchLabel ?? row.classificationLabel.toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, row);
    if (!byLabel.has(row.classificationLabel)) byLabel.set(row.classificationLabel, row);
  }

  await withTx(db, async (tx) => {
    await repinDetermination(tx, {
      projectId: project.id,
      wdId: target.wdId,
      wdNumber: alert.wdNumber,
      wdModificationNumber: alert.toModification,
      wdPinnedSuperseded: false,
      reason: 'accepted_modification',
      ...(input.userId ? { changedByUserId: input.userId } : {}),
    });

    // FUTURE payrolls only. `payrolls`, `payroll_lines` and `documents` are not
    // in this transaction and never will be.
    const open = await tx
      .select()
      .from(workerClassifications)
      .where(
        and(
          eq(workerClassifications.projectId, project.id),
          isNull(workerClassifications.unmappedAt),
        ),
      );

    for (const mapping of open) {
      const match =
        byLabel.get(mapping.classificationLabel) ??
        byLabel.get(
          mapping.classificationLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim(),
        );
      if (!match) continue;
      await tx
        .update(workerClassifications)
        .set({
          baseRate: match.baseRate,
          fringeRate: match.fringeRate,
          wdModificationNumber: alert.toModification,
        })
        .where(eq(workerClassifications.id, mapping.id));
    }

    await tx
      .update(wdChangeAlerts)
      .set({
        status: 'accepted',
        resolvedAt: new Date(),
        resolvedByUserId: input.userId ?? null,
      })
      .where(eq(wdChangeAlerts.id, alert.id));
  });

  return { status: 'accepted', affectedWorkerCount: alert.affectedWorkerCount };
}

/** Dismissing is not the same as being right: the banner persists on draft
 *  payrolls afterwards, so the fact stays visible where it matters. */
export async function dismissAlert(
  db: Db,
  input: { orgId: string; alertId: string; userId?: string },
): Promise<'dismissed' | 'not_found'> {
  const found = await getAlert(db, { orgId: input.orgId, alertId: input.alertId });
  if (!found) return 'not_found';
  await db
    .update(wdChangeAlerts)
    .set({ status: 'dismissed', resolvedAt: new Date(), resolvedByUserId: input.userId ?? null })
    .where(eq(wdChangeAlerts.id, input.alertId));
  return 'dismissed';
}

/** The 1×1 pixel's write. Idempotent, and it never overwrites the first open. */
export async function markAlertOpened(db: Db, alertId: string, now = new Date()): Promise<boolean> {
  const rows = await db
    .update(wdChangeAlerts)
    .set({ emailOpenedAt: now })
    .where(and(eq(wdChangeAlerts.id, alertId), isNull(wdChangeAlerts.emailOpenedAt)))
    .returning();
  return rows.length > 0;
}
