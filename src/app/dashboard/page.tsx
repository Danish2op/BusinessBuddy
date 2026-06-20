import { WarRoom } from "@/components/dashboard/war-room";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <WarRoom />;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,ai_generated_profile")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const profile = company?.ai_generated_profile as { monitoring_enabled?: unknown } | null | undefined;

  return <WarRoom companyId={company?.id} monitoringEnabled={profile?.monitoring_enabled === true} />;
}
