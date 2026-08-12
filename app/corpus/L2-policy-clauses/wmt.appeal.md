---
source_id: wmt.appeal
platform: WMT
title: Appeal an account suspension
tier: B
access_mode: public_html
url: https://marketplacelearn.walmart.com/guides/Seller%20Account%20Management/Appeal-an-account-suspension
robots_status: allowed
marketplace_edition: US
publisher_date: null
first_fetched_at: 2026-08-12
last_verified_at: 2026-08-12
content_sha256: null
extraction_method: html_to_text
license_posture: Walmart-copyrighted. Store our own summaries only. Excerpts <=25 words, marked as excerpts.
citable: true
jurisdiction_caveat: false
stub: false
reason_codes_covered: [WMT.PERF.STANDARDS, WMT.PERF.ODR, WMT.COC.CONDUCT, WMT.TRUST.SAFETY, WMT.OPS.PROHIBITED, WMT.AGREEMENT.RETAILER]
retrieval_note: >-
  Fetched 2026-08-12. This is the single most valuable public page for the
  Walmart half of the product — it is Walmart's own appeal guidance, logged out,
  which is exactly the thing Amazon keeps behind a login. Note what it does NOT
  contain: it does not enumerate violation categories, which is why the six WMT
  reason codes are flagged constructed:true in taxonomy.json.
---

## clause: wmt.appeal#review-metrics
heading: Step 1 — review your performance metrics
obligation_type: requirement
reason_codes: [WMT.PERF.STANDARDS, WMT.PERF.ODR]
status: active
excerpt: null

The first step Walmart names is to review your metrics on the Performance page to identify why the account failed the Seller Performance Standards.

The ordering is the instruction. Walmart asks the seller to diagnose before writing, and a plan of action that opens with remedies the seller has not tied to a specific failed metric has skipped step one on the platform's own published sequence.

## clause: wmt.appeal#business-plan-of-action
heading: Step 2 — write a business plan of action
obligation_type: requirement
reason_codes: [WMT.PERF.STANDARDS, WMT.COC.CONDUCT, WMT.AGREEMENT.RETAILER, WMT.TRUST.SAFETY, WMT.OPS.PROHIBITED]
status: active
excerpt: "Create a written business plan of action with a description of the violation and the steps"

Walmart requires a written business plan of action containing a description of the violation and the steps the seller intends to take to correct it. Where the Marketplace Retailer Agreement has been violated, the plan must also set out the steps that will prevent future breaches.

Walmart's minimum is therefore two parts — description and correction — with prevention required expressly for agreement violations. Amazon's published minimum is three (`amz.ahc#plan-of-action`). Writing the Walmart plan in three parts satisfies both and costs nothing; writing it in two satisfies only one, so the three-part structure is the default here and the deviation would need a reason.

## clause: wmt.appeal#supporting-documentation
heading: Supporting documentation Walmart may require
obligation_type: requirement
reason_codes: [WMT.OPS.PROHIBITED, WMT.PERF.STANDARDS, WMT.TRUST.SAFETY]
status: active
excerpt: "Current images of your warehouse, distributor or supplier invoices (less than two months old) or intellectual property documents"

Walmart may require supporting material to verify inventory availability and eligibility to sell specific items: current images of the warehouse, distributor or supplier invoices less than two months old, or intellectual-property documentation.

The two-month recency rule is the sharpest, most checkable requirement in either platform's public guidance, and it is the single most common fatal omission on the Walmart side — an invoice that would satisfy Amazon's 365-day expectation can be three months stale here and fail on its date alone.

## clause: wmt.appeal#consequences-of-omission
heading: Consequence of failing to provide documentation
obligation_type: standard
reason_codes: [WMT.PERF.STANDARDS, WMT.OPS.PROHIBITED]
status: active
excerpt: "Failure to do so may result in the denial of your appeal case and further action on your selling privileges."

Walmart states that failing to provide the requested material may result in the denial of the appeal case and further action against the seller's selling privileges.

"Further action" on an already-suspended account means termination is on the table for a documentation failure alone, independent of the underlying violation.

## clause: wmt.appeal#submit
heading: Step 3 — how to submit, by enforcement type
obligation_type: requirement
reason_codes: [WMT.PERF.STANDARDS, WMT.COC.CONDUCT]
status: active
excerpt: null

The submission route depends on what happened to the account. For a suppression, the seller selects the "Start appeal" banner on the Performance page. For a suspension, the seller contacts support through the Help button in Seller Center.

Getting this wrong costs days: a suspended seller looking for a "Start appeal" banner that only exists for suppressions will conclude, wrongly, that there is no route.

## clause: wmt.appeal#timeline
heading: Appeal timeline
obligation_type: standard
reason_codes: [WMT.PERF.STANDARDS, WMT.COC.CONDUCT, WMT.AGREEMENT.RETAILER]
status: active
excerpt: "handled and responded to in the order in which they're received"

Walmart states that appeals are handled and responded to in the order in which they are received, and commits to no timeframe.

Two consequences follow. Any promise of a Walmart decision date is unsupported by the published guidance and must not be made to a seller. And because there is no committed timeline, the outcome follow-up sequence has to be spread across several touchpoints rather than pinned to one expected date (CORPUS_DESIGN.md §4.3).
