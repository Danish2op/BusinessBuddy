import { NextResponse } from "next/server";

import { runContinuousHunt } from "@/lib/agents/hunt";
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
        sendAlert: (alert) =>
          resend.sendEmail({
            to: user.email ?? "alerts@danis.live",
            subject: alert.subject,
            text: alert.text
          })
      }
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }

  if (result.data.reports.length > 0) {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("intelligence_reports")
      .upsert(
        result.data.reports.map(({ should_alert: _shouldAlert, alert_subject: _alertSubject, alert_body: _alertBody, ...report }) => report),
        { onConflict: "company_id,signal_hash", ignoreDuplicates: true }
      );

    if (error) {
      return NextResponse.json({ error: "Could not save intelligence reports." }, { status: 500 });
    }
  }

  return NextResponse.json(result.data);
}
