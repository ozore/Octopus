# identity/ — memory file (WageLens Buyer & Identity agent, wave 1)

**Started:** 2026-09-03. **Agent:** Buyer & Identity (WageLens). **Status:** in progress.

## Scope
Writes only under `phase-4-revenue/wagelens/`: `PERSONA.md`, `IDENTITY.md`,
`design-system.css`, `identity/samples.html`, `UX.md`, plus this file and the
contrast script under `identity/`.

## Rules confirmed (from PLAN.md / PIPELINE.md)
- Six stages: ideation → research → verification → writing → review → iteration.
  This agent runs 1–4 and self-reviews; wave 1b reviewer runs stage 5.
- Sources are opened, not remembered. Every load-bearing claim carries a fetched URL + date.
- No private individuals. Organisations, public registers, public reviews only.
- Nothing sent, signed up for, or purchased.
- Auth is magic link (A7). Market US/English (A2). Launch coverage = federal
  Davis-Bacon, 50 states + WH-347 (A11). Names are provisional; naming pass
  recommends, founder decides (A3, P11).
- Stripe self-serve, one account (D2). Vercel hosting (D3).

## Log
(appended as work proceeds)

## Verification findings (stage 3) — corrections to inherited claims

**V1. The "$13,508 per violation" figure in `phase-1-ideation/shortlist.json` is NOT
supportable at the source.** DOL's own civil money penalty table
(https://www.dol.gov/agencies/whd/resources/penalties, fetched 2026-09-03, amounts
effective 2026-01-15/16) contains **no Davis-Bacon civil money penalty at all**. The only
CWHSSA entry is **$33** — "Failure to pay laborers and mechanics at a rate not less than
one and one-half times their basic rate of pay", 40 U.S.C. 3702(c), i.e. liquidated
damages *per worker per day*, confirmed verbatim in 29 CFR 5.5(b)(2). $13,508 appears
nowhere in the DOL table. Points North's article
(/trends-and-insights/the-real-cost-of-davis-bacon-violations, fetched 2026-09-03) says
only "civil monetary penalties up to $10,000+ per violation" with **no cited authority**.
→ **Do not use $13,508 anywhere in WageLens copy.** Use the numbers that survive:
withholding of contract funds (29 CFR 5.5(a)(2)), back wages + interest (5.5(a)(1)(vi)),
CWHSSA liquidated damages $33/worker/day (5.5(b)(2)), **3-year debarment**
(29 CFR 5.12(a)(1), govinfo CFR-2024-title29-vol1-sec5-12), and false-certification
exposure under 18 U.S.C. 1001 / 31 U.S.C. 3729 (5.5(a)(3)(ii)(F)).

**V2. Load-bearing regulatory facts confirmed verbatim at eCFR** (29 CFR 5.5, fetched
2026-09-03 via `https://www.ecfr.gov/api/renderer/v1/content/enhanced/2026-09-01/title-29?part=5&section=5.5`
— note: the ordinary ecfr.gov page URL 302s to unblock.federalregister.gov; the API
renderer path works and is what to use):
- weekly certified payroll, every week covered work is performed — 5.5(a)(3)(ii)(A)
- **"The prime contractor is responsible for the submission of all certified payrolls by
  all subcontractors."** — 5.5(a)(3)(ii)(A). This is the GC-tier wedge.
- WH-347 optional in form, weekly submission mandatory — 5.5(a)(3)(ii)(B) + DOL WH-347 page
- full SSN and address **must not** be on weekly transmittals; last 4 digits only — 5.5(a)(3)(ii)(B)
- 3 statements in the Statement of Compliance — 5.5(a)(3)(ii)(C)
- 3-year retention after prime contract completion — 5.5(a)(3)(ii)(G) and (a)(3)(i)(A)
- conformance: 3 criteria, 30-day WHD decision window, DBAconformance@dol.gov — 5.5(a)(1)(iii)
- **"The conformance process may not be used to split, subdivide, or otherwise avoid
  application of classifications listed in the wage determination."** — 5.5(a)(1)(iii)(B)

**V3. Incumbent pricing verified at first-party sources (2026-09-03):**
- LCPcertified (lcptracker.com/solutions/lcpcertified/): $12/report; 5 active projects
  $145/mo; 10 projects $1,300/yr; 25 $2,500/yr; 50 $3,700/yr; unlimited $7,400/yr.
  Professional plan 10 projects $1,900/yr … 450 projects $18,200/yr.
- Points North Certified Payroll Reporting, on the **ADP Marketplace listing**
  (apps.adp.com/en-us/apps/253943/...): **$175.00/month + $7.50/report/month**, setup
  **$995 (1–25 employees) / $1,495 (26–49) / $4,995 (50+)**. First-party-ish (ADP hosts it).
- CertifiedPayrollPro: Starter $49/mo + $5/report, Pro $99/mo + $3/report, Enterprise
  $249/mo + $1/report; 14-day trial, 3 free reports, no setup fee.

## Blocked / failed sources (log)
- `capterra.com`, `getapp.com`, `softwareadvice.com`, `trustradius.com` → **HTTP 403** to curl
  with a browser UA. Retry via WebFetch where a valid URL is known.
- `www.ecfr.gov/current/...` HTML → 302 to unblock.federalregister.gov. Use the API renderer.
- `dol.gov/agencies/whd/government-contracts/construction/faq/debarment` and `/enforcement` → 404.

**V4. Prime-contractor liability, verified at source (29 CFR 5.5(a)(6), eCFR 2026-09-01):**
"The prime contractor is responsible for the compliance by any subcontractor or lower tier
subcontractor with all the contract clauses in this section. In the event of any violations
of these clauses, the prime contractor and any subcontractor(s) responsible will be liable
for any unpaid wages and monetary relief, including interest from the date of the
underpayment or loss, due to any workers of lower-tier subcontractors, and may be subject
to debarment, as appropriate."
The vendor phrase **"strict liability"** (myconstructionpayroll.com) is the vendor's
characterisation, **not** the regulation's words. Do not put "strict liability" in our copy.

**V5. Incorporation by operation of law — 29 CFR 5.5(e):** the clauses and correct wage
determinations "will be considered to be a part of every prime contract … and will be
effective by operation of law, whether or not they are included or incorporated by
reference into such contract." → The single most useful fear-fact for the small sub:
*"It applies even if nobody sent you the wage determination."*

**V6. Naming pass, DNS evidence (2026-09-03).** `dig` is **not installed** in this sandbox
(`apt-get install dnsutils` fails, no network for apt). Equivalent evidence collected with
DNS-over-HTTPS (`https://dns.google/resolve?name=X&type=A|NS`) plus `curl -sI`; scripts kept
at `scratchpad/dnscheck.sh` / `dns2.sh` — reproduce with `dig +short <name>.com` on a normal box.
- **wagelens.com is LIVE and taken** — "WageLens - Pay Gap Analysis Tool", an AI pay-gap /
  pay-equity SaaS (fetched 2026-09-03, HTTP 200, Vercel DNS, built with v0.dev). Same word,
  adjacent category (pay/compensation software). This is a real conflict.
- wageproof.com LIVE — "WageProof … S-Corp Reasonable Compensation Reports" (pay/compensation).
- chalkline.com LIVE — Chalkline, casino promotions platform.
- craftrate.com, snapline.com, countyrate.com — parked on Afternic (for sale).
- **UNREGISTERED (NXDOMAIN, curl 000): craftwage.com, chalkwage.com, craftpayroll.com,
  bondwage.com, weekwage.com, wagerun.com, countywage.com.**
- USPTO trademark APIs unreachable from here (tmsearch api 404, developer.uspto.gov ds-api 301).
  **Trademark clearance is a founder to-do, flagged in IDENTITY.md.**

**V7. Incumbent visual language — values read out of the live markup (2026-09-03):**
- procore.com: warm neutral ground `#F5F1ED`, `#ECE0D6`, `#D4CAC1`, ink `#595552`,
  accent `#FF5200`. core.procore.com (their design-system site): `Inter,Noto,Arial,sans-serif`,
  `#006DDF` blue, `#E36937` orange, `#F1F3F3` ground, `#202020` ink.
- foundationsoft.com: `#F8C01B` yellow, `#0C92D0` blue, `#254E77` navy, `#535353` grey.
- lcptracker.com: `#426BAE` blue, `#007CBA`/`#006BA1` link blues. (Most other hexes on that
  page are WordPress/Gutenberg defaults — `#32373C`, `#0693E3`, `#00D084` — **do not**
  attribute those to the brand.)
- quickbooks.intuit.com: brand green `#2CA01C` (in the logo SVG markup).
- **Blocked (403 to curl and to WebFetch, both attempts): adp.com, buildertrend.com,
  sage.com.** design.sage.com is refused by the egress proxy. Fell back to WebFetch's
  rendered description for ADP, and to secondary brand-colour references for ADP/Buildertrend,
  which are cited as secondary in IDENTITY.md.

**V8. WH-347 burden, verified.** DOL's own "Instructions For Completing Payroll Form,
WH-347" (OMB Control No. 1235-0008, expires 09/30/2026) carries the Public Burden
Statement: **"We estimate that it will take an average of 55 minutes to complete this
collection of information"** — that is **per payroll form**, not per employee.
imagetotable.ai's "over one hour per employee, per report" **misreads** it. Use 55 min/report
as the DOL anchor and cite the vendor time claims separately as vendor claims.
(DOL page's own text, fetched from the copy MoDOT hosts at
`https://www.modot.org/sites/default/files/documents/Instructions%20For%20Completing%20Payroll%20Form%20WH-347%20_%20U.S.%20Department%20of%20Labor.pdf`
because `dol.gov/agencies/whd/forms/wh347instr` 404s and dol.gov PDFs 403 to curl.)
Also verified there: the Statement of Compliance "is subject to the penalties provided by
18 U.S.C. § 1001, namely, a fine, possible imprisonment of not more than 5 years, or both."
And the form's own notations: rate written `$12.25/.40` (base/fringe), gross written
`$163.00/$420.00` (this project / all projects). Reuse these idioms verbatim in the UI.

**V9. Palette.** `identity/contrast.py` is the authority for every ratio quoted in
IDENTITY.md §6. 72 pairs, all pass (39 light, 33 dark). Run `python3 identity/contrast.py`;
`--tsv` for a machine-readable table. Two design decisions came out of running it:
(a) `graphite-400` had to move from `#9C9284` to `#918776` to clear 3:1 against the warm
canvas; (b) the focus ring must be **two-tone** (light inner + dark outer), because no single
ink clears 3:1 against both the canvas and the brick primary button.

---

## Stage 1 (ideation) — the three identity directions, and why C won

Recorded so the wave-1b reviewer can argue with the *decision*, not just the output.

- **A "The Site Trailer"** — safety yellow/orange on graphite, hi-viz, chunky, jobsite photography.
  Rejected: wrong register for a document that carries a five-year criminal exposure; hi-viz yellow
  is already Foundation Software's palette (`#F8C01B`, read from their markup); and a bold yellow
  *brand* colour cannot coexist with amber as a *warning* colour.
- **B "The Government Form"** — USWDS-adjacent: Public Sans, federal blue, the WH-347's grid logic
  everywhere. Rejected: it impersonates the regulator, which is a credibility risk for a private
  company saying "here is what DOL published", and it looks like the state portals the buyer already
  resents. **Its typeface and its contrast discipline were kept; its costume was dropped.**
- **C "The Ledger and the Iron"** — CHOSEN. Warm bone ground, warm near-black ink, ruled like a
  payroll register; iron-oxide **brick** as the single brand colour (never a status); Public Sans
  for UI, **IBM Plex Mono for every figure and for the rendered WH-347**; 15px base, 36px rows,
  2–6px radii, no card shadows. Density is the feature, because the one thing the screen must do is
  show a whole payroll week without hiding it.

## Stage 4 (writing) — what shipped

| file | note |
|---|---|
| `PERSONA.md` | 14 sections. Every claim keyed to §13's source ledger; keys are graded **[R]** regulation / **[V]** vendor / **[U]** user, and the grades are never mixed. A coverage check confirms 0 keys used-but-undefined and 0 defined-but-unused. |
| `IDENTITY.md` | Naming pass with DNS/HTTP evidence, Dunford's 8 steps, the 3 directions above, tone with do/don't, the full visual system, component inventory, dark-mode policy, a sourced borrow/avoid table for QuickBooks / Procore / Foundation / LCPtracker / ADP / Buildertrend / USWDS, and a distinctness check against Clausewright. |
| `design-system.css` | 2-tier tokens (primitive → semantic), light + dark + print, `@layer` ordered, no framework, no imports but Google Fonts. |
| `identity/samples.html` | Tokens, full component inventory, a realistic weekly payroll grid and a WH-347 preview. Verified: the only external resources are the two `fonts.*` preconnects and one Google Fonts stylesheet; 0 `wl-` classes used that do not exist in the CSS; markup parses with no unclosed tags; both tables reconcile at 15 columns. |
| `UX.md` | Journey, 40 screens, the 10-minute onboarding budget with the arithmetic, key interactions, all states, the keyboard map, mobile by task, roles, a11y, 9 email touchpoints, billing/settings/help, anti-scope, open questions. |

## Self-review against PERSONA.md (stage 4 gate, before the wave-1b reviewer)

- **Sample-screen arithmetic re-derived and corrected.** First draft had a per-classification net
  that did not reconcile. Fixed: deductions and net are per worker per week, so the split-classification
  rows share one figure via `rowspan`, and gross − deduct = net at every level
  (8,632.28 − 2,137.10 = 6,495.18). Both the grid and the WH-347 preview mirror each other.
- **Column 7's slash notation** was initially used to mean "this classification / all classifications".
  That is wrong: DOL's column 7 slash means *this project / all projects*. Corrected to an explanatory
  note rather than a fabricated number.
- **Banned-phrase grep** across all five deliverables: `13,508`, `strict liability`, `audit-proof`,
  `100% accurate`, `seamless`, `effortless`, `revolutioni*` appear **only inside the banned lists**.
- **Contrast** re-run after every palette edit; 72/72 pass.
- **Grid CSS specificity bug found and fixed**: `:nth-child(even) .wl-sticky-*` was out-specifying the
  `.is-selected` / `.is-error` state classes, so a state on an even row would have lost its background.
  Rewritten so the **row** owns the background and sticky cells use `background: inherit`.
- **Signature list counters** used `counter-increment: none`, which never increments. Fixed to a named
  counter, because the reset strips `list-style` from any `ol[class]`.

## Mistakes worth not repeating

1. I nearly shipped the inherited `$13,508` figure. It survives in a lot of vendor content and it is
   not in DOL's table. **Check penalty numbers against `dol.gov/agencies/whd/resources/penalties`,
   not against vendor blogs.**
2. Colour-picking from a live page returns the CMS's defaults as well as the brand's. The WordPress /
   Gutenberg palette (`#32373C`, `#0693E3`, `#00D084`, `#FF6900`, `#FCB900`) appeared on two
   incumbents' sites and is not their branding. Filter it out.
3. `python3 identity/contrast.py` from inside `identity/` writes `__pycache__` if you import it.
   Deleted; do not commit it.

## Assumptions (nothing here was verifiable from this environment)

| # | assumption | where it is recorded |
|---|---|---|
| B1 | Warm-neutral + brick reads as "serious record", not "retro", to this buyer | IDENTITY.md §15 — **hypothesis, not evidence**; test with five office managers |
| B2 | 15px base + 36px rows is comfortable for a full payroll day | IDENTITY.md §15 — derived from the width arithmetic in §8.2, not from testing |
| B3 | Mono for the rendered form reads as *official*, not *unfinished* | IDENTITY.md §15 |
| B4 | Public Sans's "not actively developed" status (v2.001) is acceptable | IDENTITY.md §15 |
| B5 | ADP and Buildertrend brand colours are as quoted | **secondary sources only** — both sites 403 twice; PERSONA.md §12 A7 |
| A6 | Washington's weekly-CPR-to-L&I / PWIA description | **secondary only** — lni.wa.gov's certified payroll page 404s here; PERSONA.md §12 A6. Re-verify before any WA claim ships. |
| — | Trademark clearance for CraftWage / ChalkWage | **not possible here**; USPTO APIs refused. Founder or counsel task. |

## Advice to the next agent

1. **Read `PERSONA.md` §6 before writing a single word of copy.** The vocabulary table and the
   banned list are the fastest way to sound like this market instead of like a SaaS vendor.
2. **The rate component is the product.** `.wl-prov` (IDENTITY.md §11.7) is not decoration: the rule
   is that *no rate is ever rendered outside it*. If a screen shows a bare number, that is a bug.
3. **Two structural error-preventers must survive into the build**: the paired base/fringe rate field
   (`.wl-field--rate`) and the classification typeahead scoped to the project's determination
   (`.wl-field--classification`). Both exist to make specific documented compliance failures
   impossible, not to be nice.
4. **Import quality is the differentiator you will be tempted to under-build.** Every concrete
   complaint about the incumbents in the public review corpus is an import complaint.
5. **The eCFR API renderer path is the reliable way to read 29 CFR from here.** The ordinary page URL
   302s away. `https://www.ecfr.gov/api/renderer/v1/content/enhanced/<date>/title-29?part=5&section=5.5`
6. **If the founder rejects the rename**, everything in `IDENTITY.md` still stands except §1 — the
   visual system, the positioning and the tone are name-independent. But `wagelens.com` is a live
   pay-equity product, so at minimum the domain question has to be answered before launch.
7. **Do not let the price come off the pricing page.** It is the single most-requested change buyers
   want from vendors in this category, and it is the incumbents' most conspicuous absence.

## Status at hand-over

All five deliverables complete. Stage 5 (adversarial review) belongs to the wave-1b reviewer — this
agent did not review its own work beyond the self-check above. Nothing was committed or pushed.
