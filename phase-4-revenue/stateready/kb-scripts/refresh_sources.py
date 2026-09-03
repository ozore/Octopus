#!/usr/bin/env python3
"""Fetch every source page and store a content hash, so drift can be detected.

Two jobs, one script:

  --write-baseline   fetch everything and (re)write kb-data/_sources.json. Run when a record is
                     authored or after a human has reviewed a real change.
  (default)          fetch everything, compare against the stored baseline, print a report and
                     exit non-zero if anything drifted. This is what the daily Vercel cron calls.

Drift NEVER auto-publishes and never edits a record. It opens a review item. A state board
rewriting a fee page mid-quarter is exactly the moment when an automatic summariser would ship a
wrong renewal fee to a paying customer, which is the failure mode this whole product exists to
prevent (same reasoning as CORPUS_DESIGN.md §3.7, property 2).

Usage:
    python3 kb-scripts/refresh_sources.py --write-baseline
    python3 kb-scripts/refresh_sources.py                     # drift check
    python3 kb-scripts/refresh_sources.py --json              # machine-readable report
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_kb import ROOT, KB_DATA, fetch, normalise, content_hash          # noqa: E402

SOURCES_FILE = ROOT / "kb-scripts" / "sources.json"
BASELINE_FILE = KB_DATA / "_sources.json"
POLITE_DELAY_S = 1.5          # one request every 1.5s per run; never parallel. These are small
                              # state agencies, not CDNs.


def run(sources: list[dict]) -> dict:
    today = dt.date.today().isoformat()
    out = {}
    for i, src in enumerate(sources):
        status, body, ctype = fetch(src["url"])
        entry = {
            "source_id": src["source_id"],
            "url": src["url"],
            "title": src.get("title", ""),
            "kind": src["kind"],
            "fetched_at": today,
            "http_status": status,
            "bytes": len(body),
        }
        if status == 200 and body:
            text = normalise(body, ctype)
            entry["content_sha256"] = content_hash(text)
            entry["normalised_chars"] = len(text)
        else:
            entry["content_sha256"] = None
            entry["error"] = body[:200].decode("utf-8", "replace") if body else f"http {status}"
        out[src["source_id"]] = entry
        if i < len(sources) - 1:
            time.sleep(POLITE_DELAY_S)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-baseline", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--only", help="comma-separated source_ids")
    args = ap.parse_args()

    sources = json.loads(SOURCES_FILE.read_text())["sources"]
    if args.only:
        wanted = set(args.only.split(","))
        sources = [s for s in sources if s["source_id"] in wanted]

    current = run(sources)

    if args.write_baseline:
        KB_DATA.mkdir(exist_ok=True)
        BASELINE_FILE.write_text(json.dumps({
            "_comment": "Baseline content hashes. Written by kb-scripts/refresh_sources.py "
                        "--write-baseline. Compared daily; a mismatch opens a review item, it "
                        "never edits a record.",
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "sources": current,
        }, indent=2) + "\n")
        ok = sum(1 for e in current.values() if e["content_sha256"])
        print(f"baseline written: {ok}/{len(current)} sources hashed -> {BASELINE_FILE}")
        for e in current.values():
            if not e["content_sha256"]:
                print(f"  UNREACHABLE {e['source_id']} http={e['http_status']} {e['url']}")
        return 0 if ok else 1

    if not BASELINE_FILE.exists():
        print("no baseline; run with --write-baseline first", file=sys.stderr)
        return 2
    baseline = json.loads(BASELINE_FILE.read_text())["sources"]

    drifted, unreachable, unchanged, new = [], [], [], []
    for sid, entry in current.items():
        base = baseline.get(sid)
        if base is None:
            new.append(sid)
        elif not entry["content_sha256"]:
            unreachable.append((sid, entry["http_status"], entry.get("error", "")))
        elif entry["content_sha256"] != base.get("content_sha256"):
            drifted.append((sid, base.get("content_sha256", "")[:12], entry["content_sha256"][:12], entry["url"]))
        else:
            unchanged.append(sid)

    if args.json:
        print(json.dumps({"drifted": drifted, "unreachable": unreachable,
                          "unchanged": len(unchanged), "new": new}, indent=2))
    else:
        print(f"unchanged {len(unchanged)}  drifted {len(drifted)}  unreachable {len(unreachable)}  new {len(new)}")
        for sid, was, now, url in drifted:
            print(f"  DRIFT   {sid}  {was} -> {now}\n          {url}")
        for sid, code, err in unreachable:
            print(f"  UNREACH {sid}  http={code} {err[:90]}")
        for sid in new:
            print(f"  NEW     {sid} (not in baseline)")
    return 1 if (drifted or unreachable) else 0


if __name__ == "__main__":
    raise SystemExit(main())
