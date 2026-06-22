import { NextResponse } from "next/server";

import { deliverHuntReports } from "@/lib/agents/report-delivery";
import { runContinuousHunt } from "@/lib/agents/hunt";
import { createGeminiClient } from "@/lib/gemini";
import { createResendClient } from "@/lib/resend";
import { rejectDisallowedOrigin } from "@/lib/security/route";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTavilyClient } from "@/lib/tavily";

export async function POST(request: Request) {
  const blocked = rejectDisallowedOrigin(request);
  if (blocked) {
    return blocked;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    companyId?: string;
    enabled?: boolean;
  } | null;

  if (!payload?.companyId || typeof payload.enabled !== "boolean") {
    return NextResponse.json({ error: "companyId and enabled are required." }, { status: 400 });
  }

  const { data: company, error: readError } = await supabase
    .from("companies")
    .select("id,name,user_id,moat_description,setup_status,competitors(id,comp_name,website)")
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .single();

  if (readError || !company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update({
      monitoring_enabled: payload.enabled
    })
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .select("id,monitoring_enabled")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update monitoring." }, { status: 500 });
  }

  let huntSummary = {
    scannedCompetitors: 0,
    insertedReports: 0,
    emailedReports: 0
  };

  if (payload.enabled && company.setup_status === "complete" && (company.competitors ?? []).length > 0) {
    const hunt = await runContinuousHunt(
      {
        company,
        competitors: company.competitors ?? []
      },
      {
        gemini: createGeminiClient(),
        tavily: createTavilyClient(),
        resend: {
          sendAlert: async () => serviceSuccess({ id: "deferred-until-report-insert" })
        }
      }
    );

    if (!hunt.ok) {
      return NextResponse.json(
        {
          error: "Monitoring was enabled, but the first scan could not finish.",
          detail: hunt.error.message,
          id: data.id,
          monitoring_enabled: Boolean(data.monitoring_enabled),
          hunt_summary: huntSummary
        },
        { status: 202 }
      );
    }

    const admin = createSupabaseAdminClient();
    const resend = createResendClient();
    const delivery = await deliverHuntReports(hunt.data.reports, {
      ownerEmail: user.email,
      insertReports: async (rows) => {
        const { data: inserted, error: insertError } = await admin
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

        return serviceSuccess(inserted ?? []);
      },
      sendEmail: (email) =>
        resend.sendEmail({
          to: email.to,
          subject: email.subject,
          text: email.text
        }),
      markEmailSent: async ({ reportId, emailId }) => {
        const { error: updateError } = await admin
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
      return NextResponse.json(
        {
          error: "Monitoring was enabled, but alert email delivery failed.",
          detail: delivery.error.message,
          id: data.id,
          monitoring_enabled: Boolean(data.monitoring_enabled),
          hunt_summary: {
            ...huntSummary,
            scannedCompetitors: hunt.data.scannedCompetitors
          }
        },
        { status: 202 }
      );
    }

    huntSummary = {
      scannedCompetitors: hunt.data.scannedCompetitors,
      insertedReports: delivery.data.insertedReports,
      emailedReports: delivery.data.emailedReports
    };
  }

  return NextResponse.json({
    id: data.id,
    monitoring_enabled: Boolean(data.monitoring_enabled),
    hunt_summary: huntSummary
  });
}
