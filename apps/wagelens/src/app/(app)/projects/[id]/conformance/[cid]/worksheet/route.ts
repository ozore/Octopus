import { and, eq } from 'drizzle-orm';

import { requireOrg } from '@octopus/platform/next';

import { productName } from '@/env';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { getConformance, getWorker } from '@/lib/repositories/workers';
import { projects, type ComparedClassification } from '@/lib/schema';

import { renderConformanceWorksheetPdf } from '../../pdf';

export const dynamic = 'force-dynamic';

/**
 * The worksheet, as a downloadable PDF.
 *
 * It carries the V9 notice on its first page — **this is a worksheet, not
 * Standard Form SF-1444, and your contracting agency submits the request to
 * DBAConformance@dol.gov** — because KNOWLEDGE_BASE KB-10 records that the real
 * form could not be opened from this environment, and we do not ship a form we
 * have not read.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> },
): Promise<Response> {
  const { id, cid } = await params;
  const { org, user } = await requireOrg();
  const db = await getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.orgId, org.id)))
    .limit(1);
  if (!project) return new Response('Not found', { status: 404 });

  const worksheet = await getConformance(db, { projectId: project.id, id: cid });
  if (!worksheet) return new Response('Not found', { status: 404 });

  const worker = worksheet.workerId ? await getWorker(db, org.id, worksheet.workerId) : undefined;

  const pdf = renderConformanceWorksheetPdf({
    productName: productName(),
    projectName: project.name,
    projectOrContractNo: project.projectOrContractNo,
    locationDescription: project.locationDescription,
    workerName: worker ? `${worker.firstName} ${worker.lastName}` : null,
    wdNumber: worksheet.wdNumber,
    wdModificationNumber: worksheet.wdModificationNumber,
    dutiesDescription: worksheet.dutiesDescription,
    proposedClassification: worksheet.proposedClassification,
    proposedBaseRate: worksheet.proposedBaseRate,
    proposedFringeRate: worksheet.proposedFringeRate,
    comparedClassifications: (
      (worksheet.comparedClassifications as ComparedClassification[]) ?? []
    ).map((entry) => ({
      label: entry.label,
      baseRate: entry.baseRate,
      fringeRate: entry.fringeRate,
    })),
    generatedAt: new Date(),
  });

  await emitEvent(db, 'conformance_worksheet_downloaded', { orgId: org.id, userId: user.id });

  return new Response(pdf as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="conformance-worksheet-${worksheet.wdNumber}-mod${worksheet.wdModificationNumber}.pdf"`,
      'cache-control': 'no-store',
    },
  });
}
