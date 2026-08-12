---
source_id: amz.coc
platform: AMZ
title: Overview of the Amazon seller code of conduct
tier: A
access_mode: cdn_pdf
url: https://m.media-amazon.com/images/G/28/AS/AGS/SU/CN_GS_Seller_Codes_of_Conduct_1.1_Amazon_Policy_NA_EN.pdf
alt_urls: [https://sellercentral.amazon.com/help/hub/reference/external/G1801]
robots_status: no_rule_for_our_agent
marketplace_edition: NA
publisher_date: null
first_fetched_at: 2026-08-12
last_verified_at: 2026-08-12
content_sha256: 95d33dc8067ef1b1a897865a08ebf68e7f843f8790307fd1718a12428d0088cb
extraction_method: pdf_text_extraction
license_posture: Amazon-copyrighted. Store our own summaries only. Excerpts <=25 words, marked as excerpts.
citable: true
jurisdiction_caveat: false
stub: false
reason_codes_covered: [AMZ.AUTH.INAUTHENTIC, AMZ.AUTH.COUNTERFEIT, AMZ.AUTH.CONDITION, AMZ.AUTH.EXPIRY, AMZ.COC.SECTION3, AMZ.COC.LINKED, AMZ.COC.MULTIACCOUNT, AMZ.COC.REVIEW_MANIP, AMZ.COC.RANK_ABUSE, AMZ.COC.SEARCH_ABUSE, AMZ.COC.DIVERSION, AMZ.COC.SELLER_ABUSE, AMZ.COC.BIZ_NAME, AMZ.COC.FRAUD, AMZ.OPS.VERIFICATION]
retrieval_note: >-
  Fetched and text-extracted on 2026-08-12 (145,494 bytes). CDN path segment G/28
  is the NA-multi marketplace id per CORPUS_DESIGN.md §3.5, so this edition is
  US-usable and jurisdiction_caveat is false. It is the only Amazon source in
  this corpus without a jurisdiction caveat, which makes it load-bearing for
  every US Amazon draft — a single point of failure worth watching.
  The document is authored for cross-border sellers selling into North America;
  the policy statements are the NA ones, but a human should confirm the edition
  against the login-gated G1801 page before the first paying customer.
---

## clause: amz.coc#principles
heading: The seven seller principles
obligation_type: standard
reason_codes: [AMZ.COC.SECTION3]
status: active
excerpt: "Amazon requires sellers to act fairly and honestly on Amazon to ensure a safe buying and selling experience."

The code of conduct opens with a single obligation — act fairly and honestly — and then lists seven principles every seller must adhere to: provide accurate information to Amazon and its customers at all times; do not attempt to damage or abuse another seller, their listings or ratings; do not send unsolicited or inappropriate communications; do not contact customers except through Buyer–Seller Messaging; do not attempt to circumvent the Amazon sales process; do not operate more than one selling account without a legitimate business need; and do not engage in conduct that violates price-fixing laws.

These seven are the spine of most account-level deactivations. A notice that names no specific policy document is usually reachable through one of them, and naming the principle is often the difference between an appeal that answers the charge and one that answers a guess.

## clause: amz.coc#accurate-information
heading: Provide accurate information to Amazon and our customers at all times
obligation_type: requirement
reason_codes: [AMZ.AUTH.INAUTHENTIC, AMZ.AUTH.COUNTERFEIT, AMZ.AUTH.CONDITION, AMZ.AUTH.EXPIRY, AMZ.COC.BIZ_NAME, AMZ.COC.FRAUD, AMZ.OPS.VERIFICATION]
status: active
excerpt: "You must provide accurate information to Amazon and our customers, and update the information if it changes."

The first principle is a continuing obligation, not a one-time one: information given to Amazon and to customers must be accurate, and it must be updated when it changes. Two examples are given directly — using a business name that accurately identifies your business, and listing products in the correct category.

The clause then adds the fairness limb: you must act fairly and lawfully and may not misuse any service Amazon provides. The examples of unfair activity it enumerates are misleading or inappropriate information (such as creating multiple detail pages for the same product or posting offensive product images), manipulating sales rank, raising a price after an order is confirmed, artificially inflating web traffic, influencing search results through keyword manipulation, damaging another seller, and permitting others to act on your behalf in a way that violates Amazon policies or your agreement.

That last example is the one sellers most often overlook in an appeal. An agency, a virtual assistant, or a freelancer acting on your account is your conduct under this clause, which is why disclosing the third party is a stronger position than a denial that omits them.

## clause: amz.coc#sales-rank-manipulation
heading: Manipulating sales rank as an unfair activity
obligation_type: prohibition
reason_codes: [AMZ.COC.RANK_ABUSE]
status: active
excerpt: "Manipulating sales rank (such as by accepting non-authentic orders or orders that you have paid for, or refunded externally"

The code lists sales-rank manipulation among the unfair activities that breach the accurate-information principle, and characterises it by the transaction rather than the intent: accepting non-authentic orders, orders you paid for yourself, orders you refunded externally, or orders you discounted externally. Making claims about sales rank in product titles or descriptions is named in the same breath.

The worked example the document gives is a seller creating fake orders to improve an ASIN's ranking so more overseas consumers see the product. External refunds are the trap here: a refund arranged off-platform converts an otherwise ordinary order into a rank-manipulation signal.

## clause: amz.coc#search-ranking-manipulation
heading: Influencing search results through keyword manipulation
obligation_type: prohibition
reason_codes: [AMZ.COC.SEARCH_ABUSE]
status: active
excerpt: "Attempting to influence search results by inflating search ranking through keyword manipulation"

Attempting to influence search results by inflating search ranking through keyword manipulation is listed as an unfair activity, alongside artificially inflating web traffic using bots or paid clicks.

This is the code-of-conduct-level statement of the same conduct the Prohibited Seller Activities policy addresses in detail at `amz.psaa#search-and-browse`. Where a notice cites the code of conduct rather than the activities policy, this is the clause it is reaching for.

## clause: amz.coc#damage-another-seller
heading: Do not attempt to damage or abuse another seller, their listings, or ratings
obligation_type: prohibition
reason_codes: [AMZ.COC.SELLER_ABUSE]
status: active
excerpt: "Do not attempt to damage or abuse another seller, their listings, or ratings"

The second principle prohibits attempting to damage or abuse another seller, their listings, or their ratings. It stands on its own: no customer harm is required for the conduct to be a violation.

In practice this is the principle behind deactivations for malicious detail-page edits, coordinated negative feedback, and abusive use of Amazon's reporting systems against a competitor. It is also the principle most often invoked against a seller who believes they were the victim rather than the actor, which is why an appeal here usually turns on establishing who initiated what, and when.

## clause: amz.coc#reviews-and-feedback
heading: Requesting feedback and reviews
obligation_type: prohibition
reason_codes: [AMZ.COC.REVIEW_MANIP]
status: active
excerpt: "Pay for or offer an incentive (such as coupons or free products) in exchange for providing or removing feedback or reviews"

Sellers may request feedback and reviews from their own customers in a neutral manner. Three things are then prohibited: paying for or offering an incentive such as coupons or free products in exchange for providing or removing feedback or reviews; asking customers to write only positive reviews, or to remove or change a review; and soliciting reviews only from customers who had a positive experience.

The third is the one that catches otherwise careful operations, because selective solicitation looks like good customer service from the inside. Filtering who gets asked is itself the violation, independent of what anyone was asked to write.

## clause: amz.coc#customer-contact
heading: Do not contact customers except through Buyer-Seller Messaging
obligation_type: prohibition
reason_codes: [AMZ.COC.DIVERSION]
status: active
excerpt: "Do not contact customers except through Buyer-Seller Messaging"

Customer contact must go through Buyer–Seller Messaging, and customer information may not be shared outside it or with any third party.

The document's own examples are worth knowing because they show how wide the principle runs: a promotional message sent through a messaging service; leaving an email address or social-media account so that after-sales service can be handled off-site; sharing customer information with another seller for joint marketing; and saving the contact details of past buyers to use when promoting new products. The last two are violations at the point of retention and sharing — before any message is ever sent.

## clause: amz.coc#circumvent-sales-process
heading: Do not attempt to circumvent the Amazon sales process
obligation_type: prohibition
reason_codes: [AMZ.COC.DIVERSION]
status: active
excerpt: "you may not provide links or messages that prompt users to visit any external website or complete a transaction elsewhere"

You may not attempt to circumvent the Amazon sales process or get Amazon customers to go to other websites, which the code renders concretely as: no links and no messages that prompt users to visit any external website or complete a transaction elsewhere.

The examples given are physical, not digital — a card in the product package offering cashback or a lower price through a third-party website, and a QR code pointing at a third party's purchase address inside a product image. An appeal that inventories only email and listing copy, and not inserts and imagery, has not addressed the clause as written.

## clause: amz.coc#one-account-per-region
heading: Do not operate more than one selling account without a legitimate business need
obligation_type: requirement
reason_codes: [AMZ.COC.MULTIACCOUNT, AMZ.COC.LINKED]
status: active
excerpt: "You may only maintain one Seller Central account for each region in which you sell unless you have a legitimate business need"

One Seller Central account per region is the rule; a second is permitted only where there is a legitimate business need and all of the accounts are in good standing. The consequence is stated in the same clause and it is the part sellers usually do not know: if any account is not in good standing, Amazon may deactivate all of the seller's accounts until every one of them is.

Three examples of a legitimate business justification are given: owning multiple brands and maintaining separate businesses for each, manufacturing products for two distinct and separate companies, and being recruited for an Amazon program that requires separate accounts.

This is the governing clause for both the multiple-account code and the linked-account code, and the distinction between them is factual rather than legal — whether the second account is yours, or is someone else's that Amazon believes is connected to you.

## clause: amz.coc#infringement-notices-as-agent
heading: Filing infringement notices as an agent or brand protection agency
obligation_type: prohibition
reason_codes: [AMZ.COC.SELLER_ABUSE]
status: active
excerpt: "Any seller who submits a notice as an agent for personal gain may have their selling account terminated."

Amazon accepts infringement notices from authorised brand agents, but does not allow individuals with active selling accounts to submit them as brand agents, because doing so may benefit the submitter's own account — the example given is the removal of competing products.

The stated consequence is termination of the selling account. This is the code-of-conduct twin of `amz.psaa#infringement-notices-as-agent`; where a notice cites the code of conduct, cite this one.

## clause: amz.coc#enforcement
heading: Consequences of violating the code of conduct
obligation_type: standard
reason_codes: [AMZ.COC.SECTION3, AMZ.COC.FRAUD, AMZ.COC.LINKED]
status: active
excerpt: "Amazon may take action against your account, such as canceling listings, suspending or forfeiting payments, and revoking selling privileges."

Violating the code of conduct or any other Amazon policy exposes the account to a stated range of actions: cancelling listings, suspending or forfeiting payments, and revoking selling privileges.

Two things in that list matter for triage. Payment suspension and forfeiture are named alongside deactivation, which is why a seller's disbursements can stop before, or without, a deactivation notice arriving. And "any other Amazon policy" is what makes this clause the general enforcement statement — but it is not Section 3 of the Business Solutions Agreement, and it should never be cited as though it were. Section 3 lives in the agreement, which is login-gated (see `amz.bsa`).

## clause: amz.coc#updates
heading: Updates to the seller code of conduct
obligation_type: standard
reason_codes: [AMZ.COC.SECTION3]
status: active
excerpt: "are continually updated, so sellers should watch for updates and make sure they understand the policies clearly"

The code states that the selling policies and the code of conduct are continually updated, and places the burden of watching for updates and understanding them on the seller.

For this product that sentence is operational, not decorative: it is the platform's own statement that the policy under which a seller is judged is a moving target, and it is the reason change detection on these documents feeds a human review queue rather than auto-publishing (CORPUS_DESIGN.md §3.7).
