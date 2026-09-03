#!/usr/bin/env python3
"""
StateReady — WCAG 2.1 contrast verification.

Computes the contrast ratio for every colour pair that IDENTITY.md and
design-system.css declare, and fails (exit 1) if any pair misses the target
recorded next to it. No third-party packages; run with:

    python3 identity/contrast.py            # table to stdout
    python3 identity/contrast.py --md       # markdown table for IDENTITY.md
    python3 identity/contrast.py --css      # re-print the token block

Method: WCAG 2.1 relative luminance (sRGB, 8-bit, linearised with the 0.03928
threshold and 2.4 gamma) and the (L1+0.05)/(L2+0.05) ratio, per
https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and #dfn-contrast-ratio.
Targets: 4.5 = 1.4.3 AA body text; 3.0 = 1.4.3 AA large text (>=24px, or
>=18.66px bold) and 1.4.11 AA non-text (borders, focus rings, status dots).
"""
import sys

# ---------------------------------------------------------------- tokens
# BOARD is the DEFAULT theme (:root). PAPER is the alternate, and is what every
# forwardable artefact uses: print, the bid PDF, the shareable readiness link,
# the alert emails. Allocation fixed by ../IDENTITY_ARBITRATION.md, 2026-09-03.
BOARD = {
    "ground":       "#181D1A",
    "surface":      "#212724",
    "sunken":       "#0E1210",
    "line":         "#333B37",
    "line_strong":  "#7E8A84",
    "ink":          "#ECF2EE",
    "ink_2":        "#B9C4BE",
    "ink_3":        "#8D9994",
    "ready":        "#52D09C",
    "ready_fill":   "#0F3226",
    "ready_edge":   "#38976F",
    "risk":         "#F0A85A",
    "risk_fill":    "#37260D",
    "risk_edge":    "#A0722C",
    "lapsed":       "#F98A93",
    "lapsed_fill":  "#3B1A20",
    "lapsed_edge":  "#BB4E59",
    "unknown":      "#8D9994",
    "unknown_fill": "#232925",
    "unknown_edge": "#7E8A84",
    "on_ink":       "#0E1210",
}
PAPER = {
    "ground":       "#E9ECE8",
    "surface":      "#FFFFFF",
    "sunken":       "#DCE0DB",
    "line":         "#CBD1CB",
    "line_strong":  "#78827C",
    "ink":          "#131714",
    "ink_2":        "#454B47",
    "ink_3":        "#5F6762",
    "ready":        "#146A46",
    "ready_fill":   "#D4EBE0",
    "ready_edge":   "#348D68",
    "risk":         "#8A4E08",
    "risk_fill":    "#F8E7CE",
    "risk_edge":    "#A9701F",
    "lapsed":       "#A81B2C",
    "lapsed_fill":  "#F7DEDF",
    "lapsed_edge":  "#BE454B",
    "unknown":      "#5F6762",
    "unknown_fill": "#E4E7E2",
    "unknown_edge": "#78827C",
    "on_ink":       "#E9ECE8",
}

# Kept as aliases so any caller written against the previous names still works.
LIGHT, DARK = BOARD, PAPER

# (foreground, background, target, what it is)
PAIRS = [
    ("ink",          "ground",       4.5, "body text on the ground"),
    ("ink",          "surface",      4.5, "body text on a card"),
    ("ink",          "sunken",       4.5, "body text on a sunken/table-header surface"),
    ("ink_2",        "ground",       4.5, "secondary text on the ground"),
    ("ink_2",        "surface",      4.5, "secondary text on a card"),
    ("ink_3",        "ground",       4.5, "muted text / table meta on the ground"),
    ("ink_3",        "surface",      4.5, "muted text / placeholder on a card"),
    ("on_ink",       "ink",          4.5, "label on the primary (ink) button"),
    ("line",         "ground",       1.0, "hairline rule (decorative, no target)"),
    ("line_strong",  "ground",       3.0, "input border / table divider — 1.4.11"),
    ("line_strong",  "surface",      3.0, "input border on a card — 1.4.11"),
    ("ink",          "ready_fill",   4.5, "text inside a READY chip / map tile"),
    ("ready",        "ground",       4.5, "READY label text on the ground"),
    ("ready",        "surface",      4.5, "READY label text on a card"),
    ("ready_edge",   "ground",       3.0, "READY dot / tile edge — 1.4.11"),
    ("ready_edge",   "surface",      3.0, "READY dot on a card — 1.4.11"),
    ("ink",          "risk_fill",    4.5, "text inside an AT RISK chip / map tile"),
    ("risk",         "ground",       4.5, "AT RISK label text on the ground"),
    ("risk",         "surface",      4.5, "AT RISK label text on a card"),
    ("risk_edge",    "ground",       3.0, "AT RISK dot / tile edge — 1.4.11"),
    ("risk_edge",    "surface",      3.0, "AT RISK dot on a card — 1.4.11"),
    ("ink",          "lapsed_fill",  4.5, "text inside a LAPSED chip / map tile"),
    ("lapsed",       "ground",       4.5, "LAPSED label text on the ground"),
    ("lapsed",       "surface",      4.5, "LAPSED label text on a card"),
    ("lapsed_edge",  "ground",       3.0, "LAPSED dot / tile edge — 1.4.11"),
    ("lapsed_edge",  "surface",      3.0, "LAPSED dot on a card — 1.4.11"),
    ("ink",          "unknown_fill", 4.5, "text inside a NOT TRACKED chip / map tile"),
    ("unknown",      "ground",       4.5, "NOT TRACKED label text on the ground"),
    ("unknown_edge", "ground",       3.0, "NOT TRACKED tile edge — 1.4.11"),
    ("ink_2",        "sunken",       4.5, "table column headers on the sunken header row"),
    ("ready_edge",   "ready_fill",   3.0, "READY chip border against its own fill — 1.4.11"),
    ("risk_edge",    "risk_fill",    3.0, "AT RISK chip border against its own fill — 1.4.11"),
    ("lapsed_edge",  "lapsed_fill",  3.0, "LAPSED chip border against its own fill — 1.4.11"),
    ("ink",          "ground",       3.0, "focus ring (ink) against the page ground — 1.4.11"),
    ("ink",          "surface",      3.0, "focus ring (ink) against a card — 1.4.11"),
]

# ------------------------------------------------------------- arithmetic
def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def luminance(hexstr: str) -> float:
    h = hexstr.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (0.2126 * srgb_to_linear(r)
            + 0.7152 * srgb_to_linear(g)
            + 0.0722 * srgb_to_linear(b))

def ratio(fg: str, bg: str) -> float:
    a, b = luminance(fg), luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)

# ----------------------------------------------------------------- report
def run(theme_name, tokens, md=False):
    rows, failures = [], []
    for fg, bg, target, what in PAIRS:
        r = ratio(tokens[fg], tokens[bg])
        ok = r + 1e-9 >= target
        if not ok:
            failures.append((theme_name, fg, bg, r, target, what))
        rows.append((fg, bg, tokens[fg], tokens[bg], r, target, ok, what))
    if md:
        print(f"\n**{theme_name}**\n")
        print("| foreground | background | ratio | target | pass | what it is |")
        print("|---|---|---:|---:|:--:|---|")
        for fg, bg, fgh, bgh, r, t, ok, what in rows:
            tgt = "—" if t <= 1.0 else f"{t:.1f}:1"
            print(f"| `--sr-{fg.replace('_','-')}` `{fgh}` | `--sr-{bg.replace('_','-')}` `{bgh}` "
                  f"| **{r:.2f}:1** | {tgt} | {'✅' if ok else '❌'} | {what} |")
    else:
        print(f"\n=== {theme_name} ===")
        for fg, bg, fgh, bgh, r, t, ok, what in rows:
            print(f"{'PASS' if ok else 'FAIL'}  {r:6.2f}:1  (>= {t:.1f})  "
                  f"{fg:<12} {fgh} on {bg:<12} {bgh}   {what}")
    return failures

def main():
    md = "--md" in sys.argv
    fails = run("Board theme (default)", BOARD, md) + run("Paper theme (alternate)", PAPER, md)
    smallest_text = min(
        ratio(t[fg], t[bg])
        for t in (BOARD, PAPER)
        for fg, bg, target, _w in PAIRS if target >= 4.5
    )
    smallest_nontext = min(
        ratio(t[fg], t[bg])
        for t in (BOARD, PAPER)
        for fg, bg, target, _w in PAIRS if 1.0 < target < 4.5
    )
    tail = (f"\nSmallest text margin: {smallest_text:.2f}:1 against a 4.5:1 requirement.\n"
            f"Smallest non-text margin: {smallest_nontext:.2f}:1 against a 3:1 requirement.\n"
            f"{len(fails)} failure(s).")
    print(tail if not md else "\n" + tail.strip())
    if fails:
        for th, fg, bg, r, t, what in fails:
            print(f"  FAIL {th}: {fg} on {bg} = {r:.2f}:1 (needs {t}) — {what}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
