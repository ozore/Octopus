import Link from 'next/link';

import { CoverageBar, CoverageLegend, PortfolioStrip } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { orgToday } from '@/lib/engine';
import { countTrackedVendors, ensureOrgSettings } from '@/lib/repos';
import {
  COUNTER_ORDER,
  DASHBOARD_PAGE_SIZE,
  getDashboard,
  parseSort,
  parseStatusFilter,
  topProblems,
} from '@/lib/repos/dashboard';
import { listRequirementSets } from '@/lib/repos/requirements';
import { reviewQueueDepth } from '@/lib/repos/review-queue';
import { VENDOR_COUNTER_LABEL, VENDOR_STATUS, vendorWord } from '@/lib/status';
import { bulkRemindAction } from './actions';
import { coverageWindow } from './coverage-window';
import { SearchBox } from './SearchBox';
import { exportSelectionAction } from '../reports/actions';
import { limitOf } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE COVERAGE DASHBOARD — `specs/06`, `UX.md` S10.
 *
 * The retention surface. The audit high wears off in week two; the Monday habit
 * is what renews, and this is the screen the habit is made of.
 *
 * FOUR PROPERTIES THAT ARE ACCEPTANCE CRITERIA:
 *
 *  - **The six counters sum to the roster** (A1, REVIEW.md MN-12). They are
 *    mutually exclusive and exhaustive over the non-archived vendors, they come
 *    from `src/lib/repos/dashboard.ts` — the same module the table and the gap
 *    report use — and the page prints the sum so a drift is visible rather than
 *    silent.
 *  - **Every counter is a filter, and the filter is in the URL** (A2), so a
 *    manager can send "here are the three that lapsed" as a link.
 *  - **The word "Covered" appears nowhere** (A4b). The green pill reads
 *    "Meets requirements"; `tests/vocabulary.test.ts` greps the source and
 *    `e2e` asserts the rendered page.
 *  - **The §F.1 disclaimer is on the page** (A9). This screen, the vendor
 *    detail, the timeline, the search results and the mobile card list are five
 *    of the eleven surfaces in KB §F.4.
 */

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const tracked = await countTrackedVendors(db, org.id);

  const status = parseStatusFilter(query['status']);
  const q = typeof query['q'] === 'string' ? query['q'] : '';
  const sort = parseSort(query['sort']);
  const page = Number(query['page'] ?? 1) || 1;

  if (tracked === 0) {
    // A7 — an org with zero vendors sees the setup checklist, not an empty
    // table with "No vendors found". The empty state is a first-class screen.
    const sets = await listRequirementSets(db, org.id);
    const steps = [
      { done: sets.length > 0, label: 'Choose a requirement template', href: '/requirements/library' },
      { done: false, label: 'Add the vendors you already work with', href: '/vendors' },
      { done: false, label: 'Upload one certificate, or ask a vendor for theirs', href: '/vendors' },
      { done: false, label: 'See what it evidences, and what it only claims', href: '/dashboard' },
    ];
    return (
      <main>
        <header className="c-page__head">
          <div>
            <h1 className="c-page__title">Coverage</h1>
            <p className="c-page__lede">
              Certly reads the certificates your vendors send and tells you what each one evidences
              against the requirements you set — and what it only claims.
            </p>
          </div>
        </header>

        <section className="c-empty" data-testid="dashboard-empty">
          <p className="c-empty__title">Nothing to show yet, because nobody is on your list.</p>
          <p className="c-muted">
            Add the vendors you already work with. You do not need their certificates yet — finding
            the ones who have never sent anything is the first thing this does.
          </p>
          <ol className="c-stack" data-testid="onboarding-checklist">
            {steps.map((step) => (
              <li key={step.label}>
                <Link href={step.href}>{step.label}</Link> {step.done ? <span className="badge">done</span> : null}
              </li>
            ))}
          </ol>
          <p className="c-gap-3">
            <Link className="c-btn c-btn--primary" href="/vendors">
              Add vendors
            </Link>
            <Link className="c-btn c-btn--secondary" href="/requirements/library">
              Choose a requirement template
            </Link>
          </p>
        </section>

        <Disclaimer of="primary" />
      </main>
    );
  }

  const { counters, rows, total } = await getDashboard(db, {
    orgId: org.id,
    filter: { status, q: q || null },
    sort,
    page,
  });
  const problems = await topProblems(db, org.id, rows.map((row) => row.id));
  const reviewDepth = await reviewQueueDepth(db, org.id);
  const vendorLimit = limitOf(entitlement, 'vendors', 25);
  const summed = COUNTER_ORDER.reduce((sum, state) => sum + counters[state], 0);

  await trackEvent(db, {
    name: 'dashboard_viewed',
    orgId: org.id,
    userId: user.id,
    props: {
      meets: counters.meets,
      gaps: counters.gap,
      expiring: counters.expiring,
      expired: counters.expired,
      asserted_only: counters.asserted_only,
      no_certificate: counters.no_certificate,
    },
  });
  // `specs/00` has one event for narrowing the roster, and search is a
  // narrowing: `dashboard_filtered{filter}` carries either the status or the
  // fact that a search was run. Inventing `search_performed` would put a name
  // in the funnel that `specs/00` never blessed (`events:check` refuses it).
  if (status || q) {
    await trackEvent(db, {
      name: 'dashboard_filtered',
      orgId: org.id,
      userId: user.id,
      props: { filter: status ?? 'search' },
    });
  }

  const link = (patch: Record<string, string | null>): string => {
    const params = new URLSearchParams();
    const base: Record<string, string | null> = { status, q: q || null, sort: sort === 'worst_first' ? null : sort, ...patch };
    for (const [key, value] of Object.entries(base)) if (value) params.set(key, value);
    const search = params.toString();
    return search ? `/dashboard?${search}` : '/dashboard';
  };

  const pageCount = Math.max(1, Math.ceil(total / DASHBOARD_PAGE_SIZE));

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Coverage</h1>
          <p className="c-page__lede">
            {summed} tracked {summed === 1 ? 'vendor' : 'vendors'} of{' '}
            {typeof vendorLimit === 'number' && vendorLimit < 0 ? 'unlimited' : String(vendorLimit)} on the{' '}
            {entitlement.planName} plan. The six counters below are mutually exclusive and sum to{' '}
            <span data-testid="counter-sum">{summed}</span>.
          </p>
        </div>
        <div className="c-stack">
          {/* P3 (`IDENTITY.md` §5): a status is never shown without its date. */}
          <span className="c-asof" data-testid="as-of">
            as of <time dateTime={today}>{today}</time>
          </span>
          <SearchBox defaultValue={q} />
        </div>
      </header>

      {query['bulk'] === 'remind' ? (
        <p className="notice" data-testid="bulk-result">
          {String(query['queued'] ?? '0')} queued for a reminder.{' '}
          {typeof query['why'] === 'string' ? query['why'] : null}
        </p>
      ) : null}

      <div className="c-split">
        <div className="c-stack-lg">
          <nav className="c-gap-2" aria-label="Filter by status" data-testid="counters">
            <Link
              className={`c-chip${status === null ? ' c-chip--on' : ''}`}
              href={link({ status: null, page: null })}
              aria-current={status === null ? 'true' : undefined}
            >
              All {summed}
            </Link>
            {COUNTER_ORDER.map((state) => (
              <Link
                key={state}
                className={`c-chip${status === state ? ' c-chip--on' : ''}`}
                href={link({ status: state, page: null })}
                aria-current={status === state ? 'true' : undefined}
                data-testid={`counter-${state}`}
              >
                {VENDOR_COUNTER_LABEL[state]} <span className="c-num">{counters[state]}</span>
              </Link>
            ))}
          </nav>

          {/* A5 — the line above the table, and a link to the filtered view. */}
          {counters.no_certificate > 0 ? (
            <p className="notice" data-testid="no-certificate-line">
              <Link href={link({ status: 'no_certificate', page: null })}>
                {counters.no_certificate}{' '}
                {counters.no_certificate === 1 ? 'vendor has' : 'vendors have'} never sent a certificate
              </Link>
              . A vendor whose only certificate is still in review counts here too, so nothing is
              coloured green before a person has looked at it.
            </p>
          ) : null}

          {reviewDepth > 0 ? (
            <p className="notice" data-testid="review-badge">
              <Link href="/review">{reviewDepth} read, but not confident enough to compare</Link> — oldest
              first.
            </p>
          ) : null}

          <section className="c-card">
            <div className="c-card__head">
              <h2 className="c-card__title">
                {q ? `Vendors matching “${q}”` : status ? VENDOR_COUNTER_LABEL[status] : 'Soonest problem first'}
              </h2>
              <span className="c-gap-2 c-xs">
                <Link className="c-btn c-btn--quiet c-btn--sm" href={link({ sort: null, page: null })}>
                  Worst first
                </Link>
                <Link className="c-btn c-btn--quiet c-btn--sm" href={link({ sort: 'expiry', page: null })}>
                  Soonest expiry
                </Link>
                <Link className="c-btn c-btn--quiet c-btn--sm" href={link({ sort: 'name', page: null })}>
                  Name
                </Link>
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="c-empty__title" data-testid="filtered-to-nothing">
                No vendor matches {status ? `the “${VENDOR_COUNTER_LABEL[status]}” filter` : ''}
                {status && q ? ' and ' : ''}
                {q ? `the search “${q}”` : ''}. Remove {status && q ? 'one of them' : 'it'} to see the rest.{' '}
                <Link href="/dashboard">Clear</Link>
              </p>
            ) : (
              <form>
                <div className="c-table-wrap">
                  <table className="c-table c-table--comfortable">
                    <thead>
                      <tr>
                        <th>
                          <span className="c-visually-hidden">Select</span>
                        </th>
                        <th>Vendor</th>
                        <th>Status</th>
                        <th>Earliest required expiry</th>
                        <th>On record</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((vendor) => {
                        const band = coverageWindow({
                          status: vendor.status,
                          earliestRequiredExpiry: vendor.earliestRequiredExpiry,
                          today,
                          vendorName: vendor.name,
                        });
                        const found = problems.get(vendor.id) ?? [];
                        return (
                          <tr key={vendor.id} data-testid="vendor-row" data-status={vendor.status}>
                            <td>
                              <input
                                type="checkbox"
                                name="vendorId"
                                value={vendor.id}
                                aria-label={`Select ${vendor.name}`}
                              />
                            </td>
                            <td className="c-table__party">
                              <Link href={`/dashboard/${vendor.id}`} data-testid={`open-vendor-${vendor.id}`}>
                                {vendor.name}
                              </Link>
                              {vendor.vendorTypeLabel ? (
                                <span className="c-table__meta"> · {vendor.vendorTypeLabel}</span>
                              ) : null}
                              <details data-testid={`why-${vendor.id}`}>
                                <summary className="c-xs c-muted">
                                  {found.length > 0 ? `Why — top ${found.length}` : 'Why'}
                                </summary>
                                {found.length > 0 ? (
                                  <ul className="c-list-reset c-small">
                                    {found.map((problem) => (
                                      <li key={problem.requirementId}>{problem.explanation}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="c-small c-muted">
                                    {vendor.status === 'no_certificate'
                                      ? 'No certificate on record, so there is nothing to compare yet.'
                                      : 'Nothing outstanding on the last comparison.'}
                                  </p>
                                )}
                              </details>
                            </td>
                            <td>
                              <StatusPill
                                state={VENDOR_STATUS[vendor.status]}
                                word={vendorWord(vendor.status)}
                                asOf={today}
                              />
                            </td>
                            <td className="c-date">{vendor.earliestRequiredExpiry ?? '—'}</td>
                            <td>
                              <CoverageBar
                                segments={band.segments}
                                ariaLabel={band.ariaLabel}
                                todayAt={band.todayAt}
                                small
                                testId={`bar-${vendor.id}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Surface 6 of the eleven (KB §F.4): the same rows as cards,
                    shown instead of the table below 900px. */}
                <ul className="c-cards c-list-reset" data-testid="mobile-cards">
                  {rows.map((vendor) => (
                    <li className="c-card" key={vendor.id}>
                      <Link className="c-table__party" href={`/dashboard/${vendor.id}`}>
                        {vendor.name}
                      </Link>
                      <StatusPill
                        state={VENDOR_STATUS[vendor.status]}
                        word={vendorWord(vendor.status)}
                        asOf={today}
                      />
                      <p className="c-date">{vendor.earliestRequiredExpiry ?? 'no expiry on record'}</p>
                    </li>
                  ))}
                </ul>

                <div className="c-gap-3">
                  <button className="c-btn c-btn--secondary c-btn--sm" formAction={bulkRemindAction} type="submit">
                    Chase selected
                  </button>
                  <button
                    className="c-btn c-btn--secondary c-btn--sm"
                    formAction={exportSelectionAction}
                    type="submit"
                    data-testid="export-selected"
                  >
                    Export gap report for selected
                  </button>
                  <span className="c-xs c-muted">
                    Two bulk actions, and no third: a status is a conclusion drawn from a document, so it
                    is not settable by hand.
                  </span>
                </div>
              </form>
            )}

            {pageCount > 1 ? (
              <p className="c-gap-2" data-testid="pager">
                {page > 1 ? <Link href={link({ page: String(page - 1) })}>← Previous</Link> : null}
                <span className="c-xs c-muted">
                  Page {page} of {pageCount} · {total} rows
                </span>
                {page < pageCount ? <Link href={link({ page: String(page + 1) })}>Next →</Link> : null}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="c-stack-lg">
          <section className="c-card" data-testid="portfolio">
            <div className="c-card__head">
              <h2 className="c-card__title">Where your roster stands</h2>
            </div>
            <PortfolioStrip
              counts={COUNTER_ORDER.map((state) => ({
                state: VENDOR_STATUS[state],
                count: counters[state],
                label: VENDOR_COUNTER_LABEL[state],
              }))}
              ariaLabel={`Of ${summed} vendors: ${COUNTER_ORDER.filter((state) => counters[state] > 0)
                .map((state) => `${counters[state]} ${VENDOR_COUNTER_LABEL[state].toLowerCase()}`)
                .join(', ')}.`}
            />
            <CoverageLegend states={[...new Set(COUNTER_ORDER.map((state) => VENDOR_STATUS[state]))]} />
            <p className="c-xs c-muted">
              Expired renders in the gap ramp with its own word, because “Expired” (lapsed) and “Gap”
              (short) are different facts.
            </p>
          </section>

          <section className="c-card">
            <div className="c-card__head">
              <h2 className="c-card__title">Next</h2>
            </div>
            <ul className="c-list-reset c-small c-stack">
              <li>
                <Link href="/timeline">The expiry timeline</Link> — one row per vendor on a shared axis.
              </li>
              <li>
                <Link href="/review">The review queue</Link> — {reviewDepth} waiting.
              </li>
              <li>
                <Link href="/reports">Gap reports</Link> — the dated artefact you can forward.
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Surface 2 of the eleven (KB §F.4): a screen that renders a status
          renders the disclaimer. Surfaces 5 and 6 — the search result rows and
          the mobile cards — are on this page too. */}
      <Disclaimer of="primary" />
    </main>
  );
}
