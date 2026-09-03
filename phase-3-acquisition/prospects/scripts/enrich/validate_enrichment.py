#!/usr/bin/env python3
"""Validator for every `<dir>/routes-enrichment.csv`, in the spirit of BRIEF §3.5.

Fails loudly on anything that would break the standing rules: a personal-looking
mailbox, a free-mail domain, a phone number, a route the outbound engine would
refuse, a website that was never fetched, a duplicate key.

    python3 phase-3-acquisition/prospects/scripts/enrich/validate_enrichment.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

import enrich_lib as L  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402

COLUMNS = ["name", "website", "contact_route", "route_type", "evidence_url",
           "checked_on", "notes", "location"]

PHONE_RE = re.compile(r"(?<!\d)(\(?\d{3}\)?[ .\-]\d{3}[ .\-]\d{4})(?!\d)")


def check(path: Path) -> list[str]:
    problems: list[str] = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != COLUMNS:
            problems.append(f"bad header: {reader.fieldnames}")
            return problems
        rows = list(reader)

    seen = set()
    prospects = {}
    prospects_path = path.parent / "prospects.csv"
    with open(prospects_path, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            prospects[(row["name"].strip().lower(),
                       row.get("location", "").strip().lower())] = row

    for index, row in enumerate(rows, start=2):
        where = f"{path.name}:{index} {row['name'][:40]!r}"
        key = (row["name"].strip().lower(), row["location"].strip().lower())
        if key in seen:
            problems.append(f"{where}: duplicate name+location")
        seen.add(key)
        if key not in prospects:
            problems.append(f"{where}: not a row in prospects.csv")
        if row["route_type"] not in ("mailbox", "form", "none"):
            problems.append(f"{where}: bad route_type {row['route_type']!r}")
        if row["contact_route"] and row["route_type"] == "none":
            problems.append(f"{where}: route recorded but route_type is none")
        if not row["contact_route"] and row["route_type"] != "none":
            problems.append(f"{where}: route_type {row['route_type']} with no route")
        if row["contact_route"]:
            kind, route, note = wb.classify_route(row["contact_route"])
            if kind == "none":
                problems.append(f"{where}: the outbound engine would refuse this "
                                f"route ({note}): {row['contact_route']}")
            elif kind != row["route_type"]:
                problems.append(f"{where}: route_type {row['route_type']} but the engine "
                                f"reads it as {kind}")
            if "@" in row["contact_route"]:
                if L.clean_address(row["contact_route"]) != row["contact_route"]:
                    problems.append(f"{where}: malformed address {row['contact_route']}")
                domain = row["contact_route"].split("@")[1]
                if domain in L.FREE_MAIL:
                    problems.append(f"{where}: free-mail domain {domain}")
        if row["website"] and not row["website"].startswith("http"):
            problems.append(f"{where}: website is not a URL: {row['website']}")
        if row["website"] and not row["evidence_url"]:
            problems.append(f"{where}: website with no evidence_url")
        blob = " ".join(row.values())
        if PHONE_RE.search(blob):
            problems.append(f"{where}: looks like a phone number in the row")
        if not row["checked_on"]:
            problems.append(f"{where}: no checked_on")
    return problems


def main() -> int:
    root = L.REPO / "phase-3-acquisition" / "prospects"
    total = failures = 0
    for path in sorted(root.glob("*/routes-enrichment.csv")):
        problems = check(path)
        rows = sum(1 for _ in open(path, encoding="utf-8")) - 1
        total += rows
        failures += len(problems)
        status = "OK" if not problems else f"{len(problems)} PROBLEM(S)"
        print(f"{path.relative_to(L.REPO)}: {rows} rows, {status}")
        for problem in problems[:25]:
            print(f"   - {problem}")
    print(f"\n{total} rows checked, {failures} problems")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
