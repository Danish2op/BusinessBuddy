"use client";

import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

type AdvisorChatProps = {
  companyId?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export function AdvisorChat({ companyId }: AdvisorChatProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function send() {
    if (!companyId || !message.trim() || pending) {
      return;
    }

    const userMessage = message.trim();
    setMessage("");
    setError("");
    setPending(true);
    setMessages((current) => [...current, { role: "user", content: userMessage }]);

    const response = await fetch("/api/advisor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, message: userMessage })
    });

    setPending(false);
    const payload = (await response.json().catch(() => null)) as
      | {
          answer?: string;
          options?: { aggressive?: string; defensive?: string; pivot?: string };
          citations?: string[];
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.answer) {
      setError(payload?.error ?? "Advisor failed. Try again.");
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: [
          payload.answer,
          payload.options?.aggressive ? `Aggressive: ${payload.options.aggressive}` : "",
          payload.options?.defensive ? `Defensive: ${payload.options.defensive}` : "",
          payload.options?.pivot ? `Pivot: ${payload.options.pivot}` : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        citations: payload.citations ?? []
      }
    ]);
  }

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
          <div className="mb-3 max-h-80 overflow-y-auto rounded border border-[var(--border-muted)] bg-[#080c0f] p-3 text-sm text-[var(--text-secondary)]">
            {messages.length === 0 && "Ask for aggressive, defensive, or pivot responses to latest moves."}
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className="mb-3 whitespace-pre-wrap last:mb-0">
                <span className={item.role === "assistant" ? "text-[var(--amber)]" : "text-[var(--green)]"}>
                  {item.role === "assistant" ? "Advisor" : "You"}:
                </span>{" "}
                {item.content}
                {item.role === "assistant" && item.citations && item.citations.length > 0 && (
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    Citations: {item.citations.join(", ")}
                  </div>
                )}
              </div>
            ))}
            {pending && <p className="text-[var(--text-muted)]">Advisor thinking...</p>}
          </div>
          {error && <p className="mb-3 text-sm text-[var(--red)]">{error}</p>}
          <div className="flex gap-2">
            <input
              aria-label="Advisor message"
              className="min-w-0 flex-1 rounded-md border border-[var(--border-muted)] bg-[#080c0f] px-3 py-2 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="How should we respond?"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button
              aria-label="Send advisor message"
              className="rounded-md bg-[var(--amber)] p-2 text-black disabled:opacity-50"
              disabled={!companyId || !message.trim() || pending}
              onClick={() => void send()}
              type="button"
            >
              <Send size={18} />
            </button>
          </div>
          {!companyId && <p className="mt-2 text-xs text-[var(--text-muted)]">Complete setup to enable advisor chat.</p>}
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
