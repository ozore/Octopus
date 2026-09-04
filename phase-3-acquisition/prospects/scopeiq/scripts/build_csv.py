#!/usr/bin/env python3
"""Rebuild phase-3-acquisition/prospects/scopeiq/prospects.csv from the collected data.
Run from the repo root with no arguments:  python3 phase-3-acquisition/prospects/scopeiq/scripts/build_csv.py
Inputs (all produced earlier by scripts/yp_harvest.py, scripts/fetch_sites.py and hand curation):
  data/curated.py         hand-written organisation rows, each with a source_url that was opened
  data/yp_verified.json   yellowpages med spa listings whose own homepage was opened and confirmed
  data/amspa_vendors.json AmSpa vendor directory, parsed from the association's own page
"""
import os, sys, csv, json, re

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(BASE, 'data'))
import curated  # noqa: E402

COLS = ['app','prospect_type','segment','name','website','location','size_signal','fit_rationale',
        'contact_route','decision_maker_role','source_url','source_type','confidence','collected_on','notes']
APP='scopeiq'; DATE='2026-09-03'
BADMAIL = re.compile(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.', re.I)

def norm(s):
    return re.sub(r'\s+', ' ', (s or '')).strip()


# --- BRIEF 2.1: no private individuals. A directory listing whose NAME is a person
# (first name + surname, "<Business> by <FirstName>", or "<Personal name>, MD") identifies a
# private individual, so the row is dropped even though the underlying business is in the ICP.
# Business names that merely contain a surname (e.g. "Dr Refresh Med Spa") are kept.
PERSON_NAMES = {
 'Aesthetics By Mahreen', 'Nash Injections By Hannah', 'Paige Campbell, SLUCare Clinical Esthetician',
 'Abraham Pathak, MD | The Aesthetic Room Med Spa', 'Aurora Dejuliis, MD European Medical Spa',
 'Polaris Vein & Aesthetics: Amanda Cooper, MD', 'Randy Lindgren Aesthetic Rejuvenation',
 'French Med Spa & Cryotherapie: Karen French, DC', 'Robert Andrews Laser & Medical Aesthetics',
 'Randy Rudderman MD Plastic Surgery & Medical Spa',
 'Engineered Aesthetics Plastic Surgery Institute | Dr. Nitin J. Engineer',
 'Amber Laine Med Spa + Salon', 'Dr. Busso Cosmetic Dermatologist - Botox, Laser, Fillers, PRP, Semaglutide',
 'Dr Assif Med Spa', 'Lips By Sivan', 'Glaser, Laura', 'Chanel Frances & Co. Aesthetics and Beauty',
}
PERSON_RE = re.compile(
    r"\b(by|with)\s+[A-Z][a-z]{2,}\s*$"          # "... by <FirstName>"
    r"|,\s*(MD|DO|RN|NP|PA-C|APRN|DNP|FNP|MSN)\b"  # "<Personal name>, MD"
    r"|^[A-Z][a-z]+,\s+[A-Z][a-z]+$", re.I)        # "Lastname, Firstname"

def is_person(name):
    return name in PERSON_NAMES or bool(PERSON_RE.search(name))

rows = []
def emit(d):
    r = {c: '' for c in COLS}
    r['app'] = APP; r['collected_on'] = DATE
    for k, v in d.items():
        if k in r: r[k] = norm(v)
    if BADMAIL.search(r['contact_route'] + ' ' + r['notes']):
        r['contact_route'] = ''
        r['notes'] = BADMAIL.sub('@[personal-mailbox-removed].', r['notes'])
    rows.append(r)

# 1) curated organisation rows -------------------------------------------------
for d in curated.R:
    emit(d)

# 2) AmSpa vendor directory: anything not already covered by a curated row -----
def key(n):
    n = n.lower()
    n = re.sub(r'\(.*?\)', ' ', n)
    n = re.sub(r'\b(inc|llc|ltd|group|the|co|corp|company|solutions|systems|pro|us)\b', ' ', n)
    return re.sub(r'[^a-z0-9]', '', n)

have = {key(r['name']) for r in rows}
CATSEG = [
    ('Practice Management Software','med spa software / EMR'), ('Booking Software','med spa software / EMR'),
    ('Patient Communications','med spa software / EMR'), ('Information Technology','med spa software / EMR'),
    ('Injectables','device & injectable manufacturer'), ('Lasers','device & injectable manufacturer'),
    ('Body Contouring','device & injectable manufacturer'), ('Microneedling','device & injectable manufacturer'),
    ('Ultrasound','device & injectable manufacturer'), ('PDO Threads','device & injectable manufacturer'),
    ('Exosomes','device & injectable manufacturer'),
    ('Skin Care Products','professional skincare'), ('Pharmaceuticals','compounding pharmacy'),
    ('Patient Financing','patient finance / lender'), ('Credit Card','patient finance / lender'),
    ('Merchant Processing','patient finance / lender'), ('Banking & Loans','patient finance / lender'),
    ('Insurance','insurance & risk'), ('Risk & Compliance Mitigation','insurance & risk'),
    ('Marketing','aesthetics marketing agency'), ('Reputation Management','aesthetics marketing agency'),
    ('Sales Training','aesthetic training company'),
    ('Hiring & Recruiting','med spa hiring & HR'), ('Human Resources','med spa hiring & HR'),
    ('Bookkeeping & Accounting','med spa consultant / M&A advisor'),
    ('Business Consulting','med spa consultant / M&A advisor'),
    ('Real Estate','med spa consultant / M&A advisor'),
    ('Med Spa Supplies & Equipment','med spa supplies & equipment'),
    ('Phones','med spa software / EMR'), ('AI','med spa software / EMR'),
]
added_amspa = 0
for v in json.load(open(os.path.join(BASE, 'data', 'amspa_vendors.json'))):
    if key(v['name']) in have: continue
    seg = 'med spa vendor (AmSpa affiliate)'
    for cat, s in CATSEG:
        if cat.lower() in v['categories'].lower(): seg = s; break
    emit(dict(prospect_type='partner', segment=seg, name=v['name'],
              website=v['website'] if v['website'].startswith('http') and 'americanmedspa.org' not in v['website'] else '',
              location='', size_signal='',
              fit_rationale='Vetted AmSpa vendor affiliate selling into medical spas (%s); it already has a channel into the exact organisations that buy a state launch compliance report.' % (v['categories'] or 'category not stated'),
              contact_route=v['website'] if v['website'].startswith('http') else '',
              decision_maker_role='head of partnerships',
              source_url='https://www.americanmedspa.org/vendor-directory/',
              source_type='association-directory', confidence='secondary',
              notes=('AmSpa %s-tier vendor affiliate. %s' % (v['tier'], v['benefit'])).strip()))
    have.add(key(v['name'])); added_amspa += 1

# 3) single-location med spas confirmed by opening their own homepage ----------
STATE_OK = re.compile(r'^(.*),\s*([A-Z]{2})\s*\d{0,5}')
added_spa = 0
skipped_person = 0
spa_src = json.load(open(os.path.join(BASE, 'data', 'yp_verified.json'))) + \
          json.load(open(os.path.join(BASE, 'data', 'yp_verified2.json')))
for s in spa_src:
    if is_person(s['name']):
        skipped_person += 1
        continue
    m = STATE_OK.match(s['locality'])
    loc = '%s, %s' % (m.group(1).strip(), m.group(2)) if m else s['locality']
    procs = ', '.join(s.get('procedures') or [])
    note = ('Procedures found on its own site: %s. ' % procs) if procs else ''
    note += 'Found in the yellowpages.com Medical Spas category for %s, then confirmed by opening the practice\'s own homepage.' % s['metro']
    if s.get('snippet'):
        note += ' Directory description: "%s"' % s['snippet'][:180]
    contact = s.get('contact_route') or ''
    if not contact and s.get('mail'): contact = s['mail']
    emit(dict(prospect_type='end-customer', segment='single-location med spa', name=s['name'],
              website=s['website'], location=loc, size_signal='',
              fit_rationale='An independent medical aesthetic practice in %s whose own site advertises %s - it operates under one state\'s supervision, delegation and ownership rules and has no in-house counsel.' % (
                  m.group(2) if m else 'the US', (procs.split(',')[0] if procs else 'medical aesthetic treatments')),
              contact_route=contact, decision_maker_role='owner',
              source_url=s['source_url'], source_type='directory', confidence='verified', notes=note))
    added_spa += 1

# 4) dedupe on name+website ----------------------------------------------------
seen = {}; out = []
for r in rows:
    k = (r['name'].lower().strip(), r['website'].lower().strip())
    if k in seen:
        # keep the richer row
        if len(str(r)) > len(str(seen[k])): out[out.index(seen[k])] = r; seen[k] = r
        continue
    seen[k] = r; out.append(r)

path = os.path.join(BASE, 'prospects.csv')
with open(path, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_ALL)
    w.writeheader()
    for r in out: w.writerow(r)
print('curated=%d amspa_added=%d medspas=%d (skipped %d personal-name listings) -> %d rows after dedupe' % (len(curated.R), added_amspa, added_spa, skipped_person, len(out)))
