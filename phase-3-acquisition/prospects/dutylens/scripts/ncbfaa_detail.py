#!/usr/bin/env python3
"""Fetch NCBFAA member detail pages for a sample of companies -> website + services.
Personal contact names on those pages are discarded."""
import re,html,json,os,subprocess,random
from concurrent.futures import ThreadPoolExecutor
HERE=os.path.dirname(os.path.abspath(__file__)); RAW=os.path.join(HERE,'..','raw')
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
JAR=os.path.join(RAW,'ncbfaa_jar.txt')
comps=json.load(open(os.path.join(RAW,'ncbfaa_companies.json')))
N=int(os.environ.get('N','300'))
random.seed(7)
# spread across states: round-robin by state
bystate={}
for c in comps: bystate.setdefault(c['state'],[]).append(c)
order=[]
i=0
while len(order)<len(comps):
    added=False
    for st in sorted(bystate):
        if i<len(bystate[st]): order.append(bystate[st][i]); added=True
    if not added: break
    i+=1
sample=order[:N]
def one(c):
    out=subprocess.run(['curl','-s','-A',UA,'-m','40','-L','--compressed','-b',JAR,c['detail']],capture_output=True).stdout.decode('utf-8','replace')
    j=out.find('</header>')
    body=re.sub(r'<(script|style)[^>]*>.*?</\1>','',out[j:],flags=re.S)
    t=re.sub(r'<(br|/p|/div|/li|/h\d|/tr|/td)[^>]*>','\n',body,flags=re.I)
    t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(t)
    lines=[re.sub(r'\s+',' ',l).strip() for l in t.split('\n')]
    lines=[l for l in lines if l]
    d=dict(c)
    for k,label in [('web','Web:'),('phone','Phone:')]:
        if label in lines:
            ix=lines.index(label)
            if ix+1<len(lines): d[k]=lines[ix+1]
    if 'Services:' in lines:
        ix=lines.index('Services:')
        svc=[]
        for l in lines[ix+1:ix+12]:
            if l.startswith('Contact Us') or l.startswith('Membership') or 'Privacy' in l: break
            svc.append(l.rstrip(','))
        d['services']='; '.join(svc)
    if 'Company Address:' in lines:
        ix=lines.index('Company Address:')
        d['addr']=' | '.join(lines[ix+1:ix+4])
    return d
with ThreadPoolExecutor(max_workers=5) as ex:
    res=list(ex.map(one,sample))
json.dump(res,open(os.path.join(RAW,'ncbfaa_detail.json'),'w'),indent=1)
print(len(res),'details;',sum(1 for r in res if r.get('web')),'with website')
