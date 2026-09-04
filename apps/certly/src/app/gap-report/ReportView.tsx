import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { RETENTION_TERMS, type GapReport } from '@/lib/gap-report';
import { VENDOR_STATUS, type VendorState } from '@/lib/status';

/**
 * THE REPORT, ON SCREEN — `specs/15` §4, A2, A3, A4, A12.
 *
 * Shared by the real report page and by the samples-only demo, so the demo
 * shows the actual artefact rather than a picture of one. The order is the
 * spec's order and each block is a liability control:
 *
 *   1. the §F.1 disclaimer, on page 1, before the finding;
 *   2. the scope line — how many documents, on what date, against which
 *      template, and that the template is not the reader's contract;
 *   3. the headline: a COUNT AND A DATE, never a verdict, with BOTH counts;
 *   4. the vendors, **expired first**;
 *   5. **"Read, but not confident enough to compare (k)"**, with a reason in
 *      words per document — the section without which a stranger who sends 18
 *      certificates silently gets a report about 12;
 *   6. "Not checked", always;
 *   7. the retention terms again.
 */
export function ReportView({
  report,
  appName,
  cta,
}: {
  report: GapReport;
  appName: string;
  cta?: { href: string; label: string } | null;
}) {
  return (
    <article className="c-report" data-testid="gap-report">
      <header className="c-report__head">
        <div>
          <h1 className="c-page__title">{appName} gap report</h1>
          <p className="c-small c-muted" data-testid="scope-line">
            {report.scopeLine}
          </p>
        </div>
        <p className="c-num">{report.generatedOn}</p>
      </header>

      {/* Page 1, verbatim, before the finding — not a footer (A4). */}
      <Disclaimer of="primary" />

      <p className="c-report__finding" data-testid="report-headline">
        <strong>{report.headline}</strong>
      </p>

      {report.vendors.map((vendor) => (
        <section className="c-report__block" key={vendor.documentId} data-testid="report-vendor">
          <h3>
            {vendor.vendorName}{' '}
            <StatusPill
              state={VENDOR_STATUS[vendor.status as VendorState]}
              word={vendor.statusWord}
              asOf={report.generatedOn}
            />
          </h3>
          <p className="c-small c-muted">
            Read from {vendor.filename}
            {vendor.expiry ? ` · earliest required expiry ${vendor.expiry}` : ''}
          </p>
          {[...vendor.gaps, ...vendor.assertedOnly].map((row) => (
            <p className="c-report__finding" key={`${vendor.documentId}:${row.requirementId}`}>
              {row.explanation}
            </p>
          ))}
          {vendor.gaps.length === 0 && vendor.assertedOnly.length === 0 ? (
            <p className="c-report__finding">
              Every requirement in this set is evidenced by the certificate as read.
            </p>
          ) : null}
        </section>
      ))}

      {report.uncompared.length > 0 ? (
        <section className="c-report__block" data-testid="uncompared">
          <h3>Read, but not confident enough to compare ({report.uncompared.length})</h3>
          <ul>
            {report.uncompared.map((document) => (
              <li key={document.documentId}>
                <strong>{document.filename}</strong>
                {document.insuredNameRead ? ` (${document.insuredNameRead})` : ''} — {document.reason}
              </li>
            ))}
          </ul>
          <p className="c-report__finding">{report.uncomparedNote}</p>
        </section>
      ) : null}

      {report.rejected.length > 0 ? (
        <section className="c-report__block" data-testid="rejected">
          <h3>Not a certificate of liability insurance ({report.rejected.length})</h3>
          <ul>
            {report.rejected.map((document) => (
              <li key={document.documentId}>
                <strong>{document.filename}</strong> — {document.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Always present, even when empty (M12 §3.5). A report that silently
          omits what it did not check is the dishonesty that section prevents. */}
      <section className="c-report__block" data-testid="not-checked">
        <h3>Not checked by {appName}</h3>
        {report.notChecked.length === 0 ? (
          <p className="c-report__finding">
            Nothing in this requirement set is outside what {appName} reads from a certificate.
          </p>
        ) : (
          <ul>
            {report.notChecked.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="c-report__block">
        <h3>The requirements this was compared against</h3>
        <p className="c-report__finding">{report.templateName}</p>
        <Disclaimer of="templates" inline />
      </section>

      {cta ? (
        <p data-testid="report-cta">
          <Link className="c-btn c-btn--primary" href={cta.href}>
            {cta.label}
          </Link>
        </p>
      ) : null}

      <p className="c-report__disclaimer c-small c-muted" data-testid="retention-terms">
        {RETENTION_TERMS.join(' ')}
      </p>
    </article>
  );
}
