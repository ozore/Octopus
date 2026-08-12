# CLAUSEWRIGHT — DESIGN SYSTEM (v1)

**Product:** Clausewright — *Suspension Defense Copilot for Amazon and Walmart sellers*
**Tagline:** *"Every day dark costs you a day's sales. Get back to selling — with the exact policy clause on your side."*
**Implementation:** `/home/user/Octopus/phase-2-build/identity/design-system.css`
**Document owner:** Design-system designer
**Date:** 2026-08-12
**Status:** Binding for the Phase-2 build. Amendments require a named source and a note of what they supersede.

**Upstream sources (treated as inputs, not re-derived):**

- `/home/user/Octopus/phase-1-ideation/IDEA_DOSSIER.md` — single source of truth; §0 decisions **D1–D10**, §1.3 the loss counter, §6.1 the Perceived-Likelihood levers, §7.3 build list **B1–B11**.
- `/home/user/Octopus/phase-2-build/identity/NAMING.md` — the name, the tagline, and the seven naming invariants (§5) that bind all on-screen copy.
- `/home/user/Octopus/phase-2-build/architecture/ARCHITECTURE.md` — §3.1 the web app, invariant **I2** (the citation gate), the Liquid-Glass alignment note that explicitly defers "concrete tokens" to this document.
- `/home/user/Octopus/phase-2-build/architecture/USER_JOURNEY.md` — §8, the eight **emotional design constraints**, which this system exists to make executable, and §5's Nielsen matrix across screens S1–S17.

---

## 0. What this document is for, and the one sentence it answers

`ARCHITECTURE.md §3.1` states the visual direction and then says, verbatim, *"Concrete tokens are the identity workstream's output, not this document's."* This document is that output. `USER_JOURNEY.md §8` states eight emotional constraints as binding requirements and offers no mechanism to satisfy them. This document is that mechanism.

The single question every token below answers:

> **How does an interface stay calm, legible and trustworthy for someone who is panicking at 2am, when the most important thing on the screen is a block of quoted policy text they have to actually read?**

Everything follows from that. Where a fashionable Liquid-Glass effect and a legible clause conflict, **the clause wins** — which is Apple's own instruction, not a local exception. The [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) put content first and describe the material layer as something that "establishes a visual hierarchy" *beneath* content rather than competing with it. Nielsen's heuristic #8, *aesthetic and minimalist design*, states that "dialogues should not contain information which is irrelevant or rarely needed… every extra unit of information competes with the relevant units and diminishes their relative visibility" ([Nielsen, 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)). A decorative blur is an extra unit of information.

---

## 1. Design principles

Seven principles. Each is traceable to a published source and to a binding upstream decision, and each has a falsifiable test — a rule that can be checked in review rather than argued about.

### P1 — Content first; the material recedes

**Source.** Apple HIG (Liquid Glass): the system is explicitly content-first, and the glass material exists to separate an interactive layer from content, not to decorate it. Nielsen #8.

**Applied here.** The one thing on screen that must never compete for attention is the **cited policy clause**. Per `ARCHITECTURE.md I2`, no policy reference reaches the render layer unless it originated in a citation object — the citation *is* the product (dossier §6.1 lever 1: *"show the retrieved policy clause verbatim with its source; no competitor surfaces this today"*). It therefore gets the highest-contrast ink, the widest measure, and the most whitespace of anything in the interface.

**Test.** On any screen, the highest-contrast text and the largest uninterrupted whitespace block belong to content, never to chrome. If a glass panel is the most visually salient object on a screen, that screen fails review.

### P2 — Translucency communicates hierarchy, and nothing else

**Source.** Apple HIG (Liquid Glass): translucency and layered materials express depth and the relationship between an interactive layer and the content behind it.

**Applied here.** We define exactly **three material levels** (§7), mapped to exactly three meanings:

| Level | Meaning | Where |
|---|---|---|
| **L1 veil** | Chrome that floats over content and must never claim it | Sticky header, the toast/announcement rail |
| **L2 card** | A discrete, ownable result surface | Glass card, citation chip, pricing card, timeline shell |
| **L3 sheet** | A layer that has taken modal precedence | Paywall sheet, pre-submission checklist, escalation confirm |

There is no fourth level and no per-component blur value. A designer wanting "a bit more blur here" is expressing a hierarchy change and must say which of the three levels they mean.

**Test.** Every translucent surface in the codebase uses one of `.cw-mat-1`, `.cw-mat-2`, `.cw-mat-3`. A bespoke `backdrop-filter` declaration outside `design-system.css` is a review failure.

### P3 — Depth by layered material, not by drop shadow

**Source.** Apple HIG (Liquid Glass) — depth is carried by the material's optical behaviour (blur, saturation, a specular edge) rather than by heavy cast shadows.

**Applied here.** Shadows exist but are deliberately low-contrast and short-throw (§6.4); the perceptible separation comes from the blur, the saturation lift, and a **1px inner highlight on the top edge** of each glass surface (the `--cw-glass-specular` token) which reads as light catching a physical edge. This is what makes the surface look like glass rather than like a semi-transparent `div`.

**Test.** Disable every `box-shadow` in devtools. The layer hierarchy must still be readable. If it collapses, the design was leaning on shadows.

### P4 — Calm over alarm: the palette is a stress intervention

**Source.** `USER_JOURNEY.md §8.4`, binding: *"Generous whitespace and a restrained palette over alarm-red saturation… Deficiencies and risk language are set in a calm neutral tone, not error-red, because they are diagnostic information the seller needs to read carefully, not an alarm to react to."*

**Applied here.** This has three concrete consequences that are unusual enough to state explicitly:

1. **The readiness critique (B6) is not styled as an error state.** It renders in slate ink on a neutral surface with an amber-ochre marker, never in rose. The critique names deficiencies *in order to be read carefully*; a red panel produces avoidance, not reading.
2. **Rose is reserved for exactly two things:** a destructive confirmation (cancel subscription, delete case) and a genuine system failure the seller must act on. Amazon's *rejection* of an appeal — objectively the worst moment in the arc (`USER_JOURNEY.md §2.1`) — is rendered in **slate, with the guarantee in green**, because the design job at that moment is "this is not the end of the road," and red says the opposite.
3. **Green means recovery, not merely success.** It marks the path back online: the primary CTA, a reinstatement, the guarantee, an "all clear" from Shield. It is a muted forest green (`#16704D` light / `#6FC29C` dark), not a saturated confirmation green, because a bright green next to a suspension notice reads as tonally wrong.

**Test.** Grep the codebase for rose tokens. Every use must be a destructive action or a system failure. Any rose on a critique, a risk score, or a rejection screen is a review failure.

### P5 — Real urgency is displayed; it is never manufactured, and it is never styled as an alarm

**Source.** Hormozi, *$100M Offers* (2021) — genuine urgency is stated, invented urgency is a manipulation. Dossier §1.3 and `USER_JOURNEY.md §8.3`, binding: the loss counter (`days_dark × self_reported_daily_revenue`) is *the only* urgency device in the product.

**Applied here.** The loss counter gets a dedicated component (§8.9) that is deliberately **quiet**: tabular-lining numerals, slate ink, no red, no pulse, no animation on change, and the seller's own input rendered inline and editable so it is visibly *their* number. There is no countdown timer, no scarcity badge, and no component in this system capable of expressing one — the omission is the enforcement.

**Test.** The system ships no countdown, no "N people viewing," no expiring-offer banner. If a future component needs one, that is a dossier-level decision, not a design decision.

### P6 — One primary action per screen, and the human backstop is always visible

**Source.** `USER_JOURNEY.md §8.1` and `§8.7`, binding. Dossier **D3**: the category is *copilot*, not "generator that walks away." Nielsen #3 (*user control and freedom*) — neither option in a genuine choice may be visually punished.

**Applied here.** The button system has exactly one `.cw-btn--primary` per screen. The human-escalation path is a `.cw-btn--secondary` rendered inline at full legibility — never a text link in a footer, never behind a help menu. At the two screens where a *real* symmetric choice exists (S4 tier choice, S15 renewal), both options are `.cw-btn--secondary` and the recommended one carries a `.cw-chip--recommend` label rather than heavier visual weight, so the recommendation is stated in words the user can disagree with rather than imposed by contrast.

**Test.** Count `.cw-btn--primary` per rendered screen. If it is not exactly 0 or 1, the screen fails.

### P7 — Every state is designed, especially waiting and ending

**Source.** Nielsen #1 (*visibility of system status*) — `USER_JOURNEY.md §6` identifies the 10-minute wait as "the single highest-risk UX surface in the product." Fredrickson & Kahneman's peak-end rule (1993, *JPSP*) via `USER_JOURNEY.md §8.8` — endings get the same design attention as beginnings.

**Applied here.** The **status timeline** (§8.3) is a first-class component, not a spinner, because per `ARCHITECTURE.md §3.2` the four pipeline stages are genuine code-level state transitions and can therefore narrate *real* checkpoints. This is Anthropic's ["Building Effective Agents"](https://www.anthropic.com/engineering/building-effective-agents) workflow discipline surfacing directly in the UI: because control flow lives in code rather than in an agent's opaque loop, the interface has honest checkpoints to show. **D9 buys us a UX asset**, not just an engineering one. The cancellation and reinstatement confirmations use the same components and the same care as the paste screen.

**Test.** Every component in §8 ships `idle / loading / success / warning / error / disabled / empty` where applicable, and the loading state is never a bare spinner where a real checkpoint exists.

---

## 2. The Bounded Backdrop Rule — how we get WCAG AA *through* translucency

This is the most important engineering decision in this document, so it is stated before the tokens.

**The problem.** Contrast ratio is a function of two rendered colours. A `backdrop-filter` surface has no fixed rendered colour: it is a composite of the material tint and *whatever happens to be behind it*. An interface that scrolls arbitrary content under a translucent panel has an **indeterminate** contrast ratio, and no amount of token discipline fixes that. This is the reason most glass interfaces quietly fail WCAG 1.4.3.

**The rule.** Translucent materials in Clausewright may only be composited over backdrops whose colour lies inside a **declared luminance band**. The band is expressed as two tokens per theme — `--cw-backdrop-floor` and `--cw-backdrop-ceil` — and the page background system (§4.4) is constructed so that no pixel behind a glass surface can fall outside it. Because the band is bounded, the **worst-case composite is computable**, and every contrast pair in §4.5 is certified against that worst case rather than against a hopeful average.

**The bands (exact values):**

| Theme | `--cw-backdrop-floor` | `--cw-backdrop-ceil` | Worst-case direction |
|---|---|---|---|
| Light | `#DCE4EF` | `#FFFFFF` | Darkest backdrop → darkest composite → worst for dark ink |
| Dark | `#070C12` | `#1B2A3A` | Lightest backdrop → lightest composite → worst for light ink |

**The enforcement, three mechanisms:**

1. **The ambient background is generated, not arbitrary.** `body` renders a fixed radial-gradient field whose stops are drawn only from inside the band (§4.4). There is no photographic hero image, no video, no user-supplied background — which is also a performance and a CSP decision, not only an accessibility one.
2. **Glass never composites over glass.** `.cw-mat-*` surfaces do not nest. A nested translucent surface multiplies the composite space and makes the band unprovable. Nested surfaces use the **solid** inset tokens (`--cw-surface-inset`) instead.
3. **A minimum tint alpha per level.** No material drops below `0.55` alpha (dark L1) / `0.62` (light L1). Below that the backdrop dominates the composite and the band stops constraining anything.

**Why this is worth the constraint.** It converts an aesthetic that is normally an accessibility liability into a *verified* one — the same move `ARCHITECTURE.md` makes with the citation gate (**I2**), where a trust property is enforced structurally in code rather than promised procedurally. That is [Twelve-Factor](https://12factor.net/) discipline (build/release/run separation, explicit config, guarantees in the artifact rather than the runbook) applied to visual design: the contrast guarantee is a property of the token set, not of a designer's diligence.

**Flagged as a design judgment:** the specific band endpoints are chosen so that the resulting worst-case composites clear AA with headroom (§4.5 shows the smallest margin at 4.56:1 against a 4.5:1 requirement, and 3.52:1 against a 3:1 requirement). They are not drawn from a published source. **Hypothesis; the method is sound, the endpoints are tuned.**

---

## 3. Accessibility commitments

These are commitments, not aspirations. Each names the WCAG 2.1 success criterion it satisfies and how it is enforced.

| # | Commitment | Criterion | Enforcement |
|---|---|---|---|
| **A1** | All body and UI text clears **4.5:1** against the worst-case composite of the material it sits on. Large text (≥24px, or ≥18.66px bold) clears 3:1 but we hold it to 4.5:1 anyway. | 1.4.3 Contrast (Minimum), AA | §4.5 certification table; §2 Bounded Backdrop Rule |
| **A2** | All meaningful non-text boundaries — form-field borders, focus indicators, status dots, the timeline rail, chart-free state markers — clear **3:1**. | 1.4.11 Non-text Contrast, AA | §4.5; field border tokens verified at 3.52–3.85:1 |
| **A3** | **`prefers-reduced-transparency: reduce` removes all translucency**, replacing every material with a certified opaque surface. Not a degraded fallback — a first-class alternate rendering that keeps identical spacing, hierarchy and contrast. | 1.4.3 / general | `@media (prefers-reduced-transparency: reduce)` block in `design-system.css`; opaque tokens verified at 15.44:1 (light) and 13.75:1 (dark) for primary ink |
| **A4** | **`prefers-reduced-motion: reduce` removes all non-essential motion**, including the timeline's progress animation, which degrades to instant state changes. Essential status change remains visible as a discrete state, never as motion alone. | 2.3.3 Animation from Interactions, AAA (adopted) | `@media (prefers-reduced-motion: reduce)`; all durations set to `0.01ms`, never `0`, so `transitionend` handlers still fire |
| **A5** | **Focus is always visible and never removed.** A two-part ring (a 2px accent ring plus a 2px offset halo in the surface colour) so it survives on both glass and solid surfaces. `:focus-visible` is used so mouse users are not punished, but `:focus` fallback exists for browsers without support. | 2.4.7 Focus Visible, AA | `--cw-ring-*` tokens; `outline` is never set to `none` without a replacement in the same rule |
| **A6** | **Colour is never the sole carrier of meaning.** Every status uses a shape *and* a label alongside its colour: the timeline uses distinct node glyphs, the citation chip carries a quotation mark and an attribution line, the risk levels carry text labels. | 1.4.1 Use of Color, A | Component specs in §8 each name their non-colour redundancy |
| **A7** | **Target size ≥44×44px** for every interactive control, including the small icon buttons, achieved with padding or an invisible `::after` hit-slop rather than by enlarging the visual. | 2.5.5 Target Size, AAA (adopted) — HIG concurs at 44pt | `--cw-target-min: 2.75rem`; `.cw-hitslop` utility |
| **A8** | **Type scales with the user's root font size.** Every size, spacing and radius token is in `rem`. Nothing in this system is expressed in `px` except hairline borders and the specular edge. Layout must survive 200% text zoom without loss of content or functionality. | 1.4.4 Resize Text, AA; 1.4.10 Reflow, AA | rem-only scales in §5–§6; `max-inline-size` in `ch` for measure |
| **A9** | **`forced-colors: active` (Windows High Contrast) is handled**, not left to chance: materials become `Canvas`, borders become `CanvasText`, the focus ring becomes `Highlight`, and `forced-color-adjust: none` is used nowhere. | 1.4.3 / platform | `@media (forced-colors: active)` block |
| **A10** | **The cited clause is announced as quotation plus attribution.** `ARCHITECTURE.md §3.1` makes this an invariant, not a polish item: the chip is a `<figure>` containing a `<blockquote cite="…">` and a `<figcaption>`, so a screen reader conveys *what was quoted and where it came from* — the product's core claim — without relying on visual chip styling. | 1.3.1 Info and Relationships, A | §8.5 markup contract |
| **A11** | **Status changes are announced.** The status timeline is an `aria-live="polite"` region; the 10-minute SLA clock is `aria-live="off"` with a labelled text alternative updated at milestones, not per-second, to avoid a screen-reader flood. | 4.1.3 Status Messages, AA | §8.3 markup contract |
| **A12** | **Dark mode is not a filter.** Light and dark are independently authored palettes with independently verified contrast, per §4. Dark surfaces are never pure `#000` and dark ink is never pure `#FFF`, to reduce halation for astigmatic and light-sensitive readers. | Beyond AA; general | §4.2 |

**Honest limit, flagged.** WCAG has no success criterion for *translucency*, so A1/A2 above are our own extension of 1.4.3 and 1.4.11 to a composite surface via §2. This is the correct reading of the criteria's intent, but "certified against a bounded worst case" is a method we are asserting, not one drawn from a published conformance technique. **Flagged as a hypothesis about method; the underlying ratio arithmetic is standard and reproducible from the values in §4.**

---

## 4. Colour

### 4.1 The palette rationale

Two hues carry the whole system, per the emotional brief (`USER_JOURNEY.md §8.4`) — **deep blue-slate** as the base and **recovery green** as the accent.

- **Blue-slate (hue ≈ 215°)** is the substrate: every ink, every surface, every border. Blue-slate rather than neutral grey because a fully desaturated grey reads as institutional and cold, and this product is talking to someone frightened; a slight blue cast reads as composed rather than clinical. It is also the ink of the *document* the seller is about to submit, which is the right association.
- **Recovery green (hue ≈ 158°)** is used sparingly and always means *the way back online*: the primary CTA, the guarantee, a reinstatement, an all-clear. Muted forest rather than saturated emerald, per **P4**.
- **Azure (hue ≈ 205°)** is the *citation* hue and nothing else. It marks quoted source material and the links into it. Giving citations their own colour is `NAMING.md §5` invariant 7 executed visually — *"brand the proof, not the feature."* When a competitor adds citations (dossier R7), we already own the word, the chip and the colour.
- **Ochre-amber (hue ≈ 39°)** carries the readiness critique and risk language. Amber rather than red, per **P4.1**.
- **Rose (hue ≈ 5°)** is destructive and failure only, per **P4.2**.

### 4.2 Primitive ramps — exact values

These are the raw pigments. **Components never reference them directly**; they reference the semantic tokens in §4.3. This two-tier structure is the standard token discipline and is what makes a theme swap a single-file change.

**Slate (base)**

| Token | Hex | Role |
|---|---|---|
| `--cw-slate-50` | `#F5F7FB` | Light glass worst-case composite |
| `--cw-slate-100` | `#E8EEF6` | Light inset surface |
| `--cw-slate-200` | `#DCE4EF` | Light backdrop floor, hairline |
| `--cw-slate-300` | `#B0BCCD` | Light divider |
| `--cw-slate-400` | `#8494AB` | Light disabled ink |
| `--cw-slate-450` | `#748399` | **Light field border (3.52:1 min)** |
| `--cw-slate-500` | `#5F7189` | **Light tertiary ink (4.56:1 min)** |
| `--cw-slate-550` | `#758AA3` | **Dark field border (3.74:1 min)** |
| `--cw-slate-600` | `#47586E` | Light icon |
| `--cw-slate-700` | `#334357` | **Light secondary ink (9.23:1 min)** |
| `--cw-slate-800` | `#26333F` | **Dark material tint base** |
| `--cw-slate-900` | `#16212D` | **Light primary ink (14.89:1 min)** |
| `--cw-slate-950` | `#0A1017` | Dark canvas |
| `--cw-slate-1000` | `#070C12` | Dark backdrop floor |

**Dark-side inks** (authored independently, per A12)

| Token | Hex | Role |
|---|---|---|
| `--cw-mist-100` | `#F2F6FA` | Dark primary ink (12.21:1 min) — never `#FFF` |
| `--cw-mist-200` | `#C7D3E0` | Dark secondary ink (8.73:1 min) |
| `--cw-mist-300` | `#9AAABC` | Dark tertiary ink (5.59:1 min) |
| `--cw-mist-400` | `#6A7D96` | Dark disabled ink |

**Recovery green**

| Token | Hex | Role |
|---|---|---|
| `--cw-green-100` | `#CDEBDC` | Light tint text on green fill (rare) |
| `--cw-green-200` | `#A3D9BF` | Dark high-emphasis green ink |
| `--cw-green-300` | `#6FC29C` | **Dark accent ink (6.23:1 min)** |
| `--cw-green-400` | `#43B486` | Dark CTA hover fill |
| `--cw-green-450` | `#35A97A` | **Dark CTA fill (6.46:1 with `--cw-green-1000`)** |
| `--cw-green-500` | `#2E9E71` | Dark CTA active fill |
| `--cw-green-600` | `#16704D` | **Light CTA fill / light accent ink (5.55:1 min)** |
| `--cw-green-700` | `#125C41` | Light CTA hover fill |
| `--cw-green-800` | `#11593E` | Light CTA active fill / high-emphasis ink |
| `--cw-green-1000` | `#06120C` | Ink on dark green fills |

**Azure (citation)**

| Token | Hex | Role |
|---|---|---|
| `--cw-azure-200` | `#A6CFEC` | Dark citation ink, high emphasis |
| `--cw-azure-300` | `#79B4DC` | **Dark citation ink (5.92:1 min)** |
| `--cw-azure-600` | `#185A88` | Light citation accent / icon |
| `--cw-azure-700` | `#12456A` | **Light citation ink (9.21:1 min)** |

**Ochre-amber (critique / risk)**

| Token | Hex | Role |
|---|---|---|
| `--cw-amber-200` | `#F0CE8C` | Dark amber ink, high emphasis |
| `--cw-amber-300` | `#E0B25C` | **Dark amber ink (6.75:1 min)** |
| `--cw-amber-600` | `#A06A02` | Light amber marker (non-text) |
| `--cw-amber-700` | `#8A5A00` | **Light amber ink (5.42:1 min)** |

**Rose (destructive / failure only)**

| Token | Hex | Role |
|---|---|---|
| `--cw-rose-300` | `#E89189` | **Dark rose ink (5.58:1 min)** |
| `--cw-rose-600` | `#A3302A` | **Light rose ink (6.37:1 min)** |
| `--cw-rose-700` | `#8A2822` | Light rose active |

### 4.3 Semantic tokens — the layer components actually use

Full definitions live in `design-system.css`. The contract:

| Semantic token | Light | Dark | Notes |
|---|---|---|---|
| `--cw-canvas` | `#F4F7FB` | `#0A1017` | The page ground. Never transparent — a transparent body borrows the host's theme. |
| `--cw-backdrop-floor` | `#DCE4EF` | `#070C12` | §2 band endpoint |
| `--cw-backdrop-ceil` | `#FFFFFF` | `#1B2A3A` | §2 band endpoint |
| `--cw-mat-tint` | `255 255 255` | `38 51 63` | The material's own colour. **Space-separated sRGB channels, not a hex string** — it is consumed as `rgb(var(--cw-mat-tint) / var(--cw-mat-N-alpha))`, which a hex value would make invalid (the surface would compute to `transparent` and every contrast figure in §4.5 would be void). Same colours as `#FFFFFF` / `--cw-slate-800` `#26333F`. |
| `--cw-mat-1-alpha` / `-2-` / `-3-` | `0.62 / 0.72 / 0.86` | `0.55 / 0.62 / 0.80` | §7 |
| `--cw-surface-inset` | `#E8EEF6` | `#151F2A` | **Opaque**, for nested surfaces (§2 rule 2) |
| `--cw-ink` | `#16212D` | `#F2F6FA` | Primary |
| `--cw-ink-2` | `#334357` | `#C7D3E0` | Secondary |
| `--cw-ink-3` | `#5F7189` | `#9AAABC` | Tertiary — the floor for body text |
| `--cw-ink-disabled` | `#8494AB` | `#6A7D96` | Non-informational only (A6) |
| `--cw-border` | `#748399` | `#758AA3` | Meaningful boundaries, ≥3:1 (A2) |
| `--cw-hairline` | `#DCE4EF` | `#33445A` | Decorative separators only — **not** a component boundary |
| `--cw-accent` | `#16704D` | `#6FC29C` | Recovery green, as ink |
| `--cw-accent-fill` | `#16704D` | `#35A97A` | Recovery green, as a fill |
| `--cw-accent-on-fill` | `#FFFFFF` | `#06120C` | Ink on that fill |
| `--cw-cite` | `#12456A` | `#79B4DC` | Citation ink |
| `--cw-cite-edge` | `#185A88` | `#79B4DC` | The citation chip's left rule |
| `--cw-caution` | `#8A5A00` | `#E0B25C` | Critique / risk ink |
| `--cw-danger` | `#A3302A` | `#E89189` | Destructive / failure only |
| `--cw-ring` | `#16704D` | `#5FD3A3` | Focus ring |

### 4.4 The ambient background (the thing that makes the band provable)

`body` paints `--cw-canvas` and then two fixed, non-repeating radial gradients whose colour stops are drawn **only from inside the band**: a cool slate bloom top-left and a faint green bloom bottom-right at very low alpha. They are `background-attachment: fixed` so they do not move under scroll, which keeps the composite behind any glass surface stable as the user scrolls — a scrolling gradient would make the worst case a moving target.

The green bloom is deliberately at the *bottom* of the page. It is a quiet visual statement of the product's arc: the seller arrives in the slate and leaves toward the green. **Flagged: a design judgment, not a sourced finding.**

### 4.5 Contrast certification

Computed with the WCAG 2.1 relative-luminance formula against the **worst-case composite** at each material level (§2). All values are reproducible from the hex values in §4.2.

**Light theme — worst case is the composite over `--cw-backdrop-floor` `#DCE4EF`:**

| Material | Worst composite | `--cw-ink` | `--cw-ink-2` | `--cw-ink-3` | `--cw-border` | `--cw-accent` | `--cw-cite` | `--cw-caution` | `--cw-danger` |
|---|---|---|---|---|---|---|---|---|---|
| L1 veil (α .62) | `#F2F5F9` | **14.89** | **9.23** | **4.56** | **3.52** | **5.55** | **9.21** | **5.42** | **6.37** |
| L2 card (α .72) | `#F5F7FB` | **15.18** | **9.41** | **4.65** | **3.59** | **5.66** | **9.39** | **5.53** | **6.50** |
| L3 sheet (α .86) | `#FAFBFD` | **15.73** | **9.75** | **4.82** | **3.72** | **5.86** | **9.73** | **5.72** | **6.73** |
| Opaque fallback | `#F7F9FC` | **15.44** | — | **4.73** | — | — | — | — | — |

**Dark theme — worst case is the composite over `--cw-backdrop-ceil` `#1B2A3A`:**

| Material | Worst composite | `--cw-ink` | `--cw-ink-2` | `--cw-ink-3` | `--cw-border` | `--cw-accent` | `--cw-cite` | `--cw-caution` | `--cw-danger` |
|---|---|---|---|---|---|---|---|---|---|
| L1 veil (α .55) | `#212F3D` | **12.57** | **8.98** | **5.75** | **3.85** | **6.42** | **6.09** | **6.95** | **5.75** |
| L2 card (α .62) | `#22303D` | **12.41** | **8.87** | **5.68** | **3.80** | **6.34** | **6.02** | **6.86** | **5.67** |
| L3 sheet (α .80) | `#24313E` | **12.21** | **8.73** | **5.59** | **3.74** | **6.23** | **5.92** | **6.75** | **5.58** |
| Opaque fallback | `#1C2836` | **13.75** | — | **6.29** | — | — | — | — | — |

**Fills and rings:**

| Pair | Ratio | Requirement |
|---|---|---|
| `#FFFFFF` on light CTA `#16704D` | **6.07** | 4.5 |
| `#FFFFFF` on light CTA hover `#125C41` | **7.98** | 4.5 |
| `#FFFFFF` on light CTA active `#11593E` | **8.33** | 4.5 |
| `#06120C` on dark CTA `#35A97A` | **6.46** | 4.5 |
| `#06120C` on dark CTA hover `#43B486` | **7.38** | 4.5 |
| `#06120C` on dark CTA active `#2E9E71` | **5.68** | 4.5 |
| Light ring `#16704D` on L2 composite | **5.66** | 3.0 |
| Dark ring `#5FD3A3` on L2 composite | **7.27** | 3.0 |
| Light citation chip ink `#12456A` on its tint `#DFE7F0` | **8.07** | 4.5 |
| Dark citation chip ink `#A6CFEC` on its tint `#2E4253` | **6.31** | 4.5 |

**The binding margins** are `--cw-ink-3` on the light L1 veil (**4.56** vs. 4.5) and `--cw-border` on the light L1 veil (**3.52** vs. 3.0). These are the two pairs to re-verify if any token is ever changed. Everything else has ≥1.0 of headroom.

---

## 5. Typography

### 5.1 Families

Three roles, three stacks. No web fonts are loaded — this is simultaneously a performance decision (no render-blocking fetch for a buyer who arrived in a panic at 2am on mobile data), a privacy decision, and a deployability decision (nothing to inline or self-host, no external request that a strict CSP would block).

| Token | Stack | Used for |
|---|---|---|
| `--cw-font-ui` | `ui-sans-serif, -apple-system, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | All interface text, headings, buttons, labels |
| `--cw-font-doc` | `ui-serif, Charter, "Bitstream Charter", "Iowan Old Style", Georgia, "Times New Roman", serif` | **The quoted policy clause and the rendered POA body** |
| `--cw-font-mono` | `ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Menlo, Consolas, monospace` | Reason codes, case IDs, the loss counter's figures |

**Why a serif for the clause.** The quoted policy text is *source material*, and the POA is a *document the seller will submit to Amazon*. Setting them in a serif does two jobs at once: it visually separates quotation from interface (Nielsen #2, *match between the system and the real world* — a quote should look like a quote), and it makes the on-screen document resemble what it becomes. Per `ARCHITECTURE.md §3.1`, the same React component renders both the screen and the branded PDF, so the on-screen serif *is* the PDF's serif — the two cannot drift, which the architecture identifies as a citation-invariant leak vector.

**Flagged:** the claim that a serif improves *perceived* document credibility here is a design judgment. There is no category-specific study. **Hypothesis.**

### 5.2 The scale

Base 17px (`1.0625rem`) rather than 16px — a slightly larger body size for a reader who is stressed and possibly on a phone at night. A minor-third-ish modular progression, rounded to whole pixels at the default root size and expressed in `rem` so it scales with the user's setting (**A8**).

| Token | rem | px @16 root | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--cw-text-2xs` | `0.75` | 12 | 1.4 | `+0.02em` | Legal microcopy, "Not legal advice" |
| `--cw-text-xs` | `0.8125` | 13 | 1.45 | `+0.01em` | Chip labels, timestamps, attribution lines |
| `--cw-text-sm` | `0.9375` | 15 | 1.55 | `0` | Secondary UI, table cells, helper text |
| `--cw-text-base` | `1.0625` | 17 | **1.6** | `0` | **Body. The default.** |
| `--cw-text-lg` | `1.25` | 20 | 1.55 | `-0.005em` | Lead paragraph, the cited clause |
| `--cw-text-xl` | `1.5` | 24 | 1.4 | `-0.01em` | Card titles, section headings |
| `--cw-text-2xl` | `1.875` | 30 | 1.3 | `-0.015em` | Screen headings |
| `--cw-text-3xl` | `2.375` | 38 | 1.2 | `-0.02em` | Page title |
| `--cw-text-4xl` | `3` | 48 | 1.1 | `-0.025em` | Landing hero only |

**Weights.** `400` body, `500` UI emphasis and labels, `600` headings and buttons, `700` reserved for the wordmark and the loss figure. No `800`/`900` — heavy weight reads as shouting, which contradicts **P4**.

**Measure.** Body copy is capped at `--cw-measure: 68ch`; the cited clause at `--cw-measure-doc: 62ch`. Long-line reading fatigue is a real cost for a tired reader.

**Numerals.** `font-variant-numeric: tabular-nums lining-nums` on the loss counter, the price, and the SLA clock, so digits do not jitter as they change — motion in a number the seller is watching would be exactly the manufactured-anxiety effect **P5** forbids.

### 5.3 The wordmark

`clausewright` — one unbroken lowercase token, per `NAMING.md §3.5` (HIG app-naming guidance: the mark must survive at icon and label sizes). Set in `--cw-font-ui` at `600`, tracking `-0.02em`, in `--cw-ink`. The only permitted decoration is that the `w` may carry the accent colour at the wordmark's largest sizes. **No lockup with a tagline in the header** — the tagline is copy, not identity furniture, and the header is L1 chrome that must not claim attention (**P1**).

---

## 6. Space, radius, elevation, motion

### 6.1 Spacing — a 4px grid on an 8px rhythm

| Token | rem | px | Typical use |
|---|---|---|---|
| `--cw-space-0` | `0` | 0 | |
| `--cw-space-1` | `0.25` | 4 | Icon-to-label |
| `--cw-space-2` | `0.5` | 8 | Chip padding, tight stacks |
| `--cw-space-3` | `0.75` | 12 | Field inner padding |
| `--cw-space-4` | `1` | 16 | Default gap |
| `--cw-space-5` | `1.5` | 24 | Card inner padding (compact) |
| `--cw-space-6` | `2` | 32 | **Card inner padding (default)** |
| `--cw-space-7` | `2.5` | 40 | Between cards |
| `--cw-space-8` | `3` | 48 | Section gap |
| `--cw-space-9` | `4` | 64 | Between major regions |
| `--cw-space-10` | `6` | 96 | Screen top/bottom on desktop |

Generous by default, per `USER_JOURNEY.md §8.4` — whitespace is the cheapest stress intervention available and the one that costs nothing to implement.

### 6.2 Radius

| Token | Value | Use |
|---|---|---|
| `--cw-radius-xs` | `0.375rem` (6px) | Chips, tags |
| `--cw-radius-sm` | `0.625rem` (10px) | Buttons, fields |
| `--cw-radius-md` | `0.875rem` (14px) | Inset surfaces, timeline nodes |
| `--cw-radius-lg` | `1.25rem` (20px) | **Glass cards** |
| `--cw-radius-xl` | `1.75rem` (28px) | Sheets, the paste panel |
| `--cw-radius-full` | `999rem` | Pills, status dots |

Concentric radii: a nested surface uses `parent radius − its inset`, which is why cards at `20px` with `32px` padding host inset surfaces at `14px`. HIG's Liquid Glass is explicit about concentricity; mismatched corners are the fastest way to make a glass interface look cheap.

### 6.3 Elevation — deliberately weak

Per **P3**, shadows support the material rather than substituting for it. Three levels only, all short-throw and low-alpha, and all defined per theme (a light-theme shadow on a dark surface is invisible; a dark-theme "shadow" is mostly a darker ambient plus a stronger specular edge).

| Token | Light | Dark |
|---|---|---|
| `--cw-elev-1` | `0 1px 2px rgba(22,33,45,.06), 0 4px 12px rgba(22,33,45,.05)` | `0 1px 2px rgba(0,0,0,.40), 0 4px 14px rgba(0,0,0,.30)` |
| `--cw-elev-2` | `0 2px 4px rgba(22,33,45,.07), 0 12px 28px rgba(22,33,45,.08)` | `0 2px 6px rgba(0,0,0,.46), 0 14px 34px rgba(0,0,0,.38)` |
| `--cw-elev-3` | `0 4px 8px rgba(22,33,45,.09), 0 28px 64px rgba(22,33,45,.12)` | `0 4px 10px rgba(0,0,0,.52), 0 30px 70px rgba(0,0,0,.48)` |

Plus the two tokens that actually make it read as glass:

- `--cw-glass-specular` — a 1px inset highlight on the top edge (`inset 0 1px 0 rgba(255,255,255,.65)` light / `inset 0 1px 0 rgba(255,255,255,.10)` dark).
- `--cw-glass-edge` — a 1px hairline border in the material's own tint, so the surface has a defined boundary without a hard line.

### 6.4 Motion

| Token | Value | Use |
|---|---|---|
| `--cw-dur-1` | `120ms` | Hover, focus, chip toggles |
| `--cw-dur-2` | `220ms` | Surface entry, disclosure |
| `--cw-dur-3` | `420ms` | Sheet presentation, timeline node advance |
| `--cw-ease-out` | `cubic-bezier(.2,.8,.25,1)` | Entry (decelerate) |
| `--cw-ease-in-out` | `cubic-bezier(.4,0,.2,1)` | Position/size change |

**Motion rules, binding:**

1. **Nothing loops.** No pulsing, no shimmer, no breathing glow. A looping animation in the periphery of a stressed reader is a persistent low-grade alarm. The one exception is the timeline's *active-node* indicator, which uses a single non-looping opacity ramp per state change.
2. **Nothing moves that the user did not cause or that the system did not genuinely just do.** Motion is a status signal (Nielsen #1), never decoration.
3. **`prefers-reduced-motion` collapses all of the above to `0.01ms`** (**A4**), and every state remains distinguishable without it.

---

## 7. The material system

Three levels, one implementation, per **P2**.

```css
/* `--cw-mat-tint` is space-separated channels (§4.3), so the alpha composite is
   a plain rgb() with a slash — no color-mix() dependency, and no chance of the
   surface silently computing to `transparent`. */
.cw-mat-2 {
  background-color: rgb(var(--cw-mat-tint) / var(--cw-mat-2-alpha));
  -webkit-backdrop-filter: blur(var(--cw-mat-2-blur)) saturate(var(--cw-mat-2-sat));
          backdrop-filter: blur(var(--cw-mat-2-blur)) saturate(var(--cw-mat-2-sat));
  border: 1px solid var(--cw-glass-edge);
  box-shadow: var(--cw-elev-2), var(--cw-glass-specular);
}
```

| Level | Alpha (L / D) | Blur | Saturate | Elevation |
|---|---|---|---|---|
| **L0 opaque** — `.cw-mat-0` | *opaque* (`--cw-mat-opaque`) | none | none | `--cw-elev-1` |
| **L1 veil** | `0.62 / 0.55` | `20px` | `180%` | `--cw-elev-1` |
| **L2 card** | `0.72 / 0.62` | `28px` | `160%` | `--cw-elev-2` |
| **L3 sheet** | `0.86 / 0.80` | `40px` | `140%` | `--cw-elev-3` |

**L0 is the level a surface takes when the viewport's glass budget is spent.** It is not a fallback and not a degraded card — same tokens, same geometry, same hairline, zero compositing cost. It exists because the alternative, when a layout needs a fourth and fifth card, is either to break the performance guard below or to invent a bespoke one-off surface in a page layer; L0 makes "this card is not glass" a *system* decision with a name, expressible in markup:

```html
<li class="cw-card cw-mat-0">…</li>     <!-- opaque card  -->
<section class="cw-price cw-mat-0">…</section>  <!-- opaque pricing card -->
```

`.cw-card` and `.cw-price` both apply their glass through a `:not(.cw-mat-0)` guard, so adding the class removes the material rather than layering over it — there is no `backdrop-filter` left to pay for, and no specificity fight. **Contrast needs no separate certification:** L0 renders on `--cw-mat-opaque`, which *is* the opaque row already certified in §4.5 and already the target of the `@supports`, reduced-transparency and forced-colors paths.

**Why saturation *decreases* as the material thickens.** A thin veil should let the backdrop's colour life through, so it lifts saturation. A thick sheet has taken modal precedence and should read as nearly its own surface, so it pulls saturation back toward neutral. This mirrors HIG's distinction between thinner and thicker materials expressing different degrees of separation from the content behind them.

**The `@supports` fallback.** Where `backdrop-filter` is unsupported, the tint alpha alone is not sufficient — the surface would be a washed-out rectangle over a visible gradient, which is both ugly and unprovable for contrast. The fallback is therefore **fully opaque**, using the same tokens as the reduced-transparency rendering:

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .cw-mat-1, .cw-mat-2, .cw-mat-3 { background-color: var(--cw-mat-opaque); }
}
```

`--cw-mat-opaque` is `#F7F9FC` light / `#1C2836` dark, both certified in §4.5. **The opaque path is the source of truth for contrast**; the glass path is verified to be no worse than it.

**Performance guard.** `backdrop-filter` is expensive and compounds badly. Hard limits, enforced in review: **no more than three translucent surfaces composited in one viewport**, **no glass on scroll-driven or animated surfaces**, and **no glass inside a `position: fixed` element that also transforms**. Each glass surface carries `will-change: backdrop-filter` only while it is animating in, never persistently.

**Counting rule, because the guard was being read too loosely.** The sticky header is a translucent surface and it is present in *every* viewport — so a full-width grid of three glass cards is already four, not three. Count the header first, then the content surfaces; if the layout needs more than two more, the extras take **`.cw-mat-0`**. Nested surfaces (`.cw-card--inset`), the citation (`.cw-cite`) and the loss counter (`.cw-loss`) are opaque by construction and never count.

Applied to the flagship page: `landing/index.html` composites the header plus **opaque** step cards and **opaque** pricing cards — one translucent surface per viewport, against a budget of three. The guard and the page it governs now agree, which they did not before the 2026-08-12 review (H-8).

---

## 8. Component inventory

Each entry gives anatomy, states, the tokens it consumes, its accessibility contract, and the heuristic or decision it serves. Class names are the contract; `design-system.css` is the implementation.

### 8.1 Glass card — `.cw-card`

**Role.** The default result surface: the classified reason code, the critique, an outcome report, a Shield alert.

**Anatomy.** L2 material · `--cw-radius-lg` · `--cw-space-6` padding · optional `.cw-card__header` (title `--cw-text-xl/600` + optional status pill) · `.cw-card__body` · optional `.cw-card__footer` separated by `--cw-hairline`.

**Variants.** `.cw-card--inset` (opaque `--cw-surface-inset`, for nesting — §2 rule 2) · `.cw-card--quiet` (no elevation, hairline only) · `.cw-card--accent` (a 3px `--cw-accent` left rule, for the recovery/guarantee card).

**States.** Static by default. `.cw-card--interactive` adds hover elevation lift `--cw-elev-2 → --cw-elev-3` over `--cw-dur-1` and a full-card focus ring.

**Accessibility.** A card is a `<section>` with an `aria-labelledby` pointing at its header, so the region is navigable. It is never a clickable `<div>`; if the whole card is actionable it contains a real `<a>`/`<button>` whose hit area is expanded via `::after`.

**Serves.** **P1**, **P2**; Nielsen #8.

### 8.2 Primary CTA — `.cw-btn`

**Role.** The one action per screen (**P6**).

**Variants.**

| Class | Fill | Ink | Use |
|---|---|---|---|
| `.cw-btn--primary` | `--cw-accent-fill` | `--cw-accent-on-fill` | Exactly one per screen |
| `.cw-btn--secondary` | L2 material + `--cw-border` | `--cw-ink` | Human escalation, symmetric choices |
| `.cw-btn--quiet` | transparent | `--cw-ink-2` | Tertiary, in-card actions |
| `.cw-btn--danger` | transparent + `--cw-danger` border | `--cw-danger` | Destructive only, and never pre-selected |

**Sizes.** `--sm` (36px tall, still 44px hit area via `.cw-hitslop`), default (48px), `--lg` (56px, the paste screen's single button).

**States.** `:hover` (fill steps to `--cw-green-700`/`--cw-green-400`) · `:active` (fill steps again + `translateY(1px)`) · `:focus-visible` (two-part ring, **A5**) · `[disabled]` (fill drops to `--cw-surface-inset`, ink to `--cw-ink-disabled`, `cursor: not-allowed`, **and an adjacent text explanation is required** — a disabled button with no stated reason violates Nielsen #1) · `[data-loading]` (label is replaced by a labelled progress state, width is locked so the button does not resize, and the accessible name updates via `aria-live`).

**Copy constraint.** Button labels are verbs in the seller's language and are bound by `NAMING.md §5`: *"Get my Plan of Action,"* never *"Generate POA"*; *"Have a person review this,"* never *"Escalate to counsel."* Invariant 4 forbids any label implying autonomy — no *"File my appeal."*

**Serves.** **P6**; Nielsen #1, #2, #3; **D3**.

### 8.3 Status timeline — `.cw-timeline`

**Role.** The single highest-risk surface in the product (`USER_JOURNEY.md §6`). It narrates the four real pipeline stages during the wait, and later narrates the case lifecycle.

**Anatomy.** A vertical rail (`--cw-border`, 2px) with one node per stage. Each node: a 20px glyph well, a label (`--cw-text-base/500`), an optional detail line (`--cw-text-sm`, `--cw-ink-3`), and an optional streamed-content slot beneath it.

**Node states — each carries a distinct glyph *and* a distinct label, never colour alone (A6):**

| State | Glyph | Colour | Label pattern |
|---|---|---|---|
| `pending` | hollow ring, `--cw-hairline` | `--cw-ink-3` | Future tense — "Drafting your Plan of Action" |
| `active` | filled ring with an animated arc | `--cw-accent` | Present participle — "Checking the exact policy clause…" |
| `done` | check glyph | `--cw-accent` | Past tense + the finding — "Found it — this is an inauthentic-item case." |
| `slow` | ring with a clock glyph | `--cw-caution` | **"Still working — this one's taking a bit longer, your draft is not lost."** |
| `blocked` | ring with a hand glyph | `--cw-caution` | "This one needs a person." — never rose (**P4**) |
| `failed` | ring with an alert glyph | `--cw-danger` | Plain statement + a recovery action inline |

**Copy contract.** Labels are in the seller's words, not stage names — *"Reading your notice…"*, never *"Stage 2/4: retrieval."* This is `USER_JOURNEY.md §6.2`, verbatim, and Nielsen #2.

**Accessibility.** The timeline is an ordered list inside `role="status" aria-live="polite" aria-atomic="false"`. Only the changed node is announced. The `active` node's arc animation is decorative and disappears under `prefers-reduced-motion`; the state remains conveyed by glyph and label (**A4**, **A6**).

**The `slow` state is not optional.** `USER_JOURNEY.md §6.4` names silence at this moment as *"the single highest-risk micro-interaction in the product."* A timeline implementation without a `slow` state is incomplete.

**Serves.** Nielsen #1 (load-bearing on S2); **D9** — the stages are real because control flow lives in code ([Anthropic, *Building Effective Agents*](https://www.anthropic.com/engineering/building-effective-agents)).

### 8.4 Progress indicator — `.cw-progress`, `.cw-sla-clock`

Two distinct things, deliberately not merged.

**`.cw-progress`** — a determinate bar used *only* where a genuine proportion exists (document sections rendered, evidence checklist items completed). **There is no indeterminate variant.** Where there is no honest proportion, the timeline (§8.3) is used instead. This is Nielsen #1 read strictly: a fake progress bar is a status *claim*, and a false one.

**`.cw-sla-clock`** — the 10-minute guarantee rendered as a live elapsed/remaining figure. Because `paid_at → document_ready_at` is measured in code (`ARCHITECTURE.md §3.5`), the clock shows a real measurement, not a marketing number. Styled quiet: `--cw-font-mono`, tabular numerals, `--cw-ink-2`, no colour change as time elapses, **no red at any threshold**. If the SLA is missed, the component switches to a plain statement of the guarantee being honoured (*"We were late. Your $149 is refunded — no action needed from you."*) — which is Hormozi's unconditional guarantee doing double duty as a status indicator (`USER_JOURNEY.md §6.5`) and Nielsen #9 (*help users recover from errors*) with the system, not the user, taking the recovery action.

**Serves.** Nielsen #1, #9; **P5** (the clock is factual, not pressuring); dossier §6.3 guarantee 1.

### 8.5 Citation chip — `.cw-cite`

**The most important component in the system.** It is the visible surface of invariant **I2** and of the entire Perceived-Likelihood strategy (**D7**, dossier §6.1 lever 1).

**Anatomy.**

```html
<figure class="cw-cite">
  <blockquote class="cw-cite__quote" cite="https://sellercentral.amazon.com/…">
    …verbatim policy text, exactly as returned in the citation object…
  </blockquote>
  <figcaption class="cw-cite__source">
    <span class="cw-cite__doc">Amazon Seller Code of Conduct</span>
    <span class="cw-cite__loc">§ 3, “Acting Fairly”</span>
    <a class="cw-cite__link" href="…" rel="noopener">View the policy page</a>
  </figcaption>
</figure>
```

**Styling.** A 3px `--cw-cite-edge` left rule · `--cw-space-5` padding · quote in `--cw-font-doc` at `--cw-text-lg`, `--cw-ink`, measure capped at `--cw-measure-doc` · attribution in `--cw-font-ui` at `--cw-text-xs`, `--cw-cite` · a `--cw-cite` tint fill (`#DFE7F0` light / `#2E4253` dark, both certified §4.5). Surface is **opaque tint, not glass**, per §2 rule 2 — the one place where a bounded worst case is not good enough, because this text is the product.

**Inline variant** `.cw-cite-ref` — a small azure pill used inside draft prose to mark a cited span, carrying a superscript marker and an `aria-describedby` pointing at the full figure.

**States.** `default` · `.cw-cite--hover` (link underline thickens; the chip does not move) · `.cw-cite--unverified` — **which must never render.** It exists solely as a development-time affordance: if a policy-shaped span reaches the render layer without a backing citation object, this class makes it visibly, unmissably wrong (a hatched `--cw-danger` border and the literal text "UNCITED — THIS MUST NOT SHIP") so a leak is caught by eye as well as by `assertOnlyCitedClauses()` and the blocking CI test. It is stripped from production builds.

**Accessibility (A10, binding).** `figure` + `blockquote[cite]` + `figcaption` so assistive technology conveys *quotation plus attribution*. The chip is never a bare styled `<div>` — the semantics are the claim.

**Copy constraint.** `NAMING.md §5` invariant 2: the label is always **"policy clause,"** never "legal clause." Invariant 7: the chip is branded as the proof, so it carries the product's most distinctive styling.

**Serves.** **I2**, **B4**, **D7**; Lewis et al. 2020 ([arXiv:2005.11401](https://arxiv.org/abs/2005.11401)) made visible; Nielsen #1 and #2.

### 8.6 Pricing card — `.cw-price`

**Role.** The paywall's tier presentation (S4) and the Shield renewal decision (S15).

**Anatomy.** L2 card · tier name (`--cw-text-sm/600`, `--cw-ink-3`, uppercase tracking `+0.08em`) · price (`--cw-text-3xl/700`, `--cw-font-mono` tabular) · a one-line role statement · an inclusion list using `--cw-accent` check glyphs · one `.cw-btn` · a guarantee line in `--cw-text-xs`.

**Variants.** `.cw-price--anchor` — the **non-purchasable** comparison rows ($3,500 attorney / $1,250 consultant), rendered as `.cw-card--quiet` at reduced emphasis with no button, because per dossier §6.2 we are licensed to reproduce a competitor's own published anchor and Ramanujam's anchoring works only if the anchor is legible as a real alternative rather than a strawman. `.cw-price--recommended` — carries a `.cw-chip--recommend` text label, **not** heavier visual weight, per **P6** and Nielsen #3.

**Binding constraint.** No scarcity furniture. No "was $299." No expiry. See **P5**.

**Serves.** Ramanujam & Tacke, *Monetizing Innovation* (2016) — anchoring and bundling made visible; dossier **D4**, §6.2.

### 8.7 Form fields — `.cw-field`

**Role.** Chiefly the one that matters: the paste textarea on S1 (**B1** — one textarea, one button, no signup).

**Anatomy.** A visible `<label>` above the control (never a placeholder-as-label — placeholders vanish on focus, which fails Nielsen #6, *recognition rather than recall*, exactly when a stressed user needs the label most) · control on `--cw-surface-inset` with a `--cw-border` 1px boundary (≥3:1, **A2**) · `--cw-radius-sm` · `--cw-space-3` padding · helper text in `--cw-text-sm`/`--cw-ink-3` · error text in `--cw-text-sm`/`--cw-danger` bound by `aria-describedby`.

**The paste textarea specifically.** `--cw-radius-xl` · `--cw-space-6` padding · `--cw-text-base` · `min-block-size: 12rem` · auto-grow to a cap · its label is the human sentence *"Paste the email or screenshot text Amazon sent you"* (`USER_JOURNEY.md §1.3`, S1) rather than a field name. It sits on the L2 card, not on glass directly, because a 50,000-character paste scrolling under a translucent surface is exactly the unbounded-backdrop case §2 forbids.

**States.** `default` · `:hover` (border → `--cw-ink-3`) · `:focus-visible` (two-part ring; border → `--cw-accent`) · `[aria-invalid="true"]` (border → `--cw-danger`, **plus** an error message and an alert glyph, never colour alone, **A6**) · `[disabled]` · `[readonly]` (used on the delivered POA before the seller enters edit mode).

**Error copy.** States what happened, why, and the way forward, in the seller's language (Nielsen #9). *"That looks like a listing removal, not an account deactivation — those are different appeals. Here's what to do."* — never *"Validation failed."*

**Serves.** **B1**; Nielsen #2, #5, #6, #9.

### 8.8 Status pill and chips — `.cw-pill`, `.cw-chip`

**`.cw-pill`** — case state: `Draft ready`, `Submitted`, `Awaiting decision`, `Reinstated`, `Needs a person`. Each carries a dot **and** a word (**A6**). Tones: `--neutral` (slate), `--accent` (green: reinstated, all clear), `--caution` (amber: needs a person, awaiting), `--danger` (rose: system failure only).

**`.cw-chip`** — small labelled affordances: `--recommend` (on a pricing card), `--code` (a reason code in `--cw-font-mono`), `--evidence` (an Evidence Kit item, toggleable, with a real checkbox underneath).

**Deliberate omission.** There is no `--cw-pill--rejected` in rose. An Amazon rejection renders `--caution` with the guarantee immediately adjacent, per **P4.2** and `USER_JOURNEY.md §2.1`.

### 8.9 Loss counter — `.cw-loss`

**Role.** The product's only urgency device, and therefore the component with the strictest constraints in this system.

**Anatomy.** A `.cw-card--quiet` containing a plain sentence with three inline editable values: hours dark, the seller's own stated daily revenue, and the product. Figures in `--cw-font-mono`, tabular, `700`, `--cw-ink`. Everything else `--cw-ink-2`. **No colour. No red. No animation. No countdown.**

**Copy pattern.** *"You've been dark for 6 hours. Based on the $1,200/day you told us, that's roughly $300 so far."* (`USER_JOURNEY.md §1.1`, verbatim.) The seller's number is visibly *theirs* and editable — which is what makes it a fact rather than a pressure tactic.

**Serves.** Hormozi, *$100M Offers* (2021) — genuine urgency displayed, never invented; dossier §1.3; **P5**.

### 8.10 Disclaimer — `.cw-disclaimer`

**Role.** `NAMING.md §5` invariant 3 and **B11**: *"Not legal advice" stays prominent on every surface that renders a draft.*

**Anatomy.** `--cw-text-2xs`, `--cw-ink-2` (**not** `--cw-ink-disabled` — "prominent" means legible, and this is the one place where making text quiet would be a compliance failure rather than a taste choice), on `--cw-surface-inset`, with a `--cw-hairline` top rule, contrast ≥4.5:1 (**A1**).

**Serves.** **B11**, R9; Nielsen #10 (*help and documentation*) in its minimal, always-visible form.

### 8.11 Header veil — `.cw-header`

L1 material · the wordmark left · at most one action right · `--cw-space-4` block padding. No navigation before payment (**B1**, `ARCHITECTURE.md §3.1`). Sticky, `z-index` from `--cw-z-header`. Because it is the only persistently visible glass surface, it is L1 (the thinnest) — a heavy blurred bar riding above the content the seller is trying to read is precisely the **P1** failure.

---

## 9. What this system deliberately does not ship

The exclusions carry as much weight as the inclusions — the same discipline the dossier applies in §7.4.

| # | Excluded | Why |
|---|---|---|
| X1 | Countdown timers, scarcity badges, "N people viewing," expiring-discount banners | **P5**; Hormozi's genuine-vs-manufactured urgency; `USER_JOURNEY.md §8.3` |
| X2 | An indeterminate progress bar | A status claim with no status behind it; the timeline exists instead (§8.4) |
| X3 | Rose/red styling for the readiness critique, risk scores, or an Amazon rejection | **P4**; `USER_JOURNEY.md §8.4`, binding |
| X4 | Nested glass | Makes the backdrop band unprovable (§2 rule 2) |
| X5 | Web fonts, icon fonts, external stylesheets | Render-blocking cost for a panicking mobile user; CSP surface; deployability |
| X6 | Looping/ambient animation | A persistent low-grade alarm for a stressed reader (§6.4 rule 1) |
| X7 | A dark-mode-as-inverted-filter implementation | **A12**; inverted palettes fail contrast unpredictably |
| X8 | Any component capable of expressing a success-rate claim (a big "%") | `NAMING.md §5` invariant 5, **N10**, R11 — until **B9** yields one with its denominator |
| X9 | A charts/dataviz layer | Nothing in v1's scope needs one; adding it invites the success-rate component X8 forbids |
| X10 | A component library dependency (MUI, Chakra, shadcn preset themes) | Three of them would each ship their own token system and their own opinion about focus rings; the contrast certification in §4.5 would stop being provable |

---

## 10. Implementation contract

- **File:** `/home/user/Octopus/phase-2-build/identity/design-system.css`. Single file, no imports, no build step required. Loaded once in the Next.js root layout.
- **Cascade layers.** `@layer cw.reset, cw.tokens, cw.base, cw.components, cw.utilities;` — so product CSS can override without specificity escalation and without `!important`.
- **Theme resolution, three states.** Bare `:root` carries the complete **light** palette. `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])` redefines only the tokens. `:root[data-theme="dark"]` redefines them again so an explicit toggle wins in both directions. **No colour is ever defined only inside a media query.** `body` always paints an explicit `--cw-canvas`.
- **`color-scheme: light dark`** on `:root` so native form controls, scrollbars and the caret follow the theme.
- **Naming.** `cw-` prefix on every token and class. Tokens are `--cw-<category>-<role>`; classes are BEM-ish `.cw-block__element--modifier`.
- **Two-tier tokens.** Components reference semantic tokens only. A component referencing `--cw-slate-700` directly is a review failure.
- **The contrast table (§4.5) is a test, not documentation.** Any change to a colour token requires re-running the ratio computation against the worst-case composites and updating §4.5. The two binding margins are named at the end of §4.5.

---

## 11. Hypotheses and open questions, flagged

Per the literature-grounding standard applied throughout Phase 2, the following are design judgments made in this document rather than claims traceable to a published source:

- **The Bounded Backdrop Rule's specific band endpoints** (§2). The method — bound the backdrop, certify against the worst case — follows directly from how contrast ratio is defined, but the endpoints are tuned to give headroom, not derived. **Hypothesis.**
- **Serif for the quoted clause and the POA body** (§5.1). Reasoned from Nielsen #2 and from the on-screen/PDF parity requirement, but no category-specific credibility study supports it. **Hypothesis; a candidate A/B test once volume permits.**
- **Amber rather than red for the readiness critique** (**P4.1**). This follows `USER_JOURNEY.md §8.4`, which is itself flagged there as a design constraint rather than a sourced finding. **Hypothesis, inherited.**
- **17px rather than 16px base size** (§5.2). Directionally supported by general legibility guidance; the specific step is a judgment. **Hypothesis.**
- **The green bloom at the bottom of the ambient field** (§4.4). Pure design judgment. **Not a finding.**
- **The three-surfaces-per-viewport performance guard** (§7). A conservative limit from general `backdrop-filter` cost characteristics, not from a measurement on our own stack. **Measure it on the real build in the Day-4 performance pass** (`IDEA_DOSSIER.md §7.6`) and revise. Note what changed on 2026-08-12: the landing page was brought *inside* the guard (via `.cw-mat-0`) rather than the guard being loosened to fit the page. If measurement later shows four or five surfaces are cheap on our stack, raise the number then — but a system and its flagship page must not sit in contradiction while the question is open, and the honest resolution of an unmeasured limit is to respect it.
- **Open question:** whether the `slow` timeline state should also fire a push/email at a threshold, or remain in-page only. Deferred to the build; the component supports either.

---

## 12. References

- **Apple**, *Human Interface Guidelines* (Liquid Glass) — [developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines/) — content-first hierarchy, translucency and layered materials as the carriers of depth, concentric corner radii, the 44pt minimum target, and the app-naming legibility guidance behind the `clausewright` wordmark (§1 P1–P3, §6.2, §5.3, A7).
- **Jakob Nielsen**, *10 Usability Heuristics for User Interface Design* — [nngroup.com](https://www.nngroup.com/articles/ten-usability-heuristics/) — #1 visibility of system status (§8.3, §8.4), #2 match with the real world (§5.1, §8.2, §8.7), #3 user control and freedom (§8.6, P6), #5 error prevention (§8.7), #6 recognition rather than recall (§8.7), #8 aesthetic and minimalist design (§0, §8.1), #9 error recovery (§8.4, §8.7), #10 help and documentation kept minimal (§8.10).
- **Anthropic**, *Building Effective Agents* — [anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents) — the workflow-not-agent discipline (**D9**) that makes the four pipeline stages real, code-level checkpoints and therefore honestly narratable in the status timeline (§1 P7, §8.3).
- **Patrick Lewis et al.**, *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*, NeurIPS 2020 — [arXiv:2005.11401](https://arxiv.org/abs/2005.11401) — retrieval produces "more specific, diverse and factual language"; the citation chip (§8.5) is that factuality made visible and is why it is the most heavily specified component here.
- **Andrej Karpathy**, *Software 2.0* (2017) — [karpathy.medium.com/software-2-0-a64152b37c35](https://karpathy.medium.com/software-2-0-a64152b37c35) — the dataset is the artifact; the outcome-report and consent surfaces (**B9**, **D10**) are treated as data-capture UI, which is why the consent affordances in §8.8 are first-class components rather than fine print.
- **The Twelve-Factor App** — [12factor.net](https://12factor.net/) — guarantees enforced in the build artifact rather than in a runbook; applied here to the contrast certification (§2, §10) exactly as `ARCHITECTURE.md` applies it to the citation gate.
- **April Dunford**, *Obviously Awesome* (2019) — Step 6 category exit from "AI POA generator" (**D3**) and Step 8 trend layering; the citation hue and chip exist because the category we are defining is constituted by visible, verifiable grounding (§4.1, §8.5).
- **Alex Hormozi**, *$100M Offers* (2021) — the value equation, Perceived Likelihood as the binding constraint (**D7**), and the genuine-vs-manufactured urgency rule that governs the loss counter (§8.9), the SLA clock (§8.4) and exclusion X1.
- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — anchoring and bundling as on-screen framing in the pricing card (§8.6), and the minivation warning (**D4**) behind the premium, restrained visual register.
- **Barbara Fredrickson & Daniel Kahneman**, *Duration Neglect in Retrospective Evaluations of Affective Episodes*, *JPSP* 65(1), 1993 — the peak-end rule behind **P7**: endings (reinstatement, cancellation) get the same component quality as beginnings.
- **W3C**, *Web Content Accessibility Guidelines 2.1* — [w3.org/TR/WCAG21](https://www.w3.org/TR/WCAG21/) — success criteria 1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 2.3.3, 2.4.7, 2.5.5, 4.1.3 as itemised in §3.

---

**Document status:** binding for Phase 2. Where this document conflicts with an implementation choice made later, this document wins unless a superseding decision is written and merged, consistent with the standard set in `IDEA_DOSSIER.md`, `ARCHITECTURE.md` and `USER_JOURNEY.md`.
