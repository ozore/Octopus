'use client';

/**
 * S13 → S14 — the upload and component **M**, on the paid side.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.1 (first upload maps; **every upload after that
 * applies the map silently, with one quiet line above the preview**), §5.2 (the SSN
 * sentence), §5.4 (ambiguous encoding is a hard reject; a deduction column with no
 * 29 CFR 3.5 paragraph BLOCKS rather than falling into "Other"), §5.5 (component
 * **M** is the free generator's component, unchanged — "a free user who later pays
 * meets no new UI"), `DESIGN_SYSTEM.md` §8.4 (the dropzone and its receipt).
 *
 * ===========================================================================
 * THE FILE IS PARSED HERE AND POSTED AS ROWS
 *
 * Nothing uploads the CSV itself. The browser parses it, the customer confirms the
 * mapping, and the server receives structured rows plus the file's digest — which is
 * what idempotency keys on. There is therefore no staging copy of a payroll export
 * anywhere in the system, and the consequence is stated on the screen rather than
 * hidden: changing a mapping later means uploading the file again.
 */

import { useMemo, useState } from 'react';

import { ColumnMap, type ColumnMapping } from '../../(free)/_components/column-map';
import {
  MAP_TARGETS,
  hoursHundredths,
  moneyCents,
  parseCsv,
  rateMilli,
  suggestMapping,
  type CsvTable,
  type MapTarget,
} from '../../(free)/_lib/csv';
import { ENCODING_REJECTION, SSN_SENTENCE, rememberedMapSentence } from '../_lib/copy';
import type { DeductionColumn, StoredColumnMap } from '../_lib/imports';

/** The ten lettered paragraphs of 29 CFR 3.5, and the sentinel that blocks. */
const DEDUCTION_CATEGORIES: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'STATUTORY', label: '(a) Tax required by law to be withheld' },
  { value: 'BONA_FIDE_PREPAYMENT', label: '(b) Repayment of a bona fide prepayment of wages' },
  { value: 'COURT_PROCESS', label: '(c) Amounts required by court process' },
  { value: 'BENEFIT_FUND', label: '(d) Contributions to a medical, pension or life-insurance fund' },
  { value: 'CREDIT_UNION', label: '(e) Credit-union loan repayment or share purchase' },
  { value: 'GOVERNMENTAL', label: '(f) Voluntary contributions to a governmental agency' },
  { value: 'CHARITABLE_501C3', label: '(g) Voluntary contributions to a 501(c)(3)' },
  { value: 'UNION_DUES', label: '(h) Initiation fees and membership dues under a CBA' },
  { value: 'BOARD_LODGING_FACILITIES', label: '(i) Board, lodging or other facilities at reasonable cost' },
  { value: 'SAFETY_EQUIPMENT', label: '(j) Safety equipment of nominal value bought by the worker' },
];

export interface ImportWizardProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly projectId: string;
  readonly remembered: {
    readonly map: StoredColumnMap;
    readonly uploadedOn: string;
    readonly sameShape: boolean;
  } | null;
  readonly defaultWeekEnding: string;
}

interface LoadedFile {
  readonly name: string;
  readonly bytes: number;
  readonly text: string;
  readonly sha256: string;
  readonly table: CsvTable;
}

export function ImportWizard(props: ImportWizardProps): React.ReactElement {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [matchedOn, setMatchedOn] = useState<Partial<Record<MapTarget, string>>>({});
  const [deductions, setDeductions] = useState<readonly DeductionColumn[]>([]);
  const [remapping, setRemapping] = useState(false);
  const [weekEnding, setWeekEnding] = useState(props.defaultWeekEnding);
  const [appliedSilently, setAppliedSilently] = useState(false);

  const unmappedColumns = useMemo(() => {
    if (file === null) return [];
    const taken = new Set(Object.values(mapping));
    return file.table.header
      .map((name, index) => ({ name, index }))
      .filter((column) => !taken.has(column.index));
  }, [file, mapping]);

  async function onFile(picked: File): Promise<void> {
    setRejection(null);
    const buffer = new Uint8Array(await picked.arrayBuffer());
    if (!looksLikeUtf8(buffer)) {
      setRejection(ENCODING_REJECTION);
      setFile(null);
      return;
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const table = parseCsv(text);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

    const remembered = props.remembered;
    if (remembered !== null && remembered.sameShape) {
      // §5.1 — applied SILENTLY. No confirmation step, no modal, no "does this look
      // right?". One quiet line above the preview says where it came from.
      setMapping(remembered.map.targets);
      setDeductions(remembered.map.deductions);
      setMatchedOn({});
      setAppliedSilently(true);
      setRemapping(false);
    } else {
      const suggestions = suggestMapping(table.header);
      const proposed: ColumnMapping = {};
      const matched: Partial<Record<MapTarget, string>> = {};
      for (const suggestion of suggestions) {
        proposed[suggestion.target] = suggestion.columnIndex;
        matched[suggestion.target] = suggestion.matchedOn;
      }
      setMapping(proposed);
      setMatchedOn(matched);
      setDeductions([]);
      setAppliedSilently(false);
      setRemapping(true);
    }
    setFile({ name: picked.name, bytes: buffer.byteLength, text, sha256, table });
  }

  if (rejection !== null) {
    return (
      <div className="rp-alert rp-alert--blocked" role="group" aria-label="File not read">
        <span className="rp-alert__glyph" aria-hidden="true">
          ✕
        </span>
        <div className="rp-alert__body">
          <p className="rp-alert__title">This file was not read</p>
          <p>{rejection}</p>
          <button type="button" className="rp-btn rp-btn--quiet" onClick={() => setRejection(null)}>
            Try another file
          </button>
        </div>
      </div>
    );
  }

  if (file === null) {
    return (
      <div className="rp-stack">
        <label className="rp-drop">
          <span className="rp-drop__title">Drop this week’s payroll CSV</span>
          <span className="rp-drop__hint">
            Exported from your payroll system. Ratepin reads it in your browser and posts the rows;
            the file itself is never uploaded and never stored.
          </span>
          <input
            className="rp-drop__input"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const picked = event.currentTarget.files?.[0];
              if (picked) void onFile(picked);
            }}
          />
        </label>
        <p className="rp-t-micro">{SSN_SENTENCE}</p>
      </div>
    );
  }

  if (remapping) {
    return (
      <ColumnMap
        table={file.table}
        receipt={{
          filename: file.name,
          bytes: file.bytes,
          rows: file.table.rows.length,
          columns: file.table.header.length,
          sha256Prefix: `${file.sha256.slice(0, 4)}…${file.sha256.slice(-4)}`,
        }}
        initial={mapping}
        matchedOn={matchedOn}
        confirmLabel="Use this mapping"
        onConfirm={(next) => {
          setMapping(next);
          setRemapping(false);
        }}
        onCancel={() => {
          setFile(null);
          setMapping({});
          setDeductions([]);
        }}
      />
    );
  }

  const rows = buildRows({ table: file.table, mapping, deductions });
  const unmappedDeductionCount = deductions.filter((column) => column.category === 'UNMAPPED').length;

  return (
    <form className="rp-stack rp-stack--section" action={props.action}>
      <input type="hidden" name="projectId" value={props.projectId} />
      <input type="hidden" name="sourceSha256" value={file.sha256} />
      <input type="hidden" name="byteSize" value={String(file.bytes)} />
      <input
        type="hidden"
        name="map"
        value={JSON.stringify({ targets: mapping, deductions, header: file.table.header })}
      />
      <input type="hidden" name="workers" value={JSON.stringify(rows)} />

      {appliedSilently && props.remembered !== null ? (
        <p className="rp-t-data">
          {rememberedMapSentence(props.remembered.uploadedOn)}{' '}
          <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm" onClick={() => setRemapping(true)}>
            Change it
          </button>
        </p>
      ) : null}

      <div className="rp-field">
        <label className="rp-field__label" htmlFor="week-ending">
          Week ending
        </label>
        <input
          id="week-ending"
          name="weekEnding"
          type="date"
          className="rp-input rp-input--num"
          value={weekEnding}
          onChange={(event) => setWeekEnding(event.currentTarget.value)}
        />
        <p className="rp-field__help">
          From your payroll, not from a clock. California’s eCPR schema declares exactly seven days,
          so a week that is not seven days cannot produce valid XML — which is why this is asked
          here rather than discovered at export.
        </p>
      </div>

      <section className="rp-stack">
        <h3>Deduction columns</h3>
        <p>
          A deduction on a signed form asserts that the deduction is permissible. Whether yours is
          permissible under 29 CFR part 3 is a legal question about your specific deduction, and
          Ratepin does not answer it. Name the paragraph it falls under, or leave the column out —
          there is no “Other”.
        </p>
        {unmappedColumns.length === 0 ? (
          <p className="rp-t-data">Every column in this file is mapped to a field of the form.</p>
        ) : (
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">Column</th>
                  <th scope="col">29 CFR 3.5 paragraph</th>
                </tr>
              </thead>
              <tbody>
                {unmappedColumns.map((column) => {
                  const declared = deductions.find((entry) => entry.columnIndex === column.index);
                  return (
                    <tr key={column.index}>
                      <th scope="row">{column.name === '' ? `Column ${column.index + 1}` : column.name}</th>
                      <td>
                        <select
                          className="rp-select"
                          aria-label={`Paragraph for ${column.name}`}
                          value={declared?.category ?? ''}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setDeductions((current) => {
                              const rest = current.filter((entry) => entry.columnIndex !== column.index);
                              if (value === '') return rest;
                              return [
                                ...rest,
                                {
                                  columnIndex: column.index,
                                  rawLabel: column.name === '' ? `Column ${column.index + 1}` : column.name,
                                  category: value as DeductionColumn['category'],
                                },
                              ];
                            });
                          }}
                        >
                          <option value="">— not a deduction —</option>
                          <option value="UNMAPPED">
                            It is a deduction, but I don’t know which paragraph (blocks the row)
                          </option>
                          {DEDUCTION_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rp-stack">
        <h3>The first rows, as the form will read them</h3>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">1B / 1C — Name</th>
                <th scope="col">3 — Classification</th>
                <th scope="col" className="rp-th--num">
                  5 — Total hours
                </th>
                <th scope="col" className="rp-th--num">
                  6A — Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((worker, index) => (
                <tr key={`${worker.lastName}-${String(index)}`}>
                  <td>
                    {worker.lastName}, {worker.firstName}
                  </td>
                  <td>{worker.lines[0]?.rawTitle ?? ''}</td>
                  <td className="rp-td--num">
                    {(
                      (worker.lines[0]?.st.reduce((a, b) => a + b, 0) ?? 0) / 100
                    ).toFixed(2)}
                  </td>
                  <td className="rp-td--num">
                    {((worker.lines[0]?.cashRateMilli ?? 0) / 10000).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rp-t-data rp-num">
          {rows.length} workers · file {file.sha256.slice(0, 8)} · {file.bytes} bytes
        </p>
      </section>

      <div className="rp-btn-row">
        <button
          type="submit"
          className="rp-btn rp-btn--primary"
          aria-disabled={rows.length === 0 ? true : undefined}
          disabled={rows.length === 0}
        >
          Save this week
        </button>
        <button type="button" className="rp-btn rp-btn--quiet" onClick={() => setRemapping(true)}>
          Change the mapping
        </button>
      </div>
      {unmappedDeductionCount > 0 ? (
        <p className="rp-btn__why">
          {unmappedDeductionCount} deduction column
          {unmappedDeductionCount === 1 ? '' : 's'} still carry no paragraph. Those rows will block
          and the filing will render as a draft with the signature block withheld until the
          paragraph is named.
        </p>
      ) : null}
    </form>
  );
}

// ===========================================================================
// Mapping the table onto posted rows
// ===========================================================================

interface WizardLine {
  readonly rawTitle: string;
  readonly st: number[];
  readonly ot: number[];
  readonly dt: number[];
  readonly cashRateMilli: number;
  readonly cashInLieuMilli: number;
  readonly otRateMilli: number | null;
  readonly dtRateMilli: number | null;
  readonly fringeCreditMilli: number;
}

interface WizardWorker {
  readonly externalRef: string | null;
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string | null;
  readonly idLast4: string | null;
  readonly status: 'J' | 'RA';
  readonly allWorkGrossCents: number;
  readonly netPaidCents: number;
  readonly lines: readonly WizardLine[];
  readonly deductions: readonly { rawLabel: string; category: string; amountCents: number }[];
}

function buildRows(input: {
  readonly table: CsvTable;
  readonly mapping: ColumnMapping;
  readonly deductions: readonly DeductionColumn[];
}): WizardWorker[] {
  const cell = (row: readonly string[], target: MapTarget): string | undefined => {
    const index = input.mapping[target];
    return index === undefined ? undefined : row[index];
  };

  return input.table.rows
    .filter((row) => (cell(row, 'lastName') ?? '').trim() !== '')
    .map((row) => {
      const days = (prefix: 'st' | 'ot'): number[] =>
        [1, 2, 3, 4, 5, 6, 7].map(
          (day) => hoursHundredths(cell(row, `${prefix}${String(day)}` as MapTarget)) ?? 0,
        );
      const line: WizardLine = {
        rawTitle: (cell(row, 'classification') ?? '').trim(),
        st: days('st'),
        ot: days('ot'),
        dt: [0, 0, 0, 0, 0, 0, 0],
        cashRateMilli: rateMilli(cell(row, 'cashRate')) ?? 0,
        cashInLieuMilli: rateMilli(cell(row, 'cashInLieu')) ?? 0,
        // NULL IS NOT ZERO: an unproven premium is a different fact from $0.00 paid.
        otRateMilli: cell(row, 'otRate') === undefined ? null : rateMilli(cell(row, 'otRate')),
        dtRateMilli: cell(row, 'dtRate') === undefined ? null : rateMilli(cell(row, 'dtRate')),
        fringeCreditMilli: rateMilli(cell(row, 'fringeCredit')) ?? 0,
      };
      const statusRaw = (cell(row, 'status') ?? 'J').trim().toUpperCase();
      return {
        externalRef: null,
        lastName: (cell(row, 'lastName') ?? '').trim(),
        firstName: (cell(row, 'firstName') ?? '').trim(),
        middleInitial: (cell(row, 'middleInitial') ?? '').trim() || null,
        idLast4: (cell(row, 'idLast4') ?? '').trim().slice(-4) || null,
        status: statusRaw.startsWith('RA') || statusRaw.startsWith('A') ? 'RA' : 'J',
        allWorkGrossCents: moneyCents(cell(row, 'allWorkGross')) ?? 0,
        netPaidCents: moneyCents(cell(row, 'netPaid')) ?? 0,
        lines: [line],
        deductions: input.deductions.map((column) => ({
          rawLabel: column.rawLabel,
          category: column.category,
          amountCents: moneyCents(row[column.columnIndex]) ?? 0,
        })),
      } satisfies WizardWorker;
    });
}

/**
 * A conservative UTF-8 check.
 *
 * §5.4: guessing corrupts names — `Núñez` becomes `NuÃ±ez` — on a document somebody
 * signs, so a file we cannot read confidently is refused rather than decoded on a
 * hunch. Pure ASCII passes; valid UTF-8 multibyte sequences pass; a stray high byte
 * that is not part of one does not.
 */
function looksLikeUtf8(bytes: Uint8Array): boolean {
  let index = 0;
  while (index < bytes.length) {
    const byte = bytes[index] ?? 0;
    if (byte < 0x80) {
      index += 1;
      continue;
    }
    const length = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 0;
    if (length === 0) return false;
    for (let offset = 1; offset < length; offset += 1) {
      const next = bytes[index + offset];
      if (next === undefined || (next & 0xc0) !== 0x80) return false;
    }
    index += length;
  }
  return true;
}

export { MAP_TARGETS };
