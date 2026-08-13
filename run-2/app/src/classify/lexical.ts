/**
 * STAGE 2 — deterministic lexical retrieval over THIS revision's own class list.
 *
 * AUTHORITY: `ENGINE.md` §15.1 ("Deterministic scoring over the parsed
 * classification list of *this WD revision*: normalized token-set Jaccard, plus a
 * hand-curated synonym table anchored on SOC titles, plus a penalty for
 * classifications in a union-prefixed group"), §15.2, §18.2's L-C1 / L-C2 rows.
 *
 * ---------------------------------------------------------------------------
 * WHY A DUMB RETRIEVER IS A FEATURE, NOT A COMPROMISE
 *
 * ENGINE §15.2 makes the argument and it is worth restating where the code lives:
 * the output space *is* the retrieval set, so nothing is generated and a
 * hallucinated classification is unsampleable rather than merely rejected. A
 * cleverer retriever would move mistakes upstream of the schema gate, where nothing
 * is checking. This one is a ratio of two integers over a token set, and every one
 * of its mistakes shows up as a worse ORDERING of real rows from the pinned mirror.
 *
 * ---------------------------------------------------------------------------
 * THIS IS ALSO THE FREE TIER, AND THAT IS WHY IT IS FIRST
 *
 * Deep dive 03 makes "the free tier makes ZERO LLM calls" load-bearing for margin,
 * and `ARCHITECTURE.md` §3.8 makes the free generator the tested fallback for when
 * the model budget is exhausted or Anthropic is unreachable. Those are the same
 * code path — this file. The emergency path is in constant production use rather
 * than being a cold branch discovered during an incident.
 *
 * ---------------------------------------------------------------------------
 * EVERY THRESHOLD COMPARISON IS INTEGER
 *
 * `0.92` and `0.15` are not exactly representable in binary floating point, and the
 * difference between "the model was called" and "it was not" should not turn on the
 * last bit of a double. Scores are carried as integer ten-thousandths (`score1e4`)
 * and every comparison in the ladder reads that. The float is derived for display
 * and for nothing else. This is the same discipline `src/lib/money.ts` applies to
 * money, for a weaker reason (a mis-ordered picker is not a wrong rate) but at
 * zero cost.
 */

import type { Classification, ClassificationId } from '@/lib/types';

import { normalizeTitle, tokensOf, type TitleNorm } from './normalize';

// ===========================================================================
// Constants — every one of them chosen, none of them fitted
// ===========================================================================

/** ENGINE §18.2 L-C2 / Q-E3. Above this, with the margin below, no model call is
 *  made. Since the HIGH-2 remediation these govern only whether the model is
 *  CALLED, never whether a radio is filled, so being wrong costs a model call and
 *  never a rate. Flagged as chosen-conservatively rather than fitted; ENGINE Q-E3
 *  says fit them against the §26 benchmark once >= 300 confirmations exist. */
export const TAU_LEX_1E4 = 9_200;
export const DELTA_LEX_1E4 = 1_500;

/**
 * ENGINE §18.2 L-F: "zero candidates above the lexical floor". The document sets no
 * value, so this one is ours and is flagged as such (**Q-CL1**). It is deliberately
 * low: the floor decides whether the customer is offered a shortlist at all, and
 * offering three real rows from the determination costs a read of their scope text,
 * while offering none routes to the conformance path — the more consequential of
 * the two answers. A floor set high to look decisive would produce L-F on trades
 * that are plainly present.
 */
export const LEXICAL_FLOOR_1E4 = 1_000;

/** ENGINE §15.4: the response enum is fixed at `[0..11]` for the life of the
 *  product so the compiled grammar is byte-stable and its 24-hour cache is never
 *  invalidated by a candidate count. The slice is therefore capped at 12. */
export const CANDIDATE_SLICE_MAX = 12;

/** The picker shows three (D7, §18.2 L-D/L-E), plus "none of these". */
export const PICKER_TOP_N = 3;

/**
 * ENGINE §15.1's union-group penalty, as a multiplicative factor in
 * ten-thousandths. `is_union_group` is a parsed field and it drives both this and
 * the D9 setup refusal: for an open-shop subcontractor — D1's buyer — a
 * union-identified row is the less likely answer, and its fringe is an aggregate
 * whose CBA schedule we deliberately do not hold.
 *
 * IT CANNOT DEMOTE AN EXACT MATCH, BY CONSTRUCTION. An exact normalized match
 * against the determination's own label scores 1.0 whatever its identifier, because
 * L-C1's licence is the federal text and the penalty is a preference between
 * inexact guesses. Applying it to an exact match would silently withdraw the one
 * pre-selection the product allows.
 */
export const UNION_GROUP_FACTOR_1E4 = 9_000;

const SCALE = 10_000;

// ===========================================================================
// The synonym layer
// ===========================================================================

/**
 * Multi-token phrases folded before the concept map, longest first.
 *
 * Hand-curated and anchored on the alternate-title vocabulary of O*NET's SOC major
 * group 47-2 (`CORPUS_DESIGN.md` §7.1 — 1,595 rows), which is the seed the L2 layer
 * of the crosswalk will ingest. Until that ingest lands, this table is the part of
 * it the retriever needs, written out by hand rather than inferred.
 */
const COMPOUNDS: readonly (readonly [readonly string[], readonly string[]])[] = [
  [['ROD', 'BUSTER'], ['IRONWORKER', 'REINFORCING']],
  [['ROD', 'BUSTERS'], ['IRONWORKER', 'REINFORCING']],
  [['PIPE', 'LAYER'], ['PIPELAYER']],
  [['PIPE', 'FITTER'], ['PIPEFITTER']],
  [['STEAM', 'FITTER'], ['PIPEFITTER']],
  [['FIRE', 'SPRINKLER'], ['SPRINKLER', 'FITTER']],
  [['SHEET', 'METAL'], ['SHEETMETAL']],
  [['TRACK', 'HOE'], ['TRACKHOE']],
  [['SKID', 'LOADER'], ['SKID', 'STEER']],
  [['HOD', 'CARRIER'], ['LABORER']],
  [['FLAT', 'WORK'], ['CONCRETE', 'FINISHER']],
  [['FORM', 'SETTER'], ['CARPENTER', 'FORM']],
  [['CONCRETE', 'PUMP'], ['CONCRETE', 'PUMP', 'OPERATOR']],
];

/**
 * Single-token folding: plurals, spelling variants and SOC-anchored synonyms.
 *
 * There is deliberately no algorithmic stemmer here. A stemmer that turns
 * `FINISHER` into `FINISH` also turns `MASON` into `MASO` on the next release of
 * whatever library supplies it, and a silent change to this map is a silent change
 * to a crosswalk key.
 */
const CONCEPTS: Readonly<Record<string, string>> = {
  APPRENTICES: 'APPRENTICE',
  BULLDOZER: 'DOZER',
  CARPENTERS: 'CARPENTER',
  CEMENTMASON: 'MASON',
  DRIVERS: 'DRIVER',
  ELECTRICIANS: 'ELECTRICIAN',
  EXCAVATORS: 'EXCAVATOR',
  EXCAVATING: 'EXCAVATOR',
  FINISHERS: 'FINISHER',
  FINISHING: 'FINISHER',
  FLATWORK: 'CONCRETE',
  FORMWORK: 'FORM',
  GRADEMAN: 'LABORER',
  HELPERS: 'HELPER',
  IRONWORKERS: 'IRONWORKER',
  JOURNEYMEN: 'JOURNEYMAN',
  LABORERS: 'LABORER',
  LABOURER: 'LABORER',
  LABOURERS: 'LABORER',
  MASONS: 'MASON',
  OPERATORS: 'OPERATOR',
  OPERATING: 'OPERATOR',
  PAINTERS: 'PAINTER',
  PLUMBERS: 'PLUMBER',
  REBAR: 'REINFORCING',
  REINFORCEMENT: 'REINFORCING',
  SIGNAL: 'SIGNALIZATION',
  STRIPER: 'PAINTER',
  STRIPING: 'PAINTER',
  WELDERS: 'WELDER',
};

function foldConcepts(tokens: readonly string[]): readonly string[] {
  const compounded: string[] = [];
  let index = 0;
  outer: while (index < tokens.length) {
    for (const [phrase, replacement] of COMPOUNDS) {
      if (phrase.every((word, offset) => tokens[index + offset] === word)) {
        compounded.push(...replacement);
        index += phrase.length;
        continue outer;
      }
    }
    compounded.push(tokens[index] ?? '');
    index += 1;
  }
  return compounded.map((token) => CONCEPTS[token] ?? token);
}

/** The comparand: a SET, because `OPERATOR BACKHOE BACKHOE` and `OPERATOR BACKHOE`
 *  describe the same work and Jaccard is defined over sets. */
export function conceptSet(norm: TitleNorm | string): ReadonlySet<string> {
  return new Set(foldConcepts(tokensOf(norm)));
}

// ===========================================================================
// Scoring
// ===========================================================================

export interface LexicalCandidate {
  readonly classificationId: ClassificationId;
  readonly classification: Classification;
  /** Integer ten-thousandths. EVERY threshold comparison reads this field. */
  readonly score1e4: number;
  /** Derived from `score1e4` for display and for the `offered` audit payload. */
  readonly score: number;
  /**
   * The determination's own label, normalized, equals the payroll title,
   * normalized. THIS IS THE ONLY INPUT IN THE PRODUCT ENTITLED TO FILL A RADIO
   * (E5, `USER_JOURNEY.md` §6.3.1's permission table).
   */
  readonly exact: boolean;
  readonly unionGroup: boolean;
}

function jaccard1e4(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return Math.round((intersection * SCALE) / union);
}

function isUnionGroup(classification: Classification): boolean {
  return (
    classification.identifierKind === 'union' || classification.identifierKind === 'union_average'
  );
}

/**
 * Score every parsed row of THIS revision against the normalized title, then order.
 *
 * The ordering is a TOTAL order with an explicit tie-break on `ordinal`, so two
 * rows with the same score always come back in the same sequence. A comparator that
 * returns 0 on ties would leave the order to the engine's sort stability, which is
 * a property of the input array rather than of this function — and `G1`'s
 * exact-match gate reads the picker's order.
 */
export function scoreCandidates(
  titleNorm: TitleNorm,
  classifications: readonly Classification[],
): readonly LexicalCandidate[] {
  const title = conceptSet(titleNorm);
  const scored = classifications.map((classification): LexicalCandidate => {
    const labelNorm = normalizeTitle(classification.className);
    const exact = labelNorm === titleNorm && String(titleNorm) !== '';
    const unionGroup = isUnionGroup(classification);
    const raw = exact ? SCALE : jaccard1e4(title, conceptSet(labelNorm));
    const score1e4 = exact
      ? SCALE
      : Math.round((raw * (unionGroup ? UNION_GROUP_FACTOR_1E4 : SCALE)) / SCALE);
    return {
      classificationId: classification.id,
      classification,
      score1e4,
      score: score1e4 / SCALE,
      exact,
      unionGroup,
    };
  });

  return [...scored].sort((left, right) => {
    if (right.score1e4 !== left.score1e4) return right.score1e4 - left.score1e4;
    if (left.exact !== right.exact) return left.exact ? -1 : 1;
    return left.classification.ordinal - right.classification.ordinal;
  });
}

/** Above the floor, capped at the schema's fixed enum width. */
export function candidateSlice(
  scored: readonly LexicalCandidate[],
  limit: number = CANDIDATE_SLICE_MAX,
): readonly LexicalCandidate[] {
  return scored.filter((candidate) => candidate.score1e4 >= LEXICAL_FLOOR_1E4).slice(0, limit);
}

/**
 * L-C2's band, evaluated on the SLICE rather than on the whole list.
 *
 * Read the shape carefully, because it is the HIGH-2 remediation in three lines:
 * this returns whether the MODEL CALL is skipped, and nothing else. It does not
 * return a candidate, it is not consulted when deciding whether a radio is filled,
 * and `USER_JOURNEY.md` §6.3.1's permission table gives similarity-below-exact
 * exactly one power — ordering.
 */
export function skipsModelCall(slice: readonly LexicalCandidate[]): boolean {
  const top = slice[0];
  if (top === undefined) return false;
  if (top.exact) return true;
  const second = slice[1];
  const margin = top.score1e4 - (second?.score1e4 ?? 0);
  return top.score1e4 >= TAU_LEX_1E4 && margin >= DELTA_LEX_1E4;
}

/** The single exact match, when there is exactly one. Two rows of one determination
 *  that normalize to the same label is a parser question, not a pre-selection
 *  licence, so an ambiguous exact match pre-selects nothing. */
export function soleExactMatch(
  scored: readonly LexicalCandidate[],
): LexicalCandidate | undefined {
  const exact = scored.filter((candidate) => candidate.exact);
  return exact.length === 1 ? exact[0] : undefined;
}
