/**
 * Status timeline — the single highest-risk surface in the product.
 *
 * Spec: DESIGN_SYSTEM.md §8.3, USER_JOURNEY.md §6 (Nielsen #1 under a long
 * wait), A6 (colour is never the sole carrier of meaning), A11 (status changes
 * are announced), A4 (motion is decorative and removable).
 *
 * WHY THIS IS A TIMELINE AND NOT A PROGRESS BAR: the four pipeline stages are
 * genuine code-level state transitions (ARCHITECTURE.md I1 / D9 — control flow
 * lives in code, not in an agent's loop), so the UI has honest checkpoints to
 * narrate. There is no synthetic percentage anywhere in this component because
 * there is no honest proportion to report; DESIGN_SYSTEM §8.4 rules an
 * indeterminate bar out as "a status claim, and a false one".
 *
 * THE `slow` STATE IS NOT OPTIONAL. USER_JOURNEY §6.4 names silence during a
 * stalled stage as "the single highest-risk micro-interaction in the product".
 * A timeline that cannot say "still working, your draft is not lost" is
 * incomplete, so the state is part of the type rather than a caller convention.
 */

import type { ReactNode } from 'react';

export type TimelineNodeState = 'pending' | 'active' | 'done' | 'slow' | 'blocked' | 'failed';

export type TimelineNode = {
  id: string;
  /** In the seller's words, never a stage name (USER_JOURNEY §6.2). */
  label: string;
  detail?: string | null;
  state: TimelineNodeState;
  /** Real content streamed under the node — reading, not a loader. */
  stream?: ReactNode;
};

/** Glyph AND word, per node state (A6). No icon font, no emoji (X5). */
const GLYPH: Record<TimelineNodeState, string> = {
  pending: '',
  active: '',
  done: '✓',
  slow: '◷',
  blocked: '⚑',
  failed: '⚠',
};

/** The word a screen reader hears, so state never depends on the glyph either. */
const SPOKEN: Record<TimelineNodeState, string> = {
  pending: 'Not started yet.',
  active: 'In progress.',
  done: 'Done.',
  slow: 'Taking longer than usual.',
  blocked: 'Needs a person.',
  failed: 'Failed.',
};

export function StatusTimeline({
  nodes,
  label,
}: {
  nodes: readonly TimelineNode[];
  /** Accessible name for the live region. */
  label: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-atomic="false" aria-label={label}>
      <ol className="cw-timeline">
        {nodes.map((node) => (
          <li className="cw-timeline__node" key={node.id} data-state={node.state}>
            <span className="cw-timeline__glyph" aria-hidden="true">
              {GLYPH[node.state]}
            </span>
            <div>
              <p className="cw-timeline__label">
                <span className="cw-visually-hidden">{SPOKEN[node.state]} </span>
                {node.label}
              </p>
              {node.detail ? <p className="cw-timeline__detail">{node.detail}</p> : null}
              {node.stream ? <div className="cw-timeline__stream">{node.stream}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
