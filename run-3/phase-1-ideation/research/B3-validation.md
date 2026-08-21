# Run 3 — Deep validation: B3 CarrierWatch

Validated 2026-08-19 by four independent lenses (round 2, with round-1 kill
patterns applied). Every URL was fetched on the date stated.
**Overall verdict: REFUTED AS PITCHED** — per-lens verdicts: mandate=SURVIVES_RESHAPED, corpus=REFUTED, competition=REFUTED, kill=REFUTED


---

## 01 Mandate & demand — verdict: SURVIVES_RESHAPED

## B3 — CarrierWatch: deep validation (all checks live, 2026-08-19)

### 1. The demand side got dramatically stronger — verified

Five days before the card was written, the Supreme Court decided **Montgomery v. Caribe Transport II, LLC, No. 24-1238, 5/14/26, 608 U.S. 219** (docket line read directly off supremecourt.gov's 2025-term slip-opinion table). Unanimous, Barrett writing: the FAAAA's §14501(c)(2)(A) safety exception saves state negligent-hiring claims against freight brokers, resolving a 6th/7th/9th Circuit split against C.H. Robinson. The pleaded negligence hook was FMCSA's **conditional safety rating** at the time of hire. Every US broker is now exposed to state negligent-selection suits, and the exposure attaches to *what the federal record said on the day you tendered*. That is the single best tailwind in this whole ballot — and, importantly, it points at **evidence-of-diligence**, not at alerting.

Primary duty is otherwise thinner than the card implies. **49 USC 14916(c)** (fetched from uscode.house.gov, text in effect 8/18/26) caps the double-brokering civil penalty at **$10,000 per violation**, joint and several to officers/directors — but that binds the *unauthorized broker*, not the broker who tenders to a lapsed carrier. **49 CFR 387.307** (eCFR, current, "effective January 16, 2026") still sets the broker surety bond/trust at **$75,000**, not the "$150,000 effective July 2026" repeated in trade coverage — that secondary claim is not in the CFR today. So the legal engine here is common-law negligent selection post-*Montgomery*, not a federal penalty statute.

### 2. The data foundation named in the card is dead — this is the fatal finding

FMCSA retired L&I on **May 14, 2026 at 8:00 PM ET** (banner read live off li-public.fmcsa.dot.gov today) and replaced URS with **Motus** (Fed. Reg. 2026-08334, published 4/29/26; Phase I 12/8/25, Phase II Q2 2026; the notice states FMCSA will "sunset … the former Interstate Commerce Commission Licensing and Insurance system, established in 1994").

The three Socrata datasets the card names are now **zombies**: they report `rowsUpdatedAt` of *today* (qh9u-swkp 2026-08-19T13:03:50Z; 9mw4-x3tu 13:38:02Z; 6eyk-hxee 14:30:04Z) while containing **zero records after 15 May 2026**. Verified by SoQL counts: insurance transactions by month 2026 = Jan 18,255 / Feb 19,740 / Mar 27,020 / Apr 29,286 / **May 13,040 / Jun 0 / Jul 0 / Aug 0**; authority actions identical shape, last `disp_served_date` = 05/15/2026. The card's A3/A4 defence is *"Socrata datasets expose their own last-updated metadata"* — that mechanism reports **green on a feed that has been dead for three months**. A product shipped on the card as written would have emailed "no changes detected" every night since June. That is the round-1 pattern in its purest form: a deterministic product asserting a legal fact ("nothing lapsed") it cannot source.

The replacement feeds **do exist and the card never found them**: `c5y8-a4uz` Motus Insur, `yu5v-wbh6` Motus AuthHist, `wb4f-neki` Motus RevokeSuspend, `inys-ebih` Motus Carrier, `6snj-ed7q` Motus BOC3, all created 2026-06-03, all live (Motus AuthHist max `status_change_date` = **20260819**, i.e. today). But coverage is partial: **102,518 distinct USDOTs** in Motus AuthHist and 103,781 in Motus Carrier, against **1,860,604** rows in the frozen legacy carrier file. Only entities that have transacted since migration appear. So *changes* are visible; **current baseline status is not derivable from bulk files at all** right now. Baseline needs QCMobile (live — returns `{"content":"Must provide Webkey"}` HTTP 404, i.e. free key required, untested at volume) or SAFER Company Snapshot (HTTP 200, free, but HTML).

Two card premises collapse outright: **UCR** — `fux9-ij6p` returns HTTP 403 `"no row or column access to non-tabular tables"`, zero columns, `rowsUpdatedAt` **2018-12-17**; there is no verified free UCR-current flag. **Officer-collision chameleon signals** — no officer field exists in any L&I or Motus dataset.

The one genuine discovery: **`az4n-8mr2` Company Census File** (rowsUpdatedAt 2026-08-18, **4,487,571 rows**) carries `company_officer_1`, `company_officer_2`, `phone`, and — decisively — **`prior_revoke_flag` and `prior_revoke_dot_number`**. FMCSA publishes the chameleon link itself. The onboarding tier is buildable; just not from the sources the card lists.

### 3. Competitive floor: bundled, cheaper, and already shipping

- **Truckstop Carrier Hub** (fetched today): Basic **$99/mo**, Advanced **$200/mo**, and *Load Board Premium* "**From $369/mo**" with "full carrier monitoring" — monitoring bundled into the load board a broker already pays for. Truckstop also owns RMIS. Kill pattern #3, live.
- **DAT** launched **Carrier Management Suite inside DAT One** (Oct 2025) — the other load board, same bundling.
- **CarrierOK**: Pro **$149/mo/user**, Team **$349/5 users**, Business **$499/10 users**, no contract.
- **Carrier Assure**: **free** Individual tier; Premium **$149/mo**.
- **Cipher & Row**: broker Essential **$299/mo**, continuous monitoring with signed webhooks, MCP server, explicit "Carrier411 migration".
- **Descartes MyCarrierPortal**: from **$515/mo**, unlimited users — and its site header today advertises "**Turn Carrier Review Management into Defensible Documentation. Explore AuditLog**", i.e. the *Montgomery* reshape is already a shipped incumbent feature.
- **CarrierOwl** has abandoned subscription monitoring for **$29/report, first free, 3 free lookups/day**.
- **VerifyCarrier** — the card's headline comp — states on its own pricing page today that Carrier Monitoring is "**Coming Soon**", waitlist only. The card's proof of willingness-to-pay is a waitlist.

The card's $39–$149/mo band sits *above* free tiers and *below* nothing. There is no price gap.

### 4. Engine-never-arbiter

"The moment a carrier … lapses … you know before you tender the load" is an outcome guarantee an unattended product cannot sign — and post-*Montgomery* a broker who tendered on a green screen will name the vendor. Worse, the chameleon flag asserts a fraud characterization about a named third-party business; carriers already sue brokers over FreightGuard-style reports. The only defensible form is: *"here is the FMCSA record for DOT X, retrieved <timestamp>, source dataset <id>, and here is the row that changed since <date>"* — mechanism plus source record, never a verdict, never a "clear".

### 5. Verdict

As pitched: refuted. Reshaped: a **per-tender, immutable, source-cited FMCSA evidence record** (the *Montgomery* diligence artifact), built on Motus datasets + `az4n-8mr2` + QCMobile, priced $19–49/mo under Truckstop's $99 floor, selling documentation rather than prevention. Also: the name **CarrierWatch** is already a Truckstop product line — rename before anything else.


### Proven (primary source, fetched 2026-08-19)

- Supreme Court decided Montgomery v. Caribe Transport II, LLC (No. 24-1238) on 5/14/26, 608 U.S. 219, opinion by Barrett — confirmed on supremecourt.gov's 2025-term slip opinion table fetched 2026-08-19; SCOTUSblog analysis (5/15/26) states the ruling was unanimous (9-0) and holds FAAAA §14501(c)(2)(A) does not preempt state negligent-hiring claims against freight brokers.
- 49 USC 14916(c) sets the unlawful-brokerage civil penalty at not more than $10,000 per violation, joint and several to officers/directors/principals — fetched from uscode.house.gov 2026-08-19, text in effect August 18, 2026.
- 49 CFR 387.307 currently requires a property broker surety bond or trust fund of $75,000 (eCFR renderer, fetched 2026-08-19; section marked 'effective January 16, 2026'). The '$150,000 effective July 2026' figure appearing in trade coverage is NOT in the current CFR text.
- FMCSA published Fed. Reg. 2026-08334 (4/29/26) announcing Motus: Phase I released December 8, 2025; Phase II planned Q2 2026; FMCSA will 'sunset the current URS ... and the former Interstate Commerce Commission Licensing and Insurance system, established in 1994'; all new applicants must pass IDEMIA identity proofing plus a new business verification step; MC/FF number elimination and BOC-3 process changes were DEFERRED out of Phase II after stakeholder pushback.
- li-public.fmcsa.dot.gov displays live today: 'All current registration functionality-including new applications in URS, changes and filings via L&I (Public), and registration options in the FMCSA Portal-will be permanently retired on Thursday, May 14, at 8:00 PM ET.'
- The three L&I Socrata datasets named in the card are content-frozen: qh9u-swkp (ActPendInsur) has 0 rows with trans_date in Jun/Jul/Aug 2026 (Jan 18,255 / Feb 19,740 / Mar 27,020 / Apr 29,286 / May 13,040); 9mw4-x3tu (AuthHist) last disp_served_date is 05/15/2026 — yet both report rowsUpdatedAt of 2026-08-19 via the Socrata metadata API. Verified by direct SoQL count queries 2026-08-19.
- Live replacement datasets exist and were never identified in the card: c5y8-a4uz Motus Insur, yu5v-wbh6 Motus AuthHist, wb4f-neki Motus RevokeSuspend, inys-ebih Motus Carrier, 6snj-ed7q Motus BOC3 — all createdAt 2026-06-03, all currently refreshing (Motus AuthHist max status_change_date = 20260819).
- Motus dataset coverage is partial: 102,518 distinct usdot_number in Motus AuthHist and 103,781 in Motus Carrier, versus 1,860,604 rows in the frozen legacy Carrier file (6eyk-hxee) — so current baseline authority/insurance status for an arbitrary carrier is not derivable from bulk files today.
- The UCR dataset the card cites (fux9-ij6p) is unusable: HTTP 403 'no row or column access to non-tabular tables', zero columns in metadata, rowsUpdatedAt 2018-12-17.
- FMCSA Company Census File az4n-8mr2 is live (rowsUpdatedAt 2026-08-18, 4,487,571 rows) and contains company_officer_1, company_officer_2, phone, prior_revoke_flag and prior_revoke_dot_number — the actual public substrate for a chameleon screen, which the card missed. No officer field exists in any L&I or Motus dataset.
- Truckstop Carrier Hub pricing fetched live 2026-08-19: Basic 'Starting at $99/mo', Advanced 'Starting at $200/mo', and Load Board Premium 'From $369/mo' described as including 'full carrier monitoring' — monitoring bundled into the load board brokers already buy. 'CarrierWatch' is named as a Truckstop monitoring product in secondary coverage.
- Descartes MyCarrierPortal pricing page (fetched 2026-08-19) shows 'Starting: $515 / month' with unlimited users, and its site banner markets 'Turn Carrier Review Management into Defensible Documentation. Explore AuditLog' — the post-Montgomery evidence-artifact positioning is already an incumbent feature.
- CarrierOK pricing (fetched 2026-08-19): Pro $149/mo per user, Team $349/mo for up to 5 users, Business $499/mo for up to 10 users, no contract; plus data products at $199-$999/mo.
- Carrier Assure pricing (fetched 2026-08-19): Individual tier Free (1 account, unlimited SuspectCarrier reports); Premium $149 USD/mo.
- Cipher & Row pricing (fetched 2026-08-19): broker plans from $299/mo (Essential, 3 seats) to $1,999-$2,999/mo Scale, with continuous monitoring, signed webhook alerts, REST API and MCP server, and an explicit Carrier411 migration path.
- CarrierOwl has abandoned the monitoring subscription model: pricing page fetched 2026-08-19 shows free lookup (3 searches/day, 10 more with email), $29 per manually reviewed report, $99 for 5 reports, delivery within one business day.
- VerifyCarrier — the card's primary willingness-to-pay evidence — states on its own pricing page today that Carrier Monitoring is 'Coming Soon' / waitlist; only the DOT lookup API is available. Its own comparison table lists Carrier411 at ~$35-45/user/mo and CarrierOwl at $79-149/mo (secondary, on VerifyCarrier's page).
- FMCSA QCMobile API is live and gated behind a free webkey: https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 returned HTTP 404 with body {'content':'Must provide Webkey'} (2026-08-19). SAFER Company Snapshot is live, free and keyless (HTTP 200, 45,963 bytes, text/html) for USDOT 1006607.

### Unproven

- Whether QCMobile (with a free webkey) still reflects post-Motus authority and insurance status accurately, and whether it has an undocumented rate limit at watchlist scale — not testable without registering a key.
- Whether the partial Motus dataset coverage (~103k USDOTs) is a transitional backfill that will eventually reach full population, or a permanent 'entities that transacted in Motus' scope. FMCSA has published no changelog or coverage statement I could fetch (fmcsa.dot.gov returns HTTP 403 to automated fetch, including /registration and /registration/resources-hub).
- Whether FMCSA intends to keep publishing the legacy L&I datasets in place as frozen archives, retire them, or backfill them — the Socrata metadata actively misreports freshness and no deprecation notice is attached.
- Carrier411's own published pricing — carrier411.com returned HTTP 403 (Cloudflare challenge) today. The ~$35-45/user/mo figure is VerifyCarrier's secondary claim about a competitor.
- SaferWatch pricing — saferwatch.com/pricing returned HTTP 403 Cloudflare challenge today; the card's $79.95/mo figure rests on a third-party insurance broker's blog post and was not verified at source.
- Highway's pricing (reported in secondary blog content as $1,500-$2,500/mo for small-mid brokers) — Highway publishes no pricing page I could fetch.
- TIA's $700M-$1B annual double-brokering loss figure and FMCSA's complaint-volume growth (~2,000 in 2021 to 8,000+ in 2025) remain secondary-sourced; tianet.org primary documents were not fetched and FMCSA's own statistics pages are behind the same 403.
- What small brokers actually do and pay today from their own mouths — reddit.com search JSON returned HTTP 403 and no r/FreightBrokers or freightbrokerslist thread was directly readable this session. All small-broker behaviour claims here are inferred from vendor pricing pages, not from operator testimony.
- Whether Motus itself will expose a public API or a broker-facing status feed that further shrinks the product's job — the Fed. Reg. notice says only 'The public will be able to search an entity's registration record, visit the FMCSA Register'; register.fmcsa.dot.gov did not resolve (connection failure, status 000).
- Whether an insurance cancellation still produces a 30-day advance filing visible in Motus Insur before the coverage actually lapses — the Motus RevokeSuspend rows show a serve_date/effective_date gap of ~30 days for suspensions, but I did not verify the insurance-cancellation analogue.

### Fatal risks

- The card's entire named data pipeline is dead and lies about it. The three L&I Socrata datasets (qh9u-swkp, 9mw4-x3tu, 6eyk-hxee) contain zero records after 15 May 2026 — the day FMCSA retired L&I — while their Socrata rowsUpdatedAt metadata reports today's date. The card's stated staleness defence is verbatim 'Socrata datasets expose their own last-updated metadata', so the product's fail-closed mechanism would have reported GREEN for three straight months on a dead feed, sending nightly 'no lapse detected' emails to brokers who are now, post-Montgomery, personally exposed to negligent-selection judgments. This is the round-1 kill pattern exactly: a deterministic product asserting a legal fact it cannot source.
- The headline promise is an outcome claim an unattended product cannot sign. 'The moment a carrier lapses... you know before you tender the load' guarantees prevention; Montgomery v. Caribe Transport II (5/14/26) makes the broker who tendered on a green screen a defendant who will name the vendor. The chameleon half is worse: it asserts a fraud characterization about a named third-party business, and carriers already sue over FreightGuard-style reports (Out of Nowhere v. Nolan Transportation Group, N.D. Ga., Jan 2025 — secondary). Neither the alert nor the flag is signable as pitched.
- Kill pattern #3 confirmed live: monitoring is bundled into the load boards brokers already pay for. Truckstop Load Board Premium is 'From $369/mo' and includes 'full carrier monitoring'; Truckstop Carrier Hub Basic is $99/mo; DAT put Carrier Management Suite inside DAT One in Oct 2025. A standalone $39-149/mo monitor competes with a line item the buyer's existing subscription already covers.
- Kill pattern #2 confirmed live and BELOW the hypothesized price: Carrier Assure ships a free Individual tier and $149/mo Premium; CarrierOwl gives 3 free lookups/day and sells $29 per-report reviews with no subscription; Truckstop Carrier Hub Basic is $99/mo. The card's $39-149/mo band has free product underneath it and bundled product beside it — there is no price gap to wedge into.
- The card's single best piece of willingness-to-pay evidence is a waitlist. VerifyCarrier's own pricing page today marks Carrier Monitoring 'Coming Soon'; the $49/$99/$249 tiers the card treats as confirmed market pricing are not shipping. Meanwhile the reshape target — defensible documentation for negligent-selection defence — is already a shipped Descartes MyCarrierPortal feature ('AuditLog') sitting on top of a $515/mo unlimited-user plan.
- Two of the three headline monitored signals cannot be built from the sources claimed. The UCR dataset (fux9-ij6p) is non-tabular, has zero columns, HTTP 403 on rows, and last updated 2018-12-17 — there is no verified free UCR-current flag anywhere. Officer-collision chameleon signals do not exist in any L&I or Motus dataset (no officer field). The card's 'deterministic diff on authority/insurance/UCR booleans' is a diff on two booleans, one of which currently has no live baseline source.
- Name collision: 'CarrierWatch' is an existing Truckstop monitoring product line. Shipping under this name into this exact buyer segment is not survivable.

### References

- https://www.federalregister.gov/api/v1/documents/2026-08334.json (fetched 2026-08-19) — Fed. Reg. metadata for 'Availability of Motus, FMCSA's New Registration System', published 2026-04-29; abstract confirms Phase I 12/8/25, Phase II Q2 2026, and sunset of URS/MCMIS registration components/L&I.
- https://www.federalregister.gov/documents/full_text/text/2026/04/29/2026-08334.txt (fetched 2026-08-19) — Full text of the Motus notice (HTTP 200, 27,836 bytes) — IDEMIA identity proofing, business verification, deferral of MC/FF elimination and BOC-3 changes, spring 2026 rulemaking intent.
- https://li-public.fmcsa.dot.gov/LIVIEW/pkg_html.prc_limain (fetched 2026-08-19) — FMCSA Licensing & Insurance public site (HTTP 200, 11,513 bytes) carrying the banner retiring URS/L&I(Public)/Portal registration functionality on Thursday, May 14 at 8:00 PM ET.
- https://data.transportation.gov/api/views/qh9u-swkp.json (fetched 2026-08-19) — Socrata metadata for ActPendInsur (HTTP 200, 25,600 bytes) — rowsUpdatedAt 2026-08-19T13:03:50Z, update frequency R/P1D, column list.
- https://data.transportation.gov/resource/qh9u-swkp.json?$select=count(1)&$where=trans_date%20like%20'06/%25/2026' (fetched 2026-08-19) — SoQL count proving zero insurance transactions in June 2026 (same query run for Jan-Aug; May 13,040 then 0).
- https://data.transportation.gov/api/views/9mw4-x3tu.json (fetched 2026-08-19) — Socrata metadata for AuthHist (HTTP 200, 23,076 bytes) — rowsUpdatedAt 2026-08-19T13:38:02Z despite frozen content.
- https://data.transportation.gov/resource/9mw4-x3tu.json?$select=disp_served_date,count(1)&$where=disp_served_date%20like%20'05/%25/2026'&$group=disp_served_date (fetched 2026-08-19) — Daily counts showing authority actions stop at 05/15/2026, one day after L&I retirement.
- https://data.transportation.gov/api/views/6eyk-hxee.json (fetched 2026-08-19) — Legacy Carrier file metadata (HTTP 200, 58,461 bytes); count query returned 1,860,604 rows; no officer field.
- https://data.transportation.gov/api/views/fux9-ij6p.json (fetched 2026-08-19) — UCR dataset metadata — zero columns, rowsUpdatedAt 2018-12-17T23:53:42Z; rows endpoint returns HTTP 403 'no row or column access to non-tabular tables'.
- https://api.us.socrata.com/api/catalog/v1?search_context=data.transportation.gov&domains=data.transportation.gov&categories=Trucking%20and%20Motorcoaches&limit=40 (fetched 2026-08-19) — Catalog listing (137 datasets) that surfaced the six new Motus datasets and the Company Census File.
- https://data.transportation.gov/api/views/yu5v-wbh6.json (fetched 2026-08-19) — Motus AuthHist metadata — createdAt 2026-06-03, rowsUpdatedAt 2026-08-19; SoQL showed max status_change_date 20260819 and 102,518 distinct USDOTs.
- https://data.transportation.gov/api/views/wb4f-neki.json (fetched 2026-08-19) — Motus RevokeSuspend metadata and sample rows — live suspension notices with serve/effective dates through August 2026.
- https://data.transportation.gov/api/views/inys-ebih.json (fetched 2026-08-19) — Motus Carrier metadata and column list (no officer field); 103,781 distinct USDOTs.
- https://data.transportation.gov/api/views/c5y8-a4uz.json (fetched 2026-08-19) — Motus Insur metadata; monthly counts May-Aug 2026 confirm live insurance filings.
- https://data.transportation.gov/api/views/az4n-8mr2.json (fetched 2026-08-19) — Company Census File — rowsUpdatedAt 2026-08-18, 4,487,571 rows, includes company_officer_1/2, phone, prior_revoke_flag, prior_revoke_dot_number.
- https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 (fetched 2026-08-19) — QCMobile API live check — HTTP 404, application/hal+json, body {'content':'Must provide Webkey'} — endpoint alive, free key required.
- https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=1006607 (fetched 2026-08-19) — SAFER Company Snapshot — HTTP 200, text/html, 45,963 bytes, keyless; the free first-party lookup substitute.
- https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title49-section14916&num=0&edition=prelim (fetched 2026-08-19) — 49 USC 14916 full text (in effect Aug 18, 2026) — $10,000 per-violation civil penalty, private right of action, joint and several officer liability.
- https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title49-section13906&num=0&edition=prelim (fetched 2026-08-19) — 49 USC 13906 — statutory financial-responsibility basis for carrier insurance filings.
- https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-49?chapter=III&subchapter=B&part=387&section=387.307 (fetched 2026-08-19) — Current 49 CFR 387.307 — broker surety bond/trust fund of $75,000, section effective January 16, 2026; refutes the '$150,000 July 2026' trade claim.
- https://www.supremecourt.gov/opinions/slipopinion/25 (fetched 2026-08-19) — SCOTUS slip-opinion table confirming 24-1238 Montgomery v. Caribe Transport II, LLC, decided 5/14/26, 608 U.S. 219, opinion by Barrett.
- https://www.scotusblog.com/2026/05/court-rules-freight-brokers-can-face-negligent-hiring-suits-under-state-law/ (fetched 2026-08-19) — Opinion analysis (5/15/26) — 9-0, FAAAA §14501(c)(2)(A) safety exception saves state negligent-hiring claims; conditional safety rating was the pleaded hook.
- https://truckstop.com/product/carrier-hub/ (fetched 2026-08-19) — Truckstop Carrier Hub pricing — Basic 'Starting at $99/mo', Advanced 'Starting at $200/mo', Load Board Premium 'From $369/mo' with full carrier monitoring.
- https://verifycarrier.com/pricing (fetched 2026-08-19) — VerifyCarrier pricing — Carrier Monitoring marked 'Coming Soon', waitlist only; comparison table citing Carrier411 ~$35-45/user/mo and CarrierOwl $79-149/mo.
- https://www.carrier-ok.com/pricing (fetched 2026-08-19) — CarrierOK pricing — Pro $149/mo/user, Team $349/5 users, Business $499/10 users, plus $199-$999/mo data products.
- https://www.mycarrierportal.com/features/pricing/ (fetched 2026-08-19) — Descartes MyCarrierPortal — 'Starting: $515 / month', unlimited users; site banner markets AuditLog 'Defensible Documentation'.
- https://carrierassure.com/pricing (fetched 2026-08-19) — Carrier Assure — free Individual tier, Premium $149 USD/mo, DOT authority & monitoring.
- https://www.cipherandrow.com/pricing (fetched 2026-08-19) — Cipher & Row — broker plans $299-$2,999/mo, continuous monitoring with signed webhooks, MCP server, Carrier411 migration.
- https://carrierowl.com/pricing/ (fetched 2026-08-19) — CarrierOwl — free lookup (3/day), $29 per manually reviewed report, $99 for 5; subscription monitoring abandoned.
- https://www.carrier411.com/ (fetched 2026-08-19) — HTTP 403 Cloudflare block — Carrier411's own pricing could not be verified.
- https://saferwatch.com/pricing (fetched 2026-08-19) — HTTP 403 Cloudflare challenge — SaferWatch pricing could not be verified at source.
- https://www.fmcsa.dot.gov/registration (fetched 2026-08-19) — HTTP 403 (Akamai) — FMCSA's own registration and resources-hub pages are not fetchable by automated tooling; noted as an A4 access constraint.

---

## 02 Corpus & moat — verdict: REFUTED

## B3 — CarrierWatch: deep validation (data-source lens), 2026-08-19

### Headline: the card's data foundation was decommissioned 97 days ago

All four datasets named in B3's `knowledge_base` fail live verification. This is the round-1 lesson in pure form: all four return HTTP 200, all four have plausible row counts, all four are unusable.

**The three L&I Socrata datasets are frozen.** `qh9u-swkp` (Active/Pending Insurance), `9mw4-x3tu` (Authority History) and `6eyk-hxee` (Carrier census) each carry an identical verbatim notice in Socrata metadata: *"Note: This dataset was last refreshed on 05/14/2026 and will no longer be updated."* Confirmed at row level. Insurance `trans_date` by month 2026: Jan 18,255 / Feb 19,740 / Mar 27,020 / Apr 29,286 / **May 13,040 (partial) / Jun 0 / Jul 0 / Aug 0**. Authority History `disp_served_date`: Mar 20,324 / Apr 19,514 / **May 8,902 / Jun 0 / Jul 0 / Aug 0**. `Revocation - All With History` (sa6p-acbp) carries the same notice.

Note the trap: all three report `rowsUpdatedAt = 2026-08-19` (today). A miner checking Socrata's `data_updated_at` — the exact staleness check B3's A4 case relies on ("Socrata datasets expose their own last-updated metadata") — would conclude these are fresh daily. **The card's own staleness detector is blind to the failure that has occurred.** That alone refutes A4 as written.

**The UCR dataset does not exist as data.** `fux9-ij6p` has `assetType: "href"`, **0 columns, 0 rows**, `rowsUpdatedAt = 2018-12-17`. Its `accessPoints` points at `safer.fmcsa.dot.gov/UCRQueryForm.aspx`, an HTML form. UCR is one of three signals in the headline promise ("authority, insurance or UCR") and has no machine-readable source. The card flagged this as needing confirmation; confirmation is negative.

**QCMobile is not keyless.** The card states QCMobile is a "free ad-hoc JSON snapshot," calls it "the keyless QCMobile ad-hoc endpoint," and builds its 2–4 week time-to-revenue on shipping against it before the bulk pipeline exists. Live: `GET /qc/services/carriers/76830` → **HTTP 404, `{"content":"Must provide Webkey"}`**; with a dummy key → **404 `{"content":"Webkey not found"}`**. Registration required. The fast-MVP path in the card does not exist as described.

**SMS monthly files are not autonomously fetchable.** `ai.fmcsa.dot.gov/SMS/Tools/Downloads.aspx` → **HTTP 302** to `fmcsa.dot.gov/registration/fmcsa-data-dissemination-program#collapse28721`, which returns **HTTP 403 AkamaiGHost** to scripted fetch (and to WebFetch). No CSA/SMS ingestion without browser-emulation — an A4 problem.

### What I found that the card missed: MOTUS, and why it doesn't rescue the pitch

FMCSA cut over to a new registration system (MOTUS) around 2026-05-14. Live successor datasets exist and are genuinely current — I verified rows, not catalog entries: `Motus AuthHist - All With History` (yu5v-wbh6), `Motus Insur - All With History` (c5y8-a4uz), `Motus Carrier - All With History` (inys-ebih), `Motus RevokeSuspend - All With History` (wb4f-neki). All declare `Update Frequency: R/P1D`; max date in each is **20260819 (today)**; AuthHist shows 669–820 status changes/day through 2026-08-18. Dates are `YYYYMMDD`, not the legacy `MM/DD/YYYY` — a silent schema break.

The signals B3 wants are present and deterministic: `reason` values include *"Involuntary Suspension - insurance cancellation effective; no active insurance meeting minimum coverage on file"* (2,337 rows; 1,323 in the last 30 days), *"Involuntary Suspension - BOC-3 cancellation effective"* (183), REINSTATED (15,169+907), GRANTED (54,652+6,631), Revoked (4,603).

**But coverage is fatal.** MOTUS holds ~103,781 distinct USDOT numbers (Carrier), 102,518 (AuthHist), 82,118 (Insur), 8,517 (RevokeSuspend) — against **1,679,121 distinct DOT numbers in the legacy carrier file** and 328,575 with active common authority. I sampled legacy carriers with `common_stat='A'` and looked them up in MOTUS across two independent samples: **14.4% coverage (AuthHist), 12.8% (Insur), 14.4% (Carrier); 23.0% in a second sample.** The MOTUS population skews to new registrants (sample legal names carry DOT numbers 3.4M–5.3M); long-established carriers (DOT 11682, 105597, 112975) are absent.

B3's promise is *"the moment a carrier **already in your approved network** lapses… you know **before you tender the load**."* An established brokerage's approved network is precisely the long-tenured carriers MOTUS does not yet contain. The product would be blind on roughly 6 of 7 of them, while displaying green. There is no autonomous path to the missing 86%: the only current, complete source is the `li-public.fmcsa.dot.gov` L&I web application (live, HTTP 200, Oracle PL/SQL HTML) — scraping it is exactly the A4-forbidden scraper-fleet path, plus ToS exposure.

### Round-1 kill patterns

1. **Free first-party substitute** — SAFER Company Snapshot and li-public L&I are free, first-party, and current. Both live-confirmed.
2. **Live incumbents below the hypothesized price** — the card's central pricing evidence is wrong in both directions. VerifyCarrier's Carrier Monitoring tiers ($49/$99/$249), cited as proof "money already changes hands," are marked **"Launching Soon" / not purchasable**. Meanwhile the real floor is *above* B3's $39–149: CarrierOK Pro is **$149/mo per user**, with data products at $199–$999/mo.
3. **Bundled inside software the buyer already pays for** — confirmed live and decisive. Truckstop **Carrier Hub** monitors "authority changes, insurance lapses, or a safety score drops" and "Authority revocations, insurance lapses, contact changes, fraud signals," from **$99/mo Basic / $200/mo Advanced**, and **bundles with Load Board Premium from $369/mo** — i.e. inside the load board a broker already buys. Highway's carrier vetting is likewise being embedded directly into TMSs (Transfix TMS, June 2026).

### Engine-never-arbiter

"You know before you tender the load" is a completeness guarantee, unsignable at 14% coverage — the same class as round-1's "never miss a deadline." "Chameleon screen" is worse: address/phone/officer collision scoring (computable from `bus_street_po`/`bus_telno`) produces an **accusation of identity fraud** against a named business. Deterministic or not, that is a legal-fact assertion with defamation exposure that an unattended product cannot sign.

### The one genuinely sellable mechanism

`Motus RevokeSuspend` carries `order1_serve_date` and `order1_effective_date`. The gap is a **fixed 30 days** (n=400 sampled: min 30, median 30, max 30), and **1,680 carriers currently sit inside that window** with an order served but not yet effective. That is a real, forward-looking, source-cited fact — "FMCSA served an involuntary suspension notice on this USDOT on [date]; it becomes effective [date]; here is the record." It states a mechanism and shows the source record. But it covers 8,517 distinct USDOTs, and Truckstop Carrier Hub Advanced already alerts on it. It is a feature, not a company.

### Verdict

REFUTED. Three of four named sources are dead or nonexistent; the free MVP path (keyless QCMobile) does not exist; the live successor covers 14% of the target population with no autonomous path to the rest; the price wedge is inverted against a $149/mo floor; and the function is bundled into the load board the buyer already pays for.

### Proven (primary source, fetched 2026-08-19)

- FMCSA L&I Socrata datasets qh9u-swkp, 9mw4-x3tu, 6eyk-hxee and sa6p-acbp all carry the verbatim metadata note 'This dataset was last refreshed on 05/14/2026 and will no longer be updated' (fetched 2026-08-19 via /api/views/{id}.json, HTTP 200)
- The freeze is real at row level, not just metadata: qh9u-swkp insurance trans_date counts for 2026 are Jan 18,255 / Feb 19,740 / Mar 27,020 / Apr 29,286 / May 13,040 / Jun 0 / Jul 0 / Aug 0 (SODA $where trans_date like, HTTP 200, 2026-08-19)
- 9mw4-x3tu authority history disp_served_date 2026: Mar 20,324 / Apr 19,514 / May 8,902 / Jun 0 / Jul 0 / Aug 0; orig_served_date same pattern (May 5,446 then zero)
- All three frozen datasets nonetheless report rowsUpdatedAt = 2026-08-19 (today), so the card's stated staleness-detection method (Socrata last-updated metadata) cannot detect this failure
- UCR dataset fux9-ij6p is not a dataset: assetType 'href', viewType 'href', 0 columns, 0 rows, rowsUpdatedAt 2018-12-17, accessPoints pointing to safer.fmcsa.dot.gov/UCRQueryForm.aspx (an HTML form)
- QCMobile API requires a webKey: GET https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 returns HTTP 404 with body {"content":"Must provide Webkey"}; with a dummy key, HTTP 404 {"content":"Webkey not found"} (2026-08-19). The card's 'free and keyless' claim is false.
- FMCSA SMS downloads page ai.fmcsa.dot.gov/SMS/Tools/Downloads.aspx returns HTTP 302 to fmcsa.dot.gov/registration/fmcsa-data-dissemination-program, which returns HTTP 403 AkamaiGHost to scripted fetch — not autonomously fetchable
- Live MOTUS successor datasets exist and are current: yu5v-wbh6, c5y8-a4uz, inys-ebih, wb4f-neki all declare Update Frequency R/P1D and have max date 20260819 (today); AuthHist shows 669-820 status changes per day through 2026-08-18
- MOTUS uses YYYYMMDD date strings and renamed columns (usdot_number, op_auth_status, status_change_date, reason) — a silent schema break versus the legacy MM/DD/YYYY files
- MOTUS coverage is ~14% of the legacy active-authority population: sampling legacy carriers with common_stat='A' gave 36/250 (14.4%) in Motus AuthHist, 32/250 (12.8%) in Motus Insur, 36/250 (14.4%) in Motus Carrier; a second independent sample gave 46/200 (23.0%) in Motus Carrier
- Distinct USDOT counts: Motus Carrier 103,781; Motus AuthHist 102,518; Motus Insur 82,118; Motus RevokeSuspend 8,517 — versus 1,679,121 distinct dot_number in legacy 6eyk-hxee and 328,575 with common_stat='A'
- The insurance-lapse signal exists in MOTUS AuthHist as reason='Involuntary Suspension - insurance cancellation effective; no active insurance meeting minimum coverage on file' (2,337 rows total; 1,323 in the 30 days to 2026-08-19); BOC-3 cancellation is a separate reason value (183 rows)
- Motus RevokeSuspend serve-to-effective gap is a fixed 30 days (n=400 sampled: min 30, median 30, max 30), and 1,680 rows currently have order1_effective_date later than 2026-08-19 — a genuine forward-looking, source-cited signal
- VerifyCarrier's Carrier Monitoring tiers ($49/$99/$249 per month), cited by the card as proof money changes hands, are labelled 'Launching Soon' and not purchasable; only its Developer API ($0/$19/$49/$99) is available now
- CarrierOK's live pricing page shows Pro at $149/mo per user (unlimited profile searches, automated risk intel) plus data products at $199-$999/mo — above, not below, the card's $39-149 hypothesis
- Truckstop Carrier Hub sells exactly this monitoring function — 'authority changes, insurance lapses, or a safety score drops', 'Authority revocations, insurance lapses, contact changes, fraud signals' — at $99/mo Basic and $200/mo Advanced, and bundles it with Load Board Premium from $369/mo (kill pattern 3 confirmed live)
- Free first-party substitutes are live: SAFER Company Snapshot (safer.fmcsa.dot.gov, HTTP 200) and the L&I public system li-public.fmcsa.dot.gov/LIVIEW/pkg_menu.prc_menu (HTTP 200, 11,513 bytes)

### Unproven

- Whether an FMCSA QCMobile webKey is granted automatically on self-serve registration or requires human approval — I hold no key and could not complete registration, so the one-time-human-step assumption behind A1/A6 is untested
- QCMobile rate limits (documented or undocumented) at the volume a 100-carrier nightly poll per customer would require — the card flagged this and it remains unverified
- Whether FMCSA intends to backfill the full legacy carrier population into the MOTUS datasets, and on what schedule — fmcsa.dot.gov is Akamai-403 to automated fetch, so I could not read FMCSA's own Registration Modernization / data-dissemination announcement
- Whether the ~86% of legacy active-authority carriers absent from MOTUS are genuinely unmonitored by FMCSA or merely not yet republished to the open-data portal
- Carrier411's own published pricing — carrier411.com returns HTTP 403 to automated fetch; the card's ~$34.95/user/mo figure remains a competitor-sourced secondary estimate
- SaferWatch's own pricing page (saferwatch.com/pricing, HTTP 403) — the card's $79.95/mo figure is still sourced only from a third-party insurance-agency blog post
- Highway's pricing (not published); its distribution via TMS embedding is confirmed but its price point is not
- TIA's $700M-$1B/yr double-brokering fraud estimate and the FMCSA complaint-volume growth from ~2,000 (2021) to 8,000+ (2025) — still secondary trade coverage; FMCSA's own statistics pages are behind the same Akamai 403
- Whether MOTUS Carrier's address/phone fields are populated densely enough to make chameleon collision detection work in practice (I confirmed the columns exist: bus_street_po, bus_city, bus_telno, mail_* — but did not measure null rates or collision precision)
- Whether scraping li-public.fmcsa.dot.gov is permitted by its terms of use — I read the menu page but not a ToS document

### Fatal risks

- All three L&I Socrata datasets named in the card were permanently frozen on 2026-05-14 ('will no longer be updated', verbatim in metadata) and confirmed at row level to contain zero records for June, July and August 2026. The card's knowledge base is 97 days dead. A monitoring product cannot be built on a file that stopped moving.
- The card's stated staleness-detection mechanism cannot detect this. All three frozen datasets report rowsUpdatedAt = today (2026-08-19). The A4 case rests on 'Socrata datasets expose their own last-updated metadata' — that signal is actively misleading here, so the product would have shipped a green dashboard over dead data.
- The UCR signal has no source. fux9-ij6p is an href stub with 0 rows and 0 columns, last touched 2018-12-17, pointing at an HTML query form. UCR is one of the three signals in the headline promise and is not computable from any machine-readable feed I could find.
- The live MOTUS successor covers only ~14% of the legacy active-authority carrier population (36/250, 32/250, 36/250 across three datasets; 103,781 distinct USDOTs vs 1,679,121 legacy). B3's promise is monitoring carriers ALREADY in a broker's approved network — precisely the long-tenured carriers MOTUS does not contain. The product would be blind on ~6 of 7 of them while showing them as fine.
- There is no autonomy-compatible path to the missing 86%. The only current and complete source is the li-public.fmcsa.dot.gov L&I web application (HTML, Oracle PL/SQL) — reaching it means the scraper-fleet path A4 forbids, plus unverified ToS exposure.
- The 'free and keyless QCMobile' fast-MVP path does not exist. Live calls return HTTP 404 'Must provide Webkey'. The card's 2-4 week time-to-first-revenue was explicitly premised on shipping against a keyless endpoint before building the bulk pipeline.
- Kill pattern 3 fires, live and confirmed: Truckstop Carrier Hub sells this exact function (authority revocations, insurance lapses, fraud signals) at $99-$200/mo and bundles it with Load Board Premium from $369/mo — inside software brokers already buy. Highway is being embedded directly into TMS platforms (Transfix, June 2026).
- The price wedge is inverted. The card positions $39-149/mo as undercutting incumbents, but CarrierOK's live floor is $149/mo per user, and the VerifyCarrier $49/$99/$249 monitoring tiers cited as the proof of willingness-to-pay are marked 'Launching Soon' and cannot be purchased — so the card's central pricing evidence is a pre-launch page, not a transacting market.
- Engine-never-arbiter: 'you know before you tender the load' is a completeness guarantee the product cannot sign at 14% coverage — the same failure class as round-1's 'never miss a deadline'. Worse, the 'chameleon screen' asserts identity fraud against a named business from address/phone/officer collisions; deterministic or not, that is a legal-fact assertion with defamation exposure no unattended product can sign.

### References

- https://data.transportation.gov/api/views/qh9u-swkp.json (fetched 2026-08-19) — Socrata metadata for ActPendInsur - All With History. HTTP 200, application/json, 25,600 bytes. Contains verbatim 'last refreshed on 05/14/2026 and will no longer be updated'; rowsUpdatedAt 2026-08-19T13:03:50Z; 11 columns.
- https://data.transportation.gov/api/views/9mw4-x3tu.json (fetched 2026-08-19) — Socrata metadata for AuthHist - All With History. HTTP 200, 23,076 bytes. Same freeze notice; 9 columns; Update Frequency R/P1D.
- https://data.transportation.gov/api/views/6eyk-hxee.json (fetched 2026-08-19) — Socrata metadata for Carrier - All With History. HTTP 200, 58,461 bytes. Same freeze notice; 43 columns.
- https://data.transportation.gov/api/views/fux9-ij6p.json (fetched 2026-08-19) — UCR 'dataset' metadata. HTTP 200, 7,538 bytes. assetType 'href', 0 columns, rowsUpdatedAt 2018-12-17; accessPoints -> safer.fmcsa.dot.gov/UCRQueryForm.aspx.
- https://data.transportation.gov/resource/qh9u-swkp.json?$select=count(1) (fetched 2026-08-19) — Row count 467,983 for legacy insurance file (HTTP 200).
- https://data.transportation.gov/resource/qh9u-swkp.json?$select=count(1)&$where=trans_date%20like%20%2706/%25/2026%27 (fetched 2026-08-19) — Zero insurance transactions in June 2026 (and same query for July/August returns 0; May returns 13,040) — confirms the freeze at row level.
- https://data.transportation.gov/resource/9mw4-x3tu.json?$select=count(1)&$where=disp_served_date%20like%20%2705/%25/2026%27 (fetched 2026-08-19) — 8,902 authority dispositions in May 2026 vs 19,514 in April and 0 in June/July/August.
- https://data.transportation.gov/api/catalog/v1?q=MOTUS&limit=25 (fetched 2026-08-19) — DOT portal catalog search revealing the 12 live MOTUS replacement datasets, all with data_updated_at 2026-08-19.
- https://data.transportation.gov/api/views/yu5v-wbh6.json (fetched 2026-08-19) — Motus AuthHist - All With History metadata. HTTP 200. Update Frequency R/P1D; columns docket_number, usdot_number, op_auth_type, op_auth_status, reason, status_change_date.
- https://data.transportation.gov/api/views/c5y8-a4uz.json (fetched 2026-08-19) — Motus Insur - All With History metadata. HTTP 200. R/P1D; 11 columns including effective_date, insurance_company_name, trans_date.
- https://data.transportation.gov/api/views/inys-ebih.json (fetched 2026-08-19) — Motus Carrier - All With History metadata. HTTP 200. 28 columns including bus_street_po, bus_telno (the chameleon-collision fields).
- https://data.transportation.gov/api/views/wb4f-neki.json (fetched 2026-08-19) — Motus RevokeSuspend - All With History metadata. HTTP 200. Columns order1_serve_date, order1_type_desc, order1_effective_date; 10,388 rows.
- https://data.transportation.gov/resource/yu5v-wbh6.json?$select=reason,count(1)&$group=reason&$order=count_1%20desc (fetched 2026-08-19) — Signal inventory: GRANTED 54,652; REINSTATED 15,169; Revoked 4,603; 'Involuntary Suspension - insurance cancellation effective...' 2,337; BOC-3 cancellation 183.
- https://data.transportation.gov/resource/yu5v-wbh6.json?$select=status_change_date,count(1)&$where=status_change_date%20%3E%20%2720260810%27&$group=status_change_date (fetched 2026-08-19) — Daily MOTUS activity through 2026-08-19 (68 today, 820 on 08-18, 716 on 08-17) — proves the successor feed is genuinely live.
- https://data.transportation.gov/resource/inys-ebih.json?$select=count(distinct%20usdot_number) (fetched 2026-08-19) — Motus Carrier holds 103,781 distinct USDOT numbers vs 1,679,121 in legacy 6eyk-hxee — the coverage gap.
- https://data.transportation.gov/resource/6eyk-hxee.json?$select=common_stat,count(1)&$group=common_stat (fetched 2026-08-19) — Legacy population with active common authority: 328,575 (A), 833,356 (N), 698,673 (I).
- https://data.transportation.gov/resource/wb4f-neki.json?$select=count(1)&$where=order1_effective_date%20%3E%20%2720260819%27 (fetched 2026-08-19) — 1,680 carriers currently have a suspension order served but not yet effective — the one genuinely sellable forward-looking signal; serve-to-effective gap is a fixed 30 days.
- https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 (fetched 2026-08-19) — QCMobile keyless call. HTTP 404, application/hal+json, 287 bytes, body {"content":"Must provide Webkey"} — refutes the card's 'free and keyless' claim.
- https://mobile.fmcsa.dot.gov/qc/services/carriers/76830?webKey=TESTKEY123 (fetched 2026-08-19) — QCMobile with dummy key. HTTP 404, 284 bytes, {"content":"Webkey not found"} — confirms key gating rather than endpoint absence.
- https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi (fetched 2026-08-19) — QCMobile developer docs page. HTTP 200, text/html, 51,391 bytes — docs live, but access is keyed.
- https://ai.fmcsa.dot.gov/SMS/Tools/Downloads.aspx (fetched 2026-08-19) — SMS monthly files. HTTP 302 -> fmcsa.dot.gov/registration/fmcsa-data-dissemination-program#collapse28721, which returns HTTP 403 AkamaiGHost. Not autonomously fetchable.
- https://www.fmcsa.dot.gov/registration/fmcsa-data-dissemination-program (fetched 2026-08-19) — FMCSA's own data-dissemination/MOTUS announcement. HTTP 403 AkamaiGHost (436 bytes) to both curl-with-browser-UA and WebFetch — could not read primary source on the migration.
- https://li-public.fmcsa.dot.gov/LIVIEW/pkg_menu.prc_menu (fetched 2026-08-19) — FMCSA Licensing & Insurance public web system. HTTP 200, text/html WINDOWS-1252, 11,513 bytes — the current complete insurance record, but HTML-only (scrape-required).
- https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=76830 (fetched 2026-08-19) — SAFER Company Snapshot, the free first-party substitute. HTTP 200, 3,985 bytes (returned 'Record Not Found' for this test DOT, but the free service is live).
- https://verifycarrier.com/pricing (fetched 2026-08-19) — Carrier Monitoring tiers Broker $49 / Broker Pro $99 / Platform $249 per month all marked 'Launching Soon' and not purchasable; Developer API $0/$19/$49/$99 available now.
- https://www.carrier-ok.com/pricing (fetched 2026-08-19) — HTTP 200, 1,616,971 bytes. Pro tier $149/mo per user with automated risk intel; data products $199/$299/$399/$999 per month.
- https://truckstop.com/product/carrier-hub/ (fetched 2026-08-19) — Carrier Hub monitors authority changes, insurance lapses, safety score drops, fraud signals. Basic from $99/mo, Advanced from $200/mo, bundled with Load Board Premium from $369/mo — the bundled-incumbent kill pattern.
- https://www.carrier411.com/ (fetched 2026-08-19) — HTTP 403 to automated fetch (5,774 bytes) — could not verify Carrier411's own pricing.
- https://saferwatch.com/pricing (fetched 2026-08-19) — HTTP 403 to automated fetch (5,532 bytes) — could not verify SaferWatch's own $79.95/mo figure.
- https://highway.com/press-releases/transfix-and-highway-partner-to-give-freight-brokers-built-in-carrier-vetting-and-fraud-protection-inside-the-transfix-tms (fetched 2026-08-19) — Surfaced via WebSearch: Highway carrier vetting embedded directly into Transfix TMS (June 2026) — evidence the function is being absorbed into TMS software brokers already pay for.

---

## 03 Competition & pricing — verdict: REFUTED

## B3 — CarrierWatch: deep validation (lens: pricing floor + bundling channels)

### 1. The name is already taken by a company 200× your size

DAT's carrier-monitoring product is **literally called CarrierWatch**, live today at `https://www.dat.com/carrierwatch`, "Starting at $149/mo," with daily checks and "automatic email alerts when there are changes to a carrier's authority, DOT profile, safety rating, inspections, crash data, insurance renewals and cancellations." That is the card's promise, verbatim, under the card's name, from the largest load board in North America. This is not a trademark risk to be managed — it is the same product, same name, same buyer. (The card's brief guessed Descartes; Descartes' collision is different and also real — it now owns both **SaferWatch** and **MyCarrierPortal**.)

### 2. The price anchor the card is built on is vaporware

The card's central evidence is VerifyCarrier's "$49/$99/$249 Carrier Monitoring" tiers. Fetched today, that section of `verifycarrier.com/pricing` is headed **"Carrier Monitoring (Launching Soon)"** and every tier is marked **"(planned)"** — CSV watchlist upload "(planned)", fraud flags "(planned)", webhooks "(planned)". Only the Developer API is live ($0/100 calls, $19/500, $49/2,500, $99/10,000). So the card's proof that "the long tail exists" is an unshipped landing page. Worse: search results describe VerifyCarrier as "building daily carrier monitoring for small freight brokers — built on FMCSA data, priced for teams without enterprise budgets," on a waitlist with founding-member pricing. That is the card's pitch, its segment and its price band, already claimed by a live competitor.

### 3. The real clearing price — and why the wedge inverts

First-party prices fetched today:

| Product | Price | Carriers monitored |
|---|---|---|
| **Truckstop Carrier Hub Basic** | **$99/mo** | **"Unlimited carriers monitored (DOT and COI data access)"** |
| Truckstop Carrier Hub Advanced | $200/mo | 500 included, insurance policy tracking |
| Truckstop bundle (Advanced + Load Board Premium) | $369/mo | — |
| Truckstop RMIS Lite | $340/mo | onboarding + daily compliance |
| DAT CarrierWatch | $149/mo | TMS-integrated |
| CarrierOK Pro / Team / Enterprise | $149/user · $349 (5 users, 1,000 profiles) · $499 (10 users, 10,000 profiles) | month-to-month |
| Descartes MyCarrierPortal Standard | $515/mo | unlimited users |
| SaferWatch (Descartes shop MSRP) | $250.00 USD | undetailed |

The card proposes **$39–$149/mo for 25/100/unlimited**. Its *top* tier is 50% more expensive than Truckstop Basic, which already gives **unlimited** monitored carriers. There is no price gap at the top of the card's range; at the bottom, $39/mo saves a broker $60/mo against a product they can buy from the load board they are already logged into. Carrier Atlas's independent survey puts the market at "~$2–$10/carrier/month for monitoring, $50–$500/seat/month for the platform" — the card's $1.56/carrier at $39/25 is already below the market floor, and the top tier is not.

### 4. Bundling (round-1 kill pattern #3) is confirmed, not hypothetical

The small brokerage the card targets **must** have a load board. Truckstop sells Carrier Hub Advanced bundled with Load Board Premium "From $369/mo"; DAT ships CarrierWatch inside DAT One Select/Office plans and "integrates with your TMS." On the TMS side, PCS Software states it "keeps FMCSA data, carrier vetting, continuous monitoring, and document management inside the same workflow"; Vektor TMS Carrier Cloud sells "FMCSA auto-lookup, real-time insurance monitoring… automatic expiry alerts (30/15/7-day notices)" as a core feature; Alvys routes to RMIS/MyCarrierPortal/SaferWatch. A standalone $39 monitor is not a cheaper substitute for a $99 bundled one — it is an *additional* line item next to a subscription the buyer cannot cancel.

### 5. The chameleon screen is both already shipped and legally unsignable

Truckstop Carrier Hub already alerts on "complaints (including stolen loads, fraud, double-brokering), **identity changes, shared addresses or VINs**, and equipment data." That is the card's differentiating "shared-identity signals (address/phone/officer collisions with revoked carriers)" — shipped, at $99.

Independently, this half strains **engine-never-arbiter** badly. "Looks like a chameleon re-registration" is an adverse factual assertion about a named third party that a broker will act on by refusing to tender. The category has a live defamation history: the Carrier411 FreightGuard ecosystem produced a reported **$612,400** judgment (Penguin Trucking v. E.L. Hollingsworth) and an OOIDA campaign against "blackballing motor carriers on hearsay." Even a purely deterministic rule ("this DOT shares an address with a revoked MC") is an unattended product publishing a defamation-shaped conclusion. The sellable form states the mechanism and shows the source record — "DOT 123456 and revoked DOT 654321 share street address X per the FMCSA carrier file of 2026-08-19" — never "chameleon." Likewise "you know before you tender the load" is an outcome claim; the product knows what the federal file said at last refresh.

### 6. Two data legs of the headline promise do not exist

- **UCR is dead data.** `data.transportation.gov/api/views/fux9-ij6p.json` returns HTTP 200 but `rowsUpdatedAt = 1545090822` (**2018-12-17**) and **zero columns**; the row endpoint returns **HTTP 403 — "no row or column access to non-tabular tables."** It is a link stub, not a dataset. UCR status is only checkable through plan.ucr.gov's interactive lookup. The promise "lapses on… UCR" has no machine-readable source.
- **QCMobile is not keyless.** `https://mobile.fmcsa.dot.gov/qc/services/carriers/76830` returns HTTP 404 with `{"content":"Must provide Webkey"}`. The card's "free ad-hoc JSON snapshot, keyless" is refuted (the key is free to register, but rate limits remain unverified).
- **BOC-3** — no public machine-readable source found.

### 7. What *is* solid

The three L&I Socrata datasets are excellent and were refreshed **today**: ActPendInsur `qh9u-swkp` (rowsUpdatedAt 2026-08-19T13:03:50Z, columns include `effective_date`, `cancl_effective_date`, `max_cov_amount`), AuthHist `9mw4-x3tu` (13:38:02Z), Carrier `6eyk-hxee` (14:30:04Z, includes `broker_stat`, `common_rev_pend`, `bipd_file`, `cargo_file`). A4 is genuinely clean. And **49 CFR 387.313(d)** gives real lead time: bonds and certificates "shall not be cancelled or withdrawn until 30 days after written notice has been submitted." But that 30-day window is available to every incumbent identically — it is the industry's shared clock, not a freshness edge.

### 8. Platform risk

FMCSA is mid-migration to **MOTUS** under the URS overhaul, rolling out in phases through 2026 and beyond with new identity verification and business validation. The registration data model this product sits on is being replaced during the build window. (FMCSA.dot.gov hard-blocks automated fetch — HTTP 403 to both curl and WebFetch — so this is from secondary trade coverage and is flagged unproven.)

### Verdict: REFUTED

Every reshape I can name collapses. Rename + drop UCR + drop the chameleon screen leaves an insurance-and-authority diff alert at $39–$99 against Truckstop Basic's $99 unlimited, bundled with a load board the buyer must have. Move upmarket and you meet CarrierOK/MyCarrierPortal at $349–$515. Move to freight factors (the one buyer with no load board) and you meet Decipher Credit's Freight Shield in a small, concentrated, non-self-serve market — and you abandon the card's buyer, price and promise. Sell the normalized FMCSA change-event feed as an API and you become a supplier to the incumbents, which is a different company. The data layer is the best-verified asset in this candidate; the business around it is occupied at every price point.

### References

1. https://verifycarrier.com/pricing — 2026-08-19, HTTP 200, text/html, 86,560 B. Live API tiers $0/$19/$49/$99; **"Carrier Monitoring (Launching Soon)"** with $49/$99/$249 marked "(planned)".
2. https://www.dat.com/carrierwatch — 2026-08-19. DAT product literally named **CarrierWatch**, "Starting at $149/mo", daily authority/insurance/safety alerts, TMS integration.
3. https://truckstop.com/product/carrier-hub/ — 2026-08-19. Basic "Starting at $99/mo" with "Unlimited carriers monitored"; Advanced "$200/mo"; bundle "From $369/mo".
4. https://truckstop.com/product/carrier-monitoring/ — 2026-08-19. Confirms alerts on "identity changes, shared addresses or VINs", double-brokering complaints — the chameleon signal, already shipped.
5. https://www.carrier-ok.com/pricing — 2026-08-19, HTTP 200, 1,616,971 B. Pro $149/user/mo; Team $349/mo (5 users, 1,000 profiles); Enterprise $499/mo (10 users, 10,000 profiles); data feeds $199–$999/mo.
6. https://www.mycarrierportal.com/features/pricing/ — 2026-08-19. Descartes MyCarrierPortal Standard **$515/month**, includes "Insurance validation & monitoring", "FMCSA & DOT monitoring"; no free tier.
7. https://ppecommshop.descartes.com/Carrier-Insurance-Monitoring-SAFER/ — 2026-08-19. SaferWatch sold through Descartes shop, MSRP **$250.00 USD**; confirms SaferWatch is a Descartes property.
8. https://carrieratlas.com/carrier-packets.php — 2026-08-19. Independent survey: "~$2–$10/carrier/month for monitoring, $50–$500/seat/month for the platform"; "Carriers themselves typically pay nothing — costs sit with the broker."
9. https://vektortms.com/brokers/carrier-cloud — 2026-08-19. TMS bundles "FMCSA auto-lookup, real-time insurance monitoring… automatic expiry alerts (30/15/7-day notices)" as a core feature; price quote-gated.
10. https://pcssoft.com/products/tms/carrier/broker-compliance/ — 2026-08-19. "PCS keeps FMCSA data, carrier vetting, continuous monitoring… inside the same workflow"; no published price.
11. https://highway.com/ — 2026-08-19, HTTP 200, 116,915 B. Carrier Identity platform, **no public pricing**, CTA "Get a Demo"; "Trusted by thousands of Freight Brokers and 3PLs".
12. https://data.transportation.gov/api/views/qh9u-swkp.json — 2026-08-19, HTTP 200, application/json, 25,600 B. ActPendInsur; rowsUpdatedAt 2026-08-19T13:03:50Z; columns incl. `effective_date`, `cancl_effective_date`.
13. https://data.transportation.gov/api/views/9mw4-x3tu.json — 2026-08-19, HTTP 200, 23,076 B. AuthHist; rowsUpdatedAt 2026-08-19T13:38:02Z.
14. https://data.transportation.gov/api/views/6eyk-hxee.json — 2026-08-19, HTTP 200, 58,461 B. Carrier file; rowsUpdatedAt 2026-08-19T14:30:04Z; incl. `broker_stat`, `common_rev_pend`, `bipd_file`.
15. https://data.transportation.gov/api/views/fux9-ij6p.json — 2026-08-19, HTTP 200, 7,538 B. UCR; **rowsUpdatedAt 2018-12-17T23:53:42Z, zero columns**.
16. https://data.transportation.gov/resource/fux9-ij6p.json?$limit=2 — 2026-08-19, **HTTP 403**, `"no row or column access to non-tabular tables"`. UCR is not queryable data.
17. https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 — 2026-08-19, **HTTP 404**, application/hal+json, 287 B, `{"content":"Must provide Webkey"}`. Refutes the keyless claim.
18. https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi — 2026-08-19, HTTP 200, text/html, 51,391 B. QCMobile docs reachable.
19. https://www.law.cornell.edu/cfr/text/49/387.313 — 2026-08-19. 49 CFR 387.313(d): securities "shall not be cancelled or withdrawn until 30 days after written notice has been submitted."
20. https://www.saferwatch.com/pricing — 2026-08-19, **HTTP 403** (Cloudflare) to curl with browser UA and to WebFetch; first-party price unobtainable. Same for https://www.carrier411.com/ (HTTP 403) and https://usdotwatch.com/ (HTTP 500).
21. https://www.fmcsa.dot.gov/motus — 2026-08-19, **HTTP 403** to curl and WebFetch; MOTUS/URS 2026 rollout known only from secondary trade coverage (cnsprotects.com, trucksafe.com) — flagged unproven.
22. WebSearch 2026-08-19 "Carrier411 FreightGuard defamation lawsuit" — surfaced Overdrive coverage ("blackballing motor carriers on hearsay": OOIDA) and the reported $612,400 Penguin Trucking award; both primary sources HTTP 403 — flagged unproven.
23. https://mycarrierpackets.com/pricing/ — 2026-08-19, **HTTP 404**; no standalone pricing page (redirects into the Descartes MyCarrierPortal funnel).


### Proven (primary source, fetched 2026-08-19)

- DAT sells a product LITERALLY NAMED 'CarrierWatch' at https://www.dat.com/carrierwatch, 'Starting at $149/mo', with daily automatic email alerts on 'authority, DOT profile, safety rating, inspections, crash data, insurance renewals and cancellations' — identical name, identical promise, identical buyer (fetched 2026-08-19).
- Truckstop Carrier Hub Basic is $99/mo and includes 'Unlimited carriers monitored (DOT and COI data access)'; Advanced $200/mo adds 'Insurance monitoring (active policy tracking)' and 500 monitored carriers; bundled with Load Board Premium 'From $369/mo' (truckstop.com/product/carrier-hub/, 2026-08-19).
- Truckstop Carrier Hub already monitors the exact 'chameleon' signals the card claims as its differentiator: 'complaints (including stolen loads, fraud, double-brokering), identity changes, shared addresses or VINs, and equipment data' (truckstop.com/product/carrier-monitoring/, 2026-08-19).
- VerifyCarrier's $49/$99/$249 monitoring tiers — the card's single central price anchor — are published under the heading 'Carrier Monitoring (Launching Soon)' with every feature marked '(planned)'. Only the Developer API ($0/$19/$49/$99) is live (verifycarrier.com/pricing, 2026-08-19).
- Real clearing prices, all first-party fetched 2026-08-19: CarrierOK Pro $149/user/mo, Team $349/mo (5 users, 1,000 profiles), Enterprise $499/mo (10 users, 10,000 profiles); Descartes MyCarrierPortal Standard $515/mo; SaferWatch via Descartes shop MSRP $250.00; Truckstop RMIS Lite ~$340/mo.
- Independent market survey: monitoring runs '~$2-$10/carrier/month … $50-$500/seat/month for the platform' and 'Carriers themselves typically pay nothing — costs sit with the broker' (carrieratlas.com/carrier-packets.php, 2026-08-19) — refuting the 'RMIS is free to brokers because carriers pay' hypothesis.
- Bundling is confirmed on both the load-board and TMS sides: DAT ships CarrierWatch inside DAT One Select/Office plans and 'integrates with your TMS'; Vektor TMS Carrier Cloud sells 'FMCSA auto-lookup, real-time insurance monitoring… automatic expiry alerts (30/15/7-day notices)' as a core TMS feature; PCS Software 'keeps FMCSA data, carrier vetting, continuous monitoring… inside the same workflow'.
- The FMCSA L&I data layer is genuinely excellent and A4-clean: qh9u-swkp (ActPendInsur) rowsUpdatedAt 2026-08-19T13:03:50Z with columns effective_date/cancl_effective_date/max_cov_amount; 9mw4-x3tu (AuthHist) 13:38:02Z; 6eyk-hxee (Carrier) 14:30:04Z with broker_stat/common_rev_pend/bipd_file — all HTTP 200 JSON, refreshed the same day I fetched them.
- 49 CFR 387.313(d) verified via Cornell LII: certificates of insurance and surety bonds 'shall not be cancelled or withdrawn until 30 days after written notice has been submitted' to FMCSA — a real 30-day lead time, but one available identically to every incumbent.
- Descartes has consolidated the category: it owns both SaferWatch (sold on its own ecommerce shop) and MyCarrierPortal/MyCarrierPackets — the 'independent incumbents' in the card are largely one acquirer.

### Unproven

- SaferWatch's own published price. saferwatch.com returns HTTP 403 (Cloudflare) to curl with a browser UA and to WebFetch. The widely repeated $79.95/mo figure remains a secondary/broker-blog number; the only first-party Descartes figure I obtained is a $250.00 MSRP shop listing with no feature detail.
- Carrier411's published pricing. carrier411.com returns HTTP 403 to every method tried. The ~$34.95/user/mo in the card is a competitor's marketing page, not Carrier411's own number.
- USDOTwatch's paid monitoring tiers — the site returned HTTP 500 (curl) and HTTP 403 (WebFetch). Search snippets say lookups are free/unlimited with paid monitoring available, but no dollar figure was obtainable.
- Highway's pricing — quote-gated, CTA is 'Get a Demo', no public figure (confirmed live, not a fetch failure).
- Whether Vektor TMS / PCS Software include monitoring at no extra cost or price it as an add-on — both describe it as a core in-workflow feature but publish no pricing.
- The $612,400 Penguin Trucking v. E.L. Hollingsworth defamation award and the OOIDA 'blackballing on hearsay' coverage — Overdrive and the law-firm writeups all returned HTTP 403. Directionally corroborated across multiple independent search results but NOT primary-fetched.
- FMCSA MOTUS/URS 2026 rollout details — fmcsa.dot.gov returns HTTP 403 to curl and WebFetch, so the registration-system migration risk rests on secondary trade coverage only.
- TIA's $700M-$1B fraud-loss estimate and the FMCSA complaint-volume growth (2,000 in 2021 to 8,000+ in 2025) carried over from the card — still not verified against any FMCSA or TIA primary document.
- Whether a public machine-readable BOC-3 (process agent) source exists at all. None found; the card's BOC-3 lapse promise has no identified data source.
- QCMobile's rate limits for a free registered Webkey at watchlist scale.

### Fatal risks

- NAME COLLISION, FATAL: DAT — the largest freight load board in North America — sells a product literally named CarrierWatch at $149/mo doing precisely what the card describes (https://www.dat.com/carrierwatch, fetched 2026-08-19). This is not a rename-and-proceed problem: it means the card's entire concept ships today under the card's own name from an incumbent the target buyer already subscribes to.
- PRICE-FLOOR INVERSION (kill pattern #2), FATAL: the card's TOP tier ($149/mo, unlimited carriers) is 50% MORE expensive than Truckstop Carrier Hub Basic at $99/mo, which already includes 'Unlimited carriers monitored'. There is no gap at the top of the card's range, and at the bottom a $39/mo product saves $60/mo against something bought from a vendor the buyer is already logged into. The hypothesized wedge does not exist at any point on the price curve.
- BUNDLING (kill pattern #3), FATAL: the small brokerage MUST have a load board. Truckstop bundles Carrier Hub Advanced with Load Board Premium at $369/mo; DAT ships CarrierWatch inside DAT One Select/Office plans. A standalone $39 monitor is not a cheaper substitute — it is an additive line item alongside a subscription the buyer cannot cancel. This is the exact pattern that killed all three round-1 vote leaders.
- DIFFERENTIATOR ALREADY SHIPPED: the 'chameleon screen' — the card's one non-commodity feature — is live inside the $99 Truckstop tier, which explicitly alerts on 'identity changes, shared addresses or VINs' and double-brokering complaints. The card has no feature the $99 incumbent lacks.
- ENGINE-NEVER-ARBITER VIOLATION on the chameleon half: 'looks like a chameleon re-registration' is an adverse factual assertion about a named third party that the customer acts on by refusing to tender — an unattended product cannot sign it, even from deterministic rules. The category has a live defamation history (Carrier411/FreightGuard; a reported $612,400 award, flagged unproven) and an OOIDA campaign against 'blackballing on hearsay'. The headline promise 'you know before you tender the load' is likewise an outcome claim the product cannot make; the sellable form is 'DOT X and revoked DOT Y share address Z per the FMCSA carrier file of <date>', never the word 'chameleon'.
- THE UCR LEG OF THE HEADLINE PROMISE HAS NO DATA: data.transportation.gov dataset fux9-ij6p has rowsUpdatedAt of 2018-12-17, zero columns, and its row endpoint returns HTTP 403 'no row or column access to non-tabular tables'. It is a link stub. UCR status is only obtainable via plan.ucr.gov's interactive lookup. 'Lapses on … UCR' cannot be built as specified.
- A CARD FACT IS SIMPLY WRONG: QCMobile is NOT keyless. https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 returns HTTP 404 with {"content":"Must provide Webkey"}. Survivable (the key is free) but it invalidates the '2-4 weeks to revenue on a keyless endpoint' build estimate and its rate limits are unknown.
- DIRECT COMPETITOR ALREADY BUILDING THE IDENTICAL PRODUCT FOR THE IDENTICAL SEGMENT: VerifyCarrier is described in live search results as 'building daily carrier monitoring for small freight brokers — built on FMCSA data, priced for teams without enterprise budgets', on a waitlist with founding-member pricing. That is the card's thesis, buyer and price band, with the API half already shipped and a customer list already forming.
- NO FRESHNESS EDGE IS AVAILABLE: 49 CFR 387.313(d)'s 30-day cancellation notice means every competitor sees an insurance lapse at exactly the same moment from exactly the same federal filing. The product cannot be faster, only cheaper — and it isn't cheaper (see price inversion).
- PLATFORM MIGRATION RISK: FMCSA is mid-rollout of MOTUS under the URS overhaul through 2026 and beyond, with new identity verification and business validation — the registration data model the product sits on is being replaced during the build window. (Secondary sources only; fmcsa.dot.gov HTTP 403.)

### References

- https://verifycarrier.com/pricing (fetched 2026-08-19) — HTTP 200, text/html, 86,560 B. Live API tiers $0/100 calls, $19/500, $49/2,500, $99/10,000. Carrier Monitoring section headed 'Launching Soon' with $49/$99/$249 tiers all marked '(planned)' — refutes the card's central price anchor.
- https://www.dat.com/carrierwatch (fetched 2026-08-19) — DAT's product is LITERALLY named CarrierWatch. 'Starting at $149/mo'. Daily checks, automatic email alerts on authority, DOT profile, safety rating, inspections, crash data, insurance renewals and cancellations. Integrates with TMS.
- https://truckstop.com/product/carrier-hub/ (fetched 2026-08-19) — Carrier Hub Basic 'Starting at $99/mo' with 'Unlimited carriers monitored (DOT and COI data access)'; Advanced '$200/mo' with insurance policy tracking + 500 monitored carriers; bundle with Load Board Premium 'From $369/mo'.
- https://truckstop.com/product/carrier-monitoring/ (fetched 2026-08-19) — Confirms the incumbent already monitors 'complaints (including stolen loads, fraud, double-brokering), identity changes, shared addresses or VINs, and equipment data' — the card's chameleon differentiator, already shipped at $99.
- https://www.carrier-ok.com/pricing (fetched 2026-08-19) — HTTP 200, 1,616,971 B. Pro $149/user/mo; Team $349/mo (5 users, monitoring up to 1,000 profiles); Enterprise $499/mo (10 users, 10,000 profiles); data feeds $199-$999/mo. Month-to-month, no contract.
- https://www.mycarrierportal.com/features/pricing/ (fetched 2026-08-19) — Descartes MyCarrierPortal Standard $515/month including 'Insurance validation & monitoring' and 'FMCSA & DOT monitoring'; Enterprise 'Contact us'; no free tier.
- https://ppecommshop.descartes.com/Carrier-Insurance-Monitoring-SAFER/ (fetched 2026-08-19) — SaferWatch sold through Descartes' own ecommerce shop, MSRP $250.00 USD. Confirms SaferWatch is now a Descartes property (as is MyCarrierPortal) — category consolidation under one acquirer.
- https://carrieratlas.com/carrier-packets.php (fetched 2026-08-19) — Independent comparison: 'Most price per-broker-seat plus per-monitored-carrier (~$2-$10/carrier/month for monitoring, $50-$500/seat/month for the platform)'; 'Carriers themselves typically pay nothing — costs sit with the broker.'
- https://vektortms.com/brokers/carrier-cloud (fetched 2026-08-19) — TMS bundles monitoring as a core feature: 'FMCSA auto-lookup, real-time insurance monitoring, and performance scorecards for every carrier in your network', with 30/15/7-day expiry alerts. Pricing quote-gated.
- https://pcssoft.com/products/tms/carrier/broker-compliance/ (fetched 2026-08-19) — 'PCS keeps FMCSA data, carrier vetting, continuous monitoring, and document management inside the same workflow.' No published pricing — bundling confirmed, price not.
- https://highway.com/ (fetched 2026-08-19) — HTTP 200, 116,915 B. Carrier Identity platform for brokers; no public pricing, CTA is 'Get a Demo'; 'Trusted by thousands of Freight Brokers and 3PLs'. Confirms quote-gated enterprise motion.
- https://data.transportation.gov/api/views/qh9u-swkp.json (fetched 2026-08-19) — HTTP 200, application/json, 25,600 B. 'ActPendInsur - All With History', rowsUpdatedAt 1787144630 = 2026-08-19T13:03:50Z. Columns: docket_number, dot_number, ins_form_code, name_company, policy_no, effective_date, cancl_effective_date, max_cov_amount.
- https://data.transportation.gov/api/views/9mw4-x3tu.json (fetched 2026-08-19) — HTTP 200, 23,076 B. 'AuthHist - All With History', rowsUpdatedAt = 2026-08-19T13:38:02Z. Columns include original_action_desc, disp_action_desc, disp_decided_date, disp_served_date.
- https://data.transportation.gov/api/views/6eyk-hxee.json (fetched 2026-08-19) — HTTP 200, 58,461 B. 'Carrier - All With History', rowsUpdatedAt = 2026-08-19T14:30:04Z. Columns include broker_stat, common_rev_pend, bipd_file, cargo_file, undeliverable_mail.
- https://data.transportation.gov/api/views/fux9-ij6p.json (fetched 2026-08-19) — HTTP 200, 7,538 B. 'Unified Carrier Registration (UCR)' — rowsUpdatedAt 1545090822 = 2018-12-17T23:53:42Z, and the columns array is EMPTY. Dead stub.
- https://data.transportation.gov/resource/fux9-ij6p.json?$limit=2 (fetched 2026-08-19) — HTTP 403, 84 B: {'error': true, 'message': 'no row or column access to non-tabular tables'}. Proves the UCR dataset carries no queryable data — refutes the UCR leg of the headline promise.
- https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 (fetched 2026-08-19) — HTTP 404, application/hal+json, 287 B: {'content':'Must provide Webkey','retrievalDate':'2026-08-19T23:11:46.101+0000'}. Refutes the card's 'free ad-hoc, keyless' QCMobile claim.
- https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi (fetched 2026-08-19) — HTTP 200, text/html, 51,391 B. QCMobile developer docs reachable — the API exists but is key-gated.
- https://www.law.cornell.edu/cfr/text/49/387.313 (fetched 2026-08-19) — 49 CFR 387.313(d) primary text: surety bonds and certificates of insurance 'shall not be cancelled or withdrawn until 30 days after written notice has been submitted' to FMCSA. Establishes the 30-day lead time — shared identically by all competitors.
- https://www.saferwatch.com/pricing (fetched 2026-08-19) — HTTP 403 (Cloudflare), 5,387-5,622 B, to curl with browser UA and to WebFetch. First-party SaferWatch pricing NOT obtainable; the $79.95/mo figure remains secondary.
- https://www.carrier411.com/ (fetched 2026-08-19) — HTTP 403 (Cloudflare), 5,774 B, to every method. Carrier411 first-party pricing NOT obtainable.
- https://usdotwatch.com/ (fetched 2026-08-19) — HTTP 500 via curl with browser UA; HTTP 403 via WebFetch; /pricing returns HTTP 404. Free-lookup-plus-paid-monitoring model indicated by search snippets only; no price obtained.
- https://mycarrierpackets.com/pricing/ (fetched 2026-08-19) — HTTP 404, 8,162 B. No standalone MyCarrierPackets pricing page; the brand now funnels into Descartes MyCarrierPortal.
- https://www.fmcsa.dot.gov/motus (fetched 2026-08-19) — HTTP 403 to curl (browser UA) and to WebFetch. FMCSA.dot.gov blocks automated fetch — MOTUS/URS 2026 migration risk could not be primary-verified. Note: data.transportation.gov, the actual data source, is unblocked.
- https://www.fmcsa.dot.gov/registration/fraud-alerts (fetched 2026-08-19) — HTTP 403 via WebFetch. Could not verify whether FMCSA offers any free first-party subscription/alert service (kill pattern #1) — no evidence found of one in any search, but not primary-confirmed.

---

## 04 Kill-thesis — verdict: REFUTED

## B3 — CarrierWatch: deep validation (all URLs fetched 2026-08-19)

**Verdict: REFUTED.** Not on one attack — on five independent ones, each sufficient alone.

### 1. The name is an incumbent's product, and that incumbent bundles it into the load board
DAT sells a product **literally called CarrierWatch**. Its page (dat.com/carrierwatch, fetched today) reads: "Starting at $149/mo… CarrierWatch checks for changes in your carriers' status **daily**… Receive automatic email alerts when there are changes to a carrier's authority, DOT profile, safety rating, inspections, crash data, **insurance renewals and cancellations**." That is B3's entire promise, verbatim, from a vendor with a 500,000-company database. Worse: DAT's broker pricing page lists "DAT CarrierWatch — Create a personalized watchlist with real-time notifications on DOT authority changes" and "CarrierWatch Insurance Certificates" as **line items inside broker load-board plans starting at $159/mo**. Kill pattern #3, confirmed by fetch.

**Truckstop Carrier Hub** is worse still. Fetched today: **Basic $99/mo** includes "DOT data monitoring (active change tracking)" and "**Unlimited carriers monitored**"; **Advanced $200/mo** adds insurance monitoring, self-serve business rules, 500 monitored carriers; bundle with Load Board Premium "From $369/mo." Its FAQ says outright: "I already use SaferWatch. Should I switch? Carrier Hub Advanced is built to do what SaferWatch does… built into your Truckstop workflow." B3's pricing hypothesis was $39–$149/mo for 25/100/**unlimited**. The unlimited tier is already $99/mo inside software the buyer has a login and an invoice with. There is no crack between the load boards — both load boards filled it.

### 2. The chameleon screen is shipped by a self-serve competitor, and given away free by another
CarrierOK's pages (fetched today) advertise, in the API product description: "**Chameleon carrier detection, identity fraud signals, and anomalous registration patterns**," plus "reverse lookups by EIN, address, phone, email, or VIN" — the exact shared-identity collision logic B3 claims as its onboarding wedge. Pricing is self-serve and public: Pro $149/mo/user (free trial), **Team $349/mo, monitoring up to 1,000 profiles**, Enterprise $499/mo, 10,000 profiles; API with a free sandbox and $50 pay-as-you-go activation; "updated multiple times a day." Carrier Assure publishes a **free Individual tier** and $149/mo Premium with "DOT authority & monitoring."

And the free first-party-substitute pattern lands too: **usdotwatch.com** (fetched today) is a free lookup site with a dedicated "**Chameleon carriers**" nav section and a "Related carriers — common ownership, shared addresses, and chameleon activity" feature, over "4,487,796 total registrations… updated daily. Last synced Aug 19, 2026," alongside FMCSA's free SAFER Company Snapshot (HTTP 200 today).

### 3. The card's own willingness-to-pay evidence evaporates on fetch
The shortlist rests on VerifyCarrier's $49/$99/$249 monitoring tiers as proof money changes hands. Fetched today, that pricing page labels every monitoring plan "**Launching Soon**" and "not purchasable," and VerifyCarrier's own comparison page lists its Carrier Monitoring as "**Coming soon — join waitlist**." That is not revenue evidence; it is a pre-revenue competitor already sitting in B3's exact niche ("self-serve alternative for small brokers"), with a **free 100-lookups/month-forever** tier and $19/$49/$99 API tiers that price-anchor below B3. Meanwhile CarrierOwl — a genuine micro-SaaS in this space — has **abandoned** watchlist monitoring entirely and now sells $29 human-reviewed one-off reports. That is a market signal, not a gap.

### 4. Engine-never-arbiter: the differentiated half is the defamation half
"Looks like a chameleon re-registration" is a published assertion of fraud about a named, identifiable business, from an unattended product. Determinism does not help: a boolean that resolves to "this carrier is a chameleon" is still a factual accusation with liability attached — the round-1 pattern exactly. The category already has body count: FreightCaviar's reporting on FreightGuard describes Greenline Express v. High Plains Logistics, a **$458,000 defamation and tortious-interference award**, and notes Carrier411 restructured FreightGuard's report lifecycle in response, with counsel quoted that permanence means "there's no way to mitigate damages. Even insurance exclusions are now a risk." The sellable, signable form is only "here is the government record and the timestamp we read it" — which is precisely the free USDOTwatch/SAFER page. Descartes MyCarrierPortal has already productized the defensible half as **AuditLog** ("Turn Carrier Review Management into Defensible Documentation," live in their nav today).

### 5. Latency and data premises are partly false
- **UCR is dead.** `fux9-ij6p` last had rows updated **2018-12-17T23:53:42Z**; it is a non-tabular external stub pointing at *Indiana's* UCR payment system (`$select=count(*)` → HTTP 403, "no row or column access to non-tabular tables"). The catalog holds only three such 2018 stubs. The "UCR-current flag" cannot be built from federal open data at all.
- **QCMobile is not keyless.** `GET /qc/services/carriers/76830` → **HTTP 404, `{"content":"Must provide Webkey"}`**. The card's "free and keyless" claim — the basis of the 2–4 week MVP — is false.
- **Latency edge doesn't exist, and doesn't need to.** 49 CFR 387.313(d) (eCFR, today): certificates of insurance "shall not be cancelled or withdrawn until **30 days after written notice**" on Form BMC-35. Insurance lapse is a 30-day-telegraphed filing, not an hours-scale race. So a nightly cron is technically sufficient — but so is DAT's daily check, CarrierOK's multiple-times-daily, and Truckstop's live monitoring. Nothing to win.
- **Silent staleness trap.** Two datasets share the name "ActPendInsur - All With History": `qh9u-swkp` (rows updated **2026-08-19T13:03:50Z**) and `y77m-3nfx` (rows updated **2023-12-06T18:45:17Z**). Pick wrong and the product ships 32-month-stale "all clear" — a fail-open failure directly against A3.
- The good news is irrelevant: the live L&I files are genuinely daily (`9mw4-x3tu` 13:38:02Z, 4,941,925 rows; `6eyk-hxee` 14:30:04Z, 1,860,604 rows; BOC3 `2emp-mxtb` 13:08:57Z, 1,860,604 rows). Feasibility was never the binding constraint.

### 6. Regulatory floor is moving under the pipeline
91 FR 23144 (2026-04-29, Federal Register API): Motus Phase I released **December 8, 2025**; Phase II "planned for the second quarter of 2026"; FMCSA "will **sunset**… registration components of MCMIS and the former Interstate Commerce Commission **Licensing and Insurance system**" — i.e. the exact source. Twelve parallel `Motus *` datasets already publish daily (Motus BOC3 has only 113,395 rows vs 1.86M legacy — migration is mid-flight). Motus puts "individual identity and business verification at the forefront," attacking chameleon registration upstream, for free.

### 7. Crowding, sized
Highway (FTV Capital growth equity announced 2025-08-20, amount undisclosed) serves "more than 1,050 brokers — including 70 of the top 100." Plus DAT, Truckstop RMIS ($340 entry) and Carrier Hub, Descartes MyCarrierPortal, Carrier411, CarrierOK, Carrier Assure, SaferWatch, VerifyCarrier, USDOTwatch, BrokerSnapshot. The card said "the long tail exists." The long tail is served free-to-$99 by four of them.

**No reshape survives.** The defensible version (show the record, don't judge) is the free product. The differentiated version (call the fraud) is the lawsuit. The middle is $99/mo unlimited inside the load board.


### Proven (primary source, fetched 2026-08-19)

- DAT sells a product named 'CarrierWatch' — direct name collision with the candidate — at 'Starting at $149/mo', checking carrier status daily and emailing alerts on authority, DOT profile, safety rating, inspections, crash data, and insurance renewals/cancellations (dat.com/carrierwatch, HTTP 200, fetched 2026-08-19).
- DAT bundles 'DAT CarrierWatch' and 'CarrierWatch Insurance Certificates' as feature line items inside broker load-board plans starting at $159/mo (dat.com/pricing/brokers, HTTP 200, 718,967 bytes, fetched 2026-08-19).
- Truckstop Carrier Hub Basic is $99/mo and includes 'DOT data monitoring (active change tracking)' with 'Unlimited carriers monitored'; Advanced $200/mo adds insurance monitoring, self-serve business rules and 500 monitored carriers; bundled with Load Board Premium 'From $369/mo' (truckstop.com/product/carrier-monitoring/, HTTP 200, fetched 2026-08-19).
- Truckstop's own FAQ positions Carrier Hub Advanced as the direct replacement for SaferWatch ('If you're on SaferWatch today, Advanced is the straightforward upgrade path'), same URL, fetched 2026-08-19.
- Truckstop RMIS onboarding is sold to brokers, not free: 'Get started for just $340' (truckstop.com/product/carrier-onboarding/, HTTP 200, fetched 2026-08-19). The carrier-paid-free-to-brokers hypothesis is false for RMIS.
- CarrierOK already ships chameleon detection: its API description reads 'Fraud & risk intelligence — Chameleon carrier detection, identity fraud signals, and anomalous registration patterns', plus 'reverse lookups by EIN, address, phone, email, or VIN' (carrier-ok.com/pricing, HTTP 200, 1,616,893 bytes, fetched 2026-08-19).
- CarrierOK self-serve pricing is public and undercuts nothing: Pro $149/mo/user, Team $349/mo (monitoring up to 1,000 profiles), Enterprise $499/mo (10,000 profiles), free API sandbox, $50 pay-as-you-go activation, data 'updated multiple times a day' (same URL, fetched 2026-08-19).
- Carrier Assure offers a FREE 'Individual' tier and $149/mo Premium with 'DOT authority & monitoring' (carrierassure.com/pricing, HTTP 200, fetched 2026-08-19).
- The card's central willingness-to-pay evidence is not revenue: VerifyCarrier's Broker/$49, Broker Pro/$99, Platform/$249 monitoring plans are all marked 'Launching Soon' and not purchasable (verifycarrier.com/pricing, fetched 2026-08-19), and VerifyCarrier's own comparison page lists its Carrier Monitoring as 'Coming soon — join waitlist' (verifycarrier.com/vs/highway, HTTP 200, fetched 2026-08-19).
- VerifyCarrier occupies the exact intended niche with a free-forever tier of 100 lookups/month and $19/$49/$99 API tiers, explicitly marketed as the 'Self-Serve Alternative for Small Brokers' (verifycarrier.com/pricing and /vs/highway, fetched 2026-08-19).
- A free substitute for the chameleon screen exists: usdotwatch.com is free, has a dedicated 'Chameleon carriers' nav section and a 'Related carriers — common ownership, shared addresses, and chameleon activity' feature over '4,487,796 total registrations… updated daily. Last synced Aug 19, 2026' (HTTP 200, 48,516 bytes, fetched 2026-08-19). FMCSA's free SAFER Company Snapshot also returns HTTP 200 today.
- CarrierOwl, an actual micro-SaaS in this niche, has abandoned watchlist/monitoring subscriptions and now sells one-off manually-reviewed reports at $29 each / $99 for five, first report free (carrierowl.com/pricing, fetched 2026-08-19).
- The UCR premise is dead. Socrata dataset fux9-ij6p ('Unified Carrier Registration (UCR)') has rowsUpdatedAt = 1545090822 = 2018-12-17T23:53:42Z, zero columns, description 'Collects information from the State of Indiana's UCR Payment System', and its SODA endpoint returns HTTP 403 'no row or column access to non-tabular tables' (data.transportation.gov API, fetched 2026-08-19). The catalog contains only three such 2018 stubs; no federal UCR compliance dataset exists.
- QCMobile is NOT keyless, contradicting the card. GET https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 returns HTTP 404, content-type application/hal+json, body {"content":"Must provide Webkey","retrievalDate":"2026-08-19T23:22:58.857+0000"} (fetched 2026-08-19).
- 49 CFR 387.313(d): certificates of insurance and surety bonds 'shall not be cancelled or withdrawn until 30 days after written notice has been submitted' on Form BMC-35/BMC-36 — insurance lapse is a 30-day-telegraphed filing, not an hours-scale event (ecfr.gov enhanced renderer, HTTP 200, fetched 2026-08-19). 49 CFR 387.7(b)(1) sets a parallel 35-day notice for the insurer/insured.
- The L&I bulk files genuinely refresh daily, so feasibility was never the constraint: qh9u-swkp rowsUpdatedAt 2026-08-19T13:03:50Z (467,983 rows), 9mw4-x3tu 2026-08-19T13:38:02Z (4,941,925 rows), 6eyk-hxee 2026-08-19T14:30:04Z (1,860,604 rows), BOC3 2emp-mxtb 2026-08-19T13:08:57Z (1,860,604 rows) (data.transportation.gov, fetched 2026-08-19).
- Silent-staleness trap confirmed: two datasets share the name 'ActPendInsur - All With History' — qh9u-swkp (rows updated 2026-08-19T13:03:50Z) and y77m-3nfx (rows updated 2023-12-06T18:45:17Z). Selecting the wrong ID yields 32-month-stale 'all clear' output, a fail-open violation of A3 (fetched 2026-08-19).
- FMCSA is sunsetting the exact data source: 91 FR 23144, 'Availability of Motus, FMCSA's New Registration System' (published 2026-04-29) states Phase I released December 8, 2025, Phase II 'planned for the second quarter of 2026', and that FMCSA 'will sunset the current URS… registration components of the Motor Carrier Management Information System (MCMIS) and the former Interstate Commerce Commission Licensing and Insurance system, established in 1994' (federalregister.gov API + full text, fetched 2026-08-19).
- Motus puts 'fraud-resistant security features, such as individual identity and business verification, at the forefront' — an upstream, free attack on the chameleon-registration problem (91 FR 23144 full text, fetched 2026-08-19). Twelve Motus datasets already publish daily on data.transportation.gov, but Motus BOC3 - All With History holds only 113,395 rows vs 1,860,604 in the legacy BOC3 file — migration is mid-flight.
- Highway raised a strategic growth equity investment led by FTV Capital with Lead Edge Capital participating, announced 2025-08-20, and serves 'more than 1,050 brokers – including 70 of the top 100 in the U.S.' (highway.com press release, fetched 2026-08-19). Its plan page lists Connect Core, Load Lock, Load Lock+, Exclusion Intel; carrier-side product is free.
- Descartes MyCarrierPortal has already productized the defensible negligent-hiring artifact: 'AuditLog — Automatically document a record of carrier risk assessments, management reviews, and onboarding decisions', promoted site-wide as 'Turn Carrier Review Management into Defensible Documentation' (mycarrierportal.com, HTTP 200, fetched 2026-08-19).

### Unproven

- Highway's investment amount — the press release discloses no dollar figure and Crunchbase was not fetched. 'Highway raised how much' is unanswered from primary sources.
- Carrier411's own published pricing and monitoring latency — carrier411.com returns HTTP 403 behind Cloudflare to both WebFetch and curl with a browser UA (Ray IDs a2dce239b8ef476b / a2dce23c687e0f07, 2026-08-19). The ~$34.95/user/mo figure remains a competitor's secondary estimate only.
- BrokerSnapshot pricing — brokersnapshot.com returns HTTP 403 behind Cloudflare (Ray ID a2dce8a0bf7e2429, 2026-08-19). Its price point is unverified.
- Descartes MyCarrierPortal pricing — /pricing/ returns HTTP 404 today and no numbers appear on the broker solutions page; the low end of the enterprise-bundled segment is unpriced.
- SaferWatch's $79.95/mo — the card sourced this from an insurance broker's blog post, not SaferWatch. Not re-verified against a first-party page today.
- The Greenline Express v. High Plains Logistics $458,000 award and Penguin Trucking v. E.L. Hollingsworth $612,400 award are reported by trade press (freightcaviar.com, fetched 2026-08-19) and search snippets; Overdrive's account returned HTTP 403. Court dockets were not retrieved. The litigation pattern in this category is established; the exact figures are secondary.
- TIA's $700M-$1B/yr fraud estimate and the FMCSA complaint-volume growth from ~2,000 (2021) to 8,000+ (2025) were NOT re-verified against any primary FMCSA or TIA publication in this pass. Treat as unusable in marketing copy.
- Whether Truckstop Carrier Hub Basic's 'unlimited carriers monitored' carries an undisclosed seat or usage cap — the page footnotes it but does not quantify.
- Exact per-DOT rate for CarrierOK's pay-as-you-go API tier (page says 'Billed per unique DOT/month' without a number).
- Whether FMCSA will expose Motus identity/business-verification outcomes in the public bulk files, which would determine how much of the chameleon screen becomes a free government field. Motus datasets were inspected; no verification-status column was found, but the schema is mid-migration.
- Whether any incumbent actually delivers sub-daily (websocket/webhook) alerts in practice — DAT states 'daily', CarrierOK states 'multiple times per day', Truckstop states 'live monitoring', VerifyCarrier's webhook tier is unlaunched. No incumbent's measured latency was independently timed.

### Fatal risks

- Name collision with a live incumbent product: DAT Solutions sells 'DAT CarrierWatch' at $149/mo standalone and bundles it into broker load-board plans from $159/mo. The candidate's name is a competitor's trademark in the same category, sold to the same buyer.
- Kill pattern #3 (bundled in software the buyer already pays for), confirmed twice: DAT CarrierWatch inside DAT broker plans, and Truckstop Carrier Hub Basic at $99/mo with UNLIMITED monitored carriers and DOT change tracking inside the Truckstop load board. The candidate's top tier ($149/mo unlimited) is beaten by a bundle the buyer already has an invoice with. There is no crack between the load boards.
- Kill pattern #2 (live micro-SaaS at or below the hypothesized price), confirmed: CarrierOK Team $349/mo monitors 1,000 profiles and already ships 'chameleon carrier detection, identity fraud signals, anomalous registration patterns' plus EIN/address/phone/email/VIN reverse lookup — the candidate's entire onboarding wedge, self-serve, today. Carrier Assure has a FREE tier with DOT authority & monitoring.
- Kill pattern #1 (free substitute for the headline job), confirmed: usdotwatch.com gives away daily-synced FMCSA data with a dedicated 'Chameleon carriers' section and a shared-address/common-ownership 'Related carriers' feature over 4,487,796 registrations, alongside FMCSA's free SAFER Company Snapshot.
- The card's willingness-to-pay evidence is invalid on fetch: every VerifyCarrier monitoring tier ($49/$99/$249) is labeled 'Launching Soon'/'Coming soon — join waitlist'. No money changes hands at those prices. The one genuine micro-SaaS in the niche (CarrierOwl) ABANDONED monitoring subscriptions for $29 manual reports.
- Engine-never-arbiter breach in the differentiated half: publishing 'looks like a chameleon re-registration' about a named carrier is an unattended product asserting fraud about an identifiable business. Determinism does not cure it. The category has already produced defamation and tortious-interference judgments over carrier fraud flags (Greenline Express, ~$458K; Penguin Trucking, ~$612K per trade reporting), and Carrier411 restructured FreightGuard's report lifecycle in response. The only signable form — 'here is the government record and when we read it' — is exactly the free product.
- Data premise falsified #1: the UCR compliance flag cannot be built. data.transportation.gov's UCR dataset (fux9-ij6p) has had zero row updates since 2018-12-17, is a non-tabular pointer to Indiana's payment system, and returns HTTP 403 on any SODA query. No federal UCR compliance dataset exists.
- Data premise falsified #2: QCMobile is not free-and-keyless — it returns HTTP 404 'Must provide Webkey'. The 2-4 week MVP timeline in the card rested on that false claim.
- Regulatory floor is being pulled: 91 FR 23144 (2026-04-29) states FMCSA will sunset the ICC Licensing & Insurance system (est. 1994) and MCMIS registration components in favor of Motus, whose Phase II landed Q2 2026. Building on legacy L&I means building on a system with a published end date, while FMCSA moves identity and business verification upstream into registration for free.
- A3/fail-closed hazard baked into the data source: two co-named 'ActPendInsur - All With History' datasets exist, one refreshed today and one frozen since 2023-12-06. An unattended nightly diff pointed at the wrong ID emits confident 'all clear' on 32-month-stale data — the precise silent-staleness failure the autonomy gate forbids.
- No latency edge is available or needed: 49 CFR 387.313(d) gives 30 days' cancellation notice before an insurance filing lapses, so every competitor sees the same event weeks ahead. The urgency framing ('the moment a carrier lapses… before you tender the load') overstates a 30-day-telegraphed filing, and DAT (daily), CarrierOK (multiple times daily) and Truckstop (live) already cover it.
- The negligent-hiring 'defensible documentation' angle — the strongest remaining reshape — is already a shipped, named feature of a competitor: Descartes MyCarrierPortal AuditLog.

### References

- https://www.dat.com/carrierwatch (fetched 2026-08-19) — DAT's product literally named CarrierWatch: 'Starting at $149/mo', daily change checks, automated email alerts on authority, DOT profile, safety rating, inspections, crash data, insurance renewals and cancellations. HTTP 200, 350,536 bytes.
- https://www.dat.com/pricing/brokers (fetched 2026-08-19) — DAT broker plans 'Starting at $159/mo' listing 'DAT CarrierWatch' and 'CarrierWatch Insurance Certificates' as included feature rows. HTTP 200, 718,967 bytes.
- https://truckstop.com/product/carrier-monitoring/ (fetched 2026-08-19) — Truckstop Carrier Hub: Basic $99/mo with 'Unlimited carriers monitored' + DOT data monitoring; Advanced $200/mo with insurance monitoring and business rules; bundle 'From $369/mo'; FAQ positions it as the SaferWatch replacement. HTTP 200, 119,360 bytes.
- https://truckstop.com/product/carrier-onboarding/ (fetched 2026-08-19) — Truckstop RMIS 'Get started for just $340' — RMIS is broker-paid, refuting the carrier-paid-free-to-brokers hypothesis. HTTP 200, 206,387 bytes.
- https://www.carrier-ok.com/pricing (fetched 2026-08-19) — CarrierOK Pro $149/mo/user, Team $349/mo (1,000 monitored profiles), Enterprise $499/mo (10,000); data directories $199-$999/mo; 'updated multiple times a day'; EIN/address/phone/email/VIN reverse lookup. HTTP 200, 1,616,971 bytes.
- https://www.carrier-ok.com/pricing?product=data (fetched 2026-08-19) — CarrierOK API description advertising 'Chameleon carrier detection, identity fraud signals, and anomalous registration patterns', free sandbox, $50 pay-as-you-go activation. HTTP 200.
- https://www.carrierassure.com/pricing (fetched 2026-08-19) — Carrier Assure: free Individual tier, Premium $149/mo, 'DOT authority & monitoring'. HTTP 200, 35,216 bytes.
- https://verifycarrier.com/pricing (fetched 2026-08-19) — VerifyCarrier API tiers Free(100 calls)/$19/$49/$99 live; ALL monitoring tiers ($49/$99/$249) marked 'Launching Soon', not purchasable — invalidating the card's core WTP evidence.
- https://verifycarrier.com/vs/highway (fetched 2026-08-19) — VerifyCarrier's own comparison page listing its Carrier Monitoring as 'Coming soon — join waitlist' and positioning as the self-serve small-broker alternative. HTTP 200, 84,393 bytes.
- https://carrierowl.com/pricing (fetched 2026-08-19) — CarrierOwl has abandoned monitoring subscriptions: free lookup (3/day), $29 per manually-reviewed report, $99 for five; explicitly no watchlist or monitoring.
- https://usdotwatch.com/ (fetched 2026-08-19) — Free FMCSA lookup with a dedicated 'Chameleon carriers' section and 'Related carriers — common ownership, shared addresses, chameleon activity'; 4,487,796 registrations, 'Last synced Aug 19, 2026'. HTTP 200, 48,516 bytes.
- https://safer.fmcsa.dot.gov/CompanySnapshot.aspx (fetched 2026-08-19) — FMCSA's free SAFER Company Snapshot — HTTP 200, text/html, 5,525 bytes. Free first-party substitute for point-in-time status.
- https://mobile.fmcsa.dot.gov/qc/services/carriers/76830 (fetched 2026-08-19) — QCMobile carrier endpoint returns HTTP 404, application/hal+json, {"content":"Must provide Webkey"} — refutes the card's 'free and keyless' claim.
- https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi (fetched 2026-08-19) — QCMobile API docs page live: HTTP 200, text/html, 51,391 bytes (webkey registration required).
- https://data.transportation.gov/api/views/fux9-ij6p.json (fetched 2026-08-19) — UCR dataset metadata: rowsUpdatedAt 1545090822 = 2018-12-17T23:53:42Z, zero columns, 'State of Indiana's UCR Payment System'. HTTP 200, 7,538 bytes.
- https://data.transportation.gov/resource/fux9-ij6p.json?$select=count(*) (fetched 2026-08-19) — HTTP 403, {"error":true,"message":"no row or column access to non-tabular tables"} — the UCR dataset holds no queryable rows.
- https://data.transportation.gov/api/views/qh9u-swkp.json (fetched 2026-08-19) — ActPendInsur - All With History, rowsUpdatedAt 2026-08-19T13:03:50Z, 467,983 rows — L&I insurance file refreshes daily. HTTP 200, 25,600 bytes.
- https://data.transportation.gov/api/views/y77m-3nfx.json (fetched 2026-08-19) — A SECOND dataset identically named 'ActPendInsur - All With History' whose rows last updated 2023-12-06T18:45:17Z — the silent-staleness trap.
- https://data.transportation.gov/api/views/9mw4-x3tu.json (fetched 2026-08-19) — AuthHist - All With History, rowsUpdatedAt 2026-08-19T13:38:02Z, 4,941,925 rows. HTTP 200, 23,076 bytes.
- https://data.transportation.gov/api/views/6eyk-hxee.json (fetched 2026-08-19) — Carrier - All With History, rowsUpdatedAt 2026-08-19T14:30:04Z, 1,860,604 rows. HTTP 200, 58,461 bytes.
- https://data.transportation.gov/api/catalog/v1?q=Motus&limit=40 (fetched 2026-08-19) — Twelve live Motus datasets (Carrier, AuthHist, Insur, InsHist, BOC3, RevokeSuspend + history variants) all updated 2026-08-19 — FMCSA's replacement pipeline is already publishing.
- https://data.transportation.gov/api/views/6snj-ed7q.json (fetched 2026-08-19) — Motus BOC3 - All With History: only 113,395 rows vs 1,860,604 in legacy BOC3 (2emp-mxtb) — migration mid-flight, BOC-3 coverage split across systems.
- https://www.federalregister.gov/api/v1/documents/2026-08334.json (fetched 2026-08-19) — 91 FR 23144, 'Availability of Motus, FMCSA's New Registration System', published 2026-04-29 — Phase I Dec 8 2025, Phase II Q2 2026, sunset of MCMIS registration components and the ICC Licensing & Insurance system.
- https://www.federalregister.gov/documents/full_text/text/2026/04/29/2026-08334.txt (fetched 2026-08-19) — Motus full text: 'fraud-resistant security features, such as individual identity and business verification, at the forefront'; Phase II defers MC/FF number elimination and BOC-3 filing changes.
- https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-49?chapter=III&subchapter=B&part=387&section=387.313 (fetched 2026-08-19) — 49 CFR 387.313(d): insurance certificates 'shall not be cancelled or withdrawn until 30 days after written notice' via Form BMC-35/36 — lapses are 30-day-telegraphed, not hours-scale. HTTP 200.
- https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-49?chapter=III&subchapter=B&part=387&section=387.7 (fetched 2026-08-19) — 49 CFR 387.7(b)(1): 35 days' written cancellation notice between insurer and insured motor carrier. HTTP 200, 12,642 bytes.
- https://highway.com/press-releases/highway-secures-strategic-growth-equity-investment-led-by-ftv-capital (fetched 2026-08-19) — Highway growth equity led by FTV Capital, announced 2025-08-20; serves 'more than 1,050 brokers – including 70 of the top 100 in the U.S.'; amount undisclosed.
- https://highway.com/plans (fetched 2026-08-19) — Highway broker plan tiers (Highway Connect / Connect Core, Load Lock, Load Lock+, Exclusion Intel, Know Your Driver) — all 'Get a Demo', no self-serve price. HTTP 200, 52,493 bytes.
- https://www.mycarrierportal.com/solutions/for-freight-brokers/ (fetched 2026-08-19) — Descartes MyCarrierPortal: Identity & Vetting, Insurance Monitoring, Fraud Prevention, and 'AuditLog — Turn Carrier Review Management into Defensible Documentation'. HTTP 200, 191,312 bytes.
- https://www.freightcaviar.com/freightguard/ (fetched 2026-08-19) — Trade coverage of FreightGuard defamation exposure: Greenline Express v. High Plains Logistics, $458,000 for defamation and tortious interference; Carrier411's report-lifecycle changes; counsel on permanence and insurance exclusions. HTTP 200, 100,560 bytes. Secondary source.
- https://www.carrier411.com/carrier-monitoring-service.cfm (fetched 2026-08-19) — HTTP 403 Cloudflare block (Ray ID a2dce239b8ef476b) — Carrier411's own pricing and latency could not be verified.
- https://brokersnapshot.com/pricing (fetched 2026-08-19) — HTTP 403 Cloudflare block (Ray ID a2dce8a0bf7e2429) — BrokerSnapshot pricing could not be verified.
- https://www.mycarrierportal.com/pricing/ (fetched 2026-08-19) — HTTP 404 — Descartes MyCarrierPortal publishes no self-serve price page.