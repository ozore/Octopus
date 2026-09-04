# Certly — Offer & Landing agent memory

**Agent:** Offer & Landing (wave 1). **Started:** 2026-09-03.
**Working dir (write-only scope):** `/home/user/Octopus/phase-4-revenue/certly/` — `OFFER.md`, `LANDING_SPEC.md`, `offer/`.
**Deliverables:** `offer/RESEARCH.md`, `OFFER.md`, `LANDING_SPEC.md`, this file.

## Status — all stages I own are complete
- [x] Read PLAN.md, PIPELINE.md, shortlist.json #7, raw-ideas.json #47, certly-pm/README.md, certly-gc/README.md, 03-gtm-pricing.md, identity landing index.html structure, KNOWLEDGE_BASE.md, PERSONA.md
- [x] Stage 1 ideation — 3 offer angles (O-A/O-B/O-C) + 3 page angles (P-1/P-2/P-3), `RESEARCH.md` §1
- [x] Stage 2 research — **42 unique URLs across 27 hosts**, all fetched, `RESEARCH.md` §Sources
- [x] Stage 3 verification — incumbent pricing pages re-opened; 3 competitor-sourced claims failed and are logged, not used (`RESEARCH.md` §2.4)
- [x] Stage 4 writing — `offer/RESEARCH.md`, `OFFER.md`, `LANDING_SPEC.md`
- [x] Stage 4 self-check — word budget counted mechanically (395/450); source count checked; "stupid to say no" test run and **honestly failed on one term** (`OFFER.md` §13.1)
- [ ] Stage 5 review — not mine (wave 1b)
- [ ] Stage 6 iteration — pending reviewer

## Sibling dependency — how it actually played out
`PERSONA.md` / `IDENTITY.md` **did not exist** when this agent started (19:53) or when `RESEARCH.md`
and `OFFER.md` were written. `PERSONA.md` landed at ~20:07 and was read before `LANDING_SPEC.md`.
It **independently reaches the same conclusions** — Buyer A is the PM/HOA operations & compliance
coordinator, the anti-demo thesis holds, and $99–$299 sits between the buyer's PMS bill and the
incumbents' $10k minimum. That is convergence, not coordination; the reviewer should treat it as a
cross-check, not as corroboration. `IDENTITY.md` and `design-system.css` still did not exist, so
`LANDING_SPEC.md` names **semantic tokens only** (`--state-met`, `--state-asserted`, `--state-gap`)
and specifies no colour, type or component. Binding it to the identity system requires no edit here.

## >>> BLOCKING CONTRADICTION FOR THE WAVE-1B REVIEWER <<<
`PERSONA.md` §2.5 / §2.9.4 instructs the status word **"Covered"** ("41 of 47 vendors covered"),
chosen deliberately over "compliant".
`KNOWLEDGE_BASE.md` §F makes it a **binding copy invariant** that Certly "never says *verified*,
*compliant* or *covered* as a bare assertion about a policy".
The word sits in the product's primary status chip and the portfolio summary line, so it is
load-bearing. `LANDING_SPEC.md` follows §F ("meets your requirement") because `OFFER.md` §6.2 L1
identifies exactly this drift — "we warned you" → "you are covered" — as the offer's highest-severity
liability. **Referred for a ruling.** If overturned, exactly three places change: the V1 state label,
the pricing comparison table row, and the portfolio summary line. Nothing else depends on it.

## Also for the orchestrator
`PERSONA.md` §9 open question 1 says "Evident (evidentid.com) was not reached in this pass."
**It was reached here** — fetched 2026-09-03; headline "AI-Powered Supplier Risk Management",
"Stop reacting to risk. Start getting ahead of it.", "85% reduction in administrative burden",
"96% on-time", CTA "Book a Demo", **no published pricing**. `RESEARCH.md` §2.1–2.2 carries it.
That open question can be closed.

## Log
- 2026-09-03 19:55 — workspace created; PLAN/PIPELINE/product context read.
- 2026-09-03 ~20:00 — research and verification; F1 (the wedge is job, not price) found and everything re-planned around it.
- 2026-09-03 ~20:15 — `RESEARCH.md`, `OFFER.md`, `LANDING_SPEC.md` written; word budget counted, source count checked, citations audited (one unfetched Suby summary caught and downgraded).

## The finding that changed the plan (2026-09-03)
Phase-1 ideation assumed the down-market self-serve wedge was **empty** ("both demo-gated enterprise").
That premise is **false as of 2026-09-03**. Fetched and verified:
- **COI Tracker** (`coitracker.co/pricing`): free/10 vendors, $29/25, $59/100, $129/unlimited, self-serve,
  magic link. Its feature list has **no extraction, no requirement matching, no endorsement checking,
  no agent chasing** — it is a reminder + storage tool.
- **TrackMyVendor** (`trackmyvendor.com/property-manager-compliance`): free 25 vendors, self-serve,
  explicitly targets property managers.
- **bcs** (`getbcs.com/pricing`): free up to 25 vendors permanently; self-service **$0.95/vendor/month**;
  full-service $17.80/vendor/year with a **$10,000 annual minimum**.

Consequence: the wedge is **not price**, it is **job**. The cheap band tracks *dates*; nobody below
enterprise *verifies coverage*. Every offer and page decision below flows from that.

## Verified demo-gating (stage 3)
| vendor | evidence |
|---|---|
| TrustLayer | `/pricing` 404; FAQ "Please schedule a demo to learn more"; Capterra "Contact vendor", no free trial |
| Jones | `/pricing/` published *metric* ("records per year") but no dollars; CTA "Talk to an Expert" |
| illumend (myCOI) | "Schedule Demo" / "Calculate Your ROI"; no prices |
| Certificial | "Get a Demo" |
| Evident | "Book a Demo"; Pricing nav item leads to demo |
| SmartCompliance | "REQUEST A DEMO"; `/pricing/` 404 |

## Contradictions logged (unresolved, flagged not used)
1. bcs's own comparison blog claims SmartCompliance "pricing is transparent… starts at $1,000 per year".
   SmartCompliance's own homepage shows **no price** and demo-gates; `/pricing/` 404s. Primary source wins:
   treated as demo-gated. bcs figure carried as *secondary, competitor-sourced*.
2. bcs blog claims "TrustLayer: free tier available but limited". `trustlayer.io/free-coi-tracker` 404s;
   Capterra records **no free trial / free version**. The only free things on trustlayer.io are a
   "TrustScore". Claim **not** used.
3. bcs blog claims CertFocus publishes $6–8/vendor/yr. `certfocus.com/pricing/` returned 503 twice.
   Carried as secondary only.

## Failures (2 attempts each, then moved on)
- `mycoi.com` resolves to **My Corporate Office, Inc.**, an unrelated business-services firm. myCOI the
  COI tracker now trades as **illumend.ai**; `mycoitracking.com` 301s to illumend.ai. Do not cite mycoi.com.
- `g2.com`, `trustradius.com` → 403. Reviews taken from Capterra instead.
- `irmi.com` expert-commentary article URLs → 404. Used IRMI's glossary term page + the ISO form itself.
- `cxl.com/blog/b2b-saas-landing-pages/`, `unbounce.com/conversion-benchmark-report/saas-landing-page-conversion-rates/`,
  `paddle.com/resources/pricing-strategy-guide`, `acquisition.com/hormozi-value-equation` → 404. Found live equivalents.
- Hormozi/Price-Intelligently PDFs returned binary to WebFetch; extracted locally with `pypdf`. Works.

## Assumptions (best defensible guesses, flag to founder)
- **A1.** Primary buyer = property & association managers (`certly-pm`), per the brief's default,
  because `PERSONA.md` did not exist at write time. **Since confirmed** by `PERSONA.md` §1/§7.1.
- **A2.** "Certificates tracked" is redefined as **active certificates** = one current certificate per
  vendor/tenant/sub. Renewals of the same vendor do not re-count. Reason: every fetched competitor meters
  per *vendor/record* (Jones "records per year… unlimited COIs for that record"; bcs per vendor;
  COI Tracker per vendor). A per-document meter would read as a punishment for renewals — the one event
  the product exists to cause.
- **A3.** No renewal-seasonality claim is made anywhere: no source was found for "most policies renew 1/1".
  Urgency is taken from the customer's own earliest expiry date instead, which is real and specific.

## What worked (advice to the next agent on this workspace)
- **Open the competitor's *pricing* page, not the homepage.** `getbcs.com/pricing` and
  `coitracker.co/pricing` produced the two facts the whole offer turns on. A 404 on a pricing page
  (`trustlayer.io/pricing`, `smartcompliance.co/pricing/`) is itself evidence — cite the 404.
- **A competitor's comparison blog is a lead list, never a fact.** Three of bcs's claims about rivals
  failed when tested against the rival's own site. Test every one; cite the primary or say "X claims".
- **PDFs come back as binary from WebFetch but are saved to disk** — the path is printed in the result.
  `python3 -c "import pypdf; ..."` recovers the text. That is how the Hormozi checklists, the Price
  Intelligently book and the ISO CG 20 37 form got read. Do not give up on a PDF source.
- **The repo's own `kb-samples/` beat the open web** for the single best quotation on the page (the
  ACORD 25 notice). Look inside the repo before searching outside it.
- **Count the word budget with a script, don't estimate it.** My hand estimate was 387; the real
  number was 395. Small, but the whole fleet's credibility rests on numbers being counted.

## What I would tell the builder
1. The **half-filled dot** for `asserted_only` is the product's most valuable visual asset. It must be
   legible at 16px and must never be a shade of the met/gap colours. Build it once, use it everywhere.
2. The **no-login demo results must be pre-computed and cached** (real extraction, cached output). A
   live model call in the hero puts the page's single most important interaction behind a latency and
   availability risk.
3. The demo ships with **sample certificates only**. The upload variant needs a legal read and eight
   named conditions (`LANDING_SPEC.md` §8.2), not an engineering decision.
4. **No accuracy number ships until it is measured with its denominator.** Jones publishes 99.73%
   monitored weekly; competing with an invented number is how this brand dies.
