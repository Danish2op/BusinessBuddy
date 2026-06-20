import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const OnboardingInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required."),
  website: z.string().trim().url("Company website must be a valid URL."),
  linkedin_url: optionalUrl,
  moat_description: z.string().trim().min(12, "Moat description needs more detail."),
  team_details: z.string().trim().min(2, "Team details are required."),
  industry: z.string().trim().min(2, "Industry is required.")
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
  analysis_summary: z.string(),
  risk_level: z.enum(["low", "med", "high"])
});

export type CompetitorRecord = z.infer<typeof CompetitorRecordSchema>;
