/**
 * Confidence and the `needs_review` decision — `specs/03` §8, KB §D.4.
 *
 *   field_confidence = min(model_confidence, gate_cap)
 *   used_fields      = the fields THIS vendor's requirement set actually reads
 *   doc_confidence   = min(field_confidence over used fields)
 *
 * The "used fields" clause is the whole design. A shaky `med_exp` on a template
 * that never checks `med_exp` must not send a document to review: reviewing
 * everything is how a review queue becomes noise, and an ignored review queue is
 * worse than none, because it launders bad data as human-checked.
 */

import { matchName, type CoiExtraction, type RequirementSet } from '../engine';

import { runQuoteGate, type GateVerdict } from './quote-gate';
import { walkFields, type WalkedField } from './fields';

/** `specs/03` §8. An OPENING value, labelled as one; `H-EX-2` re-derives it
 *  from the first 200 labelled documents. */
export const TAU = 0.85;

export type FieldAssessment = {
  field: WalkedField;
  verdict: GateVerdict;
  /** `min(model confidence, gate cap)`. */
  confidence: number;
  used: boolean;
};

export type Assessment = {
  fields: FieldAssessment[];
  docConfidence: number;
  gateFailures: number;
  needsReview: boolean;
  /** In the words the review screen and the admin page print. */
  reviewReasons: string[];
};

/**
 * Which fields the requirement set reads. Deliberately generous at the coverage
 * level and specific at the limit level: a requirement on GL `each_occurrence`
 * makes the whole GL row's identity fields used (its dates decide `expired`, its
 * `addl_insd` decides `asserted_only`), but does not make `med_exp` used.
 */
export function usedPaths(payload: CoiExtraction, set: RequirementSet | null): Set<string> {
  const used = new Set<string>();
  const all = walkFields(payload);

  // Always used, by every template: the three cross-cutting checks in
  // `specs/05` §3 read them on every comparison (BUILD.md D-8).
  for (const path of ['/insured/name', '/certificate_holder', '/certificate_date']) {
    used.add(path);
  }

  if (!set) return used;

  const wantedCoverages = new Set(set.requirements.map((r) => r.coverage).filter(Boolean));
  const wantedLimits = new Set(
    set.requirements.filter((r) => r.limitLabel).map((r) => `${r.coverage}:${r.limitLabel}`),
  );
  // A combinable requirement is satisfiable by the umbrella/excess tower, so the
  // tower's rows are read even when no requirement names them (KB §B.0).
  if (set.requirements.some((r) => r.combinable)) {
    wantedCoverages.add('umbrella_liability');
    wantedCoverages.add('excess_liability');
  }

  for (const walked of all) {
    if (!walked.coverage) continue;
    if (!wantedCoverages.has(walked.coverage)) continue;
    if (walked.limitLabel) {
      // A limit row is used only when a requirement names that label on that
      // coverage — or when it is the umbrella tower answering a combinable one.
      const key = `${walked.coverage}:${walked.limitLabel}`;
      const towerLimit =
        walked.coverage === 'umbrella_liability' || walked.coverage === 'excess_liability';
      if (!wantedLimits.has(key) && !towerLimit) continue;
    }
    used.add(walked.path);
  }
  return used;
}

export function assess(input: {
  payload: CoiExtraction;
  pageTexts: readonly string[];
  requirementSet: RequirementSet | null;
  vendorName?: string | null;
}): Assessment {
  const used = usedPaths(input.payload, input.requirementSet);
  const fields: FieldAssessment[] = walkFields(input.payload).map((field) => {
    const verdict = runQuoteGate(field.field, input.pageTexts);
    const confidence = Math.min(field.field.confidence, verdict.cap);
    return { field, verdict, confidence, used: used.has(field.path) };
  });

  const usedFields = fields.filter((f) => f.used && f.field.field.value !== null);
  const docConfidence = usedFields.length === 0 ? 1 : Math.min(...usedFields.map((f) => f.confidence));
  const gateFailures = fields.filter((f) => f.verdict.gate === 'failed').length;

  const reasons: string[] = [];

  // 1. τ.  The boundary is exclusive: exactly 0.85 does NOT trigger (§15 unit list).
  if (docConfidence < TAU) {
    reasons.push('We are not confident enough about at least one field this vendor is checked on.');
  }
  // 2. The gate fired on a used field.
  if (fields.some((f) => f.used && f.verdict.gate === 'failed')) {
    reasons.push('We could not find one of these values on the page we read it from.');
  }
  // 3. A required coverage type has no row at all.
  const presentTypes = new Set(input.payload.coverages?.map((c) => c.type) ?? []);
  const missing = (input.requirementSet?.requirements ?? [])
    .map((r) => r.coverage)
    .filter((c): c is NonNullable<typeof c> => Boolean(c) && !presentTypes.has(c!));
  if (missing.length > 0) {
    reasons.push('A coverage this vendor is required to carry has no row on this certificate.');
  }
  // 4. The insured does not normalise-match the vendor (M5's rule, reused).
  const insured = input.payload.insured?.name?.value ?? null;
  if (input.vendorName && insured && !matchName(insured, input.vendorName)) {
    reasons.push('The insured on this certificate does not look like this vendor.');
  }
  // 5. Not an ACORD 25.
  if (input.payload.document_kind !== 'acord_25') {
    reasons.push('This does not look like an ACORD 25 certificate of liability insurance.');
  }
  // 6. Two rows of the same type disagree on the expiry — an ambiguous read.
  const byType = new Map<string, Set<string>>();
  for (const row of input.payload.coverages ?? []) {
    const exp = row.policy_exp?.value;
    if (!exp) continue;
    const seen = byType.get(row.type) ?? new Set<string>();
    seen.add(exp);
    byType.set(row.type, seen);
  }
  if ([...byType.values()].some((s) => s.size > 1)) {
    reasons.push('Two rows of the same coverage show different expiry dates.');
  }

  return {
    fields,
    docConfidence,
    gateFailures,
    needsReview: reasons.length > 0,
    reviewReasons: reasons,
  };
}
