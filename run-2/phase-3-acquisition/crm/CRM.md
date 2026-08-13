# CRM — the acquisition register, specified to be maintained by jobs

**Owner:** phase-3 acquisition · **Hand-authored 2026-08-13** · **Scope A** (`CORRECTIONS.md` §3.1)
**Files owned:** `crm/CRM.md` (this file), `crm/channels.csv`, `crm/segments.csv`, `crm/dashboard.md`
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `CORRECTIONS.md` · `BRAND.md`
**Status:** internal register, not copy. Every external figure carries its source and read date; none is printable on a customer surface.

> ## BUILD STATE — read this before any other sentence
>
> **None of the eleven `crm.*` jobs exists. Neither does `pages.rebuild`, `ops.digest`, `claims.json`,
> `claims-lint`, `CL-1` or `CL-2`.** Verified 2026-08-13 against `run-2/app/`: the job registry in
> `app/src/worker/jobs.ts`'s `JOB_REGISTRY` contains **sixteen** kinds — `ingest.corpus.nightly`,
> `canary.golden`, `ingest.ecfr`, `ingest.dir.xsd`, `ingest.whd.form`, `freshness.sweep`,
> `billing.credit`, `billing.dunning`, `billing.overage`, `billing.replay`, `outbox.drain`,
> `account.deletion.execute`, `retention.sweep`, `backup.verify`, `gates.refresh`, `account.export` —
> and **none of them begins `crm.`**, which is the load-bearing half of this claim. (An earlier draft of
> this block said nine, having enumerated a stale subset. A BUILD STATE block that is wrong about the
> build is the defect it exists to cure, so the count is now recounted from `JOB_REGISTRY` itself.); `find run-2 -name claims.json` returns nothing;
> `grep -rn "crm\." app/src` returns nothing.
>
> **Therefore every sentence in §2, §3, §4, §6 and §7 below is a specification of machinery to be built,
> not a description of machinery that runs.** Where this file says a job "writes", "flips" or "reverts",
> read *will, once built*. The one guarantee this file can make today is the one at the end of §4: the
> boundary is a written intention, and a person with commit access can violate every line of it with a
> text editor. `CORRECTIONS.md` §5's distinction applies in full — a guarantee that lives in a document
> *about* a codebase is procedural, and this document is currently the procedural kind.
>
> **What must be built, and where it is specified:** the eleven jobs in §3 of this file (scheduler
> contract: `ARCHITECTURE.md` §7.1, implemented at `app/src/worker/schedule.ts` and `jobs.ts`);
> `claims.json` and its signing path in `CORRECTIONS.md` §5; `CL-1`/`CL-2` in `CORRECTIONS.md` §3.4;
> `pages.rebuild` in `ARCHITECTURE.md` §7.1. Until each lands, the register is maintained by hand and
> says so.

---

## 0. What this is not

A CRM is normally a pipeline of people: names, stages, next actions, an owner who is a human and a
review meeting where that human explains the stage. Every one of those five nouns is forbidden here.
There is no salesperson (A1), no onboarding call, no support queue (A3), and no human minutes per
customer to spend (A6). A pipeline of people would be a lie about the company's own mechanism.

So this register keeps **channels and experiments**, and every owner named in it is a **job**. The
unit of work is not "follow up with X on Tuesday"; it is "a cron read a counter and flipped a status"
— which is a description of the design and, until the jobs in §3 are written, of nothing that has
happened. Naming the owner as a job is a commitment about what may ever own a row, and it holds even
while the row is maintained by hand: no row here may acquire a human owner, a stage or a next action.
Weinberg & Mares' Bullseye needs a scoreboard to be a method rather than a mood — the three
concurrent tests only mean something if their thresholds were written first and something impartial
reads them afterwards. Ries' pre-registration supplies the first half. This register is the second.

---

## 1. The register has no person records, by construction

The most important property of this CRM is the table it does not have.

- The free WH-347 generator has **no email wall** — resolved in favour of proof over list growth, and
  recorded as a cost (`BRAND.md` C-B3). A free-tool user is a session, not a contact. The same rule is
  specified for the modification-diff checker, which is **not built**: `app/src/app/(free)/` holds
  `wh347` and `rates` and nothing else as of 2026-08-13.
- There is **no lawful machine-readable list of D1** to import. SAM's public entity data exposes
  point-of-contact name and address only; email, phone and fax are marked FOUO/CUI. USASpending
  subaward rows carry no contact field at all.
- Every community venue that holds D1 is closed to machines by its own terms or by live
  countermeasures — Reddit 403 to every probed endpoint, ContractorTalk's proof-of-work challenge
  and its 402-metered agent endpoint, LinkedIn User Agreement §8.2, Meta's automated-collection ban.
  We do not scrape them, and we do not buy a list assembled from them.
- California's Public Works Contractor Registration search is closer to a true D1 frame than any
  federal feed, and it is used **only** as a sizing and validation instrument. We will not scrape it.

The consequence is clean rather than sad: **there is nobody to nurture, so there is nothing to
nurture them with.** What the register holds instead is a channel table, a segment table, and a set
of counters with thresholds attached.

---

## 2. The three files, and who is *specified* to write each

Modelled on `ARCHITECTURE.md` §3.9's boundary table, for the same reason: a boundary that is not
written down is a boundary that erodes. The right-hand column is the one that matters today, and it
is the column that was missing when this table was first written.

| File | Specified writer | Read by | Enforced today? |
|---|---|---|---|
| `channels.csv` | a human **for the descriptive columns only** (asset, kill_or_revival, cadence, job) | `crm.review.close`, `crm.dashboard.render` | **No.** Nothing reads or writes this file but a person with a text editor |
| `channels.csv` `status` column | `crm.review.close` and the per-test meters, exclusively; a hand edit to be reverted on the next close | as above | **No.** Every value in the column today was typed by hand, and nothing reverts an edit |
| `segments.csv` | a human for definitions; `crm.segments.refresh` for the observable-signal counts | the page build-order job, `crm.dashboard.render` | **No.** No count in the file is machine-derived; all are `Uncounted`/`Unmeasured` by hand |
| `dashboard.md` | `crm.dashboard.render`, exclusively; the file to be regenerated and a hand edit overwritten | anyone | **No.** The file was typed and no run will overwrite it |
| `claims.json` | the measurement jobs, exclusively (`CORRECTIONS.md` §5) | the renderer, `crm.dashboard.render` | **No.** The file does not exist and no signing key has been issued |

The pattern this table borrows from `CORRECTIONS.md` §5 is a target, and it is worth stating the
target and the present state in the same breath rather than letting the first stand in for the second:

- **The target.** Once `crm.review.close` exists and `status` moves out of the CSV into the table the
  job writes, a human with commit access to every file here **will still not be able to** promote a
  channel or resurrect a killed one, because the status will not be stored where the prose is.
- **Today.** `status` *is* stored where the prose is — column 4 of a hand-editable CSV — so **a human
  with commit access can promote any channel, resurrect any killed one, and nothing will revert it.**
  That is the gap the eleven jobs close, and it is the reason the gap is printed here rather than
  described away.

**CSV format note.** `channels.csv` and `segments.csv` each open with `#`-prefixed **provenance
preamble** lines carrying the same build-state warning. Lines beginning with `#` are preamble and are
to be skipped by any reader; `crm.review.close` and `crm.segments.refresh` must skip them when they are
written. The preamble exists because a CSV cannot carry a header paragraph, and a file that claims a
writer it does not have needs one more than a Markdown file does.

---

## 3. The jobs specified to maintain the register — **none of the eleven is built**

**Build state, checked 2026-08-13.** `app/src/worker/jobs.ts` registers nine job kinds and none of
them begins `crm.`; `pages.rebuild` and `ops.digest` are likewise absent. Every row below is a job
**to be written** against the scheduler contract in `ARCHITECTURE.md` §7.1 (`app/src/worker/schedule.ts`,
`jobs.ts`). Names follow the existing `noun.verb` convention, and each job **will run** in the same
table-plus-claim-loop scheduler, with the same unique `idempotency_key` discipline. The verbs in the
"Does" column are the specification's verbs; read every one of them as future tense.

Two of these jobs cannot be written until something else lands first, and that dependency belongs in
the specification rather than in a surprise later: `crm.dashboard.render` requires `claims.json` and
its signing path (`CORRECTIONS.md` §5, unbuilt), and `crm.tool.funnel` requires the modification-diff
tool itself — `app/src/app/(free)/` contains `wh347` and `rates` and **no diff tool**, so T1's second
arm has no counter to read because it has no surface to count.

| Job | Build state | Cadence | Does (specified) | Writes | Fails closed by |
|---|---|---|---|---|---|
| `crm.tool.funnel` | **not built** — and blocked on the diff tool | daily 03:20 ET | Counts diff runs, plain-generator runs, and tool-session → account transitions | T1 counters | Missing day is recorded as missing, never interpolated |
| `crm.sc.pull` | **not built** | daily 04:00 ET | Search Console `searchanalytics.query` — clicks, impressions, ctr, position by page and date | T2 counters | API error leaves the previous value with its own as-of date |
| `crm.index.sample` | **not built** | daily 04:10 ET | URL Inspection API over a **random sample** of published pages. The API allows 2,000 queries per day and 600 per minute per property, so indexed share is an estimate from a sample with its n printed, never a census presented as one | T2 indexed share, with n | Sample smaller than 200 publishes no ratio |
| `crm.sem.meter` | **not built** | daily 04:20 ET | Reads spend and $49 purchases; computes cost per purchase; **sets the daily cap to zero when a kill line is crossed** | T3 counters, `channels.csv` status | Unreadable spend is treated as at-cap, so the failure direction is to stop spending |
| `crm.verify.count` | **not built** | daily 04:30 ET | Verification-URL loads per 100 artifacts, split first-party vs third-party by referrer and session | Loop counters | No denominator, no ratio published |
| `crm.awards.pull` | **not built** | monthly | USASpending prime-award geography and NAICS, as **page build order only** | Build-order table | Never emits a message or an address |
| `crm.segments.refresh` | **not built** | monthly | Recomputes each segment's observable-signal counts from first-party data and the corpus | `segments.csv` count columns | A segment with fewer than 5 accounts publishes no count |
| `crm.competitor.diff` | **not built** | weekly, with `ingest.ecfr` | Re-fetches every competitor price page cited in `BRAND.md` §1 Step 2 and §5.4 and hash-diffs it | Diff log | A moved price flags the row rather than editing it |
| `crm.optout.honor` | **not built** — and no list exists to opt out of | hourly | Writes a suppression hash and deletes the raw address | Suppression table | Deletion before suppression, so a failure cannot leave a live address |
| `crm.review.close` | **not built** — so no status in `channels.csv` has ever been machine-written | **weekly, Mondays 04:40 ET** | Evaluates every kill criterion whose window has elapsed; flips status; halts the spend or the page template concerned | `channels.csv` status, review log | A criterion whose inputs are missing stays open and says so |
| `crm.dashboard.render` | **not built** — blocked on `claims.json` | nightly 05:00 ET | Regenerates `dashboard.md` from the counters and `claims.json` | `dashboard.md` | Unsigned or stale `claims.json` renders every gated metric as GATED |

Nothing in this table is specified to page anyone, open a ticket, or wait for a reply — and that
property is the one thing about it that can be checked before it is built, because it is a property
of the specification rather than of the running system. `ops.digest` (also unbuilt) is to report the
week's status flips and, as §10.5 of the architecture puts it, nothing waits on it.

---

## 4. Status is typed today; the rule is that it **will be** computed

The heading of this section used to read *"Status is computed, never typed."* That was the inverse of
the fact: `crm.review.close` does not exist, so **all 35 values** in `channels.csv`'s `status` column
were typed by a person — 11 `refused`, 10 `building`, 7 `not-started`, 4 `retired`, 1
`instrumented-only`, 1 `unverified`, and, tellingly, **zero `killed`**, because a `killed` value can
only be produced by a review that has never run. The rules below are the design the column is to be
moved under. They are numbered so that the build can be checked against them one at a time.

**The status enum, declared** (it was in use and never defined, which is how `placement` — a value
belonging to no vocabulary — reached CH-15f). A `status` cell must be exactly one of:

`refused` · `not-started` · `building` · `instrumented-only` · `parked` · `unverified` · `killed` · `retired`

`unverified` means the row's own factual basis has not been read to primary source, so no disposition
may be drawn from it yet; `retired` means dead on mechanism rather than on measurement, and unlike
`killed` it carries no revival path and no window. When `crm.review.close` is written it **must reject
a value outside this list**, and that rejection is one of the checkable artefacts the Day-0 gate can
point at.

Five rules, each of which exists because the opposite is the normal failure of a growth scoreboard.

1. **Thresholds precede data.** Every row of `channels.csv` carries its kill or revival condition
   already written. A kill criterion authored after the numbers arrive is not one (Ries). A kill
   criterion that cannot be passed for reasons unrelated to its hypothesis is not one either — see
   the T1 restatement in §10.2.
2. **A kill is to be a job's write.** `crm.review.close` will flip `status` to `killed` and, in the
   same transaction, remove the thing being killed: the SEM daily cap goes to zero, or the page
   template stops being emitted by `pages.rebuild`. Today a kill is a person typing a word, and the
   removal is a separate act of faith.
3. **Delete, do not iterate.** At 90 days, any T2 template whose indexed share trails the
   free-generator control arm is deleted. "Iterating" a losing template is how a dead channel keeps
   consuming engineering.
4. **A dead channel has no revival path unless the row names one.** The channels dead on the
   autonomy axis carry `Permanent`. The parked ones carry a specific, checkable condition — Zapier's
   50 active users, email behind T2. A condition that reads "revives if the platform changes its
   review process" is not checkable and is not accepted; that is why §9's retirements are retirements
   and not parkings.
5. **The register records the cost of its own constraint.** Trade shows stay visible in the table
   as the highest D1-reachability row on the board, and BD stays visible as the only door to ABC's
   67 chapters and 24,000 merit-shop members. Deleting those rows would make the constraint look
   free, and it is not.

---

## 5. What is collected, and what makes it consented

| Datum | Source | Consent mechanism | Retention |
|---|---|---|---|
| Page, referrer, device class, country | Site analytics | Cookieless by design — no cookies, no persistent identifier, no stored IP or User-Agent, daily-rotated salt for unique counting, so no consent banner is required for analytics | Aggregate only |
| `first_entry_path` on an account | First-party, our own domain | Disclosed in the signup flow as part of the account record the customer creates | With the account; removed on deletion |
| Free-generator and diff-tool inputs | The user's own upload | Given by the act of using the tool, with the purge stated on the page | **24 hours**, enforced by `retention.sweep` |
| Payroll CSV, worker rows, SSN ciphertext | The customer's own payroll system | The subscription itself; per-tenant key, per-row `key_version` | Per `ARCHITECTURE.md` §5.4; deletion destroys the tenant key |
| WD-change alert address | **Double opt-in (confirm click) on our own form; nothing is sent before confirmation.** An address that is never confirmed is dropped and no message follows it | **Double opt-in is the single resolved rule** across `CRM.md`, `channels.csv` CH-09, `lifecycle-emails.md` §2 C5 and `wd_watch_confirm`, and `free-tool-pages.md` §4.3 — the earlier "single opt-in" wording in this row and in CH-09 was a contradiction, not a second option. On top of it, CAN-SPAM's requirements met as mechanisms rather than as a policy page: a clear opt-out in every message, honoured automatically and immediately against the 10-business-day ceiling, a valid postal address, accurate headers, no deceptive subject | Until opt-out; then the address is deleted and only a suppression hash remains |
| Classification confirmations | The customer's own choice, in-product | The product's stated behaviour: chosen once, remembered per (account, WD, title) | Per-account. Cross-tenant aggregate may only **order** a candidate list, never pre-select or auto-apply (R-HIGH2) |
| Search Console, Google Ads, Stripe events | Our own properties and the customer's own transaction | n/a — our data about our own surfaces | Per provider |

**California.** The launch demand market is CA, so CCPA is the relevant regime. The statute applies
to a for-profit business meeting any one of: gross annual revenue over $25 million; buying, selling
or sharing the personal information of 100,000 or more California residents or households; or
deriving 50% or more of annual revenue from selling California residents' personal information
(oag.ca.gov, read 2026-08-13). Ratepin meets none of the three, and sells no personal information
at any volume. The rights are implemented anyway — know, delete, correct — because the self-serve
export and the account-deletion path already exist for A1 reasons, and "not covered yet" is not a
design.

**Refused, permanently:** scraped or purchased email lists; SAM point-of-contact data beyond what is
public; automated collection from LinkedIn, Facebook, Reddit or ContractorTalk; the CA DIR
registration search as a prospect source; and any enrichment vendor that would resolve a session to
a named person. Each refusal removes a channel we have already scored dead, so none of them costs
us an option we otherwise had.

---

## 6. The review cadence is specified as a cron, not a meeting

**Unbuilt.** `crm.review.close`, `crm.dashboard.render` and `crm.competitor.diff` do not exist, so
none of the windows below has ever closed and none will until they are written. Until then a review
window elapsing produces nothing at all — which is worse than a meeting, not better, and is the
argument for building these three before the tests start rather than after.

| Rhythm | Job (all unbuilt) | What is to close |
|---|---|---|
| Nightly | `crm.dashboard.render` | The dashboard is never older than one day |
| Weekly, Monday 04:40 ET | `crm.review.close` | Every elapsed kill window; status flips; spend halts |
| Weekly | `crm.competitor.diff` | Competitive facts that would otherwise rot into lies (`BRAND.md` §8.3) |
| Week 8 (or later — see §9) | `crm.review.close` | T1: the **session→account rate within each tool's own denominator**, diff arm against generator arm. Not the run ratio, which was withdrawn as a verdict |
| Week 12 | `crm.review.close` | T1 hard kill on zero tool-originated conversions; T2 indexation floor at 20%; the Gartner listing's zero-session check, **if that row has left `unverified` by then** |
| Week 16 | `crm.review.close` | County × craft sub-surface, killed independently; prime→sub pages against T2's bar |
| Day 90 | `crm.review.close` | The T2 cohort against its control arm: delete, do not iterate |
| Week 26 | `crm.review.close` | The revision feed's referring-domain check. *(The Intuit listing was on this line; it is retired by §9 and no longer has a window.)* |

There is no standing meeting because there is nobody to hold one with, and no escalation path
because A3 forbids inventing one. An escalation here is a status flip.

---

## 7. Five ways this register could lie, and the guard for each

1. **Attribution without a denominator.** Cookieless analytics cannot follow a person across
   sessions, so channel attribution is session-level and `first_entry_path` is one weak signal.
   Guard: every attributed number is printed with its denominator or not at all.
2. **Survivorship.** Killed rows stay in `channels.csv` with `status=killed`. A register that
   deletes its failures reads as a strategy that never failed.
3. **The flattering loop.** The artifact loop is the most attractive idea in the plan and has no
   coefficient. Guard: it has no kill line yet *and* no yield may be assumed from it, which is the
   only honest pair of statements available.
4. **Self-referral contamination.** Our own re-checks would inflate verification loads. Guard:
   first-party and third-party loads are separated by referrer and session before any ratio.
5. **The zombie channel.** A parked row quietly restarting without its revival condition being met.
   Guard: `crm.review.close` asserts that each parked row's condition is still unmet, and a row that
   moved without one is reverted.

---

## 8. Hypotheses, flagged per the literature-grounding standard

- That first-party, cookieless, session-level attribution is sufficient to read these tests at all.
  Unmeasured, and load-bearing for every number in `dashboard.md`.
- That `first_entry_path` survives the gap between a free-tool session and a later paid signup.
- That the URL Inspection sample estimates indexed share within a useful band at n≈200/day.
- That a killed channel stays killed without anyone defending the decision — the whole design
  assumes nobody will argue with a cron, which is exactly what has never been tested.

---

## 9. The A1 counterparty audit, and the four rows it retired

A1 was applied with force to the channels being killed and lightly to the channels being kept, which
is the direction of bias that survives a review: **a refusal looks rigorous by itself.** This section
applies one test to every row, including the ones we wanted.

> **The test.** *Does passing this channel's own gate require someone on our side to answer a message
> from someone on theirs?* If yes, the channel is dead by A1 — a gate, not a weight — and it is
> **retired with the reason**, not softened, parked or re-timed.

`channels.csv` now carries a column **`human_on_their_side`** answering that question for every row.
Three answers are permitted: `no` (with the mechanism that makes it no), `yes` (with what they would
ask for), and `unread` (with what has not been fetched). `unread` is not a pass — a row sitting on
`unread` may not ship, which is why CH-15f's status is `unverified` rather than `placement`.

**Retired by this audit, 2026-08-13:**

| Row | Why it fails the test |
|---|---|
| **CH-15a Intuit QuickBooks App Store** — *status corrected 2026-08-13 from `retired` to `unverified` (finding N-5)* | The register had retired this row on the ground that an app-store review is a **correspondence, not a submission** — a review that returns required changes returns them to a responder this company does not have. That reasoning is sound **but it asserts a fact three sibling documents record as unread**: Intuit's review page could not be extracted by our reader, so what a rejection actually returns is unknown. Retiring on an unread fact is the same defect as reviving on one. The row therefore takes CH-15f's treatment — **blocked pending verification**, no submission and no engineering while the status reads `unverified` — and it is retired the moment the rejection path is read and shown to need prose to a named reviewer. The row's own job was `crm.platform.watch`, a quarterly *watcher*, and no responder exists anywhere in the plan. The timing evidence also has to be printed in both directions rather than in the flattering one: Intuit's own documentation targets **3 / 7 / 5 business days** (`research/04` §3.2), while `research/01` §4 records developers reporting **six weeks to six months** (cited to `satvasolutions.com`, a vendor blog — repeated, not sourced). The register had printed only the target |
| **CH-15c Procore Marketplace** | A **Certification Assessment** plus an executed standard agreement. The earlier disposition, *"a signature is not a demo"*, answered a question nobody asked; the A1 question is whether a counterparty expects a reply, and an assessment is nothing but replies |
| **CH-15d Gusto App Directory** | Already blocked in v1 by audit artefacts a new company does not have (SOC 2 Type 2, ISO 27001 or PCI) — but it fails the counterparty test independently, on a partner review that is **documented rather than inferred** — which is why this row retires where CH-15a only blocks: Gusto's path is read, Intuit's rejection path is not. Retiring it on the mechanism means it does not quietly revive the day a SOC 2 report exists |
| **CH-14 Affiliate programs** | Kept as `parked` on a self-serve-signup condition, but an affiliate programme has a counterparty by construction: payouts, tax forms and disputes are all messages from a person expecting an answer. The row is retired rather than left waiting for a signup form that would not fix the part that fails |

**Not retired, and why each survives the test:** CH-04 SEM and the CH-07 family answer to ranking and
auction machinery, not to a person — with two exceptions now written into their rows rather than
assumed away: an **advertiser identity verification** at Google and a **manual action** at Google
Search are both correspondence, and both are recorded as `unread` gates that must be ruled before
spend or before a reconsideration request is ever needed. CH-09's recipients are people, but the
direction is outward and the only inbound path is the published billing address that already
increments G5's counter. CH-15b Zapier stays `parked` at `unread`: its public-beta promotion involves
a partner review whose shape we have not fetched, and the revival condition (50 active users) is far
enough away that the ruling can wait — but it is now a ruling that must happen, not a silence.

**What this audit cost.** It removed the only two platform rows anyone was counting on and left the
"existing platforms" column holding one unverified listing and one parked integration. That is the
itemised price of A1, in the same spirit as the trade-show row: the constraint is not free, and a
register that hides the invoice is not a register.

---

## 10. Three corrections recorded rather than silently applied

**10.1 CH-07's ring is an override, and here is the argument.** `research/02-demand-seo.md` §9 — the
document that actually ran the SERPs — places programmatic SEO in Bullseye's **middle ring**: four
incumbents hold the surface, the highest-intent phrasing is partly another regime's, and defensible
supply is ~1% of the naive ceiling. `channels.csv` carried `inner` and the playbook committed the
phase's engineering to it. Both rings were printed and neither argued, which is precisely the failure
Weinberg & Mares' method exists to prevent: the ring is an **output** of the ranking, not an input to
the plan.

The ring stays `inner`, and it is now recorded as an override with its reasons, its cost and its
revocation condition:

- **Reason 1 — what A1 leaves.** Hormozi's Core Four minus both human-outreach quadrants leaves free
  content and paid ads. T3 (paid) is capped at $2,000 and answers in weeks; T2 is the only *durable*
  surface left. A middle-ring channel that is one of two survivors is not competing with the same
  field the survey ranked it against.
- **Reason 2 — marginal cost.** The launch cohort's incremental cash is ~$0: hosting sits inside the
  ~$175/month fixed platform cost, and the pages are emitted by a rebuild job that the corpus already
  requires for its own promotion diff. The ring is a claim about expected return per unit of cost, and
  the denominator here is unusually small.
- **Reason 3 — it is the only channel that compounds.** SEM stops the day the cap is hit.
- **The cost of being wrong, stated.** T2 is the only test whose price is measured in months of
  engineering, and Reason 2 is the load-bearing one. **Revocation condition:** if `pages.rebuild` does
  not ship as a byproduct of the corpus promotion diff — i.e. if the cohort needs its own engineering
  rather than one job — the marginal-cost argument fails and CH-07 reverts to `middle` at the next
  close, ahead of any indexation threshold.

**10.2 T1's kill criterion, restated so that it tests its own hypothesis.** The pre-registered line was
*"KILL the differentiation hypothesis if diff runs ÷ generator runs < 1.0 at week 8."* The two tools do
not share a population: the generator needs nothing, and the diff checker needs a determination number
**and** an award date the visitor must already have in hand. Requiring the constrained tool to out-run
the unconstrained one measures input availability, not draw — a ratio below 1.0 is the expected result
even if provenance is exactly the draw. Writing a threshold first is necessary and not sufficient
(Ries); it must also be able to answer the question asked.

The ratio survives as a **descriptive counter with no verdict attached**. The kill moves to a
population-matched comparison, each arm in its own denominator:

> **KILL the differentiation hypothesis if the diff tool's session→account rate does not exceed the
> generator's** — `t1.tool_to_account` split by tool — at the first weekly close where **both arms
> have ≥200 completed runs**, or at week 8, whichever is later. If either arm is still under 200 at
> week 12, the test is recorded as **unrun**, never as passed. The hard kill at week 12 on zero
> tool-originated paid conversions is unchanged; it was always population-independent.

**10.3 CH-15f's evidence, downgraded to what was actually read.** See the row itself. The listing's
terms were never fetched to primary source; the word "free" is struck until they are.

---

## References

**Fetched in-session, 2026-08-13**

- https://developers.google.com/webmaster-tools/v1/searchanalytics/query — metrics `clicks`,
  `impressions`, `ctr`, `position`; dimensions country, device, page, query, searchAppearance, date,
  hour; 1,000 rows default, 1–25,000 range
- https://developers.google.com/webmaster-tools/limits — URL Inspection: **2,000 queries per day and
  600 per minute per site**; Search Analytics 1,200 QPM per site
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect — index status of a
  URL, for the version in the Google index
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business — clear and
  conspicuous opt-out; honour within **10 business days**; valid physical postal address; accurate
  From/To/Reply-To and routing; no deceptive subject lines
- https://oag.ca.gov/privacy/ccpa — the three applicability thresholds and the five consumer rights;
  45 calendar days to respond, extendable to 90
- https://www.capterra.com/vendors/ — **HTTP 200.** Carries *"Create a product listing"* and a
  *"Get Your Product Listed"* button linking to `https://app.g2digitalmarkets.com/get-listed/start`.
  **No price, no fee and no use of the word "free" appears on the page**, and the only mention of
  verification is *"collecting verified reviews"*, which is about reviews and not about the listing
- https://app.g2digitalmarkets.com/get-listed/start — **fetched, and it returned nothing readable**:
  a document whose entire text content is the title *"G2 Digital Markets"*, i.e. a client-rendered
  application shell. **The listing terms remain unread.** This is the fetch that was supposed to
  settle CH-15f and it did not settle it, which is why the row is `unverified` and not `placement`
- https://www.capterra.com/faq/faqs-vendors/ — **HTTP 404**, reproducing the 404 the earlier research
  recorded. The claim that a vendor listing is free was sourced to this page *via a search summary*
  and to an SEO directory; under `CORRECTIONS.md` §0.1 that is repeated, not sourced, and it is struck
- https://plausible.io/data-policy — "We don't use cookies, we don't generate persistent identifiers
  and we don't collect or store personal data that can be used to identify individuals"; salt
  rotated and deleted every 24 hours; "you do not need cookie banners for analytics"

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D3, D4, D8, D9, G1–G6
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — §5 unit economics and the $46.98 rate-card
  contribution; §6 affordable CAC
- `run-2/phase-2-build/CORRECTIONS.md` — §3.1 Scope A, §4 F-1…F-4, §5 the claims.json write path
  this register copies, R-HIGH2
- `run-2/phase-2-build/identity/BRAND.md` — §5.5, §5.6, §6.6, §8.3, C-B2, C-B3, C-B5
- `run-2/phase-2-build/architecture/ARCHITECTURE.md` — §3.9 boundary table, §5.4 retention, §7.1 the
  scheduler, §10.5 the one human-facing channel, §14 gate instrumentation
- `run-2/phase-3-acquisition/research/01-channels.md` · `02-demand-seo.md` ·
  `03-communities-and-lists.md` · `04-integrations-and-portals.md`

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — https://tractionbook.com/ — Bullseye; three
  concurrent tests; a viral claim requires a measurable coefficient with a cycle time
- Eric Ries, *The Lean Startup* — http://theleanstartup.com/ — innovation accounting; thresholds
  written before the data
- Alex Hormozi, *$100M Leads* — the Core Four, two quadrants of which A1 deletes outright
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — the frame a
  channel sorts the reader into
- Geoffrey Moore, *Crossing the Chasm* — https://www.geoffreyamoore.com/ — beachhead before breadth,
  applied to segments and to page templates alike
- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 —
  self-serve metering; why CAC payback misleads for PLG, hence cost per purchase
- Rob Fitzpatrick, *The Mom Test* — why an unreachable forum is evidence in neither direction
- The Twelve-Factor App — https://12factor.net/ — guarantees implemented in the codebase rather than
  in a review checklist
