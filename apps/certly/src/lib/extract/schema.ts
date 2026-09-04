/**
 * `coi.v1` — the JSON Schema and its Zod twin.
 *
 * `specs/03` §6: the committed file at `phase-4-revenue/certly/specs/schema/
 * coi.v1.schema.json` is the SINGLE source for the Anthropic request's
 * `output_config.format`, the response parser, the expected-value files and the
 * review screen's field list. Wave 2 copies it to
 * `src/lib/extract/schema/coi.v1.schema.json` and a CI check asserts the two are
 * byte-identical (`tests/extract/schema.test.ts`). Four hand-maintained copies
 * is how a schema drifts.
 *
 * The Zod object below is NOT a second source of truth. It is the runtime
 * parser, and `tests/extract/schema.test.ts` asserts key-for-key that it and the
 * JSON Schema describe the same record — so a property added to one and not the
 * other fails the suite rather than silently dropping a field.
 */

import { z } from 'zod';

import {
  COVERAGE_TYPES,
  DOCUMENT_KINDS,
  FORM_EDITIONS,
  LIMIT_LABELS,
  type CoiExtraction,
} from '../engine';

import schemaJson from './schema/coi.v1.schema.json' with { type: 'json' };

export const COI_SCHEMA: Record<string, unknown> = schemaJson as unknown as Record<string, unknown>;
export const COI_SCHEMA_NAME = 'coi_v1';
export const SCHEMA_VERSION = 'coi.v1';

const confidence = z.number().min(0).max(1);
const page = z.number().int().min(1).nullable();
const sourceText = z.string().max(200).nullable();

const stringField = z.object({
  value: z.string().nullable(),
  raw: z.string().nullable(),
  page,
  source_text: sourceText,
  confidence,
});
const dateField = stringField;
const moneyField = z.object({
  value: z.number().min(0).nullable(),
  raw: z.string().nullable(),
  page,
  source_text: sourceText,
  confidence,
});
const boolField = z.object({
  value: z.boolean().nullable(),
  raw: z.string().nullable(),
  page,
  source_text: sourceText,
  confidence,
});

const limit = z.object({
  label: z.enum(LIMIT_LABELS),
  label_raw: stringField,
  amount: moneyField,
});

const coverage = z.object({
  insr_letter: stringField,
  type: z.enum(COVERAGE_TYPES),
  type_label_raw: stringField,
  addl_insd: stringField,
  subr_wvd: stringField,
  policy_number: stringField,
  policy_eff: dateField,
  policy_exp: dateField,
  form_basis: stringField,
  aggregate_applies_per: stringField,
  wc_officer_excluded: stringField,
  limits: z.array(limit).max(12),
});

export const coiV1 = z.object({
  schema_version: z.literal('coi.v1'),
  document_kind: z.enum(DOCUMENT_KINDS),
  form_edition: z.enum(FORM_EDITIONS),
  certificate_date: dateField,
  producer: z.object({
    name: stringField,
    address: stringField,
    contact_name: stringField,
    phone: stringField,
    fax: stringField,
    email: stringField,
  }),
  insured: z.object({ name: stringField, address: stringField }),
  insurers: z
    .array(
      z.object({
        letter: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
        name: stringField,
        naic: stringField,
      }),
    )
    .max(6),
  coverages: z.array(coverage).max(12),
  description_of_operations: stringField,
  endorsement_forms_mentioned: z
    .array(
      z.object({
        form_number: z.string(),
        edition: z.string().nullable(),
        context: z.enum(['description_of_operations', 'attached_endorsement_page', 'other']),
        conditional: z.boolean(),
      }),
    )
    .max(20),
  certificate_holder: stringField,
  authorized_representative_present: boolField,
  acord_101_attached: boolField,
  notes: z.string().max(600),
});

export type CoiV1 = z.infer<typeof coiV1>;

/** Parses AND narrows to the engine's own type, so nothing downstream re-checks. */
export function parseCoi(input: unknown): CoiExtraction {
  return coiV1.parse(input) as unknown as CoiExtraction;
}

export function safeParseCoi(
  input: unknown,
): { ok: true; payload: CoiExtraction } | { ok: false; issues: string[] } {
  const parsed = coiV1.safeParse(input);
  if (parsed.success) return { ok: true, payload: parsed.data as unknown as CoiExtraction };
  return {
    ok: false,
    issues: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  };
}

/**
 * The three structural rules the structured-outputs API enforces (`specs/03` §6).
 * Asserted here as well as in `kb:check` because the request would 400 at
 * runtime, and a 400 on a customer's upload is a worse place to learn it.
 */
export function structuredOutputViolations(schema: unknown): string[] {
  const problems: string[] = [];
  const seen = new Set<unknown>();

  const visit = (node: unknown, path: string): void => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    const obj = node as Record<string, unknown>;

    if (obj['type'] === 'object') {
      if (obj['additionalProperties'] !== false) {
        problems.push(`${path}: object without additionalProperties:false`);
      }
      const properties = (obj['properties'] ?? {}) as Record<string, unknown>;
      const required = new Set((obj['required'] ?? []) as string[]);
      for (const key of Object.keys(properties)) {
        if (!required.has(key)) problems.push(`${path}: "${key}" is not in required`);
      }
    }
    if (typeof obj['$ref'] === 'string') {
      const ref = obj['$ref'];
      if (!ref.startsWith('#/$defs/')) problems.push(`${path}: $ref "${ref}" is not local`);
      else {
        const defs = (COI_SCHEMA['$defs'] ?? {}) as Record<string, unknown>;
        if (!(ref.slice('#/$defs/'.length) in defs)) problems.push(`${path}: $ref "${ref}" does not resolve`);
      }
    }
    for (const [key, child] of Object.entries(obj)) {
      if (key === 'enum' || key === 'required') continue;
      visit(child, `${path}/${key}`);
    }
  };

  visit(schema, '');
  return problems;
}
