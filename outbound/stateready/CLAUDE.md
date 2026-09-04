# `outbound/stateready/`: memory for the next agent

**Agent:** Outbound Copywriter, phase-4 wave 3. **Date:** 2026-09-04. Read `outbound/CLAUDE.md` first (engine memory); this file is the per-app layer. Nothing here was sent.

## 1. Rules confirmed, with the case that forced each

- **Cite only what `kb-data/` holds, and name the record.** OFFER §11's draft email cites Illinois (30 April) and California ($700/$1,050); neither state has a record. Both facts came out of every sequence. The facts that stayed, with their records: Texas HVAC 8 CE hours a year including one hour of Texas law (`tx.hvac`); Texas master electrician 4 hours, electrical contractor none, thirty business days to designate a replacement master (`tx.electrical`); North Carolina plumbing and heating expire 31 December with no grace period and no CE since 2012, electrical expires a year after issue with 8 hours a year, half in a classroom (`nc.plumbing`, `nc.hvac`, `nc.electrical`); Florida certified 31 August even years, registered odd years, registered only in named jurisdictions (`fl.hvac`, `fl.plumbing`, `fl.electrical`); Texas ACR reciprocity SC and GA only, per-location licensed contractor, late renewal 1.5x then 2x (`tx.hvac`); NC plumbing/heating board no reciprocity with any state (`nc.plumbing`); Texas electrical contractor licence no reciprocity (`tx.electrical`); NC electrical board ten formal agreements (`nc.electrical`). Do not add "half in a classroom" to a Texas sentence: that is NC.
- **Guarantees are OFFER §5.1 words only.** The Accuracy Guarantee and the Entry Pack Guarantee appear in `PLAYBOOK.md` §8, `support/refund-request.md` and `support/wrong-rule-report.md` as plain text without the source's bold markup; the words are unchanged. Nothing from §5.2 to §5.4 appears anywhere; the objection-7 script says only that we do not indemnify an outcome.
- **The free deliverable is the State Rulebook (OFFER §7 free rung), one state × one trade.** Not the paid Entry Pack, never the roster build. Every initial email says the coverage (TX, FL, NC) so a reply from an uncovered state is answered by `support/state-not-covered.md`, not by a refusal.
- **US spelling in anything a customer reads** (`license`), British in prose, per `PERSONA.md` §7; the existing `plain-intro` placeholder used `licence` in email copy and was rewritten. `grep -rn licence sequences/` must stay empty.
- **No em or en dashes anywhere.** Verified with a Python scan (the `grep -P \x{2014}` form exits 2 on this box; do not trust it).
- **Only `{{fact.opening}}` may stand outside a conditional.** Every other fact is inside `{{#if fact.x}}...{{/if}}` on its own line, so a removed block leaves no orphaned space or comma (`compose.BLANK_ARTEFACTS` is checked in the render proof).
- **Static subjects.** There is no `{{else}}`, so a conditional subject renders empty for rows without the fact and is blocked as `empty_subject`. Longest rendered subject is 44 characters.
- **`{{sender.name}}` is the only sender variable used.** It exists in `compose.build_context()`; with `OUTBOUND_FROM_NAME` unset it renders the placeholder unblocked (`REQUESTS.md` 2). The signature line "StateReady, a TheVillage Company" comes from `config.json` `signature` through the engine footer, so it is not repeated in the body.

## 2. What worked

- **A throwaway render proof over every row, not a sample.** 344 + 72 rows × 4 steps = 1,664 renders, zero `MissingVariable`. The worst-case word count per step is only visible when every conditional fires, and only three rows carry `states_operated`; a sample would have missed that the platform initial ran to 186 words on those three.
- **Substring `sequence_map` keyed on the distinctive word** (`platform`, `franchise`, `specialty multi-state`, `fast-growing independent`, `licence expediting`, `pe sponsor`, `trade association`, `exam prep`, `surety`, `field service software`). One key covers all six platform segments; no row in either workbook falls to `default_sequence`.
- **Running `plan`/`compose`/`approve`/`send --adapter dryrun` in a scratch copy under `OUTBOUND_ROOT`** found the shared-drafts-folder hazard (`REQUESTS.md` 1) before it could double-send.

## 3. What failed, and what changed

- **Two initial emails went over 170 words in the worst case:** `godfather-platform/01` at 186 (with `states_operated`) and `partner-intro/01` at 199. Cut one of two examples in the partner email, shortened the conditional line and the product sentence in the platform email. Now 164 and 161 at worst; every step is under its limit.
- **The partner `04-breakup.md` first carried a meta line** ("this file exists because the engine needs four steps"). If anyone ever raises `partner_max_step` it would be sent. Replaced with a harmless ordinary close; the never-sent fact lives in `PLAYBOOK.md` §9.
- **The first e2e run composed partners after customers on the same date** and the preview showed only partners. That is the engine behaviour, not a copy problem; the playbook now separates the days.
- **`grep -rnP "\x{2014}"` returned exit 2** (pattern error under this locale) and looked like "no dashes found". Replaced with a Python scan.

## 4. Mistakes not to repeat

- Do not paste a KB `source_title` into copy: the titles carry em dashes (every title has an em dash between the agency name and the programme name).
- Do not write "the board" for Texas plumbing as if it were TDLR; it is the Texas State Board of Plumbing Examiners (`tx.plumbing`), and its renewal cycle is medium-confidence, so no sequence cites a Texas plumbing renewal rule.
- Do not promise the CE-provider directory (S11, not shipped), a bond amount (none verified), a processing time (mostly unknown), or the roster build (S10). Do not mention capacity or scarcity.
- Do not run `report` and expect the wave-3 section of `REPORT.md` to survive: `report.py` rewrites the whole file. Re-append from the file history.
- Do not use the OFFER §11 ask ("the two states your last acquisition added") without the coverage sentence: 305 of 344 rows have no known covered state.

- Coverage sentence watch: `kb-data/oh-electrical.json`, `oh-hvac.json`, `oh-plumbing.json` appeared on 2026-09-04 from another agent, `publishable: false` (pass B not run). The day any record outside TX, FL and NC turns publishable, change the coverage line in the six `01-initial.md` files, `support/state-not-covered.md`, `PLAYBOOK.md` §1 and §7, and the fulfilment list; re-run the render proof.

## 5. Verification commands

`report` regenerates `REPORT.md` and drops the hand-written wave-3 section; if it is gone, it is in the file history and the essentials are here.

```bash
# 1. every sequence x every row of both workbooks: missing variables, word limits, subjects, artefacts
#    save the script below as <scratchpad>/render_check.py, then:
python3 <scratchpad>/render_check.py
#    expect: "TOTAL renders 1664, missing-variable count 0", every line OK, "rows falling to default ... 0"

# 2. end to end in a scratch copy, never in the real tree
S=<scratchpad>/e2e; rm -rf $S; mkdir -p $S/outbound; cp -r outbound/stateready $S/outbound/; rm -rf $S/outbound/stateready/plans $S/outbound/stateready/drafts
OUTBOUND_ROOT=$S/outbound python3 -m outbound.engine.cli stateready plan    --date 2026-09-08
OUTBOUND_ROOT=$S/outbound python3 -m outbound.engine.cli stateready compose --date 2026-09-08   # expect: 0 failed to render

# 3. no em or en dashes, no British spelling in customer copy
python3 -c "import pathlib;[print(p) for p in pathlib.Path('outbound/stateready').rglob('*') if p.is_file() and p.suffix in ('.md','.json') and any(c in p.read_text() for c in chr(8212)+chr(8211))]"
grep -rnE "licence|organisation|programme|cancelled" outbound/stateready/sequences outbound/stateready/support   # expect nothing

# 4. the engine is untouched
python3 -m unittest discover -s outbound/engine -p 'test_*.py'   # 149 tests
```

The render proof, verbatim:

```python
"""Throwaway render proof: every sequence x every row of both workbooks."""
import collections, csv, re, sys
sys.path.insert(0, "/home/user/Octopus")
from outbound.engine import compose as compose_mod
from outbound.engine import config as cfg_mod
from outbound.engine import sequences as seq_mod
from outbound.engine import workbook as wb

APP = "stateready"
config = cfg_mod.load_config(APP)
LIMITS = {1: 170, 2: 110, 3: 110, 4: 70}
DASHES = (chr(8212), chr(8211))

def words(text):
    return len(re.findall(r"\S+", text))

overall_missing = 0
overall_rendered = 0
for which in ("customers", "partners"):
    rows = wb.read_workbook(cfg_mod.workbook_path(APP, which))
    per_seq = collections.Counter()
    default_rows = []
    seg_to_seq = collections.defaultdict(set)
    cache = {}
    missing = []
    errors = []
    maxwords = collections.defaultdict(int)
    maxsubj = collections.defaultdict(int)
    artefacts = collections.Counter()
    rendered = 0
    for row in rows:
        name = seq_mod.sequence_for(config, row)
        per_seq[name] += 1
        seg_to_seq[row.get("segment", "")].add(name)
        if name == config["default_sequence"] and not any(
                k.lower() in (row.get("segment") or "").lower()
                for k in config["sequence_map"]):
            default_rows.append(row["org_id"])
        if name not in cache:
            cache[name] = seq_mod.load_sequence(APP, name, config)
        seq = cache[name]
        context = compose_mod.build_context(config, row)
        for step in seq.steps:
            try:
                subject, body = seq_mod.render_step(step, context)
            except seq_mod.MissingVariable as e:
                missing.append((row["org_id"], name, step.filename, e.name)); continue
            except seq_mod.SequenceError as e:
                errors.append((row["org_id"], name, step.filename, str(e))); continue
            rendered += 1
            key = (name, step.index)
            maxwords[key] = max(maxwords[key], words(body))
            maxsubj[key] = max(maxsubj[key], len(subject))
            for d in DASHES:
                if d in body or d in subject:
                    artefacts[f"dash:{name}/{step.filename}"] += 1
            for a in compose_mod.BLANK_ARTEFACTS:
                if a in body:
                    artefacts[f"{a.strip() or 'double-space'}:{name}/{step.filename}"] += 1
            if "{{" in body or "}}" in body or "{{" in subject:
                artefacts[f"braces:{name}/{step.filename}"] += 1
            if "[SENDER NAME PLACEHOLDER" not in body:
                artefacts[f"no-sender-line:{name}/{step.filename}"] += 1
    print(f"== {which}: {len(rows)} rows, {rendered} renders, {len(missing)} MissingVariable, {len(errors)} other errors")
    for s, n in per_seq.most_common():
        print(f"   {n:4d}  {s}")
    print(f"   rows falling to default ({config['default_sequence']}) with no map hit: {len(default_rows)}")
    for seg, seqs in sorted(seg_to_seq.items()):
        print(f"   segment {seg!r:50} -> {sorted(seqs)}")
    for key in sorted(maxwords):
        name, idx = key
        limit = LIMITS[idx]
        flag = "OK " if maxwords[key] < limit else "OVER"
        sflag = "OK " if maxsubj[key] < 60 else "LONG"
        print(f"   {flag} {name}/{idx}: max body words {maxwords[key]} (limit <{limit}); {sflag} max subject {maxsubj[key]} chars")
    for m in missing[:10]: print("   MISSING", m)
    for e in errors[:10]: print("   ERROR", e)
    for a, n in artefacts.items(): print("   ARTEFACT", a, n)
    overall_missing += len(missing); overall_rendered += rendered
print(f"TOTAL renders {overall_rendered}, missing-variable count {overall_missing}")
```
