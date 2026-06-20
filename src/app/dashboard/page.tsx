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
    .select("id,monitoring_enabled")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return <WarRoom companyId={company?.id} monitoringEnabled={company?.monitoring_enabled ?? false} />;
}
