#!/usr/bin/env python3
"""Generic miner for public a2z Inc (a2zinc.net) trade-show exhibitor directories.
Usage: SHOW=<base url without /Exhibitors.aspx> TAG=<slug> python3 a2z.py
Step 1: Exhibitors.aspx  -> company name, boothID, sub-expo/category
Step 2: eBooth.aspx      -> city, state, country, website. Keeps everything, flags US.
"""
import re,html,json,os,subprocess,sys
from concurrent.futures import ThreadPoolExecutor
HERE=os.path.dirname(os.path.abspath(__file__)); RAW=os.path.join(HERE,'..','raw')
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
def curl(u,t=60):
    return subprocess.run(['curl','-s','-A',UA,'-m',str(t),'-L','--compressed',u],capture_output=True).stdout.decode('utf-8','replace')
def run(base,tag,limit=None):
    lp=os.path.join(RAW,f'{tag}_list.html')
    s=open(lp,encoding='utf-8',errors='replace').read() if os.path.exists(lp) else curl(base+'/Exhibitors.aspx',120)
    if not os.path.exists(lp): open(lp,'w',encoding='utf-8').write(s)
    rows=[];seen=set()
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',s,flags=re.S):
        nm=re.search(r'<td class="companyName"[^>]*>(.*?)</td>',tr,flags=re.S)
        bid=re.search(r'boothid="(\d+)"',tr)
        cat=re.search(r'<td class="subExpo"[^>]*><span>(.*?)</span></td>',tr,flags=re.S)
        if not (nm and bid): continue
        name=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',nm.group(1)))).strip()
        k=name.lower()
        if not k or k in seen: continue
        seen.add(k)
        rows.append({'name':name,'boothid':bid.group(1),
                     'category':re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',cat.group(1)))).strip() if cat else '','show':tag})
    print(tag,'list rows',len(rows),flush=True)
    if limit: rows=rows[:limit]
    B=base+'/eBooth.aspx?IndexInList=0&FromPage=Exhibitors.aspx&ParentBoothID=&ListByBooth=true&BoothID='
    def det(r):
        h=curl(B+r['boothid'],40); d=dict(r)
        for f,pat in [('city',r'BoothContactCity">(.*?)</span>'),('state',r'BoothContactState">(.*?)</span>'),('country',r'BoothContactCountry">(.*?)<')]:
            m=re.search(pat,h,flags=re.S)
            if m: d[f]=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',m.group(1)))).strip()
        m=re.search(r'id="BoothContactUrl"[^>]*>(.*?)</a>',h,flags=re.S)
        if m: d['web']=re.sub(r'\s+','',html.unescape(re.sub(r'<[^>]+>','',m.group(1)))).strip()
        return d
    with ThreadPoolExecutor(max_workers=8) as ex: res=list(ex.map(det,rows))
    json.dump(res,open(os.path.join(RAW,f'{tag}_detail.json'),'w'),indent=1)
    us=[r for r in res if r.get('country','').lower().startswith('united states')]
    print(tag,len(res),'fetched;',len(us),'US-based')
SHOWS={'asd':'https://asd.a2zinc.net/March2026/Public',
       'nynow':'https://nynow.a2zinc.net/Winter2026/Public',
       'outdoorretailer':'https://or.a2zinc.net/OR2026/Public'}
if __name__=='__main__':
    # No arguments: re-mine all three shows that produced rows in prospects.csv.
    # Override a single show with SHOW=<base url> TAG=<slug> [LIMIT=n].
    lim=int(os.environ['LIMIT']) if os.environ.get('LIMIT') else None
    if os.environ.get('SHOW'):
        run(os.environ['SHOW'],os.environ.get('TAG','show'),lim)
    else:
        for tag,base in SHOWS.items(): run(base,tag,lim)
