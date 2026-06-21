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
  industry: "SaaS",
  niche: "Founder-led SaaS strategy",
  motive: "Help small SaaS teams outmaneuver incumbents.",
  target_age_min: 25,
  target_age_max: 54,
  target_gender: "all",
  target_countries: ["US", "Canada"],
  target_keywords: ["competitive intelligence", "SaaS"],
  business_costing: "$99/mo"
};

describe("runOnboardingMapping", () => {
  it("passes fallback competitor queries to Tavily and returns draft competitor suggestions", async () => {
    const searchCalls: unknown[] = [];
    const tavilyResults = Array.from({ length: 6 }, (_, index): NormalizedTavilyResult => ({
      title: `Competitor ${index + 1}`,
      url: `https://competitor${index + 1}.com`,
      domain: `competitor${index + 1}.com`,
      content: `Competitor ${index + 1} summary`
    }));
    let geminiCalls = 0;

    const result = await runOnboardingMapping(validInput, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          _prompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> => {
          geminiCalls += 1;
          if (geminiCalls === 1) {
            return serviceSuccess(
              schema.parse({
                positioning: "AI strategic intelligence for SaaS operators",
                customers: ["Founder-led SaaS teams"],
                offerings: ["Competitor monitoring", "Advisor briefs"],
                keywords: ["competitive intelligence", "SaaS", "strategy"]
              })
            );
          }

          return serviceSuccess(
            schema.parse({
              competitors: tavilyResults.map((item, index) => ({
                name: `Competitor ${index + 1}`,
                website: item.url,
                linkedin_url: null,
                logo_url: null,
                description: `Competitor ${index + 1} summary`,
                evidence_urls: [item.url]
              }))
            })
          );
        }
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
    expect(result.data.competitor_suggestions).toHaveLength(6);
    expect(result.data.competitor_suggestions[0]).toMatchObject({
      comp_name: "Competitor 1",
      website: "https://competitor1.com/",
      website_domain: "competitor1.com",
      source_type: "ai",
      risk_level: "med",
      logo_url: "https://logo.clearbit.com/competitor1.com"
    });
  });

  it("extracts real companies from listicle search results instead of storing article pages as competitors", async () => {
    const broadResults: NormalizedTavilyResult[] = [
      {
        title: "Best Brokers for Algorithmic Trading in the United States in 2026",
        url: "https://brokerchooser.com/best-brokers/best-brokers-for-algo-trading-in-the-united-states",
        domain: "brokerchooser.com",
        content: "After testing brokers, Alpaca Trading is the best broker for algorithmic trading."
      },
      {
        title: "The 7 Best Algorithmic Trading Platforms & Software in 2026",
        url: "https://stockanalysis.com/article/algorithmic-trading-software",
        domain: "stockanalysis.com",
        content: "QuantConnect, TradeStation, NinjaTrader, and TradingView support algorithmic trading workflows."
      }
    ];
    const lookupResults: Record<string, NormalizedTavilyResult[]> = {
      Alpaca: [
        {
          title: "Alpaca - Developer-first trading API",
          url: "https://alpaca.markets/",
          domain: "alpaca.markets",
          content: "Alpaca provides commission-free stock trading API and brokerage infrastructure."
        },
        {
          title: "Alpaca | LinkedIn",
          url: "https://www.linkedin.com/company/alpaca-markets/",
          domain: "linkedin.com",
          content: "Alpaca company profile."
        }
      ],
      QuantConnect: [
        {
          title: "QuantConnect - Algorithmic Trading Platform",
          url: "https://www.quantconnect.com/",
          domain: "quantconnect.com",
          content: "QuantConnect is an open algorithmic trading platform for quants and developers."
        }
      ]
    };
    let geminiCalls = 0;

    const result = await runOnboardingMapping(validInput, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          _prompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> => {
          geminiCalls += 1;
          if (geminiCalls === 1) {
            return serviceSuccess(
              schema.parse({
                positioning: "Algorithmic trading intelligence for active traders",
                customers: ["Retail algorithmic traders"],
                offerings: ["Broker API monitoring"],
                keywords: ["algorithmic trading", "broker API"]
              })
            );
          }

          return serviceSuccess(
            schema.parse({
              competitors: [
                {
                  name: "Alpaca",
                  website: null,
                  linkedin_url: null,
                  logo_url: null,
                  description: "Developer-first trading API and brokerage platform.",
                  evidence_urls: [broadResults[0].url]
                },
                {
                  name: "QuantConnect",
                  website: null,
                  linkedin_url: null,
                  logo_url: null,
                  description: "Algorithmic trading research and backtesting platform.",
                  evidence_urls: [broadResults[1].url]
                }
              ]
            })
          );
        }
      },
      tavily: {
        search: async (options) => {
          const query = options.query.toLowerCase();
          if (query.includes("alpaca")) {
            return serviceSuccess(lookupResults.Alpaca);
          }
          if (query.includes("quantconnect")) {
            return serviceSuccess(lookupResults.QuantConnect);
          }
          return serviceSuccess(broadResults);
        }
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.competitor_suggestions).toHaveLength(2);
    expect(result.data.competitor_suggestions.map((item) => item.comp_name)).toEqual(["Alpaca", "QuantConnect"]);
    expect(result.data.competitor_suggestions[0]).toMatchObject({
      website: "https://alpaca.markets/",
      linkedin_url: "https://www.linkedin.com/company/alpaca-markets/",
      website_domain: "alpaca.markets",
      logo_url: "https://logo.clearbit.com/alpaca.markets"
    });
    expect(result.data.competitor_suggestions.map((item) => item.website_domain)).not.toContain("brokerchooser.com");
    expect(result.data.competitor_suggestions.map((item) => item.website_domain)).not.toContain("stockanalysis.com");
  });

  it("does not create fallback competitors from article pages when no official company evidence exists", async () => {
    const searchResults: NormalizedTavilyResult[] = [
      {
        title: "10 AI Tools Changing Algo Trading",
        url: "https://marketwatch.example.com/ai-tools-algo-trading",
        domain: "marketwatch.example.com",
        content: "A roundup article mentions several broad categories but no official company profile."
      }
    ];
    let geminiCalls = 0;

    const result = await runOnboardingMapping(validInput, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          _prompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> => {
          geminiCalls += 1;
          if (geminiCalls === 1) {
            return serviceSuccess(
              schema.parse({
                positioning: "Algorithmic trading intelligence",
                customers: ["Retail traders"],
                offerings: ["Trading signals"],
                keywords: ["algo trading"]
              })
            );
          }

          return serviceSuccess(schema.parse({ competitors: [] }));
        }
      },
      tavily: {
        search: async () => serviceSuccess(searchResults)
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.competitor_suggestions).toEqual([]);
  });

  it("includes the full setup profile in the strategic identity prompt", async () => {
    let identityPrompt = "";

    await runOnboardingMapping(validInput, {
      gemini: {
        generateJsonWithSchema: async <TSchema extends z.ZodTypeAny>(
          prompt: string,
          schema: TSchema
        ): Promise<ServiceResult<z.infer<TSchema>>> => {
          if (!identityPrompt) {
            identityPrompt = prompt;
            return serviceSuccess(
              schema.parse({
                positioning: "AI strategic intelligence for SaaS operators",
                customers: ["Founder-led SaaS teams"],
                offerings: ["Competitor monitoring"],
                keywords: ["competitive intelligence"]
              })
            );
          }

          return serviceSuccess(schema.parse({ competitors: [] }));
        }
      },
      tavily: {
        search: async () => serviceSuccess([])
      }
    });

    expect(identityPrompt).toContain("Small product team focused on strategy workflows.");
    expect(identityPrompt).toContain("Founder-led SaaS strategy");
    expect(identityPrompt).toContain("Help small SaaS teams outmaneuver incumbents.");
    expect(identityPrompt).toContain("US");
    expect(identityPrompt).toContain("$99/mo");
  });

  it("returns a controlled validation failure for invalid onboarding input", async () => {
    const result = await runOnboardingMapping(
      {
        ...validInput,
        moat_description: "short"
      },
      {
        gemini: {
          generateJsonWithSchema: async () =>
            serviceSuccess({
              positioning: "AI strategic intelligence for SaaS operators",
              customers: ["Founder-led SaaS teams"],
              offerings: ["Competitor monitoring", "Advisor briefs"],
              keywords: ["competitive intelligence", "SaaS", "strategy"]
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
