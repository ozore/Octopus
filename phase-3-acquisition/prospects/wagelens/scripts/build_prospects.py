#!/usr/bin/env python3
"""
Merge the three generated row files into phase-3-acquisition/prospects/wagelens/prospects.csv.

Run from the repository root with no arguments, after the three pullers:

    python3 phase-3-acquisition/prospects/wagelens/scripts/usaspending_pull.py
    python3 phase-3-acquisition/prospects/wagelens/scripts/secondary_pull.py
    python3 phase-3-acquisition/prospects/wagelens/scripts/partners_channels.py
    python3 phase-3-acquisition/prospects/wagelens/scripts/build_prospects.py

Order of precedence when the same organisation appears in more than one file:
partner_rows (hand-verified, richest) > api_rows (USAspending, carries award
counts and dollars) > secondary_rows (state and city registers).

The merge also re-applies the person-name filter from BRIEF.md 2.1 and the
personal-mailbox filter from BRIEF.md 2.2 as a last line of defence, and
enforces the exact column order the brief validator checks.
"""

import csv
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from usaspending_pull import COLS, looks_like_person  # noqa: E402

SOURCES = ["partner_rows.csv", "api_rows.csv", "secondary_rows.csv"]
FREE_MAIL = re.compile(r"@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.", re.I)


STATE = re.compile(r"\b([A-Z]{2})\b")


def norm_key(name, website, location=""):
    """Dedupe key: normalised name + website + state.

    BRIEF.md 3.1 says deduplicate on name + website. Company suffixes are
    stripped so "Smith Electric Inc" and "Smith Electric, LLC" collapse, but the
    state is kept in the key: two genuinely different firms of the same name in
    Washington and New York are not the same organisation and both stay.
    """
    n = re.sub(r"[^a-z0-9]+", " ", (name or "").lower()).strip()
    n = re.sub(r"\b(inc|incorporated|llc|llp|lp|ltd|corp|corporation|co|company|"
               r"pllc|the)\b", " ", n)
    n = " ".join(n.split())
    w = re.sub(r"^https?://(www\.)?", "", (website or "").lower().strip()).rstrip("/")
    m = STATE.findall((location or "").upper())
    return (n, w, m[-1] if m else "")


def main():
    root = os.getcwd()
    outdir = os.path.join(root, "phase-3-acquisition", "prospects", "wagelens")
    rows, seen, exact = [], set(), set()
    dropped = {"dup": 0, "dup_exact": 0, "person": 0, "mailbox": 0, "nosrc": 0}
    for fn in SOURCES:
        path = os.path.join(outdir, "scripts", fn)
        if not os.path.exists(path):
            sys.stderr.write("missing %s - run the puller first\n" % fn)
            continue
        n0 = len(rows)
        with open(path, encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                name = (r.get("name") or "").strip()
                if not name or not (r.get("source_url") or "").strip():
                    dropped["nosrc"] += 1
                    continue
                if r["prospect_type"] == "end-customer" and looks_like_person(name):
                    dropped["person"] += 1
                    continue
                blob = (r.get("contact_route", "") + " " + r.get("notes", "")).lower()
                if FREE_MAIL.search(blob):
                    r["contact_route"] = ""
                    r["notes"] = re.sub(r"\S+@\S+", "[removed]", r.get("notes", ""))
                    dropped["mailbox"] += 1
                k = norm_key(name, r.get("website", ""), r.get("location", ""))
                if k in seen:
                    dropped["dup"] += 1
                    continue
                # BRIEF.md 3.1 deduplicates on name + website exactly, and the
                # brief's own validator asserts it, so a same-name firm in a
                # different state is collapsed too even though it may well be a
                # different organisation.
                ek = (name.lower().strip(), (r.get("website") or "").lower().strip())
                if ek in exact:
                    dropped["dup_exact"] += 1
                    continue
                seen.add(k)
                exact.add(ek)
                rows.append({c: (r.get(c) or "") for c in COLS})
        print("%-22s +%d rows (running total %d)" % (fn, len(rows) - n0, len(rows)))

    order = {"end-customer": 0, "partner": 1, "channel": 2, "excluded": 3}
    rows.sort(key=lambda r: (order.get(r["prospect_type"], 9), r["segment"], r["name"].lower()))
    out = os.path.join(outdir, "prospects.csv")
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)
    print("wrote %d rows to prospects.csv" % len(rows))
    print("dropped: %s" % dropped)

    from collections import Counter
    print("\nby prospect_type:", dict(Counter(r["prospect_type"] for r in rows)))
    print("by confidence:  ", dict(Counter(r["confidence"] for r in rows)))
    print("\nby segment:")
    for (pt, seg), n in sorted(Counter((r["prospect_type"], r["segment"])
                                       for r in rows).items(), key=lambda t: -t[1]):
        print("  %-14s %-58s %5d" % (pt, seg, n))


if __name__ == "__main__":
    main()
