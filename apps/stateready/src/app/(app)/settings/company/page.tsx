import Link from 'next/link';

import { StatusChip, TileGrid, type Tile } from '@/components/status';
import { getDb } from '@/lib/db';
import { getCoverage, JURISDICTION_NAMES, LAUNCH_STATES, TRADES, US_JURISDICTIONS } from '@/lib/kb/accessors';
import type { Trade } from '@/lib/kb/types';
import { saveCompanyProfileAction, setOperatingStatesAction } from '@/lib/actions';
import { getCompanyProfile, listOperatingStates } from '@/lib/repos/company';
import { limitOf } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M2 — the company profile, as a settings screen. `specs/02`.
 *
 * `/onboarding/states` uses THE SAME COMPONENT as the dashboard: the tile grid,
 * not a geographic map (wave-1b **m14**). The grid here is a picker, so it
 * carries checkboxes rather than buttons, but the tiles and the coverage
 * marking are the identity's.
 *
 * The **covered count is computed from `getCoverage()`, never from the
 * selection**: someone will select all fifty states and this screen must not
 * then claim fifty-state coverage (`specs/02` §Edge cases).
 */
export default async function CompanySettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, entitlement } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [profile, operating] = await Promise.all([
    getCompanyProfile(db, org.id),
    listOperatingStates(db, org.id),
  ]);
  const selected = new Set(operating.map((row) => `${row.state}:${row.trade}`));
  const selectedStates = new Set(operating.map((row) => row.state));
  const stateLimit = limitOf(entitlement, 'states', 1);

  const coveredPairs = operating.filter((row) => getCoverage(row.state, row.trade as Trade, today).covered);

  const tiles: Tile[] = US_JURISDICTIONS.map((state) => {
    const inFootprint = selectedStates.has(state);
    const covered = TRADES.some((trade) => getCoverage(state, trade, today).covered);
    return {
      state,
      stateName: JURISDICTION_NAMES[state] ?? state,
      status: inFootprint ? (covered ? 'READY' : 'NOT TRACKED') : null,
      licenceCount: 0,
      accessibleName: inFootprint
        ? `${JURISDICTION_NAMES[state] ?? state} — ${covered ? 'covered' : 'not yet covered'}, in your footprint`
        : `${JURISDICTION_NAMES[state] ?? state} — not in your footprint`,
    };
  });

  return (
    <>
      <p className="sr-eyebrow">Settings</p>
      <h1>Company profile</h1>
      <p className="sr-lead">
        Every deadline StateReady shows you is only correct if it knows which entities you operate, in which
        states, in which trades.
      </p>

      {params['saved'] ? <p className="notice">Saved.</p> : null}
      {params['refused'] ? (
        <p className="notice warn">
          Some states were kept because they still have active licences. Archive the licences first, or keep
          the state selected.
        </p>
      ) : null}
      {params['error'] === 'state_limit' ? (
        <p className="notice error" data-testid="state-limit">
          Your plan covers {String(params['allowed'])} state
          {params['allowed'] === '1' ? '' : 's'} and you selected {String(params['requested'])}.{' '}
          <Link href="/settings/billing">Move up a plan</Link>
          {Number(params['requested']) > 15 ? (
            <> — or, above fifteen states, ask us for a quote and we answer within two business days.</>
          ) : null}
        </p>
      ) : null}

      <section className="sr-card">
        <h2 className="sr-card__title">Legal name</h2>
        <form className="stack" action={saveCompanyProfileAction}>
          <label htmlFor="legalName">Company legal name</label>
          <input
            id="legalName"
            name="legalName"
            defaultValue={profile?.legalName ?? org.name}
            required
            minLength={2}
            maxLength={200}
          />
          <label htmlFor="technicianCountBand">How many licensed people do you track?</label>
          <select
            id="technicianCountBand"
            name="technicianCountBand"
            defaultValue={profile?.technicianCountBand ?? ''}
          >
            <option value="">Prefer not to say</option>
            <option value="1-5">1–5</option>
            <option value="6-20">6–20</option>
            <option value="21-50">21–50</option>
            <option value="51-100">51–100</option>
            <option value="100+">More than 100</option>
          </select>
          <button className="button" type="submit">
            Save
          </button>
        </form>
      </section>

      <section className="sr-card">
        <h2 className="sr-card__title">Where you work</h2>
        <p className="small muted">
          Pick the state and the trade together. A company can be electrical in Texas and plumbing in Florida
          and neither of the other two — so we store the pair, not two lists.
        </p>

        <div className="sr-row" style={{ marginBottom: 'var(--sr-space-4)' }}>
          <StatusChip status="READY">
            {coveredPairs.length} covered
          </StatusChip>
          <span className="badge">
            {operating.length} selected · plan allows{' '}
            {typeof stateLimit === 'number' && stateLimit > 0 ? stateLimit : 'unlimited'} states
          </span>
        </div>

        <TileGrid tiles={tiles} />

        <form action={setOperatingStatesAction} style={{ marginTop: 'var(--sr-space-5)' }}>
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th scope="col">State</th>
                  {TRADES.map((trade) => (
                    <th scope="col" key={trade}>
                      {trade}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LAUNCH_STATES.map((state) => (
                  <tr key={state}>
                    <th scope="row">
                      {state} <span className="muted small">{JURISDICTION_NAMES[state] ?? ''}</span>
                    </th>
                    {TRADES.map((trade) => {
                      const covered = getCoverage(state, trade, today).covered;
                      const id = `pair-${state}-${trade}`;
                      return (
                        <td key={trade}>
                          <label htmlFor={id} className="small" style={{ display: 'flex', gap: 8 }}>
                            <input
                              id={id}
                              type="checkbox"
                              name="pair"
                              value={`${state}:${trade}`}
                              defaultChecked={selected.has(`${state}:${trade}`)}
                              style={{ inlineSize: 'auto', minBlockSize: 0 }}
                            />
                            <span className={covered ? '' : 'muted'}>
                              {covered ? 'covered' : 'not yet covered'}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            Selecting a state we do not yet cover records the demand and tracks the dates you enter — we will
            not derive deadlines or sell you an Entry Pack for it.
          </p>
          <button className="button" type="submit">
            Save where we work
          </button>
        </form>
      </section>
    </>
  );
}
