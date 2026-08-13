# Clausewright — Founder CRM Operating Model

**Status:** operating model, not a record of activity. **Nothing in this system has been sent.** Every prospect row and every channel row is a candidate for founder review.
**Owner:** Founder (solo). No delegation exists in the 90-day window.
**Date:** 2026-08-13.
**Scope:** the two pipelines that carry Clausewright's inner-ring channels — the **partner pipeline** (Business Development, the dossier's reserve channel #1) and the **community pipeline** (Community Building, 21/25 in the Bullseye).

**Files in this system:**

| File | What it holds | Pipeline |
|---|---|---|
| `CRM.md` (this file) | Stage definitions, entry/exit criteria, cadence, hygiene rules, ethics controls | Both |
| `partners.csv` | Every partner prospect from `../research/partners.md`, one row per organization | Partner |
| `channels.csv` | Every community channel from `../research/channels.md`, one row per channel | Community |
| `dashboard.md` | Weekly review template tracking assumptions A1/A2/A3 against their falsification thresholds | Both |

---

## 0. Why this exists, and what it deliberately is not

Aaron Ross's *Predictable Revenue* (2011) makes one argument that survives translation to a solo founder and one that does not.

**What survives: the pipeline is a set of stages defined by what the *prospect* has done, not by how the founder feels about them.** Ross's core diagnostic is that most pipelines are fiction because stages are assigned by optimism ("warm," "hot," "interested") rather than by an observable, checkable event. Every stage below is therefore defined by an artifact that either exists or does not — a research note, a drafted message, a reply in an inbox, a signed arrangement, a first referred customer. If the artifact is absent, the row does not advance. This is the same discipline Eric Ries calls innovation accounting and the dossier already applies to the product (`IDEA_DOSSIER §7.5`): commit to the criterion before the experiment.

**What does not survive: role specialization.** Ross's central structural recommendation — split prospecting, closing and account management across different people — is unavailable to one person. The substitute is **time-boxing instead of role-boxing**: the week is partitioned so that partner work cannot cannibalize the community loop, which is the actual engine (`IDEA_DOSSIER` D8). See §5.

**What this is not:** it is not a CRM product, not an automation, and not a list to blast. There is no sending mechanism attached to any file here. The system stores four things — who, why they fit, what was researched, and what stage the evidence supports — and produces drafts for a human to read, edit, and send by hand.

---

## 1. Governing sources

Binding, in this order of authority:

1. `phase-1-ideation/IDEA_DOSSIER.md` — decisions D1–D10, assumption register A1–A9 (§6.7), the 90-day plan (§6.7), instrumentation and pre-committed decision rules (§7.5), the 14-day concierge playbook (§6.8).
2. `phase-1-ideation/research/03-gtm-pricing.md` — Bullseye scoring (§4.1), the inner-three test design and kill criteria (§4.2), BD as reserve channel #1 (§4.3), Core Four mapping (§4.4), unit economics (§6.4).
3. `phase-2-build/identity/BRAND.md` — voice (§2), copy do/don't (§4), naming rules (§5). All outreach drafts pass its §6.1 pre-publish checklist before they are queued for founder review.
4. `phase-3-acquisition/research/partners.md`, `channels.md`, `demand-seo.md` — the prospect and channel evidence these files are built from.

**Two economic constants govern every stage decision below** (`IDEA_DOSSIER §6.6`): contribution LTV ≈ **$355**, maximum sustainable CAC at 3:1 ≈ **$118**. BD is the only channel modelled below that ceiling with real cash cost (~$40–60 CAC) because each partner aggregates many suspension events. Community and Engineering-as-Marketing are ~$0 cash. Any partner arrangement whose expected cost per referred customer exceeds $118 is out of bounds without a founder decision that overrides D8's arithmetic in writing.

---

## 2. The partner pipeline

Seven stages. Each row in `partners.csv` sits in exactly one, recorded in the `stage` column. **All rows currently sit at `identified`.**

Ross's *Predictable Revenue* channel-partner logic is that partner cycles are long (4–8 weeks per `03-gtm-pricing.md §4.3`) and that this is a reason to *seed early and expect nothing early*, not a reason to push. The dossier's own sequencing is explicit: **BD seeds day 1, produces revenue day 60+.** A partner pipeline that shows movement in week 2 is more likely to be mis-staged than fast.

### 2.1 Stage definitions

| # | Stage | Entry criterion (what makes a row arrive here) | Exit criterion (what must exist to advance) | Evidence artifact | Typical dwell |
|---|---|---|---|---|---|
| 1 | **identified** | The organization appears in `../research/partners.md` with a name, a URL to its own public page, and a segment. Nothing more. | A named `fit_rationale` tied to a specific mechanism (they see the notice / they field the panicked call / a suspension halts their own operations), **plus** a `source_url` pointing at the organization's own public page. Rows without both stay here. | The `partners.csv` row itself | — |
| 2 | **researched** | Fit rationale and source URL are present and checked against the live page. | Three things confirmed from the partner's own public pages: (a) a **contact route** that is a business channel, not a person — contact form, partner-program application, published support address; (b) whether they run a **formal partner/affiliate program** (if so, that program's own process replaces cold email entirely); (c) no **conflict flag** — they do not themselves sell suspension-appeal or reinstatement services. Any conflict found moves the row out of the pipeline to `excluded`, not forward. | Notes in the row's `notes` field + `contact_page` populated or explicitly left empty | 1 session |
| 3 | **drafted** | Research complete; a `suggested_offer` shape is chosen from the menu in §2.3. | A message draft exists in `../outreach/` that passes **all six** checks in §6.3 (sender identity, non-deceptive subject, physical-address placeholder, opt-out line, brand pre-publish checklist, claim-traceability). The draft is written to the partner's stated channel — a partner-program application if one exists, a contact form message if not. | The draft file | 1 session |
| 4 | **contacted** | **The founder — not this system — has read the draft and sent it.** This stage cannot be entered by any automated step. | A reply, of any kind, from the organization. A non-reply never advances a row; it ages it (§4.3). | Date sent, recorded in `notes` | 4–8 weeks per `03-gtm-pricing.md §4.3` |
| 5 | **replied** | Any human response received, including a decline. | A **specific arrangement discussed in concrete terms**: which of the three offer shapes, what the partner gets, what triggers it, who tells whom. A friendly "sounds interesting, send more" is *not* an exit — it is the most common false-positive in a founder-run pipeline and it belongs in `replied`, not beyond it. | Thread summary in `notes` | 1–3 weeks |
| 6 | **agreed** | Terms agreed in writing by both sides — email is sufficient; a contract is not required at this size. | **First referred seller actually arrives** and is attributable to the partner (a partner code, a distinct landing path, or the seller naming the partner at intake). | Written agreement + tracking mechanism live | 1–4 weeks |
| 7 | **live** | A referred seller has arrived and been attributed. | *(terminal stage — but not permanent; see §4.4)* Rows here are reviewed monthly for referral volume. A partner producing zero referrals for 60 consecutive days moves to `dormant`. | First attributed session/customer | — |

**Terminal off-pipeline states** (recorded in `stage`, not a regression): `excluded` (conflict of interest, or the partner declined and asked not to be contacted again — the latter is honoured permanently), `dormant` (no referral volume for 60 days after `live`, or no reply 8 weeks after `contacted`).

### 2.2 The two rules that keep this pipeline honest

**Rule P1 — no stage is entered by inference.** "They opened the email" is not `replied`. "They said they'd think about it" is not `agreed`. Each stage names an artifact; without the artifact the row does not move. Ross's whole argument is that a pipeline is only useful if its stages are falsifiable.

**Rule P2 — the pipeline never overrides D8.** BD is a **reserve** channel. If partner work in any week exceeds its time box (§5) while the community reply count falls below A2's 8–15/day floor, partner work stops until the loop is back at cadence. The dossier's arithmetic kill shot is unambiguous: community and the free Decoder are the entire path to the first 10 customers, and partners produce revenue at day 60+, after those customers already exist.

### 2.3 The offer menu — three shapes, no fourth

Drawn from `../research/partners.md` and `03-gtm-pricing.md §4.3`. **The commercial terms inside each shape are founder decisions and are not set here** — no percentage, dollar figure, or exclusivity term appears in this system until a human sets it. Writing a number into a CRM file and then negotiating against it is how a placeholder becomes a promise.

| Shape | Structure | Fits which partner | Why |
|---|---|---|---|
| **Referral fee** | Pay-per-close, tracked by a partner code. | Upstream partners who field the panicked call first: bookkeeping/accounting firms, agencies, reimbursement services. | They see the event and have nothing to sell into it. The fee is the only mechanism that survives their client relationship being the primary one. |
| **Content collab** | Co-branded guide, newsletter placement, podcast appearance, or a linked reason-code page. | Adjacent-detect tools (monitoring, repricers) and media (newsletters, podcasts, YouTube). | These partners' audiences are broad; a co-produced explainer converts better than a referral link and costs neither side cash. Per `demand-seo.md §5.2`, the Reason Code Index pages are the natural link target — a partner links to the specific code page, not the homepage. |
| **Bundle** | Clausewright as a line item inside the partner's existing service, retainer, or onboarding flow. | Partners who already hold the account operationally: aggregators, 3PLs/prep centres, agencies that already monitor account health. | They have a per-account operating model already; adding a monitoring line item is a pricing change on their side, not a new sales motion. |

**The two-way referral, tracked separately.** `IDEA_DOSSIER §6.1` lever 2 names a distinct arrangement: competitors who honestly triage cases away (the ~6 refused categories) are counterparties for a *referral on refusals*, in both directions. This is structurally different from a channel partnership — the counterparty is a competitor — and it is **not** in `partners.csv`. It stays in the dossier until a founder decides to open it.

---

## 3. The community pipeline

Four stages. Each row in `channels.csv` sits in exactly one, recorded in the `stage` column.

This pipeline exists because the community channel has a failure mode that a partner pipeline does not: **posting into a channel before reading its rules can permanently remove the channel.** `03-gtm-pricing.md §4.2` names this "the single largest execution risk in the entire GTM plan" — Amazon's Seller Central forum guidelines escalate from warning to a 1–30 day posting suspension to permanent removal of posting privileges. The `rules-checked` stage is therefore not administrative tidiness; it is the control that protects the highest-relevance surface in the landscape.

### 3.1 Stage definitions

| # | Stage | Entry criterion | Exit criterion | Evidence artifact |
|---|---|---|---|---|
| 1 | **channel** | The channel appears in `../research/channels.md` (or `partners.md` Segment K) as a named community with a URL or a resolvable identity. No member data, ever — only the channel. | Nothing yet. Rows sit here until a human performs the rules read. | The `channels.csv` row |
| 2 | **rules-checked** | **A human has opened the channel's own rules — sidebar, wiki, pinned post, About tab, guidelines page — and read the self-promotion clause and the enforcement mechanism in full.** Secondary sources, listicles and inference do not qualify. | The rules are summarized in `self_promo_rule`, `rule_status` is set to `verified`, and a `posture` is recorded that the rules actually permit. A channel whose rules prohibit any promotion exits to posture `reputation-only` — that is a valid exit, not a failure. | `self_promo_rule` + `rule_status=verified` in the row |
| 3 | **active** | Posting has begun under the recorded posture, and the account has whatever standing the channel requires (some channels expect contribution history before any link is tolerated). | Sustained cadence: the channel is contributing to A2's 8–15 substantive replies/day, and reply→Decoder attribution is being recorded per reply. | Reply log with dates and attribution |
| 4 | **producing** | The channel has produced at least one attributable free-Decoder session. | *(terminal — reviewed against A2's kill criterion, §3.3)* | Attributed Decoder sessions |

**Off-pipeline states:** `out-of-scope` (deliberately deprioritized for v1 — e.g. the Discord cluster, per `channels.md §2.10`), `blocked` (rules prohibit the engagement entirely, or a moderator action has closed the surface).

### 3.2 The three postures

Every channel row carries exactly one. The posture is determined by the channel's rules, never by its size.

| Posture | What is permitted | Which channels |
|---|---|---|
| **reputation-only** | A complete, useful answer. No link anywhere — not in the reply, not in the profile. Never mention price. | Vendor-operated forums whose written rules categorically prohibit external links or service promotion: Amazon Seller Forums, Walmart Marketplace Seller Forum. |
| **reply-only, no link** | A complete answer in the reply body; a link may exist in the profile/signature only, and only where the channel's rules permit it. The free structure is offered by DM, not posted. | Reddit surfaces, pending the live rules read. This is the default for any channel whose rules have not been verified. |
| **operator-channel-only** | No member outreach at all. Approach the community's *operators* through their own published business channel about a sponsor/partner slot. | Paid/private forums that prohibit member pitching (eComFuel). |

**Default rule:** a channel at `rule_status=unverified` is treated as **reply-only, no link** at most, and is not posted to at all until it reaches `rules-checked`. When in doubt about a rule, the stricter reading governs.

### 3.3 The community kill criterion, pre-committed

From `03-gtm-pricing.md §4.2` Test A: **if 30 days of consistent posting yields fewer than 40 free-Decoder sessions attributable to community, Community demotes from the inner ring to the middle ring.** This is tracked weekly in `dashboard.md` §2 and is the only pre-committed decision rule attached to this pipeline. It is a threshold on *output*, not on effort — a month of diligent posting that produces 12 sessions still triggers the demotion.

A prerequisite the research flags and this pipeline must respect: **actual thread supply per channel is unmeasured** (`channels.md §5`). Nobody has counted how many fresh suspension threads appear per day per surface. If A2's 8–15 replies/day proves impossible because the threads do not exist, that is a finding about supply, not a failure of diligence, and it must be recorded as such in the dashboard rather than absorbed as guilt.

---

## 4. Pipeline hygiene

**4.1 One row, one stage, one owner.** Every row has exactly one stage. There is one owner. Stages are edited by hand, in the CSV, with the date noted in `notes`.

**4.2 No skipping.** A row cannot jump `identified` → `contacted`. If a partner replies to something that was never drafted here, the row is backfilled through the intermediate stages with their artifacts before it advances — otherwise the pipeline's stage counts stop meaning anything.

**4.3 Aging, not optimism.** A row at `contacted` with no reply after 8 weeks moves to `dormant`. It does not sit in `contacted` indefinitely making the pipeline look fuller than it is. One follow-up is permitted before that, no sooner than 14 days after the first message, and it must honour any opt-out. Two follow-ups is the ceiling; after that the row ages out and is not re-contacted in this cycle.

**4.4 Regression is normal and gets recorded.** A `live` partner who stops referring becomes `dormant`. An `active` channel whose moderators tighten rules returns to `rules-checked` or `blocked`. Backwards movement is information; hiding it is the failure.

**4.5 WIP limits, because the constraint is founder hours, not prospects.** At most **8 partner rows** in `drafted`+`contacted` simultaneously, and at most **2 channels** moving from `rules-checked` to `active` in any one week. Both limits are founder-set operating choices, not sourced numbers — they exist so that the reply loop, which is the engine, keeps its hours.

---

## 5. Weekly cadence

Ross's operating rhythm is a weekly pipeline review against a fixed metric set. Adapted to one person, with the dossier's daily loop (`IDEA_DOSSIER §6.8`) as the non-negotiable core:

| When | Block | Time | What happens |
|---|---|---|---|
| **Daily, morning** | **The loop** — the engine, protected first | 60–90 min | Morning sweep of the surfaces at `active` in `channels.csv`. 8–15 substantive replies (A2). Each reply: identify the reason code → quote the exact clause → name the one thing most sellers get wrong for that code → offer the free structure by DM. Log every reply → DM → Decoder session. Posture per channel is obeyed literally. |
| **Daily, end of day** | Attribution log | 10 min | Record the day's reply count, **seller-initiated DMs received**, and attributable Decoder sessions. This is the raw input to A2 and it cannot be reconstructed later. DMs we opened are not logged because there are none — `../outreach/community-playbook.md §5.3` prohibits opening a DM to anyone who posted about a suspension, without exception. |
| **Monday** | **Weekly review** | 45 min | Fill `dashboard.md` for the week just ended. Both pipelines' stage counts. A1/A2/A3 against thresholds. Decide: persevere / iterate / kill, using the pre-committed rules, not judgment. |
| **Tuesday** | **Partner research block** | 90 min, capped | Advance `identified` → `researched`. Verify contact routes and partner programs on live pages. Apply conflict flags. Never exceeds the cap; if the loop is behind, this block is what gets cut (Rule P2). |
| **Thursday** | **Partner drafting block** | 90 min, capped | Advance `researched` → `drafted`. Write outreach drafts for founder review. Run each through §6.3's six checks. **Nothing is sent from this block.** |
| **Friday** | **Founder send review** | 30 min | The founder reads each drafted message, edits it, and sends it by hand — or does not. This is the only step that moves a row to `contacted`, and it is deliberately a separate act on a separate day from drafting. |
| **Friday** | **Channel rules block** | 30 min | Advance `channel` → `rules-checked` for at most 2 channels/week. Read the actual rules. Record them verbatim where they are quotable. |
| **Monthly** | Partner + channel audit | 60 min | Age out stale rows (§4.3). Review `live` partners for referral volume. Re-read rules on any channel where enforcement behaviour has visibly changed. |
| **Continuous** | **Discovery calls** | 15 min per customer | Every paying customer gets a 15-minute call (`IDEA_DOSSIER §6.8`, §12 action 7). See §7. |

**The time budget in one line:** the loop is ~9 hours/week and is protected; partner work is capped at ~4 hours/week; review and rules work is ~2 hours/week. These are founder-set allocations, not benchmarks — the only sourced constraint is the ordering (D8: community and Engineering-as-Marketing first, BD reserve).

---

## 6. Ethics and compliance controls

These are binding on every row and every draft. They are not aspirations and they are not negotiable under revenue pressure.

### 6.1 Nothing is sent by this system

No file in `crm/` has a sending mechanism. Every outreach artifact is a **draft for founder review**. The transition to `contacted` is recorded only after a human has read the draft and sent it themselves.

### 6.2 Whose data may exist here

**Permitted:** businesses and public organizations, with contact information taken from their own public business pages — company sites, press pages, partner-program pages, published newsletters, published support addresses.

**Prohibited, without exception:** names, emails, handles, or any identifying detail of private individuals. This includes — and most importantly includes — sellers posting about their suspensions in forums. A person describing the worst week of their business life in public is not a lead.

**Consequences of that rule, applied here:**

- `channels.csv` records the **channel** — its rules, its size where published, its posture. It records **no member**, no handle, no post author, and no post content attributable to a person.
- `partners.csv` contains **no personal names**, including the names of agency founders, podcast hosts, or newsletter authors that appear in the underlying research. Where a partner's relevance depends on a person (a founder-hosted podcast, for instance), the row names the **show or company**, not the human. Contact routes are business forms and published business addresses only.
- Where a source published only a personal email, the field stays **empty** and the row notes that a business contact route must be located first.

### 6.3 The six checks every draft passes before it reaches founder review

A draft that fails any check does not get queued. Checks 1–4 implement CAN-SPAM (15 U.S.C. §7704); checks 5–6 implement the brand and the citation invariant.

1. **Sender identified** — Clausewright named by its legal/trading name, with a truthful description of who is writing and why.
2. **Non-deceptive subject line** — accurately describes the message. No manufactured urgency, no fake re-reply threading (`Re:` on a thread that does not exist), no impersonation.
3. **Physical postal address** — a valid physical address, present as an explicit `[PHYSICAL ADDRESS PLACEHOLDER]` token until the founder supplies the real one. A draft with a fabricated address is a compliance failure, not a typo.
4. **Working opt-out** — a clear, unambiguous opt-out line with a mechanism that will actually function. Opt-outs are honoured permanently and immediately; the row moves to `excluded`.
5. **Community rules compliance** — for any message touching a community, the message follows that channel's recorded rules, and the rules it follows are the ones in `channels.csv` at `rule_status=verified`. Where a partner program publishes its own application process, that process is used instead of cold email (`../research/partners.md` compliance note 3).
6. **Claim traceability** — every factual claim about Clausewright (price, tiers, guarantee, turnaround, what the Decoder shows) traces to `IDEA_DOSSIER.md` or `BRAND.md`. **No success rate, reinstatement rate, or outcome statistic appears in any draft** — the product has no audited outcome data and `BRAND.md §4.1` prohibits publishing one. No invented customer counts, no invented urgency, no adjectives standing in for evidence.

### 6.4 No fabricated data

Every row carries a `source_url` pointing at the organization's or channel's own public page. **Unverifiable fields stay empty** — an empty cell is a true statement about what is known; a plausible guess is not. Where the underlying research recorded conflicting figures (subscriber counts differing by up to 12× across secondary sources, per `channels.md §2.2`), the row records the conflict and marks confidence as `conflicting`, rather than averaging them into false precision.

### 6.5 The suspension-radar hypothesis stays out

`03-gtm-pricing.md §4.4` describes a cold-outreach idea — detecting publicly dark storefronts — and flags scraping feasibility, Amazon ToS, contact-data availability and CAN-SPAM/GDPR compliance as **all unverified**. It is not implemented here and no row in this system is derived from it. It remains a hypothesis requiring legal review before any data collection begins.

---

## 7. Discovery interviews as onboarding (The Mom Test)

`IDEA_DOSSIER §12` action 7 commits to 15–20 Blank-style discovery interviews with real suspended sellers, run as onboarding calls — the mechanism that closes what report 01 flagged as the largest evidentiary hole. Rob Fitzpatrick's rule governs the questions: **ask about their past, not your idea.**

Every paying customer gets a 15-minute call. The call is onboarding first and research second, and it is never a pitch.

**Questions that are about their life** (good):
- Walk me through the day the notice arrived. What did you do in the first hour?
- What had you already tried before you found us? What did that cost you — money and days?
- Who else did you ask? What did they tell you?
- What did you do about revenue while the account was down?
- Has this happened before? What happened then?

**Questions to never ask** (bad — they harvest compliments, not facts):
- Do you like the product?
- Would you pay for monitoring?
- Would you recommend us?

**What is recorded:** anonymised facts — reason code, days down, what they tried, what it cost, what they searched for, which channel they arrived through. **What is not recorded: anything identifying.** Customer identity lives in the payment system, not in this CRM. Notes are stored against a case reference, never a name.

**Outcome quotes and anonymised case studies require explicit permission** (`IDEA_DOSSIER §6.8`), asked for separately, after the outcome, with a clear no available.

---

## 8. Field definitions

### 8.1 `partners.csv`

| Column | Meaning | Rule |
|---|---|---|
| `segment` | Letter + label matching `../research/partners.md` segments A–K | Fixed vocabulary |
| `name` | Organization or show name | **Never a person's name** |
| `url` | The organization's own primary public page | Required |
| `contact_page` | Published business contact route — form, partner application, or published support address | Empty if not verified; never a personal email |
| `fit_rationale` | The specific mechanism that makes them a referrer or bundler | Must name a mechanism, not a category |
| `suggested_offer` | One of: `referral fee`, `content collab`, `bundle` (or a stated combination) | No commercial terms recorded here (§2.3) |
| `stage` | One of the seven stages, or `excluded`/`dormant` | One value only |
| `source_url` | The public page the row's claims came from | Required — a row without one is not `researched` |
| `notes` | Provenance, unverified fields, partner-program status, conflict flags, dates | Free text |

### 8.2 `channels.csv`

| Column | Meaning | Rule |
|---|---|---|
| `rank` | Priority rank from `../research/channels.md §1`, blank where the research did not rank it | — |
| `channel` | The community's name | Channel only — **never a member** |
| `type` | Subreddit / vendor-operated forum / Facebook group / independent forum / Discord / private paid forum | — |
| `url` | The channel's own address | Empty where the exact address was not confirmed |
| `est_size` | Size as published or as reported by a named secondary source | Empty where not published |
| `size_confidence` | `published`, `secondary-source`, `conflicting`, or `unpublished` | Never collapse conflicting figures |
| `activity` | Observed or reported activity level | — |
| `self_promo_rule` | Summary of the channel's self-promotion / external-link rule | Verbatim quotation preferred where the source was fetchable |
| `rule_status` | `verified` (read from the channel's own rules) or `unverified` | Only a human read sets `verified` |
| `posture` | `reputation-only`, `reply-only, no link`, `operator-channel-only` | Determined by rules, never by size |
| `stage` | `channel`, `rules-checked`, `active`, `producing`, `out-of-scope`, `blocked` | One value only |
| `source_url` | Where the rule or size claim came from | Required |
| `notes` | Verification gaps, relevance, sequencing | Free text |

---

## 9. Frameworks applied

- **Aaron Ross & Marylou Tyler**, *Predictable Revenue* (2011) — pipeline stages defined by prospect-side observable events rather than seller-side optimism (§0, §2); the long channel-partner cycle and seed-early/expect-late discipline (§2); the weekly pipeline review as the operating rhythm (§5). Role specialization is explicitly not adopted and is replaced by time-boxing (§0, §5).
- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — Bullseye ordering carried from `IDEA_DOSSIER` D8: Engineering-as-Marketing 22/25 and Community 21/25 are the inner ring; BD is reserve #1; every channel test carries a pre-committed kill criterion (§3.3, and `dashboard.md`).
- **Alex Hormozi**, *$100M Leads* (2023) — the Core Four mapped in `03-gtm-pricing.md §4.4`: post free content is the primary engine (the community loop and the Reason Code Index), warm outreach is the free-Decoder non-buyer list, cold outreach is the flagged-and-unvalidated suspension radar (§6.5), paid is capped. The lead-magnet rule — the free thing solves a complete narrow problem while making the next problem obvious — governs what the loop offers in §5's daily block.
- **April Dunford**, *Obviously Awesome* (2019) — the category frame ("a suspension defense copilot for Amazon and Walmart sellers") is fixed and every partner draft leads with it rather than with "AI POA generator," per D3 and `BRAND.md §1 Step 6`.
- **Rob Fitzpatrick**, *The Mom Test* (2013) — discovery interviews run as onboarding, asking about the customer's past rather than the product's appeal (§7).
- **Eric Ries**, *The Lean Startup* (2011) — innovation accounting: the metric and the decision rule are committed before the experiment, which is what `dashboard.md` operationalizes.

---

**Amendment rule, inherited from `IDEA_DOSSIER.md`:** changes to stage definitions, thresholds, or ethics controls require a named source or an explicit, dated founder decision recorded in `dashboard.md`. Thresholds are not adjusted after seeing the result they would fail.
