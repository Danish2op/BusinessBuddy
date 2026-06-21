import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(__dirname, "route.ts"), "utf8");

describe("/api/competitors route source", () => {
  it("uses website scraping and Gemini enrichment for dashboard manual adds", () => {
    expect(routeSource).toContain("fetchCompanyWebsiteText");
    expect(routeSource).toContain("generateJsonWithSchema");
    expect(routeSource).toContain("knowledge_block");
  });

  it("upserts duplicate competitor domains and returns server error details", () => {
    expect(routeSource).toContain(".upsert(");
    expect(routeSource).toContain("onConflict: \"company_id,website_domain\"");
    expect(routeSource).toContain("detail:");
  });
});
