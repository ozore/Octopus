#!/usr/bin/env python3
"""Second-pass validator: re-fetch a candidate domain and accept it only when the
page really belongs to the named organisation (full name in the text, or core name
plus an industry keyword). Rejects parked/for-sale/unrelated domains."""
import re, sys, html, json, subprocess, concurrent.futures, argparse

STOP = {'the','inc','inc.','llc','corp','corp.','corporation','co','co.','ltd','company',
        'companies','group','holdings','enterprises','enterprise','management','partners','&'}
KW = ['restaurant','franchise','franchisee','locations','dining','store','clinic','dental',
      'fitness','gym','veterinar','pharmac','urgent care','wash','dispensary','salon','spa',
      'childcare','child care','learning center','insurance','agency','retail','brands','crew members']

def norm(s):
    s=s.replace('’',"'").replace('&','and')
    return re.sub(r'\s+',' ',re.sub(r"[^A-Za-z0-9 ]",' ',s)).strip().lower()

def textof(h):
    t=re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>',' ',h)
    t=re.sub(r'(?s)<[^>]+>',' ',t)
    return re.sub(r'\s+',' ',html.unescape(t)).lower()

def fetch(url,timeout=15):
    try:
        p=subprocess.run(['curl','-sL','--max-time',str(timeout),'--max-filesize','1500000',
            '-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
            '-w','\n@@HTTP@@%{http_code}@@%{url_effective}','-o','-',url],capture_output=True,text=True,timeout=timeout+6)
        b=p.stdout
        m=re.search(r'\n@@HTTP@@(\d+)@@(.*)$',b,re.S)
        if not m: return None,None,''
        return m.group(1),m.group(2).strip(),b[:m.start()]
    except Exception: return None,None,''

def judge(rec):
    name,site,contact,title=rec
    if not site: return rec+('no-site',)
    code,eff,body=fetch(site)
    if code!='200' or len(body)<500: return (name,'','','','dead')
    txt=textof(body)
    tm=re.search(r'(?is)<title[^>]*>(.*?)</title>',body)
    title=html.unescape(re.sub(r'\s+',' ',tm.group(1)).strip())[:130] if tm else ''
    dom=site.split('//')[-1].split('/')[0].replace('www.','')
    if re.search(r'(domain|this site) (is )?for sale|brandbucket|buy this domain|parked|hugedomains|sedo\.com|namecheap market',txt+title.lower()):
        return (name,'','','','parked')
    if (norm(title).replace(' ','')==norm(dom.split('.')[0]) or title.lower().strip()==dom.lower()) \
       and norm(name).replace(' ','') != norm(title).replace(' ','') and len(textof(body))<1200:
        return (name,'','','','placeholder')
    n=norm(name); full=n.replace(' ','')
    core=[w for w in n.split() if w not in STOP] or n.split()
    corejoin=''.join(core)
    joined=txt.replace(' ','')
    ok=False
    if full in joined: ok=True
    elif corejoin in joined and any(k in txt for k in KW): ok=True
    elif len(core)>=2 and all(w in txt for w in core) and any(k in txt for k in KW) and any(w in norm(title) for w in core): ok=True
    if not ok: return (name,'','','','mismatch')
    # contact link
    c=''
    for m in re.finditer(r'(?is)<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',body):
        href,lab=m.group(1),textof(m.group(2))
        if re.search(r'contact',href+' '+lab,re.I) and not href.lower().startswith('mailto'):
            if href.startswith('http'): c=href
            elif href.startswith('/'): c=site+href
            else: c=site.rstrip('/')+'/'+href
            break
    if not c:
        for m in re.finditer(r'(?is)<a[^>]+href=["\']mailto:([^"\'?]+)',body):
            e=m.group(1).strip().lower()
            if re.match(r'^(info|contact|sales|admin|office|hello|inquiries|partners|support|hr|careers)@',e) and not re.search(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.',e):
                c='mailto:'+e; break
    return (name,site,c,title,'ok')

def main():
    a=argparse.ArgumentParser(); a.add_argument('--in',dest='inp'); a.add_argument('--workers',type=int,default=12)
    ar=a.parse_args()
    recs=[]
    for line in open(ar.inp):
        p=line.rstrip('\n').split('\t')
        while len(p)<4: p.append('')
        recs.append(tuple(p[:4]))
    with concurrent.futures.ThreadPoolExecutor(ar.workers) as ex:
        for r in ex.map(judge,recs): print('\t'.join(r),flush=True)

if __name__=='__main__': main()
