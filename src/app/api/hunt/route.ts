import { NextResponse } from "next/server";

import { runContinuousHunt } from "@/lib/agents/hunt";
import { createGeminiClient } from "@/lib/gemini";
import { createResendClient } from "@/lib/resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTavilyClient } from "@/lib/tavily";

export async function POST(request: Request) {
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
    .select("id,name,moat_description,competitors(id,comp_name,website)")
    .eq("id", payload.companyId)
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
    await supabase.from("intelligence_reports").insert(
      result.data.reports.map(({ risk_level: _riskLevel, ...report }) => report)
    );
  }

  return NextResponse.json(result.data);
}
