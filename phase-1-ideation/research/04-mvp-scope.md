# MVP Scope & Feasibility — "Reinstate" (Amazon/Walmart Suspension-Appeal Copilot)

**Assignment:** Define exactly what to build and what NOT to build for v1; the knowledge-base acquisition plan (sources, scraping feasibility, legality); technical risks; and a build plan AI agents can execute in days.

**Method:** MVP scoped per Eric Ries's *The Lean Startup* (riskiest-assumption-first, build–measure–learn, innovation accounting) and YC guidance (launch fast, do things that don't scale). The AI/knowledge component is designed on published foundations: Lewis et al. 2020 RAG (NeurIPS), Karpathy's *Software 2.0*, and Anthropic's published agent-engineering guides. Legality is grounded in decided case law (Van Buren, hiQ) and directly-verified robots.txt / ToS surfaces.

**Date:** 2026-08-12
**Verdict:** **GO_WITH_CHANGES**

**Method note / limitation:** the session's WebSearch budget was exhausted before this assignment began. All research below was conducted by direct WebFetch against named URLs (Amazon SP-API docs, Amazon Seller Central robots.txt and Seller Forums, Walmart Marketplace Learn, Anthropic engineering docs, arXiv, Wikipedia for case law). Two legal citations (Thomson Reuters v. Ross; Meta v. Bright Data) could not be fetched in-session and are **explicitly flagged as recalled-not-verified** where used. Sibling deliverables `01-demand-pmf.md` and `02-competition-positioning.md` were read in full and are treated as inputs, not re-derived.

---

## 0. Executive summary

The sibling research settles two questions that would normally dominate an MVP scope: demand is real (money already changing hands — Riverbend at 400+ appeals/month, per [riverbendconsulting.com](https://riverbendconsulting.com/)), and the "paste notice → AI-drafted Plan of Action" mechanic is **already shipped and priced below our planned tier** by at least AppealDesk ($97 flat) and AppealDraft ($149). That inverts the normal MVP question. We are not testing *whether sellers want this*. We are testing *whether our specific differentiator is worth a premium over a $97 incumbent and over free*.

Per Ries's instruction to attack the riskiest assumption first, the riskiest assumption is therefore **not** demand and **not** "can an LLM write a POA." It is:

> **A retrieval-grounded draft that names the exact policy clause and reason code from the seller's own notice, plus a visible readiness critique, converts a panicking seller to payment at a higher price than a generic AI draft — and does so at the forum moment.**

Everything in the v1 scope below exists to test that sentence in under a week, and everything not needed to test it is cut.

The three highest-leverage scope decisions, each of which removes weeks of work:

1. **No Selling Partner API integration in v1.** Amazon's SP-API *does* expose exactly the right primitive — `ACCOUNT_STATUS_CHANGED`, which fires on transitions between `NORMAL`, `AT_RISK` and `DEACTIVATED` ([Notification Type Values](https://developer-docs.amazon/sp-api/docs/notification-type-values)) — but reaching it requires a *public* app: Appstore listing, Solution Provider Agreement, Data Protection Policy review, security-control questionnaire and role grants ([Registering as a developer](https://developer-docs.amazon/sp-api/docs/registering-as-a-developer), [Roles in the SP-API](https://developer-docs.amazon/sp-api/docs/roles-in-the-selling-partner-api)). That is a multi-week compliance project, not a days-long build. The monitoring subscription is real and should be sold — but fulfilled manually in v1 (Ries's *concierge MVP*).
2. **Never touch seller credentials.** No login, no session cookies, no "connect your account." This is simultaneously the largest legal risk, the largest trust risk, and a competitor's explicit marketing claim ("We never log into your account" — [appealdraft.org](https://www.appealdraft.org/)). Removing it removes an entire risk class for free.
3. **Build a workflow, not an agent.** Anthropic's [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) draws the line explicitly: workflows use "predefined code paths," agents "dynamically direct their own processes," and the guidance is to "find the simplest solution possible, and only increas[e] complexity when needed." POA generation is a well-defined task with a known shape — classify → retrieve → draft → critique. It is a **prompt chain with routing and an evaluator-optimizer stage**, three of the five named workflow patterns. An autonomous agent here buys latency and cost and nothing else.

**Feasibility verdict: a 5-day build by AI agents is realistic**, with one hard blocker to clear first (naming — see §7.0), because the two things that usually make this class of product slow (a proprietary corpus and a platform integration) have both been descoped: the corpus is small enough to sit in a cached prompt, and the integration is deferred.

---

## 1. Riskiest-assumption analysis (Lean Startup)

Ries frames every new venture as resting on two hypotheses: a **value hypothesis** (does this deliver value to users) and a **growth hypothesis** (how will users find it). The MVP is defined as the version that "enables a full turn of the build–measure–learn loop with a minimum amount of effort." Assumptions must be ranked, then attacked in order of *risk*, not order of *ease*.

Ranking Reinstate's assumptions by residual risk, given what the sibling reports have already retired:

| # | Assumption | Status after sibling research | Residual risk | Test in v1? |
|---|---|---|---|---|
| A1 | Sellers get suspended often enough to constitute a market | Retired — 22–35% lifetime incidence over ~2M active sellers (`01-demand-pmf.md` §3) | **Low** | No |
| A2 | Sellers will pay real money, urgently | Retired — a full price ladder $97→$1,000+ exists and transacts (`01` §2, `02` §1) | **Low** | No |
| A3 | An LLM can produce a plausible POA | Retired — 5+ shipped products do this today (`02` §1.1) | **Low** | No |
| A4 | **A cited, reason-code-matched draft is judged better than a generic AI draft — enough to pay a premium** | Untested | **HIGHEST** | **Yes — primary** |
| A5 | **The forum/community channel converts at acceptable cost** | Channel exists and competitors use it; our conversion unknown | **High** | **Yes — secondary** |
| A6 | Human rush review at $299–499 is wanted alongside the self-serve draft | Untested; AppealDesk refuses hard cases, so the demand is inferred not observed | **High** | **Yes — as a priced option, fulfilled by hand** |
| A7 | Drafts actually improve reinstatement outcomes | Untested, and **structurally slow to test** | High but **unmeasurable in v1** | Instrument only (§6) |
| A8 | Monitoring converts to a recurring subscription | Untested | Medium | Sell manually, don't build |

**The critical scoping consequence of A7.** Amazon and Walmart appeal decisions take days to weeks, and Walmart states plainly that appeals are "handled and responded to in the order in which they're received" with no committed timeline ([Walmart Marketplace Learn — Appeal an account suspension](https://marketplacelearn.walmart.com/guides/Seller%20Account%20Management/Appeal-an-account-suspension)). Ries's entire method depends on shortening the feedback loop; a 3–30 day outcome loop that also depends on voluntary self-reporting is the worst possible primary metric for a 5-day MVP. **v1 therefore optimizes a leading indicator — willingness to pay *after seeing the draft* — and merely instruments the lagging one.** This single decision drives the "preview-then-pay" mechanic in §2.

**Consequence for A4's test design.** Because A4 is comparative ("better than a generic draft"), the MVP must make the differentiator *visible before payment*. A draft delivered after payment cannot test A4 — the seller pays on the promise, not the product. Hence the paywall sits *after* the seller sees the classified reason code, the cited policy clauses, and the readiness critique, but *before* the full submission-ready document. That is not a growth-hack; it is the experiment design.

---

## 2. v1 scope — exactly what to BUILD

Scope is expressed as a single user journey. Per YC's standing advice to launch something narrow and embarrassing rather than broad and late, and Moore's *Crossing the Chasm* beachhead logic (already applied in `02-competition-positioning.md` §2 Step 5: **first-time-suspended, sub-$2M-revenue 3P sellers**), v1 serves exactly one persona doing exactly one thing.

### 2.1 The one journey

```
Paste notice  →  Classify  →  Retrieve  →  Draft  →  Critique  →  PREVIEW (free)  →  Pay  →  Full POA (copy + PDF)
                                                                         ↓
                                                          "This case needs a human" → rush tier form → Stripe → human queue
```

### 2.2 Build list (v1)

| # | Component | Why it's in scope | Literature anchor |
|---|---|---|---|
| B1 | **Single-page web app.** One textarea ("paste your deactivation notice"), one button. No signup, no dashboard, no navigation. Email captured only at payment (or for the free draft, one field). | The buyer is mid-panic and single-session. Every field added is a conversion tax. | YC "launch fast"; Ries MVP minimality |
| B2 | **Reason-code classifier** (routing). Maps the pasted notice to one of ~20–30 codes (Section 3 / inauthentic / IP complaint / safety / restricted product / ODR / late shipment / linked account / dropship policy / review manipulation / verification, plus Walmart's performance-standard equivalents). Emits a confidence and an explicit `UNCLASSIFIED` path. | The reason code determines the entire document structure. Getting it wrong is worse than doing nothing. | Anthropic *Building Effective Agents* — **Routing** pattern ("classifies inputs and directs them to specialized followup tasks") |
| B3 | **Retrieval over a curated corpus** of policy summaries + reason-code records + winning-appeal structural patterns. | This is the differentiator (A4). Lewis et al. show retrieval-augmented models "generate more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline" — factuality is precisely the axis we are selling. | [Lewis et al. 2020, NeurIPS](https://arxiv.org/abs/2005.11401) |
| B4 | **Grounded clause citation via the Citations API.** Documents passed with `citations: {enabled: true}`; the model returns `cited_text` with character/page/block locations. **Hard rule: the UI renders a policy reference only if it originated in a citation object.** | Turns "AI-powered" (a claim every competitor makes) into a *verifiable* claim. Directly implements Dunford Step 8 from `02` §2. | [Anthropic Citations](https://platform.claude.com/docs/en/build-with-claude/citations) |
| B5 | **Draft generator** producing the three-part POA structure (root cause / immediate corrective actions / preventive measures) specialized per reason code. | Category-standard structure; Walmart requires a "written business plan of action describing the violation and the steps you plan to take to correct the issue." | Walmart Marketplace Learn (fetched); Anthropic — **Prompt chaining** |
| B6 | **Readiness critique pass** — a second model call scoring the draft against a per-reason-code rubric and naming concrete deficiencies ("no supplier invoices referenced," "no measurable preventive control," "apologetic tone / blames Amazon"). Shown **free, pre-paywall**. | This is the visible proof of quality that makes A4 testable, and it is the part a generic ChatGPT prompt does not produce. | Anthropic — **Evaluator-optimizer** ("one LLM generates responses while another provides iterative feedback") |
| B7 | **Preview paywall + Stripe Checkout.** Free: reason code, cited clauses, readiness score with named gaps, first section of the draft. Paid: full document, editable, copy-to-clipboard, branded PDF. | The experiment design for A4 (§1). Also the fastest possible path to revenue. | Ries — build–measure–learn; Ramanujam *Monetizing Innovation* (price attached to the value moment) |
| B8 | **Rush human-review tier** — a priced option ($299–499), a form, Stripe, and an internal queue. Fulfilment is a human editing the same draft in the same tool. **No automation.** | Ries's *concierge MVP* / *Wizard of Oz MVP*: deliver the service by hand to learn what the software must eventually do. Graham's "do things that don't scale." This is also the differentiator vs. AppealDesk, which triages hard cases *away* (`02` §1.1). | Ries; Graham |
| B9 | **Consent-gated outcome capture** — checkbox at payment ("let us follow up to learn how it went, in exchange for a credit"), plus automated day-3 / day-10 / day-21 emails with a one-click outcome form. | The only path to A7 and the only path to the Process Power moat identified in `02` §3. Must be built on day 1 or the data is lost forever. | Helmer *7 Powers* (Process Power); Karpathy *Software 2.0* — the dataset is the artifact |
| B10 | **Eval harness + golden set** (~40 hand-labelled notices) run in CI. | Anthropic's tool/agent guidance is emphatic that evals are the mechanism of improvement, not an afterthought. Without this, every prompt change is a coin flip. | [Anthropic — Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) ("Run evaluations programmatically… iteratively improve") |
| B11 | **Disclaimers + refusal path.** "Not legal advice." No reinstatement guarantee. IP/counterfeit/legal-threat cases routed to the human tier or to outside counsel. | Every incumbent disclaims this (`01` §2.3: PlatformAppeal "explicitly does NOT guarantee reinstatement"). See UPL risk, §5.4. | Category norm + risk control |

### 2.3 Recommended v1 pricing (carrying `03`'s workstream, not overriding it)

Ramanujam's *Monetizing Innovation* insists price is designed before the product, from observed willingness-to-pay. The ladder is already observed, not surveyed (`01` §2.3): $49 → $97 → $149 → $350 → $495 → $1,495 → $2,495 → $997–2,500/mo.

**Hypothesis (not sourced to a study, flagged as such):** price the self-serve tier at **$129–149**, deliberately *above* AppealDesk's $97 rather than below it, because a lower price undercuts the very quality claim being tested in A4 and because a panicking seller losing $800/day (`01` §3) is not price-shopping a $50 delta. Pricing below the incumbent would confound the experiment: we would not know whether conversion came from the differentiator or the discount. The rush tier stays at **$299–499**.

---

## 3. v1 scope — exactly what NOT to build

This section is the more valuable half. Each exclusion is justified, not merely asserted.

| # | Do NOT build | Reason | Evidence |
|---|---|---|---|
| N1 | **SP-API integration / automated account monitoring** | Requires a *public* app: Appstore listing, Solution Provider Agreement, Acceptable Use Policy and Data Protection Policy review, a security-controls questionnaire completed by the tech team, and per-role approval. Weeks of compliance, zero learning about A4. | [SP-API developer registration](https://developer-docs.amazon/sp-api/docs/registering-as-a-developer); [SP-API roles](https://developer-docs.amazon/sp-api/docs/roles-in-the-selling-partner-api) |
| N2 | **Any handling of seller credentials, cookies or sessions** | Largest legal + trust risk; contributes nothing to A4. A competitor already markets its absence. | [appealdraft.org](https://www.appealdraft.org/) |
| N3 | **Automated appeal submission** | No API exists. Amazon appeals are submitted by hand in the Account Health dashboard; Walmart's is a Seller Center Help ticket. Automating it would require N2. | [Walmart Marketplace Learn](https://marketplacelearn.walmart.com/guides/Seller%20Account%20Management/Appeal-an-account-suspension) ("Submit Appeal: Contact support via the Help button in Seller Center") |
| N4 | **User accounts, auth, password reset, dashboards** | Single-session panic purchase. A magic-link retrieval URL emailed at payment covers 100% of the real need. | Ries MVP minimality |
| N5 | **A vector database** | The v1 corpus is a few hundred curated records. Prompt caching makes the whole corpus cheap to hold in context: cache reads cost **0.1x** base input, with a 1-hour TTL available at 2x write. For Opus 5 that is $0.50/MTok read vs $5/MTok base. A pgvector table (or nothing at all) beats standing up Pinecone/Weaviate. Add hybrid retrieval only when the corpus outgrows the context budget. | [Anthropic prompt caching](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) |
| N6 | **Fine-tuning or any model training** | Karpathy's *Software 2.0* point is that the **dataset** is the artifact — but it does not follow that the dataset must be compiled into weights. At this corpus size, retrieval + prompting dominates training on every axis (iteration speed, cost, auditability, and the ability to cite). Revisit only if the consented-outcome corpus reaches tens of thousands of labelled triples. | [Karpathy, *Software 2.0*](https://karpathy.medium.com/software-2-0-a64152b37c35) |
| N7 | **An autonomous agent loop** | "Agentic systems… trad[e] latency and cost for better task performance" — a trade worth making "only when simpler approaches fail." Ours is a fixed four-stage pipeline. | [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) |
| N8 | **eBay, Etsy, TikTok Shop, KDP, Brand Registry** | Moore's beachhead discipline. Amazon Section-3-class deactivations only; Walmart follows in v1.1 because its guide is short, public and already fetched. | Moore, *Crossing the Chasm*; `02` §2 Step 5 |
| N9 | **ASIN/listing-level appeals** | Different document, different taxonomy, lower urgency, lower willingness-to-pay. Account-level deactivation is where the $800/day clock runs. | `01` §3 |
| N10 | **Any reinstatement-rate or success-rate marketing claim** | Competitors publish 85–93% figures that `01` §6 correctly labels unaudited and self-serving. Publishing an unmeasured rate is an advertising-substantiation exposure and poisons the trust position we are selling. Publish only what B9 measures, with the n. | `01` §6.2 |
| N11 | **Automated scraping of anything behind the Seller Central login** | See §4.4. Legally the sharpest edge in the whole plan. | Van Buren; hiQ final judgment |
| N12 | **Ingesting competitors' generated drafts as corpus** | Building a competing product on a competitor's copyrighted output is the exact fact pattern that lost on fair use in Thomson Reuters v. Ross. *(Recalled, not verified in-session — verify with counsel.)* | §4.4 |
| N13 | **Mobile app, i18n, SOC 2, multi-tenant admin** | None test A4. | — |
| N14 | **Building monitoring UI before selling monitoring** | Sell the $39–79/mo plan as an email-forwarding + manual-review service to the first 20 buyers. If nobody buys it manually, the automated version was never worth N1's compliance cost. | Ries — concierge MVP |

---

## 4. Knowledge-base acquisition plan

### 4.1 What the corpus actually needs to contain

Karpathy's framing is the right one to adopt explicitly: in *Software 2.0*, "the dataset that defines the desirable behavior" becomes the primary artifact, and he asks who will build the tooling for "accumulating, visualizing, cleaning, labeling, and sourcing datasets." Applied here, the corpus — not the prompt, not the model — is the product. It has four layers, and they are **not equally hard to acquire**:

| Layer | Content | Volume for v1 | Acquisition difficulty |
|---|---|---|---|
| **L1 — Reason-code taxonomy** | ~20–30 codes: canonical name, notice trigger phrases, required evidence, typical failure modes | 20–30 records | **Easy** — hand-authored from public sources |
| **L2 — Policy summaries** | Our own structured summary of each governing policy + a pointer (URL/clause id) | 30–60 records | **Medium** — authoritative text is login-gated (§4.3) |
| **L3 — Structural appeal patterns** | Per code: what a strong root-cause / corrective / preventive section contains; anti-patterns | 20–30 records | **Medium** — synthesized from public guidance + expert review |
| **L4 — Outcome corpus** | Consented, redacted (notice → draft → reported outcome) triples | 0 at launch | **Hard, and the only real moat** — accrues from B9 |

L1–L3 are hand-buildable in a day by agents. **L4 is the asset**; `02` §3 is correct that the "cornered resource" claim is a hypothesis rather than a held power, and that Process Power via a fast outcome loop is the realistic path. L4 is why B9 is non-negotiable on day 1.

### 4.2 Source-by-source feasibility (all verified this session unless noted)

| Source | Public? | Robots? | Fetch feasibility | Verdict |
|---|---|---|---|---|
| **Walmart Marketplace Learn** — appeal + suspension guides | **Yes, no login** | Not checked — check before crawling | **Confirmed fetchable**; clean prose, small page count | **USE.** Highest-quality/lowest-risk source in the plan |
| **Amazon Seller Forums** (`sellercentral.amazon.com/seller-forums/`) | **Yes, no login** | **Explicitly allowed** — see §4.3 | **Confirmed fetchable**, server-rendered HTML, stable thread URLs `/seller-forums/discussions/t/{uuid}`; has a dedicated **Account Health** category covering "Suspended & Deactivated Accounts" | **USE, with rate limiting.** Best source for real notice phrasings and reason-code discovery |
| **Amazon SP-API developer docs** | Yes | Public docs site | Confirmed fetchable | **USE** (for Phase-2 monitoring design, not for L1–L3) |
| **Amazon Seller Central help/policy pages** (e.g. `/help/hub/reference/external/G200414310`) | **No — login-gated** | — | Fetch returned a marketing landing page, not policy text; `amazon.com` help returned **503** to an automated client | **DO NOT AUTOMATE.** See §4.3–4.4 |
| **Consultant/law-firm policy explainers** (Riverbend, ecommercechris, Amazon Sellers Lawyer, template libraries) | Yes | Varies | Fetchable | **Use for taxonomy discovery only.** Read to learn *what codes exist*; author our own text. Do not copy (§4.4) |
| **Competitor product outputs** (AppealDesk, AppealAI, AppealDraft drafts) | Paid | — | — | **DO NOT INGEST** (N12) |

### 4.3 The robots.txt finding (verified, and it is favourable)

`https://sellercentral.amazon.com/robots.txt` was fetched directly. Its structure is a broad `Disallow: /` with a permissive allowlist, and that allowlist **explicitly includes `/forums/` and `/seller-forums`**. The relevant disallows are narrow:

```
Disallow: /
Disallow: /forums/search.jspa
Disallow: /forums/search
Disallow: /spec/api
Noindex: /communities
Allow: ... /forums/ ... /seller-forums ...
```

**Operational rules that follow directly:**
- Crawl category and discussion pages under `/seller-forums/`. **Never** touch `/forums/search` or `/forums/search.jspa` — these are explicitly disallowed, and per the Van Buren "gates-up-or-down" logic (§4.4) an explicit machine-readable prohibition is exactly the kind of gate that matters.
- Discover threads by paginating category listings, not by querying search.
- Identify the crawler honestly in the User-Agent with a contact URL; rate-limit conservatively (≤1 req/sec, backoff on 429/503).
- Re-fetch robots.txt before each crawl run and abort on change. This should be a hard-coded pre-flight check in the crawler, not a manual step.

By contrast, the **authoritative policy text is not in the open**: `sellercentral.amazon.com/help/hub/reference/external/G200414310` resolved to a public marketing shell with no Code of Conduct content, and `amazon.com/gp/help/...` returned 503 to an automated fetch. This is the single most important corpus finding: **the highest-authority text is the least legally acquirable.** L2 is therefore built by a **human with a legitimate Professional seller account reading the pages and writing our own structured summaries**, never by an automated collector behind login.

### 4.4 Legality — the actual doctrine, applied

**(a) CFAA exposure on public forum crawling: low.** *Van Buren v. United States* (2021) held 6–3 that a person "exceeds authorized access" only by obtaining information "specifically off-limits" on a system they may otherwise use — the gates-up-or-down rule. Justice Barrett's majority reasoned that the government's broader reading would make "millions of otherwise law-abiding citizens… criminals." Using access for an improper *purpose* is not a CFAA violation. ([Van Buren v. United States](https://en.wikipedia.org/wiki/Van_Buren_v._United_States)) *hiQ Labs v. LinkedIn* applied the same logic to scraping: the Ninth Circuit affirmed that LinkedIn could not use the CFAA to block hiQ from **publicly available** profile data, even after a cease-and-desist. ([hiQ Labs v. LinkedIn](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn))

**(b) But contract exposure is real, and that is the lesson of hiQ's ending.** In **November 2022** the N.D. Cal. held that **hiQ had breached LinkedIn's User Agreement**, and the case settled. hiQ won the CFAA question and still lost. The doctrinal takeaway for us: *"not a federal crime" is not the same as "not actionable."* Therefore:
- **Public, robots-allowed, logged-out crawling of the Seller Forums** — acceptable risk, because the strongest signal available (robots.txt) affirmatively permits it and no acceptance of a browsewrap has occurred through login.
- **Anything behind the Seller Central login** — unacceptable for automation, because a seller account holder has *affirmatively accepted* the Business Solutions Agreement, converting a scraping question into a straightforward breach-of-contract question with a named counterparty who can also terminate the account. This is N11, and it should be treated as a bright line, not a risk to be managed.
- *(Recalled, not verified in-session:* Meta v. Bright Data (N.D. Cal., 2024) is generally read as holding that scraping public data **while logged out** does not breach ToS accepted by a logged-in user — which, if accurate, maps precisely onto the logged-out/logged-in line drawn above. **Verify before relying.**)

**(c) Copyright, and why we paraphrase.** Amazon's and Walmart's policy texts are copyrighted works. The relevant caution is *Thomson Reuters v. Ross Intelligence* — *(recalled, not verified in-session; D. Del., Feb 2025)* — in which the court rejected fair use where a startup used a competitor's copyrighted legal-research material to build a **competing product**, with the market-effect factor weighing heavily against the defendant. The exposure is at its worst exactly where our incentives point: bulk-reproducing a platform's policy corpus to sell a policy-interpretation product. **Mitigations, all cheap:**
- Store **our own structured summaries** keyed to a canonical clause identifier + source URL, not wholesale reproductions.
- Where verbatim text is genuinely necessary, keep excerpts short and quote them as excerpts.
- Because the Citations API cites from *the documents we supply*, and our supplied documents are our own text, the user-facing `cited_text` is our prose plus a pointer to the authoritative source — which is both lower-risk and, usefully, better UX than dumping platform boilerplate.
- Forum posts are authored by sellers, not Amazon. Use them to learn **notice phrasings and taxonomy**; do not republish post text.

**(d) PII and the outcome corpus (L4).** A pasted deactivation notice routinely contains merchant tokens, case IDs, legal names, addresses and ASINs. Before any notice enters L4:
- explicit opt-in consent at payment (B9), separable from the purchase;
- automated redaction pass, then a human spot-check on the first ~100;
- retention limits and deletion-on-request from day one (GDPR/CCPA baseline).
This also keeps the door open to N1 later: SP-API's Data Protection Policy and restricted-role review will ask these questions, and having answers already implemented converts a blocker into a form.

**(e) Two unverified claims to resolve before launch.**
1. AppealDraft advertises compliance with **"Amazon's March 2026 Agent Policy"** with no citation or link ([appealdraft.org](https://www.appealdraft.org/)). If such a policy exists, it plausibly governs exactly this product category. **Action: locate the primary source before launch.** Treat the vendor's assertion as marketing, per Fitzpatrick's Mom Test discount on self-serving claims.
2. **Seller Forums participation guidelines almost certainly restrict solicitation.** The entire Bullseye community channel in `02` §2 Step 10 depends on posting free drafts into "just got suspended" threads. If that violates forum rules, the primary GTM channel evaporates and accounts get banned. **This must be verified before the channel test in §7, Day 5** — it is a GTM-blocking dependency that sits inside the build plan.

---

## 5. Technical risks (ranked by expected damage)

**5.1 Misclassification → confidently wrong document.** The highest-damage failure. A notice about an inauthentic-goods complaint answered with an ODR-metrics POA is worse than no product: it burns the seller's appeal attempt. *Mitigation:* routing with an explicit confidence threshold and a first-class `UNCLASSIFIED` outcome that converts to the human tier (B8) rather than guessing. This is the Anthropic routing pattern used defensively — and note it also monetizes the case AppealDesk simply refuses (`02` §1.1), turning our worst technical failure mode into our differentiated revenue line.

**5.2 Hallucinated policy citations.** Fabricating a clause reference destroys the exact trust claim we sell. *Mitigation:* the B4 hard rule — no policy reference reaches the UI unless it arrived inside a Citations `cited_text` object with a source location. This is a code-level invariant with a test, not a prompt instruction. Lewis et al.'s core result (more factual generation from retrieval) is the reason the architecture is right; the Citations invariant is what makes it enforceable.

**5.3 Retrieval quality on a chunked corpus.** Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) documents that naive chunking destroys context, and that prepending chunk-specific context cut retrieval failure by **35%** (5.7%→3.7%) for contextual embeddings, **49%** combined with contextual BM25 (→2.9%), and **67%** with reranking added (→1.9%). *Mitigation for v1:* the corpus is small enough that the whole of L1–L3 fits in a cached prompt (N5), which sidesteps chunking entirely. Adopt contextual embeddings + BM25 + reranking at the point L4 growth makes full-context infeasible — and note the finding that "passing the top-20 chunks… is more effective than just the top-10 or top-5" when that day comes.

**5.4 Unauthorized practice of law (UPL).** *(Flagged as a hypothesis — no authority was fetched for this.)* Drafting a document that argues a party's case to a decision-maker sits near the line. The category norm cuts in our favour: Riverbend and eCommerceChris are non-lawyer consultancies doing this at scale and openly (`02` §1.2), while Amazon Sellers Lawyer is a law firm doing it as legal work. *Mitigation:* prominent "not legal advice" disclaimer; no representation of the seller; the human tier edits documents rather than advising on law; IP/counterfeit/litigation-threat cases routed out to counsel; **counsel review of the disclaimer set before launch.**

**5.5 Prompt injection via the pasted notice.** The notice is untrusted input pasted by a stranger, and it is the *entire* input surface. A crafted "notice" could attempt to extract the system prompt or the corpus. *Mitigation:* pass the notice as a `document` content block (data), never concatenated into the instruction; keep the corpus non-secret by design (it's summaries of public policy, so extraction is embarrassing rather than fatal); output-side schema validation.

**5.6 Advertising substantiation.** N10. Do not publish a success rate until B9 has produced one with a stated n and methodology.

**5.7 Platform retaliation.** Amazon can change forum rules, block the crawler, or move against third-party appeal tooling. *Mitigation:* diversify off a single channel early; keep the crawler polite and identified; keep zero credential dependency (N2) so no product function breaks if forum access ends.

**5.8 Cost per draft.** Non-risk, quantified: with prompt caching at 0.1x reads and a corpus in the low tens of thousands of tokens, marginal cost per draft is cents against a $129–149 price. Cache the corpus with the **1-hour TTL** (2x write, 0.1x reads) during traffic bursts from a forum post.

**5.9 Name collision — a blocking commercial risk, not a technical one.** `01` §6.5 found **reinstate.io** trading since 2019 and **ReinstateIQ** live. The name is baked into domain, Stripe account, repo and copy on day 1. **Resolve before Day 1** (§7.0).

---

## 6. Instrumentation and decision rules (innovation accounting)

Ries's *innovation accounting* requires committing to the metric and the decision rule **before** the experiment, so the pivot-or-persevere call is not made by post-hoc rationalization.

**Primary metric (tests A4):** `preview → paid` conversion, measured only on sessions that reached a successful classification. This isolates the value hypothesis: the seller has seen the reason code, the cited clauses and the readiness critique, and is deciding whether that was worth $129–149.

**Secondary metrics:**
- `paste → successful classification` rate (product reach: are real notices parseable?)
- classifier accuracy vs. the golden set (B10)
- rush-tier attach rate (tests A6)
- CAC and reply-rate by channel, per forum/community post (tests A5)
- median time from paste to preview (the promise is "in minutes")

**Lagging, instrumented only (A7):** self-reported submission rate and self-reported reinstatement rate at day 3/10/21, with n always reported.

**Explicitly designated vanity metrics — do not report:** drafts generated, page views, waitlist size. Ries's warning about vanity metrics applies with unusual force here because "free drafts generated" will look spectacular and mean nothing.

**Decision rules, committed in advance (thresholds are hypotheses, flagged as such — they are not drawn from a published benchmark):**
- **Persevere** if preview→paid ≥ 8% over ≥100 classified sessions.
- **Iterate** (prompt/critique/pricing) if 3–8%.
- **Pivot** if <3% — the differentiator is not perceived, and per `02` §1.1 a $97 incumbent already owns the undifferentiated position, so there is no cheaper price to retreat to that isn't someone else's ground.
- Follow with Sean Ellis's 40% "very disappointed" survey once ≥40 paying customers exist, as `01` §4 correctly identifies as the right next validation step. It cannot be run before the product exists.

---

## 7. Build plan — executable by AI agents in 5 working days

Structured as parallel tracks with named agent roles, explicit inputs/outputs, and hard gates. Anthropic's guidance to prefer simple composable workflows over autonomous agents applies to *our own build process* as much as to the product.

### 7.0 Day 0 — pre-flight gates (hours, blocking, human decision required)

| Gate | Action | Blocks |
|---|---|---|
| **G1 — Name** | Resolve the reinstate.io / ReinstateIQ collision (`01` §6.5). Pick and register a distinct name + domain. | Everything downstream |
| **G2 — Legal** | Counsel review of: disclaimer set, UPL posture (§5.4), no-guarantee language, consent text for L4 | Launch, not build |
| **G3 — Amazon "Agent Policy"** | Locate the primary source behind the AppealDraft claim (§4.4e) | Launch |
| **G4 — Forum rules** | Read the Seller Forums participation guidelines; confirm whether the Bullseye channel is permissible (§4.4e) | Day 5 channel test |
| **G5 — Accounts** | Stripe, domain, Anthropic API key, hosting, transactional email | Day 3 |

*G1–G4 are the reason this is GO_**WITH_CHANGES** rather than GO. None require more than a day, but building before G1 means rebuilding.*

### 7.1 Day 1 — corpus + scaffold (parallel)

| Track | Agent | Output |
|---|---|---|
| **A — Taxonomy** | Domain-research agent | L1: 20–30 reason codes as structured records (`code`, `aliases`, `notice_trigger_phrases`, `required_evidence[]`, `common_failure_modes[]`, `source_urls[]`). Authored from Walmart Marketplace Learn (fetched), forum threads, and public explainers — **our own prose** (§4.4c) |
| **B — Crawler** | Data-engineering agent | Polite crawler for `/seller-forums/` Account Health category: robots.txt pre-flight check with abort-on-change, ≤1 req/s, identified UA, `/forums/search*` hard-blocked in code. Persists raw HTML + extracted text + thread UUID |
| **C — Policy layer** | Research agent + human reviewer | L2/L3: policy summaries + per-code structural appeal patterns, each with a source pointer |
| **D — Scaffold** | Build agent | Repo, typed schema for the corpus, single-page app skeleton, CI |

**Day-1 gate:** corpus loads, validates against schema, and fits the context budget with caching.

### 7.2 Day 2 — the pipeline

Four stages, built and tested independently (prompt chaining, per Anthropic):

1. **Classify** — notice → `{reason_code, confidence, extracted_entities, platform}`; `UNCLASSIFIED` is a first-class output, not an error.
2. **Retrieve** — reason code + entities → corpus records; v1 = cached full corpus + code-keyed lookup (N5).
3. **Draft** — reason-code-specialized POA with `citations: {enabled: true}` on all corpus documents.
4. **Critique** — rubric scoring + named deficiencies (evaluator-optimizer); emits the free-tier payload.

**Invariant enforced in code with a test:** any policy reference lacking a backing citation object is stripped before render (§5.2).

### 7.3 Day 3 — app, payment, delivery (parallel)

| Track | Output |
|---|---|
| **E — Frontend** | Paste box → streaming preview (reason code, cited clauses, readiness score + gaps, first section) → paywall |
| **F — Payments** | Stripe Checkout; self-serve tier + rush tier; magic-link retrieval URL emailed on success |
| **G — Delivery** | Full document, inline editing, copy-to-clipboard, branded PDF |
| **H — Outcome loop (B9)** | Consent checkbox, redaction pass, day-3/10/21 email sequence, one-click outcome form, L4 write path |

### 7.4 Day 4 — evals and hardening

- **Golden set:** ~40 real notices (sourced from public forum posts, redacted) hand-labelled with reason codes. Classifier accuracy and confusion matrix in CI.
- **Draft-quality eval:** LLM-as-judge against the per-code rubric, plus human review of 10 drafts. Anthropic's guidance — run evals programmatically, then use the model to analyse results and iterate — applies directly.
- **Adversarial pass:** prompt injection via the notice field (§5.5), empty/garbage/non-English input, 50k-character paste, notices from an unsupported platform.
- **Cost/latency:** verify caching is hit; measure p50/p95 paste→preview.

### 7.5 Day 5 — launch and first turn of the loop

- Deploy; verify Stripe end-to-end with a live transaction.
- **Only if G4 cleared:** run the channel test — 20 genuinely helpful, non-spammy replies in live "just got suspended" threads (Weinberg & Mares' Bullseye community channel, `02` §2 Step 10), each offering a free draft. Log reply→visit→classify→pay per post.
- Fulfil the first rush-tier orders **by hand** (B8) and write down every edit the human makes — those edits are the Day-6+ prompt and corpus backlog. This is the concierge MVP working as intended: the human's corrections *are* the product roadmap.

### 7.6 What agents do well vs. what needs a human

| Agent-suitable (parallelizable, high volume) | Human-required (judgment, liability) |
|---|---|
| Crawling, extraction, corpus structuring | G1 name decision; G2 counsel review |
| Drafting L1–L3 records from public sources | Verifying reason-code correctness against reality |
| App scaffolding, Stripe, PDF, emails | Reading Seller Central policy pages behind login (§4.3) |
| Eval harness, golden-set scoring, adversarial tests | Labelling the golden set's ground truth |
| Copy drafting | Rush-tier fulfilment; forum posting |

---

## 8. Feasibility verdict

**GO_WITH_CHANGES.**

**Feasible in days, because of what was cut.** The two components that would normally make this a multi-week build — a platform integration and a proprietary corpus — have been descoped to a manual service and a hand-curated few-hundred-record set that fits in a cached prompt. What remains is a four-stage prompt chain, a single page, and Stripe.

**The changes required are gates, not rebuilds.** G1 (name collision with reinstate.io) must be resolved before any code, because it is baked into domain, Stripe and repo. G4 (forum solicitation rules) must be resolved before the channel test, because the entire Bullseye GTM depends on it and the failure mode is account bans. G2 and G3 are launch gates. None takes more than a day; all are cheap now and expensive later.

**The honest strategic caveat, carried from the sibling reports.** `02` §3 is right that Reinstate has **zero Helmer powers on day one**, and this MVP scope does not change that. What it does is start the only clock that matters: the consented outcome corpus (L4, via B9) is the sole component of v1 whose value compounds, and it is the difference between building a fifth me-too POA generator and building the Process Power that `02` identifies as the realistic 12–24 month moat. **If the build slips, cut anything before cutting B9.**

---

## References

**Literature and frameworks**
- Eric Ries, *The Lean Startup* — MVP definition, build–measure–learn, value/growth hypotheses, concierge & Wizard-of-Oz MVPs, innovation accounting, vanity metrics, pivot-or-persevere (§§1, 2, 6)
- Paul Graham, "Do Things That Don't Scale" / "How to Get Startup Ideas" — manual fulfilment of the rush tier (§2 B8)
- Y Combinator Startup School / Michael Seibel, "How to Plan an MVP" — launch narrow and fast (§2). *Note: the YC library page could not be fetched in-session (JS-rendered); cited from the canonical framework, not a fetched quote*
- Rob Fitzpatrick, *The Mom Test* — discounting self-serving vendor claims (§4.4e)
- Sean Ellis PMF survey (40% rule) — post-launch validation step (§6)
- Geoffrey Moore, *Crossing the Chasm* — beachhead discipline (§3 N8)
- April Dunford, *Obviously Awesome* — differentiator selection, via `02-competition-positioning.md`
- Hamilton Helmer, *7 Powers* — Process Power as the moat candidate; corpus as hypothesis not asset (§4.1, §8)
- Madhavan Ramanujam, *Monetizing Innovation* — willingness-to-pay-first pricing (§2.3)
- Gabriel Weinberg & Justin Mares, *Traction* — Bullseye community channel (§7.5)
- Marc Andreessen, "The Only Thing That Matters" — market-pull test, via `01-demand-pmf.md`

**AI/knowledge engineering (all fetched)**
- Lewis et al. 2020, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS — https://arxiv.org/abs/2005.11401
- Andrej Karpathy, "Software 2.0" — https://karpathy.medium.com/software-2-0-a64152b37c35
- Anthropic, "Building Effective Agents" — https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, "Writing Tools for Agents" — https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic, "Introducing Contextual Retrieval" — https://www.anthropic.com/news/contextual-retrieval
- Anthropic, Citations documentation — https://platform.claude.com/docs/en/build-with-claude/citations
- Anthropic, Prompt caching documentation — https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching

**Platform and technical sources (all fetched)**
- Amazon SP-API, Notification Type Values (`ACCOUNT_STATUS_CHANGED`: NORMAL / AT_RISK / DEACTIVATED) — https://developer-docs.amazon/sp-api/docs/notification-type-values
- Amazon SP-API, Registering as a developer — https://developer-docs.amazon/sp-api/docs/registering-as-a-developer
- Amazon SP-API, Roles in the Selling Partner API — https://developer-docs.amazon/sp-api/docs/roles-in-the-selling-partner-api
- Amazon Seller Central robots.txt (allows `/seller-forums`, disallows `/forums/search*`) — https://sellercentral.amazon.com/robots.txt
- Amazon Seller Forums (public, server-rendered, Account Health category) — https://sellercentral.amazon.com/seller-forums/
- Walmart Marketplace Learn, "Appeal an account suspension" — https://marketplacelearn.walmart.com/guides/Seller%20Account%20Management/Appeal-an-account-suspension
- Walmart Developer Portal (US Marketplace API families; no account-status/notification API surfaced) — https://developer.walmart.com/home/us-mp/
- AppealDraft ($149; unverified "Amazon March 2026 Agent Policy" claim; "We never log into your account") — https://www.appealdraft.org/
- Riverbend Consulting (400+ appeals/month; 10,000+ sellers; PRO and GUARDIAN plans) — https://riverbendconsulting.com/

**Case law**
- Van Buren v. United States, 593 U.S. ___ (2021) — CFAA "exceeds authorized access," gates-up-or-down — https://en.wikipedia.org/wiki/Van_Buren_v._United_States *(fetched)*
- hiQ Labs v. LinkedIn (9th Cir.; N.D. Cal. Nov 2022 breach-of-User-Agreement ruling, then settlement) — https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn *(fetched)*
- Thomson Reuters v. Ross Intelligence (D. Del., Feb 2025) — fair use rejected for competing-product training — **recalled, NOT verified in-session; verify with counsel before relying**
- Meta v. Bright Data (N.D. Cal., 2024) — logged-out scraping and ToS — **recalled, NOT verified in-session; verify with counsel before relying**

**Sibling deliverables treated as inputs**
- `/home/user/Octopus/phase-1-ideation/research/01-demand-pmf.md`
- `/home/user/Octopus/phase-1-ideation/research/02-competition-positioning.md`
