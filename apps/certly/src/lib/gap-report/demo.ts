/**
 * THE SAMPLES-ONLY DEMO — `LANDING_SPEC.md` §8.1, `specs/15`'s launch gate.
 *
 * Until the founder's legal read lands, this is the only thing on a public
 * surface that reads a certificate. It is the hero interaction, so three things
 * about it are decisions rather than convenience:
 *
 *  1. **The fixtures are CERTLY-AUTHORED** (REVIEW.md B-13). The first design
 *     used three documents from `kb-samples/certificates/`, whose own manifest
 *     says we do not publish them — and it relabelled named institutions'
 *     publications ("Roofer — expired last month") to make the demo's point.
 *     These three are ours: fictional vendors, fictional insurers, fictional
 *     policy numbers, **real ISO form numbers**, and no third party's document
 *     anywhere near a marketing page.
 *  2. **The three cases are chosen, not found.** One meets a residential
 *     requirement set; one has an expired policy; one carries `SUBR WVD: N`
 *     (a gap) *and* an `ADDL INSD: Y` with no endorsement page — so the demo
 *     also shows "claimed, not evidenced", which is the differentiator.
 *  3. **There is no model call at request time.** §8.1 is explicit: a live call
 *     in the hero puts the page's most important interaction behind a latency
 *     and an availability risk, and the demo would be the first thing to break
 *     on a bad afternoon. The payloads below are the extraction; the REAL
 *     comparison engine runs over them at module load, which is cheap, pure and
 *     offline, and `cachedDemoReport()` memoises the result.
 *
 * **Deviation, recorded.** §8.1 says each fixture is "run through the real
 * extractor … at build time". The real extractor is M4's and is being built in
 * parallel; a payload cannot be produced from it here without a model call, so
 * these payloads are authored to the same `coi.v1` schema by hand and the real
 * ENGINE is what produces the finding. When M4 lands, re-deriving them through
 * the extractor changes this file and nothing else. Noted in `CLAUDE.md`.
 */

import type { CoiExtraction, Coverage, DateField, MoneyField, StringField } from '../engine';
import { getTemplate, toRequirementSet } from '../templates';

import { buildGapReport, type GapReport } from './report';

/** The demo's "today". Fixed, so the finding never changes under a reader. */
export const DEMO_EVALUATION_DATE = '2026-09-01';

const field = (value: string | null, page = 1): StringField => ({
  value,
  raw: value,
  page,
  source_text: value,
  confidence: 0.97,
});
const dateField = (value: string | null, page = 1): DateField => field(value, page);
const moneyField = (value: number | null, raw?: string, page = 1): MoneyField => ({
  value,
  raw: raw ?? (value === null ? null : `$${value.toLocaleString('en-US')}`),
  page,
  source_text: raw ?? (value === null ? null : `$${value.toLocaleString('en-US')}`),
  confidence: 0.97,
});

function gl(options: {
  eff: string;
  exp: string;
  each: number;
  aggregate: number;
  products: number;
  addlInsd?: string | null;
  subrWvd?: string | null;
}): Coverage {
  return {
    insr_letter: field('A'),
    type: 'general_liability',
    type_label_raw: field('COMMERCIAL GENERAL LIABILITY'),
    addl_insd: field(options.addlInsd ?? null),
    subr_wvd: field(options.subrWvd ?? null),
    policy_number: field('CGL-DEMO-0001'),
    policy_eff: dateField(options.eff),
    policy_exp: dateField(options.exp),
    form_basis: field('OCCUR'),
    aggregate_applies_per: field('POLICY'),
    wc_officer_excluded: field(null),
    limits: [
      { label: 'each_occurrence', label_raw: field('EACH OCCURRENCE'), amount: moneyField(options.each) },
      { label: 'general_aggregate', label_raw: field('GENERAL AGGREGATE'), amount: moneyField(options.aggregate) },
      {
        label: 'products_comp_op_agg',
        label_raw: field('PRODUCTS - COMP/OP AGG'),
        amount: moneyField(options.products),
      },
    ],
  };
}

function auto(options: { eff: string; exp: string; csl: number }): Coverage {
  return {
    insr_letter: field('B'),
    type: 'automobile_liability',
    type_label_raw: field('AUTOMOBILE LIABILITY'),
    addl_insd: field(null),
    subr_wvd: field(null),
    policy_number: field('AUTO-DEMO-0001'),
    policy_eff: dateField(options.eff),
    policy_exp: dateField(options.exp),
    form_basis: field(null),
    aggregate_applies_per: field(null),
    wc_officer_excluded: field(null),
    limits: [
      {
        label: 'combined_single_limit',
        label_raw: field('COMBINED SINGLE LIMIT'),
        amount: moneyField(options.csl),
      },
    ],
  };
}

function wc(options: { eff: string; exp: string }): Coverage {
  return {
    insr_letter: field('C'),
    type: 'workers_compensation',
    type_label_raw: field("WORKERS COMPENSATION AND EMPLOYERS' LIABILITY"),
    addl_insd: field(null),
    subr_wvd: field(null),
    policy_number: field('WC-DEMO-0001'),
    policy_eff: dateField(options.eff),
    policy_exp: dateField(options.exp),
    form_basis: field(null),
    aggregate_applies_per: field(null),
    wc_officer_excluded: field('N'),
    limits: [
      { label: 'el_each_accident', label_raw: field('E.L. EACH ACCIDENT'), amount: moneyField(1_000_000) },
      {
        label: 'el_disease_ea_employee',
        label_raw: field('E.L. DISEASE - EA EMPLOYEE'),
        amount: moneyField(1_000_000),
      },
      {
        label: 'el_disease_policy_limit',
        label_raw: field('E.L. DISEASE - POLICY LIMIT'),
        amount: moneyField(1_000_000),
      },
    ],
  };
}

function certificate(options: {
  insured: string;
  producer: string;
  coverages: Coverage[];
  description?: string | null;
  forms?: CoiExtraction['endorsement_forms_mentioned'];
  certificateDate: string;
}): CoiExtraction {
  return {
    schema_version: 'coi.v1',
    document_kind: 'acord_25',
    form_edition: '2016/03',
    certificate_date: dateField(options.certificateDate),
    producer: {
      name: field(options.producer),
      address: field('1 Example Way, Springfield'),
      // Authored fixtures carry NO producer contact person, by construction —
      // the same rule the anonymous path enforces at runtime (§5.1).
      contact_name: field(null),
      phone: field(null),
      fax: field(null),
      email: field(null),
    },
    insured: { name: field(options.insured), address: field('44 Trade Street, Springfield') },
    insurers: [
      { letter: 'A', name: field('Meridian Casualty (sample)'), naic: field('99991') },
      { letter: 'B', name: field('Meridian Auto (sample)'), naic: field('99992') },
      { letter: 'C', name: field('Meridian Comp (sample)'), naic: field('99993') },
    ],
    coverages: options.coverages,
    description_of_operations: field(options.description ?? null),
    endorsement_forms_mentioned: options.forms ?? [],
    certificate_holder: field('SAMPLE PROPERTY MANAGEMENT'),
    authorized_representative_present: { value: true, raw: 'signed', page: 1, source_text: 'signed', confidence: 0.99 },
    acord_101_attached: { value: false, raw: null, page: null, source_text: null, confidence: 0.9 },
    notes: 'Certly-authored sample. Fictional vendor, insurer and policy numbers; real ISO form numbers.',
  };
}

export type DemoSample = {
  slug: string;
  label: string;
  /** What this sample is here to show, in one line, for the chip. */
  teaser: string;
  filename: string;
  payload: CoiExtraction;
};

/** Chip 1 — meets a residential requirement set. */
const NORTHGATE: DemoSample = {
  slug: 'northgate-landscaping',
  label: 'Northgate Landscaping',
  teaser: 'Meets requirements',
  filename: 'northgate-landscaping-acord25.pdf',
  payload: certificate({
    insured: 'NORTHGATE LANDSCAPING LLC',
    producer: 'Springfield Insurance Partners (sample)',
    certificateDate: '2026-04-02',
    coverages: [
      gl({ eff: '2026-04-01', exp: '2027-04-01', each: 1_000_000, aggregate: 2_000_000, products: 2_000_000, addlInsd: 'Y', subrWvd: 'Y' }),
      auto({ eff: '2026-04-01', exp: '2027-04-01', csl: 1_000_000 }),
      wc({ eff: '2026-04-01', exp: '2027-04-01' }),
    ],
    description:
      'Sample Property Management is named as additional insured per CG 20 10 04 13 and CG 20 37 04 13. Waiver of subrogation applies per CG 24 04.',
    forms: [
      { form_number: 'CG 20 10', edition: '04 13', context: 'description_of_operations', conditional: false },
      { form_number: 'CG 20 37', edition: '04 13', context: 'description_of_operations', conditional: false },
      { form_number: 'CG 24 04', edition: null, context: 'description_of_operations', conditional: false },
    ],
  }),
};

/** Chip 2 — an expired policy. The single most valuable finding this makes. */
const HARBOR: DemoSample = {
  slug: 'harbor-roofing',
  label: 'Harbor Roofing',
  teaser: 'Expired',
  filename: 'harbor-roofing-acord25.pdf',
  payload: certificate({
    insured: 'HARBOR ROOFING CO.',
    producer: 'Springfield Insurance Partners (sample)',
    certificateDate: '2025-07-14',
    coverages: [
      gl({ eff: '2025-07-15', exp: '2026-07-15', each: 1_000_000, aggregate: 2_000_000, products: 2_000_000, addlInsd: 'Y', subrWvd: 'Y' }),
      auto({ eff: '2025-07-15', exp: '2026-07-15', csl: 1_000_000 }),
      wc({ eff: '2025-07-15', exp: '2026-07-15' }),
    ],
    description: 'Sample Property Management is named as additional insured per CG 20 10 and CG 20 37.',
    forms: [
      { form_number: 'CG 20 10', edition: null, context: 'description_of_operations', conditional: false },
      { form_number: 'CG 20 37', edition: null, context: 'description_of_operations', conditional: false },
    ],
  }),
};

/** Chip 3 — a gap AND "claimed, not evidenced", which is the differentiator. */
const BLUE_LINE: DemoSample = {
  slug: 'blue-line-facility-services',
  label: 'Blue Line Facility Services',
  teaser: 'A gap, and an endorsement claimed but not evidenced',
  filename: 'blue-line-facility-services-acord25.pdf',
  payload: certificate({
    insured: 'BLUE LINE FACILITY SERVICES INC.',
    producer: 'Springfield Insurance Partners (sample)',
    certificateDate: '2026-05-20',
    coverages: [
      // ADDL INSD is ticked and NOTHING names a form: a claim, never proof.
      // SUBR WVD is N, which is a plain gap.
      gl({ eff: '2026-05-01', exp: '2027-05-01', each: 1_000_000, aggregate: 1_000_000, products: 1_000_000, addlInsd: 'Y', subrWvd: 'N' }),
      auto({ eff: '2026-05-01', exp: '2027-05-01', csl: 1_000_000 }),
      wc({ eff: '2026-05-01', exp: '2027-05-01' }),
    ],
    description: 'Janitorial services. Certificate holder is included as additional insured where required by written contract.',
    forms: [],
  }),
};

export const DEMO_SAMPLES: DemoSample[] = [NORTHGATE, HARBOR, BLUE_LINE];
export const DEMO_TEMPLATE_ID = 'pm.baseline';

export function getDemoSample(slug: string): DemoSample | null {
  return DEMO_SAMPLES.find((sample) => sample.slug === slug) ?? null;
}

let cached: GapReport | null = null;

/**
 * The demo's finding, computed once per process by the REAL engine over the
 * REAL library template. No model call, no database, no network — which is what
 * lets `LANDING_SPEC.md` §8.1's 1.5s first-paint budget be a property of the
 * page rather than a hope about an API.
 */
export function cachedDemoReport(): GapReport {
  if (cached) return cached;
  const template = getTemplate(DEMO_TEMPLATE_ID);
  if (!template) throw new Error(`the demo template ${DEMO_TEMPLATE_ID} is missing from the library`);
  cached = buildGapReport({
    documents: DEMO_SAMPLES.map((sample) => ({
      documentId: sample.slug,
      originalFilename: sample.filename,
      insuredNameRead: sample.payload.insured.name.value,
      status: 'ready' as const,
      reason: null,
      payload: sample.payload,
    })),
    requirementSet: toRequirementSet(template),
    templateName: template.label,
    evaluationDate: DEMO_EVALUATION_DATE,
  });
  return cached;
}
