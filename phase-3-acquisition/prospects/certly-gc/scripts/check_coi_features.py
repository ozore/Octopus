#!/usr/bin/env python3
"""For each construction software vendor listed as a partner, check whether the
vendor already bundles certificate-of-insurance / subcontractor-compliance
tracking. If it does it must be recorded as `excluded`, not `partner`.

Fetches the home page plus a few likely feature pages and greps for COI wording.
Writes raw/coi_feature_check.csv
"""
import csv, os, re, subprocess
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
PATHS = ['', '/features', '/product', '/products', '/solutions', '/subcontractor-management',
         '/compliance', '/features/subcontractor-management']
HIT = re.compile(r'certificate[s]? of insurance|\bCOI\b|insurance compliance|'
                 r'insurance tracking|certificate tracking|subcontractor compliance|'
                 r'compliance tracking|insurance certificate', re.I)

def get(url):
    p = subprocess.run(['curl', '-s', '-L', '--max-time', '20', '--compressed', '-A', UA,
                        '-w', '\n@@%{http_code}', url], capture_output=True)
    b = p.stdout.decode('utf-8', 'replace').rsplit('\n@@', 1)
    return (b[0], b[1]) if len(b) == 2 else ('', '')

def check(row):
    base = row['website'].rstrip('/')
    found, where = [], ''
    for path in PATHS:
        body, code = get(base + path)
        if code != '200':
            continue
        text = re.sub(r'<[^>]+>', ' ', body)
        m = HIT.findall(text)
        if m:
            found = sorted(set(x.lower() for x in m))[:5]
            where = base + path
            break
    return {'name': row['name'], 'website': base, 'coi_terms': '; '.join(found),
            'evidence_url': where}

def main():
    src = os.path.join(RAW, 'curated_candidates.csv')
    rows = [r for r in csv.DictReader(open(src, encoding='utf-8'))
            if r['prospect_type'] == 'partner' and 'software' in r['segment'] or
            (r['prospect_type'] == 'partner' and 'ERP' in r['segment']) or
            (r['prospect_type'] == 'partner' and 'plan room' in r['segment'])]
    with ThreadPoolExecutor(max_workers=6) as ex:
        out = list(ex.map(check, rows))
    path = os.path.join(RAW, 'coi_feature_check.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'website', 'coi_terms', 'evidence_url'])
        w.writeheader(); w.writerows(out)
    for o in out:
        print(('HIT  ' if o['coi_terms'] else 'clear'), o['name'], '|', o['coi_terms'][:80], '|', o['evidence_url'])
    print(path, len(out))

if __name__ == '__main__':
    main()
