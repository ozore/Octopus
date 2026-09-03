# StateReady — landing page specification

**Author:** Offer & Landing agent, wave 1. **Date:** 2026-09-03.
**Companion documents:** `OFFER.md` (what is sold), `offer/RESEARCH.md` (why this shape converts, with
sources). Every regulatory string quoted on the page traces to a URL in `RESEARCH.md` §4.
**`PERSONA.md` landed mid-draft and has been read and reconciled** — see `offer/RESEARCH.md` §7b. Its §3
is the canonical numbers table; its §11 owns the mobile-versus-desktop decision for the *product*, and
this spec's §8 covers the *marketing page* only.
**`IDENTITY.md` also landed mid-draft and is binding.** §4 (visuals), §9 (fonts) and §4.1 (theme) have been
rewritten against it. Its rules override this spec wherever they differ — most consequentially:
**the map is a tile grid, not a geographic choropleth** (§7.1); **status is never colour alone** (§7.2);
and **motion on load, pulsing, and scroll-triggered reveals on the landing page are forbidden** (§8.5),
which removed all three animated diagrams an earlier draft specified.
The name "StateReady" is provisional (PLAN.md A3); the wordmark is a single component swap.

---

## 0. The governing decision

The brief says **felt, not read**. The research says why that is not a style preference:

- **79% of users scan rather than read**; objective, non-promotional language measured **27% better
  usability**, concise text **58%**, all three rewriting techniques together **124%**. Promotional
  language *"imposes a cognitive burden"* (NN/g).
- SaaS landing pages converting best run **250–725 words**; simple copy converts **514% better** than
  difficult copy (Unbounce).
- Our visitors are **Pain Aware to Solution Aware** — arriving from cold outbound, they know renewals hurt
  and many do not know software exists. Wiebe says that audience *"will require a lot of education."*

Those two facts are in direct tension: an audience needing education, and a hard 450-word ceiling.
**They are resolved by moving the education out of the prose and into the demo and the diagrams.** That is
the whole design thesis. Every visual below is load-bearing argument, not decoration.

**One goal. One CTA.** Wiebe: *"Every landing page should have one goal. Only one goal."* and *"a maximum
of one CTA per landing page,"* repeated but never varied. Our goal is **start the $149 First State
Audit**. The demo is not a second goal; it is the argument for the first.

**And the constraint that shapes everything else:** we have no customers, so we cannot use the highest-
leverage technique in the literature — the customer-swiped headline, which beat a professional's by
**103%** against the professional's **64% drop**. We substitute **the regulator's own language**, which is
public, quotable, citable and carries more authority over this problem than any customer would.

---

## 1. Word budget

**Hard ceiling: 450 words from the top of the page to the top of the pricing block.** Pricing, FAQ and
footer sit outside the ceiling; total page copy should still land inside Unbounce's 250–725 band.

**What counts:** prose — headings, body, captions, button labels, microcopy. **What does not:** UI chrome
(form labels, table row labels, map legends), source-chip text, `aria-label`s, and the demo's dynamic
output. Tokens are whitespace-separated; bare `—` and `…` are not words. That rule is mechanical, so CI
can enforce it and a copy edit cannot quietly evade it.

The figures below are counted from the actual strings specified in §§2–3 and §13, not estimated:

| § | Section | Words | Running |
|---|---|---:|---:|
| 2 | Hero — eyebrow, H1, subhead, CTA, microcopy, demo link | 81 | 81 |
| 3 | The divergence exhibit — caption | 37 | 118 |
| 4 | What happens when a credential lapses — heading, three sourced quotes, closing line | 76 | 194 |
| 5 | The demo — heading + instruction | 31 | 225 |
| 6 | How it works — three steps | 68 | 293 |
| 7 | What you can check before you pay — proof block | 62 | 355 |
| 8 | The guarantees strip | 43 | **398** |
| — | **Headroom before the ceiling** | **52** | **450** |
| 9 | Pricing block | *outside* | |
| 10 | FAQ, max six | *outside* | |
| 11 | Footer | *outside* | |

**Enforcement:** a build-time script counts words in the DOM between `#hero` and `#pricing` under the rule
above and **fails CI above 450**. The 52-word headroom exists so that a founder edit or an A/B variant has
somewhere to go; it is not a licence to add a section.

---

## 2. Above the fold

### 2.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [wordmark] StateReady          Pricing   Demo            [ Start · $149 ]   │ ← 56px, sticky on scroll
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ EYEBROW                            │  │  V1 — READINESS GRID           │  │
│  │ HVAC · Plumbing · Electrical       │  │  51 equal tiles, 40×40px       │  │
│  │                                    │  │                                │  │
│  │ H1                                 │  │   ┌──┐┌──┐        ┌──┐┌──┐     │  │
│  │ Your spreadsheet knows the date.   │  │   │WA││MT│  ···   │NY││ME│     │  │
│  │ It doesn't know the rule.          │  │   │✓ ││– │        │✓ ││– │     │  │
│  │                                    │  │   └──┘└──┘        └──┘└──┘     │  │
│  │ SUBHEAD (44 words)                 │  │   ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐     │  │
│  │ StateReady tracks every licence,   │  │   │CA││TX││IL││OH││NJ││FL│     │  │
│  │ CE hour, bond and insurance        │  │   │✕1││◑3││✓ ││◑2││– ││✓ │     │  │
│  │ certificate your crews hold, in    │  │   └──┘└──┘└──┘└──┘└──┘└──┘     │  │
│  │ every state you work in — each     │  │   ✓ READY  ◑ AT RISK  ✕ LAPSED │  │
│  │ date shown with the board page it  │  │   – NOT TRACKED (dashed edge)  │  │
│  │ came from and the day we last      │  │   Sample footprint             │  │
│  │ checked it. Entering a new state?  │  │                                │  │
│  │ It writes the playbook.            │  │  ┌──────────────────────────┐  │  │
│  │                                    │  │  │ V3 — DIVERGENCE CARD     │  │  │
│  │ ┌────────────────────────────┐     │  │  │ TEXAS · one regulator    │  │  │
│  │ │ Start with one state — $149│     │  │  │ ──────────────────────   │  │  │
│  │ └────────────────────────────┘     │  │  │ HVAC contractor   8  hrs │  │  │
│  │ We build the roster from the       │  │  │ Electrician       4  hrs │  │  │
│  │ public registers. 30 days or       │  │  │ ⓘ tdlr.texas.gov ·       │  │  │
│  │ you don't pay.                     │  │  │   checked 2026-09-03     │  │  │
│  │                                    │  │  └──────────────────────────┘  │  │
│  │ ↓ try it without signing up        │  │  Same state. Two trades.       │  │
│  │                                    │  │  Your spreadsheet has one      │  │
│  └────────────────────────────────────┘  │  column called "CE hours".     │  │
│                                          └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
        ~52% width                                    ~48% width

Notes: no status is carried by colour alone — every tile shows a glyph (✓ ◑ ✕ –), a hatch
and, in its accessible name, the word. Nothing on this fold animates on load.
```

### 2.2 Six headline options, and the choice

| # | Headline | Reading |
|---|---|---|
| 1 | No job stops because a licence expired. | Dream outcome, loss-framed, seven words, trade-native. **But it is an outcome promise**, and `IDENTITY.md` §2 prohibits "guaranteed compliance" claims while `OFFER.md` §5 is built on the principle that we guarantee what we control, never the customer's outcome. A headline may not promise what the guarantee section refuses to |
| 2 | You cannot pull a permit on an expired licence. So we make sure yours never is. | Strongest authority — the first clause is near-verbatim CSLB. The second clause has the same overclaim problem as #1, and at 15 words it opens on the reader's failure rather than their win |
| 3 | Every licence your crews hold. Every state's rules. One deadline calendar. | Clear, honest, and describes the software. Feature-shaped, and any competitor could write it — including the two that have not shipped |
| 4 | Your crews are licensed in nine states. Your calendar is in one spreadsheet. | Recognition, and it earns a wince. But "nine" is a guess about the reader, and if it is wrong the page has lied in its first line |
| 5 | The renewal you are going to miss is in a state you entered last year. | The truest sentence in the research. But it is a prediction about a stranger, and reads as a threat |
| **6** | **Your spreadsheet knows the date. It doesn't know the rule.** | **Chosen.** See below |

**Chosen: #6 — "Your spreadsheet knows the date. It doesn't know the rule."**

Ten words. It is the only option that is simultaneously (a) the buyer's own situation, (b) unfalsifiable,
(c) the exact differentiator that survives the strongest objection we face, and (d) free of any promise we
would have to keep.

Five reasons, each traceable:

1. **It is what the evidence actually says.** `PERSONA.md` §2.2 ranks the shared spreadsheet as the most
   common method and concludes independently: *"Every one of methods 1–5 is a place to store a date. None
   of them is a place to store a rule."* Two agents reached the same sentence from different research.
   That is as close to voice-of-customer as a company with no customers can get.
2. **It survives the Housecall Pro objection instead of colliding with it.** Housecall Pro ships expiry
   tracking and renewal reminders. A headline about *reminders* would be beaten by a feature the reader
   already pays for. A headline about *the rule behind the date* is a claim only we can make.
3. **It obeys the tone rules.** `IDENTITY.md` T1 — lead with the fact, then the consequence, never the
   adjective. T3 — their noun (*spreadsheet*), not ours. T4 — no manufactured urgency. And it promises
   nothing, so nothing in §8's guarantee strip has to walk it back.
4. **It sets up V3 in one beat.** The next thing the eye reaches is the divergence card: Texas, 8 hours vs
   4. The headline poses it; the card proves it; the demo lets them check it. That is the whole page.
5. **It works on the true incumbent.** The competitor is not LicensedTrades — it is the spreadsheet, and
   this is the only headline that names it.

**A/B challengers, in order:** #1 (highest emotional pull, but **must not ship without a founder decision**
on the outcome-promise problem — flag it as such in the test plan, not as a copy preference) and #2 with
the CSLB source link directly beneath it.

**What the chosen headline gives up, stated honestly:** it is problem-framed rather than outcome-framed, so
it carries less pull for a reader who is not already feeling the pain. That is an acceptable trade for cold
outbound traffic selected precisely because they are multi-state, and it is why the subhead must do the
outcome work.

### 2.3 Subhead — the MMUSP

Wiebe's rule: the hero must both match the message that brought the visitor **and** state what is uniquely
desirable. Our inbound message is *"you have N states and N renewal calendars"*.

> **StateReady tracks every licence, CE hour, bond and insurance certificate your crews hold, in every
> state you work in — each date shown with the board page it came from and the day we last checked it.
> Entering a new state? It writes the playbook.**

*(44 words.)* Message match = "every state you work in". Unique desirability = **"the board page it came
from and the day we last checked it"**, which is the one thing no alternative offers and the direct answer
to the only objection that matters.

### 2.4 CTA

**One CTA, repeated three times, never varied in wording:** hero, after the proof block, and in the
pricing block.

- **Button:** `Start with one state — $149`
- **Microcopy beneath, both hero and pricing:** *"We build the roster from the public registers. 30 days
  or you don't pay."*

CXL: *"Custom CTAs convert 42% more visitors than generic buttons"*, and button text should match
commitment level. This is a paid first step, so the price is **in** the button — it removes the anxiety
Wiebe names ("what is really on the other side") rather than deferring it to a checkout surprise.

**Secondary action is not a CTA and must not look like one:** a quiet, in-flow text link, `↓ try it
without signing up`, anchoring to the demo. Wiebe's rule that passive CTAs count is respected by having
**no top navigation beyond Pricing and Demo**, both of which are same-page anchors.

---

## 3. Sections 3–8, in order

### §3 — The divergence exhibit *(37 words)*
V3 (below) at full width on mobile, in the hero on desktop. Caption:
> **Same state. Same regulator. Two trades.** Texas asks an HVAC contractor for 8 hours of continuing
> education before the licence expires, and an electrician for 4 — on different topics. Now multiply by
> every state you work in.

### §4 — What happens when a credential lapses *(76 words)*
Three quotes, each with its source and date rendered as a source chip (V5). No commentary, no dollar
figures. **The section's persuasive force is that we say nothing at all.**
> *"You cannot actively contract with an expired, inactive, or suspended license."* — California CSLB
> *"Licensee's license and insurance information must be active and current."* — NYC Department of Buildings
> *"…may [not] bring or maintain any action … for the collection of compensation … where a license is required."* — California Business & Professions Code §7031
>
> A lapse is not a fine. It is the right to work — and the right to be paid for it.

**Why §7031 and not the municipal permit clause** (which the first draft used): §7031 is the harder
consequence and it was re-verified independently at leginfo for PLAN.md A10's two-agent rule. Its
subdivision (b) — a customer of an unlicensed contractor *"may bring an action … to recover all
compensation paid"* — is deliberately **not** on the page. It is one step too far for a headline section
and belongs in the sample pack, where there is room to state it precisely.

**Prohibited in this section, permanently:** any figure for lost revenue, downtime or fines. Every such
number published in this category is an unsourced vendor estimate (`RESEARCH.md` §3.2) and PLAN.md A10
forbids ours.

### §5 — The demo *(31 words)*
Heading: **See your own state's rules before you give us anything.**
Instruction line: *"Pick a state and a trade. No email, no account. Every answer shows where it came from
and when we checked."* Full spec in §12.

### §6 — How it works, three steps *(68 words)*
Rendered as V4's three-panel stepper, one sentence each.

| | Step | Copy |
|---|---|---|
| 1 | **You name your states and trades** | Two minutes. No roster upload. |
| 2 | **We build the roster** | We pull your company's and your qualifiers' licence records from the public state registers, verify each against the board's own page, and hand you back a calendar. |
| 3 | **Nothing lapses quietly** | Alerts at 90, 60, 30 and 7 days, routed to whoever actually files. One PDF when a GC asks you to prove it. |

### §7 — What you can check before you pay *(62 words on the page; the four items below describe what each one renders)*
Our proof block. **There are no testimonials, no logos and no customer counts, because we have no
customers.** The heading says so implicitly and the block delivers four things that are real:

1. **A redacted sample State Entry Pack page** — one real state × trade, real cited rules, the client's
   identity removed. Rendered inline as a scrollable page preview, downloadable as PDF. This is the single
   most persuasive artefact we own: it lets the buyer audit the deliverable before purchase.
2. **Live coverage counter** — states × trades × licence types currently verified, and the date of the
   last knowledge-base refresh, read from the KB at build time. A real number, small if it is small.
3. **Source chips everywhere** (V5) — every date on the page and in the demo carries its `.gov` URL and
   `last_verified`.
4. **What we do not do** — *"We are not a licence expediter. We do not file for you. We tell you exactly
   what to file, and exactly what to hand an expediter if you use one."*

Placed **immediately above pricing**, per CXL's rule that social proof belongs *"where doubt peaks most:
after main value proposition, before pricing."*

### §8 — Guarantees strip *(43 words)*
Three short lines, one per guarantee, in the founder-approved wording from `OFFER.md` §5.1 only.
**The "we pay your reinstatement fee" guarantee must not appear on this page in any form** until the
founder has accepted the liabilities in `OFFER.md` §5.2. If it is ever approved, it needs legal review
before it is rendered.

---

## 4. Visuals — five briefs

**Bound to `IDENTITY.md` §§7–8, which override anything in an earlier draft of this spec.** The binding
constraints, restated because they change the briefs materially:

- **The map is a tile grid, not a geographic choropleth** (§7.1). Equal visual weight per jurisdiction.
- **Status is never colour alone** (§7.2): every status carries a **colour + glyph + hatch + word** —
  READY ✓ solid, AT RISK ◑ 45° diagonal, LAPSED ✕ cross-hatch, NOT TRACKED — dotted.
- **Motion is severely restricted** (§8.5). Forbidden outright: *"map tiles animating on load … pulsing,
  blinking or looping anything … scroll-triggered reveals on the landing page."* Permitted: opacity and
  2–8px transform, on **interaction only**, at `--sr-dur-1/2/3` (120/180/240ms).
  **Consequence: there are no animated diagrams on this page.** An earlier draft specified three. They are
  gone. The identity's reasoning is sound — fifty things moving delays the answer, and a date is not a
  score.
- **Every infographic answers *where* or *when*; if neither, it is cut** (§7.4 rule 1). SVG only, inline,
  palette tokens. Labels inside the graphic, not in a legend. No pie, doughnut or gauge. Numbers exact and
  sourced or absent. One accent maximum per graphic.
- **Both themes authored independently** (§10), plus `@media print` as a third theme with expanded hatches.

### V1 — The Readiness Grid *(hero — "where")*
- **Argument:** *this is your company, and three states are at risk.*
- **Form:** 51 equal tiles (50 states + DC) in the approximate shape of the country. **40×40px desktop,
  28×28 at ≤640px, 4px gutter, 6px radius.** Fill = status `-fill` token, 1.5px `-edge` border, state
  abbreviation in ink at `--sr-text-2xs`/600. Count badge bottom-right when > 0.
- **Status rendering:** fill + edge + **glyph** (✓ / ◑ / ✕ / —) + hatch pattern. The word appears in the
  tile's accessible name and in the hover panel. Never colour alone.
- **States not operated in are drawn**, in `--sr-paper` with a 1px dashed `--sr-line-strong` edge and
  ink-3 label — so **expansion is visible as an absence**, which is the whole second half of the product
  sitting in the hero for free.
- **Data:** a **sample footprint**, labelled *"Sample footprint"* as visible text, never a tooltip.
- **Motion: none on load.** Hover/focus opens a panel at `--sr-dur-2` (opacity + 4px rise) naming the
  trade, licence class, next deadline and a V5 source chip. Selection is a 2px `--sr-ink` outline with 2px
  offset — never a colour change.
- **Markup:** a `<ul>` of `<button>`s in DOM reading order (AL, AK, AZ, …), each with an accessible name of
  the form *"Ohio, at risk, 2 licences"*. The grid is fully usable by keyboard and by screen reader without
  reference to the visual layout.
- **Size budget:** ≤ 8 KB. A tile grid is `<rect>`s, not paths — an order of magnitude smaller than the
  geographic map an earlier draft specified, which also buys back most of the SVG performance budget.

### V2 — The Runway *(section 6 — "when")*
- **Argument:** *the deadlines are not evenly spread, and some months are walls.*
- **Form, per `IDENTITY.md` §7.3:** one horizontal axis, **today at the left, twelve months at the right**,
  with four fixed verticals at **90 / 60 / 30 / 7 days**, drawn as 1px `--sr-line-strong` rules with the day
  count set in IBM Plex Mono at the top. Between 30 and 0 the ground carries the `--sr-risk-fill` wash; past
  0, `--sr-lapsed-fill`. Every licence is a marker on the axis, one lane per state.
- **The point of the diagram:** the **Illinois lane has every marker stacked on one date**, with an inline
  label — *"Illinois: every plumber licence in the state, 30 April"* — and a V5 source chip to IDPH. Labels
  are inside the graphic (§7.4 rule 3); there is no legend.
- **Motion: none.** It renders drawn. Hover a marker → panel at `--sr-dur-2`.
- **Overflow:** more than 8 lanes scrolls inside its own `overflow-x:auto` container. On mobile the Illinois
  stack is **pre-scrolled into view**.

### V3 — The Divergence Card *(hero — a reference card, not an infographic)*
- **Argument:** *your one "CE hours" column is already wrong.*
- **Honest note on §7.4 rule 1:** this answers *what*, not *where* or *when*, so by the letter of the rule
  it should be cut. **It is retained deliberately, reclassified as a reference card rather than an
  infographic**, because it is the single most persuasive artefact on the page and it looks like a document,
  not a chart. **Flagged for the wave-1b reviewer** as a knowing exception rather than an oversight.
- **Content, verbatim and cited:** `TEXAS · one regulator` / `HVAC contractor — 8 hours, incl. 1 hour of
  Texas law` / `Electrician — 4 hours, NEC · Texas law · 16 TAC ch. 73 · NFPA 70E`, each row ending in a V5
  source chip to the relevant `tdlr.texas.gov` page.
- **Form:** two rows, hairline `--sr-line` between, the **numerals in IBM Plex Mono at display size** with
  `tabular-nums` so 8 and 4 sit in the same column and the difference is spatial, not verbal. Set on
  `--sr-surface` with a `--sr-line-strong` top border — it should read as a page torn from a reference
  manual.
- **No motion, no accent colour.** Its credibility comes from looking like a document. §7.4 rule 6 gives it
  one accent maximum; it uses none.
- **Rendered from the knowledge base, never hard-coded.** If TDLR changes the hours and the KB updates, the
  card updates. A stale number here discredits the entire premise of the page.

### V4 — The Entry Pack Steps *(section 6 — "when")*
- **Argument:** *entering a state is eight known steps in a known order, not a mystery.*
- **Form:** eight numbered step cards in a single column (desktop: two columns of four), each ~40px tall
  with a title and a one-line artefact name ("Bond amount + acceptable forms"). **Rendered expanded on
  load** — the earlier draft's scroll-triggered accordion unfold is forbidden by §8.5.
- **Ordering carries the meaning:** the steps run left-to-right / top-to-bottom in filing order, and the two
  that catch people out — step 2 (who can hold the qualifier) and step 3 (what reciprocity does *not*
  waive) — carry a small `--sr-risk` glyph. Marking them is honest, not decorative.
- **Motion:** click to expand a step to two sentences, `--sr-dur-2`, opacity + 4px. Collapsed by default
  below the title line.

### V5 — The Source Chip *(systemic micro-component)*
- **Argument:** *every number here has a provenance, and you can check it right now.*
- **Form:** an inline chip after any regulatory value — ⓘ glyph plus the source host in IBM Plex Mono at
  `--sr-text-xs` (`tdlr.texas.gov`). Hover / focus / tap opens a popover at `--sr-dur-2`: full page title,
  direct link, and `last checked 2026-09-03`.
- **This is not decoration; it is the brand.** It is the component `IDENTITY.md` §12 should spend the most
  care on. It appears in the hero card, §4, the demo, the sample pack and inside the app.
- **Accessibility:** a real link with an accessible name of the form *"Source: Texas Department of Licensing
  and Regulation, continuing education for air conditioning contractors, checked 3 September 2026"*.
  Popover is keyboard-dismissible; nothing depends on hover.
- **Rule:** a value with no verified source renders **no chip and no value** — it renders *"not yet
  verified for this state"*. Never a bare number.

### 4.1 Theme and print

- **Light default, dark fully supported**, per `IDENTITY.md` §10 precedence: `data-theme` wins, then
  `prefers-color-scheme`, then light. Both palettes are authored independently — **no filter, no
  inversion.** Status semantics never change between themes: green is READY in both.
- **`@media print`** forces the light palette, drops shadows, **expands the V1 and V2 hatches** so a
  black-and-white bid packet still separates the four statuses, and prints provenance URLs in full after
  each rule. The landing page is printed more often than a marketing team expects — a coordinator prints it
  to show her GM.
- **`prefers-reduced-motion: reduce`** sets every duration to `0.01ms` (never `0`, so `transitionend` still
  fires) and removes transforms. Because nothing on this page animates on load, the reduced-motion
  experience and the default experience are already nearly identical — which is the correct outcome.

## 5. Pricing block *(outside the word budget)*

Three cards, `Multi-State` visually recommended. Enterprise is a single line of text beneath, not a
fourth card — it is quote-only and a card would imply a self-serve path that does not exist.

| | Single State | **Multi-State** | Platform |
|---|---|---|---|
| | $149/mo | **$349/mo** | $599/mo |
| | $1,490/yr | **$3,490/yr** | $5,990/yr |
| | 1 state · 25 techs | 5 states · 75 techs | 15 states · 250 techs |

**Required elements:**

- **Annual/monthly toggle**, defaulting to **annual**, labelled *"two months free"*. Annual is where the
  bonus State Entry Pack lives, and it is the tier where our onboarding cost is recovered.
- **A one-off row beneath the cards**, not hidden in the FAQ: *State Entry Pack — $1,500 per state.
  **Your first state: $750**, credited in full if you take an annual plan within 90 days.* With the reason
  why printed underneath in small type, because a discount without a reason reads as a fake price:
  *"The first state you buy is a state whose rulebook we then maintain for everyone after you. You pay for
  the research; we keep the asset."*
- **The honest-triage line**, directly under the cheapest card: *"Tracking four licences for one person?
  You do not need us — CE Broker is $39.99 a year."* Naming a cheaper competitor is the highest-trust
  move available to a company with no track record, and it disqualifies buyers who would churn.
- **No comparison table against named competitors.** Two of the three obvious ones have no customers
  (`RESEARCH.md` §3.1), and a table comparing us to a waitlist would be both unfair and easy to falsify.

---

## 6. FAQ — exactly six, no more

Each answer ≤ 45 words. Chosen from the objection map (`OFFER.md` §10) by frequency × deal-killing power.

1. **How do I know your dates are right?** *(objection 2 — the only one that really matters)*
2. **Who else is using this?** — answered with "you would be early", the demo, the sample pack and the
   sources. **Never a fabricated customer, count or logo.**
3. **Do you file the renewals for us?** — no, and what we do instead.
4. **We use ServiceTitan / Housecall Pro. Doesn't that cover it?** — **the answer is not "no", and
   writing "no" would be false.** Housecall Pro's own page offers document storage, expiry tracking and
   renewal reminders. The honest answer: *"Partly. They store the date you type. They don't hold the rule
   behind it — that one of Texas's eight HVAC CE hours has to be Texas law, or that a Texas licence
   expired past 90 days renews at twice the fee."*
5. **What if we only work in one state?** — Single State, or honestly, a $99/yr tracker.
6. **Which states and trades do you cover today?** — the live coverage list, with the refresh date, and a
   plain "not yet" for the rest.

**Q6 is non-negotiable and must render from the knowledge base.** An offer that outruns its data destroys
the one thing the whole page is built on.

---

## 7. Footer *(outside the word budget)*

Two rows. Row 1: product (Pricing, Demo, Sample pack), company (About, Contact, Help), legal (Terms,
Privacy, Refund policy, Accessibility). Row 2: the **disclaimer**, required by PLAN.md A10 and rendered at
full contrast, not greyed into invisibility:

> StateReady summarises publicly published licensing requirements and shows the source and date for every
> value. It is not legal advice and does not replace the issuing board's own current requirements. Verify
> before you file.

Plus: *"StateReady, a TheVillage company"* (PLAN.md D1), the entity's physical address (needed for
CAN-SPAM consistency with outbound), and the copyright line. **No social icons** — Wiebe counts them as
competing CTAs.

---

## 8. Mobile variant

Mobile is the default build target, not an adaptation (Unbounce: mobile drives the majority of landing
page visits and converts marginally better).

- **Stack order changes.** Desktop puts V1 (map) beside the headline; **mobile puts V3 (the divergence
  card) directly under the subhead and pushes V1 below it.** Rationale: on a 390px screen a US map is a
  decorative blob, whereas the 8-vs-4 card is legible at any size and is the stronger argument.
- **V1 tiles drop to 28×28px** (`IDENTITY.md` §7.1) and the grid keeps its full 51 jurisdictions — the
  tile grid degrades to small screens far better than a geographic map, which is a second reason the
  identity's choice is the right one. Hover panels become tap-to-open sheets at `--sr-dur-3`.
- **V2 (the runway)** scrolls horizontally inside its own container, with the April 30 stack **pre-scrolled
  into view** — the reader must not have to discover the point.
- **CTA is sticky** at the bottom edge from the moment the hero leaves the viewport: full-width button,
  56px tall, with the microcopy as a single line above it.
- **The demo is the first interactive element after the hero on mobile**, promoted above §4, because
  thumb-reachable interaction is the cheapest engagement we will get on a phone.
- **No horizontal page scroll at any width.** Every wide element (V2, the sample pack preview, the pricing
  table) owns its own `overflow-x:auto` container.
- Tap targets ≥ 44px. Source chips get a 44px hit area even though the glyph is small.

---

## 9. Performance budget

The page is the first thing a cold prospect sees, and it must open on a phone in a truck.

| Metric | Budget |
|---|---|
| HTML, compressed | ≤ 40 KB |
| CSS, compressed (design system + page) | ≤ 25 KB |
| JS, compressed, **total** | ≤ 45 KB — demo + map interaction + instrumentation. No framework on the marketing route |
| Inline SVG, all visuals, compressed | ≤ 25 KB. **The tile grid is `<rect>`s, not geographic paths** — V1 alone drops from ~28 KB to ≤ 8 KB, which is where most of this budget was recovered |
| Fonts | **Public Sans (400/500/700) + IBM Plex Mono (400/500)** per `IDENTITY.md` §8.1, from Google Fonts, `font-display: swap`, **subset to Latin**, `preconnect` to `fonts.gstatic.com`. ≤ 70 KB total. The fallback stacks in §8.1 must be set so the page is fully legible before the fonts land |
| Images | **Zero raster images above the fold.** No hero photograph, no stock, no logos |
| Total transfer, first view | **≤ 220 KB** including both font families |
| LCP (mobile, 4G, mid-tier Android) | **≤ 1.8 s** |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 — every SVG has an explicit `viewBox` + aspect-ratio box; the demo reserves its result height before fetching |
| Third-party requests | **Google Fonts only** (permitted by `IDENTITY.md` §7.4 rule 2), preconnected. Nothing else at first paint. PostHog (PLAN.md A14) loads deferred, after LCP, and the page is fully functional without it |

Enforced by a Lighthouse CI budget in the same job that enforces the word count.

---

## 10. Conversion instrumentation

Events go to our own `events` table (PLAN.md A14); PostHog is optional and additive. **No third-party
script is required for any metric below** — if PostHog is absent, the funnel still works.

| Event | Fired when | Properties |
|---|---|---|
| `lp_view` | page view | referrer, utm, viewport class, outbound campaign id |
| `lp_scroll_depth` | 25 / 50 / 75 / 100% | depth, time to depth |
| `lp_demo_open` | demo enters viewport or is anchored to | source (`hero_link`, `scroll`, `nav`) |
| `lp_demo_query` | **the key engagement event** — a state + trade lookup runs | state, trade, result_count, was_covered (bool) |
| `lp_demo_source_click` | a V5 source chip is opened | which value, which source host |
| `lp_sample_pack_open` | redacted sample pack previewed or downloaded | format |
| `lp_pricing_view` | pricing block enters viewport | time since `lp_view` |
| `lp_plan_toggle` | annual/monthly toggled | to |
| `lp_cta_click` | the one CTA, any of its three placements | placement, plan context |
| `lp_checkout_start` / `lp_checkout_complete` | Stripe Checkout | price id, amount |
| `lp_faq_open` | an FAQ item expands | which |

**The three numbers that decide whether this page works:**

1. **`lp_demo_query` per `lp_view`.** The whole design thesis is that education happens in the demo. If
   fewer than ~20% of visitors run a lookup, the thesis is wrong and the page needs more prose, not less.
2. **`lp_demo_query` → `lp_cta_click`.** The demo's job is to convert audit-of-our-data into trust. This
   ratio is the measurement of Perceived Likelihood, the offer's binding constraint.
3. **`was_covered = false` rate.** Every uncovered state × trade lookup is a real prospect we turned away
   and a ranked backlog item for the knowledge base. This is the most commercially valuable signal the
   page produces and it costs nothing to collect.

**First tests, in order** (one variable at a time): (a) headline #6 vs #1 — **gated on the founder accepting the outcome-promise risk in #1** — (b) V3 above vs below the fold
on desktop, (c) CTA with the price in the button vs without.

---

## 11. What the page may never contain

A standing list, because these are the failure modes this category is full of:

- Testimonials, customer names, logos, star ratings or customer counts we do not have.
- Any dollar figure for the cost of a lapse, a fine or downtime — every published one in this category is
  an unsourced vendor estimate (`RESEARCH.md` §3.2).
- A countdown timer, a fake seat count, or "prices rise on the 1st".
- A regulatory value without a source chip and a `last_verified` date.
- A comparison table against a named competitor that has no customers.
- **Any claim that a field-service platform "doesn't do this".** Housecall Pro ships native document
  storage, expiry tracking and renewal reminders. The permitted claim is narrower and true: *they store
  the date; they do not hold the rule.*
- The reinstatement-fee guarantee, unless and until the founder accepts the liabilities in `OFFER.md` §5.2.
- A claim of coverage beyond what `KNOWLEDGE_BASE.md` verifies on the day of the build.
- **Photography of any kind** — no technicians, no trucks, no offices (`IDENTITY.md` §8.4). It is the
  visual signature of every competitor and it sells nothing we sell.
- **Anything that animates on load, pulses, blinks, loops, or reveals on scroll** (`IDENTITY.md` §8.5).
- **Status communicated by colour alone.** Every status carries colour + glyph + hatch + word.

---

## 12. The no-login interactive demo

**The most important thing on the page.** It carries the education the word budget forbids, and it is the
only mechanism we have for raising Perceived Likelihood (3/10, the binding constraint) before a stranger
gives us anything.

### 12.1 Interaction

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  See your own state's rules before you give us anything.                     │
│  Pick a state and a trade. No email, no account.                             │
│                                                                              │
│   State  [ Texas            ▾ ]     Trade  [ HVAC / ACR        ▾ ]           │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│  TEXAS · AIR CONDITIONING & REFRIGERATION            ⓘ tdlr.texas.gov        │
│                                                                              │
│  Licence classes        ACR Contractor (Class A / Class B)      ⓘ            │
│  Renewal cycle          [from KB]                               ⓘ            │
│  Continuing education   8 hours, incl. 1 hour Texas law & rules ⓘ            │
│                         "must be completed before your license expires"      │
│  Bond / insurance       [from KB]                               ⓘ            │
│  Last checked           2026-09-03                                           │
│                                                                              │
│  ┌ Compare with ────────────────────────────────────────────────────────┐   │
│  │ Texas · Electrician        4 hours CE  ·  NEC, TX law, 16 TAC 73,    │   │
│  │                            NFPA 70E                              ⓘ   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  This is one state and one trade. You work in more than one.                 │
│                        [ Start with one state — $149 ]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Rules

- **No email, no account, no card, no rate-limit prompt.** Anything else negates the point.
- **Default on load: Texas × HVAC**, because it sets up the 8-vs-4 comparison in one move. The comparison
  row auto-populates with the *same state, different trade* — the divergence is the lesson.
- **Every value carries a V5 source chip.** A value we have not verified renders **"not yet verified for
  this state"**, never a blank and never a guess. A state × trade outside launch coverage (PLAN.md A11 —
  HVAC, plumbing, electrical × the 15 highest-activity states) renders *"Not covered yet — tell us and it
  goes to the front of the queue"* with a one-field email capture that is **optional and clearly labelled
  as a waitlist, not a signup**.
- **Server-rendered, then hydrated.** The default Texas × HVAC result is in the HTML so it is visible with
  JavaScript off and counts toward LCP as text, not as a spinner.
- **Reads the same knowledge base the product reads.** Not a copy, not a fixture, not a JSON file that
  drifts. If the demo and the app can disagree, the demo is a liability rather than proof.
- **Deep-linkable:** `/demo?state=tx&trade=hvac` renders server-side with correct `<title>` and meta
  description. This makes every state × trade combination a shareable, indexable page — the programmatic-
  SEO asset falls out of the demo for free, and outbound emails can link a prospect straight to the two
  states their last acquisition added (`OFFER.md` §11).
- **The gate is the roster, not the rules.** Free gives the *diagnosis* (what this state requires of this
  trade). It never gives the *remedy* (your licences, your dates, your alerts). That boundary is what makes
  the $149 audit the obvious next step rather than a paywall.

### 12.3 Definition of done for the demo

- [ ] Renders server-side, correct with JavaScript disabled.
- [ ] Every displayed value carries `source_url` + `last_verified` from the KB, or renders the unverified
      state.
- [ ] Uncovered state × trade combinations degrade honestly and fire `lp_demo_query` with
      `was_covered=false`.
- [ ] Deep links work for every covered combination and carry unique title + meta description.
- [ ] Keyboard-operable end to end; source chips are focusable links with descriptive accessible names.
- [ ] No network request before first paint; the default result ships in the HTML.
- [ ] Disclaimer (§7) visible within the demo's own container, not only in the page footer.

---

## 13. Final copy deck — every word above the pricing block

This is the page, verbatim. **398 words**, against a 450 ceiling. Anything not on this list is UI chrome,
a source chip, or demo output, and is excluded from the count by the rule in §1. Build from this; do not
paraphrase it.

**§2 Hero — 81 words**
- Eyebrow: `HVAC · Plumbing · Electrical`
- H1: `Your spreadsheet knows the date. It doesn't know the rule.`
- Subhead: `StateReady tracks every licence, CE hour, bond and insurance certificate your crews hold, in every state you work in — each date shown with the board page it came from and the day we last checked it. Entering a new state? It writes the playbook.`
- CTA button: `Start with one state — $149`
- Microcopy: `We build the roster from the public registers. 30 days or you don't pay.`
- Demo link: `↓ try it without signing up`

**§3 Divergence caption — 37 words**
> `Same state. Same regulator. Two trades. Texas asks an HVAC contractor for 8 hours of continuing education before the licence expires, and an electrician for 4 — on different topics. Now multiply by every state you work in.`

**§4 What happens when a credential lapses — 76 words**
- Heading: `What happens when a credential lapses`
- `"You cannot actively contract with an expired, inactive, or suspended license."` — California CSLB
- `"Licensee's license and insurance information must be active and current."` — NYC Department of Buildings
- `"…may [not] bring or maintain any action … for the collection of compensation … where a license is required."` — California Business & Professions Code §7031
- Closing line: `A lapse is not a fine. It is the right to work — and the right to be paid for it.`

**§5 Demo — 31 words**
- Heading: `See your own state's rules before you give us anything.`
- Instruction: `Pick a state and a trade. No email, no account. Every answer shows where it came from and when we checked.`

**§6 How it works — 68 words**
1. `You name your states and trades.` / `Two minutes. No roster upload.`
2. `We build the roster.` / `We pull your company's and your qualifiers' licence records from the public state registers, verify each against the board's own page, and hand you back a calendar.`
3. `Nothing lapses quietly.` / `Alerts at 90, 60, 30 and 7 days, routed to whoever actually files. One PDF when a GC asks you to prove it.`

**§7 Proof block — 62 words**
- Heading: `What you can check before you pay`
- `A sample State Entry Pack page, redacted.` *(opens the inline preview / PDF)*
- `States and trades verified today, refreshed [date].` *(both values rendered from the knowledge base)*
- `Every date shows its source and the day we checked it.`
- `We are not a licence expediter. We do not file for you. We tell you exactly what to file, and exactly what to hand an expediter if you use one.`

**§8 Guarantees strip — 43 words**
- Heading: `Three things we guarantee`
- `Wrong against the source? We fix it in one business day and credit you a month.`
- `Your roster loaded and verified in 30 days, or you don't pay.`
- `Entry Pack missing a published requirement? We rewrite it and refund.`

**Then the CTA repeats, unchanged, and the pricing block begins.**

### 13.1 Copy rules for whoever edits this next

- **Do not vary the CTA wording** between its three placements. Wiebe: one goal, one CTA; a varied CTA is
  two CTAs.
- **Do not add an adjective to a regulatory quote.** The quotes in §4 carry the page. Any word we add
  becomes a word the reader has to filter, and NN/g measured a 27% usability penalty for exactly that.
- **The subhead's second half is not trimmable.** *"each date shown with the board page it came from and
  the day we last checked it"* is the entire differentiator; without it the subhead describes a product
  three other companies also claim to have.
- **If a section must grow, another must shrink.** The ceiling is the design.
