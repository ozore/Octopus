#!/usr/bin/env python3
"""Open each candidate company website, confirm it resolves, capture the page
title and find a contact page URL (BRIEF 2.2: business contact routes only).

Input : raw/assoc_members.csv (column `website`)
Output: raw/site_checks.csv  name,website_final,http,title,contact_route,evidence
"""
import csv, html, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
CONTACT = re.compile(r'href=["\']([^"\']*(?:contact|Contact|CONTACT)[^"\']*)["\']')
GENERIC = re.compile(r'\b((?:info|contact|sales|admin|office|estimating|hello|inquiries|bids|partners|support)@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b')

def get(url):
    p = subprocess.run(['curl', '-s', '-L', '--max-time', '25', '--compressed',
                        '-A', UA, '-w', '\n@@%{http_code}@@%{url_effective}', url],
                       capture_output=True)
    body = p.stdout.decode('utf-8', 'replace')
    m = body.rsplit('\n@@', 1)
    if len(m) != 2:
        return '', '', ''
    code, final = m[1].split('@@', 1)
    return m[0], code, final

def check(row):
    url = (row.get('website') or '').strip()
    out = dict(row); out.update(website_final='', http='', title='', contact_route='', mailbox='')
    if not url:
        return out
    body, code, final = get(url)
    out['http'] = code; out['website_final'] = final
    if code not in ('200', '301', '302'):
        return out
    t = re.search(r'<title[^>]*>(.*?)</title>', body, re.S | re.I)
    out['title'] = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t.group(1)))).strip()[:120] if t else ''
    base = re.match(r'(https?://[^/]+)', final or url)
    base = base.group(1) if base else ''
    for href in CONTACT.findall(body):
        if href.startswith('mailto:') or href.startswith('#') or 'javascript' in href:
            continue
        if re.search(r'wp-content|wp-includes|/plugins?/|\.(js|css|php|json|xml|png|svg)(\?|$)', href, re.I):
            continue
        href = re.sub(r'^\./', '/', href)
        u = href if href.startswith('http') else (base + ('' if href.startswith('/') else '/') + href)
        if base and base.split('//')[1].split('/')[0].split('.')[-2:] == u.split('//')[-1].split('/')[0].split('.')[-2:]:
            out['contact_route'] = u
            break
    g = GENERIC.search(body)
    if g and not re.search(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.', g.group(1), re.I):
        out['mailbox'] = g.group(1)
    if not out['contact_route'] and out['mailbox']:
        out['contact_route'] = 'mailto:' + out['mailbox']
    return out

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAW, 'assoc_members.csv')
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(RAW, 'site_checks.csv')
    rows = list(csv.DictReader(open(src, encoding='utf-8')))
    rows = [r for r in rows if (r.get('website') or '').strip()]
    with ThreadPoolExecutor(max_workers=8) as ex:
        done = list(ex.map(check, rows))
    cols = list(done[0].keys())
    with open(dst, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(done)
    ok = sum(1 for d in done if d['http'] == '200')
    print(dst, len(done), 'checked,', ok, 'HTTP 200,',
          sum(1 for d in done if d['contact_route']), 'with contact route')

if __name__ == '__main__':
    main()
