"""The workbook: one CSV per app, one row per organisation.

Seeded from the phase-3 prospect lists, which are read only and never written.
Re-seeding is an upsert: stages, dates and thread refs already in the workbook
survive, so `seed` is safe to run every morning.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from outbound.engine import config as cfg_mod
from outbound.engine.personalise import extract_facts

COLUMNS = [
    "org_id", "app", "name", "website", "segment", "contact_route",
    "route_type", "personalisation_facts", "stage", "last_action_at",
    "next_action_at", "thread_ref", "notes",
]

ROUTE_TYPES = ("mailbox", "form", "none")

STAGES = (
    "new", "queued", "sent_1", "sent_2", "sent_3", "breakup", "replied",
    "converted", "bounced", "unsubscribed", "do_not_contact",
)

#: Stages that must never receive another email.
TERMINAL_STAGES = ("replied", "converted", "bounced", "unsubscribed", "do_not_contact")

SUPPRESSION_COLUMNS = ["pattern", "kind", "reason", "added_at", "source"]

FREE_MAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com",
    "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "icloud.com",
    "me.com", "mac.com", "proton.me", "protonmail.com", "aol.com", "aim.com",
    "gmx.com", "gmx.net", "mail.com", "yandex.com", "zoho.com", "comcast.net",
    "verizon.net", "att.net", "sbcglobal.net", "bellsouth.net", "cox.net",
    "charter.net", "roadrunner.com", "rr.com", "earthlink.net", "juno.com",
    "windstream.net", "frontier.com", "optonline.net", "pacbell.net",
}

#: Local parts we accept as a generic business mailbox. Anything else is
#: dropped: an address we cannot recognise as a role account is treated as
#: possibly personal (CRM.md 6.2, prospects BRIEF 2.1-2.2).
GENERIC_TOKENS = {
    "info", "information", "contact", "contactus", "contacts", "hello", "hi",
    "sales", "admin", "administration", "office", "support", "service",
    "services", "help", "helpdesk", "team", "mail", "email", "main", "general",
    "enquiry", "enquiries", "inquiry", "inquiries", "ask", "talk", "letstalk",
    "reachus", "connect", "bid", "bids", "bidding", "estimating", "estimate",
    "estimates", "preconstruction", "precon", "marketing", "partner",
    "partners", "partnership", "partnerships", "alliances", "accounting",
    "accounts", "accountspayable", "ap", "ar", "billing", "invoices",
    "payroll", "hr", "humanresources", "careers", "jobs", "recruiting",
    "webmaster", "postmaster", "web", "customerservice", "customercare",
    "custserv", "care", "clientservices", "reception", "frontdesk", "orders",
    "order", "quote", "quotes", "rfp", "rfq", "business", "newbusiness",
    "biz", "safety", "compliance", "operations", "ops", "dispatch",
    "scheduling", "leasing", "rentals", "rent", "management", "manager",
    "property", "properties", "maintenance", "realestate", "corporate", "hq",
    "company", "inquiries2", "solutions", "development", "media", "press",
}


class SeedError(RuntimeError):
    pass


# --------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------

def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:40] or "org"


def org_id_for(name: str, website: str = "") -> str:
    """Stable id: readable slug plus a short digest so two firms never collide."""
    key = f"{(name or '').strip().lower()}|{(website or '').strip().lower()}"
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:6]
    return f"{slugify(name)}-{digest}"


def domain_of(value: str) -> str:
    """Registrable-ish domain from a URL or an email address."""
    value = (value or "").strip().lower()
    if not value:
        return ""
    if value.startswith("mailto:"):
        value = value[len("mailto:"):]
    if "@" in value and "://" not in value:
        return value.rsplit("@", 1)[1].strip().strip("/")
    if "://" not in value:
        value = "http://" + value
    host = urlsplit(value).netloc.split("@")[-1].split(":")[0]
    return host[4:] if host.startswith("www.") else host


def looks_personal(address: str) -> bool:
    """True when a mailbox cannot be shown to be a generic business address."""
    address = (address or "").strip().lower().replace("mailto:", "")
    if "@" not in address:
        return True
    local, _, domain = address.partition("@")
    if domain in FREE_MAIL_DOMAINS:
        return True
    local = re.sub(r"\+.*$", "", local)
    tokens = [t for t in re.split(r"[._\-]+", local) if t]
    if not tokens:
        return True
    if all(t in GENERIC_TOKENS for t in tokens):
        return False
    joined = "".join(tokens)
    if joined in GENERIC_TOKENS:
        return False
    return True


def classify_route(raw: str) -> tuple[str, str, str]:
    """(route_type, route, note). Personal-looking mailboxes lose the route."""
    value = (raw or "").strip()
    if not value:
        return "none", "", ""
    lowered = value.lower()
    if lowered.startswith("mailto:"):
        value = value[len("mailto:"):].strip()
        lowered = value.lower()
    if "@" in value and not lowered.startswith("http"):
        address = value.strip("<> ")
        if looks_personal(address):
            return "none", "", "route dropped: not a recognisable generic business mailbox"
        return "mailbox", address.lower(), ""
    if lowered.startswith("http://") or lowered.startswith("https://"):
        return "form", value, ""
    return "none", "", "route dropped: unrecognised contact route format"


# --------------------------------------------------------------------------
# workbook io
# --------------------------------------------------------------------------

def read_workbook(path: Path) -> list[dict]:
    if not Path(path).exists():
        return []
    with open(path, newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        for column in COLUMNS:
            row.setdefault(column, "")
    return rows


def write_workbook(path: Path, rows: list[dict]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in COLUMNS})


def facts_of(row: dict) -> dict:
    raw = (row.get("personalisation_facts") or "").strip()
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except ValueError:
        return {}
    return value if isinstance(value, dict) else {}


def index_by_id(rows: list[dict]) -> dict:
    return {row["org_id"]: row for row in rows if row.get("org_id")}


# --------------------------------------------------------------------------
# suppression
# --------------------------------------------------------------------------

def read_suppression(app: str) -> list[dict]:
    path = cfg_mod.suppression_path(app)
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_suppression(app: str, rows: list[dict]) -> None:
    path = cfg_mod.suppression_path(app)
    path.parent.mkdir(parents=True, exist_ok=True)
    seen, unique = set(), []
    for row in rows:
        key = ((row.get("kind") or "").strip(), (row.get("pattern") or "").strip().lower())
        if not key[1] or key in seen:
            continue
        seen.add(key)
        unique.append(row)
    unique.sort(key=lambda r: (r.get("kind", ""), r.get("pattern", "")))
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=SUPPRESSION_COLUMNS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows({c: row.get(c, "") for c in SUPPRESSION_COLUMNS} for row in unique)


def add_suppression(app: str, pattern: str, kind: str, reason: str,
                    added_at: str = "", source: str = "") -> None:
    rows = read_suppression(app)
    rows.append({"pattern": pattern, "kind": kind, "reason": reason,
                 "added_at": added_at, "source": source})
    write_suppression(app, rows)


def suppression_matcher(rows: list[dict]):
    """Return `matches(workbook_row) -> reason or ''`."""
    domains, emails, orgs = set(), set(), set()
    reasons: dict = {}
    for row in rows:
        pattern = (row.get("pattern") or "").strip().lower()
        if not pattern:
            continue
        kind = (row.get("kind") or "domain").strip().lower()
        reason = row.get("reason") or kind
        if kind == "email":
            emails.add(pattern)
        elif kind == "org":
            orgs.add(pattern)
        else:
            domains.add(pattern)
        reasons[(kind, pattern)] = reason

    def matches(row: dict) -> str:
        route = (row.get("contact_route") or "").strip().lower()
        if route and route in emails:
            return reasons.get(("email", route), "suppressed")
        for candidate in (domain_of(row.get("website", "")), domain_of(route)):
            if candidate and candidate in domains:
                return reasons.get(("domain", candidate), "suppressed")
        name = (row.get("name") or "").strip().lower()
        if name and name in orgs:
            return reasons.get(("org", name), "suppressed")
        return ""

    return matches


# --------------------------------------------------------------------------
# seeding
# --------------------------------------------------------------------------

def _read_prospects(directory: str) -> list[dict]:
    path = cfg_mod.prospects_root() / directory / "prospects.csv"
    if not path.exists():
        raise SeedError(f"prospects file not found: {path}")
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


# --------------------------------------------------------------------------
# route enrichment (phase-3 `<dir>/routes-enrichment.csv`)
# --------------------------------------------------------------------------

#: Written by `phase-3-acquisition/prospects/scripts/enrich/`, which opens each
#: organisation's own site and records the route it actually found. Optional:
#: when the file is absent the seed behaves exactly as before.
ENRICHMENT_FILE = "routes-enrichment.csv"


def _enrichment_key(name: str, location: str = "") -> tuple:
    return ((name or "").strip().lower(), (location or "").strip().lower())


def read_enrichment(directory: str) -> dict:
    """`(name, location) -> record`, plus a name-only key for unique names.

    A row with an empty `contact_route` (an attempt that failed) is kept: it
    still carries the website when one was confirmed, and the notes explain why
    no route was found.
    """
    path = cfg_mod.prospects_root() / directory / ENRICHMENT_FILE
    if not path.exists():
        return {}
    with open(path, newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    by_key: dict = {}
    name_counts: dict = {}
    for row in rows:
        name = (row.get("name") or "").strip()
        if not name:
            continue
        record = {
            "website": (row.get("website") or "").strip(),
            "contact_route": (row.get("contact_route") or "").strip(),
            "route_type": (row.get("route_type") or "").strip(),
            "evidence_url": (row.get("evidence_url") or "").strip(),
            "checked_on": (row.get("checked_on") or "").strip(),
        }
        by_key[_enrichment_key(name, row.get("location", ""))] = record
        name_counts[name.strip().lower()] = name_counts.get(name.strip().lower(), 0) + 1
    for row in rows:
        name = (row.get("name") or "").strip()
        if not name or name_counts.get(name.lower(), 0) != 1:
            continue
        by_key[_enrichment_key(name, "")] = by_key[
            _enrichment_key(name, row.get("location", ""))]
    return by_key


def enrichment_for(enrichment: dict, prospect: dict) -> dict:
    if not enrichment:
        return {}
    name, location = prospect.get("name", ""), prospect.get("location", "")
    return (enrichment.get(_enrichment_key(name, location))
            or enrichment.get(_enrichment_key(name, ""))
            or {})


def apply_enrichment(prospect: dict, record: dict, route_type: str, route: str,
                     note: str) -> tuple[dict, str, str, str, set]:
    """Merge one enrichment record into one prospect row, non-destructively.

    The phase-3 list wins wherever it holds a value. Two exceptions, both
    narrow and both deliberate:

    * **empty route** — the enrichment supplies the route. This is the whole
      point of the pass: 10,215 WageLens rows have no route at all.
    * **contact page upgraded to a generic mailbox on the same domain** — a
      form is a manual paste for the founder and a mailbox is not, and finding
      a mailbox behind an existing contact page is exactly what the enrichment
      brief asked for on the Certly lists. The upgrade requires the mailbox to
      sit on the **same registrable domain** as the contact page (or the
      recorded website), so it can never point at a different organisation, and
      the original contact page is kept in `notes`.

    The website is only ever filled when phase 3 recorded none. `prospect` is
    never mutated — the phase-3 CSVs are read only and a test asserts they are
    byte-identical after a seed.
    """
    applied: set = set()
    if not record:
        return prospect, route_type, route, note, applied

    if route_type == "form" and record.get("contact_route"):
        new_type, new_route, _ = classify_route(record["contact_route"])
        same_site = domain_of(new_route) and domain_of(new_route) in (
            domain_of(route), domain_of(prospect.get("website", "")))
        if new_type == "mailbox" and same_site:
            checked = record.get("checked_on") or "phase-4 enrichment"
            evidence = record.get("evidence_url") or route
            note = (f"mailbox from routes-enrichment.csv ({checked}), found on "
                    f"{evidence}; phase-3 contact page was {route}")
            route_type, route = new_type, new_route
            applied.add("route_upgraded")

    if route_type == "none" and record.get("contact_route"):
        new_type, new_route, new_note = classify_route(record["contact_route"])
        if new_type != "none":
            route_type, route = new_type, new_route
            checked = record.get("checked_on") or "phase-4 enrichment"
            evidence = record.get("evidence_url") or record.get("website") or ""
            note = f"route from routes-enrichment.csv ({checked})"
            if evidence:
                note += f", verified at {evidence}"
            applied.add("route")
        else:
            # the enrichment offered something we refuse (personal-looking
            # mailbox, unrecognised format): keep the original outcome.
            note = note or new_note

    if not (prospect.get("website") or "").strip() and record.get("website"):
        prospect = dict(prospect)
        prospect["website"] = record["website"]
        applied.add("website")

    return prospect, route_type, route, note, applied


def _workbook_row(app: str, prospect: dict, route_type: str, route: str,
                  note: str) -> dict:
    facts = extract_facts(prospect)
    notes = []
    if note:
        notes.append(note)
    if prospect.get("decision_maker_role"):
        notes.append(f"address the {prospect['decision_maker_role']}")
    if prospect.get("confidence"):
        notes.append(f"phase-3 confidence: {prospect['confidence']}")
    if prospect.get("source_url"):
        notes.append(f"source: {prospect['source_url']}")
    return {
        "org_id": org_id_for(prospect.get("name", ""), prospect.get("website", "")),
        "app": app,
        "name": (prospect.get("name") or "").strip(),
        "website": (prospect.get("website") or "").strip(),
        "segment": (prospect.get("segment") or "").strip(),
        "contact_route": route,
        "route_type": route_type,
        "personalisation_facts": json.dumps(facts, sort_keys=True),
        "stage": "new",
        "last_action_at": "",
        "next_action_at": "",
        "thread_ref": "",
        "notes": "; ".join(notes),
    }


#: Fields the workbook owns; a re-seed refreshes everything else from phase 3.
PRESERVED = ("stage", "last_action_at", "next_action_at", "thread_ref")


def _upsert(existing: list[dict], fresh: list[dict]) -> tuple[list[dict], int, int]:
    by_id = index_by_id(existing)
    merged, added, updated = [], 0, 0
    seen = set()
    for row in fresh:
        org_id = row["org_id"]
        if org_id in seen:
            continue
        seen.add(org_id)
        previous = by_id.get(org_id)
        if previous:
            for field in PRESERVED:
                if (previous.get(field) or "").strip():
                    row[field] = previous[field]
            if previous.get("notes") and previous["notes"] != row["notes"]:
                extra = [p for p in previous["notes"].split("; ")
                         if p and p not in row["notes"]]
                if extra:
                    row["notes"] = "; ".join([row["notes"]] + extra)
            updated += 1
        else:
            added += 1
        merged.append(row)
    # rows the phase-3 list no longer offers are kept if they have any history
    for org_id, previous in by_id.items():
        if org_id in seen:
            continue
        if previous.get("stage", "new") != "new":
            merged.append(previous)
    merged.sort(key=lambda r: (r.get("route_type", ""), r.get("name", "").lower()))
    return merged, added, updated


def seed_from_prospects(app: str, config: dict | None = None) -> dict:
    """Build (or refresh) `workbook.csv`, `workbook-partners.csv`, `suppression.csv`.

    Keeps only end-customer rows with a usable business route: a generic
    mailbox, or a contact page. Partner rows go to their own workbook; excluded
    rows seed the suppression list so they can never be rediscovered as leads.
    """
    config = config or cfg_mod.load_config(app)
    counts = {
        "prospect_rows": 0, "end_customer": 0, "partner": 0, "channel": 0,
        "excluded": 0, "customers_mailbox": 0, "customers_form": 0,
        "customers_dropped_no_route": 0, "customers_dropped_personal": 0,
        "partners_mailbox": 0, "partners_form": 0, "partners_dropped": 0,
        "suppression_rows": 0,
        "enrichment_rows": 0, "customers_route_from_enrichment": 0,
        "customers_route_upgraded_from_enrichment": 0,
        "customers_website_from_enrichment": 0,
        "partners_route_from_enrichment": 0,
        "partners_route_upgraded_from_enrichment": 0,
    }
    customers, partners, suppressed = [], [], []

    for directory in config["prospect_dirs"]:
        enrichment = read_enrichment(directory)
        # one record object is shared by its (name, location) and name-only
        # keys, so identity counts the file's rows rather than its keys
        counts["enrichment_rows"] += len({id(v) for v in enrichment.values()})
        for prospect in _read_prospects(directory):
            counts["prospect_rows"] += 1
            kind = (prospect.get("prospect_type") or "").strip()
            route_type, route, note = classify_route(prospect.get("contact_route", ""))
            prospect, route_type, route, note, applied = apply_enrichment(
                prospect, enrichment_for(enrichment, prospect),
                route_type, route, note)
            if kind == "excluded":
                counts["excluded"] += 1
                for value in (prospect.get("website", ""), prospect.get("contact_route", "")):
                    dom = domain_of(value)
                    if dom:
                        suppressed.append({
                            "pattern": dom, "kind": "domain",
                            "reason": f"excluded in phase-3 list ({directory}): competitor or never-contact",
                            "added_at": prospect.get("collected_on", ""),
                            "source": prospect.get("source_url", ""),
                        })
                if not domain_of(prospect.get("website", "")):
                    suppressed.append({
                        "pattern": (prospect.get("name") or "").strip().lower(),
                        "kind": "org",
                        "reason": f"excluded in phase-3 list ({directory}): no website recorded",
                        "added_at": prospect.get("collected_on", ""),
                        "source": prospect.get("source_url", ""),
                    })
                continue
            if kind == "channel":
                counts["channel"] += 1
                continue
            if kind == "partner":
                counts["partner"] += 1
                if route_type == "none":
                    counts["partners_dropped"] += 1
                    continue
                counts["partners_mailbox" if route_type == "mailbox" else "partners_form"] += 1
                if "route" in applied:
                    counts["partners_route_from_enrichment"] += 1
                if "route_upgraded" in applied:
                    counts["partners_route_upgraded_from_enrichment"] += 1
                partners.append(_workbook_row(app, prospect, route_type, route, note))
                continue
            if kind != "end-customer":
                continue
            counts["end_customer"] += 1
            if "website" in applied:
                counts["customers_website_from_enrichment"] += 1
            if route_type == "none":
                if note.startswith("route dropped: not a recognisable"):
                    counts["customers_dropped_personal"] += 1
                else:
                    counts["customers_dropped_no_route"] += 1
                continue
            counts["customers_mailbox" if route_type == "mailbox" else "customers_form"] += 1
            if "route" in applied:
                counts["customers_route_from_enrichment"] += 1
            if "route_upgraded" in applied:
                counts["customers_route_upgraded_from_enrichment"] += 1
            customers.append(_workbook_row(app, prospect, route_type, route, note))

    customer_path = cfg_mod.workbook_path(app, "customers")
    partner_path = cfg_mod.workbook_path(app, "partners")
    merged_customers, counts["customers_added"], counts["customers_kept"] = _upsert(
        read_workbook(customer_path), customers)
    merged_partners, counts["partners_added"], counts["partners_kept"] = _upsert(
        read_workbook(partner_path), partners)
    write_workbook(customer_path, merged_customers)
    write_workbook(partner_path, merged_partners)

    write_suppression(app, read_suppression(app) + suppressed)
    counts["suppression_rows"] = len(read_suppression(app))
    counts["customers_total"] = len(merged_customers)
    counts["partners_total"] = len(merged_partners)
    return counts
