#!/usr/bin/env python3
"""Tests for the drift-acceptance fix (wave-1b B11 / M16, specs/14 AC6, AC6b, AC6c).

Runs entirely on a throw-away copy of the real tree under /tmp: it never fetches the network and
never writes to kb-data/. Four assertions, each one of them a thing the wave-1 design got wrong:

  1  ACCEPT MOVES BOTH HASHES        the baseline AND every citing record's provenance, together,
                                     so the daily cron stops re-detecting the same drift (AC6)
  2  HALF AN ACCEPT FAILS G10        suppress the record write and validate.py must fail — the
                                     proof the two writes are actually coupled (AC6b)
  3  UNCITED SOURCE IS A WARNING     a baseline hash change on a page no value cites no longer
                                     breaks the build (AC6c, the G10 scoping)
  4  HISTORY IS WRITTEN              one _history/{record_id}.jsonl line per record per acceptance,
                                     which is what ontology/id-grammar.md promises (M17)
  5  --dry-run WRITES NOTHING

    python3 kb-scripts/test_accept_drift.py
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC_ROOT = HERE.parent

FAILURES: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    print(("  ok   " if cond else "  FAIL ") + name + (f"  — {detail}" if detail and not cond else ""))
    if not cond:
        FAILURES.append(name)


def build_tree(tmp: Path) -> Path:
    """A minimal but real tree: the actual scripts and ontology, one real record, one baseline."""
    root = tmp / "tree"
    (root / "kb-scripts").mkdir(parents=True)
    (root / "kb-data").mkdir()
    shutil.copytree(SRC_ROOT / "ontology", root / "ontology")
    for f in ("lib_kb.py", "validate.py", "accept_drift.py", "refresh_sources.py"):
        shutil.copy(SRC_ROOT / "kb-scripts" / f, root / "kb-scripts" / f)

    rec = json.loads((SRC_ROOT / "kb-data" / "tx-hvac.json").read_text())
    # Add one provenance source that NO value cites — a board index page read during authoring.
    # tx-hvac happens to hang a value on every page it lists, so the G10-scoping case has to be
    # constructed. It is a real shape: KNOWLEDGE_BASE.md's own source list carries background pages.
    template = dict(rec["provenance"]["sources"][0])
    template.update({
        "source_id": "tx.tdlr.index_background",
        "url": "https://www.tdlr.texas.gov/",
        "title": "TDLR home (background, no value cites it)",
        "content_sha256": "a" * 64,
    })
    rec["provenance"]["sources"].append(template)
    (root / "kb-data" / "tx-hvac.json").write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")

    # A baseline holding exactly this record's provenance sources, plus one page nothing cites.
    baseline = {"_comment": "test baseline", "generated_at": "2026-09-03T00:00:00+00:00", "sources": {}}
    for s in rec["provenance"]["sources"]:
        baseline["sources"][s["source_id"]] = {
            "source_id": s["source_id"], "url": s["url"], "title": s.get("title", ""),
            "kind": s.get("kind", "board_page"), "fetched_at": "2026-09-03", "http_status": 200,
            "bytes": 1000, "content_sha256": s["content_sha256"], "normalised_chars": 900,
        }
    (root / "kb-data" / "_sources.json").write_text(json.dumps(baseline, indent=2) + "\n")
    return root


def pick_sources(root: Path) -> tuple[str, str]:
    """Return (a source id some value cites, a source id no value cites)."""
    rec = json.loads((root / "kb-data" / "tx-hvac.json").read_text())
    sys.path.insert(0, str(root / "kb-scripts"))
    cited_urls = set()

    def walk(node):
        if isinstance(node, dict):
            if "value" in node and "status" in node and "confidence" in node:
                if node.get("source_url"):
                    cited_urls.add(node["source_url"])
                return
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
    walk(rec)
    cited = uncited = None
    for s in rec["provenance"]["sources"]:
        if s["url"] in cited_urls and cited is None:
            cited = s["source_id"]
        elif s["url"] not in cited_urls and uncited is None:
            uncited = s["source_id"]
    return cited, uncited


def run(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(root / "kb-scripts" / args[0]), *args[1:]],
                          capture_output=True, text=True, cwd=str(root))


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        root = build_tree(tmp)
        cited_id, uncited_id = pick_sources(root)
        page = tmp / "page.html"
        page.write_text("<html><body><p>the board re-themed this page</p></body></html>")

        print(f"tree: {root}\ncited source:   {cited_id}\nuncited source: {uncited_id}\n")

        base = run(root, "validate.py")
        check("baseline tree validates (exit 0)", base.returncode == 0, base.stdout[-400:])

        # ---- 5. dry run writes nothing --------------------------------------------------------
        before = (root / "kb-data" / "_sources.json").read_text()
        rec_before = (root / "kb-data" / "tx-hvac.json").read_text()
        dry = run(root, "accept_drift.py", "--source-id", cited_id, "--dry-run",
                  "--from-file", str(page))
        check("--dry-run exits 0", dry.returncode == 0, dry.stderr[-300:])
        check("--dry-run writes no baseline", (root / "kb-data" / "_sources.json").read_text() == before)
        check("--dry-run writes no record", (root / "kb-data" / "tx-hvac.json").read_text() == rec_before)

        # ---- 2. half an accept fails G10 ------------------------------------------------------
        #    the baseline moves, the record does not — exactly what "resolve as no_change and
        #    rewrite the baseline" would do on its own.
        doc = json.loads(before)
        doc["sources"][cited_id]["content_sha256"] = "0" * 64
        (root / "kb-data" / "_sources.json").write_text(json.dumps(doc, indent=2) + "\n")
        half = run(root, "validate.py")
        check("baseline-only rewrite of a CITED source FAILS the build (G10)", half.returncode != 0)
        check("...and the failure names G10 and the citing values",
              "G10 FAIL" in half.stdout and "value(s) cite it" in half.stdout, half.stdout[-500:])

        # ---- 3. uncited source: warning, not failure ------------------------------------------
        (root / "kb-data" / "_sources.json").write_text(before)
        if uncited_id:
            doc = json.loads(before)
            doc["sources"][uncited_id]["content_sha256"] = "1" * 64
            (root / "kb-data" / "_sources.json").write_text(json.dumps(doc, indent=2) + "\n")
            unc = run(root, "validate.py", "-v")
            check("baseline rewrite of an UNCITED source does not break the build",
                  unc.returncode == 0, unc.stdout[-500:])
            check("...and it is still reported as a G10 warning naming accept_drift.py",
                  "G10 WARN" in unc.stdout and "accept_drift.py" in unc.stdout, unc.stdout[-700:])
            (root / "kb-data" / "_sources.json").write_text(before)
        else:
            print("  skip  no uncited provenance source in this record")

        # ---- 1 + 4. the real thing ------------------------------------------------------------
        ok = run(root, "accept_drift.py", "--source-id", cited_id, "--note", "board re-themed",
                 "--resolver", "test", "--from-file", str(page))
        check("accept_drift exits 0", ok.returncode == 0, ok.stderr[-400:])

        newdoc = json.loads((root / "kb-data" / "_sources.json").read_text())
        newrec = json.loads((root / "kb-data" / "tx-hvac.json").read_text())
        new_hash = newdoc["sources"][cited_id]["content_sha256"]
        rec_hash = next(s["content_sha256"] for s in newrec["provenance"]["sources"]
                        if s["source_id"] == cited_id)
        check("baseline hash moved", new_hash != json.loads(before)["sources"][cited_id]["content_sha256"])
        check("record provenance hash moved WITH it", rec_hash == new_hash)
        check("normalised excerpts stored for the diff screen (M16)",
              "normalised_head" in newdoc["sources"][cited_id])
        after = run(root, "validate.py")
        check("validate.py still exits 0 after a full acceptance", after.returncode == 0,
              after.stdout[-500:])

        hist = root / "kb-data" / "_history" / "tx.hvac.jsonl"
        check("_history/tx.hvac.jsonl written (M17)", hist.exists())
        if hist.exists():
            lines = [json.loads(l) for l in hist.read_text().splitlines() if l.strip()]
            check("exactly one history line", len(lines) == 1, str(len(lines)))
            check("history line carries old hash, new hash, date, resolver and note",
                  all(lines[0].get(k) for k in ("previous_sha256", "content_sha256", "accepted_on",
                                                "accepted_by", "note")))

        # ---- and no value was touched ---------------------------------------------------------
        def values_of(d):
            out = []

            def walk(n, t=""):
                if isinstance(n, dict):
                    if "value" in n and "status" in n and "confidence" in n:
                        out.append((t, json.dumps(n.get("value")), n.get("status"),
                                    n.get("confidence"), n.get("last_verified")))
                        return
                    for k, v in n.items():
                        walk(v, f"{t}.{k}")
                elif isinstance(n, list):
                    for i, v in enumerate(n):
                        walk(v, f"{t}[{i}]")
            walk(d)
            return out
        check("no value, status, confidence or last_verified was changed",
              values_of(json.loads(rec_before)) == values_of(newrec))

    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILURE(S): " + ", ".join(FAILURES))
        return 1
    print("all assertions passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
