"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setPending(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    router.push(mode === "login" ? "/dashboard" : "/setup");
    router.refresh();
  }

  return (
    <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6">
      <div className="mb-6 flex rounded-md border border-[var(--border-muted)] p-1">
        {(["login", "signup"] as const).map((nextMode) => (
          <button
            key={nextMode}
            className={`flex-1 rounded px-3 py-2 text-sm ${mode === nextMode ? "bg-[var(--olive)] text-white" : "text-[var(--text-secondary)]"}`}
            onClick={() => setMode(nextMode)}
            type="button"
          >
            {nextMode === "login" ? "Login" : "Signup"}
          </button>
        ))}
      </div>
      <form action={submit} className="grid gap-4">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Email
          <input
            autoComplete="email"
            className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)]"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Password
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)]"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Working..." : mode === "login" ? "Enter command center" : "Create operating profile"}
        </button>
        {message && <p className="text-sm text-[var(--red)]">{message}</p>}
      </form>
    </div>
  );
}
