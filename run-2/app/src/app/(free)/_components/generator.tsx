'use client';

/**
 * S01 — THE FREE WH-347 GENERATOR.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.1 (the narrative and the two affordances), §1.3
 * (the three screens), §1.4 (every unhappy path), §1.5 (no pin, no signature
 * block), §4.4.1 (the contract-value question, verbatim), §16 (the copy rules),
 * `DESIGN_SYSTEM.md` §8.2–§8.6.
 *
 * ===========================================================================
 * THE WHOLE SESSION LIVES IN THIS COMPONENT AND IN THE BROWSER
 *
 * Nothing here is persisted server-side — not the crew, not the CSV, not the
 * artifact. The payroll travels to the server once, as the argument to one server
 * action, and is never written down. §1.5's "Ratepin kept nothing from this
 * session" is therefore a property of the architecture rather than a retention
 * policy, and the preview's 24-hour expiry is the browser deleting its own copy.
 *
 * ===========================================================================
 * WHAT IS NOT ON THIS SCREEN
 *
 * No trial, no email capture, no card, no signup wall, no countdown, no chat
 * bubble, no way to summon a person, no spinner and no skeleton. The busy state is a word
 * (`DESIGN_SYSTEM.md` §7.3). The only marketing is the sentence under the footer,
 * and it is true about the document above it.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Refusal } from '@/lib/types';

import { generateAction, lookupDeterminationAction } from '../wh347/actions';
import { rate } from '../_lib/format';
import {
  emptyLine,
  emptySession,
  emptyWorker,
  type FreeSession,
  type FreeWorker,
} from '../_lib/session';
import {
  DRAFT_KEY,
  PREVIEW_KEY_PREFIX,
  type WireDetermination,
  type WireGenerate,
} from '../_lib/wire';
import { RefusalView } from './refusal';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** The ten lettered paragraphs of 29 CFR 3.5, and no eleventh option. "Other" on a
 *  signed form is an assertion that the deduction is permissible, which is a legal
 *  question about a specific deduction and one we decline (P-D). */
const DEDUCTION_CATEGORIES: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'STATUTORY', label: '(a) Tax required by law to be withheld' },
  { value: 'BONA_FIDE_PREPAYMENT', label: '(b) Repayment of a bona fide prepayment of wages' },
  { value: 'COURT_PROCESS', label: '(c) Amounts required by court process' },
  { value: 'BENEFIT_FUND', label: '(d) Contributions to a medical, pension or insurance fund' },
  { value: 'CREDIT_UNION', label: '(e) Credit union loan repayment or share purchase' },
  { value: 'GOVERNMENTAL', label: '(f) Voluntary contribution to a governmental agency' },
  { value: 'CHARITABLE_501C3', label: '(g) Voluntary contribution to a 501(c)(3) organisation' },
  { value: 'UNION_DUES', label: '(h) Initiation fees and membership dues under a CBA' },
  { value: 'BOARD_LODGING_FACILITIES', label: '(i) Reasonable cost of board, lodging or facilities' },
  { value: 'SAFETY_EQUIPMENT', label: '(j) Nominal-value safety equipment bought by the worker' },
  { value: 'UNMAPPED', label: 'I am not sure — leave this row blocked' },
];

type Band = FreeSession['contractValueBand'];

export function FreeGenerator({
  initialWdNumber,
}: {
  readonly initialWdNumber: string | null;
}): React.ReactElement {
  const router = useRouter();
  const [session, setSession] = useState<FreeSession>(() => {
    const base = emptySession(defaultWeekEnding());
    return initialWdNumber === null
      ? { ...base, workers: [emptyWorker()] }
      : { ...base, wd: { mode: 'number', wdNumber: initialWdNumber }, workers: [emptyWorker()] };
  });
  const [determination, setDetermination] = useState<WireDetermination | null>(null);
  const [lookupRefusal, setLookupRefusal] = useState<Refusal | null>(null);
  /** `null` means NOT ASKED YET, which is a different fact from `unknown` — the
   *  visitor answering "I don't know". §4.4: there is no default at any layer. */
  const [band, setBand] = useState<Band | null>(null);
  const [result, setResult] = useState<WireGenerate | null>(null);
  const [busy, setBusy] = useState<'lookup' | 'generate' | null>(null);

  // Returning from component M (S02): the mapped crew was left here.
  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY);
    if (draft === null) return;
    window.localStorage.removeItem(DRAFT_KEY);
    try {
      const parsed = JSON.parse(draft) as FreeSession;
      setSession(parsed);
    } catch {
      // A corrupt draft is not a customer-visible failure; the screen simply keeps
      // what it already had rather than showing an error nobody can act on.
    }
  }, []);

  const patch = (change: Partial<FreeSession>): void =>
    setSession((current) => ({ ...current, ...change }));

  const patchWorker = (index: number, change: Partial<FreeWorker>): void =>
    setSession((current) => ({
      ...current,
      workers: current.workers.map((worker, i) => (i === index ? { ...worker, ...change } : worker)),
    }));

  async function onLookup(): Promise<void> {
    setBusy('lookup');
    setLookupRefusal(null);
    const response = await lookupDeterminationAction(session.wd);
    setBusy(null);
    if (response.ok) {
      setDetermination(response.determination);
      setResult(null);
    } else {
      setDetermination(null);
      setLookupRefusal(response.refusal);
    }
  }

  /** The preview lives in this browser and nowhere else; the token is the key. */
  function openPreview(artifact: Extract<WireGenerate, { ok: true }>['artifact']): void {
    const token = crypto.randomUUID();
    window.localStorage.setItem(
      `${PREVIEW_KEY_PREFIX}${token}`,
      JSON.stringify({ token, artifact }),
    );
    router.push(`/wh347/p/${token}`);
  }

  /**
   * GENERATE — AND STOP HERE IF A ROW IS BLOCKED.
   *
   * §1.4 gives a blocked line two outcomes and they are two different clicks:
   * "he picks one" from the determination's own list, or "he picks nothing and
   * generates anyway", which renders the PDF with the row on the exception report.
   *
   * This used to navigate to the preview on ANY ok response. The picker block
   * further down renders on `result.pickers.length > 0` and could therefore never
   * be seen by anyone: the screen was already gone. The first of §1.4's two
   * outcomes did not exist, and the free tier's only classification affordance was
   * dead markup.
   *
   * So the first generate that comes back with blocked rows stays on the page and
   * shows them; a second, separately labelled button takes the draft anyway, which
   * is §1.4's other row and says out loud what it is doing.
   */
  async function onGenerate(options?: { readonly anyway?: boolean }): Promise<void> {
    if (band === null) return;
    setBusy('generate');
    const response = await generateAction({ ...session, contractValueBand: band });
    setBusy(null);
    setResult(response);
    if (!response.ok) return;
    if (response.pickers.length > 0 && options?.anyway !== true) return;
    openPreview(response.artifact);
  }

  const blockers: string[] = [];
  if (determination === null) blockers.push('a wage determination has not been resolved yet');
  if (band === null) blockers.push('the contract-value question has not been answered');
  if (session.workers.every((worker) => worker.lines.every((line) => line.rawTitle.trim() === ''))) {
    blockers.push('no payroll line carries a classification');
  }

  return (
    <div className="rp-stack rp-stack--section">
      {/* ---------------------------------------------------------------- */}
      {/* 1. The determination                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="rp-stack">
        <h2>1 · The wage determination</h2>
        <fieldset className="rp-fieldset">
          <legend>How do you want to name it?</legend>
          <div className="rp-check">
            <input
              type="radio"
              id="wd-mode-number"
              name="wd-mode"
              checked={session.wd.mode === 'number'}
              onChange={() => patch({ wd: { mode: 'number', wdNumber: '' } })}
            />
            <label className="rp-check__text" htmlFor="wd-mode-number">
              I have the determination number from my contract
            </label>
          </div>
          <div className="rp-check">
            <input
              type="radio"
              id="wd-mode-county"
              name="wd-mode"
              checked={session.wd.mode === 'county'}
              onChange={() =>
                patch({
                  wd: { mode: 'county', stateCode: '', countyName: '', constructionType: '' },
                })
              }
            />
            <label className="rp-check__text" htmlFor="wd-mode-county">
              Look it up by state, county and construction type
            </label>
          </div>
        </fieldset>

        {session.wd.mode === 'number' ? (
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="wd-number">
              Wage determination number
            </label>
            <input
              className="rp-input rp-num"
              id="wd-number"
              value={session.wd.wdNumber}
              placeholder="VA20260195"
              onChange={(event) =>
                patch({ wd: { mode: 'number', wdNumber: event.currentTarget.value } })
              }
            />
            <p className="rp-field__help">
              Two letters, four digits of fiscal year, four digits of sequence, exactly as it appears
              on your contract.
            </p>
          </div>
        ) : (
          <div className="rp-stack rp-stack--tight">
            <div className="rp-field">
              <label className="rp-field__label" htmlFor="wd-state">
                State
              </label>
              <input
                className="rp-input"
                id="wd-state"
                maxLength={2}
                value={session.wd.stateCode}
                onChange={(event) =>
                  patch({
                    wd: {
                      mode: 'county',
                      stateCode: event.currentTarget.value.toUpperCase(),
                      countyName: session.wd.mode === 'county' ? session.wd.countyName : '',
                      constructionType:
                        session.wd.mode === 'county' ? session.wd.constructionType : '',
                    },
                  })
                }
              />
            </div>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor="wd-county">
                County
              </label>
              <input
                className="rp-input"
                id="wd-county"
                value={session.wd.mode === 'county' ? session.wd.countyName : ''}
                onChange={(event) =>
                  patch({
                    wd: {
                      mode: 'county',
                      stateCode: session.wd.mode === 'county' ? session.wd.stateCode : '',
                      countyName: event.currentTarget.value,
                      constructionType:
                        session.wd.mode === 'county' ? session.wd.constructionType : '',
                    },
                  })
                }
              />
            </div>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor="wd-type">
                Construction type
              </label>
              <input
                className="rp-input"
                id="wd-type"
                placeholder="Highway"
                value={session.wd.mode === 'county' ? session.wd.constructionType : ''}
                onChange={(event) =>
                  patch({
                    wd: {
                      mode: 'county',
                      stateCode: session.wd.mode === 'county' ? session.wd.stateCode : '',
                      countyName: session.wd.mode === 'county' ? session.wd.countyName : '',
                      constructionType: event.currentTarget.value,
                    },
                  })
                }
              />
              <p className="rp-field__help">
                The determination&rsquo;s own type string — Building, Heavy, Highway or Residential.
                If your contract names a type, use that one.
              </p>
            </div>
          </div>
        )}

        <div className="rp-btn-row">
          <button
            type="button"
            className="rp-btn"
            aria-busy={busy === 'lookup' ? true : undefined}
            onClick={() => void onLookup()}
          >
            {busy === 'lookup' ? 'Reading the mirror…' : 'Find this determination'}
          </button>
        </div>

        {lookupRefusal ? <RefusalView refusal={lookupRefusal} /> : null}

        {determination ? (
          <div className="rp-alert rp-alert--notice">
            <span className="rp-alert__glyph" aria-hidden="true">
              ✓
            </span>
            <div className="rp-alert__body">
              <p className="rp-alert__title rp-num">
                {determination.wdNumber} revision {determination.revision}, published{' '}
                {determination.publishDate}
              </p>
              <p>
                {determination.constructionType} · {determination.classifications.length}{' '}
                classifications parsed from this revision. Every rate below comes from one of those
                rows and from nowhere else.
              </p>
            </div>
          </div>
        ) : (
          <p className="rp-t-micro">
            Ratepin will not build a WH-347 without a determination it can name. Every rate on the
            form is printed with its determination number, revision and publication date, and a rate
            typed in by hand could not carry any of the three.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 2. The payroll                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="rp-stack">
        <h2>2 · The payroll week</h2>

        <div className="rp-field">
          <label className="rp-field__label" htmlFor="week-ending">
            Week ending
          </label>
          <input
            className="rp-input rp-num"
            id="week-ending"
            type="date"
            value={session.weekEnding}
            onChange={(event) => patch({ weekEnding: event.currentTarget.value })}
          />
        </div>

        <div className="rp-drop" data-state="idle">
          <p className="rp-drop__title">Or drop a payroll CSV</p>
          <label className="rp-btn">
            Choose a CSV file
            <input
              className="rp-drop__input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                void file.text().then((text) => {
                  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(session));
                  window.sessionStorage.setItem(
                    'ratepin.free.csv',
                    JSON.stringify({ filename: file.name, text }),
                  );
                  router.push('/wh347/map');
                });
              }}
            />
          </label>
          <p className="rp-drop__hint">
            QuickBooks, ADP, Paychex and Gusto exports all work. The file is read in your browser and
            is not uploaded: the next screen matches its columns to the form&rsquo;s fields.
          </p>
        </div>

        {session.workers.map((worker, workerIndex) => (
          <fieldset className="rp-fieldset" key={workerIndex}>
            <legend>Worker {workerIndex + 1}</legend>

            <div className="rp-field">
              <label className="rp-field__label" htmlFor={`w${workerIndex}-last`}>
                1B — Last name
              </label>
              <input
                className="rp-input"
                id={`w${workerIndex}-last`}
                value={worker.lastName}
                onChange={(event) => patchWorker(workerIndex, { lastName: event.currentTarget.value })}
              />
            </div>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor={`w${workerIndex}-first`}>
                1C — First name
              </label>
              <input
                className="rp-input"
                id={`w${workerIndex}-first`}
                value={worker.firstName}
                onChange={(event) =>
                  patchWorker(workerIndex, { firstName: event.currentTarget.value })
                }
              />
            </div>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor={`w${workerIndex}-id`}>
                1E — Identifying number, last four digits only
              </label>
              <input
                className="rp-input rp-input--num rp-num"
                id={`w${workerIndex}-id`}
                inputMode="numeric"
                maxLength={4}
                value={worker.idLast4 ?? ''}
                onChange={(event) =>
                  patchWorker(workerIndex, {
                    idLast4: /^\d{4}$/.test(event.currentTarget.value)
                      ? event.currentTarget.value
                      : null,
                  })
                }
              />
              <p className="rp-field__help">
                Four digits. Ratepin has no field for a full social security number, and the renderer
                rejects anything longer, so nine digits cannot reach the form.
              </p>
            </div>

            {worker.lines.map((line, lineIndex) => (
              <div className="rp-stack rp-stack--tight" key={lineIndex}>
                <div className="rp-field rp-field--wide">
                  <label className="rp-field__label" htmlFor={`w${workerIndex}l${lineIndex}-title`}>
                    3 — Work classification, as your payroll system writes it
                  </label>
                  <input
                    className="rp-input rp-num"
                    id={`w${workerIndex}l${lineIndex}-title`}
                    value={line.rawTitle}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      patchWorker(workerIndex, {
                        lines: worker.lines.map((current, i) =>
                          i === lineIndex ? { ...current, rawTitle: value, chosenOrdinal: null } : current,
                        ),
                      });
                    }}
                  />
                  <p className="rp-field__help">
                    Type it exactly as it appears in your payroll export. Ratepin matches it against
                    this determination&rsquo;s own classification list and asks you to confirm.
                  </p>
                </div>

                <div className="rp-tablewrap">
                  <table className="rp-table">
                    <caption className="rp-sr-only">
                      Hours worked on this project each day, worker {workerIndex + 1}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Bucket</th>
                        {DAY_LABELS.map((label) => (
                          <th scope="col" className="rp-th--num" key={label}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(['st', 'ot'] as const).map((bucket) => (
                        <tr key={bucket}>
                          <th scope="row">{bucket === 'st' ? 'Straight time' : 'Overtime'}</th>
                          {DAY_LABELS.map((label, dayIndex) => (
                            <td className="rp-td--num" key={label}>
                              <label
                                className="rp-sr-only"
                                htmlFor={`w${workerIndex}l${lineIndex}-${bucket}-${dayIndex}`}
                              >
                                {bucket === 'st' ? 'Straight time' : 'Overtime'} hours, {label}
                              </label>
                              <input
                                className="rp-input rp-input--num rp-num"
                                id={`w${workerIndex}l${lineIndex}-${bucket}-${dayIndex}`}
                                inputMode="decimal"
                                value={hundredthsToText(line[bucket][dayIndex] ?? 0)}
                                onChange={(event) => {
                                  const next = textToHundredths(event.currentTarget.value);
                                  patchWorker(workerIndex, {
                                    lines: worker.lines.map((current, i) => {
                                      if (i !== lineIndex) return current;
                                      const days = [...current[bucket]];
                                      days[dayIndex] = next;
                                      return { ...current, [bucket]: days };
                                    }),
                                  });
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rp-field">
                  <label className="rp-field__label" htmlFor={`w${workerIndex}l${lineIndex}-rate`}>
                    6A — Straight-time hourly rate you actually paid
                  </label>
                  <input
                    className="rp-input rp-input--num rp-num"
                    id={`w${workerIndex}l${lineIndex}-rate`}
                    inputMode="decimal"
                    value={milliToText(line.cashRateMilli)}
                    onChange={(event) => {
                      const next = textToMilli(event.currentTarget.value);
                      patchWorker(workerIndex, {
                        lines: worker.lines.map((current, i) =>
                          i === lineIndex ? { ...current, cashRateMilli: next } : current,
                        ),
                      });
                    }}
                  />
                  <p className="rp-field__help">
                    The gross cash rate, before any deferral to a fringe plan — 29 CFR 5.32(a)
                    computes on earnings before those contributions.
                  </p>
                </div>

                <div className="rp-field">
                  <label className="rp-field__label" htmlFor={`w${workerIndex}l${lineIndex}-fringe`}>
                    6B — Fringe benefit credit you are claiming, per hour
                  </label>
                  <input
                    className="rp-input rp-input--num rp-num"
                    id={`w${workerIndex}l${lineIndex}-fringe`}
                    inputMode="decimal"
                    value={milliToText(line.fringeCreditMilli)}
                    onChange={(event) => {
                      const next = textToMilli(event.currentTarget.value);
                      patchWorker(workerIndex, {
                        lines: worker.lines.map((current, i) =>
                          i === lineIndex ? { ...current, fringeCreditMilli: next } : current,
                        ),
                      });
                    }}
                  />
                  <p className="rp-field__help">
                    Printed as you state it. Ratepin does not evaluate whether a credit is
                    annualized or bona fide — that is a question about your plan, and we decline it.
                  </p>
                </div>
              </div>
            ))}

            <div className="rp-btn-row">
              <button
                type="button"
                className="rp-btn rp-btn--sm"
                onClick={() =>
                  patchWorker(workerIndex, { lines: [...worker.lines, emptyLine()] })
                }
              >
                This worker worked a second classification
              </button>
            </div>

            <div className="rp-field">
              <label className="rp-field__label" htmlFor={`w${workerIndex}-7b`}>
                7B — Gross earned, all work this week
              </label>
              <input
                className="rp-input rp-input--num rp-num"
                id={`w${workerIndex}-7b`}
                inputMode="decimal"
                value={centsToText(worker.allWorkGrossCents)}
                onChange={(event) =>
                  patchWorker(workerIndex, {
                    allWorkGrossCents: textToCents(event.currentTarget.value),
                  })
                }
              />
              <p className="rp-field__help">
                Covered and non-covered work together. Column 8&rsquo;s deductions are taken against
                this figure, not against the project-only gross.
              </p>
            </div>

            <div className="rp-field">
              <label className="rp-field__label" htmlFor={`w${workerIndex}-9`}>
                9 — Net wages actually paid for the week
              </label>
              <input
                className="rp-input rp-input--num rp-num"
                id={`w${workerIndex}-9`}
                inputMode="decimal"
                value={centsToText(worker.netPaidCents)}
                onChange={(event) =>
                  patchWorker(workerIndex, { netPaidCents: textToCents(event.currentTarget.value) })
                }
              />
              <p className="rp-field__help">
                The figure on the cheque you wrote. Ratepin reconciles against it and shows both if
                they differ; it never overwrites yours.
              </p>
            </div>

            <h3>8 — Deductions</h3>
            {worker.deductions.map((deduction, deductionIndex) => (
              <div className="rp-stack rp-stack--tight" key={deductionIndex}>
                <div className="rp-field">
                  <label
                    className="rp-field__label"
                    htmlFor={`w${workerIndex}d${deductionIndex}-label`}
                  >
                    As your payroll system labels it
                  </label>
                  <input
                    className="rp-input"
                    id={`w${workerIndex}d${deductionIndex}-label`}
                    value={deduction.rawLabel}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      patchWorker(workerIndex, {
                        deductions: worker.deductions.map((current, i) =>
                          i === deductionIndex ? { ...current, rawLabel: value } : current,
                        ),
                      });
                    }}
                  />
                </div>
                <div className="rp-field">
                  <label
                    className="rp-field__label"
                    htmlFor={`w${workerIndex}d${deductionIndex}-cat`}
                  >
                    Which paragraph of 29 CFR 3.5 it falls under
                  </label>
                  <select
                    className="rp-select"
                    id={`w${workerIndex}d${deductionIndex}-cat`}
                    value={deduction.category}
                    onChange={(event) => {
                      const value = event.currentTarget.value as FreeWorker['deductions'][number]['category'];
                      patchWorker(workerIndex, {
                        deductions: worker.deductions.map((current, i) =>
                          i === deductionIndex ? { ...current, category: value } : current,
                        ),
                      });
                    }}
                  >
                    {DEDUCTION_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <p className="rp-field__help">
                    There is no &ldquo;Other&rdquo;. &ldquo;Other&rdquo; on a signed form asserts
                    that the deduction is permissible, and whether yours is permissible is a legal
                    question about your specific deduction that Ratepin does not answer. Pick the
                    paragraph it falls under, or leave the row blocked.
                  </p>
                </div>
                <div className="rp-field">
                  <label
                    className="rp-field__label"
                    htmlFor={`w${workerIndex}d${deductionIndex}-amount`}
                  >
                    Amount
                  </label>
                  <input
                    className="rp-input rp-input--num rp-num"
                    id={`w${workerIndex}d${deductionIndex}-amount`}
                    inputMode="decimal"
                    value={centsToText(deduction.amountCents)}
                    onChange={(event) => {
                      const value = textToCents(event.currentTarget.value);
                      patchWorker(workerIndex, {
                        deductions: worker.deductions.map((current, i) =>
                          i === deductionIndex ? { ...current, amountCents: value } : current,
                        ),
                      });
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="rp-btn-row">
              <button
                type="button"
                className="rp-btn rp-btn--sm"
                onClick={() =>
                  patchWorker(workerIndex, {
                    deductions: [
                      ...worker.deductions,
                      { rawLabel: '', category: 'UNMAPPED', amountCents: 0 },
                    ],
                  })
                }
              >
                Add a deduction
              </button>
            </div>
          </fieldset>
        ))}

        <div className="rp-btn-row">
          <button
            type="button"
            className="rp-btn"
            onClick={() => patch({ workers: [...session.workers, emptyWorker()] })}
          >
            Add a worker
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3. The contract-value band — §4.4.1, asked exactly as specified.   */}
      {/* ---------------------------------------------------------------- */}
      <section className="rp-stack rp-measure">
        <h2>3 · Contract value</h2>
        <fieldset className="rp-fieldset" aria-describedby="band-why">
          <legend>Is the prime contract on this job over $100,000?</legend>
          {(
            [
              ['over_100k', 'Over $100,000'],
              ['at_or_under_100k', '$100,000 or less'],
              ['unknown', 'I don’t know'],
            ] as const
          ).map(([value, label]) => (
            <div className="rp-check" key={value}>
              <input
                type="radio"
                id={`band-${value}`}
                name="band"
                checked={band === value}
                onChange={() => setBand(value)}
              />
              <label className="rp-check__text" htmlFor={`band-${value}`}>
                {label}
              </label>
            </div>
          ))}
        </fieldset>
        <div id="band-why" className="rp-stack rp-stack--tight">
          <p>
            <strong>Why we ask.</strong> The 40-hour overtime rule this form has a column for —
            Contract Work Hours and Safety Standards Act overtime — is written into contracts{' '}
            <em>“in an amount in excess of $100,000”</em> (29 CFR 5.5(b)). Davis-Bacon starts at
            $2,000, so a job can be a Davis-Bacon job and not a CWHSSA job at the same time. Over the
            line, we compute a premium on hours over forty in the week. At or under it, we
            don&rsquo;t — and we print that we didn&rsquo;t.
          </p>
          <p>
            <strong>Where to read the answer.</strong> It is the <strong>prime contract</strong>{' '}
            amount, not your piece of it: a $40,000 subcontract under a $3m prime is over the line.
            If you can&rsquo;t see the prime&rsquo;s value, read your own contract&rsquo;s clause
            list instead — <strong>FAR 52.222-4</strong> is the clause that carries this rule, and it
            flows down. If that clause is in your contract, answer <strong>over $100,000</strong>. If
            the clause and the dollar figure seem to disagree, go with the clause.
          </p>
          <p>
            <strong>What we don&rsquo;t do.</strong> Ratepin doesn&rsquo;t read your contract and
            doesn&rsquo;t decide whether that clause is in it. We compute from what you tell us, and
            every artifact prints what you told us and when.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Generate                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="rp-stack">
        <h2>4 · Generate</h2>
        <div className="rp-btn-row">
          <button
            type="button"
            className="rp-btn rp-btn--primary"
            aria-busy={busy === 'generate' ? true : undefined}
            aria-disabled={blockers.length > 0 ? true : undefined}
            onClick={() => {
              if (blockers.length > 0) return;
              void onGenerate();
            }}
          >
            {busy === 'generate' ? 'Computing and rendering…' : 'Generate the WH-347'}
          </button>
        </div>
        {blockers.length > 0 ? (
          <p className="rp-btn__why">Not yet: {blockers.join('; ')}.</p>
        ) : (
          <p className="rp-t-micro">
            The form will be marked <strong>DRAFT — NOT CERTIFIABLE</strong> with the signature block
            withheld. That is not a limitation of the free tier&rsquo;s arithmetic — the arithmetic
            and the geometry are the same at every tier. It is that nothing here pins a revision of
            record, and a signature block asserts one.
          </p>
        )}

        {result && !result.ok ? <RefusalView refusal={result.refusal} /> : null}

        {result?.ok && result.pickers.length > 0 ? (
          <div className="rp-stack">
            <h3>Lines this determination could not resolve on its own</h3>
            <p className="rp-measure">
              Free lookup doesn&rsquo;t rank candidates for you. These are the classifications this
              determination actually lists. Pick the one whose scope matches the work.
            </p>
            {result.pickers.map((picker) => (
              <fieldset
                className="rp-pick"
                role="radiogroup"
                key={`${picker.workerIndex}:${picker.lineIndex}`}
                aria-labelledby={`pick-${picker.workerIndex}-${picker.lineIndex}`}
              >
                <legend className="rp-pick__legend">
                  <span
                    className="rp-pick__title rp-num"
                    id={`pick-${picker.workerIndex}-${picker.lineIndex}`}
                  >
                    {picker.rawTitle}
                  </span>
                  <span className="rp-pick__stakes">
                    Worker {picker.workerIndex + 1}, line {picker.lineIndex + 1}
                  </span>
                </legend>
                {picker.banner ? <p className="rp-pick__reduced">{picker.banner}</p> : null}
                <div className="rp-pick__options">
                  {(picker.candidates.length > 0 ? picker.candidates : picker.all.slice(0, 12)).map(
                    (candidate) => {
                      const id = `opt-${picker.workerIndex}-${picker.lineIndex}-${candidate.ordinal}`;
                      const chosen =
                        session.workers[picker.workerIndex]?.lines[picker.lineIndex]?.chosenOrdinal;
                      return (
                        <div className="rp-pick__option" key={candidate.ordinal}>
                          <input
                            type="radio"
                            id={id}
                            name={`pick-${picker.workerIndex}-${picker.lineIndex}`}
                            checked={chosen === candidate.ordinal}
                            onChange={() =>
                              setSession((current) => ({
                                ...current,
                                workers: current.workers.map((worker, wi) =>
                                  wi !== picker.workerIndex
                                    ? worker
                                    : {
                                        ...worker,
                                        lines: worker.lines.map((line, li) =>
                                          li !== picker.lineIndex
                                            ? line
                                            : { ...line, chosenOrdinal: candidate.ordinal },
                                        ),
                                      },
                                ),
                              }))
                            }
                          />
                          <label htmlFor={id} className="rp-pick__body">
                            <span className="rp-pick__group rp-num">{candidate.rateIdentifier}</span>
                            <span className="rp-pick__class">{candidate.className}</span>
                            <span className="rp-pick__scope">{candidate.classNameVerbatim}</span>
                            <span className="rp-pick__rates rp-num">
                              <span className="rp-pick__rate-pair">
                                base {rate(candidate.baseRateMilli)}
                              </span>
                              <span className="rp-pick__rate-pair">
                                fringe {rate(candidate.fringeRateMilli)}
                              </span>
                            </span>
                            <span className="rp-pick__source rp-num">
                              lines {candidate.sourceLineStart}–{candidate.sourceLineEnd} of the
                              determination
                            </span>
                          </label>
                          {picker.preSelectedOrdinal === candidate.ordinal ? (
                            <p className="rp-pick__preselect">
                              This row&rsquo;s label matches what you typed exactly. It is still your
                              click.
                            </p>
                          ) : null}
                        </div>
                      );
                    },
                  )}
                </div>
                {picker.declined ? <RefusalView refusal={picker.declined} /> : null}
              </fieldset>
            ))}
            {/*
              §1.4's two rows, as two buttons of the same weight. Picking is not
              required and generating anyway is not hidden: the blocked row adds a
              REASON to the exception report, not a status — the status was fixed the
              moment this path was chosen.
            */}
            <div className="rp-btn-row">
              <button type="button" className="rp-btn" onClick={() => void onGenerate()}>
                Generate again with these classifications
              </button>
              <button
                type="button"
                className="rp-btn"
                onClick={() => void onGenerate({ anyway: true })}
              >
                Generate it anyway, with these rows on the exception report
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

// ===========================================================================
// Integer <-> text at the cell. No locale, no float accumulation.
// ===========================================================================

function hundredthsToText(value: number): string {
  return value === 0 ? '' : String(value / 100);
}

function textToHundredths(text: string): number {
  const clean = text.trim();
  if (clean === '') return 0;
  const parsed = Number(clean);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(2_400, Math.round(parsed * 100));
}

function milliToText(value: number): string {
  return value === 0 ? '' : String(value / 10_000);
}

function textToMilli(text: string): number {
  const clean = text.trim().replace(/[$,]/g, '');
  if (clean === '') return 0;
  const parsed = Number(clean);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 10_000);
}

function centsToText(value: number): string {
  return value === 0 ? '' : String(value / 100);
}

function textToCents(text: string): number {
  const clean = text.trim().replace(/[$,]/g, '');
  if (clean === '') return 0;
  const parsed = Number(clean);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/** The most recent Saturday, in UTC. A default the visitor can change, never a
 *  guess that reaches the arithmetic: the engine derives the seven dates from
 *  whatever this field ends up saying and reads no clock of its own. */
function defaultWeekEnding(): string {
  const now = new Date();
  const daysSinceSaturday = (now.getUTCDay() + 1) % 7;
  const saturday = new Date(now.getTime() - daysSinceSaturday * 86_400_000);
  return saturday.toISOString().slice(0, 10);
}
