# CORRECTIONS — the struck-claims register

**Product:** Ratepin · **Status:** binding, canonical · **Opened:** 2026-08-13
**Closes:** `DESIGN_REVIEW.md` **HIGH-7** · **Implements:** canonical resolution **R-HIGH7**
**Every figure in this file was re-fetched in-session on 2026-08-13.** Nothing here is from memory.

---

## 0. What this file is, and what defers to it

A claim that survived ideation, got printed into a decision document, and was then
falsified by measurement does not die when someone writes a rebuttal paragraph. It dies
when the string that carries it cannot be reprinted without failing a build. HIGH-7 is the
finding that we had the rebuttals — `research/02` §Finding 2, `CORPUS_DESIGN.md` C1,
`NAMING.md` C-N3, `BRAND.md` §5.4 — scattered across five documents, none of which was
authoritative, and none of which the next agent to write copy was obliged to read.

**This file is that authority.** It is the single source of truth for every claim struck by
evidence. Its scope is deliberately wider than HIGH-7's moat sentence, because the moat
sentence was not the only one: six claim families entered phase 2 in the winning pitch and
six were refuted or unverifiable.

| Document | Relationship to this file |
|---|---|
| `identity/BRAND.md` §5.4, §5.5 (retired claims, printable numbers) | **Defers.** BRAND holds the *voice* — how a replacement sentence is phrased. This file holds the *verdict* and the evidence. Where they differ, this file governs the fact and BRAND governs the wording |
| `architecture/CORPUS_DESIGN.md` C1 | **Defers** on the moat claim (X-1). CORPUS_DESIGN remains the authority on ingest and on why we retain revisions anyway |
| `identity/NAMING.md` C-N3 | **Defers.** C-N3's conclusion (the name attaches to the pin, not the archive) stands and is downstream of X-1 |
| `phase-1-ideation/IDEA_DOSSIER.md` header errata, `research/01`, `research/02`, `research/04` | **Source documents.** They found these facts; this file is where the findings become enforceable |
| `phase-1-ideation/shortlist.json`, `raw-ideas.json`, `votes.json`, `autonomy-rejections.json` | **Frozen evidentiary inputs.** Exempt by path from the linter (§3.1) — they record what was believed on 2026-08-13 and are never edited |
| `phase-1-ideation/site/index.html`, `VOTE_RESULTS.md` | **Historical record**, but *not* exempt. The struck strings live there permanently and must be **marked**, never edited away — deleting the evidence of a mistake is how the mistake comes back |
| **Phase 3 acquisition, all app copy, all landing pages, all outreach drafts** | **Bound absolutely.** Scope A below. Zero blocking occurrences, no marker escape |

### 0.1 The standing rule that replaces reviewer vigilance

R-CRIT1 established a rule for probes: *no probe may be given blocking power until its red
rate has been measured against the live corpus and recorded in the document.* This is the
same rule pointed at prose:

> **No claim may be printed on any surface until its source has been fetched and recorded
> here — URL, the figure as the source states it, and the date of the fetch. A claim whose
> source is another vendor's blog, an SEO comparison page, or a previous document of our
> own is not sourced. It is repeated.**

Four of the six entries below are repetitions of exactly that kind: a competitor's blog
(X-4), a per-response figure read per-employee (X-2), a number with no traceable origin at
all (X-3), and a penalty from a different statute (X-5). Not one of them required
specialist knowledge to catch. Each required a single fetch that nobody performed, because
performing it was nobody's job. It is now the linter's job.

### 0.2 How this interacts with the refusal primitives

The register never creates a human step and never routes anything to a person. It is the
copy-surface analogue of what P-A…P-D already do in the product.

| Situation | Primitive | Behaviour |
|---|---|---|
| A gate-locked claim has not been measured yet | **P-D** — declined conclusion | The renderer emits the mechanism sentence ("how it works"), not the outcome sentence. We state what we do and decline to state what it achieves |
| A measured claim regresses below its gate | **P-C** — narrowed claim | `claims.json` flips false on the next measurement run; live copy narrows automatically to the mechanism sentence. No banner is owed to a *prospect*, but a **customer**-facing claim that narrows follows P-C in full (dated banner, auto-credit where the narrowing is our failure) |
| A struck string is found on a shipping surface | build failure | The deploy fails closed (A5). Nobody is paged; the string cannot ship |
| Someone asks for a number we have not measured | **P-D** | The answer is the mechanism plus the gate that would unlock the number, in-product. Never a sales contact (A3) |

---

## 1. How to read an entry

Each entry carries seven fields. The `probe` field is the load-bearing one: it is what CI
runs, and it is machine-readable in §3.

| Field | Meaning |
|---|---|
| **Claim as written** | Verbatim, with its origin file. Never paraphrased — a paraphrase cannot be grepped |
| **Origin** | Where it entered, and how it propagated |
| **Verdict** | `FALSE` · `MISATTRIBUTED` · `UNVERIFIED` · `TRUE-BUT-MISAPPLIED` · `INVERTED` |
| **Verified** | What the primary source actually says, with URL, method and fetch date |
| **Replacement** | The sentence that IS defensible, ready to print |
| **Probe** | A short grep-able string / regex for the CI check. Blocking probes match the struck string itself; the broader category patterns are advisory and are marked as such in §3.2 |
| **Primitive** | Which refusal primitive covers the gap the struck claim used to fill |

**The marker convention.** A struck string may appear in a design or historical document
**only** when marked. On a shipping surface it may not appear at all. Three ways to mark,
in increasing scope — use the tightest one that fits:

| Tier | Marker placement | Covers |
|---|---|---|
| **Line** | `[STRUCK:X-n]` anywhere on the line | that line |
| **Block** | the marker in a fenced block's info string — ` ```text [STRUCK:X-1] ` | every line in the block |
| **Section** | the marker on a heading line — `### X-1 — … [STRUCK:X-1]` | every line from that heading to the next heading of the same or higher level |

A marker may name several entries: `[STRUCK:X-2,X-3]`. `[STRUCK:ALL]` covers every entry and
is reserved for the register's own machinery (§3.3, §3.5) and reference lists.

This is what lets this file quote the claims it forbids, and it is why quoting them elsewhere
in order to correct them stays legal while reprinting them does not. The marker is also the
audit trail: `grep -rn 'STRUCK:' run-2/` enumerates every place in the company where a struck
claim is discussed, which is a question no one could previously answer.

---

## 2. The register

### X-1 — The wage-determination archive is a cornered resource  `[STRUCK:X-1]`

**Claim as written** — `phase-1-ideation/shortlist.json`, Moat (Helmer): [STRUCK:X-1]

> "Moat (Helmer, cornered resource): SAM.gov publishes no bulk wage-determination download,
> so a mirrored full revision history with per-classification diffs is assembly nobody else
> has"

…promoted in `IDEA_DOSSIER.md` §"Moat and retention (1st)": [STRUCK:X-1]

> "The WD revision history is a cornered resource: SAM publishes no documented bulk download
> or public API… **You cannot retroactively buy what a WD said last March.**"

…and used as the deciding contrast against the runner-up: [STRUCK:X-1]

> "its moat is not time-locked the way the pitch claims… Contrast [Ratepin]: SAM overwrites,
> and a superseded revision is gone."

**Origin.** An inference, never a measurement. The absence of a *documented* bulk endpoint
was read as the absence of *any* retrieval path. It then carried a lens — Moat and
retention, 1st place — in a Borda vote the idea won 40 to 33.

**Verdict: FALSE.** In both directions: superseded revisions are retrievable, and the
runner-up's SBOM archive was disparaged on a symmetry that does not exist.

**Verified 2026-08-13.**

```text [STRUCK:X-1]
$ curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" \
    https://sam.gov/api/prod/wdol/v1/wd/WA20200002/0/download
303  https://iae-wdol-sam-gov.s3.amazonaws.com/WDOL_FILES_PROD/DBA/ARCHIVE/FY2020/wa2.r0.txt
     ?response-content-disposition=attachment%3B%20filename%3Dwa2.r0.txt
     &X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=14400&X-Amz-Credential=…&X-Amz-Signature=…

$ curl -sSL … → 200, 26,809 bytes, text/plain
  "General Decision Number: WA20200002 01/03/2020
   Superseded General Decision Number: WA20190002
   State: Washington"
```

A determination published in **January 2020**, six years superseded, served today as plain
text over a pre-signed URL the API mints on demand. (The JSON-wrapped form at
`wdol/v1/wd/WA20200002/0` returns 27,748 bytes per `CORPUS_DESIGN.md` C1; the 26,809 here is
the unwrapped archive object. Both are the same document.)

Second, and worse for the claim: **someone already sells the series.**
`govconapi.com/sam-gov-wage-determination-api`, fetched 2026-08-13, states verbatim:

> "SAM keeps every superseded revision of a determination, not just the one in force."

Coverage as published on that page: **90,033 determinations** (as of 2026-07-16) — DBA
68,737, CBA 18,630, SCA 2,666 — with roughly **495,000 per-classification rate lines**, and
filters `active_only`, `type`, `state`, `county`, `construction_type`, `date_from`/`date_to`,
`wd_number`. The page notes only **~6% of DBA records are active (4,235 of 68,737)** — the
rest *are* the revision archive. That 4,235 independently corroborates our own measured
4,236 active DBA determinations on 2026-08-13, one day and one record apart, which is a
useful side-effect for G3's denominator.

Price, from `govconapi.com/pricing` fetched 2026-08-13: **Developer $19/month** — "Direct
access to the raw data corpus, every federal dataset in clean JSON", with Wage Determinations
listed among Core products — **Pro $39/month**, and a **$0 / 14-day free trial** with "no
credit card required" and full API access. Per Helmer, a resource that a competitor can
*rent for $19 a month, self-serve, today* is not cornered. It is a commodity input.

**Replacement — printable.**

> Ratepin keeps a dated copy of every revision it has seen, so a superseded revision is still
> readable here after SAM overwrites the live document — with the revision number, publish
> date and snapshot hash the artifact was computed against, printed on the artifact.

**The moat, restated (R-HIGH7).** **Assembly + latency + crosswalk memory.**

1. **Assembly** — the archive is retrievable but not *assembled*: the S3 bucket is not
   listable (403) and the unsigned path 403s, so retrieval requires knowing `(wdNumber,
   revision)` in advance. That is a bounded crawl, not an impossibility. What we sell is the
   crawl having already been run, reconciled against the index, and pinned per project.
2. **Latency** — the interval between a revision being published and the customer's next
   filing reflecting it. Unmeasured; gate-locked; see §4.
3. **Crosswalk memory** — payroll title → SOC → WD class → fringe treatment, grown from
   confirmed customer choices. The only asset here that compounds from use rather than from
   crawling. Also unmeasured (H2, H-J6), and constrained by **R-HIGH2**: the cross-tenant
   aggregate may only **order** a candidate list; it may never pre-select, default, or
   auto-apply a classification for another tenant. Per-account memory may auto-apply,
   because an account confirming its own choice is not a sybil vector — an attacker
   poisoning their own account poisons only themselves, whereas an attacker who could tilt
   the cross-tenant prior gets leverage proportional to the number of accounts they can
   cheaply mint. Ordering-only caps that leverage at "a wrong option appeared higher in a
   list a human then chose from" instead of "a wrong rate was applied silently".

Note what did **not** change: we still retain every revision forever. C1's engineering
justification — D7's pinned-mirror generation path, reproducibility of an eighteen-month-old
artifact, and never depending on SAM being up at 16:00 on a Friday — never rested on
scarcity. Only the *marketing* claim did.

**Probe.** `retroactively (buy|acquire|purchase)` · `no (documented )?bulk .{0,24}download` ·
`superseded revisions? (is|are) (gone|lost|unrecoverable)` · `(is|as) an? cornered resource` ·
`cannot be reconstructed` (of a WD revision). Scope A additionally forbids the bare string
`cornered resource`; Scope B permits it when citing Helmer's concept, marked.

**Primitive.** P-D. Where the old copy asserted uniqueness, the product now shows provenance
and declines the superlative.

---

### X-2 — "Over an hour per employee per report — 15+ hours a week, ~$19,500/yr"  `[STRUCK:X-2,X-3]`

**Claim as written** — `phase-1-ideation/shortlist.json`, JTBD: [STRUCK:X-2]

> "a single form carries ~168 discrete data points per worker and DOL-derived estimates put
> manual completion at **over an hour per employee per report** — **15+ hours a week** for a
> 15-person crew, **~$19,500/yr** on one project."

**Origin.** DOL's published Paperwork Reduction Act burden estimate, read **per employee**
when it is stated **per response**. Vendor blogs repeat the same misreading widely, which is
how it acquired the feel of a known fact.

**Verdict: FALSE.** Not a rounding disagreement — a unit error that inflates the pain by
roughly the crew size.

**Verified 2026-08-13** from the primary document: 89 FR 70670, published 2024-08-30, pages
70670–70671, "Agency Information Collection Activities: Comment Request; Information
Collections: Davis-Bacon Certified Payroll", FR Doc. 2024-19482, dated August 23, 2024.
Fetched as raw text (10,549 bytes) from federalregister.gov. Verbatim:

```text [STRUCK:X-2]
    OMB Control Number: 1235-0008.
    Agency Numbers: Form WH-347.
    Total Estimated Respondents: 122,936.
    Total Annual responses: 11,310,112.
    Estimated Total Burden Hours: 10,556,105.
    Estimated Time per Response: 55 minutes to complete the WH-347 form
or its equivalent plus 1 minute for recordkeeping (total of 56 minutes
per form).
    Frequency: Weekly, during the course of a covered construction
project.
    Total Burden Cost (capital/startup): $0.
    Total Burden Cost (operating/maintenance): $1,764,379.
```

The form's own OMB burden statement agrees — `dol.gov/agencies/whd/forms/wh347`, control
number 1235-0008, expires 01/31/2028: "we estimate that it will take an average of **55
minutes to complete this collection of information**." A collection is a **form**, and one
form's grid holds many worker rows.

Arithmetic, all four figures from the block above:

| Derived | Value | Working |
|---|---|---|
| Responses per filer per year | **92.0** | 11,310,112 ÷ 122,936 |
| Burden hours per filer per year | **85.9** | 10,556,105 ÷ 122,936 |
| Burden hours per filer per **week** | **1.65** | 85.9 ÷ 52 |
| Non-labour cost per filer per year | **$14.35** | $1,764,379 ÷ 122,936 |
| Internal check: minutes per response | **56.0** | 10,556,105 × 60 ÷ 11,310,112 ✓ |

So the struck figures fail three ways at once:

- **"15+ hours a week"** against DOL's own per-filer average of **1.65 h/week** — inflated
  **9.1×**. Against the per-form figure for the weekly filing it purports to describe (one
  15-person crew, one form, 56 minutes) — inflated **16.1×**.
- **"Over an hour per employee per report"** — the estimate is 56 minutes per *report*,
  whatever the crew size.
- **"~$19,500/yr"** — reaching $19,500 across DOL's 85.9 annual hours requires a clerk billed
  at **$227.09 an hour**. The figure was never derived; it was multiplied out of the unit
  error.

**Replacement — printable: nothing.** No customer-facing surface carries a figure about time
or money saved, in any form, until **G4** publishes a measured in-product median across ≥100
real filings. The 56-minute figure remains citable *in engineering and analysis documents*
with its citation, because it is true; it is not printable on a customer surface, because the
only reason to put it there is to imply a saving, and implying a saving is what G4 gates. The
sanctioned customer-facing sentence is a mechanism, not an outcome:

> Upload the payroll CSV; the WH-347 and the statement of compliance come back with every
> rate pinned to a named wage determination, revision and publication date.

**Probe.** `\$?19,?500` · `15\+? ?hours a week` · `(over|more than) an hour per employee` ·
`per employee per report` · `hours? (a|per) week` adjacent to a numeral on a Scope A surface.

**Primitive.** P-D, until G4 flips it.

---

### X-3 — "~168 discrete data points per worker"  `[STRUCK:X-3]`

**Claim as written** — `phase-1-ideation/shortlist.json`, JTBD: [STRUCK:X-3]

> "a single form carries **~168 discrete data points per worker**"

**Origin.** Unknown. That is the finding.

**Verdict: UNVERIFIED.** Not disproved — *unsourced*, which for a printable claim is the same
disposition and a worse smell, because a false number can at least be traced.

**Verified 2026-08-13.** The number does not appear in DOL's WH-347 page or its instructions,
does not appear in the PRA clearance at 89 FR 70670, and a targeted web search for the figure
in connection with the WH-347 returns nothing carrying it. `research/01` reached the same
conclusion independently and guessed it may be a per-*page* count. A guess about the
provenance of an unsourced number is not a source either.

What the form actually contains, from DOL's own field list: per worker — name, address block
and identifying number (1A–1E); journeyworker/apprentice status (2); classification (3); a
**seven-day** hours grid split across straight-time and overtime rows (4); total hours (5);
rate of pay ST and OT (6A); total fringe credit (6B); cash in lieu (6C); gross for this
project (7A); gross for all work (7B); a deduction block, FICA / withholding / other, with
its total (8); and net pay (9).

**Replacement — printable.** Describe the shape, never a borrowed count:

> Every worker on the form carries a seven-day hours grid, two rate lines, a fringe block and
> a deduction block — and every one of those cells has to agree with a rate that was in force
> that week.

If a count is ever wanted, it must be **generated by our own renderer from its field map and
published with the derivation and the form revision it counts** — i.e. a measured number of
ours, with a reproducible method, not a number of someone else's. Counting "data points" is
definitionally arbitrary; a number whose definition is arbitrary can only be honest if we
publish the definition alongside it.

**Probe.** `168 (discrete )?data ?points` · `data ?points per worker` · `~168`.

**Primitive.** P-D.

---

### X-4 — "Incumbents are demo-and-quote with $995–$4,995 setup fees, so zero setup fee is the wedge"  `[STRUCK:X-4]`

**Claim as written** — `phase-1-ideation/shortlist.json`, Incumbents: [STRUCK:X-4]

> "Incumbents (LCPtracker, eBacon, Points North, eMars, Elation) are **demo-and-quote at
> $175–$1,200/mo with $995–$4,995 setup fees**, so **zero setup fee is itself the wedge**"

**Origin.** A competitor's blog, per `research/01`. It is true of the **agency-side**
products — the ones a public owner or a GC buys to grade *other people's* submissions — and
false of the **sub-facing** SKUs we actually compete with, including the sub-facing SKU built
by the largest of those same vendors.

**Verdict: TRUE-BUT-MISAPPLIED.** The band is not fabricated; it is attached to the wrong
market. Printing it as a fact about our competitive set is a false claim of ours about
someone else's pricing — the exact category of statement most likely to be answered in
public, by the vendor, with a screenshot of their own price page.

**Verified 2026-08-13, both price pages fetched directly.**

**LCPcertified** (`lcptracker.com/solutions/lcpcertified/`) — LCPtracker's own contractor-side
SKU. Published, self-serve, no login required. *Plus* package, verbatim:

| Line | Price |
|---|---|
| Per report | **$12** |
| Up to 5 Active Projects | **$145/Month** |
| Up to 10 Active Projects | $1,300/Year |
| Up to 25 Active Projects | $2,500/Year |
| Up to 50 Active Projects | $3,700/Year |
| Unlimited Active Projects | $7,400/Year |

No setup, implementation or onboarding fee appears anywhere on the page. Included: **CA DIR
XML Export, WA State L&I XML Export, MD DLLR XML Export** — three states of XML on day one,
against our one.

**CertifiedPayrollPro** (`certifiedpayrollpro.com`), verbatim: **Starter "$49/mo +
$5/report"** (up to 5 projects, 3 team members); **Pro "$99/mo + $3/report"** (up to 25
projects, 10 team members); **Enterprise "$249/mo + $1/report"** (unlimited). Setup fees
stated as **$0** across all plans, "**No contracts, cancel anytime**", **3 free reports** on
trial.

The consequences are not cosmetic and are already recorded in `research/03`: the cheap end is
occupied at $49 for five projects, and LCPcertified's $145 buys the same five projects that
D4's Crew tier priced at $249. **"Zero setup fee is the wedge" was already retired by D3**
before this register existed. This entry is why it must stay retired: not because the wedge
was weak, but because the sentence supporting it was false.

**Replacement — printable.** Two sentences, both survivable:

> No demo, no quote, no call — you can buy Ratepin and generate a filing without speaking to
> anyone. *(A mechanism claim about our own flow, per U4/A1 — never a price claim about a
> competitor.)*

> Competitor prices, where we cite them at all, are quoted from the vendor's own published
> page with the date we read it.

**Probe.** `\$995` · `\$4,?995` · `995\s*[–-]\s*\$?4,?995` · `demo[- ]and[- ]quote` ·
`zero setup fee` · `no setup fee` as a *differentiator* on a Scope A surface.

**Primitive.** P-D on the competitor claim; the mechanism sentence needs no gate because it
describes something the reader can verify by clicking Buy.

---

### X-5 — "DBA civil penalties run to $28,619 per violation"  `[STRUCK:X-5]`

**Claim as written** — `phase-1-ideation/shortlist.json`, WTP (Ramanujam): [STRUCK:X-5]

> "price against the avoided loss, not the seat — **DBA civil penalties run to $28,619 per
> violation** plus back wages with interest, three-year debarment and False Claims Act treble
> damages on each false submission"

**Verdict: MISATTRIBUTED.** The number is real. It belongs to a different statute,
administered by a different department, and there is no Davis-Bacon civil money penalty for
it to have been confused with.

**Verified 2026-08-13.**

- **28 CFR 85.5** (eCFR API, `versioner/v1/full/2026-08-11`, title 28 part 85 §85.5),
  "Adjustments to penalties for violations occurring after November 2, 2015": for
  **31 U.S.C. 3729(a)** — the **False Claims Act** — penalties assessed after **July 3, 2025**
  carry **Min $14,308 / Max $28,619**; the prior column (12 Feb 2024 – 3 Jul 2025) was
  $13,946 / $27,894. Source note `[90 FR 29447, July 3, 2025]`. That is DOJ's per-*claim*
  penalty range, and it is where $28,619 comes from.
- **WHD's civil money penalty table** (`dol.gov/agencies/whd/resources/penalties`), fetched in
  full: it lists EPPA, FLSA (homeworker, child labor, wage violations, §203), FMLA, D-1, H-1B,
  H-2A, H-2B, MSPA, OSH Act, USMCA, Walsh-Healey PCA, and CWHSSA. **There is no Davis-Bacon
  Act or DBRA civil money penalty on it.** The claim describes a penalty that does not exist.
- **CWHSSA** (`40 U.S.C. 3702(c)`, implemented at **29 CFR 5.5(b)(2)**, eCFR fetched
  2026-08-13): liquidated damages "in the sum of **$33** for each calendar day on which such
  individual was required or permitted to work in excess of the standard workweek of forty
  hours". Per worker, per day. This is the only per-unit money figure in this neighbourhood
  that attaches to Davis-Bacon-adjacent work, it is 867× smaller than the number that was
  printed, and it is **a dated corpus value, not a constant** — it lives in the
  effective-dated constants table with an `authority` column (`CORPUS_DESIGN.md` §, same table
  that holds the FCA range), so that 2026 figures are never applied to 2024 work.
- **DBRA's actual remedies**, which the claim buried under the wrong headline: back wages with
  interest, contract-fund withholding, and **three-year debarment under 29 CFR 5.12**. FCA
  exposure is real and attaches because each certification is a claim — but the exposure is
  FCA exposure, under FCA numbers, and saying so correctly is not weaker than saying it wrong.

Note the interaction with **R-CRIT3**: the same $100,000 CWHSSA threshold that determines
whether liquidated damages can arise at all is what the `contract_value_band` collects at
project setup, and `unknown` blocks certifiable generation with **P-B** rather than guessing.
The penalty figure and the threshold are the same regulation read honestly in both directions.

**Replacement — printable: nothing.** No penalty figure appears on any customer-facing
surface. We do not sell on fear, and a product whose entire promise is "the number on your
form is defensible" cannot open with an indefensible number about what happens if it is not.
Where the exposure genuinely must be described — in-product documentation of why a line
blocked, for instance — it is described as the regulation states it, from the dated constants
table, with its `authority` cite.

**Probe.** Scope A: `\$?28,619` · `\$?14,308` · `civil (money )?penalt` · `debarment` ·
`penalt` adjacent to a dollar figure — all zero, unconditionally. Scope B: the *attachment* is
what fails — `(DBA|Davis[- ]Bacon).{0,80}(28,619|civil money penalt)` and
`(28,619|14,308).{0,80}(DBA|Davis[- ]Bacon)`.

**Primitive.** P-D.

---

### X-6 — Enforcement pressure is rising  `[STRUCK:X-6]`

**Claim as written** — `phase-1-ideation/shortlist.json`, WTP: [STRUCK:X-6]

> "…and **WHD recovered $259M in FY2025**."

The single recovery figure is accurate. What it was doing in the pitch — sitting immediately
after the penalty sentence, as the evidence that risk is high and climbing — is the claim, and
it is the one that would have been written into acquisition copy as "enforcement is
intensifying."

**Verdict: INVERTED.** Case frequency has fallen by nearly two thirds over twelve years.

**Verified 2026-08-13** from WHD's own fiscal-year data,
`dol.gov/agencies/whd/data/charts/government-contracts`, DBRA table, columns FY2013 → FY2025:

| | FY2013 | FY2025 | Change |
|---|---|---|---|
| Concluded Compliance Actions | **1,711** | **641** | **−62.5%** |
| Back Wages | $27,952,140 | $26,754,050 | −4.3% |
| Recovery per concluded action *(derived)* | $16,337 | **$41,738** | **+155%** |

The honest shape of the fact is the opposite of the pitch's: **fewer cases, each one bigger.**
Probability of audit down; severity given an audit up. Copy implying a high or rising
likelihood of audit is unsupported by the only public series that measures it.

Two more dated facts that cut the same way and must not be omitted when this topic is
discussed internally: California DIR **paused** enforcement of contractor registration and
eCPR submission from 22 June 2024 to 22 June 2025 (`research/01`), so "mandatory weekly XML"
was legally true and practically suspended inside the last 24 months; and the buying trigger
we actually observed is not enforcement at all — it is the **GC withholding the progress
draw**, which happens every week regardless of what WHD's case count does.

**Replacement — printable.** Sell the draw, not the audit:

> The GC will not release the draw until the payroll is right. Ratepin makes it right on the
> first submission, and prints which wage determination revision it was computed against.

If the enforcement trend is ever cited internally, cite it with its direction:

> DBRA concluded compliance actions fell from 1,711 in FY2013 to 641 in FY2025 (WHD
> fiscal-year data, read 2026-08-13), while recovery per concluded action rose from ~$16.3k to
> ~$41.7k.

**Probe.** `\b(rising|increasing|increased|growing|heightened|intensified|stepped[- ]?up|renewed|aggressive)\s+(enforcement|scrutiny|audit\w*)\b` ·
`\b(enforcement|audits?|scrutiny)\b.{0,40}\b(is|are|has|have) (been )?(rising|increasing|climbing|intensifying|up)\b` ·
`\b(likelihood|odds|probability|risk|chance) of (an? )?audit\b` · `crack(ing|ed)? down` ·
`\$259 ?M` on a Scope A surface.

**A caveat this register states rather than hides.** X-6 is the one entry whose claim is a
*framing* rather than a string, and no regex catches a framing reliably. The word-boundary
form above was tightened after the loose first draft matched "Nielsen heu**ris**tic **audit**"
in two documents — a probe with a false-positive rate is a probe that gets disabled, which is
CRIT-1's lesson applied to prose. Paraphrase is caught downstream instead, by **CL-2**: an
unattributed numeral on a public surface fails the build regardless of the sentence around it.

**Primitive.** P-D.

---

## 3. The CI check — `claims-lint`

The register **is** the lint configuration. Adding an entry above extends CI automatically;
there is no second list to keep in sync, because a second list is how HIGH-7 happened.

### 3.1 Two scopes

| Scope | Paths | Rule |
|---|---|---|
| **A — shipping surfaces** | `app/**` (all rendered copy, email templates, PDF/XML footers), `identity/landing/**`, `phase-3-acquisition/**`, `claims.json`, any generated programmatic page | A **blocking** match fails the build. No marker escape for the blocking set |
| **B — design & history** | every other tracked `.md`, `.json`, `.html`, source file in `run-2/**` | A blocking match is permitted **only** when marked per §1. An unmarked match fails the build |

Scope B has no allowlist by filename, deliberately. Allowlists rot: a file gets added, someone
adds it to the allowlist to make the build green, and the register stops being enforced
exactly where the new copy lives. Requiring the marker means the correct action for a genuine
quotation — mark it — is cheaper than the incorrect action, and leaves a permanent, greppable
trail of every place a struck claim is discussed. `shortlist.json`, `raw-ideas.json`,
`votes.json` and `autonomy-rejections.json` are exempt by path and are the **only** exemption:
they are frozen evidentiary inputs, and editing them to satisfy a linter would destroy the
record of what was believed on 2026-08-13.

### 3.2 Two severities, and why — the register applied to itself

**R-CRIT1's standing rule is that no probe may block until its red rate has been measured
against the live corpus and recorded in the document.** That rule binds this document's own
probes. All 35 were measured on 2026-08-13 against the tree as it stands — **209 tracked
Scope A files, 46 Scope B documents** — before any of them was given blocking power.

| Probe set | What it matches | Measured on Scope A, 2026-08-13 | Verdict |
|---|---|---|---|
| **`probes`** — 24 patterns, the struck strings themselves | "retroactively buy", "$19,500", "168 data points", "$4,995", "demo-and-quote", `Davis-Bacon…civil money penalty`, "rising enforcement", "cannot reconstruct" | **1 raw hit, and it is a negation**: `landing/index.html:2036` reads *"There is **no** Davis-Bacon civil money penalty"* — the page correcting the error, not committing it. Suppressed by the guard | **BLOCKS.** Red rate after guard: **0 / 209 files** |
| **`hygiene`** — 11 patterns, the broader category ban: any penalty figure, any hours-per-week numeral, the bare term "cornered resource", "no setup fee" | — | **5 raw hits, all five legitimate copy**; 2 survive the guard: an app README explaining Helmer's test, and a citation link that explicitly says *"Cited so you can check it; not reproduced, because we do not sell on it"* | **ADVISORY. Does not block.** 100% false-positive rate — a probe with that red rate is a specification bug, not an incident |

That second row is the finding, and it is the one this section exists to record. Written the
obvious way — *ban the whole category on the sales page* — `claims-lint` would have failed the
build on five pieces of copy that are doing exactly what the brand asks, including the page's
own honesty section. A linter that red-flags correct work is a linter someone disables, and
the disabling happens quietly, and then nothing is enforced. **This is CRIT-1 recurring in a
different medium**, and it is caught here only because the rule was applied before the probe
was armed rather than after the corpus quarantined itself.

**The negation guard.** A blocking probe does not fire on a line that also matches
`\b(no|not|never|nor|isn't|is not|there is no|misattribut\w*|struck|retired|refuted|banned|forbidden|⛔)\b`
within the same sentence. Correcting a false claim requires stating it; the guard is what
distinguishes *"DBA penalties run to $28,619"* from *"there is no DBA civil money penalty."*
Measured effect: removes the single Scope A false positive, introduces none. It is deliberately
crude — a reprint that smuggles itself past by including the word "not" is caught by CL-2 and by
the fact that someone had to write a strange sentence to do it.

**What the advisory set does instead.** Every `hygiene` match is written to a
`copy_advisory` report attached to the build — recorded, surfaced, never blocking — precisely
the disposition R-CRIT1 gives `advisory_variance` in the ingest path. A hit is expected to
carry `[CITED:X-n]` in a comment where the author has consciously decided the mention is
correct. An uncommented advisory hit is a code-review prompt, not a failure.

### 3.3 Machine-readable probes

```json [STRUCK:ALL]
{
  "version": 2,
  "as_of": "2026-08-13",
  "negation_guard": "\\b(no|not|never|nor|isn't|is not|misattribut\\w*|struck|retired|refuted|banned|forbidden|⛔)\\b",
  "frozen_paths": ["shortlist.json", "raw-ideas.json", "votes.json", "autonomy-rejections.json"],
  "entries": [
    { "id": "X-1", "subject": "cornered-resource moat",
      "probes": ["retroactively (buy|acquire|purchase)",
                 "no (documented )?bulk .{0,24}download",
                 "superseded revisions? (is|are) (gone|lost|unrecoverable)",
                 "(is|as) an? cornered resource",
                 "(cannot|can not|can't|impossible|unable|no way).{0,40}reconstruct",
                 "reconstruct\\w*.{0,40}(impossible|cannot|is gone|unavailable)",
                 "unreconstructable"],
      "hygiene": ["cornered resource"] },
    { "id": "X-2", "subject": "DOL burden read per employee",
      "probes": ["\\$?19,?500", "15\\+? ?hours a week",
                 "(over|more than) an hour per employee", "per employee per report"],
      "hygiene": ["[0-9]+(\\.[0-9]+)? ?(hours|hrs|minutes) (a|per) week",
                  "(saves?|saving) [0-9]"] },
    { "id": "X-3", "subject": "168 data points",
      "probes": ["168 (discrete )?data ?points", "data ?points per worker", "~168"] },
    { "id": "X-4", "subject": "setup fees / demo-and-quote",
      "probes": ["\\$995", "\\$4,?995", "995 ?[-–] ?\\$?4,?995", "demo[- ]and[- ]quote"],
      "hygiene": ["zero setup fee", "no setup fee"] },
    { "id": "X-5", "subject": "DBA penalty misattribution",
      "probes": ["(DBA|Davis[- ]Bacon).{0,80}(28,619|civil money penalt)",
                 "(28,619|14,308).{0,80}(DBA|Davis[- ]Bacon)"],
      "hygiene": ["\\$?28,619", "\\$?14,308", "civil (money )?penalt",
                  "debarment", "penalt(y|ies).{0,30}\\$"] },
    { "id": "X-6", "subject": "enforcement rising",
      "probes": ["\\b(rising|increasing|increased|growing|heightened|intensified|stepped[- ]?up|renewed|aggressive) (enforcement|scrutiny|audit\\w*)\\b",
                 "\\b(enforcement|audits?|scrutiny)\\b.{0,40}\\b(is|are|has|have) (been )?(rising|increasing|climbing|intensifying|up)\\b",
                 "\\b(likelihood|odds|probability|risk|chance) of (an? )?audit\\b",
                 "crack(ing|ed)? down"],
      "hygiene": ["\\$259 ?M"] }
  ]
}
```

All probes are case-insensitive. The extractor is one line —
`sed -n '/^```json \[STRUCK:ALL\]/,/^```$/p' CORRECTIONS.md | sed '1d;$d' > corrections.probes.json`
— and `claims-lint` reads only that file, so the register cannot drift from what CI enforces.
Verified 2026-08-13: the block parses as JSON, all 35 regexes compile, and a reference
implementation run over all 255 tracked files reports this document itself **clean** against
its own rules.

### 3.4 Where it runs, and what it does not do

It runs in the same pre-deploy job as the visual-regression and property-test suites (ADR-008),
and on every PR. A blocking match **fails the build**. It does not open a ticket, does not
notify anyone, and does not have an override flag — consistent with A5 (fail closed,
unattended) and A3 (no escalation). A struck claim that reaches a shipping surface is a deploy
that does not happen.

Two companion assertions belong to the same job, because a linter that only forbids strings can
be defeated by paraphrase — and, as §3.2 shows, string bans are the half of the problem that
generalises worst:

- **CL-1** — every gate-locked claim string on a Scope A surface must originate from the
  `claims.json` renderer. A literal match against a measured-claim template found *outside* the
  renderer fails the build (`BRAND.md` §, already specified; restated here because this is the
  register's enforcement point).
- **CL-2** — every number on a Scope A surface must resolve to an entry in `BRAND.md` §5.5
  ("numbers we may print today") with its as-of date, or to `claims.json`. An unattributed
  numeral on a public surface fails the build. **CL-2 is the load-bearing check**, not the
  string bans: it is a *positive* assertion (every figure has a source) rather than a negative
  one (this figure is banned), so it has no false-positive rate to erode it and it catches the
  *next* X-2 — a plausible number, fluently written, that nobody fetched.

### 3.5 Register-open scan (remediation queue)  `[STRUCK:ALL]`

Reference implementation run 2026-08-13 over all **255** tracked files. Totals:

| | Count |
|---|---|
| **Blocking, Scope A (shipping surfaces)** | **0** |
| Blocking, Scope B (unmarked quotations) | **19** |
| Advisory (`hygiene`, never blocks) | 86 |

This register owns none of the files below and edits none of them; the queue is for the
agents who do. **Eighteen of the nineteen are documents quoting a struck claim in order to
correct, ban or record it** — they need a marker, not a rewrite. One is a real defect.

| File | Lines | Entries | Disposition |
|---|---|---|---|
| `identity/BRAND.md` | **76** | X-1 | **The one substantive correction owed.** U1 currently reads *"reconstruction is exactly what is impossible, because SAM overwrites the live document."* Reconstruction is **not** impossible (X-1). Rewrite to the latency claim — *"answered from stored data instead of re-fetching"* — which is true, is the actual benefit, and survives contact with a competitor's $19/mo API key |
| `architecture/USER_JOURNEY.md` | 1525, 1536, 1544 | X-1, X-2 | Correct-by-intent — the "never say this" table, including *"You can't reconstruct a superseded revision"* listed as forbidden. Add markers |
| `architecture/ARCHITECTURE.md` | 37 | X-1 | Correct-by-intent (S-8 bans the moat claim, citing R-HIGH7). Add marker |
| `phase-1-ideation/IDEA_DOSSIER.md` | 12, 19, 20 | X-1, X-4, X-5 | The errata header added in phase 2b. Add markers; **do not delete the original text** |
| `phase-1-ideation/research/01-demand-pmf.md` | 31, 37, 68 | X-2, X-6 | The deep dive that refuted the burden math and measured the enforcement trend. Add markers |
| `phase-1-ideation/research/02-competition-positioning.md` | 11 | X-4 | Finding 1, the price refutation. Add marker |
| `phase-1-ideation/site/index.html` | 569, 578, 584, 594, 618, 630, 781 | X-1…X-6 | Historical record, already rendered struck-through in `<span class="strike">`. Add markers |
| **Scope A** — `identity/landing/index.html` 1818, 2036, 2270, 2278 · `app/corpus/L4-outcomes/README.md` 29 | — | X-1, X-4, X-5 | **Advisory only, no action required.** §3.2's measured false positives: our own $0 setup stated as fact, the page's own "Fear — we do not say this" entry, two citation links that say they are not reproducing the figure, and a README explaining Helmer's test |

**A limit this register states rather than hides.** `BRAND.md:76` was invisible to the first
draft of the X-1 probes and was found by reading, not by grepping — it paraphrases
("reconstruction is exactly what is impossible") rather than reprinting. Two patterns were
added to catch that shape, and it is now caught; but the general lesson holds and is why
**CL-2 is the load-bearing check**. A string ban catches the copy-paste. Only a positive
requirement — *every number resolves to a dated source* — catches the rewrite.

## 4. Permanently forbidden until measured — the four claims and their gates

These are not struck claims. They are claims that may one day be true, that we currently have
no evidence for, and that **cannot be unlocked by any argument** — only by a measurement job
writing a flag. G1–G6 are defined in `IDEA_DOSSIER.md` D10; this section states them as copy
prohibitions, which is the form the renderer enforces.

| # | Forbidden claim family | Example strings that must not ship | Gate | What unlocks it |
|---|---|---|---|---|
| **F-1** | **Correctness.** Any assertion that our arithmetic, rates or classifications are accurate, correct, exact, error-free or verified | "100% accurate" · "never wrong" · "guaranteed correct" · "error-free" | **G1** | ≥500-line golden payroll suite over ≥25 WDs in ≥8 states, 100% exact match, re-scored every corpus refresh and every deploy, **30 consecutive green days** |
| **F-2** | **Acceptance.** Any assertion that an artifact of ours has been, or will be, accepted by a GC, DIR or any agency | "accepted by the DIR" · "GC-approved" · "passes agency review" · "guaranteed acceptance" | **G2** | ≥50 WH-347s **and** ≥25 CA eCPR XML files confirmed accepted by the receiving party, recorded in-product, XSD hash green across the whole window. Until then the eCPR carries *generated, not acceptance-tested* |
| **F-3** | **Coverage.** Any assertion of completeness over the corpus | "every wage determination" · "all 4,236" · "complete coverage" · "nationwide, complete" | **G3** | Nightly reconciliation against the index total, **60 days** of zero unexplained delta above 0.5% |
| **F-4** | **Outcome.** Any figure for time saved, money saved or human involvement, and the staleness guarantee stated as a promise rather than a mechanism | "saves N hours" · "cuts payroll admin by X%" · "zero human minutes" · "we credit you automatically if we're stale" | **G4**, **G5**, **G6** | G4: measured in-product median, upload → download, ≥100 real filings, stated as "median N minutes over N filings". G5: instrumented human-minutes counter, **90 days** below 2 min/customer/month at ≥50 paying accounts, raw inbound count published alongside. G6: the auto-credit fires correctly in a chaos test (upstream killed in staging) **before** the guarantee is advertised anywhere |

X-2 is F-4's cautionary tale and the reason F-4 exists in this shape: the struck figure was
not merely wrong, it was *the kind of claim that cannot be made honestly from a secondary
source at all*. Even a correctly-read DOL burden estimate would not have told us how long
Ratepin takes, because DOL has never measured Ratepin. Only we can, and only after ≥100
filings.

**A note on G5 and MED-2.** The human-minutes counter increments on **every** inbound message
to the billing address, unconditionally, with minutes attributed by wall-clock time to first
reply — not on messages someone judges to have "required" an answer. The party that benefits
from the claim does not get to define the denominator.

---

## 5. `claims.json` — why no human can promote a claim

Copy does not contain claims. Copy contains **slots**. A slot renders one of two strings:

- **flag false → the mechanism sentence.** What the product does. Always true, always
  printable, needs no gate. *"Every rate is pinned to a named wage-determination number,
  revision and publication date."*
- **flag true → the measured sentence,** with its numbers and its as-of date injected from the
  same record that set the flag. *"Median 4 minutes from upload to download, over 137 filings,
  as of 2026-11-02."*

```jsonc
// claims.json — written ONLY by the measurement jobs, served by the app, read-only to the renderer
{
  "generated_at": "2026-11-02T03:14:07Z",
  "corpus_snapshot": "sha256:…",
  "claims": {
    "g1_rate_correctness": { "ok": false, "green_days": 11,  "window_required": 30,
                             "last_run": "2026-11-02T02:00:00Z", "suite_lines": 512 },
    "g4_time_saved":       { "ok": false, "n_filings": 41, "n_required": 100,
                             "median_seconds": null },
    "g5_human_minutes":    { "ok": false, "days_below_threshold": 6, "window_required": 90,
                             "paying_accounts": 12, "inbound_messages_total": 38 }
  },
  "sig": "ed25519:…"
}
```

**The five properties that make this structural rather than procedural.**

1. **Write path.** `claims.json` is written by the measurement jobs and by nothing else. The
   marketing renderer, the app's copy layer and every human hold **read-only** access.
2. **Signature.** Each write is signed; the signing key lives only in the measurement job's
   environment. The renderer verifies the signature and the `generated_at` freshness before
   rendering any measured sentence. An unsigned, stale or unverifiable file renders **every**
   slot as its mechanism sentence — fail closed, per A5.
3. **No literal escape.** CL-1 fails the build if a measured-claim template string appears
   anywhere outside the renderer. Hand-writing the sentence into a page is not a workaround;
   it is a red build.
4. **Automatic demotion.** A regression flips the flag on the next measurement run and the
   live sentence narrows to the mechanism within one job interval — **P-C**, executed by the
   scheduler, not by a person noticing. There is no "temporarily leave the claim up" state.
5. **Editing copy cannot promote a claim.** This is the whole point, stated plainly: a human
   with commit access to every page in the product **still cannot** cause a measured sentence
   to render, because the sentence is not in the page. It is in a signed file that only a
   measurement can write. The only way to publish "median 4 minutes" is to actually have a
   median of 4 minutes across ≥100 filings.

This is `PLAN.md`'s literature-grounding standard — *no claim of a measured outcome ships
before it is measured* — implemented the way 12-Factor recommends guarantees be implemented:
in the codebase, not in a review checklist. HIGH-7 exists because the previous implementation
was a review checklist, and the reviewer who was supposed to run it was the person who wrote
the claim.

---

## 6. Adding an entry

When a claim is falsified: (1) add an `X-n` section in §2 with all seven fields, the source
fetched in-session and the fetch date recorded; (2) add its probes to the §3.2 JSON block;
(3) run `claims-lint` and fix or mark every occurrence it finds; (4) record any Scope-B
occurrences the owning agent must remediate in §3.4. **Do not delete the original text
anywhere.** Struck claims stay visible, marked, in the documents that made them — a register
that erases its own history teaches nobody, and the next agent re-derives the same mistake
from the same reasoning.

---

## References  `[STRUCK:ALL]`

**Primary sources, all fetched 2026-08-13**

- `https://sam.gov/api/prod/wdol/v1/wd/WA20200002/0/download` — HTTP 303 → signed S3 archive
  object `WDOL_FILES_PROD/DBA/ARCHIVE/FY2020/wa2.r0.txt`; followed → 200, 26,809 bytes,
  "General Decision Number: WA20200002 01/03/2020 / Superseded General Decision Number:
  WA20190002" (X-1)
- `https://govconapi.com/sam-gov-wage-determination-api` — 90,033 WDs (DBA 68,737 / CBA 18,630 /
  SCA 2,666) as of 2026-07-16, ~495,000 rate lines, "SAM keeps every superseded revision of a
  determination, not just the one in force", ~6% of DBA active (4,235 of 68,737) (X-1)
- `https://govconapi.com/pricing` — Developer **$19/month** "every federal dataset in clean
  JSON", Pro $39/month, Free Trial $0/14 days "no credit card required" (X-1)
- `https://www.federalregister.gov/api/v1/documents/2024-19482.json` — citation **89 FR 70670**,
  published 2024-08-30, pp. 70670–70671 (X-2)
- `https://www.federalregister.gov/documents/full_text/text/2024/08/30/2024-19482.txt` — OMB
  1235-0008; respondents 122,936; responses 11,310,112; burden 10,556,105 h; **56 minutes per
  form**; frequency weekly; operating cost $1,764,379 (X-2)
- `https://www.dol.gov/agencies/whd/forms/wh347` — form field list; OMB burden statement
  1235-0008, expires 01/31/2028, "an average of 55 minutes to complete this collection of
  information"; seven-day hours grid (X-2, X-3)
- `https://lcptracker.com/solutions/lcpcertified/` — $12/report; $145/Month up to 5 active
  projects; $1,300–$7,400/yr tiers; CA DIR + WA L&I + MD DLLR XML; no setup fee on the page (X-4)
- `https://www.certifiedpayrollpro.com/` — Starter $49/mo + $5/report; Pro $99/mo + $3/report;
  Enterprise $249/mo + $1/report; setup $0; "No contracts, cancel anytime"; 3 free reports (X-4)
- `https://www.ecfr.gov/current/title-28/chapter-I/part-85/section-85.5` (via
  `versioner/v1/full/2026-08-11`) — FCA 31 U.S.C. 3729(a) per-claim **$14,308–$28,619** for
  penalties assessed after 3 July 2025; `[90 FR 29447, July 3, 2025]` (X-5)
- `https://www.dol.gov/agencies/whd/resources/penalties` — full WHD civil money penalty table;
  **no DBA/DBRA civil money penalty listed**; CWHSSA $33, 40 U.S.C. 3702(c) (X-5)
- `https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5` (via
  `versioner/v1/full/2026-08-11`) — CWHSSA clauses apply to "any contract in an amount in
  excess of $100,000"; 5.5(b)(2) liquidated damages "$33 for each calendar day" (X-5, R-CRIT3)
- `https://www.dol.gov/agencies/whd/data/charts/government-contracts` — DBRA concluded
  compliance actions **1,711 (FY2013) → 641 (FY2025)**; back wages $27,952,140 → $26,754,050 (X-6)

**Internal**

- `run-2/PLAN.md` — A1–A6; "No claim of a measured outcome ships before it is actually measured"
- `run-2/phase-2-build/DESIGN_REVIEW.md` — HIGH-7 (this file's origin), CRIT-1 (the measured-red-rate
  rule this file generalises to prose), HIGH-2 (crosswalk poisoning → R-HIGH2)
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D3, D10, gates G1–G6; the errata header
- `run-2/phase-1-ideation/research/01-demand-pmf.md` — burden per form, competitor price lists,
  penalty misattribution, enforcement trend
- `run-2/phase-1-ideation/research/02-competition-positioning.md` — Finding 2, the archive is not
  cornered; the resold series
- `run-2/phase-1-ideation/research/03-gtm-pricing.md`, `04-mvp-scope.md` — price-grid consequences;
  FCA vs DBRA remedies
- `run-2/phase-2-build/architecture/CORPUS_DESIGN.md` — C1; effective-dated constants table;
  authority on ingest
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` §0.3 — the four refusal primitives P-A…P-D
- `run-2/phase-2-build/identity/BRAND.md` §5.4, §5.5, and the `claims.json` render rule
- `run-2/phase-2-build/identity/NAMING.md` C-N3

**Literature**

- Helmer, *7 Powers* — cornered resource; the test X-1 fails and the assembly/latency argument
  that replaces it (`https://7powers.com/`)
- Fitzpatrick, *The Mom Test* — evidence hierarchy; why a competitor's blog is not a source
- Ramanujam & Tacke, *Monetizing Innovation* — price to value; why X-5's avoided-loss framing
  needed a real number and could not have one
- Ries, *The Lean Startup* — the measurement job as the only promotion path for a claim
- `https://12factor.net/` — guarantees implemented in the codebase, not in a checklist (§5)
