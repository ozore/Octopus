/**
 * THE ARTIFACT WRITERS' PUBLIC SURFACE. These artifacts ARE the product.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.5 (what we emit), ADR-008 (own geometry),
 * ADR-009 (the pinned XSD, failing closed), ADR-012 (two layouts),
 * `USER_JOURNEY.md` §7 (generation, preview, the provenance footer) and §10 (the
 * California export), `DESIGN_SYSTEM.md` §8.8–§8.9.
 *
 * ===========================================================================
 * WHAT A CALLER DOES
 *
 *   const artifact = projectWh347({ layout, computation, verdict, provenance, … });
 *   const pdf      = renderWh347Pdf(artifact);                 // Uint8Array
 *   const xml      = renderEcprXml({ …, observation, pinnedSha256 });  // Result
 *
 * Three calls, no I/O, no clock, no model. The renderer formats; it never computes,
 * never derives a status and never authors a refusal. Everything it prints either
 * arrives on the struct or comes from `formtext.ts` with a citation attached.
 *
 * ===========================================================================
 * THE TWO PROPERTIES THIS MODULE EXISTS TO GUARANTEE
 *
 * 1. NINE DIGITS CANNOT REACH THE FEDERAL FORM. `IdentifyingNumber` has one
 *    constructor and it rejects anything that is not exactly four digits; the
 *    WH-347 render model has no field of any other identity type. `Ssn9` is
 *    accepted by exactly one function in the codebase, and it lives in `ecpr/`.
 *
 * 2. A SCHEMA CHANGE BLOCKS THE XML AND ONLY THE XML. `checkXsdPin` runs before the
 *    document is built, returns a P-B refusal carrying the diff, and has no reach
 *    into the PDF path at all — `CORPUS_LADDER.L4_XML_BLOCKED` is the only ladder
 *    row with `blocksEcprGeneration: true`, and `blocksFilingOnPinnedProject` is
 *    `false` on every row without exception.
 *
 * ===========================================================================
 * THE FREE GENERATOR'S ARTIFACT IS NOT BUILT HERE, AND MUST NOT BE FORGED
 *
 * `projectWh347` takes an `ArtifactProvenance`, which carries a pin — a revision of
 * record, a snapshot, a Merkle leaf. The anonymous `/wh347` generator (D3, J1) has
 * none of those: `src/lib/types.ts`'s `EphemeralProvenance` carries all five corpus
 * values and NO PIN, "and there is no field here in which a pin could be forged."
 *
 * There is deliberately no adapter in this module from the second shape to the
 * first. Writing one would mean inventing a `snapshotRef`, a `merkleRoot` and a
 * `revisionPinned` for a visitor who has no project — which is precisely the forgery
 * the type split exists to prevent, and it would put a pinned-looking provenance
 * block on a document that is not certifiable. The free route needs its own
 * projection over `EphemeralProvenance`, and it is not written yet.
 */

// ---------------------------------------------------------------------------
// Identity — the collision between 29 CFR 5.5(a)(3)(ii)(B) and California's schema
// ---------------------------------------------------------------------------
export {
  IdentityError,
  identifyingNumber,
  last4Of,
  nineDigitRuns,
  ssn9,
  type IdentifyingNumber,
  type Ssn9,
} from './identity';

// ---------------------------------------------------------------------------
// The provenance footer — every artifact, every page, every tier
// ---------------------------------------------------------------------------
export {
  BOUNDARY_STATEMENT,
  BOUNDARY_STATEMENT_FULL,
  formatTimestamp,
  provenanceFooterLines,
  shortHash,
  type FooterEmphasis,
  type FooterInput,
  type FooterLine,
  type FooterLineId,
} from './provenance';

// ---------------------------------------------------------------------------
// WH-347
// ---------------------------------------------------------------------------
export {
  hoursCell,
  hoursTotal,
  money,
  projectWh347,
  rateCell,
  weekDates,
  type Wh347HeaderInput,
  type Wh347ProjectionInput,
  type Wh347WorkerIdentity,
} from './wh347/project';

export {
  renderWh347,
  renderWh347Pdf,
  geometryFor,
  type Wh347RenderResult,
} from './wh347/render';

export {
  wh347Fields,
  type ArtifactFieldMap,
  type Wh347Artifact,
  type Wh347DayCell,
  type Wh347DeductionCell,
  type Wh347Header,
  type Wh347LineRow,
  type Wh347StatementOfCompliance,
  type Wh347WorkerBlock,
} from './wh347/model';

export {
  WH347_GEOMETRY,
  WH347_LEGACY,
  WH347_REV_2025_01,
  columnBoxes,
  lineHeight,
  rowsPerPage,
  type ColumnSpec,
  type LayoutGeometry,
  type Wh347ColumnId,
} from './wh347/geometry';

export {
  COMPLIANCE_BOXES,
  WATERMARK_TEXT,
  WITHHELD_BODY,
  WITHHELD_HEADLINE,
  bandText,
  type ComplianceBox,
} from './wh347/formtext';

// ---------------------------------------------------------------------------
// California eCPR
// ---------------------------------------------------------------------------
export {
  GENERATED_NOT_ACCEPTANCE_TESTED,
  ecprFooter,
  renderEcprXml,
  type EcprArtifact,
  type EcprRenderInput,
  type IneligibilityReason,
  type IneligibleWorker,
} from './ecpr/render';

export {
  type CaLicenseType,
  type EcprContractor,
  type EcprDeductionSplit,
  type EcprInput,
  type EcprProject,
  type EcprWorkerIdentity,
} from './ecpr/model';

export {
  CPR_XSD_TEXT,
  DIR_PUBLISHED_XSD_BYTES,
  DIR_PUBLISHED_XSD_SHA256,
  SCHEMA_CONSTRAINTS,
  SHIPPED_XSD_SHA256,
  checkXsdPin,
  constraintsEnforced,
  schemaDiff,
  type SchemaConstraints,
  type XsdObservation,
  type XsdPin,
} from './ecpr/schema';

export { validateEcpr, type SchemaViolation, type ValidationResult } from './ecpr/validate';

export {
  childrenNamed,
  firstChild,
  serializeXml,
  type XmlElement,
} from './ecpr/xml';

// ---------------------------------------------------------------------------
// The PDF primitives — exported for tests and for any future artifact that needs
// the same determinism guarantees, not because a caller should be composing pages
// by hand.
// ---------------------------------------------------------------------------
export { PdfPage, rgb, serializePdf, type PdfMeta, type Rgb } from './pdf/writer';
export {
  encodeWinAnsi,
  measureText,
  truncateToWidth,
  wrapToWidth,
  type FontId,
} from './pdf/font';
