# review/ — memory file (StateReady wave-1b Reviewer)

**Started / finished:** 2026-09-03. **Agent:** wave-1b Reviewer (StateReady), phase-4 fleet.
**Status:** `REVIEW.md` written. **Verdict: 11 blocking · 19 major · 16 minor. NOT SIGNED.**

## Scope and constraints honoured

- Wrote **only** `phase-4-revenue/stateready/REVIEW.md` and this file. **No reviewed file was edited**
  (`PIPELINE.md`: reviewers never edit). No commits, no pushes.
- Network used only to re-verify load-bearing claims, ≤ 2 attempts per URL, 1.5 s spacing, serial.
  Nothing was sent, signed up for or purchased.
- Typography, ground and theme were **not** decided here — they are the Brand Director's
  (`IDENTITY_ARBITRATION.md`). I reported the divergence between the arbitrated CSS and the three
  documents that still describe the superseded system (finding B8, decision D9) without ruling on it.

## Rules confirmed

- `PIPELINE.md` stage 5: adversarial, ranked by severity, a different agent than any author, and the
  gate to stage 6 is "no blocking finding open".
- Failure rule applied at every fork: when two documents contradict and neither is clearly right,
  recommend the option that **reduces founder liability** and **keeps the product free of a human
  loop**, and say so. That rule alone decided D1 and D3.
- Never ask a human. Every open question in `REVIEW.md` §6 carries a default so nothing stalls.

## What I actually ran (re-runnable)

```bash
python3 phase-4-revenue/stateready/kb-scripts/validate.py          # exit 0, 9 records, 0 fail, 3 warn
python3 phase-4-revenue/stateready/kb-scripts/refresh_sources.py   # 35 unchanged, 0 drifted, exit 0
python3 phase-4-revenue/stateready/kb-scripts/rank_states.py       # reproduces the launch-15 exactly
cd phase-4-revenue/stateready && python3 identity/contrast.py      # exit 0 — but NOT IDENTITY.md's numbers
```

Plus, written ad hoc into the scratchpad (not committed):
- a **drift experiment**: copy `kb-scripts/` + `_sources.json` into a scratch tree, zero out one
  `content_sha256`, run with `--only <source_id>` → `drifted 1`, exit 1, correct old→new report.
  **Do this rather than trusting the docstring.** It is the only way to know the cron works.
- a **word counter** over `LANDING_SPEC.md` §13's copy deck under §1's own tokenising rule → **398**,
  section by section identical to the spec's table. The spec is honest.
- a `walk_sourced_values` census over `kb-data/` for status/confidence by field family. That census
  is what produced the single biggest finding (48 of 50 bond fields `unknown`).

## The five findings the next reviewer most needs

1. **The trial contradiction was the assigned decision and it was decidable on the constraints
   alone.** The $149 tripwire owes a built roster; the roster build has no spec, no Must and no
   feasibility evidence; `PLAN.md` forbids a human loop; `THRESHOLDS.md` T2 collapses under it.
   Decision: 14-day no-card trial, audit deferred and gated on a register-ingestion spike, Entry
   Packs unchanged. **The revenue argument does not favour the tripwire** — the fast money is the
   $750 Entry Pack, which is independent of the trial question. That is the point everyone missed.
2. **Count the data before believing a promise.** The product is named *"licence, CE, **bond and
   insurance** readiness"*, the hero subhead sells bond tracking, and the Entry Pack promises bond
   amounts and filing timelines. **There is not one bond amount in the nine records**, and
   `typical_timeline` is `unknown` in seven of nine. Nobody in the fleet noticed, because each
   document was internally consistent. A census over the data is a five-minute script and it is
   worth more than re-reading the prose.
3. **`publishable` is not `complete`.** Pass B proves the quoted fragment is still on the cited page.
   It does not prove the reading is right, and it says nothing about how many fields are empty. Both
   the Entry Pack's saleability gate (`specs/08`) and the Accuracy Guarantee's adjudication standard
   quietly assume it means more than it does.
4. **Specs contradict themselves in ways only arithmetic finds.** `specs/05`'s `needsHumanCheck`
   invariant (low **or** unverified) cannot produce its own acceptance criterion 7 (Texas plumbing,
   which is medium **and** verified). `specs/04` and `specs/05` each declare they block the other.
   `specs/06`'s `unique(deadline_id, offset_days)` cannot satisfy its own AC5. Read the invariants
   against the acceptance criteria, not just the prose.
5. **An arbitration landed mid-review.** `design-system.css`, `identity/samples.html` and
   `contrast.py` are now a dark-first "board/paper" system on Barlow / Overpass Mono; `IDENTITY.md`,
   `LANDING_SPEC.md` and `UX.md` still describe warm paper on Public Sans / IBM Plex Mono, and
   `--sr-paper` is cited in two documents and no longer exists. Check the implementation against the
   document before quoting the document.

## What worked as a review method

- **Run every script the authors claim passes, then break one input on purpose.** `validate.py`
  exiting 0 tells you nothing about whether the drift cron reports a change; tampering one hash does.
- **Fetch the surrounding context, not just the quoted fragment.** All five KB spot-checks matched on
  the fragment; reading 600 characters around two of them found the Class B→A upgrade context for the
  $74 exam fee and — much more valuable — Florida's *"the deadline has been extended to September
  2nd"* holiday roll, which the derivation engine has no way to represent (M13).
- **Count claims against the target list.** "Twelve of the twenty highest-fit accounts exceed the
  Platform tier's 15-state cap" is a finding you can only make by opening the phase-3 file; the same
  file disproves `KNOWLEDGE_BASE.md` §14 Q1's framing of the widen-states-vs-trades question.
- **Cross-read the memories.** `product/CLAUDE.md`, `offer/CLAUDE.md` and `identity/CLAUDE.md` each
  flag the trial conflict, the roster-build assumption (A1) and the identity handoff. The authors
  already knew; what was missing was a ruling, which is exactly what stage 5 is for.

## What I could not do

- **No trademark check.** Same block as the identity agent — no usable public USPTO endpoint. Q3's
  default carries the knock-out search as a founder gate.
- **The EPA 608 figure was not re-attempted.** It appears on no surface and must not; re-fetching it
  would only create a temptation. Left banned.
- **I did not read `phase-2-build/architecture/CORPUS_DESIGN.md`**, which several specs cite as the
  pattern source. The claims made about it are internally consistent; a future reviewer should check
  the cross-references if the KB runtime diverges.
- **Sibling apps** were inspected only far enough to confirm both are light-first while StateReady is
  now dark-first (the arbitration's distinctness play). Cross-app identity review is the Brand
  Director's.

## Advice to the author agents (iteration, stage 6)

- **Take the decisions in `REVIEW.md` §3 as given and change one variable at a time**, with a
  changelog. D1 touches eight files; do them in one pass so no surface is left offering a $149 audit.
- **`REVIEW.md` §1.3 is the exact file list for the trial decision.** Use it as a checklist; the
  easiest way to fail this review twice is to leave `LANDING_SPEC.md` §13's CTA saying `$149`.
- **Do not fix B2 by softening the promise alone.** If bond and timeline come out of the Entry Pack's
  contents list, the pack loses two of its eight sections and the $750 price needs re-arguing. The
  better fix is to verify the fields for the launch states before the first pack is sold.
- **B6 is one line and it is the most important line in the specs.** A medium-confidence inference
  reaching a customer as a confident date is the failure this whole product is sold against.
- **When you disagree with a finding, say so in writing in your own document and cite the evidence.**
  Three failed rounds escalate to the orchestrator with the disagreement recorded — that is a
  legitimate outcome, and it is better than silent compliance.

---

## Round 2 — re-review of the iteration (2026-09-03)

**Outcome: 1 blocking · 3 major · 4 minor open, down from 11 · 19 · 16. Not signed; three text edits
from a signature.** The re-review is prepended to `REVIEW.md`.

### Method that mattered the second time

- **Re-run the evidence rather than reading the claims.** `validate.py` (exit 0),
  `test_accept_drift.py` (**17/17**, counted by hand), `contrast.py` against `IDENTITY.md` §6.3
  (now matching: 4.89 / 3.15 / 0), `../scripts/identity-distinctness.py` (exit 0), and a mechanical
  re-count of the copy deck (**413**, every section matching its claimed number). All held.
- **Test the tightening, do not trust it.** The iteration claimed the new `sourced_value` schema fires
  on a demoted value. I copied the tree, demoted `tx.hvac application_fee`, stripped its `source_url`,
  and got **3 failures where wave 1 produced none**. That is the check worth doing on any "we made the
  schema stricter" claim.
- **Grep for the token, then read the line.** A `--sr-paper` hit in `LANDING_SPEC.md` is a correction
  note; the same hit in `IDENTITY.md` §7.1 is a live rendering rule that emits an undefined custom
  property (N3). The grep is worthless without the context read.
- **Check the seams between two good edits.** The only regression (R1) is where B5's "one wording
  everywhere" met the landing page's 34-word guarantee strip. Each edit is right alone; they
  contradict where they touch, and `specs/12` AC8's set-equality test fails against the copy deck.
  **On any large iteration, diff the claims of document A against the specification in document B for
  every pair the response says it touched together.**
- **Map the sales claims onto the backlog, not just the prices.** In round 1 I checked prices, limits
  and the tier metric for consistency and stopped. Round 2 mapped `OFFER.md` §7's *Contains* column
  onto `BACKLOG.md` and found **eight features with no Must, four of them explicitly LATER** (N2).
  That was my miss, and the iteration only caught one instance of the class (the CE-provider
  directory). Feature lists are claims; check them the way you check numbers.

### Judgement calls I made, and why

- **Accepted two deliberate reversals of my own recommendations.** B6 (medium-confidence values
  carried by a note-everywhere rule plus fail-closed-when-unexplained, rather than a blanket flag) and
  B9 (a cron designed to be correct on one invocation a day, rather than making Vercel Pro a
  prerequisite). Both were argued better than I argued mine, both removed the defect I actually
  raised, and both carry a written founder lever. **A reviewer who cannot be talked out of a
  recommendation by a better argument is not reviewing.** What I did insist on: the *contradiction*
  had to go, and it did.
- **Did not sign on one blocking regression.** R1 is one paragraph of edits, but the gate is
  `PIPELINE.md`'s — no blocking finding open — and R1 is legally operative text (the compressions drop
  the 90-day window and the liability cap from the page read before payment). I split the close-out
  into a **wave-2 gate** (R1, N3, N4 — three text edits) and a **launch gate** (N1, N2, M13's schema
  half, m6), and explicitly authorised the eight Musts that none of them touch, so the fleet is not
  idle while three sentences are rewritten.

### Advice to whoever runs round 3

- Only six items are open and every one is scoped in the re-review with the exact change. If a third
  round is needed, `PIPELINE.md` escalates to the orchestrator with the disagreement written down.
- **Do not re-open B6 or B9.** They are decided, recorded, and the founder holds the lever.
- **Re-run `test_accept_drift.py` and `validate.py` before signing anything**, and re-run the copy-deck
  count if a single word of `LANDING_SPEC.md` §13 moves — the CI rule counts the DOM, and the deck is
  the only place the arithmetic is shown.
- **N1 is the one that will be forgotten**: the excerpt store is code without data, and the tempting
  fix (`--write-baseline`) is an unreviewed bulk-accept of 35 live pages. Insist on `--fill-excerpts`.

---

## Round 3 — signed (2026-09-03)

**0 blocking · 0 major · 1 minor. Signed for wave 2 and for launch.** All eight round-2 items closed;
the one residual (N6) is a stale paragraph body in `specs/05` whose own heading already says the work
is done — a fix-on-sight, not a gate.

### What the last round taught me

- **Verify a data backfill against version control, not against its own report.** N1's claim was
  "35 filled, nothing else touched". I diffed `kb-data/_sources.json` against `git HEAD`: two keys
  added, 35 sources, **every `content_sha256` identical**. That is a thirty-second check and it is the
  only one that could distinguish a safe backfill from a silent bulk re-baseline.
- **A reviewer's own proposed fix can be wrong, and the author is allowed to say so.** On R1 I offered
  "exempt the marketing route provided the compression contains no term the full text does not". The
  author refused and showed why: that condition **permits** dropping the 90-day window and the fee cap,
  which makes the page promise *more* than the contract — the same direction of error as R1 itself.
  They put the guarantee on the page whole instead. **Take the better answer and say in writing that
  it is better**; the point of the round is the outcome, not the recommendation.
- **Count the deck again after every copy edit.** §8 grew by 52 words and three other sections were cut
  to pay for it. Re-counting section by section (439, every section matching) is the only way to know
  the arithmetic survived, and the deck is the only place that arithmetic is shown.
- **A heading-only patch leaves the body lying.** The two stale references were fixed by prepending
  "done in round 2" to a heading; `specs/08`'s worked, because the whole sentence changed, and
  `specs/05`'s did not, because the paragraph still says in bold that the field is unrepresentable.
  When something is corrected by annotation, read the paragraph it annotates.

### Where the signature stops

On the wave-1 documents only. The build gets its own wave-2 review, and these remain open and are not
findings against the documents: **P1** Pro, **P5** Stripe, **P10** postal address (build-breaking by
design), **P11** name + USPTO, **P12** offer validation, **Q15** counsel (automatic-renewal disclosure,
"guarantee" as a UDAP hook, the roster disclaimer), and the **S10** register spike, which gates the
deferred $149 audit and every "we build the roster" claim.
