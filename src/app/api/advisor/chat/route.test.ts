import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "route.ts"), "utf8");

describe("/api/advisor/chat route source", () => {
  it("does not persist the user message before advisor generation succeeds", () => {
    const userInsertIndex = source.indexOf('role: "user"');
    const answerIndex = source.indexOf("const answer = await answerAdvisorQuestion");

    expect(userInsertIndex).toBeGreaterThan(answerIndex);
  });
});
