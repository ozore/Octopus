# -*- coding: utf-8 -*-
"""Curated ScopeIQ prospect rows. Every source_url here was opened with curl during
collection on 2026-09-03 (cached under raw/). Fields:
(prospect_type, segment, name, website, location, size_signal, fit_rationale,
 contact_route, decision_maker_role, source_url, source_type, confidence, notes)
"""
R = []
def row(**k): R.append(k)

# ---------------------------------------------------------------- PLATFORMS / MSOs
row(prospect_type='end-customer', segment='med spa platform / MSO', name='LaserAway',
    website='https://www.laseraway.com/', location='Los Angeles, CA',
    size_signal='240 location pages across 37 states listed on its own locations page (2026-09-03)',
    fit_rationale='Largest injectables-and-laser chain operating in 37 states; every new state opening is a fresh scope-of-practice, supervision and CPOM question.',
    contact_route='https://www.laseraway.com/contact/', decision_maker_role='chief compliance officer',
    source_url='https://www.laseraway.com/locations/', source_type='company-site', confidence='verified',
    notes='States on own locations page: AK AL AZ CA CO CT DC FL GA HI ID IL IN KS KY MA MD MI MN MO NC NE NJ NM NV NY OH OK OR PA RI TN TX UT VA WA WI. PE-backed (Ares Management/Seidler per ctacquisitions.com 2026 report; Lightyear Capital per withorbital.com June 2026 snapshot - sources disagree, both recorded, neither verified with the company). Botox, fillers, laser hair removal, body contouring.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Milan Laser Hair Removal',
    website='https://milanlaser.com/', location='Omaha, NE',
    size_signal='"over 400+ locations in 38 states" stated on its own homepage (2026-09-03)',
    fit_rationale='Corporate-run 38-state chain; laser delegation and medical-director supervision rules differ in every one of those states.',
    contact_route='https://milanlaser.com/locations/contact', decision_maker_role='general counsel',
    source_url='https://milanlaser.com/', source_type='company-site', confidence='verified',
    notes='Laser hair removal only, NP-led under medical director supervision. Backed by Leonard Green & Partners (2019) plus Sixth Street and Wildcat (2023) per ctacquisitions.com 2026 report. Locations page is JS-rendered so per-state list could not be parsed.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='SkinSpirit',
    website='https://www.skinspirit.com/', location='Palo Alto, CA',
    size_signal='66 location pages across 22 states listed on its own locations page (2026-09-03)',
    fit_rationale='Injectable-led premium platform in 22 states; highest revenue per clinic in the category, so a mis-structured MSO is a large exposure.',
    contact_route='https://www.skinspirit.com/contact', decision_maker_role='general counsel',
    source_url='https://www.skinspirit.com/locations', source_type='company-site', confidence='verified',
    notes='States: AZ CA CO DC FL GA HI IL KS MD MN NC NJ NY OH OR TN TX UT VA WA WI. KKR Health Care Strategic Growth Fund II minority stake Oct 2022 (ctacquisitions.com); withorbital.com lists Imaginary Ventures + TPG. Botox and filler led.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Sono Bello',
    website='https://www.sonobello.com/', location='Kirkland, WA',
    size_signal='"over 100 locations nationwide" on its own locations page; 42 states named (2026-09-03)',
    fit_rationale='Physician-supervised body-contouring chain in 40+ states; surgical-adjacent delegation and CPOM structure is the core of its legal model.',
    contact_route='https://www.sonobello.com/locations/', decision_maker_role='general counsel',
    source_url='https://www.sonobello.com/locations/', source_type='company-site', confidence='verified',
    notes='States named on locations page: AL AR AZ CA CO CT DE FL GA IA ID IL IN KS KY LA MA MD ME MI MN MO MS NC NE NJ NM NV NY OH OK OR PA RI SC SD TN TX UT VA WA WI. Laser liposuction, body contouring.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='VIO Med Spa',
    website='https://www.viomedspa.com/', location='Nashville, TN',
    size_signal='84 location URLs across 21 states listed on its own locations page (2026-09-03)',
    fit_rationale='Fastest-growing franchised med spa brand; each franchisee opens in a new state and needs the ownership/supervision answer before signing a lease.',
    contact_route='https://www.viomedspa.com/contact-us/', decision_maker_role='VP of franchise operations',
    source_url='https://www.viomedspa.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AZ CA CT FL GA IL IN MA MD MI MO NC NJ NY OH PA TN TX UT VA WA. Freeman Spogli majority stake Sept 2024. Injectables, laser, body contouring, GLP-1 weight management.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Ever/Body',
    website='https://everbody.com/', location='New York, NY',
    size_signal='6 states named on its own locations page: CT DC MD NY TX WA (2026-09-03)',
    fit_rationale='Cosmetic dermatology chain expanding out of New York into DC/MD/TX/WA - exactly the multi-state launch decision ScopeIQ is sold against.',
    contact_route='https://everbody.com/locations', decision_maker_role='head of operations',
    source_url='https://everbody.com/locations', source_type='company-site', confidence='verified',
    notes='Careers link on its own site points to advanced-medaesthetic-partners ATS, confirming Ever/Body now sits inside Advanced MedAesthetic Partners (acquired 19 Dec 2025 per ctacquisitions.com 2026 report). Botox, lasers, facials.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Advanced MedAesthetic Partners (AMP)',
    website='https://www.weramp.com/', location='Dallas, TX',
    size_signal='"20+ Exceptional Brands, 77 Locations Nationwide, 21 States" stated on its own homepage (2026-09-03)',
    fit_rationale='A 21-state MSO rolling up med spas under 20+ brands; every tuck-in needs a state-specific CPOM/friendly-PC opinion before close.',
    contact_route='https://www.weramp.com/', decision_maker_role='head of corporate development',
    source_url='https://www.weramp.com/', source_type='company-site', confidence='verified',
    notes='Subsidiary of Leon Capital Group. Portfolio names surfaced in press/own site: Ever/Body, Blush Med, Curate MedAesthetics, The Skyn Bar, Back To 30, Avelure Med Spa, LivingYoung Center, Lift Aesthetics.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Alpha Aesthetics Partners',
    website='https://www.partnerwithalpha.com/', location='El Dorado Hills, CA',
    size_signal='16 numbered partner practices listed on its own site (partner 001 to 016), 2026-09-03',
    fit_rationale='Thurston Group-backed collective of independent med spas across multiple states; each new partner practice is a fresh state structure to validate.',
    contact_route='https://www.partnerwithalpha.com/', decision_maker_role='head of partnerships',
    source_url='https://www.partnerwithalpha.com/', source_type='company-site', confidence='verified',
    notes='Named partners on own site: Preva, LexRx, Prive, Mint + Needle, Flawless Medspa + Wellness, Inbloom Health + Medispa, Esthetics Center. Press (prnewswire via WebSearch) reports 35-37 locations in 12 states and a $93M January 2026 financing - labelled estimate, not confirmed on the company site.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Princeton Medspa Partners',
    website='https://princetonmedspapartners.com/', location='Princeton, NJ',
    size_signal='', fit_rationale='PE-backed acquirer of med spas, cosmetic dermatology and plastic surgery clinics nationwide; buys practices across state lines and must re-paper each one.',
    contact_route='https://princetonmedspapartners.com/', decision_maker_role='head of corporate development',
    source_url='https://princetonmedspapartners.com/', source_type='company-site', confidence='verified',
    notes='Own site describes acquisition/integration of 16 businesses across 60+ locations nationwide (stated in an executive bio, so treated as a labelled estimate not a company-level figure). Backed by Princeton Equity Group; BC Partners also named in trade press.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Empower Aesthetics',
    website='https://www.empower.spa/', location='Austin, TX',
    size_signal='"12 Partners, 20 Locations, 25+ Sister Companies in Healthcare" stated on its own site (2026-09-03)',
    fit_rationale='Shore Capital-backed national aesthetics platform building in TX, TN, the Midwest and upstate New York - four different CPOM regimes at once.',
    contact_route='https://www.empower.spa/partner-with-us', decision_maker_role='head of partnerships',
    source_url='https://www.empower.spa/', source_type='company-site', confidence='verified',
    notes='Generic business mailbox partners@empower.spa published on its own site.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='MedSpa Partners',
    website='https://medspapartners.com/', location='Toronto, ON (US clinics)',
    size_signal='', fit_rationale='Persistence Capital-backed acquirer of med spas and cosmetic dermatology clinics with a US expansion programme; cross-border entry raises the CPOM question hardest.',
    contact_route='info@medspapartners.com', decision_maker_role='head of corporate development',
    source_url='https://medspapartners.com/', source_type='company-site', confidence='verified',
    notes='Canadian-headquartered; US acquisitions reported in trade press (Faces of South Tampa 2024, Day Dermatology & Aesthetics 2026). Generic mailbox published on its own site.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='United Aesthetics Alliance',
    website='https://unitedaestheticsalliance.com/', location='',
    size_signal='', fit_rationale='Plastic surgery and med spa coalition acquiring non-surgical aesthetics practices across states; a partnership inquiry funnel implies a steady flow of new-state diligence.',
    contact_route='https://unitedaestheticsalliance.com/uaa-partnership-inquiry', decision_maker_role='head of partnerships',
    source_url='https://unitedaestheticsalliance.com/', source_type='company-site', confidence='verified',
    notes='Announced partnership with LivSkin MedSpa | Laser (Minneapolis) Feb 2026 per trade press.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='OrangeTwist',
    website='https://orangetwist.com/', location='Newport Beach, CA',
    size_signal='7 states named on its own locations page: CA CO NJ NV TX VA WA (2026-09-03)',
    fit_rationale='Seven-state med spa "treatment shop" chain expanding through acquisition; CA and NJ are two of the strictest CPOM states it already operates in.',
    contact_route='https://orangetwist.com/contact-us/', decision_maker_role='chief operating officer',
    source_url='https://orangetwist.com/locations/', source_type='company-site', confidence='verified',
    notes='Businesswire (Jan 2026) reports a strategic alliance with SBC Medical Group Holdings and expansion to 24 locations across 6 states - labelled press figure, own site listed 7 states on 2026-09-03.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='SEV Laser',
    website='https://sevlaser.com/', location='Los Angeles, CA',
    size_signal='16 states named on its own locations page (2026-09-03)',
    fit_rationale='Founder-run 16-state laser and injectables chain growing fast across the Sun Belt without a PE compliance function of its own.',
    contact_route='https://sevlaser.com/contact/', decision_maker_role='director of operations',
    source_url='https://sevlaser.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AZ CA FL GA IL MA MD MN NV NY OH PA TX UT VA WA. ~70 US sites per withorbital.com June 2026 snapshot (secondary).')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Elase Med Spa',
    website='https://elase.com/', location='Salt Lake City, UT',
    size_signal='8 states named on its own locations page: AZ FL ID IL NC SC TX UT (2026-09-03)',
    fit_rationale='Eight-state med spa group with a partnership page, i.e. actively acquiring into new states.',
    contact_route='https://elase.com/partnership/', decision_maker_role='chief operating officer',
    source_url='https://elase.com/locations/', source_type='company-site', confidence='verified',
    notes='Injectables, laser hair removal, skin. Partnership/acquisition page published on its own site.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Skin Laundry',
    website='https://skinlaundry.com/', location='Los Angeles, CA',
    size_signal='', fit_rationale='Laser facial chain operating in several US states plus international; a standardised laser protocol run by non-physicians is the classic delegation question.',
    contact_route='https://skinlaundry.com/', decision_maker_role='head of operations',
    source_url='https://skinlaundry.com/', source_type='company-site', confidence='verified',
    notes='Locations page is JS-rendered (no states parsed). withorbital.com June 2026 snapshot lists ~71 locations (secondary, not confirmed on own site).')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Kalologie',
    website='https://www.kalologie.com/', location='Las Vegas, NV',
    size_signal='16 states named on its own locations page (2026-09-03)',
    fit_rationale='Multi-state med spa and skincare chain (franchised); the franchisor carries the compliance answer for every franchisee state.',
    contact_route='https://www.kalologie.com/contact-kalologie', decision_maker_role='franchise operations lead',
    source_url='https://www.kalologie.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AZ CA CO CT FL GA IL LA MD MI NV NY OH PA TX VA. ~34 locations per withorbital.com (secondary).')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='AYA Medical Spa',
    website='https://ayamedicalspa.com/', location='Atlanta, GA',
    size_signal='', fit_rationale='Multi-location Atlanta med spa group named in trade press as an active platform sponsor; Georgia CPOM and injector delegation rules are unsettled.',
    contact_route='https://ayamedicalspa.com/pages/contact-us', decision_maker_role='owner-operator',
    source_url='https://ayamedicalspa.com/', source_type='company-site', confidence='verified',
    notes='Named as an active platform in AmSpa/CT Acquisitions 2026 M&A commentary.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Sona MedSpa',
    website='https://www.sonamedspa.com/', location='',
    size_signal='', fit_rationale='Multi-location med spa brand offering laser and injectable services under a shared brand across states.',
    contact_route='https://www.sonamedspa.com/contact/', decision_maker_role='owner-operator',
    source_url='https://www.sonamedspa.com/', source_type='company-site', confidence='verified',
    notes='Historic franchise brand; current footprint not stated on the homepage.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Alchemy 43',
    website='https://alchemy43.com/', location='Los Angeles, CA',
    size_signal='', fit_rationale='Injectable-only "aesthetics bar" chain in CA and TX; a menu built entirely on neurotoxin and filler makes injector scope the whole business model.',
    contact_route='https://alchemy43.com/contact/', decision_maker_role='head of operations',
    source_url='https://alchemy43.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Skin Clique',
    website='https://www.skinclique.com/', location='Charleston, SC',
    size_signal='"763 board-certified providers, 40 states with in-person providers, 50 states skincare & wellness" on its own locations page (2026-09-03)',
    fit_rationale='In-home/mobile aesthetics across 40 states - the single hardest multi-state supervision and delegation problem in the category.',
    contact_route='https://www.skinclique.com/partners', decision_maker_role='chief compliance officer',
    source_url='https://www.skinclique.com/locations', source_type='company-site', confidence='verified',
    notes='Botox, fillers, skincare, GLP-1 weight loss quiz on site. Also runs a partners programme (could be a channel into its provider network).')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Radiance Holdings',
    website='https://radianceholdings.com/', location='Lakewood, CO',
    size_signal='', fit_rationale='Multi-brand franchisor holding company in the beauty/wellness space; adding medical aesthetic services to a franchised footprint triggers 50-state scope questions.',
    contact_route='https://radianceholdings.com/contact', decision_maker_role='general counsel',
    source_url='https://radianceholdings.com/', source_type='company-site', confidence='verified',
    notes='Parent of Sola Salons and Woodhouse Spa; medical-aesthetic overlap is partial, so fit is indirect. info@radianceholdings.com published on its own site.')

row(prospect_type='end-customer', segment='med spa platform / MSO', name='Sculpt MD',
    website='https://www.sculptmd.com/', location='',
    size_signal='', fit_rationale='Body-contouring and aesthetics brand operating multiple clinics under physician supervision.',
    contact_route='https://www.sculptmd.com/', decision_maker_role='owner-operator',
    source_url='https://www.sculptmd.com/', source_type='company-site', confidence='secondary',
    notes='Homepage returned very little parseable content; footprint unconfirmed.')

# ---------------------------------------------------------------- FRANCHISORS
row(prospect_type='end-customer', segment='aesthetic franchise system', name='4Ever Young Anti-Aging Solutions',
    website='https://4everyoungantiaging.com/', location='Boca Raton, FL',
    size_signal='18 states named on its own locations page (2026-09-03); 74+ locations per BeautyMatter, Mar 2026',
    fit_rationale='Franchised anti-aging clinics selling aesthetics, hormone optimisation, IV nutrition and weight loss - four separately regulated service lines per state.',
    contact_route='https://4everyoungantiaging.com/contact-us/', decision_maker_role='VP of franchise development',
    source_url='https://4everyoungantiaging.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AZ CO FL GA IA IL IN KS NC NE NJ OH OR PA SC TX UT VA. Procedures: injectables, hormone therapy, IV nutrition, medical weight loss.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='dermani MEDSPA',
    website='https://dermanimedspa.com/', location='Atlanta, GA',
    size_signal='30+ locations per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Membership-model med spa franchise that explicitly helps franchisees establish physician partnerships - a medical-director requirement that differs by state.',
    contact_route='https://dermanimedspa.com/', decision_maker_role='VP of franchise development',
    source_url='https://beautymatter.com/articles/top-medspa-franchises', source_type='list-article', confidence='secondary',
    notes='Own homepage returned only a redirect stub to curl; franchise data taken from the BeautyMatter article. Injectables, professional skin treatments, laser hair removal.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='GLO30',
    website='https://glo30.com/', location='Philadelphia, PA',
    size_signal='30+ locations, 100+ in development per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Subscription facial franchise crossing from day-spa into clinical services; the line between esthetician scope and medical treatment is drawn differently in every state.',
    contact_route='https://glo30.com/contact-us/', decision_maker_role='VP of franchise development',
    source_url='https://glo30.com/', source_type='company-site', confidence='verified',
    notes='Franchised through Fransmart. Monthly membership facial model.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Serotonin Centers',
    website='https://serotonincenters.com/', location='Jupiter, FL',
    size_signal='16+ locations per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Longevity franchise selling hormone replacement, medical weight loss, Botox and fillers, IV drips and body contouring - the widest regulated menu in franchising.',
    contact_route='https://serotonincenters.com/franchising/', decision_maker_role='VP of franchise development',
    source_url='https://serotonincenters.com/', source_type='company-site', confidence='verified',
    notes='Procedures: HRT, medical weight loss, Botox, fillers, body contouring, IV drip therapy, red light, hyperbaric oxygen.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Face to Face Spa',
    website='https://facetofacespa.com/', location='Austin, TX',
    size_signal='41+ locations per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Membership skin-health franchise that added Botox, fillers and semaglutide weight loss - a medical menu bolted onto an esthetician-staffed footprint.',
    contact_route='https://facetofacespa.com/contact-us/', decision_maker_role='VP of franchise development',
    source_url='https://facetofacespa.com/', source_type='company-site', confidence='verified',
    notes='Procedures: medical-grade facials, chemical peels, HydraFacial, Botox, fillers, semaglutide (GLP-1) weight loss.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='FACE FOUNDRIE',
    website='https://facefoundrie.com/', location='Minneapolis, MN',
    size_signal='"80+ locations and over 1 million services performed" stated on its own homepage (2026-09-03)',
    fit_rationale='80+ unit facial-bar franchise expanding its clinical menu; every added medical service crosses an esthetician scope line that varies state by state.',
    contact_route='https://facefoundrie.com/corporate-partnerships-and-events/', decision_maker_role='VP of franchise development',
    source_url='https://facefoundrie.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Radiance Medspa',
    website='https://www.radiancemedspa.com/', location='Belleair Bluffs, FL',
    size_signal='30 franchise units per topfranchise.com med spa franchise ranking (updated Apr 2026)',
    fit_rationale='Long-running med spa franchise brand whose franchisees are exactly the single-unit owners who buy a state launch report.',
    contact_route='https://www.radiancemedspa.com/contact/', decision_maker_role='franchise owner',
    source_url='https://www.radiancemedspa.com/', source_type='company-site', confidence='verified',
    notes='URL opened resolves to the Belleair Bluffs, FL location site; franchise-unit count is from topfranchise.com (secondary) and is dated.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Facial Mania Med Spa',
    website='', location='Tampa, FL',
    size_signal='11+ locations per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Tiered med spa franchise offering injectables and laser under medical oversight while franchisees run operations - the split ScopeIQ has to document.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://beautymatter.com/articles/top-medspa-franchises', source_type='list-article', confidence='secondary',
    notes='Website not confirmed: facialmania.com and facialmaniamedspa.com both failed to load from this environment, so website is left empty per the no-fabrication rule.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='C3 Wellness Spa',
    website='', location='Florida',
    size_signal='',
    fit_rationale='Franchise blending cosmetic injectables, IV infusion and body contouring with acupuncture and massage; mixing licensed and unlicensed modalities under one roof is a per-state scope problem.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://beautymatter.com/articles/top-medspa-franchises', source_type='list-article', confidence='secondary',
    notes='c3wellnessspa.com did not resolve from this environment; website left empty. Accepts medical insurance and VA benefits for some services per the source article.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Alexis Lauren',
    website='', location='Miami, FL',
    size_signal='2 corporate locations, average unit volume $1.89M per BeautyMatter franchise roundup, Mar 2026',
    fit_rationale='Luxury med spa franchise actively recruiting operators in Texas (Austin, Dallas) - a named new-state entry decision.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://beautymatter.com/articles/top-medspa-franchises', source_type='list-article', confidence='secondary',
    notes='alexislauren.com returned 403 and alexislaurenmedspa.com did not resolve; website left empty. Procedures: injectables, facials, laser, microneedling, PRP.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Skinovatio Medical Spa',
    website='', location='',
    size_signal='',
    fit_rationale='Med spa franchise selling Botox, laser, facials, peels, hair restoration and weight-loss care - a full medical menu run by franchisees.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://1851franchise.com/top-beauty-spa-franchise-2730879', source_type='list-article', confidence='secondary',
    notes='Listed in the 1851 Franchise beauty/spa roundup; brand site not opened, so website and location left empty.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Bodenvy',
    website='https://bodenvy.com/', location='Orlando, FL',
    size_signal='',
    fit_rationale='Body contouring and medical weight-loss franchise; CoolSculpting-class devices and GLP-1 prescribing both need a supervising physician per state.',
    contact_route='https://bodenvy.com/', decision_maker_role='franchise operations lead',
    source_url='https://bodenvy.com/', source_type='company-site', confidence='verified',
    notes='Procedures named on site: fat loss, skin tightening, body sculpting, weight loss.')

row(prospect_type='end-customer', segment='aesthetic franchise system', name='Ideal Image',
    website='', location='Tampa, FL',
    size_signal='~165 US sites per withorbital.com June 2026 aesthetic-chain snapshot',
    fit_rationale='One of the largest multi-state aesthetic chains (laser hair removal, CoolSculpting, injectables); reorganised in 2024 and rebuilding its state footprint.',
    contact_route='', decision_maker_role='general counsel',
    source_url='https://www.withorbital.com/data/largest-aesthetic-clinic-chains-in-the-us/', source_type='list-article', confidence='secondary',
    notes='idealimage.com did not resolve from this environment on two attempts, so website is left empty. PE-backed, formerly L Catterton-controlled; Chapter 11 filing and reorganisation in 2024 per the source.')

# ---------------------------------------------------------------- IV / WELLNESS CHAINS
row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Restore Hyper Wellness',
    website='https://www.restore.com/', location='Austin, TX',
    size_signal='"210+ studios nationwide" and "Clinical Oversight at 220+ Studios" on its own homepage (2026-09-03)',
    fit_rationale='220+ franchised studios with a nurse practitioner in every studio delivering IV drips, IM shots and peptides - NP scope and supervision rules differ in all 50 states.',
    contact_route='https://www.restore.com/contact-us', decision_maker_role='chief compliance officer',
    source_url='https://www.restore.com/', source_type='company-site', confidence='verified',
    notes='Procedures: IV drip therapy, IM shots, peptides, cryotherapy, red light, aesthetics at some studios.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Prime IV Hydration & Wellness',
    website='https://primeivhydration.com/', location='Draper, UT',
    size_signal='39 states named on its own locations page (2026-09-03)',
    fit_rationale='Largest IV therapy franchise; IV infusion is a delegated medical act with a different supervision rule in each of the 39 states it lists.',
    contact_route='https://primeivhydration.com/locations/', decision_maker_role='VP of franchise operations',
    source_url='https://primeivhydration.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AL AR AZ CA CO CT FL GA HI IA ID IL IN KS KY MA MD MI MN MO NC ND NE NH NJ NM NV OH OK OR PA RI SC SD TX UT VA WA WI. 215+ open locations reported in franchise press.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='THE DRIPBaR',
    website='https://thedripbar.com/', location='Nashville, TN',
    size_signal='600+ locations in development per franchise press (fransmart.com IV franchise roundup)',
    fit_rationale='IV therapy franchise scaling fast into new states; each franchisee needs a medical director and a state-legal ownership structure before opening.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://fransmart.com/best-iv-therapy-franchise/', source_type='list-article', confidence='secondary',
    notes='thedripbar.com returned HTTP 202 (bot interstitial) on two attempts, so the site itself was not read. 2024 partnership with REVIV per the source.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Liquivida',
    website='https://liquivida.com/', location='Fort Lauderdale, FL',
    size_signal='4 states named on its own locations page: AZ CT FL NJ (2026-09-03); 18+ locations per BeautyMatter',
    fit_rationale='IV wellness franchise that added aesthetics, hormone optimisation and medical weight loss - a multi-licence menu across four states.',
    contact_route='https://www.liquivida.com/franchise-business-opportunity/providers', decision_maker_role='VP of franchise development',
    source_url='https://liquivida.com/locations/', source_type='company-site', confidence='verified',
    notes='Procedures: IV therapy, aesthetics, hormone optimisation, medical weight loss.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='iCRYO',
    website='https://icryo.com/', location='League City, TX',
    size_signal='18 states named on its own locations page (2026-09-03); ~50 locations per withorbital.com',
    fit_rationale='Franchised cryotherapy and IV drip studios in 18 states; IV and injection services sit on the medical side of the line in most of them.',
    contact_route='https://icryo.com/', decision_maker_role='VP of franchise operations',
    source_url='https://icryo.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AZ CO CT FL GA IL IN KS MD MI NC NV NY OH SC TX UT VA.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Hydralive Therapy',
    website='https://hydralivetherapy.com/', location='Birmingham, AL',
    size_signal='', fit_rationale='IV therapy, hormone and vitality clinic group franchising across the Southeast; hormone prescribing multiplies the per-state supervision questions.',
    contact_route='https://hydralivetherapy.com/', decision_maker_role='franchise operations lead',
    source_url='https://hydralivetherapy.com/', source_type='company-site', confidence='verified',
    notes='Locations page 404d; state footprint not confirmed.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='REVIV',
    website='https://www.revivme.com/', location='',
    size_signal='', fit_rationale='Global IV drip and injection franchise with US clinics; every US franchise unit needs a state-specific medical direction structure.',
    contact_route='https://www.revivme.com/booking-process/location/', decision_maker_role='VP of franchise operations',
    source_url='https://www.revivme.com/', source_type='company-site', confidence='verified',
    notes='Procedures: IV drip therapy, IV vitamin infusions, injections.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='IV Nutrition',
    website='https://www.ivnutrition.com/', location='',
    size_signal='38 total US locations, 31 franchised, per franzy.com franchise profile (via WebSearch)',
    fit_rationale='Franchised IV nutrition therapy clinics; the franchisor sets the clinical protocol that each state then judges.',
    contact_route='https://www.ivnutrition.com/contact-iv-nutrition-now/', decision_maker_role='VP of franchise operations',
    source_url='https://www.ivnutrition.com/', source_type='company-site', confidence='verified',
    notes='Unit count is a secondary figure from a franchise-data site, not confirmed on the company site.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Onus IV Therapy',
    website='https://onusiv.com/', location='Denver, CO',
    size_signal='',
    fit_rationale='IV therapy plus bioidentical hormone replacement and NAD+, franchising nationwide from Colorado - hormone prescribing is the sharpest scope question in the category.',
    contact_route='https://onusiv.com/contact-us', decision_maker_role='VP of franchise development',
    source_url='https://onusiv.com/', source_type='company-site', confidence='verified',
    notes='Procedures: IV therapy, BHRT, NAD+, in-clinic lab testing. Franchising through Fransmart.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='LIVE Hydration Spa',
    website='https://livehydrationspa.com/', location='',
    size_signal='',
    fit_rationale='IV hydration franchise selling territories nationally; franchisees are first-time medical-service operators who need the state answer.',
    contact_route='https://livehydrationspa.com/franchise-opportunities/', decision_maker_role='VP of franchise development',
    source_url='https://livehydrationspa.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Pause Studio',
    website='https://pausestudio.com/', location='',
    size_signal='',
    fit_rationale='Recovery and wellness studio chain offering IV drips and injections alongside non-medical recovery services.',
    contact_route='https://pausestudio.com/contact', decision_maker_role='head of operations',
    source_url='https://pausestudio.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Hydreight',
    website='https://hydreight.com/', location='Las Vegas, NV',
    size_signal='',
    fit_rationale='Mobile IV and wellness platform operating a nurse network across states - the most exposed possible model to per-state delegation and telehealth rules.',
    contact_route='http://hydreight.com/partnerportal', decision_maker_role='chief compliance officer',
    source_url='https://hydreight.com/', source_type='company-site', confidence='verified',
    notes='Generic mailbox service@hydreight.com published on its own site. Could equally be a partner (it supplies the compliance layer to independent nurses).')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Hydrate IV Bar',
    website='', location='Denver, CO',
    size_signal='8 franchised and 4 company-owned units per franchise press (via WebSearch)',
    fit_rationale='Emerging IV bar franchise expanding out of Colorado; new-state entry is the trigger event for a launch compliance report.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://1851franchise.com/the-15-hottest-health-and-wellness-franchises-of-2026-2732680', source_type='list-article', confidence='secondary',
    notes='hydrateivbar.com returned HTTP 202 on two attempts; website left empty.')

row(prospect_type='end-customer', segment='IV therapy / wellness chain', name='Vida-Flo',
    website='', location='Atlanta, GA',
    size_signal='',
    fit_rationale='IV hydration franchise named among the leading US IV therapy systems; multi-state franchisee base.',
    contact_route='', decision_maker_role='VP of franchise development',
    source_url='https://fransmart.com/best-iv-therapy-franchise/', source_type='list-article', confidence='secondary',
    notes='vida-flo.com did not return a readable page from this environment; website left empty.')

# ---------------------------------------------------------------- GLP-1 / WEIGHT LOSS
row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Medi-Weightloss',
    website='https://mediweightloss.com/', location='Tampa, FL',
    size_signal='33 states named on its own locations page (2026-09-03)',
    fit_rationale='Physician-supervised weight-loss clinic franchise in 33 states; GLP-1 prescribing, compounding sourcing and NP supervision are all state-variable.',
    contact_route='https://mediweightloss.com/locations/', decision_maker_role='VP of franchise operations',
    source_url='https://mediweightloss.com/locations/', source_type='company-site', confidence='verified',
    notes='States: AL AZ CA CT DE FL GA IA ID IL IN KY LA MA ME MI MO NC NH NJ NV NY OH OK OR PA RI SC TN TX VA WA WI.')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Options Medical Weight Loss',
    website='https://optionsmedicalweightloss.com/', location='Chicago, IL',
    size_signal='',
    fit_rationale='Multi-state medical weight-loss clinic group prescribing GLP-1s; each new clinic state changes who may prescribe and under what supervision.',
    contact_route='https://optionsmedicalweightloss.com/contact/', decision_maker_role='director of clinical operations',
    source_url='https://optionsmedicalweightloss.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Red Mountain Weight Loss',
    website='https://redmountainweightloss.com/', location='Phoenix, AZ',
    size_signal='',
    fit_rationale='Multi-clinic medical weight-loss group; Arizona-based operators expanding into CA/TX hit two of the strictest CPOM regimes.',
    contact_route='https://redmountainweightloss.com/', decision_maker_role='director of clinical operations',
    source_url='https://redmountainweightloss.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Form Health',
    website='https://www.formhealth.co/', location='Boston, MA',
    size_signal='',
    fit_rationale='Multi-state virtual obesity-medicine clinic; telehealth prescribing of GLP-1s is licensed and supervised state by state.',
    contact_route='https://www.formhealth.co/contact-us', decision_maker_role='head of regulatory affairs',
    source_url='https://www.formhealth.co/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Calibrate',
    website='https://www.joincalibrate.com/', location='New York, NY',
    size_signal='',
    fit_rationale='National virtual weight-loss programme built on GLP-1 prescribing across state lines.',
    contact_route='https://www.joincalibrate.com/faqs/contact-us', decision_maker_role='head of regulatory affairs',
    source_url='https://www.joincalibrate.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Enara Health',
    website='https://www.enarahealth.com/', location='San Mateo, CA',
    size_signal='',
    fit_rationale='Weight-management platform that also licenses its programme to clinics ("for clinics" partner page) - both a buyer and a route to other clinics.',
    contact_route='https://www.enarahealth.com/for-clinics/become-a-partner', decision_maker_role='head of clinical operations',
    source_url='https://www.enarahealth.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name='Mochi Health',
    website='https://joinmochi.com/', location='San Francisco, CA',
    size_signal='',
    fit_rationale='Telehealth weight-loss clinic prescribing GLP-1s nationally; multi-state licensure and compounded-drug rules are its core compliance surface.',
    contact_route='https://joinmochi.com/', decision_maker_role='head of regulatory affairs',
    source_url='https://joinmochi.com/', source_type='company-site', confidence='verified',
    notes='Also offers hair loss and skin services per its own homepage.')

row(prospect_type='end-customer', segment='telehealth aesthetic / wellness provider', name='Ro',
    website='https://ro.co/', location='New York, NY',
    size_signal='',
    fit_rationale='National telehealth provider with weight-loss, skin and hair lines; operates through affiliated professional entities in all 50 states.',
    contact_route='https://ro.co/contact-us/', decision_maker_role='head of regulatory affairs',
    source_url='https://ro.co/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='telehealth aesthetic / wellness provider', name='Hers (Hims & Hers Health)',
    website='https://www.hers.com/', location='San Francisco, CA',
    size_signal='',
    fit_rationale='Multi-state telehealth brand selling skin, hair and weight products through affiliated medical groups - a textbook friendly-PC/MSO structure across 50 states.',
    contact_route='info@hers.com', decision_maker_role='head of regulatory affairs',
    source_url='https://www.hers.com/', source_type='company-site', confidence='verified',
    notes='Generic mailbox published on its own site.')

row(prospect_type='end-customer', segment='telehealth aesthetic / wellness provider', name='LifeMD',
    website='https://lifemd.com/', location='New York, NY',
    size_signal='',
    fit_rationale='Public multi-state telehealth company with weight-management and skin lines; MSO/professional-entity structure is disclosed as a risk factor.',
    contact_route='https://lifemd.com/contact?force=1', decision_maker_role='general counsel',
    source_url='https://lifemd.com/', source_type='company-site', confidence='verified', notes='')

row(prospect_type='end-customer', segment='telehealth aesthetic / wellness provider', name='Eden',
    website='https://www.tryeden.com/', location='San Francisco, CA',
    size_signal='',
    fit_rationale='Telehealth prescription wellness brand covering weight loss and skin; runs a provider partner programme across states.',
    contact_route='https://www.tryeden.com/partner-with-eden', decision_maker_role='head of regulatory affairs',
    source_url='https://www.tryeden.com/', source_type='company-site', confidence='verified', notes='')

# ---------------------------------------------------------------- PARTNERS: software / EMR
def sw(name, website, loc, contact, note, conf='verified', src=None):
    row(prospect_type='partner', segment='med spa software / EMR', name=name, website=website,
        location=loc, size_signal='',
        fit_rationale='Practice software used by med spas; its onboarding flow is where a new location first has to state which services it will offer and under whose supervision, so a bundled state compliance report fits naturally.',
        contact_route=contact, decision_maker_role='head of partnerships',
        source_url=src or website, source_type='company-site', confidence=conf, notes=note)

sw('Zenoti','https://www.zenoti.com/','Bellevue, WA','https://www.zenoti.com/contact-us','Enterprise salon/spa/med spa platform used by multi-location chains - the exact customer segment that expands across states.')
sw('Boulevard','https://www.joinblvd.com/','Los Angeles, CA','https://www.joinblvd.com/partner-with-us','AmSpa silver vendor affiliate. Publishes med spa owner education content (conference roundups, "who can open a medical spa") - an existing content channel.')
sw('AestheticsPro','https://www.aestheticspro.com/','Las Vegas, NV','https://www.aestheticspro.com/Partners/','Med spa-specific practice management software with a published partner programme. sales@aestheticspro.com on own site.')
sw('Aesthetic Record','https://www.aestheticrecord.com/','Miami, FL','info@aestheticrecord.com','Positions itself as the #1 EMR for med spas; generic mailbox published on its own site.')
sw('PatientNow','https://www.patientnow.com/','Englewood, CO','https://www.patientnow.com/partners/','EMR and practice management for aesthetic practices with an existing partner programme page.')
sw('Nextech','https://www.nextech.com/','Tampa, FL','https://www.nextech.com/partnerships','AmSpa platinum vendor affiliate; specialty EHR covering aesthetics and dermatology.')
sw('ModMed','https://www.modmed.com/','Boca Raton, FL','https://www.modmed.com/what-we-do/strategic-partners/','Specialty cloud EHR with a large dermatology base that overlaps the med spa market.')
sw('Mangomint','https://www.mangomint.com/','Los Angeles, CA','https://www.mangomint.com/contact-us/','Salon and med spa software growing fast in the aesthetics segment.')
sw('Vagaro','https://www.vagaro.com/','Pleasanton, CA','https://www.vagaro.com/pro/partners','Booking platform with a published partner programme and a large med spa customer base.')
sw('Jane','https://www.jane.app/','Vancouver, BC','https://www.jane.app/contact','Practice management for health and wellness clinics including aesthetic and IV practices.')
sw('Symplast','https://www.symplast.com/','Fort Lauderdale, FL','https://www.symplast.com/','Plastic surgery and med spa EHR. Only mailbox found on the page was a staging-domain address, so it was not used as the contact route.')
sw('Mindbody','https://www.mindbodyonline.com/','San Luis Obispo, CA','https://www.mindbodyonline.com/company/contact-us','Wellness booking platform with med spa and IV-clinic customers.')
sw('RepeatMD','https://www.repeatmd.com/','Houston, TX','https://www.repeatmd.com/partners','Aesthetics-only e-commerce and loyalty platform; its whole customer base is med spas. info@repeatmd.com on own site.')
sw('Pabau','https://pabau.com/','London, UK (US clinics)','https://pabau.com/partners/app/','Clinic practice management with a US med spa push and an app-partner programme.')
sw('Phorest','https://www.phorest.com/us','Dublin, IE (US office)','https://www.phorest.com/us/partners/','AmSpa platinum vendor affiliate; salon and med spa software with a US partner programme.')
sw('GlossGenius','https://glossgenius.com/','New York, NY','https://glossgenius.com/contact-us','AmSpa platinum vendor affiliate with a dedicated medical-spa product page.')
sw('DaySpark','https://dayspark.com/','','https://dayspark.com/contact','AmSpa silver vendor affiliate; med spa, aesthetics and salon software.')
sw('Weave','https://www.getweave.com/','Lehi, UT','https://www.getweave.com/partners/','AmSpa platinum vendor affiliate; publishes med spa conference and owner content.')
sw('Podium','https://www.podium.com/','Lehi, UT','https://www.podium.com/contact-us','AmSpa platinum vendor affiliate; AI lead management sold into med spas.')
sw('D.A.W. Systems (ScriptSure)','https://www.dawsystems.com/','Wellington, FL','https://www.dawsystems.com/partners','AmSpa platinum vendor affiliate; e-prescribing used by med spas that prescribe GLP-1s and toxins. sales@dawsystems.com on own site.')

# ---------------------------------------------------------------- PARTNERS: medical director / GFE services
row(prospect_type='partner', segment='medical director & good-faith-exam service', name='Qualiphy',
    website='https://qualiphy.me/', location='',
    size_signal='', fit_rationale='Supplies good-faith exams and medical oversight to med spas in many states; it needs an authoritative per-state scope answer for every client it onboards, and it reaches those clients first.',
    contact_route='https://qualiphy.me/partner-with-us/', decision_maker_role='head of partnerships',
    source_url='https://qualiphy.me/', source_type='company-site', confidence='verified',
    notes='Partner rather than excluded: it sells the physician relationship and the exam workflow, not a cited state-by-state scope/CPOM report. Overlap exists on "who can supervise", so treat as partner-with-overlap.')

row(prospect_type='partner', segment='medical director & good-faith-exam service', name='Medical Director Co',
    website='https://www.medicaldirectorco.com/', location='',
    size_signal='', fit_rationale='Matches med spas with medical directors and collaborating physicians state by state; its entire funnel is owners about to open in a new state.',
    contact_route='https://www.medicaldirectorco.com/contact-medical-director-co/', decision_maker_role='head of partnerships',
    source_url='https://www.medicaldirectorco.com/', source_type='company-site', confidence='verified',
    notes='Publishes state-level guidance content (e.g. spa franchise opportunities guide), so there is content overlap; still a partner because the deliverable is a physician, not a compliance report. info@medicaldirectorco.com on own site.')

row(prospect_type='partner', segment='medical director & good-faith-exam service', name='Guardian Medical Direction',
    website='https://guardianmedicaldirection.com/', location='',
    size_signal='', fit_rationale='Places collaborating physicians and medical directors for aesthetic practices; sees every new med spa before it opens.',
    contact_route='https://guardianmedicaldirection.com/industry-partners/', decision_maker_role='head of partnerships',
    source_url='https://guardianmedicaldirection.com/', source_type='company-site', confidence='verified',
    notes='Has an explicit "industry partners" page.')

row(prospect_type='partner', segment='medical director & good-faith-exam service', name='Spakinect',
    website='https://www.spakinect.com/', location='',
    size_signal='', fit_rationale='Telemedicine good-faith exams for aesthetic practices; an adjacent compliance workflow that pairs with a state scope report rather than replacing it.',
    contact_route='https://www.spakinect.com/contact', decision_maker_role='head of partnerships',
    source_url='https://www.spakinect.com/', source_type='company-site', confidence='verified',
    notes='AmSpa silver-tier vendor affiliate. info@spakinect.com on own site.')

row(prospect_type='excluded', segment='medical director & good-faith-exam service', name='Moxie',
    website='', location='San Francisco, CA',
    size_signal='', fit_rationale='Sells the whole med spa launch bundle - entity formation, medical director, compliance and software - so it competes directly for the state launch spend rather than referring it.',
    contact_route='', decision_maker_role='',
    source_url='https://www.americanmedspa.org/vendor-directory/', source_type='association-directory', confidence='secondary',
    notes='EXCLUDED as a direct competitor on the launch-compliance step. Listed as an AmSpa platinum vendor affiliate under Business Consulting / Marketing / Practice Management. moxie.md and www.moxie.md did not resolve from this environment on two attempts, so website is left empty; AmSpa links it through a medspa.mba redirect.')

# ---------------------------------------------------------------- PARTNERS: training
def tr(name, website, loc, contact, note, conf='verified', src=None):
    row(prospect_type='partner', segment='aesthetic training company', name=name, website=website, location=loc,
        size_signal='', fit_rationale='Trains new injectors and new med spa owners, so it meets ScopeIQ buyers at the exact moment they ask "am I allowed to do this in my state?" - a natural bundle or referral.',
        contact_route=contact, decision_maker_role='head of partnerships', source_url=src or website,
        source_type='company-site', confidence=conf, notes=note)

tr('Empire Medical Training','https://www.empiremedicaltraining.com/','Fort Lauderdale, FL','https://www.empiremedicaltraining.com/contact-us/information/','Hands-on CME aesthetic courses for physicians, NPs, PAs and RNs nationwide.')
tr('IAPAM (International Association for Physicians in Aesthetic Medicine)','https://iapam.com/','Scottsdale, AZ','https://iapam.com/contact-us','Aesthetic medicine training and certification; also publishes med spa business-startup material.')
tr('National Laser Institute','https://www.nationallaserinstitute.com/','Scottsdale, AZ','https://www.nationallaserinstitute.com/','Cosmetic laser and Botox training school with campuses in several states and its own med spa locations.')
tr('American Academy of Aesthetic Medicine (AAAM)','https://www.aaamed.org/','','https://www.aaamed.org/','Certification body for aesthetic medicine practitioners.')
tr('AAOPM (American Academy of Procedural Medicine)','https://www.aaopm.com/','','https://www.aaopm.com/contact/','Botox, aesthetics and pain-management CME training. info@aaopm.com on own site.')
tr('Aesthetic Injector Academy','https://www.aestheticinjectoracademy.com/','','info@injectorschool.com','AmSpa silver-tier vendor affiliate under Injectables; trains injectors entering the field.')

# ---------------------------------------------------------------- PARTNERS: manufacturers / distributors
def mf(name, website, loc, contact, note, conf='verified', src=None):
    row(prospect_type='partner', segment='device & injectable manufacturer', name=name, website=website, location=loc,
        size_signal='', fit_rationale='Sells injectables or energy devices into med spas and runs a provider/partner programme; a co-branded state compliance report is a low-cost way for its reps to open new accounts and de-risk device placement.',
        contact_route=contact, decision_maker_role='head of provider marketing', source_url=src or website,
        source_type='company-site', confidence=conf, notes=note)

mf('Allergan Aesthetics (AbbVie)','https://www.allerganaesthetics.com/','Irvine, CA','https://www.allerganaesthetics.com/providers/contact','Botox Cosmetic, Juvederm, CoolSculpting. AmSpa platinum vendor affiliate. Runs the Allergan Medical Institute training programme referenced by AMP.')
mf('Galderma','https://www.galderma.com/us','Fort Worth, TX','https://www.galderma.com/us/contact-us','Dysport, Restylane, Sculptra. AmSpa platinum vendor affiliate; runs the ASPIRE loyalty programme.')
mf('Merz Aesthetics','https://www.merzaesthetics.com/','Raleigh, NC','https://merzaesthetics.com/partnerships/','Xeomin, Radiesse, Ultherapy. AmSpa platinum vendor affiliate with a published partnerships page.')
mf('Evolus','https://www.evolus.com/','Newport Beach, CA','https://www.evolus.com/contact-us','Jeuveau; sells performance-beauty injectables direct to aesthetic practices.')
mf('Cynosure Lutronic','https://www.cynosure.com/','Westford, MA','https://www.cynosure.com/for-providers/partnership-information/','AmSpa gold vendor affiliate; energy devices with an explicit provider partnership page.')
mf('Candela','https://www.candelamedical.com/','Marlborough, MA','https://www.candelamedical.com/contact/','AmSpa platinum vendor affiliate; lasers and microneedling devices.')
mf('InMode','https://inmodemd.com/','Irvine, CA','https://inmodemd.com/contact-us/','RF body contouring and Morpheus8; heavily placed in med spas.')
mf('Cutera','https://www.cutera.com/','Brisbane, CA','https://www.cutera.com/','Aesthetic energy devices. Homepage returned no title to the parser; contact route not confirmed.','secondary')
mf('BTL Aesthetics','https://www.btlaesthetics.com/','Boston, MA','info@btlnet.com','Emsculpt and Emsella; generic mailbox published on its own site.')
mf('Sciton','https://sciton.com/','Palo Alto, CA','https://sciton.com/contact-sciton-concierge-marketing/','Laser platforms sold into med spas and dermatology.')
mf('Alma Lasers','https://www.almalasers.com/','Buffalo Grove, IL','https://partners.almalasers.com/','Runs a dedicated partner portal for aesthetic providers.')
mf('Lumenis','https://lumenis.com/','San Jose, CA','https://lumenis.com/','Energy devices; aesthetic-physician partner zone requires a login, so a public contact route was not used.')
mf('Venus Concept','https://venusconcept.com/','Toronto, ON (US ops)','https://venusconcept.com/contact-us','Aesthetic device manufacturer with a subscription placement model. info@venusconcept.com on own site.')
mf('Solta Medical','https://www.soltamedical.com/','Bothell, WA','https://www.soltamedical.com/','Thermage and Fraxel; sold into med spas and dermatology.')
mf('Aerolase','https://aerolase.com/','Tarrytown, NY','https://aerolase.com/contact','Laser platform marketed to aesthetic practices.')
mf('Clarius Mobile Health','https://clarius.com/aesthetics','Vancouver, BC (US sales)','https://clarius.com/partner-with-us/','AmSpa silver vendor affiliate; handheld ultrasound for safer filler injection - sold on a safety/compliance argument.')

# ---------------------------------------------------------------- PARTNERS: consultants, M&A, marketing
def cs(name, website, loc, contact, rationale, note, seg='med spa consultant / M&A advisor', conf='verified', src=None):
    row(prospect_type='partner', segment=seg, name=name, website=website, location=loc, size_signal='',
        fit_rationale=rationale, contact_route=contact, decision_maker_role='head of partnerships',
        source_url=src or website, source_type='company-site', confidence=conf, notes=note)

cs('Skytale Group','https://skytalegroup.com/','Dallas, TX','https://skytalegroup.com/contact-us',
   'Investment bank and management consultancy for aesthetic practices; its M&A diligence needs exactly the state CPOM answer ScopeIQ produces.',
   'AmSpa platinum vendor affiliate under Business Consulting. Cited as the source of med spa valuation ranges in the CT Acquisitions 2026 report.')
cs('Aesthetic Brokers','https://aestheticbrokers.com/','','https://aestheticbrokers.com/contact/',
   'Sell-side M&A adviser for med spas; every deal it runs needs a clean state ownership structure to close.','')
cs('Provident Healthcare Partners','https://www.providenthp.com/','Boston, MA','https://www.providenthp.com/',
   'Healthcare investment bank publishing wellness and aesthetic medicine sector notes; introduces sellers to PE platforms entering new states.',
   'Only external contact link found on the homepage was a LinkedIn company page, so contact_route is the homepage.')
cs('Pacific Reliance Medical M&A Advisors','https://www.pacificrb.com/','','https://www.pacificrb.com/contact-us',
   'AmSpa platinum vendor affiliate advising med spa owners on sales and real estate - present at the moment a practice restructures.','')
cs('DermAesthetic Consulting (DAC)','https://dermaestheticconsulting.com/','','https://dermaestheticconsulting.com/contact-2/',
   'Med spa consultancy that sets up practices operationally; a state compliance report is a natural attachment to its onboarding.',
   'AmSpa platinum vendor affiliate.')
cs('Universal Healthcare Consulting','https://www.universalhc.com/','','https://www.universalhc.com/contact/',
   'Healthcare compliance and accreditation support sold to med spas - adjacent, and its clients already buy compliance.',
   'AmSpa platinum vendor affiliate. Overlaps ScopeIQ on general compliance but not on 50-state scope/CPOM content.')
cs('Obsidian Strategic Consulting','https://www.obsidian.inc/','','https://www.obsidian.inc/contact',
   'AmSpa platinum vendor affiliate providing bookkeeping, consulting and HR to med spas.','info@obsidian.inc on own site.')
cs('SafeLink Consulting','https://safelinkconsulting.com/','','https://safelinkconsulting.com/contact-us/',
   'US regulatory compliance consulting sold to med spas; a referral partner for the state-scope question it does not answer itself.',
   'AmSpa platinum vendor affiliate. info@safelinkconsulting.com on own site.')
cs('MedSafe','https://medsafe.com/','','https://medsafe.com/partners/',
   'Healthcare compliance programmes (OSHA/HIPAA) for med spas, with an existing partners page.','AmSpa gold vendor affiliate.')
cs('Compliancy Group','https://compliancy-group.com/','Greenlawn, NY','https://compliancy-group.com/contact-us/',
   'HIPAA compliance software sold into med spas; complementary compliance surface, same buyer.','AmSpa gold vendor affiliate.')
cs('CEDR HR Solutions','https://www.cedrsolutions.com/','Tucson, AZ','https://www.cedrsolutions.com/about/contact-cedr/',
   'HR and employee-handbook provider for healthcare employers including med spas; staffing rules and scope rules are bought together.',
   'AmSpa platinum vendor affiliate. support@cedrsolutions.com on own site.')
cs('Xite Realty','https://www.xiteco.com/','Dallas, TX','https://www.xiteco.com/',
   'Healthcare real estate broker for practices - it is literally in the room when a med spa signs a new-state lease, the trigger event for a launch report.',
   'AmSpa platinum vendor affiliate under Real Estate.')
cs('Atteign','https://atteign.com/','Austin, TX','https://atteign.com/contact',
   'Accounting and advisory for aesthetic practices; entity structure and CPOM structure are decided at the same table.',
   'AmSpa silver vendor affiliate. info@atteign.com on own site.')
cs('Cavin CPAs and Advisors','https://www.cavincpa.com/','Chesterfield, MO','https://www.cavincpa.com/contact.php',
   'AmSpa platinum vendor affiliate doing med spa bookkeeping and accounting; sees new entity formations.','info@cavincpa.com on own site.')
cs('BrightSkies Services','https://brightskiesservice.com/','','https://brightskiesservice.com/contact-us-1',
   'AmSpa silver vendor affiliate; bookkeeping and payroll/HR for med spas.','')
cs('ValueCap','https://valuecapinc.com/','','',
   'AmSpa silver vendor affiliate under Business Consulting for med spa owners.',
   'Site returned HTTP 202 (bot interstitial) on two attempts; row kept from the AmSpa directory listing.','med spa consultant / M&A advisor','secondary','https://www.americanmedspa.org/vendor-directory/')

cs('Growth99','https://www.growth99.com/','Draper, UT','https://growth99.com/partner/',
   'Digital marketing agency specialising in med spas with an existing partner programme; its clients are opening new locations constantly.',
   'AmSpa platinum vendor affiliate.','aesthetics marketing agency')
cs('Influx Marketing','https://influxmarketing.com/','Loomis, CA','https://influxmarketing.com/contact/',
   'Medical marketing agency with a large aesthetic-practice client base.','','aesthetics marketing agency')
cs('Salt Marketing','https://saltmarketing.co/','','https://saltmarketing.co/partners/',
   'Med spa and wellness marketing agency with a published partners page.','AmSpa platinum vendor affiliate.','aesthetics marketing agency')
cs('Aesthera Marketing (JustDigital)','https://aestheramarketing.com/','','https://aestheramarketing.com/contact',
   'Premier med spa marketing company; AmSpa platinum vendor affiliate offering members a strategy session.','','aesthetics marketing agency')
cs('Medical Marketing Whiz','https://www.medicalmarketingwhiz.com/','','support@medicalmarketingwhiz.com',
   'AmSpa platinum vendor affiliate doing marketing and practice growth for med spas.','Generic support mailbox published on its own site.','aesthetics marketing agency')
cs('Raging Agency','https://ragingagency.com/','','https://ragingagency.com/contact-us/',
   'Wellness and med spa marketing agency; AmSpa silver vendor affiliate.','info@ragingagency.com on own site.','aesthetics marketing agency')
cs('CallRail','https://www.callrail.com/','Atlanta, GA','https://www.callrail.com/',
   'AmSpa platinum vendor affiliate; call tracking sold into med spa marketing stacks.','Homepage title did not parse; contact route not confirmed beyond the root URL.','aesthetics marketing agency','secondary')
cs('CorralData','https://corraldata.com/','','https://corraldata.com/partnerships/',
   'AmSpa platinum vendor affiliate; analytics for healthcare and aesthetic brands with a partnerships page.','','aesthetics marketing agency')
cs('Ad IntellX (A-Score)','https://getascore.io/','','https://getascore.io/contact',
   'AmSpa platinum vendor affiliate selling verification and monitoring records to med spas - an adjacent "prove you are legitimate" product.','','aesthetics marketing agency')
cs('Mango Voice','https://mangovoice.com/','Salt Lake City, UT','https://mangovoice.com/partners',
   'AmSpa platinum vendor affiliate; AI phone platform for healthcare practices with a partners page.','support@mangovoice.com on own site.','aesthetics marketing agency')

# ---------------------------------------------------------------- PARTNERS: pharmacy, finance, insurance, supplies
def pn(seg, name, website, loc, contact, rationale, note, conf='verified', src=None):
    row(prospect_type='partner', segment=seg, name=name, website=website, location=loc, size_signal='',
        fit_rationale=rationale, contact_route=contact, decision_maker_role='head of partnerships',
        source_url=src or website, source_type='company-site', confidence=conf, notes=note)

pn('compounding pharmacy','Empower Pharmacy','https://empowerpharmacy.com/','Houston, TX','https://empowerpharmacy.com/',
   '503A/503B compounding pharmacy supplying med spas with semaglutide, peptides and injectables; what it may ship depends on the prescriber\'s state scope.','')
pn('compounding pharmacy','Olympia Pharmaceuticals','https://www.olympiapharmacy.com/','Orlando, FL','https://www.olympiapharmacy.com/contact/',
   '503A/503B outsourcing facility serving aesthetic and weight-loss clinics across states.','')
pn('compounding pharmacy','Hallandale Pharmacy','https://hallandalepharmacy.com/','Hallandale Beach, FL','https://hallandalepharmacy.com/',
   'Compounding pharmacy supplying aesthetic and wellness practices; onboarding a new clinic requires confirming who may prescribe in that state.','')
pn('compounding pharmacy','ReviveRx','https://reviverx.com/','Houston, TX','info@reviverxpharmacy.com',
   'Compounding pharmacy serving hormone, weight-loss and aesthetic clinics.','Generic mailbox published on its own site.')
pn('compounding pharmacy','Belmar Pharma Solutions','https://belmarpharmasolutions.com/','Golden, CO','https://belmarpharmasolutions.com/',
   'National compounding pharmacy supplying hormone and weight-management clinics.','')
pn('compounding pharmacy','Strive Pharmacy','https://strivepharmacy.com/','Gilbert, AZ','https://strivepharmacy.com/partnership',
   'Compounding pharmacy with a published partnership programme aimed at clinics.','')
pn('compounding pharmacy','ShineRX','https://www.shinerx.com/','','https://www.shinerx.com/',
   'AmSpa silver vendor affiliate under Pharmaceuticals; supplies med spas.','Homepage content minimal; listing corroborated by the AmSpa vendor directory.')

pn('patient finance / lender','CareCredit','https://www.carecredit.com/','Costa Mesa, CA','https://www.carecredit.com/providers/partnerships/',
   'Patient financing used at the point of sale in med spas; AmSpa platinum vendor affiliate with a provider partnerships page.','')
pn('patient finance / lender','Cherry','https://withcherry.com/','Los Angeles, CA','https://withcherry.com/partners',
   'BNPL for aesthetic practices with a partner programme; merchant onboarding touches every new location.','')
pn('patient finance / lender','PatientFi','https://www.patientfi.com/','Newport Beach, CA','https://patientfi.com/partners/',
   'Patient financing built for aesthetics with an existing partners page.','')
pn('patient finance / lender','Alphaeon Credit','https://alphaeoncredit.com/','Irvine, CA','https://alphaeoncredit.com/',
   'Aesthetics-specific credit card used by med spas; sees new practices at merchant onboarding.','')
pn('patient finance / lender','Provide','https://www.getprovide.com/','San Francisco, CA','hello@getprovide.com',
   'Lender that finances healthcare practice acquisitions and de novo builds - it underwrites exactly the state launch decision ScopeIQ prices.','Generic mailbox published on its own site.')
pn('patient finance / lender','USA Payments','https://usapayments.com/','','https://usapayments.com/cpa-partners/',
   'AmSpa gold vendor affiliate; merchant processing for med spas with a partner programme.','')

pn('insurance & risk','CM&F Group','https://www.cmfgroup.com/','New York, NY','https://www.cmfgroup.com/about-cm-f/cmf-partners/',
   'Malpractice and professional liability insurer for aesthetic practitioners; underwriting turns on what the practitioner is licensed to do in that state.','AmSpa platinum vendor affiliate under Insurance.')

pn('med spa supplies & equipment','Medical Purchasing Resource','https://www.medpurchasing.com/','','https://www.medpurchasing.com/',
   'AmSpa platinum vendor affiliate supplying aesthetic equipment and consumables to med spas.','')
pn('med spa supplies & equipment','Earthlite','https://www.earthlite.com/','Vista, CA','https://www.earthlite.com/contact',
   'AmSpa platinum vendor affiliate; spa furniture and equipment sold to new med spa build-outs.','')
pn('med spa supplies & equipment','Lineage Biomedical','','','',
   'AmSpa platinum-listed vendor affiliate under Med Spa Supplies & Equipment.','lineagebiomedical.com returned 403 from this environment; website left empty.','secondary','https://www.americanmedspa.org/vendor-directory/')
pn('professional skincare','Alastin Skincare','','Carlsbad, CA','',
   'AmSpa platinum vendor affiliate; professional skincare line placed on med spa retail shelves by account managers who visit every new location.','alastin.com returned 403 from this environment; website left empty.','secondary','https://www.americanmedspa.org/vendor-directory/')
pn('professional skincare','Dermalogica PRO','https://pro.dermalogica.com/','Carson, CA','https://pro.dermalogica.com/become-a-partnership-school/',
   'AmSpa platinum vendor affiliate; professional skincare and microneedling sold into med spas and esthetics schools.','')
pn('professional skincare','CP Skin Health Pro','https://www.cpskinhealthpro.com/','','https://www.cpskinhealthpro.com/',
   'AmSpa silver vendor affiliate; professional skincare distributed to med spas.','')
pn('professional skincare','Environ Dermaconcepts','','Marblehead, MA','',
   'AmSpa silver vendor affiliate; professional skincare distributor for aesthetic practices.','dermaconcepts.com returned 403 from this environment; website left empty.','secondary','https://www.americanmedspa.org/vendor-directory/')
pn('med spa hiring & HR','Job Snob','','','',
   'AmSpa platinum vendor affiliate for hiring and recruiting in med spas; hiring an injector is the moment scope-of-practice becomes urgent.','AmSpa links it through an americanmedspa.org redirect rather than a direct company URL; website left empty.','secondary','https://www.americanmedspa.org/vendor-directory/')
pn('med spa data & prospecting','Orbital','https://www.withorbital.com/','','https://www.withorbital.com/',
   'Sells operator-side med spa data (11,400 US aesthetic clinics with owner/medical-director records) to vendors selling into the category - a distribution partner and a data source.',
   'Its published chain table and clinic-universe methodology were used as a secondary source for several chain rows in this file.')
pn('med spa software / EMR','Peak Health','https://www.getpeakhealth.com/','','https://www.getpeakhealth.com/',
   'AmSpa silver vendor affiliate; practice management software for longevity and preventive-care clinics.','')
pn('med spa design & buildout','Designed by Stax','','','',
   'AmSpa platinum vendor affiliate under Marketing; works with med spas on brand and buildout.','designedbystax.com returned 403 from this environment; website left empty.','secondary','https://www.americanmedspa.org/vendor-directory/')

# ---------------------------------------------------------------- PARTNERS: PE sponsors
def pe(name, website, loc, contact, note, portfolio):
    row(prospect_type='partner', segment='PE sponsor / investor', name=name, website=website, location=loc,
        size_signal='', fit_rationale='Owns or backs a med spa platform, so it can push a state launch compliance report down to every portfolio company and every tuck-in diligence file: ' + portfolio + '.',
        contact_route=contact, decision_maker_role='healthcare operating partner', source_url=website,
        source_type='company-site', confidence='verified', notes=note)

pe('Shore Capital Partners','https://www.shorecp.com/','Chicago, IL','https://www.shorecp.com/teams/operating-partners',
   'Formed Empower Aesthetics in 2023 (per its own newsroom and trade press).','backs Empower Aesthetics')
pe('Thurston Group','https://www.thurstongroup.com/','Chicago, IL','https://www.thurstongroup.com/contact',
   'Named as the sponsor behind Alpha Aesthetics Partners in trade press.','backs Alpha Aesthetics Partners')
pe('Princeton Equity Group','https://princetonequity.com/','Princeton, NJ','https://princetonequity.com/contact/',
   'Multi-location and franchisor-focused PE firm; founder also chairs Princeton Medspa Partners. info@princetonequity.com on own site.','backs Princeton Medspa Partners')
pe('Leon Capital Group','https://www.leoncapitalgroup.com/','Dallas, TX','https://www.leoncapitalgroup.com/advanced-medaesthetic-partners/',
   'Its own site carries a dedicated Advanced MedAesthetic Partners page.','owns Advanced MedAesthetic Partners')
pe('Freeman Spogli','https://www.freemanspogli.com/','Los Angeles, CA','https://www.freemanspogli.com/',
   'Took a majority position in VIO Med Spa in September 2024 and publishes VIO news on its own site.','backs VIO Med Spa')
pe('KKR','https://www.kkr.com/','New York, NY','https://www.kkr.com/invest/strategic-partnerships',
   'Health Care Strategic Growth Fund II took a minority stake in SkinSpirit in October 2022 per trade press.','backs SkinSpirit')
pe('L Catterton','https://www.lcatterton.com/','Greenwich, CT','https://www.lcatterton.com/',
   'Long-time owner of Ideal Image via the 2015 Steiner Leisure acquisition per trade press.','has owned Ideal Image')
pe('Leonard Green & Partners','https://www.leonardgreen.com/','Los Angeles, CA','https://www.leonardgreen.com/contact/',
   'Backed Milan Laser from 2019 per trade press.','backs Milan Laser Hair Removal')
pe('Lightyear Capital','https://www.lightyearcapital.com/','New York, NY','https://www.lightyearcapital.com/contact-us/',
   'Named as LaserAway\'s PE backer in the withorbital.com June 2026 chain table; other sources name Ares/Seidler, so ownership should be re-checked before outreach.','is named as a LaserAway backer')
pe('New Harbor Capital','https://www.newharborcap.com/','Chicago, IL','https://www.newharborcap.com/contact-us/',
   'Named in trade press as the sponsor of MD Esthetics. info@newharborcap.com published on its own site.','backs MD Esthetics')
pe('Persistence Capital Partners','https://www.persistencecapital.com/','Montreal, QC','https://www.persistencecapital.com/contact-1',
   'Sponsor of MedSpa Partners, which is acquiring in the US.','backs MedSpa Partners')

# ---------------------------------------------------------------- PARTNERS: associations
def assoc(name, website, loc, contact, rationale, note, conf='verified'):
    row(prospect_type='partner', segment='industry association', name=name, website=website, location=loc,
        size_signal='', fit_rationale=rationale, contact_route=contact,
        decision_maker_role='director of membership', source_url=website,
        source_type='association-directory', confidence=conf, notes=note)

assoc('American Med Spa Association (AmSpa)','https://www.americanmedspa.org/','Chicago, IL','https://www.americanmedspa.org/contact/',
      'The centre of gravity for this market: it already sells the 50-state legal answer as a $395-845/yr membership, runs the Medical Spa Show and the boot camps, and operates nine state chapters organised around scope-of-practice legislation. Partner and channel at once; also the closest thing to an incumbent.',
      'Both partner and competitor. Its vendor directory (55 affiliates) was the single highest-yield partner source in this file. Members: 3,000+ per the phase-1 evidence file.')
assoc('The Aesthetic Society','https://www.theaestheticsociety.org/','Garden Grove, CA','https://www.theaestheticsociety.org/industry-partners',
      'Aesthetic plastic surgery society with an industry-partners programme; its members supervise med spas.','')
assoc('American Society for Dermatologic Surgery (ASDS)','https://www.asds.net/','Rolling Meadows, IL','https://www.asds.net/Medical-Professionals/Partner-with-ASDS',
      'Dermatologic surgery society with an explicit partner-with-ASDS page; its members are the supervising physicians in many med spa structures.','')
assoc('American Society for Laser Medicine and Surgery (ASLMS)','https://www.aslms.org/','Wausau, WI','https://www.aslms.org/membership/member-benefits/industry-partners/',
      'Laser medicine society with an industry-partners page; laser delegation to non-physicians is one of the most state-variable rules ScopeIQ answers.','')
assoc('American Society of Plastic Surgeons (ASPS)','https://www.plasticsurgery.org/','Arlington Heights, IL','https://www.plasticsurgery.org/about-asps/contact-us',
      'Publishes the procedure-volume statistics that frame the market; members own or supervise med spas.','')
assoc('AAFPRS (American Academy of Facial Plastic and Reconstructive Surgery)','https://www.aafprs.org/','Alexandria, VA','info@aafprs.org',
      'Facial plastic surgery academy whose members run adjacent aesthetic practices.','Generic mailbox published on its own site.')
assoc('International Society of Plastic and Aesthetic Nurses (ISPAN)','https://www.ispan.org/','Chicago, IL','https://www.ispan.org/',
      'The professional body for aesthetic nurses - the licence group whose scope ScopeIQ is mostly about. Runs an annual meeting.','')
assoc('Dermatology Nurses\' Association','https://www.dnanurse.org/','Bordentown, NJ','https://www.dnanurse.org/contact-us/',
      'Nursing association whose members practise in dermatology and aesthetic settings.','')

# ---------------------------------------------------------------- CHANNELS: events
def ev(name, website, loc, size, rationale, note, conf='verified'):
    row(prospect_type='channel', segment='industry event / conference', name=name, website=website, location=loc,
        size_signal=size, fit_rationale=rationale, contact_route=website,
        decision_maker_role='exhibitor sales manager', source_url='https://www.withorbital.com/blog/top-10-us-medspa-conferences-2026',
        source_type='list-article', confidence=conf, notes=note)

ev('The Medical Spa Show','https://www.medicalspashow.com/','Las Vegas, NV',
   '2,000+ attendees, 500+ exhibitors; attendee mix 40% owners, 16% nurses, 16% NPs, 10% physicians',
   'AmSpa\'s flagship show and the highest concentration of med spa owners and purchasing decision-makers at any single US event - the buyers of a state launch report.',
   'April 9-12 2026 at the Wynn Las Vegas; 2027 edition April 15-18. Own site confirmed (medicalspashow.com, title "Medical Spa Show 2027").')
ev('The Aesthetic Show','https://www.aestheticshow.com/','Las Vegas, NV','1,000-2,000 attendees, 175+ exhibitors, 90+ presenters',
   'Multispecialty aesthetics show reaching med spa owners, injectors and practice managers in one room.',
   'June 25-28 2026; produced by Informa Connect with the Aesthetic Multispecialty Society. Own site opened.')
ev('Aesthetic Next','https://aestheticnext.com/','Dallas, TX','1,000-2,000 attendees',
   'Four days aimed squarely at med spa owners, injectors, medical directors and clinic managers.',
   'September 10-13 2026. aestheticnext.com returned 403 to curl; details from the Orbital conference roundup.','secondary')
ev('AMWC Americas','https://www.amwcamericas.com/','Miami, FL','2,000-5,000 attendees',
   'Clinical aesthetics congress reaching the physicians who act as medical directors for med spas.',
   'February 14-16 2026, JW Marriott Miami Turnberry. Own site opened.')
ev('Modern Beauty Con','https://modernbeautycon.com/','Boston, MA','350-400 attendees',
   'Northeast med spa conference for injectors, estheticians and owners - MA/NJ/NY are strict-CPOM states.',
   'May 1-3 2026, Boston Park Plaza. Own site opened.')
ev('Aesthetic Success 4S Summit','https://4ssummit.com/','Tucson AZ / Kansas City MO / Ft. Lauderdale FL','<500 attendees per event, 3 events per year',
   'Practice-management education for aesthetic owners and managers in three different states each year.',
   'March 27-29, September 25-27 and December 4-6 2026. info@theaestheticsuccess.com published on its own site.')
ev('Global Aesthetics Conference','https://globalaestheticsconference.com/','Miami Beach, FL','350+ presentations, 150+ faculty',
   'Multispecialty aesthetic conference with a Wellness & Weight Loss track - the GLP-1 buyer.',
   'November 5-8 2026, Loews Miami Beach. Own site opened.')
ev('ODAC Dermatology, Aesthetic & Surgical Conference','https://orlandoderm.org/','Orlando, FL','500-1,000 attendees',
   'Dermatology-focused aesthetic conference; dermatologists are the supervising physicians in many med spa structures.',
   'January 16-19 2026, Omni ChampionsGate. Own site opened; has a site-partners page.')
ev('LA-MCA Cosmetic Academy Meeting','https://cosmeticacademymeeting.org/','Beverly Hills, CA','75+ speakers',
   'West Coast multispecialty cosmetic meeting - California is the single most valuable state for ScopeIQ after SB 351.',
   'March 19-22 2026, Four Seasons Beverly Hills. Own site opened.')
ev('AAD Annual Meeting','https://www.aad.org/','Denver, CO','10,000+ attendees',
   'Largest dermatology meeting in the world with a growing aesthetic track; broadest reach, least targeted.',
   'March 27-31 2026. The /annual-meeting path 404d to curl; the aad.org root is recorded as the website.','secondary')
ev('Music City SCALE (Symposium for Cosmetic Advances and Laser Education)','https://scalemusiccity.com/','Nashville, TN','100+ faculty',
   'Long-running cosmetic and laser symposium; Tennessee is one of the nine AmSpa state chapters organising on legislation.',
   'May 13-17 2026, 21st year. Own site opened.')
ev('Aesthetic Extender Symposium','https://aestheticextendersymposium.com/','Boca Raton, FL','',
   'Training event specifically for injectors, NPs and PAs - the licence categories whose scope varies most by state.',
   'August 6-9 2026 per the Boulevard 2026 show roundup. Own site opened.')
ev('ISPAN Annual Meeting','https://www.ispan.org/','Ft. Lauderdale, FL','',
   'The aesthetic nurses\' own annual meeting; the audience most exposed to scope-of-practice risk.',
   'October 28 - November 1 2026 per the Boulevard 2026 show roundup. The /annual-meeting path 404d; ispan.org root recorded.','secondary')
ev('AmSpa Medical Spa Boot Camps','https://www.americanmedspa.org/','Las Vegas NV / Dallas TX / Southern California / Chicago IL','4 events in 2026',
   'AmSpa\'s bootcamps exist to walk brand-new med spa owners through their first five years, including the legal set-up - the single most on-message room for a state launch report.',
   '2026 dates per the Boulevard roundup: April 9 Las Vegas, July 10-12 Dallas, August 28-29 Southern California, October 16-17 Chicago. Dedicated boot-camp URL 404d; americanmedspa.org recorded.','secondary')

# ---------------------------------------------------------------- CHANNELS: publications & communities
def pub(name, website, rationale, note, conf='verified', src=None):
    row(prospect_type='channel', segment='trade publication / media', name=name, website=website, location='',
        size_signal='', fit_rationale=rationale, contact_route=website, decision_maker_role='advertising / partnerships manager',
        source_url=src or website, source_type='company-site', confidence=conf, notes=note)

pub('BeautyMatter','https://beautymatter.com/','Beauty and wellness business publication that covers med spa franchising and PE deals in depth; reaches operators and investors.','Its March 2026 franchise roundup was a source for several rows in this file.')
pub('Modern Aesthetics','https://modernaesthetics.com/','Aesthetic medicine trade journal read by injectors and practice owners.','Homepage opened; title parsed as "- ModernAesthetics".')
pub('Practical Dermatology','https://www.practicaldermatology.com/','Dermatology practice publication reaching the physicians who supervise med spas.','Homepage opened.')
pub('The Aesthetic Guide (MIINEWS)','https://www.miinews.com/','Aesthetic device and practice trade publication with M&A coverage.','Homepage opened.')
pub('MedEsthetics','https://www.medesthetics.com/','Trade title for medical aesthetic practice owners and managers.','Homepage opened.')
pub('AmSpa "QP" / American Med Spa Association newsroom','https://www.americanmedspa.org/news/','AmSpa\'s own newsroom is where med spa owners read about state legislation - the exact trigger for a launch report or a monitoring subscription.','Multiple AmSpa news articles were opened during this collection (M&A look-back, PE and growth capital, OrangeTwist acquisition).','verified','https://www.americanmedspa.org/news/med-spa-ma-and-private-sales-a-look-back-at-2025-and-what-lies-ahead/')
pub('1851 Franchise','https://1851franchise.com/','Franchise trade publication that profiles med spa and wellness franchisors and reaches multi-unit franchisee buyers.','Its 2026 beauty/spa and health/wellness franchise roundups were sources for rows in this file.')
pub('Orbital med spa data blog','https://www.withorbital.com/blog/top-10-us-medspa-conferences-2026','Publishes the US aesthetic-clinic universe and conference calendar used by vendors selling into med spas.','Also listed as a partner row (data vendor).')

def chap(state, note=''):
    row(prospect_type='channel', segment='AmSpa state chapter', name=f'AmSpa {state} State Chapter',
        website='https://www.americanmedspa.org/state-chapters/', location=state, size_signal='',
        fit_rationale=f'A state-level organising body for med spa professionals in {state}, formed specifically around regulatory compliance and scope-of-practice legislation - the narrowest possible audience for a {state} launch report.',
        contact_route='https://www.americanmedspa.org/contact/', decision_maker_role='chapter chair (role only, no name recorded)',
        source_url='https://www.americanmedspa.org/state-chapters/', source_type='association-directory',
        confidence='verified', notes=note)
for s, n in [('Arizona','Chapter focus stated as regulatory compliance across Phoenix/Scottsdale.'),
             ('California','Described by AmSpa as one of its most active chapters, leading advocacy on scope-of-practice legislation statewide. CA SB 351 (MSO limits) took effect 1 Jan 2026.'),
             ('Colorado','Denver-area focus on practice standards.'),
             ('Florida','Stated focus: new regulatory challenges across the state.'),
             ('Georgia','Stated focus: clear med spa regulations in the Atlanta market.'),
             ('New Jersey','Stated focus: advocating for favourable practice regulations in the mid-Atlantic corridor.'),
             ('Tennessee','Nashville and Memphis; legislative engagement.'),
             ('Texas','Described as leading AmSpa legislative advocacy including efforts against proposed restrictive legislation.'),
             ('Utah','Newest chapter, Wasatch Front.')]:
    chap(s, n)

# ---------------------------------------------------------------- CHANNELS: podcasts (show names only, no hosts)
def pod(name, note=''):
    row(prospect_type='channel', segment='podcast for med spa owners', name=name, website='', location='',
        size_signal='', fit_rationale='A podcast whose audience is med spa owners, operators and injectors - a low-cost route to the exact buyer of a state launch compliance report.',
        contact_route='', decision_maker_role='show producer',
        source_url='https://podcast.feedspot.com/aesthetics_podcasts/', source_type='list-article',
        confidence='secondary', notes=(note + ' Show name only: hosts are private individuals and are deliberately not recorded, and no personal mailbox is used as a contact route.').strip())

for n, note in [
  ('Inside Aesthetics',"Feedspot's #1 aesthetics podcast; audience is cosmetic injectors and aesthetic businesses."),
  ('Med Spa Confidential',"Explicitly about the med spa industry as 'an unregulated mix of medicine and marketing' - directly on ScopeIQ's message."),
  ('Fill Me In: An Aesthetics Podcast','Aesthetic nurse practitioners who own their own practices.'),
  ('Medical Spa Mastermind','Business-side show for med spa operators.'),
  ('Aesthetics Unscripted',''),
  ('Profiles In Aesthetics',''),
  ('Medical Grade Aesthetics Podcast',''),
  ('Mastering Aesthetics',''),
  ('Treat Different',''),
  ('JANcast (Journal of Aesthetic Nursing)','Podcast of the peer-reviewed journal for aesthetic nurses.'),
  ('Aesthetics Today Podcast',''),
  ('The Aesthetic Podcast',''),
]:
    pod(n, note)

row(prospect_type='channel', segment='podcast for med spa owners', name='Medical Spa Insider',
    website='', location='', size_signal='',
    fit_rationale="AmSpa's own podcast: the association that already sells the 50-state legal answer talks to its members here every week.",
    contact_route='https://www.americanmedspa.org/contact/', decision_maker_role='show producer',
    source_url='https://podcasts.apple.com/us/podcast/medical-spa-insider/id1340962270', source_type='directory',
    confidence='secondary', notes='Produced by the American Med Spa Association. Show name only; host not recorded.')
row(prospect_type='channel', segment='podcast for med spa owners', name='Med Spa Success Strategies',
    website='https://medspamagicmarketing.com/podcast/', location='', size_signal='',
    fit_rationale='Show for med spa and aesthetics practice owners about marketing, management and scaling.',
    contact_route='https://medspamagicmarketing.com/podcast/', decision_maker_role='show producer',
    source_url='https://podcasts.apple.com/us/podcast/med-spa-success-strategies/id1690461495', source_type='directory',
    confidence='secondary', notes='Show name only; host not recorded. Website is the show page on the producing agency site.')
row(prospect_type='channel', segment='podcast for med spa owners', name='Aesthetic Appeal (Aesthetic Brokers podcast)',
    website='https://www.aestheticappealpodcast.com/', location='', size_signal='',
    fit_rationale='Med spa M&A, private equity and operator fundamentals - the audience that buys before a multi-state acquisition, not after.',
    contact_route='https://aestheticbrokers.com/contact/', decision_maker_role='show producer',
    source_url='https://aestheticbrokers.com/', source_type='company-site', confidence='secondary',
    notes='Produced by Aesthetic Brokers (also a partner row). Show name only; hosts not recorded.')
row(prospect_type='channel', segment='podcast for med spa owners', name='Business of Aesthetics podcast',
    website='https://www.businessofaesthetics.org/podcast-show/', location='', size_signal='',
    fit_rationale='Business-of-practice show aimed at aesthetic practice owners.',
    contact_route='https://www.businessofaesthetics.org/podcast-show/', decision_maker_role='show producer',
    source_url='https://www.businessofaesthetics.org/podcast-show/', source_type='company-site', confidence='verified',
    notes='Show name only; hosts not recorded.')

# ---------------------------------------------------------------- CHANNELS: online communities
row(prospect_type='channel', segment='online community', name='AmSpa Facebook page and private Member Lounge',
    website='', location='', size_signal='',
    fit_rationale='AmSpa describes its Facebook page and members-only lounge as the place med spa owners nationwide put compliance questions and get answers - the highest-intent audience for this product anywhere online.',
    contact_route='https://www.americanmedspa.org/contact/', decision_maker_role='community manager',
    source_url='https://www.americanmedspa.org/news/community-over-competition/', source_type='press',
    confidence='secondary', notes='facebook.com is blocked from this environment (BRIEF 2.7), so the group URL and member count were not confirmed. Named in AmSpa\'s own article.')
row(prospect_type='channel', segment='online community', name='MedSpa Social Media members-only community',
    website='https://socialmediamedspa.com/', location='', size_signal='"Trusted by over 1,400+ Medspas and Aesthetic Professionals" stated on its own site (2026-09-03)',
    fit_rationale='Paid content club with a private group of 1,400+ med spa and injector businesses - a rentable audience of exactly the ICP.',
    contact_route='https://socialmediamedspa.com/', decision_maker_role='community manager',
    source_url='https://socialmediamedspa.com/', source_type='company-site', confidence='verified',
    notes='Members-only Facebook group is behind a paid login; not entered (read-only rule).')
row(prospect_type='channel', segment='online community', name='The Aesthetic Vault',
    website='https://theaestheticvault.com/', location='', size_signal='$64/month membership stated on its own site',
    fit_rationale='Private content club for nurse injectors, estheticians, plastic surgeons and dermatologists; a paid community with the ICP inside it.',
    contact_route='https://theaestheticvault.com/links', decision_maker_role='community manager',
    source_url='https://theaestheticvault.com/links', source_type='company-site', confidence='verified',
    notes='Membership area is behind a login; not entered.')
# ---------------------------------------------------------------- EXCLUDED: competitors
def ex(name, website, loc, contact, rationale, note, seg='healthcare law firm (competitor)', conf='verified', src=None):
    row(prospect_type='excluded', segment=seg, name=name, website=website, location=loc, size_signal='',
        fit_rationale=rationale, contact_route=contact, decision_maker_role='', source_url=src or website,
        source_type='company-site', confidence=conf, notes=note)

ex('ByrdAdatto','https://byrdadatto.com/','Dallas, TX','https://byrdadatto.com/contact/',
   'The healthcare law firm AmSpa partners with for member legal questions; it sells the paid attorney hour that ScopeIQ is priced against.',
   'EXCLUDED: direct competitor for the same spend and AmSpa\'s incumbent legal partner. Named in the ScopeIQ phase-1 evidence file.')
ex('Lengea Law','','New York, NY','',
   'Med spa and healthcare law firm publishing CPOM/MSO analyses (cited in the CT Acquisitions 2026 report on California SB 351).',
   'EXCLUDED: competitor. lengea.com and www.lengea.com did not resolve from this environment on two attempts, so website is left empty.',
   'healthcare law firm (competitor)','secondary','https://ctacquisitions.com/guides/med-spa-ma-multiples-2026/')
ex('Jackson LLP Healthcare Lawyers','https://jacksonllp.com/','Chicago, IL','https://jacksonllp.com/contact-us/',
   'Healthcare law firm marketing directly to private practices including med spas on entity structure and CPOM.',
   'EXCLUDED: competitor. hello@jacksonllp.com published on its own site.')
ex('Cohen Healthcare Law Group','https://cohenhealthcarelaw.com/','Los Angeles, CA','https://cohenhealthcarelaw.com/healthcare-law/business-formation-partnership/',
   'Healthcare and FDA regulatory firm publishing med spa and MSO structuring analyses (cited on Oregon SB 951 in the CT Acquisitions report).',
   'EXCLUDED: competitor.')
ex('Nelson Hardiman','','Los Angeles, CA','',
   'California healthcare regulatory firm advising med spas and MSOs.',
   'EXCLUDED: competitor. nelsonhardiman.com returned HTTP 202 (bot interstitial) on two attempts; website left empty.',
   'healthcare law firm (competitor)','secondary','https://www.nelsonhardiman.com/')
ex('Frier Levitt','https://www.frierlevitt.com/','Pine Brook, NJ','https://www.frierlevitt.com/contact-us/',
   'Healthcare and life sciences firm advising on CPOM, MSO structures and compounded-drug supply for aesthetic and weight-loss clinics.',
   'EXCLUDED: competitor.')
ex('Chelle Law','','Scottsdale, AZ','',
   'Firm marketing med spa and nurse-practitioner scope-of-practice legal services.',
   'EXCLUDED: competitor. chellelaw.com returned HTTP 202 on two attempts; website left empty.',
   'healthcare law firm (competitor)','secondary','https://www.chellelaw.com/')
ex('Holland & Knight (med spa compliance practice)','','','',
   'National firm publishing med spa compliance analyses (e.g. "Medical Spa Compliance Under the Microscope", Aug 2026).',
   'EXCLUDED: competitor for the same advisory spend. Source is the phase-1 ScopeIQ evidence list; the firm site was not opened in this pass.',
   'healthcare law firm (competitor)','unverified','https://www.hklaw.com/en/insights/publications/2026/08/medical-spa-compliance-under-the-microscope')
ex('Brewster Law','','Texas','',
   'Texas firm publishing med spa business-structure guides.',
   'EXCLUDED: competitor. Source is the phase-1 ScopeIQ evidence list; site not opened in this pass.',
   'healthcare law firm (competitor)','unverified','https://brewsterlawtx.com/medical-spa/texas-med-spa-business-structure/2517-2/')

ex('MedSpa Standards','https://medspastandards.com/','','support@medspastandards.com',
   'Sells med spa compliance protocols, SOPs and a "med spa regulations by state" library - the closest direct substitute for ScopeIQ\'s report.',
   'EXCLUDED: direct competitor. Named in the ScopeIQ phase-1 evidence file. Generic support mailbox published on its own site.',
   'compliance content competitor')

# ---------------------------------------------------------------- more GLP-1 / weight-loss
def g1(name, website, loc, contact, rationale, note, conf='verified', src=None):
    row(prospect_type='end-customer', segment='GLP-1 / weight-loss clinic', name=name, website=website,
        location=loc, size_signal='', fit_rationale=rationale, contact_route=contact,
        decision_maker_role='head of clinical operations', source_url=src or website,
        source_type='company-site', confidence=conf, notes=note)

g1('Lindora','https://www.lindora.com/','Orange County, CA','https://www.lindora.com/contact',
   'Long-running clinic-based medical weight-loss chain now selling GLP-1 programmes; California is the state whose MSO rules changed on 1 Jan 2026.','')
g1('Physicians Weight Loss Centers','https://www.pwlc.com/','Akron, OH','https://www.pwlc.com/contact-us/',
   'Franchised medical weight-loss centres across multiple states; each franchisee needs a state-legal supervision structure to prescribe.','')
g1('CMWL - The Center for Medical Weight Loss','https://www.centerformedicalweightloss.com/','','https://www.centerformedicalweightloss.com/',
   'Network of physician-affiliated weight-loss practices across states; the network operator sets the clinical and supervision model.','')
g1('Ivim Health','https://www.ivimhealth.com/','Fort Wayne, IN','https://www.ivimhealth.com/',
   'Multi-state telehealth GLP-1 and hormone provider; licensure and compounded-drug rules differ per state.','')
g1('Henry Meds','https://www.henrymeds.com/','Scottsdale, AZ','https://www.henrymeds.com/',
   'National telehealth weight-loss and hormone provider operating through affiliated professional entities.','')
g1('Found','https://www.joinfound.com/','San Francisco, CA','https://www.joinfound.com/contact',
   'Telehealth weight-care company prescribing GLP-1s nationally.','')
g1('Noom','https://www.noom.com/','New York, NY','https://www.noom.com/',
   'Consumer weight programme that added clinician-prescribed GLP-1s, so it now carries multi-state medical practice risk.','')
g1('WeightWatchers Clinic','https://www.weightwatchers.com/us/clinic','New York, NY','https://www.weightwatchers.com/us/clinic',
   'Prescription weight-loss arm of WeightWatchers operating a telehealth clinical service across states.','')

# ---------------------------------------------------------------- more IV / hydration
def iv(name, website, loc, contact, rationale, note, conf='verified', src=None):
    row(prospect_type='end-customer', segment='IV therapy / wellness chain', name=name, website=website,
        location=loc, size_signal='', fit_rationale=rationale, contact_route=contact,
        decision_maker_role='head of clinical operations', source_url=src or website,
        source_type='company-site', confidence=conf, notes=note)

iv('Mobile IV Medics','https://mobileivmedics.com/','','https://mobileivmedics.com/contact-us/',
   'Mobile IV therapy delivered at home, work or hotel across several states - the delivery model with the least settled supervision rules.','')
iv('The Hydration Room','https://thehydrationroom.com/','Newport Beach, CA','https://thehydrationroom.com/',
   'IV therapy and vitamin injection clinic group operating multiple California locations under physician oversight.','')
iv('ThrIVe Drip Spa','https://thrivedripspa.com/','Houston, TX','https://thrivedripspa.com/franchise/',
   'IV therapy and beauty infusion franchise expanding across states; the franchisor answers the medical-direction question for franchisees.','')

# ---------------------------------------------------------------- multi-location med spa groups (platform portfolio companies and independents)
def grp(name, website, loc, contact, rationale, note, size='', conf='verified', src=None):
    row(prospect_type='end-customer', segment='multi-location med spa group', name=name, website=website,
        location=loc, size_signal=size, fit_rationale=rationale, contact_route=contact,
        decision_maker_role='owner-operator', source_url=src or website, source_type='company-site',
        confidence=conf, notes=note)

grp('LivingYoung Center for Health & Anti-Aging','https://livingyoungcenter.com/','St. Petersburg, FL',
    'https://livingyoungcenter.com/contact-us/',
    'Four-location Florida med spa and anti-aging group inside the Advanced MedAesthetic Partners platform.',
    'Locations named on its own site: St. Petersburg, Seminole, Palm Harbor, Odessa. Acquired by Advanced MedAesthetic Partners (2024, per PR Newswire).')
grp('Esthetics Center','https://estheticscenter.com/','El Dorado Hills, CA','https://estheticscenter.com/',
    'Facial plastic surgery and med spa group in Sacramento/El Dorado Hills; partner 001 of Alpha Aesthetics Partners.',
    'Named as Alpha Aesthetics Partners partner 001 on partnerwithalpha.com. California SB 351 applies from 1 Jan 2026.')
grp('Skin Care Institute','https://www.skincareinstitute.net/','Tulsa, OK','https://www.skincareinstitute.net/contact-us/',
    'Advanced aesthetic practice in Tulsa named as a Princeton Medspa Partners practice.',
    'Named in Princeton Medspa Partners press coverage as a platform practice.')
grp('Skinjectables','https://www.skinjectables.com/','Tucson, AZ','https://www.skinjectables.com/contact-us/',
    'Botox, filler and med spa practice in Tucson named as a Princeton Medspa Partners practice.',
    'Named in Princeton Medspa Partners press coverage as a platform practice.')
grp('Genesis MedSpa','https://www.genesismedspa.com/','Colorado Springs, CO','https://www.genesismedspa.com/',
    'Physician-owned Colorado Springs aesthetic practice acquired by Princeton Medspa Partners in 2023.',
    'Named in Princeton Medspa Partners press coverage.')
grp('Mirabile M.D. Beauty, Health & Wellness','https://mirabilemd.com/','Overland Park, KS','https://mirabilemd.com/',
    'Combined med spa, weight-loss and women\'s health practice; joined Princeton Medspa Partners in 2024.',
    'Named in the Princeton Medspa Partners PR Newswire release (2024). Practice name is the business name as published; no individual is recorded as a contact.')
grp('Skin Body Soul Spa','https://www.skinbodysoul.com/','West Des Moines, IA','https://www.skinbodysoul.com/book-now',
    'Iowa med spa group; two of its locations were acquired by OrangeTwist, which is the pattern ScopeIQ sells into.',
    'AmSpa news (Jan 2026) reported OrangeTwist acquiring two Skin Body Soul locations.',
    '', 'verified')
grp('Total Med Solutions','https://www.totalmedsolutions.com/','Dallas, TX','info@totalmedsolutions.com',
    'Multi-location Texas aesthetic and wellness group offering injectables, hormones and weight loss.',
    'Generic mailbox published on its own site. Also appears in the yellowpages Dallas medical-spa listings.')
grp('Vitalyc Medspa','https://www.vitalycmedspa.com/','Dallas, TX','https://www.vitalycmedspa.com/',
    'Multi-location Texas med spa brand (Dallas/Oak Lawn and beyond).','Also appears in the yellowpages Dallas medical-spa listings.')
