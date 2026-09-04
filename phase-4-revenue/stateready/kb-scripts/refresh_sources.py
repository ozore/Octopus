#!/usr/bin/env python3
"""Fetch every source page and store a content hash, so drift can be detected.

Three jobs, one script:

  --write-baseline   fetch everything and (re)write kb-data/_sources.json. Run when a record is
                     authored or after a human has reviewed a real change.
  --fill-excerpts    fetch everything and write normalised_head / normalised_tail ONLY where the
                     re-fetched hash equals the stored one. A source that has moved is REPORTED and
                     left completely untouched. See below.
  (default)          fetch everything, compare against the stored baseline, print a report and
                     exit non-zero if anything drifted. This is what the daily Vercel cron calls.

Drift NEVER auto-publishes and never edits a record. It opens a review item. A state board
rewriting a fee page mid-quarter is exactly the moment when an automatic summariser would ship a
wrong renewal fee to a paying customer, which is the failure mode this whole product exists to
prevent (same reasoning as CORPUS_DESIGN.md §3.7, property 2).

Why --fill-excerpts exists (wave-1b review, finding N1). The excerpt store that specs/14's word-level
diff screen reads was implemented here and in accept_drift.py, and was empty: a hash tells you THAT a
page changed and nothing about WHAT, so the first drift against any source would have degraded the
diff screen exactly when it was first needed. The obvious remedy — re-run --write-baseline — is the
one thing the whole M14 design exists to prevent: it re-fetches everything and writes whatever it
finds, silently accepting every real change that has happened since the baseline was taken. That is a
bulk unreviewed publish.

--fill-excerpts is therefore constrained by construction:

  * it writes exactly two keys, normalised_head and normalised_tail, and only for a source whose
    re-fetched content_sha256 is IDENTICAL to the stored one. No hash, no fetched_at, no byte count,
    no error field, and never a record in kb-data/ — nothing that could carry a changed fact.
  * a source that has moved is refused, named in the report, and left byte-for-byte as it was. It is
    accept_drift.py's job (one reviewed action, both hashes together) or a correction's, never this
    script's.
  * an unreachable source is refused the same way, because "we could not read it" is not "it is
    unchanged".
  * it exits non-zero if anything drifted or was unreachable, so a CI run cannot report success on a
    half-filled store.

Usage:
    python3 kb-scripts/refresh_sources.py --write-baseline
    python3 kb-scripts/refresh_sources.py                     # drift check
    python3 kb-scripts/refresh_sources.py --json              # machine-readable report
    python3 kb-scripts/refresh_sources.py --fill-excerpts     # backfill the diff-screen excerpts
    python3 kb-scripts/refresh_sources.py --fill-excerpts --dry-run
    python3 kb-scripts/refresh_sources.py --fill-excerpts --from-dir captured/   # offline, tests
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
EXCERPT_CHARS = 4000          # see run(): bounded normalised-text excerpts for the diff screen
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
            # Bounded excerpts of the normalised text, so specs/14's word-level diff screen can be
            # built at all (wave-1b M16): a hash tells you THAT a page changed and nothing about
            # WHAT. 2 x 4000 chars x 35 sources is ~280 KB, which is nothing, and it is written
            # only at --write-baseline time and by accept_drift.py, never by the daily check.
            entry["normalised_head"] = text[:EXCERPT_CHARS]
            entry["normalised_tail"] = text[-EXCERPT_CHARS:] if len(text) > EXCERPT_CHARS else ""
        else:
            entry["content_sha256"] = None
            entry["error"] = body[:200].decode("utf-8", "replace") if body else f"http {status}"
        out[src["source_id"]] = entry
        if i < len(sources) - 1:
            time.sleep(POLITE_DELAY_S)
    return out


def read_local(from_dir: Path, source_id: str) -> tuple[int, bytes, str]:
    """Read a captured page instead of fetching it: <from_dir>/<source_id> with any extension.

    Used by the tests and by an offline re-run. It changes where the bytes come from and nothing
    else: the hash comparison and the refusal rules below are identical.
    """
    matches = sorted(from_dir.glob(f"{source_id}.*")) + sorted(from_dir.glob(source_id))
    if not matches:
        return 0, b"", ""
    return 200, matches[0].read_bytes(), "text/html"


def fill_excerpts(sources: list[dict], dry_run: bool, from_dir: Path | None) -> int:
    """Write normalised_head/normalised_tail for UNCHANGED sources only. Never touches a moved one."""
    if not BASELINE_FILE.exists():
        print("no baseline; run with --write-baseline first", file=sys.stderr)
        return 2
    doc = json.loads(BASELINE_FILE.read_text())
    baseline = doc["sources"]

    filled, already, drifted, unreachable, unknown = [], [], [], [], []
    for i, src in enumerate(sources):
        sid = src["source_id"]
        entry = baseline.get(sid)
        if entry is None or not entry.get("content_sha256"):
            unknown.append(sid)
            continue
        if from_dir is not None:
            status, raw, ctype = read_local(from_dir, sid)
        else:
            status, raw, ctype = fetch(src["url"])
        if status != 200 or not raw:
            unreachable.append((sid, status))
        else:
            text = normalise(raw, ctype)
            if content_hash(text) != entry["content_sha256"]:
                # REFUSED. Accepting this here would be the bulk unreviewed publish that
                # accept_drift.py exists to make into one reviewed action (finding N1).
                drifted.append((sid, entry["content_sha256"][:12], content_hash(text)[:12], src["url"]))
            elif entry.get("normalised_head"):
                already.append(sid)
            else:
                # The only write this mode ever performs: two keys, on an identical page.
                entry["normalised_head"] = text[:EXCERPT_CHARS]
                entry["normalised_tail"] = text[-EXCERPT_CHARS:] if len(text) > EXCERPT_CHARS else ""
                filled.append(sid)
        if from_dir is None and i < len(sources) - 1:
            time.sleep(POLITE_DELAY_S)

    print(f"filled {len(filled)}  already had excerpts {len(already)}  "
          f"REFUSED (drifted) {len(drifted)}  unreachable {len(unreachable)}  "
          f"not in baseline {len(unknown)}")
    for sid, was, now, url in drifted:
        print(f"  DRIFT   {sid}  {was} -> {now}   NOT TOUCHED\n"
              f"          {url}\n"
              f"          review it: accept_drift.py --source-id {sid} --note '...'")
    for sid, code in unreachable:
        print(f"  UNREACH {sid}  http={code}  NOT TOUCHED")
    for sid in unknown:
        print(f"  NEW     {sid} (not in baseline, or baseline has no hash)")

    if dry_run:
        print("  --dry-run: nothing written")
    elif filled:
        BASELINE_FILE.write_text(json.dumps(doc, indent=2) + "\n")
        print(f"  written: {BASELINE_FILE} ({len(filled)} source(s) gained excerpts; "
              f"no hash, no date and no record was touched)")
    return 1 if (drifted or unreachable) else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-baseline", action="store_true")
    ap.add_argument("--fill-excerpts", action="store_true",
                    help="backfill normalised_head/tail for UNCHANGED sources only")
    ap.add_argument("--dry-run", action="store_true", help="--fill-excerpts: report, write nothing")
    ap.add_argument("--from-dir", type=Path,
                    help="--fill-excerpts: read pages from a directory instead of the network")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--only", help="comma-separated source_ids")
    args = ap.parse_args()

    sources = json.loads(SOURCES_FILE.read_text())["sources"]
    if args.only:
        wanted = set(args.only.split(","))
        sources = [s for s in sources if s["source_id"] in wanted]

    if args.fill_excerpts:
        if args.write_baseline:
            print("--fill-excerpts and --write-baseline are opposites; pick one", file=sys.stderr)
            return 2
        return fill_excerpts(sources, args.dry_run, args.from_dir)

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
