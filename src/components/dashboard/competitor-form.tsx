"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function CompetitorForm({ companyId }: { companyId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setMessage("Create a company first.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    const response = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        comp_name: formData.get("comp_name"),
        website: formData.get("website"),
        linkedin_url: formData.get("linkedin_url")
      })
    });

    const body = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
    setPending(false);
    setMessage(response.ok ? "Competitor added and enriched." : body?.detail ?? body?.error ?? "Could not add competitor.");
    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--amber)]">Manual competitor</p>
        <h2 className="mt-1 text-sm font-semibold">Add a real company to the radar</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input className="min-h-11 rounded-md border border-[var(--border-muted)] bg-[#05090a] px-3 py-2 text-sm outline-none transition focus:border-[var(--amber)]" name="comp_name" placeholder="Competitor name" required />
        <input className="min-h-11 rounded-md border border-[var(--border-muted)] bg-[#05090a] px-3 py-2 text-sm outline-none transition focus:border-[var(--amber)]" name="website" placeholder="Website URL" type="text" />
        <input className="min-h-11 rounded-md border border-[var(--border-muted)] bg-[#05090a] px-3 py-2 text-sm outline-none transition focus:border-[var(--amber)]" name="linkedin_url" placeholder="LinkedIn URL" type="text" />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[var(--amber-strong)] disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || !companyId} type="submit">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {pending ? "Adding..." : "Add"}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.toLowerCase().includes("could not") || message.toLowerCase().includes("required") ? "text-[var(--red)]" : "text-[var(--text-muted)]"}`}>
          {message}
        </p>
      )}
      {!companyId && <p className="text-xs text-[var(--text-muted)]">Complete setup before adding competitors.</p>}
    </form>
  );
}
