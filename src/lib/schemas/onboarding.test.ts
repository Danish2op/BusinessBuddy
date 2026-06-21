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
      industry: "SaaS",
      niche: "Founder-led SaaS intelligence",
      motive: "Win strategic accounts before larger rivals notice.",
      target_age_min: "25",
      target_age_max: "54",
      target_gender: "all",
      target_countries: "US, Canada, Global",
      target_keywords: "competitive intelligence, SaaS, founders",
      business_costing: "$99-$299/mo"
    });

    expect(parsed.name).toBe("BusinessBuddy");
    expect(parsed.target_age_min).toBe(25);
    expect(parsed.target_countries).toEqual(["US", "Canada", "Global"]);
    expect(parsed.target_keywords).toEqual(["competitive intelligence", "SaaS", "founders"]);
  });

  it("rejects missing company name and invalid urls", () => {
    const parsed = OnboardingInputSchema.safeParse({
      name: "",
      website: "not a url",
      linkedin_url: "also bad",
      moat_description: "We help operators monitor competitors.",
      team_details: "Small team.",
      industry: "SaaS",
      niche: "",
      motive: "Grow",
      target_age_min: "70",
      target_age_max: "20",
      target_gender: "all",
      target_countries: "",
      target_keywords: "",
      business_costing: ""
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["name", "website", "linkedin_url", "niche", "target_age_max"])
    );
  });
});
