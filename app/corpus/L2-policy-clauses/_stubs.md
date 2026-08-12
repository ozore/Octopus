---
source_id: _stubs
platform: AMZ
title: Recorded but unobtained sources
tier: D
access_mode: human_read
url: https://sellercentral.amazon.com/gp/help/external/G200370560
robots_status: allowed
marketplace_edition: unknown
publisher_date: null
first_fetched_at: 2026-08-12
last_verified_at: 2026-08-12
content_sha256: null
extraction_method: none
license_posture: Not obtained. No text stored.
citable: false
jurisdiction_caveat: true
stub: true
stub_reason: >-
  Container record for every source that is named in CORPUS_DESIGN.md §3.5 or was
  discovered during this build, was attempted, and did not yield usable text.
  Carries ZERO clauses by construction. Its purpose is to make the holes in this
  corpus enumerable rather than invisible — a source that is missing and recorded
  can be assigned to someone; a source that is missing and unrecorded is
  indistinguishable from a source that does not exist.
reason_codes_covered: []
stub_entries:
  - source_id: amz.ip
    title: Amazon Intellectual Property Policy
    url: https://m.media-amazon.com/images/G/02/rainier/help/legal/Amazon_Intellectual_Property_Policy_EN_161220.pdf
    tier: A
    attempted_at: 2026-08-12
    http_status: 200
    failure: >-
      Fetched successfully (590,222 bytes) but no text could be extracted — the
      PDF's content streams carry subset-font encodings with no recoverable
      mapping in this environment. Bytes retrieved, meaning not. Needs a proper
      PDF text layer extractor or a human read.
    would_govern: [AMZ.IP.TRADEMARK, AMZ.IP.COPYRIGHT, AMZ.IP.PATENT, AMZ.AUTH.COUNTERFEIT]
    impact: >-
      All four codes are refer_out (we do not draft them), so the gap costs
      referral-explanation quality rather than draft quality. It is still the
      largest single content hole in Corpus A.
  - source_id: amz.cond
    title: Condition Guidelines
    url: https://m.media-amazon.com/images/G/02/rainier/help/legal/Condition_Guidelines_EN_161220.pdf
    tier: A
    attempted_at: 2026-08-12
    http_status: 200
    failure: Same subset-font extraction failure as amz.ip (523,843 bytes retrieved, zero readable characters).
    would_govern: [AMZ.AUTH.CONDITION, AMZ.AUTH.EXPIRY]
    impact: >-
      Both codes fall back to amz.coc#accurate-information and
      amz.psaa#inaccurate-product-matching, which govern accuracy generally but do
      not define Amazon's condition tiers. A condition-tier assertion must not be
      drafted until this source is read.
  - source_id: amz.commguide
    title: Communication Guidelines
    url: https://m.media-amazon.com/images/G/01/rainier/help/legal/Communication_Guidelines_English_US_090820.pdf
    tier: A
    attempted_at: 2026-08-12
    http_status: 200
    failure: >-
      Text extracted but character-encoded through a subset-font cipher; the
      recovered stream is structurally intact and semantically unreadable. Notable
      because the CDN path segment is G/01 — the US marketplace — making this the
      only confirmed US-edition Amazon document located in this build. Worth a
      proper extraction pass precisely for that reason.
    would_govern: [AMZ.COC.DIVERSION]
    impact: Covered in the meantime by amz.psaa and amz.coc.
  - source_id: amz.bsa
    title: Amazon Services Business Solutions Agreement (including Section 3, Term and Termination)
    url: https://sellercentral.amazon.com/gp/help/external/G1791
    tier: D
    attempted_at: 2026-08-12
    http_status: 200
    failure: >-
      Login-gated. CORPUS_DESIGN.md §3.6-D makes automated access a bright line
      (N11), not a managed risk, so this is not a technical failure to route
      around. A human with a legitimate Professional seller account reads it and
      authors our summary. An AU-edition public mirror
      (m.media-amazon.com/images/G/35/rainier/help/AU_EN_BSA_PDF.pdf) was fetched
      and also failed text extraction; it would carry jurisdiction_caveat anyway.
    would_govern: [AMZ.COC.SECTION3]
    impact: >-
      AMZ.COC.SECTION3 is drafted against amz.coc#enforcement and
      amz.psaa#scope-and-consequences, which state the same enforcement power but
      are NOT Section 3. The taxonomy record carries this as an explicit gap so no
      draft can imply otherwise.
  - source_id: amz.help.g200370560
    title: Appeal an account deactivation or listing removal
    url: https://sellercentral.amazon.com/gp/help/external/G200370560
    tier: D
    attempted_at: 2026-08-12
    http_status: 200
    failure: >-
      Login-gated (returns a logged-out marketing shell with no appeal text).
      Human read only, per N11.
    would_govern: []
    impact: >-
      CORPUS_DESIGN.md §3.5 calls this the single most valuable Amazon page for
      this product. Its absence is partly covered by amz.ahc#plan-of-action, which
      carries Amazon's own three-part plan structure from a public Tier-A
      document — the F1 finding paying off exactly where it was predicted to.
  - source_id: amz.spc.sg
    title: Selling Policies and Seller Code of Conduct (Singapore edition)
    url: https://m.media-amazon.com/images/G/65/rainier/help/Selling_Policies_and_Seller_Code_of_Conduct_SG_new_version_clean_PDF.pdf
    tier: A
    attempted_at: 2026-08-12
    http_status: 200
    failure: >-
      Not a failure — fetched and extracted successfully (95,306 characters). NOT
      ADOPTED as a source: its substantive content duplicates amz.coc, and it is a
      non-US edition, so adopting it would add jurisdiction-caveated duplicates of
      clauses we already hold caveat-free. Recorded so the decision is visible
      rather than looking like an oversight.
    would_govern: []
    impact: None. Use amz.coc.
  - source_id: amz.bsa.mirror
    title: Amazon Services Business Solutions Agreement — third-party public mirror
    url: https://www.abilityone.gov/laws,_regulations_and_policy/documents/Amazon%20Services%20Business%20Solutions%20Agreement.pdf
    tier: corroboration
    attempted_at: 2026-08-12
    http_status: not_attempted
    failure: >-
      Deliberately not ingested. CORPUS_DESIGN.md §3.5 marks it citable:false —
      an undated third-party mirror of a frequently-amended agreement. Useful only
      for structural orientation, and structural orientation is not worth a corpus
      record that a future engineer might mistake for a source.
    would_govern: []
    impact: None.
---

This file carries no clauses. See the `stub_entries` block in the front matter.

The loader treats any source with `stub: true` as contributing zero clauses to retrieval,
so nothing here can reach a draft. That is the point: a stub is a recorded hole, and a hole
that is written down is a task. Fabricating policy text to fill one would be the single
worst thing this corpus could do, because the product's entire promise is that the clause it
shows you is real.
