---
source_id: wmt.perf
platform: WMT
title: Seller performance standards
tier: B
access_mode: public_html
url: https://marketplacelearn.walmart.com/guides/Policies%20&%20standards/Performance/Seller-performance-standards
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
reason_codes_covered: [WMT.PERF.STANDARDS, WMT.PERF.ODR]
retrieval_note: >-
  Fetched 2026-08-12 through the rendering fetcher, which returns extracted text
  rather than raw bytes, so content_sha256 is null until the ingestion pipeline
  fetches and hashes the HTML itself. Walmart's robots.txt resolved only a
  Sitemap line in this session (CORPUS_DESIGN.md §3.6-B open question); the
  directive set must be parsed in the Day-1 pre-flight before any crawl.
  The eight metric thresholds below are the best-grounded numbers in this corpus:
  Walmart publishes them, logged out, in one place.
---

## clause: wmt.perf#cancellation-rate
heading: Cancellation Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 2% or below."

Walmart's published standard for Cancellation Rate is 2% or below.

A cancellation-driven suspension is therefore arithmetic, and the plan of action can be arithmetic too: which orders were cancelled, in which window, for which cause, and what the rate is after the cause is removed.

## clause: wmt.perf#on-time-delivery-rate
heading: On-Time Delivery Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 90% or above."

Walmart's published standard for On-Time Delivery Rate is 90% or above.

This is a floor rather than a ceiling, which changes the shape of a corrective plan: the seller has to show the rate rising past a line, not falling below one, and carrier performance is usually the dominant term.

## clause: wmt.perf#valid-tracking-rate
heading: Valid Tracking Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 99% or above."

Walmart's published standard for Valid Tracking Rate is 99% or above.

At 99% the tolerance is roughly one order in a hundred, so a manual tracking-upload process is structurally unable to hold this standard at volume. That observation belongs in the preventive section, because it names a control rather than an intention.

## clause: wmt.perf#seller-response-rate
heading: Seller Response Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 95% or above."

Walmart's published standard for Seller Response Rate is 95% or above.

## clause: wmt.perf#negative-feedback-rate
heading: Negative Feedback Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 2% or below."

Walmart's published standard for Negative Feedback Rate is 2% or below.

## clause: wmt.perf#return-rate
heading: Return Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 6% or below, or 9% or below for Resold inventory."

Walmart's published standard for Return Rate is 6% or below, and 9% or below for Resold inventory.

The split threshold matters: a seller running Resold inventory who is judged against the 6% line, or who argues against the 9% line without establishing which inventory type applies, is arguing about the wrong number.

## clause: wmt.perf#item-not-received-rate
heading: Item Not Received Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 2% or below."

Walmart's published standard for Item Not Received Rate is 2% or below.

## clause: wmt.perf#late-shipment-rate
heading: Late Shipment Rate standard
obligation_type: standard
reason_codes: [WMT.PERF.ODR, WMT.PERF.STANDARDS]
status: active
excerpt: "Maintain a rate of 5% or below."

Walmart's published standard for Late Shipment Rate is 5% or below.

## clause: wmt.perf#notification
heading: How Walmart notifies a seller of a shortfall
obligation_type: standard
reason_codes: [WMT.PERF.STANDARDS]
status: active
excerpt: "we'll notify you by email and notification within Seller Center, along with providing recommendations to help you address the issue"

Where performance falls short of any standard, Walmart states it will notify the seller by email and by a notification inside Seller Center, and will provide recommendations for addressing the issue.

Those recommendations are worth retrieving before drafting. A plan of action that does not visibly respond to the platform's own stated recommendation looks, to the reviewer, like a plan written without reading the notice.

## clause: wmt.perf#consequences
heading: Consequences of failing the standards
obligation_type: standard
reason_codes: [WMT.PERF.STANDARDS, WMT.PERF.ODR]
status: active
excerpt: "Failure to do so may result in suppression, suspension or termination of your account."

Where an account fails to meet any of the standards, the seller must take immediate action to improve performance, and failure to do so may result in suppression, suspension or termination of the account.

Three escalating states are named, and they are not interchangeable — suppression, suspension and termination are different postures with different routes back, and Walmart's appeal guide routes suppression and suspension through different channels (`wmt.appeal#submit`).
