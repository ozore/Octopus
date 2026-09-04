#!/usr/bin/env python3
"""
WageLens secondary-source pull: state and city government registers of
prevailing-wage / public-works contractors, plus SAM.gov award notices.

Run from the repository root with no arguments:

    python3 phase-3-acquisition/prospects/wagelens/scripts/secondary_pull.py

Sources (all public, no key, all read-only GETs):

  Socrata SoQL (https://<domain>/resource/<id>.json)
    data.wa.gov  t9je-9qwa  L&I Intent Project Details      - WA prevailing-wage
    data.wa.gov  9ncw-tqjn  L&I Affidavit Project Details     intents/affidavits
    data.ny.gov  w2zp-sf2x  Certified Payroll Registration  - NY Article 8 payrolls
    data.ny.gov  i4jv-zkey  Contractor Registry Certificate - NY public-work registry
    data.ny.gov  pfeu-dsx6  NYS UCP certified DBEs
    illinois-edp.data.socrata.com gd6a-xm49 Certified Transcript of Payroll
    data.cityofnewyork.us ci93-uc8s NYC SBS certified M/WBE list (construction)
    data.nola.gov q42h-ptn2 New Orleans DBE/SLDBE directory (construction)
    data.delaware.gov g7vn-fpb4 DE public works prequalified contractors
    data.cincinnati-oh.gov 2iq3-bugw Cincinnati MBE/WBE certified vendors
    data.norfolk.gov 393b-ph9i Norfolk SWaM certified businesses
    data.nj.gov      tfhb-8beb  NJSAVI small/minority/women business registry (construction)
    data.texas.gov   de7b-7dna  TxDOT bid tabulations (federal-aid lettings)

  SAM.gov opportunity search (https://sam.gov/api/prod/sgs/v1/search/?index=opp)
    award notices by construction NAICS -> awardee name + UEI

Writes prospects.csv-schema rows to scripts/secondary_rows.csv.
Responses are cached outside the repo (WAGELENS_CACHE, default /tmp/wagelens_secondary_cache).
"""

import csv
import gzip
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from usaspending_pull import COLS, APP, COLLECTED_ON, looks_like_person, title_case  # noqa: E402

CACHE = os.environ.get("WAGELENS_SECONDARY_CACHE", "/tmp/wagelens_secondary_cache")

GENERIC_MAILBOX = re.compile(
    r"^(info|sales|admin|office|contact|contracts|estimating|estimator|bids|"
    r"accounting|ap|ar|payroll|hr|support|service|mail|inquiries|general|main)@",
    re.I,
)
FREE_MAIL = re.compile(
    r"@(gmail|yahoo|hotmail|outlook|live|msn|icloud|me|mac|proton|protonmail|"
    r"aol|comcast|verizon|att|sbcglobal|bellsouth|cox|charter|frontier|"
    r"roadrunner|earthlink|juno|ymail|windstream|centurylink|mchsi|q)\.",
    re.I,
)


def get(url, tries=3):
    os.makedirs(CACHE, exist_ok=True)
    cp = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".json.gz")
    if os.path.exists(cp):
        try:
            with gzip.open(cp, "rt", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            os.remove(cp)
    last = None
    for attempt in range(tries):
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/hal+json, application/json;q=0.9",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            with gzip.open(cp, "wt", encoding="utf-8") as fh:
                json.dump(data, fh)
            return data
        except urllib.error.HTTPError as e:
            last = "HTTP %s %s" % (e.code, e.read().decode("utf-8", "replace")[:200])
            if e.code in (400, 403, 404):
                break
        except Exception as e:  # noqa: BLE001
            last = repr(e)
        time.sleep(2 * (attempt + 1))
    sys.stderr.write("  ! GET failed %s :: %s\n" % (url[:120], last))
    return None


def soql(domain, dataset, **params):
    q = urllib.parse.urlencode({("$" + k if not k.startswith("$") else k): v
                                for k, v in params.items()})
    return get("https://%s/resource/%s.json?%s" % (domain, dataset, q))


def clean_site(u):
    if not u:
        return ""
    if isinstance(u, dict):
        u = u.get("url") or ""
    u = str(u).strip().strip('"').lower()
    if not u or u in ("n/a", "na", "none", "http://", "https://"):
        return ""
    if not u.startswith("http"):
        u = "http://" + u
    m = re.match(r"^(https?://[^/\s]+)", u)
    if not m:
        return ""
    host = m.group(1)
    if "." not in host.split("//", 1)[-1]:
        return ""
    return host


def mailbox(e):
    e = (e or "").strip().lower()
    if not e or "@" not in e or " " in e:
        return ""
    if FREE_MAIL.search(e):
        return ""
    if not GENERIC_MAILBOX.match(e):
        return ""
    return e


def row(segment, name, website="", location="", size_signal="", fit="",
        contact="", role="owner or office manager", source_url="",
        source_type="government-db", confidence="verified", notes="",
        prospect_type="end-customer"):
    return {
        "app": APP, "prospect_type": prospect_type, "segment": segment,
        "name": name, "website": website, "location": location,
        "size_signal": size_signal, "fit_rationale": fit,
        "contact_route": contact, "decision_maker_role": role,
        "source_url": source_url, "source_type": source_type,
        "confidence": confidence, "collected_on": COLLECTED_ON, "notes": notes,
    }


def plural(n, w="filing"):
    return "%d %s%s" % (n, w, "" if n == 1 else "s")


# ---------------------------------------------------------------------- WA L&I


def wa_rows(limit_intent=700, limit_aff=350):
    out = []
    data = soql(
        "data.wa.gov", "t9je-9qwa",
        select="companyname,companycity,companystate,count(*) as n,"
               "max(application_received_date) as latest",
        where="application_received_date > '2024-01-01'",
        group="companyname,companycity,companystate",
        order="n DESC", limit=limit_intent)
    for r in data or []:
        name = (r.get("companyname") or "").strip()
        if not name or looks_like_person(name):
            continue
        n = int(r.get("n") or 0)
        city = title_case(r.get("companycity") or "")
        st = (r.get("companystate") or "").strip()
        out.append(row(
            "state prevailing-wage contractor (WA)",
            title_case(name) if name.isupper() else name,
            location=(", ".join(x for x in (city, st) if x)),
            size_signal="%s on WA public works since 2024" % plural(n, "statement of intent"),
            fit=("Files statements of intent to pay prevailing wage on Washington public "
                 "works, so it already runs county/craft rate lookups and weekly certified "
                 "payroll and is the exact workflow WageLens replaces."),
            source_url="https://data.wa.gov/d/t9je-9qwa",
            notes="WA L&I Intent Project Details; latest intent %s; contractor licence %s"
                  % ((r.get("latest") or "")[:10], r.get("license") or "n/a"),
        ))
    data = soql(
        "data.wa.gov", "9ncw-tqjn",
        select="name,companycity,state,count(*) as n,max(formreceiveddate) as latest",
        where="formreceiveddate > '2024-01-01'",
        group="name,companycity,state",
        order="n DESC", limit=limit_aff)
    for r in data or []:
        name = (r.get("name") or "").strip()
        if not name or looks_like_person(name):
            continue
        n = int(r.get("n") or 0)
        out.append(row(
            "state prevailing-wage contractor (WA)",
            title_case(name) if name.isupper() else name,
            location=", ".join(x for x in (title_case(r.get("companycity") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="%s on WA public works since 2024" % plural(n, "affidavit of wages paid"),
            fit=("Files affidavits of wages paid on Washington public works, i.e. it is "
                 "already certifying prevailing-wage payroll every job."),
            source_url="https://data.wa.gov/d/9ncw-tqjn",
            notes="WA L&I Affidavit Project Details; latest affidavit %s"
                  % (r.get("latest") or "")[:10],
        ))
    return out


# ---------------------------------------------------------------------- NY


def ny_rows(limit_cp=700, limit_reg=600, limit_dbe=350):
    out = []
    ny_cp = soql(
        "data.ny.gov", "w2zp-sf2x",
        select="account,count(*) as n,max(week_ending_date) as latest,"
               "max(department_of_jurisdiction) as agency",
        where="week_ending_date > '2024-01-01'",
        group="account", order="n DESC", limit=limit_cp)
    for r in ny_cp or []:
        name = (r.get("account") or "").strip()
        if not name or looks_like_person(name):
            continue
        n = int(r.get("n") or 0)
        out.append(row(
            "state prevailing-wage contractor (NY)", name, location="NY",
            size_signal="%s filed on NY public work since 2024" % plural(n, "weekly certified payroll"),
            fit=("Files weekly certified payroll on New York State Article 8 public work, "
                 "so it is already doing the exact county/craft rate mapping and weekly "
                 "report WageLens automates."),
            source_url="https://data.ny.gov/d/w2zp-sf2x",
            notes="NYSDOL Certified Payroll Registration (seven-year window); latest week "
                  "ending %s; a jurisdiction seen: %s"
                  % ((r.get("latest") or "")[:10], r.get("agency") or "n/a"),
        ))
    ny_reg = soql(
        "data.ny.gov", "i4jv-zkey",
        select="business_name,dba_name,city,state,issued_date,expiration_date,"
               "certificate_number",
        where="status='Active'", order="issued_date DESC", limit=limit_reg)
    for r in ny_reg or []:
        name = (r.get("business_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        dba = (r.get("dba_name") or "").strip()
        out.append(row(
            "public works contractor registry (NY)", name,
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="active NYSDOL public work contractor registration %s"
                        % (r.get("certificate_number") or ""),
            fit=("Holds an active New York State DOL contractor registration, which is "
                 "required to bid or work on Article 8 public work and carries the weekly "
                 "certified payroll obligation."),
            source_url="https://data.ny.gov/d/i4jv-zkey",
            notes="NYSDOL Contractor Registry; issued %s, expires %s%s"
                  % ((r.get("issued_date") or "")[:10], (r.get("expiration_date") or "")[:10],
                     ("; dba " + dba) if dba and dba.lower() != name.lower() else ""),
        ))
    ny_dbe = soql(
        "data.ny.gov", "pfeu-dsx6",
        select="company_name,city,state,county,email,commodity_codes,business_description",
        where="commodity_codes like '%23%'", order="company_name", limit=limit_dbe)
    for r in ny_dbe or []:
        name = (r.get("company_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        codes = (r.get("commodity_codes") or "")
        if not re.search(r"\b23\d{4}\b", codes):
            continue
        out.append(row(
            "DBE certified construction firm", name,
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="certified DBE in the NYS Unified Certification Program",
            fit=("Certified DBE in a construction NAICS, the firms federal-aid highway and "
                 "transit primes must subcontract to, which puts it on Davis-Bacon covered "
                 "work with a weekly WH-347 obligation."),
            contact=mailbox(r.get("email")),
            source_url="https://data.ny.gov/d/pfeu-dsx6",
            notes="NYS UCP DBE directory; commodity codes %s" % codes[:160],
        ))
    return out


# ---------------------------------------------------------------------- IL


def il_rows(limit=600):
    out = []
    il = soql(
        "illinois-edp.data.socrata.com", "gd6a-xm49",
        select="company_name,count(*) as n,max(year) as latest,"
               "max(project_county) as county",
        group="company_name", order="n DESC", limit=limit)
    for r in il or []:
        name = (r.get("company_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        n = int(r.get("n") or 0)
        out.append(row(
            "state prevailing-wage contractor (IL)", name, location="IL",
            size_signal="%s to IDOL" % plural(n, "certified transcript of payroll"),
            fit=("Files certified transcripts of payroll with the Illinois DOL on state "
                 "prevailing-wage projects, the same county-and-craft rate problem WageLens "
                 "solves for Davis-Bacon."),
            source_url="https://illinois-edp.data.socrata.com/d/gd6a-xm49",
            notes="Illinois DOL Certified Transcript of Payroll (Report 1); latest year %s; "
                  "a project county seen: %s" % (r.get("latest") or "n/a", r.get("county") or "n/a"),
        ))
    return out


# ------------------------------------------------------------------ NYC / other



CONSTRUCTION_WORDS = re.compile(
    r"construct|contract|electric|plumb|hvac|mechanic|concrete|mason|paint|roof|"
    r"drywall|floor|steel|excavat|paving|asphalt|demolition|carpentr|glaz|"
    r"insulat|weld|site work|sitework|utilit|landscap|general contractor|"
    r"heating|air condition|sheet metal|iron work", re.I)


def city_rows(limit_nyc=750, limit_nola=300):
    out = []
    nyc = soql(
        "data.cityofnewyork.us", "ci93-uc8s",
        select="vendor_formal_name,vendor_dba,city,state,website,"
               "id6_digit_naics_code,naics_title,certification",
        where="naics_sector like '%Construction%'",
        order="vendor_formal_name", limit=limit_nyc)
    for r in nyc or []:
        name = (r.get("vendor_formal_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        site = clean_site(r.get("website"))
        out.append(row(
            "MWBE/SBE certified construction firm", name, website=site,
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="NYC SBS certification: %s" % (r.get("certification") or "n/a"),
            fit=("City-certified construction M/WBE, the pool NYC and NYS agencies steer "
                 "public-works subcontracts to, so it works prevailing-wage jobs and files "
                 "certified payroll."),
            source_url="https://data.cityofnewyork.us/d/ci93-uc8s",
            notes="NYC SBS Certified Business List; NAICS %s %s; website as published in the "
                  "register, not independently opened"
                  % (r.get("id6_digit_naics_code") or "", r.get("naics_title") or ""),
        ))
    nola = soql(
        "data.nola.gov", "q42h-ptn2",
        select="company_name,physical_address,website,certification_type,capability,"
               "certifying_agency,service_type",
        where="service_type='Construction'", order="company_name", limit=limit_nola)
    for r in nola or []:
        name = (r.get("company_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        out.append(row(
            "DBE certified construction firm", name, website=clean_site(r.get("website")),
            location="New Orleans, LA",
            size_signal="certification: %s (%s)" % (r.get("certification_type") or "n/a",
                                                    r.get("certifying_agency") or "n/a"),
            fit=("Certified DBE/SLDBE in construction with the City of New Orleans, so it "
                 "subcontracts on federally assisted local work carrying Davis-Bacon."),
            source_url="https://data.nola.gov/d/q42h-ptn2",
            notes="New Orleans DBE directory; capability: %s; website as published in the "
                  "register, not independently opened" % ((r.get("capability") or "")[:150]),
        ))
    for r in soql("data.delaware.gov", "g7vn-fpb4", limit=200) or []:
        name = (r.get("company") or "").strip()
        if not name or looks_like_person(name):
            continue
        out.append(row(
            "public works prequalified contractor (DE)", name,
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="Delaware public works prequalification, trade: %s"
                        % (r.get("trade_classification") or "n/a"),
            fit=("Annually prequalified by Delaware OMB for public works, which carries the "
                 "state prevailing-wage and certified-payroll obligation."),
            source_url="https://data.delaware.gov/d/g7vn-fpb4",
            notes="DE Public Works Annually Prequalified Contractors/Subcontractors; "
                  "prequalification expires %s" % (r.get("dateexpire") or "")[:10],
        ))
    for r in soql("data.cincinnati-oh.gov", "2iq3-bugw",
                  where="cert_status='ACTIVE'", limit=500) or []:
        name = (r.get("business_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        if not CONSTRUCTION_WORDS.search(name):
            continue
        out.append(row(
            "MWBE/SBE certified construction firm",
            title_case(name) if name.isupper() else name,
            website=clean_site(r.get("website")),
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="Cincinnati certification: %s" % (r.get("cert_type") or "n/a"),
            fit=("City-certified minority/women business enterprise whose name places it in "
                 "the construction trades, the pool Cincinnati steers public construction "
                 "subcontracts to."),
            source_url="https://data.cincinnati-oh.gov/d/2iq3-bugw",
            confidence="secondary",
            notes="Cincinnati Economic Inclusion Certified Vendors; construction fit inferred "
                  "from the business name (the dataset has no NAICS column); website as "
                  "published in the register, not independently opened",
        ))
    for r in soql("data.norfolk.gov", "393b-ph9i", limit=500) or []:
        name = (r.get("company_name") or r.get("business_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        blob = "%s %s" % (name, r.get("nigp_code_and_description") or "")
        if not CONSTRUCTION_WORDS.search(blob):
            continue
        out.append(row(
            "MWBE/SBE certified construction firm",
            title_case(name) if name.isupper() else name,
            location=", ".join(x for x in (title_case(r.get("city") or ""),
                                           (r.get("state") or "").strip()) if x),
            size_signal="Norfolk SWaM certification: %s" % (r.get("certification_type") or "n/a"),
            fit=("City-certified small/women/minority construction firm in a federal-aid "
                 "heavy region (Norfolk naval and port work), so it subcontracts on "
                 "Davis-Bacon covered projects."),
            source_url="https://data.norfolk.gov/d/393b-ph9i",
            confidence="secondary",
            notes="Norfolk SWaM Certified Businesses; construction fit inferred from NIGP "
                  "code/name: %s" % ((r.get("nigp_code_and_description") or "")[:120]),
        ))
    return out


# ---------------------------------------------------------------------- NJ / TX


def nj_rows(limit=600):
    """NJSAVI: NJ small/minority/women business registry, construction craft only."""
    out = []
    for r in soql("data.nj.gov", "tfhb-8beb",
                  select="business_name,business_city,business_state,email_address,"
                         "certification_type,commodity_type,commodity_code_description",
                  where="commodity_type like '%Construction%'",
                  order="business_name", limit=limit) or []:
        name = (r.get("business_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        out.append(row(
            "MWBE/SBE certified construction firm",
            title_case(name) if name.isupper() else name,
            location=", ".join(x for x in (title_case(r.get("business_city") or ""),
                                           (r.get("business_state") or "").strip()) if x),
            size_signal="NJ certification: %s" % (r.get("certification_type") or "n/a"),
            fit=("Registered in NJSAVI under a construction craft commodity type, so it bids "
                 "New Jersey public work, which carries the state Prevailing Wage Act plus "
                 "Davis-Bacon on federally assisted jobs."),
            contact=mailbox(r.get("email_address")),
            source_url="https://data.nj.gov/d/tfhb-8beb",
            notes="NJSAVI (NJ Selective Assistance Vendor Information); commodity type %s"
                  % (r.get("commodity_type") or "")[:80],
        ))
    return out


def tx_rows(limit=500):
    """TxDOT bid tabulations: contractors bidding federal-aid highway lettings."""
    out = []
    for r in soql("data.texas.gov", "de7b-7dna",
                  select="vendor_name,count(*) as n,max(project_actual_let_date) as latest,"
                         "max(county) as county",
                  where="project_actual_let_date > '2024-01-01' and "
                        "federal_project_number is not null",
                  group="vendor_name", order="n DESC", limit=limit) or []:
        name = (r.get("vendor_name") or "").strip()
        if not name or looks_like_person(name):
            continue
        if "engineer" in name.lower() and "estimate" in name.lower():
            continue
        n = int(r.get("n") or 0)
        out.append(row(
            "state prevailing-wage contractor (TX)",
            title_case(name) if name.isupper() else name, location="TX",
            size_signal="%d bid line items on TxDOT federal-aid lettings since 2024" % n,
            fit=("Bids TxDOT lettings that carry a federal project number, so the work is "
                 "federal-aid highway construction covered by Davis-Bacon with weekly "
                 "certified payroll due to TxDOT."),
            source_url="https://data.texas.gov/d/de7b-7dna",
            notes="TxDOT Bid Tabulations, federal-aid projects only; latest let %s; a county "
                  "seen: %s" % ((r.get("latest") or "")[:10], r.get("county") or "n/a"),
        ))
    return out


# ---------------------------------------------------------------------- SAM.gov


SAM_NAICS = ["238110", "238120", "238140", "238150", "238160", "238190", "238210",
             "238220", "238290", "238310", "238320", "238330", "238350", "238390",
             "238910", "238990", "236220", "237310"]
SAM_URL = ("https://sam.gov/api/prod/sgs/v1/search/?index=opp&page=%d&size=100"
           "&mode=search&sort=-modifiedDate&notice_type=a&naics=%s")


def sam_rows(pages=1):
    out, seen = [], set()
    for code in SAM_NAICS:
        for p in range(pages):
            d = get(SAM_URL % (p, code))
            if not d:
                break
            res = ((d.get("_embedded") or {}).get("results")) or []
            if not res:
                break
            for r in res:
                aw = ((r.get("award") or {}).get("awardee") or {})
                name = (aw.get("name") or "").strip()
                uei = (aw.get("ueiSAM") or "").strip()
                if not name or looks_like_person(name):
                    continue
                key = uei or name.upper()
                if key in seen:
                    continue
                seen.add(key)
                org = (r.get("organizationHierarchy") or [{}])[0].get("name") or ""
                pop = ""
                for h in reversed(r.get("organizationHierarchy") or []):
                    a = h.get("address") or {}
                    if a.get("state"):
                        pop = ", ".join(x for x in (title_case(a.get("city") or ""),
                                                    a.get("state")) if x)
                        break
                out.append(row(
                    "federal construction awardee (SAM.gov)",
                    title_case(name) if name.isupper() else name,
                    location="",
                    size_signal="federal award notice under NAICS %s, %s"
                                % (code, (r.get("publishDate") or "")[:10]),
                    fit=("Named as the awardee on a federal construction award notice, so the "
                         "contract carries Davis-Bacon wage determinations and weekly WH-347 "
                         "certified payroll."),
                    source_url=("https://sam.gov/entity/%s" % uei) if uei
                               else "https://sam.gov/opp/%s/view" % (r.get("_id") or ""),
                    source_type="api",
                    notes="SAM.gov award notice '%s'; awarding org %s (%s); UEI %s; the "
                          "notice does not carry the firm's own address, so location is "
                          "left empty rather than guessed"
                          % ((r.get("title") or "")[:90], org, pop or "n/a", uei or "n/a"),
                ))
        print("  sam.gov %s -> %d cumulative awardees" % (code, len(out)), flush=True)
    return out


# ---------------------------------------------------------------------- main


def main():
    root = os.getcwd()
    outdir = os.path.join(root, "phase-3-acquisition", "prospects", "wagelens")
    if not os.path.isdir(outdir):
        sys.exit("run this from the repository root (missing %s)" % outdir)
    rows = []
    for label, fn in (("WA L&I", wa_rows), ("NY", ny_rows), ("IL", il_rows),
                      ("NJ", nj_rows), ("TX", tx_rows),
                      ("city registers", city_rows), ("SAM.gov", sam_rows)):
        got = fn()
        print("%-16s %5d rows" % (label, len(got)), flush=True)
        rows.extend(got)
    # dedupe on name+website, keeping the first (richest) occurrence
    seen, dedup = set(), []
    for r in rows:
        k = (r["name"].lower().strip(), r["website"].lower().strip())
        if k in seen:
            continue
        seen.add(k)
        dedup.append(r)
    path = os.path.join(outdir, "scripts", "secondary_rows.csv")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(dedup)
    print("wrote %d rows to scripts/secondary_rows.csv" % len(dedup))


if __name__ == "__main__":
    main()
