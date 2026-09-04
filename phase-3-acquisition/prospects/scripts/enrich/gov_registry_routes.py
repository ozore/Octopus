#!/usr/bin/env python3
"""Bulk route discovery from the government registers phase 3 already used.

Four of the Socrata datasets behind `wagelens/prospects.csv` publish a business
contact e-mail that the phase-3 pull did not take (it took the name, the city
and the filing counts). Those addresses are published by the state or the city
on the organisation's own register entry, so they are business routes in the
sense of `BRIEF.md` §2.2 — but most of them are a named person's mailbox, so
every one is filtered through the same role allowlist as everything else and
the overwhelming majority are dropped.

    python3 phase-3-acquisition/prospects/scripts/enrich/gov_registry_routes.py

Writes `state/<dir>-gov.jsonl` in the same shape as `run_enrich.py`, so
`build_enrichment_csv.py` merges the two without knowing the difference.
Re-running is safe: rows already recorded are skipped.
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import re
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import enrich_lib as L  # noqa: E402

PROSPECTS = L.REPO / "phase-3-acquisition" / "prospects"
TODAY = dt.date.today().isoformat()

# dataset -> how to read an organisation name and a business e-mail out of it
SOURCES = [
    {
        "id": "wa-intents",
        "url": "https://data.wa.gov/resource/t9je-9qwa.json",
        "params": {"$select": "companyname,max(email) as email",
                   "$group": "companyname", "$limit": "60000"},
        "name": "companyname", "email": "email",
        "page": "https://data.wa.gov/d/t9je-9qwa",
        "what": "WA L&I statement-of-intent filings",
    },
    {
        "id": "nj-njsavi",
        "url": "https://data.nj.gov/resource/tfhb-8beb.json",
        "params": {"$select": "business_name,email_address", "$limit": "20000"},
        "name": "business_name", "email": "email_address",
        "page": "https://data.nj.gov/d/tfhb-8beb",
        "what": "NJ NJSAVI vendor registry",
    },
    {
        "id": "nys-ucp-dbe",
        "url": "https://data.ny.gov/resource/pfeu-dsx6.json",
        "params": {"$select": "company_name,email", "$limit": "20000"},
        "name": "company_name", "email": "email",
        "page": "https://data.ny.gov/d/pfeu-dsx6",
        "what": "NYS Unified Certification Program DBE directory",
    },
    {
        "id": "nola-dbe",
        "url": "https://data.nola.gov/resource/q42h-ptn2.json",
        "params": {"$select": "company_name,email", "$limit": "20000"},
        "name": "company_name", "email": "email",
        "page": "https://data.nola.gov/d/q42h-ptn2",
        "what": "New Orleans DBE/SLDBE directory",
    },
]

DIRS = ["wagelens", "certly-pm", "certly-gc", "stateready"]


def field(row: dict, key: str) -> str:
    """Socrata returns a URL column as `{"url": "..."}`, not a string."""
    if not key:
        return ""
    value = row.get(key)
    if isinstance(value, dict):
        value = value.get("url") or value.get("description") or ""
    return (value or "").strip() if isinstance(value, str) else ""


def match_key(name: str) -> str:
    """Normalised organisation name, legal suffixes removed."""
    return "".join(L.core_tokens(name))


def fetch_json(url: str, params: dict) -> list:
    full = url + "?" + urllib.parse.urlencode(params)
    status, _, body = L.fetch(full, timeout=90)
    if status != 200 or not body.strip():
        print(f"  ! {full[:110]} -> http {status}")
        return []
    try:
        return json.loads(body)
    except ValueError:
        print(f"  ! {full[:110]} -> not JSON")
        return []


def load_targets() -> dict:
    """key -> list of (directory, name, location) still without a route."""
    targets: dict = {}
    for directory in DIRS:
        path = PROSPECTS / directory / "prospects.csv"
        if not path.exists():
            continue
        with open(path, newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                if row.get("prospect_type") not in ("end-customer", "partner"):
                    continue
                if (row.get("contact_route") or "").strip():
                    continue
                key = match_key(row.get("name", ""))
                if len(key) < 5:
                    continue
                targets.setdefault(key, []).append(
                    (directory, row.get("name", ""), row.get("location", "")))
    return targets


def main() -> int:
    L.load_blocked()
    targets = load_targets()
    print(f"{len(targets)} distinct organisations still without a route")
    states = {d: L.State(f"{d}-gov") for d in DIRS}
    totals = {"matched": 0, "mailbox": 0, "website": 0, "dropped_personal": 0}

    for source in SOURCES:
        rows = fetch_json(source["url"], source["params"])
        print(f"{source['id']}: {len(rows)} register rows")
        found = 0
        for row in rows:
            name = field(row, source["name"])
            if not name:
                continue
            key = match_key(name)
            if key not in targets:
                continue
            raw = field(row, source["email"]).lower()
            if not raw:
                continue
            address, _ = L.pick_role_mailbox(
                [raw], L.registrable(raw.rsplit("@", 1)[-1]))
            if not address:
                # a named person's mailbox, or a free-mail provider
                totals["dropped_personal"] += 1
                continue
            for directory, exact_name, location in targets[key]:
                state = states[directory]
                org = L.org_key(exact_name, location)
                if state.has(org):
                    continue
                evidence = source["page"]
                website = ""
                notes = [f"register: {source['what']}"]
                if address:
                    # the register gives a mailbox; confirm the matching site
                    # with one fetch so the website is never merely derived
                    domain = address.rsplit("@", 1)[1]
                    status, final, body = L.fetch(f"https://{domain}/")
                    if status and status < 400 and body:
                        ok, why = L.name_matches(exact_name, L.page_title(body),
                                                 L.page_text(body)[:12000],
                                                 L.host_of(final), location)
                        if ok:
                            website = f"https://{L.host_of(final)}/"
                            notes.append(f"site confirmed from the mailbox domain: {why}")
                            evidence = final
                        else:
                            notes.append(f"mailbox domain not confirmed as the site: {why}")
                    else:
                        notes.append(f"mailbox domain did not answer (http {status})")
                state.add({
                    "key": org, "name": exact_name, "location": location,
                    # only a site this run actually opened; the register's own
                    # `website` column is confirmed by run_enrich, not claimed here
                    "website": website,
                    "contact_route": address, "route_type": "mailbox" if address else "none",
                    "evidence_url": evidence, "checked_on": TODAY,
                    "method": "gov-register", "notes": "; ".join(notes),
                })
                found += 1
                totals["matched"] += 1
                totals["mailbox"] += 1 if address else 0
                totals["website"] += 1 if website else 0
        print(f"  -> {found} organisations matched and recorded")
        L.save_blocked()

    print(f"total: {totals['matched']} recorded, {totals['mailbox']} generic mailboxes, "
          f"{totals['website']} websites confirmed, "
          f"{totals['dropped_personal']} register addresses dropped as personal/free-mail")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
