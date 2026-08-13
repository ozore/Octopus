'use client';

/**
 * S02 — the free tier's host for component **M**.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.3 S02, §5.5, `DESIGN_SYSTEM.md` §8.4.
 *
 * This file is the ADAPTER, not the component. It reads the CSV the previous screen
 * left in the browser, hands `ColumnMap` a table, a receipt and a suggestion, and
 * turns the confirmed mapping into payroll rows. The paid tier's S14 will write its
 * own adapter over an uploaded import and render the identical component — which is
 * the point of keeping the two apart.
 *
 * THE FILE IS NEVER UPLOADED ON THIS PATH. It is read with `File.text()` in the
 * browser and mapped in the browser; only the resulting rows travel, and only when
 * the visitor presses Generate. An anonymous stranger's payroll export is exactly
 * the kind of thing a retention policy exists to forget, and the cheapest forgetting
 * is never having received it.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  fileReceipt,
  mapRows,
  parseCsv,
  suggestMapping,
  type CsvTable,
  type FileReceipt,
  type MapTarget,
} from '../_lib/csv';
import { emptyLine, emptyWorker, type FreeSession, type FreeWorker } from '../_lib/session';
import { CSV_KEY, DRAFT_KEY } from '../_lib/wire';
import { ColumnMap, type ColumnMapping } from './column-map';

export function MapScreen(): React.ReactElement {
  const router = useRouter();
  const [table, setTable] = useState<CsvTable | null>(null);
  const [receipt, setReceipt] = useState<FileReceipt | null>(null);
  const [initial, setInitial] = useState<ColumnMapping>({});
  const [matchedOn, setMatchedOn] = useState<Partial<Record<MapTarget, string>>>({});
  const [unreadable, setUnreadable] = useState<readonly string[]>([]);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(CSV_KEY);
    if (raw === null) return;
    const parsed = JSON.parse(raw) as { filename: string; text: string };
    const parsedTable = parseCsv(parsed.text);
    setTable(parsedTable);
    void fileReceipt(parsed.filename, parsed.text, parsedTable).then(setReceipt);
    const suggestions = suggestMapping(parsedTable.header);
    const mapping: ColumnMapping = {};
    const reasons: Partial<Record<MapTarget, string>> = {};
    for (const suggestion of suggestions) {
      mapping[suggestion.target] = suggestion.columnIndex;
      reasons[suggestion.target] = suggestion.matchedOn;
    }
    setInitial(mapping);
    setMatchedOn(reasons);
  }, []);

  if (table === null || receipt === null) {
    return (
      <div className="rp-empty">
        <p className="rp-empty__title">There is no file on this screen</p>
        <p className="rp-empty__body">
          The mapping screen reads a CSV your browser is holding from the previous step. Nothing was
          uploaded, so there is nothing here to recover — go back and choose the file again.
        </p>
        <div className="rp-btn-row">
          <button type="button" className="rp-btn rp-btn--primary" onClick={() => router.push('/wh347')}>
            Back to the generator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-stack rp-stack--section">
      <ColumnMap
        table={table}
        receipt={receipt}
        initial={initial}
        matchedOn={matchedOn}
        confirmLabel="Use these columns"
        onCancel={() => {
          window.sessionStorage.removeItem(CSV_KEY);
          router.push('/wh347');
        }}
        onConfirm={(mapping) => {
          const { workers, unreadableCells } = rowsToWorkers(table, mapping);
          if (unreadableCells.length > 0) {
            // P-A at the cell: name the row, the column and the value, and preserve
            // everything the visitor already did. Nothing is dropped and nothing is
            // coerced — a cell we could not read becomes a question, never a zero.
            setUnreadable(unreadableCells);
            return;
          }
          const draft = window.localStorage.getItem(DRAFT_KEY);
          const session: FreeSession | null = draft === null ? null : (JSON.parse(draft) as FreeSession);
          if (session !== null) {
            window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...session, workers }));
          }
          window.sessionStorage.removeItem(CSV_KEY);
          router.push('/wh347');
        }}
      />

      {unreadable.length > 0 ? (
        <div className="rp-alert rp-alert--blocked">
          <span className="rp-alert__glyph" aria-hidden="true">
            ✕
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">
              {unreadable.length === 1
                ? 'One cell could not be read as a number'
                : `${unreadable.length} cells could not be read as a number`}
            </p>
            <ul className="rp-stack rp-stack--tight">
              {unreadable.map((sentence) => (
                <li key={sentence}>{sentence}</li>
              ))}
            </ul>
            <p>
              Ratepin does not coerce a cell it could not read into a zero, because a zero on this
              form means the worker was paid nothing rather than that we could not tell. Fix the
              cell in your export, or map that field to a different column.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ===========================================================================
// The mapped rows
// ===========================================================================

/**
 * The projection lives in `_lib/csv.ts`, with component **M** itself, because S14
 * needs exactly this function and a second copy of it had already drifted from this
 * one in four places (see `mapRows`). This adapter only widens the neutral shape to
 * `FreeWorker`, which adds the free tier's own `chosenOrdinal`.
 */
function rowsToWorkers(
  table: CsvTable,
  mapping: ColumnMapping,
): { readonly workers: readonly FreeWorker[]; readonly unreadableCells: readonly string[] } {
  const { workers, unreadableCells } = mapRows({ table, mapping });
  return {
    workers: workers.map((worker) => ({
      ...emptyWorker(),
      ...worker,
      // The day arrays are copied rather than aliased: `FreeSession` is edited in
      // place by the generator's controlled inputs, and `MappedLine` is readonly.
      lines: worker.lines.map((line) => ({
        ...emptyLine(),
        ...line,
        st: [...line.st],
        ot: [...line.ot],
        dt: [...line.dt],
        chosenOrdinal: null,
      })),
      deductions: [],
    })),
    unreadableCells,
  };
}
