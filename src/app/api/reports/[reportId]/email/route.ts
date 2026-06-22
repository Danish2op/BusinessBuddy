import { NextResponse } from "next/server";

import { buildReportEmail } from "@/lib/agents/report-delivery";
import { createResendClient } from "@/lib/resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    reportId: string;
  };
};

export async function POST(_request: Request, { params }: RouteContext) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "No email is attached to this account." }, { status: 400 });
  }

  const { data: report, error } = await supabase
    .from("intelligence_reports")
    .select("id,title,summary,source_url,category,risk_level,companies!inner(user_id)")
    .eq("id", params.reportId)
    .eq("companies.user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load this feed item.", detail: error.message }, { status: 500 });
  }

  if (!report) {
    return NextResponse.json({ error: "Feed item not found." }, { status: 404 });
  }

  const email = buildReportEmail(
    {
      title: report.title,
      summary: report.summary,
      source_url: report.source_url,
      category: report.category,
      risk_level: report.risk_level
    },
    { mode: "manual" }
  );
  const resend = createResendClient();
  const sent = await resend.sendEmail({
    to: user.email,
    subject: email.subject,
    text: email.text,
    html: email.html
  });

  if (!sent.ok) {
    return NextResponse.json({ error: "Could not send feed brief email.", detail: sent.error.message }, { status: 502 });
  }

  await supabase
    .from("intelligence_reports")
    .update({
      email_sent_at: new Date().toISOString(),
      email_id: sent.data.id
    })
    .eq("id", report.id);

  return NextResponse.json({ sent: true, email_id: sent.data.id });
}
