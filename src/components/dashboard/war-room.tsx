import { Activity, AlertTriangle, ExternalLink, Radar, Shield, Target } from "lucide-react";

import { AdvisorChat } from "@/components/advisor/advisor-chat";
import { CompetitorForm } from "@/components/dashboard/competitor-form";
import { MonitoringToggle } from "@/components/dashboard/monitoring-toggle";
import { WebsiteIntelButton } from "@/components/dashboard/website-intel-button";

export type DashboardCompetitor = {
  id: string;
  comp_name: string;
  website: string | null;
  linkedin_url?: string | null;
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
  const activeThreats = competitors.filter((competitor) => competitor.risk_level === "high" || competitor.risk_level === "med").length;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(214,166,64,0.11),transparent_26%),linear-gradient(135deg,rgba(143,191,99,0.05),transparent_40%)]" />
      <section className="relative mx-auto grid min-h-screen max-w-[1680px] gap-5 p-4 lg:p-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="grid min-w-0 content-start gap-5">
          <header className="rounded-md border border-[var(--border-strong)] bg-[rgba(8,13,15,0.88)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Radar size={18} className="text-[var(--amber)]" />
                  <span>BusinessBuddy</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--amber)]">War-room active</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{companyName}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                  {moatDescription || "Complete setup to create a moat profile. Monitoring stays paused until you turn it on."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MonitoringToggle companyId={companyId} initialEnabled={monitoringEnabled} />
                <WebsiteIntelButton companyId={companyId} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded border border-[var(--border-muted)] bg-[#05090a] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Watch targets</p>
                <p className="mt-2 text-2xl font-semibold">{competitors.length}</p>
              </div>
              <div className="rounded border border-[var(--border-muted)] bg-[#05090a] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Active threats</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--amber)]">{activeThreats}</p>
              </div>
              <div className="rounded border border-[var(--border-muted)] bg-[#05090a] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Last scan</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Activity size={15} className="text-[var(--green)]" />
                  Standby
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
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
                    <p className="mt-3 rounded border border-[var(--border-muted)] bg-[#05090a] p-3 text-xs text-[var(--text-muted)]">
                      Positioning: {knowledgeBlock.positioning}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[var(--amber)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Radar View</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Accepted competitors only</p>
              </div>
              <div className="grid gap-3">
                {competitors.length === 0 && (
                  <p className="rounded border border-[var(--border-muted)] p-3 text-sm text-[var(--text-muted)]">
                    No competitors yet. Add a real company below with a website or LinkedIn URL.
                  </p>
                )}
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="grid gap-3 rounded border border-[var(--border-muted)] bg-[#05090a] p-3 md:grid-cols-[1fr_auto]">
                    <div className="flex min-w-0 items-start gap-3">
                      {competitor.knowledge_block?.logo_url ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded border border-[var(--border-muted)] bg-white object-contain p-1"
                          src={competitor.knowledge_block.logo_url}
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--border-muted)] bg-[#10161a] text-xs font-semibold text-[var(--amber)]">
                          {competitor.comp_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{competitor.comp_name}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                          {competitor.analysis_summary || competitor.website || "Manual watch target"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {competitor.website && (
                            <a className="inline-flex items-center gap-1 rounded border border-[var(--border-muted)] px-2 py-1 text-[var(--green)] hover:border-[var(--green)]" href={competitor.website} rel="noreferrer" target="_blank">
                              Website <ExternalLink size={12} />
                            </a>
                          )}
                          {competitor.linkedin_url && (
                            <a className="inline-flex items-center gap-1 rounded border border-[var(--border-muted)] px-2 py-1 text-[var(--green)] hover:border-[var(--green)]" href={competitor.linkedin_url} rel="noreferrer" target="_blank">
                              LinkedIn <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start rounded border border-[var(--border-muted)] px-2 py-1 text-xs text-[var(--text-muted)]">
                      <Target size={13} className={competitor.risk_level === "high" ? "text-[var(--red)]" : competitor.risk_level === "med" ? "text-[var(--amber)]" : "text-[var(--green)]"} />
                      Risk: <strong className="font-medium uppercase text-[var(--text-secondary)]">{competitor.risk_level}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <CompetitorForm companyId={companyId} />

          <section className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Intelligence Feed</h2>
              <span className="text-xs text-[var(--text-muted)]">{reports.length} signals</span>
            </div>
            <div className="grid gap-3">
              {reports.length === 0 && <p className="text-sm text-[var(--text-muted)]">No reports yet.</p>}
              {reports.map((report) => (
                <div key={report.id} className="rounded border border-[var(--border-muted)] bg-[#05090a] p-3 text-sm text-[var(--text-secondary)]">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="text-[var(--amber)]">{report.category}</span>
                    {report.risk_level && <span>Risk: {report.risk_level}</span>}
                  </div>
                  {report.title ? <p className="font-medium text-[var(--text-primary)]">{report.title}</p> : null}
                  <p className="mt-1 leading-6">{report.summary}</p>
                  {report.source_url && (
                    <a className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--green)] hover:underline" href={report.source_url} rel="noreferrer" target="_blank">
                      Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="advisor-panel min-w-0 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <AdvisorChat companyId={companyId} embedded />
        </aside>
      </section>
    </main>
  );
}
