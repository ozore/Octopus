"""Facts in, English out. No LLM required, no fact invented."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import personalise as p  # noqa: E402
from outbound.engine._testsupport import prospect  # noqa: E402


class ExtractionTests(unittest.TestCase):
    def test_federal_awards(self):
        facts = p.extract_facts(prospect(
            size_signal="3 federal awards, $814k total since 2024", location="Melbourne, TX"))
        self.assertEqual(facts["federal_awards"],
                         {"count": 3, "total": "$814k", "since": "2024"})
        self.assertEqual(facts["state"], "TX")
        self.assertEqual(facts["city"], "Melbourne")

    def test_certifications(self):
        self.assertEqual(
            p.extract_facts(prospect(size_signal="NJ certification: MWBE | SBE"))["certification"],
            {"codes": ["MWBE", "SBE"], "state": "NJ"})
        self.assertEqual(
            p.extract_facts(prospect(
                size_signal="certified DBE in the NYS Unified Certification Program"
            ))["certification"],
            {"codes": ["DBE"], "programme": "Unified Certification Program", "state": "NY"})
        self.assertEqual(
            p.extract_facts(prospect(size_signal="certification: SLDBE (CNO)"))["certification"],
            {"codes": ["SLDBE"], "programme": "CNO"})

    def test_payroll_filings_and_registrations(self):
        facts = p.extract_facts(prospect(
            size_signal="1846 weekly certified payrolls filed on NY public work since 2024"))
        self.assertEqual(facts["payroll_filings"]["count"], 1846)
        self.assertEqual(facts["payroll_filings"]["since"], "2024")
        facts = p.extract_facts(prospect(
            size_signal="active NYSDOL public work contractor registration 26-64D7K-CR"))
        self.assertEqual(facts["registration"]["reference"], "26-64D7K-CR")

    def test_portfolio_brands_locations_employees(self):
        self.assertEqual(p.extract_facts(prospect(size_signal="8,000 units managed"))["portfolio"],
                         {"count": 8000, "noun": "units", "approx": False})
        self.assertEqual(p.extract_facts(prospect(size_signal="1000+ properties"))["portfolio"],
                         {"count": 1000, "noun": "properties", "approx": True})
        brands = p.extract_facts(prospect(
            size_signal="~25 brands across ~15 states; 26 metros listed"))["brands"]
        self.assertEqual(brands, {"count": 25, "noun": "brands", "states": 15})
        locations = p.extract_facts(prospect(
            size_signal="70+ service centers across ~23-28 states; ~6,500 employees"))
        self.assertEqual(locations["locations"], {"count": 70, "noun": "service centers",
                                                  "states": 23})
        self.assertEqual(locations["employees"], {"count": 6500, "noun": "employees"})

    def test_states_and_trades_from_notes(self):
        facts = p.extract_facts(prospect(
            notes="Sponsor: someone. States operated incl. AZ, CA, CO, FL, GA."))
        self.assertEqual(facts["states_operated"], ["AZ", "CA", "CO", "FL", "GA"])
        facts = p.extract_facts(prospect(
            notes="commodity codes 238140 - Masonry Contractors; 238110 - Poured Concrete "
                  "Foundation and Structure Contractors; 238990 - All Other Specialty Trade"))
        self.assertEqual(facts["trades"],
                         ["masonry", "poured concrete foundation and structure"])

    def test_states_operated_keeps_the_full_list_so_the_count_is_right(self):
        notes = ("States operated incl. AZ, CA, CO, FL, GA, IN, KY, MD, NC, OH, OK, "
                 "SC, TX, UT.")
        facts = p.extract_facts(prospect(notes=notes))
        self.assertEqual(len(facts["states_operated"]), 14)
        self.assertEqual(p.phrase_states_operated(facts["states_operated"]),
                         "Arizona, California, Colorado and 11 other states")

    def test_states_operated_phrases(self):
        self.assertEqual(p.phrase_states_operated(["TX"]), "Texas")
        self.assertEqual(p.phrase_states_operated(["TX", "NY"]), "Texas and New York")
        self.assertEqual(p.phrase_states_operated(["TX", "NY", "CA", "OH"]),
                         "Texas, New York, California and one other state")

    def test_nothing_is_invented(self):
        facts = p.extract_facts(prospect(size_signal="", location="", notes="",
                                         segment="commercial GC"))
        self.assertEqual(set(facts), {"segment"})

    def test_state_only_location(self):
        facts = p.extract_facts(prospect(location="TX"))
        self.assertEqual(facts["state"], "TX")
        self.assertNotIn("city", facts)
        self.assertEqual(facts["location"], "Texas")


class PhraseTests(unittest.TestCase):
    def test_the_brief_example(self):
        """'3 federal awards since 2024 in TX' -> the sentence the brief asks for."""
        facts = p.extract_facts(prospect(
            size_signal="3 federal awards, $814k total since 2024", location="Austin, TX"))
        self.assertEqual(p.phrases(facts)["federal_awards"],
                         "your three federal jobs in Texas since 2024")

    def test_singular_and_large_counts(self):
        self.assertEqual(
            p.phrase_federal_awards({"count": 1, "since": "2024"}, "NY"),
            "your one federal job in New York since 2024")
        self.assertEqual(
            p.phrase_federal_awards({"count": 15, "since": "2024"}, "GA"),
            "your 15 federal jobs in Georgia since 2024")

    def test_certification_phrases(self):
        self.assertEqual(
            p.phrase_certification({"codes": ["MWBE", "SBE"], "state": "NJ"}),
            "your MWBE and SBE certifications in New Jersey")
        self.assertEqual(
            p.phrase_certification({"codes": ["DBE"], "programme": "Unified Certification Program",
                                    "state": "NY"}),
            "your DBE certification in the New York Unified Certification Program")

    def test_portfolio_and_brands(self):
        self.assertEqual(p.phrase_portfolio({"count": 8000, "noun": "units", "approx": False}),
                         "the 8,000 units you manage")
        self.assertEqual(p.phrase_brands({"count": 25, "noun": "brands", "states": 15}),
                         "your 25 brands across 15 states")

    def test_opening_always_exists(self):
        for row in (prospect(), prospect(size_signal="", notes=""),
                    prospect(size_signal="", location="", notes=""),
                    prospect(size_signal="", location="", notes="", segment="")):
            rendered = p.phrases(p.extract_facts(row))
            self.assertTrue(rendered["opening"].strip())
            self.assertNotIn("{{", rendered["opening"])

    def test_opening_prefers_the_strongest_fact(self):
        rendered = p.phrases(p.extract_facts(prospect(
            size_signal="3 federal awards, $814k total since 2024", location="Austin, TX")))
        self.assertEqual(rendered["opening"],
                         "I saw your three federal jobs in Texas since 2024")

    def test_empty_phrases_are_dropped_not_blanked(self):
        rendered = p.phrases(p.extract_facts(prospect(size_signal="", notes="")))
        self.assertNotIn("federal_awards", rendered)
        self.assertTrue(all(str(v).strip() for v in rendered.values()))


class PolishTests(unittest.TestCase):
    def test_no_op_unless_enabled(self):
        os.environ["ANTHROPIC_API_KEY"] = "sk-not-used"
        try:
            self.assertEqual(p.llm_polish("a sentence"), "a sentence")
        finally:
            os.environ.pop("ANTHROPIC_API_KEY")

    def test_no_op_without_a_key(self):
        os.environ.pop("ANTHROPIC_API_KEY", None)
        self.assertEqual(p.llm_polish("a sentence", enabled=True), "a sentence")

    def test_new_numbers_are_rejected(self):
        self.assertTrue(p._no_new_numbers("your 3 federal jobs", "your 3 federal jobs since"))
        self.assertFalse(p._no_new_numbers("your three federal jobs", "your 42 federal jobs"))


if __name__ == "__main__":
    unittest.main()
