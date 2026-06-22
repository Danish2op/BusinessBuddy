import { describe, expect, it } from "vitest";

import { isAllowedRequestOrigin } from "@/lib/security/origin";

describe("isAllowedRequestOrigin", () => {
  it("accepts same-origin writes", () => {
    expect(
      isAllowedRequestOrigin(new Headers({ origin: "https://project-y550t.vercel.app" }), {
        appUrl: "https://project-y550t.vercel.app"
      })
    ).toBe(true);
  });

  it("accepts same-origin writes from the actual deployed alias host", () => {
    expect(
      isAllowedRequestOrigin(new Headers({ origin: "https://businessbuddy.danis.live" }), {
        appUrl: "https://project-y550t.vercel.app",
        requestUrl: "https://businessbuddy.danis.live/api/monitoring"
      })
    ).toBe(true);
  });

  it("rejects cross-origin writes", () => {
    expect(
      isAllowedRequestOrigin(new Headers({ origin: "https://evil.example" }), {
        appUrl: "https://project-y550t.vercel.app",
        requestUrl: "https://businessbuddy.danis.live/api/monitoring"
      })
    ).toBe(false);
  });

  it("allows missing origin for non-browser server calls", () => {
    expect(isAllowedRequestOrigin(new Headers(), { appUrl: "https://project-y550t.vercel.app" })).toBe(true);
  });
});
