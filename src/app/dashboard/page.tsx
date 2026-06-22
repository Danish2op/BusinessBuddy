import { WarRoom } from "@/components/dashboard/war-room";
import type { ChatMessage } from "@/components/advisor/advisor-chat";
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
    .select("id,name,moat_description,monitoring_enabled,setup_status,ai_generated_profile,competitors(id,comp_name,website,linkedin_url,knowledge_block,analysis_summary,risk_level)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!company || company.setup_status !== "complete") {
    redirect("/setup");
  }

  const profile = company?.ai_generated_profile as
    | {
        website_knowledge_block?: {
          summary?: string;
          offerings?: string[];
          positioning?: string;
          keywords?: string[];
        };
      }
    | null
    | undefined;

  const { data: reports } = await supabase
    .from("intelligence_reports")
    .select("id,title,summary,category,risk_level,source_url,created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: advisorMessages } = await supabase
    .from("advisor_messages")
    .select("role,content,citations")
    .eq("company_id", company.id)
    .order("created_at", { ascending: true })
    .limit(40);

  const chatHistory: ChatMessage[] = (advisorMessages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: message.content,
      citations: Array.isArray(message.citations) ? message.citations.filter((citation): citation is string => typeof citation === "string") : []
    }));

  return (
    <WarRoom
      companyId={company?.id}
      companyName={company?.name}
      moatDescription={company?.moat_description}
      monitoringEnabled={company.monitoring_enabled === true}
      knowledgeBlock={profile?.website_knowledge_block}
      competitors={company?.competitors ?? []}
      reports={reports ?? []}
      advisorMessages={chatHistory}
    />
  );
}
