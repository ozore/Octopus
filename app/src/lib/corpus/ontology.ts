/**
 * Gate G1 — every corpus record validates against its JSON Schema in
 * `corpus/ontology/`.
 *
 * Spec: CORPUS_DESIGN.md §7 gate G1, §3.3 (the ontology is the contract between
 * the corpus files and every consumer of them).
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM `gates.ts`. The other gates run against
 * the *built* bundle — camelCased, normalised, with defaults already applied by
 * `build.ts`. G1 is the opposite check: it asserts that the material `build.ts`
 * consumed was well formed in the first place. Validating the built bundle would
 * be circular, because the builder is exactly the thing that papers over a
 * missing field with a fallback. So G1 validates the CANONICAL SNAKE_CASE
 * RECORDS, which is what the schemas describe.
 *
 * For the three JSON families that is literally the bytes on disk. For L2 policy
 * clauses it is a projection: the markdown file is a *serialisation* of the
 * `schema.policy_clause.json` record — front matter is the `source` object
 * verbatim, and each `## clause:` section carries the clause fields with its
 * prose as `our_summary` and its `excerpt` meta key as `quoted_excerpt`. The
 * projection below is the inverse of that serialisation and nothing more; it
 * adds no defaults, so a field the file omits is a field the validator sees as
 * missing (which is the entire point of the gate).
 */

import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';

import { parsePolicyFile } from './parse';
import type { RawCorpus } from './build';

export type OntologySchemas = Readonly<Record<string, unknown>>;

/** The five ontology files, by the basename `readOntologySchemas` keys them on. */
export const ONTOLOGY_SCHEMA_FILES = [
  'schema.reason_code.json',
  'schema.policy_clause.json',
  'schema.appeal_pattern.json',
  'schema.seed_observation.json',
  'schema.outcome_record.json',
] as const;

export type CanonicalRecord = {
  /** Which ontology schema this record must satisfy. */
  schema: (typeof ONTOLOGY_SCHEMA_FILES)[number];
  /** A human-locatable id, used only in the violation message. */
  id: string;
  record: unknown;
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/**
 * Rebuilds one L2 record in its canonical shape from the markdown serialisation.
 * Optional fields stay absent when the file omits them — `additionalProperties:
 * false` and `required` in the schema are then both meaningful.
 */
function projectPolicyFile(name: string, content: string): CanonicalRecord {
  const parsed = parsePolicyFile(content);
  const sourceId = parsed.frontMatter['source_id'];

  const clauses = parsed.clauses.map((section) => {
    const clause: Record<string, unknown> = {
      clause_id: section.clauseId,
      source_id: typeof sourceId === 'string' ? sourceId : '',
      heading: section.meta['heading'],
      obligation_type: section.meta['obligation_type'],
      status: section.meta['status'],
      // The prose IS the summary, one entry per paragraph: CORPUS_DESIGN §3.6
      // stores our own words, and the file format expresses that by making the
      // body of a clause section the summary rather than a labelled field.
      // `build.ts` reads it the same way (`ourSummary: c.paragraphs`).
      our_summary: section.paragraphs,
      reason_codes: section.meta['reason_codes'] ?? [],
    };
    if (section.meta['excerpt'] !== undefined) clause['quoted_excerpt'] = section.meta['excerpt'];
    if (section.meta['supersedes'] !== undefined) clause['supersedes'] = section.meta['supersedes'];
    if (section.meta['token_estimate'] !== undefined) {
      clause['token_estimate'] = section.meta['token_estimate'];
    }
    return clause;
  });

  return {
    schema: 'schema.policy_clause.json',
    id: name,
    record: { source: parsed.frontMatter, clauses },
  };
}

/**
 * Every record in the corpus, in the shape its schema describes. `_stubs.md`
 * and any other L2 file are treated identically — a stub source is still a
 * source record and still has to be well formed.
 */
export function canonicalRecords(raw: RawCorpus): CanonicalRecord[] {
  const out: CanonicalRecord[] = [];

  const taxonomy = asRecord(JSON.parse(raw.taxonomy));
  for (const code of asArray(taxonomy['codes'])) {
    const id = String(asRecord(code)['code'] ?? '(unnamed code)');
    out.push({ schema: 'schema.reason_code.json', id, record: code });
  }

  const patterns = asRecord(JSON.parse(raw.patterns));
  for (const pattern of asArray(patterns['patterns'])) {
    const id = String(asRecord(pattern)['code'] ?? '(unnamed pattern)');
    out.push({ schema: 'schema.appeal_pattern.json', id, record: pattern });
  }

  const seeds = asRecord(JSON.parse(raw.seeds));
  for (const seed of asArray(seeds['observations'])) {
    const id = String(asRecord(seed)['seed_id'] ?? '(unnamed seed)');
    out.push({ schema: 'schema.seed_observation.json', id, record: seed });
  }

  for (const file of raw.policyFiles) {
    out.push(projectPolicyFile(file.name, file.content));
  }

  return out;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((e) => `${e.instancePath || '/'} ${e.message ?? 'is invalid'}`)
    .join('; ');
}

export type G1Violation = { gate: 'G1'; detail: string };

/**
 * Validates every canonical record against its schema.
 *
 * `strict: false` because the ontology files use `format: "date"` and
 * descriptions on `const`/`enum` members, neither of which ajv's strict mode
 * tolerates and both of which are legal JSON Schema 2020-12. Turning strict off
 * loosens ajv's opinion about the *schemas*, not its checking of the *records* —
 * `additionalProperties: false` and `required` are still enforced exactly.
 */
export function gateG1(schemas: OntologySchemas, records: readonly CanonicalRecord[]): G1Violation[] {
  const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });

  const compiled = new Map<string, ValidateFunction>();
  const out: G1Violation[] = [];

  for (const file of ONTOLOGY_SCHEMA_FILES) {
    const schema = schemas[file];
    if (schema === undefined) {
      out.push({ gate: 'G1', detail: `ontology schema ${file} is missing from corpus/ontology/` });
      continue;
    }
    try {
      compiled.set(file, ajv.compile(schema as object));
    } catch (err) {
      out.push({
        gate: 'G1',
        detail: `ontology schema ${file} does not compile: ${(err as Error).message}`,
      });
    }
  }

  for (const { schema, id, record } of records) {
    const validate = compiled.get(schema);
    if (!validate) continue; // Already reported as a missing/broken schema.
    if (!validate(record)) {
      out.push({ gate: 'G1', detail: `${id} fails ${schema}: ${formatErrors(validate.errors)}` });
    }
  }

  return out;
}
