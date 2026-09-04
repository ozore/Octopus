import { KB_RECORDS } from '../src/lib/kb/records';
import { assembleEntryPack, gapDisclosure } from '../src/lib/packs/assemble';
import { packIntegrityFailures } from '../src/lib/packs/integrity';
import { entryPackReadiness } from '../src/lib/kb/accessors';
import { walkSourcedValues } from '../src/lib/kb/walk';

const today = '2026-09-04';
for (const r of KB_RECORDS) {
  const pack = assembleEntryPack({ records: [r], today });
  const fails = packIntegrityFailures(pack, [r]);
  const ready = entryPackReadiness(r, today);
  console.log(r.record_id, 'gaps=', pack.needsCheckCount, 'acc=', ready.disclosedGaps.length, 'flagged=', pack.needsHumanCheck.length, 'integrity=', fails.length);
  if (fails.length) console.log('  ', fails.slice(0,5));
  // bijection
  const walked = new Set(walkSourcedValues(r).map(w => w.path));
  const ids = new Set<string>();
  for (const s of pack.sections) for (const st of s.steps) for (const g of st.groups) for (const it of g.items) ids.add(it.id);
  const missing = [...walked].filter(p => !ids.has(p));
  if (missing.length) console.log('  MISSING FROM STEPS:', missing);
}
const p = assembleEntryPack({ records: [KB_RECORDS.find(r=>r.record_id==='tx.hvac')!], today });
console.log('\nANSWER:', p.answer.map(s=>s.text).join(''));
console.log('\nGAPS:', p.gaps.map(g=>g.label));
console.log('\nDISCLOSURE:', JSON.stringify(gapDisclosure([KB_RECORDS.find(r=>r.record_id==='tx.hvac')!], today), null, 1).slice(0, 1200));
