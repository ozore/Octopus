"""Compose: plan -> reviewable drafts.

One JSON file per draft under `outbound/<app>/drafts/<date>/`, plus a
`preview.html` listing the whole batch for the founder to read in one pass.

The CAN-SPAM block is appended here, not written in the sequence files, so no
sequence can ship without it. Where the founder has not yet supplied a value
(postal address, unsubscribe URL, from address) the draft carries an explicit
placeholder token and is marked blocking: a fabricated address is a compliance
failure, a visible placeholder is only a review failure.
"""

from __future__ import annotations

import html as html_mod
import json
import re
import textwrap
from datetime import datetime
from pathlib import Path

from outbound.engine import batch as batch_mod
from outbound.engine import config as cfg_mod
from outbound.engine import personalise
from outbound.engine import sequences as seq_mod
from outbound.engine import workbook as wb

FOOTER_TEXT = """--
{signature}
{company} - {postal_address}

You are getting this one-off business email at an address published on your
organisation's own website. Reply STOP and I will delete your details and not
contact you again, through this or any other channel.
Unsubscribe: {unsubscribe_url}"""

FOOTER_FORM = """--
{signature}
{company} - {postal_address}
Reply to this message, or write to {from_address}, and I will remove your
organisation from my list permanently.
Unsubscribe: {unsubscribe_url}"""

#: Artefacts that mean a variable rendered empty or a sentence lost its object.
BLANK_ARTEFACTS = (" ,", " .", "()", "  ", " your .", "your ,", "None", "  -")


class ComposeError(RuntimeError):
    pass


def build_context(config: dict, row: dict, polish: bool = False) -> dict:
    facts = wb.facts_of(row)
    rendered = personalise.phrases(facts)
    if polish and rendered.get("opening"):
        rendered["opening"] = personalise.llm_polish(rendered["opening"], enabled=True)
    from_name = cfg_mod.env_value(config, "from_name")
    from_address = cfg_mod.env_value(config, "from_address")
    return {
        "org": {
            "name": row.get("name", ""),
            "website": row.get("website", ""),
            "segment": row.get("segment", ""),
            "org_id": row.get("org_id", ""),
        },
        "fact": rendered,
        "raw": facts,
        "sender": {
            "name": from_name,
            "email": from_address,
            "app": config["display_name"],
            "company": config["company"],
            "signature": config["signature"],
        },
        "app": config["display_name"],
        "company": config["company"],
        "signature": config["signature"],
        "postal_address": cfg_mod.env_value(config, "postal_address"),
        "unsubscribe_url": cfg_mod.env_value(config, "unsubscribe_url"),
    }


def footer_for(config: dict, context: dict, route_type: str) -> str:
    template = FOOTER_TEXT if route_type == "mailbox" else FOOTER_FORM
    return template.format(
        signature=config["signature"],
        company=config["company"],
        postal_address=context["postal_address"],
        unsubscribe_url=context["unsubscribe_url"],
        from_address=context["sender"]["email"],
    )


#: Plain-text emails are wrapped here so a rendered variable cannot produce one
#: 300-character line next to hand-wrapped copy.
WRAP_WIDTH = 72


def paragraphs_of(text: str) -> list:
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def wrap_text(text: str, width: int = WRAP_WIDTH) -> str:
    out = []
    for block in paragraphs_of(text):
        joined = " ".join(line.strip() for line in block.split("\n"))
        out.append(textwrap.fill(joined, width=width, break_long_words=False,
                                 break_on_hyphens=False))
    return "\n\n".join(out)


def to_html(body: str, footer: str) -> str:
    """Minimal single-column HTML. No images, no tracking pixel, no remote CSS."""
    def paragraphs(text, reflow):
        blocks = []
        for block in paragraphs_of(text):
            if reflow:
                block = " ".join(line.strip() for line in block.split("\n"))
            blocks.append("<p style=\"margin:0 0 14px 0;\">{}</p>".format(
                html_mod.escape(block).replace("\n", "<br>")))
        return "\n".join(blocks)

    return (
        '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        "</head>\n"
        '<body style="margin:0;padding:0;background:#ffffff;">\n'
        '<div style="max-width:600px;margin:0 auto;padding:20px;'
        "font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;"
        'font-size:15px;line-height:1.55;color:#1a1a1a;">\n'
        f"{paragraphs(body, True)}\n"
        '<hr style="border:none;border-top:1px solid #dddddd;margin:22px 0 12px 0;">\n'
        f'<div style="font-size:12px;line-height:1.5;color:#666666;">'
        f'{paragraphs(footer, False)}</div>\n'
        "</div>\n</body>\n</html>\n"
    )


def check_draft(draft: dict, config: dict) -> dict:
    """Blocking problems stop the send; warnings only need a human eye."""
    blocking, warnings = [], []
    text = draft.get("text", "")
    subject = draft.get("subject", "")
    for field, value in (("subject", subject), ("text", text), ("html", draft.get("html", ""))):
        if "{{" in value or "}}" in value:
            blocking.append(f"unrendered_template_in_{field}")
    if not subject.strip():
        blocking.append("empty_subject")
    if not text.strip():
        blocking.append("empty_body")
    if draft.get("route_type") == "mailbox" and not draft.get("to", "").strip():
        blocking.append("no_recipient")
    if draft.get("route_type") == "form" and not draft.get("form_url", "").strip():
        blocking.append("no_form_url")
    if cfg_mod.is_placeholder(config, draft.get("postal_address", "")):
        blocking.append("postal_address_missing")
    if cfg_mod.is_placeholder(config, draft.get("unsubscribe_url", "")):
        blocking.append("unsubscribe_url_missing")
    if cfg_mod.is_placeholder(config, draft.get("from_address", "")):
        blocking.append("from_address_missing")
    if config["company"] not in text:
        blocking.append("sender_legal_name_missing")
    if "STOP" not in text and "unsubscribe" not in text.lower():
        blocking.append("opt_out_missing")
    if re.match(r"\s*(re|fwd)\s*:", subject, re.I):
        blocking.append("deceptive_subject_thread")
    if subject.isupper():
        warnings.append("shouting_subject")
    body_only = text.split("\n--\n")[0]
    for artefact in BLANK_ARTEFACTS:
        if artefact in body_only:
            warnings.append(f"blank_artefact:{artefact.strip() or 'double-space'}")
    if len(subject) > 78:
        warnings.append("long_subject")
    if draft.get("route_type") == "form":
        from urllib.parse import urlsplit
        path = urlsplit(draft.get("form_url", "")).path.strip("/")
        if not path:
            warnings.append("form_url_is_a_homepage")
    return {"blocking": sorted(set(blocking)), "warnings": sorted(set(warnings))}


def compose_one(config: dict, row: dict, item: dict, sequence: seq_mod.Sequence,
                polish: bool = False) -> dict:
    step = sequence.steps[item["step"] - 1]
    context = build_context(config, row, polish=polish)
    subject, raw_body = seq_mod.render_step(step, context)
    body = wrap_text(raw_body)
    footer = footer_for(config, context, item["route_type"])
    text = f"{body}\n\n{footer}\n"
    draft = {
        "app": config["app"],
        "date": item.get("date", ""),
        "org_id": item["org_id"],
        "name": row.get("name", ""),
        "segment": row.get("segment", ""),
        "sequence": sequence.name,
        "step": item["step"],
        "step_file": step.filename,
        "route_type": item["route_type"],
        "to": item.get("to", ""),
        "form_url": item.get("form_url", ""),
        "from_name": context["sender"]["name"],
        "from_address": context["sender"]["email"],
        "reply_to": cfg_mod.env_value(config, "reply_to", context["sender"]["email"]),
        "subject": subject,
        "text": text,
        "html": to_html(body, footer),
        "postal_address": context["postal_address"],
        "unsubscribe_url": context["unsubscribe_url"],
        "send_at_local": item.get("send_at_local", ""),
        "send_at_utc": item.get("send_at_utc", ""),
        "timezone": item.get("timezone", ""),
        "personalisation": context["fact"],
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    draft["checks"] = check_draft(draft, config)
    return draft


def compose(app: str, date, which: str = "customers", config: dict | None = None,
            polish: bool = False) -> dict:
    """Render every planned email into a draft file plus a batch preview."""
    config = config or cfg_mod.load_config(app)
    plan = batch_mod.load_plan(app, date, which)
    day = plan["date"]
    rows = wb.index_by_id(wb.read_workbook(cfg_mod.workbook_path(app, which)))
    out_dir = cfg_mod.drafts_dir(app, day)
    out_dir.mkdir(parents=True, exist_ok=True)

    cache: dict = {}
    drafts, failures = [], []
    for item in plan["items"]:
        row = rows.get(item["org_id"])
        if row is None:
            failures.append({"org_id": item["org_id"], "error": "not in workbook"})
            continue
        item = dict(item, date=day)
        try:
            if item["sequence"] not in cache:
                cache[item["sequence"]] = seq_mod.load_sequence(app, item["sequence"], config)
            draft = compose_one(config, row, item, cache[item["sequence"]], polish=polish)
        except seq_mod.SequenceError as error:
            failures.append({"org_id": item["org_id"], "name": row.get("name", ""),
                             "error": str(error)})
            continue
        path = out_dir / f"{item['org_id']}-{item['step']}.json"
        path.write_text(json.dumps(draft, indent=2) + "\n", encoding="utf-8")
        drafts.append(draft)

    manifest = {
        "app": app,
        "workbook": which,
        "date": day,
        "counts": {
            "drafts": len(drafts),
            "mailbox": len([d for d in drafts if d["route_type"] == "mailbox"]),
            "form": len([d for d in drafts if d["route_type"] == "form"]),
            "blocking": len([d for d in drafts if d["checks"]["blocking"]]),
            "warnings": len([d for d in drafts if d["checks"]["warnings"]]),
            "failed": len(failures),
        },
        "blocking_reasons": sorted({r for d in drafts for r in d["checks"]["blocking"]}),
        "failures": failures,
        "drafts": [
            {"org_id": d["org_id"], "name": d["name"], "step": d["step"],
             "route_type": d["route_type"], "to": d["to"] or d["form_url"],
             "subject": d["subject"], "blocking": d["checks"]["blocking"]}
            for d in drafts
        ],
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n",
                                           encoding="utf-8")
    (out_dir / "preview.html").write_text(preview_html(config, day, drafts, manifest),
                                          encoding="utf-8")
    manifest["path"] = str(out_dir)
    return manifest


def preview_html(config: dict, day: str, drafts: list, manifest: dict) -> str:
    """One page the founder reads top to bottom before approving."""
    esc = html_mod.escape
    parts = [
        '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        f"<title>{esc(config['display_name'])} outbound {esc(day)}</title>",
        "<style>",
        "body{margin:0;background:#f6f6f4;color:#1a1a1a;"
        "font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px}",
        ".wrap{max-width:820px;margin:0 auto;padding:24px}",
        ".card{background:#fff;border:1px solid #e2e2dd;border-radius:8px;"
        "padding:16px 18px;margin:0 0 16px}",
        ".meta{font-size:12px;color:#666;margin:0 0 8px}",
        ".subj{font-weight:600;margin:0 0 10px}",
        "pre{white-space:pre-wrap;word-wrap:break-word;font:inherit;margin:0}",
        ".flag{display:inline-block;background:#fdecea;color:#8a1c11;border-radius:4px;"
        "padding:1px 6px;font-size:12px;margin-right:6px}",
        ".warn{background:#fff5e0;color:#8a5a00}",
        "</style></head><body><div class=\"wrap\">",
        f"<h1>{esc(config['display_name'])} - drafts for {esc(day)}</h1>",
        "<p class=\"meta\">{drafts} drafts ({mailbox} email, {form} contact form), "
        "{blocking} blocked, {warnings} with warnings. Nothing is sent until you run "
        "<code>approve</code> and then <code>send</code>.</p>".format(**manifest["counts"]),
    ]
    if manifest["blocking_reasons"]:
        parts.append("<p class=\"meta\">Blocking reasons in this batch: "
                     + esc(", ".join(manifest["blocking_reasons"])) + "</p>")
    for draft in drafts:
        flags = "".join(f'<span class="flag">{esc(f)}</span>'
                        for f in draft["checks"]["blocking"])
        flags += "".join(f'<span class="flag warn">{esc(w)}</span>'
                         for w in draft["checks"]["warnings"])
        route = draft["to"] or draft["form_url"]
        kind = "email" if draft["route_type"] == "mailbox" else "contact form"
        parts.append(
            '<div class="card">'
            f'<p class="meta">{esc(draft["org_id"])} - step {draft["step"]} - '
            f'{esc(draft["sequence"])} - {kind} - {esc(route)} - '
            f'{esc(draft["send_at_local"])} {esc(draft["timezone"])}</p>'
            f'{flags}'
            f'<p class="subj">{esc(draft["subject"])}</p>'
            f"<pre>{esc(draft['text'])}</pre></div>"
        )
    parts.append("</div></body></html>\n")
    return "\n".join(parts)


def load_drafts(app: str, date, only: list | None = None) -> list:
    day = batch_mod.parse_date(date).isoformat()
    out_dir = cfg_mod.drafts_dir(app, day)
    if not out_dir.is_dir():
        raise ComposeError(f"no drafts at {out_dir}: run `compose --date {day}` first")
    drafts = []
    for path in sorted(out_dir.glob("*.json")):
        if path.name == "manifest.json":
            continue
        draft = json.loads(path.read_text(encoding="utf-8"))
        if only and draft["org_id"] not in only:
            continue
        drafts.append(draft)
    return drafts
