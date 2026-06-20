import { NextResponse } from "next/server";

import { answerAdvisorQuestion } from "@/lib/agents/advisor";
import { createGeminiClient } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,moat_description,ai_generated_profile")
    .eq("id", payload.companyId)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const { data: reports } = await supabase
    .from("intelligence_reports")
    .select("id,summary,source_url,category")
    .eq("company_id", payload.companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  const answer = await answerAdvisorQuestion(payload.message ?? "", {
    company,
    reports: reports ?? []
  }, {
    gemini: createGeminiClient()
  });

  if (!answer.ok) {
    return NextResponse.json({ error: answer.error.message, code: answer.error.code }, { status: 400 });
  }

  return NextResponse.json(answer.data);
}
