/**
 * Certified payroll → two PDFs → two `documents` rows (WL-06).
 *
 * **GENERATION IS IDEMPOTENT AND CERTIFICATION IS NEVER ROLLED BACK.** The
 * unique index on `(payroll_id, kind, generator_version)` is what makes a
 * re-run a no-op: the same certified payroll rendered twice produces the same
 * bytes (V5), so the second run finds the row and returns it. If a render or a
 * storage write fails, the payroll stays certified and the documents screen
 * says "still generating — we're retrying"; a certified payroll with no PDF is
 * recoverable, a wrong PDF is not.
 *
 * **WHY THIS IS CALLED INLINE AND NOT AS A QUEUED JOB.** WL-06 specifies a
 * `document.generate` job. Registering a job kind means editing
 * `src/lib/platform.ts`, which BUILD.md §3 freezes and which three other agents
 * are working in at the same time — so generation runs inside the certify
 * action instead, after the certification transaction has committed, and every
 * property the job existed to give is kept another way: the dedupe key becomes
 * the unique index, the retry becomes the `regenerateDocuments` action on the
 * payroll screen, and the "certification is never rolled back" guarantee is
 * structural rather than transactional, because the two writes are already in
 * different transactions. Recorded as a deviation in BUILD.md §6 with the
 * platform request that would undo it.
 */

import { and, eq } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import { getModificationHistory } from '../kb';
import {
  apprenticeshipRowsFor,
  filerSettings,
  fringeCreditsOf,
  payrollLinesOf,
} from '../repositories/payrolls';
import { documents, payrolls, projects, type DocumentRow, type PayrollLine } from '../schema';
import { organisations } from '@octopus/platform/db';
import { documentStorageKey, putBlob, sha256Hex, type BlobKind } from './blobs';
import type { FringeCreditLine, Wh347Model, Wh347Row } from './model';
import { GENERATOR_VERSION } from './statement-of-compliance';
import { renderStatementOfCompliance, renderWh347 } from './wh347';

const ZERO_WEEK = ['0', '0', '0', '0', '0', '0', '0'];

export type GenerationContext = { productName: string; productUrl: string };

/**
 * Everything the form prints, read once. The values come from the payroll and
 * its lines — where they were frozen at creation — and never from the project
 * or the corpus, except the determination's publication date, which is a fact
 * about the modification the payroll is already pinned to.
 */
export async function buildDocumentModel(
  db: Db,
  payrollId: string,
  context: GenerationContext & { draft?: boolean },
): Promise<Wh347Model> {
  const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, payrollId)).limit(1);
  if (!payroll) throw new Error(`buildDocumentModel: payroll ${payrollId} does not exist`);

  const [project] = await db.select().from(projects).where(eq(projects.id, payroll.projectId)).limit(1);
  if (!project) throw new Error(`buildDocumentModel: project ${payroll.projectId} does not exist`);

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, payroll.filerOrganisationId))
    .limit(1);

  const [settings, lines, credits, apprenticeships, history] = await Promise.all([
    filerSettings(db, payroll.filerOrganisationId),
    payrollLinesOf(db, payrollId),
    fringeCreditsOf(db, payrollId),
    apprenticeshipRowsFor(db, payrollId),
    getModificationHistory(db, payroll.wdNumber),
  ]);

  const pinned = history.find((m) => m.modificationNumber === payroll.wdModificationNumber);
  const active = history.find((m) => m.active);
  const newer =
    active && active.modificationNumber !== payroll.wdModificationNumber
      ? { modificationNumber: active.modificationNumber, publicationDate: active.publicationDate }
      : null;

  const creditsByLine = new Map<string, FringeCreditLine[]>();
  for (const credit of credits) {
    const list = creditsByLine.get(credit.payrollLineId) ?? [];
    list.push({
      planName: credit.planName,
      planType: credit.planType,
      planNo: credit.planNo,
      isFunded: credit.isFunded,
      hourlyCredit: credit.hourlyCredit,
    });
    creditsByLine.set(credit.payrollLineId, list);
  }

  return {
    header: {
      isFinal: payroll.isFinal,
      ourRole: project.ourRole === 'prime' ? 'prime' : 'sub',
      projectName: project.name,
      projectOrContractNo: project.projectOrContractNo,
      payrollNumber: payroll.payrollNumber,
      businessName: org?.name ?? '',
      projectLocation: project.locationDescription,
      wageDeterminationNo: payroll.wdNumber,
      weekEndingDate: payroll.weekEndingDate,
      businessAddress: settings.businessAddress,
    },
    provenance: {
      wdNumber: payroll.wdNumber,
      modificationNumber: payroll.wdModificationNumber,
      publicationDate: pinned?.publicationDate ?? '',
      newerModification: newer,
    },
    certifyingOfficial: {
      name: payroll.certifyingOfficialName ?? '',
      title: payroll.certifyingOfficialTitle ?? '',
      phone: payroll.certifyingOfficialPhone ?? '',
      email: payroll.certifyingOfficialEmail ?? '',
    },
    additionalRemarks: payroll.additionalRemarks ?? '',
    apprenticeshipPrograms: apprenticeships,
    // A line with no hours is dropped from the FORM (B3 blocks one at
    // certification anyway); the grid keeps it so next week's copy still has
    // the worker.
    rows: lines
      .filter((line) => Number(line.totalHoursSt) + Number(line.totalHoursOt) > 0)
      .map((line) => toRow(line, creditsByLine.get(line.id) ?? [])),
    noWorkPerformed: payroll.noWorkPerformed,
    // Pinned to `certified_at`, so the bytes are a function of the payroll and
    // not of the moment the render happened to run (V5).
    certifiedAt: payroll.certifiedAt ?? payroll.updatedAt ?? new Date(0),
    draft: context.draft ?? payroll.status !== 'certified',
    productName: context.productName,
    productUrl: context.productUrl,
  };
}

function toRow(line: PayrollLine, fringeCredits: FringeCreditLine[]): Wh347Row {
  return {
    entryNo: line.workerEntryNo,
    lastName: line.lastName,
    firstName: line.firstName,
    middleInitial: line.middleInitial,
    // (1E) — four characters, because `char(4)` is all there is upstream.
    identifyingNoLast4: line.identifyingNoLast4,
    workerStatus: line.workerStatus === 'RA' ? 'RA' : 'J',
    classificationLabel: line.classificationLabel,
    hoursSt: (line.hoursSt as string[] | null) ?? ZERO_WEEK,
    hoursOt: (line.hoursOt as string[] | null) ?? ZERO_WEEK,
    totalHoursSt: line.totalHoursSt,
    totalHoursOt: line.totalHoursOt,
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
    dedTotal: line.dedTotal,
    netPay: line.netPay,
    fringeCredits,
  };
}

/** V1 — a draft can only be PREVIEWED, the preview is always watermarked, and
 *  nothing is written to `documents`. */
export async function previewPayroll(
  db: Db,
  payrollId: string,
  context: GenerationContext,
): Promise<Uint8Array> {
  const model = await buildDocumentModel(db, payrollId, { ...context, draft: true });
  const { bytes } = await renderWh347(model);
  return bytes;
}

export type GenerationResult = {
  documents: DocumentRow[];
  /** False when both rows already existed — a re-run is a no-op (V5). */
  created: boolean;
  workerCount: number;
  pageCount: number;
};

/**
 * Render, hash, store, record. Requires `status = 'certified'` (V1).
 */
export async function generateDocuments(
  db: Db,
  payrollId: string,
  context: GenerationContext,
): Promise<GenerationResult> {
  const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, payrollId)).limit(1);
  if (!payroll) throw new Error(`generateDocuments: payroll ${payrollId} does not exist`);
  if (payroll.status === 'draft') {
    throw new Error('generateDocuments: a draft payroll can only be previewed, never generated');
  }

  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.payrollId, payrollId), eq(documents.generatorVersion, GENERATOR_VERSION)));

  const model = await buildDocumentModel(db, payrollId, { ...context, draft: false });
  const wh347 = await renderWh347(model);
  const soc = await renderStatementOfCompliance(model);

  if (existing.length === 2) {
    return {
      documents: existing as DocumentRow[],
      created: false,
      workerCount: model.rows.length,
      pageCount: wh347.pageCount,
    };
  }

  const written: DocumentRow[] = [];
  for (const [kind, render] of [
    ['wh347', wh347],
    ['statement_of_compliance', soc],
  ] as Array<[BlobKind, typeof wh347]>) {
    const already = existing.find((row) => row.kind === kind);
    if (already) {
      written.push(already as DocumentRow);
      continue;
    }
    const storageKey = documentStorageKey(payrollId, kind, GENERATOR_VERSION);
    const stored = await putBlob(db, { storageKey, bytes: render.bytes });
    const [row] = await db
      .insert(documents)
      .values({
        id: newId('doc'),
        payrollId,
        kind,
        storageKey,
        byteSize: stored.byteSize,
        sha256: sha256Hex(render.bytes),
        pageCount: render.pageCount,
        wdNumber: model.provenance.wdNumber,
        wdModificationNumber: model.provenance.modificationNumber,
        wdPublicationDate: model.provenance.publicationDate || model.header.weekEndingDate,
        generatorVersion: GENERATOR_VERSION,
        generatedAt: model.certifiedAt,
      })
      .onConflictDoNothing({
        target: [documents.payrollId, documents.kind, documents.generatorVersion],
      })
      .returning();
    if (row) written.push(row as DocumentRow);
  }

  const all = await db.select().from(documents).where(eq(documents.payrollId, payrollId));
  return {
    documents: all as DocumentRow[],
    created: written.length > 0,
    workerCount: model.rows.length,
    pageCount: wh347.pageCount,
  };
}
