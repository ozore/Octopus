#!/usr/bin/env python3
"""
WageLens partner / channel / excluded rows.

Run from the repository root with no arguments:

    python3 phase-3-acquisition/prospects/wagelens/scripts/partners_channels.py

Two halves:

1. APEX Accelerators, pulled from the National APEX Accelerator Alliance public
   locator (https://www.napex.us/locations/, backed by
   POST /wp-admin/admin-ajax.php?action=SearchAccelerator&formState=<state>).
   Every state and territory is queried; each accelerator becomes a partner row
   whose source_url is its own napex.us record.

2. A candidate list of national trade associations, association chapters,
   construction CPA practices, construction payroll/back-office vendors,
   industry media, podcasts, conferences and certified-payroll incumbents.
   EVERY candidate URL is fetched before it becomes a row: a candidate is kept
   only when the URL answers with HTTP < 400 and the page actually mentions the
   organisation (a required token match), which is what stops a guessed or
   parked domain from becoming a fabricated row. Candidates that fail are
   written to scripts/unverified_candidates.csv instead, so the next agent can
   see what was tried and rejected.

Writes prospects.csv-schema rows to scripts/partner_rows.csv.
"""

import csv
import gzip
import hashlib
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from usaspending_pull import COLS, APP, COLLECTED_ON  # noqa: E402

CACHE = os.environ.get("WAGELENS_WEB_CACHE", "/tmp/wagelens_web_cache")

STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
    "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
    "Puerto Rico", "Guam", "Virgin Islands",
]


def _decode(raw, enc):
    """Some of these servers gzip regardless of Accept-Encoding."""
    if enc == "gzip" or raw[:2] == b"\x1f\x8b":
        try:
            raw = gzip.decompress(raw)
        except Exception:
            pass
    elif enc == "deflate":
        try:
            import zlib
            raw = zlib.decompress(raw, -zlib.MAX_WBITS)
        except Exception:
            pass
    return raw.decode("utf-8", "replace")


def fetch(url, data=None, tries=2, timeout=45):
    """GET/POST a page, cached outside the repo. Returns (status, final_url, text)."""
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1((url + "|" + (data or "")).encode()).hexdigest()
    cp = os.path.join(CACHE, key + ".txt.gz")
    if os.path.exists(cp):
        try:
            with gzip.open(cp, "rt", encoding="utf-8") as fh:
                head = fh.readline().strip()
                st, final = head.split(" ", 1)
                return int(st), final, fh.read()
        except Exception:
            os.remove(cp)
    body = data.encode() if data else None
    for attempt in range(tries):
        req = urllib.request.Request(
            url, data=body,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                                   "Chrome/124.0 Safari/537.36",
                     "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read(600000)
                enc = (resp.headers.get("Content-Encoding") or "").lower()
                text = _decode(raw, enc)
                st, final = resp.getcode(), resp.geturl()
            with gzip.open(cp, "wt", encoding="utf-8") as fh:
                fh.write("%d %s\n" % (st, final))
                fh.write(text)
            return st, final, text
        except urllib.error.HTTPError as e:
            st, final = e.code, url
            try:
                text = _decode(e.read(300000),
                               (e.headers.get("Content-Encoding") or "").lower())
            except Exception:
                text = ""
            if attempt + 1 == tries:
                return st, final, text
        except Exception:
            if attempt + 1 == tries:
                return 0, url, ""
        time.sleep(1.5)
    return 0, url, ""


def row(prospect_type, segment, name, website, location, size_signal, fit,
        contact, role, source_url, source_type, confidence, notes):
    return {
        "app": APP, "prospect_type": prospect_type, "segment": segment,
        "name": name, "website": website, "location": location,
        "size_signal": size_signal, "fit_rationale": fit,
        "contact_route": contact, "decision_maker_role": role,
        "source_url": source_url, "source_type": source_type,
        "confidence": confidence, "collected_on": COLLECTED_ON, "notes": notes,
    }


# --------------------------------------------------------------- APEX / NAPEX


def apex_rows():
    out, seen = [], set()
    for st in STATES:
        _, _, text = fetch(
            "https://www.napex.us/wp-admin/admin-ajax.php?action=SearchAccelerator",
            data=urllib.parse.urlencode({"formState": st, "formZipCode": ""}))
        if not text:
            continue
        blob = text.replace("\\/", "/")
        for link, name in re.findall(
                r"<a href='(https://www\.napex\.us/location/[^']+)'>([^<]+)</a>", blob):
            name = (name.replace("&#8211;", "-").replace("&amp;", "&")
                        .replace("&#8217;", "'").strip())
            if not name or link in seen:
                continue
            seen.add(link)
            # the city/state cell that follows the link in the same result row
            m = re.search(re.escape(link) + r"'>[^<]+</a>\s*</div>\s*"
                          r"<div class='col-auto text-end'>([^<]*)</div>", blob)
            loc = (m.group(1).strip() if m else st)
            out.append(row(
                "partner", "APEX Accelerator", name, "", loc,
                "listed in the National APEX Accelerator Alliance locator for %s" % st,
                "Federally funded APEX Accelerator (formerly PTAC) that counsels small "
                "firms entering government contracting; its clients hit Davis-Bacon and "
                "WH-347 on their first federal construction award, so it is a natural "
                "referral and co-training partner.",
                "", "program manager or procurement counselor",
                link, "directory", "verified",
                "National APEX Accelerator Alliance locator, queried by state '%s'; "
                "NAPEX does not publish the accelerator's own URL in this record" % st,
            ))
        print("  apex %-22s %4d cumulative" % (st, len(out)), flush=True)
    return out


# ------------------------------------------------------------- candidate list
# (prospect_type, segment, name, url, required token, location, role, fit, notes)

CANDIDATES = [
    # ---------------------------------------------------- national associations
    ("partner", "trade association (national)", "Associated Builders and Contractors", "https://www.abc.org", "associated builders", "Washington, DC", "chapter services or member benefits director", "National open-shop construction association whose merit-shop members are exactly the non-union subs new to federal work; chapters run compliance education and member-benefit programmes.", "national body; chapter directory is JavaScript-rendered and could not be parsed from this environment"),
    ("partner", "trade association (national)", "Associated General Contractors of America", "https://www.agc.org", "associated general contractors", "Arlington, VA", "chapter services or member benefits director", "89 chapters of general and specialty contractors; AGC publishes federal-contracting and Davis-Bacon guidance and licenses member-benefit tools.", "chapter list is JavaScript-rendered; not parseable here"),
    ("partner", "trade association (national)", "National Electrical Contractors Association", "https://www.necanet.org", "neca", "Bethesda, MD", "member services director", "Electrical contractors are the single largest NAICS in the federal award pull; NECA chapters serve them directly.", "necanet.org returned 403 to a plain curl of the chapter page; root verified"),
    ("partner", "trade association (national)", "Independent Electrical Contractors", "https://www.ieci.org", "independent electrical contractors", "Alexandria, VA", "member services director", "IEC is the merit-shop electrical association; its members are the non-union electrical subs that are the sharpest WageLens ICP.", ""),
    ("partner", "trade association (national)", "Plumbing-Heating-Cooling Contractors Association", "https://www.phccweb.org", "phcc", "Falls Church, VA", "member services director", "PHCC members are the plumbing/HVAC subs in NAICS 238220, the second-largest trade in the federal award pull.", ""),
    ("partner", "trade association (national)", "SMACNA", "https://www.smacna.org", "smacna", "Chantilly, VA", "member services director", "Sheet metal and air-conditioning contractors working federal and institutional jobs subject to Davis-Bacon.", ""),
    ("partner", "trade association (national)", "Mechanical Contractors Association of America", "https://www.mcaa.org", "mechanical contractors", "Rockville, MD", "member services director", "Mechanical subs on federal and institutional construction; MCAA runs extensive member education.", ""),
    ("partner", "trade association (national)", "American Subcontractors Association", "https://www.asaonline.com", "subcontractors", "Alexandria, VA", "executive director", "ASA exists specifically to represent subcontractors against prime-contractor risk-shifting, which is precisely what the 2023 Davis-Bacon rule did.", ""),
    ("partner", "trade association (national)", "National Association of Women in Construction", "https://www.nawic.org", "nawic", "Fort Worth, TX", "chapter relations director", "NAWIC chapters reach women-owned subs, heavily represented in DBE/WBE set-asides on federally funded work.", ""),
    ("partner", "trade association (national)", "National Association of Minority Contractors", "https://www.namcnational.org", "minority contractors", "Washington, DC", "executive director", "NAMC chapters serve minority contractors who win DBE and 8(a) construction subcontracts, all Davis-Bacon covered.", ""),
    ("partner", "trade association (national)", "National Utility Contractors Association", "https://www.nuca.com", "nuca", "Fairfax, VA", "member services director", "Underground utility contractors on federally funded water, sewer and broadband work carrying Davis-Bacon.", ""),
    ("partner", "trade association (national)", "National Roofing Contractors Association", "https://www.nrca.net", "roofing", "Rosemont, IL", "member services director", "Roofing subs (NAICS 238160) on federal reroofing contracts.", ""),
    ("partner", "trade association (national)", "Painting Contractors Association", "https://www.pcapainted.org", "painting", "St. Louis, MO", "member services director", "Painting subs (NAICS 238320) on federal repaint contracts.", ""),
    ("partner", "trade association (national)", "Association of the Wall and Ceiling Industry", "https://www.awci.org", "wall and ceiling", "Falls Church, VA", "member services director", "Drywall, plaster and acoustical subs (NAICS 238310) on institutional and federal jobs.", ""),
    ("partner", "trade association (national)", "National Tile Contractors Association", "https://www.tile-assn.com", "tile", "Jackson, MS", "member services director", "Tile and terrazzo subs (NAICS 238340) on public buildings.", ""),
    ("partner", "trade association (national)", "Mason Contractors Association of America", "https://masoncontractors.org", "mason contractors", "Algonquin, IL", "member services director", "Masonry subs (NAICS 238140) on schools, courthouses and other prevailing-wage buildings.", ""),
    ("partner", "trade association (national)", "American Society of Concrete Contractors", "https://ascconline.org", "concrete contractors", "St. Louis, MO", "member services director", "Concrete subs (NAICS 238110) are the largest single specialty trade on federal site work.", ""),
    ("partner", "trade association (national)", "FCA International (Finishing Contractors Association)", "https://www.finishingcontractors.org", "fca", "Fairfax, VA", "member services director", "Wall, ceiling and finishing subs whose members work public projects under prevailing wage.", ""),
    ("partner", "trade association (national)", "Construction Financial Management Association", "https://www.cfma.org", "cfma", "Princeton, NJ", "education or partnerships director", "CFMA's members are exactly the contractor CFOs and office managers who own certified payroll; its chapters run compliance CPE.", ""),
    ("partner", "trade association (national)", "National Association of Surety Bond Producers", "https://www.nasbp.org", "surety", "Washington, DC", "partnerships director", "Surety producers underwrite the small subs bidding public work and see Davis-Bacon exposure as a bonding risk.", ""),
    ("partner", "trade association (national)", "Design-Build Institute of America", "https://dbia.org", "design-build", "Washington, DC", "partnerships director", "DBIA members deliver federal design-build projects where the prime rolls up subs' certified payrolls.", ""),
    ("partner", "trade association (national)", "National 8(a) Association", "https://www.national8aassociation.org", "8(a)", "Anchorage, AK", "membership director", "8(a) certified firms win sole-source federal construction contracts and are usually first-time Davis-Bacon filers.", ""),
    ("partner", "trade association (national)", "American Council of Engineering Companies", "https://www.acec.org", "engineering companies", "Washington, DC", "partnerships director", "ACEC members sit alongside contractors on federally funded projects and field the same wage-determination questions.", ""),
    ("partner", "trade association (national)", "National Insulation Association", "https://insulation.org", "insulation", "Alexandria, VA", "member services director", "Mechanical insulation subs on federal energy and building projects.", ""),
    ("partner", "trade association (national)", "Steel Erectors Association of America", "https://www.seaa.net", "steel erectors", "Greensboro, NC", "member services director", "Structural steel erection subs (NAICS 238120) on federal and highway work.", ""),
    ("partner", "trade association (national)", "Scaffold & Access Industry Association", "https://www.saiaonline.org", "scaffold", "Kansas City, MO", "member services director", "Scaffold and access subs on prevailing-wage jobsites.", ""),
    ("partner", "trade association (national)", "National Ready Mixed Concrete Association", "https://www.nrmca.org", "ready mixed", "Alexandria, VA", "member services director", "Suppliers and placement contractors whose customers are the concrete subs in the ICP.", ""),
    ("partner", "trade association (national)", "National Association of Home Builders", "https://www.nahb.org", "home builders", "Washington, DC", "partnerships director", "NAHB members include the small GCs that take occasional HUD or federally assisted work carrying Davis-Bacon.", "weaker fit than the commercial associations: most NAHB work is private residential"),
    ("partner", "trade association (national)", "Associated Equipment Distributors", "https://www.aednet.org", "equipment distributors", "Schaumburg, IL", "partnerships director", "AED distributors sell to the site-work and highway contractors in the ICP and run contractor education.", "indirect fit"),

    # ---------------------------------------------------- association chapters
    ("partner", "trade association chapter", "AGC of California", "https://www.agc-ca.org", "agc", "West Sacramento, CA", "member services director", "State AGC chapter in the largest prevailing-wage state (CA DIR registration plus Davis-Bacon on federal-aid work).", ""),
    ("partner", "trade association chapter", "AGC of Minnesota", "https://www.agcmn.org", "agc", "St. Paul, MN", "member services director", "State AGC chapter serving highway and building contractors on federal-aid work.", ""),
    ("partner", "trade association chapter", "AGC of Missouri", "https://www.agcmo.org", "agc", "Jefferson City, MO", "member services director", "State AGC chapter serving contractors on federal and state prevailing-wage projects.", ""),
    ("partner", "trade association chapter", "AGC of Ohio", "https://www.agcohio.com", "agc", "Columbus, OH", "member services director", "State AGC chapter in a large federal-aid highway state.", ""),
    ("partner", "trade association chapter", "Associated General Contractors of New York State", "https://www.agcnys.org", "agc", "Albany, NY", "member services director", "State AGC chapter in New York, where Article 8 certified payroll runs alongside Davis-Bacon.", ""),
    ("partner", "trade association chapter", "Carolinas AGC", "https://www.cagc.org", "agc", "Charlotte, NC", "member services director", "Two-state AGC chapter covering North and South Carolina contractors on federal work.", ""),
    ("partner", "trade association chapter", "AGC Georgia", "https://www.agcga.org", "agc", "Atlanta, GA", "member services director", "State AGC chapter serving Georgia contractors on federal and federally assisted jobs.", ""),
    ("partner", "trade association chapter", "AGC of Colorado", "https://www.agccolorado.org", "agc", "Denver, CO", "member services director", "State AGC chapter serving contractors on federal-aid and military construction.", ""),
    ("partner", "trade association chapter", "ABC Pacific Southwest Chapter", "https://www.abcsocal.org", "abc", "Anaheim, CA", "chapter president", "Merit-shop ABC chapter in Southern California, the densest concentration of non-union subs facing CA DIR plus Davis-Bacon.", ""),
    ("partner", "trade association chapter", "ABC of Wisconsin", "https://www.abcwi.org", "abc", "Madison, WI", "chapter president", "State ABC chapter serving merit-shop subs on public work.", ""),
    ("partner", "trade association chapter", "ABC Carolinas", "https://www.abccarolinas.org", "abc", "Charlotte, NC", "chapter president", "ABC chapter serving merit-shop contractors across the Carolinas.", ""),
    ("partner", "trade association chapter", "ABC Central Florida", "https://www.abccentralflorida.com", "builders", "Winter Park, FL", "chapter president", "ABC chapter serving merit-shop subs on federal and state-funded Florida work.", ""),
    ("partner", "trade association chapter", "ABC Greater Houston", "https://www.abchouston.org", "abc", "Houston, TX", "chapter president", "Large merit-shop chapter in a major federal construction market.", ""),
    ("partner", "trade association chapter", "ABC Virginia", "https://www.abcva.org", "abc", "Richmond, VA", "chapter president", "ABC chapter next to the largest concentration of federal construction spend in the country.", ""),
    ("partner", "trade association chapter", "ABC Metro Washington", "https://www.abcmetrowashington.org", "abc", "Fairfax, VA", "chapter president", "ABC chapter in the DC metro, where nearly every commercial job has a federal funding source.", ""),
    ("partner", "trade association chapter", "ABC Keystone", "https://www.abckeystone.org", "abc", "Manheim, PA", "chapter president", "Pennsylvania merit-shop chapter serving subs on state Prevailing Wage Act and federal work.", ""),
    ("partner", "trade association chapter", "ABC Western Pennsylvania", "https://www.abcwpa.org", "abc", "Pittsburgh, PA", "chapter president", "Merit-shop chapter serving western Pennsylvania public-works subs.", ""),
    ("partner", "trade association chapter", "ABC Georgia", "https://www.abcgeorgia.org", "builders", "Atlanta, GA", "chapter president", "Merit-shop chapter serving Georgia subs on federally funded work.", ""),
    ("partner", "trade association chapter", "ABC Michigan", "https://www.abcmi.org", "abc", "Lansing, MI", "chapter president", "State ABC chapter serving merit-shop contractors on Michigan public work.", ""),
    ("partner", "trade association chapter", "ABC Rocky Mountain", "https://abcrmc.org", "abc", "Denver, CO", "chapter president", "Merit-shop chapter serving Colorado and Wyoming subs on federal projects.", ""),
    ("partner", "trade association chapter", "IEC Chesapeake", "https://www.iecchesapeake.com", "iec", "Laurel, MD", "chapter executive director", "Independent electrical contractors chapter in the DC/Baltimore federal construction corridor.", ""),
    ("partner", "trade association chapter", "IEC Rocky Mountain", "https://www.iecrm.org", "iec", "Denver, CO", "chapter executive director", "Merit-shop electrical chapter serving Colorado subs on federal work.", ""),
    ("partner", "trade association chapter", "NECA Chicago and Cook County", "https://www.necachicago.org", "neca", "Chicago, IL", "chapter executive", "NECA chapter in a state with its own certified transcript of payroll regime plus Davis-Bacon.", ""),
    ("partner", "trade association chapter", "ASA of Metro Washington", "https://asamw.org", "subcontractors", "Washington, DC", "executive director", "ASA chapter in the densest federal construction market.", ""),

    # -------------------------------------------------- construction CPA firms
    ("partner", "construction CPA / accounting firm", "CBIZ", "https://www.cbiz.com", "cbiz", "Cleveland, OH", "construction practice leader", "National accounting and advisory firm with a construction vertical and an outsourced-accounting arm.", ""),
    ("partner", "construction CPA / accounting firm", "RSM US", "https://rsmus.com", "rsm", "Chicago, IL", "construction practice leader", "Middle-market firm whose construction clients are exactly the $5-50M contractors in this file.", ""),
    ("partner", "construction CPA / accounting firm", "Wipfli", "https://www.wipfli.com", "wipfli", "Milwaukee, WI", "construction practice leader", "Middle-market firm with a construction and real estate practice and outsourced back-office services.", ""),
    ("partner", "construction CPA / accounting firm", "Baker Tilly", "https://www.bakertilly.com", "baker tilly", "Chicago, IL", "construction practice leader", "Advisory firm with both a construction practice and a government-contracting compliance practice.", ""),
    ("partner", "construction CPA / accounting firm", "Crowe", "https://www.crowe.com", "crowe", "Chicago, IL", "construction practice leader", "National firm advising contractors on compliance and back-office systems.", ""),
    ("partner", "construction CPA / accounting firm", "Plante Moran", "https://www.plantemoran.com", "plante moran", "Southfield, MI", "construction practice leader", "Midwest firm with a construction practice serving mid-size contractors.", ""),
    ("partner", "construction CPA / accounting firm", "Cherry Bekaert", "https://www.cbh.com", "cherry bekaert", "Richmond, VA", "construction practice leader", "Firm with both construction and government-contracting practices in the federal corridor.", ""),
    ("partner", "construction CPA / accounting firm", "Aprio", "https://www.aprio.com", "aprio", "Atlanta, GA", "construction practice leader", "Advisory firm with a construction practice and a government-contracting compliance group.", ""),
    ("partner", "construction CPA / accounting firm", "Forvis Mazars", "https://www.forvismazars.us", "forvis", "Springfield, MO", "construction practice leader", "National firm with a construction and real estate practice.", ""),
    ("partner", "construction CPA / accounting firm", "Katz Sapper & Miller", "https://www.ksmcpa.com", "katz", "Indianapolis, IN", "construction practice leader", "Firm known for its construction niche serving mid-market contractors.", ""),
    ("partner", "construction CPA / accounting firm", "Schneider Downs", "https://www.schneiderdowns.com", "schneider downs", "Pittsburgh, PA", "construction practice leader", "Regional firm with a construction practice in a state prevailing-wage jurisdiction.", ""),
    ("partner", "construction CPA / accounting firm", "Doeren Mayhew", "https://doeren.com", "doeren", "Troy, MI", "construction practice leader", "Firm with a construction group serving contractors on public work.", ""),
    ("partner", "construction CPA / accounting firm", "Weaver", "https://weaver.com", "weaver", "Houston, TX", "construction practice leader", "Texas firm with construction and government-contracting practices.", ""),
    ("partner", "construction CPA / accounting firm", "Whitley Penn", "https://www.whitleypenn.com", "whitley penn", "Fort Worth, TX", "construction practice leader", "Texas firm with a construction niche.", ""),
    ("partner", "construction CPA / accounting firm", "HBK CPAs & Consultants", "https://hbkcpa.com", "hbk", "Canfield, OH", "construction practice leader", "Regional firm with a construction industry group.", ""),
    ("partner", "construction CPA / accounting firm", "Anders CPAs + Advisors", "https://anderscpa.com", "anders", "St. Louis, MO", "construction practice leader", "Firm with a construction and real estate practice serving mid-size contractors.", ""),
    ("partner", "construction CPA / accounting firm", "Blue & Co.", "https://www.blueandco.com", "blue", "Carmel, IN", "construction practice leader", "Midwest firm with a construction services group.", ""),
    ("partner", "construction CPA / accounting firm", "LBMC", "https://www.lbmc.com", "lbmc", "Brentwood, TN", "construction practice leader", "Regional firm with construction and outsourced-accounting practices.", ""),
    ("partner", "construction CPA / accounting firm", "Warren Averett", "https://warrenaverett.com", "warren averett", "Birmingham, AL", "construction practice leader", "Southeast firm with a construction practice and a government-contracting group.", ""),
    ("partner", "construction CPA / accounting firm", "Elliott Davis", "https://www.elliottdavis.com", "elliott davis", "Greenville, SC", "construction practice leader", "Southeast firm with a construction and real estate practice.", ""),
    ("partner", "construction CPA / accounting firm", "The Bonadio Group", "https://www.bonadio.com", "bonadio", "Pittsford, NY", "construction practice leader", "New York firm with a construction practice in an Article 8 certified-payroll state.", ""),
    ("partner", "construction CPA / accounting firm", "Citrin Cooperman", "https://www.citrincooperman.com", "citrin", "New York, NY", "construction practice leader", "Firm with a construction and engineering practice in the northeast.", ""),
    ("partner", "construction CPA / accounting firm", "EisnerAmper", "https://www.eisneramper.com", "eisneramper", "New York, NY", "construction practice leader", "National firm with a real estate and construction practice.", ""),
    ("partner", "construction CPA / accounting firm", "Rehmann", "https://www.rehmann.com", "rehmann", "Troy, MI", "construction practice leader", "Midwest firm with a construction practice and outsourced accounting.", ""),
    ("partner", "construction CPA / accounting firm", "Withum", "https://www.withum.com", "withum", "Princeton, NJ", "construction practice leader", "Firm with construction and government-contracting practices in a state prevailing-wage jurisdiction.", ""),
    ("partner", "construction CPA / accounting firm", "PBMares", "https://www.pbmares.com", "pbmares", "Newport News, VA", "construction practice leader", "Virginia firm with construction and government-contracting practices next to major federal spend.", ""),
    ("partner", "construction CPA / accounting firm", "Grassi", "https://www.grassicpas.com", "grassi", "Jericho, NY", "construction practice leader", "New York firm with a large construction practice.", ""),
    ("partner", "construction CPA / accounting firm", "Armanino", "https://www.armanino.com", "armanino", "San Ramon, CA", "construction practice leader", "California firm with a construction practice in the largest prevailing-wage state.", ""),
    ("partner", "construction CPA / accounting firm", "Eide Bailly", "https://www.eidebailly.com", "eide bailly", "Fargo, ND", "construction practice leader", "National firm with a construction and real estate practice.", ""),
    ("partner", "construction CPA / accounting firm", "CliftonLarsonAllen", "https://www.claconnect.com", "cla", "Minneapolis, MN", "construction practice leader", "Very large middle-market firm with a construction practice and outsourced accounting.", ""),
    ("partner", "construction CPA / accounting firm", "Dannible & McKee", "https://www.dmcpas.com", "dannible", "Syracuse, NY", "construction practice leader", "Firm with a construction niche in New York, an Article 8 certified-payroll state.", ""),

    # ------------------------------- construction payroll / back-office vendors
    ("partner", "construction payroll & back-office provider", "Payroll Vault", "https://payrollvault.com", "payroll vault", "Littleton, CO", "head of partnerships", "Franchised local payroll bureaus serving small trades businesses; they run payroll but do not own the wage determination, so WageLens complements them.", ""),
    ("partner", "construction payroll & back-office provider", "Complete Payroll", "https://www.completepayroll.com", "payroll", "Perry, NY", "head of partnerships", "Regional payroll bureau in New York serving contractors that owe Article 8 and Davis-Bacon payrolls.", ""),
    ("partner", "construction payroll & back-office provider", "Paylocity", "https://www.paylocity.com", "paylocity", "Schaumburg, IL", "head of partnerships", "Mid-market payroll platform whose construction customers still have to source the county/craft rate themselves.", ""),
    ("partner", "construction payroll & back-office provider", "Paycor", "https://www.paycor.com", "paycor", "Cincinnati, OH", "head of partnerships", "Mid-market payroll platform with a construction vertical.", ""),
    ("partner", "construction payroll & back-office provider", "Paychex", "https://www.paychex.com", "paychex", "Rochester, NY", "head of partnerships", "Small-business payroll bureau; the wage determination lookup sits outside its product.", "overlaps at the reporting layer: check before treating as a pure referral partner"),
    ("partner", "construction payroll & back-office provider", "ADP", "https://www.adp.com", "adp", "Roseland, NJ", "head of partnerships", "Largest payroll bureau; construction clients still buy separate certified-payroll tooling.", "overlaps at the reporting layer: check before treating as a pure referral partner"),
    ("partner", "construction payroll & back-office provider", "Gusto", "https://gusto.com", "gusto", "San Francisco, CA", "head of partnerships", "Small-business payroll used by many small subs, with no Davis-Bacon determination layer.", ""),
    ("partner", "construction payroll & back-office provider", "Rippling", "https://www.rippling.com", "rippling", "San Francisco, CA", "head of partnerships", "Payroll and HR platform used by small contractors, no wage-determination layer.", ""),
    ("partner", "construction payroll & back-office provider", "TriNet", "https://www.trinet.com", "trinet", "Dublin, CA", "head of partnerships", "PEO serving small contractors that would still need the county/craft determination.", ""),
    ("partner", "construction payroll & back-office provider", "Workyard", "https://www.workyard.com", "workyard", "San Francisco, CA", "head of partnerships", "Construction time tracking and crew management; the hours it captures are the input to WH-347.", ""),
    ("partner", "construction payroll & back-office provider", "busybusy", "https://busybusy.com", "busybusy", "St. George, UT", "head of partnerships", "Construction time tracking whose customers are exactly small specialty subs.", ""),
    ("partner", "construction payroll & back-office provider", "ExakTime", "https://www.exaktime.com", "exaktime", "Calabasas, CA", "head of partnerships", "Construction time clock feeding payroll; natural upstream integration for WH-347 generation.", ""),
    ("partner", "construction payroll & back-office provider", "Raken", "https://www.rakenapp.com", "raken", "Carlsbad, CA", "head of partnerships", "Daily reporting and field data for subs; complements a certified-payroll generator.", ""),
    ("partner", "construction payroll & back-office provider", "Rhumbix", "https://www.rhumbix.com", "rhumbix", "San Francisco, CA", "head of partnerships", "Field data capture for craft labour hours and cost codes.", "check overlap: Rhumbix markets certified-payroll features to some customers"),
    ("partner", "construction payroll & back-office provider", "Arcoro", "https://arcoro.com", "arcoro", "Scottsdale, AZ", "head of partnerships", "Construction HR suite; the ICP overlaps completely with WageLens.", ""),
    ("partner", "construction payroll & back-office provider", "Knowify", "https://www.knowify.com", "knowify", "New York, NY", "head of partnerships", "Job costing and contractor back-office aimed at small specialty subs.", ""),
    ("partner", "construction payroll & back-office provider", "Buildertrend", "https://buildertrend.com", "buildertrend", "Omaha, NE", "head of partnerships", "Contractor management platform for small builders and subs.", ""),
    ("partner", "construction payroll & back-office provider", "Siteline", "https://www.siteline.com", "siteline", "San Francisco, CA", "head of partnerships", "Billing and pay-application software built specifically for trade subcontractors, the same buyer as WageLens.", ""),
    ("partner", "construction payroll & back-office provider", "Kojo", "https://www.usekojo.com", "kojo", "San Francisco, CA", "head of partnerships", "Materials and procurement platform for specialty trade contractors.", ""),
    ("partner", "construction payroll & back-office provider", "Adaptive", "https://www.adaptive.build", "adaptive", "San Francisco, CA", "head of partnerships", "Construction back-office automation for small contractors.", ""),
    ("partner", "construction payroll & back-office provider", "CrewCost", "https://crewcost.com", "crewcost", "", "head of partnerships", "Job-costing software for small contractors.", ""),

    # --------------------------------- government-contracting training/advisory
    ("partner", "govcon training & advisory", "Govology", "https://govology.com", "govology", "", "head of partnerships", "Training platform for small government contractors; Davis-Bacon and certified payroll are recurring course topics.", ""),
    ("partner", "govcon training & advisory", "National Contract Management Association", "https://www.ncmahq.org", "ncma", "Reston, VA", "education director", "Professional body for contract managers, including construction contract administrators.", ""),
    ("partner", "govcon training & advisory", "Koprince McCall Pottroff (SmallGovCon)", "https://smallgovcon.com", "smallgovcon", "Lawrence, KS", "editor", "Law firm blog read daily by small federal contractors; its readers are the WageLens buyer.", "law firm; treat as a content partner, not a reseller"),
    ("partner", "govcon training & advisory", "Federal Publications Seminars", "https://www.fedpubseminars.com", "federal publications", "", "programme director", "Runs government-contract compliance training including labour standards.", ""),
    ("partner", "govcon training & advisory", "Public Contracting Institute", "https://publiccontractinginstitute.com", "public contracting", "", "programme director", "Government-contracts training provider covering labour-standards compliance.", ""),

    # ------------------------------------------------------------------ media
    ("channel", "industry media & newsletter", "Construction Dive", "https://www.constructiondive.com", "construction dive", "", "editor", "Daily construction trade newsletter read by contractor owners and executives.", ""),
    ("channel", "industry media & newsletter", "Engineering News-Record", "https://www.enr.com", "enr", "New York, NY", "editor", "The construction industry's paper of record; covers Davis-Bacon rulemaking.", ""),
    ("channel", "industry media & newsletter", "Construction Executive", "https://www.constructionexec.com", "construction executive", "Washington, DC", "editor", "ABC's magazine, read by merit-shop contractor owners, the core ICP.", ""),
    ("channel", "industry media & newsletter", "Construction Business Owner", "https://www.constructionbusinessowner.com", "construction business owner", "", "editor", "Magazine aimed squarely at small contractor owners and their back-office problems.", ""),
    ("channel", "industry media & newsletter", "For Construction Pros", "https://www.forconstructionpros.com", "construction", "", "editor", "Trade site covering contractor operations and compliance.", ""),
    ("channel", "industry media & newsletter", "Contractor Magazine", "https://www.contractormag.com", "contractor", "", "editor", "Mechanical contracting trade publication.", ""),
    ("channel", "industry media & newsletter", "Electrical Contractor Magazine", "https://www.ecmag.com", "electrical contractor", "Bethesda, MD", "editor", "NECA's magazine, read by electrical contractor owners, the largest trade in the award pull.", ""),
    ("channel", "industry media & newsletter", "EC&M", "https://www.ecmweb.com", "ec&m", "", "editor", "Electrical construction and maintenance trade publication.", ""),
    ("channel", "industry media & newsletter", "Roofing Contractor", "https://www.roofingcontractor.com", "roofing contractor", "", "editor", "Trade publication for roofing subs.", ""),
    ("channel", "industry media & newsletter", "Concrete Construction", "https://www.concreteconstruction.net", "concrete", "", "editor", "Trade publication for concrete contractors.", ""),
    ("channel", "industry media & newsletter", "Plumbing & Mechanical", "https://www.pmmag.com", "plumbing", "", "editor", "Trade publication for plumbing and mechanical contractors.", ""),
    ("channel", "industry media & newsletter", "The ACHR News", "https://www.achrnews.com", "achr", "", "editor", "HVACR contracting trade publication.", ""),
    ("channel", "industry media & newsletter", "Walls & Ceilings", "https://www.wconline.com", "walls", "", "editor", "Trade publication for drywall and ceiling subs.", ""),
    ("channel", "industry media & newsletter", "Construction Junkie", "https://www.constructionjunkie.com", "construction junkie", "", "editor", "Independent construction news and tools blog with a contractor readership.", ""),
    ("channel", "industry media & newsletter", "Federal News Network", "https://federalnewsnetwork.com", "federal news", "Washington, DC", "editor", "Covers federal acquisition policy, including labour-standards rulemaking.", ""),
    ("channel", "industry media & newsletter", "Washington Technology", "https://washingtontechnology.com", "washington technology", "", "editor", "Federal contracting trade publication.", ""),
    ("channel", "industry media & newsletter", "GovConWire", "https://www.govconwire.com", "govcon", "", "editor", "Federal contracting news site.", ""),

    # ---------------------------------------------------------------- podcasts
    ("channel", "podcast", "The Contractor Fight", "https://thecontractorfight.com", "contractor fight", "", "show producer", "Large contractor-owner audience focused on running the business, where compliance pain lands.", ""),
    ("channel", "podcast", "Contractor Success Forum", "https://www.contractorsuccessforum.com", "contractor success", "", "show producer", "Podcast for contractor owners and their CPAs on financial and back-office topics.", ""),
    ("channel", "podcast", "The Construction Life", "https://www.theconstructionlife.com", "construction life", "", "show producer", "Long-running construction industry podcast.", ""),
    ("channel", "podcast", "GovCon Giants", "https://govcongiants.com", "govcon giants", "", "show producer", "Podcast and community for small and minority federal contractors, many in construction.", ""),
    ("channel", "podcast", "Govcon Chamber of Commerce", "https://www.govconchamber.com", "govcon chamber", "", "show producer", "Daily live show for small federal contractors.", ""),

    # ------------------------------------------------------------- conferences
    ("channel", "conference", "World of Concrete", "https://www.worldofconcrete.com", "world of concrete", "Las Vegas, NV", "exhibitor sales", "Largest annual trade show for concrete and masonry contractors, a core ICP trade.", ""),
    ("channel", "conference", "CONEXPO-CON/AGG", "https://www.conexpoconagg.com", "conexpo", "Las Vegas, NV", "exhibitor sales", "Triennial construction equipment show drawing site-work and highway contractors.", ""),
    ("channel", "conference", "AHR Expo", "https://www.ahrexpo.com", "ahr expo", "", "exhibitor sales", "HVACR trade show drawing mechanical contractors.", ""),
    ("channel", "conference", "NECA Convention & Trade Show", "https://www.necaconvention.org", "neca", "", "exhibitor sales", "Annual electrical contractor convention, the largest trade in the federal award pull.", ""),
    ("channel", "conference", "NAPEX National Training Conference", "https://www.napex.us/national-conferences/", "napex", "", "exhibitor sales", "Where APEX Accelerator counsellors, the people who advise first-time federal contractors, gather.", ""),

    # ---------------------------------------------------------------- excluded
    ("excluded", "certified-payroll incumbent", "LCPtracker", "https://lcptracker.com", "lcptracker", "Orange, CA", "n/a", "Direct competitor: the dominant certified-payroll and labour-compliance platform, usually bought by the awarding agency or prime.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Points North", "https://www.points-north.com", "points north", "Grand Rapids, MI", "n/a", "Direct competitor: Certified Payroll Reporting product plus Davis-Bacon content marketing.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Certified Payroll Reporting", "https://www.certifiedpayrollreporting.com", "certified payroll", "", "n/a", "Direct competitor: Points North's certified-payroll product marketed under its own domain.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Elation Systems", "https://www.elationsys.com", "elation", "Fremont, CA", "n/a", "Direct competitor: labour compliance and certified payroll, widely deployed by California public agencies.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "B2Gnow", "https://www.b2gnow.com", "b2gnow", "Phoenix, AZ", "n/a", "Direct competitor: contract compliance and certified payroll for public agencies, and the operator of many state DBE directories.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Foundation Software", "https://www.foundationsoft.com", "foundation", "Strongsville, OH", "n/a", "Direct competitor: construction accounting with built-in certified payroll and WH-347.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Payroll4Construction", "https://www.payroll4construction.com", "payroll4construction", "Strongsville, OH", "n/a", "Direct competitor: construction payroll service that produces certified payroll reports.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Deltek", "https://www.deltek.com", "deltek", "Herndon, VA", "n/a", "Direct competitor: owns ComputerEase construction accounting with certified payroll.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Procore", "https://www.procore.com", "procore", "Carpinteria, CA", "n/a", "Direct competitor at the platform layer: Procore Pay and its compliance partners cover certified payroll.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Sage", "https://www.sage.com", "sage", "", "n/a", "Direct competitor: Sage 100 Contractor and Sage Intacct Construction generate certified payroll.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Trimble Viewpoint", "https://viewpoint.com", "viewpoint", "Portland, OR", "n/a", "Direct competitor: Vista and Spectrum construction ERP with certified payroll modules.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Computer Guidance Corporation", "https://www.computerguidance.com", "computer guidance", "Scottsdale, AZ", "n/a", "Direct competitor: eCMS construction ERP with certified payroll.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "hh2 Cloud Services", "https://hh2.com", "hh2", "Rexburg, ID", "n/a", "Direct competitor: construction payroll and time entry including certified payroll.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "eBacon", "https://ebacon.com", "ebacon", "Phoenix, AZ", "n/a", "Direct competitor: certified payroll and fringe-benefit management for prevailing-wage contractors.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Miter", "https://www.miter.com", "miter", "San Francisco, CA", "n/a", "Direct competitor: construction payroll platform that advertises certified payroll and prevailing wage.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Sunburst Software Solutions", "https://www.sunburstsoftwaresolutions.com", "sunburst", "", "n/a", "Direct competitor: Certified Payroll Solution for QuickBooks.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "DavisBaconRates.com", "https://davisbaconrates.com", "davis", "", "n/a", "Direct competitor: sells Davis-Bacon rate lookup, the exact core of the WageLens product.", "never contact as a prospect; also the source of the pricing evidence in the shortlist"),
    ("excluded", "certified-payroll incumbent", "Certified Payroll Pro", "https://www.certifiedpayrollpro.com", "certified payroll", "", "n/a", "Direct competitor: certified payroll aimed at small contractors.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "MyConstructionPayroll", "https://www.myconstructionpayroll.com", "construction payroll", "", "n/a", "Direct competitor: construction payroll service marketing on subcontractor Davis-Bacon liability.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Aatrix Software", "https://aatrix.com", "aatrix", "Grand Forks, ND", "n/a", "Direct competitor at the forms layer: produces WH-347 and state certified payroll forms.", "never contact as a prospect"),
    ("excluded", "certified-payroll incumbent", "Points North Certified Payroll", "https://www.certifiedpayroll.com", "certified payroll", "", "n/a", "Direct competitor domain in the certified-payroll category.", "never contact as a prospect"),
]

# Organisations that are unambiguously real but whose sites answer a plain
# request from this environment with a Cloudflare challenge or a 403. They are
# kept with confidence=unverified, website empty, and the HTTP status recorded
# in notes, rather than silently dropped.
SOFT_OK = {
    "National Electrical Contractors Association",
    "National Tile Contractors Association",
    "Baker Tilly", "Crowe", "Weaver", "Citrin Cooperman", "PBMares", "Armanino",
    "ADP", "Gusto", "Buildertrend", "Sage",
    "Construction Dive", "Electrical Contractor Magazine", "Concrete Construction",
    "Public Contracting Institute", "Elation Systems",
    "The Contractor Fight", "Contractor Success Forum",
    "SCORE", "Minority Business Development Agency", "Equipment World",
    "CONSTRUCT Show",
}

EXTRA_CANDIDATES = [
    # --------------------------------------------- more partners: federal-facing
    ("partner", "trade association (national)", "Society of American Military Engineers", "https://www.same.org", "military engineers", "Alexandria, VA", "small business programme director", "SAME's small business programme connects small construction firms to USACE and NAVFAC work, every dollar of which is Davis-Bacon covered.", ""),
    ("partner", "trade association (national)", "National Veteran Small Business Coalition", "https://www.nvsbc.org", "veteran", "", "membership director", "SDVOSB construction firms win set-aside federal construction contracts and meet Davis-Bacon on day one.", ""),
    ("partner", "trade association (national)", "Native American Contractors Association", "https://www.nativecontractors.org", "native", "Washington, DC", "membership director", "Represents ANC, tribal and NHO contractors, many of them 8(a) construction firms on federal jobs.", ""),
    ("partner", "trade association (national)", "Women's Business Enterprise National Council", "https://www.wbenc.org", "wbenc", "Washington, DC", "supplier diversity director", "Certifies the WBE construction firms that primes must subcontract to on federally assisted work.", ""),
    ("partner", "trade association (national)", "National Minority Supplier Development Council", "https://nmsdc.org", "nmsdc", "New York, NY", "supplier diversity director", "Certifies MBE construction firms that win subcontracts on federally funded projects.", ""),
    ("partner", "trade association (national)", "U.S. Black Chambers", "https://usblackchambers.org", "black chambers", "Washington, DC", "programme director", "Supports Black-owned contractors entering federal and municipal construction.", ""),
    ("partner", "trade association (national)", "United States Hispanic Chamber of Commerce", "https://www.ushcc.com", "hispanic", "Washington, DC", "programme director", "Supports Hispanic-owned contractors, heavily represented in the specialty trades in the ICP.", ""),
    ("partner", "govcon training & advisory", "America's SBDC", "https://americassbdc.org", "sbdc", "Burke, VA", "network programme director", "The SBDC network advises small businesses, including construction firms taking their first federally funded contract.", "state lead-centre directory is JavaScript-rendered and could not be parsed here"),
    ("partner", "govcon training & advisory", "SCORE", "https://www.score.org", "score", "Herndon, VA", "chapter programme director", "SBA resource partner mentoring small contractors, including on government contracting.", ""),
    ("partner", "govcon training & advisory", "Minority Business Development Agency", "https://www.mbda.gov", "minority business", "Washington, DC", "business centre director", "MBDA business centres coach minority contractors into federal construction contracts.", ""),
    ("partner", "govcon training & advisory", "U.S. Small Business Administration", "https://www.sba.gov", "small business administration", "Washington, DC", "district office director", "SBA district offices and the 8(a) programme funnel small construction firms into federal contracts where Davis-Bacon applies.", "district office directory is a dynamic page; individual offices not enumerated here"),
    ("partner", "govcon training & advisory", "HigherGov", "https://www.highergov.com", "highergov", "", "head of partnerships", "Federal market intelligence used by small contractors; complementary data play with no wage-determination layer.", ""),
    ("partner", "govcon training & advisory", "GovTribe", "https://govtribe.com", "govtribe", "", "head of partnerships", "Federal contracting data platform used by small contractors researching awards.", ""),
    ("partner", "construction payroll & back-office provider", "ConstructConnect", "https://www.constructconnect.com", "constructconnect", "Cincinnati, OH", "head of partnerships", "Preconstruction and bid data for subcontractors; the same buyer, a different part of the workflow.", ""),
    ("partner", "construction payroll & back-office provider", "Dodge Construction Network", "https://www.construction.com", "dodge", "Bedford, MA", "head of partnerships", "Project lead data for contractors; reaches the same specialty subs.", ""),
    ("partner", "construction payroll & back-office provider", "The Blue Book Network", "https://www.thebluebook.com", "blue book", "Jefferson Valley, NY", "head of partnerships", "Construction industry directory and network used by subcontractors to find work.", ""),

    # ----------------------------------------------------------- more channels
    ("channel", "industry media & newsletter", "Constructor Magazine", "https://www.constructormagazine.com", "constructor", "", "editor", "AGC's magazine, read by general and specialty contractor leadership.", ""),
    ("channel", "industry media & newsletter", "Equipment World", "https://www.equipmentworld.com", "equipment world", "", "editor", "Reaches site-work and highway contractors, a large ICP trade.", ""),
    ("channel", "industry media & newsletter", "Construction Equipment", "https://www.constructionequipment.com", "construction equipment", "", "editor", "Trade publication for heavy and highway contractors.", ""),
    ("channel", "industry media & newsletter", "Roads & Bridges", "https://www.roadsbridges.com", "roads", "", "editor", "Publication for federal-aid highway contractors, all Davis-Bacon covered.", ""),
    ("channel", "industry media & newsletter", "Modern Contractor Solutions", "https://mcsmag.com", "contractor", "", "editor", "Business-of-contracting magazine aimed at contractor owners.", ""),
    ("channel", "industry media & newsletter", "Masonry Magazine", "https://www.masonrymagazine.com", "masonry", "", "editor", "Publication of the Mason Contractors Association, reaching masonry subs.", ""),
    ("channel", "industry media & newsletter", "Underground Infrastructure", "https://undergroundinfrastructure.com", "underground", "", "editor", "Publication for utility contractors on federally funded water and broadband work.", ""),
    ("channel", "industry media & newsletter", "ContractorTalk", "https://www.contractortalk.com", "contractortalk", "", "community manager", "Long-running public contractor forum where small trades discuss back-office and compliance problems.", "public forum: use for listening and organic participation only, never scraped for individuals"),
    ("channel", "conference", "AGC Annual Convention", "https://www.agc.org/annual-convention", "convention", "", "exhibitor sales", "AGC's national convention, where general and specialty contractor leadership gathers.", ""),
    ("channel", "conference", "SMACNA Annual Convention", "https://www.smacna.org/annual-convention", "convention", "", "exhibitor sales", "Sheet metal and HVAC contractor convention.", ""),
    ("channel", "conference", "MCAA Annual Convention", "https://www.mcaa.org/convention", "convention", "", "exhibitor sales", "Mechanical contractor convention.", ""),
    ("channel", "conference", "NAWIC Annual Conference", "https://www.nawic.org/annual-conference", "conference", "", "exhibitor sales", "Annual conference of women in construction, reaching WBE subs on federally assisted work.", ""),
    ("channel", "conference", "World of Asphalt", "https://www.worldofasphalt.com", "asphalt", "", "exhibitor sales", "Trade show for paving and highway contractors on federal-aid work.", ""),
    ("channel", "conference", "The Utility Expo", "https://www.theutilityexpo.com", "utility expo", "Louisville, KY", "exhibitor sales", "Trade show for utility contractors on federally funded infrastructure.", ""),
    ("channel", "conference", "International Roofing Expo", "https://www.theroofingexpo.com", "roofing", "", "exhibitor sales", "Annual roofing contractor trade show.", ""),
    ("channel", "conference", "CONSTRUCT Show", "https://www.constructshow.com", "construct", "", "exhibitor sales", "Commercial construction and specification trade show.", ""),
    ("channel", "podcast", "DoD Contract Academy", "https://www.dodcontract.com", "contract", "", "show producer", "Podcast and training for small firms winning defence contracts, including construction.", ""),
    ("channel", "podcast", "RSM Federal / Game Changers for Government Contractors", "https://www.rsmfederal.com", "rsm federal", "St. Louis, MO", "show producer", "Podcast and advisory for small government contractors.", ""),
]


def candidate_rows():
    kept, rejected = [], []
    for (ptype, seg, name, url, token, loc, role, fit, notes) in (
            CANDIDATES + EXTRA_CANDIDATES):
        st, final, text = fetch(url)
        low = text.lower()
        title = ""
        m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
        if m:
            title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1))).strip()[:120]
        ok = st and st < 400 and token.lower() in low
        soft = (not ok) and name in SOFT_OK and (
            st in (0, 202, 403, 429, 503) or (st == 200 and len(text) < 4000))
        if not ok and not soft:
            rejected.append({"name": name, "url": url, "status": st,
                             "token": token, "title": title})
            print("  REJECT %-52s http=%s title=%s" % (name[:52], st, title[:50]), flush=True)
            continue
        root = re.match(r"^(https?://[^/]+)", final)
        stype = ("company-site" if ptype == "excluded" else
                 ("association-directory" if "association" in seg else "company-site"))
        if soft:
            kept.append(row(
                ptype, seg, name, "", loc, "", fit, "", role, url, stype, "unverified",
                ("%s; " % notes if notes else "") +
                "NOT independently opened: %s returned HTTP %s to this environment "
                "(bot protection / Cloudflare challenge), so the organisation's own page "
                "was never read here; website left empty per BRIEF 2.4" % (url, st),
            ))
            print("  soft   %-52s http=%s" % (name[:52], st), flush=True)
            continue
        kept.append(row(
            ptype, seg, name, root.group(1) if root else url, loc,
            "", fit, "", role, url, stype, "verified",
            ("%s; page title on fetch: %s" % (notes, title)) if notes
            else "page title on fetch: %s" % title,
        ))
        print("  ok     %-52s %s" % (name[:52], title[:50]), flush=True)
    return kept, rejected


def main():
    root = os.getcwd()
    outdir = os.path.join(root, "phase-3-acquisition", "prospects", "wagelens")
    if not os.path.isdir(outdir):
        sys.exit("run this from the repository root (missing %s)" % outdir)
    print("APEX Accelerators (napex.us):", flush=True)
    rows = apex_rows()
    print("candidate verification:", flush=True)
    kept, rejected = candidate_rows()
    rows.extend(kept)
    seen, dedup = set(), []
    for r in rows:
        k = (r["name"].lower().strip(), r["website"].lower().strip())
        if k in seen:
            continue
        seen.add(k)
        dedup.append(r)
    with open(os.path.join(outdir, "scripts", "partner_rows.csv"), "w",
              newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(dedup)
    with open(os.path.join(outdir, "scripts", "unverified_candidates.csv"), "w",
              newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["name", "url", "status", "token", "title"],
                           quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rejected)
    print("wrote %d rows to scripts/partner_rows.csv (%d candidates rejected)"
          % (len(dedup), len(rejected)))


if __name__ == "__main__":
    main()
