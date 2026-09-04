# {{PRODUCT}} — Landing Page Specification

**Author:** Offer & Landing agent ({{PRODUCT}}), wave 1. **Date:** 2026-09-03.
**Revised:** 2026-09-03 (wave-1b iteration — findings B2, B5, B6, B8, B9, M11, M13, M14, M16, M18,
m10; changelog in `REVIEW_RESPONSE.md`). **Word count above the pricing block: 445 / 450.**
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
question he did not know to ask: *which modification of that determination does your contract actually
run on?***

Two moves, in that order, and the order is not negotiable.

- **The lookup earns the right to speak.** `OFFER.md` §2.2 scores Perceived Likelihood at 4/10 as the
  binding constraint, and the free lookup is the only element on the page the buyer can falsify
  himself. It is **not** a differentiator — at least two free Davis-Bacon lookups already exist, one of
  them our nearest competitor's (`offer/RESEARCH.md` §3.6). Ship it, be fast, be right, **never claim
  it is new.**
- **The modification is the sale.** 29 CFR 1.6 fixes the applicable determination at solicitation or award,
  so today's published rate is frequently not his rate; 29 CFR 5.5(a)(3)(ii)(G) makes him keep the
  records three years. No incumbent page fetched describes modification pinning or modification history. **V2,
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
| 2 | **Rate Lookup** — the live widget | 83 | **83** ✅ | yes |
| 3 | What Friday costs — the 55-minute ledger | 53 | **53** ✅ | yes |
| 4 | How it works — three steps + the Friday line | 117 | **117** ✅ | yes |
| 5 | Proof — what you can check before you pay | 94 | **94** ✅ | yes |
| 6 | What we will not do | 43 | **43** ✅ | yes |
| | **Total above the pricing block** | **450** | **445** ✅ | yes |
| 7 | Pricing | 220 | — | no |
| 8 | FAQ (6 questions) | 320 | — | no |
| 9 | Footer + legal | 180 | — | no |
| | **Whole page** | **≈1,170** | — | |

**Budget rules.** The counts above exclude: the classification table and the candidate list the
widget renders (that is data, not copy), numbers inside the calculator, form input labels, the
pricing table's feature bullets (each ≤ 6 words, counted inside the 220), and the rendered WH-347
artefact. **A section that exceeds its budget must cut, not borrow.** Every heading and every bullet
opens with an information-carrying word (NN/g).

**The counting convention, written down so the CI script and this table cannot disagree.** A word is
a whitespace-separated token containing at least one letter or digit. Therefore: hyphenated and
slashed terms count **once** (`WH-347`, `last-four-only`, `Davis-Bacon`, `5.5(a)(3)(ii)(G)`);
em-dashes and standalone punctuation count **zero**; `29 CFR 1.6` counts **three**; `$99` counts
**one**. **Step numerals (`Step 01`, `Step 02`, `Step 03`) are layout chrome and are not counted** —
they are rendered in `ink-3` as ordinals, and §4's crossheads are counted from the words after them
(6 + 4 + 3 = 13). Button labels and standing notices **are** copy and **are** counted; field labels
on the widget and the ledger are controls and are **not**. *(Added 2026-09-03: the wave-1b
re-budget needed the rule stated, because a script that counted the step numerals would have read
451 against a table saying 445 and failed a green build.)*

> **Re-budgeted 2026-09-03 (wave-1b iteration). The total is unchanged at 450 and the page came
> down from 436 to 445 — still under, with the review's required additions paid for line by line
> rather than by raising the ceiling.** What moved and why:
>
> | section | was | now | what changed |
> |---|---:|---:|---|
> | §2 Rate Lookup | 70 | **83** | +12 the ambiguous-result line the hero visual had no state for (**M14**); +6 the watch consent label the free alert was promised without (**B5**); +3 the trial disclosure on the escalation CTA (**B9**); **−5** by trimming the standing notice's first sentence, which restated the heading; **−3** by folding the watch capture's heading into its own consent label, so the form has one string instead of two |
> | §3 | 55 | **53** | Budget lowered to the copy that was already written. It never used its 55. |
> | §4 How it works | 105 | **117** | +12 for the one line addressed to the person who actually does this on Friday (**M18**) |
> | §5 Proof | 110 | **94** | **G2's refund sentence is cut from the page unconditionally** until the founder *and* counsel sign the wording (**B8**, `OFFER.md` §11.3 Q2), so the section is budgeted as it ships. Its replacement wording — 29 words, cap inside the sentence — is written out in §7 §5 below so nobody re-drafts it from memory. **If G2 is ever approved, those 29 words must be paid for by cutting 29 words from §1–§6, not by raising this total.** |
>
> The build checklist's CI script counts the page **as it ships**, so 445 is the number it asserts.

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
│   for your county — then file a WH-347 that names        │  │ Texas             ▾  │  │  │
│   the determination and modification it came from,       │  └──────────────────────┘  │  │
│   in three years as well as this Friday.                 │  County                    │  │
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
│                                                              renders in place, below —    │
│                                                              or V1b, THE CANDIDATE LIST,  │
│                                                              on the 1-in-8 ambiguous case │
│ · · · · · · · · · · · · · · · · · fold · · · · · · · · · · · · · · · · · · · · · · · · · │
│   ▼ scroll cue: "or see what a Friday costs"                                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Redrawn 2026-09-03 (wave-1b iteration, finding M13).** The wireframe carried a **different**
> sub-headline from §4's chosen copy — *"…before you sign up. Then let {{PRODUCT}} fill in Friday's
> form."* — which is 34 words and would have put the hero at **58 against a 55 budget**. The build
> copies the picture, so the picture now carries §4's final 31-word sub verbatim. The dropped
> clause "before you sign up" survives where it always belonged: the microcopy under the CTA.

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
| **H6** | **"Free rate lookups are everywhere. The modification your contract locked is not."** | 12 | *Added after the verification pass.* The only option that leads with the differentiator instead of the category, and it disarms the competitor comparison in its own first clause. **Rejected as the default H1 on two grounds:** "modification" and "determination" are the exact 3-plus-syllable words Unbounce measures at **−24.3%** against conversion, and a cold visitor cannot tell from it what the product is. **But it is the strongest challenger**, and it replaces H2 as A/B test #1 (§13). If it wins, the page's whole hierarchy inverts and this document should be rewritten around it. |

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
| **The notice, always shown** | *"The determination that governs your job is the one your contract incorporated — 29 CFR 1.6."* One line, `alert-info`, never dismissible. No competitor page fetched says this. *(Trimmed from 20 words to 15 in the wave-1b re-budget — the dropped first sentence, "This is the current determination", restated the source chip directly above it.)* |
| **Ambiguity — the 1-in-8 case, designed** | When the county and type return **more than one** determination, **V1b** renders instead of V1: the candidate list, no default selected, with one line of copy — *"Several determinations cover this county. Your contract names the one that governs."* This is not an edge case: `KNOWLEDGE_BASE.md` **F3** measures **1,483 of 12,185 combinations — 12.17%** as ambiguous, and `specs/WL-00` V4 requires the public surface to show candidates exactly as the app does. *(Added 2026-09-03, finding M14.)* |
| **Escalation** | Below the result, one line and one control: *"Want this on Friday's WH-347? Two Fridays free, then $99."* + **`Start 14-day trial →`**. **Never `Start free`** — the trial takes a card and charges on day 15, and a CTA that hides that is the negative-option problem `specs/WL-09` V16a exists to prevent *(finding B9)*. Separately and smaller, the consented watch: one checkbox, **unticked**, labelled *"Email me when DOL modifies this determination."* + `Watch it`, up to 3 per address, confirmed from a link — mechanics in **`specs/WL-14`** *(finding B5)*. |
| **The modification control — the part no competitor has** | Beside the modification number, one control: **`My contract locked an earlier one ▾`**. Choosing a modification re-renders the whole table at that modification and draws **V2** beneath it, showing pinned against current and what moved between them. **This is the single interaction the page exists to produce.** It is buildable as of this iteration and not before: `specs/WL-13` now ingests `/history` and superseded revisions on demand, with a launch backfill for the determinations this page ships with, so the control reads **our corpus** rather than a property of SAM.gov we do not hold *(finding B4)*. The options are exactly the rows in `kb_wd_modifications` — **never invented**; a determination with one modification shows one option and says so. |
| **Refusal** | If the county/type combination returns nothing, say so plainly — *"No active determination for that county and type."* — and link to sam.gov's own search. **Never guess a neighbouring county.** |
| **Never** | Suggest which classification a worker belongs in. Accept a job title and return a rate. Imply the rate is legal advice. |

### 5.2 Data path, caching and the fallback

- **Live:** our own `/api/wd/lookup`, reading the ingested corpus (`KNOWLEDGE_BASE.md`), **not** calling
  sam.gov from the browser. The public page never depends on a third party at request time.
- **Cache:** results are immutable for a given `(ref, mod)`; cache aggressively at the edge, keyed on
  state+county+type, invalidated by the nightly refresh job.
- **When the corpus is unreachable: fail closed.** The honest error and a link to sam.gov's own
  search — *"We can't reach our determination data right now. Search SAM.gov directly →"* — and
  **no rate of any kind on the page.** `specs/WL-00` V9 and its Errors table are the rule; this
  document follows them.

  > **The shipped-JSON-snapshot fallback is deleted (2026-09-03, finding M16, decision D8).** This
  > spec used to serve ~200 cached determinations, labelled, when the corpus was down. Two bullets
  > above, it says the widget reads **our own database** and never a third party at request time —
  > so "unreachable" does not mean SAM.gov is down, it means **we** are down. Serving a rate whose
  > current source we cannot confirm, during our own outage, is precisely the fact pattern
  > `OFFER.md` §5.2 G2 refunds on. **An honest error costs one visitor; a stale rate costs a
  > customer's payroll.** There is no snapshot file to build, ship or keep fresh.
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
| The standing notice *(trimmed, −5)* | *The determination that governs your job is the one your contract incorporated — 29 CFR 1.6.* | 15 |
| **Ambiguous result (new, M14)** | *Several determinations cover this county. Your contract names the one that governs.* | 12 |
| Escalation *(+3, B9)* | *Want this on Friday's WH-347? Two Fridays free, then $99.* + `Start 14-day trial` | 13 |
| **Watch capture — one string, the consent label itself** *(+3 net, B5)* | *Email me when DOL modifies this determination.* + `Watch it` | 9 |
| Empty result | *No active determination for that county and type.* + link to sam.gov's search | 8 |
| | **Total** | **83**, exactly at the re-budgeted figure ✅ |

*What the 13 new words bought, and what paid for them.* The **ambiguous-result line (12)** closes
M14: one visitor in eight meets several determinations, and before this the page's most important
element had no state for it. The **escalation's `then $99` and `Start 14-day trial` (+3)** close B9:
a CTA that leads to a card must say so. The **watch consent label (+3 net)** closes B5: an email
address collected on a public page needs a ticked box and a named purpose. **They were paid for by
trimming the standing notice's first sentence (−5), which restated the source chip immediately above
it, and by folding the watch capture's heading into its own checkbox label (−3), so the form carries
one string where it used to carry two.** Only 5 net words came out of the section's budget.

The classification table and the candidate list's data — WD numbers, dates, county lists,
classification counts — are **data, not copy**, and are excluded from the budget, which is exactly
why the education on this page can be dense without the page being wordy. The modification control's
label (`My contract locked an earlier one`) is counted inside the 21 control words.

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
its persuasion on the modification.

---

## 6. The visuals — five, plus the ambiguity state V1 never had

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

### V1b — The Candidate List *(the ambiguous result; added 2026-09-03, finding M14)*

**Why it exists.** V1's brief described *"one determination"*, and the H1 promises *"your county's
Davis-Bacon rate"* — singular. But `KNOWLEDGE_BASE.md` **F3** measures **1,483 of 12,185
(state, county, construction type) combinations — 12.17%** as mapping to more than one active
determination; Harris County "Heavy" maps to three. **Without V1b, one visitor in eight meets an
undesigned screen on the page's most important element, and the headline's singular promise is
contradicted at first click.** `specs/WL-00` V4 already required this — *"the public surface must
not be more confident than the product"* — and the page did not have it.

- **Shows:** the candidates, side by side, **with no default selected**, each row carrying: the WD
  number, the construction type, the modification number, the publication date, **the county list —
  which is the discriminator, and the reason there is more than one** — and the classification
  count. Above them, one line: *"Several determinations cover this county. Your contract names the
  one that governs."* Choosing one renders V1 for it, in place.
- **Data:** live from `/api/wd/lookup`. Harris / Heavy returns TX20260031, TX20260033 and
  TX20260034 — the worked ambiguous example, and the same fixture `specs/WL-02`'s and `WL-00`'s
  acceptance criteria use.
- **Motion:** rows fade in together, not staggered. **No row is highlighted, ordered by
  "likelihood", or marked "recommended".** There is no heuristic in the codebase and there must not
  be one on the page — `specs/WL-02` V6 forbids it in the product and the same rule holds here.
- **Tokens:** rows on `surface` separated by `rule-hairline`; the county list in `ink-2` because it
  is the thing being compared; WD numbers and modification numbers in the tested *source chip*
  pair; the selected row uses `selected row edge` (brick-600, 2 px) — **an edge, never a fill**, and
  only after the visitor chooses.
- **Rule:** the disambiguating line is copy and is counted in §2's 83 (12 words). Everything else in
  the list is data and is not.

---

### V2 — The Determination Timeline *(animated SVG)*

- **Shows:** the answer to the objection nobody else in the category addresses (`OFFER.md` §8 Q2). A
  horizontal axis for one WD number: a marker per modification (mod 0, mod 1, …), a **pin** on the
  modification the contract incorporated, and a bracket between the pin and the current modification
  labelled with what
  changed. Underneath, one sentence: *"Your contract locked mod {{n}}. Today's is mod {{m}}."*
- **Data:** real, **from our own `kb_wd_modifications`**, which `specs/WL-13`'s `kb.fetch_history`
  job populates from `…/wdol/v1/wd/{ref}/history`. For TX20260253 the history is mod 0 (2026-05-17)
  and mod 1 (2026-05-18). **Rule: the diagram renders whatever the corpus holds, and the corpus
  holds whatever `/history` returned.** If only one modification exists, the pin and the current
  marker coincide and the caption says exactly that. **The build must select a shipped example WD
  with at least three modifications; if none is found in the corpus, the diagram ships with two and
  the caption is honest about it. No modification is ever invented.**

  > **This visual was unbuildable as specified until the wave-1b iteration (finding B4).** The
  > corpus ingested `is_active=true` only and never called `/history`, so "real, from `/history`"
  > described a network call the product does not make at request time — while §5.2 two screens up
  > correctly says the page never depends on a third party at request time. `specs/WL-13` now
  > ingests history on demand **and runs a launch backfill over exactly the determinations this
  > page ships with**, so V2 has data on the first paint of the first deploy. **Do not build this
  > diagram against a live SAM.gov call.**
- **Motion:** on scroll into view, the axis draws left to right over 600 ms, markers pop in on arrival
  (80 ms each), the pin drops last, and the bracket between pin and current draws in 300 ms. Static
  under `prefers-reduced-motion`.
- **Tokens:** axis and markers `payroll grid rule` (graphite-400 / graphite-500); the pin and the
  divergence bracket `brick-600` (the tested *"selected row edge"* and *"focus ring"* value, ≥3:1 on
  canvas in both themes) — **brick is the brand and the pointer, never a status**; the caption `ink-2`
  (graphite-700 / graphite-200); modification labels use the source chip pair.

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

- **Shows:** what Friday costs *this company*, computed from *its* numbers, in *its* browser. Three
  inputs — `active covered projects`, `weeks worked a year`, and **`what an hour of office time
  costs you`** — and two outputs: hours a year, and dollars a year. *(The third label used to read
  "what an hour of **his** office time costs". That hour is the office manager's, and `PERSONA.md`
  §1.2 calls her "the single most important human in this product". Changed 2026-09-03, finding
  M18. Input labels are controls, not body copy, and are not counted in §3's 53.)* Beneath, the
  authority, quoted and linked: **"We estimate
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
> identifier the regulation requires already in place. When your determination is modified, we email
> you. (30)

**Beneath the three steps, one line, set apart:**

> *The person who does this on Friday afternoon types the week once.* (12)

- **Sub-total: bodies 33 + 29 + 30 = 92; crossheads 6 + 4 + 3 = 13; the Friday line 12.
  Section = 117.** ✅
- **Layout:** three columns desktop, stacked mobile. Step numerals in `ink-3`; crossheads `ink-1`;
  body `ink-2`. The Friday line sits full-width under the three columns, in `ink-1`, one size up
  from the body — it is a sentence, not a caption. No icons — icons here would be decoration
  standing where evidence belongs.

> **Why that twelfth line exists (finding M18).** The offer and this page speak almost entirely to
> the owner. `PERSONA.md` §1.2 says the office manager is *"the single most important human in this
> product… She is buying **Friday back**"*, §5.2 says *"owner signs; **office manager vetoes**"*,
> and §14 is written in her voice. Nothing on the page was addressed to her. Twelve words, in the
> section that describes the work, name the person who does it — and PERSONA's own instruction is
> "sell to the owner; make the office manager the hero". This costs 12 of the page's 14 remaining
> words and buys the veto vote. *(The review offered §4 Step 03 or the pricing kicker; §4 was
> chosen because a reader who bounces before pricing should still have met her.)*

### §5 — Proof: what you can check before you pay *(budget 110)*

**This section is governed by hard rules, not preference.**

**Allowed:**
- The live lookup (V1) — the visitor's own verification.
- The rendered WH-347 (V5), captioned "Example data. The form is real."
- The determination timeline (V2), rendering only modifications that exist.
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

**Copy — as it ships:**

> **What you can check before you pay** (7)
> *Every rate on this page names the determination it came from, its modification number and its
> publication date, and links to it on sam.gov. Look up a county you already know.* (31)
>
> **We have not published an accuracy rate.** (7) *Others advertise time savings and compliance rates.
> We will publish ours when it has been measured — with the number of determinations it was measured
> over and the method used — and not a day before.* (34)
>
> *No one can guarantee you will not be audited, or the outcome if you are.* (15)

- **Sub-total: 7 + 31 + 7 + 34 + 15 = 94.** ✅ V5, V2 and (on an ambiguous lookup) V1b render inside
  this section.

### The refund sentence — cut, and the wording it must carry if it ever ships

> **⚠ Changed 2026-09-03 (wave-1b iteration, finding B8).** This section used to end its first
> paragraph with *"If a rate does not match the determination we cite, **we refund what you have
> paid**."* — **the short form of G2 with the cap dropped**, which turns a bounded twelve-month
> refund into an **unbounded promise on the page a court would read.** `OFFER.md` §5.2 G2 says
> "up to twelve months" (now three) and records the founder-liability figure beside it. A guarantee
> sentence that contradicts the guarantee page is worse than no guarantee — that is `OFFER.md`
> §5.1's own argument, applied to itself.
>
> **Two things were done.** (1) **The sentence is cut from the page, unconditionally**, until the
> founder *and* counsel sign the wording (`OFFER.md` §11.3 Q1–Q2). §14's checklist item is no
> longer "pending"; it is a hard gate. (2) **The wording it must carry if it ever ships is written
> out here, so nobody re-drafts it from memory** — with the cap **inside the same sentence**, which
> is the entire point of a short form existing:
>
> > *"If a rate does not match the determination we cite, we refund the months you paid since that
> > rate appeared, **up to three**, and re-issue the corrected forms free."* (29)
>
> **Rule: no refund sentence appears anywhere on this page — hero, proof, pricing, FAQ, footer —
> without its cap in the same sentence.** A CI grep pairs "refund" with "up to three" in every
> user-facing string. And if G2 is approved, those **29 words must be paid for by cutting 29 words
> from §1–§6**; the 450 total does not move to accommodate a guarantee.
>
> **The cap number is three months** — the option that reduces founder liability, ≈$59,400 rather
> than ≈$237,600 in the correlated worst case at 200 accounts. **The founder can override to
> twelve**, and if they do, the number changes here, in `OFFER.md` §5.2 and in `UX.md` §11 **in one
> edit**. Editing one of the three is how this finding happened.

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

Three cards + the free tier as a fourth, narrower card on the left. `Shop` marked **Recommended**,
using `selected row edge` (brick-600 on brick-50) — not a colour fill, a 2 px edge.

| | Rate Lookup | Crew | **Shop** ⭐ | GC Roll-up |
|---|---|---|---|---|
| Price | **Free** | **$79**/mo | **$99**/mo | **$299**/mo |
| Annual | — | $790/yr | $990/yr | $2,990/yr |
| Projects | — | 3 active | **Unlimited** | *will be unlimited* |
| Workers | — | 15 | 100 | *will be unlimited* |
| Per-report fee | — | **None** | **None** | **None** |
| Status | live | live | live | **Coming** |
| CTA | `Look up a rate` | **`Start 14-day trial`** | **`Start 14-day trial`** | **`Join the list`** |

Feature bullets ≤ 6 words each, straight from `OFFER.md` §6.1. **The GC card's bullets are in the
future tense** — "will collect every sub's payroll", "will check every week", "will assemble the
prime's pack" — because none of them exists yet.

> **⚠ Two changes, 2026-09-03 (wave-1b iteration).**
>
> **(B2) The GC card is a waitlist, not a purchase.** It carried a live `Start free` CTA while
> `WL-24` — sub seats, weekly collection, the per-sub status board — is a **Should** with a demand
> trigger attached, and `specs/WL-09` itself said the tier is *"sellable only when WL-24 ships"*.
> Taking $299/month for named features that do not exist is misrepresentation with a refund and a
> chargeback behind it. The card now shows **"Coming"**, future-tense bullets, and one control: an
> email field and `Join the list`, which emits **`gc_tier_interest {plan:'gc', surface:'landing'}`**
> and captures the address under `specs/WL-14`'s consent rules (unticked box, confirmation, one-click
> unsubscribe). **There is no Checkout path to reach it** — `specs/WL-09` V17–V19 make that a
> property of the code, not of this copy. The demand signal is what BACKLOG's own WL-24 trigger asks
> for anyway.
>
> **(B9) No paid CTA reads "Start free".** A card-on-file trial that auto-charges on day 15 is a
> negative-option offer; the label must disclose the trial, and the terms must be disclosed in full
> before the card. Every paid CTA on this page — here, and the lookup escalation in §5.4 — reads
> **`Start 14-day trial`**, and the trial line below sits **above** the cards' CTAs rather than
> beneath the table where it used to be. The **free Rate Lookup card keeps `Look up a rate`** and
> its "no card, no login" microcopy, because that one is genuinely free.

**The comparison table, and the honesty clause.** Below the cards, the year-one comparison from
`OFFER.md` §6.2 at four active projects, with **"price not published"** rendered literally for the six
vendors that gate it. Then, in the same type size as everything else:

> *If you run one job at a time, LCPcertified's $12 a report and CertifiedPayrollPro's Starter plan can
> both come in under us — and doing it by hand costs no cash at all.* (34)

A comparison table that always wins is not believed by a man who has been quoted by four vendors.
**This line is not optional.**

**Trial line — placed directly above the cards' CTAs, not below the table:** *"Your first two
Fridays are free. Card on file, $99 charged on day 15, cancel in two clicks before then and you pay
nothing."* (26) *(B9: the terms belong where the button is, not in a line the visitor has already
scrolled past. The full disclosure block — exact amount, exact date, renewal interval, how to
cancel, the reminder — renders at `/billing/start` immediately above the button, with a required
unticked consent checkbox; `specs/WL-09` V14–V15 own it.)*

**Kicker line, under the comparison table:** *"The person who does this on Friday afternoon is the
one who has to trust it."* — the pricing-block half of M18. Counted inside the 220, not in the 450.

**Guarantee line:** G1 and G3 from `OFFER.md` §5.2, verbatim. **G2 does not ship at all until the
founder and a lawyer have signed it** (`OFFER.md` §11.3 Q1–Q2) — and when it does, it carries its
**three-month cap in the same sentence**, here and on the guarantee page it links to (B8).

---

## 9. FAQ — six questions, no more *(budget 320)*

Six, drawn from the objection map (`OFFER.md` §8). Native `<details>`, first one open, all indexed in
the HTML so the answers are crawlable and readable with JavaScript off.

1. **How do I know the rate is right?** → provenance, sam.gov link, "look up a county you know".
   **G2 is not referenced here while it is cut from the page** (B8) — an FAQ that promises a refund
   the page does not carry is the same defect one screen down.
2. **My contract locked an older determination. Does that still work?** → 29 CFR 1.6, **modification**
   pinning, current-vs-pinned display. *(This is the answer that most distinguishes the page. It is
   also now buildable end to end: `specs/WL-02` pins an explicitly named superseded modification and
   `specs/WL-13` ingests it — findings B3 and B4.)*
3. **Do you tell me how to classify a worker?** → No. The determination's classifications, the flag,
   the conformance route, SF-1444.
4. **Do you run my payroll?** → No. No tax filing, no direct deposit, no money moved. Keep your payroll
   company.
5. **Do you file California, Washington, New York or Illinois?** → Not at launch. Federal Davis-Bacon
   and WH-347, all 50 states (PLAN.md A11). Said here rather than discovered in week two.
6. **What happens to my records if I cancel?** → Two-click cancel, **30 days** of readable,
   downloadable history, the **Audit Binder** export — *one archive: every WH-347, every Statement
   of Compliance, the determination as it stood, and a source-and-date manifest* — and the
   three-year retention duty under 29 CFR 5.5(a)(3)(ii)(G), which is yours. *(m10 / M9: "Audit
   Binder" is now the one name for this artefact across `OFFER.md` B4, this page, `specs/WL-07` and
   the product, and it is an **archive**, not "a single PDF" — which is what WL-07 actually
   produces. The 30 days is the same number in `OFFER.md` G3, `specs/WL-09` V6 and `UX.md` §11.)*

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
| **V2 timeline** | Rotates to **vertical**: modifications top to bottom, the pin on the left rail. Never a horizontally scrolling axis. |
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
| **Fonts** | **Two self-hosted WOFF2 subsets, ≤ 45 KB total**, `font-display: swap`, subset to Latin, both preloaded. **No font CDN** — no `fonts.googleapis.com` link, no `fonts.gstatic.com` preconnect. The mono face is confined to where `IDENTITY.md` §7.3 makes it load-bearing: **V1's rate figures and V5's rendered WH-347**, and nowhere else. | *(Changed 2026-09-03, finding M11, decision D11.)* This row used to say "at most **one** self-hosted family… use a system tabular-figure feature rather than shipping a second face", while `IDENTITY.md` §7.1 mandates two families loaded from Google Fonts and makes IBM Plex Mono load-bearing for every rate and the whole rendered form. Each document forbade what the other required. **Self-hosting both satisfies both documents' actual goals**: the typographic system survives, the third-party request disappears (from a page whose entire argument is precision, and with it a privacy footnote), and the first-view budget holds. A system tabular-figure feature cannot render V5's `$12.25/.40` column alignment credibly — that is the one thing the second face is for. **The typeface choice itself is frozen pending the Brand Director's `IDENTITY_ARBITRATION.md` (B7); this row constrains *how* fonts load, not *which* fonts.** |
| **Images** | **None.** | Every visual is inline SVG or DOM. No hero photo, no stock construction imagery, no icon font. |
| **JS off** | The page renders, reads and converts: headline, sub, all copy, the pricing table, the FAQ (native `<details>`), the rendered WH-347, and a link to sam.gov's own search in place of the widget. | |
| **CI gate** | Lighthouse ≥ 95 performance / 100 accessibility on the deployed preview; `identity/contrast.py` exit 0; a link-checker on every source URL on the page. | A dead citation on a page whose argument is citations is a build failure, not a content bug. |

---

## 13. Conversion instrumentation

> **⚠ Rewritten 2026-09-03 (wave-1b iteration, finding B6, decision D12). This page coins no event
> names.** It used to run a **different vocabulary from the specs** — its primary and leading
> metrics were `trial_started` and `lookup_completed`, while `THRESHOLDS.md` §1's pre-committed
> band is defined on `lookup_cta_clicked ÷ lookup_performed` — and it introduced **ten events no
> spec defined and no document owned**. A funnel that cannot be computed is a decision that cannot
> be made, and THRESHOLDS is the instrument that decides whether this product continues.
>
> **The canonical list is [`specs/WL-EVENTS.md`](specs/WL-EVENTS.md), and this table quotes it.**
> Four names were wrong and are corrected; ten were homeless and now have owners (`WL-00` for the
> public surface, `WL-14` for the watch, `WL-09` for `pricing_cta_clicked`). A CI test asserts the
> emitted union equals WL-EVENTS' list in both directions, which is what stops this drifting again.
>
> | this page used to emit | canonical name | owner |
> |---|---|---|
> | `lookup_completed` | **`lookup_performed`** | WL-00 |
> | `lookup_empty` | **`lookup_zero_results`** | WL-00 |
> | `source_chip_clicked` | **`lookup_official_link_clicked`** | WL-00 |
> | `plan_cta_clicked` | **`pricing_cta_clicked`** | WL-09 |

**Primary metric:** **`trial_started` per unique visitor** — a trial with a card on file. It is the
only event on this page that predicts revenue, and it is the number `THRESHOLDS.md` §3 is judged
against.

**Leading indicator (watch daily, decide weekly):** **`lookup_performed` per unique visitor.** If
lookups are high and trials are low, the offer or the price is wrong. If lookups are low, the headline
or the traffic is wrong. **These two numbers separate the two failure modes**, which is the whole reason
to instrument at all. **And `lookup_cta_clicked ÷ lookup_performed` is the band THRESHOLDS §1
pre-commits to** — both names are now the specs' own, so that ratio is computable.

All events land in our own `events` table (PLAN.md A14). No values from the ledger are ever
transmitted.

| Section | Event | Owner | Properties | What it tells us |
|---|---|---|---|---|
| Hero | `hero_viewed` | WL-00 | `variant` | Denominator |
| Hero | `hero_cta_clicked` | WL-00 | `variant` | Headline is doing its job |
| Rate Lookup | `lookup_started` | WL-00 | `field_first_touched` | Which of the three fields is the friction |
| Rate Lookup | **`lookup_performed`** | WL-00 | `state_code`, `county_name`, `construction_type`, `result_count`, `latency_ms`, `source` | **The leading indicator, and THRESHOLDS §1's denominator.** `state_code` also tells outbound where demand is. |
| Rate Lookup | `lookup_ambiguous` | WL-00 | `candidate_count` | **V1b's own number** — how often the 1-in-8 case actually reaches a visitor (M14, THRESHOLDS P3) |
| Rate Lookup | `lookup_zero_results` | WL-00 | `state_code`, `county_name`, `construction_type` | A coverage gap, or a county-code bug (KB caveat: SAM county codes are not unique) |
| Rate Lookup | `lookup_official_link_clicked` | WL-00 | `wd_number`, `surface` | **The trust event.** Someone left to verify us. A high rate here is good news, not a leak. |
| Rate Lookup | **`lookup_cta_clicked`** | WL-00 | `wd_number` | **THRESHOLDS §1's numerator.** The true top of the funnel. |
| Rate Lookup | `modification_pin_used` | WL-00 | `wd_ref`, `from_mod`, `to_mod` | **The differentiator, measured** (§13 test 1; `OFFER.md` §11.3 Q7) |
| Rate Lookup | `alert_email_captured` | **WL-14** | `wd_number` | A watch was **requested** — not a subscriber. `watch_confirmed` is the list. |
| Ledger | `ledger_used` | WL-00 | **no values** | Engagement only. Never the visitor's numbers. |
| How it works | `how_step_viewed` | WL-00 | `step` | Where scroll dies |
| Proof | `wh347_artefact_expanded` | WL-00 | `page` | Is the artefact worth its weight |
| Proof | `timeline_viewed` | WL-00 | — | V2 reached |
| Pricing | `pricing_viewed` | WL-09 | `source` | Scroll-depth denominator for price |
| Pricing | **`pricing_cta_clicked`** | WL-09 | `tier`, `interval` | Tier mix before checkout — tells us if `Crew` is a decoy or a leak |
| Pricing | `gc_tier_interest` | WL-09 | `plan`, `surface` | **The GC waitlist, which is the WL-24 build trigger** (B2) |
| Pricing | `comparison_table_viewed` | WL-00 | — | |
| FAQ | `faq_opened` | WL-00 | `question_id` | **The objection map, measured.** Whichever question opens most is the one that belongs higher on the page. |
| Checkout | `trial_terms_viewed` | WL-09 | `plan`, `terms_version` | **B9:** the disclosure rendered before the card field |
| Checkout | `trial_terms_accepted` | WL-09 | `plan`, `terms_version` | **B9:** the consent record was written |
| Checkout | **`trial_started`** | WL-09 | `plan`, `trial_ends_at` | **Primary metric** |
| Checkout | `checkout_abandoned` | WL-09 | `tier`, `step` | |

**Hypotheses to be beaten, labelled as hypotheses** (no benchmark exists for this vertical —
RESEARCH.md gap G6; Unbounce's overall median is 6.6% across nine industries, none of them this one):

| Step | Hypothesis | Basis |
|---|---:|---|
| visit → `lookup_performed` | 25% | None. A guess, to be replaced by measurement in week one. |
| `lookup_performed` → `lookup_cta_clicked` | ≥8% | **Not a hypothesis — the band THRESHOLDS §1 pre-commits to.** Below 3% is a documented failing verdict with an action attached. |
| `lookup_cta_clicked` → `trial_started` | 6% | Below Poyar's 8% free-to-paid median, because a lookup is lighter than a trial. |
| `trial_started` → paid | 30% | Poyar: card-on-file trials convert at 30%. |
| **visit → paid** | **≈0.45%** | Product of the above. **If this is materially wrong the fault is almost certainly the first row.** |

**One A/B test at a time, one variable, pre-registered** (`PIPELINE.md` stage 6). Re-ordered after the
verification pass, because the question worth answering changed:

1. **H1 vs H6** — category-first ("Your county's Davis-Bacon rate…") against differentiator-first
   ("Free rate lookups are everywhere. The modification your contract locked is not."). **This is now the
   most valuable test on the page**, because it measures whether the buyer already feels the
   contract-lock problem or has to be taught it — the open question in `OFFER.md` §11.3 Q7. Judge on
   `lookup_performed`, not on `hero_cta_clicked`.
2. **V2 above the fold vs below it.** If the modification story is the sale, its diagram may not
   belong in the proof block at all.
3. Widget pre-filled with the worked example vs empty.

Nothing else is tested until `lookup_performed` has n ≥ 100. **The event that judges test 1 is
`modification_pin_used`** (`wd_ref`, `from_mod`, `to_mod`) — owned by `specs/WL-00`, not coined here
— and its in-product twin is `wd_pinned.is_superseded` from `specs/WL-02`. If `lookup_performed` is
healthy and both are near zero, the offer's differentiation is not landing and `OFFER.md` §11.3 Q7
has its answer.

---

## 14. Build checklist

- [ ] Word count above the pricing block ≤ 450, verified by a script in CI. **Current: 445**
      (55 + 83 + 53 + 117 + 94 + 43)
- [ ] Reading level checked; target 5th–7th grade (Unbounce)
- [ ] Every rate on the page renders a source chip, or does not render — enforced by a test
- [ ] Every source URL on the page link-checked in CI
- [ ] No testimonial, no logo, no seal, no accuracy claim, no `$13,508`
- [ ] `identity/contrast.py` exits 0; every token used here is one it tests
- [ ] `prefers-reduced-motion` honoured by V1, V1b, V2, V3, V4
- [ ] Page usable with JavaScript off
- [ ] Body never scrolls horizontally at 320 px
- [ ] Disclaimer and non-affiliation present; data-refresh timestamp wired to `kb_ingest_runs`
- [ ] Every event fired is one defined in **`specs/WL-EVENTS.md`**, under that name; the CI union
      test passes in both directions; zero third-party scripts **(B6)**
- [ ] `lookup_cta_clicked ÷ lookup_performed` is computable from what this page emits — the ratio
      `THRESHOLDS.md` §1 pre-commits to **(B6)**
- [ ] **G2 is absent from the page. Unconditional** — not "pending" — until the founder **and**
      counsel sign the wording (`OFFER.md` §11.3 Q1–Q2). With it cut, §5 runs at **94 words** and
      the page at **445** **(B8)**
- [ ] **No refund sentence anywhere on the page without its cap in the same sentence** — CI grep
      pairs "refund" with "up to three" **(B8)**
- [ ] **No CTA that leads to a card reads "Start free"** — CI grep; every paid CTA reads
      `Start 14-day trial`, and the trial line sits above the cards' CTAs **(B9)**
- [ ] **The GC card is a waitlist**: "Coming", future-tense bullets, `Join the list`, no purchase
      control, emitting `gc_tier_interest`. A render test asserts no `Start`/`Buy`/`Subscribe`
      control exists inside it **(B2)**
- [ ] **V1b renders on an ambiguous lookup** — candidates, no default selected, county list as the
      discriminator, the 12-word disambiguating line **(M14)**
- [ ] **No snapshot fallback exists.** When the corpus is unreachable the page shows the honest
      error and the SAM.gov link, and **no rate** **(M16)**
- [ ] **Two self-hosted WOFF2 subsets, ≤ 45 KB total, no font CDN**; mono confined to V1's rates
      and V5's form **(M11)**
- [ ] The wireframe (§3) and the chosen copy (§4) carry **the same sub-headline** **(M13)**
- [ ] The watch capture is `specs/WL-14`: unticked consent box naming the determination, double
      opt-in, ≤3 per address, one-click unsubscribe, postal address **(B5)**
- [ ] Customer-facing copy says "modification", never "revision" (PERSONA.md vocabulary)
- [ ] No copy anywhere claims the free lookup is new, unique or unavailable elsewhere (§5.5)
- [ ] The modification control ships in v1 — without it the page has no differentiator (§1, §5.5) —
      and `specs/WL-13`'s history backfill has run over this page's demo determinations **(B4)**
- [ ] `{{PRODUCT}}` resolved by the naming pass before launch (P11); `wagelens.com` is taken (V6);
      no hard-coded product name in any string **(M12)**
- [ ] Every colour is a semantic `--wl-*` token, never a hex — so the Brand Director's
      arbitration (**B7**) is a token-file swap, not a rebuild
