/**
 * The State Entry Pack, as data.
 *
 * `specs/08` sells one sentence and only that sentence:
 *
 * > **Every requirement the state's board publishes, each with the page it came
 * > from and the day we checked it — and, named on the first page, every
 * > requirement it does not publish.**
 *
 * Everything in this file exists to make that promise **structural**. A pack is
 * assembled, never written: `assemble.ts` walks the committed record and emits
 * one `PackItem` per `SourcedValue`, so "every requirement the board publishes"
 * is a bijection with `walkSourcedValues(record)` rather than an editorial
 * claim, and a field nobody remembered to render cannot silently vanish.
 *
 * THE FOUR ITEM STATES, and why there are four rather than two:
 *
 *  | state                | what happened                                    | renders |
 *  |----------------------|--------------------------------------------------|---------|
 *  | `published`          | verified, high confidence                        | the value + its citation |
 *  | `needs_human_check`  | verified, below high — or a rule we inferred     | the value + its citation + **why**, inside the amber block |
 *  | `not_published`      | the board publishes no such value (value `null`) | **"not published"** — never a number, never a blank |
 *  | `not_yet_verified`   | past the 180-day rule, or `status: unverified`   | **"not yet verified"** — never a number |
 *
 * `not_published` and `not_yet_verified` are different facts and the pack says
 * which one it is: the first is a statement about the board, the second is a
 * statement about us. Collapsing them would let our own staleness read as the
 * board's silence.
 *
 * A value below `high` keeps its number — the ontology's rule, quoted in
 * `specs/08` AC2, is *"anything below high forces `needs_human_check` on any
 * expansion playbook that uses it"*, not *"anything below high is hidden"*. The
 * product may act on a medium reading; a $750 document may not assert one
 * **silently**.
 */

import type { Confidence, Trade, ValueStatus } from '../kb/types';

export type PackMode = 'preview' | 'full';

/**
 * The integrity anchor. `sourcedValueId` is the json path
 * `walkSourcedValues()` produced (`licence_types[0].exam.fee`), which is
 * stable, human-legible in a bug report, and re-resolvable against the record
 * — which is exactly what `assertPackIntegrity` does.
 */
export type PackProvenance = {
  sourcedValueId: string;
  recordId: string;
  url: string | null;
  title: string | null;
  /** The ≤25-word fragment the board's page actually carries. */
  evidence: string | null;
  lastVerified: string | null;
  confidence: Confidence;
  /** The status AFTER the 180-day rule, not the record's own word for it. */
  status: ValueStatus;
};

export type PackItemState = 'published' | 'needs_human_check' | 'not_published' | 'not_yet_verified';

export type PackItem = {
  /** Equal to `provenance.sourcedValueId`; unique within a pack. */
  id: string;
  label: string;
  /**
   * Which licence class this value belongs to, or the state itself. A gaps
   * block that says "Bond" twice has told the buyer nothing; one that says
   * "Class A — Bond" and "Class B — Bond" has told them where to look.
   */
  scope: string | null;
  state: PackItemState;
  /**
   * What the reader sees where a number would be. For `not_published` and
   * `not_yet_verified` this carries NO DIGIT, asserted by `integrity.ts`.
   */
  text: string;
  /** The value's own note — printed whenever it exists, not just when it is convenient. */
  note: string | null;
  /** Why this item is flagged, in the customer's words. Null unless flagged. */
  flagReason: string | null;
  provenance: PackProvenance;
  /** For a gap: the pages we read looking for it, and the question to ask. */
  whatWeRead: string | null;
  askThis: string | null;
  boardName: string | null;
  boardUrl: string | null;
  /** True for a `DISCLOSED_SET` field — the ones named before the card is entered. */
  disclosed: boolean;
};

/** The eight steps, in filing order (`UX.md` S16c's checkpoint list). */
export const PACK_STEP_KEYS = [
  'classification',
  'exam_and_reciprocity',
  'bond',
  'insurance',
  'qualifier',
  'fees',
  'timeline',
  'sources',
] as const;

export type PackStepKey = (typeof PACK_STEP_KEYS)[number];

export type PackStep = {
  number: number;
  key: PackStepKey;
  title: string;
  /** Fixed guidance. Digit-free by construction and by test. */
  lede: string;
  groups: { heading: string; items: PackItem[] }[];
  /** Preview mode: the step's titles are legible and its values are not. */
  withheld: boolean;
};

/**
 * Reciprocity computed **against the licences the customer already holds**,
 * which is the sentence `specs/08` calls "the product".
 */
export type PackReciprocity = {
  withState: string;
  withStateName: string;
  direction: 'inbound' | 'outbound' | 'mutual';
  /** What the target state's board requires you to already hold. */
  requiresFrom: string | null;
  matchesHolding: boolean;
  holdingDescription: string | null;
  items: PackItem[];
};

/**
 * The answer, first — `specs/08` §What it produces item 1, in the first 100
 * words. Assembled from segments so the integrity check can adjudicate it:
 *
 *  - `text`   — our own prose. **No digit may appear in it.**
 *  - `ref`    — a value, and it must match the `PackItem` it names.
 *  - `record` — a structural string from the record itself (a licence class
 *               name, a board name, the state's name). Must appear verbatim in
 *               the record's own JSON.
 */
export type AnswerSegment =
  | { kind: 'text'; text: string }
  | { kind: 'ref'; text: string; itemId: string }
  | { kind: 'record'; text: string };

export type PackBoard = {
  trade: Trade;
  name: string;
  url: string;
  scope: string;
  phone: string | null;
};

export type PackSource = {
  sourceId: string;
  url: string;
  title: string | null;
  kind: string;
  fetchedAt: string;
};

export type PackSection = {
  trade: Trade;
  recordId: string;
  /** Two trades are two sections. They are NEVER merged (`specs/08` §Edge cases). */
  steps: PackStep[];
  reciprocity: PackReciprocity[];
  reciprocityStatement: PackItem | null;
  coverageNotes: string[];
};

export type EntryPack = {
  version: 1;
  mode: PackMode;
  /** Watermarked on the shared link; null for the free sample. */
  organisationName: string | null;
  targetState: string;
  targetStateName: string;
  trades: Trade[];
  /** The civil date the pack was assembled for. A pack is a statement about a day. */
  today: string;
  recordIds: string[];
  /**
   * "how to enter" or "what you are missing" — the frame changes when the
   * customer already holds a licence in the target state (`specs/08` §Edge cases).
   */
  frame: 'entering' | 'already_licensed';
  answer: AnswerSegment[];
  boards: PackBoard[];
  /** Page one, before anything we do know. */
  gaps: PackItem[];
  needsCheckCount: number;
  /** Every flagged item, gathered for the amber panel at the top. */
  needsHumanCheck: PackItem[];
  /** `OFFER.md` §5.1.2, verbatim. */
  guarantee: string;
  /** `specs/12`, the short form. */
  disclaimer: string;
  sections: PackSection[];
  sources: PackSource[];
};

/** What the buyer already holds, for the reciprocity computation. */
export type Holding = {
  state: string;
  trade: Trade;
  /** Free text from the customer's own roster — never matched on, only printed. */
  description?: string | null;
};
