import { NextResponse } from "next/server";

import { runOnboardingMapping } from "@/lib/agents/onboarding";
import { createGeminiClient } from "@/lib/gemini";
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

  const payload = await request.json().catch(() => null);
  const mapped = await runOnboardingMapping(payload, {
    gemini: createGeminiClient(),
    tavily: createTavilyClient()
  });

  if (!mapped.ok) {
    return NextResponse.json({ error: mapped.error.message, code: mapped.error.code }, { status: 400 });
  }

  const companyInsert = {
    user_id: user.id,
    name: mapped.data.company.name,
    website: mapped.data.company.website,
    linkedin_url: mapped.data.company.linkedin_url,
    moat_description: mapped.data.company.moat_description,
    team_details: mapped.data.company.team_details,
    industry: mapped.data.company.industry,
    ai_generated_profile: mapped.data.ai_generated_profile
  };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert(companyInsert)
    .select("id")
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: "Could not save company profile." }, { status: 500 });
  }

  if (mapped.data.competitors.length > 0) {
    const { error: competitorError } = await supabase.from("competitors").insert(
      mapped.data.competitors.map((competitor) => ({
        company_id: company.id,
        ...competitor
      }))
    );

    if (competitorError) {
      return NextResponse.json({ error: "Could not save competitors." }, { status: 500 });
    }
  }

  return NextResponse.json({
    companyId: company.id,
    aiGeneratedProfile: mapped.data.ai_generated_profile,
    competitors: mapped.data.competitors
  });
}
