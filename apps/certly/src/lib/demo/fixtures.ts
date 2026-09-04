/**
 * THE THREE CERTLY-AUTHORED SAMPLE CERTIFICATES.
 *
 * `LANDING_SPEC.md` §8.1, rebuilt after REVIEW.md B-13. The first design used
 * three public certificates from `kb-samples/`, and three things were wrong
 * with it: `kb-samples/MANIFEST.md` §Licence stores that corpus "as fetched,
 * unmodified, as test fixtures" and forbids publishing it; the chips relabelled
 * named institutions' publications ("Roofer — expired last month" on a county's
 * own file); and it gave us whatever the corpus happened to contain rather than
 * the one clean, one expired and one waiver-missing case the demo needs.
 *
 * So these are OURS: fictional vendors, fictional insurers, fictional policy
 * numbers, our own layout. **The ISO form numbers are real**, because a form
 * number is a fact about the industry rather than somebody's document.
 *
 * THE DATES ARE RELATIVE TO THE DAY THE PAGE IS RENDERED, so "expired last
 * month" stays true in March as well as in September. Everything else is fixed.
 *
 * These payloads are AUTHORED RECORDS, not extractor output — M4's extractor is
 * not wired to this path, and the page says "read on our own sample
 * certificate" rather than claiming a live model call. What IS real is the
 * comparison: the same pure engine the product runs, on the same requirement
 * template a customer would apply.
 */

import type { CoiExtraction, Coverage, CoverageLimit, StringField } from '@/lib/engine';

const DAY = 86_400_000;

const iso = (date: Date): string => date.toISOString().slice(0, 10);
export const shift = (from: string, days: number): string =>
  iso(new Date(new Date(`${from}T00:00:00Z`).getTime() + days * DAY));

/** `{value, raw, page, source_text, confidence}` — the coi.v1 value object. */
const f = (value: string | null, raw = value, page = 1, confidence = 0.98): StringField => ({
  value,
  raw,
  page,
  source_text: raw,
  confidence,
});

const m = (amount: number | null, raw?: string, page = 1) => ({
  value: amount,
  raw: raw ?? (amount === null ? null : `$${amount.toLocaleString('en-US')}`),
  page,
  source_text: raw ?? (amount === null ? null : `$${amount.toLocaleString('en-US')}`),
  confidence: 0.98,
});

const limit = (label: CoverageLimit['label'], amount: number, printed: string): CoverageLimit => ({
  label,
  label_raw: f(printed),
  amount: m(amount),
});

type CoverageInput = {
  type: Coverage['type'];
  policyNumber: string;
  eff: string;
  exp: string;
  addlInsd?: string | null;
  subrWvd?: string | null;
  limits: CoverageLimit[];
  typeLabel: string;
  letter?: string;
};

const coverage = (input: CoverageInput): Coverage => ({
  insr_letter: f(input.letter ?? 'A'),
  type: input.type,
  type_label_raw: f(input.typeLabel),
  addl_insd: f(input.addlInsd ?? null),
  subr_wvd: f(input.subrWvd ?? null),
  policy_number: f(input.policyNumber),
  policy_eff: f(input.eff),
  policy_exp: f(input.exp),
  form_basis: f(input.type === 'general_liability' ? 'OCCUR' : null),
  aggregate_applies_per: f(input.type === 'general_liability' ? 'POLICY' : null),
  wc_officer_excluded: f(null),
  limits: input.limits,
});

export type DemoSampleId = 'landscaper' | 'roofer' | 'cleaner';

export type DemoSample = {
  id: DemoSampleId;
  /** The chip label — §2's copy, counted in the word budget. */
  chip: string;
  vendorName: string;
  insurerName: string;
  /** What this sample is FOR, in one clause, for the visually-hidden layer. */
  purpose: string;
  extraction: CoiExtraction;
};

/** The holder block the samples are made out to — ours, and fictional. */
export const DEMO_HOLDER = 'Rivergate Property Management LLC, 100 Harbor Street, Suite 4, Portland ME 04101';

function base(input: {
  insured: string;
  insurer: string;
  coverages: Coverage[];
  forms: CoiExtraction['endorsement_forms_mentioned'];
  today: string;
  description: string;
}): CoiExtraction {
  return {
    schema_version: 'coi.v1',
    document_kind: 'acord_25',
    form_edition: '2025/12',
    certificate_date: f(shift(input.today, -12)),
    producer: {
      name: f('Kestrel Insurance Services'),
      address: f('42 Bridge Street, Portland ME 04101'),
      // The producer's PERSON fields are never used by the demo and are null
      // here for the same reason `specs/15` §6 never stores them.
      contact_name: f(null),
      phone: f(null),
      fax: f(null),
      email: f(null),
    },
    insured: { name: f(input.insured), address: f('19 Mill Road, Portland ME 04102') },
    insurers: [{ letter: 'A', name: f(input.insurer), naic: f('10001') }],
    coverages: input.coverages,
    description_of_operations: f(input.description),
    endorsement_forms_mentioned: input.forms,
    certificate_holder: f(DEMO_HOLDER),
    authorized_representative_present: { value: true, raw: 'signed', page: 1, source_text: 'signed', confidence: 0.99 },
    acord_101_attached: { value: false, raw: null, page: 1, source_text: null, confidence: 0.95 },
    notes: 'Certly-authored sample. Fictional vendor, insurer and policy numbers; real ISO form numbers.',
  };
}

const glLimits = (): CoverageLimit[] => [
  limit('each_occurrence', 1_000_000, 'EACH OCCURRENCE'),
  limit('general_aggregate', 2_000_000, 'GENERAL AGGREGATE'),
  limit('products_comp_op_agg', 2_000_000, 'PRODUCTS - COMP/OP AGG'),
];

const autoLimits = (): CoverageLimit[] => [
  limit('combined_single_limit', 1_000_000, 'COMBINED SINGLE LIMIT'),
];

const wcLimits = (): CoverageLimit[] => [
  limit('el_each_accident', 1_000_000, 'E.L. EACH ACCIDENT'),
];

/**
 * Chip 1 — **meets** the residential requirement set. Every endorsement page is
 * attached, every limit clears, and the expiry is months away.
 */
function landscaper(today: string): DemoSample {
  const exp = shift(today, 158);
  return {
    id: 'landscaper',
    chip: 'Landscaper — looks fine',
    vendorName: 'Northgate Landscaping',
    insurerName: 'Meridian Casualty Company',
    purpose: 'a certificate that meets every requirement',
    extraction: base({
      today,
      insured: 'Northgate Landscaping',
      insurer: 'Meridian Casualty Company',
      description:
        'Certificate holder is additional insured per CG 20 10 04 13 and CG 20 37 04 13; waiver of subrogation per CG 24 04 05 09; primary and non-contributory per CG 20 01 04 13. Endorsement pages attached.',
      coverages: [
        coverage({
          type: 'general_liability',
          typeLabel: 'COMMERCIAL GENERAL LIABILITY',
          policyNumber: 'GL-4471902',
          eff: shift(today, -207),
          exp,
          addlInsd: 'Y',
          subrWvd: 'Y',
          limits: glLimits(),
        }),
        coverage({
          type: 'automobile_liability',
          typeLabel: 'AUTOMOBILE LIABILITY',
          policyNumber: 'CA-4471903',
          eff: shift(today, -207),
          exp,
          limits: autoLimits(),
          letter: 'A',
        }),
        coverage({
          type: 'workers_compensation',
          typeLabel: "WORKERS COMPENSATION AND EMPLOYERS' LIABILITY",
          policyNumber: 'WC-4471904',
          eff: shift(today, -207),
          exp,
          limits: wcLimits(),
          letter: 'A',
        }),
      ],
      forms: [
        { form_number: 'CG 20 10', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 20 37', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 24 04', edition: '05 09', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 20 01', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
      ],
    }),
  };
}

/** Chip 2 — the policy **expired** last month. Everything else is in order. */
function roofer(today: string): DemoSample {
  const exp = shift(today, -34);
  return {
    id: 'roofer',
    chip: 'Roofer — expired last month',
    vendorName: 'Harbor Roofing',
    insurerName: 'Fairline Mutual Insurance',
    purpose: 'a certificate whose general liability policy has already lapsed',
    extraction: base({
      today,
      insured: 'Harbor Roofing',
      insurer: 'Fairline Mutual Insurance',
      description:
        'Certificate holder is additional insured per CG 20 10 04 13 and CG 20 37 04 13; waiver of subrogation per CG 24 04 05 09; primary and non-contributory per CG 20 01 04 13. Endorsement pages attached.',
      coverages: [
        coverage({
          type: 'general_liability',
          typeLabel: 'COMMERCIAL GENERAL LIABILITY',
          policyNumber: 'GL-8830115',
          eff: shift(today, -399),
          exp,
          addlInsd: 'Y',
          subrWvd: 'Y',
          limits: glLimits(),
        }),
        coverage({
          type: 'automobile_liability',
          typeLabel: 'AUTOMOBILE LIABILITY',
          policyNumber: 'CA-8830116',
          eff: shift(today, -399),
          exp,
          limits: autoLimits(),
        }),
        coverage({
          type: 'workers_compensation',
          typeLabel: "WORKERS COMPENSATION AND EMPLOYERS' LIABILITY",
          policyNumber: 'WC-8830117',
          eff: shift(today, -399),
          exp,
          limits: wcLimits(),
        }),
      ],
      forms: [
        { form_number: 'CG 20 10', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 20 37', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 24 04', edition: '05 09', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 20 01', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
      ],
    }),
  };
}

/**
 * Chip 3 — the differentiator, in one document: `SUBR WVD: N` is a **gap**, and
 * `ADDL INSD: Y` with no endorsement page is **claimed, not evidenced**.
 */
function cleaner(today: string): DemoSample {
  const exp = shift(today, 96);
  return {
    id: 'cleaner',
    chip: 'Cleaner — no waiver attached',
    vendorName: 'Blue Line Facility Services',
    insurerName: 'Corvid Indemnity Company',
    purpose: 'a certificate that claims additional-insured status without evidencing it, and carries no waiver',
    extraction: base({
      today,
      insured: 'Blue Line Facility Services',
      insurer: 'Corvid Indemnity Company',
      description:
        'Certificate holder is additional insured where required by written contract. Primary and non-contributory per CG 20 01 04 13; completed operations per CG 20 37 04 13. Endorsement pages attached for CG 20 01 and CG 20 37.',
      coverages: [
        coverage({
          type: 'general_liability',
          typeLabel: 'COMMERCIAL GENERAL LIABILITY',
          policyNumber: 'GL-2210448',
          eff: shift(today, -269),
          exp,
          addlInsd: 'Y',
          subrWvd: 'N',
          limits: glLimits(),
        }),
        coverage({
          type: 'automobile_liability',
          typeLabel: 'AUTOMOBILE LIABILITY',
          policyNumber: 'CA-2210449',
          eff: shift(today, -269),
          exp,
          limits: autoLimits(),
        }),
        coverage({
          type: 'workers_compensation',
          typeLabel: "WORKERS COMPENSATION AND EMPLOYERS' LIABILITY",
          policyNumber: 'WC-2210450',
          eff: shift(today, -269),
          exp,
          limits: wcLimits(),
        }),
      ],
      forms: [
        { form_number: 'CG 20 37', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
        { form_number: 'CG 20 01', edition: '04 13', context: 'attached_endorsement_page', conditional: false },
      ],
    }),
  };
}

export function demoSamples(today: string): DemoSample[] {
  return [landscaper(today), roofer(today), cleaner(today)];
}

export function demoSample(id: DemoSampleId, today: string): DemoSample {
  const found = demoSamples(today).find((sample) => sample.id === id);
  if (!found) throw new Error(`no demo sample ${id}`);
  return found;
}
