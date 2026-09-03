# identity/CLAUDE.md — memory of the Certly Buyer & Identity agent

**Agent:** Buyer & Identity, Certly, wave 1, phase-4 fleet.
**Started:** 2026-09-03. **Working dir:** `phase-4-revenue/certly/`.
**Deliverables:** `PERSONA.md`, `IDENTITY.md`, `design-system.css`, `identity/samples.html`, `UX.md`.

## Rules confirmed at the start (from PLAN.md / PIPELINE.md, re-read, not remembered)

- Six stages: ideation → research → verification → writing → review → iteration. I own stages 1-4 and 6; a
  different agent reviews (wave 1b). I must not review my own work, and I must not edit anyone else's.
- Five pillars in the brief: goals, constraints, format, failure, memory. This file is the memory pillar.
- **Sources are opened, not remembered.** Every load-bearing claim carries a fetched URL and a date.
- No private individuals anywhere. Organisations, public registers, public forums quoted without usernames.
- Nothing is signed up for, purchased or sent. No paid tools.
- Write only under `phase-4-revenue/certly/`. Do not commit, do not push.
- Launch scope for the product is **ACORD 25 only** (PLAN.md A11). Everything I design must survive that.
- Auth is **email magic link**, no OAuth (PLAN.md A7). Billing is Stripe self-serve (D2).
- Hosting Vercel, no custom domain yet (D3) — so the naming pass is a *branding* decision, not a blocker.
- Extraction accuracy is a named risk (PLAN.md §6): "confidence score per field, 'needs review' state".
  The design system therefore has to make confidence a first-class visual, not a tooltip.

## Status

| stage | state |
|---|---|
| 1 ideation (3 identity directions) | done — see "Three identity directions" below; direction C chosen |
| 2 research | done — 30+ sources fetched, logged in `research/sources.md` |
| 3 verification | done — every load-bearing number re-fetched at a first-party source; contradictions logged below |
| 4 writing | done — PERSONA.md, IDENTITY.md, design-system.css, identity/samples.html, UX.md |
| 4b self-review | done — one full adversarial pass; the fixes it produced are listed under "What the self-review changed" |
| 5 review | not mine (wave 1b reviewer) |
| 6 iteration | pending reviewer |

## Three identity directions (stage 1), and the choice

Full reasoning in `IDENTITY.md §1`. Summarised here so the next agent does not have to re-derive it.

- **A "The Clipboard"** — field-ops utility, safety chroma, jobsite grammar; would sit beside Procore,
  whose served tokens really are named `gray-asphalt`, `gray-rebar`, `yellow-crane` with a `theme-color`
  of `#FF5200`. **Rejected**: it is the GC's dialect and the first buyer is a PM at a desk; and a
  safety-orange brand hue is one step from the amber that must mean *expiring*.
- **B "The Underwriter"** — ink, ivory, a document serif, certificate framing. **Rejected**: it looks like
  the enterprise/legal product this ICP already decided it was too small for, and it crowds Clausewright,
  which owns document-serif gravitas in this repo.
- **C "The Status Board"** — **chosen**. Coverage as a state over time; a calm paper ground and one dark
  ink; the only chroma on screen is the four-state semantic system; the signature device is the coverage
  bar, where a gap is literally a hole. The domain model *is* the design system.

## What worked

- **Government sites carry the primary documents.** New York's Department of Financial Services publishes
  the blank **ACORD 25 (2025/12)**. That one PDF gave the complete field list, the two checkbox columns
  (`ADDL INSD`, `SUBR WVD`) that are the hardest and most valuable extraction targets, and the verbatim
  disclaimer — *"THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE
  CERTIFICATE HOLDER"* — which is now the backbone of the product's honesty rules. It beats every vendor
  explainer of the form. Text kept in `identity/research/acord25-form-text.txt`.
- **First-party PDFs beat review sites for the vendor-fee story.** The Solomon Organization's VendorShield
  flyer and South Metro Housing Options' RealPage/Compliance Depot letter both state, in their own words,
  the annual fee the *vendor* pays ($110; $99 onsite / $80 offsite). No secondary source needed.
  PDFs came back as binary through WebFetch — `/tmp/pdftxt.py` (a 15-line zlib + `(...)` text extractor)
  recovered the text. Keep that trick.
- **Capterra and SoftwareAdvice are fetchable; G2 is not** (403). Capterra gave verbatim myCOI cons.
- **Vendor comparison blogs are usable if you treat them as adversarial**: getbcs, getjones, illumend and
  vertikalrms all publish competitor pricing. Where two competitors agree on a third's number, I used it;
  where only the rival says it, I labelled it as a rival's claim.
- **Scraping design tokens out of served HTML is a legitimate source of *visual* evidence.**
  `curl -sL https://www.procore.com/ | grep -oE '--pc-colors-[a-z0-9-]+:#[0-9a-fA-F]{3,8}' | sort -u`
  returned Procore's whole palette. Buildium, Jones, AppFolio, Yardi, TrustLayer, bcs, Certificial,
  illumend and Buildertrend expose nothing, so **no visual claim is made about any of them** anywhere.
- **DNS-over-HTTPS is the only resolver here.** `dig` is not installed and `getent`/system DNS returns
  127.0.0.1 for everything. Use `curl -s "https://dns.google/resolve?name=X&type=SOA"` and read `Status`:
  `3` = NXDOMAIN (domain free), `0` = registered, `2` = SERVFAIL (recheck, usually registered but broken).
  NS values also tell you the *kind* of holder: `namebrightdns`, `afternic`, `hugedomains`, `sedoparking`,
  `atom.com`, `squadhelp` = parked for sale; `cloudflare`/`vercel-dns`/`azure-dns` = someone is using it.

## What failed (2 attempts each, then logged and moved on)

| source | what happened | workaround used |
|---|---|---|
| g2.com | HTTP 403 to WebFetch | Capterra + SoftwareAdvice for the same products |
| contractortalk.com | 307 → `tollbit.` paywall → HTTP 402 Payment Required | first-party PM vendor packets (Solomon, South Metro) for the same fact |
| trademarks.justia.com | HTTP 403 | WebSearch over the same corpus; USPTO left as a founder to-do |
| tmsearch.uspto.gov API | S3 `NoSuchKey` / `MethodNotAllowed` — no public JSON endpoint at that path | logged; formal clearance is a founder/lawyer task, flagged in IDENTITY.md |
| trustlayer.io/pricing | HTTP 404 — **there is no pricing page** | their own FAQ, which says "schedule a demo" |
| fpimgt.com vendor PDF | HTTP 503 twice | South Metro packet instead |
| vendorshield.app | HTTP 503 / empty body | left out; the $490/yr figure in a search summary is **not** used anywhere |
| narpm.org, caionline.org | not attempted — phase-3 notes say chapter pages are client-rendered/403 | association angle sourced from IREM/CAI-adjacent public articles instead |

## Assumptions (best defensible guesses, written down because they are not sourced)

1. **A1 — Certificate volume per buyer.** No public source gives certificates-per-firm for the ICP band.
   I model the PM firm at 25-120 active vendor certs plus tenant certs, and the GC at 20-150 sub certs,
   straight from the phase-3 ICP definitions. Used only to size tiers and empty states, never quoted as fact.
2. **A2 — "5 minutes to a requirement template" is a design target, not an observed benchmark.** It comes
   from the goal statement in my brief. The onboarding in UX.md is built to make it *achievable*
   (clause paste → parsed draft → three confirmations), and instrumented so wave-3 can measure it.
3. **A3 — Buyer seniority.** I assert the PM buyer is an operations/compliance coordinator with the
   owner/broker as economic buyer, from job-posting language and firm sizes, not from interviews.
   Fitzpatrick's evidence hierarchy would call this stated-role inference, the weakest admissible tier.
4. **A4 — Mobile share.** No source gives desktop/mobile split for COI review. I assume review is desktop
   (a 24-column PDF is unreadable on a phone) and *status checking + chasing* is mobile. Designed both ways.
5. **A5 — Price anchors.** The self-serve band ($99-$299/mo, PLAN/shortlist) is the founder's hypothesis.
   What is *sourced* is what the incumbents charge and how they gate it; the persona reports the anchors,
   it does not invent a willingness-to-pay number.

## Contradictions found and how I resolved them

- **"Only bcs publishes a price" was wrong on the first pass, and the verification stage caught it.**
  Evident publishes a ladder — **$15/vendor/yr Essential, $25/vendor/yr Pro** — but its Essential tier
  starts at **200 third parties**, above the whole ICP band, so its real floor is about $3,000/year.
  The corrected statement, used everywhere: *two* incumbents publish a price; **bcs is the only priced
  option a 25-to-150-certificate buyer can actually reach.** If a later agent re-checks one number in
  this file, make it this one.

- **myCOI pricing.** Certificial's comparison says myCOI has "public pricing tiers" at "$200-400/month";
  Capterra and SoftwareAdvice both show "Contact vendor" / "Pricing available upon request", and myCOI's
  own site (illumend.ai) shows no price and requires a demo. **Resolution: myCOI is demo-gated.** The
  Certificial claim is a rival's characterisation and is labelled as such wherever it appears.
- **TrustLayer "free version".** SoftwareAdvice's profile says "Free version available"; Capterra says
  "no free trial"; illumend's comparison says TrustLayer's no-login vendor upload is a *paid-tier* feature.
  **Resolution:** a free entry point may exist but pricing is demo-gated (their FAQ, verbatim), and the
  free tier's limits are not published. Stated with that hedge.
- **BCS "Self-Service" tier.** Their own pricing page prices it at $0.95/vendor/month *and* says a custom
  quote is required. **Resolution:** BCS is the only incumbent with a genuine free self-serve entry
  (25 vendors, no card) — that is the sharpest competitive fact in the file and it is first-party.

## What the self-review changed (stage 4b, before handing to the reviewer)

1. **A factual error caught and corrected.** The first draft said "only bcs publishes a price". Fetching
   `evidentid.com/pricing` proved that wrong; the corrected, defensible claim is now used everywhere.
2. **The ACORD 25 itself was missing.** The persona quoted vendors *explaining* the form rather than the
   form. Fetching the blank ACORD 25 (2025/12) from New York's DFS replaced four paraphrases with the
   form's own words and surfaced the two checkbox columns (`ADDL INSD`, `SUBR WVD`) that are now called out
   as the hardest extraction targets in `UX.md §3.1b` and `IDENTITY.md §12.4`.
3. **A rule contradicted itself.** `IDENTITY.md §15` banned gradients while `design-system.css` used
   `repeating-linear-gradient` to draw the Expiring hatch. Resolved by tightening the rule: gradient
   *fills* are banned; hard-stop *patterns* are the mechanism that makes the status readable without
   colour. Soft stops remain a review failure.
4. **Two components were specified but not implemented.** `.c-timeline` and `.c-report` were in the
   inventory and missing from the CSS; both are now implemented and demonstrated in `samples.html`.
5. **Four token pairs were uncertified.** `--c-select-bg` and the ink-on-sunken pairs were in the CSS but
   not in `contrast.py`. Added; the suite went from 96 to 104 declared pairs and still passes.
6. **A source claim was softened.** `IDENTITY.md §7.1` had asserted who Public Sans was drawn for. The
   USWDS page states only its role as the default sans, so the claim now stops where the source does.
7. **A blank was left blank on purpose.** Rent Manager / CINC / Vantaca got a second attempt; both produced
   nothing, so `PERSONA.md §2.4` says so instead of inferring a capability.

## Advice to the next agent

- The single strongest wedge is **not** "AI reads COIs". Everyone claims that (illumend's Lumie, TrustLayer,
  Certificial). The wedge is **price transparency plus no demo**: five of seven incumbents publish no price
  at all, and two of the big PM platforms bill the *vendor* $80-$125/yr. Lead with that, not with AI.
- Do not design for "risk manager". The ICP has no risk department — that is the whole reason they are the
  ICP. The buyer is a coordinator/office manager who also does fifteen other things.
- The GC persona has a **date-stamped, dollar-denominated** annual event (the GL/WC premium audit) that the
  PM persona does not. If wave-3 wants a trigger for outbound, that is it.
- **`identity/research/acord25-form-text.txt` is the most reusable artefact here.** It is the complete
  ACORD 25 (2025/12) field list from a government source. The Product Owner's extraction schema, the
  knowledge base and the test corpus should all be built from it rather than from a vendor's blog post.
- Keep `identity/contrast.py` in the repo: every colour pair in IDENTITY.md is computed by it, and a
  reviewer will re-run it. Do not hand-edit a ratio.
- `samples.html` must stay framework-free and load nothing but Google Fonts. It is the reviewer's proof.
