"use client";

import { Loader2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

type AdvisorChatProps = {
  companyId?: string;
  embedded?: boolean;
  initialMessages?: ChatMessage[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export function AdvisorChat({ companyId, embedded = false, initialMessages = [] }: AdvisorChatProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

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

  const panel = (
    <section
      className={
        embedded
          ? "advisor-panel glass-panel grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-2xl"
          : "advisor-panel glass-panel w-[min(92vw,420px)] rounded-2xl p-4 shadow-2xl"
      }
    >
      <div className={embedded ? "border-b border-[var(--border-muted)] p-5" : "mb-3 flex items-center justify-between"}>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-[rgba(214,166,64,0.28)] bg-[rgba(214,166,64,0.1)] shadow-[0_0_28px_rgba(214,166,64,0.1)]">
            <MessageSquare size={18} className="text-[var(--amber)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Strategic Advisor</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Stored advisory thread with live market context.
            </p>
          </div>
        </div>
        {!embedded && (
          <button aria-label="Close advisor" className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setOpen(false)}>
            Close
          </button>
        )}
      </div>
      <div className={embedded ? "grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 p-5" : ""}>
        <div className={`advisor-scroll glass-row overflow-y-auto rounded-xl p-3 text-sm text-[var(--text-secondary)] ${embedded ? "min-h-0" : "max-h-[58vh] min-h-[360px]"}`}>
          {messages.length === 0 && (
            <div className="grid h-full min-h-[360px] place-items-center text-center text-[var(--text-muted)]">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-[rgba(214,166,64,0.28)] bg-[rgba(214,166,64,0.08)]">
                  <MessageSquare size={22} className="text-[var(--amber)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">No advisor thread yet.</p>
                <p className="mt-2 text-xs leading-5">Ask about positioning, pricing response, competitor moves, or where to attack next.</p>
              </div>
            </div>
          )}
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`animate-rise mb-3 whitespace-pre-wrap rounded-xl border p-3 last:mb-0 ${
              item.role === "assistant"
                ? "ml-0 mr-auto max-w-[86%] border-[rgba(214,166,64,0.22)] bg-[rgba(214,166,64,0.06)]"
                : "ml-auto mr-0 max-w-[86%] border-[rgba(143,191,99,0.2)] bg-[rgba(143,191,99,0.08)]"
            }`}>
              <div className="mb-2 text-xs uppercase tracking-[0.14em]">
                <span className={item.role === "assistant" ? "text-[var(--amber)]" : "text-[var(--green)]"}>
                  {item.role === "assistant" ? "Advisor" : "You"}
                </span>
              </div>
              <div>{item.content}</div>
              {item.role === "assistant" && item.citations && item.citations.length > 0 && (
                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  Citations: {item.citations.join(", ")}
                </div>
              )}
            </div>
          ))}
          {pending && (
            <p className="inline-flex items-center gap-2 rounded border border-[var(--border-muted)] px-3 py-2 text-[var(--text-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Advisor analyzing market context...
            </p>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-[var(--red)]">{error}</p>}
        <div className="mt-3 flex gap-2 rounded-xl border border-[var(--border-muted)] bg-[rgba(3,7,8,0.54)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <input
            aria-label="Advisor message"
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-muted)]"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={companyId ? "Ask the advisor..." : "Complete setup to enable advisor"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void send();
              }
            }}
          />
          <button
            aria-label="Send advisor message"
            className="inline-flex min-w-12 items-center justify-center rounded-md bg-[var(--amber)] px-4 text-black transition hover:bg-[var(--amber-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!companyId || !message.trim() || pending}
            onClick={() => void send()}
            type="button"
          >
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {!companyId && <p className="mt-2 text-xs text-[var(--text-muted)]">Complete setup to enable advisor chat.</p>}
      </div>
    </section>
  );

  if (embedded) {
    return panel;
  }

  return (
    <div className="fixed bottom-5 right-5 z-20">
      {open ? (
        panel
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
