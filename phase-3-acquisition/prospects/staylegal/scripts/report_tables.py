#!/usr/bin/env python3
"""Print the tables that go into README.md, straight from prospects.csv.
Run from the repo root: python3 scripts/report_tables.py
"""
import csv, os
from collections import Counter, defaultdict

D = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(D):
    D = "."
rows = list(csv.DictReader(open(os.path.join(D, "prospects.csv"), encoding="utf-8")))

print("### rows per prospect_type x segment\n")
print("| prospect_type | segment | rows | verified | secondary |")
print("|---|---|---|---|---|")
g = defaultdict(list)
for r in rows:
    g[(r["prospect_type"], r["segment"])].append(r)
order = {"end-customer": 0, "partner": 1, "channel": 2, "excluded": 3}
for (t, s), rs in sorted(g.items(), key=lambda kv: (order[kv[0][0]], -len(kv[1]))):
    v = sum(1 for r in rs if r["confidence"] == "verified")
    print(f"| {t} | {s} | {len(rs)} | {v} | {len(rs)-v} |")

print("\n### rows per confidence\n")
print("| confidence | rows |")
print("|---|---|")
for k, n in Counter(r["confidence"] for r in rows).most_common():
    print(f"| {k} | {n} |")
print(f"| **total** | **{len(rows)}** |")

print("\n### markets represented in end-customer rows\n")
loc = Counter()
for r in rows:
    if r["prospect_type"] == "end-customer":
        for m in r["location"].split(";"):
            if m.strip():
                loc[m.strip()] += 1
print(len(loc), "distinct markets;", sum(loc.values()), "market mentions")
