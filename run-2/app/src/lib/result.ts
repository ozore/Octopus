/**
 * RESULT — the return type every module in Ratepin uses.
 *
 * There is one reason this exists rather than exceptions, and it is not style.
 *
 * A3 forbids an escalation path to a human anywhere in the compliance flow, so
 * every unhappy path must terminate INSIDE the interface, as one of exactly four
 * refusal primitives (USER_JOURNEY §0.3). An exception is the opposite of that: it
 * is an unstructured failure that arrives at a boundary as a string, and the only
 * honest thing a screen can do with a string is show it and offer a way to ask
 * someone. A `Refusal` is renderable BY CONSTRUCTION — it carries the choices, the
 * verbatim source, the dated narrowing or the declined conclusion that the screen
 * needs — and there is no field on it in which a support address could travel.
 *
 * So the rule is: **a failure a customer can see is a `Refusal`; a failure a
 * customer cannot see is a thrown `Error`.** A malformed CSV column is a Refusal. A
 * null pointer in the renderer is an Error, it fails the request, and the fix is a
 * deploy — not a message.
 *
 * `Result` deliberately has no `Error` variant. If a module wants to return an
 * internal failure it should throw, because a caller who can neither show it nor
 * act on it has no business pattern-matching on it.
 */

import type { BlockReason, ClassificationLevel, CorpusLadderLevel, Refusal, RefusalChoice } from './types';
import { assertNever } from './types';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly refusal: Refusal };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function refuse<T>(refusal: Refusal): Result<T> {
  return { ok: false, refusal };
}

export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok;
}

export function isRefusal<T>(result: Result<T>): result is { ok: false; refusal: Refusal } {
  return !result.ok;
}

/**
 * Unwrap, or throw. Use ONLY where a refusal is genuinely impossible — a test
 * fixture, or a branch a preceding check has already eliminated. Reaching for this
 * to avoid handling a refusal is how a P-A becomes a 500, which is how a customer
 * with a blocked line ends up with no way forward and nobody to ask.
 */
export function expect<T>(result: Result<T>, context: string): T {
  if (result.ok) return result.value;
  throw new Error(`${context}: refused with ${result.refusal.primitive} — ${result.refusal.headline}`);
}

/** Map the success side. A refusal passes through untouched: it is already the
 *  finished, renderable answer and there is nothing to add to it. */
export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function flatMap<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Collect a list of results into a result of a list — but keep EVERY refusal.
 *
 * This is the shape the filing engine actually needs, and it is why this is not
 * the usual short-circuiting `all`. A payroll week with three unmapped trades must
 * show the customer all three at once: the alternative is three round trips
 * through generate-and-discover, on a Friday afternoon, which is the re-entry cost
 * the whole product exists to remove (heuristic #6). "The offending row is marked
 * and THE REST OF THE FILING CONTINUES" is P-A's definition.
 */
export function partition<T>(
  results: readonly Result<T>[],
): { readonly values: readonly T[]; readonly refusals: readonly Refusal[] } {
  const values: T[] = [];
  const refusals: Refusal[] = [];
  for (const result of results) {
    if (result.ok) values.push(result.value);
    else refusals.push(result.refusal);
  }
  return { values, refusals };
}

// ===========================================================================
// Refusal constructors
//
// One per primitive, and no more. A fifth constructor here would be a fifth
// primitive, which §0.3 forbids: "if a proposed error state is not P-A, P-B, P-C
// or P-D, it is either a bug we should fix rather than surface, or a request for a
// human, which is out of bounds."
// ===========================================================================

/** P-A — blocked line, closed choice. The rest of the filing continues. */
export function blockedLine(input: {
  readonly blockReason: BlockReason;
  readonly lineId: string;
  readonly headline: string;
  readonly detail: string;
  readonly choices: readonly RefusalChoice[];
  readonly ladderLevel: ClassificationLevel;
  /** Non-null ONLY at L-C1, where the determination's own verbatim label matched
   *  exactly. A pre-selection is an endorsement; the only party entitled to make
   *  one here is the federal text. */
  readonly preSelected?: string | null;
}): Refusal {
  const preSelected = input.preSelected ?? null;
  if (preSelected !== null && input.ladderLevel !== 'L_C1') {
    throw new Error(
      `P-A: a candidate may only arrive pre-selected at L-C1 (exact match against the ` +
        `determination's own label); got ${input.ladderLevel}. ENGINE.md §18.2 / E5.`,
    );
  }
  return {
    primitive: 'P-A',
    blockReason: input.blockReason,
    lineId: input.lineId,
    headline: input.headline,
    detail: input.detail,
    choices: input.choices,
    preSelected,
    ladderLevel: input.ladderLevel,
  };
}

/** P-B — DRAFT — NOT CERTIFIABLE. The artifact renders in full; the signature
 *  block does not. */
export function draftNotCertifiable(input: {
  readonly blockReasons: readonly BlockReason[];
  readonly headline: string;
  readonly detail: string;
  readonly exceptionReport: readonly string[];
}): Refusal {
  if (input.blockReasons.length === 0) {
    throw new Error(
      'P-B: a DRAFT — NOT CERTIFIABLE artifact must name at least one block reason. ' +
        'An unexplained watermark is a warning, and a warning can be clicked past.',
    );
  }
  return {
    primitive: 'P-B',
    blockReasons: input.blockReasons,
    headline: input.headline,
    detail: input.detail,
    watermark: 'DRAFT — NOT CERTIFIABLE',
    signatureBlockWithheld: true,
    exceptionReport: input.exceptionReport,
  };
}

/**
 * P-C — narrowed claim, dated banner, auto-credit where the narrowing is ours.
 *
 * The date is not optional and there is no overload without it: a narrowing
 * without a timestamp is vagueness wearing a refusal's clothes, and the whole
 * value of the narrowed sentence is that it says exactly how old our knowledge is.
 */
export function narrowedClaim(input: {
  readonly headline: string;
  readonly narrowedClaim: string;
  readonly asOf: Date;
  readonly ladderLevel: CorpusLadderLevel;
  /** Only when OUR verification lapsed. A superseded pin narrows identically and
   *  carries no credit, because nothing of ours failed. */
  readonly credit?: { readonly reason: string; readonly accruingSince: Date; readonly cents: null } | null;
}): Refusal {
  return {
    primitive: 'P-C',
    headline: input.headline,
    narrowedClaim: input.narrowedClaim,
    asOf: input.asOf,
    ladderLevel: input.ladderLevel,
    credit: input.credit ?? null,
  };
}

/**
 * P-D — declined conclusion.
 *
 * `rule` must be the regulation's own words. This product's credibility rests on
 * quoting rather than remembering, and the one place a paraphrase is least
 * excusable is the sentence we are refusing to apply.
 */
export function declinedConclusion(input: {
  readonly headline: string;
  readonly rule: string;
  readonly citation: string;
  readonly observableFacts: readonly { readonly label: string; readonly value: string }[];
  readonly declined: string;
}): Refusal {
  return {
    primitive: 'P-D',
    headline: input.headline,
    rule: input.rule,
    citation: input.citation,
    observableFacts: input.observableFacts,
    declined: input.declined,
  };
}

// ===========================================================================
// Rendering support
// ===========================================================================

/**
 * Total over the four primitives. Every renderer that shows a refusal goes through
 * a `switch` closed by `assertNever`, so adding a primitive is a compile error in
 * every place that displays one — which is the only way "there is no fifth shape"
 * stays true after the first deadline.
 */
export function refusalKind(refusal: Refusal): 'choice' | 'draft' | 'narrowed' | 'declined' {
  switch (refusal.primitive) {
    case 'P-A':
      return 'choice';
    case 'P-B':
      return 'draft';
    case 'P-C':
      return 'narrowed';
    case 'P-D':
      return 'declined';
    default:
      return assertNever(refusal, 'unknown refusal primitive');
  }
}

/** True when the refusal withholds the signature block. Exactly P-B does. */
export function withholdsSignature(refusal: Refusal): boolean {
  return refusal.primitive === 'P-B';
}

/** True when the refusal leaves the artifact and the rate untouched. P-C and P-D
 *  both do: one narrows a sentence, the other declines a conclusion, and neither
 *  moves a number. */
export function leavesArtifactIntact(refusal: Refusal): boolean {
  return refusal.primitive === 'P-C' || refusal.primitive === 'P-D';
}
