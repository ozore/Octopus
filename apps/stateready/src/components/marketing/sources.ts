/**
 * M15 — the cited sources the landing page uses that are NOT in the knowledge
 * base, carried in the same shape as a knowledge-base value so the source chip
 * cannot tell them apart.
 *
 * WHY THIS FILE EXISTS AND WHY IT IS SMALL.
 *
 * Four of the page's claims are about states we do not cover — California, New
 * York City, Illinois — and one is a competitor's own published price. None of
 * them can live in `kb/kb-data/`, which is a statement about the state × trade
 * rulebooks we maintain. They are still regulatory quotations on a marketing
 * page, so `LANDING_SPEC.md` §11 binds them exactly as it binds a knowledge-base
 * value: **a regulatory value without a source chip and a `last_verified` date
 * may not appear.**
 *
 * Carrying them as `SourcedValue`s means they go through `assessValue()` like
 * everything else: the same 180-day staleness rule applies, and on the day one
 * of them goes stale the page stops asserting it and renders the refusal
 * instead. A constant in a JSX file could not do that.
 *
 * Every row below was fetched on **2026-09-03** and is recorded in
 * `phase-4-revenue/stateready/identity/sources.md` and
 * `phase-4-revenue/stateready/offer/RESEARCH.md` §4.3 — two agents, two
 * documents, which is `PLAN.md` A10's two-agent rule. **Nothing here is
 * estimated, and no number appears that its own source does not print.**
 *
 * Banned from this file, permanently, and grep-tested elsewhere: the EPA 608
 * penalty figure (`ERRATA.md`; no `.gov` source has been opened for it) and any
 * Illinois plumber CE hour count (IDPH publishes the date, not the hours).
 */

import type { SourcedValue } from '@/lib/kb/types';

/** Every source on this page was read in the same session. */
export const CITED_ON = '2026-09-03';

const AGENTS = ['po-stateready-offer-research', 'po-stateready-identity-sources'];

function cited(input: {
  value: string;
  url: string;
  title: string;
  kind?: SourcedValue['source_kind'];
  evidence: string;
}): SourcedValue<string> {
  return {
    value: input.value,
    status: 'verified',
    confidence: 'high',
    source_url: input.url,
    source_title: input.title,
    source_kind: input.kind,
    evidence: input.evidence,
    last_verified: CITED_ON,
    verified_by: AGENTS,
  };
}

/** `offer/RESEARCH.md` §4.3 — the consequence of a lapse, in the regulator's words. */
export const CSLB_EXPIRED = cited({
  value: 'You cannot actively contract with an expired, inactive, or suspended license.',
  url: 'https://www.cslb.ca.gov/contractors/maintain_license/renew_license/general_renewal_information.aspx',
  title: 'General Renewal Information — California Contractors State License Board',
  kind: 'board_page',
  evidence: 'You cannot actively contract with an expired, inactive, or suspended license.',
});

export const NYC_DOB_ACTIVE = cited({
  value: "Licensee's license and insurance information must be active and current.",
  url: 'https://www.nyc.gov/site/buildings/dob/project-requirements-contractor-permit-and-insurance.page',
  title: 'Contractor Permit and Insurance Requirements — NYC Department of Buildings',
  kind: 'board_page',
  evidence: "Licensee's license and insurance information must be active and current.",
});

export const BPC_7031 = cited({
  value:
    '…may [not] bring or maintain any action … for the collection of compensation … where a license is required.',
  url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7031',
  title: 'California Business and Professions Code §7031',
  kind: 'statute',
  evidence: 'No person engaged in the business … may bring or maintain any action … for the collection of compensation',
});

/**
 * The runway's Illinois lane (V2).
 *
 * **The date, never the hours.** IDPH publishes the 30 April deadline and an
 * annual continuing-education obligation; the hour count is secondary-source
 * only (`REVIEW.md` Q13, `LANDING_SPEC.md` §11), so it appears nowhere in this
 * codebase. Illinois is also not a covered state, and the lane says so.
 */
export const IL_PLUMBING_RENEWAL = cited({
  value: 'Plumber licenses must be renewed by April 30th following the date of issuance',
  url: 'https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html',
  title: 'Plumbing — Illinois Department of Public Health',
  kind: 'board_page',
  evidence: 'Plumber licenses must be renewed by April 30th following the date of issuance',
});

/** The month and day of that wall, so no component re-reads the sentence. */
export const IL_PLUMBING_RENEWAL_MONTH_DAY = { month: 4, day: 30 } as const;

/**
 * The honest-triage line in the pricing block (`LANDING_SPEC.md` §5): naming a
 * cheaper competitor is the highest-trust move available to a company with no
 * track record, and it disqualifies buyers who would churn. Their own page,
 * their own words, our reading date.
 */
export const CE_BROKER_PRICE = cited({
  value: 'Starting at $39.99 /yr',
  url: 'https://cebroker.com/professional',
  title: 'CE Broker Professional — Propelus',
  evidence: 'Starting at $39.99 /yr',
});

export const CITED_SOURCES = [
  CSLB_EXPIRED,
  NYC_DOB_ACTIVE,
  BPC_7031,
  IL_PLUMBING_RENEWAL,
  CE_BROKER_PRICE,
] as const;
