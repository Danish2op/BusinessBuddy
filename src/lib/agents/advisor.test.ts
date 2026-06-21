import { describe, expect, it } from "vitest";
import { z } from "zod";

import { serviceFailure, serviceSuccess, type ServiceResult } from "./types";
import { answerAdvisorQuestion } from "./advisor";

describe("answerAdvisorQuestion", () => {
  const context = {
    company: {
      name: "BusinessBuddy",
      moat_description: "Fast competitor monitoring for founder-led SaaS teams.",
      ai_generated_profile: { positioning: "Strategic intelligence for SaaS operators" }
    },
    reports: [
      {
        id: "report-1",
        summary: "Competitor launched a cheaper startup plan.",
        source_url: "https://competitor.com/pricing",
        category: "Pricing"
      }
    ]
  };

  it("rejects empty messages", async () => {
    const result = await answerAdvisorQuestion("   ", context, {
      gemini: {
        generateJsonWithSchema: async () => serviceSuccess({})
      }
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected empty message failure.");
    }
    expect(result.error.code).toBe("empty_advisor_message");
  });

  it("builds report context and returns three strategic options", async () => {
    let prompt = "";
    const result = await answerAdvisorQuestion("How should we respond?", context, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          nextPrompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> => {
          prompt = nextPrompt;
          return serviceSuccess(
            schema.parse({
              answer: "Respond with pricing segmentation.",
              options: {
                aggressive: "Launch a direct comparison campaign.",
                defensive: "Bundle onboarding and support into current plans.",
                pivot: "Target larger teams less sensitive to starter pricing."
              },
              citations: ["report-1"]
            })
          );
        }
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected advisor answer.");
    }

    expect(prompt).toContain("report-1");
    expect(prompt).toContain("Competitor launched a cheaper startup plan.");
    expect(result.data.options).toEqual({
      aggressive: expect.any(String),
      defensive: expect.any(String),
      pivot: expect.any(String)
    });
  });

  it("accepts partial advisor option objects from the model", async () => {
    const result = await answerAdvisorQuestion("What should we do?", context, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          _nextPrompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> =>
          serviceSuccess(
            schema.parse({
              answer: "Focus the response on trust and onboarding.",
              options: {
                defensive: "Publish a value comparison for your current segment."
              },
              citations: []
            })
          )
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected advisor answer.");
    }
    expect(result.data.options.aggressive).toBe("");
    expect(result.data.options.defensive).toContain("value comparison");
    expect(result.data.options.pivot).toBe("");
  });

  it("returns controlled provider failures", async () => {
    const result = await answerAdvisorQuestion("What changed?", context, {
      gemini: {
        generateJsonWithSchema: async () =>
          serviceFailure({
            code: "gemini_down",
            message: "Provider unavailable",
            provider: "gemini",
            retryable: true
          })
      }
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected provider failure.");
    }
    expect(result.error.code).toBe("gemini_down");
  });
});
