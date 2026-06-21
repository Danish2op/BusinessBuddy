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
    .select("id,name,user_id,moat_description,monitoring_enabled,setup_status,competitors(id,comp_name,website)")
    .eq("monitoring_enabled", true)
    .eq("setup_status", "complete")
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
  const monitoredCompanies = companies ?? [];

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
          sendAlert: async () => ({ ok: true, data: { id: "deferred-until-report-insert" } })
        }
      }
    );

    if (result.ok && result.data.reports.length > 0) {
      const reportRows = result.data.reports.map(
        ({ should_alert: _shouldAlert, alert_subject: _alertSubject, alert_body: _alertBody, ...report }) => report
      );
      const { data: insertedReports, error: insertError } = await supabase
        .from("intelligence_reports")
        .upsert(reportRows, { onConflict: "company_id,signal_hash", ignoreDuplicates: true })
        .select("id,signal_hash");

      if (insertError) {
        return NextResponse.json({ error: "Could not save intelligence reports.", detail: insertError.message }, { status: 500 });
      }

      const insertedHashes = new Set((insertedReports ?? []).map((report) => report.signal_hash));
      reports.push(...(insertedReports ?? []));

      if (ownerEmail) {
        for (const report of result.data.reports) {
          if (!report.should_alert || !insertedHashes.has(report.signal_hash)) {
            continue;
          }

          const email = await resend.sendEmail({
            to: ownerEmail,
            subject: report.alert_subject || `Strategic Alert: ${report.title}`,
            text: report.alert_body || report.summary
          });

          if (email.ok) {
            await supabase
              .from("intelligence_reports")
              .update({
                email_sent_at: new Date().toISOString(),
                email_id: email.data.id
              })
              .eq("company_id", company.id)
              .eq("signal_hash", report.signal_hash);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, reports: reports.length });
}
