import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ClassificationPicker } from '@/components/classification-picker';
import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { searchClassifications } from '@/lib/kb';
import { getWorker } from '@/lib/repositories/workers';

import { loadProject } from '../../../project-context';
import { ProjectTabs } from '../../../tabs';
import { mapClassificationAction } from '../../actions';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/crew/:workerId/map` — one worker, one decision.
 *
 * The picker searches the project's PINNED determination and nothing else, so a
 * classification that is not on it cannot be chosen here or written by the
 * action behind it. "None of these match" is always on screen, and it leads to
 * the conformance guide — which looks again first, explains second and prepares
 * a worksheet third. Nine times in ten "nothing matches" means the row has not
 * been found yet.
 */
export default async function MapWorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; workerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, workerId } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, provenance, db, orgId } = await loadProject(id);
  const worker = await getWorker(db, orgId, workerId);
  if (!worker) notFound();

  const term = one('q').trim();
  const effectiveQuery = term.length >= 2 ? term : '';
  const searches = Math.max(0, Number(one('searches') || '0') || 0) + (effectiveQuery ? 1 : 0);

  const { rows, total } = await searchClassifications(db, project.wdId, {
    ...(effectiveQuery ? { query: effectiveQuery } : {}),
    limit: 100,
  });

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>
            Map {worker.firstName} {worker.lastName}
          </h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}/crew`}>The crew</Link> ·{' '}
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}
          </p>
        </div>
        <Link className="wl-btn wl-btn--ghost wl-btn--sm" href={`/projects/${project.id}/crew`}>
          Back to the crew
        </Link>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/crew`} />

      {one('error') === 'not_on_determination' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="mapping-invalid">
          <div>
            <p className="wl-alert__title">
              That classification isn&rsquo;t on this project&rsquo;s determination.
            </p>
            <p className="wl-alert__body">
              Column (3) of the WH-347 has to name a classification from the determination your
              contract incorporates, so nothing was mapped.
            </p>
          </div>
        </div>
      ) : null}

      <Panel title="Classification follows the work actually performed">
        <p className="wl-sm">
          Not the job title, and not what they are called on private work. Choosing the cheapest row
          is your legal call and we will not block it — but the rate spread below is the reason to
          choose the right one.
        </p>
      </Panel>

      <ClassificationPicker
        rows={rows}
        total={total}
        query={effectiveQuery}
        provenance={provenance}
        searchAction={`/projects/${project.id}/crew/${worker.id}/map`}
        hiddenSearchFields={{ searches: String(searches) }}
        mapAction={mapClassificationAction}
        hiddenMapFields={{ projectId: project.id, workerId: worker.id }}
        noneMatchHref={`/projects/${project.id}/conformance?worker=${worker.id}&searches=${searches}`}
        determinationTextHref={`/projects/${project.id}/determination/text`}
      />

      <InlineDisclaimer />
    </>
  );
}
