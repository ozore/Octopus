# CLAUSEWRIGHT — ADVERSARIAL DESIGN REVIEW

**Scope:** every file in `phase-2-build/architecture/` (ARCHITECTURE, LLM_ENGINE, CORPUS_DESIGN, USER_JOURNEY) and `phase-2-build/identity/` (NAMING, BRAND, DESIGN_SYSTEM, design-system.css, landing/index.html).
**Standard applied:** `IDEA_DOSSIER.md` §0 decisions **D1–D10**, the BUILD/DO-NOT-BUILD lists **B1–B11 / N1–N14**, and the risk register **R1–R16**.
**Reviewer posture:** adversarial. The job is to find where the documents contradict the dossier, contradict each other, or claim something the product does not yet do — not to praise coherence.
**Date:** 2026-08-12

**Headline:** the corpus of Phase-2 documents is unusually disciplined — **all ten binding decisions pass**, and there is no instance of the failure mode the dossier warned about most loudly (marketing the outcome corpus we do not hold). The defects are of a different class: **two binding documents disagreeing about what to build**, **a spec that does not match its own implementation**, and **one public page describing a monitoring mechanism that v1 does not ship**. Four were critical and have been fixed in place; **all six HIGH findings (H-3–H-8) have since been resolved in place** (§4, §10); the medium and low findings are listed below with owners.

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
| — | Landing page renders plausibly; follows the design system | ✅ Renders; 2 conformance defects, **both fixed** (C-4, H-8) |
| — | Citations invariant is genuinely code-level | ✅ Pass — strongest part of the build |

**Counts:** 4 critical (all fixed) · 2 high-severity factual errors (fixed) · **6 high (all resolved — §4)** · 8 medium · 5 low.

**Of the six HIGH findings, five were defects and one was not.** H-3 alleged an unverified pricing claim; re-fetching the live source confirmed the design document and convicted the *cached reference* the review had trusted. That asymmetry is the review's own most useful result: the artifact that looks authoritative because it is local is the one most likely to be stale.

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

## 4. HIGH — all six resolved in place (2026-08-12)

**Status: H-3 through H-8 are closed.** Each entry below states the finding as it stood, then the resolution as shipped. Two resolutions changed a *document* to match reality; three changed reality to match a *rule*; one (H-3) confirmed the document and corrected the reviewer.

### H-3 · The Sonnet 5 price-permanence claim — ✅ **VERIFIED, the document was right**
**Finding.** `LLM_ENGINE.md` §2.1 stated as a verified correction that Sonnet 5's $2/$10 rate *"is now the standard price"* and that the scheduled increase to $3/$15 on 2026-09-01 *"will not occur"*, then built the §2.4 cost model on it — including the load-bearing *"$2.69 to acquire one paying customer"* figure. The in-repo Claude API reference carried **$3.00/$15.00 with $2.00/$10.00 introductory through 2026-08-31**, dated **nineteen days** before that expiry.

**Resolution — the live source was re-fetched, and it confirms the engine document verbatim.** `platform.claude.com/docs/en/about-claude/pricing` carries the note:

> *"The $2/$10 per million input/output token pricing for Claude Sonnet 5, announced at launch as introductory pricing through August 31, 2026, is now the standard price. The previously scheduled increase to $3/$15 per million input/output tokens on September 1, 2026 will not occur."*

**The in-repo reference is the stale artifact, not the design document** — it was cached 2026-06-24, before the 2026-08-11 announcement. Every other rate in §2.1 was re-verified against the same page (Opus 5 $5/$25, Fable 5 $10/$50, Haiku 4.5 $1/$5, all cache columns), as were §2.2's model facts against the Models overview (Opus 5 knowledge cutoff May 2026, latency tiers *Moderate* / *Fast*, Haiku 4.5's lack of adaptive thinking) and the 512/1024/4096 prefix minimums against the Prompt caching page. **§2.4's arithmetic stands unchanged.**

What did change: §2.1 now quotes its source verbatim with a fetch date, names the stale-cache disagreement and says which wins, and **forbids the word "permanently" externally** — the published wording describes a cancelled increase, not a perpetual commitment. New **Q-E9** re-frames every published model fact as a *dated observation with an expiry*, to be re-fetched on the build day. §2.1 also now separates what documentation can verify (prices, IDs, limits) from what it never could (our token estimates, our classifier accuracy, our modelled costs) — the latter stay hypotheses in §9.

*The reviewer's instinct was right and its conclusion was wrong: the correct response to "a binding document contradicts a cached reference" is to re-fetch the source, not to assume the cache.*

### H-4 · Reason-code count drift — ✅ **RESOLVED: 33, from CORPUS_DESIGN's own table**
**Finding.** LLM_ENGINE said *"~25 labels"*; ARCHITECTURE said *"~20–30 codes"*; CORPUS_DESIGN said **33**.

**Resolution.** The canonical count is **33 plus `UNCLASSIFIED`**, taken from the actual §3.2 taxonomy tables (Amazon authenticity/IP 7 + Code of Conduct 10 + performance/compliance 10 + Walmart 6). CORPUS_DESIGN §3.2 is now named as the owning table, and 33 is propagated to every dependent claim: LLM_ENGINE **E2**, §2.2 (routing over 33 labels), §3.2 (the L1 prefix is now shown as **33 × ~400 ≈ 13,000** + ~1,000 instructions, which is where the ~14,000 estimate comes from), §3.3 (a **33-entry** per-code cache pool); ARCHITECTURE §3.2, §3.3 L1/L3 record counts, and ADR-002's context. The number is now arithmetic with a visible derivation rather than an assertion repeated at three different values.

### H-5 · The golden set could not satisfy its own coverage claim — ✅ **RESOLVED: the set grew to ~53**
**Finding.** `LLM_ENGINE.md` §8.1 allocated *"~20 clear single-code notices … every code represented at least once"* out of ~40 total. With 33 codes that is impossible, and it anchors the confusion matrix gating every deploy.

**Resolution — the size is now derived from the taxonomy instead of chosen.** The single-code slice is **33 notices, one per code**, taking the set to **~53**. The reasoning is stated in the document: a blocking CI gate with blind matrix rows is *worse* than no gate, because it reports green for a code it never tested. Three supporting controls were added so the coverage claim is checkable rather than aspirational:

- every fixture carries `provenance: real | synthetic`, a synthetic one being authored from that code's L1 record;
- `corpus:build` emits a **coverage manifest** and **fails below 33/33**, reporting the real/synthetic split per code;
- the nightly Sonnet-vs-Opus comparison behind **ADR-101's** promotion rule scores the **real subset only** — a model-tier decision must not turn on notices we wrote ourselves.

Propagated to §8.2 (33-code matrix, every row populated), ADR-101's promotion rule, §6.1's Q5 reference, CORPUS_DESIGN §3.2 and §8, and ARCHITECTURE §7.2, §8 and Q5.

### H-6 · The cached-prefix token budget contradicted itself — ✅ **RESOLVED: one owner, per-stage rates**
**Finding.** CORPUS_DESIGN §5.1 computed from a *"~45,000-token cached prefix"*; §5.4 totalled **~19,000**; ARCHITECTURE §6.2 said ~45k per stage; LLM_ENGINE §3.2 said 14k / 3k+5k / 4k. Three documents, four numbers — and §5.1's costs were computed at **Opus 5 rates for stages ADR-101 moved to Sonnet 5**.

**Resolution.** **`LLM_ENGINE.md` §3.2 is now the declared single owner of the token budget**, stated in that document's header and repeated as a deferral notice in CORPUS_DESIGN §5.1/§5.4 and ARCHITECTURE §6.2/Q2. §3.2 gained a decomposition table so each figure can be checked: 14k classify (1k instructions + 33 × ~400) · 3k draft system + 5k per-code documents · 4k critique · **~26,000 cached across the pipeline**, split 18k Sonnet / 8k Opus. CORPUS_DESIGN §5.1's cost table is recomputed **per stage at that stage's own model rate** — $0.008 read / $0.095 5-min write / $0.152 1-hour write for the whole pipeline — and §5.4 is now a per-stage restatement rather than a rival budget.

Two real reconciliations fell out of it, both consequences of **E3** that had never been written down: the **retrieval index (~2,000) is gone from every prompt** (stage 2 is a code-keyed lookup; no model is ever shown an index), and the drafting rubric moved into stage 4's prefix where the critique actually consumes it. The prefix-minimum check also became per-model — each stage asserts against *its own* model's floor (512 Opus / 1024 Sonnet) rather than one number standing in for the pipeline.

### H-7 · A guarantee advertised ahead of the job that honours it — ✅ **RESOLVED: removed from the page**
**Finding.** The page stated the 10-minute time guarantee in four places. `ARCHITECTURE.md` §9 **Q9**: *"the automatic-refund job must exist before the guarantee is advertised."*

**Resolution — the claim came off the page; ARCHITECTURE's rule stands.** The review's suggested fix (ship the page, gate the launch) inverts the safety property: it leaves the unbacked promise in the artifact and relies on a process step to catch it. **All four instances are removed**, plus a fifth in the pricing FAQ that the review missed:

| Where | Was | Now |
|---|---|---|
| Proof card 03 | "Three guarantees… in your inbox in 10 minutes or it is free" | "**Two** guarantees" — revisions and free human review; the draft is described as *written while you wait* |
| Rescue tier bullet | "Plan of Action in under 10 minutes" | "Plan of Action, **written while you wait**" |
| Rescue guarantee line | "In your inbox in 10 minutes or it is free" | "Unlimited revisions until you are reinstated or you tell us to stop" |
| FAQ *"Can you guarantee I get reinstated?"* | Time guarantee listed among the three | Removed — **and the absence is explained**: *"a guarantee is only worth the refund behind it, and ours pays out automatically or not at all"* |
| FAQ *"Why $149 when there is a $97 tool?"* | "…the time guarantee…" | "…the human tier standing behind the hard cases…" |

The last row is the one that matters for voice: the page already refuses to publish a win rate and says so out loud, so refusing to publish a guarantee and saying why is the *same* move on the same page — it reads as consistency, not retreat. ARCHITECTURE §9 now carries **G6**, an explicit launch gate binding the copy to the code: no surface states a delivery-time guarantee until the automatic SLO-refund job is running in production **and has been exercised on a deliberately-breached test case**. The 10-minute SLO itself still ships and is still measured; what is withheld is the promise, not the measurement.

### H-8 · The landing page violated the design system's own performance guard — ✅ **RESOLVED: the page moved, not the guard**
**Finding.** `DESIGN_SYSTEM.md` §7 caps a viewport at **three translucent surfaces**; the page composited four in at least two viewports (sticky header + three `.cw-card` step cards; header + three `.cw-price` cards).

**Resolution.** The review offered three options; two of them were unavailable on inspection. `.cw-card--quiet` only removes the *shadow* — the `backdrop-filter` survives, so demoting to it would have left the guard broken while looking fixed. Amending the guard from a number we have not measured would have been reasoning backwards from the page.

So the system gained the missing level: **`.cw-mat-0`, the opaque material** — same tokens, same geometry, same hairline, no compositing cost, rendering on `--cw-mat-opaque`, which *is* the already-certified opaque row from §4.5. `.cw-card` and `.cw-price` apply their glass through a `:not(.cw-mat-0)` guard, so the class removes the material rather than layering over it. The three step cards and three pricing cards now carry it. **Every viewport of the page is at one translucent surface against a budget of three.**

§7 also gained the **counting rule** whose absence caused the defect: the sticky header is glass and is present in *every* viewport, so a full-width grid of three glass cards is already four. Count the header first. §11's honesty note is retained and extended — the limit is still an unmeasured judgment, and the correct response to an unmeasured limit is to respect it until measured, not to widen it to fit the page in front of you.

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
| §7 — ≤3 translucent surfaces per viewport | ✅ **Fixed (H-8).** Step cards and pricing cards now take `.cw-mat-0`; one translucent surface (the header) per viewport. |

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

**Applied in the H-3–H-8 resolution pass (2026-08-12):**

| # | File | Change |
|---|---|---|
| H-3 | `architecture/LLM_ENGINE.md` §2.1, header, §9 | Pricing **re-verified live** against `platform.claude.com` — the document was correct and the cached in-repo reference is stale. Source quoted verbatim with fetch date; the stale-cache disagreement named and adjudicated; "permanently" barred from external use; verified-vs-hypothesis boundary stated explicitly; new **Q-E9** makes every published model fact a dated observation with a build-day re-fetch |
| H-4 | `architecture/LLM_ENGINE.md` ×4, `architecture/ARCHITECTURE.md` ×4 | Reason-code count → **33** everywhere, sourced from CORPUS_DESIGN §3.2; L1 prefix estimate given a visible derivation (33 × ~400 + ~1,000) |
| H-5 | `architecture/LLM_ENGINE.md` §8.1–8.2, ADR-101, §6.1; `CORPUS_DESIGN.md` §3.2, §8; `ARCHITECTURE.md` §7.2, §8, Q5 | Golden set **~40 → ~53**, single-code slice → **33 (one per code)**; `provenance: real \| synthetic`; build-emitted coverage manifest failing below 33/33; promotion rule scored on the real subset only |
| H-6 | `architecture/LLM_ENGINE.md` §3.2 + header; `CORPUS_DESIGN.md` §5.1, §5.4; `ARCHITECTURE.md` §6.2, ADR-003, Q2 | **LLM_ENGINE §3.2 declared single owner** of the token budget; per-stage decomposition added (~26k cached, 18k Sonnet / 8k Opus); CORPUS_DESIGN cost table recomputed **per stage at that stage's model rate**; retrieval index removed from the budget (stage 2 shows no model an index); prefix-minimum assertion made per-model |
| H-7 | `identity/landing/index.html` ×5; `architecture/ARCHITECTURE.md` §9 | Time guarantee **removed from all public copy** (four instances the review found, plus a fifth in the pricing FAQ it missed); its absence explained on-page in the same register as the win-rate refusal; new launch gate **G6** binds the claim to the running refund job |
| H-8 | `identity/design-system.css`, `identity/landing/index.html` (system + inlined copy), `identity/DESIGN_SYSTEM.md` §7, §11 | New **`.cw-mat-0` opaque material level**; `.cw-card` / `.cw-price` glass moved behind a `:not(.cw-mat-0)` guard; step and pricing cards demoted → **one translucent surface per viewport**; §7 gained the header-counts-first counting rule |

*The two CSS copies (`design-system.css` and the inlined block in `index.html`) were patched together and verified byte-identical across the system layers — see **L-2**, which is why that check is not optional.*

**Owned elsewhere:** M-1 through M-8 and L-1 through L-5 are queued. **The one that should still block the build starting is M-1** — clear the name before the `cw-` prefix is load-bearing. H-7's blocking concern is discharged: the guarantee is no longer on the page, and **G6** now gates its return on the refund job rather than on someone remembering.

---

**Document status:** review of record for Phase 2. Fixes applied are noted in §10; **§4's six HIGH findings are closed**; every other finding is open and owned. Where this review conflicts with a Phase-2 document, the Phase-2 document wins only once its owner has answered the finding.
