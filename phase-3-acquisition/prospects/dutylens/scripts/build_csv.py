#!/usr/bin/env python3
"""Build phase-3-acquisition/prospects/dutylens/prospects.csv from the raw/ captures.
Run from the repo root:  python3 phase-3-acquisition/prospects/dutylens/scripts/build_csv.py
Every raw/*.json input is produced by the sibling scripts in this directory
(ncbfaa.py, ncbfaa_detail.py, asd.py, a2z.py, verify_site.py, check_urls.py) plus
the CPSC public recall API; see ../sources.md for the exact commands."""
import csv,json,os,re,sys
HERE=os.path.dirname(os.path.abspath(__file__))
RAW=os.path.join(HERE,'..','raw'); OUT=os.path.join(HERE,'..','prospects.csv')
DATE='2026-09-03'
COLS=['app','prospect_type','segment','name','website','location','size_signal','fit_rationale',
      'contact_route','decision_maker_role','source_url','source_type','confidence','collected_on','notes']
def J(n):
    p=os.path.join(RAW,n)
    return json.load(open(p)) if os.path.exists(p) else []
FIRSTNAMES=set("""james robert john michael david william richard joseph thomas christopher charles daniel
matthew anthony mark donald steven paul andrew joshua kenneth kevin brian george timothy ronald jason edward jeffrey
ryan jacob gary nicholas eric jonathan stephen larry justin scott brandon benjamin samuel gregory alexander patrick
frank raymond jack dennis jerry tyler aaron jose adam nathan henry zachary douglas peter kyle noah ethan jeremy walter
christian keith roger terry austin sean gerald carl harold dylan arthur lawrence jordan jesse bryan billy bruce gabriel
joe logan alan juan albert willie elijah wayne randy vincent mason roy ralph bobby russell bradley philip eugene mary
patricia jennifer linda elizabeth barbara susan jessica sarah karen lisa nancy betty margaret sandra ashley kimberly
emily donna michelle carol amanda dorothy melissa deborah stephanie rebecca sharon laura cynthia amy kathleen angela
shirley anna brenda pamela emma nicole helen samantha katherine christine debra rachel carolyn janet catherine maria
heather diane ruth julie olivia joyce virginia victoria kelly lauren christina joan evelyn judith megan andrea cheryl
hannah jacqueline martha gloria teresa ann sara madison frances kathryn janice jean abigail alice julia judy sophia
grace denise amber doris marilyn danielle beverly isabella theresa diana natalie brittany charlotte marie kayla alexis
lori""".split())
CORP=re.compile(r'\b(inc|llc|ltd|corp|co|company|group|brands?|studio|design|designs|jewelry|jewellery|collection|'
                r'goods|shop|store|international|imports?|trading|products?|creations?|works|supply|usa|and|&)\b',re.I)
GENERIC=re.compile(r'^(info|sales|hello|contact|partners|partnerships|support|team|admin|customerservice|cs|help|orders|wholesale)$',re.I)
def clean_contact(c,web=''):
    """BRIEF s2.2: business routes only. Strip mailto wrappers, reject personal or
    third-party mailboxes, and reject contact pages hosted on someone else's domain."""
    c=(c or '').strip()
    if not c: return ''
    if c.lower().startswith('mailto:'): c=c[7:]
    if '@' in c and not c.lower().startswith('http'):
        c=c.split('?')[0].strip().lower()
        if c.count('@')!=1: return ''
        local,dom=c.split('@')
        if not GENERIC.fullmatch(local): return ''
        if re.search(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol|live|msn)\.',c): return ''
        return c
    if not c.lower().startswith('http'): return ''
    if '@' in c: return ''
    host=re.sub(r'^https?://(www\.)?','',c).split('/')[0].lower()
    wh=re.sub(r'^https?://(www\.)?','',(web or '')).split('/')[0].lower()
    if wh:
        a=host.split('.'); b=wh.split('.')
        if len(a)>=2 and len(b)>=2 and a[-2:]!=b[-2:]:
            return ''          # contact page on a third-party domain (linktr.ee, a portal, ...)
    return c
def looks_personal(n):
    n=(n or '').strip()
    if CORP.search(n): return False
    m=re.fullmatch(r"([A-Z][a-z]+) [A-Z][a-z']+",n)
    return bool(m and m.group(1).lower() in FIRSTNAMES)
def cleanloc(city,state):
    city=re.sub(r'[\s,]+$','',(city or '').strip()); state=(state or '').strip().rstrip(',')
    if city.upper()==state.upper(): city=''
    return ', '.join([x for x in [city,state] if x])
def root(u):
    u=(u or '').strip()
    if not u: return ''
    if not u.startswith('http'): u='https://'+u.lstrip('/')
    m=re.match(r'(https?://)([^/\s]+)',u)
    return (m.group(1)+m.group(2).lower()) if m else ''
site={ (r['url'] or '').lower():r for r in J('site_check.json')}
pcheck={r['url']:r for r in J('partner_check.json')}
ccheck={r['url']:r for r in J('channel_check.json')}
rows=[]
def add(**k):
    r={c:'' for c in COLS}; r['app']='dutylens'; r['collected_on']=DATE; r.update(k)
    r={c:(r[c] or '').replace('\n',' ').strip() for c in COLS}
    rows.append(r)

# ---------- 1. end-customer: US importers named in CPSC recall notices (government-db)
def domain_matches(url,name):
    d=re.sub(r'^https?://(www\.)?','',url or '').split('/')[0].lower()
    d=re.sub(r'[^a-z0-9]','',d.rsplit('.',1)[0] if '.' in d else d)
    toks=[re.sub(r'[^a-z0-9]','',t.lower()) for t in re.split(r'[\s,\.\-&/]+',name or '')]
    toks=[t for t in toks if len(t)>3 and t not in
          ('inc','llc','ltd','corp','company','group','brands','holdings','international','usa','america','american',
           'imports','import','trading','products','product','solutions','industries','enterprises','global','store')]
    return any(t in d for t in toks)
for r in J('cpsc_importers_v.json'):
    if looks_personal(r['name']): continue   # BRIEF s2.1
    r['name']=re.sub(r'^[A-Za-z ]{0,20}Importer:\s*','',r['name']).strip()
    w=root(r.get('website') or '')
    recall_url=root(r.get('site') or '')
    if not w and recall_url and domain_matches(recall_url,r['name']): w=recall_url
    s=site.get(w.lower()) if w else None
    conf='verified'   # a US federal recall notice names this org as the importer of record
    contact=clean_contact((s or {}).get('contact') or (s or {}).get('mail') or '',w)
    cty=', '.join([c for c in (r.get('countries') or []) if c])
    units=(r.get('units') or '').strip()
    add(prospect_type='end-customer',segment='US importer (CPSC recall record)',name=r['name'],
        website=w,location=r['loc'],
        size_signal=(f"CPSC recall covered {units} units of one product" if units else ''),
        fit_rationale=("Named in a US CPSC recall notice as the importer of record for consumer goods"
                       +(f" manufactured in {cty}" if cty else '')+"; imports directly and carries classification and duty exposure on every SKU."),
        contact_route=contact,decision_maker_role='owner / operations lead',
        source_url=r['url'],source_type='government-db',confidence=conf,
        notes=f"Recalled product: {r.get('product','')}. Origin: {cty or 'not stated'}. Recall dated {r.get('date','')}."
              +('' if w else ' Website not confirmed - left empty rather than guessed.')
              +(f" Recall-response URL printed on the notice: {recall_url}" if recall_url and recall_url!=w else ''))

# ---------- 2-4. end-customer: trade-show exhibitors (a2z public directories)
SHOWS=[('asd_detail.json','consumer-goods brand (ASD Market Week)','ASD Market Week March 2026',
        'https://asd.a2zinc.net/March2026/Public/Exhibitors.aspx',
        'general merchandise, beauty, gift, toy and jewelry - categories overwhelmingly sourced from Asia'),
       ('nynow_detail.json','home & gift brand (NY NOW)','NY NOW Winter 2026',
        'https://nynow.a2zinc.net/Winter2026/Public/Exhibitors.aspx',
        'home, gift, lifestyle and jewelry wholesale'),
       ('outdoorretailer_detail.json','outdoor brand (Outdoor Retailer)','Outdoor Retailer 2026',
        'https://or.a2zinc.net/OR2026/Public/Exhibitors.aspx',
        'outdoor apparel and hard goods, a technically hard classification category')]
for f,seg,show,src,catnote in SHOWS:
    for r in J(f):
        if not r.get('country','').startswith('United States'): continue
        w=root(r.get('web') or '')
        if not w: continue
        s=site.get(w.lower())
        opened = bool(s and s['code']=='200' and s['title'])
        if looks_personal(r['name']): continue   # BRIEF s2.1 - if unsure it is a person, skip
        loc=cleanloc(r.get('city',''),r.get('state',''))
        add(prospect_type='end-customer',segment=seg,name=r['name'],website=w,location=loc,
            size_signal=f"exhibitor at {show} (booth {r['boothid']})",
            fit_rationale=(f"US-based brand exhibiting at {show} in {catnote}; sells physical goods it imports "
                           f"and has no in-house customs staff at this size."),
            contact_route=clean_contact((s or {}).get('contact') or (s or {}).get('mail') or '',w),
            decision_maker_role='owner / head of operations',
            source_url=src,source_type='directory',
            confidence='verified' if opened else 'secondary',
            notes=(f"Show category: {r.get('category') or 'not stated'}. "
                   +("Own site opened 2026-09-03: "+ (s['title'][:90] if s else '') if opened
                     else f"Own site not opened (HTTP {(s or {}).get('code','not attempted')}); website and location as printed in the show's own exhibitor directory.")
                   +" Import status inferred from category, not individually confirmed."))

# ---------- 5. end-customer: Amazon aggregator-owned private-label brands
for b in J('agg_brands_v.json'):
    if looks_personal(b['name']): continue   # BRIEF s2.1
    w=root(b.get('website') or '')
    add(prospect_type='end-customer',segment='Amazon private-label brand (aggregator-owned)',name=b['name'],
        website=w,location='',size_signal=f"owned by {b['agg']}",
        fit_rationale=("Amazon private-label consumer brand whose products are manufactured in Asia and imported into the US; "
                       "post-de-minimis it needs a defensible HTS code and a stacked-duty number per SKU."),
        contact_route='',decision_maker_role='brand manager / supply chain lead',
        source_url=b['src'],source_type=b['stype'],
        confidence='verified' if w else 'secondary',
        notes=(f"Portfolio brand of {b['agg']} (US-headquartered aggregator). "
               +("Own site opened 2026-09-03: "+(b.get('title','')[:90]) if w else "Own site not found under an obvious domain, so website left empty - many of these brands sell only on Amazon.")
               +" Aggregator ownership may have changed: the FBA aggregator sector consolidated heavily in 2024-2026."))

# ---------- 6-7. partner: customs brokers and freight forwarders (NCBFAA directory)
for r in J('ncbfaa_detail.json'):
    svc=r.get('services','')
    is_cb='Customs Broker' in svc
    is_ff=('Forwarder' in svc) or ('Freight Forwarding' in svc) or ('NVOCC' in svc)
    if not (is_cb or is_ff): continue
    if looks_personal(r['name']): continue   # BRIEF s2.1 - licence listed under a person's name
    seg='customs broker' if is_cb else 'freight forwarder'
    w=root(r.get('web') or '')
    loc=cleanloc(r.get('city',''),r.get('state',''))
    add(prospect_type='partner',segment=seg,name=r['name'],website=w,location=loc,
        size_signal=('NCBFAA member; services: '+svc.replace(';',',')) if svc else 'NCBFAA member',
        fit_rationale=("Licensed customs broker filing entries for small importers - the party the importer already "
                       "asks 'what code is this?'; DutyLens can be white-labelled or referred to their SMB clients."
                       if is_cb else
                       "Freight forwarder / NVOCC moving cargo for SMB importers; landed-cost and HTS answers are the "
                       "question their customers ask them most."),
        contact_route='',decision_maker_role='owner / licensed customs broker',
        source_url='https://www.ncbfaa.org/search-our-membership',source_type='association-directory',
        confidence='verified',
        notes=("Company row taken from the NCBFAA public membership directory detail page; the directory's personal "
               "contact names were deliberately discarded. "+(f"Phone on file: {r.get('phone','')}." if r.get('phone') else '')
               +(' Website not printed in the directory entry.' if not w else '')))

# ---------- 8. partner: 3PLs from the fulfill.com Top 100
for r in J('fulfill_3pls.json'):
    d=r['desc']
    m=re.search(r'operating ([\d,]+) warehouses totaling ([\d,]+) sq ft',d)
    sig=(f"{m.group(1)} warehouses, {m.group(2)} sq ft (fulfill.com Top 100 profile)" if m
         else (f"founded {r['founded']}" if r.get('founded') else ''))
    add(prospect_type='partner',segment='3PL / fulfillment',name=r['name'],website='',location='',
        size_signal=sig,
        fit_rationale=("US ecommerce 3PL whose merchant base is DTC and marketplace brands importing from Asia; "
                       "a duty/HTS layer is a natural value-add or referral for them."),
        contact_route='',decision_maker_role='head of partnerships',
        source_url='https://www.fulfill.com/top-3pl-companies',source_type='list-article',confidence='secondary',
        notes=f"Ranked #{r['rank']} in fulfill.com's Top 100 US 3PL list (updated June 2026). Own site not opened; website left empty. {d[:300]}")

# ---------- 9. curated partner / channel / excluded rows
sys.path.insert(0,HERE)
from curated import ROWS as CUR
for (ptype,seg,name,probe,sig,fit,role,slot7,stype,conf,note) in CUR:
    chk=pcheck.get(probe) or ccheck.get(probe) or {}
    w=chk.get('root') or root(probe)
    if stype=='list-article':
        src,contact=slot7,''
    else:
        src,contact=(chk.get('final') or probe),slot7
    if ptype=='excluded' or seg in ('subreddit','facebook group'):
        contact=''            # never a contact route for a competitor or a blocked social platform
    if seg in ('subreddit','facebook group'):
        w=probe               # the public URL of the community itself, not opened
    add(prospect_type=ptype,segment=seg,name=name,website=w,location='',size_signal=sig,
        fit_rationale=fit,contact_route=clean_contact(contact,w) or (contact if contact.startswith('http') else ''),decision_maker_role=role,
        source_url=src,source_type=stype,confidence=conf,notes=note)

# ---------- dedupe on name + website
seen=set(); ded=[]
for r in rows:
    k=(r['name'].lower().strip(),r['website'].lower().strip())
    if k in seen: continue
    seen.add(k); ded.append(r)
with open(OUT,'w',newline='',encoding='utf-8') as fh:
    wtr=csv.DictWriter(fh,fieldnames=COLS,quoting=csv.QUOTE_ALL)
    wtr.writeheader(); wtr.writerows(ded)
print('wrote',len(ded),'rows to',OUT,'(dropped',len(rows)-len(ded),'duplicates)')
