"""The five commands a founder actually types, end to end."""

import contextlib
import io
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import cli  # noqa: E402
from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402

DAY = "2026-09-08"


def run(*argv):
    """Run the CLI, returning (exit code, stdout). stderr is captured too."""
    buffer, errors = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(buffer), contextlib.redirect_stderr(errors):
        code = cli.main(list(argv))
    return code, buffer.getvalue() + errors.getvalue()


class CliTests(EngineTestCase):
    def setUp(self):
        super().setUp()
        self.set_sender_env()

    def test_a_whole_day_in_five_commands(self):
        code, out = run(self.app, "seed")
        self.assertEqual(code, 0)
        self.assertIn("seeded", out)

        code, out = run(self.app, "plan", "--date", DAY)
        self.assertEqual(code, 0)
        self.assertIn("planned 3 sends", out)

        code, out = run(self.app, "compose", "--date", DAY)
        self.assertEqual(code, 0)
        self.assertIn("composed 3 drafts", out)

        code, out = run(self.app, "approve", "--date", DAY)
        self.assertEqual(code, 0)
        self.assertIn("approved 3", out)

        code, out = run(self.app, "send", "--date", DAY, "--adapter", "dryrun")
        self.assertEqual(code, 0)
        self.assertIn("dryrun=3", out)

        code, out = run(self.app, "report")
        self.assertEqual(code, 0)
        self.assertTrue(cfg_mod.report_path(self.app).exists())

    def test_reply_moves_a_row_and_suppresses(self):
        run(self.app, "seed")
        org_id = wb.read_workbook(cfg_mod.workbook_path(self.app))[0]["org_id"]
        code, out = run(self.app, "reply", "--org", org_id, "--kind", "stop")
        self.assertEqual(code, 0)
        self.assertIn("suppressed", out)

    def test_reply_without_arguments_is_an_error(self):
        run(self.app, "seed")
        code, _ = run(self.app, "reply")
        self.assertEqual(code, 2)

    def test_unknown_app_is_an_error(self):
        code, _ = run("not-an-app", "seed")
        self.assertEqual(code, 2)

    def test_json_output_is_machine_readable(self):
        import json
        run(self.app, "seed")
        code, out = run(self.app, "plan", "--date", DAY, "--json")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["counts"]["planned"], 3)

    def test_approve_only_and_reject(self):
        run(self.app, "seed")
        run(self.app, "plan", "--date", DAY)
        run(self.app, "compose", "--date", DAY)
        org_ids = [r["org_id"] for r in wb.read_workbook(cfg_mod.workbook_path(self.app))]
        code, out = run(self.app, "approve", "--date", DAY, "--only", org_ids[0])
        self.assertEqual(code, 0)
        self.assertIn("approved 1", out)
        code, out = run(self.app, "approve", "--date", DAY, "--reject", org_ids[0],
                        "--reason", "wrong fit")
        self.assertEqual(code, 0)
        self.assertIn("approved now: 0", out)

    def test_partners_flag_uses_the_partner_workbook(self):
        run(self.app, "seed")
        code, out = run(self.app, "plan", "--date", DAY, "--partners")
        self.assertEqual(code, 0)
        self.assertIn("(partners)", out)


if __name__ == "__main__":
    unittest.main()
