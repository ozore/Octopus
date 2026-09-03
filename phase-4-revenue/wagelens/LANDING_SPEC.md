# WageLens — Landing Page Specification

**Author:** Offer & Landing agent (WageLens), wave 1. **Date:** 2026-09-03.
**Reads with:** `OFFER.md` (the offer this page sells), `offer/RESEARCH.md` (every claim's source),
`KNOWLEDGE_BASE.md` (the live data path the demo runs on), `identity/contrast.py` (the authority for
every colour token named here).
**Governing evidence:** 79% of users scan rather than read and objective + concise + scannable measured
**+124%** usability ([NN/g](https://www.nngroup.com/articles/how-users-read-on-the-web/)); pages at a
5th–7th grade reading level convert at **11.1%** against **5.3%** at professional level, and word count
correlates **−18.6%** with conversion ([Unbounce](https://unbounce.com/conversion-benchmark-report/));
**"There should be only _one_ possible action for the visitor to take"**
([CXL](https://cxl.com/blog/how-to-build-a-high-converting-landing-page/)).

**Naming caveat.** `wagelens.com` is live and taken by an unrelated pay-equity SaaS
(identity agent, V6). This spec is **name-agnostic**: every occurrence of "WageLens" is the token
`{{PRODUCT}}`. Nothing here changes if the naming pass lands on CraftWage or another mark.

**Palette binding — updated 2026-09-03 after `IDENTITY.md` and `design-system.css` landed.** The
visual briefs in §6 were drafted against `identity/contrast.py`'s ramp names (`brick-700`,
`graphite-600`, `source-50` …). The shipped design system exposes those as **semantic custom
properties**, and the build must use the semantic name, never the ramp:

| Brief says | Use in code | Notes |
|---|---|---|
| canvas / surface / sunken | `--wl-canvas` · `--wl-surface` · `--wl-surface-sunken` · `--wl-surface-raised` | |
| ink-1 / ink-2 / ink-3 | `--wl-ink` · `--wl-ink-2` · `--wl-ink-3` | |
| brand, primary button | `--wl-brand` · `--wl-action-fill` / `-h` / `-a` · `--wl-action-ink` | |
| focus ring (two-tone) | `--wl-focus` · `--wl-focus-inner` · `--wl-focus-ring` | Two-tone by design — no single ink clears 3:1 on both canvas and the brick button |
| source chip (provenance) | `--wl-source-bg` · `--wl-source-ink` · `--wl-source-bd` · `--wl-source-dot` | The chip has a component in IDENTITY.md §11.7 (`.wl-source` / `.wl-prov`) — **use it, do not re-draw it** |
| filed / flag / reject status | `--wl-filed-*` · `--wl-flag-*` · `--wl-reject-*` | |
| grid rule / hairline / row stripe | `--wl-rule-grid` · `--wl-rule-hairline` · `--wl-row-stripe` | |
| field border, selection | `--wl-border-field` · `--wl-selected-edge` · `--wl-selected-bg` | |
| type, motion, space | `--wl-text-*` · `--wl-lh-*` · `--wl-dur-1..3` · `--wl-ease` · `--wl-space-1..10` · `--wl-measure` | Motion durations in §6 are intents; **bind them to `--wl-dur-*`** |

**Never hard-code a hex from this document.** `identity/contrast.py` remains the authority and runs in
CI.

**Convergence note.** `IDENTITY.md` §UA2 independently reaches this page's conclusion — "The
determination archive is versioned, and it tells you when your job's rate moves… nobody in Tier A–D
sells mid-project change alerting to the *sub*" — and §UA3 independently reaches the same verdict on
transparent pricing being "parity, not advantage" against the cheap transparent competitor. Two agents
arrived there from different evidence, which is the strongest signal in this fleet that the positioning
is right.

**Vocabulary correction from `PERSONA.md`.** The buyer's word — and the determination's own word — is
**modification**, not "revision" (PERSONA.md §vocabulary: *"wage determination (and WD number) … it is
a document with a number and a modification"*; the determination text prints "Modification Number").
**All customer-facing copy on this page says "modification".** "Revision" survives only where the
SAM.gov API field is literally `revisionNumber`.

---

## 1. The one job of this page

**Get a contractor to look up a rate for a county he already knows, be right, and then show him the
question he did not know to ask: *which revision of that determination does your contract actually
run on?***

Two moves, in that order, and the order is not negotiable.

- **The lookup earns the right to speak.** `OFFER.md` §2.2 scores Perceived Likelihood at 4/10 as the
  binding constraint, and the free lookup is the only element on the page the buyer can falsify
  himself. It is **not** a differentiator — at least two free Davis-Bacon lookups already exist, one of
  them our nearest competitor's (`offer/RESEARCH.md` §3.6). Ship it, be fast, be right, **never claim
  it is new.**
- **The revision is the sale.** 29 CFR 1.6 fixes the applicable determination at solicitation or award,
  so today's published rate is frequently not his rate; 29 CFR 5.5(a)(3)(ii)(G) makes him keep the
  records three years. No incumbent page fetched describes revision pinning or revision history. **V2,
  the Determination Timeline, is therefore the highest-value object on this page** — higher than the
  headline, because the headline can be A/B tested and this idea cannot be tested until it is drawn.

**Not** the job of this page: explaining Davis-Bacon, listing features, or arguing that compliance
matters. He knows. Every word spent teaching him his own business is a word that costs conversion.

---

## 2. Page angle and structure

**Chosen angle (RESEARCH.md §1.2, P1 "The Lookup"):** the hero *is* the product. The interactive
lookup sits above the fold, unauthenticated, and returns a real determination.

**Section order, and why it is this order.** CXL's anatomy is headline → subhead → hero visual →
benefit → proof → CTA; NN/g's F-pattern says "the first two paragraphs must state the most important
information." So the proof arrives *first*, as a working widget, and the argument follows it.

| # | Section | Budget | Draft copy, counted | Above pricing? |
|---|---|---:|---:|---|
| 1 | Hero (headline, sub, CTA, microcopy) | 55 | **55** ✅ | yes |
| 2 | **Rate Lookup** — the live widget | 70 | **70** ✅ | yes |
| 3 | What Friday costs — the 55-minute ledger | 55 | **53** ✅ | yes |
| 4 | How it works — three steps | 105 | **105** ✅ | yes |
| 5 | Proof — what you can check before you pay | 110 | **110** ✅ | yes |
| 6 | What we will not do | 45 | **43** ✅ | yes |
| | **Total above the pricing block** | **450** | **436** ✅ | yes |
| 7 | Pricing | 220 | — | no |
| 8 | FAQ (6 questions) | 320 | — | no |
| 9 | Footer + legal | 180 | — | no |
| | **Whole page** | **≈1,170** | — | |

**Budget rules.** The counts above exclude: the classification table the widget renders (that is data,
not copy), numbers inside the calculator, the pricing table's feature bullets (each ≤ 6 words, counted
inside the 220), and the rendered WH-347 artefact. **A section that exceeds its budget must cut, not
borrow.** Every heading and every bullet opens with an information-carrying word (NN/g).

---

## 3. Above the fold — wireframe

Desktop, 1440 × 900, at the initial viewport. Nothing below the dotted line is visible without
scrolling; the widget's *result* is designed to appear by pushing content down, not by navigation.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  {{PRODUCT}}                                            Pricing   FAQ   [ Sign in ]      │  56px bar
│  ─ a TheVillage company ─                                                                │  surface / hairline
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   Your county's Davis-Bacon rate, and                    ┌────────────────────────────┐  │
│   the WH-347 that goes with it.                          │  LOOK UP A RATE            │  │
│   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  H1, 44/48, ink-1     │                            │  │
│                                                          │  State                     │  │
│   See every classification, base rate and fringe         │  ┌──────────────────────┐  │  │
│   for your county — with the determination number        │  │ Texas             ▾  │  │  │
│   and a link to sam.gov — before you sign up.            │  └──────────────────────┘  │  │
│   Then let {{PRODUCT}} fill in Friday's form.            │  County                    │  │
│   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  18/28, ink-2          │  ┌──────────────────────┐  │  │
│                                                          │  │ Harris            ▾  │  │  │
│   ┌────────────────────────────────┐                     │  └──────────────────────┘  │  │
│   │  Show me my county's rates  →  │  primary, brick-700 │  Construction type         │  │
│   └────────────────────────────────┘                     │  ( ) Building              │  │
│                                                          │  ( ) Heavy   ( ) Highway   │  │
│   Free. No card, no login, no demo call.                 │  ( ) Residential           │  │
│   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  14/20, ink-3                 │  ┌──────────────────────┐  │  │
│                                                          │  │   Show the rates     │  │  │
│                                                          │  └──────────────────────┘  │  │
│                                                          └────────────────────────────┘  │
│                                                            ▲ V1 THE PROVENANCE CARD      │
│                                                              renders in place, below      │
│ · · · · · · · · · · · · · · · · · fold · · · · · · · · · · · · · · · · · · · · · · · · · │
│   ▼ scroll cue: "or see what a Friday costs"                                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**One action.** Both buttons do the same thing: the H1 button scrolls focus into the widget's State
field. "Sign in" is a text link in the bar, deliberately low-contrast, and is the only other
interactive target above the fold.

---

## 4. Headline — five options, and the choice

Judged on: does the first word carry information (F-pattern); is it at 5th–7th grade (Unbounce); does
it name the category so a stranger knows he is in the right place; and does it lead with **the rate**
rather than the form, which is the wedge established in RESEARCH.md §0-D2?

| # | Headline | Words | Verdict |
|---|---|---:|---|
| **H1** | **"Your county's Davis-Bacon rate, and the WH-347 that goes with it."** | 11 | **CHOSEN.** Opens on "Your county" — his, specific, information-carrying. Names both halves of the product in the buyer's own nouns ("Davis-Bacon", "WH-347"), which are the exact terms the prospect file's registers use. Leads with the rate. No adjective, no verb of praise, nothing to filter out — NN/g: "promotional language imposes a cognitive burden." |
| H2 | "Know the rate. File the form. Go home." | 8 | Best rhythm and lowest reading level of the five, and "Go home" is the true dream outcome. Rejected as the H1 because a cold visitor cannot tell what category he is in — fatal for outbound and paid traffic. **Keep as the outbound landing variant and as the pricing-block kicker.** |
| H3 | "Certified payroll, without guessing the rate." | 6 | Names the category and the differentiator in six words. Rejected because "guessing" puts the buyer's current behaviour in a slightly insulting light, and because it leads on the category (crowded) rather than the county (specific). **Keep as the meta description.** |
| H4 | "See your county's prevailing wage rate before you give us your email." | 11 | The strongest *offer*, which is why it is not the headline: it argues the transaction before establishing the subject. **Promoted to the hero microcopy and the primary CTA's supporting line.** |
| H5 | "The Davis-Bacon rate for every classification on your job, with its source." | 12 | Most precise and most defensible; also the most like a product description. Rejected as flat. **Keep as the Rate Lookup section heading** (trimmed to 8 words — §5.4). |
| **H6** | **"Free rate lookups are everywhere. The modification your contract locked is not."** | 12 | *Added after the verification pass.* The only option that leads with the differentiator instead of the category, and it disarms the competitor comparison in its own first clause. **Rejected as the default H1 on two grounds:** "revision" and "determination" are the exact 3-plus-syllable words Unbounce measures at **−24.3%** against conversion, and a cold visitor cannot tell from it what the product is. **But it is the strongest challenger**, and it replaces H2 as A/B test #1 (§13). If it wins, the page's whole hierarchy inverts and this document should be rewritten around it. |

**Chosen H1, final copy:**

> # Your county's Davis-Bacon rate, and the WH-347 that goes with it.

**Sub-headline** *(rewritten after verification — the headline carries comprehension, the sub carries
the differentiator, because the differentiator needs words the headline cannot afford):*

> See every classification, base rate and fringe for your county — then file a WH-347 that names the
> determination and modification it came from, in three years as well as this Friday.

*The dropped clause "before you sign up" is not lost: it is the microcopy, one line below.*

**Primary CTA:** `Show me my county's rates →`
**Widget CTA:** `Show the rates`
**Microcopy under the CTA:** `Free. No card, no login, no demo call.`
**Repeated CTA** at the foot of §5 and inside the pricing block (CXL: "duplicate the form or button at
the bottom of the page"), same label, same colour, never a second offer.

*Word count, §1: headline 11 + sub 31 + CTA 5 + microcopy 8 = **55**, exactly at budget.* ✅

---

## 5. The interactive demo — Rate Lookup

This is the single most important build item on the page, and it is buildable: `KNOWLEDGE_BASE.md` §F1
verifies the unauthenticated endpoints sam.gov's own front end uses, including permanently retrievable
superseded revisions.

### 5.1 Behaviour

| | |
|---|---|
| **Auth** | None. No login, no email, no card, no cookie wall. |
| **Inputs** | **State** (select, 50 + DC) → **County** (typeahead, populated from the SAM county dictionary for that state) → **Construction type** (radio: Building / Heavy / Highway / Residential). Three fields, in that order, because that is the order the determination itself is keyed on. |
| **Output** | Every active general determination matching state + county + type. For each: the WD number, modification number, publication date, and the classification table — classification name, base rate, fringe — grouped by rate group with the group's effective date, in the determination's own order. |
| **Provenance** | Every result carries a **source chip**: `WD {{ref}} · mod {{n}} · published {{date}}` linking to `sam.gov/wage-determination/{{ref}}/{{rev}}`. **A rate that cannot render its chip must not render at all** — enforced by a test in the build pipeline, the same rule the delivered Clausewright page enforces on policy citations. |
| **The notice, always shown** | *"This is the current determination. The one that governs your job is the one your contract incorporated — 29 CFR 1.6."* One line, `alert-info`, never dismissible. No competitor page fetched says this. |
| **Escalation** | Below the result, one line and one field: *"Want this on Friday's WH-347? Your first two Fridays are free."* + `Start free →`. Separately, a second, smaller offer: *"Email me when this determination changes"* → email, up to 3 saved determinations, free forever. |
| **The modification control — the part no competitor has** | Beside the modification number, one control: **`My contract locked an earlier one ▾`**. Choosing a modification re-renders the whole table at that modification (superseded revisions stay permanently retrievable, `KNOWLEDGE_BASE.md` KB-3) and draws **V2** beneath it, showing pinned against current and what moved between them. **This is the single interaction the page exists to produce.** |
| **Refusal** | If the county/type combination returns nothing, say so plainly — *"No active determination for that county and type."* — and link to sam.gov's own search. **Never guess a neighbouring county.** |
| **Never** | Suggest which classification a worker belongs in. Accept a job title and return a rate. Imply the rate is legal advice. |

### 5.2 Data path, caching and the fallback

- **Live:** our own `/api/wd/lookup`, reading the ingested corpus (`KNOWLEDGE_BASE.md`), **not** calling
  sam.gov from the browser. The public page never depends on a third party at request time.
- **Cache:** results are immutable for a given `(ref, rev)`; cache aggressively at the edge, keyed on
  state+county+type, invalidated by the nightly refresh job.
- **Fallback (demo only):** a shipped JSON snapshot of ~200 high-traffic determinations. If the corpus
  is unreachable, the widget serves the snapshot **and says so**: *"Showing a snapshot from
  {{date}} — check sam.gov for the current revision."* Stale-but-labelled, never broken, never silent.
- **Abuse:** rate-limit by IP; no key required; the whole corpus is public government data, so there is
  nothing to protect except our own bill.

### 5.3 The worked example the page ships with

Pre-filled on first paint so the widget is never an empty box, and replaced the instant the visitor
touches a field. Real data, verified in `kb-samples/sam-wd-detail-TX20260253-rev1.json`:

```
General Decision Number: TX20260253          Modification 1 · published 05/18/2026
State: Texas   ·   Construction Type: Building   ·   County: Harris

  ELEC0716-005  09/01/2025                            Rates            Fringes
  ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING
  AND INSTALLATION OF ALARMS) .....................$ 38.50             10.71
                                        [ WD TX20260253 · mod 1 · 05/18/2026 ↗ ]
```

### 5.4 Every string in this section, counted

| String | Copy | Words |
|---|---|---:|
| Section heading (H5, trimmed twice) | *Every rate, with its source.* | 5 |
| Field labels + control labels | `LOOK UP A RATE` · `State` · `County` · `Construction type` · `Building` · `Heavy` · `Highway` · `Residential` · `Show the rates` · **`My contract locked an earlier one`** | 21 |
| The standing notice | *This is the current determination. The one that governs your job is the one your contract incorporated — 29 CFR 1.6.* | 20 |
| Escalation | *Want this on Friday's WH-347? Two Fridays free.* + `Start free` | 10 |
| Alert capture | *Email me when this determination changes* | 6 |
| Empty result | *No active determination for that county and type.* + link to sam.gov's search | 8 |
| | **Total** | **70**, exactly at budget ✅ |

*Adding the revision control cost 6 words. They were paid for by cutting the section heading from 8 to
5 and the empty-result line from 10 to 8, not by raising the budget. The control is the differentiator;
the heading was decoration.*

The classification table the widget renders is **data, not copy**, and is excluded from the budget —
which is exactly why the education in this page can be dense without the page being wordy. The
revision control's label (`My contract locked an earlier one`) is counted inside the 15 control words.

### 5.5 What makes this lookup different from the free ones that already exist

**Stated here so no one builds the widget believing it is novel.** Verified 2026-09-03
(`offer/RESEARCH.md` §3.6): `certifiedpayrollpro.com/wage-lookup` is free, no-account, 50-state,
SAM.gov-sourced, with state-level change alerts; `prevailingwagelookup.com` is a second free lookup.

| | The free lookups that exist | This one |
|---|---|---|
| Current rates by state / county / type | ✅ | ✅ — **parity, claim nothing** |
| Free, no account | ✅ | ✅ — **parity** |
| **Pick an earlier modification and re-render at it** | not described anywhere | **✅ the differentiator** |
| **Modification history, drawn** | not described anywhere | **✅ V2** |
| **Alerts naming the classification that moved, with both modification numbers** | state-level: "when wage rates change in your state" | **✅** |
| Carries into a filed WH-347 that names its determination and modification | n/a — they are lookups | ✅ |

**Copy rule that follows:** the page may never say "free rate lookup" as though it were a feature.
It says *"look one up — everyone can, and you should check us against a county you know"*, and spends
its persuasion on the revision.

---

## 6. The five visuals

Each brief states: what it shows, the data it uses, how it moves, and its tokens. **Tokens are named,
never hexed** — `identity/contrast.py` is the authority and every pair below is one it already tests.
All five are **inline SVG or DOM**, no images, no icon fonts, no chart library.

---

### V1 — The Provenance Card *(the hero visual; it is the widget's result)*

- **Shows:** one determination rendered the way the determination itself prints it — the rate-group
  header with its effective date, the classification name wrapped exactly as SAM wraps it, the base
  rate and the fringe in two columns, and the source chip beneath. Deliberately typographic, not
  "designed": it must look like the document, because looking like the document *is* the proof.
- **Data:** live from `/api/wd/lookup`; the worked example above on first paint.
- **Motion:** rate rows fade in top-to-bottom, 40 ms apart, 120 ms each. The **source chip settles
  last**, 200 ms after the final row, with a 4 px rise. That ordering is the whole point — the number
  arrives, then its receipt. Respects `prefers-reduced-motion`: all rows appear at once.
- **Tokens:** card `surface` (graphite-0 light / graphite-900 dark); rate figures use the tested
  *"figure (rate) on sunken"* pair (graphite-800 on graphite-50 light; graphite-50 on graphite-1000
  dark) — the rate is the largest type on the page after the H1; classification names `ink-1`
  (graphite-900 / graphite-50); the rate-group header `ink-3` (graphite-600 / graphite-300);
  the column rules use *"payroll grid rule on surface"* (graphite-400 / graphite-500, tested at 3:1);
  the source chip uses the tested *"source chip (WD citation)"* pair — **source-700 on source-50**
  light, **source-300 on graphite-800** dark. **Source blue appears nowhere else on the page.** It is
  reserved for provenance, so that after ten seconds on the page blue *means* "this came from
  somewhere you can check."

---

### V2 — The Determination Timeline *(animated SVG)*

- **Shows:** the answer to the objection nobody else in the category addresses (`OFFER.md` §8 Q2). A
  horizontal axis for one WD number: a marker per revision (mod 0, mod 1, …), a **pin** on the revision
  the contract incorporated, and a bracket between the pin and the current revision labelled with what
  changed. Underneath, one sentence: *"Your contract locked mod {{n}}. Today's is mod {{m}}."*
- **Data:** real, from `…/wdol/v1/wd/{ref}/history`. For TX20260253 the history is mod 0 (2026-05-17)
  and mod 1 (2026-05-18). **Rule: the diagram renders whatever `/history` returns.** If only one
  revision exists, the pin and the current marker coincide and the caption says exactly that. **The
  build must select a shipped example WD with at least three revisions; if none is found in the corpus,
  the diagram ships with two and the caption is honest about it. No revision is ever invented.**
- **Motion:** on scroll into view, the axis draws left to right over 600 ms, markers pop in on arrival
  (80 ms each), the pin drops last, and the bracket between pin and current draws in 300 ms. Static
  under `prefers-reduced-motion`.
- **Tokens:** axis and markers `payroll grid rule` (graphite-400 / graphite-500); the pin and the
  divergence bracket `brick-600` (the tested *"selected row edge"* and *"focus ring"* value, ≥3:1 on
  canvas in both themes) — **brick is the brand and the pointer, never a status**; the caption `ink-2`
  (graphite-700 / graphite-200); revision labels use the source chip pair.

---

### V3 — The Friday Wall *(animated SVG)*

- **Shows:** the dream outcome made visible (`OFFER.md` §2.1 — the reward is an absence, so it has to
  be *drawn*). 52 squares, one per week of a year, for one project: filled = filed, amber = needs
  review, outlined = a week not yet worked. A month scale beneath. The point lands in under a second:
  *this is what a year looks like when nothing goes wrong.*
- **Data:** **none real.** This is an illustration and must carry the caption *"An example year. Your
  wall starts empty."* — the same discipline as the delivered Clausewright page's "An example
  rendering". **It must never be presented as a customer's data, and no count of customers, weeks or
  filings may be derived from it.**
- **Motion:** on scroll into view, squares fill left to right, 25 ms apart — 1.3 s for the year, which
  is the right length to feel like a year passing. Two squares are amber and resolve to filed at the
  end, because a wall with no exceptions is a lie about construction. Under `prefers-reduced-motion`
  the final state renders immediately.
- **Tokens:** filed squares `filed-400` light / `filed-300` dark with the tested *"status dot filed"*
  contrast; amber `flag-400` / `flag-300`; unworked weeks = `rule-hairline` outline (graphite-200 /
  graphite-800), no fill; month labels `ink-3`. **Green and amber are statuses and appear only here and
  in the product's own status pills** — never as decoration.

---

### V4 — The 55-Minute Ledger *(interactive figure)*

- **Shows:** what Friday costs *him*, computed from *his* numbers, in *his* browser. Three inputs —
  active covered projects, weeks worked a year, and what an hour of his office time costs — and two
  outputs: hours a year, and dollars a year. Beneath, the authority, quoted and linked: **"We estimate
  that it will take an average of 55 minutes to complete this collection of information"** — the public
  burden statement on the DOL's own WH-347 page, OMB Control No. 1235-0008.
- **Data:** the DOL's 55 minutes is the only constant. **Everything else is typed by the visitor.**
  This is deliberate, and it is the pattern the delivered Clausewright page already uses for its
  daily-loss counter: *we supply the government's number, he supplies his own, the arithmetic runs
  locally and nothing he types is sent anywhere.* It is the honest alternative to inventing an hourly
  rate, and it is also the only place on the page where a dollar figure appears that we did not source.
- **Motion:** the two output figures tick to their new value over 250 ms on every keystroke
  (`requestAnimationFrame`, no library). Under `prefers-reduced-motion` they snap.
- **Tokens:** input borders use the tested *"input border on canvas"* pair (graphite-400 /
  graphite-500 at 3:1); the two output figures use *"figure (rate) on sunken"*; the quoted burden
  statement sits in a `source` block — **source-700 on source-50** — because it is provenance, and its
  link goes to dol.gov.
- **Instrumentation note:** the inputs are *never* transmitted. The event we record is
  `ledger_used` with no values attached (§10).

---

### V5 — The Filled WH-347 *(a rendered artefact, not a picture of one)*

- **Shows:** the actual output. Page 1 of a WH-347 produced by the product from example data, rendered
  as HTML/SVG at document fidelity, and page 2 — the Statement of Compliance — revealed on scroll.
  This is the "real artefact" the proof block is allowed to contain.
- **Data:** example crew, real form. It must display the three things the buyer will check first, all
  verified against DOL's own instructions (identity agent, V8): the **rate written `$12.25/.40`**
  (base/fringe in the form's own notation), the **gross written `$163.00/$420.00`** (this project /
  all projects), and — the one that earns trust instantly — **the worker identifier showing the last
  four digits only**, because 29 CFR 5.5(a)(3)(ii)(B) requires that "Full Social Security numbers and
  last known addresses, telephone numbers, and email addresses must not be included on weekly
  transmittals", and an incumbent's paying users are on record hand-redacting this in Adobe every week.
  Caption: *"Example data. The form is real."*
- **Motion:** none on page 1 — it is a document and documents do not animate. Page 2 slides up 12 px
  and fades in when 30% visible, 250 ms. A single callout line points at the redacted identifier.
- **Tokens:** `surface` ground with a 1 px `rule-hairline` border and no shadow; all form text `ink-1`;
  the form's own rules `payroll grid rule`; the redaction callout `brick-600` with `ink-2` label.
  **Zero brand colour inside the document itself.** The form must look like the form.
- **Container:** the artefact is wider than a phone. It lives in its own `overflow-x: auto` region with
  a visible scroll affordance; **the page body never scrolls horizontally.**

---

## 7. Section copy and specifications

### §3 — What Friday costs *(budget 55)*

- **Heading:** `What Friday costs` (3)
- **Body:** *"The Department of Labor's own estimate for filling in one WH-347 is 55 minutes. Put in
  your jobs and your hourly cost — the arithmetic runs in your browser and nothing you type is sent
  anywhere."* (34)
- **V4 renders here.** Output labels: `hours a year`, `dollars a year` (6)
- **Closing line:** *"That is before anyone looks up a single rate."* (10)
- **Sub-total: 53.** ✅
- **Rule:** no dollar figure of ours appears in this section. The only number we assert is 55, and it
  is quoted with its source.

### §4 — How it works *(budget 105; three steps, ≈35 each)*

Value-based crossheads, not "Features" (Copyhackers). Each step opens on a verb or a noun that carries
information.

> **Step 01 — Find the rate, with its receipt**
> Pick your state, county and construction type. Every classification comes back with its base rate and
> fringe, the determination number, the modification and its publication date — and a link to it on
> sam.gov. (33)

> **Step 02 — Map your crew once**
> Put each worker against a classification from that determination. Add fringe. That mapping carries
> forward to next week and to the next job — you will not type it twice. (29)

> **Step 03 — Take Friday's form**
> Enter the week's hours. Download the WH-347 and the Statement of Compliance, with the last-four-only
> identifier the regulation requires already in place. When your determination is revised, we email
> you. (30)

- **Sub-total: bodies 33 + 29 + 30 = 92; crossheads 6 + 4 + 3 = 13. Section = 105.** ✅
- **Layout:** three columns desktop, stacked mobile. Step numerals in `ink-3`; crossheads `ink-1`;
  body `ink-2`. No icons — icons here would be decoration standing where evidence belongs.

### §5 — Proof: what you can check before you pay *(budget 110)*

**This section is governed by hard rules, not preference.**

**Allowed:**
- The live lookup (V1) — the visitor's own verification.
- The rendered WH-347 (V5), captioned "Example data. The form is real."
- The determination timeline (V2), rendering only revisions that exist.
- Quotations from 29 CFR and the DOL, verbatim, each linked to the source, each dated.
- Statements about what the product does and refuses to do.
- The guarantees from `OFFER.md` §5, worded exactly as written there.

**Forbidden, without exception:**
- **Testimonials.** We have no customers. None may be written, illustrated, or implied by a portrait,
  a company name, a star rating or a quotation mark.
- **Logos.** No customer logos, no "as seen in", no agency seals. **Explicitly: no DOL, SAM.gov or
  federal seal, mark or flag anywhere on the page** — using public data does not license the emblem
  and would imply an endorsement that does not exist.
- **Any rate, percentage or count about us:** accuracy rate, hours saved, customers, forms filed,
  uptime. Not until measured, and then only published with its denominator and method. The category is
  full of these — eMars: "50,000+ Users", "Reduce Time Managing Weekly Payroll by 80%"; eBacon's
  "16-20 hours"; Points North's unsourced penalty figures (RESEARCH.md §3.3) — and not making one is
  the differentiator.
- **The figure `$13,508`**, which does not appear in DOL's civil money penalty table (identity agent,
  V1). Barred from this page, the product, the ads and the outbound.
- Countdown timers, fake seat counts, or any urgency not sourced to a regulation.

**Copy:**

> **What you can check before you pay** (7)
> *Every rate on this page names the determination it came from, its modification number and its
> publication date, and links to it on sam.gov. Look up a county you already know. If a rate does not
> match the determination we cite, we refund what you have paid.* (47)
>
> **We have not published an accuracy rate.** (7) *Others advertise time savings and compliance rates.
> We will publish ours when it has been measured — with the number of determinations it was measured
> over and the method used — and not a day before.* (34)
>
> *No one can guarantee you will not be audited, or the outcome if you are.* (15)

- **Sub-total: 7 + 47 + 7 + 34 + 15 = 110.** ✅ V5 and V2 render inside this section.
- The refund sentence is **G2 from `OFFER.md` §5.2 in short form.** It ships only with the full
  guarantee behind it; until founder and legal sign off, this sentence is cut and the section runs at
  **93 words** (see §14).

### §6 — What we will not do *(budget 45)*

Hormozi's anti-guarantee, and per `OFFER.md` §2.2 lever 3 the strongest single trust move available.

> **What we will not do** (5)
> *We will not tell you which classification a worker belongs in, or sign your Statement of Compliance.
> Those are yours. We show the determination's classifications, flag work the list does not cover, and
> hand you the conformance route.* (38)

- **Sub-total: 43** against a budget of 45. ✅
- *(Drafting note: the first version of this paragraph ran to 46. "and we will not sign" → "or sign",
  and "flag work that is not on the list" → "flag work the list does not cover", brought it under
  budget without losing a clause. Recorded because the budget is the point of this document.)*

---

## 8. Pricing block *(budget 220, below the fold)*

**Kicker:** `Know the rate. File the form. Go home.` (H2, promoted here.)
**Lead line:** *"Published in full. No demo call, no setup fee, no per-report charge."* (11)

Three cards + the free tier as a fourth, narrower card on the left. Middle card (`Shop`) marked
**Recommended**, using `selected row edge` (brick-600 on brick-50) — not a colour fill, a 2 px edge.

| | Rate Lookup | Crew | **Shop** ⭐ | GC Roll-up |
|---|---|---|---|---|
| Price | **Free** | **$79**/mo | **$99**/mo | **$299**/mo |
| Annual | — | $790/yr | $990/yr | $2,990/yr |
| Projects | — | 3 active | **Unlimited** | Unlimited |
| Workers | — | 15 | 100 | Unlimited |
| Per-report fee | — | **None** | **None** | **None** |
| CTA | `Look up a rate` | `Start free` | `Start free` | `Start free` |

Feature bullets ≤ 6 words each, straight from `OFFER.md` §6.1.

**The comparison table, and the honesty clause.** Below the cards, the year-one comparison from
`OFFER.md` §6.2 at four active projects, with **"price not published"** rendered literally for the six
vendors that gate it. Then, in the same type size as everything else:

> *If you run one job at a time, LCPcertified's $12 a report and CertifiedPayrollPro's Starter plan can
> both come in under us — and doing it by hand costs no cash at all.* (34)

A comparison table that always wins is not believed by a man who has been quoted by four vendors.
**This line is not optional.**

**Trial line:** *"Your first two Fridays are free. Card on file, charged on day 15, cancel in two
clicks before then and you pay nothing."* (25)
**Guarantee line:** G1 and G3 from `OFFER.md` §5.2, verbatim. G2 links to a full guarantee page —
**and does not ship at all until the founder and a lawyer have signed it** (`OFFER.md` §11.3 Q1–Q2).

---

## 9. FAQ — six questions, no more *(budget 320)*

Six, drawn from the objection map (`OFFER.md` §8). Native `<details>`, first one open, all indexed in
the HTML so the answers are crawlable and readable with JavaScript off.

1. **How do I know the rate is right?** → provenance, sam.gov link, "look up a county you know", G2.
2. **My contract locked an older determination. Does that still work?** → 29 CFR 1.6, revision pinning,
   current-vs-pinned display. *(This is the answer that most distinguishes the page.)*
3. **Do you tell me how to classify a worker?** → No. The determination's classifications, the flag,
   the conformance route, SF-1444.
4. **Do you run my payroll?** → No. No tax filing, no direct deposit, no money moved. Keep your payroll
   company.
5. **Do you file California, Washington, New York or Illinois?** → Not at launch. Federal Davis-Bacon
   and WH-347, all 50 states (PLAN.md A11). Said here rather than discovered in week two.
6. **What happens to my records if I cancel?** → Two-click cancel, 30 days of download, Audit Binder
   export, three-year retention per 29 CFR 5.5(a)(3)(ii)(G).

**Not in the FAQ:** anything that is really an objection to the price. Q7 in the objection map belongs
in the pricing block next to the comparison table, where the buyer is already doing arithmetic.

---

## 10. Footer and legal *(budget 180)*

- **Identity:** `{{PRODUCT}}, a TheVillage company.` Entity name, **physical postal address** (P10) —
  required for the CAN-SPAM footer on outbound and for basic credibility here.
- **Disclaimer, on this page and on every product screen (PLAN.md A10):**
  > *{{PRODUCT}} shows published Davis-Bacon wage determinations with their sources and produces forms
  > from the hours you enter. It is not legal, tax or compliance advice, and it does not sign your
  > Statement of Compliance.*
- **Non-affiliation, stated plainly:**
  > *Not affiliated with, endorsed by, or acting for the U.S. Department of Labor, the General Services
  > Administration or SAM.gov. Wage determinations are published by the U.S. Government and are in the
  > public domain.*
- **Data provenance:** *"Wage determinations from SAM.gov, refreshed daily. Last refresh:
  {{timestamp}}."* — a live timestamp, wired to the ingestion job's last successful run
  (`kb_ingest_runs`). If the last run failed, this line says so. **A stale timestamp shown honestly is
  worth more than a fresh one that is wrong.**
- **Links:** Pricing · Guarantee · Privacy · Terms · Security · Accessibility · Data sources · Support.
- **Accessibility statement:** WCAG 2.1 AA target; `identity/contrast.py` runs in CI and fails the
  build on any pair below its required ratio.
- **Support:** the mailbox and the first-level auto-responder (PLAN.md A6). No live-chat widget — it is
  a third-party script, a performance cost, and an implicit promise of staffing we do not have.

---

## 11. Mobile

Contractors open this from a truck. Mobile is the primary design target, not an adaptation.

| | |
|---|---|
| **Order** | Hero (H1 + sub + CTA) → **widget, expanded, not collapsed** → V1 result → V4 ledger → How it works → Proof (V5 first, V2 second) → What we will not do → Pricing → FAQ → Footer |
| **Hero** | H1 drops to 32/36. The sub keeps all 31 words — it is the only place the offer is stated in full. The CTA is full-width. |
| **Widget** | Fields stack; State and County use the **native** select and a native-feeling typeahead, never a custom dropdown; construction type becomes a 2×2 segmented control. Minimum target 44 × 44 px. |
| **V1** | The two-column rate/fringe layout collapses to `classification` on one line, `$ 38.50 / 10.71` on the next in the form's own notation. The source chip goes full-width beneath. |
| **V2 timeline** | Rotates to **vertical**: revisions top to bottom, the pin on the left rail. Never a horizontally scrolling axis. |
| **V3 Friday Wall** | 52 squares in a 13 × 4 grid instead of 52 × 1. |
| **V5 WH-347** | Its own `overflow-x: auto` container with a visible edge fade and a "drag to see the whole form" hint. Page 2 is behind a `<details>` labelled "Statement of Compliance". **The page body never scrolls sideways.** |
| **Pricing** | Cards stack, `Shop` first (recommended, not middle), the comparison table in its own scroll container. |
| **Sticky CTA** | A single bar appears after the visitor passes V1 and disappears in the pricing block. One button, the same label. **No interstitial, no exit modal, no cookie wall over the content.** |

---

## 12. Performance budget

The page's whole argument is "we are the ones who are precise". A slow page contradicts it.

| Metric | Budget | Why |
|---|---|---|
| **LCP** | **≤ 2.0 s** on a Moto-G-class device, 4G throttle | The LCP element is the H1, which is text — it should be near-instant. If an SVG becomes the LCP element, the design is wrong. |
| **CLS** | **< 0.05** | The widget's result **pushes** content down; reserve its minimum height so the push is not a shift. |
| **INP** | **< 200 ms** | The lookup must feel like a lookup. |
| **First-view transfer** | **≤ 250 KB** total; **≤ 60 KB** CSS; **≤ 40 KB** JS (gzipped) | Everything above the fold is text, CSS and one inline SVG. |
| **Lookup payload** | ≤ 25 KB per determination | A determination averages ~17 KB of text and ~32 classifications (KNOWLEDGE_BASE.md); send parsed rows, not the raw document. |
| **Requests before interactive** | **≤ 8** | |
| **Third-party scripts** | **Zero.** | No tag manager, no chat, no A/B vendor, no font CDN. Analytics is our own `events` table (PLAN.md A14); an optional PostHog key loads **after** LCP and only if set. |
| **Fonts** | System stack first paint; at most **one** self-hosted family, `font-display: swap`, subset to Latin, preloaded, ≤ 30 KB WOFF2 | The form's numerals must be tabular — use a system tabular-figure feature rather than shipping a second face. |
| **Images** | **None.** | Every visual is inline SVG or DOM. No hero photo, no stock construction imagery, no icon font. |
| **JS off** | The page renders, reads and converts: headline, sub, all copy, the pricing table, the FAQ (native `<details>`), the rendered WH-347, and a link to sam.gov's own search in place of the widget. | |
| **CI gate** | Lighthouse ≥ 95 performance / 100 accessibility on the deployed preview; `identity/contrast.py` exit 0; a link-checker on every source URL on the page. | A dead citation on a page whose argument is citations is a build failure, not a content bug. |

---

## 13. Conversion instrumentation

**Primary metric:** **`trial_started` per unique visitor** — a trial with a card on file. It is the
only event on this page that predicts revenue, and it is the number `THRESHOLDS.md` should be judged
against.

**Leading indicator (watch daily, decide weekly):** **`lookup_completed` per unique visitor.** If
lookups are high and trials are low, the offer or the price is wrong. If lookups are low, the headline
or the traffic is wrong. **These two numbers separate the two failure modes**, which is the whole reason
to instrument at all.

All events land in our own `events` table (PLAN.md A14). No values from the ledger are ever
transmitted.

| Section | Event | Properties | What it tells us |
|---|---|---|---|
| Hero | `hero_viewed` | `variant` | Denominator |
| Hero | `hero_cta_clicked` | `variant` | Headline is doing its job |
| Rate Lookup | `lookup_started` | `field_first_touched` | Which of the three fields is the friction |
| Rate Lookup | **`lookup_completed`** | `state`, `construction_type`, `results_count`, `latency_ms` | **The leading indicator.** `state` also tells outbound where demand is. |
| Rate Lookup | `lookup_empty` | `state`, `county`, `construction_type` | A coverage gap, or a county-code bug (KB caveat: SAM county codes are not unique) |
| Rate Lookup | `source_chip_clicked` | `wd_ref`, `rev` | **The trust event.** Someone left to verify us. A high rate here is good news, not a leak. |
| Rate Lookup | `alert_email_captured` | `wd_ref` | The HVCO working |
| Ledger | `ledger_used` | **no values** | Engagement only. Never his numbers. |
| How it works | `how_step_viewed` | `step` | Where scroll dies |
| Proof | `wh347_artefact_expanded` | `page` | Is the artefact worth its weight |
| Proof | `timeline_viewed` | — | |
| Pricing | `pricing_viewed` | — | Scroll-depth denominator for price |
| Pricing | `plan_cta_clicked` | `tier`, `interval` | Tier mix before checkout — tells us if `Crew` is a decoy or a leak |
| Pricing | `comparison_table_viewed` | — | |
| FAQ | `faq_opened` | `question_id` | **The objection map, measured.** Whichever question opens most is the one that belongs higher on the page. |
| Checkout | **`trial_started`** | `tier`, `interval` | **Primary metric** |
| Checkout | `checkout_abandoned` | `tier`, `step` | |

**Hypotheses to be beaten, labelled as hypotheses** (no benchmark exists for this vertical —
RESEARCH.md gap G6; Unbounce's overall median is 6.6% across nine industries, none of them this one):

| Step | Hypothesis | Basis |
|---|---:|---|
| visit → `lookup_completed` | 25% | None. A guess, to be replaced by measurement in week one. |
| `lookup_completed` → `trial_started` | 6% | Below Poyar's 8% free-to-paid median, because a lookup is lighter than a trial. |
| `trial_started` → paid | 30% | Poyar: card-on-file trials convert at 30%. |
| **visit → paid** | **≈0.45%** | Product of the above. **If this is materially wrong the fault is almost certainly the first row.** |

**One A/B test at a time, one variable, pre-registered** (`PIPELINE.md` stage 6). Re-ordered after the
verification pass, because the question worth answering changed:

1. **H1 vs H6** — category-first ("Your county's Davis-Bacon rate…") against differentiator-first
   ("Free rate lookups are everywhere. The modification your contract locked is not."). **This is now the
   most valuable test on the page**, because it measures whether the buyer already feels the
   contract-lock problem or has to be taught it — the open question in `OFFER.md` §11.3 Q7. Judge on
   `lookup_completed`, not on `hero_cta_clicked`.
2. **V2 above the fold vs below it.** If the revision story is the sale, its diagram may not belong in
   the proof block at all.
3. Widget pre-filled with the worked example vs empty.

Nothing else is tested until `lookup_completed` has n ≥ 100. **Add one event for test 1:**
`modification_pin_used` (`wd_ref`, `from_mod`, `to_mod`) — the direct measure of whether the differentiator
is understood. If `lookup_completed` is healthy and `modification_pin_used` is near zero, the offer's
differentiation is not landing and `OFFER.md` §11.3 Q7 has its answer.

---

## 14. Build checklist

- [ ] Word count above the pricing block ≤ 450, verified by a script in CI
- [ ] Reading level checked; target 5th–7th grade (Unbounce)
- [ ] Every rate on the page renders a source chip, or does not render — enforced by a test
- [ ] Every source URL on the page link-checked in CI
- [ ] No testimonial, no logo, no seal, no accuracy claim, no `$13,508`
- [ ] `identity/contrast.py` exits 0; every token used here is one it tests
- [ ] `prefers-reduced-motion` honoured by V1, V2, V3, V4
- [ ] Page usable with JavaScript off
- [ ] Body never scrolls horizontally at 320 px
- [ ] Disclaimer and non-affiliation present; data-refresh timestamp wired to `kb_ingest_runs`
- [ ] All events in §13 firing into the `events` table; zero third-party scripts
- [ ] G2 **absent** from the page until founder + legal sign-off (`OFFER.md` §11.3); with it cut, §5
      runs at **93 words** and the page total at **419**
- [ ] Customer-facing copy says "modification", never "revision" (PERSONA.md vocabulary)
- [ ] No copy anywhere claims the free lookup is new, unique or unavailable elsewhere (§5.5)
- [ ] The modification control ships in v1 — without it the page has no differentiator (§1, §5.5)
- [ ] `{{PRODUCT}}` resolved by the naming pass before launch (P11); `wagelens.com` is taken (V6)
