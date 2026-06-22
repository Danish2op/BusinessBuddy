import { NextResponse } from "next/server";

import { deliverHuntReports } from "@/lib/agents/report-delivery";
import { runContinuousHunt, isAuthorizedCronRequest } from "@/lib/agents/hunt";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";
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
  let insertedReports = 0;
  let emailedReports = 0;
  let emailFailures = 0;
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
      const delivery = await deliverHuntReports(result.data.reports, {
        ownerEmail,
        insertReports: async (rows) => {
          const { data: insertedReports, error: insertError } = await supabase
            .from("intelligence_reports")
            .upsert(rows, { onConflict: "company_id,signal_hash", ignoreDuplicates: true })
            .select("id,signal_hash");

          if (insertError) {
            return serviceFailure({
              code: "report_insert_failed",
              message: insertError.message,
              provider: "supabase",
              retryable: false
            });
          }

          return serviceSuccess(insertedReports ?? []);
        },
        sendEmail: (email) =>
          resend.sendEmail({
            to: email.to,
            subject: email.subject,
            text: email.text
          }),
        markEmailSent: async ({ reportId, emailId }) => {
          const { error: updateError } = await supabase
            .from("intelligence_reports")
            .update({
              email_sent_at: new Date().toISOString(),
              email_id: emailId
            })
            .eq("id", reportId);

          if (updateError) {
            return serviceFailure({
              code: "report_email_mark_failed",
              message: updateError.message,
              provider: "supabase",
              retryable: false
            });
          }

          return serviceSuccess(null);
        }
      });

      if (!delivery.ok) {
        return NextResponse.json({ error: "Could not deliver intelligence reports.", detail: delivery.error.message }, { status: 500 });
      }

      insertedReports += delivery.data.insertedReports;
      emailedReports += delivery.data.emailedReports;
      emailFailures += delivery.data.emailFailures;
    }
  }

  return NextResponse.json({
    ok: true,
    monitoredCompanies: monitoredCompanies.length,
    reports: insertedReports,
    emailedReports,
    emailFailures
  });
}
