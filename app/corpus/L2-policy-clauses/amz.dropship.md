---
source_id: amz.dropship
platform: AMZ
title: Drop Shipping Policy
tier: A
access_mode: cdn_pdf
url: https://m.media-amazon.com/images/G/41/rainier/help/legal/Drop_Shipping_Policy_Update.pdf
robots_status: no_rule_for_our_agent
marketplace_edition: unknown
publisher_date: null
first_fetched_at: 2026-08-12
last_verified_at: 2026-08-12
content_sha256: 28be02f4e67434f45d499081ce5ef1a00c86a6fe3a1d7d409b83e24141008028
extraction_method: pdf_text_extraction
license_posture: Amazon-copyrighted. Store our own summaries only. Excerpts <=25 words, marked as excerpts.
citable: true
jurisdiction_caveat: true
stub: false
reason_codes_covered: [AMZ.OPS.DROPSHIP]
retrieval_note: >-
  Fetched and text-extracted on 2026-08-12 (299,102 bytes). The CDN path segment
  is G/41, which CORPUS_DESIGN.md §3.5's marketplace map does not cover, so the
  edition is UNCONFIRMED and jurisdiction_caveat is true by the §3.5 default.
  CONSEQUENCE, stated so it is not discovered later: AMZ.OPS.DROPSHIP has no
  other governing source, so gate G7 leaves that code with zero citable clauses
  for a US seller and retrieval returns insufficient_corpus rather than a draft.
  Locating the US edition is a named Day-1 task.
---

## clause: amz.dropship#seller-of-record
heading: You must be the seller of record
obligation_type: requirement
reason_codes: [AMZ.OPS.DROPSHIP]
status: active
excerpt: "not acceptable unless it is clear to the customer that you are the seller of record"

Drop shipping — allowing a third party to fulfil orders to customers on your behalf — is not acceptable unless it is clear to the customer that you are the seller of record. Where that is clear, the policy states drop shipping is generally acceptable.

Four cumulative obligations follow for any seller fulfilling through a drop shipper: be the seller of record of your products; identify yourself as the seller on all packing slips and other information included with or provided in connection with them; be responsible for accepting and processing customer returns; and comply with all other terms of the seller agreement and applicable Amazon policies.

The policy adds a fifth, upstream requirement that is usually the real remedy: have an agreement with your supplier that they will identify you — and no one else — as the seller on all packing slips, invoices, external packaging and other accompanying information, and remove any material identifying a third-party drop shipper before the order ships.

## clause: amz.dropship#prohibited-examples
heading: Examples of drop shipping that is not permitted
obligation_type: prohibition
reason_codes: [AMZ.OPS.DROPSHIP]
status: active
excerpt: "Purchasing products from another online retailer and having that retailer ship directly to customers"

Two examples are given as violations, and both are described in absolute terms.

The first is purchasing products from another online retailer and having that retailer ship directly to the customer, where the shipment does not identify you as the seller of record or where anyone other than you appears on packing slips, invoices or external packaging. The policy states this is strictly prohibited without exception.

The second is shipping orders with packing slips, invoices, external packaging or other information indicating a seller name or contact information other than your own. This is described as also strictly prohibited.

Both examples turn on what the customer receives in the box, not on the commercial arrangement behind it. An appeal that documents the supplier relationship without documenting the packaging has answered the wrong question.

## clause: amz.dropship#consequences
heading: Consequences of non-compliance
obligation_type: standard
reason_codes: [AMZ.OPS.DROPSHIP]
status: active
excerpt: null

The policy states that failure to comply with these requirements may result in restrictions on the seller's ability to fulfil orders through Amazon's Merchant Fulfilled Network, up to suspension.

`quoted_excerpt` is deliberately null on this clause. The consequences sentence was truncated mid-word in our text extraction, and CORPUS_DESIGN.md's rule is that we never reconstruct a quotation we did not fully extract. The summary above is our reading of the surrounding text; the exact consequence wording needs a clean re-extraction before it is quoted to anyone.
