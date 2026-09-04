#!/usr/bin/env python3
"""Accept a detected source drift as "no change that matters", in ONE reviewed action.

Why this script exists (wave-1b review, finding B11):

    refresh_sources.py compares today's hash against the baseline in kb-data/_sources.json.
    Resolving a drift item as `no_change` in /admin/kb without moving that baseline means the daily
    cron re-detects the identical drift tomorrow, and every day after, on the item class that is by
    far the most common (a typo fix, a re-order, a re-theme). The queue then cries wolf forever and
    is abandoned in week one.

    But moving the baseline ALONE breaks gate G10 in validate.py, which asserts that every hash a
    record's provenance claims is a hash the baseline actually measured. So both writes have to
    happen together, atomically, as one command that a human runs and reviews as one commit.

What it does NOT do, deliberately:

  * it never changes a value, a status, a confidence or a last_verified date. A page that changed
    in a way that changes what we tell a customer is a `corrected` resolution, which is a repo edit
    through build_records -> validate -> verify, not this script.
  * it never runs from the app. The runtime's only write is a kbDriftItem (specs/14 invariant 5).

Usage:
    python3 kb-scripts/accept_drift.py --source-id tx.tdlr.acr_renew --note "board re-themed"
    python3 kb-scripts/accept_drift.py --source-id ... --dry-run
    python3 kb-scripts/accept_drift.py --source-id ... --from-file captured.html   # offline/test
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_kb import (ROOT, KB_DATA, fetch, normalise, content_hash,          # noqa: E402
                    load_records, walk_sourced_values)

BASELINE_FILE = KB_DATA / "_sources.json"
HISTORY_DIR = KB_DATA / "_history"

# Bounded excerpts of the normalised text, stored alongside the hash so that specs/14's word-level
# diff screen can be built at all (wave-1b M16). A hash says THAT something changed and nothing
# about WHAT.
EXCERPT_CHARS = 4000


def excerpts(text: str) -> dict:
    return {
        "normalised_head": text[:EXCERPT_CHARS],
        "normalised_tail": text[-EXCERPT_CHARS:] if len(text) > EXCERPT_CHARS else "",
    }


def host_of(url: str) -> str:
    return url.split("//", 1)[-1].split("/", 1)[0].lower()


def citing_values(rec: dict, source_url: str) -> list[str]:
    """Json paths of the SourcedValues in `rec` that actually cite `source_url`.

    This is the coupling G10 is scoped to: a record may list a page in its provenance that it read
    during authoring and hung no customer-facing value on. When such a page changes, nothing we show
    a customer moved with it.
    """
    return [jp for jp, v in walk_sourced_values(rec) if v.get("source_url") == source_url]


def accept(source_id: str, note: str, resolver: str, dry_run: bool,
           from_file: Path | None = None) -> int:
    if not BASELINE_FILE.exists():
        print("no baseline; run refresh_sources.py --write-baseline first", file=sys.stderr)
        return 2
    baseline_doc = json.loads(BASELINE_FILE.read_text())
    baseline = baseline_doc["sources"]
    entry = baseline.get(source_id)
    if entry is None:
        print(f"unknown source_id {source_id!r}; not in {BASELINE_FILE}", file=sys.stderr)
        return 2

    url = entry["url"]
    old_hash = entry.get("content_sha256")

    if from_file is not None:
        raw = from_file.read_bytes()
        status, ctype = 200, "text/html"
    else:
        status, raw, ctype = fetch(url)
    if status != 200 or not raw:
        print(f"UNREACHABLE {source_id} http={status} — refusing to accept a drift we cannot read",
              file=sys.stderr)
        return 1

    text = normalise(raw, ctype)
    new_hash = content_hash(text)

    if new_hash == old_hash:
        print(f"no drift: {source_id} already at {new_hash[:12]}. Nothing to accept.")
        return 0

    today = dt.date.today().isoformat()

    # --- who cites it -------------------------------------------------------------------------
    record_writes: list[tuple[Path, dict, list[str]]] = []
    for path, rec in load_records():
        srcs = rec.get("provenance", {}).get("sources", [])
        if not any(s["source_id"] == source_id for s in srcs):
            continue
        cites = citing_values(rec, url)
        record_writes.append((path, rec, cites))

    print(f"ACCEPT {source_id}")
    print(f"   {url}")
    print(f"   {old_hash[:12] if old_hash else '(none)'} -> {new_hash[:12]}   "
          f"({len(text)} normalised chars)")
    if not record_writes:
        print("   no record cites this source in its provenance")
    for path, rec, cites in record_writes:
        print(f"   record {rec['record_id']:<16} provenance hash rewritten; "
              f"{len(cites)} value(s) cite this page")
    if dry_run:
        print("   --dry-run: nothing written")
        return 0

    # --- write 1: the baseline ------------------------------------------------------------------
    entry.update({
        "fetched_at": today,
        "http_status": status,
        "bytes": len(raw),
        "content_sha256": new_hash,
        "normalised_chars": len(text),
        **excerpts(text),
    })
    entry.pop("error", None)
    BASELINE_FILE.write_text(json.dumps(baseline_doc, indent=2) + "\n")

    # --- write 2: every citing record's provenance, plus one history line -----------------------
    HISTORY_DIR.mkdir(exist_ok=True)
    for path, rec, cites in record_writes:
        for s in rec["provenance"]["sources"]:
            if s["source_id"] == source_id:
                s["content_sha256"] = new_hash
        path.write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        line = {
            "kind": "source_hash_accepted",
            "record_id": rec["record_id"],
            "source_id": source_id,
            "url": url,
            "previous_sha256": old_hash,
            "content_sha256": new_hash,
            "citing_value_paths": cites,
            "accepted_on": today,
            "accepted_by": resolver,
            "note": note,
        }
        with (HISTORY_DIR / f"{rec['record_id']}.jsonl").open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(line, ensure_ascii=False) + "\n")

    print(f"   written: baseline + {len(record_writes)} record(s) + history")
    print("   now run: python3 kb-scripts/validate.py     (it must exit 0 before you commit)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source-id", required=True)
    ap.add_argument("--note", default="", help="why this change does not change what we tell a customer")
    ap.add_argument("--resolver", default="founder")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--from-file", type=Path, help="read the page from a local file (tests, offline)")
    args = ap.parse_args()
    if not args.note and not args.dry_run:
        print("--note is required: an acceptance with no reason is an unreviewed acceptance",
              file=sys.stderr)
        return 2
    return accept(args.source_id, args.note, args.resolver, args.dry_run, args.from_file)


if __name__ == "__main__":
    raise SystemExit(main())
