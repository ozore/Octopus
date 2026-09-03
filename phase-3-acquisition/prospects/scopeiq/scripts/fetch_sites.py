#!/usr/bin/env python3
"""Parallel cached fetcher: fetch_sites.py <tsv: url \t key> <outdir>"""
import sys, os, subprocess
from concurrent.futures import ThreadPoolExecutor
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
tsv, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
jobs=[]
for line in open(tsv):
    line=line.rstrip('\n')
    if not line.strip(): continue
    parts=line.split('\t')
    url=parts[0]; key=parts[1] if len(parts)>1 else str(abs(hash(url)))
    jobs.append((url, os.path.join(outdir, key+'.html')))
def go(j):
    url, path = j
    if os.path.exists(path) and os.path.getsize(path)>0: return ('cached', url, path)
    r=subprocess.run(['curl','-sL','-m','20','--compressed','-A',UA,'-o',path,'-w','%{http_code}',url],
                     capture_output=True, text=True)
    code=r.stdout.strip()
    if os.path.exists(path) and os.path.getsize(path)==0: os.remove(path)
    return (code, url, path)
with ThreadPoolExecutor(max_workers=14) as ex:
    res=list(ex.map(go, jobs))
import collections
print(collections.Counter(r[0] for r in res))
with open(os.path.join(outdir,'_status.tsv'),'w') as f:
    for c,u,p in res: f.write(f"{c}\t{u}\t{p}\n")
