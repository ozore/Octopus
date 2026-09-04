/**
 * M3 — the technician roster and the import runner. `specs/03`.
 *
 * `runImport` is a per-row transaction on purpose: a partial failure leaves the
 * valid rows written, because a customer who dropped a 47-row spreadsheet and
 * got "0 imported, one row was bad" goes back to the spreadsheet and does not
 * come back. `created + updated + skipped === rowCount` is a property test.
 */

import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { and, eq, isNotNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord } from '../kb/accessors';
import type { Trade } from '../kb/types';
import { imports, technicians } from '../schema';
import { recordAudit } from './audit';
import { createLicence } from './licences';
import {
  errorsCsv,
  findHeaderRow,
  guessMapping,
  parseCsv,
  parseRosterRows,
  sniffDateFormat,
  type DateFormat,
  type ImportField,
  type ParsedRosterRow,
} from '../import/csv';

export type ImportPreview = {
  headers: string[];
  mapping: Record<string, ImportField | null>;
  sample: ParsedRosterRow[];
  rowCount: number;
  suggestedDateFormat: DateFormat;
  /** A real row from THEIR file, shown beside the date-format radio. */
  dateFormatEvidence: string | null;
  willCreateTechnicians: number;
  willCreateLicences: number;
};

/**
 * Step 2 of the wizard. Pure apart from reading the text: the preview shows the
 * exact number of technicians and licences that will be created BEFORE anything
 * is written (`specs/03` AC6).
 */
export function previewImport(text: string, format?: DateFormat): ImportPreview {
  const rows = parseCsv(text);
  const headerIndex = findHeaderRow(rows);
  const headers = (rows[headerIndex] ?? []).map((h) => h.trim());
  const body = rows.slice(headerIndex + 1);
  const mapping = guessMapping(headers);

  const dateColumn = headers.findIndex((h) => mapping[h] === 'expiry_date' || mapping[h] === 'issued_date');
  const dateValues = dateColumn >= 0 ? body.map((r) => r[dateColumn] ?? '') : [];
  const sniffed = sniffDateFormat(dateValues);
  const chosen = format ?? sniffed.format;

  const parsed = parseRosterRows(body, mapping, headers, chosen);
  const names = new Set(parsed.filter((r) => !r.skipReason).map((r) => rosterKey(r)));

  return {
    headers,
    mapping,
    sample: parsed.slice(0, 10),
    rowCount: body.length,
    suggestedDateFormat: sniffed.format,
    dateFormatEvidence: sniffed.evidence,
    willCreateTechnicians: names.size,
    willCreateLicences: parsed.filter((r) => !r.skipReason && r.state && r.trade).length,
  };
}

function rosterKey(row: ParsedRosterRow): string {
  return row.employeeRef
    ? `ref:${row.employeeRef.toLowerCase()}`
    : `name:${row.firstName.toLowerCase()}|${row.lastName.toLowerCase()}|${row.state ?? ''}`;
}

export type ImportSummary = {
  importId: string;
  rowCount: number;
  created: number;
  updated: number;
  skipped: number;
  licencesCreated: number;
  errorsCsv: string;
};

export async function runImport(
  db: Db,
  input: {
    orgId: string;
    userId?: string | null;
    filename: string;
    text: string;
    format: DateFormat;
    dryRun?: boolean;
  },
  options: { today: string },
): Promise<ImportSummary> {
  const rows = parseCsv(input.text);
  const headerIndex = findHeaderRow(rows);
  const headers = (rows[headerIndex] ?? []).map((h) => h.trim());
  const body = rows.slice(headerIndex + 1);
  const mapping = guessMapping(headers);
  const parsed = parseRosterRows(body, mapping, headers, input.format);

  const importId = newId('imp');
  if (!input.dryRun) {
    await db.insert(imports).values({
      id: importId,
      orgId: input.orgId,
      userId: input.userId ?? null,
      filename: input.filename,
      rowCount: body.length,
      mapping: mapping as never,
      dateFormat: input.format,
      status: 'running',
    });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let licencesCreated = 0;

  const existing = await db.select().from(technicians).where(eq(technicians.orgId, input.orgId));
  const byKey = new Map(
    existing.map((t) => [
      t.employeeRef
        ? `ref:${t.employeeRef.toLowerCase()}`
        : `name:${(t.firstName ?? '').toLowerCase()}|${t.lastName.toLowerCase()}|${t.primaryState ?? ''}`,
      t,
    ]),
  );

  for (const row of parsed) {
    if (row.skipReason) {
      skipped += 1;
      continue;
    }
    const key = rosterKey(row);
    const found = byKey.get(key);
    let technicianId = found?.id;

    if (input.dryRun) {
      if (found) updated += 1;
      else created += 1;
      if (row.state && row.trade) licencesCreated += 1;
      continue;
    }

    if (found) {
      await db
        .update(technicians)
        .set({
          firstName: row.firstName || found.firstName,
          primaryState: row.state ?? found.primaryState,
          primaryTrade: row.trade ?? found.primaryTrade,
          email: row.email ?? found.email,
          updatedAt: new Date(),
        })
        .where(eq(technicians.id, found.id));
      updated += 1;
    } else {
      technicianId = newId('tec');
      await db.insert(technicians).values({
        id: technicianId,
        orgId: input.orgId,
        firstName: row.firstName,
        lastName: row.lastName,
        employeeRef: row.employeeRef,
        email: row.email,
        primaryState: row.state,
        primaryTrade: row.trade,
        externalRowHash: key,
      });
      byKey.set(key, {
        id: technicianId,
        firstName: row.firstName,
        lastName: row.lastName,
        employeeRef: row.employeeRef,
        primaryState: row.state,
      } as never);
      created += 1;
    }

    // One CSV row can create a technician AND a licence, because that is how
    // the customer's spreadsheet is shaped (`specs/03` §Server actions).
    if (technicianId && row.state && row.trade) {
      const record = getKbRecord(row.state, row.trade);
      const kbLicenceTypeId =
        record && row.licenceType
          ? (record.licence_types.find(
              (lt) => lt.name.toLowerCase() === row.licenceType!.toLowerCase(),
            )?.licence_type_id ?? null)
          : null;
      await createLicence(
        db,
        {
          orgId: input.orgId,
          holderKind: 'technician',
          technicianId,
          state: row.state,
          trade: row.trade as Trade,
          kbLicenceTypeId,
          customTypeName: kbLicenceTypeId ? null : row.licenceType,
          licenceNumber: row.licenceNumber,
          issuedOn: row.issuedOn,
          expiresOn: row.expiresOn,
          actorUserId: input.userId ?? null,
        },
        options,
      );
      licencesCreated += 1;
    }
  }

  const csv = errorsCsv(parsed);
  if (!input.dryRun) {
    await db
      .update(imports)
      .set({ created, updated, skipped, errorsCsv: csv || null, status: 'done' })
      .where(eq(imports.id, importId));
    await track(db, {
      name: 'import_completed',
      orgId: input.orgId,
      ...(input.userId ? { userId: input.userId } : {}),
      props: { created, updated, skipped, rows: body.length },
    });
    await recordAudit(db, {
      orgId: input.orgId,
      actorUserId: input.userId ?? null,
      action: 'roster_imported',
      entityTable: 'imports',
      entityId: importId,
      after: { created, updated, skipped, filename: input.filename },
    });
  }

  return { importId, rowCount: body.length, created, updated, skipped, licencesCreated, errorsCsv: csv };
}

export async function listTechnicians(db: Db, orgId: string) {
  return db
    .select()
    .from(technicians)
    .where(and(eq(technicians.orgId, orgId), eq(technicians.status, 'active')));
}

export async function createTechnician(
  db: Db,
  input: {
    orgId: string;
    firstName: string;
    lastName: string;
    employeeRef?: string | null;
    email?: string | null;
    primaryState?: string | null;
    primaryTrade?: string | null;
    actorUserId?: string | null;
  },
) {
  if (!input.lastName.trim()) throw new Error('A technician needs at least a last name.');
  const id = newId('tec');
  await db.insert(technicians).values({
    id,
    orgId: input.orgId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    employeeRef: input.employeeRef ?? null,
    email: input.email ?? null,
    primaryState: input.primaryState ?? null,
    primaryTrade: input.primaryTrade ?? null,
  });
  await track(db, { name: 'technician_created_manually', orgId: input.orgId });
  return id;
}

/** Status `left` keeps the history and stops the alerts. Deleting them would
 *  break the audit trail we sell (`specs/03` §Edge cases). */
export async function archiveTechnician(db: Db, input: { orgId: string; technicianId: string }) {
  await db
    .update(technicians)
    .set({ status: 'left', updatedAt: new Date() })
    .where(and(eq(technicians.orgId, input.orgId), eq(technicians.id, input.technicianId)));
}

export async function technicianCount(db: Db, orgId: string): Promise<number> {
  const rows = await db
    .select({ id: technicians.id })
    .from(technicians)
    .where(and(eq(technicians.orgId, orgId), eq(technicians.status, 'active')));
  return rows.length;
}

export async function technicianEmails(db: Db, orgId: string) {
  return db
    .select({ id: technicians.id, email: technicians.email })
    .from(technicians)
    .where(and(eq(technicians.orgId, orgId), isNotNull(technicians.email)));
}
