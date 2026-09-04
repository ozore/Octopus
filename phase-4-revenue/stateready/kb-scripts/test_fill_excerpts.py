#!/usr/bin/env python3
"""Tests for refresh_sources.py --fill-excerpts (wave-1b review, finding N1).

The mode exists to backfill the diff-screen excerpts specs/14 reads (M16) WITHOUT doing what
`--write-baseline` would do — re-fetch everything and accept whatever it finds, which is a bulk
unreviewed publish. So the thing to prove is not that it fills; it is that it REFUSES.

Runs entirely on a throw-away copy of the real scripts under /tmp, with pages read from a directory
(`--from-dir`) instead of the network: no fetch, no writes to kb-data/. Assertions:

  1  IT FILLS AN UNCHANGED SOURCE          head and tail appear, from the real normalised text
  2  IT REFUSES A DRIFTED SOURCE           the entry is byte-identical afterwards: no excerpts, no
                                           new hash, no new fetched_at — the finding's whole point
  3  IT REFUSES AN UNREACHABLE SOURCE      "we could not read it" is not "it is unchanged"
  4  IT EXITS NON-ZERO WHEN IT REFUSED     so CI cannot report success on a half-filled store
  5  NOTHING ELSE IN THE BASELINE MOVES    every key except the two excerpts is untouched, on every
                                           source, including the ones it filled
  6  --dry-run WRITES NOTHING
  7  IT NEVER WRITES A RECORD              kb-data/*.json is byte-identical after a fill
  8  A SECOND RUN IS A NO-OP               already-filled sources are reported, not rewritten
  9  validate.py STILL EXITS 0 AFTERWARDS

    python3 kb-scripts/test_fill_excerpts.py
"""
from __future__ import annotations

import importlib.util
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


def load_lib(root: Path):
    spec = importlib.util.spec_from_file_location("lib_kb_t", root / "kb-scripts" / "lib_kb.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


UNCHANGED = "<html><body><p>Renewal fee: $75. Expires 31 August.</p></body></html>"
MOVED = "<html><body><p>Renewal fee: $95. Expires 31 August.</p></body></html>"


def build_tree(tmp: Path) -> tuple[Path, Path]:
    """The real scripts, one real record, a baseline with no excerpts, and three captured pages."""
    root = tmp / "tree"
    (root / "kb-scripts").mkdir(parents=True)
    (root / "kb-data").mkdir()
    shutil.copytree(SRC_ROOT / "ontology", root / "ontology")
    for f in ("lib_kb.py", "validate.py", "accept_drift.py", "refresh_sources.py"):
        shutil.copy(SRC_ROOT / "kb-scripts" / f, root / "kb-scripts" / f)

    rec = json.loads((SRC_ROOT / "kb-data" / "tx-hvac.json").read_text())
    (root / "kb-data" / "tx-hvac.json").write_text(
        json.dumps(rec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lib = load_lib(root)
    stable_hash = lib.content_hash(lib.normalise(UNCHANGED.encode(), "text/html"))

    # Three sources, all with a stored hash and none with excerpts — the committed state the review
    # found (0 of 35 sources carried a "before").
    ids = ["src.unchanged", "src.moved", "src.unreachable"]
    sources = {"sources": [{"source_id": i, "url": f"https://www.tdlr.texas.gov/{i}",
                            "title": i, "kind": "board_page"} for i in ids]}
    (root / "kb-scripts" / "sources.json").write_text(json.dumps(sources, indent=2) + "\n")

    baseline = {"_comment": "test baseline", "generated_at": "2026-09-03T00:00:00+00:00", "sources": {}}
    # The record's own provenance sources, so gate G10 has something to check against and assertion
    # 9 means something. They are NOT in sources.json, so --fill-excerpts never looks at them —
    # which is itself the check that the mode only touches what it was asked to touch.
    for s in rec["provenance"]["sources"]:
        baseline["sources"][s["source_id"]] = {
            "source_id": s["source_id"], "url": s["url"], "title": s.get("title", ""),
            "kind": s.get("kind", "board_page"), "fetched_at": "2026-09-03", "http_status": 200,
            "bytes": 1000, "content_sha256": s["content_sha256"], "normalised_chars": 900,
        }
    for i in ids:
        baseline["sources"][i] = {
            "source_id": i, "url": f"https://www.tdlr.texas.gov/{i}", "title": i,
            "kind": "board_page", "fetched_at": "2026-09-03", "http_status": 200,
            "bytes": len(UNCHANGED), "content_sha256": stable_hash, "normalised_chars": 41,
        }
    (root / "kb-data" / "_sources.json").write_text(json.dumps(baseline, indent=2) + "\n")

    pages = tmp / "pages"
    pages.mkdir()
    (pages / "src.unchanged.html").write_text(UNCHANGED)
    (pages / "src.moved.html").write_text(MOVED)          # same source, different fee: real drift
    # src.unreachable: deliberately no file, which read_local reports as http 0
    return root, pages


def run(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(root / "kb-scripts" / args[0]), *args[1:]],
                          capture_output=True, text=True, cwd=str(root))


def entries(root: Path) -> dict:
    return json.loads((root / "kb-data" / "_sources.json").read_text())["sources"]


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        root, pages = build_tree(tmp)
        base_doc = (root / "kb-data" / "_sources.json").read_text()
        rec_before = (root / "kb-data" / "tx-hvac.json").read_text()
        before = json.loads(base_doc)["sources"]
        print(f"tree: {root}\n")

        # ---- 6. dry run writes nothing --------------------------------------------------------
        dry = run(root, "refresh_sources.py", "--fill-excerpts", "--dry-run",
                  "--from-dir", str(pages))
        check("--dry-run writes nothing",
              (root / "kb-data" / "_sources.json").read_text() == base_doc, dry.stdout[-300:])

        # ---- the real run ---------------------------------------------------------------------
        r = run(root, "refresh_sources.py", "--fill-excerpts", "--from-dir", str(pages))
        after = entries(root)

        # ---- 1. it fills the unchanged source --------------------------------------------------
        lib = load_lib(root)
        want = lib.normalise(UNCHANGED.encode(), "text/html")
        check("unchanged source gained normalised_head",
              after["src.unchanged"].get("normalised_head") == want, r.stdout[-400:])
        check("unchanged source gained normalised_tail (empty: the page is under 4,000 chars)",
              after["src.unchanged"].get("normalised_tail") == "")

        # ---- 2. it refuses the drifted source — THE assertion -----------------------------------
        check("DRIFTED source: no excerpts written",
              "normalised_head" not in after["src.moved"]
              and "normalised_tail" not in after["src.moved"])
        check("DRIFTED source: entry is byte-identical to before (hash, fetched_at, bytes, all of it)",
              after["src.moved"] == before["src.moved"],
              f"{before['src.moved']} != {after['src.moved']}")
        check("...and the report names it, does not touch it, and points at accept_drift.py",
              "DRIFT" in r.stdout and "NOT TOUCHED" in r.stdout and "accept_drift.py" in r.stdout,
              r.stdout[-500:])

        # ---- 3. it refuses the unreachable source ----------------------------------------------
        check("UNREACHABLE source: entry is byte-identical to before",
              after["src.unreachable"] == before["src.unreachable"])
        check("...and it is reported as unreachable, not as unchanged",
              "UNREACH" in r.stdout, r.stdout[-400:])

        # ---- 4. exit code ----------------------------------------------------------------------
        check("exits non-zero when anything was refused", r.returncode != 0, str(r.returncode))

        # ---- 5. nothing but the two excerpt keys moved, anywhere -------------------------------
        moved_keys = []
        for sid, entry in after.items():
            for k, v in entry.items():
                if k in ("normalised_head", "normalised_tail"):
                    continue
                if before[sid].get(k) != v:
                    moved_keys.append(f"{sid}.{k}")
            for k in before[sid]:
                if k not in entry:
                    moved_keys.append(f"{sid}.{k} (dropped)")
        check("no key other than the two excerpts changed on any source", not moved_keys,
              ", ".join(moved_keys))

        # ---- 7. no record was written ----------------------------------------------------------
        check("kb-data/tx-hvac.json is untouched",
              (root / "kb-data" / "tx-hvac.json").read_text() == rec_before)

        # ---- 8. a second run is a no-op --------------------------------------------------------
        again = run(root, "refresh_sources.py", "--fill-excerpts", "--from-dir", str(pages))
        check("second run reports the filled source as already done, and refills nothing",
              "already had excerpts 1" in again.stdout and "filled 0" in again.stdout,
              again.stdout[-300:])
        check("second run leaves the baseline byte-identical to the first run's output",
              entries(root) == after)

        # ---- 9. the tree still validates -------------------------------------------------------
        v = run(root, "validate.py")
        check("validate.py still exits 0", v.returncode == 0, v.stdout[-400:])

    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILURE(S): " + ", ".join(FAILURES))
        return 1
    print("all assertions passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
