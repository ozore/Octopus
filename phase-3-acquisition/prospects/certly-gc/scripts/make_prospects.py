#!/usr/bin/env python3
"""Turn the raw licence pulls + association scrape into the end-customer half of
prospects.csv.  Deterministic (no randomness): candidates are ranked by ICP
proxies and the top N per metro are taken, so re-running reproduces the file.

Writes raw/rows_endcustomers.csv, which assemble.py merges with the curated
partner / channel / excluded rows.
"""
import csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
TODAY = '2026-09-03'
APP = 'certly'

COLS = ['app', 'prospect_type', 'segment', 'name', 'website', 'location', 'size_signal',
        'fit_rationale', 'contact_route', 'decision_maker_role', 'source_url',
        'source_type', 'confidence', 'collected_on', 'notes']

# names that are clearly a single trade, not a general contractor
TRADE = re.compile(r'\b(ROOF|POOL|PLUMB|ELECTRIC|AIR COND|A/?C\b|HVAC|HEATING|PAVING|ASPHALT|'
                   r'LANDSCAP|LAWN|TREE|FENCE|GLASS|WINDOW|DOOR|SOLAR|SEPTIC|WELL DRILL|'
                   r'MARINE|DOCK|SEAWALL|SIGN|CARPET|FLOOR|TILE|PAINT|DRYWALL|STUCCO|'
                   r'MASONRY|CONCRETE|DEMOLITION|CLEANING|JANITOR|INSPECTION|ELEVATOR|'
                   r'ALARM|SECURITY|IRRIGAT|GUTTER|SIDING|INSULAT|EXCAVAT|SEALCOAT|MOLD|'
                   r'WATERPROOF|PEST|LEASING|STAFFING|REALTY|REAL ESTATE|MORTGAGE|'
                   r'PLUMBING|SPRINKLER|AWNING|SHUTTER|SCREEN|CABINET|COUNTERTOP|'
                   r'GRANITE|APPLIANCE|FURNITURE|MOVING|TRUCK|TOWING|AUTO|RESTAURANT|PLBG|HTG|\bHTG\b|'
                   r'FURNACE|FUEL|SHEET METAL|MECHANICAL|REFRIGERAT|PIPELINE|DRILLING|'
                   r'LOGGING|SURVEY|ENGINEERING|ARCHITECT|SUPPLY|EQUIPMENT|RENTAL|BANK|'
                   r'INSURANCE|HARDWARE|BORING|SALVAGE|DIVING|AGGREGATE|GRAVEL|ASBESTOS|'
                   r'ENVIRONMENTAL|TESTING|LABORATOR|CRANE|SCAFFOLD|STEEL ERECT)', re.I)
GC = re.compile(r'\b(CONSTRUCTION|CONSTRUCTORS|BUILDER|BUILDERS|BUILDING|BUILD|CONTRACTOR|'
                r'CONTRACTORS|CONTRACTING|DEVELOPMENT|DEVELOPERS|GENERAL|HOMES|'
                r'CONSTRUCTION GROUP|DESIGN)\b', re.I)


MULTI = re.compile(r'\b(HOMES|HOMEBUILD|RESIDENTIAL|APARTMENT|MULTIFAMILY|MULTI-FAMILY|'
                   r'COMMUNITIES|LIVING|VILLAS|ESTATES)\b', re.I)
DB = re.compile(r'DESIGN[ /&\-]+BUILD|DESIGN BUILD|DESIGNBUILD', re.I)


def segment_for(name, default='commercial GC'):
    if DB.search(name):
        return 'design-build GC'
    if MULTI.search(name):
        return 'residential / multifamily builder'
    return default


NOT_GC = re.compile(r'\b(AGGREGATE|GRAVEL|SUPPLY|SUPPLIES|PRODUCTS|HARDWARE|RENTAL|RENTALS|'
                    r'EQUIPMENT|SURVEY|SURVEYING|MAPPING|COATINGS|LUMBER|CONCRETE READY|'
                    r'TRUCKING|FUEL|OIL|BANK|INSURANCE|STAFFING|SALVAGE|DIVING)\b', re.I)


def out_row(**kw):
    r = {c: '' for c in COLS}
    r.update(app=APP, collected_on=TODAY, prospect_type='end-customer')
    r.update(kw)
    return r


# ---------------------------------------------------------------- Florida ----
FL_SRC = 'https://www2.myfloridalicense.com/sto/file_download/extracts//CONSTRUCTIONLICENSE_1.csv'
FL_QUOTA = {'Miami-Dade': 25, 'Broward': 22, 'Palm Beach': 20, 'Hillsborough': 18,
            'Orange': 18, 'Pinellas': 16, 'Lee': 16, 'Duval': 15}

def florida():
    rows = list(csv.DictReader(open(os.path.join(RAW, 'candidates_fl.csv'), encoding='utf-8')))
    def score(r):
        n = r['raw_name'].upper()
        s = 0
        if r['licence_class'].startswith('Certified General'): s += 3
        if GC.search(n): s += 2
        if TRADE.search(n): s -= 8
        yr = r['issued'][-4:]
        if yr.isdigit() and int(yr) <= 2015: s += 2
        if yr.isdigit() and int(yr) <= 2005: s += 1
        if len(n) > 45: s -= 1
        return -s, r['name']
    picked = []
    for county, quota in FL_QUOTA.items():
        cgc = sorted([r for r in rows if r['county'] == county
                      and r['licence_class'].startswith('Certified General')], key=score)
        cbc = sorted([r for r in rows if r['county'] == county
                      and r['licence_class'].startswith('Certified Building')], key=score)
        ncgc = (quota * 6 + 9) // 10
        picked += cgc[:ncgc] + cbc[:quota - ncgc]
    out = []
    for r in picked:
        cls = r['licence_class']
        out.append(out_row(
            segment=segment_for(r['name'],
                                'commercial GC' if cls.startswith('Certified General')
                                else 'building contractor'),
            name=r['name'],
            location='%s, FL' % r['city'],
            fit_rationale=('Florida %s in %s County: a licensed prime that subcontracts trades '
                           'and must hold a current ACORD 25 from every sub before it lets them on site.'
                           % (cls.lower(), r['county'])),
            decision_maker_role='owner',
            source_url=FL_SRC,
            source_type='government-db',
            confidence='verified',
            notes=('FL DBPR licence %s (%s), issued %s, expires %s. Verify at '
                   'https://www.myfloridalicense.com/wl11.asp . Website not opened, so no contact route.'
                   % (r['licence'], cls, r['issued'] or 'n/a', r['expires'])),
        ))
    return out


# ------------------------------------------------------------- California ----
CA_SRC = 'https://www2.cslb.ca.gov/onlineservices/dataportal/ListByCounty'
CA_QUOTA = {'Los Angeles': 30, 'Orange': 18, 'San Diego': 18, 'Santa Clara': 13,
            'Alameda': 13, 'Sacramento': 12, 'San Francisco': 10, 'Contra Costa': 10,
            'San Mateo': 9, 'Riverside': 9, 'San Bernardino': 8}

def california():
    rows = list(csv.DictReader(open(os.path.join(RAW, 'candidates_ca.csv'), encoding='utf-8')))
    def score(r):
        n = r['raw_name'].upper()
        s = 0
        if r['wc'] == "Workers' Compensation Insurance": s += 4
        if r['entity'] == 'Corporation': s += 2
        if GC.search(n): s += 2
        if TRADE.search(n): s -= 8
        yr = r['issued'][-4:]
        if yr.isdigit() and int(yr) <= 2015: s += 2
        if yr.isdigit() and int(yr) <= 2005: s += 1
        if r['licence_class'].replace('CSLB class ', '').strip() == 'B': s += 1
        return -s, r['name']
    picked = []
    for county, quota in CA_QUOTA.items():
        pool = sorted([r for r in rows if r['county'] == county], key=score)
        picked += pool[:quota]
    out = []
    for r in picked:
        sig = ''
        if r['wc'] == "Workers' Compensation Insurance" and r['wc_carrier']:
            sig = "Workers' comp policy on file with %s (CSLB record), i.e. carries W-2 field staff" % r['wc_carrier'].title()
        out.append(out_row(
            segment=segment_for(r['name']),
            name=r['name'],
            location='%s, CA' % r['city'],
            size_signal=sig,
            fit_rationale=('CSLB class B general building contractor in %s County (%s): builds with '
                           'subcontracted trades, so every sub needs a checked certificate of insurance.'
                           % (r['county'], r['entity'])),
            decision_maker_role='owner',
            source_url=CA_SRC,
            source_type='government-db',
            confidence='verified',
            notes=('CSLB licence %s, %s, issued %s, expires %s; surety %s. Detail page: '
                   'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/LicenseDetail.aspx?LicNum=%s'
                   % (r['licence'], r['licence_class'], r['issued'], r['expires'],
                      r['surety'] or 'n/a', r['licence'])),
        ))
    return out


# ----------------------------------------------------------------- Oregon ----
OR_SRC = ("https://data.oregon.gov/resource/g77e-6bhs.json?$where=endorsement_text%20like%20"
          "'Commercial%20General%20Contractor%25'%20AND%20exempt_text='Nonexempt'&$limit=8000")

def oregon():
    data = json.load(open(os.path.join(RAW, 'or_ccb_commercial_gc.json'), encoding='utf-8'))
    import build_candidates as bc
    seen, pool = set(), []
    for r in data:
        if r.get('state') != 'OR' or r.get('county_name') == 'Out of State':
            continue
        n = r.get('full_name', '')
        if not bc.is_company(n) or TRADE.search(n):
            continue
        k = re.sub(r'[^A-Z0-9]', '', n.upper())
        if k in seen:
            continue
        seen.add(k)
        pool.append(r)
    lvl1 = [r for r in pool if r['endorsement_text'].endswith('Level 1')]
    lvl2 = [r for r in pool if r['endorsement_text'].endswith('Level 2')]
    lvl1.sort(key=lambda r: (r['orig_regis_date'][-4:], r['full_name']))
    lvl2.sort(key=lambda r: (r['orig_regis_date'][-4:], r['full_name']))
    picked = lvl1[:30] + lvl2[:12]
    out = []
    for r in picked:
        out.append(out_row(
            segment=segment_for(r['full_name']),
            name=bc.title(r['full_name']),
            location='%s, OR' % r['city'].title(),
            size_signal='$%s CCB surety bond and $%s liability limit on file (Oregon CCB record)'
                        % (r.get('bond_amount', ''), r.get('ins_amount', '')),
            fit_rationale=('Oregon CCB %s with employees (nonexempt) in %s County — a commercial '
                           'prime that collects and re-checks subcontractor certificates every renewal.'
                           % (r['endorsement_text'], r.get('county_name', ''))),
            decision_maker_role='owner',
            source_url=OR_SRC,
            source_type='api',
            confidence='verified',
            notes=('CCB licence %s, %s, registered %s, expires %s; liability carrier %s. '
                   'Lookup: https://search.ccb.state.or.us/search/'
                   % (r['license_number'], r['endorsement_text'], r.get('orig_regis_date', ''),
                      r.get('lic_exp_date', ''), r.get('ins_company', 'n/a'))),
        ))
    return out


# ------------------------------------------------------------- Washington ----
WA_SRC = ("https://data.wa.gov/resource/m8qx-ubtq.json?$where=contractorlicensestatus='ACTIVE'"
          "%20AND%20specialtycode1desc='GENERAL'%20AND%20state='WA'%20AND%20businesstypecodedesc"
          "%20in('Corporation','Limited%20Liability%20Company','Partnership')&$limit=30000")
WA_QUOTA = {'SEATTLE': 10, 'BELLEVUE': 5, 'TACOMA': 5, 'SPOKANE': 4, 'EVERETT': 3,
            'KIRKLAND': 3, 'REDMOND': 2, 'RENTON': 3, 'VANCOUVER': 3, 'OLYMPIA': 2,
            'BELLINGHAM': 2, 'AUBURN': 2, 'KENT': 2, 'PUYALLUP': 2, 'ISSAQUAH': 2}

def washington():
    data = json.load(open(os.path.join(RAW, 'wa_lni_general.json'), encoding='utf-8'))
    import build_candidates as bc
    seen, pool = set(), []
    for r in data:
        n = r.get('businessname', '')
        if not bc.is_company(n) or TRADE.search(n):
            continue
        k = re.sub(r'[^A-Z0-9]', '', n.upper())
        if k in seen:
            continue
        seen.add(k)
        pool.append(r)
    out = []
    for city, quota in WA_QUOTA.items():
        sub = sorted([r for r in pool if r['city'] == city],
                     key=lambda r: (r['licenseeffectivedate'], r['businessname']))
        for r in sub[:quota]:
            out.append(out_row(
                segment=segment_for(r['businessname']),
                name=bc.title(r['businessname']),
                location='%s, WA' % city.title(),
                fit_rationale=('Washington L&I registered GENERAL construction contractor (%s) in %s — '
                               'a prime that subcontracts trades and must hold a current COI for each one.'
                               % (r['businesstypecodedesc'], city.title())),
                decision_maker_role='owner',
                source_url=WA_SRC,
                source_type='api',
                confidence='verified',
                notes=('L&I licence %s, active since %s, expires %s, UBI %s. Verify at '
                       'https://secure.lni.wa.gov/verify/'
                       % (r['contractorlicensenumber'], r['licenseeffectivedate'][:10],
                          r['licenseexpirationdate'][:10], r.get('ubi', ''))),
            ))
    return out


# --------------------------------------------------------- North Carolina ----
NC_SRC = 'https://portal.nclbgc.org/Public/Search'
NC_QUOTA = {'Charlotte': 8, 'Raleigh': 7, 'Greensboro': 5, 'Durham': 4, 'Winston-Salem': 4,
            'Wilmington': 4, 'Cary': 3, 'Asheville': 3, 'High Point': 2, 'Concord': 2,
            'Huntersville': 2, 'Apex': 2, 'Chapel Hill': 2, 'Mooresville': 2}

def north_carolina():
    rows = list(csv.DictReader(open(os.path.join(RAW, 'nc_nclbgc_building.csv'), encoding='utf-8')))
    import build_candidates as bc
    out = []
    for city, quota in NC_QUOTA.items():
        pool = [r for r in rows if r['city'] == city and r['active'] == 'yes'
                and bc.is_company(r['name']) and not TRADE.search(r['name'])]
        pool.sort(key=lambda r: r['name'])
        for r in pool[:quota]:
            out.append(out_row(
                segment=segment_for(r['name']),
                name=r['name'],
                location='%s, NC' % city,
                fit_rationale=('Active North Carolina "Building" general-contractor licence in %s — '
                               'commercial prime work done through subcontracts, so sub COIs are a '
                               'standing contract obligation.' % city),
                decision_maker_role='owner',
                source_url=NC_SRC,
                source_type='government-db',
                confidence='verified',
                notes=('NCLBGC licence %s, classification Building, status active. Search the '
                       'licence number at https://portal.nclbgc.org/Public/Search' % r['licence']),
            ))
    return out


# ------------------------------------------- Florida specialty primes (CMC) ----
def florida_mechanical():
    """Certified Mechanical Contractors: specialty primes that carry second-tier
    subs, named in the ICP alongside general contractors."""
    import build_candidates as bc
    counties = {'23': 'Miami-Dade', '16': 'Broward', '60': 'Palm Beach',
                '39': 'Hillsborough', '46': 'Lee', '62': 'Pinellas',
                '58': 'Orange', '26': 'Duval'}
    quota = {c: 3 for c in counties.values()}
    pool = {c: [] for c in counties.values()}
    seen = set()
    for r in csv.reader(open(os.path.join(RAW, 'fl_construction_license.csv'), encoding='latin-1')):
        if len(r) < 21 or r[1] != 'CMC' or r[13] != 'C' or r[11] not in counties or r[9] != 'FL':
            continue
        exp = r[17][-4:]
        if not exp.isdigit() or int(exp) < 2026:
            continue
        name = r[3] if bc.is_company(r[3]) else (r[2] if bc.is_company(r[2]) else '')
        if not name:
            continue
        k = re.sub(r'[^A-Z0-9]', '', name.upper())
        if k in seen:
            continue
        seen.add(k)
        pool[counties[r[11]]].append((bc.title(name), bc.title(r[8]), r[20], r[15], r[17]))
    out = []
    for county, q in quota.items():
        for name, city, lic, iss, exp in sorted(pool[county])[:q]:
            out.append(out_row(
                segment='specialty prime (mechanical)',
                name=name,
                location='%s, FL' % city,
                fit_rationale=('Florida certified mechanical contractor in %s County — a specialty '
                               'prime that lets second-tier subcontracts and therefore collects and '
                               'checks COIs the same way a GC does.' % county),
                decision_maker_role='owner',
                source_url=FL_SRC,
                source_type='government-db',
                confidence='verified',
                notes=('FL DBPR licence %s (Certified Mechanical Contractor), issued %s, expires %s. '
                       'Verify at https://www.myfloridalicense.com/wl11.asp' % (lic, iss or 'n/a', exp)),
            ))
    return out


# ------------------------------------------------- association directories ----
def associations():
    checks = {}
    p = os.path.join(RAW, 'site_checks.csv')
    if os.path.exists(p):
        for r in csv.DictReader(open(p, encoding='utf-8')):
            checks[r['name']] = r
    out = []
    for r in csv.DictReader(open(os.path.join(RAW, 'assoc_members.csv'), encoding='utf-8')):
        if r.get('kind') != 'gc':
            continue                       # insurance / legal / accounting members are partners
        if NOT_GC.search(r['name']):
            continue                       # suppliers / surveyors listed in the same category
        c = checks.get(r['name'], {})
        live = c.get('http') == '200'
        site = (c.get('website_final') or r['website']).rstrip('/') if live else (r['website'].rstrip('/') if r['website'] else '')
        out.append(out_row(
            segment=segment_for(r['name']),
            name=r['name'],
            website=site,
            location=', '.join(x for x in [r['city'], r['state']] if x),
            fit_rationale=('%s general-contractor member: a commercial prime whose subcontract '
                           'packages require an ACORD 25 with additional-insured and waiver-of-'
                           'subrogation endorsements before payment.' % r['source']),
            contact_route=c.get('contact_route', ''),
            decision_maker_role='contract administrator',
            source_url=r['source_url'],
            source_type='association-directory',
            confidence='verified' if live else 'secondary',
            notes=('Listed in the chapter\'s public General Contractor category.'
                   + (' Company site opened %s (HTTP 200), title "%s".' % (site, c.get('title', ''))
                      if live else
                      ' Company site not opened (HTTP %s), so listing is unconfirmed against the firm\'s own site.'
                      % (c.get('http') or 'no website listed'))),
        ))
    return out


def main():
    import sys
    sys.path.insert(0, HERE)
    rows = (florida() + california() + oregon() + washington() + north_carolina()
            + florida_mechanical() + associations())
    # dedupe on name+website
    seen, dedup = set(), []
    for r in rows:
        k = (r['name'].lower().strip(), r['website'].lower().strip())
        k2 = re.sub(r'[^a-z0-9]', '', r['name'].lower())
        if k in seen or k2 in seen:
            continue
        seen.add(k); seen.add(k2)
        dedup.append(r)
    path = os.path.join(RAW, 'rows_endcustomers.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=COLS); w.writeheader(); w.writerows(dedup)
    print(path, len(dedup))

if __name__ == '__main__':
    main()
