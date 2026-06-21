import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const commaList = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z.array(z.string().min(1)).default([])
);

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

export const OnboardingInputSchema = z
  .object({
    name: z.string().trim().min(1, "Company name is required."),
    website: z.string().trim().url("Company website must be a valid URL."),
    linkedin_url: optionalUrl,
    moat_description: z.string().trim().min(12, "Moat description needs more detail."),
    team_details: z.string().trim().min(2, "Team details are required."),
    industry: z.string().trim().min(2, "Industry is required."),
    niche: z.string().trim().min(2, "Niche is required."),
    motive: z.string().trim().min(2, "Business motive is required."),
    target_age_min: optionalNumber,
    target_age_max: optionalNumber,
    target_gender: z.string().trim().min(1, "Target gender is required."),
    target_countries: commaList,
    target_keywords: commaList,
    business_costing: z.string().trim().optional().default("")
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
  website_domain: z.string().optional(),
  analysis_summary: z.string(),
  risk_level: z.enum(["low", "med", "high"]),
  source_type: z.enum(["ai", "manual"]).default("ai"),
  knowledge_block: z
    .object({
      source_title: z.string().optional(),
      source_url: z.string().optional(),
      summary: z.string().optional(),
      score: z.number().optional()
    })
    .optional()
});

export type CompetitorRecord = z.infer<typeof CompetitorRecordSchema>;
