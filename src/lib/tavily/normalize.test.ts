import { describe, expect, it } from "vitest";

import { normalizeTavilyResults } from "./normalize";

describe("normalizeTavilyResults", () => {
  it("returns an empty list for malformed responses", () => {
    expect(normalizeTavilyResults(null)).toEqual([]);
    expect(normalizeTavilyResults({ results: "not an array" })).toEqual([]);
  });

  it("returns an empty list for empty Tavily responses", () => {
    expect(normalizeTavilyResults({ results: [] })).toEqual([]);
  });

  it("canonicalizes and deduplicates URLs", () => {
    const results = normalizeTavilyResults({
      results: [
        {
          title: "First",
          url: "https://Example.com/path/?utm_source=newsletter#section",
          content: "First result",
          score: 0.9
        },
        {
          title: "Duplicate",
          url: "https://example.com/path/",
          content: "Duplicate result",
          score: 0.7
        }
      ]
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "First",
      url: "https://example.com/path",
      domain: "example.com",
      content: "First result",
      score: 0.9
    });
  });

  it("normalizes valid output and skips unusable rows", () => {
    const results = normalizeTavilyResults({
      results: [
        {
          title: "  Market map  ",
          url: "https://www.vendor.com/report",
          content: "  Useful summary  "
        },
        {
          title: "Missing URL",
          content: "No URL"
        },
        {
          title: "",
          url: "not a url",
          content: "Bad URL"
        }
      ]
    });

    expect(results).toEqual([
      {
        title: "Market map",
        url: "https://www.vendor.com/report",
        domain: "vendor.com",
        content: "Useful summary",
        score: undefined,
        publishedDate: undefined
      }
    ]);
  });

  it("rejects non-http URLs", () => {
    const results = normalizeTavilyResults({
      results: [
        {
          title: "Bad script",
          url: "javascript:alert(1)",
          content: "Unsafe"
        },
        {
          title: "Bad mail",
          url: "mailto:team@example.com",
          content: "Unsafe"
        },
        {
          title: "Good",
          url: "https://safe.example.com/update",
          content: "Safe"
        }
      ]
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe("https://safe.example.com/update");
  });

  it("skips malformed result items inside results arrays", () => {
    const results = normalizeTavilyResults({
      results: [
        null,
        "not an object",
        ["array"],
        {
          title: "Valid",
          url: "https://example.com/news",
          content: "Useful"
        }
      ]
    });

    expect(results).toEqual([
      {
        title: "Valid",
        url: "https://example.com/news",
        domain: "example.com",
        content: "Useful",
        score: undefined,
        publishedDate: undefined
      }
    ]);
  });
});
