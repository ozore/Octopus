/**
 * The requirement-template library's schema (M2 data, `KNOWLEDGE_BASE.md` §B).
 *
 * The library ships as JSON in the repo — CONTENT, not rows (`specs/02` §4).
 * A customer's requirement set is a COPY of a template, stamped with the
 * version it was copied from, so that updating the library next quarter never
 * changes anybody's requirements under them.
 *
 * Every row carries its provenance. `sources[]` is not decoration: `specs/02`
 * A2 requires each limit row's source link to resolve, and A4 requires a
 * `last_verified` date next to a row older than 180 days. That dated, fetchable
 * source is differentiator D3 — per-vendor-type templates are table stakes;
 * templates that cite where the number came from are not.
 *
 * DEVIATION from `KNOWLEDGE_BASE.md` §B.0, recorded as D-1 in BUILD.md: rows
 * carry an explicit `kind` discriminator. §B.0's shape infers the kind from
 * which keys are present (`limit` vs `endorsement` vs `carrier_rating`), which
 * validates weakly and mis-parses silently when a key is misspelled. The field
 * NAMES are §B.0's; only the discriminator is added.
 */

import { z } from 'zod';

import { COVERAGE_TYPES, ENDORSEMENT_KEYS, LIMIT_LABELS } from '../engine';

const severity = z.enum(['blocking', 'advisory']).default('blocking');
const note = z.string().min(1).max(600).optional();

const limitRow = z.object({
  kind: z.literal('limit'),
  coverage: z.enum(COVERAGE_TYPES),
  limit: z.enum(LIMIT_LABELS),
  min: z.number().int().min(1).max(1_000_000_000),
  combinable: z.boolean().optional(),
  other_label: z.string().min(1).max(120).optional(),
  severity,
  note,
});

const coveragePresentRow = z.object({
  kind: z.literal('coverage_present'),
  coverage: z.enum(COVERAGE_TYPES),
  other_label: z.string().min(1).max(120).optional(),
  severity,
  note,
});

const endorsementRow = z.object({
  kind: z.literal('endorsement'),
  endorsement: z.enum(ENDORSEMENT_KEYS),
  /** ALWAYS a list (KB §B.0). Sierra Madre publishes four acceptable waivers. */
  accepts: z.array(z.string().min(2).max(40)).min(1),
  severity,
  note,
});

const policyConditionRow = z
  .object({
    kind: z.literal('policy_condition'),
    coverage: z.enum(COVERAGE_TYPES).optional(),
    form: z.enum(['occurrence', 'claims_made']).optional(),
    aggregate_applies_per: z.enum(['policy', 'project', 'loc']).optional(),
    max_sir: z.number().int().min(0).optional(),
    stop_gap_states: z.array(z.string().length(2)).optional(),
    /** A condition Certly does not read at launch, named honestly. */
    manual_check: z.string().min(2).max(120).optional(),
    label: z.string().min(2).max(120).optional(),
    severity,
    note,
  })
  .refine(
    (row) =>
      Boolean(row.form || row.aggregate_applies_per || typeof row.max_sir === 'number' || row.stop_gap_states || row.manual_check),
    { message: 'a policy_condition row must name a condition' },
  );

const carrierRow = z.object({
  kind: z.literal('carrier'),
  am_best_min: z.string().min(1).max(8),
  financial_size_min: z.string().min(1).max(8).optional(),
  severity,
  note,
});

export const templateRowSchema = z.union([
  limitRow,
  coveragePresentRow,
  endorsementRow,
  policyConditionRow,
  carrierRow,
]);

export const templateSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(3).max(200),
  /** `YYYY-MM-DD`. KB §E: a row older than 180 days shows its date in the app. */
  last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Two independent agent ids, per PLAN.md §A10, for a `high` confidence row. */
  verified_by: z.array(z.string().min(2)).min(1),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const templateSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_.]*$/),
    audience: z.enum(['pm', 'hoa', 'gc', 'tenant']),
    label: z.string().min(4).max(160),
    summary: z.string().min(20).max(600),
    confidence: z.enum(['high', 'medium', 'low']),
    /** `specs/02` A7: an unverified template says so, in the UI, in its own words. */
    unverified: z.boolean(),
    unverified_note: z.string().min(20).max(400).optional(),
    requirements: z.array(templateRowSchema).min(1),
    sources: z.array(templateSourceSchema),
  })
  .refine((template) => !template.unverified || Boolean(template.unverified_note), {
    message: 'an `unverified` template must carry an `unverified_note` explaining what is not sourced',
  })
  .refine((template) => template.unverified || template.sources.length > 0, {
    message: 'a template that is not flagged `unverified` must cite at least one source',
  })
  .refine((template) => template.confidence !== 'high' || template.sources.some((s) => s.confidence === 'high'), {
    message: 'a `high` confidence template must rest on at least one `high` confidence source',
  });

export type TemplateRow = z.infer<typeof templateRowSchema>;
export type TemplateSource = z.infer<typeof templateSourceSchema>;
export type RequirementTemplate = z.infer<typeof templateSchema>;
