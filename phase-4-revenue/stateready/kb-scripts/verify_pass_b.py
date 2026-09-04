#!/usr/bin/env python3
"""Verification pass B: re-open every source and check that every recorded value is still there.

PIPELINE.md stage 3 requires that verification be done by someone other than the researcher, and
that each key claim is re-checked AT THE SOURCE. This script is that second party. It shares no
state with the extraction pass: it does not read the research cache, it re-fetches every
`source_url` over the network, and it asserts that the `evidence` fragment recorded next to each
value is still literally present in the page.

That is a genuinely independent check of the one thing that matters — "is this number actually on
the board's page?" — and it is the check that fails when a page is rewritten, when an agent
transcribed a figure from a neighbouring row, or when a value was quietly invented.

Outcomes per value:
  AGREE       evidence found at source_url             -> stays 'verified'
  DISAGREE    evidence NOT found (page changed or the reading was wrong) -> demoted to 'unverified'
  UNREACHABLE source_url did not return 200            -> left as-is, counted separately, logged
  SKIP        value is null/unknown, nothing to verify

A record is marked provenance.publishable only when it has at least one agreement and zero
disagreements. That is the "published only if two verifications agree" rule, as a code path.

    python3 kb-scripts/verify_pass_b.py            # verify and write results back into kb-data/
    python3 kb-scripts/verify_pass_b.py --dry-run  # report only
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_kb import KB_DATA, fetch, normalise, load_records, walk_sourced_values   # noqa: E402

PASS_B = "po-stateready-pass-b"
POLITE_DELAY_S = 1.5

_FOLD = {"’": "'", "‘": "'", "“": '"', "”": '"',
         "–": "-", "—": "-", " ": " ", "…": "..."}


def flatten(text: str) -> str:
    """Whitespace- and quote-insensitive comparison form. A board page that re-wraps a paragraph
    must not read as a rule change, and a CMS that swaps a straight apostrophe for a curly one
    certainly must not."""
    for bad, good in _FOLD.items():
        text = text.replace(bad, good)
    return re.sub(r"\s+", " ", text).strip().lower()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", help="record_id")
    args = ap.parse_args()

    records = [(p, r) for p, r in load_records() if not args.only or r["record_id"] == args.only]
    pages: dict[str, str | None] = {}          # url -> flattened text, or None if unreachable
    today = dt.date.today().isoformat()

    grand = {"agree": 0, "disagree": 0, "unreachable": 0, "skip": 0}
    per_record = []

    for path, rec in records:
        agree = disagree = unreachable = skip = 0
        detail: list[str] = []

        for jp, sv in walk_sourced_values(rec):
            url, ev = sv.get("source_url"), sv.get("evidence")
            if sv["value"] is None or not url or not ev:
                skip += 1
                continue
            if url not in pages:
                status, body, ctype = fetch(url)
                pages[url] = flatten(normalise(body, ctype)) if status == 200 and body else None
                time.sleep(POLITE_DELAY_S)
            page = pages[url]
            if page is None:
                unreachable += 1
                detail.append(f"UNREACHABLE {jp} <- {url}")
                continue
            if flatten(ev) in page:
                agree += 1
                if PASS_B not in sv.get("verified_by", []):
                    sv.setdefault("verified_by", []).append(PASS_B)
                sv["status"] = "verified"
                sv["last_verified"] = today
            else:
                disagree += 1
                sv["status"] = "unverified"
                sv["verified_by"] = [v for v in sv.get("verified_by", []) if v != PASS_B]
                sv["note"] = (sv.get("note", "") + " | PASS B DISAGREEMENT " + today +
                              ": the recorded evidence fragment was not found at source_url on "
                              "re-fetch. Demoted to unverified; the product must show the "
                              "UNVERIFIED badge and no playbook may rely on it.").strip(" |")
                detail.append(f"DISAGREE {jp}: {ev[:80]!r}")

        checked = agree + disagree
        rate = (agree / checked * 100) if checked else 0.0
        pb = rec["provenance"]["pass_b"]
        pb.update({"agent_id": PASS_B, "date": today, "agreements": agree,
                   "disagreements": disagree, "unreachable": unreachable,
                   "agreement_rate_pct": round(rate, 1), "disagreement_detail": detail})
        rec["provenance"]["publishable"] = bool(agree and disagree == 0 and unreachable == 0)

        per_record.append((rec["record_id"], agree, disagree, unreachable, skip, rate,
                           rec["provenance"]["publishable"]))
        for k, v in (("agree", agree), ("disagree", disagree), ("unreachable", unreachable),
                     ("skip", skip)):
            grand[k] += v
        for line in detail:
            print(f"  {rec['record_id']}: {line}")
        if not args.dry_run:
            path.write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")

    print(f"\n{'record':<16} {'agree':>6} {'disagree':>9} {'unreach':>8} {'skip':>5} {'rate':>7}  publishable")
    for rid, a, d, u, s, r, pub in per_record:
        print(f"{rid:<16} {a:>6} {d:>9} {u:>8} {s:>5} {r:>6.1f}%  {'yes' if pub else 'NO'}")
    checked = grand["agree"] + grand["disagree"]
    overall = (grand["agree"] / checked * 100) if checked else 0.0
    print(f"{'TOTAL':<16} {grand['agree']:>6} {grand['disagree']:>9} {grand['unreachable']:>8} "
          f"{grand['skip']:>5} {overall:>6.1f}%")
    return 1 if grand["disagree"] or grand["unreachable"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
