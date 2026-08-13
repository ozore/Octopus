# Decision Record — Wage Line

**Decision: build Wage Line.** Borda leader at 40 (next: Ship Record, 33). **No override.**

---

## The override question, answered explicitly

The rule permits overriding the Borda leader only if the autonomy-integrity judge shows the zero-human claim *breaks* on an unhappy path. It does not, and I am not overriding. Here is the reasoning in full, because the objection is real and it becomes a binding decision rather than a dismissal.

The autonomy judge ranked Wage Line 4th of 8 and named exactly one break: *"failing closed against an undocumented SAM endpoint on a Friday statutory deadline manufactures precisely the angry customer for whom it declares no support path."* That is a correct diagnosis of the pitch as written. It is not a property of the job.

The pitch's A5 says "if SAM is unreachable at generation time the report is blocked." That is the wrong thing to fail closed on, and it is an architecture choice entirely under our control. The fix, made binding in **D7**, is: **generation reads a pinned local mirror, never live SAM.** A wage determination is pinned to a project at award and does not move; the nightly crawl exists to detect that a *new revision* was published, not to supply the rate at generation time. So SAM being down at 16:00 on a Friday cannot block a filing on any already-pinned project. What it legitimately blocks is (i) first-time WD resolution for a brand-new project and (ii) the assertion *"no newer revision exists"* — and (ii) degrades in-product to a narrowed, dated claim rather than a blocked artifact. Fail-closed is retargeted from *the filing* to *the novel rate claim*. That is the same discipline the judge praised in the top three, applied at the correct boundary.

Two further points support not overriding:

1. **The same judge's own text credits Wage Line with the pool's most deterministic core** ("the arithmetic ... is plain deterministic code, never a model" — gross, fringe credit, cash-in-lieu, CWHSSA overtime, deductions) **and its most honest refusal** (declining to conclude FAR 22.404-6 effectiveness because it turns on a contracting-officer finding it cannot observe). The objection is about degradation design, not about a human being structurally required in the loop. Nothing in Wage Line's value chain is human judgement, a hand-filed form, a negotiation, or a contingency recovery.
2. **The autonomy winner is the PMF loser.** Sunset Graph is 1st on autonomy and *last* on evidence that money changes hands (HN comments against free Dependabot) and last on willingness to pay. Overriding a candidate that took first place on 3 of 6 lenses — including both money lenses — in favour of the mechanism-purity winner with no proof of purchase would be optimising the machine over the market.

---

## Why it wins, lens by lens

**PMF evidence (1st).** This is the only candidate where a named vendor cashes a named check for a worse version of the same job: LCPtracker, eBacon, Points North, eMars and Elation sell at $175–$1,200/mo with **$995–$4,995 setup fees**. Nobody pays four-figure onboarding out of curiosity. The substitute is already funded as clerical labour — a WH-347 carries ~168 discrete data points per worker, and DOL-derived estimates put manual completion above an hour per employee per report. The pull is structural, not aspirational: the filing is weekly, legally compelled on federally funded work over $2,000, and the GC's payment release is gated on it. That is Andreessen market pull in its literal form — the money does not move until the form is right.

**Willingness to pay (1st).** The budget is forced by statute, not by ambition. The downside is civil money penalties, back wages with interest, three-year debarment under 29 CFR 5.12, and False Claims Act exposure attaching to each false certification. Critically, we emit *the filed artifact* — the WH-347 PDF and the XSD-validated eCPR XML — which is what carries Hormozi's perceived-likelihood-of-achievement term. Alerting products ask the buyer to finish the job; this one finishes it. **The judge's skeptical hit is accepted and binding**: CertifiedPayrollPro already sells self-serve at $49–$249/mo plus $1–5/report with no setup fee, so *"zero setup fee is the wedge" is dead.* The wedge is relocated to the rate-of-record corner in **D3**.

**Moat and retention (1st).** Two compounding assets, of different kinds. The WD revision history is a cornered resource: SAM publishes no documented bulk download or public API — the endpoint serving sam.gov/wage-determinations is undocumented and unversioned (index name `db-prod-samdotgovsearch-wdol-dba_idxref_08112026`, observed live 2026-08-13, 4,236 active DBA determinations). You cannot retroactively buy what a WD said last March. Sitting on top is the payroll-title → SOC → WD-class → fringe-treatment crosswalk, which is **the only asset in the entire pool that compounds from customer corrections rather than from crawling**. Incumbents cannot have it because they make the contractor pick the class by hand. Retention needs no argument: a legally compelled weekly filing that gates payment is the highest-frequency habit in the shortlist, and Superhuman's 40% test is trivially passed when Friday's artifact is the thing that unlocks the draw.

**Speed to revenue (3rd).** WH-347 arithmetic and form geometry are bounded, testable, and shippable without a partner. The judge's specific flag — eCPR XSD conformance is not truly acceptance-testable without a DIR contractor account — is real and is handled by sequencing in **D3/D10**: the federal form ships as the launch artifact nationally, CA eCPR ships labelled *generated, not acceptance-tested* until gate G2 clears. California stays the launch *market* (largest public-works market, mandatory weekly XML); the federal form is the launch *deliverable*.

**Autonomy integrity (4th).** Addressed above; the single named break is closed by D7 and costs zero human minutes.

**Distribution (4th).** The free WH-347 generator has the pool's best free-tool-to-product intent match, and the county × craft long tail is programmatically generable from the mirror. The judge's fair criticism — davisbaconrates.com already sits in our own evidence list, and there is no marketplace or integration — is answered by an asset none of the other seven candidates has: **the artifact is the channel.** Every WH-347 we generate is transmitted weekly by our customer to a general contractor and often two to five other parties, footered with its WD number, revision and provenance URL. Subcontractors on federally funded work are a dense, connected, small population who all file the same form to the same handful of GCs. That is a B2B2B loop running on the deliverable itself, not on ads.

---

## Runner-up and why not

**Ship Record (33).** It has the sharpest calendar in the pool — 11 September 2026, four weeks out, 24-hour ENISA reporting for actively exploited vulnerabilities, penalties to EUR 15M or 2.5% of turnover — and a genuinely elegant insight that the 24-hour clock creates an implicit 15-month-early SBOM deadline. Three reasons it does not win:

1. **Its proven money is for the half that isn't the wedge.** FOSSA at ~$207/mo and sbomify at $159/mo prove people pay for attribution and licence work today. The CRA half is anticipated compliance — stated interest until the first enforcement action lands. That is the exact Mom Test failure mode.
2. **Its moat is not time-locked the way the pitch claims.** Per-release SBOMs and per-package LICENSE history are largely reconstructable from git tags and registry tarballs by an entrant arriving in 2028. Contrast Wage Line: SAM overwrites, and a superseded revision is gone.
3. **Demand is deadline-shaped, not habitual.** SBOM obligations are not formally enforceable until December 2027, so there is a 15-month urgency trough immediately after the September spike — precisely the window a new company has to survive. Wage Line's demand arrives every Friday forever.

Also considered and rejected: **Sunset Graph** — best autonomy story (the customer's own CI adjudicates every codemod), last on purchase evidence against free Dependabot, and its buyers are the pool's poorest. **Rate Card** — best speed-to-revenue and no LLM in the money path, but a $149 one-shot whose value self-terminates once the leak is fixed, fighting LateShipment's $0-upfront contingency; worst retention profile in the shortlist.

---

## Hard gate audit

| Gate | Verdict | Basis |
|---|---|---|
| **A1** self-serve end to end | Pass | $49 bid rate card purchasable before an account exists; five-field project setup (county, construction type, WD number or find-it-for-me, funding source); first WH-347 inside one session; Stripe Checkout, in-app upgrade/cancel |
| **A2** automated fulfilment | Pass | Deterministic arithmetic → PDF and XSD-validated XML emitted directly. No review queue, no turnaround window. Model confined to classification ranking and exception narrative |
| **A3** no human escalation | Pass | Unmapped trade → top-3 candidates with verbatim scope text, line blocked, choice memorised. Unresolvable inputs → DRAFT — NOT CERTIFIABLE, signature block withheld. FAR 22.404-6 → states rule, declines conclusion. No contact-support path in the compliance flow |
| **A4** self-maintaining data | Pass | SAM DBRA index verified live returning `revisionNumber`, `modifiedDate`, `isActive`, `constructionTypes`, county rows; 4,236 active records confirmed 2026-08-13. eCFR Parts 1/3/5 diffed weekly; CA DIR pinned to the Feb 22 / Aug 22 cycle |
| **A5** unattended operations | Pass, with D7 correction | XSD hash check fails closed; truncation watchdog on index record count; **corrected**: generation runs off the mirror so source outage never blocks a filing |
| **A6** zero human minutes | Pass | The one human-shaped question — "which class is this guy?" — is an in-product picker that answers itself permanently per account |

---

## Top 3 risks and their no-human mitigations

**R1 — The corpus depends on an undocumented endpoint that can change or block without notice.** The index name observed today (`..._idxref_08112026`) is an internal, date-stamped Elasticsearch alias; nothing about it is a contract.
*Mitigation, no human:* (a) the mirror, not SAM, is the system of record — every ingested revision retained forever, so a total loss of upstream access degrades us to "cannot detect new revisions since <date>" rather than to a dead product; (b) dual ingest — the index endpoint plus per-WD document fetch keyed on `wdNumber` — where disagreement between the two blocks promotion of the nightly snapshot instead of publishing either; (c) three independent liveness probes (record count vs. last good run, index alias string change, per-WD content hash) any of which freezes new rate assertions and raises a dated in-product banner; (d) staleness beyond the published SLA auto-credits the month through the Stripe API with no ticket.

**R2 — Squeezed from below by $49 self-serve and from above by the GC's mandated portal.** CertifiedPayrollPro occupies the cheap end; if the GC mandates LCPtracker, the sub can end up paying twice and churning.
*Mitigation, no human:* the paid boundary moves off price entirely and onto the rate-of-record certificate and the classification memory — things a form-filler cannot emit. We publish the free unlimited WH-347 generator ourselves so the commodity becomes our funnel rather than a competitor's product. And v1 must emit the portal-compatible upload file, not just the PDF, so we are positioned as the engine that feeds whatever portal the GC mandates rather than as its replacement. Portal export coverage is a measured, published number (G3-adjacent), not a promise.

**R3 — A wrong rate on a signed certified payroll is a federal false statement.** The contractor signs the compliance statement; our arithmetic is inside it.
*Mitigation, no human:* a golden-payroll canary suite re-scored after every corpus refresh and before every deploy, where any divergence blocks promotion of both the index and the build (G1). Every generated report is immutably versioned with WD number, revision, published date and corpus snapshot hash, so a dispute eighteen months later is answered from stored data rather than reconstruction. Any unresolved line withholds the signature block and watermarks the document. The in-product boundary is stated permanently: we compute and format, the contractor certifies; we do not file, and this is not legal advice. Union CBA fringe is out of scope in v1 and refused at signup rather than approximated.

---

## Binding decisions

**D1 — Buyer.** Open-shop specialty subcontractors with 5–75 field employees on federally funded (DBA/DBRA) construction. The individual is the payroll administrator, office manager or owner-operator who personally signs the WH-347 statement of compliance. Not GCs, not union shops, not agencies, not payroll bureaus. Qualifying signal: an active DBA flow-down from a prime, or a sub-award visible in SAM/USASpending.

**D2 — Job.** "Get Friday's certified payroll out the door with rates I can defend." One weekly filing per project per crew. The deliverable is the WH-347 plus statement of compliance (and CA eCPR XML where applicable). Defensibility is the specific claim that the rate on the form traces to a named WD number, revision number and publication date.

**D3 — Wedge offer.** The rate-of-record, not the form and not the price. Free tier: unlimited single WH-347 generation and county × craft rate lookup, no account required. The paid line begins the moment a rate becomes an *assertion*: pinned WD revision-of-record with per-classification diff since award, classification memory, multi-project/multi-week generation, and portal/eCPR export. **"Zero setup fee" is retired as a positioning claim** — we charge none, but it is never the reason to buy. Launch artifact is the federal WH-347, nationally, on day one; California is the launch demand market with eCPR XML shipping labelled *generated, not acceptance-tested* until G2 clears.

**D4 — Price ladder.** $49 one-time bid rate card, purchasable pre-account. $99/mo Solo (1 project, ≤15 workers). $249/mo Crew (5 projects, ≤75 workers, eCPR XML, WD-change alerts with one-click regenerate). $599/mo Multi (unlimited projects, full rate-of-record archive, portal export bundles). Value metric: active DBA projects × workers appearing on certified payroll, both metered from generated filings, so expansion happens with no salesperson. Annual billed at ten months. No seats, no setup fee, no quote, no call — ever, at any tier.

**D5 — Corpus and refresh cadence.** SAM DBRA index crawled nightly at 02:00 ET with full pagination, every revision retained permanently, per-classification diffs computed per WD; per-WD document fetch as an independent second path. CA DIR eCPR schema and the Feb 22 / Aug 22 determination cycle checked weekly and polled daily in the 14 days either side of each cycle date. eCFR 29 CFR Parts 1, 3 and 5 diffed Mondays into a versioned obligation changelog. WHD form pages and FAR Part 22.4 hash-diffed weekly to catch form revisions. Every emitted artifact footers WD number, revision, WD publication date, corpus snapshot hash and generation timestamp.

**D6 — Engine design.** Deterministic core, model strictly at the edges. All money arithmetic — hours by classification, gross, fringe credit, cash-in-lieu, CWHSSA overtime, deductions, net — is plain code under property tests, never an LLM. PDF field geometry and XSD-validated XML are emitted by code. The model does two things only: rank candidate WD classifications for an unmapped payroll title, with output constrained to that WD's actual classification list (retrieval-and-rank, never free generation), and draft exception-report narrative into a fixed template with facts injected. Both are JSON-schema-validated and rejected on failure. Every accepted classification writes to per-account memory keyed (account, WD, payroll title); the aggregate is the crosswalk moat.

**D7 — Unhappy-path behaviour.** *(This decision closes the autonomy objection.)* Generation always reads the pinned local mirror; live SAM availability is never on the critical path for a filing. Source unavailability degrades only the freshness claim: "verified against revision N published <date>; newer-revision check unavailable since <timestamp>." Unmapped trade → three candidate classifications with verbatim scope-of-work text and rate, that payroll line blocked, choice memorised. Superseded WD, unresolvable county/date, or any unresolved line → the report still renders, watermarked **DRAFT — NOT CERTIFIABLE**, signature block withheld. FAR 22.404-6 → state the rule, show the observable dates, decline to conclude effectiveness. SF-1444 → describe the path, state plainly we will not file it. Corpus unverified beyond 72h → dated banner, new rate assertions suppressed, Stripe auto-credit issued. Refunds are a self-serve in-app button. There is no support contact anywhere in the compliance flow.

**D8 — First channel.** The artifact is the channel: every generated WH-347 travels weekly to a GC and other parties carrying its provenance footer and URL. Layered on it, in order: (1) free unlimited WH-347 generator, no account; (2) programmatic county × craft rate pages generated from the mirror, targeting "[county] [craft] prevailing wage rate 2026"; (3) free WD-change email alerts for any WD number, which builds the list on the exact anxiety we monetise; (4) cold content aimed at newly awarded DBA-covered primes and their sub tiers, identified from SAM/USASpending award feeds. No outbound calling, no demo, no marketplace dependency.

**D9 — What v1 explicitly does NOT do.** Union CBA fringe schedules (not present in public WDs) — refused at signup, not approximated. Service Contract Act determinations. Any state prevailing-wage regime beyond California (NY/WA/NJ/IL are v2). Running payroll, computing or filing taxes, or printing cheques — we consume a payroll CSV and are not a payroll system. Filing, submitting or e-signing on the customer's behalf, or holding their portal credentials. SF-1444 conformance requests. Apprenticeship-ratio compliance opinions. Any legal conclusion about WD effectiveness or about liability. And no human review of any customer output, at any tier, ever.

**D10 — Measurement gates before any public performance claim.**
- **G1 Rate correctness.** A ≥500-line golden payroll suite spanning ≥25 WDs across ≥8 states, covering overtime, fringe credit, cash-in-lieu and deduction permutations, re-scored on every corpus refresh and every deploy. 100% exact match required; any divergence blocks index promotion and the build. No accuracy claim published until 30 consecutive green days.
- **G2 Form acceptance.** No "accepted by the agency" claim until ≥50 WH-347s and ≥25 CA eCPR XML files generated by us have been confirmed accepted by the receiving GC or agency, recorded via in-product confirmation, with the XSD hash check green across the whole window. CA eCPR carries the *generated, not acceptance-tested* label until this passes.
- **G3 Corpus completeness.** Nightly reconciliation of our active-WD count against the index total (4,236 on 2026-08-13). Any delta above 0.5% halts promotion. No "every wage determination" claim until 60 days of zero unexplained delta.
- **G4 Time saved.** Only ever stated as a measured in-product median from payroll-CSV upload to artifact download across ≥100 real filings — "median N minutes over N filings," never a DOL-derived extrapolation such as "saves 15 hours a week."
- **G5 Autonomy.** Human-minutes-per-customer is an instrumented counter; any inbound message requiring a human answer increments it. No "zero human minutes" claim published until 90 days below 2 minutes per customer per month at ≥50 paying accounts.
- **G6 Risk reversal.** The staleness auto-credit must fire correctly in a chaos test — upstream source killed in staging — before the guarantee is advertised anywhere.

---

## References

- https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=2&is_active=true&sort=-modifiedDate — verified live 2026-08-13: HTTP 200, JSON with `revisionNumber`, `modifiedDate`, `isActive`, `constructionTypes`, per-county rows; `totalElements` = 4,236 active DBA determinations
- https://sam.gov/wage-determinations — verified 200
- https://www.dol.gov/agencies/whd/forms/wh347 — verified 200
- https://www.dol.gov/agencies/whd/fact-sheets/66-dbra — verified 200
- https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html — verified 200
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5 — verified 200
- https://www.acquisition.gov/far/22.404-6 — verified 200
- https://www.certifiedpayrollpro.com/blog/best-lcptracker-alternatives-2026 — verified 200
- https://davisbaconrates.com/certified-payroll-software — verified 200
- https://www.dol.gov/agencies/whd/government-contracts/construction
- https://www.usaspending.gov/
- https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act — runner-up (Ship Record) basis
- https://sbomify.com/pricing/ — runner-up comparable
- https://fossa.com/pricing/ — runner-up comparable
- https://www.lateshipment.com/pricing/ — Rate Card contingency comparable
- https://opteo.com/pricing — Portfolio Guard price-ceiling comparable
- https://endoflife.date/api/v1/products/ — Sunset Graph corpus basis