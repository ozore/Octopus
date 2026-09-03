#!/usr/bin/env python3
"""Merge the end-customer rows with the partner / channel / excluded rows and
write phase-3-acquisition/prospects/certly-gc/prospects.csv.

Run from anywhere:  python3 .../scripts/assemble.py
"""
import csv, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
OUT = os.path.join(HERE, '..', 'prospects.csv')
TODAY = '2026-09-03'
APP = 'certly'
COLS = ['app', 'prospect_type', 'segment', 'name', 'website', 'location', 'size_signal',
        'fit_rationale', 'contact_route', 'decision_maker_role', 'source_url',
        'source_type', 'confidence', 'collected_on', 'notes']


def row(**kw):
    r = {c: '' for c in COLS}
    r.update(app=APP, collected_on=TODAY)
    r.update(kw)
    return r


def read(name):
    p = os.path.join(RAW, name)
    return list(csv.DictReader(open(p, encoding='utf-8'))) if os.path.exists(p) else []


# ---------------------------------------------- NASBP surety bond producers ----
BRAND = re.compile(r'\s*(?:,?\s*(?:LLC|L\.L\.C\.?|Inc\.?|Ltd\.?|LP|LLP|PA|P\.A\.)\b|'
                   r'\s+dba\s+.*|\s+FKA\s+.*|\s+of\s+(?:California|Texas|Florida|Georgia|'
                   r'Washington|Colorado|Illinois|New York|North Carolina|Minnesota|Tennessee|'
                   r'Ohio|Arizona|Massachusetts|Virginia|Oregon).*)', re.I)

def nasbp(limit_per_state=5):
    rows = read('nasbp_producers.csv')
    picked, seen_brand, per_state = [], set(), {}
    rows.sort(key=lambda r: (r['state_query'], not bool(r['website']), r['name']))
    for r in rows:
        brand = re.sub(r'[^a-z0-9]', '', BRAND.sub('', r['name']).lower())[:22]
        if brand in seen_brand:
            continue
        st = r['state_query']
        if per_state.get(st, 0) >= limit_per_state:
            continue
        seen_brand.add(brand)
        per_state[st] = per_state.get(st, 0) + 1
        picked.append(r)
    out = []
    for r in picked:
        out.append(row(
            prospect_type='partner',
            segment='surety and construction insurance agency',
            name=r['name'],
            website=r['website'],
            location=r['location'],
            fit_rationale=('NASBP surety bond producer: writes the bonds and issues the ACORD 25s for '
                           'the same small and mid GCs, and is asked by them how to track subcontractor '
                           'certificates — a natural referral and co-sell partner.'),
            decision_maker_role='head of partnerships',
            source_url=r['source_url'],
            source_type='association-directory',
            confidence='secondary' if not r['website'] else 'secondary',
            notes=('Listed in the NASBP Surety Pro Locator. Agency website'
                   + (' as published in the listing: %s. ' % r['website'] if r['website'] else
                      ' not published in the listing. ')
                   + 'Agency site not opened, so no contact route recorded. '
                     'The locator also publishes individual producers and their mailboxes; '
                     'those were deliberately not collected.'),
        ))
    return out


# ------------------------------ association-directory partners (AGC New Hampshire) ----
KIND_SEG = {'insurance': ('construction insurance broker / surety agency', 'head of partnerships'),
            'legal': ('construction law firm', 'head of marketing'),
            'accounting': ('construction CPA firm', 'head of partnerships'),
            'software': ('construction technology vendor', 'head of partnerships')}

def assoc_partners():
    checks = {r['name']: r for r in read('site_checks.csv')}
    out = []
    for r in read('assoc_members.csv'):
        kind = r.get('kind', '')
        if kind not in KIND_SEG:
            continue
        seg, dm = KIND_SEG[kind]
        c = checks.get(r['name'], {})
        live = c.get('http') == '200'
        site = (c.get('website_final') or r['website'] or '').rstrip('/')
        why = {'insurance': ('Insurance and surety member of a GC chapter: it produces the certificates '
                             'Certly reads and advises the same contractors on risk transfer.'),
               'legal': ('Construction law firm serving GC chapter members; it drafts the additional-insured '
                         'and waiver-of-subrogation language Certly checks against.'),
               'accounting': ('Construction CPA firm serving GC chapter members; the controller it reports to '
                              'is the person who owns certificate compliance.'),
               'software': ('Construction technology vendor inside a GC chapter: adjacent tooling that could '
                            'bundle or refer certificate tracking.')}[kind]
        out.append(row(
            prospect_type='partner', segment=seg, name=r['name'], website=site if live else '',
            location=', '.join(x for x in [r['city'], r['state']] if x),
            fit_rationale=why,
            contact_route=c.get('contact_route', '') if live else '',
            decision_maker_role=dm,
            source_url=r['source_url'], source_type='association-directory',
            confidence='verified' if live else 'secondary',
            notes=('Listed in the AGC New Hampshire public member directory under "%s".' % kind
                   + (' Company site opened (HTTP 200), title "%s".' % c.get('title', '') if live
                      else ' Company site not opened (HTTP %s), so the listing is unconfirmed.'
                           % (c.get('http') or 'no website listed'))),
        ))
    return out


# ---------------------------------------------------------- curated rows ----
COI_BUNDLERS = {}

def curated():
    checks = {r['name']: r for r in read('curated_checks.csv')}
    coi = {r['name']: r for r in read('coi_feature_check.csv') if r['coi_terms']}
    out = []
    for r in read('curated_candidates.csv'):
        c = checks.get(r['name'], {})
        code = c.get('http', '')
        live = code == '200'
        site = (c.get('website_final') or r['website']).rstrip('/')
        ptype, seg, note = r['prospect_type'], r['segment'], r['note']
        conf = 'verified' if live else ('secondary' if code in ('202', '403') else 'unverified')
        if r['name'] in coi and ptype == 'partner':
            ptype = 'excluded'
            seg = 'construction software that already bundles COI tracking'
            note = ('Reclassified from partner to excluded: its own site markets certificate-of-insurance '
                    'tracking ("%s") at %s.' % (coi[r['name']]['coi_terms'], coi[r['name']]['evidence_url']))
        elif seg in ('construction ERP vendor', 'construction PM software', 'plan room / project data'):
            note += ('. Checked its own site for a bundled COI module and found none on the pages that '
                     'responded; re-check before co-selling.')
        if not live and code in ('202', '403'):
            note += '. Site returned HTTP %s (bot protection) rather than 200, so the page body was not read.' % code
        if not live and code not in ('202', '403'):
            note += '. Site did not resolve (HTTP %s); website left empty.' % (code or 'no response')
        out.append(row(
            prospect_type=ptype, segment=seg, name=r['name'],
            website=site if code in ('200', '202', '403') else '',
            location=r['location'],
            fit_rationale=note.split('. ')[0] if ptype == 'excluded' else note.split('. ')[0],
            contact_route=c.get('contact_route', ''),
            decision_maker_role=r['decision_maker_role'],
            source_url=site if code in ('200', '202', '403') else r['website'],
            source_type='company-site',
            confidence=conf,
            notes=(note + ('. Page title on open: "%s"' % c.get('title', '') if live and c.get('title') else '')),
        ))
    return out


SEGMENT_MAP = {
    'surety and construction insurance agency': 'construction insurance broker / surety agency',
    'construction platform with COI module': 'construction platform with bundled COI tracking',
    'lien and document compliance platform': 'construction platform with bundled COI tracking',
    'subcontractor payment and compliance': 'construction platform with bundled COI tracking',
    'construction software that already bundles COI tracking': 'construction platform with bundled COI tracking',
    'subcontractor prequalification': 'subcontractor prequalification platform',
    'contractor prequalification': 'subcontractor prequalification platform',
    'supply chain risk platform': 'subcontractor prequalification platform',
    'contractor compliance platform': 'subcontractor prequalification platform',
    'COI verification platform': 'COI tracking platform',
    'builders exchange': 'builders exchange / plan room',
    'builders exchange network': 'builders exchange / plan room',
    'plan room / project data': 'builders exchange / plan room',
    'newsletter': 'trade publication / newsletter',
    'trade publication': 'trade publication / newsletter',
    'community and events': 'online community',
    'construction ERP vendor': 'construction ERP / PM software',
    'construction PM software': 'construction ERP / PM software',
    'construction technology vendor': 'construction ERP / PM software',
    'trade association chapter': 'trade association',
}


TOO_LARGE = ['austin commercial', 'austin industries', 'gilbane', 'je dunn', 'j.e. dunn',
             'mccarthy building', 'hoar construction', 'rogers-o', 'satterfield & pontikes',
             'vaughn construction', 'linbeck', 'bartlett cocke', 'cadence mcshane',
             'granite construction', 'asrc energy', 'arch-con', 'harvey cleary', 'tellepsen',
             'morganti', 'andres construction', 'balfour beatty', 'skanska', 'turner construction',
             'whiting-turner', 'dpr construction', 'clark construction', 'brasfield & gorrie',
             'adolfson & peterson', 'manhattan construction', 'hensel phelps', 'ryan companies',
             'swinerton', 'webcor', 'suffolk construction', 'alberici', 'walsh construction',
             'pepper construction', 'clayco', 'layton construction', 'okland construction',
             'big-d construction', 'sundt', 'kiewit', 'zachry', 'fluor', 'jacobs', 'aecom',
             'mortenson', 'holder construction', 'brice, inc', 'pc construction company',
             'stg, inc', 'lynden', 'colaska']


def flag_large(rows):
    for r in rows:
        if r['prospect_type'] != 'end-customer':
            continue
        n = r['name'].lower()
        if any(t in n for t in TOO_LARGE):
            r['notes'] = (r['notes'] + ' NOTE: nationally ranked contractor, larger than Certly\'s '
                          'stated $5M-$150M / 20-150-sub ICP band; kept for completeness, deprioritise.').strip()
    return rows


def main():
    rows = read('rows_endcustomers.csv') + nasbp() + assoc_partners() + curated()
    for r in rows:
        r['segment'] = SEGMENT_MAP.get(r['segment'], r['segment'])
    flag_large(rows)
    seen, out = set(), []
    for r in rows:
        r = {c: (r.get(c) or '').strip() for c in COLS}
        if not r['name'] or not r['source_url']:
            continue
        k = (r['name'].lower(), r['website'].lower())
        k2 = re.sub(r'[^a-z0-9]', '', r['name'].lower())
        if k in seen or k2 in seen:
            continue
        seen.add(k); seen.add(k2)
        out.append(r)
    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader(); w.writerows(out)
    import collections
    print(OUT, len(out))
    print(collections.Counter(r['prospect_type'] for r in out))
    print(collections.Counter(r['confidence'] for r in out))

if __name__ == '__main__':
    main()
