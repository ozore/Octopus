import { HELP_ARTICLES } from '../src/content/help/articles';
import { ALERT_OFFSETS, AT_RISK_DAYS } from '../src/lib/cron';
import { STALENESS_DAYS } from '../src/lib/rules/assess';
import { TRIAL_COHORT_CAP, TRIAL_DAYS } from '../src/lib/plans';

console.log('articles', HELP_ARTICLES.length);
for (const a of HELP_ARTICLES) {
  for (const b of a.blocks) {
    if ((b.kind === 'p' || b.kind === 'h') && /\d/.test(b.text)) console.log('DIGIT IN P', a.slug, b.text.slice(0,80));
    if (b.kind === 'list') for (const i of b.items) if (/\d/.test(i)) console.log('DIGIT IN LIST', a.slug, i.slice(0,60));
  }
}
const allowed = new Set([...ALERT_OFFSETS, AT_RISK_DAYS, STALENESS_DAYS, TRIAL_DAYS, TRIAL_COHORT_CAP].map(String));
console.log('allowed', [...allowed]);
for (const a of HELP_ARTICLES) for (const b of a.blocks) if (b.kind === 'policy') {
  for (const n of b.text.match(/\d+/g) ?? []) if (!allowed.has(n)) console.log('BAD POLICY NUMBER', a.slug, n);
}
const slugs = new Set(HELP_ARTICLES.map(a=>a.slug)); console.log('unique slugs', slugs.size);
const titles = new Set(HELP_ARTICLES.map(a=>a.title)); console.log('unique titles', titles.size);
