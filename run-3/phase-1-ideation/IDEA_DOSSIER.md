# Run 3 — Phase 1 dossier: what the factory found, and what it recommends

Status at the founder breakpoint, 2026-08-20. This run's phase 1 examined **176
candidates** (80 pool ideas from runs 1–2, 23 fresh-mined in cycle 1, 8 hardened
in cycle 2, 65 rejected on arrival by the cycle-2 miners themselves), ran **two
12-lens Borda votes**, and **deep-validated 12 candidates** four lenses each
against ~250 live-fetched primary sources. Every validation report is under
`research/`; every vote under `VOTE_RESULTS*.md`; every rejection under
`autonomy-rejections*.json`.

## The headline result

**No candidate survived adversarial validation as pitched.** Not the first
ballot's eight monitoring/alert products, not Starcheck, not the second
ballot's three artifact generators. This is not a process failure — the
process did exactly what rule 5 demands (a review that finds nothing has
failed). It is a market finding, and it is consistent across 12 independent
validations:

**In August 2026, the design space "SMB compliance micro-SaaS on public data
with zero humans" is efficiently occupied.** Every mandate strong enough to
force payment has already attracted at least one of:

1. **A free first-party substitute** — the agency itself emails the reminder,
   computes the deadline, ships the generator (USPTO courtesy reminders +
   TSDR Maintenance tab; Companies House email reminders + Follow; CMS
   PBJ Excel-to-XML converter; PA/MN/OH/OR state DMR calculators; FEC/HMDA/
   OSHA/EEOC free filing tools; Craneware's free MRF generator+hosting).
2. **A live micro-SaaS at 1/5–1/25 of the imagined price** (CHWatch £12/mo,
   companiesonthego £7.50/mo, PolicyChanges.app $19/mo, h1bapi.com $9/mo,
   DeadlineDocket $89/mo unlimited, PBJ360 $99/mo, CVD Portal €99/mo).
3. **Bundling inside software the buyer already pays for** (load boards bundle
   carrier monitoring; clearinghouses bundle NCCI scrubbing; payroll bundles
   pay-data and exclusion screening; ERPs bundle UK payment-practices
   reports; practice suites bundle CH deadlines).
4. **A soft mandate** — where none of the above exists, it is because
   enforcement is a letter, not a fine (UK payment practices: zero
   prosecutions in nine years; CMS hospital price transparency: ~2 CMPs/year
   across 5,419 hospitals), so the budget is not forced.

Two further patterns killed otherwise-plausible candidates: **dead data that
looks alive** (FMCSA's L&I Socrata datasets frozen 2026-05-14 with
`rowsUpdatedAt` = today) and **fabricated market evidence** (the "Effluent
Labs" price anchor: a landing page registered 2026-02-16 with a generated
team, zero independent trace — caught only because validation re-fetched and
checked RDAP).

Runs 1 and 2 succeeded because Clausewright and Ratepin occupied the two
genuinely open artifact-generator niches the mined pool contained. Run 3's
mining confirms the tail behind them, in this thesis shape, is closed.

## Cycle 1 — ballot, vote, validation

Ballot (`shortlist.json`), Borda (`VOTE_RESULTS.md`), validations
(`research/B*-validation.md`):

| Rank | Idea | Pts | Validation verdict (one line) |
|---|---|---|---|
| 1 | Article 14 (CRA exploit clock) | 59 | REFUTED — "awareness" is a legal judgment (C(2026) 5252 ¶213); no duty to monitor (FAQ 5.1); micro/small firms exempt from 24h-deadline fines (Art 64(10)); CVD Portal ships it at €99/mo; ~1 purl-matchable KEV addition per 6 days globally |
| 2 | PortfolioWatch UK | 52 | REFUTED — Companies House free email reminders (bulk agent enrolment) + instant Follow; CHWatch £12–70/mo; ComplyTrack, CompanyChangeAlerts, companiesonthego £7.50–15/mo; a prior entrant (PenaltyProof) already died |
| 3 | ExclusionAuto | 48 | REFUTED — OIG's own bulletin: screening not required by statute; $40/mo incumbent includes 46 state lists (product had 0); LEIE has no SSN → "no match" is unverifiable; HealthProviders DB $89/mo uncapped |
| 4 | MarkDocket | 44 | REFUTED — USPTO does the job free three ways; DeadlineDocket $89/mo unlimited marks; watch tier priced 3–5× above Markify $39/yr; OA deadlines are declared in the document, not computable |
| 5 | QueueGuard | 36 | REFUTED — public queue files contain zero deadline columns (verified column-by-column); deadlines arrive by private letter with 5-day cure; Basepoint/GridTracker live, interconnection.fyi free |
| 6 | CarrierWatch | 34 | REFUTED — corpus dead (L&I frozen 2026-05-14); DAT sells a product literally named CarrierWatch at $149/mo; Truckstop $99/mo unlimited incl. chameleon flags; defamation judgments in category |
| 7 | Denial Weather | 32 | REFUTED — PolicyChanges.app $19/mo; CMS publishes the changelogs the moat assumed absent; AMA CPT license gates the build; target personas had ~0 relevant changes/quarter |
| 8 | SponsorScope | 31 | REFUTED — the $199 "evidence" was a job-board ad slot misread; h1bapi.com $9–79/mo; USCIS Data Hub free; SERP 18/18 occupied |

Starcheck (pool survivor, validated in cycle 2): REFUTED — CMS ships a free
Excel-to-XML generator; PBJ360 $99/mo with the Five-Star simulation as its
free tier; bundled in every LTC timekeeping suite.

## Cycle 2 — artifact-generator thesis, ballot, vote, validation

The miners ran the seven kill patterns **before** proposing (65 ideas rejected
on arrival with evidence — `autonomy-rejections-cycle2.json`). Ballot
(`shortlist-cycle2.json`), vote (`VOTE_RESULTS_CYCLE2.md`):

| Rank | Idea | Pts | Status |
|---|---|---|---|
| 1 | Outfall (NPDES DMR generator) | 72 | validated → REFUTED |
| 2 | ChargeFile (hospital MRF v3.0) | 58 | validated → REFUTED as pitched (3× SURVIVES_RESHAPED, kill-lens fatal) |
| 3 | Filing Period (UK payment practices) | 47 | validated → REFUTED as pitched (3× SURVIVES_RESHAPED, kill-lens fatal) |
| 4 | CallFile (NMLS MSB call report XML) | 46 | **not yet deep-validated** |
| 5 | Basic Model (DOE/FTC energy labels) | 39 | not validated; WTP rests on a PRA estimate |
| 6 | Addendum (NYC RPIE) | 34 | not validated; next deadline June 2027 |
| 7 | NinetyEight (Ch. 98 claim packages) | 28 | not validated; buyer population unsized |
| 8 | LaborRoll (CA labor-contractor pay data) | 12 | not validated; seasonal + SOC-classification arbiter risk |

### The validated trio in detail

**Outfall — 72 pts, REFUTED.**
- *Money changing hands:* claimed via "Effluent Labs $1,500–5,500/mo" — exposed
  as a phantom site (RDAP: registered 2026-02-16, generated team, zero
  independent trace). One real transaction found (Operator10, $14,165 + $1,970/yr,
  municipal procurement PDF) — for the bundled POTW segment the card excluded.
- *Corpus:* 40 CFR 122.41(l)(4) verified verbatim; ECHO API real but returns
  neither frequency-of-analysis nor sample-type (both required DMR columns);
  calculation conventions (non-detect substitution, geometric-mean zero rule)
  live in per-state prose (PA FAQ #24–33) — kill pattern 5.
- *Price:* no defensible anchor survives.
- *Killed by:* the target buyer's task is 2–10 numbers a month (measured on 19
  live permits, median 10 value-cells); free state generators (PA, MN, OH, OR);
  34.7% of permits sit in states outside NetDMR.

**ChargeFile — 58 pts, REFUTED as pitched.**
- *Money changing hands:* real and live — $51,615 CMP (June 2026), 953 warning
  notices in 2026, Turquoise/Panacea/ClaraPrice sell MRF services.
- *Corpus:* CMS v3.0 JSON schema + CC0 validator verified (v2.6.0 published
  2026-08-18); enforcement dataset found (13,355 rows).
- *Price:* collapsed — **Craneware Trisus is free to all US providers and
  generates AND hosts compliant MRFs** (live v3.0 file fetched as proof);
  SlicedHealth/Health Catalyst already ship the 2026 percentile-from-835
  feature; the schema's `count:'0'` escape hatch removes the hard-data
  requirement the product monetized.
- *Not proven / killed by:* enforcement on small hospitals ≈ 2 CMPs/year
  across 5,419; the $51,615 CMP was for §180.60 (shoppable-services list),
  not the MRF the product generates; NRHA steers rural hospitals to managed
  services, not card-swipe tools.

**Filing Period — 47 pts, REFUTED as pitched.**
- *Money changing hands:* none observed anywhere — no published price by any
  provider, ever, for this artifact (four independent hunts).
- *Corpus:* clean — one AP ledger CSV, UK register data verified live;
  premise errors found (commencement dates, "52 published fields").
- *Price:* the regulator's own impact assessment prices the entire job at
  £1,076–1,315/yr — the product's £99/mo tier equals 102% of doing the whole
  thing manually.
- *Killed by:* zero prosecutions in nine years (ministerial answer on
  record), ~40% non-compliance with no consequence, 73% of filings in two
  calendar months, and the Commercial Payments Bill (Lords report stage)
  abolishing the construction-retention differentiator.

## Rejected by the autonomy gate (summary)

- Cycle 0 screen of the 80-idea pool: 45 rejected — AI-ARBITER ×13, A4 ×11,
  A2 ×8, EXCL (Clausewright/Ratepin variants) ×9, plus 4 run-2 A4 refutations
  carried over (Tierline, Trustline, NexusPilot, Tariffgrid). Full reasons:
  `autonomy-rejections.json`.
- Cycle 2 mining: 65 rejected on arrival with fetched evidence (free
  first-party generators: FEC, HMDA, OSHA ITA, EEO-1, MoCRA, e-Manifest,
  TRI-MEweb, CCR, VETS-4212, MSHA, EnergyStar…; dead mandates: BOI vacated,
  FinCEN RRER vacated, Section 232 computation abolished, FSMA 204 delayed;
  bundling: payroll, LOS, cap-table platforms; A4: NAUPA II, PACT Act, US
  packaging EPR). Full list: `autonomy-rejections-cycle2.json`.

## Recommendation

**Recommended: one final validation pass on CallFile (C3), then build it if
it survives; if it is refuted, stop and close the run with this dossier as
the finding.**

CallFile is the only ballot candidate from either cycle that is (a) not yet
refuted, (b) one Borda point behind the validated #3, and (c) shaped like
the two previous winners: a mandatory, quarterly, XSD-validated XML artifact
(the NMLS Money Services Business call report) generated deterministically
from the customer's own ledger export, for a buyer (licensed money
transmitters and MSBs) with a real compliance budget, where the only free
path is hand-keying into NMLS web forms and the incumbent alternative is
consultant work. Its honest weaknesses are known and bounded: a small,
sourced TAM (~600–1,200 filers; ~$180–350k ARR at 10% share of the
multi-state tier), a chart-of-accounts mapping step that must be proven
self-serve, permissible-investment categorization that must stay
customer-side (engine-never-arbiter), and NMLS form-version churn.

**Why NOT the runner-up (ChargeFile, cycle-2 #2):** its price umbrella does
not exist. Craneware gives away generation *and* hosting of the exact
artifact to every US provider, four vendors already ship the 2026
percentile features, and CMS's enforcement rate on the target buyer is ~2
CMPs/year across 5,419 hospitals — a free perfect substitute plus an
unforced budget. Reshaping it (validator-only, evidence archive) competes
with CMS's own free CC0 validator. No reshape clears the bar.

**Why not simply cycle again:** two cycles produced 176 candidates and 12
deep validations with one consistent structural answer. A third undirected
cycle spends tokens against an established pattern; the remaining honest
moves are the one named un-validated candidate, or a founder-directed change
of thesis.

## References

- All validation reports with fetched-URL reference lists:
  `research/B1|B2|B3|B4|B5|B6|B7|B8|C1|C2|C4|Starcheck-validation.md`
- Votes: `VOTE_RESULTS.md`, `VOTE_RESULTS_CYCLE2.md` (+ `votes*.json`)
- Ballots: `shortlist.json`, `shortlist-cycle2.json`
- Rejections: `autonomy-rejections.json`, `autonomy-rejections-cycle2.json`
- Raw mined ideas: `raw-ideas.json` (cycle 1), `raw-ideas-cycle2.json`
- Method anchors per `../PLAN.md` literature corpus (Fitzpatrick, Ellis,
  Andreessen, Ries, Ramanujam, Hormozi, Poyar, Helmer, Thiel, Dunford,
  Weinberg & Mares, Moore, Vohra, Karpathy, Lewis et al. 2020, 12-Factor).
- Claims in this dossier are traceable to the validation reports above;
  no number here was produced from memory.
