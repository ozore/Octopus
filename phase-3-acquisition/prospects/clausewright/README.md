# clausewright — prospect research

**Date:** 2026-09-03. **Status:** research only. Nothing here has been sent to anyone and nothing
here authorises sending anything. `prospects.csv` = 1,260 rows, all new — no organisation already in
`../../crm/partners.csv` or `../../crm/channels.csv` is repeated.

## ICP

Clausewright's buyer is a **first-time-suspended, sub-$2M-GMV Amazon (and Walmart) third-party
seller with an account-level deactivation**, who cannot justify a $1,000+ consultant and will not
trust a $49 template mill (`IDEA_DOSSIER` §4.1).
That person is unlistable in advance — nobody knows which seller goes dark tomorrow — so this file
maps the **organisations that stand next to them at the moment it happens** and the **surfaces where
they gather before it happens**.

## Why there are zero `end-customer` rows

This is deliberate and is the single most important thing to know about this file.

The trigger event is individual, private and same-day. Listing "sellers who might get suspended"
would mean either (a) enumerating private individuals from suspension threads, which BRIEF §2.1
forbids outright, or (b) listing every Amazon 3P seller, which is not research. The dossier already
routes this: segment **S4 "Managers"** — agencies, aggregators, VAs, prep centres — is named as the
**highest-value reserve channel precisely because one of them aggregates dozens of suspension events
a year** (`IDEA_DOSSIER` §4.2, §5). This file is that channel map, at scale.

## Rows per prospect_type × segment

| segment | partner | channel | excluded | total |
|---|---:|---:|---:|---:|
| prep centre / FBA 3PL | 368 | — | — | 368 |
| marketplace agency | 128 | — | — | 128 |
| blog / publication | — | 81 | — | 81 |
| seller software - listings & ops | 80 | — | — | 80 |
| facebook group | — | 78 | — | 78 |
| conference / trade show | — | 75 | — | 75 |
| amazon aggregator | 70 | — | — | 70 |
| 3PL & fulfillment | 57 | — | — | 57 |
| seller software - analytics | 52 | — | — | 52 |
| podcast | — | 51 | — | 51 |
| seller lending & cash flow | 28 | — | — | 28 |
| ecommerce accounting & tax | 24 | — | — | 24 |
| excluded - appeal/reinstatement service | — | — | 24 | 24 |
| seller software - advertising | 21 | — | — | 21 |
| paid / private seller community | — | 15 | — | 15 |
| other marketplace service | 14 | — | — | 14 |
| product compliance lab | 14 | — | — | 14 |
| insurance broker | 13 | — | — | 13 |
| IP & trademark firm | 10 | — | — | 10 |
| newsletter / news publication | — | 10 | — | 10 |
| brand protection | 8 | — | — | 8 |
| cross-border seller services | 7 | — | — | 7 |
| FBA reimbursement & audit | 6 | — | — | 6 |
| seller software - returns & reviews | 5 | — | — | 5 |
| seller software - content | 5 | — | — | 5 |
| seller VA & outsourcing | 5 | — | — | 5 |
| subreddit | — | 5 | — | 5 |
| independent seller forum | — | 3 | — | 3 |
| professional network group | — | 3 | — | 3 |
| **total** | **915** | **321** | **24** | **1,260** |

## Rows per confidence

| confidence | partner | channel | excluded | total | what it means here |
|---|---:|---:|---:|---:|---|
| `verified` | 718 | 1 | 9 | **728** | the organisation's own site was fetched and returned HTTP 200 on 2026-09-03 |
| `secondary` | 197 | 315 | 15 | **527** | found in a third-party directory or list; the org's own site was not opened, or answered 403/404/no-response |
| `unverified` | — | 5 | — | **5** | subreddits — reddit.com is blocked from this environment, so the sub was never opened |
| **total** | **915** | **321** | **24** | **1,260** | |

1,164 of 1,260 rows carry a `website`; 769 carry a business `contact_route` (Facebook-group rows
carry the public group URL in `website` and no contact route, because a group has no business mailbox).

## The twenty highest-fit rows

There are no `end-customer` rows (see above), so this is the twenty rows the founder should work
first — ordered by *how close the organisation stands to the deactivation notice itself*.

| # | Organisation | Type / segment | Why this one |
|---:|---|---|---|
| 1 | **Amazon Seller Performance - Friendly Advice - Worldwide** | channel / facebook group | 52,300 members and the group is *about* suspensions — the deactivation notice gets pasted here verbatim, which is Clausewright's exact input |
| 2 | **Prosper Show** | channel / conference | The largest independent Amazon-seller trade event (Las Vegas, Mar 2027); its audience is established sellers who have been suspended before |
| 3 | **ASGTG Event** | channel / conference | Run by the suspension-and-account-health community already in `crm/channels.csv`; the single most topic-aligned event in the calendar |
| 4 | **Payability** | partner / lending | Advances cash against Amazon receivables — a deactivation is an immediate credit event on its own book, so it is paid to want the seller reinstated |
| 5 | **Onramp Funds** | partner / lending | Same mechanism, and it is a Walmart-approved provider, so it covers both marketplaces Clausewright serves |
| 6 | **Acadia** | partner / agency | Walmart-approved agency running client accounts end to end; one agency aggregates dozens of suspension events a year (`IDEA_DOSSIER` §4.2) |
| 7 | **Acosta Group** | partner / agency | Walmart Marketplace strategic growth partner — the largest book of Walmart seller accounts on this list |
| 8 | **Harvest Group** | partner / agency | 17+ years of Walmart expertise, Walmart Connect Premium+ partner; Walmart-side coverage is where Clausewright has least competition |
| 9 | **Boosted Commerce** | partner / aggregator | $380M raised, still trading; owns dozens of Amazon accounts, so suspension defense is an operating line item, not a one-off |
| 10 | **Unybrands** | partner / aggregator | $325M raised and live; same bundle logic, US-headquartered (Miami) |
| 11 | **Shipping-and-Handling.com** | partner / prep centre | 330,000 sq ft of FBA prep — a client deactivation strands stock in *its* warehouse, so it hears about it the same day |
| 12 | **Shipmate Fulfillment** | partner / prep centre | 300,000 sq ft; same mechanism at scale |
| 13 | **My FBA Prep** | partner / prep centre | Operates a nationwide network of prep centres with a 10,000-unit/month minimum — one relationship reaches many sellers |
| 14 | **Silent Sales Machine Radio** | channel / podcast | 987 Apple reviews, 10k–50k monthly listeners, explicitly an Amazon/Walmart/eBay seller show |
| 15 | **Lunch With Norm** | channel / podcast | 3,300 Apple reviews — the largest reviewed audience of any show on the list |
| 16 | **Seller Investigators** | partner / reimbursement | Already runs a claims workflow against Amazon on the seller's behalf and is paid on recovery; its customers already trust it with account-level problems |
| 17 | **Insurance Canopy** | partner / insurance broker | Amazon's $1M liability requirement forces every seller past $10k/month through a broker, so the broker holds a clean list of exactly this cohort |
| 18 | **QIMA** | partner / compliance lab | CPSC-accepted; sellers arrive holding a compliance notice — the same document Clausewright parses |
| 19 | **Acuity** | partner / accounting | Publishes an Amazon-seller accounting practice; sees the payout stop before anyone else outside the business does |
| 20 | **Amazon Sellers & FBA (LinkedIn group)** | channel / professional network | 55,000 members on a platform that tolerates organisation posting, unlike most Facebook groups |

## Gaps — every segment under 30 rows, and why

| segment | rows | why it is small |
|---|---:|---|
| `seller lending & cash flow` | 28 | Genuinely small market. Walmart's approved list plus the ecommerce-funding guides between them name ~30 active lenders; there is no larger public register |
| `ecommerce accounting & tax` | 24 | The 8 firms already in `crm/` were removed first. Beyond the Walmart-approved tax tools, ecommerce accounting is a long tail of one- and two-person practices with no directory — and a solo practice listed under a person's name is not listable under BRIEF §2.1 |
| `seller software - advertising` | 21 | Most PPC vendors are *also* agencies and were classified there; the pure-software count is real |
| `paid / private seller community` | 15 | These are invite-only by construction and mostly discoverable only from inside. Hive Index is the only public index and it lists 19 for this topic |
| `other marketplace service` | 14 | Residual bucket for Walmart providers whose category and description were both too generic to classify |
| `product compliance lab` | 14 | **Blocked source.** The authoritative list — CPSC's accepted-laboratory search — returns 403 to this environment. Rows come from a secondary list of the nine large TIC groups plus consultancies. With CPSC access this segment goes to several hundred |
| `insurance broker` | 13 | One good secondary list exists (Compliance Gate) and it names 12. There is no directory of "brokers who write Amazon seller policies"; state insurance registers list agents by personal name, which BRIEF §2.1 excludes |
| `newsletter / news publication` | 10 | The four biggest are already in `crm/`. Most "seller newsletters" are a vendor blog with an email capture and are already counted as blogs |
| `IP & trademark firm` | 10 | Deliberately narrow. The obvious names all sell suspension appeals as well as trademarks — three were moved to `excluded` during the conflict scan — so only firms whose own site shows *no* appeal practice were kept |
| `brand protection` | 8 | Small, concentrated category; the eight named are the ones that recur across every list |
| `cross-border seller services` | 7 | The English-language-site constraint bites hard. Most Chinese cross-border providers reached through Walmart's directory were classified by function (logistics, ERP, payments) instead, so the true count across the file is higher |
| `FBA reimbursement & audit` | 6 | Two of the largest (GETIDA, Refunds Manager) are already in `crm/`; the category has perhaps a dozen real players |
| `seller software - content` / `returns & reviews` | 5 / 5 | Narrow Walmart categories; most such vendors were classified into listings & ops |
| `seller VA & outsourcing` | 5 | Enormous but almost entirely individual freelancers on Upwork/OnlineJobs.ph — unlistable under BRIEF §2.1. Only agency-shaped firms were kept |
| `subreddit` | 5 | **Blocked source.** reddit.com is blocked (BRIEF §2.7). Names and sizes come from secondary articles; the two biggest subs are already in `crm/`. All five are `unverified` and their rules are unread |
| `independent seller forum` | 3 | The three that matter (Amazon Seller Forums, Walmart Marketplace forum, eComFuel) are already in `crm/`. What is left is thin |
| `professional network group` | 3 | Hive Index lists exactly three Amazon-seller LinkedIn groups above 30k members; LinkedIn publishes no group directory |

Two further honest caveats, not segment-shaped:

- **Every Facebook, Discord, LinkedIn, Slack and Reddit row has `rule_status` unverified.** facebook.com
  and reddit.com are blocked here, so no group's self-promotion rules were read. Per `crm/CRM.md`
  §3.2 the default posture for such a channel is **reply-only, no link**, and a human must read the
  rules before anything is posted. Posting first is the one mistake that permanently removes a channel.
- **96 of 1,260 rows carry no `website`**, and every one says why in `notes`, per BRIEF §2.4. The
  largest block is 41 prep centres — 33 from `fbaprepfinder.com`, which deliberately publishes no
  outbound links, and 8 whose own domain did not respond. The rest are 22 blogs and 17 podcasts whose
  directory entry has no site link, 4 subreddits (reddit is blocked), and 8 organisations whose
  candidate URL returned no response at all, including **Kaspien** and **Marketplace Ops**.

## Next steps — the three sources that would add the most

1. **Clutch and DesignRush Amazon-agency category pages** (both 403 to `curl`). Clutch alone lists
   several hundred Amazon agencies with verified spend bands, employee counts and locations — the
   three fields most missing from the agency rows here. A browser session or the Clutch API would
   roughly triple the `marketplace agency` segment and fill in `location` and `size_signal`.
2. **The Amazon Ads verified partner directory** (`advertising.amazon.com/partners/directory`) and the
   **Amazon Service Provider Network**. The first is a React app with no server-rendered listing and
   no sitemap entries; the second sits behind Seller Central authentication, which BRIEF §2.5
   forbids. Between them they are Amazon's own vetted list of the agencies and service providers who
   hold seller accounts — the highest-authority partner source that exists, and the one gap that
   matters most.
3. **The CPSC accepted-testing-laboratory register** (403 here) and, secondarily, the remaining 144
   `webretailer.com` vendors whose domains were not published. The first turns a 14-row segment into a
   several-hundred-row one built on a government record rather than a blog post; the second is ~100
   more seller-software partners at one search each.

## Files

| file | what it is |
|---|---|
| `prospects.csv` | the deliverable, 1,260 rows, schema per BRIEF §3.1 |
| `sources.md` | every source tried in order, with the exact commands and what each yielded |
| `CLAUDE.md` | steering notes for the next agent on this target |
| `scripts/build_curated.py` | builds `raw/curated.json` (the hand-researched segments) from the verification sweep |
| `scripts/build_prospects.py` | rebuilds `prospects.csv` from `raw/` — run from the repo root, no arguments |
| `raw/` | the parsed JSON/TSV the scripts consume. The ~390 MB of source HTML was deleted after extraction, not committed; `sources.md` carries every command needed to re-fetch it |
