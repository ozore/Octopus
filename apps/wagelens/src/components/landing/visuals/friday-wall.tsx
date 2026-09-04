/**
 * V3 — THE FRIDAY WALL (LANDING_SPEC §6 V3).
 *
 * The dream outcome is an ABSENCE — nothing goes wrong for a year — so it has
 * to be drawn. Fifty-two squares, one per week of one project: filled = filed,
 * amber = needs review, outlined = a week not yet worked.
 *
 * **The data is none. This is an illustration and it says so**, in a caption
 * that ships with it and cannot be turned off: *"An example year. Your wall
 * starts empty."* It must never be presented as a customer's data, and no
 * count of customers, weeks or filings may be derived from it — which is why
 * the only numbers in this file are the twelve month letters and the two weeks
 * that carry an exception, because a wall with no exceptions is a lie about
 * construction.
 *
 * Two SVGs, one visible: 52 × 1 on a desktop, **13 × 4** on a phone (§11).
 * Colour is never the only signal — the amber weeks carry a mark as well as a
 * hue, and the whole drawing has a text alternative.
 */

const WEEKS = 52;
/** Two weeks that need review and are resolved by the end of the year. */
const FLAGGED = new Set([18, 37]);
/** The weeks after today: outlined, not filled. A year in progress, not a claim. */
const NOT_YET_WORKED = 45;
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

type Cell = { week: number; kind: 'filed' | 'flag' | 'future' };

const CELLS: Cell[] = Array.from({ length: WEEKS }, (_, i) => {
  const week = i + 1;
  if (week > NOT_YET_WORKED) return { week, kind: 'future' };
  if (FLAGGED.has(week)) return { week, kind: 'flag' };
  return { week, kind: 'filed' };
});

const FILL = {
  filed: 'var(--wl-filed-bg)',
  flag: 'var(--wl-flag-bg)',
  future: 'none',
} as const;

const STROKE = {
  filed: 'var(--wl-filed-bd)',
  flag: 'var(--wl-flag-bd)',
  future: 'var(--wl-rule-hairline)',
} as const;

function cellClass(kind: Cell['kind']): string {
  return kind === 'flag' ? 'wl-land__cell wl-land__cell--late' : 'wl-land__cell';
}

export function FridayWall({ caption }: { caption: string }) {
  const size = 12;
  const gap = 2;
  const pitch = size + gap;
  const alt =
    'An example year of one project: forty-three weeks filed, two weeks that needed review and were resolved, seven weeks not yet worked.';

  return (
    <figure
      className="wl-land__figure-block"
      data-testid="friday-wall"
      style={{ margin: 0, display: 'grid', gap: 'var(--wl-space-3)' }}
    >
      {/* 52 × 1 — a year, read like a ruler. */}
      <svg
        className="wl-land__wall"
        viewBox={`0 0 ${WEEKS * pitch} 44`}
        role="img"
        aria-label={alt}
        data-wordcount="exclude"
      >
        <title>{alt}</title>
        {CELLS.map((cell, i) => (
          <rect
            key={cell.week}
            className={cellClass(cell.kind)}
            style={{ '--wl-i': i } as React.CSSProperties}
            x={i * pitch}
            y={0}
            width={size}
            height={20}
            rx="2"
            fill={FILL[cell.kind]}
            stroke={STROKE[cell.kind]}
            strokeWidth="1"
          />
        ))}
        {MONTHS.map((month, i) => (
          <text
            key={`${month}-${i}`}
            className="wl-land__svg-label"
            x={(i * WEEKS) / 12 * pitch}
            y="38"
          >
            {month}
          </text>
        ))}
      </svg>

      {/* 13 × 4 — the same year on a 320px screen (§11). */}
      <svg
        className="wl-land__wall--tall"
        viewBox={`0 0 ${13 * pitch} ${4 * pitch + 4}`}
        role="img"
        aria-label={alt}
        data-wordcount="exclude"
      >
        {CELLS.map((cell, i) => (
          <rect
            key={cell.week}
            className={cellClass(cell.kind)}
            style={{ '--wl-i': i } as React.CSSProperties}
            x={(i % 13) * pitch}
            y={Math.floor(i / 13) * pitch}
            width={size}
            height={size}
            rx="2"
            fill={FILL[cell.kind]}
            stroke={STROKE[cell.kind]}
            strokeWidth="1"
          />
        ))}
      </svg>

      <figcaption className="wl-land__note">{caption}</figcaption>
    </figure>
  );
}
