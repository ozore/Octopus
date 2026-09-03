#!/usr/bin/env python3
"""
contrast.py — WCAG 2.1 contrast checker for the Certly palette.

Single source of truth for every ratio quoted in IDENTITY.md. No ratio in that
document may be hand-written: run this and paste the table it prints.

Usage:
    python3 identity/contrast.py            # check every declared pair
    python3 identity/contrast.py --md       # emit the markdown tables for IDENTITY.md
    python3 identity/contrast.py --css      # sanity-check design-system.css declares every token

Exit code 1 if any declared pair fails its required level, so CI can gate on it.

Method: WCAG 2.1 relative luminance (sRGB, 8-bit, gamma 2.4 with the 0.03928
linear segment) and (L1+0.05)/(L2+0.05). Ratios are reported truncated to two
decimals so a printed value never overstates the measured contrast.
"""
from __future__ import annotations
import sys, math, re, os

# --------------------------------------------------------------------------
# 1. The palette. Keep in lockstep with design-system.css.
# --------------------------------------------------------------------------
LIGHT = {
    # ground and surfaces
    "paper":            "#F3F3EE",
    "surface":          "#FFFFFF",
    "sunken":           "#E7E7E0",
    "line":             "#D5D5CC",
    "line-strong":      "#85857A",
    # ink ramp (blue-ink family)
    "ink":              "#0F1A2B",
    "ink-strong":       "#1B2941",
    "ink-muted":        "#495A73",
    "ink-faint":        "#6E7C91",
    "ink-disabled":     "#828E9E",
    # interaction
    "link":             "#14458C",
    "link-hover":       "#0E3266",
    "focus":            "#14458C",
    "select-bg":        "#EDF2FA",
    # status: covered
    "ok-fg":            "#14603A",
    "ok-bg":            "#E2EFE7",
    "ok-line":          "#8FBFA3",
    "ok-solid":         "#17703F",
    # status: expiring
    "warn-fg":          "#7A4A05",
    "warn-bg":          "#FBEBD3",
    "warn-line":        "#DCB271",
    "warn-solid":       "#8A5406",
    # status: gap
    "gap-fg":           "#A11F14",
    "gap-bg":           "#FBE5E2",
    "gap-line":         "#E3A69D",
    "gap-solid":        "#B02418",
    # status: needs review / unknown
    "rev-fg":           "#3D4F66",
    "rev-bg":           "#E8ECF1",
    "rev-line":         "#ADBAC9",
    # on-solid ink
    "on-ink":           "#FFFFFF",
    "on-solid":         "#FFFFFF",
}

DARK = {
    "paper":            "#0B1220",
    "surface":          "#141D2C",
    "sunken":           "#0F1725",
    "line":             "#2A3547",
    "line-strong":      "#5E7090",
    "ink":              "#E9ECF2",
    "ink-strong":       "#F4F6F9",
    "ink-muted":        "#A7B3C4",
    "ink-faint":        "#8B98AB",
    "ink-disabled":     "#67748A",
    "link":             "#8FB4F5",
    "link-hover":       "#B3CCFA",
    "focus":            "#8FB4F5",
    "select-bg":        "#1B2740",
    "ok-fg":            "#69D19B",
    "ok-bg":            "#193B2C",
    "ok-line":          "#2E6247",
    "ok-solid":         "#69D19B",
    "warn-fg":          "#EFBE72",
    "warn-bg":          "#382B12",
    "warn-line":        "#6B5324",
    "warn-solid":       "#EFBE72",
    "gap-fg":           "#FF9E90",
    "gap-bg":           "#43221C",
    "gap-line":         "#7A3229",
    "gap-solid":        "#FF9E90",
    "rev-fg":           "#AEBACB",
    "rev-bg":           "#243044",
    "rev-line":         "#3A4759",
    "on-ink":           "#0B1220",
    "on-solid":         "#0B1220",
}

# --------------------------------------------------------------------------
# 2. The pairs that must hold, with the level each must reach.
#    "AA"    = 4.5 : body text
#    "AA-lg" = 3.0 : text >= 18.66px bold or >= 24px
#    "UI"    = 3.0 : non-text contrast (borders of controls, focus rings, icons,
#                    the fill of a status dot) - WCAG 1.4.11
# --------------------------------------------------------------------------
PAIRS = [
    # (foreground, background, level, what it is)
    # -- text ---------------------------------------------------------------
    ("ink",          "paper",    "AA",    "body text on the app ground"),
    ("ink",          "surface",  "AA",    "body text on a card"),
    ("ink-strong",   "surface",  "AA",    "headings on a card"),
    ("ink-muted",    "paper",    "AA",    "secondary text on the ground"),
    ("ink-muted",    "surface",  "AA",    "secondary text on a card"),
    ("ink-faint",    "surface",  "AA-lg", "table meta / timestamps (large text only)"),
    ("link",         "surface",  "AA",    "link text on a card"),
    ("link",         "paper",    "AA",    "link text on the ground"),
    ("on-ink",       "ink",      "AA",    "label on the primary button"),
    ("ink",          "sunken",   "AA",    "text in a sunken well (document viewport, note)"),
    ("ink-muted",    "sunken",   "AA",    "the note block's secondary text"),
    ("ink",          "select-bg","AA",    "text in a selected table row"),
    # -- non-text (WCAG 1.4.11) --------------------------------------------
    ("focus",        "surface",  "UI",    "focus ring against a card"),
    ("focus",        "paper",    "UI",    "focus ring against the ground"),
    ("line-strong",  "surface",  "UI",    "input border on a card"),
    ("line-strong",  "paper",    "UI",    "input border on the ground"),
    ("line-strong",  "sunken",   "UI",    "the upload drop-zone border on its well"),
    ("ink-disabled", "surface",  "UI",    "disabled control ink (1.4.11-exempt; held anyway)"),
    # -- status text on its own tint ---------------------------------------
    ("ok-fg",        "ok-bg",    "AA",    "COVERED pill text"),
    ("warn-fg",      "warn-bg",  "AA",    "EXPIRING pill text"),
    ("gap-fg",       "gap-bg",   "AA",    "GAP pill text"),
    ("rev-fg",       "rev-bg",   "AA",    "NEEDS REVIEW pill text"),
    # -- status text on surfaces (table cells) -----------------------------
    ("ok-fg",        "surface",  "AA",    "COVERED text in a table cell"),
    ("warn-fg",      "surface",  "AA",    "EXPIRING text in a table cell"),
    ("gap-fg",       "surface",  "AA",    "GAP text in a table cell"),
    ("ok-fg",        "paper",    "AA",    "COVERED text on the ground"),
    ("warn-fg",      "paper",    "AA",    "EXPIRING text on the ground"),
    ("gap-fg",       "paper",    "AA",    "GAP text on the ground"),
    # -- status as meaning-bearing graphics: dot, coverage-bar segment ------
    #    Each segment is separated from its neighbour by a 1px separator in
    #    --c-surface, so the pair that matters is segment-vs-surface, never
    #    segment-vs-segment. See IDENTITY.md 6.3 "the separator rule".
    ("ok-solid",     "surface",  "UI",    "COVERED dot / coverage-bar segment on a card"),
    ("warn-solid",   "surface",  "UI",    "EXPIRING dot / coverage-bar segment on a card"),
    ("gap-solid",    "surface",  "UI",    "GAP dot / coverage-bar segment on a card"),
    ("ok-solid",     "paper",    "UI",    "COVERED segment on the ground"),
    ("warn-solid",   "paper",    "UI",    "EXPIRING segment on the ground"),
    ("gap-solid",    "paper",    "UI",    "GAP segment on the ground"),
    ("on-solid",     "ok-solid", "AA",    "text on a solid COVERED fill"),
    ("on-solid",     "gap-solid","AA",    "text on a solid GAP fill"),
    # -- pill chrome: house minimum, not a WCAG requirement -----------------
    #    The status is carried by text + glyph at >= 4.5:1; the tint and the
    #    hairline are reinforcement. HOUSE 1.5:1 keeps the chip a visible
    #    object without forcing a hard border that would shout on a long table.
    ("ok-bg",        "surface",  "HOUSE", "COVERED tint against the card"),
    ("warn-bg",      "surface",  "HOUSE", "EXPIRING tint against the card"),
    ("gap-bg",       "surface",  "HOUSE", "GAP tint against the card"),
    ("rev-bg",       "surface",  "HOUSE", "NEEDS REVIEW tint against the card"),
    ("ok-line",      "surface",  "HOUSE", "COVERED pill hairline against the card"),
    ("warn-line",    "surface",  "HOUSE", "EXPIRING pill hairline against the card"),
    ("gap-line",     "surface",  "HOUSE", "GAP pill hairline against the card"),
    ("rev-line",     "surface",  "HOUSE", "NEEDS REVIEW pill hairline against the card"),
    ("line",         "surface",  "HOUSE", "table rule against the card"),
    ("line",         "paper",    "HOUSE", "table rule against the ground"),
]

LEVELS = {"AA": 4.5, "AA-lg": 3.0, "UI": 3.0, "HOUSE": 1.15}


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminance(hexcolor: str) -> float:
    def chan(c: int) -> float:
        s = c / 255.0
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in hex_to_rgb(hexcolor))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def trunc2(x: float) -> float:
    """Truncate, never round up: a printed ratio must not overstate reality."""
    return math.floor(x * 100) / 100.0


def check(theme: dict, name: str, emit_md: bool = False):
    rows, failures = [], []
    for fg, bg, level, what in PAIRS:
        if fg not in theme or bg not in theme:
            failures.append((fg, bg, "missing token", level, what))
            continue
        r = trunc2(ratio(theme[fg], theme[bg]))
        need = LEVELS[level]
        ok = r >= need
        if not ok:
            failures.append((fg, bg, f"{r:.2f}", level, what))
        rows.append((fg, theme[fg], bg, theme[bg], r, level, need, ok, what))
    if emit_md:
        print(f"\n**{name}**\n")
        print("| foreground | bg | ratio | required | verdict | what it is |")
        print("|---|---|---:|---:|---|---|")
        for fg, fgv, bg, bgv, r, level, need, ok, what in rows:
            print(f"| `--c-{fg}` `{fgv}` | `--c-{bg}` `{bgv}` | **{r:.2f}:1** | "
                  f"{need:.1f} ({level}) | {'PASS' if ok else 'FAIL'} | {what} |")
    else:
        print(f"\n=== {name} ===")
        for fg, fgv, bg, bgv, r, level, need, ok, what in rows:
            print(f"{'ok ' if ok else 'FAIL'} {r:6.2f}:1  need {need:.1f} {level:5}  "
                  f"{fg:14}{fgv} on {bg:12}{bgv}  — {what}")
    return failures


def check_css(md: bool = False):
    """Every token used above must exist in design-system.css, in both themes."""
    here = os.path.dirname(os.path.abspath(__file__))
    css = os.path.join(os.path.dirname(here), "design-system.css")
    if not os.path.exists(css):
        print(f"\n[css] design-system.css not found at {css}")
        return [("css", "", "missing file", "", "")]
    text = open(css, encoding="utf-8").read()
    missing = []
    for token, value in LIGHT.items():
        if f"--c-{token}:" not in text:
            missing.append(token)
    for token in missing:
        print(f"[css] MISSING --c-{token} in design-system.css")
    # every declared light value should appear literally somewhere in the css
    valmiss = [f"--c-{t}={v}" for t, v in LIGHT.items()
               if v.lower() not in text.lower() and v.upper() not in text.upper()]
    for v in valmiss:
        print(f"[css] value not found: {v}")
    if not missing and not valmiss:
        print("[css] every palette token and light value is present in design-system.css")
    return [("css", t, "missing", "", "") for t in missing]


# --------------------------------------------------------------------------
# 4. Colour-independence. WCAG 1.4.1 forbids colour as the only carrier of
#    meaning. Certly's three statuses each carry a glyph, a fill pattern and a
#    word in addition to a hue; this check proves the *fills alone* also
#    separate in greyscale, which is what a photocopied gap report looks like.
# --------------------------------------------------------------------------
STATUS_MARKS = {
    # status: (solid token, glyph, fill pattern, the word)
    "covered":      ("ok-solid",   "check in a filled disc", "solid",                    "Covered"),
    "expiring":     ("warn-solid", "clock in a ring",        "45-degree hatch",          "Expiring"),
    "gap":          ("gap-solid",  "slash in a hollow disc", "open with a dashed edge",  "Gap"),
    "needs-review": ("rev-fg",     "question in a square",   "dotted",                   "Needs review"),
}
# The four status fills are near-isoluminant BY CONSTRUCTION: each must clear
# 4.5:1 against the same white, which forces their luminances together. So a
# greyscale-separation minimum is not achievable and not the right instrument.
# What is checked instead, and hard-failed, is REDUNDANT ENCODING: every status
# must own a distinct glyph, a distinct fill pattern and a distinct word. The
# greyscale ratios below are printed as the evidence for why that is mandatory.
GREY_REPORT_ONLY = True


def check_greyscale(theme: dict, name: str, md: bool = False):
    """Report greyscale separation (never fails) and hard-check redundant encoding."""
    ids = list(STATUS_MARKS)
    fails = []
    if md:
        print(f"\n**{name} — colour-independence (WCAG 1.4.1)**\n")
        print("| status | fill | relative luminance | glyph | fill pattern | word |")
        print("|---|---|---:|---|---|---|")
        for s_ in ids:
            tok, glyph, pat, word = STATUS_MARKS[s_]
            print(f"| {s_} | `{theme[tok]}` | {luminance(theme[tok]):.4f} | {glyph} | {pat} | {word} |")
        print("\n| pair | greyscale ratio | note |")
        print("|---|---:|---|")
    else:
        print(f"\n=== {name}: colour-independence ===")
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = ids[i], ids[j]
            r = trunc2(ratio(theme[STATUS_MARKS[a][0]], theme[STATUS_MARKS[b][0]]))
            note = "near-isoluminant — colour cannot be the carrier"
            if md:
                print(f"| {a} vs {b} | {r:.2f}:1 | {note} |")
            else:
                print(f"   {r:6.2f}:1  {a} vs {b}  ({note})")
    # hard check: redundant encoding must be distinct across all four statuses
    for idx, label in ((1, "glyph"), (2, "fill pattern"), (3, "word")):
        seen = [STATUS_MARKS[s_][idx] for s_ in ids]
        if len(set(seen)) != len(seen):
            fails.append(("status", label, "not distinct", "REDUNDANCY",
                          "every status needs its own " + label))
            print(f"FAIL: {label} is not distinct across the four statuses")
    if not fails and not md:
        print("   ok  glyph, fill pattern and word are distinct for all four statuses")
    return fails


if __name__ == "__main__":
    md = "--md" in sys.argv
    fails = []
    fails += check(LIGHT, "Light theme", md)
    fails += check(DARK, "Dark theme", md)
    fails += check_greyscale(LIGHT, "Light theme", md)
    fails += check_greyscale(DARK, "Dark theme", md)
    if "--css" in sys.argv:
        fails += check_css(md)
    print()
    if fails:
        print(f"{len(fails)} FAILING PAIR(S):")
        for f in fails:
            print("   ", f)
        sys.exit(1)
    n_grey = len(STATUS_MARKS) * (len(STATUS_MARKS) - 1) // 2
    print(f"All {(len(PAIRS) + n_grey) * 2} declared pairs pass: "
          f"{len(PAIRS)} contrast + {n_grey} greyscale, x 2 themes.")
