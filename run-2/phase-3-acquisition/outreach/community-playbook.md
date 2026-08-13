# Community Playbook — what a company with no humans may legitimately contribute

**Subject:** the ethics and the mechanics of a no-human product in other people's forums. What it may publish, what it may never publish, and the exact disclosure that has to travel with anything it does.
**Status:** **DRAFT ON DISK. Nothing in this file has been posted anywhere, and no venue account exists.**
**BUILD STATE:** two mechanisms this file relies on are marked in place. §7's published-address invariant **is built** (`app/tests/platform/g5.test.ts`, run by CI). §6's citation instrumentation **is not** — no referrer or attribution field exists in the app — and §4 row 1's permission is now conditional on an unread verification step (§4.1). Nothing else here describes machinery: §§1–5 are an argument and a disclosure text, and both stand on their own.
**Method:** every rule quoted below was fetched in-session on **2026-08-13** from the venue or the regulator that wrote it. Where a rule could not be read, it is marked unread and nothing is inferred from it.
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1, D9 · `CORRECTIONS.md` (Scope A) · `BRAND.md` §3.5, §5.3 · `research/03-communities-and-lists.md`.

---

## 1. The question, and the answer that governs the rest

`research/03` established that communities are not a channel here, and that the venues are shut to machines on both sides of the door. That settles the *strategy*. It does not settle the *ethics*, and the ethics are the part that will still be true if a venue opens tomorrow.

The question is narrow and it is uncomfortable: **may a product with no support human post in a help forum?**

The answer this playbook adopts:

> **Ratepin may publish objects. It may not participate in conversations.**
>
> An object is a thing that stands on its own, carries its own date, and asks nothing of a reader — a page, a dataset, a feed, a factual listing field. A conversation is an exchange in which the reader may reasonably expect a next turn.

The reason is not politeness and it is not brand tone. It is that **participation manufactures an expectation that A3 guarantees will be disappointed.** `research/01-channels.md` §3 refused three re-entry disguises by name — the short onboarding call, the webinar, the shared Slack channel. A helpful forum reply is the fourth and by far the most tempting, because it looks like generosity rather than like selling. It is worse than the other three, not better: the onboarding call at least ends when the call ends. A helpful reply in a public thread stands there for years, inviting the next reader to ask a follow-up that no one will answer.

---

## 2. Three prohibitions, from primary sources

### 2.1 The venues themselves forbid machine-authored posts

Not "discourage". Forbid, in writing, in the two venues a software launch is expected to use:

- **Hacker News**, site guidelines, read today: *"Don't post generated text or AI-edited text. HN is for conversation between humans."* And Show HN: *"The project must be something you've worked on personally and which you're around to discuss."*
- **Product Hunt**, commenting guidelines, read today: *"Product Hunt is about person-to-person interactions. Our community wants to talk to and hear from real people. No LLMs or Chrome extensions please!"*

There is no disclosure that makes a banned post permitted. A labelled violation is still a violation. This is the first and cheapest test, and it disposes of most of the map before ethics is reached.

### 2.2 The law forbids the specific shortcut this company would be tempted by

The FTC's Rule on the Use of Consumer Reviews and Testimonials, **16 CFR Part 465** (source note: 89 FR 68077, 22 August 2024), fetched today from the eCFR API. Three sections bind us directly.

**§465.2(a)** — it is an unfair or deceptive act for a business to *"write, create, or sell a consumer review, consumer testimonial, or celebrity testimonial that materially misrepresents, expressly or by implication: (1) That the reviewer or testimonialist exists; (2) That the reviewer or testimonialist used or otherwise had experience with the product…"*

A product whose copy is generated could generate a plausible contractor and a plausible experience in about four seconds. **§465.2 is why that is not a temptation to be managed but a line the build must make unreachable.** Nothing in Ratepin ever writes a first-person account of using Ratepin.

**§465.5(a)** — it is an unfair or deceptive act *"for an officer or manager of a business to write or create a consumer review or consumer testimonial about the business or one of the products or services it sells that fails to have a clear and conspicuous disclosure of the officer's or manager's material relationship to the business."*

This is the section that governs every forum post we might ever make, because every post we might make is an insider post. There is no other kind available to us.

**§465.6** — it is an unfair or deceptive act to *"materially misrepresent… that a website, organization, or entity that it controls, owns, or operates provides independent reviews or opinions."* No comparison site, no "best certified payroll software 2027" page, no adjacent domain that reads as neutral. `BRAND.md` §3.6 already forbids the competitor-alternative page as positioning; §465.6 forbids the more elaborate version of it as law.

### 2.3 The disclosure standard is stricter than a link

**§465.1(c)(4)**, verbatim:

> *"In any communication using an interactive electronic medium, such as social media or the internet, the disclosure must be unavoidable. A disclosure is not clear and conspicuous if a consumer must take any action, such as clicking on a hyperlink or hovering over an icon, to see it."*

And §465.1(c)(7): the disclosure *"must not be contradicted or mitigated by, or inconsistent with, anything else in the communication."*

That single paragraph eliminates the comfortable version of this whole exercise — a small "we're the vendor" link under a helpful answer. The disclosure has to be in the body, above the fold of the post, in the same type as the post. Which means it takes up the space where the sales pitch would go, and that is the correct outcome.

---

## 3. The standing disclosure

One text, three lengths, used unmodified wherever any of it applies. It is not tuned for conversion and it is never A/B tested; a disclosure with variants is a disclosure being optimised against its own purpose.

**One sentence in it takes two forms, and that is not a variant.** The no-next-turn sentence differs between a post and a message because *the plumbing behind it differs*: a reply to a post reaches nobody, and a reply to a message reaches a counted mailbox. Choosing the true one is not tuning; printing the same absolute on both surfaces would be. Nothing else in the text changes, and nothing changes for any other reason.

### 3.1 Full form — the canonical text

**The no-next-turn sentence is scoped to its surface, and there are two surfaces.** The old text carried one absolute — *"Nothing you write in reply is delivered to anyone"* — which is true of a post in somebody else's venue and **false of an email we send**, because a reply to an email lands at a published address, increments G5's raw counter and is answered inside the minutes the gate charges us (`lifecycle-emails.md` §2 C1, §7). A disclosure that is false on one of the two surfaces it is used on is not a disclosure; §465.1(c)(7) requires that it not be *"contradicted or mitigated by, or inconsistent with, anything else in the communication."* So the sentence is now written per surface, and each version is true of the surface it appears on.

> **Published by Ratepin, automatically.**
> Ratepin is a paid product and this is its vendor's own message, not a user's. It was written and published by software; no person at Ratepin composed it, chose where it went, or is reading this page.
> **`{no_next_turn_sentence}`** — exactly one of the two, chosen by surface and never edited:
> · *In a post, a listing or any page we publish:* **Nothing you write in reply to this post reaches anyone. There is no support queue and no human reviews any Ratepin output, at any tier.**
> · *In a message we send to an address:* **No one is waiting on a reply to this message. There is no support queue and no human reviews any Ratepin output, at any tier — and one address does reach a mailbox, the billing address, where every message received is counted and published.**
> If something here is wrong, the correction path is in the product itself and it is dated: `{correction_url}`. The billing address and its counter are at `{status_url}`.

Five properties, and each does a specific job:

| Property | Sentence carrying it | Why it must be there |
|---|---|---|
| **Authorship** | "Published by Ratepin, automatically" | §465.5(a): the material relationship, unavoidable, in the body |
| **Non-human origin** | "written and published by software; no person… composed it" | The venue rules in §2.1 exist because readers assume a person. Where a venue permits the post at all, the assumption still has to be corrected |
| **No next turn** | `{no_next_turn_sentence}`, one of the two above | The whole ethical load. It is stated as a fact about the plumbing, not as an apology — and it is stated **per surface**, because the plumbing differs between a post and a message. The post version is an absolute because it is true absolutely; the message version does not claim an absolute it cannot keep |
| **Where the answer lives instead** | the correction path | A refusal without a route is abandonment. A3 requires the resolution to be in-product, and this points at it |
| **The one real address, and its cost to us** | the billing address and the published counter | It closes the evasion. We do not get to claim autonomy while hiding a mailbox — `USER_JOURNEY.md` §11.8 makes every published address countable, and this sentence tells the reader the counter exists |

### 3.2 One-line form — for fields with a length limit

Two forms, same rule: the one that ships is the one true of the surface.

> *For a post, a listing or a page:* **Published automatically by Ratepin, the vendor. Replies here reach nobody; the billing address is the only address that reaches a mailbox. Corrections at `{correction_url}`.**
>
> *For a message sent to an address:* **Sent automatically by Ratepin, the vendor. No one is waiting on a reply; the billing address is the only one that is read, and every message to it is counted. Corrections at `{correction_url}`.**

**Why the billing-address clause survives even the short form.** The one-line version is the one most likely to be read alone, and the absolute it used to carry — *"No reply here reaches a person"* — was the sentence the full form had already hedged two lines later. A short disclosure that is more absolute than the long one is a short disclosure that is less true.

**Rule:** if a venue's field is too short to carry even this — including the billing-address clause — the venue is one where a §465.1(c)(4)-compliant disclosure is impossible, and we do not post. The shortness of the field is the finding, not an obstacle to route around.

### 3.3 Artifact form — for anything that travels

Already specified and already shipping (`BRAND.md` §6.7): the artifact footer's boundary line — **"Ratepin computes and formats. You certify and file. This is not legal advice."** — is the disclosure in the place it matters most, on a document that will be read by more strangers than any page we publish. It is non-configurable and has no white-label option at any tier.

Quoted from `app/src/artifacts/provenance.ts:58` (`BOUNDARY_STATEMENT`), which is where `provenanceFooterLines()` reads it. **An earlier draft of this section paraphrased it** as *"the third line — Ratepin computes and formats. The contractor certifies and files."* Both halves were wrong: it is not the third line, and the shipped sentence addresses the reader in the second person and carries a third clause. A disclosure quoted from memory is not quoted.

---

## 4. The permission table

| # | Contribution | Permitted? | Reason |
|---|---|---|---|
| 1 | A factual product listing in a directory (name, description, price, category, screenshots) | **Conditional — see §4.1** | It is data about ourselves in a slot built for data about ourselves. `research/03` is right that it is a placement, not a channel. But the submission is not the end of it, and §4.1 is the A1 test the row had not been given |
| 2 | A public dataset, feed or changelog on our own domain that others may cite | **Yes** | An object, on our own domain, submitted to nobody. **Audited under §4.1 and clean: there is no counterparty**, so no reply can be required of us |
| 3 | A correction to a factual error **about our own product** in someone else's post | **No** | It is a conversational turn, and it invites the follow-up we will not answer. The correction belongs on our page, dated, where the reader who cares will find it |
| 4 | Answering a technical question in a help forum, with or without a link | **No** — see §5 | The core case. It fails on the venue rules and on the deeper ground in §5 |
| 5 | A review of Ratepin, by anyone with a material relationship to Ratepin | **Never** | 16 CFR 465.2, 465.5. No exception for a disclosed one — the honest version is simply not writing it |
| 6 | Soliciting reviews from customers | **Only** as a generalized, non-incentivized, sentiment-neutral request | §465.4 forbids compensation or incentives conditioned on sentiment; §465.2(d)(1) preserves generalized solicitations. In practice we do not do this at launch, because we have no customers and asking would be theatre |
| 7 | Upvoting, liking, following or any engagement signal from a company account | **No** | §465.1(h)'s "fake indicators of social media influence" defines the category we would be adding to. It is also pointless: an engagement signal is not an object |
| 8 | An operated account with a person's name, photo or bio | **Never** | It is the sockpuppet, and Product Hunt's profile requirements are the mechanism that would force us into one. A venue that requires a face is a venue we leave |
| 9 | A "why we built this" founder story | **No** | There is no founder posting it, and the genre's entire persuasive force is the implied person |
| 10 | Paying a person to post on our behalf | **No** | It converts a structural constraint into a laundered one, and §465.5(b)(1) puts the disclosure duty back on us anyway |
| 11 | A comparison site or "alternatives" property we own | **Never** | §465.6 |
| 12 | Editing an encyclopedia or wiki entry about ourselves or the category | **No** | Conflict of interest by construction, and the edit is a conversational act in a venue with a talk page |

### 4.1 The question the two "yes" rows were never asked

The twelve rows above were argued to a quoted rule or a statute wherever the answer was *no*, and the two rows where the answer was *yes* carried no venue-rule probe at all. That asymmetry is the one that survives review, because refusals look rigorous by themselves. **A1 is a gate, not a weight**, and it applies with the same force to a channel we are keeping.

**The test, applied to every permitted contribution, now and in future:** *what happens when they reply asking for something?* If the answer is "someone writes back", the contribution is dead by A1 and belongs in §8 with its reason, not softened into a condition.

| Row | Is there a person on their side? | Ruling |
|---|---|---|
| 2 — a dataset, feed or changelog on our own domain | **No.** Nothing is submitted to anyone; a third party may read it or not | **Permitted.** This is the only community contribution that passes cleanly |
| 1 — a directory listing | **Unresolved, and it is the whole question.** `launch-posts.md` §2 records the G2 Digital Markets vendor path behind a login we did not create; the listing flow ends in a submitted form **awaiting verification**, and nobody has established that the verification is unattended | **Conditional, and the condition is a gate, not a caveat** |

**The condition on row 1, stated so it can be failed.** The listing is permitted only if the whole path — submit, verify, publish — completes without a person at the vendor requiring anything of us. If verification returns a question, a document request, a call, or a "reply to this email to confirm", **then a human is required on our side and the row is dead by A1**: it moves to §8's refused list with the reason *"vendor verification is a correspondence"*, and `launch-posts.md` LP-2 is abandoned rather than answered. That is the same ruling `research/01` §3 gave the onboarding call, and there is no version of it we get to keep because the listing is free.

**What resolves it:** reading what `app.g2digitalmarkets.com/get-listed/start` actually asks for. That has not been done, and until it is, row 1 is **unverified**, not permitted — which is also the correction `channels.csv` CH-15f needs.

---

## 5. The hard case, in full: the help forum

Take the sympathetic version. A payroll clerk posts: *"How do I fill column 6B when the guy gets cash instead of fringe?"* We have a page that answers it accurately, for free, with the regulation cited. Posting the link would help her. Nobody is harmed. Where is the objection?

**Three places, in increasing order of how much they matter.**

**One — the venue said no.** HN and Product Hunt forbid machine-authored posts outright; ContractorTalk has priced machine access at 402 Payment Required; LinkedIn and Meta forbid automated access. The clerk's consent is not the venue's consent, and a rule we would break for a good reason is a rule we will break again for a worse one.

**Two — the disclosure is necessary and not sufficient.** Suppose a venue permits it and §3 is satisfied in full. The clerk reads the disclosure, understands there is no person, and is helped. But the post outlives the exchange. The third reader arrives in fourteen months, scans the thread, sees a vendor answering questions, and asks a follow-up — and the disclosure that protected the clerk is now four screens up and doing nothing. **The harm is not to the person we disclosed to. It is to the person who arrives after the disclosure has scrolled away**, which is precisely the failure mode §465.1(c)(4) is written against and precisely the one a compliant single post cannot fix.

**Three — a post in a help forum is an offer of help, and ours is partial in a way the reader cannot see.** This is the one that decides it. Answering a question in a help forum is not publishing a document; it is entering a reciprocal relationship whose terms the venue sets and every participant understands. The terms include being there for the follow-up. We can label the post, but we cannot label our way out of accepting terms we will not meet. A company whose entire positioning is *the number on your form carries its source* does not get to make an offer whose limits are unstated.

**So: no. Not on the audited venues, and not on a venue that permits it.** The correct response to that clerk is that the page exists, is free, requires no account, and is findable — which is what T1 and T2 are for.

**What would change this.** A venue whose written rules explicitly permit an identified, non-conversational vendor object — a canonical-answer slot, a vendor-documentation panel, a structured "official response" field that closes replies. That is an object, not a conversation, and §4 row 2 already permits it. We will not go looking for one; if it appears, this section is the test it has to pass.

---

## 6. What we do instead: be citable

The only community mechanism compatible with A1–A6 is that **somebody else** mentions us. That is not a channel we run; it is a property of objects we publish. Four requirements, all engineering, none of them a person:

1. **A stable URL that never breaks.** Determination pages, the changelog, the verification page. A dead link cited in a forum is worse than no citation.
2. **A date on the face of every object**, so a citation ages honestly rather than silently.
3. **No login, no wall, no interstitial.** `BRAND.md` C-B3 resolved the free generator in favour of proof over capture; the same resolution applies to everything a stranger might link.
4. **Self-describing.** A reader who arrives from a link with no context must be able to tell within one screen what this is and who publishes it — which is LP-5, the colophon.

**Instrumented, not assumed — and the instrument is specified, not built.** Referrer-attributed sessions from third-party domains, and accounts whose first session began at a cited URL. **Nothing in `run-2/app` records a referrer**: no referrer, UTM or attribution field exists anywhere under `src/platform` or `src/app`, so there is no counter here to read yet. What must be built is a first-session field on the account row carrying the entry path and the referring host, written once at session creation (`src/platform/auth/session.ts`) and never updated. `research/03` is explicit that no coefficient exists, so when it is built this is counted, never planned against.

---

## 7. The one human-shaped address, and why it is published rather than hidden

`USER_JOURNEY.md` §11.7 puts exactly one contact address in the product: on the billing page, outside the compliance flow, because a customer whose card has failed cannot use the in-app refund button and the card networks expect a route. §11.8 then makes it expensive to us in the only way that matters — **every inbound message to any published address increments a counter, with no triage and no category called "didn't need an answer"**, minutes floored at one so that never replying is the worst strategy rather than the best, and the raw total published monthly at `/status` without a login.

**Three rules follow for this playbook:**

- That address is never posted in a community, a directory field, a launch note or a signature. It lives on the billing page.
- No second address is created for any acquisition purpose. **This one is built and can be pointed at:** `app/tests/platform/g5.test.ts` asserts *"finds no undeclared company address anywhere in the shipping source"* and runs in the `unit` step of `.github/workflows/ci.yml`, so an undeclared mailbox does fail the build today.
- No copy anywhere describes the company as autonomous, human-free or self-running. Until the counter has been under 2.00 minutes per customer per month for 90 consecutive days at ≥50 paying accounts, the permitted sentences are the mechanism ones: *there is no support queue; no human reviews any output, at any tier; refunds are a button* (`CORRECTIONS.md` F-4, `BRAND.md` §5.2 G5).

---

## 8. Refused by name

So that a later agent cannot rediscover them as clever ideas: astroturfed accounts · employee or founder reviews, disclosed or not · incentivized reviews · a persona with a human name · ghostwritten testimonials · buying a listing's review volume · a company-owned "independent" comparison property · encyclopedia editing · engagement-signal farming · paying a community member to advocate · a "community manager" contractor · an AMA · a Discord or Slack we host, which is a support queue with a different noun on the door.

---

## References

**Fetched in-session, 2026-08-13**

- `https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-16.xml?part=465` — HTTP 200, 17,346 bytes. **16 CFR Part 465**, source note 89 FR 68077 (22 Aug 2024): §465.1(c)(4) unavoidable disclosure and (c)(7) non-contradiction; §465.1(h) fake indicators of social media influence; §465.2(a)–(d) fake or false reviews and testimonials; §465.4 buying positive or negative reviews; §465.5(a)–(c) insider reviews and testimonials; §465.6 company-controlled review websites. *(The HTML view at `ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465` returned **503** to us; the API served the same part.)*
- `https://news.ycombinator.com/newsguidelines.html` — *"Don't post generated text or AI-edited text. HN is for conversation between humans."*
- `https://news.ycombinator.com/showhn.html` — *"The project must be something you've worked on personally and which you're around to discuss."*
- `https://help.producthunt.com/en/articles/10030102-commenting-guidelines` — *"Product Hunt is about person-to-person interactions… No LLMs or Chrome extensions please!"*; account profile requirements
- `https://alternativeto.net/about/` — *"Every app page, every alternative and almost every recommendation on the site comes from people who actually use the software."*
- `https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business` — the transactional-or-relationship exemption and the opt-out duties that bind §4 row 6 and `lifecycle-emails.md`
- `stackoverflow.com/help/promotion` and `stackexchange.com/legal/terms-of-service/public` — **not fetchable from this environment**; the Stack Exchange affiliation-disclosure norm is therefore **not cited** and nothing is asserted about it
- Venue probes carried forward from `research/03-communities-and-lists.md`, all 2026-08-13: Reddit **403** across `www`/`old`/`api`/mirror; ContractorTalk **202** proof-of-work then **307 → 402 Payment Required**; LinkedIn UA §8.2; Meta terms; Capterra listing for Points North showing 2 reviews at 3.0/5

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — https://tractionbook.com/ — channel 19 (community building) versus channel 11 (engineering as marketing); this playbook is the argument for staying in 11
- Rob Fitzpatrick, *The Mom Test* — https://www.momtestbook.com/ — why a helpful post is not evidence and why an unread rules page is not evidence either
- April Dunford, *Obviously Awesome* — the frame is set by the object you publish, not by the thread you join
- Alex Hormozi, *$100M Leads* — the Core Four; free content spent inside somebody else's community is the box §2 closes
- Eric Ries, *The Lean Startup* — §6's counter written before the citations exist
- FTC, *Policy Statement Regarding Advertising Substantiation* — https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation — the substantiation duty that §7's gate discipline implements

**Internal, binding**

- `run-2/PLAN.md` — A1–A6, and "nothing is sent to a real prospect"
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D7, D9, G5
- `run-2/phase-2-build/CORRECTIONS.md` — Scope A; §4 F-4 and its gates
- `run-2/phase-2-build/identity/BRAND.md` — §3.5 autonomy controls; §5.3 permanently banned; §6.7 the artifact footer; C-B3, C-B4
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` — §0.3 the four refusal primitives; §11.7 the one address; §11.8 the G5 counter, redefined so that it can fail
- `run-2/phase-3-acquisition/research/01-channels.md` — §3 the three disguises, of which the helpful forum reply is the fourth
- `run-2/phase-3-acquisition/research/03-communities-and-lists.md` — the venue audit this playbook is the ethics half of
- `run-2/phase-3-acquisition/outreach/launch-posts.md` — LP-5, the colophon that hosts §3.1
