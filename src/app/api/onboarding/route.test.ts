import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(__dirname, "route.ts"), "utf8");

describe("/api/onboarding route source", () => {
  it("returns saved competitor suggestions with database ids after upsert", () => {
    expect(routeSource).toContain("savedSuggestions");
    expect(routeSource).toContain(".select(\"id,comp_name,website,linkedin_url,website_domain,analysis_summary,risk_level,status,source_type,knowledge_block\")");
    expect(routeSource).toContain("logo_url: suggestion.knowledge_block?.logo_url ?? null");
    expect(routeSource).toContain("competitorSuggestions: savedSuggestions");
    expect(routeSource).not.toContain("competitorSuggestions: mapped.data.competitor_suggestions");
  });
});
