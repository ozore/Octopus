#!/usr/bin/env python3
"""Confirm website candidates that came from the `WebSearch` tool.

`WebSearch` cannot be called from a script — it is an agent tool — so the loop
is: the agent searches `"<exact organisation name>" <state>`, keeps only results
whose domain carries a distinctive token of the name, and appends them to

    state/<dir>-websearch.tsv        name<TAB>location<TAB>candidate url

This script then applies exactly the same confirmation as every other method:
fetch the page, require the body to name the organisation, reject parked pages
and directories, then look for a route. Nothing is trusted because a search
engine (or a search summary) said it.

    python3 phase-3-acquisition/prospects/scripts/enrich/apply_websearch.py --dir wagelens
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import enrich_lib as L  # noqa: E402
import run_enrich as R  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    args = ap.parse_args()

    path = L.STATE_DIR / f"{args.dir}-websearch.tsv"
    if not path.exists():
        print(f"nothing to do: {path} does not exist")
        return 0
    L.load_blocked()
    state = L.State(f"{args.dir}-websearch")
    attempted = confirmed = mailboxes = forms = 0

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("\t")]
        if len(parts) < 3:
            continue
        name, location, url = parts[0], parts[1], parts[2]
        key = L.org_key(name, location)
        if state.has(key):
            continue
        attempted += 1
        rec = {"key": key, "name": name, "location": location, "website": "",
               "contact_route": "", "route_type": "none", "evidence_url": "",
               "checked_on": R.TODAY, "method": "websearch", "notes": ""}
        site, evidence, why, fail, body = R.confirm_site(
            name, R.normalise_url(url), location)
        if not site:
            rec["notes"] = f"websearch candidate {url} rejected: {fail}"
        else:
            confirmed += 1
            found = R.find_route_on_site(name, site, body, evidence)
            rec.update(website=site, contact_route=found["route"],
                       route_type=found["route_type"],
                       evidence_url=found["evidence"] or evidence)
            rec["notes"] = "; ".join([f"site confirmed: {why}"] + found["notes"])
            mailboxes += 1 if found["route_type"] == "mailbox" else 0
            forms += 1 if found["route_type"] == "form" else 0
        state.add(rec)

    L.save_blocked()
    print(f"{args.dir}/websearch: {attempted} candidates, {confirmed} sites confirmed, "
          f"{mailboxes} mailboxes, {forms} contact pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
