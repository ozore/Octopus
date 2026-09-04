import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel, StatusPill } from '@/components/primitives';
import { Rate, formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { crewForProject, listApprenticeshipPrograms } from '@/lib/repositories/workers';

import { loadProject } from '../project-context';
import { ProjectTabs } from '../tabs';
import { addWorkerAction, archiveWorkerAction, unmapClassificationAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/crew` — the roster, and the mapping that makes column (3) of
 * the WH-347 fillable.
 *
 * **Nothing here is auto-classified** (V12, OFFER §5.2 G4). The picker searches
 * the project's own determination and offers "none of these match" as a
 * persistent secondary action; it never guesses, and there is no bulk
 * "classify everyone" control that would let one click decide twelve legal
 * judgements.
 *
 * The rate and fringe on each row are the ones COPIED at mapping time, not a
 * live join: a payroll certified in March must print the same numbers in
 * December. Both go through `<Rate>`, so every figure on this page carries the
 * determination and modification it came from (gate G8).
 */
export default async function CrewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, provenance, db, orgId, userId } = await loadProject(id);
  const [crew, programs] = await Promise.all([
    crewForProject(db, { orgId, projectId: project.id }),
    listApprenticeshipPrograms(db, orgId),
  ]);
  const unmapped = crew.filter((member) => member.mapping === null);

  if (unmapped.length > 0) {
    await emitEvent(db, 'crew_unmapped_banner_shown', {
      orgId,
      userId,
      props: { count: unmapped.length },
    });
  }

  const error = one('error');

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>The crew</h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link> ·{' '}
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}
          </p>
        </div>
        <Link className="wl-btn wl-btn--secondary" href={`/projects/${project.id}/crew/paste`}>
          Paste a list
        </Link>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/crew`} />

      {error === 'full_number' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="full-number-blocked">
          <div>
            <p className="wl-alert__title">
              Enter only the last four digits — federal rules forbid the full number on a certified
              payroll.
            </p>
            <p className="wl-alert__body">
              29 CFR 5.5(a)(3)(ii)(B). Nothing was stored, and we did not shorten what you typed:
              this product has no column that can hold a full identifying number.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'apprenticeship' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="apprenticeship-required">
          <div>
            <p className="wl-alert__title">A registered apprentice needs a programme.</p>
            <p className="wl-alert__body">
              Page 2 of the WH-347 asks for the apprenticeship programme name and the registered
              classification, so both are required before the worker can be saved.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'worker_fields' ? (
        <div className="wl-alert wl-alert--error" role="alert">
          <div>
            <p className="wl-alert__title">A worker needs a first name, a last name and four digits.</p>
          </div>
        </div>
      ) : null}
      {one('duplicate') ? (
        <div className="wl-alert wl-alert--warn" role="status" data-testid="duplicate-warning">
          <div>
            <p className="wl-alert__title">
              Another worker has that surname and those four digits.
            </p>
            <p className="wl-alert__body">
              That happens, and the form has no other identifier, so we added them anyway. Check the
              first names.
            </p>
          </div>
        </div>
      ) : null}
      {one('pasted') ? (
        <div className="wl-alert wl-alert--success" role="status">
          <div>
            <p className="wl-alert__title">{one('pasted')} workers added.</p>
            <p className="wl-alert__body">
              Map each of them to a classification — that is a decision per worker, and it is yours.
            </p>
          </div>
        </div>
      ) : null}

      {unmapped.length > 0 ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="unmapped-banner">
          <div>
            <p className="wl-alert__title">
              {unmapped.length} worker{unmapped.length === 1 ? ' has' : 's have'} no classification.
            </p>
            <p className="wl-alert__body">
              You can&rsquo;t certify a payroll until they do.{' '}
              <Link
                href={`/projects/${project.id}/crew/${unmapped[0]?.worker.id}/map`}
                data-testid="unmapped-first"
              >
                Start with {unmapped[0]?.worker.firstName} {unmapped[0]?.worker.lastName}
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      {crew.length === 0 ? (
        <Panel title="No workers yet">
          <p className="wl-sm">
            Add the workers who&rsquo;ll be on this job. You need a first name, a last name and the
            last four digits of the identifying number — never more than four, because the weekly
            transmittal may not carry more.
          </p>
        </Panel>
      ) : (
        <Panel title={`${crew.length} on the roster`}>
          <div className="wl-table-wrap wl-scroll-x">
            <table className="wl-table" data-testid="crew-table">
              <thead>
                <tr>
                  <th scope="col">Worker</th>
                  <th scope="col">Status</th>
                  <th scope="col">Classification</th>
                  <th scope="col" className="wl-num">
                    Rate
                  </th>
                  <th scope="col" className="wl-num">
                    Fringe
                  </th>
                  <th scope="col">Mapped</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {crew.map(({ worker, mapping }) => (
                  <tr key={worker.id} data-testid="crew-row">
                    <td>
                      {worker.lastName}, {worker.firstName}
                      {worker.middleInitial ? ` ${worker.middleInitial}` : ''}{' '}
                      <span className="wl-mono wl-2xs wl-muted">
                        ····{worker.identifyingNoLast4}
                      </span>
                    </td>
                    <td>
                      <StatusPill tone={worker.defaultStatus === 'RA' ? 'draft' : 'none'}>
                        {worker.defaultStatus === 'RA' ? 'RA' : 'J'}
                      </StatusPill>
                    </td>
                    <td>
                      {mapping ? (
                        <>
                          {mapping.classificationLabel}
                          {mapping.source !== 'wage_determination' ? (
                            <span className="wl-2xs wl-muted">
                              {' '}
                              · {mapping.source.replace('_', ' ')}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <Link
                          href={`/projects/${project.id}/crew/${worker.id}/map`}
                          data-testid="map-link"
                        >
                          Map a classification
                        </Link>
                      )}
                    </td>
                    <td className="wl-num">
                      {mapping ? (
                        <Rate
                          base={mapping.baseRate}
                          provenance={{
                            ...provenance,
                            wdNumber: mapping.wdNumber,
                            modificationNumber: mapping.wdModificationNumber,
                          }}
                          label="Base rate"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="wl-num">
                      {mapping ? (
                        <Rate
                          base={mapping.fringeRate}
                          provenance={{
                            ...provenance,
                            wdNumber: mapping.wdNumber,
                            modificationNumber: mapping.wdModificationNumber,
                          }}
                          label="Fringe"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="wl-xs">{mapping ? formatDay(mapping.mappedAt) : '—'}</td>
                    <td className="wl-row">
                      <Link
                        className="wl-btn wl-btn--ghost wl-btn--sm"
                        href={`/projects/${project.id}/crew/${worker.id}/map`}
                      >
                        {mapping ? 'Change' : 'Map'}
                      </Link>
                      {mapping ? (
                        <form action={unmapClassificationAction}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="workerId" value={worker.id} />
                          <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
                            Unmap
                          </button>
                        </form>
                      ) : null}
                      <form action={archiveWorkerAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input type="hidden" name="workerId" value={worker.id} />
                        <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
                          Archive
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wl-2xs wl-muted">
            Unmapping is history, not deletion: a worker on a certified payroll keeps the
            classification and the rates that payroll printed.
          </p>
        </Panel>
      )}

      <Panel title="Add a worker">
        <form className="wl-stack" action={addWorkerAction} data-testid="add-worker-form">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="wl-row">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="firstName">
                First name <span className="wl-req">*</span>
              </label>
              <input className="wl-input" id="firstName" name="firstName" required />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="lastName">
                Last name <span className="wl-req">*</span>
              </label>
              <input className="wl-input" id="lastName" name="lastName" required />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="middleInitial">
                Middle initial
              </label>
              <input
                className="wl-input"
                id="middleInitial"
                name="middleInitial"
                maxLength={1}
                size={2}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="identifyingNoLast4">
                Last four digits <span className="wl-req">*</span>
              </label>
              <input
                className="wl-input wl-input--num"
                id="identifyingNoLast4"
                name="identifyingNoLast4"
                required
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
              />
              <p className="wl-field__help">
                Four digits only. 29 CFR 5.5(a)(3)(ii)(B) forbids the full number on a certified
                payroll, and there is no column here that could hold one.
              </p>
            </div>
          </div>

          <fieldset className="wl-field">
            <legend className="wl-field__label">Status</legend>
            <label>
              <input type="radio" name="defaultStatus" value="J" defaultChecked /> (J)
              Journeyworker
            </label>{' '}
            <label>
              <input type="radio" name="defaultStatus" value="RA" /> (RA) Registered apprentice
            </label>
          </fieldset>

          <div className="wl-row">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="apprenticeshipProgramId">
                Apprenticeship programme
              </label>
              <select
                className="wl-select"
                id="apprenticeshipProgramId"
                name="apprenticeshipProgramId"
                defaultValue=""
              >
                <option value="">None</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.programName} ({program.registrar})
                  </option>
                ))}
              </select>
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="newApprenticeshipProgram">
                &hellip;or add one
              </label>
              <input
                className="wl-input"
                id="newApprenticeshipProgram"
                name="newApprenticeshipProgram"
                placeholder="Gulf Coast Electrical JATC"
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="registrar">
                Registrar
              </label>
              <select className="wl-select" id="registrar" name="registrar" defaultValue="OA">
                <option value="OA">OA — federal Office of Apprenticeship</option>
                <option value="SAA">SAA — State Apprenticeship Agency</option>
              </select>
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="registeredClassification">
                Registered classification
              </label>
              <input
                className="wl-input"
                id="registeredClassification"
                name="registeredClassification"
              />
              <p className="wl-field__help">
                Required for a registered apprentice: page 2 of the form asks for it.
              </p>
            </div>
          </div>

          <p>
            <button className="wl-btn wl-btn--primary" type="submit" data-testid="add-worker">
              Add worker
            </button>
          </p>
        </form>
      </Panel>

      <InlineDisclaimer />
    </>
  );
}
