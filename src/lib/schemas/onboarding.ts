import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string" || !value.trim()) {
      return undefined;
    }

    const raw = value.trim();
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  },
  z
    .string()
    .url()
    .refine((value) => {
      try {
        return new URL(value).hostname.includes(".");
      } catch {
        return false;
      }
    }, "URL must include a valid domain.")
    .optional()
);

function listInput(defaultItems: string[] = []) {
  return z.preprocess(
  (value) =>
      Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : typeof value === "string"
          ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          : value,
    z.array(z.string().min(1)).default(defaultItems)
  );
}

const countryList = listInput(["Global"]).transform((items) => (items.length > 0 ? items : ["Global"]));
const keywordList = listInput([]);

const optionalNumber = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  },
  z.number().int().min(0).max(120).optional()
);

const optionalText = z.string().trim().optional().default("");

const targetGender = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : "all"),
  z.string().trim().min(1)
);

export const OnboardingInputSchema = z
  .object({
    name: z.string().trim().min(1, "Company name is required."),
    website: optionalUrl,
    linkedin_url: optionalUrl,
    moat_description: z.string().trim().min(12, "Moat description needs more detail."),
    team_details: optionalText,
    industry: z.string().trim().min(2, "Industry is required."),
    niche: optionalText,
    motive: optionalText,
    target_age_min: optionalNumber,
    target_age_max: optionalNumber,
    target_gender: targetGender,
    target_countries: countryList,
    target_keywords: keywordList,
    business_costing: optionalText
  })
  .superRefine((value, context) => {
    if (
      typeof value.target_age_min === "number" &&
      typeof value.target_age_max === "number" &&
      value.target_age_max < value.target_age_min
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target age max must be greater than or equal to target age min.",
        path: ["target_age_max"]
      });
    }
  });

export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

export const StrategicIdentitySchema = z.object({
  positioning: z.string(),
  customers: z.array(z.string()).default([]),
  offerings: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([])
});

export type StrategicIdentity = z.infer<typeof StrategicIdentitySchema>;

export const CompetitorRecordSchema = z.object({
  comp_name: z.string(),
  website: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  website_domain: z.string().optional(),
  analysis_summary: z.string(),
  risk_level: z.enum(["low", "med", "high"]),
  source_type: z.enum(["ai", "manual"]).default("ai"),
  knowledge_block: z
    .object({
      source_title: z.string().optional(),
      source_url: z.string().optional(),
      summary: z.string().optional(),
      logo_url: z.string().optional(),
      evidence_urls: z.array(z.string()).optional(),
      score: z.number().optional()
    })
    .optional()
});

export type CompetitorRecord = z.infer<typeof CompetitorRecordSchema>;

const nullableUrl = z.string().url().nullable().optional();

export const CompetitorCompanyExtractionSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        website: nullableUrl,
        linkedin_url: nullableUrl,
        logo_url: nullableUrl,
        description: z.string().trim().min(1),
        evidence_urls: z.array(z.string().url()).default([])
      })
    )
    .default([])
});

export type CompetitorCompanyExtraction = z.infer<typeof CompetitorCompanyExtractionSchema>;
