#!/usr/bin/env python3
"""Fetch BBB search results for 'Commercial Property Management' across metros and
extract accredited/listed business names, category, city and BBB profile URL.
Run from repo root: python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_bbb.py
Output: raw/bbb_commercial.tsv
"""
import os,re,html,json,subprocess,sys,time
from urllib.parse import quote
BASE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
RAW=os.path.join(BASE,'raw','bbb'); os.makedirs(RAW,exist_ok=True)
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
METROS=["Chicago, IL","Atlanta, GA","Dallas, TX","Houston, TX","Denver, CO","Phoenix, AZ",
"Charlotte, NC","Nashville, TN","Tampa, FL","Orlando, FL","Seattle, WA","Portland, OR",
"Minneapolis, MN","Kansas City, MO","Columbus, OH","Indianapolis, IN","St. Louis, MO",
"Philadelphia, PA","Baltimore, MD","Salt Lake City, UT","Las Vegas, NV","San Antonio, TX",
"Raleigh, NC","Milwaukee, WI","Oklahoma City, OK"]
TERM="Commercial Property Management"

def main():
    out=[]
    for loc in METROS:
        for page in (1,2):
            u=(f"https://www.bbb.org/search?find_country=USA&find_loc={quote(loc)}"
               f"&find_text={quote(TERM)}&page={page}")
            p=os.path.join(RAW,re.sub(r'\W+','_',loc)+f"_{page}.html")
            if not (os.path.exists(p) and os.path.getsize(p)>50000):
                subprocess.run(["curl","-sL","-A",UA,"-m","40","-o",p,u],check=False); time.sleep(0.8)
            h=open(p,encoding='utf-8',errors='replace').read()
            names=re.findall(r'"businessName":"(.*?)"',h)
            urls=re.findall(r'"reportUrl":"(.*?)"',h)
            cities=re.findall(r'"addressLocality":"(.*?)","addressRegion":"(.*?)"',h)
            for i,n in enumerate(names):
                nm=html.unescape(n.encode().decode('unicode_escape',errors='ignore')).strip()
                ru=urls[i] if i<len(urls) else ''
                ct=", ".join(cities[i]) if i<len(cities) else ''
                out.append((nm,ct,"https://www.bbb.org"+ru,u))
            print(f"{loc} p{page}: {len(names)}",file=sys.stderr)
    seen=set(); rows=[]
    for r in out:
        k=r[0].lower().strip()
        if not k or k in seen: continue
        seen.add(k); rows.append(r)
    o=os.path.join(BASE,'raw','bbb_commercial.tsv')
    with open(o,'w',encoding='utf-8') as f:
        f.write("name\tcity\tbbb_profile\tsource_url\n")
        for r in rows: f.write("\t".join(x.replace('\t',' ') for x in r)+"\n")
    print("total",len(rows),file=sys.stderr)
if __name__=='__main__': main()
