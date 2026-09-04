#!/usr/bin/env python3
"""
WageLens / CraftWage — palette contrast checker.

Computes WCAG 2.1 contrast ratios for every colour pair the design system relies
on, in both themes, and fails (exit 1) if any pair misses its required ratio.

Run from anywhere:      python3 identity/contrast.py
Machine-readable table: python3 identity/contrast.py --tsv

Requirements applied (WCAG 2.1):
  - 4.5:1  normal text (< 18.66px bold / < 24px regular)
  - 3.0:1  large text (>= 24px, or >= 18.66px bold)
  - 3.0:1  non-text UI: component boundaries, focus indicators, chart/table rules
           that carry meaning (SC 1.4.11)
Deliberately NOT tested, and why:
  - `--wl-rule-hairline` (graphite-200 light / graphite-800 dark). WCAG 2.1 SC
    1.4.11 exempts non-text content that is purely decorative or whose
    information is available in text. The hairline only separates stacked
    blocks that are already separated by spacing and headings, so it carries no
    information. The *payroll grid* rule is a different token and IS tested at
    3:1, because in the weekly grid the rule is what tells you which day a
    number belongs to.
  - Disabled controls (SC 1.4.3 and 1.4.11 both exempt inactive components).
  - Placeholder text: the system does not use placeholders as labels, so
    placeholder contrast is never load-bearing (see IDENTITY.md 10.2).

No dependencies. Pure standard library so it runs in CI with nothing installed.
"""
from __future__ import annotations
import sys

# ---------------------------------------------------------------------------
# TOKENS — must stay identical to design-system.css. This file is the authority
# for the numbers printed in IDENTITY.md §6.
# ---------------------------------------------------------------------------

TOKENS: dict[str, str] = {
    # -- Graphite: warm neutral ramp (hue ~30-40, very low chroma) -----------
    "graphite-0":    "#FFFFFF",
    "graphite-25":   "#FBF9F5",
    "graphite-50":   "#F6F2EB",
    "graphite-100":  "#EDE8DF",
    "graphite-200":  "#DED7CA",
    "graphite-300":  "#C2B9A9",
    "graphite-400":  "#918776",
    "graphite-500":  "#7A7166",
    "graphite-600":  "#5F574E",
    "graphite-700":  "#453F38",
    "graphite-800":  "#2B2723",
    "graphite-900":  "#1B1815",
    "graphite-950":  "#12100E",
    "graphite-1000": "#0B0A09",

    # -- Brick: the brand hue (iron oxide, ~18 deg). Brand + primary action.
    #    Never used for a status. -------------------------------------------
    "brick-50":  "#FDF3EF",
    "brick-100": "#FAE2D8",
    "brick-200": "#F3C0AC",
    "brick-300": "#E7947A",
    "brick-400": "#D96A48",
    "brick-500": "#C24E28",
    "brick-600": "#A63C1A",
    "brick-700": "#8A3115",
    "brick-800": "#6B2510",
    "brick-900": "#43170A",

    # -- Filed green: success / accepted / on file --------------------------
    "filed-50":  "#E9F6EE",
    "filed-100": "#CDEBDA",
    "filed-300": "#5FBF87",
    "filed-400": "#2F9E5F",
    "filed-600": "#116634",
    "filed-700": "#0C4E28",

    # -- Flag amber: needs review / incomplete ------------------------------
    "flag-50":  "#FDF3D8",
    "flag-100": "#F8E4AE",
    "flag-300": "#D9A521",
    "flag-400": "#B4820F",
    "flag-600": "#7A560A",
    "flag-700": "#5C4008",

    # -- Reject red: rejected / error / overdue -----------------------------
    "reject-50":  "#FDECEA",
    "reject-100": "#F9D2CD",
    "reject-300": "#E5766A",
    "reject-400": "#CF4436",
    "reject-600": "#9C2A1E",
    "reject-700": "#771F16",

    # -- Source blue: provenance only (wage determination citations) --------
    "source-50":  "#E9F1F8",
    "source-100": "#CFE0EF",
    "source-300": "#6FA5D0",
    "source-400": "#3D80B8",
    "source-600": "#1B5183",
    "source-700": "#143D63",
}

# ---------------------------------------------------------------------------
# WCAG maths
# ---------------------------------------------------------------------------

def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (0.2126 * _srgb_to_linear(r)
            + 0.7152 * _srgb_to_linear(g)
            + 0.0722 * _srgb_to_linear(b))


def contrast(fg: str, bg: str) -> float:
    l1, l2 = relative_luminance(fg), relative_luminance(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def tok(name: str) -> str:
    """Resolve a token name to a hex value; pass a literal hex straight through."""
    return name if name.startswith("#") else TOKENS[name]


# ---------------------------------------------------------------------------
# The pairs the system actually renders. (label, fg, bg, required ratio)
# ---------------------------------------------------------------------------

LIGHT = [
    # body and heading text
    ("ink-1 on canvas",              "graphite-900", "graphite-25",  4.5),
    ("ink-1 on surface",             "graphite-900", "graphite-0",   4.5),
    ("ink-1 on sunken",              "graphite-900", "graphite-50",  4.5),
    ("ink-2 on canvas",              "graphite-700", "graphite-25",  4.5),
    ("ink-2 on surface",             "graphite-700", "graphite-0",   4.5),
    ("ink-3 (helper) on canvas",     "graphite-600", "graphite-25",  4.5),
    ("ink-3 (helper) on surface",    "graphite-600", "graphite-0",   4.5),
    ("ink-3 on sunken (table head)", "graphite-600", "graphite-50",  4.5),
    ("ink-3 on row stripe",          "graphite-600", "graphite-25",  4.5),
    # brand and actions
    ("brand link on canvas",         "brick-700",    "graphite-25",  4.5),
    ("brand link on surface",        "brick-700",    "graphite-0",   4.5),
    ("primary btn label",            "#FFFFFF",      "brick-700",    4.5),
    ("primary btn label (hover)",    "#FFFFFF",      "brick-800",    4.5),
    ("secondary btn label",          "graphite-800", "graphite-0",   4.5),
    ("ghost btn label on canvas",    "brick-700",    "graphite-25",  4.5),
    # status pills: dark ink on tinted surface
    ("Filed pill",                   "filed-700",    "filed-50",     4.5),
    ("Needs review pill",            "flag-700",     "flag-50",      4.5),
    ("Rejected pill",                "reject-700",   "reject-50",    4.5),
    ("Draft pill",                   "graphite-700", "graphite-100", 4.5),
    ("source chip (WD citation)",    "source-700",   "source-50",    4.5),
    # alert banners
    ("alert-info text",              "source-700",   "source-50",    4.5),
    ("alert-warn text",              "flag-700",     "flag-50",      4.5),
    ("alert-error text",             "reject-700",   "reject-50",    4.5),
    ("alert-success text",           "filed-700",    "filed-50",     4.5),
    # non-text (SC 1.4.11): boundaries and indicators
    ("input border on surface",      "graphite-400", "graphite-0",   3.0),
    ("input border on canvas",       "graphite-400", "graphite-25",  3.0),
    ("focus ring on canvas",         "brick-600",    "graphite-25",  3.0),
    ("focus ring on surface",        "brick-600",    "graphite-0",   3.0),
    ("focus ring inner on primary",  "#FFFFFF",      "brick-700",    3.0),
    ("focus ring outer on canvas",   "graphite-900", "graphite-25",  3.0),
    ("payroll grid rule on surface", "graphite-400", "graphite-0",   3.0),
    ("payroll grid rule on sunken",  "graphite-400", "graphite-50",  3.0),
    ("payroll grid rule on stripe",  "graphite-400", "graphite-25",  3.0),
    ("status dot filed",             "filed-600",    "filed-50",     3.0),
    ("status dot flag",              "flag-600",     "flag-50",      3.0),
    ("status dot reject",            "reject-600",   "reject-50",    3.0),
    ("selected row edge",            "brick-600",    "brick-50",     3.0),
    # large text only
    ("page title on canvas",         "graphite-900", "graphite-25",  3.0),
    ("figure (rate) on sunken",      "graphite-800", "graphite-50",  4.5),
]

DARK = [
    ("ink-1 on canvas",              "graphite-50",  "graphite-950", 4.5),
    ("ink-1 on surface",             "graphite-50",  "graphite-900", 4.5),
    ("ink-2 on canvas",              "graphite-200", "graphite-950", 4.5),
    ("ink-2 on surface",             "graphite-200", "graphite-900", 4.5),
    ("ink-3 (helper) on canvas",     "graphite-300", "graphite-950", 4.5),
    ("ink-3 (helper) on surface",    "graphite-300", "graphite-900", 4.5),
    ("ink-3 on sunken (table head)", "graphite-300", "graphite-1000", 4.5),
    ("brand link on canvas",         "brick-300",    "graphite-950", 4.5),
    ("brand link on surface",        "brick-300",    "graphite-900", 4.5),
    ("primary btn label",            "graphite-1000", "brick-400",   4.5),
    ("primary btn label (hover)",    "graphite-1000", "brick-300",   4.5),
    ("secondary btn label",          "graphite-50",  "graphite-800", 4.5),
    ("Filed pill",                   "filed-300",    "graphite-800", 4.5),
    ("Needs review pill",            "flag-300",     "graphite-800", 4.5),
    ("Rejected pill",                "reject-300",   "graphite-800", 4.5),
    ("Draft pill",                   "graphite-300", "graphite-800", 4.5),
    ("source chip (WD citation)",    "source-300",   "graphite-800", 4.5),
    ("alert-info text",              "source-300",   "graphite-900", 4.5),
    ("alert-warn text",              "flag-300",     "graphite-900", 4.5),
    ("alert-error text",             "reject-300",   "graphite-900", 4.5),
    ("alert-success text",           "filed-300",    "graphite-900", 4.5),
    ("input border on surface",      "graphite-500", "graphite-900", 3.0),
    ("input border on canvas",       "graphite-500", "graphite-950", 3.0),
    ("focus ring on canvas",         "brick-400",    "graphite-950", 3.0),
    ("focus ring on surface",        "brick-400",    "graphite-900", 3.0),
    ("focus ring inner on primary",  "graphite-1000", "brick-400",   3.0),
    ("focus ring outer on canvas",   "graphite-50",  "graphite-950", 3.0),
    ("payroll grid rule on surface", "graphite-500", "graphite-900", 3.0),
    ("payroll grid rule on sunken",  "graphite-500", "graphite-1000", 3.0),
    ("status dot filed",             "filed-300",    "graphite-900", 3.0),
    ("status dot flag",              "flag-300",     "graphite-900", 3.0),
    ("status dot reject",            "reject-300",   "graphite-900", 3.0),
    ("figure (rate) on sunken",      "graphite-50",  "graphite-1000", 4.5),
]


def run(pairs, theme: str, tsv: bool):
    failures = []
    if not tsv:
        print(f"\n{theme.upper()}")
        print("-" * 96)
        print(f"{'pair':<34}{'fg':<15}{'bg':<15}{'ratio':>8}{'need':>7}  status")
        print("-" * 96)
    for label, fg, bg, need in pairs:
        ratio = contrast(tok(fg), tok(bg))
        ok = ratio >= need
        if not ok:
            failures.append((theme, label, fg, bg, ratio, need))
        if tsv:
            print(f"{theme}\t{label}\t{fg}\t{tok(fg)}\t{bg}\t{tok(bg)}"
                  f"\t{ratio:.2f}\t{need}\t{'PASS' if ok else 'FAIL'}")
        else:
            print(f"{label:<34}{fg:<15}{bg:<15}{ratio:>8.2f}{need:>7.1f}  "
                  f"{'PASS' if ok else 'FAIL  <-- FIX'}")
    return failures


def main() -> int:
    tsv = "--tsv" in sys.argv
    if tsv:
        print("theme\tpair\tfg_token\tfg_hex\tbg_token\tbg_hex\tratio\trequired\tresult")
    failures = run(LIGHT, "light", tsv) + run(DARK, "dark", tsv)
    if not tsv:
        print("\n" + "=" * 96)
        if failures:
            print(f"{len(failures)} FAILING PAIR(S):")
            for theme, label, fg, bg, ratio, need in failures:
                print(f"  [{theme}] {label}: {fg} on {bg} = {ratio:.2f}, need {need}")
        else:
            n = len(LIGHT) + len(DARK)
            print(f"All {n} pairs pass ({len(LIGHT)} light, {len(DARK)} dark).")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
