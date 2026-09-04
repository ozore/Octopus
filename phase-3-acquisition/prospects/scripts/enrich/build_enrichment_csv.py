#!/usr/bin/env python3
"""Turn the resumable attempt log into `<dir>/routes-enrichment.csv`.

    python3 phase-3-acquisition/prospects/scripts/enrich/build_enrichment_csv.py

Reads every `state/<dir>-<mode>.jsonl` and writes one CSV per prospects
directory. One row per organisation *attempted*, failures included with the
reason, so a later run can see what was already tried and why it did not work.

`prospects.csv` is never written.
"""

from __future__ import annotations

import csv
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import enrich_lib as L  # noqa: E402

PROSPECTS = L.REPO / "phase-3-acquisition" / "prospects"

#: the seven columns the phase-4 brief specifies, plus `location`, which the
#: same brief names as the tie-breaker when two organisations share a name.
COLUMNS = ["name", "website", "contact_route", "route_type", "evidence_url",
           "checked_on", "notes", "location"]

DIRS = ["wagelens", "certly-pm", "certly-gc", "stateready"]


ROUTE_RANK = {"mailbox": 0, "form": 1, "none": 2, "": 2}


def better(new: dict, old: dict) -> bool:
    """A mailbox beats a contact page beats nothing; ties keep the first."""
    def rank(rec: dict) -> tuple:
        kind = rec.get("route_type", "none") if rec.get("contact_route") else "none"
        return (ROUTE_RANK.get(kind, 2), 0 if rec.get("website") else 1)
    return rank(new) < rank(old)


def records_for(directory: str) -> dict[str, dict]:
    """Merge every attempt log for this directory, best result per organisation.

    Two passes can each hold half the answer — a DNS-guessed site with no
    published mailbox, and a register mailbox with no confirmed site — so the
    website and the route are carried across independently.
    """
    out: dict[str, dict] = {}
    for path in sorted(L.STATE_DIR.glob(f"{directory}-*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            key = rec.get("key", "")
            previous = out.get(key)
            if previous is None:
                out[key] = rec
                continue
            keep, drop = (rec, previous) if better(rec, previous) else (previous, rec)
            keep = dict(keep)
            if not keep.get("website") and drop.get("website"):
                keep["website"] = drop["website"]
            for field in ("notes", "method"):
                if drop.get(field) and drop[field] not in keep.get(field, ""):
                    keep[field] = "; ".join(x for x in (keep.get(field, ""), drop[field]) if x)
            out[key] = keep
    return out


def main() -> int:
    grand = Counter()
    for directory in DIRS:
        prospects_path = PROSPECTS / directory / "prospects.csv"
        if not prospects_path.exists():
            continue
        recs = records_for(directory)
        if not recs:
            continue
        # keep the exact `name` (and `location`) spelling from prospects.csv
        canonical: dict[str, tuple[str, str]] = {}
        names = Counter()
        with open(prospects_path, newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                key = L.org_key(row.get("name", ""), row.get("location", ""))
                canonical[key] = (row.get("name", ""), row.get("location", ""))
                names[row.get("name", "")] += 1

        rows = []
        counts = Counter()
        for key, rec in sorted(recs.items()):
            name, location = canonical.get(key, (rec.get("name", ""), rec.get("location", "")))
            route_type = rec.get("route_type") or "none"
            if not rec.get("contact_route"):
                route_type = "none"
            rows.append({
                "name": name,
                "website": rec.get("website", ""),
                "contact_route": rec.get("contact_route", ""),
                "route_type": route_type,
                "evidence_url": rec.get("evidence_url", "") or rec.get("website", ""),
                "checked_on": rec.get("checked_on", ""),
                "notes": ((rec.get("method", "") + ": ") if rec.get("method") else "")
                         + rec.get("notes", ""),
                "location": location if names[name] > 1 else location,
            })
            counts["attempted"] += 1
            counts["website"] += 1 if rec.get("website") else 0
            counts[route_type] += 1

        out_path = PROSPECTS / directory / "routes-enrichment.csv"
        with open(out_path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=COLUMNS, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)
        print(f"{out_path.relative_to(L.REPO)}: {counts['attempted']} attempted, "
              f"{counts['website']} websites, {counts['mailbox']} mailboxes, "
              f"{counts['form']} contact pages, {counts['none']} no route")
        for k, v in counts.items():
            grand[k] += v
    print(f"total: {grand['attempted']} attempted, {grand['website']} websites, "
          f"{grand['mailbox']} mailboxes, {grand['form']} contact pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
