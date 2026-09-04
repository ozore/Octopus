# `outbound/certly/` memory

**Agent:** Outbound Copywriter, phase-4 fleet, wave 3. **Date:** 2026-09-04.
**Scope:** this folder only. The engine's memory is `outbound/CLAUDE.md`; read that first, then this.
**State:** five sequences, a playbook, ten support templates, a rewritten `config.json`. Nothing sent.

## 1. Rules confirmed, and the case that forced each

- **Every fact except `fact.opening` sits behind `{{#if fact.x}}`.** The Certly workbook holds only
  `segment` (824/824), `location` (788), `state` (788), `city` (708), `source_list` (357) and
  `portfolio` (24). No `brands`, `locations`, `employees`, `trades` or `states_operated` exist for
  Certly, so a template that named one would render a hole for every row.
- **`fact.opening` is guaranteed but reads badly for Certly.** It falls back to
  "I have you down as a residential property management in Dallas, Texas" for 800 of 824 rows
  (`REQUESTS.md` R5). The four map-reached sequences build their own opening from `{{fact.segment}}`
  and `{{fact.location}}` ("I have you listed under X in Y") and only `plain-intro` uses `fact.opening`.
- **A removed conditional on its own line inside a paragraph splits the paragraph** (`tidy()` collapses
  three newlines to two). Put conditional lines at the start or end of a paragraph, never in the middle,
  and keep the mandatory sentence on its own line.
- **`{{sender.name}}` exists in the compose context** (`compose.build_context()` -> `sender.name`) and
  is used as the sign-off; the footer the engine appends carries `Certly, a TheVillage Company`
  (`config.json` `signature`). The name's placeholder is not a blocking check (`REQUESTS.md` R2).
- **Word budgets are counted on the rendered body with the longest facts,** not on the template: the
  segment-plus-location sentence alone reaches 25 words for "HOA / community association management in
  Colorado Springs, Colorado", and the portfolio line adds ten.
- **Delays are per step, not cumulative.** `send.next_action_date()` adds the *next* step's
  `delay_days` to the send day. `0, 4, 9, 16` therefore lands on day 0, 4, 13 and 29; partners
  `0, 14, 28` on day 0, 14 and 42, and the planner never selects step 4 for partners
  (`partner_max_step: 3`, verified: `sequence_finished=20`).
- **`sequence_map` is one dict for both workbooks, matched in insertion order.** "hoa" had to come before
  "association" (HOA rows contain the word), and "multifamily builder" replaced "builder" because
  "builders exchange / plan room" is a partner segment.
- **"Covered" never appears** as a status word, in any file here; nor "compliant" or "verified" as a
  claim. The one occurrence found was in an organisation's own name (`REQUESTS.md` R10).
- **No em or en dashes anywhere** in this folder. Two canonical OFFER.md texts contain em dashes; they
  are reproduced with a colon or comma and the substitution is declared (PLAYBOOK §13 F8).
- **The disclaimer texts (KB §F.1/F.2) are quoted verbatim or pointed at, never paraphrased.** The
  emails carry the one-line footer OFFER.md §11.1 itself uses. `apps/certly/tests/vocabulary.test.ts`
  scans only `apps/certly`, so quoting §F.1 verbatim in `support/not-legal-advice.md` and the playbook
  cannot fail that build; a paraphrase would still be a policy breach.

## 2. What worked

- Writing the opening as `{{#if fact.segment}}...{{#if fact.location}} in {{fact.location}}{{/if}}...{{/if}}`:
  nested conditionals resolve innermost first and every row renders a grammatical sentence.
- Trimming to budget by rendering every row and reading the maximum, not by counting the template.
- Proving cadence with `--adapter dryrun` on a scratch copy under `OUTBOUND_ROOT`, planning forward
  through 2026-11-02 for customers and 2026-12-01 for partners.

## 3. What failed, and what changed

- **The scratchpad is shared by the whole fleet.** A sibling agent overwrote `scratchpad/render_check.py`
  between my write and my run, and my check printed StateReady's segments. Everything now lives under
  `scratchpad/certly-wave3/`; use a unique subdirectory, always.
- **First drafts were 5 to 12 words over budget** in `01-initial.md` (gc, hoa, pm), `03-followup.md`
  (gc, pm) and `04-breakup.md` (all three). Cut the population claim ("most files have far more of the
  first than the second", which is a share with no denominator), "It is a starting point, not advice"
  to "A starting point, not advice", and "you keep it either way" to "you keep it".
- **`support/cancel.md` said "you are covered by the 30-day promise".** Rewritten; the grep is now part
  of the verification commands.

## 4. Mistakes not to repeat

- Do not put a number in an email that is not in OFFER.md or a source it cites. The vendor band in
  OFFER.md §11.1 has no fact behind it and was not invented.
- Do not run a partner batch on the same date as a customer batch until `REQUESTS.md` R1 lands.
- Do not use `{{org.name}}` in a subject: the longest names push past 60 characters.
- Do not edit `outbound/certly/workbook*.csv`, `suppression.csv`, `plans/` or `drafts/` by hand.
- Do not rely on `REPORT.md` to keep the wave-3 section (`REQUESTS.md` R8); §6 below is the copy.

## 5. Verification commands

```bash
# 1. engine tests (must stay 149 OK)
python3 -m unittest discover -s outbound/engine -p 'test_*.py'

# 2. render every sequence for every row of both workbooks; 0 MissingVariable, budgets, subjects, dashes, banned words
S=/tmp/claude-0/-home-user-Octopus/0cfa182f-b508-5f66-ab86-286254536fd0/scratchpad/certly-wave3
python3 $S/render_check.py          # source in §7 below if the scratchpad is gone

# 3. style greps (all must print nothing)
grep -rn $'\xe2\x80\x93\|\xe2\x80\x94' outbound/certly/sequences outbound/certly/support outbound/certly/PLAYBOOK.md outbound/certly/config.json
grep -rn -i "\bcovered\b\|\bcompliant\b\|\bverified\b" outbound/certly/sequences outbound/certly/support

# 4. end to end on a copy, never on the real tree
rm -rf $S/outbound && mkdir -p $S/outbound && cp -r outbound/certly $S/outbound/certly && rm -rf $S/outbound/certly/{drafts,plans}
export OUTBOUND_ROOT=$S/outbound OUTBOUND_FROM_NAME="Test Sender" OUTBOUND_FROM_ADDRESS="test@example.invalid" \
       OUTBOUND_POSTAL_ADDRESS="1 Test St, Testville, TS 00000" OUTBOUND_UNSUBSCRIBE_URL="https://example.invalid/unsubscribe"
python3 -m outbound.engine.cli certly plan --date 2026-09-14 && python3 -m outbound.engine.cli certly compose --date 2026-09-14
python3 -m outbound.engine.cli certly plan --partners --date 2026-09-15 && python3 -m outbound.engine.cli certly compose --partners --date 2026-09-15
unset OUTBOUND_ROOT
```

## 6. Wave-3 results (copy of the REPORT.md section, kept here because `report` overwrites that file)

- Sequences: `godfather-pm` (416 rows), `godfather-hoa` (196), `godfather-gc` (212), `partner-intro`
  (115 partner rows), `plain-intro` (fallback, 0 rows). Every segment in both workbooks is reached by the
  map; nothing falls to the default.
- Render proof: 939 rows x 5 sequences x 4 steps = 18,780 step renders, **0 `MissingVariable`**, 0
  unresolved syntax, 0 blank artefacts. Longest rendered bodies: initial 167/170, follow-ups 109/110,
  breakup 69/70. Longest subject 55 characters.
- End to end (scratch copy, test env values): customers 20 drafts, 0 blocked, 0 failed, 0 warnings;
  partners 20 drafts (3 email, 17 contact form), 0 blocked, 0 failed. Without env values the only
  blocks are the three placeholder checks. Cadence verified by dryrun: customers step 2 at +4, step 3
  at +9 (Sunday rolled to Monday), step 4 at +16, then `sequence_finished`; partners step 2 at +14,
  step 3 at +28, then `sequence_finished` with no fourth touch.
- Engine tests: 149 OK before and after.

## 7. The render check, in case the scratchpad is gone

Load `config`, `list_sequences("certly")`, `load_sequence` for each; for each row of `workbook.csv` and
`workbook-partners.csv` build `compose.build_context(config, row)` (with `OUTBOUND_FROM_NAME` set so the
sign-off counts as two words) and call `sequences.render_step(step, context)` for all four steps of
every sequence. Count `MissingVariable`, `len(body.split())` against 170/110/110/70, `len(subject)`
against 60, a search for U+2013 and U+2014, `\b(covered|verified|compliant)\b`, and `compose.BLANK_ARTEFACTS` in
the body. Print the per-sequence coverage from `sequences.sequence_for(config, row)` per workbook.
