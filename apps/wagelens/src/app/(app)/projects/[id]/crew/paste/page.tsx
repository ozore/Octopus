import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { searchClassifications } from '@/lib/kb';

import { loadProject } from '../../project-context';
import { ProjectTabs } from '../../tabs';
import { PastePreview } from './paste-preview';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/crew/paste` — the three-minute roster.
 *
 * UX.md §4 budgets three minutes for the crew, and a fifteen-to-fifty person
 * crew entered one drawer at a time does not fit that. The CSV importer that
 * would have solved it is WL-15, a Should with a trigger, deliberately — so the
 * gap is closed by a paste box, which has no file format, no encoding, no
 * column-mapping memory, and cannot fail silently.
 *
 * **This is not a file import.** No upload, no CSV parsing, no payroll-provider
 * format. Selling an importer the MVP does not build is the one commercial
 * promise here that generates refunds in month one.
 */
export default async function PastePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query['error'] === 'string' ? query['error'] : '';

  const { project, db } = await loadProject(id);
  const { rows } = await searchClassifications(db, project.wdId, { limit: 1000 });

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>Paste a crew list</h1>
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

      {error === 'full_number' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="paste-full-number">
          <div>
            <p className="wl-alert__title">
              Enter only the last four digits — federal rules forbid the full number on a certified
              payroll.
            </p>
            <p className="wl-alert__body">
              29 CFR 5.5(a)(3)(ii)(B). Nothing was written, and we did not shorten the number for
              you.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'nothing_to_add' ? (
        <div className="wl-alert wl-alert--warn" role="alert">
          <div>
            <p className="wl-alert__title">There was nothing to add.</p>
          </div>
        </div>
      ) : null}

      <Panel title="Paste the rows, then check them">
        <PastePreview
          projectId={project.id}
          classifications={rows.map((row) => ({
            id: row.id,
            label: row.classificationLabel,
            baseRate: row.baseRate,
            fringeRate: row.fringeRate,
          }))}
        />
      </Panel>

      <InlineDisclaimer />
    </>
  );
}
