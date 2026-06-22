"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const result = await supabase.auth.signOut();
    if (result.error) {
      setPending(false);
      setError("Could not sign out. Try again.");
      return;
    }

    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <button
        className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--border-muted)] bg-[rgba(5,10,12,0.64)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(184,74,69,0.55)] hover:text-[var(--text-primary)] disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onClick={() => void logout()}
        title="Sign out"
        type="button"
      >
        {pending ? <Loader2 size={16} className="animate-spin text-[var(--red)]" /> : <LogOut size={16} className="text-[var(--red)] transition group-hover:translate-x-0.5" />}
        {pending ? "Signing out..." : "Logout"}
      </button>
      {error && <p className="rounded border border-[rgba(208,97,88,0.25)] bg-[rgba(208,97,88,0.08)] px-2 py-1 text-xs text-[var(--red)]">{error}</p>}
    </div>
  );
}
