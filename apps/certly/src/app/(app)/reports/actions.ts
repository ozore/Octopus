'use server';

/**
 * M12's server actions — `specs/12` §7.
 *
 * `specs/12` §8: **read-only organisations can still generate and download
 * reports. Their compliance record is theirs.** So the entitlement check here
 * is `canExportReports`, not the ordinary write gate, and the sentence it
 * refuses with names what to do about it rather than saying "upgrade".
 */

import { redirect } from 'next/navigation';

import { appOrigin } from '@/env';
import { getDb } from '@/lib/db';
import { orgToday } from '@/lib/engine';
import { trackEvent } from '@/lib/events';
import { ensureOrgSettings } from '@/lib/repos';
import { parseStatusFilter } from '@/lib/repos/dashboard';
import {
  EXPORT_BLOCKED_SENTENCE,
  SHARE_DEFAULT_DAYS,
  SHARE_MAX_DAYS,
  SYNCHRONOUS_VENDOR_LIMIT,
  canExportReports,
  createShareLink,
  generateReport,
  revokeShareLink,
  type ReportFormat,
  type ReportScope,
} from '@/lib/reports';
import { rosterForScope } from '@/lib/repos/dashboard';
import { scopeToFilter } from '@/lib/reports/assemble';
import { enqueue } from '@octopus/platform/jobs';
import { requireOrg } from '@octopus/platform/next';

async function context() {
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  return {
    db,
    org,
    user,
    entitlement,
    settings,
    today: orgToday(settings.timezone, new Date()),
    actor: { kind: 'user' as const, userId: user.id, email: user.email },
  };
}

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

function parseFormat(value: string): ReportFormat {
  return value === 'csv' ? 'csv' : 'pdf';
}

async function create(scope: ReportScope, format: ReportFormat, source: string): Promise<never> {
  const { db, org, user, entitlement, settings, today, actor } = await context();

  if (!canExportReports(entitlement)) {
    redirect(`/reports?error=${encodeURIComponent(EXPORT_BLOCKED_SENTENCE)}`);
  }

  await trackEvent(db, {
    name: 'export_dialog_opened',
    orgId: org.id,
    userId: user.id,
    props: { source },
  });

  const payload = {
    orgId: org.id,
    orgName: org.name,
    entityBlock: settings.entityBlock,
    timezone: settings.timezone,
    today,
    scope,
    format,
  };

  // `specs/12` §7 — synchronous under 100 vendors, a job above. The handler is
  // registered in `src/lib/platform.ts` and calls the SAME renderer, so the two
  // paths cannot produce different documents.
  const roster = await rosterForScope(db, { orgId: org.id, filter: scopeToFilter(scope) });
  if (roster.length > SYNCHRONOUS_VENDOR_LIMIT) {
    await enqueue(db, { kind: 'certly.render_report', payload: { ...payload, userId: user.id } });
    redirect('/reports?queued=1');
  }

  const result = await generateReport(db, { ...payload, actor, generatedBy: user.email });
  await trackEvent(db, {
    name: 'report_generated',
    orgId: org.id,
    userId: user.id,
    props: {
      format,
      scope: scope.kind,
      vendors: result.vendorCount,
      gaps: result.snapshot.vendors.reduce((sum, vendor) => sum + vendor.gapCount, 0),
      asserted_only: result.snapshot.vendors.reduce((sum, vendor) => sum + vendor.assertedOnlyCount, 0),
      not_checked: result.snapshot.notChecked.length,
      ms: result.ms,
    },
  });

  redirect(`/reports/${result.reportId}?created=1`);
}

export async function createReportAction(form: FormData): Promise<void> {
  const kind = text(form, 'scope');
  const format = parseFormat(text(form, 'format'));
  const scope: ReportScope =
    kind === 'filter'
      ? { kind: 'filter', status: parseStatusFilter(text(form, 'status')), q: text(form, 'q') || null }
      : { kind: 'all' };
  await create(scope, format, 'reports');
}

/** The dashboard's bulk action — `UX.md` §3.4's second of exactly two. */
export async function exportSelectionAction(form: FormData): Promise<void> {
  const vendorIds = form.getAll('vendorId').map(String).filter(Boolean);
  if (vendorIds.length === 0) redirect('/dashboard?bulk=none');
  await create({ kind: 'selection', vendorIds }, 'pdf', 'dashboard');
}

export async function exportVendorAction(form: FormData): Promise<void> {
  const vendorId = text(form, 'vendorId');
  await create({ kind: 'vendor', vendorId }, parseFormat(text(form, 'format')), 'vendor');
}

export async function createShareLinkAction(form: FormData): Promise<void> {
  const { db, org, user, actor } = await context();
  const reportId = text(form, 'reportId');
  const days = Math.min(Number(text(form, 'days') || SHARE_DEFAULT_DAYS) || SHARE_DEFAULT_DAYS, SHARE_MAX_DAYS);

  const link = await createShareLink(db, { orgId: org.id, reportId, days, actor });
  if (!link) redirect('/reports?error=no_such_report');

  await trackEvent(db, { name: 'report_share_created', orgId: org.id, userId: user.id, props: { days } });
  // The raw token exists in this URL and nowhere else — the database keeps only
  // its SHA-256 — so it is handed back once, here.
  redirect(`/reports/${reportId}?share=${encodeURIComponent(`${appOrigin()}/r/${link.token}`)}`);
}

export async function revokeShareLinkAction(form: FormData): Promise<void> {
  const { db, org, user, actor } = await context();
  const reportId = text(form, 'reportId');
  await revokeShareLink(db, { orgId: org.id, reportId, actor });
  await trackEvent(db, { name: 'report_share_revoked', orgId: org.id, userId: user.id, props: {} });
  redirect(`/reports/${reportId}?revoked=1`);
}
