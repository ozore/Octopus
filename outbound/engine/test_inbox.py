"""Replies in: stage changes, suppression, bulk import."""

import csv
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import inbox  # noqa: E402
from outbound.engine import send as send_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402


class InboxTests(EngineTestCase):
    def setUp(self):
        super().setUp()
        wb.seed_from_prospects(self.app)
        self.rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}

    def stage(self, name):
        return {r["name"]: r for r in
                wb.read_workbook(cfg_mod.workbook_path(self.app))}[name]["stage"]

    def test_replied_stops_the_sequence(self):
        org_id = self.rows["Example Construction LLC"]["org_id"]
        result = inbox.record_reply(self.app, org_id, "replied", at="2026-09-10")
        self.assertEqual(result["stage_to"], "replied")
        self.assertFalse(result["suppressed"])
        self.assertEqual(self.stage("Example Construction LLC"), "replied")
        row = {r["org_id"]: r for r in
               wb.read_workbook(cfg_mod.workbook_path(self.app))}[org_id]
        self.assertEqual(row["next_action_at"], "")
        self.assertEqual(row["last_action_at"], "2026-09-10")

    def test_stop_unsubscribes_and_suppresses_permanently(self):
        org_id = self.rows["Example Construction LLC"]["org_id"]
        result = inbox.record_reply(self.app, org_id, "stop", at="2026-09-10")
        self.assertEqual(result["stage_to"], "unsubscribed")
        self.assertTrue(result["suppressed"])
        patterns = {r["pattern"] for r in wb.read_suppression(self.app)}
        self.assertIn("example-construction.com", patterns)

    def test_bounce_suppresses_the_address(self):
        org_id = self.rows["Second Builders Inc"]["org_id"]
        inbox.record_reply(self.app, org_id, "bounce", at="2026-09-10")
        self.assertEqual(self.stage("Second Builders Inc"), "bounced")
        rows = {(r["kind"], r["pattern"]) for r in wb.read_suppression(self.app)}
        self.assertIn(("email", "contact@secondbuilders.com"), rows)

    def test_a_suppressed_organisation_is_never_planned_again(self):
        from outbound.engine import batch
        org_id = self.rows["Example Construction LLC"]["org_id"]
        inbox.record_reply(self.app, org_id, "stop", at="2026-09-07")
        plan = batch.plan(self.app, "2026-09-08")
        self.assertNotIn(org_id, [i["org_id"] for i in plan["items"]])

    def test_every_event_is_logged(self):
        org_id = self.rows["Example Construction LLC"]["org_id"]
        inbox.record_reply(self.app, org_id, "replied", note="asked for pricing")
        log = send_mod.read_log(self.app)
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["adapter"], "inbox")
        self.assertEqual(log[0]["status"], "replied")
        self.assertEqual(log[0]["notes"], "asked for pricing")

    def test_unknown_kind_and_unknown_org_are_refused(self):
        with self.assertRaises(inbox.InboxError):
            inbox.record_reply(self.app, self.rows["Second Builders Inc"]["org_id"], "maybe")
        with self.assertRaises(inbox.InboxError):
            inbox.record_reply(self.app, "no-such-org", "replied")

    def test_bulk_import_from_a_gmail_routine(self):
        path = self.root / "replies.csv"
        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=["org_id", "kind", "at", "note"])
            writer.writeheader()
            writer.writerows([
                {"org_id": self.rows["Example Construction LLC"]["org_id"],
                 "kind": "positive", "at": "2026-09-11", "note": "wants a call"},
                {"org_id": self.rows["Second Builders Inc"]["org_id"],
                 "kind": "stop", "at": "2026-09-11", "note": ""},
                {"org_id": "unknown-org", "kind": "replied", "at": "", "note": ""},
            ])
        result = inbox.import_csv(self.app, path)
        self.assertEqual(result["applied"], 2)
        self.assertEqual(len(result["failed"]), 1)
        self.assertEqual(self.stage("Example Construction LLC"), "replied")
        self.assertEqual(self.stage("Second Builders Inc"), "unsubscribed")

    def test_converted_is_recorded_as_its_own_stage(self):
        org_id = self.rows["Example Construction LLC"]["org_id"]
        inbox.record_reply(self.app, org_id, "converted", at="2026-09-20")
        self.assertEqual(self.stage("Example Construction LLC"), "converted")


if __name__ == "__main__":
    unittest.main()
