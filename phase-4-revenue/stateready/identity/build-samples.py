#!/usr/bin/env python3
"""
Builds identity/samples.html — the visual proof of design-system.css.

Kept as a generator rather than hand-written HTML because the 51-tile state grid
and the token swatch tables are mechanical, and because the contrast ratios
printed on the swatches must come from identity/contrast.py rather than from a
designer's memory. Re-run after any token change:

    python3 identity/build-samples.py && python3 identity/contrast.py

The output imports exactly one external resource — Google Fonts, pulled in by
design-system.css's @import. Nothing else leaves the page.
"""
import importlib.util
import os
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("contrast", HERE / "contrast.py")
contrast = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contrast)
L, ratio = contrast.LIGHT, contrast.ratio

# --------------------------------------------------------------- the tile grid
# 50 states + DC on the conventional 11-column US tile grid. Equal weight per
# jurisdiction — see IDENTITY.md §7.1 for why this is not a geographic map.
GRID = [
    ("AK", 1, 1), ("ME", 1, 11),
    ("VT", 2, 10), ("NH", 2, 11),
    ("WA", 3, 1), ("ID", 3, 2), ("MT", 3, 3), ("ND", 3, 4), ("MN", 3, 5), ("IL", 3, 6),
    ("WI", 3, 7), ("MI", 3, 8), ("NY", 3, 9), ("RI", 3, 10), ("MA", 3, 11),
    ("OR", 4, 1), ("NV", 4, 2), ("WY", 4, 3), ("SD", 4, 4), ("IA", 4, 5), ("IN", 4, 6),
    ("OH", 4, 7), ("PA", 4, 8), ("NJ", 4, 9), ("CT", 4, 10),
    ("CA", 5, 1), ("UT", 5, 2), ("CO", 5, 3), ("NE", 5, 4), ("MO", 5, 5), ("KY", 5, 6),
    ("WV", 5, 7), ("VA", 5, 8), ("MD", 5, 9), ("DE", 5, 10),
    ("AZ", 6, 2), ("NM", 6, 3), ("KS", 6, 4), ("AR", 6, 5), ("TN", 6, 6), ("NC", 6, 7),
    ("SC", 6, 8), ("DC", 6, 9),
    ("OK", 7, 4), ("LA", 7, 5), ("MS", 7, 6), ("AL", 7, 7), ("GA", 7, 8),
    ("HI", 8, 1), ("TX", 8, 4), ("FL", 8, 8),
]

# Sample operating footprint. Fictitious company, fictitious counts.
STATUS = {
    "TX": ("lapsed", 2, "1 ACR contractor licence expired 12 days ago"),
    "OH": ("risk", 2, "2 journeyman licences expire within 30 days"),
    "IL": ("risk", 1, "1 plumber renewal due 30 April"),
    "NJ": ("risk", 1, "1 electrical CE cycle short by 10 live hours"),
    "OK": ("ready", 0, "3 licences current"),
    "LA": ("ready", 0, "2 licences current"),
    "AR": ("ready", 0, "1 licence current"),
    "MO": ("ready", 0, "2 licences current"),
    "KS": ("ready", 0, "1 licence current"),
    "IN": ("ready", 0, "2 licences current"),
    "CA": ("none", 0, "Not operating. Expansion report available"),
    "NM": ("none", 0, "Not operating. Expansion report available"),
}
GLYPH = {"ready": "✓", "risk": "◑", "lapsed": "✕", "none": "", "unknown": "—"}
WORD = {"ready": "Ready", "risk": "At risk", "lapsed": "Lapsed",
        "none": "Not operating", "unknown": "Not tracked"}


def tiles() -> str:
    out = []
    for ab, r, c in GRID:
        st, badge, note = STATUS.get(ab, ("none", 0, "Not operating"))
        g = GLYPH[st]
        b = f'<span class="sr-tile__badge" aria-hidden="true">{badge}</span>' if badge else ""
        glyph = f'<span class="sr-tile__glyph" aria-hidden="true">{g}</span>' if g else ""
        out.append(
            f'      <li style="grid-row:{r};grid-column:{c}">'
            f'<button type="button" class="sr-tile" data-status="{st}" '
            f'aria-label="{ab} — {WORD[st]}. {note}">'
            f'<span aria-hidden="true">{ab}</span>{glyph}{b}</button></li>'
        )
    return "\n".join(out)


def swatches(keys) -> str:
    rows = []
    for k in keys:
        hexv = L[k]
        r_paper = ratio(hexv, L["paper"])
        rows.append(
            f'    <div class="sw">\n'
            f'      <div class="sr-swatch" style="background:{hexv}"></div>\n'
            f'      <div><code>--sr-{k.replace("_", "-")}</code>'
            f'<span class="sr-meta">{hexv} · {r_paper:.2f}:1 on paper</span></div>\n'
            f'    </div>'
        )
    return "\n".join(rows)


TYPE_SCALE = [("--sr-text-4xl", "3rem / 48px", "Landing hero only"),
              ("--sr-text-3xl", "2.25rem / 36px", "The one big number"),
              ("--sr-text-2xl", "1.75rem / 28px", "Page title"),
              ("--sr-text-xl", "1.375rem / 22px", "Section heading"),
              ("--sr-text-lg", "1.125rem / 18px", "Lead, card title"),
              ("--sr-text-base", "1rem / 16px", "Body — the floor for prose"),
              ("--sr-text-sm", "0.875rem / 14px", "Secondary UI, table body"),
              ("--sr-text-xs", "0.75rem / 12px", "Meta, provenance line"),
              ("--sr-text-2xs", "0.6875rem / 11px", "Tile labels, badges")]


def type_rows() -> str:
    return "\n".join(
        f'        <tr><td style="font-size:var({t})">Ohio journeyman, 11 days</td>'
        f'<td><code>{t}</code></td><td class="sr-num">{v}</td><td class="sr-meta">{u}</td></tr>'
        for t, v, u in TYPE_SCALE)


SPACE = [("--sr-space-1", "0.25rem", 4), ("--sr-space-2", "0.5rem", 8),
         ("--sr-space-3", "0.75rem", 12), ("--sr-space-4", "1rem", 16),
         ("--sr-space-5", "1.5rem", 24), ("--sr-space-6", "2rem", 32),
         ("--sr-space-7", "3rem", 48), ("--sr-space-8", "4rem", 64),
         ("--sr-space-9", "6rem", 96)]


def space_rows() -> str:
    return "\n".join(
        f'        <tr><td><code>{t}</code></td><td class="sr-num">{v}</td>'
        f'<td><div style="block-size:0.75rem;inline-size:{v};background:var(--sr-ink-3);'
        f'border-radius:2px"></div></td></tr>' for t, v, _px in SPACE)


HTML = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StateReady — design system samples</title>
<link rel="stylesheet" href="../design-system.css">
<style>
  /* Page chrome for this sample sheet only. Not part of the design system. */
  .sheet {{ max-inline-size: var(--sr-content-max); margin-inline: auto; padding: var(--sr-space-6) var(--sr-space-5) var(--sr-space-9); }}
  .sec {{ margin-block-start: var(--sr-space-8); }}
  .sec > h2 {{ padding-block-end: var(--sr-space-2); border-block-end: 2px solid var(--sr-ink); }}
  .sw {{ display: flex; gap: var(--sr-space-3); align-items: center; }}
  .sw code {{ display: block; font-size: var(--sr-text-xs); }}
  .sw .sr-meta {{ display: block; }}
  .swatches {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: var(--sr-space-4); }}
  .demo {{ display: flex; flex-wrap: wrap; gap: var(--sr-space-3); align-items: center; }}
  .topbar {{ display: flex; gap: var(--sr-space-4); align-items: center; justify-content: space-between;
             padding: var(--sr-space-3) var(--sr-space-5); border-block-end: 1px solid var(--sr-line);
             background: var(--sr-surface); position: sticky; inset-block-start: 0; z-index: 5; }}
  .brand {{ display: flex; align-items: center; gap: var(--sr-space-2); font-weight: 700; letter-spacing: -0.01em; }}
  .mark {{ inline-size: 1.5rem; block-size: 1.5rem; border-radius: var(--sr-radius-sm);
           background: var(--sr-ready); color: #fff; display: grid; place-items: center; font-size: 0.85rem; }}
</style>
</head>
<body>

<header class="topbar">
  <span class="brand"><span class="mark" aria-hidden="true">✓</span> StateReady <span class="sr-meta">design system v1</span></span>
  <button type="button" class="sr-btn sr-btn--secondary" id="theme">Switch to dark</button>
</header>

<div class="sheet">

<p class="sr-eyebrow">Identity proof sheet</p>
<h1>Tokens, components and one real screen</h1>
<p class="sr-lead">Everything below is rendered by <code>design-system.css</code>. The only external
resource on this page is Google Fonts, imported by that stylesheet. Contrast ratios printed beside the
swatches are computed by <code>identity/contrast.py</code>, which exits non-zero if any declared pair
fails — 70 pairs across both themes, 0 failures at the time of writing.</p>

<div class="sr-banner" data-status="risk">
  <span class="sr-banner__glyph" aria-hidden="true">◑</span>
  <span><strong>Sample data.</strong> The company, the technicians and the licence numbers on this page
  are fictitious. No real person or organisation appears anywhere in this file.</span>
</div>

<!-- ============================================================ THE SCREEN -->
<section class="sec">
  <h2>1. The screen the buyer judges us on — compliance dashboard</h2>
  <p>One question per pane. The map answers <em>where</em>. The runway answers <em>when</em>. Neither
  is ever drawn on top of the other.</p>

  <div class="sr-card">
    <div class="sr-card__head">
      <div>
        <p class="sr-eyebrow sr-mb-0">Northline Mechanical Group · 34 technicians · 10 states</p>
        <h3 class="sr-card__title">Readiness, 3 September 2026</h3>
      </div>
      <div class="demo">
        <button type="button" class="sr-btn sr-btn--secondary">Export compliance PDF</button>
        <button type="button" class="sr-btn sr-btn--primary">Add technician</button>
      </div>
    </div>

    <div class="sr-grid">
      <!-- stats -->
      <div class="sr-col-12">
        <div class="sr-grid">
          <div class="sr-col-4"><div class="sr-stat" data-status="lapsed">
            <span class="sr-stat__value">1</span><span class="sr-stat__label">licence lapsed — Texas ACR, 12 days ago</span></div></div>
          <div class="sr-col-4"><div class="sr-stat" data-status="risk">
            <span class="sr-stat__value">6</span><span class="sr-stat__label">expire within 90 days, across 3 states</span></div></div>
          <div class="sr-col-4"><div class="sr-stat" data-status="ready">
            <span class="sr-stat__value">41</span><span class="sr-stat__label">credentials current</span></div></div>
        </div>
      </div>

      <!-- map -->
      <div class="sr-col-7">
        <h4>Where you can work</h4>
        <div class="sr-map">
          <ul class="sr-map__grid" style="--sr-map-cols:11" aria-label="Readiness by state">
{tiles()}
          </ul>
          <div class="sr-map__legend">
            <span class="sr-map__legend-item"><span class="sr-dot" data-status="ready"></span> Ready</span>
            <span class="sr-map__legend-item"><span class="sr-dot" data-status="risk"></span> At risk</span>
            <span class="sr-map__legend-item"><span class="sr-dot" data-status="lapsed"></span> Lapsed</span>
            <span class="sr-map__legend-item"><span class="sr-dot"></span> Not tracked</span>
            <span class="sr-map__legend-item"><span class="sr-swatch" style="inline-size:.75rem;block-size:.75rem;border-style:dashed;background:var(--sr-paper)"></span> Not operating — expansion report available</span>
          </div>
        </div>
        <p class="sr-meta sr-mt-6">Every jurisdiction gets the same tile, because your exposure has
        nothing to do with land area. Each tile is a button in reading order with its status in its
        accessible name, so the map is a list to a screen reader.</p>
      </div>

      <!-- runway -->
      <div class="sr-col-5">
        <h4>What breaks first</h4>
        <div class="sr-runway" aria-hidden="true">
          <div class="sr-runway__scale">
            <div class="sr-runway__band" data-status="lapsed" style="inset-inline-start:0;inline-size:6%"></div>
            <div class="sr-runway__band" data-status="risk" style="inset-inline-start:6%;inline-size:19%"></div>
            <div class="sr-runway__gate" style="inset-inline-start:6%"><span>0</span></div>
            <div class="sr-runway__gate" style="inset-inline-start:12%"><span>7</span></div>
            <div class="sr-runway__gate" style="inset-inline-start:25%"><span>30</span></div>
            <div class="sr-runway__gate" style="inset-inline-start:45%"><span>60</span></div>
            <div class="sr-runway__gate" style="inset-inline-start:65%"><span>90d</span></div>
          </div>
          <div class="sr-runway__lane"><span class="sr-runway__label">TX · ACR contractor</span>
            <span class="sr-runway__track"><span class="sr-runway__marker" data-status="lapsed" style="inset-inline-start:2%"></span></span></div>
          <div class="sr-runway__lane"><span class="sr-runway__label">OH · journeyman ×2</span>
            <span class="sr-runway__track"><span class="sr-runway__marker" data-status="risk" style="inset-inline-start:16%"></span></span></div>
          <div class="sr-runway__lane"><span class="sr-runway__label">NJ · electrical CE</span>
            <span class="sr-runway__track"><span class="sr-runway__marker" data-status="risk" style="inset-inline-start:31%"></span></span></div>
          <div class="sr-runway__lane"><span class="sr-runway__label">IL · plumber (30 Apr)</span>
            <span class="sr-runway__track"><span class="sr-runway__marker" data-status="risk" style="inset-inline-start:52%"></span></span></div>
          <div class="sr-runway__lane"><span class="sr-runway__label">OK · master electrician</span>
            <span class="sr-runway__track"><span class="sr-runway__marker" data-status="ready" style="inset-inline-start:78%"></span></span></div>
        </div>
        <ul class="sr-visually-hidden">
          <li>Texas ACR contractor licence: expired 12 days ago.</li>
          <li>Ohio journeyman, two licences: expire in 11 days.</li>
          <li>New Jersey electrical continuing education: cycle closes in 26 days.</li>
          <li>Illinois plumber: renewal due 30 April, in 58 days.</li>
          <li>Oklahoma master electrician: expires in 104 days.</li>
        </ul>
      </div>

      <!-- expiring list -->
      <div class="sr-col-12">
        <h4>Expiring next</h4>
        <div class="sr-table-wrap">
          <table class="sr-table">
            <thead><tr>
              <th scope="col">Status</th><th scope="col">Technician</th><th scope="col">Credential</th>
              <th scope="col">State</th><th scope="col">Number</th><th scope="col">Expires</th><th scope="col">Days</th>
            </tr></thead>
            <tbody>
              <tr><td><span class="sr-dot" data-status="lapsed"></span> Lapsed</td>
                  <td>Tech 04 (sample)</td><td>ACR contractor</td><td>TX</td>
                  <td class="sr-num">TACLA0000000C</td><td class="sr-num">22 Aug 2026</td><td class="sr-num">−12</td></tr>
              <tr><td><span class="sr-dot" data-status="risk"></span> At risk</td>
                  <td>Tech 11 (sample)</td><td>Journeyman HVAC</td><td>OH</td>
                  <td class="sr-num">OH-J-000000</td><td class="sr-num">14 Sep 2026</td><td class="sr-num">11</td></tr>
              <tr><td><span class="sr-dot" data-status="risk"></span> At risk</td>
                  <td>Tech 19 (sample)</td><td>Journeyman HVAC</td><td>OH</td>
                  <td class="sr-num">OH-J-000001</td><td class="sr-num">14 Sep 2026</td><td class="sr-num">11</td></tr>
              <tr><td><span class="sr-dot" data-status="risk"></span> At risk</td>
                  <td>Tech 02 (sample)</td><td>Electrical CE cycle</td><td>NJ</td>
                  <td class="sr-num">—</td><td class="sr-num">29 Sep 2026</td><td class="sr-num">26</td></tr>
              <tr><td><span class="sr-dot" data-status="ready"></span> Ready</td>
                  <td>Tech 07 (sample)</td><td>Master electrician</td><td>OK</td>
                  <td class="sr-num">OK-ME-00000</td><td class="sr-num">16 Dec 2026</td><td class="sr-num">104</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- licence card -->
      <div class="sr-col-6">
        <h4>One technician's licence card</h4>
        <article class="sr-card sr-card--licence" data-status="risk">
          <div class="sr-card__head">
            <div>
              <h3 class="sr-card__title">Journeyman HVAC · Ohio</h3>
              <p class="sr-meta sr-mb-0">Tech 11 (sample) · Northline Mechanical Group</p>
            </div>
            <span class="sr-chip" data-status="risk"><span class="sr-chip__glyph" aria-hidden="true">◑</span> At risk</span>
          </div>
          <dl class="sr-dl">
            <dt>Licence number</dt><dd class="sr-mono">OH-J-000000</dd>
            <dt>Issuing board</dt><dd>Ohio Construction Industry Licensing Board</dd>
            <dt>Issued</dt><dd class="sr-mono">14 Sep 2023</dd>
            <dt>Expires</dt><dd class="sr-mono">14 Sep 2026 — <strong>11 days</strong></dd>
            <dt>Renewal window</dt><dd class="sr-mono">opens 60 days before expiry</dd>
          </dl>

          <div class="sr-mt-6">
            <div class="sr-meter" data-status="risk">
              <div class="sr-meter__head">
                <span>Continuing education, current cycle</span>
                <span class="sr-meter__value">6 / 10 h</span>
              </div>
              <div class="sr-meter__track" role="img" aria-label="6 of 10 continuing education hours completed">
                <div class="sr-meter__fill" style="inline-size:60%"></div>
              </div>
              <span class="sr-meter__rule">10 hours per 3-year cycle. 1 hour must cover Ohio law.
              4 hours outstanding, and the cycle closes with the licence.</span>
            </div>
          </div>

          <p class="sr-source" data-confidence="high">
            <span class="sr-source__conf">High confidence</span>
            <span>Source: <a href="#">Ohio Construction Industry Licensing Board — renewal</a></span>
            <span>Checked 3 Sep 2026</span>
            <span>Verified by 2 agents</span>
          </p>
        </article>
      </div>

      <!-- alert feed -->
      <div class="sr-col-6">
        <h4>Alert feed</h4>
        <div class="sr-card">
          <ul class="sr-feed" aria-live="polite">
            <li class="sr-feed__item"><span class="sr-feed__date">3 Sep</span><span class="sr-feed__state">TX</span>
              <span class="sr-feed__what"><strong>ACR contractor licence lapsed 12 days ago.</strong> Late renewal under 90 days costs 1.5× the fee. Renew now.</span></li>
            <li class="sr-feed__item"><span class="sr-feed__date">1 Sep</span><span class="sr-feed__state">CA</span>
              <span class="sr-feed__what"><strong>Rule change.</strong> Civil penalty floor for unlicensed contracting rose to $1,500 on 1 July 2026. You do not operate in California — no action.</span></li>
            <li class="sr-feed__item"><span class="sr-feed__date">28 Aug</span><span class="sr-feed__state">OH</span>
              <span class="sr-feed__what">2 journeyman licences entered the 30-day window. Renewal window is open.</span></li>
            <li class="sr-feed__item"><span class="sr-feed__date">21 Aug</span><span class="sr-feed__state">—</span>
              <span class="sr-feed__what">Import complete: 34 technicians, 48 credentials, 4 rows needing an expiry date.</span></li>
          </ul>
        </div>
      </div>
    </div>

    <p class="sr-disclaimer">StateReady is an information product. It is not a filing agent, a licence
    service or a law firm, and it does not submit applications or renewals on your behalf. Every
    requirement shown carries the issuing board's own link and the date we last checked it; verify
    anything you are about to rely on.</p>
  </div>
</section>

<!-- ============================================================== COLOUR -->
<section class="sec">
  <h2>2. Colour</h2>
  <p>Two families and nothing else. Warm paper and warm ink carry all chrome; the readiness ramp is
  the only saturated colour in the system and appears only inside status objects. There is no brand
  hue and no blue at any weight.</p>

  <h3>Ground and ink</h3>
  <div class="swatches">
{swatches(["paper", "surface", "sunken", "line", "line_strong", "ink", "ink_2", "ink_3"])}
  </div>

  <h3 class="sr-mt-6">The readiness ramp</h3>
  <div class="swatches">
{swatches(["ready", "ready_fill", "ready_edge", "risk", "risk_fill", "risk_edge",
           "lapsed", "lapsed_fill", "lapsed_edge", "unknown", "unknown_fill", "unknown_edge"])}
  </div>

  <h3 class="sr-mt-6">Status is never colour alone</h3>
  <p>Colour, glyph, hatch and word ship together. Print this page: the hatches appear and the four
  statuses stay separable in black and white.</p>
  <div class="demo">
    <span class="sr-chip" data-status="ready"><span class="sr-chip__glyph" aria-hidden="true">✓</span> Ready</span>
    <span class="sr-chip" data-status="risk"><span class="sr-chip__glyph" aria-hidden="true">◑</span> At risk</span>
    <span class="sr-chip" data-status="lapsed"><span class="sr-chip__glyph" aria-hidden="true">✕</span> Lapsed</span>
    <span class="sr-chip"><span class="sr-chip__glyph" aria-hidden="true">—</span> Not tracked</span>
  </div>
  <p class="sr-mt-6">Where a chip is too heavy — inside a table cell or a sentence — the status word
  stands alone in <code>.sr-status-text</code>, always next to a dot:
    <span class="sr-nowrap"><span class="sr-dot" data-status="lapsed"></span> <span class="sr-status-text" data-status="lapsed">Lapsed</span></span>,
    <span class="sr-nowrap"><span class="sr-dot" data-status="risk"></span> <span class="sr-status-text" data-status="risk">At risk</span></span>,
    <span class="sr-nowrap"><span class="sr-dot" data-status="ready"></span> <span class="sr-status-text" data-status="ready">Ready</span></span>,
    <span class="sr-nowrap"><span class="sr-dot"></span> <span class="sr-status-text">Not tracked</span></span>.
  </p>
</section>

<!-- ========================================================= TYPOGRAPHY -->
<section class="sec">
  <h2>3. Typography</h2>
  <p>Public Sans for everything a person reads, IBM Plex Mono for everything a person compares down a
  column — licence numbers, dates, hour counts, day counts. Both from Google Fonts. Every size is in
  <code>rem</code>, so the interface scales with the reader's root font size.</p>
  <div class="sr-table-wrap">
    <table class="sr-table">
      <thead><tr><th scope="col">Sample</th><th scope="col">Token</th><th scope="col">Size</th><th scope="col">Use</th></tr></thead>
      <tbody>
{type_rows()}
      </tbody>
    </table>
  </div>
  <p class="sr-mt-6"><span class="sr-mono">TACLA0000000C · 14 Sep 2026 · 6 / 10 h · −12 d</span>
  <span class="sr-meta">Tabular figures: every glyph the same width, so a transposed digit is visible.</span></p>
</section>

<!-- ============================================================ SPACING -->
<section class="sec">
  <h2>4. Space, radius, elevation</h2>
  <div class="sr-grid">
    <div class="sr-col-6">
      <h3>Space — 4px base</h3>
      <div class="sr-table-wrap">
        <table class="sr-table sr-table--compact">
          <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col"></th></tr></thead>
          <tbody>
{space_rows()}
          </tbody>
        </table>
      </div>
    </div>
    <div class="sr-col-6">
      <h3>Radius and elevation</h3>
      <div class="demo">
        <div class="sr-swatch" style="border-radius:var(--sr-radius-sm);background:var(--sr-sunken)"></div>
        <div class="sr-swatch" style="border-radius:var(--sr-radius-md);background:var(--sr-sunken)"></div>
        <div class="sr-swatch" style="border-radius:var(--sr-radius-lg);background:var(--sr-sunken)"></div>
      </div>
      <p class="sr-meta">6px tiles and chips · 10px cards and buttons · 16px sheets.</p>
      <div class="demo sr-mt-6">
        <div class="sr-card" style="padding:var(--sr-space-4);box-shadow:var(--sr-shadow-1)">shadow-1 · hairline</div>
        <div class="sr-card" style="padding:var(--sr-space-4);box-shadow:var(--sr-shadow-2)">shadow-2 · card</div>
        <div class="sr-card" style="padding:var(--sr-space-4);box-shadow:var(--sr-shadow-3)">shadow-3 · sheet</div>
      </div>
      <p class="sr-meta">Three levels, all opaque. No translucency anywhere, so every contrast pair is
      computable rather than dependent on whatever happens to scroll underneath.</p>
    </div>
  </div>
</section>

<!-- ========================================================= COMPONENTS -->
<section class="sec">
  <h2>5. Components</h2>

  <h3>Buttons — exactly 0 or 1 primary per screen</h3>
  <div class="demo">
    <button class="sr-btn sr-btn--primary">Import technicians</button>
    <button class="sr-btn sr-btn--secondary">Add by hand</button>
    <button class="sr-btn sr-btn--ghost">Download the CSV template</button>
    <button class="sr-btn sr-btn--danger">Remove technician</button>
    <button class="sr-btn sr-btn--primary" disabled>Import technicians</button>
  </div>

  <h3 class="sr-mt-6">Fields</h3>
  <div class="sr-grid">
    <div class="sr-col-6">
      <label class="sr-field">
        <span class="sr-field__label">Licence number</span>
        <input class="sr-input sr-mono" value="TACLA0000000C">
        <span class="sr-field__hint">As printed on the card. We do not verify it against the board.</span>
      </label>
    </div>
    <div class="sr-col-6">
      <label class="sr-field">
        <span class="sr-field__label">Expiry date</span>
        <input class="sr-input sr-mono" value="14/09/2026" aria-invalid="true">
        <span class="sr-field__error">Use MM/DD/YYYY. We read 14 as a month.</span>
      </label>
    </div>
  </div>

  <h3>Tabs</h3>
  <div class="sr-tabs" role="tablist">
    <button class="sr-tab" role="tab" aria-selected="true">States</button>
    <button class="sr-tab" role="tab" aria-selected="false">Technicians</button>
    <button class="sr-tab" role="tab" aria-selected="false">Credentials</button>
    <button class="sr-tab" role="tab" aria-selected="false">Calendar</button>
  </div>

  <h3>Banners</h3>
  <div class="sr-stack">
    <div class="sr-banner" data-status="lapsed"><span class="sr-banner__glyph" aria-hidden="true">✕</span>
      <span><strong>Texas ACR contractor licence expired 22 August.</strong> Late renewal under 90 days is charged at 1.5× the normal fee.</span></div>
    <div class="sr-banner"><span class="sr-banner__glyph" aria-hidden="true">—</span>
      <span><strong>Coverage:</strong> HVAC, plumbing and electrical, in 15 states. Wyoming electrical is not covered yet — we will not guess at it.</span></div>
  </div>

  <h3 class="sr-mt-6">Empty state and refusal</h3>
  <div class="sr-grid">
    <div class="sr-col-6">
      <div class="sr-empty">
        <h3>No technicians yet</h3>
        <p class="sr-mb-0">Import a CSV, or add one by hand. Either takes under a minute.</p>
        <div class="demo sr-mt-6" style="justify-content:center"><button class="sr-btn sr-btn--primary">Import CSV</button>
        <button class="sr-btn sr-btn--secondary">Add by hand</button></div>
      </div>
    </div>
    <div class="sr-col-6">
      <div class="sr-card">
        <h3 class="sr-card__title">Wyoming · electrical</h3>
        <p>We do not have a verified continuing-education rule for this state and trade, and we will
        not guess at one.</p>
        <p class="sr-source" data-confidence="unverified">
          <span class="sr-source__conf">Not verified</span>
          <span>Go to the <a href="#">Wyoming board</a></span>
          <span>Last attempt 3 Sep 2026</span>
        </p>
      </div>
    </div>
  </div>

  <h3 class="sr-mt-6">Sheet (state drawer)</h3>
  <p class="sr-meta">Shown inline here; in the product it is a right-hand drawer that traps focus,
  closes on <kbd>Esc</kbd> and returns focus to the tile that opened it.</p>
  <div class="sr-card" style="max-inline-size:30rem;padding:0">
    <div class="sr-sheet" style="position:static;inline-size:100%;box-shadow:none;border:0;border-radius:var(--sr-radius-md)">
      <div class="sr-card__head">
        <div><p class="sr-eyebrow sr-mb-0">State</p><h3 class="sr-card__title">Texas · HVAC</h3></div>
        <span class="sr-chip" data-status="lapsed"><span class="sr-chip__glyph" aria-hidden="true">✕</span> Lapsed</span>
      </div>
      <dl class="sr-dl">
        <dt>Licensed here</dt><dd>4 technicians · 1 company licence</dd>
        <dt>Renewal cycle</dt><dd>Annual</dd>
        <dt>CE required</dt><dd>8 hours a year, 1 hour must be Texas law and rules</dd>
        <dt>Late renewal</dt><dd>Under 90 days: 1.5× the fee. 90 days to 18 months: 2×.</dd>
      </dl>
      <p class="sr-source" data-confidence="high">
        <span class="sr-source__conf">High confidence</span>
        <span>Source: <a href="#">TDLR — air conditioning and refrigeration contractor renewal</a></span>
        <span>Checked 3 Sep 2026</span><span>Verified by 2 agents</span>
      </p>
      <div class="demo sr-mt-6">
        <button class="sr-btn sr-btn--secondary">See the 4 technicians</button>
        <button class="sr-btn sr-btn--ghost">Close</button>
      </div>
    </div>
  </div>

  <h3 class="sr-mt-6">Loading</h3>
  <div class="sr-card" style="max-inline-size:26rem">
    <div class="sr-skeleton" style="inline-size:60%"></div>
    <div class="sr-skeleton sr-mt-6" style="inline-size:90%"></div>
    <div class="sr-skeleton" style="inline-size:40%;margin-block-start:var(--sr-space-2)"></div>
  </div>

  <h3 class="sr-mt-6">Expansion report — the document surface</h3>
  <div class="sr-card">
    <div class="sr-doc">
      <p class="sr-eyebrow">State expansion report · sample extract</p>
      <h2 data-num="3.">Bond and insurance</h2>
      <div class="sr-doc__req">
        <p><strong>Surety bond.</strong> Required at the amount set by the board for your classification.
        Premium typically runs 1–5% of the bond amount annually for a contractor in good standing.</p>
        <p class="sr-source" data-confidence="medium">
          <span class="sr-source__conf">Medium confidence</span>
          <span>Source: <a href="#">published fee breakdown</a></span>
          <span>Checked 3 Sep 2026</span>
          <span>Verified by 2 agents</span>
        </p>
      </div>
      <div class="sr-doc__req">
        <p><strong>Proof of insurance.</strong> Most states require it at the contractor level, and it
        must be written by a carrier admitted in that state — plan the carrier before the application,
        not after.</p>
        <p class="sr-source" data-confidence="medium">
          <span class="sr-source__conf">Medium confidence</span>
          <span>Source: <a href="#">practitioner account, trade forum</a></span>
          <span>Checked 3 Sep 2026</span>
        </p>
      </div>
    </div>
  </div>
</section>

<p class="sr-disclaimer">This sheet is an internal design artefact for the wave-1b review. The company,
technicians, licence numbers and figures on it are fictitious. Nothing here is legal or compliance
advice.</p>

</div>

<script>
  // Theme toggle. Three states: explicit light, explicit dark, and system default.
  (function () {{
    var btn = document.getElementById('theme');
    var root = document.documentElement;
    function label() {{
      var dark = root.getAttribute('data-theme') === 'dark' ||
        (!root.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.textContent = dark ? 'Switch to light' : 'Switch to dark';
    }}
    btn.addEventListener('click', function () {{
      var dark = root.getAttribute('data-theme') === 'dark' ||
        (!root.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.setAttribute('data-theme', dark ? 'light' : 'dark');
      label();
    }});
    label();
  }})();
</script>
</body>
</html>
"""

out = HERE / "samples.html"
out.write_text(HTML, encoding="utf-8")
print(f"wrote {out} ({len(HTML)} bytes, {len(GRID)} tiles)")
