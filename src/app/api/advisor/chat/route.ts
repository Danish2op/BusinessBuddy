import { NextResponse } from "next/server";

import { answerAdvisorQuestion } from "@/lib/agents/advisor";
import { createGeminiClient } from "@/lib/gemini";
import { rejectDisallowedOrigin } from "@/lib/security/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    message?: string;
    companyId?: string;
  } | null;

  if (!payload?.companyId) {
    return NextResponse.json({ error: "companyId is required." }, { status: 400 });
  }

  if (!payload.message?.trim()) {
    return NextResponse.json({ error: "Advisor message is required.", code: "empty_advisor_message" }, { status: 400 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,moat_description,ai_generated_profile,competitors(id,comp_name,analysis_summary,knowledge_block,risk_level)")
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const { data: reports } = await supabase
    .from("intelligence_reports")
    .select("id,title,summary,source_url,source_title,category,risk_level")
    .eq("company_id", payload.companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  await supabase.from("advisor_messages").insert({
    company_id: payload.companyId,
    role: "user",
    content: payload.message
  });

  const answer = await answerAdvisorQuestion(payload.message, {
    company,
    reports: reports ?? []
  }, {
    gemini: createGeminiClient()
  });

  if (!answer.ok) {
    return NextResponse.json({ error: answer.error.message, code: answer.error.code }, { status: 400 });
  }

  await supabase.from("advisor_messages").insert({
    company_id: payload.companyId,
    role: "assistant",
    content: answer.data.answer,
    citations: answer.data.citations
  });

  return NextResponse.json(answer.data);
}
