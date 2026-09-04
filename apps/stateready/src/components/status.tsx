/**
 * The status vocabulary, as components. `specs/07`, `IDENTITY.md` §7.1–§7.2.
 *
 * **Status is never colour alone.** Every one of these renders fill + edge +
 * glyph + the word, and the word is one of exactly four:
 * READY / AT RISK / LAPSED / NOT TRACKED. Under `@media print` and
 * `forced-colors` the design system adds hatch patterns, so a black-and-white
 * bid packet still separates the four.
 *
 * No component here composes a status string of its own — they all take a
 * `Status` from `repos/dashboard.ts`, whose thresholds are shared with the
 * alert schedule rather than copied from it.
 */

import type { ReactNode } from 'react';

import { STATUS_GLYPH, STATUS_TOKEN, type Status } from '@/lib/repos/dashboard';

export function StatusChip({ status, children }: { status: Status; children?: ReactNode }) {
  return (
    <span className="sr-chip" data-status={STATUS_TOKEN[status]}>
      <span className="sr-chip__glyph" aria-hidden="true">
        {STATUS_GLYPH[status]}
      </span>
      <span>{children ?? status}</span>
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return (
    <>
      <span className="sr-dot" data-status={STATUS_TOKEN[status]} aria-hidden="true" />
      <span className="sr-status-text" data-status={STATUS_TOKEN[status]}>
        {status}
      </span>
    </>
  );
}

/**
 * The readiness tile grid — 51 tiles, 50 states plus DC, EQUAL WEIGHT, never a
 * geographic choropleth: Rhode Island's licence lapses exactly as hard as
 * Texas's.
 *
 * It is a `<ul>` of `<button>`s in DOM reading order with an accessible name
 * per tile, and **the grid is never the only route to its data** — the expiring
 * list below carries the same rows (`UX.md` §8).
 */
export type Tile = {
  state: string;
  stateName: string;
  status: Status | null;
  licenceCount: number;
  accessibleName: string;
};

export function TileGrid({
  tiles,
  selected,
  hrefFor,
}: {
  tiles: readonly Tile[];
  selected?: string | null;
  hrefFor?: (state: string) => string;
}) {
  return (
    <div className="sr-map">
      <ul className="sr-map__grid" data-testid="tile-grid">
        {tiles.map((tile) => {
          const token = tile.status ? STATUS_TOKEN[tile.status] : 'none';
          const hollow = tile.status === null;
          const href = hrefFor?.(tile.state);
          const inner = (
            <>
              <span aria-hidden="true">{tile.state}</span>
              <span className="sr-tile__glyph" aria-hidden="true">
                {tile.status ? STATUS_GLYPH[tile.status] : ''}
              </span>
              {tile.licenceCount > 0 ? (
                <span className="sr-tile__badge" aria-hidden="true">
                  {tile.licenceCount}
                </span>
              ) : null}
              <span className="sr-visually-hidden">{tile.accessibleName}</span>
            </>
          );
          return (
            <li key={tile.state}>
              {href ? (
                <a
                  className="sr-tile"
                  href={href}
                  data-status={hollow ? 'none' : token}
                  data-hollow={hollow ? 'true' : undefined}
                  data-selected={selected === tile.state ? 'true' : undefined}
                  data-testid={`tile-${tile.state}`}
                  style={hollow ? { borderStyle: 'dashed', background: 'var(--sr-ground)' } : undefined}
                >
                  {inner}
                </a>
              ) : (
                <button
                  type="button"
                  className="sr-tile"
                  data-status={hollow ? 'none' : token}
                  data-hollow={hollow ? 'true' : undefined}
                  data-testid={`tile-${tile.state}`}
                  style={hollow ? { borderStyle: 'dashed', background: 'var(--sr-ground)' } : undefined}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <ul className="sr-map__legend" aria-label="What the tiles mean">
        {(['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED'] as Status[]).map((status) => (
          <li className="sr-map__legend-item" key={status}>
            <span className="sr-dot" data-status={STATUS_TOKEN[status]} aria-hidden="true" />
            {status}
          </li>
        ))}
        <li className="sr-map__legend-item">
          <span
            className="sr-dot"
            aria-hidden="true"
            style={{ borderStyle: 'dashed', background: 'transparent' }}
          />
          not in your footprint
        </li>
      </ul>
    </div>
  );
}

/**
 * The runway — the 90 / 60 / 30 / 7 gates as a time axis.
 *
 * `aria-hidden`, and mirrored by a visually-hidden list of the same markers in
 * the same order: a time axis positioned by percentage is not readable by a
 * screen reader, and pretending otherwise is worse than exposing an equivalent
 * (`UX.md` §8).
 */
export type RunwayLane = {
  label: string;
  /** Days from today. Negative is lapsed. */
  days: number;
  status: Status;
  detail: string;
};

const GATES = [90, 60, 30, 7] as const;

export function Runway({ lanes, horizonDays = 120 }: { lanes: readonly RunwayLane[]; horizonDays?: number }) {
  const position = (days: number) => {
    const clamped = Math.min(Math.max(days, 0), horizonDays);
    return `${100 - (clamped / horizonDays) * 100}%`;
  };

  return (
    <div className="sr-runway" data-testid="runway">
      <div className="sr-runway__scale" aria-hidden="true">
        {GATES.map((gate) => (
          <span className="sr-runway__gate" key={gate} style={{ insetInlineStart: position(gate) }}>
            <span>{gate}d</span>
          </span>
        ))}
      </div>
      <div aria-hidden="true">
        {lanes.map((lane) => (
          <div className="sr-runway__lane" key={`${lane.label}-${lane.days}`}>
            <span className="sr-runway__label">{lane.label}</span>
            <span className="sr-runway__track">
              <span
                className="sr-runway__marker"
                data-status={STATUS_TOKEN[lane.status]}
                style={{ insetInlineStart: position(lane.days) }}
              />
            </span>
          </div>
        ))}
      </div>
      <ul className="sr-visually-hidden">
        {lanes.map((lane) => (
          <li key={`sr-${lane.label}-${lane.days}`}>
            {lane.label} — {lane.status}, {lane.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
