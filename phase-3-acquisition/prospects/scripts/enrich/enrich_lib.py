"""Route enrichment library: find a *business* route for an organisation.

Standard library only. Read-only against the network: it fetches public pages
with curl and resolves names with the system resolver. It never submits a form,
never logs in, and never fabricates a URL — a website is recorded only after the
page was actually fetched and the body was shown to name the organisation.

Rules this file encodes (phase-3 `BRIEF.md` §2, phase-4 `PLAN.md` D5):
  * organisations only: the mailbox local part must be on an explicit role
    allowlist, and that allowlist is a subset of the outbound engine's
    ``GENERIC_TOKENS`` so nothing found here is dropped again at seed time;
  * free-mail domains are never a business route;
  * a contact page counts only if it was fetched and returned real content;
  * two confirmation fetches per organisation, then the failure is recorded.
"""

from __future__ import annotations

import html
import json
import os
import re
import socket
import subprocess
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
STATE_DIR = HERE / "state"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"

# --------------------------------------------------------------------------
# politeness: one request per second per host, bounded concurrency
# --------------------------------------------------------------------------

_HOST_LOCK = threading.Lock()
_HOST_LAST: dict[str, float] = {}
MIN_HOST_GAP = 1.0


def _wait_for_host(host: str) -> None:
    while True:
        with _HOST_LOCK:
            now = time.monotonic()
            last = _HOST_LAST.get(host, 0.0)
            if now - last >= MIN_HOST_GAP:
                _HOST_LAST[host] = now
                return
            wait = MIN_HOST_GAP - (now - last)
        time.sleep(wait)


BLOCKED_HOSTS_PATH = STATE_DIR / "blocked-hosts.json"
_BLOCKED_LOCK = threading.Lock()
_BLOCKED: dict[str, str] = {}


def load_blocked() -> dict[str, str]:
    global _BLOCKED
    if BLOCKED_HOSTS_PATH.exists():
        try:
            _BLOCKED = json.loads(BLOCKED_HOSTS_PATH.read_text())
        except ValueError:
            _BLOCKED = {}
    return _BLOCKED


def note_blocked(host: str, reason: str) -> None:
    with _BLOCKED_LOCK:
        _BLOCKED[host] = reason


def save_blocked() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with _BLOCKED_LOCK:
        BLOCKED_HOSTS_PATH.write_text(json.dumps(_BLOCKED, indent=1, sort_keys=True))


# --------------------------------------------------------------------------
# names -> candidate domains
# --------------------------------------------------------------------------

LEGAL_TOKENS = {
    "llc", "lc", "inc", "incorporated", "corp", "corporation", "co", "company",
    "ltd", "limited", "lp", "llp", "pllc", "plc", "pc", "pa", "dba", "the",
    "and", "of", "a", "an", "usa", "us",
}

#: words that are common to half the list and therefore not distinctive on
#: their own; a domain that carries only these is not evidence of a match.
INDUSTRY_TOKENS = {
    "construction", "constructors", "contracting", "contractor", "contractors",
    "builders", "builder", "building", "buildings", "development", "developers",
    "enterprises", "enterprise", "group", "holdings", "industries", "industrial",
    "services", "service", "solutions", "systems", "associates", "partners",
    "electric", "electrical", "plumbing", "mechanical", "hvac", "roofing",
    "painting", "concrete", "masonry", "excavating", "excavation", "paving",
    "landscaping", "engineering", "engineers", "management", "consulting",
    "consultants", "supply", "specialties", "works", "general", "national",
    "american", "international", "professional", "quality", "premier", "elite",
    "advanced", "united", "allied", "custom", "complete", "total", "superior",
    "maintenance", "restoration", "remodeling", "interiors", "utilities",
    "utility", "environmental", "technologies", "technology", "resources",
    "properties", "property", "realty", "management", "assoc", "company",
}

STOP_PUNCT = re.compile(r"[^a-z0-9]+")


def tokens_of(name: str) -> list[str]:
    cleaned = STOP_PUNCT.sub(" ", (name or "").lower())
    return [t for t in cleaned.split() if t]


def core_tokens(name: str) -> list[str]:
    toks = [t for t in tokens_of(name) if t not in LEGAL_TOKENS]
    return toks or tokens_of(name)


def distinctive_tokens(name: str) -> list[str]:
    """Tokens that actually identify this organisation."""
    toks = [t for t in core_tokens(name) if t not in INDUSTRY_TOKENS and len(t) > 1]
    return toks


# --- corpus-derived rarity ------------------------------------------------
# There is no word list on this box (`/usr/share/dict` is empty), so rarity is
# measured against the prospect corpus itself: a token that appears in many
# organisation names ("total", "maintenance", "systems") is not evidence of
# identity; a token that appears in one or two ("aggreko", "agnora", "accentz")
# is. Cached so it is computed once per machine.

RARE_DF = 4
_DF_PATH = STATE_DIR / "token-df.json"
_DF: dict[str, int] | None = None


def token_df() -> dict[str, int]:
    global _DF
    if _DF is not None:
        return _DF
    if _DF_PATH.exists():
        try:
            _DF = json.loads(_DF_PATH.read_text())
            return _DF
        except ValueError:
            pass
    import csv as _csv
    counts: dict[str, int] = {}
    root = REPO / "phase-3-acquisition" / "prospects"
    for path in sorted(root.glob("*/prospects.csv")):
        try:
            with open(path, newline="", encoding="utf-8") as handle:
                for row in _csv.DictReader(handle):
                    for tok in set(tokens_of(row.get("name", ""))):
                        counts[tok] = counts.get(tok, 0) + 1
        except OSError:
            continue
    _DF = counts
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    _DF_PATH.write_text(json.dumps(counts, sort_keys=True))
    return _DF


def rare_tokens(name: str, min_len: int = 5) -> list[str]:
    df = token_df()
    return [t for t in core_tokens(name)
            if len(t) >= min_len and df.get(t, 0) < RARE_DF]


TLDS = ("com", "net", "us", "org")


def candidate_domains(name: str, max_bases: int = 5) -> list[str]:
    """Ordered candidate hostnames derived from the organisation name.

    Nothing here is ever recorded as a website: every candidate must survive a
    DNS lookup *and* a fetch whose body names the organisation.

    Deliberately conservative. A base built from a *single* common word
    (``heating``, ``provision``, ``ability``) matches thousands of unrelated
    companies, so it is generated only when the organisation's whole name is
    that one word and the word is long. This rule was added after the first
    pilot accepted `heating.net` for "4 G Plumbing And Heating, Inc." and
    `provision.com` for "A 2 Z Provision LLC".
    """
    core = core_tokens(name)
    if not core:
        return []
    dist = distinctive_tokens(name) or core
    bases: list[str] = []

    def add(base: str) -> None:
        base = re.sub(r"[^a-z0-9-]", "", base).strip("-")
        if 3 <= len(base) <= 63 and base not in bases:
            bases.append(base)

    add("".join(core))
    if len(core) > 2 and len("".join(core[:2])) >= 7:
        add("".join(core[:2]))
    if dist != core and len(dist) >= 2 and len("".join(dist)) >= 8:
        add("".join(dist))
    if len(core) > 1:
        add("-".join(core))
    if len(core) == 1 and len(core[0]) >= 6:
        add(core[0])
    bases = bases[:max_bases]

    out: list[str] = []
    for tld_index, tld in enumerate(TLDS):
        for base_index, base in enumerate(bases):
            # .com for every base first, then the long tail
            out.append((base_index + tld_index * 10 + (0 if tld == "com" else 5),
                        f"{base}.{tld}"))
    out.sort()
    seen, ordered = set(), []
    for _, dom in out:
        if dom not in seen:
            seen.add(dom)
            ordered.append(dom)
    return ordered


# --------------------------------------------------------------------------
# DNS
# --------------------------------------------------------------------------

_DNS_CACHE: dict[str, bool] = {}
_DNS_LOCK = threading.Lock()


def resolves(host: str, timeout: float = 4.0) -> bool:
    with _DNS_LOCK:
        if host in _DNS_CACHE:
            return _DNS_CACHE[host]
    ok = False
    try:
        socket.setdefaulttimeout(timeout)
        socket.getaddrinfo(host, None)
        ok = True
    except Exception:
        ok = False
    with _DNS_LOCK:
        _DNS_CACHE[host] = ok
    return ok


def resolvable_host(domain: str) -> str:
    """Return the hostname that resolves for this domain (apex or www), else ''."""
    if resolves(domain):
        return domain
    if resolves("www." + domain):
        return "www." + domain
    return ""


# --------------------------------------------------------------------------
# fetching
# --------------------------------------------------------------------------

MARK = "\n__HTTPSTATUS__"


def fetch(url: str, timeout: int = 20) -> tuple[int, str, str]:
    """(status, final_url, body), with one http:// fallback for a failed https.

    Some small-contractor sites are http-only or have a broken certificate; a
    single retry over plain http recovers them without a second organisation
    attempt being spent.
    """
    status, final, body = _fetch_once(url, timeout)
    if status == 0 and url.startswith("https://"):
        status, final, body = _fetch_once("http://" + url[len("https://"):], timeout)
    return status, final, body


def _fetch_once(url: str, timeout: int = 20) -> tuple[int, str, str]:
    """(status, final_url, body). Never raises. Rate limited per host."""
    host = host_of(url)
    if not host:
        return 0, url, ""
    blocked = _BLOCKED.get(host)
    if blocked:
        return 0, url, ""
    _wait_for_host(host)
    cmd = [
        "curl", "-sL", "--compressed", "-A", USER_AGENT,
        "--max-time", str(timeout), "--max-filesize", "3000000",
        "--connect-timeout", "10",
        "-H", "Accept: text/html,application/xhtml+xml",
        "-w", MARK + "%{http_code} %{url_effective}", url,
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=timeout + 15)
    except subprocess.TimeoutExpired:
        note_blocked(host, "curl timeout")
        return 0, url, ""
    raw = proc.stdout.decode("utf-8", "replace")
    idx = raw.rfind(MARK)
    if idx < 0:
        return 0, url, ""
    tail = raw[idx + len(MARK):].strip().split(" ", 1)
    body = raw[:idx]
    try:
        status = int(tail[0])
    except (ValueError, IndexError):
        status = 0
    final = tail[1] if len(tail) > 1 else url
    if status in (401, 403, 429, 503):
        note_blocked(host, f"http {status}")
    return status, final, body


def host_of(url: str) -> str:
    m = re.match(r"^[a-z]+://([^/?#]+)", (url or "").strip(), re.I)
    if not m:
        return ""
    return m.group(1).split("@")[-1].split(":")[0].lower()


def registrable(host: str) -> str:
    host = (host or "").lower().lstrip(".")
    if host.startswith("www."):
        host = host[4:]
    return host


# --------------------------------------------------------------------------
# page understanding
# --------------------------------------------------------------------------

SCRIPT_RE = re.compile(r"<(script|style|noscript)\b[^>]*>.*?</\1>", re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def page_title(body: str) -> str:
    m = TITLE_RE.search(body or "")
    return html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else ""


def page_text(body: str, limit: int = 400000) -> str:
    text = SCRIPT_RE.sub(" ", (body or "")[:limit])
    text = TAG_RE.sub(" ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


PARKED_MARKERS = (
    "this domain is for sale", "domain is for sale", "buy this domain",
    "the domain name", "domain for sale", "hugedomains", "sedoparking",
    "sedo.com", "afternic", "dan.com", "parkingcrew", "bodis.com",
    "domain parking", "parked free", "this web page is parked",
    "godaddy.com/domainsearch", "domain may be for sale",
    "future home of something quite cool", "website coming soon",
    "under construction", "site is temporarily unavailable",
    "default web site page", "apache2 ubuntu default page",
    "welcome to nginx", "index of /", "account suspended",
    "this site can't be reached", "expired domain", "renew your domain",
    "buy now for", "make an offer", "inquire about this domain",
    "domain has expired", "web hosting by", "wordpress installation",
    "hello world!", "just another wordpress site",
    'window.location.href="/lander"',      # the classic parking-page bounce
)

DIRECTORY_HOSTS = {
    "yelp.com", "bbb.org", "manta.com", "buildzoom.com", "bizapedia.com",
    "dnb.com", "opencorporates.com", "yellowpages.com", "mapquest.com",
    "chamberofcommerce.com", "zoominfo.com", "crunchbase.com", "indeed.com",
    "glassdoor.com", "facebook.com", "linkedin.com", "instagram.com",
    "twitter.com", "x.com", "youtube.com", "angi.com", "homeadvisor.com",
    "houzz.com", "thumbtack.com", "porch.com", "networx.com", "yellowbook.com",
    "cylex.us.com", "hotfrog.com", "merchantcircle.com", "local.com",
    "superpages.com", "citysearch.com", "foursquare.com", "tripadvisor.com",
    "wikipedia.org", "sam.gov", "usaspending.gov", "govtribe.com",
    "higovcon.com", "goleads.com", "buzzfile.com", "corporationwiki.com",
    "wixsite.com", "godaddysites.com", "business.site", "squarespace.com",
    "weebly.com", "webnode.page", "blogspot.com", "wordpress.com",
    "tiktok.com", "pinterest.com", "apollo.io", "rocketreach.co", "signalhire.com",
    "leadiq.com", "lead411.com", "datanyze.com", "6sense.com", "trustpilot.com",
    "gov", "state.us",
}


def is_directory_host(host: str) -> bool:
    host = registrable(host)
    for bad in DIRECTORY_HOSTS:
        if host == bad or host.endswith("." + bad):
            return True
    return False


STATE_NAMES = {
    "AL": "alabama", "AK": "alaska", "AZ": "arizona", "AR": "arkansas",
    "CA": "california", "CO": "colorado", "CT": "connecticut", "DE": "delaware",
    "DC": "district of columbia", "FL": "florida", "GA": "georgia",
    "HI": "hawaii", "ID": "idaho", "IL": "illinois", "IN": "indiana",
    "IA": "iowa", "KS": "kansas", "KY": "kentucky", "LA": "louisiana",
    "ME": "maine", "MD": "maryland", "MA": "massachusetts", "MI": "michigan",
    "MN": "minnesota", "MS": "mississippi", "MO": "missouri", "MT": "montana",
    "NE": "nebraska", "NV": "nevada", "NH": "new hampshire", "NJ": "new jersey",
    "NM": "new mexico", "NY": "new york", "NC": "north carolina",
    "ND": "north dakota", "OH": "ohio", "OK": "oklahoma", "OR": "oregon",
    "PA": "pennsylvania", "RI": "rhode island", "SC": "south carolina",
    "SD": "south dakota", "TN": "tennessee", "TX": "texas", "UT": "utah",
    "VT": "vermont", "VA": "virginia", "WA": "washington",
    "WV": "west virginia", "WI": "wisconsin", "WY": "wyoming", "PR": "puerto rico",
}


def location_in_page(location: str, blob: str) -> bool:
    """True when the page names the organisation's city or its state."""
    location = (location or "").strip()
    if not location:
        return False
    parts = [p.strip() for p in location.split(",") if p.strip()]
    city = parts[0].lower() if len(parts) > 1 else ""
    state = parts[-1].strip().upper() if parts else ""
    if city and len(city) >= 4 and re.search(r"\b" + re.escape(city) + r"\b", blob):
        return True
    if state in STATE_NAMES:
        if re.search(r"\b" + state.lower() + r"\b", blob):
            return True
        if STATE_NAMES[state] in blob:
            return True
    return False


def source_text(body: str, limit: int = 200000) -> str:
    """Tag-stripped page source, script and style contents included.

    Used only as a fallback for pages that render their content in JavaScript
    and therefore have no readable text at all: the organisation's name is
    still in the Next.js/Nuxt payload or the meta tags. Never used as the sole
    evidence for a short name, and never for a small page — a parking page is
    tiny and would otherwise "name" the organisation through its own domain.
    """
    text = TAG_RE.sub(" ", (body or "")[:limit])
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def name_matches(name: str, title: str, text: str, host: str,
                 location: str = "", raw_body: str = "") -> tuple[bool, str]:
    """Three-stage sanity check, after the Recoup agent's method.

    1. the page must actually name the organisation — the whole normalised
       name, or two distinctive (non-industry) tokens;
    2. the page must not be parked, for sale, a default install or a stub;
    3. the host must carry the organisation's leading distinctive word or its
       initials, so `doherty.com` is never accepted for "Doherty Enterprises"
       on one common token.

    A fourth guard was added after the pilot: when the name is *weak* (fewer
    than two distinctive tokens, or a short concatenation like ``a3systems``)
    the page must additionally name the organisation's city or state. Without
    it, `totalsolution.com` passes for "A Total Solution LLC" and we would be
    emailing a stranger.
    """
    core = core_tokens(name)
    dist = distinctive_tokens(name) or core
    if not core:
        return False, "no usable name tokens"

    blob = f"{title} {text}".lower()
    blob_squashed = STOP_PUNCT.sub("", blob)
    readable = len(blob.strip()) >= 40

    low_head = blob[:6000]
    for marker in PARKED_MARKERS:
        if marker in low_head:
            return False, f"parked/stub page ({marker})"

    full = "".join(core)
    full_dist = "".join(dist)
    hit = ""
    if readable:
        if full and len(full) >= 5 and full in blob_squashed:
            hit = "full name in page"
        elif full_dist and len(dist) >= 2 and len(full_dist) >= 8 and full_dist in blob_squashed:
            hit = "distinctive name in page"
        else:
            found = [t for t in dist if len(t) >= 4
                     and re.search(r"\b" + re.escape(t) + r"\b", blob)]
            if len(found) >= 2:
                hit = "two distinctive tokens in page"

    if not hit and len(text) < 200 and raw_body and len(raw_body) >= 4000:
        # a JavaScript-rendered homepage: no readable text, but the name is in
        # the page source. Only the whole name counts here, and only on a page
        # big enough that it cannot be a parking stub.
        src = source_text(raw_body).lower()
        if not any(marker in src[:20000] for marker in PARKED_MARKERS):
            if full and len(full) >= 8 and full in STOP_PUNCT.sub("", src):
                hit = "full name in the page source (JavaScript-rendered page)"
                blob = src
                blob_squashed = STOP_PUNCT.sub("", src)

    if not hit:
        return False, "page does not name the organisation" if readable else "page body empty"

    # stage 3: host sanity
    base = STOP_PUNCT.sub("", registrable(host).rsplit(".", 1)[0])
    lead = dist[0] if dist else core[0]
    initials = "".join(t[0] for t in dist) if len(dist) >= 2 else ""
    host_ok = False
    if (len(lead) >= 4 and lead in base) or base in full or base in full_dist:
        host_ok = True
    elif initials and len(initials) >= 2 and base.startswith(initials):
        host_ok = True
        hit += " (host is the initials)"
    elif full_dist and len(base) >= 6 and full_dist.startswith(base):
        host_ok = True
    if not host_ok:
        return False, "host does not carry the organisation name"

    # stage 4: weak names need the location as corroboration
    strong = (len(dist) >= 2 and len(full) >= 12) or bool(rare_tokens(name))
    if not strong:
        if location_in_page(location, blob):
            return True, hit + "; city/state corroborated"
        return False, ("weak name (%s): page does not corroborate the location" % full)
    if location_in_page(location, blob):
        hit += "; city/state corroborated"
    return True, hit


# --------------------------------------------------------------------------
# mailboxes
# --------------------------------------------------------------------------

#: role local parts we accept. Every entry is also in the outbound engine's
#: GENERIC_TOKENS, so a route found here survives `seed`.
ROLE_LOCALS = {
    "info", "information", "contact", "contactus", "contacts", "office",
    "admin", "administration", "hello", "hi", "sales", "estimating",
    "estimate", "estimates", "bid", "bids", "bidding", "payroll", "hr",
    "humanresources", "compliance", "accounting", "accounts", "support",
    "inquiries", "inquiry", "enquiries", "enquiry", "frontdesk", "reception",
    "team", "mail", "email", "general", "main", "service", "services", "help",
    "customerservice", "customercare", "billing", "quotes", "quote", "rfp",
    "rfq", "safety", "operations", "ops", "dispatch", "scheduling",
    "preconstruction", "precon", "orders", "order", "careers", "jobs",
    "marketing", "press", "media", "business", "newbusiness", "connect",
    "ask", "talk", "reachus", "corporate", "hq", "company", "management",
    "maintenance", "leasing", "rentals", "properties", "property",
}

FREE_MAIL = {
    "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com",
    "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
    "aol.com", "aim.com", "proton.me", "protonmail.com", "gmx.com", "gmx.net",
    "mail.com", "yandex.com", "zoho.com", "comcast.net", "verizon.net",
    "att.net", "sbcglobal.net", "bellsouth.net", "cox.net", "charter.net",
    "roadrunner.com", "rr.com", "earthlink.net", "juno.com", "windstream.net",
    "frontier.com", "optonline.net", "pacbell.net", "hotmail.co.uk",
    "sentry.io", "example.com", "domain.com", "email.com", "yourdomain.com",
    "wixpress.com", "sentry-next.wixpress.com",
}

EMAIL_RE = re.compile(
    r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
MAILTO_RE = re.compile(r"mailto:([^\"'>?\s]+)", re.I)


def candidate_mailboxes(body: str) -> list[str]:
    found: list[str] = []
    for m in MAILTO_RE.finditer(body or ""):
        found.append(html.unescape(m.group(1)).strip().strip(".,;"))
    text = page_text(body)
    for m in EMAIL_RE.finditer(text):
        found.append(m.group(0).strip().strip(".,;"))
    # JSON-LD, Next.js payloads and inline config often carry the same public
    # `info@` that the rendered page shows only as an image or a JS handler.
    # The role allowlist and the same-domain rule below still gate everything.
    for m in EMAIL_RE.finditer(source_text(body)):
        found.append(m.group(0).strip().strip(".,;"))
    # also catch obfuscated "info (at) example.com"
    for m in re.finditer(r"([A-Za-z0-9._%+\-]+)\s*(?:\(at\)|\[at\]|\s+at\s+)\s*([A-Za-z0-9.\-]+\.[A-Za-z]{2,})", text, re.I):
        found.append(f"{m.group(1)}@{m.group(2)}")
    out, seen = [], set()
    for a in found:
        a = clean_address(a)
        if not a or a in seen:
            continue
        seen.add(a)
        out.append(a)
    return out


STRICT_EMAIL_RE = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)+$")


def clean_address(raw: str) -> str:
    """Lower-case, strip the junk a `mailto:` href drags along, then validate.

    A `mailto:` href legitimately ends in `\\`, `%20`, a trailing dot or a
    fragment; those characters are not part of the address. An address that
    does not survive `STRICT_EMAIL_RE` is dropped rather than repaired — a
    repaired address is a fabricated one.
    """
    value = (raw or "").strip().lower()
    value = value.replace("%40", "@").split("?")[0].split("#")[0]
    value = value.strip().strip("\\/,;:<>()[]\"' \t")
    value = value.rstrip(".")
    if value.count("@") != 1:
        return ""
    return value if STRICT_EMAIL_RE.match(value) else ""


IMAGE_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js")


def pick_role_mailbox(addresses: list[str], site_domain: str) -> tuple[str, str]:
    """Return (address, note). Organisation-only rules, strictly applied."""
    site = registrable(site_domain)
    site_base = site.rsplit(".", 1)[0] if "." in site else site
    best, why = "", ""
    rank = {t: i for i, t in enumerate(
        ["info", "contact", "office", "hello", "admin", "inquiries", "enquiries",
         "sales", "estimating", "estimates", "bids", "team", "support"])}
    scored = []
    for raw in addresses:
        addr = clean_address(raw)
        if not addr or addr.endswith(IMAGE_EXT):
            continue
        local, _, dom = addr.partition("@")
        dom = registrable(dom)
        if not dom or "." not in dom:
            continue
        if dom in FREE_MAIL:
            continue
        # must be the organisation's own domain (or a subdomain of it)
        if not (dom == site or dom.endswith("." + site) or site.endswith("." + dom)
                or (site_base and dom.rsplit(".", 1)[0] == site_base)):
            continue
        local = re.sub(r"\+.*$", "", local)
        parts = [p for p in re.split(r"[._\-]+", local) if p]
        if not parts:
            continue
        if not all(p in ROLE_LOCALS for p in parts) and "".join(parts) not in ROLE_LOCALS:
            continue
        # rank on the squashed local part, but record the address **verbatim**:
        # rewriting `customer.service@` as `customerservice@` would invent a
        # mailbox that nobody published.
        scored.append((rank.get("".join(parts), 50), len(addr), addr))
    if scored:
        scored.sort()
        best = scored[0][2]
        why = "role mailbox on the organisation's own domain"
    return best, why


CONTACT_PATHS = ("/contact", "/contact-us", "/contactus", "/contact.html",
                 "/contact-us.html", "/contact.php", "/about", "/about-us")

NOT_FOUND_MARKERS = ("404", "page not found", "not found", "page doesn't exist",
                     "page does not exist", "nothing found", "error 404",
                     "oops! that page", "cannot be found")


def looks_like_real_page(status: int, body: str) -> bool:
    if status != 200 or not body:
        return False
    title = page_title(body).lower()
    text = page_text(body)
    if len(text) < 200:
        return False
    head = (title + " " + text[:400]).lower()
    for marker in NOT_FOUND_MARKERS:
        if marker in head:
            return False
    return True


def contact_links(body: str, base_host: str) -> list[str]:
    """Same-site links whose text or href looks like a contact page.

    Ordered contact-first: an `/about` page is a fallback, never the preferred
    "contact route", because the founder has to find a form on it.
    """
    out = []
    for m in re.finditer(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', body or "", re.I | re.S):
        href, label = m.group(1), page_text(m.group(2)).lower()
        if not re.search(r"contact|get.?in.?touch|reach.?us|about", href + " " + label, re.I):
            continue
        if href.startswith("mailto:") or href.startswith("tel:") or href.startswith("#"):
            continue
        if href.startswith("//"):
            href = "https:" + href
        elif href.startswith("/"):
            href = f"https://{base_host}{href}"
        elif not href.startswith("http"):
            href = f"https://{base_host}/{href.lstrip('./')}"
        if registrable(host_of(href)) != registrable(base_host):
            continue
        if href not in out:
            out.append(href)
    out.sort(key=lambda u: (0 if re.search(r"contact|get.?in.?touch|reach", u, re.I) else 1,
                            len(u)))
    return out[:4]


# --------------------------------------------------------------------------
# resumable state
# --------------------------------------------------------------------------

class State:
    """Append-only JSONL, one record per organisation attempted."""

    def __init__(self, name: str):
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        self.path = STATE_DIR / f"{name}.jsonl"
        self._lock = threading.Lock()
        self.done: dict[str, dict] = {}
        if self.path.exists():
            with open(self.path, encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        rec = json.loads(line)
                    except ValueError:
                        continue
                    self.done[rec["key"]] = rec

    def has(self, key: str) -> bool:
        return key in self.done

    def add(self, rec: dict) -> None:
        with self._lock:
            self.done[rec["key"]] = rec
            with open(self.path, "a", encoding="utf-8") as handle:
                handle.write(json.dumps(rec, sort_keys=True) + "\n")


def org_key(name: str, location: str = "") -> str:
    return f"{(name or '').strip().lower()}|{(location or '').strip().lower()}"
