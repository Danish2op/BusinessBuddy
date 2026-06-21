"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

type MonitoringToggleProps = {
  companyId?: string;
  initialEnabled?: boolean;
};

export function MonitoringToggle({ companyId, initialEnabled = false }: MonitoringToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!companyId) {
      return;
    }

    setPending(true);
    const next = !enabled;
    const response = await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, enabled: next })
    });
    if (response.ok) {
      setEnabled(next);
    }
    setPending(false);
  }

  return (
    <button
      aria-pressed={enabled}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        enabled
          ? "border-[var(--amber)] bg-[rgba(214,166,64,0.12)] text-[var(--amber)]"
          : "border-[var(--border-muted)] bg-[#080c0f] text-[var(--text-secondary)]"
      }`}
      disabled={pending || !companyId}
      onClick={toggle}
      type="button"
      title="Turn background competitor monitoring on or off"
    >
      {enabled ? <Pause size={16} /> : <Play size={16} />}
      {!companyId ? "Setup required" : enabled ? "Monitoring on" : "Monitoring paused"}
    </button>
  );
}
