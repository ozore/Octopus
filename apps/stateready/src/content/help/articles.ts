/**
 * The fifteen articles, written from the confusions this data actually creates
 * — `specs/11` §What we ship item 1, which lists them and calls the list "the
 * *content* deliverable".
 *
 * They are not a feature tour. Every one of them exists because two boards in
 * the committed records disagree about something a coordinator would otherwise
 * standardise on: two North Carolina boards with opposite CE rules, two Florida
 * renewal parities, a Texas contractor licence with no CE whose Master
 * Electrician of record still owes hours. Those are the tickets we will get,
 * and answering them in place is the cheapest support we will ever do.
 *
 * Every regulatory sentence is a `claim` carrying the board URL the knowledge
 * base cites for it, and `tests/help.test.ts` cross-checks the URL set. **Help
 * content is not allowed to invent regulatory statements either.**
 */

import type { HelpArticle } from './types';

export const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    slug: 'north-carolina-two-boards-two-renewal-dates',
    title:
      'Why does my North Carolina electrical licence renew on its anniversary and my plumbing licence on 31 December?',
    description:
      'North Carolina has two contractor boards with two different renewal rules. One renews on the date your licence was issued; the other renews on a fixed day for everybody.',
    category: 'State by state',
    keywords: ['north carolina', 'nc', 'renewal', 'anniversary', 'december', 'expiry', 'electrical', 'plumbing'],
    states: ['NC'],
    trades: ['electrical', 'plumbing', 'hvac'],
    blocks: [
      {
        kind: 'p',
        text: 'Because they are issued by two different boards, and the two boards do not use the same renewal rule. This is the single most common surprise in North Carolina and it is not a mistake in your record.',
      },
      {
        kind: 'claim',
        text: 'An electrical contractor licence is issued by the North Carolina State Board of Examiners of Electrical Contractors and runs for twelve months from issue, so it renews on its own anniversary.',
        sourceUrl: 'https://www.ncbeec.org/licensing/',
        sourceTitle: 'Licensing — NCBEEC',
        recordId: 'nc.electrical',
      },
      {
        kind: 'claim',
        text: 'A plumbing, heating or fire sprinkler contractor licence is issued by a different board and expires on 31 December, whatever day it was issued.',
        sourceUrl: 'https://nclicensing.org/license-renewal/',
        sourceTitle: 'License Renewal — NC Plumbing, Heating and Fire Sprinkler Board',
        recordId: 'nc.plumbing',
      },
      {
        kind: 'p',
        text: 'So a company holding both will see two different renewal months for two licences in the same state, and a spreadsheet that carries one North Carolina renewal date is wrong for one of them. Every date we show you carries the board page it came from; open it beside the licence if you want to check.',
      },
    ],
  },
  {
    slug: 'florida-certified-or-registered',
    title: 'Florida: certified or registered — and why they renew in different years',
    description:
      'Florida issues certified and registered contractor licences, and the two renew in alternate two-year cycles. Holding one of each means two renewal years, not one.',
    category: 'State by state',
    keywords: ['florida', 'fl', 'certified', 'registered', 'renewal', 'biennium', 'august', 'expiry'],
    states: ['FL'],
    trades: ['hvac', 'plumbing', 'electrical'],
    blocks: [
      {
        kind: 'p',
        text: 'A certified licence lets you work anywhere in the state. A registered licence lets you work where a local licensing authority has qualified you. They are different licences with different renewal cycles, and that is the part that catches people out.',
      },
      {
        kind: 'claim',
        text: 'A certified air-conditioning contractor licence expires on 31 August of an even-numbered year.',
        sourceUrl: 'https://www2.myfloridalicense.com/construction-industry/',
        sourceTitle: 'Construction Industry Licensing Board — Florida DBPR',
        recordId: 'fl.hvac',
      },
      {
        kind: 'claim',
        text: 'A registered air-conditioning contractor licence expires on 31 August of an odd-numbered year.',
        sourceUrl: 'https://www2.myfloridalicense.com/construction-industry/',
        sourceTitle: 'Construction Industry Licensing Board — Florida DBPR',
        recordId: 'fl.hvac',
      },
      {
        kind: 'p',
        text: 'If your company holds one of each, you renew something in Florida every August rather than every other August. We derive the parity from the licence class you record, so tell us which one it is and the calendar takes care of itself.',
      },
    ],
  },
  {
    slug: 'florida-fourteen-ce-hours-are-six-requirements',
    title: "Florida's 14 CE hours are six requirements, not one number",
    description:
      'Florida construction CE is a set of named subjects with hours attached to each. Buying fourteen hours of anything does not renew the licence.',
    category: 'Reading a date we gave you',
    keywords: ['florida', 'fl', 'ce', 'continuing education', 'hours', 'subjects', 'renewal'],
    states: ['FL'],
    trades: ['hvac', 'plumbing'],
    blocks: [
      {
        kind: 'p',
        text: 'The number people remember is the total. The board does not check the total on its own; it checks the subjects, and a course that is not one of them does not count towards them.',
      },
      {
        kind: 'claim',
        text: 'A certified air-conditioning contractor owes 14 hours a biennium made up of one hour of a specialised or advanced module, one hour of workplace safety, one hour of business practices, one hour of workers’ compensation, one hour of laws and rules, and nine hours of any board-approved construction-related instruction.',
        sourceUrl: 'https://www2.myfloridalicense.com/construction-industry/',
        sourceTitle: 'Construction Industry Licensing Board — Florida DBPR',
        recordId: 'fl.hvac',
      },
      {
        kind: 'claim',
        text: 'A certified electrical contractor owes 11 hours, not 14, and an electrical contractor who performs alarm work owes a further 2 hours of false-alarm prevention on top.',
        sourceUrl: 'https://www2.myfloridalicense.com/electrical-contractors/',
        sourceTitle: "Electrical Contractors' Licensing Board — Florida DBPR",
        recordId: 'fl.electrical',
      },
      {
        kind: 'p',
        text: 'An operations manager who standardises on one Florida CE rule across trades will over-buy for electricians and miss the alarm hours entirely. We hold the subject breakdown per licence class, so record the hours against the subject and we will tell you which one is short.',
      },
    ],
  },
  {
    slug: 'texas-plumbing-is-not-tdlr',
    title: 'Texas: why your plumbing licence is not with TDLR',
    description:
      'Texas licenses HVAC and electrical through TDLR, and plumbing through a separate board. Writing to the wrong agency costs weeks.',
    category: 'State by state',
    keywords: ['texas', 'tx', 'tdlr', 'tsbpe', 'plumbing', 'board', 'agency'],
    states: ['TX'],
    trades: ['plumbing'],
    blocks: [
      {
        kind: 'p',
        text: 'Most Texas trade licences come from the Department of Licensing and Regulation, which is why people assume all of them do. Plumbing does not.',
      },
      {
        kind: 'claim',
        text: 'Texas plumbing licences — Responsible Master Plumber, Master Plumber and Journeyman Plumber — are issued by the Texas State Board of Plumbing Examiners.',
        sourceUrl: 'https://tsbpe.texas.gov/license-types/responsible-master-plumber/',
        sourceTitle: 'Responsible Master Plumber — TSBPE',
        recordId: 'tx.plumbing',
      },
      {
        kind: 'claim',
        text: 'Texas air conditioning and refrigeration contractor licences are issued by the Texas Department of Licensing and Regulation.',
        sourceUrl: 'https://www.tdlr.texas.gov/acr/',
        sourceTitle: 'Air Conditioning and Refrigeration Contractors — TDLR',
        recordId: 'tx.hvac',
      },
      {
        kind: 'p',
        text: 'Every licence in your account names the board that issued it, and every State Entry Pack opens with the board map for the same reason: a renewal posted to the wrong agency is not late, it is lost.',
      },
    ],
  },
  {
    slug: 'texas-contractor-no-ce-master-does',
    title: 'Texas: your electrical contractor licence needs no CE, but your Master Electrician does',
    description:
      'The Texas electrical contractor licence carries no continuing-education requirement. The Master Electrician of record still does, and that is the one that lapses.',
    category: 'Reading a date we gave you',
    keywords: ['texas', 'tx', 'electrical', 'ce', 'continuing education', 'master electrician', 'contractor'],
    states: ['TX'],
    trades: ['electrical'],
    blocks: [
      {
        kind: 'p',
        text: 'This is the trap the Texas electrical record exists to catch. The company licence and the person who qualifies it are two licences with two different obligations, and only one of them has a CE clock.',
      },
      {
        kind: 'claim',
        text: 'The Texas electrical contractor licence carries no continuing-education requirement.',
        sourceUrl: 'https://www.tdlr.texas.gov/electricians/apply/businesses/contractor-elec.htm',
        sourceTitle: 'Electrical Contractor — TDLR',
        recordId: 'tx.electrical',
      },
      {
        kind: 'claim',
        text: 'A Texas Master Electrician owes 4 hours of continuing education a year to renew.',
        sourceUrl: 'https://www.tdlr.texas.gov/electricians/renew/individuals/master-electrician.htm',
        sourceTitle: 'Renew a Master Electrician License — TDLR',
        recordId: 'tx.electrical',
      },
      {
        kind: 'p',
        text: 'If the Master Electrician of record lets their licence lapse, the contractor licence has no qualifier behind it — which is a bigger problem than the CE that caused it. Track the person as well as the company.',
      },
    ],
  },
  {
    slug: 'north-carolina-abolished-plumbing-heating-ce',
    title: 'North Carolina abolished plumbing and heating CE — what that means for your records',
    description:
      'The North Carolina plumbing, heating and fire sprinkler board eliminated mandatory continuing education. There is nothing to record, and nothing to report.',
    category: 'Reading a date we gave you',
    keywords: ['north carolina', 'nc', 'ce', 'continuing education', 'plumbing', 'heating', 'abolished', 'zero'],
    states: ['NC'],
    trades: ['plumbing', 'hvac'],
    blocks: [
      {
        kind: 'p',
        text: 'A zero here is a finding, not a gap. We are telling you the board requires none, not that we could not find out.',
      },
      {
        kind: 'claim',
        text: 'Mandatory continuing education was eliminated by the North Carolina plumbing, heating and fire sprinkler board in 2012 and is no longer required in order to renew licences annually.',
        sourceUrl: 'https://nclicensing.org/education/',
        sourceTitle: 'Education — NC Plumbing, Heating and Fire Sprinkler Board',
        recordId: 'nc.plumbing',
      },
      {
        kind: 'claim',
        text: 'The same board does not approve providers or courses, and hours are not reported to it.',
        sourceUrl: 'https://nclicensing.org/education/',
        sourceTitle: 'Education — NC Plumbing, Heating and Fire Sprinkler Board',
        recordId: 'nc.plumbing',
      },
      {
        kind: 'claim',
        text: 'The North Carolina electrical board is the opposite case: it requires 8 hours a year for its unlimited, intermediate and limited classifications.',
        sourceUrl: 'https://www.ncbeec.org/continuing-education/',
        sourceTitle: 'Continuing Education — NCBEEC',
        recordId: 'nc.electrical',
      },
      {
        kind: 'p',
        text: 'One North Carolina CE rule in a spreadsheet is therefore wrong for one of the two trades. This is exactly the kind of divergence the product exists to hold for you.',
      },
    ],
  },
  {
    slug: 'what-we-could-not-verify-means',
    title: 'What "we could not verify this" means, and what to do about it',
    description:
      'Where a board publishes nothing, we say so and show you the pages we read, rather than estimating. Here is how to read that, and what to ask the board.',
    category: 'Reading a date we gave you',
    keywords: ['unverified', 'not verified', 'needs checking', 'confidence', 'unknown', 'blank', 'missing', 'estimate'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'p',
        text: 'There are two different messages and they mean different things.',
      },
      {
        kind: 'list',
        items: [
          '"Not published" — we read the board’s pages and the value is not on them. That is a statement about the board, and we show you which pages we read.',
          '"Not yet verified" — the value exists but we have not confirmed it recently enough to assert it. That is a statement about us, and we show you the board’s page instead.',
          '"Needs checking" — we have a value and we are showing it to you, together with the reading behind it, because it was not stated plainly enough for us to assert it flatly.',
        ],
      },
      {
        kind: 'policy',
        text: 'Where a value has not been re-checked in 180 days we stop showing it as verified and show you the board page instead.',
        from: 'STALENESS_DAYS',
      },
      {
        kind: 'p',
        text: 'What we never do is estimate. Not a fee, not a fee-free period, not an hour count, not a processing time. A number we invented would be indistinguishable from a number a board published, and the whole product rests on that difference.',
      },
      {
        kind: 'p',
        text: 'If you think a value is wrong, tell us and include the board link we showed beside it — there is a "this rule looks wrong" option on the support form that routes it straight into our review queue rather than into an inbox. Those are the most valuable messages we get.',
      },
    ],
  },
  {
    slug: 'what-stateready-does-not-cover',
    title: 'What StateReady does not cover: counties, cities, and the states we have not reached',
    description:
      'Our coverage boundary, stated plainly: three trades, the states on our public coverage page, and no county or city licensing at all.',
    category: 'Reading a date we gave you',
    keywords: ['coverage', 'county', 'city', 'municipal', 'permit', 'states', 'not covered', 'scope'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'p',
        text: 'We cover HVAC, plumbing and electrical, in the states listed on our coverage page, at the state level only. Everything outside that is not in the product and we would rather you heard it from us than found out.',
      },
      {
        kind: 'p',
        text: 'We do not cover county or city licensing, permits or registrations. Most states have a local layer in addition to the state licence, and a state licence in hand does not mean a municipality will not ask you for something else.',
      },
      {
        kind: 'p',
        text: 'We do not file applications, renewals or continuing-education records on your behalf, and we are not a licensing service.',
      },
      {
        kind: 'p',
        text: 'Our coverage page is public and it lists every state and trade we hold, how many values in each are verified, how many we could not establish, and the day each was last checked. Nobody else in this category publishes one; check it before you rely on us.',
      },
    ],
  },
  {
    slug: 'how-we-keep-the-rules-current',
    title: 'How we keep the rules current, and how to tell when a rule changed',
    description:
      'Every value carries the page it came from and the day we checked it. Here is what happens between checks, and what we do when a board page moves.',
    category: 'Reading a date we gave you',
    keywords: ['current', 'updated', 'changed', 'drift', 'rule change', 'last checked', 'verified', 'methodology'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'p',
        text: 'Every value in your account shows the board page it came from and the date we last checked it. That line is not decoration: it is how you audit us without asking us.',
      },
      {
        kind: 'p',
        text: 'We re-fetch the pages behind those values and compare them with what we recorded. When a page changes we open a review item and a person reads the difference before anything in your account moves. We never publish a rule change automatically, because a bad automated update to a compliance date is worse than a slow one.',
      },
      {
        kind: 'policy',
        text: 'A value we have not re-checked in 180 days stops being shown as verified, whatever the record says.',
        from: 'STALENESS_DAYS',
      },
      {
        kind: 'p',
        text: 'Our target checking cadence, and how we are actually doing against it right now, are on the methodology page. It is the only page on this site that states a cadence, and it states it as a target beside the live figures.',
      },
    ],
  },
  {
    slug: 'importing-your-roster',
    title: 'Importing your roster from a spreadsheet',
    description:
      'Paste your rows, tell us which date format you used, and check the preview. We never guess between a UK and a US date.',
    category: 'Your data',
    keywords: ['import', 'roster', 'csv', 'spreadsheet', 'upload', 'paste', 'date format', 'technicians'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'p',
        text: 'Copy the rows out of your spreadsheet and paste them in. We show you what we understood before anything is saved, and you can correct the column mapping.',
      },
      {
        kind: 'p',
        text: 'We ask you which date format your file uses rather than guessing. A guess between a day-first and a month-first date is right about half the time and wrong in a way nobody notices until a renewal is missed.',
      },
      {
        kind: 'p',
        text: 'Licence numbers are stored exactly as you typed them. We do not normalise them, because the punctuation in a licence number is part of the number on several boards.',
      },
      {
        kind: 'p',
        text: 'Rows we could not read come back as a file you can fix and re-paste, rather than being dropped silently.',
      },
    ],
  },
  {
    slug: 'reciprocity-runs-one-way',
    title: 'Reciprocity: why it usually runs one way',
    description:
      'A reciprocal agreement is a statement by one board about licences from another. It rarely means the reverse is true.',
    category: 'State by state',
    keywords: ['reciprocity', 'reciprocal', 'agreement', 'waiver', 'exam', 'out of state', 'expansion'],
    states: ['NC', 'TX'],
    trades: ['electrical', 'hvac', 'plumbing'],
    blocks: [
      {
        kind: 'p',
        text: 'People read reciprocity as a handshake between two states. It is almost never that. It is one board publishing what it will accept from elsewhere, and the other board publishing something different, or nothing.',
      },
      {
        kind: 'claim',
        text: 'North Carolina publishes formal reciprocal licensing agreements with the contractor licensing boards of several states, made under G.S. 87-50, and holders of those licences may obtain a North Carolina electrical contracting licence without written examinations.',
        sourceUrl: 'https://www.ncbeec.org/reciprocity/',
        sourceTitle: 'Reciprocity — NCBEEC',
        recordId: 'nc.electrical',
      },
      {
        kind: 'claim',
        text: 'Texas air conditioning and refrigeration reciprocity runs inbound from two states only, and a Georgia licence must have been held for at least one year before Texas will accept it.',
        sourceUrl: 'https://www.tdlr.texas.gov/acr/acrreciprocity.htm',
        sourceTitle: 'ACR Reciprocity — TDLR',
        recordId: 'tx.hvac',
      },
      {
        kind: 'p',
        text: 'So the question is never "do these two states have reciprocity". It is "what does the state I am entering say about the licence I hold" — which is what a State Entry Pack answers, in that direction, with the page it came from.',
      },
    ],
  },
  {
    slug: 'what-happens-when-a-licence-lapses',
    title: 'What happens when a licence lapses',
    description:
      'A lapse is not an administrative slip. What it costs depends on the board and on how long it has been, and both are published.',
    category: 'Reading a date we gave you',
    keywords: ['lapse', 'lapsed', 'expired', 'late', 'reinstatement', 'grace', 'penalty', 'renew late'],
    states: ['TX'],
    trades: ['hvac'],
    blocks: [
      {
        kind: 'p',
        text: 'While a licence is expired you cannot lawfully contract on it. That is the part that stops jobs, refuses permit applications and, in some states, affects whether you can sue to be paid for work you have already done.',
      },
      {
        kind: 'claim',
        text: 'A Texas air conditioning and refrigeration contractor licence renewed late costs one and a half times the renewal fee if it has been expired ninety days or less, and twice the fee beyond that.',
        sourceUrl: 'https://www.tdlr.texas.gov/acr/contractor-renew.htm',
        sourceTitle: 'Renew an ACR Contractor License — TDLR',
        recordId: 'tx.hvac',
      },
      {
        kind: 'p',
        text: 'Every board is different, and several publish nothing about late renewal at all. Where a board publishes nothing we say so rather than guessing, and we tell you which office to ring.',
      },
      {
        kind: 'p',
        text: 'A lapsed licence in your account is marked LAPSED, in those words, with the date it expired and the rule that produced it. We do not soften the word.',
      },
    ],
  },
  {
    slug: 'adding-a-company-you-have-acquired',
    title: 'Adding a company you have just acquired',
    description:
      'Load the acquired roster as its own legal entity, then look at the states it operates in that you do not.',
    category: 'Your data',
    keywords: ['acquisition', 'acquired', 'merger', 'entity', 'roll-up', 'new company', 'onboarding'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'p',
        text: 'Add the acquired business as its own legal entity rather than merging its people into yours. Licences belong to entities and to individuals, and the qualifier arrangements almost never survive a change of ownership unchanged.',
      },
      {
        kind: 'p',
        text: 'Then import its roster the same way you imported yours, and set the states and trades it actually operates in. The board will show you where the two footprints differ.',
      },
      {
        kind: 'p',
        text: 'The question that usually matters next is what it takes to be legal in a state the acquired company is in and you are not. That is what a State Entry Pack is for, and it is priced and published rather than quoted.',
      },
      {
        kind: 'p',
        text: 'Watch the qualifier. When the person who qualified the acquired company leaves, several boards give you a fixed window to name a replacement, and that clock starts on the day they go rather than on the day you notice.',
      },
    ],
  },
  {
    slug: 'alerts-what-you-get-and-when',
    title: 'Alerts: changing what you get and when',
    description:
      'Who is emailed, how far ahead, and how to stop an alert without losing the deadline behind it.',
    category: 'Alerts',
    keywords: ['alert', 'alerts', 'email', 'reminder', 'notification', 'digest', 'mute', 'unsubscribe', 'when'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'policy',
        text: 'By default we email at 90, 60, 30 and 7 days before a deadline.',
        from: 'ALERT_OFFSETS',
      },
      {
        kind: 'policy',
        text: 'A deadline inside 90 days is shown as AT RISK on the board, which is the same number as the first alert so the map and the mailbox can never disagree.',
        from: 'AT_RISK_DAYS',
      },
      {
        kind: 'p',
        text: 'You choose who receives them per state, and each recipient gets one message covering everything due for them rather than one message per licence.',
      },
      {
        kind: 'p',
        text: 'Muting a state stops the email and does not stop the tracking: the deadline stays on the board, in the export and in the calendar feed. Nothing you turn off deletes a date.',
      },
      {
        kind: 'p',
        text: 'Sign-in links and payment notices are not alerts and cannot be turned off while the account is open, because they are how you get in and how you find out about a failed card.',
      },
    ],
  },
  {
    slug: 'trials-plans-and-your-data',
    title: 'Trials, plans and what happens to your data',
    description:
      'What the trial includes, what happens when it ends, and how to get everything out again.',
    category: 'Plans and billing',
    keywords: ['trial', 'plan', 'billing', 'cancel', 'export', 'delete', 'data', 'subscription', 'price'],
    states: [],
    trades: [],
    blocks: [
      {
        kind: 'policy',
        text: 'The trial is 14 days, needs no card, and is offered to the first 100 organisations that sign up.',
        from: 'TRIAL_DAYS',
      },
      {
        kind: 'p',
        text: 'When it ends the account goes read-only. Nothing is deleted, alerts stop, and everything you loaded is still there and still exportable. You can start a plan at any point and pick up where you were.',
      },
      {
        kind: 'p',
        text: 'Plans are tiered on states rather than on seats, because a state is a rulebook we maintain and a seat is not. Technicians appear only as a fair-use band.',
      },
      {
        kind: 'p',
        text: 'Cancelling is two clicks from the billing page and is never hidden. The export button is on the same screen, deliberately.',
      },
      {
        kind: 'p',
        text: 'Your export is a spreadsheet with the citation columns intact, so the licence data you take with you carries the same provenance it had in the product. Deletion removes the organisation and everything hanging off it.',
      },
    ],
  },
];

export function helpArticle(slug: string): HelpArticle | null {
  return HELP_ARTICLES.find((article) => article.slug === slug) ?? null;
}
