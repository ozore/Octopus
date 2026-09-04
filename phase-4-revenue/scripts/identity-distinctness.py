#!/usr/bin/env python3
"""
identity-distinctness.py — the fleet-level guard on IDENTITY_ARBITRATION.md.

Three apps were designed in parallel by three agents and all three independently
landed on Public Sans + IBM Plex Mono on a warm paper ground. Individually each
argument was sound; together they produced one family wearing three names, which
is the opposite of what the founder asked for. IDENTITY_ARBITRATION.md
(2026-09-03) allocated a distinct typographic system and a distinct ground to
each app. This script is what stops that decision quietly eroding.

It parses the three `design-system.css` files directly — not a copy of their
values, not a manifest — and FAILS (exit 1) if:

  1. two apps declare the same font family in any font token, or
  2. two apps' default page grounds are closer than the declared thresholds,
     measured in CIELAB (dE76) and in HSL.

Usage
    python3 phase-4-revenue/scripts/identity-distinctness.py
    python3 phase-4-revenue/scripts/identity-distinctness.py --verbose
    python3 phase-4-revenue/scripts/identity-distinctness.py --json
    python3 phase-4-revenue/scripts/identity-distinctness.py --selftest

No third-party packages. Standard library only, so it runs in CI with nothing
installed.

WHAT IS AND IS NOT COMPARED
  - The *default* page ground of each app: the value the ground token carries on
    bare `:root`, which is what a first-time visitor actually sees. WageLens and
    Certly are light by default; StateReady's default is the board. Alternate
    themes (`prefers-color-scheme` blocks and `[data-theme=...]` blocks) are
    deliberately NOT compared: every dark canvas in the world is a near-black,
    so a rule over them would fail for reasons that carry no brand meaning.
  - Every family named in any `--*-font*` token, first name only (the branded
    face), lower-cased. Generic fallbacks (`sans-serif`, `ui-monospace`, system
    faces …) are shared on purpose and are ignored — the fallback stacks exist
    precisely so a blocked CDN degrades gracefully, and they carry no identity.
"""
from __future__ import annotations

import json
import math
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent

# ---------------------------------------------------------------------------
# What we check, and against which token. One row per app.
#   ground_token : the page-ground custom property, read from bare :root
# ---------------------------------------------------------------------------
APPS = [
    {"name": "WageLens",   "css": ROOT / "wagelens"   / "design-system.css", "ground_token": "--wl-graphite-25"},
    {"name": "Certly",     "css": ROOT / "certly"     / "design-system.css", "ground_token": "--c-paper"},
    {"name": "StateReady", "css": ROOT / "stateready" / "design-system.css", "ground_token": "--sr-ground"},
]

# ---------------------------------------------------------------------------
# Thresholds.
#
# IDENTITY_ARBITRATION.md 3.2 states the rule the founder asked for: the three
# grounds must differ "in temperature or in value". This gate encodes exactly
# that sentence and nothing stricter, in both colour spaces:
#
#   1. A HARD FLOOR on overall distance. Below it, two grounds are the same
#      paper by any measure. dE76 6.0 is about 2.5 just-noticeable differences.
#      For calibration, the three palettes this arbitration replaced measured
#      dE 0.34 (WageLens vs StateReady) and 2.10-2.42 (Certly vs either) — run
#      --selftest, which replays those exact values and asserts they FAIL.
#   2. SEPARATION ON AT LEAST ONE AXIS, in Lab: value (dL*) or temperature
#      (dC*ab, the chromatic distance in the a*/b* plane). A warm bone and a
#      cool white sit at almost the same lightness and are still obviously two
#      different papers; a deep board and a bone differ on value and need no
#      temperature argument at all. Requiring both would be a stricter rule
#      than the brief and would reject the brief's own worked example.
#   3. THE SAME TEST AGAIN IN HSL, because a reviewer will reach for HSL and
#      the two spaces should agree. Hue is only meaningful above MIN_SAT.
# ---------------------------------------------------------------------------
MIN_DELTA_E = 6.0       # 1. hard floor, dE76
MIN_DELTA_L = 8.0       # 2a. value, Lab L*
MIN_DELTA_C = 5.0       # 2b. temperature, Lab chroma distance sqrt(da*^2+db*^2)
MIN_HUE_DEG = 25.0      # 3a. HSL hue, circular distance; needs MIN_SAT
MIN_LIGHT_PCT = 5.0     # 3b. HSL lightness
MIN_SAT = 3.0           # below this the colour is neutral and hue is noise

# Families that are shared on purpose: they are fallbacks, not identity.
GENERIC = {
    "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-sans-serif", "ui-serif", "ui-monospace", "ui-rounded",
    "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica",
    "helvetica neue", "arial", "sfmono-regular", "sf mono", "cascadia mono",
    "menlo", "consolas", "monaco", "courier new", "georgia", "times new roman",
    "arial narrow", "roboto mono", "roboto condensed", "segoe ui variable text",
    "noto sans", "liberation sans", "emoji",
}


# ---------------------------------------------------------------------------
# Colour maths — WCAG-adjacent sRGB, then CIELAB via D65.
# ---------------------------------------------------------------------------
def hex_to_rgb(value: str) -> tuple[int, int, int]:
    h = value.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"not a 6-digit hex colour: {value!r}")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def _linear(c: float) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def to_lab(value: str) -> tuple[float, float, float]:
    r, g, b = (_linear(c) for c in hex_to_rgb(value))
    x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    xn, yn, zn = 0.95047, 1.00000, 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def delta_e76(a: str, b: str) -> float:
    la, lb = to_lab(a), to_lab(b)
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(la, lb)))


def to_hsl(value: str) -> tuple[float, float, float]:
    r, g, b = (c / 255.0 for c in hex_to_rgb(value))
    hi, lo = max(r, g, b), min(r, g, b)
    light = (hi + lo) / 2
    if hi == lo:
        return (0.0, 0.0, light * 100)
    d = hi - lo
    sat = d / (2 - hi - lo) if light > 0.5 else d / (hi + lo)
    if hi == r:
        hue = ((g - b) / d) % 6
    elif hi == g:
        hue = (b - r) / d + 2
    else:
        hue = (r - g) / d + 4
    return (hue * 60, sat * 100, light * 100)


def hue_distance(h1: float, h2: float) -> float:
    d = abs(h1 - h2) % 360
    return min(d, 360 - d)


# ---------------------------------------------------------------------------
# CSS parsing. Deliberately small and explicit: we want to read what the app
# actually ships, and to be loud when we cannot find it.
# ---------------------------------------------------------------------------
COMMENT = re.compile(r"/\*.*?\*/", re.S)
FONT_TOKEN = re.compile(r"(--[a-z0-9-]*font[a-z0-9-]*)\s*:\s*([^;]+);", re.I)


def strip_comments(css: str) -> str:
    return COMMENT.sub("", css)


def default_root_block(css: str) -> str:
    """
    Concatenate every `:root { ... }` block that is NOT inside an @media block
    and NOT qualified by a `[data-theme=...]` selector. That is the app's
    default theme — the one a first-time visitor sees.
    """
    out: list[str] = []
    i = 0
    while True:
        m = re.compile(r"(^|[\s}])(:root\s*\{)", re.M).search(css, i)
        if not m:
            break
        start = m.end(2)
        # the selector text immediately before the brace
        sel_start = css.rfind("}", 0, m.start(2))
        sel = css[sel_start + 1:m.start(2)]
        depth = 1
        j = start
        while j < len(css) and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        block = css[start:j - 1]
        i = j
        if "data-theme" in sel:
            continue
        if inside_at_rule(css, m.start(2)):
            continue
        out.append(block)
    return "\n".join(out)


def inside_at_rule(css: str, pos: int) -> bool:
    """True if `pos` sits inside an @media / @supports / @layer-with-block."""
    depth = 0
    for m in re.finditer(r"[{}]|@media|@supports", css[:pos]):
        t = m.group(0)
        if t == "{":
            depth += 1
        elif t == "}":
            depth -= 1
    # A bare `@layer x { ... }` wrapper (WageLens uses one) is not a theme
    # condition, so only count conditional at-rules.
    for m in re.finditer(r"@(media|supports)[^{]*\{", css[:pos]):
        close = matching_close(css, m.end() - 1)
        if close > pos:
            return True
    return False


def matching_close(css: str, open_brace: int) -> int:
    depth = 0
    for k in range(open_brace, len(css)):
        if css[k] == "{":
            depth += 1
        elif css[k] == "}":
            depth -= 1
            if depth == 0:
                return k
    return len(css)


def read_ground(css: str, token: str) -> str:
    """
    Resolve the ground token from the default :root block, following one level
    of var() indirection (WageLens's semantic tier points at a primitive).
    """
    block = default_root_block(css)
    decls = dict(re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", block, re.I))
    if token not in decls:
        raise KeyError(f"ground token {token} not found on bare :root")
    value = decls[token].strip()
    seen = 0
    while value.startswith("var(") and seen < 4:
        inner = value[4:value.index(")")].split(",")[0].strip()
        value = decls[inner].strip()
        seen += 1
    m = re.search(r"#[0-9a-fA-F]{3,8}", value)
    if not m:
        raise ValueError(f"ground token {token} does not resolve to a hex: {value!r}")
    return m.group(0).upper()


def read_families(css: str) -> dict[str, str]:
    """{first branded family (lower-cased) -> the token that declared it}."""
    found: dict[str, str] = {}
    for token, value in FONT_TOKEN.findall(css):
        # a font token, not a font-size / font-weight alias
        if re.search(r"font-(size|weight|style|feature)", token, re.I):
            continue
        first = value.split(",")[0].strip().strip("'\"")
        if not first or first.lower() in GENERIC:
            continue
        if not re.match(r"^[A-Za-z][A-Za-z0-9 .+-]*$", first):
            continue
        found.setdefault(first.lower(), token)
    return found


# ---------------------------------------------------------------------------
# The checks
# ---------------------------------------------------------------------------
def compare_grounds(x: str, y: str) -> dict:
    """Apply the three-part gate above to one pair of grounds."""
    lx, ax, bx = to_lab(x)
    ly, ay, by = to_lab(y)
    de = delta_e76(x, y)
    d_l = abs(lx - ly)
    d_c = math.hypot(ax - ay, bx - by)
    hx, sx, hslx = to_hsl(x)
    hy, sy, hsly = to_hsl(y)
    d_hue = hue_distance(hx, hy) if min(sx, sy) >= MIN_SAT else None
    d_hsl_l = abs(hslx - hsly)

    floor_ok = de >= MIN_DELTA_E
    lab_ok = d_l >= MIN_DELTA_L or d_c >= MIN_DELTA_C
    hsl_ok = (d_hue is not None and d_hue >= MIN_HUE_DEG) or d_hsl_l >= MIN_LIGHT_PCT

    why: list[str] = []
    if not floor_ok:
        why.append(f"dE76 {de:.2f} < {MIN_DELTA_E} (the same paper by any measure)")
    if not lab_ok:
        why.append(f"Lab: value dL* {d_l:.2f} < {MIN_DELTA_L} and temperature "
                   f"dC*ab {d_c:.2f} < {MIN_DELTA_C}")
    if not hsl_ok:
        hue_txt = "neutral, hue not comparable" if d_hue is None else f"{d_hue:.1f}deg"
        why.append(f"HSL: hue {hue_txt} and lightness {d_hsl_l:.1f}% both below "
                   f"{MIN_HUE_DEG}deg / {MIN_LIGHT_PCT}%")
    return {
        "delta_e": round(de, 2),
        "delta_lab_l": round(d_l, 2),
        "delta_lab_c": round(d_c, 2),
        "delta_hue": None if d_hue is None else round(d_hue, 1),
        "delta_light": round(d_hsl_l, 1),
        "pass": floor_ok and lab_ok and hsl_ok,
        "why": why,
    }


# The three grounds this arbitration replaced, kept verbatim so the gate can be
# shown to reject them. If a future edit loosens the thresholds far enough to
# let these through, --selftest fails and says so.
PRE_ARBITRATION = {
    "WageLens (was)":   "#FBF9F5",
    "Certly (was)":     "#F3F3EE",
    "StateReady (was)": "#FAF8F4",
}


def selftest() -> int:
    print("SELF-TEST — the gate must reject the three grounds this arbitration replaced")
    print("=" * 78)
    names = list(PRE_ARBITRATION)
    bad = 0
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            r = compare_grounds(PRE_ARBITRATION[a], PRE_ARBITRATION[b])
            verdict = "still passes — GATE TOO LOOSE" if r["pass"] else "correctly rejected"
            if r["pass"]:
                bad += 1
            print(f"  {a:<18} vs {b:<18} dE={r['delta_e']:>6.2f}  {verdict}")
    print("=" * 78)
    print("self-test PASSED: every pre-arbitration pair is rejected." if not bad
          else f"self-test FAILED: {bad} pre-arbitration pair(s) would pass.")
    return 1 if bad else 0


def main() -> int:
    verbose = "--verbose" in sys.argv
    as_json = "--json" in sys.argv
    if "--selftest" in sys.argv:
        return selftest()

    apps = []
    failures: list[str] = []

    for spec in APPS:
        path = spec["css"]
        if not path.exists():
            failures.append(f"{spec['name']}: {path} does not exist")
            continue
        raw = strip_comments(path.read_text(encoding="utf-8"))
        try:
            ground = read_ground(raw, spec["ground_token"])
        except (KeyError, ValueError) as exc:
            failures.append(f"{spec['name']}: {exc}")
            continue
        families = read_families(raw)
        if not families:
            failures.append(f"{spec['name']}: no branded font family declared")
        apps.append({
            "name": spec["name"],
            "css": str(path.relative_to(ROOT)),
            "ground": ground,
            "ground_token": spec["ground_token"],
            "lab": [round(v, 2) for v in to_lab(ground)],
            "hsl": [round(v, 1) for v in to_hsl(ground)],
            "families": families,
        })

    # ---- 1. no shared branded typeface -----------------------------------
    font_pairs = []
    for i in range(len(apps)):
        for j in range(i + 1, len(apps)):
            a, b = apps[i], apps[j]
            shared = sorted(set(a["families"]) & set(b["families"]))
            font_pairs.append({"a": a["name"], "b": b["name"], "shared": shared})
            for fam in shared:
                failures.append(
                    f"SHARED TYPEFACE: {a['name']} ({a['families'][fam]}) and "
                    f"{b['name']} ({b['families'][fam]}) both declare "
                    f"\"{fam.title()}\". IDENTITY_ARBITRATION.md §3 allows no "
                    f"two apps to share a UI or mono typeface."
                )

    # ---- 2. grounds far enough apart --------------------------------------
    ground_pairs = []
    for i in range(len(apps)):
        for j in range(i + 1, len(apps)):
            a, b = apps[i], apps[j]
            r = compare_grounds(a["ground"], b["ground"])
            r.update({"a": a["name"], "b": b["name"],
                      "a_hex": a["ground"], "b_hex": b["ground"]})
            ground_pairs.append(r)
            if not r["pass"]:
                failures.append(
                    f"GROUNDS TOO CLOSE: {a['name']} {a['ground']} vs "
                    f"{b['name']} {b['ground']} — " + "; ".join(r["why"]) + ". "
                    f"IDENTITY_ARBITRATION.md §3 requires the three default "
                    f"grounds to differ in temperature or in value."
                )

    if as_json:
        print(json.dumps({"apps": apps, "grounds": ground_pairs,
                          "fonts": font_pairs, "failures": failures}, indent=2))
        return 1 if failures else 0

    print("phase-4 identity distinctness — IDENTITY_ARBITRATION.md, 2026-09-03")
    print("=" * 78)
    print("\nDEFAULT GROUNDS (bare :root; alternate themes are not compared)")
    print(f"  {'app':<12}{'token':<18}{'hex':<10}{'L*':>7}{'a*':>7}{'b*':>7}{'hue':>7}{'sat':>7}")
    for a in apps:
        L, A, B = a["lab"]
        h, s_, l_ = a["hsl"]
        print(f"  {a['name']:<12}{a['ground_token']:<18}{a['ground']:<10}"
              f"{L:>7.2f}{A:>7.2f}{B:>7.2f}{h:>7.1f}{s_:>7.1f}")
    print(f"\n  pairwise gate: dE76 >= {MIN_DELTA_E}"
          f"  AND  (Lab dL* >= {MIN_DELTA_L} OR Lab dC*ab >= {MIN_DELTA_C})"
          f"  AND  (HSL hue >= {MIN_HUE_DEG}deg OR HSL dL >= {MIN_LIGHT_PCT}%)")
    for p in ground_pairs:
        hue = "n/a" if p["delta_hue"] is None else f"{p['delta_hue']:.1f}"
        print(f"    {p['a']:<11} vs {p['b']:<11} dE={p['delta_e']:>7.2f}  "
              f"dL*={p['delta_lab_l']:>6.2f}  dC*={p['delta_lab_c']:>5.2f}  "
              f"dHue={hue:>6}  dL={p['delta_light']:>5.1f}%   "
              f"{'PASS' if p['pass'] else 'FAIL  <-- FIX'}")

    print("\nBRANDED TYPEFACES (generic fallback stacks ignored)")
    for a in apps:
        fams = ", ".join(f"{k.title()} ({v})" for k, v in sorted(a["families"].items()))
        print(f"  {a['name']:<12}{fams}")
    print("\n  pairwise (no two apps may share a family)")
    for p in font_pairs:
        state = "PASS" if not p["shared"] else "FAIL  <-- FIX: " + ", ".join(
            f.title() for f in p["shared"])
        print(f"    {p['a']:<11} vs {p['b']:<11} {state}")

    if verbose:
        print("\nSOURCES")
        for a in apps:
            print(f"  {a['name']:<12}{a['css']}")

    print("\n" + "=" * 78)
    if failures:
        print(f"{len(failures)} FAILURE(S):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"All checks pass: {len(apps)} apps, "
          f"{len(ground_pairs)} ground pairs, {len(font_pairs)} typeface pairs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
