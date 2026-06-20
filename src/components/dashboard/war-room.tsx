import { Activity, AlertTriangle, Radar, Shield } from "lucide-react";

import { AdvisorChat } from "@/components/advisor/advisor-chat";
import { MonitoringToggle } from "@/components/dashboard/monitoring-toggle";

const competitors = [
  { name: "Northstar AI", risk: "high", signal: "Launched pricing page update" },
  { name: "SignalForge", risk: "med", signal: "Hiring enterprise AE team" },
  { name: "ScoutOps", risk: "low", signal: "Published comparison guide" }
];

const feed = [
  "Pricing signal detected from Northstar AI",
  "Hiring expansion suggests enterprise push",
  "Product launch language overlaps your moat"
];

export function WarRoom() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-[var(--border-muted)] bg-[#090d10] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radar size={18} className="text-[var(--amber)]" />
            BusinessBuddy
          </div>
          <nav className="mt-8 grid gap-2 text-sm text-[var(--text-secondary)]">
            {["Dashboard", "Intelligence", "Competitors", "Strategy", "Risks", "Settings"].map((item) => (
              <a key={item} className="rounded-md px-3 py-2 hover:bg-[var(--bg-panel)]" href="#">
                {item}
              </a>
            ))}
          </nav>
        </aside>
        <section className="p-5 lg:p-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--amber)]">War-room active</p>
              <h1 className="mt-2 text-2xl font-semibold">Battlefield State</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--border-muted)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Activity size={16} className="text-[var(--green)]" />
              Last scan: standby
            </div>
            <MonitoringToggle />
          </header>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield size={18} className="text-[var(--green)]" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Strategic Summary</h2>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Market pressure is moderate. Main watch item is pricing compression from adjacent AI intelligence
                tools. Defend with workflow depth and founder-grade brief quality.
              </p>
            </section>
            <section className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-[var(--amber)]" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Radar View</h2>
              </div>
              <div className="grid gap-3">
                {competitors.map((competitor) => (
                  <div key={competitor.name} className="flex items-center justify-between rounded border border-[var(--border-muted)] p-3">
                    <div>
                      <p className="text-sm font-medium">{competitor.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{competitor.signal}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs ${competitor.risk === "high" ? "bg-[var(--red)] text-white" : competitor.risk === "med" ? "bg-[var(--amber)] text-black" : "bg-[var(--green)] text-black"}`}>
                      {competitor.risk}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="mt-5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Intelligence Feed</h2>
            <div className="grid gap-3">
              {feed.map((item) => (
                <div key={item} className="border-l-2 border-[var(--amber)] pl-3 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
      <AdvisorChat />
    </main>
  );
}
