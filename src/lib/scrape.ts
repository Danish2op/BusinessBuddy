type Fetcher = typeof fetch;

export type WebsiteScrapeResult = {
  text: string;
  pagesFetched: number;
  urls: string[];
};

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function isSafeScrapeUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("[")
    ) {
      return false;
    }
    return !isPrivateIpv4(hostname);
  } catch {
    return false;
  }
}

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

    if (!isSafeScrapeUrl(url)) {
      continue;
    }

    fetched.add(url);
    const response = await fetcher(url, { redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const nextUrl = new URL(location, url).toString();
        if (isSafeScrapeUrl(nextUrl) && !fetched.has(nextUrl)) {
          queue.unshift(nextUrl);
        }
      }
      continue;
    }

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
