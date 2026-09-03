#!/usr/bin/env python3
"""Fetch hoamanagement.com state directory pages, then each company detail page
to capture the company's own website. Run from repo root:
  python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_hoamanagement.py
Output: raw/hoamanagement_companies.tsv (name, city_state, website, detail_url, state_page)
"""
import os,re,html,subprocess,sys,time
BASE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
RAW=os.path.join(BASE,'raw','hoamgmt'); os.makedirs(RAW,exist_ok=True)
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
STATES=["florida","texas","california","arizona","nevada","colorado","georgia","north-carolina",
"south-carolina","tennessee","virginia","maryland","washington","oregon","illinois","ohio",
"michigan","minnesota","missouri","indiana","pennsylvania","new-york","massachusetts",
"new-jersey","utah","oklahoma","louisiana","alabama","wisconsin","kentucky","idaho","new-mexico","hawaii"]
SKIP=('facebook','twitter','linkedin','instagram','youtube','w3.org','gravatar','gstatic','gmpg.org',
 'google','hoamanagement.com','innago.com','condocontrolcentral.com','westernalliancebancorporation',
 'wordpress','jquery','bootstrapcdn','fonts.googleapis')

def get(url,path):
    if not (os.path.exists(path) and os.path.getsize(path)>5000):
        subprocess.run(["curl","-sL","-A",UA,"-m","40","-o",path,url],check=False); time.sleep(0.25)
    try: return open(path,encoding='utf-8',errors='replace').read()
    except Exception: return ""

def main():
    rows=[]; seen=set()
    for st in STATES:
        su=f"https://www.hoamanagement.com/state/{st}/"
        h=get(su,os.path.join(RAW,f"state_{st}.html"))
        items=re.split(r'(?=<div class="listing-item">)',h)
        got=0
        for it in items[1:]:
            m=re.search(r"href='(https://www\.hoamanagement\.com/association-management-company/([a-z0-9-]+)/)'",it)
            if not m: continue
            slug=m.group(2); det=m.group(1)
            a=re.search(r'<div class="company-address"><h4><a[^>]*>(.*?)</a>',it,re.S)
            addr=html.unescape(re.sub(r'<br\s*/?>',', ',a.group(1))).strip() if a else ''
            addr=re.sub(r'<[^>]+>','',addr); addr=re.sub(r'\s+',' ',addr)
            if slug in seen: continue
            seen.add(slug)
            dh=get(det,os.path.join(RAW,f"co_{slug}.html"))
            t=re.search(r'<title>(.*?)</title>',dh,re.S)
            name=html.unescape(t.group(1)).split('|')[0].split(' - ')[0].strip() if t else slug.replace('-',' ').title()
            web=''
            for mm in re.finditer(r'href="(https?://[^"]+)"',dh):
                u=mm.group(1)
                if any(s in u.lower() for s in SKIP): continue
                web=u.split('?')[0]; break
            rows.append((name,addr,web,det,su)); got+=1
        print(f"{st}: {got}",file=sys.stderr)
    out=os.path.join(BASE,'raw','hoamanagement_companies.tsv')
    with open(out,'w',encoding='utf-8') as f:
        f.write("name\taddress\twebsite\tdetail_url\tstate_page\n")
        for r in rows: f.write("\t".join(x.replace('\t',' ') for x in r)+"\n")
    print(f"total {len(rows)}",file=sys.stderr)
if __name__=='__main__': main()
