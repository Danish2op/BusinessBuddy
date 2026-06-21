import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeOptionalHttpUrl } from "@/lib/url";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    companyId?: string;
    comp_name?: string;
    website?: string;
    linkedin_url?: string;
  } | null;

  if (!payload?.companyId || !payload.comp_name?.trim()) {
    return NextResponse.json({ error: "companyId and comp_name are required." }, { status: 400 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const website = normalizeOptionalHttpUrl(payload.website);
  const linkedin = normalizeOptionalHttpUrl(payload.linkedin_url);
  const { data, error } = await supabase
    .from("competitors")
    .insert({
      company_id: company.id,
      comp_name: payload.comp_name.trim(),
      website,
      analysis_summary: linkedin ? `Manual competitor. LinkedIn: ${linkedin}` : "Manual competitor.",
      risk_level: "med"
    })
    .select("id,comp_name,website,analysis_summary,risk_level")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not add competitor." }, { status: 500 });
  }

  return NextResponse.json(data);
}
