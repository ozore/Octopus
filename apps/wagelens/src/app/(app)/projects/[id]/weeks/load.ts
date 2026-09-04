/**
 * The read every payroll screen starts with: the payroll, its project, its
 * lines, and the PROVENANCE OF THE MODIFICATION IT IS PINNED TO.
 *
 * The provenance is built from `payrolls.wd_number` / `wd_modification_number`
 * — the pin frozen at creation — and never from the project's current pin. That
 * is gate G9 at the read: a modification accepted on Thursday must not change
 * what Wednesday's draft says it was computed from.
 */

import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';
import { corpusHealth, getModificationHistory } from '@/lib/kb';
import type { Provenance } from '@/components/provenance';
import {
  fringeCreditsOf,
  payrollLinesOf,
  validatePayrollById,
  type PayrollSummary,
} from '@/lib/repositories/payrolls';
import { payrolls, projects, type Payroll, type PayrollLine, type Project } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

export type LoadedPayroll = {
  db: Awaited<ReturnType<typeof getDb>>;
  org: { id: string; name: string };
  userId: string;
  payroll: Payroll;
  project: Project;
  lines: PayrollLine[];
  credits: Awaited<ReturnType<typeof fringeCreditsOf>>;
  provenance: Provenance;
  validation: Awaited<ReturnType<typeof validatePayrollById>>;
};

export async function loadPayroll(payrollId: string): Promise<LoadedPayroll> {
  const { org, user } = await requireOrg();
  const db = await getDb();

  const [row] = await db
    .select({ payroll: payrolls, project: projects })
    .from(payrolls)
    .innerJoin(projects, eq(projects.id, payrolls.projectId))
    .where(and(eq(payrolls.id, payrollId), eq(projects.orgId, org.id)))
    .limit(1);
  if (!row) notFound();

  const [lines, credits, history, health, validation] = await Promise.all([
    payrollLinesOf(db, payrollId),
    fringeCreditsOf(db, payrollId),
    getModificationHistory(db, row.payroll.wdNumber),
    corpusHealth(db),
    validatePayrollById(db, payrollId),
  ]);

  const pinned = history.find(
    (m) => m.modificationNumber === row.payroll.wdModificationNumber,
  );
  const active = history.find((m) => m.active);

  return {
    db,
    org: { id: org.id, name: org.name },
    userId: user.id,
    payroll: row.payroll as Payroll,
    project: row.project as Project,
    lines,
    credits,
    validation,
    provenance: {
      wdNumber: row.payroll.wdNumber,
      modificationNumber: row.payroll.wdModificationNumber,
      publicationDate: pinned?.publicationDate ?? '',
      stale: health.stale,
      newerModification:
        active && active.modificationNumber !== row.payroll.wdModificationNumber
          ? {
              modificationNumber: active.modificationNumber,
              publicationDate: active.publicationDate,
            }
          : null,
    },
  };
}

/** The pill tone a payroll's status and submission status deserve. */
export function statusTone(payroll: Payroll | PayrollSummary): 'filed' | 'draft' | 'reject' | 'none' {
  if (payroll.status === 'superseded') return 'none';
  if (payroll.status === 'draft') return 'draft';
  if (payroll.submissionStatus === 'rejected') return 'reject';
  return 'filed';
}

export function statusWord(payroll: Payroll | PayrollSummary): string {
  if (payroll.status === 'draft') return 'draft';
  if (payroll.status === 'superseded') return 'superseded';
  if (payroll.noWorkPerformed) return 'certified · no work performed';
  return 'certified';
}
