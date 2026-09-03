#!/usr/bin/env python3
"""Turn the two bulk licence pulls into de-duplicated COMPANY candidate lists.

Inputs (already in ../raw, produced by pull_fl_dbpr.py and pull_cslb.py):
  raw/fl_construction_license.csv   Florida DBPR CILB licensee extract
  raw/cslb_b_companies.csv          California CSLB class-B lists, 11 counties

Outputs:
  raw/candidates_fl.csv, raw/candidates_ca.csv

Rule enforced here (BRIEF 2.1): never keep a row whose licensee is a natural
person. A row survives only if the name carries a corporate/trade token AND no
comma is followed by anything other than a corporate suffix ("SMITH, JOHN" out;
"BUILDING CONCEPTS OF TAMPA BAY, LLC" in).
"""
import csv, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')

SUFFIX = r'(INC|LLC|L\.L\.C|LC|CORP|CORPORATION|INCORPORATED|LTD|LTD\.|LP|L\.P|LLP|PLLC|PA|CO|COMPANY|PC)\b'
TOKENS = ['INC', 'LLC', 'L.L.C', 'CORP', 'INCORPORATED', 'LTD', 'LLP', 'PLLC',
          'COMPANY', 'CO.', 'GROUP', 'ENTERPRISE', 'ASSOCIATES', 'PARTNERS',
          'HOLDINGS', 'CONSTRUCTION', 'CONSTRUCTORS', 'CONSTRUCTIONS', 'BUILDER',
          'BUILDERS', 'BUILDING', 'BUILD', 'CONTRACTOR', 'CONTRACTORS',
          'CONTRACTING', 'DEVELOPMENT', 'DEVELOPERS', 'DEVELOPMENTS', 'HOMES',
          'REMODEL', 'RENOVATION', 'GENERAL', 'INDUSTRIES', 'VENTURES',
          'PROPERTIES', 'MANAGEMENT', 'SERVICES', 'DESIGN', 'STRUCTURES',
          '& SONS', '& SON', 'BROTHERS', 'BROS']
BAD = ['INDIVIDUAL', 'SOLE PROP', 'DBA ', 'ESTATE OF', 'TRUST']

def is_company(name):
    n = (name or '').upper().strip()
    if len(n) < 5:
        return False
    if any(b in n for b in BAD):
        return False
    for part in n.split(',')[1:]:                       # text after every comma
        if not re.match(r'\s*' + SUFFIX, part):
            return False                                # "LAST, FIRST" -> person
    return any(t in n for t in TOKENS)

FORCE = {'LLC': 'LLC', 'L.L.C.': 'LLC', 'LLP': 'LLP', 'PLLC': 'PLLC', 'LP': 'LP',
         'L.P.': 'LP', 'PC': 'PC', 'PA': 'PA', 'INC': 'Inc', 'INC.': 'Inc.',
         'CORP': 'Corp', 'CORP.': 'Corp.', 'CO': 'Co', 'CO.': 'Co.', 'LTD': 'Ltd',
         'LTD.': 'Ltd.', 'USA': 'USA', 'US': 'US', 'DBA': 'dba', 'AND': 'and',
         'THE': 'The', 'OF': 'of'}
VOWELS = set('AEIOUY')

def title(s):
    out = []
    for i, w in enumerate((s or '').split()):
        u = w.upper()
        if u in FORCE:
            out.append(FORCE[u].capitalize() if i == 0 and FORCE[u] in ('and', 'of') else FORCE[u])
        elif len(w) <= 4 and not (set(u) & VOWELS):
            out.append(u)
        elif any(ch.isdigit() for ch in w):
            out.append(u)
        else:
            out.append(w.capitalize())
    return ' '.join(out)

FL_COUNTY = {'23': 'Miami-Dade', '16': 'Broward', '60': 'Palm Beach',
             '39': 'Hillsborough', '46': 'Lee', '62': 'Pinellas',
             '58': 'Orange', '26': 'Duval'}
FL_TYPE = {'CGC': 'Certified General Contractor',
           'CBC': 'Certified Building Contractor'}

def florida():
    src = os.path.join(RAW, 'fl_construction_license.csv')
    seen, out = set(), []
    for r in csv.reader(open(src, encoding='latin-1')):
        if len(r) < 21 or r[1] not in FL_TYPE or r[13] != 'C':
            continue
        if r[11] not in FL_COUNTY or r[9] != 'FL':
            continue
        exp = r[17][-4:]
        if not exp.isdigit() or int(exp) < 2026:
            continue
        name = r[3] if is_company(r[3]) else (r[2] if is_company(r[2]) else '')
        if not name:
            continue
        key = re.sub(r'[^A-Z0-9]', '', name.upper())
        if key in seen:
            continue
        seen.add(key)
        out.append({'name': title(name), 'raw_name': name, 'city': title(r[8]),
                    'state': 'FL', 'zip': r[10], 'county': FL_COUNTY[r[11]],
                    'licence': r[20], 'licence_class': FL_TYPE[r[1]],
                    'issued': r[15], 'expires': r[17]})
    return out

def california():
    src = os.path.join(RAW, 'cslb_b_companies.csv')
    seen, out = set(), []
    for r in csv.DictReader(open(src, encoding='utf-8')):
        if r['BusinessType'] not in ('Corporation', 'Limited Liability', 'Partnership', 'JointVenture'):
            continue
        name = r['BusinessName']
        if not is_company(name):
            continue
        key = re.sub(r'[^A-Z0-9]', '', name.upper())
        if key in seen:
            continue
        seen.add(key)
        out.append({'name': title(name), 'raw_name': name, 'city': title(r['City']),
                    'state': 'CA', 'zip': r['ZIP Code'], 'county': r['County'],
                    'licence': r['LicenseNumber'],
                    'licence_class': 'CSLB class ' + r['Classification(s)'].strip(),
                    'issued': r['IssueDate'], 'expires': r['ExpirationDate'],
                    'entity': r['BusinessType'], 'wc': r['WorkersCompCoverageType'],
                    'wc_carrier': r['WorkersCompInsuranceCompany'],
                    'surety': r['SuretyCompany']})
    return out

def write(rows, path):
    cols = sorted({k for r in rows for k in r})
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    print(path, len(rows))

if __name__ == '__main__':
    write(florida(), os.path.join(RAW, 'candidates_fl.csv'))
    write(california(), os.path.join(RAW, 'candidates_ca.csv'))
