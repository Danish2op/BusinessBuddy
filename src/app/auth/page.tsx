import { Activity, BellRing, Bot, BrainCircuit, Radar, Shield, Target } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="auth-landing relative min-h-[100dvh] overflow-hidden bg-[var(--bg-base)] px-5 py-5 text-[var(--text-primary)] sm:px-8">
      <div className="aurora-field" />
      <div className="auth-grid" />

      <section className="relative mx-auto grid min-h-[calc(100dvh-2.5rem)] max-w-7xl grid-rows-[auto_minmax(0,1fr)]">
        <header className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-mark grid h-10 w-10 place-items-center rounded-xl text-black">
              <Radar size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">BusinessBuddy</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">Market watch OS</p>
            </div>
          </div>
          <p className="hidden text-xs text-[var(--text-muted)] md:block">Competitor monitoring for founders</p>
        </header>

        <div className="grid min-h-0 items-center gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14 lg:py-8">
          <div className="animate-slide-in grid min-w-0 gap-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--amber)]">Autonomous competitor monitoring</p>
              <h1 className="auth-headline mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Know the move before it becomes the threat.
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-7 text-[var(--text-secondary)]">
                Map your moat, monitor rivals, and get clear response options when the market shifts.
              </p>
            </div>

            <div className="auth-intel-object hidden md:block" aria-hidden="true">
              <div className="intel-slab">
                <div className="intel-scanline" />
                <div className="intel-ring intel-ring-one" />
                <div className="intel-ring intel-ring-two" />
                <div className="intel-core">
                  <Shield size={30} />
                  <span>Moat</span>
                </div>
                <div className="intel-node intel-node-a"><Target size={14} /> Pricing change</div>
                <div className="intel-node intel-node-b"><Activity size={14} /> Hiring signal</div>
                <div className="intel-node intel-node-c"><BrainCircuit size={14} /> Product move</div>
              </div>
            </div>

            <div className="auth-proof-row grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-[1fr_1.1fr_1fr]">
              <div><Radar size={16} /> Rival radar</div>
              <div><BellRing size={16} /> Branded alert emails</div>
              <div><Bot size={16} /> Advisor memory</div>
            </div>
          </div>

          <div className="auth-form-wrap relative animate-rise">
            <AuthForm />
          </div>
        </div>
      </section>
    </main>
  );
}
