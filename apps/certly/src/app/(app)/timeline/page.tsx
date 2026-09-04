import Link from 'next/link';

import { CoverageBar, CoverageLegend } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getDb } from '@/lib/db';
import { orgToday, daysBetween } from '@/lib/engine';
import { rosterForScope } from '@/lib/repos/dashboard';
import { ensureOrgSettings } from '@/lib/repos';
import { VENDOR_STATUS, vendorWord } from '@/lib/status';
import { coverageWindow } from '../dashboard/coverage-window';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE EXPIRY TIMELINE — `UX.md` S14, `specs/06` A9.
 *
 * One row per vendor on a SHARED date axis, with one today rule drawn across
 * the whole grid rather than a marker per row. That is the difference between a
 * chart and a list of bars: the answer the manager wants — "who lapses before
 * the end of the quarter?" — is read off the vertical, not off twelve
 * individual dates.
 *
 * Surface 4 of the eleven (KB §F.4): the timeline renders a status, so it
 * renders the §F.1 disclaimer.
 */

const WINDOW_DAYS = 365;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthTicks(start: string): string[] {
  const ticks: string[] = [];
  const year = Number(start.slice(0, 4));
  const month = Number(start.slice(5, 7)) - 1;
  for (let i = 0; i < 12; i += 1) {
    const m = (month + i) % 12;
    ticks.push(MONTHS[m] ?? '');
  }
  return ticks;
}

export default async function TimelinePage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const start = new Date(Date.parse(`${today}T00:00:00Z`) - 30 * 86_400_000).toISOString().slice(0, 10);

  const vendors = await rosterForScope(db, { orgId: org.id, sort: 'expiry', limit: 500 });
  const withDates = vendors.filter((vendor) => vendor.earliestRequiredExpiry);

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Expiry timeline</h1>
          <p className="c-page__lede">
            One row per vendor on a shared axis. The rule is today; a bar ends at the earliest expiry a
            requirement of yours depends on.
          </p>
        </div>
        <span className="c-asof">
          as of <time dateTime={today}>{today}</time>
        </span>
      </header>

      {withDates.length === 0 ? (
        <section className="c-empty" data-testid="timeline-empty">
          <p className="c-empty__title">No expiry dates on record yet.</p>
          <p className="c-muted">
            A date appears here when a certificate has been read and compared. Until then the vendors are
            on the <Link href="/dashboard?status=no_certificate">no-certificate list</Link>, which is the
            more useful place to start.
          </p>
        </section>
      ) : (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Next twelve months</h2>
            <span className="c-xs c-muted">{withDates.length} vendors with a date on record</span>
          </div>

          <div className="c-timeline" data-testid="timeline">
            <div className="c-timeline__head">
              <span className="c-timeline__party" />
              <div className="c-timeline__months" aria-hidden="true">
                {monthTicks(start).map((tick, index) => (
                  <span key={`${tick}-${index}`}>{tick}</span>
                ))}
              </div>
            </div>

            {withDates.map((vendor) => {
              const expiry = vendor.earliestRequiredExpiry as string;
              const band = coverageWindow({
                status: vendor.status,
                earliestRequiredExpiry: expiry,
                today,
                vendorName: vendor.name,
              });
              return (
                <div className="c-timeline__row" key={vendor.id} data-testid={`timeline-row-${vendor.id}`}>
                  <span className="c-timeline__party">
                    <Link href={`/dashboard/${vendor.id}`}>{vendor.name}</Link>
                  </span>
                  {/* The SAME band arithmetic the dashboard row uses, so a
                      vendor cannot look different on two screens. */}
                  <div className="c-timeline__grid">
                    <CoverageBar
                      segments={band.segments}
                      ariaLabel={band.ariaLabel}
                      todayAt={band.todayAt}
                      testId={`timeline-bar-${vendor.id}`}
                    />
                    <span className="c-gap-2">
                      <StatusPill
                        state={VENDOR_STATUS[vendor.status]}
                        word={vendorWord(vendor.status)}
                        detail={`${daysBetween(today, expiry)}d`}
                        asOf={today}
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <CoverageLegend states={[...new Set(withDates.map((vendor) => VENDOR_STATUS[vendor.status]))]} />
        </section>
      )}

      {/* Surface 4 of the eleven (KB §F.4). */}
      <Disclaimer of="primary" />
    </main>
  );
}
