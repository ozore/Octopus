"""Composition: CAN-SPAM, no blanks, no tracking, a preview to review."""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import batch  # noqa: E402
from outbound.engine import compose  # noqa: E402
from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402

DAY = "2026-09-08"


class ComposeTests(EngineTestCase):
    def setUp(self):
        super().setUp()
        self.set_sender_env()
        wb.seed_from_prospects(self.app)
        batch.plan(self.app, DAY)
        self.manifest = compose.compose(self.app, DAY)
        self.drafts = compose.load_drafts(self.app, DAY)

    def test_one_draft_per_planned_organisation(self):
        self.assertEqual(self.manifest["counts"]["drafts"], 3)
        self.assertEqual(len(self.drafts), 3)
        self.assertEqual(self.manifest["counts"]["failed"], 0)

    def test_no_blank_variables_anywhere(self):
        for draft in self.drafts:
            for field in ("subject", "text", "html"):
                self.assertNotIn("{{", draft[field])
                self.assertNotIn("}}", draft[field])
            self.assertTrue(draft["subject"].strip())
            self.assertTrue(draft["text"].strip())

    def test_nothing_is_blocked_once_the_founder_env_is_set(self):
        self.assertEqual(self.manifest["counts"]["blocking"], 0)
        for draft in self.drafts:
            self.assertEqual(draft["checks"]["blocking"], [])

    def test_can_spam_block_is_always_present(self):
        for draft in self.drafts:
            self.assertIn("TheVillage", draft["text"])
            self.assertIn("1 Test Street, Austin, TX 78701", draft["text"])
            self.assertIn("https://example.test/unsubscribe", draft["text"])
            self.assertIn("TestApp, a TheVillage company", draft["text"])
            self.assertTrue("STOP" in draft["text"] or "remove your" in draft["text"])

    def test_placeholders_block_the_batch_when_env_is_missing(self):
        os.environ.pop("OUTBOUND_POSTAL_ADDRESS")
        manifest = compose.compose(self.app, DAY)
        self.assertEqual(manifest["counts"]["blocking"], 3)
        self.assertIn("postal_address_missing", manifest["blocking_reasons"])
        for draft in compose.load_drafts(self.app, DAY):
            self.assertIn("[PHYSICAL ADDRESS PLACEHOLDER", draft["text"])

    def test_html_is_minimal_with_no_images_and_no_tracking(self):
        for draft in self.drafts:
            html = draft["html"].lower()
            self.assertNotIn("<img", html)
            self.assertNotIn("background-image", html)
            self.assertNotIn("<script", html)
            self.assertNotIn("http://", html.replace("http://www.w3.org", ""))
            self.assertIn("max-width:600px", html)
            self.assertIn("<p style=", html)

    def test_mailbox_drafts_have_a_recipient_and_form_drafts_a_url(self):
        by_route = {d["route_type"]: d for d in self.drafts}
        self.assertTrue(by_route["mailbox"]["to"])
        self.assertEqual(by_route["form"]["to"], "")
        self.assertTrue(by_route["form"]["form_url"].startswith("https://"))

    def test_personalisation_reaches_the_body(self):
        draft = [d for d in self.drafts if d["name"] == "Example Construction LLC"][0]
        self.assertIn("your three federal jobs in Texas since 2024", draft["text"])
        self.assertIn("Federal work means a weekly filing.", draft["text"])

    def test_a_conditional_block_disappears_when_the_fact_is_absent(self):
        draft = [d for d in self.drafts if d["name"] == "Form Only Contracting"][0]
        self.assertNotIn("Federal work means a weekly filing.", draft["text"])
        self.assertNotIn("  ", draft["text"].split("\n--\n")[0])

    def test_subject_is_not_deceptive(self):
        for draft in self.drafts:
            self.assertFalse(draft["subject"].lower().startswith("re:"))
            self.assertFalse(draft["subject"].lower().startswith("fwd:"))
            self.assertLess(len(draft["subject"]), 79)

    def test_body_is_wrapped(self):
        for draft in self.drafts:
            for line in draft["text"].split("\n"):
                if "http" in line or "PLACEHOLDER" in line:
                    continue  # a URL is never wrapped
                self.assertLessEqual(len(line), 80, line)

    def test_preview_and_manifest_are_written(self):
        out_dir = cfg_mod.drafts_dir(self.app, DAY)
        self.assertTrue((out_dir / "preview.html").exists())
        self.assertTrue((out_dir / "manifest.json").exists())
        preview = (out_dir / "preview.html").read_text(encoding="utf-8")
        for draft in self.drafts:
            self.assertIn(draft["org_id"], preview)
            self.assertIn(draft["subject"], preview)
        self.assertNotIn("<img", preview)

    def test_draft_filenames_carry_org_and_step(self):
        out_dir = cfg_mod.drafts_dir(self.app, DAY)
        names = {p.name for p in out_dir.glob("*.json")} - {"manifest.json"}
        for draft in self.drafts:
            self.assertIn(f"{draft['org_id']}-{draft['step']}.json", names)

    def test_check_draft_flags_a_broken_draft(self):
        config = cfg_mod.load_config(self.app)
        checks = compose.check_draft({
            "subject": "Re: our call", "text": "Hi {{org.name}}", "html": "",
            "route_type": "mailbox", "to": "", "form_url": "",
            "postal_address": "1 Test Street", "unsubscribe_url": "https://x.test",
            "from_address": "founder@example.test",
        }, config)
        for expected in ("unrendered_template_in_text", "no_recipient",
                         "deceptive_subject_thread", "sender_legal_name_missing",
                         "opt_out_missing"):
            self.assertIn(expected, checks["blocking"])

    def test_a_missing_variable_is_reported_not_shipped(self):
        path = (self.outbound / self.app / "sequences" / "plain-intro" / "01-initial.md")
        path.write_text("---\nsubject: Hi\ndelay_days: 0\n---\nHello {{org.nickname}}\n",
                        encoding="utf-8")
        manifest = compose.compose(self.app, DAY)
        self.assertEqual(manifest["counts"]["drafts"], 0)
        self.assertEqual(manifest["counts"]["failed"], 3)
        self.assertIn("org.nickname", manifest["failures"][0]["error"])


if __name__ == "__main__":
    unittest.main()
