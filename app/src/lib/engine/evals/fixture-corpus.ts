/**
 * A SYNTHETIC corpus for the evaluation harness and the engine's unit tests.
 *
 * THIS IS NOT THE CORPUS. The real corpus lives in `src/lib/corpus/`, is built
 * from `phase-2-build/corpus/` (CORPUS_DESIGN §2.1) and carries a real
 * `corpus_release` and `prompt_bundle_hash`. Everything here is authored from
 * the L1 reason-code table for the sole purpose of exercising engine mechanics
 * with no build artifact and no network, and it is labelled synthetic wherever
 * it surfaces (LLM_ENGINE §8.1: a synthetic fixture satisfies coverage but is
 * reported separately, and is explicitly not evidence that the classifier
 * handles real notices for that code).
 *
 * Clause ids follow the corpus identifier grammar `{source_id}#{slug}`
 * (CORPUS_DESIGN §2.3) so that engine-side resolution is exercised against the
 * shape it will meet in production.
 */

import type { CorpusProvider } from '../corpus-port';
import { REASON_CODES, REASON_CODE_TABLE, type ReasonCode } from '../../domain/reason-codes';
import type {
  CorpusClause,
  CorpusDocument,
  CorpusSlice,
  RubricSpec,
  TaxonomyRecord,
} from '../../domain/types';

export const FIXTURE_CORPUS_RELEASE = 0;
export const FIXTURE_PROMPT_BUNDLE_HASH = 'synthetic-fixture-bundle';

type ClauseSeed = {
  slug: string;
  heading: string;
  ourSummary: string;
  quotedExcerpt?: string;
  obligationType: CorpusClause['obligationType'];
};

type Seed = {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  triggerPhrases: string[];
  requiredEvidence: string[];
  failureModes: string[];
  clauses: ClauseSeed[];
  pattern: { strong: string; weak: string; evidence: string };
  rubric: { id: string; label: string; weight: number }[];
};

const AMZ_INAUTHENTIC: Seed = {
  sourceId: 'amz.psaa',
  sourceTitle: 'Amazon — Product Authenticity and Quality policy',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201165970',
  triggerPhrases: [
    'complaints about the authenticity',
    'inauthentic items',
    'invoices from your supplier',
  ],
  requiredEvidence: ['supplier invoices from the last 365 days', 'brand authorisation letter'],
  failureModes: ['blaming the buyer', 'submitting receipts rather than invoices'],
  clauses: [
    {
      slug: 'sourcing-documentation',
      heading: 'Sourcing documentation',
      ourSummary:
        'Sellers are expected to hold invoices from a supplier that identify the brand and cover the units sold in the period under review, and to produce them on request.',
      quotedExcerpt: 'invoices issued in the last 365 days',
      obligationType: 'requirement',
    },
    {
      slug: 'authenticity-standard',
      heading: 'Authenticity standard',
      ourSummary:
        'Products offered must be genuine and sourced through a channel the brand owner authorises for resale.',
      obligationType: 'standard',
    },
  ],
  pattern: {
    strong:
      'A strong root cause names the specific purchase order and supplier that produced the units complained about, and states what changed in sourcing.',
    weak: 'A weak root cause disputes the buyer complaint without addressing sourcing at all.',
    evidence: 'Attach supplier invoices covering the units sold and any brand authorisation held.',
  },
  rubric: [
    { id: 'supplier_invoices_referenced', label: 'Names the supplier invoices held', weight: 30 },
    { id: 'root_cause_specific', label: 'Root cause names the operational failure', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 25 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 20 },
  ],
};

const AMZ_ODR: Seed = {
  sourceId: 'amz.perf',
  sourceTitle: 'Amazon — Customer Service Performance (Order Defect Rate)',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G200205250',
  triggerPhrases: ['order defect rate', 'exceeded the target of 1%', 'negative feedback'],
  requiredEvidence: ['defect breakdown by order', 'root cause per defect category'],
  failureModes: ['treating the metric as a single event', 'no measurable monitoring cadence'],
  clauses: [
    {
      slug: 'odr-target',
      heading: 'Order Defect Rate target',
      ourSummary:
        'Selling accounts are expected to keep the order defect rate under one percent, measured across negative feedback, A-to-z claims and service chargebacks.',
      quotedExcerpt: 'under 1%',
      obligationType: 'standard',
    },
    {
      slug: 'defect-attribution',
      heading: 'Defect attribution',
      ourSummary:
        'Each defect is attributed to the order that produced it, so a plan of action is expected to address the categories that drove the rate rather than the rate itself.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong:
      'A strong root cause splits the defect count by category and names the operational step that produced the largest share.',
    weak: 'A weak root cause promises better service without a number in it.',
    evidence: 'Attach the order-level defect export for the measurement window.',
  },
  rubric: [
    { id: 'defects_broken_down', label: 'Defects broken down by category', weight: 30 },
    { id: 'root_cause_specific', label: 'Root cause names the operational failure', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 30 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_LSR: Seed = {
  sourceId: 'amz.perf',
  sourceTitle: 'Amazon — Shipping Performance (Late Shipment Rate)',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G200285170',
  triggerPhrases: ['late shipment rate', 'ship-by date', 'confirmed after the expected date'],
  requiredEvidence: ['carrier handover records', 'handling-time settings'],
  failureModes: ['blaming the carrier without a control change'],
  clauses: [
    {
      slug: 'lsr-target',
      heading: 'Late Shipment Rate target',
      ourSummary:
        'Orders are expected to be confirmed as shipped by the ship-by date, with the late shipment rate kept under four percent over both 10-day and 30-day windows.',
      quotedExcerpt: 'under 4%',
      obligationType: 'standard',
    },
    {
      slug: 'handling-time',
      heading: 'Handling time accuracy',
      ourSummary:
        'Handling time set on a listing is a commitment: a seller who cannot meet it is expected to change the setting rather than miss the date.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong:
      'A strong root cause identifies which orders shipped late and what in the pick-pack cycle produced the delay.',
    weak: 'A weak root cause cites carrier delays with no change to handling time.',
    evidence: 'Attach the late-order list and the revised handling-time settings.',
  },
  rubric: [
    { id: 'late_orders_identified', label: 'Names the late orders and the delay cause', weight: 30 },
    { id: 'handling_time_addressed', label: 'Addresses handling-time settings', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 30 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_SECTION3: Seed = {
  sourceId: 'amz.bsa',
  sourceTitle: 'Amazon — Business Solutions Agreement, Section 3',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G1791',
  triggerPhrases: ['Section 3 of the Amazon Business Solutions Agreement', 'may no longer sell'],
  requiredEvidence: ['account ownership documentation', 'timeline of the conduct alleged'],
  failureModes: ['answering a different allegation than the one made'],
  clauses: [
    {
      slug: 'suspension-right',
      heading: 'Suspension and termination',
      ourSummary:
        'The agreement reserves the right to suspend or terminate a selling account where conduct is judged to harm buyers or the store, and asks the seller to explain the conduct at issue.',
      obligationType: 'prohibition',
    },
    {
      slug: 'reinstatement-basis',
      heading: 'Basis for reinstatement',
      ourSummary:
        'Reinstatement turns on the seller demonstrating what caused the conduct and what now prevents it, rather than on disputing that the review occurred.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong root cause answers the specific allegation quoted in the notice.',
    weak: 'A weak root cause argues the account is valuable to buyers.',
    evidence: 'Attach ownership and operating documentation for the account.',
  },
  rubric: [
    { id: 'allegation_addressed', label: 'Addresses the allegation actually made', weight: 35 },
    { id: 'root_cause_specific', label: 'Root cause names the operational failure', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 25 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_REVIEW_MANIP: Seed = {
  sourceId: 'amz.coc',
  sourceTitle: 'Amazon — Seller Code of Conduct',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G1801',
  triggerPhrases: ['manipulate reviews', 'incentivised reviews', 'ratings, feedback, or reviews'],
  requiredEvidence: ['insert card samples', 'agency contracts', 'communications with reviewers'],
  failureModes: ['denying the practice without producing the materials'],
  clauses: [
    {
      slug: 'review-manipulation',
      heading: 'Ratings, feedback and reviews',
      ourSummary:
        'Sellers may not attempt to influence customer ratings, feedback or reviews, including by offering compensation for a review or by asking for a positive one.',
      quotedExcerpt: 'may not attempt to influence customers ratings',
      obligationType: 'prohibition',
    },
    {
      slug: 'third-party-conduct',
      heading: 'Conduct of third parties',
      ourSummary:
        'Conduct by an agency or contractor acting for the seller is treated as the seller conduct, so the plan of action is expected to cover who was engaged and on what terms.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong root cause names every party who touched review solicitation and what they were told to do.',
    weak: 'A weak root cause asserts compliance without naming the agencies engaged.',
    evidence: 'Attach agency contracts and any insert cards shipped with the product.',
  },
  rubric: [
    { id: 'third_parties_named', label: 'Names every party engaged in solicitation', weight: 35 },
    { id: 'materials_withdrawn', label: 'Shows the offending materials withdrawn', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 25 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_DROPSHIP: Seed = {
  sourceId: 'amz.dropship',
  sourceTitle: 'Amazon — Drop Shipping policy',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201808410',
  triggerPhrases: ['drop shipping policy', 'packing slips from another retailer', 'seller of record'],
  requiredEvidence: ['supplier agreement', 'sample packing slip'],
  failureModes: ['describing the model without changing the packing materials'],
  clauses: [
    {
      slug: 'seller-of-record',
      heading: 'Seller of record',
      ourSummary:
        'A seller using drop shipping is expected to be identified as the seller of record on every packing slip, invoice and external packaging.',
      obligationType: 'requirement',
    },
    {
      slug: 'third-party-branding',
      heading: 'Third-party branding',
      ourSummary:
        'Shipping an order with another retailer packing slip or branding on it is treated as a policy violation regardless of who fulfilled the order.',
      obligationType: 'prohibition',
    },
  ],
  pattern: {
    strong: 'A strong root cause identifies which supplier shipped branded materials and when it stopped.',
    weak: 'A weak root cause explains the business model rather than the packing materials.',
    evidence: 'Attach the supplier agreement and a photograph of current packing materials.',
  },
  rubric: [
    { id: 'supplier_identified', label: 'Identifies the supplier that shipped the orders', weight: 30 },
    { id: 'packaging_corrected', label: 'Shows packing materials corrected', weight: 30 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 25 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_RESTRICTED: Seed = {
  sourceId: 'amz.restricted',
  sourceTitle: 'Amazon — Restricted Products policy',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G200164330',
  triggerPhrases: ['restricted products policy', 'listing has been removed', 'not permitted for sale'],
  requiredEvidence: ['listing inventory audit', 'compliance certificates held'],
  failureModes: ['removing one listing and leaving comparable ones live'],
  clauses: [
    {
      slug: 'restricted-listing',
      heading: 'Restricted listings',
      ourSummary:
        'Products on the restricted list may not be offered, and the seller is responsible for checking a product against the list before it is listed.',
      obligationType: 'prohibition',
    },
    {
      slug: 'catalogue-audit',
      heading: 'Catalogue review',
      ourSummary:
        'After a removal, a plan of action is expected to cover a review of the whole catalogue rather than the single listing named in the notice.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong root cause reports the full catalogue audit and how many further listings were withdrawn.',
    weak: 'A weak root cause addresses only the listing named in the notice.',
    evidence: 'Attach the catalogue audit export and any compliance certificates.',
  },
  rubric: [
    { id: 'catalogue_audited', label: 'Reports a full catalogue audit', weight: 30 },
    { id: 'listings_withdrawn', label: 'States what was withdrawn', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 30 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 15 },
  ],
};

const AMZ_TRADEMARK: Seed = {
  sourceId: 'amz.ip',
  sourceTitle: 'Amazon — Intellectual Property policy for sellers',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201361070',
  triggerPhrases: ['rights owner', 'trademark infringement', 'notice of infringement'],
  requiredEvidence: ['retraction from the rights owner', 'licence or authorisation'],
  failureModes: ['arguing the merits of the trademark rather than obtaining a retraction'],
  clauses: [
    {
      slug: 'rights-owner-complaint',
      heading: 'Rights owner complaints',
      ourSummary:
        'A complaint from a rights owner is resolved either by a retraction from that rights owner or by the seller demonstrating authorisation to use the mark.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong response documents contact with the rights owner and any retraction obtained.',
    weak: 'A weak response argues that the mark is not infringed.',
    evidence: 'Attach correspondence with the rights owner and any licence held.',
  },
  rubric: [
    { id: 'retraction_pursued', label: 'Documents contact with the rights owner', weight: 50 },
    { id: 'authorisation_evidenced', label: 'Evidences authorisation where claimed', weight: 30 },
    { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 20 },
  ],
};

const WMT_STANDARDS: Seed = {
  sourceId: 'wmt.performance',
  sourceTitle: 'Walmart — Marketplace Seller Performance Standards',
  sourceUrl: 'https://sellerhelp.walmart.com/s/guide?article=000007119',
  triggerPhrases: ['seller performance standards', 'on-time delivery rate', 'account has been suspended'],
  requiredEvidence: ['performance dashboard export', 'carrier scorecard'],
  failureModes: ['no written plan of action describing the violation'],
  clauses: [
    {
      slug: 'performance-thresholds',
      heading: 'Performance thresholds',
      ourSummary:
        'Sellers are expected to keep on-time delivery, valid tracking and cancellation metrics inside the published thresholds, measured over a rolling window.',
      obligationType: 'standard',
    },
    {
      slug: 'written-plan',
      heading: 'Written plan of action',
      ourSummary:
        'Reinstatement asks for a written business plan of action describing the violation and the steps the seller will take to prevent it recurring.',
      quotedExcerpt: 'a written business plan of action',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong plan names the metric, the window, and the operational change with a date.',
    weak: 'A weak plan restates the metric definition back to the reviewer.',
    evidence: 'Attach the performance dashboard export for the measured window.',
  },
  rubric: [
    { id: 'metric_named', label: 'Names the metric and the measurement window', weight: 30 },
    { id: 'written_plan_structure', label: 'Follows the three-part written plan structure', weight: 25 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 30 },
    { id: 'tone_non_defensive', label: 'Does not attribute the suspension outward', weight: 15 },
  ],
};

const WMT_CONDUCT: Seed = {
  sourceId: 'wmt.coc',
  sourceTitle: 'Walmart — Marketplace Seller Code of Conduct',
  sourceUrl: 'https://sellerhelp.walmart.com/s/guide?article=000008529',
  triggerPhrases: ['Marketplace Seller Code of Conduct', 'trust and safety', 'business conduct'],
  requiredEvidence: ['internal policy documents', 'staff training records'],
  failureModes: ['a general commitment to integrity with no control named'],
  clauses: [
    {
      slug: 'conduct-standard',
      heading: 'Standards of business conduct',
      ourSummary:
        'Sellers are expected to deal honestly with customers and with Walmart, and to keep the practices described in the code across every channel they operate.',
      obligationType: 'standard',
    },
    {
      slug: 'remediation',
      heading: 'Remediation expectations',
      ourSummary:
        'Where conduct falls short, the seller is expected to describe the conduct, the control that failed, and the control that now applies.',
      obligationType: 'requirement',
    },
  ],
  pattern: {
    strong: 'A strong plan names the conduct, the control that failed and the replacement control.',
    weak: 'A weak plan offers a general commitment to integrity.',
    evidence: 'Attach the internal policy and the training record showing it was issued.',
  },
  rubric: [
    { id: 'conduct_named', label: 'Names the conduct at issue', weight: 30 },
    { id: 'control_replaced', label: 'Names the control that failed and its replacement', weight: 30 },
    { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 25 },
    { id: 'tone_non_defensive', label: 'Does not attribute the suspension outward', weight: 15 },
  ],
};

/** Hand-authored seeds for the codes the golden set covers. */
export const SEEDS: Partial<Record<ReasonCode, Seed>> = {
  'AMZ.AUTH.INAUTHENTIC': AMZ_INAUTHENTIC,
  'AMZ.PERF.ODR': AMZ_ODR,
  'AMZ.PERF.LSR': AMZ_LSR,
  'AMZ.COC.SECTION3': AMZ_SECTION3,
  'AMZ.COC.REVIEW_MANIP': AMZ_REVIEW_MANIP,
  'AMZ.OPS.DROPSHIP': AMZ_DROPSHIP,
  'AMZ.SAFETY.RESTRICTED': AMZ_RESTRICTED,
  'AMZ.IP.TRADEMARK': AMZ_TRADEMARK,
  'WMT.PERF.STANDARDS': WMT_STANDARDS,
  'WMT.COC.CONDUCT': WMT_CONDUCT,
};

/**
 * Every other code gets a generic seed, so `getSlice` is TOTAL over the
 * taxonomy. Retrieval is a total function by design (§2.2), and a fixture corpus
 * that threw for 23 of 33 codes would hide that property rather than test it.
 */
function genericSeed(code: ReasonCode): Seed {
  const record = REASON_CODE_TABLE[code];
  const [platform = 'amz', family = 'gen'] = code.toLowerCase().split('.');
  const sourceId = `${platform}.${family}`;
  return {
    sourceId,
    sourceTitle: `${record.marketplace === 'amazon' ? 'Amazon' : 'Walmart'} — policy governing ${code}`,
    sourceUrl: `https://example.invalid/policy/${code}`,
    triggerPhrases: [record.plainEnglish.toLowerCase()],
    requiredEvidence: ['documentation of the operational control that failed'],
    failureModes: ['a plan of action with no measurable control'],
    clauses: [
      {
        slug: 'primary-obligation',
        heading: `Primary obligation for ${code}`,
        ourSummary: `Sellers are expected to meet the standard behind ${record.plainEnglish.toLowerCase()}, and to show on appeal which control failed and what replaced it.`,
        obligationType: 'requirement',
      },
    ],
    pattern: {
      strong: 'A strong root cause names the operational step that failed.',
      weak: 'A weak root cause restates the notice.',
      evidence: 'Attach the records that show the control now operating.',
    },
    rubric: [
      { id: 'root_cause_specific', label: 'Root cause names the operational failure', weight: 40 },
      { id: 'measurable_preventive_control', label: 'Preventive control is measurable', weight: 40 },
      { id: 'tone_non_defensive', label: 'Does not attribute the deactivation outward', weight: 20 },
    ],
  };
}

function seedFor(code: ReasonCode): Seed {
  return SEEDS[code] ?? genericSeed(code);
}

function toTaxonomyRecord(code: ReasonCode): TaxonomyRecord {
  const seed = seedFor(code);
  return {
    code,
    plainEnglish: REASON_CODE_TABLE[code].plainEnglish,
    triggerPhrases: seed.triggerPhrases,
    requiredEvidence: seed.requiredEvidence,
    typicalFailureModes: seed.failureModes,
  };
}

function toPolicyDoc(code: ReasonCode): CorpusDocument {
  const seed = seedFor(code);
  return {
    documentId: seed.sourceId,
    title: seed.sourceTitle,
    sourceUrl: seed.sourceUrl,
    corpusRelease: FIXTURE_CORPUS_RELEASE,
    clauses: seed.clauses.map((clause) => ({
      clauseId: `${seed.sourceId}#${clause.slug}`,
      heading: clause.heading,
      ourSummary: clause.ourSummary,
      quotedExcerpt: clause.quotedExcerpt ?? null,
      obligationType: clause.obligationType,
    })),
  };
}

function toPatternDoc(code: ReasonCode): CorpusDocument {
  const seed = seedFor(code);
  // L3 is 1:1 with L1 and shares the reason code as its identifier (§2.3).
  return {
    documentId: `l3.${code}`,
    title: `Appeal pattern — ${code}`,
    sourceUrl: `https://clausewright.com/patterns/${code}`,
    corpusRelease: FIXTURE_CORPUS_RELEASE,
    clauses: [
      {
        clauseId: `l3.${code}#strong`,
        heading: 'What a strong section contains',
        ourSummary: seed.pattern.strong,
        quotedExcerpt: null,
        obligationType: 'standard',
      },
      {
        clauseId: `l3.${code}#weak`,
        heading: 'Anti-pattern',
        ourSummary: seed.pattern.weak,
        quotedExcerpt: null,
        obligationType: 'standard',
      },
      {
        clauseId: `l3.${code}#evidence`,
        heading: 'Evidence kit',
        ourSummary: seed.pattern.evidence,
        quotedExcerpt: null,
        obligationType: 'requirement',
      },
    ],
  };
}

function toRubric(code: ReasonCode): RubricSpec {
  return { code, criteria: seedFor(code).rubric };
}

export function fixtureSlice(code: ReasonCode): CorpusSlice {
  return {
    code,
    taxonomy: toTaxonomyRecord(code),
    policyDocs: [toPolicyDoc(code)],
    patternDoc: toPatternDoc(code),
    rubric: toRubric(code),
    corpusRelease: FIXTURE_CORPUS_RELEASE,
    promptBundleHash: FIXTURE_PROMPT_BUNDLE_HASH,
  };
}

export function createFixtureCorpus(): CorpusProvider {
  const taxonomy = REASON_CODES.map(toTaxonomyRecord);
  return {
    corpusRelease: FIXTURE_CORPUS_RELEASE,
    promptBundleHash: FIXTURE_PROMPT_BUNDLE_HASH,
    listTaxonomy: () => taxonomy,
    getSlice: (code) => fixtureSlice(code),
  };
}
