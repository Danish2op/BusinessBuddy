import { z } from "zod";

import { buildAdvisorChatPrompt } from "@/lib/gemini/prompts";

import type { ServiceResult } from "./types";
import { serviceFailure } from "./types";

export const AdvisorAnswerSchema = z.object({
  answer: z.string(),
  options: z.object({
    aggressive: z.string(),
    defensive: z.string(),
    pivot: z.string()
  }),
  citations: z.array(z.string()).default([])
});

export type AdvisorAnswer = z.infer<typeof AdvisorAnswerSchema>;

type AdvisorGemini = {
  generateJsonWithSchema<TSchema extends z.ZodTypeAny>(
    prompt: string,
    schema: TSchema
  ): Promise<ServiceResult<z.infer<TSchema>>>;
};

export type AdvisorContext = {
  company: {
    name: string;
    moat_description: string | null;
    ai_generated_profile?: unknown;
    competitors?: Array<{
      comp_name: string;
      analysis_summary: string | null;
      knowledge_block?: unknown;
      risk_level: string;
    }>;
  };
  reports: Array<{
    id: string;
    title?: string | null;
    summary: string;
    source_url: string | null;
    source_title?: string | null;
    category: string;
    risk_level?: string | null;
  }>;
};

function buildReportBrief(reports: AdvisorContext["reports"]): string {
  if (reports.length === 0) {
    return "No intelligence reports exist yet.";
  }

  return reports
    .map((report) =>
      JSON.stringify({
        id: report.id,
        title: report.title,
        category: report.category,
        risk_level: report.risk_level,
        summary: report.summary,
        source_url: report.source_url,
        source_title: report.source_title
      })
    )
    .join("\n");
}

function buildCompetitorBrief(competitors: NonNullable<AdvisorContext["company"]["competitors"]>) {
  if (competitors.length === 0) {
    return "No accepted competitors exist yet.";
  }

  return competitors
    .map((competitor) =>
      JSON.stringify({
        name: competitor.comp_name,
        risk_level: competitor.risk_level,
        summary: competitor.analysis_summary,
        knowledge_block: competitor.knowledge_block
      })
    )
    .join("\n");
}

export async function answerAdvisorQuestion(
  message: string,
  context: AdvisorContext,
  dependencies: { gemini: AdvisorGemini }
): Promise<ServiceResult<AdvisorAnswer>> {
  if (!message.trim()) {
    return serviceFailure({
      code: "empty_advisor_message",
      message: "Advisor message is required.",
      retryable: false
    });
  }

  return dependencies.gemini.generateJsonWithSchema(
    buildAdvisorChatPrompt({
      businessName: context.company.name,
      strategicBrief: [
        `Moat: ${context.company.moat_description ?? "Not provided."}`,
        `AI profile: ${JSON.stringify(context.company.ai_generated_profile ?? {})}`,
        "Accepted competitors:",
        buildCompetitorBrief(context.company.competitors ?? []),
        "Recent reports:",
        buildReportBrief(context.reports)
      ].join("\n"),
      userQuestion: message
    }),
    AdvisorAnswerSchema
  );
}
