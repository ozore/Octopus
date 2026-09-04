"""Paths, defaults and per-app configuration.

Everything the engine writes lives under `outbound/<app>/`. Tests override the
roots with OUTBOUND_ROOT / OUTBOUND_PROSPECTS_ROOT so that no test can touch a
real workbook.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

APPS = ("wagelens", "certly", "stateready")

#: Defaults every app config inherits. `config.json` overrides key by key.
DEFAULTS = {
    "app": "",
    "display_name": "",
    "company": "TheVillage",
    "signature": "",
    # which phase-3 prospect directories feed this workbook (certly merges two)
    "prospect_dirs": [],
    # batching
    "daily_cap_new": 20,
    "daily_cap_total": 60,
    "min_gap_days": 4,
    "partner_min_gap_days": 14,
    "partner_max_step": 3,
    "send_window": "09:00-11:00",
    "business_days_only": True,
    "skip_dates": [],
    # sequences
    "default_sequence": "plain-intro",
    "sequence_map": {},
    "max_step": 4,
    # deliverability
    "mailbox_started_on": None,
    "warmup_schedule": [5, 10, 20],
    "bounce_stop_loss_pct": 3.0,
    "complaint_stop_loss_pct": 0.1,
    # environment variable NAMES (never values; no secrets in the repo)
    "env": {
        "from_name": "OUTBOUND_FROM_NAME",
        "from_address": "OUTBOUND_FROM_ADDRESS",
        "reply_to": "OUTBOUND_REPLY_TO",
        "postal_address": "OUTBOUND_POSTAL_ADDRESS",
        "unsubscribe_url": "OUTBOUND_UNSUBSCRIBE_URL",
        "send_enabled": "OUTBOUND_SEND_ENABLED",
        "resend_key": "RESEND_API_KEY",
        "anthropic_key": "ANTHROPIC_API_KEY",
    },
    # placeholders used when the founder has not supplied the real value yet.
    # A draft carrying one of these is blocked from the send queue.
    "placeholders": {
        "from_name": "[SENDER NAME PLACEHOLDER - set OUTBOUND_FROM_NAME]",
        "from_address": "[SENDER ADDRESS PLACEHOLDER - set OUTBOUND_FROM_ADDRESS]",
        "postal_address": "[PHYSICAL ADDRESS PLACEHOLDER - set OUTBOUND_POSTAL_ADDRESS]",
        "unsubscribe_url": "[UNSUBSCRIBE URL PLACEHOLDER - set OUTBOUND_UNSUBSCRIBE_URL]",
    },
}


def outbound_root() -> Path:
    """Root of the outbound tree (overridable for tests)."""
    return Path(os.environ.get("OUTBOUND_ROOT") or (REPO_ROOT / "outbound"))


def prospects_root() -> Path:
    """Root of the phase-3 prospect lists (read only, never written)."""
    return Path(
        os.environ.get("OUTBOUND_PROSPECTS_ROOT")
        or (REPO_ROOT / "phase-3-acquisition" / "prospects")
    )


def app_dir(app: str) -> Path:
    return outbound_root() / app


def workbook_path(app: str, which: str = "customers") -> Path:
    name = "workbook.csv" if which == "customers" else "workbook-partners.csv"
    return app_dir(app) / name


def suppression_path(app: str) -> Path:
    return app_dir(app) / "suppression.csv"


def log_path(app: str) -> Path:
    return app_dir(app) / "log.csv"


def sequences_dir(app: str) -> Path:
    return app_dir(app) / "sequences"


def plan_path(app: str, date: str, which: str = "customers") -> Path:
    suffix = "" if which == "customers" else "-partners"
    return app_dir(app) / "plans" / f"{date}{suffix}.json"


def drafts_dir(app: str, date: str) -> Path:
    return app_dir(app) / "drafts" / date


def approvals_path(app: str, date: str) -> Path:
    return app_dir(app) / "approvals" / f"{date}.json"


def queue_dir(app: str, date: str) -> Path:
    return app_dir(app) / "queue" / date


def report_path(app: str) -> Path:
    return app_dir(app) / "REPORT.md"


def load_config(app: str) -> dict:
    """Config for `app`: DEFAULTS overridden by `outbound/<app>/config.json`."""
    cfg = json.loads(json.dumps(DEFAULTS))  # deep copy of plain JSON data
    path = app_dir(app) / "config.json"
    if path.exists():
        override = json.loads(path.read_text(encoding="utf-8"))
        for key, value in override.items():
            if isinstance(value, dict) and isinstance(cfg.get(key), dict):
                cfg[key].update(value)
            else:
                cfg[key] = value
    cfg["app"] = app
    if not cfg.get("display_name"):
        cfg["display_name"] = app.capitalize()
    if not cfg.get("signature"):
        cfg["signature"] = f"{cfg['display_name']}, a {cfg['company']} company"
    if not cfg.get("prospect_dirs"):
        cfg["prospect_dirs"] = [app]
    return cfg


def env_value(cfg: dict, key: str, default: str = "") -> str:
    """Read the environment variable this config names for `key`.

    Falls back to the configured placeholder (so a draft is never silently
    blank) and finally to `default`.
    """
    var = cfg.get("env", {}).get(key)
    if var:
        value = os.environ.get(var, "").strip()
        if value:
            return value
    placeholder = cfg.get("placeholders", {}).get(key)
    if placeholder:
        return placeholder
    return default


def is_placeholder(cfg: dict, value: str) -> bool:
    return value in set(cfg.get("placeholders", {}).values())
