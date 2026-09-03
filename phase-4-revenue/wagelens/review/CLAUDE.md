# review/ — memory file (WageLens wave-1b Reviewer)

**Started:** 2026-09-03. **Agent:** Reviewer (WageLens, wave 1b). **Status:** REVIEW.md delivered;
awaiting author iteration (PIPELINE stage 6).

## Scope and rules confirmed

- **PIPELINE.md standing rule: reviewers never edit.** I wrote exactly two files:
  `phase-4-revenue/wagelens/REVIEW.md` and this memory. No reviewed document was touched, no code
  was written, nothing was committed or pushed.
- Stage 5 of the six-stage pipeline: adversarial, ranked by severity, a different agent than any
  author.
- Failure rule (brief + PIPELINE stage 4): where two documents contradict and neither is clearly
  right, recommend the option that **reduces founder liability** and say so. Never ask a human —
  every founder question in §4 of the review carries a default so nothing waits on an answer.
- Network allowed only to re-verify a load-bearing claim, two attempts per URL. Used four times
  (below), all first attempt.
- Coordinator instruction received mid-task: **the cross-app identity collision is arbitrated
  centrally by a Brand Director** writing `phase-4-revenue/IDENTITY_ARBITRATION.md`. I recorded the
  collision as blocking finding **B7** with the Brand Director as owner, did **not** decide
  typefaces or grounds, and kept reviewing the identity for internal consistency, persona fit and
  accessibility (which is where m5 and the token-freeze instruction in §3.1 came from).

## Verdict delivered

**9 blocking · 19 major · 10 minor.** The three that matter most are one fault line: modification
pinning is sold (OFFER, LANDING), forbidden (WL-02 V3), and unbuildable from the corpus as designed
(WL-13 ingests active determinations only).

## What I checked, and how

1. **Read everything in full before writing a word.** ~9,500 lines across 30 files. The
   contradictions only surface if you hold OFFER §7, UX §1, BACKLOG §4 and WL-09 in your head at
   once; skimming would have found none of the nine.
2. **Built a cross-document matrix by hand** for the five things the brief named — price, tiers,
   trial, limits, entitlements — then activation definition, then every analytics event.
   *Result:* the price ladder and limits are consistent in all five documents (a genuine
   achievement of the wave-1 reconciliation); the trial is not; the events are not.
3. **Traced every offer promise to a spec.** This is the technique that produced B5, M2 and M9:
   read `OFFER.md` §3.2 and §4 as a checklist and `grep` the specs for an owner. Four promises had
   none — the free determination watch, Bring Your Own History, the Audit Binder as a single PDF,
   and the bookmarkable prime link. Three are in Stripe price metadata already
   (`audit_binder=true`, `prime_link=true`), i.e. a customer could be billed for them.
4. **Traced every THRESHOLDS metric to an emitting spec.** All 16 exist — say so, it is worth
   knowing. Then ran the same trace for `LANDING_SPEC.md` §13 and found a second, incompatible
   vocabulary (B6).
5. **Re-verified four load-bearing claims at the source** rather than trusting the documents:
   - `curl` of the WH-347 PDF → HTTP 200, 304,738 bytes, sha256 `fa28f033a825…` (matches KB-6
     byte-for-byte), `pypdf` → `pages 2 fields 0`, text layer `Rev. January 2025`,
     `OMB No.: 1235-0008`, `Expires: 01/31/2028`. Confirms F2 **and** produced m1 (PERSONA §13 R8
     quotes a 09/30/2026 expiry from a MoDOT mirror of the instructions).
   - `/wdol/v1/wd/TX20260253/history` → rev 1 active, rev 0 inactive; `/wdol/v1/wd/TX20260253/0`
     → HTTP 200, 16,319 bytes of `document`. **This is what turned B3/B4 from "the differentiator
     is impossible" into "the differentiator is unspecified" — a much more useful finding.**
   - `python3 identity/contrast.py` → "All 72 pairs pass (39 light, 33 dark)", exit 0.
   - Banned-phrase `grep` across the whole directory → clean; every hit is inside a banned list or
     a quoted competitor page.
6. **Re-counted the landing page's word budget** rather than trusting the table: hero 11+31+5+8=55,
   §5 5+21+20+10+6+8=70, §3 53, §4 105, §5 110, §6 43 → **436/450**. Honest. The only defect is
   that the §3 wireframe carries a *different* sub-headline that would push the hero to 58 (M13).
7. **Compared the three apps' design systems directly** (`grep` for `font-family` and the ground
   token in each `design-system.css`) rather than relying on the identity documents' own
   distinctness sections — which is how the collision is provable in one line:
   WageLens `#FBF9F5`, StateReady `#FAF8F4`, Certly `#F3F3EE`, all Public Sans + IBM Plex Mono.
8. **Read the specs as a builder would**, looking for the sentence that stops work: WL-02 V3 vs its
   own edge-case row, WL-05 vs WL-07 on payroll-number allocation, two keyboard maps, two
   magic-link parameter sets.

## Mistakes and course corrections in my own process

- **I nearly filed the identity collision as a decision.** The brief asked me to "propose which app
  changes and to what". The coordinator's mid-task update reassigned it. Lesson recorded: a finding
  that spans fleets belongs to whoever owns all the personas, not to the first reviewer who spots
  it. I rewrote B7 to state the evidence and the consequences for *this* app (token discipline,
  re-run contrast.py, rewrite §14's self-declared reservation) and left the choice alone.
- **My first pass rated M7 (blocking a below-determination rate) as blocking.** Downgraded on
  reflection: the build would follow the spec, so it does not stop work — but it is the finding
  with the sharpest liability argument, so it got a numbered decision (D5) and a prominent place.
- **I nearly missed B9 entirely** because every document is internally consistent about the trial
  mechanics. Auto-renewal disclosure is absent from *all* of them, and absence is invisible when you
  are diffing documents against each other. Lesson: after the cross-document pass, run a
  *nothing-says-this* pass against an external checklist (consumer protection, data protection,
  accessibility, retention).
- Bash `cat` of large files gets truncated to a persisted file in this environment; the Read tool
  paginates cleanly. Read `IDENTITY.md` in two pages (it is 1,035 lines).

## Advice to the authors iterating on this

1. **Fix B3 and B4 together, in that order, before anything else.** They are one problem wearing two
   hats, and the offer, the landing page and the guarantee all hang off them. The endpoints work —
   I checked — so this is a spec change, not a research problem.
2. **Do not "fix" a contradiction by weakening the safer document.** D5, D6, D8 and D9 all resolve
   toward the version that refuses to adjudicate the customer's legal position or to hold their
   records forever. If you disagree, the disagreement goes to the orchestrator in writing
   (PIPELINE §6), not into the copy.
3. **B9 is an hour of work and the cheapest risk reduction in the list.** Do it first if you want an
   early win.
4. **When you change a price, a limit, a trial term or an event name, change it in five places:**
   `OFFER.md` (§6, §10), `BACKLOG.md` (WL-09), `specs/WL-09`, `LANDING_SPEC.md` (§8, §13),
   `THRESHOLDS.md` (§0.3 and the affected band). The wave-1 reconciliation got this right once;
   keep the habit.
5. **Adopt `LANDING_SPEC.md`'s `{{PRODUCT}}` pattern everywhere immediately** (M12). It is already
   the correct answer, written down by one of the three agents, and it makes the founder's naming
   decision a no-op instead of a sweep through emails, PDFs and help slugs.

## Advice to the next reviewer (round 2)

- Re-check the nine blocking items **and** re-run the four verifications in §"What I re-verified" —
  the SAM.gov endpoints are undocumented and could change between rounds (KB K1).
- Re-count the landing word budget after any copy edit; the §5 proof block moves between 93 and 110
  words depending on whether G2 ships, and both numbers must be stated.
- Watch for regressions from the Brand Director's edits: a palette change invalidates
  `IDENTITY.md` §6.4's table, `LANDING_SPEC.md`'s token-mapping table, and every ratio quoted in
  `design-system.css`'s comments. `contrast.py` is the arbiter; run it.
- The one thing I could not test and neither could anyone else in this fleet: **whether a buyer
  cares which modification his contract locked** (OFFER §11.3 Q7). It is the whole differentiator
  and it is a hypothesis. LANDING_SPEC's A/B #1 and the `modification_pin_used` event are the
  cheapest way to learn it — make sure they survive iteration.

---

## Round 2 — re-review after `REVIEW_RESPONSE.md` (2026-09-03)

**Outcome: signed for wave 2.** 0 blocking · 1 major open (M19, orchestrator's file) · 2 minor open
(M12-residual and m5, identity author's files, both released by the arbitration's file freeze).
The re-review is the section at the top of `REVIEW.md`; round 1 is preserved below it unchanged so
the two can be diffed.

**How I re-checked, and what it cost.** Not by reading the response — by re-running the gates and
grepping the current documents for the *old* text. The four cheapest, highest-value checks:

- `../scripts/identity-distinctness.py` → exit 0 (this is the file that closes B7; the Brand
  Director pinned WageLens unchanged and moved Certly and StateReady off the shared face and ground).
- `identity/contrast.py` → exit 0, still 72/72, confirming WageLens's palette really was untouched.
- `grep "Start free"` and `grep "free week"` → hits only inside the prohibitions and the notes
  recording the removal. **Grepping for the old string is faster and more honest than reading the
  new one**: a fix that missed a file shows up immediately.
- Re-added the landing word budget by hand (55+83+53+117+94+43 = 445 ≤ 450). Per-section budgets
  moved; the ceiling did not. That is the number an author is most tempted to quietly raise.

**Lesson worth keeping.** The response's own §5 ("what the reviewer should re-check, and where") made
this round perhaps three times faster, and I could verify every claim in it. A changelog that maps
each finding to the exact section it was fixed in is the single most useful thing an iterating author
can produce — ask for it in the first review next time, as part of the format.

**Second lesson.** Two of my findings were fixed *differently* and both answers were better than my
proposal (M2: reword the bonus rather than build the importer; M9: reword the Audit Binder rather
than grow an S spec an L-shaped merge step). A reviewer's required-change column should name the
constraint, not the implementation — the author is closer to the cost.

**Carried forward, and routed rather than waived:** M19 to the orchestrator (one row in
`PREREQUISITES.md` P7); M12-residual and m5 to the identity author, in one pass with `contrast.py`
re-run. Plus two build-order conditions I will check at the wave-2 review: capture
`kb-samples/sam-wd-detail-TX20260253-rev0.json` before WL-13's first commit (every offline test that
proves the differentiator runs on the mock), and build against `--wl-*` tokens only, because
WageLens is now *pinned* by the arbitration and its tokens are load-bearing for two sibling apps.
