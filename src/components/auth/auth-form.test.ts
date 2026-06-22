import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "auth-form.tsx"), "utf8");
const authPage = readFileSync(join(__dirname, "../../app/auth/page.tsx"), "utf8");

describe("auth experience source", () => {
  it("shows visible pending feedback for login and signup submit states", () => {
    expect(source).toContain("Loader2");
    expect(source).toContain("Authenticating...");
    expect(source).toContain("Creating profile...");
    expect(source).toContain("Authenticating credentials and loading your war-room...");
    expect(source).toContain("disabled={pending}");
  });

  it("renders product meaning and an animated brand scene on the auth page", () => {
    expect(authPage).toContain("Know the move before it becomes the threat.");
    expect(authPage).toContain("auth-intel-object");
    expect(authPage).toContain("intel-node");
    expect(authPage).toContain("Map your moat, monitor rivals");
  });
});
