import { SetupForm } from "@/components/setup/setup-form";

export default function SetupPage() {
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
        <SetupForm />
      </section>
    </main>
  );
}
