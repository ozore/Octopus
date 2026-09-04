#!/usr/bin/env python3
"""Probe a list of company websites: fetch the homepage, record HTTP status, <title>,
a contact-page URL found in the nav, and any sentence stating a portfolio size
(units / doors / homes / properties / associations / communities managed).
Usage:  python3 probe_sites.py <input.tsv> <output.tsv>
Input TSV: name<TAB>website  (header row skipped)
Run with no args from repo root to probe the default expertise sample.
"""
import os,re,html,subprocess,sys,time
from urllib.parse import urljoin, urlparse
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
BASE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
CACHE=os.path.join(BASE,'raw','sites'); os.makedirs(CACHE,exist_ok=True)
SIZE=re.compile(r'([\d][\d,\.]{1,9}\+?)\s*(?:\+\s*)?(units|doors|rental homes|homes|single-family homes|properties|apartments|associations|communities|residents|homeowners|square feet|sq\. ft\.|sf)\b',re.I)
VERB=re.compile(r'\b(manage|managing|managed|under management|oversee|serving|serve|portfolio)\b',re.I)

def slug(u):
    return re.sub(r'[^a-z0-9]+','_',urlparse(u).netloc.lower())[:60]

def fetch(url):
    p=os.path.join(CACHE, slug(url)+'.html')
    if not (os.path.exists(p) and os.path.getsize(p)>500):
        subprocess.run(["curl","-sL","-A",UA,"-m","25","--compressed","-o",p,url],check=False)
    try: return open(p,encoding='utf-8',errors='replace').read()
    except Exception: return ''

def probe(url):
    h=fetch(url)
    if len(h)<400: return dict(status='fail',title='',contact='',size='')
    t=re.search(r'<title[^>]*>(.*?)</title>',h,re.S|re.I)
    title=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>','',t.group(1)))).strip()[:120] if t else ''
    contact=''
    for m in re.finditer(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>',h,re.S|re.I):
        href,txt=m.group(1),re.sub('<[^>]+>','',m.group(2)).strip().lower()
        if re.search(r'\bcontact\b',txt) or re.search(r'/contact',href,re.I):
            contact=urljoin(url,html.unescape(href)); break
    body=re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>',' ',h)
    text=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',body)))
    size=''
    for m in SIZE.finditer(text):
        seg=text[max(0,m.start()-90):m.end()+50]
        if VERB.search(seg):
            size=re.sub(r'\s+',' ',seg).strip()[:150]; break
    return dict(status='ok',title=title,contact=contact,size=size)

def main():
    inp,out=(sys.argv[1],sys.argv[2]) if len(sys.argv)>2 else (os.path.join(BASE,'raw','probe_in.tsv'),os.path.join(BASE,'raw','probe_out.tsv'))
    rows=[l.rstrip('\n').split('\t') for l in open(inp,encoding='utf-8')][1:]
    with open(out,'w',encoding='utf-8') as f:
        f.write("name\twebsite\tstatus\ttitle\tcontact\tsize\n")
        for i,r in enumerate(rows):
            if len(r)<2 or not r[1].startswith('http'): continue
            d=probe(r[1])
            f.write("\t".join([r[0],r[1],d['status'],d['title'],d['contact'],d['size']]).replace('\n',' ')+"\n")
            f.flush()
            if i%25==0: print(i,file=sys.stderr)
    print('done',file=sys.stderr)
if __name__=='__main__': main()
