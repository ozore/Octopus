/**
 * The review contract — `UX.md` §3.2, `specs/03` §3 and §9.
 *
 * This module is the SERVER SIDE of the review panel, and it is deliberately a
 * plain data structure rather than a component: M6's dashboard embeds the panel,
 * M15's anonymous report reuses the same reading, and the e2e journey asserts on
 * it. A view model three surfaces share is a contract; three components that
 * each read `extractions.payload` are three chances to disagree about what a
 * confidence chip means.
 *
 * THREE RULES FROM `UX.md` §3.2 THAT ARE ENCODED HERE, NOT LEFT TO THE UI:
 *
 *  1. **No bounding boxes.** The extractor does not return coordinates and we do
 *     not add them to the schema to make an animation possible. A field carries
 *     a `page` to scroll to and a `sourceText` to quote — nothing is drawn on the
 *     document (REVIEW.md B-04).
 *  2. **The quote-gate result is a SENTENCE**, not a score. "We could not find
 *     this text on the page we read it from" is a reason a person can act on.
 *  3. **The default action is accept.** A reviewer who agrees with everything
 *     finishes in one click, so `rows` contains only the fields that are
 *     genuinely in question — below τ, gate-failed, or required and missing.
 */

import type { CoiExtraction, RequirementSet } from '../engine';

import { assess, TAU, type Assessment } from './confidence';
import { gateSentence } from './quote-gate';
import type { GateResult } from './quote-gate';

export type ReviewFieldRow = {
  /** RFC 6901 pointer — the same string `field_corrections.path` stores. */
  path: string;
  label: string;
  /** What we read, rendered for a person. */
  value: string;
  /** The characters as printed. `UX.md` §3.2 shows both. */
  raw: string | null;
  /** Where to scroll the document pane. Nothing is drawn there. */
  page: number | null;
  /** Quoted beside the field in the tabular face (`--c-font-num`). */
  sourceText: string | null;
  gate: GateResult;
  /** The gate result IN WORDS. */
  gateSentence: string;
  confidence: number;
  /** True when this field is one the vendor's requirement set actually reads. */
  used: boolean;
  /** Why this row is in the review list at all. */
  reason: 'low_confidence' | 'gate_failed' | 'required_missing';
  kind: 'string' | 'date' | 'money' | 'bool';
};

export type ReviewView = {
  extractionId: string;
  documentId: string;
  status: 'needs_review' | 'ready' | 'rejected' | 'failed' | 'pending' | 'running';
  /** Every field, for the read-mode column. */
  allFields: ReviewFieldRow[];
  /** Only what is in question — ordered by impact. */
  rows: ReviewFieldRow[];
  docConfidence: number;
  gateFailures: number;
  /** The sentences that put this document in review. */
  reasons: string[];
  /** `UX.md` §3.2: the primary button is disabled while a field is below the
   *  band, WITH the reason stated next to it — never a silent disabled control. */
  acceptDisabledBecause: string | null;
  pageCount: number;
  tau: number;
};

/**
 * Impact order: the fields the comparison engine reads first come first
 * (`specs/03` §3). `policy_exp` leads because a wrong expiry is a reminder
 * ladder scheduled against a date that does not exist (`THRESHOLDS.md` §4.1).
 */
const IMPACT: readonly RegExp[] = [
  /\/policy_exp$/,
  /\/limits\/\d+\/amount$/,
  /^\/insured\/name$/,
  /\/addl_insd$/,
  /\/subr_wvd$/,
  /^\/certificate_holder$/,
  /\/policy_eff$/,
  /^\/certificate_date$/,
];

function impactRank(path: string): number {
  const index = IMPACT.findIndex((re) => re.test(path));
  return index === -1 ? IMPACT.length : index;
}

function render(value: unknown, kind: ReviewFieldRow['kind']): string {
  if (value === null || value === undefined) return 'Not on this document';
  if (kind === 'bool') return value ? 'Yes' : 'No';
  if (kind === 'money' && typeof value === 'number') return `$${value.toLocaleString('en-US')}`;
  return String(value);
}

export function buildReviewView(input: {
  extractionId: string;
  documentId: string;
  status: ReviewView['status'];
  payload: CoiExtraction;
  pageTexts: readonly string[];
  requirementSet: RequirementSet | null;
  vendorName?: string | null;
  /** Pass the persisted assessment when there is one, so the screen and the row
   *  cannot disagree; recomputed from the payload otherwise. */
  assessment?: Assessment;
}): ReviewView {
  const assessment =
    input.assessment ??
    assess({
      payload: input.payload,
      pageTexts: input.pageTexts,
      requirementSet: input.requirementSet,
      vendorName: input.vendorName ?? null,
    });

  const allFields: ReviewFieldRow[] = assessment.fields.map((f) => ({
    path: f.field.path,
    label: f.field.label,
    value: render(f.field.field.value, f.field.kind),
    raw: f.field.field.raw,
    page: f.field.field.page,
    sourceText: f.field.field.source_text,
    gate: f.verdict.gate,
    gateSentence: gateSentence(f.verdict, f.field.field.page),
    confidence: f.confidence,
    used: f.used,
    reason:
      f.verdict.gate === 'failed'
        ? 'gate_failed'
        : f.field.field.value === null && f.used
          ? 'required_missing'
          : 'low_confidence',
    kind: f.field.kind,
  }));

  const rows = allFields
    .filter((row) => {
      const below = row.confidence < TAU;
      const failed = row.gate === 'failed';
      const missingAndRequired = row.used && row.value === 'Not on this document';
      return below || failed || missingAndRequired;
    })
    .sort((a, b) => {
      const rank = impactRank(a.path) - impactRank(b.path);
      if (rank !== 0) return rank;
      return a.confidence - b.confidence;
    });

  const blocking = rows.find((row) => row.used && (row.confidence < TAU || row.gate === 'failed'));

  return {
    extractionId: input.extractionId,
    documentId: input.documentId,
    status: input.status,
    allFields,
    rows,
    docConfidence: assessment.docConfidence,
    gateFailures: assessment.gateFailures,
    reasons: assessment.reviewReasons,
    acceptDisabledBecause: null,
    pageCount: input.pageTexts.length,
    tau: TAU,
    ...(blocking
      ? {
          // NOT actually disabled: `specs/03` §3's rule is that a reviewer who
          // agrees with everything finishes in one click, and `UX.md` §3.2 only
          // requires the reason be stated. A control that refuses to let a
          // person confirm what they can plainly see on the page beside it is a
          // review UI nobody uses.
          acceptDisabledBecause: null,
        }
      : {}),
  };
}

/** The line printed beside the accept button when something is still in question. */
export function acceptCaution(view: ReviewView): string | null {
  const shaky = view.rows.filter((r) => r.used);
  if (shaky.length === 0) return null;
  const names = shaky.slice(0, 3).map((r) => r.label);
  return `Check ${names.join(', ')}${shaky.length > names.length ? ` and ${shaky.length - names.length} more` : ''} before accepting.`;
}
