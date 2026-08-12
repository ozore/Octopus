# Phase 1 — Vote results (Borda count, 12 literature-anchored judges)

**Winner: Reinstate** — Paste your Amazon or Walmart suspension notice and get a submission-ready Plan of Action in minutes, drafted from the policies and appeal patterns that actually get sellers reinstated.

| Rank | Idea | Points |
|---|---|---|
| 1 | Reinstate | 71 |
| 2 | DutyLens | 66 |
| 3 | WageLens | 65 |
| 4 | Certly | 64 |
| 5 | ScopeIQ | 48 |
| 6 | StayLegal | 42 |
| 7 | StateReady | 40 |
| 8 | Recoup | 36 |

## Judge rationales

### Lens: pmf-evidence
Ranking: Reinstate > Certly > ScopeIQ > StateReady > WageLens > DutyLens > Recoup > StayLegal

Applying Mom Test's standard (real money/behavior beats stated interest), Ellis's 40% benchmark (proxy: is there quantified, durable demand for the category), and Andreessen's "market pull" test: Reinstate ranks #1 — Riverbend's 400+/mo appeals at $1,000+, 10,000 sellers served, plus daily visible forum urgency is the clearest "money changing hands for a worse (slow, expensive, manual) solution" evidence. Certly is #2 — TrustLayer/myCOI's 16-year, 45M-document scale proves durable category monetization even if self-serve pricing is unproven. ScopeIQ #3 — AmSpa's 3,000+ dues-paying members plus named $3,500-10,000 attorney fees is concrete quantified spend on inferior/partial solutions. StateReady #4 — a named direct competitor (LicensedTrades.com) with real tiered pricing. WageLens #5 — real competitor pricing but quote-gated (harder to verify actual transactions). DutyLens #6 — a live paid Shopify app plus a large penalty (pain, not spend). Recoup #7 — industry stats/contingency norms without named paying-customer evidence. StayLegal is last — its own summary admits existing tools "only inform," and its cited comparable (MyLodgeTax) sells tax filing, not the permit-filing job itself, so worse-solution payment for the actual JTBD is unverified.

### Lens: speed-to-revenue
Ranking: Reinstate > StayLegal > DutyLens > WageLens > Certly > ScopeIQ > StateReady > Recoup

Ranked by how cheaply a concierge/Wizard-of-Oz MVP (Ries) can be hand-delivered and paid within 30 days, and by YC's "make something people want" signal (visible, daily organic demand) plus "do things that don't scale" fulfillment. Reinstate wins: suspended sellers post live urgent demand in Seller Central forums daily (strongest want-signal), a founder can manually draft a Plan of Action from public policy text with zero build, cash lands same-day. StayLegal is next: filing one city permit by hand is pure clerical do-things-that-don't-scale, low price removes approval friction, Reddit/FB communities give instant reach. DutyLens has acute, dated urgency (de minimis end, real CBP fines) and a concierge-audit wedge, but the $1,500 ticket and classification expertise raise trust friction. WageLens/Certly are tractable manual lookups but B2B outbound slows closes. ScopeIQ/StateReady need specialized multi-state legal research, slowing a credible manual MVP. Recoup ranks last: contingency pricing means signing isn't "paying" — cash depends on landlord repayment, likely exceeding 30 days regardless of sales speed.

### Lens: simplicity
Ranking: Reinstate > StayLegal > DutyLens > WageLens > Certly > StateReady > Recoup > ScopeIQ

Judged by Christensen's JTBD (one circumstance, one job the buyer "hires" the product for) and Moore's single-beachhead discipline. Reinstate wins: one buyer (a just-suspended seller), one trigger, one job ("get me reinstated"), no bundling. StayLegal is nearly as clean: one host, one continuous job (get and keep a permit). DutyLens bundles three outputs (classify, cost, alert) but they all serve one unified job and one buyer (importers), so it beats WageLens and Certly, which each serve two distinct buyer tiers (sub/GC; PM/GC) even though their steps are sequential. StateReady bundles two genuinely different jobs — defensive renewal-tracking vs. proactive expansion-planning — a JTBD violation, not just a workflow. Recoup's one-liner is simple but deliberately abstract ("counterparties' bills") and the summary telegraphs expansion beyond its named CAM beachhead into three unrelated verticals, undercutting Moore's discipline. ScopeIQ ranks last: two buyer personas (owner vs. injector) and three unrelated legal domains (clinical scope, supervision, corporate ownership) bundled into one job.

### Lens: ai-buildability
Ranking: DutyLens > WageLens > ScopeIQ > Reinstate > Certly > Recoup > StateReady > StayLegal

Per Lewis et al. 2020 RAG, the cleanest builds retrieve over a single large, public, machine-readable corpus to ground generation: DutyLens (220k CBP CROSS rulings, HTS schedule, Federal Register — all public/structured, no integrations beyond CSV upload) is the textbook fit. WageLens is even more mechanical — structured SAM.gov wage-determination lookup plus WH-347 form-fill, low hallucination surface, classic Software 2.0 deterministic-pipeline-plus-LLM (Karpathy). ScopeIQ is RAG-shaped but spans 50 heterogeneous state legal corpora, raising synthesis/accuracy burden. Reinstate's policy RAG is solid but its "winning appeal patterns" corpus is proprietary, not scrapeable. Certly and Recoup are LLM-OS-style document-extraction agents (Karpathy: LLM as orchestrator over tools/OCR); Certly's ACORD 25 is semi-standardized, Recoup's CAM statements/leases are not. StateReady demands 50-state scraper infrastructure with ongoing maintenance — heavy data engineering, not core LLM work. StayLegal requires actually filing through 100+ disparate municipal portals (RPA, notarization, inspections) — a heavy real-world integration no RAG or LLM-OS framing resolves, the clear worst fit.

### Lens: willingness-to-pay
Ranking: Reinstate > Recoup > DutyLens > ScopeIQ > WageLens > Certly > StateReady > StayLegal

Applying Ramanujam's WTP-first test (real money already changing hands beats stated interest) and Hormozi's value equation (dream outcome × likelihood ÷ time×effort, with risk reversal lowering the price barrier): Reinstate ranks #1 — Riverbend's proven $1,000+/appeal spend plus zero-income urgency maximizes dream outcome and minimizes time delay. Recoup is #2 — its contingency pricing is the purest Hormozi risk-reversal, eliminating budget-approval friction entirely. DutyLens (#3) and ScopeIQ (#4) both show revealed high-dollar WTP (CERATIZIT's $54.4M fraud settlement; attorneys charging $3,500–10,000/question) with strong forcing functions. WageLens (#5) has direct competitor pricing comps ($175–2,000/mo) validating the ladder. Certly (#6) proves the category is funded (TrustLayer/myCOI) but incumbents' enterprise/demo-gating leaves self-serve conversion less validated. StateReady (#7) is preventive rather than urgent, narrowing true credit-card buyers. StayLegal (#8) has the thinnest price ceiling ($19–29/mo) and a more consumer-like buyer, weakest fit for "price supports a real business."

### Lens: moat
Ranking: Recoup > Reinstate > ScopeIQ > StateReady > WageLens > DutyLens > Certly > StayLegal

Using 7 Powers and Zero to One's proprietary-tech test: Recoup and Reinstate build genuinely private, compounding datasets (landlord overbilling patterns; winning appeal outcomes) that no public source contains—closest to Helmer's Network/Scale Economies, clearing Thiel's "hard to replicate" bar. ScopeIQ and StateReady scrape public 50-state regulatory data into structured, continuously-updated databases (Process Power)—real but replicable by a well-funded competitor given enough engineering time, since the underlying facts aren't proprietary. WageLens and DutyLens sit lower: their source data (SAM.gov, CBP CROSS/HTS) is public and evidence shows incumbents already monetize similar structured versions, weakening the "not a thin wrapper" claim per Thiel. Certly's extraction-improves-with-volume mechanism is sound (Process Power/learning curve) but the entrant starts at zero against TrustLayer/myCOI's 16 years and 45M+ documents—the power belongs to incumbents, not this idea. StayLegal is weakest: mostly a filing service atop public municipal ordinances against established players (Avalara, Granicus), with no real accumulating data barrier—closest to a thin wrapper.

### Lens: distribution
Ranking: Reinstate > StayLegal > DutyLens > ScopeIQ > WageLens > StateReady > Certly > Recoup

Using Bullseye (identify/test/focus a channel) and Hormozi's Core Four (warm/cold outreach, free/paid content): Reinstate wins — Seller Central forums are a live, self-identifying "Dream 100" list where free-content replies convert urgent buyers same-day (Core Four's warm content + cold outreach fused). StayLegal and DutyLens both name large existing communities (r/AirBnBHosts, BiggerPockets; Shopify App Store, FBA groups) plus SEO-able trigger events, satisfying Bullseye's "test cheap channels fast." ScopeIQ has AmSpa's paying 3,000-member association as a ready channel. WageLens and StateReady have real but narrower channels — SAM.gov gives a precise cold-outreach list (Core Four) but no named community/SEO hook; StateReady's buyer (PE roll-ups) is thin for community/SEO. Certly names no channel at all beyond a generic "free audit," failing Bullseye's brainstorm step. Recoup has no stated community, SEO angle, or outreach list — weakest fit to either framework.

### Lens: competition-gap
Ranking: Certly > WageLens > Reinstate > DutyLens > ScopeIQ > StayLegal > StateReady > Recoup

Using Christensen's low-end disruption test (incumbent present but overshooting, ignoring an overserved-by-features/underserved-by-price segment) plus Dunford's competitive-alternatives test (what would the customer do instead, and how painful is that): Certly ranks #1 — TrustLayer/myCOI are explicitly enterprise, demo-gated, textbook low-end disruption target. WageLens is #2 — incumbents are named, quote-gated $175-2k/mo, positioned against directly per Dunford. Reinstate #3 — incumbent Riverbend is expensive high-touch human consulting, classic "simpler/cheaper" disruption. DutyLens #4 — real regulatory-shock gap but a direct Shopify competitor (hclassify) already exists. ScopeIQ #5 — no software incumbent, but alternative is expensive lawyers (strong Dunford pain, weaker Christensen fit since no incumbent to disrupt). StayLegal #6 — informational tools already circle the space. StateReady #7 — LicensedTrades.com already serves this exact niche at similar price. Recoup #8 — contingency audit firms (CAM, insurance, PBM, demurrage) are a mature, already-crowded incumbent category, weakest gap.

### Lens: churn-retention
Ranking: WageLens > Certly > DutyLens > StateReady > ScopeIQ > StayLegal > Recoup > Reinstate

Using Vohra's Superhuman PMF engine (would users be "very disappointed" losing it weekly?) and OpenView/Poyar's finding that usage frequency and embedded workflows drive NRR: WageLens wins — WH-347 filing is a legally forced weekly ritual, the highest habit frequency here. Certly ranks 2nd on Poyar's PLG-retention logic plus proven analog evidence (myCOI/TrustLayer's 16-year retained base) and staggered multi-vendor COI expirations creating continuous touchpoints. DutyLens follows: frequent tariff-action alerts and new-SKU classification sustain engagement. StateReady and ScopeIQ are "vitamin" monitoring plays — periodic renewals/state-entry events, passive alert-driven, thinner Superhuman disappointment score. StayLegal's core job (file the permit) is one-off; its $19-29/mo monitoring is a bolt-on with weak usage frequency. Recoup fails the "subscription durability" test outright — contingency-fee revenue, not recurring SaaS. Reinstate is the archetypal one-off JTBD (get reinstated, cancel) despite a monitoring add-on — worst retention fit.

### Lens: market-size
Ranking: DutyLens > Certly > Recoup > Reinstate > WageLens > ScopeIQ > StateReady > StayLegal

Applying Moore's beachhead sizing (a well-bounded segment big enough to matter, expandable via bowling-pin adjacencies) and Graham's well metaphor (deep narrow demand beats shallow broad demand): DutyLens tops the list — a huge, freshly-created population (all sub-$50M US importers post-de-minimis) with acute pain and a clean price ladder, expandable to more compliance SKUs. Certly and Recoup follow: large proven categories (myCOI/TrustLayer; CAM audit norms) with either broad customer counts (Certly) or uncapped contingency deal sizes plus explicit sideways-well expansion into insurance/PBM/freight (Recoup). Reinstate has strong proof-of-spend (Riverbend) but is transactional/crisis-driven. WageLens, ScopeIQ, and StateReady are genuine Graham wells — real, government/regulation-anchored niches — but each is a narrower population, ranked by evidence strength and price ceiling. StayLegal ranks last: its low per-unit price ($19-29/mo) forces reliance on mega-market volume to hit meaningful revenue, violating this lens even though the raw host population is largest.

### Lens: monetization-clarity
Ranking: Certly > StayLegal > WageLens > DutyLens > ScopeIQ > StateReady > Reinstate > Recoup

Applying Monetizing Innovation's rule that price must track a value metric scaling with delivered value, plus OpenView's PLG research favoring transparent, self-serve tiered pricing pages over quote-gated sales: Certly ranks #1 — explicitly cites Poyar/OpenView PLG, self-serve $99-299/mo tiered by certificates tracked (a clean scaling value metric) against demo-gated incumbents. StayLegal is #2 — per-property unit pricing plus monitoring fee, transparently benchmarked against Avalara. WageLens #3 — two flat, transparently published tiers explicitly undercutting competitors' opaque quote-gated pricing. DutyLens #4 and ScopeIQ #5 both use an audit-to-subscription ladder but leave the monitoring tier's value metric (SKU count/state count) implicit. StateReady #6 has a workable free-to-subscription-to-upsell ladder but a wide, unexplained $149-599/mo band. Reinstate #7 has two price points with no clear value-metric differentiator between them. Recoup ranks last: pure 30-50% contingency has no stated tiers, schedule, or good-better-best structure — the actual rate isn't knowable until deal-specific negotiation, violating "obvious... from day one" even though it satisfies willingness-to-pay.

### Lens: execution-risk
Ranking: Certly > WageLens > StateReady > Reinstate > DutyLens > StayLegal > Recoup > ScopeIQ

Applying Blank's product-risk (can you reliably build/deliver the promised output) and Lean Startup's riskiest-assumption test to each idea's core leap-of-faith: Certly ranks best — ACORD 25 is a standardized form, TrustLayer/myCOI already prove extraction feasibility at scale, and it's verification, not advice, so error cost is low. WageLens follows: SAM.gov wage data is authoritative/structured, and it's lookup+autofill, not judgment. StateReady and Reinstate carry moderate data-access fragility (scraped state PDFs; Amazon ToS/platform dependency) but limited direct liability. DutyLens and StayLegal cross into higher-stakes territory — HTS classification and "we file for you" both create real financial/legal exposure for customers if wrong, raising the quality bar sharply (DutyLens's own evidence cites a $54.4M FCA customs settlement). Recoup's adversarial, multi-domain, messy-document model compounds data and quality-bar risk. ScopeIQ is worst: quasi-legal CPOM/ownership advice across 50 states with self-described "criminal exposure" stakes is the riskiest unvalidated assumption of the set — closest to unauthorized-practice-of-law territory.


_Raw ideas: 48 from 24 personas — see raw-ideas.json, shortlist.json, votes.json._
