import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { InlineDisclaimer } from '@/components/disclaimer';
import { ClassificationTable, ModificationControl } from '@/components/determination';
import { Panel } from '@/components/primitives';
import { ProvenanceCard } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { corpusHealth, getModificationHistory, searchClassifications } from '@/lib/kb';
import { projects } from '@/lib/schema';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id` — SCAFFOLD SEAM. **WL-02 owns this file** (and WL-03 owns the
 * classification catalogue inside it).
 *
 * The behaviour that must survive the rewrite: the project reads ITS PINNED
 * MODIFICATION and nothing else (gate G9). A project pinned to modification 1
 * never reads a rate from modification 2, even after modification 2 is
 * ingested — which is why the query below joins on `wd_id` and not on
 * `wd_number`.
 */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrg();
  const db = await getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.orgId, org.id)))
    .limit(1);
  if (!project) notFound();

  const [{ rows, total }, modifications, health] = await Promise.all([
    searchClassifications(db, project.wdId, { limit: 500 }),
    getModificationHistory(db, project.wdNumber),
    corpusHealth(db),
  ]);
  const newer = modifications.find(
    (m) => m.active && m.modificationNumber !== project.wdModificationNumber,
  );

  const provenance = {
    wdNumber: project.wdNumber,
    modificationNumber: project.wdModificationNumber,
    publicationDate: modifications.find((m) => m.modificationNumber === project.wdModificationNumber)
      ?.publicationDate ?? '',
    stale: health.stale,
    newerModification: newer
      ? { modificationNumber: newer.modificationNumber, publicationDate: newer.publicationDate }
      : null,
  };

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>{project.name}</h1>
          <p className="wl-sm wl-muted">
            {project.locationDescription || 'No location recorded'} ·{' '}
            {project.ourRole === 'prime' ? 'Prime contractor' : 'Subcontractor'}
            {project.projectOrContractNo ? ` · ${project.projectOrContractNo}` : ''}
          </p>
        </div>
        <Link className="wl-btn wl-btn--ghost wl-btn--sm" href="/projects">
          All projects
        </Link>
      </div>

      <Panel title="Pinned wage determination">
        <ProvenanceCard
          provenance={provenance}
          scope={
            project.countyName
              ? `${project.countyName} County, ${project.stateCode}${project.constructionType ? ` · ${project.constructionType}` : ''}`
              : project.stateCode
          }
          classification={`${total} classifications`}
        />
        <ModificationControl
          wdNumber={project.wdNumber}
          current={project.wdModificationNumber}
          modifications={modifications}
        />
        <p className="wl-xs wl-muted">
          Every payroll on this project is computed from modification{' '}
          {project.wdModificationNumber}. Nothing moves that by itself.
        </p>
      </Panel>

      <ClassificationTable rows={rows} total={total} provenance={provenance} />
      <InlineDisclaimer />
    </>
  );
}
