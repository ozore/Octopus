/**
 * The knowledge base's public surface.
 *
 * WL-00, WL-02, WL-03 and WL-04 import from HERE and from nowhere deeper. The
 * SAM adapters, the parser and the ingest transaction are implementation: an
 * app page that reached past this barrel to `sam.live.ts` would be one page
 * that can hit the network at request time, and "reads the corpus, never the
 * network" would stop being true.
 */

export * from './job-kinds';
export * from './lookup';
export {
  CORPUS_STALE_DAYS,
  GateFailure,
  PARSE_COVERAGE_FLOOR,
  corpusIsStale,
} from './gates';
export { PARSER_VERSION, parseDetermination, normaliseLabel, toIsoDate } from './parser';
export { publicDeterminationUrl, SAM_PUBLIC_SEARCH_URL } from './sam-endpoints';
export { normaliseWdNumber, SamNotFoundError, type SamAdapter } from './sam';
export { getSamAdapter, isMockSam, setSamAdapter } from './adapter';
export {
  fetchHistory,
  ingestCounties,
  ingestDetermination,
  refreshIndex,
  slugify,
  type IngestDeterminationResult,
  type IndexRefreshResult,
} from './ingest';
export { registerKbJobs, kbJobContext, type KbJobContext } from './jobs';
export { seedCorpusFromFixtures, type SeedResult } from './seed';
