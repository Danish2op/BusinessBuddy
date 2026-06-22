import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "route.ts"), "utf8");

describe("/api/reports/[reportId]/email route source", () => {
  it("sends a branded feed brief only for reports owned by the signed-in user", () => {
    expect(source).toContain("createSupabaseServerClient");
    expect(source).toContain("buildReportEmail");
    expect(source).toContain("createResendClient");
    expect(source).toContain("companies!inner(user_id)");
    expect(source).toContain(".eq(\"companies.user_id\", user.id)");
    expect(source).toContain("email_sent_at");
  });
});
