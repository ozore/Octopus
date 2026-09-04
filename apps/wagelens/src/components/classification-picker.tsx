import Link from 'next/link';

import { ClassificationTable } from './determination';
import type { Provenance } from './provenance';
import type { ClassificationRow } from '@/lib/kb';

/**
 * WL-03's picker, inline — the component WL-04's mapping screen searches with.
 *
 * **It searches ONLY the classifications on this project's pinned
 * modification** (V1, gate G9). There is no "search all rates" surface in the
 * MVP, because a rate with no contract behind it is a rate somebody will put on
 * a federal form.
 *
 * **"None of these match" is a persistent secondary action, never the first
 * one.** Nine times in ten it means the row has not been found yet, so the
 * panel searches harder first and explains conformance third — and even then it
 * prepares a worksheet for the contracting officer rather than deciding
 * anything. 29 CFR 5.5(a)(1)(iii)(B): conformance may not be used to split,
 * subdivide or otherwise avoid a classification that is already listed.
 *
 * Rows are keyed on `kb_classifications.id`, never on the label: labels repeat
 * within one determination (`ELECTRICIAN` appears twice on TX20260253 at
 * $38.50 and $18.00) and the table is keyed on `(wd_id, line_no)` for exactly
 * that reason.
 */
export function ClassificationPicker({
  rows,
  total,
  query,
  provenance,
  searchAction,
  hiddenSearchFields,
  mapAction,
  hiddenMapFields,
  noneMatchHref,
  determinationTextHref,
  heading,
}: {
  rows: ClassificationRow[];
  total: number;
  query: string;
  provenance: Provenance;
  /** A GET route: search is server-side, so a 300-classification
   *  determination is paged rather than shipped to the browser. */
  searchAction: string;
  hiddenSearchFields?: Record<string, string>;
  mapAction: (formData: FormData) => Promise<void>;
  hiddenMapFields?: Record<string, string>;
  noneMatchHref: string;
  determinationTextHref: string;
  heading?: string;
}) {
  return (
    <div className="wl-stack" data-testid="classification-picker">
      <form className="wl-row" method="get" action={searchAction} role="search">
        {Object.entries(hiddenSearchFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="classification-query">
            Search this determination
          </label>
          <input
            className="wl-input"
            id="classification-query"
            name="q"
            defaultValue={query}
            placeholder="electrician, backhoe, drywall"
            autoComplete="off"
          />
          <p className="wl-field__help">
            Search the work, not the job title — classification follows the work actually
            performed.
          </p>
        </div>
        <button className="wl-btn wl-btn--secondary" type="submit">
          Search
        </button>
      </form>

      <ClassificationTable
        rows={rows}
        total={total}
        provenance={provenance}
        query={query || undefined}
        heading={
          heading ??
          `${total} classification${total === 1 ? '' : 's'} on ${provenance.wdNumber} mod ${provenance.modificationNumber}${query ? ` matching “${query}”` : ''}`
        }
        showQualifier
        rowAction={(row) => (
          <form action={mapAction}>
            {Object.entries(hiddenMapFields ?? {}).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <input type="hidden" name="kbClassificationId" value={row.id} />
            <button
              className="wl-btn wl-btn--secondary wl-btn--sm"
              type="submit"
              data-testid="map-classification"
            >
              Map
            </button>
          </form>
        )}
        emptyMessage={
          <div className="wl-stack-2" data-testid="classification-zero-results">
            <p className="wl-strong">Not finding it?</p>
            <ol>
              <li>Try a broader word — &ldquo;operator&rdquo; before &ldquo;trackhoe&rdquo;.</li>
              <li>
                <Link href={determinationTextHref}>Read the determination in full</Link>{' '}
                — the wording of a classification often answers the question the list cannot.
              </li>
              <li>
                <Link href={noneMatchHref} data-testid="none-match">
                  What if nothing matches?
                </Link>
              </li>
            </ol>
          </div>
        }
        footer={
          <p className="wl-sm">
            <Link
              className="wl-btn wl-btn--ghost wl-btn--sm"
              href={noneMatchHref}
              data-testid="none-match-persistent"
            >
              None of these match what they actually do
            </Link>
          </p>
        }
      />

      <p className="wl-2xs wl-muted">
        Welders take the rate of the craft they are welding for; that is a rule in the
        determination, not a classification you can pick.
      </p>
    </div>
  );
}
