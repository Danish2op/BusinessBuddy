type Fetcher = typeof fetch;

export type WebsiteScrapeResult = {
  text: string;
  pagesFetched: number;
  urls: string[];
};

export function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSameOriginLinks(baseUrl: string, html: string, maxLinks = 5) {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const links: string[] = [];
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) && links.length < maxLinks) {
    try {
      const url = new URL(match[1], base);
      url.hash = "";
      if (url.origin !== base.origin || !["http:", "https:"].includes(url.protocol)) {
        continue;
      }
      if (/\.(pdf|png|jpe?g|gif|webp|svg|zip|mp4|mov)$/i.test(url.pathname)) {
        continue;
      }
      const normalized = url.toString();
      if (normalized === base.toString() || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      links.push(normalized);
    } catch {
      continue;
    }
  }

  return links;
}

export async function fetchCompanyWebsiteText(
  website: string,
  options: { fetcher?: Fetcher; maxPages?: number; maxCharacters?: number } = {}
): Promise<WebsiteScrapeResult | null> {
  const fetcher = options.fetcher ?? fetch;
  const maxPages = options.maxPages ?? 6;
  const maxCharacters = options.maxCharacters ?? 18000;
  const queue = [website];
  const fetched = new Set<string>();
  const chunks: string[] = [];
  const urls: string[] = [];

  while (queue.length > 0 && fetched.size < maxPages && chunks.join(" ").length < maxCharacters) {
    const url = queue.shift();
    if (!url || fetched.has(url)) {
      continue;
    }

    fetched.add(url);
    const response = await fetcher(url, { redirect: "follow" });
    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    urls.push(url);
    chunks.push(htmlToText(html));

    if (fetched.size === 1) {
      queue.push(...extractSameOriginLinks(url, html, maxPages - 1));
    }
  }

  const text = chunks.join("\n\n").replace(/\s+/g, " ").trim().slice(0, maxCharacters);
  if (!text) {
    return null;
  }

  return {
    text,
    pagesFetched: urls.length,
    urls
  };
}
