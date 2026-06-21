import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("createGeminiClient", () => {
  it("defaults to the highest-quota text fallback model", async () => {
    const { createGeminiClient } = await import("./index");
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return Response.json({
        candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }]
      });
    };

    const client = createGeminiClient({
      apiKey: "secret-key",
      fetcher,
      env: {}
    });

    await client.generateText("Return JSON.");

    expect(String(calls[0].input)).toContain("/models/gemini-3.1-flash-lite:generateContent");
  });

  it("sends the API key through a header instead of the request URL", async () => {
    const { createGeminiClient } = await import("./index");
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return Response.json({
        candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }]
      });
    };

    const client = createGeminiClient({
      apiKey: "secret-key",
      fetcher,
      model: "gemini-test"
    });

    const result = await client.generateText("Return JSON.");

    expect(result.ok).toBe(true);
    expect(String(calls[0].input)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent"
    );
    expect(String(calls[0].input)).not.toContain("secret-key");
    expect(new Headers(calls[0].init?.headers).get("x-goog-api-key")).toBe("secret-key");
  });

  it("falls back to the next configured model when the first model is rate limited", async () => {
    const { createGeminiClient } = await import("./index");
    const calls: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      calls.push(String(input));

      if (calls.length === 1) {
        return Response.json(
          {
            error: {
              message: "You exceeded your current quota."
            }
          },
          { status: 429 }
        );
      }

      return Response.json({
        candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }]
      });
    };

    const client = createGeminiClient({
      apiKey: "secret-key",
      fetcher,
      modelFallbacks: ["gemini-primary", "gemini-fallback"]
    });

    const result = await client.generateText("Return JSON.");

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-primary:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-fallback:generateContent"
    ]);
  });

  it("does not hide non-retryable Gemini failures behind fallback models", async () => {
    const { createGeminiClient } = await import("./index");
    const calls: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return Response.json(
        {
          error: {
            message: "API key not valid."
          }
        },
        { status: 400 }
      );
    };

    const client = createGeminiClient({
      apiKey: "bad-key",
      fetcher,
      modelFallbacks: ["gemini-primary", "gemini-fallback"]
    });

    const result = await client.generateText("Return JSON.");

    expect(result.ok).toBe(false);
    expect(calls).toEqual([
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-primary:generateContent"
    ]);
  });
});
