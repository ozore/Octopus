#!/usr/bin/env python3
"""Assemble phase-3-acquisition/prospects/recoup/prospects.csv from the raw
artefacts pulled in raw/ (see sources.md). Run from the repo root:
    python3 phase-3-acquisition/prospects/recoup/scripts/build_csv.py
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
RAW = os.path.join(BASE, 'raw')
DATE = '2026-09-03'
COLS = ['app','prospect_type','segment','name','website','location','size_signal',
        'fit_rationale','contact_route','decision_maker_role','source_url','source_type',
        'confidence','collected_on','notes']

SRC = {
 'ft200':'https://www.franchisetimes.com/app/2025-Franchise-Times-Restaurant-200.pdf',
 'mega99':'https://www.franchising.com/articles/20260228_2026_mega99rankings.html',
 'mb50':'https://www.franchising.com/articles/20260606_2026_multibrand_50_scale_evolves_into_strategy.html',
 'dso':'https://gotu.com/dso-directory/',
 'vet22':'https://vetintegrations.com/insights/veterinary-consolidators/',
 'vet26':'https://transitionselite.com/veterinary-practice-consolidators/',
 'uc':'https://www.jucm.com/2024-urgent-cares-top-100-by-number-of-locations/',
 'cw':'https://www.carwashadvisory.com/top-car-wash-companies',
 'ij':'https://www.insurancejournal.com/top-100-insurance-agencies/',
 'cs':'https://en.wikipedia.org/wiki/List_of_convenience_stores',
 'cann':'https://www.mediajel.com/blogs/top-10-cannabis-dispensary-chains',
 'vl':'https://visuallease.com/vl-marketplace/partners/',
}

def norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())

def load_sites():
    """name -> (website, contact_route) for every name whose domain passed strict_check."""
    m = {}
    for f in ('whitelist_clean.tsv','known_clean.tsv','sites_r_clean.tsv','sites_r_retryclean.tsv',
              'sites2_clean.tsv','sites2b_clean.tsv','sites3_clean.tsv'):
        p = os.path.join(RAW, f)
        if not os.path.exists(p): continue
        for line in open(p, encoding='utf-8'):
            c = line.rstrip('\n').split('\t')
            if len(c) >= 5 and c[4] == 'ok' and c[1]:
                strip = lambda u: re.sub(r':(?:80|443)(?=/|$)', '', u or '')
                m.setdefault(norm(c[0]), (strip(c[1]), strip(c[2])))
    return m

SITES = load_sites()

rows = []
seen = {}

LEGAL = r'(?:\b(?:inc|llc|l\.l\.c|corp|corporation|co|ltd|lp|llp|pc|plc|holdings?|companies|company|group)\b\.?\s*)+$'
def canon(name):
    """Canonical identity key: drop an alternate-entity tail after / and legal suffixes."""
    n = name.split('/')[0]
    n = re.sub(r'\s*\(.*?\)\s*', ' ', n)
    n = re.sub(r'[^A-Za-z0-9 ]', ' ', n.replace('’', "'")).lower()
    n = re.sub(r'\s+', ' ', n).strip()
    prev = None
    while prev != n:
        prev = n
        n = re.sub(LEGAL, '', n).strip()
    k = re.sub(r'[^a-z0-9]', '', n) or re.sub(r'[^a-z0-9]', '', name.lower())
    return ALIAS.get(k, k)

ALIAS = {
 'caveenterprisesoperations':'caveenterprises','circlekstores':'circlek',
 'emergerestaurant':'emerge','jacksoncross':'jacksoncrosspartners',
 'splashcarwashoilchange':'splashcarwash','transwesterncommercialservice':'transwestern',
 'withumsmithbrown':'withum','pdshealth':'pacificdentalservices',
}
def _unused():
    return None

def add(ptype, segment, name, location, size, fit, role, src, stype, conf, notes='', website=None, contact=None):
    name = re.sub(r'\s+', ' ', (name or '')).strip()
    if not name or not src: return
    w, c = SITES.get(norm(name), ('',''))
    if not w:
        w, c = SITES.get(canon(name), ('',''))
    if website is not None: w = website
    if contact is not None: c = contact
    w = re.sub(r':(?:80|443)(?=/|$)', '', w or '')
    c = re.sub(r':(?:80|443)(?=/|$)', '', c or '')
    key = canon(name)
    if key in seen:
        prev = seen[key]
        if not prev['website'] and w: prev['website'] = w; prev['contact_route'] = c or prev['contact_route']
        if not prev['location'] and location: prev['location'] = location
        if not prev['size_signal'] and size: prev['size_signal'] = size
        elif size and size not in prev['size_signal']: prev['size_signal'] += '; ' + size
        if prev['website'] and prev['confidence'] == 'secondary': prev['confidence'] = 'verified'
        extra = 'Also listed as "%s" in %s.' % (name, src)
        if extra not in prev['notes']: prev['notes'] = (prev['notes'] + ' ' + extra).strip()
        return
    if w and conf == 'secondary': conf = 'verified'
    r = {'app':'recoup','prospect_type':ptype,'segment':segment,'name':name,'website':w,
                 'location':location or '','size_signal':size or '','fit_rationale':fit,
                 'contact_route':c or '','decision_maker_role':role,'source_url':src,
                 'source_type':stype,'confidence':conf,'collected_on':DATE,'notes':notes}
    seen[key] = r
    rows.append(r)

def titlecase(s):
    s = s.strip()
    if s.isupper():
        small = {'of','and','the','for','a','de','at'}
        out = []
        for i, w in enumerate(s.split()):
            lw = w.lower()
            out.append(w if (len(w) <= 3 and w.isalpha() and w.upper() == w and lw not in small and i == 0)
                       else (lw if lw in small and i else w.capitalize()))
        s = ' '.join(out)
    return s

# ---------------------------------------------------------------- restaurant / multi-unit
ft = json.load(open(os.path.join(RAW,'ft200.json')))
for e in ft:
    units = e['units']
    brands = ', '.join(b[1] for b in e['brands'][:4])
    size = f"{units} restaurants across {len(e['brands'])} brand(s) ({brands})" if units else ''
    fit = ('Multi-unit restaurant franchisee ranked #%d in the Franchise Times Restaurant 200; '
           'leases every site in strip and pad locations and receives a CAM reconciliation from each landlord.' % e['rank'])
    notes = 'Franchise Times Restaurant 200 rank %d (2025 list, FY2024 data).' % e['rank']
    if e.get('rev'): notes += ' Reported sales %s.' % e['rev']
    if e.get('est'): notes += ' Revenue is a Franchise Times estimate.'
    if units and units > 800: notes += ' Very large operator - likely has in-house real-estate staff, lower fit.'
    add('end-customer','multi-unit restaurant franchisee',e['name'],e['loc'],size,fit,
        'director of real estate',SRC['ft200'],'list-article','secondary',notes)

for rank, comp, units, brands in json.load(open(os.path.join(RAW,'mega99.json'))):
    n = titlecase(comp)
    fit = ('Multi-unit, multi-brand franchisee ranked #%d on the 2026 Mega 99 by unit count; '
           'a portfolio of leased sites means a CAM reconciliation from every landlord each year.' % rank)
    nt = 'Multi-Unit Franchisee Mega 99 rank %d (2026). Brands: %s' % (rank, brands[:180])
    if re.search(r'aramark|sodexo|compass group|target corporation|love|circle k|travelcenters|army|air force',n,re.I):
        nt += ' Contract caterer, retailer or travel-centre operator franchising brands inside venues it already '\
              'occupies - much of the estate is not third-party landlord space, so fit is lower.'
    add('end-customer','multi-unit restaurant franchisee',n,'',f'{units} franchised units',fit,
        'director of real estate',SRC['mega99'],'list-article','secondary',nt)

_mb = json.load(open(os.path.join(RAW,'mb50.json')))
# the source table nests brand rows inside company rows; a "company" whose unit count collapses
# against the descending ranking is a misparsed brand line, so drop it rather than emit a brand.
_clean, _prev = [], None
for rank, comp, units in _mb:
    if _prev is not None and units < 0.5 * _prev: continue
    _clean.append((rank, comp, units)); _prev = units
for rank, comp, units in _clean:
    n = titlecase(re.sub(r'\s*\(.*?\)\s*',' ',comp)).strip()
    fit = ('Multi-brand franchise operator ranked #%d on the 2026 Multi-Brand 50; operates two or more '
           'concepts across leased retail sites, each with its own CAM reconciliation.' % rank)
    add('end-customer','multi-unit restaurant franchisee',n,'',f'{units} franchised units',fit,
        'director of real estate',SRC['mb50'],'list-article','secondary',
        'Multi-Brand 50 rank %d (2026, FRANdata unit counts as of late 2025).' % rank)

# ---------------------------------------------------------------- DSOs
for o in json.load(open(os.path.join(RAW,'dso_gotu.json'))):
    fit = ('Dental support organisation supporting %s practices - almost all of them leased suites in '
           'shopping centres and medical retail, each billed CAM by a different landlord.' % o['practices'])
    notes = 'GoTu DSO directory: %s practices in %s states; %s.' % (o['practices'], o['states'], o['spec'])
    n = re.sub(r'\s*\(.*?\)$','',o['name']).strip()
    add('end-customer','dental service organisation',n,o['loc'],'%s supported practices' % o['practices'],
        fit,'vice president of real estate',SRC['dso'],'directory','secondary',notes)

# ---------------------------------------------------------------- vets
for name, founded, count in json.load(open(os.path.join(RAW,'vet_consolidators.json'))):
    fit = ('Veterinary consolidator operating %s hospitals; multi-site tenant in retail and medical strip '
           'centres, exposed to landlord CAM reconciliations across the portfolio.' % count)
    add('end-customer','veterinary group',name,'','%s hospitals' % count,fit,'director of facilities',
        SRC['vet22'],'list-article','secondary',
        'VetIntegrations consolidator table, December 2022 revision - hospital counts are dated; founded %s.' % founded)
for h in json.load(open(os.path.join(RAW,'vet_2026.json'))):
    n = re.sub(r'^\d+\.\s*','',h); n = re.sub(r'\s*\(.*?\)\s*$','',n).strip()
    fit = ('Veterinary practice consolidator listed in the 2026 consolidator directory; a national portfolio of '
           'leased clinic sites means recurring CAM reconciliations.')
    add('end-customer','veterinary group',n,'','',fit,'director of facilities',SRC['vet26'],'list-article',
        'secondary','Listed in Transitions Elite 2026 veterinary consolidator directory (%s).' % h)

# ---------------------------------------------------------------- urgent care
for o in json.load(open(os.path.join(RAW,'urgentcare.json'))):
    aff = o.get('aff','').strip()
    hs = aff and aff.isdigit() and int(aff) >= o['total']*0.8
    fit = ('Urgent-care operator with %d centres, the great majority in leased retail strip centres where the '
           'landlord bills CAM annually.' % o['total'])
    notes = 'JUCM 2024 Urgent Care Top 100, rank %d, %d locations.' % (o['rank'], o['total'])
    if aff: notes += ' %s health-system affiliated.' % aff
    if hs: notes += ' Predominantly health-system owned - may own rather than lease, lower fit.'
    if o.get('brands'): notes += ' Brands: %s' % o['brands'][:120]
    add('end-customer','urgent care operator',o['name'],'','%d urgent care centres' % o['total'],fit,
        'director of real estate',SRC['uc'],'list-article','secondary',notes)

# ---------------------------------------------------------------- car wash
for o in json.load(open(os.path.join(RAW,'carwash.json'))):
    fit = ('Express car-wash chain with %d sites; the ground-leased and pad-leased portion of the portfolio '
           'carries landlord CAM and tax pass-throughs worth auditing.' % o['sites'])
    add('end-customer','car wash chain',o['name'],o['hq'],'%d wash sites' % o['sites'],fit,
        'chief financial officer',SRC['cw'],'list-article','secondary',
        'Car Wash Advisory ranking by site count. Caveat: many express washes own their real estate, '
        'so only the leased subset is addressable.')

# ---------------------------------------------------------------- convenience stores
for o in json.load(open(os.path.join(RAW,'cs'+'tores.json'))):
    fit = ('Regional convenience-store chain headquartered in %s; leased in-line and pad sites carry landlord '
           'CAM and real-estate-tax pass-throughs.' % o['state'])
    add('end-customer','convenience store chain',o['name'],o['state'],'',fit,'director of real estate',
        SRC['cs'],'directory','secondary',
        'Wikipedia list of convenience stores, US section (%s). %s Caveat: fuel-site c-stores frequently own '
        'their real estate.' % (o['state'], o['note'][:120]))

# ---------------------------------------------------------------- insurance agencies
for o in json.load(open(os.path.join(RAW,'ij_top100.json'))):
    big = o['rank'] <= 20
    fit = ('Independent retail property/casualty agency (#%d by P&C revenue) reconciling monthly commission '
           'statements from dozens of carriers - the secondary Recoup variant.' % o['rank'])
    notes = 'Insurance Journal 2026 Top 100 Independent P/C Agencies, rank %d, P&C revenue %s.' % (o['rank'], o['pc_revenue'])
    if big: notes += ' National broker far larger than the 2-20 producer ICP - low fit, listed for completeness.'
    add('end-customer','independent insurance agency',o['name'],o['office'],'P&C revenue %s' % o['pc_revenue'],
        fit,'agency principal',SRC['ij'],'list-article','secondary',notes)

# ---------------------------------------------------------------- extras (only when the site verified)
EXTRA = [
 ('cannabis dispensary chain', ['Curaleaf','Trulieve','Green Thumb Industries','Verano Holdings','Cresco Labs',
   'The Cannabist Company','Ascend Wellness Holdings','Ayr Wellness','Acreage Holdings','Cookies','Native Roots',
   'The Green Solution','Jushi Holdings','Columbia Care'],
  'Cannabis retailer operating a chain of dispensaries in leased strip-centre and high-street space, where '
  'landlords bill CAM and often charge cannabis-specific premiums.','director of retail operations',
  'Named in the MediaJel ranking of the largest US cannabis dispensary chains; row kept only because the '
  'company website was fetched and confirmed.'),
 ('fitness operator', ['National Fitness Partners','Taymax Group','United PF Partners','Excel Fitness',
   'Bandon Fitness','CR Fitness Holdings','Fitness Ventures','Grand Fitness Partners','Omega Fitness',
   'Aligned Fitness','Fit Fusion','United Fitness Partners','Crunch Fitness','Retro Fitness','Workout Anytime',
   'Snap Fitness','24 Hour Fitness','LA Fitness','Life Time','Blink Fitness','Youfit Health Clubs',
   'Chuze Fitness','EoS Fitness','VASA Fitness','Fitness Connection'],
  'Multi-club gym operator; big-box and studio clubs are anchor or junior-anchor leases where CAM, '
  'HVAC and parking-lot charges are the largest recurring landlord bills.','chief financial officer',
  'Multi-club fitness operator; website fetched and confirmed. Club counts not captured from a single '
  'ranking source - the Franchise Times Fitness 25 and fitnessnav.com were both blocked.'),
 ('childcare chain', ['KinderCare Learning Companies','Learning Care Group','The Learning Experience',
   'Primrose Schools','Goddard Systems','Childcare Network','Endeavor Schools','Cadence Education',
   'Spring Education Group','Big Blue Marble Academy','Kids R Kids','Lightbridge Academy','Celebree School',
   'Guidepost Montessori'],
  'Multi-site early-education operator; centres are leased retail or standalone pads with landlord CAM, '
  'snow removal and parking-lot charges billed annually.','director of real estate',
  'Childcare chain; website fetched and confirmed. Exchange magazine Top 50 for-profit child care list '
  'returned 403 so no ranked centre counts were captured.'),
 ('cellular authorized retailer', ['Victra','Russell Cellular','Cellular Sales','TCC','Wireless Zone',
   'GoWireless','Arch Telecom','Mobilelink','Prime Communications'],
  'Carrier-authorised wireless dealer running hundreds of small in-line retail leases, the single most '
  'CAM-exposed store format there is.','director of real estate',
  'Carrier authorised retailer; website fetched and confirmed.'),
 ('auto service chain', ['Take 5 Oil Change','Grease Monkey','Christian Brothers Automotive',
   'Valvoline Instant Oil Change','Mavis Tire Express Services','Sun Auto Tire & Service',
   'Big Brand Tire & Service','Meineke','Midas','Jiffy Lube'],
  'Multi-site automotive service operator leasing pad and end-cap sites subject to landlord CAM and '
  'tax pass-throughs.','chief financial officer','Auto-service chain or franchisor; website fetched and confirmed.'),
 ('salon and personal care group', ['European Wax Center','Massage Envy','The Joint Chiropractic',
   'Sport Clips','Great Clips','Supercuts','Drybar','Amazing Lash Studio',
   'Hand & Stone Massage and Facial Spa','LaserAway','Ideal Image','Skin Laundry'],
  'Personal-care chain whose studios sit in in-line shopping-centre space - the format with the highest '
  'CAM per square foot and the most frequent landlord billing errors.','chief financial officer',
  'Salon / med-spa brand; website fetched and confirmed. Rows are the brand entity; the largest '
  'franchisee groups behind each brand were not separately identifiable without a paywalled list.'),
 ('regional retail chain', ['Mattress Firm','Sleep Number','City Furniture','Conn’s HomePlus','Big Lots',
   'Ollie’s Bargain Outlet','Five Below','Dollar General','Savers','Petco','Pet Supplies Plus'],
  'Multi-unit specialty retailer occupying leased in-line and junior-anchor space subject to annual CAM '
  'reconciliation.','director of real estate','Specialty retail chain; website fetched and confirmed.'),
]
for seg, names, fit, role, note in EXTRA:
    for n in names:
        w, c = SITES.get(norm(n), ('',''))
        if not w: continue
        add('end-customer',seg,n,'','',fit,role,w,'company-site','verified',note,website=w,contact=c)

# ---------------------------------------------------------------- partners from Visual Lease marketplace
vl = json.load(open(os.path.join(RAW,'vl_partners.json')))
VL_SEG = {
 'broker':('tenant-rep broker','Tenant-representation brokerage with a lease-administration desk; its multi-site '
           'retail clients are exactly the tenants a contingency CAM audit serves, and the brokerage keeps the '
           'relationship while Recoup does the recovery.','head of lease administration'),
 'account':('lease accounting and advisory firm','Accounting firm running lease-accounting and ASC 842 engagements '
            'for multi-site tenants; a CAM audit is an adjacent, contingency-priced service it can refer.','partner, real estate practice'),
 'admin':('lease administration service provider','Outsourced lease-administration provider already abstracting its '
          'clients leases; the abstracted clause data is the exact input a CAM audit needs.','head of partnerships'),
}
BROKERS = {'cbre','jll','cresa','savills','newmark','avison','colliers','transwestern','mohr','jones lang'}
ACCT = {'bdo','baker tilly','ernst','grant thornton','rsm','withum','cfgi','embark','solomonedwards','f. h. black'}
for url, lab in vl.items():
    n = re.sub(r'^Read More','',lab).strip()
    n = re.sub(r'\s*\(.*?\)\s*$','',n).strip()
    low = n.lower()
    if any(b in low for b in BROKERS): seg, fit, role = VL_SEG['broker']
    elif any(a in low for a in ACCT): seg, fit, role = VL_SEG['account']
    else: seg, fit, role = VL_SEG['admin']
    if low in ('workday','vertosoft'): continue
    add('partner',seg,n,'','Listed in the Visual Lease partner marketplace',fit,role,
        SRC['vl'],'directory','secondary','Visual Lease VL Marketplace partner listing: %s' % url)


# ---------------------------------------------------------------- partners / channels / excluded
# Every row below is emitted only when scripts/verify_sites.py + strict_check.py + domain_sanity.py
# confirmed the organisation's own site, so source_url is that site and confidence is `verified`.
PCE = [
 ('partner','lease administration software',
  ['Leasecake','Occupier','Visual Lease','FinQuery','Lease Harbor','Nakisa','MRI Software',
   'Crunchafi','EZLease','Spacebase','iLeasePro','Accruent','AMTdirect','Tango Analytics','Trimble',
   'CoStar Real Estate Manager'],
  'Lease administration and lease accounting platform whose customers are exactly the multi-site tenants '
  'Recoup audits; it holds the abstracted lease clauses but does not chase the landlord for the money, so '
  'a contingency CAM audit is complementary rather than competing.','head of partnerships',
  'Lease admin / lease accounting vendor. Check before outreach whether the vendor has since shipped its own '
  'CAM audit module - if it has, reclassify as excluded.'),
 ('partner','lease administration service provider',
  ['Scribcor Global','NTrust Infotech','RE BackOffice'],
  'Outsourced lease abstraction and administration provider; already holds the client leases in structured '
  'form, which is the exact input a CAM audit needs.','head of partnerships',
  'RE BackOffice also markets lease audit - verify before treating as a partner rather than a competitor.'),
 ('partner','tenant-rep broker',
  ['Cresa','CBRE','JLL','Savills','Newmark','Avison Young','Colliers','Transwestern','Mohr Partners',
   'SRS Real Estate Partners','The Shopping Center Group','Sands Investment Group','RCS Real Estate Advisors',
   'Huntley Mullaney Spargo','Jackson Cross Partners'],
  'Tenant-representation brokerage serving multi-site retail and restaurant occupiers; it negotiates the lease '
  'clause that creates the audit right and can refer the recovery work without conflict.',
  'head of lease administration',
  'Large brokerages run their own lease-audit desks in some markets - qualify per office before pitching.'),
 ('partner','lease accounting and advisory firm',
  ['Withum','Baker Tilly','BDO USA','Grant Thornton','RSM US','CFGI','Embark','Citrin Cooperman',
   'CliftonLarsonAllen','Aprio','Restaurant Accounting Services','SolomonEdwards','Blue Sky Capital Strategies','Sevell Realty Partners'],
  'Accounting and advisory firm with a franchise or restaurant practice; its multi-unit clients receive CAM '
  'reconciliations the firm does not audit, making a contingency referral a clean add.',
  'partner, franchise practice',''),
 ('partner','franchisee association',
  ['Coalition of Franchisee Associations','National Franchisee Association',
   'Dunkin Donuts Independent Franchise Owners','North American Association of Subway Franchisees',
   'Dominos Franchisee Association','National Coalition of Associations of 7-Eleven Franchisees',
   'American Association of Franchisees and Dealers','International Franchise Association'],
  'Independent franchisee association whose members are 5-to-100-unit operators - the mid-size tenants most '
  'likely to have no in-house lease auditor and the least likely to appear on a Top 200 list.',
  'executive director',
  'Associations negotiate member benefit programmes; a vetted contingency CAM audit is a natural member benefit.'),
 ('partner','industry association',
  ['Association of Dental Support Organizations','Urgent Care Association','International Carwash Association',
   'Veterinary Management Groups'],
  'Trade association for one of the multi-site healthcare or service segments in the ICP; member operators all '
  'lease retail space and all receive landlord CAM reconciliations.','director of membership',''),
 ('partner','agency management system',
  ['Applied Systems','Vertafore','HawkSoft','EZLynx'],
  'Insurance agency management system holding the policy and commission-due data a carrier-statement '
  'reconciliation has to be matched against - the integration partner for the secondary Recoup variant.',
  'head of partnerships',
  'Some AMS vendors ship their own commission reconciliation; confirm before treating as a partner.'),
 ('partner','insurance agency network',
  ['SIAA','Smart Choice Agents Program','Renaissance Alliance','Keystone Insurers Group',
   'ISU Insurance Agency Network','The Iroquois Group',
   'Independent Insurance Agents and Brokers of America'],
  'Agency network or association aggregating hundreds of small independent agencies, each juggling 15+ carrier '
  'appointments and monthly commission statements nobody reconciles.','head of member services',
  'Network member counts not captured - the member directories were not opened in this pass.'),
 ('channel','trade publication',
  ['Franchise Times','Multi-Unit Franchisee','Restaurant Business','QSR Magazine','Nations Restaurant News',
   'Club Industry','Athletech News','Group Dentistry Now','Todays Veterinary Business','Convenience Store News',
   'CSP Daily News','Insurance Journal','Chain Store Age','Retail Dive','Journal of Urgent Care Medicine',
   'Professional Carwash and Detailing','Restaurant Finance Monitor','Franchise Update Media','Fast Casual','Franchise Business Review','1851 Franchise','Global Franchise'],
  'Trade publication read by the operators and the real-estate and finance staff inside them; the place a '
  'contingency CAM-audit offer reaches multi-unit tenants at scale.','advertising director',''),
 ('channel','conference',
  ['ICSC','Restaurant Leadership Conference','International Franchise Association'],
  'Industry event where multi-site tenants, their landlords and their brokers all attend; the fastest route to '
  'a room full of CAM payers.','sponsorship director',''),
 ('excluded','lease audit competitor',
  ['CAM Audit','Camaudit','Springbord','National Lease Advisors','Lease Audit Specialists','Hughes Marino','KBKG','Ryan LLC',
   'KBA Lease Services','Realogic','Commercial Tenant Services','Lease Audit Group',
   'Occupancy Cost Audit Group','Trinity Lease Audit','LeaseParse','LevelShift'],
  'Direct competitor: already sells tenant-side CAM / lease audit, typically on the same 25-50% contingency. '
  'Recorded so it is never re-discovered and mis-staged as a prospect.','n/a',
  'Do not contact as a prospect. Competitive-intelligence value only.'),
 ('excluded','commission reconciliation vendor',
  ['Core Commissions','AgencyBloc','Comulate','InsurStein','Flow Commission','My Commission IQ'],
  'Direct competitor to the secondary Recoup variant: already reconciles insurance carrier commission '
  'statements against agency records.','n/a','Do not contact as a prospect.'),
 ('excluded','pharmacy audit vendor',
  ['Pharmacy Audit Pro'],
  'Direct competitor to the PBM-remittance variant: sells software that catches PBM billing errors, DIR fees '
  'and clawbacks.','n/a','Do not contact as a prospect.'),
]
for ptype, seg, names, fit, role, note in PCE:
    for n in names:
        w, c = SITES.get(norm(n), ('',''))
        if not w: continue
        add(ptype, seg, n, '', '', fit, role, w, 'company-site', 'verified', note, website=w, contact=c)

# ---------------------------------------------------------------- hand-built partner / channel / excluded
MANUAL = json.load(open(os.path.join(RAW,'manual_rows.json'))) if os.path.exists(os.path.join(RAW,'manual_rows.json')) else []
for m in MANUAL:
    add(m['prospect_type'],m['segment'],m['name'],m.get('location',''),m.get('size_signal',''),
        m['fit_rationale'],m['decision_maker_role'],m['source_url'],m['source_type'],m['confidence'],
        m.get('notes',''),website=m.get('website'),contact=m.get('contact_route'))

CAVEAT = re.compile(r'^(aramark|sodexo|compass group|target corporation|love|circle k|travelcenters|army|delek|couche|casey)', re.I)
for r in rows:
    if r['segment'] == 'multi-unit restaurant franchisee' and CAVEAT.match(r['name']):
        note = ('Contract caterer, retailer or travel-centre operator franchising brands inside venues it '
                'already occupies - much of the estate is not third-party landlord space, so fit is lower.')
        if note not in r['notes']: r['notes'] = (r['notes'] + ' ' + note).strip()
for r in rows:
    for k, v in r.items():
        r[k] = re.sub(r'\s+', ' ', str(v).replace('\xa0', ' ')).strip()

out = os.path.join(BASE,'prospects.csv')
with open(out,'w',encoding='utf-8',newline='') as f:
    wtr = csv.DictWriter(f,fieldnames=COLS,quoting=csv.QUOTE_ALL)
    wtr.writeheader()
    for r in rows: wtr.writerow(r)
print('wrote', len(rows), 'rows to', out)
