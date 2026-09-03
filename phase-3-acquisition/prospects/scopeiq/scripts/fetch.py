#!/usr/bin/env python3
"""Cached fetcher: fetch.py <url> [outname]  -> writes raw/<outname>.html, prints status+size."""
import sys, os, subprocess, hashlib, re
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
RAW = os.path.join(BASE, 'raw')
os.makedirs(RAW, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
def slug(u):
    s = re.sub(r'^https?://','',u)
    s = re.sub(r'[^A-Za-z0-9]+','_',s).strip('_')[:90]
    return s + '_' + hashlib.md5(u.encode()).hexdigest()[:6]
def fetch(url, name=None, force=False):
    name = name or slug(url)
    path = os.path.join(RAW, name + '.html')
    if os.path.exists(path) and os.path.getsize(path) > 0 and not force:
        return path, 'cached', os.path.getsize(path)
    r = subprocess.run(['curl','-sL','-m','30','--compressed','-A',UA,
                        '-H','Accept: text/html,application/xhtml+xml,*/*',
                        '-o',path,'-w','%{http_code}',url], capture_output=True, text=True)
    code = r.stdout.strip()
    size = os.path.getsize(path) if os.path.exists(path) else 0
    return path, code, size
if __name__ == '__main__':
    p,c,s = fetch(sys.argv[1], sys.argv[2] if len(sys.argv)>2 else None)
    print(c, s, p)
