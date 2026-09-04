"""Replies in: stage changes and suppression.

`record_reply(app, org_id, kind)` is the single entry point. A Gmail-search
routine feeds the same function in bulk with `--from-csv`.

kinds:
  replied  a human answered; the sequence stops and the founder takes over
  stop     an opt-out; permanent suppression, immediately (CAN-SPAM)
  bounce   a hard bounce; the address is suppressed so it is never retried

Two extra kinds are accepted so the report can compute a positive rate that
means something: `positive` (a reply worth a conversation) and `converted`.
"""

from __future__ import annotations

import csv
from datetime import datetime

from outbound.engine import batch as batch_mod
from outbound.engine import config as cfg_mod
from outbound.engine import send as send_mod
from outbound.engine import workbook as wb

CORE_KINDS = ("replied", "stop", "bounce")
KINDS = CORE_KINDS + ("positive", "converted", "do_not_contact")

STAGE_FOR_KIND = {
    "replied": "replied",
    "positive": "replied",
    "converted": "converted",
    "stop": "unsubscribed",
    "bounce": "bounced",
    "do_not_contact": "do_not_contact",
}

SUPPRESS_KINDS = {
    "stop": "opt-out received; honoured permanently (CAN-SPAM)",
    "bounce": "hard bounce",
    "do_not_contact": "founder marked do-not-contact",
}


class InboxError(RuntimeError):
    pass


def record_reply(app: str, org_id: str, kind: str, at: str = "", note: str = "",
                 which: str = "customers", config: dict | None = None) -> dict:
    """Move one organisation's stage and suppress it when the kind demands it."""
    config = config or cfg_mod.load_config(app)
    kind = (kind or "").strip().lower()
    if kind not in KINDS:
        raise InboxError(f"unknown reply kind {kind!r}; use one of {', '.join(KINDS)}")
    day = batch_mod.parse_date(at).isoformat() if at else datetime.utcnow().date().isoformat()

    path = cfg_mod.workbook_path(app, which)
    rows = wb.read_workbook(path)
    row = wb.index_by_id(rows).get(org_id)
    if row is None:
        raise InboxError(f"{org_id} is not in {path.name}")

    previous = row.get("stage", "new")
    row["stage"] = STAGE_FOR_KIND[kind]
    row["last_action_at"] = day
    row["next_action_at"] = ""
    if note:
        row["notes"] = "; ".join(p for p in [row.get("notes", ""), f"{day} {kind}: {note}"] if p)
    wb.write_workbook(path, rows)

    suppressed = False
    if kind in SUPPRESS_KINDS:
        route = (row.get("contact_route") or "").strip()
        if kind == "bounce" and row.get("route_type") == "mailbox" and route:
            wb.add_suppression(app, route.lower(), "email", SUPPRESS_KINDS[kind], day, org_id)
        else:
            domain = wb.domain_of(row.get("website", "")) or wb.domain_of(route)
            if domain:
                wb.add_suppression(app, domain, "domain", SUPPRESS_KINDS[kind], day, org_id)
            elif route and "@" in route:
                wb.add_suppression(app, route.lower(), "email", SUPPRESS_KINDS[kind], day, org_id)
            else:
                wb.add_suppression(app, row.get("name", "").lower(), "org",
                                   SUPPRESS_KINDS[kind], day, org_id)
        suppressed = True

    send_mod.append_log(app, [{
        "ts": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "date": day, "app": app,
        "org_id": org_id, "name": row.get("name", ""), "step": "",
        "sequence": "", "segment": row.get("segment", ""),
        "route_type": row.get("route_type", ""), "to": row.get("contact_route", ""),
        "subject": "", "adapter": "inbox", "status": kind, "message_id": "",
        "notes": note or f"stage {previous} -> {row['stage']}",
    }])
    return {"org_id": org_id, "kind": kind, "stage_from": previous,
            "stage_to": row["stage"], "suppressed": suppressed, "date": day}


def import_csv(app: str, path, which: str = "customers",
               config: dict | None = None) -> dict:
    """Bulk import from a Gmail-search routine.

    Columns: org_id, kind, and optionally at, note. Unknown org_ids and bad
    kinds are reported, not raised: one bad line must not lose the batch.
    """
    with open(path, newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    applied, failed = [], []
    for row in rows:
        try:
            applied.append(record_reply(
                app, (row.get("org_id") or "").strip(), (row.get("kind") or "").strip(),
                at=(row.get("at") or "").strip(), note=(row.get("note") or "").strip(),
                which=which, config=config))
        except (InboxError, ValueError) as error:
            failed.append({"row": row, "error": str(error)})
    return {"applied": len(applied), "failed": failed, "results": applied}
