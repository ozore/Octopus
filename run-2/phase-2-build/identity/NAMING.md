# NAMING DECISION RECORD — run 2

**Gate:** blocks BRAND.md, DESIGN_SYSTEM.md, the landing page, the artifact footer spec, and every acquisition surface in phase 3.
**Supersedes:** the phase-1 working name **Wage Line**, and the three merged source names it absorbed (`ModWatch`, `Bacondesk`, `WageLens` — `shortlist.json`, `merged_from`).
**Date of verification:** 2026-08-13. Every finding below was produced in-session by an HTTP probe I ran myself; none is recalled from memory.
**Status:** DECIDED and binding for phase 2, subject to §9.

---

## 1. The decision

| Field | Value |
|---|---|
| **Name** | **Ratepin** |
| **Wordmark** | `Ratepin` — one word, initial capital, in **every** context including product chrome. No `ratepin`, no `RatePin`, no `Rate Pin`. See §7.1. |
| **Category line** (Dunford Step 6) | **Certified-payroll rate-of-record engine for federally funded construction** |
| **Tagline** | **"The rate of record, printed on the form."** |
| **One-sentence promise** | *Friday's certified payroll, with every rate traced to the wage-determination number, modification and publication date it came from.* |
| **Primary domain** | `ratepin.com` — registered 2011-06-14, nameservers `ns1.squadhelp.com`; an HTTP request to `https://ratepin.com` redirects to `https://www.atom.com/name/RatePin`, i.e. it is a **listed brandable-marketplace inventory item with self-serve checkout**, not an operating business. Acquire. |
| **Defensive domains** | `getratepin.com`, `useratepin.com`, `ratepinhq.com` — all **RDAP 404 (unregistered)**. Register as redirects only; never as the primary. |
| **SKU names** | Free WH-347 generator (no account) · **Bid Sheet** $49 one-time · **Solo** $99/mo · **Crew** $249/mo · **Multi** $599/mo. Prices and metering per **D4**; `Bid Rate Card` is renamed `Bid Sheet` for the reason in §7.3. |
| **Struck** | **Wage Line** — four independent grounds, §3. |

**Positioning statement** (Dunford's canvas; expanded in `BRAND.md` §1):

> For open-shop specialty subcontractors on federally funded construction who file a weekly WH-347 and have to be able to say where each rate came from, **Ratepin** is a certified-payroll rate-of-record engine that turns a payroll CSV into the WH-347 PDF and California eCPR XML with every rate pinned to a named wage-determination number, modification number and publication date — unlike LCPcertified, CertifiedPayrollPro, PrevailComply and WagePath, which fill the form in correctly but leave the *rate* an unsourced number the contractor typed, and unlike the agency portal the GC mandates, which Ratepin feeds rather than replaces.

---

## 2. Method, and what it can and cannot prove

State the limits first, because run 1's naming record was later criticised for treating a failed HTTPS connection as evidence of availability. That error is not repeated.

| Question | Instrument used | What a result proves | What it does **not** prove |
|---|---|---|---|
| Is a `.com` registered? | **RDAP** — the Verisign `.com` endpoint, `rdap.verisign.com/com/v1/domain/` + the name | HTTP 404 ⇒ **not in the registry**. HTTP 200 ⇒ registered, with an exact creation date and the delegated nameservers. | Nothing about non-`.com` TLDs. My probe script queried the **`.com`** registry only; any `.co`/`.io` line it printed is meaningless and has been discarded. |
| Is the registrant an operator or a domainer? | Nameserver string in the RDAP record | `sedoparking.com`, `afternic.com`, `squadhelp.com`, `brandbucket.com`, `hugedomainsdns.com`, `buydomains.com`, `namefind.com` ⇒ **listed for sale**. `vercel-dns.com`, `awsdns`, `cloudflare` ⇒ someone is **building or running something**. | Price. Atom.com and Afternic both returned HTTP 403 to my client, so **no asking price in this document is verified** (§10). |
| Is there a US trademark? | **Trademarkia** full-text search (`trademarkia.com/search?query=…`) to find candidates, then **USPTO TSDR** (`tsdr.uspto.gov/statusview/sn<serial>`) to verify each hit against the official register | A TSDR page gives the authoritative mark text, owner, filing date, registration number, status and the exact goods/services wording. Every mark I call a knockout below was verified on TSDR, not on the aggregator. | **This is a screening search, not a clearance opinion.** It catches identical and near-identical wordmarks; it does not run phonetic-equivalent, translation, design-mark or common-law searches. |
| Why not TESS? | — | USPTO's public search now runs at `tmsearch.uspto.gov`, which is fronted by AWS WAF (`awswaf.com/…/challenge.js` in the page source) and rejected every programmatic request I made, including a POST to `api-v1-0-0/tmsearch` (HTTP 405). Justia Trademarks and uspto.report both returned HTTP 403 to this network. | — |
| Is there a live business under the name? | Web search + direct fetch of the found site | A fetched page with product copy proves a live product. | Absence of search results is weak evidence of absence. |

Two further honesty notes. First, **classes 9 and 42 are the battlefield and both matter**: 9 for downloadable software, 42 for SaaS. I screened both. Second, the *relevant* trademark question is not "does this string exist anywhere" but "is there a senior mark for related goods sold to related buyers" — so a live CHALKLINE for a sports-betting app in class 9 is a genuine problem and a dead MODLINE for infrared thermometers is not.

---

## 3. Why the working name loses

**Wage Line is struck.** Not on taste — on four independent findings, any one of which is survivable and all four of which together are not.

### 3.1 The name promises a human, and A3 forbids one

This is the decisive ground, and it is structural rather than aesthetic.

`PLAN.md` **A3** requires that the product have **no escalation path to a human**, and **D7** makes it concrete: *"There is no support contact anywhere in the compliance flow."* **G5** will not permit us to publish the zero-human-minutes claim until it is measured, but the *architecture* is committed either way.

"Wage Line" is, lexically, a helpline. `Topic + contact-noun` is the standing English construction for an advice service you telephone: *Childline, Crimeline, Tax Line, Wageline*. The last is not hypothetical. **Wageline** is the Western Australian Government's wage information service, operated by the Department of Local Government, Industry Regulation and Safety, described on its own page as *"an information service for private sector employers and employees in Western Australia,"* reachable on **1300 655 266**, open 8:30am–4:30pm Monday–Friday.

So the name sets the exact expectation the product is built to refuse, and the highest-authority page on the open web for the term is a government telephone service. When our buyer's WH-347 comes back rejected at 4:40pm on a Friday, "Wage Line" tells them there is a line. There is not, by design. Naming a company after the one affordance it does not have manufactures the angry customer that the autonomy judge already flagged (`IDEA_DOSSIER` §the override question) — this time in the wordmark rather than in the failure path.

**Derived rule, binding (§8, invariant 2):** no name, tier name or feature name may pair an advice topic with a contact noun — `Line`, `Desk`, `Help`, `Hotline`, `Direct`, `Answers`, `Concierge`. This is why `Wagedesk`, `Ratedesk` and the merged name `Bacondesk` are also struck, and why `Stringline` / `Modline` are *not* caught by it: "string" and "mod" are not advice topics.

### 3.2 The `Wage*` field is occupied — including inside our own niche

Verified live today:

- **WagePath** (`wagepath.com/certified-payroll-reporting`) — a certified-payroll platform that "sits between your time tracking tools and your payroll system," generating **the federal WH-347 plus California eCPR, New Jersey MW-562, Ohio CPR and New York State XML**, with fringe addenda and employee notices. That is our exact product category, with *broader* state coverage than **D9** allows us in v1, under a `Wage*` name. It is demo-gated (no price published), which is a counter-positioning gift — but the lexical collision is real.
- **WageLens** (`wagelens.com`) — live product, headline *"What you can't see, you can't solve,"* AI pay-gap analysis connecting to 165+ HR systems. `shortlist.json` lists `WageLens` among the ideas merged into Wage Line; that name was never ours to take.
- **WAGE+** — **US Reg. No. 7450708**, serial 98116583, LINC HOLDINGS, LLC, filed 2023-08-03, registered 2024-07-16, **Principal Register, International Class 042**, for *"Software as a service (SAAS) services featuring software for calculating individual health benefits for employees."* Verified on TSDR. The goods are health benefits, not wages — I am not going to overstate it — but it is a live `WAGE`-formative registration in the exact class we must file in, for employee-compensation SaaS.
- **WAGEPAY** — serial 99504449, WagePay Pty Ltd, live/registered, classes 035 and 036, payroll and financial services.
- Plus, outside our niche but inside the buyer's search results: Wagepoint (payroll), Wageloch (rostering), Wagestream (earned wage access).

Per Dunford's Step 6, you cannot build a market category under a word your competitors already wear.

### 3.3 The name says the wrong half of the product

`research/02-competition-positioning.md` is binding on this: *"market frame is wage-determination system of record, not 'certified payroll software' (we lose that category on price)."* LCPcertified publishes **$145/mo for 5 active projects** or **$12/report** and already exports CA/WA/MD XML; CertifiedPayrollPro's **$49 tier carries 5 projects**. If we are read as another wage-form product we are compared on price, and we lose.

"Wage Line" names the *topic* (wages). It says nothing about the *record*, which is the only thing we sell that the others do not. **D3** relocated the wedge to the rate-of-record corner; the name never followed it.

### 3.4 The domain is a domainer's, and the exact-match term is not ours

`wageline.com` — RDAP: registered **2002-04-03**, nameservers `ns1.sedoparking.com` / `ns2.sedoparking.com`. Sedo parking means listed for sale by a holder of 24 years' standing. Acquirable, probably, at a domainer's price — but we would be buying a term whose top organic results belong to an Australian government helpline, to run a US product that refuses to answer the phone.

**Verdict: struck.** Not a close call.

---

## 4. The closed lexical fields

Before choosing, note which word-fields are unavailable. This is the run-1 discipline (`Appeal*` / `Seller*` were closed for Clausewright) applied to this market with fresh evidence.

| Field | Closed because | Names it kills |
|---|---|---|
| `Wage*` | WagePath, WageLens, WagePay, WAGE+ (Cl. 42, live), Wagepoint, Wageloch, Wagestream, Wageline (WA Gov) | Wage Line, Wagedesk, Wage Record, Wage Register, Wagedatum, Wageproof, Wagepin |
| `Prevail*` | **PrevailComply** (WH-347 + CA eCPR XML + a free WH-347 generator — D3's wedge and D8's funnel, already shipped) and **PrevailForms** ("WH-347, eCPR, OSHA Forms") | Prevail, Prevailrate, Prevailwright |
| `Cert*`, `Certified Payroll*` | CertifiedPayrollPro, CertiWage, HCM TradeSeal; and the category is the one we must *not* be sorted into | Certline (clean on USPTO, struck anyway), Certpay, Certifiled |
| `LCP*`, `*Tracker` | **LCPTRACKER, serial 99924010, filed 2026-07-06, LIVE/PENDING in classes 009, 035, 041, 042 and 045**, with class 9 wording *"Downloadable software for administration, management and reporting of time sheet, payroll, labor and workforce information."* Verified on TSDR. The incumbent staked our exact goods five weeks ago. | anything `*tracker` |
| `*Bacon*` | eBacon; davisbaconrates.com (affiliate comparison site listing LCPtracker, eBacon, Points North, Foundation, eMars) | Bacondesk, Baconline |
| `*Watch`, `*Alert`, `*Monitor` | **D3** moved the paid boundary off monitoring and onto the artifact. A monitoring name re-enters the category we exited, and it is the category with the weakest willingness to pay in the whole shortlist. | ModWatch, Ratewatch (also: RateWatch is an S&P Global product) |
| `-wright` | Reserved to the sibling company built by run 1 of this factory (Clausewright). A shared suffix would read as a house brand we have no intention of operating. | Ratewright, Wagewright |
| Claim-words: `Proof`, `Assure`, `Guard`, `Shield`, `Safe`, `Seal`, `Stamp`, `Attest`, `Verified`, `Compliant` | The contractor signs the statement of compliance, under **18 U.S.C. § 1001** — DOL's own WH-347 instructions warn the signer of *"a fine, possible imprisonment of not more than 5 years, or both."* We compute and format; the contractor certifies. A name that claims certification is both a positioning lie and, under FTC substantiation doctrine, an unsubstantiated objective claim baked into the mark itself. | Wageproof, Certline, Wagestamp, Payseal |

**`Rate*` is the one field that is open in this niche.** Not one of the incumbents — LCPtracker, LCPcertified, eBacon, Points North, eMars, Elation, Foundation, Payroll4Construction, CertifiedPayrollPro, CertiWage, PrevailComply, PrevailForms, WagePath, HCM TradeSeal — uses it. And "rate" is the buyer's own noun: they say *"what's the rate for a Cement Mason in Kern County,"* not *"what's the wage."*

---

## 5. Why Ratepin wins

### 5.1 It names the mechanism that closed the autonomy objection

The single break the autonomy judge found in Wage Line was that a SAM outage on a Friday could block a filing. **D7** closed it with one word: *"A wage determination is **pinned** to a project at award and does not move"*; *"generation always reads the **pinned** local mirror."*

The name is that decision. Not a metaphor for it — the same verb, used the same way, doing the same work. Run 1 named itself after the one falsifiable pre-paywall proof it possessed (the cited clause). This is the same move against a different asset: the pin *is* the product. Every artifact we emit carries a WD number, a modification number, a publication date and a corpus snapshot hash because the rate was pinned; that footer is D8's entire distribution strategy; and the footer will say **Ratepin**.

### 5.2 It is the buyer's idiom, not a software word

*"Pin down the rate"* is ordinary American English that a payroll administrator and a project manager both already say. This matters more here than in most naming decisions, because the brief's own standard is that **this buyer is not a startup buyer: credibility and legibility beat delight**. "Ratepin" needs no explanation and no glossary; the first time someone hears it, next to the category line, they know what it does.

Nielsen's second usability heuristic — *match between the system and the real world*, speak the user's language — applies to the wordmark as much as to a button label.

### 5.3 It is clean on the register, and the class-9 neighbour is a diluted element

- **RATEPIN — zero results**, Trademarkia full-text, 2026-08-13. There is no US mark of that literal text.
- The one thing a knockout search will surface is that `RATE` alone is registered: **serial 98975329, Guaranteed Rate, Inc., live, class 009**, for *"Downloadable software for use in mortgage refinancing,"* alongside several class-036 RATE registrations, and **RATED** (serial 79380195, Rated Labs Ltd) live in 009/035/036/042 for blockchain and financial analysis software.

I am reporting that honestly rather than burying it, and the analysis cuts in our favour on knockout and against us on scope. `RATE` is a massively diluted element — Trademarkia's fuzzy search on "rate pin" returned **25,666** records — and dilution narrows everyone's scope. A senior mark for *mortgage refinancing software sold to home buyers* is a poor foundation for opposing *certified-payroll software sold to construction subcontractors*: different goods, different trade channels, different consumers. The residual risks are (a) a well-resourced owner who polices, and (b) that `RATEPIN` derives most of its own distinctiveness from `PIN`. Both are logged in §9 with a fallback.

Compare what the alternatives actually surfaced:
- **CHALKLINE** — serial 87027215, **Chalkline Sports, Inc., LIVE/REGISTERED, class 009**, computer application software. Direct in-class knockout.
- **GRIDLINE** — **Reg. No. 8158068** (serial 99294194), Gridline Holdings, Inc., registered 2026-03-03, **class 042**, *"Providing temporary use of online, non-downloadable software…"* — verified on TSDR; plus a second Gridline Holdings class-042 registration (99294187) and Redwing Technology's GRIDLINE in 035/042/045. Direct in-class knockout, twice over.
- **STRINGLINE** — clean on USPTO (all four marks dead) but killed on the ground that matters more: **`stringline.co` is "Stringline Field — Field and office. Finally in sync.", construction software sold to construction companies doing $5M–$20M**. That is our beachhead's revenue band. An in-niche collision with the same buyer is disqualifying by the same rule that struck Standwell in run 1.

### 5.4 It is sayable, spellable and unambiguous on a jobsite phone call

Two syllables. Seven letters. Two common English words concatenated, both spelled the obvious way, with no silent letter, no doubled consonant, no `-ph-`, no case ambiguity, no hyphen and no homophone trap. There is one spoken-form instruction and it is trivial: *"Ratepin, one word."*

Set against the field: `Clausewright` (run 1) needed three phonetic-defensive redirects; `Wagedatum` requires the caller to know what a datum is; `Ledgerline` invites `Ledger` (the hardware-wallet brand owns that SERP); `Stringline` and `Chalkline` both invite "is that one word or two."

Per USWDS's own guidance on legibility, and Apple's app-naming guidance on surviving at icon and label size: `Ratepin` is a single unbroken token that truncates predictably and renders as one unit at 11px in a PDF footer — which, per D8, is where most people will ever read it.

### 5.5 It describes what we hold, not what we promise

The whole claims policy in `BRAND.md` §5 turns on one rule: **until G1–G6 clear, we may describe mechanisms and refuse outcomes.** A name is the most repeated claim a company makes, so it must survive that rule permanently.

"Ratepin" asserts nothing about accuracy, acceptance, completeness, time saved, autonomy or risk. It says we pin rates. That is a statement about our own data structure, verifiable on-screen, before the paywall, at no cost — and it stays true on the day the golden-payroll suite goes red, when a name like *Wageproof* or *Certline* would have become a lie the moment the product refused a line.

This is also why the tagline is **"The rate of record, printed on the form."** It promises a *printed artifact*, not an outcome. The buyer can falsify it in about ten seconds using the free generator.

---

## 6. Full field — every candidate and its disposition

| # | Name | Verdict | Evidence and reasoning |
|---:|---|---|---|
| 1 | **Ratepin** | ✅ **CHOSEN** | USPTO: **zero** results. `ratepin.com` registered 2011, Squadhelp/Atom nameservers, redirects to `atom.com/name/RatePin` — marketplace inventory, self-serve. `getratepin.com` / `useratepin.com` / `ratepinhq.com` all RDAP 404. `ratepin.io` resolves in DNS but the TLS handshake is reset — registered, not serving. Only live presence found anywhere: a TikTok handle `@rate_pin`. |
| 2 | **Modline** | ⭐ **FALLBACK 1** | USPTO: 7 marks, **all dead** — incl. 73087154 (class 042, computer programming, cancelled 1984) and Fluke's 76517578 (class 009, infrared thermometers, cancelled 2025). `modline.com` registered 2000, Afternic nameservers (listed for sale), resolves. *"Mod"* is the buyer's exact clip for a wage-determination modification. Weakness: to a non-insider it reads modular/modern furniture, and it does not explain itself — which is why it is second, not first. |
| 3 | **Ratedatum** | ⭐ **FALLBACK 2** | `ratedatum.com` **RDAP 404 — unregistered**, so $12 and no negotiation. A datum is the survey reference every measurement derives from: the best pure meaning-fit in the whole field. Struck to fallback only because "datum" is not a word our buyer uses, and 3 syllables + a possible "data/datum" correction on the phone costs the legibility we are optimising for. |
| 4 | **Wage Line** | ❌ Struck | §3, four grounds: helpline semantics against A3/D7; WA Government Wageline (1300 655 266); WagePath + WageLens + WAGE+ (Reg. 7450708, class 042) occupying the field; `wageline.com` on Sedo parking since 2002; and it names the topic, not the record. |
| 5 | **Chalkline** | ❌ Struck | **CHALKLINE, serial 87027215, Chalkline Sports, Inc., LIVE/REGISTERED, class 009**, computer application software. `chalkline.com` registered 1998 on AWS DNS. Best-known layout term in the trades, and unusable. |
| 6 | **Gridline** | ❌ Struck | **Reg. 8158068 (99294194)** and 99294187, Gridline Holdings, Inc., **class 042**, both live; Redwing Technology GRIDLINE live in 035/042/045. `gridline.com` registered 1997. |
| 7 | **Stringline** | ❌ Struck | In-niche collision with the same buyer: `stringline.co` = "Stringline Field," construction software for $5M–$20M contractors; plus Stringline Group (project controls/BIM), two Stringline Construction firms, and thestringline.com (cloud/AI consulting). USPTO itself is clean (4 dead marks) — the market is not. |
| 8 | **Plumbline** | ❌ Struck | `plumbline.com` registered 1999 on AWS DNS; the term is heavily occupied by ministries, consultancies and plumbing firms, and the biblical sense ("a plumb line among my people," Amos 7:8) drags a moral-judgment register we do not want on a payroll artifact. |
| 9 | **Ledgerline** | ❌ Struck | USPTO clean (zero results), `ledgerline.com` registered 2010 on register.com. Struck on meaning: "ledger" says bookkeeping, and **D9** is explicit that we are *not* a payroll or accounting system — we consume a CSV. Also cedes the SERP to Ledger, the hardware-wallet brand. |
| 10 | **Certline** | ❌ Struck | USPTO clean (zero results); `certline.com` registered 2007 on NameBright. Struck by the claim-word rule (§4): `Cert*` asserts certification, and the contractor certifies, not us — 18 U.S.C. § 1001 sits on their signature, not ours. |
| 11 | **Wageproof** | ❌ Struck | USPTO clean (zero results), but `wageproof.com` was registered **2026-03-28 on Vercel DNS** — somebody is building. Struck independently by the claim-word rule and the `Wage*` field. |
| 12 | **Wage Record** | ❌ Struck | `wagerecord.com` is **unregistered** and it is the plainest statement of the category — but "wage record" is the term of art for the quarterly wage-record reporting employers already file with state unemployment agencies. Our buyer would sort us into the wrong filing. Also descriptive, so weak on the Principal Register. |
| 13 | **Wage Register** | ❌ Struck | `wageregister.com` unregistered; "register" is the right English word for an authoritative record. Struck on the `Wage*` field plus §2(e)(1) descriptiveness risk — a register of wages, for a wage register. |
| 14 | **Rate of Record** | ❌ Struck as a name, ✅ **adopted as the category phrase** | `rateofrecord.com` unregistered. Unownable as a mark and unownable in search — but it is exactly what we sell, so it lives in the tagline and the category line instead. Dunford Step 6: build the category in words, own the brand in a different word. |
| 15 | **Wagepin** | ❌ Struck | Same idea, wrong root: `wagepin.com` registered **2026-07-24 on Vercel DNS** — three weeks before this decision. `Wage*` field closed anyway. |
| 16 | **Ratepeg** | ❌ Struck | `ratepeg.com` unregistered and the metaphor works (a pegged rate; pegging out a site). Killed by an existing term of art: "rate pegging" is the statutory cap on Australian council rate rises. |
| 17 | **Ratelock** | ❌ Struck | "Rate lock" is a mortgage term of art with an enormous incumbent SERP and an aggressive trademark neighbourhood. Also wrong meaning: we do not lock the buyer's wages, we record the government's. |
| 18 | **Ratebook / The Book** | ❌ Struck | "The book" and "book rate" are union hiring-hall vocabulary. **D1** puts us in **open-shop** shops. A name that codes union is a segment error on the first syllable. Same reasoning strikes **Scale** and **Wagescale** — "working for scale" is union-coded — and it is the reason no tier is called *Local*. |
| 19 | **Craftline** | ❌ Struck | `craftline.com` registered 2000, Sedo parking. "Craft" is genuinely the WD's own word for a classification, but the consumer register of "craft" (artisanal, hobby, Etsy) is far louder than the construction one. |
| 20 | **Certified Payroll ⟨anything⟩** | ❌ Struck | Sorts us into the category we lose on price (LCPcertified $12/report; CertifiedPayrollPro $49 for 5 projects). Descriptive, unownable, and strategically wrong. |
| 21 | **WageLens** *(merged-from)* | ❌ Struck | Live product at `wagelens.com`: AI pay-gap analysis, "What you can't see, you can't solve," 165+ HR integrations. Never available. |
| 22 | **Bacondesk** *(merged-from)* | ❌ Struck | `*Bacon*` field (eBacon, davisbaconrates.com) plus the contact-noun rule of §3.1 — a "desk" is staffed. |
| 23 | **ModWatch** *(merged-from)* | ❌ Struck | Monitoring frame, retired by **D3**; and monitoring is the lowest-willingness-to-pay position in the shortlist. |
| 24 | Surname/authority register — *Alden, Marbury, Halloran*-type names | ❌ Direction rejected | The most credible register in construction reference data is the eponym (R.S. Means, Marshall & Swift, Kelley Blue Book), and it was seriously considered. Rejected because it costs brand-building we cannot fund, contributes nothing to D8's SEO surfaces, and collides densely in every class. |

---

## 7. Usage rules for the name itself

### 7.1 The wordmark

**`Ratepin`. Initial capital, lowercase remainder, one word, everywhere — including product chrome, the app header, the favicon label, the PDF footer, email `From:` names and social handles.**

This deliberately departs from run 1, which set `clausewright` all-lowercase in chrome. The reason is the buyer. An all-lowercase wordmark is a consumer-software convention; a construction payroll administrator evaluating a tool that will sit inside a federal certification reads all-lowercase as unserious. Internal capitals (`RatePin`) read as 2010s SaaS and break at small sizes. One capital, one word, no exceptions.

Never: `RATEPIN` in running text (USWDS: *"Uppercase text has a serious negative effect on readability"*), `Rate Pin`, `Rate-Pin`, `ratepin.com` used as the brand in prose.

### 7.2 First mention

First mention on any new surface pairs the name with the category line, never with an adjective:

> **Ratepin** — certified-payroll rate-of-record engine for federally funded construction.

Prohibited first mentions: "Ratepin, the AI-powered…", "Ratepin, the easiest…", "Ratepin, the leading…". Superlatives are objective claims and are unsubstantiated (§8, invariant 5).

### 7.3 SKU names

**D4** is implemented as written on price, metering and packaging. Only the *display name* of the $49 one-time SKU changes: **`Bid Rate Card` → `Bid Sheet`**. Reason: "Ratepin Rate Card" repeats the root inside the product name, the same defect that struck "Sellshield Shield" in run 1, and "bid sheet" is already the buyer's term for the sheet of numbers a bid is built from. This is a naming-layer decision; it changes no price, no cap, no metering and no gate.

`Solo` / `Crew` / `Multi` are kept exactly as D4 sets them. `Crew` is a real unit of work in this industry and needs no translation.

### 7.4 Handles and defensive registrations, in order

1. Buy `ratepin.com` through Atom's self-serve checkout. **No brokered negotiation** — a negotiation needs a human, and A1 says the company must run without one. If it is not buy-it-now purchasable, fall to §9's ladder rather than opening a conversation.
2. Register `getratepin.com`, `useratepin.com`, `ratepinhq.com` (all confirmed unregistered) as 301 redirects to the apex. Never publish them.
3. Claim `@ratepin` on LinkedIn, X, YouTube, Reddit and GitHub before any public page ships.
4. Only then: Stripe, transactional email domain, repo.

---

## 8. Naming invariants — binding on all downstream copy

These are constraints, not preferences. `BRAND.md` §5 turns each into a testable copy rule; several are enforced in code rather than in review.

1. **Never claim to certify, file, submit, sign or approve.** We compute and format; the contractor certifies under 18 U.S.C. § 1001 and files. Prohibited across product, marketing and support copy: *we certify, we file for you, we submit, we sign, we approve, DOL-approved, DIR-approved, agency-approved, audit-proof, compliant.* (D9; the WH-347 instructions.)
2. **Never imply a person is reachable.** No `Line`, `Desk`, `Hotline`, `Help`, `Direct`, `Concierge`, `Advisor`, `Specialist`, `Team` in any name, tier, feature or email signature; no "contact us" in the compliance flow. (A3, D7.)
3. **Never name a product after an unmeasured outcome.** No `Proof`, `Assure`, `Guarantee`, `Shield`, `Guard`, `Safe`, `Verified`, `Accurate`, `Instant`. (G1–G6; FTC advertising-substantiation policy.)
4. **Never enter a closed field** (§4): `Wage*`, `Prevail*`, `Cert*`, `LCP*`, `*Bacon*`, `*Tracker`, `*Watch`, `-wright`.
5. **Never use superlatives or "AI-powered" as identity.** The model does two bounded jobs (D6: classification ranking and exception narrative) and touches no arithmetic. FTC staff guidance is explicit that "artificial intelligence" is not puffery and that performance implications must be substantiated.
6. **Never code union.** No `Book`, `Scale`, `Local`, `Hall`, `Journeyman` in brand or tier names. D1 sells to open shops; D9 refuses CBA fringe schedules outright.
7. **Brand the pin, not the form.** The WH-347 generator is free and commoditised — PrevailComply and constructionbids.ai already give one away. Our name attaches to the *provenance*, so that when a competitor adds a provenance footer we already own the word for it.

---

## 9. Residual risks, and the fallback ladder

| # | Risk | Severity | Mitigation | Trigger |
|---|---|:---:|---|---|
| **N1** | **All clearance here is screening, not a legal opinion.** No phonetic-equivalent, design-mark, common-law or state-registration search was run; TESS's successor was unreachable behind a WAF. | **Blocking for any USPTO filing** | Do not file, and do not print ® anywhere, until a professional knockout in **classes 9 and 42** is run. Brief it specifically on: `RATE`-formative marks owned by Guaranteed Rate, Inc.; `PIN`-formative marks in class 9; and the fallback names in this ladder. Using the name in commerce without filing is lawful; claiming a registration is not. | Before any trademark application |
| **N2** | `RATE` is diluted, so **Ratepin's own protectable scope is thin** — most distinctiveness sits in `PIN`. | Medium | Accept it. Per Helmer, Branding power here is built on the *artifact footer* — a weekly, dated, provenance-stamped document circulating to GCs — not on a strong wordmark. Register the composite, use it consistently, and never let a surface say "rate of record" without saying "Ratepin" in the same block. | Ongoing |
| **N3** | `ratepin.com` may not be buy-it-now, or may be priced beyond a bootstrap budget. | Medium | **Ladder, executed without negotiation:** (1) Ratepin via Atom self-serve → (2) **Modline** via Afternic self-serve (`modline.com`, all USPTO marks dead) → (3) **Ratedatum** (`ratedatum.com` unregistered, ~$12). Do **not** launch on `getratepin.com`: a `get-` prefix is startup-coded and this buyer reads it as provisional. | Day 0 |
| **N4** | `ratepin.io` is registered by someone and does not serve. | Low | Irrelevant unless it starts serving a competing product. Add it to the weekly hash-diff watchlist that already monitors WHD form pages (D5) — zero marginal cost, no human. | Ongoing |
| **N5** | "Pin" reads as PIN (a numeric code) on first contact. | Low | Always ship the name attached to the category line (§7.2). The verb is used in-product on every artifact — *"pinned to WD CA20260012 Mod 4, published 2026-03-14"* — so the sense is taught by the product itself within one session. | Copy review |
| **N6** | **Rename cost.** `ARCHITECTURE.md`, `CORPUS_DESIGN.md`, `ENGINE.md` and `USER_JOURNEY.md` (~72,000 words) were written against "Wage Line." | Medium | Mechanical find-and-replace of the product name only; no decision in D1–D10 depends on the string. Do it in one commit at the phase-2 boundary so no downstream document straddles the rename. | Immediately |
| **N7** | An incumbent objects on confusion grounds. | Low | Nothing in the field is `Rate*`. LCPtracker's very broad 2026-07-06 filing is the one to watch, but it claims `LCPTRACKER`, not a rate term. | Ongoing |

---

## 10. Hypotheses — flagged, not established

Per the run's literature-grounding standard, these are stated as unproven:

- **The asking price of `ratepin.com`, and whether it is buy-it-now.** Atom.com returned HTTP 403 to every client I tried. The redirect proves it is marketplace inventory; nothing here proves the price or the checkout mode.
- **Every trademark statement in this document.** All are screening-grade (§2), including the "zero results" findings, which prove only that an aggregator's full-text index has no such literal string.
- **That `ratepin.io`'s registrant is not building a competing product.** DNS resolves; TLS resets; no page was retrieved.
- **That "Ratepin" out-performs "Wage Line" on recall or click-through.** No A/B test exists. The argument in §5 is a reasoned one, not a measured one — and under **G4**'s own logic we should not pretend otherwise.
- **That the artifact footer is a meaningful acquisition channel (D8's "the artifact is the channel").** Plausible and cheap, entirely unmeasured. `research/01-demand-pmf.md` already records that no primary contractor voice was obtained in phase 1.

---

## 11. Challenge notes

Binding decisions are implemented as written. Where I believe one is wrong, it is flagged here rather than quietly redesigned.

**Challenge C-N1 — D3's free WH-347 generator is table stakes, not a wedge.** D3 makes "free unlimited single WH-347 generation" the top of the funnel. Verified today, **PrevailComply already ships a free WH-347 generator**, `constructionbids.ai/tools/sub/wh-347-payroll-generator` is a free WH-347 form builder, DOL itself publishes a fillable form and a "Simplify Your Davis-Bacon Certified Payroll Reporting" web tool, and `wh-347.vercel.app` exists. Implemented as specified — it is still the right funnel — but the naming and brand layer must not present it as differentiation. Only the *provenance footer on the free artifact* is differentiating, and that is what the free tier must lead with.

**Challenge C-N2 — the merged name set was never screened.** `shortlist.json` merged `ModWatch`, `Bacondesk` and `WageLens` into Wage Line without a single availability check; `WageLens` was a live commercial product the whole time. Phase-1 idea merging should screen names at merge time, at a cost of about four HTTP requests.

**Challenge C-N3 — "the WD archive is a cornered resource" is refuted and must not survive into brand copy.** The dossier's moat paragraph rests on SAM publishing "no bulk download." `research/02` found `sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}` serving archived revisions as plain text, and govconapi.com reselling 90,033 WDs with all revisions at $19/mo. D-level strategy is not mine to rewrite, but the *name and brand* must not encode a refuted claim — which is a further reason the name attaches to the **pin** (an assembly and latency claim we can keep) rather than to the **archive** (a scarcity claim we cannot). See `BRAND.md` §5.4.

---

## 12. Frameworks applied

- **April Dunford**, *Obviously Awesome* (2019) — Step 6, market category: you cannot own a category under a word a live competitor trades under (the basis for striking Wage Line, Stringline, Chalkline, Gridline); the category phrase and the brand name must be different words (§6, item 14).
- **Clayton Christensen**, Jobs-to-be-Done — D2's circumstance, *"get Friday's certified payroll out the door with rates I can defend,"* supplies the promise sentence in §1.
- **Hamilton Helmer**, *7 Powers* (2016) — Branding power requires durable exclusive association; with a diluted root (N2) the durable layer must be the recurring artifact, not the wordmark.
- **Geoffrey Moore**, *Crossing the Chasm* — the beachhead is multi-project, multi-county open-shop specialty subs, which is why an in-niche collision at the same revenue band (Stringline Field, $5M–$20M contractors) is disqualifying.
- **Alex Hormozi**, *$100M Offers* (2021) — perceived likelihood of achievement is moved by demonstration, not assertion; the name and tagline point at a printed artifact the buyer can falsify for free.
- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — a name that reads as a cheaper form-filler makes the position above LCPcertified's $145/mo indefensible.
- **Jakob Nielsen**, 10 Usability Heuristics — heuristic #2, match between system and the real world: "pin down the rate" is the buyer's phrase (§5.2).
- **US Web Design System (USWDS)** — legibility guidance, including the prohibition on uppercase running text, applied to the wordmark (§7.1).
- **FTC**, *Policy Statement Regarding Advertising Substantiation*, and the Operation AI Comply enforcement sweep (25 Sep 2024, Chair Khan: *"there is no AI exemption from the laws on the books"*) — objective claims need a reasonable basis before dissemination; this is why claim-words are barred from the mark itself (§4, §8).

---

## 13. References

**Verified in-session, 2026-08-13**

- USPTO TSDR, WAGE+ — https://tsdr.uspto.gov/statusview/sn98116583 — Reg. 7450708, Linc Holdings, LLC, class 042, registered 2024-07-16
- USPTO TSDR, LCPTRACKER — https://tsdr.uspto.gov/statusview/sn99924010 — serial 99924010, LCPtracker, Inc., filed 2026-07-06, live/pending, classes 009/035/041/042/045
- USPTO TSDR, GRIDLINE — https://tsdr.uspto.gov/statusview/sn99294194 — Reg. 8158068, Gridline Holdings, Inc., class 042, registered 2026-03-03
- USPTO public trademark search (WAF-gated, could not be queried programmatically) — https://tmsearch.uspto.gov/
- Trademarkia full-text search — https://www.trademarkia.com/search?query=ratepin (zero results); https://www.trademarkia.com/search?query=chalkline (87027215 live, class 009); https://www.trademarkia.com/search?query=modline (all dead); https://www.trademarkia.com/search?query=stringline (all dead); https://www.trademarkia.com/search?query=certline (zero); https://www.trademarkia.com/search?query=wageproof (zero); https://www.trademarkia.com/search?query=ledgerline (zero); https://www.trademarkia.com/search?query=lcptracker
- Verisign RDAP for `.com` — https://rdap.verisign.com/com/v1/domain/ratepin.com — registered 2011-06-14, nameservers `ns1.squadhelp.com`
- Atom.com brandable-domain listing (redirect target of `ratepin.com`; HTTP 403 to automated clients) — https://www.atom.com/name/RatePin

**Market and product evidence**

- Wageline, Government of Western Australia — https://www.wa.gov.au/organisation/private-sector-labour-relations/contact-wageline
- WagePath, certified payroll reporting — https://wagepath.com/certified-payroll-reporting
- WageLens — https://www.wagelens.com/
- PrevailComply — https://prevailcomply.com/blog/california-dir-ecpr-guide-small-contractors.html
- PrevailForms — https://prevailforms.com/
- CertifiedPayrollPro, California certified payroll — https://www.certifiedpayrollpro.com/california-certified-payroll
- davisbaconrates.com vendor comparison — https://davisbaconrates.com/certified-payroll-software
- Free WH-347 generator, constructionbids.ai — https://constructionbids.ai/tools/sub/wh-347-payroll-generator

**Regulatory and standards basis**

- DOL WHD, Instructions for Completing Form WH-347 (OMB 1235-0008, expires 01/31/2028; 18 U.S.C. § 1001 warning) — https://www.dol.gov/agencies/whd/forms/wh347
- DOL WHD, Simplify Your Davis-Bacon Certified Payroll Reporting — https://www.dol.gov/agencies/whd/forms/wh347-web
- Federal Register, Agency Information Collection Activities; Davis-Bacon Certified Payroll (30 Aug 2024) — https://www.federalregister.gov/documents/2024/08/30/2024-19482/agency-information-collection-activities-comment-request-information-collections-davis-bacon
- 29 CFR Part 5 — https://www.ecfr.gov/current/title-29/subtitle-A/part-5
- FTC, Policy Statement Regarding Advertising Substantiation — https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation
- FTC, "FTC Announces Crackdown on Deceptive AI Claims and Schemes" (Operation AI Comply, 25 Sep 2024) — https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes
- FTC, Artificial Intelligence topic hub — https://www.ftc.gov/industry/technology/artificial-intelligence
  *(The FTC business-guidance blog post "Keep your AI claims in check" (27 Feb 2023) is widely cited for this proposition but returned HTTP 404 from this network on 2026-08-13, as did every other `/business-guidance/blog/` item tested. It is therefore not cited as a live source.)*
- U.S. Web Design System, Typography — https://designsystem.digital.gov/components/typography/
- Nielsen Norman Group, 10 Usability Heuristics for User Interface Design — https://www.nngroup.com/articles/ten-usability-heuristics/

---

**Document status:** decided and binding for phase 2, subject to N1. Amendments require a named source and a note of what they supersede.
