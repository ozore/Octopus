/**
 * The typed shape of one certified payroll as the generator sees it.
 *
 * **THE RENDERER TAKES A VALUE, NOT A DATABASE.** Everything the WH-347 prints
 * is already frozen onto `payrolls` and `payroll_lines` at creation — the
 * worker's name, the last four, the classification label, both rates, the
 * pinned `(wd_number, modification_number)` — because a certified payroll is a
 * signed federal statement and nothing upstream may change what it says. Making
 * the renderer's input a plain value rather than a query is what lets the
 * golden-file tests render a 3-worker and a 20-worker form from committed
 * fixtures with no database at all, and what makes "the same payroll renders to
 * the same bytes" (V5) a property of a pure function.
 */

/** WH-347 column (1E) is FOUR characters. No type here can hold more. */
export type Last4 = string;

export type FringeCreditLine = {
  /** page 2, "FB NAME" */
  planName: string;
  /** page 2, "FB TYPE" */
  planType: string;
  /** page 2, "PLAN NO." */
  planNo: string | null;
  /** page 2, the Funded / Unfunded checkbox pair */
  isFunded: boolean;
  /** page 2, "Hourly Credit $" */
  hourlyCredit: string;
};

export type Wh347Row = {
  /** (1A) */ entryNo: number;
  /** (1B) */ lastName: string;
  /** (1C) */ firstName: string;
  /** (1D) */ middleInitial: string | null;
  /** (1E) — four characters, and there is no code path that prints more. */
  identifyingNoLast4: Last4;
  /** (2) */ workerStatus: 'J' | 'RA';
  /** (3) */ classificationLabel: string;
  /** (4) seven ST cells, workweek order */ hoursSt: string[];
  /** (4) seven OT cells, workweek order */ hoursOt: string[];
  /** (5) */ totalHoursSt: string;
  /** (5) */ totalHoursOt: string;
  /** (6A) */ rateSt: string;
  /** (6A) */ rateOt: string;
  /** (6B) */ fringeCreditHourly: string;
  /** (6C) */ paymentInLieuHourly: string;
  /** (7A) */ grossProject: string;
  /** (7B) */ grossAllWork: string;
  /** (8a) */ dedTaxWithholdings: string;
  /** (8b) */ dedFica: string;
  /** (8c) */ dedOther: string;
  /** (8c) "MUST SPECIFY" */ dedOtherNote: string | null;
  /** (8d) */ dedTotal: string;
  /** (9)  */ netPay: string;
  /** page 2, the plans (6B) was paid to. */
  fringeCredits: FringeCreditLine[];
};

export type ApprenticeshipRow = {
  programName: string;
  /** 'OA' | 'SAA' — the form's checkbox pair, and the two are not interchangeable. */
  registrar: 'OA' | 'SAA';
  registeredClassification: string;
};

export type DocumentProvenance = {
  wdNumber: string;
  modificationNumber: number;
  publicationDate: string;
  /**
   * Present when the project is pinned to a superseded modification — the 29
   * CFR 1.6 case. WL-06 V14: a shared PDF carries the same provenance the
   * screen does, so the newer modification is named in the footer and the pin
   * is never moved by us.
   */
  newerModification?: { modificationNumber: number; publicationDate: string } | null;
};

export type Wh347Model = {
  header: {
    /** hdr.final_payroll_flag */ isFinal: boolean;
    /** hdr.role_prime / hdr.role_sub */ ourRole: 'prime' | 'sub';
    /** hdr.project_name */ projectName: string;
    /** hdr.project_or_contract_no */ projectOrContractNo: string;
    /** hdr.certified_payroll_no — null only on a draft preview (M4). */
    payrollNumber: number | null;
    /** hdr.business_name */ businessName: string;
    /** hdr.project_location */ projectLocation: string;
    /** hdr.wage_determination_no — the field the product exists to fill right. */
    wageDeterminationNo: string;
    /** hdr.week_ending_date */ weekEndingDate: string;
    /** hdr.business_address — the ORGANISATION's, never a person's (gate G7). */
    businessAddress: string;
  };
  provenance: DocumentProvenance;
  certifyingOfficial: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  additionalRemarks: string;
  apprenticeshipPrograms: ApprenticeshipRow[];
  rows: Wh347Row[];
  /** V9 — the header prints, the grid says so, and the number is consumed. */
  noWorkPerformed: boolean;
  /** Pins `CreationDate`; a draft preview passes the draft's `updated_at`. */
  certifiedAt: Date;
  /** V1 — a preview is watermarked and nothing is stored. */
  draft: boolean;
  /** From `APP_NAME` and `APP_BASE_URL`; never a literal (WL-11 V8). */
  productName: string;
  productUrl: string;
};

export const ROWS_PER_GRID_PAGE = 8;

/** `Rivera, Ada M` — the order the form's three name columns print in. */
export function displayName(row: Pick<Wh347Row, 'lastName' | 'firstName' | 'middleInitial'>): string {
  const middle = row.middleInitial ? ` ${row.middleInitial}` : '';
  return `${row.lastName}, ${row.firstName}${middle}`;
}

/** Only the workers whose (6B) is non-zero appear in the page-2 fringe block —
 *  that is the block's own trigger, printed on the form. */
export function rowsWithFringeCredit(rows: Wh347Row[]): Wh347Row[] {
  return rows.filter((row) => Number(row.fringeCreditHourly) > 0);
}
