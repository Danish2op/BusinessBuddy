import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "company-logo.tsx"), "utf8");
const dashboardSource = readFileSync(join(__dirname, "dashboard/war-room.tsx"), "utf8");
const setupSource = readFileSync(join(__dirname, "setup/setup-form.tsx"), "utf8");
const dashboardPageSource = readFileSync(join(__dirname, "../app/dashboard/page.tsx"), "utf8");

describe("CompanyLogo source", () => {
  it("falls back through official favicons and Clearbit before initials", () => {
    expect(source).toContain("favicon.ico");
    expect(source).toContain("apple-touch-icon.png");
    expect(source).toContain("logo.clearbit.com");
    expect(source).toContain("onError");
  });

  it("is used by dashboard and setup competitor surfaces", () => {
    expect(dashboardSource).toContain("<CompanyLogo");
    expect(setupSource).toContain("<CompanyLogo");
  });

  it("loads dashboard feed newest-first", () => {
    expect(dashboardPageSource).toContain(".from(\"intelligence_reports\")");
    expect(dashboardPageSource).toContain(".order(\"created_at\", { ascending: false })");
  });
});
