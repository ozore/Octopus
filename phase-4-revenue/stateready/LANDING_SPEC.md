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

**`../IDENTITY_ARBITRATION.md` (Brand Director, 2026-09-03) is now final and supersedes both of the
above where they differ.** Three changes bind this page and every token name in it:
**(1) the default theme is the board** — a deep graphite-green ground (`--sr-ground #181D1A`), not
warm paper. **Paper is what leaves the building**: print, the bid PDF, shareable links and every
email. **(2) The typefaces are Barlow, Barlow Condensed and Overpass Mono** — American signage and
Highway Gothic lineages — **not Public Sans and IBM Plex Mono**. **(3) `--sr-paper` no longer exists**
as a token; the ground is `--sr-ground` and the alternate theme is `data-theme="paper"`. Every
occurrence in §4, §4.1 and §9 below has been corrected. `design-system.css` is the source of truth for
tokens; where this spec and the CSS disagree, the CSS wins and this spec is wrong.

**Revised 2026-09-03 against the wave-1b review** (`REVIEW.md`; decision log in `REVIEW_RESPONSE.md`).
Four changes to the page itself: **the CTA is the free trial** (D1), **the "we build the roster"
microcopy is deleted** (B3), **the guarantee strip drops to two lines** (D3), and **the hero subhead
and V4 no longer promise bond and timeline data the knowledge base does not have** (B2).
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
of one CTA per landing page,"* repeated but never varied. **Our goal is: start the 14-day free trial**
(D1). The demo is not a second goal; it is the argument for the first, and under D2 it is the **only**
free thing on the page — there is no free roster audit and no $149 tripwire.

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

The figures below are **counted mechanically from the actual strings in §13**, under the rule above, not
estimated — the count is reproduced at the bottom of this section so anyone can re-run it:

| § | Section | Words | Running |
|---|---|---:|---:|
| 2 | Hero — eyebrow, H1, subhead, **CTA (1 of 3) + microcopy**, demo link | 68 | 68 |
| 3 | The divergence exhibit — caption | 37 | 105 |
| 4 | What happens when a credential lapses — heading, four sourced quotes, closing line | 97 | 202 |
| 5 | The demo — heading + instruction | 31 | 233 |
| 6 | How it works — three steps | 66 | 299 |
| 7 | What you can check before you pay — proof block | 62 | 361 |
| — | **CTA repeat (2 of 3), after the proof block** | **9** | 370 |
| 8 | The guarantees strip — **two lines, not three** | 34 | 404 |
| — | **CTA repeat (3 of 3), immediately above pricing** | **9** | **413** |
| — | **Headroom before the ceiling** | **37** | **450** |
| 9 | Pricing block | *outside* | |
| 10 | FAQ, max six | *outside* | |
| 11 | Footer | *outside* | |

**The two CTA repeats are now in the table** (wave-1b **m9**). The wave-1 deck claimed **398** and the
repeats were real but uncounted, so the CI rule — which measures the DOM between `#hero` and `#pricing`
and therefore sees all three placements — would have reported **403** against a spec that said 398. A
copy deck the build disagrees with is a copy deck nobody trusts on the second edit. **413 now means the
same thing in the deck, in this table and in CI.**

**How 398 became 413 on a page that promises less**, section by section:

| § | wave 1 | now | Δ | what moved |
|---|---:|---:|---:|---|
| 2 hero | 81 | 68 | **−13** | roster microcopy deleted (13 words → 5), subhead loses "bond and insurance certificate" (44 → 41), CTA shortens (5 → 4) |
| 3 | 37 | 37 | 0 | – |
| 4 lapse | 76 | 97 | **+21** | the fourth quote — the Texas line that stops §4 arguing entirely from two uncovered states (**M18**) — plus the reframed closing line |
| 5 | 31 | 31 | 0 | – |
| 6 how it works | 68 | 66 | **−2** | step 2 stops promising the roster build |
| 7 | 62 | 62 | 0 | – |
| 8 guarantees | 43 | 34 | **−9** | three guarantees → two |
| CTA repeats | 0 *(uncounted)* | 18 | **+18** | two placements that were always on the page and never in the deck (**m9**) |
| **total** | **398** | **413** | **+15** | |

**The page's prose shrank by 3 words and its promises shrank a great deal more**; the count rose because
it is now measuring what is actually rendered rather than what the deck remembered to list.

**Enforcement:** a build-time script counts words in the DOM between `#hero` and `#pricing` under the
rule above and **fails CI above 450**. The 37-word headroom exists so a founder edit or an A/B variant
has somewhere to go; it is not a licence to add a section.

## 2. Above the fold

### 2.1 Wireframe

Rendered on the **board** (`--sr-ground`), type in Barlow, figures in Overpass Mono.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [wordmark] StateReady        Pricing   Demo      [ Start your free trial ]   │ ← top bar, 56px, sticky
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
│  │ SUBHEAD (41 words)                 │  │   ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐     │  │
│  │ StateReady tracks every licence    │  │   │CA││TX││IL││OH││NJ││FL│     │  │
│  │ and CE hour your crews hold, in    │  │   │✕1││◑3││✓ ││◑2││– ││✓ │     │  │
│  │ every state you work in — each     │  │   └──┘└──┘└──┘└──┘└──┘└──┘     │  │
│  │ date shown with the board page it  │  │   ✓ READY  ◑ AT RISK  ✕ LAPSED │  │
│  │ came from and the day we last      │  │   – NOT TRACKED (dashed edge)  │  │
│  │ checked it. Entering a new state?  │  │   Sample footprint             │  │
│  │ It writes the playbook.            │  │                                │  │
│  │                                    │  │  ┌──────────────────────────┐  │  │
│  │ ┌────────────────────────────┐     │  │  │ V3 — DIVERGENCE CARD     │  │  │
│  │ │ Start your free trial      │     │  │  │ TEXAS · one regulator    │  │  │
│  │ └────────────────────────────┘     │  │  │ ──────────────────────   │  │  │
│  │ 14 days. No credit card.           │  │  │ HVAC contractor   8  hrs │  │  │
│  │                                    │  │  │ Electrician       4  hrs │  │  │
│  │ ↓ try it without signing up        │  │  │ ⓘ tdlr.texas.gov ·       │  │  │
│  │                                    │  │  │   checked 2026-09-03     │  │  │
│  └────────────────────────────────────┘  │  └──────────────────────────┘  │  │
│                                          │  Same state. Two trades.       │  │
│                                          │  Your spreadsheet has one      │  │
│                                          │  column called "CE hours".     │  │
│                                          └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
        ~52% width                                    ~48% width

Notes: no status is carried by colour alone — every tile shows a glyph (✓ ◑ ✕ –), a hatch
and, in its accessible name, the word. Nothing on this fold animates on load. AT RISK is
90 days, matching the first alert gate (specs/07, D7) — the page and the product cannot
disagree about what "at risk" means.

Deleted from the wave-1 wireframe, and it must not come back: the CTA "Start with one state
— $149" and the microcopy "We build the roster from the public registers. 30 days or you
don't pay." Both belong to the deferred tripwire and the deferred roster build (D1, B3).
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

**A/B challengers: one, not two.** #2 — *"You cannot pull a permit on an expired licence…"* — with the
CSLB source link directly beneath the first clause, which is near-verbatim from the board.

**#1 — "No job stops because a licence expired." — is deleted from the test plan** (wave-1b **Q10**).
It is an outcome promise about the customer's business, `IDENTITY.md` §2 prohibits guaranteed-compliance
claims, and §5 of `OFFER.md` is built on the principle that we guarantee what we control and never the
customer's outcome. A headline the guarantee section refuses to stand behind is a headline that has to
be walked back in the first support conversation. It returns only if the founder accepts the risk **in
writing**; it is not a copy preference and no A/B result can settle it.

**What the chosen headline gives up, stated honestly:** it is problem-framed rather than outcome-framed, so
it carries less pull for a reader who is not already feeling the pain. That is an acceptable trade for cold
outbound traffic selected precisely because they are multi-state, and it is why the subhead must do the
outcome work.

### 2.3 Subhead — the MMUSP

Wiebe's rule: the hero must both match the message that brought the visitor **and** state what is uniquely
desirable. Our inbound message is *"you have N states and N renewal calendars"*.

> **StateReady tracks every licence and CE hour your crews hold, in every state you work in — each date
> shown with the board page it came from and the day we last checked it. Entering a new state? It writes
> the playbook.**

*(41 words.)* Message match = "every state you work in". Unique desirability = **"the board page it came
from and the day we last checked it"**, which is the one thing no alternative offers and the direct answer
to the only objection that matters.

**"bond and insurance certificate" is cut** (wave-1b **B2**). Across the nine committed records
`bond.amount` is unknown **23 times out of 23** and `bond.required` 21 of 23 — **there is not one bond
amount in the knowledge base.** A subhead selling bond tracking, above a demo that answers *"not yet
verified for this state"* on the bond row, is the page falsifying itself in one scroll. Bond and
insurance return to this line on the day the fields are verified, not before. What is left is what the
data can carry completely: **licence and CE, in every state, with the page and the date.**

**The second half is still not trimmable.** *"each date shown with the board page it came from and the
day we last checked it"* is the entire differentiator; without it the subhead describes a product three
other companies also claim to have.

### 2.4 CTA

**One CTA, repeated three times, never varied in wording:** hero, after the proof block, and in the
pricing block. **All three repetitions are inside the counted region and all three are counted** — the
CI rule measures the DOM between `#hero` and `#pricing`, so a repetition the deck does not count is a
number the build disagrees with (wave-1b **m9**).

- **Button:** `Start your free trial`
- **Microcopy beneath, all three placements:** *"14 days. No credit card."*

**Why the price came out of the button.** CXL's finding that custom CTAs convert 42% better than generic
ones still holds, and the wave-1 button — `Start with one state — $149` — applied it correctly to the
offer it was written for. That offer is deferred (D1). Putting a price in a button that leads to a free
trial would be the checkout surprise in reverse. The commitment level the button now matches is *"give
us an email address"*, and the microcopy removes the two anxieties that stop a compliance buyer at that
step: how long, and will you take my card. Both are answered in five words, above the fold, in the same
viewport as the button.

**Deleted, permanently, until the register-ingestion spike passes:** *"We build the roster from the
public registers. 30 days or you don't pay."* It promised a done-for-you roster build that has no spec,
no Must and no feasibility evidence (**B3**), and a Rollout Guarantee that is withdrawn (**D3**). It is
the single most persuasive sentence the wave-1 page had, and it is the one we cannot keep.

**Secondary action is not a CTA and must not look like one:** a quiet, in-flow text link, `↓ try it
without signing up`, anchoring to the demo. Wiebe's rule that passive CTAs count is respected by having
**no top navigation beyond Pricing and Demo**, both of which are same-page anchors.

## 3. Sections 3–8, in order

### §3 — The divergence exhibit *(37 words)*
V3 (below) at full width on mobile, in the hero on desktop. Caption:
> **Same state. Same regulator. Two trades.** Texas asks an HVAC contractor for 8 hours of continuing
> education before the licence expires, and an electrician for 4 — on different topics. Now multiply by
> every state you work in.

### §4 — What happens when a credential lapses *(97 words)*
Four quotes, each with its source and date rendered as a source chip (V5). No commentary, no dollar
figures. **The section's persuasive force is that we say nothing at all.**
> *"You cannot actively contract with an expired, inactive, or suspended license."* — California CSLB
> *"You may not engage in air conditioning and refrigeration contracting if your license has expired."* — Texas TDLR
> *"Licensee's license and insurance information must be active and current."* — NYC Department of Buildings
> *"…may [not] bring or maintain any action … for the collection of compensation … where a license is required."* — California Business & Professions Code §7031
>
> Three states. One rule. A lapse is not a fine — it is the right to work, and the right to be paid for it.

**Why a Texas line was added (wave-1b M18).** The wave-1 section quoted California and New York only,
and **neither is covered at launch** — a prospect who follows the argument down to the demo directly
beneath it would have asked about California and been told *"Not covered yet"*. The quotes stay,
because they are the best-sourced consequences we have and they are about the **category**, not about
our coverage. But the section now leads its middle line with a state we **do** cover, whose sentence is
verified in `kb-data/tx-hvac.json` (`licence_types[0].renewal.grace_period`, `status: verified`,
`confidence: high`, `tdlr.texas.gov/acr/contractor-renew.htm`, checked 2026-09-03) — so the reader who
tests the argument in the demo underneath finds the receipt rather than a refusal. The closing line's
"Three states. One rule." also does the coverage work implicitly: it says these are examples of a
category, not a claim about where we operate.

**Why §7031 and not the municipal permit clause** (which the first draft used): §7031 is the harder
consequence and it was re-verified independently at leginfo for PLAN.md A10's two-agent rule. Its
subdivision (b) — a customer of an unlicensed contractor *"may bring an action … to recover all
compensation paid"* — is deliberately **not** on the page. It is one step too far for a headline section
and belongs in the sample pack, where there is room to state it precisely.

**Prohibited in this section, permanently:** any figure for lost revenue, downtime or fines. Every such
number published in this category is an unsourced vendor estimate (`RESEARCH.md` §3.2) and PLAN.md A10
forbids ours. **The EPA 608 $44,539/day penalty is banned outright** on every surface until an agent
opens a `.gov` source for it; `epa.gov`'s penalty-adjustment page 404'd (`identity/sources.md` row 22).
**No Illinois plumber CE hour count** anywhere either — IDPH confirms the 30 April deadline and the
annual obligation; the hour count is secondary-source only (`offer/RESEARCH.md` G3). Use the date,
never the hours.

### §5 — The demo *(31 words)*
Heading: **See your own state's rules before you give us anything.**
Instruction line: *"Pick a state and a trade. No email, no account. Every answer shows where it came from
and when we checked."* Full spec in §12.

### §6 — How it works, three steps *(66 words)*
Rendered as V4's three-panel stepper, one sentence each.

| | Step | Copy |
|---|---|---|
| 1 | **You name your states and trades** | Two minutes. Pick them off the map. |
| 2 | **You drop in the spreadsheet you already keep** | It reads a messy file — merged headers, four date formats — and asks which format you meant instead of guessing. |
| 3 | **Nothing lapses quietly** | Alerts at 90, 60, 30 and 7 days, routed to whoever actually files. One PDF when a GC asks you to prove it. |

**Step 2 is the honest version of the wave-1 step 2**, which read *"We build the roster — we pull your
company's and your qualifiers' licence records from the public state registers, verify each against the
board's own page, and hand you back a calendar."* That is the deferred roster build (**B3**, D1): no
spec, no Must, no evidence anyone has read those fifteen registers. It was also the longest sentence on
the page and the one making the largest promise. What replaces it is smaller and true, and it names the
one detail that proves we have actually thought about the buyer's file — the date-format question,
which is `UX.md` §10 gap 4's "highest-consequence silent bug in the product".

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

### §8 — Guarantees strip *(34 words)*
**Two lines, not three**, in the founder-approved wording from `OFFER.md` §5.1 only, each a compression
of the guarantee it names — and the full text is one click away on `/legal/refunds`, which is where the
carve-outs and the caps live.

| line | compresses | full text |
|---|---|---|
| `Wrong against the source? We fix it in five business days and credit you a month.` | The Accuracy Guarantee | `OFFER.md` §5.1.1 |
| `Entry Pack contradicted by the board's own page? We rewrite it and refund you.` | The Entry Pack Guarantee | `OFFER.md` §5.1.2 |

**The third line is gone.** *"Your roster loaded and verified in 30 days, or you don't pay"* was the
Rollout Guarantee, which is **withdrawn** with the roster build it guaranteed (**D3**, D1).

**Two things may never appear in this strip, or anywhere on this page:**

- **The Alert Guarantee.** It is drafted in `OFFER.md` §5.3 with five carve-outs and a cap, and it does
  **not ship** until counsel has read it (`REVIEW.md` Q15). As first written it paid out on five
  behaviours the product itself designs — a licence added inside the alert window, a muted state, paused
  notifications, a bounced address, a paused subscription — at up to twelve months' fees a claim
  (**B4**). `specs/12` AC8 fails the build if its text appears on any rendered surface.
- **The reinstatement-fee guarantee**, in any form, ever (`OFFER.md` §5.4, `BACKLOG.md` NEVER).

**And the rule behind the compression:** a guarantee line on this page must be a **shortening** of the
canonical wording, never a **strengthening** of it. "We fix it in five business days" is shorter than
§5.1.1; "we make sure your data is right" would be a different, larger promise. `specs/12` AC8 asserts
the strip's lines against the canonical texts.

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
  abbreviation in **Barlow Condensed** at `--sr-text-2xs`/600 — the signage cut, which is exactly where
  signage goes. Count badge bottom-right when > 0.
- **Status rendering:** fill + edge + **glyph** (✓ / ◑ / ✕ / —) + hatch pattern. The word — **READY /
  AT RISK / LAPSED / NOT TRACKED**, the same four the product, the emails and the PDF use — appears in
  the tile's accessible name and in the hover panel. Never colour alone. **AT RISK means within 90
  days**, matching the first alert gate (`specs/07`, D7); the marketing page and the product must not
  disagree about what a colour means.
- **States not operated in are drawn hollow** — the board's own ground (`--sr-ground`, no fill) with a
  1px dashed `--sr-line-strong` edge and an `--sr-ink-3` label — so **expansion is visible as an
  absence**, which is the whole second half of the product sitting in the hero for free. (`--sr-paper`
  no longer exists as a token; the arbitration replaced it with `--sr-ground` plus the
  `data-theme="paper"` alternate.) A hollow tile carries **no status word** in its accessible name,
  because it has no status: *"Ohio — not in your footprint"*.
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
  count set in **Overpass Mono** at the top. Between 30 and 0 the ground carries the `--sr-risk-fill` wash; past
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
- **Form:** two rows, hairline `--sr-line` between, the **numerals in Overpass Mono at display size** with
  `tabular-nums` so 8 and 4 sit in the same column and the difference is spatial, not verbal. Set on
  `--sr-surface` with a `--sr-line-strong` top border — it should read as a page torn from a reference
  manual. On the board that surface is `#212724`, one value step up from the ground; the card is
  separated by value and a hairline, not by a shadow (`--sr-shadow-1/2` are `none` by design).
- **No motion, no accent colour.** Its credibility comes from looking like a document. §7.4 rule 6 gives it
  one accent maximum; it uses none.
- **Rendered from the knowledge base, never hard-coded.** If TDLR changes the hours and the KB updates, the
  card updates. A stale number here discredits the entire premise of the page.

### V4 — The Entry Pack Steps *(section 6 — "when")*
- **Argument:** *entering a state is a known sequence in a known order, not a mystery — and we tell you
  which parts the board does not publish.*
- **Form:** **seven** numbered step cards in a single column (desktop: two columns), each ~40px tall
  with a title and a one-line artefact name. **Rendered expanded on load** — the earlier draft's
  scroll-triggered accordion unfold is forbidden by §8.5.
- **The steps, and the one that was deleted:**

  | # | step | artefact line |
  |---|---|---|
  | 1 | Which licence, and who must hold it | `Licence class + qualifier` |
  | 2 | What the qualifier must evidence | `Experience + exam` |
  | 3 | What reciprocity does **not** waive | `Your licences, checked both ways` |
  | 4 | Renewal cycle and date rule | `When it expires, and why that date` |
  | 5 | CE: hours, topics, delivery | `Hours + mandated subjects` |
  | 6 | Fees, as published | `Each fee the board prints` |
  | 7 | **What the board does not publish** | `Named, with the pages we read` |

  **Deleted: the wave-1 step card reading `Bond amount + acceptable forms`** (wave-1b **B2**). Across
  the nine committed records there is **not one bond amount** — 23 of 23 unknown — so a step card
  promising one is a promise the delivered document breaks on page one. **Step 7 replaces it**, and it
  is the stronger card: a competitor's brochure has no equivalent of "here is what we could not find
  out and here is where we looked", and it is the visual form of the narrowed promise in `OFFER.md`
  §6.1.
- **Ordering carries the meaning:** the steps run in filing order, and the two that catch people out —
  step 2 (who can hold the qualifier) and step 3 (what reciprocity does *not* waive) — carry a small
  `--sr-risk` glyph. Marking them is honest, not decorative. **Step 7 carries no risk glyph**: it is
  not a warning, it is the method.
- **Motion:** click to expand a step to two sentences, `--sr-dur-2`, opacity + 4px. Collapsed by default
  below the title line.

### V5 — The Source Chip *(systemic micro-component)*
- **Argument:** *every number here has a provenance, and you can check it right now.*
- **Form:** an inline chip after any regulatory value — ⓘ glyph plus the source host in **Overpass
  Mono** at `--sr-text-xs` (`tdlr.texas.gov`). Hover / focus / tap opens a popover at `--sr-dur-2`: full page title,
  direct link, and `last checked 2026-09-03`.
- **This is not decoration; it is the brand.** It is the component `IDENTITY.md` §12 should spend the most
  care on. It appears in the hero card, §4, the demo, the sample pack and inside the app.
- **Accessibility:** a real link with an accessible name of the form *"Source: Texas Department of Licensing
  and Regulation, continuing education for air conditioning contractors, checked 3 September 2026"*.
  Popover is keyboard-dismissible; nothing depends on hover.
- **Rule:** a value with no verified source renders **no chip and no value** — it renders *"not yet
  verified for this state"*. Never a bare number.

### 4.1 Theme and print

**Rewritten against `../IDENTITY_ARBITRATION.md` §3.2, which reverses the wave-1 assumption.**

- **The board is the default, and the marketing page shows it.** `:root` is the deep graphite-green
  board (`--sr-ground #181D1A`, `color-scheme: dark`); **paper** (`#E9ECE8`, cool stone) is the
  alternate. Precedence, exactly as `design-system.css` implements it: `data-theme="board" | "paper"`
  wins, then `prefers-color-scheme` (a light preference resolves to **paper**), then the board.
  Wave 1 specified "light default, dark fully supported" and that is now wrong in both directions.
- **The first impression is a dark board, deliberately.** The hero object is not a document — it is a
  grid of status lights and a clock, which is the one artefact in the fleet that is conventionally
  dark, and the app's own palette rule is *"the status ramp **is** the palette, chrome is
  colourless"*: luminous green/amber/red on a deep ground is that rule at full strength. It is also
  what makes the page unmistakably not the other two apps in the fleet.
- **Paper is what leaves the building.** Print, the bid-package PDF, the shareable readiness link, the
  technician card and every alert email render on paper **whatever the viewer's theme**, because
  `PERSONA.md` §9 requires every artefact to be forwardable to someone who has never logged in — and a
  forwarded dark screenshot is not that. On this page that means: **the sample Entry Pack preview in
  §7 renders on paper**, inside the board page, and it reads as a document sitting on a desk. That
  contrast is doing argumentative work, not decorative work.
- **Both palettes are authored independently — no filter, no inversion.** Status semantics never change
  between them: green is READY in both; only lightness moves, so a coordinator who switches themes
  mid-task never re-learns the grid.
- **`@media print` forces paper**, drops shadows, **expands the V1 and V2 hatches** so a black-and-white
  bid packet still separates the four statuses, and prints provenance URLs in full after each rule. The
  landing page is printed more often than a marketing team expects — a coordinator prints it to show her
  GM.
- **`forced-colors`** is supported: the glyph and the word carry the status when the fills are replaced.
- **`prefers-reduced-motion: reduce`** sets every duration to `0.01ms` (never `0`, so `transitionend`
  still fires) and removes transforms. Because nothing on this page animates on load, the reduced-motion
  experience and the default experience are already nearly identical — which is the correct outcome.

## 5. Pricing block *(outside the word budget)*

Three cards, `Multi-State` visually recommended. Enterprise is a **published row** beneath them, not a
fourth card — a card would imply a self-serve path that does not exist, and a silence would leave the
twelve largest accounts on our own prospect list with nowhere to go (D4).

| | Single State | **Multi-State** | Platform |
|---|---|---|---|
| | $149/mo | **$349/mo** | $599/mo |
| | $1,490/yr | **$3,490/yr** | $5,990/yr |
| | 1 state · 25 techs | 5 states · 75 techs | 15 states · 250 techs |

**Required elements:**

- **The trial line, above the cards:** *"Every plan starts with 14 days free. No credit card."* This is
  the page's goal restated where the price anxiety peaks, and it is the answer to the question every
  alternative in the buyer's stack has trained them to ask.
- **The Enterprise row, beneath the cards, published rather than hidden:**
  *"More than 15 states? **Contact us** — we will send you a quote within two business days, or tell you
  we cannot help."* No number, because we have no basis for one and a made-up rate rots the whole card
  (**Q9**). But it is a **routable** row: the same route the app uses at the 16th state
  (`POST /enterprise-enquiry`, `specs/09`), so the outbound fleet has somewhere to send an account it
  cannot sell a $599 plan to, and the two-business-day promise is the only number on the row and one we
  control.
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
5. **What if we only work in one state?** — Single State, or honestly, a $99/yr tracker. Below roughly
   ten licensed people, a spreadsheet works and we say so.
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
| Fonts | **Barlow (400/500/600) + Barlow Condensed (500/600) + Overpass Mono (400/500)** per `../IDENTITY_ARBITRATION.md` §3.1 and `design-system.css` — **not Public Sans and IBM Plex Mono**, which are WageLens's. From Google Fonts, `font-display: swap`, **subset to Latin**, `preconnect` to `fonts.gstatic.com`. ≤ 90 KB total across the three families (Barlow Condensed is used only for tile abbreviations and column heads, so two weights suffice). The fallback stacks — `-apple-system … Arial` for text, `"Roboto Condensed", "Arial Narrow"` for display, `ui-monospace, SFMono-Regular, Menlo` for figures — must be set so the page is fully legible before the fonts land |
| Images | **Zero raster images above the fold.** No hero photograph, no stock, no logos |
| Total transfer, first view | **≤ 240 KB** including all three font families (raised from 220 KB with the third family; every other line of the budget is unchanged, and the tile grid already bought back ~20 KB against the geographic map an earlier draft specified) |
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
| `lp_trial_start` | the trial signup completes (magic link sent) | placement of the CTA that led here |
| `lp_checkout_start` / `lp_checkout_complete` | Stripe Checkout, from `/pricing` or in-app | price id, amount |
| `lp_enterprise_enquiry` | the Enterprise row's contact route is used | state count if given |
| `lp_faq_open` | an FAQ item expands | which |

**The three numbers that decide whether this page works:**

1. **`lp_demo_query` per `lp_view`.** The whole design thesis is that education happens in the demo. If
   fewer than ~20% of visitors run a lookup, the thesis is wrong and the page needs more prose, not less.
2. **`lp_demo_query` → `lp_cta_click` → `lp_trial_start`.** The demo's job is to convert
   audit-of-our-data into trust. This ratio is the measurement of Perceived Likelihood, the offer's
   binding constraint — and under D1 it now runs all the way to a measurable signup rather than
   stopping at a $149 checkout.
3. **`was_covered = false` rate.** Every uncovered state × trade lookup is a real prospect we turned away
   and a ranked backlog item for the knowledge base. This is the most commercially valuable signal the
   page produces and it costs nothing to collect.

**First tests, in order** (one variable at a time): **(a)** headline #6 vs **#2** (the CSLB sentence
with its source link beneath) — #1 is deleted from the test plan, not deprioritised (§2.2, **Q10**);
**(b)** V3 above vs below the fold on desktop; **(c)** CTA microcopy *"14 days. No credit card."* vs
*"No credit card. Cancel any time."*. **Nothing may be tested that changes what we promise** — a
headline, a guarantee line or a coverage claim is not an A/B variable, it is a decision.

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
- **The reinstatement-fee guarantee**, in any form, ever (`OFFER.md` §5.4, `BACKLOG.md` NEVER).
- **The Alert Guarantee**, until counsel has read the carve-outs and the cap in `OFFER.md` §5.3
  (`REVIEW.md` Q15). `specs/12` AC8 fails the build on its text.
- **Any claim that we build the customer's roster from the public registers**, until the
  register-ingestion spike (`BACKLOG.md` S10) returns a majority-positive verdict.
- **Any promise of a bond amount, an insurance minimum or an elapsed filing time** as a contents item,
  while those fields are `unknown` in the knowledge base (**B2**). Naming them as *"what the board does
  not publish"* is required; selling them is forbidden.
- **The EPA 608 $44,539/day penalty**, until an agent opens a `.gov` source. **Re-grep before every
  deploy.**
- **An Illinois plumber CE hour count.** The 30 April deadline is verified at IDPH; the hours are
  secondary-source only. Use the date, never the hours.
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
│  Late renewal           1.5× under 90 days · 2× over            ⓘ            │
│  Last checked           2026-09-03                                           │
│                                                                              │
│  ┌ What Texas does not publish ─────────────────────────────────────────┐   │
│  │ Bond amount · typical processing time                                 │   │
│  │ We read 5 TDLR pages looking for each. When a board doesn't say,     │   │
│  │ we don't either.                                        [what we read]│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌ Compare with ────────────────────────────────────────────────────────┐   │
│  │ Texas · Electrician        4 hours CE  ·  NEC, TX law, 16 TAC 73,    │   │
│  │                            NFPA 70E                              ⓘ   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  This is one state and one trade. You work in more than one.                 │
│                        [ Start your free trial ]                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**The bond row is gone from the default view, and the gaps panel replaces it** (wave-1b **M19**). The
wave-1 wireframe put a `Bond / insurance [from KB]` row in the flagship demo's **default** state, above
the fold — and `tx-hvac` has `bond.required` and `bond.amount` `unknown` and two of three insurance
fields unknown, so the first thing a cold prospect would have seen was *"not yet verified for this
state"*, on load, in the section whose entire job is proving our data is real. Correct behaviour, wrong
placement.

**The refusal is now a proof point instead of an accident.** The four rows above the panel are the ones
verified in every launch record — licence classes, renewal cycle, CE, late renewal — and the panel below
names what the board does not publish, says how many of its pages we read looking, and links them. It is
the same argument the page makes everywhere else, made about ourselves: *when a board does not say, we
do not either.* A prospect who has ever been handed a confident "6–8 weeks" by a vendor recognises the
difference immediately.

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
- **The gate is the roster, not the rules.** Free gives the *diagnosis* (what this state requires of
  this trade). It never gives the *remedy* (your licences, your dates, your alerts). That boundary is
  what makes the trial the obvious next step rather than a paywall — and under **D2 this demo is the
  single free entry point**: there is no free roster audit at launch (it would take technician names and
  licence numbers before an account exists) and no $149 tripwire.
- **It is `BACKLOG.md` M15**, ~3 dev-days with the marketing route, and it depends on M14. Wave 1
  specified it in full here and gave it no backlog id, so it was in neither the 34 dev-days nor
  anybody's sub-wave (wave-1b **M2**).

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
- [ ] **The default Texas × HVAC view contains no unverified value row**, and its gaps panel names
      every unverified field in `tx-hvac.json` with the count of pages read. Asserted against the
      committed record, so a KB change that fills the bond field updates the demo and breaks nothing.
- [ ] A `confidence: medium` value renders its note alongside its number.

---

## 13. Final copy deck — every word above the pricing block

This is the page, verbatim. **413 words**, against a 450 ceiling, **including the CTA's three
placements**, which is the number CI will measure. Anything not on this list is UI chrome, a source
chip, or demo output, and is excluded from the count by the rule in §1. Build from this; do not
paraphrase it.

**§2 Hero — 68 words** *(including CTA placement 1 and its microcopy)*
- Eyebrow: `HVAC · Plumbing · Electrical`
- H1: `Your spreadsheet knows the date. It doesn't know the rule.`
- Subhead: `StateReady tracks every licence and CE hour your crews hold, in every state you work in — each date shown with the board page it came from and the day we last checked it. Entering a new state? It writes the playbook.`
- CTA button *(placement 1 of 3)*: `Start your free trial`
- Microcopy: `14 days. No credit card.`
- Demo link: `↓ try it without signing up`

**§3 Divergence caption — 37 words**
> `Same state. Same regulator. Two trades. Texas asks an HVAC contractor for 8 hours of continuing education before the licence expires, and an electrician for 4 — on different topics. Now multiply by every state you work in.`

**§4 What happens when a credential lapses — 97 words**
- Heading: `What happens when a credential lapses`
- `"You cannot actively contract with an expired, inactive, or suspended license."` — California CSLB
- `"You may not engage in air conditioning and refrigeration contracting if your license has expired."` — Texas TDLR
- `"Licensee's license and insurance information must be active and current."` — NYC Department of Buildings
- `"…may [not] bring or maintain any action … for the collection of compensation … where a license is required."` — California Business & Professions Code §7031
- Closing line: `Three states. One rule. A lapse is not a fine — it is the right to work, and the right to be paid for it.`

**§5 Demo — 31 words**
- Heading: `See your own state's rules before you give us anything.`
- Instruction: `Pick a state and a trade. No email, no account. Every answer shows where it came from and when we checked.`

**§6 How it works — 66 words**
1. `You name your states and trades.` / `Two minutes. Pick them off the map.`
2. `You drop in the spreadsheet you already keep.` / `It reads a messy file — merged headers, four date formats — and asks which format you meant instead of guessing.`
3. `Nothing lapses quietly.` / `Alerts at 90, 60, 30 and 7 days, routed to whoever actually files. One PDF when a GC asks you to prove it.`

**§7 Proof block — 62 words**
- Heading: `What you can check before you pay`
- `A sample State Entry Pack page, redacted.` *(opens the inline preview / PDF)*
- `States and trades verified today, refreshed [date].` *(both values rendered from the knowledge base)*
- `Every date shows its source and the day we checked it.`
- `We are not a licence expediter. We do not file for you. We tell you exactly what to file, and exactly what to hand an expediter if you use one.`

*(Then the CTA repeats — **placement 2 of 3, 9 words** — `Start your free trial` + `14 days. No credit card.`)*

**§8 Guarantees strip — 34 words**
- Heading: `Two things we guarantee`
- `Wrong against the source? We fix it in five business days and credit you a month.`
- `Entry Pack contradicted by the board's own page? We rewrite it and refund you.`

**Then the CTA repeats a third time — placement 3 of 3, 9 words — and the pricing block begins. Total: 413.**

### What changed from the wave-1 deck, and what it cost

| § | was | is | why |
|---|---|---|---|
| 2 | `Start with one state — $149` + `We build the roster from the public registers. 30 days or you don't pay.` | `Start your free trial` + `14 days. No credit card.` | D1 and **B3**. The old microcopy promised a deferred roster build and a withdrawn guarantee in thirteen words — the most persuasive sentence on the page and the one we cannot keep |
| 2 | subhead sold `bond and insurance certificate` | licence and CE only | **B2**. 23 of 23 bond amounts are `unknown`; the demo underneath would have contradicted the subhead on load |
| 4 | 3 quotes, 76 words, California and New York only | 4 quotes, 89 words, **Texas added** | **M18**. Neither CA nor NY is covered at launch; the reader who tested the argument in the demo met a refusal |
| 6 | step 2 was `We build the roster…` (33 words) | `You drop in the spreadsheet you already keep…` | **B3**. Also the longest sentence on the page and the largest promise on it |
| 8 | three guarantees, 43 words | **two**, 34 words | **D3**. The Rollout Guarantee is withdrawn with the roster build it guaranteed |
| — | the repeated CTA was not counted | **all three placements counted** | **m9**. The deck said 398 and CI would have measured 403 |

**Net: the page got shorter and it promises less.** Every deletion was a promise we could not keep with
the knowledge base we have; every addition is a sentence a URL can settle.

### 13.1 Copy rules for whoever edits this next

- **Do not vary the CTA wording** between its three placements. Wiebe: one goal, one CTA; a varied CTA is
  two CTAs.
- **Do not add an adjective to a regulatory quote.** The quotes in §4 carry the page. Any word we add
  becomes a word the reader has to filter, and NN/g measured a 27% usability penalty for exactly that.
- **The subhead's second half is not trimmable.** *"each date shown with the board page it came from and
  the day we last checked it"* is the entire differentiator; without it the subhead describes a product
  three other companies also claim to have.
- **No line may promise a field the knowledge base does not carry.** Before adding a noun to the subhead
  or a step card to V4, count it: `python3 kb-scripts/validate.py` prints verified/unknown per record,
  and `KNOWLEDGE_BASE.md` §9.1 holds the field-level table. Bond, insurance minimums and processing
  times are the ones that are mostly `unknown` today.
- **Guarantee lines are compressions of `OFFER.md` §5.1, never restatements of them.** Shorter is fine;
  stronger is a different promise and `specs/12` AC8 will fail the build.
- **Re-run the count after any edit**, and update both §1's table and §13's per-section figures in the
  same commit. The number appears in three places on purpose; if they disagree, the deck is wrong and
  CI is right.
- **If a section must grow, another must shrink.** The ceiling is the design.
