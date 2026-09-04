/**
 * M12 — GAP REPORT EXPORT. `specs/12`.
 *
 * **Reports are immutable snapshots.** Regenerating creates a new row. A report
 * someone forwarded in March must still say in June what it said in March —
 * otherwise it is not evidence, which is the only reason it exists.
 *
 * That property is why the bytes and the snapshot are BOTH written to the
 * DocumentStore at generation time and never rebuilt:
 *
 *   org/<orgId>/reports/<reportId>.pdf        the forwardable artefact
 *   org/<orgId>/reports/<reportId>.csv        the spreadsheet one
 *   org/<orgId>/reports/<reportId>.snapshot.json   what both were rendered from
 *
 * The snapshot is what `/r/<token>` renders, so the shared HTML says exactly
 * what the PDF said, months later, with no query against live data. Neon holds
 * the row and its counts; it never holds report bytes (`specs/03` §9's rule,
 * applied here too).
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '../audit';
import type { Db } from '../db';
import { newId } from '../ids';
import { reports } from '../schema';
import { getDocumentStore, type DocumentStore } from '../storage/document-store';
import { assembleReport, MAX_SCOPE_VENDORS } from './assemble';
import { renderCsv } from './csv';
import { renderPdf } from './pdf';
import { REPORT_SNAPSHOT_VERSION, type ReportScope, type ReportSnapshot } from './types';

export type ReportFormat = 'pdf' | 'csv';

export const REPORT_MIME: Record<ReportFormat, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv; charset=utf-8',
};

/** Above this, generation moves to the job runner (`specs/12` §7, §8). */
export const SYNCHRONOUS_VENDOR_LIMIT = 100;

/** `specs/12` §8 — the share link's default and its ceiling. */
export const SHARE_DEFAULT_DAYS = 30;
export const SHARE_MAX_DAYS = 90;
/** `specs/12` §7 — a download URL lives five minutes. */
export const DOWNLOAD_TTL_SECONDS = 300;

export function reportKey(orgId: string, reportId: string, format: ReportFormat): string {
  return `org/${orgId}/reports/${reportId}.${format}`;
}

export function snapshotKey(orgId: string, reportId: string): string {
  return `org/${orgId}/reports/${reportId}.snapshot.json`;
}

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * `specs/12` §8 — **read-only organisations can still generate and download
 * reports. Their compliance record is theirs.**
 *
 * The gate is therefore on the ENTITLEMENT'S export limit, and an org that has
 * ever had a subscription keeps exports even when the subscription lapses
 * (`specs/10` §5: what stops is writing and sending, not reading what you
 * already have). An org that has never subscribed is inside the free onboarding
 * allowance, where `specs/10` §8.1 sets `exports: false`.
 */
export function canExportReports(entitlement: {
  limits: { exports?: unknown };
  status: string;
}): boolean {
  if (entitlement.limits.exports === true) return true;
  return entitlement.status !== 'none';
}

export const EXPORT_BLOCKED_SENTENCE =
  'Exports are part of a subscription. Everything you have already read stays visible; start a trial to export a dated report you can forward.';

// ---------------------------------------------------------------------------
// Generating
// ---------------------------------------------------------------------------

export type GenerateInput = {
  orgId: string;
  orgName: string;
  entityBlock: string | null;
  timezone: string;
  today: string;
  scope: ReportScope;
  format: ReportFormat;
  actor: AuditActor;
  generatedBy?: string | null;
  store?: DocumentStore;
  now?: Date;
};

export type GenerateResult = {
  reportId: string;
  bytes: number;
  vendorCount: number;
  ms: number;
  snapshot: ReportSnapshot;
};

/**
 * Assemble, render, store, record. In that order, and nothing between the
 * assembly and the render reads the database again — which is what makes the
 * PDF, the CSV and the shared HTML three views of ONE reading.
 */
export async function generateReport(db: Db, input: GenerateInput): Promise<GenerateResult> {
  const started = Date.now();
  const store = input.store ?? getDocumentStore();
  const reportId = newId('report');

  await db.insert(reports).values({
    id: reportId,
    orgId: input.orgId,
    createdBy: input.actor.kind === 'user' ? input.actor.userId : null,
    scope: input.scope as unknown as Record<string, unknown>,
    format: input.format,
    status: 'generating',
  });

  try {
    const snapshot = await assembleReport(db, {
      orgId: input.orgId,
      orgName: input.orgName,
      entityBlock: input.entityBlock,
      timezone: input.timezone,
      today: input.today,
      reportId,
      scope: input.scope,
      generatedBy: input.generatedBy ?? null,
      ...(input.now ? { now: input.now } : {}),
    });

    const bytes =
      input.format === 'pdf'
        ? await renderPdf(snapshot)
        : new TextEncoder().encode(renderCsv(snapshot));

    const key = reportKey(input.orgId, reportId, input.format);
    await store.put(key, bytes, REPORT_MIME[input.format]);
    await store.put(
      snapshotKey(input.orgId, reportId),
      new TextEncoder().encode(JSON.stringify(snapshot)),
      'application/json',
    );

    const gapCount = snapshot.vendors.reduce((sum, vendor) => sum + vendor.gapCount, 0);
    const assertedOnlyCount = snapshot.vendors.reduce((sum, vendor) => sum + vendor.assertedOnlyCount, 0);

    await db
      .update(reports)
      .set({
        status: 'ready',
        storageKey: key,
        bytes: bytes.byteLength,
        vendorCount: snapshot.vendors.length,
        gapCount,
        assertedOnlyCount,
        notCheckedCount: snapshot.notChecked.length,
        needsReviewCount: snapshot.needsReview.length,
        engineVersion: snapshot.engineVersions.join(','),
        generatedAt: input.now ?? new Date(),
      })
      .where(and(eq(reports.id, reportId), eq(reports.orgId, input.orgId)));

    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'data.exported',
      subjectType: 'report',
      subjectId: reportId,
      payload: {
        what: `a ${input.format.toUpperCase()} gap report covering ${snapshot.vendors.length} vendors`,
        rows: snapshot.vendors.length,
        format: input.format,
        engineVersion: snapshot.engineVersions.join(','),
      },
    });

    return {
      reportId,
      bytes: bytes.byteLength,
      vendorCount: snapshot.vendors.length,
      ms: Date.now() - started,
      snapshot,
    };
  } catch (error) {
    await db
      .update(reports)
      .set({ status: 'failed' })
      .where(and(eq(reports.id, reportId), eq(reports.orgId, input.orgId)));
    throw error;
  }
}

/**
 * The job path — `specs/12` §7: synchronous under 100 vendors, a job above.
 * Registered in `src/lib/platform.ts` so the cron drain knows it; the handler
 * is this function so that the two paths render byte-identical output.
 */
export async function renderQueuedReport(
  db: Db,
  payload: {
    orgId: string;
    orgName: string;
    entityBlock: string | null;
    timezone: string;
    today: string;
    scope: ReportScope;
    format: ReportFormat;
    userId?: string | null;
  },
): Promise<GenerateResult> {
  return generateReport(db, {
    ...payload,
    actor: payload.userId ? { kind: 'user', userId: payload.userId } : { kind: 'system' },
  });
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type ReportRow = typeof reports.$inferSelect;

export async function listReports(db: Db, orgId: string, limit = 50): Promise<ReportRow[]> {
  return db
    .select()
    .from(reports)
    .where(eq(reports.orgId, orgId))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
}

export async function getReport(db: Db, orgId: string, reportId: string): Promise<ReportRow | null> {
  const [row] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.orgId, orgId)));
  return row ?? null;
}

export async function readSnapshot(
  orgId: string,
  reportId: string,
  store: DocumentStore = getDocumentStore(),
): Promise<ReportSnapshot | null> {
  try {
    const bytes = await store.get(snapshotKey(orgId, reportId));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as ReportSnapshot;
    return parsed.version === REPORT_SNAPSHOT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export async function readReportBytes(
  orgId: string,
  reportId: string,
  format: ReportFormat,
  store: DocumentStore = getDocumentStore(),
): Promise<Uint8Array | null> {
  try {
    return await store.get(reportKey(orgId, reportId, format));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Share links — `specs/12` §8
// ---------------------------------------------------------------------------

export type ShareLink = { token: string; expiresAt: Date };

/**
 * 32 random bytes, HASHED AT REST, revocable, default 30 days and never more
 * than 90. The raw token exists in the URL and nowhere else, so a database dump
 * does not hand anybody a live report.
 */
export async function createShareLink(
  db: Db,
  input: { orgId: string; reportId: string; days?: number; actor: AuditActor; now?: Date },
): Promise<ShareLink | null> {
  const report = await getReport(db, input.orgId, input.reportId);
  if (!report) return null;

  const days = Math.min(Math.max(1, Math.trunc(input.days ?? SHARE_DEFAULT_DAYS)), SHARE_MAX_DAYS);
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date((input.now ?? new Date()).getTime() + days * 86_400_000);

  await db
    .update(reports)
    .set({ shareTokenHash: hashShareToken(token), shareExpiresAt: expiresAt, shareRevokedAt: null })
    .where(and(eq(reports.id, input.reportId), eq(reports.orgId, input.orgId)));

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'data.exported',
    subjectType: 'report',
    subjectId: input.reportId,
    payload: { what: `a share link for a gap report, valid ${days} days`, days },
  });

  return { token, expiresAt };
}

export async function revokeShareLink(
  db: Db,
  input: { orgId: string; reportId: string; actor: AuditActor; now?: Date },
): Promise<void> {
  await db
    .update(reports)
    .set({ shareRevokedAt: input.now ?? new Date(), shareTokenHash: null })
    .where(and(eq(reports.id, input.reportId), eq(reports.orgId, input.orgId)));
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'data.exported',
    subjectType: 'report',
    subjectId: input.reportId,
    payload: { what: 'a revoked share link for a gap report' },
  });
}

/**
 * `specs/12` A7 and §13: **a revoked token and an expired token return
 * IDENTICAL responses.** A different page for "revoked" tells whoever holds the
 * link that it was once real and that somebody took it away, which is more than
 * a stranger is owed.
 */
export async function resolveShare(
  db: Db,
  token: string,
  options: { now?: Date; store?: DocumentStore } = {},
): Promise<{ report: ReportRow; snapshot: ReportSnapshot } | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = hashShareToken(token);

  const [row] = await db.select().from(reports).where(eq(reports.shareTokenHash, hash));
  if (!row) return null;

  // Constant-time on the hash as well as the index lookup: the index makes the
  // comparison cheap, this makes it uninformative.
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(row.shareTokenHash ?? '', 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const now = options.now ?? new Date();
  if (row.shareRevokedAt) return null;
  if (!row.shareExpiresAt || row.shareExpiresAt.getTime() <= now.getTime()) return null;
  if (row.status !== 'ready') return null;

  const snapshot = await readSnapshot(row.orgId, row.id, options.store ?? getDocumentStore());
  if (!snapshot) return null;
  return { report: row, snapshot };
}

export { MAX_SCOPE_VENDORS };
export type { ReportScope, ReportSnapshot };
