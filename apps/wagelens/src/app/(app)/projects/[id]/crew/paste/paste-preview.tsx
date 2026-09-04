'use client';

import { useActionState, useState } from 'react';

import type { WorkerPasteResult } from '@/lib/repositories/workers';

import { commitPasteAction, previewPasteAction } from '../actions';

const EMPTY: WorkerPasteResult = { parsed: [], skipped: [] };

/**
 * Paste a crew, see exactly what we read, then write it.
 *
 * **Nothing is written until the button** (V10), and **every skipped line is
 * listed with its reason** — never dropped. That is the incumbents' most-quoted
 * defect, in their own customers' words: *"I often get errors uploading a file
 * into their system"*, *"It is not bringing all wages over"*. A silent drop is
 * how a crew member vanishes from a federal filing.
 *
 * The parse runs on the SERVER, in the same function the commit re-runs, so the
 * preview cannot disagree with what is written. **A row containing a full
 * identifying number is skipped with the federal-rule explanation and is never
 * truncated to its last four** (V11): truncating would silently accept data we
 * are forbidden to hold.
 *
 * **Nothing is auto-classified** (V12). The per-row picker and the "map all
 * to" control are conveniences for a human decision; rows left unmapped land
 * on the crew page's banner and block certification until somebody maps them.
 */
export function PastePreview({
  projectId,
  classifications,
}: {
  projectId: string;
  classifications: Array<{ id: string; label: string; baseRate: string; fringeRate: string }>;
}) {
  const [result, preview, previewing] = useActionState(previewPasteAction, EMPTY);
  const [chosen, setChosen] = useState<Record<number, string>>({});

  /** "Map all to…" writes every row at once; each row is still editable
   *  afterwards, because the decision is per worker. */
  function setAll(value: string) {
    const next: Record<number, string> = {};
    for (const row of result.parsed) next[row.lineNo] = value;
    setChosen(next);
  }

  return (
    <div className="wl-stack">
      <form className="wl-stack-2" action={preview} data-testid="paste-form">
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="text">
            One worker per line
          </label>
          <textarea
            className="wl-textarea"
            id="text"
            name="text"
            rows={10}
            placeholder={'Rivera\tAda\tM\t6789\nOkafor\tSamuel\t\t4412'}
          />
          <p className="wl-field__help">
            <span className="wl-mono">last name, first name, middle initial, last 4</span> —
            separated by tabs, commas, or two or more spaces. A header row re-orders the columns.
            Four digits only: a line containing a full identifying number is skipped, never
            shortened.
          </p>
        </div>
        <p>
          <button className="wl-btn wl-btn--secondary" type="submit" data-testid="paste-preview">
            {previewing ? 'Reading…' : 'Preview'}
          </button>
        </p>
      </form>

      {result.skipped.length > 0 ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="paste-skipped">
          <div>
            <p className="wl-alert__title">
              {result.skipped.length} line{result.skipped.length === 1 ? '' : 's'} skipped, with the
              reason.
            </p>
            <table className="wl-table">
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col">What you pasted</th>
                  <th scope="col">Why it was skipped</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((row) => (
                  <tr key={row.lineNo} data-testid="paste-skipped-row">
                    <td className="wl-mono">{row.lineNo}</td>
                    <td className="wl-mono wl-xs">{row.raw}</td>
                    <td className="wl-xs">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result.parsed.length > 0 ? (
        <form className="wl-stack-2" action={commitPasteAction} data-testid="paste-commit-form">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="skippedCount" value={result.skipped.length} />

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="bulk">
              Map all to&hellip;
            </label>
            <select
              className="wl-select"
              id="bulk"
              defaultValue=""
              onChange={(event) => setAll(event.target.value)}
            >
              <option value="">Leave every row unmapped</option>
              {classifications.map((classification) => (
                <option key={classification.id} value={classification.id}>
                  {classification.label}
                </option>
              ))}
            </select>
            <p className="wl-field__help">
              A convenience, not a decision: classification follows the work each person actually
              performed, and it stays a choice per worker.
            </p>
          </div>

          <div className="wl-table-wrap wl-scroll-x">
            <table className="wl-table" data-testid="paste-preview-table">
              <thead>
                <tr>
                  <th scope="col">Last name</th>
                  <th scope="col">First name</th>
                  <th scope="col">MI</th>
                  <th scope="col">Last 4</th>
                  <th scope="col">Classification</th>
                </tr>
              </thead>
              <tbody>
                {result.parsed.map((row) => (
                  <tr key={row.lineNo} data-testid="paste-parsed-row">
                    <td>
                      <input className="wl-input" name="lastName" defaultValue={row.lastName} />
                    </td>
                    <td>
                      <input className="wl-input" name="firstName" defaultValue={row.firstName} />
                    </td>
                    <td>
                      <input
                        className="wl-input"
                        name="middleInitial"
                        defaultValue={row.middleInitial ?? ''}
                        maxLength={1}
                        size={2}
                      />
                    </td>
                    <td>
                      <input
                        className="wl-input wl-input--num"
                        name="last4"
                        defaultValue={row.last4}
                        maxLength={4}
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <select
                        className="wl-select"
                        name="classification"
                        value={chosen[row.lineNo] ?? ''}
                        onChange={(event) =>
                          setChosen((current) => ({ ...current, [row.lineNo]: event.target.value }))
                        }
                      >
                        <option value="">Not mapped yet</option>
                        {classifications.map((classification) => (
                          <option key={classification.id} value={classification.id}>
                            {classification.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <button className="wl-btn wl-btn--primary" type="submit" data-testid="paste-commit">
              Add {result.parsed.length} worker{result.parsed.length === 1 ? '' : 's'}
            </button>
          </p>
          <p className="wl-2xs wl-muted">
            One transaction: a commit that fails halfway leaves no workers behind, because half a
            crew is worse than none — the missing three are invisible until the payroll is short.
          </p>
        </form>
      ) : null}
    </div>
  );
}
