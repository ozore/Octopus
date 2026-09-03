# StateReady — wave-1b review

## RE-REVIEW ROUND 2 — 2026-09-03 · **SIGNED FOR WAVE 2 AND FOR LAUNCH**

**Re-checked:** `REVIEW_RESPONSE.md` §6, then R1, N1, N2, M13's schema half, m6, N3, N4, N5 and the two
stale references in `specs/05` and `specs/08`, against the files themselves. **No reviewed file was
edited.**

> ### VERDICT — **0 blocking · 0 major · 1 minor open** (was 1 · 3 · 4, and 11 · 19 · 16 at round 1).
> ### **Signed for wave 2 and for launch.**
>
> All eight items close. The one open item is a stale paragraph body whose own heading already carries
> the correction — a fix-on-sight, not a gate.

### Verified by running it, not by reading it

| check | result |
|---|---|
| `validate.py` | **exit 0** — 9 records, 0 failures, 3 warnings (the same correct G7 Florida three), with G8 now nine assertion sites wide |
| `test_accept_drift.py` | **17/17** |
| `test_fill_excerpts.py` | **14/14**, including the load-bearing one — *"DRIFTED source: entry is byte-identical to before"* |
| `refresh_sources.py --fill-excerpts`, audited against git HEAD | **35 of 35** sources now carry `normalised_head`/`normalised_tail`; **no key other than those two changed on any source**, and **every `content_sha256` is identical to the committed baseline**. The backfill is exactly what N1 asked for and nothing else |
| `identity/contrast.py` · `../scripts/identity-distinctness.py` | **both exit 0** after the samples regeneration |
| `samples.html` integrity | 0 undefined classes, 0 external references |
| Landing copy deck, re-counted mechanically | **439 of 450**, and **every section matches its claimed figure** — 68 / 37 / 93 / 20 / 66 / 51 / 9 / 86 / 9. The verbatim guarantee block is **63 words**, as claimed |
| Entry Pack Guarantee parity | **byte-identical in all four documents** — `OFFER.md` §5.1, `specs/08`, `specs/12`, `LANDING_SPEC.md` (§8 table and §13 deck) |
| `expiry_overrides` | present in `ontology/schema.state_trade_record.json` on `licence_types[]`; G8 grew from one assertion to nine, covering the cycle-year bound, one-per-cycle, two verifiers, evidence length, future dates and the host allowlist |

### The eight items

**R1 — closed, and closed better than I proposed.** I offered to exempt the marketing route on
conditions. The iteration refused, and was right to: my condition — *"no term the full text does not
use"* — would have licensed the very compression that caused R1, because *"Entry Pack contradicted by
the board's own page? We rewrite it and refund you"* adds nothing while **dropping the 90-day window
and the fee cap**, and so reads as a *larger* promise than the one we wrote, on the only page a
stranger reads before paying. The Entry Pack Guarantee is now carried **whole, 63 words**, on the
landing page; only the Accuracy Guarantee (exposure: one month's credit) is compressed, under four
conditions AC8c tests mechanically — quantities compared on the stem, escalation words enumerated, a
link required in the same strip. The rule lives once in `OFFER.md` §5.1 as a surface × form table and
the other two documents point at it, which is the structural fix for how the three drifted apart.
It cost +52 words, paid for with three cuts of prose that restated what the page already shows.

**N1 — closed and run.** `--fill-excerpts` writes excerpts **only where the re-fetched hash equals the
stored one**, leaves a drifted or unreachable source byte-for-byte alone, names it, points at
`accept_drift.py`, and exits non-zero if it refused anything so CI cannot pass on a half-filled store.
I audited the committed diff against git rather than trusting the report: two keys added, 35 sources,
zero hashes moved.

**N2 — closed and widened by two.** The rule is now written into the document — *a feature may appear
in Contains only if it has a Must or a Should with a number* — and eight entries came out with the
reason each failed. The iteration then found two more of the same class that my finding missed (§3's
stack item 5 and §4's Platform bonus) and struck those too. Every surviving feature carries its id.
Platform's row is thinner and true, which is the right trade at $599.

**M13 — closed.** The field is representable and gate G8 now does for an override what G1/G3/G4/G5 do
for a `SourcedValue` — the correct instinct, since an override is the one thing that can move a
deadline without a value wrapper. `kb-data/` is untouched; wave 2 can write the Florida 2 September
override on day one.

**m6 — closed.** Regenerated from `build-samples.py`, which reproduced the committed file byte-for-byte
first, so the diff is exactly the fix: all-caps status words, and the hollow tile carries
`"AK — not in your footprint"` — the exact accessible name `specs/07` prints, with no status word and
no duplication. The `WORD` dict deliberately has no hollow entry, so the fifth-status mistake cannot
be remade one tile at a time.

**N3, N4, N5 — closed.** `IDENTITY.md` §7.1 says `--sr-ground`; the only surviving `--sr-paper` strings
in any document are the sentences recording the rename. `specs/04`'s Requirements panel is in B2's
wording with **AC8 behind it** — an unpublished field is a rendered row reading *"the board does not
publish this"*, never a blank and never a hidden one. `specs/12` AC8 asserts exactly two canonical
wordings, and the `§5.1.3` citation class is killed at its source by §5.1's own numbering note.

**The two stale references — one closed, one half-closed.** `specs/08` §Guarantee now cites
`OFFER.md` §5.1 (Entry Pack Guarantee row): correct.

### Still open

| id | severity | one line | what is missing |
|---|---|---|---|
| **N6** | minor | `specs/05` §"Schema and gate work this requires" — the **heading** now says the work is done and points at the evidence, but the **body is unchanged** and still reads *"Until both land, an override is unrepresentable and this rule is dormant"* and *"**This is the first schema change wave 2 should make**"*, in bold. A wave-2 developer who reads past the parenthetical concludes the field cannot be used | Two sentences: the body becomes past tense, or the paragraph is replaced by the one-line "done, see `ontology/schema.state_trade_record.json` and G8" the response itself proposed. Nothing depends on it — `validate.py` accepts an override today, proved in a temp tree — so it is a fix-on-sight, not a gate |

### Signature

> **Signed for wave 2 and for launch.** — wave-1b Reviewer, 2026-09-03, round 2 of 3.

The signature is on **these documents**: `PERSONA.md`, `IDENTITY.md`, `design-system.css`,
`identity/samples.html`, `UX.md`, `BACKLOG.md`, `specs/01`–`specs/14`, `KNOWLEDGE_BASE.md`,
`ontology/`, `kb-data/`, `kb-scripts/`, `THRESHOLDS.md`, `OFFER.md`, `LANDING_SPEC.md`. Three rounds
took 11 blocking findings to zero, and the two places the authors overrode me — **B6** (medium
confidence carried by note-everywhere and fail-closed rather than a blanket flag) and **B9** (a cron
designed to be correct on one invocation a day rather than a prerequisite purchase order) — were
argued better than I argued mine and are the right calls.

**What the signature is not.** It does not clear the build, which gets its own wave-2 review, and it
does not close the gates that were never findings against these documents: **P1** Vercel Pro,
**P5** Stripe products, **P10** postal address and support email (`specs/12` correctly fails the build
without it), **P11** the name and the USPTO knock-out, **P12** founder validation of the offer, and
**Q15** counsel on the terms — automatic-renewal disclosure, the word "guarantee" as a UDAP hook, and
the roster-build disclaimer if S10 ever returns positive. The **S10 register-ingestion spike** remains
the gate on the deferred $149 audit and on any surface saying we build the roster; until it returns a
majority-positive verdict, `BACKLOG.md`'s permanent prohibition stands.

**Start wave 2 on all seventeen Musts.** Read first, in this order: `specs/05` invariant 2, `specs/06`
§Flow, `specs/08`'s `entryPackReady`, and `kb-scripts/accept_drift.py` with its test.

---
---

## RE-REVIEW ROUND 1 — 2026-09-03 (after the first `REVIEW_RESPONSE.md`)

**Reviewer:** wave-1b Reviewer (StateReady). **Re-read:** `REVIEW_RESPONSE.md`, then every file it
claims to have changed — `PERSONA.md`, `UX.md`, `BACKLOG.md`, `specs/01`–`specs/14`,
`KNOWLEDGE_BASE.md`, `ontology/`, `kb-scripts/` (incl. the new `accept_drift.py` and
`test_accept_drift.py`), `THRESHOLDS.md`, `OFFER.md`, `LANDING_SPEC.md`, `README.md` — plus the
identity outcome: `IDENTITY.md`, `design-system.css`, `identity/samples.html` and
`../IDENTITY_ARBITRATION.md`. **No reviewed file was edited; only this section was added.**

> ### VERDICT — **1 blocking · 3 major · 4 minor open** (was 11 · 19 · 16).
> ### **NOT SIGNED — but the gate is three text edits away.**
>
> **All 11 wave-1 blocking findings are closed**, nine as asked and two deliberately differently
> (B6, B9) with the reasoning written down and a founder lever attached — I accept both, and B9's
> replacement is better engineering than my own D8. Seventeen of nineteen majors are closed; M13 is
> half-done and declared as such. Five things I re-verified by running code rather than reading prose
> all hold.
>
> **What stops the signature is one regression the iteration introduced (R1) plus two documents that
> a wave-2 developer would build wrong from (N3, N4).** Close those three and I sign for wave 2 the
> same day. Two further items (N1, N2) must close before launch, not before the build starts.

### What I re-ran, and what it proved

| check | result |
|---|---|
| `python3 kb-scripts/validate.py` | **exit 0** — 9 records, 0 failures, 3 warnings (the same three correct G7 Florida warnings) |
| `python3 kb-scripts/test_accept_drift.py` | **17/17 assertions pass**, counted. Both hashes move together; a baseline-only rewrite of a **cited** source fails G10; an **uncited** one warns and deploys; `_history` is written; `--dry-run` writes nothing; **no value, status, confidence or `last_verified` is touched** |
| m4's schema tightening — tested, not trusted | I demoted `tx.hvac licence_types[0].application_fee` to `unverified` in a temp tree and stripped its `source_url`: **3 failures** (`missing required property 'source_url'`, `missing required property 'note'`, `G3`). The wave-1 schema produced **none**. The claim is real |
| `python3 identity/contrast.py` vs `IDENTITY.md` §6.3 | **exit 0**, and the document now matches the script exactly — 70 pairs, smallest text margin **4.89:1**, smallest non-text **3.15:1**, 0 failures. The stale table is gone |
| `python3 ../scripts/identity-distinctness.py` | **exit 0** — 3 apps, 3 ground pairs, 3 typeface pairs, no shared family |
| Token parity, docs vs CSS | Every hex in `design-system.css` (21 board + 21 paper tokens) now appears in `IDENTITY.md`. **One undeclared token remains cited: `--sr-paper`** (see N3) |
| Landing word budget, re-counted mechanically | **413 words**, and **every section matches its claimed count** — 68 / 37 / 97 / 31 / 66 / 9 / 62 / 34 / 9. Ceiling 450, headroom 37 |
| `LANDING_SPEC.md` §4's new Texas quote | *"You may not engage in air conditioning and refrigeration contracting if your license has expired."* — present in `kb-data/tx-hvac.json` (`renewal.grace_period`, verified/high) **and** on the live TDLR renewal page, which I read in round 1. Publishable |

### Blocking — closed

| id | closed how | verified by |
|---|---|---|
| **B1** | D1 applied across all eight files **plus `README.md`**, which still advertised the disagreement. `THRESHOLDS.md` §7 carries the changelog row, **no band moved**, H2b marked `NOT IN FORCE`, and the reversal order is written down (§7 before §2, before a single audit is sold). `specs/09` keeps `first_state_audit` as a dormant enum with a test that no code path writes it | read all nine files; grepped every `$149` occurrence — the only live ones are the deferral records |
| **B2** | The promise is narrowed, not the sale blocked: *"every requirement the board publishes, and, on the first page, every requirement it does not"*. `entryPackReady` (CORE_SET blocking / DISCLOSED_SET disclosed **before Checkout**) is explicitly **not** `publishable`. Bond out of the subhead, out of V4, out of the demo default. `KNOWLEDGE_BASE.md` §9.1 is new and carries the counted table | their count (bond.amount 0/23, timeline 2/7) matches my own census independently |
| **B3** | Deferred, **and every surface edited**: hero microcopy deleted, "How it works" step 2 is now the CSV import, `LANDING_SPEC.md` §11 bans the claim permanently, and **S10** is a real spike with seven acceptance criteria including the terms-of-use position per register | grepped: the only "we build the roster" hits are the sentences recording the deletion |
| **B4** | Re-drafted with **exactly the five carve-outs**, capped at the lesser of twelve months' fees and fees paid, claims within 30 days, log-adjudicated — and each carve-out has an `alerts.status = suppressed` reason behind it so adjudication is a query. **Not shipped**; `specs/12` AC8 fails the build if the text renders | read §5.3 and the `specs/06` suppression reasons |
| **B5** | One wording, adjudicated against *"a page published by the state's own licensing board"*, 90-day window, liability capped at the fee. The oral *"a board tells you"* standard is gone from both specs | grepped — zero live occurrences. **But see R1** |
| **B6** | **Fixed differently, and I accept it.** The self-contradiction is gone: invariant 2 is now a table and AC7/AC7b agree with it. Medium-verified passes unflagged **but may never appear bare** — it renders its `note` in all four surfaces, and it still goes in the needs-human-check block of a **paid** pack. And it **fails closed**: medium with **no** note flags, which catches `tx-plumbing` [1] and [2] exactly | read invariant 2 and AC7/AC7b against `kb-data/tx-plumbing.json` |
| **B7** | Tile grid, one all-caps vocabulary, hollow-dashed *not in your footprint* as a **rendering not a status**, **AT RISK = 90** — and it is structural: `AT_RISK_DAYS === ALERT_OFFSETS[0]` is unit-tested, AC3b runs one fixture through `specs/07` and `specs/06` together, and a lint rule forbids "amber"/"red"/"green"/"ok" as status names | read the rewritten §Screens and §Validation |
| **B8** | **Both halves closed.** `../IDENTITY_ARBITRATION.md` exists (45 KB, with a ΔE76 measurement of the collision and a `--selftest` that replays the three pre-arbitration grounds), `IDENTITY.md` is rewritten with a supersession table and a regenerated contrast table, and `UX.md`/`LANDING_SPEC.md` carry board/paper, Barlow/Overpass and the 90 KB font budget | contrast numbers match; distinctness gate exits 0; token parity clean **except N3** |
| **B9** | **Fixed differently, and better than my D8.** Specified to be correct on **one invocation a day** and to tighten to hourly with no code change. Three details are the actual engineering: the claim is `next_send_at <= now() + DRAIN_INTERVAL` (AC9 is the regression test — the obvious formulation silences the entire Pacific coast forever); offsets are `<=` on the largest unsent gate so a skipped run **delays** an alert and never deletes one (AC10); and a sub-daily expression on Hobby **fails the build** (AC11). I withdraw D8 | read the rewritten §Flow and AC9–AC11 |
| **B10** | `unique(deadline_id, offset_days, recipient_user_id)`, `digests` unique per `(recipient, send_date)`, a new `alert_recipients` table carrying the scheduling state. AC5 is now a row-level assertion: two recipients → two alerts and two digests, and a bounce on one leaves the other delivered | read the data model and AC5 |
| **B11** | `accept_drift.py` re-fetches, writes the new hash **to the baseline and to every citing record together**, appends `_history`, re-runs `validate.py` and reverts on failure. `resolveDriftItem` never writes files; the queue shows **`no_change — awaiting acceptance`** until a deploy lands. G10 is scoped to citation: failure where a value cites the page, a named warning where none does | **17/17 test assertions pass on my machine** |

### Major — 17 closed, 1 split, 1 superseded by a new finding

Closed and spot-verified: **M1** (S15→**M16** qualifier watch, S19→**M17** shared readiness link, both now Musts; `UX.md` §9 lists the four that stay SHOULD), **M2** (**M15** marketing route + demo, total restated **~40 dev-days**), **M3**, **M4** (`licence_deadline_derived` emitted from the derivation service; `why_this_date_opened` deleted), **M5** (band literal gone; AC3b greps the codebase for it), **M6**, **M7**, **M8** (published *"Contact us"* row with `POST /enterprise-enquiry` behind it and a two-business-day promise — the only number on the row and one we control), **M9** (5 of 20 corrected), **M10**, **M11**, **M12** (cadence out of the legal page; AC7 greps for "daily"/"monthly" and fails on a match), **M14**, **M15**, **M17**, **M18**, **M19**.

- **M13 — split, half open.** The engine rule for board-announced date rolls is fully specified in
  `specs/05` with the Florida 2 September extension as the worked example. **The
  `ontology/schema.state_trade_record.json` field and the G8 extension are not done**, and
  `additionalProperties: false` makes `expiry_overrides` **unrepresentable** until they are — so the
  first wave-2 developer who adds one to a record gets a build failure. The spec names the exact patch
  and calls it the first schema change wave 2 should make. Declared honestly; **stays open**.
- **M16 — superseded by N1.** The code is right; the data is not there (below).

### Minor

Eleven fixed (m1, m2, m7, m8, m9, m11, m12, m13, m14, m15, m16), one fixed differently and well
(**m5** — the renderer fails closed on a medium value with no note, and AC7b reads the committed
records so the test starts passing on its own the day the two notes are written), **m3 and m10
declined with reasons I accept** (the schema `$id` depends on founder gate P11; `offer/CLAUDE.md` is
another agent's memory and the authoritative count now lives in `LANDING_SPEC.md` §1 with its
working shown). **m6 stays open** and has sharpened — see below.

---

### Still open

| id | severity | one line | what is missing |
|---|---|---|---|
| **R1** | **BLOCKING — regression introduced by this iteration** | Three documents now disagree about whether the landing page carries the guarantees **verbatim** or **compressed**, and the specified CI test fails against the specified copy. `OFFER.md` §5.1: *"Both are quoted verbatim in `specs/08`, `specs/12`, the purchase screen and **`LANDING_SPEC.md` §8**. A paraphrase is a different guarantee."* `specs/12`'s refund policy lists `LANDING_SPEC.md` §8 among the surfaces carrying "the one wording used everywhere", and **AC8** asserts *set equality* of every guarantee block extracted from **the marketing route**. But `LANDING_SPEC.md` §8 says the two lines are *"each a **compression** of the guarantee it names"*, and §13 specifies them: *"Wrong against the source? We fix it in five business days and credit you a month."* / *"Entry Pack contradicted by the board's own page? We rewrite it and refund you."* | Pick one and make all three agree. **Recommended:** amend `specs/12` AC8 to exempt the marketing route **on conditions** — each compression must link to `/legal/refunds`, must contain no term the full text does not, and must not use the bare word "guarantee" without the link — and amend `OFFER.md` §5.1 to say "verbatim on the legal page, the purchase screen and in the pack; compressed with a link on the marketing page". Putting the full 60-word text on the landing page is the alternative and it is worse copy. **This is not cosmetic:** the compressions drop the **90-day claim window** and the **liability cap** from the page a buyer reads *before* paying, which is the exposure B5 was raised about |
| **N1** | **major — new** | **M16's excerpt store is implemented but empty, and the only way to fill it is unsafe.** `refresh_sources.py` and `accept_drift.py` both write `normalised_head` / `normalised_tail` (4,000 chars) — but the committed `kb-data/_sources.json` carries them for **0 of 35 sources**. So on the first drift against any source, `/admin/kb/:id` has no "before" text and the diff screen degrades — exactly when it is first needed. The obvious remedy, `refresh_sources.py --write-baseline`, **re-fetches everything and writes whatever it finds**, silently accepting any real drift that has occurred since 2026-09-03, which is the bulk unreviewed publish the whole M14 design exists to prevent | Add a `--fill-excerpts` mode that writes `normalised_head`/`normalised_tail` **only where the re-fetched `content_sha256` equals the stored one**, and **reports rather than accepts** any source that has moved. Ten lines, one test. Then run it once so the 35 sources have a "before" |
| **N2** | **major — new (my miss in round 1)** | **`OFFER.md` §7's "Contains" column sells eight features that have no Must, four of them explicitly deferred.** Multi-State ($349/mo): *rule-change watch* (no backlog item anywhere), *bond & insurance certificate tracking* (**BACKLOG L5 = LATER**). Platform ($599/mo): *multi-entity / per-brand separation* (**L6 = LATER**), *webhooks* (**L4 = LATER**), *subcontractor credential tracking* (nothing), *audit log* (nothing), *acquisition intake checklist* (nothing). And the **free State Rulebook row still promises *"bond/insurance minimums"***, which B2 removed from the subhead, V4 and the demo. The iteration caught exactly one instance of this class — the CE-provider directory, now `BACKLOG.md` S11 — and stopped there. Not yet on a customer-facing page (`/pricing` is spec'd as limits-only and `LANDING_SPEC.md` §5 publishes price and limits only), which is why this is major and not blocking — but `OFFER.md` §7 is the obvious source for whoever builds `/pricing` | Same treatment S11 got: every feature in the Contains column carries its backlog id, or it is deleted. Four are LATER and must come out of the paid tiers. Fix the free row to match B2 |
| **M13** | major — half open | `expiry_overrides` is specified in `specs/05` and **unrepresentable in the data**: `ontology/schema.state_trade_record.json` has `additionalProperties: false` and G8 does not know the token | The schema field and the G8 extension. Declared and scoped by the iteration; it is the first wave-2 schema change |
| **m6** | minor — open, and sharper than it was | `identity/samples.html` still shows sentence-case status words (*"At risk"*, *"Not tracked"*) against `IDENTITY.md` §6.1's all-caps names, still duplicates its accessible names (*"AK — Not operating. Not operating"*, 83 occurrences of the phrase), and now **contradicts the spec written to govern it**: `specs/07` says a hollow tile *"carries no status word because it has no status"*, while the reference implementation puts one in twice | Regenerate `samples.html` from `build-samples.py`. Brand Director's file; correctly delegated, still not done |
| **N3** | minor — new, residual of B8 | `IDENTITY.md` §7.1 rendering rules still say *"States you do not operate in are drawn, in **`--sr-paper`**"* — a token the arbitration deleted. It is the **only** undeclared `--sr-*` token cited anywhere in the three documents, and a build following §7.1 emits an undefined custom property | One word: `--sr-ground`. `LANDING_SPEC.md` V1 already says it correctly and explains the rename |
| **N4** | minor — new, residual of B2 | `specs/04` `/licences/:id` still specifies a **"Requirements (CE hours, bond, insurance, all with citations from the KB)"** panel. Bond has **zero** verified amounts in all nine records, so that panel renders empty for bond 100% of the time — the same claim B2 removed from the subhead, V4 and the demo, left standing in the spec a developer will implement | Apply B2's wording: the panel shows what the board publishes and names what it does not, using the same DISCLOSED_SET language as `specs/08` |
| **N5** | minor — new | `specs/12` AC8 opens *"The **three** guarantee wordings…"* then asserts set equality with *"the **two** in force"*; and the refund policy cites `OFFER.md` **§5.1.3** for a guarantee that is now §5.1 item 2 (the wave-1 numbering) | Two words and a cross-reference |

**One observation, not a finding.** `specs/06` gives 12:00 UTC as *"07:00 ET / 06:00 CT / 05:00 MT / 04:00 PT"*. That is standard time; under daylight time it is 08:00 EDT / 05:00 PDT. The limitation is disclosed either way and the design handles it — worth a parenthesis in the help article rather than a change.

### Regressions introduced by the iteration

**One: R1**, above. It is the direct cost of doing B5 (one wording everywhere) and the landing-page word budget (34 words for the guarantee strip) in the same pass — each edit is right on its own and they contradict where they meet. Nothing else regressed: prices, limits, tier metric, event names, thresholds, the drift scripts and the KB all re-verified clean, and the copy deck's arithmetic is exact to the word.

### Signature

**Not signed yet.** The gate is `PIPELINE.md`'s: no blocking finding open.

**To sign for wave 2 — three edits, all text, no code:**

1. **R1** — make `OFFER.md` §5.1, `specs/12` (refund policy + AC8) and `LANDING_SPEC.md` §8 agree on verbatim-vs-compressed, with the link condition above.
2. **N3** — `--sr-paper` → `--sr-ground` in `IDENTITY.md` §7.1.
3. **N4** — `specs/04`'s Requirements panel adopts B2's wording.

**To sign for launch — additionally:**

4. **N2** — every feature in `OFFER.md` §7's Contains column carries a backlog id or is deleted; the four LATER items come out of the paid tiers; the free row loses "bond/insurance minimums".
5. **N1** — `--fill-excerpts`, and run it once.
6. **M13**'s schema half and **m6**'s samples regeneration, both already owned and scoped.

**Wave 2 is not blocked while those are written.** Start today on **M14, M5** (pure function, golden
tests, invariant 2 as now written), **M1, M2, M3, M11, M16, M17**, the **GA/OH/AZ/MI** knowledge-base
tranche, and component work from `design-system.css`. **M6, M7, M9, M10, M13** are unblocked by this
round and may follow. Only **M4** (N4), **M8/M12** (R1) and **M15** (R1) should wait on the three
edits above — and they are the last three things sub-wave C builds anyway.

**Two calls I accept without reservation**, both taken against my own recommendation and both argued
better than I argued mine: **B6** (medium-confidence values flagged by note-everywhere and
fail-closed, not by a blanket flag that would fire on a third of the data) and **B9** (a cron designed
to be correct on one invocation a day instead of a prerequisite purchase order). The founder levers in
`REVIEW_RESPONSE.md` §4 are correctly identified and correctly priced; if the founder wants the
stricter B6 reading, take it **before** wave 2 builds M5, when it is one line rather than sixty
golden cases.

---

*Round 2 of 3. If a third round is needed on the six items above, `PIPELINE.md` says it escalates to
the orchestrator with the disagreement written down — I do not expect to need it.*

---
---

## ROUND 1 — the wave-1b review as written on 2026-09-03, unchanged below

**Reviewer:** wave-1b Reviewer (StateReady), phase-4 fleet. **Date:** 2026-09-03.
**Scope reviewed in full:** `PERSONA.md`, `IDENTITY.md`, `design-system.css`, `UX.md`,
`identity/samples.html`, `identity/sources.md`, `BACKLOG.md`, `specs/01`–`specs/14`,
`KNOWLEDGE_BASE.md`, `ontology/`, `kb-data/` (all 9 records; `tx-hvac`, `nc-plumbing`, `fl-hvac`
opened value-by-value), `kb-scripts/` (`validate.py`, `refresh_sources.py`, `verify_pass_b.py`,
`rank_states.py`, `lib_kb.py` all read; three executed), `THRESHOLDS.md`, `OFFER.md`,
`LANDING_SPEC.md`, `offer/RESEARCH.md`, the three memories (`identity/`, `product/`, `offer/`),
`../PLAN.md`, `../PIPELINE.md`, `../PREREQUISITES.md`, `phase-1-ideation/ERRATA.md`,
`phase-3-acquisition/prospects/stateready/README.md`.
**Nothing in this directory was edited.** Only this file and `review/CLAUDE.md` were written
(`PIPELINE.md`: reviewers never edit).

> ## VERDICT — **11 blocking · 19 major · 16 minor. NOT SIGNED.**
>
> The knowledge base is the strongest artefact any of the three fleets has produced and it survived
> every check I ran, including a live re-verification of five load-bearing values and a reproduction
> of the 15-state ranking against BLS. The specs are unusually buildable. **What is not ready is the
> commercial layer:** one live contradiction about how a stranger starts (decided in §1), two
> guarantees that pay out on our own designed behaviour, a $750–1,500 document whose four
> best-selling fields are `unknown` in nine records out of nine, and a landing-page promise
> ("we build the roster from the public registers") with no spec, no backlog item and no feasibility
> evidence anywhere in the fleet's output.
>
> Fix the 11 blocking items and wave 2 can start on nine of the fourteen Musts immediately.

---

## 0. What I ran, so the findings are checkable

| check | command | result |
|---|---|---|
| KB schema + 13 gates | `python3 phase-4-revenue/stateready/kb-scripts/validate.py` | **exit 0** — 9 records, 0 failures, 3 warnings (all G7 on the Florida reciprocity gap, correct) |
| Source drift, live | `python3 .../kb-scripts/refresh_sources.py` | **exit 0** — `unchanged 35 drifted 0 unreachable 0 new 0`. All 35 board pages still live and hash-identical after normalisation |
| Drift on a changed hash | tampered baseline copy, `--only bls.qcew.2382` | **correct** — `drifted 1`, prints `DRIFT <id> <old12> -> <new12>` + URL, **exit 1**. Behaviour verified, not assumed |
| Launch-state ranking | `python3 .../kb-scripts/rank_states.py` | **reproduces exactly** — CA 25,398 … VA 5,225; 149,343 / 236,924 = **63.0%**; WA #16 (5,110) and TN #17 (4,648) out, exactly as `KNOWLEDGE_BASE.md` §2 records |
| Contrast certification | `python3 identity/contrast.py` | **exit 0**, 0 failures — **but the numbers no longer match `IDENTITY.md` §6.3** (see B8) |
| CSS integrity | token/brace/undefined-`var()` walk | 69 declared, 58 used, **0 undeclared**, braces balanced, `@media print` + `forced-colors` + `prefers-reduced-motion` all present, **no blue at any weight** |
| `samples.html` | class + external-reference walk | 80 `sr-` classes used, **0 undefined**, **0 external refs**, 51 tiles (50 + DC) |
| Landing word budget | independent re-count of the §13 copy deck under §1's own rule | **398 words** — the spec's figure is exact, section by section (81/37/76/31/68/62/43) |
| KB value spot-check | 5 values × live source, ≤2 attempts each | **5/5 found and correctly attributed** (§4.1) |
| Copy-claim spot-check | CSLB fees + Housecall Pro quote, live | **all found** (§4.2) |

---

## 1. The live contradiction, decided

### 1.1 The four positions

| document | position |
|---|---|
| `PERSONA.md` §9 | The buyer arrives expecting a **14-day free trial, no card** — Jobber's published norm, 11 days more than the direct competitor. Flags the conflict inline. |
| `OFFER.md` §8, `LANDING_SPEC.md` §0/§2.4/§13 | **No free trial.** A **$149 First State Audit** tripwire: card captured, *"we build the roster from the public registers"*, credited against an annual plan. The page's single CTA is `Start with one state — $149`. |
| `THRESHOLDS.md` §1/§3 | **T2 = activation → paid**, banded for a **no-card trial** (H2). H2b registered as the contingent tripwire band (≥ 40% audit → subscription) and explicitly marked *"contingent on a founder decision"*. |
| `specs/09` §"The open disagreement" | Product owner recommends the **free trial for the first 100**, because the audit's roster build *"quietly reintroduces a human loop"*. |

### 1.2 Decision

> **D1. Launch on a 14-day free trial, no credit card, for the first 100 signups. The $149 First
> State Audit and the "we build your roster" promise are DEFERRED to iteration 2 and are gated on a
> register-ingestion feasibility spike. The Entry Pack one-offs ($750 first state / $1,500 / $3,750
> bundle) ship unchanged from day one. `THRESHOLDS.md` H2 stands as written and is not re-banded;
> H2b stays registered and out of force.**

Three lines of reasoning, in the order that decided it:

1. **The no-human-loop constraint is dispositive.** `PLAN.md`'s Goal sentence forbids a human loop
   inside the product; `UX.md` C2 restates it as a build constraint. The tripwire's deliverable is a
   built, verified roster within 5–10 days (`OFFER.md` §8 step 2, `THRESHOLDS.md` H2b watch metric).
   Nothing in the fleet's output shows that can be automated: there is **no spec**, **no backlog
   Must**, **no register-ingestion research**, and the nearest artefact — `BACKLOG.md` S2, *"scrape
   the public licence search"* — is a **SHOULD** triggered by a support ticket. `OFFER.md` §13
   weakness 3 and `offer/CLAUDE.md` A1 both say the founder must see feasibility *before this ships*.
   Taking $149 against an obligation only a human can currently discharge is the exact failure the
   constraint exists to prevent.
2. **Activation measurement collapses under the tripwire, and the replacement band has nothing
   behind it.** `THRESHOLDS.md` states it plainly: under the audit model payment precedes activation,
   so T2 → 1 by construction. H2b's ≥ 40% band is a judgment with no comparator, and its own watch
   metric ("audit → delivered calendar in ≤ 5 business days") is precisely the SLA we cannot meet
   without the automation in (1). The trial keeps T1 and T2 meaning what `specs/13` computes, at
   n = 100, with no re-derivation — which is the entire point of pre-committing.
3. **The founder's revenue goal is not served by the tripwire and is not harmed by the trial.**
   The fastest revenue in the plan is the Entry Pack, and it is *independent of this decision* —
   `PERSONA.md` §1 rank 3 and `OFFER.md` §2 both say the one-off is the front door because its
   time-to-value is days. $149 × N against an unautomated deliverable and a "30 days or you don't
   pay" guarantee is negative revenue; $750 × N for a document assembled from the KB is positive
   revenue on day one. The trial costs 14 days of subscription cash and buys a clean measurement,
   zero owed deliverables and zero liability.

**Tie-break applied** (per my failure rule): where two documents disagree and neither is clearly
right, take the option that reduces founder liability and keeps the product free of a human loop.
Both criteria point the same way here, and the product owner's own recommendation agrees.

### 1.3 Exactly which files change

| file | change |
|---|---|
| `OFFER.md` | §7 — mark rung 2 (**First State Audit $149**) `DEFERRED — iteration 2, gated on register-ingestion spike`. §8 — replace with the 14-day no-card trial and keep the audit as the named next iteration (the current §8 escape hatch becomes the plan). §5.1.2 — **suspend the Rollout Guarantee**; it belongs to the deferred roster build. §12 — remove line 7 (`STRIPE_PRICE_FIRST_STATE_AUDIT`) from the launch Stripe list; no `trial_period_days` change is needed because a no-card trial is app-managed (`specs/09` `subscriptions.plan = "trial"`), not Stripe-managed. §13 weakness 3 — restate as the gate it now is. |
| `LANDING_SPEC.md` | §0 — the goal becomes *start the free trial*. §2.1 wireframe, §2.4, §5, §13 — CTA becomes a trial CTA, repeated unvaried three times; **delete the microcopy** *"We build the roster from the public registers. 30 days or you don't pay."* §8/§13 — guarantee strip drops to two lines (see D3). §1 — re-count the hero row after the edit. §12.2 last bullet — the gate is now the trial, not the roster. |
| `specs/09` | Replace §"The open disagreement" with D1 as a decision. Align the trial emails with `UX.md` E16 (see m7). Remove `STRIPE_PRICE_FIRST_STATE_AUDIT` and `one_off_purchases.kind = "first_state_audit"` from the launch cut (keep the enum value; ship it dormant). |
| `THRESHOLDS.md` | §3 T2 — mark the H2b table `NOT IN FORCE (D1, wave-1b review)`. §7 — add a changelog row: date, D1, prompted by the wave-1b review, decided by the reviewer. §8 — H2b status → `registered, not in force`. |
| `BACKLOG.md` | M9 — *"trial or paid tripwire"* → *"14-day no-card trial"*. Add **M15 — no-login State Rulebook demo** (see D2). |
| `PERSONA.md` | §9 — replace the ⚠ open-conflict box with the resolution and the pointer to this file. |
| `UX.md` | §1 — replace the unresolved note with D1. E16 stays. S02 stays a SHOULD (D2). |
| `specs/01` | No change: *"Start free trial"* is now correct. |

---

## 2. Findings

Severity: **BLOCKING** = wave 2 cannot build it as written, or the founder is exposed.
**MAJOR** = will produce rework, a wrong number, or a broken promise.
**MINOR** = correctness and hygiene.
Owner: **identity** (Buyer & Identity / Brand Director) · **product** (Product Owner) · **offer** (Offer & Landing).

### 2.1 Blocking

| id | file · section | finding | evidence | required change | owner |
|---|---|---|---|---|---|
| **B1** | `PERSONA.md` §9 · `OFFER.md` §8 · `THRESHOLDS.md` §3 · `specs/09` · `LANDING_SPEC.md` §0 | Six documents carry three different answers to "how does a stranger start". Every downstream surface (CTA, Stripe list, T2 band, spec 01 copy) branches on it. | §1.1 above | Apply **D1** and the file list in §1.3. | offer + product |
| **B2** | `kb-data/` (all 9) vs `OFFER.md` §3/§6.1 · `LANDING_SPEC.md` §2.3/§4 (V4) · `IDENTITY.md` §0 title | **Bond and timeline data do not exist.** 48 of 50 `bond.*` fields across the nine records are `status: unknown`; the only two verified are `nc.electrical bond.required = true` — **there is not one bond amount in the knowledge base.** `typical_timeline` is `unknown` in 7 of 9 records and only partial in the two NC ones. All three Florida records have `application_fee` unknown. Yet the product is named *"licence, CE, **bond and insurance** readiness"*, the hero subhead sells *"bond and insurance certificate"*, `OFFER.md` §6.1 items 4–6 promise *"bond amounts, insurance minimums and the acceptable forms"*, *"fees, line by line"* and *"the filing sequence with realistic elapsed times"*, and V4 promises a step card reading *"Bond amount + acceptable forms"*. | counted with `walk_sourced_values` over `kb-data/*.json`: bond `{unknown: 48, verified: 2}`; insurance `{verified: 24, unknown: 17}` | Either **(a)** remove bond and timeline from the Entry Pack contents list, the subhead and V4 until the fields are verified, or **(b)** verify them before the first pack is sold. Do not ship a $750–1,500 document that puts four of its eight advertised sections in the needs-human-check block — that is the Entry Pack Guarantee triggering on our own data. Add a **completeness gate** to `specs/08`: a state × trade is purchasable only when a named core set (application fee, renewal fee, cycle, CE hours, bond, insurance, timeline) is verified — `publishable` measures pass-B agreement, not completeness, and the two are being conflated. | product + offer |
| **B3** | `OFFER.md` §2/§3/§5.1.2/§8 · `LANDING_SPEC.md` §2.4/§6/§13 vs `BACKLOG.md` · `specs/` | **The done-for-you roster build has no spec and no backlog item.** It is the offer's single largest lever (Effort 4→8), the Rollout Guarantee, the landing page's CTA microcopy and step 2 of "How it works" — and it appears in the product track only as `specs/09`'s warning that it *"must be automated from the public registers or it does not scale"* and `BACKLOG.md` S2, a SHOULD. | `grep -rn "public register\|licence search\|scrape" specs/ BACKLOG.md` returns exactly two lines, neither a Must | Deferred by **D1**. Before it is un-deferred: a **register-ingestion feasibility spike** (2 dev-days) over the 15 launch states, producing a per-state verdict (searchable register? machine-readable? rate-limited? bot-walled?), then a spec and a Must. Until that spike passes, no surface may say "we build the roster". | offer + product |
| **B4** | `OFFER.md` §5.3 (Alert Guarantee) | *"If a licence tracked in your account lapses and we did not send you the 90-, 60-, 30- and 7-day alerts, we refund every month you have paid us, up to twelve."* **As worded it pays out on at least five behaviours we design or the customer causes:** (1) `specs/06` edge case — a licence added 20 days before expiry *never gets* the 90/60/30 alerts, by design, recorded as `suppressed`; (2) a user mutes that state (`specs/06` `mutedStates`); (3) a user pauses notifications (`specs/06` `paused`, `specs/10`); (4) the recipient's address bounced and is suppressed; (5) trial end / `past_due` puts alerts in a paused state (`specs/09` AC2, AC5). Cap is 12 months of fees = **$1,788–$7,188 per claim**. | `specs/06` §Edge cases, §Validation; `specs/09` AC2/AC5 | Re-word with explicit carve-outs, or do not ship it. Minimum: *"…where the licence was in your account at least 100 days before its expiry, alerts for it were not muted or paused, and at least one recipient address was deliverable."* Cap at the lesser of 12 months or the fees paid, claims within 30 days of the lapse. Then counsel. **Do not ship it at launch** (see D3). | offer |
| **B5** | `specs/08` §Guarantee · `specs/12` §Refund policy vs `OFFER.md` §5.1.3 | Three different wordings of the same guarantee, and the two in the specs are the dangerous one. `specs/08` and `specs/12`: *"full refund if a licensing board **tells you** something in the document is wrong"* — an **oral, unverifiable** adjudication standard over the **whole document**. `OFFER.md` §5.1.3: *"if your State Entry Pack **omits a requirement that the state's own board publishes on the day we deliver it**"* — written, checkable, bounded. | the three sections as quoted | Adopt the `OFFER.md` §5.1.3 wording verbatim in `specs/08` and `specs/12`. Add: claims within **90 days** of delivery; remedy = rewrite **plus** refund of the fee paid; liability capped at the fee. `specs/12` currently promises refund in 3 business days and correction in 5, while `OFFER.md` §5.1.1 promises correction in **1** business day — reconcile to 5 (see m13). | offer + product |
| **B6** | `specs/05` §Validation invariant 2 vs §Acceptance criterion 7 | **The spec contradicts itself and the build cannot satisfy both.** Invariant 2: *"`confidence = low` **or** a KB value with `status != verified` sets `needsHumanCheck = true`"*. AC7: *"TX plumbing anything → deadline emitted with `needsHumanCheck = true`, **because the annual cycle is recorded at medium confidence**"*. Texas plumbing's renewal cycle is `status: verified`, `confidence: medium` — the invariant does not fire. | `kb-data/tx-plumbing.json` `licence_types[*].renewal.cycle` = `{value: 12, status: "verified", confidence: "medium"}` | Change invariant 2 to `confidence != "high" OR status != "verified"`. This is the single highest-consequence one-line fix in the specs: it is what stops a medium-confidence inference reaching a customer as a confident date. | product |
| **B7** | `specs/07` §Screens/§Validation vs `IDENTITY.md` §7.1/§7.2 · `UX.md` §8 | The dashboard spec describes a **different component** from the one the identity mandates and the design system implements. `specs/07`: *"US map, launch-15 states outlined"*, statuses *"green ok / amber ≤ 60 days / red ≤ 7 days or lapsed / grey not covered"*, constants `RED ≤ 7`, `AMBER ≤ 60`. `IDENTITY.md`: a **tile grid of 50 states + DC**, statuses **READY / AT RISK / LAPSED / NOT TRACKED**, colour never alone, non-operating states drawn hollow-dashed. Three status vocabularies now exist across the fleet (identity's four words, `samples.html`'s sentence-case five, `specs/07`'s colour names). And the thresholds disagree with the alerts: the map is still **green** at 89 days while the 90-day alert has already been sent. | `specs/07` vs `IDENTITY.md` §7.1–§7.2, `design-system.css` §10, `identity/samples.html` (51 tiles) | Rewrite `specs/07`'s map section against `IDENTITY.md` §7.1/§7.2 and `design-system.css` `.sr-map`. Adopt **D7**: `AT RISK ≤ 90` so the map and the first alert gate never disagree; keep LAPSED for past-expiry; NOT TRACKED for uncovered; hollow-dashed for not-operating, with its own accessible name. One status vocabulary, all caps, everywhere. | product + identity |
| **B8** | `IDENTITY.md` §6.1/§6.2/§6.3/§8.1/§8.3/§10 · `LANDING_SPEC.md` §4/§4.1/§9 · `UX.md` S17 vs `design-system.css` | **The identity documents no longer describe their own implementation.** `design-system.css` (and `samples.html`, and `contrast.py`) have been rewritten to a **dark-first "board / paper"** system: `:root { color-scheme: dark }`, ground `#181D1A`, light theme `#E9ECE8`, token `--sr-ground` **replacing `--sr-paper`**, typefaces **Barlow / Barlow Condensed / Overpass Mono**, `--sr-shadow-1/2: none`, `--sr-shadow-3: 0 12px 32px`. `IDENTITY.md` still documents warm paper `#FAF8F4`, ink `#16130F`, **Public Sans + IBM Plex Mono**, `0 1px 2px` card shadows and *"Light is the default"*. Its §6.3 contrast table (70 pairs, smallest text margin 5.58:1) is stale — the script now reports a **4.89:1** smallest text margin against different hexes. `--sr-paper` is cited in `IDENTITY.md` and `LANDING_SPEC.md` (V1: *"drawn in `--sr-paper`"*) and **no longer exists in the CSS**. The CSS header cites **`IDENTITY_ARBITRATION.md`**, which is **not in the repository**. | `sed -n '/^:root/,/^}/p' design-system.css`; `python3 identity/contrast.py`; `grep -- "--sr-paper" design-system.css` → 0 hits | **Not my decision to make** — typography and ground are with the Brand Director. What must happen before wave 2 reads `IDENTITY.md`: publish `IDENTITY_ARBITRATION.md`; rewrite `IDENTITY.md` §6.1, §6.2, §6.3, §8.1, §8.3, §8.4 (the logo is described as a `--sr-ready` rounded square), §10 and §11 against the shipped CSS; update the token names in `LANDING_SPEC.md` §4 (V1, V2, V3) and §4.1 and `UX.md` S17 (`board/paper`, not `light/dark/system`). Until then **the CSS, not `IDENTITY.md`, is the source of truth** and the build must be told so. | identity |
| **B9** | `specs/06` §Flow · `../PLAN.md` A12 · `../PREREQUISITES.md` P1 | The alert drain is specified as **hourly** with a per-organisation 07:00–09:00 local window. **Vercel Hobby permits one cron invocation per day**, and P1 (Pro) is still `todo` and is framed as a *pre-charging* prerequisite, not a *pre-build* one. On Hobby the schedule is silently coerced and the local-morning window becomes fiction — for an alerting product, a silently degraded schedule is the worst possible failure. | `specs/06` step 1; `PREREQUISITES.md` P1 | Adopt **D8**: make **P1 a wave-2 prerequisite**, not a launch one, and run hourly. If Pro is not in place when M6 is built, ship a single daily drain at **13:00 UTC** (08:00 ET / 06:00 MT / 05:00 PT), make `organisationSettings.digestHourLocal` display-only, and state the limitation in the help article. Add a boot assertion that fails the build if the configured cron expression is sub-daily on a Hobby project. | product |
| **B10** | `specs/06` §Data model vs §Acceptance criterion 5 | **Multi-recipient digests are unimplementable as modelled.** `alerts` carries `unique(deadlineId, offsetDays)` and a single `digestId`; `digests` carries one `recipientUserId`. AC5 requires that when one recipient bounces, *"the organisation's other recipients still receive theirs"*, and `specs/10` exposes org-level *"recipients"* plus a per-user CC. With two recipients there can only ever be one alert row and one digest. | `specs/06` data model vs AC5; `specs/10` `/settings/notifications` | Change the constraint to `unique(deadlineId, offsetDays, recipientUserId)` and move `digestId` to a join, or model `alerts` per deadline and `digest_items` per (digest, alert). Whichever: the anti-duplicate guarantee must be per recipient, and the spec must say so. | product |
| **B11** | `specs/14` §Flow/§AC6 vs `kb-scripts/refresh_sources.py` + `validate.py` G10 | **The drift queue cries wolf forever.** Resolving an item as `no_change` *"closes it without touching any record"* (AC6) — but the baseline in `kb-data/_sources.json` still holds the old hash, and the daily cron re-detects the same drift tomorrow, and every day after. Most items will be this class (the spec says so). Conversely, rewriting the baseline (`--write-baseline`) forces **every record citing that source** to have its `provenance.sources[].content_sha256` rewritten too, or gate **G10** fails the build. | `refresh_sources.py` compares against `_sources.json` only; `validate.py` G10 asserts record hashes == baseline hashes; verified by tampering one baseline hash → `drifted 1`, exit 1 | Give `no_change` a real effect: resolving as `no_change` must write the new hash to the baseline **and** to every citing record's provenance, in one reviewed commit. Add a `kb-scripts` command for it (`accept_drift.py --source-id ...`) so it is one action, not a hand-edit across nine files. Without this, `/admin/kb` is abandoned in week one — which `specs/14` itself predicts about a different failure. | product |

### 2.2 Major

| id | file · section | finding | required change | owner |
|---|---|---|---|---|
| **M1** | `UX.md` §4/§5 vs `BACKLOG.md` §1 | **Five screens that `PERSONA.md` and `IDENTITY.md` treat as load-bearing have no Must and no spec:** S02 free lapse-risk audit (SHOULD, S8), S13 CE tracking screen (only partially inside specs 04/05), S14 calendar + `.ics` (SHOULD, S3), S15 **qualifier watch**, S18 technician licence card, S19 shared readiness link. The qualifier clock is `IDENTITY.md` §2 **UA3 — one of the three attributes no alternative has** — and `PERSONA.md` J6; the shared readiness link is J5, which `IDENTITY.md` §11 self-certifies as served. `specs/05` models `qualifier_replacement` as a deadline `kind` and nothing renders it. | Decide each explicitly in `BACKLOG.md` rather than leaving them stranded between two documents. My recommendation: **promote S15 (qualifier watch) and S19 (shared readiness link) to Must** — they are the differentiator and the distribution mechanism respectively, and both are small on top of M5/M7; leave S02, S13, S14, S18 as SHOULD with named triggers; then `UX.md` §9 must list what is *not* being built. | product + identity |
| **M2** | `BACKLOG.md` §1 effort | **The landing page and the no-login demo are not in the backlog and not in the 34 dev-days.** `PLAN.md` §4 lists the landing page as a per-app deliverable and `LANDING_SPEC.md` specifies a server-rendered, KB-reading, deep-linkable demo with its own performance budget. Neither has an M id. | Add **M15 — marketing route + no-login State Rulebook demo (M, ~3 dev-days)**; it depends on M14 and is the free entry point under D2. Re-state the total (~37 dev-days). | product |
| **M3** | `OFFER.md` §7 rung 1 · `UX.md` S02 · `specs/09` | **Three different free things** are specified: the free *State Rulebook lookup* (offer), the free *lapse-risk roster audit* (UX), and the free *14-day trial* (spec 09 / persona). Nobody has said which one a stranger meets. | Adopt **D2**: the **no-login State Rulebook demo is the single free entry point**; the roster audit stays a SHOULD. | offer + product |
| **M4** | `specs/05` §Analytics vs `specs/04`/`specs/13`/`THRESHOLDS.md` §1 | **Two event names for the activation event.** `specs/04` emits `licence_deadline_derived` (*"the activation event"*); `specs/05` — which owns derivation, including the batch and nightly-cron paths — emits `deadline_derived`. `THRESHOLDS.md` T1 and `specs/13` count `licence_deadline_derived`. Activation will silently under-count every derivation that does not come through the licence-create path (import, profile change, KB publish). Same problem, smaller: `deadline_explained` (spec 05) vs `why_this_date_opened` (spec 11). | One name each. `licence_deadline_derived` emitted from the derivation service, not from the create path; `why_this_date_opened` deleted in favour of `deadline_explained`. `specs/13`'s event-parity test then means something. | product |
| **M5** | `specs/13` §Screens | The worked example renders *"activation 47% — inside the persevere band (**≥ 40%**)"*. `THRESHOLDS.md` T1 persevere is **≥ 45%**. A copied band in a spec is how a threshold quietly moves. | Delete the number from the example; the page must read every band from the generated `thresholds.json`, which `specs/13` already specifies. | product |
| **M6** | `OFFER.md` §12 vs `specs/09` §Stripe list | Three divergences in the hand-over the founder will actually type into Stripe: env var `STRIPE_PRICE_MULTI_MONTHLY/_ANNUAL` (offer) vs `STRIPE_PRICE_MULTISTATE_MONTHLY/_ANNUAL` (spec 09); the **$1,000 "Additional State — Entry Pack"** price (offer line 11) is absent from the spec's list; the credit mechanism is *"needs a decision from the founder … customer balance credit is the simplest"* (offer) vs *"implemented as a Stripe coupon applied at Checkout"* (specs 08 and 09, stated as settled). | One list, in `specs/09`, referenced by `OFFER.md`. Pick `STRIPE_PRICE_MULTISTATE_*`. Add the $1,000 add-on. State the credit mechanism as a founder question (Q11) rather than asserting it in two places. | offer + product |
| **M7** | `OFFER.md` §7 rung 2 + §6.3 | **Double-credit ambiguity.** The $149 audit credits against an annual plan within 90 days, and the $750 first Entry Pack credits against an annual plan within 90 days. Nothing says whether both can be claimed — $899 off a $3,490 plan. `specs/09`'s coupon mechanism has no rule for stacking. | Moot at launch under D1 (the audit is deferred), but write the rule now: **one credit per customer, whichever is larger**, enforced in the app (`once_per_customer` is already app-enforced for the $750 price). | offer |
| **M8** | `OFFER.md` §7 · `phase-3-acquisition/prospects/stateready/README.md` | **The tier ceiling excludes most of the target list.** Of the twenty highest-fit end-customer accounts, at least twelve operate in more than 15 states (Apex 46, Pye-Barker 47, BluSky 40+, Tecta 37, Authority Brands 31, ARS ~28, TurnPoint 28, ATI 25, Vertex 22, Legacy 19, PremiStar 17, Service Logic 140+ locations). They exceed the **Platform** cap on day one and land in **Enterprise**, which has no Stripe price and no self-serve path. `OFFER.md` §13 weakness 4 concedes this and nothing acts on it. | Adopt **D4**: the launch ICP is `PERSONA.md` buyer 1 (15–100 technicians, 2–6 states). `outbound/stateready/workbook.csv` must be sortable by state count and the first batches must be the accounts **inside 15 states** (Sila 13, Heartland 9, Any Hour 10, Wrench ~15). The 40-state platforms are a wave-3 Entry-Pack motion, not a subscription motion. Record it in `BACKLOG.md` §0 so the outbound fleet inherits it. | offer + product |
| **M9** | `KNOWLEDGE_BASE.md` §14 Q1 | The founder question that decides the whole roadmap mis-states its own evidence: *"the phase-3 prospect file's twenty highest-fit accounts are **dominated by** roofing, fire protection and restoration platforms"*. Counted from that file: **5 of 20** are in uncovered trades (Vertex, Pye-Barker, Tecta, BluSky, ATI; Astra is mixed). Fourteen to fifteen are HVAC / plumbing / electrical. | Correct the sentence, then adopt **D5** (states first). | product |
| **M10** | `KNOWLEDGE_BASE.md` §5 · `kb-scripts/verify_pass_b.py` | **Pass B is a citation check, not a semantic check, and the document over-claims it.** §5 says pass B *"catches transcription errors, cross-source attribution errors, invented values"*. It asserts only that the `evidence` string is still present at `source_url`. A value attached to the wrong field, or an inference the page does not state, passes. Live example in the data: `tx.hvac licence_types[0].exam.fee = $74` — the fragment *"pay the examination fee of $74"* is genuinely on the renewal page, in the **Class B → Class A upgrade** paragraph (I fetched it and read the surrounding 600 characters); the record generalises it to the Class A exam fee. The record's note is honest and confidence is medium, so this is not a defect — but it shows what pass B cannot see. | Re-word §5 to say what pass B proves: *the quoted fragment is still literally present at the cited URL*. That is a strong claim; do not let it stand in for *the reading is correct*. This matters because the **Accuracy Guarantee is adjudicated on the reading, not on the fragment** — a customer who says "that $74 isn't the application exam fee" has a valid claim that pass B would never have flagged. | product |
| **M11** | `ontology/schema.sourced_value.json` · `kb-data/tx-plumbing.json` | `status` and `confidence` are conflated where it reaches the customer. Texas plumbing's annual renewal cycle is an **inference the board never prints** (`KNOWLEDGE_BASE.md` §10 assumption 1, `product/CLAUDE.md`), yet it is stored `status: "verified"`. The schema defines `verified` as *"at least two verification passes agreed at the source"*, which is not what happened. The UNVERIFIED badge logic keys on `status`, so an inference renders as verified. | Either add a `status` of `inferred`, or make `confidence: medium` on a `verified` value force the same treatment as `unverified` throughout (this is B6's fix seen from the data side). Do not leave the app's honesty depending on which of two fields a component happens to read. | product |
| **M12** | `specs/12` §Disclaimer | The legal page states an **operational cadence as fact**: *"We check every source for changes daily and re-verify every value in full every month."* `specs/14` itself contemplates the cron failing, and B11 shows the queue will be noisy from day one. A cadence claim on a legal page is the kind of statement a state UDAP action is made of. | Move the cadence to the methodology page as a stated **target**, and put on the legal page only what is structurally true: *"every value shows the page it came from and the date we last checked it"*, plus the live `last_verified` age from `/coverage`. | product |
| **M13** | `specs/05` §Renewal rules · `kb-data/fl-*.json` | **The engine has no representation for a board-announced date roll, and the record's own source page already contains one.** `www2.myfloridalicense.com/construction-industry/`, fetched today, reads: *"Registered Contractors — Licenses expire August 31st every odd year. **However, because the 31st falls on a Sunday this year, and September 1st is a holiday, the deadline has been extended to September 2nd.**"* `fixed_date_parity:08-31:odd` derives 31 August. For that cycle the derived deadline is wrong by two days in the customer's favour — but the mechanism will eventually be wrong in the other direction. | Add an `expiry_overrides` list to the record schema (`{cycle_year, date, source_url, evidence}`) and a rule in `specs/05` that an override wins over the token, with the citation shown. Add it to gate **G8**. This is also the single best worked example for the rule-change alert (J8). | product |
| **M14** | `UX.md` S02 · `PIPELINE.md` standing rule 1 | The free audit accepts **a pasted roster of technician names and licence numbers with no account and no consent screen**. That is private-individual data arriving on a marketing surface. `UX.md` mitigates with *"nothing stored until the last one"*, but the parse and the exception list are server-side work on that data. | Under D2 the audit is deferred, which removes the exposure at launch. When it is built: parse in the browser, never persist, show the privacy notice **above** the paste box, and add the flow to `/legal/privacy` explicitly. | identity + product |
| **M15** | `specs/08` §Test plan | *"The first ten playbooks generated in production are read by the founder before delivery"* is a **human in the delivery path** of a paid, same-day product, against `PLAN.md`'s Goal and `UX.md` C2, and against `UX.md` S16c's *"target under two minutes"*. A buyer who pays $750 at 22:00 on a Friday waits for the founder. | Keep the review, move it **behind** delivery: deliver immediately, founder reads the first ten within 24 hours, and any correction triggers the guarantee proactively. Say so on the purchase screen. | product |
| **M16** | `specs/14` §Screens vs `kb-data/_sources.json` | `/admin/kb/:id` requires *"old vs new normalised text, word-level diff"*. `_sources.json` stores only `content_sha256`, `bytes` and `normalised_chars` — **the previous text is not retained anywhere the runtime can reach** (`research/raw/` holds one-off gzipped captures from 2026-09-03, not a rolling store). | Store the normalised text (or a bounded head/tail) alongside the baseline hash, or the diff screen cannot be built. ~200 KB per source × 35 is trivial; do it at `--write-baseline` time. | product |
| **M17** | `ontology/id-grammar.md` §Versioning | *"The old `SourcedValue` is retained in `kb-data/_history/{record_id}.jsonl`"*. **There is no `_history/` directory and no code that writes one.** The promise it supports — *"a customer who renewed in March under a $65 fee and is billed $80 in April will ask us why"* — is the whole provenance story and is currently unimplemented. | Implement it in the drift-acceptance command from B11 (one append per changed value), or delete the paragraph. Do not leave an unimplemented promise inside the ontology. | product |
| **M18** | `LANDING_SPEC.md` §4/§13 | The page's most persuasive section quotes **California CSLB**, **NYC DOB** and **Cal. B&P §7031**. Neither California nor New York is covered at launch, and the demo directly beneath will answer *"Not covered yet"* for both. A prospect who follows the argument to the demo meets a refusal. | Keep the quotes (they are the best sourced consequences we have and they are about the category, not our coverage) but add one line of context and move at least one covered-state consequence into the section — Texas's *"You may not engage in air conditioning and refrigeration contracting if your license has expired"* is on the TDLR renewal page and is verified in `kb-data/tx-hvac.json`. Re-count §1. | offer |
| **M19** | `LANDING_SPEC.md` §12.1 wireframe vs `kb-data/tx-hvac.json` | The demo's default is **Texas × HVAC** and the wireframe shows a `Bond / insurance [from KB]` row. `tx.hvac` has `bond.required` and `bond.amount` `unknown`, and two of three insurance fields unknown. The flagship demo will render *"not yet verified for this state"* in that row, on load, above the fold. | Correct behaviour, wrong expectation. Either drop the bond row from the default view and keep licence classes / renewal cycle / CE (all verified), or keep it and write the copy that makes the refusal a proof point. Do not let the build discover this. | offer + product |

### 2.3 Minor

| id | file · section | finding | required change |
|---|---|---|---|
| m1 | `BACKLOG.md` §0 | *"5–100-technician"* vs `PERSONA.md` §1 / `OFFER.md` §1 *"15–100"*. | Adopt 15–100. |
| m2 | `specs/08` §Pricing | Cites *"`OFFER.md` §7.1"*; Entry Pack pricing is §6.3, the ladder is §7. | Fix the cross-reference. |
| m3 | `ontology/schema.*.json` | `$id: https://stateready.app/ontology/…`. `IDENTITY.md` §1.2 records `stateready.app` as **NXDOMAIN**. The schema asserts a domain we do not own, inside committed data. | Use a repo-relative `$id` or the domain the founder actually registers (P11). |
| m4 | `ontology/schema.sourced_value.json` | `source_url` / `last_verified` / `verified_by` are required **only** when `status = "verified"`; `verified_by` has `minItems: 0`; the `note` description says it is *"mandatory when value is null **or status is not verified**"* but the `allOf` enforces it only for null. Today there are zero `unverified` values so nothing is exposed — but `KNOWLEDGE_BASE.md` §5.1's demotion path creates exactly that class. | Add an `if status != verified then required: [note]` branch; set `verified_by.minItems: 2` under the verified branch (gate **G1** already enforces it — mirror it in the schema so the schema is not weaker than the gate). |
| m5 | `kb-scripts/validate.py` G3 | G3 requires a note only for **non-verified** numerics. `tx-plumbing` licence types [1] and [2] carry `renewal.cycle = 12, confidence: medium` with `note: null`; only [0] explains the inference. The customer-facing "what we read and why" text is missing for two of three Texas plumbing licence types. | Extend G3: any numeric below `confidence: high` requires a note. |
| m6 | `identity/samples.html` | Status words are sentence-case (*"At risk"*, *"Not tracked"*) against `IDENTITY.md` §6.1's mandated **READY / AT RISK / LAPSED / NOT TRACKED**; a **fifth** state, *"Not operating"*, appears in tile accessible names and in no document; those names duplicate themselves (*"AK — Not operating. Not operating"*). | One vocabulary; document the fifth state (B7); fix the duplicate in `identity/build-samples.py`. |
| m7 | `UX.md` E16 vs `specs/09` §Flow | Trial emails at **day 11 and 14** (UX) vs **day 7 and 12**, read-only at 14 (spec 09). | Adopt spec 09's cadence; UX E16 becomes two rows. |
| m8 | `UX.md` E14 vs `OFFER.md` §4 | The weekly *"Renewal-week brief"* is a **bonus on all paid plans** in the offer and **opt-in, off by default** in the UX. A bonus nobody receives is not a bonus. | On by default for paid plans; off for trial. |
| m9 | `LANDING_SPEC.md` §1/§13 | I re-counted the deck: **398 words, section by section exactly as claimed**. But §2.4 repeats the CTA *"after the proof block"*, inside the counted region, and the deck does not count it: the CI rule (DOM between `#hero` and `#pricing`) will measure **403**. Still under 450. | Add the repeat to the §1 table so the CI number and the deck agree. |
| m10 | `offer/CLAUDE.md` | Records the copy count as **386 words**; the shipped deck is 398. | Update the memory. |
| m11 | `ontology/id-grammar.md` | Source-id example `tx.tdlr.acr_contractor_apply`; the actual id is `tx.tdlr.acr_apply`. | Use a real id. |
| m12 | `specs/12` §Refund policy | The **Alert Guarantee** does not appear in the refund policy at all, while the playbook guarantee does. | Under D3 it is not shipped; if it ever is, it belongs here. |
| m13 | `OFFER.md` §5.1.1 vs `specs/12` | Correction SLA **1 business day** (offer) vs **5 business days** (spec 12, and `specs/08`). | Reconcile to 5 business days everywhere; 1 business day is a single-founder SLA with no cover. |
| m14 | `specs/02` `/onboarding/states` | *"US map plus a searchable list"* — the identity mandates the tile grid, and the tile grid is what `design-system.css` implements. | Say tile grid. |
| m15 | `kb-scripts/validate.py` G13 vs `specs/12` | G13 warns at **400 days**; the disclaimer claims monthly re-verification; there is no hard cut-off at which a value stops rendering as verified. | Founder question Q7 below; default 180 days → render as unverified. |
| m16 | `kb-data/tx-hvac.json` `licence_types[0].exam.fee` | $74 is drawn from the Class B → Class A upgrade paragraph (see M10). The note is honest; confidence is medium. | No change to the data. Ensure the playbook and the demo render the note, not just the number. |

---

## 3. Cross-document decisions

Each is a ruling the build fleet may act on without asking. One sentence of rationale each.

| # | decision | rationale |
|---|---|---|
| **D1** | **14-day free trial, no card, first 100 signups. $149 First State Audit and the roster-build promise deferred to iteration 2, gated on a register-ingestion spike. Entry Packs ship unchanged. H2 stands; H2b out of force.** | The tripwire owes a deliverable only a human can currently produce, which breaks `PLAN.md`'s founding constraint and collapses the measurement `THRESHOLDS.md` exists to protect — and the fast revenue is the Entry Pack, which this decision does not touch. |
| **D2** | **The no-login State Rulebook demo is the single free entry point** and becomes Must **M15**. The free roster audit (`UX.md` S02) stays a SHOULD. | One free thing, no private-individual data before an account exists, and the demo is already load-bearing for the landing page and for programmatic SEO. |
| **D3** | **Ship two guarantees, in `OFFER.md` §5.1 wording only:** the Accuracy Guarantee (correction within **5** business days, one month's credit, max one credit per customer per month) and the Entry Pack Guarantee (`OFFER.md` §5.1.3 wording, claims within 90 days, liability capped at the fee). **Do not ship** the Rollout Guarantee (it belongs to the deferred roster build) or the Alert Guarantee (until B4's carve-outs and counsel). **Never** the reinstatement-fee guarantee. | Guarantee only what our own logs can adjudicate, cap every one, and never let a guarantee trigger on behaviour the product itself designs. |
| **D4** | **Launch ICP is the 15–100-technician, 2–6-state contractor.** The 40-state platforms in the phase-3 top-20 are a wave-3 Entry-Pack motion, not a self-serve subscription motion; the outbound workbook must sort by state count and lead with accounts inside 15 states. | Twelve of the twenty highest-fit accounts exceed the Platform cap on day one and land in a tier with no price — selling to them self-serve is not possible and pretending otherwise wastes the first outbound batch. |
| **D5** | **Widen states before trades**, in `KNOWLEDGE_BASE.md` §11.1's order (GA, OH, AZ, MI → VA, NJ, CO, MA → CA → NY, PA, IL). Trades re-open only when a named prospect is blocked by a trade. | The phase-3 top-20 is 14–15 covered-trade accounts against 5 uncovered-trade ones (M9); roofing is state **and** county — a different data model, not a bigger one (`BACKLOG.md` L2) — while a new state is the same model and the same tooling; and H7 already bets activation on covered-state count. |
| **D6** | **The critical path `M14 → M5 → M6` is right. The spec headers are wrong:** `specs/04` says it blocks M5 and `specs/05` says it blocks M4 — a circular dependency. Build **M5 first as a pure function with golden tests over `kb-data/`**, no database; then M4, which calls it; the `deadlines` table lands with M5. | `specs/05` is explicitly pure and synchronous, so it is the one module that can be built and proved before any schema exists — which is exactly what you want on a critical path. |
| **D7** | **The map is the tile grid** (`IDENTITY.md` §7.1, `design-system.css` `.sr-map`, 51 tiles). One status vocabulary — **READY / AT RISK / LAPSED / NOT TRACKED** — plus hollow-dashed *not operating*. **AT RISK = within 90 days**, not 60. | The map and the first alert gate must never disagree; a screen that is still green on the day we email "expires in 90 days" destroys the trust the whole product is sold on. |
| **D8** | **Vercel Pro (P1) becomes a wave-2 prerequisite**, and the drain runs hourly. Fallback if Pro is late: one daily drain at **13:00 UTC**, `digestHourLocal` display-only, limitation stated in help. | An alerting product whose cron is silently coerced from hourly to daily is worse than no alerting product, and the failure is invisible until a customer's licence lapses. |
| **D9** | **Typography, ground and theme model are NOT decided here** — they are with the Brand Director (`IDENTITY_ARBITRATION.md`, cited by `design-system.css` and not yet in the repo). Until that file lands and `IDENTITY.md` is rewritten, **`design-system.css` is the source of truth for tokens and the identity documents are not.** The name stays **StateReady**, with the USPTO knock-out search (P11) as a hard pre-spend gate. | The arbitration has already changed the implementation; leaving three documents describing the superseded system is a guaranteed source of wave-2 rework. |

---

## 4. Knowledge-base integrity

**Overall: this is the best-evidenced artefact in the fleet. It passed every check. Its problems are
of coverage and of claim, not of correctness.**

### 4.1 Value spot-check — 5 of 5 correct, plus 1 context finding

Fetched live from the cited URL with `lib_kb.fetch` (two attempts, 1.5 s spacing); fragment matched
after normalisation; then ~600 characters of surrounding context read for the risky ones.

| # | value | record | result |
|---|---|---|---|
| 1 | TX ACR CE **8 hours**, *"including one hour of instruction in Texas state law and rules"* | `tx.hvac` | **FOUND**, correctly attributed. This is the number on the landing page and in the outbound email. |
| 2 | TX electrician CE **4 hours**; TX electrical **contractors not required** | `tx.electrical` | **FOUND**, both fragments. The 8-vs-4 divergence card is real. |
| 3 | TX ACR late renewal **×1.5 / ×2 / ×2 + executive-director approval** | `tx.hvac` | **FOUND**, and the surrounding paragraph confirms all three bands and their day ranges exactly as recorded. |
| 4 | NC plumbing **31 December**, *"Contrary to popular belief, there is NO GRACE PERIOD"* | `nc.plumbing` | **FOUND**, both fragments, on the board's own renewal page. |
| 5 | FL **certified = even year, registered = odd year, 31 August** | `fl.hvac` | **FOUND**, and the context confirms the attribution: the even-year sentence sits under *"Certified Contractors"* and the odd-year sentence under *"Registered Contractors"*. Correct. |
| — | TX ACR application fee **$115**, cycle *"valid for a period of 1 year"* | `tx.hvac` | **FOUND** (bonus check). |
| ⚠ | TX ACR **exam fee $74** | `tx.hvac` | **FOUND but contextually narrower than the field** — the fragment sits in the Class B → Class A **upgrade** paragraph. The record's note says so and confidence is medium, so this is honest; it is the worked example for M10. |
| ⚠ | FL registered renewal date | `fl.hvac` | The same page carries *"because the 31st falls on a Sunday this year… the deadline has been extended to September 2nd"* — a board-announced roll the engine cannot represent (**M13**). |

Two copy claims outside `kb-data/` were also re-verified live because they appear verbatim in the
outbound email and the landing page: **CSLB** (*"You cannot actively contract with an expired,
inactive, or suspended license"*, *"Active licenses expire every two years"*, $450 / $700 / $675 /
$1,050, the five-year rule) — **all found**; **Housecall Pro** (*"store documents, track expiration
dates, and set automatic renewal reminders"*) — **found**. `PERSONA.md` §3 and `offer/RESEARCH.md`
§4.2 are safe to publish as written.

### 4.2 `unknown` discipline — correct, and the reason it is a problem

`unknown` is used exactly as designed: 144 of 603 values, every one with a note saying which pages
were read, and gate G2 fails the build without it. The Texas bond entry is the model — recorded as
*"not established"*, explicitly **not** as *"no bond required"*.

**The discipline is right and the coverage is not.** 48 of 50 bond fields are `unknown`;
`typical_timeline` is `unknown` in 7 of 9; all three Florida records lack an application fee. The
data is honest about it and the **commercial documents are not** — see **B2**. The knowledge base
should not change; the promises should.

### 4.3 Does the ontology enforce A10 on every value? **No — only on verified ones.**

`schema.sourced_value.json` requires `value`, `status`, `confidence` on every value, and
`source_url` + `evidence` + `last_verified` + `verified_by` **only under `if status = "verified"`**.
`verified_by` carries `minItems: 0`. So `confidence` is enforced universally (A10 satisfied on that
axis) but the other three are not.

In practice today nothing is exposed: all 603 values are `verified` (459) or `unknown` (144), and
gate **G1** in `validate.py` does enforce two *distinct* verifiers, an evidence fragment, a URL and a
date on every verified value — I read the gate and re-ran it. The hole is latent and will open the
first time §5.1's demotion path runs on a record nobody hand-edits afterwards. See **m4**.

### 4.4 Drift script behaviour on a changed hash — verified by experiment

Copied the scripts and the baseline into a scratch tree, replaced one `content_sha256` with zeros,
ran with `--only`. Output: `unchanged 0 drifted 1 unreachable 0 new 0`, followed by
`DRIFT bls.qcew.2382 000000000000 -> 1492aa3f974e` and the URL, **exit 1**. Correct.

Three limitations worth writing down: the script exits 1 for **unreachable** as well as drifted, so
a transient reset is indistinguishable from a real change at the exit-code level (the report does
distinguish); it has no notion of "three consecutive days", which `specs/14` requires — that state
lives in `kbSources.consecutiveFailures` in the app, so the app must own the counter; and it stores
no previous text, so `specs/14`'s diff screen cannot be built from it (**M16**). The
`no_change` / baseline coupling is **B11**.

### 4.5 Launch-state list against BLS — reproduces exactly

`rank_states.py` re-run against the live `data.bls.gov/cew/data/api/2025/a/industry/2382.csv`
returns the identical fifteen states, the identical establishment and employment counts, the
identical **149,343 / 236,924 = 63.0%**, and the identical next-in-line (WA 5,110, TN 4,648). The
methodology note is sound: NAICS **2382** rather than 238 is the right cut because 238 carries
roofing, concrete, drywall and painting, and establishments rather than employment is the right unit
because the buyer is a business. `KNOWLEDGE_BASE.md` §2's deviation record (NY and MA in, WA and TN
out) is accurate. **No finding.**

### 4.6 Is "~1.7 hours per record, 36 records ≈ 60–70 agent-hours" credible?

**Directionally yes; the wall-clock claim is not.** The per-record breakdown is measured from work
actually done (35 sources / 9 records, 24 defects found by pass B, ~67 values per record) rather than
guessed, and the state-level unit (3.5–5 hours for three trades) is right because sources are shared
within a state — verified in the data: NC HVAC and NC plumbing share all five sources.

Three reasons the estimate will overrun, none fatal:

1. **It excludes the hard part it names.** §11.1 marks NY, PA, IL and CO as `local_only` or
   `state_optional_local_required`. Those records are not extraction, they are a **schema and product
   decision** about how to say "there is no state licence — you need New York City, and Buffalo
   separately" without the customer reading it as coverage. Budget a design pass, not just fetch time.
2. **The verification pass is undercounted for new error classes.** The first nine records produced
   24 defects at 94.8%; the dominant class was mis-attribution, which pass B catches only when the
   fragment is absent from the wrongly-cited page (**M10**). Twelve new states across ~20 new boards
   will produce classes the current fold does not normalise.
3. **"4 parallel agents × 2 days" contradicts the crawl policy.** `lib_kb` is serial with 1.5 s
   spacing and the memory says *"do not parallelise"*. Four agents on four different states is fine;
   four agents on one state's board is not, and CA (CSLB + DIR) and VA (DPOR two-layer) are
   single-host.

**Revised estimate for wave 2: 80–95 agent-hours, sequenced GA/OH/AZ/MI first** (12 records, one
board each, ~14 hours — this is a genuinely good first tranche and it closes the Texas ACR
reciprocity loop for existing customers). Treat CA and the three local-only states as a separate
work item with its own design review.

---

## 5. Build readiness

### 5.1 Wave 2 can start today

| item | condition |
|---|---|
| **M5 rules engine** (the critical path) | Start now as a **pure function + golden tests over `kb-data/`**, per D6. Apply **B6**'s one-line invariant fix first. No database needed. |
| **M14 KB runtime** | Start now. Fold in **B11** (drift acceptance writes the baseline **and** the record hashes) and **M16** (store the normalised text) before the `/admin/kb` screens. |
| **M1 auth + organisation** | `specs/01` is complete and depends on no open decision. The magic-link pre-fetch mitigation in §Edge cases is the best thing in the spec — build it on day one, not after the first bug report. |
| **M2 company profile** | Complete. One edit: `/onboarding/states` uses the tile grid (**m14**). |
| **M3 roster + CSV import** | Complete. Build the date-format radio (`UX.md` S07 step 4) even though it costs a click — `UX.md` §10 gap 4 is right that this is the highest-consequence silent bug in the product. |
| **M11 help centre** | Complete; the 15-article list is derived from the nine records and the content test (every regulatory claim links to a URL in `kb-data/`) is buildable today. |
| **The remaining 36 KB records** | Nothing blocks them. Start GA / OH / AZ / MI (D5). |
| **Component build from `design-system.css`** | The CSS and `samples.html` pass their own checks (0 undefined tokens, 0 undefined classes, 0 external references, contrast exit 0). Build components from **the CSS**, not from `IDENTITY.md` (**B8**, D9). |

### 5.2 Waits, and on what

| item | waits on |
|---|---|
| **M4 licence records** | D6 (header dependency inversion) — starts as soon as M5's signature is fixed. |
| **M6 alerts** | **B9** (cron decision + P1) and **B10** (per-recipient digest model). |
| **M7 dashboard** | **B7** (map spec rewritten to the tile grid, one status vocabulary, AT RISK ≤ 90). |
| **M8 playbook** | **B2** (completeness gate + which fields we may promise) and **B5**/D3 (guarantee wording). |
| **M9 billing** | **D1** (now decided) then **M6-finding** (env names, missing $1,000 price, credit mechanism). |
| **M12 legal** | **M12-finding** (cadence out of the disclaimer), **B5**/D3 (refund policy), and founder item **P10** — `specs/12` correctly fails the build without a postal address, so P10 is a hard blocker, not a TODO. |
| **M13 admin metrics** | **M4-finding** (one activation event name) and **M5-finding** (band read from `thresholds.json`). |
| **Landing page + demo (new M15)** | **D1**, **D2**, **B8** (tokens and typefaces), **M18**/**M19** (section and demo-default edits), then the copy-deck re-count. |
| **Outbound (wave 3)** | **D4** (workbook sorted by state count; lead with accounts inside 15 states). |

### 5.3 The one thing that would most change this review

If the register-ingestion spike (**B3**) comes back positive for a majority of the 15 launch states,
the $149 audit becomes a good offer and I would reverse D1 at the next review — the tripwire's logic
is sound and the offer agent's reasoning about data entry as the binding constraint is correct. The
decision is against the *unevidenced* version of it, not against the idea.

---

## 6. Consolidated founder questions, with a recommended default

Deduplicated from `PERSONA.md` §13 (Q1–Q8), `KNOWLEDGE_BASE.md` §14 (1–5), `OFFER.md` §5.2/§9/§12/§13,
`THRESHOLDS.md`, `identity/CLAUDE.md` A1–A5, `product/CLAUDE.md` assumptions 1–3,
`offer/CLAUDE.md` A1–A6, and `../PREREQUISITES.md`. **Every one has a default, so nothing blocks on
an answer.**

| # | question | recommended default | cost of the default being wrong |
|---:|---|---|---|
| **Q1** | Free trial or the $149 paid audit? | **14-day free trial, no card** (D1). Audit is iteration 2, gated on B3. | 14 days of delayed cash per signup. Reversible in one config change. |
| **Q2** | Which guarantees may we make? | **Two** (D3): Accuracy (5 business days + one month's credit) and Entry Pack (`OFFER.md` §5.1.3 wording, 90 days, capped at the fee). No Rollout, no Alert, never reinstatement-fee. | Slightly weaker risk reversal on a page whose real proof is the demo. |
| **Q3** | Name: keep **StateReady**? | **Yes**, and run the USPTO knock-out at `tmsearch.uspto.gov` **before any brand spend** (P11). Launch on `getstateready.com` (~$12), secure `.io/.app/.co` (~$100), open a Namecheap Market negotiation for `stateready.com`. If the search comes back bad, **RenewalMap**, not LicenseAtlas. | A rename after launch is a branding cost, not a code cost — but a trademark letter after spend is neither. |
| **Q4** | Publish `/coverage` before launch? | **Yes.** The same information is derivable from the free demo in thirty seconds, the two named competitors are pre-launch waitlists with no data to steal, and it is the single most credible page we can put on the internet. | Competitors learn our coverage. They already can. |
| **Q5** | Widen states or trades first? | **States**, in `KNOWLEDGE_BASE.md` §11.1's order (D5). | Five of twenty top-fit accounts stay unaddressable for longer. |
| **Q6** | Does anyone actually pay for licence tracking? | **Unanswerable before launch; instrument it.** `lp_demo_query`, `was_covered=false`, and T1/T2 at n = 100 are the experiment. Do not spend on paid acquisition before that read. | This is the load-bearing unknown of the whole product and `THRESHOLDS.md` exists to answer it. |
| **Q7** | How stale may a `last_verified` date get before we stop calling a value verified? | **180 days** → render as unverified with the board link. G13's 400-day warning stays as the build-breaking backstop. | Some values flip to unverified during a quiet month. That is the honest failure direction. |
| **Q8** | Credit mechanism for the Entry Pack against an annual plan? | **Stripe customer balance credit** (clearest audit trail), applied by the app, `once_per_customer` enforced in the app not in Stripe. One credit per customer, whichever is larger (**M7**). | Coupon vs balance is an accounting preference; either works. |
| **Q9** | Enterprise pricing for the 16+-state platforms? | **Leave quote-only, invent no number**, and stop treating them as the launch ICP (D4). | The biggest logos cannot self-serve. That is honest and it is already true. |
| **Q10** | Is the "no job stops" headline acceptable? | **No.** It is an outcome promise the guarantee section refuses to stand behind, and `IDENTITY.md` §2 prohibits it. Keep it as A/B challenger **only if** the founder accepts the risk in writing; otherwise delete it from the test plan. | Losing an emotionally stronger headline. Worth it. |
| **Q11** | Honest scarcity — how many rollouts a week can we actually start? | **Say nothing about capacity** until the roster build exists and is measured (`OFFER.md` §9 already conditions this correctly). | A scarcity claim we cannot back is the one lie a compliance brand cannot survive. |
| **Q12** | Is the EPA 608 $44,539/day penalty real? | **Stays banned** until one agent opens a `.gov` source. `epa.gov`'s penalty-adjustment page 404'd (`identity/sources.md` row 22) and I did not re-attempt it; it appears on no surface today and must not. | We lose the category's most quotable number. Everyone else who uses it is quoting a vendor. |
| **Q13** | Illinois plumber CE hour count? | **Not publishable.** IDPH confirms the 30 April deadline and the annual obligation; the hour count is secondary-source only (`offer/RESEARCH.md` G3). Use the date, never the hours. | A four-hour claim we cannot cite. |
| **Q14** | Texas plumbing annual renewal cycle — inference or fact? | **Open Texas Occupations Code ch. 1301** in the first week of wave 2. It is medium-confidence today and it propagates to every derived deadline in the state. | Every Texas plumbing deadline carries `needsHumanCheck` until it is resolved (which is the correct behaviour, but it weakens the state's demo). |
| **Q15** | State-specific consumer-protection wording in the terms? | **Needs counsel, and it is more than a wording question.** Name the three exposures for the lawyer: (a) **automatic-renewal statutes** — clear-and-conspicuous renewal disclosure, an easy cancellation path and, for annual plans, a renewal reminder; (b) the word **"guarantee"** on a public page creates a UDAP hook if not honoured exactly as printed (D3's caps and carve-outs exist for this); (c) the disclaimer must also cover the **roster build** if it is ever shipped — that we do not verify identity, that public registers may be incomplete or stale, and that the customer must confirm the roster. | The subscription and the guarantees both go live without it. This is the highest-value hour of legal time in the plan. |
| **Q16** | Vercel Pro (P1) — when? | **Before wave 2 builds M6**, not before launch (D8). | Hourly cron becomes a silent daily cron and the alerting product stops being one. |
| **Q17** | Postal address + support email (P10)? | **Blocker.** `specs/12` correctly fails the build without it, and the CAN-SPAM footer needs it for outbound too. | The build does not compile. Deliberately. |
| **Q18** | Register-ingestion feasibility (B3)? | **Run the 2-day spike in wave 2**, per state, with a written verdict. Until it passes, no surface says "we build the roster". | The offer's largest lever stays theoretical — which is better than it staying promised. |

---

## 7. Sign-off checklist

I will sign when every box is ticked. Items marked ⛔ block wave 2 from starting on the affected
module; the rest block launch.

**Decisions applied**
- [ ] ⛔ **B1** D1 applied across all eight files in §1.3, and `THRESHOLDS.md` §7 carries the changelog row.
- [ ] **D2** applied: `BACKLOG.md` has **M15** (demo), S02 stays SHOULD, `UX.md` §1 note replaced.
- [ ] **D3** applied: two guarantees, `OFFER.md` §5.1 wording only, in `OFFER.md`, `specs/08`, `specs/12`, `LANDING_SPEC.md` §8/§13.
- [ ] **D4** recorded in `BACKLOG.md` §0 and inherited by the wave-3 outbound brief.
- [ ] **D5** recorded in `KNOWLEDGE_BASE.md` §14 Q1 with the corrected count (**M9**).
- [ ] ⛔ **D6** spec headers corrected in `specs/04` and `specs/05`.
- [ ] ⛔ **D7** `specs/07` rewritten to the tile grid, one status vocabulary, AT RISK ≤ 90.
- [ ] ⛔ **D8** `specs/06` names the cron decision and the Hobby fallback; P1 moved to a wave-2 prerequisite.
- [ ] **D9** `IDENTITY_ARBITRATION.md` published; `IDENTITY.md` §§6.1–6.3, 8.1, 8.3, 8.4, 10, 11 rewritten against `design-system.css`; `--sr-paper` removed from `IDENTITY.md` and `LANDING_SPEC.md`; `UX.md` S17 uses `board/paper`.

**Claims and liability**
- [ ] **B2** bond, timeline and Florida fees either removed from the Entry Pack contents, the hero subhead and V4, or verified; `specs/08` has a completeness gate distinct from `publishable`.
- [ ] **B3** no surface says "we build the roster" until the spike passes.
- [ ] **B4** the Alert Guarantee is either carved out and capped, or absent from every surface.
- [ ] **B5** one guarantee wording, adjudicated against a published page, capped at the fee, 90-day claim window.
- [ ] **M12** cadence claims removed from `/legal/disclaimer`.
- [ ] **Q10** the "no job stops" headline is deleted or carries a written founder acceptance.
- [ ] **Q12** the EPA 608 figure appears nowhere (re-grep before every deploy).
- [ ] **Q13** no Illinois CE hour count anywhere.
- [ ] **M18** §4 of the landing page carries at least one covered-state consequence.

**Build correctness**
- [ ] ⛔ **B6** `specs/05` invariant 2 reads `confidence != "high" OR status != "verified"`.
- [ ] ⛔ **B10** the digest model is per recipient.
- [ ] ⛔ **B11** `no_change` writes the baseline and the citing records' provenance hashes, via one command.
- [ ] **M4** one activation event name, emitted from the derivation service.
- [ ] **M13** `expiry_overrides` in the schema, in `specs/05`, and in gate G8.
- [ ] **M16** normalised text stored with the baseline.
- [ ] **M17** `_history/` implemented, or the paragraph deleted from `ontology/id-grammar.md`.
- [ ] **m4 / m5** schema and G3 tightened so an `unverified` or medium-confidence value cannot ship bare.

**Evidence still green at sign-off**
- [ ] `python3 kb-scripts/validate.py` exits 0.
- [ ] `python3 kb-scripts/verify_pass_b.py` reports 0 disagreements and 0 unreachable.
- [ ] `python3 kb-scripts/refresh_sources.py` reports 0 drifted, or every drift has a resolved queue item.
- [ ] `python3 identity/contrast.py` exits 0 **and** its numbers match the table printed in `IDENTITY.md` §6.3.
- [ ] The landing-page word counter passes at ≤ 450 including the repeated CTA (**m9**).
- [ ] `specs/13`'s event-name parity test passes against `specs/01`–`specs/14`.

**Founder gates (not the fleet's to tick)**
- [ ] P1 Vercel Pro · P5 Stripe products · P10 postal address and support email · P11 name + USPTO knock-out · P12 offer and guarantee validation · Q15 counsel on the terms.

---

*Reviewed against `PIPELINE.md` stage 5. No reviewed file was edited. Authors iterate; I re-read and
sign, or escalate to the orchestrator on the third round with the disagreement written down.*
