"""Sequence files, front matter, conditionals and the loud failure on a blank."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from outbound.engine import sequences as seq  # noqa: E402
from outbound.engine._testsupport import EngineTestCase  # noqa: E402


class FrontMatterTests(unittest.TestCase):
    def test_parses_and_types_values(self):
        meta, body = seq.parse_front_matter(
            "---\nsubject: Hello {{org.name}}\ndelay_days: 5\nsend_window: 09:00-11:00\n"
            "---\nBody line\n")
        self.assertEqual(meta["subject"], "Hello {{org.name}}")
        self.assertEqual(meta["delay_days"], 5)
        self.assertEqual(meta["send_window"], "09:00-11:00")
        self.assertEqual(body, "Body line\n")

    def test_no_front_matter_is_all_body(self):
        meta, body = seq.parse_front_matter("Just a body\n")
        self.assertEqual(meta, {})
        self.assertEqual(body, "Just a body\n")

    def test_unclosed_front_matter_raises(self):
        with self.assertRaises(seq.SequenceError):
            seq.parse_front_matter("---\nsubject: x\nBody with no close\n")


class RenderTests(unittest.TestCase):
    context = {"org": {"name": "Acme"}, "fact": {"opening": "I saw your work",
                                                 "location": "Austin, Texas"}}

    def test_variables_are_substituted(self):
        self.assertEqual(seq.render("Hi {{org.name}}, {{fact.opening}}.", self.context),
                         "Hi Acme, I saw your work.")

    def test_missing_variable_fails_loudly(self):
        with self.assertRaises(seq.MissingVariable) as caught:
            seq.render("Hi {{org.nickname}}", self.context)
        self.assertEqual(caught.exception.name, "org.nickname")

    def test_empty_string_counts_as_missing(self):
        with self.assertRaises(seq.MissingVariable):
            seq.render("Hi {{org.name}}", {"org": {"name": "   "}})

    def test_conditional_block_kept_when_true(self):
        self.assertEqual(
            seq.render("A {{#if fact.location}}in {{fact.location}}{{/if}} B", self.context),
            "A in Austin, Texas B")

    def test_conditional_block_removed_when_absent(self):
        self.assertEqual(
            seq.render("A{{#if fact.federal_awards}} and awards{{/if}} B", self.context),
            "A B")

    def test_absent_variable_inside_a_dropped_block_is_not_an_error(self):
        self.assertEqual(
            seq.render("A{{#if fact.awards}} {{fact.awards}}{{/if}}.", self.context), "A.")

    def test_nested_conditionals(self):
        context = {"a": "yes", "b": "no-key-missing"}
        self.assertEqual(
            seq.render("{{#if a}}outer {{#if b}}inner{{/if}}{{/if}}", context),
            "outer inner")
        self.assertEqual(
            seq.render("{{#if a}}outer{{#if c}} inner{{/if}}{{/if}}", context), "outer")
        # trailing whitespace left by a dropped block is tidied away

    def test_tidy_removes_the_hole_a_dropped_block_leaves(self):
        rendered = seq.render("One\n\n{{#if missing}}Two{{/if}}\n\nThree", {})
        self.assertEqual(rendered, "One\n\nThree")

    def test_stray_template_syntax_is_an_error(self):
        with self.assertRaises(seq.SequenceError):
            seq.render("Hello {{#if a}}unclosed", {"a": "x"})


class LoadTests(EngineTestCase):
    def test_loads_four_steps_with_metadata(self):
        sequence = seq.load_sequence(self.app, "plain-intro")
        self.assertEqual(len(sequence.steps), 4)
        self.assertEqual([s.filename for s in sequence.steps], list(seq.STEP_FILES))
        self.assertEqual([s.kind for s in sequence.steps],
                         ["initial", "followup", "followup", "breakup"])
        self.assertEqual([s.delay_days for s in sequence.steps], [0, 5, 12, 21])
        self.assertEqual(sequence.steps[0].send_window, "09:00-11:00")

    def test_missing_step_file_raises(self):
        (self.outbound / self.app / "sequences" / "plain-intro" / "04-breakup.md").unlink()
        with self.assertRaises(seq.SequenceError):
            seq.load_sequence(self.app, "plain-intro")

    def test_unknown_sequence_raises(self):
        with self.assertRaises(seq.SequenceError):
            seq.load_sequence(self.app, "does-not-exist")

    def test_listing(self):
        self.assertEqual(seq.list_sequences(self.app), ["plain-intro"])

    def test_sequence_for_uses_the_segment_map(self):
        config = {"default_sequence": "plain-intro",
                  "sequence_map": {"commercial GC": "gc-intro"}}
        self.assertEqual(seq.sequence_for(config, {"segment": "commercial GC"}), "gc-intro")
        self.assertEqual(seq.sequence_for(config, {"segment": "self-storage"}), "plain-intro")

    def test_render_step_produces_subject_and_body(self):
        sequence = seq.load_sequence(self.app, "plain-intro")
        subject, body = seq.render_step(sequence.steps[0], {
            "org": {"name": "Acme", "segment": "commercial GC"},
            "fact": {"opening": "I saw your three federal jobs in Texas since 2024",
                     "federal_awards": "your three federal jobs"},
        })
        self.assertEqual(subject, "A question for Acme")
        self.assertIn("I saw your three federal jobs in Texas since 2024", body)
        self.assertIn("Federal work means a weekly filing.", body)
        self.assertNotIn("{{", body)


if __name__ == "__main__":
    unittest.main()
