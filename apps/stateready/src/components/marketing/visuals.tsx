/**
 * M15 — the five landing visuals (`LANDING_SPEC.md` §4).
 *
 * Every one of them is **static**. Nothing here animates on load, pulses,
 * blinks, loops or reveals on scroll (`IDENTITY.md` §8.5) — an earlier draft of
 * the spec had three animated diagrams and they are gone, because fifty things
 * moving delays the answer and a date is not a score. There is no transition,
 * no `@keyframes` and no client JavaScript behind any of them.
 *
 * Every one of them is also **argument, not decoration**: the page carries a
 * 450-word ceiling precisely so the education can happen in the diagrams and
 * the demo instead of in prose, so a visual that answers neither *where* nor
 * *when* (§7.4 rule 1) has to justify itself — V3 does so explicitly, as a
 * reference card rather than an infographic.
 *
 *  V1 Readiness grid — inline SVG, 51 equal `<rect>` tiles, hollow-dashed where
 *     the company does not operate, so expansion reads as an absence.
 *  V2 Runway — inline SVG, one axis, four gates, a wall where a whole state
 *     renews on one date.
 *  V3 Divergence card — static HTML, because the spec describes it in
 *     typographic terms (tabular numerals in a hairline-ruled document) that
 *     SVG text would degrade.
 *  V4 Entry Pack steps — static HTML, expanded on load.
 *  V5 Source chip — the systemic micro-component, and the brand. A value with
 *     no verified source renders no chip and no number: it renders the refusal.
 *
 * ACCESSIBILITY. The two SVGs are `aria-hidden` and each is mirrored by a list
 * in DOM reading order carrying the same facts in words, because a grid
 * positioned by coordinates and an axis positioned by percentage are not
 * readable by a screen reader and pretending otherwise is worse than publishing
 * an equivalent (`UX.md` §8). **Status is never colour alone**: every tile
 * carries fill + edge + glyph + hatch, and the word — READY / AT RISK / LAPSED
 * / NOT TRACKED — in the equivalent list.
 *
 * WORD BUDGET. Everything in this file is `data-wc="chrome"`: labels inside a
 * graphic, legends and source-chip text are outside the count by
 * `LANDING_SPEC.md` §1's rule. No prose belongs here — if a sentence argues, it
 * belongs in `copy.ts` where CI counts it.
 */

import { NotYetVerified } from '@/components/provenance';
import { STATUS_GLYPH, STATUS_TOKEN } from '@/lib/repos/dashboard';
import type { SourcedValue } from '@/lib/kb/types';
import { assessValue } from '@/lib/rules/assess';

import {
  formatDay,
  RUNWAY_GATES,
  RUNWAY_HORIZON_DAYS,
  type Divergence,
  type EntryPackStep,
  type RunwayLane,
  type TileDatum,
} from './data';

/* ------------------------------------------------------------------ V5 ---- */

/**
 * The source chip. **This is not decoration; it is the brand.**
 *
 * It renders a real link whose accessible name says what was read and when, and
 * it is the same component wherever a regulatory value appears — the hero card,
 * the lapse quotes, the demo, the FAQ. Its rule is absolute: *a value with no
 * verified source renders no chip and no value.* It renders "not yet verified",
 * with what we read and where to ask, and never a bare number.
 */
export function SourceChip({
  value,
  today,
  what,
  boardUrl,
  boardName,
}: {
  value: SourcedValue | null | undefined;
  today: string;
  what?: string;
  boardUrl?: string | null;
  boardName?: string | null;
}) {
  const assessment = assessValue(value, today);
  const usable = Boolean(value) && assessment.usable && assessment.effectiveStatus === 'verified';
  if (!usable || !value?.source_url) {
    return (
      <span className="lp-chip lp-chip--refused" data-wc="chrome" data-testid="source-chip-refused">
        <NotYetVerified
          what={what ?? 'this'}
          why={
            assessment.stale
              ? 'We have not re-read the board page for this in more than 180 days, so we have stopped asserting it.'
              : undefined
          }
          boardUrl={boardUrl ?? null}
          boardName={boardName ?? null}
        />
      </span>
    );
  }

  const host = value.source_url.replace(/^https?:\/\//, '').split('/')[0] ?? value.source_url;
  const checked = value.last_verified ?? null;
  const label = `Source: ${value.source_title ?? host}${checked ? `, checked ${checked}` : ''}`;

  return (
    <a
      className="lp-chip"
      data-wc="chrome"
      data-testid="source-chip"
      data-confidence={assessment.confidence}
      href={value.source_url}
      rel="noreferrer noopener"
      target="_blank"
      aria-label={label}
      title={value.evidence ?? value.source_title ?? host}
    >
      <span aria-hidden="true">ⓘ</span>
      <span className="lp-chip__host">{host}</span>
      {checked ? <span className="lp-chip__date">checked {checked}</span> : null}
    </a>
  );
}

/* ------------------------------------------------------------------ V1 ---- */

/**
 * The tile grid, in the approximate shape of the country and at **equal weight
 * per jurisdiction** — never a geographic choropleth, because Rhode Island's
 * licence lapses exactly as hard as Texas's, and because a grid of `<rect>`s is
 * an order of magnitude smaller than a path map and degrades far better on a
 * phone.
 */
const TILE_LAYOUT: readonly (readonly [string, number, number])[] = [
  ['ME', 0, 10],
  ['AK', 1, 0], ['VT', 1, 9], ['NH', 1, 10],
  ['WI', 2, 6], ['NY', 2, 8], ['MA', 2, 9], ['RI', 2, 10],
  ['WA', 3, 0], ['ID', 3, 1], ['MT', 3, 2], ['ND', 3, 3], ['MN', 3, 4], ['IL', 3, 5],
  ['MI', 3, 6], ['PA', 3, 7], ['NJ', 3, 8], ['CT', 3, 9],
  ['OR', 4, 0], ['NV', 4, 1], ['WY', 4, 2], ['SD', 4, 3], ['IA', 4, 4], ['IN', 4, 5],
  ['OH', 4, 6], ['VA', 4, 7], ['MD', 4, 8], ['DC', 4, 9],
  ['CA', 5, 0], ['UT', 5, 1], ['CO', 5, 2], ['NE', 5, 3], ['MO', 5, 4], ['KY', 5, 5],
  ['WV', 5, 6], ['NC', 5, 7], ['DE', 5, 8],
  ['AZ', 6, 1], ['NM', 6, 2], ['KS', 6, 3], ['AR', 6, 4], ['TN', 6, 5], ['SC', 6, 6],
  ['OK', 7, 3], ['LA', 7, 4], ['MS', 7, 5], ['AL', 7, 6], ['GA', 7, 7],
  ['HI', 8, 0], ['TX', 8, 3], ['FL', 8, 8],
];

const TILE = 40;
const TILE_PITCH = 44;
const GRID_COLS = 11;
const GRID_ROWS = 9;

export function ReadinessGrid({ tiles, caption }: { tiles: readonly TileDatum[]; caption: string }) {
  const byState = new Map(tiles.map((tile) => [tile.state, tile]));
  const width = GRID_COLS * TILE_PITCH - (TILE_PITCH - TILE);
  const height = GRID_ROWS * TILE_PITCH - (TILE_PITCH - TILE);

  return (
    <figure className="lp-figure lp-grid" data-wc="chrome" data-testid="v1-readiness-grid">
      <svg
        aria-hidden="true"
        className="lp-grid__svg"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        role="presentation"
      >
        <defs>
          <pattern id="lp-hatch-risk" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--sr-risk-edge)" strokeWidth="1.5" />
          </pattern>
          <pattern id="lp-hatch-lapsed" width="5" height="5" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--sr-lapsed-edge)" strokeWidth="1.2" />
            <line x1="0" y1="0" x2="5" y2="0" stroke="var(--sr-lapsed-edge)" strokeWidth="1.2" />
          </pattern>
        </defs>
        {TILE_LAYOUT.map(([state, row, col]) => {
          const tile = byState.get(state);
          const x = col * TILE_PITCH;
          const y = row * TILE_PITCH;
          const token = tile?.status ? STATUS_TOKEN[tile.status] : 'none';
          const hollow = !tile || tile.status === null;
          return (
            <g key={state} data-status={token} data-hollow={hollow ? 'true' : undefined}>
              <rect className="lp-grid__tile" x={x} y={y} width={TILE} height={TILE} rx="6" />
              {token === 'risk' ? (
                <rect x={x} y={y} width={TILE} height={TILE} rx="6" fill="url(#lp-hatch-risk)" opacity="0.55" />
              ) : null}
              {token === 'lapsed' ? (
                <rect x={x} y={y} width={TILE} height={TILE} rx="6" fill="url(#lp-hatch-lapsed)" opacity="0.5" />
              ) : null}
              <text className="lp-grid__abbr" x={x + TILE / 2} y={y + 17} textAnchor="middle">
                {state}
              </text>
              <text className="lp-grid__glyph" x={x + TILE / 2} y={y + 31} textAnchor="middle">
                {tile?.status ? STATUS_GLYPH[tile.status] : '—'}
              </text>
              {tile && tile.licenceCount > 0 ? (
                <text className="lp-grid__badge" x={x + TILE - 5} y={y + TILE - 4} textAnchor="end">
                  {tile.licenceCount}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* The grid is never the only route to its data. */}
      <ul className="sr-visually-hidden">
        {tiles.map((tile) => (
          <li key={tile.state}>{tile.accessibleName}</li>
        ))}
      </ul>

      <figcaption className="lp-figure__caption">
        <span className="lp-legend">
          {(['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED'] as const).map((status) => (
            <span className="lp-legend__item" key={status} data-status={STATUS_TOKEN[status]}>
              <span aria-hidden="true">{STATUS_GLYPH[status]}</span> {status}
            </span>
          ))}
          <span className="lp-legend__item" data-hollow="true">
            <span aria-hidden="true">·</span> not in your footprint
          </span>
        </span>
        <span className="lp-figure__label">{caption}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ V2 ---- */

const RUNWAY_WIDTH = 820;
const RUNWAY_LANE_H = 38;
const RUNWAY_PLOT_X = 8;
const RUNWAY_PLOT_W = RUNWAY_WIDTH - RUNWAY_PLOT_X - 12;
const RUNWAY_HEAD = 34;

function runwayX(days: number): number {
  const clamped = Math.min(Math.max(days, 0), RUNWAY_HORIZON_DAYS);
  return RUNWAY_PLOT_X + (clamped / RUNWAY_HORIZON_DAYS) * RUNWAY_PLOT_W;
}

/**
 * The runway. Today at the left, twelve months at the right, the four alert
 * gates drawn as rules, and **a wall wherever a whole state renews on one
 * date** — which is the argument: the deadlines are not evenly spread.
 *
 * On a narrow screen the axis is replaced by the same lanes as a list rather
 * than by a horizontally scrolling graphic. A reader must not have to discover
 * the point by scrolling sideways, and a page that scrolls sideways at 390px is
 * a page that failed `LANDING_SPEC.md` §8 twice over.
 */
export function Runway({ lanes, today }: { lanes: readonly RunwayLane[]; today: string }) {
  const height = RUNWAY_HEAD + lanes.length * RUNWAY_LANE_H + 10;

  return (
    <figure className="lp-figure lp-runway" data-wc="chrome" data-testid="v2-runway">
      <svg
        aria-hidden="true"
        className="lp-runway__svg"
        viewBox={`0 0 ${String(RUNWAY_WIDTH)} ${String(height)}`}
        role="presentation"
      >
        <defs>
          <pattern id="lp-hatch-spread" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sr-line-strong)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* The last thirty days before a deadline carry the risk wash. */}
        <rect
          className="lp-runway__wash"
          x={runwayX(0)}
          y={RUNWAY_HEAD - 10}
          width={runwayX(30) - runwayX(0)}
          height={height - RUNWAY_HEAD}
        />

        {RUNWAY_GATES.map((gate) => (
          <g key={gate}>
            <line
              className="lp-runway__gate"
              x1={runwayX(gate)}
              y1={RUNWAY_HEAD - 12}
              x2={runwayX(gate)}
              y2={height - 12}
            />
            <text className="lp-runway__gate-label" x={runwayX(gate)} y={RUNWAY_HEAD - 18} textAnchor="middle">
              {gate}d
            </text>
          </g>
        ))}
        <text className="lp-runway__gate-label" x={RUNWAY_PLOT_X} y={RUNWAY_HEAD - 18} textAnchor="start">
          today
        </text>
        <text className="lp-runway__gate-label" x={RUNWAY_PLOT_X + RUNWAY_PLOT_W} y={RUNWAY_HEAD - 18} textAnchor="end">
          12 months
        </text>

        {lanes.map((lane, index) => {
          const y = RUNWAY_HEAD + index * RUNWAY_LANE_H;
          if (lane.kind === 'spread' || lane.daysAway === null) {
            return (
              <g key={lane.id} data-covered={lane.covered ? 'true' : 'false'}>
                <rect
                  className="lp-runway__spread"
                  x={runwayX(0)}
                  y={y + 6}
                  width={RUNWAY_PLOT_W}
                  height={16}
                  fill="url(#lp-hatch-spread)"
                  opacity="0.35"
                />
                <text className="lp-runway__inline" x={runwayX(0) + 8} y={y + 18}>
                  {lane.inlineLabel}
                </text>
              </g>
            );
          }
          const x = runwayX(lane.daysAway);
          const anchorEnd = x > RUNWAY_PLOT_X + RUNWAY_PLOT_W * 0.6;
          return (
            <g key={lane.id} data-covered={lane.covered ? 'true' : 'false'}>
              <line className="lp-runway__track" x1={runwayX(0)} y1={y + 14} x2={runwayX(RUNWAY_HORIZON_DAYS)} y2={y + 14} />
              {/* Every licence in the state, stacked on one date. */}
              {[0, 1, 2, 3].map((tick) => (
                <line
                  key={tick}
                  className="lp-runway__marker"
                  data-covered={lane.covered ? 'true' : 'false'}
                  x1={x - 5}
                  y1={y + 6 + tick * 5}
                  x2={x + 5}
                  y2={y + 6 + tick * 5}
                />
              ))}
              <text
                className="lp-runway__inline"
                x={anchorEnd ? x - 10 : x + 10}
                y={y + 18}
                textAnchor={anchorEnd ? 'end' : 'start'}
              >
                {lane.inlineLabel}
                {lane.covered ? '' : ' — not covered yet'}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="lp-runway__list" data-testid="runway-lanes">
        {lanes.map((lane) => (
          <li key={lane.id} data-covered={lane.covered ? 'true' : 'false'}>
            <span className="lp-runway__list-label">{lane.label}</span>
            <span>
              {lane.date
                ? `${formatDay(lane.date)} ${lane.date.slice(0, 4)} · ${String(lane.daysAway)} days away`
                : 'no single date — every licence on its own anniversary'}
              {lane.covered ? '' : ' · not covered yet'}
            </span>
            <SourceChip value={lane.source} today={today} what="this renewal rule" />
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------------ V3 ---- */

/**
 * The divergence card: one state, one regulator, two trades, two different CE
 * requirements. It is retained as a **reference card** rather than an
 * infographic — it answers *what*, not *where* or *when* — because it is the
 * single most persuasive artefact on the page and it should read as a page torn
 * from a manual, not as a chart. It uses no accent colour at all; its
 * credibility comes from looking like a document.
 *
 * Both numerals are read from the knowledge base. If TDLR moves them, the card
 * moves.
 */
export function DivergenceCard({ card, today }: { card: Divergence; today: string }) {
  return (
    <div className="lp-card" data-wc="chrome" data-testid="v3-divergence">
      <p className="lp-card__head">
        {card.stateName.toUpperCase()} · one regulator
      </p>
      <ul className="lp-card__rows">
        {card.rows.map((row) => (
          <li className="lp-card__row" key={row.trade}>
            <span className="lp-card__trade">
              {row.holder}
              <span className="lp-card__class">{row.licenceTypeName}</span>
            </span>
            <span className="lp-card__figure">
              {row.hoursText === null ? (
                <SourceChip value={null} today={today} what="a continuing-education requirement" />
              ) : (
                <>
                  <span className="lp-card__number">{row.hoursText}</span>
                  <span className="lp-card__unit">hrs</span>
                </>
              )}
            </span>
            <span className="lp-card__source">
              {row.subjects.length > 0 ? <span className="lp-card__subjects">{row.subjects.join(' · ')}</span> : null}
              {row.hours ? <SourceChip value={row.hours} today={today} what="these hours" /> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ V4 ---- */

/**
 * The Entry Pack steps, in filing order and **expanded on load** — the earlier
 * draft's scroll-triggered accordion is forbidden. Steps 2 and 3 carry a risk
 * glyph because they are the two that catch people out; step 7 carries none,
 * because it is not a warning, it is the method.
 */
export function EntryPackSteps({
  steps,
  pagesRead,
  rulebooks,
}: {
  steps: readonly EntryPackStep[];
  pagesRead: number;
  rulebooks: number;
}) {
  return (
    <figure className="lp-figure lp-steps" data-wc="chrome" data-testid="v4-entry-pack-steps">
      <ol className="lp-steps__list">
        {steps.map((step) => (
          <li className="lp-steps__item" key={step.n} data-risk={step.risk ? 'true' : undefined}>
            <span className="lp-steps__n">{step.n}</span>
            <span className="lp-steps__title">
              {step.title}
              {step.risk ? (
                <span className="lp-steps__risk" aria-label="the step that most often catches people out">
                  ◑
                </span>
              ) : null}
            </span>
            <span className="lp-steps__artefact">{step.artefact}</span>
          </li>
        ))}
      </ol>
      <figcaption className="lp-figure__caption">
        <span className="lp-figure__label">
          {pagesRead} board pages read across {rulebooks} rulebooks
        </span>
      </figcaption>
    </figure>
  );
}
