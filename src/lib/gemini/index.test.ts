import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("createGeminiClient", () => {
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
});
