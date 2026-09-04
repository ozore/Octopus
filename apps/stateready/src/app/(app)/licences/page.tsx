import Link from 'next/link';

import { LicenceListRow } from '@/components/licences';
import { getDb } from '@/lib/db';
import { STATUSES } from '@/lib/repos/dashboard';
import { buildLicenceList } from '@/lib/repos/licence-view';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M4 — `/licences`. `specs/04` §Screens.
 *
 * Grouped by state, then by holder, because that is how a coordinator thinks
 * about the problem: "what does Texas need from us this month?" — not "show me
 * every licence sorted by number".
 *
 * **Every filter is in the URL.** A filtered view is a link a coordinator can
 * send to their GM, which is the same property the tile grid has on the board
 * and the same reason: this product's distribution is people forwarding it.
 */
export default async function LicencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const one = (key: string): string | null => {
    const value = params[key];
    return typeof value === 'string' && value !== '' ? value : null;
  };
  const within = one('within');

  const model = await buildLicenceList(db, org.id, today, {
    state: one('state'),
    trade: one('trade'),
    status: one('status'),
    within: within ? Number(within) : null,
  });

  return (
    <>
      <div className="sr-row sr-row--between">
        <div>
          <p className="sr-eyebrow">Licences</p>
          <h1 className="sr-mb-0">What we hold, and when it runs out</h1>
        </div>
        <Link className="sr-btn sr-btn--primary" data-testid="add-licence" href="/licences/new">
          Add a licence
        </Link>
      </div>

      {params['archived'] ? <p className="notice">Archived. The record and its documents stay.</p> : null}

      {model.total === 0 ? (
        <div className="sr-empty" data-testid="licences-empty">
          <h3>No licences yet</h3>
          <p className="muted">
            Add one — the type, the state and the day it was issued — and we will work out when it expires
            from the state&apos;s own rule, and show you the sentence we read it in.
          </p>
          <Link className="sr-btn sr-btn--primary" href="/licences/new">
            Add your first licence
          </Link>
        </div>
      ) : (
        <>
          {/* Filters, as a GET form: the state of this screen IS its URL. */}
          <form className="sr-form-grid sr-mt-6" data-testid="licence-filters" method="get">
            <label className="sr-field" htmlFor="filter-state">
              <span className="sr-field__label">State</span>
              <select className="sr-select" defaultValue={model.filters.state ?? ''} id="filter-state" name="state">
                <option value="">Every state</option>
                {model.states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="sr-field" htmlFor="filter-trade">
              <span className="sr-field__label">Trade</span>
              <select className="sr-select" defaultValue={model.filters.trade ?? ''} id="filter-trade" name="trade">
                <option value="">Every trade</option>
                {model.trades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </label>
            <label className="sr-field" htmlFor="filter-status">
              <span className="sr-field__label">Status</span>
              <select
                className="sr-select"
                defaultValue={model.filters.status ?? ''}
                id="filter-status"
                name="status"
              >
                <option value="">Any status</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="sr-field" htmlFor="filter-within">
              <span className="sr-field__label">Expiring within</span>
              <select
                className="sr-select"
                defaultValue={model.filters.within === null ? '' : String(model.filters.within)}
                id="filter-within"
                name="within"
              >
                <option value="">Any time</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
            <p className="sr-row">
              <button className="sr-btn sr-btn--secondary" type="submit">
                Filter
              </button>
              <Link className="sr-btn sr-btn--ghost" href="/licences">
                Clear
              </Link>
            </p>
          </form>

          <p className="sr-meta" data-testid="licence-count">
            Showing {model.rows.length} of {model.total}.
          </p>

          {model.groups.map((group) => (
            <section className="sr-mt-6" data-testid="licence-group" data-state={group.state} key={group.state}>
              <h2 className="sr-eyebrow">
                {group.stateName} · {group.rows.length}
              </h2>
              <div className="sr-table-wrap">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Number</th>
                      <th scope="col">Holder</th>
                      <th scope="col">Expires</th>
                      <th scope="col">CE</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <LicenceListRow key={row.licence.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
