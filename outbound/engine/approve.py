"""Approval: the gate between drafts and the send queue.

Default A4 of the phase-4 plan: routines write drafts, the founder approves,
sending happens batch by batch. Nothing reaches `send` without an approval
file, and a draft with a blocking check can never be approved.
"""

from __future__ import annotations

import json
from datetime import datetime

from outbound.engine import batch as batch_mod
from outbound.engine import compose as compose_mod
from outbound.engine import config as cfg_mod


class ApprovalError(RuntimeError):
    pass


def load_approvals(app: str, date) -> dict:
    day = batch_mod.parse_date(date).isoformat()
    path = cfg_mod.approvals_path(app, day)
    if not path.exists():
        return {"app": app, "date": day, "approved": [], "rejected": {}, "history": []}
    return json.loads(path.read_text(encoding="utf-8"))


def _save(app: str, record: dict) -> dict:
    path = cfg_mod.approvals_path(app, record["date"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    record["path"] = str(path)
    return record


def approve(app: str, date, only: list | None = None, by: str = "founder") -> dict:
    """Approve a whole batch, or just the org_ids in `only`."""
    day = batch_mod.parse_date(date).isoformat()
    drafts = compose_mod.load_drafts(app, day)
    if not drafts:
        raise ApprovalError(f"no drafts to approve for {day}")
    by_id = {d["org_id"]: d for d in drafts}
    targets = list(only) if only else [d["org_id"] for d in drafts]
    unknown = [t for t in targets if t not in by_id]
    if unknown:
        raise ApprovalError(f"not in the {day} batch: {', '.join(sorted(unknown))}")

    record = load_approvals(app, day)
    approved = set(record.get("approved", []))
    rejected = dict(record.get("rejected", {}))
    blocked = {}
    for org_id in targets:
        blocking = by_id[org_id]["checks"]["blocking"]
        if blocking:
            blocked[org_id] = blocking
            continue
        approved.add(org_id)
        rejected.pop(org_id, None)

    record.update({
        "app": app,
        "date": day,
        "approved": sorted(approved),
        "rejected": rejected,
        "blocked": blocked,
        "mode": "partial" if only else "batch",
        "approved_by": by,
        "approved_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    record.setdefault("history", []).append({
        "at": record["approved_at"], "action": "approve",
        "count": len(targets) - len(blocked), "mode": record["mode"], "by": by,
    })
    return _save(app, record)


def reject(app: str, date, org_ids: list, reason: str, by: str = "founder") -> dict:
    day = batch_mod.parse_date(date).isoformat()
    record = load_approvals(app, day)
    approved = set(record.get("approved", []))
    rejected = dict(record.get("rejected", {}))
    for org_id in org_ids:
        approved.discard(org_id)
        rejected[org_id] = reason
    record.update({
        "app": app, "date": day, "approved": sorted(approved), "rejected": rejected,
    })
    record.setdefault("history", []).append({
        "at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "action": "reject",
        "org_ids": list(org_ids), "reason": reason, "by": by,
    })
    return _save(app, record)


def approved_ids(app: str, date) -> set:
    return set(load_approvals(app, date).get("approved", []))
