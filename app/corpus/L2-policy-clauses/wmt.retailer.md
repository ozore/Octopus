---
source_id: wmt.retailer
platform: WMT
title: Walmart Marketplace Seller Retailer Policies
tier: B
access_mode: public_html
url: https://marketplacelearn.walmart.com/guides/Policies%20&%20standards/Account/Walmart-Marketplace-seller-retailer-policies
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
reason_codes_covered: [WMT.AGREEMENT.RETAILER]
retrieval_note: >-
  Fetched 2026-08-12. This is the index of the Walmart policy set, not the
  Retailer Agreement itself. The Agreement is the contract; this page is the
  published policy list that the Agreement incorporates. Do not cite this page as
  though it were the Agreement's terms.
---

## clause: wmt.retailer#compliance-obligation
heading: Sellers must know and comply with every policy
obligation_type: requirement
reason_codes: [WMT.AGREEMENT.RETAILER]
status: active
excerpt: "All Walmart Marketplace sellers are responsible for being aware of and compliant with all policies, rules, and guidelines."

Sellers are responsible for being aware of, and compliant with, all Walmart policies, rules and guidelines.

## clause: wmt.retailer#policy-scope
heading: What the Retailer Policies cover
obligation_type: standard
reason_codes: [WMT.AGREEMENT.RETAILER]
status: active
excerpt: null

The policy set spans the seller agreement documents — the Retailer Agreement, the Seller Code of Conduct, performance standards, returns, shipping and fulfilment, prohibited products, tax collection, multiple-account restrictions and information security — plus a second group of operating rules covering pricing and promotions, listing standards including GTIN and UPC requirements and packaging, reviews and chargebacks, duplicate listings, image and content standards, selling limits, and warranties.

The breadth is the point for triage. A Walmart notice that names "Retailer Agreement violation" without naming a policy could be any of these, and that ambiguity is why this reason code carries a judgment_required severity rather than a standard one.

## clause: wmt.retailer#consequences
heading: Consequences of non-compliance
obligation_type: standard
reason_codes: [WMT.AGREEMENT.RETAILER]
status: active
excerpt: "Failure to adhere may result in account suspension or termination from the Marketplace program."

Failure to adhere to the Retailer Policies may result in account suspension or termination from the Marketplace program.

## clause: wmt.retailer#suspension-termination
heading: Suppression, pause, suspension and termination
obligation_type: standard
reason_codes: [WMT.AGREEMENT.RETAILER]
status: active
excerpt: "Walmart can suspend or terminate seller accounts that don't meet our performance standards or comply with our policies."

The policy set contains a separate suppression, pause, suspension and termination policy, which states that Walmart can suspend or terminate seller accounts that do not meet its performance standards or comply with its policies.

Four states are named — suppression, pause, suspension and termination — and they are distinct. Establishing which one the account is actually in is the first thing an appeal has to get right, because the submission route differs (`wmt.appeal#submit`) and so does what the seller is asking for.
