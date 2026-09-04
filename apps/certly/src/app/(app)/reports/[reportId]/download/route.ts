/**
 * DOWNLOADING A REPORT.
 *
 * `specs/12` §6 says downloads should be signed URLs rather than bytes through
 * a route handler. **This handler streams the bytes, and that is a deliberate
 * deviation** (BUILD.md D-14), for two reasons:
 *
 *  1. `VercelBlobStore.signedUrl()` cannot honour a TTL — Vercel Blob 2.x serves
 *     from an unguessable but PERMANENT public URL (BUILD.md D-5, PR-3).
 *     Redirecting a browser to one hands out a link to a customer's compliance
 *     record that never expires and that `requireOrg()` never sees again.
 *  2. The rule in §6 exists because of the request-BODY limit on the upload
 *     path (`specs/03` §9). A response is not bounded by it, and a gap report is
 *     tens of kilobytes.
 *
 * So the org check happens on every download, the five-minute TTL is honoured by
 * not issuing a URL at all, and the memory adapter — which has no fetchable URL
 * — works in development and in the journey without a second code path.
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { REPORT_MIME, getReport, readReportBytes, type ReportFormat } from '@/lib/reports';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  const { org, user } = await requireOrg();
  const { reportId } = await params;
  const db = await getDb();

  const report = await getReport(db, org.id, reportId);
  if (!report || report.status !== 'ready') return new NextResponse('Not found', { status: 404 });

  const format = report.format as ReportFormat;
  const bytes = await readReportBytes(org.id, reportId, format);
  if (!bytes) return new NextResponse('Not found', { status: 404 });

  await trackEvent(db, { name: 'report_downloaded', orgId: org.id, userId: user.id, props: { format } });

  const filename = `certly-gap-report-${report.generatedAt?.toISOString().slice(0, 10) ?? 'draft'}.${format}`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': REPORT_MIME[format],
      'content-disposition': `attachment; filename="${filename}"`,
      'content-length': String(bytes.byteLength),
      // A compliance record is never cached by a shared proxy.
      'cache-control': 'private, no-store',
    },
  });
}
