#!/usr/bin/env python3
"""North Carolina Licensing Board for General Contractors - public licensee search.

The public search page https://portal.nclbgc.org/Public/Search posts to
/Public/_Search/ and returns an HTML fragment. We query classification
'Building' (id 27) city by city and keep only ACTIVE company licences.
Writes raw/nc_nclbgc_building.csv
"""
import csv, html, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
URL = 'https://portal.nclbgc.org/Public/_Search/'
UA = 'Mozilla/5.0'
CITIES = ['CHARLOTTE', 'RALEIGH', 'GREENSBORO', 'DURHAM', 'WINSTON-SALEM',
          'WILMINGTON', 'CARY', 'ASHEVILLE', 'HIGH POINT', 'FAYETTEVILLE',
          'CONCORD', 'HUNTERSVILLE', 'MATTHEWS', 'GREENVILLE', 'APEX',
          'MORRISVILLE', 'MOORESVILLE', 'CHAPEL HILL', 'MONROE', 'GASTONIA']
CLASS = {'27': 'Building', '28': 'Residential'}

def query(city, cls):
    data = ('CompanyName=&FirstName=&LastName=&AccountNumber=&QualifierAccountNumber='
            '&streetAddress=&City=%s&StateCode=NC&PostalCode=&PhoneNumber='
            '&ClassificationDefinitionIdnt=%s&useSoundex=false' % (city.replace(' ', '+'), cls))
    return subprocess.run(['curl', '-s', '--max-time', '120', '-A', UA, '-L', URL,
                           '-H', 'X-Requested-With: XMLHttpRequest',
                           '-H', 'Referer: https://portal.nclbgc.org/Public/Search',
                           '--data', data], capture_output=True).stdout.decode('utf-8', 'replace')

def parse(frag, city, cls):
    out = []
    for tr in re.findall(r'<tr>(.*?)</tr>', frag, re.S):
        lic = re.search(r'>([LQ]\.\d+)</a>', tr)
        if not lic:
            continue
        active = 'License Not Active' not in tr and 'Not Active' not in tr
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)
        if len(tds) < 3:
            continue
        typ = re.sub(r'<[^>]+>', '', tds[1]).strip()
        owner = html.unescape(re.sub(r'<[^>]+>', ' ', tds[2]))
        owner = re.split(r'\bAKA:', owner)[0]
        owner = re.sub(r'\s+', ' ', owner).strip().rstrip(',').strip()
        owner = re.sub(r',?\s*T/A$', '', owner).strip()
        if not owner or typ != 'License':
            continue
        out.append({'licence': lic.group(1), 'name': owner, 'city': city.title(),
                    'state': 'NC', 'classification': CLASS[cls],
                    'active': 'yes' if active else 'no'})
    return out

def main():
    rows, seen = [], set()
    for city in CITIES:
        frag = query(city, '27')
        got = parse(frag, city, '27')
        for r in got:
            k = re.sub(r'[^a-z0-9]', '', r['name'].lower())
            if k in seen:
                continue
            seen.add(k)
            rows.append(r)
        print(city, len(got))
    path = os.path.join(RAW, 'nc_nclbgc_building.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['licence', 'name', 'city', 'state',
                                          'classification', 'active'])
        w.writeheader(); w.writerows(rows)
    print(path, len(rows))

if __name__ == '__main__':
    main()
