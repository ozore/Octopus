# StateReady — IDENTITY

**Product:** StateReady — *licence, CE, bond and insurance readiness for multi-state trade contractors*
**Implementation:** `design-system.css` (this directory) · samples at `identity/samples.html`
**Contrast proof:** `identity/contrast.py` — run it; it exits non-zero if any declared pair fails.
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Depends on:** `PERSONA.md` (binding), `../PLAN.md` (D1–D5, A1–A14), `../PIPELINE.md`.
**Status:** binding for the wave-2 build. Amendments require a named source and a note of what they supersede.

---

## Arbitration 2026-09-03

`../IDENTITY_ARBITRATION.md` (Brand Director, 2026-09-03) is binding on the visual layer of all three
phase-4 apps and takes precedence over this document where the two disagree. **This document has been
brought into line with it.**

§5.1 of this file predicted the problem and asked for exactly this: *"Action for the orchestrator:
re-check for collision once all three `IDENTITY.md` files exist."* When they existed, all three had
independently chosen **Public Sans + IBM Plex Mono on a warm paper ground**, and the three grounds
measured **ΔE76 0.35 to 2.42** apart — StateReady's `#FAF8F4` and WageLens's `#FBF9F5` were, at ΔE 0.35,
literally the same paper. Assumption A5 in `identity/CLAUDE.md` is now resolved.

**What changed, and where to read the reasoning**

| | was | is | why (arbitration §) |
|---|---|---|---|
| UI typeface | Public Sans | **Barlow** | Public Sans went to WageLens, the only app whose output artefact is a US federal form. Barlow is a low-contrast grotesk drawn from **American public and transport signage** — the right lineage for a product about crossing a state line. §3.1 |
| signage face | — | **Barlow Condensed** | new. The condensed cut goes where signage goes: state tiles, column heads, runway lane labels, eyebrows. §3.1 |
| mono | IBM Plex Mono | **Overpass Mono** | descends, through Overpass, from **Highway Gothic** — the US Federal Highway Administration lettering. Licence numbers and CE hours are now set in the family that already labels the road. §3.1 |
| default theme | light, warm paper `#FAF8F4` | **the board**: a deep graphite-green `#181D1A` | this is the only app in the fleet whose hero object is **not a document** — it is a tile map and a runway, a board of states and a clock. "The status ramp *is* the palette" is at full strength as a luminous ramp on a deep ground and was muted on bone. §3.2 |
| alternate theme | dark `#12100E` (identical to WageLens's dark canvas) | **paper**, re-toned to a cool stone `#E9ECE8` | paper keeps the job it was load-bearing for: **everything that leaves the building.** §3.2 |
| status ramp | 145 / 33 / 0° on pale warm tints | **155 / 31 / 355°, luminous on deep fills** | the siblings' greens, ambers and reds sat within a few degrees. Minimum separation across the fleet's nine chromatic statuses is now 8.1°. §3.4 |
| row height | 44px | **48px** — the roomiest of the three | the three apps ladder at 36 / 44 / 48px so a screenshot of one cannot be mistaken for another. §3.5 |
| shell | fixed 240px left rail | **top bar over a full-width board** | both siblings run left rails. §3.5 |
| shadow | three levels | **none on any resting surface**; the sheet is the only shadow | on a board a shadow does nothing; separation is a value step plus a hairline. §3.5 |
| token name | `--sr-paper` | **`--sr-ground`** | the token is the page ground, and on the default theme that ground is not paper. |

**The rule that makes the dark default work, and it is a design idea rather than a hedge:**

> **The board is for the operator. Paper is for the forwarder.**

`PERSONA.md §9` requires every artefact to be forwardable to someone who has never logged in. The paper
theme is what those artefacts use — print, the bid-package PDF, the shareable readiness link, every alert
email — and it is also what a viewer who has asked their OS for a light interface gets. Status hues are
identical in both themes; only lightness moves, so a coordinator switching themes mid-task never
re-learns the map.

**What did not change:** the tile grid, the runway and its 90/60/30/7 gates, the provenance line, the CE
meter, the refusal state, `forced-colors` support, print, **no blue at any weight**, no translucency, no
`backdrop-filter`, no document hero, and every word of §2's positioning and §4's tone.

**Open point for the founder.** The dark default is the largest visible change in the fleet and its
buyer-familiarity argument is the weakest of the arbitration's (StateReady's incumbents are light, though
ServiceTitan ships dark chrome values in its own markup). It is driven primarily by mutual distinctness,
which is the founder's binding requirement. **If the founder wants StateReady light, it is a one-line
token swap plus a regenerated samples file — the paper theme is already fully authored and certified.**
Recorded in `../IDENTITY_ARBITRATION.md §9.1`.

Enforced by `../scripts/identity-distinctness.py`, which parses the three `design-system.css` files and
fails if two apps share a font family or two grounds are too close. It must exit 0 in CI alongside
`identity/contrast.py`.

---

## 0. The one idea this identity is built on

> **The buyer's question is not "what is my compliance status". It is "where can I legally work
> tomorrow, and what breaks first". Both are questions about a map and a clock. So the identity is a
> map and a clock, and colour is spent entirely on answering them.**

That sentence has three hard consequences, and everything below is an implementation of them.

1. **The status ramp is the palette.** There is no separate brand hue competing with green / amber /
   red. Buttons are ink. Links are ink. Chrome is the board. The only saturated colour on any screen is
   the answer to "am I ready?" This is unusual, and it is the point: in a field-service category where
   every competitor paints its chrome blue (§5), a product whose chrome is *colourless* reads as an
   instrument rather than as a brand. **On a deep board that rule is at full strength**, because a
   luminous green, amber or red is the only thing on screen with light in it.
2. **Colour never carries meaning alone.** Every status also has a glyph and a word, because WCAG
   1.4.1 requires it and because roughly one man in twelve has a colour-vision deficiency — and this
   product's user base is overwhelmingly male trade office staff. A red/green pair as the *only*
   distinction between "lapsed" and "ready" would be a defect, not a style choice.
3. **Nothing decorative may be more salient than a deadline.** No hero photography, no gradient
   meshes, no illustration of smiling technicians. `PERSONA.md §2.4` says the coordinator has five
   minutes; the interface spends all of them on the answer.

---

## 1. Naming pass

`PLAN.md` A3 and `PREREQUISITES.md` P11: the working slug stands until a naming pass recommends and
**the founder decides**. This section recommends. It does not decide.

### 1.1 Method and its honest limit

Three checks were run on every candidate: **(a)** DNS resolution via `python3 socket.gethostbyname`
(the container has no `dig` — see `identity/CLAUDE.md`), **(b)** `curl -sIL` for HTTP status and final
URL, both wrapped in **`identity/check-domains.sh`** so the founder can re-run them, and **(c)** a web
search for existing commercial use.

**The limit, stated plainly: no trademark search was performed.** `tmsearch.uspto.gov` and
`assignment-api.uspto.gov` returned 405 / empty from this container across two attempts
(`identity/sources.md` row 48). **A knock-out search at tmsearch.uspto.gov is a founder prerequisite
before any spend on a name**, and nothing below should be read as clearance.

### 1.2 "StateReady"

| Check | Result |
|---|---|
| `stateready.com` | Registered. Resolves to `192.64.119.162`; `http://` 302 → `www.` → **a Namecheap parking lander** that renders the Namecheap Market widget (`lander.parity.domains`). Last-Modified 30 Jul 2026. **Registered but for sale; acquisition cost unknown.** |
| `stateready.io` / `.app` / `.co` | **NXDOMAIN — all three unregistered.** |
| `getstateready.com` | **NXDOMAIN — unregistered.** A $12 launch domain if the founder does not want to negotiate for the exact match. |
| Existing commercial use | A web search for `"StateReady" company software brand` returned **no company of that name**. Nearest neighbours are unrelated: GuestReady, SiteReady, InfoReady. |
| Naming-adjacency risk | **`StormReady®` is a registered trademark of the National Weather Service** — the logo registered 15 Jan 2002 and the name 26 Mar 2002 ([weather.gov](https://www.weather.gov/mob/stormready)) — and DHS/FEMA runs the `Ready.gov` campaign. Different class of goods (a government preparedness programme, not B2B SaaS) so unlikely to block, but a `-Ready` name in a US regulatory context sits next to federal programme branding. **Flag for the founder's lawyer, not a blocker on our reading.** |
| Distinctiveness | **Weak.** "State ready" is close to descriptive, which usually means a harder registration and a narrower scope of protection. |

### 1.3 Three alternatives, checked the same way

**Alternative A — `LicenseAtlas`**

| Check | Result |
|---|---|
| Domains | **`licenseatlas.com`, `.io` and `.app` are all NXDOMAIN — unregistered.** Zero acquisition cost. |
| Existing use | **A collision exists.** "LicenseAtlas", a license explorer for software, data and AI-model licences, was shared publicly on discuss.opensource.org roughly five weeks before this search. Different market, non-commercial, but the same two words in a software context. |
| Fit | **Excellent.** An atlas *is* the product: a book of maps, one per jurisdiction. It hands the visual identity (§6) its own name. |
| Risk | **The `License___` prefix is the most crowded namespace in this exact category** — LicenseLogix, LicensedTrades, LicenseHQ, LicenseRoadmap, LicenseSuite, LicensePro. Adopting it means competing for recall inside our nearest competitor's naming family. |

**Alternative B — `RenewalMap`**

| Check | Result |
|---|---|
| Domains | **`renewalmap.com` NXDOMAIN — unregistered.** |
| Existing use | No commercial use surfaced. |
| Fit | Names the map and the clock in one word, and uses the buyer's own noun ("renewal", "renewal window" — `PERSONA.md §7`). |
| Risk | **Narrow.** It describes the tracker and says nothing about bonds, insurance, the qualifier clock or the expansion report — i.e. it names one of the two revenue lines. |

**Alternative C — `StateSheet`**

| Check | Result |
|---|---|
| Domains | **`statesheet.com` NXDOMAIN — unregistered.** |
| Existing use | No commercial use surfaced. |
| Fit | A deliberate joke the buyer will get instantly: it is the state sheet they already keep, except it maintains itself. `PERSONA.md §2.2` establishes the shared Google Sheet as the true incumbent. |
| Risk | "Sheet" may read as *template* rather than *product*, and it undersells the expansion report. |

**Also available and rejected, recorded so nobody re-checks them:** `lapseguard.com` (fear-framed;
covers half the product), `statecovered.com`, `standingclear.com`, `licensemap.io/.app`
(`.com` taken), `qualifiedin.com`.

**Rejected on availability:** `Good Standing` — conceptually the strongest name in the file, because
it is the regulator's own phrase (CSLB requires *"an active license in good standing for the previous
five years"*), but `goodstanding.io` is **an active trades-services brand** (websites and 24/7 call
answering for plumbers, electricians and gas engineers in the UK, Ireland and Australia) and
`goodstanding.app` also resolves. Same industry, live business. **Not viable.**

### 1.4 Recommendation

> **Keep `StateReady`.** Launch on **`getstateready.com`** (unregistered, ~$12) and open a
> Namecheap Market negotiation for `stateready.com` in parallel. Secure `stateready.io`, `.app` and
> `.co` immediately — all three are unregistered and cost about $100 together. Run a USPTO knock-out
> search before any brand spend. **If the trademark search comes back bad, switch to `RenewalMap`,
> not `LicenseAtlas`** — a clean namespace beats a better metaphor.

Four reasons: **(1)** it is the buyer's own question — *"are we ready in Ohio?"* is what the GM asks
the coordinator, and `PERSONA.md §8 J5` is that sentence turned into a feature; **(2)** it spans both
revenue lines, where `RenewalMap` covers only the subscription and `LicenseAtlas` only the lookup;
**(3)** it stays out of the `License___` family our nearest competitor already crowds, which matters
more for a new entrant's recall than metaphorical precision; **(4)** `PLAN.md` A3 already made it the
slug, so keeping it costs zero rework across nine wave-1 agents.

**The founder decides.** This is a recommendation with its evidence attached.

---

## 2. Positioning — April Dunford's *Obviously Awesome* run explicitly

Dunford's argument is that positioning is a sequence of decisions about context, not a tagline
exercise. The six steps are run in order, each ending in a decision rather than a discussion.

### Step 1 — Competitive alternatives: what happens if we do not exist

| Tier | Alternative | Cost | Why it is real |
|---|---|---|---|
| **A — the free default, and the true benchmark** | A shared Google Sheet or Excel workbook | $0 | *"The majority of specialty trade shops with fewer than twenty licensed technicians track renewals in a shared Google Sheet, an Excel workbook, a whiteboard, or — at smallest scale — the owner's memory."* ([licenseroadmap.com](https://licenseroadmap.com/blog/best-contractor-license-tracking-software)) |
| | Calendar reminders | $0 | Survives the person; the knowledge does not |
| | Asking a peer on a forum | $0 | Free, fast and often better than the paid answer (`PERSONA.md §6.3`) |
| | A field of custom fields in ServiceTitan | bundled | [ServiceTitan help](https://help.servicetitan.com/docs/use-custom-fields) |
| **B — bundled in software they already pay for** | **Housecall Pro** — *"built-in tools to store documents, track expiration dates, and set automatic renewal reminders"* | bundled | [housecallpro.com](https://www.housecallpro.com/licensing/hvac/). **The single most dangerous alternative in the list** |
| | **ADP Workforce Now** — Licenses and Certifications report with expiration date and renewal requirement | bundled | ADP developer docs |
| | **ServiceTitan** — dispatch by *"skill sets, license level, and legal service territory"* | bundled | [servicetitan.com](https://www.servicetitan.com/blog/plumbing-license-reciprocity-by-state) |
| **C — purpose-built software** | **LicensedTrades.com** | **$199 / $349 / $599 / $1,199 per month** | [licensedtrades.com/pricing](https://licensedtrades.com/pricing) |
| | StateRequirement License Alert | **$99 / $299 / $499 per year**, per individual | [staterequirement.com](https://staterequirement.com/license-alert/) |
| | Horizontal credential trackers (ExpiryEdge, RenewOps, CSC, Avetta) | varies | No trade rule library |
| **D — humans, the anchor tier** | Harbor Compliance — managed licensing, "Compliance Core™" database | **unpublished** | [harborcompliance.com](https://www.harborcompliance.com/compliance-solutions-construction-firms); **Trustpilot 2.9/5, 31% one-star** |
| | API Processing and the expediter long tail | **"call for quote"**, 4–8 weeks | [apiprocessing.com](https://apiprocessing.com/nationwide-contractor-licensing/) |
| | Permit expediters, for scale | $500–$5,000 per project | [permitplace.com](https://permitplace.com/permit-expediter-cost-guide/) |

**Step 1 decision.** We argue against **three** reference points and must never collapse them.
Against **A** we sell *the rule you do not have*. Against **B** we sell *the difference between storing
a date and knowing a requirement*. Against **C and D** we sell *the published price and the instant
answer*. A landing page that only fights Tier D — the flattering comparison — loses the Tier B fight,
which is the one we are actually in.

### Step 2 — Unique attributes

An attribute qualifies only if **no alternative above has it**. Three survive.

**UA1 — A rule library, not a reminder engine.**
Every alternative in Tiers A and B stores *the date you typed*. None of them knows that a Texas ACR
contractor needs *"8 hours of approved continuing education coursework each year"* including one hour
of state law ([TDLR](https://www.tdlr.texas.gov/acr/contractor-renew.htm)); that New Jersey's 10-hour
update must be taken in a live class; that Illinois plumbers all renew on 30 April; or that a Texas
licence expired under 90 days costs 1.5× and over 90 days costs 2×.
*Uniqueness check:* Housecall Pro's own words are "store documents, track expiration dates, set
reminders" — three storage verbs and no rule verb.

**UA2 — Every rule carries its source, its date and its verifier, on screen.**
`PLAN.md` A10 makes this a code-level obligation, not a marketing promise: `source_url`,
`last_verified`, `verified_by` (two agent ids), `confidence`. This design system gives it a component
(§9.10, the **provenance line**) that is *required markup* on any rendered rule.
*Uniqueness check:* Harbor Compliance advertises *"Compliance Core™: The #1 Nationwide Licensing
Database"* and shows the reader none of it. Nobody in Tiers A–D puts the citation next to the value.

**UA3 — The qualifier clock.**
When a qualifying individual disassociates, CSLB's own form says *"The licensee must replace the
qualifier within 90 days of the disassociation date. Failure to replace the qualifier within 90 days
results in the automatic suspension of the license or removal of the classification."*
([CSLB, B&P §§7076, 7068.2, 7083](https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf))
No tool in any tier turns an HR event into that clock. It is the highest-consequence, lowest-frequency
event in the persona's year — exactly the shape of thing software should own and humans should not.

### Step 3 — Value themes

| Theme | Attributes | The value, in their words | The word we own |
|---|---|---|---|
| **Know the rule, not just the date** | UA1 | "I booked the right class the first time" | **rule** |
| **Check us in thirty seconds** | UA2 | "I clicked through to the board and it said the same thing" | **source** |
| **Nothing starts a clock without telling you** | UA1 + UA3 | "The resignation email did not become a suspension" | **clock** |

### Step 4 — Who cares most

Per `PERSONA.md §1`: **the licensing coordinator at a 15–100-technician contractor working in two to
six states, with the owner or GM as the economic approver.** Not the enterprise compliance
department, which already has Harbor Compliance. Not the two-truck shop, whose spreadsheet genuinely
still works.

### Step 5 — Market category

The category we enter is **not** "compliance software", where we would be measured against Avetta and
Wolters Kluwer and lose on features and trust. It is **licence readiness for trade contractors** — a
frame that borrows credibility from the buyer's existing field-service stack rather than from
enterprise GRC. It positions us as a **point solution that sits next to ServiceTitan**, which is
exactly what the persona's software budget expects (`PERSONA.md §9`).

### Step 6 — The positioning statement

> **For the licensing coordinator at a multi-state HVAC, plumbing or electrical contractor
> who is holding fifty renewal dates in a spreadsheet that does not know the rules behind them,
> StateReady is licence-readiness software
> that keeps every technician's licence, CE, bond and insurance current across every state you work
> in — and tells you exactly what it takes to work in the next one.
> Unlike a field-service platform's custom fields or an expediter's four-to-eight-week callback,
> every requirement StateReady shows you carries the board's own link and the date we last checked it,
> so you can verify us in thirty seconds instead of trusting us for a year.**

**The tagline, and the two lines allowed to stand in for it:**

- **Primary:** *"Know where you can work tomorrow."*
- **Deadline-led alternate:** *"Fifty renewal dates. One that will hurt. We know which."*
- **Provenance-led alternate, for the pricing and methodology pages:** *"Every rule, with the board's
  own link and the date we checked it."*

**Prohibited claims** (`PLAN.md` A10 and `PERSONA.md §3`, binding on every surface):

- Any dollar figure for the cost of a lapse that originates on a competitor's marketing page.
- The **$44,539/day EPA 608 penalty** until an agent opens a `.gov` source for it.
- Any customer count, logo or success rate until one exists with its denominator.
- "All 50 states" while launch coverage is HVAC / plumbing / electrical × 15 states (`PLAN.md` A11).
- "Guaranteed compliance". We are an information product. That sentence is in the disclaimer
  component (§9.12) and it is not optional.

---

## 3. Three identity directions, from the buyer's point of view — and the choice

`PIPELINE.md` stage 1 requires at least three options, each argued from the buyer's seat.

### Direction 1 — **"Ledger of Record"**

*The buyer's seat:* the coordinator opens a binder. Tabs by state, a page per technician, a stamp
where something is current. The product looks like the compliance file they already keep, but
legible and self-maintaining.

*Execution:* document-first. Serif or slab headings, ruled tables, seals and stamps, heavy use of
monospace for licence numbers, a paper-white column of "record" running down the page.
*Strength:* maximum authority in a regulated category; makes the provenance line (UA2) feel native.
*Why it loses:* **it flatters the auditor, not the coordinator.** The binder is the thing they are
trying to escape. Worse, it collides head-on with Clausewright — whose whole identity is a
document-first, cited-clause reading surface — and `PLAN.md` requires the three phase-4 apps to be
distinct from each other *and* from Clausewright. Rejected.

### Direction 2 — **"Readiness Map"**

*The buyer's seat:* the GM leans over the desk and asks "are we covered in Ohio?" The coordinator
turns the monitor round. Ohio is amber, with a number on it. The conversation takes four seconds.

*Execution:* the map is the hero on every screen that has room for it. Status is a fill; the country
is the primary navigation; states you are *not* in are drawn but hollow, so expansion is visible as
an absence rather than hidden in a menu.
*Strength:* it answers `PERSONA.md`'s J5 and J7 in one object, and it is the only direction in which
the tracker and the expansion report look like the same product rather than two.
*Risk, and it is real:* a geographic choropleth is a bad instrument for this data — Rhode Island and
Montana are the same problem and wildly different numbers of pixels — and colour alone fails WCAG
1.4.1. Both are solvable (§7.1) and neither is fatal.

### Direction 3 — **"The Runway"**

*The buyer's seat:* what matters is not where, it is *when*. A single horizontal time axis from today
to twelve months out, every licence a marker on it, the 90 / 60 / 30 / 7 gates drawn as verticals.

*Execution:* a departure-board / horizon aesthetic. Tabular numerals, dense rows, one axis.
*Strength:* it is the truest picture of the coordinator's actual anxiety, and it makes the alert
cadence — which the whole market has standardised on 90/60/30/7 (`PERSONA.md §9`) — visible as
structure rather than as settings.
*Why it does not lead:* it has nowhere to put "which states", so the expansion report becomes a
bolted-on second product, and a bare time axis is a weak first impression on a landing page.

### The choice

> **Direction 2 leads, with Direction 3 as its second system. Direction 1 is rejected outright.**

Concretely: **the map answers *where*, the runway answers *when*, and the two are never on top of
each other.** The dashboard is a two-pane composition — map left, runway right — and every other
screen inherits one of the two as its organising axis. Direction 1's one salvageable idea, the
authority of a cited record, survives as a *component* (the provenance line, §9.10) rather than as an
aesthetic.

**The falsifiable test that keeps us honest:** on any StateReady screen, a stranger should be able to
answer "which states are a problem?" and "what breaks first?" without reading a sentence. If a screen
cannot do both, it is the wrong screen.

---

## 4. Tone of voice

Written for people who, on the evidence of `PERSONA.md §6.3`, correct each other's facts in public and
type "recip" and "the board" without expanding them. They do not respond to enthusiasm. They respond
to someone who has obviously read the statute.

**Five rules, each with the do and the don't.**

**T1 — Lead with the fact, then the consequence. Never the adjective.**
- ✅ "Texas ACR renews every year and needs 8 CE hours, one of them state law. Three of your techs
  are short."
- ❌ "Stay effortlessly compliant with powerful automated CE tracking."

**T2 — Cite, or say you cannot.**
- ✅ "Qualifier disassociation starts a 90-day clock. Source: CSLB Disassociation Request. Checked
  3 Sep 2026."
- ❌ "Industry best practice is to replace a qualifier promptly."
- ✅ (when we do not know) "We do not cover Wyoming electrical yet. Here is the board's page."
- ❌ Filling a gap with a plausible number. **This is the one prohibition with no exception.**

**T3 — Use their nouns. Never soften them.**
- ✅ qualifier · disassociation · recip · CE hours · the board · pull a permit · good standing · ACR · C-20
- ❌ credential owner · offboarding · knowledge transfer · learning · the regulator · obtain authorisation
- (Full list: `PERSONA.md §7`.)

**T4 — State urgency; never manufacture it.** The only urgency device in the product is a real date
and a real consequence, both sourced. There is no countdown timer, no "3 spots left", no expiring
discount, and **no component in this design system capable of expressing one** — the omission is the
enforcement.
- ✅ "Ohio journeyman expires in 11 days. Ohio has no grace period we have recorded."
- ❌ "⚠️ URGENT: Your compliance score is dropping!"

**T5 — Address the forwarder.** Every alert, report and share link will be read by someone who has
never logged in (`PERSONA.md §9`). Every one must open with what and where, not with a greeting.
- ✅ Subject: **"Texas — 3 licences expire within 30 days"**
- ❌ Subject: "Your weekly StateReady digest is ready!"

**Register examples across surfaces**

| Surface | ✅ | ❌ |
|---|---|---|
| Empty state | "No technicians yet. Import a CSV, or add one by hand — either takes under a minute." | "Let's get you set up! 🎉" |
| Error | "That CSV had 4 rows without an expiry date. They are listed below; fix them here or import the rest." | "Oops! Something went wrong." |
| Paywall | "The tracker is $X/month for up to N technicians in N states. Cancel from Settings in two clicks." | "Unlock the full power of StateReady!" |
| Refusal | "We do not have a verified CE rule for Wyoming electrical. We will not guess. Here is the board." | "Our AI is still learning about this state." |
| Cancellation | "Your data stays exportable for 90 days. Here is the CSV button." | "We're sad to see you go 😢" |

**Two words that are banned outright:** *effortless* (nothing about state licensing is) and
*seamless* (it describes an integration we do not have).

---

## 5. Where we sit — distinct from three siblings, at home next to three incumbents

### 5.1 Distinct from the other phase-4 apps and from Clausewright

**Rewritten 2026-09-03, from artefacts rather than from prediction.** The original version of this
section was written when the sibling identities did not exist, stated the differences "by category logic",
and asked the orchestrator to re-check once all three files existed. That check happened; it found a
collision on every axis; `../IDENTITY_ARBITRATION.md` resolved it. The table below is now measured.

| | Its subject | What it actually ships | **How StateReady differs** |
|---|---|---|---|
| **WageLens** | Construction payroll, Davis-Bacon wage determinations | Public Sans + IBM Plex Mono; warm bone `#FBF9F5` (hue 40°, L\* 98.0); brick `#8A3115` as brand and primary action; 15px base, 36px grid rows, 2–10px radii; the ruled ledger and the provenance card | Different UI face, different mono, and **ΔE76 87.9 between the grounds** — WageLens is the lightest surface in the fleet, StateReady the darkest. Its hero is a **week grid**; ours is a **tile map and a time axis**. Its primary action is brick on white; ours is bone on a dark board. Its status tints are pale and warm; ours are deep. |
| **Certly** | ACORD 25 certificates of insurance | Source Sans 3 + Source Code Pro; cool office white `#E8EEF6` (hue 214°); interaction blue `#14458C` on the primary button; 16px base, 44px rows, 4–12px radii; the coverage bar | Different UI face, different mono, **ΔE76 83.9 between the grounds**. **StateReady never renders a document as its hero** — certificates appear only as an attachment row inside a licence card. And **StateReady uses no blue at any weight**, which is precisely the hue Certly reserves for interaction. |
| **Clausewright** | Amazon suspension appeals; a cited policy clause on a glass surface | System fonts, no web fonts; translucent Liquid-Glass materials over a blue-slate canvas (215°); recovery green accent; 17px base | **StateReady is opaque.** No `backdrop-filter` anywhere in `design-system.css`, no glass, no blue-slate. Its ground is a graphite-**green** board at 144°, 70° away from Clausewright's slate; it loads three web fonts where Clausewright loads none; and its hero is a map, not a quoted clause. |

The single sentence that separates all four: **WageLens is about money, Certly is about paper,
Clausewright is about an argument, StateReady is about geography and time.**

Machine-checked by `../scripts/identity-distinctness.py`, which parses all three stylesheets and fails on
a shared font family or a ground collision. Run it after any token change.

### 5.2 At home next to ServiceTitan, Housecall Pro, Jobber and FieldEdge

Observed by fetching each vendor's shipped CSS and markup, not from memory (`identity/sources.md`
rows 40, 43, 44, 45).

| Vendor | Observed brand values | Source |
|---|---|---|
| **ServiceTitan** | `--titan-blue-3: #0265dc` primary with a six-step blue ramp; `--green: #18a761`; **Sofia Pro** headings, **Nunito Sans** body; cool greys `#f1f1f1`, `#bfbdbd` | `servicetitan.com/styles.c1efe6299c55a6791f25.css` |
| **Housecall Pro** | Navy `#002942`, amber `#ffb706`, action blue `#0f77cc`; **Open Sans** | `housecallpro.com/.../hcp-build/app.css` |
| **FieldEdge** | Navy `#09527e`, orange `#ea6211`, yellow `#efd517` | `fieldedge.com` shipped markup |
| **Jobber** | **Not obtained.** `getjobber.com` returns 403 to `curl` on two attempts and WebFetch renders markdown only. Published pricing was fetched ($49–$499/mo). Colour values recorded as **unverified** | `identity/sources.md` row 46 |

**What to borrow, and why it is safe to borrow:**

- **Their type scale, not their typefaces.** These products are read by people who are not
  desk-workers by trade: large body sizes, large numbers, big hit areas. StateReady's base is 16px
  with a 44px minimum target (§8, A7).
- **Plain-English labels.** "Add a technician", not "Create resource".
- **The one-big-number card.** ServiceTitan and Jobber both lead with a single figure and a label.
  StateReady's `sr-stat` component (§9.7) is the same idea applied to *days remaining*.
- **Published, self-serve pricing** — from Jobber, explicitly not from ServiceTitan (§2 Tier C/D).

**What to avoid, and why:**

- **The blue.** Three of the four lead with blue or navy. Adopting it makes us a fourth
  indistinguishable tile in a comparison screenshot and, worse, spends the most attention-grabbing
  colour on chrome instead of on status. It is also now Certly's interaction hue, so it is doubly
  unavailable.
- **Their typefaces**, and note that there is no shared one to be familiar with: ServiceTitan runs Sofia
  Pro + Nunito Sans, Housecall Pro runs Open Sans + Oswald + Plus Jakarta Sans. Barlow's signage lineage
  belongs to the subject matter, not to the category.

**One observation that supports the board, stated with its limit.** ServiceTitan's own served markup
carries dark chrome values `#17191C` and `#22252A` at high frequency, so a dark instrument surface is not
foreign to this buyer's stack. That is an observation about their palette and **not** a claim about their
dispatch board, and it is not the primary argument for the board — mutual distinctness is
(`../IDENTITY_ARBITRATION.md §3.2`).
- **Amber and orange as brand colours** (Housecall Pro `#ffb706`, FieldEdge `#ea6211`). In StateReady,
  amber means **at risk**. A brand that is amber cannot have an amber warning.
- **Marketing-site gradients and hero photography of smiling technicians.** They read as "we sell to
  contractors", not "we know the rule". `PERSONA.md §12` ranks a source link above any image.
- **Bright confirmation green as a CTA.** ServiceTitan's `#18a761` is close to our READY. A green
  primary button in a product whose green means "compliant" is a semantic collision.

---

## 6. Colour

### 6.1 The palette, and why it looks like this

Two families and nothing else, in two themes.

1. **The board and its ink** — a deep graphite-green ground (`#181D1A`, hue 144°, Lab L\* 10.2) and a
   bone ink (`#ECF2EE`). All chrome, all typography, all buttons, all borders and the focus ring are
   drawn from this family. It is green-cast rather than neutral-black so that it is not WageLens's warm
   black `#12100E` and not Certly's blue-black `#0B1220`; it is graphite rather than saturated so that
   nothing in the chrome competes with a status.
   In the **paper** theme the same family inverts to a cool stone `#E9ECE8` and a near-black `#131714`.
2. **The readiness ramp** — green, amber, red and a neutral "not tracked". This is the **only**
   saturated colour in the system, and it appears only inside status objects: map tiles, chips, dots,
   the runway's gates and the CE meter's fill. On the board it is **luminous on deep fills**; on paper it
   is **dark ink on pale tints**. The hues are the same in both (155° / 31° / 355°); only lightness moves.

**There is no third family. There is no brand hue.** The primary button is ink — which on the board means
a **bone button with a dark label**, and on paper the reverse. The link is ink, underlined. The focus ring
is ink. The logo mark is the READY green, which is a statement rather than a decoration: the product is
named for the state it is trying to get you into.

**Why the default is the board, in one paragraph.** This is the only app in the phase-4 fleet whose hero
object is not a document: WageLens replaces a payroll register, Certly shows a certificate, and StateReady
shows **a board of states and a clock**. That is the one artefact in the set that is conventionally dark —
a departure board, a dispatch board — and it is where "the status ramp is the palette" is at full
strength. The full reasoning, including the honest limit of the buyer-familiarity argument, is
`../IDENTITY_ARBITRATION.md §3.2`.

The names are deliberate and are used in code, in copy and in support: **READY / AT RISK / LAPSED /
NOT TRACKED**. Never "compliant", never "green/yellow/red" in prose.

### 6.2 Tokens

**Board theme — the default, on bare `:root`:**

| Token | Hex | Role |
|---|---|---|
| `--sr-ground` | `#181D1A` | page ground. Renamed from `--sr-paper`, because on the default theme this ground is not paper |
| `--sr-surface` | `#212724` | cards, table body |
| `--sr-sunken` | `#0E1210` | table headers, wells, code |
| `--sr-line` | `#333B37` | hairline rules (decorative) |
| `--sr-line-strong` | `#7E8A84` | input borders, dividers that carry meaning |
| `--sr-ink` | `#ECF2EE` | primary text, primary button fill, focus ring |
| `--sr-ink-2` | `#B9C4BE` | secondary text, column headers |
| `--sr-ink-3` | `#8D9994` | meta, placeholder, disabled label |
| `--sr-on-ink` | `#0E1210` | text on the ink button — dark, because on the board the ink button is light |
| `--sr-ready` / `-fill` / `-edge` | `#52D09C` / `#0F3226` / `#38976F` | READY, hue 155° |
| `--sr-risk` / `-fill` / `-edge` | `#F0A85A` / `#37260D` / `#A0722C` | AT RISK, hue 31° |
| `--sr-lapsed` / `-fill` / `-edge` | `#F98A93` / `#3B1A20` / `#BB4E59` | LAPSED, hue 355° |
| `--sr-unknown` / `-fill` / `-edge` | `#8D9994` / `#232925` / `#7E8A84` | NOT TRACKED |

**Paper theme — the alternate.** Applies under `prefers-color-scheme: light` and under
`[data-theme="paper"]` / `[data-theme="light"]`; `[data-theme="board"]` / `[data-theme="dark"]` force the
board back. **This is the theme every forwardable artefact uses**: print, the bid-package PDF, the
shareable readiness link, every alert email.

| Token | Hex | Token | Hex |
|---|---|---|---|
| `--sr-ground` | `#E9ECE8` | `--sr-ink` | `#131714` |
| `--sr-surface` | `#FFFFFF` | `--sr-ink-2` | `#454B47` |
| `--sr-sunken` | `#DCE0DB` | `--sr-ink-3` | `#5F6762` |
| `--sr-line` | `#CBD1CB` | `--sr-on-ink` | `#E9ECE8` |
| `--sr-line-strong` | `#78827C` | | |
| `--sr-ready` / `-fill` / `-edge` | `#146A46` / `#D4EBE0` / `#348D68` | `--sr-risk` / `-fill` / `-edge` | `#8A4E08` / `#F8E7CE` / `#A9701F` |
| `--sr-lapsed` / `-fill` / `-edge` | `#A81B2C` / `#F7DEDF` / `#BE454B` | `--sr-unknown` / `-fill` / `-edge` | `#5F6762` / `#E4E7E2` / `#78827C` |

The paper ground is a **cool stone**, not the warm bone it used to be: `#FAF8F4` sat ΔE76 **0.35** from
WageLens's canvas, which is below the just-noticeable difference. `#E9ECE8` is a different colour by any
measure and still reads as paper.

### 6.3 Contrast certification

Computed by `identity/contrast.py` using the WCAG 2.1 relative-luminance formula (sRGB linearised at
the 0.03928 threshold with 2.4 gamma) and the `(L1+0.05)/(L2+0.05)` ratio. The script encodes the
target next to each pair and **exits non-zero on any failure**, so it is a test, not a document.
Targets: **4.5:1** for text (1.4.3 AA), **3:1** for borders, dots, tile edges and focus rings
(1.4.11 AA). Large text is held to 4.5:1 anyway rather than taking the 3:1 allowance.

**Result: 70 declared pairs (35 per theme), 0 failures. Smallest text margin 4.89:1 against 4.5:1.
Smallest non-text margin 3.15:1 against 3:1.**

Reproduce with `python3 identity/contrast.py` (table) or `--md` (the tables below). **Everything between
here and the "Honest limits" note is script output, pasted verbatim.**

**Board theme (default)**

| foreground | background | ratio | target | pass | what it is |
|---|---|---:|---:|:--:|---|
| `--sr-ink` `#ECF2EE` | `--sr-ground` `#181D1A` | **15.05:1** | 4.5:1 | ✅ | body text on the ground |
| `--sr-ink` `#ECF2EE` | `--sr-surface` `#212724` | **13.40:1** | 4.5:1 | ✅ | body text on a card |
| `--sr-ink` `#ECF2EE` | `--sr-sunken` `#0E1210` | **16.63:1** | 4.5:1 | ✅ | body text on a sunken/table-header surface |
| `--sr-ink-2` `#B9C4BE` | `--sr-ground` `#181D1A` | **9.52:1** | 4.5:1 | ✅ | secondary text on the ground |
| `--sr-ink-2` `#B9C4BE` | `--sr-surface` `#212724` | **8.48:1** | 4.5:1 | ✅ | secondary text on a card |
| `--sr-ink-3` `#8D9994` | `--sr-ground` `#181D1A` | **5.79:1** | 4.5:1 | ✅ | muted text / table meta on the ground |
| `--sr-ink-3` `#8D9994` | `--sr-surface` `#212724` | **5.16:1** | 4.5:1 | ✅ | muted text / placeholder on a card |
| `--sr-on-ink` `#0E1210` | `--sr-ink` `#ECF2EE` | **16.63:1** | 4.5:1 | ✅ | label on the primary (ink) button |
| `--sr-line` `#333B37` | `--sr-ground` `#181D1A` | **1.48:1** | — | ✅ | hairline rule (decorative, no target) |
| `--sr-line-strong` `#7E8A84` | `--sr-ground` `#181D1A` | **4.76:1** | 3.0:1 | ✅ | input border / table divider — 1.4.11 |
| `--sr-line-strong` `#7E8A84` | `--sr-surface` `#212724` | **4.24:1** | 3.0:1 | ✅ | input border on a card — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-ready-fill` `#0F3226` | **12.30:1** | 4.5:1 | ✅ | text inside a READY chip / map tile |
| `--sr-ready` `#52D09C` | `--sr-ground` `#181D1A` | **8.83:1** | 4.5:1 | ✅ | READY label text on the ground |
| `--sr-ready` `#52D09C` | `--sr-surface` `#212724` | **7.87:1** | 4.5:1 | ✅ | READY label text on a card |
| `--sr-ready-edge` `#38976F` | `--sr-ground` `#181D1A` | **4.74:1** | 3.0:1 | ✅ | READY dot / tile edge — 1.4.11 |
| `--sr-ready-edge` `#38976F` | `--sr-surface` `#212724` | **4.22:1** | 3.0:1 | ✅ | READY dot on a card — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-risk-fill` `#37260D` | **12.80:1** | 4.5:1 | ✅ | text inside an AT RISK chip / map tile |
| `--sr-risk` `#F0A85A` | `--sr-ground` `#181D1A` | **8.50:1** | 4.5:1 | ✅ | AT RISK label text on the ground |
| `--sr-risk` `#F0A85A` | `--sr-surface` `#212724` | **7.57:1** | 4.5:1 | ✅ | AT RISK label text on a card |
| `--sr-risk-edge` `#A0722C` | `--sr-ground` `#181D1A` | **4.02:1** | 3.0:1 | ✅ | AT RISK dot / tile edge — 1.4.11 |
| `--sr-risk-edge` `#A0722C` | `--sr-surface` `#212724` | **3.58:1** | 3.0:1 | ✅ | AT RISK dot on a card — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-lapsed-fill` `#3B1A20` | **13.66:1** | 4.5:1 | ✅ | text inside a LAPSED chip / map tile |
| `--sr-lapsed` `#F98A93` | `--sr-ground` `#181D1A` | **7.39:1** | 4.5:1 | ✅ | LAPSED label text on the ground |
| `--sr-lapsed` `#F98A93` | `--sr-surface` `#212724` | **6.58:1** | 4.5:1 | ✅ | LAPSED label text on a card |
| `--sr-lapsed-edge` `#BB4E59` | `--sr-ground` `#181D1A` | **3.54:1** | 3.0:1 | ✅ | LAPSED dot / tile edge — 1.4.11 |
| `--sr-lapsed-edge` `#BB4E59` | `--sr-surface` `#212724` | **3.15:1** | 3.0:1 | ✅ | LAPSED dot on a card — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-unknown-fill` `#232925` | **13.07:1** | 4.5:1 | ✅ | text inside a NOT TRACKED chip / map tile |
| `--sr-unknown` `#8D9994` | `--sr-ground` `#181D1A` | **5.79:1** | 4.5:1 | ✅ | NOT TRACKED label text on the ground |
| `--sr-unknown-edge` `#7E8A84` | `--sr-ground` `#181D1A` | **4.76:1** | 3.0:1 | ✅ | NOT TRACKED tile edge — 1.4.11 |
| `--sr-ink-2` `#B9C4BE` | `--sr-sunken` `#0E1210` | **10.52:1** | 4.5:1 | ✅ | table column headers on the sunken header row |
| `--sr-ready-edge` `#38976F` | `--sr-ready-fill` `#0F3226` | **3.87:1** | 3.0:1 | ✅ | READY chip border against its own fill — 1.4.11 |
| `--sr-risk-edge` `#A0722C` | `--sr-risk-fill` `#37260D` | **3.42:1** | 3.0:1 | ✅ | AT RISK chip border against its own fill — 1.4.11 |
| `--sr-lapsed-edge` `#BB4E59` | `--sr-lapsed-fill` `#3B1A20` | **3.21:1** | 3.0:1 | ✅ | LAPSED chip border against its own fill — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-ground` `#181D1A` | **15.05:1** | 3.0:1 | ✅ | focus ring (ink) against the page ground — 1.4.11 |
| `--sr-ink` `#ECF2EE` | `--sr-surface` `#212724` | **13.40:1** | 3.0:1 | ✅ | focus ring (ink) against a card — 1.4.11 |

**Paper theme (alternate)**

| foreground | background | ratio | target | pass | what it is |
|---|---|---:|---:|:--:|---|
| `--sr-ink` `#131714` | `--sr-ground` `#E9ECE8` | **15.19:1** | 4.5:1 | ✅ | body text on the ground |
| `--sr-ink` `#131714` | `--sr-surface` `#FFFFFF` | **18.10:1** | 4.5:1 | ✅ | body text on a card |
| `--sr-ink` `#131714` | `--sr-sunken` `#DCE0DB` | **13.55:1** | 4.5:1 | ✅ | body text on a sunken/table-header surface |
| `--sr-ink-2` `#454B47` | `--sr-ground` `#E9ECE8` | **7.50:1** | 4.5:1 | ✅ | secondary text on the ground |
| `--sr-ink-2` `#454B47` | `--sr-surface` `#FFFFFF` | **8.93:1** | 4.5:1 | ✅ | secondary text on a card |
| `--sr-ink-3` `#5F6762` | `--sr-ground` `#E9ECE8` | **4.89:1** | 4.5:1 | ✅ | muted text / table meta on the ground |
| `--sr-ink-3` `#5F6762` | `--sr-surface` `#FFFFFF` | **5.83:1** | 4.5:1 | ✅ | muted text / placeholder on a card |
| `--sr-on-ink` `#E9ECE8` | `--sr-ink` `#131714` | **15.19:1** | 4.5:1 | ✅ | label on the primary (ink) button |
| `--sr-line` `#CBD1CB` | `--sr-ground` `#E9ECE8` | **1.30:1** | — | ✅ | hairline rule (decorative, no target) |
| `--sr-line-strong` `#78827C` | `--sr-ground` `#E9ECE8` | **3.34:1** | 3.0:1 | ✅ | input border / table divider — 1.4.11 |
| `--sr-line-strong` `#78827C` | `--sr-surface` `#FFFFFF` | **3.98:1** | 3.0:1 | ✅ | input border on a card — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-ready-fill` `#D4EBE0` | **14.44:1** | 4.5:1 | ✅ | text inside a READY chip / map tile |
| `--sr-ready` `#146A46` | `--sr-ground` `#E9ECE8` | **5.54:1** | 4.5:1 | ✅ | READY label text on the ground |
| `--sr-ready` `#146A46` | `--sr-surface` `#FFFFFF` | **6.60:1** | 4.5:1 | ✅ | READY label text on a card |
| `--sr-ready-edge` `#348D68` | `--sr-ground` `#E9ECE8` | **3.42:1** | 3.0:1 | ✅ | READY dot / tile edge — 1.4.11 |
| `--sr-ready-edge` `#348D68` | `--sr-surface` `#FFFFFF` | **4.07:1** | 3.0:1 | ✅ | READY dot on a card — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-risk-fill` `#F8E7CE` | **14.92:1** | 4.5:1 | ✅ | text inside an AT RISK chip / map tile |
| `--sr-risk` `#8A4E08` | `--sr-ground` `#E9ECE8` | **5.55:1** | 4.5:1 | ✅ | AT RISK label text on the ground |
| `--sr-risk` `#8A4E08` | `--sr-surface` `#FFFFFF` | **6.62:1** | 4.5:1 | ✅ | AT RISK label text on a card |
| `--sr-risk-edge` `#A9701F` | `--sr-ground` `#E9ECE8` | **3.51:1** | 3.0:1 | ✅ | AT RISK dot / tile edge — 1.4.11 |
| `--sr-risk-edge` `#A9701F` | `--sr-surface` `#FFFFFF` | **4.18:1** | 3.0:1 | ✅ | AT RISK dot on a card — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-lapsed-fill` `#F7DEDF` | **14.19:1** | 4.5:1 | ✅ | text inside a LAPSED chip / map tile |
| `--sr-lapsed` `#A81B2C` | `--sr-ground` `#E9ECE8` | **6.17:1** | 4.5:1 | ✅ | LAPSED label text on the ground |
| `--sr-lapsed` `#A81B2C` | `--sr-surface` `#FFFFFF` | **7.35:1** | 4.5:1 | ✅ | LAPSED label text on a card |
| `--sr-lapsed-edge` `#BE454B` | `--sr-ground` `#E9ECE8` | **4.26:1** | 3.0:1 | ✅ | LAPSED dot / tile edge — 1.4.11 |
| `--sr-lapsed-edge` `#BE454B` | `--sr-surface` `#FFFFFF` | **5.07:1** | 3.0:1 | ✅ | LAPSED dot on a card — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-unknown-fill` `#E4E7E2` | **14.50:1** | 4.5:1 | ✅ | text inside a NOT TRACKED chip / map tile |
| `--sr-unknown` `#5F6762` | `--sr-ground` `#E9ECE8` | **4.89:1** | 4.5:1 | ✅ | NOT TRACKED label text on the ground |
| `--sr-unknown-edge` `#78827C` | `--sr-ground` `#E9ECE8` | **3.34:1** | 3.0:1 | ✅ | NOT TRACKED tile edge — 1.4.11 |
| `--sr-ink-2` `#454B47` | `--sr-sunken` `#DCE0DB` | **6.69:1** | 4.5:1 | ✅ | table column headers on the sunken header row |
| `--sr-ready-edge` `#348D68` | `--sr-ready-fill` `#D4EBE0` | **3.25:1** | 3.0:1 | ✅ | READY chip border against its own fill — 1.4.11 |
| `--sr-risk-edge` `#A9701F` | `--sr-risk-fill` `#F8E7CE` | **3.45:1** | 3.0:1 | ✅ | AT RISK chip border against its own fill — 1.4.11 |
| `--sr-lapsed-edge` `#BE454B` | `--sr-lapsed-fill` `#F7DEDF` | **3.98:1** | 3.0:1 | ✅ | LAPSED chip border against its own fill — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-ground` `#E9ECE8` | **15.19:1** | 3.0:1 | ✅ | focus ring (ink) against the page ground — 1.4.11 |
| `--sr-ink` `#131714` | `--sr-surface` `#FFFFFF` | **18.10:1** | 3.0:1 | ✅ | focus ring (ink) against a card — 1.4.11 |

Smallest text margin: 4.89:1 against a 4.5:1 requirement.
Smallest non-text margin: 3.15:1 against a 3:1 requirement.
0 failure(s).

**Honest limits.** WCAG offers no criterion for "is this red distinguishable from this green by a
protanope". The 3:1 edge and the mandatory glyph (§7.2) are our own extension, not a published
conformance technique — sound in intent, asserted in method. Flagged as a design judgment.

---

## 7. Iconography and infographic style — the part that carries the product

This is where the identity earns its keep. `PERSONA.md §8` J5 requires a stranger to answer "are we
covered in Ohio?" in seconds.

### 7.1 The state map is a **tile grid**, not a geographic choropleth

Fifty (plus DC) equal squares laid out in the approximate shape of the country, each carrying its
two-letter postal abbreviation.

**Why, and it is a decision worth defending:** a geographic map sizes each state by land area, so
Montana shouts and Rhode Island disappears — but a contractor's exposure has nothing to do with
acreage. A shop with eleven technicians in New Jersey and one in Wyoming would read, on a geographic
map, as a Wyoming problem. A tile grid gives every jurisdiction the **same visual weight**, which is
the correct weighting for "does this state have a rule I am failing". It also gives every tile the
same fixed area for a badge and a count, which a geographic map cannot.

**Flagged as a design judgment.** The equal-weight argument is ours; no published source is cited for
it. It is falsifiable: if usability testing shows coordinators cannot locate their states on a tile
grid, revert to a simplified geographic outline and solve the small-state problem with leader lines.

**Rendering rules.**

- Fixed 40×40px tiles at desktop, 28×28 at ≤640px; 4px gutter; 6px corner radius.
- Fill = status. Edge = `-edge` token at 1.5px. Label = state abbreviation in ink at 12px/600.
- A count badge (technicians or licences at risk) sits bottom-right when > 0.
- **States you do not operate in are drawn**, in `--sr-ground` with a 1px dashed `--sr-line-strong`
  edge and ink-3 label. Expansion is therefore *visible as an absence*, which is how J7 gets a home
  on the dashboard instead of a menu item.
- Selection is a 2px `--sr-ink` outline plus a 2px offset — never a colour change, because colour is
  spoken for.
- The whole grid is a `<ul>` of `<button>`s in DOM reading order (AL, AK, AZ, …), so a screen reader
  gets "Ohio, at risk, 2 licences" without touching the visual layout.

### 7.2 Status is never colour alone

Four statuses, each with a colour, a **glyph**, a **hatch** and a **word**. All four ship together;
the glyph is not optional.

| Status | Colour | Glyph | Hatch (for print, and `forced-colors`) | Word |
|---|---|---|---|---|
| READY | green | **✓** check | none (solid) | READY |
| AT RISK | amber | **◑** half-filled disc | 45° diagonal | AT RISK |
| LAPSED | red | **✕** cross | dense cross-hatch | LAPSED |
| NOT TRACKED | neutral | **—** en dash | dotted | NOT TRACKED |

The half-disc for AT RISK is chosen over the conventional "!" because it encodes *partial* rather
than *alarming*: a licence 60 days out is not an emergency, it is a task, and `PERSONA.md §2.4` says
the coordinator has too many alarms already.

### 7.3 The runway (the time axis)

One horizontal axis, today at the left, twelve months at the right, with four fixed verticals at
**90 / 60 / 30 / 7 days**. Every licence is a marker on it. The gate rules are drawn as 1px
`--sr-line-strong` verticals with the day count set in mono at the top; between 30 and 0 the ground
carries the `--sr-risk-fill` wash, and past 0 the `--sr-lapsed-fill` wash.

The 90/60/30/7 cadence is not invented: it is what the direct competitor ships
([licensedtrades.com](https://licensedtrades.com/)) and what the adjacent individual-licence product
ships ([staterequirement.com](https://staterequirement.com/license-alert/), which adds a 14-day gate).
Drawing it as *structure* rather than hiding it in notification settings is the differentiation.

### 7.4 Infographic rules for the landing page and the expansion report

1. **Every infographic answers one of two questions: *where* or *when*.** If it answers neither,
   it is decoration and is cut.
2. **SVG only, inline, in palette tokens.** No raster charts, no chart library, no external requests
   beyond Google Fonts.
3. **Labels are inside the graphic, not in a legend**, wherever the geometry allows. A legend is a
   second lookup.
4. **No pie charts, no doughnuts, no gauges.** Percentages of a compliance total are the wrong
   question; the right question is *which one, and when*.
5. **Numbers are exact and sourced, or they are absent.** No illustrative "up to 40%".
6. **One accent maximum per graphic.** If a diagram needs three status colours, they must be the
   three real statuses.

---

## 8. Typography, grid, spacing, imagery, motion

### 8.1 Typefaces

Three families, allocated to StateReady exclusively by `../IDENTITY_ARBITRATION.md §3.1`. No sibling app
may use any of them, and this app may not use theirs.

| Role | Family | Weights | Fallback stack |
|---|---|---|---|
| UI and body | **Barlow** | 400, 500, 600, 700 | `"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| Signage: state tiles, column heads, runway lane labels, eyebrows | **Barlow Condensed** | 500, 600, 700 | `"Barlow Condensed", "Barlow", "Roboto Condensed", "Arial Narrow", sans-serif` |
| Numerals, licence numbers, dates, code | **Overpass Mono** | 400, 500, 600 | `"Overpass Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

**Why Barlow:** it is a low-contrast grotesk drawn from **American public and transport signage** — the
letterforms of the road, the depot and the state line. For a product whose entire subject is *what
happens when you cross a jurisdiction boundary*, that is the lineage the subject matter asks for, and it
is one no competitor can claim. It is on Google Fonts, so it costs one request and no licence. And it is
visibly *not* the category default: ServiceTitan runs Sofia Pro + Nunito Sans, Housecall Pro runs Open
Sans + Oswald + Plus Jakarta Sans (§5.2) — there is no shared incumbent face to be familiar with.

**Why a second, condensed cut:** the state tiles carry two-letter abbreviations at 40px square, the runway
carries lane labels in a 9rem gutter, and the tables carry uppercase column heads. Those are **signs**,
not prose, and a condensed signage cut is what signs are set in. Using one width for prose and another for
labels is also a *structural* typographic difference from both sibling apps, which each run a single UI
face.

**What was given up.** Public Sans's USWDS lineage was a real argument — *"the voice of the agencies whose
rules we restate"* — and it now belongs to WageLens, whose output artefact is an actual US federal form
(WH-347, OMB 1235-0008). Ours are **state** boards, not federal agencies, so the argument was always
weaker here than it read. Acceptable, and Barlow's lineage is closer to the subject anyway.

**Why a mono for numbers, and why this one:** licence numbers, expiry dates and CE hour counts are
compared down a column. `font-variant-numeric: tabular-nums` is set on every numeric surface; the mono
makes transposition errors visible, which matters when a coordinator is typing a licence number off a
card. **Overpass Mono** descends, through Overpass, from **Highway Gothic** — the US Federal Highway
Administration lettering — so the numbers are set in the family that already labels the road.

**Scale** (rem, `1rem = 16px`; every value scales with the user's root size — WCAG 1.4.4):

| Token | rem | px | Use |
|---|---:|---:|---|
| `--sr-text-2xs` | 0.6875 | 11 | tile labels, badges |
| `--sr-text-xs` | 0.75 | 12 | table meta, provenance line |
| `--sr-text-sm` | 0.875 | 14 | secondary UI, table body |
| `--sr-text-base` | 1 | 16 | body — **the floor for anything a person reads in prose** |
| `--sr-text-lg` | 1.125 | 18 | lead paragraphs, card titles |
| `--sr-text-xl` | 1.375 | 22 | section headings |
| `--sr-text-2xl` | 1.75 | 28 | page titles |
| `--sr-text-3xl` | 2.25 | 36 | the one big number |
| `--sr-text-4xl` | 3 | 48 | landing hero only |

Line height 1.5 for body, 1.25 for headings, 1.2 for the big number. Measure capped at `68ch` for
prose and `88ch` for tables.

### 8.2 Grid and layout

- **12 columns**, 24px gutter, 24px page margin (16px below 640px), content max `1280px`.
- **The app shell is a full-width bar across the top and the board beneath it** — `grid-template-rows`,
  not `grid-template-columns`. Both sibling apps run a fixed left rail (WageLens 216px, Certly 240px), so
  this is the third distinct layout structure in the fleet and it is the one a *board* asks for. The
  class is `.sr-bar`; `.sr-rail` is kept as a working alias so nothing written against the old name
  breaks. `../IDENTITY_ARBITRATION.md §3.5`.
- **The dashboard** is the canonical composition: `map (7 cols) | runway (5 cols)` above,
  `expiring list (12 cols)` below. On tablet it stacks map → runway → list. On phone the dashboard is
  read-only and the map degrades to a status list, per `PERSONA.md §11`.
- **Density.** Table rows are **48px** (`--sr-row-h`), the roomiest of the three fleet apps — WageLens
  runs 36px payroll-grid rows and Certly 44px, so the three ladder rather than converge. The 44px minimum
  target (A7) still governs every interactive element via `--sr-target-min`. A "compact" 36px mode exists
  behind a user setting for rosters over 60 technicians and is opt-in, never the default.

### 8.3 Spacing, radius, elevation

- **Space scale (4px base):** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`, tokens `--sr-space-1` … `-9`.
- **Radius:** `--sr-radius-sm 6px` (tiles, chips, inputs), `--sr-radius-md 10px` (cards, buttons),
  `--sr-radius-lg 16px` (sheets). Nothing is fully round except the status dot.
- **Elevation: nothing that rests on the board casts a shadow.** `--sr-shadow-1` and `--sr-shadow-2` are
  both `none`; a card is separated from the board by a **value step plus a hairline**, which is what
  actually works on a dark ground — a drop shadow on a near-black surface is invisible effort.
  `--sr-shadow-3` (`0 12px 32px`) belongs to the **sheet** and to nothing else, because the sheet is the
  one surface that genuinely floats. That makes three distinct shadow policies across the fleet: WageLens
  uses borders and reserves two shadows for sticky headers and modals, Certly gives cards a resting
  shadow on paper, and StateReady has none at all below the sheet. **There is no `backdrop-filter` and no
  translucency in this system** — a deliberate divergence from Clausewright, and it removes an entire
  class of contrast indeterminacy (a translucent surface has no fixed rendered colour, so its contrast
  ratio cannot be certified).

### 8.4 Imagery

- **No photography.** Not of technicians, not of trucks, not of offices. Stock photography of smiling
  tradespeople is the visual signature of every vendor in §5.2 and it competes with nothing we sell.
- **Permitted imagery:** the tile map; the runway; SVG diagrams in palette tokens; **screenshots of
  the product itself**, which are the only "photographs" a compliance buyer wants; and, on the
  methodology page, cropped screenshots **of the source board pages we cite**, each with its URL and
  the date it was captured. That last one is imagery *as evidence*, which is the only imagery this
  brand can afford.
- **The logo** is a wordmark in Barlow 700 with a single mark: a rounded square in `--sr-ready` bearing a
  check in `--sr-on-ink` — i.e. one map tile, in the state we are selling. The check inverts with the
  theme, so it is dark on the board's luminous green and light on paper's forest green.

### 8.5 Motion

- **Durations:** `--sr-dur-1 120ms` (hover, chip, checkbox), `--sr-dur-2 180ms` (panel, popover,
  status change), `--sr-dur-3 240ms` (sheet, drawer). Easing `cubic-bezier(.2,0,0,1)`.
- **Permitted motion:** opacity and 2–8px transform. **Nothing moves more than 8px.**
- **Forbidden:** map tiles animating on load (fifty things moving is noise, and it delays the answer);
  number count-ups on a deadline (a date is not a score); pulsing, blinking or looping anything;
  parallax; scroll-triggered reveals on the landing page.
- **`prefers-reduced-motion: reduce`** sets every duration to `0.01ms` — never `0`, so `transitionend`
  handlers still fire — and removes all transforms. Status changes remain visible as discrete states.

---

## 9. Component inventory

Every component ships `idle / loading / empty / error / disabled` where applicable, and every one
names its non-colour redundancy. Classes are prefixed `sr-`. All are implemented in
`design-system.css` and rendered in `identity/samples.html`.

| # | Component | Class | What it is | Non-colour redundancy |
|---:|---|---|---|---|
| 9.1 | **State map** | `.sr-map` | Tile grid of 50 states + DC; fill = status; hollow dashed = not operating | Abbreviation, glyph, count badge, DOM order, `aria-label` per tile |
| 9.2 | **Status chip** | `.sr-chip` | Inline status with glyph and word | Glyph + word, always both |
| 9.3 | **Status dot** | `.sr-dot` | 10px marker for table rows | Paired with the status word in the same cell |
| 9.3b | **Status word** | `.sr-status-text` | The status word alone, coloured, where a chip is too heavy (table cells, sentences) | Always paired with a dot or glyph — the colour is reinforcement, never the signal |
| 9.4 | **Technician roster** | `.sr-table` | Sortable table: technician, trade, states, credentials, worst status, next date | Status column carries dot **and** word; sort state announced |
| 9.5 | **Licence card** | `.sr-card--licence` | One credential: holder, class, number (mono), state, board, issued, expires, days remaining, CE progress, documents, provenance | Status bar on the left edge **and** chip in the header |
| 9.6 | **CE progress** | `.sr-meter` | Hours completed / required, with the rule stated beneath ("8 h/yr, 1 h must be Texas law") | Numeric label `6 / 8 h` always visible; never a bare bar |
| 9.7 | **Stat** | `.sr-stat` | One big number + label + optional delta | Label is a full sentence fragment, not an icon |
| 9.8 | **Renewal runway** | `.sr-runway` | Twelve-month axis with 90/60/30/7 gates and one marker per licence | Gate labels in mono; each marker has a text tooltip and a list equivalent below |
| 9.9 | **Alert feed** | `.sr-feed` | Reverse-chronological events: expiries, rule changes, imports, qualifier events | Each item is `[date] [state] [what] [what to do]` in that order |
| 9.10 | **Provenance line** | `.sr-source` | `Source: <board name> · checked <date> · confidence <high/medium>` with the URL as an ink link | **Required markup on any rendered rule.** Renders "not verified" rather than being omitted |
| 9.11 | **Expansion report** | `.sr-doc` | Long-form document surface: sectioned, printable, one column at 68ch, provenance under every requirement | Section numbers, printable at A4/Letter |
| 9.12 | **Disclaimer** | `.sr-disclaimer` | "StateReady is an information product, not a filing agent or a law firm." Persistent in the footer of every app screen and every generated document (`PLAN.md` §6) | Always text; never an icon alone |
| 9.13 | **Buttons** | `.sr-btn` `--primary/--secondary/--ghost/--danger` | Ink primary, outlined secondary, text ghost, red danger | **Exactly 0 or 1 `--primary` per screen** |
| 9.14 | **Fields** | `.sr-field` | Label above, hint below, error below that, all announced | Error carries a word, never only a red border |
| 9.15 | **Banner** | `.sr-banner` | Page-level notice (import result, coverage boundary, rule change) | Word + glyph |
| 9.16 | **Empty state** | `.sr-empty` | Title, one sentence, one action | — |
| 9.17 | **Tabs / segmented** | `.sr-tabs` | States · Technicians · Credentials · Calendar | `aria-selected`, ink underline |
| 9.18 | **Sheet** | `.sr-sheet` | Right drawer for a technician or a licence | Focus trapped, `Esc` closes, opaque |
| 9.19 | **Skeleton** | `.sr-skeleton` | Loading placeholder | No shimmer under reduced-motion |

**Accessibility commitments** (each names its criterion and its enforcement):

| # | Commitment | Criterion | Enforcement |
|---|---|---|---|
| A1 | All text clears 4.5:1; large text held to 4.5:1 anyway | 1.4.3 AA | `identity/contrast.py`, exits non-zero |
| A2 | Borders, tile edges, dots and focus rings clear 3:1 | 1.4.11 AA | same script |
| A3 | Colour is never the sole carrier of meaning | 1.4.1 A | §7.2 — glyph, hatch and word ship with every status |
| A4 | Focus is always visible: 2px ink ring + 2px offset halo in the surface colour, so it survives on paper, on card and on any status fill | 2.4.7 AA | `outline` is never `none` without a replacement in the same rule |
| A5 | Target size ≥ 44×44 px, achieved with padding or invisible hit-slop | 2.5.5 AAA (adopted) | `--sr-target-min: 2.75rem`; `.sr-hitslop` |
| A6 | Type and layout scale with root font size; survives 200% zoom | 1.4.4, 1.4.10 AA | rem-only scales; `ch` measures |
| A7 | `prefers-reduced-motion` honoured; durations to `0.01ms`, never `0` | 2.3.3 AAA (adopted) | media block in `design-system.css` |
| A8 | `forced-colors: active` handled — surfaces become `Canvas`, borders `CanvasText`, focus `Highlight`; status survives via glyph and hatch | 1.4.3 / platform | media block; `forced-color-adjust: none` used nowhere |
| A9 | Status changes announced; the alert feed is `aria-live="polite"` | 4.1.3 AA | §9.9 markup contract |
| A10 | The map is a list of buttons in reading order with per-tile labels | 1.3.1 A | §7.1 markup contract |
| A11 | Dark mode is independently authored, not a filter; no pure black ground, no pure white ink | beyond AA | §6.2 |

---

## 10. Theme policy — board, paper, print

**The board is the default and paper is fully supported.** Three states, in this precedence:

1. `data-theme="board"` / `="dark"` or `data-theme="paper"` / `="light"` on `<html>` — an explicit user
   choice, persisted, wins always and in both directions.
2. No attribute + `prefers-color-scheme: light` — the viewer has asked their OS for a light interface, so
   they get paper.
3. No attribute + no preference — **the board**.

**Rules.**

- **The board is for the operator; paper is for the forwarder.** `PERSONA.md §9` requires every artefact
  to be forwardable to someone who has never logged in, so **paper is what leaves the building**: print,
  the bid-package PDF, the shareable readiness link (J5) and every alert email. The board is the surface
  the coordinator works on.
- Both themes are **authored independently** with their own certified contrast (§6.3), not derived by
  filter or inversion.
- The board ground is `#181D1A`, not `#000`; the board ink is `#ECF2EE`, not `#FFF`. Pure black/white
  pairs cause halation for astigmatic and light-sensitive readers.
- **The status ramp is re-tuned, never reused.** Paper's READY `#146A46` would sit at roughly 2:1 on the
  board; the board's READY is `#52D09C` at 8.83:1. Fills invert to deep tints so that ink still reads on
  them.
- **Status hues and semantics never change between themes.** Green is READY in both, at 155° in both. A
  user switching themes mid-task must not have to re-learn the map.
- **Print is the paper theme, forced**, not an afterthought: `@media print` overrides `:root` and both
  board `data-theme` values, drops shadows, expands the map hatches (§7.2) so a black-and-white bid
  package still distinguishes the four statuses, and prints the provenance URLs in full after each rule.
- **Marketing shows the board.** That is a change from the original document's assumption and it is
  deliberate: the product's first impression should be the thing that makes it different. Flagged for the
  founder in `../IDENTITY_ARBITRATION.md §9.1`, which also records how to reverse it in one token swap.

---

## 11. Self-review against `PERSONA.md`

| Persona requirement | How this identity serves it | Verdict |
|---|---|---|
| §2.4 "usable in five minutes between two other jobs" | One question per screen; the map answers J5 without reading | ✅ |
| §8 J5 "answer in five seconds with something I can forward" | Tile map + shareable read-only link; no login needed to read it | ✅ |
| §9 "every artefact must be forwardable" | Alerts, reports and share links carry the map, the disclaimer and the provenance line | ✅ |
| §10 O4 "how do I know your data is right" | §9.10 provenance line is required markup, not a footer | ✅ |
| §10 O9 "who are you" | No fabricated social proof anywhere; imagery rules (§8.4) permit source screenshots as evidence | ✅ |
| §11 mobile decision | Email and the read-only card are mobile-first; the dashboard is desktop-first and says so | ✅ |
| §12 trust signals 1–6 | Provenance line, published price, stated coverage boundary, last-verified date, refusal state (§4 T2) | ✅ |
| §7 vocabulary | Status words are READY / AT RISK / LAPSED / NOT TRACKED, not "compliant"; §4 T3 bans the softeners | ✅ |
| §5 distinctness | No blue, no glass, no document hero, ink CTA, and a ground 84–88 ΔE76 from both siblings | ✅ — **verified against the finished sibling palettes on 2026-09-03 and machine-checked by `../scripts/identity-distinctness.py`** |

**Known gaps, stated rather than hidden.**

1. **Jobber's brand values were not obtained** (403 to `curl` twice; WebFetch returns markdown).
   The "avoid the category blue" argument rests on ServiceTitan, Housecall Pro and FieldEdge, which
   were all fetched. Jobber is unverified.
2. **No trademark clearance** (§1.1). The naming recommendation is availability-and-usage only.
3. **The tile-map choice is a design judgment**, not a sourced one (§7.1), and carries its own
   falsification test.
4. **Distinctness from WageLens and Certly was asserted by rule and is now verified against artefacts.**
   The check found a collision on every axis — same UI face, same mono, grounds ΔE76 0.35 apart — and
   `../IDENTITY_ARBITRATION.md` resolved it. It is now enforced by
   `../scripts/identity-distinctness.py`, which must exit 0 in CI.
5. **The dark default is the arbitration's weakest-evidenced decision and is flagged as such.** This
   buyer's own tools are light; the primary driver is mutual distinctness plus the fact that this is the
   only app in the fleet whose hero is a board rather than a document. `../IDENTITY_ARBITRATION.md §9.1`
   records the one-token reversal if the founder disagrees.
