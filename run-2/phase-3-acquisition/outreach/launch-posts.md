# Launch Posts — drafts on disk

**Subject:** the copy Ratepin would publish to announce itself, and the audit that decides where.
**Status:** **DRAFTS. Nothing here has been posted, submitted, emailed or sent, and nothing in this file is a scheduled action.**
**BUILD STATE:** `claims.json`, `claims-lint`, `CL-1` and `CL-2` are specified in `CORRECTIONS.md` §5 and **are not in the repository** — `.github/workflows/ci.yml` runs typecheck, `npm test`, the citation invariant, the golden-set eval, `corpus:check` and `next build`, and none of those is a claims lint. The gate machinery that **is** built is `app/src/platform/ops/gates.ts` (`GATE_MECHANISM`, `gateSentence()`), refreshed by the `gates.refresh` job and published by `ops/status.ts`. Of the five artefacts in §4, **four have no route at all.** The full route list under `app/src/app` contains `status/page.tsx` and no `/changelog`, no `/v/[serial]`, no `/how-this-runs`, no `sitemap.ts` and no feed route — so LP-1, LP-3, LP-4 and LP-5 are surfaces that do not exist, and only `/status` (LP-1's third bullet) does. Each is marked at its own heading. Every slot-filled sentence below is a specification of what the surface must render, not a description of a surface that renders it.
**Method:** every venue below was probed in-session on **2026-08-13** and judged against its own published rules, quoted verbatim. Where a rule could not be read, that is recorded as unread rather than assumed.
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D3, D4, D8, D9, G1–G6 · `CORRECTIONS.md` (Scope A) · `BRAND.md` §3, §5 · `research/01-channels.md` §3 · `research/03-communities-and-lists.md` §2.

---

## 1. The result, before the evidence

`research/03` found exactly one venue in the community column with a legitimate no-human contribution, and called it correctly: **a directory listing is a placement, not a channel.** This document audited the two venues a software launch is actually expected to use — Show HN and Product Hunt — and found something stronger than "a human would have to post."

**Both venues ban machine-authored posts in writing, and both require the poster to be present.** They are not closed to us by our scruples. They are closed to us by their rules, and the rules are quotable.

So the honest shape of a Ratepin launch is: **one factual directory placement, and four announcement surfaces we own.** A surface we own is one where an unanswered thread is not a norm violation, because there is no thread. That is the whole test, and §3 states it generally.

---

## 2. The venue audit

| Venue | Its own rule, verbatim, read 2026-08-13 | Verdict |
|---|---|---|
| **Show HN** | *"The project must be something you've worked on personally and which you're around to discuss."* And, from the site guidelines: *"Don't post generated text or AI-edited text. HN is for conversation between humans."* | **Dead, twice.** The first clause requires presence — A1's forbidden human. The second forbids the only kind of text this company can produce. Either alone disqualifies |
| **Product Hunt** | Commenting guidelines: *"Product Hunt is about person-to-person interactions. Our community wants to talk to and hear from real people. No LLMs or Chrome extensions please!"* Accounts must carry *"Full name (first and last)," "A clear profile picture,"* and *"An informative bio"* | **Dead.** A launch whose maker account must be a named individual with a face, who must then talk to people, is a person. The launch-guide URL cited by third parties (`help.producthunt.com/en/articles/8871239-…`) returned **404** today; the commenting guidelines above did not, and they settle it |
| **Reddit** | Unreachable from here for the third phase running (`research/03`: `www`, `old`, `api` and a mirror all **403**). Self-promotion rules therefore **unread**, and no claim about them appears here | Dead on the human test regardless |
| **ContractorTalk** | **202** proof-of-work challenge to a normal client; **307** to `tollbit.contractortalk.com` → **402 Payment Required** for an identified agent (`research/03`) | Dead. Our reading is a metered commercial act; our writing would be a person |
| **LinkedIn · Facebook groups** | LinkedIn UA §8.2 forbids robots and scraping; Meta forbids automated access without permission (`research/03`) | Dead |
| **AlternativeTo** | About page, read today: *"Every app page, every alternative and almost every recommendation on the site comes from people who actually use the software."* The terms page returned **403** to us and is unread | **Refused, not dead.** The venue defines its content as coming from users. We are not a user of Ratepin; a vendor-authored entry there is an insider contribution, which lands it in §5's disclosure problem rather than in a rule we can simply satisfy |
| **G2 / Gartner Digital Markets** (Capterra, GetApp, Software Advice) | `gartner.com/en/digital-markets/vendor` → **403** to us. `digitalmarkets.gartner.com/software-vendor` → **301** to `app.g2digitalmarkets.com/software-vendor`, which is a **login wall** whose page footer reads *"G2 Digital Markets"* | **The one placement, with a correction.** `research/03` recorded this family as Gartner Digital Markets; as of today the vendor path redirects to a G2-branded host. **We assert nothing about a free tier**, because the page that would say so is behind a login we did not create. LP-2 is written to be submittable if the listing is free and abandoned if it is not |

**What the table costs us, stated rather than buried.** The two venues that reliably put a new developer tool in front of thousands of people in one day are closed. `research/01-channels.md` already itemised this for trade shows — the densest concentration of D1 in the country, unreachable because a booth is a person in a room. Show HN and Product Hunt are the same finding in the other direction: the densest concentration of *early adopters* is unreachable because a launch thread is a conversation. Neither is a scoring artefact. Both are the price of A1, and a launch plan that pretends otherwise is planning to break the constraint later.

---

## 3. The test that generalises

Before any future surface is treated as launchable, three questions, all of which must answer yes:

1. **Is an unanswered post a norm violation here?** If the venue's culture or rules expect the poster to reply, publishing is a promise we will break. Show HN and Product Hunt both fail this.
2. **Do the venue's written rules permit a post whose author is a machine and whose owner is the vendor?** HN and Product Hunt say no in so many words.
3. **Can the post carry an unavoidable disclosure in its own body?** Per 16 CFR 465.1(c)(4), *"the disclosure must be unavoidable. A disclosure is not clear and conspicuous if a consumer must take any action, such as clicking on a hyperlink or hovering over an icon, to see it."* A venue with a 140-character field and a link is a venue where our disclosure cannot be made properly.

Weinberg & Mares' Bullseye ranks on impact, confidence and cost; this is the prior filter `research/01` §1 installed, applied to a single post instead of a channel. Hormozi's Core Four is already down to free content and paid ads here — and free content spent inside somebody else's community is the box §2 has just closed.

---

## 4. The launch copy

Five artefacts. All are drafts. Slots in `{braces}` **must** be rendered from the gate reading or the corpus status record at publish time and never typed by hand. The mechanism that would guarantee that — `claims.json` and CL-1 (`CORRECTIONS.md` §5) — **is not built**; `gateSentence()` in `ops/gates.ts` is the built half and it covers only surfaces that read the gates table. So the rule below is currently editorial, and the check that would make it structural is a probe set over the rendered routes, unwritten.

### LP-1 — The launch note, published at `/changelog` on our own domain

**Specified, not built.** There is no `/changelog` route in `app/src/app` and no job that writes one. `/status`, cited in the third bullet, does exist (`app/src/app/status/page.tsx`, rendering from `ops/status.ts`).

> ## Ratepin is open
> **{publish_date}**
>
> Ratepin reads a payroll CSV and writes the federal WH-347 with the statement of compliance, and in California an eCPR XML file. Every rate on the artifact carries the wage-determination number, the revision and the publication date it was computed against, plus the corpus snapshot hash. The provenance is printed on the form, not kept in a dashboard.
>
> Three things you can check before you pay anything, and before an account exists:
>
> - **The free generator** at `/wh347` turns a crew or a payroll CSV into a complete federal form. No account, no email address, no limit. Every form it produces is marked **DRAFT — NOT CERTIFIABLE** with the signature block withheld, and the page says why in the second paragraph.
> - **The rate pages** at `/rates` show each rate beside the determination it came from, and what moved at the last revision of that determination.
> - **The status page** at `/status` publishes the corpus: determinations mirrored as of `{crawl_timestamp}`, reconciliation delta `{delta}`, last successful crawl, and the current state of every claim we are not yet permitted to make.
>
> **What Ratepin does not do.** It does not run payroll, compute taxes or print cheques. It does not file, submit or e-sign anything and never holds portal credentials. It does not support union CBA fringe schedules, because they are not published in the determination. It does not cover Service Contract Act determinations, or state regimes beyond California. It does not conclude whether a determination revision is effective for your contract — it shows the dates and the rule. No human reviews any output, at any tier.
>
> **Prices.** $0 · $49 one-time for a bid rate card, purchasable before an account exists · $99 · $249 · $599 a month. They are on the pricing page and they are the prices. There is no quote and no custom tier, including for us.
>
> **About this note.** It was published automatically; no person at Ratepin composed it or chose where it went. **Nothing you write in reply to this post reaches anyone.** There is no support queue and no human reviews any Ratepin output, at any tier. One address does reach a mailbox — it is on the billing page, for payment disputes — and every message it receives is counted and published on `/status`.

*Why this is the launch post.* It is citable by a stranger, it survives being read a year late, and it contains no sentence that becomes false while nobody is awake. Per Dunford it sorts the reader into the rate-of-record frame in its first line rather than into "certified payroll software", a category `BRAND.md` §1 Step 6 says we lose on price.

### LP-2 — Directory listing fields (G2 Digital Markets family), under two conditions, not one

Submitted as data, not as a pitch. No review is solicited from anyone with a material relationship to the company, ever (§5 of `community-playbook.md`; 16 CFR 465.4, 465.5).

**The two conditions, and the second is the one that was missing.**

1. **The listing is free.** Unchanged, and still unread: the page that would say so is behind a login we did not create (§2). We assert nothing about a free tier.
2. **The whole path — submit, verify, publish — completes with no person at the vendor requiring anything of us.** A submitted listing awaits verification, and nobody has established that the verification is unattended. **If verification returns a question, a document request, a call, or "reply to confirm", a human is required on our side and LP-2 is dead by A1** — abandoned, not answered, and moved to the refused list with the reason *"vendor verification is a correspondence"*. `community-playbook.md` §4.1 carries the same ruling for the same row. This is the standard the twelve refusals were held to, applied to the one placement we were keeping.

| Field | Draft |
|---|---|
| **Product name** | Ratepin |
| **Category** | Construction — certified payroll / prevailing wage |
| **One line (≤140 char)** | Certified-payroll rate-of-record engine. Payroll CSV in; WH-347 and California eCPR XML out, each rate pinned to a determination revision. *(138 characters. The previous draft was 144 and would have been truncated by the field it was written for — a length limit stated in the field label and not counted is the cheapest possible error.)* |
| **Description** | Ratepin produces the federal WH-347 and the statement of compliance from a payroll CSV, and the California eCPR XML file, generated against the published schema. Every rate is printed with its wage-determination number, revision number and publication date, and the artifact carries the corpus snapshot hash and generation timestamp. All money arithmetic — gross, fringe credit, cash in lieu, the 40-hour overtime premium, part-3 deductions, net — is deterministic code under property tests; no model touches it. When a payroll line cannot be resolved to a classification in that determination's own list, the line is blocked, the document renders marked DRAFT — NOT CERTIFIABLE, and the signature block is withheld. Ratepin computes and formats. You certify and file. This is not legal advice. *(That last sentence is `BOUNDARY_STATEMENT`, quoted from `app/src/artifacts/provenance.ts:58` — the same words the artifact footer carries, not a paraphrase of them.)* |
| **Who it is for** | Open-shop specialty subcontractors on federally funded construction who file a weekly WH-347 across more than one project or county. |
| **Who it is not for** | Union shops whose fringes come from a collective bargaining agreement; single-project single-county filers, for whom cheaper products are a better fit; general contractors and awarding agencies; anyone wanting payroll run. |
| **Pricing** | Free tier, no account. $49 one-time bid rate card. $99 / $249 / $599 per month, with included filing allowances of 8 / 40 / unlimited and $2.50 per filing beyond them, capped. No seats, no minimum term, no quote. |
| **Deployment / support** | Web. Self-serve. Documentation and in-product explanations; there is no support queue and no human reviews output at any tier. |
| **Screenshots** | The rendered WH-347 with the footer legible; the DRAFT — NOT CERTIFIABLE artifact with its reason line; the status page. No stock photography, no people, no dashboards. |

**Fields deliberately left empty:** customer count, logos, testimonials, awards, accuracy or acceptance figures. Each is gate-locked (F-1…F-4) or untrue at launch.

**One item dropped from the pricing field, and the reason.** It read *"No setup charge, no seats, no minimum term, no quote."* Our $0 setup is a true fact about us and permitted as one. But in a directory listing **rendered beside competitors**, a pricing field whose first item is the absence of a setup charge implies the comparison — and the pages we actually read say the same: CertifiedPayrollPro's setup is $0, and no setup fee appears anywhere on the LCPcertified page. An implication is a claim, and it is X-4's shape: a statement of ours about someone else's pricing, drawn from a structure their page does not state. What replaced it is the allowance and overage structure, which is a fact about our own bill and is checkable against `pricing.ts`. "No seats, no minimum term, no quote" stay, because those are differences the vendors' own pages do establish.

**The allowance figures in that field** are `catalog.ts` `PLAN_ALLOWANCES` (8 / 40 / `null`) and `OVERAGE_PRICE_CENTS = 250`, read 2026-08-13. The word *capped* is deliberately not expanded here: the cap's consequence is the subject of `lifecycle-emails.md` §4.5.0, and a directory field is not where a customer should first meet it.

### LP-3 — The machine-readable launch

**Specified, not built.** There is no feed route and no `sitemap.ts` anywhere under `app/src/app`, and no job writes either. The caller that must exist is a route emitting the Atom document from the revision rows the corpus already holds, plus a `sitemap.ts` whose `lastmod` reads the same rows.

The version of "announcing ourselves" that costs nobody a conversation: an Atom feed and a sitemap, discovered by machines, citable by people.

> **Feed title:** Ratepin — wage-determination revisions
> **Subtitle:** Every revision Ratepin has seen published against a Davis-Bacon wage determination, with the per-classification changes it made and the date it was read. Mirrored from SAM; the determination text stays at sam.gov and is linked, never reproduced.
>
> **Entry template:**
> **Title:** `{wd_number} — revision {n}, published {published_date}`
> **Summary:** `{k} of {m} classifications on this determination changed. {list}. Read from SAM at {read_timestamp}; snapshot {hash}. Whether this revision applies to a given contract is governed by FAR 22.404-6 and can turn on a contracting-officer finding Ratepin cannot observe.`

Sitemap `lastmod` carries `last changed`, never `last verified` (`research/02-demand-seo.md` §8.2): a feed that claims thousands of changes on a night when nothing changed is a false machine-readable claim. **CL-2 is named in `CORRECTIONS.md` as the check that would catch it and does not exist.** Because this surface is unbuilt, the check can be built with it, and it is cheap: an assertion in the sitemap route that no entry's `lastmod` is newer than the revision row it derives from.

### LP-4 — The artifact verification page, which is a standing post

**Specified, not built, and the artifact already knows it.** There is no `/v/[serial]` route in `app/src/app`. The footer field that would carry the URL exists — `FooterInput.verifyUrl` in `app/src/artifacts/provenance.ts` — and is documented as *"Omitted for the free generator, which persists nothing beyond 24 hours and therefore has nothing to resolve"*, so the paid path is where the URL and this page have to arrive together. Until the route exists, no footer may print one.

`research/01-channels.md` §6 requires a per-artifact short URL in the footer resolving to a public, read-only provenance page — the only instrument that could ever give the artifact loop a denominator. Its copy is a launch surface, because the reader is usually a general contractor's compliance clerk meeting the company for the first time.

> **Artifact `{serial}`**
> Wage determination `{wd_number}`, revision `{n}`, published `{published_date}`.
> Computed against corpus snapshot `{hash}`, generated `{generated_at}`.
> `{status_line}` — either *Signature block present; every line resolved.* or *DRAFT — NOT CERTIFIABLE · `{n}` unresolved line(s).*
>
> This page shows what the document was computed against. It does not say the document is correct, and it does not say any agency has accepted it. The contractor signed it; Ratepin computed and formatted it.
>
> The determination itself is at sam.gov. Ratepin keeps a dated copy of every revision it has seen, so the revision above is still readable here after SAM's live document moves on.

### LP-5 — The colophon, `/how-this-runs`

**Specified, not built.** There is no `/how-this-runs` route, and the marketing footer (`app/src/app/(marketing)/layout.tsx`) does not link one.

One page, linked from the footer of every marketing surface, that says plainly what kind of company this is. It is the permanent home of the standing disclosure specified in `community-playbook.md` §3 — and it must carry the **post-surface** form of the no-next-turn sentence, *"Nothing you write in reply to this post reaches anyone"*, because a page is a post and not a message. It is what any of the four artefacts above points at when a reader wants to know who is talking.

---

## 5. Rules binding every piece of launch copy

1. **Mechanism, never outcome.** No accuracy, acceptance, coverage, time or human-minutes figure appears until its gate writes the flag (`CORRECTIONS.md` §4). Gate-locked sentences must render from the gate reading, never be typed. **The built half is `gateSentence()` (`ops/gates.ts`); `claims.json` and CL-1 are not built**, so nothing fails a build on a hand-written one. `free-tool-pages.md` §2.1 is the demonstration that this matters — an F-1 violation shipped into `wh347/page.tsx` with CI green.
2. **Every number carries its as-of date in the same sentence**, or it does not appear. This is CL-2, **not built**; held here by writing, and by the fact that every figure in §4 is a slot.
3. **Competitors are named accurately or not at all**, with the vendor's own page and the date it was read (`BRAND.md` §3.6). No launch copy characterises a competitor's price from memory or from a comparison blog.
4. **No urgency, no scarcity, no penalty framing, no exclamation marks.** The buyer's deadline is already on their calendar (`BRAND.md` §3.2).
5. **No contact affordance anywhere except the billing page.** No "get in touch", no chat, no calendar link (A1, A3).
6. **Every surface states its own authorship** — that it was published automatically, and that no next turn is coming — in the body, not behind a link (16 CFR 465.1(c)(4)). **The sentence is scoped to the surface** (`community-playbook.md` §3.1): every artefact in this file is a post or a page, so all of them carry *"Nothing you write in reply to this post reaches anyone."* The message form, which does not claim that absolute because a reply to an email does reach a counted mailbox, belongs to `lifecycle-emails.md` and appears nowhere here.

---

## 6. Pre-registered thresholds, written now

Per Ries, a kill criterion authored after the data is not one.

- **LP-2**: if the listing is not free, it is abandoned rather than bought — `research/03` already established that a category whose incumbent carries two reviews will not generate demand. **If verification turns out to require a reply from us, it is abandoned rather than answered** (§4 condition 2; A1). If it is free, unattended, and produces zero attributable sessions in twelve weeks, it stays as a factual placement and gets no further engineering. Note the dependency: "attributable sessions" needs the referrer instrumentation `community-playbook.md` §6 records as unbuilt, so this threshold cannot be evaluated until that field exists.
- **LP-1 / LP-5**: no target. They exist to be citable and to be true; measuring a changelog for traffic is measuring the wrong thing.
- **LP-3**: if no third-party system consumes the feed within sixteen weeks, it remains as the internal publication mechanism for T2 rebuilds and stops being described as an acquisition surface.
- **LP-4**: report third-party verification loads per 100 artifacts generated, and accounts whose first session began at a verification URL, separating first-party re-checks by referrer. Until that counter has a denominator, no surface calls the artifact loop a channel.

---

## 7. Hypotheses, flagged

- That a launch note nobody is summoned to read has any yield at all. **Unmeasured**, and the most likely answer is close to zero in month one and non-zero in month twelve, via search rather than via a launch day.
- That the directory listing family is still free under G2's ownership. **Unread** — the page is behind a login.
- That vendor verification on that listing is unattended. **Unread, and it is a gate rather than a hypothesis**: if a person must approve the submission, LP-2 is dead by A1 (§4 condition 2).
- That refusing Show HN and Product Hunt costs us less than posting there and abandoning the thread would. Reasoned, not tested: an abandoned launch thread is a public, permanent demonstration that the product's central promise about degradation is unreliable, on the exact axis (C-B4) `BRAND.md` names as our largest brand risk.
- That the artifact verification page is clicked by anyone other than us.

---

## References

**Fetched in-session, 2026-08-13**

- `https://news.ycombinator.com/showhn.html` — *"The project must be something you've worked on personally and which you're around to discuss"*; *"Show HN is for something you've made that other people can play with"*
- `https://news.ycombinator.com/newsguidelines.html` — *"Don't post generated text or AI-edited text. HN is for conversation between humans."*; *"Please don't use HN primarily for promotion."*; *"Don't solicit upvotes, comments, or submissions."*
- `https://help.producthunt.com/en/articles/10030102-commenting-guidelines` — *"Product Hunt is about person-to-person interactions. Our community wants to talk to and hear from real people. No LLMs or Chrome extensions please!"*; profile completeness requirements
- `https://help.producthunt.com/en/articles/8871239-product-hunt-launch-guide` — **HTTP 404**, recorded because third-party guides cite it as current
- `https://alternativeto.net/about/` — *"Every app page, every alternative and almost every recommendation on the site comes from people who actually use the software."* `https://alternativeto.net/about/terms/` → **403**, unread
- `https://www.gartner.com/en/digital-markets/vendor` → **403**; `https://digitalmarkets.gartner.com/software-vendor` → **301** → `https://app.g2digitalmarkets.com/software-vendor` → login wall, footer reads "G2 Digital Markets"; `https://www.capterra.com/vendors/sign-up` and `https://www.capterra.com/vendors/` → **403**
- `https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-16.xml?part=465` — HTTP 200, 17,346 bytes. **16 CFR 465.1(c)(4)**: *"In any communication using an interactive electronic medium, such as social media or the internet, the disclosure must be unavoidable. A disclosure is not clear and conspicuous if a consumer must take any action, such as clicking on a hyperlink or hovering over an icon, to see it."* (The HTML view at `ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465` returned **503** to us; the API served the same part)

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — https://tractionbook.com/ — Bullseye; community building (19) versus engineering as marketing (11)
- Alex Hormozi, *$100M Leads* — the Core Four, and what remains when both outreach quadrants are structurally unavailable
- Alex Hormozi, *$100M Offers* — https://www.acquisition.com/ — perceived likelihood of achievement moves on demonstration, which is why LP-1 leads with three things checkable before payment
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — the first line of a launch note is a frame choice
- Geoffrey Moore, *Crossing the Chasm* — a beachhead is a segment you can actually take; two of the three launch venues are segments we cannot
- Eric Ries, *The Lean Startup* — thresholds written before the data
- Rob Fitzpatrick, *The Mom Test* — an unread rules page is not evidence in either direction, which is why Reddit and the AlternativeTo terms are recorded as unread

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D3, D4, D8, D9, G1–G6
- `run-2/phase-2-build/CORRECTIONS.md` — Scope A; §4 F-1…F-4; CL-1, CL-2; §5 `claims.json`
- `run-2/phase-2-build/identity/BRAND.md` — §3.2, §3.5, §3.6, §5, §6.4, C-B4
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` — §1.5, §11.7, §11.8, §16
- `run-2/phase-3-acquisition/research/01-channels.md` — §3 the three disguises; §6 the artifact loop and its instrument
- `run-2/phase-3-acquisition/research/02-demand-seo.md` — §8 refresh cadence and the `lastmod` rule
- `run-2/phase-3-acquisition/research/03-communities-and-lists.md` — §2 the venue audit this document extends
- `run-2/phase-3-acquisition/outreach/community-playbook.md` — the standing disclosure LP-5 hosts, §3.1's per-surface no-next-turn sentence, and §4.1's human-on-their-side ruling on the directory row

**Read in `run-2/app` for the BUILD STATE block, 2026-08-13**

- `src/app/**` route list — `status/page.tsx` exists; there is no `/changelog`, no `/v/[serial]`, no `/how-this-runs`, no `sitemap.ts` and no feed route
- `src/platform/ops/gates.ts` (`GATE_MECHANISM`, `gateSentence`), `ops/status.ts`, `.github/workflows/ci.yml` — the gate machinery that is built, in place of `claims.json` / `claims-lint` / CL-1 / CL-2, which are not
- `src/platform/billing/catalog.ts` — `PLAN_ALLOWANCES` 8 / 40 / `null` and `OVERAGE_PRICE_CENTS = 250`, the figures in LP-2's pricing field; `drizzle/0000_init.sql:1851–1853` — the $99 / $249 / $599 seed
- `src/artifacts/provenance.ts` — `FooterInput.verifyUrl`, omitted for the free generator, which is why LP-4 and the footer URL must ship together
