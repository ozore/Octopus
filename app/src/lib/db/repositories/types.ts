/**
 * Inferred row types for every table, in one place, so repository modules
 * don't each re-derive `typeof table.$inferSelect`.
 *
 * Spec: ARCHITECTURE.md §5.1 / §5.2 (the operational schema and the outcome
 * corpus) — this module has no behaviour, only names.
 */

import type { schema } from '../schema';

export type Customer = typeof schema.customers.$inferSelect;
export type NewCustomer = typeof schema.customers.$inferInsert;

export type CaseRow = typeof schema.cases.$inferSelect;
export type NewCaseRow = typeof schema.cases.$inferInsert;

export type NoticeDocument = typeof schema.noticeDocuments.$inferSelect;
export type NewNoticeDocument = typeof schema.noticeDocuments.$inferInsert;

export type Classification = typeof schema.classifications.$inferSelect;
export type NewClassification = typeof schema.classifications.$inferInsert;

export type CorpusSliceRef = typeof schema.corpusSliceRefs.$inferSelect;
export type NewCorpusSliceRef = typeof schema.corpusSliceRefs.$inferInsert;

export type Draft = typeof schema.drafts.$inferSelect;
export type NewDraft = typeof schema.drafts.$inferInsert;

export type Citation = typeof schema.citations.$inferSelect;
export type NewCitation = typeof schema.citations.$inferInsert;

export type Critique = typeof schema.critiques.$inferSelect;
export type NewCritique = typeof schema.critiques.$inferInsert;

export type HumanEdit = typeof schema.humanEdits.$inferSelect;
export type NewHumanEdit = typeof schema.humanEdits.$inferInsert;

export type Payment = typeof schema.payments.$inferSelect;
export type NewPayment = typeof schema.payments.$inferInsert;

export type StripeEventRow = typeof schema.stripeEvents.$inferSelect;
export type NewStripeEventRow = typeof schema.stripeEvents.$inferInsert;

export type ScheduledEmail = typeof schema.scheduledEmails.$inferSelect;
export type NewScheduledEmail = typeof schema.scheduledEmails.$inferInsert;

export type ShieldAccount = typeof schema.shieldAccounts.$inferSelect;
export type NewShieldAccount = typeof schema.shieldAccounts.$inferInsert;

export type InboundNotice = typeof schema.inboundNotices.$inferSelect;
export type NewInboundNotice = typeof schema.inboundNotices.$inferInsert;

export type Consent = typeof schema.consents.$inferSelect;
export type NewConsent = typeof schema.consents.$inferInsert;

export type OutcomeReport = typeof schema.outcomeReports.$inferSelect;
export type NewOutcomeReport = typeof schema.outcomeReports.$inferInsert;

export type L4Record = typeof schema.l4Records.$inferSelect;
export type NewL4Record = typeof schema.l4Records.$inferInsert;

export type CitationUse = typeof schema.citationUses.$inferSelect;
export type NewCitationUse = typeof schema.citationUses.$inferInsert;
