import { Activity, AlertTriangle, Plus, Radar, Shield } from "lucide-react";

import { AdvisorChat } from "@/components/advisor/advisor-chat";
import { CompetitorForm } from "@/components/dashboard/competitor-form";
import { MonitoringToggle } from "@/components/dashboard/monitoring-toggle";
import { WebsiteIntelButton } from "@/components/dashboard/website-intel-button";

export type DashboardCompetitor = {
  id: string;
  comp_name: string;
  website: string | null;
  knowledge_block?: {
    logo_url?: string | null;
  } | null;
  analysis_summary: string | null;
  risk_level: "low" | "med" | "high";
};

export type DashboardReport = {
  id: string;
  title?: string | null;
  summary: string;
  category: string;
  risk_level?: "low" | "med" | "high" | null;
  source_url?: string | null;
  created_at: string | null;
};

type WarRoomProps = {
  companyId?: string;
  companyName?: string;
  moatDescription?: string | null;
  monitoringEnabled?: boolean;
  knowledgeBlock?: {
    summary?: string;
    offerings?: string[];
    positioning?: string;
    keywords?: string[];
  };
  competitors?: DashboardCompetitor[];
  reports?: DashboardReport[];
};

export function WarRoom({
  companyId,
  companyName = "No company configured",
  moatDescription,
  monitoringEnabled = false,
  knowledgeBlock,
  competitors = [],
  reports = []
}: WarRoomProps) {
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
              <h1 className="mt-2 text-2xl font-semibold">{companyName}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--border-muted)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Activity size={16} className="text-[var(--green)]" />
              Last scan: standby
            </div>
            <MonitoringToggle companyId={companyId} initialEnabled={monitoringEnabled} />
            <WebsiteIntelButton companyId={companyId} />
          </header>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield size={18} className="text-[var(--green)]" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Strategic Summary</h2>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {moatDescription ||
                  "Complete setup to create a moat profile. Monitoring stays paused until you turn it on."}
              </p>
              {knowledgeBlock?.summary && (
                <div className="mt-4 border-t border-[var(--border-muted)] pt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Website intel</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{knowledgeBlock.summary}</p>
                  {knowledgeBlock.positioning && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">Positioning: {knowledgeBlock.positioning}</p>
                  )}
                </div>
              )}
            </section>
            <section className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[var(--amber)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Radar View</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Plus size={14} />
                  Manual add below
                </div>
              </div>
              <div className="grid gap-3">
                {competitors.length === 0 && (
                  <p className="rounded border border-[var(--border-muted)] p-3 text-sm text-[var(--text-muted)]">
                    No competitors yet. Add one manually or run setup discovery.
                  </p>
                )}
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between gap-3 rounded border border-[var(--border-muted)] p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {competitor.knowledge_block?.logo_url ? (
                        <img
                          alt=""
                          className="h-9 w-9 rounded border border-[var(--border-muted)] bg-white object-contain p-1"
                          src={competitor.knowledge_block.logo_url}
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--border-muted)] bg-[#10161a] text-xs font-semibold text-[var(--amber)]">
                          {competitor.comp_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{competitor.comp_name}</p>
                        <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{competitor.analysis_summary || competitor.website || "Manual watch target"}</p>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs ${competitor.risk_level === "high" ? "bg-[var(--red)] text-white" : competitor.risk_level === "med" ? "bg-[var(--amber)] text-black" : "bg-[var(--green)] text-black"}`}>
                      {competitor.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <CompetitorForm companyId={companyId} />
          <section className="mt-5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em]">Intelligence Feed</h2>
            <div className="grid gap-3">
              {reports.length === 0 && <p className="text-sm text-[var(--text-muted)]">No reports yet.</p>}
              {reports.map((report) => (
                <div key={report.id} className="border-l-2 border-[var(--amber)] pl-3 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--amber)]">{report.category}</span> — {report.title ? `${report.title}: ` : ""}
                  {report.summary}
                  {report.source_url && (
                    <a className="ml-2 text-[var(--green)] underline" href={report.source_url} rel="noreferrer" target="_blank">
                      Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
      <AdvisorChat companyId={companyId} />
    </main>
  );
}
