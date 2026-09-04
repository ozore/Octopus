/**
 * M15's public surface — `specs/15`.
 *
 * `strip`, `report` and `demo` are pure and testable with no database; only
 * `sessions` and `render` touch Postgres or storage.
 */

export {
  STRIPPED_PRODUCER_KEYS,
  STRIPPED_PRODUCER_PATHS,
  carriesProducerContact,
  nullField,
  stripProducerContact,
  type StrippedProducerKey,
} from './strip';

export {
  REVIEW_REASONS,
  SeededExtractor,
  getCoiExtractor,
  setCoiExtractor,
  type CoiExtractor,
  type GapExtractionOutcome,
  type GapExtractionRequest,
  type GapExtractionStatus,
  type ReviewReason,
} from './extraction';

// The pure limits and labels come from `./limits`, which a client component may
// import; the barrel re-exports them for server code that wants one import.
export {
  AUDIENCE_LABEL,
  AUDIENCE_TEMPLATE,
  DOCUMENTS_PER_IP_PER_DAY,
  MAX_DOCUMENTS_PER_SESSION,
  MAX_SESSION_BYTES,
  PURGE_AFTER_DAYS,
  SESSIONS_PER_IP_PER_DAY,
  isAudience,
} from './limits';

export {
  addSessionDocument,
  captureEmail,
  createGapSession,
  findSessionByToken,
  listSessionDocuments,
  sessionsToPurge,
  snapshotFor,
  spendToday,
  type AddDocumentResult,
  type CreateSessionResult,
  type GapDocumentRow,
  type GapSessionRow,
} from './sessions';

export {
  UNCOMPARED_NOTE,
  buildGapReport,
  buildHeadline,
  renderReportText,
  type ComparedVendor,
  type GapReport,
  type ReportDocumentInput,
  type UncomparedDocument,
} from './report';

export {
  purgeGapReports,
  renderGapReport,
  writeGapExtraction,
  type PurgeResult,
  type RenderResult,
} from './render';

export {
  DEMO_EVALUATION_DATE,
  DEMO_SAMPLES,
  DEMO_TEMPLATE_ID,
  cachedDemoReport,
  getDemoSample,
  type DemoSample,
} from './demo';

/**
 * THE RETENTION TERMS, IN BODY TEXT, IN ONE PLACE — `specs/15` §6 and A7c.
 *
 * They render **next to the drop zone, before a file is chosen**, not behind a
 * link and not inside a collapsed element: that is `offer/RESEARCH.md` §7's own
 * condition and it is the thing a stranger is owed before they hand over
 * somebody else's insurance documents. The same sentences appear on the report
 * page and in the email, which is why they are a constant and not three
 * paragraphs that can drift apart.
 */
export const RETENTION_TERMS = [
  'We read these to make your report and then delete them.',
  'The files themselves are deleted the moment the report is built.',
  'The reading and the report are deleted after 7 days.',
  'We never record the agent’s name, phone or email from your certificates.',
  'We never train on them.',
] as const;

export const RETENTION_TERMS_TEXT = RETENTION_TERMS.join(' ');
