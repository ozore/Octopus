/**
 * Corpus build — raw files in, `CorpusBundle` out. Pure: no fs, no clock, no
 * network, no randomness.
 *
 * Spec: ADR-003 (the corpus is compiled at BUILD time into a deterministically
 * serialised bundle with a content hash), CORPUS_DESIGN.md §3.7 stages 5–6.
 *
 * The purity is not stylistic. ADR-003's cache economics depend on the packed
 * prefix being byte-identical across deploys, and the classic way that breaks is
 * a build step that reads a clock or a UUID. Keeping the transform pure means a
 * silent invalidator cannot enter here — it would have to enter through the
 * files themselves, where gate G11 catches it.
 *
 * Ordering is fixed everywhere: documents by `sourceId`, clauses by `clauseId`,
 * codes by `code`, rubric criteria by `id`. Same inputs, same bytes, always.
 */

import { REASON_CODES, type ReasonCode, isReasonCode } from '../domain/reason-codes';
import { parsePolicyFile, type FrontMatter } from './parse';
import type {
  AntiPattern,
  AppealPattern,
  CorpusBundle,
  EvidenceItem,
  PatternSection,
  Platform,
  PolicyClause,
  PolicyDocumentRecord,
  PolicySource,
  ReasonCodeRecord,
  SeedObservation,
} from './types';

export type RawCorpus = {
  /** Contents of `corpus/taxonomy.json`. */
  taxonomy: string;
  /** Contents of `corpus/L3-appeal-patterns/appeal-patterns.json`. */
  patterns: string;
  /** Contents of `corpus/L4-outcomes/seeds/seed-observations.json`. */
  seeds: string;
  /** Every `corpus/L2-policy-clauses/*.md`, keyed by file name. */
  policyFiles: ReadonlyArray<{ name: string; content: string }>;
  corpusRelease: number;
};

const str = (fm: FrontMatter, key: string, fallback = ''): string => {
  const v = fm[key];
  return typeof v === 'string' ? v : v === null || v === undefined ? fallback : String(v);
};
const bool = (fm: FrontMatter, key: string, fallback = false): boolean => {
  const v = fm[key];
  return typeof v === 'boolean' ? v : fallback;
};
const list = (fm: FrontMatter, key: string): string[] => {
  const v = fm[key];
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string' && v !== '') return [v];
  return [];
};

function buildSource(fm: FrontMatter): PolicySource {
  return {
    sourceId: str(fm, 'source_id'),
    platform: (str(fm, 'platform', 'AMZ') as Platform),
    title: str(fm, 'title'),
    tier: str(fm, 'tier', 'A') as PolicySource['tier'],
    accessMode: str(fm, 'access_mode', 'public_html') as PolicySource['accessMode'],
    url: str(fm, 'url'),
    robotsStatus: str(fm, 'robots_status', 'n_a') as PolicySource['robotsStatus'],
    marketplaceEdition: str(fm, 'marketplace_edition', 'unknown'),
    firstFetchedAt: str(fm, 'first_fetched_at'),
    lastVerifiedAt: str(fm, 'last_verified_at'),
    contentSha256: fm['content_sha256'] === null ? null : str(fm, 'content_sha256') || null,
    licensePosture: str(fm, 'license_posture'),
    citable: bool(fm, 'citable', false),
    jurisdictionCaveat: bool(fm, 'jurisdiction_caveat', true),
    stub: bool(fm, 'stub', false),
    stubReason: str(fm, 'stub_reason') || undefined,
    reasonCodesCovered: list(fm, 'reason_codes_covered'),
    retrievalNote: str(fm, 'retrieval_note') || undefined,
  };
}

function buildPolicyDocuments(files: RawCorpus['policyFiles']): PolicyDocumentRecord[] {
  const docs = files.map(({ name, content }) => {
    const parsed = parsePolicyFile(content);
    const source = buildSource(parsed.frontMatter);
    if (source.sourceId === '') {
      throw new Error(`corpus file ${name} has no source_id`);
    }
    // A stub is a recorded hole. It carries zero clauses by construction, so
    // nothing in it can ever reach a draft (CORPUS_DESIGN §3.5, and the reason
    // this build never has to trust the author to leave a stub empty).
    const clauses: PolicyClause[] = source.stub
      ? []
      : parsed.clauses.map((c) => ({
          clauseId: c.clauseId,
          sourceId: source.sourceId,
          heading: str(c.meta, 'heading'),
          obligationType: str(c.meta, 'obligation_type', 'standard') as PolicyClause['obligationType'],
          status: str(c.meta, 'status', 'active') as PolicyClause['status'],
          ourSummary: c.paragraphs,
          quotedExcerpt: c.meta['excerpt'] === null ? null : (str(c.meta, 'excerpt') || null),
          reasonCodes: list(c.meta, 'reason_codes'),
        }));
    return { source, clauses: clauses.slice().sort(byClauseId) };
  });
  return docs.sort((a, b) => a.source.sourceId.localeCompare(b.source.sourceId));
}

const byClauseId = (a: PolicyClause, b: PolicyClause) => a.clauseId.localeCompare(b.clauseId);

function buildReasonCodes(taxonomyJson: string): {
  codes: Map<ReasonCode, ReasonCodeRecord>;
  defaultFloor: number;
} {
  const parsed = JSON.parse(taxonomyJson) as {
    default_classifier_floor: number;
    codes: Array<Record<string, unknown>>;
  };
  const codes = new Map<ReasonCode, ReasonCodeRecord>();
  for (const raw of parsed.codes) {
    const code = String(raw['code']);
    if (!isReasonCode(code)) {
      throw new Error(`taxonomy.json carries ${code}, which is not in the code taxonomy`);
    }
    codes.set(code, {
      code,
      platform: raw['platform'] as Platform,
      family: String(raw['family']),
      status: raw['status'] as 'active' | 'retired',
      plainEnglish: String(raw['plain_english']),
      severityBand: raw['severity_band'] as ReasonCodeRecord['severityBand'],
      triageDisposition: raw['triage_disposition'] as ReasonCodeRecord['triageDisposition'],
      classifierFloor: Number(raw['classifier_floor']),
      aliases: (raw['aliases'] as string[]) ?? [],
      triggerPhrases: ((raw['notice_trigger_phrases'] as Array<Record<string, unknown>>) ?? []).map((p) => ({
        phrase: String(p['phrase']),
        confidenceWeight: p['confidence_weight'] as 'high' | 'medium' | 'low',
        observed: Boolean(p['observed']),
      })),
      governedBy: ((raw['governed_by'] as string[]) ?? []).slice().sort(),
      appealPattern: String(raw['appeal_pattern']),
      confusableWith: (raw['confusable_with'] as string[]) ?? [],
      disclaimerProfile: raw['disclaimer_profile'] as 'standard' | 'referral',
      gap: raw['gap'] === undefined ? undefined : String(raw['gap']),
      constructed: raw['constructed'] === undefined ? undefined : Boolean(raw['constructed']),
    });
  }
  return { codes, defaultFloor: parsed.default_classifier_floor };
}

const section = (raw: Record<string, unknown> | undefined): PatternSection => ({
  mustContain: ((raw?.['must_contain'] as string[]) ?? []).slice(),
  mustAvoid: ((raw?.['must_avoid'] as string[]) ?? []).slice(),
});

function buildPatterns(patternsJson: string): Map<ReasonCode, AppealPattern> {
  const parsed = JSON.parse(patternsJson) as {
    shared_anti_patterns: Array<Record<string, unknown>>;
    patterns: Record<string, Record<string, unknown>>;
  };

  const shared: AntiPattern[] = parsed.shared_anti_patterns.map((a) => ({
    id: String(a['id']),
    detect: String(a['detect']),
    critique: String(a['critique']),
    weight: Number(a['weight']),
    shared: true,
  }));

  const out = new Map<ReasonCode, AppealPattern>();
  for (const [code, raw] of Object.entries(parsed.patterns)) {
    if (!isReasonCode(code)) {
      throw new Error(`appeal-patterns.json carries ${code}, which is not a reason code`);
    }
    const structure = raw['structure'] as Record<string, Record<string, unknown>>;
    const specific: AntiPattern[] = ((raw['anti_patterns'] as Array<Record<string, unknown>>) ?? []).map((a) => ({
      id: String(a['id']),
      detect: String(a['detect']),
      critique: String(a['critique']),
      weight: Number(a['weight']),
      shared: false,
    }));
    // Code-specific first, then shared; both blocks sorted by id so the packed
    // rubric bytes are stable across builds (ADR-003 cache hygiene).
    const antiPatterns = [
      ...specific.slice().sort((a, b) => a.id.localeCompare(b.id)),
      ...shared.slice().sort((a, b) => a.id.localeCompare(b.id)),
    ];
    const evidenceRequired: EvidenceItem[] = ((raw['evidence_required'] as Array<Record<string, unknown>>) ?? []).map(
      (e) => ({
        evidenceId: String(e['evidence_id']),
        label: String(e['label']),
        mandatory: Boolean(e['mandatory']),
        redactionNote: e['redaction_note'] === undefined ? undefined : String(e['redaction_note']),
      }),
    );
    out.set(code, {
      code,
      provenance: raw['provenance'] as 'authored' | 'promoted_from_L4',
      supportingN: Number(raw['supporting_n']),
      lastReviewedAt: String(raw['last_reviewed_at']),
      structure: {
        rootCause: section(structure['root_cause']),
        immediateCorrective: section(structure['immediate_corrective']),
        preventive: section(structure['preventive']),
      },
      evidenceRequired,
      antiPatterns,
      referOutNote: raw['refer_out_note'] === undefined ? undefined : String(raw['refer_out_note']),
      notes: raw['notes'] === undefined ? undefined : String(raw['notes']),
    });
  }
  return out;
}

function buildSeeds(seedsJson: string): SeedObservation[] {
  const parsed = JSON.parse(seedsJson) as { observations: Array<Record<string, unknown>> };
  return parsed.observations
    .map((o) => ({
      seedId: String(o['seed_id']),
      platform: o['platform'] as Platform,
      reasonCodeGuess: String(o['reason_code_guess']),
      sourceUrl: String(o['source_url']),
      retrievedAt: String(o['retrieved_at']),
      reportedOutcome: o['reported_outcome'] as SeedObservation['reportedOutcome'],
      // Not read from the file: asserted here. A seed that could be marked
      // citable by editing a JSON field would be one edit away from reaching a
      // customer, and forum text authored by other sellers must never do that
      // (CORPUS_DESIGN §4.5).
      citable: false as const,
      outcomeVerified: false as const,
      contributesToSupportingN: 0 as const,
      informsPatterns: ((o['informs_patterns'] as string[]) ?? []).slice(),
    }))
    .sort((a, b) => a.seedId.localeCompare(b.seedId));
}

export function buildCorpus(raw: RawCorpus): CorpusBundle {
  const documents = buildPolicyDocuments(raw.policyFiles);
  const { codes, defaultFloor } = buildReasonCodes(raw.taxonomy);
  const patterns = buildPatterns(raw.patterns);
  const seeds = buildSeeds(raw.seeds);

  const clausesById = new Map<string, PolicyClause>();
  const sourcesById = new Map<string, PolicySource>();
  for (const doc of documents) {
    sourcesById.set(doc.source.sourceId, doc.source);
    for (const clause of doc.clauses) {
      if (clausesById.has(clause.clauseId)) {
        throw new Error(`duplicate clause id ${clause.clauseId}`);
      }
      clausesById.set(clause.clauseId, clause);
    }
  }

  const ordered = new Map<ReasonCode, ReasonCodeRecord>();
  for (const code of REASON_CODES) {
    const record = codes.get(code);
    if (record) ordered.set(code, record);
  }

  return {
    corpusRelease: raw.corpusRelease,
    documents,
    clausesById,
    sourcesById,
    reasonCodes: ordered,
    patterns,
    seeds,
    defaultClassifierFloor: defaultFloor,
  };
}
