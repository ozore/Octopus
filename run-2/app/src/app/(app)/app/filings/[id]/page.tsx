/**
 * S16 — `/app/filings/[id]`, review and download.
 *
 * AUTHORITY: `USER_JOURNEY.md` §7.1 (what the screen shows, in this order: the
 * status chip first, then the artifact, then the provenance panel, then the
 * downloads, then the boundary statement), §7.2 (the three statuses and the rule
 * that separates them), §7.3 (the provenance footer), §10.2 (**two chips, never
 * one** — the PDF may be certifiable while the CA XML is blocked), §4.4.3 (the band
 * block, rendered above the preview).
 *
 * ===========================================================================
 * DRAFT REPLACES THE SIGNATURE BLOCK STRUCTURALLY
 *
 * Not a banner over it, not a disabled button beside it: the signature block is not
 * in the document. `rendersSignatureBlock(verdict)` is the only thing this screen
 * asks, and on a draft the space carries the withheld notice instead — a warning can
 * be clicked past, a missing signature block cannot.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { WITHHELD_BODY, WITHHELD_HEADLINE } from '@/artifacts';
import { getDb } from '@/db';
import { rendersSignatureBlock } from '@/engine';

import { confirmAcceptanceAction, releaseFilingAction } from '../../../_actions/filings';
import { ArtifactChip, StatusChip } from '../../../_components/status-chip';
import { readAs, requireSession } from '../../../_lib/auth';
import {
  BAND_UNKNOWN_ACTION,
  DRAFT_NEVER_BILLED,
  FRESHNESS_NEVER_DRAFTS,
  THREE_DRAFT_CONDITIONS,
  WE_DO_NOT_FILE,
} from '../../../_lib/copy';
import { ecprArtifact, listArtifacts, rebuildFiling } from '../../../_lib/filings';
import { readProject } from '../../../_lib/projects';
import { bandUnknown } from '../../../_lib/refusals';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export default async function FilingPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/filings/${id}`);
  const db = await getDb();
  const query = searchParams === undefined ? {} : await searchParams;
  const confirmed = typeof query['confirmed'] === 'string' ? (query['confirmed'] as string) : null;

  const view = await readAs(session, async (tx) => {
    const rebuilt = await rebuildFiling(db, tx, id);
    if (rebuilt === null) return null;
    const project = await readProject(tx, rebuilt.filing.projectId);
    if (project === null) return null;
    /**
     * R-BUILD C-3. The screen BUILDS the California XML rather than predicting it.
     * The chip below and the Download link beside it are both derived from this one
     * answer, and the link is rendered only on the arm that carries bytes — so the
     * screen can no longer offer a file `/api/artifacts` cannot serve, which is what
     * it did for every California project that cleared the old chip's four checks.
     */
    return {
      rebuilt,
      project,
      artifacts: await listArtifacts(tx, id),
      xml: await ecprArtifact(db, tx, { rebuilt, project }),
    };
  });

  if (view === null) notFound();

  const { rebuilt, project, xml } = view;
  const { filing, verdict, artifact, computation } = rebuilt;
  const signature = rendersSignatureBlock(verdict);

  return (
    <div className="rp-stack rp-stack--section">
      {/* 1 — the status chip, first thing on the page. */}
      <section className="rp-stack">
        <StatusChip status={filing.status} large />
        <h1>
          {project.name} · week ending {filing.weekEnding}
          {filing.sequence > 1 ? ` · sequence ${String(filing.sequence)}` : ''}
        </h1>
        <p className="rp-t-micro">{FRESHNESS_NEVER_DRAFTS}</p>
        {filing.status === 'DRAFT_NOT_CERTIFIABLE' ? (
          <p className="rp-t-micro">{THREE_DRAFT_CONDITIONS}</p>
        ) : null}
      </section>

      {/* §4.4.3 — the band block, above the preview, with one button. */}
      {project.contractValueBand === 'unknown' ? (
        <RefusalView
          refusal={bandUnknown({
            kind: 'link',
            label: BAND_UNKNOWN_ACTION,
            href: `/app/projects/${project.id}`,
          })}
        />
      ) : null}

      {/* 2 — the artifact. The screen prints what the paper prints, from the same
             struct: nothing here recomputes a figure. */}
      <section className="rp-stack">
        <h2>The form</h2>
        <div className="rp-sheet">
          <div className="rp-sheet__body">
            <div className="rp-tablewrap">
              <table className="rp-table">
                <caption className="rp-sr-only">WH-347 lines as rendered</caption>
                <thead>
                  <tr>
                    <th scope="col">1B/1C — Name</th>
                    <th scope="col">3 — Classification</th>
                    <th scope="col" className="rp-th--num">
                      5 — Hours
                    </th>
                    <th scope="col" className="rp-th--num">
                      6A — Rate
                    </th>
                    <th scope="col" className="rp-th--num">
                      7A — Gross this project
                    </th>
                    <th scope="col" className="rp-th--num">
                      9 — Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {artifact.workers.map((worker) => (
                    <tr key={worker.entryNumber}>
                      <th scope="row">
                        {worker.lastName}, {worker.firstName}
                        <span className="rp-td--id"> {worker.identifyingNumber ?? ''}</span>
                      </th>
                      <td>
                        {worker.lines.map((line) => line.col3Classification).join(' · ')}
                      </td>
                      <td className="rp-td--num">
                        {worker.lines.map((line) => line.col5TotalHours).join(' · ')}
                      </td>
                      <td className="rp-td--num">
                        {worker.lines.map((line) => line.col6AStraightTime).join(' · ')}
                      </td>
                      <td className="rp-td--num">{worker.col7AGross}</td>
                      <td className="rp-td--num">{worker.col9NetPaid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {signature ? (
              <div className="rp-signature">
                <p className="rp-signature__caption">
                  Statement of compliance — signed by the contractor, not by Ratepin.
                </p>
                <span className="rp-signature__line" aria-hidden="true" />
              </div>
            ) : (
              <div className="rp-signature rp-signature--withheld">
                <p className="rp-signature__withheld-title">{WITHHELD_HEADLINE}</p>
                <p className="rp-signature__withheld-why">{WITHHELD_BODY}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 — the provenance panel: the footer's content, shown large. */}
      <section className="rp-stack">
        <h2>Provenance</h2>
        <div className="rp-prov">
          {artifact.footer.map((line) => (
            <p key={line.id} className={line.numeric ? 'rp-prov__claim rp-num' : 'rp-prov__claim'}>
              {line.text}
            </p>
          ))}
        </div>
      </section>

      {/* 4 — downloads, with TWO chips. */}
      <section className="rp-stack">
        <h2>Download</h2>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">Artifact</th>
                <th scope="col">Status</th>
                <th scope="col">Get it</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">WH-347 PDF</th>
                <td>
                  <StatusChip status={filing.status} />
                </td>
                <td>
                  <form action={releaseFilingAction}>
                    <input type="hidden" name="filingId" value={id} />
                    <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
                      Mark released and download
                    </button>
                  </form>
                  <p className="rp-t-micro">
                    <Link href={`/api/artifacts/${id}?kind=wh347_pdf`}>Direct link</Link>
                  </p>
                </td>
              </tr>
              {rebuilt.exceptions.length === 0 ? null : (
                <tr>
                  <th scope="row">Exception report</th>
                  <td>{rebuilt.exceptions.length} lines</td>
                  <td>
                    <Link href={`/api/artifacts/${id}?kind=exception_report`}>Download</Link>
                  </td>
                </tr>
              )}
              <tr>
                <th scope="row">CA eCPR XML</th>
                <td>
                  <ArtifactChip
                    blocked={xml.kind === 'blocked'}
                    label={xml.kind === 'blocked' ? 'Blocked' : 'Generated, not acceptance-tested'}
                  />
                </td>
                <td>
                  {xml.kind === 'blocked' ? (
                    <span className="rp-t-data">why?</span>
                  ) : (
                    <>
                      <Link href={`/api/artifacts/${id}?kind=ecpr_xml`}>Download</Link>
                      {/* The file exists: it was built to render this row, and the
                          figures below are read off it rather than described. */}
                      <p className="rp-t-micro rp-num">
                        {xml.artifact.employeeCount} employee records · schema{' '}
                        {String(xml.artifact.xsdSha256).slice(0, 12)}
                        {xml.artifact.xsdObservedAt === null
                          ? ' · no dated observation of DIR’s published schema is on record in this build'
                          : ` · DIR served this digest as of ${xml.artifact.xsdObservedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`}
                      </p>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* A refusal from the emitter is rendered by the component that owns the
            four primitives, because it carries the per-worker exception report the
            customer has to act on — the missing field, named, worker by worker. A
            hand-rolled alert here would print the headline and silently drop the
            list, which is the difference between "something is missing" and "add a
            withholding-exemption count for Dee Alvarado". */}
        {xml.kind === 'blocked' ? (
          <div className="rp-stack rp-stack--tight">
            <RefusalView refusal={xml.refusal} />
            <p className="rp-t-micro">{WE_DO_NOT_FILE}</p>
          </div>
        ) : null}

        <p className="rp-t-micro">{DRAFT_NEVER_BILLED}</p>
        <p className="rp-t-micro rp-num">
          {view.artifacts
            .map((row) => `${row.kind} ${row.sha256.slice(0, 12)} · ${row.byteSize} bytes`)
            .join(' · ')}
        </p>
      </section>

      {/* The engine's own refusals, rendered as the four primitives and nothing else. */}
      {rebuilt.refusals.length > 0 ? (
        <section className="rp-stack">
          <h2>Exceptions</h2>
          {rebuilt.refusals.map((refusal, index) => (
            <RefusalView key={`${refusal.primitive}-${String(index)}`} refusal={refusal} />
          ))}
        </section>
      ) : null}

      {/* ============================================================== G2 ==
          The acceptance counter, and the only place it can be written.

          §14 instruments G2 on "in-product confirmation", because whether a general
          contractor or a state portal ACCEPTED a document is unobservable from
          inside this system — a download is not an acceptance and a silence is not
          one either. Nothing in the product may infer it, so this pair of buttons is
          the entire evidence path for the gate that stands between this company and
          any claim about forms being accepted. A rejection is recorded exactly as
          readily as an acceptance; a counter that only hears good news is not one. */}
      <section className="rp-stack rp-measure">
        <h2>Did the receiving party accept it?</h2>
        <p>
          This is the only way Ratepin learns the answer, and it is what the public acceptance
          counter on <Link href="/status">the status page</Link> is made of. Answering costs you
          nothing and buys you nothing; not answering leaves the counter where it is. A rejection is
          as useful to us as an acceptance, and is recorded the same way.
        </p>
        <form action={confirmAcceptanceAction} className="rp-stack rp-stack--tight">
          <input type="hidden" name="filingId" value={id} />
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="artifactKind">
              Which document
            </label>
            <select id="artifactKind" name="artifactKind" className="rp-input" defaultValue="wh347_pdf">
              <option value="wh347_pdf">The WH-347 and statement of compliance</option>
              <option value="ecpr_xml">The California eCPR XML</option>
            </select>
          </div>
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="receiver">
              Who received it
            </label>
            <select id="receiver" name="receiver" className="rp-input" defaultValue="gc">
              <option value="gc">The general contractor</option>
              <option value="agency">The contracting agency</option>
              <option value="dir_portal">California DIR&rsquo;s portal</option>
            </select>
          </div>
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="rejectionDetail">
              If it was rejected, what did they say (optional)
            </label>
            <input
              id="rejectionDetail"
              name="rejectionDetail"
              className="rp-input"
              autoComplete="off"
            />
          </div>
          <div className="rp-btn-row">
            <button type="submit" name="accepted" value="true" className="rp-btn">
              They accepted it
            </button>
            <button type="submit" name="accepted" value="false" className="rp-btn rp-btn--quiet">
              They rejected it
            </button>
          </div>
        </form>
        {confirmed === null ? null : (
          <p className="rp-t-data">
            {confirmed === 'accepted'
              ? 'Recorded as accepted. The counter moves on the next refresh.'
              : 'Recorded as rejected, with what they said. The counter moves on the next refresh, ' +
                'and a rejection is what the gate is for.'}
          </p>
        )}
      </section>

      <section className="rp-stack">
        <h2>Totals, as computed</h2>
        <dl className="rp-stack rp-stack--tight">
          <div className="rp-row rp-row--between">
            <dt>Column 7A — gross on this project</dt>
            <dd className="rp-num">{artifact.totals.col7A}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Column 7B — gross, all work this week</dt>
            <dd className="rp-num">{artifact.totals.col7B}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Column 8 — deductions</dt>
            <dd className="rp-num">{artifact.totals.deductions}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Hours worked</dt>
            <dd className="rp-num">{artifact.totals.hoursWorked}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Contract Work Hours and Safety Standards Act premium</dt>
            <dd className="rp-num">{artifact.totals.cwhssaPremium}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Workers on this week</dt>
            <dd className="rp-num">{computation.workers.length}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
