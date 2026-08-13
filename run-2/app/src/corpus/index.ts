/**
 * THE CORPUS — public surface.
 *
 * AUTHORITY: `CORPUS_DESIGN.md`, which owns "what is in the corpus and how it got
 * there". `ARCHITECTURE.md` owns "what the product does with the corpus" and
 * governs everything this document is silent about.
 *
 * WHAT OTHER MODULES SHOULD IMPORT FROM HERE:
 *
 *   reading rates   `lookupCountyRates`, `classificationsForWd` — the free tier's
 *                   entire algorithm, and the only read path the programmatic
 *                   pages use.
 *   freshness       `freshnessOf`, `ladderLevels`, `corpusBanner`,
 *                   `blocksNewPins`, `suppressesNewRateAssertions`,
 *                   `blocksFilingOnPinnedProject` (constant `false`).
 *   provenance      `buildMerkleTree`, `inclusionProof`, `verifyInclusion`,
 *                   `reproduceFromSnapshot` — the eighteen-month guarantee.
 *   ingest          `runIngest`, `SamClient`, `httpFetcher` — the worker only.
 *   invariants      `assertBlockingSetFrozen`, `assertRegisterConsistent`,
 *                   `BLOCKING_FIELDS` — asserted in CI and at worker boot.
 *
 * WHAT NOTHING SHOULD IMPORT: `store.ts` outside `promotion.ts`. `ARCHITECTURE.md`
 * §3.9 puts `wd_revision` writes behind the promotion transaction, and the
 * append-only triggers are the backstop for when that boundary is crossed anyway.
 */

export {
  canon,
  canonicalise,
  CORPUS_TIME_ZONE,
  dateFromBareIso,
  dateFromEpochMillis,
  dateFromOffsetIso,
  dateFromUsSlash,
  decodeDeterminationBytes,
  decomposeWdNumber,
  hashBytes,
  hashHex,
  normaliseClassName,
  normaliseCountyName,
  normaliseWdNumber,
  sha256OfBytes,
  sha256OfText,
  type CanonicalText,
  type WdIdentity,
} from './canonical';

export {
  classificationsForWd,
  enumerateCountyPages,
  lookupCountyRates,
  refreshCountyClassIndex,
  type CountyClassRate,
  type CountyLookupQuery,
  type CountyPage,
} from './county-index';

export {
  evaluateParseQuarantine,
  extractModTable,
  fringeTreatmentOf,
  identifierKindOf,
  isContiguousSuffix,
  parseClassifications,
  parseCountyScope,
  parseDetermination,
  parseDeterminationHeader,
  PARSER_VERSION,
  residueLineCount,
  splitCountyList,
  validateModTable,
  type DeterminationParse,
} from './determination';

export {
  accruesCredit,
  ageHours,
  blocksBuild,
  blocksEcprGeneration,
  blocksFilingOnPinnedProject,
  blocksNewPins,
  blocksPromotion,
  corpusBanner,
  DATED_HOURS,
  freshnessOf,
  freshnessStateOf,
  ladderLevels,
  lookupPageRenders,
  STALE_HOURS,
  suppressesNewRateAssertions,
  type BannerInput,
  type FreshnessInput,
  type LadderInput,
} from './ladder';

export {
  BASELINE_ACTIVE,
  BASELINE_TOTAL,
  COUNT_DELTA_CEILING,
  dispositionOf,
  probeAlias,
  probeContentHash,
  probeCount,
  probePublisherRevision,
  type ContentHashObservation,
  type ProbeDisposition,
  type PublisherRevisionObservation,
} from './probes';

export { rollbackSnapshot, runIngest, type IngestOptions, type IngestResult } from './promotion';

export {
  ADVISORY_FIELDS,
  assertBlockingSetFrozen,
  BLOCKING_FIELDS,
  BlockingSetError,
  reconcile,
  type ReconcileInput,
} from './reconcile';

export {
  assertRegisterConsistent,
  BLOCKING_PROBE_REGISTER,
  RED_RATE_CEILING_PCT,
  registerRow,
  RegisterError,
  type BlockingPower,
  type RegisterRow,
} from './register';

export {
  ACTIVE_CRAWL_SIZE,
  HAL_JSON,
  httpFetcher,
  MAX_ALLOWED_RECORDS,
  SamClient,
  type ArchiveFetch,
  type DocumentFetch,
  type IndexFetch,
  type SamClientOptions,
} from './sam/client';

export {
  assertSinglePage,
  checkIndexPreconditions,
  parseDocumentResponse,
  parseIndexResponse,
  UpstreamShapeError,
  type IndexPreconditionResult,
} from './sam/parse';

export {
  buildMerkleTree,
  EmptySnapshotError,
  inclusionProof,
  leafHash,
  reproduceFromSnapshot,
  snapshotRefFor,
  sortLeaves,
  verifyInclusion,
  type ReproductionCheck,
} from './snapshot';

export * from './types';
