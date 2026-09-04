/**
 * THE STATE VOCABULARY — three data state machines, seven visual states.
 *
 * `specs/05` §2.1 is the canonical mapping table and this module is its
 * executable copy. Everything that paints a status — the pill, the coverage
 * bar, the portfolio strip, the dashboard counters, the exports — reads the
 * word and the visual state from HERE, so a rename is one edit and a test
 * failure rather than a hunt.
 *
 * Two rules that are enforced by tests, not by care:
 *   - **"Covered" is not a status word.** The green requirement state is `met`
 *     and its word is "Meets requirements"; the green vendor state is `meets`
 *     and its pill is `MEETS` (REVIEW.md B-02, KB §F.5). `tests/vocabulary.test.ts`
 *     greps the built source for the retired word.
 *   - **Seven visual states, each with a word, a glyph, a fill pattern and a
 *     hue** (IDENTITY.md §6.4, certified by `identity/contrast.py`). Four
 *     signals, never fewer; `design-system.css` carries the patterns.
 */

/** Requirement level — `specs/05` §2. Exactly five, always. */
export const REQUIREMENT_STATES = [
  'met',
  'gap',
  'asserted_only',
  'not_checked',
  'undetermined',
] as const;
export type RequirementState = (typeof REQUIREMENT_STATES)[number];

/** Vendor level — `specs/06` §3. Exactly six, mutually exclusive, exhaustive. */
export const VENDOR_STATES = [
  'expired',
  'gap',
  'expiring',
  'asserted_only',
  'meets',
  'no_certificate',
] as const;
export type VendorState = (typeof VENDOR_STATES)[number];

/** Document level — `specs/03` §8. */
export const DOCUMENT_STATES = [
  'pending',
  'running',
  'needs_review',
  'ready',
  'rejected',
  'failed',
] as const;
export type DocumentState = (typeof DOCUMENT_STATES)[number];

/** Visual level — IDENTITY.md §6.4, arbitrated. Exactly seven. */
export const STATUS_STATES = [
  'meets',
  'expiring',
  'asserted_only',
  'gap',
  'needs_review',
  'not_checked',
  'no_certificate',
] as const;
export type StatusState = (typeof STATUS_STATES)[number];

/** The design system's modifier suffix for each visual state (`.c-pill--ok`, …). */
export const STATUS_MODIFIER: Record<StatusState, string> = {
  meets: 'ok',
  expiring: 'warn',
  asserted_only: 'ast',
  gap: 'gap',
  needs_review: 'rev',
  not_checked: 'nc',
  no_certificate: 'none',
};

/** The pill word. Short form for the pill, long form for prose. */
export const STATUS_WORD: Record<StatusState, string> = {
  meets: 'Meets',
  expiring: 'Expiring',
  asserted_only: 'Claimed, not evidenced',
  gap: 'Gap',
  needs_review: 'Needs review',
  not_checked: 'Not checked',
  no_certificate: 'No certificate',
};

export const STATUS_WORD_LONG: Record<StatusState, string> = {
  meets: 'Meets requirements',
  expiring: 'Expiring',
  asserted_only: 'Claimed, not evidenced',
  gap: 'Gap',
  needs_review: 'Needs review',
  not_checked: 'Not checked',
  no_certificate: 'No certificate',
};

/** `specs/05` §2.1 — requirement data state → visual state. */
export const REQUIREMENT_STATUS: Record<RequirementState, StatusState> = {
  met: 'meets',
  gap: 'gap',
  asserted_only: 'asserted_only',
  not_checked: 'not_checked',
  undetermined: 'needs_review',
};

/**
 * `specs/05` §2.1 — vendor data state → visual state.
 *
 * `expired` has NO row of its own in IDENTITY.md §6.4 (the one item the Brand
 * Director still owes, recorded in REVIEW_RESPONSE.md B-03). Until it does, it
 * renders in the `gap` ramp **with its own word, "Expired"** — safe because
 * `contrast.py` hard-fails a duplicated word, and "Expired" (lapsed) and "Gap"
 * (short) carry different facts.
 */
export const VENDOR_STATUS: Record<VendorState, StatusState> = {
  expired: 'gap',
  gap: 'gap',
  expiring: 'expiring',
  asserted_only: 'asserted_only',
  meets: 'meets',
  no_certificate: 'no_certificate',
};

/** The word shown for a vendor state — `expired` overrides its ramp's word. */
export const VENDOR_WORD: Record<VendorState, string> = {
  expired: 'Expired',
  gap: 'Gap',
  expiring: 'Expiring',
  asserted_only: 'Claimed, not evidenced',
  meets: 'Meets requirements',
  no_certificate: 'No certificate',
};

/** The dashboard counter labels — `specs/06` §3, verbatim. */
export const VENDOR_COUNTER_LABEL: Record<VendorState, string> = {
  expired: 'Expired',
  gap: 'Gaps',
  expiring: 'Expiring 30d',
  asserted_only: 'Claimed, not evidenced',
  meets: 'Meets requirements',
  no_certificate: 'No certificate',
};

/** `specs/03` §8 — document state → what the chrome paints. */
export const DOCUMENT_STATUS: Record<DocumentState, StatusState | 'chrome'> = {
  pending: 'chrome',
  running: 'chrome',
  needs_review: 'needs_review',
  ready: 'meets',
  rejected: 'gap',
  failed: 'gap',
};

export function requirementStatus(state: RequirementState): StatusState {
  return REQUIREMENT_STATUS[state];
}

export function vendorStatus(state: VendorState): StatusState {
  return VENDOR_STATUS[state];
}

/** The word to print for a vendor state, honouring the `expired` override. */
export function vendorWord(state: VendorState): string {
  return VENDOR_WORD[state];
}
