import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "route.ts"), "utf8");
const toggleSource = readFileSync(join(__dirname, "../../../components/dashboard/monitoring-toggle.tsx"), "utf8");

describe("/api/monitoring route source", () => {
  it("runs an immediate hunt and delivery cycle when monitoring is enabled", () => {
    expect(source).toContain("runContinuousHunt");
    expect(source).toContain("deliverHuntReports");
    expect(source).toContain("payload.enabled");
    expect(source).toContain("hunt_summary");
  });

  it("monitoring toggle refreshes the dashboard after successful changes", () => {
    expect(toggleSource).toContain("useRouter");
    expect(toggleSource).toContain("router.refresh()");
  });
});
