# StateReady — PERSONA

**Product:** StateReady (working name; see `IDENTITY.md §1` for the naming pass)
**One-liner under test:** *Never let a technician's licence, CE, bond or insurance lapse — and know exactly what it takes to get licensed in your next state.*
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Status:** input to `BACKLOG.md`, `OFFER.md`, `LANDING_SPEC.md`, `IDENTITY.md`, `UX.md`. Binding on all customer-facing copy until the wave-1b reviewer signs or amends it.
**Evidence log:** `identity/sources.md` — 52 rows, every URL, route, HTTP status and grade.

**Amendment rule.** A claim in this file may be changed only by naming a fetched source and what it
supersedes. A preference is not a source. Where this document overrides phase-1 material it says so.

---

## 0. Method, and the one thing that makes this persona hard

The evidence hierarchy is Fitzpatrick's (*The Mom Test*, 2013): **money already spent > behaviour
observed > stated intent**. We have no customers, so the top of the hierarchy is other people's
customers, and the honest reading of what we found is uncomfortable enough to state first:

> **Nobody has shown us a trade contractor paying for licence-tracking software.**
> We have shown that (a) one vendor lists $199–$1,199/month for it, (b) a second lists $99–$499/year
> for the individual-professional version of it, (c) a services industry charges four-figure sums per
> state to do the adjacent work by hand and gets 2.9/5 on Trustpilot for it, and (d) the incumbent
> field-service platforms publish 50-state licensing *content* without shipping a licence *tracker*.
> That is a real market signal. It is not proof of willingness to pay, and this document never
> pretends it is.

The consequence runs through everything downstream: **the offer has to be provable before payment**
(see `OFFER.md`), and the free wedge — a lapse-risk audit of a roster the prospect already has in a
spreadsheet — is not a marketing gimmick, it is the only instrument we have for moving a buyer from
"stated intent" up to "behaviour observed" before we ask for a card.

A second methodological note, because it changes how the copy must be written. The strongest
"cost of a lapse" numbers in the market — $15,000–$25,000 of delayed revenue, $29,700–$84,800 of
annual exposure — come from **the competitor's own marketing page**
([licensedtrades.com](https://licensedtrades.com/), fetched 2026-09-03). They are unaudited. Using
them would put us in the same unfalsifiable-claim contest Clausewright's brand book identified in a
different market, and we would lose it, because they were first. **We do not quote them.** What we
quote instead are statutes, board forms and fee schedules, which are checkable by the reader in
thirty seconds — and which, as §3 shows, are worse than the vendor's numbers anyway.

---

## 1. The three buyers, ranked — and the recommendation

| rank | who | why this rank | what they buy | risk |
|---:|---|---|---|---|
| **1** | **The licensing coordinator** — office manager, HR generalist or ops admin who has inherited the licence calendar at a 15–100-technician HVAC / plumbing / electrical contractor working in 2–6 states | Highest volume of qualified accounts; feels the pain weekly, not quarterly; already does the job manually, so the product replaces a task rather than creating one; the switching cost from a Google Sheet is nearly zero | The **tracker** subscription. Champions it; the owner or GM signs | Not the economic buyer. Every screen and every email must be forwardable to the person who signs |
| **2** | **The integration / operations lead** at a PE-backed home-services platform buying companies in new states | Largest pain per account and a real budget line; every close hands them a new state's rulebook and a 90-day qualifier clock; licence continuity is a **priced** term in their own M&A market (§4) | The tracker at the top tier, plus an **expansion / diligence report** per deal | Long cycle; will ask for SSO, API, multi-entity and a security review on the first call. **Must not be allowed to define the launch product** |
| **3** | **The owner of a growing single-state contractor** planning the next state | Sharpest, most time-boxed need — but it is a *project*, not a *subscription*. They convert on a one-time artefact and may never subscribe | The **state expansion report**, one-time | Churns by design. Valuable as revenue and as the demand-generation surface (§9), not as the retention story |

### The recommendation

> **Build the launch product for buyer 1 — the coordinator at a 15–100-technician, 2–6-state
> contractor — with the owner/GM as the named economic approver on every artefact the coordinator
> touches. Sell buyer 3's expansion report from day one as a self-serve, single-purchase product
> because it needs no new surface area. Serve buyer 2 with the same product plus a CSV export and a
> per-entity view, and do not build SSO, SAML or an API until a platform has paid for the tier that
> promises them.**

Three reasons, each traceable:

1. **Buyer 1 is the only one whose pain recurs on a schedule we can automate.** Texas ACR contractors
   need 8 CE hours *every year* ([TDLR](https://www.tdlr.texas.gov/acr/contractor-renew.htm));
   Illinois plumbers all renew on *the same day, 30 April*
   ([IDPH](https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html));
   New Jersey electrical contractors need 34 hours per three-year cycle by 31 March. A subscription
   is the right shape for a recurring obligation. It is the wrong shape for buyer 3's one-off.
2. **Buyer 2's requirements are a trap at this stage.** The competitor already reserves API and
   SSO/SAML for its $1,199 tier ([licensedtrades.com/pricing](https://licensedtrades.com/pricing)).
   Chasing that on day one buys us an enterprise sales motion, which contradicts `PLAN.md`'s
   self-serve, no-human-loop constraint.
3. **Buyer 3 is the cheapest demand we will ever get.** The expansion question is what people
   actually type into a search box and ask on forums — the Mike Holt thread we opened is literally
   titled *"Multi state licensing help"* and opens *"I am looking to get licensed in multiple states.
   Master/Contractor. I know there are firms out there that help you through the process. Does
   anybody have any recomendations?"* ([forums.mikeholt.com, 18 Nov 2020](https://forums.mikeholt.com/threads/multi-state-licensing-help.2557395/)).
   That is buyer 3 describing the product, unprompted, six years ago, in public, and being answered
   by a peer rather than by a product.

---

## 2. Persona 1 — the licensing coordinator (primary)

### 2.1 Who they are

An operations or office manager at a contractor with 15–100 technicians and branches or work in two
to six states. Titles seen in this market: office manager, operations manager, HR manager,
compliance coordinator, "the person who does the licences". Often the same person who runs payroll,
insurance certificates, fleet registrations and the DOT file. **They are not a compliance
professional.** They inherited the licence calendar because they were organised and someone had to.

The size band is chosen deliberately. Below ~10 licensed people the spreadsheet still works — a
2026 industry roundup puts the break point exactly there: manual tracking *"scales poorly past
roughly ten technicians; at that point the number of staggered expiry dates, CE obligations, and
varying state requirements introduces enough complexity that manual management becomes a real source
of errors"* ([licenseroadmap.com, 30 May 2026](https://licenseroadmap.com/blog/best-contractor-license-tracking-software)).
Above ~100 technicians, a platform-level compliance function or a Harbor-Compliance-style retainer
usually already exists.

The record count is why the spreadsheet breaks. A vendor survey of the HVAC credential landscape
states that *"each technician carries 4-12 active certifications and licenses across federal, state,
and local jurisdictions, each with different renewal cycles"* and that *"the average HVAC company
manages 400-2,000+ credential records across its workforce"*
([oxmaint.com, 9 Feb 2026](https://oxmaint.com/industries/hvac/hvac-technician-certification-license-tracking) —
VENDOR grade; treat the range as indicative, not as a statistic). Even at the conservative end, 30
technicians × 4 credentials is 120 date-bearing rows maintained by hand.

### 2.2 How licences, CE, bonds and insurance are tracked today

Ranked by what the evidence supports, most common first.

| # | Method | What it is, in their words | Where it fails |
|---:|---|---|---|
| 1 | **A shared spreadsheet** | *"The majority of specialty trade shops with fewer than twenty licensed technicians track renewals in a shared Google Sheet, an Excel workbook, a whiteboard, or — at smallest scale — the owner's memory."* ([licenseroadmap.com](https://licenseroadmap.com/blog/best-contractor-license-tracking-software)) | It stores dates. It does not know that Texas needs 8 hours **including one hour of law**, that New Jersey's 10-hour update must be **in a live class**, or that a lapse in one state has a different fee multiplier from a lapse in another |
| 2 | **Calendar reminders** — Outlook/Google events set 30 or 60 days out | Set once, by whoever held the job before | Renewal deadlines *"slip when reminders are sent too late, sent to the wrong person, or buried in an inbox"* ([expiryedge.com](https://expiryedge.com/blogs/preventing-regulatory-fines-centralized-license-tracking/)). The reminder survives the person leaving; the *knowledge* does not |
| 3 | **The FSM platform's custom fields** — ServiceTitan `Settings > Operations > Custom Fields`. Its help centre: *"You can add custom fields to Customer Records, service Location Records, jobs, projects, purchase orders, equipment records, employee settings, and technician settings"* and *"Custom fields show up in Search and can be included in reports"* ([ServiceTitan help](https://help.servicetitan.com/docs/use-custom-fields)) | A field bolted to the tech profile | **There is no date field type.** ServiceTitan's help page lists exactly three: *"Text: Letters, numbers, and symbols"*, *"Dropdown: A list of items to select from"*, *"Numeric: Numbers only"*. An expiry stored here is a **string**. It cannot be sorted, compared or alerted on. ServiceTitan's own licensing content claims the Dispatch Board assigns *"based on technician availability, skill sets, license level, and legal service territory"* and stops there — **it does not claim to track expiries** ([servicetitan.com, 18 May 2026](https://www.servicetitan.com/blog/plumbing-license-reciprocity-by-state)) |
| 4 | **The HR/payroll system.** ADP's own Talent Profile — Certifications API guide (published Mar 2020, last modified Aug 2022) says the APIs *"can be used to track your employee's: Certifications IDs · Certification effective and expiration dates · Certification renewal requirements"*, and adds *"You can also set up custom fields for license information in the ADP Workforce Now user interface by selecting Setup > Tools > Custom Fields"* ([ADP developer docs, PDF](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Talent_Profile_Certifications_API_Guide_for_ADP_Workforce_Now)) | Genuinely a licence register — and the strongest "we already have this" objection we face | It is a **container**, not a rulebook. It stores what someone typed and has no opinion about whether it is what the state requires. Its own Known Issues chapter records that the *"Add and Change API's — Certifications are not throwing any errors when an invalid date format is sent through the request payload"* — i.e. the register will silently accept a wrong date |
| 5 | **A physical file, plus the technician's wallet** | The EPA 608 card lives in the truck | A vendor scenario names the failure exactly: *"Technician's EPA 608 card was left in another vehicle… Even if the tech has the cert, failure to present it triggers enforcement action"* (oxmaint) |
| 6 | **A licence expediter or compliance firm** for the hard parts | Harbor Compliance, API Processing, LicenseLogix, state-local filing shops | See §5. Slow, opaquely priced, and reviewed badly |
| 7 | **The owner's head** | *"the operations manager who 'keeps it all in their head' is one resignation away from a compliance catastrophe"* (oxmaint) | This is the risk the *owner* buys against, and it is the argument the coordinator forwards upstairs |

**The observation that should drive the product.** Every one of methods 1–5 is a place to *store a
date*. None of them is a place to *store a rule*. The date is the easy half and everyone already has
it. The rule — 8 hours, one of which is law, annually, in Texas; 34 hours per three years, ten of
them live, by 31 March, in New Jersey; everyone on 30 April in Illinois — is the half nobody has,
and it is the half that changes without telling you.

### 2.3 The moment of pain

Four moments, in the order the product should be sold against.

1. **A permit is refused, or a job is stopped.** The failure mode is mundane and documented:
   *"Journeyman's state license expired 45 days ago because the renewal notice went to an old
   address. All work performed during the lapse period is technically unlicensed"* (oxmaint).
   In California the consequence is statutory rather than rhetorical: a contractor may not
   *"bring or maintain any action … for the collection of compensation"* unless licensed
   *"at all times during the performance"*, and the customer *"may bring an action … to recover all
   compensation paid to the unlicensed contractor"*
   ([B&P §7031](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7031)).
   From **1 July 2026** the civil penalty floor for unlicensed contracting in California rose to
   *"not less than fifteen hundred dollars ($1,500) nor more than fifteen thousand dollars
   ($15,000)"*, and to $1,500–$30,000 for a licensed contractor who aids unlicensed work
   ([SB 779](https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB779)).
2. **The qualifier leaves.** The single most expensive event in this persona's year, and the one
   nobody has a system for. CSLB's own form: *"The licensee must replace the qualifier within 90 days
   of the disassociation date. Failure to replace the qualifier within 90 days results in the
   automatic suspension of the license or removal of the classification."*
   ([CSLB Disassociation Request, B&P §§7076, 7068.2, 7083](https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf))
   A resignation letter starts a 90-day clock on the **company's** right to work, and today the clock
   is started by an HR event that the licence spreadsheet never hears about.
3. **A general contractor or an insurer asks for the file.** A bid package or an audit needs current
   copies with expiry dates for every credentialed person on the job. Done by hand this is the task
   a vendor describes as *"4-8 hours manually"* (oxmaint). This is the moment the coordinator most
   wants a button.
4. **A technician moves state, or a crew is sent across a line.** Reciprocity is not portability:
   *"Electrical license reciprocity doesn't mean you can automatically work in other states. It just
   means you may be able to bypass certain licensing requirements when applying in a new state"*, and
   licensing is *"decided at the city, county, or state level"*
   ([FieldPulse](https://www.fieldpulse.com/resources/blog/electrical-license-reciprocity-by-state)).

### 2.4 Their week

Monday morning: payroll. Tuesday: certificates of insurance for two GCs. Wednesday: the CE class
someone has to be booked onto before a deadline nobody has written down. Thursday: an apprentice's
hours. Friday: the thing that went wrong.

**Licence work is never their first task and always their most expensive mistake.** Design
consequence: StateReady must be usable in the five minutes between two other jobs, must survive being
ignored for three weeks, and must reach them where they already are — the inbox — rather than
requiring a habit of logging in.

---

## 3. What it actually costs — the numbers we are allowed to use

Every figure below was fetched from the issuing body or from a published fee breakdown, and every one
is checkable by the reader. This table is the evidence base for `OFFER.md` and for the landing page.
**Nothing from a competitor's marketing page appears in it.**

| Cost | Figure | Source |
|---|---|---|
| California unlicensed contracting, civil penalty | **$1,500 minimum – $15,000 maximum**, from 1 July 2026 | [SB 779](https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB779) |
| California, licensed contractor aiding unlicensed work (§§7110, 7114, 7118, 7125.4) | **$1,500 – $30,000** | SB 779 |
| California compensation for work done while unlicensed | **No action may be brought to collect it**; the customer may recover **all compensation already paid** | [B&P §7031](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7031) |
| California qualifier not replaced | **Automatic suspension of the licence** after 90 days | [CSLB form](https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf) |
| Texas ACR licence expired < 90 days | Renewal fee **× 1.5** | [TDLR](https://www.tdlr.texas.gov/acr/contractor-renew.htm) |
| Texas ACR licence expired 90 days – 18 months | Renewal fee **× 2** | TDLR |
| Texas ACR licence expired 18 months – 3 years | **× 2 plus written approval of the executive director** | TDLR |
| Texas ACR annual CE | **8 hours a year, including one hour of Texas law and rules** | TDLR |
| New Jersey electrical contractor CE | **34 hours per 3-year cycle by 31 March**, of which the **10-hour update must be taken in a live class** | [forums.mikeholt.com, Mar 2023, quoting mikeholt.com](https://forums.mikeholt.com/threads/nj-ceu%E2%80%99s.2573033/) |
| Illinois plumber renewal | **Every 30 April**, for everyone | [IDPH](https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html) |
| New-state application, government fees only | **$75** (NC) to **$450** (CA) application; CA adds $200 issuance + $49 fingerprinting; AZ $127 exams + $580 issuance + $67 fingerprinting | [gettradelicense.com](https://www.gettradelicense.com/blog/contractor-license-cost) |
| Renewal fees | **$75–$600 every 1–2 years**; CA $450 / 2 yr, NV $600 / 2 yr, AL $163 / yr | gettradelicense.com |
| CE cost | **$100–$300 per cycle**, requirements **4–17 hours per year** depending on state | gettradelicense.com |
| Surety bond premium | **1–5% of the bond amount** annually | gettradelicense.com |
| Doing it through a service | **4 to 8 weeks**, price "call for quote" | [API Processing](https://apiprocessing.com/nationwide-contractor-licensing/) |
| Permit expediting, for comparison | **$500–$2,500** residential, **$1,500–$5,000** commercial, **$1,000–$3,500 per location** on multi-site rollouts | [PermitPlace](https://permitplace.com/permit-expediter-cost-guide/) |

**`UNVERIFIED — DO NOT PRINT.`** The $44,539/day EPA Section 608 civil penalty circulates widely in
vendor content and appeared in our searches. epa.gov's penalty-adjustment page returned 404 from this
session (`identity/sources.md` row 22). **It must not appear on any StateReady surface until an
agent has opened a .gov source for it.** The same applies to every "cost of a lapse" figure on
licensedtrades.com.

---

## 4. Persona 2 — the integration / operations lead at a PE-backed platform

### 4.1 Who they are

Director of Integration, VP of Operations, or a shared-services compliance manager at a platform that
buys HVAC / plumbing / electrical / roofing / fire businesses. The scale in
`phase-3-acquisition/prospects/stateready/README.md` is the brief: Apex Service Partners at roughly
107 brands across 46 states with about 60 add-ons in 2025; Service Logic at 140+ locations and 5,000+
technicians; Pye-Barker across 47 states; TurnPoint at 54 brands in 28 states. An independent tracker
counts **13 active plumbing roll-up platforms** with publicly disclosed 2024–2026 deals
([ctacquisitions.com](https://ctacquisitions.com/plumbing-pe-rollup-tracker-2026/)).

**Every close hands this person a new state's rulebook and a set of licences held by people who have
just been given liquidity.**

### 4.2 Why licensing is a *priced* problem for them, not an admin problem

This is the finding that makes persona 2 worth building for, and it is not our claim — it is their
own market's:

- *"State mechanical licensing (CSLB C-20 in California, TDLR in Texas, Florida CMC) is a transferable
  asset that buyers actively diligence."*
- *"License does not transfer with sale; buyer must have a qualifying RMO/RME or hire one within 90
  days per CSLB Business and Professions Code Section 7068."*
- *"A muddy plan (owner is the sole qualifier with no successor) compresses the multiple and may
  require an earn-out structure."* — quantified in the same guide at **0.5× to 1.5× EBITDA**.
  ([ctacquisitions.com, commercial HVAC valuation guide](https://ctacquisitions.com/guides/commercial-hvac-business-valuation/))

And the mechanics that make it unavoidable:

- *"Unlike most business licenses, contractor licenses are tied to specific individuals and cannot be
  assigned."*
- *"An RMO or RME can qualify only one license at a time with certain narrow exceptions."* — so one
  qualifier cannot be spread across a platform's newly acquired entities.
- In an asset deal, the new entity *"must apply for a new license from scratch… During this period,
  the new entity cannot legally perform licensed contracting work in California."*
  ([acquisitionstars.com](https://acquisitionstars.com/blog/contractor-license-transfer-state-construction-ma))

### 4.3 What they need that persona 1 does not

Per-entity roll-up (one platform, N operating companies, N sets of licences); a diligence view they
can hand to a deal team before close; a 90-day qualifier clock that starts from an HR event; CSV/PDF
export for the data room. **What they will ask for and should not get in v1:** SSO/SAML, an API,
custom roles, a signed BAA-equivalent, a security questionnaire. Those live behind a tier we sell
after the first platform pays.

### 4.4 Why they are rank 2, not rank 1

They are a *small number of large logos with a procurement process*. `PLAN.md` commits this app to
self-serve Stripe checkout with no human loop in the product. A launch aimed at persona 2 breaks that
commitment on the first call. The right sequence is: win coordinators, let the platform's own
operating brands become references, then sell upward.

---

## 5. Persona 3 — the owner planning the next state

An owner-operator with 5–25 technicians, licensed in one state, who has just been asked to bid work
across a line, or has followed a builder, or is chasing storm work. They are not shopping for
software. They are trying to answer one question — *what does it take to work in that state, and how
long?* — and today they answer it by asking peers or paying someone.

What the paid answer costs and how well it goes:

- **API Processing**: applications, reciprocity, NASCLA, transfers, endorsements, qualifier changes.
  *"On average, the process takes 4 to 8 weeks."* Price: *"Call for quote"* —
  *"Costs vary depending on your license type and personal history."*
  ([apiprocessing.com](https://apiprocessing.com/nationwide-contractor-licensing/))
- **Harbor Compliance**: *"Compliance Core™: The #1 Nationwide Licensing Database"*, managed licensing,
  qualifier licences, registered agent. No published price:
  *"Filing fees depend on your individual situation."*
  ([harborcompliance.com](https://www.harborcompliance.com/compliance-solutions-construction-firms))
  **Trustpilot: 2.9 out of 5 from 52 reviews — 57% five-star and 31% one-star**, a bimodal
  distribution that is itself the story. Verbatim, no names:
  *"Cannot reach a human being on the phone, only an AI bot who repeats herself"* (4 Mar 2026);
  *"They don't answer in a timely manner. Charge WAY too much for their services"* (18 Feb 2026);
  *"Harbor routinely dropped the ball on completing work for which we had paid them"* (20 Aug 2026);
  *"Cancellation is Intentionally Impossible"* (3 Dec 2025).
  ([trustpilot.com/review/harborcompliance.com](https://www.trustpilot.com/review/harborcompliance.com))
- **A peer on a forum**, free, and better than either — which is the competitor we should worry about.

**Correction to phase 1, on the record.** `raw-ideas.json` (StateSwitch) cites a BBB profile as
evidence that a paid incumbent takes "10 months" and uses "outdated forms". Re-checked at the source
on 2026-09-03: the profile shows an **A+ rating and no visible complaint text**, and the complaints
sub-page is behind Cloudflare. **That claim is withdrawn and does not appear anywhere in StateReady's
materials.** The Harbor Compliance Trustpilot page above is the substitute, and it was opened.

**What persona 3 buys:** the **state expansion report** — one state, one trade, one company profile:
what licence class, which exam and whether reciprocity waives it, bond amount, insurance minimums,
who can qualify, what it costs, how long it takes, what to do first. Anchored against the $500–$2,500
expediting band and the 4–8-week service turnaround, priced as a same-day self-serve artefact.

---

## 6. What public reviews and forums actually say

### 6.1 About LicensedTrades.com — the direct competitor

**We found no public reviews of it at all.** Not on Trustpilot (403 to our fetch, and no indexed
profile), not on the BBB, not in any forum thread we could open, and not in any search result. What
we did find is that the one prominent "Best contractor license tracking software (2026)" round-up
that ranks it, [licenseroadmap.com](https://licenseroadmap.com/blog/best-contractor-license-tracking-software),
reproduces its four prices and its "two months free" annual line **while contradicting its own
published tier caps** (40 technicians / 5 seats versus the vendor page's 50 employees / 10 seats).
The reasonable reading is that it is the same operator's content marketing, not an independent review.

**Two consequences, both binding.**
1. **The $199–$1,199 band is a list price, not a demand signal.** It tells us what one operator thinks
   the market will bear. It is not evidence that anyone has paid it. Every downstream document must
   say "listed at" and never "the market pays".
2. **There is a review vacuum, and vacuums get filled by whoever shows up first.** A competitor with
   published prices, no reviews and no visible customers is beatable on *proof*, which is exactly the
   axis a new entrant can win: a public methodology, a source and a date on every rule, and a free
   audit whose output the prospect can check against their own state board in five minutes.

### 6.2 About expediting and licence services

Covered in §5. The pattern across API Processing, Harbor Compliance and the wider category is
consistent and exploitable: **opaque pricing, four-to-eight-week turnarounds, and a bimodal review
profile where a third of customers are actively angry about responsiveness and cost.** The complaint
is never "the information was wrong". It is always "I could not get an answer and it cost too much".

That is a precise brief for a product: **publish the price, answer instantly, show your work.**

### 6.3 What the forums say

The Mike Holt forum (the one major trade forum that let us in; HVAC-Talk, PlumbingZone and
ContractorTalk all sit behind a bot wall — `identity/sources.md` rows 18–20) is where the vocabulary
and the emotional register live. From *"Multi state licensing help"*
([18 Nov 2020](https://forums.mikeholt.com/threads/multi-state-licensing-help.2557395/)), quoted
verbatim and without attributing anything to a named person:

- The opening ask, which is the product brief in one sentence: *"I am looking to get licensed in
  multiple states. Master/Contractor. I know there are firms out there that help you through the
  process. Does anybody have any recomendations?"*
- On reciprocity, from a member who says he *"managed a state electrical licensing agency"*:
  *"At the master level there are very few reciprocity agreements so for many you will need to take
  the exam(s)."*
- On the boards themselves: *"Some states are very friendly and helpful with the process and
  questions, some would sooner spit on you than be of any help."*
- On why a database beats a guess: *"Do not assume that just because some states use the same exam
  company the the exam will be the same among states as they are often custom for each state."*
- On the shape of the work: *"Many states will require separate master and contractor exams and
  applications."*
- On insurance, which is why StateReady tracks it next to licences: *"in most states, at the
  contractor level you will need to show proof of insurance so you will need a carrier that can write
  policies in every state you are looking at."*
- On timelines, which is why the expansion report leads with elapsed time: *"Some states can be done
  in a matter of days or weeks while some may take months to get trough the process."*
- On grandfathered credentials: *"Your grandfathered city license will not be acceptable for any state
  that I know of."*
- And the sentence that justifies the whole product: *"The best course is to study very carefully the
  states web sites and learn every detail you can before reaching out to them."*

Two more, because they show the *rate of change* the product exists to absorb:

- *"At its March 2025 board meeting, the Contractors State License Board approved the National
  Association of State Contractors Licensing Agencies (NASCLA) Commercial General Building Contractor
  license examination, for CSLB reciprocity purposes."*
  ([25 Apr 2025](https://forums.mikeholt.com/threads/california-contractors-state-license-board-reciprocity.2586884/);
  corroborated at [CSLB](https://www2.cslb.ca.gov/Contractors/Applicants/Reciprocity/Reciprocity_Requirements.aspx))
- On New Jersey CE, the detail that spreadsheets cannot hold: *"New Jersey requires the 10-Hour Code
  Update and NJ rules to be completed in a live class"*, and from a peer, *"The 24 hours can be online
  but for some reason that no one seem to know the 9 hours of 2023 update and one hour of law have to
  be done in person."* ([Mar 2023](https://forums.mikeholt.com/threads/nj-ceu%E2%80%99s.2573033/))

**Tone note for all copy.** These are people who correct each other's facts and who type "recip",
"CEUs", "NASCLA" and "the board" without expanding them. They do not respond to enthusiasm. They
respond to someone who has clearly read the statute.

---

## 7. Vocabulary — verbatim, with the source that used the word

Use the left column. Never use the right column.

| Say this | Because it was used here | Never say |
|---|---|---|
| **licence / license** (the credential), **classification** (what it lets you do) | CSLB, TDLR, NASCLA all use both | "certification" as a synonym for licence |
| **qualifier**, **qualifying individual**, **RMO**, **RME**, **RMM**, **RMG** | [CSLB Disassociation Request](https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf); Harbor Compliance's "qualifier licenses" | "licence owner", "responsible person" |
| **disassociation** | CSLB form title | "departure", "offboarding" |
| **reciprocity**, **recip** | Mike Holt threads; CSLB *Reciprocity Requirements* | "transfer" (it is not one) |
| **endorsement** | [ServiceTitan, 18 May 2026](https://www.servicetitan.com/blog/plumbing-license-reciprocity-by-state) — distinguished from reciprocity | using it interchangeably with reciprocity |
| **CE**, **CEUs**, **CE hours**, **cycle** | TDLR; Mike Holt NJ thread | "training", "learning" |
| **the board** | Mike Holt threads throughout | "the regulator", "the authority" |
| **journeyman**, **master**, **apprentice** | ServiceTitan licensing content; Mike Holt | "junior/senior technician" |
| **NASCLA**, **NASCLA-accredited exam** | [nascla.org](https://www.nascla.org/) | "national licence" — there is none |
| **business and law exam**, **law portion** | API Processing; contractorlicenserequirements.com | "the theory paper" |
| **surety bond**, **bond amount**, **premium** | gettradelicense.com | "insurance bond" |
| **certificate of insurance**, **COI**, **general liability**, **workers' comp** | gettradelicense.com; Mike Holt ("proof of insurance") | "cover note" |
| **EPA 608**, **NATE**, **backflow**, **medical gas**, **low voltage** | oxmaint credential taxonomy; Housecall Pro | "green card", "refrigerant ticket" |
| **ACR** (Texas), **C-20** (California), **CMC** (Florida) | [TDLR](https://www.tdlr.texas.gov/acr/contractor-renew.htm); [ctacquisitions](https://ctacquisitions.com/guides/commercial-hvac-business-valuation/) | spelling out the state's own shorthand back at them |
| **pull a permit**, **stop-work order**, **bid package** | oxmaint; Housecall Pro licensing content | "obtain authorisation" |
| **good standing**, **active**, **inactive**, **suspended**, **expired**, **lapsed**, **reinstatement** | CSLB; TDLR; Harbor Compliance | "invalid", "broken" |
| **renewal window**, **late renewal**, **grace period** | TDLR fee multipliers | "overdue" |
| **technician**, **tech**, **the field**, **the office**, **the shop** | throughout the forums and vendor content | "employee", "resource", "user" |

**House rule on spelling.** The market is US. Product UI, emails and landing copy use **license**.
This repository's internal documents use British spelling ("licence") per the fleet's house style;
the two must not be mixed inside a single artefact. `UX.md §0` restates this as a build constraint.

---

## 8. Jobs to be done

Written in Christensen's job form — *when [situation], I want to [motivation], so I can [outcome]* —
and each mapped to the artefact that does it. If a backlog item does not serve a job here, it is not
MVP.

| # | Job | Artefact |
|---:|---|---|
| **J1** | When I take over the licence file from whoever had it before, I want to see everything that is wrong with it in one screen, so I can find out what I have inherited before it finds me. | Onboarding import → **readiness map + exception list** |
| **J2** | When something is 90 days from expiring, I want to be told without logging in, so I never have to remember to look. | **Email alerts at 90 / 60 / 30 / 7 days** |
| **J3** | When a technician needs CE, I want to know how many hours, of what kind, in what format, by when, so I can book the right class the first time. | **CE progress meter with the rule attached** |
| **J4** | When a GC or an insurer asks for our compliance file, I want to produce it in one click, so I stop losing an afternoon to it. | **Bid-ready compliance PDF** |
| **J5** | When my boss asks "are we covered in Ohio?", I want to answer in five seconds with something I can forward, so I look like I have this handled. | **Readiness map, shareable read-only link** |
| **J6** | When our qualifier resigns, I want a clock and a checklist to start immediately, so a resignation does not become a suspension. | **Qualifier watch — 90-day clock** |
| **J7** | When we are asked to bid in a state we are not licensed in, I want to know what it takes and how long, so I can tell the owner yes or no this week rather than next month. | **State expansion report** (one-time purchase) |
| **J8** | When a state changes a rule, I want to hear it from the system rather than from an inspector. | **Rule-change alert on tracked states** |
| **J9** | When we close an acquisition, I want the target's licences in the same view as ours within a day, so integration does not start with a spreadsheet merge. | **Per-entity roll-up + CSV import** (persona 2) |
| **J10** | When a technician is standing in front of an inspector, I want them to be able to show a current credential from their phone, so a card left in another truck is not a violation. | **Read-only mobile licence card** (§11) |

---

## 9. How they discover and buy

**Discovery, ranked by what the evidence supports.**

1. **A peer.** The forum thread is the archetype: a question, and three practitioners answering it for
   free. Everything in the acquisition plan that involves being useful in public without a link
   attached is aimed here.
2. **Search, at the moment of the project.** Persona 3 types the question. The volume of published
   50-state guides — by Housecall Pro, ServiceTitan, FieldPulse, FieldEdge, Jobber and a dozen exam-prep
   schools — is itself the proof that the search demand exists and that **the incumbents monetise it
   with content rather than with a product**.
3. **Trade shows and peer/buying groups.** *"Most plumbing contractors pick their next software,
   supplier, or fleet provider after a 10-minute conversation at a plumbing trade show"*
   ([withorbital.com](https://www.withorbital.com/blog/top-10-us-plumbing-conferences-2026)). Same
   source, attendance bands: ServiceTitan Pantheon 2,000–5,000 contractors; MCAA Convention
   2,000–5,000 mechanical executives; PHCC Connect 500–1,000; Nexstar Network Super Meeting 500–1,000.
   These are the channel rows already in `phase-3-acquisition/prospects/stateready/prospects.csv`.
4. **The platform above them.** For persona 2's operating brands, the buying decision can be made once
   at the platform and pushed down — which is the single highest-leverage motion in the whole file and
   the reason the prospects list is weighted toward platforms.

**The buying process, and what it implies for the product.**

- **Decision maker:** the **owner, GM or CFO** signs. The **coordinator** chooses and champions. At a
  PE platform, the **VP of Operations / Integration** signs within a budget already set.
- **Therefore every artefact must be forwardable.** The readiness map, the alert email and the audit
  report each have to make sense to someone who has never logged in, because that is how they will be
  read. This is a design requirement, not a nice-to-have: see `UX.md §7`.
- **Trial expectations.** The market has set them and they are short. Jobber: **14 days, no credit
  card** ([getjobber.com/pricing](https://www.getjobber.com/pricing/)). LicensedTrades:
  **3-day trial, no credit card** ([licensedtrades.com/pricing](https://licensedtrades.com/pricing)).
  StateRequirement: **7-day trial**, but with *"Our representative will reach out for a quick call"*
  ([staterequirement.com](https://staterequirement.com/license-alert/)) — a human loop we are
  forbidden to copy and would not want to.
  **The persona finding is that the buyer arrives expecting a free trial**, because that is the norm
  across every piece of software in their stack. The persona-led recommendation is therefore
  **14 days, no credit card, no call** — the most generous self-serve norm in the buyer's own stack,
  and 11 days more than the direct competitor.
  > **Resolved (D1, wave-1b review, 2026-09-03 — `REVIEW.md` §1, applied per `REVIEW_RESPONSE.md`).**
  > The persona finding recorded here **won**. `OFFER.md` §8's $149 First State Audit is deferred to
  > iteration 2 and the launch model is a **14-day free trial, no credit card, no call, for the first
  > 100 signups** — the buyer's own norm, and eleven days more than the direct competitor.
  >
  > It was not decided on the persona's expectation alone, which would not have been enough to
  > overturn an offer decision inside the Offer agent's remit. It was decided on two things this
  > document cannot see: the audit's deliverable is a **built roster pulled from fifteen states'
  > public registers**, which nobody in the fleet has established can be automated — so it
  > reintroduces the human loop `PLAN.md`'s Goal forbids; and payment-before-activation **collapses
  > `THRESHOLDS.md` T2 by construction**, replacing a pre-committed band with one that has no
  > comparator behind it. The audit returns if the register-ingestion spike (`BACKLOG.md` S10) passes.
  >
  > Two consequences this section flagged, and where each landed:
  > **(a)** *"the landing page must answer 'why is there no free trial?' in the same viewport as the
  > price"* — moot; there **is** a free trial, and the page's job is now the simpler one of saying
  > "no card" plainly. **(b)** *"`UX.md` §2 keeps the free lapse-risk audit so there is still a
  > zero-risk way in"* — the zero-risk way in is now the **no-login State Rulebook demo** (D2), which
  > gives the diagnosis without asking for a roster of technician names before an account exists. The
  > free audit stays a SHOULD (`BACKLOG.md` S8).

- **Price anchors, in the order the buyer meets them.**

| Anchor | Price | What it teaches the buyer |
|---|---|---|
| Jobber Core → Plus | **$49 / $139 / $199 / $499 per month** monthly; $29 / $99 / $149 / $399 annual; **$29 per extra user**; 14-day free trial | This is what "software for my shop" costs. **$199/month is a familiar number.** |
| ServiceTitan | **Unpublished** — "Request Pricing", "per-technician pricing", "over 100,000 contractors" | Serious software costs enough that you have to ask. Also: **publishing a price is itself a differentiator** |
| LicensedTrades (direct) | **$199 / $349 / $599 / $1,199 per month**; 5 / 15 / 50 / unlimited employees; 1 / 3 / unlimited / unlimited states; +$15/mo per extra seat | The category's list price — see §6.1 on what it does and does not prove |
| StateRequirement License Alert | **$99 / $299 / $499 per year** for 1 / 5 / 10 licences | The *individual professional's* price for the same alert cadence. A 20-tech shop doing the maths per head gets to ~$2,000/yr — i.e. **$165/month** |
| A licence service, per state | **"Call for quote"**, 4–8 weeks | Anything self-serve and instant is competing with an unpriced, slow alternative |
| Permit expediting, per project | **$500–$2,500** residential, **$1,500–$5,000** commercial | A four-figure one-off for a single jurisdictional problem is normal in this buyer's budget. **This is the anchor for the expansion report** |
| Government fees for one new state | **$75–$450** application, plus $200–$580 issuance, plus $40–$70 fingerprinting, plus bond premium at 1–5% | The expansion report must cost less than the fees it helps you not waste |

**Implication for `OFFER.md`, stated as a recommendation and not a decision:** a tracker priced in the
**$149–$399/month** band undercuts the direct competitor at every comparable tier while sitting inside
the range the buyer already pays Jobber, and an expansion report at **$450–$900** sits below the
residential expediting floor. Both must be published prices with a Stripe checkout, because §6.2 says
the incumbents' worst-reviewed attribute is exactly that they will not tell you the price.

---

## 10. Objections, and the honest answer to each

Ordered by how often we expect to meet them. The answer column is what the product must *do*, not
what the copy should *say*.

| # | Objection | The honest answer |
|---:|---|---|
| **O1** | *"Housecall Pro already does this."* Their own page: *"built-in tools to store documents, track expiration dates, and set automatic renewal reminders"* ([housecallpro.com](https://www.housecallpro.com/licensing/hvac/)) | **True, and it is the strongest objection we face.** The difference is that they store the date you type; we hold the rule behind it. HCP cannot tell you that Texas needs one of its eight hours to be law, that New Jersey's ten hours must be live, or that a CSLB disassociation starts a 90-day clock on the company's licence. **Demonstrate, do not argue:** the free audit reads their exported list and returns rules they did not have. |
| **O2** | *"We track it in ADP / Paychex."* ADP's Licenses and Certifications report is real | Same answer, sharper: a register is not a rulebook. Also — **integrate rather than displace.** CSV import, not migration. |
| **O3** | *"We use ServiceTitan; can't we just add a custom field?"* You can ([ST help](https://help.servicetitan.com/docs/use-custom-fields)) | Yes, and many do — but ServiceTitan's custom fields come in exactly three types, **Text, Dropdown and Numeric**. There is no date type, so an expiry lives there as a string that cannot be sorted, compared or alerted on. It also does not compute a CE cycle or know a state's late-renewal multiplier. ServiceTitan's own content claims dispatch-time licence *awareness*, not expiry tracking. |
| **O4** | *"How do I know your data is right?"* | The only defensible answer is structural: **every rule carries `source_url`, `last_verified`, `verified_by` (two agents) and a `confidence`** (`PLAN.md` A10), and the source link is **on screen next to the rule**, not in a footer. If we cannot show the source, we show "not verified" instead of a value. |
| **O5** | *"We're too small for this."* | Then say so and let them leave. The honest threshold is roughly ten licensed people ([licenseroadmap.com](https://licenseroadmap.com/blog/best-contractor-license-tracking-software)); below it a spreadsheet genuinely works. A pricing page that names its own lower bound buys more trust than one that does not. |
| **O6** | *"We only work in one state."* | The single-state shop is persona 3, and the product for them is the **expansion report**, not the subscription. Selling them a tracker is how we earn a refund request. |
| **O7** | *"Getting our data in will take a week."* | **The onboarding budget is ten minutes** and it is a hard design constraint (`UX.md §3`). CSV in the shape they already have, plus manual entry for shops with twelve technicians and no export. |
| **O8** | *"What happens if you get a rule wrong and we get fined?"* | We are an information product, not a filing agent or a law firm. That must be said plainly on screen — not buried in terms — alongside the source link that lets them check. `PLAN.md` §6 already commits to disclaimers on every screen and document. |
| **O9** | *"Who are you? I've never heard of you."* | We have no logos and no customer count, and inventing either is how a compliance brand dies. Substitute checkable proof for social proof: published methodology, sources with dates, a free audit whose output can be verified against the state board in five minutes. |
| **O10** | *"Our lawyer / Harbor Compliance handles this."* | They handle *filing*. We handle *knowing* — continuously, for everyone, between filings. And the category's own review profile (§5) says the retained-service experience is the weak point, not the filing. |
| **O11** | *"My techs won't use another app."* | They will not have to. **There is no technician app** (§11). Technicians receive email, and a link to a read-only card. |

---

## 11. Mobile versus desktop — the decision

> **The launch product serves the coordinator at a desk. The technician gets email and one read-only
> page. There is no technician app, no technician login and no push notification in v1.**

**Why.**

1. **Only the coordinator can act.** Every job in §8 except J10 is an office action — importing a
   roster, booking a CE class, producing a bid PDF, starting a qualifier clock. A technician cannot
   renew someone else's licence.
2. **A technician-facing app multiplies onboarding cost by headcount** and breaks the ten-minute
   onboarding budget (O7), which is the constraint most likely to decide whether a trial converts.
3. **The mobile need that is real is read-only.** A card left in the wrong truck is a live enforcement
   risk in this market (oxmaint's scenario, §2.2). That is solved by a URL, not by an application.

**What ships anyway, and must be built mobile-first:**

- **Every alert email** — because it will be opened on a phone in a truck or a car park. Single column,
  ≥16px, the state and the deadline in the subject line, and one link.
- **The read-only licence card** at a per-technician tokenised URL: name, credential, number, state,
  status, expiry, issuing board, and a "verify at the board" link. Rendered as a card, printable,
  works at 320px, no login. Sent to the technician by email; they keep it in their browser or add it
  to their phone's home screen.
- **The shareable readiness link** for J5, because the GM will open it on a phone.

**What is desktop-first and unapologetically so:** import, the roster table, the readiness map, the CE
manager, the report builder. These are two-hand, wide-screen tasks. Making them work at 375px would
cost more than it returns and would compromise the screen the buyer actually judges us on.

**Revisit trigger, written down now so it is not a matter of opinion later:** if more than 25% of
sessions on the dashboard originate from a mobile user-agent in the first 90 days, this decision is
re-opened.

---

## 12. Trust signals — what earns belief, in order

We have no customers, no logos and no audited numbers. That is the constraint, and pretending
otherwise is the fastest way to lose a compliance buyer. Ranked by how much belief each buys per unit
of effort:

1. **The source link next to the rule.** A CSLB URL and a "verified 3 Sep 2026" stamp beside the
   90-day qualifier clock is worth more than any testimonial, because the reader can check it now.
2. **A published price with a checkout.** The two most-complained-about incumbents in this market both
   hide their price (§5, §6.2). Publishing ours is a differentiator we get for free.
3. **A stated coverage boundary.** "HVAC, plumbing and electrical, in these 15 states, at this date"
   (`PLAN.md` A11) beats "all 50 states" that turns out to be thin. Naming what we do *not* cover is
   the cheapest credibility in a regulatory category.
4. **A visible last-verified date on every rule, and a visible change log when one moves.** The CSLB
   NASCLA change of March 2025 is the worked example: a product that told its Californian customers
   about it that month is a product worth paying for.
5. **The free audit's output being checkable.** If a coordinator can take three of our findings to
   their state board's website and confirm them, we have converted proof into trust without a claim.
6. **Plain refusal.** When we do not have a rule, we say "not covered" rather than guessing. Every
   agent building this product should treat a fabricated CE hour count as a P0 incident.
7. **A named legal entity, a real address and a support email** on every page (`PLAN.md` P10).
8. **Customer logos and counts — later, and only real ones.** They rank last not because they do not
   work, but because we do not have them, and the first six are available today.

---

## 13. What we do not know — open questions for the founder and the wave-1b reviewer

| # | Question | Why it matters | Cheapest way to answer |
|---:|---|---|---|
| Q1 | **Does anyone actually pay for licence tracking?** We found list prices, never a paying customer, a case study or a review. | It is the load-bearing assumption of the whole subscription. | The free audit *is* the experiment. Instrument it: how many uploaded rosters, how many exceptions found, how many convert. Pre-commit a threshold in `THRESHOLDS.md`. |
| Q2 | **Coordinator or owner — who actually signs at 15–100 technicians?** We inferred it; we did not observe it. | Decides whether the landing page argues to a user or to a buyer. | Ask in the outbound reply flow: "who else needs to see this?" Log the answer in the CRM. |
| Q3 | **Is the expansion report a $450 product or a $1,500 product?** The anchors span $500–$5,000 and none of them is for exactly this artefact. | It is the fastest revenue in the plan. | Price test two numbers on the same page from week one. |
| Q4 | **How many states does a typical target actually operate in?** Our list skews to platforms in 20–47 states; the coordinator persona assumes 2–6. | It sets the tier boundaries and the map's default zoom. | Countable from `prospects.csv` for the platform rows; must be asked for the independents. |
| Q5 | **Does a NASCLA electrical accredited exam programme exist, and which agencies accept it?** The commercial-exam page lists 20 agencies; the electrical equivalent 404'd. | Electrical is one of our three launch trades and reciprocity is the expansion report's spine. | Product Owner to open nascla.org's exam navigation directly. |
| Q6 | **Will a PE platform buy a tool their operating brands already use, or insist on their own?** | Decides whether persona 2 is a land-and-expand motion or a top-down one. | Ask on the first platform reply. Do not build for it beforehand. |
| Q7 | **Trademark clearance for the chosen name.** No USPTO endpoint was reachable from this container (`identity/sources.md` row 48). | Naming is a founder decision with legal consequence. | Founder runs a knock-out search at tmsearch.uspto.gov before any spend on the name. |
| Q8 | **Is the EPA 608 penalty figure real?** epa.gov 404'd. | It is the most quotable number in the category and we are currently forbidden to use it. | One agent, one .gov fetch. Until then it stays out of every surface. |

---

## 14. Self-review against this document

Run before hand-off, per `PIPELINE.md` stage 4.

- [x] Every load-bearing claim has a URL that was fetched today, logged in `identity/sources.md`.
- [x] No private individual is named. Forum material is quoted as words, never attributed to a person.
- [x] Competitor marketing figures are labelled as such and excluded from §3.
- [x] The phase-1 BBB claim was re-checked and **withdrawn in writing** (§5).
- [x] The EPA figure is marked `UNVERIFIED — DO NOT PRINT` and appears nowhere else.
- [x] Blocked sources are named with the number of attempts (`identity/sources.md` rows 18–20, 36, 38, 46, 48).
- [x] A primary buyer is recommended, with reasons, not hedged across three.
- [x] The mobile/desktop question is decided, with a written revisit trigger.
- [x] Every job in §8 maps to an artefact; every objection in §10 maps to a product behaviour.
- [x] Open questions are listed rather than papered over.
