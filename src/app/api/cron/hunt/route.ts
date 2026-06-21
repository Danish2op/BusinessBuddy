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
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id,name,user_id,moat_description,ai_generated_profile,competitors(id,comp_name,website)")
    .limit(25);

  if (companiesError) {
    return NextResponse.json(
      {
        error: "Could not load monitored companies.",
        detail: companiesError.message
      },
      { status: 500 }
    );
  }

  const gemini = createGeminiClient();
  const tavily = createTavilyClient();
  const resend = createResendClient();
  const reports = [];

  const monitoredCompanies = (companies ?? []).filter((company) => {
    const profile = company.ai_generated_profile as { monitoring_enabled?: unknown } | null;
    return profile?.monitoring_enabled === true;
  });

  const ownerIds = Array.from(new Set(monitoredCompanies.map((company) => company.user_id).filter(Boolean)));
  const { data: profiles, error: profilesError } =
    ownerIds.length > 0
      ? await supabase.from("profiles").select("id,email").in("id", ownerIds)
      : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json(
      {
        error: "Could not load alert recipients.",
        detail: profilesError.message
      },
      { status: 500 }
    );
  }

  const emailByOwnerId = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]));

  for (const company of monitoredCompanies) {
    const ownerEmail = emailByOwnerId.get(company.user_id)?.trim();
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
            ownerEmail
              ? resend.sendEmail({
                  to: ownerEmail,
                  subject: payload.subject,
                  text: payload.text
                })
              : Promise.resolve({
                  ok: false,
                  error: {
                    code: "missing_alert_recipient",
                    message: "Company owner profile has no email address.",
                    retryable: false
                  }
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
