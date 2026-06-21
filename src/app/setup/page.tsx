import { SetupForm } from "@/components/setup/setup-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,setup_status,competitor_suggestions(id,comp_name,website,linkedin_url,analysis_summary,risk_level,status,source_type)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (company?.setup_status === "complete") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-6 py-10 text-[var(--text-primary)]">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--amber)]">Strategic mapping</p>
          <h1 className="mt-3 text-3xl font-semibold">Configure command profile</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
            Define company, moat, team, and market. BusinessBuddy will derive strategic identity and seed the
            first competitor watchlist.
          </p>
        </div>
        <SetupForm
          initialCompanyId={company?.id}
          initialSuggestions={company?.competitor_suggestions?.filter((suggestion) => suggestion.status === "draft") ?? []}
        />
      </section>
    </main>
  );
}
