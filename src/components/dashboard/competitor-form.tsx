"use client";

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
    <form onSubmit={submit} className="mt-5 grid gap-3 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="comp_name" placeholder="Competitor name" required />
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="website" placeholder="Website URL" type="text" />
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="linkedin_url" placeholder="LinkedIn URL" type="text" />
      <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add"}
      </button>
      {message && <p className="text-sm text-[var(--text-muted)] lg:col-span-4">{message}</p>}
    </form>
  );
}
