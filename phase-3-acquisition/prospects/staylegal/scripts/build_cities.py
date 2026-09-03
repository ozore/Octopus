#!/usr/bin/env python3
"""Build phase-3-acquisition/prospects/staylegal/cities.csv from the
jurisdiction detail already collected in raw/city_detail.json.

Run from the repo root: python3 scripts/build_cities.py  (paths are relative to
phase-3-acquisition/prospects/staylegal/).
"""
import csv, json, os, re

D = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(D):
    D = "."
DATE = "2026-09-03"

STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
 "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas",
 "Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota",
 "Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
 "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
 "Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas",
 "Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
 "District of Columbia"]


SLUG_STATE = {s.replace(" ", "-"): s for s in STATES}
SLUG_STATE["DC"] = "District of Columbia"


def regime(q):
    ql = q.lower()
    if re.search(r"\bno\b[^.]{0,40}(permit|licen[cs]e|registration)[^.]{0,25}"
                 r"(required|at all|exists|to get|to obtain)", ql):
        return "no permit (tax registration only)"
    if "banned" in ql or "prohibited" in ql or "not allowed" in ql:
        return "ban / prohibited"
    if "permit" in ql and ("primary residence" in ql or "owner-occupied" in ql
                           or "live in" in ql or "you live" in ql):
        return "permit (primary-residence limited)"
    if "permit" in ql:
        return "permit"
    if "licen" in ql:
        return "license"
    if "registration" in ql or "register" in ql:
        return "registration"
    return "unclear"


OTHER = re.compile(r"\b([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s+"
                   r"(charges|levies|requires|caps|bans|adds|wants)\b")
FEEWORD = re.compile(r"permit|licen[cs]e|registration|registr|certificate|application", re.I)
PERUNIT = re.compile(r"per (room|night|stay|guest|day|person)|a night|nightly", re.I)


def pick_fee(quick, desc, place):
    """Return a fee the page states for THIS jurisdiction, or ''.

    Guides often compare neighbouring cities ("Garland charges $500 a year"),
    so a sentence that attributes the amount to some other named place is
    rejected rather than mis-filed as the subject's fee."""
    for text in (desc, quick):
        for sent in re.split(r"(?<=[.!?]) ", text):
            amts = re.findall(r"\$[\d,]+(?:\.\d\d)?", sent)
            if not amts or not FEEWORD.search(sent):
                continue
            m = OTHER.search(sent)
            if m and m.group(1).lower() not in place.lower():
                continue
            good = ""
            for a in amts:
                pos = sent.find(a)
                tail = sent[pos + len(a): pos + len(a) + 26].lower()
                if re.search(r"insurance|liability|coverage|bond|fine|penalt", tail):
                    continue
                if PERUNIT.search(tail):
                    continue  # a nightly tax, not a permit fee
                try:
                    if int(a.replace("$", "").replace(",", "").split(".")[0]) > 9999:
                        continue
                except ValueError:
                    continue
                good = a
                break
            if not good:
                continue
            return good.rstrip(".,;:"), re.sub(r"\s+", " ", sent).strip()[:220]
    return "", ""


ABBR = {"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
 "CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia",
 "HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas",
 "KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts",
 "MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana",
 "NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico",
 "NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma",
 "OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina",
 "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
 "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming"}

SPM_FEE = re.compile(r"(?:registration|permit|licen[cs]e|application|initial application)"
                     r"\s*fee\s*:?\s*(\$[\d,]+)", re.I)


def spm_rows(seen):
    """Resort, beach and mountain markets BNBCalc has no guide for."""
    path = os.path.join(D, "raw", "spm.json")
    if not os.path.exists(path):
        return []
    out = []
    for url, v in json.load(open(path)).items():
        if not v:
            continue
        st_abbr, slug = url.rstrip("/").split("/")[-2:]
        state = ABBR.get(st_abbr, "")
        if not state:
            continue
        place = slug.replace("-", " ").title()
        if (place.lower(), state) in seen:
            continue
        seen.add((place.lower(), state))
        m = SPM_FEE.search(v["fee"] or "")
        reg = "permit / registration"
        low = (v["overview"] or "").lower()
        if "prohibited" in (v["allowed"] or "") and "allowed" not in (v["allowed"] or ""):
            reg = "ban / prohibited"
        elif "licen" in low and "permit" not in low:
            reg = "license"
        out.append({
            "jurisdiction": place, "state": state, "regime_type": reg,
            "permit_fee": m.group(1) if m else "",
            "renewal_cadence": v["renewal"],
            "ordinance_or_program_url": "",
            "enforcement_vendor": "",
            "notes": re.sub(r"\s+", " ", (v["overview"] or ""))[:400],
            "source_url": url, "collected_on": DATE,
        })
    return out


def main():
    det = json.load(open(os.path.join(D, "raw", "city_detail.json")))
    rows = []
    seen = set()
    for path, v in det.items():
        if not v:
            continue
        title = v["title"]
        m = re.match(r"(.+?) Short-Term Rental Regulations", title)
        place = (m.group(1) if m else title).strip()
        # the slug carries the state even when the page heading omits it
        slug = path.rsplit("/", 1)[-1]
        slug = re.sub(r"-(guide|Guide)$", "", slug)
        state = ""
        sl_low = slug.lower()
        for sl, full in SLUG_STATE.items():
            if sl_low.endswith("-" + sl.lower()):
                state = full
                break
        if not state:
            for sname in STATES:
                if place.endswith(", " + sname):
                    state = sname
                    break
        if not state:
            continue
        if place.endswith(", " + state):
            place = place[: -(len(state) + 2)]
        key = (place.lower(), state)
        if key in seen:
            continue
        seen.add(key)
        fee, feenote = pick_fee(v["quick"], v["desc"], place)
        gov = v["gov"][0] if v["gov"] else ""
        notes = v["desc"] or v["quick"][:280]
        if feenote:
            notes = feenote + " " + notes
        rows.append({
            "jurisdiction": place,
            "state": state,
            "regime_type": regime(v["quick"]),
            "permit_fee": fee,
            "renewal_cadence": v["renewal"],
            "ordinance_or_program_url": gov,
            "enforcement_vendor": "; ".join(v["vendors"]),
            "notes": re.sub(r"\s+", " ", notes)[:400],
            "source_url": "https://www.bnbcalc.com" + path,
            "collected_on": DATE,
        })
    rows.extend(spm_rows(seen))
    rows.sort(key=lambda r: (r["state"], r["jurisdiction"]))
    cols = ["jurisdiction","state","regime_type","permit_fee","renewal_cadence",
            "ordinance_or_program_url","enforcement_vendor","notes","source_url","collected_on"]
    with open(os.path.join(D, "cities.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)
    print("cities.csv", len(rows), "rows;",
          sum(1 for r in rows if r["permit_fee"]), "with a stated fee;",
          len({r["state"] for r in rows}), "states")


if __name__ == "__main__":
    main()
