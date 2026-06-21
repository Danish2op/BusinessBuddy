import { NextResponse } from "next/server";

import { runOnboardingMapping } from "@/lib/agents/onboarding";
import { createGeminiClient } from "@/lib/gemini";
import { rejectDisallowedOrigin } from "@/lib/security/route";
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
    niche: mapped.data.company.niche,
    motive: mapped.data.company.motive,
    target_age_min: mapped.data.company.target_age_min,
    target_age_max: mapped.data.company.target_age_max,
    target_gender: mapped.data.company.target_gender,
    target_countries: mapped.data.company.target_countries,
    target_keywords: mapped.data.company.target_keywords,
    business_costing: mapped.data.company.business_costing,
    setup_status: "suggestions_ready",
    monitoring_enabled: false,
    ai_generated_profile: mapped.data.ai_generated_profile
  };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .upsert(companyInsert, { onConflict: "user_id" })
    .select("id")
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: "Could not save company profile." }, { status: 500 });
  }

  if (mapped.data.competitor_suggestions.length > 0) {
    const { error: competitorError } = await supabase.from("competitor_suggestions").upsert(
      mapped.data.competitor_suggestions.map((competitor) => ({
        company_id: company.id,
        ...competitor
      })),
      { onConflict: "company_id,website_domain" }
    );

    if (competitorError) {
      return NextResponse.json({ error: "Could not save competitor suggestions." }, { status: 500 });
    }
  }

  return NextResponse.json({
    companyId: company.id,
    aiGeneratedProfile: mapped.data.ai_generated_profile,
    competitorSuggestions: mapped.data.competitor_suggestions
  });
}
