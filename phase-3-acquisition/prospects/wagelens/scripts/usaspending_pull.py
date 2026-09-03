#!/usr/bin/env python3
"""
WageLens prospect pull from api.usaspending.gov (public, no API key).

Run from the repository root with no arguments:

    python3 phase-3-acquisition/prospects/wagelens/scripts/usaspending_pull.py

What it does
------------
1. Prime contract awards (award_type_codes A/B/C/D) for the construction NAICS set
   below, action dates from 2024-01-01, award amounts $50,000-$10,000,000
   (the small/mid firm band), paginated to exhaustion or 150 pages per NAICS.
   Endpoint: POST /api/v2/search/spending_by_award/

2. Subawards on federal construction prime awards, i.e. the subcontractors who
   are *already working a Davis-Bacon covered job*. Two passes:
     a) bulk: POST /api/v2/search/spending_by_award/ with "subawards": true,
        filtered on the prime award's NAICS (the whole construction set).
     b) per-prime: POST /api/v2/subawards/ for a sample of the largest
        construction prime awards found in pass 1 (the endpoint named in the
        app brief; valid sort fields are id, subaward_number, description,
        action_date, amount, recipient_name).

3. Aggregates per recipient (dedupe on recipient_id, else on normalised name):
   award count, total amount, latest award date, states of performance,
   awarding agencies, NAICS list, and the recipient profile URL
   https://www.usaspending.gov/recipient/<recipient_id>/latest as source_url.

4. Drops recipients whose name looks like a natural person (BRIEF.md 2.1: no
   private individuals) and moves recipients with more than $50M of awards in
   the window into large_primes_excluded.csv.

5. Writes prospects.csv-schema rows to scripts/api_rows.csv, capped at 5,000
   rows sorted by award count desc.

Outputs (relative to repo root):
    phase-3-acquisition/prospects/wagelens/scripts/api_rows.csv
    phase-3-acquisition/prospects/wagelens/large_primes_excluded.csv

Raw JSON pages are cached OUTSIDE the repository (default /tmp/wagelens_usaspending_cache,
override with WAGELENS_CACHE). Nothing large is written into the repo.
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
import urllib.request

API = "https://api.usaspending.gov/api/v2"
COLLECTED_ON = "2026-09-03"
APP = "wagelens"

START_DATE = "2024-01-01"
END_DATE = "2026-09-03"
AMOUNT_LOWER = 50_000
AMOUNT_UPPER = 10_000_000
MAX_PAGES = 150
PAGE_SIZE = 100
LARGE_PRIME_THRESHOLD = 50_000_000

# 19 specialty trade NAICS + commercial building GCs + highway/street/bridge.
NAICS = {
    "238110": "poured concrete foundation and structure contractor",
    "238120": "structural steel and precast concrete contractor",
    "238130": "framing contractor",
    "238140": "masonry contractor",
    "238150": "glass and glazing contractor",
    "238160": "roofing contractor",
    "238170": "siding contractor",
    "238190": "other foundation, structure and building exterior contractor",
    "238210": "electrical contractor",
    "238220": "plumbing, heating and air-conditioning contractor",
    "238290": "other building equipment contractor",
    "238310": "drywall and insulation contractor",
    "238320": "painting and wall covering contractor",
    "238330": "flooring contractor",
    "238340": "tile and terrazzo contractor",
    "238350": "finish carpentry contractor",
    "238390": "other building finishing contractor",
    "238910": "site preparation contractor",
    "238990": "all other specialty trade contractor",
    "236220": "commercial and institutional building general contractor",
    "237310": "highway, street and bridge construction contractor",
}

CACHE = os.environ.get("WAGELENS_CACHE", "/tmp/wagelens_usaspending_cache")

# ---------------------------------------------------------------- http helpers


def _cache_path(payload, path):
    key = hashlib.sha1((path + json.dumps(payload, sort_keys=True)).encode()).hexdigest()
    return os.path.join(CACHE, key + ".json.gz")


def post(path, payload, tries=4):
    """POST JSON to the USAspending API with an on-disk cache and backoff."""
    os.makedirs(CACHE, exist_ok=True)
    cp = _cache_path(payload, path)
    if os.path.exists(cp):
        try:
            with gzip.open(cp, "rt", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            os.remove(cp)
    body = json.dumps(payload).encode()
    last = None
    for attempt in range(tries):
        req = urllib.request.Request(
            API + path,
            data=body,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            with gzip.open(cp, "wt", encoding="utf-8") as fh:
                json.dump(data, fh)
            return data
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:400]
            last = "HTTP %s %s" % (e.code, detail)
            if e.code in (400, 422):  # malformed request: retrying will not help
                break
        except Exception as e:  # noqa: BLE001
            last = repr(e)
        time.sleep(2 * (attempt + 1))
    sys.stderr.write("  ! %s failed: %s\n" % (path, last))
    return None


# ------------------------------------------------------------ name hygiene


COMPANY_TOKENS = re.compile(
    r"\b("
    r"INC|INCORPORATED|LLC|L\.?L\.?C|LLP|LP|LTD|CORP|CORPORATION|CO|COMPANY|"
    r"PLLC|PC|PA|ENTERPRISES?|GROUP|HOLDINGS?|PARTNERS?|ASSOCIATES?|ASSOC|"
    r"CONSTRUCTION|CONSTRUCTORS?|CONTRACTING|CONTRACTORS?|CONTRACTOR|BUILDERS?|"
    r"BUILDING|ELECTRIC|ELECTRICAL|MECHANICAL|PLUMBING|HVAC|ROOFING|MASONRY|"
    r"CONCRETE|PAINTING|GLASS|GLAZING|FLOORING|DRYWALL|INSULATION|STEEL|"
    r"EXCAVATING|EXCAVATION|PAVING|LANDSCAPING|SERVICES?|SERVICE|SOLUTIONS?|"
    r"SYSTEMS?|INDUSTRIES|INDUSTRIAL|ENGINEERING|ENGINEERS|DEVELOPMENT|"
    r"SUPPLY|EQUIPMENT|UTILITIES|UTILITY|SPECIALTIES|SPECIALTY|WORKS|"
    r"TECHNOLOGIES|TECHNOLOGY|MAINTENANCE|MANAGEMENT|RESTORATION|ROOFERS|"
    r"FIRE|SHEET|METAL|MILLWORK|PLASTERING|TILE|CARPENTRY|INTERIORS?|"
    r"FOUNDATION|FOUNDATIONS|DRILLING|BORING|WELDING|COATINGS?|"
    r"NATION|TRIBE|TRIBAL|UNIVERSITY|COLLEGE|DISTRICT|AUTHORITY|BOARD|"
    r"USA|US|AMERICA|AMERICAN|NATIONAL|INTERNATIONAL|GENERAL|"
    r"FLOORS|ROOFS|ROOFERS|PAINTERS|PLUMBERS|ELECTRICIANS|PIPING|HEATING|"
    r"COOLING|AIR|SHEETMETAL|ASPHALT|PAVERS|ENERGY|POWER|LIGHTING|SECURITY|"
    r"ALARM|SIGNS|DOORS|WINDOWS|CABINETS|LANDSCAPE|IRON|IRONWORKS|WELD|CRANE|"
    r"DEMOLITION|ENVIRONMENTAL|INSULATORS|ACOUSTICAL|CERAMIC|MARBLE|GRANITE|"
    r"STONE|BRICK|PLASTER|STUCCO|WATERPROOFING|ELEVATOR|SPRINKLER|FIREPROOFING|"
    r"EXCAVATORS|GRADING|TRUCKING|HAULING|PIPELINE|TELECOM|COMMUNICATIONS|"
    r"CONTROLS|AUTOMATION|REFRIGERATION|MILLWRIGHT|RIGGING|SCAFFOLD|PARTITIONS|"
    r"INTERIOR|EXTERIOR|MECHANICS|BUILDS|BUILD|CRAFT|CRAFTSMEN|TRADES|LABOR|"
    r"PROJECTS?|VENTURES?|BROTHERS|BROS|SONS|FAMILY|TEAM|CREW|WORKS|WORKZ|"
    r"CONCEPTS|DESIGNS?|RESOURCES|CAPITAL|COMMERCIAL|RESIDENTIAL|INDUSTRIES|"
    r"AND|&|OF|THE|DBA"
    r")\b",
    re.I,
)
PERSONISH = re.compile(r"^[A-Z][A-Za-z'\-]+(?:\s+[A-Z]\.?)?\s+[A-Z][A-Za-z'\-]+$")
SUFFIXES = re.compile(r"\b(JR|SR|II|III|IV)\b", re.I)


def looks_like_person(name):
    """True when the recipient name reads like a natural person (BRIEF.md 2.1)."""
    n = " ".join((name or "").split())
    if not n:
        return True
    if COMPANY_TOKENS.search(n):
        return False
    if "," in n and not SUFFIXES.search(n):
        # "SMITH, JOHN" style register entries
        parts = [p.strip() for p in n.split(",")]
        if len(parts) == 2 and all(len(p.split()) <= 2 for p in parts):
            return True
    words = n.split()
    if 2 <= len(words) <= 3 and PERSONISH.match(n):
        return True
    if len(words) == 3 and SUFFIXES.search(words[-1]):
        return True
    return False


def norm_name(name):
    n = (name or "").upper()
    n = re.sub(r"[^A-Z0-9 ]+", " ", n)
    n = re.sub(r"\b(INC|INCORPORATED|LLC|LLP|LP|LTD|CORP|CORPORATION|CO|COMPANY|PLLC|THE)\b", " ", n)
    return " ".join(n.split())


KEEP_UPPER = {"LLC", "L.L.C.", "LLP", "LP", "PC", "USA", "US", "HVAC", "II", "III",
              "IV", "JV", "NW", "NE", "SW", "SE", "DC", "AFB", "HVACR", "DBE"}


def title_case(s):
    """Title-case an ALL CAPS register value without mangling real acronyms."""
    return " ".join(w.upper() if w.upper() in KEEP_UPPER else w.title()
                    for w in (s or "").split())


# ------------------------------------------------------------ prime awards


PRIME_FIELDS = [
    "Award ID",
    "Recipient Name",
    "Award Amount",
    "Start Date",
    "Awarding Agency",
    "Place of Performance State Code",
    "NAICS",
    "recipient_id",
    "Recipient Location",
]


def pull_primes():
    rows = []
    for code, label in NAICS.items():
        got = 0
        for page in range(1, MAX_PAGES + 1):
            payload = {
                "filters": {
                    "time_period": [{"start_date": START_DATE, "end_date": END_DATE}],
                    "award_type_codes": ["A", "B", "C", "D"],
                    "naics_codes": [code],
                    "award_amounts": [
                        {"lower_bound": AMOUNT_LOWER, "upper_bound": AMOUNT_UPPER}
                    ],
                },
                "fields": PRIME_FIELDS,
                "limit": PAGE_SIZE,
                "page": page,
                "sort": "Award Amount",
                "order": "desc",
                "subawards": False,
            }
            data = post("/search/spending_by_award/", payload)
            if not data:
                break
            res = data.get("results") or []
            rows.extend((code, label, r) for r in res)
            got += len(res)
            if not res or not (data.get("page_metadata") or {}).get("hasNext"):
                break
        print("  primes %s %-58s %6d awards" % (code, label, got), flush=True)
    return rows


# ------------------------------------------------------------ subawards


SUB_FIELDS = [
    "Sub-Award ID",
    "Sub-Awardee Name",
    "Sub-Award Amount",
    "Sub-Award Date",
    "Awarding Agency",
    "Prime Recipient Name",
    "Sub-Award Description",
    "Sub-Recipient Location",
    "NAICS",
]


def pull_subawards_bulk():
    """Pass 2a: every subaward whose prime award carries a construction NAICS."""
    rows = []
    for code, label in NAICS.items():
        got = 0
        for page in range(1, MAX_PAGES + 1):
            payload = {
                "subawards": True,
                "filters": {
                    "time_period": [{"start_date": START_DATE, "end_date": END_DATE}],
                    "award_type_codes": ["A", "B", "C", "D"],
                    "naics_codes": [code],
                },
                "fields": SUB_FIELDS,
                "limit": PAGE_SIZE,
                "page": page,
                "sort": "Sub-Award Amount",
                "order": "desc",
            }
            data = post("/search/spending_by_award/", payload)
            if not data:
                break
            res = data.get("results") or []
            rows.extend((code, label, r) for r in res)
            got += len(res)
            if not res or not (data.get("page_metadata") or {}).get("hasNext"):
                break
        print("  subawards %s %-55s %6d subs" % (code, label, got), flush=True)
    return rows


def pull_subawards_per_prime(prime_rows, sample=250):
    """Pass 2b: /api/v2/subawards/ for the largest construction prime awards."""
    seen, picks = set(), []
    for code, label, r in sorted(
        prime_rows, key=lambda t: -(t[2].get("Award Amount") or 0)
    ):
        gid = r.get("generated_internal_id")
        if gid and gid not in seen:
            seen.add(gid)
            picks.append((code, label, r))
        if len(picks) >= sample:
            break
    rows, hit = [], 0
    for code, label, r in picks:
        data = post(
            "/subawards/",
            {
                "award_id": r["generated_internal_id"],
                "sort": "amount",
                "order": "desc",
                "limit": 100,
                "page": 1,
            },
        )
        if not data:
            continue
        res = data.get("results") or []
        if res:
            hit += 1
        for s in res:
            rows.append(
                (
                    code,
                    label,
                    {
                        "Sub-Award ID": s.get("subaward_number"),
                        "Sub-Awardee Name": s.get("recipient_name"),
                        "Sub-Award Amount": s.get("amount"),
                        "Sub-Award Date": s.get("action_date"),
                        "Awarding Agency": r.get("Awarding Agency"),
                        "Prime Recipient Name": r.get("Recipient Name"),
                        "Sub-Award Description": s.get("description"),
                        "Sub-Recipient Location": None,
                        "prime_award_generated_internal_id": r.get("generated_internal_id"),
                    },
                )
            )
    print("  subawards per-prime: %d/%d primes had subaward records, %d rows"
          % (hit, len(picks), len(rows)), flush=True)
    return rows


# ------------------------------------------------------------ aggregation


class Rec:
    __slots__ = ("name", "rid", "n", "total", "latest", "states", "agencies",
                 "naics", "cities", "last_award", "kind", "primes", "src")

    def __init__(self, name, rid):
        self.name, self.rid = name, rid
        self.n = 0
        self.total = 0.0
        self.latest = ""
        self.states, self.agencies, self.naics, self.cities = set(), set(), set(), set()
        self.primes = set()
        self.last_award = ""
        self.kind = set()
        self.src = ""


def aggregate(primes, subs):
    recs = {}

    def get(name, rid):
        key = rid or ("N:" + norm_name(name))
        r = recs.get(key)
        if r is None:
            r = recs[key] = Rec(name, rid)
        return r

    for code, label, a in primes:
        name = (a.get("Recipient Name") or "").strip()
        if not name or name.upper() in ("MULTIPLE RECIPIENTS", "REDACTED DUE TO PII"):
            continue
        r = get(name, a.get("recipient_id"))
        r.n += 1
        r.total += a.get("Award Amount") or 0
        d = a.get("Start Date") or ""
        if d > r.latest:
            r.latest, r.last_award = d, a.get("Award ID") or ""
        st = a.get("Place of Performance State Code")
        loc = a.get("Recipient Location") or {}
        if st:
            r.states.add(st)
        elif loc.get("state_code"):
            r.states.add(loc["state_code"])
        if loc.get("city_name") and loc.get("state_code"):
            r.cities.add("%s, %s" % (title_case(loc["city_name"]), loc["state_code"]))
        if a.get("Awarding Agency"):
            r.agencies.add(a["Awarding Agency"])
        r.naics.add(code)
        r.kind.add("prime")
        if not r.src and a.get("recipient_id"):
            r.src = "https://www.usaspending.gov/recipient/%s/latest" % a["recipient_id"]
        if not r.src:
            r.src = "https://www.usaspending.gov/award/%s" % (a.get("generated_internal_id") or "")

    for code, label, s in subs:
        name = (s.get("Sub-Awardee Name") or "").strip()
        if not name or name.upper() in ("MULTIPLE RECIPIENTS", "REDACTED DUE TO PII"):
            continue
        r = get(name, None)
        r.n += 1
        r.total += s.get("Sub-Award Amount") or 0
        d = s.get("Sub-Award Date") or ""
        if d > r.latest:
            r.latest, r.last_award = d, s.get("Sub-Award ID") or ""
        loc = s.get("Sub-Recipient Location") or {}
        if loc.get("state_code"):
            r.states.add(loc["state_code"])
        if loc.get("city_name") and loc.get("state_code"):
            r.cities.add("%s, %s" % (title_case(loc["city_name"]), loc["state_code"]))
        if s.get("Awarding Agency"):
            r.agencies.add(s["Awarding Agency"])
        r.naics.add(code)
        r.kind.add("sub")
        if s.get("Prime Recipient Name"):
            r.primes.add(s["Prime Recipient Name"])
        gid = s.get("prime_award_generated_internal_id")
        if not r.src and gid:
            r.src = "https://www.usaspending.gov/award/%s" % gid
    return recs


# ------------------------------------------------------------ csv output


COLS = ["app", "prospect_type", "segment", "name", "website", "location",
        "size_signal", "fit_rationale", "contact_route", "decision_maker_role",
        "source_url", "source_type", "confidence", "collected_on", "notes"]


def money(x):
    if x >= 1_000_000:
        return "$%.1fM" % (x / 1_000_000)
    return "$%dk" % round(x / 1000)


def build_rows(recs):
    keep, big = [], []
    for r in recs.values():
        if looks_like_person(r.name):
            continue
        primary = sorted(r.naics)[0]
        segment = NAICS.get(primary, "specialty trade contractor")
        states = ",".join(sorted(r.states)[:6])
        location = sorted(r.cities)[0] if len(r.cities) == 1 else (
            sorted(r.cities)[0] if r.cities and len(r.states) == 1 else states)
        kind = "sub" if r.kind == {"sub"} else ("prime+sub" if len(r.kind) > 1 else "prime")
        size = "%d federal award%s, %s total since 2024" % (
            r.n, "" if r.n == 1 else "s", money(r.total))
        if kind == "sub":
            fit = ("Recorded as a subcontractor on a federal construction prime award, "
                   "so it is already on a Davis-Bacon covered job and owes weekly WH-347 "
                   "certified payroll.")
        elif kind == "prime+sub":
            fit = ("Holds federal construction contracts both as a prime and as a "
                   "subcontractor, so it must apply county/craft Davis-Bacon rates and "
                   "file WH-347 on every covered job.")
        else:
            fit = ("Holds federal %s contracts in the $50k-$10M band, the size where "
                   "Davis-Bacon applies but there is no in-house compliance department."
                   % segment)
        agencies = "; ".join(sorted(r.agencies)[:4])
        notes = "role=%s; agencies=%s; latest award %s (%s); NAICS %s" % (
            kind, agencies or "n/a", r.last_award or "n/a", r.latest or "n/a",
            ",".join(sorted(r.naics)))
        if r.primes:
            notes += "; prime(s): " + "; ".join(sorted(r.primes)[:3])
        row = {
            "app": APP,
            "prospect_type": "end-customer",
            "segment": segment,
            "name": title_case(r.name) if r.name.isupper() else r.name,
            "website": "",
            "location": location,
            "size_signal": size,
            "fit_rationale": fit,
            "contact_route": "",
            "decision_maker_role": "owner or office manager",
            "source_url": r.src,
            "source_type": "api",
            "confidence": "verified",
            "collected_on": COLLECTED_ON,
            "notes": notes,
        }
        if r.total > LARGE_PRIME_THRESHOLD:
            row["notes"] += "; excluded: >$50M of federal awards in window, too large for the ICP"
            big.append((r.n, r.total, row))
        else:
            keep.append((r.n, r.total, row))
    keep.sort(key=lambda t: (-t[0], -t[1]))
    big.sort(key=lambda t: (-t[1], -t[0]))
    return stratified_cap(keep, 5000), [t[2] for t in big]


def stratified_cap(keep, cap, per_segment=400):
    """Apply the 5,000-row cap without letting one NAICS crowd out the trades.

    The app brief says 'cap the file at 5,000 rows, sorted by number of awards
    desc'. Taken literally, commercial building GCs (NAICS 236220, 5,586 distinct
    recipients) and the three next-largest codes would fill the whole cap and
    push drywall, masonry, tile, glazing and framing subs - core ICP trades -
    out of the file entirely. So the cap is filled in two rounds: first up to
    `per_segment` recipients per NAICS segment, each segment taken in
    award-count order, then the remaining slots globally in award-count order.
    The emitted list is still sorted by award count desc.
    """
    by_seg = {}
    for t in keep:
        by_seg.setdefault(t[2]["segment"], []).append(t)
    chosen, chosen_ids = [], set()
    for seg, items in by_seg.items():
        for t in items[:per_segment]:
            chosen.append(t)
            chosen_ids.add(id(t))
    if len(chosen) > cap:
        chosen.sort(key=lambda t: (-t[0], -t[1]))
        chosen = chosen[:cap]
        chosen_ids = {id(t) for t in chosen}
    else:
        for t in keep:
            if len(chosen) >= cap:
                break
            if id(t) not in chosen_ids:
                chosen.append(t)
                chosen_ids.add(id(t))
    chosen.sort(key=lambda t: (-t[0], -t[1]))
    return [t[2] for t in chosen]


def write_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)


def main():
    root = os.getcwd()
    outdir = os.path.join(root, "phase-3-acquisition", "prospects", "wagelens")
    if not os.path.isdir(outdir):
        sys.exit("run this from the repository root (missing %s)" % outdir)
    print("pass 1: prime construction awards %s..%s, $%s-$%s"
          % (START_DATE, END_DATE, AMOUNT_LOWER, AMOUNT_UPPER), flush=True)
    primes = pull_primes()
    print("pass 2a: subawards on construction primes (bulk)", flush=True)
    subs = pull_subawards_bulk()
    print("pass 2b: subawards on the largest construction primes (/api/v2/subawards/)", flush=True)
    subs += pull_subawards_per_prime(primes)
    print("aggregating %d prime awards + %d subawards" % (len(primes), len(subs)), flush=True)
    recs = aggregate(primes, subs)
    rows, big = build_rows(recs)
    write_csv(os.path.join(outdir, "scripts", "api_rows.csv"), rows)
    write_csv(os.path.join(outdir, "large_primes_excluded.csv"), big)
    print("wrote %d recipient rows to scripts/api_rows.csv" % len(rows))
    print("wrote %d large primes to large_primes_excluded.csv" % len(big))


if __name__ == "__main__":
    main()
