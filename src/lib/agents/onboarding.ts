import type { z } from "zod";

import { buildCompetitorCompanyExtractionPrompt, buildStrategicIdentityPrompt } from "@/lib/gemini/prompts";
import type { NormalizedTavilyResult } from "@/lib/tavily/normalize";
import { domainFromHttpUrl, normalizeOptionalHttpUrl } from "@/lib/url";
import {
  CompetitorCompanyExtractionSchema,
  OnboardingInputSchema,
  StrategicIdentitySchema,
  type CompetitorRecord,
  type CompetitorCompanyExtraction,
  type OnboardingInput,
  type StrategicIdentity
} from "@/lib/schemas/onboarding";

import type { ServiceResult } from "./types";
import { serviceFailure, serviceSuccess } from "./types";

type GeminiLike = {
  generateJsonWithSchema<TSchema extends z.ZodTypeAny>(
    prompt: string,
    schema: TSchema,
    options?: { temperature?: number; maxOutputTokens?: number }
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
  competitor_suggestions: CompetitorRecord[];
};

const EXCLUDED_COMPETITOR_DOMAINS = [
  "brokerchooser.com",
  "stockanalysis.com",
  "g2.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "investing.com",
  "b2broker.com",
  "forbes.com",
  "investopedia.com",
  "capterra.com",
  "softwareadvice.com",
  "trustradius.com",
  "trustpilot.com",
  "wikipedia.org",
  "medium.com",
  "substack.com",
  "crunchbase.com",
  "producthunt.com"
];

type ExtractedCompetitor = CompetitorCompanyExtraction["competitors"][number];

function normalizeCompanyKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isExcludedWebsiteDomain(domain: string | null | undefined) {
  if (!domain) {
    return false;
  }

  const normalized = domain.replace(/^www\./i, "").toLowerCase();
  return EXCLUDED_COMPETITOR_DOMAINS.some((excluded) => normalized === excluded || normalized.endsWith(`.${excluded}`));
}

function isLinkedInCompanyUrl(url: string | null | undefined) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase() === "linkedin.com" && parsed.pathname.startsWith("/company/");
  } catch {
    return false;
  }
}

function companyLogoFromWebsite(website: string | null | undefined) {
  const domain = domainFromHttpUrl(website);
  return domain ? `https://logo.clearbit.com/${domain}` : undefined;
}

function chooseOfficialWebsite(candidate: ExtractedCompetitor, lookupResults: NormalizedTavilyResult[]) {
  const candidateWebsite = normalizeOptionalHttpUrl(candidate.website);
  const candidateDomain = domainFromHttpUrl(candidateWebsite);
  if (candidateWebsite && !isExcludedWebsiteDomain(candidateDomain) && !isLinkedInCompanyUrl(candidateWebsite)) {
    return candidateWebsite;
  }

  const nameKey = normalizeCompanyKey(candidate.name);
  const candidates = lookupResults
    .map((result) => normalizeOptionalHttpUrl(result.url))
    .filter((url): url is string => Boolean(url))
    .filter((url) => {
      const domain = domainFromHttpUrl(url);
      return !isExcludedWebsiteDomain(domain) && !isLinkedInCompanyUrl(url);
    });

  const strongDomainMatch = candidates.find((url) => {
    const domain = domainFromHttpUrl(url);
    const domainKey = normalizeCompanyKey(domain?.split(".")[0] ?? "");
    return domainKey.length > 2 && (nameKey.includes(domainKey) || domainKey.includes(nameKey));
  });

  return strongDomainMatch;
}

function chooseLinkedInUrl(candidate: ExtractedCompetitor, lookupResults: NormalizedTavilyResult[]) {
  const candidateLinkedIn = normalizeOptionalHttpUrl(candidate.linkedin_url);
  if (isLinkedInCompanyUrl(candidateLinkedIn)) {
    return candidateLinkedIn;
  }

  return lookupResults
    .map((result) => normalizeOptionalHttpUrl(result.url))
    .find((url): url is string => isLinkedInCompanyUrl(url));
}

function dedupeExtractedCompanies(candidates: ExtractedCompetitor[]) {
  const seen = new Set<string>();
  const deduped: ExtractedCompetitor[] = [];

  for (const candidate of candidates) {
    const key = normalizeCompanyKey(candidate.name);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
}

function fallbackQueries(input: OnboardingInput, identity: StrategicIdentity): string[] {
  const keyword = identity.keywords[0] ?? input.industry;

  return [
    `${input.name} alternatives`,
    `${keyword} ${input.industry} competitors`,
    `best ${input.industry} tools for ${identity.customers[0] ?? "businesses"}`
  ];
}

async function enrichExtractedCompetitor(
  candidate: ExtractedCompetitor,
  tavily: TavilyLike
): Promise<CompetitorRecord | null> {
  const lookup = await tavily.search({
    query: `${candidate.name} official website LinkedIn company`,
    maxResults: 5,
    searchDepth: "basic"
  });
  const lookupResults = lookup.ok ? lookup.data : [];
  const website = chooseOfficialWebsite(candidate, lookupResults);
  const linkedin = chooseLinkedInUrl(candidate, lookupResults);
  const websiteDomain = domainFromHttpUrl(website);

  if ((!website && !linkedin) || isExcludedWebsiteDomain(websiteDomain)) {
    return null;
  }

  const logoUrl = normalizeOptionalHttpUrl(candidate.logo_url) ?? companyLogoFromWebsite(website);
  const firstEvidence = candidate.evidence_urls[0] ?? lookupResults[0]?.url;
  const bestSummary = candidate.description || lookupResults.find((result) => result.content)?.content;

  return {
    comp_name: candidate.name.trim(),
    website: website ?? undefined,
    linkedin_url: linkedin ?? undefined,
    logo_url: logoUrl ?? undefined,
    website_domain: websiteDomain ?? undefined,
    analysis_summary: bestSummary || `Potential competitor to monitor.`,
    risk_level: "med",
    source_type: "ai",
    knowledge_block: {
      source_title: lookupResults[0]?.title,
      source_url: firstEvidence,
      summary: bestSummary,
      logo_url: logoUrl ?? undefined,
      evidence_urls: Array.from(new Set([...candidate.evidence_urls, ...lookupResults.map((result) => result.url)])).slice(0, 6),
      score: lookupResults[0]?.score
    }
  };
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
      linkedinUrl: input.linkedin_url,
      description: input.moat_description,
      teamDetails: input.team_details,
      niche: input.niche,
      motive: input.motive,
      targetAgeMin: input.target_age_min,
      targetAgeMax: input.target_age_max,
      targetGender: input.target_gender,
      targetCountries: input.target_countries,
      targetKeywords: input.target_keywords,
      businessCosting: input.business_costing
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

  const extracted = await dependencies.gemini.generateJsonWithSchema(
    buildCompetitorCompanyExtractionPrompt({
      businessName: input.name,
      industry: input.industry,
      strategicIdentity: identity.data,
      searchResults: search.data.slice(0, 12).map((result) => ({
        title: result.title,
        url: result.url,
        domain: result.domain,
        content: result.content
      }))
    }),
    CompetitorCompanyExtractionSchema,
    { maxOutputTokens: 3500 }
  );

  if (!extracted.ok) {
    return extracted;
  }

  const extractedCandidates = dedupeExtractedCompanies(extracted.data.competitors).slice(0, 8);
  const enriched = await Promise.all(extractedCandidates.map((candidate) => enrichExtractedCompetitor(candidate, dependencies.tavily)));
  const competitorSuggestions = enriched.filter((competitor): competitor is CompetitorRecord => Boolean(competitor)).slice(0, 8);

  return serviceSuccess({
    company: input,
    ai_generated_profile: identity.data,
    competitor_suggestions: competitorSuggestions
  });
}
