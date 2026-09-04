#!/usr/bin/env python3
"""Fetch expertise.com 'Best Property Management Companies' city pages and parse
provider name / address / website. Run from repo root: python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_expertise.py
Writes raw HTML to raw/expertise/ and a TSV to raw/expertise_providers.tsv
"""
import os, re, html, subprocess, sys, time

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RAW = os.path.join(BASE, 'raw', 'expertise')
os.makedirs(RAW, exist_ok=True)

CITIES = [
 ("texas","austin"),("texas","dallas"),("texas","houston"),("texas","san-antonio"),
 ("texas","fort-worth"),("texas","el-paso"),
 ("florida","miami"),("florida","tampa"),("florida","orlando"),("florida","jacksonville"),
 ("georgia","atlanta"),("north-carolina","charlotte"),("north-carolina","raleigh"),
 ("tennessee","nashville"),("tennessee","memphis"),
 ("arizona","phoenix"),("arizona","tucson"),("nevada","las-vegas"),
 ("colorado","denver"),("colorado","colorado-springs"),("utah","salt-lake-city"),
 ("california","los-angeles"),("california","san-diego"),("california","sacramento"),
 ("california","san-jose"),("california","fresno"),("california","san-francisco"),
 ("washington","seattle"),("washington","spokane"),("oregon","portland"),
 ("illinois","chicago"),("ohio","columbus"),("ohio","cleveland"),("ohio","cincinnati"),
 ("michigan","detroit"),("michigan","grand-rapids"),("minnesota","minneapolis"),
 ("missouri","kansas-city"),("missouri","st-louis"),("indiana","indianapolis"),
 ("wisconsin","milwaukee"),("pennsylvania","philadelphia"),("pennsylvania","pittsburgh"),
 ("new-york","new-york"),("massachusetts","boston"),("maryland","baltimore"),
 ("virginia","virginia-beach"),("virginia","richmond"),("district-of-columbia","washington"),
 ("new-jersey","jersey-city"),("oklahoma","oklahoma-city"),("oklahoma","tulsa"),
 ("louisiana","new-orleans"),("alabama","birmingham"),("south-carolina","charleston"),
 ("kentucky","louisville"),("idaho","boise"),("new-mexico","albuquerque"),
 ("nebraska","omaha"),("iowa","des-moines"),("kansas","wichita"),("hawaii","honolulu"),
 ("connecticut","hartford"),("arkansas","little-rock"),
]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 50000:
        return open(path, encoding='utf-8', errors='replace').read()
    subprocess.run(["curl","-sL","-A",UA,"-m","45","-o",path,url], check=False)
    time.sleep(0.6)
    try:
        return open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return ""

def parse(h, src):
    out=[]
    for b in re.split(r'(?=<h2 )', h):
        m=re.search(r'<span class="inline-block text-balance break-normal">(.*?)</span>', b, re.S)
        if not m: continue
        name=html.unescape(re.sub(r'<[^>]+>','',m.group(1))).strip()
        if not name or len(name)>90: continue
        a=re.search(r'data-track="provider_address">(.*?)</address>', b, re.S)
        addr=html.unescape(re.sub(r'<[^>]+>','',a.group(1))).strip() if a else ''
        w=re.search(r'href="([^"]+)"[^>]*data-track="provider_website"', b)
        web=html.unescape(w.group(1)).split('?')[0] if w else ''
        out.append((name, addr, web, src))
    return out

def main():
    rows=[]
    for st, city in CITIES:
        url=f"https://www.expertise.com/business/property-management/{st}/{city}"
        p=os.path.join(RAW, f"{st}__{city}.html")
        h=fetch(url,p)
        got=parse(h,url)
        print(f"{st}/{city}: {len(got)}", file=sys.stderr)
        rows+=got
    outp=os.path.join(BASE,'raw','expertise_providers.tsv')
    with open(outp,'w',encoding='utf-8') as f:
        f.write("name\taddress\twebsite\tsource_url\n")
        for r in rows:
            f.write("\t".join(x.replace("\t"," ") for x in r)+"\n")
    print(f"total {len(rows)} -> {outp}", file=sys.stderr)

if __name__=='__main__':
    main()
