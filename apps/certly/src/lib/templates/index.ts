/**
 * The requirement-template library — `KNOWLEDGE_BASE.md` §B as data.
 *
 * Fifteen templates across four audiences. `listTemplates()` reads THE REPO,
 * never the database (`specs/02` §5): a template is content, and a customer's
 * requirement set is a copy of it.
 *
 * The JSON files are imported statically rather than globbed from disk, because
 * a glob does not survive the Next.js bundler and "the library is empty in
 * production" is a failure that would only show up after deploy.
 */

import { templateSchema, type RequirementTemplate, type TemplateRow } from './schema';
import type { Requirement, RequirementSet } from '../engine';

import gcBaseline from './library/gc.baseline.json';
import gcDesignBuild from './library/gc.design_build.json';
import gcHazmatHauling from './library/gc.hazmat_hauling.json';
import gcMechanical from './library/gc.mechanical.json';
import gcPollution from './library/gc.pollution.json';
import gcTradeHighHazard from './library/gc.trade.high_hazard.json';
import hoaBaseline from './library/hoa.baseline.json';
import hoaImprovements from './library/hoa.improvements.json';
import pmBaseline from './library/pm.baseline.json';
import pmCommercialBaseline from './library/pm.commercial.baseline.json';
import pmRoutine from './library/pm.routine.json';
import pmSnow from './library/pm.snow.json';
import pmStructural from './library/pm.structural.json';
import tenantCommercialBaseline from './library/tenant.commercial.baseline.json';
import tenantRetailFood from './library/tenant.retail_food.json';

/**
 * The library's version. Bumped whenever a template row changes, so that
 * `requirementSets.sourceTemplateVersion` records which library a customer
 * copied from and `previewTemplateUpdate` can diff against it (`specs/02` §5).
 */
export const TEMPLATE_LIBRARY_VERSION = 1;

const RAW: unknown[] = [
  pmBaseline,
  pmCommercialBaseline,
  pmRoutine,
  pmStructural,
  pmSnow,
  hoaBaseline,
  hoaImprovements,
  gcBaseline,
  gcTradeHighHazard,
  gcMechanical,
  gcHazmatHauling,
  gcPollution,
  gcDesignBuild,
  tenantCommercialBaseline,
  tenantRetailFood,
];

/**
 * Parsed once at module load. A malformed template is a startup failure, not a
 * runtime surprise on the day a customer opens the library — `kb:check` and
 * `tests/templates.test.ts` catch it long before that, and this is the belt.
 */
export const templates: RequirementTemplate[] = RAW.map((raw) => {
  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    const id = typeof raw === 'object' && raw !== null && 'id' in raw ? String((raw as { id: unknown }).id) : '(unknown)';
    throw new Error(`Requirement template ${id} is invalid: ${JSON.stringify(parsed.error.issues)}`);
  }
  return parsed.data;
});

export const templatesById: Record<string, RequirementTemplate> = Object.fromEntries(
  templates.map((template) => [template.id, template]),
);

export type Audience = RequirementTemplate['audience'];

export type TemplateSummary = {
  id: string;
  audience: Audience;
  label: string;
  summary: string;
  confidence: RequirementTemplate['confidence'];
  unverified: boolean;
  unverifiedNote: string | null;
  rowCount: number;
  sourceCount: number;
  /** The oldest `last_verified` across the template's sources (KB §E). */
  lastVerified: string | null;
  coverageSummary: string;
};

const COVERAGE_SHORT: Record<string, string> = {
  general_liability: 'GL',
  automobile_liability: 'Auto',
  umbrella_liability: 'Umbrella',
  excess_liability: 'Excess',
  workers_compensation: 'WC',
  other: 'Other',
};

function coverageSummary(template: RequirementTemplate): string {
  const seen: string[] = [];
  for (const row of template.requirements) {
    if (row.kind === 'limit' || row.kind === 'coverage_present') {
      const short = row.other_label ?? COVERAGE_SHORT[row.coverage] ?? row.coverage;
      if (!seen.includes(short)) seen.push(short);
    }
  }
  const endorsements = template.requirements.filter((row) => row.kind === 'endorsement').length;
  return endorsements > 0 ? `${seen.join(' · ')} · ${endorsements} endorsements` : seen.join(' · ');
}

export function summarise(template: RequirementTemplate): TemplateSummary {
  const dates = template.sources.map((source) => source.last_verified).sort();
  return {
    id: template.id,
    audience: template.audience,
    label: template.label,
    summary: template.summary,
    confidence: template.confidence,
    unverified: template.unverified,
    unverifiedNote: template.unverified_note ?? null,
    rowCount: template.requirements.length,
    sourceCount: template.sources.length,
    lastVerified: dates[0] ?? null,
    coverageSummary: coverageSummary(template),
  };
}

/** `specs/02` §5 — reads the repo JSON, not the DB. */
export function listTemplates(audience?: Audience): TemplateSummary[] {
  return templates
    .filter((template) => (audience ? template.audience === audience : true))
    .map(summarise);
}

export function getTemplate(id: string): RequirementTemplate | null {
  return templatesById[id] ?? null;
}

// ---------------------------------------------------------------------------
// Template row → engine Requirement
// ---------------------------------------------------------------------------

function rowToRequirement(row: TemplateRow, index: number, prefix: string): Requirement {
  const base = {
    id: `${prefix}:${index}`,
    coverage: null,
    limitLabel: null,
    minAmount: null,
    combinable: false,
    endorsementKey: null,
    acceptsForms: [] as string[],
    condition: null,
    otherLabel: null,
    label: null,
    severity: row.severity,
    note: row.note ?? null,
    sortOrder: index,
  } satisfies Omit<Requirement, 'kind'> & { kind?: never };

  switch (row.kind) {
    case 'limit':
      return {
        ...base,
        kind: 'limit',
        coverage: row.coverage,
        limitLabel: row.limit,
        minAmount: row.min,
        combinable: row.combinable ?? false,
        otherLabel: row.other_label ?? null,
      };
    case 'coverage_present':
      return { ...base, kind: 'coverage_present', coverage: row.coverage, otherLabel: row.other_label ?? null };
    case 'endorsement':
      return { ...base, kind: 'endorsement', endorsementKey: row.endorsement, acceptsForms: row.accepts };
    case 'policy_condition':
      return {
        ...base,
        kind: 'policy_condition',
        coverage: row.coverage ?? null,
        label: row.label ?? null,
        condition: {
          ...(row.form ? { formBasis: row.form } : {}),
          ...(row.aggregate_applies_per ? { aggregateAppliesPer: row.aggregate_applies_per } : {}),
          ...(typeof row.max_sir === 'number' ? { maxSir: row.max_sir } : {}),
          ...(row.stop_gap_states ? { wcStopGapStates: row.stop_gap_states } : {}),
          ...(row.manual_check ? { manualCheck: row.manual_check } : {}),
        },
      };
    case 'carrier':
      return {
        ...base,
        kind: 'carrier',
        condition: {
          amBestMin: row.am_best_min,
          ...(row.financial_size_min ? { financialSizeMin: row.financial_size_min } : {}),
        },
      };
    default: {
      const exhaustive: never = row;
      throw new Error(`unknown template row: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * A template as the engine sees it. `applyTemplate` (M2, sub-wave B) writes the
 * same rows into `requirement_sets` / `requirements` and stamps
 * `sourceTemplateVersion` — this function is what makes the library previewable
 * and testable before any of that exists.
 */
export function toRequirementSet(template: RequirementTemplate, version = TEMPLATE_LIBRARY_VERSION): RequirementSet {
  return {
    id: template.id,
    name: template.label,
    audience: template.audience,
    version,
    requirements: template.requirements.map((row, index) => rowToRequirement(row, index, template.id)),
  };
}

export { templateSchema } from './schema';
export type { RequirementTemplate, TemplateRow, TemplateSource } from './schema';
export { endorsementGlossary, glossaryByForm, type GlossaryEntry } from './endorsements';
