import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-6 py-10 text-[var(--text-primary)]">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
        <div className="pt-10">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--amber)]">BusinessBuddy</p>
          <h1 className="mt-4 text-4xl font-semibold">Strategic intelligence command center</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            Monitor competitor movements, identify threats to your moat, and get tactical response options.
          </p>
        </div>
        <AuthForm />
      </section>
    </main>
  );
}
