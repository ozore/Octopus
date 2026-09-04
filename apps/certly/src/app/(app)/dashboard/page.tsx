import Link from 'next/link';

import { CoverageLegend, PortfolioStrip } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getDb } from '@/lib/db';
import { orgToday } from '@/lib/engine';
import { ensureOrgSettings, countTrackedVendors, listVendors, vendorStatusCounts } from '@/lib/repos';
import { VENDOR_COUNTER_LABEL, VENDOR_STATUS, vendorWord, type VendorState } from '@/lib/status';
import { limitOf } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE COVERAGE DASHBOARD — `UX.md` S10, `specs/06`.
 *
 * Sub-wave A ships the SHELL of this screen and the counters that already have
 * data: the portfolio strip, the six mutually exclusive counters, the vendor
 * table sorted soonest-problem-first, and the empty state. M6's agent owns the
 * filters, the search, the row expansion and the timeline.
 *
 * THE SUM RULE, stated so it cannot drift: the six buckets are mutually
 * exclusive and exhaustive over the non-archived roster. Every non-archived
 * vendor is in exactly one, and the six counters sum to the roster
 * (`specs/06` §3, REVIEW.md MN-12). The page asserts it in its own subtitle
 * rather than hoping.
 */

const ORDER: VendorState[] = ['expired', 'gap', 'expiring', 'asserted_only', 'meets', 'no_certificate'];

export default async function DashboardPage() {
  const { org, entitlement } = await requireOrg();
  const db = await getDb();

  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const counts = await vendorStatusCounts(db, org.id);
  const tracked = await countTrackedVendors(db, org.id);
  const rows = await listVendors(db, org.id, 50);
  const vendorLimit = limitOf(entitlement, 'vendors', 25);

  if (tracked === 0) {
    // EMPTY STATE IS A FIRST-CLASS SCREEN (`specs/06` §3). A new org sees the
    // three import doors, not "No vendors found."
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
          <p className="c-gap-3">
            <Link className="c-btn c-btn--primary" href="/vendors">
              Add vendors
            </Link>
            <Link className="c-btn c-btn--secondary" href="/requirements">
              Choose a requirement template
            </Link>
          </p>
        </section>

        <Disclaimer of="primary" />
      </main>
    );
  }

  const strip = ORDER.map((state) => ({
    state: VENDOR_STATUS[state],
    count: counts[state] ?? 0,
    label: VENDOR_COUNTER_LABEL[state],
  }));
  const summed = ORDER.reduce((sum, state) => sum + (counts[state] ?? 0), 0);

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Coverage</h1>
          <p className="c-page__lede">
            {summed} tracked {summed === 1 ? 'vendor' : 'vendors'} of{' '}
            {typeof vendorLimit === 'number' && vendorLimit < 0 ? 'unlimited' : String(vendorLimit)} on the{' '}
            {entitlement.planName} plan.
          </p>
        </div>
        <span className="c-asof">
          as of <time dateTime={today}>{today}</time>
        </span>
      </header>

      <section className="c-card" data-testid="portfolio">
        <div className="c-card__head">
          <h2 className="c-card__title">Where your roster stands</h2>
        </div>
        <PortfolioStrip
          counts={strip}
          ariaLabel={`Of ${summed} vendors: ${ORDER.filter((state) => (counts[state] ?? 0) > 0)
            .map((state) => `${counts[state]} ${VENDOR_COUNTER_LABEL[state].toLowerCase()}`)
            .join(', ')}.`}
        />
        <CoverageLegend states={[...new Set(ORDER.map((state) => VENDOR_STATUS[state]))]} />
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Soonest problem first</h2>
          <Link className="c-btn c-btn--quiet" href="/vendors">
            All vendors
          </Link>
        </div>
        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Status</th>
                <th>Earliest required expiry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vendor) => {
                const state = vendor.status as VendorState;
                return (
                  <tr key={vendor.id}>
                    <td className="c-table__party">{vendor.name}</td>
                    <td>
                      <StatusPill state={VENDOR_STATUS[state]} word={vendorWord(state)} asOf={today} />
                    </td>
                    <td className="c-date">{vendor.earliestRequiredExpiry ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Surface 2 of the eleven (KB §F.4): a screen that renders a status
          renders the disclaimer. */}
      <Disclaimer of="primary" />
    </main>
  );
}
