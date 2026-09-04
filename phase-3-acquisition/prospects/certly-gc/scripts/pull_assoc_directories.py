#!/usr/bin/env python3
"""Scrape public GrowthZone/MicroNet association member directories for the
"general contractor" category, which lists member firms with website + city.

Each entry below is (source_label, url). The card markup is the standard
GrowthZone `gz-directory-card` / `gz-results-card`, so one parser covers all.
Writes raw/assoc_members.csv
"""
import csv, html, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

# (chapter label, default state, category URL, kind)
SOURCES = [
    ('AGC Houston', 'TX', 'https://members.agchouston.org/directory/Search/general-contractors-386559', 'gc'),
    ('AGC Alaska', 'AK', 'https://members.agcak.org/memberdirectory/Search/general-contractor-member-296133', 'gc'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/building-contractors-325083', 'gc'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/design-build-325056', 'gc'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/bonds-insurance-325080', 'insurance'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/attorneys-325073', 'legal'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/accounting-325075', 'accounting'),
    ('AGC New Hampshire', 'NH', 'https://members.agcnh.org/directory/Search/software-418026', 'software'),
]

def fetch(url, cache):
    path = os.path.join(RAW, cache)
    if not os.path.exists(path) or os.path.getsize(path) < 5000:
        subprocess.run(['curl', '-s', '--max-time', '120', '-A', UA, '-L', url, '-o', path], check=True)
    return open(path, encoding='utf-8', errors='replace').read()

def txt(m):
    return html.unescape(re.sub(r'<[^>]+>', ' ', m)).strip() if m else ''

def cards(page):
    chunks = re.split(r'<div class="card gz-(?:directory|results)-card', page)[1:]
    for c in chunks:
        name = re.search(r'itemprop="name"[^>]*>\s*<a[^>]*>(.*?)</a>', c, re.S)
        if not name:
            name = re.search(r'gz-card-title[^>]*>\s*<a[^>]*>(.*?)</a>', c, re.S)
        if not name:
            continue
        city = re.search(r'itemprop="addressLocality">(.*?)</span>', c, re.S) or \
               re.search(r'class="gz-address-city">(.*?)</span>', c, re.S)
        st = re.search(r'itemprop="addressRegion">(.*?)</span>', c, re.S)
        web = re.search(r'gz-card-website">\s*<a href="([^"]+)"', c) or \
              re.search(r'class="card-link"[^>]*href="(https?://(?!www\.google)[^"]+)"[^>]*>\s*<i class="[^"]*globe', c)
        det = re.search(r'href="(//[^"]*/(?:directory/Details|list/member)/[^"]+)"', c)
        yield {'name': txt(name.group(1)), 'city': txt(city.group(1)) if city else '',
               'state': txt(st.group(1)) if st else '',
               'website': html.unescape(web.group(1)) if web else '',
               'detail': ('https:' + det.group(1)) if det else ''}

def main():
    rows, seen = [], set()
    for label, state, url, kind in SOURCES:
        cache = 'assoc_' + re.sub(r'[^a-z0-9]+', '_', url.lower().split('//')[1])[:80] + '.html'
        page = fetch(url, cache)
        n = 0
        for r in cards(page):
            k = re.sub(r'[^a-z0-9]', '', r['name'].lower())
            if not k or k in seen:
                continue
            seen.add(k)
            r['source'] = label
            r['kind'] = kind
            r['source_url'] = url
            r['state'] = r['state'] or state
            rows.append(r); n += 1
        print(label, url.rsplit('/', 1)[-1], n)
    path = os.path.join(RAW, 'assoc_members.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['name', 'city', 'state', 'website', 'detail', 'kind', 'source', 'source_url'])
        w.writeheader(); w.writerows(rows)
    print(path, len(rows))

if __name__ == '__main__':
    main()
