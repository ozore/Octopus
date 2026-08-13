# Phase 3 Acquisition — Adversarial Review & Audit Log

**Reviewer:** Adversarial acquisition reviewer (agent), Phase 3.
**Date:** 2026-08-13.
**Scope:** every file under `phase-3-acquisition/` — `GTM_PLAYBOOK.md`, `crm/` (CRM.md, dashboard.md, partners.csv, channels.csv), `outreach/` (community-playbook.md, launch-posts.md, newsletter-pitch.md, partner-sequences.md), `research/` (channels.md, demand-seo.md, partners.md).
**Mandate:** six checks — personal data, source-URL verification, CAN-SPAM and channel-rule compliance, G-gate claim compliance, pricing exactness, threshold fidelity to the dossier. **Violations were fixed directly, not just reported.**

**Verdict: PASS, after 24 corrections.** No violation found was of the kind that would have caused harm on send — nothing was sent, no private individual's data was ever collected, no prohibited claim reached any draft. The corrections fall into three families: (1) **personal names of public business figures** carried in the research layer that the CRM layer had already deliberately stripped, creating an internal contradiction; (2) **six over-claims against live sources** found by re-fetching cited URLs; (3) **two internal contradictions** where one file's rule was violated by another file's copy.

---

## 0. Standing summary

| Check | Result | Corrections |
|---|---|---|
| 1. Zero personal data of private individuals | **PASS after fixes** — no private individual anywhere; 12 instances of *public business figures'* names removed for consistency with the repo's own stricter standard | 12 |
| 2. Every prospect/channel row has a real source URL; 10+ spot-checked | **PASS after fixes** — 12 URLs fetched; 2 verbatim rule quotes exact; 6 over-claims corrected; 1 dead URL handled; **0 rows deleted, with reasons** | 8 |
| 3. Outreach drafts satisfy CAN-SPAM and match recorded channel rules | **PASS** — all four elements present and correctly placeholdered; posture map matches verified rules exactly | 0 |
| 4. No claim violates the G-gates (no success rates, no time guarantee, no corpus marketing) | **PASS after fix** — zero asserted outcome claims; one self-contradicting guarantee check tightened | 1 |
| 5. Pricing exactly $149 / $399 / $49-mo | **PASS** — 100% consistent across all 12 files, zero variants | 0 |
| 6. Playbook thresholds match the dossier assumption table | **PASS** — every threshold traced to source; no invented or drifted number | 0 |
| Additional: internal consistency | **PASS after fixes** | 3 |

---

## 1. Personal data audit

### 1.1 The finding

**No private individual's data exists anywhere in this phase.** The binding prohibition — never collect names, emails or handles of private individuals, most importantly sellers posting about their own suspensions — is **fully honoured**, and honoured structurally rather than incidentally:

- `channels.csv` records **channels only** — rules, sizes, postures. No member, no handle, no post author, no post content attributable to a person. Verified row by row across all 15 rows.
- `partners.csv` records **organizations only**. Verified row by row across all 60 rows. Every `contact_page` value is a business form, a partner-program page, or a published support address (`support@smartscout.com`, confirmed in SmartScout's own site footer). **Zero personal email addresses.**
- `community-playbook.md §7` rule 11 prohibits quoting, screenshotting or reposting another seller's notice, post or handle **anywhere, even anonymised** — a stricter rule than the mandate requires.
- `community-playbook.md §7` rule 1 and `§5.3` prohibit opening a DM to anyone who posted about a suspension, without exception.
- The live thread titles quoted in `community-playbook.md §6` and `research/channels.md §3` are **title strings used as pattern examples with no author, handle, or link attached** — permitted, and correctly handled.

### 1.2 What was nonetheless wrong, and fixed

`research/partners.md` carried **nine personal names** of *public business figures* — agency founders, podcast hosts, newsletter authors — which the CSVs built from it had deliberately stripped, each CSV row saying so explicitly ("the host is named in the source research; no personal name is recorded here, per the ethics rule").

These are public business identities, not private individuals, and no contact detail was ever attached to any of them. **They were not a breach of the mandate.** They were a breach of the repository's own stricter recorded standard, `crm/CRM.md §6.2`:

> `partners.csv` contains **no personal names**, including the names of agency founders, podcast hosts, or newsletter authors that appear in the underlying research.

A standard that the research layer contradicts is not a standard. Because the names carried **zero operational value** — every contact route in the file is a business form — the conservative resolution was to bring the research layer up to the CRM layer's standard rather than write the exception down.

**Removed (12 instances across 2 files):**

| File | Instances | Replacement |
|---|---|---|
| `research/partners.md` rows 9, 12, 35, 37, 38, 39, 41, 43, 44 + Segment K note | 9 | Company or show name; "the operating company"; "group names only; no admin, owner or member is named" |
| `outreach/newsletter-pitch.md` lines 8, 49, 203 | 3 | "Better Advertising (Junglr podcast)", matching `partners.csv` |

**Also fixed:** `newsletter-pitch.md §1` rule 3 previously carved out an exception — *"Where a show's name contains a person's name, that is the show's name and is fine to use as such."* That carve-out is now closed and replaced with the repo-wide rule, plus an honest note that what the founder chooses to say in a message they personally send is their call at send time and simply is not written down here.

**Also added:** a new "How to read this table" bullet in `research/partners.md` stating the no-individuals rule at the top of the file, so the standard is visible where rows are written rather than only in the CRM doc.

**Row 35 (Billion Dollar Seller Network)** additionally had a person's name in its *URL field* ("via helium10.com / Kevin King's own channels"). Corrected to an empty, explicitly-unverified contact route — matching `partners.csv`, which had already handled it correctly.

---

## 2. Source-URL verification — 12 URLs fetched

Ten were required; twelve were fetched to cover both verbatim rule quotes and a spread of prospect types.

### 2.1 Verified exactly — no correction needed

| # | URL | Verified |
|---|---|---|
| 1 | `sellercentral.amazon.com/seller-forums/guidelines` | **Verbatim quote exact.** "Post links that send users to non-Amazon external websites, URLs, or hyperlinks. This includes commercial content such as advertising, promotions, or solicitations." Spam clause exact. Escalation exact: "Temporary suspensions may range from 1 to 30 days depending on the severity and nature of the violation"; "Multiple suspensions over time may lead to a permanent removal of posting privileges." |
| 2 | `marketplacelearn.walmart.com/guides/seller-forum-policy` | **Verbatim quote exact.** "You may not promote services, fundraisers, surveys or social media accounts." Plus the pricing/competitively-sensitive and coordinate-business-activities clauses, and the two-business-day moderator intervention. |
| 3 | `bqool.com/partners/` | Live partner-ecosystem page with a "Partner with BQool" call to action. Claim holds. |
| 4 | `mrjeffamz.com` | Competitor claim holds completely: suspension-appeal service, free "Analyze My Ban" classifier ("Paste Your Suspension Notice"), and per-category `/bans/*` pages including `section-3`, `dropshipping`, `ip-violation-trademark`. |
| 5 | `sellerx.com/about` | "Founded in Berlin in 2020… from an Amazon aggregator into a global brand builder." Aggregator identity confirmed. |
| 6 | `getida.com/contact-us/` | Contact form live; "A Global Leader in FBA Auditing & Reimbursements" confirmed. |
| 7 | `junglr.com` | Amazon PPC/marketing agency confirmed; no contact-page URL published, which is why `contact_page` was correctly left empty. |

**These two verbatim quotes are the highest-stakes claims in the entire phase** — they are the basis for the reputation-only posture protecting the two surfaces a link-bearing reply could close permanently (R2, the plan's top execution risk). Both check out word for word.

### 2.2 Over-claims found and corrected

| # | Source | Claim as written | What the live page actually shows | Fix |
|---|---|---|---|---|
| 8 | `sellersnap.io/partner-apply/` | "a published **application process** removes the cold-email step entirely"; `partner-sequences.md` instructed that Touch 1 "becomes the form's free-text field" | Page is live with a "Become a Partner" section but **no application form or submission field** | Claim softened in `partners.md` + `partners.csv`; instruction to confirm the real submission mechanism before drafting |
| 9 | `ecommercefuel.com/ecommerce-forum/` | "No ads or pitching posts, per the forum's own site" — recorded at **`rule_status=verified`, `stage=rules-checked`** | That wording **not found on the page**. Page confirms only a paid ($199–$299/mo), application-gated, professionally moderated forum. The "50,000+ searchable threads" figure **is** confirmed | **Downgraded to `rule_status=unverified`, `stage=channel`.** Posture left at `operator-channel-only` — it is the strictest reading and correct either way |
| 10 | `smartscout.com` | "publishes an annual Voice of the Amazon Seller survey" | Not present on the homepage. (`support@smartscout.com` **is** confirmed in the footer) | Flagged as unconfirmed; instruction to verify the survey is current before pitching a data collab built on it |
| 11 | `getida.com` | "25% of recovered funds, self-published" | Not on the fetched page | Marked unverified; "do not repeat it in any draft" |
| 12 | `sellerx.com/about` | "~465–600 employees across **5 continents**" | Page states **over 20 brands**, presence across **Europe, Asia and North America** (3). Employee figure is third-party, already correctly flagged | "5 continents" corrected; third-party attribution and the do-not-cite-in-outreach instruction retained |
| — | `junglr.com` | Source URL for the "Better Advertising" podcast row | Podcast not referenced on the homepage | Row annotated: locate the show's own page before advancing |

### 2.3 Dead URL — and why the row was **not** deleted

`thinkcascadia.com` returned **HTTP 404**; `avenue7media.com` returned a maintenance page. This is the Avenue7Media row.

The mandate says to delete rows that don't check out. **This row was deliberately retained**, and the reasoning is recorded in the row itself:

> It is a **do-not-contact exclusion guard, not a prospect.** Deleting it would not remove a risk — it would create one, by allowing the company to be rediscovered in a later research pass and mis-staged as a partner.

Both URL fields were **emptied** (per the no-fabricated-data rule), the 404 recorded, and re-verification required before the exclusion could ever be lifted. **No prospect row — no row capable of receiving outreach — failed verification, so no deletion was warranted anywhere in the file.**

`ledgergurus.com` returned HTTP 403 to automated fetch. That is a bot block, not evidence of non-existence, and is **not** grounds for deletion; recorded as inconclusive.

### 2.4 Source-URL coverage

Structural validation of both CSVs: **no malformed rows** (partners.csv 9 columns × 60 rows; channels.csv 13 columns × 15 rows).

Rows with an empty `source_url`, all legitimate:

- **partners.csv, 13 rows.** Eleven are `excluded` competitor do-not-contact entries whose provenance is `IDEA_DOSSIER §5.1` — an internal document, not a fetched page — correctly empty rather than fabricated. Two are `identified` prospects (Billion Dollar Seller Network, eCommerce Momentum) whose rows state they cannot advance to `researched` until a business page is located. `CRM.md §8.1` requires a source URL to reach `researched`, not `identified`. **Rule working as designed.**
- **channels.csv, 3 rows.** All at stage `channel`, none postable.

**Additional strictness fix applied:** the Extreme Commerce (~1.2M) and AMAZON Sellers & FBA Community (~296k) rows carried size figures in structured `est_size` fields with **no source URL at all**. The notes flagged them as unsourced, but the numbers still sat in a field that planning would read. Per "unverifiable fields stay empty," `est_size` and `size_confidence` were **emptied** and the figures moved into the notes as explicitly unsourced third-hand claims.

---

## 3. CAN-SPAM and channel-rule compliance — PASS, no corrections

### 3.1 CAN-SPAM (15 U.S.C. §7704)

The mandatory block in `partner-sequences.md §1`, pasted unchanged into every email draft and incorporated by reference in `newsletter-pitch.md §1` rule 1, contains all four elements:

| Element | Implementation | Verdict |
|---|---|---|
| **Sender identified** | `[FOUNDER NAME], founder, Clausewright` + `[LEGAL ENTITY NAME]` + truthful description of who is writing and why | ✅ |
| **Non-deceptive subject** | Explicit rules: no `Re:`/`Fwd:` on a non-existent thread, no fake personalisation, no urgency, no unsubstantiable numbers. Every subject line sampled across all 5 sequences and 6 templates accurately describes its message | ✅ |
| **Physical postal address** | `[PHYSICAL ADDRESS PLACEHOLDER — street, city, state, postal code]` — **placeholder, never fabricated.** The file states the reasoning: a fabricated address is a compliance failure; a token left in is a founder-review failure, "which is the cheaper of the two" | ✅ |
| **Working opt-out** | Present, plain-language, and **broader than the statute requires** — honoured "permanently and immediately," across every sequence and channel, with the row moving to `excluded` | ✅ |

Correctly scoped: the block appears in email drafts only. It is **absent from `launch-posts.md`, `community-playbook.md` and the Template E host-read script** — forum posts and ad reads are not commercial email, and adding it there would be noise, not compliance.

### 3.2 Channel-rule compliance

The posture map in `community-playbook.md §1` and `launch-posts.md §0` matches `channels.csv` exactly, and matches the two live-verified rule texts exactly. The controls are notably strict:

- **`reputation-only`** on both vendor forums: no link anywhere including profile and signature, no price, no name-drop, no DM offer. `launch-posts.md §0` records that **8 of 10 channels permit no launch post at all** and presents that as a finding rather than an obstacle to route around.
- **Unverified rules are treated as prohibitions** until a human reads them (`CRM.md §3.2`). Aspkin, which returned HTTP 403, is marked **do not post** rather than defaulted to permissive.
- **`operator-channel-only`** for eComFuel: no member outreach ever, operators only.
- `partner-sequences.md §0` Rule 2 routes Seller Snap, BQool and SmartScout through their own published programs **instead of** cold email.

No violation found.

---

## 4. G-gate claim compliance

### 4.1 No success rates — PASS, zero violations

A full-text sweep for asserted outcome claims (percentage-of-reinstatement patterns, "trusted by," customer counts, "X sellers helped") returned **only prohibitions, never claims.** Every hit was a rule forbidding the thing.

Stronger than compliance, the prohibition is used as *positioning*: `newsletter-pitch.md §0` opens by stating that every competitor arrives at a media buyer holding a success rate and that we are forbidden from doing so — then builds the pitch on the three assets actually held. `launch-posts.md` Post D is a 30-day update whose headline is *"no success rate — here's why."* `community-playbook.md §8` answers "what's your success rate?" with a refusal plus a checkable alternative.

Also correct: the prohibition extends to **competitors' rates** (`newsletter-pitch.md §1` rule 4, `launch-posts.md §6`) — pointing at someone else's unaudited number is still a comparative claim we cannot substantiate. And `dashboard.md §3` forbids publishing any rate derived from the A7 lagging table "even when the numbers look good."

### 4.2 No time guarantee — one contradiction, fixed

The gated 10-minute guarantee ("in your inbox in 10 minutes or it's free," `BRAND.md §3.4`, blocked by `ARCHITECTURE.md §9` G6 until the SLO-refund job runs in production) appears in **no draft anywhere.** Correct.

But `launch-posts.md` check 12 asserted **"No timing promise appears in any post"** — and `launch-posts.md` line 177 itself says "$399 with a human reviewing it same-day." The file contradicted its own checklist.

"Same-day human review" is the $399 tier's own scope of service in the `IDEA_DOSSIER §6.2` tier table, so it is claim-traceable and not the gated guarantee. The defect was the checklist's imprecision, not the copy. **Check 12 was rewritten** to name the gated guarantee precisely, permit *same-day* as the tier's described scope, and add the load-bearing condition:

> It is a **description, not a guarantee, and it carries no refund.** If same-day review cannot actually be staffed on day one, the word comes out of every draft before the first send rather than being honoured retroactively.

Cross-referenced to `community-playbook.md §7` rule 15, which already prohibits promising a turnaround on Amazon's or Walmart's behalf.

### 4.3 No corpus marketing — PASS, zero violations

No instance of "corpus of winning appeals," "proprietary corpus," or any claim about an asset not held. This is the `BRAND.md §1` UA3 constraint — L4 is **0 records at launch**, so the mechanism may be marketed and the asset may not.

`GTM_PLAYBOOK.md §5` handles it correctly and with unusual honesty: it records that Phase 3 research **narrowed** the claim, because four competitors already ship a free classifier that Phase 1 never surfaced, and states the defensible residue plainly — *"we show you the clause, not our paraphrase of it."* The `demand-seo.md §4.4` build order **holds back** `AMZ.SAFETY.GPSR` and `AMZ.OPS.DROPSHIP` — high-anxiety, actively-searched, commercially attractive pages — because the corpus's own gap fields are open. That is the invariant costing real traffic and being honoured anyway.

The "Reinstate" naming prohibition (D2) also holds: the name appears only in competitor and historical references, never as self-description.

---

## 5. Pricing exactness — PASS, zero corrections

Every price token in all 12 files was enumerated. **$149, $399 and $49/mo appear exactly and only in those forms.** No variant, no rounding, no "starting at," no fake anchoring, no discount, no "was/now" anywhere.

Every other dollar figure traces to a source:

| Figure | Meaning | Source |
|---|---|---|
| $97 | AppealDesk incumbent anchor | `IDEA_DOSSIER §5.1`, D4 |
| $1,250 / $3,500 | Consultant / attorney anchors — **the competitor's own published comparison table** | `IDEA_DOSSIER §6.2` |
| $355 / $118 | Contribution LTV / max sustainable CAC at 3:1 | `IDEA_DOSSIER §6.6`, `03-gtm-pricing.md §6.4` |
| $375 | Modelled SEM CAC, 3.2× over ceiling | same |
| $1,500 / $0.60 | SEM cap and kill threshold | `03-gtm-pricing.md §4.2` Test C |
| $299 | Appears **once**, as the prohibited example in "Not `$149 (was $299)`" | `BRAND.md §4.6` |

**Shield's description is correct and complete in both directions**, which is easy to get half-right: Shield at $49/mo **includes one Rescue appeal per year** (`IDEA_DOSSIER §6.2` Shield row) *and* **30 days of Shield are included with every Rescue appeal** (Rescue row, D6/M2 peak-end logic). Both statements appear together in `partner-sequences.md §1` and are used consistently in Sequences 3 and 5 and in `launch-posts.md` Posts A and B.

The M1 adverse-selection control also survives into the copy: `partner-sequences.md §0` Rule 5 forbids positioning Shield as the answer to a suspension already in progress, permitting it only for partners holding portfolios of healthy accounts.

---

## 6. Threshold fidelity — PASS, zero corrections

Every threshold in `GTM_PLAYBOOK.md §11` and `dashboard.md` was traced to its source. **No number is invented, drifted, or rounded.**

| Threshold | Playbook / dashboard | Dossier source | Match |
|---|---|---|---|
| A1 modelled | 8% → 9% → 10% | `§6.7` A1 (Poyar n=200) | ✅ |
| A1 persevere | ≥ 8% | `§7.5` | ✅ |
| A1 iterate | 3–8%, one variable at a time | `§7.5` | ✅ |
| A1 pivot | < 3% | `§7.5` | ✅ |
| A1 offer-fix | < 4% at n≥100 | `03-gtm-pricing.md §4.2` Test B | ✅ |
| A1 gate | n ≥ 100 classified sessions | `§7.5` | ✅ |
| A2 | 8–15 replies/day; 10–20% reach Decoder | `§6.7` A2 | ✅ |
| A2 kill | < 40 attributable sessions / 30 days | Test A | ✅ |
| A3 | CPC $10, range $6–15, unverified | `§6.7` A3 | ✅ |
| A3 kill | $1,500 spent, blended rev/click < $0.60 | Test C | ✅ |
| SEM window | days 31–60, cap $1,500, no top-up | Test C, D8 | ✅ |
| CAC ceiling | $118 vs contribution LTV $355 | `§6.6` | ✅ |
| PMF | ≥40% "very disappointed," at ≥40 customers | `§3.3`, `§12` action 8 | ✅ |
| Base case | 10 → 31 → 65 customers; 10th at day 21–28 | `§6.7` | ✅ |

Two properties worth recording because they are what makes the instrument real:

1. **Confidence labels travel with the numbers.** A1 is carried as "medium-low, largest swing factor," A2 as "low — hypothesis, no published benchmark," A3 as "unverified — no keyword data obtained." The playbook does not launder a hypothesis into a fact by restating it.
2. **Founder-set operating choices are labelled as such** and not dressed as sourced thresholds — the WIP limits (8 rows, 2 channels/week), the one-mention-per-channel-per-day ceiling, the time budget, and explicitly the $500 SEM mid-test checkpoint, which `GTM_PLAYBOOK.md §7` marks as "a founder-set operating choice, not a sourced threshold."

The apparent overlap between "3–8% iterate" and "<4% fix the offer" is **inherited from the two source documents, not introduced here**, and `GTM_PLAYBOOK.md §11` resolves it explicitly in its escalation rule (fix the offer before touching the channel; never both at once, per Ries's one-variable rule).

`GTM_PLAYBOOK.md §2.1` (gate **G6**, the instrumentation gate) is a genuine addition rather than a restatement — it records that the shipped app stamps citation attribution but carries **no acquisition-source field**, making A2's kill criterion and A3's test unmeasurable as built. That is a finding against the team's own product, raised before the first reply goes out. It is correct to keep and correctly labelled as blocking.

---

## 7. Corrections applied — complete list

| # | File | Correction | Family |
|---|---|---|---|
| 1–9 | `research/partners.md` | Nine personal names removed (rows 9, 12, 35, 37, 38, 39, 41, 43, 44 + Segment K note) | Personal data |
| 10–12 | `outreach/newsletter-pitch.md` | Three "Better Advertising with [name]" → "Better Advertising (Junglr podcast)" | Personal data |
| 13 | `outreach/newsletter-pitch.md` §1 rule 3 | Show-name carve-out closed; repo-wide no-individuals rule stated | Personal data |
| 14 | `research/partners.md` | New "no individual is named anywhere in this file" bullet added to the reading guide | Personal data |
| 15 | `research/partners.md` row 35 | Person's name removed from URL field; contact route marked unverified | Personal data |
| 16 | `research/partners.md` + `partners.csv` | Seller Snap "application process" softened — no form exists on the page | Over-claim |
| 17 | `research/partners.md` + `channels.csv` | eComFuel `rule_status` **verified → unverified**, `stage` **rules-checked → channel** | Over-claim |
| 18 | `research/partners.md` + `partners.csv` | SmartScout survey flagged as not found at cited URL | Over-claim |
| 19 | `research/partners.md` + `partners.csv` | GETIDA 25% fee marked unverified, "do not repeat" | Over-claim |
| 20 | `research/partners.md` + `partners.csv` | SellerX "5 continents" corrected to the page's own 3; "over 20 brands" added | Over-claim |
| 21 | `research/partners.md` + `partners.csv` | Junglr podcast row annotated — not referenced on junglr.com | Over-claim |
| 22 | `research/partners.md` + `partners.csv` | Avenue7Media URLs emptied (404); row retained with reasoning | Dead URL |
| 23 | `channels.csv` | Extreme Commerce + AMAZON Sellers & FBA Community: unsourced `est_size`/`size_confidence` emptied, figures moved to notes | No-fabricated-data |
| 24 | `crm/dashboard.md` + `crm/CRM.md §5` | "DMs sent" → "Seller-initiated DMs received"; note added that DMs-we-opened is not a field because the number is always zero | Internal contradiction |
| 25 | `outreach/launch-posts.md` check 12 | Guarantee check rewritten to distinguish the gated 10-minute SLO from the $399 tier's same-day scope | G-gate contradiction |

---

## 8. What this review did not find

Recorded because an audit that reports only problems is not an audit:

- **No sending mechanism** exists in any file. Every artifact is a draft; `contacted` can only be entered by a human act on a separate day from drafting.
- **No fabricated contact data.** Where a contact route was not found, the field is empty and the row says so — 13 partner rows and 3 channel rows hold empty fields rather than plausible guesses.
- **No averaged-away conflicts.** The r/AmazonSeller size figures differing by ~12× are recorded as `conflicting` rather than collapsed into false precision.
- **No suspension-radar data.** The cold-outreach storefront-scraping hypothesis is explicitly excluded pending legal review, and nothing in the phase derives from it.
- **No commercial terms pre-written.** `CRM.md §2.3` keeps every percentage and dollar figure out of the CRM until a human sets it, on the reasoning that a placeholder becomes a promise in a negotiation.
- **No vanity metrics.** `dashboard.md §4` names drafts generated, page views, waitlist size and followers as designated-not-reported.

## 9. Open items for the founder — not defects, but blocking

1. **G6 instrumentation** (`GTM_PLAYBOOK.md §2.1`) — acquisition-source stamping, the manual reply log, and the Sean Ellis question must ship **before the first reply goes out**, or A2 and A3 are unmeasurable and every threshold becomes decorative.
2. **Rules reads** — Reddit, Facebook, Sellers Ask Sellers, Aspkin, and now **eComFuel** (downgraded in this review) remain `unverified` and are prohibitions until a human reads them live.
3. **Seller Snap submission mechanism** — confirm how the partner program actually accepts enquiries; there is no form.
4. **Address and entity tokens** — `[PHYSICAL ADDRESS PLACEHOLDER]`, `[LEGAL ENTITY NAME]`, `[FOUNDER NAME]`, `[DECODER URL]` must be filled before any send. A draft that ships with a token intact is a founder-review failure.
5. **Same-day staffing** — if the $399 tier cannot be reviewed same-day on day one, that word comes out of every draft first.
6. **G2 legal review** remains open and blocks every revenue-taking motion.

---

**Review status:** complete. All violations found were fixed in place. The phase is internally consistent, source-traceable, and compliant with the binding ethics rules, the CAN-SPAM elements, the G-gates, and the dossier's assumption table.
