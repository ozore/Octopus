#!/usr/bin/env python3
"""Confirm a company's own website by trying obvious domain spellings and ACCEPTING
ONLY when the fetched page actually identifies itself as that company (name appears
in <title>, og:site_name or the visible text). Never guesses a URL into the CSV:
if nothing matches, website stays empty. Reads/writes JSON.
Usage: python3 verify_site.py IN.json OUT.json [name_field]"""
import json,re,sys,subprocess,html,os
from concurrent.futures import ThreadPoolExecutor
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
STOP={'inc','llc','ltd','corp','corporation','company','co','the','usa','us','group','holdings','international','fulfillment','logistics','brands','brand'}
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
def cands(name):
    n=re.sub(r'[^A-Za-z0-9 &\-]',' ',name)
    n=re.sub(r'\b(Inc|LLC|L\.L\.C|Ltd|Corp|Corporation|Co|Company|dba)\b\.?','',n,flags=re.I)
    n=re.sub(r'\s+',' ',n).strip()
    toks=[t for t in re.split(r'[ \-&]+',n) if t]
    base=''.join(toks).lower()
    out=[base]
    if len(toks)>1: out.append('-'.join(t.lower() for t in toks))
    if len(toks)>2: out.append(''.join(t.lower() for t in toks[:2]))
    seen=set(); o=[]
    for b in out:
        if 3<=len(b)<=40 and b not in seen: seen.add(b); o.append(b)
    return [f'https://www.{b}.com' for b in o]+[f'https://{b}.com' for b in o]
def head_ok(url,name):
    p=subprocess.run(['curl','-s','-A',UA,'-m','15','-L','--compressed','-w','\n@@%{http_code}@@%{url_effective}',url],capture_output=True)
    body=p.stdout.decode('utf-8','replace')
    m=re.search(r'\n@@(\d+)@@(.*)$',body)
    if not m: return None
    code,eff=m.group(1),m.group(2)
    if code!='200': return None
    doc=body[:m.start()]
    t=re.search(r'<title[^>]*>(.*?)</title>',doc,re.S|re.I)
    title=html.unescape(re.sub(r'<[^>]+>','',t.group(1))).strip() if t else ''
    og=re.search(r'property="og:site_name"\s+content="([^"]*)"',doc)
    txt=norm(title+' '+(og.group(1) if og else '')+' '+re.sub(r'<[^>]+>',' ',doc[:60000]))
    key=norm(re.sub(r'\b(Inc|LLC|Ltd|Corp|Corporation|Co|Company)\b\.?','',name,flags=re.I))
    if len(key)>=5 and key[:18] in txt:
        for bad in ('domainisforsale','buythisdomain','hugedomains','godaddy.com/domainsearch','parkingcrew','sedoparking'):
            if bad in norm(doc[:60000]): return None
        return {'website':re.match(r'(https?://[^/]+)',eff).group(1),'title':title}
    return None
def verify(rec,field='name'):
    for u in cands(rec[field])[:4]:
        r=head_ok(u,rec[field])
        if r: rec.update(r); return rec
    return rec
if __name__=='__main__':
    src,dst=sys.argv[1],sys.argv[2]; field=sys.argv[3] if len(sys.argv)>3 else 'name'
    d=json.load(open(src))
    with ThreadPoolExecutor(max_workers=10) as ex: d=list(ex.map(lambda r: verify(r,field),d))
    json.dump(d,open(dst,'w'),indent=1)
    print(sum(1 for r in d if r.get('website')),'of',len(d),'websites confirmed')
