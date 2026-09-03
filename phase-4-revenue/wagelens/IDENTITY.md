# WageLens — BRAND AND DESIGN IDENTITY (v1)

**Working name:** WageLens. **Recommended name:** **CraftWage** — see §1. *The founder decides
(PLAN.md A3, PREREQUISITES.md P11); everything below is written so that a rename costs one
find-and-replace and one SVG.*
**Category frame:** *the county-and-craft wage lookup that files your certified payroll.*
**Status:** binding for wave 1. Implemented by `design-system.css`, demonstrated by
`identity/samples.html`, applied by `UX.md`.
**Depends on:** `PERSONA.md` (all persona claims and their sources live there and are cited here
as **P§n**). **Author:** Buyer & Identity agent. **Date:** 2026-09-03.
**Amendment rule:** an amendment needs a fetched source and a note of what it supersedes. A
preference is not a source.

---

## 0. The one idea this identity is built on

> **The buyer's problem is not that the form is hard. It is that they cannot tell whether they are
> right.** So the identity's whole job is to make *correctness legible* — the rate, where it came
> from, when we read it, and what changed — on a surface dense enough to hold a real week of
> payroll.

Everything downstream is an implementation of that sentence.

The reasoning is in the persona. The good incumbent's reviews say it takes away **anxiety**
(P§4.3); the bad incumbent's say it is **clunky** and loses data on upload (P§4.3); the buyer's
own public words are *"I end up just lumping prevailing wage and fringe together as one rate"*
(P§1.4) — a compliance failure reported cheerfully by the person committing it. Nobody in this
market is anxious about aesthetics. They are anxious about **being wrong without knowing**.

Two consequences that govern every decision in this file:

1. **Density is a feature, not a debt.** A week of certified payroll is 9 columns × N workers ×
   7 days. An airy, generous, card-based interface would *hide* the week. We build a ruled grid
   and we are proud of it.
2. **Provenance is a first-class visual object.** Every rate carries its wage determination
   number, modification, county, construction type and read date, in a component built for that
   and nothing else (§11.7). We brand the proof.

---

## 1. Naming pass

### 1.1 Method

For each candidate: (a) a WebSearch for an existing company or product in construction, payroll or
compliance; (b) DNS and HTTP evidence for the `.com`. **`dig` is not installed in this sandbox**
(`apt-get` has no network), so the equivalent evidence was collected over DNS-over-HTTPS —
`https://dns.google/resolve?name=<name>.com&type=A|NS` — plus `curl -sI`. The scripts are kept at
`identity/` companion note in `identity/CLAUDE.md` §V6; on a normal machine the command is
`dig +short <name>.com`. **All checks 2026-09-03.**

**Trademark clearance was not possible from here.** `tmsearch.uspto.gov`'s API returns 404 and
`developer.uspto.gov/ds-api` returns 301 to this environment (two attempts each). **A USPTO
search is a founder to-do before the name is used commercially** — it is listed as an open
question in §15.

### 1.2 The candidates

#### Candidate 0 — **WageLens** (keep the working name)

| check | result |
|---|---|
| `wagelens.com` A | `216.198.79.1`, `64.29.17.65` — **registered** |
| `wagelens.com` NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| `curl -sI https://wagelens.com` | `307` → `https://www.wagelens.com/`, then **HTTP 200** |
| what is there | **A live product**: `<title>WageLens - Pay Gap Analysis Tool</title>`, "AI-based pay gap analysis that shows what your HR dashboard misses." |
| category conflict | **Yes, adjacent.** Pay-equity/compensation SaaS. Same word, same broad domain (wages and software), different buyer. |
| verdict | **Reject.** The `.com` is gone to a live product using the identical string in the pay/compensation software category. Every search for our name returns their product. We would be buying SEO ambiguity forever and inviting a trademark argument we cannot win from a standing start. |

*Note for the founder:* WageLens is a good name. It is simply already somebody's.

#### Candidate 1 — **CraftWage** ← recommended

| check | result |
|---|---|
| `craftwage.com` NS | **NXDOMAIN** — the domain is **unregistered** |
| `curl -sI https://craftwage.com` | `000` (no host) — consistent with unregistered |
| WebSearch `"CraftWage" company software` | No company, product or brand found. Results returned unrelated craft-business software (Craftybase, Craft CMS, CraftingSoftware). |
| why it is right | **"Craft" is the buyer's word and the regulator's word.** The lookup is *county × craft*; DOL's own column heading is "Work Classifications"; the trade press and the buyer both say "craft" (P§6). "CraftWage" says the product's whole promise in two syllables: *the wage for this craft*. It stays inside the founder's `Wage*` naming family (WageBridge / WagePilot / WageLine / WageLens) while inverting it, so continuity is preserved. It is spellable over the phone from a truck. It has no meaning in insurance (Certly) or licensing (StateReady), so the three sub-brands do not collide. |
| risks | "Craft" also means artisan/hobby, which is where the search noise lives — mitigated by always pairing the name with the category line on first use. Trademark unverified (§15). |

#### Candidate 2 — **CraftPayroll**

| check | result |
|---|---|
| `craftpayroll.com` NS | **NXDOMAIN** — unregistered |
| `curl -sI` | `000` (no host) |
| WebSearch `"CraftPayroll" OR "Craft Payroll" construction software company` | No company found; results were category listicles naming Foundation, Sage, hh2, eBacon, Rippling, LumberFi |
| why it could win | Maximally literal and therefore maximally findable. Zero explanation cost with P2 and P4, who search for "construction payroll." |
| why it does not | It **claims the wrong category**. We are not a payroll engine and PERSONA §11 records that as an anti-requirement — the buyer keeps QuickBooks/Foundation/Sage. A name that promises payroll invites the one objection we cannot answer ("do you run payroll?") and puts us in a comparison set (ADP, Gusto, Foundation) we lose on features. |

#### Candidate 3 — **ChalkWage**

| check | result |
|---|---|
| `chalkwage.com` NS | **NXDOMAIN** — unregistered |
| `curl -sI` | `000` (no host) |
| WebSearch `"ChalkWage" OR "Chalk Wage" company brand` | No company found. Nearby: Chalk.ai (data platform), Chalk.com (K-12 SaaS), Chalkola (art supplies), Big Chalk (analytics). |
| adjacent check | `chalkline.com` is **live** — Chalkline, an AI casino-promotions platform (HTTP 200, AWS DNS). A different category, but it means the cleanest form of the metaphor is taken. |
| why it could win | The chalk line is the trades' instrument for *snapping a true line before you cut* — a near-perfect metaphor for the product, and warm where the category is cold. Memorable and completely unowned. |
| why it does not | It requires a paragraph of explanation, and this buyer is met at a moment of panic, not of appreciation. The nearest neighbour in name-space is a casino product. **Keep as the reserve if trademark clearance kills CraftWage.** |

#### Also checked and rejected before the shortlist

| name | finding |
|---|---|
| **WageProof** | `wageproof.com` **live** — "Reasonable Compensation Report for S-Corps \| WageProof", a CPA-facing compensation product. Same category space as WageLens's conflict. Reject. |
| **Prevailer**, **PrevailWage**, **WageSmith**, **WageScope**, **WageStamp**, **WageSeal**, **RateWright**, **Wagecraft**, **CraftPay**, **CraftRate**, **CountyRate**, **Snapline**, **PayWeek**, **WageWright** | All `.com` registered; several parked for sale on Afternic / Dan / Atom / Sedo (i.e. purchasable, but a cost and a negotiation). Full log in `identity/CLAUDE.md` §V6. |
| **BondWage**, **WeekWage**, **WageRun**, **CountyWage** | `.com` unregistered, but each is weaker than CraftWage: "bond" collides with surety bonding (a different compliance product), "week"/"run" are generic, "county" narrows to half the promise. |

### 1.3 Recommendation

> **Rename `wagelens` → `CraftWage`.** One word, no space, capital C and W in prose; the wordmark
> is lowercase (§7.4). Acquire `craftwage.com` (unregistered as of 2026-09-03) plus the defensive
> `craftwage.io` / `.app`. Clear it at USPTO before commercial use. **If clearance fails, fall back
> to ChalkWage** (also unregistered, no conflicts found).

**Cost of the rename is deliberately near zero.** The slug `wagelens` stays as the repo directory
and the Vercel project name (PLAN.md A3 says working names are slugs). Every user-visible string
comes from one constant and one SVG. This file uses "WageLens" in its own title so the fleet's
documents stay greppable; product copy examples below use **CraftWage**, and the founder's
decision resolves both.

---

## 2. Positioning — April Dunford's *Obviously Awesome*, run in order

### Step 1 — The customers who would love it

Not a demographic. From `PERSONA.md`: **the office manager at a 5–50-person specialty sub who has
to turn Thursday's payroll into Friday's WH-347 and has never seen the wage determination for the
job** (P§14). She is identifiable by behaviour, not size: she has already paid for, or been forced
into, a certified-payroll tool and found it *"clunky and not intuitive"* (P§4.3).

### Step 2 — Competitive alternatives (what they would do if we did not exist)

Four tiers, and the copy must never collapse them.

**Tier A — the free default, and the true benchmark**

| alternative | cost | why it is real |
|---|---|---|
| An Excel template and the PDF form | $0 | The actual default. DOL publishes WH-347 for exactly this. |
| Their accountant's spare Friday | billed hours | Common at the low end. |
| Not knowing they have to | $0 until the audit | P§7.2 M0: the determination binds *"by operation of law"* whether or not anyone sent it. |

**Tier B — the transparent low-end incumbent**

| alternative | published price | position it owns |
|---|---|---|
| **CertifiedPayrollPro** | $49/mo + $5/report; $99 + $3; $249 + $1; 14-day trial, 3 free reports, no setup | **Cheap, self-serve, transparent.** The most important competitive fact in this file. |

**Tier C — the enterprise compliance platforms (the ones the GC makes them use)**

| alternative | published price | position |
|---|---|---|
| **LCPtracker Pro** | quote only | Owner/agency-side labour compliance |
| **LCPcertified** | $12/report; $145/mo for 5 projects; up to $18,200/yr | The only enterprise vendor with a published contractor price |
| **Points North** | $175/mo + $7.50/report + $995–4,995 setup (ADP Marketplace) | Distribution through ADP; priced by employee count |
| **eBacon** | quote; "from $1,000 per feature" per Software Advice | Fringe trust accounts + service |
| **eMars**, **Elation** | quote | Agency-mandated portals |

**Tier D — the accounting suites that already own the payroll run**

| alternative | position |
|---|---|
| **Foundation**, **Sage 100 Contractor**, **Viewpoint** | Certified payroll as a *feature of payroll*; Foundation markets "America's #1 construction accounting software" |
| **QuickBooks + a plug-in** | Where the small end actually lives, and where the questions get asked in public |

**Decision:** we are positioned against **four** reference points at once. Against **A** we sell
*knowing you are right*. Against **B** we sell *the determination, not just the form*. Against
**C** we sell *the price and the ten minutes*. Against **D** we sell *not replacing them*.
A landing page that only argues against C — the flattering comparison — loses the fight we are
actually in, which is against B and A.

### Step 3 — Unique attributes (Dunford's test: no alternative in Step 2 has it)

**UA1 — Every rate carries its provenance, on screen, before payment.**
WD number, modification, county, construction type, effective date, the date we read it, and a
link to the source on SAM.gov. *Uniqueness check:* the form-fillers (Tier B) start from a rate the
user types. The enterprise platforms (Tier C) validate against rates loaded by the agency. Nobody
shows the sub *where the number came from* as a UI object. This is the attribute the whole visual
system exists to render (§11.7).

**UA2 — The determination archive is versioned, and it tells you when your job's rate moves.**
Modifications happen mid-project and the correct determination applies by operation of law
(29 CFR 5.5(e), P§7.2). *Uniqueness check:* nobody in Tier A–D sells mid-project change alerting
to the *sub*, because their customer is the agency, which already knows.

**UA3 — Published price, self-serve, month-to-month, ten-minute setup.**
*Uniqueness check:* Tier C is quote-gated and annual with setup fees; Tier B already has this, so
against B it is parity, not advantage — which is exactly why UA1 must be visible before payment.

**UA4 (distribution, not product) — we can address 10,295 organisations that are demonstrably on
a covered job right now**, built from USAspending, SAM.gov and four state registers (P§2.2).
Brand-wise this is load-bearing: **the first impression most buyers will form is a cold email that
names their own award.** The voice rules in §4 are written for that surface first and the landing
page second.

### Step 4 — Value themes ("so what?")

| theme | from | in the buyer's words | the word we own |
|---|---|---|---|
| **VT1 — You can see where the number came from.** | UA1 | *"I don't have to take anyone's word for it. The determination is on the screen with the modification and the date."* | **Determination-backed** |
| **VT2 — Nothing moves without telling you.** | UA2 | *"If the rate changes in week nine, I hear about it in week nine."* | **Watched** |
| **VT3 — Friday is twenty minutes, not three hours.** | UA3 | *"I ran payroll, I reviewed the grid, I signed it."* | **The Friday file** |

**Dunford vs Hormozi, resolved.** Hormozi says lead with the dream outcome (Friday back). Dunford
says lead with what only you have (provenance). They pull opposite ways because *Friday back* is a
category-level promise every alternative makes. Resolution, which governs §4 and `LANDING_SPEC.md`:

> **Lead with Friday to earn attention. Show the determination immediately after, to earn the
> price above $49.**

### Step 5 — Who cares a lot

> **Non-union specialty subs, 5–50 field employees, on federal or state prevailing-wage work, with
> no compliance department, who have already been burned once** — by a rejection, a withheld
> payment, or a tool that was *"easy to use when you figure it out."*

They care more than anyone because they sit in a specific gap: big enough that a spreadsheet is
now negligence, small enough that $4,995 of setup is a board decision, and inexperienced enough
that they cannot audit their own answer — which is precisely why *showing the determination* is
worth more to them than to a union shop with a payroll department that already knows the rate.

### Step 6 — Market category

Two frames tested.

**(a) "Certified payroll software" — REJECTED.** Inside this frame the default comparison is
CertifiedPayrollPro at $49, which already owns *cheap, transparent, self-serve*. We would be a $99
version of a $49 thing, differing only in a promise the buyer cannot check before paying.

**(b) "The county-and-craft wage lookup that files your certified payroll" — CHOSEN.** A category
constituted by a bundle nobody ships: *determination lookup with provenance* **+** *versioned
change alerting* **+** *WH-347 generation* **+** *published price*. Changing the category changes
the comparison set, which is the entire point of Step 6. It also makes the free tier coherent:
the lookup is the category's first half, so giving it away is positioning, not discounting.

**Usage rule:** the frame appears in full at least once on every top-level surface, lowercase, as
a description — *"the county-and-craft wage lookup that files your certified payroll"* — not as a
trademark.

### Step 7 — Does it win against each alternative? (approved copy, usable verbatim)

| alternative | the sentence that wins |
|---|---|
| Excel + the PDF | "The form is the easy part. Getting the classification and the fringe right is the part that gets you a withheld payment — so we start from the wage determination, not from a blank form." |
| Not knowing they have to | "The wage determination applies by operation of law, whether or not anybody attached it to your subcontract. Type your county and craft and see yours." |
| CertifiedPayrollPro | "Same transparent price, same no-setup, no-contract terms. The difference is where the rate comes from: ours shows the determination number, the modification and the date we read it, before you pay." |
| LCPcertified / LCPtracker | "If your GC makes you file in LCPtracker, keep filing in LCPtracker — we produce the file it wants. What we add is the rate and the classification you need before the report exists." |
| Points North | "$175 a month plus $7.50 a report plus $995 to $4,995 to start, priced by how many people you employ. Ours is one published price and you can start on a Friday afternoon." |
| Foundation / Sage / QuickBooks | "Keep your payroll where it is. We take your export and give you back the WH-347 and the determination behind every rate." |

### Step 8 — The positioning statement

> **For the office manager and owner of a 5-to-50-person specialty subcontractor on federally
> funded or state prevailing-wage work, who must turn every payroll week into a certified payroll
> and cannot tell whether their classifications and fringe rates are right, CraftWage is the
> county-and-craft wage lookup that files your certified payroll. Unlike form-fillers that start
> from a rate you type in, and unlike enterprise compliance platforms sold to the agency at
> $995–$4,995 of setup, CraftWage starts from the wage determination itself — showing the WD
> number, modification, county and the date we read it beside every rate — and turns your payroll
> week into a WH-347 your prime accepts, at a published price, month to month, set up in ten
> minutes.**

---

## 3. Three identity directions, and the one chosen

Per PIPELINE.md stage 1: three options, each argued **from the buyer's point of view**, then a
decision. Each direction was drafted as a complete system (ground, ink, accent, type, density,
form language), not as a mood.

### Direction A — "The Site Trailer"

**The buyer's point of view:** *"This looks like my tools. Yellow, black, hi-viz, chunky. I trust
DeWalt and Milwaukee."*
**System:** safety yellow/orange on graphite, heavy weights, thick rules, large touch targets,
industrial iconography, photography of jobsites.
**Why it is tempting:** instantly legible as construction; the highest emotional recognition of
the three; strong on a phone.
**Why it was rejected:** three reasons, all from the persona. (1) It is **the wrong register for a
sworn document** — this buyer signs a statement carrying a five-year criminal exposure (P§1.1);
hi-viz reads as *tools*, not as *records*. (2) Hi-viz yellow is already **Foundation Software's**
palette (`#F8C01B` on foundationsoft.com, read from markup) — we would look like a copy of the
incumbent accounting suite. (3) Bold safety yellow as a *brand* colour and amber as a *warning*
colour cannot coexist; the status system would be unreadable.

### Direction B — "The Government Form"

**The buyer's point of view:** *"This looks like the form. It looks official. I know where I am."*
**System:** USWDS-adjacent — Public Sans, federal blue, white ground, generous rules, the WH-347's
own grid logic extended to the whole interface.
**Why it is tempting:** maximum trust transfer from the artefact; the typeface is literally the US
government's; zero explanation cost for provenance.
**Why it was rejected:** it **impersonates the regulator**. We are a private company that says
"here is what DOL published" — dressing as DOL is both a credibility risk and, if the rate is ever
stale, a serious one. It is also visually indistinguishable from a dozen govtech products and from
the state portals the buyer already resents. **We keep its typeface and its contrast discipline
(§7, §6.4) and drop its costume.**

### Direction C — "The Ledger and the Iron" ← **CHOSEN**

**The buyer's point of view:** *"This is a serious record of what I paid, and I can see where
every number came from. It's dense, but it's dense the way my payroll register is dense — and
nothing is hiding."*

**System, in one paragraph.** A **warm bone ground** (not clinical white, not glass) with **warm
near-black ink**, ruled like a payroll register; **iron-oxide brick** as the single brand colour,
reserved for the wordmark, the primary action and the focus ring and *never* used for a status;
**Public Sans** for everything, **IBM Plex Mono** for rates, WD numbers and the rendered
WH-347 — because a payroll form is a typewriter artefact, not a book. Density is deliberate: 36px
table rows, hairline rules, tabular numerals, no card shadows. The only decorative gesture in the
system is a **1px brick rule under the active section**, which is the chalk line.

**Why it wins for this buyer:**

1. **It is the form's own logic, without the costume.** Ruled grid, tabular figures, mono for the
   document — the artefact's language, in a private company's voice (fixes B).
2. **It is warm without being cheerful.** Bone paper and iron oxide are the colours of a ledger and
   a shop. It answers *anxiety* (the word the good incumbent's reviewers use, P§4.3) with
   steadiness rather than with delight.
3. **The brand colour cannot be confused with a status.** Brick is never green/amber/red; statuses
   are always a dot **plus a word** (WCAG 1.4.1). This directly serves the product's core promise.
4. **It survives density.** The one thing the interface must do is show a real week of payroll
   without hiding it. Brick-on-bone with hairline rules has enough contrast at 13px to do that
   (§6.4 proves it numerically).
5. **It is nothing like Clausewright, Certly or StateReady.** See §14.

---

## 4. Tone of voice

### 4.1 The register

**A good foreman explaining a rule he has read, to someone who has to sign for it.** Plain,
specific, unhurried, never chummy, never scolding. He does not say "easy"; he says how long it
takes. He does not say "compliant"; he says which paragraph.

Three fixed properties:

| property | means | test |
|---|---|---|
| **Sourced** | Every regulatory statement names its authority. | Can I click through to the CFR paragraph or the WD? If not, cut it. |
| **Exact** | Numbers, dates, counties, classifications — never "various" or "many". | Would a compliance manager wince? |
| **Unhurried** | No urgency we did not find in the buyer's own calendar. The deadline is Friday; it is theirs, not ours. | Am I inventing pressure, or reporting it? |

### 4.2 Do / don't

| ✅ do | ❌ don't | why |
|---|---|---|
| "Weekly, for every week you do covered work. 29 CFR 5.5(a)(3)(ii)(A)." | "Stay compliant with all applicable regulations." | Exactness is the product. |
| "It applies even if nobody sent you the wage determination." | "Don't risk crippling penalties!" | The fact is stronger than the threat, and it is true. |
| "Three years after the prime contract is completed." | "Keep records for a long time." | The buyer needs the number. |
| "$12.25/.40 — base rate, then fringe. That's how the form prints it." | "Enter total compensation." | The form's own idiom (WH-347 instructions). |
| "Set up your first project in about ten minutes." | "Get started in seconds!" | Ten minutes is a promise we can keep; seconds is a lie the buyer has heard. |
| "We show the determination number, the modification and the date we read it." | "AI-powered compliance intelligence." | Provenance beats intelligence with this buyer; 94% of B2B buyers fact-check AI claims (P§13 S27a). |
| "Your prime rejected week 12. Here's what they flagged." | "Oops! Something went wrong 😕" | No emoji, no cute failure. Money is being withheld. |
| "If your GC makes you file in LCPtracker, keep filing in LCPtracker." | "Replace your outdated compliance stack." | Naming the incumbent respectfully is how you get the meeting. |
| "We can't file the SF-1444 for you — the contracting officer does. We'll get the package ready and track the 30 days." | "Automated conformance filing." | Selling a service we are not a party to would be a lie with legal consequences. |
| "Not legal advice. Verify against the determination in your contract." | omitting it | PLAN.md A10 requires a disclaimer on every screen and document. |

### 4.3 Banned words, inherited from `PERSONA.md` §6.2

"strict liability" · "$13,508 per violation" · "guaranteed compliant" · "audit-proof" ·
"100% accurate" · "AI-powered compliance" · "seamless" · "effortless" · "revolutionise" ·
"easy" as a promise · any success rate, customer count or logo we do not have.

### 4.4 Microcopy patterns

| situation | pattern |
|---|---|
| Empty state | *What this is* → *why it is empty* → *the one action*. "No projects yet. A project is one contract in one county with one wage determination. Add your first — about two minutes." |
| Error | *What happened* → *what it means for the deadline* → *what to do*. Never "unexpected error". |
| Blocking validation | *The rule*, *the citation*, *the fix*. "Fringe can't be inside the base rate. The form prints them separately as `$12.25/.40` (WH-347 instructions, column 6). Split it →" |
| Waiting | Say what is happening and to what. "Reading wage determination WA20250012 Mod 7…" |
| Signing | The consequence, plainly, once. "You're certifying that this payroll is correct and complete, and that everyone was paid at least the rate for the classification of work actually performed. 29 CFR 5.5(a)(3)(ii)(C)." |

---

## 5. Design principles

**P1 — Show the week.** The primary screen is a whole payroll week, visible without scrolling
horizontally on a 1280px laptop. Anything that reduces how much of the week is visible must earn
its space against that.

**P2 — Provenance is a component, not a footnote.** Every rate in the system is rendered by a
component that carries its source. There is no code path that displays a rate as bare text.

**P3 — Colour never carries meaning alone.** Every status is a dot **and** a word. USWDS's own
rule: *"Don't use color exclusively to convey meaning"* (designsystem.digital.gov). WCAG 1.4.1.

**P4 — Errors are prevented at entry, not reported at signature.** The four structural errors in
`PERSONA.md` §7.4 are blocked by the shape of the inputs. Nielsen heuristic #5.

**P5 — The keyboard is the primary input on the grid.** The person doing this has done it before
and is fast. Tab, arrows, Enter, and a visible focus ring that meets 3:1 everywhere (§6.4).

**P6 — Opaque, not translucent.** Nothing in this system is see-through. Data in a compliance
record must not sit on an ambiguous background. (This is also the sharpest possible break from
Clausewright — see §14.)

**P7 — The document looks like the document.** The WH-347 preview reproduces the form's real
column structure and the form's own notations (`$12.25/.40`, `$163.00/$420.00`). It is set in mono
because a payroll form is a typewriter artefact.

**P8 — Every state is designed, especially the boring ones.** Empty, loading, partial, stale,
rejected, and "your determination changed" all have designed treatments (see `UX.md` §6).

---

## 6. Colour

### 6.1 The rationale

Four hues plus one neutral, each with exactly one job.

- **Graphite (warm neutral, hue ≈ 30–40°, very low chroma)** is the substrate: every surface,
  every ink, every rule. Warm rather than cool because the product replaces *paper*, and because
  the sharpest available distinction from Clausewright's cool blue-slate is warmth.
- **Brick (iron oxide, hue ≈ 18°)** is the brand and **only** the brand: the wordmark, the primary
  action, the focus ring, the active-section rule. Iron oxide is the colour of red-lead primer,
  brick and rusted rebar — construction-native without being a safety-vest cliché. **It never
  appears as a status**, which is what makes the status system unambiguous.
- **Filed green (≈ 150°)** means one thing: on file, accepted, verified.
- **Flag amber (≈ 45°)** means one thing: needs review, incomplete, expiring.
- **Reject red (≈ 8°)** means one thing: rejected, error, overdue.
- **Source blue (≈ 208°)** is the *provenance* hue and nothing else: WD citations, source links,
  "read on" dates. Giving provenance its own colour is §0's thesis executed visually — we brand
  the proof, so that when a competitor eventually adds citations we already own the chip.

Brick (18°) and flag amber (45°) are 27° apart and differ sharply in lightness and chroma; §5 P3
prevents any residual confusion, because a status is always a dot *plus a word*.

### 6.2 Primitive ramps — exact values

These are the pigments. **Components never reference them directly**; they reference the semantic
tier in §6.3. The authority for these values is `identity/contrast.py`, which is also what
`design-system.css` is checked against.

**Graphite**

| token | hex | role |
|---|---|---|
| `--wl-graphite-0` | `#FFFFFF` | Card / table surface |
| `--wl-graphite-25` | `#FBF9F5` | **Page canvas**, row stripe |
| `--wl-graphite-50` | `#F6F2EB` | Sunken: table head, inset panel |
| `--wl-graphite-100` | `#EDE8DF` | Draft pill ground, disabled fill |
| `--wl-graphite-200` | `#DED7CA` | **Decorative hairline**; dark-mode secondary ink |
| `--wl-graphite-300` | `#C2B9A9` | Dark-mode tertiary ink |
| `--wl-graphite-400` | `#918776` | **Field border, payroll grid rule (light)** — 3.17–3.54:1 |
| `--wl-graphite-500` | `#7A7166` | **Field border, payroll grid rule (dark)** — 3.69–4.13:1 |
| `--wl-graphite-600` | `#5F574E` | Light tertiary ink — 6.36:1 min |
| `--wl-graphite-700` | `#453F38` | Light secondary ink — 9.88:1 min |
| `--wl-graphite-800` | `#2B2723` | Dark-mode surface-raised; light strong ink |
| `--wl-graphite-900` | `#1B1815` | **Light primary ink — 15.84:1 min**; dark-mode surface |
| `--wl-graphite-950` | `#12100E` | Dark-mode canvas |
| `--wl-graphite-1000` | `#0B0A09` | Dark-mode sunken; ink on brick buttons |

**Brick (brand)**

| token | hex | role |
|---|---|---|
| `--wl-brick-50` | `#FDF3EF` | Selected row, brand-tinted band |
| `--wl-brick-100` | `#FAE2D8` | Brand band border |
| `--wl-brick-200` | `#F3C0AC` | Dark-mode brand band border |
| `--wl-brick-300` | `#E7947A` | **Dark-mode link / hover fill** — 7.50:1 min |
| `--wl-brick-400` | `#D96A48` | **Dark-mode primary fill, focus ring** — 5.14:1 min |
| `--wl-brick-500` | `#C24E28` | Wordmark accent (non-text) |
| `--wl-brick-600` | `#A63C1A` | **Light focus ring, selected edge** — 5.86:1 min |
| `--wl-brick-700` | `#8A3115` | **Light primary fill, light link** — 7.89:1 min |
| `--wl-brick-800` | `#6B2510` | Light primary hover — 11.07:1 |
| `--wl-brick-900` | `#43170A` | Light primary active |

**Status and provenance**

| family | 50 | 100 | 300 | 400 | 600 | 700 |
|---|---|---|---|---|---|---|
| **Filed green** | `#E9F6EE` | `#CDEBDA` | `#5FBF87` | `#2F9E5F` | `#116634` | `#0C4E28` |
| **Flag amber** | `#FDF3D8` | `#F8E4AE` | `#D9A521` | `#B4820F` | `#7A560A` | `#5C4008` |
| **Reject red** | `#FDECEA` | `#F9D2CD` | `#E5766A` | `#CF4436` | `#9C2A1E` | `#771F16` |
| **Source blue** | `#E9F1F8` | `#CFE0EF` | `#6FA5D0` | `#3D80B8` | `#1B5183` | `#143D63` |

*Convention:* `700` = text on the `50` tint (light theme); `600` = the dot / non-text mark;
`300` = text on a dark surface; `50`/`100` = tint and its border.

### 6.3 Semantic tokens — what components actually use

| semantic token | light | dark |
|---|---|---|
| `--wl-canvas` | `graphite-25` | `graphite-950` |
| `--wl-surface` | `graphite-0` | `graphite-900` |
| `--wl-surface-raised` | `graphite-0` | `graphite-800` |
| `--wl-surface-sunken` | `graphite-50` | `graphite-1000` |
| `--wl-row-stripe` | `graphite-25` | `graphite-950` |
| `--wl-ink` | `graphite-900` | `graphite-50` |
| `--wl-ink-2` | `graphite-700` | `graphite-200` |
| `--wl-ink-3` | `graphite-600` | `graphite-300` |
| `--wl-rule-hairline` | `graphite-200` | `graphite-800` |
| `--wl-rule-grid` | `graphite-400` | `graphite-500` |
| `--wl-border-field` | `graphite-400` | `graphite-500` |
| `--wl-brand` | `brick-700` | `brick-300` |
| `--wl-action-fill` | `brick-700` | `brick-400` |
| `--wl-action-ink` | `#FFFFFF` | `graphite-1000` |
| `--wl-focus` | `brick-600` | `brick-400` |
| `--wl-filed-*`, `--wl-flag-*`, `--wl-reject-*`, `--wl-source-*` | `…-700` on `…-50`, dot `…-600` | `…-300` on `surface` |

### 6.4 Contrast certification

Computed by `identity/contrast.py` (kept in the repo; run `python3 identity/contrast.py`, or
`--tsv` for a machine-readable table). **72 pairs, 39 light and 33 dark, all pass.** WCAG 2.1:
4.5:1 normal text, 3.0:1 large text and non-text UI (SC 1.4.11).

**Light theme**

| pair | fg | bg | ratio | need |
|---|---|---|---:|---:|
| Primary ink on canvas | `#1B1815` | `#FBF9F5` | **16.81** | 4.5 |
| Primary ink on surface | `#1B1815` | `#FFFFFF` | **17.68** | 4.5 |
| Primary ink on sunken | `#1B1815` | `#F6F2EB` | **15.84** | 4.5 |
| Secondary ink on canvas | `#453F38` | `#FBF9F5` | **9.88** | 4.5 |
| Tertiary ink on canvas | `#5F574E` | `#FBF9F5` | **6.75** | 4.5 |
| Tertiary ink on table head | `#5F574E` | `#F6F2EB` | **6.36** | 4.5 |
| Brand link on canvas | `#8A3115` | `#FBF9F5` | **7.89** | 4.5 |
| Primary button label | `#FFFFFF` | `#8A3115` | **8.30** | 4.5 |
| Primary button label, hover | `#FFFFFF` | `#6B2510` | **11.07** | 4.5 |
| Filed pill | `#0C4E28` | `#E9F6EE` | **8.84** | 4.5 |
| Needs-review pill | `#5C4008` | `#FDF3D8` | **8.66** | 4.5 |
| Rejected pill | `#771F16` | `#FDECEA` | **9.22** | 4.5 |
| Draft pill | `#453F38` | `#EDE8DF` | **8.51** | 4.5 |
| Source chip (WD citation) | `#143D63` | `#E9F1F8` | **9.80** | 4.5 |
| Rate figure on sunken | `#2B2723` | `#F6F2EB` | **13.28** | 4.5 |
| Field border on surface | `#918776` | `#FFFFFF` | **3.54** | 3.0 |
| Field border on canvas | `#918776` | `#FBF9F5` | **3.37** | 3.0 |
| Payroll grid rule on sunken | `#918776` | `#F6F2EB` | **3.17** | 3.0 |
| Focus ring on canvas | `#A63C1A` | `#FBF9F5` | **6.08** | 3.0 |
| Focus ring, inner, on primary button | `#FFFFFF` | `#8A3115` | **8.30** | 3.0 |
| Focus ring, outer, on canvas | `#1B1815` | `#FBF9F5` | **16.81** | 3.0 |
| Status dot — filed | `#116634` | `#E9F6EE` | **6.35** | 3.0 |
| Status dot — flag | `#7A560A` | `#FDF3D8` | **6.00** | 3.0 |
| Status dot — reject | `#9C2A1E` | `#FDECEA` | **6.64** | 3.0 |
| Selected row edge | `#A63C1A` | `#FDF3EF` | **5.86** | 3.0 |

**Dark theme**

| pair | fg | bg | ratio | need |
|---|---|---|---:|---:|
| Primary ink on canvas | `#F6F2EB` | `#12100E` | **17.01** | 4.5 |
| Primary ink on surface | `#F6F2EB` | `#1B1815` | **15.84** | 4.5 |
| Secondary ink on surface | `#DED7CA` | `#1B1815` | **12.36** | 4.5 |
| Tertiary ink on surface | `#C2B9A9` | `#1B1815` | **9.10** | 4.5 |
| Brand link on surface | `#E7947A` | `#1B1815` | **7.50** | 4.5 |
| Primary button label | `#0B0A09` | `#D96A48` | **5.75** | 4.5 |
| Primary button label, hover | `#0B0A09` | `#E7947A` | **8.40** | 4.5 |
| Filed pill | `#5FBF87` | `#2B2723` | **6.55** | 4.5 |
| Needs-review pill | `#D9A521` | `#2B2723` | **6.60** | 4.5 |
| Rejected pill | `#E5766A` | `#2B2723` | **5.03** | 4.5 |
| Draft pill | `#C2B9A9` | `#2B2723` | **7.63** | 4.5 |
| Source chip (WD citation) | `#6FA5D0` | `#2B2723` | **5.62** | 4.5 |
| Rate figure on sunken | `#F6F2EB` | `#0B0A09` | **17.73** | 4.5 |
| Field border on surface | `#7A7166` | `#1B1815` | **3.69** | 3.0 |
| Payroll grid rule on sunken | `#7A7166` | `#0B0A09` | **4.13** | 3.0 |
| Focus ring on surface | `#D96A48` | `#1B1815` | **5.14** | 3.0 |
| Focus ring, inner, on primary button | `#0B0A09` | `#D96A48` | **5.75** | 3.0 |
| Status dot — filed / flag / reject on surface | `#5FBF87` / `#D9A521` / `#E5766A` | `#1B1815` | **7.82 / 7.87 / 6.00** | 3.0 |

**Two design decisions came out of running the checker, not out of taste:**

1. `graphite-400` moved from `#9C9284` to `#918776`. The original failed at **2.91:1** against the
   warm canvas — the warm ground costs about 5% of contrast versus pure white, and the field
   border is the token that pays for it.
2. **The focus ring is two-tone.** No single ink clears 3:1 against both the bone canvas and the
   brick primary button, so the ring is a light inner stroke plus a dark outer stroke; whichever
   surface it lands on, one of the two carries the contrast. This is why `--wl-focus-ring` in the
   CSS is a two-shadow value and must not be simplified.

**Deliberately not certified, and why:** the *decorative* hairline (`--wl-rule-hairline`) is
exempt under SC 1.4.11 because it only separates blocks that are already separated by spacing and
headings; the **payroll grid rule is a different token** and *is* certified at 3:1, because in the
weekly grid the rule is what tells you which day a number belongs to. Disabled controls are
exempt (1.4.3, 1.4.11). Placeholders are never used as labels, so placeholder contrast is never
load-bearing (§10.2).

---

## 7. Typography

### 7.1 Families — Google Fonts only, two families

| token | family | fallback stack | used for |
|---|---|---|---|
| `--wl-font-ui` | **Public Sans** | `"Public Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | All interface text, headings, labels, buttons, prose |
| `--wl-font-mono` | **IBM Plex Mono** | `"IBM Plex Mono", ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Menlo, Consolas, monospace` | Rates, money, WD numbers, contract numbers, hours, and **the whole rendered WH-347** |

**Why Public Sans.** It is the typeface of the **US Web Design System**, made by USWDS and
licensed **SIL Open Font License 1.1**; its own README describes it as *"A strong, neutral,
principles-driven, open source typeface for text or display"*, based on Libre Franklin, drawing on
*"geometric sans faces of the 20th century, as well as the original Franklins of the 19th"* and
retaining *"its American origin"* (github.com/uswds/public-sans, fetched 2026-09-03). For a
product whose output is a federal form, this is the most defensible typographic choice available:
it carries the register of the artefact without imitating the agency (which is what killed
Direction B). It is metrically close to common system fonts, so the fallback stack degrades
gracefully. **Noted risk:** the repo states the project is *"not currently being actively
developed or maintained"* at v2.001. That is acceptable for a stable, OFL-licensed text face and
is recorded as a known condition, not a surprise.

**Why a mono for the document.** The WH-347 is a *typewriter artefact*: 9 numbered columns, fixed
cells, figures that must align. Setting the rendered form and every rate in IBM Plex Mono does
three jobs at once — it aligns columns without extra CSS, it visually separates *record* from
*interface* (Nielsen #2), and the on-screen form reads as the thing it will become. It is also the
deliberate inverse of Clausewright's "serif for the document" move (§14).

**Loading.** One `<link>` to `fonts.googleapis.com` with `display=swap`, preconnect to
`fonts.gstatic.com`, weights 400/500/600/700 for Public Sans and 400/500/600 for IBM Plex Mono.
Every family has a real fallback stack; the app is fully usable if Google Fonts is blocked.

### 7.2 The scale

Base **15px** (`0.9375rem`). Smaller than a marketing site on purpose: **P1 says show the week**,
and a 9-column grid at 17px does not fit a 1280px laptop. A minor-third-ish progression, whole
pixels at a 16px root, expressed in `rem` so the user's browser setting still scales everything.

| token | rem | px @16 | line-height | tracking | use |
|---|---|---:|---|---|---|
| `--wl-text-2xs` | `0.6875` | 11 | 1.35 | `+0.03em` | Column heads, legal microcopy, "read on" dates |
| `--wl-text-xs` | `0.75` | 12 | 1.4 | `+0.01em` | Pills, chips, table meta |
| `--wl-text-sm` | `0.8125` | 13 | 1.45 | `0` | **Grid cells, table body, dense forms** |
| `--wl-text-base` | `0.9375` | 15 | 1.6 | `0` | **Body. The default.** |
| `--wl-text-md` | `1.0625` | 17 | 1.55 | `-0.005em` | Lead paragraph, the rate readout |
| `--wl-text-lg` | `1.25` | 20 | 1.4 | `-0.01em` | Card and section titles |
| `--wl-text-xl` | `1.5` | 24 | 1.3 | `-0.015em` | Screen headings |
| `--wl-text-2xl` | `1.875` | 30 | 1.25 | `-0.02em` | Page title |
| `--wl-text-3xl` | `2.5` | 40 | 1.15 | `-0.025em` | Landing hero only |

**Weights.** 400 body · 500 UI emphasis, labels, column heads · 600 headings, buttons · 700
wordmark and the rate figure only. No 800/900.

**Numerals.** `font-variant-numeric: tabular-nums lining-nums` on **every** figure — hours, rates,
money, WD numbers. Non-negotiable: a payroll grid whose digits shift width is a grid you cannot
scan down a column, and scanning down the column is how errors are found.

**Measure.** Prose capped at `--wl-measure: 72ch`; help text at `64ch`. The grid is not prose and
is not capped.

### 7.3 Type in the rendered WH-347

Mono at `--wl-text-2xs` / `--wl-text-xs`, 400 weight, tabular. The form's own notations are
reproduced literally, because they are what the buyer and the prime both expect:
`$12.25/.40` for base/fringe, `$163.00/$420.00` for this-project/all-projects (WH-347
instructions, columns 6 and 7).

### 7.4 The wordmark

**`craftwage`** — one unbroken lowercase token, Public Sans **700**, tracking `-0.02em`, in
`--wl-ink`. Lowercase so the mark survives at a 16px favicon and a browser tab label. The only
permitted decoration: at sizes ≥ 24px the terminal **`e`** may take `--wl-brick-500`, and a
**2px brick rule** may sit beneath the mark at its full width — that rule is the chalk line, and
it is the only ornament the identity owns. **No tagline lockup in the app header**; the tagline is
copy, not identity furniture.

---

## 8. Layout, grid and spacing

### 8.1 Spacing — a 4px grid

| token | rem | px | typical use |
|---|---|---:|---|
| `--wl-space-1` | `0.25` | 4 | Icon-to-label, pill padding |
| `--wl-space-2` | `0.5` | 8 | **Grid cell padding**, tight stacks |
| `--wl-space-3` | `0.75` | 12 | Field inner padding |
| `--wl-space-4` | `1` | 16 | Default gap |
| `--wl-space-5` | `1.25` | 20 | Panel inner padding (compact) |
| `--wl-space-6` | `1.5` | 24 | **Panel inner padding (default)** |
| `--wl-space-7` | `2` | 32 | Between panels |
| `--wl-space-8` | `2.5` | 40 | Section gap |
| `--wl-space-9` | `3.5` | 56 | Between major regions |
| `--wl-space-10` | `5` | 80 | Marketing section rhythm only |

Tighter than Clausewright's scale by design: whitespace is a stress intervention for a frightened
seller; **legible density is the stress intervention for a payroll clerk on a deadline.**

### 8.2 Page structure

- **App shell:** fixed left rail (216px, collapses to 56px icons below 1100px), 56px top bar,
  content region with `max-inline-size: 1440px` and `--wl-space-7` gutters.
- **Content grid:** 12 columns, 16px gutter, fluid. Forms use 8 of 12; the payroll grid uses all
  12 and is allowed to overflow horizontally inside its own `overflow-x: auto` container — **the
  page body never scrolls horizontally.**
- **Row height:** 36px in the payroll grid (compact), 44px everywhere else. 44px is the touch
  target minimum and is enforced on every interactive element regardless of visual height, via
  padding or an invisible hit area.
- **The week always fits.** Seven day columns at 44px + name/classification at 200px + rate at
  104px + totals at 88px = 964px, inside a 1280px viewport with the rail collapsed. This
  arithmetic is the reason for the 15px base and the 36px rows.

### 8.3 Radius, border, elevation

| token | value | use |
|---|---|---|
| `--wl-radius-xs` | `2px` | Pills, chips, cells |
| `--wl-radius-sm` | `4px` | Buttons, fields, tabs |
| `--wl-radius-md` | `6px` | Panels, tables, modals |
| `--wl-radius-lg` | `10px` | Marketing cards only |

Small radii on purpose: this is a **ruled document**, not a rounded app. Corners near 2–6px read
as *form*; corners at 20px read as *consumer*.

**Elevation is nearly absent.** Two levels only, and both are borders first:

| token | light | dark |
|---|---|---|
| `--wl-elev-1` | `0 1px 2px rgba(27,24,21,.06)` | `0 1px 2px rgba(0,0,0,.5)` |
| `--wl-elev-2` | `0 4px 12px rgba(27,24,21,.10)` | `0 6px 20px rgba(0,0,0,.55)` |

`--wl-elev-1` is for sticky headers only. `--wl-elev-2` is for modals and popovers only. **Panels
and tables have no shadow** — they have a 1px `--wl-rule-hairline` border. A shadow on a data
table is decoration pretending to be structure.

---

## 9. Iconography, illustration, imagery, motion

### 9.1 Icons

- **20px and 16px, 1.5px stroke, square cap, square join, `currentColor`, no fill.** Square caps
  rather than round: this is a system of rules and edges.
- Drawn on a 24px grid and optically aligned to the cap height of Public Sans.
- **Never colour-only.** An icon may reinforce a status but never carries it alone (§5 P3).
- Named set (the whole inventory the product needs): `project`, `worker`, `week`, `grid`,
  `document`, `determination`, `source-link`, `check`, `flag`, `reject`, `clock`, `upload`,
  `download`, `search`, `filter`, `chevron`, `plus`, `pencil`, `lock`, `signature`, `bell`,
  `help`. Anything outside this list needs a reason.
- **Banned:** filled-circle "success" glyphs with a tick (they read as marketing), duotone,
  gradients, emoji anywhere in product UI.

### 9.2 Illustration and infographics

The system uses **no character illustration**. It uses **diagrams**, and only for things that are
genuinely spatial or procedural:

| diagram | when |
|---|---|
| **The chain** — agency → prime → sub → lower tier, showing where the certified payroll flows and where liability sits | Landing page; the GC tier page |
| **The determination anatomy** — a real WD number decomposed into state, county, construction type, modification, date | Onboarding step 1; help |
| **The week** — a small seven-cell strip showing filed / needs review / rejected across weeks | Dashboard; emails |
| **The rate split** — one bar, two segments, base and fringe, with the `$12.25/.40` notation | Anywhere a rate is explained |

**Rules:** flat, 1.5px strokes, the palette's semantic tokens only, all labels in Public Sans at
`--wl-text-2xs`, inline SVG (no raster, no external requests), every diagram legible at 320px, and
**every diagram works in both themes** because it uses `currentColor` and semantic tokens rather
than hardcoded hex.

### 9.3 Imagery

- **No stock photography of smiling office workers.** None. It is the single fastest way to look
  like the vendors this buyer already distrusts.
- Permitted, in the marketing surface only: **plain photographs of real construction conditions**
  (a jobsite trailer, a time card, a plan table) treated at low saturation on the bone canvas, and
  **never with text over them.**
- The most persuasive image we have is **a real WH-347 with real numbers in it.** Product
  screenshots outrank photography everywhere.
- No hard-hat clip art, no blueprint textures, no gears, no shields, no checkmark-in-a-circle
  badges.

### 9.4 Motion

| token | value | use |
|---|---|---|
| `--wl-dur-1` | `100ms` | Hover, focus, checkbox, pill toggle |
| `--wl-dur-2` | `160ms` | Popovers, row expand, tab change |
| `--wl-dur-3` | `220ms` | Modal and drawer entry |
| `--wl-ease` | `cubic-bezier(.2,0,.2,1)` | Everything |

**Rules.** Nothing animates in the payroll grid except focus and selection — a moving cell is a
cell you cannot read. No entrance animations on data. No skeleton shimmer (it fakes progress);
loading states say what is loading, in words (§4.4). No parallax, no scroll-triggered reveals, no
number count-ups — a rate that animates upward is a rate you cannot trust.
**`prefers-reduced-motion: reduce` sets every duration to `1ms` and disables all transforms.**

---

## 10. Accessibility commitments

1. **WCAG 2.1 AA**, certified numerically in §6.4 by a script kept in the repo and runnable in CI.
2. **Keyboard-complete.** Every action reachable and operable by keyboard; the payroll grid has a
   documented key map (`UX.md` §7). A visible focus ring at ≥3:1 on every focusable element,
   never `outline: none` without a replacement.
3. **No placeholder-as-label**, ever. Every field has a persistent `<label>`.
4. **Colour is never the only signal** (§5 P3).
5. **Tables are real tables** — `<table>`, `<th scope>`, `<caption>` — because the payroll grid is
   tabular data and screen-reader users need the row/column relationship the CFR requires the form
   to preserve.
6. **Errors are announced** via `aria-live="polite"`, associated with their field by
   `aria-describedby`, and never conveyed by red alone.
7. **Target size ≥ 44×44px** for every interactive element, including grid cell controls.
8. **Text scales to 200%** without loss of function; the grid scrolls inside its container rather
   than clipping.
9. **The rendered WH-347 is accessible HTML first**, PDF second — a PDF-only artefact would be a
   dead end for assistive technology.

---

## 11. Component inventory

Every component below exists in `design-system.css` and is rendered in `identity/samples.html`.

### 11.1 Buttons — `.wl-btn`

| variant | fill | ink | use |
|---|---|---|---|
| `.wl-btn--primary` | `--wl-action-fill` (brick-700 / brick-400) | `--wl-action-ink` | **One per screen.** "Generate WH-347", "Sign and file". |
| `.wl-btn--secondary` | `--wl-surface` + 1px `--wl-border-field` | `--wl-ink` | "Save draft", "Add worker" |
| `.wl-btn--ghost` | none | `--wl-brand` | Inline, tertiary |
| `.wl-btn--danger` | `--wl-reject-600` | `#FFF` | Delete a project. Confirmation required. |
| sizes | `--wl-btn-sm` 32px · default 40px · `--wl-btn-lg` 48px | | all with ≥44px hit area |

States: hover (fill darkens one step / lightens in dark), active (two steps), focus (two-tone
ring), disabled (graphite-100 fill, graphite-400 ink, `cursor: not-allowed`, `aria-disabled`),
loading (label replaced by a word — "Generating…" — never a spinner alone).

### 11.2 Inputs — `.wl-field`

Label above (500, `--wl-text-xs`, `--wl-ink-2`), control, help text below (`--wl-text-2xs`,
`--wl-ink-3`), error text replacing help in `--wl-reject-700` with a `flag` icon. 1px
`--wl-border-field`, `--wl-radius-sm`, 40px tall, mono for any numeric field. Variants: text,
number, currency (mono, right-aligned, prefixed `$`), select, date (week-ending picker), search
(with the county/craft typeahead), textarea, checkbox, radio, toggle.

**Two specialised fields the domain requires:**

- **`.wl-field--rate`** — a *paired* control that renders as one visual field split by a `/`,
  capturing **base** and **fringe** separately. It is physically impossible to type a combined
  rate. This component exists solely to prevent `PERSONA.md` §7.4 error 1.
- **`.wl-field--classification`** — a typeahead that searches only the classifications *on this
  project's determination*, shows the rate beside each, and offers "not listed → check
  conformance" as the last option rather than as free text.

### 11.3 The payroll grid — `.wl-grid`

The centre of the product. A real `<table>`.

- Sticky header row and sticky first two columns (worker, classification).
- Columns: Worker · Classification · S M T W T F S (ST/OT) · Total · Rate (base/fringe) · Gross ·
  Deductions · Net.
- **36px rows**, 13px mono figures, tabular numerals, `--wl-rule-grid` 1px between day columns,
  `--wl-rule-hairline` between rows, `--wl-row-stripe` on even rows.
- A cell in error gets a 2px left edge in `--wl-reject-600` **and** an icon **and** a message in
  the row's detail drawer — never a red background alone.
- Selected row: `--wl-brick-50` fill with a 2px `--wl-brick-600` left edge.
- **Keyboard:** arrows move, Enter opens the cell editor, Tab advances within the row, Esc
  reverts, `Ctrl/⌘+D` fills down the column, `Ctrl/⌘+Enter` saves the week. Documented in
  `UX.md` §7 and shown in a `?` overlay.
- Column totals in a sticky footer row, always visible, 600 weight.

### 11.4 Status pill — `.wl-pill`

`<span>` with a 6px dot, a label, `--wl-radius-xs`, 11px 500 uppercase-ish tracking. **Dot plus
word, always.**

| status | dot | ink | ground |
|---|---|---|---|
| Filed | `filed-600` | `filed-700` | `filed-50` |
| Needs review | `flag-600` | `flag-700` | `flag-50` |
| Rejected | `reject-600` | `reject-700` | `reject-50` |
| Draft | `graphite-500` | `graphite-700` | `graphite-100` |
| Not started | none (hollow ring) | `graphite-600` | transparent + hairline |

### 11.5 Alert / banner — `.wl-alert`

Full-width inside its container, 3px left edge in the status `600`, `50` ground, `700` ink, icon,
title (600), body, and at most one action. Four kinds: info (source blue), success (filed),
warning (flag), error (reject). Dismissible only when informational — a compliance warning cannot
be dismissed, it can only be resolved.

### 11.6 Document preview — `.wl-doc`

The rendered WH-347. White page on `--wl-surface-sunken`, a real 1px `--wl-rule-grid` table
reproducing the form's 9 columns, all mono, page-proportioned (`aspect-ratio` of US Letter
landscape), with a **toolbar** (zoom, download PDF, print, "what changed since last week") and a
**dated disclaimer strip** at the foot. In dark mode the *page stays white* — a document preview
must show what will print. This is the one deliberate exception to the dark-mode policy (§12).

### 11.7 Source chip and provenance block — `.wl-source`, `.wl-prov`

**The signature component of this identity.** `.wl-source` is a small inline chip in the source
blue family carrying a WD number: `⧉ WA20250012 · Mod 7`. It is a link. `.wl-prov` is its expanded
form, used beside every rate:

```
General Decision WA20250012 · Modification 7
Pierce County, WA · Building construction
Effective 2026-08-15 · read by CraftWage 2026-09-02
ELECTRICIAN   $54.12 base  /  $28.90 fringe
                                     View on SAM.gov ⧉
```

Rules: it never renders without a date; if the read date is more than 7 days old the chip gains a
`flag` dot and the word "recheck"; if the determination has been modified since we read it the
chip turns to the reject family and the rate is not usable until reconfirmed. **No rate is ever
displayed outside this component** (§5 P2).

### 11.8 Others

| component | note |
|---|---|
| `.wl-panel` | 1px hairline border, `--wl-radius-md`, `--wl-space-6` padding, optional header row with a title and one action. No shadow. |
| `.wl-tabs` | Underline tabs; the active tab carries a 2px `--wl-brick-600` rule (the chalk line). |
| `.wl-table` | The generic table: projects, workers, submissions. 44px rows, sortable headers, empty state built in. |
| `.wl-empty` | Icon, title, one sentence of what-this-is, one primary action. |
| `.wl-week-strip` | Seven-to-fifty-two small cells, one per week, coloured by status; the fastest read of "where am I?" |
| `.wl-stat` | A figure in mono 700 with a label above in 11px — used for "weeks filed", "workers", "open flags". Never more than four in a row. |
| `.wl-toolbar` | Sticky, 48px, `--wl-elev-1`, holds filters and the primary action. |
| `.wl-disclaimer` | 11px, `--wl-ink-3`, a top hairline, always carries a date. Required on every rate and every document (PLAN.md A10). |
| `.wl-signature` | The Statement of Compliance block: the three certifications in full, a typed-name field, a checkbox, the date, and the 18 U.S.C. 1001 notice. Deliberately slow. |

---

## 12. Dark mode policy

**Dark mode ships at v1 and is not an afterthought**, for one evidence-backed reason: this
interface is used late on Friday, and the buyer's own review corpus says the office is often not
an office (P§10).

- **Mechanism.** `:root` carries the complete light palette. `@media (prefers-color-scheme: dark)`
  guarded as `:root:not([data-theme="light"])` redefines *only the semantic tokens*.
  `:root[data-theme="dark"]` redefines them again so an explicit toggle wins in both directions.
  No colour is defined only inside a media query. `body` always paints an explicit token
  background.
- **Dark inks are authored, not inverted.** `--wl-ink` in dark is `#F6F2EB`, never `#FFFFFF`:
  pure white on a near-black warm ground buzzes.
- **Brick lightens for dark** (`brick-700` → `brick-300` for text, `brick-400` for fills) and the
  action ink flips to `--wl-graphite-1000`, because dark text on a lighter brick is the only way
  to keep a 4.5:1 button label (5.75:1, §6.4).
- **The document preview stays white** (§11.6). A WH-347 previewed dark would misrepresent what
  prints and what the prime receives. The surrounding chrome is dark; the page is paper.
- **Printing always uses the light palette**, forced in a `@media print` block, plus: no rail, no
  toolbar, black rules, and the disclaimer retained.
- Both themes are certified in §6.4. A token that passes in one theme and not the other is a bug,
  not a trade-off.

---

## 13. What to borrow, and what to avoid, from the tools this buyer already trusts

Observations below were read from each site's own live markup or its design-system site on
**2026-09-03**, except where marked *secondary* (the site refused this environment on two
attempts and a third-party brand reference was used instead — recorded as assumption A7 in
`PERSONA.md` §12).

| product | what was observed | **borrow** | **avoid** |
|---|---|---|---|
| **QuickBooks** (quickbooks.intuit.com) | Brand green `#2CA01C` in the logo SVG; clean modern sans; generous whitespace; heavy use of customer photography and testimonial portraits; rounded-rectangle CTAs | The **plainness of the language** and the assumption that the reader is a business owner, not a technologist | The **photography-led marketing surface** and the consumer-grade whitespace. Also: never green — it is QuickBooks's, and in our system green means *filed*. |
| **Procore** (procore.com; core.procore.com) | Warm neutral ground `#F5F1ED` / `#ECE0D6` / `#D4CAC1`, ink `#595552`, accent `#FF5200`; design-system site uses `Inter,Noto,Arial,sans-serif`, `#006DDF`, `#E36937`, ground `#F1F3F3` | The **warm neutral ground** — Procore proved a construction audience reads warm neutrals as premium and serious, and it is the strongest available argument against defaulting to cool grey | Their **orange**: `#FF5200` is Procore's, it is the most recognisable colour in construction software, and copying it makes us look like a Procore add-on. Our brick is darker, redder and used at a tenth of the surface area. |
| **Foundation Software** (foundationsoft.com) | `#F8C01B` yellow, `#0C92D0` blue, `#254E77` navy, `#535353` grey | The **information density** of a construction accounting product — Foundation's users tolerate, and expect, a lot of numbers on one screen | The **yellow-and-blue combination** (this is what killed Direction A) and the dated chrome. Independent reviews describe the interface as "dated" with a "steep learning curve without formal training." |
| **LCPtracker** (lcptracker.com) | `#426BAE` blue, `#007CBA` / `#006BA1` link blues *(most other hexes on the page are WordPress/Gutenberg defaults and are **not** brand colours)* | The **vocabulary**: their product names and labels are the words the agency uses, and our labels should match the words the prime uses | The **portal aesthetic** and the enterprise-blue default. Their reviewers' complaints are about upload and revision loops, not colour — the lesson is behavioural, not visual. |
| **ADP** *(secondary — adp.com returned 403 to both curl and WebFetch on two attempts; described from WebFetch's rendered reading plus third-party brand references, ADP red commonly given as `#D0271D`)* | Corporate blue/white/charcoal, card-based, illustrated pictograms, product screenshots in device mockups, rounded CTAs | The **marketplace listing discipline**: ADP's marketplace page publishes Points North's exact price, tiers and setup fee. That page is why we can be specific about a competitor — and it is the standard our own pricing page should meet | The **enterprise card grid** and pictogram illustration. Our buyer distrusts anything that looks like it was made for a company with an HR department. |
| **Buildertrend** *(secondary — buildertrend.com returned 403 on two attempts; brand references give navy `#001a43` and teal `#00d8d8`)* | Navy + teal + warm accents after a 2023 rebrand | The **confidence to be a distinct colour** in a category of blue | Teal and navy specifically; and their residential-builder warmth, which is the wrong register for a sworn document |
| **Sage** *(blocked — sage.com 403; design.sage.com refused by the egress proxy)* | not observed | — | — (no claim made) |
| **USWDS** (designsystem.digital.gov) | Grade-based colour tokens, the "magic number" contrast rule (40+ = AA large, 50+ = AA), *"Don't use color exclusively to convey meaning"* | The **contrast discipline** and Public Sans (§7.1). This is the borrow with the highest value in the whole table. | The **federal costume** — the flag banner, the official blue, the .gov furniture. We cite the regulator; we do not dress as one. |

**The synthesis in one line:** *Procore's warmth, Foundation's density, USWDS's rigour, QuickBooks's
plain speech — and none of their colours.*

---

## 14. Distinctness check

| product | its identity | how WageLens/CraftWage differs, concretely |
|---|---|---|
| **Clausewright** (phase 2) | Translucent "liquid glass" material; cool blue-slate (215°) base with recovery green (158°) accent; **system fonts, no webfonts**; 17px base; 20px card radii; generous 96px section spacing; **serif for the quoted document** | **Opaque throughout** (§5 P6, no translucency anywhere); **warm** graphite (30–40°) with **brick** (18°); **Google webfonts**, Public Sans + IBM Plex Mono; **15px base**; **2–6px radii**; tighter 4px-grid spacing; **mono for the document**. There is no token, hue, typeface, radius or material shared between the two systems. |
| **Certly** (insurance / COI, sibling app) | Not yet authored at time of writing | Our reservation: **brick 18° + warm bone ground + mono document**. Certly's domain (ACORD 25 certificates, property, insurance) naturally reaches for blues and greens; the phase-4 orchestrator should hold 18° and the warm-neutral ground for WageLens and allocate a different hue family to Certly. Flagged in §15. |
| **StateReady** (multi-state trade licensing, sibling app) | Not yet authored | Same reservation, plus a structural difference: StateReady's core object is a **map/jurisdiction matrix**; ours is a **week grid**. If both end up warm-neutral the differentiator must be hue and form language, and ours is claimed here first with the date. |

---

## 15. Open questions for the founder, and assumptions

**Open questions** (repeated from `PERSONA.md` §12 where they overlap):

1. **Approve the rename to CraftWage?** `craftwage.com` was unregistered on 2026-09-03 and no
   conflicting company was found; **WageLens.com is taken by a live pay-equity product**, which is
   the binding fact. Reserve/register the domain before the name is used publicly.
2. **USPTO clearance for CraftWage** (and the reserve, ChalkWage) — **not possible from this
   environment**; both USPTO APIs refused. This is a founder or counsel task, and it should happen
   before the domain is used commercially.
3. **Hue allocation across the three apps.** WageLens claims brick 18° + warm bone. Certly and
   StateReady are being authored in parallel by other agents; the orchestrator should arbitrate if
   two of the three land in the same family.
4. **Does the GC tier get its own visual treatment?** It is the same product with a roll-up; the
   recommendation is *no separate identity*, only a different information architecture.
5. **Dark mode at launch: confirmed?** It costs perhaps 4% of front-end effort given the token
   structure, and the evidence for it is weak-but-real (Friday-evening use). Cheap to keep, cheap
   to drop.

**Assumptions recorded** (PIPELINE.md stage 4):

| # | assumption | basis | how to kill it |
|---|---|---|---|
| B1 | Warm-neutral + brick reads as "serious record" rather than "retro" to this buyer. | Procore's warm neutral ground is the closest observed precedent in the construction category; the rest is design judgment. **Hypothesis, not evidence.** | Put `identity/samples.html` in front of five office managers; ask what kind of company made it. |
| B2 | 15px base with 36px grid rows is comfortable for a full payroll day. | Derived from the arithmetic in §8.2, not from testing. | Watch time-on-grid and zoom usage in the first ten accounts. |
| B3 | Mono for the rendered form reads as *official* rather than *unfinished*. | The WH-347 is a fixed-column artefact and mono aligns it for free. Judgment. | Same test as B1, asking specifically "does this look like the form you file?" |
| B4 | Public Sans's maintenance status (v2.001, not actively developed) is acceptable. | It is a stable OFL text face served by Google Fonts; the fallback stack is metric-compatible. | Only a concern if Google Fonts drops it; the fallback already covers that. |
| B5 | ADP's and Buildertrend's brand colours as quoted in §13 are correct. | **Secondary sources only** — both sites refused this environment twice. | Re-read from a browser before any comparative visual claim is published. |

---

## 16. Sources

Fetched **2026-09-03**. Persona sources are in `PERSONA.md` §13 and are not repeated.

| what | url |
|---|---|
| Public Sans — typeface, licence, design goals | https://github.com/uswds/public-sans |
| USWDS colour tokens, grades, magic-number contrast rule, "don't use color exclusively" | https://designsystem.digital.gov/design-tokens/color/overview/ |
| Google Fonts CSS API (Public Sans, IBM Plex Mono — both confirmed HTTP 200) | https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400..700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap |
| Procore — warm neutral ground and accent, read from live markup | https://www.procore.com/ |
| Procore design-system site — Inter, `#006DDF`, `#E36937` | https://core.procore.com/ |
| Foundation Software — `#F8C01B`, `#0C92D0`, `#254E77`, read from live markup | https://www.foundationsoft.com/ |
| Foundation Software payroll product claims | https://www.foundationsoft.com/software/payroll/ |
| LCPtracker — `#426BAE`, `#007CBA`, read from live markup | https://lcptracker.com/ |
| LCPcertified published pricing | https://lcptracker.com/solutions/lcpcertified/ |
| QuickBooks — brand green `#2CA01C` in the logo SVG | https://quickbooks.intuit.com/ |
| Points North pricing on the ADP Marketplace | https://apps.adp.com/en-us/apps/253943/points-north-certified-payroll-reporting-for-run-powered-by-adp/configure |
| 29 CFR 5.5 (weekly CPR, Statement of Compliance, conformance, prime liability, operation of law) | https://www.ecfr.gov/api/renderer/v1/content/enhanced/2026-09-01/title-29?part=5&section=5.5 |
| WH-347 instructions — columns, `$12.25/.40`, `$163.00/$420.00`, 55-minute burden, 18 U.S.C. 1001 | https://www.modot.org/sites/default/files/documents/Instructions%20For%20Completing%20Payroll%20Form%20WH-347%20_%20U.S.%20Department%20of%20Labor.pdf |
| Name checks — DNS/HTTP evidence and the live sites at wagelens.com, wageproof.com, chalkline.com | recorded in `identity/CLAUDE.md` §V6 with the exact commands |
| Contrast certification | `identity/contrast.py` (run it; `--tsv` for the table) |

**Blocked on two attempts and abandoned:** adp.com (403), buildertrend.com (403), sage.com (403),
design.sage.com (egress proxy refusal), tmsearch.uspto.gov API (404), developer.uspto.gov ds-api
(301). Logged in `identity/CLAUDE.md`.
