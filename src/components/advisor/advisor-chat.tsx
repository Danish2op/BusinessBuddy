"use client";

import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

export function AdvisorChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="fixed bottom-5 right-5 z-20">
      {open ? (
        <section className="w-[min(92vw,420px)] rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Strategic Advisor</h2>
            <button aria-label="Close advisor" className="text-[var(--text-muted)]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="mb-3 rounded border border-[var(--border-muted)] bg-[#080c0f] p-3 text-sm text-[var(--text-secondary)]">
            Ask for aggressive, defensive, or pivot responses to latest moves.
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Advisor message"
              className="min-w-0 flex-1 rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="How should we respond?"
            />
            <button aria-label="Send advisor message" className="rounded-md bg-[var(--amber)] p-2 text-black" type="button">
              <Send size={18} />
            </button>
          </div>
        </section>
      ) : (
        <button
          aria-label="Open strategic advisor"
          className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--amber)] text-black shadow-lg"
          onClick={() => setOpen(true)}
          type="button"
        >
          <MessageSquare size={22} />
        </button>
      )}
    </div>
  );
}
