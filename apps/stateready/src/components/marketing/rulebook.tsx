/**
 * M15 — the no-login demo (`LANDING_SPEC.md` §12), server-rendered.
 *
 * **The most important thing on the page.** It carries the education the word
 * budget forbids, and it is the only mechanism we have for raising perceived
 * likelihood before a stranger gives us anything. Under D2 it is also the
 * *single* free entry point: there is no free roster audit and no tripwire.
 *
 * Five properties are load-bearing and each one is a rule, not a preference:
 *
 *  1. **No email, no account, no card.** Anything else negates the point.
 *  2. **Server-rendered, correct with JavaScript disabled.** The picker is a
 *     GET form; the result is in the HTML, so it counts toward LCP as text
 *     rather than as a spinner, and every state × trade is a shareable,
 *     indexable URL.
 *  3. **It reads the same knowledge base the product reads** — `getKbRecord`,
 *     not a fixture and not a JSON file that drifts. If the demo and the app
 *     could disagree, the demo would be a liability rather than proof.
 *  4. **Every displayed value is verified and carries its source.** A value we
 *     could not establish is not a row with a shrug in it: it is a line in the
 *     gaps panel, which names what the board does not publish, says how many of
 *     its pages we read looking, and links them (wave-1b M19). The default
 *     Texas × HVAC view therefore contains **no unverified value row**.
 *  5. **The gate is the roster, not the rules.** Free gives the diagnosis —
 *     what this state requires of this trade. It never gives the remedy: your
 *     licences, your dates, your alerts.
 *
 * WORD BUDGET. Everything this file renders is the demo's dynamic output or
 * form chrome, and is outside the count by `LANDING_SPEC.md` §1. The demo's two
 * counted lines — its heading and its instruction — live in `copy.ts` and are
 * rendered by the page, not here. **No argument may be smuggled in here**: a
 * sentence that persuades belongs in the deck where CI counts it.
 */

import Link from 'next/link';

import { Disclaimer } from '@/components/provenance';
import { JURISDICTION_NAMES, TRADES, US_JURISDICTIONS } from '@/lib/kb/accessors';
import type { Trade } from '@/lib/kb/types';

import { TRADE_LABEL, type RulebookResult } from './data';
import { SourceChip } from './visuals';

export const DEMO_DEFAULT_STATE = 'TX';
export const DEMO_DEFAULT_TRADE: Trade = 'hvac';

/** The picker. A GET form, so it works with JavaScript off and deep-links out. */
export function RulebookPicker({
  state,
  trade,
  coveredStates,
  action,
}: {
  state: string;
  trade: Trade;
  coveredStates: readonly string[];
  action: string;
}) {
  const covered = US_JURISDICTIONS.filter((s) => coveredStates.includes(s));
  const rest = US_JURISDICTIONS.filter((s) => !coveredStates.includes(s));
  return (
    <form className="lp-demo__picker" data-wc="chrome" method="get" action={action} data-testid="demo-picker">
      <div className="sr-field">
        <label className="sr-field__label" htmlFor="demo-state">
          State
        </label>
        <select className="sr-select" id="demo-state" name="state" defaultValue={state}>
          <optgroup label="Covered today">
            {covered.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {JURISDICTION_NAMES[s] ?? s}
              </option>
            ))}
          </optgroup>
          <optgroup label="Not covered yet">
            {rest.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {JURISDICTION_NAMES[s] ?? s}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="sr-field">
        <label className="sr-field__label" htmlFor="demo-trade">
          Trade
        </label>
        <select className="sr-select" id="demo-trade" name="trade" defaultValue={trade}>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {TRADE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <button className="sr-btn sr-btn--secondary" type="submit" data-testid="demo-submit">
        Show the rules
      </button>
    </form>
  );
}

/** The answer. Every row is a verified value; everything else is in the panel. */
export function RulebookResultPanel({
  result,
  today,
  supportEmail,
}: {
  result: RulebookResult;
  today: string;
  supportEmail: string;
}) {
  if (!result.covered) {
    return (
      <div className="lp-demo__result" data-wc="chrome" data-testid="demo-result" data-covered="false">
        <p className="lp-demo__head">
          {result.stateName.toUpperCase()} · {result.tradeLabel.toUpperCase()}
        </p>
        <p className="lp-demo__uncovered" data-testid="demo-uncovered">
          Not covered yet — tell us and it goes to the front of the queue.
        </p>
        <p className="small muted">
          {result.onLaunchList
            ? `${result.stateName} is on the launch list and its rulebook is not built yet.`
            : `We hold no ${result.tradeLabel} rulebook for ${result.stateName}.`}{' '}
          <Link href="/coverage">See everything we cover</Link> ·{' '}
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(`${result.stateName} ${result.tradeLabel}`)}`}>
            Ask for this one
          </a>
        </p>
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="lp-demo__result" data-wc="chrome" data-testid="demo-result" data-covered="true">
      <p className="lp-demo__head">
        <span>
          {result.stateName.toUpperCase()} · {result.tradeLabel.toUpperCase()}
        </span>
        <a className="lp-chip" href={result.boardUrl} rel="noreferrer noopener" target="_blank">
          <span aria-hidden="true">ⓘ</span> {result.boardName}
        </a>
      </p>

      <dl className="lp-demo__rows">
        {result.rows.map((row) => (
          <div className="lp-demo__row" key={row.id} data-testid={`demo-row-${row.id}`}>
            <dt>{row.label}</dt>
            <dd>
              <ul>
                {row.entries.map((entry, index) => (
                  <li key={`${row.id}-${String(index)}`}>
                    {entry.scope ? <span className="lp-demo__scope">{entry.scope}</span> : null}
                    <span className="lp-demo__value">{entry.text}</span>
                    {entry.note ? <span className="sr-note">{entry.note}</span> : null}
                    <SourceChip
                      value={entry.source}
                      today={today}
                      what="this"
                      boardUrl={result.boardUrl}
                      boardName={result.boardName}
                    />
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
        {result.lastChecked ? (
          <div className="lp-demo__row">
            <dt>Last checked</dt>
            <dd>
              <span className="sr-mono">{result.lastChecked}</span>
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="lp-demo__gaps" data-testid="demo-gaps">
        <h3>What {result.stateName} does not publish</h3>
        {result.gaps.fields.length === 0 ? (
          <p className="small">
            Every field we look for is published and verified for this rulebook.
          </p>
        ) : (
          <p className="small">{result.gaps.fields.join(' · ')}</p>
        )}
        <p className="small muted">
          We read {result.gaps.pagesRead} board pages looking for each. When a board does not say, we do not
          either.
        </p>
        <details className="lp-demo__sources">
          <summary>What we read</summary>
          <ul>
            {result.gaps.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noreferrer noopener" target="_blank">
                  {source.title ?? source.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {result.compare ? (
        <section className="lp-demo__compare" data-testid="demo-compare">
          <h3>Compare with</h3>
          <p>
            <span className="lp-demo__scope">
              {result.stateName} · {result.compare.holder}
            </span>
            <span className="lp-demo__value">
              <span className="lp-card__number">{result.compare.hoursText}</span> hours of continuing education ·{' '}
              {result.compare.label}
            </span>
            <SourceChip value={result.compare.source} today={today} what="these hours" />
          </p>
        </section>
      ) : null}

      {result.coverageNotes.length > 0 ? (
        <ul className="lp-demo__notes small muted">
          {result.coverageNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <Disclaimer />
    </div>
  );
}
