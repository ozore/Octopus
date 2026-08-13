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

import { releaseFilingAction } from '../../../_actions/filings';
import { ArtifactChip, StatusChip } from '../../../_components/status-chip';
import { readAs, requireSession } from '../../../_lib/auth';
import {
  BAND_UNKNOWN_ACTION,
  BAND_UNKNOWN_BODY,
  BAND_UNKNOWN_HEADLINE,
  DRAFT_NEVER_BILLED,
  FRESHNESS_NEVER_DRAFTS,
  THREE_DRAFT_CONDITIONS,
  WE_DO_NOT_FILE,
} from '../../../_lib/copy';
import { ecprChip, listArtifacts, rebuildFiling } from '../../../_lib/filings';
import { readProject } from '../../../_lib/projects';
import { RefusalView } from '../../../../(free)/_components/refusal';

export const dynamic = 'force-dynamic';

export default async function FilingPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/filings/${id}`);
  const db = await getDb();

  const view = await readAs(session, async (tx) => {
    const rebuilt = await rebuildFiling(db, tx, id);
    if (rebuilt === null) return null;
    const project = await readProject(tx, rebuilt.filing.projectId);
    if (project === null) return null;
    return { rebuilt, project, artifacts: await listArtifacts(tx, id) };
  });

  if (view === null) notFound();

  const { rebuilt, project } = view;
  const { filing, verdict, artifact, computation } = rebuilt;
  const signature = rendersSignatureBlock(verdict);

  const xml = ecprChip({
    project,
    workersMissingSsn: rebuilt.loaded.workersMissingSsn,
    workerCount: rebuilt.loaded.identities.length,
    xsdObservedSha256: null,
    xsdObservedAt: null,
  });

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
        <div className="rp-alert rp-alert--blocked">
          <span className="rp-alert__glyph" aria-hidden="true">
            ✕
          </span>
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{BAND_UNKNOWN_HEADLINE}</p>
            {BAND_UNKNOWN_BODY.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
            <p>
              <Link className="rp-btn rp-btn--primary" href={`/app/projects/${project.id}`}>
                {BAND_UNKNOWN_ACTION}
              </Link>
            </p>
          </div>
        </div>
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
                    <Link href={`/api/artifacts/${id}?kind=ecpr_xml`}>Download</Link>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {xml.kind === 'blocked' ? (
          <div className="rp-alert rp-alert--blocked">
            <span className="rp-alert__glyph" aria-hidden="true">
              ✕
            </span>
            <div className="rp-alert__body">
              <p className="rp-alert__title">{xml.headline}</p>
              <p>{xml.detail}</p>
              <p className="rp-t-micro">{WE_DO_NOT_FILE}</p>
            </div>
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
