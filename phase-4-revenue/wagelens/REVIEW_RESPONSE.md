# {{PRODUCT}} (WageLens) — RESPONSE TO THE WAVE-1B REVIEW

**Author:** wave-1b Iteration author ({{PRODUCT}}). **Date:** 2026-09-03.
**Responds to:** [`REVIEW.md`](REVIEW.md) — 9 blocking · 19 major · 10 minor.
**Stage:** PIPELINE stage 6 — *"the author fixes, one variable at a time, with a changelog."*
This file is the changelog. `REVIEW.md` was not edited.

---

## 0. Verdict at a glance

| | fixed | fixed differently | declined | total |
|---|---:|---:|---:|---:|
| **Blocking (B1–B9)** | **7** | **1** (B8) | **1** (B7 — not this fleet's) | **9** |
| **Major (M1–M19)** | **16** | **2** (M2, M9) | **1** (M19 — not this fleet's file) | **19** |
| **Minor (m1–m10)** | **9** | 0 | **1** (m5 — frozen file) | **10** |
| **Total** | **32** | **3** | **3** | **38** |

**No blocking finding is left open by this fleet.** The two findings not fixed here (**B7**, **M19**)
are both owned by another agent and are recorded below with what this fleet did to make their fix
cheap. The one blocking finding *fixed differently* (**B8**) was fixed **more** conservatively than
the review asked, because the review's own failure rule points that way.

**New files:** [`specs/WL-14-wd-watch.md`](specs/WL-14-wd-watch.md) (B5),
[`specs/WL-EVENTS.md`](specs/WL-EVENTS.md) (B6), and this file.
**Files edited:** `UX.md`, `PERSONA.md` (m1 only), `BACKLOG.md`, `KNOWLEDGE_BASE.md`,
`THRESHOLDS.md`, `OFFER.md`, `LANDING_SPEC.md`, `specs/WL-00`–`WL-13`.
**Files deliberately untouched:** `IDENTITY.md`, `design-system.css`, `identity/samples.html`
(Brand Director's, B7), `REVIEW.md`, `../PREREQUISITES.md` (orchestrator's, M19).

**Landing word count above the pricing block: 445 / 450**, counted with the convention now written
into `LANDING_SPEC.md` §2 (55 + 83 + 53 + 117 + 94 + 43). It was 436 before; the review's required
additions cost 13 net words and were paid for by trimming, not by raising the ceiling.

---

## 1. The five decisions the brief asked for

Each was taken in the direction that **reduces founder liability**, per the failure rule. Each is
reversible, and the cost of reversing it is stated.

| # | decision | option chosen | why, in one line |
|---|---|---|---|
| **1** | **Trial design** | **The 14-day card-on-file trial, charged on day 15**, keeping the "first two Fridays free" framing. `UX.md` rewritten; ROSCA-style disclosure added to `WL-09` and to the checkout and landing copy; "Start free" replaced by **`Start 14-day trial`** everywhere. | Three documents to one, the money path was already built on it, **and** a cardless free week hands a signed federal document to an unverified stranger. |
| **2** | **GC Roll-up tier** | **Kept on the ladder as "Coming", waitlist only — no purchasable CTA, no live Stripe price.** `WL-24` stays a Should. | Selling sub seats, weekly collection and a status board that do not exist is misrepresentation with a chargeback behind it. Moving WL-24 to Must costs the MVP's largest **L**, cold-starts empty, and delays the day a stranger can pay us; the waitlist gives us the demand signal WL-24's own trigger needs. |
| **3** | **Modification pinning** | **Made real, end to end.** `WL-13` ingests `/history` and superseded revisions on demand plus a launch backfill; `WL-02` pins an explicitly named superseded modification; `WL-00` and `LANDING_SPEC` V2 read the corpus, not the network. | It is the offer's only unheld ground, 29 CFR 1.6 makes it correct, and the reviewer verified both endpoints live. Refusing to pin the contract's own modification forces the customer to file at a rate their contract does not carry. |
| **4** | **Free watch alerts** | **Specced, not removed** — [`WL-14`](specs/WL-14-wd-watch.md), a **Must at effort S**: unticked consent box naming the determination, double opt-in, ≤3 per address, one-click unsubscribe + `List-Unsubscribe`, CAN-SPAM footer, rate limits, stated retention. | It is the only email list this product builds organically, and at S the spec is cheaper than the retreat. A consented list is an asset; an unconsented one is a liability. |
| **5** | **Events** | **One canonical list**, [`specs/WL-EVENTS.md`](specs/WL-EVENTS.md), reused verbatim by `LANDING_SPEC.md` §13 and `THRESHOLDS.md`. Four names corrected, ten homeless events given owners, a CI union test in both directions. | `THRESHOLDS.md` is the pre-committed decision instrument; an event it cannot read is a decision that cannot be made. |

---

## 2. Blocking findings

| id | status | files and sections changed | what was done, and the decision where the review offered options |
|---|---|---|---|
| **B1** — two trial designs | **fixed** | `UX.md` §0, §1 (journey + paywall), §2 (P8 added), §4, §6 (A16), §9 (E8/E10), §11, §13 Q1 · `OFFER.md` §1.5, §7 · `specs/WL-00` flow | **Decision D1 adopted as written: the 14-day card-on-file trial, charged day 15.** `UX.md`'s cardless "free first week" is gone; the paywall now sits **before** the first project, at Checkout, with the terms disclosed above the card. The offer's framing — *"your first two Fridays are free"* — is kept because it is true of this design, which also settles the smaller contradiction inside the finding (**two Fridays, not one week**). `UX.md` §13 Q1 is closed rather than restated: the question "is the free week's WH-347 watermarked?" no longer exists; the trial's WH-347 is **fully filable**, drafts are watermarked, a certified payroll never is. |
| **B2** — GC tier sold before it exists | **fixed** | `LANDING_SPEC.md` §8 (table, CTA row, waitlist card, future-tense bullets), §14 · `OFFER.md` §6.1, §10 (table + settings + hand-over note) · `specs/WL-09` (tier table, Screens, `joinGcWaitlist`, **V17–V19**, Edge cases, ACs, tests) · `BACKLOG.md` WL-09, WL-24 · `THRESHOLDS.md` §0.3 | **Option 1 taken: "coming", waitlist, no purchasable CTA, no live Stripe price.** The card shows **Coming**, bullets in the future tense, one control (`Join the list`) emitting `gc_tier_interest` under WL-14's consent rules. **Made structural, not editorial:** V17 a sellable-set constant Checkout refuses to leave; V18 a boot assertion that fails the deploy on a live-mode GC price id; V19 a render test that no purchase control exists in the card. OFFER §10 marks both GC rows **TEST MODE ONLY** with a founder hand-over note. **Option 2 (move WL-24 to Must) was considered and rejected** — argued in `BACKLOG.md` §2 and `OFFER.md` §6.1: largest L, cold start, and it buys nothing the waitlist does not. |
| **B3** — spec forbids what the offer sells | **fixed** | `specs/WL-02` header note, *"Modification pinning, end to end"* (new), Flow, Screens, data model (`wd_pinned_superseded`, new `wd_pin_method` values), `resolveDeterminationByNumber`, `getModificationHistory`, **V3 rewritten + V3a + V3b**, 6 new ACs, edge-case row, analytics, tests · `specs/WL-05` AC · `specs/WL-06` V14 + AC · `specs/WL-11` AC | The `is_active = true` clause is **deleted from V3**; the acceptance criterion that said a superseded modification "does not pin" is **replaced by one asserting that it does**, with `wd_pinned_superseded = true` and the permanent *"a newer modification (m) was published on {date}"* line on the card, the determination page, **every draft payroll header and the generated PDF's footer**. The bare-WD-number case is unchanged (offer the active one) — V3a makes "the user named it" the precondition, so an old modification is never inferred. `not_found` still refuses: the distinction is a typo versus a contract. |
| **B4** — corpus never ingests superseded modifications | **fixed** | `specs/WL-13` header note, *"The three ways a determination enters the corpus"* (new), Flow, `kb_wd_modifications` (+`active`, `text_held`, `history_source_url`, `history_fetched_at`), job kinds, routes (`kb-backfill-history`, health), **V9–V12**, 7 new ACs, edge cases, analytics, tests, fixture note · `KNOWLEDGE_BASE.md` KB-3, §3.1, §3.2, §4.1, §4.2(2) · `LANDING_SPEC.md` V2 data | All four of the review's required additions: **(a)** `kb.fetch_history` on any touch — a pin, a public `/wd/:wdNumber` view, a watch, a WL-08 diff; **(b)** on-demand `kb.fetch_determination` for a named superseded revision, **through the same gates G1–G4, same parser, same transaction** (V9 — no "lite" ingest); **(c)** a launch backfill over the landing page's demo determinations and all 858 determinations above modification 1; **(d)** an AC asserting a superseded revision is stored, readable and leaves the active row untouched. **History eager, text lazy** — one small request per WD number so a timeline can always be drawn; 17 KB per revision only when asked for. One fixture must be captured before the first commit: `kb-samples/sam-wd-detail-TX20260253-rev0.json`. |
| **B5** — free watch promised, specified nowhere | **fixed — option (a), the review's recommendation** | **new** `specs/WL-14-wd-watch.md` · `BACKLOG.md` §1 (15 Must items) + new item · `KNOWLEDGE_BASE.md` §3.2 · `OFFER.md` §6.1, O2, B3 · `LANDING_SPEC.md` §5.1, §5.4 · `UX.md` §2 (P9), §3 P2, §6, §9 (E-W1/E-W2) · `specs/WL-00` V11 + flow · `specs/WL-11` V10 · `THRESHOLDS.md` P7 | `wd_watches` gets its owner, with everything the review named: `(email, wd_number, consent_text_version, consented_at, created_ip_hash, confirm_token_hash, confirmed_at, unsubscribe_token_hash, expires_at)`, an **unticked** consent checkbox naming the determination, **double opt-in**, ≤3 per address, one-click unsubscribe in the body **and** `List-Unsubscribe`, the P10 postal address, IP-hash-only rate limits, and a **retention table** (pending 30 days, confirmed 18 months rolling, suppressions kept forever *in order not to email*). Plus `email_suppressions`, and V7: a marketing unsubscribe can **never** suppress a magic link, a billing email or a WL-08 project alert. `WL-14` and `WL-08` never share a send path. Recorded honestly in `BACKLOG.md`: this is the one Must item the Rosa test does not justify — it is Must because it is already promised on three surfaces. |
| **B6** — two event vocabularies | **fixed** | **new** `specs/WL-EVENTS.md` · `LANDING_SPEC.md` §13 (rewritten, owner column, rename table) + §14 · `THRESHOLDS.md` header · `specs/WL-00` analytics (now owns the public surface) · `specs/WL-09` (`pricing_cta_clicked` + B9 events) · `WL-01`, `WL-02`, `WL-04`–`WL-08`, `WL-12`, `WL-13` analytics headers · `BACKLOG.md` WL-00, WL-05 | **Spec names are canonical**, as the review directed. Renamed on the landing page: `lookup_completed`→`lookup_performed`, `lookup_empty`→`lookup_zero_results`, `source_chip_clicked`→`lookup_official_link_clicked`, `plan_cta_clicked`→**`pricing_cta_clicked`** (added to WL-09). The ten homeless events are **kept and given owners** — `hero_viewed`, `hero_cta_clicked`, `lookup_started`, `how_step_viewed`, `ledger_used`, `wh347_artefact_expanded`, `timeline_viewed`, `comparison_table_viewed`, `modification_pin_used`, `faq_opened` → **WL-00**; `alert_email_captured` → **WL-14**. `official_determination_link_clicked` has **one** owner (WL-11) and a `surface` prop. WL-EVENTS §8 restates every THRESHOLDS ratio in canonical names; a CI union test asserts the emitted set equals the file in **both** directions. |
| **B7** — cross-app identity collision | **declined — not this fleet's to fix, and the brief forbids it** | *(no identity file touched)* · `LANDING_SPEC.md` §12 Fonts, §14 · `REVIEW_RESPONSE.md` §4 | The review says so itself: a **Brand Director** is arbitrating centrally and will write `IDENTITY_ARBITRATION.md`. `IDENTITY.md`, `design-system.css` and `identity/samples.html` were **not edited**. What this fleet did instead is the review's own (a): **hold the semantic-token line** — `LANDING_SPEC.md`'s palette binding is unchanged and §14 now carries an explicit checklist item that every colour is a `--wl-*` token and never a hex, **so the arbitration is a token-file swap rather than a rebuild**. §12's font row was changed only in *how* fonts load (M11), and says in terms that **which** typeface ships is frozen pending B7. Items (b) re-running `contrast.py` and (c) rewriting `IDENTITY.md` §14 fall due **on** arbitration and belong to the identity author. |
| **B8** — guarantee short form drops the cap | **fixed differently — more conservatively than asked** | `OFFER.md` §5.2 G2 (rewritten: canonical long form, canonical short form, the no-uncapped-refund rule, liability restated), §8 Q1, §11.1, §11.3 Q1–Q2 · `LANDING_SPEC.md` §5 (sentence removed from the copy; the wording it must carry written out separately), §8, §9 FAQ 1, §14 · `UX.md` §11 | The review offered *"carry the bound in the same sentence, or cut it entirely"*, and left the **cap number** to founder Q6. **Both halves were done, and the cap was decided rather than left open.** (1) The sentence is **cut from the page unconditionally** — §14's checklist item is no longer "pending", it is a gate. (2) The wording it must carry **if it ever ships** is written out with the cap **inside the sentence**, in `OFFER.md` (long and short form), `LANDING_SPEC.md` §5 and `UX.md` §11, **word for word identical**. (3) **The cap is three months, service-shaped** (refund up to three months *and* re-issue every corrected form free) — the option that reduces founder liability, ≈**$59,400** rather than ≈**$237,600** at 200 accounts; it is what `OFFER.md` §11.3 already recommended and what the reviewer's Q6 defaulted to. (4) A standing rule and a CI grep: **no refund sentence anywhere without its cap in the same sentence.** **Founder can override to twelve months** — see §4. |
| **B9** — no auto-renewal disclosure or consent | **fixed** | `specs/WL-09` Flow (disclosure block), Screens, `subscription_terms_acceptances` table, `createCheckoutSession` + `recordTermsAcceptance`, **V14, V15, V16, V16a, V16b**, 9 new ACs, analytics, tests · `OFFER.md` §7.1 (new), §10 settings · `LANDING_SPEC.md` §5.4, §8, §14 · `UX.md` §1, §2 (P8), §4, §9 (E8, E10), §11 · `specs/WL-00` V10, `specs/WL-01` flow, `specs/WL-11` grep list | All three of the review's V14–V16, plus two more it implied. **V14** the full terms — trial length, **exact amount, exact date**, renewal interval, how to cancel, the reminder promise — rendered **adjacent to and above** the button, in body type, never collapsed or linked away. **V15** an **unticked** checkbox gates Checkout, and acceptance is recorded with the **content hash of the block as rendered**, the disclosed amount and the disclosed date (`subscription_terms_acceptances`); `createCheckoutSession` **refuses** without a matching row, so the consent gates the money path and not just the UI. **V16** a **day-10 pre-charge email** (a spec requirement, not a marketing intention) and a **≥7-day annual renewal notice**, both transactional and **not suppressible by a marketing unsubscribe**. **V16a** no CTA leading to a card may read "Start free" — the label is `Start 14-day trial` on `/pricing`, `/billing/start`, the landing pricing cards **and** the lookup escalation; a CI grep enforces it. **V16b** cancellation at least as easy as subscribing, with the cancel link in the disclosure, the banner and every trial/renewal email. The free lookup keeps "Free. No card, no login" because it is true. |

---

## 3. Major and minor findings

### 3.1 Major

| id | status | files changed | what was done |
|---|---|---|---|
| **M1** onboarding budget has no card step | **fixed** | `UX.md` §0, §4, §2 (P8) | Checkout added at **90 s**; total restated **≈9.5 → ≈11 min**; §0's sentence says eleven and the instrumented threshold moved with it. The alternative (cut 90 s elsewhere) was rejected — nothing in the table is padded. |
| **M2** importer sold, not built | **fixed differently** | `specs/WL-04` (paste flow, screens, `parseWorkerPaste`/`commitWorkerPaste`, V10–V12, 5 ACs, unit tests) · `OFFER.md` B1, B6, O12, §2.4, §8 Q8, §10 metadata · `UX.md` §3 A3, §4, §5.3, §12 · `BACKLOG.md` WL-04 | **B6 deleted** from the launch offer and `history_import=true` **removed from all three annual Stripe rows** — a metadata flag nothing implements is a customer billed for a feature that does not exist. **B1 reworded** to paste-or-type. The review's "add a paste affordance to WL-04" is done in full: preview, every skipped row with a reason, one transaction, **the SSN rejection applied per row and never truncating**, and **nothing auto-classified**. WL-15 stays a Should with its trigger. |
| **M3** three roles vs one user | **fixed** | `UX.md` §3 A11, §8.2 | §8.2 relabelled **the WL-37 design** and marked as not-MVP; A11's gate becomes the typed certifying official (name, title, phone, email — WL-05 B12) plus `certified_by_user_id`. The review's recommendation exactly; no half-role model ships. |
| **M4** payroll number allocated twice | **fixed** | `specs/WL-05` (data model nullable + partial unique, new *"Payroll numbering"* section, `createPayroll`, `nextPayrollNumber`, `certifyPayroll`, `markNoWorkPerformed`, 4 ACs, integration tests, analytics prop) · `specs/WL-07` (`nextPayrollNumber`, V10, 2 ACs, edge case) · `BACKLOG.md` WL-05 | **Allocated at certification** (D7 — WL-07 wins). Drafts hold `null` and display "#8 (provisional)". The only version in which a deleted draft cannot gap a certified federal sequence. |
| **M5** two keyboard maps | **fixed** | `specs/WL-05` keyboard table (rewritten, one map) + keyboard test · `UX.md` §7 (now references, does not restate) | WL-05's semantics kept (they have the tests); **UX's `Esc`-revert and `S`-split adopted** — both genuinely useful and cheap. `hours_keyboard_shortcut_used` enumerates exactly the final set and a test asserts the enumeration matches the table. |
| **M6** magic-link parameters diverge | **fixed** | `specs/WL-01` (note, flow, screens, `code_hash`/`code_attempts`/`consumed_via`, `verifyMagicLinkCode`, V2/V2a/V3, 5 ACs, edge case, analytics, tests) · `UX.md` §5.2 | Settled to the spec's **20 minutes, 60-second resend, two-step GET→POST verify, `/signup` + `/login`**; **the six-digit cross-device code adopted as a named MVP requirement** — one column, one input, and it is this buyer's exact failure mode. `magic_link_consumed.method` measures whether it earned its place. |
| **M7** UX blocks where the spec warns | **fixed** | `UX.md` §0, §3 A9 (table rewritten + rationale) · `specs/WL-05` W1 note | **WL-05 wins on liability grounds** (D5, D6). `rate-below-determination` → loud warning with a **recorded acknowledgement**; `determination-moved` **never blocks, at any age**. Blocking is reserved for what makes the *form* invalid (B1–B12) — which is why `fringe-missing` stays blocking (it is B9, page 2) while a low rate does not. §0's sentence changed from "must be stopped" to "must be warned". |
| **M8** submission lifecycle has no spec | **fixed** | `specs/WL-07` (new section, `payrolls` columns, `setSubmissionStatus`, `register_csv`, V7–V9, 6 ACs, 2 edge cases, analytics) · `UX.md` §2 A12, §9 E5 · `BACKLOG.md` WL-07 | The review's "cheapest honest fix" taken as written: nullable `submission_status ∈ {not_sent, sent, accepted, rejected}` with `submitted_at`, recipient and note, **set by the user, honour system, no integration and no inference**, firing E5 on `rejected`. Guarded by V8: setting a status changes **no** payroll line and **no** document hash. E5's phantom webhook trigger removed. This also answers founder Q11. |
| **M9** B4 and B5 sold in the wrong shape | **fixed differently** | `OFFER.md` B4, B5 + rationale · `specs/WL-07` `documents_zip` · `specs/WL-06` (share-link section, `reissueShareLink`, V11–V13) · `LANDING_SPEC.md` §9 FAQ 6 | The review offered "build a merged Audit Binder PDF **or** reword". **Reworded**, both times — the copy was wrong, not the specs. B4 → *"one archive"*, which is the ZIP + `manifest.csv` WL-07 actually produces; a merged binder is a good later feature, not a launch promise, and growing an S-shaped spec an L-shaped merge step to rescue a bonus line is the wrong trade. B5 → a **7-day link you can re-issue in one click**, and revoke — see M10. **"Audit Binder" is now the one name** for the artefact across `OFFER.md`, `LANDING_SPEC.md` §9, `WL-07` and the UI (which also closes **m10**). |
| **M10** unauthenticated document URL, unrevocable | **fixed** | `specs/WL-06` (`revoked_at`, `revoked_by_user_id`, `last_accessed_at`, the share-link rules section, `revokeShareLink`/`revokeAllShareLinks`/`reissueShareLink`, V11–V13, 5 ACs, errors, `share_link_revoked`) · `specs/WL-11` **V9** · `OFFER.md` B5 | 7-day expiry kept; **`revoked_at` + a visible revoke control + "revoke all on this payroll"** added; accesses logged with a count and a timestamp; **V12 forbids any code path creating a link without an expiry ≤7 days and any "never expires" branch**, so permanence cannot be switched on later by accident. The sharing mechanism is now **stated on the privacy page** (WL-11 V9): what a link exposes, for how long, that it is unauthenticated, and how to revoke it. B5's copy no longer promises permanence. |
| **M11** performance budget forbids what identity mandates | **fixed** | `LANDING_SPEC.md` §12 Fonts row, §14 | **Two self-hosted WOFF2 subsets, ≤ 45 KB total, no font CDN**, mono confined to V1's rate figures and V5's rendered form (D11). Satisfies both documents' goals and removes a third-party request from a page whose argument is precision. **The typeface choice itself stays frozen pending B7** — this row constrains how fonts load, not which. |
| **M12** two product names ship simultaneously | **fixed** *(within this fleet's files)* | `UX.md` header + §9 E1 · `OFFER.md` header + 12 strings · `BACKLOG.md`, `THRESHOLDS.md`, `KNOWLEDGE_BASE.md` (§5 stamp, §9.2, §9.3) · `LANDING_SPEC.md` · `specs/WL-00`, `WL-01`, `WL-02`, `WL-04`, `WL-08`, `WL-11` (V7, **V8**, AC, grep list) | LANDING_SPEC's pattern adopted everywhere: **one `{{PRODUCT}}` token in every user-visible string, one constant in code, slug `wagelens` unchanged**, and a "name pending founder decision (P11)" banner at the top of `UX.md`, `OFFER.md`, `BACKLOG.md`, `THRESHOLDS.md` and `KNOWLEDGE_BASE.md`. `WL-11` V8 makes it a CI grep. **`identity/samples.html` is not edited** — it is the Brand Director's file (B7 constraint); `UX.md`'s banner records that it carries the same correction. |
| **M13** wireframe and chosen copy disagree | **fixed** | `LANDING_SPEC.md` §3 | Wireframe redrawn with §4's final 31-word sub-headline. The build copies the picture, so the picture now carries the words that fit the 55-word budget. |
| **M14** hero has no ambiguous-result state | **fixed** | `LANDING_SPEC.md` §5.1 (new row), §5.4 (12 counted words), §6 **V1b** (new brief), §13 (`lookup_ambiguous`), §14 · `specs/WL-00` | **V1b, The Candidate List**: WD number, construction type, modification, publication date, **county list as the discriminator**, classification count, **no default selected**, and one line of copy — *"Several determinations cover this county. Your contract names the one that governs."* No row is highlighted, ordered by likelihood or marked recommended; there is no heuristic in the codebase and there must not be one on the page. |
| **M15** "revision" in customer-facing copy | **fixed** | `OFFER.md` (16 strings) · `LANDING_SPEC.md` (10 strings) · `UX.md`, `specs/*` | Swept. "Revision" survives only where the SAM.gov API field is literally `revisionNumber` or the endpoint path is being described. It is the differentiator's own word. |
| **M16** snapshot fallback vs fail closed | **fixed** | `LANDING_SPEC.md` §5.2 · `specs/WL-00` **V9**, Errors, AC, §14 | **WL-00 wins (D8): the snapshot is deleted.** The widget reads our own database, so "unreachable" is *our* outage, and a rate whose current source we cannot confirm is exactly what G2 refunds on. Honest error + the SAM.gov link, and **no rate on the page**. There is no snapshot file to build, ship or keep fresh. |
| **M17** three promises about the archive | **fixed** | `UX.md` §11 | **30 days** (D9), stated in the cancel flow, with a forced export offer and the customer's own three-year duty spelled out. Matches `OFFER.md` G3, `specs/WL-09` V6 and `specs/WL-07`. |
| **M18** the page speaks only to the owner | **fixed** | `LANDING_SPEC.md` §4 (new line, +12 words), §6 V4 input label, §8 kicker | The review offered §4 Step 03 **or** the pricing kicker. **Both, and §4 is the one inside the budget:** *"The person who does this on Friday afternoon types the week once."* — placed under the three steps so a reader who bounces before pricing still meets her. V4's third input relabelled *"what an hour of office time costs **you**"*. A second line goes in the pricing block, which is below the 450 and costs nothing. |
| **M19** PREREQUISITES P7 asks for a model key | **declined — not this fleet's file** | `OFFER.md` §11.3 Q9 *(recorded)* | `../PREREQUISITES.md` is the **orchestrator's**, and the brief's constraint list does not include it. The correction is recorded where the founder will meet it — a new `OFFER.md` §11.3 Q9 stating that **{{PRODUCT}} needs no model key at launch** and that P7 should drop it, citing `BACKLOG.md` "Never", `KNOWLEDGE_BASE.md` K5 and G4. **Action for the orchestrator: amend P7 (and P8, per Q8).** |

### 3.2 Minor

| id | status | file · section | what was done |
|---|---|---|---|
| **m1** OMB expiry wrong | **fixed** | `PERSONA.md` §13 R8 | R8 now records that the **mirrored instructions carry a stale 09/30/2026 stamp**, that the live form prints **`Expires: 01/31/2028`** (KB-6, re-verified independently by the reviewer), that **KB-6's date is the calendar item**, and that dol.gov's own PDF is the authority wherever the date matters. |
| **m2** `wagelens.app` on every filing | **fixed** | `KNOWLEDGE_BASE.md` §5 stamp, §9.2 | `{{PRODUCT_URL}}`, resolved from env to the live host. A wrong URL on a federal filing that must survive three years is a small mistake with a long life. |
| **m3** THRESHOLDS §4 bands unreadable | **fixed** | `THRESHOLDS.md` §4 | 4b's three bands are contiguous and **every band now names its own metric in the first column**, so no row inherits a label from the row above. Tier mix follows. The note records that the two rows never shared a denominator, which is why the ambiguity mattered. |
| **m4** trial MRR and a non-existent status | **fixed** | `specs/WL-12` `getRevenue`, panel, **V8–V9**, 2 ACs · `THRESHOLDS.md` benchmarks | **MRR = `active` + `past_due` only**; **Trial MRR is a separate, labelled line** ("not yet invoiced"). `trialing-with-card` is gone and V9 asserts every status literal is a member of WL-09's enum. With a 14-day trial on every price, the old formula would have overstated MRR by a fortnight of new business, permanently. |
| **m5** three hard `9px` sizes | **declined — frozen file** | *(none)* | `design-system.css` is in the brief's do-not-touch list with `IDENTITY.md` and `identity/samples.html` while the Brand Director arbitrates (B7). **Handed to the identity author with the fix already specified by the review:** a `--wl-text-3xs: 0.5625rem` token (or reuse `--wl-text-2xs`) for lines 798, 810 and 983, and tokenise the document preview's five hard-coded hexes as `--wl-doc-*` so they enter `contrast.py`'s table. Both are one-line changes and both should land in the same pass as the arbitration, when `contrast.py` is re-run anyway. |
| **m6** `minutes_in_grid` missing from the backlog | **fixed** | `BACKLOG.md` WL-05 | Prop added, with a note that THRESHOLDS P1 is measured on it and that `specs/WL-EVENTS.md` is now the single definition. |
| **m7** unsourced 62% statistic | **fixed** | `UX.md` §1 | **Cut**, not re-sourced — P§13 S27 does not contain it and the claim is not needed: the trial design is argued from the card-on-file benchmarks in `specs/WL-09`, which are sourced and were checked. The removal is recorded in place. |
| **m8** product name in a URL slug | **fixed** | `specs/WL-11` flow, article table, **V8** | `/help/what-wagelens-does-not-do` → **`/help/what-we-do-not-do`**. The slug is name-free so a rename never breaks a link an auditor bookmarked; the article's title renders `{{PRODUCT}}`. Disclaimer texts swept in the same pass. |
| **m9** §1's list breaks around the vocabulary note | **fixed** | `OFFER.md` §1 | The note moved **above** the list, where it governs every line in it. §1 is the paragraph the founder reads first. |
| **m10** "Audit Binder" used as a shipped feature name | **fixed** | `LANDING_SPEC.md` §9 FAQ 6 · `specs/WL-07` · `OFFER.md` B4 | Resolved with M9: **one name, one artefact, one shape** — an archive — across offer, landing, spec and product. |

---

## 4. Founder can override

Three decisions were taken **for** the founder rather than waiting on them, because leaving them
open blocked the build or left an unbounded promise on a live page. Each is reversible. **Two of
them are the founder's liability to accept, and reversing either has a cost that is stated here so
the reversal is a decision rather than an accident.**

| # | what was decided | the founder's alternative | what reversing it costs |
|---|---|---|---|
| **1** | **G2's cap is three months, service-shaped** — refund the affected months up to three *and* re-issue every corrected form free (finding B8, reviewer's Q6). Worst case at 200 accounts ≈**$59,400**. | **Twelve months**, worst case ≈**$237,600**. It is the stronger offer and it is the founder's liability to accept. | The number must change in **`OFFER.md` §5.2, `LANDING_SPEC.md` §5 and `UX.md` §11 in a single edit**. Editing one of the three is precisely how B8 happened, so the three are now written to be diffed together. G2 still does not ship until counsel signs it either way (Q2). |
| **2** | **The GC tier is not sellable at launch** — published as "Coming" with a waitlist, no Checkout path, Stripe prices test-mode only (finding B2, reviewer's Q2). | **Sell it** — which honestly means **ship WL-24 first**, not expose the price first. | Moving WL-24 into Must costs the MVP's largest **L** (org-to-org invitations, a permissions matrix, review-and-reject, a nagging engine) and delays the date a stranger can pay us; and it lands on an empty table on day one. If the founder wants it sold at launch, the sequencing decision is the one to take, not the pricing one. |
| **3** | **The onboarding promise is "about eleven minutes", not "under ten"** (finding M1). | Keep "ten" and **cut 90 seconds elsewhere**. | Nothing else in §4's table is padded — the 3 minutes for the project is the F3 candidate screen doing real work and the 3 for the roster is a 15-person crew. The promise is instrumented, so an unmeasurable minute would be a broken promise on our own dashboard. It goes back to ten if the measured median gets there. |

**Everything else the review left to the founder (Q1, Q3–Q5, Q7–Q18, Q20) is untouched and still
has a default**, exactly as `REVIEW.md` §4 wrote it. **Q19** (auto-renewal wording) is answered by
B9's disclosure block, now specified in `specs/WL-09` V14–V16b. **Q11** is answered by M8. **Q10**
is answered inside B1.

---

## 5. What the reviewer should re-check, and where

The nine blocking items, mapped to the exact place each was fixed, so the sign-off checklist can be
walked without searching.

| checklist line | where to look |
|---|---|
| **B1** one trial design, no "free week" | `UX.md` §1 (journey + the rewritten paywall paragraph), §4, §6 A16, §13 Q1; `OFFER.md` §7; grep `free week` returns only the notes explaining its removal |
| **B2** GC card is a waitlist; §10 marks GC test-mode-only | `LANDING_SPEC.md` §8; `OFFER.md` §6.1 + §10 table (`live at launch?` column); `specs/WL-09` V17–V19 and the two B2 acceptance criteria |
| **B3** V3 and the AC allow an explicit superseded pin | `specs/WL-02` V3/V3a/V3b, *"Modification pinning, end to end"*, and the six B3 acceptance criteria; the edge-case row now agrees with the rules |
| **B4** WL-13 ingests `/history` and superseded revisions, with an AC and a backfill | `specs/WL-13` *"The three ways a determination enters the corpus"*, V9–V12, the seven B4 acceptance criteria, `kb-backfill-history`; `KNOWLEDGE_BASE.md` KB-3 and §4.1 |
| **B5** the watch has a Must spec with consent, unsubscribe, postal footer | `specs/WL-14` in full; `BACKLOG.md` §1 (15 items) |
| **B6** every landing event exists in a spec under the same name; §1's ratio is computable | `specs/WL-EVENTS.md` (§0 rename table, §8 the funnel in canonical names); `LANDING_SPEC.md` §13 |
| **B7** *(not this fleet)* | `IDENTITY.md`, `design-system.css` and `identity/samples.html` are **unchanged**; `LANDING_SPEC.md` §14 holds the token line so the arbitration is a swap |
| **B8** no refund sentence without its cap, in the same sentence | `OFFER.md` §5.2 (canonical long and short forms, the rule, the CI grep); `LANDING_SPEC.md` §5 (cut from the page, wording preserved); `UX.md` §11 — **the three read identically** |
| **B9** disclosure, consent record, renewal notice; no "Start free" | `specs/WL-09` V14–V16b + the nine B9 acceptance criteria; `OFFER.md` §7.1; grep `Start free` returns only prohibitions |

**Consistency lines the reviewer listed separately:** one price ladder and one set of limits — held,
with the GC tier's limits now in the future tense because the tier is not sellable. One activation
definition (`wh347_generated`, first per organisation) — unchanged. No penalty amount, success rate,
accuracy rate, customer count, testimonial, logo or federal seal — unchanged, and `specs/WL-11`'s CI
grep list has gained `Start free` and a hard-coded product name. The landing word-count script now
has a written counting convention (`LANDING_SPEC.md` §2) so it and the budget table cannot disagree.

---

## 6. One thing this iteration did not do, said plainly

**No new evidence was gathered.** Every fix above is a reconciliation between documents that already
existed, or the specification of something already promised. Two consequences worth naming:

1. **The three founder-facing numbers this fleet cannot check remain unchecked** — SF-1444's field
   list (KB-10, `UNVERIFIED`), whether GC portals accept an uploaded PDF (KB Q4, "the highest-value
   unknown in the whole product"), and SAM.gov's real rate limit (KB Q1). They are still open
   questions in `KNOWLEDGE_BASE.md` §11, still marked, and nothing was quietly hardened around them.
2. **One fixture must be captured before WL-13's first commit**:
   `kb-samples/sam-wd-detail-TX20260253-rev0.json`, the superseded revision the reviewer verified
   returns HTTP 200 with a 16,319-byte document. Every offline test for B3 and B4 runs on the mock,
   so without that file the tests that prove the differentiator cannot be written. It is recorded in
   `specs/WL-13`'s test plan.

---

**Iteration author's memory:** [`product/CLAUDE.md`](product/CLAUDE.md) § *"Iteration after review
(2026-09-03)"*.
**Next step:** the wave-1b reviewer re-reads the nine blocking findings against §5's map and signs,
or returns round 2. **B7 and M19 are not this fleet's to close** and are the two lines the reviewer
should route to the Brand Director and the orchestrator rather than back here.
