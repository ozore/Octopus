#!/usr/bin/env python3
"""Build raw/curated.json: the hand-researched segments of the clausewright prospect list.

Run from the repository root with no arguments:
    python3 phase-3-acquisition/prospects/clausewright/scripts/build_curated.py

Inputs (all already captured under raw/):
  cand.tsv            slug, segment, name, candidate URL  - the hand-assembled shortlist
  cand_status.tsv     slug, HTTP code, final URL           - from `curl -L -w` over cand.tsv
  cand_contacts.json  slug -> contact page / partner page / generic mailbox / conflict hits
  agencies_aihello.json, agencies_cnm.json, hive*_comm.json - parsed directory captures
"""
import csv, json, os, re, sys
from urllib.parse import urlparse

BASE = os.path.join('phase-3-acquisition', 'prospects', 'clausewright')
RAW = os.path.join(BASE, 'raw')


def rd(fn):
    p = os.path.join(RAW, fn)
    if not os.path.exists(p):
        sys.exit('missing raw input: %s (run from repo root)' % p)
    return open(p, encoding='utf-8')


cand = []
for line in rd('cand.tsv'):
    parts = line.rstrip('\n').split('\t')
    if len(parts) == 4:
        cand.append({'slug': parts[0], 'segment': parts[1], 'name': parts[2], 'url': parts[3]})
status = {}
for line in rd('cand_status.tsv'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 3:
        status[p[0]] = (p[1], p[2])
contacts = json.load(rd('cand_contacts.json'))
aihello = json.load(rd('agencies_aihello.json'))
cnm = json.load(rd('agencies_cnm.json'))

SRC = {
    'ecommerce accounting & tax': ('https://ecombalance.com/amazon-accounting-services/', 'list-article'),
    'seller lending & cash flow': ('https://www.onrampfunds.com/guides/top-providers-of-ecommerce-funding-for-inventory-ads-and-growth', 'list-article'),
    'IP & trademark firm': ('https://www.compliancegate.com/amazon-seller-product-liability-insurance-providers/', 'list-article'),
    'product compliance lab': ('https://www.compliancegate.com/cpsc-approved-product-testing-labs/', 'list-article'),
    'insurance broker': ('https://www.compliancegate.com/amazon-seller-product-liability-insurance-providers/', 'list-article'),
    'cross-border seller services': ('https://www.supplyia.com/product-inspection-companies/', 'list-article'),
    'brand protection': ('https://www.redpoints.com/blog/remove-counterfeit-amazon/', 'list-article'),
    'FBA reimbursement & audit': ('https://jarvio.io/best-amazon-reimbursement-tools', 'list-article'),
    'marketplace agency': ('https://coolnerdsmarketing.com/top-amazon-marketing-agencies-us/', 'list-article'),
    'seller VA & outsourcing': ('https://vamasters.com/outsource-amazon-store-operations-philippines/', 'list-article'),
}
# IP firms were sourced from the search-result set below rather than compliancegate
SRC['IP & trademark firm'] = ('https://www.amazonsellers.attorney/amazon-trademark-lawyers.html', 'list-article')

FIT = {
    'ecommerce accounting & tax': 'Reconciles marketplace payouts monthly, so it is one of the first outsiders to see a deactivation - the disbursements simply stop - and it has nothing of its own to sell into that moment.',
    'seller lending & cash flow': 'Advances cash against marketplace receivables, so a deactivation is an immediate credit event on its own book; getting the seller reinstated protects its loan as well as the seller.',
    'IP & trademark firm': 'Meets the seller at the IP-complaint end of the funnel - counterfeit, trademark and patent notices are among the most common triggers for an account-level block - and can refer the policy-appeal work it does not do.',
    'product compliance lab': 'Issues the test reports Amazon demands at restricted-product, CPSIA and safety enforcement; sellers arrive at the lab already holding a compliance notice, which is the same document Clausewright reads.',
    'insurance broker': 'Amazon\'s $1M commercial liability requirement forces every seller past $10k/month through a broker, so the broker holds a list of exactly the sellers exposed to policy enforcement.',
    'cross-border seller services': 'Serves cross-border sellers shipping into FBA, the cohort most exposed to verification, address and document-based deactivations, and does its business in English with US-marketplace sellers.',
    'brand protection': 'Works the IP and unauthorised-seller side of the same enforcement machinery; its customers both send and receive the complaints that end in deactivations.',
    'FBA reimbursement & audit': 'Already runs a claims workflow against Amazon on the seller\'s behalf and is paid on recovery, so its customers trust it with account-level problems and it has a natural bundle.',
    'marketplace agency': 'Runs the seller\'s Amazon and Walmart account day to day, so it takes the panicked call the morning the account goes dark and aggregates dozens of suspension events a year across its book.',
    'seller VA & outsourcing': 'Staffs the Seller Central seat itself - its VAs open the case log and read the performance notifications - so it sees the deactivation before the brand owner does.',
}
ROLE = {
    'ecommerce accounting & tax': 'managing partner or head of client services',
    'seller lending & cash flow': 'head of partnerships',
    'IP & trademark firm': 'managing attorney or business development lead',
    'product compliance lab': 'business development manager, consumer products',
    'insurance broker': 'ecommerce programme manager',
    'cross-border seller services': 'head of partnerships',
    'brand protection': 'head of partnerships',
    'FBA reimbursement & audit': 'head of partnerships',
    'marketplace agency': 'agency owner or head of partnerships',
    'seller VA & outsourcing': 'head of partnerships',
}

# Conflicts found by reading the candidate's own homepage on 2026-09-03.
CONFLICT = {
    'cohenip': 'Lists "Amazon Suspension" as a practice area on its own site, so it sells the appeal work Clausewright sells.',
    'goatconsulting': 'Its own site says it "manages the appeals process when listings are suspended", i.e. it sells reinstatement work.',
    'amzadvisers': 'A testimonial on its own homepage states the agency handles "PPC, suspensions, case resolution", so appeal work is part of its service. Flagged for founder re-check before any outreach.',
}

HQ = {}
for a in aihello:
    HQ[re.sub(r'[^a-z0-9]', '', a['name'].lower())] = (a.get('hq', ''), a.get('employees', ''), a.get('founded', ''))
BEST = {}
for a in cnm:
    BEST[re.sub(r'[^a-z0-9]', '', a['name'].lower())] = a.get('best_for', '')

blocks = []
by_seg = {}
for c in cand:
    by_seg.setdefault(c['segment'], []).append(c)

for seg, items in by_seg.items():
    src, stype = SRC[seg]
    rows = []
    xrows = []
    for c in items:
        slug = c['slug']
        code, final = status.get(slug, ('', ''))
        v = contacts.get(slug, {})
        p = urlparse(final or c['url'])
        site = ('%s://%s/' % (p.scheme, p.netloc)) if p.netloc else ''
        live = code == '200'
        reachable = code not in ('', '000')
        contact = v.get('partner_page') or v.get('contact') or v.get('mail') or ''
        key = re.sub(r'[^a-z0-9]', '', c['name'].lower())
        hq, emp, founded = HQ.get(key, ('', '', ''))
        size = []
        if emp:
            size.append('%s employees (self-reported to the AiHello agency directory)' % emp)
        if founded:
            size.append('founded %s' % founded)
        notes = []
        if BEST.get(key):
            notes.append('Positioned for: %s.' % BEST[key])
        if not reachable:
            notes.append('WEBSITE UNCONFIRMED: %s did not respond on 2026-09-03, so the URL is left empty per BRIEF 2.4.' % c['url'])
        elif not live:
            notes.append('Own site responded HTTP %s on 2026-09-03 (bot filter or redirect), so the domain exists but the page could not be read.' % code)
        else:
            notes.append('Own site opened and read on 2026-09-03.')
        if slug in CONFLICT:
            xrows.append({'name': c['name'], 'website': site if reachable else '', 'location': hq,
                          'size_signal': '; '.join(size),
                          'fit': 'CONFLICT: sells Amazon suspension/appeal work itself, so it is a competitor and must not be approached as a partner.',
                          'contact': '', 'role': '', 'source_url': src, 'source_type': stype,
                          'confidence': 'verified' if live else 'secondary',
                          'notes': CONFLICT[slug] + ' ' + ' '.join(notes)})
            continue
        rows.append({'name': c['name'], 'website': site if reachable else '', 'location': hq,
                     'size_signal': '; '.join(size), 'contact': contact,
                     'confidence': 'verified' if live else 'secondary',
                     'notes': ' '.join(notes)})
    blocks.append({'prospect_type': 'partner', 'segment': seg, 'fit': FIT[seg], 'role': ROLE[seg],
                   'source_url': src, 'source_type': stype, 'rows': rows})
    if xrows:
        blocks.append({'prospect_type': 'excluded', 'segment': 'excluded - appeal/reinstatement service',
                       'fit': 'Competitor.', 'role': '', 'source_url': src, 'source_type': stype,
                       'rows': xrows})

# ---------------------------------------------------------------- hand-written blocks
HIVE = 'https://thehiveindex.com/topics/amazon-fba-seller/'
blocks.append({
    'prospect_type': 'channel', 'segment': 'professional network group',
    'fit': 'LinkedIn group of Amazon sellers and operators; a policy-explainer post reaches sellers who have not yet been suspended, and the platform permits organisation posting where Facebook groups often do not.',
    'role': 'group manager (via the group\'s own posting rules)',
    'source_url': HIVE, 'source_type': 'directory', 'confidence': 'secondary',
    'rows': [
        {'name': 'Amazon Sellers & FBA (LinkedIn group)', 'website': 'https://thehiveindex.com/communities/amazon-sellers-and-fba/',
         'size_signal': '55,000 members (Hive Index)',
         'notes': 'Landing page recorded is the Hive Index listing, not a member-facing URL; the group\'s own posting rules are UNVERIFIED. No member or admin names recorded.'},
        {'name': 'Amazon Sellers / FBA Seller (Advanced) (LinkedIn group)', 'website': 'https://thehiveindex.com/communities/amazon-sellers-fba-seller-advanced/',
         'size_signal': '33,000 members (Hive Index)',
         'notes': 'Advanced-seller LinkedIn group. Rules UNVERIFIED. No member or admin names recorded.'},
        {'name': 'Amazon PPC Marketing Expertise (LinkedIn group)', 'website': 'https://thehiveindex.com/communities/amazon-ppc-marketing-expertise/',
         'size_signal': '32,000 members (Hive Index)',
         'notes': 'PPC-led but the membership is Amazon sellers and agencies. Rules UNVERIFIED.'},
    ]})

blocks.append({
    'prospect_type': 'channel', 'segment': 'paid / private seller community',
    'fit': 'Paid or invite-only operator community whose members run multi-million-dollar Amazon accounts; per CRM.md 3.2 these are operator-channel-only - approach the community\'s operators about a partner or sponsor slot, never the members.',
    'role': 'community operator (sponsorship/partner enquiry)',
    'source_url': HIVE, 'source_type': 'directory', 'confidence': 'secondary',
    'rows': [
        {'name': 'Titan Network', 'website': 'https://thehiveindex.com/communities/titan-network/',
         'size_signal': '790 members (Hive Index); invite-only',
         'notes': 'Invite-only membership organisation for high-volume Amazon sellers; publishes legal/tax/shipping expert access as a member perk, which is the same adjacency Clausewright sells. Operator-channel-only posture.'},
        {'name': 'Catalyst88', 'website': 'https://thehiveindex.com/communities/catalyst88/',
         'size_signal': 'Chairman\'s Circle listed at $497/month (Hive Index)',
         'notes': 'Founder-and-operator room; paid, application-gated. Operator-channel-only posture.'},
        {'name': 'Private Label Masters - VIP (Skool)', 'website': 'https://thehiveindex.com/communities/private-label-masters-vip/',
         'size_signal': '1,000 members (Hive Index)',
         'notes': 'Skool community for private-label Amazon sellers. Founder\'s personal name deliberately not recorded (BRIEF 2.1). Rules UNVERIFIED.'},
        {'name': 'AMZ Prep Pro Slack Community', 'website': 'https://thehiveindex.com/communities/amz-prep/',
         'size_signal': '400 members (Hive Index)',
         'notes': 'Slack community operated by AMZ Prep, which is already a partner row in crm/partners.csv; recorded here as a distinct channel surface, not a second partner row.'},
        {'name': 'FBA Community', 'website': 'https://thehiveindex.com/communities/fulfillment-by-amazon/',
         'size_signal': '200,000 members (Hive Index)',
         'notes': 'Large independent FBA community listed by Hive Index. Platform and rules UNVERIFIED.'},
        {'name': 'Amazon FBA Warriors! [Sellers Group]', 'website': 'https://thehiveindex.com/communities/amazon-fba-warriors-sellers-group/',
         'size_signal': '8,000 members (Hive Index)',
         'notes': 'Operated by SellerApp. Facebook-hosted; facebook.com is blocked from this environment so rules are UNVERIFIED.'},
        {'name': "Let's Cook (Discord)", 'website': 'https://thehiveindex.com/communities/lets-cook/',
         'size_signal': '9,000 members (Hive Index)',
         'notes': 'US reselling Discord; arbitrage sellers here list on Amazon and are exposed to inauthentic/invoice-based deactivations. Rules UNVERIFIED.'},
        {'name': 'Amazon FBA Arbitrage (X community)', 'website': 'https://thehiveindex.com/communities/amazon-fba-arbitrage/',
         'size_signal': '736 members (Hive Index)',
         'notes': 'Small X/Twitter community. Rules UNVERIFIED.'},
        {'name': 'Amazon Sellers (X community)', 'website': 'https://thehiveindex.com/communities/amazon-sellers/',
         'size_signal': '729 members (Hive Index)',
         'notes': 'Small X/Twitter community. Rules UNVERIFIED.'},
        {'name': 'eCommTalk (Slack)', 'website': 'https://thehiveindex.com/topics/ecommerce/',
         'size_signal': '4,000 members (Hive Index)',
         'notes': 'General ecommerce operator Slack; marketplace sellers are a subset. Rules UNVERIFIED.'},
        {'name': 'Workspace6 (Slack)', 'website': 'https://thehiveindex.com/topics/ecommerce/',
         'size_signal': '650 members (Hive Index)',
         'notes': 'Paid ecommerce operator Slack. Rules UNVERIFIED.'},
        {'name': 'DTC Fam (Slack)', 'website': 'https://thehiveindex.com/topics/ecommerce/',
         'size_signal': 'member count not published by the directory',
         'notes': 'DTC operator Slack; marketplace-selling brands are a subset. Rules UNVERIFIED.'},
        {'name': 'Deal Soldier (Discord)', 'website': 'https://thehiveindex.com/topics/ecommerce/platform/discord/',
         'size_signal': '43,000 members (Hive Index)',
         'notes': 'Large reselling/sourcing Discord; its members sell on Amazon and hit inauthentic-claim deactivations. Rules UNVERIFIED.'},
        {'name': 'Resell Locker (Discord)', 'website': 'https://thehiveindex.com/topics/ecommerce/platform/discord/',
         'size_signal': '55,000 members (Hive Index)',
         'notes': 'Reselling Discord. Rules UNVERIFIED.'},
        {'name': 'Arbitrage Tactics (Discord)', 'website': 'https://thehiveindex.com/topics/ecommerce/platform/discord/',
         'size_signal': '123 members (Hive Index)',
         'notes': 'Small arbitrage Discord. Rules UNVERIFIED.'},
    ]})

blocks.append({
    'prospect_type': 'channel', 'segment': 'subreddit',
    'fit': 'Subreddit where suspended sellers post their deactivation notice verbatim; the highest-relevance surface in the landscape and the one where a wrong first post costs the channel permanently.',
    'role': 'subreddit moderators (via modmail, per the sub\'s own rules)',
    'source_url': 'https://thehiveindex.com/topics/amazon-fba-seller/', 'source_type': 'directory',
    'confidence': 'unverified',
    'rows': [
        {'name': 'r/AmazonFBATips', 'website': 'https://thehiveindex.com/communities/r-amazonfbatips/',
         'size_signal': '43,000 members (Hive Index)',
         'notes': 'REDDIT IS BLOCKED from this environment (BRIEF 2.7); the subreddit page was never opened and its self-promotion rules are UNVERIFIED. Row recorded from a secondary directory only.'},
        {'name': 'r/FBASourcing', 'website': '',
         'size_signal': 'described as low-subscriber, infrequent posts',
         'source_url': 'https://gotrellis.com/resources/blog/best-amazon-forums',
         'source_type': 'list-article',
         'notes': 'REDDIT IS BLOCKED; name and description taken from a secondary article. URL not confirmed, rules UNVERIFIED.'},
        {'name': 'r/AmazonFBA', 'website': '',
         'size_signal': 'size not stated in the source',
         'source_url': 'https://www.repricerexpress.com/amazon-fba-reddit/', 'source_type': 'list-article',
         'notes': 'REDDIT IS BLOCKED; recorded from a secondary article. URL not confirmed, rules UNVERIFIED. Distinct from r/FulfillmentByAmazon and r/AmazonSeller, which are already in crm/channels.csv.'},
        {'name': 'r/Ecommerce', 'website': '',
         'size_signal': 'size not stated in the source',
         'source_url': 'https://www.growreddit.com/best-subreddits-for-ecommerce', 'source_type': 'list-article',
         'notes': 'REDDIT IS BLOCKED; recorded from a secondary article. Broad ecommerce sub, marketplace sellers a subset. Rules UNVERIFIED.'},
        {'name': 'r/AmazonMerch', 'website': '',
         'size_signal': 'size not stated in the source',
         'source_url': 'https://www.growreddit.com/best-subreddits-for-ecommerce', 'source_type': 'list-article',
         'notes': 'REDDIT IS BLOCKED; Merch-on-Demand sellers face content-policy takedowns rather than account deactivations, so relevance is partial. Rules UNVERIFIED.'},
    ]})

blocks.append({
    'prospect_type': 'channel', 'segment': 'newsletter / news publication',
    'fit': 'Publishes marketplace policy and enforcement changes on a fixed cadence, so a reason-code explainer or a sponsored slot lands in front of sellers exactly when Amazon or Walmart tightens a policy.',
    'role': 'editor or sponsorship contact',
    'source_url': 'https://stackinfluence.com/blog/august-2026-ecommerce-news-and-updates-for-sellers',
    'source_type': 'list-article', 'confidence': 'secondary',
    'rows': [
        {'name': 'Stack Influence eCommerce News', 'website': 'https://stackinfluence.com/blog/',
         'notes': 'Weekly-updated ecommerce news covering Amazon, Shopify and TikTok Shop marketplace, fee, fulfilment and platform changes.'},
        {'name': 'Walmart Marketplace Newsletter', 'website': 'https://marketplace.walmart.com/',
         'source_url': 'https://marketplace.walmart.com/mp0226', 'source_type': 'company-site',
         'confidence': 'verified',
         'notes': 'Walmart\'s own monthly seller newsletter; a first-party surface, so treat as reputation-only - no promotion is possible, but it is the canonical source for Walmart policy changes to write against.'},
        {'name': 'ChannelX', 'website': 'https://channelx.world/',
         'source_url': 'https://bloggers.feedspot.com/amazon_seller_blogs/', 'source_type': 'directory',
         'notes': 'Marketplace trade publication (Domain Authority 59 per Feedspot), UK-based but covers Amazon US policy.'},
        {'name': 'EcommerceBytes', 'website': 'https://www.ecommercebytes.com/',
         'source_url': 'https://www.webretailer.com/amazon/', 'source_type': 'list-article',
         'notes': 'Long-running independent marketplace-seller news publication. URL not opened in this pass; confidence secondary.'},
        {'name': 'Practical Ecommerce', 'website': 'https://www.practicalecommerce.com/',
         'source_url': 'https://www.practicalecommerce.com/Sales-Tax-Nexus-Hits-FBA-Sellers', 'source_type': 'press',
         'notes': 'Ecommerce trade publication that covers FBA operations and marketplace policy.'},
        {'name': 'Modern Retail', 'website': 'https://www.modernretail.co/',
         'source_url': 'https://www.modernretail.co/operations/marketplace-briefing-amazons-seller-count-falls-as-revenue-concentrates-among-top-sellers/',
         'source_type': 'press',
         'notes': 'Runs a recurring Marketplace Briefing on Amazon seller economics; a reporter surface as well as a channel.'},
        {'name': 'Grow with Amazon (seller news site)', 'website': 'https://growithamazon.com/',
         'notes': 'Independent site tracking Seller Central policy changes and FBA news. Name is confusingly close to Amazon\'s own; verify independence before any partnership.'},
        {'name': 'Novadata Amazon Seller News', 'website': 'https://novadata.io/resources/news',
         'notes': 'Vendor-run seller news desk covering FBA updates.'},
        {'name': 'Ecom Ranker News', 'website': 'https://ecomranker.com/news/',
         'notes': 'Ecommerce and Amazon marketing news covering Seller Central updates.'},
        {'name': 'Closo Amazon Seller News', 'website': 'https://closo.co/blogs/optimization-growth-strategies/',
         'notes': 'Covers Amazon policy updates, FBA prep changes and reimbursement shifts.'},
    ]})

blocks.append({
    'prospect_type': 'channel', 'segment': 'independent seller forum',
    'fit': 'Threaded forum where a suspension question stays searchable for years, so a complete, cited answer keeps earning attention long after it is posted.',
    'role': 'forum operator (sponsorship/partner enquiry)',
    'source_url': 'https://gotrellis.com/resources/blog/best-amazon-forums', 'source_type': 'list-article',
    'confidence': 'secondary',
    'rows': [
        {'name': 'Walmart Marketplace Learn Forum categories', 'website': 'https://marketplacelearn.walmart.com/forum/',
         'source_url': 'https://www.geekseller.com/blog/walmart-marketplace-opens-official-seller-forum-and-launches-skills-certification-courses/',
         'source_type': 'press',
         'notes': 'The parent forum is already in crm/channels.csv; recorded here only because the per-category structure (Getting started, etc.) went live in 2026 and changes where a Walmart-suspension answer belongs. Vendor-operated: reputation-only posture.'},
        {'name': 'Warrior Forum ecommerce section', 'website': 'https://www.warriorforum.com/',
         'notes': 'General internet-business forum with an ecommerce section; relevance is partial and rules are UNVERIFIED.'},
        {'name': 'UK Business Forums - ecommerce', 'website': 'https://www.ukbusinessforums.co.uk/',
         'notes': 'UK-focused; relevant only to the Amazon UK cohort, which is out of v1 scope. Recorded so it is not rediscovered as new.'},
    ]})

blocks.append({
    'prospect_type': 'excluded', 'segment': 'excluded - appeal/reinstatement service',
    'fit': 'Sells Amazon or Walmart suspension appeals / reinstatement, i.e. a direct competitor. Never contact as a partner.',
    'role': '', 'source_url': 'https://www.webretailer.com/amazon/', 'source_type': 'directory',
    'confidence': 'secondary',
    'rows': [
        {'name': 'Get Unsuspended', 'website': '', 'source_url': 'https://www.webretailer.com/reviews/get-unsuspended/',
         'notes': 'Web Retailer directory entry: "an Amazon suspension appeal service for all suspension types". URL of the vendor\'s own site not published by the directory, so website left empty.'},
        {'name': 'Got Suspended', 'website': '', 'source_url': 'https://www.webretailer.com/reviews/got-suspended/',
         'notes': 'Web Retailer directory entry describing an Amazon/Walmart reinstatement agency.'},
        {'name': 'Ecom Seller Tools', 'website': '', 'source_url': 'https://www.webretailer.com/reviews/ecom-seller-tools/',
         'notes': 'Web Retailer entry: "a trusted leader for reinstating suspended Amazon accounts".'},
        {'name': 'eGrowth Partners', 'website': 'https://www.egrowthpartners.com/',
         'source_url': 'https://www.egrowthpartners.com/hightouchsmilesva/',
         'notes': 'Publishes account-suspension resolution as a service alongside its VA offering.'},
        {'name': 'AMZ Sellers Attorney (Rosenbaum & Segall PC)', 'website': 'https://www.amazonsellers.attorney/',
         'source_url': 'https://www.amazonsellers.attorney/amazon-plan-of-action.html',
         'notes': 'Attorney-supervised Amazon Plan of Action drafting - the same deliverable Clausewright sells. Note crm/partners.csv already excludes the closely related "Amazon Sellers Lawyer"; both are recorded because they present as separate brands.'},
        {'name': 'eComAttorneys - Rafelson Schick', 'website': '',
         'source_url': 'https://www.webretailer.com/reviews/ecomattorneys-rafelson-schick/',
         'notes': 'Web Retailer entry: legal support to ecommerce businesses including suspensions.'},
        {'name': 'Areto', 'website': 'https://aretoinc.com/',
         'source_url': 'https://aretoinc.com/amazon-suspension-appeal-reinstatement/',
         'notes': 'Publishes an "Amazon Suspension Appeal & Reinstatement" service page.'},
        {'name': 'Ecom Ranker Account Suspension Reinstatement', 'website': 'https://ecomranker.com/',
         'source_url': 'https://ecomranker.com/account-suspension-reinstatement/',
         'notes': 'Sells account suspension reinstatement. NOTE: its news desk is also listed as a channel row; the reinstatement arm is the conflict, so any content collaboration would need founder sign-off.'},
        {'name': 'Awajis', 'website': 'https://awajis.com/',
         'source_url': 'https://awajis.com/amazon-appeal-letter/',
         'notes': 'Publishes Amazon appeal-letter / Plan of Action services.'},
        {'name': 'Appeal Wizards', 'website': 'https://www.appealwizards.com/',
         'source_url': 'https://bloggers.feedspot.com/amazon_seller_blogs/',
         'notes': 'Appeal service with an Amazon-seller blog. Related to the "ReinstateIQ / Appeal Wizard" entry already excluded in crm/partners.csv; recorded separately because the domain and brand differ.'},
        {'name': 'eCommerce Fastlane suspension desk', 'website': 'https://ecommercefastlane.com/',
         'source_url': 'https://ecommercefastlane.com/amazon-seller-suspensions-stricter-ai-appeals/',
         'notes': 'Publishes appeal-and-win guidance commercially; classified conservatively as a conflict rather than a channel pending a founder read.'},
    ]})

out = os.path.join(RAW, 'curated.json')
with open(out, 'w', encoding='utf-8') as fh:
    json.dump(blocks, fh, indent=1)
print('wrote %s (%d blocks, %d rows)' % (out, len(blocks), sum(len(b['rows']) for b in blocks)))
