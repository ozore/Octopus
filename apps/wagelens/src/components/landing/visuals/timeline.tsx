/**
 * V2 — THE DETERMINATION TIMELINE (LANDING_SPEC §6 V2).
 *
 * The highest-value object on this page, and the only one no competitor has:
 * one WD number on an axis, a marker per modification, a **pin** on the
 * modification a contract incorporated, and a bracket between the pin and
 * today's modification saying what moved between them.
 *
 * **Every marker is a row in `kb_wd_modifications`, and nothing else is ever
 * drawn.** The corpus holds what `/history` returned; if a determination has
 * one modification, the pin and the current marker coincide and the caption
 * says exactly that. `LANDING_SPEC` §6 V2: "No modification is ever invented."
 * The divergence label is a real count computed from the two modifications'
 * classification rows — not an estimate, not an illustration.
 *
 * Two SVGs, one visible: horizontal on a desktop, **vertical** on a phone
 * (§11 — "Never a horizontally scrolling axis"). Only the caption is copy; the
 * numbers and dates inside the drawing are data and are excluded from the word
 * budget, which is why the page can be this specific without being wordy.
 *
 * Motion (§6 V2): the axis draws left to right, markers pop in on arrival, the
 * pin drops last, the bracket draws between them. `landing.css` sets all of it
 * to one frame under `prefers-reduced-motion`.
 */

import { formatDay } from '@/components/provenance';

export type TimelineModification = {
  modificationNumber: number;
  publicationDate: string;
  active: boolean;
};

export type TimelineDivergence = {
  /** Classifications present in both modifications whose rate or fringe moved. */
  ratesMoved: number;
  /** Classifications the newer modification adds. */
  added: number;
  /** Classifications the newer modification no longer lists. */
  removed: number;
};

export type DeterminationTimelineProps = {
  wdNumber: string;
  /** Ascending by modification number. Exactly the rows the corpus holds. */
  modifications: TimelineModification[];
  pinned: number;
  current: number;
  divergence?: TimelineDivergence | null;
};

/**
 * The one sentence beneath the drawing. Copy, and counted.
 *
 * Three states and no fourth, because the diagram must never say more than the
 * corpus holds: one modification on record; today's modification being read,
 * with earlier ones a click away; or an earlier modification chosen, which is
 * the sentence the whole page is built to produce.
 */
export function timelineCaption(input: {
  pinned: number;
  current: number;
  count: number;
}): string {
  if (input.count <= 1) return 'One modification on record. The pin has not moved.';
  if (input.pinned === input.current) {
    return `Reading mod ${input.current}, today’s. Pick the modification your contract names.`;
  }
  return `Your contract locked mod ${input.pinned}. Today’s is mod ${input.current}.`;
}

/** Data, and counted as data: a real difference between two real modifications. */
export function divergenceLabel(d: TimelineDivergence | null | undefined): string | null {
  if (!d) return null;
  const parts: string[] = [];
  if (d.ratesMoved > 0) parts.push(`${d.ratesMoved} rates moved`);
  if (d.added > 0) parts.push(`${d.added} added`);
  if (d.removed > 0) parts.push(`${d.removed} removed`);
  return parts.length > 0 ? parts.join(' · ') : 'no classification changed';
}

export function DeterminationTimeline({
  wdNumber,
  modifications,
  pinned,
  current,
  divergence,
}: DeterminationTimelineProps) {
  const points = [...modifications].sort((a, b) => a.modificationNumber - b.modificationNumber);
  if (points.length === 0) return null;

  const label = divergenceLabel(divergence ?? null);
  const title = `Modification history for wage determination ${wdNumber}`;

  // --- horizontal ---------------------------------------------------------
  const W = 720;
  const left = 56;
  const right = W - 56;
  const span = points.length > 1 ? (right - left) / (points.length - 1) : 0;
  const x = (i: number) => (points.length > 1 ? left + span * i : (left + right) / 2);
  const axisY = 96;
  const pinnedIndex = points.findIndex((p) => p.modificationNumber === pinned);
  const currentIndex = points.findIndex((p) => p.modificationNumber === current);

  // --- vertical (phones) --------------------------------------------------
  const VH = 56 + points.length * 74;
  const railX = 40;
  const y = (i: number) => 46 + i * 74;

  return (
    <figure
      className="wl-land__figure-block"
      data-testid="determination-timeline"
      data-wd-number={wdNumber}
      data-pinned-modification={pinned}
      data-wl-view="timeline_viewed"
      style={{ margin: 0, display: 'grid', gap: 'var(--wl-space-3)' }}
    >
      {/* Horizontal: the axis is time, left to right. */}
      <svg
        className="wl-land__timeline"
        viewBox={`0 0 ${W} 150`}
        role="img"
        aria-label={title}
        data-wordcount="exclude"
      >
        <title>{title}</title>
        <line
          className="wl-land__axis"
          x1={left - 24}
          y1={axisY}
          x2={right + 24}
          y2={axisY}
          stroke="var(--wl-rule-grid)"
          strokeWidth="2"
        />
        {label && pinnedIndex >= 0 && currentIndex >= 0 && pinnedIndex !== currentIndex ? (
          <g className="wl-land__bracket">
            <path
              d={`M ${x(pinnedIndex)} 56 L ${x(pinnedIndex)} 44 L ${x(currentIndex)} 44 L ${x(currentIndex)} 56`}
              fill="none"
              stroke="var(--wl-selected-edge)"
              strokeWidth="2"
            />
            <text
              className="wl-land__svg-label wl-land__svg-label--ink"
              x={(x(pinnedIndex) + x(currentIndex)) / 2}
              y="34"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        ) : null}
        {points.map((point, i) => {
          const isPinned = point.modificationNumber === pinned;
          return (
            <g key={point.modificationNumber}>
              <rect
                className="wl-land__marker"
                style={{ '--wl-i': i } as React.CSSProperties}
                x={x(i) - 7}
                y={axisY - 7}
                width="14"
                height="14"
                rx="2"
                fill={point.active ? 'var(--wl-source-dot)' : 'var(--wl-surface)'}
                stroke="var(--wl-rule-grid)"
                strokeWidth="2"
              />
              <text
                className="wl-land__svg-label wl-land__svg-label--mono"
                x={x(i)}
                y={axisY + 28}
                textAnchor="middle"
              >
                mod {point.modificationNumber}
              </text>
              <text className="wl-land__svg-label" x={x(i)} y={axisY + 44} textAnchor="middle">
                {formatDay(point.publicationDate)}
              </text>
              {isPinned ? (
                <g className="wl-land__pin">
                  <path
                    d={`M ${x(i)} ${axisY - 12} L ${x(i)} ${axisY - 34}`}
                    stroke="var(--wl-selected-edge)"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${x(i)} ${axisY - 34} L ${x(i) + 34} ${axisY - 30} L ${x(i)} ${axisY - 22} Z`}
                    fill="var(--wl-selected-edge)"
                  />
                  <text
                    className="wl-land__svg-label wl-land__svg-label--ink"
                    x={x(i)}
                    y={axisY - 42}
                    textAnchor="middle"
                  >
                    {pinned === current ? 'you are here' : 'your contract'}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Vertical: the same rows, top to bottom, for a 320px screen. */}
      <svg
        className="wl-land__timeline--tall"
        viewBox={`0 0 320 ${VH}`}
        role="img"
        aria-label={title}
        data-wordcount="exclude"
      >
        <line
          className="wl-land__axis wl-land__axis--v"
          x1={railX}
          y1={y(0) - 30}
          x2={railX}
          y2={y(points.length - 1) + 30}
          stroke="var(--wl-rule-grid)"
          strokeWidth="2"
        />
        {points.map((point, i) => {
          const isPinned = point.modificationNumber === pinned;
          return (
            <g key={point.modificationNumber}>
              <rect
                className="wl-land__marker"
                style={{ '--wl-i': i } as React.CSSProperties}
                x={railX - 7}
                y={y(i) - 7}
                width="14"
                height="14"
                rx="2"
                fill={point.active ? 'var(--wl-source-dot)' : 'var(--wl-surface)'}
                stroke="var(--wl-rule-grid)"
                strokeWidth="2"
              />
              <text className="wl-land__svg-label wl-land__svg-label--mono" x={railX + 20} y={y(i)}>
                mod {point.modificationNumber}
              </text>
              <text className="wl-land__svg-label" x={railX + 20} y={y(i) + 16}>
                {formatDay(point.publicationDate)}
              </text>
              {isPinned ? (
                <g className="wl-land__pin">
                  <path
                    d={`M ${railX - 30} ${y(i)} L ${railX - 12} ${y(i)}`}
                    stroke="var(--wl-selected-edge)"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${railX - 30} ${y(i) - 6} L ${railX - 30} ${y(i) + 6} L ${railX - 20} ${y(i)} Z`}
                    fill="var(--wl-selected-edge)"
                  />
                </g>
              ) : null}
            </g>
          );
        })}
        {label && pinnedIndex >= 0 && currentIndex >= 0 && pinnedIndex !== currentIndex ? (
          <g className="wl-land__bracket">
            <path
              d={`M ${railX + 140} ${y(pinnedIndex)} L ${railX + 152} ${y(pinnedIndex)} L ${railX + 152} ${y(currentIndex)} L ${railX + 140} ${y(currentIndex)}`}
              fill="none"
              stroke="var(--wl-selected-edge)"
              strokeWidth="2"
            />
            <text
              className="wl-land__svg-label wl-land__svg-label--ink"
              x={railX + 158}
              y={(y(pinnedIndex) + y(currentIndex)) / 2}
            >
              {label}
            </text>
          </g>
        ) : null}
      </svg>

      <figcaption className="wl-land__note">
        {timelineCaption({ pinned, current, count: points.length })}
      </figcaption>
    </figure>
  );
}
