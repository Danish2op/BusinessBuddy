import { NextResponse } from "next/server";

import { deliverHuntReports } from "@/lib/agents/report-delivery";
import { runContinuousHunt } from "@/lib/agents/hunt";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";
import { createGeminiClient } from "@/lib/gemini";
import { createResendClient } from "@/lib/resend";
import { rejectDisallowedOrigin } from "@/lib/security/route";
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

  const payload = (await request.json().catch(() => null)) as { companyId?: string } | null;
  if (!payload?.companyId) {
    return NextResponse.json({ error: "companyId is required." }, { status: 400 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,user_id,moat_description,competitors(id,comp_name,website)")
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const resend = createResendClient();
  const result = await runContinuousHunt(
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

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const delivery = await deliverHuntReports(result.data.reports, {
    ownerEmail: user.email,
    insertReports: async (rows) => {
      const { data: inserted, error } = await admin
        .from("intelligence_reports")
        .upsert(rows, { onConflict: "company_id,signal_hash", ignoreDuplicates: true })
        .select("id,signal_hash");

      if (error) {
        return serviceFailure({
          code: "report_insert_failed",
          message: error.message,
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
        text: email.text,
        html: email.html
      }),
    markEmailSent: async ({ reportId, emailId }) => {
      const { error } = await admin
        .from("intelligence_reports")
        .update({
          email_sent_at: new Date().toISOString(),
          email_id: emailId
        })
        .eq("id", reportId);

      if (error) {
        return serviceFailure({
          code: "report_email_mark_failed",
          message: error.message,
          provider: "supabase",
          retryable: false
        });
      }

      return serviceSuccess(null);
    }
  });

  if (!delivery.ok) {
    return NextResponse.json({ error: delivery.error.message, code: delivery.error.code }, { status: 400 });
  }

  return NextResponse.json({
    ...result.data,
    delivery: delivery.data
  });
}
