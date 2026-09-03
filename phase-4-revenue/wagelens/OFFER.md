# {{PRODUCT}} — The Offer

> **Name pending founder decision (PREREQUISITES P11).** Every customer-facing string in this
> document is the token **`{{PRODUCT}}`**, resolved from one constant at build time. `wagelens.com`
> is a live, unrelated pay-equity product (`IDENTITY.md` §1), so the working name cannot ship
> unexamined; `PLAN.md` A3 says the founder decides. The repository slug stays `wagelens`.
> *(Applied 2026-09-03, wave-1b finding M12.)*

**Author:** Offer & Landing agent ({{PRODUCT}}), wave 1. **Date:** 2026-09-03.
**Revised:** 2026-09-03 (wave-1b iteration — findings B2, B5, B8, B9, M2, M9, M12, M15, m9;
changelog in `REVIEW_RESPONSE.md`).
**Status:** proposal. Per PLAN.md A5 and PREREQUISITES P12, **the founder validates prices and
guarantees before any Stripe product is created.** Every liability the founder must personally accept
is marked **⚠ FOUNDER LIABILITY**.
**Evidence:** `offer/RESEARCH.md` (all sources fetched 2026-09-03). Anything not sourced there is not
allowed into copy.
**Method:** Hormozi *$100M Offers* — value equation, trim-and-stack, guarantee taxonomy, honest
scarcity, MAGIC naming. Suby *Sell Like Crazy* — Godfather offer, High-Value Content Offer, the
"would they be stupid to say no" test. Ramanujam — leaders / fillers / killers, minivation warning.
Dunford — position against the competitive alternative.

---

## 1. The offer in five lines

> **Vocabulary, before the list, because it governs every line in it.** `PERSONA.md` records that
> the buyer's word — and the form's own word — is **modification**, not "revision". All
> customer-facing copy uses "modification"; "revision" appears **only** where the SAM.gov API
> field is literally `revisionNumber`. *(Moved out of the middle of the list, 2026-09-03,
> finding m9 — it broke the numbering of the paragraph the founder reads first.)*

1. **Look up your county's Davis-Bacon rate free, before you sign up — then pin the modification your
   contract actually locked, because 29 CFR 1.6 says that is the one that governs your job, not
   today's.**
2. Map your workers to that determination's classifications once. Enter hours once a week.
3. Download a filled **WH-347 and Statement of Compliance** every Friday, with the last-four-digits
   redaction the regulation requires already applied — each one naming the determination and
   modification it was computed from.
4. When that determination is modified, you get an email naming **the classification that moved** and
   both modification numbers — not "rates changed in your state".
5. **$99/month, published on the page, no demo call, no setup fee, no per-report meter. Your first two
   Fridays are free — card on file, $99 charged on day 15, cancel in two clicks before then and you
   pay nothing. And in three years you can still prove where every number came from.**

> **What is deliberately *not* claimed here.** A free county rate lookup is not new — at least two
> exist publicly, one of them our nearest competitor's (`offer/RESEARCH.md` §3.6). We ship it because
> it is the only thing on the page the buyer can falsify himself, not because it is a differentiator.
> **Line 1's second clause and lines 3–5 are the offer.**

---

## 2. The value equation, term by term, for this buyer

Hormozi: **Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort &
Sacrifice)** — "Most products focus on the top of the equation, but the bottom is where the magic is"
([creatoreconomy.so](https://creatoreconomy.so/p/the-value-equation-for-irresistible-products),
secondary; RESEARCH.md §4.6).

### 2.1 Dream Outcome — score 7/10

**Not** "certified payroll software." The buyer's dream outcome, in his words, is two absences and one
presence:

- **Never miss a Friday.** The obligation is weekly and statutory: certified payrolls are due
  "weekly, for each week in which any DBA- or Related Acts-covered work is performed"
  ([29 CFR 5.5(a)(3)(ii)(A)](https://www.ecfr.gov/api/renderer/v1/content/enhanced/2026-09-01/title-29?part=5&section=5.5)).
  There is no week off. The dream is a Friday that ends at five.
- **Never get a DOL back-wage letter.** The consequences are real and first-party: withholding of
  accrued contract payments, back wages with priority over surety and reprocurement claims, CWHSSA
  liquidated damages "computed on a per day, per worker basis", and **debarment for three years** — for
  which the listed circumstances explicitly include having "**misclassified workers**"
  ([DOL prevailing wage resource book](https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/dbra-investigative-procedures-remedies)).
- **Be able to answer "show me."** When the GC or the contracting officer asks, the file is complete,
  dated and sourced.

*Why only 7.* This is a **negative** dream outcome — the reward is an absence. Nothing gets bigger, no
cash arrives. Unlike a product that recovers revenue, we cannot show a number going up. **The offer
must therefore make the absence visible**: the stack of completed Fridays, the alert that fired, the
form already filled. That is the job of the landing page's visuals, not of adjectives.

**Levers used:** the Friday Wall (a visible archive of every completed week); the alert that arrives
before he would have noticed; the finished WH-347 rendered on the page.

### 2.2 Perceived Likelihood of Achievement — score 4/10. **This is the binding constraint.**

A stranger's website is telling a contractor the legally correct wage rate for a county he has worked
in for twenty years, and he is being asked to believe it. He cannot check us cheaply, and **being wrong
is the exact thing he is afraid of.** The evidence that this is the constraint, not a guess:

- A paying LCPtracker customer has publicly asked, with votes behind it, that "**Subcontractors should
  be able to see the rates that the GC's have for the different job class**"
  ([lcptracker.uservoice.com](https://lcptracker.uservoice.com/forums/923176-lcpcertified)). The rate is
  opaque *inside the incumbent's own product*.
- The DOL's own conformance process exists because the classification list is routinely incomplete, and
  where a classification is missing the worker must still "be paid the prevailing wage for the labor
  classification of **work actually performed**"
  ([DOL conformance FAQ](https://www.dol.gov/agencies/whd/government-contracts/construction/faq/conformance)).
  That is a judgement the buyer is legally obliged to make and is not equipped to make.

**The six levers, ranked. Every offer dollar goes here.**

1. **Show the provenance next to every rate, always.** Determination number, modification number, effective
   date, decision date, and a live link to the determination on sam.gov. A rate without its provenance
   must not be renderable in the product — enforced by a test, exactly as the delivered Clausewright
   page enforces its citation rule.
2. **Let him verify before he pays.** The free Rate Lookup is the whole trust argument. If he can check
   one rate he already knows and we get it right, the other 400 become credible. **It is not a
   differentiator** — two free lookups already exist, one of them our nearest competitor's
   (`offer/RESEARCH.md` §3.6). It is a cost of entry we pay gladly, because it is the only thing on the
   page the buyer can falsify himself.
3. **Refuse what we cannot do.** We do **not** tell him which classification a worker belongs in. We
   show the determination's own classifications, the duties language, and the conformance route
   (SF-1444, the three criteria). Saying this out loud is worth more than claiming the opposite.
4. **Name the contract-lock problem before he hits it — this is now lever 1 in commercial terms, even
   though it is lever 4 in trust terms.** The determination that governs his job is the one
   incorporated into his contract, not necessarily today's (29 CFR 1.6). We show today's *and* let him
   pin the modification his contract locked, and — because superseded modifications stay permanently
   retrievable (`KNOWLEDGE_BASE.md` KB-3) — we can still reproduce that rate through the whole
   three-year retention window 29 CFR 5.5(a)(3)(ii)(G) imposes. **No incumbent page fetched describes
   modification history or contract-modification pinning. After the verification pass (RESEARCH.md §3.6) this
   is the offer's only genuinely unheld ground.**
5. **Publish the refresh cadence and the last-checked timestamp** on every determination, and a public
   data-incident log. Under PLAN.md A10 every value already carries `source_url`, `last_verified`,
   `verified_by` and `confidence` — surface those in the UI rather than hiding them in the schema.
6. **No success rate, no accuracy percentage, no customer count, until measured with a published
   denominator and method.** The category is full of unfalsifiable numbers (eMars: "50,000+ Users",
   "Reduce Time Managing Weekly Payroll by 80%"; Points North's unsourced penalty figures — RESEARCH.md
   §3.3). Not making one is the differentiator.

### 2.3 Time Delay — score 8/10

The value event is **the first completed Friday**, not day fourteen. A contractor who signs up on
Tuesday can be finished with this week's WH-347 in the same session, and the free Rate Lookup returns
in seconds with no account at all.

**Lever:** design the trial around the event, not the clock (§7). Never say "in minutes" as a bare
claim; show the three steps and let the count be obvious.

### 2.4 Effort & Sacrifice — score 6/10, and the term we win by construction

Setup is genuinely real: workers, classifications, fringe treatment, the project and its determination.
This is also the term the incumbents visibly lose. Their own paying users, verbatim:

- copying certified payroll between prevailing-wage jobs in the same week creates duplicates;
- "**Employee Data Export for Upload to LCPtracker**" — re-entry between systems;
- "**Make it easier to manage employees. Don't allow duplicates when copying**";
- "**Edit Record 'Project'**" — the project cannot be modified after payroll is entered;
- users "manually redacting SSNs in Adobe before sharing"
  ([lcptracker.uservoice.com](https://lcptracker.uservoice.com/forums/923176-lcpcertified)).

That last one is not a nicety: 29 CFR 5.5(a)(3)(ii)(B) *requires* that "Full Social Security numbers
and last known addresses, telephone numbers, and email addresses **must not** be included on weekly
transmittals." An incumbent's users are hand-redacting a legal requirement in Adobe every week.

**Levers:** **enter the crew once and carry it forward forever** (paste it in from a spreadsheet or
type it — WL-04; a file importer is WL-15, Should, and is not sold here); the same crew on a second
job is two clicks, not a re-entry; redaction by construction, never by hand; **no demo call, no
implementation fee, no sales call to see the price** — against a field where six of nine vendors gate
the number behind a form, and where 38% of B2B buyers say having to contact sales makes them *less*
likely to buy
([TrustRadius 2023, n=1,604](https://solutions.trustradius.com/vendor-blog/2023-b2b-disconnect/)).

### 2.5 The read

| Term | Score | Where the effort goes |
|---|---:|---|
| Dream Outcome | 7 | Make the absence visible |
| **Perceived Likelihood** | **4** | **Everything. Provenance, verification before payment, honest refusal.** |
| Time Delay | 8 | Already good — do not spend here |
| Effort & Sacrifice | 6 | Win by construction: never ask twice |

The mirror of the phase-1 Reinstate case: there the question was *"will it work?"*; here it is
**"is this number right?"**. Any design decision that does not increase the buyer's ability to verify
our rate himself is spent on a term that is already good enough.

---

## 3. The core offer

### 3.1 Naming it

Hormozi's MAGIC — Magnet, Avatar, Goal, Interval, Container. Three candidates:

| Name | Avatar | Goal | Interval | Container | Verdict |
|---|---|---|---|---|---|
| **The Right Rate, Every Friday** | implied (prevailing-wage contractor) | correct rate + filed form | Friday / weekly | system | **Chosen.** Carries both halves of the product — the rate *and* the deadline — in five words, at a reading level Unbounce's data rewards. It is also a promise we can keep. |
| The Friday Filing System for Federal Subcontractors | explicit | filing done | Friday | system | More MAGIC-complete but longer, and "system" is vendor language. Keep as the outbound subject-line variant. |
| The 55-Minute Friday | implied | the form done | weekly | — | Clever (it inverts DOL's own burden estimate) but requires a footnote to land. Keep as a section header, not the offer name. |

**Offer name: "The Right Rate, Every Friday."**

### 3.2 What is in the box

| # | Obstacle, in the buyer's words | Solution | Cost to us | Value to him | Verdict |
|---|---|---|---|---|---|
| O1 | "I don't actually know if the rate I'm paying is right." | **Rate Lookup**: state → county → construction type → every classification, base rate, fringe, with WD number, modification, effective date, sam.gov link | ~$0 marginal | **Very high** | **FREE TIER — the lead magnet.** ⚠ **Parity, not advantage** (RESEARCH.md §3.6). Ship it; never headline it. |
| O2 | "I don't know when the determination changed." | **Change alerts** — *per determination and per classification*, naming what moved and both modification numbers | Low | Very high | Public watch: **up to 3 determinations, consented and confirmed** (`specs/WL-14`). In the product: unlimited, per project (`specs/WL-08`). **Differentiated only by granularity**: the competing alert is "when wage rates change in your state" |
| **O2b** | **"Which version of the rate applies to *my* contract?"** | **Modification pinning + history**: pin the modification the contract incorporated; show pinned vs current side by side; keep every superseded modification retrievable for the whole 3-year retention period | Medium | **Very high** | **CORE — and the only obstacle on this list no incumbent page claims to solve.** This is the offer. |
| O3 | "Friday takes my whole evening." | Hours in once → filled **WH-347 + Statement of Compliance** | Core | Very high | **CORE** |
| O4 | "I re-type the same crew on every job." | Workers, classifications and fringe carried across projects and weeks | Core | High | **CORE** |
| O5 | "I have to redact SSNs in Adobe before I send it." | Last-four-only by construction, per 5.5(a)(3)(ii)(B) | Low | High | **CORE** — stack loudly |
| O6 | "This worker's job isn't on the list." | **Conformance pack**: the three criteria, SF-1444, the DBAconformance route, and the sentence that the process "may not be used to split, subdivide, or otherwise avoid application of classifications listed" | Build once | High | **Bonus B2** |
| O7 | "My contract locked an older determination." | Pin a modification per project; show current vs pinned side by side | Medium | High | **CORE — no competitor page mentions this** |
| O8 | "I have to keep these for years." | 3-year archive, per 5.5(a)(3)(ii)(G); export the whole file in one click | Low | Medium | **CORE** |
| O9 | "My GC chases me every week." | Share a read-only weekly link with the prime | Low | Medium | Core (Shop+) |
| O10 | "I'm the GC and I'm liable for my subs." | **Roll-up**: collect, check and track every sub's weekly submission | Medium-high | Very high | **GC tier** |
| O11 | "What if I sign up and it's wrong?" | The guarantee stack (§5) | Bounded (§5) | Very high | §5 |
| O12 | "Will it take a week to set up?" | Paste your crew from a spreadsheet, or type it; no file import, no implementation project | Low | High | **Bonus B1** |

**Explicitly trimmed** (Ramanujam's *killers* — features whose presence destroys willingness-to-pay or
credibility):

- **Full payroll processing, tax filing, direct deposit.** That is Payroll4Construction, Points North
  and eBacon's business. Entering it converts a $99 product into a PEO sale with an implementation
  project — the exact effort cost we win on. **We read hours; we never move money.**
- **A mandatory demo call.** Six of nine incumbents require one. It is pure Effort & Sacrifice and 38%
  of buyers say it makes them less likely to buy.
- **A setup or implementation fee.** CertifiedPayrollPro advertises "$0 setup"; Points North is
  reported at $995–$4,995 **[second-hand]**. A setup fee here is a killer.
- **A per-report meter.** Every competitor with published pricing meters reports ($1–$12 each). The
  meter punishes exactly our sharpest prospects — the ones with many small jobs. **Removing it is the
  pricing argument (§6).**
- **Telling him which classification a worker is.** Not trimmed for cost — trimmed because it is not
  ours to say, and claiming it would forfeit the one thing we are selling.
- **State-specific filing (CA DIR eCPR, WA L&I, NY, IL).** Real pain, out of launch scope per PLAN.md
  A11. Handled as an objection (§8, Q6), never implied on the page.

---

## 4. Bonuses

Hormozi's rule: each bonus solves a named obstacle, has a stated value, and costs us little to deliver.
**"Value to them" below is a qualitative ranking, not a dollar claim — no dollar value is asserted on
any customer-facing surface, because we cannot substantiate one.**

| # | Bonus | What it is | Cost to us | Value to them | Where it appears |
|---|---|---|---|---|---|
| **B1** | **First-Friday Setup** | **Paste your crew in from a spreadsheet** — or type it — set your first project, and get a checked first WH-347 before you are charged. Not a call, not an import project: a checklist that ends in a finished form. | Low (build once) + support time in the first 90 days | **Very high** — kills O12 and the "I'll do it next month" delay | In the trial, on the pricing block |
| **B2** | **The Conformance Pack** | What to do when the classification isn't listed: the three criteria verbatim, SF-1444, the DBAconformance route, the 30-day decision window, and the rule that conformance "may not be used to split, subdivide, or otherwise avoid application of classifications listed in the wage determination." Sourced, dated, one page. | Build once, ~$0 marginal | **High** — this is the buyer's scariest moment | Free tier gated by email → the HVCO |
| **B3** | **The Determination Watchlist** | Alerts on every determination you touch, naming the classification and what changed, with the modification numbers on both sides. | Low (same pipeline as the product) | **Very high** — the one thing nobody else sells | Public: up to 3, tick a box and confirm the email (`specs/WL-14`). Paid: unlimited, per project (`specs/WL-08`) |
| **B4** | **The Audit Binder** | One click: **one archive** containing every week of a project — every WH-347, every Statement of Compliance, the determination as it stood, and a source-and-date manifest with a hash per file — retained three years per 5.5(a)(3)(ii)(G). | Low | High — this is the "show me" answer | Shop tier |
| **B5** | **The Prime's Weekly Link** | A read-only link you send the GC, good for seven days and **re-issued in one click** whenever they ask again — and **revocable the moment you want it closed**. Stops the Thursday phone call. | Low | Medium-high | Shop tier |

> **Changed 2026-09-03 (wave-1b iteration, findings M2, M9, M10).** Three bonuses were sold in a
> shape the specs do not produce, and one was sold that the MVP does not build at all.
>
> - **B4 was "a single PDF"; `WL-07` produces a ZIP of PDFs plus a `manifest.csv`.** Reworded to
>   "one archive", which is what ships and is an equally good answer to "show me". The alternative
>   — building a merged binder PDF in WL-07 — is a real deliverable and a good later feature, but it
>   is new L-shaped work in an S-shaped spec, and the bonus does not need it. The name **"Audit
>   Binder"** is now the one name for this artefact across `OFFER.md`, `LANDING_SPEC.md` §9,
>   `WL-07` and the product (finding m10).
> - **B5 promised a link the GC can "bookmark"; `WL-06` expires the link in 7 days**, and nothing
>   revoked a leaked one. Reworded to a 7-day, re-issuable, revocable link — and `WL-06` gains
>   `revoked_at`, a visible revoke control and a privacy-page paragraph (finding M10). We are not
>   promising permanence for an unauthenticated URL that streams worker names and pay.
> - **B6 "Bring Your Own History" is deleted from the launch offer.** It sold a payroll importer as
>   *"a real reason to choose annual"* while `BACKLOG.md` places the importer at **WL-15, Should**,
>   with a trigger, on the argument that Rosa's hours come off paper time cards. Selling an unbuilt
>   bonus as the reason to buy annual is the one commercial promise in this document that would
>   generate refunds in month one. Moving WL-15 into Must was considered and rejected at this scope;
>   the gap it leaves in `UX.md` §4's 3-minute roster budget is closed instead by **paste a worker
>   list**, now specified in `WL-04` (finding M2). `history_import=true` is removed from the annual
>   prices' Stripe metadata in §10, so nobody is billed for an entitlement nothing implements.
> - **B4 and B5 are Shop-tier bonuses only** while the GC tier is not sellable (finding B2).

**B2 is the outbound magnet.** It is Suby's High-Value Content Offer in its exact intended form —
content that "should be simple, relevant, and address pressing issues" exchanged for a contact detail
([jessenyokabi.substack.com](https://jessenyokabi.substack.com/p/sell-like-crazy-how-to-get-as-many)).

---

## 5. The guarantee — proposed, with every liability flagged

### 5.1 The founder's candidate, and why it must not ship as written

> *"If a rate we show is wrong, we refund the year."*

**⚠ FOUNDER LIABILITY — five distinct problems, in order of severity.**

1. **"Wrong" is undefined, and the ambiguity is fatal.** A rate can be simultaneously *right* (it
   matches the current published determination) and *wrong for his job* (his contract incorporated an
   earlier modification — 29 CFR 1.6 fixes the applicable determination at solicitation or award, not at
   today's date). We do not hold his contract and cannot know which modification it locked. **This
   guarantee would pay out on a fact pattern that is not our error.**
2. **It warrants third-party data we do not produce.** The determinations are the government's.
   SAM.gov itself publishes corrections — its own announcements note determinations published with
   "incomplete information" ([sam.gov](https://sam.gov/content/wage-determinations)). Warranting their
   correctness is warranting an input we cannot control.
3. **It reads as a warranty of legal compliance.** That collides directly with PLAN.md A10's
   disclaimer requirement and with the fact that we are not, and must never present as, his compliance
   adviser. A guarantee that contradicts the disclaimer on the same page is worse than no guarantee.
4. **Adverse selection and timing.** A refund "the year" invites a claim in month eleven, after twelve
   months of filings have been extracted, with no cap and no proof standard.
5. **Correlated exposure.** A single ingestion bug hits every account in a state at once. The worst
   case is not one refund; it is *n* refunds on the same day.

### 5.2 The safer alternative — a four-layer stack, each layer inside our control

**G1 — The Friday Guarantee (unconditional, fully ours).**
> *"Enter your hours by Friday and your WH-347 and Statement of Compliance are ready the same day. If
> they are not, that month is free."*

Controls only our own uptime and output. **Bounded exposure: one month, one account.** Automatically
detectable and automatically refundable, so it can be honoured without a human decision. This is the
guarantee no competitor offers.
**⚠ FOUNDER LIABILITY: low and capped.** Accept.

**G2 — The Provenance Guarantee (the honest version of §5.1).**

> **⚠ CHANGED 2026-09-03 (wave-1b iteration, findings B8 and Q6).** Two things were wrong. **(1)**
> The cap was **twelve months**, at a founder-accepted worst case of **≈$237,600**, and the founder
> had not yet chosen. **(2)** `LANDING_SPEC.md` §5 carried a short form that **dropped the cap
> entirely** — *"we refund what you have paid"* — turning a bounded refund into an unbounded promise
> on the page a court would read. A guarantee sentence that contradicts the guarantee page is worse
> than no guarantee; that is §5.1's own argument, applied to itself.
>
> **Decision taken, under the failure rule (pick the option that reduces founder liability):
> three months, service-shaped.** Worst case at 200 accounts falls from ≈$237,600 to **≈$59,400**,
> and it retains the customer and the case data instead of buying an exit. It is what this document
> already recommended in §11.3 Q1 and what the reviewer's Q6 defaulted to. **The founder can
> override to twelve months** — it is their liability to accept — and if they do, the number must
> be changed in **all three places at once** (here, `LANDING_SPEC.md` §5, `UX.md` §11), because that
> is exactly how B8 happened.

**The canonical wording. This exact text, and no paraphrase of it, is what appears anywhere G2
appears — `OFFER.md`, `LANDING_SPEC.md` §5, `UX.md` §11 and the guarantee page:**

> *"Every rate we show carries the determination number, modification, effective date and a link to
> the source. If a rate we show you does not match the determination we cite, tell us: we refund
> every month you have paid since that rate appeared in your account, **up to three**, and we
> re-issue every corrected WH-347 free."*

**The short form, for a space that cannot carry the long one. The cap is in the same sentence,
which is the whole point of the short form existing:**

> *"If a rate does not match the determination we cite, we refund the months you paid since that
> rate appeared, **up to three**, and re-issue the corrected forms free."*

**Rule, and it is not stylistic: no refund sentence appears anywhere — page, product, email,
outbound, ad — without its cap in the same sentence.** A CI grep pairs the words "refund" and
"up to three" in every user-facing string.

This guarantees **fidelity to the source we cite** — entirely in our control — rather than **legal
correctness** — not in our control. It gives the buyer exactly the reassurance he wants, on the axis
where we can actually perform, and it is falsifiable by him in ten seconds against the sam.gov link we
put next to the number.

**⚠ FOUNDER LIABILITY, and it is the real one:**
- Worst case is correlated: a systematic ingestion error × all affected accounts × **three months**.
  At 200 accounts on $99/mo that is **≈$59,400** in cash plus the re-issue work. That is the number
  the founder is now being asked to accept. (At twelve months it was ≈$237,600.)
- Mitigations that must be in place *before* this wording goes live: (a) the three-month cap, stated
  **in the same sentence** as the refund; (b) PLAN.md A10's two-agent verification actually running;
  (c) a public data-incident log so a fixed error is dated and closed; (d) a per-account cap of the
  amount actually paid — never a multiple; (e) **a lawyer's read before launch** (a founder to-do in
  PREREQUISITES).
- **G2 still does not ship until the founder and a lawyer have signed it** (§11.3 Q2). Until then it
  is **cut from the landing page entirely** — not softened, not shortened — and `LANDING_SPEC.md`
  §14 makes that unconditional rather than pending. G1, G3 and G4 ship regardless and are unaffected.

**G3 — The Exit Guarantee (unconditional, costless).**
> *"Cancel inside the product in two clicks. No call, no email, no retention offer. Your archive stays
> downloadable for 30 days after you leave."*

Free to give, directly answers the largest objection to a subscription, and is the exact behaviour
100% of B2B buyers say they want (TrustRadius: "100% of buyers want to self-serve all or part of the
buying journey").
**⚠ FOUNDER LIABILITY: none, beyond forgoing save-the-customer calls.** Accept.

**G4 — The Anti-Guarantee (Hormozi's fourth type; raises likelihood by refusing).**
> *"We will not tell you which classification a worker belongs in, and we will not sign your Statement
> of Compliance. Those are yours. What we will do is show you the determination's own classifications
> with their duties, flag when the work you describe isn't on the list, and hand you the conformance
> route."*

**⚠ FOUNDER LIABILITY: none. It reduces liability.** It is also the single strongest trust move
available, on the same logic as the honest-triage refusal in the delivered Clausewright product.

### 5.3 What is never guaranteed, said plainly on the page

> *No one can guarantee you will not be audited, and no one can guarantee the outcome if you are.
> Anyone who tells you otherwise is selling you something they do not control.*

---

## 6. The price ladder

### 6.1 The ladder

| Tier | Price | Annual (2 months free) | Who | What |
|---|---|---|---|---|
| **Rate Lookup** | **Free** — no card, no login | — | Anyone | Live determination lookup by state / county / construction type; every classification with base rate and fringe; WD number, modification, effective date, sam.gov link — **and the modification picker, so you can read the determination at the modification your contract locked**. **Email only if you want alerts:** up to 3 watched determinations, change alerts, the Conformance Pack (B2). The email is opt-in with a ticked box, confirmed from a link, and one-click unsubscribable — the mechanics are `specs/WL-14`. |
| **Crew** | **$79/mo** | **$790/yr** | The one- to three-job sub, ≤ 15 workers | Everything in Rate Lookup, unlimited alerts, up to **3 active projects** and **15 workers**, unlimited WH-347 + Statement of Compliance, modification pinning, 3-year archive. |
| **Shop** ⭐ | **$99/mo** | **$990/yr** | **The ICP.** Many small covered jobs, 10–100 workers | **Unlimited active projects**, up to **100 workers**, no per-report fee, Audit Binder (B4), the Prime's Weekly Link (B5), conformance flags, multi-determination pinning, priority support. |
| **GC Roll-up** *(coming)* | **$299/mo** | **$2,990/yr** | Small GCs carrying prime liability for subs | **Not yet available — join the list.** When it ships it *will* add, on top of Shop: unlimited subcontractor seats, weekly collection and completeness checking of every sub's certified payroll, a per-sub status board, and one-click assembly of the prime's package. |

> **The free watch now has a spec (wave-1b finding B5).** "Email me when this determination
> changes" was promised here, on the landing page and in `UX.md`, and specified nowhere — no
> consent record, no unsubscribe, no CAN-SPAM footer, no owner, for an email address collected on
> a public page. It is now **`specs/WL-14 · Public determination watch`**, a **Must** at effort S:
> an unticked consent checkbox naming the determination, double opt-in, ≤3 per address, one-click
> unsubscribe (in the body and in `List-Unsubscribe`), the postal address in every message, rate
> limits, and stated retention. The promise stays because it is the only email list this product
> builds organically — but it is built as a consented list, not a scrape.

> **⚠ CHANGED 2026-09-03 (wave-1b iteration, finding B2 and Q2). The GC tier is on the ladder and
> is not for sale.** It had a live `Start free` CTA on the landing page and six purchasable Stripe
> prices, while the feature it names — `WL-24` — is a **Should** with a demand trigger attached.
> Charging $299/month for sub seats, weekly collection and a per-sub status board that do not exist
> is misrepresentation with a refund and a chargeback behind it.
>
> **Decision taken: keep it published as "coming", with a waitlist and no purchase path.** The
> price stays visible because a legible ladder is what makes $99 read as the middle, and because a
> GC who asks should be waitlisted rather than lost. What changes is that nothing can take his
> money for it: `WL-09` V17–V19 make "not sellable" a property of the code (a sellable-set constant
> Checkout refuses to leave, a boot assertion against a live-mode GC price id, and a render test
> that no purchase control exists inside the card), and §10's Stripe table marks the GC rows
> **test mode only**.
>
> **The alternative — moving WL-24 into Must — was considered and rejected.** It is the MVP's
> largest **L** (org-to-org invitations, a permissions matrix, a review-and-reject workflow, a
> nagging engine), none of which the sub tier needs; its value is *other people's payrolls*, so it
> cold-starts empty on day one; and it would push out the date a stranger can first pay us. The
> waitlist gives us `gc_tier_interest`, which is precisely the signal BACKLOG's own trigger for
> WL-24 asks for. **This decision is the founder's to reverse**, and reversing it means shipping
> WL-24 first, not exposing the price first.

**Why the GC tier exists at all, and why it *will* be worth 3× when it ships:** because the
regulation says so.
"**The prime contractor is responsible for the submission of all certified payrolls by all
subcontractors**" (29 CFR 5.5(a)(3)(ii)(A)), and the prime "will be liable for any unpaid wages and
monetary relief due to any workers" of lower-tier subs
([DOL resource book](https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/dbra-investigative-procedures-remedies)).
A GC is not buying convenience; he is buying a defence against a liability he holds whether he knows
about it or not.

**Why Crew exists at $79 when Shop is $99.** Two honest reasons, and one of them is a decoy. (1) A
genuine single-job sub should not be sold a 100-worker plan. (2) $79 sitting next to $99-unlimited
makes $99 the obvious choice; that is deliberate structural design, and it is disclosed here so the
reviewer can object to it. *No claim about middle-tier selection rates is made — the commonly cited
ProfitWell/CXL decoy figures could not be verified at any primary source (RESEARCH.md §4.5).*

### 6.2 Against the competitive alternative

A sub with **four active covered projects filing weekly** — 208 forms a year, which is the profile of
the sharpest rows in the prospect file. All competitor prices fetched 2026-09-03.

| Option | Year-one cash | Per-report meter? | Rate lookup? | Change alerts? |
|---|---:|---|---|---|
| **By hand** (Excel + the DOL's free WH-347) | **$0** + **190.7 hours** — DOL's own estimate of 55 minutes per form × 208 | — | no | no |
| CertifiedPayrollPro Starter ($49 + $5/report) | $1,628 | yes | **not listed** | **not listed** |
| CertifiedPayrollPro Pro ($99 + $3/report) | $1,812 | yes | **not listed** | **not listed** |
| CertifiedPayrollPro Enterprise ($249 + $1/report) | $3,196 | yes | **not listed** | **not listed** |
| LCPcertified Plus, 5 active projects | $1,740 ($145/mo) | — | no | no |
| LCPcertified Plus, 10 active projects annual | $1,300 | — | no | no |
| LCPcertified per report ($12) | $2,496 | yes | no | no |
| Points North | **price not published** | reported yes | no | no |
| eBacon / Elation / eMars / Foundation / My Construction Payroll | **price not published — demo required** | — | no | no |
| **{{PRODUCT}} Shop** | **$990 annual / $1,188 monthly** | **no** | **yes** | **yes** |

**Three arguments fall out, and only three:**

1. **The meter is the enemy of our buyer.** Everyone with a published price charges per report. Our
   sharpest prospects are precisely the firms with many small jobs — "33 federal subawards, $1.6M …
   the worst possible ratio of paperwork to revenue" (prospect file). A flat price is not a discount;
   it is a different shape, and it is the shape that fits.
2. **Against doing it by hand.** $990 a year is **$5.19 for each hour the Department of Labor itself
   estimates this takes** (190.7 hours at 4 projects). We do not need to guess his hourly cost, and we
   must not: the landing page asks him for it and does the arithmetic in his browser.
3. **The price is on the page.** 54% of B2B buyers say missing pricing is the number-one reason they
   would be less likely to buy; 72% say transparent pricing makes them more likely; 38% say having to
   contact sales makes them less likely (TrustRadius, n=1,604). Six of nine incumbents fail this test.
   **State it once, in the pricing block. Do not build the headline on it** — CertifiedPayrollPro
   publishes too, and against them transparency is parity, not advantage.

**The honesty clause we must ship.** At *one* project a year, LCPcertified's $12-a-report ($624) and
CertifiedPayrollPro's Starter ($848) can both beat us, and doing it by hand costs no cash at all.
**Say so on the page.** A comparison table that always wins is not believed by a man who has been
quoted by four vendors.

### 6.3 Why not cheaper

Ramanujam's *minivation*: undercutting CertifiedPayrollPro's $49 to "win on price" would be an
undifferentiated discount that destroys the category's economics and buys no defensibility.

**What the $50 premium over their Starter actually buys — corrected after verification (RESEARCH.md
§3.6):** not the lookup, which they give away too. It buys **no per-report meter** (the arithmetic in
§6.2 — at four projects their Starter reaches $1,628 against our $990 annual), **alerts that name the
classification rather than the state**, and **the modification: pinning, history, and a rate that is still
reproducible in year three.** If a reviewer decides those three are not worth $50/month to this buyer,
the correct response is to cut the price, **not** to invent a fourth claim.

### 6.4 Optional, honest scarcity — founder's decision

**Founding 50:** the first 50 paying accounts keep their launch price for 24 months, stated on the page
with a live remaining count.
**⚠ FOUNDER LIABILITY: a real 24-month price lock on up to 50 accounts (max forgone revenue if prices
later rise 25%: ≈$14,850 across 50 Shop accounts over 24 months).** It is honest *only* if the counter
is wired to the real number of accounts and the offer genuinely closes at 50. **If it cannot be wired
truthfully, do not run it.** No countdown timers, no invented seat scarcity, ever.

---

## 7. Trial design — the two candidates, and the resolution

| | **A. 14-day free trial, card on file** | **B. First WH-347 free, no card** |
|---|---|---|
| For | Poyar (n=200): "Free trials that require a credit card see **30%** free-to-paid conversion – more than 5x ones that don't"; "14 days is the most common trial length (**62%**)"; "57% of products have a free trial as their primary landing point" | Matches the value event exactly. Removes all risk. Matches CertifiedPayrollPro's advertised "No credit card required" |
| Against | Our nearest competitor advertises no-card as a feature; a card wall is a visible disadvantage side by side | 5× worse conversion at the benchmark; and the buyer may never reach a Friday inside a short window |

**Resolution — take both, by framing one as the other.** A 14-day window **always contains two
Fridays**. So:

> **"Your first two Fridays are free. Card on file, charged on day 15, cancel in two clicks before
> then and you pay nothing."**

**This is the one trial design, everywhere.** `UX.md` used to describe a different one — a cardless
free *first week*, with the paywall at the second week's form — while this document, `BACKLOG.md`,
`specs/WL-09` and `THRESHOLDS.md` all described this one, and `BACKLOG.md` §4 lists a free tier
under **Never**. Three documents to one, and the money path, the Stripe metadata and every threshold
band are already built on this one. It also reduces liability: a cardless free week hands a signed
federal document to an unverified stranger. `UX.md` §1, §6 (A16) and §13 have been rewritten to
match. *(Wave-1b finding B1, decision D1, 2026-09-03.)*

Stripe implementation: `trial_period_days = 14`, card collected at checkout
(`payment_method_collection = always`), Stripe's own trial-ending reminder plus our own day-10 email.
This satisfies the 30% card-on-file benchmark and the 62% 14-day norm **and** guarantees the buyer
experiences the outcome before deciding — which is the only thing that moves Perceived Likelihood
(§2.2).

### 7.1 The auto-renewal disclosure — added 2026-09-03 (finding B9)

**A free trial that converts into a recurring charge is a negative-option offer.** Nothing in the
wave-1 documents required a disclosure, a consent record or a renewal notice, and the landing page's
paid CTAs read `Start free`. Under ROSCA, the FTC's negative-option posture and state automatic
renewal laws (California's ARL is the strictest, and also requires a renewal reminder on longer
terms), all four of the following are required, and all four are now **spec requirements** in
`specs/WL-09` V14–V16b — not marketing intentions:

1. **Clear and conspicuous terms before the card is collected.** The checkout page renders, adjacent
   to and **above** the button, in the surrounding type size and never in a footnote or a link: the
   trial length; **the exact amount and the exact date of the first charge**; the renewal interval
   and that it continues until cancelled; how to cancel, in one sentence, with the link; and that a
   reminder arrives before the first charge.
2. **Express, recorded consent.** An **unticked** checkbox — "I've read the trial terms above" —
   gates Checkout, and acceptance is stored with the content hash of the block as rendered, the
   amount disclosed and the date disclosed (`subscription_terms_acceptances`, the same mechanism as
   WL-11's disclaimer acknowledgements).
3. **Notice before money moves.** The **day-10 email** — four days before the first charge — naming
   the amount, the date, the cancel link and what has already been produced: *"Here are the two
   WH-347s {{PRODUCT}} has already produced for you. $99 will be charged on {date}. Keep it or
   cancel — both are one click."* And on annual plans, a **renewal notice ≥ 7 days before every
   renewal**. Both are transactional and cannot be switched off by a marketing unsubscribe.
4. **A CTA that discloses.** **No button that leads to a card may read "Start free."** Every one
   reads **`Start 14-day trial`**, with the trial length and the charge stated beside it. A CI grep
   fails the build on `Start free` in a user-facing string. The **free Rate Lookup** keeps its own
   honest microcopy — "Free. No card, no login, no demo call." — because it genuinely is free and
   takes no card; the rule is about CTAs that lead to a card.

**Non-negotiable, because it is what makes the card wall fair:**
- The **Rate Lookup is free forever with no card and no login.** The trial gates the *form*, never the
  *rate*. This is the HVCO and the entire trust argument; card-gating it would gut the funnel in the
  one place where trust is the whole currency.
- Cancellation is in-product, two clicks, no call, no retention flow (G3) — **at least as easy as
  subscribing**, which is the legal standard as well as the promise we printed.

---

## 8. The objection map

| # | Objection, in his words | The answer | Where it lives |
|---|---|---|---|
| Q1 | **"How do I know your rate is right?"** | You do not have to take our word for it. Every rate shows the determination number, modification and effective date, with a link to that determination on sam.gov. Look up a county you know before you give us an email. And if a rate we show does not match the determination we cite, we refund the months you paid since that rate appeared, up to three, and re-issue the corrected forms free (G2 — **which does not ship until the founder and a lawyer have signed it**). | Hero + free lookup + FAQ |
| Q2 | **"My contract locked an older determination."** | Correct, and most tools ignore it. 29 CFR 1.6 fixes the applicable determination at solicitation or award; open-ended contracts update on each anniversary. Pin the modification your contract locked; we show current and pinned side by side and tell you when they diverge. | FAQ + product |
| Q3 | **"Are you telling me how to classify my workers?"** | No, and we will not. That is your determination and your signature. We show the determination's own classifications and duties, flag work that isn't on the list, and hand you the conformance route (SF-1444, the three criteria). | G4, stated on the page |
| Q4 | **"I already have a payroll company."** | Keep them. We do not process payroll, file taxes or move money. You enter hours; we produce the WH-347 and the Statement of Compliance and watch the determination. | FAQ |
| Q5 | **"My GC makes me file in LCPtracker."** | Then keep filing there. {{PRODUCT}} gets the numbers right and produces the form; where the agency mandates a portal, you upload what we produce. We are the rate and the paperwork, not a replacement for a mandated portal. *(Verify export formats against agency portals in wave 2 before this claim is made stronger.)* | FAQ |
| Q6 | **"I also file California DIR / Washington L&I / New York."** | Not at launch. Launch is federal Davis-Bacon and WH-347 for all 50 states (PLAN.md A11). We say so on the page rather than letting you find out in week two. | FAQ, plainly |
| Q7 | **"$99 a month is more than I pay now."** | Compare the whole year, including the per-report fee. At four jobs filing weekly: $990 with us against $1,628–$3,196 on metered plans. And if you run one job at a time, one of those is genuinely cheaper than we are — that is on our comparison table too. | Pricing block |
| Q8 | **"I don't have time to set this up."** | Your crew pastes in from a spreadsheet — or you type it — and your first project takes three fields, in one sitting. B1 walks you through a checked first WH-347 before you are charged. No file import to fight with, no implementation project, no setup fee, no call. | Bonus B1 + FAQ |
| Q9 | **"What happens to my records if I cancel?"** | Your archive stays readable and downloadable for **30 days** after you leave — and the three-year retention duty under 5.5(a)(3)(ii)(G) is yours, so the cancel flow offers you the Audit Binder export on the way out. | G3 + FAQ |
| Q10 | **"Are you lawyers? Is this legal advice?"** | No. {{PRODUCT}} shows you published wage determinations with their sources and produces the forms from the hours you enter. It is not legal or compliance advice, and it does not sign your Statement of Compliance. | Disclaimer on every screen (A10) |
| Q11 | **"You're new. What if you disappear?"** | Everything you enter exports, at any time, in one click, in formats you can keep. We do not hold your file hostage. | FAQ |
| Q12 | **"Nobody's audited me in ten years."** | Maybe not. The consequences are not the audit, they are withholding of accrued payments, back wages, liquidated damages per worker per day, and three-year debarment — for which misclassification is a listed circumstance. We will not tell you your odds; nobody honest can. | Proof block, once, without theatre |

---

## 9. The Godfather version — what we say in the first outbound email

**Constraints obeyed:** organisation-level only, no named individuals (D5); the personalisation is a
public fact about the *company* from USAspending / SAM.gov; drafts-first — nothing sends until the
founder approves the batch (A4); CAN-SPAM footer with a physical postal address (P10).

**Suby's Godfather test applied:** the ask is not "buy" and not "book a demo." The ask is *"tell me
your county and trade"*, and what comes back is the single most valuable thing this buyer cannot easily
get. It is the High-Value Content Offer delivered one-to-one.

> **Subject:** the Davis-Bacon rate for {{county}}
>
> {{Company}} has been recorded on {{n}} federal construction awards in {{county}}, {{state}} since
> 2024, which means a WH-347 every week you're on them.
>
> Reply with your county and your trade and I'll send back the current Davis-Bacon determination for
> that work — every classification, the base rate, the fringe, the determination number and modification
> date, and the link to it on sam.gov. No signup, no call, no charge. Keep it whether or not you ever
> talk to me again.
>
> If it's useful, that's what {{PRODUCT}} does every week: the rate, then your WH-347 and Statement of
> Compliance from the hours you type once, and an email when the determination changes. $99 a month,
> price on the page, first two Fridays free — card on file, charged on day 15, cancel in two clicks
> before then. Whoever does this on Friday afternoon types the week once.
>
> The Department of Labor's own estimate for filling in one WH-347 is 55 minutes. If you're on four
> jobs, that's most of a working week every year.
>
> — {{sender}}, {{PRODUCT}} (a TheVillage company)
> {{postal address}} · unsubscribe: {{link}}

**Why this is the Godfather version and the landing page is not.** Cold outbound gets one paragraph of
attention, so the free thing must be *complete in itself* — he can take the determination and never
reply again. Hormozi's lead-magnet rule: solve a narrow problem completely, in a way that makes the
next problem obvious. He now has this week's rate; he still has to fill in the form tonight.

**Sequence position:** email 1 of the four-touch sequence in `outbound/wagelens/PLAYBOOK.md` (wave 3).
Follow-ups deliver the Conformance Pack (B2) and a determination-change alert for his county — both
useful whether or not he buys.

---

## 10. Draft Stripe product list

For `STRIPE_SETUP.md` (wave 2 hand-over). **Test mode first; the founder creates these and flips live
(D2, P5).** All prices USD. Annual = 10× monthly (two months free). No setup fees, no metered
components, no per-report usage records — the absence of a meter is a product decision (§6.2).

> **Two changes, 2026-09-03 (wave-1b iteration).**
> **(B2)** The two **GC rows are marked `TEST MODE ONLY`.** The founder creates them in test mode so
> the ladder can be exercised end to end, and **does not create them live** until WL-24 ships.
> `specs/WL-09` V17–V19 back this in code: Checkout refuses a GC lookup key, and a live-mode GC
> price id in the environment fails the boot assertion.
> **(M2)** **`history_import=true` is removed from all three annual rows.** It flagged an
> entitlement for bonus B6, which is deleted from the launch offer because no importer is built
> (WL-15 is a Should). A metadata flag nothing implements is a customer being billed for a feature
> that does not exist — the same defect as B2, one level down.

| Product name | Price nickname | Amount | Currency | Interval | Trial days | Lookup key | Metadata | Env var for the price id | live at launch? |
|---|---|---:|---|---|---:|---|---|---|---|
| {{PRODUCT}} Crew | Crew Monthly | $79.00 | usd | month | 14 | `wagelens_crew_monthly` | `app=wagelens; tier=crew; projects_max=3; workers_max=15; sub_seats=0; alerts=unlimited; audit_binder=false; prime_link=false` | `WAGELENS_PRICE_CREW_MONTHLY` | **yes** |
| {{PRODUCT}} Crew | Crew Annual | $790.00 | usd | year | 14 | `wagelens_crew_annual` | `app=wagelens; tier=crew; projects_max=3; workers_max=15; sub_seats=0; alerts=unlimited; audit_binder=false; prime_link=false` | `WAGELENS_PRICE_CREW_ANNUAL` | **yes** |
| {{PRODUCT}} Shop ⭐ | Shop Monthly | $99.00 | usd | month | 14 | `wagelens_shop_monthly` | `app=wagelens; tier=shop; projects_max=unlimited; workers_max=100; sub_seats=0; alerts=unlimited; audit_binder=true; prime_link=true; recommended=true` | `WAGELENS_PRICE_SHOP_MONTHLY` | **yes** |
| {{PRODUCT}} Shop ⭐ | Shop Annual | $990.00 | usd | year | 14 | `wagelens_shop_annual` | `app=wagelens; tier=shop; projects_max=unlimited; workers_max=100; sub_seats=0; alerts=unlimited; audit_binder=true; prime_link=true; recommended=true` | `WAGELENS_PRICE_SHOP_ANNUAL` | **yes** |
| {{PRODUCT}} GC Roll-up | GC Monthly | $299.00 | usd | month | 14 | `wagelens_gc_monthly` | `app=wagelens; tier=gc; projects_max=unlimited; workers_max=unlimited; sub_seats=unlimited; alerts=unlimited; audit_binder=true; prime_link=true; sub_rollup=true` | `WAGELENS_PRICE_GC_MONTHLY` | **NO — TEST MODE ONLY until WL-24 ships (B2)** |
| {{PRODUCT}} GC Roll-up | GC Annual | $2,990.00 | usd | year | 14 | `wagelens_gc_annual` | `app=wagelens; tier=gc; projects_max=unlimited; workers_max=unlimited; sub_seats=unlimited; alerts=unlimited; audit_binder=true; prime_link=true; sub_rollup=true` | `WAGELENS_PRICE_GC_ANNUAL` | **NO — TEST MODE ONLY until WL-24 ships (B2)** |

**Settings that are part of the offer, not just plumbing**

| Setting | Value | Why |
|---|---|---|
| Card at checkout during trial | **Required** | Poyar: card-on-file trials convert at 30% vs "more than 5x" lower without |
| `trial_period_days` | **14** on every price | 62% of products use 14 days; and 14 days always contains two Fridays (§7) |
| Stripe trial-ending email | **On**, plus our own day-10 email showing what has been produced | The day-10 email is the offer; the Stripe one is the courtesy |
| Customer Portal: cancel | **Enabled, immediate, no retention flow** | G3. Any retention wall contradicts the guarantee we printed |
| Customer Portal: switch plan | **Enabled between the four sellable prices** (Crew ⇄ Shop, monthly ⇄ annual), proration on. **The GC prices are not offered in the Portal** | Crew → Shop must be self-serve; a Portal that can switch you onto an unbuilt tier is the same defect as a Checkout that can (B2) |
| **Trial terms disclosure + consent** | **Required before Checkout** — the block, the unticked checkbox, the recorded acceptance (`specs/WL-09` V14–V15) | **B9.** A card-on-file trial that auto-charges is a negative-option offer; the terms must be disclosed before the card and the consent recorded |
| **Pre-charge reminder** | **Day 10, ours**, naming the amount, the date and the cancel link — plus Stripe's own trial-ending email | **B9.** Ours is the notice; Stripe's is the courtesy |
| **Annual renewal notice** | **≥ 7 days before every renewal**, amount + date + cancel link | **B9.** Required by state automatic renewal laws on longer terms, and it is the right thing anyway |
| **CTA label on every paid plan** | **`Start 14-day trial`** — never "Start free" | **B9.** A CI grep fails the build on `Start free` in a user-facing string |
| **GC tier exposure** | **Waitlist card only. No Checkout path, no Portal path, no live price** | **B2.** `specs/WL-09` V17–V19 |
| Proration | **On** | Upgrading mid-month must not require a human |
| Tax | Stripe Tax **on** | US-only at launch (A2) |
| Coupon (optional, §6.4) | `FOUNDING50` — price locked 24 months, `max_redemptions=50` | **Only if the remaining count on the page is wired to the real number.** Founder's decision |
| Free tier | **No Stripe object** | Rate Lookup is free forever, outside billing entirely |

**Not created live at launch:** the two **GC prices** (test mode only, B2). **Not created at all:**
any metered/usage price, any one-time setup fee, any "contact us" enterprise tier. All three of
those are offer decisions (§3.2 trimmed list, §6.2), not oversights.

**Hand-over note for the founder.** Four live prices at launch — Crew monthly/annual, Shop
monthly/annual. Create the two GC prices in **test mode** so the ladder can be exercised end to end,
and leave the live-mode GC environment variables **unset**; the app asserts on boot that they are.

---

## 11. Self-review

### 11.1 Suby's test: would he be stupid to say no?

Asked honestly of a sub on four covered jobs:

*He can see the rate for his own county, with the determination number and the sam.gov link, before he
gives us an email. He can file his first two Fridays free — card on file, $99 on day 15, and we tell
him the amount and the date before he types the card. The price is on the page and there is no call.
There is no per-report meter, so his fourth job costs nothing extra. If a rate does not match the
determination we cite, we refund the months he paid since it appeared, up to three, and re-issue the
corrected forms free. And we have told him, in writing, the one thing we will not do.*

**Honest verdict: strong, not irresistible — and weaker after verification than before it.** Two
things are true at once. (a) The free lookup, which the first draft treated as the wedge, is a
commodity he can get in two other places (RESEARCH.md §3.6), so it buys entry to the consideration set
and nothing more. (b) What remains — the modification pinned to his contract, alerts that name the
classification, a flat price, and a rate still provable in year three — is genuinely unheld ground, but
it is **ground he does not know he is standing on until we explain it.** That is a harder sale than
"we'll show you the rate", and it is the honest position.

**Recorded as the offer's known weakness for the wave-1b reviewer.** The single highest-leverage
improvement is no longer the lookup's existence — it is making the **contract-lock problem legible in
five seconds** on the landing page (LANDING_SPEC.md V2, the Determination Timeline). If that diagram
does not land, this offer degrades to a price argument against a cheaper competitor, and the price
argument alone is not enough.

### 11.2 Value equation, after the offer is built

| Term | Before | After | What moved it |
|---|---:|---:|---|
| Dream Outcome | 7 | 7 | Unchanged. It is a negative outcome; visuals make it visible, nothing makes it bigger. |
| **Perceived Likelihood** | **4** | **7** | Free verifiable lookup (parity, but it is what lets him check us) + provenance on every rate + modification history he can re-open years later + G2 + G4's refusal + no invented statistics |
| Time Delay | 8 | 9 | Rate in seconds with no account; first WH-347 in the first session |
| Effort & Sacrifice | 6 | 8 | No demo, no setup fee, no meter, import once, redaction by construction, two-click exit |

### 11.3 Open questions for the founder

**Three of these were decided in the wave-1b iteration (2026-09-03) rather than left open, because
leaving them open blocked the build and left an unbounded promise on a live page. Each was decided
in the direction that reduces founder liability, and each is reversible by the founder — the
reversal cost is written next to it.**

1. **G2's cap: twelve months or three?** **DECIDED: three months, service-shaped** — refund the
   affected months, up to three, *and* re-issue every corrected form free. Worst case at 200 accounts
   falls from ≈$237,600 to ≈$59,400, and it keeps the customer and the case data instead of buying an
   exit. *(Finding B8; the cap now travels inside the sentence everywhere the guarantee appears.)*
   **Founder can override to twelve months** — it is their liability; changing it means changing the
   number in `OFFER.md` §5.2, `LANDING_SPEC.md` §5 and `UX.md` §11 **in the same edit**, because
   editing one of the three is exactly how B8 happened.
2. **Does G2 ship at all before a lawyer reads it?** **DECIDED: no**, and it is now unconditional
   rather than pending — `LANDING_SPEC.md` §14 cuts the sentence from the page until founder **and**
   counsel sign it, and §5 runs at 93 words without it. "Counsel review of G2 wording" is a founder
   to-do. G1, G3 and G4 ship regardless. *(Finding B8.)*
2a. **Sell the GC tier at launch?** **DECIDED: no.** It is published as "coming" with a waitlist,
   no purchase control and no live Stripe price; `specs/WL-09` V17–V19 make that a property of the
   code. **Founder can override by shipping WL-24 first** — the override is building the tier, not
   exposing the price. *(Finding B2, §6.1.)*
3. **Crew at $79 — keep or drop?** Dropping it simplifies the page and loses the genuine single-job
   sub. Keeping it is partly a decoy, which is disclosed in §6.1 and which the reviewer may reject.
4. **Founding 50 (§6.4) — run it or not?** Only if the counter can be wired to the real number.
5. **Is "$99/mo, unlimited projects" leaving money on the table for the 8-plus-project sub?** At eight
   projects a competitor's metered plan reaches $2,436–$3,404 and we still charge $990. That is the
   argument *for* the flat price, and also the case for a fourth tier later. Not at launch.
6. **The wage-determination data path is now resolved — but on undocumented endpoints.** The API named
   in PREREQUISITES P8 does not exist (404), yet `KNOWLEDGE_BASE.md` §F1 verifies a working
   unauthenticated route through the API sam.gov's own front end calls, including full modification
   history and permanently retrievable superseded modifications — which is exactly what makes the
   Provenance Guarantee (§5.2 G2) enforceable. **The residual question for the founder is risk
   appetite:** the guarantee, the alerts and the free lookup all rest on endpoints GSA has not
   documented and could rename or authenticate without notice (KB risk K1). Recommendation: ship G2
   with the three-month cap until the corpus has run unbroken for one quarter, then widen it.
7. **Is the modification story sellable, or is it too subtle?** This is the biggest open question in the
   document. Post-verification the whole differentiation rests on a buyer caring that his contract
   locked modification 2 while sam.gov shows modification 4. He certainly cares if it costs him back
   wages; the question is whether he knows that before he is told. **Test it first** — it is
   LANDING_SPEC.md's A/B #1 candidate after the headline test, and it is the cheapest thing to learn.
8. **P8 in PREREQUISITES should be amended.** The api.data.gov key it asks the founder to obtain is not
   needed for wage determinations; it may still be needed for other SAM.gov data. Worth correcting so
   the founder does not chase a dependency the product does not have.
9. **P7 in PREREQUISITES should also be amended.** It asks the founder for an Anthropic API key for a
   "{{PRODUCT}} classification assistant" — the one feature this product refuses to build, on
   liability grounds, in three separate documents (`BACKLOG.md` "Never", `KNOWLEDGE_BASE.md` K5, G4
   above). **{{PRODUCT}} needs no model key at launch.** Leaving it on the founder's to-do list
   invites the feature back in wave 2, and PREREQUISITES is the document the founder reads.
   *(Wave-1b finding M19. `PREREQUISITES.md` belongs to the orchestrator, so this fleet records the
   correction here rather than making it.)*
