# Phase 4 — IDENTITY ARBITRATION

**Decision document. Binding on `wagelens/`, `certly/` and `stateready/` until the founder overrides it in writing.**

**Author:** Brand Director, phase-4 fleet. **Date:** 2026-09-03.
**Supersedes:** `wagelens/IDENTITY.md §7.1`, `certly/IDENTITY.md §6.1–§6.5, §7.1, §14.1, §17.3`,
`stateready/IDENTITY.md §5.1, §6, §8.1, §8.3, §10` — on the specific points listed in §7 below and on
nothing else. Every other line of those three documents stands.
**Enforced by:** `scripts/identity-distinctness.py` (exit 0 required), plus each app's own
`identity/contrast.py` (exit 0 required).
**Amendment rule, inherited from the three identity files:** an amendment needs a fetched source and a
note of what it supersedes. A preference is not a source.

---

## 0. The problem, stated as a number

Three *Buyer & Identity* agents worked in parallel, each on one app, each without sight of the others'
output. All three independently chose **Public Sans + IBM Plex Mono on a warm or neutral paper ground
with chroma reserved for status**. Read one at a time, every one of those arguments is sound — all
three cite the US Web Design System, all three want tabular figures for a column of numbers, all three
are right that a regulated product should not look like a consumer app.

Read together, they are one brand wearing three names. Here is the collision measured rather than
asserted, in CIELAB ΔE76 between the three page grounds as they stood before this document:

| pair | ground A | ground B | ΔE76 | reading |
|---|---|---|---:|---|
| WageLens vs StateReady | `#FBF9F5` | `#FAF8F4` | **0.35** | below the just-noticeable difference. Literally the same paper. |
| Certly vs StateReady | `#F3F3EE` | `#FAF8F4` | **2.10** | one JND. Indistinguishable side by side. |
| WageLens vs Certly | `#FBF9F5` | `#F3F3EE` | **2.42** | one JND. |

Plus: **3/3 apps on the same UI typeface**, **3/3 on the same mono**, **2/3 with an identical dark
canvas** (`#12100E`), and **2/3 with an ink-filled primary button**. Certly's own author flagged it
before anyone asked — `certly/IDENTITY.md §17.3`, *"Sibling collision (blocking, for the
orchestrator)… Someone must diff the three palettes and the three type stacks before wave 2 scaffolds
anything"* — and StateReady's author recorded the same open item as assumption A5.

That is the founder's requirement failing: *identities completely different per app — structure,
workflow, UX/UI, colours, fonts — each shaped to resemble what its buyer already uses.* This document
allocates the differences and says what each app gives up to get them.

`scripts/identity-distinctness.py --selftest` replays those three pre-arbitration grounds and asserts
that the gate rejects all three pairs, so the guard cannot later be loosened back into this state
without the self-test saying so.

---

## 1. Method

`PIPELINE.md` stage order, run for real.

1. **Ideation.** Three allocation options, each argued from the buyer's chair (§2).
2. **Research.** The buyers' own tools opened and their served markup read, two attempts per URL,
   on 2026-09-03 (§2.4). Every claim about how a tool looks carries the fetch that produced it.
3. **Decision.** §3, with the losses recorded in §5 rather than buried.
4. **Implementation.** §7, applied to `IDENTITY.md`, `design-system.css` and `identity/samples.html`
   in the two apps that change.
5. **Self-check.** Three contrast scripts and one distinctness script, all exit 0 (§8).
6. **Iteration.** The first run of the distinctness script failed on a threshold I had written too
   strictly; the gate was rewritten to encode the founder's sentence exactly. Logged in §8.3.

**What this document does not do.** It does not touch any `PERSONA.md` or `UX.md`, except where those
files name a typeface or a colour literally (they do not — checked by grep). It does not re-open
positioning, tone, naming, or component inventories. It arbitrates the visual layer only, because
that is the only layer where the three apps collided.

---

## 2. Ideation — three allocations, from the buyer's chair

### Option A — "The federal form keeps the federal face" ← **chosen**

WageLens keeps Public Sans and IBM Plex Mono and does not change. Certly and StateReady each take a
distinct UI face and a distinct mono. The three grounds separate into warm bone, cool office white,
and a deep board.

**From the WageLens buyer's chair.** She is producing **Form WH-347, OMB control number 1235-0008** —
an actual US federal form with a Public Burden Statement on it. Public Sans is the typeface of the US
Web Design System. Of the three apps this is the only one whose *output artefact* is a federal
document, so it is the only one whose claim on the government's typeface is a fact about the product
rather than a preference.

**From the Certly buyer's chair.** She is a property or association management coordinator with
AppFolio, Buildium, Yardi, Rent Manager or CINC open. Those are cool, white, navy-chromed web apps
(§2.4). A warm stone ground borrowed from Procore is the *general contractor's* world — Certly's
*second* audience — and it is the exact borrow that collided with WageLens. Moving her ground to a
cool office white makes the app look like the desk she is sitting at.

**From the StateReady buyer's chair.** He is a licensing coordinator being asked "are we covered in
Ohio?" across a desk. His hero object is not a document — it is a board of status lights and a clock.
That is the one artefact in the fleet that is conventionally dark, and putting the readiness ramp on a
deep board is that app's own palette rule ("the status ramp *is* the palette") at full strength.

**Cost:** StateReady changes theme default, which is the largest single change in this document.

### Option B — "Rotate the government face to Certly"

Certly keeps Public Sans (ACORD 25 is American insurance paperwork); WageLens takes a slab-flavoured
ledger face; StateReady takes a signage face.

**From the buyer's chair, this loses.** ACORD 25 is published by ACORD, a private standards body — not
by a government. The USWDS argument, which is the whole reason any of the three agents reached for
Public Sans, simply does not apply to Certly's artefact; it applies to WageLens's. Option B also costs
a third app's rewrite for no gain: it changes WageLens, whose identity is the one the fleet is most
confident in (`wagelens/identity/CLAUDE.md` records the palette solved numerically against its own
checker, twice).

### Option C — "Differentiate on ground and structure only; keep Public Sans everywhere"

Cheapest to implement: one shared UI face, three grounds, three layout rhythms.

**From the buyer's chair, this loses too, and it is the option worth rejecting explicitly** because it
is the one a hurried fleet would pick. Typeface is the loudest single signal at a glance: three
products in three browser tabs set in the same face read as one company's product line no matter what
the grounds do. It also fails the founder's stated constraint (*at most one app keeps Public Sans*),
and it wastes the strongest available differentiator on nothing.

### 2.4 Research — the buyers' tools, opened

Fetched **2026-09-03** with a desktop user-agent; two attempts per URL; failures logged with their
status. Values are read out of the served markup, not remembered. This is the evidence for the
"resemble what the buyer already uses" half of the brief.

| tool | buyer | what the served markup actually contains | source |
|---|---|---|---|
| **AppFolio** | Certly A | deep navy `#05094F` / `#04065B`, pale blue `#D3EDFF`, action blue `#007BC7`, mint `#22D195` | `https://www.appfolio.com/` HTTP 200 |
| **Buildium** | Certly A | white and `#F8F8F8` grounds, navy `#153D58` / `#143C57`, green `#73B680`, grey `#2F2F31` / `#959597`; **Open Sans** via Google Fonts plus proxima-nova | `https://www.buildium.com/` HTTP 200 |
| **Rent Manager** | Certly A | white ground, orange `#F58220`, blue `#3777BC`; **Lato** via Google Fonts | `https://www.rentmanager.com/` HTTP 200 |
| **CINC Systems** | Certly A | **Inter + Playfair Display** via Google Fonts | `https://www.cincsystems.com/` HTTP 200 |
| **Yardi** | Certly A | **not obtained — HTTP 403 on two attempts.** No claim is made about it. | `https://www.yardi.com/` |
| **ServiceTitan** | StateReady | `--titan-blue-3 #0265DC`, blue `#1976D2`, greys `#F1F1F1` / `#BFBDBD`, and dark chrome values `#17191C` / `#22252A`; **Sofia Pro** headings, **Nunito Sans** body | `https://www.servicetitan.com/` HTTP 200 (also its shipped stylesheet, read by the StateReady agent) |
| **Housecall Pro** | StateReady | navy `#002942`, amber `#FFB706`, action blue `#0F77CC`; **Open Sans**, **Oswald**, **Plus Jakarta Sans** | `https://www.housecallpro.com/` HTTP 200 |
| **FieldEdge** | StateReady | navy `#09527E`, orange `#EA6211`, yellow `#EFD517` | `https://fieldedge.com/` HTTP 200 |
| **Jobber** | StateReady | **not obtained — HTTP 403 on two attempts.** Its published pricing was read earlier by the StateReady agent; its colours remain unverified. | `https://www.getjobber.com/` |
| **Procore** | WageLens | warm neutral ground `#F5F1ED` / `#ECE0D6` / `#D4CAC1`, ink `#595552`, accent `#FF5200`; tokens named `gray-rebar`, `yellow-crane` | read by two agents from `https://www.procore.com/` |
| **Foundation Software** | WageLens | `#F8C01B`, `#0C92D0`, `#254E77`, `#535353` | read by the WageLens agent |
| **QuickBooks** | WageLens | brand green `#2CA01C` in the logo SVG | read by the WageLens agent |
| **LCPtracker** | WageLens | `#426BAE`, `#007CBA` link blues | read by the WageLens agent |

**Three findings that decide allocations below.**

1. **The property-management stack is cool and white; the construction stack is warm.** AppFolio,
   Buildium and Rent Manager all sit on white or near-white with navy/blue chrome. Procore is the only
   warm-stone ground in the evidence, and it belongs to the *contractor's* world. Certly's warm paper
   was borrowed from the wrong buyer.
2. **Nobody in either stack uses Public Sans.** Buildium runs Open Sans, CINC runs Inter, Rent Manager
   runs Lato, ServiceTitan runs Sofia Pro + Nunito Sans, Housecall Pro runs Open Sans + Oswald.
   Choosing a distinct face per app costs no familiarity, because there is no shared incumbent face to
   be familiar with.
3. **A dark instrument surface is not foreign to the field-service buyer.** ServiceTitan's own shipped
   markup carries `#17191C` and `#22252A` at high frequency. That is an observation about their
   palette, not a claim about their dispatch board, and it is used here only as support for a decision
   whose primary driver is stated plainly in §3.2: **mutual distinctness is the founder's binding
   requirement, and one of the three has to take the dark end.**

---

## 3. The decision

### 3.1 Typography

> **WageLens keeps Public Sans and IBM Plex Mono. Certly moves to Source Sans 3 + Source Code Pro.
> StateReady moves to Barlow + Barlow Condensed + Overpass Mono. Google Fonts only; every family has a
> real fallback stack; no two apps share a family.**

| app | UI | display | mono | the persona evidence |
|---|---|---|---|---|
| **WageLens** | **Public Sans** | — | **IBM Plex Mono** | Its output is **WH-347**, a US federal form with an OMB control number and a Public Burden Statement (`wagelens/PERSONA.md §3`, `§13 R8`). Public Sans is the USWDS typeface, OFL-licensed. The mono is not decorative: the WH-347 is a nine-column typewriter artefact whose figures must align, and `PERSONA.md §7.4` makes the split rate `$12.25/.40` a structural error-preventer. **This is the only app in the fleet whose artefact is a government document, so it is the only one whose claim on the government's face is a fact rather than a preference.** |
| **Certly** | **Source Sans 3** | — | **Source Code Pro** | Her tools are Open Sans, Lato and Inter (§2.4) — humanist, open-aperture, small-size UI faces. Source Sans 3 is that register without being any of them; its **single-storey `g`** and humanist terminals separate it from Public Sans's Franklin skeleton at a glance. It was drawn for Adobe's own interfaces, which is the right lineage for a screen the buyer reads between two phone calls (`certly/PERSONA.md §2.10`). Source Code Pro is its designed superfamily partner, so limits and dates align in a mono cut from the same skeleton as the labels beside them — and `PERSONA.md §2.5` makes comparing `$1,000,000` against `$2,000,000` the buyer's core act. |
| **StateReady** | **Barlow** | **Barlow Condensed** | **Overpass Mono** | Barlow is a low-contrast grotesk drawn from **American public and transport signage** — the right lineage for a product whose entire subject is what happens when you cross a state line. Barlow Condensed is the signage cut, and it goes exactly where signage goes: the two-letter state tiles, the column heads, the runway lane labels. **Overpass Mono** descends, through Overpass, from **Highway Gothic**, the US Federal Highway Administration lettering — so licence numbers and CE hour counts are set in the family that already labels the road. `stateready/PERSONA.md §7` records a buyer who types "recip", "CEUs" and "the board" and `§2.4` a buyer with five minutes: large, plain, signage-legible type is what that persona asks for, and `IDENTITY.md §5.2` already resolved to borrow the incumbents' **type scale and not their typefaces**. |

**Fallback stacks** (in `design-system.css`, unchanged in shape from before):
WageLens `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, …` / `ui-monospace, "SF Mono", …`;
Certly `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, …` / `ui-monospace, …`;
StateReady `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, …`, display falls back to `"Roboto Condensed", "Arial Narrow"`, mono to `ui-monospace, SFMono-Regular, …`.
All three apps remain fully usable with Google Fonts blocked.

**All five families were confirmed to resolve at `fonts.googleapis.com/css2` on 2026-09-03 (HTTP 200,
real `@font-face` payloads).**

### 3.2 Ground and surface

> **One warm bone, one cool office white, one deep board.**

| app | default ground | surface | sunken | temperature | value (Lab L\*) |
|---|---|---|---|---|---:|
| **WageLens** | `#FBF9F5` warm bone | `#FFFFFF` | `#F6F2EB` | warm, hue 40° | **97.97** |
| **Certly** | `#E8EEF6` cool office white | `#FFFFFF` | `#DEE7F1` | cool, hue 214° | **93.87** |
| **StateReady** | `#181D1A` deep graphite-green board | `#212724` | `#0E1210` | cool-green, hue 144° | **10.16** |

Measured separation, from `scripts/identity-distinctness.py`:

| pair | ΔE76 | Lab ΔL\* | Lab ΔC\*ab | HSL Δhue | verdict |
|---|---:|---:|---:|---:|---|
| WageLens vs Certly | 7.87 | 4.11 | 6.71 | 174.3° | passes on **temperature** |
| WageLens vs StateReady | 87.87 | 87.81 | 3.21 | 104.0° | passes on **value** |
| Certly vs StateReady | 83.94 | 83.70 | 6.39 | 70.3° | passes on **value** |

**Why StateReady takes the deep end, said honestly.** The other two are structurally barred from it:
WageLens replaces *paper* (a payroll register that will be printed and signed), and Certly's own
identity forbids a dark status board on the grounds that it "looks like a monitoring console, which is
the wrong category". StateReady is the only app in the fleet whose hero object is **not a document** —
it is a tile map and a runway, a board of states and a clock. Its palette rule was already "the status
ramp *is* the palette, and chrome is colourless"; luminous green/amber/red on a deep board is that
rule at full strength, where on bone paper it was muted.

The buyer-familiarity argument for a dark ground is weaker than the others in this document and is not
overstated: ServiceTitan ships dark chrome values (§2.4), which shows a dark instrument surface is not
foreign to this buyer, but his own tools are light. **The primary driver here is mutual distinctness,
which is the founder's binding requirement, and the brief's own list of acceptable grounds names "one
deep or mid tone".** Stated plainly so a reviewer can attack the right argument.

**The mitigation is a real design idea, not a hedge.** StateReady keeps its complete light palette as
the **paper theme**, and paper is what *leaves the building*: print, the bid-package PDF, the shareable
readiness link, and every alert email. `stateready/PERSONA.md §9` requires every artefact to be
forwardable to someone who has never logged in — so:

> **The board is for the operator. Paper is for the forwarder.**

The paper theme is also what a viewer who has asked their OS for a light interface gets
(`prefers-color-scheme: light`), and `data-theme="paper"` / `="board"` override in both directions.
Status hues are identical across the two themes; only lightness moves, so a coordinator switching
themes mid-task never re-learns the map.

### 3.3 Ink and primary action

| app | ink | primary action | label | rationale |
|---|---|---|---|---|
| **WageLens** | `#1B1815` warm near-black | **brick `#8A3115`**, hue 14° | `#FFFFFF`, 8.30:1 | iron oxide: red-lead primer, brick, rusted rebar. Brand and action only — **never** a status, which is what makes its status system unambiguous. Unchanged. |
| **Certly** | `#0F1A2B` blue-black | **interaction blue `#14458C`**, hue 215.5° | `#FFFFFF`, 9.29:1 | *Changed.* It was ink, which collided with StateReady's ink button. Blue is the hue Certly had already declared as its single non-status hue for links and focus; the button now uses it too. **The rule stays intact — no *status* colour ever appears on a control** — and the result matches the navy/blue action chrome of AppFolio, Buildium and Rent Manager (§2.4). |
| **StateReady** | `#ECF2EE` on the board / `#131714` on paper | **ink**, which on the board is a **bone fill with a dark label** (`#ECF2EE` / `#0E1210`, 16.63:1) | inverts on paper | Unchanged rule, inverted result. On a deep board an ink button is a *light* button, so the three primary actions are brick, blue and bone — no two alike in hue or in polarity. |

### 3.4 Status: hue, tint and rendered form

The rule this fleet adopts, because three semantic ramps cannot each invent a new colour for "stop":

> **Every status must differ from its siblings' equivalent on all three of hue (≥ 8°), tint family, and
> rendered form.**

| meaning | WageLens | Certly | StateReady (board) |
|---|---|---|---|
| **good** | filed green **144.7°** `#116634`, dark ink on a **pale warm tint** `#E9F6EE` | meets **164.2°** teal `#0F6E55`, dark ink on a **pale cool tint** `#DCEDE8` | ready **155.2°** `#52D09C`, **luminous on a deep fill** `#0F3226` |
| **caution** | flag amber **40.7°** `#7A560A` on `#FDF3D8` | expiring **47.3°** olive-gold `#7A6209` on `#F2EBCE`; claimed-not-evidenced **45.2°**, one step deeper, on `#EDE3C0` | at risk **31.2°** signal orange `#F0A85A` on `#37260D` |
| **bad** | reject **5.7°** brick-red `#9C2A1E` on `#FDECEA` | gap **344.8°** crimson `#B01A40` on `#F8E1E7` | lapsed **355.1°** `#F98A93` on `#3B1A20` |
| **rendered as** | a **pill: 6px dot + word**, plus a **2px left edge on the ledger row** and a coloured **week-strip cell** | a **pill: glyph + word**, plus the **coverage bar** — segments of time on a track, where a gap is drawn as a *hole* — and the portfolio strip | a **map tile: fill + edge + abbreviation + count badge**, plus a chip with a glyph, a runway marker, and a left-edge bar on the licence card |
| **the loudest object on screen** | the ruled week grid | the coverage bar | the tile map |

Minimum hue separation across all nine chromatic statuses: **8.1°** (Certly's gap 344.8° vs
StateReady's lapsed 355.1°). No two apps share a tint family, and no two render status the same way.

**Accessibility is not weakened anywhere.** All three apps keep AA and keep the rule that status is
carried by word **plus** glyph/dot **plus** pattern, never by hue: WageLens's *dot + word* (`§5 P3`),
Certly's four-signal encoding, now extended to **seven states** (§4.2), and StateReady's *colour +
glyph + hatch + word*, which survives `forced-colors` and a black-and-white bid package.

### 3.5 Layout rhythm, radius, shadow, motion

Deliberately laddered so the three read as three at a glance, and so a screenshot of one cannot be
mistaken for a screenshot of another.

| | WageLens | Certly | StateReady |
|---|---|---|---|
| **shell** | fixed **left rail 216px** + 56px top bar | fixed **left nav 240px** + fluid content | **full-width top bar, board beneath** — no rail at all |
| **base size** | 15px | 16px | 16px, with a signage cut one step up for labels |
| **row height** | **36px** in the payroll grid, 44px elsewhere | **44px** (56px comfortable) | **48px** |
| **radius** | **2 / 4 / 6 / 10px** | **4 / 8 / 12px** | **6 / 10 / 16px** + 40px tiles |
| **shadow** | none on panels or tables — a border instead; two shadows, for sticky headers and modals only | **two elevations**; a card rests on paper with `shadow-1` | **none on anything that rests on the board** — a card is a value step plus a hairline; the sheet is the only shadow in the system |
| **motion** | 100 / 160 / 220ms. *Nothing in the grid moves.* No skeletons, no count-ups | 120 / 200 / 320ms. Motion earns its keep in **one** place — the extraction reveal, which *is* the explanation | 120 / 180 / 240ms. **Nothing moves more than 8px**; tiles never animate on load; `reduced-motion` goes to 0.01ms, never 0 |
| **signature device** | the **ruled ledger** and the **provenance card** | the **coverage bar**, with the gap as a hole | the **readiness tile grid** and the **runway** |

---

## 4. Two findings folded in from the wave-1b review

`certly/REVIEW.md` landed mid-arbitration and assigned two identity-side findings here.

### 4.1 B-15 — the document must match the implementation

The first arbitration edits landed in `design-system.css`, `contrast.py` and `samples.html` before
`IDENTITY.md` was rewritten, leaving §6 documenting a palette the CSS no longer had. Closed: §7 below
lists the sections rewritten in all three `IDENTITY.md` files, and every certification table in
`certly/IDENTITY.md §6.5` and `stateready/IDENTITY.md §6.3` is regenerated from the scripts with
`--md`, per those documents' own rule that no ratio is typed by hand.

### 4.2 B-03 — Certly's status system had four states and the engine has seven

The comparison engine emits `met`, `gap`, `asserted_only`, `not_checked`, `needs_review` at requirement
level and adds `expiring` and `no_certificate` at vendor level. The identity carried four. The missing
one that matters is **`asserted_only`** — the endorsement box ticked with no endorsement page attached,
which `certly/BACKLOG.md` calls *"the one thing in the category that is both true and uncomfortable"*
and `LANDING_SPEC.md §5 V1` calls the product's logo-equivalent.

**Decision, following the reviewer's own proposal.** Three states added, no fifth hue:

| state | tokens | glyph | fill pattern | word |
|---|---|---|---|---|
| `asserted_only` | `--c-ast-*` — **the Expiring hue, one step deeper** (`#4F3D06` / `#EDE3C0` / `#B7A25E` / `#5E4907`; dark `#CBA855` / `#322813` / `#60501E`) | **half-filled disc** | **vertical hatch** | **"Claimed, not evidenced"** |
| `not_checked` | `--c-nc-*`, achromatic aliases of `--c-ink-muted` / `--c-line-strong` | **em dash, no container** | **open, hairline edge** | **"Not checked"** |
| `no_certificate` | `--c-none-*`, same achromatic pair, dashed | **empty document outline** | **open, single diagonal rule** | **"No certificate"** |

`asserted_only` shares Expiring's hue **on purpose**: a claimed-but-unevidenced endorsement is a *kind
of caution*, not a new meaning, and `certly/IDENTITY.md §6.1` allows no fifth hue. It is separated by
its half-disc, its **vertical** hatch — the one pattern whose rules run with gravity, so it can never
be read as Expiring's 45° hatch — and its word. `not_checked` and `no_certificate` carry no chroma at
all, because neither is a judgement about a party.

`contrast.py` hard-fails on a duplicated glyph, pattern or word, so the guarantee extends to the new
states automatically; it now certifies **166 pairs** across seven statuses and both themes.

**And the vocabulary ruling is applied.** Per `certly/REVIEW.md §2.1`, **"Covered" is retired as a
status word**; the green state is **"Meets requirements"**, pill **MEETS**. Token names (`--c-ok-*`)
were vocabulary-neutral and did not change. The noun *coverage* survives in its form-derived sense —
the **coverage bar** keeps its name, and so do coverage lines and the coverage grid. Every occurrence
in `certly/identity/samples.html` is rewritten, including the `aria-label`s, which now say *"in
force"* about a policy period rather than *"covered"* about a party.

---

## 5. What each app loses, and why that is acceptable

Recorded rather than buried, because a decision document that only lists wins is not a decision
document.

### WageLens — loses nothing, and that is itself a cost

It keeps Public Sans, IBM Plex Mono, the warm bone ground, brick, the 15px base, the 36px rows and the
ledger. **What it gives up is the option to change later**: it is now the app whose visual system is
pinned by two siblings rather than one, and any future move off Public Sans re-opens this arbitration
for all three. Acceptable because its claim is the strongest of the three (§3.1) and because its
palette was already solved numerically against its own checker.

*Also lost:* the exclusive warm-paper position it reserved in `IDENTITY.md §14` is now formally its
own — the reservation is granted, and StateReady vacates it.

### Certly — loses the Procore ground, the ink button, and "four states"

1. **The warm paper `#F3F3EE` and its Procore lineage.** `IDENTITY.md §14.3` argued that "a cold
   blue-grey app opened next to Procore looks like it came from a different industry". That argument
   was made for the *general contractor*, who is Certly's **second** buyer. The recommended first buyer
   is at a desk in a property-management office (`PERSONA.md §1`), and her stack is white and navy
   (§2.4). **Acceptable because the app now resembles its actual first buyer's tools instead of its
   second buyer's** — and because Certly's own author named the ground and the ink as the negotiable
   parts of its claim (`§17.3`).
2. **The ink primary button.** `§5 P2` said "Buttons are ink". They now carry the interaction blue.
   **Acceptable because the rule P2 protects — *no status colour on a control* — is untouched**, and
   because the alternative was two sibling apps with identical ink buttons.
3. **"Colour means status and nothing else", in its absolute form.** The single non-status hue now
   does links, focus *and* the primary action. **Acceptable, and arguably better**: one hue with one
   job (interaction) is easier to hold than one hue with a licence for two of three interactions.
4. **"Four status hues and that is the whole list."** Now seven states — though still four hues, since
   the three added states borrow or drop chroma (§4.2).
5. **"Covered."** The word `PERSONA.md §2.5` chose. **Acceptable because `PERSONA.md` argues against
   itself here** (O-A6: *"a wrong 'covered' is the failure that ends the company"*), and because the
   buyer's real word by that same section — **"current"** — survives, in prose about a document.

*Not lost:* the coverage bar, the gap-as-a-hole, per-field confidence, the as-of stamp, the document
being present, `no backdrop-filter`, and the whole of §3's positioning.

### StateReady — loses the warm paper as its default, and its left rail

1. **Warm paper as the default ground.** It becomes the *alternate* theme, and it is re-toned from
   `#FAF8F4` to a cool stone `#E9ECE8` so that even the alternate is not a WageLens clone.
   **Acceptable because paper keeps the job it was actually load-bearing for** — every forwardable
   artefact (`PERSONA.md §9`) — and because `IDENTITY.md §5.1`'s distinctness rules that mattered are
   all preserved: **no blue at any weight**, no glass, no `backdrop-filter`, no document hero.
2. **"Warm ground, not cool slate" as the differentiator from Clausewright.** Replaced by a stronger
   set: Clausewright is translucent blue-slate (215°) at 17px on system fonts; StateReady is an opaque
   graphite-green (144°) board at 16px on Barlow, with no glass anywhere and a tile map instead of a
   cited clause. **Acceptable — the separation got wider, not narrower.**
3. **The left rail.** The shell becomes a top bar over a full-width board, which is the third distinct
   layout structure in a fleet where the other two both run left rails. Cheap: `.sr-shell` and
   `.sr-rail` are restyled, `.sr-bar` is added as the correct name, and the old class keeps working.
4. **Light-first marketing screenshots.** The product's marketing surface now shows a dark board.
   `IDENTITY.md §13.7`'s "no dark-mode marketing" rule was **Certly's**, not StateReady's, so nothing
   is contradicted — but it is a real change of first impression and the founder should see it (§9).

*Not lost:* the tile grid, the runway, the 90/60/30/7 gates, the provenance line, the CE meter, the
refusal state, `forced-colors` support, and print.

---

## 6. The side-by-side

| | **WageLens** *(unchanged)* | **Certly** *(changed)* | **StateReady** *(changed)* |
|---|---|---|---|
| **buyer's stack** | QuickBooks, Foundation, LCPtracker, Procore | AppFolio, Buildium, Yardi, Rent Manager, CINC | ServiceTitan, Housecall Pro, Jobber, FieldEdge |
| **UI typeface** | **Public Sans** | **Source Sans 3** | **Barlow** (+ **Barlow Condensed** for signage) |
| **mono typeface** | **IBM Plex Mono** | **Source Code Pro** | **Overpass Mono** |
| **ground** | warm bone `#FBF9F5` (hue 40°, L\* 98.0) | cool office white `#E8EEF6` (hue 214°, L\* 93.9) | deep graphite-green board `#181D1A` (hue 144°, L\* 10.2) |
| **surface / sunken** | `#FFFFFF` / `#F6F2EB` | `#FFFFFF` / `#DEE7F1` | `#212724` / `#0E1210` |
| **alternate theme** | dark `#12100E` (warm black) | dark `#0B1220` (blue-black) | **paper** `#E9ECE8` (cool stone) |
| **ink** | warm near-black `#1B1815` | blue-black `#0F1A2B` | bone `#ECF2EE` on the board |
| **primary action** | **brick `#8A3115`** (hue 14°), white label | **blue `#14458C`** (hue 215.5°), white label | **bone `#ECF2EE`**, dark label — a light button on a dark board |
| **status hues** | 144.7 / 40.7 / 5.7° | 164.2 / 47.3 (+45.2) / 344.8° | 155.2 / 31.2 / 355.1° |
| **status tints** | pale **warm** | pale **cool** | **deep fills** |
| **status rendered as** | **pill (dot + word)** + ledger-row left edge + week-strip cell | **pill (glyph + word)** + **coverage bar** (gap = a hole) + portfolio strip | **map tile** (fill + edge + abbreviation + badge) + chip + runway marker |
| **status states** | filed / needs review / rejected / draft / not started | **7:** meets · expiring · claimed-not-evidenced · gap · needs review · not checked · no certificate | ready · at risk · lapsed · not tracked |
| **density** | base 15px, **36px** grid rows, 4px scale | base 16px, **44px** rows, 4px scale | base 16px, **48px** rows, 4px scale, 40px tiles |
| **radius** | **2 / 4 / 6 / 10px** | **4 / 8 / 12px** | **6 / 10 / 16px** |
| **shadow policy** | none on panels and tables (borders); two shadows for sticky header and modal only | two elevations; cards rest on paper with `shadow-1` | **none on any resting surface**; the sheet is the only shadow |
| **motion policy** | 100/160/220ms; **the record never moves** — focus and selection only | 120/200/320ms; **motion explains the reading** — the extraction reveal, and nothing else | 120/180/240ms; **≤8px, never on load**; tiles never animate in |
| **layout structure** | left rail 216px + top bar; the week grid scrolls in its own container | left nav 240px; the **split view** (document \| extraction) is its structural signature | **top bar over a full-width board**; the dashboard is map \| runway |
| **signature device** | **the ruled ledger + the provenance card** | **the coverage bar, gap as a hole** | **the readiness tile grid + the runway** |
| **the one sentence** | a payroll register that shows where every rate came from | a status board that reads the certificate and dates the answer | a board of states and a clock |

---

## 7. What was changed, file by file

Only the files named in the brief were touched. `PERSONA.md` and `UX.md` were **not** edited in any
app — checked by grep: none of them names a typeface or a colour literally.

### 7.1 `wagelens/` — pointer only
- `IDENTITY.md`: an **"Arbitration 2026-09-03"** section at the top, plus §14's distinctness table
  filled in with the two siblings' now-real values (it previously carried two placeholder rows).
- `design-system.css`, `identity/samples.html`, `identity/contrast.py`: **untouched**.

### 7.2 `certly/`
- `design-system.css`: font tokens → Source Sans 3 / Source Code Pro; the Google Fonts link in the
  header comment; ground/sunken/line/line-strong/select-bg; all four status ramps in light and both
  dark blocks; `--c-action*` tokens; `.c-btn--primary`, `.c-tab[aria-selected]` and the reminder
  offset toggle now use the interaction hue; the three new states' tokens, pills, dots, bar segments
  and strip segments; the print block.
- `identity/contrast.py`: the palette dicts, the new declared pairs, `STATUS_MARKS` extended from four
  to seven with distinct glyph/pattern/word, and the redundancy check's message.
- `identity/samples.html`: the font link; the typography specimen labels; the hue prose; the printed
  ratios; the status section extended to seven states in both the colour and the greyscale panel; the
  coverage bar extended to seven segment types; every "Covered" retired.
- `IDENTITY.md`: **Arbitration** section at the top, then §6.1 (rationale and hue angles), §6.2 and
  §6.3 (token tables), §6.4 (the seven-state encoding), §6.5 (**both certification tables regenerated
  from `contrast.py --md`**), §7.1 (families), §4.2 (the retired word), §5 P2 (the interaction-hue
  amendment), §9.1 (glyphs), §12.7 (the pill), §12.12 (the button), §14.1 (distinctness), §15 (the
  "no brand accent" omission restated), §17.3 (the collision, now resolved).

### 7.3 `stateready/`
- `design-system.css`: the Google Fonts `@import` → Barlow / Barlow Condensed / Overpass Mono; three
  font tokens; `--sr-paper` renamed **`--sr-ground`** throughout; `:root` is now the **board** with
  `color-scheme: dark`, and the **paper** theme moves to `prefers-color-scheme: light` +
  `[data-theme="paper"]` / `[data-theme="light"]`, with `[data-theme="board"]` / `["dark"]` forcing the
  board; elevation policy; `--sr-row-h: 3rem`; the shell becomes a top bar (`.sr-bar`, with `.sr-rail`
  kept as a working alias); the signage face on tiles, column heads, runway labels and eyebrows; the
  print block forced to paper.
- `identity/contrast.py`: `LIGHT`/`DARK` become **`BOARD`/`PAPER`** (aliases kept so existing callers
  still work), all tokens re-authored, the `paper` key renamed `ground`.
- `identity/build-samples.py` and the generated `identity/samples.html`: swatch source, ratio labels,
  the colour and typography prose, the elevation note, the logo mark's check colour, and the theme
  toggle (now *Switch to paper* / *Switch to the board*, with the three-state precedence rewritten).
- `IDENTITY.md`: **Arbitration** section at the top, then §5.1 (distinctness), §6.1 and §6.2 (the two
  palettes), §6.3 (**both certification tables regenerated from `contrast.py --md`**), §8.1
  (typefaces), §8.2 (row height and shell), §8.3 (elevation), §8.4 (the logo mark), §10 (the theme
  policy, rewritten as board/paper/print), §11 (the self-review row on distinctness).

### 7.4 New files
- `IDENTITY_ARBITRATION.md` — this document.
- `scripts/identity-distinctness.py` — the guard (§8).
- `brand/CLAUDE.md` — the Brand Director's memory, per `PIPELINE.md`'s fifth pillar.

---

## 8. Self-check

### 8.1 Results

| script | what it proves | result |
|---|---|---|
| `python3 wagelens/identity/contrast.py` | 72 pairs, 39 light + 33 dark, WCAG 2.1 AA | **exit 0** |
| `python3 certly/identity/contrast.py` | **166** pairs: 62 contrast + 21 greyscale, × 2 themes, seven statuses with distinct glyph/pattern/word | **exit 0** |
| `python3 certly/identity/contrast.py --css` | every declared token and every light value is present in `design-system.css` | **exit 0** |
| `python3 stateready/identity/contrast.py` | 70 pairs, 35 per theme; smallest text margin 4.89:1 against 4.5, smallest non-text 3.15:1 against 3.0 | **exit 0** |
| `python3 scripts/identity-distinctness.py` | 3 ground pairs and 3 typeface pairs, no shared family, no ground collision | **exit 0** |
| `python3 scripts/identity-distinctness.py --selftest` | the gate rejects all three pre-arbitration ground pairs | **exit 0** |

Each `identity/samples.html` renders with **no external resource but Google Fonts** — verified by
grepping every URL out of each file: WageLens and Certly carry two `preconnect`s and one stylesheet
link to `fonts.googleapis.com`; StateReady's carries **no URL at all**, because its font request is the
`@import` inside `design-system.css`.

### 8.2 What the distinctness gate actually asserts

`scripts/identity-distinctness.py` parses the three `design-system.css` files — not a manifest, not a
copy of the values — and fails if:

1. **any two apps declare the same branded font family** in any `--*font*` token. Generic fallbacks
   (`sans-serif`, `ui-monospace`, `-apple-system`, `Arial`, …) are ignored on purpose: the fallback
   stacks are shared by design and carry no identity.
2. **any two default grounds are too close.** The gate encodes §3.2's sentence and nothing stricter:
   a hard floor of **ΔE76 ≥ 6.0**, then separation on at least one axis in Lab (**ΔL\* ≥ 8** *or*
   **ΔC\*ab ≥ 5**), and the same test again in HSL (**Δhue ≥ 25°** *or* **ΔL ≥ 5%**), so the two colour
   spaces have to agree.

Only the **default** `:root` ground is compared. Alternate themes are excluded deliberately and the
exclusion is documented in the script: every dark canvas in the world is a near-black, so a rule over
them would fail for reasons that carry no brand meaning.

### 8.3 Iteration log (PIPELINE.md stage 6)

- **Round 1.** The first gate required `ΔE76 ≥ 12` **and** an axis test. It failed WageLens vs Certly
  at ΔE 7.87 — two grounds that differ by 174° of hue and are obviously two different papers. That
  threshold was stricter than the brief, which says grounds must differ *"in temperature or value"* and
  offers *"one warm bone, one cool white"* as an acceptable pair. Rather than darken Certly's paper
  until an arbitrary number was satisfied, the gate was rewritten to encode the brief's own sentence,
  and `--selftest` was added so the looser floor still demonstrably rejects the palettes this
  arbitration replaced (ΔE 0.35 / 2.10 / 2.42).
- **Round 2.** StateReady's first board ramp put `ready` at 150.3° and `lapsed` at 5.2°, within 6° of
  WageLens's equivalents. Both were moved (155.2° and 355.1°) and re-certified, taking the minimum
  hue separation across all nine chromatic statuses from 0.5° to **8.1°**.
- **Round 3.** Certly's first cool ground put `--c-line-strong` at 2.83:1 against the new sunken well,
  below the 3:1 that WCAG 1.4.11 requires for the upload drop-zone border. Sunken and line-strong were
  solved together (`#DEE7F1` / `#718094`, 3.22:1) rather than eyeballed.
- **Round 4.** `certly/REVIEW.md` B-03 and B-15 arrived mid-implementation and are folded in at §4.

---

## 9. Open points for the founder

1. **StateReady's default theme is now dark.** This is the largest visible change in the document and
   the one whose buyer-familiarity argument is the weakest (§3.2, stated plainly there). The
   alternative that keeps a light default is a mid-tone stone ground at roughly ΔE 9–11 from
   WageLens's bone — distinct enough to pass the gate, much less distinct to the eye. **If you want
   StateReady light, say so and it becomes a one-line token swap plus a regenerated samples file; the
   paper theme is already fully authored and certified.**
2. **Certly's status vocabulary changed under a reviewer's ruling, not mine.** "Covered" is retired in
   favour of "Meets requirements" (`certly/REVIEW.md §2.1`). It is applied here in the identity files
   only. The same ruling has to reach `PERSONA.md`, `UX.md`, `specs/05`, `specs/06`, `specs/12` and
   `LANDING_SPEC.md`, which are not mine to edit. **Somebody must own that sweep or the counters and
   the report will drift.**
3. **The requirement-level rename `needs_review` → `undetermined`** (`certly/REVIEW.md §2.2`, MN-04) is
   a product/spec decision and is **not** applied here. The identity still calls the state "Needs
   review". If the rename is upheld, one word changes in `contrast.py`'s `STATUS_MARKS` and in
   `samples.html`.
4. **Three trademark clearances are still outstanding** and none was possible from this environment —
   CraftWage/ChalkWage, Coverfile, StateReady. Unchanged by this document; repeated because the
   typeface and colour work is now done and naming is the remaining brand risk.
5. **WageLens is now pinned.** Any later decision to move it off Public Sans re-opens this arbitration
   for all three apps. Worth knowing before someone proposes it in wave 2.
6. **Nothing here has been seen by a buyer.** Every "resembles what the buyer already uses" claim in
   §2.4 is grounded in the vendors' own served markup, but the *inference* from that to "this will feel
   familiar" is design judgment. The cheapest test remains the one WageLens's author proposed: put the
   three `samples.html` files in front of five people in each role and ask what kind of company made
   each one — and, this time, whether they look like three companies.

---

## 10. Sources

Fetched **2026-09-03** from this environment. Persona and identity sources are in the three apps' own
files and are not repeated.

| what | url | result |
|---|---|---|
| Google Fonts CSS API — Source Sans 3 | `https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap` | HTTP 200 |
| Google Fonts CSS API — Source Code Pro | `…?family=Source+Code+Pro:wght@400;500;600&display=swap` | HTTP 200 |
| Google Fonts CSS API — Barlow | `…?family=Barlow:wght@400;500;600;700&display=swap` | HTTP 200 |
| Google Fonts CSS API — Barlow Condensed | `…?family=Barlow+Condensed:wght@500;600;700&display=swap` | HTTP 200 |
| Google Fonts CSS API — Overpass Mono | `…?family=Overpass+Mono:wght@400;500;600&display=swap` | HTTP 200 |
| Google Fonts CSS API — Public Sans, IBM Plex Mono (re-confirmed, unchanged) | `…?family=Public+Sans…`, `…?family=IBM+Plex+Mono…` | HTTP 200 |
| AppFolio — navy/blue palette read from served markup | `https://www.appfolio.com/` | HTTP 200 |
| Buildium — Open Sans, white ground, navy and green read from served markup | `https://www.buildium.com/` | HTTP 200 |
| Rent Manager — Lato, white ground, orange and blue | `https://www.rentmanager.com/` | HTTP 200 |
| CINC Systems — Inter + Playfair Display via Google Fonts | `https://www.cincsystems.com/` | HTTP 200 |
| Yardi | `https://www.yardi.com/` | **HTTP 403, two attempts — no claim made** |
| ServiceTitan — Sofia Pro / Nunito Sans, `#0265DC`, dark chrome `#17191C` / `#22252A` | `https://www.servicetitan.com/` | HTTP 200 |
| Housecall Pro — Open Sans / Oswald / Plus Jakarta Sans, navy and amber | `https://www.housecallpro.com/` | HTTP 200 |
| FieldEdge — navy `#09527E`, orange `#EA6211`, yellow `#EFD517` | `https://fieldedge.com/` | HTTP 200 |
| Jobber | `https://www.getjobber.com/` | **HTTP 403, two attempts — colours remain unverified** |
| WH-347 instructions (OMB 1235-0008), the artefact behind WageLens's typeface claim | `https://www.modot.org/sites/default/files/documents/Instructions%20For%20Completing%20Payroll%20Form%20WH-347%20_%20U.S.%20Department%20of%20Labor.pdf` | read by the WageLens agent, 2026-09-03 |
| Public Sans — USWDS typeface, OFL 1.1 | `https://github.com/uswds/public-sans` | read by the WageLens agent, 2026-09-03 |
| Contrast certifications | `wagelens/identity/contrast.py`, `certly/identity/contrast.py`, `stateready/identity/contrast.py` | run; all exit 0 |
| Distinctness certification | `scripts/identity-distinctness.py` | run; exit 0, and `--selftest` exit 0 |
| The review findings folded in at §4 | `certly/REVIEW.md` B-03, B-15, §2.1, §2.2 | read in full |
