export function isAllowedRequestOrigin(headers: Headers, options: { appUrl: string }) {
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const expected = new URL(options.appUrl).origin;

  if (origin) {
    return origin === expected;
  }

  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }

  return true;
}
