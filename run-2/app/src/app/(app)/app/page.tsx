/**
 * `/app` — the project list. The way in to every other screen.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.5 ("there are **no project caps at any tier**. The
 * plan meters filings, not projects"), §8.3 (a superseded pin shows a permanent,
 * factual line that never nags), §0.6.
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { readAs, requireSession } from '../_lib/auth';
import { appClock } from '../_lib/deps';
import { listProjects, standingOf } from '../_lib/projects';
import { listFilings } from '../_lib/filings';
import { StatusChip } from '../_components/status-chip';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Projects — Ratepin' };

export default async function ProjectsPage(): Promise<React.ReactElement> {
  const session = await requireSession('/app');
  const db = await getDb();
  const now = appClock().now();

  const view = await readAs(session, async (tx) => {
    const projects = await listProjects(tx);
    const standings = [];
    for (const project of projects) {
      const standing = await standingOf(db, tx, project.id);
      if (standing) standings.push(standing);
    }
    const filings = await listFilings(tx);
    return { standings, filings };
  });

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Projects</h1>
        <p className="rp-t-lead">
          One project per job, each with a determination pinned to it. There is no cap on projects
          at any tier — the plan meters certified filings, not jobs.
        </p>
        <div className="rp-btn-row">
          <Link className="rp-btn rp-btn--primary" href="/app/projects/new">
            Set up a project
          </Link>
          <Link className="rp-btn rp-btn--quiet" href="/app/week">
            This week’s board
          </Link>
        </div>
      </section>

      {view.standings.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">No projects yet</p>
          <p className="rp-empty__body">
            Six fields sets one up: a name, the state and county, the construction type, the funding
            source, the determination, and whether the prime contract is over $100,000. The last one
            has no default in either direction, and the reason is on the form.
          </p>
        </div>
      ) : (
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">Projects, their pins and their standing</caption>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Determination</th>
                <th scope="col">Standing</th>
                <th scope="col">Contract value</th>
              </tr>
            </thead>
            <tbody>
              {view.standings.map((standing) => (
                <tr key={standing.project.id}>
                  <th scope="row">
                    <Link href={`/app/projects/${standing.project.id}`}>{standing.project.name}</Link>
                    <span className="rp-t-micro">
                      {' '}
                      {standing.project.countyName}, {standing.project.stateCode} ·{' '}
                      {standing.project.constructionType}
                    </span>
                  </th>
                  <td className="rp-num">
                    {standing.pin === null
                      ? 'no pin'
                      : `${String(standing.pin.wdNumber)} rev ${String(standing.pin.revision)} · published ${String(standing.pin.wdPublishedDate)}`}
                  </td>
                  <td>
                    {standing.standing === 'unpinned' ? (
                      <span>
                        Unpinned. Every filing on this project can only ever be a draft, and the
                        artifact says so.
                      </span>
                    ) : standing.newer === null ? (
                      <span>Pinned revision is the current one.</span>
                    ) : (
                      <span className="rp-num">
                        pinned rev {standing.pin?.revision ?? 0} · rev {standing.newer.revision}{' '}
                        published {String(standing.newer.publishDate)} ·{' '}
                        <Link href={`/app/projects/${standing.project.id}/wd-change`}>
                          see what changed
                        </Link>
                      </span>
                    )}
                  </td>
                  <td>
                    {standing.project.contractValueBand === 'unknown' ? (
                      <Link href={`/app/projects/${standing.project.id}`}>unanswered</Link>
                    ) : standing.project.contractValueBand === 'over_100k' ? (
                      'over $100,000'
                    ) : (
                      '$100,000 or less'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="rp-stack">
        <h2>Recent filings</h2>
        {view.filings.length === 0 ? (
          <p>Nothing generated yet.</p>
        ) : (
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">Week ending</th>
                  <th scope="col">Project</th>
                  <th scope="col">Status</th>
                  <th scope="col">Billed</th>
                </tr>
              </thead>
              <tbody>
                {view.filings.slice(0, 20).map((filing) => (
                  <tr key={filing.id}>
                    <th scope="row" className="rp-num">
                      <Link href={`/app/filings/${filing.id}`}>{filing.weekEnding}</Link>
                      {filing.sequence > 1 ? ` · amendment ${String(filing.sequence)}` : ''}
                    </th>
                    <td>{filing.projectName}</td>
                    <td>
                      <StatusChip status={filing.status} />
                    </td>
                    <td>{filing.billable ? 'yes' : 'no — drafts are never billed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="rp-t-micro rp-num">Read at {now.toISOString().slice(0, 16).replace('T', ' ')} UTC</p>
      </section>
    </div>
  );
}
