"""Reference parser for a SAM.gov DBA wage-determination `document` string.
Proves the KNOWLEDGE_BASE schema is mechanically extractable. Not production code."""
import re, json

RATE_GROUP = re.compile(r'^\s{0,2}([A-Z]{2,6}[0-9]{3,4}-[0-9]{3}|SU[A-Z]{2}[0-9]{4}-[0-9]{3}|UAVG-[A-Z]{2}-[0-9]{4}|SA[A-Z]{2}[0-9]{4}-[0-9]{3}|SC[A-Z0-9-]+)\s+([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})\s*$')
RATE_LINE  = re.compile(r'^(?P<tail>.*?)\.{2,}\$\s*(?P<rate>[0-9][0-9,]*\.?[0-9]*)\s+(?P<fringe>[0-9][0-9,]*\.?[0-9]*)?\s*$')
SEP        = re.compile(r'^-{20,}$')
MODLINE    = re.compile(r'^\s*([0-9]{1,3})\s+([0-9]{2}/[0-9]{2}/[0-9]{4})\s*$')

def parse(document: str) -> dict:
    text = document
    if text.startswith('"'):
        text = text[1:]
    if text.endswith('"'):
        text = text[:-1]
    lines = text.split('\n')
    out = {'wd_number': None, 'publication_date': None, 'state': None,
           'construction_types': [], 'counties': [], 'modifications': [],
           'rate_groups': [], 'classifications': [], 'notes': {}}

    m = re.search(r'General Decision Number:\s*([A-Z]{2}[0-9]{8})\s+([0-9]{2}/[0-9]{2}/[0-9]{4})', text)
    if m:
        out['wd_number'], out['publication_date'] = m.group(1), m.group(2)
    m = re.search(r'^State:\s*(.+)$', text, re.M)
    if m: out['state'] = m.group(1).strip()
    m = re.search(r'^Construction Types?:\s*(.+)$', text, re.M)
    if m: out['construction_types'] = [c.strip() for c in re.split(r'[,&]| and ', m.group(1)) if c.strip()]

    # counties block: from "Counties:" (or "County:") to the modification table
    m = re.search(r'^(?:Counties|County):\s*(.*?)(?=\n\s*Modification Number)', text, re.M | re.S)
    if m:
        blob = m.group(1)
        blob = re.sub(r'^[A-Za-z .]+Count(?:ies|y)\s+of\s*', '', blob.strip())
        out['counties'] = [c.strip() for c in re.split(r'\n|,', blob) if c.strip() and 'Statewide' not in c]

    in_mod = False
    for ln in lines:
        if 'Modification Number' in ln and 'Publication Date' in ln:
            in_mod = True; continue
        if in_mod:
            mm = MODLINE.match(ln)
            if mm: out['modifications'].append({'modification_number': int(mm.group(1)), 'publication_date': mm.group(2)})
            elif ln.strip() and not ln.strip().startswith('-'): in_mod = False

    group = None
    buf = []
    for ln in lines:
        gm = RATE_GROUP.match(ln.rstrip())
        if gm:
            group = {'identifier': gm.group(1), 'effective_date': gm.group(2)}
            group['kind'] = ('survey' if group['identifier'].startswith('SU')
                             else 'union_average' if group['identifier'].startswith('UAVG')
                             else 'state_adopted' if group['identifier'].startswith('SA')
                             else 'supplemental' if group['identifier'].startswith('SC')
                             else 'union')
            out['rate_groups'].append(group); buf = []; continue
        if SEP.match(ln.strip()) or 'Rates' in ln and 'Fringes' in ln:
            buf = []; continue
        rm = RATE_LINE.match(ln.rstrip())
        if rm and group:
            title = (' '.join(buf) + ' ' + rm.group('tail')).strip()
            title = re.sub(r'\s+', ' ', title)
            out['classifications'].append({
                'rate_group': group['identifier'],
                'rate_kind': group['kind'],
                'group_effective_date': group['effective_date'],
                'classification': title,
                'base_rate': float(rm.group('rate').replace(',', '')),
                'fringe': float((rm.group('fringe') or '0').replace(',', '')),
            })
            buf = []
        elif ln.strip() and group is not None:
            buf.append(ln.strip())
            if len(buf) > 12: buf = buf[-12:]

    out['notes']['welders'] = bool(re.search(r'WELDERS\s*-\s*Receive rate prescribed', text))
    out['notes']['eo13706_paid_sick_leave'] = 'Executive Order (EO) 13706' in text
    out['notes']['conformance_required_for_unlisted'] = 'Unlisted classifications needed' in text
    return out

if __name__ == '__main__':
    import sys
    d = json.load(open(sys.argv[1]))
    print(json.dumps(parse(d['document']), indent=1)[:1500])
