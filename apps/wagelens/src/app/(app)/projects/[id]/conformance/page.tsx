import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel, StatusPill } from '@/components/primitives';
import { formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { getWorker, listConformances } from '@/lib/repositories/workers';

import { loadProject } from '../project-context';
import { ProjectTabs } from '../tabs';
import { startConformanceAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * The conformance guide — three screens, in this order, and the worksheet is
 * unreachable until the second has been seen.
 *
 * **The order is the product.** 29 CFR 5.5(a)(1)(iii)(B) says the conformance
 * process may not be used to split, subdivide or otherwise avoid a
 * classification that is already listed — and nine times in ten "nothing
 * matches" means the row has not been found yet. So screen 1 searches harder,
 * screen 2 explains what a conformance actually is and who files it, and only
 * screen 2's button brings a worksheet into existence. There is no URL that
 * skips them, because there is no worksheet row to open.
 *
 * **We never propose a classification and never propose a rate.** The
 * worksheet's fields are the customer's; the contracting agency submits it.
 */
export default async function ConformanceGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, db, orgId, userId } = await loadProject(id);
  const step = one('step') === '2' ? 2 : 1;
  const workerId = one('worker');
  const searches = Number(one('searches') || '0') || 0;
  const worker = workerId ? await getWorker(db, orgId, workerId) : undefined;
  const existing = await listConformances(db, project.id);

  await emitEvent(db, 'conformance_guide_step_viewed', {
    orgId,
    userId,
    props: { step },
  });
  if (step === 1) {
    await emitEvent(db, 'classification_none_match_clicked', {
      orgId,
      userId,
      props: { searches_before: searches },
    });
  }

  const carry = `worker=${workerId}&searches=${searches}`;

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>When nothing on the determination matches</h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link> ·{' '}
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}
            {worker ? ` · ${worker.firstName} ${worker.lastName}` : ''}
          </p>
        </div>
        <StatusPill tone="draft">Step {step} of 3</StatusPill>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/crew`} />

      {step === 1 ? (
        <Panel title="1 · Look again first">
          <p className="wl-lead" data-testid="conformance-step-1">
            Classification follows the <strong>work actually performed</strong> — not the job title,
            and not what you call them on private jobs.
          </p>
          <p className="wl-sm">
            Most of the time the row is there under a word you would not have searched for:
            &ldquo;OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE&rdquo; rather than &ldquo;digger&rdquo;,
            &ldquo;LABORER: COMMON OR GENERAL&rdquo; rather than &ldquo;helper&rdquo;. A conformance
            takes thirty days; a broader search takes ten seconds.
          </p>
          <p className="wl-row">
            <Link
              className="wl-btn wl-btn--secondary"
              href={`/projects/${project.id}/classifications`}
              data-testid="conformance-broader-search"
            >
              Search the determination again
            </Link>
            <Link
              className="wl-btn wl-btn--secondary"
              href={`/projects/${project.id}/determination/text`}
            >
              Read the determination in full
            </Link>
            <Link
              className="wl-btn wl-btn--primary"
              href={`/projects/${project.id}/conformance?step=2&${carry}`}
              data-testid="conformance-continue"
            >
              Nothing fits — what is a conformance?
            </Link>
          </p>
        </Panel>
      ) : (
        <Panel title="2 · What a conformance is">
          <div className="wl-stack-2" data-testid="conformance-step-2">
            <p className="wl-sm">
              A request to your <strong>contracting agency</strong> to add a classification and rate
              to the determination for this contract. Three criteria, and{' '}
              <strong>all three must be true</strong>:
            </p>
            <ol>
              <li>
                The work performed is <strong>not</strong> performed by a classification already
                listed in the wage determination.
              </li>
              <li>The proposed classification is used in the area by the construction industry.</li>
              <li>
                The proposed wage rate, including any fringe benefits, bears a{' '}
                <strong>reasonable relationship</strong> to the rates on the determination.
              </li>
            </ol>
            <p className="wl-sm">
              <strong>Who files it:</strong> your contracting agency, to{' '}
              <span className="wl-mono">DBAConformance@dol.gov</span>. Not you, not us, and not any
              vendor. The Wage and Hour Division will approve, modify or disapprove within{' '}
              <strong>30 days</strong> of receipt, or say it needs longer.
            </p>
            <p className="wl-sm">
              <strong>What it may not be used for:</strong> &ldquo;The conformance process may not
              be used to split, subdivide, or otherwise avoid application of classifications listed
              in the wage determination.&rdquo; 29 CFR 5.5(a)(1)(iii)(B).
            </p>
            <p className="wl-sm">
              <strong>Meanwhile:</strong> pay at least the rate of the closest listed classification
              and file on time. An approved conformance applies from the first day that work was
              performed, so the correction is a back-wage payment on a later payroll — we do not
              rewrite a signed federal statement.
            </p>
            <form action={startConformanceAction} className="wl-row">
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="workerId" value={workerId} />
              <input type="hidden" name="searchesBefore" value={searches} />
              <button
                className="wl-btn wl-btn--primary"
                type="submit"
                data-testid="conformance-start"
              >
                Prepare the request
              </button>
              <Link
                className="wl-btn wl-btn--ghost"
                href={`/projects/${project.id}/conformance?${carry}`}
              >
                Back to step 1
              </Link>
            </form>
          </div>
        </Panel>
      )}

      {existing.length > 0 ? (
        <Panel title="Worksheets on this project">
          <table className="wl-table" data-testid="conformance-list">
            <thead>
              <tr>
                <th scope="col">Proposed classification</th>
                <th scope="col">Status</th>
                <th scope="col">Started</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {existing.map((worksheet) => (
                <tr key={worksheet.id}>
                  <td>{worksheet.proposedClassification || 'not yet named'}</td>
                  <td>{worksheet.status.replace('_', ' ')}</td>
                  <td>{formatDay(worksheet.createdAt)}</td>
                  <td>
                    <Link
                      className="wl-btn wl-btn--ghost wl-btn--sm"
                      href={`/projects/${project.id}/conformance/${worksheet.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      <InlineDisclaimer />
    </>
  );
}
