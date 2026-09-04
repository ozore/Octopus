/**
 * Payrolls and their lines (WL-05, WL-07).
 *
 * TWO PROPERTIES, BOTH OF THEM ABOUT A SIGNED FEDERAL STATEMENT:
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
 */

import { and, desc, eq, sql } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { withTx, type Db } from '@octopus/platform/db';

import { payrollLines, payrolls, projects, type Payroll, type PayrollLine } from '../schema';

export async function createPayroll(
  db: Db,
  input: {
    projectId: string;
    filerOrganisationId: string;
    weekEndingDate: string;
    noWorkPerformed?: boolean;
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
  return row as Payroll;
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

/**
 * Certification: allocate the number and flip the status IN ONE TRANSACTION.
 *
 * The lock is a **transaction-scoped advisory lock** on the
 * `(project, filer)` pair, and not `SELECT max(...) FOR UPDATE`, for two
 * reasons. The first is that Postgres refuses row locking on an aggregate
 * (`FOR UPDATE is not allowed with aggregate functions`) — the obvious spelling
 * simply does not run. The second is the one that matters: the first
 * certification on a project has NO ROW TO LOCK, so a row lock cannot serialise
 * it at all. An advisory lock keyed on the sequence itself covers the empty
 * case as well as the full one, and the unique index on
 * `(project, filer, payroll_number)` settles anything the lock does not.
 */
export async function certifyPayroll(
  db: Db,
  input: {
    payrollId: string;
    certifiedByUserId?: string;
    certifyingOfficialName?: string;
    certifyingOfficialTitle?: string;
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
        certifyingOfficialName: input.certifyingOfficialName ?? null,
        certifyingOfficialTitle: input.certifyingOfficialTitle ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payrolls.id, input.payrollId))
      .returning();
    return row as Payroll;
  });
}

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

export async function listPayrolls(db: Db, projectId: string): Promise<Payroll[]> {
  return db
    .select()
    .from(payrolls)
    .where(eq(payrolls.projectId, projectId))
    .orderBy(desc(payrolls.weekEndingDate));
}

export async function payrollLinesOf(db: Db, payrollId: string): Promise<PayrollLine[]> {
  return db
    .select()
    .from(payrollLines)
    .where(eq(payrollLines.payrollId, payrollId))
    .orderBy(payrollLines.sortOrder);
}
