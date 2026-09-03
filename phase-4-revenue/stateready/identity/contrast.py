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
LIGHT = {
    "paper":        "#FAF8F4",
    "surface":      "#FFFFFF",
    "sunken":       "#F0ECE4",
    "line":         "#DCD6CB",
    "line_strong":  "#877F72",
    "ink":          "#16130F",
    "ink_2":        "#4E4840",
    "ink_3":        "#6A635A",
    "ready":        "#1B6B3A",
    "ready_fill":   "#DCEEE2",
    "ready_edge":   "#3E8F5C",
    "risk":         "#8A5300",
    "risk_fill":    "#FAEACB",
    "risk_edge":    "#B07A1E",
    "lapsed":       "#A31E1E",
    "lapsed_fill":  "#F8DEDB",
    "lapsed_edge":  "#C24A44",
    "unknown":      "#6A635A",
    "unknown_fill": "#EDE9E1",
    "unknown_edge": "#877F72",
    "on_ink":       "#FAF8F4",
}
DARK = {
    "paper":        "#12100E",
    "surface":      "#1C1916",
    "sunken":       "#0B0A09",
    "line":         "#332E28",
    "line_strong":  "#7A7268",
    "ink":          "#F5F1EA",
    "ink_2":        "#C6BFB4",
    "ink_3":        "#9C9489",
    "ready":        "#63CE8E",
    "ready_fill":   "#12301F",
    "ready_edge":   "#3E8F5C",
    "risk":         "#E8B75F",
    "risk_fill":    "#332609",
    "risk_edge":    "#9A7526",
    "lapsed":       "#F29289",
    "lapsed_fill":  "#361816",
    "lapsed_edge":  "#B85248",
    "unknown":      "#9C9489",
    "unknown_fill": "#221F1B",
    "unknown_edge": "#7A7268",
    "on_ink":       "#12100E",
}

# (foreground, background, target, what it is)
PAIRS = [
    ("ink",          "paper",        4.5, "body text on the page ground"),
    ("ink",          "surface",      4.5, "body text on a card"),
    ("ink",          "sunken",       4.5, "body text on a sunken/table-header surface"),
    ("ink_2",        "paper",        4.5, "secondary text on the page ground"),
    ("ink_2",        "surface",      4.5, "secondary text on a card"),
    ("ink_3",        "paper",        4.5, "muted text / table meta on the page ground"),
    ("ink_3",        "surface",      4.5, "muted text / placeholder on a card"),
    ("on_ink",       "ink",          4.5, "label on the primary (ink) button"),
    ("line",         "paper",        1.0, "hairline rule (decorative, no target)"),
    ("line_strong",  "paper",        3.0, "input border / table divider — 1.4.11"),
    ("line_strong",  "surface",      3.0, "input border on a card — 1.4.11"),
    ("ink",          "ready_fill",   4.5, "text inside a READY chip / map tile"),
    ("ready",        "paper",        4.5, "READY label text on the page ground"),
    ("ready",        "surface",      4.5, "READY label text on a card"),
    ("ready_edge",   "paper",        3.0, "READY dot / tile edge — 1.4.11"),
    ("ready_edge",   "surface",      3.0, "READY dot on a card — 1.4.11"),
    ("ink",          "risk_fill",    4.5, "text inside an AT RISK chip / map tile"),
    ("risk",         "paper",        4.5, "AT RISK label text on the page ground"),
    ("risk",         "surface",      4.5, "AT RISK label text on a card"),
    ("risk_edge",    "paper",        3.0, "AT RISK dot / tile edge — 1.4.11"),
    ("risk_edge",    "surface",      3.0, "AT RISK dot on a card — 1.4.11"),
    ("ink",          "lapsed_fill",  4.5, "text inside a LAPSED chip / map tile"),
    ("lapsed",       "paper",        4.5, "LAPSED label text on the page ground"),
    ("lapsed",       "surface",      4.5, "LAPSED label text on a card"),
    ("lapsed_edge",  "paper",        3.0, "LAPSED dot / tile edge — 1.4.11"),
    ("lapsed_edge",  "surface",      3.0, "LAPSED dot on a card — 1.4.11"),
    ("ink",          "unknown_fill", 4.5, "text inside a NOT TRACKED chip / map tile"),
    ("unknown",      "paper",        4.5, "NOT TRACKED label text on the page ground"),
    ("unknown_edge", "paper",        3.0, "NOT TRACKED tile edge — 1.4.11"),
    ("ink_2",        "sunken",       4.5, "table column headers on the sunken header row"),
    ("ready_edge",   "ready_fill",   3.0, "READY chip border against its own fill — 1.4.11"),
    ("risk_edge",    "risk_fill",    3.0, "AT RISK chip border against its own fill — 1.4.11"),
    ("lapsed_edge",  "lapsed_fill",  3.0, "LAPSED chip border against its own fill — 1.4.11"),
    ("ink",          "paper",        3.0, "focus ring (ink) against the page ground — 1.4.11"),
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
    fails = run("Light theme", LIGHT, md) + run("Dark theme", DARK, md)
    smallest_text = min(
        ratio(t[fg], t[bg])
        for t, _ in ((LIGHT, 0), (DARK, 0))
        for fg, bg, target, _w in PAIRS if target >= 4.5
    )
    smallest_nontext = min(
        ratio(t[fg], t[bg])
        for t, _ in ((LIGHT, 0), (DARK, 0))
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
