import { writeFileSync } from 'node:fs';
import { KB_RECORDS } from '../src/lib/kb/records';
import { assembleEntryPack } from '../src/lib/packs/assemble';
import { renderPackPdf, extractPackValues } from '../src/lib/packs/pdf';

const today = '2026-09-04';
for (const r of KB_RECORDS) {
  const pack = assembleEntryPack({ records: [r], today, organisationName: 'Sila Mechanical' });
  const bytes = await renderPackPdf(pack);
  console.log(r.record_id, bytes.byteLength, 'bytes', 'values=', extractPackValues(pack).length);
  if (r.record_id === 'tx.hvac') writeFileSync('.scratch/tx-hvac.pdf', bytes);
}
const preview = assembleEntryPack({ records: [KB_RECORDS.find(r=>r.record_id==='tx.hvac')!], today, mode: 'preview' });
const b = await renderPackPdf(preview);
console.log('preview', b.byteLength);
