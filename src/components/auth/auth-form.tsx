"use client";

import { CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [pending, setPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"login" | "signup" | null>(null);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setPendingAction(mode);
    setMessage("");
    setMessageType("error");
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

    if (result.error) {
      setPending(false);
      setPendingAction(null);
      setMessageType("error");
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setPending(false);
      setPendingAction(null);
      setMode("login");
      setMessageType("success");
      setMessage(`Verification email sent to ${email}. Open the link, then log in here.`);
      return;
    }

    setMessageType("success");
    setMessage(mode === "login" ? "Authenticated. Opening your war-room..." : "Account ready. Opening setup...");
    router.push(mode === "login" ? "/dashboard" : "/setup");
    router.refresh();
  }

  return (
    <div className="auth-card glass-panel animate-rise rounded-2xl p-5 sm:p-6" aria-busy={pending}>
      <div className="mb-5 border-b border-[var(--border-muted)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--amber)]">Secure access</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Open your war-room</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Sign in to review signals, competitors, and advisor history.</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-[var(--border-muted)] bg-[rgba(0,0,0,0.16)] p-1">
        {(["login", "signup"] as const).map((nextMode) => (
          <button
            key={nextMode}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              mode === nextMode
                ? "bg-[rgba(245,243,234,0.92)] text-[#07100d]"
                : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={pending}
            onClick={() => {
              setMode(nextMode);
              setMessage("");
            }}
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
            className="rounded-xl border border-[var(--border-muted)] bg-[rgba(3,7,8,0.7)] px-3 py-3 text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)] focus:border-[rgba(224,173,66,0.55)]"
            disabled={pending}
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
            className="rounded-xl border border-[var(--border-muted)] bg-[rgba(3,7,8,0.7)] px-3 py-3 text-[var(--text-primary)] transition focus:border-[rgba(224,173,66,0.55)]"
            disabled={pending}
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
          <p className="rounded-xl border border-[rgba(224,173,66,0.24)] bg-[rgba(224,173,66,0.08)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {pendingAction === "login" ? "Authenticating credentials and loading your war-room..." : "Creating profile and preparing company setup..."}
          </p>
        )}
        {message && (
          <p className={`inline-flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
            messageType === "success"
              ? "border-[rgba(143,191,99,0.28)] bg-[rgba(143,191,99,0.08)] text-[var(--green)]"
              : "border-[rgba(208,97,88,0.28)] bg-[rgba(208,97,88,0.08)] text-[var(--red)]"
          }`}>
            {messageType === "success" && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <span>{message}</span>
          </p>
        )}
      </form>
    </div>
  );
}
