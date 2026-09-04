#!/usr/bin/env python3
"""Fetch a URL with curl and dump visible text (and optionally links). Usage:
   python3 fetch.py URL [outname] [--links]"""
import subprocess,sys,re,html,os
RAW=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','raw')
def get(url,out=None,timeout=45):
    os.makedirs(RAW,exist_ok=True)
    p=subprocess.run(['curl','-s','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                      '-m',str(timeout),'-L','--compressed',url],capture_output=True)
    data=p.stdout.decode('utf-8',errors='replace')
    if out: open(os.path.join(RAW,out),'w',encoding='utf-8').write(data)
    return data
def text(s):
    b=s.find('<body')
    body=s[b:] if b>=0 else s
    body=re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>','',body,flags=re.S|re.I)
    t=re.sub(r'<(br|/p|/div|/li|/h\d|/tr|/td|/a|/option)[^>]*>','\n',body,flags=re.I)
    t=re.sub(r'<[^>]+>',' ',t)
    t=html.unescape(t)
    lines=[re.sub(r'\s+',' ',l).strip() for l in t.split('\n')]
    return '\n'.join(l for l in lines if l)
def links(s,base=''):
    out=[]
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',s,flags=re.S|re.I):
        href=m.group(1); lbl=re.sub(r'<[^>]+>','',m.group(2)); lbl=re.sub(r'\s+',' ',html.unescape(lbl)).strip()
        out.append((href,lbl))
    return out
if __name__=='__main__':
    url=sys.argv[1]; out=sys.argv[2] if len(sys.argv)>2 and not sys.argv[2].startswith('--') else None
    s=get(url,out)
    if '--links' in sys.argv:
        for h,l in links(s):
            if l: print(f'{l}\t{h}')
    else:
        print(text(s))
