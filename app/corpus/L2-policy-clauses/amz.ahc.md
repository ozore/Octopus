---
source_id: amz.ahc
platform: AMZ
title: Overview of Account Health and Policy Compliance
tier: A
access_mode: cdn_pdf
url: https://m.media-amazon.com/images/G/28/AS/AGS/SU/CN_GS_Account_Health_and_Compliance_1.1_Overview_EN.pdf
robots_status: no_rule_for_our_agent
marketplace_edition: NA
publisher_date: null
first_fetched_at: 2026-08-12
last_verified_at: 2026-08-12
content_sha256: 231251a89387fd541f30f21c22ff384f830e5266a741b16239e85fb4ceb6518f
extraction_method: pdf_text_extraction
license_posture: Amazon-copyrighted. Store our own summaries only. Excerpts <=25 words, marked as excerpts.
citable: true
jurisdiction_caveat: false
stub: false
reason_codes_covered: [AMZ.PERF.ODR, AMZ.PERF.LSR, AMZ.PERF.PCR, AMZ.PERF.VTR, AMZ.PERF.AHR, AMZ.AUTH.INAUTHENTIC, AMZ.AUTH.EXPIRY, AMZ.IP.TRADEMARK, AMZ.IP.COPYRIGHT, AMZ.IP.PATENT, AMZ.SAFETY.PRODUCT, AMZ.SAFETY.RESTRICTED, AMZ.SAFETY.GPSR, AMZ.OPS.VERIFICATION]
retrieval_note: >-
  Fetched and text-extracted on 2026-08-12 (1,202,286 bytes; text recovered from
  the decompressed content streams and filtered for printable content). CDN path
  segment G/28 is NA-multi per CORPUS_DESIGN.md §3.5, so jurisdiction_caveat is
  false. ANOMALY, recorded rather than smoothed over: one support-contact passage
  in this document references a Singapore country code, which suggests a shared
  regional template. The metric definitions are marketplace-neutral, but a human
  must confirm the edition before any numeric threshold below is cited to a US
  seller. Flagged as open work, not resolved.
---

## clause: amz.ahc#what-account-health-is
heading: What account health and policy compliance means
obligation_type: definition
reason_codes: [AMZ.PERF.AHR]
status: active
excerpt: "This includes providing required product safety and compliance documentation."

Account health is Amazon's summary of whether a seller account meets the required performance goals and policies for selling in the Amazon store. Compliance in this context means complying with all federal, state, provincial, territorial and local laws, and with Amazon's policies applicable to the products listed and to the listings themselves — explicitly including the provision of required product safety and compliance documentation.

The definition is broader than metrics. A seller who reads "account health" as a scoreboard will under-read a notice that is actually about documentation.

## clause: amz.ahc#corrective-action
heading: Amazon's corrective action and immediate suspension
obligation_type: standard
reason_codes: [AMZ.PERF.AHR]
status: active
excerpt: "there are also some situations where Amazon immediately removes non-compliant products or suspends accounts that are significantly underperforming"

Amazon states that it regularly reviews all sellers' performance and will notify a seller when account health can be optimised, with the stated intent of giving the seller a chance to improve before the issue affects their ability to sell.

The same passage records the exception, and it is the one that matters to a deactivated seller: there are situations where Amazon immediately removes non-compliant products or suspends accounts that are significantly underperforming. Amazon also states it may take appropriate corrective action where account health does not meet its requirements or where there are compliance issues with the products sold.

An appeal that argues "we were never warned" is arguing against a policy that expressly reserves the right not to warn.

## clause: amz.ahc#order-defect-rate
heading: Order Defect Rate
obligation_type: standard
reason_codes: [AMZ.PERF.ODR]
status: active
excerpt: "sellers are allowed to sell on Amazon only if their order defect rate is lower than 1%"

The Order Defect Rate is described as the main indicator of customer experience. It covers all orders with one or more defects as a percentage of total orders in a given 60-day period.

Three things make an order defective: negative feedback, an A-to-z Guarantee claim that has not been declined, and a credit-card chargeback. The stated threshold is explicit — selling is permitted only where the order defect rate is below 1%, and above 1% the account may be suspended.

The 60-day window and the three-component decomposition are the two facts an ODR appeal is built on. A plan that promises to "improve customer service" without naming which of the three components moved, and in which weeks of the window, has not engaged with the metric Amazon actually measured.

## clause: amz.ahc#late-shipment-rate
heading: Late Shipment Rate
obligation_type: standard
reason_codes: [AMZ.PERF.LSR]
status: active
excerpt: "Percentage of total orders where shipment confirmation is completed after the expected ship date"

Late Shipment Rate is the percentage of total orders where shipment confirmation is completed after the expected ship date, and it applies only to seller-fulfilled orders. The document states that an account may be suspended where the rate is too high.

Note what the metric measures: the timing of the shipment confirmation, not the timing of the parcel. A seller who shipped on time but confirmed late has the same defect as one who shipped late, and that distinction is usually the real root cause.

## clause: amz.ahc#cancellation-rate
heading: Pre-fulfilment Cancellation Rate
obligation_type: standard
reason_codes: [AMZ.PERF.PCR]
status: active
excerpt: "of all orders canceled by the seller in a given seven-day period"

The pre-fulfilment cancellation rate is the percentage of all orders cancelled by the seller in a given seven-day period. It includes every seller-initiated cancellation and excludes orders the customer cancels using the cancellation function in their own Amazon account; pending orders cancelled by the customer are not included either.

The seven-day window is short enough that a single stock-out weekend can carry the metric, which is why credible corrective action for this code is almost always about inventory synchronisation frequency rather than about intent.

## clause: amz.ahc#valid-tracking-rate
heading: Valid Tracking Rate
obligation_type: standard
reason_codes: [AMZ.PERF.VTR]
status: active
excerpt: "The proportion of shipments with a valid tracking number in a given 30-day period."

Valid Tracking Rate is the proportion of shipments carrying a valid tracking number in a given 30-day period, and it applies to seller-fulfilled orders. Amazon frames it in terms of buyer expectation — customers rely on tracking to know where an order is — and notes that all major carriers, USPS, FedEx, UPS and DHL among them, offer free tracking.

That last observation is why a "tracking is too expensive" root cause reads badly against this clause: the policy document itself pre-empts it.

## clause: amz.ahc#account-health-rating
heading: Account Health Rating
obligation_type: standard
reason_codes: [AMZ.PERF.AHR]
status: active
excerpt: "Green means healthy, yellow means at risk, and red means unhealthy."

The Account Health Rating is Amazon's feedback on a seller's compliance with selling policies. The document states what the rating reflects — the number of unresolved policy violations on the account at any time, the relative severity of those violations, and the extent to which the seller positively affects the customer experience through their selling activity — and notes that the rating is to be refined over time.

Two numeric facts appear in this Tier-A document and are recorded here because they are the only ones in this corpus that are not vendor-sourced: the rating uses a green / yellow / red banding where green means healthy, yellow at risk and red unhealthy, and all new sellers start with a score of 200.

Everything else circulating about the AHR — that 200 or more is the "healthy" line, that Account Health Assurance requires a sustained score with a Professional plan and an emergency contact, that there is a 72-hour pre-deactivation window — comes from third-party vendor guides and is deliberately absent from this corpus (CORPUS_DESIGN.md §3.5). A drafted plan that asserted a threshold and was wrong would damage precisely the trust this product sells.

The document also states plainly that good account health does not guarantee an account will not be suspended.

## clause: amz.ahc#policy-compliance-checklist
heading: Policy Compliance Checklist
obligation_type: definition
reason_codes: [AMZ.AUTH.INAUTHENTIC, AMZ.AUTH.EXPIRY, AMZ.IP.TRADEMARK, AMZ.IP.COPYRIGHT, AMZ.IP.PATENT, AMZ.PERF.AHR]
status: active
excerpt: "lists different types of policy violations in your seller account, including infringement, product authenticity complaints, product quality complaints, and listing policy violations"

Policy compliance is described as having two parts: the Account Health Rating and the Policy Compliance Checklist. The checklist enumerates the types of violation recorded against a seller account, and the enumeration is the useful part: infringement, product authenticity complaints, product quality complaints, and listing policy violations.

This is the highest-authority public statement in this corpus that "product authenticity complaint" is a distinct, named violation type on the account rather than an informal description — which is what makes it the governing clause for the inauthentic code, and the closest public anchor for the intellectual-property codes.

It is an enumeration, not a definition. It establishes that the category exists and where it is recorded; it does not state what evidence resolves it. Any draft that needs the second must escalate rather than infer.

## clause: amz.ahc#plan-of-action
heading: Appealing an account deactivation with a Plan of Action
obligation_type: requirement
reason_codes: [AMZ.PERF.ODR, AMZ.PERF.LSR, AMZ.PERF.PCR, AMZ.PERF.VTR, AMZ.PERF.AHR, AMZ.OPS.VERIFICATION]
status: active
excerpt: "you can use the Appeal button in Seller Central to submit a plan of action to resolve the problem"

Once a seller is notified of an account health issue through the Account Health and Performance Notifications pages, the Appeal button in Seller Central is the route to submitting a plan of action. The document distinguishes two circumstances: account deactivation, where the seller applies to reactivate the account through the "Reactivate your account" path on the Account Health page, and policy compliance issues, where the appeal is filed per item from the Product Policy Compliance section.

The plan of action is stated to have three components: the root cause of the problem, the actions taken to resolve it, and the solution that prevents the issue from recurring.

That three-part structure is Amazon's own, published, and it is the structure this product drafts to. It is worth saying plainly in an appeal that the document follows it, because an investigator reading a wall of prose has to reconstruct the three parts before they can evaluate them.

## clause: amz.ahc#product-policy-compliance
heading: Product Policy Compliance appeals
obligation_type: requirement
reason_codes: [AMZ.SAFETY.RESTRICTED, AMZ.SAFETY.PRODUCT]
status: active
excerpt: "you will see a history of all the content (listings, images) that was removed, along with the current status and the next steps"

The Product Policy Compliance section of the Account Health page carries the history of removed content — listings and images — with the current status and the next steps for each item. To resume selling a removed product, the seller follows the guidance given against that item in the Next Steps column, and appeals per issue with its own plan of action.

The per-item structure is the operational point. A single account-level plan submitted against a page full of individual item removals does not clear the items, and a seller who believes they have appealed may not have appealed anything.

## clause: amz.ahc#compliance-documentation
heading: Product safety and compliance documentation
obligation_type: requirement
reason_codes: [AMZ.SAFETY.PRODUCT, AMZ.SAFETY.GPSR]
status: active
excerpt: "This includes providing required product safety and compliance documentation."

Compliance is defined to include providing required product safety and compliance documentation, placing documentation on the same footing as the product itself.

This is the general obligation, and it is as far as this corpus can honestly go on safety documentation. It does not name a document set, a jurisdiction-specific standard, or the EU General Product Safety Regulation. A GPSR-specific assertion needs a GPSR-specific source, which this corpus does not yet have.

## clause: amz.ahc#support-and-escalation
heading: Support routes for an account health issue
obligation_type: standard
reason_codes: [AMZ.PERF.AHR, AMZ.OPS.VERIFICATION]
status: active
excerpt: null

The document lists the routes available to a seller who is unsure how to resolve an account health issue: the Account Health support team, which in some urgent cases proactively calls the seller on the emergency notification number held on file; the public Seller Forums; and Seller Support.

Two operational details are worth carrying into an appeal. The emergency notification number must be present and current in notification preferences for the proactive call to be possible at all, and Amazon states it may not always call. Neither fact is an entitlement, and neither should be presented to a seller as one.
