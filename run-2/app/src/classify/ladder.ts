/**
 * THE CLASSIFICATION LADDER — L-A through L-F, after the HIGH-2 remediation.
 *
 * AUTHORITY: `ENGINE.md` §18 (the ladder, and E5 which governs all of it), §15
 * (the three deterministic stages and the model call), `USER_JOURNEY.md` §6.3.1
 * (the permission table), `ARCHITECTURE.md` §11.6 (AS-5).
 *
 * ===========================================================================
 * THE ONE RULE THE WHOLE FILE IS ARRANGED AROUND
 *
 * > **E5 — There is no confidence value at which the model resolves a
 * > classification.**
 *
 * Thresholds here govern ORDERING and whether a model call is MADE. Exactly one
 * input may arrive with a radio filled — an exact normalized match against this
 * determination's own verbatim classification label — and it is federal text, not
 * another tenant's answer and not a model's.
 *
 * The asymmetry that makes an extra click obviously correct: a wrong classification
 * produces a wrong rate on a signed federal document, discoverable years later,
 * with back wages, interest, withholding and three-year debarment under 29 CFR 5.12
 * on one side; and one extra click, once, per title, per account, on the other.
 *
 * ===========================================================================
 * THE MODEL AND THE AGGREGATE HAVE THE SAME TYPE, WHICH IS THE POINT
 *
 * An accepted model response becomes a `CandidateOrdering` — the same
 * one-field-only type the cross-tenant aggregate returns — and goes through the
 * same `applyOrdering`. So the model, like the aggregate, cannot pre-select, cannot
 * shorten the list and cannot introduce a row that is not on this revision. Both
 * powers are the same power, spelled the same way, and a future change that widened
 * one would have to widen a type two subsystems read.
 *
 * ===========================================================================
 * WHAT THIS MODULE NEVER DOES
 *
 * It never computes a rate (the rate is read from the pinned mirror by the engine),
 * never constructs a `ClassificationId` (only the mirror read model does), never
 * blocks a filing (`deriveStatus` owns that), and never produces a route to a
 * person: `Refusal` has no field in which a support address could travel, and the
 * only exit from an unresolved line is a click on a row of the determination.
 */

import { blockedLine, declinedConclusion } from '@/lib/result';
import type {
  Classification,
  ClassificationId,
  ClassificationLevel,
  Refusal,
  RefusalChoice,
  IsoDate,
  SnapshotRef,
  WdNumber,
} from '@/lib/types';
import { CLASSIFICATION_LADDER } from '@/lib/types';
import type { AccountId } from '@/db/tenant';
import type { Tx } from '@/db';

import {
  applyOrdering,
  orderingOf,
  readAggregateOrdering,
  type CandidateOrdering,
  type Executor,
} from './aggregate';
import {
  lookupCrosswalk,
  offeredFrom,
  ownPriorOrdinals,
  recordConfirmation,
  resolveHit,
  type OfferedCandidate,
} from './crosswalk';
import {
  candidateSlice,
  PICKER_TOP_N,
  scoreCandidates,
  skipsModelCall,
  soleExactMatch,
  type LexicalCandidate,
} from './lexical';
import { normalizeTitle, type TitleNorm } from './normalize';
import type { RankerTransport, RankUsage } from './model/client';
import { buildRankRequest, RANKER_VERSION, type RankRequest } from './model/prompt';
import { validateRankResponse, type RankRejection } from './model/schema';

// ===========================================================================
// Copy — every string a screen renders from this module
// ===========================================================================

/**
 * `USER_JOURNEY.md` §6.3.1, verbatim: what we tell the user about the aggregate,
 * once, in the picker's footnote — and never as a number beside a candidate.
 */
export const PICKER_FOOTNOTE =
  'Candidates are ordered by how well their scope text matches your title and, where ' +
  'enough unrelated companies have independently mapped the same title, by that. ' +
  'Ordering only — nothing here is chosen for you, and no other company’s answer is ' +
  'ever applied to your filing. Your own answers are different: once you confirm a ' +
  'title, we apply it silently from then on and stop asking.';

/**
 * `USER_JOURNEY.md` §6.4's L-F row and `ENGINE.md` §18.2. The honest end of the
 * ladder: the rule, the route, and a plain statement of what we do not do. There is
 * no address in it, because there is nobody to write to (A3).
 */
export const CONFORMANCE_PATH =
  'If the work this title names is not listed on this determination, the route is a ' +
  'conformance request under 29 CFR 5.5(a)(1)(iii) — Standard Form 1444, submitted by ' +
  'the contracting officer. Ratepin does not prepare or file SF-1444s and will not do ' +
  'it for you. This determination’s own classification list is below; if one of these ' +
  'does describe the work, choose it and the row resolves.';

/** 29 CFR 5.5(a)(1)(iii)(A), as `ENGINE.md` §18.2 quotes it. ENGINE owns the ladder,
 *  so its citation governs where `USER_JOURNEY.md` §6.4 cites (a)(1)(ii). */
export const CONFORMANCE_RULE =
  'the contracting officer must require that any class of laborers or mechanics … ' +
  'which is not listed in the wage determination … be classified in conformance with ' +
  'the wage determination';

export const CONFORMANCE_CITATION = '29 CFR 5.5(a)(1)(iii)';

// ===========================================================================
// Inputs and outputs
// ===========================================================================

/** What the pin fixes. Every field here is already frozen at project setup; nothing
 *  in this module consults SAM, and there is no clock in the signature. */
export interface PinnedRevision {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly snapshotRef: SnapshotRef;
  /** For the aggregate key. `null` where the determination carries no state code. */
  readonly stateCode: string | null;
  readonly constructionType: string;
}

/**
 * `free` is not a billing concept here, it is a CAPABILITY: no account, nothing
 * persisted beyond the session, and — deep dive 03's non-negotiable for margin —
 * zero model calls. `tests/classify/ladder.test.ts` asserts the last one against a
 * transport that throws when touched.
 */
export type ClassifyTier = 'free' | 'paid';

export interface ResolveInput {
  readonly lineId: string;
  readonly rawTitle: string;
  readonly tier: ClassifyTier;
  readonly pin: PinnedRevision;
  /** THIS revision's parsed rows, from the mirror read model. The candidate set is
   *  a closed enumeration of these and of nothing else. */
  readonly classifications: readonly Classification[];
  /** Absent on the free generator, which has no account and therefore no memory. */
  readonly account?: AccountId;
  /** P12. Exhaustion degrades L-D to L-E — the free generator's own path — and
   *  never blocks a filing. */
  readonly modelBudgetExhausted?: boolean;
}

export interface ResolveDeps {
  /** Absent on the free generator: no crosswalk read, no aggregate read. */
  readonly db?: Executor;
  /** Absent when Anthropic is not configured. Same product state as unreachable. */
  readonly transport?: RankerTransport;
  readonly modelId?: string;
}

export interface RankAttribution {
  readonly rankerVersion: number;
  readonly ordering: 'crosswalk' | 'deterministic' | 'aggregate_ordered' | 'llm_ranked';
  readonly modelId: string | null;
  readonly promptBundleHash: string | null;
  readonly usage: RankUsage | null;
  /** §15.6's alert-free signal. `true` on a call that read nothing from the cache;
   *  a SUSTAINED true across same-WD requests is the drift incident. */
  readonly cacheReadZero: boolean;
  readonly rejection: RankRejection | null;
}

export interface ClassificationOutcome {
  readonly level: ClassificationLevel;
  readonly lineId: string;
  readonly rawTitle: string;
  readonly titleNorm: TitleNorm;
  /** Non-null at L-A ONLY. Every other level blocks the line until a click. */
  readonly resolved: Classification | null;
  /**
   * EVERY parsed row of this revision, in display order — the retriever's slice
   * first, then the rest by score. This is what "None of these" opens onto, and it
   * is what a confirmation may name: `USER_JOURNEY.md` §6.1 puts the full
   * searchable list under the three candidates, and a customer who has to pick the
   * fourth-best row must be able to.
   */
  readonly candidates: readonly LexicalCandidate[];
  /** What the picker shows: three at L-B/L-C2/L-D/L-E, one at L-C1, all at L-F. */
  readonly picker: readonly LexicalCandidate[];
  /** NON-NULL AT L-C1 AND NOWHERE ELSE. `blockedLine()` throws if that is violated. */
  readonly preSelected: ClassificationId | null;
  readonly banner: string | null;
  readonly modelCalled: boolean;
  /** P-A while the line is blocked; `null` at L-A. */
  readonly refusal: Refusal | null;
  /** P-D at L-F and nowhere else. */
  readonly declined: Refusal | null;
  readonly attribution: RankAttribution;
}

// ===========================================================================
// Refusal construction
// ===========================================================================

function choiceOf(candidate: LexicalCandidate): RefusalChoice {
  const classification = candidate.classification;
  return {
    value: classification.id,
    label: classification.className,
    // The determination's own lines, newlines preserved. Help here is inline
    // provenance, not a help centre.
    verbatimSource: classification.classNameVerbatim,
    sourceCitation:
      `${classification.wdNumber} revision ${classification.revision} · ` +
      `${classification.rateIdentifier} · lines ${classification.sourceLineStart}–${classification.sourceLineEnd}`,
    baseRate: classification.baseRate,
    fringeRate: classification.fringeRate,
  };
}

function pickerDetail(pin: PinnedRevision, level: ClassificationLevel): string {
  const rule = CLASSIFICATION_LADDER[level];
  const lines = [
    `Every candidate below is a row of ${pin.wdNumber} revision ${pin.revision}, ` +
      `published ${pin.publishDate}. The label, the scope text and the rates are the ` +
      'determination’s own.',
    'Your choice is remembered for this title on every project carrying this ' +
      'determination’s group, and you are not asked again.',
  ];
  if (rule.banner !== null) lines.push(rule.banner);
  lines.push(PICKER_FOOTNOTE);
  return lines.join('\n\n');
}

function blockedRefusal(input: {
  readonly level: ClassificationLevel;
  readonly lineId: string;
  readonly rawTitle: string;
  readonly pin: PinnedRevision;
  readonly picker: readonly LexicalCandidate[];
  readonly preSelected: ClassificationId | null;
}): Refusal {
  const headline =
    input.level === 'L_F'
      ? `No classification on this determination matched “${input.rawTitle}”`
      : `Choose the classification for “${input.rawTitle}”`;
  const detail =
    input.level === 'L_F'
      ? `${CONFORMANCE_PATH}\n\n${PICKER_FOOTNOTE}`
      : pickerDetail(input.pin, input.level);

  return blockedLine({
    blockReason: 'UNMAPPED_TRADE',
    lineId: input.lineId,
    headline,
    detail,
    choices: input.picker.map(choiceOf),
    ladderLevel: input.level,
    preSelected: input.preSelected,
  });
}

/**
 * P-D at L-F. We state the rule, show the observable dates, and refuse to draw the
 * conclusion — because whether a conformance request is required here turns on a
 * contracting-officer determination we cannot observe, and because we do not file
 * the form either way.
 */
function conformanceDeclined(input: {
  readonly rawTitle: string;
  readonly titleNorm: TitleNorm;
  readonly pin: PinnedRevision;
  readonly classCount: number;
}): Refusal {
  return declinedConclusion({
    headline: 'Whether this work requires a conformance request',
    rule: CONFORMANCE_RULE,
    citation: CONFORMANCE_CITATION,
    observableFacts: [
      { label: 'Payroll title, as written', value: input.rawTitle },
      { label: 'Payroll title, normalized', value: String(input.titleNorm) },
      { label: 'Wage determination', value: `${input.pin.wdNumber} revision ${input.pin.revision}` },
      { label: 'Published', value: String(input.pin.publishDate) },
      { label: 'Classifications parsed on this revision', value: String(input.classCount) },
      { label: 'Corpus snapshot', value: String(input.pin.snapshotRef) },
    ],
    declined:
      'Ratepin does not conclude whether the work this title names is listed on this ' +
      'determination, and does not prepare or file SF-1444 conformance requests. The row ' +
      'stays blocked and the filing carries it as an exception.',
  });
}

// ===========================================================================
// The ladder
// ===========================================================================

const EMPTY_ATTRIBUTION: RankAttribution = {
  rankerVersion: RANKER_VERSION,
  ordering: 'deterministic',
  modelId: null,
  promptBundleHash: null,
  usage: null,
  cacheReadZero: false,
  rejection: null,
};

/**
 * The full list, best-first: the retriever's slice in its display order, then every
 * other row of the revision behind it. Nothing is ever dropped — a silently dropped
 * classification is how the picker offers a wrong best answer (§15.3 note 2).
 */
function fullList(
  ordered: readonly LexicalCandidate[],
  scored: readonly LexicalCandidate[],
): readonly LexicalCandidate[] {
  const inSlice = new Set(ordered.map((candidate) => candidate.classificationId));
  return [...ordered, ...scored.filter((candidate) => !inSlice.has(candidate.classificationId))];
}

function pickerFor(
  level: ClassificationLevel,
  all: readonly LexicalCandidate[],
  ordered: readonly LexicalCandidate[],
  exact: LexicalCandidate | undefined,
): readonly LexicalCandidate[] {
  // L-C1 offers ONE candidate, pre-selected, with its verbatim line and rates.
  if (level === 'L_C1' && exact !== undefined) return [exact];
  // L-F offers the determination's whole classification list, searchable.
  if (level === 'L_F') return all;
  return ordered.slice(0, PICKER_TOP_N);
}

/**
 * Resolve one payroll title against one pinned revision.
 *
 * Deterministic given its inputs and its transport: no clock, no randomness, no
 * locale. The only I/O is two reads (the account's own memory, the k-anonymised
 * prior) and at most one model call, and every one of them can be absent without
 * changing the shape of the answer.
 */
export async function resolveClassification(
  deps: ResolveDeps,
  input: ResolveInput,
): Promise<ClassificationOutcome> {
  const titleNorm = normalizeTitle(input.rawTitle);

  // --- Stage 0: the account's own confirmed memory. Silent, and only here. ------
  if (deps.db !== undefined && input.account !== undefined && String(titleNorm) !== '') {
    const hit = await lookupCrosswalk(deps.db, {
      account: input.account,
      wdNumber: input.pin.wdNumber,
      titleNorm,
    });
    const remembered = hit === null ? undefined : resolveHit(hit, input.classifications);
    if (remembered !== undefined) {
      return {
        level: 'L_A',
        lineId: input.lineId,
        rawTitle: input.rawTitle,
        titleNorm,
        resolved: remembered,
        candidates: [],
        picker: [],
        preSelected: null,
        banner: null,
        modelCalled: false,
        refusal: null,
        declined: null,
        attribution: { ...EMPTY_ATTRIBUTION, ordering: 'crosswalk' },
      };
    }
  }

  // --- Stage 2: deterministic retrieval over THIS revision's own rows ----------
  const scored = scoreCandidates(titleNorm, input.classifications);
  const slice = candidateSlice(scored);

  if (slice.length === 0) {
    // L-F by the floor route. The picker is the full list, searchable, because
    // "no candidate scored" is a statement about our retriever and not about the
    // determination — and an unparsed or oddly-worded row must still be choosable.
    return finishBlocked({
      level: 'L_F',
      input,
      titleNorm,
      ordered: [],
      scored,
      exact: undefined,
      attribution: EMPTY_ATTRIBUTION,
      modelCalled: false,
    });
  }

  const exact = soleExactMatch(slice);

  // --- Stage 1: the cross-tenant aggregate. ORDERING ONLY. ---------------------
  let ordering: CandidateOrdering | null = null;
  if (deps.db !== undefined && input.account !== undefined && exact === undefined) {
    ordering = await readAggregateOrdering(
      deps.db,
      {
        titleNorm,
        stateCode: input.pin.stateCode,
        constructionType: input.pin.constructionType,
      },
      slice,
    );
  }
  const ordered = applyOrdering(slice, ordering);

  if (exact !== undefined) {
    // L-C1. THE ONLY LEVEL AT WHICH A RADIO ARRIVES FILLED, and the only input
    // entitled to fill it is this determination's own federal text.
    return finishBlocked({
      level: 'L_C1',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: EMPTY_ATTRIBUTION,
      modelCalled: false,
      preSelected: exact.classificationId,
    });
  }

  if (ordering !== null) {
    // L-B. Ordering came from the aggregate; nothing is pre-selected, nothing is
    // annotated, and no count appears beside any candidate.
    return finishBlocked({
      level: 'L_B',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: { ...EMPTY_ATTRIBUTION, ordering: 'aggregate_ordered' },
      modelCalled: false,
    });
  }

  if (skipsModelCall(ordered)) {
    // L-C2. Above the band, below exact: the model is not called and NOTHING is
    // pre-selected, because a 0.93 token overlap between "CEMENT MASON" and
    // "CEMENT MASON/CONCRETE FINISHER" is a good guess and a filled radio is an
    // endorsement.
    return finishBlocked({
      level: 'L_C2',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: EMPTY_ATTRIBUTION,
      modelCalled: false,
    });
  }

  // --- Stage 3: the model. Zero calls on the free tier, by construction. --------
  const mayCallModel =
    input.tier === 'paid' &&
    deps.transport !== undefined &&
    deps.modelId !== undefined &&
    input.modelBudgetExhausted !== true;

  if (!mayCallModel) {
    return finishBlocked({
      level: 'L_E',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: {
        ...EMPTY_ATTRIBUTION,
        rejection: input.modelBudgetExhausted === true ? 'budget_exhausted' : null,
      },
      modelCalled: false,
    });
  }

  const request = await buildRequest(deps, input, titleNorm, ordered);
  const transportResult = await (deps.transport as RankerTransport).send(request);
  const usage = transportResult.ok ? transportResult.usage : (transportResult.usage ?? null);
  const baseAttribution: RankAttribution = {
    rankerVersion: request.rankerVersion,
    ordering: 'deterministic',
    modelId: request.model,
    promptBundleHash: request.bundleHash,
    usage,
    cacheReadZero: usage !== null && usage.cacheReadInputTokens === 0,
    rejection: null,
  };

  if (!transportResult.ok) {
    const rejection: RankRejection =
      transportResult.reason === 'refusal'
        ? 'transport_refusal'
        : transportResult.reason === 'max_tokens'
          ? 'transport_max_tokens'
          : transportResult.reason === 'malformed'
            ? 'transport_malformed'
            : 'transport_unreachable';
    return finishBlocked({
      level: 'L_E',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: { ...baseAttribution, rejection },
      modelCalled: true,
    });
  }

  const verdict = validateRankResponse(transportResult.json, {
    candidates: ordered.map((candidate) => candidate.classificationId),
    titleNorm,
  });

  if (verdict.kind === 'declined') {
    // The model said none of these fit. That is the useful signal a forced rank
    // destroys, and it routes to the conformance path rather than to a guess.
    return finishBlocked({
      level: 'L_F',
      input,
      titleNorm,
      ordered: [],
      scored,
      exact: undefined,
      attribution: baseAttribution,
      modelCalled: true,
    });
  }

  if (verdict.kind === 'rejected') {
    return finishBlocked({
      level: 'L_E',
      input,
      titleNorm,
      ordered,
      scored,
      exact,
      attribution: { ...baseAttribution, rejection: verdict.reason },
      modelCalled: true,
    });
  }

  // L-D. The model's accepted output is an ORDERING — the same type the aggregate
  // returns, through the same function — so it cannot pre-select, cannot shorten
  // the list and cannot name a row that is not on this revision.
  const modelOrdered = applyOrdering(ordered, orderingOf(verdict.ranked));
  return finishBlocked({
    level: 'L_D',
    input,
    titleNorm,
    ordered: modelOrdered,
    scored,
    exact,
    attribution: { ...baseAttribution, ordering: 'llm_ranked' },
    modelCalled: true,
  });
}

async function buildRequest(
  deps: ResolveDeps,
  input: ResolveInput,
  titleNorm: TitleNorm,
  ordered: readonly LexicalCandidate[],
): Promise<RankRequest> {
  const priorOrdinals =
    deps.db !== undefined && input.account !== undefined
      ? await ownPriorOrdinals(
          deps.db,
          { account: input.account, wdNumber: input.pin.wdNumber },
          input.classifications,
        )
      : [];

  return buildRankRequest(
    {
      slice: {
        wdNumber: input.pin.wdNumber,
        revision: input.pin.revision,
        publishDate: input.pin.publishDate,
        snapshotRef: input.pin.snapshotRef,
        classifications: input.classifications,
      },
      rawTitle: input.rawTitle,
      titleNorm,
      candidates: ordered.map((candidate) => candidate.classification),
      ownPriorOrdinals: priorOrdinals,
    },
    { model: deps.modelId as string },
  );
}

function finishBlocked(args: {
  readonly level: ClassificationLevel;
  readonly input: ResolveInput;
  readonly titleNorm: TitleNorm;
  /** The retriever's slice, in display order. */
  readonly ordered: readonly LexicalCandidate[];
  /** Every parsed row of the revision, scored. */
  readonly scored: readonly LexicalCandidate[];
  readonly exact: LexicalCandidate | undefined;
  readonly attribution: RankAttribution;
  readonly modelCalled: boolean;
  readonly preSelected?: ClassificationId;
}): ClassificationOutcome {
  const all = fullList(args.ordered, args.scored);
  const picker = pickerFor(args.level, all, args.ordered, args.exact);
  const preSelected = args.preSelected ?? null;
  const refusal = blockedRefusal({
    level: args.level,
    lineId: args.input.lineId,
    rawTitle: args.input.rawTitle,
    pin: args.input.pin,
    picker,
    preSelected,
  });
  return {
    level: args.level,
    lineId: args.input.lineId,
    rawTitle: args.input.rawTitle,
    titleNorm: args.titleNorm,
    resolved: null,
    candidates: all,
    picker,
    preSelected,
    banner: CLASSIFICATION_LADDER[args.level].banner,
    modelCalled: args.modelCalled,
    refusal,
    declined:
      args.level === 'L_F'
        ? conformanceDeclined({
            rawTitle: args.input.rawTitle,
            titleNorm: args.titleNorm,
            pin: args.input.pin,
            classCount: args.input.classifications.length,
          })
        : null,
    attribution: args.attribution,
  };
}

// ===========================================================================
// The click
// ===========================================================================

/** 1-based position in the offered top three, or `null` when the customer went
 *  past it into the full list — the row §7.3 calls the most informative in the
 *  table, because it is the one the ranker got wrong. */
export function rankOfChoice(
  outcome: ClassificationOutcome,
  chosen: ClassificationId,
): number | null {
  const index = outcome.picker.findIndex((candidate) => candidate.classificationId === chosen);
  return index >= 0 && index < PICKER_TOP_N ? index + 1 : null;
}

export interface ConfirmChoiceInput {
  readonly account: AccountId;
  readonly userId: string;
  readonly chosen: ClassificationId;
  readonly revision: number;
  readonly corpusSnapshotRef?: string;
}

/**
 * The click, and everything that follows from it: the line resolves, the crosswalk
 * remembers, and this account never sees this question for this title again.
 *
 * The chosen id must be one of the candidates this outcome offered — including the
 * full list behind "None of these" — so a confirmation cannot name a classification
 * that is not on the pinned revision. That is the same closed-set property the
 * model's response schema has, applied to the customer's click.
 */
export async function confirmChoice(
  tx: Tx,
  outcome: ClassificationOutcome,
  input: ConfirmChoiceInput,
): Promise<{ readonly observationId: number; readonly chosen: Classification }> {
  const candidate = outcome.candidates.find((row) => row.classificationId === input.chosen);
  if (candidate === undefined) {
    throw new Error(
      'confirmChoice: the chosen classification was not among the candidates offered for ' +
        'this line. A confirmation may only name a row of the pinned revision.',
    );
  }
  const source: OfferedCandidate['source'] =
    outcome.attribution.ordering === 'llm_ranked'
      ? 'llm_ranked'
      : outcome.attribution.ordering === 'aggregate_ordered'
        ? 'aggregate_ordered'
        : 'deterministic';

  const observationId = await recordConfirmation(tx, {
    account: input.account,
    userId: input.userId,
    wdNumber: candidate.classification.wdNumber,
    revision: input.revision,
    rawTitle: outcome.rawTitle,
    titleNorm: outcome.titleNorm,
    chosen: candidate.classification,
    offered: offeredFrom(outcome.picker, source),
    chosenRank: rankOfChoice(outcome, input.chosen),
    resolvedAtLevel: outcome.level,
    llmUsed: outcome.modelCalled,
    rankerVersion: outcome.attribution.rankerVersion,
    ...(outcome.attribution.modelId !== null ? { modelId: outcome.attribution.modelId } : {}),
    ...(outcome.attribution.promptBundleHash !== null
      ? { promptBundleHash: outcome.attribution.promptBundleHash }
      : {}),
    ...(input.corpusSnapshotRef !== undefined
      ? { corpusSnapshotRef: input.corpusSnapshotRef }
      : {}),
  });

  return { observationId, chosen: candidate.classification };
}
