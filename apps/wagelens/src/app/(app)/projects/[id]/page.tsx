import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { ClassificationTable } from '@/components/determination';
import { Panel, StatusPill } from '@/components/primitives';
import { ProvenanceCard } from '@/components/provenance';
import { searchClassifications } from '@/lib/kb';
import { crewForProject } from '@/lib/repositories/workers';

import { loadProject } from './project-context';
import { ProjectTabs } from './tabs';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id` — the project's overview.
 *
 * **It reads the PINNED modification and nothing else** (gate G9): the
 * classification preview below joins on `project.wdId`, not on
 * `project.wdNumber`, so a project pinned to modification 0 shows modification
 * 0's rates even with modification 1 sitting in the same database.
 */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, provenance, db, orgId, newerModification } = await loadProject(id);

  const [{ rows, total }, crew] = await Promise.all([
    searchClassifications(db, project.wdId, { limit: 5 }),
    crewForProject(db, { orgId, projectId: project.id }),
  ]);
  const unmapped = crew.filter((member) => member.mapping === null);

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>{project.name}</h1>
          <p className="wl-sm wl-muted">
            {project.locationDescription || 'No location recorded'} ·{' '}
            {project.ourRole === 'prime' ? 'Prime contractor' : 'Subcontractor'}
            {project.primeContractorName ? ` for ${project.primeContractorName}` : ''}
            {project.projectOrContractNo ? ` · ${project.projectOrContractNo}` : ''}
          </p>
        </div>
        <StatusPill tone={project.wdPinnedSuperseded || newerModification ? 'flag' : 'none'}>
          {project.wdPinnedSuperseded
            ? 'Older modification'
            : newerModification
              ? 'Newer modification published'
              : 'Current'}
        </StatusPill>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}`} />

      <Panel
        title="Pinned wage determination"
        actions={
          <Link className="wl-btn wl-btn--ghost wl-btn--sm" href={`/projects/${project.id}/determination`}>
            The determination
          </Link>
        }
      >
        <ProvenanceCard
          provenance={provenance}
          scope={
            project.countyName
              ? `${project.countyName} County, ${project.stateCode}${project.constructionType ? ` · ${project.constructionType} construction` : ''}`
              : project.stateCode
          }
          classification={`${total} classifications`}
        />
        <p className="wl-xs wl-muted">
          Every payroll on this project is computed from modification{' '}
          {project.wdModificationNumber}. Nothing moves that by itself.
        </p>
      </Panel>

      {unmapped.length > 0 ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="unmapped-banner">
          <div>
            <p className="wl-alert__title">
              {unmapped.length} worker{unmapped.length === 1 ? ' has' : 's have'} no classification.
            </p>
            <p className="wl-alert__body">
              You cannot certify a payroll until they do.{' '}
              <Link href={`/projects/${project.id}/crew`}>Map them on the crew page</Link>.
            </p>
          </div>
        </div>
      ) : null}

      <Panel
        title="The crew"
        actions={
          <Link className="wl-btn wl-btn--secondary wl-btn--sm" href={`/projects/${project.id}/crew`}>
            {crew.length === 0 ? 'Add your crew' : 'Open the crew'}
          </Link>
        }
      >
        {crew.length === 0 ? (
          <p className="wl-sm">
            Add the workers who will be on this job, and map each of them to a classification on
            this determination. Classification is your legal judgement, so nothing here is chosen
            for you.
          </p>
        ) : (
          <p className="wl-sm">
            {crew.length} worker{crew.length === 1 ? '' : 's'} on the roster ·{' '}
            {crew.length - unmapped.length} mapped to a classification on{' '}
            <span className="wl-mono">{project.wdNumber}</span> mod {project.wdModificationNumber}.
          </p>
        )}
      </Panel>

      <ClassificationTable
        rows={rows}
        total={total}
        provenance={provenance}
        heading={`${total} classifications on ${project.wdNumber} mod ${project.wdModificationNumber} — first ${rows.length} shown`}
        footer={
          <p className="wl-sm">
            <Link
              className="wl-btn wl-btn--secondary wl-btn--sm"
              href={`/projects/${project.id}/classifications`}
            >
              Open the full catalogue
            </Link>
          </p>
        }
      />

      <InlineDisclaimer />
    </>
  );
}
