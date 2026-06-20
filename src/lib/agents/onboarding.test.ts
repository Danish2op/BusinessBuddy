import { describe, expect, it } from "vitest";
import { z } from "zod";

import { serviceSuccess, type ServiceResult } from "./types";
import { runOnboardingMapping } from "./onboarding";
import type { NormalizedTavilyResult } from "@/lib/tavily/normalize";

const validInput = {
  name: "BusinessBuddy",
  website: "https://businessbuddy.ai",
  linkedin_url: "https://linkedin.com/company/businessbuddy",
  moat_description: "AI competitive intelligence for founder-led SaaS teams.",
  team_details: "Small product team focused on strategy workflows.",
  industry: "SaaS"
};

describe("runOnboardingMapping", () => {
  it("passes fallback competitor queries to Tavily and returns top five competitors", async () => {
    const searchCalls: unknown[] = [];
    const tavilyResults = Array.from({ length: 6 }, (_, index): NormalizedTavilyResult => ({
      title: `Competitor ${index + 1}`,
      url: `https://competitor${index + 1}.com`,
      domain: `competitor${index + 1}.com`,
      content: `Competitor ${index + 1} summary`
    }));

    const result = await runOnboardingMapping(validInput, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          _prompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> =>
          serviceSuccess(
            schema.parse({
              positioning: "AI strategic intelligence for SaaS operators",
              customers: ["Founder-led SaaS teams"],
              offerings: ["Competitor monitoring", "Advisor briefs"],
              keywords: ["competitive intelligence", "SaaS", "strategy"]
            })
          )
      },
      tavily: {
        search: async (options) => {
          searchCalls.push(options);
          return serviceSuccess(tavilyResults);
        }
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(searchCalls[0]).toMatchObject({
      query: expect.stringContaining("Top competitors of BusinessBuddy"),
      fallbackQueries: expect.arrayContaining([
        expect.stringContaining("BusinessBuddy alternatives"),
        expect.stringContaining("competitive intelligence SaaS competitors")
      ])
    });
    expect(result.data.competitors).toHaveLength(5);
    expect(result.data.competitors[0]).toMatchObject({
      comp_name: "Competitor 1",
      website: "https://competitor1.com",
      risk_level: "med"
    });
  });

  it("returns a controlled validation failure for invalid onboarding input", async () => {
    const result = await runOnboardingMapping(
      {
        ...validInput,
        website: "bad url"
      },
      {
        gemini: {
          generateJsonWithSchema: async () =>
            serviceSuccess({
              positioning: "",
              customers: [],
              offerings: [],
              keywords: []
            })
        },
        tavily: {
          search: async () => serviceSuccess([])
        }
      }
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure.");
    }
    expect(result.error.code).toBe("invalid_onboarding_input");
  });
});
