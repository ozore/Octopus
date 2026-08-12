/**
 * The 33-code suspension reason taxonomy plus the mandatory escape hatch.
 *
 * Spec: CORPUS_DESIGN.md §3.2 (the owning document for the taxonomy),
 * LLM_ENGINE.md §0 (33 codes plus `UNCLASSIFIED`).
 *
 * Two constraints that are invisible in the code:
 *
 *  - Codes are APPEND-ONLY (CORPUS_DESIGN.md §2.3). A code is never renamed or
 *    reused; it is retired and a successor named. A citation rendered to a
 *    customer in month 1 must still resolve in month 12.
 *
 *  - `UNCLASSIFIED` is a first-class outcome, not an error (B2, R3, I5). It must
 *    be reachable, tested and instrumented. Low confidence converts to the $399
 *    human tier rather than guessing — the worst failure mode is the
 *    differentiated revenue line, not a fallback that drafts anyway.
 */

export const REASON_CODES = [
  // Amazon — authenticity & intellectual property (7)
  'AMZ.AUTH.INAUTHENTIC',
  'AMZ.AUTH.COUNTERFEIT',
  'AMZ.AUTH.CONDITION',
  'AMZ.AUTH.EXPIRY',
  'AMZ.IP.TRADEMARK',
  'AMZ.IP.COPYRIGHT',
  'AMZ.IP.PATENT',
  // Amazon — Code of Conduct & Section 3 (10)
  'AMZ.COC.SECTION3',
  'AMZ.COC.LINKED',
  'AMZ.COC.MULTIACCOUNT',
  'AMZ.COC.REVIEW_MANIP',
  'AMZ.COC.RANK_ABUSE',
  'AMZ.COC.SEARCH_ABUSE',
  'AMZ.COC.DIVERSION',
  'AMZ.COC.SELLER_ABUSE',
  'AMZ.COC.BIZ_NAME',
  'AMZ.COC.FRAUD',
  // Amazon — performance & compliance (10)
  'AMZ.PERF.ODR',
  'AMZ.PERF.LSR',
  'AMZ.PERF.PCR',
  'AMZ.PERF.VTR',
  'AMZ.PERF.AHR',
  'AMZ.SAFETY.PRODUCT',
  'AMZ.SAFETY.RESTRICTED',
  'AMZ.SAFETY.GPSR',
  'AMZ.OPS.DROPSHIP',
  'AMZ.OPS.VERIFICATION',
  // Walmart (6)
  'WMT.PERF.STANDARDS',
  'WMT.PERF.ODR',
  'WMT.COC.CONDUCT',
  'WMT.TRUST.SAFETY',
  'WMT.OPS.PROHIBITED',
  'WMT.AGREEMENT.RETAILER',
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export const UNCLASSIFIED = 'UNCLASSIFIED' as const;

/** The classifier's label space: the taxonomy plus the escape hatch. */
export const CLASSIFIER_LABELS = [...REASON_CODES, UNCLASSIFIED] as const;
export type ClassifierLabel = (typeof CLASSIFIER_LABELS)[number];

export type SeverityBand = 'standard' | 'judgment_required' | 'counsel_referral';

/**
 * `draft` = full self-serve draft. `human_tier` = drafted, but the paywall
 * presents the $399 tier as the recommended path. `refer_out` = we do not draft;
 * we refer to partner counsel with a tracked referral code (CORPUS_DESIGN §3.2,
 * ARCHITECTURE §3.6). This is the honest-triage stance that also controls
 * adverse selection on the refund guarantee — it runs BEFORE payment.
 */
export type TriageDisposition = 'draft' | 'human_tier' | 'refer_out';

export type ReasonCodeRecord = {
  readonly code: ReasonCode;
  readonly marketplace: 'amazon' | 'walmart';
  readonly family: string;
  /** Seller-facing gloss. Nielsen heuristic #2 — never "POA", never "clause 3(a)". */
  readonly plainEnglish: string;
  readonly severity: SeverityBand;
  readonly triage: TriageDisposition;
};

const R = (
  code: ReasonCode,
  marketplace: 'amazon' | 'walmart',
  plainEnglish: string,
  severity: SeverityBand,
  triage: TriageDisposition,
): ReasonCodeRecord => ({
  code,
  marketplace,
  family: code.split('.')[1] ?? 'UNKNOWN',
  plainEnglish,
  severity,
  triage,
});

export const REASON_CODE_TABLE: Readonly<Record<ReasonCode, ReasonCodeRecord>> = Object.freeze({
  'AMZ.AUTH.INAUTHENTIC': R('AMZ.AUTH.INAUTHENTIC', 'amazon', 'Amazon says your items may not be genuine', 'judgment_required', 'human_tier'),
  'AMZ.AUTH.COUNTERFEIT': R('AMZ.AUTH.COUNTERFEIT', 'amazon', 'Amazon says your items are counterfeit', 'counsel_referral', 'refer_out'),
  'AMZ.AUTH.CONDITION': R('AMZ.AUTH.CONDITION', 'amazon', 'Used item sold as new / condition complaints', 'standard', 'draft'),
  'AMZ.AUTH.EXPIRY': R('AMZ.AUTH.EXPIRY', 'amazon', 'Expired or short-dated product complaints', 'standard', 'draft'),
  'AMZ.IP.TRADEMARK': R('AMZ.IP.TRADEMARK', 'amazon', "A brand says you're using their trademark", 'counsel_referral', 'refer_out'),
  'AMZ.IP.COPYRIGHT': R('AMZ.IP.COPYRIGHT', 'amazon', 'A rights-holder filed a copyright complaint', 'counsel_referral', 'refer_out'),
  'AMZ.IP.PATENT': R('AMZ.IP.PATENT', 'amazon', 'A patent complaint was filed against your listing', 'counsel_referral', 'refer_out'),

  'AMZ.COC.SECTION3': R('AMZ.COC.SECTION3', 'amazon', 'Deactivated under Section 3 of the Business Solutions Agreement', 'judgment_required', 'human_tier'),
  'AMZ.COC.LINKED': R('AMZ.COC.LINKED', 'amazon', 'Amazon linked your account to another account', 'judgment_required', 'human_tier'),
  'AMZ.COC.MULTIACCOUNT': R('AMZ.COC.MULTIACCOUNT', 'amazon', 'Operating more than one selling account', 'judgment_required', 'human_tier'),
  'AMZ.COC.REVIEW_MANIP': R('AMZ.COC.REVIEW_MANIP', 'amazon', 'Manipulating reviews, ratings or feedback', 'judgment_required', 'human_tier'),
  'AMZ.COC.RANK_ABUSE': R('AMZ.COC.RANK_ABUSE', 'amazon', 'Misuse of sales rank', 'standard', 'draft'),
  'AMZ.COC.SEARCH_ABUSE': R('AMZ.COC.SEARCH_ABUSE', 'amazon', 'Misuse of search and browse', 'standard', 'draft'),
  'AMZ.COC.DIVERSION': R('AMZ.COC.DIVERSION', 'amazon', 'Trying to take customers off Amazon', 'standard', 'draft'),
  'AMZ.COC.SELLER_ABUSE': R('AMZ.COC.SELLER_ABUSE', 'amazon', 'Attempting to damage or abuse another seller', 'judgment_required', 'human_tier'),
  'AMZ.COC.BIZ_NAME': R('AMZ.COC.BIZ_NAME', 'amazon', "Your business name isn't allowed", 'standard', 'draft'),
  'AMZ.COC.FRAUD': R('AMZ.COC.FRAUD', 'amazon', "Amazon's controls flagged deceptive or fraudulent activity", 'counsel_referral', 'refer_out'),

  'AMZ.PERF.ODR': R('AMZ.PERF.ODR', 'amazon', 'Your Order Defect Rate went over the limit', 'standard', 'draft'),
  'AMZ.PERF.LSR': R('AMZ.PERF.LSR', 'amazon', 'Too many late shipments', 'standard', 'draft'),
  'AMZ.PERF.PCR': R('AMZ.PERF.PCR', 'amazon', 'Too many cancellations before fulfilment', 'standard', 'draft'),
  'AMZ.PERF.VTR': R('AMZ.PERF.VTR', 'amazon', 'Not enough orders had valid tracking', 'standard', 'draft'),
  'AMZ.PERF.AHR': R('AMZ.PERF.AHR', 'amazon', 'Your Account Health Rating fell below the threshold', 'standard', 'draft'),
  'AMZ.SAFETY.PRODUCT': R('AMZ.SAFETY.PRODUCT', 'amazon', 'A product safety complaint was filed', 'judgment_required', 'human_tier'),
  'AMZ.SAFETY.RESTRICTED': R('AMZ.SAFETY.RESTRICTED', 'amazon', 'You listed a restricted product', 'standard', 'draft'),
  'AMZ.SAFETY.GPSR': R('AMZ.SAFETY.GPSR', 'amazon', 'EU product-safety (GPSR) compliance', 'judgment_required', 'human_tier'),
  'AMZ.OPS.DROPSHIP': R('AMZ.OPS.DROPSHIP', 'amazon', 'Dropshipping policy violation', 'standard', 'draft'),
  'AMZ.OPS.VERIFICATION': R('AMZ.OPS.VERIFICATION', 'amazon', 'Identity or business verification failed', 'standard', 'draft'),

  'WMT.PERF.STANDARDS': R('WMT.PERF.STANDARDS', 'walmart', "You missed Walmart's Seller Performance Standards", 'standard', 'draft'),
  'WMT.PERF.ODR': R('WMT.PERF.ODR', 'walmart', 'Order defect metrics (cancellation, on-time delivery, refund, tracking)', 'standard', 'draft'),
  'WMT.COC.CONDUCT': R('WMT.COC.CONDUCT', 'walmart', 'Marketplace Seller Code of Conduct violation', 'judgment_required', 'human_tier'),
  'WMT.TRUST.SAFETY': R('WMT.TRUST.SAFETY', 'walmart', 'Trust & Safety Policy action', 'judgment_required', 'human_tier'),
  'WMT.OPS.PROHIBITED': R('WMT.OPS.PROHIBITED', 'walmart', 'You listed a prohibited item', 'standard', 'draft'),
  'WMT.AGREEMENT.RETAILER': R('WMT.AGREEMENT.RETAILER', 'walmart', 'Marketplace Retailer Agreement violation', 'judgment_required', 'human_tier'),
});

/**
 * Codes we do not draft for. Checked BEFORE payment (ARCHITECTURE §3.6,
 * LLM_ENGINE.md §6.1) — honest triage is also the Akerlof control that makes the
 * refund guarantee safe to offer.
 */
export const REFUSED_CATEGORIES: ReadonlySet<ReasonCode> = new Set(
  REASON_CODES.filter((code) => REASON_CODE_TABLE[code].triage === 'refer_out'),
);

/** Codes drafted by machine but sold with the $399 human tier recommended. */
export const HUMAN_TIER_CATEGORIES: ReadonlySet<ReasonCode> = new Set(
  REASON_CODES.filter((code) => REASON_CODE_TABLE[code].triage === 'human_tier'),
);

export function isReasonCode(value: string): value is ReasonCode {
  return (REASON_CODES as readonly string[]).includes(value);
}

/**
 * Pending calibration against the ~53-notice golden set (CORPUS_DESIGN §3.2
 * flags the uniform 0.75 floor as a judgment call, not a finding; LLM_ENGINE
 * §6.1 sets the method — a Neyman-Pearson-style bound on the confident-wrong
 * rate, not accuracy maximisation).
 */
export const DEFAULT_CLASSIFIER_FLOOR = 0.75;
export const DEFAULT_CONFIDENCE_MARGIN = 0.15;
