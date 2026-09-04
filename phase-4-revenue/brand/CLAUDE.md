# brand/ — memory file (Brand Director, phase-4 fleet)

**Role:** Brand Director. The one role allowed to edit identity files across all three phase-4 apps,
because the problem was cross-app and no single app's agent could see it.
**Started / finished:** 2026-09-03. **Status:** decision written, applied, and machine-checked.
**Deliverable:** `../IDENTITY_ARBITRATION.md`, plus edits to two apps and one new check script.

---

## Scope, and the lines I did not cross

**May edit:** `IDENTITY.md`, `design-system.css`, `identity/samples.html` and `identity/contrast.py` in
`wagelens/`, `certly/`, `stateready/`; `../IDENTITY_ARBITRATION.md`; `../scripts/`; this file.
**May not edit:** any `PERSONA.md` or `UX.md`, except where one names a typeface or a colour literally
(grepped — none does, so none was touched, and `git status` confirms it). Any spec, backlog, offer or
landing document. Anything outside `phase-4-revenue/`.
**Did not do:** commit, push, sign up, or send.

I also did not review my own work: `certly/REVIEW.md` was written by the wave-1b reviewer and two of
its findings were assigned to me by the coordinator mid-task (B-03, B-15). Both are closed; see below.

---

## The problem, and the number that made it undeniable

Three *Buyer & Identity* agents, working in parallel with no sight of each other, all chose **Public
Sans + IBM Plex Mono on a warm/neutral paper ground with chroma reserved for status**. Each argument
was individually sound. Together they were one brand with three names.

The single most useful thing I did was **stop arguing about it and measure it**. In CIELAB ΔE76:

| pair | ΔE76 | reading |
|---|---:|---|
| WageLens `#FBF9F5` vs StateReady `#FAF8F4` | **0.35** | below the just-noticeable difference |
| Certly `#F3F3EE` vs StateReady | **2.10** | one JND |
| WageLens vs Certly | **2.42** | one JND |

Plus 3/3 on the same UI face, 3/3 on the same mono, 2/3 with an identical dark canvas (`#12100E`),
2/3 with an ink primary button. **Advice to the next agent: lead with the number.** Two of the three
authors had already flagged the risk in prose (`certly/IDENTITY.md §17.3`, `stateready/IDENTITY.md
§5.1`, assumption A5) and nothing had moved. A ΔE table moved it in one paragraph.

---

## The decision, in one table

| | WageLens | Certly | StateReady |
|---|---|---|---|
| UI / mono | **Public Sans + IBM Plex Mono** *(unchanged)* | **Source Sans 3 + Source Code Pro** | **Barlow + Barlow Condensed + Overpass Mono** |
| ground | warm bone `#FBF9F5` | cool office white `#E8EEF6` | deep graphite-green board `#181D1A` |
| primary action | brick `#8A3115` | interaction blue `#14458C` | bone on the board `#ECF2EE` |
| status hues | 144.7 / 40.7 / 5.7° | 164.2 / 47.3 / 344.8° | 155.2 / 31.2 / 355.1° |
| signature | ruled ledger + provenance card | coverage bar (gap = hole) | tile grid + runway |

Full reasoning, the two rejected options, the losses per app and the side-by-side are in
`../IDENTITY_ARBITRATION.md`.

**The one allocation rule worth remembering:** WageLens keeps Public Sans because it is the only app in
the fleet whose *output artefact* is a US federal form (WH-347, OMB 1235-0008). That turns the USWDS
argument from a preference into a fact — and it is a fact only one of the three can hold.

---

## What worked

- **Measure before you argue.** ΔE76 in Lab, hue distance in HSL. `scratchpad/cc.py` (a 40-line
  contrast/Lab/HSL helper) paid for itself ten times over: every colour in this arbitration was
  *solved* against its constraints rather than eyeballed and then checked.
- **Solve for the value, not for the vibe.** Certly's cool ground broke `--c-line-strong` against the
  sunken well (2.83:1 against a 3:1 requirement). Rather than nudge until it looked fine, I ran a small
  grid over sunken × line-strong and picked the pair with margin (`#DEE7F1` / `#718094`, 3.22:1).
- **Read the buyers' tools rather than remembering them.** `curl` with a desktop UA, two attempts per
  URL. AppFolio, Buildium, Rent Manager, CINC, ServiceTitan, Housecall Pro and FieldEdge all returned
  200 and gave real values. **This changed a decision:** Certly's warm ground had been borrowed from
  Procore, which is the *general contractor's* tool — evidence about its second buyer, not its first.
  Its first buyer's stack is white and navy.
- **A generator beats hand-written HTML.** StateReady's `identity/build-samples.py` reads its tokens
  and its ratios straight out of `contrast.py`, so re-toning a whole palette was `edit contrast.py →
  edit CSS → run the generator`. Certly's `samples.html` is hand-written and every edit was manual and
  slower. If you are building a third one, generate it.
- **Writing the guard as a test, not as a document.** `../scripts/identity-distinctness.py` parses the
  three stylesheets rather than a manifest, so it cannot drift from what ships.
- **A self-test on the guard.** `--selftest` replays the three pre-arbitration grounds and asserts the
  gate rejects them. It stops a future edit from loosening the thresholds back into the problem.

## What failed, and what I did instead

| attempt | what happened | what I did |
|---|---|---|
| `yardi.com` | HTTP 403, two attempts | no claim made about Yardi anywhere; recorded as blocked in the arbitration's source table |
| `getjobber.com` | HTTP 403, two attempts | the "avoid the category blue" argument rests on ServiceTitan, Housecall Pro and FieldEdge, which were all fetched; Jobber stays unverified, as `stateready/IDENTITY.md §11` already said |
| my first distinctness gate | required ΔE76 ≥ 12 **and** an axis test; it failed WageLens vs Certly at 7.87 — two papers 174° of hue apart | rewrote the gate to encode the brief's own sentence (*"differ in temperature or value"*): a hard ΔE floor, then **or** across the axes, in Lab and again in HSL. Added `--selftest` so the looser floor is still demonstrably strict enough |
| my first StateReady board ramp | `ready` 150.3° and `lapsed` 5.2° sat within 6° of WageLens's equivalents | moved both (155.2°, 355.1°) and re-certified. Minimum hue separation across the fleet's nine chromatic statuses went from 0.5° to **8.1°** |

## Mistakes worth not repeating

1. **I edited `design-system.css`, `contrast.py` and `samples.html` before `IDENTITY.md`.** The wave-1b
   reviewer caught the window and logged it as `certly/REVIEW.md` B-15 — the document was describing a
   palette the CSS no longer had, and `IDENTITY.md` is what wave 2 reads. **Edit the document in the
   same pass as the code, or expect a reviewer to file it.** Closed.
2. **I nearly tuned a threshold to fit my answer.** When the gate failed WageLens vs Certly my first
   instinct was to darken Certly's paper until the number passed. That would have been fitting the
   design to an arbitrary constant. The right move was to check the constant against the brief — which
   said *temperature **or** value* — and fix the constant.
3. **I assumed a four-state status system was complete because the identity said so.** It was not: the
   comparison engine emits seven. The identity document is not the authority on what states exist; the
   engine spec is. `certly/REVIEW.md` B-03.

---

## Rules now in force (do not quietly undo these)

1. **`../scripts/identity-distinctness.py` must exit 0** alongside each app's `identity/contrast.py`.
   Add both to CI. If you change a font token or a ground, run it.
2. **No two apps share a branded font family.** Fallback stacks are shared on purpose and are ignored
   by the check.
3. **The three default grounds are warm bone / cool office white / deep board.** Only the *default*
   `:root` ground is compared; alternate themes are excluded on purpose (every dark canvas is a
   near-black, so a rule over them would fail for reasons that carry no brand meaning).
4. **Each app keeps its signature device**: WageLens the ruled ledger and the provenance card, Certly
   the coverage bar with the gap as a hole, StateReady the readiness tile grid and the runway.
5. **Accessibility was not weakened anywhere.** AA holds in every theme; status is still carried by
   word **plus** glyph/dot **plus** pattern in all three apps. If a change makes a contrast script fail,
   the change is wrong — not the script.
6. **StateReady's `--sr-paper` is now `--sr-ground`.** The paper theme still exists and is what every
   forwardable artefact uses. *The board is for the operator; paper is for the forwarder.*
7. **Certly's green state is "Meets requirements" (pill `MEETS`).** "Covered" is retired
   (`certly/REVIEW.md §2.1`). Token names (`--c-ok-*`) are vocabulary-neutral and did not change; the
   noun *coverage* survives in its form-derived sense, so the coverage bar keeps its name.

---

## Review findings folded in (assigned by the coordinator mid-task)

- **B-15 — the document must match the implementation.** Closed. All three `IDENTITY.md` files now
  match their CSS; both of Certly's §6.5 tables and both of StateReady's §6.3 tables are regenerated
  from `contrast.py --md`, per those documents' own rule that no ratio is typed by hand.
- **B-03 — Certly's status system had four states, the engine has seven.** Closed. Added
  `asserted_only` ("Claimed, not evidenced", half-filled disc, **vertical** hatch, the Expiring hue one
  step deeper — no fifth hue), `not_checked` (em dash with no container, open hairline edge,
  achromatic) and `no_certificate` (empty document outline, open with a single diagonal rule,
  achromatic). Tokens, pills, dots, bar segments and strip segments in the CSS; declared pairs and
  `STATUS_MARKS` in `contrast.py`, which hard-fails a duplicated glyph, pattern or word and now
  certifies **166 pairs**; both panels and the coverage bar in `samples.html`.
  Also applied the `REVIEW.md §2.1` vocabulary ruling across the identity files.

**Not mine, and left alone deliberately:** the requirement-level rename `needs_review` → `undetermined`
(MN-04) is a product/spec decision; and the "Covered" retirement still has to reach `PERSONA.md`,
`UX.md`, `specs/05`, `specs/06`, `specs/12` and `LANDING_SPEC.md`. Both are flagged in
`../IDENTITY_ARBITRATION.md §9`.

---

## Environment notes for the next agent

- `dig` is not installed; `curl -A '<desktop UA>' -L` works through the proxy and rescues several sites
  that refuse WebFetch. Google Fonts' `css2` endpoint answers 200 and is the cheapest way to *prove* a
  family exists before you commit a design to it — do that before writing the token, not after.
- `python3 identity/contrast.py --md` is the only legitimate source for a ratio in an `IDENTITY.md`.
  Never hand-type one; a reviewer will re-run the script and diff it.
- `python3 identity/build-samples.py` (StateReady only) must be re-run after any token change, and it
  imports `contrast.py`, so fix the tokens there first.
- `scripts/identity-distinctness.py --json` gives a machine-readable dump if you want to assert on it
  from another script; `--verbose` prints the source paths it parsed.

## Advice to the next agent

1. **The arbitration is a decision document, not a style guide.** If you disagree with an allocation,
   argue with §5 ("what each app loses") — that is where the trade-offs are written down honestly, and
   it is the part most likely to be wrong.
2. **The weakest link is StateReady's dark default** and it is labelled as such in three places. Its
   buyer's own tools are light; the driver is mutual distinctness. The reversal is one token swap plus
   a regenerated samples file, and the paper theme is already fully authored and certified — so if the
   founder says light, it costs minutes.
3. **WageLens is pinned.** Any proposal to move it off Public Sans re-opens the arbitration for all
   three apps. Say so before someone spends a day on it.
4. **When you add a status, add all four signals.** Certly's `contrast.py` will hard-fail a duplicated
   glyph, pattern or word, which is the cheapest guardrail in this repo. StateReady's `§7.2` has the
   same rule expressed in prose — consider making its script enforce it too.
5. **Naming is the remaining brand risk.** Three trademark clearances are still outstanding
   (CraftWage/ChalkWage, Coverfile, StateReady) and none was possible from this environment. The
   typeface and colour work is done; the names are not.
