/**
 * THE SHARED DOMAIN TYPES — the contract between every module in Ratepin.
 *
 * AUTHORITIES, and which one owns which half:
 *   ENGINE.md        §2 value types · §3 the line and week model · §7.0 the CWHSSA
 *                    coverage gate · §9.1 DeductionCategory · §18.2 the
 *                    classification ladder L-A..L-F
 *   ARCHITECTURE.md  §6.3 the three artifact statuses and their single
 *                    construction path · §6.4 the freshness algebra · §4.5 the
 *                    degradation ladder L0..L5
 *   CORPUS_DESIGN.md §3.3 revisions · §4.3 classifications · §5.5 pin standing ·
 *                    §8.2 artifact provenance
 *   USER_JOURNEY.md  §0.3 the four refusal primitives P-A..P-D
 *
 * Two things this file is deliberately doing.
 *
 * 1. IT MAKES THE WRONG STATE UNREPRESENTABLE RATHER THAN MERELY DETECTABLE.
 *    `ClassificationId` has one constructor and it lives on the mirror side, so a
 *    classification that is not on the pinned WD revision cannot be typed and
 *    therefore cannot reach the arithmetic (I2). `Refusal` has exactly four
 *    members and none of them has a field in which a support address, a ticket id
 *    or an escalation target could be carried — A3 is enforced by the absence of a
 *    field, not by a code review. `otRate`/`dtRate` are `MilliRate | null` and
 *    null is NOT zero, because "we cannot prove a premium was paid" and "nothing
 *    was paid" are different facts that a `0` would silently merge (P-A).
 *
 * 2. IT IS EXHAUSTIVE ON PURPOSE. The ladders, the block reasons and the refusal
 *    primitives are closed unions with metadata tables beside them, so adding a
 *    case without handling it is a type error rather than a runtime surprise. I7's
 *    "a signal that cannot be routed to one of four automatic responses is not an
 *    alert, it is a counter" only works if the compiler is checking.
 */

import type { Cents, Hours, MilliRate } from './money';

// ===========================================================================
// Primitive brands
// ===========================================================================

/** `YYYY-MM-DD`. Never a `Date`: a filing regenerated eighteen months later in a
 *  different timezone must produce the identical grid (E1, ENGINE §4 A3). */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDate(value: string): IsoDate {
  if (!ISO_DATE_RE.test(value)) throw new TypeError(`not an ISO date: ${JSON.stringify(value)}`);
  return value as IsoDate;
}

/** A 64-character lowercase hex digest. Hashes travel as text at module
 *  boundaries and as `bytea` in the database; this is the text form. */
export type Sha256Hex = string & { readonly __brand: 'Sha256Hex' };

const SHA256_RE = /^[0-9a-f]{64}$/;

export function sha256Hex(value: string): Sha256Hex {
  const lower = value.toLowerCase();
  if (!SHA256_RE.test(lower)) throw new TypeError(`not a sha256 hex digest: ${JSON.stringify(value)}`);
  return lower as Sha256Hex;
}

export type AccountRef = string & { readonly __brand: 'AccountRef' };
export type ProjectRef = string & { readonly __brand: 'ProjectRef' };
export type FilingRef = string & { readonly __brand: 'FilingRef' };
/** Opaque inside the engine: an SSN never enters the arithmetic (§11.3). */
export type WorkerRef = string & { readonly __brand: 'WorkerRef' };
export type PinRef = string & { readonly __brand: 'PinRef' };
export type SnapshotRef = string & { readonly __brand: 'SnapshotRef' };

/** Two-letter state, four-digit year, four-digit sequence — `VA20260195`. */
export type WdNumber = string & { readonly __brand: 'WdNumber' };

const WD_NUMBER_RE = /^[A-Z]{2}\d{8}$/;

export function wdNumber(value: string): WdNumber {
  const upper = value.toUpperCase();
  if (!WD_NUMBER_RE.test(upper)) throw new TypeError(`not a WD number: ${JSON.stringify(value)}`);
  return upper as WdNumber;
}

// ===========================================================================
// The corpus: revisions and classifications
// ===========================================================================

export type IdentifierKind =
  | 'union'
  | 'union_average'
  | 'survey'
  | 'state_adopted'
  | 'supplemental'
  | 'unrecognised';

/**
 * CORPUS_DESIGN §4.2. The determination DOES publish an aggregate fringe for
 * union-identified classes; what it does not publish is the CBA SCHEDULE — which
 * plans, at what per-hour cost, with what eligibility. D9 refuses the schedule,
 * not the aggregate: refusing the aggregate would refuse 53.9% of the corpus.
 */
export type FringeTreatment =
  | 'wd_aggregate'
  | 'wd_aggregate_cba_schedule_unpublished'
  | 'wd_aggregate_state_adopted'
  | 'unresolved';

declare const MIRROR_ROW_ONLY: unique symbol;

/**
 * The identity of one classification row on one revision, under one parser
 * generation. Branded with a private symbol so it cannot be built from a string
 * literal anywhere in the codebase: its ONLY constructor is
 * `classificationIdFromMirrorRow`, which the mirror read model calls and nobody
 * else should. That is invariant I2 expressed in the type system rather than in a
 * comment — the model returns `ClassificationId[]`, and a hallucinated class name
 * is not merely rejected, it was never sampleable.
 */
export type ClassificationId = string & { readonly [MIRROR_ROW_ONLY]: 'ClassificationId' };

export interface ClassificationCoordinates {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly parserVersion: number;
  readonly ordinal: number;
}

/** Called by `src/mirror/read` when projecting a row. Not for general use. */
export function classificationIdFromMirrorRow(c: ClassificationCoordinates): ClassificationId {
  return `${c.wdNumber}:${c.revision}:${c.parserVersion}:${c.ordinal}` as ClassificationId;
}

export function parseClassificationId(id: ClassificationId): ClassificationCoordinates {
  const [wd, revision, parserVersion, ordinal] = id.split(':');
  return {
    wdNumber: wdNumber(wd ?? ''),
    revision: Number(revision),
    parserVersion: Number(parserVersion),
    ordinal: Number(ordinal),
  };
}

/** A parsed classification, as the engine and the picker see it. */
export interface Classification {
  readonly id: ClassificationId;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly ordinal: number;
  readonly rateIdentifier: string; // 'ELEC0080-011', 'SUVA2016-080'
  readonly identifierKind: IdentifierKind;
  readonly identifierDate: IsoDate | null;
  /** De-wrapped and whitespace-collapsed. */
  readonly className: string;
  /** The determination's OWN lines, newlines preserved. The picker shows this
   *  verbatim, because "help is inline provenance, not a help centre". */
  readonly classNameVerbatim: string;
  readonly classNameNorm: string;
  readonly baseRate: MilliRate;
  readonly fringeRate: MilliRate;
  readonly fringeTreatment: FringeTreatment;
  /** Provenance into the exact bytes: the disputed line is highlightable in the
   *  determination itself eighteen months later (CORPUS_DESIGN §8.3 step 4). */
  readonly sourceLineStart: number;
  readonly sourceLineEnd: number;
  readonly parserVersion: number;
  /** The name spanned more than one physical line. 31.8% of rows do. */
  readonly wrapped: boolean;
}

export type AgreementState = 'agreed' | 'advisory_variance' | 'blocking_variance' | 'single_path';
export type ParseState = 'unparsed' | 'parsed' | 'partial' | 'quarantined';

/**
 * A revision of a wage determination, bitemporal.
 *
 * `publishDate`..`supersededOn` is VALID time — when this text governed work in
 * the world. `firstSeenAt` is SYSTEM time — when Ratepin first held these bytes. A
 * dispute asks two different questions ("what did the WD say on the day we filed"
 * and "what did Ratepin know on the day it filed") and only both axes answer both.
 */
export interface WdRevision {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly stateCode: string | null;
  readonly publishDate: IsoDate;
  readonly headerDate: IsoDate;
  readonly supersededOn: IsoDate | null;
  readonly isActiveUpstream: boolean;
  readonly firstSeenAt: Date;
  readonly lastConfirmedAt: Date;
  /** The determination text's hash, not the HTTP response's: this is what appears
   *  in the Merkle snapshot and, truncated, in the artifact footer. */
  readonly canonicalSha256: Sha256Hex;
  readonly canonicalLength: number;
  /** Path D — the determination's own modification table, a contiguous suffix of
   *  0..revision ending exactly at `revision`. */
  readonly modTable: readonly { readonly modification: number; readonly publicationDate: IsoDate }[];
  readonly agreement: AgreementState;
  readonly parseStatus: ParseState;
  readonly parseVersion: number;
  readonly classCount: number | null;
  readonly constructionTypes: readonly string[];
}

/**
 * ARCHITECTURE §6.2. Established once at project setup, then FROZEN. Every filing
 * on that project carries `pinId`; nothing after the pin consults SAM to produce a
 * filing. There is no timeout to tune, no retry to configure and no circuit
 * breaker to trip, because there is no call (I3, §6.1).
 */
export interface WdPin {
  readonly pinId: PinRef;
  readonly projectId: ProjectRef;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly wdPublishedDate: IsoDate;
  readonly snapshotId: SnapshotRef;
  readonly pinnedAt: Date;
  readonly freshnessCheckedAt: Date | null;
  readonly freshnessState: FreshnessState;
}

/**
 * CORPUS_DESIGN §5.5. THE RATE NEVER MOVES between these three: supersession
 * changes what we can claim about CURRENCY, not what the determination said. There
 * is deliberately no `is_effective` member — effectiveness turns on a
 * contracting-officer finding under FAR 22.404-6 that Ratepin cannot observe, so
 * we store observable dates and decline the conclusion (P-D).
 */
export type PinStanding = 'current' | 'superseded_open' | 'superseded_contract_locked';

// ===========================================================================
// Freshness — separate from rates, which is D7 in one type signature
// ===========================================================================

/**
 * ARCHITECTURE §6.4. FRESH ≤ 24 h · DATED 24–72 h · STALE > 72 h.
 *
 * `freshnessOf(pin)` is deliberately a DIFFERENT function from `rateFor(pin,
 * class)`: a filing needs a rate and does not need freshness, so freshness can be
 * unknown without the filing being blocked. That separation is the whole of D7.
 */
export type FreshnessState = 'FRESH' | 'DATED' | 'STALE';

export interface Freshness {
  readonly state: FreshnessState;
  /** The last time a snapshot PASSED EVERY GATE and was promoted — not the last
   *  time the cron ran and not the last time a request succeeded. A job that runs
   *  every night and is held every night advances nothing, which is the correct
   *  semantics: the guarantee is about verified freshness, not about our cron's
   *  feelings (CORPUS_DESIGN §11.1). */
  readonly corpusVerifiedAt: Date | null;
  readonly checkedAt: Date | null;
}

// ===========================================================================
// The payroll week — ENGINE.md §3
// ===========================================================================

/** AS-2 / ENGINE §7.0. There is no default and no inferred value. `unknown` means
 *  the customer was ASKED and chose not to answer, which is a different fact from
 *  never having been asked. */
export type ContractValueBand = 'over_100k' | 'at_or_under_100k' | 'unknown';

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  readonly st: Hours;
  readonly ot: Hours;
  readonly dt: Hours;
}

/** WH-347 column 6B. CUSTOMER-ASSERTED per plan: we print it and disclaim it. We
 *  neither compute nor verify annualization under 29 CFR 5.25(c) (P-D). */
export interface FringePlanCredit {
  readonly planName: string;
  readonly hourlyCredit: MilliRate;
}

/** ENGINE §9.1 — one member per lettered paragraph of 29 CFR 3.5, of which there
 *  are TEN, (a)–(j), [88 FR 57730, Aug. 23, 2023], plus one sentinel. An
 *  eight-member enum sends every hard hat to `UNMAPPED` and tells a compliant
 *  contractor a lawful deduction is unlawful. */
export type DeductionCategory =
  | 'STATUTORY'
  | 'BONA_FIDE_PREPAYMENT'
  | 'COURT_PROCESS'
  | 'BENEFIT_FUND'
  | 'CREDIT_UNION'
  | 'GOVERNMENTAL'
  | 'CHARITABLE_501C3'
  | 'UNION_DUES'
  | 'BOARD_LODGING_FACILITIES'
  | 'SAFETY_EQUIPMENT'
  | 'UNMAPPED';

/** The paragraph letter each member transcribes, so the CI test in ENGINE §9.2.1
 *  can compare it against the `obligation_changelog` row for 29 CFR 3.5 and fail
 *  the build when a paragraph (k) appears. */
export const DEDUCTION_PARAGRAPH: Readonly<Record<Exclude<DeductionCategory, 'UNMAPPED'>, string>> = {
  STATUTORY: 'a',
  BONA_FIDE_PREPAYMENT: 'b',
  COURT_PROCESS: 'c',
  BENEFIT_FUND: 'd',
  CREDIT_UNION: 'e',
  GOVERNMENTAL: 'f',
  CHARITABLE_501C3: 'g',
  UNION_DUES: 'h',
  BOARD_LODGING_FACILITIES: 'i',
  SAFETY_EQUIPMENT: 'j',
} as const;

export interface DeductionEntry {
  readonly rawLabel: string;
  readonly category: DeductionCategory;
  readonly amount: Cents;
}

/**
 * ENGINE §3's `ClassLine` — one per classification worked. 29 CFR 5.5(a)(1)(i)
 * permits per-classification rates only where "the employer's payroll records
 * accurately set forth the time spent in each classification"; if the CSV does not
 * separate the time we do not have the records, and the line blocks rather than
 * allocating by a heuristic.
 */
export interface PayrollLine {
  readonly lineId: string;
  readonly ordinal: number;
  readonly rawTitle: string;
  readonly titleNorm: string;
  /** `null` until the line resolves. Branded, so it can only have come from the
   *  pinned revision's own class list. */
  readonly classificationId: ClassificationId | null;
  readonly resolvedAtLevel: ClassificationLevel | null;
  /** Exactly seven entries — the CA eCPR XSD declares `day` with minOccurs="7"
   *  maxOccurs="7", so matching the strictest downstream consumer means the XML
   *  renderer never has to invent a day. */
  readonly dayHours: readonly [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours];
  /** The GROSS straight-time cash rate actually paid. 29 CFR 5.32(a): "computed on
   *  his earnings BEFORE any deductions are made for the employee's contributions
   *  to fringe benefits." A post-deferral rate understates the overtime base — a
   *  systematic underpayment that would look completely normal on the form. */
  readonly cashRate: MilliRate;
  /** Customer-asserted, not derived: 29 CFR 5.32(c)(1) makes it "a question of
   *  fact". It moves the overtime base, so it is printed and disclaimed. */
  readonly cashInLieu: MilliRate;
  /** NULL IS NOT ZERO. A premium bucket carrying hours but no rate is a bucket
   *  whose premium CANNOT BE PROVEN — a different fact from one paid at $0.00, and
   *  a different outcome. Modelling absence as 0 silently converts "we don't know"
   *  into "nothing was paid". */
  readonly otRate: MilliRate | null;
  readonly dtRate: MilliRate | null;
  readonly fringeCreditPlans: readonly FringePlanCredit[];
  readonly resolutionState: 'pending' | 'resolved' | 'blocked';
  readonly blockReasons: readonly BlockReason[];
}

export interface Worker {
  readonly workerRef: WorkerRef;
  readonly externalRef: string | null;
  readonly lastName: string;
  readonly firstName: string;
  readonly middleInitial: string | null;
  /** The last four only. The full nine digits never enter the engine, are held in
   *  exactly one encrypted column, and are purged 30 days after export-on-cancel
   *  (§5.4, §11.3). `ssnLast4` survives on the 3-year clock because it is the
   *  identifying number the federal rule requires on the weekly transmittal. */
  readonly ssnLast4: string | null;
}

export interface WorkerWeek {
  readonly workerRef: WorkerRef;
  /** WH-347 column 2. */
  readonly status: 'J' | 'RA';
  readonly apprentice?: {
    readonly programName: string;
    readonly registrar: 'OA' | 'SAA';
    readonly levelOfProgression: string;
  };
  readonly lines: readonly PayrollLine[];
  /** Column 7B — customer-supplied; covers non-covered work too. */
  readonly allWorkGross: Cents;
  /** Column 8 — against 7B, not 7A. A worker on two projects in one week has ONE
   *  set of deductions covering both; netting them against the project-only gross
   *  is the most common arithmetic error in hand-completed WH-347s. */
  readonly deductions: readonly DeductionEntry[];
  /** Column 9 — reconciled, never computed. Their number came from a cheque that
   *  was actually written; on a mismatch the line blocks and both figures are
   *  shown rather than ours overwriting theirs. */
  readonly netPaid: Cents;
}

/** The engine's input. A value type with no references to the database, no clock,
 *  no locale and no randomness — which is what makes G1's exact-match gate real
 *  rather than aspirational (E1). */
export interface PayrollWeek {
  readonly weekEnding: IsoDate;
  readonly workweekStartDay: WeekDay;
  readonly contractValueBand: ContractValueBand;
  readonly pin: WdPin;
  readonly workers: readonly WorkerWeek[];
}

// ===========================================================================
// Block reasons and violation flags
// ===========================================================================

export type BlockReason =
  | 'UNMAPPED_TRADE'
  | 'UNMAPPED_DEDUCTION'
  | 'UNPARSED_CLASSIFICATION'
  | 'UNION_GROUP_REFUSED'
  | 'SUPERSEDED_PIN_UNCONFIRMED'
  | 'MISSING_REQUIRED_FIELD'
  | 'CWHSSA_COVERAGE_UNDETERMINED'
  | 'AMBIGUOUS_RATE_BASIS'
  | 'UNSPLIT_CLASSIFICATION_TIME'
  | 'PREMIUM_HOURS_UNPROVEN'
  | 'NET_RECONCILIATION_FAILED'
  | 'NO_PINNED_REVISION'
  | 'CORPUS_STALE_NO_NEW_ASSERTION'
  | 'COUNTY_SCOPE_UNRESOLVED'
  | 'XSD_HASH_MISMATCH';

/** Two block reasons are FILING-scoped rather than line-scoped: the question is
 *  about the contract or the corpus, not about a row. */
export const FILING_SCOPED_BLOCKS: readonly BlockReason[] = [
  'CWHSSA_COVERAGE_UNDETERMINED',
  'NO_PINNED_REVISION',
  'CORPUS_STALE_NO_NEW_ASSERTION',
  'XSD_HASH_MISMATCH',
] as const;

/** ENGINE §10. Observations with the arithmetic shown. They never block a line and
 *  they never characterise a shortfall as a violation of law. */
export type ViolationFlag = 'WD_UNDERPAYMENT' | 'FRINGE_BELOW_WD' | 'PREMIUM_BELOW_STATUTORY';

// ===========================================================================
// The artifact status — three members, one construction path
// ===========================================================================

/**
 * ARCHITECTURE §6.3. `deriveStatus(lines, freshness)` is the ONLY function that
 * constructs this, it is total, and it is exhaustively tested. The rules:
 *
 *   - ANY line with `resolutionState !== 'resolved'` -> DRAFT_NOT_CERTIFIABLE.
 *   - Otherwise FRESH -> CERTIFIABLE; DATED or STALE -> CERTIFIABLE_DATED.
 *   - FRESHNESS NEVER PRODUCES DRAFT_NOT_CERTIFIABLE. That single line is D7.
 *
 * A model failure and a missing CSV column travel the same code path, so a model
 * failure cannot produce a certifiable-looking artifact (P-13).
 */
export type ArtifactStatus = 'CERTIFIABLE' | 'CERTIFIABLE_DATED' | 'DRAFT_NOT_CERTIFIABLE';

/** The status with its payload. `deriveStatus` returns this; `status` alone is the
 *  narrow form stored on the row and stamped into the provenance block. */
export type ArtifactVerdict =
  | { readonly status: 'CERTIFIABLE'; readonly freshness: Freshness }
  | { readonly status: 'CERTIFIABLE_DATED'; readonly freshness: Freshness }
  | {
      readonly status: 'DRAFT_NOT_CERTIFIABLE';
      readonly freshness: Freshness;
      readonly blocks: readonly BlockReason[];
      /** Always true in this branch. Present as a field so a renderer reads it
       *  rather than re-deriving it, and so the one thing that must never be
       *  rendered is named in the type. */
      readonly signatureBlockWithheld: true;
    };

export function statusOf(verdict: ArtifactVerdict): ArtifactStatus {
  return verdict.status;
}

// ===========================================================================
// The four refusal primitives — USER_JOURNEY §0.3
//
// "If a proposed error state is not P-A, P-B, P-C or P-D, it is either a bug we
// should fix rather than surface, or a request for a human, which is out of
// bounds. There is no third option."
//
// A3 IS ENFORCED BY THE SHAPE OF THIS UNION. There is no `contactEmail`, no
// `supportUrl`, no `ticketId` and no `escalateTo` on any member, and there must
// never be one: a field is the only way such a thing could reach a screen, so its
// absence is the mechanism rather than the intention.
// ===========================================================================

/** One option in a CLOSED choice. Every option carries the source text that
 *  justifies it, because help here is inline provenance rather than a help centre
 *  (heuristic #10, WCAG 2.2 SC 3.2.6). */
export interface RefusalChoice {
  readonly value: string;
  readonly label: string;
  /** The determination's own words, quoted rather than summarised. */
  readonly verbatimSource: string;
  readonly sourceCitation: string;
  readonly baseRate?: MilliRate;
  readonly fringeRate?: MilliRate;
}

export type Refusal =
  /**
   * P-A — BLOCKED LINE, WITH A CHOICE. The offending row is marked, the rest of
   * the filing continues, and the user is handed a small closed set of real
   * options with the source text beside each. Never a guess, never a ticket.
   *
   * `preSelected` is `null` at every ladder level except L-C1, where the only
   * input allowed to fill a radio is the determination's OWN verbatim label —
   * federal text, not another tenant's answer and not a model's (E5).
   */
  | {
      readonly primitive: 'P-A';
      readonly blockReason: BlockReason;
      readonly lineId: string;
      readonly headline: string;
      readonly detail: string;
      readonly choices: readonly RefusalChoice[];
      readonly preSelected: string | null;
      readonly ladderLevel: ClassificationLevel;
    }
  /**
   * P-B — DRAFT — NOT CERTIFIABLE. The artifact renders IN FULL, watermarked,
   * with the signature block withheld and an exception report attached. A warning
   * can be clicked past; a missing signature block cannot (heuristic #5).
   *
   * Withholding is not UX politeness. If a classification is unresolved,
   * certification (3) of 29 CFR 5.5(a)(3)(ii)(C) — "paid not less than the
   * applicable wage rates … for the classification(s) of work actually performed"
   * — is unsupportable; if the contract-value band is unknown, the overtime
   * component of (2) and (3) cannot be computed either way.
   */
  | {
      readonly primitive: 'P-B';
      readonly blockReasons: readonly BlockReason[];
      readonly headline: string;
      readonly detail: string;
      readonly watermark: 'DRAFT — NOT CERTIFIABLE';
      readonly signatureBlockWithheld: true;
      readonly exceptionReport: readonly string[];
    }
  /**
   * P-C — NARROWED CLAIM. The artifact and the rate are UNCHANGED; the sentence
   * about currency narrows and a dated banner appears. The date is mandatory: a
   * narrowing without a timestamp is just vagueness.
   *
   * `credit` is non-null only when the narrowing is OUR failure — a freshness lapse
   * or a quarantine on the customer's own WD. A superseded pin narrows the same way
   * and carries no credit, because nothing of ours failed.
   */
  | {
      readonly primitive: 'P-C';
      readonly headline: string;
      readonly narrowedClaim: string;
      readonly asOf: Date;
      readonly ladderLevel: CorpusLadderLevel;
      readonly credit: {
        readonly reason: string;
        readonly accruingSince: Date;
        readonly cents: Cents | null;
      } | null;
    }
  /**
   * P-D — DECLINED CONCLUSION. We state the rule, show the observable dates, and
   * refuse to draw the conclusion. FAR 22.404-6 effectiveness; whether a fringe
   * credit is annualized or bona fide; whether a deduction's conditions are met;
   * whether a classification is CORRECT; SF-1444 conformance.
   *
   * `rule` is quoted verbatim rather than paraphrased — a document that stakes its
   * authority on quoting cannot summarise the sentence it is refusing to apply.
   */
  | {
      readonly primitive: 'P-D';
      readonly headline: string;
      /** Verbatim regulatory text. */
      readonly rule: string;
      readonly citation: string;
      /** The dates and values we CAN observe, each labelled with its source. */
      readonly observableFacts: readonly { readonly label: string; readonly value: string }[];
      /** The sentence that declines. Contains no verb that could be read as advice. */
      readonly declined: string;
    };

export type RefusalPrimitive = Refusal['primitive'];

export const REFUSAL_PRIMITIVES: readonly RefusalPrimitive[] = ['P-A', 'P-B', 'P-C', 'P-D'] as const;

/** Exhaustiveness helper. `assertNever` on a `Refusal` switch is what makes adding
 *  a fifth primitive a compile error — which is the test §0.3 sets for a new
 *  screen, enforced by the compiler instead of by a reviewer. */
export function assertNever(value: never, message = 'unhandled case'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

// ===========================================================================
// The corpus degradation ladder — L0..L5, ARCHITECTURE §4.5
// ===========================================================================

export type CorpusLadderLevel =
  | 'L0_NORMAL'
  | 'L1_DATED'
  | 'L2_STALE'
  | 'L3_QUARANTINE'
  | 'L4_XML_BLOCKED'
  | 'L5_RELEASE_FROZEN';

export interface CorpusLadderRule {
  readonly level: CorpusLadderLevel;
  readonly trigger: string;
  /** THE COLUMN THAT IS FALSE EVERYWHERE. A filing on an already-pinned project
   *  always generates — that is D7, and it is the reason the autonomy objection
   *  closed. L4 blocks the CA eCPR ARTIFACT, not the filing: the WH-347 path is
   *  untouched. */
  readonly blocksFilingOnPinnedProject: false;
  readonly blocksNewPins: boolean;
  /** "New rate assertions" means putting a corpus rate onto a NEW form or
   *  resolving a WD for the first time — an assertion about the present. Showing
   *  what a determination said, under a dated line, is an assertion about the past
   *  and does not fail closed. */
  readonly suppressesNewRateAssertions: boolean;
  readonly blocksEcprGeneration: boolean;
  readonly blocksPromotion: boolean;
  readonly blocksBuild: boolean;
  readonly accruesCredit: boolean;
  readonly primitive: RefusalPrimitive | null;
}

/** States COMPOSE: L1 and L3 can hold simultaneously and the banner is their
 *  union. The transition table is a state machine under exhaustive test — a ladder
 *  in prose is a ladder that drifts. */
export const CORPUS_LADDER: Readonly<Record<CorpusLadderLevel, CorpusLadderRule>> = {
  L0_NORMAL: {
    level: 'L0_NORMAL',
    trigger: 'All probes green.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: false,
    suppressesNewRateAssertions: false,
    blocksEcprGeneration: false,
    blocksPromotion: false,
    blocksBuild: false,
    accruesCredit: false,
    primitive: null,
  },
  L1_DATED: {
    level: 'L1_DATED',
    trigger: 'No successful newer-revision check for over 24 hours.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: false,
    suppressesNewRateAssertions: false,
    blocksEcprGeneration: false,
    blocksPromotion: false,
    blocksBuild: false,
    accruesCredit: false,
    primitive: 'P-C',
  },
  L2_STALE: {
    level: 'L2_STALE',
    trigger: 'No successful check for over 72 hours — the D7 SLA.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: true,
    suppressesNewRateAssertions: true,
    blocksEcprGeneration: false,
    blocksPromotion: false,
    blocksBuild: false,
    accruesCredit: true,
    primitive: 'P-C',
  },
  L3_QUARANTINE: {
    level: 'L3_QUARANTINE',
    trigger:
      'Dual-ingest disagreement on the three-field blocking set (revision_number, ' +
      'publish_date, active_flag), a parse-rate drop, or a count delta over 0.5%. ' +
      'An ADVISORY variance never reaches this state.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: false,
    suppressesNewRateAssertions: true,
    blocksEcprGeneration: false,
    blocksPromotion: true,
    blocksBuild: false,
    accruesCredit: true,
    primitive: 'P-C',
  },
  L4_XML_BLOCKED: {
    level: 'L4_XML_BLOCKED',
    trigger: 'DIR XSD content hash differs from the pinned hash.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: false,
    suppressesNewRateAssertions: false,
    /** The one place we block OUTPUT. Emitting a file the portal will reject is
     *  worse than emitting nothing, because rejection is discovered late and looks
     *  like our customer's failure. The WH-347 PDF path is untouched. */
    blocksEcprGeneration: true,
    blocksPromotion: false,
    blocksBuild: false,
    accruesCredit: false,
    primitive: 'P-B',
  },
  L5_RELEASE_FROZEN: {
    level: 'L5_RELEASE_FROZEN',
    trigger: 'Golden canary red (G1), or post-deploy canary red.',
    blocksFilingOnPinnedProject: false,
    blocksNewPins: false,
    suppressesNewRateAssertions: false,
    blocksEcprGeneration: false,
    blocksPromotion: true,
    blocksBuild: true,
    accruesCredit: false,
    primitive: 'P-C',
  },
} as const;

// ===========================================================================
// The classification ladder — L-A..L-F, ENGINE §18.2
// ===========================================================================

export type ClassificationLevel = 'L_A' | 'L_B' | 'L_C1' | 'L_C2' | 'L_D' | 'L_E' | 'L_F';

export interface ClassificationLadderRule {
  readonly level: ClassificationLevel;
  readonly trigger: string;
  readonly pickerShown: boolean;
  /** TRUE AT EXACTLY ONE LEVEL. Pre-selection is an endorsement, and the only
   *  input entitled to make one is the determination's own federal text. Not a
   *  model's ordering, and not five strangers' accounts. */
  readonly preSelected: boolean;
  /** TRUE EVERYWHERE EXCEPT L-A. D7 says the unmapped line is BLOCKED and the
   *  choice is MEMORISED; there is no confidence value at which a model-proposed
   *  classification is written to an artifact without a click (E5). The click
   *  costs one action, once, per title, per account, forever — and it is what
   *  mints the crosswalk. */
  readonly lineBlockedUntilChosen: boolean;
  readonly modelCall: boolean;
  readonly writesCrosswalkOnConfirm: boolean;
  readonly banner: string | null;
}

export const CLASSIFICATION_LADDER: Readonly<
  Record<ClassificationLevel, ClassificationLadderRule>
> = {
  L_A: {
    level: 'L_A',
    trigger: "This account's own user-confirmed entry for (wd_number, normalized_title).",
    pickerShown: false,
    preSelected: false,
    lineBlockedUntilChosen: false,
    modelCall: false,
    writesCrosswalkOnConfirm: false,
    banner: null,
  },
  L_B: {
    level: 'L_B',
    trigger: 'Global aggregate hit: at least 5 eligible accounts, agreement >= 0.90.',
    pickerShown: true,
    preSelected: false,
    lineBlockedUntilChosen: true,
    modelCall: false,
    writesCrosswalkOnConfirm: true,
    /** No count of other companies' confirmations appears beside any candidate:
     *  the aggregate may ORDER and nothing else (AS-5 / HIGH-2). */
    banner: null,
  },
  L_C1: {
    level: 'L_C1',
    trigger: "Exact normalized match against this determination's own verbatim label (score == 1.0).",
    pickerShown: true,
    preSelected: true,
    lineBlockedUntilChosen: true,
    modelCall: false,
    writesCrosswalkOnConfirm: true,
    banner: null,
  },
  L_C2: {
    level: 'L_C2',
    trigger: 'Lexical score >= 0.92 and margin >= 0.15, below exact.',
    pickerShown: true,
    preSelected: false,
    lineBlockedUntilChosen: true,
    modelCall: false,
    writesCrosswalkOnConfirm: true,
    banner: null,
  },
  L_D: {
    level: 'L_D',
    trigger:
      'Model rank accepted: schema-valid, confidence == "high", rationale_span matches, ' +
      'ranked[0] in range.',
    pickerShown: true,
    preSelected: false,
    lineBlockedUntilChosen: true,
    modelCall: true,
    writesCrosswalkOnConfirm: true,
    banner: null,
  },
  L_E: {
    level: 'L_E',
    trigger:
      'Model rejected (schema, digits, out-of-range, empty or mismatched span), confidence != "high", ' +
      'budget exhausted, or Anthropic unreachable.',
    pickerShown: true,
    preSelected: false,
    lineBlockedUntilChosen: true,
    modelCall: false,
    writesCrosswalkOnConfirm: true,
    /** This is also the free-generator path, which means the degraded mode is a
     *  surface with daily production traffic rather than a cold branch. */
    banner: 'Candidate ordering was produced without ranking assistance.',
  },
  L_F: {
    level: 'L_F',
    trigger: 'no_suitable_candidate, or zero candidates above the lexical floor.',
    pickerShown: true,
    preSelected: false,
    lineBlockedUntilChosen: true,
    modelCall: false,
    writesCrosswalkOnConfirm: true,
    banner: null,
  },
} as const;

// ===========================================================================
// Artifact provenance — I6, CORPUS_DESIGN §8.2
// ===========================================================================

export type ArtifactKind =
  | 'wh347_pdf'
  | 'statement_of_compliance'
  | 'ecpr_xml'
  | 'exception_report'
  | 'portal_bundle'
  | 'rate_card';

export type Wh347Layout = 'wh347_rev_2025_01' | 'wh347_legacy';

/**
 * Stamped into the artifact BYTES, not looked up later. Every field here is
 * printed on the document, so a dispute eighteen months later is answered by
 * reading the customer's own PDF and our database merely confirms it.
 */
export interface ArtifactProvenance {
  readonly wdNumber: WdNumber;
  readonly revisionPinned: number;
  readonly revisionAtAward: number;
  readonly publishDate: IsoDate;
  readonly canonicalSha256: Sha256Hex;
  readonly snapshotRef: SnapshotRef;
  readonly merkleRoot: Sha256Hex;
  readonly inclusionProof: readonly Sha256Hex[];
  readonly leafIndex: number;
  readonly corpusVerifiedAt: Date;
  readonly generatedAt: Date;
  readonly formLayout: Wh347Layout;
  readonly formPdfSha256: Sha256Hex;
  readonly xsdSha256: Sha256Hex | null;
  readonly engineVersion: number;
  readonly buildSha: string;
  readonly contractValueBand: ContractValueBand;
  readonly freshnessState: FreshnessState;
  readonly certifiable: boolean;
  readonly blockReasons: readonly BlockReason[];
}

/**
 * The free generator's provenance: every corpus column, and NO PIN.
 *
 * CORPUS_DESIGN §6.4: a certifiable artifact is one whose rates are pinned to a
 * revision of record, and an anonymous visitor has no project, no award date and
 * nothing persisted beyond 24 hours. What the free artifact lacks is not EVIDENCE
 * — it carries all five corpus values — it is the PIN, and the pin is what
 * certification means. There is no field here in which a pin could be forged.
 */
export interface EphemeralProvenance {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly canonicalSha256: Sha256Hex;
  readonly snapshotRef: SnapshotRef;
  readonly merkleRoot: Sha256Hex;
  readonly corpusVerifiedAt: Date | null;
  readonly generatedAt: Date;
  readonly buildSha: string;
  readonly certifiable: false;
  readonly blockReasons: readonly BlockReason[];
}
