#!/usr/bin/env python3
"""Harvest yellowpages.com 'medical-spas' (and related) category pages for a list of metros.
Writes data/yp_listings.json. Re-runnable; uses cached raw/ pages."""
import os, re, json, html, sys, time, subprocess
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch import fetch

METROS = [
 # (yp slug, city, state)
 ("los-angeles-ca","Los Angeles","CA"),("san-diego-ca","San Diego","CA"),
 ("san-francisco-ca","San Francisco","CA"),("san-jose-ca","San Jose","CA"),
 ("sacramento-ca","Sacramento","CA"),("irvine-ca","Irvine","CA"),
 ("beverly-hills-ca","Beverly Hills","CA"),("newport-beach-ca","Newport Beach","CA"),
 ("dallas-tx","Dallas","TX"),("houston-tx","Houston","TX"),("austin-tx","Austin","TX"),
 ("san-antonio-tx","San Antonio","TX"),("fort-worth-tx","Fort Worth","TX"),("plano-tx","Plano","TX"),
 ("new-york-ny","New York","NY"),("brooklyn-ny","Brooklyn","NY"),("buffalo-ny","Buffalo","NY"),
 ("white-plains-ny","White Plains","NY"),
 ("newark-nj","Newark","NJ"),("jersey-city-nj","Jersey City","NJ"),("hoboken-nj","Hoboken","NJ"),
 ("princeton-nj","Princeton","NJ"),("paramus-nj","Paramus","NJ"),
 ("miami-fl","Miami","FL"),("orlando-fl","Orlando","FL"),("tampa-fl","Tampa","FL"),
 ("jacksonville-fl","Jacksonville","FL"),("fort-lauderdale-fl","Fort Lauderdale","FL"),
 ("boca-raton-fl","Boca Raton","FL"),("naples-fl","Naples","FL"),
 ("chicago-il","Chicago","IL"),("naperville-il","Naperville","IL"),("schaumburg-il","Schaumburg","IL"),
 ("denver-co","Denver","CO"),("boulder-co","Boulder","CO"),("colorado-springs-co","Colorado Springs","CO"),
 ("phoenix-az","Phoenix","AZ"),("scottsdale-az","Scottsdale","AZ"),("tucson-az","Tucson","AZ"),
 ("atlanta-ga","Atlanta","GA"),("alpharetta-ga","Alpharetta","GA"),
 ("las-vegas-nv","Las Vegas","NV"),("henderson-nv","Henderson","NV"),
 ("seattle-wa","Seattle","WA"),("bellevue-wa","Bellevue","WA"),
 ("boston-ma","Boston","MA"),("newton-ma","Newton","MA"),
 ("charlotte-nc","Charlotte","NC"),("raleigh-nc","Raleigh","NC"),
 ("nashville-tn","Nashville","TN"),("philadelphia-pa","Philadelphia","PA"),
 ("columbus-oh","Columbus","OH"),("cleveland-oh","Cleveland","OH"),
 ("minneapolis-mn","Minneapolis","MN"),("portland-or","Portland","OR"),
 ("salt-lake-city-ut","Salt Lake City","UT"),("detroit-mi","Detroit","MI"),
 ("kansas-city-mo","Kansas City","MO"),("saint-louis-mo","Saint Louis","MO"),
 ("washington-dc","Washington","DC"),("baltimore-md","Baltimore","MD"),
 ("indianapolis-in","Indianapolis","IN"),("milwaukee-wi","Milwaukee","WI"),
 ("oklahoma-city-ok","Oklahoma City","OK"),("new-orleans-la","New Orleans","LA"),
 ("richmond-va","Richmond","VA"),("hartford-ct","Hartford","CT"),
]

# Second pass (2026-09-03): metros added purely to widen state coverage, because
# `location` (state) is the field ScopeIQ is sold on.
METROS += [
 ("anchorage-ak","Anchorage","AK"),("little-rock-ar","Little Rock","AR"),
 ("wilmington-de","Wilmington","DE"),("honolulu-hi","Honolulu","HI"),
 ("des-moines-ia","Des Moines","IA"),("boise-id","Boise","ID"),
 ("wichita-ks","Wichita","KS"),("louisville-ky","Louisville","KY"),
 ("portland-me","Portland","ME"),("jackson-ms","Jackson","MS"),
 ("billings-mt","Billings","MT"),("fargo-nd","Fargo","ND"),
 ("manchester-nh","Manchester","NH"),("albuquerque-nm","Albuquerque","NM"),
 ("providence-ri","Providence","RI"),("sioux-falls-sd","Sioux Falls","SD"),
 ("burlington-vt","Burlington","VT"),("charleston-wv","Charleston","WV"),
 ("cheyenne-wy","Cheyenne","WY"),("birmingham-al","Birmingham","AL"),
 ("omaha-ne","Omaha","NE"),("charleston-sc","Charleston","SC"),
 ("lexington-ky","Lexington","KY"),("spokane-wa","Spokane","WA"),
]

CATS = ["medical-spas"]
PAGES = 2

RESULT_RE = re.compile(r'<div class="result"[^>]*>(.*?)(?=<div class="result"|<div class="pagination)', re.S)

def txt(s):
    return html.unescape(re.sub(r'<[^>]+>','',s)).strip()

def parse(page_html):
    out=[]
    for blk in RESULT_RE.findall(page_html):
        m = re.search(r'class="business-name"[^>]*>(?:<h2[^>]*>)?(?:<span>)?(.*?)</', blk)
        if not m: continue
        name = txt(m.group(1))
        name = re.sub(r'^\d+\.\s*','',name)
        if not name: continue
        w = re.search(r'class="[^"]*track-visit-website[^"]*"\s+href="([^"]+)"', blk)
        website = w.group(1) if w else ''
        st = re.search(r'class="street-address">([^<]*)</div>', blk)
        lo = re.search(r'class="locality">([^<]*)</div>', blk)
        cats = [txt(c) for c in re.findall(r'<div class="categories">(.*?)</div>', blk, re.S)]
        sn = re.search(r'<div class="snippet">(.*?)</div>', blk, re.S)
        snippet = txt(sn.group(1)) if sn else ''
        snippet = re.sub(r'^From Business:\s*','',snippet)
        mip = re.search(r'class="business-name" href="([^"]+)"', blk)
        out.append(dict(name=name, website=website,
                        street=txt(st.group(1)) if st else '',
                        locality=txt(lo.group(1)) if lo else '',
                        categories='; '.join(cats), snippet=snippet[:400],
                        mip=('https://www.yellowpages.com'+mip.group(1)) if mip else ''))
    return out

def main():
    rows=[]
    for slug, city, state in METROS:
        for cat in CATS:
            for pg in range(1, PAGES+1):
                url = f"https://www.yellowpages.com/{slug}/{cat}" + (f"?page={pg}" if pg>1 else "")
                path, code, size = fetch(url)
                if str(code) not in ('200','cached') or size < 20000:
                    print('SKIP', code, size, url); continue
                h = open(path, encoding='utf-8', errors='ignore').read()
                got = parse(h)
                for g in got:
                    g['metro'] = f"{city}, {state}"; g['metro_state']=state
                    g['source_url'] = url
                rows += got
                print(len(got), url)
    # dedupe on name+locality
    seen=set(); ded=[]
    for r in rows:
        k=(r['name'].lower(), r['locality'].lower())
        if k in seen: continue
        seen.add(k); ded.append(r)
    json.dump(ded, open(os.path.join(BASE,'data','yp_listings.json'),'w'), indent=1)
    print('total', len(rows), 'dedup', len(ded))

if __name__=='__main__':
    main()
