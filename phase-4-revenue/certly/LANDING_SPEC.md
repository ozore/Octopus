# Certly — landing page specification

**Author:** Offer & Landing agent (wave 1). **Date:** 2026-09-03.
**Reads with:** `OFFER.md` (the offer this page sells), `offer/RESEARCH.md` (every cited number),
`PERSONA.md` (Buyer A — the property/association management operations & compliance coordinator),
`KNOWLEDGE_BASE.md` §B.4 (the three-state rule), §C (endorsement glossary) and **§F (the copy
invariants, which are binding on every word below)**.
**Palette and type: now bound** to the arbitrated identity (`../IDENTITY_ARBITRATION.md`, final
2026-09-03). This spec was written before `design-system.css` existed and used placeholder token names
(`--state-met`, `--state-asserted`, `--state-gap`, `--ink`, `--paper`, `--rule`); those are replaced
throughout by the **real tokens**:

| placeholder | real token | value |
|---|---|---|
| `--state-met` | `--c-ok-solid` / `--c-ok-fg` / `--c-ok-bg` | teal 164° |
| `--state-asserted` | `--c-ast-solid` / `--c-ast-fg` / `--c-ast-bg` | olive-gold 45°, one step deeper than Expiring |
| `--state-gap` | `--c-gap-solid` / `--c-gap-fg` / `--c-gap-bg` | crimson 345° |
| *(expiring)* | `--c-warn-*` | olive-gold 47° |
| *(needs review)* | `--c-rev-*` | slate |
| *(not checked / no certificate)* | `--c-nc-*` / `--c-none-*` | achromatic |
| `--ink` · `--paper` · `--rule` | `--c-ink` · `--c-paper` · `--c-line` | ink `#0F1A2B` on **cool office white `#E8EEF6`** |
| type | `--c-font-ui` · `--c-font-num` | **Source Sans 3** and **Source Code Pro**, self-hosted (§10) |

**Never Public Sans, never IBM Plex Mono, never the old warm paper `#F3F3EE`** — those were the
pre-arbitration values and they collided with the two sibling apps. **No literal colour or family name
appears anywhere below**; `design-system.css` is the only place a value is written
(`IDENTITY.md` §16.1).

**Goal:** felt, not read. **Hard budget: under 450 words above the pricing block.**
Measured after the wave-1b iteration: **413** — counted by the script published in §14, which
now includes the step labels the first count omitted (REVIEW.md MJ-11).

> **Revised 2026-09-03 after the wave-1b review.** Seven things changed: **one** hero CTA instead of
> two (MJ-04), "Start free" replaced by "Start 14-day trial" with the card disclosure adjacent (B-06),
> the demo and V4 rebuilt from **Certly-authored fixtures** instead of the private corpus (B-13), the
> tier metric renamed to **tracked vendors** (B-10), the funnel's event names taken from
> `specs/00-event-vocabulary.md` (B-14), the word count re-run with a published script (MJ-11), and
> the status vocabulary settled — **"Meets requirements"**, never "Covered" (B-02). The record is
> `REVIEW_RESPONSE.md`.

---

## 1. The one thing this page has to do

Make a stranger believe, in under fifteen seconds and without a single testimonial, that **a
certificate can look right and be wrong**, and that Certly is the only thing they can buy today,
without a phone call, that knows the difference.

Everything else — price, guarantee, FAQ — is downstream of that one belief. If the hero fails to
plant it, nothing below the fold recovers it.

---

## 2. Architecture, and why it is in this order

Chosen from the three page angles in `offer/RESEARCH.md` §1: **mechanism first (P-2), interaction
second (P-3), stakes third (P-1).**

Fear-first (P-1) was rejected as the hero. CXL's rule for B2B is to "start with clarity, not
cleverness" because visitors "have a problem, think you might solve it, and want to know if they're
right fast" ([cxl.com](https://cxl.com/blog/b2b-value-proposition/)), and NN/g's measurement is that
"promotional language imposes a cognitive burden"
([nngroup.com](https://www.nngroup.com/articles/how-users-read-on-the-web/)). A red-alarm hero from
an unknown brand is promotional language wearing a risk costume. Showing the diff *is* the argument,
and it makes the fear self-generated — which is the only kind a sceptic accepts.

CTA placement follows CXL's segmentation: a *complex* value proposition earns the commercial click
after the education, while a low-commitment CTA belongs above the fold. NN/g found an 84% difference
in treatment above vs below the fold, but Chartbeat found 66% of attention below it and Huge found
"almost everyone (91-100%) scrolled beyond the fold"
([cxl.com/blog/above-the-fold](https://cxl.com/blog/above-the-fold/)). So: **one low-commitment CTA
above the fold; the commercial ask — "Start 14-day trial", with its card disclosure — after the
mechanism, in the pricing block.**

### 2.1 One hero CTA, and which one it is

`PLAN.md` §4's definition of done for a landing page is *"one problem, one promise, visual proof,
**one call to action**"*. The first draft had two — *"See it read a certificate"* **and** *"Get a free
Gap Report"* — justified by Poyar's +26% dual-CTA finding. **That justification does not transfer**
(REVIEW.md MJ-04): Poyar measured offering a freemium path *alongside a card-required trial* in a
**pricing** context, not two buttons in a hero. Two hero buttons is a choice, and Hick's Law is the
governing rule of this page.

**The demo becomes an in-page interaction, not a CTA.** The chips already peek above the fold (§3);
clicking the hero button scrolls to them and runs one. There is exactly one button.

**Which label the button carries depends on a founder gate, and both states have one CTA:**

| state | hero CTA | the other path |
|---|---|---|
| **Launch state — the founder's legal read on `specs/15` has not landed** | **"See it read a certificate"** → the samples-only demo | the Free Gap Report appears as a **waitlist line**, not a button: *"Want it run on your own certificates? Join the list."* |
| **After the legal read** | **"Get a free Gap Report"** → `/gap-report` | the demo stays exactly where it is, as the in-page interaction below the fold |

The gate is `specs/15`'s launch gate (REVIEW.md B-07, §2.6): until a lawyer has read it, this page
does not invite a stranger to upload a third party's insurance documents. **Ship the launch state.**
The word count in §14 is reported for both; the launch state is the larger of the two and it passes.

The dual-CTA idea survives where it belongs: **experiment 3 in §11**, run one variable at a time.

**No navigation in the header.** "Navigation links are a distraction"
([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/)). Logo
left, a single ghost "Sign in" right. Every other link lives in the footer.

| # | Section | Job | Words |
|---|---|---|---|
| 1 | Hero | Plant the belief. **One CTA.** | 76 |
| 2 | Live demo strip | Convert scepticism into evidence, with no login | 44 |
| 3 | **V1 The Diff** | Show the mechanism and the third state | 58 |
| 4 | **V2 The Timeline** | Show the stakes across the portfolio | 37 |
| 5 | **V3 The Chase Loop** | Show the part they keep not doing | 41 |
| 6 | How it works | Collapse perceived effort to ten minutes | 48 |
| 7 | Proof block | Substitute artefacts for testimonials we don't have | 76 |
| 8 | Guarantee strip | Risk reversal before the price is seen | 33 |
| | **Above pricing** | | **413 / 450** |
| 9 | Pricing | 3 tiers + the honest comparison | ~155 |
| 10 | FAQ | Six, no more | ~180 |
| 11 | Footer | Legal, disclaimer, company | ~60 |
| | **Whole page** | | **~808** |

Unbounce's benchmark puts the optimal SaaS landing page at **250–725 words** with a median conversion
of 3.8% ([unbounce.com](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)).
The whole page is marginally over; the overflow is entirely FAQ and legal, which a scanner skips and a
buyer searches. The 413 that matter sit well inside it.

---

## 3. Above-the-fold wireframe

Desktop, 1440 × 900. The fold line is where a 900px-tall viewport cuts.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  ▣ Certly                                                                      Sign in   │  64px
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  COI TRACKING FOR PROPERTY AND ASSOCIATION MANAGERS          ┌──────────────────────────┐│
│                                                              │  V1 · THE DIFF           ││
│  Your spreadsheet knows when the                             │                          ││
│  certificate expires. It can't tell                          │ YOU REQUIRE   THEY SENT  ││
│  you the certificate is wrong.                               │ ───────────   ────────── ││
│                                                              │ GL each occ   $1,000,000 ││
│  Certly reads every vendor's COI, compares it                │ $1,000,000    ● met      ││
│  to the limits and endorsements you require,                 │                          ││
│  and separates what's proved from what's only                │ Addl insured  ADDL INSD:Y││
│  claimed. From $99 a month. No demo, no sales call.          │ CG 20 10      ◐ asserted ││
│                                                              │               no endt pg ││
│  ┌───────────────────────────┐                               │                          ││
│  │ See it read a certificate │  ← ONE CTA                    │ Waiver of     SUBR WVD: N││
│  └───────────────────────────┘                               │ subrogation   ◉ gap      ││
│  Want it run on your own certificates? Join the list.        │                          ││
│                                                              │ Expires       11/14/2026 ││
│  ACORD 25. Self-serve. Your vendors are never charged.       │ future date   ● meets    ││
│                                                              └──────────────────────────┘│
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ FOLD ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  Pick a certificate. Watch it get read.                                                  │
│  [ Landscaper — looks fine ] [ Roofer — expired last month ] [ Cleaner — no waiver ]     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

*(Launch state. After the founder's legal read the single button reads "Get a free Gap Report" and the
waitlist line is removed — §2.1. Nothing else in the wireframe changes.)*

Four deliberate choices. **The V1 panel is above the fold, not below it** — NN/g's condition for
scrolling is that "what's above the fold is promising enough", and a picture of the product doing the
job is the most promising thing we own. **The demo chips peek above the fold line** so the page
visibly continues, and clicking the hero button scrolls to them. **The eyebrow names the buyer before
the headline**, because the F-pattern's first horizontal sweep lands there and "if users see only the
first 2 words, they should still get the gist"
([nngroup.com](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).
**There is one button**, per `PLAN.md` §4 and Hick's Law (§2.1).

---

## 4. Copy, section by section, with the word budget enforced

Every three-syllable insurance term below appears **inside a diagram before it appears in a
sentence**, per the reading-level constraint (5th–7th grade copy converts at 12.9% vs 2.1% for
professional-level; best pages use only 50–140 words of three syllables or more —
[Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)). Where a
professional term is unavoidable it is the buyer's own word, taken verbatim from `PERSONA.md` §2.5.

### §1 Hero

**Launch state** (the founder's legal read on `specs/15` has not landed — §2.1):

| Element | Copy | Words |
|---|---|---|
| Eyebrow | COI tracking for property and association managers | 7 |
| **H1** | **Your spreadsheet knows when the certificate expires. It can't tell you the certificate is wrong.** | 15 |
| Sub | Certly reads every vendor's COI, compares it to the limits and endorsements you require, and separates what's proved from what's only claimed. From $99 a month. No demo, no sales call. | 31 |
| CTA (the only one) | See it read a certificate | 5 |
| Waitlist line | Want it run on your own certificates? Join the list. | 10 |
| Trust line | ACORD 25. Self-serve. Your vendors are never charged. | 8 |

**After the legal read**, two rows change and the section gets *shorter*: the CTA becomes
**"Get a free Gap Report"** (5 words) and the waitlist line is removed (−10). The counted budget in §14
reports the launch state, which is the larger of the two.

The trust line carries three of `PERSONA.md` §2.9's top signals in nine words: a competence signal
(ACORD 25), the anti-demo promise, and "we never charge your vendors" — which `PERSONA.md` §2.8 O-A5
says to state "in those words", which is documented as a real practice at $80–$125 per vendor per
year, and which is now also a clause in `/legal/terms` (`specs/13` §4, REVIEW.md §2.9). A promise made
in the hero and absent from the terms is a marketing line pretending to be a commitment.

**The hero carries no commercial CTA and therefore no card disclosure.** The trial ask lives in the
pricing block (§6), where the button reads **"Start 14-day trial"** and the disclosure
*"Card required. No charge until {date}. Cancel in one click."* renders adjacent to it in body text
(`specs/10` §3.1, REVIEW.md B-06).

### §2 Live demo strip

| Element | Copy | Words |
|---|---|---|
| Kicker | Pick a certificate. Watch it get read. | 7 |
| Chip 1 | Landscaper — looks fine | 3 |
| Chip 2 | Roofer — expired last month | 4 |
| Chip 3 | Cleaner — no waiver attached | 4 |
| Result caption | Read from the document. Compared to a residential requirement set. One gap found. | 13 |
| Micro | Real extraction, run on our own sample certificate. Nothing of yours is uploaded. | 13 |

**The three chips are Certly-authored fixtures, not corpus documents** (§8.1, REVIEW.md B-13). The
"Run it on my certificates →" CTA that used to sit here is gone: the demo is an in-page interaction,
and the page has one CTA (§2.1).

### §3 V1 — The Diff

| Element | Copy | Words |
|---|---|---|
| H2 | What you require. What they sent. | 6 |
| Body | Three states, not two. **Meets requirements.** **Gap.** And the one a spreadsheet always gets wrong: **claimed, but not evidenced** — the box is ticked and no endorsement page is attached. | 29 |
| Pull quote | "A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)." | 18 |
| Attribution | — printed on every ACORD 25 | 5 |

The pull quote is the single most valuable sentence available to this page. It is not our claim, it
is the form's own notice — a short, **attributed verbatim quotation of a factual notice**, which is
not a reproduction of ACORD's form and stays exactly as it is (REVIEW.md B-13). It must be typeset as
a *quotation of a document*, in `--c-font-num` (Source Code Pro), not as marketing copy.

**"Meets requirements", not "Covered"** (REVIEW.md B-02, §2.1): the engine has no state that means
"covered", and a UI word with no engine state behind it is a claim the system cannot support.

### §4 V2 — The Timeline

| Element | Copy | Words |
|---|---|---|
| H2 | Every certificate has a date. Most files have a red one. | 11 |
| Body | Certly watches them all at once — sixty days out, thirty, fourteen, seven, one — and shows you the month ahead instead of the day it went wrong. | 26 |

The rungs are not invented: they are the reminder ladder in `KNOWLEDGE_BASE.md` §B.5 and `specs/07` §2
(T−60/−30/−14/−7/−1, then T+1 and weekly to T+28). Copy and product must not drift apart — and
`specs/07` §9 now enforces the **72-hour per-recipient interval** and the **per-expiry message cap**
that §5's "One ask per vendor" promises, which nothing implemented before (REVIEW.md §2.8).

### §5 V3 — The Chase Loop

| Element | Copy | Words |
|---|---|---|
| H2 | The chase has already happened. | 5 |
| Body | We email the vendor and the agent named on the certificate, ask for the exact endorsement form, and stop the moment it arrives. One ask per vendor. Pause it any time. | 31 |
| Micro | We never charge your vendors. | 5 |

"One ask per vendor. Pause it any time." directly answers the loudest complaint in the category's
review corpus — "Too many e-mail requests sent to vendors that they get overwhelmed or upset"
([Capterra, myCOI](https://www.capterra.com/p/234580/myCOI/reviews/)). Tense matters: `PERSONA.md`
§2.6 JTBD-A3 is "I want the chase to have *already happened*", not "I want a reminder". The H2 is
that sentence. The promise is now enforced by a cap in the queue, not just written here.

### §6 How it works

| Element | Copy | Words |
|---|---|---|
| H2 | Three steps, about ten minutes. | 5 |
| Step 1 label | Send the certificates | 3 |
| Step 1 copy | Forward the emails, drop a folder, or import your spreadsheet. | 10 |
| Step 2 label | Set what you require | 4 |
| Step 2 copy | Start from a template for your property type and change three numbers. | 12 |
| Step 3 label | Read the file | 3 |
| Step 3 copy | Every vendor with a dated status you can export and forward. | 11 |

**The three step labels are rendered copy and are counted** — the first count omitted them, which was
one of the three reasons its total did not reproduce (REVIEW.md MJ-11).

Step 2's "change three numbers" is the antidote to the buyer's real fear, which `PERSONA.md` §2.8
O-A7 names: "I don't have time to set this up." Note the promise is **three numbers**, not "five
minutes" — five minutes is an unmeasured design target (`identity/CLAUDE.md` assumption A2) and must
not be printed as a claim.

### §7 Proof block

| Element | Copy | Words |
|---|---|---|
| H2 | What you can check before you pay us. | 8 |
| Item 1 | Open a sample Gap Report. Our own test certificate, real ISO form numbers. | 13 |
| Item 2 | Every field shows the words it was read from. | 9 |
| Item 3 | Low confidence is a state we show you, not an error we hide. | 13 |
| Item 4 | How we measure accuracy — and the number, the day we've measured it. | 12 |
| Honesty line | No customer logos yet. No accuracy percentage yet. We won't invent either. | 12 |
| Empty-slot placeholder | This is where our first customer's words will go. | 9 |

**Item 1 changed** (REVIEW.md B-13). It read *"Open a real Gap Report. Real form, real numbers,
redacted."* — a report generated from a **public sample certificate in the private corpus**, which
`kb-samples/MANIFEST.md` §Licence forbids publishing. The sample report is now generated from a
**Certly-authored fixture** (V5). The ISO form numbers on it (CG 20 10, CG 20 37, CG 24 04) are real,
because a form number is a fact about the industry, not somebody's document.

**What is allowed in this block, and what is banned.**

| Allowed | Banned |
|---|---|
| The sample Gap Report — a real export, generated from a **Certly-authored fixture** | Any file from `kb-samples/`, whole, cropped, redacted or thumbnailed. Any testimonial, quote, name, photo or job title of a customer who does not exist |
| A link to a public methodology page: golden-set size, how confidence is computed, what `needs_review` means | Any accuracy percentage — "99%", "highly accurate", "near-perfect", "industry-leading" — and **any share of a population without its denominator and date** (REVIEW.md MJ-07) |
| The count of ACORD 25 layouts our test corpus covers, with the date, described without publishing the documents | Any customer logo, "trusted by", "used by N firms", or a fabricated user count |
| **Attributed verbatim quotations** from the ACORD form and from ISO endorsement forms, with the form number and edition | A traced, redrawn or re-typeset reproduction of the ACORD 25 layout (`BACKLOG.md` N11) |
| Named export destinations ("export for AppFolio, Buildium, Yardi") **only if** the export genuinely exists | Any implication that Certly confirms coverage, or that a vendor "is insured" |

The empty testimonial slot stays empty and is **visibly reserved** — a bordered placeholder reading
"This is where our first customer's words will go." That is more persuasive than a stock photo and it
is the truth. Copyhackers names social proof as one of five essential elements
([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/)); we
cannot satisfy it honestly, so we substitute artefact proof and say so.

### §8 Guarantee strip

| Element | Copy | Words |
|---|---|---|
| H2 | The Lapse Watch | 3 |
| Body | If a certificate we're tracking expires and we didn't warn you first, that month is free — a month's credit on an annual plan. Cancel any time. Thirty days, money back. | 30 |

*(The "What this does and doesn't cover →" link is a footer link and is not counted.)*

The linked page carries the carve-outs verbatim from `OFFER.md` §6.1. The carve-outs must be one
click away and plainly written — burying them is what turns a guarantee into a complaint. **The
annual remedy is stated on the page** because six of the eight Stripe prices are annual and "that
month is free" was undefined for them (REVIEW.md MJ-19); and the expiry warning the guarantee depends
on is **not** something a customer can switch off (`specs/13` §2).

---

## 5. The visuals

Five, each specified as a buildable brief. All are **inline SVG in the app's palette**, authored as
components, not images — they must be theme-aware, selectable, translatable and diffable.

### V1 — The Diff *(hero, animated)*

| | |
|---|---|
| **Purpose** | Carry the entire product in one picture: your rule on the left, their document on the right, three states in the middle. |
| **Data shown** | Four requirement rows: **GL each occurrence** ($1,000,000 required / $1,000,000 shown → `met`); **Additional insured, CG 20 10** (required / `ADDL INSD: Y` but no endorsement page → `asserted_only`); **Waiver of subrogation** (required / `SUBR WVD: N` → `gap`); **Expiry** (must be future / 11/14/2026 → `met`). **Values come from the Certly-authored fixture set (§8.1), not from `kb-samples/`** (REVIEW.md B-13) — fictional vendor, fictional insurer, fictional policy number, our own layout. The ISO form numbers are real, because a form number is a fact about the industry rather than somebody's document. |
| **The three states, visually** | `met` = check in a **filled disc**, `--c-ok-solid`. `gap` = slash in a **hollow disc** with a dashed edge, `--c-gap-solid`. **`asserted_only` = the half-filled disc with a vertical hatch, `--c-ast-solid`** — a distinct third silhouette, never a shade of the other two, and separated from Expiring's 45° hatch by running with gravity. This half-disc is the product's logo-equivalent; it is legible at 16px in the app. The full seven-state system, with word, glyph, pattern and hue per state, is `IDENTITY.md` §6.4, and `identity/contrast.py` hard-fails a duplicated glyph, pattern or word. |
| **Motion** | On scroll into view, once: (1) the four right-hand values fade up from the certificate thumbnail with a 40ms stagger; (2) a connector line draws left-to-right per row, 180ms each; (3) each state dot pops in at the line's end. Total 1.1s. Never loops. |
| **Reduced motion** | `prefers-reduced-motion: reduce` → the final state renders immediately, no connectors animating, no fade. |
| **Dimensions** | Desktop 560×420 in a 12-col grid's right 5 columns. Mobile: 100% width, rows stack as **requirement above / found below** pairs. |
| **Accessibility** | `role="img"` with an `aria-label` naming all four outcomes in words; a visually-hidden `<table>` carrying the same four rows so a screen reader gets the data, not the picture. State is **never carried by colour alone** — dot fill (full / half / full), a text label, and an icon shape all encode it. |
| **Weight** | ≤ 9 KB inline, gzipped. No raster. |

### V2 — The Coverage Timeline *(animated)*

| | |
|---|---|
| **Purpose** | Move the buyer from one certificate to the whole portfolio, and show that Certly sees the month ahead. |
| **Data shown** | 12 horizontal vendor bars (Landscaping, Roofing, Janitorial, Elevator, Plumbing, HVAC, Pest, Snow, Pool, Electrical, Restoration, Security) across a 12-month axis. Each bar is `--c-ok-solid` up to its own expiry, then `--c-gap-solid`. Three bars carry the vertical `--c-ast-solid` hatch for their whole length — a vendor can be *claimed, not evidenced* and *in date* at the same time, which is exactly the insight. Trade names are generic categories, not vendors: nothing here names a real business. |
| **Motion** | A vertical "today" playhead sweeps left to right over 2.4s. As it crosses each expiry, that bar flips to red and a small T−30 tick lights up 30 days earlier. Sweep runs **once**, then the playhead parks at "today" with 4 bars red. A single ghost control replays it. |
| **Reduced motion** | Static, playhead at "today", final colours. |
| **Dimensions** | Desktop 960×360, full-bleed within the content column. Mobile: rotate to 12 stacked rows with a fixed "today" marker, no sweep. |
| **Accessibility** | Visually-hidden list: "Roofing — expires 14 November 2026 — 4 days" etc. `aria-live` off; this is decorative-with-data, not a status region. |
| **Weight** | ≤ 12 KB inline. Animation via CSS `@keyframes` on transforms and `stroke-dashoffset` only — **no JS, no layout-affecting properties**, so it cannot cost CLS. |

### V3 — The Chase Loop *(diagram, light motion)*

| | |
|---|---|
| **Purpose** | Show that the chase is a closed loop that stops itself — answering both "will you do it?" and "will you spam my vendors?" in one picture. |
| **Data shown** | Six nodes on a ring: **T−60 notice → vendor** → **no reply** → **T−30 to the agent on the certificate** → **endorsement page arrives** → **re-checked automatically** → **state flips to met** → (loop closes). Two exits drawn deliberately: a **stop** node ("arrives → loop ends") and a **pause** node ("you can stop it any time"), both with a distinct terminal shape. |
| **Motion** | A single travelling dot completes the ring once (2.0s) and stops at the `met` node. Not a perpetual spinner — a perpetual loop would imply endless email, which is precisely the fear. |
| **Reduced motion** | Static ring, dot parked at `met`. |
| **Dimensions** | 480×480 desktop; mobile becomes a vertical 6-step flow, no ring. |
| **Accessibility** | Ordered list in the visually-hidden layer, one item per node, in sequence. |
| **Weight** | ≤ 7 KB. |

### V4 — The Certificate, Annotated *(static, in the proof block)*

| | |
|---|---|
| **Purpose** | Establish domain competence in two seconds and locate the trap — **without publishing anyone's certificate and without reproducing ACORD's form**. |
| **Rebuilt (REVIEW.md B-13)** | This asset was specified as *"the top-left region of a real public ACORD 25 (from `kb-samples/`)… SVG **traced from the form's rules and boxes**"*. Both halves were against our own policy: `kb-samples/MANIFEST.md` §Licence keeps the corpus private and unpublished, and `BACKLOG.md` N11 forbids rendering or generating an ACORD-branded form — a traced reproduction of ACORD's layout on a page selling a competing commercial product is exactly what that rule exists to prevent. |
| **What it is now** | **A Certly-authored diagram of a certificate's *anatomy*** — our own boxes, our own grid, our own labels, in `--c-line` on `--c-paper`, showing the three places that matter: (1) **two check-box columns**, labelled "a tick is a claim"; (2) a **free-text box**, labelled "where blanket wording hides"; (3) a **notice block** carrying the ACORD sentence as an **attributed verbatim quotation**, which is a quotation of a factual notice and not a reproduction of a form. It is a schematic of a *kind of document*, in the way a diagram of "a lease" is not a copy of anyone's lease. |
| **What it must not be** | a trace, a redraw, a re-typeset or a screenshot of an ACORD 25; anything carrying ACORD's marks, logo or distinctive layout; anything derived pixel-wise or vector-wise from a file in `kb-samples/`. |
| **If the founder wants a real ACORD 25 on the marketing site** | that is an **ACORD licensing conversation** (`OQ-5`), not an engineering decision, and it goes to the founder. Reading and quoting a form's printed notice is not the same act as reproducing its layout. |
| **Motion** | None. |
| **Dimensions** | 720×420, `object-fit: contain`. |
| **Accessibility** | Long description in a `<figcaption>` that states all three callouts in prose. |
| **Weight** | Authored SVG, ≤ 18 KB. No raster, and no tracing step to get one. |

### V5 — The Gap Report *(a real artefact, not an illustration)*

| | |
|---|---|
| **Purpose** | Let the buyer hold the deliverable before paying. This is the substitute for the testimonial we are not allowed to invent. |
| **What it is** | A genuinely generated PDF export, **produced by the real M12 renderer from the Certly-authored fixture set (§8.1)** — not from `kb-samples/` (REVIEW.md B-13). Cover line "Gap Report — Sample Portfolio — 3 September 2026", the six state counts, then one page per vendor showing the requirement, the value found, the state (**"Meets requirements" / "Gap" / "Claimed, not evidenced" / "Not checked" / "Needs review"**), and — critically — **the quoted text the value was read from** (the quote gate, `KNOWLEDGE_BASE.md` §D.3). Page 1 carries the §F.1 disclaimer verbatim. The report also carries its "Read, but not confident enough to compare" section, because the fixture set includes one deliberately hard document (`specs/15` §4.1). |
| **On the page** | Shown as a two-page spread thumbnail with a "Open the sample report" link that opens the real PDF in a new tab. The link must open the actual file — a mock-up here would be the exact dishonesty this block exists to avoid. |
| **Motion** | None. |
| **Accessibility** | The PDF is tagged, has a document title, and a plain-HTML twin at `/sample-gap-report` for screen readers and for indexing. |
| **Weight** | Thumbnail ≤ 25 KB AVIF; the PDF itself is off-page. |

---

## 6. Pricing block

Positioned immediately after the guarantee strip. Three cards; **Standard pre-selected and labelled
"Most portfolios"**; a monthly/annual toggle defaulting to monthly with "2 months free" on annual.

| | Starter | **Standard** | Portfolio |
|---|---|---|---|
| | $99/mo | **$199/mo** | $299/mo |
| **Tracked vendors** | 50 | 150 | 400 |
| Everything in the product | ✓ | ✓ | ✓ |
| Per-property requirement sets | — | ✓ | ✓ |
| We import your spreadsheet | — | ✓ | ✓ |
| Seats | 3 | 10 | 25 |
| CTA | **Start 14-day trial** | **Start 14-day trial** | **Start 14-day trial** |
| *under every CTA, in body text* | Card required. No charge until {date}. Cancel in one click. | | |

**"Start free" is gone from every card** (REVIEW.md B-06). All three tiers are card-required
subscription trials that charge automatically on day 14; calling that "free" without the material
terms adjacent is the pattern the FTC's negative-option rule and ROSCA are aimed at. The disclosure
renders **next to the button, in body text, not behind a link**, `{date}` is the real computed date,
the string shown is recorded against the Checkout session, and the T−3 and T−1 warnings before the
first charge cannot be switched off (`specs/10` §3.1). **The one thing on this page that keeps the
word "free" is the Gap Report, because it is free.**

**Under the cards, four lines that do the actual selling:**

1. **The metric, defined in one sentence, verbatim from `specs/10` §2.1.** *"A tracked vendor is one
   non-archived vendor in your account. Certly tracks one current certificate per tracked vendor:
   renewals, re-uploads, corrections and endorsement pages never count again, and archived vendors
   count zero. A vendor who has not sent anything yet still occupies a slot — finding those is the
   point."* Without this the buyer assumes a per-document meter and prices in a punishment for the
   exact outcome the product produces. **The unit is "tracked vendors", not "active certificates"**
   (REVIEW.md B-10): the two names described two different meters, and the one a customer can predict
   from their own dashboard is this one.
2. **The honest comparison, as a small table**, against the two real alternatives:

   | | Your spreadsheet | A reminder tool | Certly |
   |---|---|---|---|
   | Stores the PDF | you do | ✓ | ✓ |
   | Tells you the expiry date | you do | ✓ | ✓ |
   | Reads the limits off the certificate | — | — | ✓ |
   | Checks additional insured and waiver against your rule | — | — | ✓ |
   | Tells you when it's claimed but not evidenced | — | — | ✓ |
   | Emails the agent for the endorsement | — | — | ✓ |
   | Price you can see without a call | — | ✓ | ✓ |

   **Rules for this table.** No competitor is named in the "reminder tool" column — the claim is
   about a *category*, and the specific published feature lists that justify it
   ([coitracker.co/pricing](https://coitracker.co/pricing)) are cited in a footnote link, not on the
   page as an attack. We never claim to be cheaper than that column, because we are not
   (`OFFER.md` §8.3).
3. **Above the tiers, no wall.** "More than 400 vendors? It's $0.55 each per month. Email us — still
   no demo." This is the promise the whole page is built on and it must survive the pricing block,
   where every incumbent breaks it.
4. **The free tier, answered rather than avoided** (`PERSONA.md` §7.4). "Some tools track 25 vendors
   free. They'll tell you the date. Start with our free Gap Report instead — it tells you what's
   wrong." *(In the launch state, before the founder's legal read, that sentence ends "— join the
   list" and links to the waitlist rather than to an upload page; §2.1, `specs/15` launch gate.)*

---

## 7. FAQ — six, no more

Hick's Law governs the whole page ([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/));
a long FAQ is a list of doubts. Six, in the order `PERSONA.md` §2.8 says they arise.

1. **"My property software already has an insurance expiry field. Why this?"** — It has a date
   someone typed in. Certly reads the certificate itself: the limits, the additional-insured and
   waiver boxes, the endorsement pages, the dates — and tells you what's missing.
2. **"How do I know it read the document correctly?"** — Every value shows the text it came from, on
   the page it came from. Anything we're not confident about is marked for review rather than
   guessed. We publish how we measure this, and we'll publish the number once we have measured it on
   a corpus we can name.
3. **"Will you email my vendors constantly?"** — One consolidated request per vendor per reminder,
   sixty days out and again as the date gets close, to the vendor and to the agent on the
   certificate. You can pause any vendor, or all of them, in one click.
4. **"Do you charge my vendors anything?"** — No. Never. They upload from a link in an email; there
   is nothing for them to buy and no account for them to make.
5. **"What can't it do yet?"** — At launch it reads the ACORD 25 certificate of liability insurance
   and the endorsement pages attached to it. Not evidence-of-property forms, not auto or aviation
   certificates. We'd rather tell you now than let you find out.
6. **"What happens to my data if I leave?"** — Export everything — certificates, history, the renewal
   calendar — in one click, any time, including after you cancel. We don't train models on your
   documents.

---

## 8. The no-login interactive demo

**Verdict: yes, and it is the highest-leverage thing on the page** (`OFFER.md` §13.1) — but with
sample certificates only at launch.

### 8.1 Launch design — three **Certly-authored fixtures**

**Rebuilt (REVIEW.md B-13).** The first design used *"three pre-supplied public sample certificates
from `kb-samples/certificates/`"*, labelled on the chips as "Landscaper", "Roofer" and "Cleaner".
Three separate problems, and none of them cosmetic:

1. `kb-samples/MANIFEST.md` §Licence stores that corpus *"as fetched, unmodified, as test fixtures"*
   and says *"we do not redistribute them, **publish them**"* — putting three of them on a commercial
   marketing page is publishing them.
2. The chips **relabelled named institutions' documents**: Story County IA, WisDOT and the City of
   Temecula published those files, and calling one "Roofer — expired last month" misdescribes a named
   third party's publication.
3. It removed our own control over the demo: we need one clean, one expired and one
   waiver-missing case, and a real corpus gives us whatever it happens to contain.

**The fixture set.** Three documents **we author for this purpose**: our own certificate-shaped
layout, fictional vendors ("Northgate Landscaping", "Harbor Roofing", "Blue Line Facility Services"),
fictional insurers, fictional policy numbers, real ISO form numbers. They live in the repo as
`apps/certly/src/lib/demo/fixtures/`, not in `kb-samples/`, and they are the same three the V1 panel,
V4 and the V5 sample report draw on — so the whole page tells one consistent story.

- Chip 1 **meets** a residential requirement set. Chip 2 has an **expired** policy. Chip 3 shows
  `SUBR WVD: N` — a **gap** — plus one `ADDL INSD: Y` with no endorsement page, so the demo also
  demonstrates **"claimed, not evidenced"**, which is the differentiator.
- On click: the fixture thumbnail renders and the four V1 rows populate in sequence, with the
  quote-gate text visible on hover. One gap is surfaced with its plain-English explanation.
- **How the result is produced, stated once (REVIEW.md MN-11).** The extraction is **real but not
  live**: each fixture is run through the real extractor and the real requirement template **at build
  time**, and the stored result is what the page serves. **There is no model call at request time.**
  A live call in the hero would put the page's single most important interaction behind a latency and
  an availability risk, and the demo would be the first thing to break on a bad afternoon.
- **Nothing of the visitor's is uploaded, stored or logged beyond an anonymous event.** No account,
  no email, no cookie beyond the analytics one.
- Response budget: first paint of the result **under 1.5s**.
- Rate limit: 30 runs per IP per hour. Abuse here is cheap to us and expensive to nobody.

### 8.2 Accepting a stranger's own certificates — the founder's legal gate

A stranger's real certificate contains a third party's business details, policy numbers and producer
contact information. Accepting uploads with no account means holding other people's data with no
contract and no deletion path. `offer/RESEARCH.md` §7 set eight conditions and said *"anything less
than all eight and it does not ship"*.

**This is now specified, scaled and reconciled, in `specs/15`** — which is a Must item and the offer's
front end, not a phase-2 idea (REVIEW.md B-07, §2.6). What changed:

- **`specs/15` §6.1 reconciles all eight conditions**, condition by condition, and justifies the three
  it meets in a reduced form (25 files rather than one; written to storage and deleted inside the
  render job rather than held in memory; extraction payload kept 7 days so the visitor can re-open
  their own report). Source documents are deleted in **minutes**, not 24 hours.
- **Two conditions were added, not relaxed:** no producer contact name, phone, fax or e-mail is
  **ever stored** on the anonymous path, and the purge is at **7 days, stated next to the drop zone
  in body text**.
- **The founder's legal read is a launch gate.** Until it lands, this page ships the samples-only demo
  as its single hero CTA and the Gap Report sits behind a waitlist line (§2.1). If the read rejects
  the reduced variant, the fallback needs no new code: one file, ≤ 5 MB, PDF only, 24-hour purge.
- It is `OFFER.md` §13.3 **Q2**, with its default written down, and it belongs in `PREREQUISITES.md`
  as a dated founder task rather than in an open-questions list.

---

## 9. Mobile variant

79% of landing-page visits are mobile ([Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)),
while `PERSONA.md` §2.10 establishes that the *work* is desktop and the *question* is mobile. So the
mobile page is not a squeezed desktop page — it is the same argument told in one column, and its job
is to get a Gap Report requested, not to demonstrate a review workflow.

| Change | Detail |
|---|---|
| Hero | Eyebrow, H1, sub, **the one CTA** (§2.1 — "See it read a certificate" at launch, "Get a free Gap Report" after the legal read), waitlist line where applicable, trust line. Desktop and mobile now carry the same single CTA, so there is nothing to demote. |
| V1 | Rows stack as *requirement / found* pairs, full width. The half-dot is the first thing on each row so state survives a thumb scroll. |
| V2 | Sweep animation dropped entirely; 12 static rows with a fixed "today" marker. |
| V3 | Ring becomes a 6-step vertical flow. |
| Demo | Chips become a full-width segmented control; result renders beneath, not beside. |
| Pricing | Cards become a vertical stack with **Standard first**, not middle. |
| Sticky bar | Appears after the user passes V1: "From $99/mo · **Start 14-day trial**" — 56px, dismissible, safe-area inset respected. Tapping it scrolls to the pricing block, where the card disclosure sits next to the button; **the sticky bar never starts Checkout directly**, because the disclosure must be adjacent to the control that collects the card (REVIEW.md B-06). |
| Tap targets | ≥ 44 × 44 CSS px, 8px minimum spacing. |
| Type | H1 ≥ 30px, body ≥ 17px, line length 38–42 characters. |
| **Never on mobile** | The certificate-anatomy diagram (V4) at full detail — it is unreadable at 390px. Show the notice-block callout alone, with "See the whole diagram" to the desktop asset. |

---

## 10. Performance budget

Enforced in CI as a Lighthouse assertion; a build that breaks the budget fails, it does not warn.

| Metric | Budget | Why |
|---|---|---|
| LCP (mobile, Moto G Power, 4G throttle) | **≤ 1.8s** | The LCP element is the H1, which must be server-rendered text in a self-hosted font with `font-display: swap` |
| INP | ≤ 200ms | The demo chip is the only meaningful interaction and it must feel instant |
| CLS | **≤ 0.02** | All SVGs carry explicit `width`/`height`; the sticky bar is `position: fixed`; no late-injected banner |
| Total transferred, first view | **≤ 350 KB** | |
| — HTML (incl. inline critical CSS) | ≤ 45 KB | |
| — CSS | ≤ 30 KB | Design-system tokens only; no framework CSS |
| — JS | **≤ 40 KB** | Demo chips, monthly/annual toggle, sticky bar. No client-side router, no analytics SDK — events post to our own `/api/events` with `navigator.sendBeacon` |
| — Inline SVG, all five visuals | ≤ 55 KB | V1 9 + V2 12 + V3 7 + V4 18 + V5 thumb 25, minus what is below the fold and lazy |
| — Fonts | ≤ 60 KB | Exactly two faces — **Source Sans 3** (`--c-font-ui`) and **Source Code Pro** (`--c-font-num`) — WOFF2, **self-hosted via `next/font`**, subset to Latin + the tabular figures the limits need. `next/font` self-hosts at build time, which satisfies both this budget and `IDENTITY.md` §7.1's "exactly one stylesheet link"; the `fonts.googleapis.com` link survives only in `identity/samples.html`, a local gallery that is not a shipped surface (REVIEW.md MJ-05) |
| Third-party requests | **0 on first view** | No CDN fonts, no tag manager, no chat widget. Enforced as a **failing** Lighthouse assertion, not a warning. A chat widget on this page would contradict "no sales call" as well as the budget |
| Images below the fold | `loading="lazy"`, `decoding="async"` | |
| Animation | Compositor-only (`transform`, `opacity`, `stroke-dashoffset`) | Never animate layout properties |

---

## 11. Conversion instrumentation

Own `events` table per PLAN.md A14; PostHog key optional and off by default. Every event carries
`session_id`, `variant`, `device`, `referrer_class`, `ts`. **No PII, ever** — no email in an event
payload, no IP stored beyond rate limiting.

**Every name below is registered in [`specs/00-event-vocabulary.md`](specs/00-event-vocabulary.md)**,
which is the single source for the whole product (REVIEW.md B-14). This section previously invented a
fourth vocabulary — `signup_start`, `trial_start`, `paid` — for a funnel the specs already named. The
`events:check` CI rule fails the build on a name that does not resolve to a registry row.

| Event | Fires when | What it answers |
|---|---|---|
| `lp_view` | Page interactive | Denominator |
| `lp_scroll_depth` | 25 / 50 / 75 / 100% | Whether the hero earned the scroll (NN/g's condition) |
| `lp_hero_cta_click` | The hero CTA, with `which` (its label in the current state) | Whether the single hero CTA earns the click; the `which` property is what makes experiment 3 (dual CTA) measurable if it is ever run |
| `lp_gap_report_waitlist` | The waitlist line is submitted (launch state only) | Demand for the Gap Report **before** the legal read lands — the number that tells the founder whether the gate is worth clearing quickly |
| `lp_demo_run` | Demo chip clicked, with `sample` | **The key metric.** Demo engagement is the proxy for our weakest value-equation term |
| `lp_demo_complete` | Result fully rendered | Did they watch it finish? |
| `lp_demo_to_cta` | CTA clicked within 60s of a demo run | Does the demo convert scepticism? If not, the hero is wrong |
| `lp_visual_view` | Each of V1–V5 ≥50% in viewport ≥1s | Which picture is doing the work |
| `lp_sample_report_open` | Sample Gap Report opened | Artefact proof engagement |
| `lp_pricing_view` | Pricing block in view | Above-pricing funnel completion |
| `lp_plan_select` | Tier card clicked, with `tier`, `interval` | Tier mix and monthly/annual split |
| `lp_faq_open` | Each FAQ, with `id` | A frequently opened FAQ is a hole in the page above it |
| `lp_gap_report_start` / `lp_gap_report_submit` / `lp_gap_report_delivered` | Free Gap Report funnel | HVCO conversion |
| **`signup_started` → `checkout_completed` → `activated` → `trial_converted`** | Product funnel — the page's own events stop at `signup_started` and the product's registry takes over | **`activated` = one comparison against a certificate the org uploaded, out of `needs_review`, emitted once per org by the comparison job** — `specs/11` §2, and nothing else (REVIEW.md B-05). The four conditions this row used to cite from `OFFER.md` §9 are now the **trial health checklist** (`OFFER.md` §9.1): a good day-7 instrument, but one of them requires a gap to *exist*, which is not under our control and would make a clean portfolio a failed activation. `checkout_completed` is **a card on file**; `trial_converted` is **money**, and it is the one `THRESHOLDS.md` §3 measures |

**Pre-committed numbers, handed to `THRESHOLDS.md`, evaluated at n ≥ 100 sessions:**

| Measure | Benchmark | Certly's line |
|---|---|---|
| Landing → any CTA | SaaS median **3.8%** ([Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)) | ≥ 4% or the hero is wrong |
| Demo run rate among scrollers past V1 | no benchmark | ≥ 25%, or the demo is not visible enough to be the proof asset it was built to be |
| Trial → paid (`trial_converted ÷ checkout_completed`) | median **8%**, card-required **30%** ([Poyar, n=200](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)) | ≥ 15%; below 8% triggers the Solo-tier review in `OFFER.md` §8.4. *(Distinct from `THRESHOLDS.md` §3, which measures `trial_converted ÷ activated` — a different denominator answering a different question.)* |
| "Can we get on a call?" among trials | — | > 33% falsifies the no-demo thesis (`PERSONA.md` §8.2) |

**First three experiments, one variable each, in this order:** (1) hero H1 — chosen vs option 4
below; (2) demo above the fold vs below it; (3) **dual CTA vs the single CTA that now ships** — this
is where the dual-CTA idea belongs (REVIEW.md MJ-04), as a measured experiment rather than as the
default. Never two at once.

---

## 12. The headline

Five options, all written to front-load information-bearing words and to survive the 5th–7th grade
constraint where the buyer's own vocabulary allows.

| # | Headline | For | Against |
|---|---|---|---|
| 1 | **Your spreadsheet knows when the certificate expires. It can't tell you the certificate is wrong.** | Names the real competitor (the spreadsheet — 977 of 1,101 `certly-pm` end-customers use one), states the insight in plain words, no jargon in the first eight, and sets up V1 exactly. Copyhackers' formula — "my product is the one that ___" — resolves cleanly. | Two sentences and 15 words; long for a hero. Doesn't name the buyer (the eyebrow does). |
| 2 | Never find out at claim time. | Maximum emotional compression; the dream outcome stated as its inverse. | An unknown brand asserting a catastrophe reads as fear-selling; NN/g: "promotional language imposes a cognitive burden". No mechanism. |
| 3 | The certificate says "additional insured". That doesn't make you one. | The single truest, sharpest sentence in the category, straight from the ACORD notice. | Requires the reader to already know what additional insured means. Works for a commercial PM, loses a small residential one. Better as V1's caption than as the H1. |
| 4 | Read every certificate. Catch every gap. Chase every renewal. $99 a month, no demo. | Perfectly clear, price and anti-demo in the headline, imperative and scannable. | Describes features, not the insight. Gives a reminder tool at $59 an easy comparison — the exact fight `OFFER.md` §8.3 says not to pick. **Keep as the A/B challenger.** |
| 5 | Insurance compliance for people who don't have a risk department. | Nails the segment and the anti-enterprise position in one line. | "Compliance" is a banned word as a bare assertion (`KNOWLEDGE_BASE.md` §F) and the line promises a category, not an outcome. |

> ### Chosen: #1
> **Your spreadsheet knows when the certificate expires. It can't tell you the certificate is wrong.**
>
> **Sub-headline:** Certly reads every vendor's COI, compares it to the limits and endorsements you
> require, and separates what's proved from what's only claimed. From $99 a month. No demo, no sales
> call.

It wins on three grounds. It names the alternative the buyer actually uses, which is Dunford's and
CXL's first rule of positioning. It states a *falsifiable, checkable* claim rather than a promise —
and the checking is one scroll away in V1, which is the entire architecture of this page. And it
respects the one thing this brand cannot fake: it does not ask to be believed, it asks to be tested.

**A/B challenger:** #4, as experiment 1.

---

## 13. Footer

Four columns, then a legal strip. ~60 words.

- **Product:** How it works · Pricing · Sample Gap Report · What we can't read yet · Status
- **For:** Property managers · HOA & community associations · Commercial tenants · General contractors *(→ `/for-general-contractors`, per `PERSONA.md` §7.2)*
- **Company:** About · Contact · Help · Certly is a TheVillage company
- **Legal:** Terms · Privacy · Sub-processors · The Lapse Watch, in full · Do not sell my information

The Terms carry the standing commitment **"We never charge your vendors"**, in the same words used in
the hero trust line, in FAQ 4 and in every vendor-facing email footer (`specs/13` §4/§A11,
REVIEW.md §2.9).

**Legal strip, on every page, verbatim from `KNOWLEDGE_BASE.md` §F.1:**

> **Certly reads documents. It does not verify coverage.** A certificate of insurance is issued as a
> matter of information only and confers no rights on the certificate holder. Certly extracts what a
> document says and compares it to the requirements you entered. It does not confirm that a policy is
> in force, that an endorsement exists, or that coverage would respond to a claim. Only the insurer
> can confirm coverage, and only your own counsel or broker can tell you whether your requirements
> are the right ones.

Plus the CAN-SPAM postal address (shared with outbound, per D4) and the copyright line.

---

## 14. Self-review, and the word count — **published as a script, not as a claim**

### 14.1 The counter

The first version of this section claimed **395**, *"counted mechanically over every copy string in
§4"*. It did not reproduce (REVIEW.md MJ-11): summing the per-row "Words" column gave 391, recounting
the strings gave 394, and the three "How it works" **step labels — which are rendered copy — were not
counted at all**, which pushes it to ~404. The budget passed either way, so this was credibility
rather than substance — but the fleet's whole argument is that numbers are counted rather than
estimated, and a word count that does not reproduce is exactly the shape of number `BACKLOG.md` N10
bans us from publishing outwards.

**The fix: §4's tables are now uniform (`| Element | Copy | Words |`), and the counter is published
here and run in CI.** Save as `scripts/landing-words.py`:

```python
#!/usr/bin/env python3
"""Count the landing page copy above the pricing block, from LANDING_SPEC.md section 4.

Rule: every table row inside section 4 contributes its COPY cell (column 2). A word is a
whitespace-separated token containing at least one alphanumeric character, after markdown
emphasis markers are stripped -- so '**Gap.**' is one word and a bare em dash is none.
Usage:  python3 scripts/landing-words.py phase-4-revenue/certly/LANDING_SPEC.md
Exits 1 if the total is 450 or more."""
import re, sys

BUDGET = 450
src = open(sys.argv[1], encoding="utf-8").read()
sec4 = src[src.index("\n## 4. Copy, section by section"):src.index("\n## 5. The visuals")]

def words(cell):
    cell = re.sub(r"[*_`]", "", cell)
    return [t for t in cell.split() if any(c.isalnum() for c in t)]

total, per_section, section = 0, [], None
for line in sec4.splitlines():
    if line.startswith("### "):
        section = line[4:].strip(); per_section.append([section, 0])
    if not line.startswith("|"):
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) < 3 or set(cells[0]) <= set("-: ") or cells[0] == "Element":
        continue                                   # header or separator row
    n = len(words(cells[1]))
    total += n; per_section[-1][1] += n

for name, n in per_section:
    print(f"{n:4d}  {name}")
print(f"{total:4d}  TOTAL above pricing (budget {BUDGET})")
sys.exit(1 if total >= BUDGET else 0)
```

### 14.2 The result

```
$ python3 scripts/landing-words.py phase-4-revenue/certly/LANDING_SPEC.md
  76  §1 Hero
  44  §2 Live demo strip
  58  §3 V1 — The Diff
  37  §4 V2 — The Timeline
  41  §5 V3 — The Chase Loop
  48  §6 How it works
  76  §7 Proof block
  33  §8 Guarantee strip
 413  TOTAL above pricing (budget 450)
```

**413 words above the pricing block against a 450 ceiling — passes**, with 37 words of
headroom for the microcopy that will inevitably appear. Any addition above the pricing block must
remove an equal number of words. The count is for the **launch state** (single CTA plus the waitlist
line); after the founder's legal read the hero loses the waitlist line and gains nothing, so the page
gets **403 words** — smaller, and it also passes.

`scripts/landing-words.py` runs in CI beside `events:check` and `kb:check`. A pull request that pushes
the page over 450 fails the build rather than warning.

### 14.3 The rest of the self-check

**Every visual specified as a buildable brief:** V1–V5 each carry purpose, data, states, motion,
reduced-motion fallback, dimensions, accessibility and weight — and V4 and V5 are now specified
against **Certly-authored fixtures** rather than against the private corpus. **Passes.**

**No fake proof:** no testimonial, no logo, no accuracy number, **no share of any population without
its denominator and date**, no invented statistic anywhere. The one number in the hero is a price.
**Passes.**

**Nothing published that is not ours to publish:** no corpus document, no traced ACORD form, no
relabelled third-party publication. The only third-party text on the page is a short, attributed
verbatim quotation of a printed notice. **Passes** (REVIEW.md B-13).

**One call to action above the fold**, per `PLAN.md` §4. **Passes** (REVIEW.md MJ-04).

**No CTA presents a card-required subscription as free**, and the material terms render adjacent to
every control that collects a card. **Passes** (REVIEW.md B-06).

**Felt, not read:** the argument is carried by V1 and the demo; prose is scaffolding. **Passes.**

### 14.4 The blocking contradiction — **resolved**

`PERSONA.md` §2.5 and §2.9.4 instructed that Certly's status word should be **"Covered"** ("41 of 47
vendors covered"), deliberately chosen over "compliant". `KNOWLEDGE_BASE.md` §F stated, as a binding
copy invariant, that Certly *"never says verified, compliant or **covered** as a bare assertion about
a policy"*. Both could not hold, and the word sat in the product's primary status chip and in the
portfolio summary line, so it was load-bearing. This spec followed §F and referred the conflict to the
wave-1b reviewer.

**The ruling (REVIEW.md §2.1) upheld it, and it is now applied everywhere:** the green state is
**"Meets requirements"** (pill `MEETS`), the engine value is `meets`, and **"Covered" is retired as a
status word** across `PERSONA.md`, `UX.md`, `IDENTITY.md`, `design-system.css`, `identity/samples.html`,
`specs/05`, `specs/06`, `specs/12`, `specs/15`, `OFFER.md` and this file. Four reasons, in the order
they were weighed: the engine has no state that means "covered"; a wrong "covered" is
`PERSONA.md` O-A6's *"failure that ends the company"* while a wrong "gap" costs an email; the token
layer was vocabulary-neutral so the change cost copy rather than code; and `PERSONA.md`'s underlying
finding survives intact in the buyer's better word, **"current"**, used about a *document*.

The portfolio summary line reads: *"As of 3 September 2026, 41 of 47 vendors meet your requirements."*

The three places this spec said would change if the ruling went the other way — the V1 state label,
the pricing comparison row and the portfolio summary line — did not have to change, because the
ruling went this way. **Closed.**
