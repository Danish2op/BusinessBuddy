"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompetitorForm({ companyId }: { companyId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    if (!companyId) {
      setMessage("Create a company first.");
      return;
    }

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

    setPending(false);
    setMessage(response.ok ? "Competitor added." : "Could not add competitor.");
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <form action={submit} className="mt-5 grid gap-3 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="comp_name" placeholder="Competitor name" required />
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="website" placeholder="Website URL" type="url" />
      <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="linkedin_url" placeholder="LinkedIn URL" type="url" />
      <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Adding..." : "Add"}
      </button>
      {message && <p className="text-sm text-[var(--text-muted)] lg:col-span-4">{message}</p>}
    </form>
  );
}
