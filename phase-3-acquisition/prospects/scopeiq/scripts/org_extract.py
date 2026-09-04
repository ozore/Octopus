#!/usr/bin/env python3
"""Extract title + contact route + generic mailbox from fetched org homepages."""
import re,html,os,json,sys
BAD=re.compile(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.',re.I)
MAIL=re.compile(r'\b((?:info|hello|contact|office|sales|support|partners|partnerships|inquiries|admin|marketing|press|media|help|team|business|franchise|customerservice|clientcare|service)@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})',re.I)
def base(u):
    m=re.match(r'(https?://[^/]+)',u); return m.group(1) if m else u
def extract(path,url):
    h=open(path,encoding='utf-8',errors='ignore').read()
    t=re.search(r'<title[^>]*>(.*?)</title>',h,re.S|re.I)
    title=html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',t.group(1)))).strip() if t else ''
    body=re.sub(r'<(script|style)[^>]*>.*?</\1>','',h,flags=re.S|re.I)
    plain=html.unescape(re.sub(r'<[^>]+>',' ',body))
    mails=[m for m in MAIL.findall(plain) if not BAD.search('@'+m.split('@',1)[1])]
    # rank contact-ish links
    cands=[]
    for m in re.finditer(r'href="([^"#]+)"',body):
        u=html.unescape(m.group(1))
        lu=u.lower()
        for pat,score in [('/partner',10),('partners',10),('/contact',9),('contact-us',9),('/franchis',8),
                          ('/about/contact',9),('become-a',7),('/support',4),('/book',3),('/demo',5)]:
            if pat in lu:
                if u.startswith('http'):
                    if base(u)!=base(url) and 'franchis' not in lu and 'partner' not in lu: continue
                    full=u
                elif u.startswith('/'): full=base(url)+u
                else: continue
                cands.append((score,full)); break
    cands.sort(key=lambda x:-x[0])
    seen=set(); ordered=[]
    for s,u in cands:
        if u in seen: continue
        seen.add(u); ordered.append(u)
    return dict(title=title, contact=ordered[:4], mail=mails[0] if mails else '')
if __name__=='__main__':
    d=sys.argv[1]
    out={}
    for line in open(os.path.join(d,'_status.tsv')):
        c,u,p=line.rstrip('\n').split('\t')
        if c not in ('200','cached') or not os.path.exists(p) or os.path.getsize(p)<3000: continue
        try: out[u]=extract(p,u)
        except Exception as e: out[u]={'err':str(e)}
    print(json.dumps(out,indent=1))
