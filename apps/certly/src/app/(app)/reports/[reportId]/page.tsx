import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';
import {
  SHARE_DEFAULT_DAYS,
  SHARE_MAX_DAYS,
  getReport,
  readSnapshot,
} from '@/lib/reports';
import { ReportView } from '../ReportView';
import { createShareLinkAction, revokeShareLinkAction } from '../actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * ONE REPORT — the snapshot on screen, the download, and the share link.
 *
 * The page renders from the STORED SNAPSHOT, not from live data. That is the
 * whole point of `specs/12` §6: a report generated before a requirement set
 * changed still shows the version it was generated against, and the date
 * (A8).
 */

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reportId } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();

  const report = await getReport(db, org.id, reportId);
  // A cross-org read returns nothing, and nothing is a 404 (`specs/01` A6).
  if (!report) notFound();

  const snapshot = await readSnapshot(org.id, reportId);
  const share = typeof query['share'] === 'string' ? query['share'] : null;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Gap report</h1>
          <p className="c-page__lede">
            {report.format.toUpperCase()} · {report.vendorCount} vendors · {report.gapCount} gaps ·{' '}
            {report.notCheckedCount} not checked · {report.needsReviewCount} read but not compared.
          </p>
        </div>
        <Link className="c-btn c-btn--quiet" href="/reports">
          ← All reports
        </Link>
      </header>

      {share ? (
        <p className="notice" data-testid="share-created">
          Anyone with this link can read the report until it expires — no login. Copy it now; Certly
          stores only its hash and cannot show it to you again.
          <br />
          <span className="c-mono" data-testid="share-url">
            {share}
          </span>
        </p>
      ) : null}
      {query['revoked'] ? (
        <p className="notice" data-testid="share-revoked">
          Revoked. The link is dead immediately, and it answers exactly as an expired one does.
        </p>
      ) : null}

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Download and share</h2>
        </div>
        <p className="c-gap-3">
          <a className="c-btn c-btn--primary" href={`/reports/${reportId}/download`} data-testid="download-report">
            Download the {report.format.toUpperCase()}
          </a>
        </p>
        <form action={createShareLinkAction} className="c-gap-2">
          <input type="hidden" name="reportId" value={reportId} />
          <label className="c-field">
            <span className="c-field__label">Share link, valid for</span>
            <input
              className="c-input c-input--num"
              name="days"
              type="number"
              min={1}
              max={SHARE_MAX_DAYS}
              defaultValue={SHARE_DEFAULT_DAYS}
            />
          </label>
          <button className="c-btn c-btn--secondary c-btn--sm" type="submit" data-testid="create-share">
            Create a read-only link
          </button>
        </form>
        {report.shareTokenHash ? (
          <form action={revokeShareLinkAction}>
            <input type="hidden" name="reportId" value={reportId} />
            <button className="c-btn c-btn--secondary c-btn--sm" type="submit" data-testid="revoke-share">
              Revoke the link
            </button>
          </form>
        ) : null}
      </section>

      {snapshot ? (
        <ReportView snapshot={snapshot} />
      ) : (
        <p className="notice error" data-testid="report-unavailable">
          This report’s contents could not be read back from storage. The row and its counts are intact;
          generate a new report rather than trusting a partial one.
        </p>
      )}
    </main>
  );
}
