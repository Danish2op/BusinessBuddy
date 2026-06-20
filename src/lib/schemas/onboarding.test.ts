import { describe, expect, it } from "vitest";

import { OnboardingInputSchema } from "./onboarding";

describe("OnboardingInputSchema", () => {
  it("accepts a valid business profile", () => {
    const parsed = OnboardingInputSchema.parse({
      name: "BusinessBuddy",
      website: "https://businessbuddy.ai",
      linkedin_url: "https://linkedin.com/company/businessbuddy",
      moat_description: "High-touch intelligence for founder-led SaaS teams.",
      team_details: "Three-person product and growth team.",
      industry: "SaaS"
    });

    expect(parsed.name).toBe("BusinessBuddy");
  });

  it("rejects missing company name and invalid urls", () => {
    const parsed = OnboardingInputSchema.safeParse({
      name: "",
      website: "not a url",
      linkedin_url: "also bad",
      moat_description: "We help operators monitor competitors.",
      team_details: "Small team.",
      industry: "SaaS"
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["name", "website", "linkedin_url"])
    );
  });
});
