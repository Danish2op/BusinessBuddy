"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useState } from "react";

type MonitoringToggleProps = {
  companyId?: string;
  initialEnabled?: boolean;
};

export function MonitoringToggle({ companyId, initialEnabled = false }: MonitoringToggleProps) {
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
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.ok) {
      setEnabled(next);
      setMessage(next ? "Monitoring is on." : "Monitoring is paused.");
    } else {
      setMessage(body?.error ?? "Could not update monitoring.");
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
