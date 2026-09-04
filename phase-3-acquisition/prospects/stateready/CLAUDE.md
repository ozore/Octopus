# StateReady prospect research — steering notes

App slug: `stateready`. Directory: `phase-3-acquisition/prospects/stateready/`.
Last worked 2026-09-03. 874 rows in `prospects.csv`. Read `../BRIEF.md` first; this file only adds to it.

## Rules confirmed (with the case that triggered each)

- **No private individuals.** Redwood Services' partners page prints `Partner: <name>` and `General Manager: <name>`
  for every brand, and Northwinds' brand page prints a founder quote with a name and title for each. Both were parsed
  for **organisation name, HQ and website only**; no person field was ever written. Sila's brand cards carry
  customer first names in testimonials — also skipped. A grep for `(CEO|President|founder|owner|GM) <First> <Last>`
  across the finished CSV returns nothing but the brand "Mr. Rooter Plumbing".
- **Business contact routes only.** Every `contact_route` is a `/contact`, `/partner`, `/acquisitions` page or a
  generic mailbox published on the organisation's own site (`info@wrenchgroup.com`, `partnerships@vertexservicepartners.com`,
  `info@creteunited.com`, `info@legacyservicepartners.com`, `sales@1examprep.com`, …). The validator's personal-mailbox
  check passes.
- **No source, no row.** 874/874 rows carry a `source_url` that was actually opened or an API call actually run.
- **No fabrication.** 32 rows carry `website=""` because the site could not be confirmed: 26 PE sponsors whose sites
  403'd or did not resolve, 14 roofing platforms named only in the Profitability Partners table, plus a handful of
  add-ons. Three near-misses were caught and left blank rather than guessed: `allstarservices.com` (a Michigan vending
  company, not Allstar Services), `trusspoint.com` (a mortgage calculator, not TrussPoint), `northpointroofing.com`
  (a New Hampshire roofer, not Northpoint Roofing Systems).
- **Read only.** No logins, no forms. The one POST attempted was PHCC's public chapter-lookup AJAX endpoint
  (a read query, not a submission); Cloudflare blocked it and it was logged, not worked around.

## What worked (with yields)

- **`curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -L` then strip tags in python3.** Every list page.
  WebFetch was used only for prose. The tag-stripper that keeps non-empty text lines (`raw`-then-`lines()` in
  `scripts/parse_brand_pages*.py`) is the workhorse — most platform brand pages put name / location / URL on
  consecutive text lines, so a three-line window is all the parsing you need.
- **Platform "our brands / our partners / our companies / locations" pages: 511 rows.** By far the highest yield in
  the file. Fourteen platforms parsed; see the table in `sources.md` §6 for the exact shape of each.
  Useful variants encountered: `data-name`/`data-location` attributes (Sila), Elementor gallery JSON with the brand
  name in the **logo filename** and the site in the link (Legacy Service Partners), `/partner/<slug>` links only
  (Crete United), company/street/`City, ST ZIP` triples (Service Logic).
- **Flourish-embedded tables.** ACHR's Inc. 5000 article has no HTML table; the data lives at
  `https://flo.uri.sh/visualisation/<id>/embed` in a `_Flourish_data = {...}` JS literal. Decode with
  `json.JSONDecoder().raw_decode()` from the `=`. 33 rows in one shot. This trick generalises to any BNP trade title.
- **NASCLA corporate member directory** (`/membership-directory/corporate`): 46 state licensing agencies plus
  PSI, NNA Surety Bonds and National Contractor License Agency. Names sit on the text line before each `More Info`.
- **Four of the five PE trackers named in the app brief.** ctacquisitions.com is the best of them for *named add-on
  acquisitions*; profitabilitypartners.io is the best for *sponsors* and *roofing platforms*; dealseam.com is the
  best for *scale figures per platform*.

## What failed (and whether it is worth a human retry)

- **Cloudflare 403 to curl — worth retrying from a browser session:** apexservicepartners.com (≈107 brands, the
  biggest single gap), serviceexperts.com, southernhomeservices.com, goettl.com, necanet.org, firesprinkler.org,
  seia.org, getjobber.com, prometric.com, homeserve.com, premiumservicebrands.com, thresholdbrands.com,
  contractorlicensingpros.com, contractorqualifierconnect.com, wwisinc.com, morganstanley.com, cortecgroup.com.
- **PHCC Chapter Connect.** The endpoint is confirmed: `POST https://www.phccweb.org/wp-admin/admin-ajax.php`
  with `action=phcc_chapter_connect&state=<XX>` (found in `wp-content/plugins/phcc_custom/pages/chapter_connect_app.js`).
  Cloudflare returns an interstitial to curl. **Highest-value retry in the file** — it is the whole state-chapter layer.
- **JS-only chapter/affiliate lists with no REST route:** IEC (54 chapters, checked `wp-json/wp/v2/types` — no chapter
  post type), MCAA (Salesforce community at member.mcaa.org), ABC (`/Membership/Chapter-Directory` 404s).
- **Paywalled or missing ranking lists:** ENR Top 600 Specialty Contractors (login wall), PM Top 100 (404),
  Contracting Business Top 40 (404), Electrical Contractor Top 50 (403). Needs a subscription, not a better scrape.
- **Empty JS shells returning HTTP 200/202:** mainstreetwealth.ai (4.4KB), leappartners.com and strikepointgroup.com
  (114 bytes), nearu-services.com (202, empty), comfortsystemsusa.com (202, empty), petermanbrothers.com (578 bytes).
- **`api.usaspending.gov` `spending_by_category/recipient` with `naics_codes: ["238220"]` works** (note: the filter
  is a flat list, **not** the `{"require": [[...]]}` shape — that returns 422). It returned 100 recipients with award
  totals, but they are mostly JVs and general contractors with no evidence of a multi-state *licence* footprint, so
  no rows were written. Left documented as a lead, not used.

## Mistakes I made

- Wrote 26 PE-sponsor rows with best-guess `website` values I had not opened, then caught it on re-read and blanked
  every one. **Blank the field at write time, not at review time.**
- First Wrench Group matcher keyed on the full brand name and silently dropped 8 of 24 brands because the page uses
  short forms ("Plumbline", "Coolray"). Fixed by trying a two-word key and then a one-word key. **Always print
  matched-vs-expected when matching names against page text.**
- Fetched `contractorcampus.com` and got a gambling site (`togeljp.net`) — the apex domain has changed hands.
  Caught it because the parsed `<title>` was gibberish. **Read the title of every page you fetch before trusting it.**
  Same check caught allstarservices.com, trusspoint.com and northpointroofing.com.
- Parsed Redwood with a fixed line offset and got `1976` as one HQ and `Indian` (truncated "Indian Trail") as another.
  Blanked both rather than guessing.

## Assumptions taken without confirmation

- **State licensing boards are recorded as `partner`, not a new type.** They are the regulatory data source behind
  the product's moat, not a sales target. Each such row says so in `notes` so a future agent does not mis-stage them.
  If the fleet later wants a `data-source` type, these 46 rows are the ones to re-label.
- **`contact_route` sometimes holds the organisation's root URL** where the site had no discoverable `/contact` path
  and no generic mailbox. That is a weaker route than the brief intends but is still a business route on the
  organisation's own site; it is never a personal mailbox.
- **Operating brands parsed off a platform page are `secondary`**, per the app brief, even though the platform's page
  is a primary source about the brand's existence. Only rows where the organisation's own site was opened are `verified`.
- **Pool and landscaping roll-ups were skipped** even though the Profitability Partners tracker lists them, because
  those trades are only licensed in a minority of states. Pest control was kept as an adjacent-vertical note.
- **Harbor Compliance and CSC are recorded on both sides.** The app brief listed them as possible partners; both
  actually sell multi-state licence-tracking software, so both appear as `excluded` competitors, and CSC also appears
  as a licence-expediting `partner` because that arm is a genuine referral route. Resolve before any outreach.

## Advice to the next agent

1. Start with Apex Service Partners' brand list and the PHCC chapter endpoint. Between them they are worth ~250 rows,
   and both are blocked only by Cloudflare, not by the data being private.
2. When you hit a platform's brand page, **look at the page source before writing a parser** — five of fourteen used a
   layout no generic parser would have found (data attributes, logo filenames, slug-only links, Flourish embeds).
3. Multi-unit franchisees are the sharpest missing segment and the easiest sale (one owner, three states, no
   compliance department). Franchisor press releases name them; Franchise Times Top 400 ranks them.
4. Re-run `scripts/parse_brand_pages.py` and `parse_brand_pages2.py` before trusting the brand rows — platform
   portfolios change monthly, and the scripts re-fetch when the cache under `raw/sites/` is missing or tiny.
5. Everything flows through `data/rows.jsonl` → `scripts/build_prospects.py`. Append there and rebuild; never hand-edit
   `prospects.csv`.
