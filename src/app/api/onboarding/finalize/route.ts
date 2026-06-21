import { NextResponse } from "next/server";

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
    companyId?: string;
    acceptedIds?: string[];
    rejectedIds?: string[];
  } | null;

  if (!payload?.companyId || !Array.isArray(payload.acceptedIds)) {
    return NextResponse.json({ error: "companyId and acceptedIds are required." }, { status: 400 });
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

  const { data, error } = await supabase.rpc("finalize_competitors", {
    p_company_id: company.id,
    p_accepted_ids: payload.acceptedIds,
    p_rejected_ids: payload.rejectedIds ?? []
  });

  if (error) {
    return NextResponse.json({ error: "Could not finalize competitors.", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
