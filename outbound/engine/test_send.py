"""Approval gate and the three send adapters. Nothing here sends anything."""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import approve  # noqa: E402
from outbound.engine import batch  # noqa: E402
from outbound.engine import compose  # noqa: E402
from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import send  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402

DAY = "2026-09-08"


class SendTestCase(EngineTestCase):
    def setUp(self):
        super().setUp()
        self.set_sender_env()
        wb.seed_from_prospects(self.app)
        batch.plan(self.app, DAY)
        compose.compose(self.app, DAY)

    def org_ids(self):
        return [d["org_id"] for d in compose.load_drafts(self.app, DAY)]


class ApprovalTests(SendTestCase):
    def test_send_refuses_without_approval(self):
        with self.assertRaises(send.SendError) as caught:
            send.send(self.app, DAY)
        self.assertIn("nothing approved", str(caught.exception))

    def test_approve_a_whole_batch(self):
        record = approve.approve(self.app, DAY)
        self.assertEqual(len(record["approved"]), 3)
        self.assertEqual(record["mode"], "batch")

    def test_approve_only_some(self):
        chosen = self.org_ids()[:1]
        record = approve.approve(self.app, DAY, only=chosen)
        self.assertEqual(record["approved"], chosen)
        self.assertEqual(record["mode"], "partial")

    def test_approving_an_unknown_org_raises(self):
        with self.assertRaises(approve.ApprovalError):
            approve.approve(self.app, DAY, only=["not-a-real-org"])

    def test_reject_removes_from_the_approved_set(self):
        approve.approve(self.app, DAY)
        target = self.org_ids()[0]
        record = approve.reject(self.app, DAY, [target], "wrong segment")
        self.assertNotIn(target, record["approved"])
        self.assertEqual(record["rejected"][target], "wrong segment")

    def test_a_blocked_draft_cannot_be_approved(self):
        os.environ.pop("OUTBOUND_POSTAL_ADDRESS")
        compose.compose(self.app, DAY)
        record = approve.approve(self.app, DAY)
        self.assertEqual(record["approved"], [])
        self.assertEqual(len(record["blocked"]), 3)


class DryRunTests(SendTestCase):
    def test_dryrun_logs_and_advances(self):
        approve.approve(self.app, DAY)
        result = send.send(self.app, DAY, "dryrun")
        self.assertEqual(result["counts"]["attempted"], 3)
        self.assertEqual(result["counts"]["by_status"], {"dryrun": 3})
        log = send.read_log(self.app)
        self.assertEqual(len(log), 3)
        self.assertEqual({r["adapter"] for r in log}, {"dryrun"})
        self.assertEqual({r["status"] for r in log}, {"dryrun"})
        self.assertTrue(all(r["subject"] for r in log))
        rows = wb.read_workbook(cfg_mod.workbook_path(self.app))
        self.assertEqual({r["stage"] for r in rows}, {"sent_1"})
        self.assertEqual({r["last_action_at"] for r in rows}, {DAY})

    def test_next_action_is_the_next_step_delay_on_a_business_day(self):
        approve.approve(self.app, DAY)
        send.send(self.app, DAY, "dryrun")
        for row in wb.read_workbook(cfg_mod.workbook_path(self.app)):
            # step 2 has delay_days 5: 2026-09-08 + 5 = Sunday 13th -> Monday 14th
            self.assertEqual(row["next_action_at"], "2026-09-14")

    def test_only_approved_rows_are_sent(self):
        chosen = self.org_ids()[:1]
        approve.approve(self.app, DAY, only=chosen)
        send.send(self.app, DAY, "dryrun")
        stages = {r["org_id"]: r["stage"] for r in
                  wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(stages[chosen[0]], "sent_1")
        for org_id, stage in stages.items():
            if org_id != chosen[0]:
                self.assertEqual(stage, "new")

    def test_log_is_appended_not_overwritten(self):
        approve.approve(self.app, DAY)
        send.send(self.app, DAY, "dryrun")
        batch.plan(self.app, "2026-09-15")
        compose.compose(self.app, "2026-09-15")
        approve.approve(self.app, "2026-09-15")
        send.send(self.app, "2026-09-15", "dryrun")
        self.assertEqual(len(send.read_log(self.app)), 6)


class GmailQueueTests(SendTestCase):
    def test_queue_files_carry_to_subject_and_body(self):
        approve.approve(self.app, DAY)
        result = send.send(self.app, DAY, "gmail_drafts")
        queue = cfg_mod.queue_dir(self.app, DAY)
        self.assertTrue((queue / "INSTRUCTIONS.md").exists())
        emails = [p for p in queue.glob("*.json")]
        forms = [p for p in (queue / "forms").glob("*.json")]
        self.assertEqual(len(emails), 2)
        self.assertEqual(len(forms), 1)
        payload = json.loads(emails[0].read_text())
        self.assertEqual(set(("to", "subject", "body")) - set(payload), set())
        self.assertTrue(payload["to"])
        self.assertIn("TheVillage", payload["body"])
        self.assertEqual(result["counts"]["by_status"], {"queued": 3})

    def test_form_payloads_carry_the_url_not_a_recipient(self):
        approve.approve(self.app, DAY)
        send.send(self.app, DAY, "gmail_drafts")
        form = json.loads(next((cfg_mod.queue_dir(self.app, DAY) / "forms")
                               .glob("*.json")).read_text())
        self.assertEqual(form["to"], "")
        self.assertTrue(form["form_url"].startswith("https://"))


class ResendGuardTests(SendTestCase):
    def test_refuses_without_the_enable_flag(self):
        approve.approve(self.app, DAY)
        os.environ["RESEND_API_KEY"] = "re_not_used"
        with self.assertRaises(send.SendError) as caught:
            send.send(self.app, DAY, "resend")
        self.assertIn("OUTBOUND_SEND_ENABLED", str(caught.exception))

    def test_refuses_without_an_api_key(self):
        approve.approve(self.app, DAY)
        os.environ["OUTBOUND_SEND_ENABLED"] = "true"
        os.environ.pop("RESEND_API_KEY", None)
        with self.assertRaises(send.SendError) as caught:
            send.send(self.app, DAY, "resend")
        self.assertIn("RESEND_API_KEY", str(caught.exception))

    def test_a_false_flag_is_still_a_refusal(self):
        approve.approve(self.app, DAY)
        os.environ["OUTBOUND_SEND_ENABLED"] = "false"
        os.environ["RESEND_API_KEY"] = "re_not_used"
        with self.assertRaises(send.SendError):
            send.send(self.app, DAY, "resend")

    def test_nothing_is_logged_when_a_send_is_refused(self):
        approve.approve(self.app, DAY)
        with self.assertRaises(send.SendError):
            send.send(self.app, DAY, "resend")
        self.assertEqual(send.read_log(self.app), [])

    def test_unknown_adapter_is_refused(self):
        approve.approve(self.app, DAY)
        with self.assertRaises(send.SendError):
            send.send(self.app, DAY, "smtp-direct")


if __name__ == "__main__":
    unittest.main()
