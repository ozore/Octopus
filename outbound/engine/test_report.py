"""Reporting, including the honest finding when a list cannot fill a batch."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import approve  # noqa: E402
from outbound.engine import batch  # noqa: E402
from outbound.engine import compose  # noqa: E402
from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import inbox  # noqa: E402
from outbound.engine import report  # noqa: E402
from outbound.engine import send  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402

DAY = "2026-09-08"


class ReportTests(EngineTestCase):
    def setUp(self):
        super().setUp()
        self.set_sender_env()
        wb.seed_from_prospects(self.app)
        batch.plan(self.app, DAY)
        compose.compose(self.app, DAY)
        approve.approve(self.app, DAY)
        send.send(self.app, DAY, "dryrun")
        rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        inbox.record_reply(self.app, rows["Example Construction LLC"]["org_id"],
                           "positive", at="2026-09-10")
        inbox.record_reply(self.app, rows["Second Builders Inc"]["org_id"],
                           "bounce", at="2026-09-10")

    def test_report_is_written(self):
        result = report.report(self.app)
        self.assertTrue(cfg_mod.report_path(self.app).exists())
        self.assertEqual(result["sends"], 3)
        self.assertEqual(result["organisations"], 3)

    def test_report_carries_the_numbers(self):
        report.report(self.app)
        text = cfg_mod.report_path(self.app).read_text(encoding="utf-8")
        self.assertIn("# TestApp outbound report", text)
        self.assertIn("reply rate", text)
        self.assertIn("positive rate", text)
        self.assertIn("bounce rate", text)
        self.assertIn("unsubscribe rate", text)
        self.assertIn("### By segment", text)
        self.assertIn("### By sequence", text)
        self.assertIn("plain-intro", text)
        self.assertIn("commercial GC", text)

    def test_small_bases_are_labelled_not_dressed_up(self):
        report.report(self.app)
        text = cfg_mod.report_path(self.app).read_text(encoding="utf-8")
        self.assertIn("too small to read", text)

    def test_coverage_counts_the_dropped_routes(self):
        data = report.gather(self.app)
        cover = data["coverage"]
        self.assertEqual(cover["end_customer"], 6)
        self.assertEqual(cover["mailbox"], 2)
        self.assertEqual(cover["form"], 1)
        self.assertEqual(cover["personal_route_dropped"], 2)
        self.assertEqual(cover["no_route"], 1)

    def test_a_short_list_is_reported_as_a_finding(self):
        report.report(self.app)
        text = cfg_mod.report_path(self.app).read_text(encoding="utf-8")
        self.assertIn("Finding about the lists, not the engine", text)
        self.assertIn("below the daily cap of 20", text)

    def test_report_runs_on_an_empty_log(self):
        cfg_mod.log_path(self.app).unlink()
        report.report(self.app)
        text = cfg_mod.report_path(self.app).read_text(encoding="utf-8")
        self.assertIn("Nothing has been sent or dry-run yet.", text)

    def test_no_open_rate_is_reported_because_none_is_measured(self):
        report.report(self.app)
        text = cfg_mod.report_path(self.app).read_text(encoding="utf-8")
        self.assertNotIn("open rate: ", text)
        self.assertIn("no link tracking exist by design", text)


if __name__ == "__main__":
    unittest.main()
