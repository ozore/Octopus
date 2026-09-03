# StateReady — the knowledge base

**Owner:** Product Owner agent, phase-4 wave 1. **Date:** 2026-09-03.
**Binding upstream:** `../PLAN.md` A10 (two-agent verification, drift cron, disclaimers), A11
(launch scope), `../PIPELINE.md` standing rules. Patterns reused from
`../../phase-2-build/architecture/CORPUS_DESIGN.md`.

---

## 1. The thesis: the knowledge base *is* the product

Karpathy's argument in *Software 2.0* is that the dataset defining desired behaviour is the primary
artifact, and the real engineering problem is the tooling for accumulating, cleaning, labelling and
sourcing it. Clausewright took that literally (`CORPUS_DESIGN.md` §0.1) and StateReady takes it
further, because here there is no model at all in the load-bearing path: **every regulatory string
the customer sees is a value read out of a JSON record with a URL attached, or it is not shown.**

Strip the knowledge base out and StateReady is a date field with an email reminder — a weekend
project. Keep it and the product can say something the customer's spreadsheet cannot: *your North
Carolina electrical licence renews on its anniversary and your North Carolina plumbing licence
expires on 31 December, there is no grace period, and the plumbing board abolished continuing
education in 2012.* Three facts, one state, two boards, all three surprising to a competent office
manager. That is what is being sold.

The competitive consequence, stated bluntly (Helmer's test, as applied honestly in `CORPUS_DESIGN.md`
§4.1): **this is not yet a cornered resource.** Anyone can read the same board pages. What is hard to
copy is the *pipeline* — the two-pass verification, the drift detection, the discipline of leaving a
field empty — and the accumulated `last_verified` history that lets us say "this was true on
3 September and here is what changed since". That compounds; the data alone does not.

---

## 2. Launch scope, and why these fifteen states

**PLAN.md A11:** HVAC, plumbing and electrical × the 15 states with the most contractor activity.
"Most contractor activity" was undefined, so it is defined here, reproducibly:

> **contractor activity = private establishments in NAICS 2382, Building Equipment Contractors**
> (= 23821 electrical + 23822 plumbing/HVAC — exactly our three trades and nothing else),
> BLS Quarterly Census of Employment and Wages, 2025 annual averages.

Establishments rather than employment, because the unit that buys a licence-tracking subscription is
a business, not a worker. NAICS 2382 rather than the whole of 238, because 238 also contains roofing,
concrete, drywall and painting, whose rules we do not carry.

Source: `https://data.bls.gov/cew/data/api/2025/a/industry/2382.csv`, fetched 2026-09-03.
Reproduce with `python3 kb-scripts/rank_states.py`. Output committed at `kb-data/_launch_states.json`.

| # | state | establishments | employment | | # | state | establishments | employment |
|---:|---|---:|---:|---|---:|---|---:|---:|
| 1 | CA | 25,398 | 259,643 | | 9 | NJ | 6,491 | 60,136 |
| 2 | FL | 19,715 | 195,527 | | 10 | OH | 6,429 | 92,565 |
| 3 | TX | 18,649 | 254,256 | | 11 | MA | 6,002 | 59,764 |
| 4 | NY | 13,222 | 136,652 | | 12 | CO | 5,531 | 57,097 |
| 5 | NC | 9,144 | 92,194 | | 13 | AZ | 5,524 | 72,807 |
| 6 | PA | 7,752 | 82,930 | | 14 | MI | 5,316 | 67,286 |
| 7 | IL | 7,484 | 77,550 | | 15 | VA | 5,225 | 77,617 |
| 8 | GA | 7,461 | 80,829 | | | | | |

**The 15 cover 149,343 of 236,924 US establishments — 63.0%.**

**Deviation from the brief, recorded.** The brief guessed TX, FL, CA, GA, NC, AZ, OH, PA, IL, VA, TN,
CO, WA, NJ, MI. The data puts **NY (4th) and MA (11th)** in and **WA (16th, 5,110) and TN (17th,
4,648)** out. WA and TN are the first two additions when scope widens; they are 2% and 4% behind VA.

**A complication the ranking creates, and why we keep it anyway.** NY, MA, NJ and IL license these
trades substantially at city and county level rather than at state level. That makes them *harder*
records, not less valuable ones: a contractor entering New York needs to be told "there is no state
electrical licence — you need New York City, and Buffalo separately", and nobody tells them that
cleanly today. The schema's `jurisdiction_model.level` has `local_only` and
`state_optional_local_required` precisely for this, and `kb-data/` will carry those records with an
honest `local_layer_note` rather than a pretend state licence.

---

## 3. What a record contains

One record = one **(state, trade)** pair. 3 trades × 15 states = **45 records at full launch scope**;
**9 are complete today** (§8). Schema: `ontology/schema.state_trade_record.json`.

Each record carries: the licensing board(s) and URL; the jurisdiction model; every licence type with
its rung (contractor / master / journeyman / registration / …), who must hold it, scope, exam,
experience, application fee, renewal cycle, renewal fee, expiry rule, grace period, late fee, CE
hours, CE subject breakdown, approved-provider rule, carry-over and delivery constraints, bond and
insurance; reciprocity in both directions; the business-entity and qualifying-individual rules;
and a typical timeline.

### 3.1 The SourcedValue envelope — the one design decision that matters

No bare numbers exist in `kb-data/`. Every fact is wrapped
(`ontology/schema.sourced_value.json`):

```json
{
  "value": 115, "unit": "USD",
  "status": "verified", "confidence": "high",
  "source_url": "https://www.tdlr.texas.gov/acr/contractor-apply.htm",
  "source_title": "Apply for an Air Conditioning and Refrigeration Contractor License — TDLR",
  "source_kind": "board_page",
  "evidence": "along with the fee of $115",
  "last_verified": "2026-09-03",
  "verified_by": ["po-stateready-pass-a", "po-stateready-pass-b"]
}
```

`evidence` does three jobs at once and is the cleverest part of the design: a human reviewer can
confirm the reading in one glance; the second verification pass re-fetches the URL and asserts the
string is still present; and the drift check has a value-level signal, not just a page-level one. It
is capped at 25 words by gate G4, which is also the copyright posture (`CORPUS_DESIGN.md` §3.6): we
store our own structured reading plus a short marked quotation, never bulk source text.

### 3.2 `null` is a first-class answer

`value: null` forces `status: "unknown"` and a mandatory `note` saying what was read. It never means
zero and it never means "not required".

> "No bond requirement appears on the TDLR ACR apply, renew, CE or reciprocity pages, all four of
> which were read in full. This is recorded as 'not established', NOT as 'no bond required' — the
> difference matters to a contractor bidding a job."

That distinction is enforced by gate G2, and the note is the text the product shows the customer in
place of the number. **144 of 603 values in the nine records are `unknown`.** That is not a defect
rate; it is the honest state of what fifteen public board sites publish, and publishing it is a
competitive act. Nobody else shows their gaps.

### 3.3 Identifiers and versioning

`ontology/id-grammar.md`. Append-only ids (`tx.plumbing.responsible_master_plumber`), one board id per
agency rather than per URL, and changed values retained rather than overwritten — so a citation shown
to a customer in March still resolves in December.

---

## 4. Sources: what counts, and what never does

| tier | kind | examples | confidence ceiling |
|---|---|---|---|
| A | `board_page`, `board_pdf` | tdlr.texas.gov, tsbpe.texas.gov, ncbeec.org, nclicensing.org, myfloridalicense.com | high |
| B | `administrative_rule`, `statute` | flrules.org adopted rule text, ncleg.gov General Statutes | high, but only where the board does not restate it — statute text is written for lawyers and often sets a *ceiling* rather than a price (see §6) |
| C | `federal_statistics` | BLS QCEW | high (scope-setting only, never a regulatory value) |
| **never** | third-party guides, exam-prep vendors, affiliate sites, competitor content marketing | licenseroadmap.com, rocketcert.com, staterequirement.com | **excluded from `kb-data/` entirely** |

The allowlist is explicit in `ontology/official-hosts.json`, with a reason per host and a rejected
list. It exists because a TLD test is worthless here: Florida's own portal is `myfloridalicense.com`,
a `.com`, while a great deal of affiliate content is `.org`. Gate G5 fails the build on any source
outside the allowlist, so adding one is a deliberate, reviewable act.

35 source pages back the nine records. All are hashed in `kb-data/_sources.json`.

---

## 5. The two-pass verification protocol

`PIPELINE.md` stage 3 requires verification by a different party than the researcher, re-checking each
claim **at the source**. Implemented as two passes with different methods, different failure modes,
and different agent ids:

| | **Pass A — extraction** (`po-stateready-pass-a`) | **Pass B — re-verification** (`po-stateready-pass-b`) |
|---|---|---|
| method | fetch the page, read it, record the value and a verbatim `evidence` fragment | **`kb-scripts/verify_pass_b.py`**: re-fetch every `source_url` over the network, independently of pass A's cache, and assert the `evidence` fragment is still literally present |
| shares with the other | nothing but the record file | – |
| catches | – | transcription errors, cross-source attribution errors, invented values, quotes "improved" in transit, and page changes |
| outcome | `status: unverified`, one verifier | agreement → `verified`, two verifiers; disagreement → **demoted to `unverified`**, note appended, `publishable` withdrawn |

### 5.1 What disagreement does

A disagreement is never resolved by preferring pass A. The value is demoted, the record loses
`publishable`, and the product treats it exactly as it treats an unverified value: it renders with the
UNVERIFIED badge, it cannot back a derived deadline without `needsHumanCheck`, and it cannot appear as
an unqualified statement in a paid expansion playbook. Restoring it requires a human to re-read the
source and either fix the record or fix the reading.

### 5.2 The rule: published only if two verifications agree

`provenance.publishable` is **computed, never hand-set**:

```
publishable = (agreements > 0) AND (disagreements == 0) AND (unreachable == 0)
```

Gate G11 fails the build if a record claims `publishable` with disagreements recorded, and M14's
runtime filters every read on the flag. A record that is not publishable is invisible to the product —
not shown with a caveat, invisible — and every consumer of `getKbRecord` has a defined behaviour for
`null`.

### 5.3 The first run, honestly reported

**First pass B over the nine records: 459 values checked, 435 agreed, 24 disagreed — 94.8%.**

Every one of the 24 was a real authoring defect, not a page change:

| n | class | example |
|---:|---|---|
| 7 | **cross-source attribution** | Texas electrical `waives_exam` quoted *North Carolina's* reciprocity page. It read perfectly well in prose. |
| 5 | statute vs board wording | G.S. 87-22 says "All licenses **shall** expire"; the board's page says "All licenses expire". Attributed to the wrong one of the two. |
| 5 | quoting a source better than it reads | NCBEEC's page contains the typo "Qual**f**ied Individual"; the evidence quoted it corrected. |
| 4 | typography | `“registered electrical contractor”`, `twenty‑five` with a non-breaking hyphen. Fixed by folding in the comparison, not by loosening the check. |
| 3 | over-long or mis-scoped fragments | caught jointly with gate G4 |

After correction, the re-run is **459/459, 100%, all nine records publishable**. Report the 94.8% as
the number that says something about the method; the 100% says something about the data today.

**The lesson, for the next 36 records:** the dominant error class was not misreading a page, it was
*attaching a correct reading to the wrong source*. Pass B catches that and nothing else would have.

---

## 6. Refresh cadence and drift detection

| job | cadence | script / route | what it does |
|---|---|---|---|
| Drift check | **daily** | `kb-scripts/refresh_sources.py` → `/api/cron/kb-drift` | fetch all 35 sources, normalise, compare content hashes, open a review item on any change |
| Full re-verification | **monthly** | `kb-scripts/verify_pass_b.py` → `/api/cron/kb-reverify` | re-run pass B over every value; disagreements demote in the next snapshot |
| Snapshot publish | **on deploy** | `validate.py` gate + M14 loader | atomic; refuses to publish a knowledge base that fails its own schema |

**Normalisation matters more than the hash.** `kb-scripts/lib_kb.py` strips scripts, styles and
markup, collapses whitespace, and removes the volatile fragments observed on real board pages: the
DBPR page clock (`4:01:09 PM 9/3/2026`), copyright years, "Last updated:" lines, "Next Board Meeting"
blocks and CSRF nonces. Without that, every page drifts every day and the queue is abandoned in week
one. It also handles the three body types actually encountered — HTML, PDF, and the OLE2 Word files
Florida serves for adopted rule text.

**Nothing auto-publishes.** A drift item is a review item. A state board changing a fee page mid-
quarter is exactly the moment when an automatic summariser would ship a wrong renewal fee to a paying
customer, which is the failure this product exists to prevent. Same reasoning as `CORPUS_DESIGN.md`
§3.7 property 2.

**Queue ordering is by blast radius.** Each drift item records `affected_organisations`, so a fee
change on a page 40 customers depend on outranks a typo on a page nobody holds a licence under.

**Operational note from the first run.** `tdlr.texas.gov` resets the connection on roughly one request
in ten under sequential load; three sources came back unreachable on the first drift run and all three
were fine on retry. `lib_kb.fetch` now makes two attempts with a 4-second backoff and does **not**
retry a 403 or 404 — that is an answer, not a glitch. The crawl is serial with 1.5 s spacing and must
never be parallelised: these are small state agencies, not CDNs. Current state: **35 unchanged,
0 drifted, 0 unreachable.**

---

## 7. Quality gates — structural, not procedural

`kb-scripts/validate.py`. Every rule that *can* be a test *is* one, and it fails the build rather than
warning (`CORPUS_DESIGN.md` P5 / §7).

| # | gate | enforces |
|---|---|---|
| G1 | every `verified` value has a URL, an evidence fragment, a date and **two distinct** verifiers | A10, §5 |
| G2 | a `null` value is `unknown` and carries a note saying what was read | §3.2 |
| G3 | a numeric value is either `verified` or carries a note — **no unexplained money or hours** | "never estimate a fee" |
| G4 | `evidence` ≤ 25 words | copyright posture |
| G5 | every source host is on `ontology/official-hosts.json` | §4 |
| G6 | referential integrity: every licence type resolves to a declared board and carries its record's id prefix | id grammar |
| G7 | an empty reciprocity list needs a `reciprocity_statement` that says so — the product may never render "none" from an absence | §9 |
| G8 | every `expiry_rule` is a token the deadline engine implements | spec 05 |
| G9 | a record with weak values may not claim the `standard` disclaimer profile | spec 12 |
| G10 | provenance hashes match `kb-data/_sources.json` — a record cannot claim a hash the drift baseline never measured | §6 |
| G11 | `publishable` is false whenever pass B recorded a disagreement | §5.2 |
| G12 | every record declares its `coverage_notes` — what it does **not** cover | §9 |
| G13 | `last_verified` is neither in the future nor older than 400 days | freshness |

Current state: **9 records, 0 failures, 3 warnings**, all three being the G7 flag on the Florida
records, which is correct — Florida's reciprocity genuinely was not established (§9).

A schema-subset JSON Schema validator is included in `validate.py` rather than a dependency, because
this has to run in CI and in a Vercel build image. It fails loudly on any schema keyword it does not
implement, so the schema cannot quietly outgrow the validator.

---

## 8. What exists today: nine records, opened at the source

3 states × 3 trades, each built from board pages fetched on 2026-09-03 and re-verified the same day.

| record | values | verified | unknown | licence types | reciprocity | sources | pass-B agreement | publishable |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `tx.hvac` | 56 | 46 | 10 | 2 | 2 | 5 | 46/46 | yes |
| `tx.plumbing` | 60 | 47 | 13 | 3 | 0 | 4 | 47/47 | yes |
| `tx.electrical` | 107 | 94 | 13 | 3 | 17 | 7 | 94/94 | yes |
| `fl.hvac` | 60 | 42 | 18 | 3 | 0 | 4 | 42/42 | yes |
| `fl.plumbing` | 42 | 29 | 13 | 2 | 0 | 4 | 29/29 | yes |
| `fl.electrical` | 39 | 20 | 19 | 2 | 0 | 3 | 20/20 | yes |
| `nc.hvac` | 61 | 42 | 19 | 2 | 6 | 5 | 42/42 | yes |
| `nc.plumbing` | 61 | 42 | 19 | 2 | 6 | 5 | 42/42 | yes |
| `nc.electrical` | 117 | 97 | 20 | 4 | 10 | 5 | 97/97 | yes |
| **total** | **603** | **459** | **144** | **23** | **41** | **35 unique** | **459/459** | **9/9** |

### 8.1 Nine findings that justify the whole exercise

Each of these is a thing a competent office manager gets wrong, and each is in the data with a URL:

1. **Texas plumbing is not TDLR.** The Texas State Board of Plumbing Examiners survived the 2019
   sunset and still regulates plumbing. Any product that routes Texas plumbing to TDLR is wrong at
   the first click.
2. **North Carolina, one state, two expiry algorithms.** NCBEEC electrical licences expire one year
   after issuance (anniversary). Plumbing and heating licences all expire **31 December**, and G.S.
   87-22 plus the board's own page say there is **no grace period** — all licensed activity must cease
   on 1 January.
3. **North Carolina abolished plumbing/heating CE in 2012.** Zero hours, no approved providers, no
   reporting. The electrical board next door requires 8 hours a year with at least half in a live
   classroom. A single "North Carolina CE" rule is wrong for one of the two trades.
4. **Florida renews certified licences in even years and registered licences in odd years**, both on
   31 August. Same trade, same board — one letter in the licence code puts two colleagues a year apart.
5. **Florida's 14 CE hours are six separate mandates.** A licensee who takes 14 general hours has
   still failed to renew. Counting to 14 is the obvious implementation and it is wrong.
6. **Florida electrical is 11 hours, not 14**, on a different board, with 2 extra false-alarm hours
   *conditional on doing alarm work* — a CE rule keyed to a company attribute, not to a licence class.
7. **Texas electrical contractors need no CE at all** — the board says so in terms — **but the Master
   Electrician the contractor licence depends on needs 4 hours.** The trap is that the company licence
   looks compliant while the person it rests on is not.
8. **Texas gives you 30 business days** to name a replacement Master Electrician when yours leaves.
   That is a deadline with a trigger that is not a date on a licence, which is why the engine models
   deadlines as events (spec 05).
9. **Reciprocity mostly runs one way.** Texas accepts master electricians from 7 states and journeymen
   from 10, and explicitly has **no** agreement for any other licence type. North Carolina's electrical
   board has formal agreements with 10 states. Texas ACR has exactly two, and a South Carolina
   *heating* licence does not qualify while a South Carolina *air conditioning and heating* licence
   does. This asymmetry is the entire value of the $750–1,500 playbook.

---

## 9. What is deliberately missing, and where it is written down

Every record carries `coverage_notes` — the gaps in the customer's own words — and gate G12 fails the
build without them. They are rendered at the foot of every playbook. **A gap the customer can see is a
gap that does not become a refund.**

The main ones today:

- **Texas HVAC technician registration and certification** — the credentials most of a Texas roster
  actually holds — are not modelled. Only the two contractor classes are.
- **North Carolina plumbing/heating technician licences** (Class I 3,000 hours, Class II 2,500 hours)
  are named on the board's page and not modelled; the board offers 31 qualifications and 2 are in.
- **NCBEEC numeric experience requirements** live in the Exam Application packet, which was not
  fetched. Every experience field in `nc.electrical` is empty on purpose.
- **Florida reciprocity** — the CILB's "Reciprocity and Substantially Equivalent Exams" and
  "Endorsement" documents were not fetched, so all three Florida records have an unknown reciprocity
  statement rather than an empty list presented as "none". This is the G7 warning and it is correct.
- **Florida CILB application fees.** Two attempts: the CILB 5-G/5-H PDF is an image form with no
  extractable text, and rule 61G4-12.011 turned out to be *Definitions*, not Fees. Left empty.
- **Florida registered electrical (ER) renewal cycle and CE hours** — the table read covers the
  certified classes. Recorded at low confidence and flagged.
- **The Texas plumbing renewal cycle is a medium-confidence inference** (§10, assumption 1) and
  propagates to every derived deadline in that state.
- **County and municipal licensing everywhere.** The honest hard problem, and a "later" in
  `BACKLOG.md` rather than a half-answer.

---

## 10. Assumptions taken, flagged in the data

Three, all recorded at `confidence: medium` on the affected values, all reachable from the product's
`needsHumanCheck` flag:

1. **Texas plumbing licences renew annually.** TSBPE never prints the word. The inference is from its
   own "yearly CPE requirement" wording plus late-renewal bands measured in days from expiry. **First
   item in the wave-2 queue: open Texas Occupations Code ch. 1301.**
2. **NCBEEC's per-classification figure** ("Unlimited License - $200/year") is both the application fee
   and the annual renewal fee. The board publishes one number and calls it per year.
3. **Florida's "+$50 per qualified business"** implies the qualifying-individual model for CILB
   licences.

Nothing was estimated. No fee, hour count, timeline or bond amount was inferred from a third-party
guide, from a sibling state, or from memory.

---

## 11. The remaining 36 records: where they come from and what they cost

The 9 built are 20% of launch scope. The other 36 come from the same class of source, and the work is
now a known quantity because the tooling exists.

### 11.1 Source map for the remaining twelve states

| state | HVAC | plumbing | electrical | difficulty |
|---|---|---|---|---|
| **CA** | CSLB C-20 | CSLB C-36 | CSLB C-10 + DIR electrician certification | **medium** — one board (`cslb.ca.gov`), but electrician *certification* is a separate DIR programme from the C-10 *contractor* licence, and both must be modelled |
| **NY** | none at state level | none at state level | none at state level | **hard** — `local_only`. NYC DOB, Buffalo, Yonkers, Westchester each separately. The record's value is saying so clearly. |
| **PA** | none at state level (HIC registration only) | local | local | **hard** — `state_optional_local_required`; Philadelphia and Pittsburgh dominate |
| **IL** | local | **IDPH state plumbing licence** | local | **medium** — plumbing is genuinely state (`dph.illinois.gov`), the other two are Chicago-led |
| **GA** | State Construction Industry Licensing Board — Conditioned Air | Master/Journeyman Plumber | Electrical Contractor | **easy** — three divisions under `sos.ga.gov`, already referenced by Texas's and North Carolina's reciprocity pages |
| **OH** | Ohio Construction Industry Licensing Board (HVAC) | OCILB | OCILB | **easy** — one board, `com.ohio.gov`, all three trades |
| **NJ** | HVACR Contractors Board | Master Plumbers | Electrical Contractors | **medium** — three boards under `njconsumeraffairs.gov`, consistent layout |
| **MA** | none (sheet metal + refrigeration split) | Plumbers and Gas Fitters | Electricians | **medium** — `mass.gov` licensing pages; the HVAC answer is a split, which is itself the finding |
| **CO** | local | State Plumbing Board | State Electrical Board | **medium** — `dpo.colorado.gov`; HVAC is municipal, which is a `local_only` record |
| **AZ** | ROC C-39 / K-39 | ROC C-37 / K-37 | ROC C-11 / K-11 | **easy** — one registrar (`roc.az.gov`), classification list is published as a table |
| **MI** | Mechanical Contractor (LARA) | Plumbing (LARA) | Electrical (LARA) | **easy** — one department, `michigan.gov/lara` |
| **VA** | DPOR tradesman + contractor | DPOR | DPOR | **medium** — `dpor.virginia.gov`, two-layer (tradesman licence *and* contractor licence), which is a genuine modelling addition |

### 11.2 Effort estimate

Measured from the nine built today, not guessed:

| activity | per record | evidence |
|---|---|---|
| Fetch and read the board pages | ~35 min | 35 sources across 9 records, 3–7 per record |
| Extract into the SourcedValue envelope | ~35 min | ~67 values per record on average |
| Pass B + fixing what it catches | ~15 min | 24 defects across 9 records on the first run |
| Coverage notes and review | ~15 min | – |
| **total** | **~1.7 hours per record** | |

Records within a state share sources heavily (Texas's three records share zero boards; North
Carolina's HVAC and plumbing share five of five), so the practical unit is a **state**, at roughly
**3.5–5 hours for three trades**, with the four "easy" states at the bottom of the range and NY, PA
and CA at the top.

**36 records ≈ 60–70 agent-hours ≈ 4 parallel agents × 2 days**, plus a human review pass on the
`needs_human_check` values. The sequencing that maximises revenue per hour:

1. **GA, OH, AZ, MI** (easy, one board each) — 12 records, ~14 hours. Georgia is also named in Texas's
   ACR reciprocity, so it closes a loop for existing customers.
2. **VA, NJ, CO, MA** — 12 records, ~20 hours. Virginia's two-layer model needs a schema addition
   (`tradesman` rung already exists in the enum).
3. **CA** — 3 records, ~6 hours. Largest market, and the DIR/CSLB split needs care.
4. **NY, PA, IL** — 9 records, ~20 hours. Mostly `local_only`; the deliverable is an honest map, and
   the temptation to fake a state licence must be resisted (gate G7 helps).

### 11.3 What would change the estimate

- A board behind Cloudflare or returning 403 to every client. None of the nine hit this, but the
  phase-3 file records PHCC, NECA and several franchisor sites doing exactly that. Budget one state
  in three needing a second approach.
- A state that publishes fees only in a PDF fee schedule (Florida already does this and we left the
  field empty rather than guess). Expect 1–3 empty fee fields per state; that is acceptable and
  visible.
- Any state where the answer is "it depends on the county". That is a coverage note, not a research
  problem, and it takes less time, not more.

---

## 12. Disclaimer

The full text is in `specs/12-legal-and-disclaimers.md` and is reproduced on `/legal/disclaimer`, in
the footer of every page, at the head of every expansion playbook, in every alert email, and beside
every value flagged `needs_human_check`. Its load-bearing sentences:

> StateReady is a tracking and research tool. It is not legal advice and it is not a licensing
> service. … Every value we show you carries the web address it came from and the date we last
> checked it. … We do not cover county or city licensing, permits or registrations, which exist in
> most states in addition to the state licence. … Where we could not establish a fact from a public
> source, we say so and leave it blank — we never estimate a fee, an hour count or a processing time.
> … The licensing board, not StateReady, is the authority on your licence.

It is written this way because a vague disclaimer destroys the product's value proposition without
protecting anyone. Naming what we do *not* do is what makes the rest of it credible.

---

## 13. Files

```
ontology/
  schema.sourced_value.json          the envelope every fact travels in
  schema.state_trade_record.json     one (state, trade) record
  official-hosts.json                the source allowlist, with reasons, and the rejected list
  id-grammar.md                      append-only identifier rules and versioning
kb-data/
  tx-hvac.json  tx-plumbing.json  tx-electrical.json
  fl-hvac.json  fl-plumbing.json  fl-electrical.json
  nc-hvac.json  nc-plumbing.json  nc-electrical.json
  _sources.json                      35 sources with content hashes (the drift baseline)
  _launch_states.json                the 15 states, with the BLS numbers they came from
kb-scripts/
  lib_kb.py            shared fetch / normalise / hash — one implementation, three consumers
  sources.json         the source catalogue
  build_records*.py    the researched values -> kb-data/*.json
  validate.py          schema + 13 gates; exit non-zero blocks the build
  verify_pass_b.py     the second verification pass; computes `publishable`
  refresh_sources.py   drift baseline and daily drift check
  rank_states.py       reproduces the 15-state ranking from BLS QCEW
research/raw/          the fetched pages, kept so a reviewer can check a reading without re-fetching
```

Run order for a clean rebuild:

```bash
python3 kb-scripts/rank_states.py --write        # the launch-15 definition
python3 kb-scripts/refresh_sources.py --write-baseline
python3 kb-scripts/build_records.py
python3 kb-scripts/validate.py                   # must exit 0
python3 kb-scripts/verify_pass_b.py              # must report 0 disagreements
python3 kb-scripts/refresh_sources.py            # daily drift check
```

---

## 14. Open questions for the founder

1. **Do we widen states or trades first?** The phase-3 prospect file's twenty highest-fit accounts are
   dominated by roofing, fire protection and restoration platforms, none of which we cover, while the
   HVAC/plumbing/electrical platforms mostly already operate in more than 15 states. Trades and states
   pull in different directions and the answer is a positioning decision, not a data one.
2. **Is the playbook guarantee acceptable as written?** "Full refund if a board tells you something in
   this document is wrong" is bounded and cheap if the data is good. It is still a promise the founder
   owns (PLAN.md A5).
3. **How long should a `last_verified` date be allowed to age before the product stops showing the
   value as verified?** G13 warns at 400 days; monthly re-verification should keep everything under
   35. A hard cut-off is a product decision with a churn consequence.
4. **Do we publish `/coverage` before launch?** It is the most credible page we could put on the
   internet and it also tells competitors exactly what we have.
5. **State-specific consumer-protection wording** in the terms — out of scope for wave 1 and needs
   counsel, not an agent.
