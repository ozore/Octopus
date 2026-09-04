"""Workbook seeding, route classification and suppression."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase, prospect  # noqa: E402


class RouteClassificationTests(EngineTestCase):
    def test_generic_mailbox_is_kept(self):
        for address in ("info@acme.com", "sales@acme.com", "bids@acme.com",
                        "webmaster@acme.com", "customer.service@acme.com",
                        "MAILTO:Estimating@Acme.com"):
            kind, route, note = wb.classify_route(address)
            self.assertEqual(kind, "mailbox", address)
            self.assertNotIn("mailto", route.lower())
            self.assertEqual(route, route.lower())
            self.assertEqual(note, "")

    def test_personal_looking_mailbox_loses_its_route(self):
        for address in ("john.smith@acme.com", "j.smith@acme.com",
                        "maria-garcia@acme.com", "someone@gmail.com",
                        "office@yahoo.com"):
            kind, route, note = wb.classify_route(address)
            self.assertEqual(kind, "none", address)
            self.assertEqual(route, "")
            self.assertTrue(note)

    def test_contact_page_is_a_form_route(self):
        kind, route, _ = wb.classify_route("https://acme.com/contact-us/")
        self.assertEqual((kind, route), ("form", "https://acme.com/contact-us/"))

    def test_empty_and_junk_routes(self):
        self.assertEqual(wb.classify_route("")[0], "none")
        self.assertEqual(wb.classify_route("call us on the phone")[0], "none")

    def test_domain_of(self):
        self.assertEqual(wb.domain_of("https://www.acme.com/contact"), "acme.com")
        self.assertEqual(wb.domain_of("info@acme.com"), "acme.com")
        self.assertEqual(wb.domain_of("mailto:info@acme.co.uk"), "acme.co.uk")
        self.assertEqual(wb.domain_of(""), "")


class OrgIdTests(EngineTestCase):
    def test_stable_and_unique(self):
        first = wb.org_id_for("Example Construction LLC", "https://a.com")
        self.assertEqual(first, wb.org_id_for("Example Construction LLC", "https://a.com"))
        self.assertNotEqual(first, wb.org_id_for("Example Construction LLC", "https://b.com"))
        self.assertTrue(first.startswith("example-construction-llc-"))


class SeedTests(EngineTestCase):
    def test_seed_keeps_only_usable_end_customers(self):
        counts = wb.seed_from_prospects(self.app)
        rows = wb.read_workbook(cfg_mod.workbook_path(self.app))
        names = {row["name"] for row in rows}
        self.assertEqual(names, {"Example Construction LLC", "Second Builders Inc",
                                 "Form Only Contracting"})
        self.assertEqual(counts["customers_mailbox"], 2)
        self.assertEqual(counts["customers_form"], 1)
        self.assertEqual(counts["customers_dropped_personal"], 2)
        self.assertEqual(counts["customers_dropped_no_route"], 1)

    def test_header_is_the_agreed_schema(self):
        wb.seed_from_prospects(self.app)
        with open(cfg_mod.workbook_path(self.app), encoding="utf-8") as handle:
            header = handle.readline().strip().replace('"', "").split(",")
        self.assertEqual(header, wb.COLUMNS)

    def test_partners_go_to_their_own_workbook(self):
        wb.seed_from_prospects(self.app)
        partners = wb.read_workbook(cfg_mod.workbook_path(self.app, "partners"))
        self.assertEqual([r["name"] for r in partners], ["Helpful CPA LLP"])
        customers = wb.read_workbook(cfg_mod.workbook_path(self.app))
        self.assertNotIn("Helpful CPA LLP", {r["name"] for r in customers})

    def test_excluded_rows_seed_the_suppression_list(self):
        wb.seed_from_prospects(self.app)
        patterns = {r["pattern"] for r in wb.read_suppression(self.app)}
        self.assertIn("rivalsoftware.com", patterns)

    def test_facts_are_extracted_into_the_workbook(self):
        wb.seed_from_prospects(self.app)
        rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        facts = json.loads(rows["Example Construction LLC"]["personalisation_facts"])
        self.assertEqual(facts["federal_awards"]["count"], 3)
        self.assertEqual(facts["state"], "TX")

    def test_every_row_starts_at_new(self):
        wb.seed_from_prospects(self.app)
        for row in wb.read_workbook(cfg_mod.workbook_path(self.app)):
            self.assertEqual(row["stage"], "new")
            self.assertIn(row["route_type"], ("mailbox", "form"))

    def test_reseeding_preserves_stage_and_dates(self):
        wb.seed_from_prospects(self.app)
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        rows[0].update({"stage": "sent_1", "last_action_at": "2026-09-08",
                        "next_action_at": "2026-09-14", "thread_ref": "thread-1"})
        target = rows[0]["org_id"]
        wb.write_workbook(path, rows)
        wb.seed_from_prospects(self.app)
        after = {r["org_id"]: r for r in wb.read_workbook(path)}[target]
        self.assertEqual(after["stage"], "sent_1")
        self.assertEqual(after["next_action_at"], "2026-09-14")
        self.assertEqual(after["thread_ref"], "thread-1")

    def test_reseeding_does_not_duplicate(self):
        wb.seed_from_prospects(self.app)
        first = len(wb.read_workbook(cfg_mod.workbook_path(self.app)))
        wb.seed_from_prospects(self.app)
        self.assertEqual(len(wb.read_workbook(cfg_mod.workbook_path(self.app))), first)

    def test_prospect_files_are_not_modified(self):
        path = cfg_mod.prospects_root() / self.app / "prospects.csv"
        before = path.read_bytes()
        wb.seed_from_prospects(self.app)
        self.assertEqual(path.read_bytes(), before)


class SuppressionTests(EngineTestCase):
    def test_matcher_covers_domain_email_and_org(self):
        wb.write_suppression(self.app, [
            {"pattern": "blocked.com", "kind": "domain", "reason": "competitor"},
            {"pattern": "info@stop.com", "kind": "email", "reason": "opt-out"},
            {"pattern": "named org", "kind": "org", "reason": "do not contact"},
        ])
        matches = wb.suppression_matcher(wb.read_suppression(self.app))
        self.assertEqual(matches({"website": "https://blocked.com", "contact_route": "",
                                  "name": ""}), "competitor")
        self.assertEqual(matches({"website": "", "contact_route": "info@stop.com",
                                  "name": ""}), "opt-out")
        self.assertEqual(matches({"website": "", "contact_route": "",
                                  "name": "Named Org"}), "do not contact")
        self.assertEqual(matches({"website": "https://fine.com", "contact_route": "",
                                  "name": "Fine"}), "")

    def test_suppression_is_deduplicated(self):
        wb.add_suppression(self.app, "dup.com", "domain", "one")
        wb.add_suppression(self.app, "dup.com", "domain", "two")
        self.assertEqual(len(wb.read_suppression(self.app)), 1)


class MergedListTests(EngineTestCase):
    """Certly merges certly-pm and certly-gc into one workbook."""

    prospect_dirs = ("dir-a", "dir-b")

    def setUp(self):
        self.prospect_rows = [prospect(name="Only In A", website="https://a.test",
                                       contact_route="info@a.test")]
        super().setUp()
        # give the second directory a different organisation plus one duplicate
        import csv
        from outbound.engine._testsupport import PROSPECT_COLUMNS
        rows = [prospect(name="Only In B", website="https://b.test",
                         contact_route="info@b.test"),
                prospect(name="Only In A", website="https://a.test",
                         contact_route="info@a.test")]
        path = self.prospects / "dir-b" / "prospects.csv"
        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=PROSPECT_COLUMNS, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)

    def test_two_lists_merge_without_duplicates(self):
        wb.seed_from_prospects(self.app)
        names = [r["name"] for r in wb.read_workbook(cfg_mod.workbook_path(self.app))]
        self.assertEqual(sorted(names), ["Only In A", "Only In B"])


if __name__ == "__main__":
    import unittest
    unittest.main()
