"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  ExternalLink,
  LayoutDashboard,
  Radar,
  Rss,
  Shield,
  Sparkles,
  Target,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { AdvisorChat, type ChatMessage } from "@/components/advisor/advisor-chat";
import { CompanyLogo } from "@/components/company-logo";
import { CompetitorForm } from "@/components/dashboard/competitor-form";
import { LogoutButton } from "@/components/dashboard/logout-button";
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

type DashboardPage = "overview" | "advisor" | "feed" | "competitors";

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
  advisorMessages?: ChatMessage[];
};

const navigationItems: Array<{
  id: DashboardPage;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Overview", description: "Battlefield state", icon: LayoutDashboard },
  { id: "advisor", label: "Advisor", description: "Stored strategy chat", icon: Bot },
  { id: "feed", label: "Feed", description: "Signals and alerts", icon: Rss },
  { id: "competitors", label: "Competitors", description: "Radar targets", icon: Users }
];

function riskTone(risk?: "low" | "med" | "high" | null) {
  if (risk === "high") {
    return "text-[var(--red)]";
  }

  if (risk === "med") {
    return "text-[var(--amber)]";
  }

  return "text-[var(--green)]";
}

function Panel({
  active,
  children
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section className={active ? "animate-rise grid h-full min-h-0 gap-5" : "hidden"} aria-hidden={!active}>
      {children}
    </section>
  );
}

export function WarRoom({
  companyId,
  companyName = "No company configured",
  moatDescription,
  monitoringEnabled = false,
  knowledgeBlock,
  competitors = [],
  reports = [],
  advisorMessages = []
}: WarRoomProps) {
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const activeThreats = competitors.filter((competitor) => competitor.risk_level === "high" || competitor.risk_level === "med").length;
  const highRiskReports = reports.filter((report) => report.risk_level === "high").length;
  const lastSignal = reports[0]?.created_at
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(reports[0].created_at))
    : "Standby";
  const navBadges = useMemo(
    () => ({
      overview: activeThreats,
      advisor: advisorMessages.length,
      feed: reports.length,
      competitors: competitors.length
    }),
    [activeThreats, advisorMessages.length, competitors.length, reports.length]
  );

  return (
    <main className="dashboard-shell h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="aurora-field" />
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto grid h-full max-w-[1720px] gap-4 p-3 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-5">
        <aside className="glass-panel animate-slide-in flex min-h-0 flex-col rounded-2xl p-3 lg:h-[calc(100vh-2.5rem)]">
          <div className="flex items-center gap-3 rounded-md border border-[rgba(214,166,64,0.2)] bg-[rgba(214,166,64,0.08)] p-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-[var(--amber)] text-black shadow-[0_0_24px_rgba(214,166,64,0.26)]">
              <Radar size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">BusinessBuddy</p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Strategic OS</p>
            </div>
          </div>

          <nav className="mt-4 grid gap-2" aria-label="Dashboard sections">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  className={`group grid min-h-14 grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 text-left transition ${
                    active
                      ? "border-[rgba(214,166,64,0.45)] bg-[rgba(214,166,64,0.13)] shadow-[0_0_28px_rgba(214,166,64,0.08)]"
                      : "border-transparent bg-transparent hover:border-[var(--border-muted)] hover:bg-[rgba(255,255,255,0.035)]"
                  }`}
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  type="button"
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-md border transition ${active ? "border-[rgba(214,166,64,0.45)] text-[var(--amber)]" : "border-[var(--border-muted)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{item.description}</span>
                  </span>
                  <span className="rounded border border-[var(--border-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{navBadges[item.id]}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 grid gap-3 rounded-md border border-[var(--border-muted)] bg-[rgba(3,7,8,0.42)] p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Controls</p>
            <MonitoringToggle companyId={companyId} initialEnabled={monitoringEnabled} />
            <WebsiteIntelButton companyId={companyId} />
          </div>

          <div className="mt-auto pt-4">
            <LogoutButton />
          </div>
        </aside>

        <section className="dashboard-workspace dashboard-scroll grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
          <header className="glass-panel animate-rise rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--amber)]">
                  <Sparkles size={14} />
                  War-room live
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">{companyName}</h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--text-muted)]">
                  {moatDescription || "Complete setup to create a moat profile. Monitoring stays paused until you turn it on."}
                </p>
              </div>
              <div className="grid min-w-[220px] gap-2 rounded-md border border-[var(--border-muted)] bg-[rgba(3,7,8,0.38)] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Current page</p>
                <p className="text-lg font-semibold capitalize text-[var(--text-secondary)]">{activePage}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="glass-tile rounded p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Watch targets</p>
                <p className="mt-2 text-2xl font-semibold">{competitors.length}</p>
              </div>
              <div className="glass-tile rounded p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Active threats</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--amber)]">{activeThreats}</p>
              </div>
              <div className="glass-tile rounded p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">High alerts</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--red)]">{highRiskReports}</p>
              </div>
              <div className="glass-tile rounded p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Last signal</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Activity size={15} className="text-[var(--green)]" />
                  {lastSignal}
                </p>
              </div>
            </div>
          </header>

          <div className="mt-5 min-h-0 overflow-hidden">
            <Panel active={activePage === "overview"}>
              <div className="grid h-full min-h-0 gap-5 overflow-hidden xl:grid-cols-[1.05fr_0.95fr]">
                <section className="glass-panel section-scroll rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-[var(--green)]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Strategic Summary</h2>
                  </div>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {moatDescription || "Complete setup to create a moat profile. Monitoring stays paused until you turn it on."}
                  </p>
                  {knowledgeBlock?.summary && (
                    <div className="mt-5 border-t border-[var(--border-muted)] pt-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Website intel</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{knowledgeBlock.summary}</p>
                      {knowledgeBlock.positioning && (
                        <p className="glass-tile mt-3 rounded p-3 text-xs leading-5 text-[var(--text-muted)]">
                          Positioning: {knowledgeBlock.positioning}
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="glass-panel section-scroll rounded-2xl p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[var(--amber)]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Signal Snapshot</h2>
                  </div>
                  <div className="grid gap-3">
                    {reports.slice(0, 3).map((report) => (
                      <div className="glass-row rounded p-3" key={report.id}>
                        <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span className={riskTone(report.risk_level)}>{report.risk_level ?? "low"}</span>
                          <span>{report.category}</span>
                        </div>
                        <p className="line-clamp-2 text-sm font-medium text-[var(--text-secondary)]">{report.title ?? report.summary}</p>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <div className="glass-row rounded p-5 text-sm text-[var(--text-muted)]">
                        Turn monitoring on from the rail to generate the first intelligence feed.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </Panel>

            <Panel active={activePage === "advisor"}>
              <div className="advisor-panel min-h-0">
                <AdvisorChat companyId={companyId} embedded initialMessages={advisorMessages} />
              </div>
            </Panel>

            <Panel active={activePage === "feed"}>
              <section className="glass-panel grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-2xl p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Intelligence Feed</h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Each new row is also emailed to the company owner.</p>
                  </div>
                  <span className="rounded border border-[var(--border-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">{reports.length} signals</span>
                </div>
                <div className="feed-scroll section-scroll grid min-h-0 gap-3 pr-2">
                  {reports.length === 0 && (
                    <div className="glass-row rounded p-6">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">Feed arms on first scan</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                        Turn monitoring on to run the first hunt immediately. New signals will appear here and email the account owner.
                      </p>
                    </div>
                  )}
                  {reports.map((report) => (
                    <article key={report.id} className="glass-row animate-rise rounded p-4 text-sm text-[var(--text-secondary)]">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="text-[var(--amber)]">{report.category}</span>
                        {report.risk_level && <span className={riskTone(report.risk_level)}>Risk: {report.risk_level}</span>}
                        {report.created_at && <span>{new Date(report.created_at).toLocaleString()}</span>}
                      </div>
                      {report.title ? <p className="font-medium text-[var(--text-primary)]">{report.title}</p> : null}
                      <p className="mt-1 leading-6">{report.summary}</p>
                      {report.source_url && (
                        <a className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--green)] hover:underline" href={report.source_url} rel="noreferrer" target="_blank">
                          Source <ExternalLink size={12} />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            </Panel>

            <Panel active={activePage === "competitors"}>
              <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-5">
                <section className="glass-panel grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-2xl p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-[var(--amber)]" />
                      <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Radar View</h2>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Accepted competitors only</p>
                  </div>
                  <div className="radar-scroll section-scroll grid min-h-0 gap-3 pr-2">
                    {competitors.length === 0 && (
                      <div className="glass-row rounded p-5 text-sm text-[var(--text-muted)]">
                        <p className="font-medium text-[var(--text-secondary)]">No radar targets yet</p>
                        <p className="mt-2 leading-6">Add a real competitor below, or finish onboarding discovery, to arm the monitoring feed.</p>
                      </div>
                    )}
                    {competitors.map((competitor) => (
                      <div key={competitor.id} className="glass-row animate-rise grid gap-3 rounded p-3 md:grid-cols-[1fr_auto]">
                        <div className="flex min-w-0 items-start gap-3">
                          <CompanyLogo
                            name={competitor.comp_name}
                            website={competitor.website}
                            logoUrl={competitor.knowledge_block?.logo_url}
                          />
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
                          <Target size={13} className={riskTone(competitor.risk_level)} />
                          Risk: <strong className="font-medium uppercase text-[var(--text-secondary)]">{competitor.risk_level}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <CompetitorForm companyId={companyId} />
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}
