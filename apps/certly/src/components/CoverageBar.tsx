/**
 * THE COVERAGE BAR — the signature device. `IDENTITY.md` §9.2, §12.8.
 *
 * A horizontal band of time. Each segment is a stretch of the window in one
 * state, drawn so the state survives greyscale: solid for meets, a 45° hatch
 * for expiring, a VERTICAL hatch for claimed-not-evidenced, a dot grid for
 * needs review, a hairline for not checked, a single diagonal for no
 * certificate — and, for a gap, **a hole**.
 *
 * THE GAP IS DRAWN AS A HOLE, and that is the whole idea. A gap is the absence
 * of cover, so it is the absence of a segment: an outlined, dashed opening in
 * the band rather than a red block. A red block says "here is a bad thing";
 * a hole says "here is nothing", which is the true statement.
 *
 * THE SEPARATOR IS STRUCTURAL. Adjacent segments are divided by a 1px line in
 * `--c-surface`, so each segment contrasts against the SURFACE (5.5:1 to 6.7:1)
 * rather than against its neighbour (about 1.1:1, which would fail WCAG
 * 1.4.11). `design-system.css` draws it on `.c-bar__seg`. Do not remove it for
 * visual density.
 *
 * ACCESSIBILITY. The bar is one `role="img"` with one sentence, not seven
 * announced rectangles. `aria-label` describes the whole band in words, and
 * `IDENTITY.md` R3 I-8's correction applies: it says *"then no certificate on
 * record"*, a statement about the RECORD, never *"no coverage"*, a statement
 * about the policy.
 */

import { STATUS_MODIFIER, STATUS_WORD, type StatusState } from '@/lib/status';

export type CoverageSegment = {
  state: StatusState;
  /** Percentage of the window this segment occupies. The segments should sum
   *  to 100; the component does not silently rescale, because a bar that does
   *  not add up is a bug in the caller's date arithmetic. */
  width: number;
  /** Optional prose for this stretch, used to build the sentence. */
  label?: string;
};

export type CoverageBarProps = {
  segments: CoverageSegment[];
  /** The whole-band sentence. Required: a bar with no sentence is a picture. */
  ariaLabel: string;
  /** Where "today" falls, 0–100. Drawn once per screen, never labelled per row. */
  todayAt?: number;
  /** The date axis under the bar: two or three ticks, in the tabular face. */
  axis?: string[];
  small?: boolean;
  testId?: string;
};

export function CoverageBar({ segments, ariaLabel, todayAt, axis, small, testId }: CoverageBarProps) {
  let left = 0;
  const placed = segments.map((segment) => {
    const position = { ...segment, left };
    left += segment.width;
    return position;
  });

  return (
    <div>
      <div
        className={`c-bar${small ? ' c-bar--sm' : ''}`}
        role="img"
        aria-label={ariaLabel}
        data-testid={testId ?? 'coverage-bar'}
      >
        {placed.map((segment, index) => (
          <div
            key={`${segment.state}-${index}`}
            className={`c-bar__seg c-bar__seg--${STATUS_MODIFIER[segment.state]}`}
            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
            data-state={segment.state}
            data-testid={`coverage-segment-${segment.state}`}
          />
        ))}
        {typeof todayAt === 'number' ? (
          <div className="c-bar__today" style={{ left: `${todayAt}%` }} aria-hidden="true" />
        ) : null}
      </div>
      {axis && axis.length > 0 ? (
        <div className="c-bar__axis" aria-hidden="true">
          {axis.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The legend. Every surface that draws a bar draws this too, because a pattern
 * with no key is a decoration — and the words here are the canonical ones.
 */
export function CoverageLegend({ states }: { states: StatusState[] }) {
  return (
    <div className="c-legend">
      {states.map((state) => (
        <span className="c-legend__item" key={state}>
          <span className={`c-dot c-dot--${STATUS_MODIFIER[state]}`} aria-hidden="true" />
          {STATUS_WORD[state]}
        </span>
      ))}
    </div>
  );
}

/**
 * The portfolio strip — the ONLY chart in the product (`IDENTITY.md` §9.3).
 * One band, one segment per vendor state, the count printed inside it.
 */
export function PortfolioStrip({
  counts,
  ariaLabel,
}: {
  counts: { state: StatusState; count: number; label: string }[];
  ariaLabel: string;
}) {
  const total = counts.reduce((sum, entry) => sum + entry.count, 0) || 1;
  return (
    <div className="c-strip" role="img" aria-label={ariaLabel} data-testid="portfolio-strip">
      {counts
        .filter((entry) => entry.count > 0)
        .map((entry) => (
          <div
            key={entry.state}
            className={`c-strip__seg c-strip__seg--${STATUS_MODIFIER[entry.state]}`}
            style={{ width: `${(entry.count / total) * 100}%` }}
            title={`${entry.count} ${entry.label}`}
            data-state={entry.state}
          >
            {entry.count}
          </div>
        ))}
    </div>
  );
}
