import { Activity, BellRing, Bot, BrainCircuit, Radar, Shield, Sparkles, Target } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-10">
      <div className="aurora-field" />
      <div className="auth-grid" />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="animate-slide-in grid gap-8 py-8 lg:py-12">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[rgba(214,166,64,0.24)] bg-[rgba(214,166,64,0.08)] px-4 py-2 shadow-[0_0_36px_rgba(214,166,64,0.08)]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--amber)] text-black">
                <Radar size={19} />
              </span>
              <span>
                <span className="block text-sm font-semibold">BusinessBuddy</span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Strategic Intelligence Platform</span>
              </span>
            </div>

            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
              <Sparkles size={14} />
              Autonomous competitor monitoring
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Your market moves while you sleep. Your war-room should too.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              BusinessBuddy maps your moat, watches rivals, helps turn market noise into board-ready moves, and tells you what to do next before the threat reaches your customers.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: Radar, title: "Radar", copy: "Track accepted rivals only." },
              { icon: BellRing, title: "Alerts", copy: "Email briefs for real moves." },
              { icon: Bot, title: "Advisor", copy: "Stored strategy chat with context." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="auth-feature glass-tile animate-rise rounded-md p-4" key={item.title}>
                  <Icon size={18} className="text-[var(--amber)]" />
                  <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.copy}</p>
                </div>
              );
            })}
          </div>

          <div className="auth-orbit hidden h-[340px] max-w-3xl overflow-hidden rounded-md border border-[var(--border-strong)] bg-[rgba(7,13,15,0.46)] shadow-[0_28px_110px_rgba(0,0,0,0.45)] backdrop-blur md:block">
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="radar-sweep" />
            <div className="orbit-core">
              <Shield size={34} />
              <span>MOAT</span>
            </div>
            <div className="orbit-node orbit-node-a"><Target size={15} /> Pricing shift</div>
            <div className="orbit-node orbit-node-b"><Activity size={15} /> Hiring spike</div>
            <div className="orbit-node orbit-node-c"><BrainCircuit size={15} /> Product launch</div>
          </div>
        </div>

        <div className="relative animate-rise">
          <div className="absolute -inset-5 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(214,166,64,0.18),transparent_60%)] blur-xl" />
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
