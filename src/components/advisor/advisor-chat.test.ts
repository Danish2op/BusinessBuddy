import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "advisor-chat.tsx"), "utf8");

describe("AdvisorChat source", () => {
  it("renders citations returned by the advisor API", () => {
    expect(source).toContain("citations");
    expect(source).toContain("Citations");
  });

  it("hydrates stored advisor messages from the dashboard", () => {
    expect(source).toContain("initialMessages");
    expect(source).toContain("useState<ChatMessage[]>(initialMessages)");
  });

  it("explains setup-required disabled state", () => {
    expect(source).toContain("Complete setup to enable advisor chat.");
  });
});
