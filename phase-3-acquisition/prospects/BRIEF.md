# Prospect-research fleet: common brief

**Date:** 2026-09-03. **Owner:** founder. **Status:** research only. Nothing in this directory has been sent to anyone, and nothing here authorises sending anything.

Every research agent working under `phase-3-acquisition/prospects/` follows this brief. The app-specific brief in the agent's prompt adds to it and never overrides the constraints below.

---

## 1. Goals (the finish line)

For the app you are assigned, produce the most complete, fully sourced list of **organisations** that are either:

- **end-customer**: an organisation that matches the app's ideal customer profile and could buy it directly,
- **partner**: an organisation that already serves that customer and could refer, bundle or resell,
- **channel**: a community, directory, event, newsletter, podcast or publication where that customer is reachable,
- **excluded**: a direct competitor or an organisation that must never be contacted (record it so it is not rediscovered later and mis-staged as a prospect).

You are done when (a) every public source you can reach for this target has been mined or logged as blocked, (b) the four output files below exist and validate, and (c) the README states honestly what is covered and what is not. Volume matters: a segment with public data behind it should reach at least 100 rows; a segment with no public data behind it is reported as such, not padded.

## 2. Constraints (what NOT to do)

1. **No private individuals, ever.** No names, emails, phone numbers, handles or post content of individual people. This covers founders, owners, hosts, podcast hosts, nurses, sellers, licensees listed by personal name. Same standard as `../crm/CRM.md` §6.2. If a public register lists a licence under a person's name with no company name, skip the row.
2. **Business contact routes only.** `contact_route` is the organisation's contact page, partner page, or a generic business mailbox (info@, sales@, partners@, support@) published on its own site. Never a personal mailbox. Never anything at gmail, yahoo, hotmail, outlook, icloud, proton or similar.
3. **No source, no row.** Every row carries a `source_url` you actually opened (or an API query you actually ran). Unknown fields stay empty. Never estimate a number into a structured field; put estimates in `notes` and label them.
4. **No fabrication.** Do not invent organisations, URLs, sizes or locations. If you cannot confirm a URL exists, leave `website` empty and say so in `notes`.
5. **Read only.** Never sign up, log in, submit a form, post, DM, email, or run a paid service. Never scrape behind a login. A 403 or a captcha means the source is closed to you: log it, do not work around it, never disable TLS verification or proxy settings.
6. **Stay in your directory.** Write only under `phase-3-acquisition/prospects/<your-app>/`. Do not edit `app/`, `../crm/`, or any other agent's directory. Do not commit or push; the orchestrator does that.
7. **Known blocked from this environment (do not retry):** reddit.com, yelp.com, narpm.org, importyeti.com, facebook.com, duckduckgo.com. Google search redirects; use the WebSearch tool, or Bing via curl.
8. **What works:** the WebSearch tool; WebFetch for reading articles; `curl -s -A "Mozilla/5.0" <url>` for pulling directory pages you then parse with python3 (WebFetch summarises through a small model and drops rows, so for list pages always curl + parse); public government APIs (api.usaspending.gov POST endpoints, sam.gov search API, state licence lookups); Bing search results via curl.

## 3. Format (the deliverable)

Your directory `phase-3-acquisition/prospects/<your-app>/` contains exactly:

### 3.1 `prospects.csv`

UTF-8, header row, comma separated, quoted fields. Columns, in this order:

| column | meaning |
|---|---|
| `app` | your app slug (clausewright, dutylens, wagelens, certly, scopeiq, staylegal, stateready, recoup) |
| `prospect_type` | `end-customer` / `partner` / `channel` / `excluded` |
| `segment` | short segment label you define, consistent within the file (e.g. `customs broker`, `PE platform`, `med spa franchise`) |
| `name` | organisation name as it appears on its own site or in the register |
| `website` | root URL of the organisation's own site, empty if unconfirmed |
| `location` | city, state or state only; empty if unknown |
| `size_signal` | one factual, sourced signal (units managed, locations, employees, award amount, brands owned). Empty if none. Never estimated |
| `fit_rationale` | one sentence: why this organisation matches the ICP or the partner thesis |
| `contact_route` | business contact/partner page URL or generic business mailbox, per §2.2 |
| `decision_maker_role` | the role you would address, no name (e.g. `owner`, `compliance manager`, `head of partnerships`) |
| `source_url` | the exact page or API query where you found the row |
| `source_type` | `government-db` / `association-directory` / `directory` / `list-article` / `company-site` / `press` / `api` |
| `confidence` | `verified` (you opened the organisation's own site or a government record for it) / `secondary` (found in a third-party list, not independently opened) / `unverified` |
| `collected_on` | `2026-09-03` |
| `notes` | anything else, including labelled estimates and caveats |

One row per organisation. Deduplicate on `name` + `website` before finishing.

### 3.2 `sources.md`

One section per source tried, in the order tried: URL, what it is, status (`worked` / `partial` / `blocked` / `empty`), rows yielded, exact command or query used when it was an API or a parsed page (so the extraction is reproducible), and how a future agent could extend it (pagination, other states, other categories).

### 3.3 `README.md`

One page: the ICP in two lines; a table of rows per `prospect_type` x `segment`; a table of rows per `confidence`; the twenty highest-fit end-customer rows with a one-line reason each; a **Gaps** section naming every segment under 30 rows and why; a **Next steps** section listing the three sources that would add the most rows with more time or access.

### 3.4 `CLAUDE.md`

See §5.

### 3.5 `scripts/` (optional)

Any extraction script you wrote (python3, standard library plus whatever is already installed). Must run from the repo root with no arguments and regenerate the rows it produced.

Before finishing, run this and fix anything it reports:

```
python3 - <<'PY'
import csv,re,sys
p='phase-3-acquisition/prospects/<your-app>/prospects.csv'
rows=list(csv.DictReader(open(p,encoding='utf-8')))
cols=['app','prospect_type','segment','name','website','location','size_signal','fit_rationale','contact_route','decision_maker_role','source_url','source_type','confidence','collected_on','notes']
assert list(rows[0].keys())==cols, 'bad header'
bad=[r for r in rows if not r['name'].strip() or not r['source_url'].strip()]
assert not bad, f'{len(bad)} rows without name or source_url'
pers=[r for r in rows if re.search(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.',(r['contact_route']+r['notes']).lower())]
assert not pers, f'{len(pers)} rows with personal mailboxes'
types={r['prospect_type'] for r in rows}
assert types<= {'end-customer','partner','channel','excluded'}, types
conf={r['confidence'] for r in rows}
assert conf<= {'verified','secondary','unverified'}, conf
keys=[(r['name'].lower().strip(),r['website'].lower().strip()) for r in rows]
assert len(keys)==len(set(keys)), 'duplicates on name+website'
print('OK', len(rows), 'rows')
PY
```

## 4. Failure protocol (what to do when stuck)

- A source fails twice (403, timeout, captcha, empty page): log it in `sources.md` with the status and move to the next source. Do not spend more than two attempts on any single URL.
- WebFetch returns a summary with no usable rows: curl the page and parse it yourself. If curl also fails, log and move on.
- An API returns an error: read the error message, fix the request once, and if it fails again log the exact request and response and move on.
- You are not sure whether an organisation fits: include it with `confidence=secondary` and say why in `notes`. A doubtful row with an honest note beats a missing row.
- You are not sure whether something counts as a private individual: it does. Skip it.
- Nobody is available to answer questions. Take the best defensible guess, write the assumption in `CLAUDE.md`, and continue.
- If after all reachable sources a segment is still under 30 rows, that is a finding: record it in the README **Gaps** section with the reason (no public register, sources blocked, category too fragmented). Do not pad.
- Stop when marginal sources stop yielding new organisations, not when a round number is reached.

## 5. Memory

Keep `phase-3-acquisition/prospects/<your-app>/CLAUDE.md` up to date **as you work, not only at the end**. It is the steering file for any future agent on this target. Sections:

- **Rules confirmed** (the constraints above you had to apply, with the case that triggered them)
- **What worked** (sources, commands, parsing tricks, with row yields)
- **What failed** (sources, why, whether it is worth retrying with human access)
- **Mistakes I made** (and what you changed after noticing)
- **Assumptions taken without confirmation**
- **Advice to the next agent** (three to five lines)
