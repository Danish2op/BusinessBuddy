import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "test", "production"]),
  APP_ENV: z.enum(["development", "test", "production"])
});

const clientEnvSchema = envSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_APP_ENV: true
});

export type ServerEnv = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
type EnvSource = Record<string, string | undefined>;

export function getServerEnv(source: EnvSource = process.env): ServerEnv {
  return envSchema.parse(source);
}

export function getClientEnv(source: EnvSource = process.env): ClientEnv {
  return clientEnvSchema.parse(source);
}
