import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { COUNTER_ORDER } from '@/lib/repos/dashboard';
import { EXPORT_BLOCKED_SENTENCE, canExportReports, listReports } from '@/lib/reports';
import { VENDOR_COUNTER_LABEL } from '@/lib/status';
import { createReportAction } from './actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * REPORT HISTORY AND THE EXPORT DIALOG — `specs/12` §5.
 *
 * The list is the last fifty, with scope, format, size and who generated each
 * one, because **a report is an immutable snapshot**: regenerating makes a new
 * row rather than changing an old one, and the history is what makes that
 * visible instead of merely true.
 */

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { org, entitlement } = await requireOrg();
  const db = await getDb();
  const rows = await listReports(db, org.id, 50);
  const allowed = canExportReports(entitlement);
  const error = typeof query['error'] === 'string' ? query['error'] : null;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Gap reports</h1>
          <p className="c-page__lede">
            A dated document you can forward to an owner, a lender or a board. It states what it
            compared, what it did not check, and what it could not read — and it keeps saying the same
            thing months later, because a report is a snapshot and regenerating makes a new one.
          </p>
        </div>
      </header>

      {error ? (
        <p className="notice error" data-testid="reports-error">
          {error}
        </p>
      ) : null}
      {query['queued'] ? (
        <p className="notice" data-testid="reports-queued">
          More than 100 vendors, so this one is being rendered in the background. It will appear in the
          list below when it is ready.
        </p>
      ) : null}

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Export</h2>
        </div>
        {allowed ? (
          <form action={createReportAction} className="c-stack">
            <label className="c-field">
              <span className="c-field__label">Scope</span>
              <select className="c-select" name="scope" defaultValue="all" data-testid="report-scope">
                <option value="all">Every vendor on the roster</option>
                <option value="filter">One status only</option>
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">If one status only, which</span>
              <select className="c-select" name="status" defaultValue="">
                <option value="">—</option>
                {COUNTER_ORDER.map((state) => (
                  <option key={state} value={state}>
                    {VENDOR_COUNTER_LABEL[state]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Format</span>
              <select className="c-select" name="format" defaultValue="pdf" data-testid="report-format">
                <option value="pdf">PDF — the forwardable one</option>
                <option value="csv">CSV — the spreadsheet one, one row per vendor and requirement</option>
              </select>
            </label>
            <button className="c-btn c-btn--primary" type="submit" data-testid="generate-report">
              Generate report
            </button>
          </form>
        ) : (
          <p className="notice warn" data-testid="export-blocked">
            {EXPORT_BLOCKED_SENTENCE} <Link href="/settings/billing">Billing</Link>
          </p>
        )}
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">The last {rows.length === 1 ? 'report' : `${rows.length} reports`}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="c-small c-muted" data-testid="reports-empty">
            Nothing exported yet.
          </p>
        ) : (
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Generated</th>
                  <th>Scope</th>
                  <th>Format</th>
                  <th>Vendors</th>
                  <th>Gaps</th>
                  <th>Not checked</th>
                  <th>Size</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((report) => (
                  <tr key={report.id} data-testid={`report-${report.id}`}>
                    <td className="c-date">
                      <Link href={`/reports/${report.id}`}>
                        {report.generatedAt?.toISOString() ?? report.createdAt.toISOString()}
                      </Link>
                    </td>
                    <td className="c-table__meta">{String((report.scope as { kind?: string })?.kind ?? '—')}</td>
                    <td className="c-table__meta">{report.format.toUpperCase()}</td>
                    <td className="c-num">{report.vendorCount}</td>
                    <td className="c-num">{report.gapCount}</td>
                    <td className="c-num">{report.notCheckedCount}</td>
                    <td className="c-num">{report.bytes ?? 0}</td>
                    <td className="c-table__meta">
                      {report.shareRevokedAt
                        ? 'revoked'
                        : report.shareTokenHash
                          ? `until ${report.shareExpiresAt?.toISOString().slice(0, 10)}`
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Disclaimer of="primary" />
    </main>
  );
}
