import { describe, expect, it } from "vitest";

import { getClientEnv, getServerEnv } from "./env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  GOOGLE_GENERATIVE_AI_API_KEY: "google-api-key",
  TAVILY_API_KEY: "tavily-api-key",
  RESEND_API_KEY: "resend-api-key",
  RESEND_FROM_EMAIL: "BusinessBuddy <hello@example.com>",
  CRON_SECRET: "cron-secret",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_ENV: "test",
  APP_ENV: "test"
};

describe("env validation", () => {
  it("server validation catches missing required keys", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _missing, ...missingServiceRole } = validEnv;

    expect(() => getServerEnv(missingServiceRole)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("client env excludes server-only secrets", () => {
    const clientEnv = getClientEnv(validEnv);

    expect(clientEnv).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: validEnv.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_ENV: validEnv.NEXT_PUBLIC_APP_ENV
    });
    expect(clientEnv).not.toHaveProperty("APP_ENV");
    expect(clientEnv).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientEnv).not.toHaveProperty("GOOGLE_GENERATIVE_AI_API_KEY");
    expect(clientEnv).not.toHaveProperty("TAVILY_API_KEY");
    expect(clientEnv).not.toHaveProperty("RESEND_API_KEY");
    expect(clientEnv).not.toHaveProperty("CRON_SECRET");
  });

  it("client validation catches missing public app env", () => {
    const { NEXT_PUBLIC_APP_ENV: _missing, ...missingPublicAppEnv } = validEnv;

    expect(() => getClientEnv(missingPublicAppEnv)).toThrow(/NEXT_PUBLIC_APP_ENV/);
  });

  it("valid env parses", () => {
    expect(getServerEnv(validEnv)).toMatchObject(validEnv);
  });
});
