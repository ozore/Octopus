#!/usr/bin/env python3
"""Open each URL once, record HTTP status, <title>, and the first contact/partner
page link found on it. Used to verify every partner / channel / excluded row."""
import json,re,sys,subprocess,html
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
def one(u):
    p=subprocess.run(['curl','-s','-A',UA,'-m','25','-L','--compressed','-w','\n@@%{http_code}@@%{url_effective}',u],capture_output=True)
    b=p.stdout.decode('utf-8','replace')
    m=re.search(r'\n@@(\d+)@@(.*)$',b)
    code,eff=(m.group(1),m.group(2)) if m else ('000',u)
    doc=b[:m.start()] if m else ''
    t=re.search(r'<title[^>]*>(.*?)</title>',doc,re.S|re.I)
    title=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',t.group(1)))).strip() if t else ''
    root=re.match(r'(https?://[^/]+)',eff)
    root=root.group(1) if root else ''
    contact=''
    for href,lbl in re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',doc,re.S|re.I):
        l=re.sub(r'<[^>]+>','',lbl).strip().lower()
        h=href.lower()
        if re.search(r'(contact|partner|get-in-touch|talk-to)',h) and not h.startswith('#'):
            contact=urljoin(eff,href)
            if 'partner' in h: break
    mail=''
    mm=re.search(r'mailto:((?:info|sales|hello|contact|partners|support|team)@[A-Za-z0-9.\-]+)',doc,re.I)
    if mm: mail=mm.group(1)
    return {'url':u,'code':code,'final':eff,'root':root,'title':title[:160],'contact':contact,'mail':mail}
if __name__=='__main__':
    urls=[l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith('#')]
    with ThreadPoolExecutor(max_workers=8) as ex: res=list(ex.map(one,urls))
    json.dump(res,open(sys.argv[2],'w'),indent=1)
    for r in res: print(r['code'],r['root'],'|',r['title'][:70],'|',r['contact'][:70],'|',r['mail'])
