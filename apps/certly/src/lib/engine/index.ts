/**
 * M5 — the comparison engine's public surface.
 *
 * Nothing outside `src/lib/engine/` may import a file from inside it directly:
 * the barrel is what keeps the engine's boundary visible, and the boundary is
 * what keeps the "pure, no I/O, no model call" invariant checkable
 * (`tests/engine/purity.test.ts` reads these files and fails on a forbidden
 * import).
 */

export { ENGINE_VERSION, EXPIRING_WINDOW_DAYS, compare, daysBetween, orgToday } from './compare';
export { displayForm, formMatches, matchAny, parseFormNumber, type FormNumber } from './forms';
export { formatMoney, parseMoney, type ParsedMoney } from './money';
export { holderName, matchHolder, matchName, normaliseName, stateFromAddress } from './names';
export {
  COVERAGE_PROSE,
  ENDORSEMENT_COLUMN,
  ENDORSEMENT_PROSE,
  LIMIT_PROSE,
  formatDate,
  limitSubject,
} from './prose';
export type {
  BoolField,
  CoiExtraction,
  CompareInput,
  ComparisonResult,
  Coverage,
  CoverageLimit,
  CoverageType,
  DateField,
  DocumentKind,
  EndorsementKey,
  EndorsementMention,
  EvidencePointer,
  FormEdition,
  Insurer,
  LimitLabel,
  MoneyField,
  OrgIdentity,
  Requirement,
  RequirementCondition,
  RequirementKind,
  RequirementSet,
  ResultRow,
  StringField,
  VendorIdentity,
} from './types';
export {
  COVERAGE_TYPES,
  DOCUMENT_KINDS,
  ENDORSEMENT_KEYS,
  FORM_EDITIONS,
  LIMIT_LABELS,
  REQUIREMENT_KINDS,
} from './types';
