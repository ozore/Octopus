# Certly — landing page specification

**Author:** Offer & Landing agent (wave 1). **Date:** 2026-09-03.
**Reads with:** `OFFER.md` (the offer this page sells), `offer/RESEARCH.md` (every cited number),
`PERSONA.md` (Buyer A — the property/association management operations & compliance coordinator),
`KNOWLEDGE_BASE.md` §B.4 (the three-state rule), §C (endorsement glossary) and **§F (the copy
invariants, which are binding on every word below)**.
**Palette and type:** deliberately not specified here. `IDENTITY.md` and `design-system.css` had not
been written to disk when this was authored; every colour below is named as a **semantic token**
(`--state-met`, `--state-asserted`, `--state-gap`, `--ink`, `--paper`, `--rule`) to be bound to the
identity system without touching this spec.
**Goal:** felt, not read. **Hard budget: under 450 words above the pricing block.** Measured: **395** (counted, §14).

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
([cxl.com/blog/above-the-fold](https://cxl.com/blog/above-the-fold/)). So: **"See it read a
certificate" above the fold; "Start free" and the price after the mechanism.**

**No navigation in the header.** "Navigation links are a distraction"
([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/)). Logo
left, a single ghost "Sign in" right. Every other link lives in the footer.

| # | Section | Job | Words |
|---|---|---|---|
| 1 | Hero | Plant the belief. Two CTAs. | 71 |
| 2 | Live demo strip | Convert scepticism into evidence, with no login | 43 |
| 3 | **V1 The Diff** | Show the mechanism and the third state | 57 |
| 4 | **V2 The Timeline** | Show the stakes across the portfolio | 37 |
| 5 | **V3 The Chase Loop** | Show the part they keep not doing | 41 |
| 6 | How it works | Collapse perceived effort to ten minutes | 47 |
| 7 | Proof block | Substitute artefacts for testimonials we don't have | 73 |
| 8 | Guarantee strip | Risk reversal before the price is seen | 26 |
| | **Above pricing** | | **395 / 450** |
| 9 | Pricing | 3 tiers + the honest comparison | ~150 |
| 10 | FAQ | Six, no more | ~180 |
| 11 | Footer | Legal, disclaimer, company | ~60 |
| | **Whole page** | | **~785** |

Unbounce's benchmark puts the optimal SaaS landing page at **250–725 words** with a median conversion
of 3.8% ([unbounce.com](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)).
785 is marginally over; the overflow is entirely FAQ and legal, which a scanner skips and a buyer
searches. The 395 that matter sit well inside it.

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
│  ┌───────────────────────────┐  ┌────────────────────────┐   │                          ││
│  │ See it read a certificate │  │ Get a free Gap Report  │   │ Waiver of     SUBR WVD: N││
│  └───────────────────────────┘  └────────────────────────┘   │ subrogation   ● gap      ││
│                                                              │                          ││
│  ACORD 25. Self-serve. Your vendors are never charged.       │ Expires       11/14/2026 ││
│                                                              │ future date   ● met      ││
│                                                              └──────────────────────────┘│
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ FOLD ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  Pick a certificate. Watch it get read.                                                  │
│  [ Landscaper — looks fine ] [ Roofer — expired last month ] [ Cleaner — no waiver ]     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Three deliberate choices. **The V1 panel is above the fold, not below it** — NN/g's condition for
scrolling is that "what's above the fold is promising enough", and a picture of the product doing the
job is the most promising thing we own. **The demo chips peek above the fold line** so the page
visibly continues. **The eyebrow names the buyer before the headline**, because the F-pattern's first
horizontal sweep lands there and "if users see only the first 2 words, they should still get the
gist" ([nngroup.com](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).

---

## 4. Copy, section by section, with the word budget enforced

Every three-syllable insurance term below appears **inside a diagram before it appears in a
sentence**, per the reading-level constraint (5th–7th grade copy converts at 12.9% vs 2.1% for
professional-level; best pages use only 50–140 words of three syllables or more —
[Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)). Where a
professional term is unavoidable it is the buyer's own word, taken verbatim from `PERSONA.md` §2.5.

### §1 Hero — 71 words

| Element | Copy | Words |
|---|---|---|
| Eyebrow | COI tracking for property and association managers | 8 |
| **H1** | **Your spreadsheet knows when the certificate expires. It can't tell you the certificate is wrong.** | 15 |
| Sub | Certly reads every vendor's COI, compares it to the limits and endorsements you require, and separates what's proved from what's only claimed. From $99 a month. No demo, no sales call. | 30 |
| CTA 1 (primary) | See it read a certificate | 5 |
| CTA 2 (ghost) | Get a free Gap Report | 5 |
| Trust line | ACORD 25. Self-serve. Your vendors are never charged. | 9 |

The trust line carries three of `PERSONA.md` §2.9's top signals in nine words: a competence signal
(ACORD 25), the anti-demo promise, and "we never charge your vendors" — which `PERSONA.md` §2.8 O-A5
says to state "in those words", and which is documented as a real practice at $80–$125 per vendor per
year.

### §2 Live demo strip — 43 words

| Element | Copy | Words |
|---|---|---|
| Kicker | Pick a certificate. Watch it get read. | 7 |
| Chip 1 | Landscaper — looks fine | 3 |
| Chip 2 | Roofer — expired last month | 4 |
| Chip 3 | Cleaner — no waiver attached | 4 |
| Result caption | Read from the document. Compared to a residential requirement set. One gap found. | 13 |
| Micro | Real extraction. Real sample certificate. Nothing stored. | 7 |
| CTA | Run it on my certificates → | 5 |

### §3 V1 — The Diff — 57 words

| Element | Copy | Words |
|---|---|---|
| H2 | What you require. What they sent. | 6 |
| Body | Three states, not two. **Met.** **Gap.** And the one a spreadsheet always gets wrong: **asserted, but not evidenced** — the box is ticked and no endorsement page is attached. | 28 |
| Pull quote | "A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)." | 18 |
| Attribution | — printed on every ACORD 25 | 5 |

The pull quote is the single most valuable sentence available to this page. It is not our claim, it
is the form's own notice, verbatim from
`kb-samples/certificates/Sample-COI-Vendors-08-03-2020.pdf`. It must be typeset as a *quotation of a
document*, in the mono/tabular face, not as marketing copy.

### §4 V2 — The Timeline — 37 words

| Element | Copy | Words |
|---|---|---|
| H2 | Every certificate has a date. Most files have a red one. | 11 |
| Body | Certly watches them all at once — sixty days out, thirty, fourteen, seven, one — and shows you the month ahead instead of the day it went wrong. | 26 |

The rungs are not invented: they are the reminder ladder specified in `KNOWLEDGE_BASE.md` §B.5
(T−60/−30/−14/−7/−1, then T+1 and weekly). Copy and product must not drift apart.

### §5 V3 — The Chase Loop — 41 words

| Element | Copy | Words |
|---|---|---|
| H2 | The chase has already happened. | 5 |
| Body | We email the vendor and the agent named on the certificate, ask for the exact endorsement form, and stop the moment it arrives. One ask per vendor. Pause it any time. | 30 |
| Micro | We never charge your vendors. | 5 |

"One ask per vendor. Pause it any time." directly answers the loudest complaint in the category's
review corpus — "Too many e-mail requests sent to vendors that they get overwhelmed or upset"
([Capterra, myCOI](https://www.capterra.com/p/234580/myCOI/reviews/)). Tense matters: `PERSONA.md`
§2.6 JTBD-A3 is "I want the chase to have *already happened*", not "I want a reminder". The H2 is
that sentence.

### §6 How it works — 47 words

| # | Step | Copy | Words |
|---|---|---|---|
| 1 | Send the certificates | Forward the emails, drop a folder, or import your spreadsheet. | 13 |
| 2 | Set what you require | Start from a template for your property type and change three numbers. | 13 |
| 3 | Read the file | Every vendor in one of three states, dated, and exportable. | 11 |
| | H2 | Three steps, about ten minutes. | 5 |

Step 2's "change three numbers" is the antidote to the buyer's real fear, which `PERSONA.md` §2.8
O-A7 names: "I don't have time to set this up." Note the promise is **three numbers**, not "five
minutes" — five minutes is an unmeasured design target (`identity/CLAUDE.md` assumption A2) and must
not be printed as a claim.

### §7 Proof block — 73 words

| Element | Copy | Words |
|---|---|---|
| H2 | What you can check before you pay us. | 8 |
| Item 1 | Open a real Gap Report. Real form, real numbers, redacted. | 10 |
| Item 2 | Every field shows the words it was read from. | 9 |
| Item 3 | Low confidence is a state we show you, not an error we hide. | 13 |
| Item 4 | How we measure accuracy — and the number, the day we've measured it. | 13 |
| Honesty line | No customer logos yet. No accuracy percentage yet. We won't invent either. | 12 |
| Empty-slot placeholder | This is where our first customer's words will go. | 9 |

**What is allowed in this block, and what is banned.**

| Allowed | Banned |
|---|---|
| The redacted sample Gap Report (a real export from a public sample certificate) | Any testimonial, quote, name, photo or job title of a customer who does not exist |
| A link to a public methodology page: golden-set size, how confidence is computed, what `needs_review` means | Any accuracy percentage — "99%", "highly accurate", "near-perfect", "industry-leading" |
| The count of ACORD 25 samples in the public test corpus, with the date | Any customer logo, "trusted by", "used by N firms", or a fabricated user count |
| Verbatim quotations from the ACORD form and from ISO endorsement forms, with the form number and edition | Any implication that Certly confirms coverage, or that a vendor "is insured" |
| Named export destinations ("export for AppFolio, Buildium, Yardi") **only if** the export genuinely exists | Third-party logos implying a partnership or integration that does not exist |

The empty testimonial slot stays empty and is **visibly reserved** — a bordered placeholder reading
"This is where our first customer's words will go." That is more persuasive than a stock photo and it
is the truth. Copyhackers names social proof as one of five essential elements
([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/)); we
cannot satisfy it honestly, so we substitute artefact proof and say so.

### §8 Guarantee strip — 26 words

| Element | Copy | Words |
|---|---|---|
| H2 | The Lapse Watch | 3 |
| Body | If a certificate we're tracking expires and we didn't warn you first, that month is free. Cancel any time. Thirty days, money back. | 23 |
| Link | What this does and doesn't cover → | (footer link, not counted) |

The linked page carries the carve-outs verbatim from `OFFER.md` §6.1. The carve-outs must be one
click away and plainly written — burying them is what turns a guarantee into a complaint.

---

## 5. The visuals

Five, each specified as a buildable brief. All are **inline SVG in the app's palette**, authored as
components, not images — they must be theme-aware, selectable, translatable and diffable.

### V1 — The Diff *(hero, animated)*

| | |
|---|---|
| **Purpose** | Carry the entire product in one picture: your rule on the left, their document on the right, three states in the middle. |
| **Data shown** | Four requirement rows: **GL each occurrence** ($1,000,000 required / $1,000,000 shown → `met`); **Additional insured, CG 20 10** (required / `ADDL INSD: Y` but no endorsement page → `asserted_only`); **Waiver of subrogation** (required / `SUBR WVD: N` → `gap`); **Expiry** (must be future / 11/14/2026 → `met`). Values from a public sample certificate in `kb-samples/certificates/`, never invented. |
| **The three states, visually** | `met` = filled dot, `--state-met`. `gap` = filled dot, `--state-gap`. **`asserted_only` = half-filled dot, `--state-asserted`** — a distinct third shape, never a shade of the other two. This half-dot is the product's logo-equivalent; it should be reusable at 16px in the app. |
| **Motion** | On scroll into view, once: (1) the four right-hand values fade up from the certificate thumbnail with a 40ms stagger; (2) a connector line draws left-to-right per row, 180ms each; (3) each state dot pops in at the line's end. Total 1.1s. Never loops. |
| **Reduced motion** | `prefers-reduced-motion: reduce` → the final state renders immediately, no connectors animating, no fade. |
| **Dimensions** | Desktop 560×420 in a 12-col grid's right 5 columns. Mobile: 100% width, rows stack as **requirement above / found below** pairs. |
| **Accessibility** | `role="img"` with an `aria-label` naming all four outcomes in words; a visually-hidden `<table>` carrying the same four rows so a screen reader gets the data, not the picture. State is **never carried by colour alone** — dot fill (full / half / full), a text label, and an icon shape all encode it. |
| **Weight** | ≤ 9 KB inline, gzipped. No raster. |

### V2 — The Coverage Timeline *(animated)*

| | |
|---|---|
| **Purpose** | Move the buyer from one certificate to the whole portfolio, and show that Certly sees the month ahead. |
| **Data shown** | 12 horizontal vendor bars (Landscaping, Roofing, Janitorial, Elevator, Plumbing, HVAC, Pest, Snow, Pool, Electrical, Restoration, Security) across a 12-month axis. Each bar is `--state-met` up to its own expiry, then `--state-gap`. Three bars carry the half-fill `--state-asserted` hatch for their whole length — a vendor can be *asserted-only* and *in date* at the same time, which is exactly the insight. |
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
| **Purpose** | Establish domain competence in two seconds with a picture the buyer has read a thousand times, and locate the trap. |
| **Data shown** | The top-left region of a real public ACORD 25 (from `kb-samples/`), redacted to the form's structure. Three callouts: (1) the **`ADDL INSD` / `SUBR WVD` columns**, labelled "two check boxes"; (2) the **DESCRIPTION OF OPERATIONS** free-text box, labelled "where blanket wording hides"; (3) the **notice block**, with its own words pulled out at readable size. |
| **Redaction rules** | Named insured, producer, policy numbers, addresses and any person's name are blacked out at source and the redaction is **flattened into the asset** — never a CSS overlay over readable text. The source file is a public-sector sample, but redact anyway. |
| **Motion** | None. |
| **Dimensions** | 720×420, `object-fit: contain`. |
| **Accessibility** | Long description in a `<figcaption>` that states all three callouts in prose. |
| **Weight** | SVG traced from the form's rules and boxes, ≤ 18 KB. If a raster proves necessary, AVIF ≤ 40 KB with a WebP fallback and explicit `width`/`height`. |

### V5 — The Gap Report *(a real artefact, not an illustration)*

| | |
|---|---|
| **Purpose** | Let the buyer hold the deliverable before paying. This is the substitute for the testimonial we are not allowed to invent. |
| **What it is** | A genuinely generated PDF export: cover line "Gap Report — Sample Portfolio — 3 September 2026", a summary count in the three states, then one page per vendor showing the requirement, the value found, the state, and — critically — **the quoted text the value was read from** (the quote gate, `KNOWLEDGE_BASE.md` §D.3). Page 1 carries the §F.1 disclaimer verbatim. |
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
| Active certificates | 50 | 150 | 400 |
| Everything in the product | ✓ | ✓ | ✓ |
| Per-property requirement sets | — | ✓ | ✓ |
| We import your spreadsheet | — | ✓ | ✓ |
| Seats | 3 | 10 | 25 |
| CTA | Start free | **Start free** | Start free |

**Under the cards, four lines that do the actual selling:**

1. **The metric, defined in one sentence.** "An active certificate is one current certificate per
   vendor, tenant or sub. Renewals never count twice." Without this the buyer assumes a per-document
   meter and prices in a punishment for the exact outcome the product produces (`OFFER.md` §8.1).
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
3. **Above the tiers, no wall.** "More than 400 certificates? It's $0.55 each per month. Email us —
   still no demo." This is the promise the whole page is built on and it must survive the pricing
   block, where every incumbent breaks it.
4. **The free tier, answered rather than avoided** (`PERSONA.md` §7.4). "Some tools track 25 vendors
   free. They'll tell you the date. Start with our free Gap Report instead — it tells you what's
   wrong."

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

### 8.1 Launch design — safe today

- Three chips, three pre-supplied public sample certificates from
  `phase-4-revenue/certly/kb-samples/certificates/`: one that meets a residential requirement set,
  one expired, one with `SUBR WVD: N`.
- On click: the certificate thumbnail renders, the **real extraction runs server-side** against the
  **real requirement template**, and the four V1 rows populate in sequence with the quote-gate text
  visible on hover. One gap is surfaced with its plain-English explanation.
- **Nothing of the visitor's is uploaded, stored or logged beyond an anonymous event.** No account,
  no email, no cookie beyond the analytics one.
- Response budget: first paint of the result **under 1.5s**. Results for the three samples are
  **pre-computed and cached** — a live model call in the hero is a latency risk and an availability
  risk on the one interaction the page depends on. The extraction is real; the *timing* is not left
  to chance.
- Rate limit: 30 runs per IP per hour. Abuse here is cheap to us and expensive to nobody.

### 8.2 Upload variant — phase 2, founder decision required

A stranger's real certificate contains a third party's business details, policy numbers and producer
contact information. Accepting arbitrary uploads with no account means holding other people's data
with no contract and no deletion path.

If the founder wants it after a legal read, the conditions are: PDF only, one file, ≤5 MB, processed
in memory, **deleted within 24 hours**, never used for training, no account created, rate-limited by
IP, and the terms printed **next to the drop zone in body text — not behind a link**. Anything less
than all eight and it does not ship. Flagged as open question 2 in `OFFER.md` §13.3.

---

## 9. Mobile variant

79% of landing-page visits are mobile ([Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)),
while `PERSONA.md` §2.10 establishes that the *work* is desktop and the *question* is mobile. So the
mobile page is not a squeezed desktop page — it is the same argument told in one column, and its job
is to get a Gap Report requested, not to demonstrate a review workflow.

| Change | Detail |
|---|---|
| Hero | Eyebrow, H1, sub, **one** CTA ("Get a free Gap Report"), trust line. The secondary CTA moves into the sticky bar. |
| V1 | Rows stack as *requirement / found* pairs, full width. The half-dot is the first thing on each row so state survives a thumb scroll. |
| V2 | Sweep animation dropped entirely; 12 static rows with a fixed "today" marker. |
| V3 | Ring becomes a 6-step vertical flow. |
| Demo | Chips become a full-width segmented control; result renders beneath, not beside. |
| Pricing | Cards become a vertical stack with **Standard first**, not middle. |
| Sticky bar | Appears after the user passes V1: "From $99/mo · Start free" — 56px, dismissible, safe-area inset respected. |
| Tap targets | ≥ 44 × 44 CSS px, 8px minimum spacing. |
| Type | H1 ≥ 30px, body ≥ 17px, line length 38–42 characters. |
| **Never on mobile** | The annotated ACORD 25 (V4) at full detail — it is unreadable at 390px. Show the notice-block callout alone, with "See the whole form" to the desktop asset. |

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
| — Fonts | ≤ 60 KB | Two faces maximum, WOFF2, self-hosted, subset to Latin + the tabular figures the limits need |
| Third-party requests | **0 on first view** | No CDN fonts, no tag manager, no chat widget. A chat widget on this page would contradict "no sales call" as well as the budget |
| Images below the fold | `loading="lazy"`, `decoding="async"` | |
| Animation | Compositor-only (`transform`, `opacity`, `stroke-dashoffset`) | Never animate layout properties |

---

## 11. Conversion instrumentation

Own `events` table per PLAN.md A14; PostHog key optional and off by default. Every event carries
`session_id`, `variant`, `device`, `referrer_class`, `ts`. **No PII, ever** — no email in an event
payload, no IP stored beyond rate limiting.

| Event | Fires when | What it answers |
|---|---|---|
| `lp_view` | Page interactive | Denominator |
| `lp_scroll_depth` | 25 / 50 / 75 / 100% | Whether the hero earned the scroll (NN/g's condition) |
| `lp_hero_cta_click` | Either hero CTA, with `which` | Which of the dual CTAs works (Poyar's dual-CTA finding, +26%) |
| `lp_demo_run` | Demo chip clicked, with `sample` | **The key metric.** Demo engagement is the proxy for our weakest value-equation term |
| `lp_demo_complete` | Result fully rendered | Did they watch it finish? |
| `lp_demo_to_cta` | CTA clicked within 60s of a demo run | Does the demo convert scepticism? If not, the hero is wrong |
| `lp_visual_view` | Each of V1–V5 ≥50% in viewport ≥1s | Which picture is doing the work |
| `lp_sample_report_open` | Sample Gap Report opened | Artefact proof engagement |
| `lp_pricing_view` | Pricing block in view | Above-pricing funnel completion |
| `lp_plan_select` | Tier card clicked, with `tier`, `interval` | Tier mix and monthly/annual split |
| `lp_faq_open` | Each FAQ, with `id` | A frequently opened FAQ is a hole in the page above it |
| `lp_gap_report_start` / `_submit` / `_delivered` | Free Gap Report funnel | HVCO conversion |
| `signup_start` → `trial_start` → `activated` → `paid` | Product funnel | `activated` = certificate processed **and** template saved **and** one gap surfaced **and** one chase sent (`OFFER.md` §9) |

**Pre-committed numbers, handed to `THRESHOLDS.md`, evaluated at n ≥ 100 sessions:**

| Measure | Benchmark | Certly's line |
|---|---|---|
| Landing → any CTA | SaaS median **3.8%** ([Unbounce](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)) | ≥ 4% or the hero is wrong |
| Demo run rate among scrollers past V1 | no benchmark | ≥ 25%, or the demo is not visible enough to be the proof asset it was built to be |
| Trial → paid | median **8%**, card-required **30%** ([Poyar, n=200](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)) | ≥ 15%; below 8% triggers the Solo-tier review in `OFFER.md` §8.4 |
| "Can we get on a call?" among trials | — | > 33% falsifies the no-demo thesis (`PERSONA.md` §8.2) |

**First three experiments, one variable each, in this order:** (1) hero H1 — chosen vs option 4
below; (2) demo above the fold vs below it; (3) dual CTA vs single. Never two at once.

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
- **Legal:** Terms · Privacy · The Lapse Watch, in full · Do not sell my information

**Legal strip, on every page, verbatim from `KNOWLEDGE_BASE.md` §F.1:**

> **Certly reads documents. It does not verify coverage.** A certificate of insurance is issued as a
> matter of information only and confers no rights on the certificate holder. Certly extracts what a
> document says and compares it to the requirements you entered. It does not confirm that a policy is
> in force, that an endorsement exists, or that coverage would respond to a claim. Only the insurer
> can confirm coverage, and only your own counsel or broker can tell you whether your requirements
> are the right ones.

Plus the CAN-SPAM postal address (shared with outbound, per D4) and the copyright line.

---

## 14. Self-review, and one blocking contradiction for the reviewer

**Word budget:** **395** above pricing against a 450 ceiling — counted mechanically over every copy
string in §4, not estimated. **Passes**, with 55 words of headroom for the microcopy that will
inevitably appear. Any addition above the pricing block must remove an equal number of words.

**Every visual specified as a buildable brief:** V1–V5 each carry purpose, data, states, motion,
reduced-motion fallback, dimensions, accessibility and weight. **Passes.**

**No fake proof:** no testimonial, no logo, no accuracy number, no invented statistic anywhere.
The one number in the hero is a price. **Passes.**

**Felt, not read:** the argument is carried by V1 and the demo; prose is scaffolding. **Passes.**

### The blocking contradiction

`PERSONA.md` §2.5 and §2.9.4 instruct that Certly's status word should be **"Covered"** ("41 of 47
vendors covered"), deliberately chosen over "compliant".
`KNOWLEDGE_BASE.md` §F states, as a binding copy invariant, that Certly "never says *verified*,
*compliant* or **_covered_** as a bare assertion about a policy" and must say "meets your
requirement", "asserted, not evidenced", or "gap".

**These cannot both hold, and the word appears in the product's primary status chip and in the
portfolio summary line — so it is load-bearing, not cosmetic.** This spec follows
`KNOWLEDGE_BASE.md` §F, because that document is the one carrying the liability analysis and because
`OFFER.md` §6.2 L1 identifies exactly this drift — from "we warned you" to "you are covered" — as the
highest-severity liability in the offer. The page therefore says **"meets your requirement"**, and
the portfolio line reads *"As of 3 September 2026, 41 of 47 vendors meet your requirements."*

Referred to the wave-1b reviewer for a ruling. If the ruling goes the other way, exactly three places
change: the V1 state label, the pricing comparison table's row wording, and the portfolio summary
line in §7 item 4 — nothing else in this spec depends on it.
