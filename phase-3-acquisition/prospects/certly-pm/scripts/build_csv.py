#!/usr/bin/env python3
"""Build phase-3-acquisition/prospects/certly-pm/prospects.csv from the raw captures in raw/.
Run from repo root with no arguments:
    python3 phase-3-acquisition/prospects/certly-pm/scripts/build_csv.py
Every raw input is produced by the sibling fetch_*.py scripts (see sources.md).
"""
import csv,json,os,re,html,collections
BASE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
R=lambda *p: os.path.join(BASE,*p)
DATE='2026-09-03'
COLS=['app','prospect_type','segment','name','website','location','size_signal','fit_rationale',
      'contact_route','decision_maker_role','source_url','source_type','confidence','collected_on','notes']
FULL2AB={'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
'Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL',
'Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT',
'Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
'District Of Columbia':'DC','Virgina':'VA'}
def norm_loc(x):
    x=re.sub(r'\s+',' ',x).strip().strip(',')
    for full,ab in FULL2AB.items():
        x=re.sub(r',\s*'+full+r'\b',', '+ab,x)
        if x==full: return ab
    return x
rows=[]
def add(**k):
    r={c:'' for c in COLS}; r['app']='certly'; r['collected_on']=DATE; r.update(k)
    r['location']=norm_loc(r.get('location',''))
    r['contact_route']=re.sub(r'^mailto:','',r.get('contact_route','')).strip()
    rows.append(r)

STATE_ABBR={'texas':'TX','florida':'FL','georgia':'GA','north-carolina':'NC','tennessee':'TN','arizona':'AZ',
'nevada':'NV','colorado':'CO','utah':'UT','california':'CA','washington':'WA','oregon':'OR','illinois':'IL',
'ohio':'OH','michigan':'MI','minnesota':'MN','missouri':'MO','indiana':'IN','wisconsin':'WI',
'pennsylvania':'PA','new-york':'NY','massachusetts':'MA','maryland':'MD','virginia':'VA',
'district-of-columbia':'DC','new-jersey':'NJ','oklahoma':'OK','louisiana':'LA','alabama':'AL',
'south-carolina':'SC','kentucky':'KY','idaho':'ID','new-mexico':'NM','nebraska':'NE','iowa':'IA',
'kansas':'KS','hawaii':'HI','connecticut':'CT','arkansas':'AR'}

# ---------------------------------------------------------------- 1. residential PM (expertise.com)
sel=json.load(open(R('raw','expertise_selected.json')))
probe={}
for l in open(R('raw','probe_out.tsv'),encoding='utf-8').readlines()[1:]:
    p=l.rstrip('\n').split('\t')
    if len(p)>=5: probe[p[0]]=dict(status=p[2],title=p[3],contact=p[4])
sizes=json.load(open(R('raw','size_signals.json')))
BADSIZE=re.compile(r'^0|^7063')
PLATFORM=re.compile(r'\b(ziprent|hemlane|doorstead|belong|darwin|turbotenant|avail|flat fee landlord|superprop|goldnest)\b',re.I)
seen=set()
for r in sel:
    name=r['name']
    if PLATFORM.search(name): continue
    key=name.lower()
    if key in seen: continue
    seen.add(key)
    pr=probe.get(name,{})
    ok=pr.get('status')=='ok'
    city=r['addr'].split(',')[-2].strip() if r['addr'].count(',')>=2 else r['city'].replace('-',' ').title()
    st=STATE_ABBR.get(r['st'],'')
    m=re.search(r'\b([A-Z]{2})\b\s*\d{5}',r['addr'])
    if m: st=m.group(1)
    loc=f"{city}, {st}".strip(', ')
    sz=sizes.get(name,'')
    if BADSIZE.match(sz): sz=''
    szn=(' Portfolio figure in size_signal is the number published on the company\'s own home page; '
         'for a branch or franchise site it can be the network-wide total rather than this office\'s, '
         'so treat any figure above ~5,000 as brand-level.') if sz else ''
    add(prospect_type='end-customer',segment='residential property management',name=name,
        website=r['web'],location=loc,size_signal=sz,
        fit_rationale='Third-party residential property manager: collects a COI from every landscaper, cleaner, roofer and plumber it dispatches and from every owner it represents, and tracks expiries by hand.',
        contact_route=pr.get('contact','') or (r['web'] if ok else ''),
        decision_maker_role='owner / broker-owner',
        source_url=r['src'],source_type='directory',
        confidence='verified' if ok else 'secondary',
        notes=('Listed on the Expertise.com "Best Property Management Companies" page for '
               f"{r['city'].replace('-',' ').title()}; company site opened and title read as "
               f"\"{pr.get('title','')}\"."+szn if ok else
               'Listed on the Expertise.com "Best Property Management Companies" city page; the '
               "company's own site did not respond to two fetches, so the listing is not independently confirmed."))

# ---------------------------------------------------------------- 2. HOA - communitypay (portfolio size)
cp=json.load(open(R('raw','communitypay.json')))
def port(x):
    try: return int(x.replace(',',''))
    except Exception: return 0
percity=collections.Counter(); persta=collections.Counter()
cp_sorted=sorted(cp,key=lambda r:-port(r['portfolio']))
for r in cp_sorted:
    p=port(r['portfolio'])
    if not (5<=p<=60): continue
    if persta[r['state']]>=22 or percity[(r['state'],r['city'])]>=4: continue
    key=r['name'].lower().strip()
    if key in seen: continue
    seen.add(key); persta[r['state']]+=1; percity[(r['state'],r['city'])]+=1
    add(prospect_type='end-customer',segment='HOA / community association management',name=r['name'],
        location=f"{r['city']}, {r['state']}",size_signal=f"{r['portfolio']} community associations under management",
        fit_rationale=f"Community-association manager with {r['portfolio']} associations - squarely in the 5-60 association band, and every association needs a current COI from its landscaper, pool, roofing and janitorial vendors.",
        decision_maker_role='director of community management',
        source_url=r['src'],source_type='directory',confidence='secondary',
        notes='Portfolio count is CommunityPay\'s published figure for this firm, taken verbatim. CommunityPay publishes no website or contact page, so both fields are empty; not independently confirmed on the company\'s own site.')

# ---------------------------------------------------------------- 3. HOA - hoamanagement.com (has websites)
hp={}
for l in open(R('raw','probe_out.tsv'),encoding='utf-8').readlines()[1:]:
    pass
for l in open(R('raw','hoamanagement_companies.tsv'),encoding='utf-8').readlines()[1:]:
    p=l.rstrip('\n').split('\t')
    if len(p)<5: continue
    name,addr,web,det,statep=p[:5]
    name=re.sub(r'\s*[-–|]\s*(HOA|Association|Community).*$','',name).strip()
    key=name.lower().strip()
    if not name or key in seen: continue
    seen.add(key)
    m=re.search(r'([A-Za-z .\'-]+),\s*([A-Z]{2})\b',addr)
    loc=f"{m.group(1).strip()}, {m.group(2)}" if m else ''
    add(prospect_type='end-customer',segment='HOA / community association management',name=name,
        website=web,location=loc,
        fit_rationale='HOA / condo association management company: chases a certificate of insurance from every association vendor and every contractor doing work on common elements.',
        contact_route=web,decision_maker_role='director of community management',
        source_url=det,source_type='directory',confidence='secondary',
        notes='Listed in the HOAManagement.com state directory; the company website shown here is the outbound link published on its HOAManagement.com profile page.')

# ---------------------------------------------------------------- 4. HOA - CAI chapter directories
def gz(path,src,loc):
    h=open(path,encoding='utf-8',errors='replace').read()
    out=[]
    for b in re.split(r'(?=<div class="card gz-directory-card)',h):
        m=re.search(r'itemprop="name">\s*<a[^>]*itemprop="url">([^<]+)</a>',b)
        if not m: continue
        w=re.search(r'gz-card-website">\s*<a href="([^"]+)"',b)
        out.append((html.unescape(m.group(1)).strip(), w.group(1) if w else ''))
    return out
for name,web in gz(R('raw','cai','members.cai-nc.org_member-company-directory_Search_community-management-570565.html'),'',''):
    key=name.lower().strip()
    if key in seen: continue
    seen.add(key)
    add(prospect_type='end-customer',segment='HOA / community association management',name=name,
        website=web,location='North Carolina',
        fit_rationale='CAI North Carolina chapter member in the Community Management category - manages HOAs whose vendor contracts all carry insurance requirements.',
        contact_route=web,decision_maker_role='director of community management',
        source_url='https://members.cai-nc.org/member-company-directory/Search/community-management-570565',
        source_type='association-directory',confidence='secondary',
        notes='CAI-NC publishes a named contact person and that person\'s work mailbox for each member; both were deliberately not recorded.')
h=open(R('raw','cai','cai-sd.org_management-company-directory_.html'),encoding='utf-8',errors='replace').read()
for m in re.finditer(r'<a href="(https?://[^"]+)"[^>]*>\s*<div class=\'glue-up-partner-card\'>.*?<h4 class=\'glue-up-partner-title\'[^>]*>(.*?)</h4>',h,re.S):
    name=html.unescape(m.group(2)).strip(); web=m.group(1)
    key=name.lower().strip()
    if key in seen: continue
    seen.add(key)
    add(prospect_type='end-customer',segment='HOA / community association management',name=name,
        website=web,location='San Diego, CA',
        fit_rationale='CAI San Diego chapter management-company member - a portfolio of California HOAs, each with vendor COI and additional-insured requirements written into its contracts.',
        contact_route=web,decision_maker_role='director of community management',
        source_url='https://cai-sd.org/management-company-directory/',source_type='association-directory',
        confidence='secondary',
        notes='CAI-SD lists a named manager and their mailbox per company; neither was recorded.')
# CAI Houston: names only (no websites published)
h=open(R('raw','cai','caihouston.org_management_company.php.html'),encoding='utf-8',errors='replace').read()
b=re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>',' ',h)
t=html.unescape(re.sub(r'(?s)<[^>]+>','\n',b))
L=[l.strip() for l in t.split('\n') if l.strip()]
seg=L[L.index('Management Company')+1:]
BADLINE=re.compile(r'(President|Director|Manager\b|Vice|CMCA|AMS|PCAM|Owner|Coordinator|Officer|Chapter of|Copyright|\u00a9)',re.I)
for l in seg:
    if not re.search(r'\b(Management|Associa|Group|Services|Properties|Realty|Community|Communities|Association|Inc|LLC|Company|Corporation|Partners|HOA)\b',l): continue
    if BADLINE.search(l) or re.match(r'^[\d\(]',l) or '@' in l or len(l)>70: continue
    name=l.replace('\xa0',' ').strip()
    key=name.lower()
    if key in seen: continue
    seen.add(key)
    add(prospect_type='end-customer',segment='HOA / community association management',name=name,
        location='Houston, TX',
        fit_rationale='Greater Houston CAI chapter management-company member - Texas HOA portfolios where every landscaping, pool and roofing contract requires a current certificate.',
        decision_maker_role='director of community management',
        source_url='https://caihouston.org/management_company.php',source_type='association-directory',
        confidence='secondary',
        notes='CAI Houston publishes only a named individual and their mailbox as the contact; neither was recorded, so contact_route is empty. No website is published in this directory.')

# ---------------------------------------------------------------- 5. commercial PM (BBB)
KEEPCAT=re.compile(r'/profile/(property-management|real-estate-services|commercial-real-estate|real-estate-management)/')
DROP=re.compile(r'\b(yardi|appfolio|construction|roofing|plumbing|hvac|cleaning|janitorial|landscap|moving|storage|law|attorney|insurance|bank|mortgage|title)\b',re.I)
ncomm=collections.Counter()
for l in open(R('raw','bbb_commercial.tsv'),encoding='utf-8').readlines()[1:]:
    p=l.rstrip('\n').split('\t')
    if len(p)<4: continue
    name,city,prof,src=p[:4]
    if not KEEPCAT.search(prof) or DROP.search(name): continue
    key=name.lower().strip()
    if key in seen: continue
    if ncomm[city]>=6: continue
    seen.add(key); ncomm[city]+=1
    add(prospect_type='end-customer',segment='commercial property management',name=name.strip(),
        location=city,
        fit_rationale='Surfaces on a BBB "Commercial Property Management" search for this metro: manages commercial or mixed-use space, so it collects COIs from building vendors and from every commercial tenant on the lease.',
        decision_maker_role='property management director',
        source_url=src,source_type='directory',confidence='secondary',
        notes='From the BBB business search index. BBB company profile pages return 403 to this environment, so the firm\'s own website was not confirmed and website/contact_route are left empty. Some rows in this segment may be mixed residential/commercial.')

# ---------------------------------------------------------------- 6. self-storage (sitelink)
for l in open(R('raw','sitelink_storage.tsv'),encoding='utf-8').readlines()[1:]:
    p=l.rstrip('\n').split('\t')
    if len(p)<5: continue
    name,hq,area,web,src=p[:5]
    key=name.lower().strip()
    if key in seen: continue
    seen.add(key)
    # SiteLink prints "<street> <City>, <State> <zip>" with no comma before the city, so only the
    # state is safely parseable; the full published HQ line is kept in notes instead of guessing a city.
    m=re.search(r',\s*([A-Za-z][A-Za-z ]+?)\s*\d{0,5}\s*$',hq)
    loc=m.group(1).strip() if m else ''
    add(prospect_type='end-customer',segment='self-storage operator',name=name,website=web,
        location=loc,size_signal='',
        fit_rationale=f"Third-party self-storage management company operating across {area} - each site runs on outside contractors (gate, door, pest, landscaping, snow) whose certificates the operator has to hold.",
        contact_route=web,decision_maker_role='director of operations',
        source_url=src,source_type='directory',confidence='secondary',
        notes=f"Headquarters as published by SiteLink: {hq}. Service area as published by SiteLink: {area}. Website is the destination of SiteLink's outbound link for this firm. Location holds the state only because SiteLink prints no comma between street and city.")

# ---------------------------------------------------------------- 7. manufactured housing (MHU Top 100)
h=open(R('raw','mh','www.mobilehomeuniversity.com_mhu-top-100-community-owners.php.html'),encoding='utf-8',errors='replace').read()
PERSONISH=re.compile(r'^(Alan |Johnson Gail|Cohron\'s)')
n=0
for m in re.finditer(r'<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*</td>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>',h,re.S):
    rank=int(m.group(1)); name=re.sub('<[^>]+>','',html.unescape(m.group(2))).strip()
    lots=re.sub('<[^>]+>','',html.unescape(m.group(3))).strip()
    if rank<25 or rank>100 or not name or PERSONISH.match(name): continue
    key=name.lower()
    if key in seen: continue
    seen.add(key); n+=1
    est=' est.' in lots or lots.endswith('est.')
    add(prospect_type='end-customer',segment='manufactured housing community operator',name=name,
        size_signal=f"{lots} manufactured-home lots owned",
        fit_rationale='Mid-size manufactured-home community owner-operator: every park runs on outside vendors (mowing, tree work, sewer, road, snow) and each needs a live certificate naming the park as additional insured.',
        decision_maker_role='director of operations',
        source_url='https://www.mobilehomeuniversity.com/mhu-top-100-community-owners.php',
        source_type='list-article',confidence='secondary',
        notes=('Lot count is Mobile Home University\'s published figure and is labelled "est." on the source page - treat as an estimate.' if est
               else 'Lot count is Mobile Home University\'s published figure, taken verbatim. No website or location is published in this ranking.'))

# ---------------------------------------------------------------- 8. student housing (SHB / J Turner)
h=open(R('raw','students','www.jturnerresearch.com_ora_online-reputation-rankings_student-housing-2025.html'),encoding='utf-8',errors='replace').read()
b=re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>',' ',h)
t=html.unescape(re.sub(r'(?s)<[^>]+>','\n',b))
L=[l.strip() for l in t.split('\n') if l.strip()]
i=L.index('SHB RANK 2025')
j=i+1
while j+3<len(L):
    if not re.fullmatch(r'\d{1,2}',L[j]): break
    name=L[j+1]; shb=L[j+3]
    key=name.lower()
    if key not in seen and re.fullmatch(r'\d{1,2}',shb):
        seen.add(key)
        add(prospect_type='end-customer',segment='student housing operator',name=name,
            size_signal=f"ranked #{shb} on the Student Housing Business Top 25 Managers list (Nov/Dec 2025 issue)",
            fit_rationale='Student-housing manager with turn-season vendor surges (painters, cleaners, movers, furniture installers) hitting every property at once - the exact moment COI lapses go unnoticed.',
            decision_maker_role='risk manager',
            source_url='https://www.jturnerresearch.com/ora/online-reputation-rankings/student-housing-2025',
            source_type='list-article',confidence='secondary',
            notes='Well above the 50-500-unit core ICP; included because the segment has no public register of ICP-sized operators. Ranking republished by J Turner Research from Student Housing Business.')
    j+=4


# =====================================================================================
# Part 2: partners, channels and excluded competitors.
# Each row below was checked by probe_sites.py; PROBE holds {name: (status, title, contact)}
# from raw/partners_out.tsv, raw/partners_retry_out.tsv, raw/events_out.tsv, raw/events2_out.tsv.
# A row whose site never answered keeps website='' and says so in notes.
# =====================================================================================
PROBE={}
for fn in ('partners_out.tsv','partners_retry_out.tsv','events_out.tsv','events2_out.tsv'):
    p=R('raw',fn)
    if not os.path.exists(p): continue
    for l in open(p,encoding='utf-8').readlines()[1:]:
        q=l.rstrip('\n').split('\t')
        if len(q)>=5: PROBE[q[0]]=dict(web=q[1],status=q[2],title=q[3],contact=q[4])

def p2(name, ptype, segment, why, role, notes='', loc='', src_type='company-site', size=''):
    d=PROBE.get(name)
    if not d:
        return
    ok=d['status']=='ok'
    web=d['web'] if ok else ''
    conf='verified' if ok and 'Forbidden' not in d['title'] and 'Cloudflare' not in d['title'] and 'Access denied' not in d['title'] else ('unverified' if not ok else 'secondary')
    n=notes
    if not ok:
        n=(n+' ').strip()+" The organisation's own site did not answer two fetches from this environment, so website and contact_route are left empty."
    elif conf!='verified':
        n=(n+' ').strip()+f" The site answered but returned a bot-challenge/permission page (\"{d['title']}\") instead of content, so the listing is not independently read."
    add(prospect_type=ptype,segment=segment,name=name,website=web,location=loc,size_signal=size,
        fit_rationale=why,contact_route=d['contact'] or web,decision_maker_role=role,
        source_url=web or 'https://www.certificial.com/blog-post/best-mycoi-alternatives-2026',
        source_type=src_type,confidence=conf,notes=n.strip())

EXC_SRC='https://www.getbcs.com/blog/top-certificate-of-insurance-tracking-companies'
def excl(name, why, notes=''):
    d=PROBE.get(name,{})
    ok=d.get('status')=='ok'
    add(prospect_type='excluded',segment='COI compliance competitor',name=name,
        website=d.get('web','') if ok else '',location='',
        fit_rationale=why,contact_route='',decision_maker_role='',
        source_url=d.get('web') if ok else EXC_SRC,
        source_type='company-site' if ok else 'list-article',
        confidence='verified' if ok else 'secondary',
        notes=(notes+(' ' if notes else ''))+('Direct competitor - never contact as a prospect.'
              if ok else 'Direct competitor - never contact as a prospect. Its own site did not answer '
              'from this environment; named as a COI-tracking platform on the BCS comparison page used as source_url.'))

for n,w in [
 ('myCOI','The incumbent Certly is priced under: 16 years of certificate tracking, managed human review, demo-gated enterprise pricing.'),
 ('illumend','myCOI\'s AI-first rebrand (May 2025) and the closest product analogue to Certly\'s extraction engine.'),
 ('TrustLayer','Funded COI-verification platform for construction and real estate; the category\'s best-known brand.'),
 ('Jones','COI tracking built specifically for commercial real estate and construction - the same buyer Certly targets, one tier up.'),
 ('Evident ID','Insurance and credential verification across 40+ coverage lines; enterprise end of the same category.'),
 ('Certificial','Real-time COI monitoring via its Smart COI Network; direct category competitor.'),
 ('BCS (Business Credentialing Services)','Managed certificate-tracking service, explicitly positioned as a myCOI alternative.'),
 ('SmartCompliance','COI tracking and issuance, publicly priced from about $1,000/yr and marketed "best for SMBs" - the closest competitor to Certly\'s price point.'),
 ('CertFocus','Certificate tracking vendor operating since 2004, largely in real estate and construction.'),
 ('PINS Advantage','Budget-tier multi-industry COI tracking platform.'),
 ('Docutrax','Long-standing outsourced certificate-tracking service.'),
 ('Billy','Construction-native COI and compliance platform offering both managed and self-serve tiers.'),
 ('NetVendor','Multifamily vendor-credentialing and COI-compliance platform - sells to exactly the property managers in this file.'),
 ('RealPage','Owns Compliance Depot / Vendor Credentialing; its homepage markets vendor compliance, so it competes rather than partners.'),
 ('Yardi Systems','Ships VendorCafe / VendorShield vendor compliance alongside its PM software; treat as competitor, not partner.'),
 ('Vendorful','Vendor-management platform whose scope overlaps COI collection and vendor documents.'),
]: excl(n,w)

SW='PM software vendor'
for n,why,note in [
 ('AppFolio','Runs the ledger and vendor records for thousands of ICP-sized residential managers; a COI check that reads AppFolio vendor lists is a natural marketplace integration.','No certificate-of-insurance or vendor-credentialing wording found on the homepage fetched for this row, so it is treated as a partner rather than a competitor.'),
 ('Buildium','The default software for 50-500 unit residential managers - the exact Certly ICP - and runs a partner marketplace.','No COI/vendor-credentialing wording found on the fetched homepage.'),
 ('Rent Manager','Mid-market PM platform with a large integration marketplace and its own user conference.','No COI/vendor-credentialing wording found on the fetched homepage.'),
 ('Propertyware','Single-family-focused PM platform (RealPage-owned) used by mid-size managers.','RealPage-owned; the Propertyware product itself showed no COI module, but the parent is listed as excluded.'),
 ('DoorLoop','Self-serve PM software sold at a price point adjacent to Certly\'s, with an integrations directory.','No COI/vendor-credentialing wording found on the fetched homepage.'),
 ('TenantCloud','Self-serve PM software for small landlords and managers.',''),
 ('RentRedi','Self-serve landlord/PM platform, strong small-portfolio distribution.',''),
 ('Innago','Free/low-cost PM software with a very large small-landlord base.',''),
 ('Hemlane','Hybrid PM software plus local agent network; already sells vendor coordination.',''),
 ('CINC Systems','HOA/community-association platform - the software layer under a large share of the HOA firms in this file.',''),
 ('Vantaca','Community-association management platform with a workflow engine an insurance check could plug into.',''),
 ('Condo Control','Condo and HOA management platform used by small association managers.',''),
 ('PayHOA','Self-serve HOA management software at a comparable price point and go-to-market.',''),
 ('FRONTSTEPS','Community-management platform for HOA managers.',''),
 ('Smartwebs','All-in-one HOA management software for association managers.',''),
 ('Rentec Direct','PM software with a long-tail base of small residential managers.',''),
 ('ResMan','Multifamily/affordable PM platform.',''),
 ('Entrata','Multifamily operating platform.',''),
 ('MRI Software','Commercial and residential real-estate software with a large partner ecosystem.',''),
 ('Rentvine','Newer PM platform aimed at growth-stage residential managers.',''),
 ('LeadSimple','Process and workflow automation used by PM operators to run repeatable tasks such as renewal chases.',''),
 ('Re-Leased','Commercial property management software - the commercial-tenant COI use case.',''),
 ('SimplifyEm','Low-cost PM software for small portfolios.',''),
 ('Yardi Breeze','Yardi\'s self-serve tier aimed at small managers; listed separately from Yardi\'s enterprise vendor-compliance product.','Parent company Yardi is listed as excluded because of VendorCafe/VendorShield; Breeze itself is the small-manager product Certly\'s buyers actually use.'),
]:
    p2(n,'partner',SW,why,'head of partnerships / integrations',note)

MP='maintenance & vendor platform'
for n,why in [
 ('Property Meld','Maintenance coordination for residential PMs: already sits between the manager and the vendor, which is exactly where the certificate lives.'),
 ('Latchel','Front-office/maintenance platform for property managers with an existing vendor network.'),
 ('EZ Repair Hotline','Maintenance dispatch service for property managers.'),
 ('Lula','Property maintenance network - vetting vendors is core to its pitch, so insurance verification is adjacent.'),
 ('HappyCo','Property operations and inspection platform for multifamily.'),
 ('VendorSmart','Vendor sourcing and management for community associations.'),
 ('Lessen','National facilities/maintenance provider (formerly SMS Assist) that manages large vendor networks for property owners.'),
 ('Mezo','AI maintenance triage, now paired with Property Meld.'),
 ('Second Nature','Resident-experience programs sold through property managers; an established PM channel partner model.'),
 ('RentCheck','Inspection automation for property managers.'),
 ('Vendoroo','AI maintenance coordination for property managers - shares the vendor-onboarding moment with Certly.'),
 ('Tenant Turner','Leasing automation for residential PMs, with a large PM customer base.'),
 ('Rently','Resident lifecycle and self-tour platform for PM operators.'),
 ('Home365','Tech-enabled property management platform.'),
]:
    p2(n,'partner',MP,why,'head of partnerships')

INS='insurance agency / MGA'
for n,why in [
 ('Steadily','Landlord-insurance carrier/agency selling to exactly the owners and managers in this file; it issues the certificates Certly reads.'),
 ('Obie','Insurance for landlords and real-estate investors; a natural co-sell into small PM portfolios.'),
 ('NREIG','Program insurer for real-estate investor portfolios - the counterparty on many of the COIs a PM collects.'),
 ('Arcana Insurance Services','Program administrator focused on investor and rental-property portfolios.'),
 ('Millennial Specialty Insurance','MGA whose programs sit behind many multifamily and PM insurance placements.'),
 ('Community Association Underwriters','Specialist HOA/condo association insurer - the same buyer as the HOA segment of this file.'),
 ('Kevin Davis Insurance Services','Community-association insurance program administrator.'),
 ('McGowan Program Administrators','Program administrator with community-association and real-estate books.'),
 ('MiniCo Insurance Agency','Self-storage specialist insurance agency - matches the self-storage segment.'),
 ('Assurant','Multifamily housing insurance programs sold through property managers.'),
]:
    p2(n,'partner',INS,why,'head of partnerships / program manager')

CO='PM consultant / coach'
for n,why in [
 ('DoorGrow','Coaching and marketing firm for property-management business owners, with a large operator audience and its own show.'),
 ('Fourandhalf','Marketing agency serving property-management companies; runs The Property Management Show.'),
 ('RentScale','Sales consulting for property-management companies.'),
 ('Geekly Media','Sales, marketing and operations agency for property management firms.'),
 ('PMW (Property Manager Websites)','Website and marketing provider to property-management companies; reaches the same owner audience.'),
]:
    p2(n,'partner',CO,why,'head of partnerships')

AS='industry association'
for n,why,loc in [
 ('NARPM','The trade association for residential property managers - chapters, education and a national convention aimed exactly at the ICP.',''),
 ('Community Associations Institute','The trade association for HOA/condo managers; its chapters supplied several segments of this file.',''),
 ('IREM','Certifies property managers (CPM/ARM/AMO) and runs chapters across the US.',''),
 ('National Apartment Association','Federation of state/local apartment associations reaching multifamily owner-operators.',''),
 ('BOMA International','Commercial real-estate trade association - the commercial property management segment.',''),
 ('Self Storage Association','Trade body for self-storage owners and operators.',''),
 ('Manufactured Housing Institute','Trade body for manufactured-home community owners.',''),
 ('National Multifamily Housing Council','Apex body for large multifamily owners and managers.',''),
 ('California Apartment Association','State apartment association; rental-housing owners and managers.','California'),
 ('Texas Apartment Association','State apartment association.','Texas'),
 ('Florida Apartment Association','State apartment association.','Florida'),
 ('Arizona Multihousing Association','State apartment association.','Arizona'),
 ('Apartment Association of Metro Denver','Metro apartment association.','Denver, CO'),
 ('Washington Multi-Family Housing Association','State multifamily association.','Washington'),
 ('Apartment Association of Greater Los Angeles','Metro apartment association.','Los Angeles, CA'),
 ('Rental Housing Association of Washington','Rental-housing owner association.','Washington'),
 ('Nevada State Apartment Association','State apartment association.','Nevada'),
 ('Chicagoland Apartment Association','Metro apartment association.','Chicago, IL'),
]:
    p2(n,'partner',AS,why+' Newsletter, chapter meeting and trade-show slots are the reachable surface.',
       'membership / education director',loc=loc,src_type='association-directory')

CF='conference'
for n,why in [
 ('NARPM Annual Convention & Trade Show','The single densest gathering of ICP-sized residential property managers in the US.'),
 ('NARPM Broker/Owner Conference & Expo','Owner-level NARPM event - the buyer, not the technician.'),
 ('NAA Apartmentalize','Largest US apartment-industry conference; multifamily owner-operators and their vendor teams.'),
 ('BOMA International Conference & Expo','Commercial property management decision makers.'),
 ('IREM Global Summit','IREM\'s annual event for certified property managers and AMO firms.'),
 ('ISS World Expo','The self-storage industry\'s main conference and trade show.'),
 ('SSA Fall Conference','Self Storage Association national event.'),
 ('Rent Manager User Conference','Users of a mid-market PM platform, in one room.'),
 ('AppFolio Customer Conference','AppFolio\'s customer event - the ICP\'s software conference.'),
 ('Vantaca Elevate','Community-association management software user conference.'),
 ('IMN Single-Family Rental Forum','SFR owner-operator and manager forum.'),
 ('Inman Connect','Residential real-estate and property-management operators.'),
]:
    p2(n,'channel',CF,why,'sponsorship / exhibitor sales')

ME='media / newsletter / podcast'
for n,why in [
 ('Propmodo','Commercial real-estate technology publication read by PM operators.'),
 ('Multifamily Dive','Daily multifamily news read by owner-operators.'),
 ('Multifamily Executive','Multifamily trade publication; also republishes the student-housing manager rankings used in this file.'),
 ('Habitat Magazine','Publication for condo, co-op and HOA boards and their managers.'),
 ('HOAleader.com','Practical HOA-management publication aimed at boards and managers.'),
 ('MHInsider','Manufactured-housing trade publication.'),
 ('Inside Self-Storage','Self-storage trade publication and events brand.'),
 ('The Property Management Show','Podcast for property-management business owners (published by Fourandhalf).'),
 ('DoorGrow Show','Podcast for property-management entrepreneurs.'),
 ('Yield PRO','Multifamily development and management publication.'),
 ('The Cooperator','Co-op, condo and HOA publication with regional editions.'),
 ('Florida Community Association Journal','Florida HOA/condo management publication.'),
 ('Student Housing Business','Publisher of the Top 25 student-housing managers list.'),
 ('Rental Housing Journal','Regional rental-housing trade paper for owners and managers.'),
 ('NARPM Residential Resource','NARPM\'s member magazine.'),
]:
    p2(n,'channel',ME,why,'advertising / editorial contact')

CM='online community'
for n,why in [
 ('BiggerPockets','Large landlord and investor community where self-managing owners ask exactly the questions Certly answers.'),
 ('Multifamily Insiders','Long-running multifamily property-management community and webinar series.'),
]:
    p2(n,'channel',CM,why,'community / partnerships manager')

# Communities that live on reddit.com / facebook.com, which are blocked from this environment.
# They are sourced to a third-party round-up that was fetched and parsed
# (raw/comm2/www.secondnature.com_blog_best-property-management-forums.html), so each row has a real
# source_url. No URL, no member list and no post content is recorded for the community itself.
COMM_SRC='https://www.secondnature.com/blog/best-property-management-forums'
for n,size,note in [
 ('r/propertymanagement (Reddit)','',"Named by Second Nature's round-up as the leading Reddit forum for property managers. reddit.com is blocked from this environment, so the community itself was not opened and no URL, member list or post content is recorded."),
 ('Property Management Mastermind (Facebook group)','over 12,000 members (as stated by the source)',"Described by the source as the largest property management Facebook group. facebook.com is blocked from this environment; name and the source's own member figure only."),
 ('NARPM Discussion Group (Facebook group)','over 2,500 members (as stated by the source)','The NARPM members\' Facebook group. facebook.com is blocked from this environment; name and the source\'s own member figure only.'),
 ('AppFolio User Group (Facebook group)','over 2,000 members (as stated by the source)','A user community for one of the ICP\'s dominant platforms - the audience is literally "property managers who already run software". facebook.com blocked; name only.'),
 ('Rent Manager User Forum (Facebook group)','over 2,000 members (as stated by the source)','User community for Rent Manager. facebook.com blocked; name only.'),
 ('Buildium Users Unite (Facebook group)','','Described by the source as almost as large as the AppFolio group with about three posts a day. facebook.com blocked; name only, and no member figure is published.'),
 ('Triple Win Property Managers','over 1,000 members (as stated by the source)','Private group restricted to professional single-family-rental property managers - the tightest ICP match of any community here. Run by Second Nature, which is also listed as a partner.'),
 ('PM Health (Facebook group)','','A property-manager community organised around wellbeing rather than operations; useful for reach, not for pitching. facebook.com blocked; name only.'),
]:
    add(prospect_type='channel',segment='online community',name=n,size_signal=size,
        fit_rationale='Where ICP-sized property managers discuss vendor, maintenance and insurance problems in public; usable as a listening and content channel, not as a contact list.',
        decision_maker_role='community moderator / group admin',
        source_url=COMM_SRC, source_type='list-article', confidence='secondary',
        notes=note)

with open(R('prospects.csv'),'w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=COLS,quoting=csv.QUOTE_ALL); w.writeheader()
    for r in rows: w.writerow(r)
print(len(rows),'rows total')
print(collections.Counter(r['prospect_type'] for r in rows))
