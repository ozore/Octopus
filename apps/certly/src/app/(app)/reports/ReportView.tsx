import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { COUNTER_ORDER } from '@/lib/repos/dashboard';
import type { ReportSnapshot } from '@/lib/reports/types';
import { REQUIREMENT_STATUS, STATUS_WORD_LONG, VENDOR_COUNTER_LABEL, VENDOR_STATUS } from '@/lib/status';

/**
 * THE REPORT, ON SCREEN — the same seven sections as the PDF, in the same
 * order, from the same snapshot.
 *
 * Two surfaces render this: `/reports/[id]` inside the app, and `/r/[token]`
 * with no chrome and no login. `specs/12` §8 constrains the second one and
 * therefore this component: it exposes **only** the report's content. No
 * navigation, no other organisation's data, no user name beyond the
 * generator's, no cost and no plan information. `tests/reports.test.ts` asserts
 * that over the serialised snapshot, which is the only thing this component
 * reads — so a field that is not in the snapshot cannot leak through here.
 */

export function ReportView({ snapshot }: { snapshot: ReportSnapshot }) {
  const outstanding = snapshot.vendors.filter(
    (vendor) => vendor.gapCount > 0 || vendor.assertedOnlyCount > 0 || vendor.undeterminedCount > 0,
  );

  return (
    <article className="c-report" data-testid="report">
      <header className="c-report__head">
        <div>
          <h1>Gap report</h1>
          <p className="c-table__party">{snapshot.org.name}</p>
          {snapshot.org.entityBlock ? (
            <p className="c-small c-muted" style={{ whiteSpace: 'pre-line' }}>
              {snapshot.org.entityBlock}
            </p>
          ) : null}
        </div>
        <div>
          <p className="c-asof" data-testid="report-as-of">
            as of <time dateTime={snapshot.asOf}>{snapshot.asOf}</time>
          </p>
          <p className="c-xs c-muted">
            Generated {snapshot.generatedAt} ({snapshot.timezone})
          </p>
          <p className="c-xs c-muted">{snapshot.scopeLabel}</p>
        </div>
      </header>

      {/* 1 — the cover counts, in the canonical vendor-state labels. */}
      <section className="c-report__block">
        <h3>Where the roster stands</h3>
        <table className="c-table">
          <tbody>
            {COUNTER_ORDER.map((state) => (
              <tr key={state}>
                <td>{VENDOR_COUNTER_LABEL[state]}</td>
                <td className="c-num" data-testid={`report-count-${state}`}>
                  {snapshot.counters[state]}
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total in scope</strong>
              </td>
              <td className="c-num" data-testid="report-count-total">
                <strong>{snapshot.counters.roster}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="c-xs c-muted">
          These six are mutually exclusive and exhaustive: every vendor in scope is in exactly one, and
          they sum to the total.
        </p>
      </section>

      {/* 2 — the §F.1 disclaimer, on the cover. Surfaces 7 and 8 of eleven. */}
      <Disclaimer of="primary" />

      {/* 3 — the summary table. */}
      <section className="c-report__block">
        <h3>Every vendor in scope</h3>
        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Type</th>
                <th>Status</th>
                <th>Earliest required expiry</th>
                <th>Gaps</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="c-table__party">{vendor.name}</td>
                  <td className="c-table__meta">{vendor.type ?? '—'}</td>
                  <td>
                    <StatusPill
                      state={VENDOR_STATUS[vendor.status]}
                      word={vendor.statusWord}
                      asOf={snapshot.asOf}
                    />
                  </td>
                  <td className="c-date">{vendor.earliestRequiredExpiry ?? '—'}</td>
                  <td className="c-num">{vendor.gapCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4 — one block per vendor with something outstanding. */}
      {outstanding.length > 0 ? (
        <section className="c-report__block" data-testid="report-detail">
          <h3>What is outstanding, vendor by vendor</h3>
          {outstanding.map((vendor) => (
            <div key={vendor.id} className="c-report__block" data-testid={`report-vendor-${vendor.id}`}>
              <h3>{vendor.name}</h3>
              {vendor.rows
                .filter((row) => row.state !== 'met' && row.state !== 'not_checked')
                .map((row) => (
                  <div key={`${vendor.id}-${row.requirementId}`}>
                    <p className="c-report__finding">
                      <strong>{row.label}</strong> — {STATUS_WORD_LONG[REQUIREMENT_STATUS[row.state]]}
                    </p>
                    <p className="c-report__finding c-muted">
                      Required: {row.requiredValue}. Found, as printed:{' '}
                      <span className="c-mono">{row.foundValueRaw ?? 'nothing in this box'}</span>.
                    </p>
                    <p className="c-report__finding">{row.explanation}</p>
                  </div>
                ))}
            </div>
          ))}
        </section>
      ) : null}

      {/* 5 — never omitted, never folded into a green count. */}
      <section className="c-report__block" data-testid="report-not-checked">
        <h3>Not checked by Certly</h3>
        <p className="c-report__finding">
          Certly did not evaluate the requirements below. They are listed here rather than folded into a
          green count, because a report that hides what it did not check is worth less than no report.
        </p>
        {snapshot.notChecked.length === 0 ? (
          <p className="c-report__finding c-muted">Nothing in this scope fell outside what Certly checks.</p>
        ) : (
          <ul>
            {snapshot.notChecked.map((row, index) => (
              <li key={`${row.vendorName}-${index}`} className="c-report__finding">
                <strong>{row.vendorName}</strong> — {row.label}. {row.explanation}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 6 — the same rule, and the same reason (REVIEW.md B-09). */}
      <section className="c-report__block" data-testid="report-needs-review">
        <h3>Read, but not confident enough to compare ({snapshot.needsReview.length})</h3>
        {snapshot.needsReview.length === 0 ? (
          <p className="c-report__finding c-muted">
            Every document in this scope was read confidently enough to compare.
          </p>
        ) : (
          <>
            <p className="c-report__finding">
              These documents were read but a person still has to look at them. Their vendors are counted
              under “No certificate” above and appear in no green count.
            </p>
            <ul>
              {snapshot.needsReview.map((item) => (
                <li key={`${item.documentLabel}-${item.uploadedAt}`} className="c-report__finding">
                  <strong>{item.vendorName ?? 'Unmatched document'}</strong> —{' '}
                  <span className="c-mono">{item.documentLabel}</span>, uploaded {item.uploadedAt}.{' '}
                  {item.reason}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 7 — provenance. The part no competitor ships. */}
      <section className="c-report__block" data-testid="report-provenance">
        <h3>Provenance</h3>
        <p className="c-report__finding">
          Exactly what was compared, against what, on what date.
        </p>
        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Certificate</th>
                <th>Document</th>
                <th>Extraction</th>
                <th>Requirements</th>
                <th>Engine</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.vendors.map((vendor) => (
                <tr key={`prov-${vendor.id}`}>
                  <td className="c-table__party">{vendor.name}</td>
                  <td className="c-date">{vendor.certificateDate ?? 'none on record'}</td>
                  <td className="c-mono c-xs">
                    {vendor.documentLabel ?? '—'}
                    {vendor.documentUploadedAt ? ` · ${vendor.documentUploadedAt}` : ''}
                  </td>
                  <td className="c-mono c-xs">{vendor.extractionId ?? '—'}</td>
                  <td className="c-xs">
                    {vendor.requirementSetName ?? '—'}
                    {vendor.requirementSetVersion !== null ? ` v${vendor.requirementSetVersion}` : ''}
                  </td>
                  <td className="c-mono c-xs">{vendor.engineVersion ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="c-list-reset c-xs c-muted">
          {snapshot.vendors
            .flatMap((vendor) => vendor.sources.map((source) => ({ vendor: vendor.name, source })))
            .map((entry, index) => (
              <li key={`${entry.source.url}-${index}`}>
                {entry.vendor}: {entry.source.title} — {entry.source.url} (checked{' '}
                {entry.source.last_verified})
              </li>
            ))}
        </ul>
      </section>

      <p className="c-report__disclaimer">
        Report {snapshot.reportId}. Engine {snapshot.engineVersions.join(', ')}.
        {snapshot.generatedBy ? ` Generated by ${snapshot.generatedBy}.` : ''}
        {snapshot.note ? ` ${snapshot.note}` : ''}
      </p>
    </article>
  );
}
