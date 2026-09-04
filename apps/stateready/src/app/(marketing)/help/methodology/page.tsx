import Link from 'next/link';

import { Disclaimer } from '@/components/provenance';
import { getDb } from '@/lib/db';
import { coverageTable, listKbRecords } from '@/lib/kb/accessors';
import { walkSourcedValues } from '@/lib/kb/walk';
import { STALENESS_DAYS } from '@/lib/rules/assess';
import { daysBetween } from '@/lib/rules/dates';
import { kbSources } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'How we build and check the rule library — StateReady',
  description:
    'Our target checking cadence, the live figures showing whether we are meeting it, and what "verified", "confidence" and "not published" mean.',
};

/**
 * `/help/methodology` — **the only page on this site allowed to state a
 * cadence**, and it states it as a TARGET beside the live figures.
 *
 * `specs/12` and wave-1b **M12**: a cadence claim on a legal page is a promise
 * about our own uptime, made to a consumer, on the page a state UDAP action
 * would be built from — and `specs/14` itself contemplates the cron failing.
 * The disclaimer therefore carries only what is *structurally* true, and the
 * target lives here, beside the number that says whether we are meeting it.
 * `tests/legal.test.ts` asserts both halves: the words are absent from
 * `/legal/disclaimer` and present here.
 *
 * If the live figures cannot be read (no database in a build container), the
 * page says so rather than printing a zero — a zero here would read as "we
 * check nothing", which is a worse lie than an outage.
 */
export default async function MethodologyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const records = listKbRecords();
  const covered = coverageTable(today).filter((row) => row.covered);

  let checkedLast24h: number | null = null;
  let totalSources: number | null = null;
  try {
    const db = await getDb();
    const rows = await db.select({ lastCheckedAt: kbSources.lastCheckedAt }).from(kbSources);
    totalSources = rows.length;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    checkedLast24h = rows.filter((row) => row.lastCheckedAt && row.lastCheckedAt.getTime() >= cutoff).length;
  } catch {
    checkedLast24h = null;
    totalSources = null;
  }

  const oldest = records
    .flatMap((record) => walkSourcedValues(record))
    .map(({ value }) => value.last_verified)
    .filter((date): date is string => Boolean(date))
    .sort()[0];
  const oldestAgeDays = oldest ? daysBetween(oldest, today) : null;
  const citedSources = new Set(records.flatMap((record) => record.provenance.sources.map((s) => s.url)));

  return (
    <main className="narrow">
      <p className="sr-eyebrow">
        <Link href="/help">Help</Link>
      </p>
      <h1>How we build the rule library, and how we are doing against our own targets</h1>
      <p className="sr-lead">
        This is the only page on this site that states a checking cadence, and it states it as a target
        beside the live figures. A cadence is a promise about our own uptime; the things we guarantee are the
        ones a code path enforces.
      </p>

      <h2>The target, and the actual</h2>
      <table data-testid="methodology-figures">
        <thead>
          <tr>
            <th>Target</th>
            <th>Actual, right now</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Every source checked daily</th>
            <td data-testid="methodology-checked">
              {checkedLast24h === null || totalSources === null
                ? 'We cannot read the live figure on this deployment.'
                : `${checkedLast24h} of ${totalSources} sources checked in the last 24 hours`}
            </td>
          </tr>
          <tr>
            <th scope="row">Every value re-verified monthly</th>
            <td data-testid="methodology-oldest">
              {oldestAgeDays === null
                ? 'No verification dates recorded.'
                : `Oldest last-verified date: ${oldest} — ${oldestAgeDays} days ago`}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="small">
        Where a value has not been re-checked in {STALENESS_DAYS} days we stop showing it as verified and
        show you the board&apos;s page instead. That one is not a target: it is enforced in code on every
        read, which is why it appears on the disclaimer and the cadence does not.
      </p>

      <h2>How a value gets into the library</h2>
      <ol>
        <li>
          One pass reads the board&apos;s own published page and records the value with the exact fragment it
          came from.
        </li>
        <li>
          A second, independent pass re-opens the same page and looks for the same fragment. Agreement is
          what makes a record publishable; disagreement is recorded, not smoothed over.
        </li>
        <li>
          Every value carries its source page, the day we checked it, the two agents that checked it, and a
          confidence.
        </li>
        <li>
          Gates run over every record before it can be published — and again in this application at boot, so
          a record that fails cannot be served.
        </li>
      </ol>

      <h2>What confidence means</h2>
      <ul>
        <li>
          <strong>High</strong> — the board states it plainly, for this licence class, on a page we opened.
        </li>
        <li>
          <strong>Medium</strong> — we read it, but the page did not state it plainly for this class. The
          value is shown with the reading behind it, never as a bare number, and it forces a needs-checking
          flag on any State Entry Pack that uses it.
        </li>
        <li>
          <strong>Low</strong> — flagged wherever it appears.
        </li>
        <li>
          <strong>Not published</strong> — the board publishes no such value. We say so, name the pages we
          read, and never estimate one.
        </li>
      </ul>

      <h2>What we hold today</h2>
      <p className="small" data-testid="methodology-coverage">
        {covered.length} state-and-trade records, {citedSources.size} distinct board pages cited.{' '}
        <Link href="/coverage">The full coverage table</Link> lists every one with the age of its values.
      </p>

      <Disclaimer />
    </main>
  );
}
