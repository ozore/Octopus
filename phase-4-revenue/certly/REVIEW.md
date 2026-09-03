# Certly — wave-1b adversarial review

**Reviewer:** wave-1b Reviewer agent (Certly). **Date:** 2026-09-03.
**Scope read in full:** `PERSONA.md`, `IDENTITY.md`, `design-system.css`, `UX.md`, `identity/samples.html`,
`identity/contrast.py`, `identity/research/*`, `BACKLOG.md`, `specs/01`–`specs/15`,
`specs/schema/coi.v1.schema.json`, `KNOWLEDGE_BASE.md`, `kb-samples/MANIFEST.md`, `THRESHOLDS.md`,
`OFFER.md`, `LANDING_SPEC.md`, `offer/RESEARCH.md`, `identity/CLAUDE.md`, `product/CLAUDE.md`,
`offer/CLAUDE.md`, `../PLAN.md`, `../PIPELINE.md`, `../PREREQUISITES.md`,
`../../phase-1-ideation/ERRATA.md`.
**Standing rule honoured:** I edited nothing I reviewed. This file and `review/CLAUDE.md` are the only
things written.

**Two things are explicitly *not* mine to decide, and I have not decided them:**
1. **Typography and ground.** All three apps chose Public Sans + IBM Plex Mono on paper grounds. That
   collision is being arbitrated centrally in `../IDENTITY_ARBITRATION.md` by the Brand Director.
   `IDENTITY.md §7.1`, `§14.1` and `§17.3` are **subject to that arbitration**; everything I say about
   typography below is about *mechanism* (how the fonts load, whether tokens survive a swap), never
   about which face wins. Findings B-12 and MJ-05 are written so that they hold whichever way the
   arbitration goes.
   **Note added at 20:53, during this review:** the arbitration's first edits landed in
   `design-system.css`, `identity/contrast.py` and `identity/samples.html` — Certly is now
   **Source Sans 3 + Source Code Pro** on a **cool office white `#E8EEF6`**, with new `sunken`, `line`,
   `line-strong` and all four status ramps. I re-ran the certification against the new values (it
   passes — see below) and recorded the consequence as **B-15**: `IDENTITY.md` was not edited with them
   and now documents a palette the CSS no longer has. B-15 is a *consistency* finding, not a typography
   opinion; I take no position on the faces or the ground.
2. **Anything the founder must own commercially** — the guarantee, the $49 tier, the ACORD licence.
   Those are consolidated in §5 with a recommended default each, per the brief.

---

## 0. Verdict

> **BLOCKING 15 · MAJOR 20 · MINOR 12.**
> **Not signed. The definition work is unusually strong and the review found no fabricated evidence
> anywhere — but the three documents disagree about the product's central noun, its central number and
> its central screen, and four Must specs cannot be built as written.** Every blocking finding below
> carries a decision, so no round of clarification is needed: the authors can act on this file directly.

What is genuinely excellent, said first because a reviewer who only lists faults is not useful:

- **Evidence discipline is the best I have seen in this fleet.** Rival claims are labelled as rival
  claims (`PERSONA.md §4`), three of bcs's competitor claims were tested and *dropped* (`offer/CLAUDE.md`
  §Contradictions logged), and the phase-1 premise that the self-serve floor was empty was killed by the
  authors themselves (`BACKLOG.md §0`, `ERRATA.md` E5) rather than defended.
- **`identity/contrast.py` runs and passes — before *and* after the arbitration.** I executed it twice:
  against the original palette (*"All 104 declared pairs pass: 46 contrast + 6 greyscale, × 2 themes"*,
  exit 0) and again after the Brand Director's 20:53 edits (*"All 112 declared pairs pass: 50 contrast
  + 6 greyscale, × 2 themes"*, exit 0). **That the accessibility guarantee survived a full palette swap
  untouched is the strongest possible argument for how this was built**: the colour-independence
  argument (every status carries a word, a glyph, a fill pattern and a hue, with glyph/pattern/word
  uniqueness hard-failed in code) is machine-enforced rather than asserted. It is the single most
  defensible piece of work in the whole Certly folder.
- **`specs/schema/coi.v1.schema.json` is structurally valid.** I validated it: every object sets
  `additionalProperties:false`, every object's `required` lists every property, every `$ref` resolves.
  It is genuinely ready for `output_config.format`.
- **The three-state truth (`asserted_only`) is a real product idea, not a slogan**, and it is grounded in
  a verbatim sentence printed on the artefact itself.
- **`BACKLOG.md §4 NEVER`** is the most valuable page in the folder. N1, N4 and N8 close off precisely
  the failure modes that would end the company.

---

## 1. Findings

Severity: **B** = blocking (wave 2 cannot start on the affected module, or the founder carries
avoidable liability). **MJ** = major (must be fixed before the module ships). **MN** = minor.
Owner: **identity** (Buyer & Identity agent), **product** (Product Owner agent), **offer**
(Offer & Landing agent), **founder** where only the founder can decide.

### 1.1 Blocking

| id | file · section | finding | evidence | required change | owner |
|---|---|---|---|---|---|
| **B-01** | `KNOWLEDGE_BASE.md §A.2`; `specs/03 §6`; `specs/schema/coi.v1.schema.json` `form_edition`; `kb-samples/MANIFEST.md` | **The knowledge base names the wrong current edition of the form the entire product reads.** KB §A.2 states *"`ACORD 25 (2016/03)` is the current edition as of 2026-09-03"* with `confidence: high`. It is not. **ACORD 25 (2025/12) exists**, and the enum in the committed schema has no value for it, so today's newest certificates extract as `form_edition: "unknown"` — and KB §A.2 says the edition *"drives §A.2 layout handling"*. | The identity fleet fetched the blank **ACORD 25 (2025/12)** from New York DFS and committed the text at `identity/research/acord25-form-text.txt`; it is source `[E7]` in `identity/research/sources.md` and is quoted in `PERSONA.md §2.5`, `IDENTITY.md §3 Step 9` and `UX.md §3.1b`. **I re-fetched it myself** (`https://www.dfs.ny.gov/apps-and-licensing/insurance-companies/certificates-approved/acord-25-2025-12-liability`, 200, `%PDF`): the footer reads **`ACORD 25 (2025/12)  © 1988-2025 ACORD CORPORATION`**, and the head carries a paragraph absent from the 2016/03 text in the corpus — *"THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER."* Two independent agents have now fetched it; PLAN §A10's double-verification is satisfied *against* the KB. | Add `"2025/12"` to the `form_edition` enum in `specs/schema/coi.v1.schema.json` and to `specs/03 §6`, `KNOWLEDGE_BASE.md §A.2` (as **current**, demoting 2016/03 to "still in wide circulation") and the `certificates.formEdition` comment in `specs/03 §4`. Add the DFS blank as a corpus row and a golden-set fixture (it is a blank, so it tests structure, not values). Re-open the *"Editions"* row of `KNOWLEDGE_BASE.md §E` — the refresh policy says a new edition must add a fixture and an enum value *before* any parsing change, and that has already happened without anyone noticing. | product |
| **B-02** | `PERSONA.md §2.5`, `§2.9.4`; `IDENTITY.md §4.2`, `§6.4`, `§9`; `KNOWLEDGE_BASE.md §F`; `LANDING_SPEC.md §14`; `specs/05 §2`, `§5`; `specs/06 §3` | **The status-vocabulary conflict, escalated by two agents and left open.** PERSONA and IDENTITY make **"Covered"** the product's loudest word and the name of its green state. KB §F makes it a binding copy invariant that Certly *"never says verified, compliant or **covered** as a bare assertion about a policy"*. `LANDING_SPEC.md §14` and `offer/CLAUDE.md` both refer the conflict here. It is not cosmetic: `specs/05 §5` stores `status: 'covered'` in the `comparisons` table and `specs/12 §4` exports `vendor_status` in a CSV the customer forwards to an owner, a lender or an auditor. | `KNOWLEDGE_BASE.md §F` copy invariants; `IDENTITY.md §4.2` word list ("**Covered** / not Compliant"); `identity/samples.html` uses the word 19 times; `specs/06 §3` counter named "Covered"; `specs/15 §13` already has a test asserting the strings *"compliant", "covered" and "verified" appear nowhere in the rendered report* — i.e. one Must spec **already fails** the other documents' vocabulary. | **Decision in §2.1. "Covered" is retired as a status word.** Apply: `IDENTITY.md §4.2/§6.4/§9.1/§12.7`, `design-system.css` comment at line 57, `identity/samples.html` (19 occurrences), `PERSONA.md §2.5`/`§2.9.4`, `UX.md §2/§3.1`, `specs/05 §2/§5/§8`, `specs/06 §2/§3/§7`, `specs/12`. Token names (`--c-ok-*`) are vocabulary-neutral and do **not** change. | identity + product |
| **B-03** | `IDENTITY.md §6.4`, `§9.1`, `§9.4`, `§12.7`; `design-system.css`; `LANDING_SPEC.md §5 V1`; `specs/05 §2` | **The product's central differentiator has no visual identity.** The comparison engine emits five requirement states (`met`, `gap`, `asserted_only`, `not_checked`, `needs_review`) and the dashboard shows six vendor-level states (`expired`, `gap`, `expiring`, `asserted_only`, `covered`, `no certificate`). The design system provides **four**: Covered, Expiring, Gap, Needs review. There is **no token, no glyph, no fill pattern and no word for `asserted_only`** — the state `BACKLOG.md §0 D1` calls "the one thing in the category that is both true and uncomfortable" — and none for `not_checked` or `no certificate`. `LANDING_SPEC.md §5 V1` specifies a **half-filled dot** in `--state-asserted` and calls it *"the product's logo-equivalent"*; that token does not exist. | `grep` of `design-system.css`: only `--c-ok-*`, `--c-warn-*`, `--c-gap-*`, `--c-rev-*`. `IDENTITY.md §6.1`: *"one ink, one paper, one interaction blue, and four status hues — and that is the whole list"*, and §9.4 says the system has *"spare chroma budget for exactly one more meaning"*, which it then spends on confidence. | Extend `IDENTITY.md §6.4` to the full state set with the same four-signal discipline, and extend `contrast.py` to certify it (the script already hard-fails duplicate glyph/pattern/word, so the new states get the same guarantee). Concrete proposal, cheap because it needs no new hue: **`asserted_only`** = the *half*-filled disc from `LANDING_SPEC.md §5 V1`, drawn in `--c-warn-*` with a **vertical** hatch (distinct from Expiring's 45° hatch) and the word **"Claimed, not evidenced"**; **`not_checked`** = an em-dash in a square, achromatic `--c-ink-muted`, word **"Not checked"**; **`no certificate`** = an empty dashed disc, `--c-ink-faint`, word **"No certificate"**. Add all three to `design-system.css`, `samples.html` and `contrast.py`'s declared pairs. | identity |
| **B-04** | `IDENTITY.md §12.2`, `§9.4`, `§11`, `P6`; `UX.md §3.2`, `§2.2 S12`; `specs/03 §3`, `§6` | **The signature interaction cannot be built from the data the extractor returns.** IDENTITY §12.2 specifies *"**highlight boxes** keyed to extracted fields… hovering a field raises its box; clicking scrolls to it"*, IDENTITY §11 calls the box-by-box reveal *"the one place motion earns its keep… that motion **is** the explanation"*, and UX §3.2 repeats it. `specs/03 §3` says the opposite in as many words: *"Clicking a field scrolls the document to its `page` and **highlights nothing — we do not claim bounding boxes we did not extract**."* The schema confirms it: `StringField` carries `value`, `raw`, `page`, `source_text`, `confidence` — **no coordinates**. | `specs/schema/coi.v1.schema.json` `$defs.StringField` (verified by me); `specs/03 §3` verbatim. | **Decision in §2.4.** Rewrite `IDENTITY.md §12.2`, `§11` and `UX.md §3.2/§2.2 S12` to the evidence we actually have: page-scroll + the `source_text` span rendered as a quotation beside the field, with the quote-gate result in words. Do **not** add bounding boxes to the schema — model-reported coordinates are exactly the kind of unverifiable claim `IDENTITY.md §3 Step 9` forbids, and the quote gate already gives a *checkable* provenance the boxes would not. `IDENTITY.md P6`'s review test ("can a user check our reading of general aggregate against the form without leaving the screen?") still passes. | identity |
| **B-05** | `specs/11 §2`; `THRESHOLDS.md §1`; `OFFER.md §9`; `LANDING_SPEC.md §11`; `UX.md §1.2`, `§7` | **Activation — the number that decides persevere/iterate/stop — is defined three different ways.** (a) `specs/11 §2` and `THRESHOLDS.md §1`: one `comparisons` row against a certificate the org uploaded, out of `needs_review`. (b) `OFFER.md §9` / `LANDING_SPEC.md §11`: *"`activated` = certificate processed **and** template saved **and** one gap surfaced **and** one chase sent"* — four conditions, one of which (a gap must exist) is **not under our control** and is precisely the thing `THRESHOLDS.md §6` wants to *measure* (`activated.gaps_found`). (c) `UX.md §1.2`: *"The activation event for `events` is `first_status_rendered`, not `signup_completed`"* — a third name that appears in no spec. | Three verbatim definitions in five files; `grep` shows `first_status_rendered` occurs only in `UX.md` (3×) and nowhere in `specs/` or `THRESHOLDS.md`. | **Decision in §2.3.** `specs/11 §2` is canonical; `OFFER.md §9`'s four conditions are renamed **"trial health checklist"** (they are a good one) and stop being called activation; `UX.md §1.2/§7` adopts the spec's event names. Fix `LANDING_SPEC.md §11`'s funnel row. Defining activation to require a gap would let a *clean* portfolio count as a failed activation — a self-inflicted STOP. | product + offer + identity |
| **B-06** | `BACKLOG.md M10`; `specs/01 §2`; `LANDING_SPEC.md §6`; `OFFER.md §9`, `§12.3`; `specs/10 §3`; `BACKLOG.md N12` | **"Start free" with a mandatory card, and a Must item whose story still says the opposite.** `OFFER.md §9`, `specs/10 §3` and `BACKLOG.md N12` all commit to a **card-required** 14-day trial. `BACKLOG.md M10`'s user story still reads *"As a stranger I start a 14-day trial **without a card**"*. Worse, the CTA on all three pricing cards (`LANDING_SPEC.md §6`) and on the sign-in screen (`specs/01 §2`) is **"Start free"**. Presenting a card-required subscription trial as "free" without the terms adjacent is the exact pattern the FTC's negative-option rule and ROSCA are aimed at: clear and conspicuous disclosure of the material terms *before* billing information is obtained, express informed consent, and simple cancellation. | `BACKLOG.md M10` story text vs `BACKLOG.md N12` *"plus a card-required 14-day trial (M10)"* — the same file contradicts itself two sections apart. | Correct the M10 story to "start a 14-day trial with a card and no charge until day 14". Change every "Start free" CTA to **"Start 14-day trial"** with the disclosure rendered adjacent (not behind a link): *"Card required. No charge until {date}. Cancel in one click."* Keep "Get a free Gap Report" as the genuinely free path — it is the only thing on the page that is free, and it is a real one. `specs/10 §A1`'s banner ("no charge until {date}") is already right; the promise has to appear *before* the card, not after. | offer + product |
| **B-07** | `specs/15` (all); `LANDING_SPEC.md §8.2`; `OFFER.md §13.3 Q2`; `offer/RESEARCH.md §7`; `PIPELINE.md` standing rules | **M15 ships, as a Must and as the hero CTA, exactly the thing three documents say needs a founder legal decision first — at 25× the size and 30× the retention.** `offer/RESEARCH.md §7` and `LANDING_SPEC.md §8.2`: accepting a stranger's real certificate *"means storing other people's data with no contract and no deletion path"*, and the upload variant may ship **only** with all eight conditions — *"PDF only, **one file**, ≤5 MB, processed **in memory**, **deleted within 24 hours**… Anything less than all eight and it does not ship."* `specs/15` accepts **25 files**, of any accepted mime, ≤20 MB each, **stores** them, and keeps the extraction payload for **30 days**. That payload contains the producer's `contact_name`, `phone` and `email` — which `KNOWLEDGE_BASE.md §A.3` itself annotates *"often a real individual"*. | `LANDING_SPEC.md §8.2` verbatim; `specs/15 §5`–`§6`; `specs/schema/coi.v1.schema.json` `producer.contact_name`; `OFFER.md §13.3` Q2 lists it as an **open** founder question while `BACKLOG.md` lists M15 as a **Must**. | **Decision in §2.6.** M15 stays a Must (the landing page has no primary action without it) but ships under the RESEARCH §7 conditions scaled honestly, and the founder decision is a **launch gate, not a nice-to-have**: (i) drop `producer.contact_name`/`phone`/`fax` from the gap-report extraction path entirely — the free report never chases anyone, so it never needs them; (ii) source documents deleted at render (already in `specs/15 §6` — keep); (iii) **purge at 7 days, not 30**, and state the number next to the drop zone in body text, per §8.2's "not behind a link"; (iv) the terms and the deletion promise render adjacent to the upload control; (v) the founder's legal read happens before launch, and until it lands, the page ships with **the samples-only demo as the primary CTA** and the Gap Report behind a waitlist line. Move it from `OFFER.md §13.3` (open question) to `PREREQUISITES.md` as a dated founder task. | offer + product + founder |
| **B-08** | `specs/15 §5`; `specs/03 §4` | **The Free Gap Report's data model cannot be created.** `specs/15 §5` says it *"sets `extractions.orgId` nullable **only** for this path"* and stores files in its own `gapReportDocuments` table. But `specs/03 §4` declares `extractions.documentId` as `uuid('document_id').**notNull**().references(() => documents.id)`, and `documents.orgId` is itself `notNull` referencing `organisations`. A gap-report session has no `organisations` row and no `documents` row, so no `extractions` row can be inserted. | `specs/03 §4` and `specs/15 §5`, verbatim. | Either (a) make `extractions.documentId` nullable and add `gapReportDocumentId`, with a CHECK constraint that exactly one is set — my recommendation, because it keeps one extraction table and therefore one eval pipeline; or (b) give gap-report sessions a real `organisations` row flagged `is_ephemeral` and purge it, which preserves the org-scoping invariant at the cost of polluting `organisations` and every funnel query in M14. Whichever is chosen, `specs/15 §13`'s security test (*"`extractions.orgId IS NULL` rows are unreachable from any org-scoped query"*) must be written against the chosen shape. | product |
| **B-09** | `specs/15 §4`, `§9`; `specs/05 §7`; `specs/03 §8`; `THRESHOLDS.md §4.2` | **A third of a stranger's free report will silently disappear, and nothing says so.** `specs/05 §7`: *"a comparison requires a `ready` extraction; `needs_review` extractions are not compared."* `specs/03 §8` sends a document to `needs_review` on six triggers, including any used field below τ=0.85 and any quote-gate failure. `THRESHOLDS.md §4.2` budgets a **review rate of up to 30% as PERSEVERE**. In the product a human clears the queue; **in the Free Gap Report there is no human and no account**, so those documents can never be compared — and `specs/15` says nothing about them. A stranger uploads 18 certificates and gets a report about 12, with no line explaining the other 6. That is the exact dishonesty `specs/12 §3.5` exists to prevent. | `specs/05 §7`, `specs/03 §8`, `specs/15 §4`/`§9` (no acceptance criterion covers it; A10 covers only the all-unreadable case). | Add to `specs/15 §4` a required report section — **"Read, but not confident enough to compare (n)"** — listing those documents with the reason in words, and add an acceptance criterion. Add to `specs/15 §9`: *"Given 18 documents of which 6 land in `needs_review`, then the report compares 12, names the 6, and the headline states both counts."* This is also the honest version of the offer's own promise, and it demonstrates the `needs_review` state to a prospect, which is a selling point rather than an embarrassment. | product |
| **B-10** | `OFFER.md §8.1`; `specs/10 §2`; `LANDING_SPEC.md §6`; `specs/06 §3`; `product/CLAUDE.md` A1 | **The billing meter is defined two incompatible ways, and one of them bills for the product's best finding.** `OFFER.md §8.1` and the pricing block's own explainer sentence: *"An active certificate is **one current certificate** per vendor, tenant or sub."* `specs/10 §2`: *"**one non-archived vendor = one active certificate**"*. Under the spec, a vendor who has **never sent a certificate** consumes a paid slot — and `specs/06 §3` singles those vendors out as *"the most valuable finding for a new customer"*. A customer who imports 80 vendors to find out which are uncovered is immediately over a 50-certificate cap having tracked zero certificates. | `OFFER.md §8.1`, `specs/10 §2`, `LANDING_SPEC.md §6` item 1, `specs/06 §3`, verbatim. | **Decision in §2.5.** Adopt `specs/10`'s meter (it is the only one a customer can predict) but **rename the unit** everywhere: the tier metric is **"tracked vendors"**, not "active certificates". Update `OFFER.md §8.1/§8.2`, `§12.1/§12.2` metadata (`cert_limit` → `vendor_limit`, `Certificate Pack` → **"Vendor Pack"**), `LANDING_SPEC.md §6`, `specs/10` throughout, and `specs/13`'s help article 12. Renaming now costs a find-and-replace; renaming after the founder has created Stripe products costs a migration. | offer + product |
| **B-11** | `specs/08 §2`; `OFFER.md §4 P2`; `UX.md §1.2 step 4`, `§12.1`; `BACKLOG.md SH-1` | **Four documents hard-code a domain we do not own.** `specs/08 §2` gives the agent-facing URL as `https://certly.app/u/<token>`; `OFFER.md §4` promises a forwarding address `yourfirm@in.certly.app`; `UX.md` uses `in@…` and `vendor-name@in.certly.app`; `BACKLOG.md SH-1` uses `coi@certly.app`. `IDENTITY.md §2.1` records, from a fetched check, that **`certly.app` returns HTTP 200 with `<title>Create Next App`** — someone else's parked placeholder. `PLAN.md D3` says there are no custom domains at launch at all; the launch host is `*.vercel.app`. | `IDENTITY.md §2.1` source `[F4]`; `identity/research/sources.md` F4. | Replace every literal domain with `{APP_ORIGIN}` / `{INBOUND_DOMAIN}` read from env, and state in `specs/08 §2` that the launch value is the Vercel URL. An agent-facing link is the one URL in this product that a stranger must trust on sight; shipping it on a domain we do not control is not a cosmetic problem. Add the sending/inbound domain to `PREREQUISITES.md` (P6 covers the sending domain; the *inbound* domain and the app origin are not listed). | product + offer |
| **B-12** | `KNOWLEDGE_BASE.md §F.1`; `IDENTITY.md §4.4` rule 4; `identity/samples.html` L469-471, L711; `specs/13 §12` | **Two different "canonical, verbatim" disclaimers exist, and a Must spec has a test that only one of them can pass.** KB §F.1: *"**Certly reads documents. It does not verify coverage.** A certificate of insurance is issued as a matter of information only…"* — reproduced verbatim in `LANDING_SPEC.md §13`, `specs/12 §3.2`, `specs/15 §4`. `IDENTITY.md §4.4` rule 4 mandates a different text: *"Certly reports what a certificate says against the requirement you set. It is not insurance advice and it does not verify the underlying policy."* — and `identity/samples.html` renders that second version. `specs/13 §12` asserts *"every disclaimer string in `src/lib/kb/disclaimers.ts` appears **verbatim** on its five required surfaces"*. | The two texts, side by side, in the two files. | KB §F.1/§F.2/§F.3 are canonical (they carry the liability analysis and are the ones already threaded through four specs). `IDENTITY.md §4.4` rule 4 becomes a **pointer** to `disclaimers.ts`, not a text; `identity/samples.html` renders the §F.1 string. There is exactly one place a disclaimer is written down. | identity |
| **B-13** | `LANDING_SPEC.md §8.1`, `§5 V4`, `§4 §2`; `kb-samples/MANIFEST.md §Licence`; `BACKLOG.md N11` | **The landing page publishes third-party documents and the ACORD form layout on a commercial site, against our own licence policy and our own NEVER list.** `MANIFEST.md §Licence` §2: the corpus is stored *"as fetched, unmodified, as test fixtures, and **we do not redistribute them, publish them**, or reproduce the blank form in Certly's own UI. **We never render an ACORD-branded form.**"* `BACKLOG.md N11` repeats it. `LANDING_SPEC.md §8.1` then puts *"three pre-supplied public sample certificates from `kb-samples/certificates/`"* on the public page, and `§5 V4` renders *"the top-left region of a real public ACORD 25… **SVG traced from the form's rules and boxes**"* — a traced reproduction of ACORD's form layout, on a page selling a competing commercial product. Separately, the demo chips relabel real institutions' documents (Story County IA, WisDOT, City of Temecula) as *"Landscaper"*, *"Roofer"*, *"Cleaner"* — a misdescription of a named third party's document. | `MANIFEST.md §Licence` and `BACKLOG.md N11` vs `LANDING_SPEC.md §8.1`/`§5 V4`, verbatim. | Build the demo and V4 from **Certly-authored fixtures**: our own certificate-shaped sample documents with fictional vendors, our own layout, produced for this purpose — which also removes the mislabelling problem and lets the demo show exactly the three cases we want. Keep the **verbatim quotation** of the ACORD notice (`LANDING_SPEC.md §3 V1` pull quote) — a short, attributed quotation of a factual notice is the strongest and most defensible asset on the page, and it is *not* a reproduction of the form. Keep the real corpus private, as fixtures. If the founder wants a real ACORD 25 on the marketing site, that is an ACORD licence question (OQ-5) and goes to the founder, not to the build. | offer + product |
| **B-14** | `specs/14 §3.1`; `THRESHOLDS.md §3`; `specs/10 §13`; `UX.md §7`; `BACKLOG.md` (event columns) | **The instrument measures a different number from the threshold it is built to test, and there are three competing event vocabularies.** `THRESHOLDS.md §3` is emphatic — *"Read the definition twice… This threshold is measured on `trial_converted`… measuring the card would flatter us into shipping a broken business"* — and `specs/10 §13` agrees. `specs/14 §3.1` then defines the panel as **`checkout_completed` ÷ `activated`**, i.e. exactly the flattering number. Separately: `UX.md §7` lists a complete instrumentation vocabulary (`first_status_rendered`, `signup_completed`, `dialect_chosen`, `parties_imported`, `document_received`, `review_accepted`, `status_changed`) of which **not one name appears in any spec**; and `BACKLOG.md`'s per-item event columns drift from the specs (`onboarding_abandoned` vs `onboarding_step_abandoned`; `requirement_source_opened` vs `template_source_opened`; `report_shared_link_created` vs `report_share_opened`). `LANDING_SPEC.md §11` adds a fourth set (`signup_start`, `trial_start`, `paid`). | `specs/14 §3.1` row 4 vs `THRESHOLDS.md §3`; `product/CLAUDE.md` §9 R5.3 records the `trial_converted` decision but spec 14 was not updated. `grep` results in `review/CLAUDE.md`. | Fix `specs/14 §3.1` to `trial_converted ÷ activated`. Declare the **specs the single source of event names**, and correct `BACKLOG.md`'s columns, `UX.md §7` and `LANDING_SPEC.md §11` to match. Add a CI check (`events:check`) that every event name referenced in `THRESHOLDS.md`, `BACKLOG.md` and `LANDING_SPEC.md` exists in a spec's `§Analytics` section — `THRESHOLDS.md §8.6` already says *"a metric with no instrument does not exist"*; this is how that rule is enforced rather than hoped for. | product (+ identity for `UX.md §7`, offer for `LANDING_SPEC.md §11`) |

| **B-15** | `IDENTITY.md §6.1`, `§6.2`, `§6.3`, `§6.5`, `§7.1`, `§14.1`, `§17.3` vs `design-system.css`, `identity/contrast.py`, `identity/samples.html` | **`IDENTITY.md` now documents a palette and a type stack the implementation no longer has.** The Brand Director's arbitration edits landed at 20:53 in the CSS, the script and the samples, but not in `IDENTITY.md`. The CSS is now `--c-paper #E8EEF6` ("cool office white"), `--c-sunken #DEE7F1`, `--c-line #C7D3E0`, `--c-line-strong #718094`, `--c-ok-fg #0C5F4A` / `--c-ok-solid #0F6E55`, `--c-warn-fg #6B5507`… on **Source Sans 3 + Source Code Pro**. `IDENTITY.md §6.2` still lists `#F3F3EE`, `#E7E7E0`, `#D5D5CC`, `#85857A`, `#14603A`, `#17703F`, `#7A4A05`; **all 92 rows of the §6.5 certification tables are computed against the old ground and are now wrong**; §6.1's hue-angle prose, §7.1's *"Why Public Sans"*, §14.1's *"green `#17703F`"* distinctness row and §17.3's *"Certly's claim is: Public Sans + IBM Plex Mono… warm paper `#F3F3EE`"* are all stale. `IDENTITY.md §16.1` makes `design-system.css` *"the only place colour, type… values are written"*, and §16.3 puts `contrast.py` in CI — so **the CSS is right and the document is wrong**, but the document is what wave 2 reads. | I diffed the two and re-ran the script: it passes at **112 pairs** against the new values, so the *system* is intact; only the prose record is stale. `git diff --stat` shows `design-system.css`, `contrast.py` and `samples.html` modified with `IDENTITY.md` untouched. | Regenerate `IDENTITY.md §6.2`, `§6.3` and **both §6.5 tables** from the current `design-system.css` with `python3 identity/contrast.py --md` (the document's own §6.5 instruction — *"No ratio in this document was typed by hand"*), and rewrite `§6.1`, `§7.1`, `§14.1` and `§17.3` to the arbitrated faces and ground. **The arbitration decides the values; this finding only requires that the document match them.** Until it does, `IDENTITY.md §6` must not be used as a build reference. | identity (Brand Director) |

### 1.2 Major

| id | file · section | finding | required change | owner |
|---|---|---|---|---|
| **MJ-01** | `KNOWLEDGE_BASE.md §D.5`; `specs/03 §15`; `THRESHOLDS.md §4.1`; `kb-samples/MANIFEST.md` | **The golden set does not add up, and it does not exist yet.** KB §D.5 says *"20 documents at launch, drawn from `kb-samples/certificates/`"* and its composition table includes **E1**, which lives in `endorsements/`, and counts C2, C5, C6 and C7 twice. `specs/03 §15` lists G1–G16 real + G17–G20 synthetic — but `G3` and `G8` are **the same file** (`durham-county-…pdf`), so 16 slots cover 15 documents, and the four synthetic ones are not in the corpus at all. `THRESHOLDS.md §4.1` says *"the 16 real fixtures in `kb-samples/certificates/`"*; the directory holds 15. **And no expected-value JSON exists for any fixture**, so the ship gate in `THRESHOLDS.md §4.1` is currently unrunnable. | Reconcile the three counts on `specs/03 §15` (it is the most concrete). State plainly that hand-labelling 15 documents × ~40 fields is a **wave-2 task with an owner and about two days of work**, and that it is a *gate*, not a chore — nothing else in M4 can be measured until it is done. Note in `specs/03 §15` that G3/G8 share a document and therefore share a denominator. | product |
| **MJ-02** | `THRESHOLDS.md §4.1`; `specs/03 §15` | **The 97% critical-field gate is not yet testable and its arithmetic is stated as if it were.** *"16 fixtures × 6 critical fields ≈ 96 critical values; 97% is roughly 'at most three wrong'."* Four corpus documents (C4, C13, C14, C15) are guidance/instruction PDFs with an embedded certificate, and several fixtures have no `ADDL INSD`/`SUBR WVD` tick at all, so the real denominator is unknown and smaller. | Compute the denominator from the expected-value files once they exist, publish it in `specs/03 §15`, and express the gate as **"at most N wrong on a denominator of D"** rather than a percentage of an estimate. This is the same discipline `BACKLOG.md N10` applies outwards. | product |
| **MJ-03** | `OFFER.md §12.1`; `LANDING_SPEC.md §6`; `specs/10 §2`; `BACKLOG.md SH-7` | **Seats (3/10/25) are priced and printed on the pricing cards, but "Teams and roles" is `SH-7` (Should).** In fact `specs/01 §4` ships `memberships` with `owner/editor/viewer` and `specs/13 §2/§7` ships invitations and the role matrix — so the capability *is* in the Must specs and the backlog is wrong, not the price card. | Promote invitations + the role matrix explicitly into M13's scope in `BACKLOG.md` (they are already in `specs/13`), and reduce `SH-7` to what is genuinely deferred (role granularity, seat management UI). Otherwise a seat limit is sold that nothing enforces. | product |
| **MJ-04** | `LANDING_SPEC.md §3`, `§4 §1`; `PLAN.md §4` | **Two calls to action above the fold.** PLAN §4's definition of done for a landing page is *"one problem, one promise, visual proof, **one call to action**"*. The hero has *"See it read a certificate"* **and** *"Get a free Gap Report"*. The cited justification (Poyar's +26%) is about offering a freemium path alongside a card-required trial in a **pricing** context, not about two hero buttons. | Make the demo an **in-page interaction** rather than a CTA — the chips are already directly below the fold and `§3` already has them peeking. One commercial CTA in the hero. Keep the dual-CTA idea as experiment 3 in `§11` where it already is. | offer |
| **MJ-05** | `IDENTITY.md §7.1`, `§16.4`; `design-system.css` header; `identity/samples.html`; `LANDING_SPEC.md §10` | **Font delivery contradicts the performance budget, and the arbitration did not change that.** IDENTITY §7.1: *"Exactly one stylesheet link, `fonts.googleapis.com`"*; the CSS header and `samples.html` still do the same — the post-arbitration `samples.html` line 9 now loads `Source+Sans+3` and `Source+Code+Pro` from the same CDN. `LANDING_SPEC.md §10`: *"**Third-party requests: 0 on first view. No CDN fonts**"*, fonts *"self-hosted, WOFF2, subset"*, enforced as a **failing** Lighthouse assertion in CI. | Self-host both faces (Next.js `next/font` self-hosts at build time and satisfies both documents); keep the CDN link only in `samples.html`, which is a local gallery and not a shipped surface. **This finding is about *delivery*, not about which faces win** — whichever pair `../IDENTITY_ARBITRATION.md` lands on, the two font tokens (`--c-font-ui`, `--c-font-num`) are the only place a family name may appear, and `design-system.css` already honours that, which is why the swap cost nothing. | identity |
| **MJ-06** | `KNOWLEDGE_BASE.md §F` ("five surfaces"); `UX.md §2.2`; `specs/06 §A9`, `specs/12`, `specs/15` | **The disclaimer surface list does not cover every screen that shows a status**, which is what `PLAN.md A10` requires. KB §F names five: certificate detail, dashboard, exports, template editor, vendor/agent email. Screens that render a status and are **not** on the list: **vendor/party detail** (`UX.md S11`, `specs/04 §3` — the screen a manager actually looks at), the **expiry timeline** (`UX.md S14`), the **global search result** (which `UX.md §3.1` says renders a pill), the **mobile card list** (`UX.md §5`), the **shared report link** `/r/[token]` (`specs/12 §5`), and the **Free Gap Report on-screen view** (`specs/15 §3`). | Extend KB §F's list to **eleven** surfaces and add the assertion to each spec's acceptance criteria, as `specs/06 §A9` and `specs/08 §A9` already do. `specs/13 §12`'s verbatim test then enforces it. | product |
| **MJ-07** | `OFFER.md §2.2`; `KNOWLEDGE_BASE.md §B.4` | **An unsourced quantity used as if measured.** *"A product that says 'I don't know yet' about **60%** of real certificates"* (OFFER) and *"would make the product scream at **60%** of real certificates"* (KB). No source anywhere; `offer/RESEARCH.md §8` does not list it as a gap. `BACKLOG.md N10` bans exactly this shape of number. | Mark it inline as an estimate with its basis, or replace it with what the corpus actually shows (of 15 corpus certificates, the ones with `Y` in a tick column and no attached endorsement page — a number we can count today). It must never reach a page or an email. | offer + product |
| **MJ-08** | `../../phase-1-ideation/ERRATA.md` E5 | **The errata's own phrasing is the banned claim.** E5 concludes *"The wedge is **verification of coverage**, not price."* `BACKLOG.md N1` and `KNOWLEDGE_BASE.md §F` forbid saying Certly verifies coverage. The downstream documents reframed it correctly (three-state reading), but the sentence is sitting in a file every future agent reads first. | Not editable by me and not in my scope to change; flagged for the orchestrator. Downstream authors must never lift E5's wording. The accurate restatement: *the wedge is **reading the document and separating proof from assertion**, not price.* | founder/orchestrator |
| **MJ-09** | `specs/11 §9` | **A cap that does not exist.** Edge case: *"Trial cap (**25 vendors**) hit during step 4 → import up to the cap, show the paywall (M10 §A9)"*. There is no 25-vendor trial cap anywhere: the trial runs on the chosen tier at 50/150/400 (`specs/10 §3`). 25 is the **Free Gap Report** cap. | Delete or correct to the chosen tier's limit. As written a builder would cap paying trials at 25 vendors and destroy activation. | product |
| **MJ-10** | `specs/01 §2`; `specs/10 §4`; `specs/11 §3`; `THRESHOLDS.md §3` | **Nothing says what an org can do before it has a subscription.** `specs/01` lands a brand-new org straight on `/onboarding`; `specs/10 §4`'s flow is signup → choose a tier → Checkout; `specs/11` never mentions billing. So either the card gate sits between signup and onboarding (contradicting M1 and M11) or an org with **no** subscription row has undefined entitlements — and `specs/10 §9` says *"every write path checks entitlements"*, which would then fail closed and block onboarding entirely. | Decide and write it into `specs/10 §8 getEntitlements`: my recommendation is **onboarding is free and un-gated up to the first comparison** (that is activation, and it is what the trial is for), with Checkout offered at the finding screen (`specs/11` step 6), where the customer has just seen a real gap. Add the `no_subscription` state to the entitlement matrix and to `specs/10 §14`'s unit test. | product |
| **MJ-11** | `LANDING_SPEC.md §12`, `§14` | **The word count does not reproduce.** §14 claims **395**, *"counted mechanically over every copy string in §4"*. Summing the per-row "Words" column in §4 gives **391**; recounting the actual strings gives **394**; and the three "How it works" step labels (10 words) are not counted at all, which gives ~404. | Re-run the count and publish the script. **The budget passes either way** (391–404 against 450), so this is credibility, not substance — but the fleet's whole argument is that numbers are counted, not estimated. | offer |
| **MJ-12** | `PERSONA.md §9.4`; `IDENTITY.md §17.5`; `OFFER.md §9`; `BACKLOG.md N12` | **Stale open questions about the free tier.** PERSONA §9.4 (*"Does the founder want the free tier at all?"*) and IDENTITY §17.5 were written before `OFFER.md` and `BACKLOG.md N12` decided it: **no permanent free tier; a one-off Free Gap Report instead**. A founder reading the folder finds an open question that has been answered. | Mark both as **resolved by `BACKLOG.md N12` + `OFFER.md §9`**, with the reasoning (every document costs a real model call; free users upload the messiest documents). Consolidated in §5 below. | identity |
| **MJ-13** | `IDENTITY.md §2.3`; every customer-facing string in `OFFER.md`, `LANDING_SPEC.md`, `UX.md`, `specs/07 §6`, `specs/08` | **The rename recommendation is not marked as pending where the name actually appears.** `IDENTITY.md §2.3` recommends **Coverfile**, with a sound argument (no collision found; out of the `Cert-`/`myCOI`/`Certificial`/`CertFocus` pile-up; two live companies already trade as Certly; the `.co` is being used for gambling spam). Every other document then writes "Certly" into hero copy, an outbound email signature, Stripe **price nicknames** and product names, agent-facing email footers and URLs, with no marker. | Adopt one convention now: **the code slug stays `certly`** (PLAN A3, the phase-3 lists, the Vercel project names) and **every customer-facing occurrence renders `{PRODUCT_NAME}` from one constant**, with a `NAME PENDING — IDENTITY.md §2.3` note at the top of `OFFER.md`, `LANDING_SPEC.md` and `specs/07`. `OFFER.md §13.3 Q4` is right that renaming after Stripe objects exist is cheap and after invoices exist is not — so the Stripe product **names** in `OFFER.md §12.1` are the one place to decide before the founder creates them. Trademark clearance stays a founder task (`IDENTITY.md §2.3`, `PREREQUISITES.md P11`). | identity + offer + product |
| **MJ-14** | `specs/08 §6`, `§11` | **Internally inconsistent security requirement.** §6: an expired or revoked token *"renders a page with the customer's org name and a 'ask {Org} for a new link' instruction — never a bare 404"*. §11 Security: *"enumeration attempt is rate-limited and returns **identical responses for invalid and expired tokens** at the HTTP level"*. A page naming the org cannot be identical to a page for a token that never existed. | Resolve in favour of the UX: expired/revoked tokens name the org (they were real links a real agent holds); **invalid** tokens get a generic page. Then the test asserts identical responses for *invalid* and *never-existed* tokens, and constant-time comparison plus rate limiting carry the enumeration defence. | product |
| **MJ-15** | `specs/03 §6` (the abridged schema block) | **A builder following the markdown would produce a schema the API rejects.** The reading copy's top-level `required` omits `endorsement_forms_mentioned` (which is listed as a property two lines below) and omits `schema_version` entirely — while the same section states the rule *"every object's `required` lists **every** property"*. The **committed** `specs/schema/coi.v1.schema.json` is correct (I validated it: 14 properties, 14 required, all `$ref`s resolve, `additionalProperties:false` everywhere). | Add a one-line banner to `specs/03 §6`: *"abridged and non-normative — the committed file is the schema"*, and fix the two omissions so the reading copy cannot mislead. | product |
| **MJ-16** | `specs/07 §6`, `§8`; `LANDING_SPEC.md §5`, `§7 FAQ 3`; `UX.md §3.3` | **CAN-SPAM: the opt-out is org-scoped only, and nothing forbids marketing content in vendor-facing mail.** `specs/07 §8` scopes unsubscribe to *"that recipient **for that org**"*. An agent who replies "stop sending me these" is asking the sender — TheVillage/Certly — to stop, and CAN-SPAM's opt-out must be honoured by the sender within 10 business days. Nothing in the specs bans adding a Certly CTA to a V-email, which would remove any argument that the message is transactional. | Footer requirements for V1–V4, written out: (i) **clear identification of who is asking** — `From` display name *"{Customer Org} via {Product}"*, and a body line *"Sent by {Product} on behalf of {Customer Org}"*; (ii) a **valid physical postal address** — TheVillage's, `PREREQUISITES.md P10`, since TheVillage is the sender of record; (iii) a **conspicuous opt-out** in the footer, functioning for at least 30 days after send, no fee, no login, no information beyond the email address, honoured within 10 business days, offering **both** *"stop requests from {Customer Org}"* **and** *"stop all {Product} requests"* — the second is the one that satisfies the statute; (iv) **non-deceptive subject and headers** (the current subject, which names the vendor and the expiry date, is exactly right); (v) **an absolute ban on any {Product} marketing, upsell, CTA or link other than the upload link** inside a V-email — add it to `BACKLOG.md §4 NEVER` alongside N7/N9. Treat these messages as commercial and carry the full footer even though a document request under an existing business relationship is arguably transactional; the cost is four lines and it removes the argument entirely. | product |
| **MJ-17** | `specs/03 §9`, `§10`; `specs/08 §6`; `specs/15 §8`; `PLAN.md D3` | **A 20 MB multipart POST to a Vercel route handler will not arrive.** All three upload paths validate `bytes ≤ 20 MB` server-side in a route handler. Vercel Functions cap the **request body** far below that (4.5 MB at the time of writing). Every phone photo of a certificate from an agent (`specs/08`'s primary use) and every 25-file gap-report session hits this. | Specify **client-direct uploads with a server-issued token** (Vercel Blob's client upload flow) for M4, M8 and M15, with the server receiving only the blob reference and then enqueuing extraction; or lower the cap to ~4 MB and say so in the copy. Re-verify the current platform limit at build time and record it in the spec. See the storage recommendation in §3. | product |
| **MJ-18** | `specs/schema/coi.v1.schema.json` `coverages[].limits[]`; `KNOWLEDGE_BASE.md §A.3` | **`OTHER:` rows lose their printed limit labels.** KB §A.3 insists `limits[].raw` *"preserves the printed characters"*, and `specs/03 §12` handles an `OTHER:` coverage row by keeping `type_label_raw`. But `limits[].label` is a **closed enum** with no `label_raw` sibling, so a Professional-Liability or Cyber row (corpus C6 has both) has its limit-box labels collapsed to `"other"` and the printed label is lost. `specs/05 §3` then matches "on the label only if the template names it" — with nothing to match against. | Add `label_raw` (a `StringField`) to the limit item in the committed schema and to `coverage_limits` in `specs/03 §4`. Small change, and without it `SH-6`/`L2` (other document types) inherit a lossy record. | product |
| **MJ-19** | `OFFER.md §6.1`, `§6.2 L3`; `LANDING_SPEC.md §8` | **Two holes in the Lapse Watch text.** (a) *"that month is free"* is undefined for an **annual** subscriber — six of the eight Stripe prices are annual. (b) "Warned" is defined in L3 as *"surfaced in the dashboard, dated, **and sent to the account email**"*, but the customer-facing emails (`UX.md §4.1 C3/C4`) are opt-out; a customer who turns off the digest can still satisfy the carve-out's only stated condition (*"did not turn reminders off"* — which refers to **vendor** reminders). | (a) State the annual remedy explicitly: *"a credit of one month of your plan"* (1/12 of the annual price). (b) Add a carve-out clause: the warning is the **dashboard record plus the account email**, and turning off the customer-facing expiry email is one of the carve-outs — or, better, make the expiry warning (C4) **non-optional** while everything else stays opt-out, which keeps the guarantee simple and is defensible product behaviour. | offer |
| **MJ-20** | `kb-samples/MANIFEST.md §Licence` 3 | **A personal-data assurance that is asserted but not evidenced.** The manifest states *"No producer contact name, no signatory, and no insured principal in this corpus is a real private individual"*, naming three placeholder exceptions. But C2 is described in the same file as *"**a genuine issued certificate**, not a sample"* — where the `CONTACT NAME`, the producer's direct e-mail and the authorised-representative signature are ordinarily a named person. I could not confirm or refute it from the text layer in two attempts (the filled values sit in form XObjects). | Re-verify C2 (and C11/C12, both unstamped and possibly issued) **by eye** before that sentence stands. Independently, enforce the rule that matters with a test rather than a note: `specs/03 §15` and `specs/13 §12` should assert that no `producer.contact_name` value from any fixture appears in eval output, prompts, UI copy or marketing. `KNOWLEDGE_BASE.md §A.3` already flags the field *"never surfaced in prose"* — make it mechanical. Related: B-07 drops the field entirely on the anonymous path. | product |

### 1.3 Minor

| id | file · section | finding | required change |
|---|---|---|---|
| MN-01 | `specs/15 §11` vs `§12`, `THRESHOLDS.md §5` | `gap_report_cost_cents` in §11 vs `gap_report_ready.cost_cents` in §12 and THRESHOLDS. | One name. |
| MN-02 | `IDENTITY.md §9.2` | The coverage-bar `aria-label` says *"then **no coverage** on record"* — a statement about coverage where we mean the record. | *"then no certificate on record"*. |
| MN-03 | `IDENTITY.md §6.4`, `§12.7` | `not_checked` (`specs/05 §2`) has no pill or word in the identity. | Covered by B-03's proposal; listed so it is not lost. |
| MN-04 | `specs/05 §2` / `§7` | `needs_review` is both a *requirement-level* result state and an *extraction* status; §7 says needs-review extractions are not compared, §3 emits `needs_review` results. Two meanings, one word. | Rename the requirement-level one `undetermined`, or say explicitly that they are different scopes. |
| MN-05 | `README.md` | The status table still says every deliverable is "pending". | Update after this review round. |
| MN-06 | `THRESHOLDS.md §2` | "85% monthly logo retention is ~7.5 months of expected life — at $99 that is roughly $740" — 1/0.15 ≈ 6.7 months, ×$99 ≈ $660; at 7.5 months it is $742 (7.5 = 1/0.133). | State the rounding, or use 6.7 months / $660. |
| MN-07 | `UX.md §2.1 S6` | Trial banner "days remaining stated as a date, not a countdown" vs `specs/10 §6` "days remaining, from day 7". | Harmonise (the date is better and matches `IDENTITY.md §15.4`). |
| MN-08 | `PERSONA.md §9.1` | Open question 1 asks about Evident; `offer/CLAUDE.md` records that it **was** reached and priced. | Close it. |
| MN-09 | `specs/02 §6` | `acceptsForms` regex rejects the real proprietary form `RSCG0303` that `KNOWLEDGE_BASE.md §C.5` and `specs/05 §4` require the engine to handle. | Allow a free-text carrier form with a visible "unrecognised form" marker. |
| MN-10 | `IDENTITY.md §12.1` | The drop zone *"always shows the forward-to address"*, but forward-by-email is `SH-1` (not MVP). | Remove, or mark as post-MVP. |
| MN-11 | `LANDING_SPEC.md §8.1` | *"the real extraction runs server-side"* and *"results are pre-computed and cached"* in the same block. | State it once: pre-computed at build time from a real run; no model call at request time. |
| MN-12 | `specs/06 §3` | The counters "sum to 80" in A1 while "vendors with no certificate at all are counted separately" — a vendor with no certificate is in neither the five counters nor the sum. | Make the sum rule explicit (six buckets, mutually exclusive, summing to the roster). |

---

## 2. Cross-document decisions

Each is a ruling the build can act on. Where two documents contradict and neither is clearly right, I
take the option that **reduces founder liability**, and say so.

### 2.1 Status vocabulary — "Covered" is retired

**Ruling: `KNOWLEDGE_BASE.md §F` wins. The green state is named "Meets requirements" (pill: `MEETS`).
"Covered" does not appear as a status word in the product, the exports, the emails, the landing page or
the free report. The engine's status value `covered` becomes `meets`.**

Rationale, in the order it should be weighed:

1. **The engine has no state that means "covered".** `specs/05 §2` emits `met`, `gap`, `asserted_only`,
   `not_checked`, `needs_review`. A UI word with no corresponding engine state is a claim the system
   cannot support — which is the definition of the drift `OFFER.md §6.2 L1` calls the
   highest-severity liability in the offer.
2. **Liability asymmetry.** A wrong "Gap" costs a customer an unnecessary email to an agent. A wrong
   "Covered" is `PERSONA.md` O-A6 — *"a wrong 'covered' is the failure that ends the company"* — written
   by the same agent that chose the word. PERSONA argues *against itself* here, and the brief's rule for
   an unresolved contradiction is to pick the lower-liability option.
3. **It is the cheapest change in the folder.** The tokens are `--c-ok-*`, the classes are `.c-pill--ok`
   — vocabulary-neutral by design (`IDENTITY.md §14.3` calls this "the token layer speaks the customer's
   language" and then, luckily, did not encode the word). The cost is copy: 19 strings in
   `samples.html`, one CSS comment, and the enum value.
4. **PERSONA's underlying finding survives.** The buyer's real word, by PERSONA's own §2.5, is
   **"current"** — *"The best single word in the file. 'Current' is what they want; 'compliant' is what a
   vendor sells."* Use it in prose about a **document**: *"this certificate is current as of 3 Sep 2026"*
   is a statement about a date on a piece of paper and is always true or always false. It is not a
   statement about coverage. That gives the identity its plain, human word back without the claim.
5. **What is *not* banned:** the noun **coverage** in its descriptive, form-derived sense — the
   **coverage bar**, the coverage grid, a coverage line, `coverage_present`. Those name parts of the
   ACORD 25 and are not assertions about a party. `IDENTITY.md §9.2`'s signature device keeps its name.

Portfolio summary line becomes: *"As of 3 September 2026, 41 of 47 vendors meet your requirements."*
`LANDING_SPEC.md §14` already implemented this ruling in advance; it stands.

### 2.2 The full state set — five requirement states, six vendor states

**Ruling: the identity must carry the whole state machine, not four of it.** The canonical lists, to be
copied into `IDENTITY.md §6.4` and `specs/06 §3`:

| level | states |
|---|---|
| requirement (`specs/05 §2`) | `met` · `gap` · `asserted_only` · `not_checked` · `undetermined` (was requirement-level `needs_review`, MN-04) |
| vendor (`specs/06 §3`) | `expired` · `gap` · `expiring_30d` · `asserted_only` · `meets` · `no_certificate` |
| document (`specs/03 §8`) | `pending` · `running` · `needs_review` · `ready` · `rejected` · `failed` |

Rationale: three different documents each invented a subset, and the counter row on the dashboard
(`specs/06 §A1`) has to sum to the vendor roster. One list, in one place, or the counters and the report
drift (`specs/12 §13` already has a test asserting they cannot).

### 2.3 Activation

**Ruling: `specs/11 §2` is canonical — one `comparisons` row against a certificate the org uploaded, out
of `needs_review`, emitted once per org by the comparison job.** `OFFER.md §9`'s four conditions become
the **trial health checklist** (a good instrument for the day-7 nudge, kept under that name).
`UX.md`'s `first_status_rendered` is deleted in favour of `activated`.

Rationale: the definition that decides STOP must be measurable from the data, must not depend on a
customer's portfolio being *bad* (a gap must exist), and must not be emitted by the UI. `specs/11 §5` is
right that *"activation is a fact about the data, not a fact about which screens someone visited"*.

### 2.4 The extraction review screen

**Ruling: no bounding boxes.** The review panel is: field · value · `raw` as printed · page number ·
**the `source_text` span shown as a quotation** · the quote-gate result in words · confidence meter.
Clicking a field scrolls the document pane to that page. The reveal animation shows fields resolving in
the panel, not boxes landing on the page.

Rationale: it is what the schema returns; a coordinate the model invented is a provenance claim we
cannot check, and the whole product is built on refusing exactly those. The quote gate is *better*
evidence than a box, because code verifies it (`specs/03 §7`) and a box would only be asserted.

### 2.5 Tier metric

**Ruling: `specs/10 §2`'s meter (one non-archived vendor), renamed "tracked vendors" everywhere,
including the Stripe product names and metadata.** Rationale in B-10: it is the only definition a
customer can predict from the dashboard, and the name has to match the meter before Stripe objects
exist. The published overage path (`$0.55` per unit per month above ~700) and the never-a-demo promise
are unaffected.

### 2.6 The Free Gap Report

**Ruling: keep it as a Must (the page has no primary action without it), ship it under
`offer/RESEARCH.md §7`'s conditions rather than around them, and treat the founder's legal read as a
launch gate.** The scaled conditions are in B-07. The two that are non-negotiable:
**never store a producer's contact name, phone or e-mail on the anonymous path** (the free report never
chases anyone, so it never needs them), and **purge at 7 days** with the number stated next to the drop
zone in body text.

Rationale: this is the one surface where Certly holds a third party's data with no contract and no
relationship. The liability is not ours to accept on the founder's behalf, and the product cost of the
restriction is zero.

### 2.7 Trial, limit and lapse behaviour — one canonical set

| question | ruling | supersedes |
|---|---|---|
| trial | **14 days, card required**, on the tier the customer picked, `trial_period_days=14` on the six subscription prices, T−3 and T−1 warnings | `BACKLOG.md M10`'s "without a card" |
| CTA | **"Start 14-day trial"** + adjacent disclosure; "Start free" only on the Gap Report | `LANDING_SPEC.md §6`, `specs/01 §2` |
| tiers | $99 / $199 / $299 at **50 / 150 / 400** tracked vendors; +$39 per 50; $0.55/unit/month above ~700 | `IDENTITY.md §4.3`'s *"$299 to **500**"* is stale — correct it |
| at the limit | **new writes blocked, nothing deleted, existing data fully readable and exportable**; the paywall names the count and offers both the next tier and a Pack; CSV import fills to the cap and reports the remainder | — |
| past due | **7-day grace, fully writable**, then read-only | `UX.md S6`/`C6`'s *"nothing stops; we keep reading and stop sending"* is wrong: reading is the expensive part and it stops |
| cancelled | access to `currentPeriodEnd`, then read-only with exports working forever | — |

`specs/10` is canonical throughout; `UX.md §2.1 S6` and `§4.1 C6` must be corrected, because C6 is an
**email to a paying customer** making a promise the product will not keep.

### 2.8 Reminder ladder

**Ruling: `KNOWLEDGE_BASE.md §B.5` / `specs/07 §2` is canonical — T−60, T−30, T−14, T−7, T−1, T+1, then
weekly to T+28.** `IDENTITY.md §12.10`'s and `UX.md §4.2 V2`'s "−30/−14/−3/+1" is stale and must be
corrected (it is also printed in `LANDING_SPEC.md §4 V2` as *"sixty days out, thirty, fourteen, seven,
one"*, so copy and product already agree everywhere except the identity).

**But the ladder as specified can send up to twenty messages about one lapse** (10 rungs × 2 recipients),
which contradicts `IDENTITY.md P7`, `LANDING_SPEC.md §5` (*"One ask per vendor"*), `LANDING_SPEC.md §7`
FAQ 3 and `OFFER.md §2.4`'s "second killer". `UX.md §3.3` states the missing control — *"a party never
receives more than one Certly email in 72 hours, across every requirement and every property"* — and
`specs/07 §9` does not implement it (it has only a 200/day per-org cap).

**Required:** add to `specs/07 §9` a **per-recipient minimum interval of 72 hours** and a
**per-expiry total-message cap**, and add to `specs/07 §5` the composer line `IDENTITY.md §12.10`
already specifies: *"this schedule will send N emails in total, and stops as soon as a current
certificate arrives."* A promise printed on the landing page that the queue does not enforce is a
support catastrophe and a broken guarantee.

### 2.9 "We never charge your vendors" — consistent, and it must reach the terms

Present and consistent in the offer (`OFFER.md §4` trimmed list, §11.1 outbound), the landing
(`LANDING_SPEC.md §1` trust line, `§5 V3` micro, `§7` FAQ 4) and the vendor-facing email footer
(`UX.md §4.2`, four commitments). **It is absent from the legal pages.** `specs/13 §4` lists Terms,
Privacy, Sub-processors, DPA and Disclaimers with no mention of it.

**Ruling:** add it to `/legal/terms` as a standing commitment in the same words, and add an acceptance
criterion to `specs/13 §8`. A promise made in the hero, in an FAQ and in every vendor email is a term of
the deal; leaving it out of the terms is how a promise quietly becomes a marketing line. It is also
`PERSONA.md §9.5`'s open founder question — consolidated in §5 as **OQ-9**, recommended default **yes,
permanent**.

---

## 3. Storage recommendation, so wave 2 can start

`product/CLAUDE.md` **OQ-6** leaves document storage open between Vercel Blob, S3 and Neon. It blocks
`documents.storageKey` (M4), the vendor-link upload (M8), the export ZIP (M13), the report artefacts
(M12) and the M15 purge job — i.e. five Must specs. **Recommendation: Vercel Blob at launch, behind a
four-method `DocumentStore` interface in `packages/platform`, with an S3 adapter written only when the
numbers say so.**

**Why, on the three axes the brief names.**

- **PDF size.** The real corpus is the evidence: the 23 committed samples run 58 KB to 2.7 MB, median
  ≈600 KB, and the largest is a 17-page package. `specs/03 §10` caps an upload at 20 MB / 25 pages. A
  Starter org (50 vendors × ~2 certificates a year) generates ~100 documents ≈ **60–100 MB a year**. A
  hundred paying orgs is ~10 GB a year. This is a small-object, low-volume, write-once workload — the
  worst possible case for a database and an unremarkable one for any object store.
- **Cost.** At 10–100 GB the per-GB difference between Blob and S3 is a few dollars a month — far below
  the cost of the thing S3 actually adds: a second cloud account, a second credential rotation, IAM, a
  lifecycle policy, and a **sixth sub-processor row** on `/legal/subprocessors` (`specs/13 §4` lists
  five) with the DPA that goes with it. `PLAN.md` puts the founder on a free Neon tier and an unupgraded
  Vercel account; adding AWS now buys nothing and costs a vendor relationship.
- **Vercel limits.** This is the decisive axis and it cuts against the specs as written (MJ-17):
  a route-handler upload is bounded by the **function request-body limit (4.5 MB)**, not by the 20 MB
  the specs validate. Vercel Blob's **client-upload flow** — the browser requests a short-lived token
  from a route handler and PUTs straight to Blob — sidesteps that limit, which is exactly what an agent
  photographing a certificate on a phone (`specs/08`) and a 25-file gap-report session (`specs/15`) need.
  With S3 the equivalent is a presigned PUT, which is the same amount of work plus the account.
- **Neon is rejected outright.** Certificates in `bytea` or large objects inflate the database that every
  dashboard query runs against, make Neon branch/restore economics ugly, make `specs/13`'s export ZIP and
  `specs/15`'s purge job expensive, and put customer documents inside the backup surface. Neon holds the
  `storageKey`, never the bytes.
- **Deletion obligations decide nothing between Blob and S3** — both delete on call — but Blob is one
  call with no lifecycle policy to get wrong, and `specs/15 §6` requires deletion *inside the render job*.

**Escape hatch, so this is reversible:** `interface DocumentStore { put(key, bytes, mime), signedUrl(key,
ttl), get(key), delete(key) }` with a `VercelBlobStore` today and an `S3Store` when total storage passes
~500 GB or egress becomes a visible line. Nothing above the interface knows which is in use — the same
adapter discipline `PLAN.md A8` reuses from `app/`.

---

## 4. Build readiness

### 4.1 What wave 2 can start today, unblocked

| module | why it is safe to start |
|---|---|
| **M5 comparison engine** (`specs/05`) | Pure, deterministic, no model call, no storage, no identity dependency beyond a state name. `product/CLAUDE.md §8` is right that it should be built first: it defines what extraction must get right. Only change needed before starting: the `covered` → `meets` enum value (§2.1) and the `undetermined` rename (MN-04). |
| **M1 auth + org** (`specs/01`) | Complete, internally consistent, and the Outlook-Safe-Links mitigation (GET renders, POST consumes) is the kind of detail that usually gets discovered in production. Only the CTA string changes (B-06). |
| **M9 audit trail** (`specs/09`) | Self-contained, and the "write in the same transaction or the change fails" rule is right. |
| **M3 vendor directory + CSV import** (`specs/04`) | Complete; the 12-fixture encoding test plan is the strongest test plan in the folder. |
| **`packages/platform` `DocumentStore`** | §3 settles the interface; the adapter can be written now. |
| **The requirement-template JSON library** (`KNOWLEDGE_BASE.md §B`) | Sourced, dated, shape-defined. `pm.snow` and `tenant.retail_food` ship flagged, as specified. |
| **`design-system.css` tokens, space, radius, motion, focus** | Certified by `contrast.py`, which I ran against the post-arbitration values (112 pairs, exit 0). **The CSS, not `IDENTITY.md §6`, is the build reference until B-15 is closed.** Safe **except** the status layer (B-03) and the font-loading mechanism (MJ-05). |

### 4.2 What waits, and on what

| module | blocked by |
|---|---|
| **M4 extraction** | B-01 (edition enum), B-04 (review screen), MJ-01/MJ-02 (golden set does not exist — this is the long pole), MJ-15, MJ-17, MJ-18 |
| **M6 dashboard**, **M12 report** | B-02, B-03, §2.2 (the state set the counters and the report must share) |
| **M10 billing** | B-06, B-10, MJ-10 — and note the Stripe product **names and metadata keys** change under B-10/MJ-13, which must be settled *before* the founder creates them (`PREREQUISITES.md P5`) |
| **M7 reminders** | §2.8 (ladder + the 72-hour cap), MJ-16 (footer), B-11 (domain), `PREREQUISITES.md P6`/P10 |
| **M8 upload link** | B-11, MJ-14, MJ-17 |
| **M11 onboarding** | B-05, MJ-09, MJ-10 |
| **M15 free gap report** | B-07 (founder legal read), B-08 (data model), B-09 (needs-review hole) |
| **M13 settings/help/legal** | B-12 (one disclaimer text), §2.9 (the vendor-fee commitment in the terms) |
| **M14 admin** | B-14 (it currently measures the wrong number) |
| **Landing page** | B-06, B-13, MJ-04, MJ-05, and the identity arbitration |

### 4.3 The three things I would fix first

1. **B-01** — one enum value and a KB paragraph, and it stops the extractor being wrong about the current
   form on day one.
2. **MJ-01/MJ-02** — start hand-labelling the golden set **now**, in parallel with everything else. It is
   the only wave-2 item with a multi-day serial dependency, and no accuracy claim, ship gate or threshold
   exists until it is done.
3. **B-02 + B-03 + B-15 + §2.2** — one afternoon of vocabulary and token work that unblocks four Must
   specs and the landing page. Do B-15 *with* B-03, since both regenerate the same `IDENTITY.md`
   sections and the same `contrast.py` pair list.

---

## 5. Consolidated founder questions, with a recommended default

Every founder question in `PERSONA.md §9`, `IDENTITY.md §17`, `UX.md §8`, `OFFER.md §13.3`,
`product/CLAUDE.md §7` and `THRESHOLDS.md §7`, de-duplicated. **Each has a default; if the founder says
nothing, the default is what ships.**

| # | question | source | recommended default |
|---|---|---|---|
| **OQ-1** | **The guarantee.** Lapse Watch (conditional free month) + unconditional 30-day, or the safer fallback? | `OFFER.md §6`, `§13.3 Q1` | **Ship `OFFER.md §6.1` as written**, with MJ-19's two fixes (annual remedy defined; the expiry warning made non-optional). Exposure is capped at one month, the carve-outs are screened *before* the promise attaches, and it is the only risk-reversal we control. |
| **OQ-2** | **A $49 Solo tier?** | `OFFER.md §8.4`, `product/CLAUDE.md` OQ-1, `THRESHOLDS.md §3`, `H-3` | **No at launch — but the test is already pre-committed**, and that is the right structure. `THRESHOLDS.md §3` Round 1 tests $49 against $99 on a fresh cohort of ≥100 if activation and retention are strong and only conversion fails. Do not discount before the data. |
| **OQ-3** | **Permanent free tier?** | `PERSONA.md §9.4`, `IDENTITY.md §17.5` | **Already decided — no.** `BACKLOG.md N12` + `OFFER.md §9`: a one-off Free Gap Report instead. Every document costs a real model call and free users upload the messiest documents. Mark the two open questions resolved (MJ-12). |
| **OQ-4** | **Anonymous uploads on the Free Gap Report / demo** — is the founder willing to hold strangers' third-party documents? | `LANDING_SPEC.md §8.2`, `OFFER.md §13.3 Q2`, `offer/RESEARCH.md §7`, B-07 | **Yes, under the eight conditions, scaled as in B-07 (no producer personal data, 7-day purge, terms adjacent to the drop zone) — and only after a legal read.** Until that read lands, ship the samples-only demo as the hero and hold the Gap Report behind a waitlist line. This one is a **launch gate**, not a preference. |
| **OQ-5** | **ACORD licence** — do we need one? | `KNOWLEDGE_BASE.md §A.2`, `MANIFEST.md §Licence`, `product/CLAUDE.md` OQ-5, `BACKLOG.md N11` | **Default: no licence, because we never render an ACORD form** — and B-13 makes that true by removing the traced form from the landing page. If the founder wants a real ACORD 25 on the marketing site or a generated ACORD form in-product, that is a licensing conversation with ACORD, not an engineering decision. Reading and quoting a form's printed notice is not the same act as reproducing its layout. |
| **OQ-6** | **Document storage** — Blob, S3 or Neon? | `product/CLAUDE.md` OQ-6 | **Vercel Blob behind a `DocumentStore` interface**, with client-direct uploads. Full reasoning in §3. |
| **OQ-7** | **A.M. Best budget** — four of five GC exhibits demand A-/VIII. | `KNOWLEDGE_BASE.md §B.2`, `BACKLOG.md L3`, `product/CLAUDE.md` OQ-4 | **No budget at launch.** The requirement renders as `not_checked` in the dashboard and in its own report section (`specs/12 §3.5`), which is honest and is itself a differentiator — no competitor publishes what it did **not** check. Promote to `L3` when a GC customer names it as a lost-deal reason twice. |
| **OQ-8** | **Inference cost: $0.02 vs $0.10–0.20 per document (5–10×).** | `OFFER.md §4 P1`/`B5` vs `THRESHOLDS.md §5`/`H-EC-1`, `specs/15 §11` | **Plan on `THRESHOLDS.md §5`'s $0.10–0.20** (it shows its arithmetic from list pricing; the $0.02 shows none) and let `extraction_succeeded.cost_cents` settle it in week one. Consequence to accept now: **a 25-document free report costs $2.50–5.00, not $0.50** — so `specs/15 §11`'s daily spend cap is a launch requirement, not a nice-to-have, and `OFFER.md §4/§5` should carry the higher figure so the founder is not surprised. Even at $0.20/document, gross margin at $99 stays above 95%. |
| **OQ-9** | **"We never charge your vendors" as a permanent commitment?** | `PERSONA.md §9.5` | **Yes, permanently, and put it in the terms** (§2.9). It closes off a revenue model the incumbents use ($80–$150/vendor/year, documented), and that is the point: it is the single most credible trust signal we own, and a commitment that can be withdrawn is not a commitment. |
| **OQ-10** | **Trademark clearance and the rename to Coverfile.** | `IDENTITY.md §2.3`, `§17.4`, `PERSONA.md §9.3`, `OFFER.md §13.3 Q4`, `PREREQUISITES.md P11` | **Decide the customer-facing name before the founder creates Stripe products** (price nicknames and product names carry it). Recommended: **rename to Coverfile**, keep the slug `certly`. Run a real USPTO class 9/42 search first — no agent could (Justia 403, no public USPTO JSON endpoint) — and spend nothing on a mark or domain until it is done. |
| **OQ-11** | **Davis-Stirling (California HOA) source is unreachable.** | `KNOWLEDGE_BASE.md §B.1`, `product/CLAUDE.md` OQ-3 | Open the page from a normal browser and paste the text. It is the **only** source gap that blocks a template. Default until then: **no California-specific HOA template ships** — which is what the KB already does. |
| **OQ-12** | **Sending domain, inbound domain, app origin and the CAN-SPAM postal address.** | `specs/07`, `PREREQUISITES.md P6`/P10, B-11 | Blocks M7 and M8 entirely. `PREREQUISITES.md` lists the sending domain (P6) and the address (P10) but **not** the inbound domain or the app origin — add them. |
| **OQ-13** | **Which beachhead gets the landing page** — PM or GC? | `OFFER.md §13.3 Q5`, `PERSONA.md §1`, `§7.2` | **PM/HOA**, as both agents independently concluded. GC is the **outbound** programme (the premium audit is dated and dollar-denominated) with a `/for-general-contractors` variant, per `PERSONA.md §7.2`. |
| **OQ-14** | **Does a document ever get a status without a human accepting the reading?** | `UX.md §8.1` | **Yes, above τ, from the first document** — `specs/03 §8` already decided this and it is the right call: requiring a human on document #1 makes the fastest activation path slower and the review queue is already the safety net. `UX.md §8.1`'s "no for the first document" is superseded; the guard is τ plus the quote gate plus the confident-wrong threshold (`THRESHOLDS.md §4.2`, ≤2%). |
| **OQ-15** | **Shared gap-report link default expiry.** | `UX.md §8.4`, `specs/12 §8` | **30 days, revocable, logged, max 90** — `specs/12` already implements exactly this. Close the question. |

---

## 6. Sign-off checklist

The author fleet iterates; I re-review. **I sign when every box below is ticked.** Boxes are ordered so
that the cheap ones unblock the expensive ones.

**Vocabulary and identity**
- [ ] `covered` retired as a status word everywhere (`IDENTITY.md`, `PERSONA.md`, `UX.md`, `samples.html`, `design-system.css` comment, `specs/05`, `specs/06`, `specs/12`); engine value is `meets` — **B-02**
- [ ] `asserted_only`, `not_checked` and `no_certificate` have a word, a glyph, a fill pattern and a hue in `IDENTITY.md §6.4`, tokens in `design-system.css`, panels in `samples.html`, and declared pairs in `contrast.py` — **B-03**
- [ ] `IDENTITY.md §6.1/§6.2/§6.3/§6.5/§7.1/§14.1/§17.3` regenerated from the arbitrated `design-system.css` (`python3 identity/contrast.py --md` for the tables) — **B-15**
- [ ] `python3 identity/contrast.py` still exits 0 with the new pairs, and the greyscale/duplicate-encoding assertions still hold
- [ ] one disclaimer text (KB §F.1/F.2/F.3); `IDENTITY.md §4.4` points at it rather than restating it — **B-12**
- [ ] the disclaimer surface list covers all eleven status-bearing surfaces — **MJ-06**
- [ ] font delivery is self-hosted and consistent with `LANDING_SPEC.md §10`; family names appear only in the two tokens; the Brand Director's ruling in `../IDENTITY_ARBITRATION.md` is applied to `IDENTITY.md §7`, `§14.1`, `§17.3` and `design-system.css` — **MJ-05**

**Knowledge base and extraction**
- [ ] `2025/12` is in the `form_edition` enum, in `KNOWLEDGE_BASE.md §A.2` as current, and a fixture exists — **B-01**
- [ ] golden-set membership reconciled across `KNOWLEDGE_BASE.md §D.5`, `specs/03 §15`, `THRESHOLDS.md §4.1`; the G3/G8 duplication is stated; the ship gate is expressed as "at most N wrong on a denominator of D" — **MJ-01, MJ-02**
- [ ] expected-value JSON exists for every real fixture, with a named owner and a date
- [ ] `specs/03 §6`'s reading copy is marked non-normative and its two `required` omissions fixed — **MJ-15**
- [ ] `label_raw` added to `limits[]` — **MJ-18**
- [ ] the review screen is specified without bounding boxes in `IDENTITY.md §12.2`, `§11` and `UX.md §3.2` — **B-04**
- [ ] C2/C11/C12 re-checked by eye for a real individual's name; the never-reproduce rule is a test — **MJ-20**

**Commercials**
- [ ] tier metric renamed "tracked vendors" in `OFFER.md`, `LANDING_SPEC.md`, `specs/10`, `specs/13` help article 12, **and in the Stripe product names and metadata** — **B-10**
- [ ] `BACKLOG.md M10`'s story says card-required; every "Start free" is "Start 14-day trial" with the disclosure adjacent — **B-06**
- [ ] `IDENTITY.md §4.3`'s *"$299 to 500"* corrected to 400 — **§2.7**
- [ ] entitlements for an org with no subscription are defined and unit-tested — **MJ-10**
- [ ] `specs/11 §9`'s phantom 25-vendor trial cap removed — **MJ-09**
- [ ] `UX.md S6`/`C6` corrected to `specs/10 §5`'s read-only behaviour — **§2.7**
- [ ] seats reconciled: invitations + role matrix are Must (they are already in `specs/01`/`specs/13`), `SH-7` re-scoped — **MJ-03**
- [ ] Lapse Watch: annual remedy defined; the expiry warning is non-optional — **MJ-19**
- [ ] "we never charge your vendors" is in `/legal/terms` with an acceptance criterion — **§2.9**

**Measurement**
- [ ] one activation definition, in `specs/11 §2`; `OFFER.md §9`'s four conditions renamed "trial health checklist"; `UX.md §7` and `LANDING_SPEC.md §11` adopt the spec event names — **B-05**
- [ ] `specs/14 §3.1` measures `trial_converted ÷ activated` — **B-14**
- [ ] an `events:check` CI rule exists: every event named in `THRESHOLDS.md`, `BACKLOG.md` and `LANDING_SPEC.md` resolves to a spec — **B-14**
- [ ] the 60% figure is sourced, replaced with a counted number, or marked an estimate — **MJ-07**

**Email and the vendor side**
- [ ] one reminder ladder (T−60/−30/−14/−7/−1/T+1/weekly-to-T+28) in `IDENTITY.md §12.10` and `UX.md §4.2` — **§2.8**
- [ ] the 72-hour per-recipient cap and the per-expiry total cap are in `specs/07 §9`, and the composer states the total — **§2.8**
- [ ] the CAN-SPAM footer spec (five elements incl. the global opt-out) is in `specs/07 §6`, and "no marketing in a V-email" is added to `BACKLOG.md §4 NEVER` — **MJ-16**
- [ ] every hardcoded `certly.app` is `{APP_ORIGIN}` / `{INBOUND_DOMAIN}`; both are in `PREREQUISITES.md` — **B-11**

**Landing page and the free report**
- [ ] one hero CTA — **MJ-04**
- [ ] the demo and V4 use Certly-authored fixtures, not the corpus; no traced ACORD form; the ACORD notice remains as an attributed quotation — **B-13**
- [ ] word budget re-counted with the published script and the step labels included — **MJ-11**
- [ ] M15: data model buildable — **B-08**; `needs_review` documents named in the report — **B-09**; no producer personal data on the anonymous path, 7-day purge, terms adjacent to the drop zone, daily spend cap — **B-07, OQ-8**

**Handover**
- [ ] storage decision recorded in `product/CLAUDE.md` (OQ-6 closed) and the `DocumentStore` interface specified in the platform brief — **§3**
- [ ] client-direct upload path specified for M4/M8/M15 — **MJ-17**
- [ ] the founder questions in §5 are in `PREREQUISITES.md` with the recommended defaults, so silence ships something defensible
- [ ] `README.md` status table updated; the minor findings MN-01…MN-12 closed or explicitly waived with a reason

**Reviewer's note on process.** Two of the three agents escalated the same contradiction (B-02) rather
than quietly resolving it in their own favour, and the Product Owner rewrote spec 10 to follow another
agent's deliverable when they collided. That is the pipeline working. The findings above are large in
number because the documents are unusually specific — a vaguer folder would have produced a shorter
review and a worse product.
