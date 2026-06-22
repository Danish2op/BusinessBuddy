import { describe, expect, it } from "vitest";

import { serviceSuccess, type ServiceResult } from "./types";
import { deliverHuntReports } from "./report-delivery";
import type { HuntReportDraft } from "./hunt";

describe("deliverHuntReports", () => {
  const report: HuntReportDraft = {
    competitor_id: "competitor-1",
    company_id: "company-1",
    title: "Competitor launched a free plan",
    summary: "A competitor added a free plan that pressures your starter offer.",
    source_url: "https://competitor.example/pricing",
    source_title: "Pricing update",
    category: "Pricing",
    risk_level: "med",
    signal_hash: "signal-1",
    should_alert: false,
    alert_subject: "Strategic Alert: free plan launched",
    alert_body: "What happened: free plan. Suggested response: sharpen onboarding proof."
  };

  it("emails every newly inserted feed entry, even when should_alert is false", async () => {
    const sent: unknown[] = [];
    const marked: unknown[] = [];

    const result = await deliverHuntReports([report], {
      ownerEmail: "founder@example.com",
      insertReports: async (rows) => serviceSuccess(rows.map((row) => ({ id: "report-1", signal_hash: row.signal_hash }))),
      sendEmail: async (email): Promise<ServiceResult<{ id: string }>> => {
        sent.push(email);
        return serviceSuccess({ id: "email-1" });
      },
      markEmailSent: async (marker) => {
        marked.push(marker);
        return serviceSuccess(null);
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected delivery success.");
    }
    expect(result.data).toEqual({
      insertedReports: 1,
      emailedReports: 1
    });
    expect(sent).toEqual([
      {
        to: "founder@example.com",
        subject: "Strategic Alert: free plan launched",
        text: expect.stringContaining("Suggested response")
      }
    ]);
    expect(marked).toEqual([
      {
        reportId: "report-1",
        emailId: "email-1"
      }
    ]);
  });

  it("does not email duplicate reports that were ignored by the database", async () => {
    const sent: unknown[] = [];

    const result = await deliverHuntReports([report], {
      ownerEmail: "founder@example.com",
      insertReports: async () => serviceSuccess([]),
      sendEmail: async (email) => {
        sent.push(email);
        return serviceSuccess({ id: "email-1" });
      },
      markEmailSent: async () => serviceSuccess(null)
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected delivery success.");
    }
    expect(result.data.insertedReports).toBe(0);
    expect(result.data.emailedReports).toBe(0);
    expect(sent).toEqual([]);
  });
});
