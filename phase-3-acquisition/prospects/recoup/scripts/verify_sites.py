#!/usr/bin/env python3
"""Domain-candidate generator + verifier.

Given a list of organisation names (one per line on stdin or via --in),
build plausible domain candidates, fetch each over HTTPS and accept a
domain only when the returned HTML actually mentions the organisation
name (or its distinctive token). Never invents a URL: a domain is only
emitted after a 200 response whose body matches.

Output: TSV  name <TAB> website <TAB> contact_url <TAB> title
"""
import re, sys, json, subprocess, concurrent.futures, html, argparse

STOP = {'the','inc','inc.','llc','l.l.c.','corp','corp.','corporation','co','co.',
        'ltd','company','companies','group','holdings','enterprises','enterprise',
        'management','partners','restaurants','restaurant','&'}

def norm(s):
    s = s.replace('’',"'").replace('&','and')
    s = re.sub(r"[^A-Za-z0-9 ]", ' ', s)
    return re.sub(r'\s+',' ',s).strip().lower()

def candidates(name):
    n = norm(name)
    words = n.split()
    core = [w for w in words if w not in STOP]
    outs = []
    def add(base):
        for tld in ('com','net','org'):
            outs.append(f"{base}.{tld}")
    add(''.join(words))
    if core and core != words: add(''.join(core))
    if len(core) > 1: add(''.join(core[:2]))
    if core: add(core[0])
    if len(words) > 1: add('-'.join(words))
    seen=set(); res=[]
    for o in outs:
        if o not in seen and len(o.split('.')[0])>=4:
            seen.add(o); res.append(o)
    return res[:9]

def fetch(url, timeout=12):
    try:
        p = subprocess.run(['curl','-sL','--max-time',str(timeout),'--max-filesize','1500000',
                            '-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
                            '-w','\n@@HTTP@@%{http_code}@@%{url_effective}','-o','-',url],
                           capture_output=True, text=True, timeout=timeout+6)
        body = p.stdout
        m = re.search(r'\n@@HTTP@@(\d+)@@(.*)$', body, re.S)
        if not m: return None, None, ''
        return m.group(1), m.group(2).strip(), body[:m.start()]
    except Exception:
        return None, None, ''

def textof(h):
    t = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>',' ',h)
    t = re.sub(r'(?s)<[^>]+>',' ',t)
    return re.sub(r'\s+',' ',html.unescape(t)).lower()

def check(name):
    n = norm(name)
    words = [w for w in n.split() if w not in STOP] or n.split()
    for dom in candidates(name):
        code, eff, body = fetch('https://'+dom)
        if code != '200' or not body or len(body) < 400: continue
        txt = textof(body)
        joined = txt.replace(' ','')
        full = n.replace(' ','')
        if full in joined:
            hit = True
        elif len(words) >= 2:
            hit = all(w in txt for w in words[:2]) and joined.count(words[0]) >= 2
        else:
            hit = False
        if not hit: continue
        if re.search(r'domain (is )?for sale|buy this domain|parked (free|domain)|godaddy\.com/domainsearch', txt): continue
        tm = re.search(r'(?is)<title[^>]*>(.*?)</title>', body)
        title = html.unescape(re.sub(r'\s+',' ',tm.group(1)).strip())[:120] if tm else ''
        contact = ''
        for m in re.finditer(r'(?is)<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', body):
            href, lab = m.group(1), textof(m.group(2))
            if re.search(r'contact', href+' '+lab, re.I):
                if href.startswith('http'): contact = href
                elif href.startswith('/'): contact = eff.split('/')[0]+'//'+eff.split('/')[2]+href
                else: contact = eff.rstrip('/')+'/'+href
                break
        root = eff.split('/')[0]+'//'+eff.split('/')[2]
        return (name, root, contact, title)
    return (name, '', '', '')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='inp', default='-')
    ap.add_argument('--workers', type=int, default=8)
    a = ap.parse_args()
    names = (sys.stdin if a.inp=='-' else open(a.inp)).read().split('\n')
    names = [x.strip() for x in names if x.strip()]
    with concurrent.futures.ThreadPoolExecutor(a.workers) as ex:
        for r in ex.map(check, names):
            print('\t'.join(r), flush=True)

if __name__ == '__main__':
    main()
