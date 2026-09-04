# `scripts/enrich/` — route enrichment, steering file

**Agent:** Route Enrichment, phase-4 fleet. **Started:** 2026-09-03.
**Job:** give end-customer organisations in `phase-3-acquisition/prospects/` a *verified*
business route (own website, generic role mailbox, contact page) without inventing a URL
and without touching a private individual.

Read this before running anything here. `prospects.csv` is **read only**; everything this
pass produces lands in `<dir>/routes-enrichment.csv`, which the outbound engine merges at
seed time (`outbound/engine/workbook.py::apply_enrichment`).

---

## 1. Files

| file | what it does |
|---|---|
| `enrich_lib.py` | the rules: name → candidate domains, DNS, polite fetch, four-stage site confirmation, mailbox extraction, resumable state |
| `run_enrich.py` | the driver. `--dir <prospects dir> --mode discover\|mailbox --limit N --workers 8 [--retry]` |
| `gov_registry_routes.py` | bulk pass: pulls the four Socrata registers that publish a business e-mail and matches them back to the list |
| `apply_websearch.py` | confirms website candidates an agent collected with the `WebSearch` tool (`state/<dir>-websearch.tsv`), through exactly the same checks as every other candidate |
| `build_enrichment_csv.py` | turns the attempt logs into `<dir>/routes-enrichment.csv` |
| `validate_enrichment.py` | **run this before handing anything over.** Refuses personal or malformed mailboxes, free-mail domains, phone numbers, routes the outbound engine would reject, websites with no evidence, rows not in `prospects.csv` |
| `recheck_mailboxes.py` | one-off repair: removes records that three early bugs could have corrupted, so the next run re-attempts them (see §6b) |
| `state/*.jsonl` | one JSON record per organisation attempted — this is what makes every run resumable |
| `state/token-df.json` | token document-frequency over all prospect names; the rarity signal (see §5) |
| `state/blocked-hosts.json` | hosts that answered 401/403/429/503 or timed out; never retried in the same run |

## 2. Where this pass stopped, and how to resume it

**Stopped at:** WageLens 5,477 of 10,215 no-route organisations attempted; Certly and
StateReady **exhausted** (every eligible row attempted, and the `--retry` pass over their
retryable failures stopped itself on the 10%/200 rule). The single resume command is:

```bash
python3 phase-3-acquisition/prospects/scripts/enrich/run_enrich.py \
    --dir wagelens --mode discover --limit 4738 --workers 8
```

That is the 4,738 WageLens organisations never attempted, in ICP order. Then, always:

```bash
python3 phase-3-acquisition/prospects/scripts/enrich/build_enrichment_csv.py
python3 phase-3-acquisition/prospects/scripts/enrich/validate_enrichment.py
python3 -m unittest discover -s outbound/engine -p 'test_*.py'
for a in wagelens certly stateready; do
  python3 -m outbound.engine.cli $a seed && python3 -m outbound.engine.cli $a report
done
```

The full set of passes, for reference:

```bash
E=phase-3-acquisition/prospects/scripts/enrich/run_enrich.py
python3 $E --dir wagelens   --mode discover --limit 4738 --workers 8   # the remaining work
python3 $E --dir certly-pm  --mode mailbox  --limit 600  --workers 8   # exhausted
python3 $E --dir certly-gc  --mode mailbox  --limit 600  --workers 8   # exhausted
python3 $E --dir certly-pm  --mode discover --limit 600  --workers 8   # exhausted
python3 $E --dir certly-gc  --mode discover --limit 600  --workers 8   # exhausted
python3 $E --dir stateready --mode discover --limit 700  --workers 8   # exhausted
python3 phase-3-acquisition/prospects/scripts/enrich/gov_registry_routes.py   # exhausted
```

Everything is resumable and idempotent: an organisation already in
`state/<dir>-<mode>.jsonl` is skipped, so re-running any of these is a no-op that costs
one file read.

- Rows are attempted in **ICP-sharpness order** (`run_enrich.icp_score`: 2+ federal
  awards, latest award 2025/26, NAICS 238xxx, then the NY/WA/IL/TX prevailing-wage
  filers), so stopping early always leaves the least valuable rows unattempted.
- `--limit` counts organisations *not yet attempted*.
- `--stop-yield 0.10 --stop-window 200` is the pre-committed stop rule from the brief:
  the run halts when 200 consecutive attempts yield under 10%. It fired twice, on the
  WageLens and certly-gc retry passes — that is the rule working, not a failure.
- `--retry` re-attempts organisations whose recorded failure was about *us* (a
  JavaScript-rendered page, a dropped connection, a 5xx). It never re-attempts
  "page does not name the organisation": the answer would not change.

## 3. Rules confirmed (and the case that forced each)

- **Never derive a route you did not open.** `<site>/contact` is recorded only after it
  was fetched and returned a real page (`looks_like_real_page`: HTTP 200, ≥200 characters
  of text, no 404 wording). This is the same rule the Outbound Engineer applied when he
  refused to synthesise `<website>/contact` for 10,215 WageLens rows.
- **Organisations only (D5, `BRIEF.md` §2.1–2.2).** A mailbox is kept only when every
  segment of its local part is on `ROLE_LOCALS`, an explicit allowlist. That allowlist is
  a **subset of the outbound engine's `GENERIC_TOKENS`**, so nothing found here is found
  twice and then dropped at seed time. Free-mail domains are refused outright.
- **No personal names, no phone numbers.** Nothing in the output CSV carries either. The
  registers used in `gov_registry_routes.py` all publish an owner name and a phone; both
  columns are never selected.
- **Two attempts per organisation.** `MAX_CONFIRM_FETCHES = 2` homepage confirmations.
  DNS probes are not attempts (they cost the target host nothing); a failed HTTPS retried
  once over plain HTTP is the same attempt, because a broken certificate on a small
  contractor's site is not a second candidate.
- **Politeness.** ≤8 concurrent requests in total across all running processes, and a
  hard one-request-per-second-per-host gate (`enrich_lib._wait_for_host`). Hosts that
  answer 401/403/429/503 are recorded in `state/blocked-hosts.json` and skipped.
- **Read only.** No form is submitted, no login, no signup, no paid API. A 403 is logged
  and abandoned.

## 4. What worked, and the yield per method

Measured over this pass, deduplicated per organisation.

| method | how it works | attempted | found | yield |
|---|---|---:|---:|---:|
| **register website re-check** (`register-website`) | the `website` column phase 3 copied out of NYC SBS / NOLA / Cincinnati "as published, **not opened**" — fetched and confirmed here. Tried first because it is the cheapest confirmation | 467 | 254 sites | **54%** |
| **DNS-derived candidate domains** (`dns-guess`) | name → up to 5 domain bases × `.com/.net/.us/.org`, resolved with `socket.getaddrinfo`, the best 2 resolving candidates fetched and confirmed | 6,560 | 2,280 sites | **35%** |
| **mailbox on an existing contact page** (`existing-contact-page`) | the Certly rows that already had a contact page: fetch it and the homepage, read `mailto:` links, visible addresses and the page source | 514 | 148 mailboxes | **29%** |
| **government register mailbox** (`gov-register`) | four Socrata datasets publish a business e-mail phase 3 did not take: WA L&I intents, NJ NJSAVI, NYS UCP DBE, New Orleans DBE | 2,929 register addresses matched to list rows | 107 mailboxes (2,822 dropped as personal or free-mail) | **3.7%** |
| **`WebSearch` tool** | `"<exact organisation name>" <state>`, keep only results whose domain carries a distinctive token, then confirm exactly like every other candidate | 7 organisations | 4 candidates → 2 sites | **29%** end to end |

Two things follow from that table and they should steer the next pass:

- **DNS guessing is the workhorse and it is cheap**; the register re-check is better per
  attempt but there are only 467 rows with a phase-3 website to re-check.
- **`WebSearch` is not worse per organisation, it is worse per unit of budget.** It is one
  agent tool call each — it cannot be scripted — so 10,215 rows is out of reach in one
  session. Its real use is the ~3,500 WageLens rows whose domain simply is not their name
  (`no candidate domain resolved`), where nothing else can reach them.

`dig` does not exist on this box — `socket.getaddrinfo` is the resolver, and it returns
NXDOMAIN correctly, so DNS probing is a genuine filter and not a wildcard trap.

Two extra readers earned their place:

- **the page source as a fallback** (`source_text`): a JavaScript-rendered homepage has no
  readable text at all, but the organisation's name is in the Next.js payload. Allowed
  only for the *whole* name, only on a page over 4,000 bytes, and only when the page
  carries no parking marker — otherwise a squatter's stub "names" the organisation
  through its own domain.
- **the same source scanned for `mailto:` and addresses**: JSON-LD and inline config often
  carry the public `info@` that the rendered page shows only as an image. Sentry DSNs and
  Wix telemetry addresses appear there too and are removed by the same-domain rule.

### A method that was tested and does *not* work

Privacy-policy and terms pages are supposed to carry a contact address. On a sample of
eight confirmed StateReady sites, `/privacy-policy/`, `/privacy/` and `/terms-of-use/`
yielded **zero** role mailboxes. Consumer-facing trade brands route everything to a phone
number and a form on purpose. Do not build that pass; it was tried.

## 5. False positives to avoid (all of these were caught in the pilot)

The first pilot accepted 21/40 sites, of which **six were the wrong company**. The rules
below cut acceptance to ~34% and removed every one of them. Do not loosen them.

| false positive | why it happened | the rule that now stops it |
|---|---|---|
| `heating.net` for "4 G Plumbing And Heating, Inc." | one common word was treated as the organisation's identity | a domain base is built from a *single* word only when the whole name is that one word |
| `provision.com` for "A 2 Z Provision LLC" | same | same |
| `ability.com` for "Ability Solutions LLC" | "sole distinctive token in page" acceptance path | that path was deleted: it is the full name, or two distinctive tokens, or nothing |
| `totalsolution.com` for "A Total Solution LLC" | a name made only of common words matches many firms | a **weak** name (fewer than two distinctive tokens, or under 12 characters concatenated) must also have its **city or state** on the page |
| `acp.com`, `aces.net` for "Acp, LLC", "Aces, LLC" | three- and four-letter names | single-token bases need ≥6 characters |
| parked domains that answer 200 | squatters own `<name>.com` for half this list | `PARKED_MARKERS`, plus "under 200 characters of text is not a page"; the classic `window.location.href="/lander"` bounce is a 114-byte body and fails the length test |
| a candidate that redirects to a directory | `.com` guesses land on Yelp/BBB/Manta/ZoomInfo mirrors | `is_directory_host` on the **final** URL after redirects |

Rarity is measured against the corpus itself (`state/token-df.json`), because
`/usr/share/dict` is empty on this box: a token in fewer than 4 organisation names
(`aggreko`, `agnora`, `accentz`) identifies a company; `maintenance` (54) and `systems`
(216) do not. Delete the cache to rebuild it.

## 6. What failed / blocked

`state/blocked-hosts.json` holds **231 hosts** that refused this environment and were not
retried: 118 × `503`, 107 × `403` (mostly Cloudflare or a WAF that dislikes curl),
5 × `429`, 1 × `401`. None was worked around; a 403 is a closed door, per `BRIEF.md` §2.5.

- **Cloudflare 403 on the organisation's own site.** Common for the PE-backed platforms in
  `stateready` — phase 3 hit the same wall and recorded it in its own notes. A human
  browser would get these; they are the best candidates for a manual pass.
- **JavaScript-only homepages under 4,000 bytes** stay unreadable even with the source
  fallback and are recorded as `page body empty`. That is honest: we could not read the
  page, so we do not claim it.
- **Parking pages that answer 200.** Squatters own a large share of `<name>.com` in this
  segment. The `/lander` bounce (a 114-byte body) and the `PARKED_MARKERS` list handle
  them; every rejection is written into the CSV with its reason.
- **`dig` is absent**; **Google and Bing through curl** are unusable through this proxy
  (phase-3 finding, re-confirmed); the `WebSearch` tool is the only search that works.
- **USAspending recipient profiles carry no website**, as the brief predicted, so the
  4,885 federal-award rows have no register fallback and depend entirely on DNS guessing.
- **The government registers are mostly personal mailboxes.** 2,822 of the 2,929 addresses
  matched were a named person's or a free-mail account and were dropped. That is exactly
  why phase 3 left the column alone, and the 3.7% that survive are worth the one query.

## 6b. Bugs I made, and what changed

- **The mailbox extractor rewrote addresses.** `pick_role_mailbox` ranked on the squashed
  local part *and returned it*, so a published `customer.service@acme.com` was recorded as
  `customerservice@acme.com` — an address nobody published. It now ranks on the squashed
  form and records the address **verbatim**. `recheck_mailboxes.py` removed the 60 records
  that could have been affected so they were re-fetched.
- **`mailto:` junk reached the CSV.** `office@adastrakc.com\` passed every check because a
  backslash is legal in an href. Every address now goes through `clean_address()` and
  anything that fails a strict pattern is **dropped, not repaired** — a repaired address is
  a fabricated one. `validate_enrichment.py` catches this class.
- **The mailbox pass recorded a website it had never opened**, derived from the host of
  the contact page, even when neither page answered. It now records a website only after a
  page on that host actually returned content.
- **The first `--retry` run looked broken** (2 hits in the first 75) because the retry
  backlog is by definition the hard rows and it is attempted first. It is not a
  regression; check the rolling window over 200, not the first 50.

## 7. Assumptions taken without confirmation

| # | assumption | how to overturn it |
|---|---|---|
| E1 | A government register's published business e-mail is a business route even though we never opened the organisation's own site. It is published by the state on the organisation's own register entry, and the role allowlist still applies. | If the founder wants "site opened" for every route, drop the `gov-register` rows: they are labelled in `notes` and in `method`. |
| E2 | `/about` counts as a contact page when no `/contact` exists, because it is where a small contractor's form usually lives. It is ranked *after* every contact-shaped URL. | Filter `route_type=form` rows whose URL has no `contact` in it. |
| E3 | Two organisations sharing a name are distinguished by `location`; where the name is unique in the file the location is ignored on merge. | `workbook.read_enrichment` builds the name-only key **only** for names that appear once. |
| E4 | The enrichment never overrides a phase-3 route, even a worse one, and never overrides a phase-3 website. | `workbook.apply_enrichment`; there is a test for both directions. |
| E5 | A confirmed site whose homepage and contact pages publish no generic mailbox is still worth recording as a `form` route. | It is what the founder already does for 567 of the 666 existing rows. |

## 8. Results of this pass (2026-09-03)

`<dir>/routes-enrichment.csv`, one row per organisation attempted, failures included:

| list | attempted | websites confirmed | generic mailboxes | contact pages | no route |
|---|---:|---:|---:|---:|---:|
| wagelens | 5,477 | 1,929 | 751 | 930 | 3,796 |
| certly-pm | 974 | 644 | 199 | 92 | 683 |
| certly-gc | 597 | 232 | 86 | 74 | 437 |
| stateready | 576 | 302 | 69 | 210 | 297 |
| **total** | **7,624** | **3,107** | **1,105** | **1,306** | **5,213** |

After `seed`, the outbound workbooks (`outbound/<app>/REPORT.md` §1):

| app | usable route before | after | mailbox | contact page |
|---|---:|---:|---:|---:|
| wagelens | 80 | **1,769** | 836 | 933 |
| certly | 521 | **824** | 290 | 534 |
| stateready | 65 | **344** | 81 | 263 |
| **total** | **666** | **2,937** | **1,207** | **1,730** |

Against the brief's three targets, stated exactly:

| target | asked | got |
|---|---|---|
| 1. WageLens websites | 1,200 | **1,929** ✓ |
| 1. WageLens generic mailboxes | 500 | **751** ✓ |
| 2. Certly: a mailbox on the 514 rows that had a contact page and no mailbox | 200 | **148** ✗ — 29% of those 514 sites publish no generic mailbox at all |
| 3. StateReady websites | 300 | **302** ✓ |
| 3. StateReady generic mailboxes | 120 | **69** ✗ |

The two misses are properties of the segments, not of the method, and both were pushed as
far as they go:

- **Certly's 514 contact-page rows are exhausted.** All 514 were fetched (contact page
  *and* homepage), and 148 published a role mailbox. A `--retry` pass over the transient
  failures added 10 more and then stopped itself on the 10%/200 rule. To make up the
  difference I ran an extra pass the brief did not ask for — the 1,057 Certly rows with
  **no route at all** — which found 360 more websites and 134 more mailboxes. Certly's
  workbook mailbox count is therefore 290, against 7 before.
- **StateReady's mailbox gap will not close.** 511 of its 641 end-customer rows are
  "platform operating brand" — consumer-facing HVAC, plumbing and roofing brands that
  route everything to a phone number and a form on purpose. Privacy-policy and terms
  pages, the usual fallback, returned zero on a sample of eight (see §4). 210 of those
  rows now carry a fetched contact page instead, which is the honest best available.

## 9. Advice to the next agent

1. **Run `build_enrichment_csv.py` after every batch.** The CSV is derived, never
   hand-edited; the JSONL logs are the source of truth and they are append-only.
2. **The stop rule is in the driver, not in your head.** `--stop-yield`/`--stop-window`
   encode the brief's "under 10% for 200 consecutive attempts".
3. **Do not widen `ROLE_LOCALS`.** It is the boundary between an organisation and a
   person, and it is deliberately narrower than the engine's `GENERIC_TOKENS`.
4. **The remaining upside is search, not more guessing.** Of the 3,521 WageLens failures,
   1,156 are "no candidate domain resolved" — no name-derived domain exists at all — and
   2,365 fetched something that was not them (a parking page, a namesake, a WAF). Neither
   group moves with a better domain generator; both move with a search engine. A real
   search API is the single highest-value unlock left, and 4,738 WageLens rows are still
   unattempted for the cheap method alone.
5. **Run the engine tests after touching `workbook.py`**:
   `python3 -m unittest discover -s outbound/engine -p 'test_*.py'` (149 tests, under a
   second, no network), then `validate_enrichment.py` on the CSVs.
6. **Trust the CSV, not your memory of a run.** Every claim in this file is recomputable:
   `build_enrichment_csv.py` prints the counts, `validate_enrichment.py` proves the rules,
   and `outbound/<app>/REPORT.md` §1 prints what actually reached the workbook.
