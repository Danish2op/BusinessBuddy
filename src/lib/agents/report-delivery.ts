import type { ServiceResult } from "./types";
import { serviceFailure, serviceSuccess } from "./types";
import type { HuntReportDraft } from "./hunt";

type ReportInsertRow = Omit<HuntReportDraft, "should_alert" | "alert_subject" | "alert_body">;

type InsertedReport = {
  id: string;
  signal_hash: string;
};

type DeliverHuntReportsDependencies = {
  ownerEmail?: string | null;
  insertReports(rows: ReportInsertRow[]): Promise<ServiceResult<InsertedReport[]>>;
  sendEmail(input: {
    to: string;
    subject: string;
    text: string;
  }): Promise<ServiceResult<{ id: string }>>;
  markEmailSent(input: {
    reportId: string;
    emailId: string;
  }): Promise<ServiceResult<unknown>>;
};

function toInsertRow(report: HuntReportDraft): ReportInsertRow {
  const { should_alert: _shouldAlert, alert_subject: _alertSubject, alert_body: _alertBody, ...row } = report;
  return row;
}

function emailTextFor(report: HuntReportDraft): string {
  return [
    report.alert_body || report.summary,
    "",
    report.source_url ? `Source: ${report.source_url}` : "",
    "Advisor suggestion: Review the move against your moat, then decide whether to respond aggressively, defend your current positioning, or pivot toward a less-contested segment."
  ]
    .filter(Boolean)
    .join("\n");
}

export async function deliverHuntReports(
  reports: HuntReportDraft[],
  dependencies: DeliverHuntReportsDependencies
): Promise<ServiceResult<{ insertedReports: number; emailedReports: number; emailFailures: number }>> {
  if (reports.length === 0) {
    return serviceSuccess({ insertedReports: 0, emailedReports: 0, emailFailures: 0 });
  }

  const inserted = await dependencies.insertReports(reports.map(toInsertRow));
  if (!inserted.ok) {
    return inserted;
  }

  const insertedHashes = new Set(inserted.data.map((report) => report.signal_hash));
  const insertedByHash = new Map(inserted.data.map((report) => [report.signal_hash, report]));
  const ownerEmail = dependencies.ownerEmail?.trim();
  let emailedReports = 0;
  let emailFailures = 0;

  if (!ownerEmail) {
    return serviceSuccess({
      insertedReports: inserted.data.length,
      emailedReports,
      emailFailures
    });
  }

  for (const report of reports) {
    if (!insertedHashes.has(report.signal_hash)) {
      continue;
    }

    const insertedReport = insertedByHash.get(report.signal_hash);
    if (!insertedReport) {
      continue;
    }

    const email = await dependencies.sendEmail({
      to: ownerEmail,
      subject: report.alert_subject || `Strategic Alert: ${report.title}`,
      text: emailTextFor(report)
    });

    if (!email.ok) {
      emailFailures += 1;
      continue;
    }

    const marked = await dependencies.markEmailSent({
      reportId: insertedReport.id,
      emailId: email.data.id
    });

    if (!marked.ok) {
      emailFailures += 1;
      continue;
    }

    emailedReports += 1;
  }

  return serviceSuccess({
    insertedReports: inserted.data.length,
    emailedReports,
    emailFailures
  });
}
