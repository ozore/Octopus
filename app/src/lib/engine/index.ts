/**
 * The LLM engine — classify → retrieve → draft → critique.
 *
 * Spec: LLM_ENGINE.md (binding), ARCHITECTURE.md ADR-002/003/004, ADR-101,
 * ADR-102.
 *
 * Two things a caller must know and cannot see from the exports:
 *
 *  - The engine never imports a vendor SDK. It talks to `AnthropicAdapter` only,
 *    which is what lets the entire test suite run with no network and no API
 *    key. `ADAPTER_MODE=mock` binds the fakes at the composition root.
 *
 *  - `runPipeline` returns a `RenderableDraft` — a branded type that can only be
 *    produced by `assertRenderableDraft`. The UI's policy-reference slot accepts
 *    `CitedClause[]`, never strings. That is ADR-004's invariant expressed as a
 *    type, so a future renderer cannot opt out of it by accident.
 */

export { engineConfigFromEnv } from './config';
export type { EngineConfig, EngineConfigOverrides, EngineStage } from './config';

export {
  CLASSIFICATION_SCHEMA,
  CRITIQUE_SCHEMA,
  ClassificationResponseWire,
  CritiqueResponseWire,
  computeReadinessScore,
  toClassificationResponse,
  toCritiqueCriteria,
} from './contracts';

export { adaptCorpusModule, loadCorpusProvider } from './corpus-port';
export type { CorpusProvider } from './corpus-port';

export { createDeps, PrefixWitness } from './deps';
export type { EngineDeps, EngineDepsInput } from './deps';

export { CitationInvariantError, CorpusIntegrityError, EngineError } from './errors';
export type { EngineFailure } from './errors';

export { CollectingEventSink, noopEventSink } from './events';
export type { EngineEvent, EngineEventSink } from './events';

export { applyThreshold, classify, isVerbatim, noticeDocumentId } from './classify';
export type { ClassifyResult } from './classify';

export { assertSliceIntegrity, retrieve } from './retrieve';

export {
  DraftParseError,
  draftPlainText,
  generateDraft,
  parseDraftSections,
  planDraftDocuments,
  renderClauseBlock,
  sanitiseBlocks,
} from './draft';
export type { Classified, DraftArgs, DraftPlan } from './draft';

export {
  POLICY_SHAPED_PATTERNS,
  assertRenderableDraft,
  blockHasAllowlistedCitation,
  buildCitationAllowlist,
  extractCitedClauses,
  findPolicyShapedSpans,
  paragraphIsBackedByCitation,
  renderPolicyReferences,
  resolveCitedClause,
  stripUncitedPolicySpans,
} from './citation-gate';
export type { CitationAllowlist, RenderableDraft } from './citation-gate';

export { buildCritiqueRequest, critiqueDraft } from './critique';

export {
  SECTION_SENTINELS,
  SENTINEL_ORDER,
  buildClassifyPrefix,
  buildCritiquePrefix,
  buildDraftPrefix,
  serializeTaxonomy,
} from './prompts';

export { createEngine, runPipeline } from './pipeline';
export type { Engine, EngineRunResult } from './pipeline';
