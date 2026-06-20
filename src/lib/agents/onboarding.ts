import type { z } from "zod";

import { buildStrategicIdentityPrompt } from "@/lib/gemini/prompts";
import type { NormalizedTavilyResult } from "@/lib/tavily/normalize";
import {
  OnboardingInputSchema,
  StrategicIdentitySchema,
  type CompetitorRecord,
  type OnboardingInput,
  type StrategicIdentity
} from "@/lib/schemas/onboarding";

import type { ServiceResult } from "./types";
import { serviceFailure, serviceSuccess } from "./types";

type GeminiLike = {
  generateJsonWithSchema<TSchema extends z.ZodTypeAny>(
    prompt: string,
    schema: TSchema
  ): Promise<ServiceResult<z.infer<TSchema>>>;
};

type TavilyLike = {
  search(options: {
    query: string;
    fallbackQueries?: string[];
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
  }): Promise<ServiceResult<NormalizedTavilyResult[]>>;
};

export type OnboardingMappingDependencies = {
  gemini: GeminiLike;
  tavily: TavilyLike;
};

export type OnboardingMappingResult = {
  company: OnboardingInput;
  ai_generated_profile: StrategicIdentity;
  competitors: CompetitorRecord[];
};

function competitorNameFromResult(result: NormalizedTavilyResult): string {
  const cleanTitle = result.title
    .replace(/\s+[-|].*$/, "")
    .replace(/\b(alternatives|competitors|reviews)\b/gi, "")
    .trim();

  return cleanTitle || result.domain.replace(/\..*$/, "");
}

function fallbackQueries(input: OnboardingInput, identity: StrategicIdentity): string[] {
  const keyword = identity.keywords[0] ?? input.industry;

  return [
    `${input.name} alternatives`,
    `${keyword} ${input.industry} competitors`,
    `best ${input.industry} tools for ${identity.customers[0] ?? "businesses"}`
  ];
}

export async function runOnboardingMapping(
  rawInput: unknown,
  dependencies: OnboardingMappingDependencies
): Promise<ServiceResult<OnboardingMappingResult>> {
  const parsed = OnboardingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return serviceFailure({
      code: "invalid_onboarding_input",
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
      retryable: false
    });
  }

  const input = parsed.data;
  const identity = await dependencies.gemini.generateJsonWithSchema(
    buildStrategicIdentityPrompt({
      businessName: input.name,
      industry: input.industry,
      website: input.website,
      description: input.moat_description
    }),
    StrategicIdentitySchema
  );

  if (!identity.ok) {
    return identity;
  }

  const search = await dependencies.tavily.search({
    query: `Top competitors of ${input.name} in ${input.industry} who offer ${identity.data.offerings.join(", ") || input.moat_description}`,
    fallbackQueries: fallbackQueries(input, identity.data),
    maxResults: 8,
    searchDepth: "basic"
  });

  if (!search.ok) {
    return search;
  }

  const competitors = search.data.slice(0, 5).map((result): CompetitorRecord => ({
    comp_name: competitorNameFromResult(result),
    website: result.url,
    analysis_summary: result.content || `Potential competitor in ${input.industry}.`,
    risk_level: "med"
  }));

  return serviceSuccess({
    company: input,
    ai_generated_profile: identity.data,
    competitors
  });
}
