# `outbound/wagelens/` memory (per app)

**Agent:** Outbound Copywriter, phase-4 fleet, wave 3. **Date:** 2026-09-04.
**Read `outbound/CLAUDE.md` first** (engine memory, shared by the three apps). This file is about
the WageLens copy, the segment map, the playbook and the support templates. Nothing here was sent.

---

## 1. Rules confirmed, and the case that forced each

- **Only `{{fact.opening}}` may appear bare; every other fact sits inside `{{#if fact.x}}...{{/if}}`.**
  Case: 52 rows have no `state` and 76 no `city`. A bare `{{fact.state}}` in a subject raises
  `MissingVariable` on 52 rows, and an all-conditional subject renders empty and is blocked as
  `empty_subject`. Subjects are therefore `...your county{{#if fact.state}} in {{fact.state}}{{/if}}`.
- **Conditionals go inline, with the space inside the block.** Case: a conditional on its own line
  inside a paragraph leaves `\n\n` when removed, `tidy()` keeps two newlines, and the paragraph splits.
  `text.{{#if fact.x}} More.{{/if}}` leaves nothing behind.
- **The sign-off is one line.** Case: `compose.wrap_text()` joins the lines of a paragraph, so a
  two-line sign-off became "Jane Doe WageLens, a TheVillage company". Now
  `{{sender.name}}, {{app}}, a {{company}} company`; all three exist in `build_context()`.
- **`{{fact.trades}}` is banned in WageLens copy.** Case: 42 GC rows render it as
  `004 (2025-04-17) work` because `_trades()` reads award numbers in `notes` as NAICS labels
  (`REQUESTS.md` R3). The old `plain-intro` step 3 used it; removed.
- **Word limits are measured on the rendered body, twice.** Case: with `OUTBOUND_FROM_NAME` unset the
  placeholder is four words longer than a real name and pushed three steps over the limit. The copy
  now holds under 170/110/110/70 with a two-word name and still holds with the placeholder.
- **The product is `{{app}}` in sequences and a literal "WageLens" in `support/` and in the `PLAYBOOK.md` scripts.** Case: the first playbook draft put `{{app}}` inside pasteable scripts, which the founder would have pasted verbatim; the engine renders sequences only. Sequences follow
  `display_name` in `config.json` (P11 rename is one line); support bodies are pasted by hand and need
  a find-and-replace.
- **No refund sentence anywhere.** G2 does not ship until counsel signs (`OFFER.md` section 5.2).
  `grep -ri "refund\|guarantee\|start free" outbound/wagelens/sequences/` must print nothing.
  `support/refund-request.md` case 2 says what we will check, never what we will pay.
- **Only the offer's numbers.** $99 and $79, $990 and $790, day 15, two Fridays, 55 minutes, about
  190 hours at four jobs, $1,628 to $3,196 for metered plans (all `OFFER.md` sections 6 and 7),
  29 CFR 1.6 and 5.5. Never the banned per-violation penalty figure (`phase-1-ideation/ERRATA.md` E3). Case: `OFFER.md` section 9
  says four jobs are "most of a working week every year"; 208 forms at 55 minutes is 190.7 hours,
  about five working weeks, so the email says "about 190 hours a year" instead.
- **Organisation-level only.** "Hello," and the organisation's public facts; no names, no
  "Hi {first name}", no InMail, no connection requests (PLAYBOOK section 8).
- **No em or en dashes anywhere.** the dash counter in section 5 must print 0 (`grep -P` on code points fails in this container's locale).
- **The scratchpad is shared with sibling agents.** Case: a StateReady agent overwrote
  `render_check.py` between my write and my run. WageLens scratch files live in
  `scratchpad/wagelens-outbound/` and are prefixed `wl_`.
- **`state-pw` says the state-forms limit in the first sentence**, before the ask, because
  `OFFER.md` Q6 says to state it rather than let them find out in week two.

## 2. What worked

- One writer script (`wl_write_sequences.py`) with shared blocks (ASK, TRIAL, CONFORMANCE,
  MODIFICATION, MOD_ASK, BREAKUP): a wording fix lands in all six families at once.
- Rendering all six sequences for all 1,769 rows, not only the rows each is mapped to, so a founder
  remap can never surface a `MissingVariable` later. 42,456 renders, 0 missing.
- A `sequence_map` of 24 explicit needles and no `contractor` catch-all: a future segment falls to
  `plain-intro` and is listed in the report instead of guessed. Order matters: the certified,
  state-pw, registry, GC and highway needles come before the trade needles because "contractor"
  appears in most segments and `sequence_for()` takes the first hit.
- End-to-end `plan` and `compose` against a copy of the tree under `OUTBOUND_ROOT`: 20 drafts,
  0 blocking, 0 warnings, 0 failures, with the four env values set to example strings.

## 3. What failed, and what I changed

- First pass: `godfather-gc/01` at 183 words, `godfather-trade/02` at 127, `state-pw/01` at 176.
  Split CONFORMANCE into a core sentence plus an optional pay sentence, trimmed MODIFICATION,
  replaced "the link to it on sam.gov" with "the sam.gov link".
- A string-replace patch to the writer asserted on a mismatched line wrap and aborted before writing,
  so the next check ran on the old copy and I nearly reported stale numbers. Now the writer is
  rewritten whole, never patched.
- `godfather-certified/01` opened "I saw your SBE certification in New Jersey. When one of those
  jobs..." with nothing for "those jobs" to refer to. Now "When certified work carries federal money".
- `PLAYBOOK.md` first draft: 2,566 words outside fenced blocks; trimmed to under 2,500.

## 4. Mistakes not to repeat

- Do not put a conditional on its own line inside a paragraph.
- Do not use `{{org.name}}` in a subject; "'Asta' Roofing & Construction, LLC" in a subject line
  reads as mail merge.
- Do not measure word counts with only one from-name condition.
- Do not write scratch files at the scratchpad root.
- Do not use `fact.trades` until `REQUESTS.md` R3 is fixed.
- Do not paraphrase G2, even in a support template, even to say we will "make it right".
- Do not route by fact in your head: `sequence_for()` sees `segment` only (`REQUESTS.md` R2).

## 5. Verification commands (exact)

```bash
# from the repository root
SP=/tmp/claude-0/-home-user-Octopus/0cfa182f-b508-5f66-ab86-286254536fd0/scratchpad/wagelens-outbound
python3 $SP/wl_write_sequences.py                                  # rewrite all 24 step files
OUTBOUND_FROM_NAME="Jane Doe" python3 $SP/wl_render_check.py       # 42,456 renders, 0 missing, limits
python3 $SP/wl_render_check.py                                     # same with the placeholder name
# end to end, without touching the real tree
rm -rf $SP/root && mkdir -p $SP/root && cp -r outbound/wagelens $SP/root/wagelens && rm -rf $SP/root/wagelens/plans/* $SP/root/wagelens/drafts/*
OUTBOUND_ROOT=$SP/root OUTBOUND_FROM_NAME="Jane Doe" OUTBOUND_FROM_ADDRESS="jane@example.test" \
OUTBOUND_POSTAL_ADDRESS="1 Example St, Example, NY 10001" OUTBOUND_UNSUBSCRIBE_URL="https://example.test/unsubscribe" \
python3 -m outbound.engine.cli wagelens plan --date 2026-09-08 --json
OUTBOUND_ROOT=$SP/root OUTBOUND_FROM_NAME="Jane Doe" OUTBOUND_FROM_ADDRESS="jane@example.test" \
OUTBOUND_POSTAL_ADDRESS="1 Example St, Example, NY 10001" OUTBOUND_UNSUBSCRIBE_URL="https://example.test/unsubscribe" \
python3 -m outbound.engine.cli wagelens compose --date 2026-09-08 --json
# hygiene
python3 -c "import pathlib; print(sum(1 for p in pathlib.Path('outbound/wagelens').rglob('*') if p.is_file() and p.suffix in ('.md', '.json') for ch in p.read_text() if ch in '\u2014\u2013'))"   # must print 0
grep -ri "refund\|guarantee\|start free\|per violation" outbound/wagelens/sequences/
python3 -m unittest discover -s outbound/engine -p 'test_*.py'    # 149 tests
```

If the scratchpad is gone, the checker is twelve lines of logic: load config, read the workbook,
`seq.list_sequences`, `compose.build_context(config, row)` per row, `seq.render_step` per step,
count `MissingVariable`, count words with `re.findall(r"\S+", body)`.

## 6. Findings that `report` will overwrite

`python3 -m outbound.engine.cli wagelens report` regenerates `REPORT.md` from the log, so the
wave-3 section there is a snapshot. The durable record is:

- Coverage by segment map: godfather-trade 785, godfather-gc 629, godfather-certified 244,
  state-pw 109, godfather-federal 2, plain-intro 0 (no segment falls to the default today).
- Rendering: 6 sequences x 1,769 rows x 4 steps = 42,456 renders, 0 `MissingVariable`, 0 unrendered
  braces, 0 blank artefacts, 0 dashes. Longest rendered bodies with a two-word from-name: step 1 at
  165 words (godfather-gc), steps 2 and 3 at 100, step 4 at 62; every subject under 60 characters.
- Founder decisions: `REPORT.md` section 6 (wave 3) and, if that is gone, the list at the end of
  `PLAYBOOK.md` section 11 plus `REQUESTS.md`.

## 7. Weekly log

One dated line per week from the founder or the next agent: sends, replies, positives,
determinations sent, trials, paid, and any copy change (one variable, which sequence, which step).

- 2026-09-04: built. 0 sent.
