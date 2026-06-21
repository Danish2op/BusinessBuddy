"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getClientEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    const env = getClientEnv();
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`
            }
          });

    setPending(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setCheckEmail(true);
      setMessage(`Check ${email} to verify your account.`);
      return;
    }

    router.push(mode === "login" ? "/dashboard" : "/setup");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--amber)]">Verify email</p>
        <h2 className="mt-3 text-xl font-semibold">Open verification link</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          We sent your Supabase confirmation email. After verification, BusinessBuddy will continue setup.
        </p>
        {message && <p className="mt-4 text-sm text-[var(--green)]">{message}</p>}
        <button className="mt-5 rounded-md border border-[var(--border-muted)] px-4 py-2 text-sm" onClick={() => setCheckEmail(false)} type="button">
          Back to login
        </button>
      </div>
    );
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
