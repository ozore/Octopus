/**
 * S12 — `/app/projects/[id]`, the project home.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.4.3 (the block on `unknown`, verbatim, with one
 * button that goes to the one question), §4.4.5 (the band is editable here and
 * changing it never rewrites a filing), §8.3 (the permanent, factual supersession
 * line that never nags), §10.1 (the two California identifiers, and why we cannot
 * get either), §7.6 (the layout flag).
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/db';

import { setBandAction, setLayoutAction } from '../../../_actions/projects';
import { readAs, requireSession } from '../../../_lib/auth';
import { missingContractorFields, readContractorIdentity } from '../../../_lib/ca-identity';
import {
  BAND_CHANGE_NOTE,
  BAND_OPTIONS,
  BAND_QUESTION,
  BAND_UNKNOWN_ACTION,
  BAND_WHERE_TO_READ,
  BAND_WHY_WE_ASK,
  CALIFORNIA_IDENTIFIERS,
} from '../../../_lib/copy';
import { listFilings } from '../../../_lib/filings';
import { pinHistory, standingOf } from '../../../_lib/projects';
import { bandUnknown } from '../../../_lib/refusals';
import { StatusChip } from '../../../_components/status-chip';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/projects/${id}`);
  const db = await getDb();

  const view = await readAs(session, async (tx) => {
    const standing = await standingOf(db, tx, id);
    if (standing === null) return null;
    return {
      standing,
      pins: await pinHistory(tx, id),
      filings: await listFilings(tx, { projectId: id }),
      /* Read only for a Californian project. Forty-nine states' project pages
         should not pay for a query about a form they will never emit — the same
         rule `ecprArtifact` follows before it touches the database. */
      identity:
        standing.project.stateCode.toUpperCase() === 'CA'
          ? await readContractorIdentity(tx)
          : null,
    };
  });

  if (view === null) notFound();
  const { standing } = view;
  const project = standing.project;
  const caIdentifiersReady =
    view.identity !== null &&
    missingContractorFields(view.identity).length === 0 &&
    project.dirProjectId !== null;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>{project.name}</h1>
        <p className="rp-t-lead rp-num">
          {project.countyName}, {project.stateCode} · {project.constructionType} ·{' '}
          {project.fundingSource}
        </p>
        {standing.pin === null ? (
          <p>
            <strong>No revision of record is pinned to this project.</strong> Every filing on it can
            only ever be DRAFT — NOT CERTIFIABLE, and the artifact prints that reason. That is not a
            penalty: certification asserts a revision of record, and there is none here to assert.
          </p>
        ) : (
          <p className="rp-num">
            Pinned: {String(standing.pin.wdNumber)} revision {standing.pin.revision}, published{' '}
            {String(standing.pin.wdPublishedDate)}
            {standing.newer === null
              ? '.'
              : ` · revision ${String(standing.newer.revision)} published ${String(standing.newer.publishDate)}`}
          </p>
        )}
        {standing.newer === null ? null : (
          <p>
            <Link href={`/app/projects/${id}/wd-change`}>
              See what changed, and choose what to do about it
            </Link>
          </p>
        )}
        <div className="rp-btn-row">
          <Link className="rp-btn rp-btn--primary" href={`/app/projects/${id}/imports/new`}>
            Upload this week’s payroll
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          §4.4.3 — the block, verbatim, with one button and no way round it.
          --------------------------------------------------------------- */}
      {project.contractValueBand === 'unknown' ? (
        <RefusalView
          refusal={bandUnknown({ kind: 'onThisScreen', label: BAND_UNKNOWN_ACTION })}
        >
          <form action={setBandAction} className="rp-stack rp-stack--tight">
            <input type="hidden" name="projectId" value={id} />
            <input type="hidden" name="returnTo" value={`/app/projects/${id}`} />
            <fieldset className="rp-fieldset">
              <legend className="rp-field__label">{BAND_QUESTION}</legend>
              {BAND_OPTIONS.filter((option) => option.value !== 'unknown').map((option) => (
                <label className="rp-check" key={option.value}>
                  <input type="radio" name="contractValueBand" value={option.value} />
                  <span className="rp-check__text">{option.label}</span>
                </label>
              ))}
            </fieldset>
            <div className="rp-btn-row">
              <button type="submit" className="rp-btn rp-btn--primary">
                {BAND_UNKNOWN_ACTION}
              </button>
            </div>
          </form>
        </RefusalView>
      ) : (
        <section className="rp-stack rp-measure">
          <h2>Contract value</h2>
          <p>
            You recorded on {project.bandAssertedAt.toISOString().slice(0, 10)} that this contract is{' '}
            {project.contractValueBand === 'over_100k' ? 'over $100,000' : '$100,000 or less'}. Every
            artifact prints that sentence, dated, and names you as its source.
          </p>
          <details className="rp-disclose">
            <summary>Change it</summary>
            <div className="rp-disclose__body rp-stack rp-stack--tight">
              <p>{BAND_WHY_WE_ASK}</p>
              <p>{BAND_WHERE_TO_READ}</p>
              <p>{BAND_CHANGE_NOTE}</p>
              <form action={setBandAction} className="rp-stack rp-stack--tight">
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="returnTo" value={`/app/projects/${id}`} />
                <fieldset className="rp-fieldset">
                  <legend className="rp-field__label">{BAND_QUESTION}</legend>
                  {BAND_OPTIONS.map((option) => (
                    <label className="rp-check" key={option.value}>
                      <input
                        type="radio"
                        name="contractValueBand"
                        value={option.value}
                        defaultChecked={project.contractValueBand === option.value}
                      />
                      <span className="rp-check__text">{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="rp-btn-row">
                  <button type="submit" className="rp-btn rp-btn--quiet">
                    Record this answer
                  </button>
                </div>
              </form>
            </div>
          </details>
        </section>
      )}

      <section className="rp-stack">
        <h2>Filings</h2>
        {view.filings.length === 0 ? (
          <p>Nothing generated for this project yet.</p>
        ) : (
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">Week ending</th>
                  <th scope="col">Status</th>
                  <th scope="col">Generated</th>
                  <th scope="col">Released</th>
                </tr>
              </thead>
              <tbody>
                {view.filings.map((filing) => (
                  <tr key={filing.id}>
                    <th scope="row" className="rp-num">
                      <Link href={`/app/filings/${filing.id}`}>{filing.weekEnding}</Link>
                      {filing.sequence > 1 ? ` · sequence ${String(filing.sequence)}` : ''}
                    </th>
                    <td>
                      <StatusChip status={filing.status} />
                    </td>
                    <td className="rp-num">{filing.generatedAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                    <td className="rp-num">
                      {filing.releasedAt === null
                        ? '—'
                        : filing.releasedAt.toISOString().slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rp-stack">
        <h2>Pins on this project</h2>
        <p>
          A re-pin is a new row and the old one is kept forever. This is the record of what this
          project asserted, and when.
        </p>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">Determination</th>
                <th scope="col">Revision</th>
                <th scope="col">Published</th>
                <th scope="col">Pinned at</th>
              </tr>
            </thead>
            <tbody>
              {view.pins.map((pin) => (
                <tr key={pin.id}>
                  <th scope="row" className="rp-num">
                    {String(pin.wdNumber)}
                  </th>
                  <td className="rp-td--num">{pin.revision}</td>
                  <td className="rp-td--num">{String(pin.wdPublishedDate)}</td>
                  <td className="rp-td--num">{pin.pinnedAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          §10.1 — California, and ONLY California.

          This block used to render on every project, so a Virginia subcontractor
          was asked for a PWCR she can never have and a DIR Project ID no awarding
          body will ever file for her. The gate is the project's own state, checked
          here rather than inside the form, so the fields are not merely disabled —
          they are not on the page. The 49-state case is not given a refusal either:
          there is nothing to refuse, because nothing was offered.
          --------------------------------------------------------------- */}
      {project.stateCode.toUpperCase() === 'CA' ? (
        <section className="rp-stack rp-measure">
          <h2>California DIR</h2>
          <p>{CALIFORNIA_IDENTIFIERS}</p>
          <p>
            {caIdentifiersReady
              ? 'DIR’s required block is complete. Filings on this project offer the eCPR XML beside the WH-347, each with its own status.'
              : 'Until those are on file the eCPR XML is blocked and says which value is missing. The WH-347 PDF is unaffected either way.'}
          </p>
          <div className="rp-btn-row">
            <Link className="rp-btn rp-btn--quiet" href={`/app/projects/${id}/dir`}>
              {caIdentifiersReady ? 'Review the DIR identifiers' : 'Add the DIR identifiers'}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rp-stack rp-measure">
        <h2>Form layout</h2>
        <p>
          The widely repeated cutover date for the revised WH-347 is vendor-asserted with no
          Department of Labor source, so Ratepin ships both layouts and lets the receiving party
          decide. If your general contractor’s clerk rejects one, switch to the other.
        </p>
        <form action={setLayoutAction} className="rp-stack rp-stack--tight">
          <input type="hidden" name="projectId" value={id} />
          <fieldset className="rp-fieldset">
            <legend className="rp-field__label">Layout</legend>
            <label className="rp-check">
              <input
                type="radio"
                name="layout"
                value="wh347_rev_2025_01"
                defaultChecked={project.wh347Layout === 'wh347_rev_2025_01'}
              />
              <span className="rp-check__text">WH-347, Rev. January 2025</span>
            </label>
            <label className="rp-check">
              <input
                type="radio"
                name="layout"
                value="wh347_legacy"
                defaultChecked={project.wh347Layout === 'wh347_legacy'}
              />
              <span className="rp-check__text">WH-347, legacy layout</span>
            </label>
          </fieldset>
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--quiet">
              Use this layout
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
