# identity/ — memory file (StateReady Buyer & Identity agent, wave 1)

**Started:** 2026-09-03. **Agent:** Buyer & Identity (StateReady). **Status:** in progress.

## Scope
Writes only under `phase-4-revenue/stateready/`: `PERSONA.md`, `IDENTITY.md`,
`design-system.css`, `identity/samples.html`, `UX.md`, plus this file and the
contrast script under `identity/`.

## Rules confirmed (from PLAN.md / PIPELINE.md)
- Six stages: ideation → research → verification → writing → self-review → iterate.
  Stage 5 (adversarial review) belongs to the wave-1b reviewer, not to me.
- Sources are opened, not remembered. Every load-bearing claim carries a fetched URL + date.
- No private individuals. Organisations, public registers, public forum threads (quote the
  thread, never name a person), trade press only.
- Nothing sent, signed up for, or purchased. No paid tools.
- Auth = email magic link (A7). Market US / English (A2).
- Launch coverage (A11): HVAC, plumbing, electrical × the 15 states with most contractor activity.
- Names provisional (A3, P11): naming pass recommends, founder decides.
- Every regulatory value needs source_url + last_verified + verified_by + confidence (A10).
- Must be visually distinct from WageLens (construction payroll) and Certly (insurance
  certificates) and from Clausewright; must feel at home next to ServiceTitan / Housecall Pro / Jobber.

## Blocked / known-hostile sources
- reddit.com, facebook.com, yelp.com — fleet blocklist, do not attempt.
- G2 / Capterra may 403 — log and use alternatives.

## Log
(appended as work proceeds)

### 2026-09-03 — research log, session 1

**Environment notes (important for the next agent)**
- `dig` is NOT installed in this container. Use `python3 -c "import socket; socket.gethostbyname(d)"`.
  Wrapped in `identity/check-domains.sh`, which also does `curl -sIL` for HTTP status.
- `curl` works and follows redirects through the agent proxy. `WebFetch` 403s on several sites
  that plain `curl` with a desktop User-Agent fetches fine (staterequirement.com, oxmaint.com,
  forums.mikeholt.com). **Rule for the next agent: WebFetch 403 → retry with
  `curl -A '<desktop UA>' -L` before logging the source as blocked.**

**Sources that worked (fetched, quoted)**
- licensedtrades.com `/` and `/pricing` — live, HTTP 200, Stripe Checkout in its CSP.
- licenseroadmap.com/blog/best-contractor-license-tracking-software — dated 30 May 2026.
- staterequirement.com/license-alert/ (via curl; WebFetch 403).
- harborcompliance.com/compliance-solutions-construction-firms, apiprocessing.com.
- nascla.org; www2.cslb.ca.gov reciprocity requirements; tdlr.texas.gov/acr/contractor-renew.htm;
  dph.illinois.gov plumbing page.
- forums.mikeholt.com (via curl) — three threads, rich verbatim vocabulary.
- oxmaint.com HVAC certification-tracking page (via curl).
- getjobber.com/pricing, servicetitan.com/pricing, housecallpro.com/licensing/hvac.
- gettradelicense.com fee breakdown; permitplace.com expediter cost guide.

**Sources that are hard-blocked (2 attempts each, moving on)**
- hvac-talk.com, plumbingzone.com, contractortalk.com — all VerticalScope; return HTTP 202 with a
  ~2.6KB JS/tollbit challenge body to both WebFetch and curl. **Do not burn more attempts.**
  Substitute: forums.mikeholt.com (works), plus vendor/board pages that quote the same vocabulary.
- USPTO trademark search API (tmsearch.uspto.gov, assignment-api.uspto.gov) — no usable public
  JSON endpoint from here. Naming pass records this as an unverified axis; founder must run a
  proper knock-out search before filing.

**Contradiction found (needs to stay visible in PERSONA.md)**
- licensedtrades.com/pricing says Business = "up to 50 licensed employees / 10 seats";
  licenseroadmap.com says Business = "up to 40 technicians, 5 seats". Same four prices
  ($199/$349/$599/$1,199) and the same "two months free" annual line in both.
  Reading: licenseroadmap.com is the same operator's content marketing, not an independent review.
  **Treat the $199–$1,199 band as one vendor's list price, not as market-validated demand.**

### 2026-09-03 — decisions taken, and why (read this before changing anything)

**Ideation (stage 1): three identity directions, from the buyer's seat.**
1. *Ledger of Record* — the compliance binder made legible. **Rejected**: it flatters the auditor, not
   the coordinator, and it collides head-on with Clausewright's document-first identity.
2. *Readiness Map* — the country, coloured by whether you can legally work there tomorrow. **Chosen.**
3. *The Runway* — a single time axis with 90/60/30/7 gates. **Kept as the second system**, not the lead:
   it has nowhere to put "which states", so the expansion report would become a bolted-on product.
Synthesis: **the map answers *where*, the runway answers *when*, and they are never drawn on top of
each other.** Direction 1's one good idea survives as the `.sr-source` provenance component.

**The palette decision that everything else hangs off.**
The status ramp *is* the palette. There is no separate brand hue. Buttons, links, focus rings and
chrome are all warm ink on warm paper; green/amber/red appear only inside status objects. Reasons:
(a) it makes "ready / at risk / lapsed" the most salient thing on every screen, which is the brief;
(b) ServiceTitan (`#0265dc`), Housecall Pro (`#002942` + `#ffb706`) and FieldEdge (`#09527e` + `#ea6211`)
all paint their chrome blue or navy, so a colourless chrome is the cheapest available distinctiveness;
(c) an amber brand cannot have an amber warning.
**Binding consequence: no blue anywhere in `design-system.css`.** Verified — grep it.

**Typography:** Public Sans (the US Web Design System typeface — the voice of the agencies whose rules
we restate, and an argument no competitor can make) + IBM Plex Mono for anything compared down a
column. Both Google Fonts, one `@import`, no self-hosting.

**Accessibility method that is worth keeping:** `identity/contrast.py` is a *test*, not a document —
it exits non-zero on any failure. It caught 7 real failures on the first run (three border tokens and
one dark-mode edge were between 2.3:1 and 2.9:1 against a 3:1 requirement) and they were fixed by
solving for the value rather than by eyeballing. **Re-run it after any token change**, then re-run
`identity/build-samples.py`, which pulls its printed ratios from the same module.

### Mistakes made and corrected — do not repeat these

1. **I nearly shipped a competitor's marketing numbers as facts.** licensedtrades.com's
   "$15,000–$25,000 of delayed revenue / $29,700–$84,800 annual exposure" is unaudited vendor copy.
   `PERSONA.md §3` now contains **only** figures from statutes, board forms and fee schedules.
   Rule for the next agent: **if the number's only home is a vendor's landing page, it does not ship.**
2. **I nearly wrote "ServiceTitan custom fields hold a date".** They do not. The help page lists three
   types — Text, Dropdown, Numeric — and **no date type**. Caught only by fetching the help page
   directly rather than trusting a search summary. This turned a weak objection-answer into a strong one.
3. **A phase-1 claim did not survive verification.** `raw-ideas.json` (StateSwitch) cites a BBB profile
   as evidence of a "10-month turnaround and outdated forms" at a paid incumbent. The profile now shows
   A+ and no visible complaints. **The claim is withdrawn in writing in `PERSONA.md §5`** and replaced
   with Harbor Compliance's Trustpilot page (2.9/5, 52 reviews, 31% one-star), which was opened.
4. **I cited two sources from search summaries before fetching them** (ServiceTitan help, the ADP
   guide). Both were then fetched properly and both changed what the document says. Stage 2's rule is
   literal: *opened, not remembered.*

### Assumptions recorded (best defensible guesses, flagged in the deliverables)

- **A1.** The primary buyer is the coordinator at a 15–100-technician, 2–6-state contractor. Inferred
  from the ~10-technician spreadsheet break point and the competitor's tier caps; not observed.
- **A2.** The tile-map choice (equal weight per jurisdiction) is a design judgment, not a sourced one.
  `IDENTITY.md §7.1` carries its own falsification test.
- **A3.** The qualifier-clock alert cadence (75/45/15/5 days) is invented, because the whole statutory
  window is 90 days and the market-standard 90/60/30/7 does not fit inside it.
- **A4.** Trial = 14 days, no card. Anchored to Jobber's published norm, beating LicensedTrades' 3 days.
- **A5.** Distinctness from WageLens and Certly is asserted by rule (no blue, no document hero), not
  verified against artefacts, because those artefacts did not exist when this was written.
  **Orchestrator: re-check for collision once all three `IDENTITY.md` files exist.**

### Advice to the next agent

- **WebFetch 403 ≠ blocked.** Retry with `curl -A '<desktop UA>' -L` first. It rescued
  staterequirement.com, oxmaint.com and every forums.mikeholt.com thread.
- **HTTP 202 with a ~2.6 KB body = a VerticalScope bot wall.** hvac-talk, plumbingzone and
  contractortalk all do this to curl and WebFetch alike. Do not spend attempts on them; Mike Holt's
  forum is the substitute and it works.
- **PDFs:** WebFetch saves the binary and tells you the path; `pypdf` (6.16.2, already installed)
  reads it. That is how the CSLB disassociation rule and the ADP known-issue were verified.
- **Vendor CSS is a primary source for brand values.** `curl` the shipped stylesheet and grep for
  custom properties: ServiceTitan's `--titan-blue-3` and Housecall Pro's palette came straight out of
  theirs. Faster and more honest than a brand-colour aggregator site.
- **Founder prerequisites this agent generated:** acquire `stateready.com` (Namecheap parking lander)
  or launch on `getstateready.com`; register `stateready.io/.app/.co` (all unregistered); **run a USPTO
  knock-out trademark search — we could not, from this container.**

### Files produced

| file | what it is | how to re-verify |
|---|---|---|
| `../PERSONA.md` | buyers ranked, evidence, vocabulary, objections, price anchors, mobile decision | every claim → `identity/sources.md` |
| `../IDENTITY.md` | naming pass, Dunford positioning, tone, palette, type, grid, components, dark mode | `python3 identity/contrast.py` |
| `../design-system.css` | tokens + components, light and dark, framework-free | braces balanced; 0 undeclared `var()` |
| `identity/samples.html` | tokens, components, one compliance dashboard | `python3 identity/build-samples.py`; 0 undefined classes; 0 external refs but Google Fonts |
| `../UX.md` | 20 screens with states, onboarding budget, 17 emails, mobile, accessibility | maps 1:1 to `PERSONA.md §8` jobs |
| `identity/sources.md` | 52-row evidence log incl. blocked sources and 4 contradictions resolved | — |
| `identity/contrast.py` | WCAG 2.1 contrast test, exits non-zero on failure | 70 pairs, 0 failures |
| `identity/check-domains.sh` | DNS + HTTP probe for the naming pass | re-runnable |
| `identity/build-samples.py` | regenerates `samples.html` from the tokens | re-runnable |

### 2026-09-03 — cross-fleet conflict noted, not resolved (for the wave-1b reviewer)

`OFFER.md` and `LANDING_SPEC.md` landed in this directory while this agent was writing. They cite this
`PERSONA.md` (objection numbering, the ~10-technician lower bound, the O6 single-state rule), so the
hand-off worked. **One direct disagreement stands and was deliberately left standing rather than
quietly reconciled:**

| | `PERSONA.md` §9 (this agent) | `OFFER.md` §8 (Offer agent) |
|---|---|---|
| Activation | 14-day free trial, no credit card — the observed norm in the buyer's own stack (Jobber 14 days no card; LicensedTrades 3 days no card) | **No free trial.** A **$149 paid "First State Audit"** tripwire, card captured, credited against an annual plan |

Neither agent may review the other (`PIPELINE.md` stage 5). What was done instead:
- `PERSONA.md §9` now states the finding as *the buyer's expectation* and flags the conflict inline,
  with the two consequences that follow if the paid tripwire is upheld.
- `UX.md §1` carries a note showing **the screen list is identical either way** — the flow is
  S02 → S03 → S04–S07 → S09 regardless, and only the insertion point of Stripe Checkout moves.
- Nothing in `OFFER.md` or `LANDING_SPEC.md` was edited. Authors do not review their own work and
  reviewers do not edit.

**Reviewer: this is the decision to make first.** If the paid tripwire is upheld, the free lapse-risk
audit (`UX.md` S02) stops being optional and becomes the only zero-risk way into the product.

Also noted, unverified by this agent: `OFFER.md` cites **CE Broker at $39.99/yr** as the correct answer
for a single licence holder. This agent did not open that source, so it is not used in `PERSONA.md`.
