"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MonitoringToggleProps = {
  companyId?: string;
  initialEnabled?: boolean;
};

export function MonitoringToggle({ companyId, initialEnabled = false }: MonitoringToggleProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    if (!companyId) {
      setMessage("Complete setup before changing monitoring.");
      return;
    }

    setPending(true);
    setMessage("");
    const next = !enabled;
    const response = await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, enabled: next })
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      detail?: string;
      hunt_summary?: {
        scannedCompetitors?: number;
        insertedReports?: number;
        emailedReports?: number;
        emailFailures?: number;
      };
    } | null;
    if (response.ok) {
      setEnabled(next);
      const insertedReports = body?.hunt_summary?.insertedReports ?? 0;
      const emailedReports = body?.hunt_summary?.emailedReports ?? 0;
      const emailFailures = body?.hunt_summary?.emailFailures ?? 0;
      setMessage(
        next
          ? `Monitoring is on. First scan added ${insertedReports} feed item${insertedReports === 1 ? "" : "s"}, sent ${emailedReports} email${emailedReports === 1 ? "" : "s"}${emailFailures ? `, and ${emailFailures} email${emailFailures === 1 ? "" : "s"} need retry` : ""}.`
          : "Monitoring is paused."
      );
      router.refresh();
    } else {
      setMessage(body?.detail ?? body?.error ?? "Could not update monitoring.");
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        aria-pressed={enabled}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
          enabled
            ? "border-[var(--amber)] bg-[rgba(214,166,64,0.12)] text-[var(--amber)]"
            : "border-[var(--border-muted)] bg-[#080c0f] text-[var(--text-secondary)]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        disabled={pending || !companyId}
        onClick={toggle}
        type="button"
        title="Turn background competitor monitoring on or off"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : enabled ? <Pause size={16} /> : <Play size={16} />}
        {!companyId ? "Setup required" : pending ? "Saving..." : enabled ? "Monitoring on" : "Monitoring paused"}
      </button>
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
    </div>
  );
}
