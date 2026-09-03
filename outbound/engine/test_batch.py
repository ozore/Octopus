"""Batching: caps, gaps, business days, time zones and suppression."""

import os
import sys
import unittest
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import batch  # noqa: E402
from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase, prospect  # noqa: E402

TUESDAY = "2026-09-08"
SATURDAY = "2026-09-12"


class TimeTests(unittest.TestCase):
    def test_dst_window(self):
        self.assertFalse(batch.observes_dst(date(2026, 3, 7)))
        self.assertTrue(batch.observes_dst(date(2026, 3, 9)))
        self.assertTrue(batch.observes_dst(date(2026, 9, 8)))
        self.assertFalse(batch.observes_dst(date(2026, 11, 5)))

    def test_timezone_for_state(self):
        self.assertEqual(batch.timezone_for("NY", date(2026, 9, 8))[0], -4)
        self.assertEqual(batch.timezone_for("NY", date(2026, 12, 8))[0], -5)
        self.assertEqual(batch.timezone_for("CA", date(2026, 9, 8))[0], -7)
        self.assertEqual(batch.timezone_for("AZ", date(2026, 9, 8))[0], -7)
        self.assertEqual(batch.timezone_for("AZ", date(2026, 12, 8))[0], -7)
        self.assertEqual(batch.timezone_for("HI", date(2026, 9, 8))[0], -10)

    def test_unknown_state_falls_back_without_crashing(self):
        offset, label = batch.timezone_for("", date(2026, 9, 8))
        self.assertEqual(offset, -4)
        self.assertTrue(label)

    def test_send_moment_is_local_and_utc(self):
        moment = batch.send_moment(date(2026, 9, 8), "CA", "09:00-11:00")
        self.assertEqual(moment["send_at_local"], "2026-09-08 09:00")
        self.assertEqual(moment["send_at_utc"], "2026-09-08 16:00Z")

    def test_business_days(self):
        config = {"business_days_only": True, "skip_dates": ["2026-09-07"]}
        self.assertTrue(batch.is_business_day(date(2026, 9, 8), config))
        self.assertFalse(batch.is_business_day(date(2026, 9, 12), config))  # Saturday
        self.assertFalse(batch.is_business_day(date(2026, 9, 7), config))   # holiday
        self.assertEqual(batch.next_business_day(date(2026, 9, 12), config),
                         date(2026, 9, 14))


class PlanTests(EngineTestCase):
    def setUp(self):
        super().setUp()
        wb.seed_from_prospects(self.app)

    def test_plans_the_new_rows_mailbox_first(self):
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["counts"]["planned"], 3)
        self.assertEqual([i["route_type"] for i in plan["items"]],
                         ["mailbox", "mailbox", "form"])
        self.assertTrue(all(i["step"] == 1 for i in plan["items"]))

    def test_nothing_is_planned_at_the_weekend(self):
        plan = batch.plan(self.app, SATURDAY)
        self.assertEqual(plan["counts"]["planned"], 0)
        self.assertEqual(plan["skipped"]["not_business_day"], 3)

    def test_daily_cap_applies(self):
        path = cfg_mod.app_dir(self.app) / "config.json"
        import json
        config = json.loads(path.read_text())
        config["daily_cap_new"] = 1
        path.write_text(json.dumps(config))
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["counts"]["planned"], 1)
        self.assertEqual(plan["skipped"]["over_cap"], 2)

    def test_warmup_ceiling_beats_the_cap(self):
        import json
        path = cfg_mod.app_dir(self.app) / "config.json"
        config = json.loads(path.read_text())
        config.update({"mailbox_started_on": TUESDAY, "warmup_schedule": [2, 10, 20]})
        path.write_text(json.dumps(config))
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["caps"]["warmup_cap"], 2)
        self.assertEqual(plan["counts"]["planned"], 2)

    def test_min_gap_blocks_a_second_email_too_soon(self):
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        rows[0].update({"stage": "sent_1", "last_action_at": "2026-09-07",
                        "next_action_at": "2026-09-07"})
        wb.write_workbook(path, rows)
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["skipped"]["too_soon"], 1)
        self.assertNotIn(rows[0]["org_id"], [i["org_id"] for i in plan["items"]])

    def test_follow_ups_come_before_new_rows(self):
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        rows[2].update({"stage": "sent_1", "last_action_at": "2026-09-01",
                        "next_action_at": "2026-09-06"})
        wb.write_workbook(path, rows)
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["items"][0]["org_id"], rows[2]["org_id"])
        self.assertEqual(plan["items"][0]["step"], 2)
        self.assertEqual(plan["counts"]["follow_ups"], 1)

    def test_follow_up_not_yet_due_is_skipped(self):
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        rows[0].update({"stage": "sent_1", "last_action_at": "2026-09-01",
                        "next_action_at": "2026-09-20"})
        wb.write_workbook(path, rows)
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["skipped"]["not_due"], 1)

    def test_terminal_stages_are_never_planned(self):
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        for row, stage in zip(rows, ["replied", "unsubscribed", "bounced"]):
            row["stage"] = stage
        wb.write_workbook(path, rows)
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["counts"]["planned"], 0)
        self.assertEqual(plan["skipped"]["terminal_stage"], 3)

    def test_suppressed_rows_are_never_planned(self):
        wb.add_suppression(self.app, "example-construction.com", "domain", "opt-out")
        plan = batch.plan(self.app, TUESDAY)
        self.assertEqual(plan["skipped"]["suppressed"], 1)
        self.assertNotIn("Example Construction LLC", [i["name"] for i in plan["items"]])

    def test_sequence_ends_after_the_breakup(self):
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        rows[0].update({"stage": "breakup", "last_action_at": "2026-08-01",
                        "next_action_at": "2026-08-10"})
        wb.write_workbook(path, rows)
        plan = batch.plan(self.app, TUESDAY)
        self.assertNotIn(rows[0]["org_id"], [i["org_id"] for i in plan["items"]])

    def test_partner_workbook_uses_the_slower_cadence(self):
        plan = batch.plan(self.app, TUESDAY, which="partners")
        self.assertEqual(plan["caps"]["min_gap_days"], 14)
        self.assertEqual(plan["counts"]["planned"], 1)

    def test_plan_is_written_to_disk(self):
        plan = batch.plan(self.app, TUESDAY)
        self.assertTrue(cfg_mod.plan_path(self.app, TUESDAY).exists())
        self.assertEqual(batch.load_plan(self.app, TUESDAY)["counts"], plan["counts"])

    def test_load_plan_without_a_plan_raises(self):
        with self.assertRaises(FileNotFoundError):
            batch.load_plan(self.app, "2026-09-09")

    def test_items_carry_a_local_send_time(self):
        plan = batch.plan(self.app, TUESDAY)
        for item in plan["items"]:
            self.assertTrue(item["send_at_local"].startswith(TUESDAY))
            self.assertTrue(item["send_at_utc"].endswith("Z"))
            self.assertTrue(item["timezone"])


if __name__ == "__main__":
    unittest.main()
