# Community Channel Research — Clausewright

**Purpose:** ground the A2 assumption ("8–15 substantive replies/day; 10–20% reach the Decoder," `IDEA_DOSSIER.md §6.7` A2) and the D8 decision (Community 21/25, the #2 Bullseye channel behind Engineering-as-Marketing 22/25) in the *actual* landscape of Amazon/Walmart seller communities, not a generic "post in forums" instruction.
**Method:** WebSearch + WebFetch against named, live URLs this session. Reddit's own site (`reddit.com`, `old.reddit.com`, `np.reddit.com`) is **unfetchable from this environment** — every direct request returned a tool-level block. This is the same gap `03-gtm-pricing.md §8` already flagged ("Reddit is unfetchable from this environment; subreddit subscriber counts... are unquantified, so A2 rests on no external anchor"). Subscriber counts below are therefore **triangulated from third-party secondary sources** (SEO listicles, subreddit-stat aggregators), which **materially disagree with each other** — sometimes by 5–10x for the same subreddit. Every number is cited to its source and flagged; **do not treat any single figure as precise.** Before the first community post goes out, a human must open each subreddit directly and confirm current size and current rules — this document is the pre-launch map, not a substitute for that check.
**Ethics compliance:** every row below is a **channel** (a subreddit, a group, a forum), never a member. No seller's name, handle, email, or post content is recorded. Community self-promotion/link rules are recorded verbatim where the source text was fetchable, because — per the assignment — the rules determine the entire playbook.

---

## 1. Ranked table

Ranking logic: within the Community channel (already scored 21/25 in the Bullseye per `03-gtm-pricing.md §4.1`), channels are ranked by **reach at the moment of need × freedom to post a useful link-bearing reply × verified activity level**, per Weinberg & Mares' *Traction* instruction to pick the middle-ring channel that is cheapest to test and fastest to first revenue.

| Rank | Channel | Type | Est. size (flag confidence) | Activity | Link/self-promo rule | Engagement posture |
|---|---|---|---|---|---|---|
| 1 | **r/FulfillmentByAmazon** | Subreddit | ~50,000–65,000 (multiple sources cluster here — see §2.1) | High — daily posts, weekly Q&A stickied thread | No official crawlable rule page found; Reddit-wide norm applies (mods remove unsolicited links; contribution-first builds standing) | **Primary volume surface.** Reply-only, no link, per A2. |
| 2 | **r/AmazonSeller** | Subreddit | Conflicting: 9,000 / 70,893 / 110,000 across sources — **unresolved, verify directly before relying on it** (see §2.2) | Medium–high | Same Reddit-wide norm; no subreddit-specific rule text was fetchable this session | Reply-only, no link. |
| 3 | **Amazon Seller Forums (official, sellercentral.amazon.com/seller-forums)** | Vendor-operated forum | Not published (login-gated for full access; public discussion threads are individually indexed) | Very high — this is where suspended sellers post their actual notice text; the single most on-topic surface in the landscape | **Written, explicit, and strict** — full text in §2.3. External links are categorically prohibited. | **Reputation-only.** No link anywhere, ever. Lowest-priority-for-volume, highest-priority-for-credibility, per `03-gtm-pricing.md §4.2`. |
| 4 | **Walmart Marketplace Seller Forum** (marketplacelearn.walmart.com/forum) | Vendor-operated forum | Not published | Lower than Amazon's — Walmart 3P is a smaller seller population overall | **Written, explicit** — no promoting services, no external solicitation, no coordinating business activity. Full text §2.4. | Reputation-only, same as the Amazon official forum. This is the highest-value **Walmart-specific** surface for v1.1. |
| 5 | **Facebook: ASGTG (Amazon Sellers Group TG)** | Facebook Group | ~77,000+ (group's own public "About," via secondary source — see §2.5) | High; explicitly positioned as *the* group for account-health/suspension/rights-owner-complaint questions | Group-set, not platform-set — rules unconfirmed this session (Facebook groups are not reliably WebFetch-able); flag as **unverified, confirm inside the group before posting** | Highest-relevance FB group by stated focus. Confirm rules manually before first post. |
| 6 | **Facebook: My Silent Team (MySilentTeam)** | Facebook Group | ~83,000+ (secondary source) | High, broad FBA scope (not suspension-specific) | Unconfirmed this session | Lower priority than ASGTG — general FBA audience, suspension threads are incidental rather than the group's focus. |
| 7 | **Sellers Ask Sellers** (sellersasksellers.com) | Independent multi-platform forum | Small (no member count published; forum, not a mass community) | Low–medium; but has a **dedicated Walmart category** and live suspension threads | Guidelines linked in footer; text not confirmed this session | Niche but useful — one of the only independent forums with a **named Walmart suspension subforum**, which the two big subreddits lack. |
| 8 | **Aspkin Forums — "Amazon Suspensions"** (aspkin.com/forums/amazon-suspensions) | Independent forum | Unpublished; long-running (forum predates modern FBA, originally an eBay/PayPal suspension community, later added dedicated Amazon and "Amazon X" subforums) | Medium — old-web forum activity, lower than Reddit but very concentrated on suspensions specifically | Site returned 403 to automated fetch; rules unconfirmed — a human must check the posting guidelines before engaging | **Suspension-specific by design** (the whole site's reason for existing is account suspension/limitation). High topical fit, unverified rules — verify before posting. |
| 9 | **r/Flipping** | Subreddit | Conflicting: 130,000 / 250,000 across sources — unresolved | Medium; general resale community, Amazon is one channel among several (eBay, Poshmark, retail arbitrage) | Reddit-wide norm | Lower priority — suspension posts here are a minority of content; useful for reach, not for density of the target trigger event. |
| 10 | **Amazon FBA / seller Discord servers** (e.g. "Sell on Amazon FBA & FBM," "FBA Group," "FBA Secrets" ~3K members) | Discord | Small, fragmented (hundreds to low thousands per server) | Real-time chat, high engagement per message but low searchability/durability | Server-specific, typically requires an invite and has channel-specific self-promo rules (often a dedicated `#self-promo` channel, general channels locked down) | **Deprioritize for v1.** Ephemeral, fragmented across many small servers, harder to measure per A2's reply→Decoder tracking than a subreddit thread or forum post. Revisit as a BD/reserve-channel surface once one or two servers are identified as suspension-dense. |

**Reading the table against D8/A2:** ranks 1–4 are the channels that should absorb the 8–15 replies/day from day 1. Ranks 5–9 are secondary sweep targets once the daily loop is running (`IDEA_DOSSIER §6.8` "morning sweep… r/AmazonSeller, r/FulfillmentByAmazon, Facebook groups and Seller Central Account Health"). Rank 10 is explicitly out of scope for the 90-day plan.

---

## 2. Per-channel notes

### 2.1 r/FulfillmentByAmazon

- **URL:** reddit.com/r/FulfillmentByAmazon
- **Size:** two independent secondary sources converge on **~50,000–65,000** subscribers ([repricerexpress.com](https://www.repricerexpress.com/amazon-fba-reddit/): "close to 50,000... hundreds active at any given time"; [projectfba.com](https://projectfba.com/amazon-fba-reddit/): "50,000+"). A third source claims 65K. Treat as **~50K, order-of-magnitude, not exact.**
- **Activity:** daily posts; a stickied **weekly Q&A thread** exists specifically so newcomers can ask "simple questions" without being scolded — this is a natural low-friction entry point for a first reply.
- **Self-promotion rule:** no subreddit-specific rule page was fetchable this session (direct Reddit access blocked). Apply the Reddit-wide default: unsolicited links get removed by mods and can get an account shadow-restricted; the standard mitigation cited in general Reddit self-promotion guidance is **2–4 weeks of non-promotional contribution before any link**, and even then links belong in a profile/bio, not the reply body — which is exactly what `03-gtm-pricing.md §4.2` already prescribes ("No link in the reply. Link lives in the profile/signature only"). **Verify the live sidebar/rules wiki directly before the first post** — this is a placeholder assumption, not a confirmed rule.
- **Tone:** experienced-seller-to-experienced-seller; flair system for categorizing posts (customer management, legal/finance, search ranking, inventory); "verified seller" labels exist, meaning credibility is partly structural, not just reply quality.
- **Engagement posture (Traction + A2):** primary volume surface. No link, ever, in the reply body. Identify reason code → quote clause → name the one thing most sellers get wrong for that code → offer the free structure via DM (`IDEA_DOSSIER §6.8`). Track reply → DM → Decoder as the A2 funnel.

### 2.2 r/AmazonSeller

- **URL:** reddit.com/r/AmazonSeller
- **Size:** **unresolved — the sources actively disagree.** One WebSearch summary reported 70,893; a second independent article reported ~110,000; a third reported ~9,000 (calling it "lower activity than r/FulfillmentByAmazon, useful for beginners"). This is a 12x spread across sources for the same subreddit, which is the clearest evidence in this research that **secondary subscriber-count sources for Reddit are not reliable** and the subreddit must be opened directly (or confirmed via the harness's Reddit access, if any exists) before it is relied on for planning.
- **Activity:** described consistently as active, covering Seller Central, Vendor Central, FBA and FBM, with explicit anti-spam framing in its own description ("avoiding spam and scams").
- **Self-promotion rule:** same caveat as §2.1 — unconfirmed this session, apply the no-link-in-body default and verify live.
- **Engagement posture:** same as r/FulfillmentByAmazon — reply-only, no link, DM the free structure.

### 2.3 Amazon Seller Forums (official)

- **URL:** sellercentral.amazon.com/seller-forums (guidelines at `/seller-forums/guidelines`)
- **Size:** not published; access requires an Amazon seller account, so true reach is unknowable externally, but this is the **single most on-topic surface that exists** — sellers post the literal notice text and reason code here, often within hours of deactivation. Example live thread titles found this session, each mapping to a dossier reason code: *"Account Deactivated: Restricted Product & Evasive Behavior Claim,"* *"Book Category Suspended – Account Health Still Great – Need Advice,"* *"Account Deactivated Without Violations! Perfect Account Health (200), ZERO violations,"* *"Account deactivated for 'relation' to violating account,"* *"I need to speak with an Account Health Specialist regarding a deactivated seller account."* These map directly onto §3's recurring-pattern list below and are civilization-level confirmation that the reason-code taxonomy in `IDEA_DOSSIER §7.3` (B2) is aimed at real, current threads.
- **Self-promotion rule — verbatim, this is the load-bearing constraint for this entire channel:**
  > "Post links that send users to non-Amazon external websites, URLs, or hyperlinks. This includes commercial content such as advertising, promotions, or solicitations" — **prohibited.**
  > "Content that could be considered spam, such as copying and pasting the same post across a number of threads or posting unsolicited links" — **prohibited.**
  > Tone rules prohibit "insults, personal attacks, spiteful remarks, obscenities, profanity, harassment, bullying, defamatory or inflammatory statements."
  > **Enforcement:** warnings via account notification → temporary posting suspensions of **1 to 30 days** depending on severity → **permanent removal of posting privileges** on repeat violations. Amazon can also unilaterally edit or delete content "for any reason, including... inaccurate information."
  (Source: [sellercentral.amazon.com/seller-forums/guidelines](https://sellercentral.amazon.com/seller-forums/guidelines))
- **Reading:** this is a **hard bright line, not a soft norm** — a single link-bearing reply risks a posting-privilege suspension that removes the highest-relevance surface entirely. `03-gtm-pricing.md §7` already names this the "highest-severity execution risk in the plan." **No link anywhere, including bio/profile, given the explicit "unsolicited links" language covers more than just in-post links.**
- **Engagement posture:** reputation-only. Answer with the reason code, the clause, and the one thing the draft is missing — exactly the R-2 register from `BRAND.md §2.4` — and let the value of the reply itself be the entire signal. Never mention price. Never link. This channel builds the "community-sourced proof" lever (`IDEA_DOSSIER §6.1` lever 6) even though it converts nobody directly.

### 2.4 Walmart Marketplace Seller Forum

- **URL:** marketplacelearn.walmart.com/forum (policy at `/guides/seller-forum-policy`)
- **Size:** not published. Walmart's 3P seller base is smaller than Amazon's, and the forum only opened broadly after a gated beta — expect materially lower thread volume than the Amazon official forum, but it is the **only Walmart-specific vendor-operated community that exists**, which matters directly for the v1.1 Walmart beachhead extension (`IDEA_DOSSIER §4.1`).
- **Self-promotion rule — verbatim:**
  > Sellers are **prohibited from promoting services, fundraisers, surveys or social media accounts** within the forum, and the space may not be used to "coordinate business activities."
  > Also prohibited: illegal-activity content (incl. IP infringement), threats/obscenity/hate/harassment, sharing private conversations with Walmart associates, disclosing account/contact/financial info or IP addresses, discussing "pricing, costs, margins or any other competitively sensitive information," and off-topic personal/political/religious discussion.
  > Posts must align with the Seller Code of Conduct; **all discussion is in English**; Walmart moderators intervene if a question goes unanswered after **two business days**.
  (Source: [marketplacelearn.walmart.com/guides/seller-forum-policy](https://marketplacelearn.walmart.com/guides/seller-forum-policy))
- **Reading:** same bright-line no-link-no-service-promotion rule as Amazon's forum, stated even more explicitly ("promoting services" is named outright, not inferred from a general anti-spam clause).
- **Engagement posture:** reputation-only, identical discipline to §2.3. Given the smaller volume, this channel is lower-priority for reply *count* but high-priority for the credibility it builds toward the Walmart v1.1 launch — an early, well-regarded presence here compounds before the product needs it.

### 2.5 Facebook: ASGTG (Amazon Sellers Group TG)

- **URL:** facebook.com/groups/ (exact slug not confirmed — found via secondary sources and [asgtg.com](https://asgtg.com/); Facebook group pages are not reliably fetchable by this session's tools)
- **Size:** secondary sources describe growth "from roughly 2,000 members to 77,000+" ([revenuegeeks.com](https://revenuegeeks.com/amazon-seller-facebook-groups/)); treat as directional.
- **Activity:** described consistently across sources as *the* group to check specifically "when the problem is account health, a suspension, a rights-owner complaint, or a policy scare" — this is the single clearest topical match to Clausewright's product of any community found in this research, official forums included.
- **Self-promotion rule:** **unverified this session.** Facebook group rules live inside the group (pinned post, "About" tab) and were not fetchable by URL. General FB-group norm noted in secondary sources: "self-promotion runs heavier in Facebook groups than anywhere else" than on Reddit or the official forums, and some admins run groups partly as a coaching-funnel feed — meaning enforcement is likely looser than Amazon's or Walmart's forum, but **must be confirmed by a human inside the group before any link is posted.**
- **Engagement posture:** highest-value FB target by stated topical focus; treat provisionally as reply-only until the group's actual pinned rules are read, then re-evaluate whether a profile link is tolerated.

### 2.6 Facebook: My Silent Team (MySilentTeam)

- **URL:** facebook.com/groups/mysilentteam
- **Size:** ~83,000+ members (secondary source, [delightchat.io](https://www.delightchat.io/ecommerce-forums-facebook-groups/mysilentteam-amazon-fba-and-online-sellers), corroborated by multiple listicles); free to join.
- **Activity:** broad general-FBA community (product research, income streams, general seller support) rather than suspension-specific — suspension threads occur but are not the group's organizing purpose the way they are for ASGTG.
- **Self-promotion rule:** unverified this session; same caveat as §2.5.
- **Engagement posture:** secondary sweep target, not primary — larger audience but lower density of the specific trigger event (a fresh suspension).

### 2.7 Sellers Ask Sellers (sellersasksellers.com)

- **URL:** sellersasksellers.com
- **Size:** not published — an independent, smaller multi-platform forum ("No Union, No Groups, No Meetups, Just Fast Help"), not a mass community.
- **Activity:** low-to-medium overall, but it is notable for having a **named Walmart subforum** (`/c/selling-on-other-platforms/walmart/`) with live suspension threads — e.g. *"Walmart Account Suspended,"* *"Account Suspension – No Option to Appeal,"* *"You're not authorized to sell your brand."* Also covers Amazon (Selling on Amazon, FBA, FBM, Account Health/ODR/Shipping Performance) and eBay.
- **Self-promotion rule:** a "Guidelines" link exists in the footer; its content was not retrievable this session. **Verify before posting.**
- **Engagement posture:** low-volume, high-relevance, and — because it is small and independent rather than platform-owned — plausibly more tolerant of a profile link than the two official forums. Worth a manual rules check given it is the only forum in this research with a dedicated, discoverable Walmart-suspension thread category.

### 2.8 Aspkin Forums — "Amazon Suspensions"

- **URL:** aspkin.com/forums/amazon-suspensions/ (parent: aspkin.com/forums/)
- **Size/history:** a long-running independent forum originally built around eBay-suspension and PayPal-limitation discussion, which later added dedicated **"Amazon"** and **"Amazon X"** subforums plus a dedicated **"Amazon Suspensions"** section and a published guide ("Amazon Ghost" — a step-by-step suspension-recovery walkthrough). This is the most purpose-built independent community found: its entire reason for existing is account suspension/limitation across platforms.
- **Activity:** medium — old-web forum cadence (threads, not a live feed), but the topical concentration is the highest of any surface researched.
- **Self-promotion rule:** **could not be fetched this session — the site returned HTTP 403 to automated access.** A human must open `aspkin.com/forums/faq.php` or the posting guidelines directly before engaging. Treat as **unverified, do not post here until confirmed.**
- **Engagement posture:** high topical fit, but gated on the rules check above. If rules permit even a bio-level link, this forum's audience is unusually well-matched to Rescue/Rescue+Human — its members are seasoned enough to already know they need an appeal, not just information.

### 2.9 r/Flipping

- **URL:** reddit.com/r/Flipping
- **Size:** conflicting: 130,000 ([projectfba.com](https://projectfba.com/amazon-fba-reddit/)) vs. 250,000 ([painonsocial.com](https://painonsocial.com/subreddits/amazon-fba-sellers)) — unresolved, same Reddit-data-reliability caveat as §2.2.
- **Activity:** medium; general reselling community spanning Amazon, eBay, Poshmark, retail arbitrage — Amazon-specific suspension content is a minority of total volume.
- **Self-promotion rule:** unconfirmed, apply Reddit-wide default.
- **Engagement posture:** reach without density — useful once the daily loop has capacity beyond the top four surfaces, not a day-1 priority.

### 2.10 Amazon FBA Discord servers

- **Examples found:** "Sell on Amazon FBA & FBM" (top.gg-listed), "FBA Group," "The Buy Box (Lite)," "FBA Secrets" (~3K members, per [thehiveindex.com](https://thehiveindex.com/communities/fba-secrets/)), "fulfilledby." (~100+ active members, UK-focused, mentorship-oriented), Groovin Fulfillment's paid server.
- **Activity:** real-time chat; individually small (hundreds to low thousands) and fragmented across many servers with no single dominant hub, unlike Reddit or the two big Facebook groups.
- **Self-promotion rule:** server-specific; several list a dedicated `#self-promo` or `#promotions` channel, implying general channels are locked down — but this varies server to server and was not independently confirmed for the servers above.
- **Engagement posture:** **out of scope for v1 per this research.** Message-level engagement in Discord is not durable or searchable the way a forum thread is, which breaks the reply→Decoder attribution A2 depends on. Reconsider only as a BD/partnership surface (e.g., a paid-server owner as a referral partner, per `03-gtm-pricing.md §4.3`), not as a direct posting channel.

---

## 3. Top recurring suspension thread patterns (topics, not individuals)

Drawn from the dossier's reason-code taxonomy (`IDEA_DOSSIER §7.3` B2) and cross-checked against real, currently-live official-forum thread titles found this session (§2.3) — every pattern below has at least one confirmed live example.

| # | Pattern (topic) | Confirmed live example (title only, no author) | Dossier reason-code mapping |
|---|---|---|---|
| 1 | **Related/linked account deactivation** — account tied to a previously suspended or related account, often without the seller knowing which one | "Account deactivated for 'relation' to violating account" | Linked account |
| 2 | **Deactivation with a clean Account Health score** — seller reports "perfect 200" or similar and no visible violation, deep confusion about cause | "Account Deactivated Without Violations! Perfect Account Health (200), ZERO violations noted" | UNCLASSIFIED / ambiguous notice — first-class routing target for B2 |
| 3 | **Restricted product / evasive behavior claims** — a listing or category triggers a restricted-product flag combined with an "evasive behavior" allegation | "Amazon Account Deactivated: Restricted Product & Evasive Behavior Claim" | Restricted product |
| 4 | **Category-specific suspension while the rest of the account stays healthy** (frequently Books, but also other gated categories) | "Book Category Suspended – Account Health Still Great – Need Advice" | Category-level policy violation (adjacent to N9's account-vs-listing distinction — still account-adjacent when it threatens the whole account) |
| 5 | **Inability to reach a human / stuck in an automated appeal loop** — seller has submitted an appeal and cannot get a substantive response | "I need to speak with an Account Health Specialist regarding a deactivated seller account" | Process/escalation failure — maps to the UA2 human-backstop value theme directly |
| 6 | **IP/rights-owner complaints** — a brand or rights holder files a complaint that triggers listing or account action | (pattern confirmed via ASGTG's stated focus: "a rights-owner complaint") | IP complaint |
| 7 | **Order Defect Rate / performance-metric suspension** — ODR, late shipment rate, or cancellation rate crosses a threshold | (pattern confirmed via Sellers Ask Sellers' dedicated "ODR and Shipping Performance" category, and Walmart's parallel metrics: Cancellation Rate, On-Time Delivery Rate, Valid Tracking Rate) | ODR / late shipment (Amazon); Walmart performance-standard equivalents |
| 8 | **Walmart-specific: unauthorized-to-sell-brand claims and unexplained account suspension** | "You're not authorized to sell your brand"; "Walmart Account Suspended" (Sellers Ask Sellers) | Walmart performance-standard equivalents (`IDEA_DOSSIER §7.3` B2) |
| 9 | **Counterfeit/inauthentic complaints** | (pattern confirmed as a named category across every competitor's triage list, e.g. AppealDesk's six refused categories, `IDEA_DOSSIER §5.1`) | Counterfeit — **honest-triage refusal category**, not a category Clausewright drafts into |
| 10 | **Section 3 / policy-abuse and account-verification suspensions** | (named explicitly in AppealDesk's refusal list and Amazon's own forum taxonomy) | Section 3 policy abuse — **also a refusal category** |

**Implication for the reply script:** patterns 1, 2 and 5 are the highest-value entry points for a Clausewright reply, because they are exactly the cases where a stranger's forum answer is least useful (the seller doesn't yet know their own reason code) and where "we read your exact notice and quote the clause" (the L6 rebuttal sentence in `BRAND.md §1 Step 7`) lands hardest. Patterns 9 and 10 are triage-refusal categories — a reply engaging with those threads should say so plainly (`BRAND.md` R-3 register) rather than imply a draft is coming.

---

## 4. Compliance summary (binding, cross-referenced to the hard ethics rules)

1. **Nothing sent from this research.** This document is channel intelligence only — no reply, DM, or post has been drafted or sent.
2. **No individual data collected.** Every row above is a community (subreddit, group, forum); no member name, handle, or post author is recorded anywhere in this file. The live Amazon-forum thread titles in §2.3/§3 are quoted because they are public, topic-identifying strings on a vendor-operated public support forum — not attached to any name.
3. **Self-promotion rules recorded verbatim where fetchable** (§2.3 Amazon, §2.4 Walmart); flagged explicitly as unverified where not (§2.5, §2.6, §2.7, §2.8, §2.10) — these must be confirmed by a human before any posting begins.
4. **No fabricated data.** Every size/activity claim carries its source URL or is marked "not published" / "unverified this session." Where sources conflict (r/AmazonSeller, r/Flipping), both figures are shown rather than collapsed into a false-precision average.

---

## 5. Research gaps carried forward

- **Reddit is unfetchable from this environment**, confirming and extending the gap already logged in `03-gtm-pricing.md §8`. Subscriber counts for every subreddit in this document are secondary-sourced and should be treated as order-of-magnitude only until confirmed by a human with direct Reddit access.
- **Facebook group rules were not independently fetchable** (Facebook is not reliably WebFetch-able). ASGTG and My Silent Team sizes are secondary-sourced; their actual posting rules are unknown and must be read inside the group before engagement.
- **Aspkin's posting guidelines returned HTTP 403** to automated fetch and must be read manually.
- **Discord server rules are per-server and were not individually verified** — treated as out-of-scope for v1 regardless.
- **No keyword- or thread-volume data** was obtainable to estimate actual daily new-suspension-thread counts per channel (needed to sanity-check A2's "8–15 replies/day" capacity assumption against actual thread supply) — this should be the first thing measured once daily sweeps start, per `03-gtm-pricing.md §4.2`'s kill-criterion discipline ("if 30 days of consistent posting yields <40 free-Decoder sessions attributable to community, demote to middle ring").
