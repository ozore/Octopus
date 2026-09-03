#!/usr/bin/env python3
"""Pull California CSLB 'LIST of CONTRACTORS by CLASSIFICATION and COUNTY'
(class B - General Building) for the largest metro counties.

Source: https://www2.cslb.ca.gov/onlineservices/dataportal/ListByCounty
The page is an ASP.NET form; POSTing the classification + county returns an
.xlsx attachment. Run from the repo root:  python3 phase-3-acquisition/prospects/certly-gc/scripts/pull_cslb.py
Writes raw/cslb_<county>.xlsx and raw/cslb_b_companies.csv
"""
import csv, os, re, subprocess, sys, urllib.parse, zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
URL = 'https://www2.cslb.ca.gov/onlineservices/dataportal/ListByCounty'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')
N = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

COUNTIES = {  # CSLB county select values
    '19': 'Los Angeles', '30': 'Orange', '37': 'San Diego', '38': 'San Francisco',
    '1': 'Alameda', '43': 'Santa Clara', '34': 'Sacramento', '7': 'Contra Costa',
    '41': 'San Mateo', '33': 'Riverside', '36': 'San Bernardino',
}

def curl(args):
    return subprocess.run(['curl', '-s', '-A', UA] + args, capture_output=True).stdout

def valid_zip(path):
    try:
        z = zipfile.ZipFile(path)
        return any(n.startswith('xl/worksheets/') for n in z.namelist())
    except Exception:
        return False


def fetch(county):
    jar = os.path.join(RAW, '.cslb.jar')
    page = curl(['-c', jar, '-b', jar, '-L', URL]).decode('utf-8', 'replace')
    def hid(n):
        m = re.search(r'name="%s"[^>]*value="([^"]*)"' % n, page)
        return m.group(1) if m else ''
    data = urllib.parse.urlencode({
        '__EVENTTARGET': '', '__EVENTARGUMENT': '', '__LASTFOCUS': '',
        '__VIEWSTATE': hid('__VIEWSTATE'),
        '__VIEWSTATEGENERATOR': hid('__VIEWSTATEGENERATOR'),
        '__EVENTVALIDATION': hid('__EVENTVALIDATION'),
        'ctl00$MainContent$lbClassification': 'B',
        'ctl00$MainContent$lbCounty': county,
        'ctl00$MainContent$btnSearch': 'Search'})
    out = os.path.join(RAW, 'cslb_%s.xlsx' % county)
    body = os.path.join(RAW, '.post.txt')
    open(body, 'w').write(data)
    subprocess.run(['curl', '-s', '--retry', '3', '--retry-all-errors',
                    '--max-time', '600', '-A', UA, '-b', jar, '-c', jar, '-L', URL,
                    '-H', 'Content-Type: application/x-www-form-urlencoded',
                    '-H', 'Referer: ' + URL, '-H', 'Origin: https://www2.cslb.ca.gov',
                    '--data', '@' + body, '-o', out])
    return out


def fetch_ok(county, tries=4):
    out = os.path.join(RAW, 'cslb_%s.xlsx' % county)
    for _ in range(tries):
        fetch(county)
        if valid_zip(out):
            return out
    return None

def rows_of(path):
    z = zipfile.ZipFile(path)
    shared = [''.join(x.text or '' for x in si.iter(N + 't'))
              for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    sheet = [n for n in z.namelist() if n.startswith('xl/worksheets/')][0]
    t = ET.fromstring(z.read(sheet))
    def cell(c):
        v = c.find(N + 'v')
        if v is None: return ''
        return shared[int(v.text)] if c.get('t') == 's' else (v.text or '')
    for r in t.findall('.//' + N + 'row'):
        yield [cell(c) for c in r.findall(N + 'c')]

def main():
    os.makedirs(RAW, exist_ok=True)
    out = open(os.path.join(RAW, 'cslb_b_companies.csv'), 'w', newline='', encoding='utf-8')
    w = csv.writer(out); hdr = None
    for cid, cname in COUNTIES.items():
        path = os.path.join(RAW, 'cslb_%s.xlsx' % cid)
        if not valid_zip(path):
            path = fetch_ok(cid)
        if not path:
            print('FAILED', cname); continue
        it = rows_of(path)
        head = next(it)
        if hdr is None:
            hdr = head; w.writerow(hdr)
        n = 0
        for r in it:
            r = (r + [''] * len(hdr))[:len(hdr)]
            w.writerow(r); n += 1
        print(cname, n)
    out.close()

if __name__ == '__main__':
    main()
