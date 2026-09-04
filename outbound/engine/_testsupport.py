"""Fixtures for the engine tests.

Not part of the engine. It builds a throwaway repository shaped like the real
one - a prospects tree and an outbound tree - so no test can read or write a
real workbook, and no test depends on the phase-3 data staying still.
"""

from __future__ import annotations

import csv
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

PROSPECT_COLUMNS = [
    "app", "prospect_type", "segment", "name", "website", "location",
    "size_signal", "fit_rationale", "contact_route", "decision_maker_role",
    "source_url", "source_type", "confidence", "collected_on", "notes",
]

SEQUENCE = {
    "01-initial.md": (
        "---\n"
        "subject: A question for {{org.name}}\n"
        "delay_days: 0\n"
        "send_window: 09:00-11:00\n"
        "---\n"
        "Hello,\n\n"
        "{{fact.opening}}, which is why I am writing.\n"
        "{{#if fact.federal_awards}}Federal work means a weekly filing.{{/if}}\n\n"
        "Would fifteen minutes be useful?\n"
    ),
    "02-followup.md": (
        "---\nsubject: Following up\ndelay_days: 5\n---\n"
        "Hello,\n\nOne useful thing about {{org.segment}}.\n"
    ),
    "03-followup.md": (
        "---\nsubject: One more\ndelay_days: 12\n---\n"
        "Hello,\n\nLast useful thing for {{org.name}}.\n"
    ),
    "04-breakup.md": (
        "---\nsubject: Closing this out\ndelay_days: 21\n---\n"
        "Hello,\n\nClosing the record. No reply needed.\n"
    ),
}


def prospect(**overrides) -> dict:
    row = {column: "" for column in PROSPECT_COLUMNS}
    row.update({
        "app": "testapp",
        "prospect_type": "end-customer",
        "segment": "commercial GC",
        "name": "Example Construction LLC",
        "website": "https://example-construction.com",
        "location": "Austin, TX",
        "size_signal": "3 federal awards, $814k total since 2024",
        "fit_rationale": "Federal awards mean Davis-Bacon work.",
        "contact_route": "info@example-construction.com",
        "decision_maker_role": "owner",
        "source_url": "https://api.usaspending.gov/",
        "source_type": "api",
        "confidence": "verified",
        "collected_on": "2026-09-03",
        "notes": "USASpending award data; commodity codes 238140 - Masonry Contractors;",
    })
    row.update(overrides)
    return row


DEFAULT_PROSPECTS = [
    prospect(),
    prospect(name="Second Builders Inc", website="https://secondbuilders.com",
             contact_route="contact@secondbuilders.com", location="Albany, NY",
             size_signal="1846 weekly certified payrolls filed on NY public work since 2024"),
    prospect(name="Form Only Contracting", website="https://formonly.com",
             contact_route="https://formonly.com/contact", location="Denver, CO",
             size_signal=""),
    prospect(name="Personal Route Co", website="https://personalroute.com",
             contact_route="john.smith@personalroute.com", location="Boise, ID"),
    prospect(name="Freemail Co", website="https://freemailco.com",
             contact_route="freemailco@gmail.com", location="Reno, NV"),
    prospect(name="No Route Co", website="https://noroute.com", contact_route="",
             location="Mobile, AL"),
    prospect(prospect_type="partner", name="Helpful CPA LLP",
             website="https://helpfulcpa.com", contact_route="partners@helpfulcpa.com",
             segment="construction CPA", location="Chicago, IL", size_signal=""),
    prospect(prospect_type="excluded", name="Rival Software",
             website="https://rivalsoftware.com", contact_route="",
             segment="incumbent", size_signal=""),
    prospect(prospect_type="channel", name="Some Conference",
             website="https://someconference.com", contact_route="", size_signal=""),
]


class EngineTestCase(unittest.TestCase):
    """Base class: a private repo-shaped sandbox per test, torn down after."""

    app = "testapp"
    prospect_dirs = ("testapp",)
    prospect_rows = None
    config_overrides: dict = {}

    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="outbound-test-"))
        self.addCleanup(shutil.rmtree, self.root, True)
        self.outbound = self.root / "outbound"
        self.prospects = self.root / "prospects"
        rows = self.prospect_rows if self.prospect_rows is not None else DEFAULT_PROSPECTS
        for directory in self.prospect_dirs:
            path = self.prospects / directory
            path.mkdir(parents=True, exist_ok=True)
            with open(path / "prospects.csv", "w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=PROSPECT_COLUMNS,
                                        quoting=csv.QUOTE_ALL)
                writer.writeheader()
                writer.writerows(rows)
        app_dir = self.outbound / self.app
        (app_dir / "sequences" / "plain-intro").mkdir(parents=True, exist_ok=True)
        for filename, text in SEQUENCE.items():
            (app_dir / "sequences" / "plain-intro" / filename).write_text(text, encoding="utf-8")
        config = {
            "display_name": "TestApp",
            "prospect_dirs": list(self.prospect_dirs),
            "daily_cap_new": 20,
            "daily_cap_total": 60,
            "min_gap_days": 4,
            "default_sequence": "plain-intro",
        }
        config.update(self.config_overrides)
        (app_dir / "config.json").write_text(json.dumps(config), encoding="utf-8")

        self._env = dict(os.environ)
        self.addCleanup(self._restore_env)
        os.environ["OUTBOUND_ROOT"] = str(self.outbound)
        os.environ["OUTBOUND_PROSPECTS_ROOT"] = str(self.prospects)
        for name in ("OUTBOUND_SEND_ENABLED", "RESEND_API_KEY", "ANTHROPIC_API_KEY"):
            os.environ.pop(name, None)

    def _restore_env(self):
        os.environ.clear()
        os.environ.update(self._env)

    def set_sender_env(self):
        """Give the app the values the founder would supply, so nothing blocks."""
        os.environ["OUTBOUND_FROM_NAME"] = "Test Founder"
        os.environ["OUTBOUND_FROM_ADDRESS"] = "founder@example.test"
        os.environ["OUTBOUND_POSTAL_ADDRESS"] = "1 Test Street, Austin, TX 78701"
        os.environ["OUTBOUND_UNSUBSCRIBE_URL"] = "https://example.test/unsubscribe"
