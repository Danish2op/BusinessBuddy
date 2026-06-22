export function isAllowedRequestOrigin(headers: Headers, options: { appUrl: string; requestUrl?: string }) {
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const allowedOrigins = new Set([new URL(options.appUrl).origin]);

  if (options.requestUrl) {
    allowedOrigins.add(new URL(options.requestUrl).origin);
  }

  if (origin) {
    return allowedOrigins.has(origin);
  }

  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return true;
}
