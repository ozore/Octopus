"""Shared helpers for the StateReady knowledge-base scripts.

One module so that the hash a record was built with, the hash the drift cron compares against,
and the hash the second verification pass computes are produced by *the same* code. If
normalisation lived in three places it would diverge and the drift signal would rot silently.

No third-party dependencies: these scripts run in CI and in a Vercel cron container.
"""
from __future__ import annotations

import hashlib
import html as _html
import json
import os
import re
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB_DATA = ROOT / "kb-data"
ONTOLOGY = ROOT / "ontology"
CACHE = ROOT / "kb-scripts" / ".cache"

# A boring desktop UA. Several state boards return 403 to python-urllib's default and to WebFetch
# but serve a normal page to this one; see product/CLAUDE.md.
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

_DROP_TAGS = re.compile(r"(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>")
_BLOCK_END = re.compile(r"(?is)</(p|div|li|tr|h[1-6]|td|th|table|section)>")
_BR = re.compile(r"(?is)<br\s*/?>")
_CELL = re.compile(r"(?is)<t[dh][^>]*>")
_TAG = re.compile(r"(?s)<[^>]+>")
_WS = re.compile(r"[ \t\xa0  ]+")
_NL = re.compile(r"\n\s*\n+")

# Volatile fragments that appear on board pages and would otherwise make every daily drift check
# fire. Each one was observed on a real page in the launch set.
_VOLATILE = [
    re.compile(r"\d{1,2}:\d{2}:\d{2}\s*(AM|PM)\s*\d{1,2}/\d{1,2}/\d{4}"),   # DBPR clock
    re.compile(r"(?i)Copyright\s*(&copy;|©)?\s*\d{4}"),
    re.compile(r"(?i)Last updated:\s*[A-Z][a-z]+ \d{1,2}, \d{4}"),
    re.compile(r"(?i)Next Board Meeting.{0,80}"),
    re.compile(r"nonce-[A-Za-z0-9+/=]{8,}"),
    re.compile(r"(?i)\b(csrf|sid)=[A-Za-z0-9%._-]{4,}"),
]


def html_to_text(raw: str) -> str:
    """HTML -> a stable plain-text rendering. Deliberately lossy: layout, attributes and inline
    markup are discarded, because a board re-theming its site must NOT read as a rule change."""
    s = _DROP_TAGS.sub(" ", raw)
    s = _BR.sub("\n", s)
    s = _BLOCK_END.sub("\n", s)
    s = _CELL.sub(" | ", s)
    s = _TAG.sub(" ", s)
    s = _html.unescape(s)
    s = _WS.sub(" ", s)
    s = _NL.sub("\n", s)
    return "\n".join(line.strip() for line in s.split("\n") if line.strip())


def normalise(raw: bytes | str, content_type: str = "text/html") -> str:
    if isinstance(raw, bytes):
        if content_type and "pdf" in content_type.lower():
            return _pdf_to_text(raw)
        if raw[:4] == b"%PDF":
            return _pdf_to_text(raw)
        if raw[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":       # OLE2 (.doc from flrules.org)
            return _ole_strings(raw)
        raw = raw.decode("utf-8", errors="replace")
    text = html_to_text(raw) if "<" in raw[:2000] else raw
    for pat in _VOLATILE:
        text = pat.sub(" ", text)
    return _WS.sub(" ", text).strip()


def _pdf_to_text(data: bytes) -> str:
    try:
        import pypdf                                              # optional
    except ImportError:
        return hashlib.sha256(data).hexdigest()                   # hash-only mode; still detects drift
    import io
    reader = pypdf.PdfReader(io.BytesIO(data))
    return _WS.sub(" ", "\n".join((p.extract_text() or "") for p in reader.pages)).strip()


def _ole_strings(data: bytes) -> str:
    """Adopted Florida rules are served as Word .doc. We only need the printable strings."""
    text = re.sub(rb"[^\x20-\x7e\n]+", b" ", data).decode("ascii", "replace")
    return _WS.sub(" ", text).strip()


def content_hash(normalised_text: str) -> str:
    return hashlib.sha256(normalised_text.encode("utf-8")).hexdigest()


def fetch(url: str, timeout: int = 45, attempts: int = 2, backoff_s: float = 4.0):
    """Two attempts, then give up and report — the fleet's standing rule for a stubborn source.

    The second attempt is not decoration: tdlr.texas.gov resets the connection on roughly one
    request in ten when the same client walks several of its pages in a row, and a drift job that
    treated a reset as a change would page a human every week for nothing."""
    import time as _time
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    last = (0, b"", "")
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read(), resp.headers.get("Content-Type", "")
        except urllib.error.HTTPError as exc:
            # A 403 or 404 is an answer, not a glitch: do not retry it.
            return exc.code, exc.read() if exc.fp else b"", (exc.headers.get("Content-Type", "")
                                                             if exc.headers else "")
        except Exception as exc:                                   # DNS, TLS, timeout, reset
            last = (0, f"attempt {attempt + 1}/{attempts}: {exc}".encode(), "")
            if attempt + 1 < attempts:
                _time.sleep(backoff_s)
    return last


def load_records() -> list[tuple[Path, dict]]:
    out = []
    for path in sorted(KB_DATA.glob("*.json")):
        if path.name.startswith("_"):
            continue
        out.append((path, json.loads(path.read_text(encoding="utf-8"))))
    return out


def walk_sourced_values(node, trail=""):
    """Yield (json_path, sourced_value_dict) for every SourcedValue anywhere in a record.
    A SourcedValue is identified structurally: a dict carrying both 'value' and 'status'."""
    if isinstance(node, dict):
        if "value" in node and "status" in node and "confidence" in node:
            yield trail, node
            return
        for key, child in node.items():
            yield from walk_sourced_values(child, f"{trail}.{key}" if trail else key)
    elif isinstance(node, list):
        for i, child in enumerate(node):
            yield from walk_sourced_values(child, f"{trail}[{i}]")
