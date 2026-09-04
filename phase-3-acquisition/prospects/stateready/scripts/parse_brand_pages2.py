#!/usr/bin/env python3
"""Second brand-page parser: platforms whose brand lists use a different layout.

Run from the repo root with no arguments:
    python3 phase-3-acquisition/prospects/stateready/scripts/parse_brand_pages2.py
Writes phase-3-acquisition/prospects/stateready/data/brands2.json
"""
import json, os, re, html, subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(BASE, 'raw', 'sites')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
PAGES = {
 'heartland_brands':       'https://www.heartlandhomeservices.com/brands',
 'northwinds_brands':      'https://northwindsservices.com/our-brands/',
 'anyhour_partners':       'https://anyhourgroup.com/partners/',
 'astra_companies':        'https://astraservicepartners.com/our-companies/',
 'premistar_companies':    'https://premistar.com/our-companies/',
 'bluecardinal_partner':   'https://www.bluecardinalhomeservices.com/partner/',
 'cretunited':             'https://creteunited.com/',
 'servicelogic_locations': 'https://www.servicelogic.com/locations',
 'legacysp_partners':      'https://legacyservicepartners.com/partners/',
}

def get(key):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, key + '.html')
    if not os.path.exists(p) or os.path.getsize(p) < 2000:
        subprocess.run(['curl','-s','-A',UA,'-L','--max-time','60','-o',p,PAGES[key]], check=False)
    return open(p, encoding='utf-8', errors='ignore').read()

def lines(s):
    s = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>', ' ', s)
    t = html.unescape(re.sub(r'(?s)<[^>]+>', '\n', s))
    return [l.strip() for l in t.split('\n') if l.strip()]

out = []
def push(name, loc, plat, key, web=''):
    out.append(dict(name=name, location=loc, website=web, platform=plat, source_url=PAGES[key]))

# Heartland: "<Name>" then "Headquartered in <City, State>"
L = lines(get('heartland_brands'))
for i, l in enumerate(L):
    m = re.match(r'^Headquartered in (.+)$', l)
    if m and i > 0:
        push(L[i-1], m.group(1), 'Heartland Home Services', 'heartland_brands')

# Northwinds: "Visit" then the brand name
L = lines(get('northwinds_brands'))
seen = set()
for i, l in enumerate(L):
    if l == 'Visit' and i + 1 < len(L) and L[i+1] not in seen:
        seen.add(L[i+1]); push(L[i+1], '', 'Northwinds Services Group', 'northwinds_brands')

# Any Hour: modal marker '×' then name then location
L = lines(get('anyhour_partners'))
for i, l in enumerate(L):
    if l == '×' and i + 2 < len(L):
        n, loc = L[i+1], L[i+2]
        if n in ('Schedule Tour', 'Contact Us'): continue
        loc = re.sub(r'^\d[^,]*,\s*', '', loc)
        push(n, loc, 'Any Hour Group', 'anyhour_partners')

# Astra: "<Name> - HQ" then the street address line
L = lines(get('astra_companies'))
seen = set()
for i, l in enumerate(L):
    m = re.match(r'^(.+?)\s+-\s+(HQ|Branch)$', l)
    if m and m.group(1) not in seen:
        seen.add(m.group(1))
        addr = L[i+1] if (m.group(2) == 'HQ' and i + 1 < len(L)) else ''
        st = re.search(r',\s*([A-Z]{2})\s*\d{5}', addr) or re.search(r',\s*([A-Za-z ]+)$', addr)
        city = re.search(r'([A-Za-z .\'\-]+),\s*[A-Z]{2}\s*\d{5}', addr)
        loc = (city.group(1).strip() + ', ' + st.group(1)) if (city and st) else (addr if 'Canada' in addr or 'Puerto Rico' in addr else '')
        push(m.group(1), loc, 'Astra Service Partners', 'astra_companies')

# PremiStar: "<Company>" then "<City, ST>"
L = lines(get('premistar_companies'))
ps = {}
for i in range(len(L)-1):
    if re.fullmatch(r"[A-Za-z][A-Za-z .,'\-&]{2,40}, [A-Z]{2}", L[i+1]) and not re.search(r', [A-Z]{2}$', L[i]) and len(L[i]) < 60:
        ps.setdefault(L[i], []).append(L[i+1])
for k, v in ps.items():
    if k.startswith('PremiStar HQ'): continue
    push(k, v[0], 'PremiStar (Reedy Industries)', 'premistar_companies')

# Blue Cardinal: "<Name>" then "N of 13"
L = lines(get('bluecardinal_partner'))
for i, l in enumerate(L):
    if re.fullmatch(r'\d+ of \d+', l) and i > 0:
        push(L[i-1], '', 'Blue Cardinal Home Services Group', 'bluecardinal_partner')

# Crete United: /partner/<slug> links
s = get('cretunited')
seen = set()
for m in re.finditer(r'creteunited\.com/partner/([a-z0-9\-]+)', s):
    slug = m.group(1)
    if slug in seen or slug.startswith('crete-united'): continue
    seen.add(slug)
    name = ' '.join(w.upper() if len(w) <= 3 and w.isalpha() and w not in ('and','the','of') else w.capitalize()
                    for w in slug.replace('-', ' ').split())
    push(name, '', 'Crete United', 'cretunited')

# Service Logic: "<Company>" / "<street>" / "<City, ST ZIP>" triples
L = lines(get('servicelogic_locations'))
comp = {}
for i in range(len(L)-3):
    m = re.fullmatch(r"([A-Za-z][A-Za-z .,\'\-&/()]{2,60}),?\s+([A-Z]{2})\s+\d{5}(-\d{4})?", L[i+2])
    if m and re.match(r'^\d', L[i+1]) and not re.match(r'^\d', L[i]) and 3 < len(L[i]) < 60 and 'Visit' not in L[i]:
        comp.setdefault(L[i], set()).add(m.group(1).split(',')[0].strip() + ', ' + m.group(2))
for k, v in comp.items():
    if k in ('Service Logic Corporate','Service Logic Nationwide Services','Headquarters','Nationwide Services'): continue
    push(k, sorted(v)[0], 'Service Logic', 'servicelogic_locations',)
    out[-1]['states'] = sorted({x.split(', ')[1] for x in v})

# Legacy Service Partners: Elementor logo gallery - brand site link plus logo filename
s = html.unescape(get('legacysp_partners')).replace('\\/', '/')
for img, link in re.findall(r'"premium_gallery_img":\{"url":"([^"]+)".*?"premium_gallery_img_link":\{"url":"([^"]*)"', s):
    if not link: continue
    fn = re.sub(r'\.(jpg|jpeg|png|webp|svg)$', '', img.rsplit('/', 1)[-1], flags=re.I)
    fn = re.sub(r'[-_](square|logo|sq|copy|web|final|new|scaled|\d+x\d+)$', '', fn, flags=re.I)
    push(fn.replace('-', ' ').replace('_', ' ').strip(), '', 'Legacy Service Partners', 'legacysp_partners',
         link.rstrip('/'))

os.makedirs(os.path.join(BASE, 'data'), exist_ok=True)
json.dump(out, open(os.path.join(BASE, 'data', 'brands2.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(out), 'brand rows')
for k in sorted({o['platform'] for o in out}):
    print('  ', k, sum(1 for o in out if o['platform'] == k))
