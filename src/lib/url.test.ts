import { describe, expect, it } from "vitest";

import { normalizeOptionalHttpUrl } from "@/lib/url";

describe("normalizeOptionalHttpUrl", () => {
  it("normalizes domains without a scheme", () => {
    expect(normalizeOptionalHttpUrl("example.com")).toBe("https://example.com/");
  });

  it("allows http and https urls", () => {
    expect(normalizeOptionalHttpUrl("http://example.com/a")).toBe("http://example.com/a");
    expect(normalizeOptionalHttpUrl("https://example.com/a")).toBe("https://example.com/a");
  });

  it("rejects non-http values", () => {
    expect(normalizeOptionalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeOptionalHttpUrl("localhost")).toBeNull();
    expect(normalizeOptionalHttpUrl("")).toBeNull();
  });
});
