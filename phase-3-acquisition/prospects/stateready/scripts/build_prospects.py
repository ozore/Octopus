#!/usr/bin/env python3
"""Build prospects.csv from the collected row store.

Run from the repo root with no arguments:
    python3 phase-3-acquisition/prospects/stateready/scripts/build_prospects.py
Reads  phase-3-acquisition/prospects/stateready/data/rows.jsonl
Writes phase-3-acquisition/prospects/stateready/prospects.csv
Deduplicates on (name, website), keeping the first (higher-confidence) occurrence.
"""
import csv, json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = ['app','prospect_type','segment','name','website','location','size_signal',
        'fit_rationale','contact_route','decision_maker_role','source_url','source_type',
        'confidence','collected_on','notes']
RANK = {'verified': 0, 'secondary': 1, 'unverified': 2}

rows = [json.loads(l) for l in open(os.path.join(BASE, 'data', 'rows.jsonl'), encoding='utf-8') if l.strip()]

best = {}
order = []
for r in rows:
    r['name'] = ' '.join(r['name'].split()).strip()
    for c in COLS:
        r[c] = ' '.join(str(r.get(c, '')).split()).strip()
    k = (r['name'].lower(), r['website'].lower())
    if k not in best:
        best[k] = r
        order.append(k)
    else:
        if RANK.get(r['confidence'], 3) < RANK.get(best[k]['confidence'], 3):
            keep_notes = best[k]['notes']
            best[k] = r
            if keep_notes and keep_notes not in r['notes']:
                best[k]['notes'] = (r['notes'] + ' | Duplicate row merged: ' + keep_notes)[:1500]

out = [best[k] for k in order]
p = os.path.join(BASE, 'prospects.csv')
with open(p, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_ALL)
    w.writeheader()
    for r in out:
        w.writerow({c: r.get(c, '') for c in COLS})
print(len(rows), 'stored rows ->', len(out), 'unique rows ->', p)
