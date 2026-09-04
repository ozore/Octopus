#!/usr/bin/env python3
"""Route enrichment driver.

Finds a verified business route (website, generic mailbox, contact page) for
end-customer organisations that phase 3 left without one. Resumable: every
organisation attempted is appended to `state/<dir>.jsonl` and skipped on the
next run, so the job can be stopped and restarted at any point.

    python3 phase-3-acquisition/prospects/scripts/enrich/run_enrich.py \
        --dir wagelens --mode discover --limit 500

Modes
  discover  rows with no contact_route at all: find the website, then a route.
  mailbox   rows whose contact_route is already a page: look for a mailbox on it.

Nothing here writes `prospects.csv`. Results become
`phase-3-acquisition/prospects/<dir>/routes-enrichment.csv` via
`build_enrichment_csv.py`.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import enrich_lib as L  # noqa: E402

REPO = L.REPO
PROSPECTS = REPO / "phase-3-acquisition" / "prospects"
TODAY = dt.date.today().isoformat()

STATE_SEGMENT_STATES = ("(NY)", "(WA)", "(IL)", "(TX)")


# --------------------------------------------------------------------------
# priority
# --------------------------------------------------------------------------

def icp_score(row: dict) -> int:
    """Higher is sharper. WageLens ordering from the phase-4 brief."""
    score = 0
    signal = row.get("size_signal", "")
    notes = row.get("notes", "")
    m = re.match(r"^(\d+) federal award", signal)
    if m:
        awards = int(m.group(1))
        score += 6 if awards >= 2 else 3
    y = re.search(r"\((\d{4})-\d\d-\d\d\)", notes)
    if y and y.group(1) in ("2025", "2026", "2027"):
        score += 5
    n = re.search(r"NAICS (\d{6})", notes)
    if n and n.group(1).startswith("238"):
        score += 4
    elif n and n.group(1).startswith("237"):
        score += 2
    seg = row.get("segment", "")
    if any(s in seg for s in STATE_SEGMENT_STATES):
        score += 3
    if "prevailing-wage" in seg or "certified payroll" in seg or "public works" in seg:
        score += 1
    if row.get("website", "").strip():
        score += 4          # already have a candidate: cheapest confirmation
    if "platform operating brand" in seg or "PE-backed" in seg:
        score += 2
    return score


def load_rows(directory: str, mode: str) -> list[dict]:
    path = PROSPECTS / directory / "prospects.csv"
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    out = []
    for r in rows:
        if r.get("prospect_type") != "end-customer":
            continue
        route = (r.get("contact_route") or "").strip()
        if mode == "discover" and route:
            continue
        if mode == "mailbox":
            if not route or "@" in route:
                continue
        out.append(r)
    out.sort(key=lambda r: (-icp_score(r), r.get("name", "").lower()))
    return out


# --------------------------------------------------------------------------
# the work for one organisation
# --------------------------------------------------------------------------

MAX_CONFIRM_FETCHES = 2      # brief: two attempts per organisation
MAX_ROUTE_FETCHES = 3        # once a site is confirmed, look for the route
MAX_DNS_PROBES = 8           # DNS costs the target host nothing; fetches do

#: failures that are about *us*, not about the organisation: the page rendered
#: in JavaScript, the connection dropped, the host answered 5xx. `--retry`
#: re-attempts these; a "does not name the organisation" is never retried,
#: because the answer would not change.
RETRYABLE_FAILURES = ("page body empty", "fetch failed (dns/tls/timeout/blocked)",
                      "http 0", "http 500", "http 502", "http 503", "http 504")


def normalise_url(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    if not value.startswith("http"):
        value = "https://" + value.lstrip("/")
    return value


def confirm_site(name: str, url: str, location: str = "") -> tuple[str, str, str, str, str]:
    """(website, evidence_url, method_note, failure, body) for one candidate."""
    status, final, body = L.fetch(url)
    if status == 0:
        return "", "", "", "fetch failed (dns/tls/timeout/blocked)", ""
    if status >= 400:
        return "", "", "", f"http {status}", ""
    host = L.host_of(final)
    if L.is_directory_host(host):
        return "", "", "", f"redirects to a directory/social host ({host})", ""
    ok, why = L.name_matches(name, L.page_title(body), L.page_text(body)[:12000],
                             host, location, raw_body=body)
    if not ok:
        return "", "", "", why, ""
    root = f"https://{host}/"
    return root, final, why, "", body


def find_route_on_site(name: str, website: str, body: str = "",
                       final: str = "") -> dict:
    """Read the homepage we already have, then up to three contact pages."""
    out = {"route": "", "route_type": "none", "evidence": "", "notes": []}
    host = L.host_of(website)
    if not body:
        status, final, body = L.fetch(website)
        if status == 0 or status >= 400 or not body:
            out["notes"].append(f"homepage not readable for route (http {status})")
            return out
    final = final or website
    addr, why = L.pick_role_mailbox(L.candidate_mailboxes(body), host)
    if addr:
        out.update(route=addr, route_type="mailbox", evidence=final)
        out["notes"].append("mailbox on homepage")
        return out

    tried = 0
    candidates = L.contact_links(body, host)
    for path in L.CONTACT_PATHS:
        url = f"https://{host}{path}"
        if url not in candidates:
            candidates.append(url)
    seen_page = ""
    for url in candidates:
        if tried >= MAX_ROUTE_FETCHES:
            break
        tried += 1
        st, fin, bd = L.fetch(url)
        if not L.looks_like_real_page(st, bd):
            continue
        seen_page = seen_page or fin
        addr, why = L.pick_role_mailbox(L.candidate_mailboxes(bd), host)
        if addr:
            out.update(route=addr, route_type="mailbox", evidence=fin)
            out["notes"].append("mailbox on contact page")
            return out
    if seen_page:
        out.update(route=seen_page, route_type="form", evidence=seen_page)
        out["notes"].append("contact page fetched, no generic mailbox published")
    else:
        out["notes"].append("no contact page found (homepage only)")
    return out


def enrich_discover(row: dict, extra_candidates: dict) -> dict:
    name = row.get("name", "")
    key = L.org_key(name, row.get("location", ""))
    rec = {
        "key": key, "name": name, "location": row.get("location", ""),
        "website": "", "contact_route": "", "route_type": "none",
        "evidence_url": "", "checked_on": TODAY, "method": "", "notes": "",
    }
    tried: list[str] = []
    failures: list[str] = []

    ordered: list[tuple[str, str]] = []
    listed = normalise_url(row.get("website", ""))
    if listed:
        ordered.append(("register-website", listed))
    for url in extra_candidates.get(key, []):
        ordered.append(("websearch", normalise_url(url)))
    for dom in L.candidate_domains(name)[:MAX_DNS_PROBES]:
        host = L.resolvable_host(dom)
        if host:
            ordered.append(("dns-guess", f"https://{host}/"))
        if len(ordered) >= 4:
            break

    fetches = 0
    for method, url in ordered:
        if fetches >= MAX_CONFIRM_FETCHES:
            break
        h = L.registrable(L.host_of(url))
        if h in tried:
            continue
        tried.append(h)
        fetches += 1
        site, evidence, why, fail, body = confirm_site(name, url, row.get("location", ""))
        if site:
            rec["website"] = site
            rec["method"] = method
            rec["evidence_url"] = evidence
            found = find_route_on_site(name, site, body, evidence)
            rec["contact_route"] = found["route"]
            rec["route_type"] = found["route_type"]
            if found["evidence"]:
                rec["evidence_url"] = found["evidence"]
            rec["notes"] = "; ".join([f"site confirmed: {why}"] + found["notes"])
            return rec
        failures.append(f"{h}: {fail}")

    if not ordered:
        rec["notes"] = "no candidate domain resolved from the name"
    else:
        rec["notes"] = "no site confirmed after %d fetch(es); %s" % (
            fetches, " | ".join(failures[:3]) or "no candidates fetched")
    return rec


def enrich_mailbox(row: dict) -> dict:
    """Rows that already have a contact page: look for a generic mailbox."""
    name = row.get("name", "")
    key = L.org_key(name, row.get("location", ""))
    page = normalise_url(row.get("contact_route", ""))
    listed = normalise_url(row.get("website", ""))
    homepage = listed or (f"https://{L.host_of(page)}/" if page else "")
    rec = {
        "key": key, "name": name, "location": row.get("location", ""),
        # only what phase 3 already recorded; a website is added below solely
        # when a page on that host actually answered
        "website": listed, "contact_route": "", "route_type": "none",
        "evidence_url": "", "checked_on": TODAY, "method": "existing-contact-page",
        "notes": "",
    }
    host = L.host_of(page or homepage)
    if not host:
        rec["notes"] = "no page to read"
        return rec
    urls, notes = [], []
    for candidate in (page, homepage):
        if candidate and candidate not in urls:
            urls.append(candidate)
    for url in urls[:MAX_CONFIRM_FETCHES]:
        st, fin, bd = L.fetch(url)
        if st == 0 or st >= 400 or not bd:
            notes.append(f"{url}: http {st}")
            continue
        if not rec["website"]:
            rec["website"] = f"https://{L.host_of(fin)}/"
        rec["evidence_url"] = rec["evidence_url"] or fin
        addr, why = L.pick_role_mailbox(L.candidate_mailboxes(bd), host)
        if addr:
            rec.update(contact_route=addr, route_type="mailbox", evidence_url=fin)
            rec["notes"] = "mailbox published on " + (
                "the contact page" if url == page else "the homepage")
            return rec
        notes.append(f"{url}: no generic mailbox published")
    rec["notes"] = "; ".join(notes) or "no mailbox found"
    rec["contact_route"] = ""
    return rec


# --------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------

def read_websearch_candidates(directory: str) -> dict:
    """Optional `state/<dir>-websearch.tsv`: key<TAB>url, one per line."""
    path = L.STATE_DIR / f"{directory}-websearch.tsv"
    out: dict = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        out.setdefault(parts[0].strip().lower(), []).append(parts[1].strip())
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True,
                    help="prospects directory: wagelens, certly-pm, certly-gc, stateready")
    ap.add_argument("--mode", default="discover", choices=("discover", "mailbox"))
    ap.add_argument("--limit", type=int, default=200)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--stop-yield", type=float, default=0.10,
                    help="stop when the rolling yield over --stop-window falls below this")
    ap.add_argument("--stop-window", type=int, default=200)
    ap.add_argument("--retry", action="store_true",
                    help="also re-attempt organisations whose recorded failure is "
                         "retryable: a JavaScript-rendered page we could not read, a "
                         "transient fetch failure, a 5xx")
    args = ap.parse_args()

    L.load_blocked()
    state = L.State(f"{args.dir}-{args.mode}")
    rows = load_rows(args.dir, args.mode)

    def pending(row: dict) -> bool:
        key = L.org_key(row.get("name", ""), row.get("location", ""))
        if not state.has(key):
            return True
        if not args.retry:
            return False
        previous = state.done[key]
        if previous.get("website") or previous.get("contact_route"):
            return False
        notes = previous.get("notes", "")
        return any(reason in notes for reason in RETRYABLE_FAILURES)

    todo = [r for r in rows if pending(r)]
    todo = todo[args.offset:args.offset + args.limit]
    print(f"{args.dir}/{args.mode}: {len(rows)} eligible, {len(state.done)} already attempted, "
          f"{len(todo)} in this run", flush=True)
    if not todo:
        return 0

    extra = read_websearch_candidates(args.dir)
    counter = {"n": 0, "hit": 0, "mailbox": 0, "form": 0}
    window: list[int] = []
    lock = threading.Lock()
    stop = threading.Event()

    def work(row: dict) -> None:
        if stop.is_set():
            return
        try:
            rec = enrich_mailbox(row) if args.mode == "mailbox" else enrich_discover(row, extra)
        except Exception as exc:                    # never let one row kill the run
            rec = {"key": L.org_key(row.get("name", ""), row.get("location", "")),
                   "name": row.get("name", ""), "location": row.get("location", ""),
                   "website": "", "contact_route": "", "route_type": "none",
                   "evidence_url": "", "checked_on": TODAY, "method": "",
                   "notes": f"error: {type(exc).__name__}: {exc}"[:200]}
        state.add(rec)
        with lock:
            counter["n"] += 1
            hit = bool(rec["website"]) if args.mode == "discover" else bool(rec["contact_route"])
            counter["hit"] += 1 if hit else 0
            if rec["route_type"] == "mailbox":
                counter["mailbox"] += 1
            elif rec["route_type"] == "form":
                counter["form"] += 1
            window.append(1 if hit else 0)
            if len(window) > args.stop_window:
                window.pop(0)
            n = counter["n"]
            if n % 25 == 0:
                print(f"  {n}/{len(todo)} attempted | hits {counter['hit']} "
                      f"| mailbox {counter['mailbox']} | form {counter['form']} "
                      f"| rolling {sum(window)}/{len(window)}", flush=True)
            if (len(window) == args.stop_window
                    and sum(window) / len(window) < args.stop_yield):
                print(f"  stopping: rolling yield {sum(window)}/{len(window)} "
                      f"below {args.stop_yield:.0%}", flush=True)
                stop.set()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(work, todo))

    L.save_blocked()
    print(f"done {args.dir}/{args.mode}: {counter['n']} attempted, {counter['hit']} hits, "
          f"{counter['mailbox']} mailboxes, {counter['form']} contact pages", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
