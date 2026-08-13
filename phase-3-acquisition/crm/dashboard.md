# Clausewright — Weekly Review

**How to use this file:** copy this template into `crm/weeks/YYYY-WW.md` every Monday and fill it in for the week that just ended. It takes about 45 minutes. Fill it in even when the week was bad — especially then; a dashboard that only gets updated in good weeks is a mood ring, not an instrument.

**The rule that makes it worth doing** (Ries, *The Lean Startup*, innovation accounting; `IDEA_DOSSIER §7.5`): **the thresholds below were committed before the measurements existed, and they are not adjusted after seeing a result they would fail.** If a threshold turns out to be wrong, it is changed deliberately, in writing, with a named reason, in §7 — never silently, and never in the same review that it would have triggered.

**Denominators are mandatory.** Every rate in this file is written as `numerator / denominator = rate`. A percentage without its `n` does not get recorded.

---

## Week of ______________ (week # ____ since day 1)

**Days elapsed since day 1:** ____ **Current month of the 90-day plan:** M1 / M2 / M3
**Hours worked on acquisition this week:** loop ____ · partner ____ · rules/review ____

---

## 1. The three assumptions under test

These are A1, A2 and A3 from the dossier's assumption register (`IDEA_DOSSIER §6.7`). They are here and the other six are not because these three are the ones that can be falsified inside the 90-day window and the ones the whole revenue model swings on. **A1 and A3 together were flagged in `IDEA_DOSSIER §12` action 6 as knowable within 30 days for under $2,000 — the entire model is a function of them.**

### A1 — Free → paid conversion

> **Assumption:** free-Decoder → paid converts at **8% (M1) → 9% (M2) → 10% (M3)**.
> **Basis:** Poyar/OpenView 2026, median free-to-paid = 8% (n=200), held flat as a conservatism buffer.
> **Dossier confidence: medium-low — the largest single swing factor in the plan.**
> **Measurement definition:** `preview → paid`, counted **only on sessions that reached a successful classification**. A paste that failed to classify is not in the denominator. (`IDEA_DOSSIER §7.5` primary metric.)

| Field | This week | Cumulative |
|---|---|---|
| Sessions reaching successful classification (denominator) | | |
| Paid conversions (numerator) | | |
| **Conversion rate** | ____ / ____ = ____% | ____ / ____ = ____% |
| Blended AOV | $ | $ |
| Rescue $149 / Rescue+Human $399 mix | ____ / ____ | ____ / ____ |

**Pre-committed decision rule — evaluated at n ≥ 100 classified sessions, not before:**

| Cumulative rate | Pre-committed action |
|---|---|
| **≥ 8%** | **Persevere.** The differentiator is being perceived. Hold the ladder, hold the paywall placement. |
| **3–8%** | **Iterate** on prompt, critique quality, or pricing — one variable at a time. |
| **< 4% at n ≥ 100** | Channel-level reading (`03-gtm-pricing.md §4.2` Test B kill criterion): **the problem is the offer or the paywall placement, not the channel. Fix the offer before spending anything.** |
| **< 3%** | **Pivot.** The differentiator is not perceived, and there is no cheaper price to retreat to that is not already AppealDesk's ground at $97. |

> **Both thresholds are hypotheses, not published benchmarks** — the dossier flags them as such. They are binding anyway, because a threshold that binds only when convenient does no work.

**n reached 100 yet?** ☐ No — rule not yet in force ☐ Yes, on ____________
**Reading this week:** ______________________________________________
**Action taken (or explicitly deferred, with reason):** ______________________________________________

---

### A2 — Community output

> **Assumption:** **8–15 substantive replies/day**, of which **10–20% reach the Decoder**.
> **Basis:** founder-capacity estimate. **No published benchmark exists.**
> **Dossier confidence: low — hypothesis.**
> **Known gap:** actual fresh-suspension-thread supply per channel has never been measured (`channels.md §5`). If the replies cannot be made because the threads do not exist, that is a finding about supply, and it gets recorded as such rather than absorbed as a personal shortfall.

| Field | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Week |
|---|---|---|---|---|---|---|---|---|
| Substantive replies posted | | | | | | | | |
| Seller-initiated DMs received (answered with the free structure) | | | | | | | | |
| Attributable Decoder sessions | | | | | | | | |

> **The DM row counts DMs the seller opened, never DMs we opened.** `community-playbook.md §5.3` is absolute: opening a DM to someone because they posted about a suspension is prohibited without exception. DMs-we-initiated is not a field in this instrument because the number is always zero.

| Field | This week | Cumulative (30-day window) |
|---|---|---|
| Replies/day, mean | | |
| Reply → Decoder rate | ____ / ____ = ____% | ____ / ____ = ____% |
| Decoder sessions attributable to community | | |
| Days of consistent posting so far | | |

**Per-channel breakdown** (rows at `active` in `channels.csv`):

| Channel | Replies | Attributable Decoder sessions | Posture obeyed? | Any moderator action? |
|---|---|---|---|---|
| | | | ☐ | |
| | | | ☐ | |
| | | | ☐ | |

**Pre-committed decision rule** (`03-gtm-pricing.md §4.2` Test A kill criterion):

> **If 30 days of consistent posting yields fewer than 40 free-Decoder sessions attributable to community, Community demotes from the inner ring to the middle ring.**

This is a threshold on **output**, not effort. A diligent month producing 12 sessions still triggers the demotion.

**30-day window status:** day ____ of 30 · attributable sessions to date: ____ / 40
**Capacity reading — was 8–15/day achievable, and if not, why:** ☐ yes ☐ no, founder hours ☐ no, thread supply ☐ no, moderation friction
______________________________________________

---

### A3 — SEM cost per click

> **Assumption:** **CPC $10**, range $6–15.
> **Basis: unverified — no keyword or CPC data was ever obtained.** Flagged in `IDEA_DOSSIER §6.7` and again in `demand-seo.md §7.1`.
> **Dossier confidence: low — measure in week 1 of the test.**
> **Standing constraints (D8):** paid search is a **capped measurement test, never the engine**. Hard cap **$1,500**. Test window **days 31–60**. Modelled SEM CAC ≈ $375 against a maximum sustainable CAC of ≈ $118 — 3.2× over the ceiling before the test starts. **The first 30 days spend zero cash on acquisition.**

**Test status:** ☐ Not started (before day 31) ☐ Running ☐ Killed ☐ Completed

| Field | This week | Cumulative |
|---|---|---|
| Spend | $ | $ ____ / $1,500 cap |
| Clicks | | |
| **Measured CPC** | $ ____ / ____ = $____ | $ ____ / ____ = $____ |
| Click → Decoder session rate | ____ / ____ = ____% | ____ / ____ = ____% |
| Revenue attributable to paid clicks | $ | $ |
| **Blended revenue per click** | $ ____ / ____ = $____ | $ ____ / ____ = $____ |

**Pre-committed decision rule** (`03-gtm-pricing.md §4.2` Test C):

> **Kill at $1,500 spent unless blended revenue per click ≥ $0.60** (i.e. CAC ≤ ~$118 at measured funnel rates).
> **Judge on blended revenue per click, never on Rescue conversion alone.**
> **Run this test to learn CPC, not to buy customers.** A measured CPC of $4–5 rather than $10 is a genuine finding that changes the model; a good week of conversions at a $10 CPC is not.

**Measured CPC vs. the $6–15 assumption:** ☐ inside range ☐ below ☐ above → **model implication:** ______________________________________________

---

## 2. Pipeline snapshots

### 2.1 Partner pipeline (`partners.csv`)

| Stage | Count | Δ this week | Notes |
|---|---:|---:|---|
| identified | | | |
| researched | | | |
| drafted | | | |
| contacted | | | |
| replied | | | |
| agreed | | | |
| live | | | |
| dormant | | | |
| excluded | | | |

**WIP check:** drafted + contacted = ____ (limit 8). ☐ within limit ☐ over — partner work pauses until it clears
**Drafts sent by the founder this week:** ____ **Rows aged to dormant this week:** ____
**Reminder:** the partner pipeline produces revenue at **day 60+**. Movement in week 2 is more likely mis-staging than speed.

### 2.2 Community pipeline (`channels.csv`)

| Stage | Count | Δ this week | Notes |
|---|---:|---:|---|
| channel | | | |
| rules-checked | | | |
| active | | | |
| producing | | | |
| out-of-scope | | | |
| blocked | | | |

**Channels moved to rules-checked this week:** ____ (limit 2/week)
**Any channel where the rules changed or enforcement behaviour shifted?** ______________________________________________

---

## 3. Secondary metrics

From `IDEA_DOSSIER §7.5`. Tracked, not decision-bearing on their own.

| Metric | This week | Cumulative | Note |
|---|---|---|---|
| Paste → successful classification rate | ____ / ____ = ____% | | A low rate here contaminates A1's denominator — check it before reading A1 |
| Classifier accuracy vs. golden set | | | |
| Rush-tier ($399) attach rate | ____ / ____ = ____% | | Feeds A4 price-mix |
| Median paste → preview latency | ____ s | | |
| Shield attach (accepted included 30 days) | ____ / ____ = ____% | | Feeds A5 |
| Discovery calls completed | | ____ / 15–20 target | `IDEA_DOSSIER §12` action 7 |

**Lagging, instrumented only (A7 — never used to make a decision this quarter):** self-reported submission and reinstatement at day 3 / 10 / 21. **n always reported.**

| | Day 3 | Day 10 | Day 21 |
|---|---|---|---|
| Responses (n) | | | |
| Self-reported submitted | | | |
| Self-reported reinstated | | | |

> **No success rate derived from this table is published anywhere** until it is audited and the sample is large enough to state honestly. `BRAND.md §4.1` prohibits publishing an outcome claim without one, and the prohibition holds even when the numbers look good.

---

## 4. Designated vanity metrics — deliberately not reported

`IDEA_DOSSIER §7.5` names these and the warning applies with unusual force here: **free drafts generated will look spectacular and mean nothing.**

- ☐ drafts generated — **not reported**
- ☐ page views — **not reported**
- ☐ waitlist size — **not reported**
- ☐ social followers, impressions, upvotes — **not reported**

If one of these appears in a weekly summary, it was smuggled in to make a bad week feel better. Remove it.

---

## 5. Ethics and compliance check

Tick every line. An unticked line is a stop, not a note.

- ☐ **Nothing was sent by any system.** Every message that went out this week was read and sent by the founder personally.
- ☐ **No individual's personal data** entered `partners.csv`, `channels.csv`, or any note. No names, emails or handles of private individuals — including any seller who posted about a suspension.
- ☐ **Every new row carries a `source_url`** to the organization's or channel's own public page, or the field it would have populated was left empty.
- ☐ **Every draft passed the six checks** (`CRM.md §6.3`): sender identified, non-deceptive subject, physical-address placeholder or real address, working opt-out, community-rules compliance, claim traceability.
- ☐ **Every opt-out received was honoured immediately and permanently**, and the row moved to `excluded`.
- ☐ **Every community post obeyed the recorded posture** for that channel. No link was posted in a `reputation-only` channel — not in a reply, not in a profile.
- ☐ **No unverified-rules channel was posted to.** Nothing went into a channel at `rule_status=unverified` beyond what the strictest reading of its rules would permit.
- ☐ **No outcome, success or reinstatement rate was claimed** anywhere — outreach, community reply, landing page, or call.
- ☐ **No manufactured urgency or scarcity.** Any scarcity statement made this week was rendered from a live count at render time, per `BRAND.md §2.5` rule 3.
- ☐ **No suspension-radar / storefront-scraping data** was collected. That hypothesis remains unvalidated and legally unreviewed (`03-gtm-pricing.md §4.4`).

**Any breach, near-miss, or moderator warning this week:** ______________________________________________
*(Record it even if nothing came of it. A near-miss on the Amazon forum is the single highest-value warning this system can produce.)*

---

## 6. What was learned — facts, not feelings

Fitzpatrick's *Mom Test* standard applied inward: record what people **did**, what it **cost them**, and what they **said unprompted**. Compliments are not data and do not go here.

**From discovery calls this week** (anonymised — reason code, days down, prior attempts, cost, channel of arrival; **no identifying detail**):

1.
2.
3.

**From community replies** (what sellers are actually asking, which reason codes recur, which of the three highest-value entry patterns showed up — unclear cause, clean-health deactivation, stuck escalation loop):

**From partner conversations** (what they said about where their clients currently go, unedited):

**Something that contradicted the plan this week:** ______________________________________________
*(If this is blank three weeks running, the review is not being run honestly.)*

---

## 7. Decisions

**Decisions taken this week, with the rule that triggered them:**

| Decision | Triggered by | Rule invoked | Reversible? |
|---|---|---|---|
| | | | |

**Any threshold changed this week?** ☐ No ☐ Yes → which, to what, and on what named source or explicit founder decision:
______________________________________________
*(Per `CRM.md` amendment rule: thresholds are never adjusted after seeing the result they would have failed. If that is what happened, write that sentence down here.)*

**Commitments for next week (three at most):**

1.
2.
3.

---

## Appendix — threshold reference card

| # | Assumption | Modelled | Falsification threshold | Pre-committed action | Evaluated when |
|---|---|---|---|---|---|
| **A1** | Free → paid conversion | 8% → 9% → 10% | **< 3%** | **Pivot** — differentiator not perceived, no cheaper price to retreat to | n ≥ 100 classified sessions |
| **A1** | " | " | **3–8%** | **Iterate** — prompt, critique, or pricing; one variable at a time | n ≥ 100 |
| **A1** | " | " | **< 4%** | **Fix the offer or the paywall placement — not the channel** (Test B kill criterion) | n ≥ 100 completed sessions |
| **A1** | " | " | **≥ 8%** | **Persevere** | n ≥ 100 |
| **A2** | Community output | 8–15 replies/day; 10–20% reach the Decoder | **< 40 attributable Decoder sessions after 30 days of consistent posting** | **Demote Community from the inner ring to the middle ring** | Day 30 of consistent posting |
| **A3** | SEM CPC | $10 (range $6–15), unverified | **$1,500 spent with blended revenue/click < $0.60** | **Kill the test** | At the $1,500 cap, days 31–60 |

**Standing constraints that no weekly result overrides:**

- Community and Engineering-as-Marketing are the entire path to the first 10 customers, at ~$0 cash (D8).
- Paid search is a capped measurement test. **The first 30 days spend zero cash on acquisition.**
- Maximum sustainable CAC ≈ **$118** at 3:1 against a contribution LTV of ≈ **$355**.
- BD seeds day 1, produces revenue **day 60+**. If the community loop falls below cadence, partner work stops (`CRM.md` Rule P2).
- The business exits day 90 as a **transactional business with a subscription seed** — 1.9–3.0% of month-3 revenue from subscription in all three scenarios (D5). A week where Shield MRR looks small is the plan working, not failing.

**Where the base case says you should be** (`IDEA_DOSSIER §6.7`, for orientation only — this is a model, not a target to manage toward):

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| Free Decoder sessions | 120 | 345 | 650 |
| Conversion | 8% | 9% | 10% |
| Paying customers | 10 | 31 | 65 |
| Total revenue | $1,990 | $6,238 | $14,167 |

The 10th paying customer is modelled to land **day 21–28**.
