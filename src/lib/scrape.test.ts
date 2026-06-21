import { describe, expect, it } from "vitest";

import { extractSameOriginLinks, fetchCompanyWebsiteText, htmlToText } from "@/lib/scrape";

describe("website scraping helpers", () => {
  it("converts html to compact text", () => {
    expect(htmlToText("<main>Hello&nbsp;<strong>world</strong><script>nope</script></main>")).toBe("Hello world");
  });

  it("extracts bounded same-origin page links", () => {
    const links = extractSameOriginLinks(
      "https://example.com",
      [
        '<a href="/pricing">Pricing</a>',
        '<a href="https://example.com/about#team">About</a>',
        '<a href="https://other.example/news">Other</a>',
        '<a href="/deck.pdf">PDF</a>'
      ].join("")
    );

    expect(links).toEqual(["https://example.com/pricing", "https://example.com/about"]);
  });

  it("fetches the homepage and discovered internal pages", async () => {
    const pages = new Map([
      [
        "https://example.com/",
        '<main>Home page<a href="/pricing">Pricing</a><a href="https://other.example/">Other</a></main>'
      ],
      ["https://example.com/pricing", "<main>Pricing page</main>"]
    ]);

    const result = await fetchCompanyWebsiteText("https://example.com/", {
      fetcher: async (url) =>
        new Response(pages.get(String(url)) ?? "", {
          status: pages.has(String(url)) ? 200 : 404
        }),
      maxPages: 3
    });

    expect(result?.pagesFetched).toBe(2);
    expect(result?.text).toContain("Home page");
    expect(result?.text).toContain("Pricing page");
  });
});
