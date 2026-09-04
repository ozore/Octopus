/**
 * The lookup widget: state → county → construction type (WL-00, UX.md P2).
 *
 * A PLAIN HTML FORM WITH A GET ACTION, and that is a decision. The result page
 * is server-rendered and crawlable — 3,088 (state, county) pairs × 4
 * construction types is the only organic acquisition channel this product has —
 * so the widget's job is to produce a URL, not to fetch JSON. It works with
 * JavaScript disabled, it is linkable, and it is back-buttonable.
 *
 * The county select is populated on the server for the chosen state, so there
 * is no client fetch at all on first paint. Changing state submits the form
 * back to itself (`name="step"`), which costs one round trip and removes an
 * entire class of hydration bug from the most important page on the site.
 */

import { CONSTRUCTION_TYPES, CONSTRUCTION_TYPE_DESCRIPTIONS } from '@/lib/kb';

export type LookupFormProps = {
  states: Array<{ stateCode: string }>;
  counties: Array<{ slug: string; countyName: string }>;
  selectedState?: string;
  selectedCounty?: string;
  selectedType?: string;
  /** Where the GET lands. `/lookup` redirects to the indexable result page;
   *  the landing page points it at itself so the result renders in place,
   *  below the widget, which is what LANDING_SPEC §3's wireframe draws.
   *  Additive and defaulted: every existing call site is unchanged. */
  action?: string;
};

export function LookupForm({
  states,
  counties,
  selectedState,
  selectedCounty,
  selectedType,
  action = '/lookup',
}: LookupFormProps) {
  return (
    <form className="wl-lookup" action={action} method="get" data-testid="lookup-form">
      <div className="wl-field">
        <label className="wl-field__label" htmlFor="state">State</label>
        <select
          id="state"
          name="state"
          className="wl-select"
          defaultValue={selectedState ?? ''}
          data-testid="lookup-state"
        >
          <option value="">Choose a state</option>
          {states.map((s) => (
            <option key={s.stateCode} value={s.stateCode}>
              {s.stateCode}
            </option>
          ))}
        </select>
      </div>

      <div className="wl-field">
        <label className="wl-field__label" htmlFor="county">County</label>
        <select
          id="county"
          name="county"
          className="wl-select"
          defaultValue={selectedCounty ?? ''}
          disabled={counties.length === 0}
          data-testid="lookup-county"
        >
          <option value="">{counties.length === 0 ? 'Choose a state first' : 'Choose a county'}</option>
          {counties.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.countyName}
            </option>
          ))}
        </select>
      </div>

      <div className="wl-field">
        <label className="wl-field__label" htmlFor="type">Construction type</label>
        <select
          id="type"
          name="type"
          className="wl-select"
          defaultValue={selectedType ?? ''}
          data-testid="lookup-type"
        >
          <option value="">All four</option>
          {CONSTRUCTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="wl-field__help">
          {selectedType
            ? CONSTRUCTION_TYPE_DESCRIPTIONS[selectedType as (typeof CONSTRUCTION_TYPES)[number]]
            : 'Building, Residential, Highway or Heavy — choosing the wrong one is the most common way to end up on the wrong determination.'}
        </p>
      </div>

      <div className="wl-lookup__actions">
        <button className="wl-btn wl-btn--primary" type="submit" data-testid="lookup-submit">
          Show the rates
        </button>
      </div>
    </form>
  );
}
