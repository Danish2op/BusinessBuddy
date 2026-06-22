"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <button
      className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--border-muted)] bg-[rgba(5,10,12,0.64)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[rgba(184,74,69,0.55)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      onClick={() => void logout()}
      title="Sign out"
      type="button"
    >
      <LogOut size={16} className="text-[var(--red)] transition group-hover:translate-x-0.5" />
      {pending ? "Signing out..." : "Logout"}
    </button>
  );
}
