"""Merging `phase-3-acquisition/prospects/<dir>/routes-enrichment.csv` at seed time.

The enrichment file is written by the phase-4 route-enrichment pass. It is
optional, it never overrides a route the phase-3 list already carries, and it is
subject to exactly the same organisation-only rules as everything else: a
personal-looking mailbox in the enrichment file is dropped, not trusted.
"""

import csv
import hashlib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import config as cfg_mod  # noqa: E402
from outbound.engine import report as report_mod  # noqa: E402
from outbound.engine import workbook as wb  # noqa: E402
from outbound.engine._testsupport import EngineTestCase, prospect  # noqa: E402

ENRICHMENT_COLUMNS = ["name", "website", "contact_route", "route_type",
                      "evidence_url", "checked_on", "notes", "location"]


def enrichment_row(**overrides) -> dict:
    row = {column: "" for column in ENRICHMENT_COLUMNS}
    row.update({
        "name": "No Route Co",
        "website": "https://noroute.com/",
        "contact_route": "info@noroute.com",
        "route_type": "mailbox",
        "evidence_url": "https://noroute.com/contact",
        "checked_on": "2026-09-03",
        "notes": "dns-guess: site confirmed: full name in page; mailbox on homepage",
        "location": "Mobile, AL",
    })
    row.update(overrides)
    return row


class EnrichmentMergeTests(EngineTestCase):
    """The rows come from `_testsupport.DEFAULT_PROSPECTS`."""

    def rewrite_prospects(self, transform, directory="testapp"):
        from outbound.engine._testsupport import PROSPECT_COLUMNS
        path = self.prospects / directory / "prospects.csv"
        with open(path, newline="", encoding="utf-8") as handle:
            rows = [transform(r) for r in csv.DictReader(handle)]
        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=PROSPECT_COLUMNS,
                                    quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)

    def write_enrichment(self, rows, directory="testapp"):
        path = self.prospects / directory / "routes-enrichment.csv"
        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=ENRICHMENT_COLUMNS,
                                    quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)
        return path

    # -- the file itself ---------------------------------------------------

    def test_absent_file_changes_nothing(self):
        before = wb.seed_from_prospects(self.app)
        self.assertEqual(before["enrichment_rows"], 0)
        self.assertEqual(before["customers_route_from_enrichment"], 0)
        self.assertEqual(before["customers_mailbox"], 2)

    def test_read_enrichment_keys_by_name_and_location(self):
        self.write_enrichment([enrichment_row()])
        found = wb.read_enrichment("testapp")
        self.assertIn(("no route co", "mobile, al"), found)
        self.assertIn(("no route co", ""), found)      # name is unique in the file
        self.assertEqual(found[("no route co", "")]["contact_route"], "info@noroute.com")

    def test_repeated_names_are_only_matched_with_their_location(self):
        self.write_enrichment([
            enrichment_row(location="Mobile, AL"),
            enrichment_row(location="Reno, NV", contact_route="info@other.com",
                           website="https://other.com/"),
        ])
        found = wb.read_enrichment("testapp")
        self.assertNotIn(("no route co", ""), found)
        self.assertEqual(found[("no route co", "mobile, al")]["contact_route"],
                         "info@noroute.com")
        self.assertEqual(found[("no route co", "reno, nv")]["contact_route"],
                         "info@other.com")

    # -- the merge rule ----------------------------------------------------

    def test_enriched_route_reaches_the_workbook(self):
        self.write_enrichment([enrichment_row()])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["enrichment_rows"], 1)
        self.assertEqual(counts["customers_route_from_enrichment"], 1)
        rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertIn("No Route Co", rows)
        self.assertEqual(rows["No Route Co"]["contact_route"], "info@noroute.com")
        self.assertEqual(rows["No Route Co"]["route_type"], "mailbox")
        self.assertIn("routes-enrichment.csv", rows["No Route Co"]["notes"])
        self.assertIn("https://noroute.com/contact", rows["No Route Co"]["notes"])

    def test_enrichment_never_overrides_an_existing_route(self):
        self.write_enrichment([enrichment_row(
            name="Example Construction LLC", location="Austin, TX",
            contact_route="hello@somewhere-else.com",
            website="https://somewhere-else.com/")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_from_enrichment"], 0)
        rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(rows["Example Construction LLC"]["contact_route"],
                         "info@example-construction.com")
        self.assertEqual(rows["Example Construction LLC"]["website"],
                         "https://example-construction.com")

    # -- the one upgrade the enrichment is allowed to make -----------------

    def test_a_contact_page_is_upgraded_to_a_mailbox_on_the_same_domain(self):
        """Certly's whole target 2: 514 rows have a form and no mailbox."""
        self.write_enrichment([enrichment_row(
            name="Form Only Contracting", location="Denver, CO",
            website="https://formonly.com/", contact_route="info@formonly.com",
            evidence_url="https://formonly.com/contact")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_upgraded_from_enrichment"], 1)
        self.assertEqual(counts["customers_route_from_enrichment"], 0)
        row = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        row = row["Form Only Contracting"]
        self.assertEqual(row["route_type"], "mailbox")
        self.assertEqual(row["contact_route"], "info@formonly.com")
        # the page phase 3 found is not lost, it is written into the notes
        self.assertIn("https://formonly.com/contact", row["notes"])
        self.assertIn("phase-3 contact page was https://formonly.com/contact", row["notes"])

    def test_a_mailbox_on_another_domain_never_replaces_a_contact_page(self):
        self.write_enrichment([enrichment_row(
            name="Form Only Contracting", location="Denver, CO",
            website="https://somewhere-else.com/",
            contact_route="info@somewhere-else.com")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_upgraded_from_enrichment"], 0)
        row = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(row["Form Only Contracting"]["route_type"], "form")
        self.assertEqual(row["Form Only Contracting"]["contact_route"],
                         "https://formonly.com/contact")

    def test_a_contact_page_is_never_replaced_by_another_contact_page(self):
        self.write_enrichment([enrichment_row(
            name="Form Only Contracting", location="Denver, CO",
            website="https://formonly.com/", route_type="form",
            contact_route="https://formonly.com/about")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_upgraded_from_enrichment"], 0)
        row = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(row["Form Only Contracting"]["contact_route"],
                         "https://formonly.com/contact")

    def test_an_existing_mailbox_is_never_replaced(self):
        self.write_enrichment([enrichment_row(
            name="Example Construction LLC", location="Austin, TX",
            website="https://example-construction.com/",
            contact_route="sales@example-construction.com")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_upgraded_from_enrichment"], 0)
        row = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(row["Example Construction LLC"]["contact_route"],
                         "info@example-construction.com")

    def test_a_personal_mailbox_never_upgrades_a_contact_page(self):
        self.write_enrichment([enrichment_row(
            name="Form Only Contracting", location="Denver, CO",
            website="https://formonly.com/", contact_route="john.smith@formonly.com")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_upgraded_from_enrichment"], 0)
        row = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(row["Form Only Contracting"]["route_type"], "form")

    def test_a_failed_attempt_row_adds_nothing(self):
        self.write_enrichment([enrichment_row(
            contact_route="", route_type="none", website="", evidence_url="",
            notes="no site confirmed after 2 fetch(es); noroute.com: http 403")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_from_enrichment"], 0)
        names = [r["name"] for r in wb.read_workbook(cfg_mod.workbook_path(self.app))]
        self.assertNotIn("No Route Co", names)

    def test_website_is_filled_only_when_the_list_has_none(self):
        # phase 3 recorded no website for this organisation at all
        self.rewrite_prospects(lambda r: dict(r, website="")
                               if r["name"] == "No Route Co" else r)
        self.write_enrichment([
            enrichment_row(),
            enrichment_row(name="Second Builders Inc", location="Albany, NY",
                           website="https://not-second-builders.com/",
                           contact_route=""),
        ])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_website_from_enrichment"], 1)
        book = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(book["No Route Co"]["website"], "https://noroute.com/")
        self.assertEqual(book["Second Builders Inc"]["website"],
                         "https://secondbuilders.com")

    def test_a_contact_page_becomes_a_form_route(self):
        self.write_enrichment([enrichment_row(
            contact_route="https://noroute.com/contact", route_type="form")])
        wb.seed_from_prospects(self.app)
        rows = {r["name"]: r for r in wb.read_workbook(cfg_mod.workbook_path(self.app))}
        self.assertEqual(rows["No Route Co"]["route_type"], "form")
        self.assertEqual(rows["No Route Co"]["contact_route"],
                         "https://noroute.com/contact")

    # -- the organisation-only rules still apply ---------------------------

    def test_a_personal_mailbox_in_the_enrichment_file_is_refused(self):
        self.write_enrichment([enrichment_row(contact_route="john.smith@noroute.com")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_from_enrichment"], 0)
        names = [r["name"] for r in wb.read_workbook(cfg_mod.workbook_path(self.app))]
        self.assertNotIn("No Route Co", names)

    def test_a_free_mail_mailbox_in_the_enrichment_file_is_refused(self):
        self.write_enrichment([enrichment_row(contact_route="info@gmail.com")])
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["customers_route_from_enrichment"], 0)

    def test_a_row_the_phase_3_list_does_not_contain_is_ignored(self):
        self.write_enrichment([enrichment_row(name="Ghost Contracting LLC",
                                              location="Nowhere, ZZ")])
        wb.seed_from_prospects(self.app)
        names = [r["name"] for r in wb.read_workbook(cfg_mod.workbook_path(self.app))]
        self.assertNotIn("Ghost Contracting LLC", names)

    def test_partner_rows_are_enriched_too(self):
        self.write_enrichment([enrichment_row(
            name="Partner Without A Route", location="Tulsa, OK",
            contact_route="partners@partnerwithout.com",
            website="https://partnerwithout.com/")])
        # add the partner row to the list this test reads
        path = self.prospects / "testapp" / "prospects.csv"
        with open(path, newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
        rows.append(prospect(prospect_type="partner", name="Partner Without A Route",
                             website="", contact_route="", location="Tulsa, OK",
                             segment="construction CPA", size_signal=""))
        from outbound.engine._testsupport import PROSPECT_COLUMNS
        with open(path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=PROSPECT_COLUMNS,
                                    quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rows)
        counts = wb.seed_from_prospects(self.app)
        self.assertEqual(counts["partners_route_from_enrichment"], 1)
        partners = [r["name"] for r in
                    wb.read_workbook(cfg_mod.workbook_path(self.app, "partners"))]
        self.assertIn("Partner Without A Route", partners)

    # -- the surrounding guarantees ----------------------------------------

    def test_prospects_csv_is_not_written(self):
        self.write_enrichment([enrichment_row()])
        path = self.prospects / "testapp" / "prospects.csv"
        before = hashlib.sha256(path.read_bytes()).hexdigest()
        wb.seed_from_prospects(self.app)
        wb.seed_from_prospects(self.app)
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), before)

    def test_reseeding_with_enrichment_keeps_stage_and_dates(self):
        self.write_enrichment([enrichment_row()])
        wb.seed_from_prospects(self.app)
        path = cfg_mod.workbook_path(self.app)
        rows = wb.read_workbook(path)
        for row in rows:
            if row["name"] == "No Route Co":
                row["stage"] = "sent_1"
                row["last_action_at"] = "2026-09-04"
                row["thread_ref"] = "thread-42"
        wb.write_workbook(path, rows)
        wb.seed_from_prospects(self.app)
        after = {r["name"]: r for r in wb.read_workbook(path)}["No Route Co"]
        self.assertEqual(after["stage"], "sent_1")
        self.assertEqual(after["last_action_at"], "2026-09-04")
        self.assertEqual(after["thread_ref"], "thread-42")

    def test_report_coverage_counts_the_enriched_routes(self):
        self.write_enrichment([enrichment_row()])
        config = cfg_mod.load_config(self.app)
        before = report_mod.coverage(self.app, config)
        self.assertEqual(before["from_enrichment"], 1)
        self.assertEqual(before["mailbox"], 3)     # 2 from the list + 1 enriched
        self.assertEqual(before["no_route"], 0)

    def test_apply_enrichment_does_not_mutate_the_prospect_row(self):
        row = prospect(name="No Route Co", website="", contact_route="")
        record = {"website": "https://noroute.com/", "contact_route": "info@noroute.com",
                  "evidence_url": "", "checked_on": "2026-09-03", "route_type": "mailbox"}
        merged, kind, route, note, applied = wb.apply_enrichment(
            row, record, "none", "", "")
        self.assertEqual(row["website"], "")
        self.assertEqual(merged["website"], "https://noroute.com/")
        self.assertEqual((kind, route), ("mailbox", "info@noroute.com"))
        self.assertEqual(applied, {"route", "website"})


if __name__ == "__main__":
    import unittest
    unittest.main()
