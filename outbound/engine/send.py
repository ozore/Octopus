"""Send: three adapters, one of which can actually send.

* `dryrun` (default) writes to the log and nothing else.
* `gmail_drafts` writes queue files that a Claude Code routine turns into Gmail
  drafts through the Gmail connector. Still nothing leaves the mailbox until a
  human presses send in Gmail.
* `resend` posts to the Resend API. It refuses unless the founder has set
  OUTBOUND_SEND_ENABLED=true and RESEND_API_KEY in their own environment. No
  agent sets those.

Every send appends to `outbound/<app>/log.csv`, advances the stage and sets
`next_action_at` from the next step's `delay_days`.
"""

from __future__ import annotations

import csv
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

from outbound.engine import approve as approve_mod
from outbound.engine import batch as batch_mod
from outbound.engine import compose as compose_mod
from outbound.engine import config as cfg_mod
from outbound.engine import sequences as seq_mod
from outbound.engine import workbook as wb

LOG_COLUMNS = [
    "ts", "date", "app", "org_id", "name", "step", "sequence", "segment",
    "route_type", "to", "subject", "adapter", "status", "message_id", "notes",
]

ADAPTERS = ("dryrun", "gmail_drafts", "resend")

STAGE_AFTER = {1: "sent_1", 2: "sent_2", 3: "sent_3", 4: "breakup"}

RESEND_URL = "https://api.resend.com/emails"

QUEUE_README = """# Gmail draft queue - {app}, {date}

Each `*.json` file in this folder is one approved email, already reviewed.
A Claude Code routine (or a human) turns it into a Gmail draft:

1. Read every `*.json` in this folder except `forms/`.
2. For each one, create a Gmail draft with the Gmail connector:
   `to` = the file's `to`, `subject` = the file's `subject`,
   body = the file's `body` (plain text, exactly as written, footer included).
3. Do not send. Do not edit the text. Do not add a signature image or a link
   that was not already in the body.
4. Write the returned draft id back into `sent.json` as
   `{{"org_id": "<id>", "message_id": "<gmail draft id>"}}` so replies can be
   matched to a thread later.
5. The founder opens Gmail, reads the drafts, and presses send.

`forms/` holds organisations whose only public route is a contact page. They
are not emails: open the `form_url`, paste `body`, submit by hand.
"""


class SendError(RuntimeError):
    pass


def append_log(app: str, rows: list) -> None:
    path = cfg_mod.log_path(app)
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists()
    with open(path, "a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=LOG_COLUMNS, quoting=csv.QUOTE_ALL)
        if not exists:
            writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in LOG_COLUMNS})


def read_log(app: str) -> list:
    path = cfg_mod.log_path(app)
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def next_action_date(app: str, config: dict, sequence_name: str, step: int,
                     day) -> str:
    """When the next touch is due, from the next step's `delay_days`."""
    if step >= int(config.get("max_step", 4)):
        return ""
    try:
        sequence = seq_mod.load_sequence(app, sequence_name, config)
    except seq_mod.SequenceError:
        return ""
    delay = sequence.steps[step].delay_days  # steps is 0-based: index `step` is step+1
    due = batch_mod.parse_date(day) + timedelta(days=max(1, int(delay)))
    return batch_mod.next_business_day(due, config).isoformat()


def _advance(app: str, config: dict, which: str, results: list, day: str) -> int:
    """Move stage, last_action_at and next_action_at for everything that went."""
    path = cfg_mod.workbook_path(app, which)
    rows = wb.read_workbook(path)
    index = wb.index_by_id(rows)
    moved = 0
    for result in results:
        if result["status"] not in ("dryrun", "queued", "sent"):
            continue
        row = index.get(result["org_id"])
        if row is None:
            continue
        row["stage"] = STAGE_AFTER.get(result["step"], row.get("stage", "new"))
        row["last_action_at"] = day
        row["next_action_at"] = next_action_date(
            app, config, result["sequence"], result["step"], day)
        if result.get("message_id") and not row.get("thread_ref"):
            row["thread_ref"] = result["message_id"]
        moved += 1
    wb.write_workbook(path, rows)
    return moved


# --------------------------------------------------------------------------
# adapters
# --------------------------------------------------------------------------

def _adapter_dryrun(config: dict, drafts: list, day: str) -> list:
    return [{"org_id": d["org_id"], "step": d["step"], "sequence": d["sequence"],
             "status": "dryrun", "message_id": "",
             "notes": "dryrun: written to the log only, nothing sent"}
            for d in drafts]


def _adapter_gmail_drafts(config: dict, drafts: list, day: str) -> list:
    app = config["app"]
    out_dir = cfg_mod.queue_dir(app, day)
    (out_dir / "forms").mkdir(parents=True, exist_ok=True)
    (out_dir / "INSTRUCTIONS.md").write_text(
        QUEUE_README.format(app=config["display_name"], date=day), encoding="utf-8")
    results = []
    for draft in drafts:
        payload = {
            "org_id": draft["org_id"],
            "name": draft["name"],
            "app": app,
            "step": draft["step"],
            "sequence": draft["sequence"],
            "to": draft["to"],
            "subject": draft["subject"],
            "body": draft["text"],
            "form_url": draft.get("form_url", ""),
            "send_at_local": draft.get("send_at_local", ""),
            "timezone": draft.get("timezone", ""),
        }
        folder = out_dir if draft["route_type"] == "mailbox" else out_dir / "forms"
        (folder / f"{draft['org_id']}-{draft['step']}.json").write_text(
            json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        results.append({
            "org_id": draft["org_id"], "step": draft["step"],
            "sequence": draft["sequence"], "status": "queued", "message_id": "",
            "notes": ("queued for a Gmail draft" if draft["route_type"] == "mailbox"
                      else "queued as a manual contact-form task"),
        })
    return results


def _adapter_resend(config: dict, drafts: list, day: str) -> list:
    enabled = os.environ.get(config["env"]["send_enabled"], "").strip().lower()
    api_key = os.environ.get(config["env"]["resend_key"], "").strip()
    if enabled != "true":
        raise SendError(
            f"live sending refused: set {config['env']['send_enabled']}=true in your own "
            "environment first. No agent sets this."
        )
    if not api_key:
        raise SendError(f"live sending refused: {config['env']['resend_key']} is not set")
    from_address = cfg_mod.env_value(config, "from_address")
    from_name = cfg_mod.env_value(config, "from_name")
    if cfg_mod.is_placeholder(config, from_address):
        raise SendError(f"live sending refused: {config['env']['from_address']} is not set")
    results = []
    for draft in drafts:
        if draft["route_type"] != "mailbox":
            results.append({"org_id": draft["org_id"], "step": draft["step"],
                            "sequence": draft["sequence"], "status": "skipped",
                            "message_id": "",
                            "notes": "contact-form route: cannot be emailed"})
            continue
        body = json.dumps({
            "from": f"{from_name} <{from_address}>",
            "to": [draft["to"]],
            "reply_to": draft.get("reply_to") or from_address,
            "subject": draft["subject"],
            "text": draft["text"],
            "html": draft["html"],
        }).encode("utf-8")
        request = urllib.request.Request(
            RESEND_URL, data=body,
            headers={"content-type": "application/json",
                     "authorization": f"Bearer {api_key}"},
            method="POST")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                answer = json.loads(response.read().decode("utf-8"))
            results.append({"org_id": draft["org_id"], "step": draft["step"],
                            "sequence": draft["sequence"], "status": "sent",
                            "message_id": answer.get("id", ""), "notes": "resend"})
        except (urllib.error.URLError, OSError, ValueError) as error:
            results.append({"org_id": draft["org_id"], "step": draft["step"],
                            "sequence": draft["sequence"], "status": "error",
                            "message_id": "", "notes": f"resend error: {error}"})
    return results


ADAPTER_FUNCTIONS = {
    "dryrun": _adapter_dryrun,
    "gmail_drafts": _adapter_gmail_drafts,
    "resend": _adapter_resend,
}


def send(app: str, date, adapter: str = "dryrun", which: str = "customers",
         config: dict | None = None) -> dict:
    """Send (or queue, or pretend to send) everything the founder approved."""
    config = config or cfg_mod.load_config(app)
    if adapter not in ADAPTERS:
        raise SendError(f"unknown adapter {adapter!r}; pick one of {', '.join(ADAPTERS)}")
    day = batch_mod.parse_date(date).isoformat()
    approved = approve_mod.approved_ids(app, day)
    if not approved:
        raise SendError(
            f"nothing approved for {day}: run `approve --date {day}` first "
            "(drafts-first is deliberate, see PLAN.md default A4)")
    drafts = [d for d in compose_mod.load_drafts(app, day) if d["org_id"] in approved]
    blocked = [d for d in drafts if d["checks"]["blocking"]]
    if blocked:
        raise SendError("blocked drafts in an approved batch: "
                        + ", ".join(f"{d['org_id']}({','.join(d['checks']['blocking'])})"
                                    for d in blocked))
    results = ADAPTER_FUNCTIONS[adapter](config, drafts, day)
    by_id = {d["org_id"]: d for d in drafts}
    stamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    log_rows = []
    for result in results:
        draft = by_id[result["org_id"]]
        log_rows.append({
            "ts": stamp, "date": day, "app": app, "org_id": draft["org_id"],
            "name": draft["name"], "step": draft["step"], "sequence": draft["sequence"],
            "segment": draft["segment"], "route_type": draft["route_type"],
            "to": draft["to"] or draft["form_url"], "subject": draft["subject"],
            "adapter": adapter, "status": result["status"],
            "message_id": result.get("message_id", ""), "notes": result.get("notes", ""),
        })
    append_log(app, log_rows)
    moved = _advance(app, config, which, results, day)
    return {
        "app": app, "date": day, "adapter": adapter,
        "counts": {
            "approved": len(approved), "attempted": len(results),
            "advanced": moved,
            "by_status": {status: len([r for r in results if r["status"] == status])
                          for status in sorted({r["status"] for r in results})},
        },
        "queue": str(cfg_mod.queue_dir(app, day)) if adapter == "gmail_drafts" else "",
    }
