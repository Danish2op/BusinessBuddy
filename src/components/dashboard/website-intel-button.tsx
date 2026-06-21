"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WebsiteIntelButton({ companyId }: { companyId?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!companyId) {
      setMessage("Create a company first.");
      return;
    }

    setPending(true);
    setMessage("");
    const response = await fetch("/api/company/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId })
    });
    setPending(false);
    setMessage(response.ok ? "Website intel updated." : "Could not refresh website intel.");
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-60"
        disabled={pending}
        onClick={refresh}
        type="button"
        title="Fetch the company website and summarize it into the AI knowledge block"
      >
        <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
        {pending ? "Refreshing intel" : "Refresh website intel"}
      </button>
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
    </div>
  );
}
