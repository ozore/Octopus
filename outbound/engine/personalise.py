"""Personalisation: facts in, natural sentences out.

Two halves:

* `extract_facts(row)` reads a phase-3 prospects row and returns a small JSON
  dict of typed facts drawn only from `size_signal`, `location`, `segment`,
  `notes` and `fit_rationale`. Nothing is invented; a fact that is not in the
  row does not appear.
* `phrases(facts)` turns those typed facts into English fragments with small
  rule-based templates, e.g.
  `{"count": 3, "since": "2024", "state": "TX"}` -> "your three federal jobs
  in Texas since 2024".

No LLM is required. `llm_polish()` is a no-op unless the caller passes
`enabled=True` (the `--polish` flag) *and* ANTHROPIC_API_KEY is set.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "DC": "Washington, D.C.", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "PR": "Puerto Rico",
    "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming",
}
NAME_TO_STATE = {v.lower(): k for k, v in STATE_NAMES.items()}

NUMBER_WORDS = {
    1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six",
    7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve",
}

CERT_NAMES = {
    "DBE": "DBE",
    "MBE": "MBE",
    "WBE": "WBE",
    "MWBE": "MWBE",
    "SBE": "SBE",
    "SLDBE": "SLDBE",
    "VOB": "veteran-owned business",
    "DVOB": "disabled-veteran-owned business",
    "SEDB": "socially and economically disadvantaged business",
    "LBE": "local business enterprise",
    "ACDBE": "ACDBE",
}


# --------------------------------------------------------------------------
# extraction
# --------------------------------------------------------------------------

def _split_location(location: str) -> tuple[str, str]:
    """('New Rochelle, NY') -> ('New Rochelle', 'NY'). Tolerates 'NY' alone."""
    location = (location or "").strip().strip(",")
    if not location:
        return "", ""
    if "," in location:
        city, _, tail = location.rpartition(",")
        state = tail.strip().upper()
        if state in STATE_NAMES:
            return city.strip(), state
        return location, ""
    if len(location) == 2 and location.upper() in STATE_NAMES:
        return "", location.upper()
    if location.lower() in NAME_TO_STATE:
        return "", NAME_TO_STATE[location.lower()]
    return location, ""


def _federal_awards(size_signal: str) -> dict | None:
    """'3 federal awards, $814k total since 2024' -> typed fact."""
    m = re.match(
        r"\s*(\d[\d,]*)\s+federal awards?(?:,\s*\$?([\d.,]+[kKmMbB]?)\s*total)?"
        r"(?:\s+since\s+(\d{4}))?",
        size_signal or "",
    )
    if not m:
        return None
    fact = {"count": int(m.group(1).replace(",", ""))}
    if m.group(2):
        fact["total"] = "$" + m.group(2).replace("$", "")
    if m.group(3):
        fact["since"] = m.group(3)
    return fact


def _certification(size_signal: str) -> dict | None:
    """Certification signals from three register formats seen in phase 3."""
    signal = (size_signal or "").strip()
    if not signal:
        return None
    m = re.match(r"(?:([A-Z]{2})\s+)?certification:\s*(.+)$", signal)
    if m:
        codes = [c.strip().upper() for c in re.split(r"[|,]", m.group(2)) if c.strip()]
        clean, programme = [], ""
        for code in codes:
            paren = re.match(r"([A-Z]+)\s*\(([^)]+)\)", code)
            if paren:
                clean.append(paren.group(1))
                programme = paren.group(2)
            else:
                clean.append(code)
        fact = {"codes": clean}
        if m.group(1):
            fact["state"] = m.group(1)
        if programme:
            fact["programme"] = programme
        return fact
    m = re.match(r"([A-Z]{2,3})\s+SBS certification:\s*(.+)$", signal)
    if m:
        codes = [c.strip().upper() for c in re.split(r"[|,]", m.group(2)) if c.strip()]
        return {"codes": codes, "programme": "New York City SBS"}
    if "certified DBE" in signal and "Unified Certification Program" in signal:
        state = "NY" if "NYS" in signal else ""
        fact = {"codes": ["DBE"], "programme": "Unified Certification Program"}
        if state:
            fact["state"] = state
        return fact
    return None


def _registration(size_signal: str) -> dict | None:
    """State public-works registrations and prequalifications."""
    signal = (size_signal or "").strip()
    m = re.match(r"active NYSDOL public work contractor registration\s+(\S+)", signal)
    if m:
        return {"programme": "New York State public work contractor registry",
                "reference": m.group(1)}
    m = re.match(r"Delaware public works prequalification, trade:\s*(.+)$", signal)
    if m:
        return {"programme": "Delaware public works prequalification",
                "trade": m.group(1).strip()}
    return None


def _payroll_filings(size_signal: str) -> dict | None:
    """Volume signals that are literally certified-payroll filings."""
    signal = (size_signal or "").strip()
    patterns = [
        (r"(\d[\d,]*)\s+certified transcript of payrolls to IDOL",
         "certified transcripts of payroll filed with the Illinois Department of Labor"),
        (r"(\d[\d,]*)\s+weekly certified payrolls filed on NY public work(?:\s+since\s+(\d{4}))?",
         "weekly certified payrolls filed on New York public work"),
        (r"(\d[\d,]*)\s+statement of intents on WA public works(?:\s+since\s+(\d{4}))?",
         "statements of intent filed on Washington public works"),
        (r"(\d[\d,]*)\s+bid line items on TxDOT federal-aid lettings(?:\s+since\s+(\d{4}))?",
         "bid line items on TxDOT federal-aid lettings"),
    ]
    for pattern, label in patterns:
        m = re.match(pattern, signal)
        if m:
            fact = {"count": int(m.group(1).replace(",", "")), "label": label}
            if m.lastindex and m.lastindex >= 2 and m.group(2):
                fact["since"] = m.group(2)
            return fact
    return None


def _portfolio(size_signal: str) -> dict | None:
    """Units / properties / homes under management."""
    m = re.match(
        r"\s*([\d,]+)\s*\+?\s*(units?|properties|homes|rentals|doors)\b",
        size_signal or "", re.I,
    )
    if not m:
        return None
    noun = m.group(2).lower()
    noun = {"unit": "units", "property": "properties"}.get(noun, noun)
    return {"count": int(m.group(1).replace(",", "")), "noun": noun,
            "approx": "+" in (size_signal or "")}


def _brands(size_signal: str) -> dict | None:
    """Platform / franchisor brand counts."""
    signal = (size_signal or "")
    m = re.search(r"~?\s*(\d[\d,]*)\+?\s*(?:operating\s+)?(brands|partner companies|partner brands)", signal, re.I)
    if not m:
        return None
    fact = {"count": int(m.group(1).replace(",", "")),
            "noun": m.group(2).lower()}
    states = re.search(r"(?:across|spanning)\s+~?\s*(\d+)(?:-\d+)?\s*states", signal, re.I)
    if states:
        fact["states"] = int(states.group(1))
    return fact


def _locations(size_signal: str) -> dict | None:
    m = re.search(
        r"(\d[\d,]*)\+?\s*(service centers|locations|branches|offices)"
        r"(?:\s+across\s+~?\s*(\d+)(?:-\d+)?\s*states)?",
        size_signal or "", re.I,
    )
    if not m:
        return None
    fact = {"count": int(m.group(1).replace(",", "")), "noun": m.group(2).lower()}
    if m.group(3):
        fact["states"] = int(m.group(3))
    return fact


def _employees(size_signal: str) -> dict | None:
    m = re.search(r"~?\s*([\d,]+)\+?\s*(employees|field technicians)", size_signal or "", re.I)
    if not m:
        return None
    return {"count": int(m.group(1).replace(",", "")), "noun": m.group(2).lower()}


def _states_operated(notes: str) -> list[str]:
    """State codes the organisation's own pages list, from `notes`."""
    m = re.search(
        r"(?:States operated incl\.|States appearing in the brand locations[^:]*:|"
        r"whose HQ cities span \d+ states:)\s*([A-Z ,]+)",
        notes or "",
    )
    if not m:
        return []
    codes = []
    for code in re.split(r"[,\s]+", m.group(1)):
        if code in STATE_NAMES and code not in codes:
            codes.append(code)
    return codes


def _trades(notes: str) -> list[str]:
    """NAICS / commodity descriptions recorded in `notes`, tidied."""
    if not notes:
        return []
    found = re.findall(r"\d{6}\s*-\s*([^;]+)", notes)
    trades = []
    for raw in found:
        label = raw.strip().rstrip(".")
        label = re.sub(r"\s*\(except[^)]*\)", "", label)
        label = re.sub(r"\s+", " ", label)
        if not label or label.lower().startswith("all other"):
            continue
        label = label.lower()
        label = re.sub(r"\s+contractors?$", "", label)
        label = re.sub(r"\s+construction$", " construction", label)
        if label not in trades:
            trades.append(label)
    return trades[:3]


def _source_list(row: dict) -> str:
    """A truthful, readable name for the public list the row came from."""
    notes = row.get("notes", "") or ""
    known = [
        ("NYS UCP DBE directory", "the New York State Unified Certification Program DBE directory"),
        ("New Orleans DBE directory", "the City of New Orleans DBE/SLDBE directory"),
        ("NJ SAVI", "the New Jersey SAVI small and diverse business register"),
        ("NYC SBS", "the New York City SBS certified business directory"),
        ("SAM.gov", "SAM.gov contract award notices"),
        ("USASpending", "the USASpending federal award data"),
        ("NYSDOL", "the New York State Department of Labor public work contractor registry"),
        ("IDOL", "the Illinois Department of Labor certified transcript records"),
        ("TxDOT", "the TxDOT federal-aid letting records"),
        ("Expertise.com", "the Expertise.com property management listings"),
        ("chapter's public General Contractor category", "your AGC chapter's public contractor directory"),
    ]
    for needle, label in known:
        if needle.lower() in notes.lower():
            return label
    return ""


def extract_facts(row: dict) -> dict:
    """Typed personalisation facts for one prospects row.

    Only `size_signal`, `location`, `segment`, `notes` and `fit_rationale` are
    read. Empty inputs give an empty fact, never a guess.
    """
    size_signal = (row.get("size_signal") or "").strip()
    notes = (row.get("notes") or "").strip()
    facts: dict = {}

    city, state = _split_location(row.get("location", ""))
    if city:
        facts["city"] = city
    if state:
        facts["state"] = state
    if city or state:
        facts["location"] = ", ".join(p for p in (city, STATE_NAMES.get(state, state)) if p)

    segment = (row.get("segment") or "").strip()
    if segment:
        facts["segment"] = segment

    for key, fn in (
        ("federal_awards", _federal_awards),
        ("certification", _certification),
        ("registration", _registration),
        ("payroll_filings", _payroll_filings),
        ("portfolio", _portfolio),
        ("brands", _brands),
        ("locations", _locations),
        ("employees", _employees),
    ):
        value = fn(size_signal)
        if value:
            facts[key] = value

    states = _states_operated(notes)
    if states:
        facts["states_operated"] = states
    trades = _trades(notes)
    if trades:
        facts["trades"] = trades
    source_list = _source_list(row)
    if source_list:
        facts["source_list"] = source_list
    if size_signal:
        facts["size_signal_raw"] = size_signal
    return facts


# --------------------------------------------------------------------------
# rendering: facts -> English
# --------------------------------------------------------------------------

def _count_word(n: int) -> str:
    return NUMBER_WORDS.get(n, f"{n:,}")


def _state_name(code: str) -> str:
    return STATE_NAMES.get((code or "").upper(), code or "")


def _join(items: list[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " and " + items[-1]


def phrase_federal_awards(fact: dict, state: str = "") -> str:
    count = fact.get("count", 0)
    job = "job" if count == 1 else "jobs"
    where = f" in {_state_name(state)}" if state else ""
    since = f" since {fact['since']}" if fact.get("since") else ""
    return f"your {_count_word(count)} federal {job}{where}{since}"


def phrase_certification(fact: dict) -> str:
    codes = [CERT_NAMES.get(c, c) for c in fact.get("codes", [])]
    if not codes:
        return ""
    label = _join(codes)
    plural = "certification" if len(codes) == 1 else "certifications"
    programme = fact.get("programme", "")
    state = _state_name(fact.get("state", ""))
    if programme == "Unified Certification Program":
        where = f" in the {state} Unified Certification Program" if state else " in the state Unified Certification Program"
    elif programme:
        where = f" with {programme}"
    elif state:
        where = f" in {state}"
    else:
        where = ""
    return f"your {label} {plural}{where}"


def phrase_registration(fact: dict) -> str:
    trade = fact.get("trade")
    if trade:
        return f"your {fact['programme']} for {trade.lower()}"
    return f"your active {fact['programme']} registration"


def phrase_payroll_filings(fact: dict) -> str:
    since = f" since {fact['since']}" if fact.get("since") else ""
    return f"the {fact['count']:,} {fact['label']}{since}"


def phrase_portfolio(fact: dict) -> str:
    approx = "more than " if fact.get("approx") else ""
    return f"the {approx}{fact['count']:,} {fact['noun']} you manage"


def phrase_brands(fact: dict) -> str:
    states = f" across {fact['states']} states" if fact.get("states") else ""
    return f"your {fact['count']} {fact['noun']}{states}"


def phrase_locations(fact: dict) -> str:
    states = f" in {fact['states']} states" if fact.get("states") else ""
    return f"your {fact['count']:,} {fact['noun']}{states}"


def phrase_employees(fact: dict) -> str:
    return f"your {fact['count']:,} {fact['noun']}"


def phrase_trades(trades: list[str]) -> str:
    return _join(trades[:2]) + " work" if trades else ""


def phrase_states_operated(codes: list[str]) -> str:
    """Name the first three states, then count the rest honestly."""
    names = [_state_name(c) for c in codes[:3]]
    more = len(codes) - len(names)
    if more == 1:
        names.append("one other state")
    elif more > 1:
        names.append(f"{more} other states")
    return _join(names)


def phrases(facts: dict) -> dict:
    """Every fact that has a sentence template, rendered as an English phrase.

    Keys with no value are absent, so a template's `{{#if fact.x}}` block
    disappears rather than rendering a blank.
    """
    out: dict = {}
    state = facts.get("state", "")
    if facts.get("location"):
        out["location"] = facts["location"]
    if facts.get("city"):
        out["city"] = facts["city"]
    if state:
        out["state"] = _state_name(state)
    if facts.get("segment"):
        out["segment"] = facts["segment"]
    if facts.get("federal_awards"):
        out["federal_awards"] = phrase_federal_awards(facts["federal_awards"], state)
    if facts.get("certification"):
        out["certification"] = phrase_certification(facts["certification"])
    if facts.get("registration"):
        out["registration"] = phrase_registration(facts["registration"])
    if facts.get("payroll_filings"):
        out["payroll_filings"] = phrase_payroll_filings(facts["payroll_filings"])
    if facts.get("portfolio"):
        out["portfolio"] = phrase_portfolio(facts["portfolio"])
    if facts.get("brands"):
        out["brands"] = phrase_brands(facts["brands"])
    if facts.get("locations"):
        out["locations"] = phrase_locations(facts["locations"])
    if facts.get("employees"):
        out["employees"] = phrase_employees(facts["employees"])
    if facts.get("trades"):
        out["trades"] = phrase_trades(facts["trades"])
    if facts.get("states_operated"):
        out["states_operated"] = phrase_states_operated(facts["states_operated"])
    if facts.get("source_list"):
        out["source_list"] = facts["source_list"]
    out["opening"] = opening_sentence(facts, out)
    return {k: v for k, v in out.items() if v}


#: The order in which facts are tried for the guaranteed opening sentence.
OPENING_PRIORITY = (
    "federal_awards", "payroll_filings", "portfolio", "brands", "locations",
    "certification", "registration", "employees", "states_operated",
)


def opening_sentence(facts: dict, rendered: dict) -> str:
    """One sentence that is always available, so no draft opens on a blank.

    Uses the strongest fact we hold; falls back to segment and location, which
    every eligible workbook row has at least one of.
    """
    for key in OPENING_PRIORITY:
        phrase = rendered.get(key)
        if not phrase:
            continue
        if key in ("certification", "registration"):
            return f"I saw {phrase}"
        return f"I saw {phrase}"
    segment = facts.get("segment", "")
    location = rendered.get("location") or rendered.get("state") or ""
    if segment and location:
        return f"I have you down as {_article(segment)} in {location}"
    if segment:
        return f"I have you down as {_article(segment)}"
    if location:
        return f"I have you down as working out of {location}"
    return "I found your organisation on a public register"


def _article(noun: str) -> str:
    noun = noun.strip()
    return ("an " if noun[:1].lower() in "aeiou" else "a ") + noun


# --------------------------------------------------------------------------
# optional LLM polish
# --------------------------------------------------------------------------

POLISH_SYSTEM = (
    "You tighten one sentence of a business email. Rules, in order of "
    "priority: (1) Do not add facts. Every noun, number, place and claim in "
    "your output must already appear in the input. (2) Do not add adjectives, "
    "flattery, urgency or claims of any kind. (3) Keep it to one sentence, "
    "plain US English, no exclamation marks, no em dashes. (4) If the input is "
    "already fine, return it unchanged. Return only the sentence."
)

POLISH_MODEL = "claude-opus-5"
POLISH_URL = "https://api.anthropic.com/v1/messages"


def llm_polish(text: str, enabled: bool = False, timeout: int = 20) -> str:
    """Optional one-sentence tidy-up. A no-op unless `enabled` and a key is set.

    Any failure (no key, network, bad response, an answer that grew new facts)
    returns the input unchanged: the rule-based sentence is always shippable.
    """
    if not enabled:
        return text
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key or not text.strip():
        return text
    payload = json.dumps({
        "model": POLISH_MODEL,
        "max_tokens": 300,
        "system": POLISH_SYSTEM,
        "messages": [{"role": "user", "content": text}],
    }).encode("utf-8")
    request = urllib.request.Request(
        POLISH_URL,
        data=payload,
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return text
    if body.get("stop_reason") == "refusal":
        return text
    parts = [b.get("text", "") for b in body.get("content", []) if b.get("type") == "text"]
    polished = " ".join(p.strip() for p in parts).strip()
    if not polished or not _no_new_numbers(text, polished):
        return text
    return polished


def _no_new_numbers(source: str, candidate: str) -> bool:
    """Guard: the polished sentence may not introduce a number the input lacks."""
    source_numbers = set(re.findall(r"\d[\d,\.]*", source))
    source_numbers |= {w for w in NUMBER_WORDS.values() if w in source.lower()}
    for number in re.findall(r"\d[\d,\.]*", candidate):
        if number not in source_numbers:
            return False
    return True
