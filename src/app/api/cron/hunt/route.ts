import { NextResponse } from "next/server";

import { runContinuousHunt, isAuthorizedCronRequest } from "@/lib/agents/hunt";
import { getServerEnv } from "@/lib/env";
import { createGeminiClient } from "@/lib/gemini";
import { createResendClient } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createTavilyClient } from "@/lib/tavily";

export async function GET(request: Request) {
  const env = getServerEnv();
  if (!isAuthorizedCronRequest(request.headers, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id,name,moat_description,competitors(id,comp_name,website)")
    .eq("monitoring_enabled", true)
    .limit(25);

  const gemini = createGeminiClient();
  const tavily = createTavilyClient();
  const resend = createResendClient();
  const reports = [];

  for (const company of companies ?? []) {
    const result = await runContinuousHunt(
      {
        company,
        competitors: company.competitors ?? []
      },
      {
        gemini,
        tavily,
        resend: {
          sendAlert: (payload) =>
            resend.sendEmail({
              to: "alerts@danis.live",
              subject: payload.subject,
              text: payload.text
            })
        }
      }
    );

    if (result.ok && result.data.reports.length > 0) {
      reports.push(...result.data.reports);
      await supabase.from("intelligence_reports").insert(
        result.data.reports.map(({ risk_level: _riskLevel, ...report }) => report)
      );
    }
  }

  return NextResponse.json({ ok: true, reports: reports.length });
}
