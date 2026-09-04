#!/usr/bin/env python3
"""Drop mailbox records that an early version of the extractor may have altered.

Two bugs existed in the first hours of this pass and are fixed in
`enrich_lib.py`:

1. `pick_role_mailbox` returned the *squashed* local part, so a published
   `customer.service@acme.com` was recorded as `customerservice@acme.com` — an
   address nobody published. Now the address is recorded verbatim.
2. a `mailto:` href ending in `\\` or `%20` produced an address with the junk
   still attached. Now every address goes through `clean_address` and anything
   that fails a strict pattern is dropped rather than repaired.

This script removes the affected records from the resumable state so the next
`run_enrich.py` re-attempts those organisations with the fixed code. Run it
once, then re-run the driver. It is safe to run again: it only ever removes
records that still look affected.

    python3 phase-3-acquisition/prospects/scripts/enrich/recheck_mailboxes.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import enrich_lib as L  # noqa: E402

#: role local parts that are themselves two words run together, so a recorded
#: value could be either what the site published or the old bug's output.
COMPOUND_ROLE_LOCALS = {
    "contactus", "contacts", "customerservice", "customercare",
    "humanresources", "frontdesk", "newbusiness", "letstalk", "reachus",
    "helpdesk", "custserv", "accountspayable", "clientservices", "realestate",
    "information", "administration", "preconstruction", "inquiries2",
}


def suspect(rec: dict) -> str:
    address = rec.get("contact_route", "") or ""
    if "@" in address:
        if L.clean_address(address) != address.strip().lower():
            return "address did not survive the strict pattern"
        local = address.split("@")[0]
        if local in COMPOUND_ROLE_LOCALS:
            return "compound role local part: may have been squashed by the old bug"
    # a third early bug: the mailbox pass recorded a website derived from the
    # contact-page host even when no page on that host ever answered.
    if (rec.get("method") == "existing-contact-page" and rec.get("website")
            and "mailbox published" not in rec.get("notes", "")
            and "no generic mailbox published" not in rec.get("notes", "")):
        return "website recorded without a page that answered"
    return ""


def main() -> int:
    removed = 0
    for path in sorted(L.STATE_DIR.glob("*.jsonl")):
        kept, dropped = [], 0
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            why = suspect(rec)
            if why:
                dropped += 1
                print(f"  drop {rec.get('name','')!r} {rec.get('contact_route')} - {why}")
                continue
            kept.append(line)
        if dropped:
            path.write_text("\n".join(kept) + "\n", encoding="utf-8")
            removed += dropped
        print(f"{path.name}: {dropped} record(s) removed, {len(kept)} kept")
    print(f"total removed: {removed}. Re-run run_enrich.py for the affected directories.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
