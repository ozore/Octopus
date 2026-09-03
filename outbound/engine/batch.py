"""The daily batch: who gets an email today, and who deliberately does not.

Rules, all of them enforced here rather than left to the operator:

* follow-ups that are due come first, then new organisations up to the cap;
* never two emails to one organisation inside `min_gap_days`;
* business days only, judged in the recipient's likely time zone;
* nothing in `suppression.csv` is ever planned;
* a warm-up ceiling applies while the sending mailbox is new.
"""

from __future__ import annotations

import json
from datetime import date as Date
from datetime import datetime, timedelta

from outbound.engine import config as cfg_mod
from outbound.engine import sequences as seq_mod
from outbound.engine import workbook as wb

#: state -> (standard UTC offset in hours, observes US daylight saving)
STATE_TZ = {
    "AL": (-6, True), "AK": (-9, True), "AZ": (-7, False), "AR": (-6, True),
    "CA": (-8, True), "CO": (-7, True), "CT": (-5, True), "DC": (-5, True),
    "DE": (-5, True), "FL": (-5, True), "GA": (-5, True), "HI": (-10, False),
    "IA": (-6, True), "ID": (-7, True), "IL": (-6, True), "IN": (-5, True),
    "KS": (-6, True), "KY": (-5, True), "LA": (-6, True), "MA": (-5, True),
    "MD": (-5, True), "ME": (-5, True), "MI": (-5, True), "MN": (-6, True),
    "MO": (-6, True), "MS": (-6, True), "MT": (-7, True), "NC": (-5, True),
    "ND": (-6, True), "NE": (-6, True), "NH": (-5, True), "NJ": (-5, True),
    "NM": (-7, True), "NV": (-8, True), "NY": (-5, True), "OH": (-5, True),
    "OK": (-6, True), "OR": (-8, True), "PA": (-5, True), "PR": (-4, False),
    "RI": (-5, True), "SC": (-5, True), "SD": (-6, True), "TN": (-6, True),
    "TX": (-6, True), "UT": (-7, True), "VA": (-5, True), "VT": (-5, True),
    "WA": (-8, True), "WI": (-6, True), "WV": (-5, True), "WY": (-7, True),
}
TZ_LABEL = {-4: "AST", -5: "ET", -6: "CT", -7: "MT", -8: "PT", -9: "AKT", -10: "HT"}

#: Used when the row carries no state at all. The list is US-only (default A2)
#: and Eastern is the most common state among the eligible rows.
DEFAULT_STATE = "NY"


def parse_date(value) -> Date:
    if isinstance(value, Date):
        return value
    return datetime.strptime(str(value).strip(), "%Y-%m-%d").date()


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> Date:
    day = Date(year, month, 1)
    offset = (weekday - day.weekday()) % 7
    return day + timedelta(days=offset + 7 * (n - 1))


def observes_dst(day: Date) -> bool:
    """US daylight saving: second Sunday in March to first Sunday in November."""
    start = _nth_weekday(day.year, 3, 6, 2)
    end = _nth_weekday(day.year, 11, 6, 1)
    return start <= day < end


def timezone_for(state: str, day: Date) -> tuple[int, str]:
    """(UTC offset in hours, label) for a state on a given day."""
    base, dst = STATE_TZ.get((state or "").upper(), STATE_TZ[DEFAULT_STATE])
    offset = base + 1 if (dst and observes_dst(day)) else base
    label = TZ_LABEL.get(base, "ET")
    return offset, (label.replace("T", "DT") if offset != base else label)


def state_of(row: dict) -> str:
    facts = wb.facts_of(row)
    return (facts.get("state") or "").upper()


def is_business_day(day: Date, config: dict) -> bool:
    if not config.get("business_days_only", True):
        return True
    if day.weekday() >= 5:
        return False
    return day.isoformat() not in set(config.get("skip_dates") or [])


def next_business_day(day: Date, config: dict) -> Date:
    for _ in range(14):
        if is_business_day(day, config):
            return day
        day += timedelta(days=1)
    return day


def send_moment(day: Date, state: str, window: str) -> dict:
    """When this email should leave, expressed both locally and in UTC."""
    start = (window or "09:00-11:00").split("-")[0].strip() or "09:00"
    hour, _, minute = start.partition(":")
    offset, label = timezone_for(state, day)
    local = datetime.combine(day, datetime.min.time()).replace(
        hour=int(hour), minute=int(minute or 0))
    utc = local - timedelta(hours=offset)
    return {
        "timezone": label,
        "utc_offset": offset,
        "send_at_local": local.strftime("%Y-%m-%d %H:%M"),
        "send_at_utc": utc.strftime("%Y-%m-%d %H:%MZ"),
        "send_window": window,
    }


def step_for_stage(stage: str) -> int:
    """The step number an email would be, given where the row stands now."""
    return {"new": 1, "queued": 1, "sent_1": 2, "sent_2": 3, "sent_3": 4}.get(stage, 0)


def warmup_cap(config: dict, day: Date) -> int | None:
    """Ceiling from the new-mailbox warm-up schedule, or None if not warming up."""
    started = config.get("mailbox_started_on")
    if not started:
        return None
    schedule = config.get("warmup_schedule") or []
    weeks = max(0, (day - parse_date(started)).days // 7)
    if weeks >= len(schedule):
        return None
    return int(schedule[weeks])


def plan(app: str, date, which: str = "customers", config: dict | None = None,
         write: bool = True) -> dict:
    """Select the day's sends. Returns the plan; writes `plans/<date>.json`."""
    config = config or cfg_mod.load_config(app)
    day = parse_date(date)
    rows = wb.read_workbook(cfg_mod.workbook_path(app, which))
    suppressed = wb.suppression_matcher(wb.read_suppression(app))

    partners = which == "partners"
    min_gap = int(config["partner_min_gap_days"] if partners else config["min_gap_days"])
    max_step = int(config["partner_max_step"] if partners else config["max_step"])

    skipped = {
        "not_business_day": 0, "suppressed": 0, "no_route": 0, "terminal_stage": 0,
        "too_soon": 0, "not_due": 0, "sequence_finished": 0, "over_cap": 0,
    }
    follow_ups, new_rows = [], []

    for row in rows:
        stage = (row.get("stage") or "new").strip() or "new"
        if stage in wb.TERMINAL_STAGES:
            skipped["terminal_stage"] += 1
            continue
        if row.get("route_type") not in ("mailbox", "form"):
            skipped["no_route"] += 1
            continue
        if suppressed(row):
            skipped["suppressed"] += 1
            continue
        step = step_for_stage(stage)
        if step == 0 or step > max_step:
            skipped["sequence_finished"] += 1
            continue
        if not is_business_day(day, config):
            skipped["not_business_day"] += 1
            continue
        last = (row.get("last_action_at") or "").strip()
        if last and (day - parse_date(last)).days < min_gap:
            skipped["too_soon"] += 1
            continue
        if step == 1:
            new_rows.append((row, step))
            continue
        due = (row.get("next_action_at") or "").strip()
        if not due or parse_date(due) > day:
            skipped["not_due"] += 1
            continue
        follow_ups.append((row, step))

    follow_ups.sort(key=lambda pair: ((pair[0].get("next_action_at") or ""),
                                      pair[0].get("org_id", "")))
    # mailbox routes first: a contact form is manual work for the founder
    new_rows.sort(key=lambda pair: (0 if pair[0]["route_type"] == "mailbox" else 1,
                                    pair[0].get("org_id", "")))

    cap_new = int(config["daily_cap_new"])
    cap_total = int(config["daily_cap_total"])
    warm = warmup_cap(config, day)
    if warm is not None:
        # a warm-up ceiling is about total volume out of one mailbox, so it
        # caps follow-ups as well as first touches
        cap_new = min(cap_new, warm)
        cap_total = min(cap_total, warm)

    selected = list(follow_ups[: max(0, cap_total)])
    room_new = min(cap_new, max(0, cap_total - len(selected)))
    skipped["over_cap"] = max(0, len(new_rows) - room_new) + max(0, len(follow_ups) - len(selected))
    selected += new_rows[:room_new]

    items = []
    for row, step in selected:
        sequence = seq_mod.sequence_for(config, row)
        moment = send_moment(day, state_of(row), config.get("send_window", "09:00-11:00"))
        items.append({
            "org_id": row["org_id"],
            "name": row["name"],
            "segment": row.get("segment", ""),
            "sequence": sequence,
            "step": step,
            "route_type": row["route_type"],
            "to": row["contact_route"] if row["route_type"] == "mailbox" else "",
            "form_url": row["contact_route"] if row["route_type"] == "form" else "",
            "stage_from": row.get("stage", "new"),
            "state": state_of(row),
            **moment,
        })

    result = {
        "app": app,
        "workbook": which,
        "date": day.isoformat(),
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "caps": {"daily_cap_new": cap_new, "daily_cap_total": cap_total,
                 "warmup_cap": warm, "min_gap_days": min_gap},
        "counts": {
            "workbook_rows": len(rows),
            "follow_ups": len([i for i in items if i["step"] > 1]),
            "new": len([i for i in items if i["step"] == 1]),
            "mailbox": len([i for i in items if i["route_type"] == "mailbox"]),
            "form": len([i for i in items if i["route_type"] == "form"]),
            "planned": len(items),
        },
        "skipped": skipped,
        "items": items,
    }
    if write:
        path = cfg_mod.plan_path(app, day.isoformat(), which)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        result["path"] = str(path)
    return result


def load_plan(app: str, date, which: str = "customers") -> dict:
    path = cfg_mod.plan_path(app, parse_date(date).isoformat(), which)
    if not path.exists():
        raise FileNotFoundError(f"no plan at {path}: run `plan --date {date}` first")
    return json.loads(path.read_text(encoding="utf-8"))
