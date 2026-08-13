# Clausewright — GTM Playbook (Day 1–90)

**Status:** the founder's operating runbook for the acquisition phase. **Nothing in this repository sends anything.** Every outreach artifact referenced here is a draft for founder review (`crm/CRM.md §6.1`).
**Owner:** Founder (solo). No delegation exists in the 90-day window.
**Date:** 2026-08-13.
**Authority:** this document *sequences* work already decided elsewhere. It creates no new decisions and no new numbers. Where it appears to conflict with `IDEA_DOSSIER.md` or `BRAND.md`, those documents govern and this one is wrong.

**Binding sources, in order of authority:**

1. `phase-1-ideation/IDEA_DOSSIER.md` — decisions D1–D10, assumption register A1–A9 (§6.7), the 90-day plan (§6.7), pre-committed decision rules (§7.5), the 14-day concierge playbook (§6.8), pre-flight gates (§10.2), immediate next actions (§12).
2. `phase-1-ideation/research/03-gtm-pricing.md` — Bullseye scoring (§4.1), the inner-three test design and kill criteria (§4.2), BD as reserve channel #1 (§4.3), Core Four mapping (§4.4), unit economics (§6.4).
3. `phase-2-build/identity/BRAND.md` — voice (§2), messaging hierarchy (§3), copy do/don't (§4), naming invariants (§5.5), the pre-publish checklist (§6.1).
4. `phase-3-acquisition/research/` — `channels.md`, `demand-seo.md`, `partners.md`.
5. `phase-3-acquisition/crm/` — `CRM.md` (stages, cadence, ethics controls), `dashboard.md` (the weekly instrument), `partners.csv`, `channels.csv`.
6. `phase-3-acquisition/outreach/` — `community-playbook.md`, `launch-posts.md`, `partner-sequences.md`, `newsletter-pitch.md`.

---

## 0. How to read this document

Three things, and only three, produce customers in the next 90 days: **the daily community loop**, **the free Decoder and the pages around it**, and **a partner pipeline that pays out after day 60**. That ordering is not a preference. It is Weinberg & Mares' Bullseye result carried in D8 (*Traction*, 2015: Engineering-as-Marketing 22/25, Community 21/25, Business Development 18/25 as reserve #1), backed by an arithmetic constraint in `03-gtm-pricing.md §6.4` — contribution LTV ≈ **$355**, maximum sustainable CAC at 3:1 ≈ **$118**, modelled SEM CAC ≈ **$375**.

Everything below is a schedule for those three things plus the measurement that tells you which of them is working.

**What this document deliberately does not do:** it does not set a revenue target to manage toward. `IDEA_DOSSIER §6.7`'s base case (10 → 31 → 65 paying customers) is a model whose largest input, A1, is flagged **medium-low confidence**. Per Ries's innovation accounting (*The Lean Startup*, 2011), a model is a prediction to be falsified, not a quota. The thresholds in §11 are the things you manage toward; the model is orientation only.

---

## 1. The five standing constraints

No weekly result overrides these. They are reproduced here so that a bad week has to argue with them explicitly rather than quietly.

| # | Constraint | Source |
|---|---|---|
| **C1** | **Community + Engineering-as-Marketing are the entire path to the first 10 customers, at ~$0 cash.** Paid search is a capped measurement test, never the engine. | **D8**; Weinberg & Mares Bullseye (`03-gtm-pricing.md §4.1`) |
| **C2** | **The first 30 days spend zero cash on acquisition.** SEM opens on day 31, capped at $1,500, and closes at day 60 regardless of result. | **D8**; `03-gtm-pricing.md §4.2` Test C |
| **C3** | **Maximum sustainable CAC ≈ $118.** Any placement, fee or spend whose expected cost per acquired customer exceeds it is a deliberate loss and needs a written founder decision, not a marketing rationale. | `03-gtm-pricing.md §6.4`; `crm/CRM.md §1` |
| **C4** | **Transactional first, subscription second.** The business exits day 90 as a transactional business with a subscription seed — subscription at 1.9–3.0% of month-3 revenue in *all three* scenarios. A week where Shield MRR looks small is the plan working. | **D5**; `IDEA_DOSSIER §6.7` |
| **C5** | **Nothing is sent by any system, no private individual's data is ever collected, and no success rate is claimed anywhere.** A seller describing the worst week of their business life in public is not a lead. | `crm/CRM.md §6.2`; **N10/R11**; `BRAND.md §4.1` |

**The time budget** (`crm/CRM.md §5`, founder-set allocations, not benchmarks — only the *ordering* is sourced): the loop is ~9 h/week and is protected first; partner work is capped at ~4 h/week; review and rules work is ~2 h/week. Per Ross's *Predictable Revenue* (2011), role specialization is unavailable to one person, so **time-boxing replaces role-boxing** — partner work cannot cannibalize the engine.

---

## 2. Day 0 — the blocking gates

`IDEA_DOSSIER §10.2` makes five gates blocking and human-decided. Two have moved since Phase 1; three have not. **None takes more than a day, and all are cheap now and expensive later.** Nothing in §3 starts until the gate covering it clears.

| Gate | Status entering Phase 3 | What remains | Blocks |
|---|---|---|---|
| **G1 — Name** | **Partially resolved.** "Reinstate" is dead (**D2/R1**); the name is Clausewright and `BRAND.md §5` governs its use. | **Trademark clearance and domain acquisition are recorded as pending** (`BRAND.md §5.7`: `clausewright.com` acquisition pending, `.io` is the launch fallback). Confirm before any paid placement or printed asset. | Paid channels, partner co-branding |
| **G2 — Legal** | **Open.** | Counsel review of the disclaimer set, UPL posture, no-guarantee language, and the L4 consent text (**R9/R15**). | **Launch — every revenue-taking motion in Week 1** |
| **G3 — Agent Policy** | **Open.** | Locate the primary source behind AppealDraft's "Amazon March 2026 Agent Policy" claim (**R6**). Treat the vendor assertion as marketing per Fitzpatrick's *Mom Test* discount until a primary source exists. | Launch |
| **G4 — Forum rules** | **Half-clear.** The two vendor-operated forums are read and recorded verbatim (`channels.md §2.3, §2.4`) — both are **reputation-only, no link, ever**. | The Reddit, Facebook, Sellers Ask Sellers and Aspkin rules are **unverified** and remain prohibitions until a human reads them (`crm/CRM.md §3.2` default rule). | The Reddit/Facebook half of the loop (Week 1–2) |
| **G5 — Accounts** | Assumed clear (Stripe, domain, API key, hosting, transactional email are wired in `/app`). | Verify Stripe end-to-end with one live transaction before the first customer, per `IDEA_DOSSIER §7.6` Day 5. | Taking money |

### 2.1 The instrumentation gate — G6, added here, and it is genuinely blocking

`IDEA_DOSSIER §12` action 6 commits to measuring **A1 and A3 within 30 days for under $2,000** and calls them "the entire model." A read of the shipped schema (`app/src/lib/db/schema.ts`) shows the app stamps corpus release, prompt-bundle hash and per-stage model ids on every case (ADR-008 attribution) — **but carries no acquisition-source field on `cases`, and no Sean Ellis survey mechanism anywhere.** Grep for `utm_`, `referrer`, `attribution` and `ellis` returns citation-attribution code and nothing about channel provenance.

Stated plainly: **as shipped, the app can measure A1's rate but not attribute it to a channel, which means A2's kill criterion and A3's entire test are unmeasurable.** `dashboard.md` asks for "attributable Decoder sessions" per channel and for "revenue attributable to paid clicks"; nothing currently produces those numbers.

**Three prerequisites, all small, all before the first reply goes out:**

| # | Prerequisite | Why it is blocking | Sized against |
|---|---|---|---|
| **I1** | **First-touch acquisition source stamped at case creation** — a nullable `acquisition_source` (and, for paid only, a campaign/term) written in `app/src/app/_lib/case-store.ts` where the existing `attribution()` stamp is applied. | Without it, A2's "<40 attributable Decoder sessions in 30 days" (`03-gtm-pricing.md §4.2` Test A) and A3's blended revenue per click cannot be computed at all. | Ries's innovation accounting: commit the metric before the experiment, which requires the metric to exist |
| **I2** | **A manual reply log** — date, channel, reply count, DM count, attributable sessions, filled at end of day (`crm/CRM.md §5`, the 10-minute end-of-day block). | A2's numerator lives outside the product; nobody can reconstruct it later. `dashboard.md §1` A2's daily grid is the format. | — |
| **I3** | **The Sean Ellis survey instrumented from customer #1, run formally at ≥40 paying customers.** One question: *"How would you feel if you could no longer use this product?"* — very disappointed / somewhat / not. Store the response against the case reference, never a name (`crm/CRM.md §7`). | `IDEA_DOSSIER §3.3` names this the single largest evidentiary gap and §12 action 8 commits to it. Instrumenting it at customer #40 loses the first 39. | Sean Ellis 40% PMF survey; Vohra's Superhuman engine for the segmentation that follows |

**Honest note on I1's privacy posture:** first-touch source is a channel label (`reddit`, `forum`, `sem`, `partner:<code>`, `direct`), not a person and not a tracking profile. It records where the *session* came from. Nothing about it requires or permits collecting anything about the seller, which is the line `crm/CRM.md §6.2` draws.

---

## 3. The 13-week runbook

Each week: what the loop does, what ships in Engineering-as-Marketing, what happens in the partner pipeline, and what gets measured or decided. The Monday review (§10) sits on top of every row.

### Weeks 1–2 (days 1–14) — the concierge fortnight

`IDEA_DOSSIER §6.8` and `03-gtm-pricing.md §5` specify a 14-day concierge motion on the premise that the product does not exist. **It does** — `/app` is built. The sequencing consequence is not "skip the fortnight"; it is that the fortnight's hours move from building a manual runbook to **reading rules, instrumenting, and running the loop**. Per Graham's "Do Things That Don't Scale" (2013) and Ries's concierge MVP, the parts that stay manual stay manual on purpose: **the $399 human review is fulfilled by hand and every human edit is written down** (B8), because those edits are the product roadmap.

| | Week 1 (days 1–7) | Week 2 (days 8–14) |
|---|---|---|
| **Loop** | Start **only** on the two rules-verified vendor forums — Amazon Seller Forums and Walmart Marketplace Seller Forum — at **reputation-only** posture: a complete answer, no link, no price, no name-drop, no DM offer (`channels.md §2.3–2.4`; `outreach/community-playbook.md §1`). This is deliberately the lowest-conversion surface and the highest-credibility one; it is also the only one whose rules are *known*. | Reddit surfaces open **only if** the live sidebar/wiki read cleared them (G4). Move to full cadence, 8–15 substantive replies/day (**A2**). The reply hook is fixed: identify the reason code → quote the exact clause → name the one thing most sellers get wrong for that code → offer the free structure by DM. |
| **Decoder / EaM** | I1–I3 shipped. Stripe verified with one live transaction. The honest-triage refusal list written down **before the first customer**, so it is applied consistently rather than negotiated under revenue pressure (`03-gtm-pricing.md §5`). | Decoder public and carrying the loop, so the loop stops depending on founder DMs. Ship the **cited-clause card** as a clean, screenshot-able unit (`demand-seo.md §5.2`) — in no-link channels the screenshot is the only shareable artifact the rules permit. |
| **Partners** | Tuesday block only: `identified` → `researched` on 6–8 rows. Nothing drafted, nothing sent. | Thursday block: first 3–4 drafts written against `outreach/partner-sequences.md`. Friday: founder reads, edits, sends by hand — or does not. **Only that act moves a row to `contacted`.** |
| **Measure / decide** | Reply log running from day 1. Nothing is decidable yet; resist reading noise. | First discovery calls (§9) with the first paying customers. Ellis question asked from customer #1. |

**Expected timing, for orientation only:** first sale days 3–7; **10th paying customer day 21–28** on the base case (`IDEA_DOSSIER §6.7`).

### Weeks 3–4 (days 15–30) — cadence, and the first real reading

| | Week 3 | Week 4 (day 30 checkpoint) |
|---|---|---|
| **Loop** | Full cadence across the four ranked surfaces (`channels.md §1` ranks 1–4). At most **2 channels/week** move from `rules-checked` to `active` (`crm/CRM.md §4.5`) — the limit exists so the reply loop keeps its hours. | Hold cadence. Record moderator actions and near-misses even when nothing came of them — a near-miss on the Amazon forum is the single highest-value warning this system produces (`dashboard.md §5`). |
| **Decoder / EaM** | First **Reason Code Index** page ships: a metrics-threshold code (`AMZ.PERF.ODR`). Chosen because its governing clause is short, public and unambiguous — the cheapest code to cite correctly and the least likely to embarrass the citation invariant (`demand-seo.md §4.3`). | Second and third index pages (`AMZ.PERF.LSR`, `AMZ.PERF.AHR`). **`AMZ.SAFETY.GPSR` and `AMZ.OPS.DROPSHIP` do not ship** — the corpus's own `gap` fields are open, and publishing ahead of a verified source violates the invariant the whole brand rests on (`demand-seo.md §4.4`). |
| **Partners** | Continue Tue/Thu/Fri rhythm. WIP ceiling: **8 rows** in `drafted`+`contacted` (`crm/CRM.md §4.5`). | Expect no revenue. A partner pipeline showing movement in week 4 is more likely mis-staged than fast (`crm/CRM.md §2`). |
| **Measure / decide** | If classified sessions reach **n ≥ 100**, A1's rule comes into force — not before. | **Day-30 gates fire: A2's 30-day kill criterion and, if n ≥ 100, A1's rule.** See §11. Also: the last day of C2's zero-cash window. |

### Weeks 5–8 (days 31–60) — the capped paid test, and partners start replying

| | Weeks 5–6 | Weeks 7–8 |
|---|---|---|
| **Loop** | Unchanged. It is the engine; it does not pause for the SEM test. | Unchanged. If reply cadence falls below A2's floor, **partner work stops until the loop is back** (`crm/CRM.md` Rule P2). |
| **Decoder / EaM** | Index pages 4–6. The comparison/anchor page ships (`demand-seo.md §4.6`) — the anchor numbers are already sourced and brand-approved, and no AI-native competitor holds a "what does an appeal service cost" page. | Escalation page ("your appeal was rejected") built as a **conversion surface, not an information page** (`demand-seo.md §4.5`) — competitors already give correct generic advice there; none frames a bounded, priced next step without pressure. |
| **Partners** | Second-touch window opens (day +14 minimum, `crm/CRM.md §4.3`). Newsletter/podcast pitches go out via `outreach/newsletter-pitch.md`, **asking for the rate card before proposing anything** (C3). | Third touch (day +28 minimum), then stop. No fourth touch. Rows with no reply 8 weeks after touch 1 age to `dormant` — they do not sit in `contacted` making the pipeline look fuller than it is. |
| **Measure / decide** | **SEM test opens (§7).** Hard cap $1,500. Read measured CPC in week 1 of the test — that reading is the point of the test. | **SEM test closes at day 60 or at $1,500, whichever comes first.** |

### Weeks 9–13 (days 61–90) — the first partner revenue, and the PMF question

| | Weeks 9–10 | Weeks 11–13 |
|---|---|---|
| **Loop** | Unchanged. By now the reply archive is itself the proof asset — a public thread where a stranger was helped for free beats any on-site testimonial (`IDEA_DOSSIER §6.1` lever 6). | Unchanged. |
| **Decoder / EaM** | Walmart index pages begin (`WMT.PERF.STANDARDS`, `WMT.PERF.ODR`) — the thinnest competitive set found anywhere in the research, and the v1.1 beachhead extension (`demand-seo.md §4.2`). Honest ceiling: thin because the Walmart 3P population is smaller, not because nobody noticed. | Post the first anonymised outcomes back into the communities that produced them, **with explicit permission asked separately, after the outcome, with a clear no available** (`crm/CRM.md §7`). This is where Perceived Likelihood starts climbing from 3/10 (**D7**). |
| **Partners** | First `agreed` rows possible. A row advances to `agreed` only on a **specific arrangement in concrete terms** — "sounds interesting, send more" is the most common false positive in a founder-run pipeline and stays at `replied` (`crm/CRM.md §2.1`). | First `live` row possible: a referred seller actually arrives and is attributable. Day-60+ is the modelled window; this is on schedule, not late. |
| **Measure / decide** | **At ≥40 paying customers: run the Sean Ellis survey formally** (§8.3). | **Day-90 review:** all three assumptions read against §11's card; the Bullseye is re-rung (inner ring confirmed, demoted, or replaced) per *Traction*'s focus step. |

---

## 4. Channel A — the community loop (Bullseye 21/25)

**Why it ranks second and is still run first:** it scores 5/5/5 on reach, cost and speed and only 2 on uncrowdedness — every competitor is already here (`03-gtm-pricing.md §4.1`). It ranks anyway because a "just got suspended" post is a **public, timestamped, individually addressable buying signal**, which almost no other business gets.

**The daily protocol** (`crm/CRM.md §5`, 60–90 min, mornings, protected first):

1. Sweep the surfaces at `active` in `channels.csv`, in rank order.
2. 8–15 substantive replies (**A2**), each obeying that channel's recorded posture *literally*.
3. Each reply: identify the reason code → quote the exact clause → name the one thing most sellers get wrong for that code → where the posture permits it, offer the free structure **by DM**, never by link.
4. End of day, 10 minutes: log replies, DMs, attributable sessions (**I2**).

**The one sentence that governs every reply** (`outreach/community-playbook.md §0`, restating `BRAND.md §3.5` R2): *the reply is the product demo; if it needs a click, a DM or a purchase to be worth having, it is not a reply, it is an ad, and it will be removed, correctly.* This is Hormozi's lead-magnet rule applied in public (*$100M Leads*, 2023): the free thing solves a **complete narrow problem** — *"I don't know what I'm charged with"* — while making the next problem obvious by itself. **We never have to say it.**

**Posture is determined by rules, never by size** (`crm/CRM.md §3.2`):

| Posture | Channels | What is permitted |
|---|---|---|
| **reputation-only** | Amazon Seller Forums, Walmart Marketplace Seller Forum — both rules **verified verbatim** | A complete useful answer. **No link anywhere, including the profile.** Never mention price. Enforcement escalates warning → 1–30 day posting suspension → permanent loss of posting privileges. |
| **reply-only, no link** | Reddit surfaces, Facebook groups — all **unverified** until a human reads the live rules; this is also the default for anything unverified | Complete answer in the body; a profile link only where the live rules permit; the free structure offered by DM. |
| **operator-channel-only** | eComFuel and any paid/private forum prohibiting member pitching | No member outreach at all. Approach the operators about a sponsor slot (`outreach/newsletter-pitch.md` Template F). |

**The highest-severity execution risk in the entire plan** (`03-gtm-pricing.md §7.1`, **R2**): a link-bearing reply on a vendor forum can remove the highest-relevance surface permanently. Mitigations, all already decided: Seller Central is used for reputation only and is the *lowest*-priority volume surface; Reddit and Facebook carry the volume; every reply stands alone as useful if the link is never clicked; **diversify off any single channel by day 60**.

**Kill criterion, pre-committed** (`03-gtm-pricing.md §4.2` Test A): **if 30 days of consistent posting yields fewer than 40 attributable free-Decoder sessions, Community demotes from the inner ring to the middle ring.** This is a threshold on output, not effort — a diligent month producing 12 sessions still triggers it.

**The supply caveat that must be recorded, not absorbed:** nobody has ever counted how many fresh suspension threads appear per day per surface (`channels.md §5`). If 8–15 replies/day proves impossible because the threads do not exist, **that is a finding about supply and it goes in the dashboard as such**, not down as a personal shortfall.

---

## 5. Channel B — Engineering-as-Marketing: the Decoder (Bullseye 22/25)

The canonical *Traction* pattern (HubSpot's Website Grader, Moz's free tools): the marketing asset *is* the product, at zero marginal cost, and it seeds the SEO build at the same time.

**The claim narrows, and this is the most important correction Phase 3 research produced.** `demand-seo.md §0.2` found **four** competitors already shipping a free classifier or loss calculator that Phase 1 never surfaced — Mr. Jeff AMZ ("Analyze My Ban"), AppealPilot, AppealsPro.AI, and ESQgo's suspension calculator. *"We have a free decoder"* is therefore contested. What none of them does, on every page sampled, is **quote the governing policy text verbatim with a checkable source** — they paraphrase.

> **The defensible claim is: we show you the clause, not our paraphrase of it.**

That is `BRAND.md` UA1 and it is enforced in code, not in copy — no policy reference reaches the UI unless it arrived inside a Citations `cited_text` object with a source location (**B4/R4**). Per Dunford's Step 8 (*Obviously Awesome*, 2019), the trend layered on top is buyer preference for cited, verifiable AI over black-box completion — and per Lewis et al. (NeurIPS 2020), retrieval-grounded generation is what makes the factuality claim architecturally true rather than aspirational. Every competitor already claims "AI-powered," so that claim is worthless.

**Two further free-tool differentiators, both true and both cheap to say:** no login and no account (AppealsPro.AI gates its analyzer behind a free account), and honest triage stated in public before anyone is charged (`demand-seo.md §2.6`).

**Reason Code Index build order** — sequenced by *citability*, not by search volume (`demand-seo.md §4.3–4.4`):

1. **Ship first:** metrics-threshold codes — `AMZ.PERF.ODR`, `AMZ.PERF.LSR`, `AMZ.PERF.PCR`, `AMZ.PERF.VTR`. Short, public, unambiguous governing clauses.
2. **Ship second:** `AMZ.COC.LINKED`, `AMZ.AUTH.INAUTHENTIC`, the comparison/anchor page, the escalation page.
3. **Hold:** `AMZ.SAFETY.GPSR`, `AMZ.OPS.DROPSHIP` — the corpus's own gap fields are open. High-anxiety, actively-searched topics, and shipping them early would be exactly the failure mode the brand exists to prevent.
4. **Hold on a different ground:** `AMZ.COC.SECTION3` is the most contested query found (10 competitors on one search) *and* the one code where the corpus admits its citation is an approximation, because the governing text is login-gated. If the page ships, it carries that limitation in the copy.
5. **Refusal categories get referral pages, not drafting pitches** — counterfeit, IP, fraud, Section 3 abuse. Per **D7** lever 2, honest refusal is counter-intuitively the strongest trust lever, and per `IDEA_DOSSIER §6.1` it converts a lost sale into a referral fee and a BD relationship.

**Kill criterion, pre-committed** (`03-gtm-pricing.md §4.2` Test B): **if free-Decoder → paid sits below 4% after 100 completed sessions, the problem is the offer or the paywall placement, not the channel — fix the offer before touching spend.**

**Why the paywall sits where it does, restated because it will be tempted:** A4 is a *comparative* assumption — that a cited, critiqued draft converts at a **premium** over a $97 incumbent. A differentiator hidden behind payment tests the promise, not the product. The paywall therefore sits after the reason code, the cited clause and the readiness critique, and before the full document (`IDEA_DOSSIER §7.1`). **That is experiment design, not a growth hack, and moving it forward invalidates the experiment.**

---

## 6. The partner pipeline (reserve channel #1, Bullseye 18/25)

**Seed day 1, expect revenue day 60+.** Per Ross's *Predictable Revenue*, partner cycles run 4–8 weeks and that is a reason to seed early and expect nothing early, not a reason to push. Best long-run economics of any channel (~$40–60 CAC, inside C3's ceiling) because **each partner aggregates many suspension events**.

**Weekly rhythm** (`crm/CRM.md §5`), and the separation of drafting from sending is deliberate:

| Day | Block | Cap | What happens |
|---|---|---|---|
| Tuesday | Research | 90 min | `identified` → `researched`. Verify the contact route and whether a partner program exists on the live page. Apply conflict flags. |
| Thursday | Drafting | 90 min | `researched` → `drafted`. Every draft passes the six checks (`crm/CRM.md §6.3`). **Nothing is sent from this block.** |
| Friday | Founder send review | 30 min | The founder reads, edits and sends by hand — or does not. The only act that moves a row to `contacted`. |
| Friday | Channel rules | 30 min | At most 2 channels/week to `rules-checked`. Read the actual rules; record verbatim where quotable. |

**Three offer shapes, no fourth** (`crm/CRM.md §2.3`): **referral fee** for upstream partners who field the panicked call first (bookkeeping, agencies, reimbursement services); **content collab** for adjacent-detect tools and media, linking to the specific reason-code page rather than the homepage; **bundle** for partners who already hold the account operationally (aggregators, 3PLs, agencies already monitoring account health). **No commercial term is written into the CRM before a human sets it** — a placeholder in a file becomes a promise in a negotiation.

**Where a partner program exists, the program replaces cold email entirely** (Seller Snap's partner-apply form, BQool's partner page, SmartScout's published support address). Higher-converting *and* the compliant path — Ross's channel-partner logic is to use the process the partner already runs.

**Cadence ceiling:** three touches — day 0, day +14 minimum, day +28 minimum — then the row ages to `dormant`. **Any opt-out is honoured permanently and immediately**, across every sequence and channel, and the row moves to `excluded` (CAN-SPAM, 15 U.S.C. §7704; `crm/CRM.md §6.3`).

**Rule P2, which is the whole point of calling this a reserve channel:** if partner work exceeds its time box while reply cadence falls below A2's floor, **partner work stops until the loop is back at cadence.**

**Excluded on conflict, not oversight:** Avenue7Media and every appeal/reinstatement vendor in `IDEA_DOSSIER §5.1`. The two-way referral with honest-triage competitors (**D7** lever 2) is a different structure with a competitor counterparty and stays out of `partners.csv` until a founder opens it.

---

## 7. Paid search — the capped measurement test (D8)

**This test exists to learn a number, not to buy customers.** `03-gtm-pricing.md §6.4` models SEM CAC at ~$375 against a $118 ceiling — **3.2× over before the test starts**. Running it anyway is justified only because A3 (CPC $10, range $6–15) is **unverified, sourced from no keyword data at all**, and is one of the two numbers `IDEA_DOSSIER §12` action 6 says can be known within 30 days for under $2,000.

| Parameter | Value | Source |
|---|---|---|
| **Window** | Days **31–60** only. Not earlier (C2), not extended. | `03-gtm-pricing.md §4.2` Test C |
| **Hard cap** | **$1,500**, total, no top-up | Test C |
| **Keywords** | "amazon account suspended what to do," "amazon plan of action template," "amazon appeal rejected," "walmart seller account deactivated," plus competitor-brand terms | Test C |
| **Landing** | The Decoder, not the pricing page — the test measures the same funnel the free channels feed | `demand-seo.md §1` (S1/S2 stages map to the Decoder) |
| **Judged on** | **Blended revenue per click.** Never on Rescue conversion alone. | Test C |
| **Kill** | **At $1,500 spent unless blended revenue per click ≥ $0.60** (i.e. CAC ≤ ~$118 at measured funnel rates) | Test C; C3 |

**What the A3 number means when it lands** — the reading is pre-committed so it cannot be rationalised afterwards:

| Measured CPC | Reading | Action |
|---|---|---|
| **≥ $10** | The $375 CAC model holds or worsens. SEM is 3.2×+ over the ceiling. | Do not scale under any conversion result. Record the number; the finding is the deliverable. |
| **$6–10** | Inside the assumed range. Model unchanged; SEM remains uneconomic at launch AOV. | Same. |
| **$4–5** | A genuine finding that changes the model — **but only one of three conditions.** | Re-model. SEM becomes marginally viable only if blended AOV also rises to ~$350 via a 40%+ human-tier mix **and** Shield net attach reaches 25–30%. **All three together** take the ceiling to ~$300. None is true on day one. |

**Two guards against the classic failure:**

- **A good conversion week at a $10 CPC is not a finding.** It is variance on a channel already known to be over the ceiling. Only the CPC reading and the blended revenue per click are decision-bearing.
- **A $500 mid-test checkpoint** is a sensible operating stop-loss — but it is a **founder-set operating choice, not a sourced threshold**, and it is recorded as such. The only pre-committed kill is the $1,500 / $0.60 rule.

**Facebook retargeting off the free Decoder is the cheaper second paid option** (`03-gtm-pricing.md §4.4`) and is explicitly **out of scope for the 90 days** — it competes for the same capped budget against a test with a defined learning objective.

---

## 8. Instrumentation

Per Ries's innovation accounting, committing to the metric and the rule **before** the experiment is what prevents post-hoc rationalisation. The metric definitions below are not adjustable inside the window.

### 8.1 A1 — the number the model is a function of

**Definition** (`IDEA_DOSSIER §7.5`, primary metric): `preview → paid`, counted **only on sessions that reached a successful classification.** A paste that failed to classify is not in the denominator.

**Denominator hygiene, checked before A1 is read at all:** `paste → successful classification` rate. A low rate there contaminates A1's denominator and must be diagnosed first (`dashboard.md §3`). This is the single most common way a conversion rate lies.

**Every rate is written `numerator / denominator = rate`.** A percentage without its `n` does not get recorded (`dashboard.md`).

**Rule in force at n ≥ 100 classified sessions, not before** — see §11.

### 8.2 Secondary and lagging metrics

Tracked, not decision-bearing on their own (`IDEA_DOSSIER §7.5`): classifier accuracy vs. the golden set; rush-tier ($399) attach; median paste→preview latency; Shield attach on the included 30 days (feeds **A5**); discovery calls completed against the 15–20 target.

**Lagging, instrumented only (A7):** self-reported submission and reinstatement at day 3/10/21, **n always reported**. A7 is instrumented and **never** used to make a decision this quarter, because Walmart states appeals are handled in order received with no committed timeline — a 3–30 day self-reported loop is the worst possible primary metric. **No rate derived from this table is published anywhere** until it is audited with a stated denominator and methodology (**N10/R11**; `BRAND.md §4.1`) — and the prohibition holds *especially* when the numbers look good.

**Designated vanity metrics, deliberately not reported:** drafts generated, page views, waitlist size, followers, impressions, upvotes. Ries's warning applies with unusual force here — **"free drafts generated" will look spectacular and mean nothing.** If one appears in a weekly summary, it was smuggled in to make a bad week feel better.

### 8.3 The Sean Ellis survey — instrumented from customer #1, run at 40

**Instrument at customer #1** (I3). **Run formally at ≥40 paying customers** (`IDEA_DOSSIER §3.3`, §12 action 8). One question: *"How would you feel if you could no longer use this product?"* — very disappointed / somewhat disappointed / not disappointed. Threshold: **≥40% "very disappointed."**

**Then do the thing most teams skip.** Per Vohra's Superhuman PMF engine (First Round Review, 2018), **segment the "very disappointed" cohort and build for them specifically rather than averaging across all respondents.** The average is the least informative number the survey produces.

**Expect a split result, and want it.** The `churn-retention` judge lens ranked this idea **last of eight** on the grounds that "get reinstated, then cancel" is the archetypal one-off JTBD (`IDEA_DOSSIER §9.2`). Ellis may well come in **below 40% on the transactional product and above it on Shield.** Per `IDEA_DOSSIER §3.3`, that is a finding to want, not to fear — it would say the durable business is the subscription and the transaction is its acquisition channel, which is a strategy, not a failure. **What is not permitted is running the survey, disliking the number, and re-running it on a friendlier cohort.**

**Timing check:** 40 paying customers lands around day 60–75 on the base case and may not land at all on the conservative case (~53 customers at day 90). **The trigger is the customer count, never the calendar.** If day 90 arrives at n=31, the survey has not been run and the honest statement is "not yet measurable," not an early read on a small sample.

---

## 9. Discovery interviews — 15–20, run as onboarding (The Mom Test)

`IDEA_DOSSIER §12` action 7 commits to 15–20 Blank-style discovery interviews, run as onboarding calls. This closes what report 01 flagged as the largest evidentiary hole: **no primary customer discovery has ever been run.** Everything in Phase 1 is secondary and observational — it validates the category, not our differentiated pull.

**Every paying customer gets a 15-minute call.** It is onboarding first, research second, and **never a pitch**. Fitzpatrick's rule governs (*The Mom Test*, 2013): **ask about their past, not your idea.**

**Ask** (`crm/CRM.md §7`): Walk me through the day the notice arrived — what did you do in the first hour? What had you already tried, and what did it cost you in money and days? Who else did you ask, and what did they tell you? What did you do about revenue while the account was down? Has this happened before, and what happened then?

**Never ask:** Do you like it? Would you pay for monitoring? Would you recommend us? These harvest compliments, and **compliments are not data.**

**Two brand hypotheses to test inside the first 15 calls, not by asking but by listening** (`BRAND.md §7`):

1. **Does "copilot" land?** The word carries specific meaning in software circles; a sub-$2M FBA seller may hear jargon. Listen for whether they repeat it back or reach for a different word. If they reach for a different word, that word is probably better than ours.
2. **Does the ER-doctor register hold up?** `BRAND.md §7` calls this the most testable claim in the brand book and notes no A/B evidence exists for this category.

**Recorded:** anonymised facts only — reason code, days down, what they tried, what it cost, what they searched for, which channel they arrived through. **Not recorded:** anything identifying. Identity lives in the payment system, never in the CRM; notes sit against a case reference (`crm/CRM.md §7`). Outcome quotes and case studies need **explicit permission, asked separately, after the outcome, with a clear no available.**

---

## 10. The weekly review ritual

**Monday, 45 minutes.** Copy `crm/dashboard.md` into `crm/weeks/YYYY-WW.md` and fill it in for the week that just ended.

**Fill it in even when the week was bad — especially then. A dashboard that only gets updated in good weeks is a mood ring, not an instrument.**

The order matters, because reading A1 before checking its denominator produces confident nonsense:

1. **Denominator check first** — paste → successful classification rate (§8.1).
2. **A1, A2, A3** against their thresholds. Read the rule, not the mood.
3. **Both pipelines' stage counts** — partner (`partners.csv`) and community (`channels.csv`), with WIP checks: 8 rows in `drafted`+`contacted`, 2 channels/week to `rules-checked`.
4. **Secondary metrics**, tracked not decided on.
5. **The ethics and compliance checklist** — every line ticked. **An unticked line is a stop, not a note.** This includes: nothing sent by any system; no individual's data anywhere; every new row carries a `source_url`; every draft passed the six checks; every opt-out honoured immediately and permanently; every post obeyed its channel's recorded posture; no unverified-rules channel posted to; no outcome or success rate claimed anywhere; no manufactured urgency; no suspension-radar data collected.
6. **"Something that contradicted the plan this week."** If this is blank three weeks running, the review is not being run honestly.
7. **Decisions taken, with the rule that triggered them.** Then **three commitments for next week, at most.**

**The amendment rule that makes the whole instrument worth having** (`dashboard.md`, inherited from `IDEA_DOSSIER`): **thresholds were committed before the measurements existed and are not adjusted after seeing a result they would fail.** If a threshold turns out to be wrong, it is changed deliberately, in writing, with a named reason, in §7 of that week's file — never silently, and never in the same review that it would have triggered. If that is what happened, **write that sentence down.**

**Monthly, 60 minutes:** age out stale rows, review `live` partners for referral volume, re-read the rules on any channel where enforcement behaviour has visibly changed. Regression is information; hiding it is the failure.

---

## 11. The consolidated kill / pivot card

Everything decision-bearing, in one place. Reproduced from `IDEA_DOSSIER §7.5`, `03-gtm-pricing.md §4.2` and `crm/dashboard.md` — **no threshold here is new.**

| # | Assumption | Modelled | Falsification threshold | Pre-committed action | Evaluated when |
|---|---|---|---|---|---|
| **A1** | Free → paid | 8% → 9% → 10% | **≥ 8%** | **Persevere.** The differentiator is being perceived. Hold the ladder, hold the paywall placement. | n ≥ 100 classified sessions |
| **A1** | " | " | **3–8%** | **Iterate** — prompt, critique quality, or pricing. **One variable at a time.** | n ≥ 100 |
| **A1** | " | " | **< 4%** | **Fix the offer or the paywall placement — not the channel** (Test B kill criterion). | n ≥ 100 completed sessions |
| **A1** | " | " | **< 3%** | **Pivot.** The differentiator is not perceived, and there is no cheaper price to retreat to that is not already AppealDesk's ground at $97. | n ≥ 100 |
| **A2** | Community output | 8–15 replies/day; 10–20% reach the Decoder | **< 40 attributable Decoder sessions after 30 days of consistent posting** | **Demote Community from the inner ring to the middle ring.** Threshold on output, not effort. | Day 30 of consistent posting |
| **A3** | SEM CPC | $10 (range $6–15), **unverified** | **$1,500 spent with blended revenue/click < $0.60** | **Kill the test.** | At the cap, days 31–60 |
| **PMF** | Sean Ellis | ≥40% "very disappointed" | **< 40%** | Segment the "very disappointed" cohort (Vohra) and read the transactional and subscription products **separately** before concluding anything. | ≥ 40 paying customers |

**Both A1 thresholds and the A2 threshold are hypotheses, not published benchmarks.** The dossier flags them as such. **They are binding anyway, because a threshold that binds only when convenient does no work.**

**Two escalation rules that sit above the table:**

- **If A2 demotes Community *and* A1 lands under 4%, do not run both fixes at once.** A1's rule says fix the offer before touching the channel; per Ries, changing two variables makes the next reading uninterpretable.
- **A kill on any single channel is not a kill on the company.** Per *Traction*, demoting a channel returns you to the middle ring with a measured reason — the next candidates are Email Marketing (18/25), Targeting Blogs (18/25) and Affiliate Programs (18/25), all already scored and none yet tested.

---

## 12. What would make this plan wrong

Recorded so a bad outcome is recognised as a known risk rather than a surprise (`03-gtm-pricing.md §7`, `IDEA_DOSSIER §10.1`).

1. **Forum bans (R2).** The highest-severity execution risk. Community is the entire path to the first 10 customers and a single link-bearing reply can close the highest-relevance surface permanently. Mitigated, not removed.
2. **A1 is wrong by 2×.** Everything in the revenue model is a function of it. Measurable within 100 Decoder sessions for ~$0 — **measure before spending anything.**
3. **The guarantee attracts unwinnable cases.** Adverse selection (Akerlof 1970) is the standing risk of any refund-on-rejection offer. Honest triage is the control and it must be enforced **before** payment.
4. **AppealDesk or AppealDraft adds a human-review tier (R7).** The durable answer is not the tier but the outcome-feedback loop behind it (Helmer's Process Power) — which is why B9 ships day 1 and why **if anything slips, B9 is the last thing cut** (D10/R16).
5. **Amazon platform action.** The "March 2026 Agent Policy" remains unverified (G3), and Amazon could expand Account Health Assurance and compress the prevention market from above (R14).
6. **The instrumentation gate (§2.1) does not get built.** Then A2 and A3 are unmeasurable, the 90 days produce activity instead of evidence, and every threshold in §11 becomes decorative. This is the cheapest failure on the list to avoid and the easiest to postpone.

**Open hypotheses carried forward, not findings:** A2, A5, A6, A8 have no category-specific published basis; SEM CPCs were never obtained; Reddit and Facebook were unfetchable during research so every subscriber figure is secondary-sourced and some conflict by up to 12×; Facebook, Sellers Ask Sellers and Aspkin posting rules are unread; the suspension-radar cold-outreach idea remains legally unreviewed and **no data is collected under it**; whether the cited-clause card actually gets screenshotted into replies is untested and is the load-bearing hypothesis behind the Decoder's community distribution.

---

## References

Frameworks and sources applied above. Inline citations throughout point here.

**Channels and go-to-market**

- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — the Bullseye framework (brainstorm 19 channels → test 3–5 cheaply with pre-committed kill criteria → focus on what works). All 19 channels scored in `03-gtm-pricing.md §4.1`; the inner ring (Engineering-as-Marketing 22/25, Community 21/25, SEM 20/25 as a capped test) and reserve #1 (Business Development 18/25) carried into §1, §4, §5, §6, §7, §11.
- **Alex Hormozi**, *$100M Leads* (2023) — the Core Four (warm outreach, post free content, cold outreach, paid ads) mapped in `03-gtm-pricing.md §4.4`; the lead-magnet rule — solve a complete narrow problem free while making the next problem obvious — governing the reply protocol (§4) and the Decoder's free/paid split (§5).
- **Alex Hormozi**, *$100M Offers* (2021) — the value equation and D7's instruction to spend the entire offer budget on Perceived Likelihood (§5, §6); the genuine-vs-manufactured urgency distinction enforced as a hard constraint in `BRAND.md §2.5` and in C5.
- **Aaron Ross & Marylou Tyler**, *Predictable Revenue* (2011) — pipeline stages defined by prospect-side observable events rather than seller-side optimism (§6); the 4–8 week channel-partner cycle and seed-early/expect-late discipline (§3, §6); the weekly pipeline review as the operating rhythm (§10); use the partner's own existing process rather than cold email (§6). Role specialization is explicitly **not** adopted and is replaced by time-boxing (§1).
- **April Dunford**, *Obviously Awesome* (2019) — Step 6 category selection ("suspension defense copilot," not "AI POA generator," per D3) and Step 7's win-against-each-alternative sentences (§5); Step 8 trend layering — cited, verifiable AI (§5).

**Product-market fit, discovery and accounting**

- **Rob Fitzpatrick**, *The Mom Test* (2013) — the evidence hierarchy (money spent > behaviour observed > stated intent) and the discovery-call question set in §9; applied inward in §5's narrowing of the Decoder claim and in §2's treatment of the unverified Agent Policy claim.
- **Steve Blank**, *The Four Steps to the Epiphany* (2005) — customer discovery embedded in onboarding calls (§9); the five discovery gates passed in `IDEA_DOSSIER §3.2`.
- **Eric Ries**, *The Lean Startup* (2011) — innovation accounting: commit the metric and the decision rule before the experiment (§8, §10, §11); vanity metrics (§8.2); the concierge MVP behind the manual $399 fulfilment (§3); one variable at a time (§11).
- **Sean Ellis**, product-market-fit survey — "How would you feel if you could no longer use this product?", ≥40% "very disappointed" (§8.3).
- **Rahul Vohra**, "How Superhuman Built an Engine to Find Product/Market Fit," First Round Review (2018) — segmenting the "very disappointed" cohort rather than averaging (§8.3).
- **Paul Graham**, "Do Things That Don't Scale" (2013) — manual fulfilment of the human-review tier and the first-customers motion (§3).

**Pricing, economics and behaviour**

- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — the minivation warning behind D4's refusal to undercut AppealDesk's $97, which is what makes A1 a *comparative* test (§5).
- **Kyle Poyar / OpenView** — median free-to-paid 8% (n=200) as A1's basis; card-on-file trials converting at 30% as A5's basis (§8, `IDEA_DOSSIER §6.7`).
- **Barbara Fredrickson & Daniel Kahneman**, *JPSP* 65(1) (1993); **Daniel Kahneman**, *Thinking, Fast and Slow* (2011) — the peak-end rule behind D6/M2: Shield is sold at the moment of relief, never the moment of panic (C4, §3 weeks 11–13).
- **George Akerlof**, "The Market for 'Lemons'," *QJE* 84(3) (1970) — adverse selection in the refund guarantee; honest triage as the control (§12.3).
- **Hamilton Helmer**, *7 Powers* (2016) — Process Power via the outcome-feedback loop as the only real moat available; why B9 is the last thing cut (§12.4).

**Product and AI engineering**

- **Patrick Lewis et al.**, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020 — https://arxiv.org/abs/2005.11401 — retrieval yields "more specific, diverse and factual language"; the architectural basis for the cited-clause claim (§5).
- **Anthropic**, Citations documentation — https://platform.claude.com/docs/en/build-with-claude/citations — `cited_text` with source locations, the mechanism that makes "no uncited policy reference reaches the UI" a code-level invariant rather than a marketing adjective (§5).

**Phase-internal sources**

- `phase-1-ideation/IDEA_DOSSIER.md` — D1–D10, A1–A9, §6.5 Bullseye, §6.6 unit economics, §6.7 the 90-day plan, §6.8 the concierge playbook, §7.1 experiment design, §7.5 instrumentation and decision rules, §10.1 risk register, §10.2 gates, §12 next actions.
- `phase-1-ideation/research/03-gtm-pricing.md` — §4.1 channel scoring, §4.2 the three tests and their kill criteria, §4.3 BD, §4.4 Core Four, §6.4 unit economics, §7 what would make this plan wrong, §8 research gaps.
- `phase-2-build/identity/BRAND.md` — §2 voice and registers, §2.5 the urgency rule, §3 messaging hierarchy, §4 copy do/don't, §5.5 naming invariants, §6.1 pre-publish checklist, §7 flagged hypotheses.
- `phase-3-acquisition/research/channels.md` — the ranked channel table, the verbatim Amazon and Walmart forum rules, the unverified-rules gaps, the recurring thread patterns.
- `phase-3-acquisition/research/demand-seo.md` — the four previously-unseen free-tool competitors, the universal verbatim-citation gap, the Reason Code Index build order, the corpus-gapped codes held back.
- `phase-3-acquisition/research/partners.md` — 44 prospect rows across segments A–K, each with its own public source URL, plus the conflict-of-interest exclusions.
- `phase-3-acquisition/crm/CRM.md` — pipeline stages and their artifacts, the three postures, WIP limits, the weekly cadence, the six pre-send checks, the ethics controls.
- `phase-3-acquisition/crm/dashboard.md` — the weekly instrument and the threshold reference card reproduced in §11.
- `phase-3-acquisition/outreach/` — `community-playbook.md` (reply skeletons and posture map), `launch-posts.md` (the two channels that permit an announcement at all), `partner-sequences.md` (three-touch cadence, CAN-SPAM block), `newsletter-pitch.md` (media pitches built on the three assets we actually hold).
- `app/src/lib/db/schema.ts`, `app/src/app/_lib/case-store.ts` — read to establish the §2.1 instrumentation gap.

**Regulatory**

- **CAN-SPAM Act**, 15 U.S.C. §7704 — sender identification, non-deceptive subject, physical postal address, functioning opt-out; implemented as checks 1–4 in `crm/CRM.md §6.3` and applied to every draft in `outreach/`.
- **FTC Endorsement Guides**, 16 C.F.R. Part 255 — disclosure of material connections in any paid placement (`outreach/newsletter-pitch.md §1.5`). *Founder/counsel to confirm specific obligations before the first paid placement.*

---

**Document status:** operating runbook for Phase 3. It sequences decisions made in `IDEA_DOSSIER.md` and executes controls defined in `crm/CRM.md`; it originates neither. **Amendments require a named source or an explicit, dated founder decision recorded in that week's `dashboard.md` — and thresholds are never adjusted after seeing the result they would have failed.**
