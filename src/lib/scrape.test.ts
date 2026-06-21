import { describe, expect, it } from "vitest";

import { extractSameOriginLinks, fetchCompanyWebsiteText, htmlToText, isSafeScrapeUrl } from "@/lib/scrape";

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

  it("blocks local, private, and metadata urls before fetching", async () => {
    expect(isSafeScrapeUrl("https://example.com")).toBe(true);
    expect(isSafeScrapeUrl("http://localhost:3000")).toBe(false);
    expect(isSafeScrapeUrl("http://127.0.0.1")).toBe(false);
    expect(isSafeScrapeUrl("http://10.0.0.2")).toBe(false);
    expect(isSafeScrapeUrl("http://172.16.0.10")).toBe(false);
    expect(isSafeScrapeUrl("http://192.168.1.10")).toBe(false);
    expect(isSafeScrapeUrl("http://169.254.169.254/latest/meta-data")).toBe(false);

    let fetched = false;
    const result = await fetchCompanyWebsiteText("http://127.0.0.1", {
      fetcher: async () => {
        fetched = true;
        return new Response("<main>local</main>");
      }
    });

    expect(result).toBeNull();
    expect(fetched).toBe(false);
  });

  it("blocks redirects to unsafe urls", async () => {
    const seen: string[] = [];
    const result = await fetchCompanyWebsiteText("https://example.com/", {
      fetcher: async (url, init) => {
        seen.push(String(url));
        if (init?.redirect === "follow") {
          return new Response("<main>unsafe local content</main>");
        }
        return new Response("", {
          status: 302,
          headers: { location: "http://127.0.0.1/admin" }
        });
      }
    });

    expect(result).toBeNull();
    expect(seen).toEqual(["https://example.com/"]);
  });
});
