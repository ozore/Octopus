"""Reporting: what actually happened, and what the lists can support.

Writes `outbound/<app>/REPORT.md`. Rates are computed against emails actually
sent (or dry-run), never against the workbook size, and a rate over a base
smaller than 30 is printed with the base so nobody reads noise as a signal.
"""

from __future__ import annotations

import collections
import csv
from datetime import datetime

from outbound.engine import config as cfg_mod
from outbound.engine import send as send_mod
from outbound.engine import workbook as wb

SENT_STATUSES = ("sent", "queued", "dryrun")
MIN_BASE = 30


def _rate(numerator: int, denominator: int) -> str:
    if not denominator:
        return "n/a"
    value = 100.0 * numerator / denominator
    suffix = "" if denominator >= MIN_BASE else f" (n={denominator}, too small to read)"
    return f"{value:.1f}%{suffix}"


def coverage(app: str, config: dict) -> dict:
    """What the phase-3 lists can actually support for this app."""
    out = {"end_customer": 0, "mailbox": 0, "form": 0, "no_route": 0,
           "personal_route_dropped": 0, "partner": 0, "partner_usable": 0,
           "excluded": 0, "per_dir": {}}
    for directory in config["prospect_dirs"]:
        path = cfg_mod.prospects_root() / directory / "prospects.csv"
        if not path.exists():
            continue
        per = {"end_customer": 0, "mailbox": 0, "form": 0, "no_route": 0,
               "personal_route_dropped": 0}
        with open(path, newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                kind = (row.get("prospect_type") or "").strip()
                if kind == "partner":
                    out["partner"] += 1
                    if wb.classify_route(row.get("contact_route", ""))[0] != "none":
                        out["partner_usable"] += 1
                    continue
                if kind == "excluded":
                    out["excluded"] += 1
                    continue
                if kind != "end-customer":
                    continue
                per["end_customer"] += 1
                route_type, _, note = wb.classify_route(row.get("contact_route", ""))
                if route_type == "mailbox":
                    per["mailbox"] += 1
                elif route_type == "form":
                    per["form"] += 1
                elif note.startswith("route dropped: not a recognisable"):
                    per["personal_route_dropped"] += 1
                else:
                    per["no_route"] += 1
        out["per_dir"][directory] = per
        for key in per:
            out[key] += per[key]
    return out


def gather(app: str, config: dict | None = None) -> dict:
    config = config or cfg_mod.load_config(app)
    log = send_mod.read_log(app)
    sends = [r for r in log if r.get("status") in SENT_STATUSES]
    events = [r for r in log if r.get("adapter") == "inbox"]

    by_step = collections.Counter(r.get("step", "") for r in sends)
    by_sequence = collections.Counter(r.get("sequence", "") for r in sends)
    by_segment = collections.Counter(r.get("segment", "") for r in sends)
    by_adapter = collections.Counter(r.get("adapter", "") for r in sends)

    organisations = {r["org_id"] for r in sends}
    kinds = collections.Counter(r.get("status", "") for r in events)
    replied = {r["org_id"] for r in events if r.get("status") in ("replied", "positive", "converted")}
    positive = {r["org_id"] for r in events if r.get("status") in ("positive", "converted")}
    bounced = {r["org_id"] for r in events if r.get("status") == "bounce"}
    stopped = {r["org_id"] for r in events if r.get("status") == "stop"}

    segment_events = collections.defaultdict(lambda: collections.Counter())
    sequence_events = collections.defaultdict(lambda: collections.Counter())
    segment_of = {r["org_id"]: r.get("segment", "") for r in sends}
    sequence_of = {r["org_id"]: r.get("sequence", "") for r in sends}
    for event in events:
        org_id = event["org_id"]
        segment_events[segment_of.get(org_id, event.get("segment", ""))][event["status"]] += 1
        sequence_events[sequence_of.get(org_id, "")][event["status"]] += 1

    rows = wb.read_workbook(cfg_mod.workbook_path(app, "customers"))
    partners = wb.read_workbook(cfg_mod.workbook_path(app, "partners"))
    return {
        "app": app,
        "config": config,
        "log_rows": len(log),
        "sends": sends,
        "events": events,
        "by_step": by_step,
        "by_sequence": by_sequence,
        "by_segment": by_segment,
        "by_adapter": by_adapter,
        "organisations": organisations,
        "kinds": kinds,
        "replied": replied,
        "positive": positive,
        "bounced": bounced,
        "stopped": stopped,
        "segment_events": segment_events,
        "sequence_events": sequence_events,
        "workbook": rows,
        "partners": partners,
        "workbook_stages": collections.Counter(r.get("stage", "") for r in rows),
        "workbook_routes": collections.Counter(r.get("route_type", "") for r in rows),
        "partner_routes": collections.Counter(r.get("route_type", "") for r in partners),
        "coverage": coverage(app, config),
    }


def render(data: dict) -> str:
    app = data["app"]
    config = data["config"]
    sends = data["sends"]
    total = len(sends)
    organisations = len(data["organisations"])
    cover = data["coverage"]
    cap = int(config["daily_cap_new"])
    reachable = cover["mailbox"] + cover["form"]

    lines = [
        f"# {config['display_name']} outbound report",
        "",
        f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} - "
        f"`python3 -m outbound.engine.cli {app} report`",
        f"**Status:** drafts-first. Nothing in this report was sent by an agent.",
        "",
        "## 1. What the lists can support",
        "",
        "| | rows |",
        "|---|---:|",
        f"| end-customer rows in the phase-3 list(s) | {cover['end_customer']:,} |",
        f"| with a generic business mailbox | {cover['mailbox']:,} |",
        f"| with a contact page only | {cover['form']:,} |",
        f"| route dropped: not a recognisable generic mailbox | {cover['personal_route_dropped']:,} |",
        f"| no contact route recorded at all | {cover['no_route']:,} |",
        f"| **usable in the workbook** | **{reachable:,}** |",
        f"| partner rows | {cover['partner']:,} |",
        f"| partner rows with a usable route | {cover['partner_usable']:,} |",
        f"| excluded rows (seed the suppression list) | {cover['excluded']:,} |",
        "",
    ]
    if len(cover["per_dir"]) > 1:
        lines += ["Per source list:", "", "| list | end-customer | mailbox | contact page | no route |",
                  "|---|---:|---:|---:|---:|"]
        for name, per in sorted(cover["per_dir"].items()):
            lines.append(f"| {name} | {per['end_customer']:,} | {per['mailbox']:,} | "
                         f"{per['form']:,} | {per['no_route'] + per['personal_route_dropped']:,} |")
        lines.append("")

    days = reachable // cap if cap else 0
    if reachable < cap:
        lines.append(
            f"> **Finding about the lists, not the engine.** Only {reachable} of "
            f"{cover['end_customer']:,} end-customer rows carry a usable business route, "
            f"which is below the daily cap of {cap}. The batch will be short until the "
            "lists gain contact routes. This is a research gap in phase 3, recorded here "
            "so it is not mistaken for a batching bug.")
    else:
        lines.append(
            f"> At {cap} new organisations a day, the usable pool of {reachable:,} lasts "
            f"about {days} sending days before it needs extending.")
    lines += [
        "",
        "## 2. Workbook",
        "",
        f"- customers: **{len(data['workbook']):,}** rows "
        f"({data['workbook_routes'].get('mailbox', 0):,} mailbox, "
        f"{data['workbook_routes'].get('form', 0):,} contact page)",
        f"- partners: **{len(data['partners']):,}** rows "
        f"({data['partner_routes'].get('mailbox', 0):,} mailbox, "
        f"{data['partner_routes'].get('form', 0):,} contact page)",
        "",
        "| stage | rows |",
        "|---|---:|",
    ]
    for stage in wb.STAGES:
        count = data["workbook_stages"].get(stage, 0)
        if count:
            lines.append(f"| {stage} | {count:,} |")
    lines += ["", "## 3. Sent", ""]
    if not total:
        lines += ["Nothing has been sent or dry-run yet.", ""]
    else:
        lines += ["| step | emails |", "|---|---:|"]
        for step in sorted(data["by_step"], key=lambda s: str(s)):
            lines.append(f"| {step or '-'} | {data['by_step'][step]:,} |")
        lines += ["", "| adapter | emails |", "|---|---:|"]
        for adapter, count in sorted(data["by_adapter"].items()):
            lines.append(f"| {adapter} | {count:,} |")
        lines += [
            "",
            f"- emails: **{total:,}** to **{organisations:,}** organisations",
            f"- reply rate: **{_rate(len(data['replied']), organisations)}**",
            f"- positive rate: **{_rate(len(data['positive']), organisations)}**",
            f"- bounce rate: **{_rate(len(data['bounced']), organisations)}** "
            f"(stop-loss {config['bounce_stop_loss_pct']}%)",
            f"- unsubscribe rate: **{_rate(len(data['stopped']), organisations)}**",
            "",
        ]
        bounce_pct = 100.0 * len(data["bounced"]) / organisations if organisations else 0.0
        if organisations >= MIN_BASE and bounce_pct > float(config["bounce_stop_loss_pct"]):
            lines.append(f"> **STOP-LOSS BREACHED.** Bounce rate {bounce_pct:.1f}% is over "
                         f"{config['bounce_stop_loss_pct']}%. Stop sending, clean the list, "
                         "verify the routes before the next batch.")
            lines.append("")

        lines += ["### By segment", "",
                  "| segment | emails | replies | stops | bounces |",
                  "|---|---:|---:|---:|---:|"]
        for segment, count in data["by_segment"].most_common():
            events = data["segment_events"].get(segment, collections.Counter())
            lines.append(
                f"| {segment or '-'} | {count:,} | "
                f"{events['replied'] + events['positive'] + events['converted']} | "
                f"{events['stop']} | {events['bounce']} |")
        lines += ["", "### By sequence", "",
                  "| sequence | emails | replies | stops | bounces |",
                  "|---|---:|---:|---:|---:|"]
        for sequence, count in data["by_sequence"].most_common():
            events = data["sequence_events"].get(sequence, collections.Counter())
            lines.append(
                f"| {sequence or '-'} | {count:,} | "
                f"{events['replied'] + events['positive'] + events['converted']} | "
                f"{events['stop']} | {events['bounce']} |")
        lines.append("")

    lines += [
        "## 4. Replies recorded",
        "",
        "| kind | count |",
        "|---|---:|",
    ]
    for kind, count in sorted(data["kinds"].items()):
        lines.append(f"| {kind} | {count:,} |")
    if not data["kinds"]:
        lines.append("| (none yet) | 0 |")
    lines += [
        "",
        "## 5. Reading this honestly",
        "",
        "- Rates over a base under 30 are printed with their base; they are not evidence.",
        "- `dryrun` rows are counted as emails because they consumed a step in the "
        "sequence; they were never delivered to anyone.",
        "- No open tracking and no link tracking exist by design, so there is no open "
        "rate here and there never will be. Replies are the only signal.",
        "",
    ]
    return "\n".join(lines) + "\n"


def report(app: str, config: dict | None = None) -> dict:
    config = config or cfg_mod.load_config(app)
    data = gather(app, config)
    text = render(data)
    path = cfg_mod.report_path(app)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return {"path": str(path), "sends": len(data["sends"]),
            "organisations": len(data["organisations"]),
            "usable_routes": data["coverage"]["mailbox"] + data["coverage"]["form"]}
