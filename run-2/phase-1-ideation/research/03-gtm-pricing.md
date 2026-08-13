# GTM and Pricing Validation — Wage Line

**Subject:** pressure-test D4 ($49 one-time / $99 / $249 / $599) against incumbent price points and against its own value metric; model unit economics at zero human minutes; recommend the final ladder.
**Method:** Ramanujam & Tacke's *Monetizing Innovation* (WTP-first, leaders/fillers/killers, configuration); Hormozi's value equation and risk reversal; Poyar on value-metric alignment and expansion. All competitor prices pulled live and dated. **Date: 2026-08-13.** D1–D10 binding; changes flagged as **Challenge**.

---

## 1. The one thing that breaks D4

D4's value metric is right and its packaging function is wrong. The metric — "active DBA projects × workers appearing on certified payroll, both metered from generated filings, so expansion happens with no salesperson" — names the correct driver and the correct instrumentation. But D4 then expresses it as **hard capacity caps with 2.5× price steps** (1 project → 5 → unlimited), which is the opposite of "expansion happens with no salesperson." A cap is a wall, and a wall is a churn event, not an expansion event.

Two consequences, both fatal in a browser tab:

**Every capped tier is dominated on price-per-project by a self-serve incumbent.** CertifiedPayrollPro's **$49 Starter buys 5 projects**; D4's $99 Solo buys 1. CertifiedPayrollPro's **$99 Pro buys 25 projects**; D4's $249 Crew buys 5. Solving `$99 + 3R = $249` puts the Crew/Pro crossover at ~50 reports/month — roughly 11 projects — which Crew's own 5-project cap makes unreachable. **Crew is never cheaper than CertifiedPayrollPro Pro inside its own cap.** Only $599 Multi survives, at rough parity with LCPcertified's $7,400/yr unlimited ($617/mo).

**The metric is unpredictable and punishes hiring.** A product of two variables cannot be forecast by the buyer before purchase — Poyar's first test of a value metric is that the customer can predict the bill. Worse, workers is the wrong second factor: it charges the contractor for growing his crew, which is a Ramanujam *killer* (a term he reserves for pricing elements that blow deals), not a leader.

---

## 2. The incumbent grid (all verified live 2026-08-13)

| Vendor | Structure | Effective monthly |
|---|---|---|
| **CertiWage** Starter | $29/mo, unlimited weekly reports, WH-347 only, no XML | **$29** flat |
| **CertifiedPayrollPro** Starter / Pro / Enterprise | $49 (5 proj) + $5/rpt · $99 (25 proj) + $3/rpt · $249 (unlimited) + $1/rpt; $0 setup, 14-day trial, 3 free reports | metered |
| **LCPcertified Plus** | $12/report · $145/mo (5 proj) · $1,300/yr (10) · $2,500/yr (25) · $3,700/yr (50) · $7,400/yr unlimited — incl. **CA + WA + MD XML** | $108–$617 |
| **LCPcertified Professional** | $1,900/yr (10 proj) → $18,200/yr (450) | $158–$1,517 |

The market has already converged on **the certified filing as the meter** — $12, $5, $3, $1 per report. That matters: per Ramanujam, adopting a meter the market has already validated costs nothing in buyer education. D4 invented a two-factor metric nobody prices on.

---

## 3. Poyar and Ramanujam: fix the function, keep the price points

Poyar's value-metric tests are alignment, predictability, and smooth growth; his benchmark data puts usage-based companies at **120%+ net revenue retention versus ~110% for subscription-only**, with Snowflake's NRR peaking at 177%. He is also explicit that CAC payback is "extremely misleading" for PLG and usage-based businesses, preferring net new ARR against cash burned — a caution honoured in §5.

**The single-variable metric that passes all three tests is the certified filing.** One WH-347 per project per week: observable to the buyer before purchase (projects × weeks, arithmetic he already does), automatically metered from generated artifacts exactly as D4 requires, and the literal unit the GC gates payment on.

Ramanujam's configuration rule then says tiers must be differentiated by **leaders**, not capacity. D4's tiers differ only by how much of the same thing you get — so nothing pulls a customer upward except a wall. The leaders are already identified in doc 02: revision-level provenance printed on the artifact, refusal semantics, and per-account classification memory. Those belong on the tier ladder; capacity belongs on the meter.

**Challenge to D4 — implemented, not silently redesigned.** Both projects *and* workers stay metered from generated filings and are reported in-product, so D4's instrumentation survives intact. Only the **pricing function** changes: filings are priced, workers are measured. The price points $49 / $99 / $249 / $599 are kept unchanged.

---

## 4. Hormozi: the value equation, and the risk reversal that actually exists

Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort and Sacrifice).

- **Dream outcome** is not "save time" — it is *the GC releases the draw*. Time-saved is barred anyway: DOL's own WH-347 burden statement is **55 minutes per response, not per employee**, and G4 forbids any figure not measured in-product across ≥100 filings.
- **Perceived likelihood** is the whole differentiator: we emit the filed artifact with its WD number, revision, publication date and corpus hash on the form itself. Alerting products ask the buyer to finish the job.
- **Time delay**: CSV → artifact inside one session (unmeasured until G4).
- **Effort/sacrifice**: five-field setup, and classification memory means the one human-shaped question is answered once per account forever.

**Risk reversal must not become an insurance product.** A penalty indemnity would require underwriting and a human, breaking A2/A6. The four reversals that cost zero human minutes are: (a) the **free unlimited WH-347 generator** — verify our arithmetic against your own before paying anything; (b) the **$49 bid rate card**, a paid pre-account proof of the rate-of-record claim; (c) **DRAFT — NOT CERTIFIABLE** with the signature block withheld, so we never let you sign what we could not resolve; (d) **full artifact archive exported on cancel** — no data hostage. The D7 staleness auto-credit is a *service-failure* reversal, not a purchase reversal, and per G6 it cannot be advertised until it fires correctly in a chaos test.

---

## 5. Unit economics at zero human minutes

**LLM cost per filing.** D6 keeps the model out of the money path entirely, which is what makes this work. Two calls only. Classification ranking: ~10k input / ~2k output on `claude-opus-5` at $5/$25 per MTok ≈ **$0.10/call** — but it fires only on a new `(account, WD, payroll title)` tuple, roughly 12 times per project-year against 52 filings ≈ $0.023/filing. Exception narrative: ~$0.028, firing on ~15% of filings ≈ $0.004. With 1.5× headroom for JSON-schema rejection and retry: **≈$0.05 per filing.** Deterministic compute (arithmetic, PDF geometry, XSD-validated XML) plus perpetual artifact retention at Cloudflare R2's $0.015/GB-month adds ~$0.01. **All-in variable cost ≈ $0.06 per certified filing.**

> **Build constraint:** the free tier must resolve unmapped titles from the deterministic crosswalk and the WD's own classification list — **never an LLM call**. That confines model spend to paying accounts and makes free-tier marginal LLM cost $0.

**Fixed platform cost.** App machines on Fly shared-cpu-2x ($4.04/mo each), managed Postgres, R2 (10 GB and 10M Class B ops free monthly, egress free), nightly corpus crawlers, monitoring, and the county × craft static build: **≈$175/month**, independent of customer count. **Two Solo accounts cover the entire fixed cost of the corpus** — the strongest A6 fact in the model.

**Payment cost.** Stripe US: 2.9% + $0.30 on cards, plus 0.7% Billing pay-as-you-go = **3.6% + $0.30** on subscriptions; 2.9% + $0.30 on the one-time SKU.

| Tier | Price | Assumed filings/mo | Stripe | Variable | Contribution | Margin |
|---|---:|---:|---:|---:|---:|---:|
| Bid rate card (one-time) | $49 | — | $1.72 | $0.30 | **$46.98** | 95.9% |
| Solo | $99 | 13 | $3.86 | $0.78 | **$94.36** | 95.3% |
| Crew | $249 | 52 | $9.26 | $3.12 | **$236.62** | 95.0% |
| Multi | $599 | 130 | $21.86 | $7.80 | **$569.34** | 95.0% |

**Honest deduction:** D7's self-serve refunds and staleness auto-credits are a real leak with no human gate. Reserve **4% of MRR**; margins land at **~91%**. At the 50-paying-account threshold G5 requires (mix 20/25/5), MRR ≈ $11,200, contribution ≈ $10,650, less credit reserve and ~$400 fixed ≈ **$9,800/month** — the number publishable once G5 clears, and not before.

---

## 6. Payback on self-serve channels

Median self-serve/PLG CAC payback in 2026 runs **7–11 months**, against 16–18 months for B2B SaaS overall; Bessemer's efficiency line is 12 months. Inverting contribution against an 11-month ceiling gives the affordable-CAC budget: **Solo $1,038 · Crew $2,607 · Multi $6,259.** Even a $40 CPC at 2% landing conversion (~$2,000 CAC) clears the bar at Crew. The binding constraint is not affordability — it is that D8's channels are unmeasured, so no conversion rate is asserted here.

Three structural points that survive without conversion data:

1. **The $49 bid rate card is the acquisition instrument, not a revenue line.** At $46.98 contribution and instantaneous payback, each unit funds ~$47 of paid acquisition with zero payback risk. That is its job.
2. **Annual at ten months converts a payback problem into a cash-positive-at-signup one.** A prepaid Crew year is $2,490 in hand — inside the affordable-CAC budget on day one.
3. **Seasonality cuts both ways.** A filing meter captures the summer peak and contracts in winter. Annual prepay is the hedge; downstream agents should expect metered MRR to be seasonal and not read a January dip as churn.

---

## 7. Recommended ladder

Price points unchanged from D4. Caps replaced by a meter. Tiers differentiated by leaders.

| | Price | Included filings | Leaders |
|---|---|---|---|
| **Free** | $0, no account | unlimited single WH-347 + county × craft lookup | computes and formats; **no** pinned archive, diff-since-award, memory, or XML |
| **Bid Rate Card** | $49 one-time, pre-account | — | rate-of-record certificate for a bid |
| **Solo** | $99/mo | 40 | WD revision-of-record pinning, per-classification diff since award, classification memory |
| **Crew** | $249/mo | 200 | + CA eCPR XML *(labelled generated, not acceptance-tested until G2)*, WD-change alerts with one-click regenerate, **portal export bundles** |
| **Multi** | $599/mo | unlimited | + full dispute-grade rate-of-record archive, multi-entity/multi-EIN |

**Overage:** $2.50 per certified filing beyond the included count, **capped at the next tier's price with automatic upgrade at the cap**. $2.50 sits inside the market's own meter ($1–$12) and carries 97%+ contribution. No wall, no surprise bill above the next tier, no salesperson — D4's stated intent, delivered. **No project caps and no worker caps at any tier.** Annual billed at ten months, unchanged.

**How it lands against the grid:** 3 projects — us $99 vs CertifiedPayrollPro Pro $138, LCPcertified $145. 10 projects — us $106.50 vs CPP Pro $228, LCPcertified $108. 50 projects — us $291.50 vs CPP Enterprise $466, LCPcertified $308. Unlimited — us $599 vs LCPcertified $617. We lose two comparisons and should say so plainly: **CertiWage at $29** (no XML, no revision tracking) and **LCPcertified in the 10–25 project band**, where we sit ~20% above — down from D4's 72%.

### Changes from D4, flagged

- **Challenge 1 — pricing function.** Workers removed from the *priced* metric; filings priced instead. Both still metered per D4.
- **Challenge 2 — caps removed.** Hard project/worker walls replaced by included-filing allowances plus a capped overage meter with auto-upgrade.
- **Challenge 3 — portal export moved Multi → Crew.** R2 names the GC-mandated portal as the top churn vector; the sub most at risk is a Crew-sized sub, and the export is what keeps us the engine feeding the portal rather than its casualty.
- **Challenge 4 — free tier scoped down.** Free generates and formats but never asserts a pinned revision-of-record, which is where D3 puts the paid boundary.

**Non-negotiable for downstream agents:** the free tier makes **zero LLM calls**; every artifact carries the provenance footer at every tier including free (it is D8's channel); no margin, time-saved, or accuracy figure ships before its gate (G1, G4, G5); the staleness credit is not advertised until G6's chaos test passes.

---

## References

- https://www.certifiedpayrollpro.com/pricing — $49/$99/$249 tiers, 5/25/unlimited projects, $5/$3/$1 per report, $0 setup, 14-day trial; verified 2026-08-13
- https://lcptracker.com/solutions/lcpcertified/ — $12/report, $145/mo (5 proj), $1,300–$7,400/yr Plus, $1,900–$18,200/yr Professional, CA+WA+MD XML; verified 2026-08-13
- https://certiwage.com/emars-alternative — $29/mo Starter, unlimited weekly reports, first export free; verified 2026-08-13
- https://prevailcomply.com/ — self-serve competitor, free WH-347 generator, CA DIR XML
- https://davisbaconrates.com/certified-payroll-software — affiliate-supported free rate lookup
- https://stripe.com/pricing — 2.9% + $0.30 cards; Billing pay-as-you-go 0.7% of billing volume; verified 2026-08-13
- https://fly.io/docs/about/pricing/ — shared-cpu-1x $0.0028/hr, shared-cpu-2x $0.0056/hr, volumes $0.15/GB-mo; verified 2026-08-13
- https://developers.cloudflare.com/r2/pricing/ — $0.015/GB-month standard, Class A $4.50/M, Class B $0.36/M, egress free, 10 GB free tier; verified 2026-08-13
- https://platform.claude.com/docs/en/pricing.md — Claude model pricing (Opus 5 $5/$25 per MTok) used for the per-filing LLM model
- https://www.dol.gov/agencies/whd/forms/wh347 — OMB 1235-0008; 55-minute burden estimate *per response*
- https://www.dol.gov/agencies/whd/government-contracts/construction — DBRA coverage, $2,000 threshold
- https://www.dir.ca.gov/Public-Works/PublicWorkssb854.html — SB 854 contractor registration, $400 annual fee
- https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html — CA eCPR requirement
- https://www.monetizinginnovation.com/ — Ramanujam & Tacke, WTP-first design and packaging configuration
- https://blas.com/monetizing-innovation/ — leaders / fillers / killers and the configuration rule
- https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — Poyar on value-metric alignment, usage-based NRR (Snowflake 177% peak), and why CAC payback misleads for PLG/usage-based businesses
- https://www.growthunhinged.com/t/benchmarks — Poyar benchmark index
- https://www.getaleph.com/answers/cac-payback-period-saas-2026 — 2026 CAC payback benchmarks, self-serve/PLG 7–11 months
- https://www.saasmag.com/saas-cac-payback-period-new-growth-gauge-2026/ — median B2B SaaS payback, Bessemer 12-month efficiency line
- https://www.supersummary.com/100m-offers/summary/ — Hormozi value equation and Grand Slam Offer / guarantee structure
- https://sam.gov/wage-determinations — wage determination source of record
- https://www.acquisition.gov/far/22.404-6 — WD effectiveness rule declined per D7
- https://www.aprildunford.com/obviously-awesome — positioning frame carried from doc 02
