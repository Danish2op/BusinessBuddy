import { WarRoom } from "@/components/dashboard/war-room";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,moat_description,ai_generated_profile,competitors(id,comp_name,website,analysis_summary,risk_level),intelligence_reports(id,summary,category,created_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const profile = company?.ai_generated_profile as
    | {
        monitoring_enabled?: unknown;
        website_knowledge_block?: {
          summary?: string;
          offerings?: string[];
          positioning?: string;
          keywords?: string[];
        };
      }
    | null
    | undefined;

  return (
    <WarRoom
      companyId={company?.id}
      companyName={company?.name}
      moatDescription={company?.moat_description}
      monitoringEnabled={profile?.monitoring_enabled === true}
      knowledgeBlock={profile?.website_knowledge_block}
      competitors={company?.competitors ?? []}
      reports={company?.intelligence_reports ?? []}
    />
  );
}
