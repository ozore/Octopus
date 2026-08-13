/**
 * CORPUS TYPES — the shapes that cross the ingest boundary.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §0.2 (the four paths), §2 (the upstream), §9 (the
 * promotion state machine), §10 (probes).
 *
 * WHY THESE ARE NOT `Result<T>`. `src/lib/result.ts` states the rule: a failure a
 * customer can SEE is a `Refusal`; a failure a customer cannot see is a thrown
 * `Error`. An ingest gate is neither — it is a DATA STATE (invariant 4). A held
 * snapshot is not shown to anybody: it advances the freshness clock, and the clock
 * is what eventually produces a P-C banner in `ladder.ts`. So gate outcomes are
 * discriminated records that get written to `probe_run` and `corpus_snapshot`, and
 * the only `Refusal` this whole subsystem constructs is the dated narrowing.
 */

import type { IsoDate, Sha256Hex, WdNumber } from '@/lib/types';

// ===========================================================================
// Transport — §0.2's four paths
// ===========================================================================

/** 'A' index · 'B' document · 'C' archive. 'D' is not a transport: it is the text
 *  inside B and C, authored by WHD (§0.2). It therefore never appears here. */
export type IngestPath = 'A' | 'B' | 'C';

export interface HttpRequest {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface HttpResponse {
  readonly url: string;
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly bytes: Uint8Array;
}

/**
 * The port. Every upstream read in this subsystem goes through it, which is what
 * lets the whole test suite run with `globalThis.fetch` throwing (vitest.setup.ts)
 * — a recorded fetcher is injected instead. Redirects are NOT followed by the
 * port: path C's 303 carries the S3 URL we have to record, so the client follows
 * it explicitly (§2.3).
 */
export type HttpFetcher = (request: HttpRequest) => Promise<HttpResponse>;

/**
 * A response body, hashed, ready for `wd_blob`. Every fetch produces one — "every
 * response body hashed and stored" is not a policy the ingest job remembers, it is
 * the only return type the client has.
 */
export interface FetchedBlob {
  readonly path: IngestPath;
  readonly sourceUrl: string;
  readonly httpStatus: number;
  readonly mediaType: 'application/hal+json' | 'text/plain';
  readonly bytes: Uint8Array;
  readonly byteLength: number;
  readonly sha256: Sha256Hex;
  readonly responseHeaders: Readonly<Record<string, string>>;
  readonly fetchedAt: Date;
}

// ===========================================================================
// Path A — the DBRA search index
// ===========================================================================

export interface IndexCounty {
  readonly code: number;
  readonly value: string;
}

/**
 * One record per WD NUMBER, never per revision (**C2**). `revisionNumber` is the
 * high-water mark, so paginating this to exhaustion tells you which WDs exist and
 * how many revisions each reached, and never hands you revision 3 of anything.
 *
 * Field presence is not uniform: on the 4,236 active records `publishDate`,
 * `modifiedDate` and `location` are present on all of them; on a 10,000-record
 * archived sample the dates are present on 59.7% and `location` on 69.8%. Every
 * optional here is an optional that has been measured absent.
 */
export interface IndexRecord {
  readonly wdNumber: WdNumber;
  readonly revisionNumber: number;
  readonly isActive: boolean;
  /** Advisory, and constant `true` across 4,236 of 4,236 active records. Stored,
   *  never read for a decision, never surfaced (**C5**). */
  readonly isStandard: boolean | null;
  readonly publishDate: IsoDate | null;
  readonly modifiedDate: IsoDate | null;
  readonly indexedDate: string | null;
  readonly shortReferenceNumber: string | null;
  readonly year: number | null;
  readonly constructionTypes: readonly string[];
  readonly stateCode: string | null;
  readonly counties: readonly IndexCounty[];
  /** Four abbreviated spellings per WD. The only customer-facing part of path A:
   *  a GC's flow-down letter routinely says "VA-195". */
  readonly aliases: readonly string[];
  /** The date-stamped Elasticsearch alias, probe 2's whole input. */
  readonly indexAlias: string | null;
}

export interface IndexEnvelope {
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly number: number;
  readonly maxAllowedRecords: number;
}

export interface IndexResponse {
  readonly records: readonly IndexRecord[];
  readonly page: IndexEnvelope;
}

// ===========================================================================
// Path B — the per-WD document endpoint
// ===========================================================================

export interface DocumentLocationMapping {
  readonly state: string;
  readonly counties: readonly number[];
  readonly statewideFlag: boolean;
}

export interface DocumentRecord {
  readonly wdNumber: WdNumber;
  readonly revisionNumber: number;
  readonly publishDate: IsoDate;
  readonly active: boolean;
  /** Advisory, constant `false` on every record ever fetched (**C5**). */
  readonly standard: boolean | null;
  readonly shortName: string | null;
  readonly year: number | null;
  readonly constructionTypes: readonly string[];
  /** Empty on EVERY superseded revision — `"mapping": []`. County scope for a
   *  historical revision exists only in the prose (§6.1). */
  readonly locationMapping: readonly DocumentLocationMapping[];
  /** The determination text, canonicalised (§2.3). */
  readonly canonicalText: string;
  readonly canonicalSha256: Sha256Hex;
  readonly canonicalLength: number;
}

// ===========================================================================
// Path D — the determination's own provenance block
// ===========================================================================

export interface ModTableRow {
  readonly modification: number;
  readonly publicationDate: IsoDate;
}

/**
 * A CONTIGUOUS SUFFIX of `0…revision` ending exactly at `revision`. NOT
 * `revision + 1` rows: WHD omits modification 0 on 17.0% of a 200-WD live sample
 * (**C6**), and both checked-in regression fixtures show it — `LA20260005` r2
 * prints rows 1–2, `DC20260001` r5 prints rows 3–5.
 */
export interface ModTable {
  readonly rows: readonly ModTableRow[];
  readonly first: number;
  readonly last: number;
  readonly count: number;
}

export interface DeterminationHeader {
  readonly wdNumber: WdNumber;
  readonly headerDate: IsoDate;
  readonly stateName: string | null;
  readonly constructionTypes: readonly string[];
}

export type IdentifierKindName =
  | 'union'
  | 'union_average'
  | 'survey'
  | 'state_adopted'
  | 'supplemental'
  | 'unrecognised';

export type FringeTreatmentName =
  | 'wd_aggregate'
  | 'wd_aggregate_cba_schedule_unpublished'
  | 'wd_aggregate_state_adopted'
  | 'unresolved';

export interface ParsedClassification {
  readonly ordinal: number;
  readonly rateIdentifier: string;
  readonly identifierKind: IdentifierKindName;
  readonly identifierDate: IsoDate | null;
  readonly className: string;
  readonly classNameRaw: string;
  readonly classNameNorm: string;
  /** MilliRate — ten-thousandths of a dollar, integer. Never a float, never a
   *  `numeric` that arrives as a string and becomes one. */
  readonly baseRateMilli: number;
  readonly fringeRateMilli: number;
  readonly fringeTreatment: FringeTreatmentName;
  readonly sourceLineStart: number;
  readonly sourceLineEnd: number;
  readonly wrapped: boolean;
}

/** Every line the parser could not turn into a classification, with its reason.
 *  U4: a silently dropped classification is how a wrong rate reaches a signed
 *  form, so nothing is dropped — it is written down. */
export interface ParseResidue {
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly rawText: string;
  readonly reason:
    | 'buffer_overflow'
    | 'no_identifier'
    | 'rate_pattern_ambiguous'
    | 'name_too_short'
    | 'unterminated_name'
    /**
     * TWO ROWS, ONE NAME, ONE IDENTIFIER, DIFFERENT RATES. Measured on
     * `DC20260001` r5, which prints
     *
     *   LABORERS:.........$ 51.82   8.70
     *   LABORERS:.........$ 44.04   8.70
     *
     * consecutively under `LABO0011-006`. `wdc_class_unique` — the unique index on
     * `(wd_number, revision, parser_version, class_name_norm, rate_identifier)` —
     * forbids the pair, so the determination cannot be written as parsed.
     *
     * The ambiguity is the PUBLISHER'S, not the parser's: a contractor asking what
     * `LABORERS:` pays under `LABO0011-006` has no deterministic answer, and
     * picking one is exactly the kind of silent selection this product refuses. So
     * both rows are recorded here, neither is published, the other 73
     * classifications promote normally, and a payroll line resolving to that title
     * finds no candidate and blocks (P-A / F18).
     */
    | 'ambiguous_duplicate_class';
}

export interface CountyScopeEntry {
  readonly countyName: string;
  readonly countyNameNorm: string;
  /** Parsed from the prose asterisk, never stripped: Virginia's independent cities
   *  are not inside the counties they adjoin (§6.1 rule 4). */
  readonly independentCity: boolean;
}

export type CountyScope =
  | { readonly kind: 'counties'; readonly stateName: string; readonly counties: readonly CountyScopeEntry[] }
  | { readonly kind: 'statewide'; readonly stateName: string }
  /** §6.1's last rule: an unclean prose parse leaves the WD's scope unresolved and
   *  out of the lookup index. It does NOT fall back to a structured array we have
   *  measured to be wrong on 5.5% of records. */
  | { readonly kind: 'unresolved'; readonly reason: string };

export interface ParsedDetermination {
  readonly header: DeterminationHeader;
  readonly modTable: ModTable;
  readonly classifications: readonly ParsedClassification[];
  readonly residue: readonly ParseResidue[];
  readonly countyScope: CountyScope;
}

// ===========================================================================
// Reconciliation — §9.5
// ===========================================================================

export type BlockingField = 'revision_number' | 'publish_date' | 'active_flag';

export type AdvisoryField =
  | 'standard'
  | 'county_code'
  | 'county_name'
  | 'construction_types'
  | 'state_code'
  | 'location_description'
  /**
   * MEASURED 2026-08-13, NOT IN THE SPECIFICATION. On a SUPERSEDED revision, path
   * B's `publishDate` is not the revision's publication date — it is its LAST DAY
   * OF EFFECT. `VA20260195` r0 answers `publishDate: 2026-05-17` while its own
   * header says `01/02/2026`, and revision 1 published 2026-05-18. The two fields
   * are different quantities on a superseded revision, so comparing them is not a
   * disagreement; it is a category error. Recorded, never blocking. See
   * `reconcile.ts`.
   */
  | 'publish_date_b_semantics';

export interface VarianceRecord {
  readonly field: BlockingField | AdvisoryField;
  readonly valuePathA: string | null;
  readonly valuePathB: string | null;
  readonly valuePathC: string | null;
  readonly valuePathD: string | null;
  readonly detail: Readonly<Record<string, unknown>>;
}

export type AgreementStateName = 'agreed' | 'advisory_variance' | 'blocking_variance' | 'single_path';

/** Tier 0 and tier 2 quarantine ONE determination; tier 1 holds the SNAPSHOT.
 *  Getting that distinction wrong is how a flag we never read halts the corpus. */
export type QuarantineReason =
  | 'identity_mismatch'
  | 'canon_mismatch'
  | 'modtable_invalid'
  | 'parse_rule_breach'
  | 'document_missing';

export interface ReconcileVerdict {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly agreement: AgreementStateName;
  readonly blocking: readonly VarianceRecord[];
  readonly advisory: readonly VarianceRecord[];
  readonly quarantine: QuarantineReason | null;
  readonly detail: string | null;
}

// ===========================================================================
// Probes — §10
// ===========================================================================

export type ProbeName = 'count' | 'alias' | 'content_hash' | 'publisher_revision';
export type ProbeResultName = 'pass' | 'warn' | 'fail' | 'freeze';

export interface ProbeOutcome {
  readonly probe: ProbeName;
  readonly result: ProbeResultName;
  readonly observed: Readonly<Record<string, unknown>>;
  readonly expected: Readonly<Record<string, unknown>>;
  readonly deltaPct: number | null;
  readonly detail: string;
}

// ===========================================================================
// Snapshot — §8, §9
// ===========================================================================

export type SnapshotStateName =
  | 'open'
  | 'indexed'
  | 'fetched'
  | 'parsed'
  | 'reconciled'
  | 'canaried'
  | 'promoted'
  | 'held'
  | 'superseded'
  | 'rolled_back';

export interface SnapshotLeaf {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly canonicalSha256: Sha256Hex;
}

export interface MerkleTree {
  readonly root: Sha256Hex;
  readonly leafCount: number;
  readonly leafHashes: readonly Sha256Hex[];
}

export interface InclusionProof {
  readonly leafIndex: number;
  readonly leafHash: Sha256Hex;
  readonly siblings: readonly Sha256Hex[];
  readonly root: Sha256Hex;
}

/**
 * G1's gate, as a port. The golden payroll suite is owned by the engine, not by
 * the corpus — but promotion cannot proceed without its verdict, and
 * `snap_promoted_complete` refuses a promoted row whose `golden_suite_pass` is not
 * TRUE. Injecting it keeps `promotion.ts` free of an import into `engine/**`.
 */
export interface CanaryVerdict {
  readonly pass: boolean;
  readonly lines: number;
  readonly detail: string;
}

export type CanaryRunner = () => Promise<CanaryVerdict>;
