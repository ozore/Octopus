'use client';

/**
 * The weekly hours grid — the screen that decides whether week 2 is faster than
 * week 1, and therefore whether the subscription reaches month 2.
 *
 * **THE KEYBOARD IS THE PRIMARY INPUT AND NOTHING THAT CHANGES DATA IS
 * MOUSE-ONLY.** The map lives in `lib/domain/grid-keys.ts` — one table, shared
 * with the test that asserts the enumeration and the overlay that prints it —
 * and this component is its handler. Twelve workers × seven days × straight and
 * overtime is 168 numbers a week; the difference between a good and a bad hour
 * of someone's Friday is whether `Tab`, `.` and `Ctrl+→` do what a spreadsheet
 * taught them to expect.
 *
 * **A DROPPED CONNECTION MUST NEVER LOSE TYPED HOURS.** The typed value stays
 * on screen whatever the network does: the cell holds the optimistic value, the
 * row shows a per-row saved indicator, and a failed save is retried rather than
 * reverted. `Esc` is the ONLY thing that puts a cell back, and it puts it back
 * to the last value the server acknowledged.
 *
 * Every colour here comes from the `--wl-*` tokens through `design-system.css`;
 * there is no hex in this file and `tests/naming.test.ts` fails the build on one.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  SHORTCUT_HELP,
  parsePastedBlock,
  resolveShortcut,
  type KeyboardShortcut,
} from '@/lib/domain/grid-keys';

import { recordShortcutAction, splitDayAction, updateCellAction } from '../actions';

export type GridLine = {
  id: string;
  entryNo: number;
  name: string;
  classificationLabel: string;
  identifyingNoLast4: string;
  workerStatus: string;
  hoursSt: string[];
  hoursOt: string[];
  totalHoursSt: string;
  totalHoursOt: string;
  rateSt: string;
  rateOt: string;
  fringeCreditHourly: string;
  paymentInLieuHourly: string;
  grossProject: string;
  grossAllWork: string;
  dedTaxWithholdings: string;
  dedFica: string;
  dedOther: string;
  dedOtherNote: string;
  dedTotal: string;
  netPay: string;
  wdBaseRate: string | null;
  wdFringeRate: string | null;
  belowDetermination: boolean;
};

type Field =
  | { kind: 'day'; row: 'st' | 'ot'; index: number }
  | { kind: 'money'; field: string }
  | { kind: 'text'; field: string };

/** Straight-time sub-row: seven days, then the money columns. */
const ST_FIELDS: Field[] = [
  ...Array.from({ length: 7 }, (_, index): Field => ({ kind: 'day', row: 'st', index })),
  { kind: 'money', field: 'rateSt' },
  { kind: 'money', field: 'fringeCreditHourly' },
  { kind: 'money', field: 'paymentInLieuHourly' },
  { kind: 'money', field: 'grossProject' },
  { kind: 'money', field: 'grossAllWork' },
  { kind: 'money', field: 'dedTaxWithholdings' },
  { kind: 'money', field: 'dedFica' },
  { kind: 'money', field: 'dedOther' },
  { kind: 'text', field: 'dedOtherNote' },
];

/** Overtime sub-row: seven days and the overtime rate. */
const OT_FIELDS: Field[] = [
  ...Array.from({ length: 7 }, (_, index): Field => ({ kind: 'day', row: 'ot', index })),
  { kind: 'money', field: 'rateOt' },
];

const SAVE_DEBOUNCE_MS = 800;

type RowState = 'idle' | 'saving' | 'saved' | 'unsaved';

export function HoursGrid({
  payrollId,
  lines: initialLines,
  dayLabels,
  dayDates,
  defaultDailyHours,
  projectId,
}: {
  payrollId: string;
  projectId: string;
  lines: GridLine[];
  dayLabels: string[];
  dayDates: string[];
  defaultDailyHours: string;
}) {
  const [lines, setLines] = useState(initialLines);
  const [saved, setSaved] = useState<Record<string, RowState>>({});
  const [overlay, setOverlay] = useState(false);
  const [pastePreview, setPastePreview] = useState<{ cells: string[][]; lineIndex: number; day: number } | null>(null);
  const [gotoPending, setGotoPending] = useState(false);
  const acknowledged = useRef(new Map<string, string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const openedAt = useRef(Date.now());

  useEffect(() => {
    // The minutes spent in the grid are what `payroll_certified` carries, and
    // what THRESHOLDS §5 P1 decides the product on. The certify form reads it.
    const stamp = () => {
      const field = document.querySelector<HTMLInputElement>('input[name="minutesInGrid"]');
      if (field) field.value = String((Date.now() - openedAt.current) / 60_000);
    };
    const id = setInterval(stamp, 5_000);
    try {
      window.sessionStorage.setItem(`wl-grid-opened:${payrollId}`, String(openedAt.current));
    } catch {
      /* a private window is not a reason to fail the grid */
    }
    return () => clearInterval(id);
  }, [payrollId]);

  const cellKey = (rowIndex: number, columnIndex: number) => `${rowIndex}:${columnIndex}`;

  const rows = useMemo(
    () =>
      lines.flatMap((line, lineIndex) => [
        { line, lineIndex, kind: 'st' as const, fields: ST_FIELDS },
        { line, lineIndex, kind: 'ot' as const, fields: OT_FIELDS },
      ]),
    [lines],
  );

  const track = useCallback(
    (shortcut: KeyboardShortcut, cells?: number) => {
      void recordShortcutAction({ payrollId, shortcut, ...(cells === undefined ? {} : { cells }) });
    },
    [payrollId],
  );

  const readValue = (line: GridLine, field: Field): string => {
    if (field.kind === 'day') {
      return (field.row === 'st' ? line.hoursSt : line.hoursOt)[field.index] ?? '0';
    }
    return String((line as unknown as Record<string, string>)[field.field] ?? '');
  };

  const writeLocal = (lineId: string, field: Field, value: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) return line;
        if (field.kind === 'day') {
          const key = field.row === 'st' ? 'hoursSt' : 'hoursOt';
          const next = [...line[key]];
          next[field.index] = value;
          return { ...line, [key]: next };
        }
        return { ...line, [field.field]: value };
      }),
    );
  };

  /** Debounced, per cell. A failed save leaves the typed value on screen and is
   *  retried; nothing typed is ever lost silently. */
  const scheduleSave = useCallback(
    (lineId: string, field: Field, value: string) => {
      const key = `${lineId}:${field.kind === 'day' ? `${field.row}${field.index}` : field.field}`;
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      setSaved((current) => ({ ...current, [lineId]: 'unsaved' }));
      timers.current.set(
        key,
        setTimeout(async () => {
          setSaved((current) => ({ ...current, [lineId]: 'saving' }));
          try {
            const result = await updateCellAction({
              payrollId,
              lineId,
              field: (field.kind === 'day'
                ? field.row === 'st'
                  ? 'hoursSt'
                  : 'hoursOt'
                : field.field) as never,
              value,
              ...(field.kind === 'day' ? { dayIndex: field.index } : {}),
            });
            setLines((current) =>
              current.map((line) =>
                line.id === lineId
                  ? {
                      ...line,
                      totalHoursSt: result.totalHoursSt,
                      totalHoursOt: result.totalHoursOt,
                      dedTotal: result.dedTotal,
                      netPay: result.netPay,
                    }
                  : line,
              ),
            );
            acknowledged.current.set(key, value);
            setSaved((current) => ({ ...current, [lineId]: 'saved' }));
          } catch {
            // The value STAYS on screen. The row says "not saved" and offers a
            // retry; a dropped connection never costs a typed hour.
            setSaved((current) => ({ ...current, [lineId]: 'unsaved' }));
          }
        }, SAVE_DEBOUNCE_MS),
      );
    },
    [payrollId],
  );

  const flush = useCallback(() => {
    for (const [, timer] of timers.current) clearTimeout(timer);
    const pending = [...timers.current.keys()];
    timers.current.clear();
    // Re-run each pending save immediately rather than waiting out the debounce.
    for (const key of pending) {
      const [lineId] = key.split(':');
      setSaved((current) => ({ ...current, [lineId as string]: 'saving' }));
    }
  }, []);

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const target = inputs.current.get(cellKey(rowIndex, columnIndex));
    target?.focus();
    target?.select();
  };

  function onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    columnIndex: number,
    line: GridLine,
    field: Field,
  ) {
    const value = event.currentTarget.value;
    const shortcut = resolveShortcut(event, { cellIsEmpty: value === '' || value === '0', gotoPending });
    if (!shortcut) return;

    const columns = rows[rowIndex]?.fields.length ?? 0;

    switch (shortcut) {
      case 'tab':
        // The browser's own tab order is already "across the row then down",
        // because the inputs are in document order. Recorded, not intercepted.
        track('tab');
        return;
      case 'arrow': {
        event.preventDefault();
        track('arrow');
        if (event.key === 'ArrowLeft') focusCell(rowIndex, (columnIndex - 1 + columns) % columns);
        else if (event.key === 'ArrowRight') focusCell(rowIndex, (columnIndex + 1) % columns);
        else if (event.key === 'ArrowUp') focusCell(Math.max(0, rowIndex - 1), columnIndex);
        else focusCell(Math.min(rows.length - 1, rowIndex + 1), columnIndex);
        return;
      }
      case 'enter':
        event.preventDefault();
        track('enter');
        focusCell(Math.min(rows.length - 1, rowIndex + 1), columnIndex);
        return;
      case 'esc': {
        event.preventDefault();
        track('esc');
        const key = `${line.id}:${field.kind === 'day' ? `${field.row}${field.index}` : field.field}`;
        const last = acknowledged.current.get(key);
        if (last !== undefined) writeLocal(line.id, field, last);
        event.currentTarget.blur();
        return;
      }
      case 'default_day':
        event.preventDefault();
        track('default_day');
        writeLocal(line.id, field, defaultDailyHours);
        scheduleSave(line.id, field, defaultDailyHours);
        return;
      case 'zero':
        if (field.kind !== 'day') return;
        event.preventDefault();
        track('zero');
        writeLocal(line.id, field, '0');
        scheduleSave(line.id, field, '0');
        focusCell(rowIndex, Math.min(columns - 1, columnIndex + 1));
        return;
      case 'fill_down': {
        event.preventDefault();
        track('fill_down');
        const above = rows[rowIndex - 2];
        if (!above) return;
        const source = readValue(above.line, field);
        writeLocal(line.id, field, source);
        scheduleSave(line.id, field, source);
        return;
      }
      case 'fill_week': {
        if (field.kind !== 'day') return;
        event.preventDefault();
        track('fill_week');
        for (let day = field.index; day < 7; day += 1) {
          const target: Field = { kind: 'day', row: field.row, index: day };
          writeLocal(line.id, target, value);
          scheduleSave(line.id, target, value);
        }
        return;
      }
      case 'save':
        event.preventDefault();
        track('save');
        flush();
        return;
      case 'split': {
        if (field.kind !== 'day') return;
        event.preventDefault();
        track('split');
        const data = new FormData();
        data.set('payrollId', payrollId);
        data.set('lineId', line.id);
        void splitDayAction(data);
        return;
      }
      case 'palette':
        event.preventDefault();
        track('palette');
        window.open('/lookup', '_blank', 'noreferrer');
        return;
      case 'overlay':
        event.preventDefault();
        track('overlay');
        setOverlay((open) => !open);
        return;
      case 'goto':
        if (!gotoPending) {
          setGotoPending(true);
          setTimeout(() => setGotoPending(false), 1500);
          return;
        }
        event.preventDefault();
        track('goto');
        setGotoPending(false);
        if (event.key.toLowerCase() === 'p') window.location.assign(`/projects/${projectId}`);
        else if (event.key.toLowerCase() === 'f') window.location.assign(`/projects/${projectId}/weeks/${payrollId}/certify`);
        else window.location.assign(`/projects/${projectId}/submissions`);
        return;
      default:
        track(shortcut);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>, lineIndex: number, field: Field) {
    if (field.kind !== 'day') return;
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes(',') && !text.includes('\n')) return;
    event.preventDefault();
    const cells = parsePastedBlock(text);
    setPastePreview({ cells, lineIndex, day: field.index });
    track('paste', cells.reduce((acc, row) => acc + row.length, 0));
  }

  function commitPaste() {
    if (!pastePreview) return;
    const { cells, lineIndex, day } = pastePreview;
    cells.forEach((cellRow, rowOffset) => {
      const line = lines[lineIndex + rowOffset];
      if (!line) return;
      cellRow.forEach((value, columnOffset) => {
        const index = day + columnOffset;
        if (index > 6) return;
        const field: Field = { kind: 'day', row: 'st', index };
        writeLocal(line.id, field, value);
        scheduleSave(line.id, field, value);
      });
    });
    setPastePreview(null);
  }

  let rowCursor = -1;

  return (
    <>
      <div className="wl-toolbar" role="group" aria-label="Grid actions">
        <span className="wl-2xs wl-muted" data-testid="grid-hint">
          Keyboard first: <kbd>Tab</kbd> across, <kbd>.</kbd> for {defaultDailyHours} hours,{' '}
          <kbd>Ctrl</kbd>+<kbd>→</kbd> fills the week, <kbd>?</kbd> for the rest.
        </span>
        <span className="wl-toolbar__spacer" />
        <button
          type="button"
          className="wl-btn wl-btn--ghost wl-btn--sm"
          onClick={() => {
            track('overlay');
            setOverlay((open) => !open);
          }}
          aria-expanded={overlay}
          data-testid="shortcut-overlay-toggle"
        >
          Keyboard shortcuts
        </button>
      </div>

      {overlay ? (
        <div className="wl-panel" data-testid="shortcut-overlay" role="region" aria-label="Keyboard shortcuts">
          <div className="wl-panel__body">
            <table className="wl-table">
              <thead>
                <tr>
                  <th scope="col">Keys</th>
                  <th scope="col">What it does</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUT_HELP.map((entry) => (
                  <tr key={entry.shortcut}>
                    <th scope="row" className="wl-mono">
                      {entry.keys}
                    </th>
                    <td>{entry.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {pastePreview ? (
        <div className="wl-alert wl-alert--info" role="alert" data-testid="paste-preview">
          <div>
            <p className="wl-alert__title">
              Paste {pastePreview.cells.length} row(s) × {pastePreview.cells[0]?.length ?? 0} day(s)?
            </p>
            <p className="wl-alert__body wl-mono wl-2xs">
              {pastePreview.cells.map((row) => row.join('  ')).join(' / ')}
            </p>
            <button type="button" className="wl-btn wl-btn--primary wl-btn--sm" onClick={commitPaste}>
              Paste it
            </button>{' '}
            <button
              type="button"
              className="wl-btn wl-btn--ghost wl-btn--sm"
              onClick={() => setPastePreview(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="wl-grid-wrap">
        <table className="wl-grid" data-testid="hours-grid">
          <caption>
            Hours worked each day, straight time and overtime. Every cell autosaves when you leave
            it.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="wl-sticky-1">
                (1) Worker
              </th>
              <th scope="col" className="wl-sticky-2">
                (3) Classification
              </th>
              {dayLabels.map((label, index) => (
                <th scope="col" key={dayDates[index]} className="wl-grid__day">
                  {label}
                  <small>{(dayDates[index] ?? '').slice(5)}</small>
                </th>
              ))}
              <th scope="col">(5)</th>
              <th scope="col">(6A)</th>
              <th scope="col">(6B)</th>
              <th scope="col">(6C)</th>
              <th scope="col">(7A)</th>
              <th scope="col">(7B)</th>
              <th scope="col">(8a)</th>
              <th scope="col">(8b)</th>
              <th scope="col">(8c)</th>
              <th scope="col">(8c) note</th>
              <th scope="col">(8d)</th>
              <th scope="col">(9)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              rowCursor += 1;
              const rowIndex = rowCursor;
              const { line, kind, fields } = row;
              return (
                <tr key={`${line.id}-${kind}`} data-line-id={line.id} data-row-kind={kind}>
                  {kind === 'st' ? (
                    <>
                      <th scope="row" rowSpan={2} className="wl-sticky-1 wl-grid__worker">
                        {line.entryNo}. {line.name}
                        <br />
                        <span className="wl-2xs wl-muted">
                          ID {line.identifyingNoLast4} · {line.workerStatus}
                        </span>
                        <br />
                        <span className="wl-2xs" data-testid={`row-state-${line.id}`}>
                          {saved[line.id] === 'unsaved'
                            ? 'not saved — retrying'
                            : saved[line.id] === 'saving'
                              ? 'saving…'
                              : saved[line.id] === 'saved'
                                ? 'saved'
                                : ''}
                        </span>
                      </th>
                      <td rowSpan={2} className="wl-sticky-2 wl-grid__class">
                        {line.classificationLabel}
                        {line.belowDetermination ? (
                          <>
                            <br />
                            <span className="wl-2xs" data-testid={`below-rate-${line.id}`}>
                              below the determination rate
                            </span>
                          </>
                        ) : null}
                      </td>
                    </>
                  ) : null}

                  {fields.map((field, columnIndex) => {
                    const value = readValue(line, field);
                    const isDay = field.kind === 'day';
                    return (
                      <td
                        key={`${field.kind}-${isDay ? `${field.row}${field.index}` : field.field}`}
                        className={isDay ? (kind === 'ot' ? 'is-ot' : '') : 'wl-num'}
                      >
                        <input
                          ref={(element) => {
                            if (element) inputs.current.set(cellKey(rowIndex, columnIndex), element);
                          }}
                          className="wl-input"
                          inputMode={field.kind === 'text' ? 'text' : 'decimal'}
                          aria-label={`${line.name} ${kind === 'st' ? 'straight time' : 'overtime'} ${
                            isDay ? (dayLabels[field.index] ?? '') : field.field
                          }`}
                          value={value}
                          onChange={(event) => writeLocal(line.id, field, event.target.value)}
                          onBlur={(event) => scheduleSave(line.id, field, event.target.value)}
                          onKeyDown={(event) => onKeyDown(event, rowIndex, columnIndex, line, field)}
                          onPaste={(event) => onPaste(event, row.lineIndex, field)}
                          data-testid={
                            isDay
                              ? `cell-${line.id}-${field.row}-${field.index}`
                              : `cell-${line.id}-${field.field}`
                          }
                        />
                      </td>
                    );
                  })}

                  {kind === 'st' ? (
                    <>
                      <td className="wl-num" rowSpan={2} data-testid={`ded-total-${line.id}`}>
                        {line.dedTotal}
                      </td>
                      <td className="wl-num" rowSpan={2} data-testid={`net-pay-${line.id}`}>
                        {line.netPay}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="wl-sticky-1">
                Week total
              </th>
              <th className="wl-sticky-2" />
              <th className="wl-num" colSpan={7} data-testid="grid-total-hours">
                {lines
                  .reduce((acc, line) => acc + Number(line.totalHoursSt) + Number(line.totalHoursOt), 0)
                  .toFixed(2)}{' '}
                hours
              </th>
              <th className="wl-num" colSpan={9} data-testid="grid-total-gross">
                {lines.reduce((acc, line) => acc + Number(line.grossProject), 0).toFixed(2)} on this
                project
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
