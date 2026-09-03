"""One command per step of the day.

    python3 -m outbound.engine.cli <app> seed|plan|compose|approve|send|reply|report

Every subcommand takes --date (default: today) and --partners (work on the
partner workbook instead of the customer one). Run from the repository root.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date as Date

from outbound.engine import approve as approve_mod
from outbound.engine import batch as batch_mod
from outbound.engine import compose as compose_mod
from outbound.engine import config as cfg_mod
from outbound.engine import inbox as inbox_mod
from outbound.engine import report as report_mod
from outbound.engine import send as send_mod
from outbound.engine import sequences as seq_mod
from outbound.engine import workbook as wb

#: Everything the engine raises on purpose. These are told to the operator as
#: one clear line, not as a traceback.
EXPECTED_ERRORS = (
    wb.SeedError, seq_mod.SequenceError, compose_mod.ComposeError,
    approve_mod.ApprovalError, send_mod.SendError, inbox_mod.InboxError,
    FileNotFoundError, ValueError,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python3 -m outbound.engine.cli",
        description="The founder's own cold-email engine. Drafts first, always.")
    parser.add_argument("app", help="app slug, e.g. wagelens")
    parser.add_argument("command",
                        choices=["seed", "plan", "compose", "approve", "send",
                                 "reply", "report"])
    parser.add_argument("--date", default="", help="YYYY-MM-DD (default: today)")
    parser.add_argument("--partners", action="store_true",
                        help="operate on workbook-partners.csv")
    parser.add_argument("--polish", action="store_true",
                        help="compose: run the optional LLM tidy-up (needs ANTHROPIC_API_KEY)")
    parser.add_argument("--approve", dest="approve_date", default="",
                        help="approve: the batch date (same as --date)")
    parser.add_argument("--only", default="",
                        help="approve: comma-separated org_ids to approve")
    parser.add_argument("--reject", default="",
                        help="approve: comma-separated org_ids to reject")
    parser.add_argument("--reason", default="", help="approve: why they were rejected")
    parser.add_argument("--adapter", default="dryrun",
                        choices=list(send_mod.ADAPTERS),
                        help="send: dryrun (default), gmail_drafts, resend")
    parser.add_argument("--org", default="", help="reply: the org_id")
    parser.add_argument("--kind", default="", help="reply: " + "|".join(inbox_mod.KINDS))
    parser.add_argument("--note", default="", help="reply: a short free-text note")
    parser.add_argument("--from-csv", dest="from_csv", default="",
                        help="reply: bulk import org_id,kind[,at,note]")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    return parser


def _date(args) -> str:
    return (args.date or args.approve_date or Date.today().isoformat()).strip()


def _emit(args, payload: dict, lines: list) -> int:
    if args.json:
        print(json.dumps(payload, indent=2, default=str))
    else:
        for line in lines:
            print(line)
    return 0


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return _run(args)
    except EXPECTED_ERRORS as error:
        print(f"{args.command}: {error}", file=sys.stderr)
        return 1


def _run(args) -> int:
    app = args.app
    which = "partners" if args.partners else "customers"
    config = cfg_mod.load_config(app)
    if not cfg_mod.app_dir(app).exists():
        print(f"no app directory at {cfg_mod.app_dir(app)}", file=sys.stderr)
        return 2
    day = _date(args)

    if args.command == "seed":
        counts = wb.seed_from_prospects(app, config)
        return _emit(args, counts, [
            f"seeded {app}",
            f"  customers : {counts['customers_total']:,} rows "
            f"({counts['customers_mailbox']:,} mailbox, {counts['customers_form']:,} contact page)",
            f"  partners  : {counts['partners_total']:,} rows "
            f"({counts['partners_mailbox']:,} mailbox, {counts['partners_form']:,} contact page)",
            f"  dropped   : {counts['customers_dropped_no_route']:,} without a route, "
            f"{counts['customers_dropped_personal']:,} whose route was not a generic mailbox",
            f"  suppression: {counts['suppression_rows']:,} patterns",
        ])

    if args.command == "plan":
        plan = batch_mod.plan(app, day, which, config)
        counts = plan["counts"]
        return _emit(args, plan, [
            f"planned {counts['planned']} sends for {app} on {day} ({which})",
            f"  {counts['new']} new, {counts['follow_ups']} follow-ups; "
            f"{counts['mailbox']} email, {counts['form']} contact form",
            f"  skipped: " + ", ".join(f"{k}={v}" for k, v in plan["skipped"].items() if v)
            or "  skipped: none",
            f"  -> {plan.get('path', '')}",
        ])

    if args.command == "compose":
        manifest = compose_mod.compose(app, day, which, config, polish=args.polish)
        counts = manifest["counts"]
        lines = [
            f"composed {counts['drafts']} drafts for {app} on {day}",
            f"  {counts['mailbox']} email, {counts['form']} contact form, "
            f"{counts['blocking']} blocked, {counts['failed']} failed to render",
            f"  -> {manifest['path']}/preview.html",
        ]
        if manifest["blocking_reasons"]:
            lines.append("  blocking: " + ", ".join(manifest["blocking_reasons"]))
        for failure in manifest["failures"][:5]:
            lines.append(f"  FAILED {failure['org_id']}: {failure['error']}")
        return _emit(args, manifest, lines)

    if args.command == "approve":
        if args.reject:
            record = approve_mod.reject(app, day, [o.strip() for o in args.reject.split(",") if o.strip()],
                                        args.reason or "rejected by the founder")
            return _emit(args, record, [
                f"rejected {len(record['rejected'])} draft(s) for {day}",
                f"  approved now: {len(record['approved'])}",
            ])
        only = [o.strip() for o in args.only.split(",") if o.strip()] or None
        record = approve_mod.approve(app, day, only)
        lines = [f"approved {len(record['approved'])} draft(s) for {day}"]
        if record.get("blocked"):
            lines.append(f"  {len(record['blocked'])} could not be approved (blocking checks):")
            for org_id, reasons in list(record["blocked"].items())[:10]:
                lines.append(f"    {org_id}: {', '.join(reasons)}")
        return _emit(args, record, lines)

    if args.command == "send":
        result = send_mod.send(app, day, args.adapter, which, config)
        lines = [
            f"{args.adapter}: {result['counts']['attempted']} handled, "
            f"{result['counts']['advanced']} rows advanced",
            "  " + ", ".join(f"{k}={v}" for k, v in result["counts"]["by_status"].items()),
        ]
        if result["queue"]:
            lines.append(f"  queue -> {result['queue']}")
        return _emit(args, result, lines)

    if args.command == "reply":
        if args.from_csv:
            result = inbox_mod.import_csv(app, args.from_csv, which, config)
            lines = [f"imported {result['applied']} reply event(s)"]
            for failure in result["failed"][:10]:
                lines.append(f"  FAILED {failure['row'].get('org_id', '?')}: {failure['error']}")
            return _emit(args, result, lines)
        if not args.org or not args.kind:
            print("reply needs --org and --kind, or --from-csv", file=sys.stderr)
            return 2
        result = inbox_mod.record_reply(app, args.org, args.kind, at=args.date,
                                        note=args.note, which=which, config=config)
        return _emit(args, result, [
            f"{result['org_id']}: {result['stage_from']} -> {result['stage_to']}"
            + (" (suppressed)" if result["suppressed"] else "")])

    if args.command == "report":
        result = report_mod.report(app, config)
        return _emit(args, result, [
            f"wrote {result['path']}",
            f"  {result['sends']} emails to {result['organisations']} organisations; "
            f"{result['usable_routes']:,} usable routes in the source lists",
        ])
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
