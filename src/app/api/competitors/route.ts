import { NextResponse } from "next/server";

import { rejectDisallowedOrigin } from "@/lib/security/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { domainFromHttpUrl, normalizeOptionalHttpUrl } from "@/lib/url";

function logoFromWebsite(website: string | null) {
  const domain = domainFromHttpUrl(website);
  return domain ? `https://logo.clearbit.com/${domain}` : null;
}

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
  const logoUrl = logoFromWebsite(website);
  const { data, error } = await supabase
    .from("competitors")
    .insert({
      company_id: company.id,
      comp_name: payload.comp_name.trim(),
      website,
      linkedin_url: linkedin,
      website_domain: domainFromHttpUrl(website),
      source_type: "manual",
      knowledge_block: {
        logo_url: logoUrl
      },
      analysis_summary: linkedin ? `Manual competitor. LinkedIn: ${linkedin}` : "Manual competitor.",
      risk_level: "med"
    })
    .select("id,comp_name,website,linkedin_url,knowledge_block,analysis_summary,risk_level")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not add competitor." }, { status: 500 });
  }

  return NextResponse.json(data);
}
