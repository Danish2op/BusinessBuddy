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
});
