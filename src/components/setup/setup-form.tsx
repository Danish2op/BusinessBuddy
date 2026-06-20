"use client";

import { useState } from "react";

const fields = [
  ["name", "Company name"],
  ["website", "Website"],
  ["linkedin_url", "LinkedIn URL"],
  ["industry", "Industry"],
  ["team_details", "Team details"],
  ["moat_description", "Moat description"]
] as const;

export function SetupForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("loading");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setStatus(response.ok ? "done" : "error");
  }

  return (
    <form action={submit} className="grid gap-4 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
      {fields.map(([name, label]) => (
        <label key={name} className="grid gap-2 text-sm text-[var(--text-secondary)]">
          {label}
          {name === "moat_description" || name === "team_details" ? (
            <textarea
              name={name}
              required
              rows={name === "moat_description" ? 5 : 3}
              className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]"
            />
          ) : (
            <input
              name={name}
              required={name !== "linkedin_url"}
              className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]"
            />
          )}
        </label>
      ))}
      <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black" type="submit">
        Generate intelligence profile
      </button>
      <p className="min-h-5 text-sm text-[var(--text-muted)]">
        {status === "loading" && "Mapping moat and searching competitors..."}
        {status === "done" && "Profile created. Open dashboard for war-room view."}
        {status === "error" && "Setup failed. Check inputs or sign in again."}
      </p>
    </form>
  );
}
