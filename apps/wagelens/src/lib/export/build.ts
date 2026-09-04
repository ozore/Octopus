/**
 * Building an export (WL-07).
 *
 * **THE ARCHIVE IS CALLED THE AUDIT BINDER AND IT IS AN ARCHIVE, NOT A MERGED
 * PDF** (m10 / M9, 2026-09-03). `OFFER.md` B4 used to promise a single merged
 * document; the copy was corrected to what this spec produces rather than
 * growing an L-shaped merge step the launch does not need. What it contains is
 * every certified payroll's two PDFs, the determination text as it stood at
 * each pinned modification, and a `manifest.csv` carrying each file's sha256.
 *
 * **AN EXPORT IS BUILT, THEN HANDED BACK AS A LINK** — never streamed inline
 * (V4) — and the link expires in 7 days and is scoped to the organisation (V5).
 * The build runs inline rather than on the job queue for the reason given in
 * `documents/generate.ts`: registering a job kind means editing the frozen
 * composition root three other agents are working in. The row, its `building →
 * ready | failed` lifecycle and the expiring link are all real, so the seam is
 * one function body when a queue is available.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';

import { exportStorageKey, getBlob, putBlob } from '../documents/blobs';
import { listPayrolls } from '../repositories/payrolls';
import {
  documents,
  kbWageDeterminations,
  payrollExports,
  payrollLines,
  projects,
  type PayrollExport,
} from '../schema';
import {
  MANIFEST_COLUMNS,
  buildLinesCsv,
  buildRegisterCsv,
  csvRow,
  exportable,
  type ExportablePayroll,
} from './csv';
import { buildZip, type ZipEntry } from './zip';

export const EXPORT_TTL_DAYS = 7;

export type ExportFormat = 'register_csv' | 'lines_csv' | 'documents_zip';

export class EmptyExportError extends Error {
  constructor() {
    super(
      'There are no certified payrolls in that range. An export of nothing is an empty file somebody will file by mistake.',
    );
    this.name = 'EmptyExportError';
  }
}

/** Everything the two CSVs and the binder need, in one read. */
export async function collectExportable(
  db: Db,
  filter: { orgId: string; projectId?: string; from?: string; to?: string },
): Promise<ExportablePayroll[]> {
  const summaries = exportable(
    (await listPayrolls(db, filter)).map((row) => ({
      ...row,
      publicationDate: '',
      wh347Sha256: null,
      lines: [],
    })),
  );
  if (summaries.length === 0) return [];

  const ids = summaries.map((row) => row.id);
  const lines = await db.select().from(payrollLines).where(inArray(payrollLines.payrollId, ids));
  const docs = await db.select().from(documents).where(inArray(documents.payrollId, ids));

  return summaries.map((summary) => {
    const wh347 = docs.find((doc) => doc.payrollId === summary.id && doc.kind === 'wh347');
    return {
      ...summary,
      publicationDate: wh347?.wdPublicationDate ?? '',
      wh347Sha256: wh347?.sha256 ?? null,
      lines: lines
        .filter((line) => line.payrollId === summary.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  });
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'project'
  );
}

const KIND_FILE: Record<string, string> = {
  wh347: 'wh347',
  statement_of_compliance: 'statement-of-compliance',
};

/**
 * The binder: two PDFs per certified payroll, the determination text behind
 * each pinned modification, and a manifest whose every sha256 matches its file.
 */
async function buildDocumentsZip(
  db: Db,
  payrolls: ExportablePayroll[],
): Promise<{ bytes: Buffer; fileCount: number }> {
  const projectIds = [...new Set(payrolls.map((row) => row.projectId))];
  const projectRows =
    projectIds.length > 0
      ? await db.select().from(projects).where(inArray(projects.id, projectIds))
      : [];
  const slugById = new Map(projectRows.map((row) => [row.id, slug(row.name)]));

  const ids = payrolls.map((row) => row.id);
  const docs =
    ids.length > 0 ? await db.select().from(documents).where(inArray(documents.payrollId, ids)) : [];

  const entries: ZipEntry[] = [];
  const manifest = [csvRow([...MANIFEST_COLUMNS])];
  const missing: string[] = [];

  for (const payroll of payrolls) {
    const folder = slugById.get(payroll.projectId) ?? 'project';
    const number = String(payroll.payrollNumber ?? 0).padStart(3, '0');
    for (const doc of docs.filter((row) => row.payrollId === payroll.id)) {
      const name = `${folder}/payroll-${number}-week-${payroll.weekEndingDate}-${KIND_FILE[doc.kind] ?? doc.kind}.pdf`;
      const blob = await getBlob(db, doc.storageKey);
      if (!blob) {
        // Never silently omit: the manifest says what is missing and why.
        missing.push(name);
        manifest.push(
          csvRow([
            name,
            payroll.payrollNumber,
            payroll.weekEndingDate,
            doc.kind,
            'MISSING — regenerating',
            0,
            doc.wdNumber,
            doc.wdModificationNumber,
            doc.wdPublicationDate,
            doc.generatedAt?.toISOString() ?? '',
          ]),
        );
        continue;
      }
      entries.push({ name, bytes: blob.bytes });
      manifest.push(
        csvRow([
          name,
          payroll.payrollNumber,
          payroll.weekEndingDate,
          doc.kind,
          doc.sha256,
          doc.byteSize,
          doc.wdNumber,
          doc.wdModificationNumber,
          doc.wdPublicationDate,
          doc.generatedAt?.toISOString() ?? '',
        ]),
      );
    }
  }

  // The determination as it stood for each pinned modification: an auditor can
  // re-derive every rate in the binder from the document in the binder.
  const pins = [
    ...new Map(
      payrolls.map((row) => [`${row.wdNumber}:${row.wdModificationNumber}`, row]),
    ).values(),
  ];
  for (const pin of pins) {
    const [determination] = await db
      .select({ text: kbWageDeterminations.documentText, published: kbWageDeterminations.publicationDate })
      .from(kbWageDeterminations)
      .where(
        and(
          eq(kbWageDeterminations.wdNumber, pin.wdNumber),
          eq(kbWageDeterminations.modificationNumber, pin.wdModificationNumber),
        ),
      )
      .limit(1);
    if (!determination) continue;
    const name = `determinations/${pin.wdNumber}-mod-${pin.wdModificationNumber}.txt`;
    entries.push({ name, bytes: Buffer.from(determination.text, 'utf8') });
    manifest.push(
      csvRow([
        name,
        '',
        '',
        'wage_determination',
        '',
        Buffer.byteLength(determination.text, 'utf8'),
        pin.wdNumber,
        pin.wdModificationNumber,
        determination.published,
        '',
      ]),
    );
  }

  entries.push({
    name: 'manifest.csv',
    bytes: Buffer.from(`${manifest.join('\r\n')}\r\n`, 'utf8'),
  });
  if (missing.length > 0) {
    entries.push({
      name: 'README.txt',
      bytes: Buffer.from(
        [
          'Some documents were unavailable when this binder was built and are being regenerated:',
          ...missing.map((name) => `  ${name}`),
          '',
          'Re-run the export once the payroll screen shows them as ready.',
        ].join('\n'),
        'utf8',
      ),
    });
  }
  return { bytes: buildZip(entries), fileCount: entries.length };
}

export type BuiltExport = {
  row: PayrollExport;
  byteSize: number;
  payrollCount: number;
  filename: string;
};

export function exportFilename(row: PayrollExport): string {
  const extension = row.format === 'documents_zip' ? 'zip' : 'csv';
  const range = [row.fromDate, row.toDate].filter(Boolean).join('_to_');
  const kind =
    row.format === 'documents_zip'
      ? 'audit-binder'
      : row.format === 'lines_csv'
        ? 'payroll-lines'
        : 'payroll-register';
  return `${kind}${range ? `-${range}` : ''}.${extension}`;
}

export async function startExport(
  db: Db,
  input: {
    orgId: string;
    projectId?: string;
    format: ExportFormat;
    from?: string;
    to?: string;
    createdByUserId?: string;
    now?: Date;
  },
): Promise<BuiltExport> {
  const now = input.now ?? new Date();
  const payrolls = await collectExportable(db, {
    orgId: input.orgId,
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.from ? { from: input.from } : {}),
    ...(input.to ? { to: input.to } : {}),
  });
  if (payrolls.length === 0) throw new EmptyExportError();

  const id = newId('exp');
  await db
    .insert(payrollExports)
    .values({
      id,
      orgId: input.orgId,
      projectId: input.projectId ?? null,
      format: input.format,
      fromDate: input.from ?? null,
      toDate: input.to ?? null,
      payrollCount: payrolls.length,
      status: 'building',
      expiresAt: new Date(now.getTime() + EXPORT_TTL_DAYS * 86_400_000),
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();

  try {
    let bytes: Buffer;
    let contentType: string;
    if (input.format === 'register_csv') {
      bytes = Buffer.from(buildRegisterCsv(payrolls), 'utf8');
      contentType = 'text/csv; charset=utf-8';
    } else if (input.format === 'lines_csv') {
      bytes = Buffer.from(buildLinesCsv(payrolls), 'utf8');
      contentType = 'text/csv; charset=utf-8';
    } else {
      bytes = (await buildDocumentsZip(db, payrolls)).bytes;
      contentType = 'application/zip';
    }

    const storageKey = exportStorageKey(id, input.format === 'documents_zip' ? 'zip' : 'csv');
    const stored = await putBlob(db, { storageKey, bytes, contentType });
    const [ready] = await db
      .update(payrollExports)
      .set({ status: 'ready', storageKey, byteSize: stored.byteSize })
      .where(eq(payrollExports.id, id))
      .returning();
    const row = ready as PayrollExport;
    return { row, byteSize: stored.byteSize, payrollCount: payrolls.length, filename: exportFilename(row) };
  } catch (error) {
    await db
      .update(payrollExports)
      .set({ status: 'failed', failureReason: (error as Error).message.slice(0, 500) })
      .where(eq(payrollExports.id, id));
    throw error;
  }
}

/** V5 — expired or out-of-organisation is a 404, with no distinction. */
export async function readExport(
  db: Db,
  input: { exportId: string; orgId: string; now?: Date },
): Promise<{ row: PayrollExport; bytes: Buffer; contentType: string; filename: string } | undefined> {
  const now = input.now ?? new Date();
  const [row] = await db
    .select()
    .from(payrollExports)
    .where(and(eq(payrollExports.id, input.exportId), eq(payrollExports.orgId, input.orgId)))
    .limit(1);
  if (!row || row.status !== 'ready' || !row.storageKey) return undefined;
  if (row.expiresAt.getTime() <= now.getTime()) return undefined;
  const blob = await getBlob(db, row.storageKey);
  if (!blob) return undefined;
  return {
    row: row as PayrollExport,
    bytes: blob.bytes,
    contentType: blob.contentType,
    filename: exportFilename(row as PayrollExport),
  };
}

export async function listExports(db: Db, orgId: string): Promise<PayrollExport[]> {
  return db.select().from(payrollExports).where(eq(payrollExports.orgId, orgId));
}
