import { describe, expect, it } from "vitest";
import { z } from "zod";

import { serviceSuccess, type ServiceResult } from "./types";
import { isAuthorizedCronRequest, runContinuousHunt } from "./hunt";
import type { NormalizedTavilyResult } from "@/lib/tavily/normalize";

describe("isAuthorizedCronRequest", () => {
  it("accepts only the expected bearer token", () => {
    expect(isAuthorizedCronRequest(new Headers({ authorization: "Bearer secret" }), "secret")).toBe(true);
    expect(isAuthorizedCronRequest(new Headers({ authorization: "Bearer wrong" }), "secret")).toBe(false);
    expect(isAuthorizedCronRequest(new Headers(), "secret")).toBe(false);
  });
});

describe("runContinuousHunt", () => {
  const company = {
    id: "company-1",
    name: "BusinessBuddy",
    moat_description: "Fast moat-aware competitor monitoring for SaaS founders."
  };
  const competitor = {
    id: "competitor-1",
    comp_name: "Northstar AI",
    website: "https://northstar.example"
  };

  it("creates a report and sends alert when strategic threat is medium or high", async () => {
    const sent: unknown[] = [];
    const result = await runContinuousHunt(
      { company, competitors: [competitor] },
      {
        tavily: {
          search: async (): Promise<ServiceResult<NormalizedTavilyResult[]>> =>
            serviceSuccess([
              {
                title: "Northstar AI launches cheaper plan",
                url: "https://northstar.example/pricing",
                domain: "northstar.example",
                content: "New pricing directly undercuts SaaS monitoring tools."
              }
            ])
        },
        gemini: {
          generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
            _prompt: string,
            schema: TSchema
          ): Promise<ServiceResult<z.infer<TSchema>>> =>
            serviceSuccess(
              schema.parse({
                summary: "Northstar AI launched cheaper pricing that pressures BusinessBuddy positioning.",
                category: "Pricing",
                risk_level: "high",
                should_alert: true,
                alert_subject: "Strategic Alert: Northstar AI pricing move"
              })
            )
        },
        resend: {
          sendAlert: async (payload) => {
            sent.push(payload);
            return serviceSuccess({ id: "email-1" });
          }
        }
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected hunt success.");
    }
    expect(result.data.reports).toHaveLength(1);
    expect(result.data.reports[0]).toMatchObject({
      competitor_id: "competitor-1",
      company_id: "company-1",
      category: "Pricing",
      risk_level: "high"
    });
    expect(sent).toHaveLength(1);
  });

  it("returns no reports when Tavily finds no results", async () => {
    const result = await runContinuousHunt(
      { company, competitors: [competitor] },
      {
        tavily: { search: async () => serviceSuccess([]) },
        gemini: {
          generateJsonWithSchema: async () =>
            serviceSuccess({
              summary: "",
              category: "News",
              risk_level: "low",
              should_alert: false,
              alert_subject: ""
            })
        },
        resend: { sendAlert: async () => serviceSuccess({ id: "email-1" }) }
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected hunt success.");
    }
    expect(result.data.reports).toEqual([]);
    expect(result.data.scannedCompetitors).toBe(1);
  });
});
