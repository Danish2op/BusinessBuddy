import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "war-room.tsx"), "utf8");

describe("WarRoom source", () => {
  it("renders competitor website and LinkedIn evidence instead of hiding it", () => {
    expect(source).toContain("linkedin_url");
    expect(source).toContain("Website");
    expect(source).toContain("LinkedIn");
  });

  it("does not render placeholder href navigation links", () => {
    expect(source).not.toContain('href="#"');
  });

  it("does not render fake static sidebar navigation labels", () => {
    expect(source).not.toContain("Intelligence\", \"Competitors\", \"Strategy\", \"Risks\", \"Settings");
  });

  it("embeds the strategic advisor in the dashboard work surface", () => {
    expect(source).toContain("advisor-panel");
    expect(source).toContain("<AdvisorChat");
  });

  it("uses a real dashboard rail with page switching and logout", () => {
    expect(source).toContain("useState<DashboardPage>");
    expect(source).toContain("navigationItems");
    expect(source).toContain("LogoutButton");
    expect(source).toContain("setActivePage");
  });

  it("labels risk as status instead of rendering a clickable-looking text pill", () => {
    expect(source).toContain("Risk:");
    expect(source).not.toContain("{competitor.risk_level}</span>");
  });
});
