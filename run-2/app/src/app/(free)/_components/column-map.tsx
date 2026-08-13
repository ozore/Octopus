'use client';

/**
 * COMPONENT **M** — the column-mapping screen, shared by S02 (free, `/wh347/map`)
 * and S14 (paid, `/app/imports/[id]/map`).
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.5 ("Why component M is shared with the free
 * generator"), §1.3 S02 ("Identical component to S14. **A free user who later pays
 * meets no new UI**"), §5.4 (the unhappy paths), §0.7 heuristic 4,
 * `DESIGN_SYSTEM.md` §8.3 (form controls), §8.4 (the dropzone and its receipt),
 * §8.5 (the data table).
 *
 * ===========================================================================
 * DO NOT FORK THIS COMPONENT
 *
 * It is deliberately free of both tiers' vocabulary: it takes a parsed table, a
 * receipt, a mapping and three callbacks, and it knows nothing about accounts,
 * projects, imports or sessions. A paid caller passes its own table and its own
 * `remembered` map and gets the identical screen. The moment the two tiers have two
 * mapping screens, the free generator stops being the paid product's tested
 * fallback (`ARCHITECTURE.md` §3.8) and starts being a demo — and the promise that
 * "a free user who later pays meets no new UI" quietly stops being true.
 *
 * ===========================================================================
 * THREE RULES THIS SCREEN KEEPS
 *
 * 1. **A suggestion says what it matched on.** Recognition rather than recall
 *    (#6) is not served by a filled select whose reasoning is invisible; it is
 *    served by a filled select that says *matched on "job title"*, which a payroll
 *    administrator can check in four seconds.
 * 2. **An uncertain target stays empty.** A near-miss looks answered. A blank is
 *    visibly unanswered, and on the screen that decides which column becomes a rate
 *    on a federal form, visibly unanswered is the safer failure.
 * 3. **The button says why it is inert.** `DESIGN_SYSTEM.md` §8.2: a disabled
 *    button with no adjacent reason is a review failure.
 */

import { useMemo, useState } from 'react';

import { MAP_TARGETS, type CsvTable, type FileReceipt, type MapTarget } from '../_lib/csv';

export type ColumnMapping = Partial<Record<MapTarget, number>>;

export interface ColumnMapProps {
  readonly table: CsvTable;
  readonly receipt: FileReceipt;
  readonly initial: ColumnMapping;
  /** The alias each suggestion matched on, keyed by target. Absent means the
   *  mapping came from the person rather than from the suggester. */
  readonly matchedOn: Partial<Record<MapTarget, string>>;
  readonly onConfirm: (mapping: ColumnMapping) => void;
  readonly onCancel: () => void;
  readonly confirmLabel: string;
}

export function ColumnMap(props: ColumnMapProps): React.ReactElement {
  const [mapping, setMapping] = useState<ColumnMapping>(props.initial);

  const missing = useMemo(
    () => MAP_TARGETS.filter((spec) => spec.required && mapping[spec.target] === undefined),
    [mapping],
  );

  const preview = props.table.rows.slice(0, 3);

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h2>Match your columns to the WH-347</h2>
        <p>
          Every target below is a field of the form itself. Ratepin filled in the ones whose header
          it could match exactly and left the rest empty — an empty select is a question, and a
          wrong guess on this screen becomes a number on a document you sign.
        </p>
      </section>

      {/* SC 3.3.7 — the receipt exists so a person who is not sure whether the
          upload took can see that it did, rather than doing it again. */}
      <section className="rp-stack rp-stack--tight">
        <h3>The file we read</h3>
        <dl className="rp-drop__receipt rp-num">
          <div className="rp-row rp-row--between">
            <dt>File</dt>
            <dd>{props.receipt.filename}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Bytes</dt>
            <dd>{props.receipt.bytes}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Rows detected</dt>
            <dd>{props.receipt.rows}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>SHA-256</dt>
            <dd>{props.receipt.sha256Prefix}</dd>
          </div>
        </dl>
      </section>

      <section className="rp-stack">
        <h3>Columns</h3>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Map each WH-347 field to a column of your payroll export
            </caption>
            <thead>
              <tr>
                <th scope="col">WH-347 field</th>
                <th scope="col">Your column</th>
                <th scope="col">First rows of that column</th>
              </tr>
            </thead>
            <tbody>
              {MAP_TARGETS.map((spec) => {
                const selected = mapping[spec.target];
                const selectId = `map-${spec.target}`;
                const helpId = `${selectId}-help`;
                return (
                  <tr key={spec.target} data-row={selected === undefined && spec.required ? 'blocked' : undefined}>
                    <th scope="row">
                      <label htmlFor={selectId} className="rp-field__label">
                        {spec.label}
                        {spec.required ? ' — required' : ''}
                      </label>
                      {props.matchedOn[spec.target] !== undefined && selected !== undefined ? (
                        <span className="rp-t-micro" id={helpId}>
                          {' '}
                          matched on “{props.matchedOn[spec.target]}”
                        </span>
                      ) : null}
                    </th>
                    <td>
                      <select
                        id={selectId}
                        className="rp-select"
                        aria-describedby={props.matchedOn[spec.target] === undefined ? undefined : helpId}
                        aria-invalid={selected === undefined && spec.required ? true : undefined}
                        value={selected === undefined ? '' : String(selected)}
                        onChange={(event) => {
                          const raw = event.currentTarget.value;
                          setMapping((current) => {
                            const next: ColumnMapping = { ...current };
                            if (raw === '') delete next[spec.target];
                            else next[spec.target] = Number(raw);
                            return next;
                          });
                        }}
                      >
                        <option value="">— not in my file —</option>
                        {props.table.header.map((name, index) => (
                          <option key={`${name}:${index}`} value={String(index)}>
                            {name === '' ? `Column ${index + 1}` : name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="rp-num">
                      {selected === undefined
                        ? ''
                        : preview
                            .map((row) => row[selected] ?? '')
                            .filter((cell) => cell !== '')
                            .join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rp-btn-row">
        <button
          type="button"
          className="rp-btn rp-btn--primary"
          aria-disabled={missing.length > 0 ? true : undefined}
          onClick={() => {
            if (missing.length > 0) return;
            props.onConfirm(mapping);
          }}
        >
          {props.confirmLabel}
        </button>
        <button type="button" className="rp-btn rp-btn--quiet" onClick={props.onCancel}>
          Start over
        </button>
      </div>
      {missing.length > 0 ? (
        <p className="rp-btn__why">
          Still unmatched: {missing.map((spec) => spec.label).join(', ')}. The form cannot be built
          without a name, a classification and a rate for each row.
        </p>
      ) : null}
    </div>
  );
}
