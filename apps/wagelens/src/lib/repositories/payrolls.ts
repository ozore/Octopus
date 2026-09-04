/**
 * Payrolls, their lines, their fringe credits and their submission status
 * (WL-05, WL-07).
 *
 * THREE PROPERTIES, ALL OF THEM ABOUT A SIGNED FEDERAL STATEMENT:
 *
 *  1. **The payroll number is allocated at CERTIFICATION, not at creation**
 *     (finding M4). A draft that is abandoned takes no number, so it cannot
 *     leave a gap — and a gap in a certified-payroll sequence is the first
 *     thing an auditor looks for and the most common reason a general
 *     contractor withholds a progress payment. `nextPayrollNumber()` is
 *     computed on read and shown as "provisional".
 *  2. **The pin is copied at creation and frozen.** `payrolls.wd_number` and
 *     `wd_modification_number` are never re-read from the project: a
 *     modification landing on Thursday must not change Wednesday's draft under
 *     the user's hands (gate G9).
 *  3. **A certified payroll is immutable.** Every mutation below refuses a
 *     payroll that is not a draft. The path to a correction is
 *     `reopenPayroll`, which creates a NEW payroll with a NEW number and
 *     supersedes the old one — both are retained, because the original was
 *     already filed with the agency.
 *
 * `certifyPayroll` is the transactional primitive and does not validate;
 * `certifyPayrollChecked` is WL-05's action and refuses on any blocking rule.
 * They are two functions rather than a flag because "certify this" and "check
 * this, then certify it" are different promises, and a boolean argument is a
 * bad way to tell two promises apart.
 */

import { and, asc, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import {
  cents,
  deriveLine,
  detectMissingWeeks,
  fromCents,
  validatePayroll as runValidation,
  type LineFigures,
  type ValidationResult,
} from '../domain/payroll-math';
import {
  apprenticeshipPrograms,
  fringePlans,
  organisationSettings,
  payrollLineFringeCredits,
  payrollLines,
  payrolls,
  projects,
  workerClassifications,
  workers,
  type FringePlan,
  type Payroll,
  type PayrollLine,
  type PayrollLineFringeCredit,
} from '../schema';

export class PayrollNotEditableError extends Error {
  constructor(status: string) {
    super(
      `A ${status} payroll is a signed federal statement and cannot be edited. Reopen it to file a correction.`,
    );
    this.name = 'PayrollNotEditableError';
  }
}

export class PayrollValidationError extends Error {
  constructor(readonly result: ValidationResult) {
    super(result.errors.map((e) => `${e.ruleId}: ${e.message}`).join(' · '));
    this.name = 'PayrollValidationError';
  }
}

const ZERO_WEEK = ['0', '0', '0', '0', '0', '0', '0'];

async function requireDraft(db: Db, payrollId: string): Promise<Payroll> {
  const [row] = await db.select().from(payrolls).where(eq(payrolls.id, payrollId)).limit(1);
  if (!row) throw new Error(`payroll ${payrollId} does not exist`);
  if (row.status !== 'draft') throw new PayrollNotEditableError(row.status);
  return row as Payroll;
}

// ---------------------------------------------------------------------------
// Creating a payroll
// ---------------------------------------------------------------------------

export async function createPayroll(
  db: Db,
  input: {
    projectId: string;
    filerOrganisationId: string;
    weekEndingDate: string;
    noWorkPerformed?: boolean;
    /** Seed one line per mapped worker, with their classification and rates. */
    seedFromCrew?: boolean;
    /**
     * The pin the caller BELIEVES the project carries. It is not an override:
     * it is VERIFIED against the project and refused on a mismatch. The pin on
     * a payroll always comes from the project, so nothing here can create a
     * payroll pinned to a determination the project is not on (gate G9).
     */
    wdNumber?: string;
    wdModificationNumber?: number;
  },
): Promise<Payroll> {
  const [project] = await db
    .select({
      wdNumber: projects.wdNumber,
      wdModificationNumber: projects.wdModificationNumber,
    })
    .from(projects)
    .where(eq(projects.id, input.projectId))
    .limit(1);
  if (!project) throw new Error(`createPayroll: project ${input.projectId} does not exist`);
  if (
    (input.wdNumber !== undefined && input.wdNumber !== project.wdNumber) ||
    (input.wdModificationNumber !== undefined &&
      input.wdModificationNumber !== project.wdModificationNumber)
  ) {
    throw new Error(
      `createPayroll: the project is pinned to ${project.wdNumber} mod ${project.wdModificationNumber}, and a payroll's pin is copied from the project, never supplied`,
    );
  }

  const [row] = await db
    .insert(payrolls)
    .values({
      id: newId('pay'),
      projectId: input.projectId,
      filerOrganisationId: input.filerOrganisationId,
      weekEndingDate: input.weekEndingDate,
      noWorkPerformed: input.noWorkPerformed ?? false,
      // Frozen here. Never re-read.
      wdNumber: project.wdNumber,
      wdModificationNumber: project.wdModificationNumber,
      // payrollNumber stays null: nothing is reserved by a draft.
    })
    .returning();
  const payroll = row as Payroll;
  if (input.seedFromCrew && !input.noWorkPerformed) await seedLinesFromCrew(db, payroll);
  return payroll;
}

/**
 * One line per mapped worker, with the classification label and BOTH rates
 * copied onto the row. A blank grid on week two is a design failure (UX §3 A8),
 * and a seeded line is also what makes B2 ("no worker with hours is unmapped")
 * an exception rather than the norm.
 */
export async function seedLinesFromCrew(db: Db, payroll: Payroll): Promise<number> {
  const crew = await db
    .select({
      workerId: workerClassifications.workerId,
      classificationLabel: workerClassifications.classificationLabel,
      kbClassificationId: workerClassifications.kbClassificationId,
      baseRate: workerClassifications.baseRate,
      fringeRate: workerClassifications.fringeRate,
      firstName: workers.firstName,
      lastName: workers.lastName,
      middleInitial: workers.middleInitial,
      identifyingNoLast4: workers.identifyingNoLast4,
      defaultStatus: workers.defaultStatus,
    })
    .from(workerClassifications)
    .innerJoin(workers, eq(workers.id, workerClassifications.workerId))
    .where(
      and(
        eq(workerClassifications.projectId, payroll.projectId),
        isNull(workerClassifications.unmappedAt),
        isNull(workers.archivedAt),
      ),
    )
    .orderBy(asc(workers.lastName), asc(workers.firstName));

  let entryNo = 0;
  for (const member of crew) {
    entryNo += 1;
    await addPayrollLine(db, {
      payrollId: payroll.id,
      workerId: member.workerId,
      workerEntryNo: entryNo,
      lastName: member.lastName,
      firstName: member.firstName,
      ...(member.middleInitial ? { middleInitial: member.middleInitial } : {}),
      identifyingNoLast4: member.identifyingNoLast4,
      workerStatus: member.defaultStatus === 'RA' ? 'RA' : 'J',
      classificationLabel: member.classificationLabel,
      ...(member.kbClassificationId ? { kbClassificationId: member.kbClassificationId } : {}),
      rateSt: member.baseRate,
      // Time and a half on the BASE rate only: cash in lieu of fringe is not
      // overtime-eligible (PERSONA §7.4 error 3). The user may overwrite it.
      rateOt: fromCents(Math.round((cents(member.baseRate) * 3) / 2)),
      wdBaseRate: member.baseRate,
      wdFringeRate: member.fringeRate,
      sortOrder: entryNo,
    });
  }
  return entryNo;
}

/** Advisory, computed on read, and labelled "provisional" wherever it renders:
 *  it may move if another draft on the same project certifies first. */
export async function nextPayrollNumber(
  db: Db,
  projectId: string,
  filerOrganisationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`coalesce(max(${payrolls.payrollNumber}), 0)::int` })
    .from(payrolls)
    .where(
      and(eq(payrolls.projectId, projectId), eq(payrolls.filerOrganisationId, filerOrganisationId)),
    );
  return Number(row?.value ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------

export async function addPayrollLine(
  db: Db,
  input: {
    payrollId: string;
    workerId: string;
    workerEntryNo: number;
    lastName: string;
    firstName: string;
    middleInitial?: string;
    identifyingNoLast4: string;
    workerStatus?: 'J' | 'RA';
    classificationLabel: string;
    kbClassificationId?: string;
    hoursSt?: number[];
    hoursOt?: number[];
    rateSt: string;
    rateOt?: string;
    wdBaseRate?: string;
    wdFringeRate?: string;
    sortOrder?: number;
  },
): Promise<PayrollLine> {
  const st = input.hoursSt ?? [0, 0, 0, 0, 0, 0, 0];
  const ot = input.hoursOt ?? [0, 0, 0, 0, 0, 0, 0];
  if (st.length !== 7 || ot.length !== 7) {
    throw new Error('addPayrollLine: the hours grid is seven days, Sunday first');
  }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const [row] = await db
    .insert(payrollLines)
    .values({
      id: newId('pln'),
      payrollId: input.payrollId,
      workerId: input.workerId,
      workerEntryNo: input.workerEntryNo,
      lastName: input.lastName,
      firstName: input.firstName,
      middleInitial: input.middleInitial ? input.middleInitial.slice(0, 1) : null,
      identifyingNoLast4: input.identifyingNoLast4,
      workerStatus: input.workerStatus ?? 'J',
      classificationLabel: input.classificationLabel,
      kbClassificationId: input.kbClassificationId ?? null,
      hoursSt: st.map((h) => h.toFixed(2)),
      hoursOt: ot.map((h) => h.toFixed(2)),
      totalHoursSt: sum(st).toFixed(2),
      totalHoursOt: sum(ot).toFixed(2),
      rateSt: input.rateSt,
      rateOt: input.rateOt ?? '0',
      wdBaseRate: input.wdBaseRate ?? null,
      wdFringeRate: input.wdFringeRate ?? null,
      sortOrder: input.sortOrder ?? input.workerEntryNo,
    })
    .returning();
  return row as PayrollLine;
}

/**
 * `S` on a focused day cell: a second line for the same worker under a
 * different classification. Two `worker_entry_no` values, one worker — which is
 * how the WH-347 handles it, and why the wrong single row has to be harder than
 * the right two (PERSONA §7.4 error 2).
 */
export async function splitLine(
  db: Db,
  input: { lineId: string; classificationLabel?: string; kbClassificationId?: string; rateSt?: string },
): Promise<PayrollLine> {
  const [source] = await db.select().from(payrollLines).where(eq(payrollLines.id, input.lineId)).limit(1);
  if (!source) throw new Error(`splitLine: line ${input.lineId} does not exist`);
  await requireDraft(db, source.payrollId);
  const [max] = await db
    .select({
      entry: sql<number>`coalesce(max(${payrollLines.workerEntryNo}), 0)::int`,
      order: sql<number>`coalesce(max(${payrollLines.sortOrder}), 0)::int`,
    })
    .from(payrollLines)
    .where(eq(payrollLines.payrollId, source.payrollId));
  return addPayrollLine(db, {
    payrollId: source.payrollId,
    workerId: source.workerId,
    workerEntryNo: Number(max?.entry ?? 0) + 1,
    lastName: source.lastName,
    firstName: source.firstName,
    ...(source.middleInitial ? { middleInitial: source.middleInitial } : {}),
    identifyingNoLast4: source.identifyingNoLast4,
    workerStatus: source.workerStatus === 'RA' ? 'RA' : 'J',
    classificationLabel: input.classificationLabel ?? source.classificationLabel,
    ...(input.kbClassificationId ? { kbClassificationId: input.kbClassificationId } : {}),
    rateSt: input.rateSt ?? source.rateSt,
    rateOt: source.rateOt,
    ...(source.wdBaseRate ? { wdBaseRate: source.wdBaseRate } : {}),
    ...(source.wdFringeRate ? { wdFringeRate: source.wdFringeRate } : {}),
    sortOrder: Number(max?.order ?? 0) + 1,
  });
}

export async function removePayrollLine(db: Db, lineId: string): Promise<void> {
  const [line] = await db.select().from(payrollLines).where(eq(payrollLines.id, lineId)).limit(1);
  if (!line) return;
  await requireDraft(db, line.payrollId);
  await db.delete(payrollLines).where(eq(payrollLines.id, lineId));
}

/** The fields the grid may write. Anything else is computed or frozen. */
export const EDITABLE_LINE_FIELDS = [
  'hoursSt',
  'hoursOt',
  'rateSt',
  'rateOt',
  'fringeCreditHourly',
  'paymentInLieuHourly',
  'grossProject',
  'grossAllWork',
  'dedTaxWithholdings',
  'dedFica',
  'dedOther',
  'dedOtherNote',
  'workerStatus',
  'classificationLabel',
] as const;

export type EditableLineField = (typeof EDITABLE_LINE_FIELDS)[number];

/**
 * One cell, autosaved. The derived columns — (5), (8d), (9) — are recomputed
 * SERVER-SIDE on every write, never trusted from the client: a client that
 * computed them would be a client that could sign a form whose arithmetic does
 * not close.
 */
export async function updateCell(
  db: Db,
  input: { lineId: string; field: EditableLineField; value: string; dayIndex?: number },
): Promise<PayrollLine> {
  const [line] = await db.select().from(payrollLines).where(eq(payrollLines.id, input.lineId)).limit(1);
  if (!line) throw new Error(`updateCell: line ${input.lineId} does not exist`);
  await requireDraft(db, line.payrollId);

  const patch: Record<string, unknown> = {};
  if (input.field === 'hoursSt' || input.field === 'hoursOt') {
    const current = [...((line[input.field] as string[] | null) ?? ZERO_WEEK)];
    const index = input.dayIndex ?? 0;
    if (index < 0 || index > 6) throw new Error('updateCell: the workweek has seven days');
    current[index] = fromCents(cents(input.value));
    patch[input.field] = current;
  } else if (input.field === 'dedOtherNote' || input.field === 'workerStatus' || input.field === 'classificationLabel') {
    patch[input.field] = input.value;
  } else {
    patch[input.field] = fromCents(cents(input.value));
  }

  const merged = { ...line, ...patch } as unknown as PayrollLine;
  const derived = deriveLine({
    hoursSt: (merged.hoursSt as string[]) ?? ZERO_WEEK,
    hoursOt: (merged.hoursOt as string[]) ?? ZERO_WEEK,
    dedTaxWithholdings: merged.dedTaxWithholdings,
    dedFica: merged.dedFica,
    dedOther: merged.dedOther,
    grossAllWork: merged.grossAllWork,
  });

  const [row] = await db
    .update(payrollLines)
    .set({ ...patch, ...derived })
    .where(eq(payrollLines.id, input.lineId))
    .returning();
  return row as PayrollLine;
}

export async function payrollLinesOf(db: Db, payrollId: string): Promise<PayrollLine[]> {
  return db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.payrollId, payrollId))
    .orderBy(payrollLines.sortOrder);
}

// ---------------------------------------------------------------------------
// Fringe plans and credits (page 2)
// ---------------------------------------------------------------------------

export async function createFringePlan(
  db: Db,
  input: {
    orgId: string;
    name: string;
    planType?: string;
    planNo?: string;
    isFunded?: boolean;
  },
): Promise<FringePlan> {
  const [row] = await db
    .insert(fringePlans)
    .values({
      id: newId('frp'),
      orgId: input.orgId,
      name: input.name,
      planType: input.planType ?? 'other',
      planNo: input.planNo ?? null,
      isFunded: input.isFunded ?? true,
    })
    .returning();
  return row as FringePlan;
}

export async function listFringePlans(db: Db, orgId: string): Promise<FringePlan[]> {
  return db
    .select()
    .from(fringePlans)
    .where(and(eq(fringePlans.orgId, orgId), isNull(fringePlans.archivedAt)))
    .orderBy(asc(fringePlans.name));
}

/**
 * The plan's four printed fields are FROZEN onto the credit, for the same
 * reason every other printed value is frozen: a plan renamed in March must not
 * change what a form signed in February says.
 */
export async function setFringeCredit(
  db: Db,
  input: { payrollLineId: string; fringePlanId: string; hourlyCredit: string },
): Promise<PayrollLineFringeCredit> {
  const [line] = await db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.id, input.payrollLineId))
    .limit(1);
  if (!line) throw new Error(`setFringeCredit: line ${input.payrollLineId} does not exist`);
  await requireDraft(db, line.payrollId);

  const [plan] = await db.select().from(fringePlans).where(eq(fringePlans.id, input.fringePlanId)).limit(1);
  if (!plan) throw new Error(`setFringeCredit: plan ${input.fringePlanId} does not exist`);

  const values = {
    id: newId('flc'),
    payrollLineId: input.payrollLineId,
    fringePlanId: input.fringePlanId,
    hourlyCredit: fromCents(cents(input.hourlyCredit)),
    planName: plan.name,
    planType: plan.planType,
    planNo: plan.planNo,
    isFunded: plan.isFunded,
  };
  const [row] = await db
    .insert(payrollLineFringeCredits)
    .values(values)
    .onConflictDoUpdate({
      target: [payrollLineFringeCredits.payrollLineId, payrollLineFringeCredits.fringePlanId],
      set: {
        hourlyCredit: values.hourlyCredit,
        planName: values.planName,
        planType: values.planType,
        planNo: values.planNo,
        isFunded: values.isFunded,
      },
    })
    .returning();
  return row as PayrollLineFringeCredit;
}

export async function fringeCreditsOf(
  db: Db,
  payrollId: string,
): Promise<PayrollLineFringeCredit[]> {
  return db
    .select({
      id: payrollLineFringeCredits.id,
      payrollLineId: payrollLineFringeCredits.payrollLineId,
      fringePlanId: payrollLineFringeCredits.fringePlanId,
      hourlyCredit: payrollLineFringeCredits.hourlyCredit,
      planName: payrollLineFringeCredits.planName,
      planType: payrollLineFringeCredits.planType,
      planNo: payrollLineFringeCredits.planNo,
      isFunded: payrollLineFringeCredits.isFunded,
    })
    .from(payrollLineFringeCredits)
    .innerJoin(payrollLines, eq(payrollLines.id, payrollLineFringeCredits.payrollLineId))
    .where(eq(payrollLines.payrollId, payrollId));
}

// ---------------------------------------------------------------------------
// Copy last week
// ---------------------------------------------------------------------------

/**
 * Hours, rates, deductions AND fringe credits from the most recent certified
 * payroll on the project.
 *
 * **The hours are copied too, and the banner says so.** Week-to-week hours
 * really are usually identical, and correcting three cells beats typing 168 —
 * which is the whole retention argument (WL-05's opening paragraph).
 */
export async function copyLastWeek(
  db: Db,
  payrollId: string,
): Promise<{ linesCopied: number; fromPayrollId: string | null }> {
  const draft = await requireDraft(db, payrollId);
  const [source] = await db
    .select()
    .from(payrolls)
    .where(
      and(
        eq(payrolls.projectId, draft.projectId),
        eq(payrolls.filerOrganisationId, draft.filerOrganisationId),
        eq(payrolls.status, 'certified'),
        ne(payrolls.id, payrollId),
      ),
    )
    .orderBy(desc(payrolls.weekEndingDate))
    .limit(1);
  if (!source) return { linesCopied: 0, fromPayrollId: null };

  const sourceLines = await payrollLinesOf(db, source.id);
  const sourceCredits = await fringeCreditsOf(db, source.id);
  await db.delete(payrollLines).where(eq(payrollLines.payrollId, payrollId));

  let copied = 0;
  for (const line of sourceLines) {
    const [row] = await db
      .insert(payrollLines)
      .values({
        ...line,
        id: newId('pln'),
        payrollId,
      })
      .returning();
    copied += 1;
    for (const credit of sourceCredits.filter((c) => c.payrollLineId === line.id)) {
      await db.insert(payrollLineFringeCredits).values({
        ...credit,
        id: newId('flc'),
        payrollLineId: (row as PayrollLine).id,
      });
    }
  }
  return { linesCopied: copied, fromPayrollId: source.id };
}

/** A week with no covered work is a FILED payroll, not a note: it still has to
 *  be certified, and it still consumes a number. */
export async function markNoWorkPerformed(db: Db, payrollId: string): Promise<Payroll> {
  await requireDraft(db, payrollId);
  await db.delete(payrollLines).where(eq(payrollLines.payrollId, payrollId));
  const [row] = await db
    .update(payrolls)
    .set({ noWorkPerformed: true, updatedAt: new Date() })
    .where(eq(payrolls.id, payrollId))
    .returning();
  return row as Payroll;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export async function validatePayrollById(db: Db, payrollId: string): Promise<ValidationResult> {
  const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, payrollId)).limit(1);
  if (!payroll) throw new Error(`validatePayroll: payroll ${payrollId} does not exist`);

  const lines = await payrollLinesOf(db, payrollId);
  const credits = await fringeCreditsOf(db, payrollId);
  const workerIds = [...new Set(lines.map((line) => line.workerId))];

  const apprenticed = new Set<string>();
  if (workerIds.length > 0) {
    const rows = await db
      .select({ id: workers.id })
      .from(workers)
      .innerJoin(apprenticeshipPrograms, eq(apprenticeshipPrograms.id, workers.apprenticeshipProgramId))
      .where(and(inArray(workers.id, workerIds), isNotNull(workers.apprenticeshipProgramId)));
    for (const row of rows) apprenticed.add(row.id);
  }

  const mapped = new Set(
    (
      await db
        .select({ workerId: workerClassifications.workerId })
        .from(workerClassifications)
        .where(
          and(
            eq(workerClassifications.projectId, payroll.projectId),
            isNull(workerClassifications.unmappedAt),
          ),
        )
    ).map((row) => row.workerId),
  );
  const unmapped = new Set(workerIds.filter((id) => !mapped.has(id)));

  const [duplicate] = await db
    .select({ id: payrolls.id })
    .from(payrolls)
    .where(
      and(
        eq(payrolls.projectId, payroll.projectId),
        eq(payrolls.filerOrganisationId, payroll.filerOrganisationId),
        eq(payrolls.weekEndingDate, payroll.weekEndingDate),
        ne(payrolls.id, payrollId),
        ne(payrolls.status, 'superseded'),
      ),
    )
    .limit(1);

  const fringeCreditsByLine: Record<string, string[]> = {};
  for (const credit of credits) {
    (fringeCreditsByLine[credit.payrollLineId] ??= []).push(credit.hourlyCredit);
  }

  const previous = await previousWeekHours(db, payroll);

  return runValidation({
    noWorkPerformed: payroll.noWorkPerformed,
    certifyingOfficialName: payroll.certifyingOfficialName,
    certifyingOfficialTitle: payroll.certifyingOfficialTitle,
    certifyingOfficialPhone: payroll.certifyingOfficialPhone,
    certifyingOfficialEmail: payroll.certifyingOfficialEmail,
    lines: lines.map(toLineFigures),
    fringeCreditsByLine,
    workersWithApprenticeship: apprenticed,
    unmappedWorkerIds: unmapped,
    weekAlreadyFiled: duplicate !== undefined,
    missingWeeks: await missingWeeksFor(db, payroll.projectId, new Date(`${payroll.weekEndingDate}T00:00:00Z`)),
    previousWeekHoursByWorker: previous,
  });
}

function toLineFigures(line: PayrollLine): LineFigures {
  return {
    id: line.id,
    hoursSt: (line.hoursSt as string[] | null) ?? ZERO_WEEK,
    hoursOt: (line.hoursOt as string[] | null) ?? ZERO_WEEK,
    rateSt: line.rateSt,
    rateOt: line.rateOt,
    fringeCreditHourly: line.fringeCreditHourly,
    paymentInLieuHourly: line.paymentInLieuHourly,
    grossProject: line.grossProject,
    grossAllWork: line.grossAllWork,
    dedTaxWithholdings: line.dedTaxWithholdings,
    dedFica: line.dedFica,
    dedOther: line.dedOther,
    dedOtherNote: line.dedOtherNote,
    workerId: line.workerId,
    workerStatus: line.workerStatus,
    classificationLabel: line.classificationLabel,
    wdBaseRate: line.wdBaseRate,
    wdFringeRate: line.wdFringeRate,
  };
}

async function previousWeekHours(db: Db, payroll: Payroll): Promise<Record<string, number>> {
  const [previous] = await db
    .select({ id: payrolls.id })
    .from(payrolls)
    .where(
      and(
        eq(payrolls.projectId, payroll.projectId),
        eq(payrolls.status, 'certified'),
        ne(payrolls.id, payroll.id),
      ),
    )
    .orderBy(desc(payrolls.weekEndingDate))
    .limit(1);
  if (!previous) return {};
  const lines = await payrollLinesOf(db, previous.id);
  const totals: Record<string, number> = {};
  for (const line of lines) {
    totals[line.workerId] =
      (totals[line.workerId] ?? 0) + cents(line.totalHoursSt) + cents(line.totalHoursOt);
  }
  return totals;
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

/**
 * Allocate the number and flip the status IN ONE TRANSACTION.
 *
 * The lock is a **transaction-scoped advisory lock** on the `(project, filer)`
 * pair, and not `SELECT max(...) FOR UPDATE`, for two reasons. The first is
 * that Postgres refuses row locking on an aggregate (`FOR UPDATE is not
 * allowed with aggregate functions`) — the obvious spelling simply does not
 * run. The second is the one that matters: the first certification on a project
 * has NO ROW TO LOCK, so a row lock cannot serialise it at all. An advisory
 * lock keyed on the sequence itself covers the empty case as well as the full
 * one, and the unique index on `(project, filer, payroll_number)` settles
 * anything the lock does not.
 */
export async function certifyPayroll(
  db: Db,
  input: {
    payrollId: string;
    certifiedByUserId?: string;
    certifyingOfficialName?: string;
    certifyingOfficialTitle?: string;
    certifyingOfficialPhone?: string;
    certifyingOfficialEmail?: string;
    additionalRemarks?: string;
    isFinal?: boolean;
  },
): Promise<Payroll> {
  return withTx(db, async (tx) => {
    const [existing] = await tx
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, input.payrollId))
      .limit(1);
    if (!existing) throw new Error(`certifyPayroll: payroll ${input.payrollId} does not exist`);
    // Certification is idempotent: the same draft certified twice returns the
    // same certified payroll rather than taking a second number.
    if (existing.status === 'certified') return existing as Payroll;
    if (existing.status !== 'draft') throw new PayrollNotEditableError(existing.status);

    // Held until the transaction commits or rolls back; nothing to release.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`payroll:${existing.projectId}:${existing.filerOrganisationId}`}))`,
    );

    const [claimed] = await tx
      .select({ next: sql<number>`coalesce(max(${payrolls.payrollNumber}), 0)::int + 1` })
      .from(payrolls)
      .where(
        and(
          eq(payrolls.projectId, existing.projectId),
          eq(payrolls.filerOrganisationId, existing.filerOrganisationId),
        ),
      );
    const next = Number(claimed?.next ?? 1);

    const [row] = await tx
      .update(payrolls)
      .set({
        payrollNumber: next,
        status: 'certified',
        certifiedAt: new Date(),
        certifiedByUserId: input.certifiedByUserId ?? null,
        certifyingOfficialName: input.certifyingOfficialName ?? existing.certifyingOfficialName,
        certifyingOfficialTitle: input.certifyingOfficialTitle ?? existing.certifyingOfficialTitle,
        certifyingOfficialPhone: input.certifyingOfficialPhone ?? existing.certifyingOfficialPhone,
        certifyingOfficialEmail: input.certifyingOfficialEmail ?? existing.certifyingOfficialEmail,
        additionalRemarks: input.additionalRemarks ?? existing.additionalRemarks,
        isFinal: input.isFinal ?? existing.isFinal,
        updatedAt: new Date(),
      })
      .where(eq(payrolls.id, input.payrollId))
      .returning();
    return row as Payroll;
  });
}

/**
 * WL-05's `certifyPayroll` action: write the certifying official onto the
 * draft, run the twelve blocking rules against what is actually stored, and
 * certify only if none fires. Warnings never block — that is a liability
 * decision, argued in `payroll-math.ts`'s header and in WL-05 W1.
 */
export async function certifyPayrollChecked(
  db: Db,
  input: {
    payrollId: string;
    certifiedByUserId?: string;
    officialName: string;
    officialTitle: string;
    officialPhone: string;
    officialEmail: string;
    remarks?: string;
    isFinal?: boolean;
  },
): Promise<{ payroll: Payroll; validation: ValidationResult; alreadyCertified: boolean }> {
  const [existing] = await db.select().from(payrolls).where(eq(payrolls.id, input.payrollId)).limit(1);
  if (!existing) throw new Error(`certifyPayroll: payroll ${input.payrollId} does not exist`);
  if (existing.status === 'certified') {
    return {
      payroll: existing as Payroll,
      validation: { errors: [], warnings: [] },
      alreadyCertified: true,
    };
  }

  await db
    .update(payrolls)
    .set({
      certifyingOfficialName: input.officialName,
      certifyingOfficialTitle: input.officialTitle,
      certifyingOfficialPhone: input.officialPhone,
      certifyingOfficialEmail: input.officialEmail,
      additionalRemarks: input.remarks ?? existing.additionalRemarks,
      isFinal: input.isFinal ?? existing.isFinal,
      updatedAt: new Date(),
    })
    .where(eq(payrolls.id, input.payrollId));

  const validation = await validatePayrollById(db, input.payrollId);
  if (validation.errors.length > 0) throw new PayrollValidationError(validation);

  const payroll = await certifyPayroll(db, {
    payrollId: input.payrollId,
    ...(input.certifiedByUserId ? { certifiedByUserId: input.certifiedByUserId } : {}),
  });
  return { payroll, validation, alreadyCertified: false };
}

/**
 * A certified payroll is never edited in place. Reopening creates a NEW payroll
 * that supersedes it; both are retained and both stay downloadable, because the
 * original was already filed with the agency.
 */
export async function reopenPayroll(
  db: Db,
  input: { payrollId: string; reason: string; createdByUserId?: string },
): Promise<{ original: Payroll; replacement: Payroll }> {
  return withTx(db, async (tx) => {
    const [original] = await tx.select().from(payrolls).where(eq(payrolls.id, input.payrollId)).limit(1);
    if (!original) throw new Error(`reopenPayroll: payroll ${input.payrollId} does not exist`);
    if (original.status !== 'certified') {
      throw new Error('reopenPayroll: only a certified payroll can be superseded');
    }

    const [replacementRow] = await tx
      .insert(payrolls)
      .values({
        id: newId('pay'),
        projectId: original.projectId,
        filerOrganisationId: original.filerOrganisationId,
        weekEndingDate: original.weekEndingDate,
        noWorkPerformed: original.noWorkPerformed,
        // The pin travels with the correction: it is the same week's work.
        wdNumber: original.wdNumber,
        wdModificationNumber: original.wdModificationNumber,
        certifyingOfficialName: original.certifyingOfficialName,
        certifyingOfficialTitle: original.certifyingOfficialTitle,
        certifyingOfficialPhone: original.certifyingOfficialPhone,
        certifyingOfficialEmail: original.certifyingOfficialEmail,
        additionalRemarks: `Corrects payroll #${original.payrollNumber}. ${input.reason}`.trim(),
      })
      .returning();
    const replacement = replacementRow as Payroll;

    const lines = await tx
      .select()
      .from(payrollLines)
      .where(eq(payrollLines.payrollId, original.id))
      .orderBy(payrollLines.sortOrder);
    for (const line of lines) {
      const [copy] = await tx
        .insert(payrollLines)
        .values({ ...line, id: newId('pln'), payrollId: replacement.id })
        .returning();
      const credits = await tx
        .select()
        .from(payrollLineFringeCredits)
        .where(eq(payrollLineFringeCredits.payrollLineId, line.id));
      for (const credit of credits) {
        await tx
          .insert(payrollLineFringeCredits)
          .values({ ...credit, id: newId('flc'), payrollLineId: (copy as PayrollLine).id });
      }
    }

    const [updated] = await tx
      .update(payrolls)
      .set({ status: 'superseded', supersededByPayrollId: replacement.id, updatedAt: new Date() })
      .where(eq(payrolls.id, original.id))
      .returning();
    return { original: updated as Payroll, replacement };
  });
}

// ---------------------------------------------------------------------------
// WL-07 · history, gaps and the submission status
// ---------------------------------------------------------------------------

export type PayrollSummary = Payroll & {
  workerCount: number;
  totalHoursSt: string;
  totalHoursOt: string;
  grossProject: string;
  supersededByNumber: number | null;
};

export async function listPayrolls(
  db: Db,
  filter: { projectId?: string; orgId?: string; from?: string; to?: string },
): Promise<PayrollSummary[]> {
  const conditions = [];
  if (filter.projectId) conditions.push(eq(payrolls.projectId, filter.projectId));
  if (filter.orgId) conditions.push(eq(payrolls.filerOrganisationId, filter.orgId));
  if (filter.from) conditions.push(sql`${payrolls.weekEndingDate} >= ${filter.from}`);
  if (filter.to) conditions.push(sql`${payrolls.weekEndingDate} <= ${filter.to}`);

  const rows = await db
    .select()
    .from(payrolls)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(payrolls.weekEndingDate), desc(payrolls.createdAt));

  const ids = rows.map((row) => row.id);
  const totals = new Map<string, { workers: Set<string>; st: number; ot: number; gross: number }>();
  if (ids.length > 0) {
    for (const line of await db.select().from(payrollLines).where(inArray(payrollLines.payrollId, ids))) {
      const entry = totals.get(line.payrollId) ?? { workers: new Set<string>(), st: 0, ot: 0, gross: 0 };
      entry.workers.add(line.workerId);
      entry.st += cents(line.totalHoursSt);
      entry.ot += cents(line.totalHoursOt);
      entry.gross += cents(line.grossProject);
      totals.set(line.payrollId, entry);
    }
  }
  const numberById = new Map(rows.map((row) => [row.id, row.payrollNumber]));

  return rows.map((row) => {
    const entry = totals.get(row.id);
    return {
      ...(row as Payroll),
      workerCount: entry?.workers.size ?? 0,
      totalHoursSt: fromCents(entry?.st ?? 0),
      totalHoursOt: fromCents(entry?.ot ?? 0),
      grossProject: fromCents(entry?.gross ?? 0),
      supersededByNumber: row.supersededByPayrollId
        ? (numberById.get(row.supersededByPayrollId) ?? null)
        : null,
    };
  });
}

/** The week-ending dates with no non-superseded payroll — missing WEEKS, never
 *  missing numbers, because a draft holds no number (M4). */
export async function detectPayrollGaps(
  db: Db,
  projectId: string,
  today = new Date(),
): Promise<string[]> {
  return missingWeeksFor(db, projectId, today);
}

async function missingWeeksFor(db: Db, projectId: string, today: Date): Promise<string[]> {
  const rows = await db
    .select({ weekEndingDate: payrolls.weekEndingDate })
    .from(payrolls)
    .where(and(eq(payrolls.projectId, projectId), ne(payrolls.status, 'superseded')));
  if (rows.length === 0) return [];
  const weekEndsOn = new Date(`${rows[0]?.weekEndingDate as string}T00:00:00Z`).getUTCDay();
  return detectMissingWeeks(
    rows.map((row) => row.weekEndingDate),
    today,
    weekEndsOn,
  );
}

export class SubmissionNoteRequiredError extends Error {
  constructor() {
    super('A rejection needs the reason the prime gave. A rejection with no reason is not a record.');
    this.name = 'SubmissionNoteRequiredError';
  }
}

/**
 * **The user sets this; we integrate with nobody** (M8 rule 1). There is no
 * portal integration, no webhook, no email parsing and no inference from a
 * share-link access: a status we guessed would be worse than no status.
 *
 * It is metadata, never the record. It touches no `payroll_lines` row and no
 * `documents` row, which `tests/payroll-history.test.ts` proves by hashing
 * before and after.
 */
export async function setSubmissionStatus(
  db: Db,
  input: {
    payrollId: string;
    status: 'not_sent' | 'sent' | 'accepted' | 'rejected';
    recipient?: string;
    note?: string;
  },
): Promise<Payroll> {
  if (input.status === 'rejected' && !(input.note ?? '').trim()) {
    throw new SubmissionNoteRequiredError();
  }
  const [row] = await db
    .update(payrolls)
    .set({
      submissionStatus: input.status,
      submittedAt: input.status === 'sent' ? new Date() : undefined,
      submissionRecipient: input.recipient ?? undefined,
      submissionStatusNote: input.note ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(payrolls.id, input.payrollId))
    .returning();
  return row as Payroll;
}

// ---------------------------------------------------------------------------
// Reads the screens need
// ---------------------------------------------------------------------------

export async function getPayroll(db: Db, payrollId: string): Promise<Payroll | undefined> {
  const [row] = await db.select().from(payrolls).where(eq(payrolls.id, payrollId)).limit(1);
  return row as Payroll | undefined;
}

/** The org's settings row, or the defaults the form needs when it is absent. */
export async function filerSettings(
  db: Db,
  orgId: string,
): Promise<{
  businessAddress: string;
  workweekStartDay: number;
  defaultDailyHours: string;
  official: { name: string; title: string; phone: string; email: string };
}> {
  const [row] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.orgId, orgId))
    .limit(1);
  const address = [
    row?.businessAddressLine1,
    row?.businessAddressLine2,
    [row?.businessCity, row?.businessStateCode].filter(Boolean).join(', '),
    row?.businessPostalCode,
  ]
    .filter((part) => Boolean(part && String(part).trim()))
    .join(', ');
  return {
    businessAddress: address,
    workweekStartDay: row?.workweekStartDay ?? 0,
    defaultDailyHours: row?.defaultDailyHours ?? '8.00',
    official: {
      name: row?.defaultCertifyingName ?? '',
      title: row?.defaultCertifyingTitle ?? '',
      phone: row?.defaultCertifyingPhone ?? '',
      email: row?.defaultCertifyingEmail ?? '',
    },
  };
}

export async function apprenticeshipRowsFor(
  db: Db,
  payrollId: string,
): Promise<Array<{ programName: string; registrar: 'OA' | 'SAA'; registeredClassification: string }>> {
  const rows = await db
    .select({
      programName: apprenticeshipPrograms.programName,
      registrar: apprenticeshipPrograms.registrar,
      registeredClassification: workers.registeredClassification,
      classificationLabel: payrollLines.classificationLabel,
    })
    .from(payrollLines)
    .innerJoin(workers, eq(workers.id, payrollLines.workerId))
    .innerJoin(apprenticeshipPrograms, eq(apprenticeshipPrograms.id, workers.apprenticeshipProgramId))
    .where(and(eq(payrollLines.payrollId, payrollId), eq(payrollLines.workerStatus, 'RA')));

  const seen = new Map<string, { programName: string; registrar: 'OA' | 'SAA'; registeredClassification: string }>();
  for (const row of rows) {
    const key = `${row.programName}|${row.registeredClassification ?? row.classificationLabel}`;
    if (!seen.has(key)) {
      seen.set(key, {
        programName: row.programName,
        registrar: row.registrar === 'SAA' ? 'SAA' : 'OA',
        registeredClassification: row.registeredClassification ?? row.classificationLabel,
      });
    }
  }
  return [...seen.values()];
}
