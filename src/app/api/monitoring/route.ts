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

  const { data, error } = await supabase
    .from("companies")
    .update({ monitoring_enabled: payload.enabled })
    .eq("id", payload.companyId)
    .eq("user_id", user.id)
    .select("id,monitoring_enabled")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not update monitoring." }, { status: 500 });
  }

  return NextResponse.json(data);
}
