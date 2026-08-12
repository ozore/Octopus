# CLAUSEWRIGHT — BRAND BOOK (v1)

**Category frame:** Suspension Defense Copilot for Amazon and Walmart sellers
**Tagline:** *Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side.*

**Status:** Binding for Phase 2. Governs all customer-facing language on every surface — landing page, product microcopy, transactional email, forum replies, DMs, invoices, refusal screens, support responses.
**Depends on:** `IDEA_DOSSIER.md` (single source of truth; decisions D1–D10), `identity/NAMING.md` (G1 naming decision record; §5 invariants are inherited here unchanged and extended).
**Supersedes:** all use of the working codename "Reinstate," which survives only in historical Phase-1 documents.
**Date:** 2026-08-12
**Owner:** Brand strategist (agent), Phase 2

**Amendment rule (inherited from the dossier):** amendments require a named published source and a note of what they supersede. A preference is not a source.

---

## 0. The one strategic idea this brand is built on

> **We are a new name in a category saturated with unaudited success rates. We cannot out-claim the incumbents. So we do not claim — we show our work, before the customer pays, in a way they can check themselves.**

Everything downstream is an implementation of that sentence.

The reasoning is Hormozi's, arithmetically. In *$100M Offers* (2021) the value equation is **Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort & Sacrifice)**. Scored honestly in `IDEA_DOSSIER §6.1`, three of the four terms are already at 8–9 (Dream Outcome 9, Time Delay 9, Effort & Sacrifice 8). **Perceived Likelihood of Achievement scores 3/10 and is the binding constraint** — which is why **D7** assigns it the entire offer budget. Brand is part of that budget. A brand book that spends itself on tone, warmth or delight is optimising a term that is not binding.

The competitive fact that makes this hard: Riverbend advertises *10,000+ sellers*; reinstate.io advertises *85% first-appeal success*; ReinstateIQ advertises *87%*; the category band runs 85–93% (`IDEA_DOSSIER §3.4`, `§5.1`). Every one of those numbers is unaudited vendor marketing — Amazon publishes no reinstatement data. **N10** and **R11** forbid us from publishing any success rate until B9 produces one with its denominator and methodology. So on day one we enter a bragging contest holding an empty trophy case, forbidden from bluffing, against opponents who are bluffing.

The escape is not a better claim. It is a **different kind of evidence**. Claims are unfalsifiable and therefore cheap; a rendered policy clause with its source, shown on screen before the paywall, is falsifiable and therefore expensive to fake. Per Lewis et al. 2020 (NeurIPS, [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)), retrieval-augmented generation produces *"more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline"* — factuality is the axis we can actually win on, and it is the axis the name encodes. Per `IDEA_DOSSIER §7.1`, the differentiator **must be visible before the paywall or the primary experiment (A4) is confounded**; that is experiment design, and it happens to also be the brand's entire proof strategy.

**Substitute verifiability for volume. That is the brand.**

---

## 1. Positioning — April Dunford's *Obviously Awesome* process, run explicitly

Dunford's argument in *Obviously Awesome* (2019) is that positioning is not a tagline exercise; it is a deliberate sequence of decisions about context, and the ten steps are that sequence. They are run here in order, with each step's output stated as a decision rather than a discussion.

### Step 1 — Understand the customers who love the product

We have no customers yet, so per Fitzpatrick's *The Mom Test* (2013) evidence hierarchy (money spent > behaviour observed > stated intent) we substitute the closest admissible evidence: **customers who already pay real money to alternatives**, and what their spending reveals about what they love.

| Observed behaviour | What it says they love | Source |
|---|---|---|
| 10,000+ sellers have paid Riverbend, which services 400+ appeals/month | A named human who has seen this before. They are buying **relief from responsibility**, not a document. | [riverbendconsulting.com](https://riverbendconsulting.com/) |
| Sellers pay AppealDesk **$97** for a five-minute AI draft | Speed and a low-consequence decision. They are buying **the end of the blank page**. | [getappealdesk.com](https://getappealdesk.com) |
| Sellers pay AppealDraft **$149** and sit through a mandatory 15-minute intake call | Reassurance, at the cost of friction. They will trade time for the feeling of being *handled*. | [appealdraft.org](https://www.appealdraft.org) |
| Sellers pay The Appeal Guru **$2,495** for 24-hour turnaround over **$1,495** for 72-hour | The clock is worth ~$1,000 to them. The daily bleed is real and they price it. | [theappealguru.com](https://theappealguru.com) |
| An AppealDesk tester reports losing **$800/day** while suspended | They compute the loss themselves, unprompted. | `IDEA_DOSSIER §1.3` |

**Step 1 decision:** the lovable customer is not a "user." They are a business owner in the middle of an unplanned revenue stoppage who has a small number of shots at an appeal, does not know the reason-code taxonomy, and is doing arithmetic in their head about what every hour costs. Everything in this brand book is written to be read by that person, in that state.

### Step 2 — Form the competitive alternatives list

Dunford's instruction is to list what customers would do **if we did not exist** — including doing nothing. This is deliberately wider than a "competitor" list.

**Tier A — the free default (largest by volume, and the true benchmark):**

| Alternative | Cost | Why it is a real alternative |
|---|---|---|
| Self-writing in a blank document at 2am | $0 | The actual default. Christensen's JTBD framing (*The Innovator's Dilemma*, 1997) requires us to beat this, not just beat vendors. |
| Free forum / subreddit / Facebook-group answers | $0 | Simultaneously our **lead-gen surface and our lowest-cost competitor** (`IDEA_DOSSIER §5.1`). |
| Free POA template libraries (AMZBase, Traverse Legal, ESQGo, eStore Factory) | $0 | Zero friction, zero cost, satisfies the risk-averse and the cash-constrained. |
| A generic chatbot prompt | $0–$20/mo bundled | Produces prose. Does not produce a *cited clause* or a *critique*. |

**Tier B — AI-native tools (the incumbents that actually matter):**

| Alternative | Price | Position they already own |
|---|---|---|
| **AppealDesk** | **$97 flat** | **"Cheap and fast AI POA," plus honest triage that refuses six unwinnable categories.** The single most important competitive finding in the research (`IDEA_DOSSIER §5.2`). |
| **AppealDraft** | **$149 flat** | Full cash refund if Amazon rejects; "no automation or account access"; mandatory intake call. |
| **AppealAI** | Demo-gated | Fuller SaaS: ASIN Auditor, Violation Decoder, SOC 2 claims. |
| **PlatformAppeal** | Free classify + paid Pro | Free violation classification; unlimited revision rounds. |
| **ReinstateIQ / "Appeal Wizard"** | **$350/appeal** | RAG over 46 successful appeal templates; 2,000+ appeals claimed at 87%. |
| planofactiontemplate.com | **$49** | Bottom of the market. |

**Tier C — humans (the anchor tier, and the one AppealDesk has already priced for us):**

| Alternative | Price | Note |
|---|---|---|
| **Consultants** | **~$1,250/appeal** | This is **AppealDesk's own published anchor**, from its comparison table. Using a competitor's anchor is free and it is credible precisely because it is theirs. |
| **Attorneys** | **~$3,500 / ~2 weeks** | Same table. Also corroborated by AppealDraft's independent "$500 to $2,500 per appeal" consultant band. |
| Riverbend Consulting | Phone-gated | 400+/mo; PRO and GUARDIAN tiers. |
| SellerCandy | **$997 / $1,197 / $1,500 / $2,500 per month** | Retainer model. |
| The Appeal Guru | **$495 DIY / $1,495 / $2,495** + $179.95–309.95/yr monitoring | Turnaround-tiered. |
| eCommerceChris, Amazon Sellers Lawyer, Seller Interactive | Custom | Ex-Amazon investigator / attorney / agency credibility. |
| Fiverr / Upwork freelancers | **est. $50–300** — *unverified, flagged as estimate* | Turnaround and quality lottery. |

**Tier D — adjacent tools that detect but cannot remedy:**

| Alternative | Price | Note |
|---|---|---|
| SellerSonar | **$19.98–89.98/mo** | This is why monitoring alone is a **~$20 commodity** and why Shield is priced on the bundled appeal, not on alerts (`IDEA_DOSSIER §6.2`). |
| Helium 10 Alerts | Bundled $99–1,499+/mo | Also a natural BD partner, not only a substitute. |

**Step 2 decision:** we are positioned against **three** reference points simultaneously, and the copy must never collapse them into one. Against **Tier A** we sell *the end of guessing*. Against **Tier B** we sell *the parts they walk away from*. Against **Tier C** we sell *the price and the clock*. A single landing page that only argues against Tier C (the flattering comparison) will lose the Tier B fight, which is the fight we are actually in.

### Step 3 — Isolate the unique attributes

Dunford's test is strict: an attribute qualifies only if **no alternative in Step 2 has it**. Three survive, plus one distribution attribute.

**UA1 — Enforced citations (a code-level invariant, not a feature claim).**
Every policy reference rendered in the UI originated in an Anthropic [Citations API](https://platform.claude.com/docs/en/build-with-claude/citations) `cited_text` object with a source location. **B4** states it and **R4** restates it: *"Not a prompt instruction."* A CI test on Day 2 strips any policy reference lacking a backing citation object. This is the Twelve-Factor discipline ([12factor.net](https://12factor.net/)) applied to a brand promise: the guarantee is **structural, in the codebase and its test suite**, not procedural in a runbook or a marketing brief. The consequence for brand is unusual and worth naming — **this promise cannot silently rot; the invariant fails the build before it fails a customer.**
*Uniqueness check:* every Tier B competitor claims "AI-powered." None surfaces the retrieved clause with its source. Per `IDEA_DOSSIER §6.1` this is **lever 1 of 6** on Perceived Likelihood, and *"no competitor surfaces this today."*

**UA2 — A human backstop that takes exactly the cases the machine should not.**
`Rescue + Human` at $399: same-day review by an experienced appeal writer, editing **the same document in the same tool under the same citation gate**. Critically, the classifier's `UNCLASSIFIED` and low-confidence outcomes are first-class terminal states that **route to a human rather than guessing** (**R3**, `ARCHITECTURE.md §3.2`).
*Uniqueness check:* AppealDesk's honest triage **refuses** six categories — it walks away at exactly the moment the case gets hard. The human tiers (Riverbend, SellerCandy) have humans but no machine speed and no self-serve price. Nobody bundles both. This converts our worst technical failure mode into our differentiated revenue line.

**UA3 — A consented outcome loop that feeds the next draft.**
**B9**: consent-gated outcome capture at payment, day-3/10/21 follow-ups, one-click outcome form, redaction before anything enters L4. **D10** makes it the last thing cut. Per Helmer's *7 Powers* (2016) this is the only credible path to **Process Power**; per Karpathy's [*Software 2.0*](https://karpathy.medium.com/software-2-0-a64152b37c35) (2017) the dataset that defines desirable behaviour is the primary artifact, so the loop that produces it is the thing worth branding.
*Uniqueness check:* no monitoring tool drafts; no drafting tool monitors; AppealDesk's data skews to easy wins because it refuses hard cases; Riverbend is a services firm, not a data pipeline.

> **⚠ The honesty constraint on UA3, which is binding on copy.** `IDEA_DOSSIER §1.1` is explicit: *we do not market an asset we do not hold.* L4 is **0 records at launch**, smaller than at least two competitors' datasets, and §5.5 downgrades "proprietary corpus" from moat to roadmap item. **Therefore: market the mechanism, never the asset.** "Every outcome our customers report goes back into the system within days" is a true statement about a shipped mechanism. "Grounded in a corpus of winning appeals" is a claim about an asset we do not have, and it is **prohibited** until B9 produces one with a stated *n*. This distinction is not pedantry; it is the same discipline that killed the original one-liner.

**UA4 (distribution, not product) — We are present at the moment of panic, for free, without a link.**
A "just got suspended" post is a **public, timestamped, individually addressable buying signal** — almost no other business gets that (`IDEA_DOSSIER §6.5`). Per Weinberg & Mares' *Traction* (2015) Bullseye scoring, Community 21/25 and Engineering as Marketing 22/25 are the entire path to the first ten customers at ~$0 cash. Brand-wise this attribute is load-bearing: **the first impression most customers form of Clausewright is a free, useful, link-free answer from a stranger**, not an ad. The voice rules in §2 are written for that surface first and the landing page second.

### Step 4 — Map attributes to value ("so what?")

Dunford's step 4 converts features into value, then clusters value into **themes**. Three themes carry the brand.

| Theme | The attributes that produce it | The value, in the customer's words | The word we own |
|---|---|---|---|
| **VT1 — You can check it yourself.** | UA1 | *"I don't have to take anyone's word for it. The clause is on screen, with where it came from, before I pay a cent."* | **Verifiable** |
| **VT2 — Nobody walks away when it gets hard.** | UA2 | *"If my case is the weird one, that's the case a person takes — not the case where the product says sorry and refunds me."* | **Backstopped** |
| **VT3 — It gets better because of what happened to sellers like me.** | UA3 | *"They ask what Amazon actually said back, and they use it. This isn't a PDF from 2023."* | **Learning** |

**The tension between Dunford and Hormozi, resolved.** Dunford says differentiate — lead with what only you have. Hormozi says lead with the dream outcome — the recovered cash flow. These pull in opposite directions, because the dream outcome ("get reinstated") is *category-level*: every alternative in Step 2 promises it. The resolution, which governs §3's hierarchy:

> **Lead with the dream outcome to earn attention. Differentiate immediately after, to earn the premium.**

The outcome gets you read. The value themes get you paid $149 against a $97 incumbent — and per Ramanujam & Tacke's *Monetizing Innovation* (2016), a $52 premium with no articulated differentiator is a **minivation** waiting to happen in reverse: if the themes do not land, the only remaining argument is price, and we have deliberately chosen the losing side of that argument (**D4**).

### Step 5 — Determine who cares a lot

Per Moore's *Crossing the Chasm* (1991) beachhead discipline, exactly one persona:

> **First-time-suspended, sub-$2M-GMV Amazon 3P sellers with an account-level deactivation, who cannot justify a $1,000+ consultant or a $997/mo retainer but are too anxious to trust a $0 forum answer or a faceless $49 template mill.**

They care a lot because they sit in a **specific gap**: rich enough that $0 templates feel like negligence, poor enough that $1,250 feels like a second disaster, and inexperienced enough that they cannot evaluate a draft on their own — which is exactly why *showing the clause* is worth more to them than to anyone else in the market. A veteran seller who knows the reason-code taxonomy does not need the citation; a first-timer needs it more than they need the document.

Segmentation is by **need and willingness-to-pay, never demographics** (Ramanujam's Rule 2): S1 Panicked Solo (beachhead, $97–199), S2 Bleeding Mid-Market ($400–2,500, primary margin pool), S3 Chronic ($49–149/mo, subscription core), S4 Managers/agencies ($149–999/mo, **channel not beachhead**). §3.6 gives the message adaptation per segment. **All v1 hero copy is written for S1 and no one else.**

### Step 6 — Find or build the market category

Two candidate frames were tested (`02-competition-positioning.md §2`, Step 6):

**(a) "Amazon reinstatement services" / "AI POA generator" — REJECTED.** Inside this frame the default comparison is AppealDesk at $97, which already owns *cheap and fast*. Dunford's guidance is to reposition when the default category comparison is unfavourable, and this one is unfavourable in the specific way that cannot be argued out of: the incumbent is cheaper **and** faster **and** established. We would be a $149 version of a $97 thing.

**(b) "Suspension Defense Copilot for Amazon and Walmart sellers" — CHOSEN (D3).** A category constituted by a bundle no single competitor ships: cited drafting **+** human escalation **+** a monitoring loop that feeds drafting **+** presence at the moment of panic. Changing category changes the comparison set, which is the entire point of Step 6.

**The word "copilot" is doing precise work and must not be swapped for a synonym.** It is architecturally honest. Anthropic's [*Building Effective Agents*](https://www.anthropic.com/engineering/building-effective-agents) distinguishes workflows ("predefined code paths") from agents that "dynamically direct their own processes," and counsels finding "the simplest solution possible." **D9** commits us to a fixed classify → retrieve → draft → critique workflow with a human tier — explicitly **not** an autonomous agent (**N7**). "Copilot" claims assistance with a human in command. "Agent," "autopilot," "automation" and "it files for you" would market more autonomy than we built, and would additionally violate **N2/N3/N11** (no credentials, no automated submission, no access behind the Seller Central login). *The category word is a compliance control as well as a positioning choice.*

**Category-frame usage rule:** in prose, the frame appears in full at least once on every top-level surface — *"a suspension defense copilot for Amazon and Walmart sellers"* — lowercase, as a descriptive category, not a trademark. We are claiming a category, not naming a product.

### Step 7 — Check the positioning against each alternative

Dunford's literal "does it win?" test: one sentence per alternative, each of which must be true, specific, and non-disparaging. These are **approved copy** and may be used verbatim.

| Alternative | The sentence that wins |
|---|---|
| **Blank document at 2am** | "You get very few shots at this and no idea what the investigator is actually looking for — we read your exact notice and draft a Plan of Action that quotes the clause you were charged under." |
| **Free forum answers** | "That reply was written for a different suspension than yours. We read your notice's own language and reason code." |
| **Free template libraries** | "A static template can't tell you which clause your notice cites. Ours starts from your notice, not from a generic outline." |
| **A generic chatbot** | "A chatbot will write you confident prose with no source. We show the clause, where it came from, and what's still missing from your draft — before you pay." |
| **Fiverr / Upwork freelancers** | "Skip the turnaround lottery: a draft in minutes, and a same-day human review available if the case needs judgment." |
| **AppealDesk ($97, refuses six categories)** | "AppealDesk is honest that it walks away when a case gets hard. We built the tier that takes those cases instead." |
| **AppealDraft ($149, refund on rejection, intake call)** | "Same price, no mandatory call, and you see your reason code and the cited clause before you decide to pay." |
| **AppealAI (gated pricing)** | "No demo call and no gated pricing. Paste your notice and see your draft before you pay anything." |
| **PlatformAppeal (free classification)** | "Free classification tells you *what* you're charged with. We also show you the clause and what your draft is still missing." |
| **ReinstateIQ ($350)** | "Same grounded-retrieval idea, less than half the price, and the sources are on screen rather than described in marketing copy." |
| **Riverbend / eCommerceChris / attorneys** | "Days of waiting and four figures, versus a submission-ready draft in minutes with a human reviewer available same-day for a fraction of the retainer." |
| **SellerCandy / Appeal Guru retainers** | "You're not suspended every month. Stop paying $1,500/mo for something that happens twice a year." |
| **SellerSonar / Helium 10 Alerts** | "Alerts tell you something broke. We're the monitoring plan that also drafts your way back in the moment it does." |

**Failure check, stated honestly:** the AppealDesk row is the only one where we do not obviously win on the customer's first read, because $97 < $149 is legible in a way that "human backstop" is not. This is the exact conversion that assumption **A4** exists to test, and the exact reason the cited clause and the critique must be visible **before** the paywall. If A4 comes in below 3%, positioning is not the fix and there is no cheaper price to retreat to — that ground is AppealDesk's (`IDEA_DOSSIER §7.5`). **Brand is not permitted to paper over this; it is permitted only to make the difference visible.**

### Step 8 — Layer on a trend

The trend: **buyer preference for cited, verifiable AI output over black-box completion** (`IDEA_DOSSIER §2.3`). It qualifies under Dunford's caution against trend-chasing because it is *mechanically true of our product*, not merely fashionable — the Citations API returns `cited_text` with source locations, so the trend is implemented rather than invoked. And per §5.1, "AI-powered" is a claim every competitor already makes, which makes it worth exactly nothing; "you can see the source" is a claim none of them makes.

The name **compiles the trend into the wordmark** (`NAMING.md §3.2`): a competitor cannot describe our differentiator without saying our name.

**Trend-layering discipline:** the trend is a *supporting* layer, never the lead. Copy that opens with "In the age of AI…" is prohibited (§4). The trend appears as a reason-to-believe underneath a customer outcome, never as a headline.

### Step 9 — Capture the positioning in a document

**Canonical positioning statement — the single authoritative version. Do not paraphrase in internal documents; quote it.**

> **For first-time-suspended Amazon and Walmart sellers who cannot justify a $1,000+ consultant retainer, Clausewright is a suspension defense copilot that drafts a policy-cited, submission-ready Plan of Action in minutes and escalates to human review only when the case needs judgment — unlike AppealDesk's AI-only triage-and-refuse model or Riverbend/SellerCandy's slow, expensive, fully-human retainers, Clausewright pairs machine speed with human backup at a tenth of the incumbent price.**

**Derived short forms (approved; use the shortest one the surface allows):**

| Length | Form | Use on |
|---|---|---|
| **2 words** | *Suspension defense.* | Favicon-adjacent, social bio prefix, ad extension |
| **8 words** | *Suspension defense copilot for Amazon and Walmart sellers.* | Meta description opener, social bio, forum signature |
| **1 sentence (tagline)** | *Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side.* | Hero, email footer, deck cover |
| **1 sentence (mechanic)** | *Paste your deactivation notice; in minutes you get a submission-ready Plan of Action that cites the exact policy clause you were charged under — with a human appeal writer one click away if your case needs judgment.* | Hero subhead, first DM, "what is this" answers |
| **1 paragraph** | The canonical statement above. | About page, partner one-pagers, press |

### Step 10 — Evangelise the positioning

Positioning that lives only in this file is not positioning. Per Dunford's step 10 and Weinberg & Mares' Bullseye sequencing, evangelism runs through the two inner-ring channels, in this order:

1. **Community (21/25)** — 8–15 substantive, link-free replies/day. The reply *is* the positioning: identify the reason code from their pasted notice → quote the exact policy clause → name the one thing their POA must contain that most sellers get wrong for that code. **Every reply must stand alone as useful if the link is never clicked** (**R2**). Seller Central forums prohibit solicitation — reputation only, links in profile/signature; Reddit and Facebook groups carry the clickable volume.
2. **Engineering as Marketing (22/25)** — the free Notice Decoder and a public Suspension Reason Code Index, one page per code. The canonical *Traction* pattern (HubSpot Website Grader, Moz free tools): the marketing asset **is** the product, at zero marginal cost. Each Index page is a positioning artifact that argues VT1 without a single adjective.
3. **Internal enforcement** — §4's do/don't table and §6's review checklist are the mechanism that keeps the positioning from drifting across surfaces, which is the ordinary way positioning dies.

---

## 2. Brand personality and voice

### 2.1 The register: the ER doctor

**The reference model:** an emergency physician telling a frightened patient what is wrong, what happens next, and what they do not yet know — in a room where the patient is panicking and the doctor is not.

The register works for us for a structural reason, not an aesthetic one. In an ER, *the doctor's calm is itself diagnostic information*: a physician who matches the patient's alarm signals that the situation warrants alarm. Our buyer arrives having read a deactivation notice written in Amazon's flat enforcement prose, at 2am, doing loss arithmetic. **Copy that matches their energy tells them their fear is proportionate. Copy that stays level tells them this is a known, survivable, procedural problem — which is the single most valuable thing we can communicate before they have any evidence about our competence.**

It is also the register the product's architecture already demands. `USER_JOURNEY.md §8` sets emotional design constraints — one primary action per screen, calm neutral tones rather than alarm-red for deficiencies, generous whitespace — grounded in Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (Liquid Glass), where the interface material recedes so that content leads. **This section is the verbal form of that same principle: the voice recedes so the clause leads.** A brand voice the reader notices is a brand voice competing with the content for attention it cannot afford.

### 2.2 Five personality traits, each with its behavioural test

| # | Trait | What it means | The test (pass/fail on any given line) |
|---|---|---|---|
| **P1** | **Calm** | The register never rises to match the reader's panic, and never falls into breeziness either. Neither "DON'T PANIC!!" nor "Oops! Looks like your account had a hiccup 😬". | Could this sentence be read aloud, unhurried, to someone in tears without sounding either alarmed or flippant? |
| **P2** | **Specific** | Names things exactly: the reason code, the clause, the deficiency, the number, the date. Specificity is our substitute for reputation. | Does this sentence contain at least one checkable noun or number, or is it an adjective wearing a coat? |
| **P3** | **Candid about limits** | Says "we're not confident enough to draft this" out loud. Honest triage is **lever 2 of 6** on Perceived Likelihood and is counter-intuitively one of the strongest trust levers in the category (`IDEA_DOSSIER §6.1`) — AppealDesk markets its refusals as a checkmark. | Would we still print this sentence if it cost us the sale? If a limit is being hidden, rewrite. |
| **P4** | **Unhurried at the moment of consequence** | Speed everywhere except the pre-submission checklist, where the copy deliberately slows the reader down before they spend their one attempt (`USER_JOURNEY.md §7`). | At the point of irreversible action, does the copy add friction on purpose? It should. |
| **P5** | **Not the hero** | The seller submits, the seller gets reinstated, the seller wins. We are the copilot; they fly. Per Christensen's JTBD, they hired us for *"get me back online without burning my one good attempt"* — not to admire us. | Count the sentences whose grammatical subject is "we" or "Clausewright." If they outnumber "you," rewrite. |

### 2.3 Voice dimensions

Placed on the Nielsen Norman Group's four tone-of-voice dimensions ([nngroup.com](https://www.nngroup.com/articles/tone-of-voice-dimensions/)):

| Dimension | Position | Note |
|---|---|---|
| Funny ←→ **Serious** | **Serious**, always. | Not humourless in support conversations, but never in product copy. There is no funny way to discuss someone's frozen revenue. |
| Formal ←→ Casual | **Slightly formal.** Plain words, complete sentences, no slang, no exclamation marks. | Contractions are fine ("you're," "it's"). Emoji are prohibited on all surfaces. |
| **Respectful** ←→ Irreverent | **Respectful**, of the seller *and* of the platforms. | We never mock Amazon or Walmart. The seller has to work with them tomorrow; copy that treats the platform as a villain makes us feel good and makes the seller feel worse. |
| Enthusiastic ←→ **Matter-of-fact** | **Matter-of-fact**, hard. | This is the load-bearing dimension. Enthusiasm reads as sales pressure to a person deciding under duress. |

### 2.4 The four registers, by moment

The voice is one voice, but the moment changes the temperature. Each maps to a screen set in `USER_JOURNEY.md`.

**R-1 — Triage** *(landing page, paste screen, forum reply, first DM)*
Short sentences. Second person. One instruction. No preamble, no value proposition before the box. Per Nielsen's heuristic #8 (aesthetic and minimalist design — *"dialogues should not contain information which is irrelevant"*, [nngroup.com](https://www.nngroup.com/articles/ten-usability-heuristics/)), the paste screen carries a text box, a button and nothing else.
> *"Paste the notice Amazon or Walmart sent you. We'll tell you what you're charged under."*

**R-2 — Diagnosis** *(classification result, cited clause, critique, preview)*
This is where P2 (specific) does the heaviest lifting and where the brand is actually won. Name the code. Quote the clause. List the deficiencies in flat, non-punitive language — they are diagnostic information, not an alarm (hence calm neutral, not error-red, per `USER_JOURNEY.md §8.4`). Pipeline narration uses the seller's language, never the system's: *"Reading your notice…" → "Found it — this is a [reason code] case." → "Checking the exact policy clause…"* — never "Stage 2/4: retrieval." That is Nielsen's heuristic #2, match between system and the real world.
> *"This is a Section 3 / inauthentic case. The clause you were charged under is quoted below, with its source. Your draft is currently missing supplier invoices and a measurable preventive control — both are the two things this reason code is most often rejected for."*

**R-3 — Consequence** *(pre-submission checklist, refusal screen, escalation offer)*
Slowest and plainest of the four. This is the one place the copy is allowed to be longer than it needs to be, because Nielsen's heuristic #5 (error prevention) applied here means **slowing the user down at exactly the one moment it matters**. Refusals are stated without euphemism and without apology theatre.
> *"We're not confident enough in the reason code to draft this. Guessing here would cost you an appeal attempt, so we won't. A reviewer can take it from here — $399, same day. If you'd rather not, you haven't been charged."*

**R-4 — Relief** *(reinstatement confirmation, day-25 Shield email, receipts)*
Warmer by exactly one degree, never more, and **never celebratory on our own behalf** (P5). This is the peak-end moment — Fredrickson & Kahneman, *JPSP* 65(1), 1993; Kahneman, *Thinking, Fast and Slow* (2011) — which per **D6/M2** is where the subscription conversation belongs, because retrospective evaluation of an affective episode is dominated by its peak and its ending. The commercial temptation here is enormous and the brand answer is fixed: **state the fact, show what monitoring caught or would have caught, present keep-or-lapse as two equally weighted one-click options** (Nielsen heuristic #3, user control and freedom; `USER_JOURNEY.md §3.4`).
> *"Your 30 days of free monitoring end in 5 days. Here's what it flagged. Keep it at $49/mo, or let it lapse — both are one click."*

### 2.5 The urgency rule (Hormozi), stated as a hard constraint

Hormozi's *$100M Offers* distinguishes **genuine** from **manufactured** urgency and scarcity, and warns that manufactured versions destroy trust. Our situation is unusual: **the urgency is real, external, and larger than anything we could invent.** The appeal clock is running, the revenue bleed is daily, and the buyer is already computing it.

**Therefore:**

1. **Display real urgency factually.** Days suspended × the seller's own stated daily revenue = cumulative loss. The seller supplies the number; we do the arithmetic in front of them. This is the strongest single piece of copy we have and it contains no adjectives.
2. **Never invent a countdown.** No "offer expires in 14:59." No fake price rises. No "3 people are viewing this."
3. **Scarcity claims must be rendered from a live count or not made at all.** Human-review capacity is genuinely finite, so *"2 human-review slots left today"* is honest — **but only if that number is read from the queue at render time.** A scarcity claim typed into a copy file is a lie with a delay fuse. This is the Twelve-Factor discipline again ([12factor.net](https://12factor.net/)): a claim that must stay true is enforced by the system, not by the person editing the string.
4. **Never add urgency to the subscription.** Shield is sold at the moment of relief, and pressure applied there converts the peak-end moment from an asset into a resentment.

---

## 3. Messaging hierarchy

The order is not arbitrary. It descends from **D7**: every layer is chosen for its effect on Perceived Likelihood of Achievement, except layer 1, whose job is to buy the attention that lets the rest be read.

### 3.1 The hierarchy at a glance

| Layer | Job | Content | Framework |
|---|---|---|---|
| **L1 — The lead** | Earn the read | **Recovered cash flow.** *"Every day dark costs you a day's sales."* | Hormozi, Dream Outcome 9/10 |
| **L2 — The frame** | Change the comparison set | *"Suspension defense copilot for Amazon and Walmart sellers."* | Dunford Step 6 (D3) |
| **L3 — The mechanic** | Make it concrete | *"Paste your notice. In minutes: your reason code, the exact clause, and a submission-ready Plan of Action."* | Christensen JTBD |
| **L4 — The proof stack** | **Move the 3/10** | Six levers, in the order in §3.3 | Hormozi PLA (D7) |
| **L5 — The risk reversal** | Remove the last objection | Guarantees, in the order in §3.4 | Hormozi guarantee taxonomy |
| **L6 — The rebuttal** | Win the specific comparison | Step 7 sentences (§1) | Dunford Step 7 |
| **L7 — The trend** | Reason to believe | Cited, verifiable AI | Dunford Step 8 |

**Rule: no surface may skip L4.** A page may compress L1–L3 into a single line, but proof is not optional anywhere, because proof is the only layer that touches the binding constraint.

### 3.2 L1 — Lead with recovered cash flow

`IDEA_DOSSIER §1.3` is unambiguous: **"Sell the recovered cash flow, not the document."** The Dream Outcome scores 9/10 precisely because it is monetary and the buyer computes it unprompted — at the cited $800/day, seven days faster is **$5,600 recovered**.

**Approved lead constructions:**
- *"Every day dark costs you a day's sales."* (canonical)
- *"You're not buying a document. You're buying back the days."*
- *"Seven days faster is seven days of sales."*
- Free-tool counter: *"Suspended [N] days. At [your daily revenue], that's [$X] so far."*

**Prohibited lead constructions:** anything whose subject is the artifact — *"Get a professional Plan of Action"*, *"AI-powered POA generation"*, *"The best appeal letter tool for Amazon sellers."* Naming the artifact re-enters AppealDesk's category and forfeits **D3** in the first six words.

### 3.3 L4 — The proof stack, ordered by effect on Perceived Likelihood

This ordering is taken directly from `IDEA_DOSSIER §6.1`'s six levers and is **binding**: proof elements appear in this order on every surface that has room for more than one, because the order reflects estimated PLA impact, not visual balance.

| # | Proof element | Why it ranks here | Ships | Copy form |
|---|---|---|---|---|
| **1** | **The retrieved policy clause, verbatim, with its source — shown free, before payment.** | The only falsifiable proof we hold on day one, and **no competitor surfaces it**. It is also the pre-paywall requirement of experiment A4. | **v1** | *"Here's the clause you were charged under, and where it comes from. Read it before you decide anything."* |
| **2** | **Honest triage — we refuse the cases we can't win, before you pay.** | Counter-intuitively the strongest trust lever in the category; AppealDesk markets refusal as a checkmark. Extend it: refused cases are **referred to partner attorneys**, converting a lost sale into revenue and a relationship. | **v1** | *"Some cases shouldn't be appealed by a tool. If yours is one, we'll say so before you're charged and point you at someone who can actually help."* |
| **3** | **The guarantee stack.** | Removes downside without a track record. Note honestly: we enter **behind** the market here (AppealDraft already refunds; PlatformAppeal already offers unlimited revisions), so the guarantee alone cannot carry the position. | **v1** | See §3.4 |
| **4** | **The human tier exists — and takes the cases the machine won't.** | Ramanujam's anchoring/decoy effect: the presence of the $399 human tier raises perceived likelihood **of the $149 tier**. Its existence is proof even to buyers who never choose it. | **v1** | *"If the case needs judgment, a person takes it the same day. That's a tier, not a support ticket."* |
| **5** | **A published win rate, with denominator and methodology.** | Strongest proof in the category — **and prohibited until B9 measures it** (N10, R11). Publishing an unmeasured rate is an advertising-substantiation exposure and poisons the exact trust position we sell. | **Post-B9 only** | *"Of [n] reported outcomes since [date], [x] were reinstated on first submission. Here's how we count."* |
| **6** | **Community-sourced proof — a public thread where a stranger was helped for free.** | Beats any on-site testimonial because the reader can see it was not staged. Slowest to accumulate; earliest to start. | Day 7–14 onward | Link to the thread. Add nothing. |

**The discipline that makes this stack work: never lead with a proof we do not hold.** Levers 1, 2 and 4 are fully available on day one; lever 3 is available but undifferentiated; levers 5 and 6 are earned. Copy that reaches for 5 before B9 has produced it is not aggressive marketing, it is the failure mode this entire brand is positioned against.

### 3.4 L5 — The guarantee stack, in order

Per Hormozi's guarantee taxonomy (unconditional / conditional / anti- / implied):

1. **Time guarantee (unconditional, entirely in our control).** *"Your draft is in your inbox in 10 minutes or it's free."* **Lead with this** — it is cheap, it is differentiating, and **nobody else in the category offers a time guarantee.**
2. **Service guarantee (conditional).** Unlimited revisions until reinstated or you tell us to stop. Table stakes; matches PlatformAppeal.
3. **Outcome guarantee (conditional).** *"First submission rejected? Your human review is free."* Deliberately gives more **service** rather than cash back — Hormozi's stated preference — and it retains the customer **and the case data** that feeds UA3.
4. **Cash refund (A/B test only, not default copy).** Matching AppealDraft's full refund invites adverse selection (Akerlof, *QJE* 84(3), 1970): unwinnable cases self-select in and refund out. The mitigation is already designed in — honest triage screens them out **before** payment, which is why triage and a strong refund are complements rather than alternatives (**R8**).

### 3.5 The surface map

Every customer-facing surface, with its required layers and its governing register.

| Surface | Register | Required layers | Notes |
|---|---|---|---|
| **Landing hero** | R-1 | L1 → L2 → L3 → CTA | One CTA. No navigation. The anchor table ($3,500 attorney / $1,250 consultant / $149 Clausewright) sits below the fold, not in the hero — leading with price concedes the category fight to AppealDesk. |
| **Paste screen** | R-1 | L3 only | A box and a button. Nothing else (`ARCHITECTURE.md §3.1`). |
| **Streaming/wait state** | R-2 | L3 narration | Seller's language, never system labels. The 10-minute wait is the highest-risk UX surface in the product (`USER_JOURNEY.md §6`). |
| **Classification + cited clause (free)** | R-2 | **L4.1** | The single most important screen in the brand. The clause is the hero; our copy around it is scaffolding. |
| **Critique (free, pre-paywall)** | R-2 | L4.1 + L4.2 | Deficiencies in flat, non-punitive language. This is what a generic chatbot cannot produce and the reason the premium is arguable. |
| **Preview paywall** | R-2 → R-1 | L1 (restated) → L5.1 → tier choice | Restate the recovered-cash-flow frame here, because this is the moment the price is compared. |
| **Refusal / UNCLASSIFIED screen** | R-3 | L4.2 + referral | No apology theatre. No upsell pressure. State the limit, state the option, state that they haven't been charged. |
| **Pre-submission checklist** | R-3 | L4.1 restated | Deliberately slows the reader. Names the 3–30 day wait with no committed timeline, so the wait doesn't read as our failure later. |
| **Forum reply** | R-1/R-2 | L3 + L4.1, **no link** | Must be completely useful if the link is never clicked (**R2**). Never mention price unasked. |
| **Cold/warm DM** | R-1 | L3 + one L4 element | One offer, one line, no stack. |
| **Transactional email** | R-2 | Status + next action | Subject lines state facts, never urgency. |
| **Day-25 Shield email** | R-4 | Fact → what it caught → symmetric choice | Opens with the fact, not the pitch (`USER_JOURNEY.md §3.1`). |
| **Reason Code Index page** | R-2 | L4.1 + L2 | Engineering-as-marketing asset. Argues VT1 by demonstration, with zero adjectives. |
| **Pricing page** | R-1 | L2 → tiers → L5 → L6 | Transparent tiers, no "contact us," no gated pricing — a live differentiator against AppealAI. |

### 3.6 Segment adaptations

Beachhead copy is written for S1. These are the permitted variations, not new positions.

| Segment | What changes | What never changes |
|---|---|---|
| **S1 Panicked Solo** (beachhead) | Default. Maximum reassurance, minimum jargon, "you get very few shots at this." | — |
| **S2 Bleeding Mid-Market** | Lead harder on the **human tier** and the same-day clock; their daily bleed is $1k–10k, so time dominates price. | Never imply a dedicated account manager we don't staff. |
| **S3 Chronic** | Lead on **prevention and the pattern** across their history; Shield's value is the included appeal, not the alerts (monitoring alone is a ~$20 commodity). | Never sell Shield to an already-suspended account except post-reinstatement (**M1** adverse-selection control). |
| **S4 Agencies/Managers** | Channel, not beachhead: lead on **multi-account throughput and per-case economics**. | Never let S4 language leak into S1 surfaces — "dashboard," "seats," "workflow" are all conversion taxes on a panicking solo seller. |

---

## 4. Copy do / don't table

Binding on every customer-facing string. Rows marked **⛔** are compliance controls inherited from `NAMING.md §5`, dossier **B11/R9/N10/N2/N3/N11**, and are **not** stylistic preferences — a violation is a defect, not a note.

### 4.1 Outcome and proof claims

| Don't write | Do write | Why |
|---|---|---|
| ⛔ "93% of our appeals get approved." | "Of [n] reported outcomes since [date], [x] were reinstated on first submission. Here's how we count." | **N10/R11.** No success rate until B9 produces one with its denominator. Advertising-substantiation exposure, and it poisons the trust position. |
| ⛔ "Guaranteed reinstatement." | "No one can guarantee reinstatement — Amazon decides. What we guarantee is the draft, the clause, and the time." | Category norm (PlatformAppeal explicitly does not guarantee reinstatement); false-claim exposure. |
| "Grounded in a corpus of winning appeals." | "Every outcome our customers report goes back into the system within days." | `IDEA_DOSSIER §1.1`: we do not market an asset we do not hold. L4 = **0 records at launch**. |
| "Trusted by thousands of sellers." | *(say nothing until it is true)* | Same rule. Silence is a position; a fabricated number is a liability. |
| "Our AI is trained on Amazon policy." | "We show you the clause we drafted from, and where it came from." | We do not fine-tune (**N6**); "trained on" is factually wrong as well as vague. |
| "Proven." "Battle-tested." "Industry-leading." | *(delete; replace with the specific thing)* | P2. Adjectives are what a brand uses when it has no nouns. |

### 4.2 Urgency, scarcity and pressure

| Don't write | Do write | Why |
|---|---|---|
| ⛔ "Offer expires in 14:59!" | "Suspended [N] days. At [your daily revenue], that's [$X] so far." | Hormozi: manufactured urgency destroys trust; the real urgency is bigger anyway. |
| ⛔ "Only 3 spots left!" *(typed into copy)* | "2 human-review slots left today" *(rendered from the live queue)* | Genuine scarcity is permitted; a hard-coded scarcity string is a lie with a delay fuse. Enforce structurally ([12factor.net](https://12factor.net/)). |
| "Don't risk your account — act NOW." | "There's no deadline on our side. Take the time to read the draft before you submit it." | P1, P4. Pressure at the moment of consequence is the exact opposite of what the JTBD needs. |
| "Last chance to keep Shield!" | "Your 30 days end in 5 days. Keep it, or let it lapse — both are one click." | R-4. Pressure at the peak-end moment converts an asset into a resentment. |
| "Every minute costs you money!!" | "Every day dark costs you a day's sales." | Same fact, no exclamation, no manufactured compression. |

### 4.3 Register and tone

| Don't write | Do write | Why |
|---|---|---|
| "Oops! Something went wrong 😬" | "We couldn't read that notice. Paste the full text, including the header." | P1; no emoji anywhere; Nielsen #9 (help users recognise, diagnose and recover from errors). |
| "Don't panic!" | *(just be calm; do not name the panic)* | Naming the reader's panic tells them it is warranted. |
| "We're thrilled to help you crush your appeal!" | "Here's what you're charged under and what your draft is still missing." | P5, matter-of-fact. Enthusiasm reads as sales pressure under duress. |
| "Stage 2/4: retrieval complete." | "Checking the exact policy clause…" | Nielsen #2, match between system and the real world. |
| "Amazon's bots screwed you over." | "This notice cites Section 3. Here's the clause and what it requires." | Respectful dimension. The seller has to work with Amazon tomorrow. |
| "Simply paste your notice and you're all set!" | "Paste the notice. We'll tell you what you're charged under." | "Simply" and "just" minimise a moment that is not small to the reader. |
| Sentences beginning "Clausewright is the only…" | Sentences beginning "You…" | P5. Count the subjects; "you" must outnumber "we." |

### 4.4 Legal and professional register ⛔ *(all rows are compliance controls)*

| Don't write | Do write | Why |
|---|---|---|
| ⛔ "legal clause," "the law says" | "policy clause," "Amazon's policy says" | Marketplace policy is contract, not law. `NAMING.md §5.2`. |
| ⛔ "our counsel," "we advocate for you," "we represent you," "your case law" | "your reviewer," "we draft," "your appeal" | **R9** UPL control. Clausewright is a **maker**, never an adviser. `NAMING.md §5.1`. |
| ⛔ "legal advice," or omitting the disclaimer | "Not legal advice." — prominent on **every** surface that renders a draft | **B11**. |
| ⛔ "brief," "filing," "petition," "counsel's opinion" | "draft," "Plan of Action," "submission" | Lawyer's vocabulary; "Ironbrief" was struck for exactly this (`NAMING.md §6.2`). |
| ⛔ "we'll fight Amazon for you" | "we'll draft what you submit" | Adversarial-representation framing, straight into R9. |

### 4.5 Autonomy and access ⛔ *(all rows are compliance controls)*

| Don't write | Do write | Why |
|---|---|---|
| ⛔ "our AI agent," "autopilot," "fully automated appeals" | "copilot," "workflow," "you review and submit" | **D9/N7**. Anthropic, [*Building Effective Agents*](https://www.anthropic.com/engineering/building-effective-agents): workflows are predefined code paths. Don't market autonomy we didn't build. |
| ⛔ "we submit the appeal for you" | "you paste it into Account Health and submit — we'll tell you exactly where" | **N3**. No API exists; automating it would require credentials. |
| ⛔ "connect your Seller Central account" | "we never ask for your login, and we never will" | **N2/N11**. A bright line, and a competitor already markets its absence — so state it as a feature. |
| ⛔ "our bot monitors your account" | "we monitor and alert you, naming the specific policy at risk" | **N1/N14**. v1 monitoring is manual; don't describe automation that isn't shipped. |

### 4.6 Category and competitive language

| Don't write | Do write | Why |
|---|---|---|
| "AI POA generator," "appeal letter generator" | "suspension defense copilot" | **D3.** The category frame is the position. Using the old category word forfeits it. |
| "AI-powered" as a differentiator | "you can see the clause and its source" | Every competitor claims AI-powered; the claim is worth nothing (`§5.1`). |
| "Better than AppealDesk" / naming a competitor pejoratively | "AppealDesk is honest that it walks away when a case gets hard. We built the tier that takes those cases." | Dunford Step 7 sentences are specific and non-disparaging. Disparagement is both a legal risk and a credibility loss. |
| "The cheapest way to appeal" | "A tenth of a consultant's price, with a person available if you need one." | **D4/Ramanujam.** We are deliberately above the $97 incumbent; competing on cheapness is a minivation and voids the position. |
| "$149 (was $299!)" | "$149." | Fake anchoring against ourselves. The real anchor is the competitor's own published table. |

### 4.7 Product and UI microcopy

| Don't write | Do write | Why |
|---|---|---|
| "Error: classification failed" | "We're not confident enough in the reason code to draft this. Guessing would cost you an attempt, so we won't." | **R3/I5.** Refusal is the error-prevention mechanism, not a product failure. |
| "Upgrade to Pro for human review" | "This case needs a person. $399, same day." | SaaS-tier vocabulary on a panic purchase. Name the thing, name the price. |
| "Your submission is being processed" | "Amazon and Walmart don't commit to a turnaround. Most sellers hear back in 3–30 days. We'll check in on day 3." | Nielsen #1. Set the expectation *before* the silence, or the silence reads as our failure. |
| "Deficiencies: 4 ❌" in red | "Your draft is missing 4 things this reason code is usually rejected for." in neutral | `USER_JOURNEY.md §8.4`: diagnostic information, not an alarm. |
| "Cancel anytime" buried in a footer | Keep and lapse presented as two equally weighted one-click options | Nielsen #3; anti-dark-pattern posture the whole guarantee stack depends on. |

---

## 5. Naming usage rules

Inherits `NAMING.md §5` unchanged and extends it. These are binding.

### 5.1 The wordmark

| Rule | Form |
|---|---|
| **Product chrome, logo, URLs, handles** | `clausewright` — all lowercase, one unbroken token |
| **Prose, sentence-initial, formal documents** | `Clausewright` |
| **Never** | `ClauseWright`, `Clause Wright`, `CLAUSEWRIGHT` (except where a design system sets all-caps for a whole element), `clause-wright`, `CW` externally |
| **Pronunciation** (for demos, video, support calls) | **KLAWZ-ryte** — like "clause" + "write" |
| **Possessive** | "Clausewright's draft" — normal English possessive. |
| **Never a verb** | Not "clausewright your notice." A coined verb reads as consumer-app breeziness and fails P1. |
| **Never an acronym or initialism** | No "CW," no "C-Wright," no ticker-style shorthand. Single token or nothing. |
| **Legibility** | Per Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (Liquid Glass) app-naming guidance, the mark must survive at icon and label sizes; the single unbroken token truncates predictably and has no case or spacing ambiguity. Do not introduce a stylised variant that breaks this. |

### 5.2 First mention

On any surface a reader may land on cold, the first mention pairs name with category frame, once:

> **Clausewright** — a suspension defense copilot for Amazon and Walmart sellers.

The frame is lowercase and descriptive. We are claiming a category, not naming a second product.

### 5.3 Tier names

Tier names are fixed by `NAMING.md §1` and are **not** to be renamed, translated, or "clarified" in copy.

| Tier | Price | Written as | Never |
|---|---|---|---|
| **Decoder** | Free | "the free Decoder" / "Clausewright Decoder" | "free trial," "freemium tier," "lite" |
| **Rescue** | $149 one-time | "Rescue" / "Clausewright Rescue" | "Basic," "Standard," "Starter" |
| **Rescue + Human** | $399 one-time | "Rescue + Human" | "Premium," "Pro," "Plus," "Concierge" |
| **Shield** | $49/mo or $470/yr | "Shield" | "monitoring plan" as the primary noun — the value is the **included annual appeal**, not the alerts |
| **Shield Pro** | $149/mo | "Shield Pro" | "Enterprise," "Business," "Teams" |

**Grammar:** `Clausewright <Tier>` on first use per surface, bare `<Tier>` thereafter. Never `Clausewright's Rescue™`. No ™/® until a mark is actually registered (**N6** — counsel knockout in Class 9 and Class 42 is still outstanding).

### 5.4 The tagline

> **"Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side."**

- **Do not shorten it in half.** The first clause without the second is a competitor's tagline (any of them can say "you're losing money"). The second without the first fails **L1**.
- **Permitted short form for constrained surfaces** (≤60 chars): *"Get back to selling — with the clause on your side."*
- **"Dark" is the buyer's own word**, from the JTBD circumstance *"my account went dark this morning"* (Nielsen #2). Do not substitute "suspended," "down," "offline," or "deactivated" in the tagline itself — those words are correct everywhere else in the product but they are the platform's register, not the seller's.
- **What the tagline deliberately omits, and must continue to omit:** "POA," "document," "draft," "AI," "instantly," and any success rate. Naming the artifact re-enters AppealDesk's category (**D3**); a rate breaches **N10**.

### 5.5 The seven inherited naming invariants

Reproduced from `NAMING.md §5` because they bind copy, not just the name:

1. **Never pair the name with a professional-advisor title.** Prohibited: *counsel, advocate, attorney, lawyer, legal, litigation, represent, case law, our clients' cases.*
2. **Always "policy clause," never "legal clause."**
3. **"Not legal advice" stays prominent** on every surface that renders a draft.
4. **Never claim autonomy.** Prohibited: *agent, autopilot, automatic submission, we file for you, we log in.*
5. **Never publish a success rate** until B9 yields one with denominator and methodology.
6. **Never use an `Appeal*` or `Seller*` construction** in any product, tier, campaign, page or feature name. Those lexical fields are owned (AppealDesk, AppealDraft, AppealAI, PlatformAppeal, The Appeal Guru, Appeal Wizard; SellerCandy, SellerSonar, Seller Interactive, SellerApp). *Note: this constrains naming, not description — "your appeal" as a common noun is correct and necessary.*
7. **Brand the proof, not the feature.** Citations are presented as the **visible surface** of the outcome-feedback loop (**D10**, Process Power), so that when a competitor adds citations (**R7**) we already own both the word and the deeper claim beneath it.

### 5.6 The codename

**"Reinstate" is dead.** It appears only in Phase-1 historical documents, never in code identifiers, repo names, domains, Stripe descriptors, email templates, support macros or conversation with anyone outside the company. reinstate.io has traded since 2019 and ReinstateIQ is live (**D2/R1**); using the codename externally reproduces the exact defect Day 0 was spent removing.

**Related lexical hygiene:** avoid `Reinstate*` as a *product* construction, but "reinstated" and "reinstatement" as ordinary English verbs and nouns are correct and unavoidable — *"until you're reinstated"* is the customer's own word and is fine.

### 5.7 Domain and handle usage

Canonical domain per `NAMING.md §1`: `clausewright.com` (acquisition pending; `.io` is the launch fallback and is category-normal for SaaS). Phonetic defensives (`clauswright`, `clausright`, `clauzwright`) exist as **redirects only** and must never appear in copy, print or spoken form — a redirect that appears in an ad teaches the misspelling.

**The N1 spelling-friction mitigant, restated as a copy rule:** because Seller Central permits no links in replies while Reddit and Facebook groups do, the highest-throughput channels deliver the name as a **click, not a spelling**. Therefore: in link-permitted channels, always link; in link-prohibited channels, put the name in the profile/signature and never spell it out mid-reply as a call to action. *(Severity of this friction is a judgment call, not an A/B result — flagged as a hypothesis in §7.)*

---

## 6. Governance — how this stays true

Per the Twelve-Factor App's discipline of enforcing invariants structurally rather than procedurally ([12factor.net](https://12factor.net/)), and per `NAMING.md §3.3`'s observation that our central brand promise is already a CI test: a style guide that depends on remembering is a style guide that decays.

### 6.1 The pre-publish checklist

Every customer-facing string, before it ships:

1. **Compliance sweep (⛔ rows).** Any prohibited term from §4.4, §4.5, §5.5? → **block**.
2. **Claim sweep.** Does it assert an asset, a number or a rate we hold? If it names a number, is the number rendered live or measured by B9 with its *n*? → else **block**.
3. **Urgency sweep.** Is any urgency or scarcity claim real *and* system-rendered? → else **block**.
4. **Lead check.** Does it lead with the artifact instead of the outcome (**L1**)? → rewrite.
5. **Proof check.** Does it include at least one **L4** element, in the §3.3 order? → else rewrite.
6. **Register check.** Read it aloud, slowly, to an imagined person in tears (**P1**). Count "we" versus "you" (**P5**).
7. **Specificity check.** At least one checkable noun or number per paragraph (**P2**).

### 6.2 What should be enforced in code rather than review

Three brand promises are strong enough to be worth structural enforcement, and two already are:

| Promise | Enforcement | Status |
|---|---|---|
| No uncited policy reference reaches the UI | CI test; citation-object gate (**B4/I2**, applies to human reviewer edits too) | **Shipped, Day 2** |
| No success rate appears anywhere | Lint rule over copy strings: block `%` adjacent to reinstate/approve/success tokens outside a B9-generated block | **Recommended** |
| No scarcity string is hard-coded | Scarcity components accept a live count prop only; no literal permitted | **Recommended** |

### 6.3 Review cadence

- **Every surface, before launch:** §6.1 checklist.
- **At ≥40 paying customers:** revisit **L4.5** — B9 may now support a published rate. Publishing it is the single largest available jump on the binding constraint, and it must be published *with* its methodology, in our own register, in the same breath as its limitations. That combination is itself the differentiator in a category of unfalsifiable numbers.
- **On any competitor adding visible citations (R7):** do **not** escalate the citation claim. Move the emphasis one layer down, to **UA3** and the outcome loop, per invariant 7 — which is why invariant 7 exists.

---

## 7. Hypotheses, flagged per the literature-grounding standard

Not traceable to a published source. Recorded so Phase 3 does not mistake a judgment call for a finding.

1. **The ER-doctor register outperforms a warmer or more urgent register for this buyer.** Grounded in Nielsen's tone dimensions and the emotional-design constraints in `USER_JOURNEY.md §8`, but **no A/B evidence exists for this category**. It is the most testable claim in this document and should be the first copy experiment run once traffic exists.
2. **Leading with recovered cash flow beats leading with the cited clause in the hero.** Derived from Hormozi's Dream Outcome scoring, not measured. The opposite ordering (proof-first) is a legitimate variant to test, and is arguably better supported by D7.
3. **The §3.3 proof ordering reflects true PLA impact.** The ordering is `IDEA_DOSSIER §6.1`'s priority list, which is itself reasoned rather than measured.
4. **"Copilot" is legible to this buyer.** The word carries specific meaning in software circles; a sub-$2M FBA seller may read it as jargon. Test comprehension in the first 15 discovery calls (`IDEA_DOSSIER §12` action 7).
5. **N1 spelling friction is medium-high but survivable.** A judgment call in `NAMING.md §7`, carried forward here unchanged.
6. **Non-disparaging competitor sentences convert as well as sharper ones.** Chosen on credibility and legal grounds, not on measured conversion.
7. **Emoji prohibition and the no-exclamation rule are absolute goods here.** Reasoned from register, not measured.

---

## 8. Frameworks applied

- **April Dunford**, *Obviously Awesome* (2019) — the 10-step process run explicitly in §1: competitive alternatives (Step 2), unique attributes (Step 3), value themes (Step 4), "who cares a lot" (Step 5), market-category selection and the decision to define *Suspension Defense Copilot* rather than compete inside *AI POA generator* (Step 6, **D3**), the win-against-each-alternative test (Step 7, §1), trend layering onto cited/verifiable AI (Step 8), the canonical positioning statement (Step 9), and channel-level evangelism (Step 10).
- **Alex Hormozi**, *$100M Offers* (2021) — the value equation and the finding that **Perceived Likelihood of Achievement at 3/10 is the binding constraint** (§0, **D7**); Dream Outcome as the lead (§3.2); the guarantee taxonomy, unconditional-first (§3.4); the genuine-versus-manufactured urgency and scarcity rule as a hard constraint (§2.5, §4.2). *$100M Leads* (2023) — the lead magnet that solves a complete narrow problem while making the next problem obvious (§1 Step 10, §3.5 forum reply).
- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — segmentation by need and WTP, never demographics (§1 Step 5, §3.6); **minivation** as the reason we may not compete on cheapness (§4.6); anchoring/decoy — the $399 tier raising perceived likelihood of the $149 tier (§3.3, lever 4).
- **Jakob Nielsen / Nielsen Norman Group** — [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): #1 visibility of system status (§3.5, §4.7), #2 match between system and the real world (§2.4, §5.4), #3 user control and freedom (§2.4 R-4, §4.7), #5 error prevention as the governing heuristic for a one-shot appeal (§2.4 R-3), #8 aesthetic and minimalist design (§2.4 R-1), #9 error recovery (§4.3). Also the [four tone-of-voice dimensions](https://www.nngroup.com/articles/tone-of-voice-dimensions/) used to place the voice in §2.3.
- **Apple**, [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (Liquid Glass) — content-first deference, where the interface material recedes so content leads; adopted here as the verbal principle that **the voice recedes so the clause leads** (§2.1), plus wordmark legibility at icon and label sizes (§5.1).
- **Twelve-Factor App** — [12factor.net](https://12factor.net/) — guarantees enforced structurally in the codebase rather than procedurally in a runbook; applied to the citation invariant (§1 UA1), to live-rendered scarcity (§2.5, §4.2) and to the governance model (§6.2).
- **Patrick Lewis et al.**, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020 — [arXiv:2005.11401](https://arxiv.org/abs/2005.11401) — retrieval yields "more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline"; factuality is the branded axis (§0, §1 Step 3).
- **Andrej Karpathy**, [*Software 2.0*](https://karpathy.medium.com/software-2-0-a64152b37c35) (2017) — the dataset that defines desirable behaviour is the primary artifact; the reason UA3's *loop* is the thing worth branding once the asset exists (§1 Step 3).
- **Anthropic**, [*Building Effective Agents*](https://www.anthropic.com/engineering/building-effective-agents) — workflows ("predefined code paths") versus agents that "dynamically direct their own processes," and "find the simplest solution possible"; the architectural warrant for "copilot" and the prohibition on autonomy language (§1 Step 6, §4.5).
- **Anthropic**, [Citations](https://platform.claude.com/docs/en/build-with-claude/citations) — `cited_text` with source locations; the mechanism that makes UA1 an invariant rather than an adjective (§1 Step 3, §6.2).
- **Hamilton Helmer**, *7 Powers* (2016) — Process Power as the realistic 12–24 month path and the reason UA3 is un-cuttable; Branding power requiring durable exclusive association, hence invariant 7 (§1 Step 3, §5.5, §6.3).
- **Clayton Christensen**, *The Innovator's Dilemma* (1997) and Jobs-to-be-Done — the circumstance ("my account went dark this morning") and the job ("get me back online without burning my one good attempt") that supply both the tagline's language and P5 (§1 Step 2, §2.2, §3.1).
- **Geoffrey Moore**, *Crossing the Chasm* (1991) — single-beachhead discipline; all v1 hero copy written for S1 alone (§1 Step 5, §3.6).
- **Rob Fitzpatrick**, *The Mom Test* (2013) — the evidence hierarchy applied to Step 1 in the absence of our own customers, and applied inward to forbid marketing assets we do not hold (§1 Step 1, §1 Step 3, §4.1).
- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — Bullseye; Community 21/25 and Engineering as Marketing 22/25 as the entire evangelism path, and the reason the voice is written for the forum reply first (§1 Step 3 UA4, Step 10).
- **Barbara Fredrickson & Daniel Kahneman**, "Duration Neglect in Retrospective Evaluations of Affective Episodes," *JPSP* 65(1), 1993; **Daniel Kahneman**, *Thinking, Fast and Slow* (2011) — the peak-end rule; the reason register R-4 exists and why pressure is prohibited there (§2.4, §4.2).
- **George Akerlof**, "The Market for 'Lemons'," *QJE* 84(3), 1970 — adverse selection; why the cash-refund guarantee stays a test rather than default copy, and why honest triage and a strong guarantee are complements (§3.4).

---

**Document status:** binding for Phase 2. Amendments require a named published source and a note of what they supersede.
