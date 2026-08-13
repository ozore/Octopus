/**
 * THE CLASSIFICATION LADDER — public surface.
 *
 * AUTHORITY: `ENGINE.md` §15 and §18 own this module. `USER_JOURNEY.md` §6.3.1's
 * permission table owns what may fill a radio, and `ARCHITECTURE.md` §11.6 (AS-5)
 * owns what the cross-tenant aggregate may do.
 *
 * ===========================================================================
 * WHAT A CALLER USES
 *
 *   resolve      `resolveClassification(deps, input)` -> `ClassificationOutcome`.
 *                One title, one pinned revision, one answer. `outcome.resolved` is
 *                non-null at L-A ONLY; every other level carries a P-A refusal and
 *                the line is blocked until a click.
 *   confirm      `confirmChoice(tx, outcome, { account, userId, chosen, revision })`
 *                — the click. Writes the crosswalk; every later week is L-A.
 *   picker copy  `PICKER_FOOTNOTE`, `CONFORMANCE_PATH`, `CONFORMANCE_RULE`.
 *   transports   `recordedRanker` (the suite's only ranker), `unreachableRanker`,
 *                `forbiddenRanker` (asserts a path makes no model call at all), and
 *                `anthropicRanker` for the one process that is allowed to.
 *   normalization `normalizeTitle` — also the crosswalk key and the L-C1 comparand.
 *
 * ===========================================================================
 * THE THREE INVARIANTS THIS SURFACE EXISTS TO KEEP
 *
 * 1. **Nothing here constructs a `ClassificationId`.** Every id this module returns
 *    arrived on a `Classification` from the mirror read model, so a classification
 *    that is not on the pinned revision is unrepresentable rather than filtered.
 * 2. **`preSelected` is non-null at L-C1 and nowhere else.** `blockedLine()` in
 *    `src/lib/result.ts` throws otherwise, so the rule survives a refactor.
 * 3. **The aggregate and the model have the same power and the same type** —
 *    `CandidateOrdering`, one field, no selection expressible — and both go through
 *    `applyOrdering`, which returns a permutation.
 *
 * ===========================================================================
 * WHAT IS DELIBERATELY NOT HERE
 *
 * No rate arithmetic (`src/engine`), no artifact status (`deriveStatus`), no
 * exception narrative (ENGINE Job 2), no billing check, and no escalation path: a
 * `Refusal` has no field in which a support address could travel, and the only exit
 * from a blocked line is a click on a row of the determination itself (A3).
 */

export {
  ABBREVIATIONS,
  normalizeTitle,
  spanQuotesTitle,
  tokensOf,
  type TitleNorm,
} from './normalize';

export {
  candidateSlice,
  CANDIDATE_SLICE_MAX,
  conceptSet,
  DELTA_LEX_1E4,
  LEXICAL_FLOOR_1E4,
  PICKER_TOP_N,
  scoreCandidates,
  skipsModelCall,
  soleExactMatch,
  TAU_LEX_1E4,
  UNION_GROUP_FACTOR_1E4,
  type LexicalCandidate,
} from './lexical';

export {
  AGGREGATE_K,
  AGGREGATE_MIN_BAND,
  applyOrdering,
  ELIGIBILITY_MIN_DISTINCT_PROJECTS,
  ELIGIBILITY_MIN_RELEASED_FILINGS,
  isAggregateEligible,
  orderingOf,
  readAggregateOrdering,
  type AggregateQuery,
  type CandidateOrdering,
  type Executor,
} from './aggregate';

export {
  lookupCrosswalk,
  memoryResolutionLine,
  offeredFrom,
  ownPriorOrdinals,
  recordConfirmation,
  resolveHit,
  type ConfirmationInput,
  type CrosswalkHit,
  type CrosswalkProvenance,
  type CrosswalkQuery,
  type OfferedCandidate,
} from './crosswalk';

export {
  anthropicRanker,
  forbiddenRanker,
  interpretWireResponse,
  recordedRanker,
  toWireBody,
  unreachableRanker,
  ZERO_USAGE,
  type AnthropicRankerOptions,
  type RankerTransport,
  type RankTransportFailure,
  type RankTransportResult,
  type RankUsage,
  type RecordedRanker,
  type RecordedTurn,
} from './model/client';

export {
  bundleHashOf,
  buildRankRequest,
  cachedPrefixOf,
  chooseCacheLayout,
  clampRawTitle,
  RANKER_SYSTEM_PROMPT,
  RANKER_VERSION,
  RAW_TITLE_MAX,
  serializeTail,
  serializeWdSlice,
  type CacheLayout,
  type PromptBlock,
  type RankPromptInput,
  type RankRequest,
  type WdSliceInput,
} from './model/prompt';

export {
  assertsSomething,
  DO_NOT_ASSERT,
  FORBIDDEN_PROSE,
  RANK_ENUM_K,
  RANK_RESPONSE_SCHEMA,
  RANK_SCHEMA_NAME,
  validateRankResponse,
  type RankConfidence,
  type RankRejection,
  type RankResponse,
  type RankValidationContext,
  type RankVerdict,
} from './model/schema';

export {
  confirmChoice,
  CONFORMANCE_CITATION,
  CONFORMANCE_PATH,
  CONFORMANCE_RULE,
  PICKER_FOOTNOTE,
  rankOfChoice,
  resolveClassification,
  type ClassificationOutcome,
  type ClassifyTier,
  type ConfirmChoiceInput,
  type PinnedRevision,
  type RankAttribution,
  type ResolveDeps,
  type ResolveInput,
} from './ladder';
