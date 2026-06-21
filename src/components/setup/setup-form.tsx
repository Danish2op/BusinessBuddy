"use client";

import { Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { applySuggestionDecision, suggestionDecisionFor } from "./suggestion-state";

type Suggestion = {
  id: string;
  comp_name: string;
  website: string | null;
  linkedin_url?: string | null;
  logo_url?: string | null;
  analysis_summary: string | null;
  risk_level: "low" | "med" | "high";
  status: "draft" | "accepted" | "rejected";
  source_type: "ai" | "manual";
  knowledge_block?: {
    logo_url?: string | null;
  } | null;
};

type SetupFormProps = {
  initialCompanyId?: string;
  initialSuggestions?: Suggestion[];
};

const ageOptions = ["", "13", "18", "25", "35", "45", "55", "65"];
const countryOptions = ["Global", "United States", "Canada", "United Kingdom", "India", "Australia", "UAE", "Singapore", "Germany", "France"];

export function SetupForm({ initialCompanyId, initialSuggestions = [] }: SetupFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [decisionState, setDecisionState] = useState(() => ({
    accepted: new Set(initialSuggestions.filter((item) => item.status === "accepted").map((item) => item.id)),
    rejected: new Set(initialSuggestions.filter((item) => item.status === "rejected").map((item) => item.id))
  }));
  const [status, setStatus] = useState<"idle" | "loading" | "review" | "finalizing" | "error">(
    initialSuggestions.length > 0 ? "review" : "idle"
  );
  const [message, setMessage] = useState("");

  const acceptedCount = decisionState.accepted.size;

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("");
    const payload = {
      ...Object.fromEntries(formData.entries()),
      target_countries: formData.getAll("target_countries")
    };
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
    setDecisionState({ accepted: new Set(), rejected: new Set() });
    setStatus("review");
  }

  function toggle(id: string, decision: "accepted" | "rejected") {
    setDecisionState((current) => applySuggestionDecision(current, id, decision));
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
    setDecisionState((current) => applySuggestionDecision(current, suggestion.id, "accepted"));
  }

  async function finalize() {
    if (!companyId || decisionState.accepted.size === 0) {
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
        acceptedIds: Array.from(decisionState.accepted),
        rejectedIds: Array.from(decisionState.rejected)
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
            const decision = suggestionDecisionFor(decisionState, suggestion.id);
            const logoUrl = suggestion.logo_url ?? suggestion.knowledge_block?.logo_url;
            return (
              <article
                key={suggestion.id}
                className={`rounded-md border bg-[#080c0f] p-4 ${
                  decision === "accepted"
                    ? "border-[var(--green)]"
                    : decision === "rejected"
                      ? "border-[var(--red)] opacity-75"
                      : "border-[var(--border-muted)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {logoUrl ? (
                      <img
                        alt=""
                        className="h-10 w-10 rounded border border-[var(--border-muted)] bg-white object-contain p-1"
                        src={logoUrl}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-[var(--border-muted)] bg-[#10161a] text-sm font-semibold text-[var(--amber)]">
                        {suggestion.comp_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold">{suggestion.comp_name}</h3>
                      {suggestion.linkedin_url && (
                        <a className="mt-1 block text-xs text-[var(--green)] underline" href={suggestion.linkedin_url} rel="noreferrer" target="_blank">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#10161a] px-2 py-1 text-xs text-[var(--text-secondary)]">{decision}</span>
                    <span className="rounded bg-[var(--amber)] px-2 py-1 text-xs text-black">{suggestion.risk_level}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-1">
                  {suggestion.website && (
                    <a className="text-xs text-[var(--text-muted)] underline" href={suggestion.website} rel="noreferrer" target="_blank">
                      {suggestion.website}
                    </a>
                  )}
                  {!suggestion.website && !suggestion.linkedin_url && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{suggestion.website ?? suggestion.linkedin_url ?? "No URL"}</p>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{suggestion.analysis_summary}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${decision === "accepted" ? "bg-[var(--green)] text-black" : "border border-[var(--border-muted)] text-[var(--text-secondary)]"}`}
                    onClick={() => toggle(suggestion.id, "accepted")}
                    type="button"
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${decision === "rejected" ? "bg-[var(--red)] text-white" : "border border-[var(--border-muted)] text-[var(--text-secondary)]"}`}
                    onClick={() => toggle(suggestion.id, "rejected")}
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
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="website" placeholder="Website URL" type="text" />
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm" name="linkedin_url" placeholder="LinkedIn URL" type="text" />
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
      <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
        Company name
        <input name="name" required className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Website
          <input name="website" placeholder="Optional" type="text" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          LinkedIn
          <input name="linkedin_url" placeholder="Optional" type="text" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Industry
          <input name="industry" required className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Niche
          <input name="niche" placeholder="Optional" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
        Moat description
        <textarea name="moat_description" required rows={5} className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Team details
          <textarea name="team_details" placeholder="Optional" rows={3} className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Motive
          <textarea name="motive" placeholder="Optional" rows={3} className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Age min
          <select name="target_age_min" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]">
            {ageOptions.map((value) => (
              <option key={value || "any-min"} value={value}>
                {value || "Any"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Age max
          <select name="target_age_max" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]">
            {ageOptions.map((value) => (
              <option key={value || "any-max"} value={value}>
                {value || "Any"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Gender
          <select defaultValue="all" name="target_gender" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]">
            <option value="all">All</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="nonbinary">Non-binary</option>
            <option value="businesses">Businesses</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
        Countries
        <select defaultValue={["Global"]} multiple name="target_countries" className="min-h-32 rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]">
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Target keywords
          <input name="target_keywords" placeholder="Optional, comma-separated" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Business costing
          <input name="business_costing" placeholder="Optional" className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--amber)]" />
        </label>
      </div>
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
