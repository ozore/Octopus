# DRAFT — founder review required, nothing auto-sent

# Partner Cold Outreach Sequences

**Status:** DRAFT. Every message below is a template for a human to personalise, edit, and send by hand. **No file in this repository has a sending mechanism. Nothing here has been sent.** A partner row moves to `contacted` in `crm/partners.csv` only after the founder has personally read and sent the message (`CRM.md §2.1` stage 4).
**Owner:** Outreach copywriter (agent), Phase 3.
**Date:** 2026-08-13.
**Governs:** the Business Development pipeline — `IDEA_DOSSIER.md §4.3` / `03-gtm-pricing.md §4.3` **reserve channel #1** (Bullseye 18/25; seed day 1, revenue day 60+; best long-run CAC at ~$40–60 because each partner aggregates many suspension events).

**Binding sources:** `IDEA_DOSSIER.md` (D8, §6.6 unit economics); `03-gtm-pricing.md §4.3–4.4`; `BRAND.md` §2 voice, §3 messaging hierarchy, §4 copy do/don't, §5 naming; `research/partners.md` (every prospect, every source URL); `crm/CRM.md` §2 (stages), §2.3 (the three offer shapes), §4.3 (follow-up ceiling), §6.3 (the six checks).

---

## 0. Four rules that govern every message in this file

**Rule 1 — BD is the reserve channel, and the copy should read like it.**
D8 puts Community (21/25) and Engineering-as-Marketing (22/25) as the entire path to the first ten customers. BD produces revenue at day 60+. Nothing in these sequences may create urgency, because there is none: a partner who replies in six weeks is on schedule. Manufactured urgency here would violate `BRAND.md §2.5` *and* misrepresent our own plan.

**Rule 2 — where a partner program exists, the program replaces the cold email entirely.**
Per `research/partners.md` compliance note 3 and Ross's *Predictable Revenue* channel-partner logic (use the process the partner already runs), these prospects are **not** cold-emailed:

| Partner | Their own published channel | Use this instead |
|---|---|---|
| Seller Snap | [sellersnap.io/partner-apply](https://sellersnap.io/partner-apply/) | The application form. Sequence 4's Touch 1 body becomes the form's free-text field. |
| BQool | [bqool.com/partners](https://www.bqool.com/partners/) | The partner-ecosystem page's stated route. |
| SmartScout | published support address (support@smartscout.com) | A single message via the published support address, routed by them. |

**Rule 3 — the cadence is three touches, then stop.**
Ross's classic outbound cadence is tighter than this. It is deliberately slowed to `CRM.md §4.3`, which is binding: *one follow-up permitted, no sooner than 14 days after the first message; two follow-ups is the ceiling; after that the row ages to `dormant` and is not re-contacted this cycle.*

| Touch | Timing | Job | Ask |
|---|---|---|---|
| **1** | Day 0 | Say who we are, why *them* specifically, and make one small ask | 15 minutes, or a yes/no |
| **2** | Day +14 minimum | Add one piece of new value they can use whether or not they reply | Same ask, smaller |
| **3** | Day +28 minimum | Close the loop honestly and stop | Permission to stop, or a redirect to the right person |

No fourth touch. A row with no reply 8 weeks after Touch 1 moves to `dormant` (`CRM.md §4.3`). **Any opt-out is honoured permanently and immediately — the row moves to `excluded` and is never contacted again**, including through a different channel or a different sequence.

**Rule 4 — every message carries the CAN-SPAM block in §1 and passes the six checks in `CRM.md §6.3`.**

**Rule 5 — the Shield adverse-selection control (M1) survives into partner copy.**
`IDEA_DOSSIER §6.4` M1 is explicit: Shield is never sold to an already-suspended account except post-reinstatement, because an insurance-shaped bundle invites textbook adverse selection (Akerlof 1970). Sequences 3 and 5 mention Shield because their partners hold *portfolios of healthy accounts* — that is the S4-style risk pool M1 permits. **No sequence may position Shield as the answer to a suspension already in progress**, and any partner arrangement covering Shield needs the founder to set the waiting-period terms before it is agreed, not in an email thread.

---

## 1. The CAN-SPAM block — paste unchanged into every message

Implements 15 U.S.C. §7704 and `CRM.md §6.3` checks 1–4. **The placeholder tokens are deliberate. A draft that ships with a fabricated address is a compliance failure, not a typo — and a draft that ships with the token still in it is a founder-review failure, which is the cheaper of the two.**

```
—
[FOUNDER NAME], founder, Clausewright
Clausewright — a suspension defense copilot for Amazon and Walmart sellers
[LEGAL ENTITY NAME]
[PHYSICAL ADDRESS PLACEHOLDER — street, city, state, postal code]
[FOUNDER EMAIL]

This is a one-off business enquiry about a possible partnership, sent to a
contact address published on your own website. If you'd rather not hear from
me again, reply with "no thanks" — or just the word "stop" — and I'll remove
you permanently and won't contact you through any other channel either.
```

**Subject-line rules** (check 2 — non-deceptive):
- No `Re:` or `Fwd:` on a thread that does not exist.
- No fake personalisation ("as discussed", "following up on our call").
- No urgency, no numbers we cannot substantiate, no ALL CAPS, no emoji (`BRAND.md §2.3`).
- The subject must accurately describe the message. If the email is a partnership enquiry, the subject says so or says something equally true.

**Claim traceability** (check 6): the only facts about Clausewright permitted in these messages are — the category frame, the tier names and prices ($149 Rescue / $399 Rescue + Human / Shield $49/mo, which includes one Rescue appeal a year, with 30 days of Shield included alongside any appeal — `IDEA_DOSSIER §6.2` tier table), the free Decoder, the citation mechanic, honest triage, and no-account-access. All trace to `IDEA_DOSSIER.md` and `BRAND.md`. **No success rate. No customer count. No "trusted by." No outcome statistic.** (N10 / R11 / `BRAND.md §4.1`.)

---

## 2. The personalisation slot — the part that cannot be templated

Every Touch 1 contains a `[PERSONALISATION]` slot referencing **something the partner published themselves**, found on their own public pages. Per Hormozi's *$100M Leads* cold-outreach chapter, the opening's only job is to earn the second line, and the only durable way to do that at this volume is to have visibly read their work.

**Rules for the slot:**
1. It cites **their public work** — a service page, a published guide, a podcast episode, a survey they run, a partner page. Sourced from `research/partners.md`, which already carries the URL for every row.
2. It is **specific enough that it could not be sent to any other company on the list.** If the sentence survives a find-and-replace of the company name, it is not personalisation and the message does not go out.
3. It names **no individual** unless that person's name is the published business identity of the thing being referenced (a named show, a bylined survey). `CRM.md §6.2`: `partners.csv` holds no personal names, and the draft inherits that — write to the company, reference the work.
4. It is **true and current.** Check the live page the day you send. A stale reference is worse than none.

**Prohibited in the slot:** flattery with no object ("love what you're doing"), invented familiarity ("been following you for years"), anything scraped from a personal social profile, anything about a named individual's career.

---

## 3. Sequence 1 — Upstream financial: bookkeeping, accounting, reimbursement
**Applies to:** `partners.md` Segment A (LedgerGurus, EcomBalance, Xendoo, 1-800Accountant, Fully Accountable, Seller CPA, AMZ Accountant, Finaloop) and Segment G (GETIDA, Refunds Manager).
**Offer shape:** referral fee (`CRM.md §2.3`).
**The mechanism that makes them upstream:** they hold the P&L. They see the revenue line go flat before the seller has finished reading the notice, and they have nothing to sell into that moment. GETIDA and Refunds Manager are additionally contingency-fee businesses, which makes the commercial conversation culturally familiar rather than novel.

### Touch 1 — Day 0
**Subject options (pick one, do not A/B against the same company):**
- `Partnership question from a suspension-defense tool`
- `When your Amazon clients go dark — a referral question`
- `Referral partnership enquiry — Clausewright`

```
Hello,

I'm [FOUNDER NAME], founder of Clausewright — a suspension defense copilot
for Amazon and Walmart sellers. I'm writing because of a specific overlap,
not a general one.

[PERSONALISATION — e.g. "Your Amazon settlement-report and reimbursement
work at ledgergurus.com/services means you're reading the deposit line
weekly, which is usually where a deactivation shows up before anyone has
diagnosed it."]

When one of your clients gets deactivated, the revenue stops that day and
the questions land on you — not because it's your job, but because you're
the one holding the numbers. As far as I can tell there isn't an obvious
place to send them that isn't a $1,250 consultant or a $0 template.

What we do: a seller pastes their deactivation notice and gets, free, the
reason code, the exact policy clause they were charged under with its
source, and a critique of what their draft is still missing. A complete
submission-ready Plan of Action is $149, or $399 with same-day review by a
human appeal writer. We never ask for Seller Central credentials and we
never submit anything on a seller's behalf. Some case types — counterfeit,
IP complaints, fraud allegations — we decline to draft at all and say so
before anyone pays.

I'd like to set up a referral arrangement: your clients get a route that
isn't four figures, you get a fee on anything that closes. Terms are open —
I'd rather hear what works on your side than propose a number first.

Would a 15-minute call in the next couple of weeks be useful? If it's a no,
that's a perfectly good answer and I won't chase it.

[CAN-SPAM BLOCK]
```

### Touch 2 — Day +14 minimum
**Subject:** `One thing your clients can use either way` · or · `Following up — plus something useful regardless`

```
Hello,

Following up once on my note from [DATE] about a referral arrangement.

Whether or not that's interesting, here's something your team can use for
free: our notice decoder classifies an Amazon or Walmart deactivation
notice and shows the governing policy clause verbatim with its source. No
account, no login, no card — [DECODER URL]. If a client forwards you a
notice and you want to know in ninety seconds whether it's a metrics
problem or a conduct allegation, that's what it's for. Those two need
completely different responses, and telling them apart early is most of
the value.

[PERSONALISATION 2 — a second specific reference, ideally something
published since Touch 1.]

The referral offer stands with no expiry. If it's not a fit, saying so
takes one word and I'll close the loop.

[CAN-SPAM BLOCK]
```

### Touch 3 — Day +28 minimum
**Subject:** `Closing this out` · or · `Last note — and a question`

```
Hello,

This is my last note on this, so I'll make it short.

If a referral arrangement isn't a fit, no explanation needed — I'll mark it
closed and you won't hear from me again.

If it's just landing with the wrong person, I'd be grateful for a pointer
to whoever handles partnerships, and I'll take it from there.

Either way, the decoder stays free and open to your clients with no
arrangement attached: [DECODER URL].

Thanks for the time it took to read three emails.

[CAN-SPAM BLOCK]
```

---

## 4. Sequence 2 — Agencies and account management
**Applies to:** `partners.md` Segment B (My Amazon Guy, SalesDuo, Enso Brands, Junglr, eCommerce Nurse).
**Offer shape:** referral fee; **bundle** where the agency already monitors account health (SalesDuo's own site states it does).
**The mechanism:** they field the panicked call first and, per the dossier's own framing, currently have nowhere good to send it. Their clients are the S2 "Bleeding Mid-Market" segment where the daily loss is $1k–10k and time dominates price (`BRAND.md §3.6`).
**Crossover note:** several of these also publish media (My Amazon Guy's YouTube channel, Junglr's podcast). **Do not run both sequences at one company.** Pick the relationship that fits the ask and use `newsletter-pitch.md` if the ask is a content placement.

### Touch 1 — Day 0
**Subject options:**
- `For the client call you can't do much with`
- `Referral partnership — suspension appeals`
- `A question about where you send deactivated clients`

```
Hello,

I'm [FOUNDER NAME], founder of Clausewright — a suspension defense copilot
for Amazon and Walmart sellers. Short, specific note.

[PERSONALISATION — e.g. "Your Seller Central management service page at
salesduo.com lists account-health monitoring, which means you're already
watching the signal that precedes a deactivation — you just don't have the
remedy attached to it."]

When a managed client is deactivated, the call comes to you, the ad spend
is burning, and the options are a consultant at four figures, a template,
or writing it yourself between other clients' work. It's the least
leveraged hour in an account manager's week.

What we do: the seller (or you) pastes the notice and gets, free, the
reason code, the exact policy clause with its source, and a critique of
what a draft is still missing. The full submission-ready Plan of Action is
$149; $399 gets same-day human review. No Seller Central access, ever, and
nothing is submitted on anyone's behalf — your client clicks submit
themselves. Where a case shouldn't be drafted by a tool at all — counterfeit,
IP, fraud allegations — we say so before anyone is charged.

Two shapes I think could work: a referral fee on cases you pass over, or a
line item inside the account-health service you already run. I'd rather
you tell me which fits your model.

Worth 15 minutes? A no is genuinely fine and ends it.

[CAN-SPAM BLOCK]
```

### Touch 2 — Day +14 minimum
**Subject:** `The free half, whether or not we do anything`

```
Hello,

One follow-up on my note from [DATE], then I'll leave it.

Regardless of any arrangement, your account managers can use the decoder
free: paste a client's notice, get the reason code and the governing policy
clause quoted with its source — [DECODER URL]. No login, no card. It turns
"we're deactivated and nobody knows why" into a named charge in about a
minute, which is usually the difference between a calm client call and a
bad one.

[PERSONALISATION 2.]

If a referral or bundle arrangement is interesting, I'm still here. If not,
one word closes it.

[CAN-SPAM BLOCK]
```

### Touch 3 — Day +28 minimum
**Subject:** `Closing the loop`

```
Hello,

Last note. If this isn't a fit, no reply needed — I'll close it out and
won't contact you again about it.

If it's the wrong inbox, a pointer to whoever owns partnerships would be
appreciated.

The decoder stays free for your team either way: [DECODER URL].

[CAN-SPAM BLOCK]
```

---

## 5. Sequence 3 — Aggregators
**Applies to:** `partners.md` Segment C (Thrasio, SellerX, Razor Group).
**Offer shape:** bundle — a per-account arrangement across the portfolio.
**The mechanism:** one aggregator's portfolio generates many suspension events; they already run a per-account operating model, so adding a line item is a pricing change on their side rather than a new sales motion (`CRM.md §2.3`).
**Register note:** this is the one segment where the reader is an operations or risk function inside a larger company, not an owner-operator. `BRAND.md §3.6` S4 applies — lead on throughput and per-case economics — while **never letting S4 language leak into any surface a panicking solo seller sees.** These emails are that permitted variation, not a new position.
**Realism note:** the sector went through a documented 2023–24 shakeout. Expect procurement-shaped cycles and long silences; the three-touch ceiling still applies.

### Touch 1 — Day 0
**Subject options:**
- `Portfolio-level suspension cover — partnership enquiry`
- `Per-account appeal cover for a brand portfolio`

```
Hello,

I'm [FOUNDER NAME], founder of Clausewright — a suspension defense copilot
for Amazon and Walmart sellers. Writing about a portfolio-level
arrangement rather than a single-seller one.

[PERSONALISATION — e.g. "Operating a portfolio at the scale described on
sellerx.com/about means account-level deactivation isn't a rare event
across the group even when it's rare per brand."]

Across a portfolio, a deactivation is an operational event with a known
cost per day and an unknown resolution time. The usual options don't
match that shape: a consultant retainer prices per relationship, and an
internal write-up competes with everything else the brand team is doing.

What we do, in portfolio terms: paste the notice, get the reason code and
the exact governing policy clause with its source, plus a critique of the
draft's gaps — free, per notice, no login. A complete submission-ready Plan
of Action is $149; $399 with same-day human review. Monitoring is $49/mo
per account and includes one Rescue appeal a year. We never hold Seller Central
credentials for any account and we never submit on anyone's behalf. Cases
that shouldn't be drafted by a tool — counterfeit, IP, fraud — are declined
before anyone is charged rather than attempted.

For a portfolio I'd want to discuss a per-account arrangement rather than
list pricing. I don't have a number to propose and would rather build it
around how you already account for brand-level operating costs.

Is there a partnerships or seller-operations contact I should be speaking
with? Happy to be redirected.

[CAN-SPAM BLOCK]
```

### Touch 2 — Day +14 minimum
**Subject:** `Following up — and the free part`

```
Hello,

One follow-up on my [DATE] note about a per-account arrangement.

Independently of any of that: your brand teams can use the decoder free,
per notice, no account — [DECODER URL]. Paste a deactivation notice, get
the reason code and the governing policy clause quoted with its source. For
a portfolio operator the useful part is triage: metrics-threshold cases and
conduct allegations need different responses and different people, and the
sorting is the expensive part to get wrong.

[PERSONALISATION 2.]

If this belongs with someone else internally, a redirect is the most useful
possible reply.

[CAN-SPAM BLOCK]
```

### Touch 3 — Day +28 minimum
**Subject:** `Closing this out`

```
Hello,

Last note from me on this.

If there's no fit, no reply is needed and I'll close the record.

If there is a fit but the timing is wrong, tell me roughly when and I'll
come back then rather than sooner.

Decoder stays free and open either way: [DECODER URL].

[CAN-SPAM BLOCK]
```

---

## 6. Sequence 4 — Adjacent-detect tools: monitoring, repricers, PPC software
**Applies to:** `partners.md` Segment D (SellerSonar, Helium 10 Alerts, AmzMonitor, SmartScout), Segment E (BQool, Aura, Informed Repricer, Seller Snap), Segment F (Seller Labs, Ad Badger).
**Offer shape:** content collab first, referral fee once trust exists.
**Program-first exceptions:** Seller Snap, BQool, SmartScout — see §0 Rule 2. **Do not cold-email these three.**
**The mechanism:** `IDEA_DOSSIER §5.1/§6.5` names this pattern explicitly — they detect the problem and have no remedy to sell. The approved sentence from `BRAND.md §1 Step 7` is written for exactly this conversation and may be used verbatim: *"Alerts tell you something broke. We're the monitoring plan that also drafts your way back in the moment it does."*
**One caution:** these companies are partial substitutes as well as partners (`BRAND.md §1 Step 2 Tier D`). The message must not read as though we are positioning against them. Lead with the collab, not the comparison.

### Touch 1 — Day 0
**Subject options:**
- `Content collaboration — what happens after the alert fires`
- `Collab idea for your seller audience`
- `Partnership enquiry from a suspension-defense tool`

```
Hello,

I'm [FOUNDER NAME], founder of Clausewright — a suspension defense copilot
for Amazon and Walmart sellers. I'm writing with a content idea first and a
commercial one second, in that order on purpose.

[PERSONALISATION — e.g. "Your account-health and listing alerts at
sellersonar.com fire at the exact moment we pick a seller up: the alert
says something broke, and the seller's next question is what they're
actually charged with."]

Your product tells a seller something has gone wrong. Ours starts one step
later: paste the deactivation notice, get the reason code and the exact
policy clause it was charged under, quoted verbatim with its source, plus a
critique of what a Plan of Action would still be missing. That part is free
and needs no account. The full draft is $149; $399 with same-day human
review.

The collaboration I'd propose costs neither of us cash: a co-produced
explainer for your audience on reading a deactivation notice — what each
notice family actually means, what documentation each one needs, and which
ones a seller genuinely should not handle without qualified help. We
decline to draft counterfeit, IP and fraud cases at all, and I'd want that
in the piece, because it's the part sellers most need to hear and least
often get told.

No referral link required for a first collaboration. If it works for your
audience we can talk about whether a referral arrangement makes sense
afterwards.

Interested in a 15-minute conversation? A no ends it cleanly.

[CAN-SPAM BLOCK]
```

### Touch 2 — Day +14 minimum
**Subject:** `Following up — a concrete version of the idea`

```
Hello,

One follow-up on my [DATE] note, with a more concrete version of the
proposal so it's easier to say yes or no to.

The piece I have in mind: one page per notice family, each showing the
governing policy text verbatim with its source, what a response has to
contain, and — where it applies — a plain statement that the case needs
qualified help rather than a template. Your brand on it alongside ours, or
yours alone with attribution; I'm not precious about it.

Why the verbatim-clause part matters: almost everything published in this
space paraphrases policy rather than quoting it, so a seller can't check
any of it. A piece that quotes and sources is unusual, and it makes your
audience better at self-diagnosis whether or not they ever buy anything
from either of us.

You can see the mechanic for yourself, free, here: [DECODER URL].

[PERSONALISATION 2.]

[CAN-SPAM BLOCK]
```

### Touch 3 — Day +28 minimum
**Subject:** `Closing this out`

```
Hello,

Last note. If a collaboration isn't a fit, no reply needed and I'll close
it.

If content partnerships run through someone else, a pointer is the most
useful reply and I'll take it from there.

[DECODER URL] stays free and open to your users with no arrangement
attached.

[CAN-SPAM BLOCK]
```

---

## 7. Sequence 5 — Downstream operations: prep centres and 3PLs
**Applies to:** `partners.md` Segment H (AMZ Prep, ShipBob, Red Stag Fulfillment, InventoryLab).
**Offer shape:** bundle (Shield as an onboarding add-on) or content collab where the partner already publishes comparison content (Red Stag).
**The mechanism:** a suspension halts inbound shipments they are mid-processing. Their operational stake in a fast reinstatement is direct: units sitting in a bay, storage clock running, no destination.

### Touch 1 — Day 0
**Subject options:**
- `When a client's account goes dark mid-shipment`
- `Partnership enquiry — inbound stalls during suspensions`

```
Hello,

I'm [FOUNDER NAME], founder of Clausewright — a suspension defense copilot
for Amazon and Walmart sellers.

[PERSONALISATION — e.g. "Running FBA prep across the network described at
amzprep.com means a client deactivation lands in your building as units
with nowhere to go, not as an email."]

When a client is deactivated mid-flow, your team inherits the operational
half of the problem: inbound stops, prepped units sit, and the resolution
timeline belongs to someone else entirely. Nothing you can do speeds it up,
which is the frustrating part.

What we do: the seller pastes their deactivation notice and gets, free, the
reason code, the exact governing policy clause with its source, and a
critique of what a draft is missing. A complete Plan of Action is $149;
$399 with same-day human review. Shield monitoring is $49/mo and includes
one Rescue appeal a year. No Seller Central access, ever; nothing submitted
on the seller's behalf.

Two shapes: an add-on offered inside your client onboarding, or a simple
referral route your ops team can use when this happens. Either is fine and
I don't have terms to push — I'd rather fit whatever you already run.

Worth 15 minutes? If not, a no closes it.

[CAN-SPAM BLOCK]
```

### Touch 2 — Day +14 minimum
**Subject:** `Following up — plus something for your ops team`

```
Hello,

Following up once on [DATE].

Useful regardless of any arrangement: if a client tells your team they've
been deactivated, the decoder will name the reason code and show the
governing policy clause in about a minute, free and with no account —
[DECODER URL]. Mostly it answers the question your team actually needs
answered, which is whether this is days or weeks.

[PERSONALISATION 2.]

[CAN-SPAM BLOCK]
```

### Touch 3 — Day +28 minimum
**Subject:** `Closing this out`

```
Hello,

Last note on this. No reply needed if it isn't a fit — I'll close the
record and won't contact you again about it.

If someone else owns partnerships, a redirect would be welcome.

[CAN-SPAM BLOCK]
```

---

## 8. Not covered by these sequences — route elsewhere

| Prospect type | Where it goes | Why |
|---|---|---|
| Newsletters, podcasts, YouTube channels (`partners.md` Segments I, J) | **`newsletter-pitch.md`** | A sponsorship/editorial ask is a different message with a different structure, and media contacts hate receiving a partnership sequence. |
| eComFuel and any paid/private community (`partners.md` Segment K) | **operator-channel only** — the sponsor/partner route on their own site. Never a member. | Their own rule prohibits member pitching; `CRM.md §3.2` posture `operator-channel-only`. |
| Facebook groups, subreddits, forums | **`community-playbook.md`** and `launch-posts.md` | These are channels, not businesses. No member is ever contacted. `CRM.md §6.2`. |
| Competitors who triage cases away (AppealDesk and similar) | **Not in this file, and not in `partners.csv`.** | `IDEA_DOSSIER §6.1` lever 2 contemplates a two-way referral on refused categories, but the counterparty is a competitor and the arrangement is structurally different. It stays in the dossier until a founder opens it deliberately. |
| Attorneys and consultants for refer-out cases | **Not drafted here.** | A referral relationship that will be *disclosed inside a refusal* (`community-playbook.md` Skeleton 7) needs founder-level terms first. Drafting outreach before those terms exist would put a promise in an email. |

---

## 9. The six checks — run on every draft before it reaches the founder

Reproduced from `CRM.md §6.3` because they are the gate, not a reminder.

1. **Sender identified** — Clausewright named, with a truthful description of who is writing and why. Built into the CAN-SPAM block in §1.
2. **Non-deceptive subject line** — accurately describes the message; no fake threading, no manufactured urgency, no impersonation.
3. **Physical postal address** — present as `[PHYSICAL ADDRESS PLACEHOLDER]` until the founder supplies the real one. **Never fabricated.**
4. **Working opt-out** — clear, unambiguous, and a mechanism that actually functions. Honoured permanently and immediately; the row moves to `excluded`.
5. **Channel compliance** — where the partner publishes its own program or application process, that process is used instead of email (§0 Rule 2). No message to any community member.
6. **Claim traceability** — every factual claim traces to `IDEA_DOSSIER.md` or `BRAND.md`. **No success rate, no reinstatement rate, no outcome statistic, no customer count, no invented urgency.**

Plus the brand pre-publish checklist (`BRAND.md §6.1`), of which these bite hardest in cold email:

- **Lead check (L1):** does the message lead with the partner's problem, not with our artifact? Every Touch 1 above opens on their mechanism, not our features.
- **Register check (P5):** count "you"/"your" against "we"/"Clausewright." "You" should win. A cold email that fails this reads as a brochure.
- **Prohibited vocabulary (§4.4, §4.5):** *legal clause, counsel, represent, advocate, we fight Amazon, agent, autopilot, we submit for you, connect your Seller Central account.* All banned. Say *policy clause*, *copilot*, *you review and submit*, *we never ask for your login*.
- **No fake anchoring (§4.6):** `$149.` Not `$149 (was $299)`. The real anchor is the competitor's own published comparison table, and it is not needed in a partner email at all.
- **Tier names (§5.3):** Decoder, Rescue, Rescue + Human, Shield, Shield Pro — never "Basic," "Pro," "Premium," "free trial," "freemium."

---

## 10. What "good" looks like in this pipeline, and what it does not

Per Ross's *Predictable Revenue* — stages are defined by artifacts, never by optimism (`CRM.md §2.2` Rule P1):

- A reply saying *"interesting, send more"* is **`replied`**, not progress. It is the most common false positive in a founder-run pipeline.
- **`agreed`** requires terms in writing: which shape, what the partner gets, what triggers it, who tells whom.
- **`live`** requires a referred seller who actually arrived and is attributable.
- Silence is not rejection and is not a reason to add touches. The ceiling is three, then `dormant`.
- **Rule P2 is binding:** if partner work exceeds its 90-minute weekly box while community replies fall below A2's floor, partner work stops. The community loop is the engine; BD is the reserve. Revenue here arrives at day 60+, after the first ten customers already exist.

**The economic bound to keep in view** (`IDEA_DOSSIER §6.6`): contribution LTV ≈ $355, maximum sustainable CAC at 3:1 ≈ $118. BD is the only cash-cost channel modelled below that ceiling (~$40–60). **Any arrangement whose expected cost per referred customer exceeds $118 needs a written founder decision that overrides D8's arithmetic** — it is not a negotiating position that can be conceded in an email thread.

---

## 11. Frameworks applied

- **Aaron Ross**, *Predictable Revenue* (2011) — outbound as a defined cadence with a stop rule rather than indefinite pursuit (§0 Rule 3); pipeline stages defined by observable artifacts (§10); the channel-partner principle that a partner's own existing process beats a process you invent for them (§0 Rule 2).
- **Alex Hormozi**, *$100M Leads* (2023) — cold outreach as one of the Core Four, ranked #2 for this business behind free content (`03-gtm-pricing.md §4.4`); the discipline that the opening line's only job is to earn the second line, which is why §2's personalisation rules are stricter than the copy itself; the lead-magnet rule, applied here by putting the free Decoder in Touch 2 of every sequence as value the partner keeps whether or not they ever reply. *$100M Offers* (2021) — genuine versus manufactured urgency; there is none here and the copy says none.
- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — Bullseye; Business Development is reserve channel #1 at 18/25, seeded day 1 and expected to produce at day 60+, which is why these sequences are slow by design (§0 Rule 1).
- **April Dunford**, *Obviously Awesome* (2019) — the category frame ("a suspension defense copilot for Amazon and Walmart sellers") appears in full once in every first message per `BRAND.md §5.2`; Step 7's non-disparaging competitive sentences are the only permitted comparative language, and Sequence 4 uses the alerts sentence verbatim.
- **Rob Fitzpatrick**, *The Mom Test* (2013) — the ask in every Touch 1 is for a conversation about **their** operation, not a pitch slot; the discovery-as-onboarding discipline continues in `CRM.md §7`.
- **CAN-SPAM Act**, 15 U.S.C. §7704 — sender identification, non-deceptive subject lines, physical postal address, and a functioning opt-out honoured promptly; implemented as the mandatory block in §1 and check-gated in §9. *(Statutory compliance detail is for founder/counsel confirmation before the first send; this file implements the four elements named in `CRM.md §6.3`, which is our own recorded standard.)*

---

**Document status:** DRAFT for founder review. Nothing has been sent. Every prospect referenced traces to `research/partners.md` with a source URL to the organization's own public page; no personal names, no personal email addresses, no data from any private individual. Where a partner publishes its own partnership process, that process supersedes these sequences.
