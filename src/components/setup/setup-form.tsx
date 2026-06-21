"use client";

import { Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Suggestion = {
  id: string;
  comp_name: string;
  website: string | null;
  linkedin_url?: string | null;
  analysis_summary: string | null;
  risk_level: "low" | "med" | "high";
  status: "draft" | "accepted" | "rejected";
  source_type: "ai" | "manual";
};

type SetupFormProps = {
  initialCompanyId?: string;
  initialSuggestions?: Suggestion[];
};

const fields = [
  ["name", "Company name"],
  ["website", "Website"],
  ["linkedin_url", "LinkedIn URL"],
  ["industry", "Industry"],
  ["niche", "Niche"],
  ["motive", "Motive"],
  ["team_details", "Team details"],
  ["moat_description", "Moat description"],
  ["target_age_min", "Target age min"],
  ["target_age_max", "Target age max"],
  ["target_gender", "Target gender"],
  ["target_countries", "Target countries"],
  ["target_keywords", "Target keywords"],
  ["business_costing", "Business costing"]
] as const;

export function SetupForm({ initialCompanyId, initialSuggestions = [] }: SetupFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(initialSuggestions.map((item) => item.id)));
  const [rejected, setRejected] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "review" | "finalizing" | "error">(
    initialSuggestions.length > 0 ? "review" : "idle"
  );
  const [message, setMessage] = useState("");

  const acceptedCount = useMemo(() => accepted.size, [accepted]);

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = (await response.json().catch(() => null)) as
      | { companyId?: string; competitorSuggestions?: Suggestion[]; error?: string }
      | null;

    if (!response.ok || !body?.companyId) {
      setStatus("error");
      setMessage(body?.error ?? "Setup failed. Check inputs or sign in again.");
      return;
    }

    setCompanyId(body.companyId);
    const nextSuggestions = body.competitorSuggestions ?? [];
    setSuggestions(nextSuggestions);
    setAccepted(new Set(nextSuggestions.map((item) => item.id)));
    setRejected(new Set());
    setStatus("review");
  }

  function toggle(id: string, nextAccepted: boolean) {
    setAccepted((current) => {
      const copy = new Set(current);
      if (nextAccepted) {
        copy.add(id);
      } else {
        copy.delete(id);
      }
      return copy;
    });
    setRejected((current) => {
      const copy = new Set(current);
      if (nextAccepted) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  }

  async function addManual(formData: FormData) {
    if (!companyId) {
      setMessage("Create company profile first.");
      return;
    }

    setMessage("");
    const response = await fetch("/api/onboarding/competitors/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        comp_name: formData.get("comp_name"),
        website: formData.get("website"),
        linkedin_url: formData.get("linkedin_url")
      })
    });

    const suggestion = (await response.json().catch(() => null)) as Suggestion | { error?: string } | null;
    if (!response.ok || !suggestion || !("id" in suggestion)) {
      setMessage((suggestion as { error?: string } | null)?.error ?? "Could not add competitor.");
      return;
    }

    setSuggestions((current) => [suggestion, ...current.filter((item) => item.id !== suggestion.id)]);
    setAccepted((current) => new Set(current).add(suggestion.id));
  }

  async function finalize() {
    if (!companyId || accepted.size === 0) {
      setMessage("Accept at least one competitor.");
      return;
    }

    setStatus("finalizing");
    setMessage("");
    const response = await fetch("/api/onboarding/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        acceptedIds: Array.from(accepted),
        rejectedIds: Array.from(rejected)
      })
    });

    if (!response.ok) {
      setStatus("review");
      setMessage("Could not finalize competitors.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (status === "review" || status === "finalizing") {
    return (
      <section className="grid gap-4 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--amber)]">Competitor review</p>
          <h2 className="mt-2 text-xl font-semibold">Accept true rivals</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Accepted companies become live monitoring targets.</p>
        </div>
        <div className="grid gap-3">
          {suggestions.map((suggestion) => {
            const isAccepted = accepted.has(suggestion.id);
            return (
              <article key={suggestion.id} className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{suggestion.comp_name}</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{suggestion.website ?? suggestion.linkedin_url ?? "No URL"}</p>
                  </div>
                  <span className="rounded bg-[var(--amber)] px-2 py-1 text-xs text-black">{suggestion.risk_level}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{suggestion.analysis_summary}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isAccepted ? "bg-[var(--green)] text-black" : "border border-[var(--border-muted)] text-[var(--text-secondary)]"}`}
                    onClick={() => toggle(suggestion.id, true)}
                    type="button"
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${!isAccepted ? "bg-[var(--red)] text-white" : "border border-[var(--border-muted)] text-[var(--text-secondary)]"}`}
                    onClick={() => toggle(suggestion.id, false)}
                    type="button"
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <form action={addManual} className="grid gap-3 rounded-md border border-[var(--border-muted)] p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="comp_name" placeholder="Competitor name" required />
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="website" placeholder="Website URL" />
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="linkedin_url" placeholder="LinkedIn URL" />
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-muted)] px-3 py-2 text-sm" type="submit">
            <Plus size={16} />
            Add
          </button>
        </form>
        <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" disabled={status === "finalizing" || acceptedCount === 0} onClick={() => void finalize()} type="button">
          {status === "finalizing" ? "Finalizing..." : `Enter war room with ${acceptedCount} competitors`}
        </button>
        {message && <p className="text-sm text-[var(--red)]">{message}</p>}
      </section>
    );
  }

  return (
    <form action={submit} className="grid gap-4 rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5">
      {fields.map(([name, label]) => (
        <label key={name} className="grid gap-2 text-sm text-[var(--text-secondary)]">
          {label}
          {name === "moat_description" || name === "team_details" || name === "motive" ? (
            <textarea
              name={name}
              required
              rows={name === "moat_description" ? 5 : 3}
              className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]"
            />
          ) : (
            <input
              name={name}
              required={!["linkedin_url", "business_costing", "target_age_min", "target_age_max"].includes(name)}
              type={name.startsWith("target_age") ? "number" : "text"}
              className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]"
            />
          )}
        </label>
      ))}
      <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Mapping moat and rivals..." : "Generate competitor map"}
      </button>
      <p className="min-h-5 text-sm text-[var(--text-muted)]">
        {status === "idle" && "AI will create draft competitor suggestions for your review."}
        {status === "error" && message}
      </p>
    </form>
  );
}
