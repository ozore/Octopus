import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel, StatusPill } from '@/components/primitives';
import { ProvenanceCard, formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { publicDeterminationUrl, searchClassifications } from '@/lib/kb';
import { certifiedPayrollCount, pinHistory } from '@/lib/repositories/projects';

import { repinProjectAction } from '../../actions';
import { OfficialLink } from '../official-link';
import { loadProject } from '../project-context';
import { ProjectTabs } from '../tabs';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/determination` — the pinned card, the modification history
 * from `kb_wd_modifications`, and the only control in the product that moves a
 * pin.
 *
 * **Moving a pin is a human decision, always** (WL-02, WL-08). The history
 * below is the corpus's record of what SAM.gov published, never an inference;
 * choosing an entry re-pins the project and writes a `project_wd_pin_history`
 * row, and once a payroll on the project is certified it needs an explicit
 * confirmation first (V7) — because a signed federal statement then disagrees
 * with the project it belongs to, and that is a correction rather than an
 * update.
 */
export default async function ProjectDeterminationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, provenance, modifications, newerModification, db, orgId, userId } =
    await loadProject(id);

  await emitEvent(db, 'determination_card_viewed', { orgId, userId });

  const [{ total }, history, certified] = await Promise.all([
    searchClassifications(db, project.wdId, { limit: 1 }),
    pinHistory(db, project.id),
    certifiedPayrollCount(db, project.id),
  ]);

  const confirmRepin = one('confirm_repin');

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>The determination</h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link>
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

      <ProjectTabs id={project.id} current={`/projects/${project.id}/determination`} />

      {one('repinned') ? (
        <div className="wl-alert wl-alert--success" role="status">
          <div>
            <p className="wl-alert__title">
              This project now reads modification {project.wdModificationNumber}.
            </p>
            <p className="wl-alert__body">
              The previous pin is closed in the history below, not overwritten — a payroll
              certified under it stays explainable.
            </p>
          </div>
        </div>
      ) : null}

      {confirmRepin ? (
        <div className="wl-alert wl-alert--warn" role="alert" data-testid="repin-confirm">
          <div>
            <p className="wl-alert__title">
              This project already has {one('certified')} certified payroll
              {one('certified') === '1' ? '' : 's'}.
            </p>
            <p className="wl-alert__body">
              Moving the pin to modification {confirmRepin} makes those signed payrolls
              inconsistent with the project. We will record it as a{' '}
              <strong>correction</strong> and keep both pins in the history. Nothing already
              generated is rewritten.
            </p>
            <form action={repinProjectAction} className="wl-row">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="modificationNumber" value={confirmRepin} />
              <input type="hidden" name="confirmed" value="1" />
              <button
                className="wl-btn wl-btn--danger wl-btn--sm"
                type="submit"
                data-testid="repin-confirmed"
              >
                Yes — record a correction to modification {confirmRepin}
              </button>
              <Link
                className="wl-btn wl-btn--ghost wl-btn--sm"
                href={`/projects/${project.id}/determination`}
              >
                Keep modification {project.wdModificationNumber}
              </Link>
            </form>
          </div>
        </div>
      ) : null}

      <Panel title="Pinned wage determination">
        <ProvenanceCard
          provenance={provenance}
          scope={
            project.countyName
              ? `${project.countyName} County, ${project.stateCode}${project.constructionType ? ` · ${project.constructionType} construction` : ''}`
              : project.stateCode
          }
          classification={`${total} classifications`}
        />
        <p className="wl-sm">
          <OfficialLink
            href={publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)}
            wdNumber={project.wdNumber}
            surface="project_determination"
          >
            ⧉ View the official determination on SAM.gov
          </OfficialLink>{' '}
          ·{' '}
          <Link href={`/projects/${project.id}/determination/text`}>
            Read the determination&rsquo;s own words
          </Link>{' '}
          · <Link href={`/projects/${project.id}/classifications`}>The classification catalogue</Link>
        </p>
        {project.wdPinnedSuperseded ? (
          <p className="wl-sm" data-testid="determination-superseded">
            This project is pinned to modification {project.wdModificationNumber} because your
            contract names it. 29 CFR 1.6 fixes the applicable determination at solicitation or
            award, so it governs the job. This line is a statement of fact; it is not asking you to
            do anything.
          </p>
        ) : null}
      </Panel>

      <Panel title="Modification history">
        {modifications.length === 0 ? (
          <p className="wl-sm wl-muted">
            We hold no modification history for this determination yet. It is pulled from SAM.gov in
            the background; nothing here is invented in the meantime.
          </p>
        ) : (
          <table className="wl-table" data-testid="modification-history">
            <thead>
              <tr>
                <th scope="col">Modification</th>
                <th scope="col">Published</th>
                <th scope="col">Status</th>
                <th scope="col">Pin</th>
              </tr>
            </thead>
            <tbody>
              {modifications.map((entry) => {
                const isPinned = entry.modificationNumber === project.wdModificationNumber;
                return (
                  <tr key={entry.modificationNumber} data-testid="modification-row">
                    <td className="wl-mono">{entry.modificationNumber}</td>
                    <td>{formatDay(entry.publicationDate)}</td>
                    <td>
                      {entry.active ? 'Current' : 'Superseded'}
                      {entry.textHeld ? '' : ' · text not held yet'}
                    </td>
                    <td>
                      {isPinned ? (
                        <StatusPill tone="filed">Pinned</StatusPill>
                      ) : (
                        <form action={repinProjectAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input
                            type="hidden"
                            name="modificationNumber"
                            value={entry.modificationNumber}
                          />
                          <button
                            className="wl-btn wl-btn--ghost wl-btn--sm"
                            type="submit"
                            data-testid={`repin-${entry.modificationNumber}`}
                          >
                            Pin modification {entry.modificationNumber}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="wl-2xs wl-muted">
          {newerModification
            ? `A newer modification (${newerModification.modificationNumber}) was published on ${formatDay(newerModification.publicationDate)}. Your contract governs; we will not move this project for you.`
            : 'This project is pinned to the modification SAM.gov currently publishes as active.'}
          {certified > 0
            ? ` ${certified} payroll${certified === 1 ? ' has' : 's have'} been certified at the current pin, so a move is recorded as a correction.`
            : ''}
        </p>
      </Panel>

      <Panel title="Why the rate was what it was">
        <table className="wl-table" data-testid="pin-history">
          <thead>
            <tr>
              <th scope="col">Determination</th>
              <th scope="col">Modification</th>
              <th scope="col">Pinned</th>
              <th scope="col">Closed</th>
              <th scope="col">Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td className="wl-mono">{entry.wdNumber}</td>
                <td className="wl-mono">{entry.wdModificationNumber}</td>
                <td>{formatDay(entry.pinnedAt)}</td>
                <td>{entry.unpinnedAt ? formatDay(entry.unpinnedAt) : 'open'}</td>
                <td>{entry.reason.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="wl-2xs wl-muted">
          A payroll certified in March under modification 1 must stay explainable in December after
          the project moved to modification 2. Nothing here is overwritten.
        </p>
      </Panel>

      <InlineDisclaimer />
    </>
  );
}
