import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel, StatusPill } from '@/components/primitives';
import { Rate, formatDay } from '@/components/provenance';
import { searchClassifications } from '@/lib/kb';
import {
  DUTIES_MINIMUM_CHARACTERS,
  getConformance,
  getWorker,
} from '@/lib/repositories/workers';
import type { ComparedClassification } from '@/lib/schema';

import { loadProject } from '../../project-context';
import { ProjectTabs } from '../../tabs';
import { completeConformanceAction, recordOutcomeAction, saveConformanceAction } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * 3 · Prepare the request.
 *
 * **You propose; we do not.** The classification, the base rate and the fringe
 * below are the contractor's own — there is no code path in this product that
 * derives a proposed rate, and 29 CFR 5.5(a)(1)(iii)(B) is the reason. What we
 * do is assemble: the duties, the proposal, the listed classifications it was
 * compared against with their rates, the determination and modification, the
 * three criteria, and where it goes.
 *
 * The comparison set has a minimum of two entries because the third criterion
 * is a *reasonable relationship* to the rates already on the determination, and
 * a request with nothing to compare against wastes the thirty days WHD has to
 * answer in.
 */
export default async function ConformanceWorksheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; cid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, cid } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, provenance, db, orgId } = await loadProject(id);
  const worksheet = await getConformance(db, { projectId: project.id, id: cid });
  if (!worksheet) notFound();

  const [worker, catalogue] = await Promise.all([
    worksheet.workerId ? getWorker(db, orgId, worksheet.workerId) : Promise.resolve(undefined),
    searchClassifications(db, project.wdId, { limit: 1000 }),
  ]);

  const compared = (worksheet.comparedClassifications as ComparedClassification[]) ?? [];
  const comparedIds = new Set(compared.map((entry) => entry.kbClassificationId));
  const problems = one('problems') ? one('problems').split('|') : [];

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>3 · Prepare the request</h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link> ·{' '}
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}
            {worker ? ` · ${worker.firstName} ${worker.lastName}` : ''}
          </p>
        </div>
        <StatusPill tone={worksheet.status === 'draft' ? 'draft' : 'filed'}>
          {worksheet.status.replace('_', ' ')}
        </StatusPill>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/crew`} />

      <div className="wl-alert wl-alert--info" role="note" data-testid="not-sf1444">
        <div>
          <p className="wl-alert__title">
            This is a worksheet, not Standard Form SF-1444.
          </p>
          <p className="wl-alert__body">
            Your contracting agency submits the conformance request to{' '}
            <span className="wl-mono">DBAConformance@dol.gov</span>. We can&rsquo;t file it for you
            and neither can any vendor.
          </p>
        </div>
      </div>

      {problems.length > 0 ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="conformance-problems">
          <div>
            <p className="wl-alert__title">This request is not ready to hand over.</p>
            <ul className="wl-alert__body">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {one('completed') ? (
        <div className="wl-alert wl-alert--success" role="status" data-testid="conformance-complete">
          <div>
            <p className="wl-alert__title">Ready for your contracting officer.</p>
            <p className="wl-alert__body">
              Download it and hand it over. WHD answers within 30 days of receipt, or says it needs
              longer.
            </p>
          </div>
        </div>
      ) : null}

      <Panel title="The request">
        <form className="wl-stack" action={completeConformanceAction} id="conformance-form">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="worksheetId" value={worksheet.id} />

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="dutiesDescription">
              Duties performed <span className="wl-req">*</span>
            </label>
            <textarea
              className="wl-textarea"
              id="dutiesDescription"
              name="dutiesDescription"
              rows={6}
              defaultValue={worksheet.dutiesDescription}
              minLength={DUTIES_MINIMUM_CHARACTERS}
            />
            <p className="wl-field__help">
              At least {DUTIES_MINIMUM_CHARACTERS} characters. &ldquo;Does electrical work&rdquo;
              costs thirty days and comes back unanswered — describe the tools, the materials and
              the tasks.
            </p>
          </div>

          <div className="wl-row">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="proposedClassification">
                Proposed classification title <span className="wl-req">*</span>
              </label>
              <input
                className="wl-input"
                id="proposedClassification"
                name="proposedClassification"
                defaultValue={worksheet.proposedClassification}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="proposedBaseRate">
                Proposed base rate <span className="wl-req">*</span>
              </label>
              <input
                className="wl-input wl-input--num"
                id="proposedBaseRate"
                name="proposedBaseRate"
                inputMode="decimal"
                defaultValue={worksheet.proposedBaseRate}
              />
              <p className="wl-field__help">You propose it. We do not, and we never will.</p>
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="proposedFringeRate">
                Proposed fringe <span className="wl-req">*</span>
              </label>
              <input
                className="wl-input wl-input--num"
                id="proposedFringeRate"
                name="proposedFringeRate"
                inputMode="decimal"
                defaultValue={worksheet.proposedFringeRate}
              />
            </div>
          </div>

          <fieldset className="wl-field">
            <legend className="wl-field__label">
              Listed classifications you compared it against{' '}
              <span className="wl-req">* at least two</span>
            </legend>
            <div className="wl-table-wrap wl-scroll-x">
              <table className="wl-table" data-testid="compared-picker">
                <thead>
                  <tr>
                    <th scope="col">Compare</th>
                    <th scope="col">Classification</th>
                    <th scope="col" className="wl-num">
                      Rate
                    </th>
                    <th scope="col" className="wl-num">
                      Fringe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catalogue.rows.slice(0, 200).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="checkbox"
                          name="compared"
                          value={row.id}
                          defaultChecked={comparedIds.has(row.id)}
                          aria-label={`Compare against ${row.classificationLabel}`}
                        />
                      </td>
                      <td>{row.classificationLabel}</td>
                      <td className="wl-num">
                        <Rate base={row.baseRate} provenance={provenance} label="Base rate" />
                      </td>
                      <td className="wl-num">
                        <Rate base={row.fringeRate} provenance={provenance} label="Fringe" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="wl-field__help">
              The third criterion is a reasonable relationship to the rates already on this
              determination, so the request has to show what it was compared against.
            </p>
          </fieldset>

          <div className="wl-row">
            <button className="wl-btn wl-btn--primary" type="submit" data-testid="conformance-complete-button">
              Complete the request
            </button>
            <button
              className="wl-btn wl-btn--secondary"
              type="submit"
              formAction={saveConformanceAction}
            >
              Save the draft
            </button>
            <a
              className="wl-btn wl-btn--secondary"
              href={`/projects/${project.id}/conformance/${worksheet.id}/worksheet`}
              data-testid="conformance-download"
            >
              Download the worksheet (PDF)
            </a>
          </div>
        </form>
      </Panel>

      <Panel title="Record what your agency came back with">
        <form className="wl-row" action={recordOutcomeAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="worksheetId" value={worksheet.id} />
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="status">
              Outcome
            </label>
            <select className="wl-select" id="status" name="status" defaultValue="approved">
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="note">
              Note
            </label>
            <input className="wl-input" id="note" name="note" />
          </div>
          <button className="wl-btn wl-btn--secondary" type="submit">
            Record the outcome
          </button>
        </form>
        <p className="wl-2xs wl-muted">
          An approved conformance applies from the first day that work was performed, so payrolls
          already filed are <strong>not</strong> rewritten — the correction is a back-wage payment
          shown on a later payroll. A denial points back to the listed classifications and to the
          appeals path printed in the determination itself.
        </p>
        {worksheet.outcomeRecordedAt ? (
          <p className="wl-sm">
            Recorded {formatDay(worksheet.outcomeRecordedAt)}: {worksheet.status}
            {worksheet.outcomeNote ? ` — ${worksheet.outcomeNote}` : ''}
          </p>
        ) : null}
      </Panel>

      <InlineDisclaimer />
    </>
  );
}
