import type { ServiceResult } from "./types";
import { serviceFailure, serviceSuccess } from "./types";
import type { HuntReportDraft } from "./hunt";

type ReportInsertRow = Omit<HuntReportDraft, "should_alert" | "alert_subject" | "alert_body">;

type InsertedReport = {
  id: string;
  signal_hash: string;
};

type ReportEmailInput = {
  title?: string | null;
  summary: string;
  source_url?: string | null;
  category: string;
  risk_level?: "low" | "med" | "high" | null;
  alert_body?: string | null;
};

type DeliverHuntReportsDependencies = {
  ownerEmail?: string | null;
  insertReports(rows: ReportInsertRow[]): Promise<ServiceResult<InsertedReport[]>>;
  sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
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

function riskLabel(risk: ReportEmailInput["risk_level"]): "low" | "med" | "high" {
  return risk ?? "low";
}

function emailTextFor(report: ReportEmailInput): string {
  const body = report.alert_body || report.summary;
  return [
    report.title ? `BusinessBuddy brief: ${report.title}` : "BusinessBuddy feed brief",
    "",
    body,
    "",
    `Impact: This signal may change how buyers compare your moat against a rival offer.`,
    "Suggested action: Review the move against your moat, then decide whether to respond aggressively, defend your current positioning, or pivot toward a less-contested segment.",
    report.source_url ? `Source: ${report.source_url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function riskColor(risk: ReportEmailInput["risk_level"]) {
  if (risk === "high") {
    return "#ef756d";
  }

  if (risk === "med") {
    return "#d6a640";
  }

  return "#8fbf63";
}

function emailHtmlFor(report: ReportEmailInput, mode: "automated" | "manual"): string {
  const title = escapeHtml(report.title || "Intelligence feed brief");
  const summary = escapeHtml(report.alert_body || report.summary).replaceAll("\n", "<br />");
  const sourceUrl = report.source_url ? escapeHtml(report.source_url) : "";
  const category = escapeHtml(report.category);
  const risk = escapeHtml(riskLabel(report.risk_level).toUpperCase());
  const color = riskColor(report.risk_level);
  const label = mode === "manual" ? "BusinessBuddy Feed Brief" : "BusinessBuddy Strategic Alert";
  const footer = mode === "manual"
    ? "Sent by BusinessBuddy because you requested this feed brief from your War-Room."
    : "Sent by BusinessBuddy because monitoring is enabled for this company. Feed entry is saved in your War-Room.";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#030607;color:#f2f5ed;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030607;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid rgba(168,188,175,0.24);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),#0d1618;box-shadow:0 28px 90px rgba(0,0,0,0.42);overflow:hidden;">
            <tr>
              <td style="padding:26px 28px;border-bottom:1px solid rgba(91,116,119,0.28);">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#d6a640;">${label}</div>
                <h1 style="margin:12px 0 0;font-size:26px;line-height:1.18;color:#f2f5ed;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px;">
                <div style="margin-bottom:18px;">
                  <span style="display:inline-block;margin-right:8px;border:1px solid rgba(214,166,64,0.35);border-radius:999px;padding:6px 10px;color:#d6a640;font-size:12px;">${category}</span>
                  <span style="display:inline-block;border:1px solid ${color};border-radius:999px;padding:6px 10px;color:${color};font-size:12px;">Risk ${risk}</span>
                </div>
                <div style="border:1px solid rgba(91,116,119,0.28);border-radius:14px;background:rgba(3,7,8,0.55);padding:18px;color:#c3ccc2;font-size:15px;line-height:1.65;">
                  ${summary}
                </div>
                <div style="margin-top:18px;border-left:3px solid #d6a640;padding:12px 14px;background:rgba(214,166,64,0.08);color:#c3ccc2;font-size:14px;line-height:1.55;">
                  <strong style="color:#f2f5ed;">Impact on your moat:</strong> This signal may change how buyers compare your positioning, price, or proof against a rival offer.
                </div>
                <div style="margin-top:18px;border-left:3px solid #8fbf63;padding:12px 14px;background:rgba(143,191,99,0.08);color:#c3ccc2;font-size:14px;line-height:1.55;">
                  <strong style="color:#f2f5ed;">Suggested action:</strong> Review this move against your moat, then choose aggressive response, defensive positioning, or pivot toward a less-contested segment.
                </div>
                ${
                  sourceUrl
                    ? `<a href="${sourceUrl}" style="display:inline-block;margin-top:22px;border-radius:12px;background:#d6a640;color:#030607;text-decoration:none;font-weight:700;padding:12px 16px;">Open source</a>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid rgba(91,116,119,0.28);color:#79867f;font-size:12px;line-height:1.6;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildReportEmail(
  report: ReportEmailInput,
  options: { mode: "automated" | "manual"; subject?: string }
): { subject: string; text: string; html: string } {
  const title = report.title || "Intelligence feed brief";
  return {
    subject: options.subject || (options.mode === "manual" ? `BusinessBuddy Feed Brief: ${title}` : `Strategic Alert: ${title}`),
    text: emailTextFor(report),
    html: emailHtmlFor(report, options.mode)
  };
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

    const reportEmail = buildReportEmail(report, {
      mode: "automated",
      subject: report.alert_subject || `Strategic Alert: ${report.title}`
    });
    const email = await dependencies.sendEmail({
      to: ownerEmail,
      subject: reportEmail.subject,
      text: reportEmail.text,
      html: reportEmail.html
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
