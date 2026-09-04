#!/usr/bin/env python3
"""Build phase-3-acquisition/prospects/staylegal/prospects.csv.

End-customer rows are assembled from the per-city management-company lists
already harvested into raw/ (BNBCalc, One Fine BnB, the Outer Banks agency
list) and joined to the websites confirmed by scripts/find_domains.py.
Partner / channel / excluded rows are curated below, each carrying the URL that
was actually opened, and enriched from raw/known_verified.json (titles, generic
mailboxes, contact pages and self-stated size signals read off those sites).

Run from the repo root: python3 scripts/build_prospects.py
"""
import csv, json, os, re

D = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(D):
    D = "."
APP = "staylegal"
DATE = "2026-09-03"
COLS = ["app","prospect_type","segment","name","website","location","size_signal",
        "fit_rationale","contact_route","decision_maker_role","source_url",
        "source_type","confidence","collected_on","notes"]

# Entries that name a private individual rather than an organisation, plus
# article section headings that are not companies at all. Brief section 2.1.
NOT_ORGS = {
    "aisling baile", "julian reed", "dan tate team", "the doll team",
    "roompicks by antony", "sara levy-lambert", "local experience",
    "guest experience standards", "on-island operational reliability",
    "transparency and communication", "fit for hands-off and first-time hosts",
    "how to get started", "bottom line", "wrapping things up",
}

PARKED = re.compile(r"is for sale|hugedomains|domain (?:is )?for sale|buy this domain|"
                    r"snagged marketplace|godaddy|sedo|parked", re.I)


def usable_site(rec, name):
    """Reject a confirmed-looking URL that is really a domain-parking page, and
    reject a single-token brand matched on a non-.com TLD (too weak a signal:
    'Sonder' matched an unrelated sonder.co)."""
    site = rec.get("website", "")
    if not site:
        return ""
    if PARKED.search(rec.get("title", "")):
        return ""
    toks = [w for w in re.sub(r"[^a-z0-9 ]", " ", name.lower()).split()
            if w not in {"the", "and", "of", "llc", "inc", "co", "llp"} and len(w) > 2]
    if len(toks) < 2 and not site.endswith(".com"):
        return ""
    return site


SIZE_PHRASE = re.compile(
    r"((?:over|more than|nearly|about|approximately)\s+)?"
    r"([0-9][0-9,]{1,6})\s*\+?\s*"
    r"(properties|homes|vacation rentals|short[- ]term rentals|rentals|units|"
    r"cabins|condos|listings|doors|villas|apartments|franchise locations)", re.I)


def clean_size(snippet):
    """Reduce a harvested sentence to just the number-and-unit it states.

    The surrounding sentence sometimes names the owner by first name
    ("Mike, alongside his wife Vanessa, managed 200 properties"), which must
    never reach the file, so only the quantity phrase is kept."""
    if not snippet:
        return ""
    m = SIZE_PHRASE.search(snippet)
    if not m:
        return ""
    before, after = snippet[: m.start()], snippet[m.end():]
    # a figure inside a parenthetical usually belongs to some other company the
    # page is talking about ("...the largest manager in the U.S. (managing over
    # 65,000 homes)..."), so drop it rather than mis-attribute it
    if before.count("(") > before.count(")") and ")" in after:
        return ""
    return re.sub(r"\s+", " ", m.group(0)).strip()


rows = []
seen = set()


def add(**kw):
    kw.setdefault("app", APP)
    kw.setdefault("collected_on", DATE)
    for c in COLS:
        kw.setdefault(c, "")
    dedupe_site = re.sub(r"^https?://(www\.)?", "",
                         kw["website"].lower().strip()).rstrip("/")
    dedupe_name = re.sub(r"[^a-z0-9]", "", kw["name"].lower())
    key = (dedupe_name, dedupe_site)
    # two different names on the same website are the same organisation, but
    # only collapse that for companies - several conferences and publications
    # legitimately share one association or publisher domain
    if dedupe_site and kw["prospect_type"] == "end-customer" and \
            any(k[1] == dedupe_site for k in seen):
        return
    if key in seen or not kw["name"].strip() or not kw["source_url"].strip():
        return
    seen.add(key)
    rows.append({c: str(kw[c]).replace("\n", " ").strip() for c in COLS})


def load(p):
    fp = os.path.join(D, "raw", p)
    return json.load(open(fp)) if os.path.exists(fp) else {}


known = load("known_verified.json")


def kv(url, field, default=""):
    r = known.get(url) or {}
    return r.get(field) or default


def route(url):
    """Business contact route for a verified site: its contact page, else a
    generic mailbox published on it, else the site root."""
    r = known.get(url) or {}
    return r.get("contact") or r.get("partner") or r.get("email") or url


def live(url):
    """verified only when the page actually came back and was read."""
    return "verified" if (known.get(url) or {}).get("title") else "secondary"


# ---------------------------------------------------------------- end customers
def end_customers():
    dom = {}
    for f in ("domains.json", "domains2.json", "domains3.json"):
        for k, v in (load(f) or {}).items():
            if v.get("website") or k not in dom:
                dom[k] = v
    orgs = load("bnbcalc_orgs.json") or []
    extra = load("extra_orgs.json") or []
    obx = {o["name"]: o for o in (load("obx_companies.json") or []) if o.get("name")}
    sizes = load("sizes.json") or {}
    industry = load("industry.json") or {}

    ANCHORS = {"vacasa", "evolve", "evolve vacation rental", "avantstay", "awning",
               "sonder", "casago", "itrip", "redawning", "red awning", "natural retreats",
               "grand welcome", "kasa", "placemakr", "mint house", "wander", "vtrips",
               "skyrun", "summer", "frontdesk", "mynd", "homeriver group honolulu",
               "renters warehouse", "home365", "pure property management of colorado",
               "utopia management", "evernest richmond", "keyrenter"}

    # organisations already recorded as `excluded` competitors must not also be
    # emitted as end-customers from the city guides they themselves publish
    COMPETITORS = {"awning", "one fine bnb", "onefine bnb", "redawning", "red awning",
                   "checkmate rentals", "bnbcalc"}

    def emit(name, markets, srcs, src_type, homes=""):  # noqa: C901
        if name.lower().strip() in NOT_ORGS or name.lower().strip() in COMPETITORS:
            return
        rec = dom.get(name, {})
        site = usable_site(rec, name)
        ind = industry.get(name)
        ind_note = ""
        if site and ind is not None:
            if ind["ok"] is False and not ind["why"]:
                # the page came back but says nothing about rentals or property
                # management, so a same-name business elsewhere cannot be ruled
                # out (a "Park Place" car dealership, a "Mynd" video agency)
                site = ""
                ind_note = ("a domain built from the name returned a page with no "
                            "rental or property-management content, so no website is "
                            "asserted for this company")
            elif ind["ok"] is False:
                ind_note = ("homepage showed only limited category signals (" +
                            ind["why"] + ")")
            elif ind["ok"] is None:
                site = ""
                ind_note = "the candidate domain did not return a readable page"
        size = clean_size((sizes.get(name) or {}).get("size", "")) if site else ""
        if not size and site:
            size = clean_size(rec.get("size", ""))
        if homes:
            size = f"{homes} rental homes listed (Outer Banks agency guide)"
        loc = "; ".join(markets[:4])
        low = name.lower()
        anchor = low in ANCHORS
        franchise = not anchor and any(low.startswith(a + " ") for a in ANCHORS)
        seg = ("national str operator" if anchor else
               "str management company (franchise/branch)" if franchise else
               "str management company")
        if franchise:
            fit = ("Local franchise or branch of a national vacation-rental brand, "
                   "operating in " + (markets[0] if markets else "a regulated market") +
                   ": a separate business that files its own city STR permits.")
            role = "franchise owner / general manager"
        elif anchor:
            fit = ("National/multi-market manager holding STR permits in dozens of "
                   "regulated cities; an anchor logo, though likely too large for the "
                   "$149-249 per-property offer and better suited to a bulk/API deal.")
            role = "director of compliance"
        else:
            fit = ("Manages short-term rentals for owners in " + (markets[0] if markets else "a regulated market") +
                   ", so it holds and must renew a city STR permit for every unit it "
                   "takes on - the exact filing and renewal work StayLegal does.")
            role = "owner / principal"
        cr = ""
        if site:
            cr = rec.get("contact") or rec.get("email") or site
        notes = []
        if ind_note:
            notes.append(ind_note)
        if not site and not ind_note:
            notes.append("website not confirmed: no candidate domain built from the "
                         "name returned a page identifying this company")
        if len(markets) > 1:
            notes.append("listed in " + str(len(markets)) + " city guides")
        add(prospect_type="end-customer", segment=seg, name=name, website=site,
            location=loc, size_signal=size, fit_rationale=fit, contact_route=cr,
            decision_maker_role=role, source_url=srcs[0], source_type=src_type,
            confidence="verified" if site else "secondary",
            notes="; ".join(notes))

    for o in orgs:
        emit(o["name"], o.get("markets", []), o["srcs"], "list-article")
    for o in extra:
        homes = o.get("homes", "")
        st = "list-article"
        emit(o["name"], o.get("markets") or ([o["market"]] if o.get("market") else []),
             o["srcs"], st, homes)
    for n, o in obx.items():
        emit(n, ["Outer Banks, NC"],
             ["https://obxstuff.com/blogs/guides/comprehensive-list-of-outer-banks-vacation-rental-companies"],
             "list-article", o.get("homes", ""))


# ------------------------------------------------------------------- alliances
def alliances():
    ms = load("rr_markers.json") or []
    SRC = "https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers"
    for m in ms:
        name = (m.get("title") or "").strip()
        addr = (m.get("address") or "").strip()
        link = (m.get("link") or "").strip()
        if not name or "USA" not in addr and not re.search(r", [A-Z]{2}\b|, [A-Z][a-z]+$", addr):
            pass
        low = addr.lower()
        if any(c in low for c in ("canada", "portugal", "italy", "spain", "france",
                                  "scotland", "wales", "australia", "new zealand",
                                  "puerto rico", "europe", "uk", "ontario")):
            continue
        if link.startswith("http") and re.search(r"facebook|linkedin", link):
            link_site, note = "", "only a social-media page is published for this group"
        elif link.startswith("http"):
            link_site, note = link.split("?")[0], ""
        else:
            link_site, note = "", "no website published in the directory"
        statewide = bool(re.match(r"^[A-Za-z ]+, USA$", addr)) or addr.endswith(", USA") and "," not in addr[:-5]
        seg = "host association (state/regional)" if statewide else "host alliance (local)"
        ptype = "partner" if statewide else "channel"
        fit = ("Organised body of short-term-rental hosts and managers in a regulated "
               "market: reaches the individual host without listing one, and its members "
               "are exactly the operators who must register and renew permits.")
        conf = live(link_site) if link_site else "secondary"
        add(prospect_type=ptype, segment=seg, name=name, website=link_site,
            location=addr.replace(", USA", ""),
            size_signal=kv(link_site, "size") if link_site else "",
            fit_rationale=fit,
            contact_route=route(link_site) if link_site else "",
            decision_maker_role="executive director / board chair",
            source_url=SRC, source_type="association-directory",
            confidence=conf,
            notes=("listed in the Rent Responsibly association map API. " + note).strip())


# ---------------------------------------------------------- curated non-customers
# (prospect_type, segment, name, url, location, fit, role, source_url, source_type, notes)
CURATED = [
 # ---- PMS / software partners
 ("partner","str pms software","Hospitable","https://hospitable.com/","Remote (US/EU)","PMS for owner-operators with 1-50 units - the exact StayLegal buyer; a permit-status field inside the PMS is a natural bundle.","head of partnerships","https://hospitable.com/","company-site",""),
 ("partner","str pms software","Guesty","https://www.guesty.com/","New York, NY","Enterprise/pro PMS whose customers manage permits across many jurisdictions; its marketplace is a distribution route.","head of partnerships","https://www.guesty.com/","company-site",""),
 ("partner","str pms software","Hostaway","https://www.hostaway.com/","Toronto / global","PMS with a published integration marketplace (Breezeway, Turno, PriceLabs, Safely, Ximplifi); a compliance app would slot into the same shelf.","partnerships manager","https://www.hostaway.com/marketplace","company-site","marketplace listing of 20 integration partners read directly"),
 ("partner","str pms software","Lodgify","https://www.lodgify.com/","Barcelona / US","Direct-booking PMS aimed at small hosts; same buyer, no compliance product of its own.","head of partnerships","https://www.lodgify.com/","company-site","site returned 403 (Cloudflare challenge); domain confirmed live, page not read"),
 ("partner","str pms software","OwnerRez","https://www.ownerrez.com/","Grand Rapids, MI","PMS for serious owner-operators, strong US host community, no permit-filing feature.","head of partnerships","https://www.ownerrez.com/","company-site",""),
 ("partner","str pms software","Hostfully","https://www.hostfully.com/","San Francisco, CA","PMS plus guidebooks for boutique managers; sells to the multi-property host StayLegal monitors.","head of partnerships","https://www.hostfully.com/","company-site",""),
 ("partner","str pms software","Uplisting","https://www.uplisting.io/","London / US","PMS positioned at operators with 10+ listings, i.e. 10+ permits to keep alive.","head of partnerships","https://www.uplisting.io/","company-site",""),
 ("partner","str pms software","iGMS","https://www.igms.com/","Vancouver / US","Automation-first PMS for Airbnb hosts; audience overlaps the individual host buyer.","head of partnerships","https://www.igms.com/","company-site",""),
 ("partner","str pms software","Smoobu","https://www.smoobu.com/","Berlin / US","All-in-one PMS for small hosts; a US compliance add-on is a gap in its stack.","head of partnerships","https://www.smoobu.com/","company-site",""),
 ("partner","str pms software","Hostify","https://hostify.com/","Sofia / US","PMS for growing management companies with multi-city portfolios.","head of partnerships","https://hostify.com/","company-site",""),
 ("partner","str pms software","Tokeet","https://www.tokeet.com/","Miami, FL","PMS that states it powers over 60,000 properties - a large installed base of permit holders.","head of partnerships","https://www.tokeet.com/","company-site",""),
 ("partner","str pms software","Streamline (Streamline VRS)","https://www.streamlinevrs.com/","Sparks, NV","Enterprise vacation-rental PMS used by large resort-market managers.","head of partnerships","https://www.streamlinevrs.com/","company-site",""),
 ("partner","str pms software","Track / TravelNet Solutions","https://www.tnsinc.com/","Minneapolis, MN","Track PMS serves professional VRMs in permit-heavy beach and mountain markets.","head of partnerships","https://www.tnsinc.com/","company-site",""),
 ("partner","str pms software","Escapia (Expedia Group)","https://www.escapia.com/","Seattle, WA","Escapia is the incumbent PMS for many legacy resort-market rental agencies.","head of partnerships","https://www.escapia.com/","company-site",""),
 ("partner","str pms software","Barefoot Technologies","https://www.barefoot.com/","Fredericksburg, VA","Long-standing VRM software vendor with a professional-manager base.","head of partnerships","https://www.barefoot.com/","company-site",""),
 ("partner","str pms software","Rentals United","https://rentalsunited.com/","Barcelona / US","Channel manager sitting between managers and OTAs; a compliance signal is complementary.","head of partnerships","https://rentalsunited.com/","company-site",""),
 ("partner","str pms software","Beds24","https://beds24.com/","Remote","Low-cost PMS/channel manager used by independent hosts.","head of partnerships","https://beds24.com/","company-site","homepage returned no <title>; content read"),
 ("partner","str pms software","CiiRUS","https://www.ciirus.com/","Fort Myers, FL","PMS concentrated in Orlando/Kissimmee, one of the most permit-heavy STR markets.","head of partnerships","https://www.ciirus.com/","company-site",""),
 ("partner","str pms software","Lodgix","https://www.lodgix.com/","Denver, CO","Budget PMS for small managers in Colorado's permit-capped mountain towns.","head of partnerships","https://www.lodgix.com/","company-site",""),
 ("partner","str pms software","Kigo","https://www.kigo.net/","US / global","Vacation-rental PMS brand now inside Guesty; installed base of professional managers.","head of partnerships","https://www.kigo.net/","company-site","kigo.net now serves Guesty content"),
 ("partner","str pms software","LiveRez","https://www.liverez.com/","Eagle, ID","PMS plus website builder for independent vacation-rental managers.","head of partnerships","https://www.liverez.com/","company-site",""),
 ("partner","str pms software","Zeevou","https://www.zeevou.com/","London / US","PMS for professional hosts scaling multi-unit portfolios.","head of partnerships","https://www.zeevou.com/","company-site",""),
 ("partner","str guest experience software","StayFi","https://www.stayfi.com/","New York, NY","Guest-wifi marketing used by VRMs; shares the same buyer and publishes VRM media (VRM Insider).","head of partnerships","https://www.stayfi.com/","company-site",""),
 ("partner","str guest experience software","Touch Stay","https://www.touchstay.com/","UK / US","Digital guidebooks; a permit/registration number is a required disclosure in several cities and could ride in the guidebook.","head of partnerships","https://www.touchstay.com/","company-site",""),
 ("partner","str guest experience software","Enso Connect","https://ensoconnect.com/","Toronto, ON","Guest-experience platform for STR operators; complementary, not competing.","head of partnerships","https://ensoconnect.com/","company-site",""),
 ("partner","str guest experience software","Duve","https://duve.com/","Tel Aviv / US","Guest management platform used by STR and hospitality operators.","head of partnerships","https://duve.com/","company-site",""),
 # ---- pricing & data
 ("partner","str pricing & data","PriceLabs","https://www.pricelabs.co/","Chicago, IL","Revenue-management tool with a very large host base; its blog and events list already reach the buyer.","head of partnerships","https://www.pricelabs.co/","company-site",""),
 ("partner","str pricing & data","Wheelhouse","https://www.usewheelhouse.com/","San Francisco, CA","Dynamic pricing across 1,500+ markets; each market is a permit regime StayLegal indexes.","head of partnerships","https://www.usewheelhouse.com/","company-site",""),
 ("partner","str pricing & data","Beyond","https://www.beyondpricing.com/","San Francisco, CA","Revenue management for professional managers; adjacent, non-overlapping product.","head of partnerships","https://www.beyondpricing.com/","company-site",""),
 ("partner","str pricing & data","DPGO","https://www.dpgo.com/","New York, NY","AI pricing tool for Airbnb hosts.","head of partnerships","https://www.dpgo.com/","company-site",""),
 ("partner","str pricing & data","Key Data Dashboard","https://www.keydatadashboard.com/","Charleston, SC","Benchmarking data for professional managers; sells into the same VRM buyer.","head of partnerships","https://www.keydatadashboard.com/","company-site",""),
 ("partner","str pricing & data","AirDNA","https://www.airdna.co/","Denver, CO","STR market data; publishes regulation-sensitive market reports and runs the STR Data Lab podcast.","head of partnerships","https://www.airdna.co/","company-site","site returned 403 (Cloudflare challenge); domain confirmed live, page not read"),
 ("partner","str pricing & data","Rabbu","https://www.rabbu.com/","Charlotte, NC","STR investment analytics and property marketplace; buyers need a permit answer before closing.","head of partnerships","https://www.rabbu.com/","company-site","site returned 403 (Cloudflare challenge); domain confirmed live, page not read"),
 ("partner","str pricing & data","Rented.com","","Atlanta, GA","Revenue management and VRM brokerage serving professional managers.","head of partnerships","https://www.hostaway.com/marketplace","directory","domain did not resolve from this environment; website left empty"),
 # ---- operations
 ("partner","str operations software","Breezeway","https://www.breezeway.io/","Boston, MA","Property-care and inspection platform; already an integration partner of the major PMSs, and its inspection record is evidence cities ask for.","head of partnerships","https://www.breezeway.io/","company-site",""),
 ("partner","str operations software","Turno","https://turno.com/","Miami, FL","Cleaner marketplace touching essentially every STR turnover in the US.","head of partnerships","https://www.hostaway.com/marketplace","directory","site returned 403 (Cloudflare challenge); listed in Hostaway's marketplace"),
 ("partner","str operations software","Minut","https://www.minut.com/","Malmo / US","Noise and occupancy sensor; states over 50,000 property managers. Several cities require noise monitoring as a permit condition.","head of partnerships","https://www.minut.com/","company-site",""),
 ("partner","str operations software","NoiseAware","https://noiseaware.com/","Dallas, TX","Noise monitoring explicitly sold as a compliance/good-neighbour tool - the closest adjacent sale to a permit service.","head of partnerships","https://noiseaware.com/","company-site",""),
 ("partner","str operations software","Operto","https://operto.com/","Vancouver, BC","Access and operations platform, states 20,000+ property managers.","head of partnerships","https://operto.com/","company-site",""),
 ("partner","str operations software","RemoteLock","https://www.remotelock.com/","Denver, CO","Smart-access vendor for STR operators.","head of partnerships","https://www.remotelock.com/","company-site",""),
 ("partner","str operations software","Schlage (Allegion)","https://www.schlage.com/","Carmel, IN","Smart-lock brand with an STR partner programme reaching hosts.","channel partner manager","https://www.schlage.com/","company-site",""),
 ("partner","str operations software","August Home","https://august.com/","San Jose, CA","Smart-lock brand widely installed in STRs.","channel partner manager","https://august.com/","company-site",""),
 ("partner","str operations software","Properly","https://www.getproperly.com/","Vancouver, BC","Vacation-rental operations and managed services.","head of partnerships","https://www.getproperly.com/","company-site",""),
 ("partner","str operations software","Doinn","https://doinn.co/","Lisbon / US","Housekeeping and linen operations software for STR managers.","head of partnerships","https://doinn.co/","company-site",""),
 ("partner","str cleaning","TIDY","https://www.tidy.com/","San Francisco, CA","Cleaning and maintenance platform serving STR and multifamily units at scale.","head of partnerships","https://www.tidy.com/","company-site",""),
 ("partner","str cleaning","MaidThis Franchise","https://maidthis.com/","Los Angeles, CA","STR-turnover cleaning franchise operating in several permit-heavy metros; cleaners touch every host.","franchise development lead","https://maidthis.com/","company-site",""),
 ("partner","str cleaning","ResortCleaning","","US","Cleaning-operations software used by resort-market rental agencies.","head of partnerships","https://rapideyeinspections.com/blog/largest-vacation-rental-cleaning-companies/","list-article","site returned 403 (Cloudflare challenge); website left empty"),
 ("partner","str cleaning","Cleanster","","Toronto / US","On-demand cleaning marketplace listed among the largest STR cleaning providers.","head of partnerships","https://rapideyeinspections.com/blog/largest-vacation-rental-cleaning-companies/","list-article","not independently opened"),
 ("partner","str cleaning","Hello Cleaners","","US (23 states)","STR turnover cleaning across 23 states per the source article.","head of partnerships","https://rapideyeinspections.com/blog/largest-vacation-rental-cleaning-companies/","list-article","not independently opened"),
 # ---- screening / insurance / lending
 ("partner","guest screening & damage","Autohost","https://www.autohost.ai/","Toronto, ON","Guest screening for STR operators; sells risk reduction to the same buyer.","head of partnerships","https://www.autohost.ai/","company-site",""),
 ("partner","guest screening & damage","Truvi (formerly SUPERHOG)","https://truvi.com/","London / US","Guest screening and damage protection; bundles neatly with a compliance guarantee.","head of partnerships","https://truvi.com/","company-site",""),
 ("partner","guest screening & damage","Safely","https://safely.com/","Atlanta, GA","Guest verification plus STR insurance; already a Hostaway marketplace partner.","head of partnerships","https://safely.com/","company-site",""),
 ("partner","guest screening & damage","Waivo","","US","Security-deposit alternative for STRs.","head of partnerships","https://www.hostaway.com/marketplace","directory","domain did not resolve from this environment; website left empty"),
 ("partner","str insurance","Proper Insurance","https://www.proper.insure/","Bozeman, MT","STR-specific insurance; many city permits require proof of a $500k-$1m liability policy, so the two products are filed together.","head of partnerships","https://www.proper.insure/","company-site",""),
 ("partner","str insurance","Steadily","https://www.steadily.com/","Austin, TX","Landlord/STR insurance sold online to the same self-serve buyer.","head of partnerships","https://www.steadily.com/","company-site",""),
 ("partner","str insurance","Obie","https://www.obierisk.com/","Chicago, IL","Digital insurance for rental-property investors.","head of partnerships","https://www.obierisk.com/","company-site",""),
 ("partner","str insurance","CBIZ","https://www.cbiz.com/","Cleveland, OH","Professional-services firm with a vacation-rental insurance practice.","practice leader, hospitality","https://www.cbiz.com/","company-site",""),
 ("partner","str lending","Host Financial","https://hostfinancial.com/","Charleston, SC","Lends specifically against STR income; borrowers must show the property can legally operate.","head of partnerships","https://hostfinancial.com/","company-site",""),
 ("partner","str lending","Visio Lending","https://www.visiolending.com/","Austin, TX","DSCR lender for STR investors; permit status is a live underwriting question.","head of partnerships","https://www.visiolending.com/","company-site","site returned 403 (Cloudflare challenge); domain confirmed live, page not read"),
 ("partner","str lending","Kiavi","https://www.kiavi.com/","San Francisco, CA","Investor lender whose borrowers convert properties to STR use.","head of partnerships","https://www.kiavi.com/","company-site",""),
 ("partner","str lending","Easy Street Capital","https://www.easystreetcap.com/","Austin, TX","Investor lender active in STR purchases.","head of partnerships","https://www.easystreetcap.com/","company-site",""),
 # ---- accounting / tax
 ("partner","str accounting & tax","Ximplifi","https://ximplifi.com/","Nashville, TN","Outsourced accounting built for vacation-rental managers; already a Hostaway marketplace partner.","head of partnerships","https://ximplifi.com/","company-site",""),
 ("partner","str accounting & tax","Clearing","https://www.clearing.co/","New York, NY","Bookkeeping built for short-term-rental operators.","head of partnerships","https://www.clearing.co/","company-site","site returned a Vercel security checkpoint (429); domain confirmed live, page not read"),
 ("partner","str accounting & tax","Baselane","https://www.baselane.com/","New York, NY","Banking and bookkeeping for landlords and STR owners.","head of partnerships","https://www.baselane.com/","company-site",""),
 ("partner","str accounting & tax","Hall CPA (The Real Estate CPA)","https://www.therealestatecpa.com/","Raleigh, NC","Tax firm with a large STR-investor audience and its own podcast and community.","head of partnerships","https://www.therealestatecpa.com/","company-site","returned HTTP 202 with no readable body; domain confirmed live"),
 ("partner","str accounting & tax","Shared Economy Tax","https://sharedeconomycpa.com/","Los Angeles, CA","CPA firm specialising in Airbnb and gig-economy hosts.","head of partnerships","https://sharedeconomycpa.com/","company-site",""),
 # ---- furnishing / design
 ("partner","str furnishing & design","STR Cribs","","US (nationwide)","Design, renovation and furnishing firm working exclusively on short-term rentals; meets the owner at the moment the permit is needed.","head of partnerships","https://www.techvestor.com/blog/best-airbnb-companies-design-renovation-construction","list-article","named in two independent round-ups; site not opened"),
 ("partner","str furnishing & design","Fulhaus","","Montreal / US","Furnishing platform for STR operators; its own comparison page lists the category.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","Furnishr","","Toronto / US","Turnkey furnishing for rental properties.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","Showplace","","New York, NY","Furnishing and design service listed among the main STR furnishing vendors.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","Minoan","https://www.minoan.com/","New York, NY","Retail-partnership platform used by STR operators to furnish and monetise homes.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","Bee Setups","","US","STR setup and furnishing company named in Fulhaus's comparison.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","CORT Furniture Rental","","Chantilly, VA","Furniture rental option for STR setups.","head of partnerships","https://fulhaus.com/best-airbnb-furnishing-companies","list-article",""),
 ("partner","str furnishing & design","Furnish Found","","US","Full-service STR furnishing firm ranked first in RedAwning's round-up.","head of partnerships","https://www.redawning.com/pm/post/10-best-airbnb-furnishing-companies-services","list-article",""),
 ("partner","str furnishing & design","Somerled Designs","","US (virtual)","Virtual Airbnb design firm named in Techvestor's round-up.","head of partnerships","https://www.techvestor.com/blog/best-airbnb-companies-design-renovation-construction","list-article",""),
 ("partner","str furnishing & design","BNB Interior","","US","STR interior-design firm named in Surge's round-up.","head of partnerships","https://www.gowithsurge.com/blog/best-airbnb-home-designers","list-article",""),
 ("partner","str furnishing & design","Hyphen & Co.","","US","STR design studio named in Surge's round-up.","head of partnerships","https://www.gowithsurge.com/blog/best-airbnb-home-designers","list-article",""),
 ("partner","str furnishing & design","Furniture Packages USA","","Central Florida","Turnkey furnishing for STRs in the Orlando/Kissimmee permit market.","head of partnerships","https://www.furniturepackagesusa.com/blog/communities/how-to-furnish-a-short-term-rental","list-article",""),
 # ---- realtors / brokerages
 ("partner","str realtor & brokerage","The Short Term Shop","https://theshorttermshop.com/","Knoxville, TN","STR-only brokerage with 40+ agents across 20+ markets and $3.5bn in closed STR transactions; every buyer it closes needs a permit filed next.","head of partnerships","https://www.prnewswire.com/news-releases/the-short-term-shop-surpasses-3-5-billion-in-short-term-rental-transactions-cementing-its-position-as-americas-largest-vacation-rental-real-estate-brokerage-302740157.html","press","size signal from the linked press release"),
 ("partner","str realtor & brokerage","Savvy STR Agents","","US (multi-market)","Referral network of STR-specialist agents listed across the STR Hub realtor directory.","network lead","https://strhub.com/compare-realtors/","directory","individual agents in this directory were deliberately not recorded"),
 ("partner","str realtor & brokerage","Duffy Homes Realty","","US","STR-focused brokerage listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","Rossman Homes","","US","STR-focused brokerage listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","Hazel Park Group","","US","STR-focused real-estate group listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","Rise Realty Advisors","","US","STR-focused brokerage listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","STR Accommodations","","US","STR brokerage/management firm listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","ABODE International Realty","","US","STR-focused brokerage listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","The Real Estate Collective","","US","STR-focused brokerage listed in the STR Hub realtor directory.","broker/owner","https://strhub.com/compare-realtors/","directory",""),
 ("partner","str realtor & brokerage","Techvestor","https://www.techvestor.com/","Austin, TX","STR investment platform buying and operating portfolios across regulated markets; publishes STR vendor round-ups.","head of partnerships","https://www.techvestor.com/blog/best-airbnb-companies-design-renovation-construction","company-site","homepage returned 403; blog page read"),
 ("partner","str realtor & brokerage","Arrived","https://arrivedhomes.com/","Seattle, WA","Fractional STR/rental investment platform; its properties sit in permit jurisdictions.","head of partnerships","https://arrivedhomes.com/","company-site",""),
 # ---- education / community / media
 ("partner","str education & community","BiggerPockets","https://www.biggerpockets.com/","Denver, CO","Largest US real-estate investing community with an active short-term-rental forum - the channel named in StayLegal's own thesis.","head of partnerships","https://www.biggerpockets.com/","company-site",""),
 ("partner","str education & community","Rent Responsibly","https://www.rentresponsibly.org/","Asheville, NC","Builds and supports local STR host alliances and publishes an STR regulations map; the single best partner for reaching organised hosts in regulated cities.","partnerships lead","https://www.rentresponsibly.org/alliances/","company-site","its association-map API supplied 100+ alliance rows in this file"),
 ("partner","str education & community","Thanks for Visiting","https://thanksforvisiting.com/","US","STR education brand and podcast selling courses to hosts; an affiliate route to the individual buyer.","partnerships lead","https://thanksforvisiting.com/","company-site",""),
 ("partner","str education & community","Vacation Rental Formula Business School","https://www.vacationrentalformula.com/","US","Long-running VRM education brand and podcast.","partnerships lead","https://www.vacationrentalformula.com/","company-site",""),
 ("partner","str education & community","Get Paid For Your Pad","https://getpaidforyourpad.com/","US","STR education brand and podcast for Airbnb operators.","partnerships lead","https://getpaidforyourpad.com/","company-site","homepage served a bot-verification page; title read"),
 ("partner","str education & community","Short Term Rental Secrets","","US","STR coaching brand and podcast named in the brief's channel list.","partnerships lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","site returned HTTP 522; website left empty"),
 ("partner","str education & community","Robuilt","https://robuilt.com/","US","STR education/creator brand (company and show recorded, not the individual).","partnerships lead","https://robuilt.com/","company-site","site returned 403; domain confirmed live, page not read"),
 ("partner","str education & community","Boostly","","UK / US","Direct-booking education brand and podcast for STR hosts.","partnerships lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article",""),
 ("partner","str association","Vacation Rental Management Association (VRMA)","https://www.vrma.org/","Washington, DC","The industry association for professional vacation-rental managers; its members are the multi-permit organisations StayLegal sells to.","membership director","https://www.vrma.org/","association-directory","member directory pages returned 403 from this environment; only the public homepage was readable"),
 ("partner","str association","VRNation","https://www.vrnation.com/","Bend, OR","Vacation-rental association for property managers and hosts, runs its own annual conference.","membership director","https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers","association-directory",""),
 ("partner","str association","Right to Rent Collaborative","https://r2rcollaborative.org/","US (national)","National coalition co-ordinating STR advocacy across local alliances.","executive director","https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers","association-directory",""),
 # ---- channels: conferences
 ("channel","industry conference","VRMA International Conference (VRMA 26 Nashville)","https://www.vrma.org/","Nashville, TN","The largest US gathering of professional vacation-rental managers; October 2026 in Nashville, itself a permit-regime city.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article","dates per the source article"),
 ("channel","industry conference","VRMA Executive Summit","https://www.vrma.org/","Rancho Palos Verdes, CA","Senior-level VRM event; May 2026 per the source.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","VRNation Annual Conference","https://www.vrnation.com/","Phoenix, AZ","Association conference for managers and hosts; March 2026 in Phoenix.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","DARM Conference (Data, AI, Revenue & Marketing)","https://www.vrmintel.com/","Atlanta, GA","VRM Intel's conference for data-driven managers; December 2026 in Atlanta.","sponsorship / exhibitor sales","https://www.rentalscaleup.com/short-term-rental-conferences-2026/","list-article","organiser page 403; event details from the conference round-ups"),
 ("channel","industry conference","STR Wealth Conference","https://strwealthconference.com/","US","Host-facing conference aimed at operators scaling to 20+ listings - the multi-permit buyer.","sponsorship / exhibitor sales","https://strwealthconference.com/","company-site",""),
 ("channel","industry conference","Vacation Rental World Summit","https://www.vacationrentalworldsummit.com/","International","Long-running independent VR conference.","sponsorship / exhibitor sales","https://www.vacationrentalworldsummit.com/","company-site","returned HTTP 202 with no readable body"),
 ("channel","industry conference","The Book Direct Show","","International / US","Direct-booking event for VRMs and hosts.","sponsorship / exhibitor sales","https://www.avantio.com/blog/short-term-rental-conference/","list-article","bookdirect.show returned HTTP 522; website left empty"),
 ("channel","industry conference","Level Up Your Listing Summit","","US","Host-facing STR summit named in the conference round-ups.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","IMN Short-Term Rental Forum","","US (winter & summer editions)","Institutional STR investment forum; reaches portfolio operators.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","Poconos Short-Term Rental Conference","https://www.poconosvro.org/","Pocono Mountains, PA","Regional STR conference in a market with active township-by-township permit fights.","event organiser","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","VTSTRA Vermont Short-Term Rental Conference & Trade Show","https://vtstra.org/","Vermont","State-level STR conference and trade show.","event organiser","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","Vacation Rental Xtravaganza (FAVR)","https://floridaavr.org/","Florida","Florida Alliance for Vacation Rentals' annual event in a heavily regulated state.","event organiser","https://www.avantio.com/blog/short-term-rental-conference/","list-article",""),
 ("channel","industry conference","Michigan STR Conference","https://www.michiganstra.org/","Michigan","State association conference in a market with contested local STR ordinances.","event organiser","https://www.lodgify.com/blog/vacation-rental-industry-events/","list-article",""),
 ("channel","industry conference","GuestyVal","https://www.guesty.com/","US","Guesty's customer conference for professional managers.","sponsorship / exhibitor sales","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","list-article",""),
 ("channel","industry conference","VRMA Foundations: Frontline Excellence Training","https://www.vrma.org/","US","VRMA training programme reaching operational staff at member companies.","programme manager","https://www.lodgify.com/blog/vacation-rental-industry-events/","list-article",""),
 ("channel","industry conference","Direct Booking Success Summit","","Online","Host-facing direct-booking summit.","sponsorship / exhibitor sales","https://www.lodgify.com/blog/vacation-rental-industry-events/","list-article",""),
 ("channel","industry conference","STR Hospitality Summit","","US","STR event listed on the Rent Responsibly events calendar.","event organiser","https://www.rentresponsibly.org/alliances/","company-site",""),
 ("channel","industry conference","HostGPOpen (Palm Springs)","","Palm Springs, CA","Local host-community event in a city with a capped STR permit programme.","event organiser","https://www.rentresponsibly.org/alliances/","company-site",""),
 # ---- channels: media
 ("channel","podcast & newsletter","Thanks For Visiting (podcast)","https://thanksforvisiting.com/","US","Top-ranked STR host podcast; sponsorship reaches individual hosts without listing them.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only, no host names recorded"),
 ("channel","podcast & newsletter","Vacation Rental Success Podcast","","US","VRM-focused podcast in the top-15 list.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","Good Morning Hospitality","","US","Daily STR/hospitality news show.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","Get Paid For Your Pad (podcast)","https://getpaidforyourpad.com/","US","Long-running Airbnb-host podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","STR Data Lab by AirDNA","https://www.airdna.co/","Denver, CO","Data-led STR podcast produced by AirDNA.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","The Boostly Podcast","","UK / US","Direct-booking podcast for STR hosts.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","The STR Sisterhood","","US","Community-driven STR podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","Rental Scale-Up","https://www.rentalscaleup.com/","EU / US","Newsletter and podcast read by professional managers; also runs conference coverage.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","site returned 403; show/newsletter name only"),
 ("channel","podcast & newsletter","Alex & Annie: The Real Women of Vacation Rentals","","US","Widely followed VR industry podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","The Vacation Rental Manager's Podcast","","US","VRM-operator podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only; host names deliberately omitted"),
 ("channel","podcast & newsletter","Heads In Beds Show","","US","STR marketing and direct-booking podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","podcast & newsletter","No Vacancy The Podcast","","US","Host-facing STR podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only; host name deliberately omitted"),
 ("channel","podcast & newsletter","The Vacation Rental Show","","US","VR industry podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only; host name deliberately omitted"),
 ("channel","podcast & newsletter","Vacation Rental Revolution Podcast","","US","Portfolio-scaling STR podcast.","sponsorship lead","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/","list-article","show name only"),
 ("channel","industry publication","VRM Intel","https://www.vrmintel.com/","Memphis, TN","Trade publication for professional vacation-rental managers; runs DARM.","advertising / sponsorship","https://www.vrmintel.com/","company-site",""),
 ("channel","industry publication","StayFi VRM Insider","https://www.stayfi.com/","New York, NY","VRM-facing editorial arm publishing the conference and podcast round-ups used in this research.","editor / partnerships","https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/","company-site",""),
 ("channel","online community","r/AirBnB (subreddit)","","Online","Large host community named in StayLegal's own distribution thesis.","moderator team","https://www.reddit.com/r/AirBnB/","directory","reddit.com is blocked from this environment; recorded as a name only, not opened"),
 ("channel","online community","r/airbnb_hosts (subreddit)","","Online","Host-only subreddit.","moderator team","https://www.reddit.com/r/airbnb_hosts/","directory","reddit.com is blocked from this environment; name only, not opened"),
 ("channel","online community","r/ShortTermRentals (subreddit)","","Online","STR operator subreddit.","moderator team","https://www.reddit.com/r/ShortTermRentals/","directory","reddit.com is blocked from this environment; name only, not opened"),
 ("channel","online community","r/vrbo (subreddit)","","Online","Vrbo host community.","moderator team","https://www.reddit.com/r/vrbo/","directory","reddit.com is blocked from this environment; name only, not opened"),
 ("channel","online community","BiggerPockets Short-Term Rental Forum","https://www.biggerpockets.com/","Denver, CO","The forum StayLegal's thesis names as its first distribution channel.","community manager","https://www.biggerpockets.com/guides/the-ultimate-guide-to-short-term-rental-properties","company-site",""),
 # ---- excluded: competitors and adjacent enforcement vendors
 ("excluded","str compliance competitor","Avalara MyLodgeTax","https://www.avalara.com/mylodgetax/en/index.html","Durham, NC / Denver, CO","Sells the tax-registration and lodging-tax slice per property at roughly the price StayLegal targets, and already handles some licence registrations. Treat as a competitor first; a referral arrangement is only plausible if it stays out of permit filing.","n/a - competitor","https://www.avalara.com/mylodgetax/en/index.html","company-site","the brief asked for a partner-or-excluded call: recorded as excluded because its registration service overlaps the core job, with a partner note"),
 ("excluded","str compliance competitor","Granicus (Host Compliance)","https://granicus.com/solution/govservice/host-compliance/","Denver, CO","Sits on the enforcement side: sells STR monitoring, registration portals and complaint hotlines to cities. It creates StayLegal's demand but must never be pitched as a customer.","n/a - competitor (enforcement side)","https://granicus.com/solution/govservice/host-compliance/","company-site",""),
 ("excluded","str compliance competitor","Deckard Technologies (Rentalscape)","https://www.deckard.com/","San Diego, CA","Rentalscape is the city-side STR identification and compliance product; the site states it is trusted by more than 400 jurisdictions.","n/a - competitor (enforcement side)","https://www.deckard.com/","company-site","rentalscape.com resolves to the same Deckard site"),
 ("excluded","str compliance competitor","STR Comply","https://www.strcomply.us/","US","Sells an address-level 'is your Airbnb legal' compliance check - the informational half of StayLegal's product.","n/a - competitor","https://www.strcomply.us/","company-site",""),
 ("excluded","str compliance competitor","STRrequirements.com","","US","Charges roughly $6.99 per property per month for STR compliance information; cited in StayLegal's own evidence.","n/a - competitor","https://www.strcomply.us/blog/strrequirements-com-alternatives-3","press","domain did not resolve from this environment; website left empty"),
 ("excluded","str compliance competitor","STR Helper","","US","City-side STR monitoring and compliance vendor.","n/a - competitor (enforcement side)","https://www.strcomply.us/blog/strrequirements-com-alternatives-3","press","strhelper.com did not resolve from this environment"),
 ("excluded","str compliance competitor","Harmari (LTAS Technologies)","https://harmari.com/","Toronto, ON","Sells STR address identification and compliance monitoring to municipalities.","n/a - competitor (enforcement side)","https://harmari.com/","company-site",""),
 ("excluded","str compliance competitor","GovOS (MUNIRevs / LODGINGRevs)","https://www.govos.com/","Austin, TX","Runs the STR licensing and lodging-tax portals for many of the jurisdictions in cities.csv; the filing counterparty, not a customer.","n/a - government software vendor","https://www.govos.com/","company-site","appears as the named vendor on many jurisdiction rows in cities.csv"),
 ("excluded","str compliance competitor","Avenu Insights & Analytics","https://www.avenuinsights.com/","Centreville, VA","Municipal revenue and licensing vendor operating STR registration systems.","n/a - government software vendor","https://www.avenuinsights.com/","company-site",""),
 ("excluded","str data & regulation tool","BNBCalc","https://www.bnbcalc.com/","US","Publishes free per-city STR regulation guides covering 1,200+ jurisdictions - the informational layer StayLegal must beat on 'we file it for you', and the source of much of cities.csv.","n/a - competitor (information layer)","https://www.bnbcalc.com/blog/short-term-rental-regulation","company-site","robots.txt explicitly allows ClaudeBot"),
 ("excluded","str data & regulation tool","STR Profit Map","https://strprofitmap.com/regulations","US","Publishes 5,400+ per-jurisdiction STR regulation pages including resort markets; same information layer.","n/a - competitor (information layer)","https://www.strprofitmap.com/sitemap-regulations.xml","company-site","sitemap enumerated to fill the resort markets BNBCalc lacks"),
 ("excluded","str data & regulation tool","Chalet (getchalet.com)","","US","Publishes per-city STR regulation pages and STR investor services.","n/a - competitor (information layer)","https://www.getchalet.com/rental-regulations/gatlinburg-tn","company-site","site returned 429 rate-limit; website left empty"),
 ("excluded","str data & regulation tool","STR City Regs","","US","Per-city STR regulation reference site.","n/a - competitor (information layer)","https://strcityregs.com/tennessee/gatlinburg","company-site","not independently opened"),
 ("excluded","str data & regulation tool","STR Laws","","US","Per-city STR permit/tax reference site.","n/a - competitor (information layer)","https://strlaws.com/tennessee/gatlinburg/","company-site","not independently opened"),
 ("excluded","str data & regulation tool","BuildYourBnb","","US","Per-city STR regulation reference site.","n/a - competitor (information layer)","https://www.buildyourbnb.com/us-airbnb-and-short-term-rental-regulations/gatlinburg","company-site","sitemap.xml returned no location entries"),
 ("excluded","str data & regulation tool","PropertyZoned","https://www.propertyzoned.com/","US","Address-level STR zoning and regulation lookup.","n/a - competitor (information layer)","https://www.propertyzoned.com/guides/airbnb-short-term-rental-regulations","company-site","site returned a Vercel security checkpoint (429); page not read"),
 ("excluded","permit expediter","Permit Place","https://permitplace.com/","Los Angeles, CA","General building-permit expediter headquartered in Los Angeles with offices in San Francisco and Seattle; adjacent service, would compete on any 'we file it for you' positioning in LA.","n/a - adjacent competitor","https://permitplace.com/permitting-services/permit-expediting/california-permit-expediting/los-angeles/","company-site","city: Los Angeles"),
 ("excluded","permit expediter","Milrose Consultants (Permit Advisors)","https://www.milrose.com/","New York, NY / Los Angeles, CA","National permit-expediting group; acquired Permit Advisors, an LA-based expediter.","n/a - adjacent competitor","https://www.milrose.com/insights/a-permit-expediters-guide-to-los-angeles","company-site","cities: New York, Los Angeles"),
 ("excluded","permit expediter","PermitFlow","https://www.permitflow.com/","New York, NY","Software-led permit filing service; the closest software analogue to StayLegal in an adjacent permit category.","n/a - adjacent competitor","https://www.permitflow.com/blog/los-angeles-permit-expediter","company-site","city: Los Angeles (guide); operates nationally"),
 ("excluded","str management competitor","Awning","https://awning.com/","Los Angeles, CA","Publishes per-state and per-city 'best Airbnb management companies' guides while itself managing STRs; both a competitor for the manager relationship and a source used here.","n/a - competitor","https://awning.com/post/louisiana-airbnb-management-companies","company-site",""),
 ("excluded","str management competitor","One Fine BnB","https://www.onefinebnb.com/","US","Runs hundreds of per-city management-company comparison pages while managing STRs itself; a source used here and a competitor for the same manager relationships.","n/a - competitor","https://onefinebnb.com/best-vacation-rental-management-companies-in-new-orleans-louisiana","company-site",""),
 ("excluded","str management competitor","RedAwning","https://www.redawning.com/","Emeryville, CA","States it manages 20,000+ properties nationally and publishes per-city management round-ups; too large to buy the offer and competes for manager relationships.","n/a - competitor","https://www.redawning.com/pm/post/best-airbnb-management-in-gatlinburg-tennessee","company-site","size signal quoted from its own article"),
]


def curated():
    for (pt, seg, name, url, loc, fit, role, src, stype, note) in CURATED:
        size = kv(url, "size") if url else ""
        cr = route(url) if url else ""
        conf = live(url) if url else "secondary"
        if stype in ("list-article", "press", "directory") and not url:
            conf = "secondary"
        add(prospect_type=pt, segment=seg, name=name, website=url, location=loc,
            size_signal=size, fit_rationale=fit, contact_route=cr,
            decision_maker_role=role, source_url=src, source_type=stype,
            confidence=conf, notes=note)


# ------------------------------------------------------------- anchors with size
ANCHOR_ROWS = [
 ("Vacasa","https://www.vacasa.com/","Portland, OR","Largest US vacation-rental manager; holds permits in hundreds of jurisdictions. Named as an anchor logo but almost certainly too large for the $149-249 per-property offer."),
 ("Evolve","https://evolve.com/","Denver, CO","National half-service manager with tens of thousands of owner clients, many of whom still file their own permits - a referral route to the individual host."),
 ("AvantStay","https://www.avantstay.com/","Los Angeles, CA","Design-led STR operator across regulated leisure markets; multi-permit portfolio."),
 ("Casago","https://casago.com/","Scottsdale, AZ","Franchised vacation-rental manager (acquired Vacasa's brand) with local franchisees in permit markets - each franchise is a separate buyer."),
 ("iTrip Vacations","https://www.itrip.net/","Atlanta, GA","Franchise network of local vacation-rental managers; each franchise files its own city permits."),
 ("Grand Welcome","https://www.grandwelcome.com/","Los Angeles, CA","Franchised vacation-rental management brand appearing in Nashville, Orlando and San Diego city guides."),
 ("Property Management Inc (PMI)","https://www.propertymanagementinc.com/","Salt Lake City, UT","Franchise system whose STR division appears in the Kissimmee and Lake Havasu city guides."),
 ("Vtrips","https://www.vtrips.com/","Jacksonville, FL","Multi-market vacation-rental manager across southeast beach permit markets."),
 ("Natural Retreats","https://www.naturalretreats.com/","Jackson Hole, WY","Luxury vacation-rental manager across US mountain and beach destinations."),
 ("Wander","https://www.wander.com/","Austin, TX","Vertically integrated luxury STR operator holding permits on every home it owns or leases."),
 ("Kasa Living","https://kasa.com/","San Francisco, CA","Tech-enabled apartment-hotel operator; permits and registrations in many of the same cities."),
 ("Placemakr","https://placemakr.com/","Washington, DC","Flexible-living operator in regulated urban markets."),
 ("Mint House","https://www.minthouse.com/","New York, NY","Apartment-hotel brand operating in cities with STR registration regimes."),
 ("Sonder","https://www.sonder.com/","San Francisco, CA","Urban short-stay operator; appears in the New York city guide and faces the strictest registration regimes."),
 ("Twiddy & Company","https://www.twiddy.com/","Duck, NC","One of the largest Outer Banks agencies; a multi-hundred-permit operator in Dare County."),
 ("KEES Vacations","https://www.keesouterbanks.com/","Kill Devil Hills, NC","Outer Banks agency with 300+ homes per its own site."),
 ("Seaside Vacations","https://www.outerbanksvacations.com/","Kill Devil Hills, NC","Outer Banks rental agency."),
 ("Beach Realty & Construction / Kitty Hawk Rentals","https://www.beachrealtync.com/","Kitty Hawk, NC","Outer Banks agency operating since 1964."),
 ("Meredith Lodging","https://www.meredithlodging.com/","Oregon coast","Regional vacation-rental manager across Oregon coast permit towns."),
]


def anchors():
    sizes = load("sizes.json") or {}
    industry = load("industry.json") or {}
    for name, url, loc, fit in ANCHOR_ROWS:
        add(prospect_type="end-customer", segment="national str operator", name=name,
            website=url if live(url) == "verified" else url, location=loc,
            size_signal=(clean_size((sizes.get(name) or {}).get("size", ""))
                         or clean_size(kv(url, "size"))),
            fit_rationale=fit, contact_route=route(url),
            decision_maker_role="director of compliance / operations",
            source_url=url, source_type="company-site", confidence=live(url),
            notes="" if live(url) == "verified" else
                  "site did not return a readable page from this environment; domain recorded from the source list")


def main():
    anchors()
    end_customers()
    alliances()
    curated()
    with open(os.path.join(D, "prospects.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)
    from collections import Counter
    print(len(rows), "rows")
    print(Counter(r["prospect_type"] for r in rows))
    print(Counter(r["confidence"] for r in rows))


if __name__ == "__main__":
    main()
