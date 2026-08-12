# CLAUSEWRIGHT — ADVERSARIAL DESIGN REVIEW

**Scope:** every file in `phase-2-build/architecture/` (ARCHITECTURE, LLM_ENGINE, CORPUS_DESIGN, USER_JOURNEY) and `phase-2-build/identity/` (NAMING, BRAND, DESIGN_SYSTEM, design-system.css, landing/index.html).
**Standard applied:** `IDEA_DOSSIER.md` §0 decisions **D1–D10**, the BUILD/DO-NOT-BUILD lists **B1–B11 / N1–N14**, and the risk register **R1–R16**.
**Reviewer posture:** adversarial. The job is to find where the documents contradict the dossier, contradict each other, or claim something the product does not yet do — not to praise coherence.
**Date:** 2026-08-12

**Headline:** the corpus of Phase-2 documents is unusually disciplined — **all ten binding decisions pass**, and there is no instance of the failure mode the dossier warned about most loudly (marketing the outcome corpus we do not hold). The defects are of a different class: **two binding documents disagreeing about what to build**, **a spec that does not match its own implementation**, and **one public page describing a monitoring mechanism that v1 does not ship**. Four were critical and have been fixed in place; the rest are listed below with owners.

---

## 0. Verdict summary

| # | Check | Verdict |
|---|---|---|
| **D1** | Build it — scope still the validated category | ✅ Pass |
| **D2** | Renamed before code; no asset marketed that we do not hold | ✅ Pass (with a live G1 exposure — §5, M-1) |
| **D3** | Suspension Defense Copilot, not "AI POA generator" | ✅ Pass |
| **D4** | $149 / $399 / $49-mo / $149-mo, deliberately above $97 | ✅ Pass — no contradiction found anywhere |
| **D5** | Transactional first, subscription second | ✅ Pass |
| **D6** | 30 days monitoring included, card on file | ✅ Pass (one copy ambiguity — fixed) |
| **D7** | Entire offer budget on Perceived Likelihood | ✅ Pass |
| **D8** | Community + Engineering-as-Marketing; SEM capped | ✅ Pass |
| **D9** | Workflow not agent; no vector DB; no SP-API in v1 | ✅ Pass — three independent confirmations |
| **D10** | Outcome corpus cut last | ✅ Pass |
| — | Mermaid diagrams present and syntactically valid | ⚠️ 13 diagrams, 1 defect — **fixed** |
| — | Landing page renders plausibly; follows the design system | ⚠️ Renders; 2 conformance defects (1 fixed, 1 listed) |
| — | Citations invariant is genuinely code-level | ✅ Pass — strongest part of the build |

**Counts:** 4 critical (all fixed) · 2 high-severity factual errors (fixed) · 6 high (listed) · 8 medium · 5 low.

---

## 1. Decision-by-decision audit

### D1 — Build it
**Pass.** No document widens the beachhead. `N8`/`N9` (no eBay/Etsy/TikTok/KDP, no listing-level appeals) are restated and enforced structurally: CORPUS_DESIGN §3.2 carries `account_level: true` as a schema field, and LLM_ENGINE §5.1 emits `scope: account | listing | unknown` with `listing → out of scope` as a first-class escalation reason. The exclusion is in the type system, not a note.

### D2 — Rename, and do not market an asset we do not hold
**Pass, and this is the audit's most important negative result.** I searched every customer-facing surface for corpus claims. There are none.

- The landing page contains **no** reference to a corpus, a dataset, "trained on", "learns from", or a success rate. Its Proof section leads with *"There is no success rate on this page. Here is what there is instead."* and closes with a card headed *"We have not published a win rate."* That is the dossier §1.1 discipline executed, not merely quoted.
- BRAND §1 UA3 carries an explicit binding constraint (*"market the mechanism, never the asset"*) with the prohibited and approved wordings side by side.
- **Notably, BRAND corrected the dossier.** Dossier §5.4's approved line against template libraries is *"we're grounded in a live corpus, not a PDF from 2023"* — itself a corpus claim. BRAND Step 7 silently replaces it with *"A static template can't tell you which clause your notice cites. Ours starts from your notice."* That is the right call and should be logged as an amendment to §5.4 rather than left as an undocumented divergence.
- CORPUS_DESIGN §4.2(b) makes the restraint structural: `counts_in_denominator` exists so a rate cannot be computed from winners alone, and §4.5 bars forum seeds from `supporting_n` entirely.

**Residual exposure:** the name itself is not cleared (NAMING §7 N6 is BLOCKING and honest about it: no WHOIS, no TESS/TSDR). Meanwhile the name is now compiled into eight documents, a domain plan, and — critically — **every CSS class and design token via the `cw-` prefix**. See M-1.

### D3 — Copilot, not generator
**Pass.** The category frame appears in full on every top-level surface. BRAND §1 Step 6 correctly identifies "copilot" as a *compliance control* as well as a positioning choice (it constrains autonomy claims under N2/N3/N11), and §4.5 makes that enforceable as a ⛔ copy table. NAMING §3.4 ties the `-wright` suffix to the same constraint. No surface uses "AI POA generator", "appeal letter generator", or an `-AI`/`Agent`/`Auto-` construction.

### D4 — Pricing
**Pass — checked exhaustively, no contradiction.** Every price in every file: Decoder free · Rescue **$149** one-time · Rescue + Human **$399** one-time · Shield **$49/mo or $470/yr** · Shield Pro **$149/mo**. Anchors reproduced as **$3,500 attorney / $1,250 consultant** and — correctly — attributed on-page to AppealDesk's own published table rather than asserted as ours. The **$52** delta is stated once, consistently, in the FAQ. Nothing anywhere undercuts $97, offers a discount, fabricates a strikethrough anchor, or gates a price.

### D5 — Transactional first
**Pass.** Landing order is Decoder → Rescue → Rescue + Human, with Shield presented *below* the transactional grid in a non-purchasable inset card. USER_JOURNEY sequences the subscription decision into J3 at day 25, after reinstatement. No document forecasts subscription-led revenue.

### D6 — 30 days included, card on file
**Pass.** ADR-007 implements it as Stripe `setup_future_usage` with webhooks as the source of truth and idempotency on `event.id`; USER_JOURNEY S7/S14/S15 sequence the decision to the peak-end moment with symmetric one-click options. One ambiguity found and **fixed**: the landing page simultaneously said Shield's 30 days start with every Rescue (i.e. while the seller is down) and that *"Shield is offered once you are back online, never while you are down."* Reworded to *"The paid plan is only ever offered once you are back online"* — which is what M1's adverse-selection control actually requires.

### D7 — Perceived Likelihood gets the budget
**Pass, and it is load-bearing rather than decorative.** BRAND §3.3 reproduces the six levers in the dossier's binding order and makes "no surface may skip L4" a rule. DESIGN_SYSTEM gives the citation chip (§8.5) the most detailed component spec in the system and calls it *"the most important component"*. LLM_ENGINE §2.3 spends its model budget on stage 3 for the same reason. The three documents allocate the same scarce resource the same way without cross-referencing each other's reasoning — that is real alignment.

### D8 — Channels
**Pass.** BRAND §1 Step 10 sequences Community (21/25) and Engineering-as-Marketing (22/25) as the entire path, restates the R2 no-links-in-Seller-Central constraint, and requires every forum reply to stand alone if the link is never clicked. Nothing assumes paid search.

### D9 — Workflow, not agent · no vector DB · no SP-API
**Pass, with the strongest enforcement in the build.**

| Sub-decision | Where enforced |
|---|---|
| Workflow not agent | ARCHITECTURE **I1** + ADR-002: the classifier returns a discriminated union, so `generateDraft()` is *statically unreachable* for every escalation path. LLM_ENGINE §7.2 declares **no tools on any stage** and requires an ADR to add one — a tool being the first step toward the loop N7 forbids. |
| No vector DB | ADR-003; CORPUS_DESIGN §5.5 pre-commits **numeric triggers** (prefix >40% of budget, retrieval failure >5%, >3% after BM25) before any embedding work is permitted. Deferral is gated on measurement, not on willpower. |
| No SP-API | ADR-006 defines `NoticeSource` with three v1 implementations and SP-API as a fourth, explicitly deferred; `StorefrontLivenessSource` is feature-flagged off pending counsel. I4 states there is no code path that accepts a marketplace credential. |

No violation found. The only place autonomy language survives is in the ⛔ prohibition tables that forbid it.

### D10 — Corpus cut last
**Pass.** ADR-008's *Non-negotiable* clause names what gets cut instead (branded PDF, Evidence Kit, inline editing) — a cut list, not an assertion. CORPUS_DESIGN §4.1 states the one-way-door argument correctly: *"You cannot retroactively consent a customer from three months ago."*

---

## 2. CRITICAL — found and fixed in place

### C-1 · The landing page marketed monitoring the product does not have
**Files:** `identity/landing/index.html` (Shield block, FAQ item 5) · **Violates:** BRAND §4.5 ⛔ row 4, `N1`, `N14`, and the §1.1 do-not-market-what-you-do-not-hold rule that D2 exists to enforce.

The page said *"Daily account-health monitoring"* and *"Shield watches your account health daily and names the specific policy at risk when something moves."* Both describe an automated watcher. ADR-006 is explicit that v1 Shield is (a) an inbound-email adapter that only sees what the seller forwards, with detection latency equal to email latency and a real onboarding drop-off (Q3), and (b) for the first twenty buyers, **a human checking in by hand** (`ManualReviewSource`). This is the same defect class as the corpus claim the whole brand is positioned against, on the one page a stranger reads first — and BRAND's own copy table already forbids it verbatim.

**Fixed.** Both passages now describe the forwarding mechanism honestly, and the FAQ converts the constraint into the positioning asset it actually is: *"We never log into your account, so Shield sees what you forward and nothing else."*

### C-2 · Two binding documents specified different models, with no supersession marker
**Files:** `architecture/ARCHITECTURE.md` §2.1, §6.2 vs `architecture/LLM_ENGINE.md` ADR-101.

ARCHITECTURE §2.1 pinned `claude-opus-5` for **all four stages** and argued against mixing tiers; LLM_ENGINE ADR-101 assigns `claude-sonnet-5` to stages 1 and 4. LLM_ENGINE declares the supersession — but ARCHITECTURE, which states *"this document wins"* and is the document an implementer opens first, carried no marker. Same for §6.2's flat 45k-per-stage token/cost table, which ADR-101 replaces with per-stage slices. Two "binding" documents disagreeing about the model IDs is a Day-2 build stoppage.

**Fixed.** §2.1 and §6.2 now carry explicit supersession notes naming ADR-101, and §2.1 records *why* its original objection dissolves (per-stage slices mean there is no shared prefix to fragment) rather than simply deleting the reasoning.

### C-3 · Six state-diagram labels used a line break Mermaid does not reliably honour
**File:** `architecture/USER_JOURNEY.md` §4.

The `stateDiagram-v2` used `\n` inside transition labels (`Classifying --> Escalated: UNCLASSIFIED, low confidence,\nor refused category`). Every other diagram in the repo — including CORPUS_DESIGN's own `stateDiagram-v2` in §4.6 — uses `<br/>`, which is what Mermaid's text splitter handles. `\n` risks rendering as literal backslash-n across the six most important transitions in the case lifecycle.

**Fixed.** All six converted to `<br/>`, matching the rest of the corpus.

### C-4 · The design system specified a token format that would break every glass surface
**Files:** `identity/DESIGN_SYSTEM.md` §4.3, §7 vs `identity/design-system.css`.

The spec documented `--cw-mat-tint` as `#FFFFFF` / `#26333F` and showed a `color-mix()` composite. The implementation defines it as space-separated channels (`255 255 255`) and consumes it as `rgb(var(--cw-mat-tint) / var(--cw-mat-2-alpha))`. Anyone implementing to the spec — the stated purpose of the document — produces an **invalid** `rgb()`, which computes to `transparent`: every card, sheet, veil and pricing surface loses its background, and the §4.5 contrast certification (which assumes a bounded composite) becomes void. The spec is authoritative for a rebuild; the implementation is authoritative today; they disagreed silently.

**Fixed.** §4.3 now documents the channel format with the reason it is not a hex, and §7's code sample matches the shipped CSS.

---

## 3. HIGH — factual errors corrected in place

### H-1 · "Four model calls" — there are three
`ARCHITECTURE.md` §3.2 and ADR-004 both counted four model calls. Stage 2 (retrieve) is a pure in-process function with *no model call* — a point both documents make emphatically two paragraphs earlier. LLM_ENGINE §7.1 says three. Corrected to three in both places; the four-**stage** framing is untouched and correct.

### H-2 · "32 reason codes" — the tables list 33
`CORPUS_DESIGN.md` §3.1, §3.2, §5.4 and §7 all said 32. Counting the actual tables: Amazon authenticity/IP 7 + Code of Conduct 10 + performance/compliance 10 + Walmart 6 = **33**, plus `UNCLASSIFIED`. The count is load-bearing (it drives the L1 token estimate, the 1:1 L3 pattern gate G3, and the confusion-matrix dimension), so an off-by-one propagates into the eval harness. Corrected to 33 in all five places.

---

## 4. HIGH — listed, not fixed (require a decision or an owner)

### H-3 · The Sonnet 5 price-permanence claim is the most consequential unverified fact in the engine design
`LLM_ENGINE.md` §2.1 states as a verified correction that Sonnet 5's $2/$10 rate *"is now the standard price"* and that the scheduled increase to $3/$15 on 2026-09-01 *"will not occur"*, then builds the entire §2.4 cost model on it — including the load-bearing *"$2.69 to acquire one paying customer"* figure. The in-repo Claude API reference still carries **$3.00/$15.00 with $2.00/$10.00 introductory through 2026-08-31**. The document is dated **nineteen days** before that expiry.

The financial exposure is trivial (a 50% rise on two Sonnet stages is cents against $149; the pipeline stays >94% margin either way). The *documentary* exposure is not: a binding document asserts as verified a price change that the reference contradicts, and §2.4's arithmetic would be quietly wrong. **Action:** re-fetch pricing on the build day; if the increase stands, restate §2.1 correction #1 as a dated observation and re-run the §2.4 table. Never quote the "permanently" wording externally.

### H-4 · Reason-code count drifts across three documents
LLM_ENGINE says *"~25 labels"* (§2.2, §2.3, ADR-101); ARCHITECTURE says *"~20–30 codes"*; CORPUS_DESIGN now says **33**. CORPUS_DESIGN is the owning document and firmed the number deliberately. The drift matters because LLM_ENGINE's ~14k L1 prefix estimate and its classifier-accuracy argument are both sized against ~25. **Action:** propagate 33 into LLM_ENGINE and ARCHITECTURE, and re-baseline the L1 token estimate with `count_tokens` once L1 exists (Q-E1 already says to).

### H-5 · The golden set cannot satisfy its own coverage claim
`LLM_ENGINE.md` §8.1 allocates *"~20 clear single-code notices, spread across the L1 taxonomy — every code represented at least once"* out of ~40 total. With 33 codes this is arithmetically impossible, and it is the slice that anchors the confusion matrix that gates every deploy. **Action:** either raise the clear-notice slice to ≥33 (taking the set to ~55) or drop the every-code claim and state the coverage target honestly. Do not leave a blocking CI gate resting on an impossible premise.

### H-6 · The cached-prefix token budget contradicts itself inside one document
`CORPUS_DESIGN.md` §5.1 computes its cost table from a *"~45,000-token cached prefix"*; §5.4's own budget table totals the cached prefix at **~19,000**. ARCHITECTURE §6.2 said ~45k per stage; LLM_ENGINE §3.2 says 14k / 3k+5k / 4k. Three documents, four numbers. Worse, §5.1's per-read and per-write costs are computed at **Opus 5 rates for stages ADR-101 moved to Sonnet 5**. **Action:** LLM_ENGINE §3.2 should be declared the single owner of the token budget; CORPUS_DESIGN §5.1 and §5.4 reconciled to it; all cost tables recomputed per-stage at the stage's own model rate. Every figure stays an estimate until the build-time `count_tokens` assertion runs — which is the real control and is already specified.

### H-7 · The landing page advertises a guarantee that ARCHITECTURE says must not yet be advertised
The page states the 10-minute time guarantee in four places (hero card, Rescue tier, Proof card, FAQ). `ARCHITECTURE.md` §9 **Q9** is explicit: *"the automatic-refund job must exist before the guarantee is advertised."* Right now the page could ship before the job does — and an unhonoured unconditional guarantee is precisely the trust failure the whole positioning is built to avoid. **Action:** add the SLO-refund job to the launch gate alongside G2–G5, and treat "page goes live" as blocked on it. This is a sequencing rule, not a copy change — the guarantee is correct and should lead.

### H-8 · The landing page violates the design system's own performance guard
`DESIGN_SYSTEM.md` §7 sets a hard, review-enforced limit: *"no more than three translucent surfaces composited in one viewport."* The landing page composites **four** in at least two viewports — the sticky L1 header plus three `.cw-card` step cards ("What happens after you paste"), and the header plus three `.cw-price` cards (pricing grid). `backdrop-filter` compounds badly, and the buyer is on mobile data at 2am, which is the exact scenario the guard was written for. **Action:** pick one — demote the step cards to `.cw-card--quiet`, render the price cards on the opaque inset surface, or measure on the real build (§11 already flags the limit as an unmeasured judgment) and amend the guard with the number. Do not leave the system and its flagship page in contradiction.

---

## 5. MEDIUM

**M-1 · The name is compiled into the CSS, and the name is not cleared.** `NAMING.md` N6 is correctly marked BLOCKING — no WHOIS, no TESS/TSDR, all clearance from HTTP probes. Meanwhile `cw-` (Clausewright) prefixes every token and class in a 1,412-line stylesheet plus a 2,459-line page, and DESIGN_SYSTEM §10 makes the prefix a review-enforced contract. If counsel knocks the name out, the rebuild is not "find and replace the wordmark" — it is a full design-token rename plus eight documents plus the domain. **Action:** either clear G1 before the build starts (the dossier already says Day 0, blocking) or make the prefix neutral now, while it costs one `sed`.

**M-2 · The landing page's example citation is not the citation the product will produce.** The `.cw-cite` figure quotes Amazon's own prose verbatim (*"Act fairly and honestly on Amazon…"*) and links `sellercentral.amazon.com/help/hub/reference/G1801`. CORPUS_DESIGN §3.3.2 is explicit that the citation target is **our own summary** keyed to a clause id — *"the `cited_text` a customer sees is our writing plus a pointer"* — and §3.5 records that G1801 returns a **logged-out marketing shell with no policy text**. So the page demonstrates a citation shape the engine will not emit, and offers a "View the policy page" link that shows the seller nothing. It also sits closer to the §3.6 copyright line than our own design requires. **Action:** replace with an our-prose clause summary plus a Tier-A CDN PDF source URL. This is the single most-scrutinised element on the page; it should be a true rendering of the real component.

**M-3 · Four journey screens have no architectural home.** `USER_JOURNEY.md` §0 asserts *"Every screen named below already exists in ARCHITECTURE.md §3.1–3.8; this document does not invent new surfaces."* It does: **S6 pre-submission checklist**, S13 reinstatement confirmation, S15 renewal decision, S17 cancellation confirmation. S6 is the problem — §7.3 calls it *"the highest-leverage single screen in the product"* and DESIGN_SYSTEM builds components for it, yet no architecture section owns it, so it can be silently dropped on a slipping five-day build. **Action:** add the four surfaces to ARCHITECTURE §3.1 with owners, or soften the claim and mark S6 explicitly un-cuttable.

**M-4 · Reference request shapes are non-streaming, but the product requires streaming.** `LLM_ENGINE.md` §7.4 shows `client.messages.create(...)` for both stages. ARCHITECTURE §3.1 and USER_JOURNEY §6 both require token-by-token SSE for the draft — the narrated wait is called the highest-risk surface in the product — and `max_tokens: 16000` sits at the boundary where non-streaming requests risk HTTP timeouts. **Action:** switch the reference shapes to the streaming helper. It is the SDK-recommended path at this `max_tokens` and it is what the UX contract requires.

**M-5 · Route naming disagrees.** The landing form posts to `/decode`; ARCHITECTURE §3.1 specifies the page at `/` calling `POST /api/appeal` (SSE). Reconcile before the build, and decide explicitly whether the marketing page and the app paste screen are one URL or two — BRAND §3.5's surface map treats them as different registers with different required layers.

**M-6 · No stated posture on refusal fallbacks.** `claude-opus-5` ships elevated cybersecurity safeguards and can return `stop_reason: "refusal"`; a deactivation notice citing counterfeit, fraud, or account takeover is a plausible false-positive trigger, and it is *the entire input surface*. LLM_ENGINE §6.4 handles this correctly by escalating to the human tier — which is arguably a better product answer than a silent model swap, since it converts the failure into the differentiated revenue line. But the document never says it *considered* the server-side `fallbacks` parameter. **Action:** record escalation-over-fallback as a deliberate choice with its reason, so a later engineer does not "fix" it by adding a fallback that bypasses the human tier.

**M-7 · The loss counter ships pre-filled with someone else's numbers.** DESIGN_SYSTEM §8.9 says what makes the counter a fact rather than a pressure tactic is that *"the seller's number is visibly theirs."* On first paint it reads "3 days × $800/day = $2,400" — none of which is the visitor's. The adjacent note is honest about the provenance and the fields are editable, so this is not a manufactured-urgency violation. But it is a manufactured *number*. **Action:** consider empty fields with the arithmetic appearing on first input; the empty state is more persuasive than a stranger's $2,400.

**M-8 · Cross-reference collision.** `CORPUS_DESIGN.md` §9 cites *"(G2)"* for counsel review of the L4 consent text. In that document G2 is a CI gate (referential integrity of `governed_by`); the intended referent is the dossier's Day-0 gate G2. Rename one namespace — the document defines G1–G16 for CI gates and the dossier defines G1–G5 for launch gates, and they will keep colliding.

---

## 6. LOW

- **L-1 · Bidirectional edge dependency.** ARCHITECTURE §4.2 uses `api <--> stripe`. Valid in current Mermaid, unsupported in older renderers. If the docs are published anywhere with a pinned Mermaid version, verify or split into two edges.
- **L-2 · Inlined CSS will drift.** `landing/index.html` inlines `design-system.css` verbatim (correct for CSP and for a no-external-request page). The header says "edit the source and re-inline" — that instruction needs a build step or a CI check, or the two copies diverge within a week.
- **L-3 · Documented component unused.** `.cw-price--anchor` is specified in DESIGN_SYSTEM §8.6 and implemented in the CSS, but the page renders anchors as `.cw-lp-anchor` list items instead. Either use the system component or delete it.
- **L-4 · Loss counter anatomy mismatch.** DESIGN_SYSTEM §8.9 describes it as a `.cw-card--quiet`; the CSS implements `.cw-loss` on `--cw-surface-inset` with a hairline. Harmless, one-line fix to the spec.
- **L-5 · Invariant-6 list drift.** BRAND §5.5 omits SellerLabs / SellerAppeal, which NAMING §5.6 includes in the owned `Seller*` field.

---

## 7. Mermaid audit

**13 diagrams across four documents**, all present and all fenced correctly.

| Document | Diagrams | Result |
|---|---|---|
| ARCHITECTURE | 4 — C4 context, C4 container, sequence, deployment | Valid. `alt/else/end`, `rect/end`, `opt/end` all balanced in §4.3 (verified by nesting trace). `classDef`/`class` well-formed. One renderer dependency (L-1). |
| LLM_ENGINE | 1 — the four-stage chain | Valid. Rhombus gate, subgraph nesting and dotted escalation edges all well-formed. |
| CORPUS_DESIGN | 4 — ER model, ingestion pipeline, consent sequence, curation states | Valid. ER attribute syntax correct including quoted comments containing `\|`; HTML entities (`&le;`, `&gt;`) correctly escaped inside node labels; `alt/end` and `opt/end` balanced. |
| USER_JOURNEY | 4 — three `journey` diagrams, one `stateDiagram-v2` | Journey task lines correctly avoid stray colons. **State diagram had the C-3 defect — fixed.** |

The diagrams are also *substantively* right, which is rarer than syntactic validity: §4.1's double arrow from seller to marketplace draws **I4** (the seller submits, we never do), and §4.2's escalation edge runs `classify → /ops`, never `classify → draft`, which draws **I5**. A diagram that encodes an invariant is worth more than the prose restating it.

---

## 8. Landing page audit

**Structure — passes.** Verified programmatically: zero unclosed or mismatched elements across the full body. One `<h1>`; heading order h1 → h2 → h3 with no skipped levels; every `<section>` carries `aria-labelledby`; every input has a real `<label>` (visually hidden where the label would break the sentence); the error region is `hidden` and wired through `aria-describedby`; the skip link targets `#main`. The theme script runs before first paint inside `try/catch`, so storage being unavailable degrades to system preference rather than throwing. The loss-counter total is rendered in the HTML, so it is correct with JavaScript disabled — a detail most pages get wrong.

**Design-system conformance — passes on the rules that matter, fails one.**

| Rule | Result |
|---|---|
| P6 — exactly one `.cw-btn--primary` per screen | ✅ Exactly one, in the hero. Every pricing CTA is `.cw-btn--secondary`. |
| §2 rule 2 — glass never composites over glass | ✅ Nested surfaces use `.cw-card--inset`; the 50k-character paste textarea sits on `--cw-surface-inset`, not on glass. |
| §7 — no bespoke `backdrop-filter` outside the system | ✅ The `cw.page` layer composes system classes only. |
| §10 — cascade layers, semantic tokens only | ✅ `@layer cw.page` declared after the system layers; no primitive-token references in page CSS. |
| X1 — no scarcity furniture | ✅ No countdown, no "N viewing", no fake anchor. The only urgency device is the loss counter. |
| §7 — ≤3 translucent surfaces per viewport | ❌ **Four in two viewports (H-8).** |

**Copy conformance — passes.** No emoji, no exclamation marks, no success rate, no autonomy claim, no "legal clause", no professional-advisor title. "Not legal advice" appears in the header *and* the footer disclaimer. The footer adds an unaffiliated-with-Amazon/Walmart statement that no upstream document required — a genuinely good addition. Voice matches BRAND's R-1/R-3 registers, and the "we" versus "you" ratio passes P5.

---

## 9. What the review did not find, and why that is worth stating

Adversarial reviews are usually most useful for what they catch. Three absences here are themselves findings:

1. **No pricing contradiction.** Five tiers across eight documents and a 2,459-line page, with zero drift. That is unusual enough to note.
2. **No corpus marketing.** The failure mode the dossier singled out as the reason to rewrite the original one-liner does not appear on any surface — and BRAND actively corrected the dossier's own slip.
3. **No autonomy creep.** Every document that could have quietly promised more automation than ADR-006 delivers instead makes the absence of credentials a selling point. C-1 was the single exception, and it was on the highest-traffic surface — which is exactly where this class of defect is most expensive and least likely to be noticed by the people who wrote the constraint.

---

## 10. Fix log

**Applied in this review:**

| # | File | Change |
|---|---|---|
| C-1 | `identity/landing/index.html` | Shield block and FAQ rewritten to describe email forwarding rather than automated daily monitoring; paid-plan timing clarified |
| C-2 | `architecture/ARCHITECTURE.md` §2.1, §6.2 | Supersession notes added naming LLM_ENGINE ADR-101; the dissolved cache-fragmentation objection recorded rather than deleted |
| C-3 | `architecture/USER_JOURNEY.md` §4 | Six `\n` line breaks converted to `<br/>` |
| C-4 | `identity/DESIGN_SYSTEM.md` §4.3, §7 | `--cw-mat-tint` documented as space-separated channels with the failure mode named; code sample matched to the shipped CSS |
| H-1 | `architecture/ARCHITECTURE.md` §3.2, ADR-004 | "four model calls" → three (stage 2 is a pure function) |
| H-2 | `architecture/CORPUS_DESIGN.md` ×5 | Reason-code count 32 → 33 |

**Owned elsewhere:** H-3 through H-8 need a decision; M-1 through M-8 and L-1 through L-5 are queued. The two that should block the build starting are **M-1** (clear the name before the `cw-` prefix is load-bearing) and **H-7** (do not publish the time guarantee before the refund job exists).

---

**Document status:** review of record for Phase 2. Fixes applied are noted in §10; every other finding is open and owned. Where this review conflicts with a Phase-2 document, the Phase-2 document wins only once its owner has answered the finding.
