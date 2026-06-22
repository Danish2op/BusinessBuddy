"use client";

import { CheckCircle2, Loader2, LockKeyhole, Mail, Radar, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"login" | "signup" | null>(null);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setPendingAction(mode);
    setMessage("");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    const appOrigin = window.location.origin;
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${appOrigin}/auth/callback`
            }
          });

    setPending(false);
    setPendingAction(null);

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
      <div className="auth-card glass-panel animate-rise rounded-md p-6">
        <div className="grid h-12 w-12 place-items-center rounded-md border border-[rgba(143,191,99,0.35)] bg-[rgba(143,191,99,0.12)] text-[var(--green)]">
          <CheckCircle2 size={23} />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--amber)]">Verify email</p>
        <h2 className="mt-3 text-2xl font-semibold">Open the confirmation link</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          We sent your Supabase confirmation email. After verification, BusinessBuddy will continue setup.
        </p>
        {message && <p className="mt-4 text-sm text-[var(--green)]">{message}</p>}
        <button className="action-secondary mt-5" onClick={() => setCheckEmail(false)} type="button">
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card glass-panel animate-rise rounded-2xl p-5 sm:p-6" aria-busy={pending}>
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[rgba(214,166,64,0.2)] bg-[rgba(214,166,64,0.07)] p-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--amber)] text-black shadow-[0_0_28px_rgba(214,166,64,0.25)]">
          <Radar size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold">Operator access</p>
          <p className="text-xs text-[var(--text-muted)]">Secure strategy workspace</p>
        </div>
      </div>

      <div className="mb-6 flex rounded-2xl border border-[var(--border-muted)] bg-[rgba(0,0,0,0.16)] p-1">
        {(["login", "signup"] as const).map((nextMode) => (
          <button
            key={nextMode}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm transition ${
              mode === nextMode
                ? "bg-[var(--amber)] text-black shadow-[0_10px_28px_rgba(214,166,64,0.18)]"
                : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={pending}
            onClick={() => setMode(nextMode)}
            type="button"
          >
            {nextMode === "login" ? "Login" : "Signup"}
          </button>
        ))}
      </div>
      <form action={submit} className="grid gap-4">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2"><Mail size={14} /> Email</span>
          <input
            autoComplete="email"
            className="rounded-xl border border-[var(--border-muted)] bg-[rgba(3,7,8,0.7)] px-3 py-3 text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)] focus:border-[rgba(214,166,64,0.55)]"
            name="email"
            placeholder="founder@company.com"
            required
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2"><LockKeyhole size={14} /> Password</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-xl border border-[var(--border-muted)] bg-[rgba(3,7,8,0.7)] px-3 py-3 text-[var(--text-primary)] transition focus:border-[rgba(214,166,64,0.55)]"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="action-primary mt-1" disabled={pending} type="submit">
          {pending ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
          <span>{pending ? (pendingAction === "login" ? "Authenticating..." : "Creating profile...") : mode === "login" ? "Enter command center" : "Create operating profile"}</span>
        </button>
        {pending && (
          <p className="rounded-xl border border-[rgba(214,166,64,0.24)] bg-[rgba(214,166,64,0.08)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {pendingAction === "login" ? "Authenticating credentials and loading your war-room..." : "Creating profile and preparing company setup..."}
          </p>
        )}
        {message && <p className="text-sm text-[var(--red)]">{message}</p>}
      </form>
    </div>
  );
}
