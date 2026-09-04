#!/usr/bin/env python3
"""NASBP Surety Pro Locator - the public directory of surety bond producers
(https://suretyprolocator.nasbp.org/). Bond producers write the bonds and the
certificates for the same contractors Certly serves, so they are co-sell partners.

Only the AGENCY name, address and website are taken. The locator also exposes
individual producers' names and personal mailboxes; those are never recorded
(BRIEF 2.1 / 2.2).
Writes raw/nasbp_producers.csv
"""
import csv, html, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
UA = 'Mozilla/5.0'
BASE = 'https://suretyprolocator.nasbp.org/SearchResults'
# option values taken from the locator's own State/Country select
STATES = {'6': 'CA', '12': 'FL', '51': 'TX', '38': 'NC', '56': 'WA', '43': 'OR',
          '13': 'GA', '7': 'CO', '17': 'IL', '37': 'NY', '4': 'AZ', '26': 'MA',
          '41': 'OH', '55': 'VA', '28': 'MN', '50': 'TN'}
MAXPAGE = 3

def fetch(cat, pg):
    url = '%s?categories=%s&pg=%d' % (BASE, cat, pg)
    p = subprocess.run(['curl', '-s', '--max-time', '90', '-A', UA, '-L', url],
                       capture_output=True)
    return url, p.stdout.decode('utf-8', 'replace')

def parse(page):
    for chunk in re.split(r'<div class="ListingNameAddress">', page)[1:]:
        n = re.search(r'class="companyNameLink"[^>]*>(.*?)</a>', chunk, re.S)
        if not n:
            continue
        name = html.unescape(re.sub(r'<[^>]+>', '', n.group(1))).strip()
        addr = re.search(r'<span>\s*(.*?)</span>', chunk, re.S)
        loc = ''
        if addr:
            lines = [html.unescape(re.sub(r'<[^>]+>', '', l)).strip()
                     for l in addr.group(1).split('<br />')]
            lines = [l for l in lines if l]
            if lines:
                loc = lines[-1]
        web = re.search(r'class="websiteImage">\s*<a href="([^"]+)"', chunk)
        yield {'name': name, 'location': loc,
               'website': html.unescape(web.group(1)) if web else ''}

def main():
    rows, seen = [], set()
    for cat, label in STATES.items():
        for pg in range(1, MAXPAGE + 1):
            url, page = fetch(cat, pg)
            got = 0
            for r in parse(page):
                k = re.sub(r'[^a-z0-9]', '', r['name'].lower())
                if not k or k in seen:
                    continue
                seen.add(k)
                r['state_query'] = label
                r['source_url'] = url
                rows.append(r); got += 1
            print(label, 'p%d' % pg, got)
            if got == 0:
                break
    path = os.path.join(RAW, 'nasbp_producers.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'location', 'website', 'state_query', 'source_url'])
        w.writeheader(); w.writerows(rows)
    print(path, len(rows))

if __name__ == '__main__':
    main()
