/**
 * Case-state pill.
 *
 * Spec: DESIGN_SYSTEM.md §8.8 — a dot AND a word, always (A6).
 *
 * DELIBERATE OMISSION, stated because its absence is the design: there is no
 * `rejected` tone. Rose is destructive-action and system-failure only
 * (DESIGN_SYSTEM P4.2, exclusion X3). An Amazon rejection — objectively the
 * worst moment in the arc — renders `caution` with the outcome guarantee
 * immediately adjacent, because the design job at that moment is "this is not
 * the end of the road" and red says the opposite (USER_JOURNEY §2.1).
 */

export type PillTone = 'neutral' | 'accent' | 'caution' | 'danger';

const TONE_CLASS: Record<PillTone, string> = {
  neutral: '',
  accent: 'cw-pill--accent',
  caution: 'cw-pill--caution',
  danger: 'cw-pill--danger',
};

export function StatusPill({ tone = 'neutral', children }: { tone?: PillTone; children: string }) {
  return <span className={`cw-pill ${TONE_CLASS[tone]}`.trim()}>{children}</span>;
}
