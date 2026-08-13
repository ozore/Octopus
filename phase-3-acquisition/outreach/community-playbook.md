# DRAFT — founder review required, nothing auto-sent

# Community Reply Playbook (A2)

**Status:** DRAFT. Every skeleton in this file is a template for a human to adapt and post by hand. **No reply, DM, or post is sent by any system in this repository.** Nothing here has been posted.
**Owner:** Outreach copywriter (agent), Phase 3.
**Date:** 2026-08-13.
**Governs:** the daily reply loop that carries assumption **A2** (`IDEA_DOSSIER.md §6.7`: 8–15 substantive replies/day, 10–20% reach the Decoder) and **D8**'s Bullseye ordering (Weinberg & Mares, *Traction*, 2015 — Community 21/25, Engineering-as-Marketing 22/25; paid is a capped measurement test only).

**Binding sources, in order of authority:**

1. `phase-1-ideation/IDEA_DOSSIER.md` — D8, A2, §6.8 the daily loop, §7.3 B2/B4 (the citation invariant), N10 (no success rates).
2. `phase-2-build/identity/BRAND.md` — §2 voice (P1–P5), §2.4 registers R-1/R-2/R-3, §3.5 the forum-reply surface spec (**R2: the reply must be completely useful if the link is never clicked**), §4 the copy do/don't table, §5.5 the seven naming invariants.
3. `phase-3-acquisition/research/channels.md` — the recorded per-channel rules. **A channel's recorded rule outranks anything in this file.**
4. `phase-3-acquisition/crm/CRM.md` §3.2 — the three postures; §6 the ethics controls.

---

## 0. The one sentence this playbook exists to enforce

> **The reply is the product demo. If it is not a complete answer on its own — if it needs a click, a DM, or a purchase to be worth having — it is not a reply, it is an ad, and it will be removed, correctly.**

This is `BRAND.md §3.5`'s **R2** restated as an operating rule. Per Hormozi's *$100M Leads* (2023), the "post free content" engine works because the free thing solves **a complete, narrow problem** while making the next problem obvious. The narrow problem a suspended seller has in the first hour is *"I don't know what I'm charged with."* That problem gets solved for free, in the thread, in public, with no link. The next problem — *"now write the document that answers it"* — becomes obvious by itself. We never have to say it.

Per `IDEA_DOSSIER §6.1` lever 6 and `BRAND.md §3.3`: a public thread where a stranger was helped for free is the strongest proof we can hold on day one, and the only proof we can accumulate before B9 produces measured outcomes. **Replies are the proof asset. Treat a reply that converts nobody as a success if it was genuinely useful.**

---

## 1. Posture map — read this before writing anything

Copied from `crm/CRM.md §3.2` and `research/channels.md`. **A channel that has not had its rules read by a human is treated as `reply-only, no link` at most and is not posted to at all until it reaches `rules-checked`. When a rule is ambiguous, the stricter reading governs.**

| Channel | Posture | Recorded rule | Rule status | What this playbook permits there |
|---|---|---|---|---|
| **Amazon Seller Forums** (sellercentral.amazon.com/seller-forums) | **reputation-only** | Verbatim: external links, "commercial content such as advertising, promotions, or solicitations," and "unsolicited links" are prohibited; enforcement escalates warning → 1–30 day posting suspension → permanent loss of posting privileges ([guidelines](https://sellercentral.amazon.com/seller-forums/guidelines)) | **verified** | Skeletons 1–8, **answer only**. No link, no name-drop, no price, no DM offer, no profile link. Nothing. |
| **Walmart Marketplace Seller Forum** (marketplacelearn.walmart.com/forum) | **reputation-only** | Verbatim: sellers are "prohibited from promoting services, fundraisers, surveys or social media accounts"; the forum may not be used to "coordinate business activities" ([policy](https://marketplacelearn.walmart.com/guides/seller-forum-policy)) | **verified** | Same as above. Skeleton 8 is the Walmart-specific one. |
| **r/FulfillmentByAmazon** | **reply-only, no link** | Subreddit rule text was not fetchable; `partners.md` Segment K records that both large seller subreddits confine affiliated/promotional content to a **single monthly Community Promotion Post** and ban it elsewhere on penalty of ban | **unverified — human must read the live sidebar/wiki first** | Answer in the reply. **Seller-initiated DM only** (§5). Link in profile only if the live rules permit it. Launch posts: monthly promo thread only, see `launch-posts.md`. |
| **r/AmazonSeller** | **reply-only, no link** | Same as above | **unverified** | Same as above. |
| **ASGTG (Facebook)** | treat as **reply-only, no link** | Group rules live inside the group; not fetchable. Secondary sources indicate FB-group self-promotion enforcement is looser than the vendor forums — **that is not a rule, it is a rumour** | **unverified** | Answer only until a human reads the pinned rules. No link, no mention, until then. |
| **My Silent Team (Facebook)** | treat as **reply-only, no link** | Not fetchable | **unverified** | Same. |
| **Sellers Ask Sellers** | treat as **reply-only, no link** | Footer "Guidelines" exists; content not retrieved | **unverified** | Same. Only forum found with a dedicated Walmart-suspension category — skeleton 8 belongs here once verified. |
| **Aspkin — Amazon Suspensions** | **do not post** | Site returned HTTP 403 to automated fetch; rules unread | **unverified — blocked** | Nothing until a human reads the posting guidelines. |
| **r/Flipping** | **reply-only, no link** | Reddit-wide default | **unverified** | Secondary sweep only. |
| **Discord servers** | **out of scope for v1** | Per-server; `channels.md §2.10` | n/a | Not posted to. |

**The asymmetry that sets priority:** the two vendor forums are where sellers paste the literal notice text, which makes them the **highest-relevance and highest-risk** surfaces simultaneously. `03-gtm-pricing.md §4.2` names a forum ban "the single largest execution risk in the entire GTM plan." So the rule is deliberately lopsided: **the forums get the best answers and zero commercial signal; Reddit and the Facebook groups carry whatever conversion volume the rules permit.**

---

## 2. The four-move reply architecture

Every skeleton below is the same four moves. Learn the moves, not the scripts — a script pasted twice is spam under Amazon's own definition ("copying and pasting the same post across a number of threads").

| Move | What it does | Register (`BRAND.md §2.4`) | Length |
|---|---|---|---|
| **M1 — Name the charge** | Convert their notice language into the actual reason code, in plain English. This is the single most valuable thing a stranger can do for them, and most sellers cannot do it for themselves. | R-2 Diagnosis | 1–2 sentences |
| **M2 — Show the governing text** | Quote the policy clause verbatim, name where it comes from, and link to the **platform's own public policy page** (not ours). | R-2 | 2–4 lines, quoted |
| **M3 — Name the one thing** | State the single thing a POA for this code most often fails on. One thing, not five. Five things is a lecture; one thing is help. | R-2 | 1–3 sentences |
| **M4 — Give them the next step they can take without us** | A concrete action they can do today, alone, for free. This move is what makes the reply complete under R2. | R-1 Triage | 1–2 sentences |

**Optional M5 — the soft mention.** Governed entirely by §5. Absent by default. Absent always on the vendor forums.

**The order is not decorative.** M1 before M2 because the seller cannot search for a clause they cannot name. M3 after M2 because the deficiency only makes sense once the requirement is on screen. M4 last because `BRAND.md` P5 says they are the hero — the reply ends with them doing something, not with us offering something.

---

## 3. The clause rule — this is the one that can embarrass us

**Never quote a policy clause from memory, and never paraphrase one as though it were a quotation.**

`BRAND.md §1 UA1` and `IDEA_DOSSIER §7.3 B4` make the citation invariant structural in the product: the UI renders a policy reference **only** if it originated in a Citations API `cited_text` object. A forum reply has no CI test behind it. So the discipline has to be manual and it has to be absolute:

1. Every `[CLAUSE]` slot in the skeletons below is filled by **copying the verbatim text out of the Decoder output or the corpus record for that code**, together with its source URL — never typed from recall.
2. If the corpus record for that code carries a `gap` flag (`AMZ.COC.SECTION3`'s governing text is login-gated; `AMZ.SAFETY.GPSR` and `AMZ.OPS.DROPSHIP` have open source gaps per `demand-seo.md §4.4`), **say so in the reply**. "The clause Amazon actually enforces here isn't on a public page I can point you at — here's the closest public statement, and here's what that means for your draft" is a stronger reply than a confident paraphrase, and it is the only honest one.
3. If you cannot produce a verbatim clause with a public source, **drop M2 entirely and post M1 + M3 + M4.** A three-move reply is fine. A fabricated quotation is a defect, not a shortcut.
4. Numbers get the same treatment. `demand-seo.md §2.2` row 30 records that the widely-circulated ">=200 Account Health Rating is healthy" figure is vendor-sourced and unverified, and the corpus deliberately omits AHR thresholds. **Do not repeat a threshold number in a reply unless the platform's own page states it.**

**Why this is worth the friction:** `demand-seo.md §0.3` found that *every* competitor page sampled — including the four free-classifier tools — paraphrases policy rather than quoting it with a checkable source. The verbatim clause is the only differentiator we hold on day one. A reply that paraphrases is a reply that looks exactly like the other fourteen answers in the thread.

---

## 4. The disclosure rule — always, everywhere, unprompted

**Affiliation is disclosed in every reply that mentions Clausewright in any form, and in every DM, without being asked.** Not in a footer. Not in a profile. In the message.

Approved disclosure lines (use the shortest one that fits):

- *"Disclosure: I build a paid tool in this space, so treat me as an interested party. Everything above is free either way."*
- *"Full disclosure — I run Clausewright, a paid product for exactly this problem. Nothing above requires it."*
- (In a DM the seller initiated) *"Before anything else: I'm the founder of Clausewright, which sells a paid appeal draft. I'm telling you that first so you can weigh what I say accordingly."*

**On the two vendor forums the question does not arise, because we never mention the product there at all** — so there is nothing to disclose and nothing to conceal. Reputation-only means the account is a person answering questions, and that is the whole of it.

If a moderator or a seller asks directly whether you sell something: **answer yes, immediately, in the thread.** Never in DM, never evasively. A concealed affiliation discovered later destroys the one asset this channel exists to build.

---

## 5. The soft-mention rule

A "soft mention" is the *only* permitted commercial signal inside a reply. It is defined narrowly on purpose.

### 5.1 What it is

One sentence, at the end, after a complete answer, that names what we do in descriptive terms and does not ask for anything.

Approved forms:
- *"I build a tool that does the clause-matching part of this automatically — happy to run your notice through it and send you back the structure, no charge, if that's useful. Either way the steps above are the same."*
- *"There's a free notice decoder I built that does step one of this for you. Say the word and I'll point you at it; if you'd rather not, everything you need is above."*

Prohibited forms — these are ads, not mentions:
- Anything containing a price, a tier name, or a discount.
- Anything with a call to action as its main clause (*"Check out…", "DM me and I'll…", "Link in bio"*).
- Anything that makes the preceding answer conditional (*"…and for the rest of it, …"*).
- Anything comparative about a competitor.

### 5.2 The five gates — all must be true

1. **The posture permits it.** Never on the Amazon or Walmart vendor forums. Never on any channel at `rule_status=unverified`.
2. **The answer above it is complete.** Delete the mention; if the reply is still worth posting, the gate passes. If deleting the mention makes the reply pointless, the reply was an ad.
3. **The disclosure is in the same message** (§4).
4. **Standing exists.** Per the Reddit-wide norm recorded in `channels.md §2.1` — weeks of non-promotional contribution before any promotional signal. A new account's first reply never carries a mention.
5. **Frequency ceiling.** At most **one mention per channel per day**, and never in consecutive replies in the same thread. A founder-set operating limit, not a sourced number — it exists because the failure mode is cumulative, not per-post.

### 5.3 The DM rule — the seller initiates, always

`IDEA_DOSSIER §6.8` describes the conversion mechanic as *"DM me, no charge."* Read it literally: **they DM us.**

- **Permitted:** inviting a DM in a public reply, on a channel whose rules allow it, and answering a DM the seller sent.
- **Prohibited without exception:** opening a DM to someone because they posted about a suspension. That is a DM ambush, it is the single most reputation-destroying thing available in this channel, and it targets a person having the worst week of their business life. See §7.
- In any DM, the first line is the disclosure (§4), the second is the free thing, and the price is not mentioned until they ask or until the free structure has actually been delivered.

---

## 6. The eight reply skeletons

Each skeleton maps to a recurring thread pattern recorded in `channels.md §3`, cross-checked against live thread titles found there, and to a code in the shipped taxonomy (`app/corpus/taxonomy.json`, 33 codes + `UNCLASSIFIED`).

**Slot tokens used throughout:** `[CLAUSE]` = verbatim policy text from the corpus record, with its source URL (§3). `[CODE]` = the plain-English name of the reason code. `[THEIR WORDS]` = a short phrase quoted from their own post, so the reply is visibly not a macro. `[SOURCE URL]` = the platform's own public policy page.

---

### Skeleton 1 — Linked / related account deactivation
**Pattern:** `channels.md §3` #1. Live example title: *"Account deactivated for 'relation' to violating account."*
**Code:** `AMZ.COC.LINKED` — `triage_disposition: human_tier`, `severity_band: judgment_required`. **This is not a case the machine drafts alone.** The reply must not imply a one-click fix exists.
**Why this pattern is the highest-value entry point:** per `channels.md §3`, patterns 1, 2 and 5 are the cases where a generic forum answer helps least, because the seller does not yet know their own reason code.

> **M1.** That wording — [THEIR WORDS] — is the related-accounts notice, not a performance one. Amazon is saying it believes your account is connected to another selling account that was already enforced against. That distinction matters, because the appeal for it is an identity-and-separation argument, not a "here's how I'll improve" argument.
>
> **M2.** The governing text is here — [CLAUSE] ([SOURCE URL]).
>
> **M3.** The one thing these appeals most often miss: they argue about the *other* account instead of documenting the *separation*. If you don't know which account Amazon means (most people in your position don't), the appeal still has to make the separation checkable — the business entity, the bank and deposit details, the physical address, the devices and networks used, and who has ever had access to your credentials. Amazon is looking for a reason to believe the link is wrong or ended; it is not looking for a character reference.
>
> **M4.** Today, before you write anything: pull the documents that establish who you are and where you operate — business registration, a bank statement matching the deposit account, a utility bill matching the address. If any of them names someone who has ever sold on Amazon, you want to know that before Amazon tells you.

**Per channel:** vendor forums — post as written, stop at M4. Reddit/FB — M5 optional if all five gates pass; this is a `human_tier` code, so the mention must say so: *"the tool I build won't auto-draft this one — linked-account cases get routed to a person for exactly the reason above."* That sentence is both true and better proof than a pitch.
**Never say:** that you can tell them which account it is; that there is a standard template; anything implying the other account can be argued away.

---

### Skeleton 2 — Deactivated with a clean Account Health score
**Pattern:** `channels.md §3` #2. Live example: *"Account Deactivated Without Violations! Perfect Account Health, ZERO violations noted."*
**Code:** `UNCLASSIFIED` / ambiguous notice — the first-class routing target in `IDEA_DOSSIER §7.3 B2` and the exact case `BRAND.md §2.4 R-3` was written for.
**Register:** R-3 Consequence. Slowest and plainest. This seller has been told nothing and is filling the silence with fear.

> **M1.** A clean health score and a deactivation are not a contradiction, unfortunately — several enforcement paths don't post a violation to the dashboard at all, which is why yours looks empty. The first job isn't drafting; it's working out which notice you actually got, because the appeal is completely different depending on the answer.
>
> **M2.** [CLAUSE, if a governing text is identifiable from their quoted notice — otherwise omit M2 entirely and say so:] I can't point you at a specific clause yet, because the text you quoted doesn't name one. That's information, not a dead end.
>
> **M3.** The one thing that sinks these: guessing. A Plan of Action written against the wrong reason code reads as evasive to the reviewer, and you have a small number of attempts. If two readings of your notice are both plausible, the answer is not to pick the more flattering one.
>
> **M4.** Two things you can do today. Copy the notice out in full, including the header and any Account Health banner — the identifying phrase is usually in a part people trim before posting. Then check whether the message is in Performance Notifications, the Account Health dashboard, or email; where it arrived narrows what it is.

**Per channel:** identical everywhere. This skeleton is the strongest reputation-only reply we have and needs no commercial signal at all.
**Never say:** a guess dressed as a diagnosis; "this is probably X" without the notice text; any reassurance about likelihood.

---

### Skeleton 3 — Restricted product / "evasive behaviour" claim
**Pattern:** `channels.md §3` #3. Live example: *"Amazon Account Deactivated: Restricted Product & Evasive Behavior Claim."*
**Codes:** `AMZ.SAFETY.RESTRICTED` (`draft`) combined with a conduct allegation. The combination is what makes it hard.

> **M1.** You've actually got two charges in one notice, and most replies you'll get here will only answer the first. [THEIR WORDS] is the restricted-product part. The "evasive behaviour" part is a separate, more serious allegation — that something was done to get around the restriction rather than to comply with it.
>
> **M2.** The restricted-products policy text is here — [CLAUSE] ([SOURCE URL]).
>
> **M3.** The one thing that gets these rejected: answering only the listing. A Plan of Action that explains the product and never addresses the conduct allegation reads, to the reviewer, as confirmation of it. Both charges get answered, in that order, and the conduct one gets the longer answer.
>
> **M4.** Before you draft: pull every listing you've had in that category, note which ones were edited, relisted, or created under a variant, and get the dates. If the evasion claim is based on a listing pattern, you need to be able to describe that pattern yourself, accurately, before the reviewer describes it for you.

**Never say:** anything that characterises Amazon's detection as wrong or automated-and-therefore-stupid (`BRAND.md §2.3` Respectful — they have to work with Amazon tomorrow); any advice that could be read as helping conceal a listing history.

---

### Skeleton 4 — Category-level suspension, rest of the account healthy
**Pattern:** `channels.md §3` #4. Live example: *"Book Category Suspended – Account Health Still Great – Need Advice."*
**Note:** `N9` excludes listing-level appeals from scope; a category-level action is account-adjacent and is answered, but the reply should not pretend the account-level playbook maps cleanly onto it.

> **M1.** Category-level actions run on a different track from account-level deactivations, which is why your health score is untouched. The good news is your account isn't in the queue. The awkward news is that the appeal is narrower and more evidentiary than a general POA — it's about the goods and the supply chain in that category, not about your operation as a whole.
>
> **M2.** [CLAUSE] ([SOURCE URL]).
>
> **M3.** The one thing that decides these: sourcing documentation that matches the specific ASINs named, not your supplier relationship in general. Invoices that cover the right items, the right dates, and a supplier that can be checked. A letter of authorisation without matching invoices is the most common near-miss.
>
> **M4.** Today: line up the invoices against the exact ASINs in the notice and mark every gap. Where the paperwork doesn't cover an item, you want to know that now, because the honest answer ("we stopped sourcing that line in March, here's the record") is workable and the missing-paperwork answer discovered mid-appeal is not.

---

### Skeleton 5 — Stuck in the appeal loop / can't reach a human
**Pattern:** `channels.md §3` #5. Live example: *"I need to speak with an Account Health Specialist regarding a deactivated seller account."*
**Note:** this pattern maps directly onto **UA2**, the human-backstop value theme (`BRAND.md §1 Step 3`). It is the pattern where a soft mention is most tempting and most likely to read as opportunistic. Hold the line: the answer has to be genuinely useful about *their* escalation, not about our tier.

> **M1.** What you're describing is a rejection loop, not a new violation — the same submission going back with the same gap in it. The reviewer's rejection language is the most useful text you have right now, and most people delete it.
>
> **M2.** [CLAUSE — the appeal/escalation route, quoted from the platform's own public page] ([SOURCE URL]).
>
> **M3.** The one thing that breaks the loop: changing the *content* of the submission, not the tone of it. Resubmitting the same plan with a more apologetic opening is the most common thing people do and the least likely to work. Compare the rejection wording against your plan line by line and find the thing it says is missing.
>
> **M4.** Line up the three things a reviewer is looking for and check your last submission against them honestly: a root cause that names a specific failure in your process, corrective actions already completed with dates, and preventive measures that are measurable rather than aspirational. "We will be more careful" is the single most common preventive measure and it is not one.

**Warning:** `demand-seo.md §2.3` row 37 records that competitor content circulates escalation tactics (executive-email routes, external complaints) with **no checkable source**. **Do not repeat those in a reply.** If someone else in the thread suggests them, do not argue; just don't amplify.

---

### Skeleton 6 — Performance-metric suspension (ODR, late shipment, cancellation, tracking)
**Pattern:** `channels.md §3` #7.
**Codes:** `AMZ.PERF.ODR`, `AMZ.PERF.LSR`, `AMZ.PERF.PCR`, `AMZ.PERF.VTR` — all `draft`, all `standard`. Per `demand-seo.md §4.3` these are the cheapest codes to cite correctly, because the governing text is short and public. **This is the skeleton to use most often while building standing in a new channel.**

> **M1.** This is a metrics-threshold action, which is the most mechanical kind to appeal — the standard is published, your number is measurable, and the argument is arithmetic rather than interpretation. That's genuinely better news than most notices in this forum.
>
> **M2.** The published standard is here — [CLAUSE] ([SOURCE URL]).
>
> **M3.** The one thing these are rejected for: a plan with no numbers in it. The reviewer is looking at a metric, so the response has to be in the same units — the current figure, the orders that drove it, what changed on which date, and the figure you expect the change to produce. Every unquantified sentence is a sentence that does nothing.
>
> **M4.** Pull the order-level report behind the metric and find whether the defects cluster — one SKU, one carrier, one week, one fulfilment change. Suspensions of this kind almost always have a cluster, and a root cause that names the cluster beats a root cause that names your intentions.

**Note on numbers:** do not state the threshold value unless it is on the platform's own page and you are quoting it (§3.4).

---

### Skeleton 7 — The refusal reply (counterfeit, IP/trademark/copyright/patent, fraud)
**Pattern:** `channels.md §3` #6 and #9–10.
**Codes:** `AMZ.AUTH.COUNTERFEIT`, `AMZ.IP.TRADEMARK`, `AMZ.IP.COPYRIGHT`, `AMZ.IP.PATENT`, `AMZ.COC.FRAUD` — all `triage_disposition: refer_out`, `severity_band: counsel_referral`.
**This skeleton exists because honest triage is proof lever 2** (`BRAND.md §3.3`; `IDEA_DOSSIER §6.1`) — the strongest trust lever available in a category where every competitor claims a success rate. **Saying "not this one" in public, at the cost of a sale, is the most persuasive thing we can do.**
**Register:** R-3. No apology theatre, no upsell.

> **M1.** A rights-owner complaint isn't the same animal as a policy suspension, and the difference matters more than anything else you'll read in this thread. What resolves it is usually the complainant retracting, not Amazon being persuaded.
>
> **M2.** [CLAUSE — the platform's own published process for rights-owner complaints] ([SOURCE URL]).
>
> **M3.** The one thing I'd say plainly: this is the category where a well-written appeal does the least work, because the decision often isn't Amazon's to make. If there's any real question about authorisation, chain of custody, or whether the mark is being used correctly, that is a question for someone qualified to answer it — and I'm not, and neither is a drafting tool.
>
> **M4.** Two things today: read the complaint carefully for what is actually alleged (a trademark complaint and a counterfeit complaint are different claims with different resolutions), and find out whether the complainant is reachable. A retraction request that is polite, specific and early beats an appeal in a large share of these.

**Per channel:** identical everywhere, including the vendor forums. **A soft mention is prohibited on this skeleton on every channel** — attaching a commercial line to a refusal is how a trust lever becomes a bait-and-switch. If they ask what we do, the honest answer is: *"we route these out rather than drafting them; if you want, I can tell you what the notice is actually charging, and that's it."*
**Never say:** the name of a specific attorney or firm as a paid referral without disclosing the arrangement. `IDEA_DOSSIER §6.1` lever 2 contemplates referral fees on refusals; **an undisclosed paid referral inside a "we're being honest with you" reply is the exact contradiction that destroys the lever.** If a fee arrangement ever exists, the reply says so in the same sentence.

---

### Skeleton 8 — Walmart: unauthorised-to-sell-brand, or unexplained suspension
**Pattern:** `channels.md §3` #8. Live examples from Sellers Ask Sellers: *"You're not authorized to sell your brand," "Walmart Account Suspended," "Account Suspension – No Option to Appeal."*
**Codes:** `WMT.PERF.STANDARDS`, `WMT.PERF.ODR` (`draft`), `WMT.COC.CONDUCT`, `WMT.TRUST.SAFETY`, `WMT.AGREEMENT.RETAILER` (`human_tier`).
**Why this skeleton is worth disproportionate effort:** `demand-seo.md §4.2` records that Walmart appeal content is materially thinner than Amazon's — no law-firm-grade content operation occupies it. A genuinely good Walmart answer stands out in a way an equally good Amazon answer cannot.

> **M1.** Walmart's suspension notices name the standard far less specifically than Amazon's do, so the first job is working out which of the published tracks you're on: a performance-standards action, a Code of Conduct action, a Trust & Safety action, or a Retailer Agreement issue. [THEIR WORDS] reads like [best reading], but I'd want the full notice text before I'd bet on it.
>
> **M2.** The published standard is here — [CLAUSE] ([SOURCE URL — marketplacelearn.walmart.com or Walmart's own policy page]).
>
> **M3.** The one thing to build the response around: Walmart asks for a written business plan of action describing the violation and the steps you'll take. "Describing the violation" is doing real work in that sentence — a plan that never states plainly what happened reads as though you don't know, and that is the version that comes back.
>
> **M4.** Set your expectations on timing before it becomes a second source of stress: Walmart states appeals are handled in the order received and doesn't commit to a turnaround. That's not your appeal going badly; it's the published process.

**Per channel:** the Walmart vendor forum is `reputation-only` and its rule names "promoting services" outright — **no mention, ever, there.** Sellers Ask Sellers has the only dedicated Walmart-suspension category found, and its rules are unverified — answer only, until read.

---

## 7. The never-do list

These are not preferences. A violation is a defect (`BRAND.md §4`), and several are also channel-fatal.

| # | Never | Why |
|---|---|---|
| 1 | **Never open an unsolicited DM to someone who posted about a suspension.** The seller initiates, always. | A person describing the worst week of their business life in public is not a lead (`CRM.md §6.2`). This is the binding ethics rule of the whole phase, and a DM ambush breaks it more directly than anything else available. |
| 2 | **Never create a second account, an alt, or a persona.** One account, one identity, everywhere. | Astroturfing. Also an immediate ban on most of these channels, and unrecoverable. |
| 3 | **Never have one account answer and another account endorse it.** No self-upvoting, no coordinated agreement, no asking anyone to vouch. | Same. There is no small version of this. |
| 4 | **Never conceal affiliation.** Disclose in the message, unprompted, every time the product is mentioned (§4). | The channel's entire value is that a stranger was helped for free and said so honestly. |
| 5 | **Never post a link on the Amazon or Walmart vendor forums** — not in the reply, not in the profile, not in a signature. | Written, verified rules. Enforcement escalates to permanent loss of posting privileges (`channels.md §2.3`). |
| 6 | **Never post to a channel at `rule_status=unverified`** beyond a plain answer, and never at all where rules could not be read (Aspkin). | `CRM.md §3.2` default rule; stricter reading governs. |
| 7 | **Never paste the same reply twice.** | Amazon's guidelines define this as spam explicitly. It is also the tell that the answer isn't about them. |
| 8 | **Never quote a policy clause from memory or paraphrase one as a quote** (§3). | The one differentiator we hold. |
| 9 | **Never state a success rate, reinstatement rate, or outcome statistic** — ours or anyone's. | N10 / R11 / `BRAND.md §4.1`. We have no audited outcome data. |
| 10 | **Never mention price unasked** (`BRAND.md §3.5`). | Panic purchase; a price in an unsolicited answer converts help into a sales call. |
| 11 | **Never quote, screenshot, or repost another seller's notice, post, or handle anywhere** — not as a case study, not as an example, not anonymised. | `CRM.md §6.2`. The channel research records channels, never members; the reply loop follows the same rule. |
| 12 | **Never disparage a competitor**, and never answer "is X any good?" with criticism. | `BRAND.md §4.6`. The approved Step 7 sentences are non-disparaging by construction; use those or say nothing. |
| 13 | **Never argue with a moderator in public.** Take the removal, read the rule again, and adjust the posture in `channels.csv`. | The surface is worth more than the post. |
| 14 | **Never post a refusal skeleton with a commercial line attached** (§6, Skeleton 7). | Turns the strongest trust lever into a bait-and-switch. |
| 15 | **Never promise a timeline on the platform's behalf** ("you'll hear back in 48 hours"). | Amazon and Walmart commit to no turnaround; `BRAND.md §4.7`. |
| 16 | **Never reply just to be first.** If you have nothing specific, don't post. | P2. A generic reply costs standing and gains nothing; the daily count in A2 measures *substantive* replies, and inflating it corrupts the only metric this channel has. |

---

## 8. The four questions you will actually get, and the answers

These are the moments where the playbook either holds or leaks.

**"Does it work? / What's your success rate?"**
> *"I don't publish one, and I'd be careful with anyone who does — nobody in this category can audit those numbers, including me. What I can show you before you spend anything is the exact clause your notice is charged under and what your draft is still missing. Judge it on that."*
(`BRAND.md §4.1`; N10/R11. This answer is not a dodge — per `BRAND.md §0` it is the position.)

**"How much is it?"**
> *"$149 for the draft; $399 if you want a person to review it the same day. The decode and the critique are free and don't need an account."*
(Stated plainly, once, only when asked. No tier ladder, no comparison, no discount. `BRAND.md §4.7`: name the thing, name the price.)

**"Are you selling something?"**
> *"Yes — [disclosure]. The answer above stands whether or not you ever use it."*
(Immediately, in-thread, never in DM.)

**"Can you just do mine?"**
> *"Send it over and I'll tell you the reason code and the clause for free. If you want the full draft after that, it's paid — but the free part is genuinely the free part."*
(Only on channels whose posture permits; on the vendor forums the answer is the diagnosis itself, in public, and nothing else.)

---

## 9. Logging — the part that makes A2 falsifiable

Per `CRM.md §5` and Ross's *Predictable Revenue* pipeline discipline (stages defined by observable artifacts, never by optimism), log at the end of each day — it cannot be reconstructed later:

| Field | Note |
|---|---|
| Date, channel, skeleton used | Skeleton number, so weak skeletons are identifiable rather than blamed on the channel |
| Substantive replies posted | The A2 numerator. A reply that skipped M1–M3 is not substantive; do not count it |
| Threads found vs. threads answered | Measures **thread supply**, the unmeasured prerequisite `channels.md §5` flags. If A2's 8–15/day is impossible because the threads don't exist, that is a finding about supply, not a failure of diligence |
| Seller-initiated DMs received | Never DMs sent — that number should always be zero (§5.3) |
| Attributable Decoder sessions | The A2 denominator's other half |
| Removals / moderator actions | Any removal returns the channel row to `rules-checked` and the rule gets re-read (`CRM.md §4.4`) |

**Pre-committed kill criterion, from `03-gtm-pricing.md §4.2` Test A:** *fewer than 40 community-attributable free-Decoder sessions in 30 days of consistent posting → Community demotes from the inner ring.* A threshold on output, not effort.

---

## 10. Pre-post checklist

Run against every reply, every time. This is `BRAND.md §6.1` narrowed to this surface.

1. **Posture check.** Is this channel `rules-checked`? Does the posture permit what I'm about to post? Stricter reading if in doubt.
2. **R2 check.** Delete any mention. Is the reply still worth posting? If no → rewrite or don't post.
3. **Clause check.** Is every quoted clause verbatim from the corpus/Decoder with a public source URL? Any number stated — is it on the platform's own page? (§3)
4. **Claim sweep.** No success rate, no outcome statistic, no customer count, no "trusted by," no guarantee of reinstatement (`BRAND.md §4.1`).
5. **Register check.** Read it aloud, slowly, to an imagined person in tears (P1). Count "you" versus "we" — "you" must win (P5). No emoji, no exclamation marks, no "simply," no "don't panic."
6. **Legal-register check.** "Policy clause," never "legal clause." No *counsel, represent, advocate, fight Amazon, your case*. No autonomy language — *copilot*, never *agent/autopilot/we file for you* (`BRAND.md §4.4`, §4.5).
7. **Respect check.** Nothing that mocks Amazon or Walmart. They have to work with them tomorrow (`BRAND.md §2.3`).
8. **Disclosure check.** If the product is named anywhere in this message, is the disclosure in this same message?
9. **Uniqueness check.** Is this reply visibly written for this post? Does it quote their words?
10. **Refusal check.** If this is a `refer_out` code, does the reply say so plainly, and is it free of any commercial line?

---

## 11. Frameworks applied

- **Alex Hormozi**, *$100M Leads* (2023) — the Core Four; "post free content" is the primary engine here (`03-gtm-pricing.md §4.4` priority 1), and the lead-magnet rule (solve a complete, narrow problem free while making the next problem obvious) is what §0 and the M1–M4 architecture implement. His genuine-versus-manufactured urgency distinction (*$100M Offers*, 2021) is why no skeleton contains a deadline.
- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — Bullseye; Community 21/25 as an inner-ring channel with a pre-committed kill criterion (§9), tested cheaply and time-boxed rather than assumed.
- **April Dunford**, *Obviously Awesome* (2019) — Step 7's non-disparaging competitive sentences are the only approved answer to "is X any good?" (§7 rule 12); Step 10's argument that positioning is evangelised through channels, not stored in a document, is why the reply *is* the positioning (`BRAND.md §1 Step 10`).
- **Aaron Ross**, *Predictable Revenue* (2011) — stages and metrics defined by observable artifacts rather than optimism; applied in §9 to make A2 falsifiable, and in `CRM.md §3` to the channel pipeline.
- **Rob Fitzpatrick**, *The Mom Test* (2013) — ask about their past, not your idea. Every skeleton's M4 asks the seller to go look at something that already happened (their invoices, their order report, their notice header), which is simultaneously the most useful next step for them and the best information for us. Discovery interviews proper run as onboarding calls per `CRM.md §7`.
- **Anthropic**, [Citations](https://platform.claude.com/docs/en/build-with-claude/citations) — `cited_text` with source locations; §3 is the manual discipline that extends the product's structural citation invariant (`IDEA_DOSSIER §7.3 B4`) to a surface with no CI test behind it.

---

**Document status:** DRAFT for founder review. Nothing in this file has been posted or sent. Amendments require a named source and a note of what they supersede, per the inherited amendment rule. Where this file conflicts with a channel's own recorded rules in `research/channels.md`, **the channel's rules govern.**
