/**
 * The data export — `specs/10` §Server actions, AC3.
 *
 * *"As a compliance buyer, 'can I export it?' is a question I ask before I enter
 * anything."* Export is therefore a retention feature and an adoption feature,
 * not hygiene, and two decisions follow:
 *
 *  1. **The citation columns are in the CSV.** A licence row without the board
 *     page it came from and the date we checked it is a spreadsheet — which is
 *     what the customer already had. `deadlines.csv` carries `citation_url`,
 *     `citation_text`, `citation_last_verified`, `confidence` and
 *     `needs_human_check` on every row.
 *  2. **`full.json` is the lossless one.** CSV is what opens in Excel; JSON is
 *     what a customer's own system can read back. Both, never one.
 *
 * READ-ONLY DOES NOT BLOCK IT. An organisation past its trial or past due can
 * still export everything, because holding a customer's compliance data hostage
 * is both wrong and, for this buyer, unforgivable (`specs/09` §Validation).
 */

import { and, eq, gte } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { enqueueNotification } from '@octopus/platform/jobs';

import { getDocumentStore, type DocumentStore } from '../documents';
import {
  alerts,
  auditLog,
  ceRecords,
  dataExports,
  deadlines,
  digests,
  entities,
  licenceDocuments,
  licences,
  operatingStates,
  technicians,
} from '../schema';
import { createZip, toCsv, type ZipEntry } from '../zip';

export { EXPORT_JOB } from './kinds';

/** `specs/10` §Validation. Three a day is generous and bounds the job budget. */
export const EXPORT_RATE_LIMIT_PER_DAY = 3;
export const EXPORT_TTL_DAYS = 7;

export async function requestExport(
  db: Db,
  input: { orgId: string; userId: string; now?: Date },
): Promise<{ status: 'queued' | 'rate_limited'; exportId?: string }> {
  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - 86_400_000);
  const recent = await db
    .select({ id: dataExports.id })
    .from(dataExports)
    .where(and(eq(dataExports.orgId, input.orgId), gte(dataExports.createdAt, since)));
  if (recent.length >= EXPORT_RATE_LIMIT_PER_DAY) return { status: 'rate_limited' };

  const exportId = newId('exp');
  await db.insert(dataExports).values({
    id: exportId,
    orgId: input.orgId,
    requestedByUserId: input.userId,
    status: 'queued',
    expiresAt: new Date(now.getTime() + EXPORT_TTL_DAYS * 86_400_000),
  });
  await track(db, { name: 'export_requested', orgId: input.orgId, userId: input.userId });
  return { status: 'queued', exportId };
}

export type ExportBundle = { entries: ZipEntry[]; json: Record<string, unknown> };

/** Everything one organisation holds, as the files `specs/10` names. */
export async function buildExportBundle(
  db: Db,
  orgId: string,
  store: DocumentStore,
): Promise<ExportBundle> {
  const [techs, lics, dls, ces, alertRows, digestRows, docs, states, ents, audit] = await Promise.all([
    db.select().from(technicians).where(eq(technicians.orgId, orgId)),
    db.select().from(licences).where(eq(licences.orgId, orgId)),
    db.select().from(deadlines).where(eq(deadlines.orgId, orgId)),
    db.select().from(ceRecords).where(eq(ceRecords.orgId, orgId)),
    db.select().from(alerts).where(eq(alerts.orgId, orgId)),
    db.select().from(digests).where(eq(digests.orgId, orgId)),
    db.select().from(licenceDocuments).where(eq(licenceDocuments.orgId, orgId)),
    db.select().from(operatingStates).where(eq(operatingStates.orgId, orgId)),
    db.select().from(entities).where(eq(entities.orgId, orgId)),
    db.select().from(auditLog).where(eq(auditLog.orgId, orgId)),
  ]);

  const entries: ZipEntry[] = [
    {
      name: 'technicians.csv',
      data: toCsv(
        ['id', 'first_name', 'last_name', 'employee_ref', 'email', 'primary_state', 'primary_trade', 'status'],
        techs.map((t) => [t.id, t.firstName, t.lastName, t.employeeRef, t.email, t.primaryState, t.primaryTrade, t.status]),
      ),
    },
    {
      name: 'licences.csv',
      data: toCsv(
        [
          'id', 'holder_kind', 'technician_id', 'entity_id', 'state', 'trade', 'kb_licence_type_id',
          'custom_type_name', 'licence_number', 'issued_on', 'expires_on', 'expiry_source',
          'ce_hours_recorded', 'status',
        ],
        lics.map((l) => [
          l.id, l.holderKind, l.technicianId, l.entityId, l.state, l.trade, l.kbLicenceTypeId,
          l.customTypeName, l.licenceNumber, l.issuedOn, l.expiresOn, l.expirySource,
          l.ceHoursRecorded, l.status,
        ]),
      ),
    },
    {
      name: 'deadlines.csv',
      data: toCsv(
        [
          'id', 'licence_id', 'kind', 'due_on', 'source', 'rule', 'confidence', 'needs_human_check',
          'citation_url', 'citation_text', 'citation_last_verified', 'superseded_at',
        ],
        dls.map((d) => [
          d.id, d.licenceId, d.kind, d.dueOn, d.source, d.rule, d.confidence, d.needsHumanCheck,
          d.citationUrl, d.citationText, d.citationLastVerified, d.supersededAt,
        ]),
      ),
    },
    {
      name: 'ce_records.csv',
      data: toCsv(
        ['id', 'licence_id', 'hours', 'subject', 'delivery_mode', 'provider', 'completed_on'],
        ces.map((c) => [c.id, c.licenceId, c.hours, c.subject, c.deliveryMode, c.provider, c.completedOn]),
      ),
    },
    {
      name: 'alerts.csv',
      data: toCsv(
        ['id', 'deadline_id', 'recipient_user_id', 'offset_days', 'status', 'suppression_reason', 'sent_at', 'created_at'],
        alertRows.map((a) => [
          a.id, a.deadlineId, a.recipientUserId, a.offsetDays, a.status, a.suppressionReason, a.sentAt, a.createdAt,
        ]),
      ),
    },
    {
      name: 'audit_log.csv',
      data: toCsv(
        ['id', 'action', 'entity_table', 'entity_id', 'actor_user_id', 'at'],
        audit.map((a) => [a.id, a.action, a.entityTable, a.entityId, a.actorUserId, a.at]),
      ),
    },
  ];

  for (const doc of docs) {
    const bytes = await store.get(orgId, doc.storageKey);
    if (bytes) entries.push({ name: `documents/${doc.id}-${doc.filename}`, data: bytes });
  }

  const json = {
    exportedAt: new Date().toISOString(),
    organisationId: orgId,
    entities: ents,
    operatingStates: states,
    technicians: techs,
    licences: lics,
    deadlines: dls,
    ceRecords: ces,
    alerts: alertRows,
    digests: digestRows,
    documents: docs.map((d) => ({ ...d, storageKey: undefined })),
    auditLog: audit,
  };
  entries.push({ name: 'full.json', data: JSON.stringify(json, null, 2) });
  entries.push({
    name: 'README.txt',
    data: [
      'StateReady export',
      '',
      'deadlines.csv carries the board page every date came from (citation_url), the',
      'sentence we read (citation_text) and the day we last checked it',
      '(citation_last_verified). A row with needs_human_check = true is one we could',
      'not fully verify: check the board before you rely on it.',
      '',
      'StateReady is a tracking and research tool. It is not legal advice and it is not',
      'a licensing service. The licensing board, not StateReady, is the authority on',
      'your licence.',
      '',
    ].join('\n'),
  });

  return { entries, json };
}

export async function runExportJob(
  ctx: { db: Db; env: { APP_NAME: string; APP_BASE_URL: string; DOCUMENT_STORE?: string; BLOB_READ_WRITE_TOKEN?: string } },
  input: { exportId: string; now?: Date },
): Promise<{ status: 'ready' | 'failed' | 'missing'; storageKey?: string }> {
  const now = input.now ?? new Date();
  const { db } = ctx;
  const [row] = await db.select().from(dataExports).where(eq(dataExports.id, input.exportId)).limit(1);
  if (!row) return { status: 'missing' };

  try {
    const store = getDocumentStore(ctx.env);
    const bundle = await buildExportBundle(db, row.orgId, store);
    const zip = createZip(bundle.entries, now);
    const stored = await store.put({
      orgId: row.orgId,
      filename: `stateready-export-${now.toISOString().slice(0, 10)}.zip`,
      contentType: 'application/zip',
      body: zip,
    });
    await db
      .update(dataExports)
      .set({ status: 'ready', storageKey: stored.key })
      .where(eq(dataExports.id, input.exportId));

    if (row.requestedByUserId) {
      await enqueueNotification(db, {
        to: await emailOf(db, row.requestedByUserId),
        subject: `Your ${ctx.env.APP_NAME} export is ready`,
        paragraphs: [
          'Everything your organisation holds, as CSV and JSON, with the uploaded documents.',
          `The link works for ${EXPORT_TTL_DAYS} days. Request another whenever you want one.`,
        ],
        actionUrl: `${ctx.env.APP_BASE_URL}/settings/data`,
        actionLabel: 'Download the export',
        dedupeKey: `stateready.export_ready:${input.exportId}`,
      });
    }
    return { status: 'ready', storageKey: stored.key };
  } catch (error) {
    await db
      .update(dataExports)
      .set({ status: 'failed' })
      .where(eq(dataExports.id, input.exportId));
    console.error('[stateready] export failed', input.exportId, error);
    return { status: 'failed' };
  }
}

async function emailOf(db: Db, userId: string): Promise<string> {
  const { users } = await import('@octopus/platform/db');
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.email ?? '';
}

/** Expire links rather than leaving a customer's whole account on a URL. */
export async function expireStaleExports(db: Db, now = new Date()): Promise<number> {
  const rows = await db.select().from(dataExports).where(eq(dataExports.status, 'ready'));
  let expired = 0;
  for (const row of rows) {
    if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) {
      await db.update(dataExports).set({ status: 'expired' }).where(eq(dataExports.id, row.id));
      expired += 1;
    }
  }
  return expired;
}
