import { NextResponse } from "next/server";

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
    companyId?: string;
    enabled?: boolean;
  } | null;

  if (!payload?.companyId || typeof payload.enabled !== "boolean") {
    return NextResponse.json({ error: "companyId and enabled are required." }, { status: 400 });
  }

  const { data: company, error: readError } = await supabase
    .from("companies")
    .select("id,ai_generated_profile")
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .single();

  if (readError || !company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const currentProfile =
    company.ai_generated_profile && typeof company.ai_generated_profile === "object"
      ? company.ai_generated_profile
      : {};

  const { data, error } = await supabase
    .from("companies")
    .update({
      ai_generated_profile: {
        ...currentProfile,
        monitoring_enabled: payload.enabled
      }
    })
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .select("id,ai_generated_profile")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update monitoring." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    monitoring_enabled: Boolean((data.ai_generated_profile as { monitoring_enabled?: unknown })?.monitoring_enabled)
  });
}
