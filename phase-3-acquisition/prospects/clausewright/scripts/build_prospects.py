#!/usr/bin/env python3
"""Rebuild phase-3-acquisition/prospects/clausewright/prospects.csv from the raw
captures in .../clausewright/raw/.  Run from the repository root with no arguments:

    python3 phase-3-acquisition/prospects/clausewright/scripts/build_prospects.py

Every raw/*.json input was produced by curl + the parsers documented in sources.md.
No network access is performed here; the script is pure transformation so the CSV
can be regenerated and diffed.
"""
import csv, json, os, re, sys
from urllib.parse import urlparse

BASE = os.path.join('phase-3-acquisition', 'prospects', 'clausewright')
RAW = os.path.join(BASE, 'raw')
OUT = os.path.join(BASE, 'prospects.csv')
TODAY = '2026-09-03'
APP = 'clausewright'

COLS = ['app', 'prospect_type', 'segment', 'name', 'website', 'location', 'size_signal',
        'fit_rationale', 'contact_route', 'decision_maker_role', 'source_url', 'source_type',
        'confidence', 'collected_on', 'notes']


def load(fn):
    p = os.path.join(RAW, fn)
    if not os.path.exists(p):
        sys.exit('missing raw input: %s (run from repo root)' % p)
    with open(p, encoding='utf-8') as fh:
        return json.load(fh)


# ---------------------------------------------------------------- CRM exclusions
# Organisations already held in phase-3-acquisition/crm/partners.csv and channels.csv.
# BRIEF: do not re-list them.
CRM_PARTNERS = """LedgerGurus|EcomBalance|Xendoo|1-800Accountant|Fully Accountable|Seller CPA|
AMZ Accountant|Finaloop|My Amazon Guy|SalesDuo|Enso Brands|Junglr|eCommerce Nurse|Thrasio|SellerX|
Razor Group|SellerSonar|Helium 10|Helium10|AmzMonitor|SmartScout|BQool|Aura|Informed Repricer|Informed|
Seller Snap|SellerSnap|Seller Labs|Ad Badger|GETIDA|Getida|Refunds Manager|AMZ Prep|ShipBob|
Red Stag Fulfillment|InventoryLab|Marketplace Pulse|Seller Bites|Billion Dollar Seller Network|
Ad Badger Newsletter|The Full-Time FBA Show|Serious Sellers Podcast|eCommerce Momentum Podcast|
Seller Sessions|The PPC Den|eComFuel|eCommerceFuel""".replace('\n', '').split('|')

CRM_CHANNELS = """r/FulfillmentByAmazon|r/AmazonSeller|Amazon Seller Forums (official)|
Walmart Marketplace Seller Forum|ASGTG|My Silent Team|MySilentTeam|Sellers Ask Sellers|
Aspkin Forums - Amazon Suspensions|r/Flipping|eComFuel (formerly eCommerceFuel)|Extreme Commerce|
AMAZON Sellers & FBA Community|Helium 10 Members Group|Helium 10 Members|r/AmazonSellerCentral""".replace('\n', '').split('|')

# Competitors / conflicts. BRIEF: never a partner, always prospect_type=excluded.
CRM_EXCLUDED = """Avenue7Media|Avenue7Media®|Avenue 7 Media|Riverbend Consulting|SellerCandy|
The Appeal Guru|Amazon Sellers Lawyer|eCommerceChris|ecommerceChris|Seller Interactive|AppealDesk|
AppealDraft|AppealAI|PlatformAppeal|ReinstateIQ|Appeal Wizard|Mr. Jeff AMZ|AppealPilot|AppealsPro.AI|
ESQgo""".replace('\n', '').split('|')


def norm(s):
    s = (s or '').lower().strip()
    s = re.sub(r'[®™©]', '', s)
    s = re.sub(r'\b(inc|llc|ltd|limited|corp|co|the|group|blog|podcast)\b', ' ', s)
    s = re.sub(r'[^a-z0-9]+', '', s)
    return s


CRM_P = {norm(x) for x in CRM_PARTNERS if x.strip()}
CRM_C = {norm(x) for x in CRM_CHANNELS if x.strip()}
CRM_X = {norm(x) for x in CRM_EXCLUDED if x.strip()}


def in_crm(name):
    n = norm(name)
    return n in CRM_P or n in CRM_C or n in CRM_X


def same_host(a, b):
    ha = urlparse(a or '').netloc.lower().replace('www.', '')
    hb = urlparse(b or '').netloc.lower().replace('www.', '')
    return bool(ha) and ha == hb


def root(url):
    if not url:
        return ''
    p = urlparse(url)
    if not p.netloc:
        return ''
    return '%s://%s/' % (p.scheme, p.netloc)


# Third-party directory blurbs sometimes name a founder or owner. BRIEF 2.1 forbids storing the
# name of any private individual, so every note is passed through this scrubber before it is written.
ORG_TAIL = re.compile(r'\b(Index|State|Edge|Scout|Group|Media|Inc|LLC|Ltd|Technologies|Technology|'
                      r'Commerce|Labs?|Solutions|Brands|Consulting|Marketplace|Walmart|Amazon|Systems|'
                      r'Partners|Ventures|Digital|Software|Capital|Logistics|Fulfillment|Prep|Retail)\b')
PERSON_CREDIT = re.compile(r'\b(?:founded|co-founded|owned and operated|owned|operated|run|led|created|'
                           r'started|built)\s+(?:[a-z ]{0,24}\s)?by\s+([A-Z][\w\'-]+(?:\s+[A-Z][\w\'-]+){1,2})')


def scrub(text):
    """Remove personal names credited in third-party blurbs (BRIEF 2.1)."""
    if not text:
        return text

    def repl(m):
        who = m.group(1)
        if ORG_TAIL.search(who):
            return m.group(0)
        return m.group(0)[:m.start(1) - m.start(0)] + '[individual name withheld per BRIEF 2.1]'

    out = PERSON_CREDIT.sub(repl, text)
    # trailing "by <First> <Last>" with no verb in front
    def repl2(m):
        who = m.group(1)
        if ORG_TAIL.search(who):
            return m.group(0)
        return 'by [individual name withheld per BRIEF 2.1]'
    out = re.sub(r'\bby\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b', repl2, out)
    return out


ROWS = []
SEEN = set()


def add(prospect_type, segment, name, website='', location='', size_signal='', fit='',
        contact='', role='', source_url='', source_type='', confidence='secondary', notes=''):
    name = re.sub(r'\s+', ' ', (name or '')).strip()
    if not name or not source_url:
        return False
    key = (name.lower(), (website or '').lower().strip())
    if key in SEEN:
        return False
    SEEN.add(key)
    ROWS.append({'app': APP, 'prospect_type': prospect_type, 'segment': segment, 'name': name,
                 'website': website or '', 'location': location or '', 'size_signal': size_signal or '',
                 'fit_rationale': fit, 'contact_route': contact or '', 'decision_maker_role': role,
                 'source_url': source_url, 'source_type': source_type, 'confidence': confidence,
                 'collected_on': TODAY, 'notes': scrub(notes or '')})
    return True


# =============================================================== 1. Walmart approved solution providers
WM_CONFLICT = {'merkaglobal', 'sellcord', 'cedcommerce', 'fivestarcommerce', 'spctek', 'zonhack',
               'avenue-7-media', 'seller-interactive'}

WM_SEGMENT = [
    ('Accounting and Taxes', 'ecommerce accounting & tax'),
    ('Funding and Capital', 'seller lending & cash flow'),
    ('Disbursement Solutions', 'seller lending & cash flow'),
    ('Payments', 'seller lending & cash flow'),
    ('Agency', 'marketplace agency'),
    ('Full Service', 'marketplace agency'),
    ('Advertising', 'seller software - advertising'),
    ('Research & Analytics', 'seller software - analytics'),
    ('Shipping & Fulfillment', '3PL & fulfillment'),
    ('Returns', 'seller software - returns & reviews'),
    ('Reviews & Feedback', 'seller software - returns & reviews'),
    ('Photo Editing', 'seller software - content'),
    ('Connected Content', 'seller software - content'),
    ('Item Setup', 'seller software - listings & ops'),
    ('Inventory Management', 'seller software - listings & ops'),
    ('Order Management', 'seller software - listings & ops'),
    ('Pricing', 'seller software - listings & ops'),
    ('Technology Development', 'seller software - listings & ops'),
]

WM_FIT = {
    'ecommerce accounting & tax': 'Holds the seller\'s marketplace books, so it is told about a Walmart or Amazon deactivation the day payouts stop; an approved-provider relationship makes referral into a defense product natural.',
    'seller lending & cash flow': 'Underwrites against marketplace sales, so a deactivation is a live credit event for them; they have a direct commercial reason to get the seller reinstated fast.',
    'marketplace agency': 'Runs the seller\'s Walmart (and usually Amazon) account day to day, so it is the first party the seller calls when the account goes dark, and it aggregates many suspension events per year.',
    'seller software - advertising': 'Ad spend stops the moment the account is deactivated, so the vendor sees the event in its own dashboards and has an audience of account-health-anxious sellers.',
    'seller software - analytics': 'Its dashboards go blank at deactivation, giving it both an early signal and a content surface where a suspension-defense explainer fits naturally.',
    '3PL & fulfillment': 'Holds the seller\'s inventory; a deactivation strands stock in its warehouse, so reinstatement speed is its own operating problem as well as the seller\'s.',
    'seller software - returns & reviews': 'Sits on the exact metrics (returns, feedback, ODR) that trigger performance-based deactivations, so it meets the seller just before the notice arrives.',
    'seller software - content': 'Works on listings that get suppressed at policy enforcement, so it fields listing- and ASIN-level takedowns from the same customers.',
    'seller software - listings & ops': 'Integrated into the seller\'s Walmart account operations, so an account-level block breaks its own product; a bundled defense line item is a pricing change, not a new sales motion.',
    'other marketplace service': 'Approved by Walmart to serve marketplace sellers, so it holds a book of exactly the sellers who face Walmart and Amazon deactivations.',
}


DESC_RULES = [
    (r'\bfreight|customs|3pl|third[- ]party logistics|warehous|fulfillment cent|last[- ]mile|drayage|prep cent',
     '3PL & fulfillment'),
    (r'\bbookkeep|accounting (?:software|platform|firm|service)|reconcil\w*\s+(?:your|marketplace|payout)|'
     r'sales tax|vat compliance|vat filing|tax compliance', 'ecommerce accounting & tax'),
    (r'\bfunding|working capital|financing|cash advance|payout|lender|loan\b', 'seller lending & cash flow'),
    (r'\bagency|full[- ]service|managed service|account management|consultanc', 'marketplace agency'),
    (r'\badvertis|\bppc\b|sponsored (?:product|brand|display)|retail media', 'seller software - advertising'),
    (r'\banalytic|dashboard|business intelligence|market research|keyword research|profit(?:ability)? track',
     'seller software - analytics'),
    (r'\breview|feedback|returns? manage', 'seller software - returns & reviews'),
    (r'\bphoto|image|creative|copywrit|a\+ content|video', 'seller software - content'),
    (r'\binventory|listing|catalog|order management|repric|erp\b|integration|sync',
     'seller software - listings & ops'),
]


def wm_segment(cat, desc):
    cats = [c.strip() for c in (cat or '').split(',') if c.strip()]
    d = (desc or '').lower()
    if len(cats) == 1:
        # an "agency" that Walmart filed under a tool category is still an agency for our purposes
        if cats[0] not in ('Agency', 'Full Service') and re.search(r'\bagency\b|full[- ]service', d):
            return 'marketplace agency'
        for key, seg in WM_SEGMENT:
            if key == cats[0]:
                return seg
    if len(cats) > 1:
        # Walmart lists multi-function providers alphabetically, so the first category is not the
        # primary one. Classify multi-category providers from their own description instead.
        for rx, seg in DESC_RULES:
            if re.search(rx, d):
                return seg
        for key, seg in WM_SEGMENT:
            if key in (cat or ''):
                return seg
    for key, seg in WM_SEGMENT:
        if key and key in (cat or ''):
            return seg
    if 'agency' in d or 'full-service' in d or 'full service' in d:
        return 'marketplace agency'
    if 'accounting' in d or 'bookkeep' in d or 'tax' in d:
        return 'ecommerce accounting & tax'
    if 'funding' in d or 'capital' in d or 'financing' in d or 'loan' in d:
        return 'seller lending & cash flow'
    if 'fulfillment' in d or 'freight' in d or '3pl' in d or 'shipping' in d or 'logistic' in d:
        return '3PL & fulfillment'
    if 'advertis' in d or 'ppc' in d:
        return 'seller software - advertising'
    if 'analytic' in d or 'data' in d or 'research' in d:
        return 'seller software - analytics'
    if 'inventory' in d or 'listing' in d or 'order' in d or 'repric' in d or 'catalog' in d:
        return 'seller software - listings & ops'
    return 'other marketplace service'


wm = load('wm_providers.json')
vc = load('vend_contacts.json')
for o in wm:
    slug = o['slug']
    name = o['name'] or slug
    # Walmart's page titles occasionally carry a directory prefix/suffix rather than the brand name
    name = re.sub(r'^Walmart Marketplace Solution Provider\s*[-–]\s*', '', name)
    name = re.sub(r'\s*[-–]\s*Walmart Marketplace$', '', name).strip()
    v = vc.get(slug, {})
    site = root(v.get('final') or o['site']) or root(o['site'])
    live = v.get('code') == '200'
    contact = v.get('partner_page') or v.get('contact') or v.get('mail') or ''
    if not contact:
        # the provider's own Walmart-seller landing page, as published by Walmart's directory,
        # counts as a business contact route only when it is a contact/partner-shaped path
        lp = o['site'] or ''
        if re.search(r'/(contact|partner|partners|partnership|get-started|book-a|demo|request|quote|talk-to)', lp, re.I):
            contact = lp
    sp_url = o['sp_url']
    cat = o.get('category') or ''
    desc = (o.get('desc') or '').strip()
    svcs = ', '.join(o.get('services') or [])
    size = ('Walmart-approved solution provider; categories: %s' % cat) if cat else 'Walmart-approved solution provider'
    note_bits = ['Listed on Walmart Marketplace\'s own approved solution-provider directory.']
    if svcs:
        note_bits.append('Services listed by Walmart: ' + svcs[:220] + '.')
    if desc:
        note_bits.append('Walmart directory blurb: ' + desc[:260])
    if in_crm(name):
        continue  # already held in crm/partners.csv (as a partner or as one of its 16 exclusions)
    if slug in WM_CONFLICT:
        add('excluded', 'excluded - appeal/reinstatement service', name, site, '', size,
            'Sells account reinstatement / suspension appeals itself, so it is a competitor, not a partner.',
            '', '', sp_url, 'directory', 'verified' if live else 'secondary',
            'CONFLICT: appeal or reinstatement service found on its own site during the 2026-09-03 conflict scan. Never contact as a partner. ' + ' '.join(note_bits))
        continue
    seg = wm_segment(cat, desc + ' ' + svcs)
    add('partner', seg, name, site, '', size, WM_FIT[seg], contact,
        'head of partnerships', sp_url, 'directory',
        'verified' if live else 'secondary',
        ' '.join(note_bits) + ('' if live else ' Own site did not return HTTP 200 on 2026-09-03 (code %s); treat website as unconfirmed.' % (v.get('code') or 'no response')))

# =============================================================== 2. Amazon aggregators
agg = load('aggregators.json')
ac = load('agg_contacts.json')
for o in agg:
    name = o['name']
    if in_crm(name.split('(')[0].strip()):
        continue
    slug = re.sub(r'[^a-z0-9]+', '_', name.lower())[:40]
    c = ac.get(slug, {})
    live = c.get('code') == '200'
    final = c.get('final') or ''
    redirect_note = ''
    if final and not same_host(final, o['url']):
        # e.g. infinitecommerce.com -> razor-group.com, berlin-brands-group.com -> klarstein.com:
        # keep the listed domain and record the redirect rather than attributing another company's site
        redirect_note = ' Its listed domain redirected to %s on 2026-09-03, which usually means an acquisition or a rebrand - confirm who owns the book of accounts before any outreach.' % urlparse(final).netloc
        site = root(o['url'])
        contact = ''
    else:
        site = root(final or o['url'])
        contact = c.get('partner_page') or c.get('contact') or c.get('mail') or ''
    size = ('capital raised %s (Marketplace Pulse)' % o['capital']) if o.get('capital') else ''
    add('partner', 'amazon aggregator', name, site, o.get('hq', ''), size,
        'Owns and operates a portfolio of Amazon seller accounts, so a single deactivation halts a whole brand\'s revenue; suspension defense is an operating line item for them, not a one-off purchase.',
        contact, 'head of marketplace operations',
        'https://www.marketplacepulse.com/aggregators', 'directory',
        'verified' if live else 'secondary',
        'Marketplace Pulse lists it among the active Amazon aggregators. ' +
        ('Own domain returned HTTP 200 on 2026-09-03, so still operating.' if live
         else 'Own domain did NOT return HTTP 200 on 2026-09-03 (code %s) - operating status unconfirmed; several 2021-vintage aggregators have wound down.' % (c.get('code') or 'no response'))
        + redirect_note)

# =============================================================== 3. Prep centres (prepcentersearch.com)
pcs = load('prep_pcs.json')
pc = load('prep_contacts.json')
for o in pcs:
    name = (o.get('name') or '').strip()
    if not name or in_crm(name):
        continue
    slug = o.get('slug') or re.sub(r'[^a-z0-9]+', '_', name.lower())
    c = pc.get(slug, {})
    live = c.get('code') == '200'
    site = root(c.get('final') or o.get('website_url') or '')
    contact = c.get('contact') or c.get('mail') or ''
    loc = ', '.join([x for x in [o.get('location'), o.get('state')] if x]) or (o.get('state') or '')
    bits = []
    if o.get('warehouse_size_sqft'):
        bits.append('%s sq ft warehouse' % o['warehouse_size_sqft'])
    if o.get('monthly_capacity_units'):
        bits.append('%s units/month capacity' % o['monthly_capacity_units'])
    if o.get('services_offered'):
        bits.append('%d prep services listed' % len(o['services_offered']))
    size = '; '.join(bits)
    ch = ', '.join(o.get('channels_supported') or [])
    add('partner', 'prep centre / FBA 3PL', name, site, loc, size,
        'Physically holds FBA and WFS inventory for many small sellers at once, so a client deactivation strands stock in its warehouse; it hears about the suspension the same day and has nothing of its own to sell into that moment.',
        contact, 'owner or operations manager',
        'https://prepcentersearch.com/', 'directory',
        'verified' if live else 'secondary',
        ('Channels served: %s. ' % ch if ch else '') +
        (o.get('description') or '')[:200] +
        (' Own site returned HTTP 200 on 2026-09-03.' if live
         else ' Own site did not return HTTP 200 on 2026-09-03 (code %s); website unconfirmed.' % (c.get('code') or 'no response')) +
        (' Country per directory: %s.' % o['country'] if o.get('country') and o['country'] != 'United States' else ''))

# prep centres from selleressentials (adds a few with descriptions Walmart/PCS lack)
for o in load('prep_selleressentials.json'):
    name = re.sub(r'^Seller Essentials\s*[-–]\s*', '', o['name'] or '').strip()
    name = re.sub(r'\s+Logo$', '', name).strip()
    if not name or in_crm(name):
        continue
    site = root(o['url'])
    if not site:
        continue
    add('partner', 'prep centre / FBA 3PL', name, site, o.get('location', ''), '',
        'FBA/WFS prep centre serving many small third-party sellers; it holds their inventory and fields the panicked message when an account is deactivated.',
        '', 'owner or operations manager',
        'https://selleressentials.com/amazon-fba-prep-services/', 'directory', 'secondary',
        'Listed in the Seller Essentials prep-service directory. Directory blurb: ' + (o.get('desc') or '')[:220])

# prep centres from fbaprepfinder (name + metro only; the directory publishes no outbound links)
pcs_names = {norm(o.get('name')) for o in pcs}
for o in load('prep_fbaprepfinder.json'):
    name = o['name'].strip()
    if not name or norm(name) in pcs_names or in_crm(name):
        continue
    city = o.get('city', '').strip().strip(',')
    add('partner', 'prep centre / FBA 3PL', name, '', city, '',
        'FBA prep centre holding inventory for small sellers; a client deactivation strands that stock, so it learns about suspensions immediately.',
        '', 'owner or operations manager',
        'https://fbaprepfinder.com/best-fba-prep-centers/', 'directory', 'secondary',
        'Ranked %s in fbaprepfinder\'s editorially verified list (93 centres, ledger of 2,918 checks since 2026-05-13). '
        'WEBSITE UNCONFIRMED: this directory deliberately publishes no outbound links (it runs a matching model), so no URL could be opened for this row.' % o.get('rank', ''))

# =============================================================== 4. Curated segments researched by hand
def rows_from(table, prospect_type, segment, source_url, source_type, fit, role, confidence='secondary'):
    for r in table:
        add(prospect_type, segment, r[0], r[1], r[2], r[3], r.get('fit', fit) if isinstance(r, dict) else fit,
            r[4], role, r[5] if len(r) > 5 and r[5] else source_url, source_type,
            r[6] if len(r) > 6 and r[6] else confidence, r[7] if len(r) > 7 else '')


CURATED = json.load(open(os.path.join(RAW, 'curated.json'), encoding='utf-8'))
for block in CURATED:
    for r in block['rows']:
        add(block['prospect_type'], block['segment'], r.get('name'), r.get('website', ''),
            r.get('location', ''), r.get('size_signal', ''),
            r.get('fit') or block['fit'], r.get('contact', ''),
            r.get('role') or block['role'],
            r.get('source_url') or block['source_url'],
            r.get('source_type') or block['source_type'],
            r.get('confidence') or block.get('confidence', 'secondary'),
            r.get('notes', ''))

# =============================================================== 5. Channels: Facebook groups
NONENGLISH = re.compile(r'[\u0600-\u06FF\u4e00-\u9fff\u0400-\u04FF]|deutsch|italia|espa|francais|français|'
                        r'polska|türk|turkce|romania|magyar|nederland|brasil|portugu|venditori|handel|'
                        r'onlinehandel|abmahnung|wortfilter|arab|pakistan|bangladesh|india|hindi|urdu', re.I)
PERSONAL = re.compile(r'\bby [A-Z][a-z]+ [A-Z][a-z]+', re.I)


def members_int(s):
    m = re.search(r'([\d,]+)', s or '')
    return int(m.group(1).replace(',', '')) if m else 0


for o in load('fb_groups.json'):
    name = (o['name'] or '').strip()
    if not name:
        continue
    n = members_int(o['members'])
    suspension = o['best_for'] == 'Suspensions and account health'
    if not suspension and n < 10000:
        continue
    if NONENGLISH.search(name):
        continue
    # strip a trailing "by <Person>" credit rather than storing a person's name
    clean = PERSONAL.sub('', name).strip(' -|')
    if in_crm(clean) or in_crm(name):
        continue
    if any(tok in norm(name) for tok in ('asgtg', 'mysilentteam', 'silentteam',
                                         'helium10members', 'extremecommerce')):
        continue  # already in crm/channels.csv under a shorter name
    if re.match(r"^[A-Z][a-z]+'s\b", clean) or re.search(r"\b[A-Z][a-z]+'s\s+(Advanced|Amazon|FBA|Group)", clean):
        continue  # BRIEF 2.1: group named after a private individual
    add('channel', 'facebook group', clean, o['url'], '',
        '%s members (revenuegeeks snapshot)' % f'{n:,}' if n else '',
        'Facebook group where Amazon sellers post about %s; the deactivation notice itself is posted here within hours of arriving.'
        % ('suspensions and account health' if suspension else o['best_for'].lower()),
        '', 'group admin (via the group\'s own posting rules)',
        'https://revenuegeeks.com/research/amazon-seller-facebook-groups', 'list-article', 'secondary',
        'Best-for label from the source directory: %s. RULES UNVERIFIED - facebook.com is blocked from this environment (BRIEF 2.7), '
        'so the group\'s self-promotion rules were NOT read. Treat as reply-only, no link until a human reads the rules (CRM.md 3.2).'
        % o['best_for'])

# =============================================================== 6. Channels: podcasts
POD_EXCLUDE_PRODUCERS = {'chris mccabe'}  # eCommerceChris: already excluded in crm/partners.csv
# strips a trailing "with <Firstname> [<Lastname>]" host credit but not a company credit
HOST_CREDIT = re.compile(r"\s+with\s+[A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+[A-Z][a-z']+)?$")
CORPORATE = re.compile(r'\b(media|group|inc|llc|ltd|co|agency|labs?|network|commerce|brands?)\b', re.I)
for o in load('podcasts.json'):
    name = (o['name'] or '').strip()
    # BRIEF 2.1: keep the show name, drop any "with <host>" credit
    m = HOST_CREDIT.search(name)
    if m and not CORPORATE.search(m.group(0)):
        trimmed = name[:m.start()].strip()
        if len(trimmed) > 6:
            name = trimmed
    if not name or in_crm(name):
        continue
    net = (o.get('network') or '').strip()
    prod_conflict = net.lower() in POD_EXCLUDE_PRODUCERS or 'seller performance solutions' in name.lower()
    size_bits = []
    if o.get('reviews'):
        size_bits.append('%s Apple review%s' % (o['reviews'], '' if o['reviews'].strip() == '1' else 's'))
    if o.get('rating'):
        size_bits.append('rating %s' % o['rating'])
    if o.get('listeners'):
        size_bits.append('est. %s monthly listeners' % o['listeners'])
    # a "network" that is a person's name is dropped (BRIEF 2.1)
    net_note = ''
    if net and not re.match(r'^[A-Z][a-z]+ [A-Z]', net) and ' and ' not in net.lower() and '&' not in net:
        net_note = 'Producer/network: %s. ' % net
    if 'cabilly' in net.lower():
        net_note = ('Produced by an Amazon IP law firm (Cabilly & Co.), also carried as an IP-firm partner row. '
                    'Its site did not respond on 2026-09-03 so the appeal-service conflict check could NOT be run - '
                    'check before any collaboration. ')
    if prod_conflict:
        add('excluded', 'excluded - appeal/reinstatement service', name, o.get('website', ''), '',
            '; '.join(size_bits),
            'Show is produced by a suspension-appeal consultancy already excluded in crm/partners.csv, so it is a competitor surface, not a channel.',
            '', '', 'https://podcast.feedspot.com/amazon_seller_podcasts/', 'directory', 'secondary',
            'CONFLICT: producer sells appeal/reinstatement services. Host names deliberately not recorded (BRIEF 2.1).')
        continue
    add('channel', 'podcast', name, o.get('website', ''), '', '; '.join(size_bits),
        'Amazon/Walmart seller podcast: an interview or sponsored segment on "what to do in the first hour after a deactivation" reaches the exact buyer before the event.',
        o.get('website', ''), 'show producer or sponsorship contact',
        'https://podcast.feedspot.com/amazon_seller_podcasts/', 'directory', 'secondary',
        net_note + 'Host names and the directory\'s masked host mailboxes were deliberately not recorded (BRIEF 2.1). '
        + (('Apple listing: %s' % o['apple']) if o.get('apple') else ''))

# =============================================================== 7. Channels: blogs / publications
PERSONAL_BLOG = {'vova even'}
for o in load('blogs.json'):
    name = (o['name'] or '').strip()
    if not name or name.lower() in PERSONAL_BLOG:
        continue  # BRIEF 2.1: a blog published under a private individual's own name is not an organisation
    if name == 'Jump Scout':
        name = 'Jungle Scout Resources (blog)'
    if name == 'Amazon Sellers Atorney Blog':
        name = 'Amazon Sellers Attorney Blog'  # directory typo, corrected
    base = re.sub(r'\s*(Blog|»\s*Amazon)\s*$', '', name).strip()
    if in_crm(base) or in_crm(name):
        continue
    if norm(base) in CRM_X:
        continue
    conflict = norm(base) in CRM_X or base.lower() in ('appeal wizards', 'egrowth partners', 'amazon sellers atorney', 'amazon sellers attorney')
    size = ('Domain Authority %s' % o['da']) if o.get('da') else ''
    if conflict:
        add('excluded', 'excluded - appeal/reinstatement service', name, o.get('website', ''), '', size,
            'Publisher sells Amazon suspension appeals or reinstatement services, so its blog is a competitor surface.',
            '', '', 'https://bloggers.feedspot.com/amazon_seller_blogs/', 'directory', 'secondary',
            'CONFLICT flagged from the publisher\'s own positioning.')
        continue
    add('channel', 'blog / publication', name, o.get('website', ''), '', size,
        'Amazon-seller publication ranked by Feedspot; a co-produced reason-code explainer or guest post is the cheapest way to reach sellers before the suspension, and links to the Reason Code Index pages.',
        o.get('website', ''), 'editor or content lead',
        'https://bloggers.feedspot.com/amazon_seller_blogs/', 'directory', 'secondary',
        (o.get('desc') or '')[:220])

# =============================================================== 8. Channels: conferences and events
ev = load('events.json')
series = {}
for e in ev:
    nm = re.sub(r'\s*20\d\d\s*$', '', e['name']).strip()
    key = norm(nm)
    cur = series.get(key)
    if cur is None or (e.get('start_date') or '') > (cur.get('start_date') or ''):
        series[key] = dict(e, series_name=nm)
for e in sorted(series.values(), key=lambda x: x.get('start_date') or '', reverse=True):
    if (e.get('start_date') or '') < '2025-01-01':
        continue
    nm = e['series_name']
    if in_crm(nm):
        continue
    loc = ', '.join([x for x in [e.get('city'), e.get('countryName')] if x])
    add('channel', 'conference / trade show', nm, e.get('website') or '', loc,
        'most recent edition %s to %s' % (e.get('start_date'), e.get('end_date')),
        'Amazon/Walmart seller conference: the sponsor and speaker surface where account-health content reaches hundreds of sellers who have been suspended before or fear it.',
        e.get('website') or '', 'event organiser or sponsorship lead',
        'https://amzsummits.com/api/search?search=&page=N', 'api', 'secondary',
        'Pulled from the AMZSummits events JSON API (559 events). Dates are for the most recent edition listed; '
        'confirm the next edition on the organiser site before planning. Event type: %s.' % (e.get('type') or 'unknown'))

# =============================================================== write
with open(OUT, 'w', encoding='utf-8', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
    w.writeheader()
    for r in ROWS:
        w.writerow(r)

from collections import Counter
print('wrote %s rows -> %s' % (len(ROWS), OUT))
print(Counter(r['prospect_type'] for r in ROWS).most_common())
for seg, n in Counter((r['prospect_type'], r['segment']) for r in ROWS).most_common():
    print('  %-12s %-42s %d' % (seg[0], seg[1], n))
print(Counter(r['confidence'] for r in ROWS).most_common())
