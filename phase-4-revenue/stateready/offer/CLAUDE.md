# offer/ — memory file (StateReady Offer & Landing agent, wave 1)

**Started / finished:** 2026-09-03. **Agent:** Offer & Landing (StateReady), phase-4 fleet.
**Status:** wave-1 deliverables complete, awaiting the wave-1b reviewer.

## Scope
Wrote only under `phase-4-revenue/stateready/`:
- `OFFER.md`, `LANDING_SPEC.md`
- `offer/RESEARCH.md`, `offer/CLAUDE.md` (this file), `offer/raw/` (cached fetches + extracted PDF text)

No code. No commits, no pushes, no sign-ups, no sending, no purchases. Nothing under `apps/`.

## Rules confirmed (PLAN.md / PIPELINE.md)
- Six stages: ideation → research → verification → writing → review → iterate. **Stage 5 is the wave-1b
  reviewer's, not mine.** I did a self-check (`OFFER.md` §13), not a review.
- Sources are opened, not remembered. Every load-bearing claim carries a fetched URL and a date.
- A5: offers are *proposed* with guarantees flagged; the founder validates before Stripe goes live.
  → `OFFER.md` §5.2 exists specifically to give the founder something to decide.
- D2: the founder creates Stripe products from a list we hand over; apps read price ids from env.
  → `OFFER.md` §12 is that list, with env var names.
- A10: every regulatory value needs `source_url` + `last_verified`. **This constrains what the landing
  page is allowed to claim**, which turned out to be the most consequential rule in the whole brief
  (`LANDING_SPEC.md` §11).
- A11: launch coverage = HVAC, plumbing, electrical × 15 highest-activity states. The demo and FAQ Q6 must
  render coverage from the KB and refuse the rest.
- A3: name is provisional. `LANDING_SPEC.md` names no wordmark, no colours, no typefaces — only roles.
- D5: no nominative contact data. The outbound email angle uses company-published facts only.
- Never invent testimonials, numbers or logos. See "the trap" below.

## The three findings the next agent most needs

### 1. Phase 1's willingness-to-pay premise is refuted
The shortlist says WTP is *observed* because "LicensedTrades.com already sells $199–1,199/mo".
**It sells nothing.** licensedtrades.com and licenseroadmap.com share the footer
*"© 2026 Rovaryn Digital Inc. … Built by Rovaryn Digital Inc."*, both have **"Join the Waitlist"** as
their primary CTA, and LicenseRoadmap's "Best Contractor License Tracking Software (2026)" article is
bylined *"By Rovaryn Digital"* and top-rates its own sibling product at the **identical** $199/$349/$599/
$1,199 ladder. Two of six phase-1 evidence URLs collapse to one pre-launch operator.
→ Escalate to the orchestrator: `phase-1-ideation/shortlist.json` StateReady `summary` should be corrected.
→ Prices in `OFFER.md` are rebuilt on what *is* transacted: **$399+/application** (expediters) and
  **$39.99–$499/year** (trackers).

### 2. Tracking is a commodity at a tenth of our target price
CE Broker (Propelus) Professional is **$39.99/yr** for an individual; StateRequirement License Alert is
**$99–$499/yr** for 1–10 licences. **StateReady therefore cannot be sold as "a tracker" at $149–$599/mo.**
It is sold on (a) per-state × per-trade cited requirement intelligence and (b) the ability to enter a new
state. Anyone writing copy for this product who reaches for "never miss a renewal again" as the *whole*
promise has priced us into a $99/yr category.

### 3. Every loss figure published in this category is an unsourced vendor estimate
LicensedTrades publishes "$15,000–$25,000 in lost and delayed revenue", "total annual exposure
$29,700–$84,800/year"; LicenseRoadmap publishes "$5,000–$25,000 per incident". **None carry a source, and
both companies have no customers.** Under A10 we may not reuse, paraphrase or match them.
**The replacement is better:** the regulators state the consequence for us, quotably —
CSLB *"You cannot actively contract with an expired, inactive, or suspended license."*; NYC DOB
*"Licensee's license and insurance information must be active and current."*; municipal §4-402(d)
*"No building permit shall be issued to any contractor … whose license has been suspended or revoked."*
This is why `LANDING_SPEC.md` §4 is three quotes and no commentary.

## What worked
- **Fetching raw HTML with curl + a browser UA and grepping it**, rather than relying on the fetch tool's
  summary. That is how the Rovaryn footer and the 3-day (not 14-day) trial were found. Two summaries had
  already told me the wrong thing.
- **Extracting the Wiebe PDF with pypdf** (`offer/raw/wiebe-landing-copy.txt`) — the fetch tool returned
  binary. The 103%-lift headline experiment is in there and it is the best single data point in the file.
- **Going to the regulator for copy.** With no customers we cannot use voice-of-customer, the highest-
  leverage technique in the literature. State boards are the next best voice and they are citable.
- **Counting the specified copy in Python** before claiming the page met its budget. It came to 386 words;
  my first estimate had been wrong in three sections.

## What failed / blocked (two attempts each, then logged)
| Source | Outcome |
|---|---|
| `contractorlicensingpros.com/reciprocity/` | 403 via both WebFetch and curl |
| `harborcompliance.com/business-licensing`, `/pricing`, `/business-license-services` | 404. Harbor Compliance publishes no price; quote-only confirmed from the construction-solutions page |
| CSC (`cscglobal.com`) licensing pages | 404 on both candidate URLs. Only the "Business license solutions" nav label confirmed |
| **"RCI"** (named in the brief as an expediter) | **No firm of that name found** in contractor-licence expediting after two searches. Not used anywhere. If the founder meant a specific firm, it needs naming |
| `marketplace.servicetitan.com/partners`, `/apps` | 404 / JS-only. The negative finding rests on the category list + the published integrations doc |
| Capterra — Harbor Compliance | Fetched, but **0 reviews**. There is no review corpus in this category |
| `staterequirement.com/license-alert/` | 403 via WebFetch; **succeeded via curl with a browser UA** — worth remembering |
| Hormozi / Suby primary text | Not fetchable. Frameworks cited from acquisition.com's module structure + a documented breakdown, cross-checked against `phase-1-ideation/research/03-gtm-pricing.md` |

## Assumptions taken (best defensible guess, flag for the founder)
| # | Assumption | Basis | How to kill it |
|---|---|---|---|
| A1 | **The done-for-you roster build can be largely automated** from public state licence registers | It is the single highest-leverage element of the offer (Effort 4→8) and the $149 audit is loss-making without it | Product Owner to confirm register-scraping feasibility for the 15 launch states **before** this offer ships. If it cannot be automated, the Rollout Guarantee is dangerous |
| A2 | **States is the right tier metric**, technicians the guardrail | States is our real cost driver and the buyer's own mental model; technicians prices a 60-tech single-state shop wrongly | First 20 outbound conversations. If buyers consistently ask "how many users?", the market's mental model is seats and we adapt |
| A3 | **A $149 paid audit beats a free trial** | Poyar: card-gated trials convert 5× better; our time-to-value is gated by data entry, not attention | `OFFER.md` §8 escape hatch: after ~50 conversations, fall back to a 14-day card-required trial with the roster build done by us |
| A4 | **$1,500 list / $750 first state** for the Entry Pack | Above one expediter application ($399) and below a quote-gated multi-state engagement | If nobody buys at $750, the problem is likelihood, not price — do not discount, add proof |
| A5 | Enterprise is **quote-only with no Stripe price** | We have no basis for a number, and inventing one would violate the same discipline as inventing a statistic | First three enterprise conversations |
| A6 | Illinois plumber **CE hour count** is not publishable yet | IDPH confirms the **April 30** deadline and the annual obligation; the hour count is secondary-source only | KB verifies at an IDPH rule citation, or it never appears |
| A7 | ~~Buyer definitions are provisional~~ **RESOLVED.** `PERSONA.md` landed mid-draft, was read in full and reconciled (`RESEARCH.md` §7b) | Buyer band, the third buyer, and the canonical numbers table are now PERSONA's | **`IDENTITY.md` is still outstanding.** `LANDING_SPEC.md` names only role tokens (`--sr-accent`, `--sr-status-ok`); wave 1b must bind them to `design-system.css` |

## Mistakes I nearly made, recorded so the next agent does not
1. **Reusing the competitor's loss figures.** They are vivid, specific and completely unsourced. They
   would have failed A10 and, worse, would have made our own cited data look like the same kind of thing.
2. **Trusting a search summary over the page.** Two summaries were wrong in this session (14-day trial;
   "independent" competitor review). Open the page.
3. **Writing a subscription-first offer.** It is the obvious reading of the brief and it walks straight
   into the $99/yr tracker category. The one-off has to lead; see `RESEARCH.md` §1.1.
4. **Offering "if we miss a renewal we pay the reinstatement fee."** It is the natural guarantee here and
   it is an uninsured insurance contract with unprovable causation and adverse selection. `OFFER.md` §5.2
   is the argument; §5.3 is the safe version.

## The reconciliation with PERSONA.md, and the one thing it caught me on

`PERSONA.md` was written in parallel and landed while I was drafting. It was read in full and reconciled;
`RESEARCH.md` §7b is the table of differences. The two documents were produced independently and agreed on
the primary buyer, on refusing to reuse competitor loss figures, and — by a different route — on the
$199–$1,199 band being a list price rather than a demand signal. **PERSONA also found a second, independent
proof of the same-operator finding that I missed:** LicenseRoadmap's "review" contradicts its own sibling's
published tier caps (40 technicians / 5 seats vs the vendor page's 50 / 10).

**The correction that matters, and it was mine:** I concluded from the two app marketplaces that the FSM
platforms "do not do this". **Housecall Pro does.** Its own page offers *"built-in tools to store documents,
track expiration dates, and set automatic renewal reminders"*
([housecallpro.com/licensing/hvac](https://www.housecallpro.com/licensing/hvac/), verified by me after
PERSONA flagged it). The marketplace finding was true; the conclusion I drew from it was too broad, and it
would have shipped a claim any prospect could falsify with one tab.

**The permitted claim, everywhere, from now on: *they store the date; they do not hold the rule.*** That is
narrower, true, and stronger — it says the commodity is the reminder (already free inside a platform the
buyer pays for) and the product is the rulebook. `LANDING_SPEC.md` §11 now bans the false version outright.

**Also adopted from PERSONA §3**, which has better ammunition than I found: Cal. B&P **§7031** (no action to
collect compensation for unlicensed work; the customer may recover all compensation paid) — which I
**re-verified independently at leginfo**, satisfying A10's two-agent rule, and which now replaces the
municipal permit clause as the third quote on the landing page; **SB 779** ($1,500–$15,000 from 1 July
2026); TDLR's **×1.5 / ×2** late-renewal multipliers; and CSLB's **90-day qualifier suspension**.
**`PERSONA.md` §3 is the canonical numbers table.** Where it and `RESEARCH.md` both carry a figure, PERSONA
wins.

## The reconciliation with IDENTITY.md, and the headline it changed

`IDENTITY.md` landed after `PERSONA.md` and is binding on `LANDING_SPEC.md`. It overrode a first draft in
four places, and every one of the overrides is right:

1. **The map is a tile grid, not a geographic choropleth** (§7.1). A geographic map sizes states by land
   area; a contractor's exposure has nothing to do with acreage. **Side benefit I had not anticipated:**
   tiles are `<rect>`s, so V1 drops from ~28 KB of paths to ≤ 8 KB, which recovered most of the SVG
   performance budget.
2. **Status is never colour alone** (§7.2) — colour + glyph + hatch + word, all four, always. My first
   draft used colour plus a legend.
3. **Motion on load, pulsing, and scroll-triggered reveals are forbidden on the landing page** (§8.5).
   My first draft specified three animated diagrams. **All three are gone.** The identity's reasoning is
   better than mine was: fifty things moving delays the answer, and a date is not a score.
4. **Public Sans + IBM Plex Mono from Google Fonts** (§8.1), not a system stack. Public Sans is the USWDS
   typeface — literally the voice of the agencies whose rules we restate, which is an argument no
   competitor can make. Worth the 70 KB.

**And the change that matters most — the headline.** My chosen H1 was *"No job stops because a licence
expired."* `IDENTITY.md` §2 prohibits "guaranteed compliance" claims and `OFFER.md` §5 is built on
guaranteeing what we control and never the customer's outcome. **That headline promised an outcome the
guarantee section refuses to stand behind**, and a page may not claim what its own guarantee walks back.

**Replaced with: "Your spreadsheet knows the date. It doesn't know the rule."**
It is better on every axis and it came out of PERSONA's research, not mine: §2.2 concludes independently
that *"Every one of methods 1–5 is a place to store a date. None of them is a place to store a rule."*
Two agents reached the same sentence by different routes — which, for a company with no customers and
therefore no voice-of-customer data, is the closest thing to validation available. It is also the only
headline that survives the Housecall Pro objection rather than colliding with it.

The old headline survives as A/B challenger #1, explicitly **gated on a founder decision** about the
outcome-promise risk — flagged in `LANDING_SPEC.md` §10 as a risk gate, not a copy preference.

## Advice to the next agent
- **The demo is the product's marketing.** `LANDING_SPEC.md` §12. It must read the same knowledge base the
  app reads — not a fixture, not a copy. If the demo and the app can disagree, the demo becomes a liability
  instead of the proof.
- **`lp_demo_query` with `was_covered=false` is the most valuable event on the page.** It is a ranked KB
  backlog, generated by prospects, for free. Do not drop it in implementation.
- **The source chip (V5) is the brand.** If the identity agent designs one component carefully, that is the
  one. Every regulatory value on every surface carries it, and a value with no verified source renders
  "not yet verified for this state" rather than a number.
- **The offer's binding constraint is Perceived Likelihood (3/10), not price.** Every proposed change
  should be tested against "does this make a stranger more willing to believe our dates are right?" If it
  does not, it is decoration.
- **Do not reintroduce animation.** It will be tempting; `IDENTITY.md` §8.5 forbids it and the page is
  better without it. If a diagram needs motion to make its point, the diagram is wrong.
- **Reconcile with the Product Owner on coverage before launch.** FAQ Q6 and the demo both promise the
  truth about what we cover. An offer that outruns its data destroys the one thing everything else rests on.
