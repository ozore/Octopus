/**
 * THE GOLDEN SET — initial slice, 10 fixtures, ALL SYNTHETIC.
 *
 * Spec: LLM_ENGINE.md §8.1 (composition and the coverage rule), §8.2 (what runs
 * per commit, against recorded responses), E7. Karpathy, *Software 2.0*: "the
 * dataset that defines the desirable behavior" is the primary artifact.
 *
 * WHAT THIS IS AND IS NOT, stated plainly because §8.1 pre-commits to the rule:
 *
 *  - Every fixture below carries `provenance: 'synthetic'`. Each notice is
 *    AUTHORED from its code's L1 record — its trigger phrases and required
 *    evidence — and is explicitly NOT evidence that the classifier handles real
 *    notices for that code. Replacing a synthetic fixture with a real (redacted)
 *    notice is a corpus-release event, not a silent edit.
 *  - The eventual set is ~53 notices with **33/33 code coverage**, and coverage
 *    below 33/33 fails the corpus build. This slice covers 10 codes across the
 *    major families, so the harness reports `coverageComplete: false` and the
 *    blocking full-coverage gate stays off until the remaining fixtures land.
 *    Reporting 10/33 as green would be worse than no gate: it would report
 *    passing for 23 codes never tested.
 *  - No real notice may enter the repo unredacted (R15, ADR-008). Synthetic
 *    fixtures sidestep that entirely, which is the other reason this slice is
 *    synthetic first.
 *
 * The recorded model responses attached to each fixture are what make the
 * per-commit lane deterministic and free (§8.2). They are replayed through the
 * mock adapter; the nightly lane (§8.3) runs the same fixtures against live
 * models and is out of scope for this file.
 */

import type { ClassifierLabel } from '../../domain/reason-codes';
import type { EscalationReason, MarketplaceGuess, NoticeScope } from '../../domain/types';

export type FixtureProvenance = 'real' | 'synthetic';

export type GoldenCandidate = {
  code: ClassifierLabel;
  confidence: number;
  /** Must appear verbatim in the notice — the harness asserts it (§6.1). */
  quotes: string[];
};

export type GoldenFixture = {
  id: string;
  provenance: FixtureProvenance;
  /** Taxonomy family this fixture exercises, for the coverage report. */
  family: string;
  notice: string;
  /** Ground truth. Human-labelled work in the real set (§8.1). */
  label: ClassifierLabel;
  marketplace: MarketplaceGuess;
  scope: NoticeScope;
  expected:
    | { kind: 'drafted' }
    | { kind: 'escalate'; reason: EscalationReason };
  recorded: {
    candidates: GoldenCandidate[];
    noticeContainsInstructions?: boolean;
    /** Prose the recorded drafter emits per section. Citations are attached to
     *  it programmatically from the corpus slice, so a corpus edit cannot leave
     *  a fixture citing a clause that no longer exists. */
    prose?: { rootCause: string; correctiveActions: string; preventiveMeasures: string };
    /** Rubric criteria the recorded evaluator marks unmet, and which of those
     *  it calls blocking (a blocking deficiency exercises the bounded
     *  evaluator-optimizer revision). */
    critique?: { unmet: string[]; blocking: string[]; gaps: string[] };
  };
};

const f = (fixture: GoldenFixture): GoldenFixture => fixture;

export const GOLDEN_SET: readonly GoldenFixture[] = [
  f({
    id: 'GS-01',
    provenance: 'synthetic',
    family: 'AMZ.AUTH',
    label: 'AMZ.AUTH.INAUTHENTIC',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Hello,',
      '',
      'Your Amazon seller account has been deactivated in accordance with our policies.',
      'We took this action because we received complaints about the authenticity of items you listed.',
      'Funds will not be transferred to you while your account is deactivated.',
      '',
      'Why is this happening?',
      'We have received complaints from buyers stating that the items they received were not genuine.',
      '',
      'How do I reactivate my account?',
      'Send us a plan of action that explains the root cause of the complaints, the actions you have',
      'taken to resolve them, and the steps you will take to prevent them in the future. Include',
      'invoices from your supplier issued in the last 365 days for the ASINs listed below.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.AUTH.INAUTHENTIC',
          confidence: 0.91,
          quotes: ['we received complaints about the authenticity of items you listed'],
        },
        { code: 'AMZ.AUTH.CONDITION', confidence: 0.06, quotes: ['the items they received were not genuine'] },
      ],
      prose: {
        rootCause:
          'I sourced the units in question through a distributor I had used for two years without checking, for that purchase order, that the distributor could evidence its own chain of supply back to the brand.',
        correctiveActions:
          'On 3 March I withdrew the remaining 214 units of the affected ASINs from sale and requested full documentation from the distributor for every order placed since January.',
        preventiveMeasures:
          'From 10 March every new purchase order is checked against a supplier file before goods are received, and any order without a brand-identifying invoice on file is held. I review the supplier file monthly and the check is recorded in our receiving log.',
      },
      critique: {
        unmet: ['tone_non_defensive'],
        blocking: [],
        gaps: ['supplier_invoice'],
      },
    },
  }),

  f({
    id: 'GS-02',
    provenance: 'synthetic',
    family: 'AMZ.PERF',
    label: 'AMZ.PERF.ODR',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Your Amazon selling account has been deactivated.',
      '',
      'Why did this happen?',
      'Your order defect rate is above the 1% target that we require of all sellers.',
      'Your current order defect rate is 3.4% based on 47 defective orders out of 1,382 orders in the',
      'last 60 days, including 31 negative feedback entries and 9 A-to-z claims.',
      '',
      'How do I reactivate my account?',
      'Submit a plan of action that includes the root cause of the defects, the actions you have taken',
      'to resolve them, and the steps you will take to prevent them going forward.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.PERF.ODR',
          confidence: 0.94,
          quotes: ['Your order defect rate is above the 1% target'],
        },
        { code: 'AMZ.PERF.AHR', confidence: 0.04, quotes: ['deactivated'] },
      ],
      prose: {
        rootCause:
          'Of the 47 defects, 31 were negative feedback entries and 28 of those name a delivery that arrived after the promised date. The single operational cause was a second warehouse that we opened in January and staffed without a same-day cut-off.',
        correctiveActions:
          'I closed the second warehouse to new orders on 12 February and moved all fulfilment back to the original site, and I contacted the 31 buyers who left feedback about a late delivery.',
        preventiveMeasures:
          'A daily 14:00 cut-off report now lists every unshipped order and is reviewed by the warehouse lead before close. If the unshipped count exceeds five, orders are re-routed the same afternoon. I review the defect count weekly against a 0.7% internal ceiling.',
      },
      critique: { unmet: [], blocking: [], gaps: [] },
    },
  }),

  f({
    id: 'GS-03',
    provenance: 'synthetic',
    family: 'AMZ.PERF',
    label: 'AMZ.PERF.LSR',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Your Amazon seller account has been deactivated because your late shipment rate exceeded 4%.',
      '',
      'Your late shipment rate is currently 11.2% over the last 10 days and 7.8% over the last 30 days.',
      'Orders are considered late when they are confirmed as shipped after the expected ship date.',
      '',
      'To reactivate, send a plan of action describing why the orders shipped late, what you have done',
      'about it, and how you will keep this from happening again.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.PERF.LSR',
          confidence: 0.93,
          quotes: ['your late shipment rate exceeded 4%'],
        },
        { code: 'AMZ.PERF.VTR', confidence: 0.05, quotes: ['confirmed as shipped after the expected ship date'] },
      ],
      prose: {
        rootCause:
          'We kept a one-day handling time on 340 listings after our packing team dropped from four people to two in January, so orders placed after midday could not be picked, packed and handed over the same day.',
        correctiveActions:
          'I raised handling time to two days on all 340 listings on 6 February and hired two packers who started on 17 February.',
        preventiveMeasures:
          'Handling time is now reviewed against actual handover times every Monday, and any listing whose average handover exceeds its stated handling time by more than four hours is adjusted that day.',
      },
      critique: { unmet: ['handling_time_addressed'], blocking: [], gaps: ['carrier_scorecard'] },
    },
  }),

  f({
    id: 'GS-04',
    provenance: 'synthetic',
    family: 'AMZ.COC',
    label: 'AMZ.COC.SECTION3',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'We are writing to let you know that you may no longer sell on Amazon.com.',
      '',
      'We took this action in accordance with Section 3 of the Amazon Business Solutions Agreement.',
      'Our review found activity on your account that we determined to be harmful to our customers.',
      '',
      'If you would like to appeal this decision, reply to this message with an explanation of the',
      'activity, what you have done about it, and how you will prevent it in future.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.COC.SECTION3',
          confidence: 0.88,
          quotes: ['in accordance with Section 3 of the Amazon Business Solutions Agreement'],
        },
        { code: 'AMZ.COC.FRAUD', confidence: 0.07, quotes: ['harmful to our customers'] },
      ],
      prose: {
        rootCause:
          'The activity referred to is a set of 63 orders placed in December from three buyer accounts registered to my own household, which I used to test a bundle listing rather than creating a test ASIN.',
        correctiveActions:
          'I stopped the practice on 4 January, closed the three buyer accounts, and refunded the 63 orders in full on 8 January.',
        preventiveMeasures:
          'Listing tests now run on a dedicated test ASIN that is never made available for purchase, and no member of my household holds a buyer account used for any business purpose. I check the order export monthly for orders shipping to household addresses.',
      },
      critique: { unmet: [], blocking: [], gaps: ['account_ownership_documentation'] },
    },
  }),

  f({
    id: 'GS-05',
    provenance: 'synthetic',
    family: 'AMZ.COC',
    label: 'AMZ.COC.REVIEW_MANIP',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Your Amazon selling account has been deactivated.',
      '',
      'We believe you have attempted to manipulate customer reviews on your listings. This includes',
      'offering compensation in exchange for reviews and using a third party to solicit them.',
      '',
      'Send us a plan of action explaining how the reviews were solicited, who was involved, what you',
      'have done to correct it, and how you will prevent it from happening again.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.COC.REVIEW_MANIP',
          confidence: 0.9,
          quotes: ['attempted to manipulate customer reviews on your listings'],
        },
        { code: 'AMZ.COC.SELLER_ABUSE', confidence: 0.05, quotes: ['using a third party to solicit them'] },
      ],
      prose: {
        rootCause:
          'In October I engaged a marketing agency on a monthly retainer to run post-purchase email, and their template offered a gift card to buyers who left a five-star rating. I approved the template without reading the offer line.',
        correctiveActions:
          'I terminated the agency retainer on 2 November, withdrew the insert cards from the two SKUs that carried them, and stopped all post-purchase email while the templates were rewritten.',
        preventiveMeasures:
          'Every buyer-facing message is now approved by me against a written checklist before it is scheduled, and no agency has send rights on our account. I audit the sent-message log monthly.',
      },
      // A blocking deficiency on the first pass exercises the bounded
      // evaluator-optimizer revision (§2.2 stage 4, config.maxDraftIterations).
      critique: {
        unmet: ['third_parties_named', 'materials_withdrawn'],
        blocking: ['third_parties_named'],
        gaps: ['agency_contract', 'insert_card_sample'],
      },
    },
  }),

  f({
    id: 'GS-06',
    provenance: 'synthetic',
    family: 'AMZ.OPS',
    label: 'AMZ.OPS.DROPSHIP',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Your Amazon selling account has been deactivated for violating the drop shipping policy.',
      '',
      'Buyers have reported receiving orders with packing slips identifying another retailer as the',
      'seller. You must be the seller of record for the products you sell on Amazon.',
      '',
      'To appeal, provide a plan of action with the root cause, your corrective actions, and the steps',
      'you will take to prevent recurrence, together with your supplier agreement.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.OPS.DROPSHIP',
          confidence: 0.92,
          quotes: ['packing slips identifying another retailer'],
        },
        { code: 'AMZ.COC.DIVERSION', confidence: 0.04, quotes: ['another retailer as the'] },
      ],
      prose: {
        rootCause:
          'Between November and January, 118 orders for four SKUs were fulfilled by a supplier who shipped them in their own branded cartons with their own packing slip, because our supply agreement did not say who appears on the paperwork.',
        correctiveActions:
          'I suspended the four SKUs on 20 January, signed an amended supply agreement on 27 January that requires our documentation on every shipment, and inspected a sample of ten shipments before relisting.',
        preventiveMeasures:
          'Every new supplier signs the amended agreement before their first order, and we photograph and file one shipment per supplier per month to confirm the paperwork is ours.',
      },
      critique: { unmet: ['packaging_corrected'], blocking: [], gaps: ['supplier_agreement'] },
    },
  }),

  f({
    id: 'GS-07',
    provenance: 'synthetic',
    family: 'AMZ.SAFETY',
    label: 'AMZ.SAFETY.RESTRICTED',
    marketplace: 'amazon',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Your Amazon selling account has been deactivated.',
      '',
      'We found listings for products that are not permitted for sale on Amazon. Offering restricted',
      'products puts customers at risk and is not allowed.',
      '',
      'To reactivate your account, send a plan of action that explains how the listings were created,',
      'what you have done about them, and how you will prevent restricted products being listed again.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.SAFETY.RESTRICTED',
          confidence: 0.89,
          quotes: ['listings for products that are not permitted for sale on Amazon'],
        },
        { code: 'AMZ.SAFETY.PRODUCT', confidence: 0.06, quotes: ['puts customers at risk'] },
      ],
      prose: {
        rootCause:
          'Six listings were created from a supplier feed we began importing in December without any check against the restricted list, and three of those six were for products that may not be offered.',
        correctiveActions:
          'I deleted all six listings on 14 January and audited the remaining 1,204 active listings against the restricted list, withdrawing a further two.',
        preventiveMeasures:
          'The supplier feed now passes through a blocklist check before any listing is created, and the full catalogue is re-checked monthly with the result recorded.',
      },
      critique: { unmet: [], blocking: [], gaps: ['compliance_certificate'] },
    },
  }),

  f({
    id: 'GS-08',
    provenance: 'synthetic',
    family: 'AMZ.IP',
    label: 'AMZ.IP.TRADEMARK',
    marketplace: 'amazon',
    scope: 'account',
    // Honest triage runs BEFORE payment: a counsel-referral code escalates
    // regardless of how confident the classifier is (§6.1).
    expected: { kind: 'escalate', reason: 'refused_category' },
    notice: [
      'Your Amazon selling account has been deactivated.',
      '',
      'A rights owner reported that your listings infringe their trademark. We received a notice of',
      'infringement naming eleven of your ASINs.',
      '',
      'To appeal, provide either a retraction from the rights owner or evidence that you are authorised',
      'to use the mark.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'AMZ.IP.TRADEMARK',
          confidence: 0.95,
          quotes: ['A rights owner reported that your listings infringe their trademark'],
        },
      ],
    },
  }),

  f({
    id: 'GS-09',
    provenance: 'synthetic',
    family: 'WMT.PERF',
    label: 'WMT.PERF.STANDARDS',
    marketplace: 'walmart',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Walmart Marketplace — account suspension notice',
      '',
      'Your account has been suspended because it no longer meets our Seller Performance Standards.',
      'Your on-time delivery rate is 87.4% against a required 95%, measured over the last 90 days.',
      '',
      'To request reinstatement, reply with a written business plan of action describing the violation',
      'and the steps you plan to take to prevent it from happening again.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'WMT.PERF.STANDARDS',
          confidence: 0.9,
          quotes: ['it no longer meets our Seller Performance Standards'],
        },
        { code: 'WMT.PERF.ODR', confidence: 0.07, quotes: ['on-time delivery rate is 87.4%'] },
      ],
      prose: {
        rootCause:
          'Our on-time delivery rate fell to 87.4% because we shipped 1,900 orders in the quarter on a ground service whose published transit time was equal to, not shorter than, the delivery promise we had set.',
        correctiveActions:
          'I moved all orders to a two-day service on 19 March and extended the delivery promise on the 46 affected items to match the new transit time.',
        preventiveMeasures:
          'Transit performance is compared against the delivery promise every Monday, and any item whose on-time rate falls below 96% has its promise extended that week.',
      },
      critique: { unmet: ['written_plan_structure'], blocking: [], gaps: ['performance_dashboard_export'] },
    },
  }),

  f({
    id: 'GS-10',
    provenance: 'synthetic',
    family: 'WMT.COC',
    label: 'WMT.COC.CONDUCT',
    marketplace: 'walmart',
    scope: 'account',
    expected: { kind: 'drafted' },
    notice: [
      'Walmart Marketplace — notice of account action',
      '',
      'We have suspended your seller account following a violation of the Marketplace Seller Code of',
      'Conduct. Our review found that product descriptions on your items overstated certification that',
      'the products do not hold.',
      '',
      'Reply with a written plan of action describing the conduct, what you have corrected, and the',
      'controls you will put in place.',
    ].join('\n'),
    recorded: {
      candidates: [
        {
          code: 'WMT.COC.CONDUCT',
          confidence: 0.87,
          quotes: ['a violation of the Marketplace Seller Code of Conduct'],
        },
        { code: 'WMT.TRUST.SAFETY', confidence: 0.06, quotes: ['product descriptions on your items overstated certification'] },
      ],
      prose: {
        rootCause:
          'Nine item descriptions carried a certification claim copied from a supplier brochure that applies to the supplier factory, not to the finished goods we sell.',
        correctiveActions:
          'I removed the claim from all nine descriptions on 11 April and asked the supplier for the documentation behind the brochure, which they were unable to provide for finished goods.',
        preventiveMeasures:
          'Any certification claim now requires a certificate naming the finished product on file before the copy is published, and I re-check the claim register each quarter.',
      },
      critique: { unmet: ['control_replaced'], blocking: [], gaps: ['internal_policy_document'] },
    },
  }),
];

export const GOLDEN_SET_CODES = [...new Set(GOLDEN_SET.map((fx) => fx.label))];
