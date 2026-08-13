# Free Tool Pages — the copy for the two surfaces at the top of the funnel

**Subject:** the customer-facing copy for the free unlimited WH-347 generator (`/wh347`) and the county × craft rate lookup (`/rates/…`), including the DRAFT — NOT CERTIFIABLE framing every free artifact carries and the argument for why that is honest rather than a downgrade.
**Status:** **DRAFT ON DISK.** Copy is written against what the app already renders (`app/src/app/(free)/`); where this file and the shipped page differ, the shipped page is the thing to change, not this file to quietly match. **One such difference is outstanding and named in §2.1** — the shipped `wh347/page.tsx:51` still carries the ungated correctness claim this file has replaced.
**BUILD STATE:** `claims.json`, `claims-lint`, `CL-1` and `CL-2` are specified in `CORRECTIONS.md` §5 and **are not in the repository**; the gate machinery that is built is `app/src/platform/ops/gates.ts` (`GATE_MECHANISM`, `gateSentence()`), refreshed by the `gates.refresh` job and published by `ops/status.ts`. Every rule below that says a check "fails the build" now says whether that check exists, and §5 marks each one.
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D3, D8 channels 1–3, D9, G1–G6 · `CORRECTIONS.md` Scope A, CL-1, CL-2, F-1…F-4 · `BRAND.md` §5.6, §6.5, C-B2, C-B3 · `USER_JOURNEY.md` J1, J2, §16 · `research/02-demand-seo.md`.
**Date:** 2026-08-13.

---

## 1. What each page is for, and the thing it must not be

| Page | Job | The failure mode it is one bad decision away from |
|---|---|---|
| `/wh347` — free unlimited WH-347 generator | Be the most useful free form-filler in the category, and let the reader see the provenance footer on a document containing their own numbers | Becoming a lead-capture form. An email wall, an interstitial, a "start free trial", a counter counting down free uses |
| `/rates/[state]/[county]/[craft]` — county × craft lookup | Answer a rate question with the determination attached, and show what moved at the last revision | Becoming a reformatted SAM table. Google's own definitions of scaled-content and doorway abuse describe that page exactly (`research/02` §6) |

**Two findings from research constrain every word below.**

- **The generator is table stakes.** PrevailComply ships a free WH-347 generator, `constructionbids.ai` ships one, and DOL publishes both a fillable form and a web tool. `BRAND.md` C-B2 forbids calling it differentiation. **The footer is the differentiator, so the page leads with the record, not with the word "free."**
- **Printing the determination number on a rate page is no longer differentiating either.** `davisbaconrates.com` already prints WD number, mod, effective date and sync date; `davisbaconwages.com` already ships the `/state/[st]/[county]/trade` hierarchy with change alerts (`research/02` §3). What none of them publishes is **the per-classification revision history and diff**. That is the only thing that earns a `/rates/` page the right to exist, and `research/02` §6.1 makes it a build-enforced publication gate: a page ships only if it carries a diff or a crosswalk entry.

---

## 2. `/wh347` — the free generator

### 2.1 Above the fold

> # WH-347 generator
>
> Type a crew or drop a payroll CSV, name the wage determination, and get the federal form with the arithmetic computed by deterministic code and the form rendered to the DOL geometry. No account, no email address, no card, and no limit on how many you generate.
>
> Every form this page produces comes out marked **DRAFT — NOT CERTIFIABLE**, with the signature block withheld. That is deliberate, and the reason is two paragraphs down.

No headline claim about speed, ease, accuracy or acceptance appears anywhere on this page. Per `BRAND.md` §6.2 the economic case for the ladder is the rate-of-record and nothing else, and per G4 a time claim is unmeasurable today in either direction.

**What that first sentence used to say, and why it changed.** It read *"the arithmetic done and **the geometry right**."* "Right" asserts that our output is correct, which `CORRECTIONS.md` §4 **F-1** forbids until **G1** — a 500-line golden suite green for 30 consecutive days — has cleared, and G1 has not been attempted. The replacement says the mechanism instead: *deterministic code* and *rendered to the DOL geometry* are both descriptions of how the thing works rather than verdicts on whether it worked, and both phrasings already existed in our own documents (`dashboard.md` §3, G1 and G2 rows) and were available when this line was written. **The same string is live in the shipped page** at `app/src/app/(free)/wh347/page.tsx:51` — per this file's Status line the shipped page is the thing to change, and that change is outstanding. `geometry right`, `gets it right`, `done right` and `correct(ly)` belong in the F-1 probe set, because a paraphrase is what a reprint-only probe cannot catch.

### 2.2 The three inputs, and the honest third option

> **The wage determination.** Three ways to give us one: paste the number from your contract, look it up by state, county and construction type, or skip it and type your own rates. Skipping is not a trap — plenty of people already have the rates on a sheet from the GC and want the arithmetic and the geometry. The form says on its face which of the three you did.

> **One question that changes the maths.** Is the prime contract over $100,000? The 40-hour overtime clause at 29 CFR 5.5(b) goes into contracts *"in an amount in excess of $100,000"*, so computing an overtime premium on a $60,000 striping subcontract invents an obligation and skipping it on a $2m one hides one. If you do not know, say so — we will not guess in either direction, and the exception report will say which question is open.

### 2.3 "What this page does not do", stated on the page, not in a footer

`BRAND.md` trait 2 requires the boundary in the same size type as the promise. Five lines, drawn from D9 and J1:

> - It does not keep your payroll. The crew you type is computed, rendered and dropped.
> - It does not decide which determination revision applies to your contract. FAR 22.404-6 governs that, and the answer can turn on a contracting-officer finding we cannot observe.
> - It does not evaluate whether a fringe credit is bona fide, whether a deduction is permissible under 29 CFR part 3, or whether a classification is right for the work.
> - It does not compute union CBA fringes. Those schedules are not published in the determination, so we would be guessing.
> - It does not run payroll, compute taxes, print cheques, file anything, or hold anyone's portal credentials.

### 2.4 After generation — the panel under the preview

> **Your form is ready.** `{n}` workers · `{k}` classifications · `{wd_number}` revision `{r}`, published `{published_date}` · snapshot `{hash}` · generated `{generated_at}`.
>
> This preview is kept until `{expiry_timestamp}` and then deleted. Nothing was billed and nothing was kept. We will not offer to email it to you — that would be an email capture wearing a helpful hat.

### 2.5 The one upgrade line, and where it sits

Below the footer, once, as a true statement about the document above it (`USER_JOURNEY.md` §1.5):

> This is a draft. Ratepin kept nothing from this session and pinned no revision, so the signature block is withheld. Pin this determination to a project and the same form comes back certifiable — with the revision kept, a notice when a newer one publishes, and every classification you just picked remembered.

**Not permitted anywhere on this page:** an interstitial, a modal, a "free uses remaining" counter, the word *trial*, a countdown, a chat bubble, a contact link, a testimonial, a logo wall, an exclamation mark, or any sentence beginning "Most contractors…".

---

## 3. The DRAFT — NOT CERTIFIABLE framing, and why it is honest rather than a downgrade

This is the section the free tier lives or dies on, so the argument is written out rather than asserted.

**The rule, from `USER_JOURNEY.md` §1.5:** *no pin, no signature block.* The certifiable statuses assert a revision-of-record. The free path creates no pin by construction, so it can never satisfy the condition, so the gate is never consulted — the artifact is a draft before the first number is typed.

**Six reasons this is integrity and not a crippled tier.**

1. **It is a true statement about the document.** A certified payroll asserts that a specific revision of a specific determination was in force and was held. The free path holds nothing after the tab closes. Printing a signature block would be the software making that assertion on the user's behalf without the evidence — which is exactly the assertion the paid tier exists to support.
2. **The signature was never ours.** The certification on the reverse of the WH-347 is signed by the contractor under 29 CFR 5.5(a)(3)(ii)(C), with 18 U.S.C. § 1001 exposure that DOL's own instructions spell out. Withholding the block removes nothing the user had; it declines to imply a countersignature that never existed.
3. **Nothing the user came for is missing.** Same renderer, same column geometry, same arithmetic, same provenance footer as every paid tier. What is absent is the assertion — and the assertion is the entire product. Per Dunford, the boundary *is* the positioning: a free tier that quietly withheld a feature would be a crippled version; one that withholds the thing it cannot honestly say is a demonstration of the thing being sold.
4. **It closes an honesty hole that free tiers usually open.** An anonymous visitor has no account, no banner and no credit. Without this rule, the least supervised document the company produces — the one travelling to every GC in the county — would be the one making the boldest claim. Now the honesty is on the paper: the same three-state freshness sentence the paid artifact uses, plus, at L2, *"our newer-revision check for `{wd}` last completed `{ts}` and has not re-run since."*
5. **It is falsifiable in ten seconds, before payment.** `BRAND.md` §5.6 requires pre-paywall proof; Hormozi's perceived-likelihood lever moves on demonstration rather than assertion. A reader can feed it an unmappable title and watch it decline to guess. That is worth more than any adjective we are permitted to use.
6. **It makes the upgrade legible without a nag.** The document names its own gap, once, in the place the reader is already looking. There is no second prompt anywhere.

**The risk, named rather than smoothed over.** `USER_JOURNEY.md` H-J1b records it: a withheld signature block may read as *failure* rather than as *integrity*, and applying it to 100% of free artifacts puts that hypothesis directly onto the acquisition channel, where a bad reading costs conversion. **The instrument is the free-session → account-creation rate**, and the pre-registered response if it reads as failure is copy on the page, never a signature block on an unpinned document.

**Exact artifact copy — read from the shipped renderer, not drafted here.** Watermark: `DRAFT — NOT CERTIFIABLE`. Footer, per `BRAND.md` §6.7, non-configurable at every tier including free. The lines are assembled by `provenanceFooterLines()` in `app/src/artifacts/provenance.ts`, in this order:

```
Rates from wage determination {wd_number} revision {r}, published {published_date}.
{freshness sentence — "No newer revision existed as of {ts}." at FRESH;
 "Newer-revision check last completed {ts}; not re-checked since." at DATED and STALE}
{contract-value-band sentence — on the free path usually "No contract value band is
 recorded, so the overtime premium is not computed either way."}
Corpus snapshot {hash} · determination {hash} · Merkle root {hash} leaf {n} · engine {v} ·
 build {sha} · form {layout} {hash} · generated {generated_at}
DRAFT — NOT CERTIFIABLE. The signature block is withheld and this document must not be
 signed or filed. {n} payroll lines are unresolved: {reasons}. Resolve and regenerate;
 the rates and the arithmetic do not change.
Ratepin computes and formats. You certify and file. This is not legal advice.
```

**Three corrections this block absorbs**, because the earlier draft of it was written from memory rather than from the renderer. The claim line reads *"Rates from wage determination … revision …"*, not *"Rates of record: WD …, Modification …"*. The boundary line is `BOUNDARY_STATEMENT` (`provenance.ts:58`) — *"You certify and file. This is not legal advice."* — not *"The contractor certifies and files."*, and the version in `community-playbook.md` §3.3 has been corrected to match. And **`ratepin.com/v/{serial}` does not appear on a free artifact at all**: `FooterInput.verifyUrl` is documented as *"Omitted for the free generator, which persists nothing beyond 24 hours and therefore has nothing to resolve."* Printing a verification URL on a document that resolves to nothing would have been the single worst error available on this page.

---

## 4. `/rates/[state]/[county]/[craft]` — the rate lookup

### 4.1 Above the fold

> # `{classification_label}` — `{county}` County, `{state}`
> **Federal Davis-Bacon rate.** Wage determination `{wd_number}`, revision `{r}`, published `{published_date}`, construction type `{type}`.
>
> Base `{base}` · Fringe `{fringe}` · Group `{group_id}`
> Read from the determination text at lines `{line_span}`. The determination itself is at sam.gov — we link it and never reproduce it.

### 4.2 The block nobody else publishes, above the fold

> **What changed at revision `{r}`**
> Base `{old_base}` → `{new_base}` · Fringe `{old_fringe}` → `{new_fringe}` · published `{published_date}`
>
> **Every revision we hold for this classification**
> `{table: revision · published date · base · fringe · what moved}`
>
> `{wd_number}` supersedes `{superseded_wd}`. The chain is one rate history for this county and craft, rather than a stack of annual documents.

`research/02` §6.1 makes this the reason the page exists. It is also the reason the page is defensible: the rate is a commodity, the assembly is not, and the assembly is unmeasured, so the page shows it and lets the reader judge rather than boasting about it.

### 4.3 The two calls to action, neither of them a wall

> **Generate a WH-347 with this rate** → `/wh347?wd={wd_number}` · no account, no limit
> **Get an email when this determination changes** → one field, **double opt-in (confirm click); nothing is sent before confirmation**, and one-click unsubscribe in every message afterwards.

The consent rule is stated in exactly these words in `lifecycle-emails.md` §2 C5 and §4.4, `crm/CRM.md` §5 and `crm/channels.csv` CH-09; there is no single-opt-in variant of this list anywhere. **Specified, not built:** there is no watch table, no confirm route and no sender — the message that implements it is `wd_watch_confirm`, listed as unbuilt in `lifecycle-emails.md` §3.1.

### 4.4 The three standing notes

> **State law.** This is the federal Davis-Bacon rate for this determination. `{State}` has its own prevailing-wage law that may set a different rate for the same work. Ratepin does not track state determinations outside California. `{link to the state regulator}`

The state-law note is not a courtesy: `research/02` §4 found that the highest-intent phrasing — `"[county] prevailing wage rate [craft] 2026"` — often returns the state regulator, correctly, because the searcher usually wants the state rate. Answering for a regime D9 excludes would be the single most damaging thing this page could do.

> **Freshness.** Rates from `{wd_number}` revision `{r}`, published `{published_date}`. Our newer-revision check last completed `{ts}`. *(At L2 the sentence narrows; at L3 the page renders from the last agreed snapshot and says so, with the date. Never a blank page, never a silently stale one.)*

> **Union groups.** The fringe figure for this group is set by a collective bargaining agreement that is not published here. Ratepin will not compute a fringe credit against it.

### 4.5 The empty state, which is a real answer

> **No active determination lists `{classification}` for `{county}` County under `{type}` as of `{date}`.**
> Three things this usually means: the county may be covered for this work under a different construction type; the contract may carry a **project wage determination** issued to the contracting agency and never published; or the work may not be Davis-Bacon covered at all.
> `{links to the county's other construction types}` · `{link to /wh347 with "type the rates yourself"}`
>
> We do not interpolate a rate from a neighbouring county.

### 4.6 The publication gate, restated as a copy rule

**A page with nothing of its own to say does not get copy.** If the determination has never been modified and the craft has no crosswalk entry, the page is a reformatted federal table and is not published. Counties covered by the same determination share one page; county URLs are hubs that route, not tables that repeat.

**Specified, not built.** Both inputs are columns, so this *can* be enforced by the build rather than by a reviewer — but nothing enforces it today: `app/src/app/(free)/rates/[state]/[county]/[craft]/page.tsx` renders any county × craft the mirror holds and `notFound()`s only on a missing row, and there is no sitemap route and no publication filter anywhere in `src/app`. What must exist is a publication predicate — *has a diff between two held revisions, or has a crosswalk entry* — applied at both the route and the sitemap, with a test that asserts a diffless, crosswalkless page is not emitted. Until it does, §4.6 is a copy rule someone has to remember.

---

## 5. Rules binding both pages

1. **No rate without its determination**, ever, on any surface (`BRAND.md` §6.5).
2. **Every number carries its as-of date in the same sentence** or it does not appear. This is `CORRECTIONS.md`'s CL-2, which **is not built** — no lint reads these pages for a bare numeral. Held by writing, and by the fact that every figure on both pages is a slot filled from a corpus row that carries its own date.
3. **No coverage claim.** Not "every determination", not "all 4,236", not "nationwide". G3 gates it; the status page publishes the live count and delta with a timestamp instead.
4. **No accuracy, acceptance, time or human-minutes claim.** G1, G2, G4, G5. Gate-locked sentences must render from the gate reading, never be typed. **Partly built:** `gateSentence()` / `GATE_MECHANISM` in `app/src/platform/ops/gates.ts` render them for the surfaces that read the gates table, and `.github/workflows/ci.yml` runs the citation invariant and the golden-set eval — but **`claims.json` and `CL-1` do not exist**, so nothing fails the build on a hand-written gate-locked sentence. §2.1 is the demonstration: an F-1 violation shipped in `wh347/page.tsx` and no build noticed. The missing check is a probe set over the rendered marketing and free routes; it has to be written.
5. **No fear.** No penalty figure, no enforcement framing, no withheld-payment threat dressed as help. The reason to use the page is that the number is traceable.
6. **No contact affordance and no chat.** A3. **Built:** `app/tests/web/free.test.ts:588` — *"contains no contact affordance of any kind"* — and the escalation-path pattern at `tests/web/marketing.test.ts:468`, both run in the `unit` step of CI.
7. **Zero exclamation marks.** `BRAND.md` trait 3. **Specified, not built** — no lint or test in `run-2/app` matches on `!` in rendered copy; the natural home is the same route-level suite as rule 6 (`tests/web/free.test.ts`), which already reads the rendered page and would need one more assertion.
8. **The generator link appears once per rate page, below the data, with no interstitial and no email wall** (`BRAND.md` C-B3, resolved in favour of proof over capture, at a recorded cost in list growth).

---

## 6. Measurement, and the kills written before the data

Per Ries, and consistent with `research/01` T1 and `research/02` §9:

- **Free-generator sessions**, plain runs versus runs that supplied a determination and got a diff — a **descriptive counter, carrying no kill line.** The run-ratio criterion that stood here until 2026-08-13 (*"kill the differentiation hypothesis if diff-bearing runs do not exceed plain runs by week 8"*) is **withdrawn**: it could not answer its own question, because a visitor who arrives without a determination number cannot produce a diff whatever she thinks of provenance, so the ratio measures what people brought with them and not what they came for. T1's kill now sits on `t1.tool_to_account`, split by tool, with a floor of 200 runs per arm and an explicit UNRUN state below it (`CRM.md` §10.2).
- **Free session → account creation**, tracked against the pre-DRAFT baseline as H-J1b's instrument.
- **`/rates/` indexed share, impressions, and generator starts attributable to a `/rates/` entry**, with the free-generator pages as the control arm at 90 days. *Any template whose indexed share trails the control arm is deleted, not iterated.*
- **No target values are asserted.** Asserting one would repeat the volume error `research/02` §1 refused to commit.

---

## 7. Hypotheses, flagged

- That a withheld signature block reads as integrity rather than as a broken tool (H-J1b). **Unmeasured and load-bearing.**
- That anyone searches for a per-classification revision diff. It may be wanted only by someone who already has the problem, in which case `/rates/` is a retention asset that happens to be public.
- That a free tool with no email wall converts at all (C-B3's recorded cost).
- That leading with the record rather than with the word "free" outperforms the incumbent free generators. Reasoned from C-B2; untested.

---

## References

**Primary sources, fetched in-session 2026-08-13 or re-cited from files that fetched them on the same date**

- `https://www.dol.gov/agencies/whd/forms/wh347` — WH-347 Rev. Jan 2025, OMB 1235-0008, expires 01/31/2028; field list including the seven-day hours grid, 6B fringe credit and 6C cash in lieu; the OMB burden statement of *"an average of 55 minutes to complete this collection of information"* — cited here as form identity only, never as a saving (G4)
- `https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5` — 5.5(a)(3)(ii)(C) the contractor's certification; 5.5(b) the 40-hour clause *"in an amount in excess of $100,000"*
- `https://www.ecfr.gov/current/title-29/subtitle-A/part-3` — the deduction categories offered as a closed list
- `https://www.acquisition.gov/far/22.404-6` — the effectivity rule the page states and declines to conclude on
- `https://sam.gov/wage-determinations` — the determination text, linked and never reproduced
- `https://developers.google.com/search/docs/essentials/spam-policies` — scaled content abuse (*"scraping feeds, search results, or other content to generate many pages"*) and doorway abuse, the two definitions `research/02` §6 measured this page set against
- Competitor free tiers, all read 2026-08-13 via `research/01` §5 and `research/02` §3: `https://prevailcomply.com/` (free federal report, no signup) · `https://constructionbids.ai/tools/sub/wh-347-payroll-generator` (user types the determination number; it is not rendered on the output) · `https://davisbaconwages.com/` (weekly rates, free, no login, modification email alerts) · `https://davisbaconrates.com/` (prints WD number, mod, effective and sync dates) · `https://wagefinder.org/` ("492,044 Wages And Growing", API for sale)

**Literature**

- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — the boundary is the positioning; §3 reason 3
- Alex Hormozi, *$100M Offers* — https://www.acquisition.com/ — perceived likelihood of achievement moves on demonstration, hence pre-paywall falsifiable proof
- Eric Ries, *The Lean Startup* — §6's thresholds, written before the data
- Jakob Nielsen / NN/g — https://www.nngroup.com/articles/error-message-guidelines/ and https://www.nngroup.com/articles/empty-state-interface-design/ — the empty state in §4.5 and the inline error discipline
- Rob Fitzpatrick, *The Mom Test* — no page claims what contractors "say they want"
- FTC, *Policy Statement Regarding Advertising Substantiation* — https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation — the external basis for §5 rules 3 and 4

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D3, D8, D9, D10/G1–G6
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — Challenge 4, the free tier scoped to generate-and-format with no pinned assertion; zero LLM calls on the free path
- `run-2/phase-2-build/CORRECTIONS.md` — Scope A; CL-1, CL-2; F-1…F-4
- `run-2/phase-2-build/identity/BRAND.md` — §5.6 pre-paywall proof; §6.5 surface map; §6.7 the footer; C-B2, C-B3; traits 2 and 3
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` — J1 including §1.5 and H-J1b; J2 including §2.3 and §2.4; §16 the copy lint
- `run-2/app/src/app/(free)/wh347/page.tsx`, `run-2/app/src/app/(free)/rates/[state]/[county]/[craft]/page.tsx` — the shipped copy this file is written against
- `run-2/phase-3-acquisition/research/01-channels.md` — T1 and its kill criteria
- `run-2/phase-3-acquisition/research/02-demand-seo.md` — §3 the occupied surface, §6.1 the publication gate, §7 the templates, §9 the control-arm decision rule
