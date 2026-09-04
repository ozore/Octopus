import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { emitEvent } from '@/lib/analytics/events';
import { getDeterminationText, publicDeterminationUrl } from '@/lib/kb';

import { OfficialLink } from '../../official-link';
import { loadProject } from '../../project-context';
import { ProjectTabs } from '../../tabs';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/determination/text` — the determination's own words, verbatim.
 *
 * This is the screen the catalogue defers to when the table does not settle the
 * question, and it is the reason the catalogue can be a table at all: the
 * modification table, the rate-identifier legend, the footnotes and
 * `END OF GENERAL DECISION` are all here, exactly as SAM.gov served them,
 * monospaced and searchable with the browser's own find. We reproduce; we do
 * not summarise.
 */
export default async function DeterminationTextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, db, orgId, userId } = await loadProject(id);

  const text = await getDeterminationText(db, project.wdId);
  await emitEvent(db, 'determination_text_opened', {
    orgId,
    userId,
    props: { wd_number: project.wdNumber },
  });

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}, in full
          </h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link>
          </p>
        </div>
        <OfficialLink
          className="wl-btn wl-btn--secondary wl-btn--sm"
          href={publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)}
          wdNumber={project.wdNumber}
          surface="determination_text"
        >
          ⧉ View on SAM.gov
        </OfficialLink>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/determination`} />

      {text ? (
        <Panel title="The document, as published">
          <pre className="wl-mono wl-scroll-x" data-testid="determination-text">
            {text}
          </pre>
        </Panel>
      ) : (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="determination-text-missing">
          <div>
            <p className="wl-alert__title">We couldn&rsquo;t read this determination.</p>
            <p className="wl-alert__body">
              We hold no text for this modification, so there is nothing to reproduce here — and an
              empty pane presented as a document would be worse than saying so.{' '}
              <OfficialLink
                href={publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)}
                wdNumber={project.wdNumber}
                surface="determination_text_missing"
              >
                Open it on SAM.gov →
              </OfficialLink>
            </p>
          </div>
        </div>
      )}

      <InlineDisclaimer />
    </>
  );
}
