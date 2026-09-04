import { KB_RECORDS } from '../src/lib/kb/records';
import { entryPackReadiness } from '../src/lib/kb/accessors';

const today = '2026-09-04';
for (const r of KB_RECORDS) {
  const p = entryPackReadiness(r, today);
  console.log(r.record_id, 'ready=', p.ready, 'missingCore=', JSON.stringify(p.missingCore), 'gaps=', p.disclosedGaps.length);
}
