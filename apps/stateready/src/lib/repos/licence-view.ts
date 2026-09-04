/**
 * M4 — everything `/licences` and `/licences/:id` render, as a model.
 *
 * The pages are thin on purpose. A page that reaches into four repositories and
 * the knowledge base inline cannot be tested without a browser, and `specs/04`
 * AC1–AC8 are mostly statements about *what is shown* — the derived date beside
 * the entered one, the rule that produced it, the row that says the board
 * publishes no bond amount. Those belong in a model a server test can read.
 *
 * **`expirySource` is deliberately visible.** "You entered this" and "we worked
 * this out from Texas's rule" are different levels of trust, and the customer is
 * entitled to know which they are looking at.
 */

import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord, isTrade, listLicenceTypes } from '../kb/accessors';
import type { LicenceType, StateTradeRecord } from '../kb/types';
import { boardFor, buildRequirements, type RequirementRow } from '../requirements';
import { computeCe, type CeComputation } from '../rules/ce';
import { daysBetween } from '../rules/dates';
import type { DerivationResult } from '../rules';
import {
  ceRecords,
  deadlines,
  entities,
  licenceDocuments,
  licences,
  technicians,
  type Deadline,
  type Licence,
} from '../schema';
import { statusForDeadline, worseOf, type Status } from './dashboard';
import { deriveForLicenceInput } from './deadlines';

export type LicenceTypeOption = { id: string; name: string; level: string };

/**
 * `listLicenceTypes({ state, trade })` from `specs/04` §Server actions.
 *
 * Returns `covered: false` and an empty list for an uncovered state, which is
 * what switches the form to free text and puts the named banner above it. Three
 * different facts — no record, an unpublishable record, an unknown trade — get
 * the same honest answer: we cannot derive this for you.
 */
export function licenceTypeOptions(
  state: string,
  trade: string,
): { covered: boolean; options: LicenceTypeOption[]; stateName: string | null; boardUrl: string | null } {
  if (!isTrade(trade)) return { covered: false, options: [], stateName: null, boardUrl: null };
  const record = getKbRecord(state, trade);
  if (!record) return { covered: false, options: [], stateName: null, boardUrl: null };
  return {
    covered: true,
    stateName: record.state_name,
    boardUrl: record.boards[0]?.url ?? null,
    options: listLicenceTypes(state, trade).map((lt) => ({
      id: lt.licence_type_id,
      name: lt.name,
      level: lt.level,
    })),
  };
}

export type LicenceRow = {
  licence: Licence;
  holderName: string;
  holderHref: string | null;
  typeName: string;
  stateName: string;
  status: Status;
  nextDueOn: string | null;
  nextDays: number | null;
  /** `derived` / `entered`, as the customer reads it. */
  expiryWording: string;
  covered: boolean;
  ceRequired: number | null;
  ceRecorded: number;
  documentCount: number;
};

export type LicenceListModel = {
  rows: LicenceRow[];
  /** State → rows, in the grouping `specs/04` §Screens asks for. */
  groups: { state: string; stateName: string; rows: LicenceRow[] }[];
  states: string[];
  trades: string[];
  filters: { state: string | null; trade: string | null; status: string | null; within: number | null };
  total: number;
};

export type LicenceFilters = {
  state?: string | null;
  trade?: string | null;
  status?: string | null;
  /** "expiring within N days" */
  within?: number | null;
};

export async function buildLicenceList(
  db: Db,
  orgId: string,
  today: string,
  filters: LicenceFilters = {},
): Promise<LicenceListModel> {
  const [licenceRows, deadlineRows, technicianRows, entityRows, documentRows] = await Promise.all([
    db
      .select()
      .from(licences)
      .where(and(eq(licences.orgId, orgId), eq(licences.status, 'active')))
      .orderBy(asc(licences.state), asc(licences.createdAt)),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt))),
    db.select().from(technicians).where(eq(technicians.orgId, orgId)),
    db.select().from(entities).where(eq(entities.orgId, orgId)),
    db.select().from(licenceDocuments).where(eq(licenceDocuments.orgId, orgId)),
  ]);

  const technicianById = new Map(technicianRows.map((t) => [t.id, t]));
  const entityById = new Map(entityRows.map((e) => [e.id, e]));
  const documentCount = new Map<string, number>();
  for (const doc of documentRows) documentCount.set(doc.licenceId, (documentCount.get(doc.licenceId) ?? 0) + 1);

  const all: LicenceRow[] = licenceRows.map((licence) => {
    const record = getKbRecord(licence.state, licence.trade);
    const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId);
    const own = deadlineRows.filter((d) => d.licenceId === licence.id);
    let status: Status = own.length === 0 ? 'NOT TRACKED' : 'READY';
    for (const deadline of own) status = worseOf(status, statusForDeadline(deadline.dueOn, today));
    const next = own.slice().sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0] ?? null;
    const technician = licence.technicianId ? technicianById.get(licence.technicianId) : undefined;
    const entity = licence.entityId ? entityById.get(licence.entityId) : undefined;

    return {
      licence,
      holderName: technician
        ? `${technician.firstName} ${technician.lastName}`.trim()
        : (entity?.name ?? 'The company'),
      holderHref: technician ? `/technicians/${technician.id}` : null,
      typeName: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
      stateName: record?.state_name ?? licence.state,
      status,
      nextDueOn: next?.dueOn ?? null,
      nextDays: next ? daysBetween(today, next.dueOn) : null,
      expiryWording: expiryWording(licence.expirySource),
      covered: record !== null,
      ceRequired:
        typeof licenceType?.continuing_education.hours.value === 'number'
          ? (licenceType.continuing_education.hours.value as number)
          : null,
      ceRecorded: Number(licence.ceHoursRecorded ?? 0),
      documentCount: documentCount.get(licence.id) ?? 0,
    };
  });

  const rows = all.filter((row) => {
    if (filters.state && row.licence.state !== filters.state.toUpperCase()) return false;
    if (filters.trade && row.licence.trade !== filters.trade) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (typeof filters.within === 'number') {
      if (row.nextDays === null) return false;
      if (row.nextDays > filters.within) return false;
    }
    return true;
  });

  const groups: LicenceListModel['groups'] = [];
  for (const row of rows) {
    const group = groups.find((g) => g.state === row.licence.state);
    if (group) group.rows.push(row);
    else groups.push({ state: row.licence.state, stateName: row.stateName, rows: [row] });
  }

  return {
    rows,
    groups,
    states: [...new Set(all.map((r) => r.licence.state))].sort(),
    trades: [...new Set(all.map((r) => r.licence.trade))].sort(),
    filters: {
      state: filters.state ? filters.state.toUpperCase() : null,
      trade: filters.trade ?? null,
      status: filters.status ?? null,
      within: filters.within ?? null,
    },
    total: all.length,
  };
}

/** "we worked this out from the state's rule" vs "you entered this". */
export function expiryWording(source: string): string {
  if (source === 'derived') return "we worked this out from the state's own rule";
  if (source === 'board_verified') return 'we read this on the board’s own register';
  return 'you entered this';
}

export type DeadlineView = {
  deadline: Deadline;
  status: Status;
  days: number;
  /** The trace `explainDeadline` returns — the "why this date?" panel. */
  trace: { label: string; detail: string }[];
  notes: string[];
};

export type LicenceView = {
  licence: Licence;
  holderName: string;
  holderId: string | null;
  holderKind: 'entity' | 'technician';
  stateName: string;
  typeName: string;
  covered: boolean;
  record: StateTradeRecord | null;
  licenceType: LicenceType | null;
  board: { name: string; url: string } | null;
  status: Status;
  deadlines: DeadlineView[];
  requirements: RequirementRow[];
  documents: (typeof licenceDocuments.$inferSelect)[];
  ce: (typeof ceRecords.$inferSelect)[];
  /** Live derivation, for the explanations and the conflict panel. */
  derivation: DerivationResult;
  /**
   * The CE meter, computed from the hours ACTUALLY RECORDED against this
   * licence. `deriveForLicenceInput` derives with an empty CE list by design —
   * it is the shape the nightly cron and the golden set use — so the screen
   * that shows a meter has to supply the records itself.
   */
  ceComputation: CeComputation | null;
  /** Both dates, neither overwritten (`specs/04` §Edge cases). */
  conflict: { entered: string; derived: string } | null;
  /** "we cannot derive deadlines for Ohio yet" — AC4. */
  uncoveredBanner: string | null;
};

export async function buildLicenceView(
  db: Db,
  orgId: string,
  licenceId: string,
  today: string,
): Promise<LicenceView | null> {
  const licenceRows = await db
    .select()
    .from(licences)
    .where(and(eq(licences.id, licenceId), eq(licences.orgId, orgId)))
    .limit(1);
  const licence = licenceRows[0];
  if (!licence) return null;

  const [deadlineRows, documentRows, ceRows] = await Promise.all([
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.licenceId, licence.id), isNull(deadlines.supersededAt)))
      .orderBy(asc(deadlines.dueOn)),
    db
      .select()
      .from(licenceDocuments)
      .where(and(eq(licenceDocuments.licenceId, licence.id), eq(licenceDocuments.orgId, orgId)))
      .orderBy(desc(licenceDocuments.createdAt)),
    db
      .select()
      .from(ceRecords)
      .where(and(eq(ceRecords.licenceId, licence.id), eq(ceRecords.orgId, orgId)))
      .orderBy(desc(ceRecords.completedOn)),
  ]);

  const record = getKbRecord(licence.state, licence.trade);
  const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId) ?? null;

  // Re-derive with the CE hours actually recorded, so the meter and the subject
  // shortfall on this page are the same numbers the alert would carry.
  const derivation = deriveForLicenceInput(
    {
      ...licence,
      // The engine takes what the customer typed; `deriveForLicenceInput` reads
      // `expirySource` to decide that, and this page must not change it.
    } as Licence,
    today,
  );

  let holderName = 'The company';
  let holderId: string | null = null;
  if (licence.technicianId) {
    const rows = await db.select().from(technicians).where(eq(technicians.id, licence.technicianId)).limit(1);
    holderName = rows[0] ? `${rows[0].firstName} ${rows[0].lastName}`.trim() : 'Unknown technician';
    holderId = licence.technicianId;
  } else if (licence.entityId) {
    const rows = await db.select().from(entities).where(eq(entities.id, licence.entityId)).limit(1);
    holderName = rows[0]?.name ?? 'The company';
    holderId = licence.entityId;
  }

  let status: Status = deadlineRows.length === 0 ? 'NOT TRACKED' : 'READY';
  for (const deadline of deadlineRows) status = worseOf(status, statusForDeadline(deadline.dueOn, today));

  return {
    licence,
    holderName,
    holderId,
    holderKind: licence.holderKind as 'entity' | 'technician',
    stateName: record?.state_name ?? licence.state,
    typeName: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
    covered: record !== null,
    record,
    licenceType,
    board: record ? boardFor(record, licenceType) : null,
    status,
    deadlines: deadlineRows.map((deadline) => ({
      deadline,
      status: statusForDeadline(deadline.dueOn, today),
      days: daysBetween(today, deadline.dueOn),
      trace: (deadline.trace as { label: string; detail: string }[]) ?? [],
      notes: (deadline.notes as string[]) ?? [],
    })),
    requirements: record && licenceType ? buildRequirements(record, licenceType, today) : [],
    documents: documentRows,
    ce: ceRows,
    derivation,
    ceComputation: licenceType
      ? computeCe(
          licenceType.continuing_education,
          ceRows.map((row) => ({
            hours: Number(row.hours),
            subject: row.subject,
            deliveryMode: row.deliveryMode as 'classroom' | 'online' | 'unknown',
            completedOn: row.completedOn,
          })),
          Number(licence.ceCarriedInHours ?? 0),
        )
      : null,
    conflict: derivation.expiryConflict,
    uncoveredBanner: record
      ? licenceType
        ? null
        : `We hold ${licence.trade} rules for ${record.state_name}, but not for this licence type. ` +
          'We will track the dates you enter and we will not invent the ones we cannot source.'
      : `We do not have ${licence.state} ${licence.trade} rules yet, so we cannot derive deadlines for this licence. ` +
        'We will still track the dates you enter.',
  };
}
