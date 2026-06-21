import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const competitorForm = readFileSync(join(__dirname, "competitor-form.tsx"), "utf8");
const monitoringToggle = readFileSync(join(__dirname, "monitoring-toggle.tsx"), "utf8");
const websiteIntelButton = readFileSync(join(__dirname, "website-intel-button.tsx"), "utf8");

describe("dashboard button feedback", () => {
  it("manual competitor add shows server-provided errors and clears on success", () => {
    expect(competitorForm).toContain("await response.json()");
    expect(competitorForm).toContain("body?.error");
    expect(competitorForm).toContain("event.currentTarget.reset()");
  });

  it("monitoring toggle displays failures instead of silently ignoring them", () => {
    expect(monitoringToggle).toContain("setMessage");
    expect(monitoringToggle).toContain("body?.error");
  });

  it("website intel displays server-provided errors", () => {
    expect(websiteIntelButton).toContain("await response.json()");
    expect(websiteIntelButton).toContain("body?.error");
  });
});
