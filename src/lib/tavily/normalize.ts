export type NormalizedTavilyResult = {
  title: string;
  url: string;
  domain: string;
  content: string;
  score?: number;
  publishedDate?: string;
};

type TavilyResultLike = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
  published_date?: unknown;
  publishedDate?: unknown;
};

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "spm"
]);

function toCleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function canonicalizeUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
      return undefined;
    }

    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = "";

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.searchParams.sort();

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function isTavilyResultLike(value: unknown): value is TavilyResultLike {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function domainFromUrl(value: string): string {
  return new URL(value).hostname.replace(/^www\./i, "");
}

function extractResults(response: unknown): TavilyResultLike[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const results = (response as { results?: unknown }).results;
  return Array.isArray(results) ? results.filter(isTavilyResultLike) : [];
}

export function normalizeTavilyResults(response: unknown): NormalizedTavilyResult[] {
  const seen = new Set<string>();
  const normalized: NormalizedTavilyResult[] = [];

  for (const result of extractResults(response)) {
    const rawUrl = toCleanString(result.url);
    if (!rawUrl) {
      continue;
    }

    const url = canonicalizeUrl(rawUrl);
    if (!url || seen.has(url)) {
      continue;
    }

    const domain = domainFromUrl(url);
    const title = toCleanString(result.title) ?? domain;
    const content = toCleanString(result.content) ?? "";
    const publishedDate = toCleanString(result.published_date) ?? toCleanString(result.publishedDate);

    seen.add(url);
    normalized.push({
      title,
      url,
      domain,
      content,
      score: typeof result.score === "number" ? result.score : undefined,
      publishedDate
    });
  }

  return normalized;
}
