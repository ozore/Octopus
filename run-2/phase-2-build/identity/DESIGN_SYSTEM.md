# RATEPIN — DESIGN SYSTEM (v1)

**Product:** Ratepin — certified-payroll rate-of-record engine for open-shop specialty subcontractors on Davis-Bacon work.
**Implementation:** `/home/user/Octopus/run-2/phase-2-build/identity/design-system.css`
**Date:** 2026-08-13
**Status:** Binding for the Phase-2 build. Amendments require a named source and a note of what they supersede.

**Upstream sources, treated as inputs and not re-derived here:**

- `/home/user/Octopus/run-2/phase-1-ideation/IDEA_DOSSIER.md` — binding decisions **D1–D10**, measurement gates **G1–G6**, risks **R1–R3**.
- `/home/user/Octopus/run-2/PLAN.md` — the autonomy gate **A1–A6**. A3 in particular: *no escalation path to a human*.
- `/home/user/Octopus/run-2/phase-2-build/architecture/ARCHITECTURE.md` — invariants I1–I7, the three artifact statuses (§6.3), the freshness ladder (§6.4), ADR-008 (we own the WH-347 geometry), ADR-012 (two layouts).
- `/home/user/Octopus/run-2/phase-2-build/architecture/USER_JOURNEY.md` — the four refusal primitives P-A…P-D (§0.3), the screen inventory S00–S24 (§0.6), the provenance footer (§7.3), the copy lint (§16), the accessibility target (§18).
- `/home/user/Octopus/run-2/phase-2-build/architecture/ENGINE.md` — the classification lattice L-A…L-F (§ candidate ranking), which the picker in §8.6 renders.
- `/home/user/Octopus/run-2/phase-2-build/identity/NAMING.md` — **the naming gate**, which explicitly blocks this document. The name, the wordmark rules (§7.1), the SKU display names (§7.3) and the seven naming invariants (§8).
- The four phase-1 deep dives, whose verified findings bind the copy this system is allowed to set.

> **Naming supersession, recorded.** `NAMING.md` struck the phase-1 working name **Wage Line** and set **Ratepin** in its place, on four grounds — including invariant 2, *never imply a person is reachable*, which the word `Line` violates outright under A3. This document is written against the new name. Three consequences a reader coming from the architecture set should know:
>
> 1. The token and class prefix is **`rp-`**, not `wl-`. `ARCHITECTURE.md`, `CORPUS_DESIGN.md`, `ENGINE.md` and `USER_JOURNEY.md` were written before the gate landed and still say *Wage Line*; they need a name pass, and nothing in them depends on a class name.
> 2. The brand hue is named **`pin`**, not `line` or `accent` — `NAMING.md` §8 invariant 7 is *brand the pin, not the form*, and the hue that marks a pinned wage determination should carry that noun (§4.1).
> 3. The $49 SKU displays as **Bid Sheet** (`NAMING.md` §7.3). Price, metering and packaging are unchanged from **D4**.

---

## 0. The question every token answers

Run 1's design system (Clausewright) answered: *how does an interface stay calm for someone panicking at 2am?* Its answer was translucency, generous whitespace, muted forest green, and a serif document face.

Ratepin's user is not panicking. `USER_JOURNEY.md §0.1` states the difference precisely and it is the hinge of this whole document:

> **The user is not panicking; the user is bored and behind.** Dee has done this 180 times. She is doing it at 3:40pm on a Friday between two other things, on a fifteen-inch laptop in a job trailer or a strip-mall office.

So the question here is:

> **How does an interface let someone who has done this 180 times get through it in four minutes without misreading a number — on a bad screen, in bad light, at the end of a bad week, when the document she is about to sign carries a federal certification under [18 U.S.C. 1001](https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf)?**

Everything below follows from that. It produces a system that is, deliberately and almost point-for-point, the inverse of run 1's: **paper instead of glass, rules instead of shadows, density instead of air, ink instead of accent, and colour that only ever means state.**

---

## 1. The five rules

Five rules, not seven principles. Each is traceable to a published source and to a binding upstream decision, and each has a falsifiable test that can be checked in review rather than argued about.

### R1 — Paper, not glass. Hierarchy is carried by rules, weight and ground tone. Never by shadow, never by blur.

**Source.** WCAG contrast ratio is defined as a function of *two rendered colours* ([WCAG 2.2, contrast ratio](https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio)). A `backdrop-filter` surface has no fixed rendered colour. Run 1 solved this with a Bounded Backdrop Rule; that solution is sound but it buys an aesthetic this product has no use for.

**Applied here.** There is no `backdrop-filter` in this system, no `box-shadow` used for elevation, and **no elevation scale at all**. The entire depth vocabulary is: three opaque surfaces (`--rp-ground` the desk, `--rp-surface` the sheet, `--rp-sunken` the inset), a decorative hairline (`--rp-rule`), a meaningful boundary at ≥3:1 (`--rp-rule-strong`), and a 2px structural rule in full ink (`--rp-rule-ink`). The 2px ink rule is the system's one signature: it sits under the wordmark, under every table head, above every table foot, above every provenance block, and under the app header. It is the same mark in all five places because it means the same thing in all five: *below this line, the content is of record.*

Three reasons this is not merely taste:

1. **The screen is bad.** The stated operating envelope (§2) includes TN panels whose gamma shifts with viewing angle. A translucent composite on a panel with unstable gamma has an unstable contrast ratio in a second, uncontrollable dimension. An opaque surface does not.
2. **The artifact is printed.** A design whose hierarchy is carried by shadow has no hierarchy on paper. This product's output is a document that goes to a general contractor, is often faxed, and is read eighteen months later in a dispute (`ARCHITECTURE.md §5.3`). Hierarchy that survives 1-bit halftoning is hierarchy carried by rules and weight.
3. **Flatness forces the accessible thing.** With no shadow available to say "this is a control", every interactive element must carry a visible ≥3:1 border at rest — which is exactly what [SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) requires anyway. The constraint pays for itself.

**Test.** Grep the codebase for `backdrop-filter`, `filter: blur`, and `box-shadow`. The only permitted `box-shadow` uses are: the focus halo, and the 3px `inset` start-marker on table rows and picker options. Any other occurrence is a review failure.

### R2 — Colour means state. It never means brand, and it never means "this is the button."

**Source.** [SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) forbids colour as the *sole* carrier of meaning. This rule is stronger than the criterion: it forbids colour as a carrier of *anything else*, so that when colour does appear it is unambiguous.

**Applied here.** The palette has exactly four hues and each has exactly one job:

| Hue | Means, and means only | Where it may appear |
|---|---|---|
| **ok** (green) | `CERTIFIABLE` | status chip, resolved-row settle, dropzone accepted border |
| **dated** (ochre) | the freshness claim has narrowed (**P-C**) | status chip, `--narrowed` banner, provenance freshness line, asserted-value row marker |
| **draft** (oxide red) | **do not sign this** (**P-A**, **P-B**) | status chip, watermark, withheld signature block, blocked row, `--blocked` banner, invalid field, destructive button |
| **pin** (deep blue) | provenance, links, focus, selection | links, focus ring, selected row/option, `--notice` banner |

And the consequence that makes the rule real: **the primary action is filled with ink** (`--rp-ink`, near-black warm, 18.71:1 against the sheet). Not green, not blue. A Ratepin screen has exactly one filled black button on it, and everything coloured on that screen is telling you something about the state of a filing.

**A deliberate inversion of run 1.** Clausewright reserved rose for destructive actions and system failure, and explicitly refused to render an Amazon rejection in red, because the design job there was *"this is not the end of the road."* Ratepin inverts that. The strongest signal in the palette belongs to the strongest instruction in the product — **do not sign this** — because `R3` in the dossier names the failure mode exactly: *a wrong rate on a signed certified payroll is a federal false statement.* There is no reading of that risk under which the softest colour is correct. The inversion is intentional and is recorded here so a reviewer does not read it as drift.

**Test.** Grep for `--rp-ok`, `--rp-dated`, `--rp-draft`. Every occurrence must be inside a status chip, a banner, an artifact element, a row-state marker, a field-invalid state, or a destructive button. Any use of a status hue on a link, a wordmark, a heading, a chart, an icon or a primary action is a review failure.

### R3 — Every state is a word, a glyph and a border style, before it is a colour.

**Source.** `USER_JOURNEY.md §18`, binding: *"status is never conveyed by colour alone — CERTIFIABLE / DRAFT is a word and an icon before it is green or red, because these documents get printed on monochrome laser printers and faxed."*

**Applied here.** The three artifact statuses are separated on four independent channels:

| Status | Word | Glyph | Border style | Hue |
|---|---|---|---|---|
| `CERTIFIABLE` | CERTIFIABLE | `✓` | **solid** 2px | ok |
| `CERTIFIABLE (DATED)` | CERTIFIABLE (DATED) | `!` | **dashed** 2px | dated |
| `DRAFT — NOT CERTIFIABLE` | DRAFT — NOT CERTIFIABLE | `✕` | **double** 4px | draft |

Border style is the load-bearing choice. It survives a monochrome laser, a fax, a photocopy, a colour-blind reader, and `forced-colors: active` — where the browser replaces every colour in the page but preserves `border-style`. The same three styles recur on the dropzone (`dashed` = not yet filled, `solid` = filled) and on the withheld signature block (`double` = do not sign). The system has a shape grammar, not just a palette.

**Test.** Render any screen at `filter: grayscale(1)` and again under `forced-colors: active`. Every status must remain identifiable. Print any artifact on a monochrome printer; the DRAFT instruction must still be readable from arm's length.

### R4 — Nothing under 15px is an interface element.

**Source.** NN/g's longitudinal work with users 65 and over — three rounds, 123 participants across five countries — measures seniors at **55.3% task success against 74.5%** for users 21–55, **7:49 time on task against 5:28** (≈43% slower), and **2.4 errors against 1.1** ([NN/g, *Usability for Senior Citizens: Improved, But Still Lacking*](https://www.nngroup.com/articles/usability-seniors-improvements/); [*UX Design for Seniors*, 3rd ed.](https://www.nngroup.com/reports/senior-citizens-on-the-web/)). The same work names readability as the persistent failure and recommends *"at least 12-point fonts as the default"* for sites targeting seniors. [W3C WAI, *Older Users and Web Accessibility*](https://www.w3.org/WAI/older-users/) reaches the same place from the standards side.

**Applied here.** The type scale (§5.2) has eight steps and **its bottom step is 13px, which is not an interface size.** 13px is permitted in exactly two places: the provenance block (§8.9) and legal micro-print. Everything a user reads to make a decision — table cells, help text, chip labels, field labels — is 15px or larger, and the default is 17px. Run 1's scale bottomed at 12px and used it for pills, chips and disclaimers; this one cannot, because the class does not exist.

**Test.** Grep for `font-size` in components. Any value below `var(--rp-t-data)` (15px) outside `.rp-prov` and `.rp-legal` is a review failure.

### R5 — Motion has an allow-list, and everything not on it is forbidden.

**Source.** Nielsen's three response-time limits: 0.1s (instantaneous), 1.0s (flow of thought uninterrupted), 10s (attention held) ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/)). Below 1s, no indicator is warranted. Above it, what is warranted is *information about progress*, not a rotating shape.

**Applied here.** Four properties may transition, and nothing else: `background-color`, `border-color`, `color`, and `inline-size` on the determinate progress bar. `transform` has a **total budget of 1px** (`--rp-lift`), used nowhere in v1. There is **no spinner component, no skeleton screen, and no indeterminate progress bar.** The one animation in the entire system is `rp-settle` — a 160ms tint that a resolved table row holds and lets go, so a change that happened off-cursor is noticed. Full detail in §7.

**Test.** Grep for `@keyframes` and `animation`. Exactly one keyframe (`rp-settle`) may exist. Grep for `transform:`; there are exactly two permitted occurrences, both **static layout, never animated**: the watermark's `rotate(-24deg) scale(1.35)` and `.rp-hitslop`'s `translate(-50%, -50%)` centring. Anything else — any transition or animation on `transform`, any hover lift, any translate used to hide or reveal an element (the skip link is positioned, not transformed) — is a review failure.

---

## 2. The operating envelope — a specification, not a mood board

Design systems usually describe an aesthetic. This one starts by describing a room, because the room is what makes the aesthetic non-negotiable. Every item below is drawn from `USER_JOURNEY.md §0.1`, `§0.4` and `§18`, and each has a design consequence.

| Condition | Consequence in this system |
|---|---|
| A 15" laptop, often 1366×768, in a job trailer or a strip-mall office | `--rp-shell-max: 84rem` and the WH-347 review is horizontally scrollable inside its own container. The page body never scrolls sideways. Nothing in the app requires more than 1024px of usable width to be operable. |
| A TN panel with the sun on it; gamma shifts with viewing angle | No translucency (R1). Every text pair is certified against an **opaque** background whose value we control. A user-set `data-contrast="high"` mode exists because there is no media query for glare (§10.3). |
| A reader over 50 | 17px base, 15px floor for interface text, 13px only for provenance (R4). Underlines on every link at rest. Sentence case in table heads rather than all-caps. No `-webkit-font-smoothing: antialiased`, which thins stems. |
| Tablet in a trailer; touch as often as mouse | Nothing depends on hover. Every hover affordance has a `:focus-within` twin. Targets are 44px by default, 24px only inside a dense table row (§3 A6). |
| Keyboard-first: 26 workers, entered by someone who resents the mouse | Full keyboard operability including a spreadsheet-shaped commit path in the mapping grid (§9.4). No single-character shortcuts (SC 2.1.4). |
| The output is printed, faxed, photocopied, and read 18 months later | Border-style as a state channel (R3). Two print paths, one of them at the DOL form's true geometry (§11). The provenance block has **no print override anywhere in the stylesheet**. |
| Friday, 15:40, between two other things | Density is a feature. `--rp-row-h` is 44px comfortable, 36px compact, 52px roomy, and it is an account preference, not a viewport guess. |
| **There is nobody to ask** (A3) | Every failure state is one of the four refusal primitives and every one of them is a *component in this system* (§8.10). There is no support-widget component, no chat-bubble component, and no `mailto:` styling. The omission is the enforcement. |

---

## 3. Accessibility commitments

Target: **WCAG 2.2 level AA** ([W3C](https://www.w3.org/TR/WCAG22/)), per `USER_JOURNEY.md §18`. These are commitments with named enforcement, not aspirations.

| # | Commitment | Criterion | Enforcement |
|---|---|---|---|
| **A1** | All body and interface text clears **4.5:1** against every surface it can sit on, including the DRAFT watermark composite. Large text is held to 4.5:1 anyway. | 1.4.3 AA | §4.5 certification tables; every value computed from the [WCAG relative-luminance](https://www.w3.org/TR/WCAG22/#dfn-relative-luminance) definition and reproducible from the hex values in §4.2 |
| **A2** | Every meaningful non-text boundary — control borders, focus ring, status chip edges, row markers, table rules that carry structure — clears **3:1**. | 1.4.11 AA | `--rp-rule-strong` verified 3.15:1 worst case light, 3.89:1 dark; §4.5 |
| **A3** | **Focus is always visible, never removed, and never obscured.** A three-part indicator (halo + ring + offset) whose ring is by construction never adjacent to a control's own fill. | 2.4.7 AA, 2.4.11 AA, 2.4.13 AAA (adopted) | §9.1; `scroll-margin-block-start` on every focusable element sized to header + sticky table head |
| **A4** | **Colour is never the sole carrier of meaning**, and in this system it is never even the *first* carrier. | 1.4.1 A | R3; §8.7 four-channel status table |
| **A5** | **`prefers-reduced-motion: reduce` removes all motion.** Nothing in this system was ever carried by motion, so nothing is lost. | 2.3.3 AAA (adopted) | §7.4; durations collapse to `0.01ms`, never `0`, so `animationend` handlers still fire |
| **A6** | **Target size ≥44×44px** for every control outside a data table; **≥24×24px with spacing** inside one. | 2.5.5 AAA (adopted) / 2.5.8 AA | `--rp-target-min: 2.75rem`, `--rp-target-abs: 1.5rem`, `.rp-hitslop`. The dense tables are named in `USER_JOURNEY.md §18` as the criterion they would fail first |
| **A7** | **Type and layout scale with the user's root font size.** Every size, space and radius is in `rem` or `ch`. Only hairlines, the focus ring and the 2px structural rule are in `px`. Layout survives 200% zoom and 320px reflow. | 1.4.4 AA, 1.4.10 AA | rem-only scales in §5–§6; `overflow-x` contained per component |
| **A8** | **No fixed heights on text containers**, so a user stylesheet may set line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em and word-spacing 0.16em with no loss of content. | 1.4.12 AA ([normative text](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)) | Table rows use `block-size` as a minimum via padding, never a clamp; chips wrap |
| **A9** | **No single-character keyboard shortcuts.** Every shortcut requires a modifier. | 2.1.4 A ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)) | §9.4 |
| **A10** | **Information already supplied is never asked for again**, and the file receipt (§8.4) makes that visible. | 3.3.7 AA ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)) | Classification memory (J6), remembered column maps (J5), the dropzone receipt |
| **A11** | **Dark is authored, not derived.** Light and dark are independent palettes with independently verified contrast. Dark surfaces are never `#000`, dark ink never `#FFF` (except in the high-contrast variant, where the user has asked for exactly that). | beyond AA | §4.2 `--rp-night-*` ramp |
| **A12** | **`forced-colors: active` is handled**, and `forced-color-adjust` is used nowhere. | platform | §10.5. The status system survives intact because it was built on border style |
| **A13** | **Consistent help by having none.** [SC 3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) *does not require authors to provide help*; it requires that help mechanisms which exist appear consistently. There is none in the compliance flow (A3) and exactly one billing-dispute address, always in the same place. We comply by being consistent, not by adding a channel. | 3.2.6 A | §12 |

**Honest limit, flagged.** WCAG has no success criterion for a decorative overlay drawn over readable text. A1's extension of 1.4.3 to the DRAFT watermark composite (§4.6) is our own reading of the criterion's intent. The arithmetic is standard and reproducible; the *method* of certifying against a bounded composite is asserted, not drawn from a published conformance technique. This is the same honest limit run 1 flagged for translucency, and it is much cheaper to discharge here because our overlay set has exactly two members instead of a continuum.

---

## 4. Colour

### 4.1 Rationale

Four hues on a warm-neutral substrate.

- **Stock (warm neutral, hue ≈ 45°, very low chroma).** The substrate is warm rather than blue-slate — the deliberate opposite of run 1. Three reasons. It reads as *paper*, which is what this product makes. A blue-cast neutral on a poorly calibrated TN panel goes muddy in the mid-tones where all of this system's rules and sunken surfaces live, while a warm neutral degrades toward cream, which is legible. And warm neutral against the one cool hue in the palette (`pin`) gives the provenance material — the thing D3 says is the entire paid boundary — maximum separation from everything around it at minimum chroma cost.
- **Ink (warm near-black, `#14120E`).** Not `#000`: pure black on a bright white sheet produces halation for astigmatic and light-sensitive readers, and this reader is over 50 by design. `#14120E` is 18.71:1 on the sheet and 15.00:1 on the desk — far above what AA asks, which is the correct place to spend contrast budget in a room with sun in it.
- **Pin (deep blue, `#12508F` / `#8FB8EC`).** The one brand hue, and it is named for the product: `NAMING.md` §8 invariant 7 says *brand the pin, not the form*, so the hue that marks a pinned wage determination carries that noun rather than a generic "link" or "accent". It marks *provenance and navigation*: links, the WD reference, focus, selection. It is never a fill and never a status. This is `NAMING.md`-style discipline applied to colour — the thing we want to own visually is the citation of a wage determination, so that is the thing that gets a colour of its own.
- **ok / dated / draft.** Bound to the three artifact statuses of `ARCHITECTURE.md §6.3` and to nothing else. Note the mapping is to *statuses*, not to *severity*: `dated` is not "warning" and `draft` is not "error". `dated` means one specific sentence narrowed; `draft` means one specific block was withheld.

**The hue that is deliberately absent: there is no success green outside the status system, and no "positive" colour at all.** `USER_JOURNEY.md §16.3` bans the sentence *"Your filing is compliant."* A design system that ships an `alert--success` component is a system in which somebody will eventually write that sentence. So it does not ship one (§8.10).

### 4.2 Primitive ramps — exact values

Components never reference these. They reference the semantic tier in §4.3.

**Stock (light substrate)**

| Token | Hex | Role |
|---|---|---|
| `--rp-stock-000` | `#FFFFFF` | the sheet |
| `--rp-stock-050` | `#F3F1EB` | sunken: table head, inset panel |
| `--rp-stock-100` | `#EFEDE6` | row hover |
| `--rp-stock-150` | `#E9E6DE` | the desk — light page ground |
| `--rp-stock-200` | `#D8D3C7` | decorative hairline |
| `--rp-stock-400` | `#87806E` | **light meaningful border — 3.15:1 worst case** |
| `--rp-stock-500` | `#8A8375` | light disabled ink — 3.02:1 (1.4.3 exempt) |

**Ink**

| Token | Hex | Role |
|---|---|---|
| `--rp-ink-950` | `#14120E` | **light primary — 15.00:1 worst case** |
| `--rp-ink-800` | `#403A30` | **light secondary — 9.02:1 worst case** |
| `--rp-ink-600` | `#5C5648` | **light tertiary — 5.85:1 worst case** |

**Night (dark substrate and inks, authored independently — A11)**

| Token | Hex | Role |
|---|---|---|
| `--rp-night-000` | `#131210` | dark page ground |
| `--rp-night-050` | `#1C1A16` | dark surface |
| `--rp-night-100` | `#242119` | dark sunken |
| `--rp-night-150` | `#26231C` | dark row hover |
| `--rp-night-300` | `#39352C` | dark hairline |
| `--rp-night-500` | `#847C6B` | **dark meaningful border — 3.89:1 worst case** |
| `--rp-night-600` | `#7A7364` | dark disabled ink — 3.42:1 (exempt) |
| `--rp-night-900` | `#A69E8C` | **dark tertiary — 6.04:1 worst case** |
| `--rp-night-950` | `#CEC7B8` | **dark secondary — 9.56:1 worst case** |
| `--rp-night-999` | `#F3F0E8` | **dark primary — 14.11:1 worst case**; deliberately not `#FFF` |

**Pin, and the three statuses**

| Token | Hex | Worst case | Role |
|---|---|---|---|
| `--rp-pin-700` | `#12508F` | 7.24:1 | light link / focus / provenance |
| `--rp-pin-800` | `#0E3E70` | 10.82:1 on sheet | light hover / active |
| `--rp-pin-300` | `#8FB8EC` | 7.83:1 | dark link / focus / provenance |
| `--rp-pin-200` | `#B0CCF3` | 10.57:1 on surface | dark hover / active |
| `--rp-ok-700` | `#0F6B37` | 5.85:1 | light CERTIFIABLE |
| `--rp-ok-300` | `#5FC085` | 7.17:1 | dark CERTIFIABLE |
| `--rp-dated-700` | `#8A5200` | 5.66:1 | light narrowed claim |
| `--rp-dated-300` | `#E2A83F` | 7.58:1 | dark narrowed claim |
| `--rp-draft-700` | `#A61B10` | 6.67:1 | light DRAFT — NOT CERTIFIABLE |
| `--rp-draft-300` | `#F28A7C` | 6.66:1 | dark DRAFT — NOT CERTIFIABLE |

**Tints** — `--rp-*-tint-l`: ok `#E2EFE5`, dated `#FAEDD6`, draft `#FBE6E2`, pin `#E4ECF7`. `--rp-*-tint-d`: ok `#152A1D`, dated `#2C2415`, draft `#2F1C19`, pin `#182437`.

### 4.3 Semantic tier

Light is the **bare `:root`**. Every colour receives its first definition there. The dark, high-contrast and forced-colors blocks *redefine only*. Nothing in this system is ever defined for the first time inside a media query, because a page whose default theme lives in a query renders unthemed on the engines that miss it.

Groups: **grounds** (`--rp-ground`, `--rp-surface`, `--rp-sunken`, `--rp-field`, `--rp-row-hover`, `--rp-row-selected`) · **ink** (`--rp-ink`, `--rp-ink-2`, `--rp-ink-3`, `--rp-ink-mute`, `--rp-ink-on-fill`) · **rules** (`--rp-rule`, `--rp-rule-strong`, `--rp-rule-ink`) · **pin** (`--rp-pin`, `--rp-pin-strong`, `--rp-pin-tint`) · **status** (`--rp-ok`, `--rp-dated`, `--rp-draft` and their tints) · **overlay** (`--rp-mark`, `--rp-mark-alpha`, `--rp-mark-alpha-print`) · **focus** (`--rp-focus`, `--rp-focus-halo`, `--rp-focus-w`, `--rp-focus-gap`).

`--rp-ink-3` is the **floor for informational text**. `--rp-ink-mute` is for disabled controls only; it sits at 3.02:1 light and 3.42:1 dark, which is below AA and is permitted solely because 1.4.3 exempts inactive user-interface components. Using it for any text a user must read is a review failure.

### 4.4 Dark is authored, not derived

Dark is not the light palette inverted. The dark ground is `#131210`, warmer and lighter than a true black, and the dark primary ink is `#F3F0E8`, not `#FFF` — both to reduce halation, which is the dominant dark-mode complaint from exactly the age group this product serves. The dark statuses are re-picked rather than lightened: `--rp-draft-300` `#F28A7C` is a coral, not a light red, because a light red on a warm dark ground reads as brown at low panel brightness.

### 4.5 Contrast certification

All ratios computed from the [WCAG relative-luminance definition](https://www.w3.org/TR/WCAG22/#dfn-relative-luminance) against the exact hex values in §4.2. Reproducible: the script is fifteen lines and the values are in this document.

**LIGHT — text on grounds (AA needs 4.5:1)**

| | on `--rp-ground` `#E9E6DE` | on `--rp-surface` `#FFFFFF` | on `--rp-sunken` `#F3F1EB` |
|---|---|---|---|
| `--rp-ink` `#14120E` | **15.00** | **18.71** | **16.56** |
| `--rp-ink-2` `#403A30` | **9.02** | **11.25** | **9.96** |
| `--rp-ink-3` `#5C5648` | **5.85** | **7.29** | **6.46** |
| `--rp-ink-mute` `#8A8375` | 3.02 ✱ | 3.76 ✱ | 3.33 ✱ |

**LIGHT — non-text boundaries (AA needs 3:1)**

| | ground | surface | sunken |
|---|---|---|---|
| `--rp-rule-strong` `#87806E` | **3.15** | **3.93** | **3.48** |
| `--rp-pin` `#12508F` | **6.55** | **8.17** | **7.24** |
| `--rp-ok` `#0F6B37` | **5.30** | **6.61** | **5.85** |
| `--rp-dated` `#8A5200` | **5.12** | **6.39** | **5.66** |
| `--rp-draft` `#A61B10` | **6.04** | **7.54** | **6.67** |

**LIGHT — status ink on its own tint, and body ink on tints**

| pair | ratio |
|---|---|
| `--rp-ok` on `--rp-ok-tint` | **5.57** |
| `--rp-dated` on `--rp-dated-tint` | **5.52** |
| `--rp-draft` on `--rp-draft-tint` | **6.29** |
| `--rp-pin` on `--rp-pin-tint` | **6.86** |
| `--rp-ink` on any tint | 15.61 – 16.17 |
| `--rp-ink-2` on any tint | 9.39 – 9.73 |

**LIGHT — the primary button and the focus indicator**

| pair | ratio | why it matters |
|---|---|---|
| `--rp-ink-on-fill` `#FFFFFF` on `--rp-ink` fill | **18.71** | the label |
| ink fill vs `--rp-ground` | **15.00** | 1.4.11 — the button's own edge |
| focus ring vs `--rp-ground` | **6.55** | 2.4.13 — outer adjacent colour |
| focus ring vs `--rp-focus-halo` `#FFFFFF` | **8.17** | 2.4.13 — inner adjacent colour |
| halo vs ink fill | **18.71** | why the ring never touches the fill |

**DARK — text on grounds**

| | ground `#131210` | surface `#1C1A16` | sunken `#242119` |
|---|---|---|---|
| `--rp-ink` `#F3F0E8` | **16.44** | **15.26** | **14.11** |
| `--rp-ink-2` `#CEC7B8` | **11.13** | **10.33** | **9.56** |
| `--rp-ink-3` `#A69E8C` | **7.03** | **6.53** | **6.04** |
| `--rp-ink-mute` `#7A7364` | 3.98 ✱ | 3.69 ✱ | 3.42 ✱ |

**DARK — non-text boundaries**

| | ground | surface | sunken |
|---|---|---|---|
| `--rp-rule-strong` `#847C6B` | **4.53** | **4.20** | **3.89** |
| `--rp-pin` `#8FB8EC` | **9.12** | **8.47** | **7.83** |
| `--rp-ok` `#5FC085` | **8.35** | **7.75** | **7.17** |
| `--rp-dated` `#E2A83F` | **8.83** | **8.20** | **7.58** |
| `--rp-draft` `#F28A7C` | **7.76** | **7.20** | **6.66** |

**DARK — status on tint:** ok 6.78 · dated 7.23 · draft 6.69 · pin 7.60. **Primary button:** `--rp-ink` fill with `--rp-night-000` label, 16.44:1. **Focus:** ring vs ground 9.12, ring vs halo 9.12, halo vs ink fill 16.44.

✱ `--rp-ink-mute` is below 4.5:1 by design and is permitted only on disabled controls, which [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) exempts.

**HIGH CONTRAST** (§10.3) — light: ink `#000000` 21.00 on white, ink-2 15.02, ink-3 12.32, rule-strong 15.22, pin 10.83, ok 8.84, dated 8.65, draft 9.67, hairline 4.71. Dark: ink `#FFFFFF` 18.58 on surface, ink-2 13.08, ink-3 10.04, rule-strong 11.15, pin 11.10, ok 10.72, dated 11.14, draft 9.95, hairline 3.21 on surface / 3.48 on sunken.

### 4.6 The Bounded Overlay Rule — how the DRAFT watermark stays AA

The one place in this system where text is drawn over something other than a flat surface is the artifact sheet under the `DRAFT — NOT CERTIFIABLE` watermark. That is a composite, so it needs the same discipline run 1 applied to glass — but the problem here is a hundred times smaller, and stating why is the point.

**The rule.** The overlay is **one colour at one alpha over one surface**. `--rp-mark` is always the theme's draft hue, `--rp-mark-alpha` is `0.20` light / `0.18` dark, and the surface beneath is always `--rp-surface`. Therefore the set of possible backdrops for any glyph on the artifact has **exactly two members**: the bare sheet, and one known composite. Both are certified:

| Theme | composite | `--rp-ink` on it | `--rp-ink-2` | `--rp-ink-3` (the form's smallest ink) |
|---|---|---|---|---|
| Light, screen (α 0.20) | `#EDD1CF` | 13.03 | 7.84 | **5.08** |
| Light, print (α 0.24) | `#EAC8C6` | 12.09 | 7.28 | **4.71** |
| Dark (α 0.18) | `#432E28` | 11.11 | 7.52 | **4.75** |

The print alpha is raised because a 20% tint can drop out of a cheap laser's halftone; 0.24 was chosen as the largest value that keeps `--rp-ink-3` above 4.5:1, with 0.21 points of margin.

**Two properties fall out of the bound, and both are load-bearing.**

1. Nested surfaces on the sheet (the table head, at `--rp-sunken`) are opaque and simply occlude the mark. That does not add a third composite — it removes the overlay locally, and the pair reverts to the certified sunken row of §4.5.
2. **The watermark is never the only carrier of its own message.** The mark itself sits at 1.44:1 against the paper — legible as a shape, not as a warning. So the instruction is carried at full contrast by two other elements that are structural rather than optical: the `.rp-sheet__band` across the top of the page, and the `.rp-signature--withheld` block that *replaces* the signature line. Under `forced-colors: active` the watermark is dropped entirely and those two carry it alone, which they always could.

---

## 5. Typography

### 5.1 Faces

**No web fonts.** Not a performance nicety: a trailer laptop on a phone hotspot should not wait on a 90 KB font file before it can read a rate, and a font that fails to load silently reflows a table of dollar figures. Two system stacks:

```
--rp-font-ui   -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text",
               "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans",
               "Liberation Sans", Arial, sans-serif
--rp-font-num  ui-monospace, "Cascadia Mono", "Segoe UI Mono", "SF Mono",
               Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace
```

`Liberation Sans` and `DejaVu Sans Mono` are in the stack because a meaningful share of the target machines are older Windows and Linux boxes where the newer Microsoft faces are absent.

**There is no serif face.** Run 1 used one for its document body. Here the document is a government form set in sans and mono, and a serif at 8.5pt on a TN panel is a legibility risk with no compensating benefit.

### 5.2 Scale — eight steps, ratio ≈ 1.22

| Token | px | Use |
|---|---|---|
| `--rp-t-micro` | 13 | **provenance block and legal micro-print only** (R4) |
| `--rp-t-data` | 15 | table cell, help text, chip label, small button |
| `--rp-t-base` | **17** | the default: UI, prose, field labels, buttons, alert bodies |
| `--rp-t-lead` | 19 | section lead, field-group heading, large status chip |
| `--rp-t-h3` | 23 | card title |
| `--rp-t-h2` | 28 | page section |
| `--rp-t-h1` | 34 | page title |
| `--rp-t-fig` | 44 | a price, a total. Nothing else. |

The ratio is flat (1.22) rather than a display ratio, because this product has almost no display type and a lot of tabular type. Line heights: `tight` 1.2 (headings), `data` **1.35** (table cells — density without collision), `ui` 1.45, `prose` 1.6.

### 5.3 Numerals are a component, not a style

Every number, identifier, date and hash in this product is set in `--rp-font-num` with:

```css
font-variant-numeric: tabular-nums lining-nums slashed-zero;
font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1;
```

`tabular-nums` (OpenType `tnum`) so a column of dollars aligns on the decimal; `lining-nums` (`lnum`) so digits sit on the baseline at cell height; **`slashed-zero` (`zero`) because a wage-determination number, an SSN last-four and a corpus snapshot hash all contain characters a reader must not have to guess at.** `CA20260012` is not a string you want to read with an ambiguous zero at 15px in the sun. The property list and its OpenType mapping are documented on [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric); MDN also states the caveat that **the font must support the feature**, which is why the mono stack is the carrier — `zero` is far more reliably present in monospaced faces than in UI sans faces. `font-feature-settings` is declared alongside `font-variant-numeric` as a belt-and-braces path for older engines.

**Test.** Any element rendering a currency amount, an hours figure, a WD number, a revision number, a date, a hash or a percentage without `.rp-num` or a `--num` cell class is a review failure.

### 5.4 Three small decisions with evidence behind them

1. **Links are underlined at rest, everywhere, permanently.** Removing the underline leaves colour as the sole link signal, which fails [SC 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and costs measurably more for older users, whose failure modes NN/g documents as clicking the wrong thing and missing affordances entirely ([NN/g, *Usability for Older Adults*](https://www.nngroup.com/articles/usability-for-senior-citizens/)).
2. **Table heads are sentence case, not all-caps.** All-caps removes word-shape (ascender/descender profile), which is a scanning cue, and this interface is scanned rather than read ([NN/g, *How Users Read on the Web*](https://www.nngroup.com/articles/how-users-read-on-the-web/)). All-caps survives in exactly two places, both of which are single tokens rather than phrases: the status chip and the price tier label.
3. **No `-webkit-font-smoothing: antialiased`.** It thins stems, which is the wrong trade on a low-contrast panel for a reader over 50. We take the platform default deliberately.

---

## 6. Space, density, radius, and the absence of elevation

### 6.1 Space — a 4px grid

`--rp-s-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-7` 32 · `-8` 40 · `-9` 56 · `-10` 72.

The 20px step exists because dense forms need a value between 16 and 24; the scale tops out at 72 rather than 96 because there is no marketing hero in the app and the landing page borrows from the same set.

### 6.2 Density is a user preference

`data-density` on `:root` takes `compact` | *(default)* | `roomy`, changing three tokens:

| | row height | cell pad Y | cell pad X |
|---|---|---|---|
| `compact` | 36px | 4 | 8 |
| default | **44px** | 8 | 12 |
| `roomy` | 52px | 12 | 16 |

44px default satisfies [SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) at AAA for in-row controls. **Compact's 36px still clears the 24px AA floor of SC 2.5.8 with 12px to spare**, which is the reason compact is allowed to exist at all. This is stored per account, not guessed from the viewport: Priya on nine projects and Marcus on one want different things on the same 15" screen, and a viewport query cannot tell them apart.

### 6.3 Radius — a form has square corners

`--rp-r-0` 0 · `--rp-r-1` 2px (chips, inputs, cells) · `--rp-r-2` 3px (buttons, cards). **There is no larger step and no pill.** The artifact sheet is `--rp-r-0` because paper has square corners and the preview's job is to look like the thing that comes out of the printer. Run 1's concentric 6–28px radii were correct for a soft, reassuring product; they would make this one look like a consumer app, and a consumer app is not what you want to be looking at when you are about to sign a federal certification.

### 6.4 There is no elevation scale

Not "a subtle one" — none. `box-shadow` appears exactly twice in the stylesheet: the focus halo, and the 3px `inset` start-marker used by active/blocked table rows and selected picker options. Separation is done by: opaque surface change, a 1px `--rp-rule-strong` border, or a 2px `--rp-rule-ink` structural rule. The modal is separated by a `::backdrop` scrim plus a 2px ink border, not by a shadow.

**Test.** Delete every `box-shadow` in devtools. Nothing about the layer hierarchy should change except the focus ring and the row markers. If a surface disappears, it was leaning on a shadow.

---

## 7. Motion

### 7.1 The premise

Nothing in this system's *state model* is carried by motion. Every state has a word, a glyph, a border and a colour before it has a transition, so `prefers-reduced-motion` removes decoration rather than information (A5). That is why §7.4 is three lines long.

### 7.2 The allow-list

| Allowed | Duration | Where | Why |
|---|---|---|---|
| `background-color` | `--rp-dur-tick` 90ms | hover, press, row hover | below the 0.1s instantaneous threshold, so it reads as immediate feedback rather than as an animation |
| `border-color` | 90ms | control hover, field focus | same |
| `color` | 90ms | link hover | same |
| `inline-size`, linear | `--rp-dur-state` 160ms | determinate progress fill | the bar must not appear to overshoot the number it reports |
| `rp-settle` keyframe | 160ms, **1 iteration** | a table row that just resolved | the one thing that genuinely needs motion (§7.3) |
| `height` | `--rp-dur-open` 200ms | disclosure only | reserved; `<details>` is used unanimated in v1 |

**Forbidden, by absence of the component:** spinners, skeleton screens, indeterminate progress, page transitions, parallax, entrance animations, count-up numbers, toast slide-ins, row reordering animation, hover lift. `transform` has a total budget of **1px** and v1 spends none of it.

### 7.3 What motion is for here

Exactly one thing: **telling you that something changed while you were looking somewhere else.** In `J6`, Dee resolves a blocked classification and the row she is *not* looking at — three rows up, where the same title also appeared — becomes resolved. `rp-settle` holds an `--rp-ok-tint` background for 160ms and releases it. That is a change notification. Everything else on the screen is static, so it is impossible to miss and impossible to confuse with decoration.

Waiting is handled with information, not motion, following Nielsen's limits ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/)):

| Latency | Treatment |
|---|---|
| < 1s (the common case: import, resolve, generate) | **nothing at all.** No indicator. `USER_JOURNEY.md §17` says inline progress under 1s |
| 1–10s | the button takes `aria-busy="true"` and its **label changes to a word** — "Generating…" — because a word says what is happening and a rotating shape does not |
| > 10s (the Friday multi-project run, J9) | **per-item resolution**: the board lists the projects and marks them one at a time. A percent bar over independent items is a worse estimate than the items themselves |

### 7.4 Reduced motion

`prefers-reduced-motion: reduce` sets all durations and animation durations to `0.01ms` — never `0`, so `transitionend` and `animationend` handlers still fire — and disables `rp-settle` outright, since the row's own status cell already reads "resolved".

---

## 8. Component specifications

Thirteen components. Each names its markup contract, its states, its non-colour redundancy, and its print behaviour.

### 8.1 Shell, header, boundary statement

`.rp-shell` caps at `84rem` — wide, because the WH-347 is a landscape form and the review screen must not force a horizontal scroll of the *page*. `.rp-shell--text` caps at `44rem` for prose routes.

`.rp-header` is sticky, **opaque**, and closed by a 2px `--rp-rule-ink` rule. `.rp-wordmark` is text plus `.rp-wordmark__rule` — a 2px ink rule beneath the word. That rule is the entire visual identity of the product in the app, and it is the same mark that structures every table head. There is no logotype file, no SVG, no icon dependency.

**The wordmark sets no `text-transform`, and that is a binding decision, not an omission.** `NAMING.md` §7.1: `Ratepin` — initial capital, lowercase remainder, one word, everywhere including product chrome, the favicon label, the PDF footer and email `From:` names. Never `ratepin`, never `RATEPIN`, never `RatePin`, never `Rate Pin`. This is a deliberate departure from run 1, which set `clausewright` all-lowercase in chrome: an all-lowercase wordmark is a consumer-software convention, and a payroll administrator evaluating a tool that will sit inside a federal certification reads it as unserious. A `text-transform` on `.rp-wordmark` in any stylesheet is a review failure.

`.rp-boundary` renders the boundary statement of `USER_JOURNEY.md §7.4` — *"Ratepin computes and formats. **You certify.**"* Binding constraints from that section, implemented: never dismissible (no dismiss affordance exists on the component), never in a modal (`.rp-modal` is documented as forbidden from carrying it, §8.13), never smaller than body text (`--rp-t-base`, and it is styled as structure — a rule and ink — not as a callout, because a callout is something a reader learns to skip).

### 8.2 Buttons

```html
<button class="rp-btn rp-btn--primary">Generate WH-347</button>
<button class="rp-btn" aria-disabled="true">Generate WH-347</button>
<p class="rp-btn__why">Two payroll lines are still unresolved.</p>
```

- **One `.rp-btn--primary` per screen, filled with ink** (R2). Never a status hue, never the pin hue.
- **Every button keeps a ≥3:1 border at rest, including `--quiet`.** There is no borderless button, because "is that a button?" costs more seconds at 15:40 on a Friday than a border costs elegance.
- `--sm` drops to the 24px SC 2.5.8 floor and is permitted **inside table rows only**.
- `--destructive` is outlined in the draft hue, never filled, never pre-focused. Draft is on-message here: it is the same *do not proceed casually* channel as the watermark.
- **A disabled button must be accompanied by `.rp-btn__why`** naming the blocking condition (Nielsen #1). A disabled button with no adjacent reason is a review failure.
- Busy state replaces the label with a word and sets `aria-busy="true"`. No spinner (§7.3).

### 8.3 Form controls

Visible `<label>` always; placeholder-as-label never (Nielsen #6, and it fails outright for a reader who has to re-check what a field was for). `.rp-field` is a grid of label / control / help / error.

- 44px minimum control height; 1px `--rp-rule-strong` border at rest; border darkens to `--rp-ink` on focus **in addition to** the focus ring, so the active field is identifiable at a glance across a 20-field mapping screen.
- `.rp-input--num` right-aligns and takes the numeral stack (§5.3).
- `aria-invalid="true"` thickens the **inline-start** border to 3px in the draft hue — a marker in the margin, visible when scanning a column of fields, not just at the field.
- `.rp-field__error` carries a `✕` glyph, bold weight and words. Colour is the third channel.
- Checkboxes and radios are 22px in a 44px row with `accent-color: var(--rp-ink)`.

### 8.4 File dropzone — S13, S01

```html
<div class="rp-drop" data-state="idle">
  <p class="rp-drop__title">Payroll CSV for week ending 2026-08-14</p>
  <label class="rp-btn rp-btn--primary">
    Choose file<input class="rp-drop__input" type="file" accept=".csv,text/csv">
  </label>
  <p class="rp-drop__hint">QuickBooks, ADP, Paychex and Gusto exports all work…</p>
</div>
```

**The button is the control; the drop target is an enhancement.** Drag-and-drop is not keyboard-operable and a trailer tablet has no drag, so the file input is always present, always labelled, and the zone shows the focus ring via `:has(.rp-drop__input:focus-visible)` so keyboard users see the same target mouse users do. Paste is also accepted.

Five states, on `data-state`, each with a border-style or border-colour change **and** a copy change: `idle` (dashed, `--rp-rule-strong`) · `over` (solid, pin) · `reading` (solid, ink-3) · `accepted` (solid, ok) · `rejected` (solid, draft, draft tint).

`.rp-drop__receipt` is a four-row definition list — filename, bytes, rows detected, `sha256` prefix — in the numeral stack. It exists for [SC 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) and for `ARCHITECTURE.md`'s idempotency on `source_sha256`: re-uploading the same file is visibly the same file, so a user who is not sure whether the upload took can *see* that it did instead of doing it again.

### 8.5 Data table — S14, S15, S16, S18

The densest and most-used surface in the product.

**8.5.1 Structure.** `.rp-tablewrap` (`overflow-x: auto`, bordered) wraps `.rp-table`. Horizontal overflow is contained here and never inflicted on the page body. `thead th` is sticky with a 2px ink bottom rule; a second header row (the WH-347's hours block and money block) offsets by `--rp-row-h`.

**8.5.2 No zebra striping.** Enders' paired study, 244 usable participants, found **no statistically significant improvement in accuracy and very little in speed** from striping ([*Zebra Striping: Does it Really Help?*](https://alistapart.com/article/zebrastripingdoesithelp/); [follow-up](https://alistapart.com/article/zebrastripingmoredataforthecase/)). So this system uses a 1px hairline per row, a row band on `:hover` and `:focus-within`, and a **3px `--rp-pin` marker in the start margin of the focused row** — a place-keeper that does the job striping was supposed to do, costs one `inset` shadow, and disappears cleanly on paper instead of laying a grey wash over a document somebody has to read.

**8.5.3 Numbers.** `.rp-td--num` right-aligns with the numeral stack. A column of dollars that does not align on the decimal cannot be scanned, and this is the column where a misread costs a false certification.

**8.5.4 Column-group rules.** `.rp-group-start` puts a 1px `--rp-rule-strong` on the inline-start edge of the first cell of each logical block, mirroring the WH-347's own ruled blocks. Nielsen #2 (match between system and the real world) applied literally: the preview looks like the form because it *is* the form's geometry.

**8.5.5 Row states**, each with a word in the row's status cell first:

| `data-row` | marker | ground | meaning |
|---|---|---|---|
| `blocked` | 3px draft, start | draft tint | **P-A** — this line is blocked and named |
| `asserted` | 3px dated, start | — | a 6B/6C value the customer asserted; also underdotted per cell via `data-asserted` |
| `resolved` | — | `rp-settle` 160ms | it just changed (§7.3) |
| `[aria-selected]` | — | pin tint | selection |

**8.5.6 Print.** `thead` becomes `table-header-group` and `tfoot` `table-footer-group`, so the header repeats on every printed page; rows get `break-inside: avoid`; sticky positioning is dropped.

### 8.6 Classification picker — S15

The journey the entire autonomy argument rests on (`USER_JOURNEY.md §6`). This is where the one human-shaped question in the product — *"which classification is this guy?"* — is answered without a human, once, forever.

**8.6.1 Markup contract.**

```html
<fieldset class="rp-pick" role="radiogroup" aria-describedby="stakes-7">
  <legend class="rp-pick__legend">
    <span class="rp-pick__title">CEM MASON - FINISH</span>
    <span class="rp-pick__stakes" id="stakes-7">
      2 workers · <span class="rp-num">38.5</span> hours ·
      <span class="rp-num">$1,842.75</span> on this filing
    </span>
  </legend>
  <div class="rp-pick__options">…</div>
</fieldset>
```

The payroll title is rendered **verbatim, in the mono face**, so trailing spaces, doubled hyphens and stray digits are visible — she needs to recognise her own data, and her payroll system's exact string is what she will recognise. The stakes line is the hours and the dollars, because that is what makes this worth twenty seconds.

**8.6.2 Each option** carries the group id (`SUCA2020-005`, mono), the verbatim classification label, the verbatim scope text as a quotation with a 2px start rule at prose leading and the full measure — that is the text she is actually reading, so it gets the most generous typography on the screen — the base and fringe rates in the numeral stack, and the line-span link into the determination.

**8.6.3 No option is visually heavier than another.** Selection is a `--rp-pin` tint plus a 3px start rule, applied by `:has(input:checked)` with a `[data-checked]` fallback for engines without [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has). Where the engine pre-selects a candidate (`ENGINE.md` lattice L-B / L-C), the pre-selection is announced in **words** — `.rp-pick__preselect` — and takes no extra visual weight, because a recommendation stated in words can be disagreed with and a recommendation imposed by contrast cannot (Nielsen #3). The row stays blocked until she clicks either way.

**8.6.4 Reduced mode.** When the model is unreachable or the budget is tripped (lattice L-E), `.rp-pick__reduced` states it in neutral ink on the sunken surface with no hue at all: *"Candidate ordering was produced without ranking assistance."* This is a **P-D**-shaped statement, not an error, and §8.10.2 explains why it gets no colour.

**8.6.5 What is not here.** After `.rp-pick__escape` — *"None of these"*, opening the determination's full searchable class list — there is nothing. No chat bubble, no "ask an expert", no `mailto:`. A3 is enforced by the absence of a component and by the lint rule in `ARCHITECTURE.md §13`. This is the single most important thing about this component and it is expressed as a hole.

### 8.7 Status chip

Three members, matching `deriveStatus()` exactly. The chip is the first thing on the review screen (`USER_JOURNEY.md §7.1`) and takes `--lg` there.

```html
<span class="rp-status rp-status--draft">
  <span class="rp-status__glyph" aria-hidden="true">✕</span>
  DRAFT — NOT CERTIFIABLE
</span>
```

Four channels per R3 (word, glyph, border style, hue). `print-color-adjust: exact` so the tint survives a browser that would otherwise drop it ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust)).

**There is no fourth status and no way to compose one.** `ARCHITECTURE.md §6.3` makes `deriveStatus` the single total constructor; this component is its visual counterpart, and a designer who needs a fourth chip is describing a change to that function.

### 8.8 The artifact sheet and the DRAFT watermark

**8.8.1 True geometry.** `.rp-sheet` renders at `aspect-ratio: 11 / 8.5` with `0.35in` padding and `--rp-r-0`. This is not a guess: the DOL's own WH-347 PDF declares `MediaBox [0.0 0.0 792.0 612.0]` on **both** of its two pages — 792 × 612 pt = **11in × 8.5in, US Letter landscape** (verified 2026-08-13 against [the form PDF](https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf)). Page 1 is the payroll grid; page 2 is the statement of compliance, six checkboxes, under 18 U.S.C. 1001. The column set the grid must render — 1A entry no., 1B last, 1C first, 1D middle initial, 1E worker identifying no., 2 journeyworker/registered apprentice, 3 labor classification, 4 hours worked each day, 5 total hours, 6A hourly rate ST and OT, 6B total fringe benefit credit, 6C payment in lieu of fringe, 7A gross earned, 7B gross earned all work, 8 deductions, 9 net — is taken from [the WHD form page](https://www.dol.gov/agencies/whd/forms/wh347) (OMB 1235-0008, expires 01/31/2028).

The exact column widths live in the geometry table in the repo, which `ARCHITECTURE.md` **ADR-008** makes the source of truth; the preview's grid is derived from that table rather than restated here, so the two cannot drift. **ADR-012** ships two layouts behind a per-project flag, so the sheet takes a `data-layout` attribute and the geometry table is selected by it.

**8.8.2 The watermark, and why it is three things.**

- `.rp-sheet__mark` — `aria-hidden`, `pointer-events: none`, rotated −24°, repeated, at `--rp-mark-alpha`. Bounded per §4.6.
- `.rp-sheet__band` — a full-contrast bar across the top of the page: the words, the reason, the count of blocked lines. This is what a screen reader gets, once.
- `.rp-signature--withheld` — the signature block **structurally replaced** by a `4px double` draft-coloured box naming what is missing and why.

The third is the important one. `ARCHITECTURE.md §6.3` says the signature block is *withheld*, not disabled, and this component takes that literally: **a greyed-out signature line photocopies into a signable signature line.** A withheld block cannot be signed by accident because there is nothing there to sign.

### 8.9 Provenance footer — the component with no print override

`USER_JOURNEY.md §7.3`'s five lines, in the numeral stack at `--rp-t-micro`, under a 2px ink rule:

```
Rates from wage determination CA20260012 revision 4, published 2026-07-31.   .rp-prov__claim
No newer revision existed as of 2026-08-13 02:41 ET.                          .rp-prov__freshness
Corpus snapshot 9f2c…a17e · engine 1.4.2 · generated 2026-08-14 15:52 PT      .rp-prov__build
Ratepin computed and formatted this document. The contractor certifies it.  .rp-prov__boundary
ratepin.com/v/8c1f-22a9                                                      .rp-prov__url
```

Three design facts:

1. **Line 1 is ink, not grey.** It is the product. D3 puts the entire paid boundary on the rate becoming an *assertion*, and this is the sentence in which it does.
2. **Line 2 is the only thing the freshness ladder changes.** `data-freshness="dated"` / `"stale"` turns it `--rp-dated` and bold. The status chip does not move, the rate does not move. That is D7 rendered as CSS: *an unresolved line moves the status; a stale check moves a sentence.*
3. **`.rp-prov` has no rule in the `@media print` block.** Deliberate and asserted: what is on the screen is what is on the paper the general contractor receives. D8 says the artifact is the channel; a footer that renders differently in the channel is not a channel.

`.rp-prov--chip` is the one-line inline form for the Friday board, same tokens, still carrying the revision number.

### 8.10 Alert banner — one variant per refusal primitive, and no success variant

**8.10.1 The four.**

| Class | Primitive | Hue | Used for |
|---|---|---|---|
| `.rp-alert--narrowed` | **P-C** | dated | freshness ladder L1/L2, quarantine, the staleness credit sentence |
| `.rp-alert--blocked` | **P-A / P-B** | draft | blocked lines, DRAFT artifact, XSD hash mismatch on the CA path |
| `.rp-alert--declined` | **P-D** | **none** | FAR 22.404-6 effectiveness, annualization, deduction permissibility, whether a classification is *correct*, SF-1444 |
| `.rp-alert--notice` | — | pin | `/status`, cold start, scheduled work |

**8.10.2 Why P-D has no colour.** A declined conclusion is not a warning and not an error. It is the most honest thing the product says — *here is the rule, here are the observable dates, we will not draw the conclusion* — and colouring it would convert a statement of epistemic limits into an alarm. It gets the sunken surface, a 4px ink start rule, and full-contrast body text. It looks like a note in the margin of a form, which is what it is. Compare run 1, which reached the same conclusion from the opposite direction (it refused to render an Amazon rejection in red); the shared principle is that **the palette must not editorialise about information the user needs to read carefully.**

**8.10.3 There is no `--success`.** `USER_JOURNEY.md §16.3` bans *"Your filing is compliant."* A system that ships a success banner is a system in which somebody eventually writes that sentence into one. The absence is the enforcement. The positive case is expressed by the `CERTIFIABLE` status chip and by the user's own counted number — *"12 of 12 titles resolved from memory this week"* — which is a fact about her data, not a claim about the world.

**8.10.4 Dismissal.** `--narrowed` and `--blocked` have no dismiss affordance: they carry a live claim narrowing and a live block. The CSS explicitly hides `.rp-alert__dismiss` inside them, so the fact that someone tried is visible in the markup at review.

### 8.11 Pricing card

Renders the D4 ladder — **Bid Sheet** $49 one-time, **Solo** $99/mo, **Crew** $249/mo, **Multi** $599/mo (display names per `NAMING.md` §7.3; price, metering and packaging unchanged from D4) — with `ARCHITECTURE.md §16 Challenge 1`'s resolution of the packaging function (included-filing allowances plus a $2.50 capped overage with auto-upgrade, no project or worker caps).

- `.rp-price__amount` is 44px in the numeral stack. It is the only place `--rp-t-fig` is used in the whole system.
- **`.rp-price__meter` is a table, not a bullet.** The value metric is single-variable — the certified filing — so the card states included filings, overage per filing, and the overage cap as three tabular rows. A cap buried in a feature list is how a cap becomes a churn event.
- **`.rp-price__item--not` prints what the tier does *not* do**, with an em dash instead of a check. A tier that only lists what it includes is a tier that will surprise somebody at 15:40 on a Friday.
- `.rp-price--recommended` is a **4px ink rule across the top** and a word. Not a coloured halo, not a scale-up, not a "MOST POPULAR" ribbon. The recommendation is stated so it can be disagreed with (Nielsen #3).
- **The system ships no component capable of expressing scarcity.** No countdown, no strikethrough price, no "N people viewing", no expiring offer, no social-proof strip. G-gate discipline makes most social proof unsayable anyway (*"Trusted by hundreds of contractors"* is banned until it is true and countable), and a design system that provides the container invites the copy. The stated cost: this pricing page will convert worse than a conventional one. That is accepted, not overlooked.
- **No "request a demo", no "talk to sales", no seat selector.** D4: no seats, no setup fee, no quote, no call, ever, at any tier.

### 8.12 Disclosure, progress, key hints, empty state, prose, legal micro-print

`.rp-disclose` is a styled `<details>` with a 44px summary and a caret from a text glyph — no icon dependency, so it survives forced-colors and print.

`.rp-progress` is **determinate only**. There is no indeterminate variant: where no honest proportion exists, the interface lists items and resolves them one at a time (§7.3). `.rp-progress__label` carries the number in tabular figures, because a bar without a number is a picture of a wait.

`kbd` / `.rp-kbd` is styled because §9.4 makes keyboard shortcuts a real part of this product and an unstyled `<kbd>` is invisible in documentation.

`.rp-empty` is dashed-bordered — the same "not yet filled" grammar as the dropzone — with a title, one sentence defining the product's central noun (*"A project is one federally funded job with one wage determination pinned to it."*) and one primary action. `USER_JOURNEY.md §17` and [NN/g](https://www.nngroup.com/articles/empty-state-interface-design/) both make the point that the empty state is the highest-attention screen a new user sees and the cheapest place to teach a noun.

`.rp-prose` is the long-form reading context — marketing copy, `/status` explanations, the export README — and it is **the only context in which the print stylesheet appends link URLs after anchors.** An artifact already carries exactly one URL, in its provenance block; a second copy printed after a link would be noise on a federal form.

`.rp-legal` is the second and last permitted use of 13px (R4): terms, the DO-NOT-ASSERT paragraph, the reproduced OMB burden notice. It is `--rp-ink-2` at 9.02:1, never `--rp-ink-mute` — *small* is a size, not permission to be unreadable. Compare run 1, which reached the same rule from the same place: "prominent" means legible.

### 8.13 Modal

`.rp-modal` is a `<dialog>` with a 2px ink border and a scrim. Two binding constraints: **no compliance decision may be taken in a modal** (the boundary statement, the status, the blocked line and the provenance all live on the page), and focus returns to the invoker on close (§9.2). It is used for exactly three things: confirming a destructive action, the deletion consequence screen, and the pre-run cost disclosure of J9.

---

## 9. Focus and keyboard

### 9.1 The focus indicator

Three parts, in this order from the control outward: a **2px halo** in the local surface colour (`box-shadow`, so it follows `border-radius`), then a **3px ring** in `--rp-focus`, at `outline-offset: 2px`.

The halo is what makes this work on an ink-filled button. Because the halo separates the ring from the control, **the ring's two adjacent colours are always the halo and the page ground, never the control's own fill.** So:

| adjacency | light | dark |
|---|---|---|
| ring vs page ground | 6.55 | 9.12 |
| ring vs halo | 8.17 | 9.12 |
| halo vs the ink fill it surrounds | 18.71 | 16.44 |

All three clear the 3:1 that [SC 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) asks for against adjacent colours, and the indicator's area (a 3px ring around the full perimeter) exceeds the criterion's minimum-area test for every control in the system. In high-contrast mode the ring goes to 4px.

`outline` is never set to `none` without a replacement in the same rule. A `:focus` fallback exists under `@supports not selector(:focus-visible)`.

### 9.2 Focus behaviour

- The **skip link is the first focusable element on every page** and becomes visible on focus.
- **Focus order is document order.** There is no positive `tabindex` anywhere; that is a lint rule.
- Focus is never trapped except inside `<dialog>`, which returns focus to its invoker on close.
- The dropzone reflects its hidden input's focus (§8.4). No control in this system has an invisible focus state.

### 9.3 SC 2.4.11 — focus is never obscured

The sticky header and the sticky table head are the only two things that can cover a focused control. Every focusable element therefore reserves both:

```css
:where(a, button, input, select, textarea, summary, [tabindex]) {
  scroll-margin-block-start: calc(var(--rp-header-h) + var(--rp-row-h) + var(--rp-s-3));
}
```

That single rule is the entire compliance mechanism for [SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), and it stays correct when density changes because it is expressed in the same tokens the sticky elements are (`scroll-margin` on [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin)).

### 9.4 Keyboard model

`USER_JOURNEY.md §18`: *"the app is keyboard-complete, because a payroll administrator entering 26 workers uses the keyboard and resents the mouse."*

| Context | Keys |
|---|---|
| Global | <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>; <kbd>Esc</kbd> closes a dialog or disclosure and returns focus |
| Classification picker | it is a `radiogroup`: <kbd>↑</kbd><kbd>↓</kbd> move and select, <kbd>Space</kbd> selects, <kbd>Enter</kbd> commits the row |
| Column-mapping grid (S14) | <kbd>Tab</kbd> across, **<kbd>Enter</kbd> commits and moves down** — spreadsheet muscle memory, because the file came out of a spreadsheet |
| Data tables | rows are not focusable; the controls inside them are. The Friday board's rows are links, so they are |
| Shortcuts | **every shortcut requires a modifier.** No single-character shortcut exists anywhere, per [SC 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) — no `/`-to-search, no `g`-then-`w`. The cost is a slightly slower power user; the benefit is that speech-input users do not fire commands by talking |

**Test.** Unplug the mouse. Complete J5 (upload), J6 (resolve fourteen classifications) and J7 (generate, preview, download) without it. Any step that cannot be completed is a bug, not a limitation.

---

## 10. Theme resolution

### 10.1 Three states, resolved in this order

1. **`:root` bare — light.** Every colour's first definition. A page with no media-query support and no attribute renders correctly.
2. **`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`** — system dark, unless the user explicitly chose light.
3. **`:root[data-theme="dark"]`** — the explicit toggle, higher precedence, so the toggle wins in **both** directions regardless of the system setting.

### 10.2 `color-scheme: light dark`

Declared on `:root` so form controls, scrollbars and the `::backdrop` default follow the theme.

### 10.3 High contrast — a fourth state, and why this product needs one

There is no media query for *sun on the screen*. [`prefers-contrast: more`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) is the closest published signal and this system honours it, but it reports a stored user preference, not a lighting condition. So `data-contrast="high"` is also a first-class, user-settable state, sitting next to the density preference in settings. It raises ink to pure black (light) / pure white (dark), collapses the ground into the surface, promotes the hairline to a 4.71:1 rule, deepens all four hues, and takes the focus ring to 4px. Every pair is certified in §4.5.

This is a straightforwardly different priority from run 1, which had no high-contrast mode at all — correctly, for a product used at 2am on a phone. Ratepin's room is bright and its panel is bad, so the mode earns its place.

### 10.4 One rule for both themes

The high-contrast block references only `--rp-hc-*` primitives, and those primitives are **redefined inside the dark blocks**. Because custom-property substitution resolves against the *computed* value of the referenced property on the same element, one set of declarations produces the light boost in light and the dark boost in dark. The block must therefore come **after** the dark blocks in source order, which is why the `@layer` order in the stylesheet is fixed and documented ([MDN, `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)).

### 10.5 `forced-colors: active`

`forced-color-adjust` is used nowhere; the system's colours win outright. The structure survives because hierarchy here is carried by borders and weight, which forced-colors preserves — the payoff for R1. The three statuses stay separable because they were built on `border-style`, which forced-colors does not touch. The watermark is dropped (an opacity overlay is meaningless once colours are forced) and §8.8.2's band and withheld block carry the instruction alone.

### 10.6 Density

`data-density` (§6.2), stored per account. Independent of theme and contrast; all nine combinations are valid and none of them changes a contrast pair.

---

## 11. Print

Two print paths, because they are two different documents.

### 11.1 The review screen — portrait Letter

`@page { size: letter portrait; margin: 0.6in }`. Chrome is dropped (`.rp-header`, `.rp-btn`, `.rp-drop`, `.rp-progress`, `.rp-modal`, nav). What survives is what a general contractor or an auditor reads: the table, the exception report, the status chip, the boundary statement and the provenance block. `thead` repeats per page; rows and alerts and picker cards avoid breaking; headings avoid orphaning; `orphans`/`widows` are 3.

### 11.2 The WH-347 preview — landscape Letter, true size

```css
@page rp-wh347 { size: letter landscape; margin: 0.35in; }
.rp-sheet { page: rp-wh347; break-after: page; }
```

Named pages let a single document print its prose portrait and its artifact landscape. `size: letter landscape` is the standard descriptor form ([MDN, `@page/size`](https://developer.mozilla.org/en-US/docs/Web/CSS/@page/size)) and matches the DOL PDF's verified `MediaBox` of 792 × 612 pt (§8.8.1). `:root[data-print="artifact"]` hides everything outside `.rp-print-root`, which the app sets before `window.print()` so the review chrome never reaches the tray.

**Named pages are progressive.** Where the engine does not honour `page: rp-wh347`, the sheet prints on the portrait default — degraded, not broken, and the downloaded PDF is the authoritative artifact regardless (§11.4). `overflow` is returned to `visible` on the sheet in print so nothing is clipped by the screen preview's fixed aspect ratio.

### 11.3 Colour on paper

The print block **forces the light palette regardless of the reader's screen theme** — an inverted artifact is not the artifact — by redefining the semantic tokens inside `@media print` for both `:root` and `:root[data-theme="dark"]`. These are the only hard-coded colours outside the token system in the whole file, and the reason is stated in the CSS: paper has one theme.

`print-color-adjust: exact` (with the `-webkit-` alias) is applied to precisely five things — the status chip, the artifact band, the withheld signature block, the watermark, and the blocked/narrowed banners — because the browser's default `economy` behaviour is explicitly allowed to drop backgrounds and rewrite colours to save ink ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust)). Those five carry instructions, not decoration. Everything else prints as ink on white, which is what it already was.

### 11.4 The honest limit

**The downloaded PDF from our renderer is the artifact.** This stylesheet makes the browser print path usable; it cannot switch off the browser's own headers and footers or its "fit to page" scaling, both of which are user settings no page can reach. The in-product copy says so rather than pretending, which is the same discipline `USER_JOURNEY.md §16` applies everywhere else.

---

## 12. What this system deliberately cannot express

Absence is enforcement. Each row is a component that does not exist, so the copy that would need it cannot be written.

| Not built | Consequence |
|---|---|
| Support widget, chat bubble, "contact us", styled `mailto:` | **A3.** Combined with the route-tree lint in `ARCHITECTURE.md §13`, there is no way to add one that survives review |
| `alert--success` | *"Your filing is compliant"* has no container (§8.10.3) |
| Countdown, scarcity badge, strikethrough price, "N viewing", social-proof strip | G-gate discipline is structural rather than editorial (§8.11) |
| Indeterminate spinner, skeleton screen | Waiting is answered with information (§7.3) |
| A fourth status chip | `deriveStatus` has three members and this is its visual counterpart (§8.7) |
| Elevation scale | R1; separation is surfaces and rules |
| An icon set | Every glyph is a text character, so everything survives print, fax and forced-colors |
| A "review queue" or "reviewer" view | There is no human review at any tier. It is not disabled; it does not exist |
| Any font file | §5.1 |

---

## 13. Challenges to binding decisions — flagged, not silently redesigned

Both are implemented **as specified**. These are notes for the record.

**Challenge DS-1 — against D8: the provenance footer sits on the face of a federal form.**
D8 makes the artifact the distribution channel: every WH-347 travels weekly to a GC carrying its provenance footer and a `ratepin.com/v/…` URL. The design risk is specific rather than aesthetic. The WH-347's form and content are prescribed by [29 CFR 5.5(a)(3)](https://www.ecfr.gov/current/title-29/section-5.5), and deep dive 04 already found that receiving clerks reject unfamiliar layouts — that is why ADR-012 ships two layouts. A vendor URL on the face of the submitted form is exactly the kind of unfamiliar mark that gets a filing bounced back at 16:30 on a Friday, and a bounced filing is a churn event dressed as a distribution win. **Implemented as written** (footer on the artifact, below the ruled area, in the bottom margin). **Proposed for v1.1:** a per-project `provenance_placement` flag with a second option that moves the block to an attached continuation page carrying the same five lines. The distribution value is preserved — the GC still receives it — and the face of the federal form stays as prescribed. This is a `projects` column and a geometry-table branch; no engine change.

**Challenge DS-2 — against D4: four price points rendered as four cards is the wrong information design for a single-variable meter.**
D4's ladder is four tiers, and the market convention is four cards. But `ARCHITECTURE.md §16 Challenge 1` resolves the pricing *function* to one variable — included filings plus a capped overage — and a single variable compared across four options is a **table**, not four cards a reader has to hold in working memory while scrolling sideways. Deep dive 03's finding sharpens it: CertifiedPayrollPro's $49 buys five projects where D4's $99 buys one, so the comparison a buyer actually runs is numeric and cross-tier. **Implemented as specified** (four `.rp-price` cards). The compromise inside the implementation is `.rp-price__meter`: each card carries the same three-row tabular block in the same order, so a reader can compare down the row across cards without re-reading prose. **Proposed for v1.1:** a `.rp-price-matrix` variant that renders the same tokens as one comparison table on viewports over 60rem, A/B measured on checkout starts.

---

## 14. Open questions and flagged hypotheses

1. **17px base and 44px rows are a judgement, not a measured optimum for this population.** NN/g gives ≥12pt as the floor for senior-targeted sites and we are comfortably above it, but nobody has tested Ratepin with a 55-year-old payroll administrator on a TN panel in a trailer. **Instrument it:** `data-density` and `data-contrast` selections are counted per account. If a large share of accounts move to `roomy` or `high`, the defaults are wrong and the counter says so before a support channel we do not have would have.
2. **"Border style survives a fax" is asserted from the physics of 1-bit halftoning, not measured on a real fax.** Solid, dashed and double at 2–4px should threshold cleanly; a 20% tint may not. This is why the withheld signature block is structural rather than optical. **The natural place to learn** is G2's acceptance capture: an artifact rejected by a receiving party is recorded with a reason.
3. **`prefers-contrast: more` is not a glare sensor.** The manual `data-contrast="high"` toggle is the mitigation; its usage rate relative to the media-query rate is the measurement of how big the gap is.
4. **`:has()` carries the picker's selected state**, with a `[data-checked]` fallback. The fallback is not decorative — it must be set by the component on change, and a picker that relies on `:has()` alone is a review failure.
5. **The 44px `--rp-target-min` versus compact's 36px rows.** Both clear their criteria, but a 36px row with a 24px control inside it is close to the spacing exception's boundary in [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Compact should be audited with a real spacing measurement before it ships, not assumed from the token values.
6. **No measured claim about this design appears anywhere.** Consistent with G1–G6: this document contains no assertion that the system is faster, clearer or less error-prone than an incumbent's, because nobody has measured it.

---

## 15. References

**Standards and specifications**

- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2* — https://www.w3.org/TR/WCAG22/
- W3C, WCAG 2.2 definition of relative luminance — https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
- W3C, WCAG 2.2 definition of contrast ratio — https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
- W3C, *Understanding SC 1.4.3 Contrast (Minimum)* — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- W3C, *Understanding SC 1.4.1 Use of Color* — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- W3C, *Understanding SC 1.4.11 Non-text Contrast* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- W3C, *Understanding SC 1.4.12 Text Spacing* — https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- W3C, *Understanding SC 1.4.10 Reflow* — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C, *Understanding SC 2.1.4 Character Key Shortcuts* — https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html
- W3C, *Understanding SC 2.4.11 Focus Not Obscured (Minimum)* — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- W3C, *Understanding SC 2.4.13 Focus Appearance* — https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- W3C, *Understanding SC 2.5.8 Target Size (Minimum)* — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C, *Understanding SC 3.2.6 Consistent Help* — https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
- W3C, *Understanding SC 3.3.7 Redundant Entry* — https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- W3C WAI, *Older Users and Web Accessibility* — https://www.w3.org/WAI/older-users/
- W3C, *CSS Color Module Level 4* — https://www.w3.org/TR/css-color-4/

**Platform documentation**

- MDN, `font-variant-numeric` — https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
- MDN, `print-color-adjust` — https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust
- MDN, `@page` `size` descriptor — https://developer.mozilla.org/en-US/docs/Web/CSS/@page/size
- MDN, `scroll-margin` — https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin
- MDN, `@media (prefers-contrast)` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
- MDN, `@media (prefers-reduced-motion)` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN, `@media (forced-colors)` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- MDN, `:has()` — https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- MDN, `@layer` — https://developer.mozilla.org/en-US/docs/Web/CSS/@layer

**Usability research**

- Nielsen Norman Group, *10 Usability Heuristics for User Interface Design* — https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen Norman Group, *Response Times: The 3 Important Limits* — https://www.nngroup.com/articles/response-times-3-important-limits/
- Nielsen Norman Group, *Usability for Senior Citizens: Improved, But Still Lacking* (55.3% vs 74.5% success; 7:49 vs 5:28; 2.4 vs 1.1 errors; ≥12pt default) — https://www.nngroup.com/articles/usability-seniors-improvements/
- Nielsen Norman Group, *Usability for Older Adults: Challenges and Changes* — https://www.nngroup.com/articles/usability-for-senior-citizens/
- Nielsen Norman Group, *UX Design for Seniors*, 3rd ed. (123 participants aged 65+, five countries) — https://www.nngroup.com/reports/senior-citizens-on-the-web/
- Nielsen Norman Group, *Recognition Rather Than Recall* — https://www.nngroup.com/articles/recognition-and-recall/
- Nielsen Norman Group, *How Users Read on the Web* — https://www.nngroup.com/articles/how-users-read-on-the-web/
- Nielsen Norman Group, *Error Message Guidelines* — https://www.nngroup.com/articles/error-message-guidelines/
- Nielsen Norman Group, *Empty States in App and Website Design* — https://www.nngroup.com/articles/empty-state-interface-design/
- Nielsen Norman Group, *Progress Indicators Make a Slow System Less Insufferable* — https://www.nngroup.com/articles/progress-indicators/
- Jessica Enders, *Zebra Striping: Does it Really Help?*, A List Apart (244 participants; no significant accuracy gain) — https://alistapart.com/article/zebrastripingdoesithelp/
- Jessica Enders, *Zebra Striping: More Data for the Case*, A List Apart — https://alistapart.com/article/zebrastripingmoredataforthecase/

**Domain sources**

- U.S. DOL WHD, *Form WH-347* (OMB 1235-0008, expires 01/31/2028; 55 minutes per response; columns 1A–1E, 2, 3, 4, 5, 6A, 6B, 6C, 7A, 7B, 8, 9) — https://www.dol.gov/agencies/whd/forms/wh347
- U.S. DOL WHD, WH-347 form PDF (verified 2026-08-13: 2 pages, `MediaBox [0.0 0.0 792.0 612.0]` = 11in × 8.5in landscape) — https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf
- eCFR, 29 CFR 5.5 — contract provisions and the statement of compliance — https://www.ecfr.gov/current/title-29/section-5.5
- eCFR, 29 CFR part 5 — https://www.ecfr.gov/current/title-29/subtitle-A/part-5
- U.S. DOL WHD, *Government Contracts — Construction* — https://www.dol.gov/agencies/whd/government-contracts/construction
- California DIR, *Certified Payroll Reporting* — https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html
