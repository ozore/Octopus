# ScopeIQ prospect research — steering file

App: **ScopeIQ** — a $499–999 one-time *state launch compliance report* for aesthetic medicine
(who may inject what, under whose supervision, which CPOM/MSO ownership structure is legal), then
$99–499/mo multi-state monitoring. **`location` (state) is the product's key field**, so state
coverage was optimised deliberately.

Result of this pass: **816 rows** — 635 end-customers, 120 partners, 50 channels, 11 excluded;
768 verified / 46 secondary / 2 unverified; all 50 states + DC present in `location`.

---

## Rules confirmed (constraint -> the case that triggered it)

- **BRIEF §2.1 No private individuals.** This niche is full of practices named after a person.
  Rule applied: an organisation row is allowed when the *name is the business* even if it contains a
  surname ("Dr Refresh Med Spa", "Mirabile M.D. Beauty, Health & Wellness"), but a row is dropped
  when the listing identifies a private individual: first name + surname ("Randy Lindgren Aesthetic
  Rejuvenation"), "…by <FirstName>" ("Nash Injections By Hannah"), "<Personal name>, MD"
  ("Polaris Vein & Aesthetics: Amanda Cooper, MD") or "Lastname, Firstname" ("Glaser, Laura").
  17 listings were dropped this way; the blocklist and regex live in `scripts/build_csv.py`
  (`PERSON_NAMES` / `PERSON_RE`) so the decision is auditable and re-runnable.
  Where I was unsure ("Amber Laine Med Spa + Salon", "Chanel Frances & Co.") I dropped the row, per
  BRIEF §4 ("if you are not sure whether something counts as a private individual: it does").
  Also dropped a whole candidate partner, **aestheticmentor.com**, whose site title is a person's name.
  AmSpa's state-chapter page lists chapter leadership by name — those names are *not* in this file;
  `decision_maker_role` says "chapter chair (role only, no name recorded)".
- **BRIEF §2.2 Business contact routes only.** Two automated guards: `verify_spas.py` rejects
  gmail/yahoo/hotmail/outlook/icloud/proton/aol mailboxes and only accepts a contact page **on the
  same host as the practice's own website** (this removed 2 facebook.com pages and 2 third-party
  booking-widget URLs that had slipped in); `build_csv.py` re-checks every row and blanks the field
  if a personal mailbox survived. 100 rows have an empty `contact_route` rather than a bad one.
- **BRIEF §2.3/2.4 No source, no row; no fabrication.** 32 rows carry an empty `website` because the
  company's own site was unreachable (403/202/no response) and I would have had to guess the URL —
  `notes` says so on every one of them. Size signals are quoted from the page they came from
  ("240 location pages across 37 states listed on its own locations page (2026-09-03)"), never estimated;
  third-party figures are labelled as such in `notes` with the source named.
- **BRIEF §2.5 Read only.** AmSpa's member directory and member lounge, MedSpa Social Media's group
  and The Aesthetic Vault's member area are all behind logins and were **not** entered. No forms, no
  sign-ups, no paid services.
- **BRIEF §2.7 Blocked sources.** facebook.com and reddit.com are blocked, so med spa owner Facebook
  groups and r/medspa — named in the phase-1 ScopeIQ record as the first-revenue channel — could not
  be given a confirmable URL. I wrote **no row** for r/medspa rather than cite a URL I never opened,
  and recorded it in the README Gaps instead.

## What worked (with yields)

- **`yellowpages.com/<city-state>/medical-spas` — 554 rows, by far the highest yield.**
  91 metros x 2 pages = 5,147 listings. Parse `<div class="result">` blocks with stdlib regex
  (`scripts/yp_harvest.py`); each block gives name, street, `locality` (city + state + ZIP — the
  *actual* city, which is what goes in `location`), own website, category and a "From Business" snippet.
  Two passes: 67 CPOM-relevant metros first, then 24 metros chosen only to fill missing states.
- **Opening each med spa's own homepage (`scripts/fetch_sites.py` + `scripts/verify_spas.py`).**
  787 homepages fetched in parallel (14 threads, 20s timeout), 611 HTTP 200, **571 confirmed** by at
  least one aesthetic-medicine keyword. This does three jobs at once: it filters mis-categorised
  nail/hair/gym listings out of the directory, it upgrades the row to `confidence=verified`, and it
  harvests the practice's actual procedure list into `notes` — which is literally ScopeIQ's input.
- **AmSpa vendor directory** (`americanmedspa.org/vendor-directory/`) — 55 vetted vendor affiliates
  with tier, website and category, parsed from `<div class="amspa-vg-card">` blocks. Best partner
  source found anywhere; the association has already done the qualification.
- **AmSpa state chapters page** — 9 channel rows that map one-to-one onto ScopeIQ's product unit.
- **Each platform's own `/locations` page** + `scripts/loc_stats.py` (counts state names and
  `, XX 12345` patterns in stripped text) for defensible, quotable size signals.
- **withorbital.com** (June 2026 US aesthetic-clinic snapshot + 2026 conference calendar) and
  **beautymatter.com** (March 2026 franchise roundup with unit counts) — the two best secondary lists.
- **ctacquisitions.com 2026 M&A multiples report** — no rows, but it named every active PE
  sponsor/platform pairing and the two CPOM changes that are ScopeIQ's whole pitch (CA SB 351
  effective 1 Jan 2026; OR SB 951 effective 9 Jun 2025 with a private right of action).
- `curl -s -A "Mozilla/5.0 …"` + regex beats WebFetch for every list page, exactly as the brief said.

## What failed

- **realself.com 403**, **zocdoc.com 403** — both bot-walled; realself was the app brief's suggested
  directory. Not retryable without a browser.
- **healthgrades.com/medical-spa-directory 410**, **threebestrated.com 410 on every city URL** — retired.
- **expertise.com has no med spa vertical at all** (`/tx/dallas/med-spa`, `/medical-spa`,
  `/medical-spas`, `/us/dallas-tx/med-spa` all 404; domain-restricted WebSearch confirms only
  legal/home/insurance verticals). Do not spend time on it.
- **americanmedspa.org/page/find-a-medical-spa 404** — AmSpa publishes no public med spa directory.
  Worth a human retry *with* a membership login.
- **aspirerewards.com/find-a-provider 404**, **merzaesthetics.com/find-a-provider/ 404** — JS locators,
  as the app brief predicted. Allergan's locator was skipped for the same reason.
- **Sites that would not load at all** (2+ attempts each): idealimage.com, moxie.md, lengea.com,
  vida-flo.com, blushmed.com, curatemedaesthetics.com, alluradermmedspa.com, prevamedspa.com,
  lexrx.com, nourishingskinandwellness.com, zealthy.com, medvi.com, resetiv.com.
- **403/202 bot walls**: skinpharm.com, peachystudio.com, nakedmd.com, alexislauren.com, alastin.com,
  lineagebiomedical.com, dermaconcepts.com, designedbystax.com, ivxhealth.com, ovme.com,
  mintandneedle.com, thedripbar.com, hydrateivbar.com, nelsonhardiman.com, chellelaw.com,
  facialmania*.com, valuecapinc.com, physiciangrowthpartners.com, olympicma.com, aestheticnext.com,
  skininc.com, americanspa.com, dermatologytimes.com. All are worth a human retry from a browser.
- **bbb.org** search pages fetch fine (200) but were not mined this pass — a real extension option.

## Mistakes I made

1. First parallel fetcher was `xargs -P … sh -c` with the wrong `$0`/`$1` positional mapping and
   produced 525 zero-byte files. Replaced with `scripts/fetch_sites.py` (ThreadPoolExecutor + curl,
   cached, writes a `_status.tsv`). Everything since is re-runnable and idempotent.
2. First yellowpages pass used the *search metro* as `location`. Wrong: a "Los Angeles" search returns
   Encino/Glendale/Pasadena businesses, and state is the field this product is sold on. Switched to
   each listing's own `locality`.
3. The contact-page extractor originally took the first `href` matching /contact|book/, which on one
   site was a 1.1 MB inline blob and on others was a facebook.com page or a third-party booking widget.
   Fixed to require a same-host URL under 160 characters. Re-ran both verification passes.
4. I nearly created a row for "Empower Aesthetics" from empoweraesthetics.com — that is a
   single-location med spa in Richmond, KY, **not** the Shore Capital platform (empower.spa).
   Two different organisations with the same name; check the URL, not the name.
5. I wrote two placeholder rows (an r/medspa row with a fake source_url, and a duplicate-guard row)
   intending to filter them in the build. That would have been a fabricated source if I had forgotten.
   Deleted them from `data/curated.py` instead. Never leave a placeholder in a data file.

## Assumptions taken without confirmation

- A yellowpages listing in the *Medical Spas* category whose own homepage names an injectable, a
  laser, GLP-1 or IV therapy is an aesthetic practice inside ScopeIQ's ICP. Not checked against any
  state licence register; no claim is made about whether any of them is currently compliant.
- For multi-state organisations, `location` holds the **HQ city/state** and the operating-state list
  goes in `notes` / `size_signal`. For single-location practices `location` is the practice's own
  city and state. Documented here because the brief asked for state in `location` always and this is
  the compromise I chose.
- `size_signal` is left empty for single-location med spas: no sourced headcount or revenue exists,
  and estimating one into a structured field is forbidden.
- Law firms that market med spa compliance are `excluded` (they compete for the same spend), even
  though several could plausibly be referral partners. Recorded so they are not re-staged later.
- **Moxie** is `excluded` (it sells the whole launch bundle including the compliance step);
  **Qualiphy, Medical Director Co, Guardian Medical Direction and Spakinect** are `partner` (they
  sell the physician relationship or the good-faith-exam workflow, not a cited 50-state scope/CPOM
  report). `notes` on each row records the call and the overlap. **AmSpa** is recorded as `partner`
  even though it is also the closest thing to an incumbent — its directory, chapters, show and
  bootcamps are too valuable a channel to bury in `excluded`; the `notes` say both things.
- Sources disagree on who backs LaserAway (Ares/Seidler per ctacquisitions.com vs Lightyear per
  withorbital.com). Both are recorded, neither is asserted.

## Advice to the next agent

1. **Yellowpages is not exhausted and the verification pass is the whole value.** Pages 3–5 exist
   for all 91 metros, and `weight-control-services` and `physicians-surgeons-cosmetic-surgery` are
   unmined categories. Raise the per-metro cap in the selector and re-run — do *not* skip
   `verify_spas.py` to save time; it is what makes these rows usable and it harvests the procedure
   list for free.
2. **AmSpa is the centre of gravity.** Association, show, bootcamps, nine state chapters, a vetted
   vendor directory, and the incumbent product all in one organisation. Human login access to its
   member directory would be worth more than any other single unlock in this market.
3. **The missing segment is named multi-unit franchisees.** No US aesthetic franchisor publishes its
   franchisee operating companies. State franchise registration filings (CA DFPI, WI, MN, MD) and
   FDD Item 20 do. That is the highest-intent buyer in the file and it is currently absent.
4. **Do not add rows for individual injectors**, however loud they are in this niche — and watch for
   practices whose *name* is a person; the blocklist in `build_csv.py` is not exhaustive.
5. Rebuild with `python3 phase-3-acquisition/prospects/scopeiq/scripts/build_csv.py` — it reads only
   `data/` and needs no network. The 382 MB `raw/` HTML cache was deleted after collection rather than
   left in the repo; re-create it with `scripts/yp_harvest.py` + `scripts/fetch_sites.py` on the URL
   lists still in `data/` before re-running `verify_spas.py`.
