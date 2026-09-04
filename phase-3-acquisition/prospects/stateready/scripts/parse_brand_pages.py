#!/usr/bin/env python3
"""Re-fetch and parse the 'our brands' pages of PE-backed home-services platforms.

Run from the repo root with no arguments:
    python3 phase-3-acquisition/prospects/stateready/scripts/parse_brand_pages.py
Writes phase-3-acquisition/prospects/stateready/data/brands.json
(name, location, website, platform, source_url) for every operating brand found.
"""
import json, os, re, html, subprocess, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(BASE, 'raw', 'sites')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

PAGES = {
    'turnpoint_brands': 'https://www.turnpointservices.com/turnpoint-brands/',
    'sila_brands':      'https://silaservices.com/brands/',
    'redwood_partners': 'https://redwoodservices.com/partners/',
    'wrench_brands':    'https://www.wrenchgroup.com/wrench-group-brands/',
    'infinityhome':     'https://www.infinityhomeservices.com/',
}

def get(key, url):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, key + '.html')
    if not os.path.exists(p) or os.path.getsize(p) < 2000:
        subprocess.run(['curl', '-s', '-A', UA, '-L', '--max-time', '60', '-o', p, url], check=False)
    return open(p, encoding='utf-8', errors='ignore').read()

def lines(s):
    s = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>', ' ', s)
    t = html.unescape(re.sub(r'(?s)<[^>]+>', '\n', s))
    return [l.strip() for l in t.split('\n') if l.strip()]

out = []

# --- TurnPoint: name / "City, ST" / website appear on consecutive text lines
s = get('turnpoint_brands', PAGES['turnpoint_brands']); L = lines(s)
for i in range(len(L) - 2):
    if re.fullmatch(r"[A-Za-z][A-Za-z .'\-&]{1,30}, [A-Z]{2}", L[i+1]) and L[i+2].startswith('http'):
        out.append(dict(name=L[i], location=L[i+1], website=L[i+2].rstrip('/'),
                        platform='TurnPoint Services', source_url=PAGES['turnpoint_brands']))

# --- Sila: data-name / data-location attributes on each brand card
s = get('sila_brands', PAGES['sila_brands'])
seen = set()
for m in re.finditer(r'data-id="(\d+)" data-name="([^"]*)" data-location="([^"]*)"', s):
    n = html.unescape(m.group(2))
    if n in seen: continue
    seen.add(n)
    out.append(dict(name=n, location=html.unescape(m.group(3)), website='',
                    platform='Sila Services', source_url=PAGES['sila_brands']))

# --- Redwood: "Headquarters:" block then "Year of Redwood Investment:" then the name
s = get('redwood_partners', PAGES['redwood_partners']); L = lines(s)
i = 0
while i < len(L):
    if L[i] == 'Headquarters:':
        hq = L[i+1]; name = None; j = i
        while j < min(i+12, len(L)):
            if L[j] == 'Year of Redwood Investment:':
                name = L[j+2]; break
            j += 1
        web = ''
        k = j
        while k < len(L) and L[k] != 'Headquarters:':
            if re.fullmatch(r'(www\.)?[a-z0-9][a-z0-9\-\.]+\.(com|net|org|us)', L[k]):
                web = 'https://' + L[k].lstrip('www.') if not L[k].startswith('http') else L[k]
                break
            k += 1
        if name:
            if not re.search(r'[A-Za-z]', hq) or re.fullmatch(r'\d{4}', hq): hq = ''
            out.append(dict(name=name, location=hq, website=web,
                            platform='Redwood Services', source_url=PAGES['redwood_partners']))
        i = j + 1
    else:
        i += 1

# --- Wrench: brand blurbs grouped under state headings
s = get('wrench_brands', PAGES['wrench_brands']); L = lines(s)
STATES = ['Arizona','California','Colorado','Florida','Georgia','Indiana','Kentucky','Maryland',
          'North Carolina','Ohio','Oklahoma','South Carolina','Texas','Utah','Tennessee','Nevada']
WRENCH = [
 ('Collins Comfort Masters','Gilbert, AZ'),('Parker & Sons','Phoenix, AZ'),
 ('Service Champions','Northern California'),('Plumbline Services','Denver, CO'),
 ('CoolToday / PlumbingToday / EnergyToday','Sarasota, FL'),('Donovan Heat & Air','Jacksonville, FL'),
 ('Lindstrom Air Conditioning & Plumbing','Pompano Beach, FL'),('Red Cap Plumbing & Air','Tampa, FL'),
 ('BriteBox Electrical Services','Metro Atlanta, GA'),('Coolray Heating & Air Conditioning','Metro Atlanta, GA'),
 ('Mr. Plumber (Atlanta)','Metro Atlanta, GA'),('Ragsdale Heating, Air & Plumbing','Metro Atlanta, GA'),
 ('Mr. Plumber (Indianapolis)','Indianapolis, IN'),('Williams Comfort Air','Indianapolis, IN'),
 ("Jarboe's Plumbing, Heating & Cooling",'Louisville, KY'),("Boothe's Heating, Air and Plumbing",'Southern Maryland'),
 ('Morris-Jenkins','Charlotte, NC'),('Buckeye Heating, Cooling & Plumbing','Columbus, OH'),
 ('Thomas & Galbraith Heating, Cooling & Plumbing','Cincinnati, OH'),('Comfort Wave','Oklahoma City, OK'),
 ('Abacus Plumbing, Air Conditioning and Electrical','Houston, TX'),('Baker Brothers Plumbing, Air & Electric','Dallas, TX'),
 ('Berkeys Air Conditioning, Plumbing & Electrical','Dallas/Fort Worth, TX'),('Mountain Home Services','Salt Lake City, UT'),
]
page = ' '.join(L)
for n, loc in WRENCH:
    head = re.split(r'[/(,]', n)[0].strip().split()
    keys = [' '.join(head[:2]), head[0]]
    if any(k.lower() in page.lower() for k in keys):
        out.append(dict(name=n, location=loc, website='', platform='Wrench Group',
                        source_url=PAGES['wrench_brands']))

# --- Infinity Home Services: /brands/<slug> links plus location counts
s = get('infinityhome', PAGES['infinityhome'])
seen = set()
for m in re.finditer(r'href="/brands/([a-z0-9\-]+)"[^>]*>(.*?)</a>', s, re.S | re.I):
    slug = m.group(1)
    if slug in seen: continue
    seen.add(slug)
    inner = html.unescape(re.sub(r'(?s)<[^>]+>', ' ', m.group(2)))
    nloc = re.search(r'(\d+)\s+Locations?', inner)
    name = ' '.join(w.capitalize() for w in slug.replace('-', ' ').split())
    out.append(dict(name=name, location='', website='',
                    platform='Infinity Home Services', source_url=PAGES['infinityhome'],
                    size=(nloc.group(1) + ' locations' if nloc else '')))

os.makedirs(os.path.join(BASE, 'data'), exist_ok=True)
with open(os.path.join(BASE, 'data', 'brands.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print(len(out), 'brand rows ->', os.path.join(BASE, 'data', 'brands.json'))
for k in sorted({o['platform'] for o in out}):
    print('  ', k, sum(1 for o in out if o['platform'] == k))
