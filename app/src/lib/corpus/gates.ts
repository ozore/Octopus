/**
 * Corpus quality gates — CORPUS_DESIGN.md §7, expressed as pure functions so CI
 * can fail the build rather than a runbook asking someone to be careful.
 *
 * Per P5 and the Twelve-Factor discipline of putting guarantees in the codebase:
 * every rule in §7 that *can* be a test *is* one here. The gates that cannot
 * live in this file are named at the bottom with the reason, so the set is
 * auditable rather than quietly partial.
 *
 * These run against the built bundle plus the raw file text, because two of them
 * (G5, G6) are about what must NOT exist, and absence is only checkable against
 * the source bytes.
 */

import { REASON_CODES, type ReasonCode } from '../domain/reason-codes';
import { packSlice, findCacheInvalidators, canonicalJson } from './pack';
import { selectCorpusSlice } from './retrieval';
import type { CorpusBundle } from './types';

export type Violation = { gate: string; detail: string };

export const EXCERPT_WORD_LIMIT = 25;

const words = (s: string) => (s.trim() === '' ? 0 : s.trim().split(/\s+/).length);

/** G2 — every `governed_by` clause id resolves to an existing L2 record. */
export function gateG2(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const [code, record] of bundle.reasonCodes) {
    for (const clauseId of record.governedBy) {
      if (!bundle.clausesById.has(clauseId)) {
        out.push({ gate: 'G2', detail: `${code} -> ${clauseId} does not resolve` });
      }
    }
  }
  return out;
}

/** G3 — exactly one L3 pattern per reason code, no orphans in either direction. */
export function gateG3(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const code of REASON_CODES) {
    if (!bundle.reasonCodes.has(code)) out.push({ gate: 'G3', detail: `${code} missing from taxonomy.json` });
    if (!bundle.patterns.has(code)) out.push({ gate: 'G3', detail: `${code} has no appeal pattern` });
  }
  for (const code of bundle.patterns.keys()) {
    if (!bundle.reasonCodes.has(code)) {
      out.push({ gate: 'G3', detail: `appeal pattern ${code} has no reason code` });
    }
  }
  for (const [code, record] of bundle.reasonCodes) {
    if (record.appealPattern !== code) {
      out.push({ gate: 'G3', detail: `${code} points at pattern ${record.appealPattern}; must be 1:1` });
    }
  }
  return out;
}

/** G4 — `quoted_excerpt` is at most 25 words. The copyright mitigation in §3.6. */
export function gateG4(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const clause of bundle.clausesById.values()) {
    if (clause.quotedExcerpt && words(clause.quotedExcerpt) > EXCERPT_WORD_LIMIT) {
      out.push({
        gate: 'G4',
        detail: `${clause.clauseId} excerpt is ${words(clause.quotedExcerpt)} words (limit ${EXCERPT_WORD_LIMIT})`,
      });
    }
  }
  return out;
}

/**
 * G5 — no `source_text` field exists anywhere in the corpus. The schema has no
 * such field; this asserts nobody added one in a file.
 */
export function gateG5(rawFiles: ReadonlyArray<{ name: string; content: string }>): Violation[] {
  return rawFiles
    .filter((f) => /\bsource_text\b/.test(f.content))
    .map((f) => ({ gate: 'G5', detail: `${f.name} contains a source_text field — store our summaries, never bulk source` }));
}

/**
 * G6 — no PII and no customer text in the corpus directory.
 *
 * Deterministic patterns, deliberately: a regex for an order-id format fails
 * closed, whereas a model-assisted check fails open by silently missing things
 * (CORPUS_DESIGN §4.4). This is the check that keeps the repo safe to hand to a
 * contractor, and the failure it prevents is unrecoverable once pushed.
 */
export function gateG6(rawFiles: ReadonlyArray<{ name: string; content: string }>): Violation[] {
  const patterns: Array<[string, RegExp]> = [
    ['email address', /[\w.+-]+@[\w-]+\.[\w.]{2,}/],
    ['amazon order id', /\b\d{3}-\d{7}-\d{7}\b/],
    ['merchant or seller token', /\bA[A-Z0-9]{13}\b/],
    ['asin', /\bB0[A-Z0-9]{8}\b/],
    ['us phone number', /\b\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/],
    ['case id', /\bcase_[0-9A-HJKMNP-TV-Z]{26}\b/],
  ];
  const out: Violation[] = [];
  for (const file of rawFiles) {
    for (const [label, re] of patterns) {
      const m = re.exec(file.content);
      if (m) out.push({ gate: 'G6', detail: `${file.name} contains what looks like a ${label}: ${m[0]}` });
    }
  }
  return out;
}

/**
 * G7 — a clause from a jurisdiction-caveated source never reaches a US drafting
 * path. Asserted through the real retrieval function rather than by inspecting
 * the flag, so the gate tests the behaviour a customer would get.
 */
export function gateG7(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const code of bundle.reasonCodes.keys()) {
    const result = selectCorpusSlice(bundle, code, { jurisdiction: 'US', promptBundleHash: 'gate' });
    if (!result.ok) continue;
    for (const doc of result.slice.policyDocs) {
      const source = bundle.sourcesById.get(doc.documentId);
      if (source?.jurisdictionCaveat) {
        out.push({ gate: 'G7', detail: `${code} US slice includes caveated source ${doc.documentId}` });
      }
      if (source && !source.citable) {
        out.push({ gate: 'G7', detail: `${code} US slice includes non-citable source ${doc.documentId}` });
      }
    }
  }
  return out;
}

/** G8 / G9 — forum (tier C) and corroboration sources are never citable. */
export function gateG8G9(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const source of bundle.sourcesById.values()) {
    if ((source.tier === 'C' || source.tier === 'corroboration') && source.citable) {
      out.push({ gate: source.tier === 'C' ? 'G8' : 'G9', detail: `${source.sourceId} is tier ${source.tier} and must be citable:false` });
    }
    if (source.stub && source.citable) {
      out.push({ gate: 'G8', detail: `${source.sourceId} is a stub and must be citable:false` });
    }
  }
  return out;
}

/** G11 — the packed prefix carries nothing volatile, and hashing is stable. */
export function gateG11(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const code of bundle.reasonCodes.keys()) {
    const result = selectCorpusSlice(bundle, code, { jurisdiction: 'any', promptBundleHash: 'gate' });
    if (!result.ok) continue;
    const packed = packSlice(result.slice);
    const invalidators = findCacheInvalidators(canonicalJson(packed.blocks));
    if (invalidators.length > 0) {
      out.push({ gate: 'G11', detail: `${code} packed prefix carries ${invalidators.join(', ')}` });
    }
  }
  return out;
}

/**
 * G16 — `supporting_n` counts verified outcome records only; seed observations
 * contribute zero. At n=0 across the board this looks trivial, and that is the
 * point: it must already be true before the first real outcome arrives, because
 * the moment it becomes non-trivial is the moment an unmeasured success rate
 * could be published (N10, R11).
 */
export function gateG16(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const seed of bundle.seeds) {
    if (seed.contributesToSupportingN !== 0) {
      out.push({ gate: 'G16', detail: `${seed.seedId} claims to contribute to supporting_n` });
    }
    if (seed.citable !== false || seed.outcomeVerified !== false) {
      out.push({ gate: 'G16', detail: `${seed.seedId} is marked citable or verified` });
    }
  }
  for (const [code, pattern] of bundle.patterns) {
    if (pattern.provenance === 'authored' && pattern.supportingN !== 0) {
      out.push({ gate: 'G16', detail: `${code} is authored but claims supporting_n=${pattern.supportingN}` });
    }
  }
  return out;
}

/** Coverage — every code in the taxonomy has at least one governing clause. */
export function gateCoverage(bundle: CorpusBundle): Violation[] {
  const out: Violation[] = [];
  for (const [code, record] of bundle.reasonCodes) {
    if (record.governedBy.length === 0) {
      out.push({ gate: 'COVERAGE', detail: `${code} has no governing clause` });
    }
  }
  if (bundle.reasonCodes.size !== REASON_CODES.length) {
    out.push({
      gate: 'COVERAGE',
      detail: `taxonomy has ${bundle.reasonCodes.size} codes, expected ${REASON_CODES.length}`,
    });
  }
  return out;
}

export function runAllGates(
  bundle: CorpusBundle,
  rawFiles: ReadonlyArray<{ name: string; content: string }>,
): Violation[] {
  return [
    ...gateG2(bundle),
    ...gateG3(bundle),
    ...gateG4(bundle),
    ...gateG5(rawFiles),
    ...gateG6(rawFiles),
    ...gateG7(bundle),
    ...gateG8G9(bundle),
    ...gateG11(bundle),
    ...gateG16(bundle),
    ...gateCoverage(bundle),
  ];
}

/**
 * Gates NOT implemented here, and why — so the set is auditable:
 *
 *  - **G1** (JSON Schema validation) needs a schema validator dependency. The
 *    schemas exist in `corpus/ontology/`; wiring a validator is a package.json
 *    change and is deliberately left to whoever owns dependencies.
 *  - **G10** (token budget) requires the API's `count_tokens`, which needs the
 *    network and a key. It belongs to the build step, not the offline suite;
 *    `estimateTokens` in `pack.ts` catches order-of-magnitude drift only.
 *  - **G12** (uncited policy reference does not survive render) is the render
 *    layer's invariant. `resolveCitation` / `isRenderablePolicyCitation` in
 *    `pack.ts` are the corpus-side half; the assertion lives with the renderer.
 *  - **G13, G14** are database constraints (see `corpus/L4-outcomes/schema.sql`).
 *  - **G15** (robots pre-flight) belongs to the ingestion job, which is not part
 *    of the request path and does not run in this suite.
 */
export const UNIMPLEMENTED_GATES = ['G1', 'G10', 'G12', 'G13', 'G14', 'G15'] as const;

export type GateReport = {
  violations: Violation[];
  codesWithUsSlice: ReasonCode[];
  codesWithoutUsSlice: ReasonCode[];
};
