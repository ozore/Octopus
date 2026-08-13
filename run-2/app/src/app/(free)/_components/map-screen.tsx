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
  hoursHundredths,
  moneyCents,
  parseCsv,
  rateMilli,
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

function rowsToWorkers(
  table: CsvTable,
  mapping: ColumnMapping,
): { readonly workers: readonly FreeWorker[]; readonly unreadableCells: readonly string[] } {
  const unreadableCells: string[] = [];
  const cell = (row: readonly string[], target: MapTarget): string | undefined => {
    const index = mapping[target];
    return index === undefined ? undefined : row[index];
  };

  const readHours = (row: readonly string[], target: MapTarget, rowNumber: number): number => {
    const value = hoursHundredths(cell(row, target));
    if (value === null) {
      unreadableCells.push(`Row ${rowNumber}, ${target}: “${cell(row, target) ?? ''}” is not a number of hours.`);
      return 0;
    }
    return value;
  };
  const readRate = (row: readonly string[], target: MapTarget, rowNumber: number): number => {
    const value = rateMilli(cell(row, target));
    if (value === null) {
      unreadableCells.push(`Row ${rowNumber}, ${target}: “${cell(row, target) ?? ''}” is not a rate.`);
      return 0;
    }
    return value;
  };
  const readMoney = (row: readonly string[], target: MapTarget, rowNumber: number): number => {
    const value = moneyCents(cell(row, target));
    if (value === null) {
      unreadableCells.push(`Row ${rowNumber}, ${target}: “${cell(row, target) ?? ''}” is not an amount.`);
      return 0;
    }
    return value;
  };

  const workers = table.rows.map((row, index) => {
    const rowNumber = index + 2; // header is row 1, as a spreadsheet counts
    const worker = emptyWorker();
    const line = emptyLine();
    const idRaw = (cell(row, 'idLast4') ?? '').replace(/\D/g, '');
    const statusRaw = (cell(row, 'status') ?? '').trim().toUpperCase();

    return {
      ...worker,
      lastName: (cell(row, 'lastName') ?? '').trim(),
      firstName: (cell(row, 'firstName') ?? '').trim(),
      middleInitial: (cell(row, 'middleInitial') ?? '').trim().slice(0, 1),
      // The LAST FOUR only, taken from the end of whatever the export carried. A
      // nine-digit column is common; nine digits on the federal form are not
      // permitted, and the renderer rejects anything but four.
      idLast4: idRaw.length >= 4 ? idRaw.slice(-4) : null,
      status: statusRaw === 'RA' || statusRaw.startsWith('APP') ? ('RA' as const) : ('J' as const),
      lines: [
        {
          ...line,
          rawTitle: (cell(row, 'classification') ?? '').trim(),
          st: [
            readHours(row, 'st1', rowNumber),
            readHours(row, 'st2', rowNumber),
            readHours(row, 'st3', rowNumber),
            readHours(row, 'st4', rowNumber),
            readHours(row, 'st5', rowNumber),
            readHours(row, 'st6', rowNumber),
            readHours(row, 'st7', rowNumber),
          ],
          ot: [
            readHours(row, 'ot1', rowNumber),
            readHours(row, 'ot2', rowNumber),
            readHours(row, 'ot3', rowNumber),
            readHours(row, 'ot4', rowNumber),
            readHours(row, 'ot5', rowNumber),
            readHours(row, 'ot6', rowNumber),
            readHours(row, 'ot7', rowNumber),
          ],
          cashRateMilli: readRate(row, 'cashRate', rowNumber),
          cashInLieuMilli: readRate(row, 'cashInLieu', rowNumber),
          fringeCreditMilli: readRate(row, 'fringeCredit', rowNumber),
          otRateMilli: mapping['otRate'] === undefined ? null : readRate(row, 'otRate', rowNumber),
          dtRateMilli: mapping['dtRate'] === undefined ? null : readRate(row, 'dtRate', rowNumber),
        },
      ],
      allWorkGrossCents: readMoney(row, 'allWorkGross', rowNumber),
      netPaidCents: readMoney(row, 'netPaid', rowNumber),
    } satisfies FreeWorker;
  });

  return { workers, unreadableCells };
}
