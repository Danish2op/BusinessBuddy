"use client";

import { useState } from "react";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");

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
      <form className="grid gap-4">
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Email
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)]" type="email" />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
          Password
          <input className="rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-[var(--text-primary)]" type="password" />
        </label>
        <button className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-black" type="button">
          {mode === "login" ? "Enter command center" : "Create operating profile"}
        </button>
      </form>
    </div>
  );
}
