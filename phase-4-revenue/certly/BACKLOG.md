# Certly — Product Backlog

**Owner:** Product Owner agent (wave 1). **Date:** 2026-09-03.
**Prioritisation rule, applied to every line below:** *would a stranger pay $99/month without it, and
would they still be paying in month two?* If no to both, it is not MVP. If yes to both, it is not even
a feature — it is the product.

Read with `KNOWLEDGE_BASE.md` (the domain), `THRESHOLDS.md` (when we stop) and `specs/` (one per Must).
**Every event name in the tables below is registered in
[`specs/00-event-vocabulary.md`](specs/00-event-vocabulary.md)**, which is the single source; the
`events:check` CI rule fails the build on a name that is not there (REVIEW.md B-14).

**Iterated 2026-09-03 after the wave-1b review** — see `REVIEW_RESPONSE.md` for the finding-by-finding
record of what changed here and why.

---

## §0 Positioning — read this before the backlog, because it changes what MVP means

The Phase-1 dossier's thesis was: *incumbents are demo-gated enterprise, so a self-serve $99–299/mo
tier is an open wedge.* **That thesis was true about the top of the market and is false about the
bottom.** Checked live on 2026-09-03, on the vendors' own pricing pages:

| competitor | published price | self-serve | what they already ship that was in our proposed MVP |
|---|---|---|---|
| **TrackMyVendor** | Free ≤25 subs · **$39/mo** unlimited · **$59/mo** unlimited + users, 30-day trial | yes, no demo | AI COI parsing, 90/60/30/7 expiry alerts, per-project insurance templates, CSV import, compliance reports, audit trail, Zapier |
| **bcs** | **Free ≤25 vendors** · **$0.95/vendor/mo** self-service | yes | AI extraction ("RiskBot"), automated deficiency notices, vendor mobile app, Yardi/Procore/MRI integrations |
| **COI Tracker** | **$29**/25 · **$59**/100 · **$129**/unlimited, free 10-vendor tier | yes | expiry reminders, update requests, status dashboard, storage, CSV export — **but no extraction, no requirement matching, no endorsement checking** (`OFFER.md` §8.3) |
| **SmartCOI** | ~$79/mo starter (50 certificates) *(third-party report; own site 404 on two attempts — `UNVERIFIED`)* | yes | COI tracking for property managers |
| Jones | "per record, per year", unpublished | demo | PM + GC + owners; publishes a free public endorsement library |
| TrustLayer | unpublished | demo | claims 517k companies, 400k COIs/month |
| myCOI / illumend | unpublished | demo | enterprise; **named by a real GC's subcontract exhibit in our own corpus** (R4) |

**Consequence.** Everything the brief lists as MVP is table stakes at $39. Shipping it at $99 with
nothing else is a losing product. Three defensible differences fall out of the research, and every
Must item below is shaped by them:

- **D1 — The three-state truth.** ACORD 25 prints, on its own face, that *"a statement on this
  certificate does not confer rights to the certificate holder in lieu of such endorsement(s)"*
  (`KNOWLEDGE_BASE.md` §A.1). A `Y` in `ADDL INSD` is a producer's claim, not proof. Every competitor
  we could inspect renders a green tick from that checkbox. Certly's comparison engine has a third
  state — **`asserted_only`** — and says so on the box, in the app, and in the report. This is the one
  thing in the category that is both true and uncomfortable, and telling the truth about it is a
  product, not a slogan.
- **D2 — The gap report is the artefact.** The dossier's own go-to-market is "a free COI audit finds
  an already-expired policy, and that finding is the close." Then the finding must be a **document the
  buyer can forward to their boss, their owner, their board or their insurer** — branded, dated,
  showing what was checked and what was not. Competitors sell a dashboard. A dashboard cannot be
  forwarded. `M12` is Must for this reason alone.
- **D3 — Sourced requirement templates.** Our template library cites five real published GC
  subcontract exhibits and a real property manager's published vendor page, each with a URL and a
  date (`KNOWLEDGE_BASE.md` §B). "Per-project templates" as a feature is table stakes; *templates that
  show you where the number came from* is not, and it is exactly what a small operator without a risk
  department needs.

**What this does not change:** the price. `OFFER.md` §8 commits the ladder at **$99 / $199 / $299** for
50 / 150 / 400 **tracked vendors**, plus a **$39 per 50** Vendor Pack — 2.1× bcs at 50 vendors and
*cheaper* than bcs at 400. (The unit was called "active certificates" in the first draft and is
renamed everywhere; the meter itself is unchanged — `specs/10` §2.1, REVIEW.md B-10.) That stays the hypothesis, and `THRESHOLDS.md` §3 makes it
falsifiable — if activation→paid at $99 fails while the product works, the honest answer is that we
are priced above a $39 market, not that the product is wrong.

---

## §1 MUST — the MVP

Fifteen items. Nothing here can be cut and still leave something a stranger pays for monthly.
Every item has a spec at `specs/<id>-<slug>.md`.

| id | story | value | effort | depends on | analytics events |
|---|---|---|---|---|---|
| **M1** | **Magic-link auth + organisation.** *As a property manager I sign in with my work email and get my own workspace, with no password and no sales call.* | Table stakes; also the whole "self-serve" claim. PLAN §A7 fixes the mechanism. | **S** | `packages/platform` auth | `signup_started`, `magic_link_requested`, `magic_link_sent`, `magic_link_consumed`, `magic_link_failed`, `org_created`, `login_succeeded`, `signout` |
| **M2** | **Requirement templates and the requirement editor.** *As a GC I pick "commercial GC — subcontractors", get a sourced starting set of limits and endorsements, and edit it to match my subcontract.* Covers GL/auto/WC/umbrella limits, additional insured (ongoing + completed), waiver of subrogation (GL and WC, separately), primary and non-contributory, occurrence-vs-claims-made, per-project aggregate, carrier rating, and per-vendor-type sets. | **The product's spine.** Without a requirement there is nothing to compare against, and this is D3. | **L** | M1, KB §B | `template_library_opened`, `template_applied`, `requirement_set_created`, `requirement_edited`, `template_source_opened`, `vendor_type_created` |
| **M3** | **Vendor directory + CSV import.** *As a manager I paste or upload my vendor list — name, type, business contact mailbox — and it is in the system in two minutes.* Includes column mapping, dedupe, and per-vendor requirement-set assignment. | Time-to-first-value. A tool you have to hand-type 80 vendors into never gets used twice. | **M** | M1, M2 | `vendor_created` (`{source}`), `vendor_updated`, `csv_import_started`, `csv_columns_mapped` (`{auto_accepted}`), `csv_import_completed` (`{rows, created, updated, skipped, ms}`), `csv_import_failed`, `vendor_type_created`, `vendor_missing_contact_prompt_shown` |
| **M4** | **COI upload and extraction.** *As a manager I drop a PDF or a phone photo of a certificate and, in under a minute, see every field read out with a confidence score and a "needs review" flag on anything doubtful.* Anthropic adapter, PDF/image document blocks, strict JSON Schema output, per-field confidence, quote gate, `needs_review` state and review UI. | **The reason the product exists.** Everything else is CRUD. | **L** | M1, M3, KB §A/§D | `coi_upload_started`, `coi_uploaded` (`{mime, pages, bytes, source}`), `coi_upload_rejected`, `coi_duplicate_detected`, `extraction_started`, `extraction_succeeded` (`{ms, doc_confidence, fields_below_tau, gate_failures, model, cost_cents, …}`), `extraction_failed` (`{reason}`), `extraction_retried`, `document_rejected` (`{kind}`), `review_opened`, `review_field_corrected` (`{field, from_confidence, gate}`), `review_completed`, `certificate_promoted` |
| **M5** | **Comparison engine.** *As a manager I see, per vendor, exactly which of my requirements are met, which are gaps, and which are only asserted on the certificate and not evidenced by an endorsement.* Deterministic, **no model call**, five requirement states (`met` / `gap` / `asserted_only` / `not_checked` / `undetermined`), plus name match, certificate-holder match, dates, coverage presence, aggregate basis, SIR and stop-gap checks. | D1. This is the judgment the customer is buying and it must be inspectable and reproducible. | **M** | M2, M4, KB §B.4 | `comparison_run` (`{requirements, met, gaps, asserted_only, not_checked, undetermined, ms, engine_version}`), `gap_detected` (`{requirement_kind, coverage}`), `asserted_only_detected` (`{endorsement_key}`), `explanation_opened` (`{state}`), `vendor_status_changed` (`{from, to}`) |
| **M6** | **Vendor status dashboard.** *As a manager I open one screen and know who meets my requirements, who has a gap, who only claims an endorsement, who expires in the next 30 days, who has already lapsed and who has never sent anything.* Six mutually exclusive counters that sum to the roster. Filter, sort, search, bulk select. | The daily surface. Retention lives here. | **M** | M5 | `dashboard_viewed` (`{meets, gaps, expiring, expired, asserted_only, no_certificate}`), `dashboard_filtered`, `vendor_opened_from_dashboard` |
| **M7** | **Expiry reminders to the vendor's contact.** *As a manager I stop chasing: at T−60/30/14/7/1 and after expiry, Certly emails the vendor's business mailbox and the producer email from the certificate, with a branded one-click upload link.* Sequence configurable, per-vendor pause, full suppression and bounce handling, CAN-SPAM footer. | **The only feature that saves labour rather than surfacing risk** — and therefore the one that keeps the subscription alive after the first audit high wears off. | **L** | M5, M8, platform email + jobs | `reminder_scheduled` (`{rung, days_out}`), `reminder_sent` (`{rung, recipient_kind}`), `reminder_delivered`, `reminder_bounced`, `reminder_complained`, `reminder_suppressed` (`{reason}`), `reminder_skipped` (`{reason}`), `reminder_cancelled`, `reminder_paused`, `reminder_clicked`, `unsubscribed` (`{scope}`), `renewal_received_after_reminder` |
| **M8** | **Branded vendor upload link (no account).** *As a vendor's insurance agent I click the link in the email, see exactly what this customer requires, and upload the certificate — without creating an account.* Tokenised link, expiring, per-vendor, shows the requirement set in plain language, accepts PDF/image, runs M4 on receipt. | Reminders that lead to a login wall do not get answered. This is what makes M7 convert. It is also the cheapest 80% of "forward by email" (`SH-1`). | **M** | M4, M2 | `upload_link_generated` (`{purpose}`), `upload_link_opened` (`{first_open, rung}`), `upload_link_expired_view`, `upload_link_revoked_view`, `vendor_upload_started`, `vendor_upload_completed` (`{mime, bytes}`), `vendor_upload_rejected`, `vendor_upload_gaps_shown`, `vendor_upload_second_attempt` |
| **M9** | **Audit trail.** *As a manager under an owner audit I can show who uploaded what, when it was read, what it said, what was compared, and every value a human changed.* Append-only, per-org, exportable. | Sold as compliance; needed as **truth about our own extraction**. Every corrected field is a labelled training example and an eval candidate (`THRESHOLDS.md` §4). | **S** | M4, M5 | `activity_viewed` (`{scope}`), `activity_filtered` (`{kind}`), `audit_exported` (`{events, range_days}`) — audit *writes* go to `audit_events`, never to the product funnel |
| **M10** | **Billing — tiers by tracked vendors, with a card-required trial.** *As a stranger I start a 14-day trial **with a card and no charge until day 14**, see that written next to the button before I type the card, get warned three days and one day before the first charge, and cancel in one click if I want to.* Stripe Checkout + Portal, webhook-as-truth, tier enforcement at the tracked-vendor count, recorded consent, dunning. | No money without it — and the disclosure is what keeps it defensible (`specs/10` §3.1). | **M** | M1, platform billing | `pricing_viewed`, `paywall_viewed` (`{trigger, vendors_used, vendor_limit}`), `checkout_started` (`{plan, interval, pack_qty}`), `checkout_completed` (*the trial starts here — a card on file, not money*), `trial_will_end_email_sent` (`{days_left}`), **`trial_converted`** (*the first `invoice.paid` — the number `THRESHOLDS.md` §3 measures*), `trial_cancelled`, `subscription_past_due`, `subscription_cancelled` (`{reason, tenure_days}`) |
| **M11** | **Onboarding — the first-certificate audit.** *As a new signup I am walked from empty workspace to my first compared certificate in one sitting: pick a template → add one vendor → upload one certificate → see the gaps.* Resumable checklist, skippable, measured. | **Activation is the single number that decides this business** (`THRESHOLDS.md` §1). Leaving it to the customer to discover the loop is how a good product dies at 12% activation. | **M** | M2, M3, M4, M5 | `onboarding_started` (`{audience}`), `onboarding_step_completed` (`{step, seconds}`), `onboarding_step_abandoned` (`{step}`), **`activated`** (`{minutes_from_signup, vendors_at_activation, gaps_found}` — the **only** activation event, `specs/11` §2), `onboarding_skipped` (`{last_step}`), `onboarding_resumed`, `vendors_pasted`, `first_finding_shown` |
| **M12** | **Gap report export (PDF + CSV).** *As a manager I export a dated report showing every vendor, every requirement, what was met, what was only asserted, and what was not checked — and I forward it.* Carries the §F.1 disclaimer, the requirement set as evaluated, and the `last_verified` date on every template row. | **D2.** The artefact that gets forwarded is the artefact that sells the seat to the next person. | **M** | M5, KB §F | `report_generated` (`{format, scope, vendors, gaps, asserted_only, not_checked, ms}`), `report_downloaded`, `report_share_created` (`{days}`), `report_share_opened`, `report_share_revoked` |
| **M13** | **Settings, help and legal.** Org profile and certificate-holder entity block (needed by M5's holder match), **team: invitations by magic link and the owner/editor/viewer role matrix, enforced server-side against the plan's seat count**, user's own notification preferences, sending identity, data export, account deletion; help centre; Terms (including the standing "we never charge your vendors" commitment), Privacy, DPA-lite, sub-processors, the three disclaimers. | Legally required, and the certificate-holder entity block is a **functional dependency of M5**, not decoration. | **M** | M1 | `settings_viewed` (`{section}`), `entity_block_changed` (`{reevaluated_vendors}`), `alternate_holder_added`, `member_invited` (`{role}`), `member_joined`, `role_changed`, `member_removed`, `help_search`, `help_article_viewed` (`{slug}`), `support_email_sent`, `data_exported`, `deletion_requested`, `deletion_cancelled`, `legal_page_viewed` |
| **M15** | **The Free Gap Report.** *As a stranger I drop up to 25 certificates on a public page, give only an email, and get a dated report of what has expired, what is short, what is only claimed **and which of my documents you could not read confidently enough to compare** — no account, no card.* Converts in one click into a populated org. **Ships under a founder legal gate**: no producer personal data is ever stored, source files are deleted inside the render job, everything else is purged at 7 days, and until the legal read lands the landing page runs the samples-only demo instead (`specs/15` launch gate, REVIEW.md B-07). | **`OFFER.md` makes this the offer's front end and `LANDING_SPEC.md` makes it the hero CTA.** Without it the landing page has no primary action. It is M4 + M5 + M12 with no account, and it is the path a stranger arrives on *before* paying. | **M** | M2, M4, M5, M12 | `gap_report_started` (`{audience}`), `gap_report_files_added`, `gap_report_email_captured`, `gap_report_processing`, `gap_report_ready` (`{documents, extracted, compared, needs_review, rejected, expired_found, gaps_found, asserted_only_found, cost_cents, ms}`), `gap_report_viewed`, `gap_report_emailed`, `gap_report_cta_clicked`, `gap_report_converted`, `gap_report_rate_limited`, `gap_report_capacity_disabled` |
| **M14** | **Admin metrics.** Signups, activation, activation→paid, MRR, churn, extraction accuracy on live corrections, review-queue depth, model cost per document. | We pre-committed numbers in `THRESHOLDS.md`; a threshold nobody can read is a wish. | **S** | M1, events table | *(reads the events table; emits none)* |

**Effort totals:** 4 × L, 9 × M, 2 × S — fifteen items.

**M15 was added after the Offer & Landing agent published `OFFER.md`.** Pricing and offer structure are
that agent's deliverable, not this one's; when its front end turned out to be a *product surface* and
not a page, the backlog had to absorb it rather than let the landing page ship a CTA with nothing
behind it. Spec `15-free-gap-report.md` and the corrected `10-billing-and-trial.md` are the result.

### The three MVP cuts that will be argued about, decided here

1. **No vendor accounts.** Vendors and agents get a tokenised link (M8), never a login. A vendor portal
   is `SH-5`. Rationale: the vendor is not the customer, has no incentive to maintain a password, and
   every account we ask for is a step at which the chase fails.
2. **No integrations at launch.** Not AppFolio, not Buildium, not Yardi, not Procore. CSV in (M3) and
   CSV/PDF out (M12). Rationale: an integration is weeks of work per system for an install base of
   zero, and CSV import is what actually clears the first-run hurdle. `L1`.
3. **Forward-by-email inbound is Should, not Must** — see `SH-1` for the arithmetic.

---

## §2 SHOULD — the next two months, in the order the data should pick them

| id | story | value | effort | depends on | analytics events |
|---|---|---|---|---|---|
| **SH-1** | **Forward-by-email inbound.** *As a manager I forward the agent's email to `coi@{INBOUND_DOMAIN}` and the attachment is filed against the right vendor.* (`{INBOUND_DOMAIN}` is an env value — we do not own `certly.app`, which `IDENTITY.md` §2.1 records as somebody else's parked placeholder; REVIEW.md B-11.) | **Why not MVP, honestly:** Resend Inbound exists and is real — own-domain addresses, `email.received` webhook, structured payload with attachments (resend.com/features/inbound, fetched 2026-09-03) — so *receiving* is a day. **Routing is not.** An inbound mail must resolve to an org *and* a vendor from a sender address that is usually the agent's, not the vendor's, and the failure mode of guessing wrong is filing a certificate against the wrong vendor, which is worse than not filing it. The honest cheap version is per-org addresses (`coi+<org_token>@{INBOUND_DOMAIN}`) plus a human triage queue for unmatched mail — which is a **queue UI**, not a webhook, and that is the real cost. M8 already covers the same job for the 80% of chases Certly itself initiates. | **M** | M4, M8 | `inbound_email_received`, `inbound_matched` (`{by}`), `inbound_unmatched`, `inbound_triaged`, `inbound_rejected` |
| **SH-2** | **Endorsement pages as first-class documents.** Upload/attach endorsement PDFs separately, detect form numbers, and promote `asserted_only` → `met`. | Turns D1 from a complaint into a resolution path. Very likely the top upgrade driver. | **M** | M4, M5, KB §C | `endorsement_uploaded`, `endorsement_form_detected` (`{form, edition}`), `requirement_promoted` |
| **SH-3** | **Properties / projects.** Scope requirements and vendor lists to a property, association or job. | Both ICPs are multi-site; a single flat vendor list breaks at ~3 properties. Watch `dashboard_filtered` for the signal. | **M** | M2, M3 | `property_created`, `vendor_assigned_to_property`, `requirements_scoped` |
| **SH-4** | **Requirement extraction from a pasted clause.** Paste the insurance exhibit from your subcontract or lease; Certly proposes the requirement set. | Kills the worst onboarding step and is the honest answer to the thin tenant-template evidence (KB §B.3). | **M** | M2, M4 | `clause_pasted`, `requirements_proposed` (`{n}`), `proposal_accepted`, `proposal_edited` |
| **SH-5** | **Vendor self-service portal.** A magic-link view where a vendor sees their own status across all their customers on Certly. | Retention and a genuine network effect — but only once there are enough customers for a vendor to appear twice. | **M** | M8 | `vendor_portal_opened`, `vendor_portal_upload` |
| **SH-6** | **Other documents: W-9, business licence, auto registration.** Same upload/extract/expiry loop, different schema. | Cheap after M4 and directly matches what TrackMyVendor already ships. | **M** | M4 | `document_type_added`, `w9_extracted`, `licence_expiring` |
| **SH-7** | **Seat management and role granularity.** A seat-management UI beyond invite/remove/change-role, per-property and per-vendor-type permissions, and bulk member operations. | **Invitations, the three roles and seat enforcement are Must, not Should** — they are already specified in `specs/01` §4 and `specs/13` §2/§7 and the pricing cards sell 3/10/25 seats, so a seat limit nothing enforces is a sold feature that does not exist (REVIEW.md MJ-03). What is genuinely deferred is everything past that. | **S** | M13 | *(registered when specced — `specs/00` §4)* |
| **SH-8** | **Bulk re-evaluation on requirement change.** Change a limit; every affected vendor re-compares and the newly-non-compliant surface. | The moment that proves the tool is a system and not a filing cabinet. | **S** | M5 | `bulk_reevaluation_run` (`{vendors, newly_gapped}`) |
| **SH-9** | **"What we require" spec sheet.** A one-page PDF of the customer's requirement set, addressed to the agent, attached to every chase. | Real GCs already hand-make this (corpus C15, `mcgough-subcontractor-sample-coi-exhibit-b.pdf`). Copying an artefact the market already builds by hand is the cheapest product decision available. | **S** | M2, M7 | `spec_sheet_generated`, `spec_sheet_attached` |
| **SH-10** | **Zapier / webhook out.** Fire on gap detected, certificate expiring, vendor became compliant. | Table stakes at the competitive tier; trivial after the events table exists. | **S** | M5, events | `webhook_configured`, `webhook_delivered`, `webhook_failed` |

---

## §3 LATER — real, but not until the numbers say so

| id | item | the trigger that promotes it |
|---|---|---|
| **L1** | Integrations: AppFolio, Buildium, Yardi, RealPage, Procore | ≥ 20% of paying customers name the same system in onboarding, **or** a lost-deal reason repeats it three times |
| **L2** | ACORD 27 / 28 (evidence of **property** insurance) | tenant-side customers exceed 15% of the base — property certificates are a landlord/lender transaction, not a vendor one |
| **L3** | A.M. Best rating lookup | a licensing budget exists. Four of five GC exhibits in the corpus demand A-/VIII; until then the requirement renders as a manual check (`OQ-4`) |
| **L4** | Public API | someone asks twice and one of them is paying |
| **L5** | Sub-tier tracking (my sub's subs) | GC customers exceed 50 subcontractors on average |
| **L6** | Canadian / UK certificate formats | not before US retention is proven; the whole KB is US-form-specific |
| **L7** | SSO / SAML | first customer above 20 seats |
| **L8** | White-label vendor-facing branding | a partner (PM software vendor, insurance agency) asks to resell |
| **L9** | Mobile app | `coi_uploaded` from mobile user-agents exceeds 30% and the web upload flow is measurably failing there |

---

## §4 NEVER — and why

Not "not yet". These are decisions, and each one has a cost we are choosing to pay.

| id | never | why |
|---|---|---|
| **N1** | **Claim that coverage is verified, or contact carriers to confirm policies.** | We read documents. Confirming a policy is in force is an act only the insurer can perform, and asserting it creates exactly the liability the customer is buying insurance against. This is also why the word *"verified"* never appears about a policy (KB §F). Costs us a marketing word; buys us the ability to sleep. |
| **N2** | **Sell insurance, refer to brokers for commission, or take carrier placement fees.** | The moment Certly earns on placement, its gap findings are no longer credible. The whole product is a trust instrument. |
| **N3** | **Recommend what limits a customer should require.** | That is insurance and legal advice, per-state and per-contract. Templates cite sources and say "starting point" (KB §F.2); they never say "you should require". |
| **N4** | **Block, hold or gate a vendor's payment.** | The enterprise platforms' killer feature and their biggest liability. A false gap that stops a roofer's cheque in November is a lawsuit and a support catastrophe, and our extraction is not — and will never be — accurate enough to be a payment gate. We surface; the human decides. |
| **N5** | **Scrape or purchase agents' or vendors' personal contact details.** | PLAN §D5 and the phase-3 standing rule. Every address Certly emails is either one the customer typed or the producer email printed on a certificate the customer was given. No exceptions, including for "just enrichment". |
| **N6** | **Build a cross-customer certificate network or resell extracted data.** | The dossier called the extraction corpus a moat. Turning customers' vendors' documents into a saleable asset is a different company with a different consent model. Per-org isolation is a schema-level invariant, not a setting. |
| **N7** | **SMS or auto-dial chasing.** | Different consent regime (TCPA), different carrier relationships, and it converts a helpful reminder into harassment of a small business's office manager. Email only. |
| **N8** | **A human-in-the-loop review service.** | It is precisely what makes myCOI and bcs Full-Service cost $10k minimums, and PLAN's constraint is *no human loop inside the products*. Where extraction is uncertain we say so and ask the customer — we never quietly employ someone to look. |
| **N9** | **An agent loop that negotiates with insurance agents by email.** | Unbounded outbound authored by a model, on our sending domain, about somebody's insurance. The blast radius of one bad generation is the domain and the customer relationship. Templated email with named variables, forever. |
| **N10** | **Publish an accuracy percentage without its denominator and date.** | Same rule as Clausewright's N10/R11. "99% accurate" with no corpus, no field breakdown and no date is the category's standard dishonesty (see the incumbents' "87% faster reviews"). We publish per-field accuracy on a named corpus at a named date, or nothing. |
| **N11** | **Render or generate an ACORD-branded form** — including tracing its layout for a marketing asset, and including publishing a third party's certificate on our own site. | ACORD's marks and layout are ACORD's. We read their forms and output our own (KB §A.2). `kb-samples/MANIFEST.md` §Licence keeps the corpus private, as fixtures; the landing page's demo and V4 are built from **Certly-authored fixtures** instead (`LANDING_SPEC.md` §8.1/§5, REVIEW.md B-13). Quoting the form's own printed notice, attributed, is not reproduction and stays. Producing an ACORD form is a licensing decision for the founder, not a feature. |
| **N13** | **Any {PRODUCT_NAME} marketing, upsell, CTA or link — other than the upload link, the unsubscribe link and the legal pages — inside an email to a vendor or an agent.** | These messages go to a business that has no relationship with us, on a customer's behalf. One marketing line removes any argument that the message is transactional under CAN-SPAM, and it burns the customer's relationship with their own vendor, which is worth more to them than we are. Spelled out as five footer requirements in `specs/07` §6.1–§6.2 (REVIEW.md MJ-16). |
| **N12** | **A permanent free *tier*.** | bcs, TrackMyVendor and COI Tracker all give away 10–25 vendors on an ongoing account. We cannot match that: every document costs a real model call, and free users upload the messiest documents. The answer is the **Free Gap Report** (M15) — a one-off finding with no account, nothing stored past **7 days**, no producer personal data stored at all, and nothing to cancel (`specs/15` §6) — plus a card-required 14-day trial (M10). That is a front end, not a free tier, and the distinction is the difference between spending inference to *create* a customer and spending it forever on someone who will never be one. If activation→paid fails at $99, the fix under test is **price** (`THRESHOLDS.md` §3), not a free tier that guarantees the unit economics never work. |

---

## §4b Decisions the review closed, recorded here so wave 2 does not re-open them

| decision | where it lives | why it is here |
|---|---|---|
| **Document storage: Vercel Blob, behind a four-method `DocumentStore` interface in `packages/platform`, with browser-direct uploads** | `specs/03` §9 (the interface and the upload flow), and applied in `specs/04` (`errorsCsvKey`), `specs/08` (the agent's phone upload), `specs/12` (report artefacts and signed downloads), `specs/15` (gap-report files and the purge job) | `product/CLAUDE.md` **OQ-6** blocked five Must specs. The corpus is the evidence: 23 real samples run 58 KB–2.7 MB, median ≈600 KB — a small-object, write-once workload, the worst case for a database and unremarkable for any object store. **Neon never holds bytes**, only `storageKey`: certificates in `bytea` inflate every dashboard query, wreck branch/restore economics and put customer documents inside the backup surface. S3 costs a few dollars less at 10–100 GB and costs a second cloud account, a second credential rotation, IAM, a lifecycle policy and a **sixth sub-processor row** with the DPA that follows. **Reversible by design:** `interface DocumentStore { put, signedUrl, get, delete }`, `VercelBlobStore` today, `S3Store` when storage passes ~500 GB or egress becomes a visible line (REVIEW.md §3) |
| **Browser-direct uploads on M4, M8 and M15** | `specs/03` §9, `specs/08` §5, `specs/15` §7 | A Vercel Function caps the request body far below our 20 MB validation limit (4.5 MB at the time of writing), so an agent's phone photo and a 25-file gap-report session would fail at the platform, not at our validator. The browser asks a route handler for a short-lived token and PUTs straight to Blob; the server sees only the reference and re-reads size and type from the object. Wave 2 **re-verifies the platform limit at build time and records the measured number with its date** (REVIEW.md MJ-17) |
| **One event vocabulary** | `specs/00-event-vocabulary.md`, enforced by `events:check` | four vocabularies existed for one funnel (REVIEW.md B-14) |
| **One activation definition** | `specs/11` §2, event `activated` | three existed; one of them would have made a clean portfolio a failed activation (REVIEW.md B-05) |
| **One disclaimer text** | `KNOWLEDGE_BASE.md` §F, generated into `src/lib/kb/disclaimers.ts`, rendered on **eleven** surfaces | two "canonical, verbatim" texts existed and a Must spec had a test only one could pass (REVIEW.md B-12, MJ-06) |
| **The tier metric is "tracked vendors"** | `specs/10` §2.1, quoted verbatim in `OFFER.md` §8.1, `LANDING_SPEC.md` §6 and help article 12 | two incompatible meters, one of which billed for the product's best finding (REVIEW.md B-10) |
| **ACORD 25 (2025/12) is the current edition** | `KNOWLEDGE_BASE.md` §A.2, the `form_edition` enum, fixture G17 | today's newest certificates would have extracted as `unknown` (REVIEW.md B-01) |

---

## §5 Spec index

| spec | Must item |
|---|---|
| `specs/00-event-vocabulary.md` | **all** — the single source of every event name, plus the `events:check` CI rule |
| `specs/01-auth-and-org.md` | M1 |
| `specs/02-requirement-templates.md` | M2 |
| `specs/03-coi-extraction.md` | M4 — **the JSON Schema, confidence rule, review contract and evals live here** |
| `specs/04-vendor-directory-and-import.md` | M3 |
| `specs/05-comparison-engine.md` | M5 |
| `specs/06-vendor-dashboard.md` | M6 |
| `specs/07-expiry-reminders.md` | M7 |
| `specs/08-vendor-upload-link.md` | M8 |
| `specs/09-audit-trail.md` | M9 |
| `specs/10-billing-and-trial.md` | M10 |
| `specs/11-onboarding-first-audit.md` | M11 |
| `specs/12-gap-report-export.md` | M12 |
| `specs/13-settings-help-legal.md` | M13 |
| `specs/14-admin-metrics.md` | M14 |
| `specs/15-free-gap-report.md` | M15 |
| `specs/schema/coi.v1.schema.json` | the extraction schema, complete and structurally checked (M4) |
