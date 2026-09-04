'use client';

/**
 * V4 — THE 55-MINUTE LEDGER (LANDING_SPEC §6 V4).
 *
 * What Friday costs THIS company, computed from ITS numbers, in ITS browser.
 *
 * **The Department of Labor's 55 minutes is the only constant. Everything else
 * is typed by the visitor, the arithmetic runs here, and nothing he types is
 * sent anywhere** — not to us, not to anyone. The event this figure records is
 * `ledger_used` with **no values attached** (`specs/WL-EVENTS.md`), and the
 * server action's prop filter would drop them even if this file tried.
 *
 * That is the honest alternative to inventing an hourly rate: we supply the
 * government's number with its source, he supplies his own, and the only dollar
 * figure on the page that we did not source is one we never see.
 *
 * The third input is labelled "what an hour of office time costs **you**" and
 * not "his": the hour belongs to the office manager, who `PERSONA.md` §1.2
 * calls the single most important human in this product (finding M18).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { recordLandingEvent } from '../actions';
import { BURDEN_MINUTES, BURDEN_QUOTE, BURDEN_SOURCE_URL, LEDGER } from '../copy';

const MAX = { projects: 200, weeks: 52, cost: 500 };

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

/** Whole numbers only: a dollar figure with cents on it would read as a quote. */
function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function hoursLabel(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** 250ms to the new value on every keystroke, one `requestAnimationFrame`
 *  loop, no library — and an immediate snap under `prefers-reduced-motion`. */
function useTickingNumber(target: number): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const started = useRef(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShown(target);
      return;
    }
    from.current = shown;
    started.current = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started.current) / 250);
      const eased = 1 - (1 - t) * (1 - t);
      setShown(from.current + (target - from.current) * eased);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
    // `shown` is read as a starting point, never as a trigger: adding it to the
    // dependency list would restart the animation on every frame it produces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return shown;
}

export function MinuteLedger() {
  const [projects, setProjects] = useState(4);
  const [weeks, setWeeks] = useState(44);
  const [cost, setCost] = useState(38);
  const used = useRef(false);

  const forms = projects * weeks;
  const hours = (forms * BURDEN_MINUTES) / 60;
  const dollars = hours * cost;

  const shownHours = useTickingNumber(hours);
  const shownDollars = useTickingNumber(dollars);

  const markUsed = useCallback(() => {
    if (used.current) return;
    used.current = true;
    // No values. Engagement only — this is the whole point of the figure.
    void recordLandingEvent('ledger_used').catch(() => {});
  }, []);

  return (
    <figure className="wl-land__ledger" data-testid="minute-ledger" style={{ margin: 0 }}>
      <div className="wl-land__ledger-inputs" data-wordcount="exclude">
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="ledger-projects">
            Active covered projects
          </label>
          <input
            id="ledger-projects"
            className="wl-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX.projects}
            value={projects}
            onChange={(e) => {
              markUsed();
              setProjects(clamp(Number(e.target.value), MAX.projects));
            }}
          />
        </div>
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="ledger-weeks">
            Weeks worked a year
          </label>
          <input
            id="ledger-weeks"
            className="wl-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX.weeks}
            value={weeks}
            onChange={(e) => {
              markUsed();
              setWeeks(clamp(Number(e.target.value), MAX.weeks));
            }}
          />
        </div>
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="ledger-cost">
            What an hour of office time costs you
          </label>
          <input
            id="ledger-cost"
            className="wl-input"
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX.cost}
            value={cost}
            onChange={(e) => {
              markUsed();
              setCost(clamp(Number(e.target.value), MAX.cost));
            }}
          />
        </div>
      </div>

      <div className="wl-land__ledger-outputs">
        <div className="wl-stat">
          <span className="wl-land__figure" data-testid="ledger-hours" data-wordcount="exclude">
            {hoursLabel(shownHours)}
          </span>
          <span className="wl-stat__label">{LEDGER.outputHours}</span>
        </div>
        <div className="wl-stat">
          <span className="wl-land__figure" data-testid="ledger-dollars" data-wordcount="exclude">
            {money(shownDollars)}
          </span>
          <span className="wl-stat__label">{LEDGER.outputDollars}</span>
        </div>
      </div>

      <figcaption className="wl-land__burden" data-wordcount="exclude" style={{ gridColumn: '1 / -1' }}>
        “{BURDEN_QUOTE}” —{' '}
        <a href={BURDEN_SOURCE_URL} target="_blank" rel="noreferrer noopener">
          U.S. Department of Labor, WH-347, OMB Control No. 1235-0008 ↗
        </a>
      </figcaption>
    </figure>
  );
}
