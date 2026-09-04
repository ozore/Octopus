/**
 * The two CSVs (WL-07).
 *
 * **AN EXPORT IS AN AUDIT ARTEFACT, SO ITS COLUMN ORDER IS STABLE.** A
 * spreadsheet an auditor built a formula against last March has to still line
 * up this March, so the header arrays below are append-only in the same way a
 * migration is: a new column goes on the end, and `tests/payroll-history.test.ts`
 * asserts the exact header line.
 *
 * **THREE RULES THAT ARE NOT FORMATTING CHOICES.**
 *  - **Only `certified` and `superseded` payrolls are exported** (V1). An
 *    unsigned payroll must not enter an audit pack, and a draft holds no number
 *    to put in the first column anyway (M4).
 *  - **Every row carries `wd_number`, `modification_number` and
 *    `publication_date`** (V3, gate G8 applied to exports). A rate without its
 *    determination is the defect this whole product exists to prevent.
 *  - **`lines_csv` carries the last four digits and nothing more** (V2). There
 *    is no export option that emits more, because no column upstream holds
 *    more, and the privacy test regexes the produced file for a nine-digit
 *    sequence.
 */

import { formatMoney } from '../domain/payroll-math';
import type { PayrollLine } from '../schema';
import type { PayrollSummary } from '../repositories/payrolls';

/** RFC 4180: quote anything containing a delimiter, a quote or a newline. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

export const REGISTER_COLUMNS = [
  'payroll_number',
  'week_ending_date',
  'status',
  'submission_status',
  'submitted_at',
  'submission_recipient',
  'submission_status_note',
  'worker_count',
  'total_hours_st',
  'total_hours_ot',
  'gross_project_7a',
  'gross_all_work_7b',
  'deductions_8d',
  'net_pay_9',
  'wd_number',
  'modification_number',
  'publication_date',
  'certified_at',
  'certifying_official_title',
  'wh347_sha256',
  'superseded_by',
  'no_work_performed',
] as const;

export const LINE_COLUMNS = [
  'payroll_number',
  'week_ending_date',
  'status',
  'submission_status',
  'wd_number',
  'modification_number',
  'publication_date',
  'worker_entry_no',
  'last_name',
  'first_name',
  'middle_initial',
  // The column name says the rule: four digits, never more (V2).
  'identifying_no_last4',
  'worker_status',
  'classification_label',
  'st_day_1',
  'st_day_2',
  'st_day_3',
  'st_day_4',
  'st_day_5',
  'st_day_6',
  'st_day_7',
  'ot_day_1',
  'ot_day_2',
  'ot_day_3',
  'ot_day_4',
  'ot_day_5',
  'ot_day_6',
  'ot_day_7',
  'total_hours_st_5',
  'total_hours_ot_5',
  'rate_st_6a',
  'rate_ot_6a',
  'fringe_credit_6b',
  'payment_in_lieu_6c',
  'gross_project_7a',
  'gross_all_work_7b',
  'ded_tax_8a',
  'ded_fica_8b',
  'ded_other_8c',
  'ded_other_note_8c',
  'ded_total_8d',
  'net_pay_9',
  'wd_base_rate',
  'wd_fringe_rate',
  'superseded_by',
] as const;

export type ExportablePayroll = PayrollSummary & {
  publicationDate: string;
  wh347Sha256: string | null;
  lines: PayrollLine[];
};

/** V1 — drafts never enter an audit pack. */
export function exportable(payrolls: ExportablePayroll[]): ExportablePayroll[] {
  return payrolls.filter((row) => row.status === 'certified' || row.status === 'superseded');
}

function iso(value: Date | null | undefined): string {
  return value ? new Date(value).toISOString() : '';
}

export function buildRegisterCsv(payrolls: ExportablePayroll[]): string {
  const lines = [csvRow([...REGISTER_COLUMNS])];
  for (const payroll of exportable(payrolls)) {
    const dedTotal = payroll.lines.reduce((acc, line) => acc + Number(line.dedTotal), 0);
    const netPay = payroll.lines.reduce((acc, line) => acc + Number(line.netPay), 0);
    const grossAll = payroll.lines.reduce((acc, line) => acc + Number(line.grossAllWork), 0);
    lines.push(
      csvRow([
        payroll.payrollNumber,
        payroll.weekEndingDate,
        payroll.status,
        payroll.submissionStatus,
        iso(payroll.submittedAt),
        payroll.submissionRecipient,
        payroll.submissionStatusNote,
        payroll.workerCount,
        payroll.totalHoursSt,
        payroll.totalHoursOt,
        formatMoney(payroll.grossProject),
        formatMoney(grossAll),
        formatMoney(dedTotal),
        formatMoney(netPay),
        payroll.wdNumber,
        payroll.wdModificationNumber,
        payroll.publicationDate,
        iso(payroll.certifiedAt),
        // The official's NAME is a person's name and is not exported into a
        // register a whole organisation reads; the title is the role that
        // signed, which is what an audit pack needs.
        payroll.certifyingOfficialTitle,
        payroll.wh347Sha256,
        payroll.supersededByNumber,
        payroll.noWorkPerformed,
      ]),
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}

export function buildLinesCsv(payrolls: ExportablePayroll[]): string {
  const rows = [csvRow([...LINE_COLUMNS])];
  for (const payroll of exportable(payrolls)) {
    for (const line of payroll.lines) {
      const st = (line.hoursSt as string[] | null) ?? [];
      const ot = (line.hoursOt as string[] | null) ?? [];
      rows.push(
        csvRow([
          payroll.payrollNumber,
          payroll.weekEndingDate,
          payroll.status,
          payroll.submissionStatus,
          payroll.wdNumber,
          payroll.wdModificationNumber,
          payroll.publicationDate,
          line.workerEntryNo,
          line.lastName,
          line.firstName,
          line.middleInitial,
          line.identifyingNoLast4,
          line.workerStatus,
          line.classificationLabel,
          ...Array.from({ length: 7 }, (_, i) => st[i] ?? '0.00'),
          ...Array.from({ length: 7 }, (_, i) => ot[i] ?? '0.00'),
          line.totalHoursSt,
          line.totalHoursOt,
          formatMoney(line.rateSt),
          formatMoney(line.rateOt),
          formatMoney(line.fringeCreditHourly),
          formatMoney(line.paymentInLieuHourly),
          formatMoney(line.grossProject),
          formatMoney(line.grossAllWork),
          formatMoney(line.dedTaxWithholdings),
          formatMoney(line.dedFica),
          formatMoney(line.dedOther),
          line.dedOtherNote,
          formatMoney(line.dedTotal),
          formatMoney(line.netPay),
          line.wdBaseRate ? formatMoney(line.wdBaseRate) : '',
          line.wdFringeRate ? formatMoney(line.wdFringeRate) : '',
          payroll.supersededByNumber,
        ]),
      );
    }
  }
  return `${rows.join('\r\n')}\r\n`;
}

/** The Audit Binder's manifest: one row per file, with what proves it. */
export const MANIFEST_COLUMNS = [
  'file',
  'payroll_number',
  'week_ending_date',
  'kind',
  'sha256',
  'byte_size',
  'wd_number',
  'modification_number',
  'publication_date',
  'generated_at',
] as const;
