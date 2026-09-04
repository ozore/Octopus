/**
 * M15's job handlers — `specs/15` §2 steps 4-5, §6.
 *
 * `render_gap_report` is a JOB and not a request for one reason that is in the
 * spec: **a visitor who closes the tab still gets the email** (A5). It also
 * happens to be where the source files are deleted, which is the promise
 * printed next to the drop zone.
 *
 * `purge_gap_reports` runs daily and is what makes "deleted after 7 days" a
 * fact rather than a sentence.
 */

import { getAdapters } from '@octopus/platform/adapters';
import type { JobRegistry } from '@octopus/platform/jobs';

import { getDb } from '../db';
import { purgeGapReports, renderGapReport } from './render';

export const GAP_REPORT_JOB_KINDS = {
  render: 'certly.render_gap_report',
  purge: 'certly.purge_gap_reports',
} as const;

export function registerGapReportJobs(registry: JobRegistry): void {
  registry.override(GAP_REPORT_JOB_KINDS.render, async (payload) => {
    const sessionId = String(payload['sessionId'] ?? '');
    if (!sessionId) return;
    const db = await getDb();
    await renderGapReport(db, getAdapters(), { sessionId });
  });

  registry.override(GAP_REPORT_JOB_KINDS.purge, async () => {
    const db = await getDb();
    await purgeGapReports(db, {});
  });
}
