import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = join(__dirname, "../../..");
const schemaPath = join(projectRoot, "supabase/schema.sql");
const browserClientPath = join(__dirname, "browser.ts");
const adminClientPath = join(__dirname, "admin.ts");

function read(path: string) {
  if (!existsSync(path)) {
    return "";
  }

  return readFileSync(path, "utf8");
}

function normalizeSql(sql: string) {
  return sql.toLowerCase().replace(/\s+/g, " ").trim();
}

function compactSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function tableBlock(sql: string, tableName: string) {
  const match = sql.match(
    new RegExp(`create table public\\.${tableName}\\s*\\((?<body>[\\s\\S]*?)\\);`, "i")
  );

  return match?.groups?.body ?? "";
}

function policyBlock(sql: string, policyName: string) {
  const match = sql.match(
    new RegExp(`create policy "${policyName}"[\\s\\S]*?;`, "i")
  );

  return normalizeSql(match?.[0] ?? "");
}

describe("Supabase schema", () => {
  const schema = read(schemaPath);
  const normalizedSchema = normalizeSql(schema);

  it("defines the requested tables and columns", () => {
    const profiles = normalizeSql(tableBlock(schema, "profiles"));
    const companies = normalizeSql(tableBlock(schema, "companies"));
    const competitors = normalizeSql(tableBlock(schema, "competitors"));
    const reports = normalizeSql(tableBlock(schema, "intelligence_reports"));

    expect(profiles).toContain("id uuid primary key references auth.users(id) on delete cascade");
    expect(profiles).toContain("email text");
    expect(profiles).toContain("created_at timestamptz default now()");

    expect(companies).toContain("id uuid primary key");
    expect(companies).toContain("user_id uuid not null references public.profiles(id) on delete cascade");
    expect(companies).toContain("name text not null");
    expect(companies).toContain("website text");
    expect(companies).toContain("linkedin_url text");
    expect(companies).toContain("moat_description text");
    expect(companies).toContain("team_details text");
    expect(companies).toContain("industry text");
    expect(companies).toContain("ai_generated_profile jsonb");

    expect(competitors).toContain("company_id uuid not null references public.companies(id) on delete cascade");
    expect(competitors).toContain("comp_name text not null");
    expect(competitors).toContain("website text");
    expect(competitors).toContain("analysis_summary text");
    expect(competitors).toContain("risk_level text");
    expect(competitors).toContain("last_scanned timestamptz");

    expect(reports).toContain("competitor_id uuid not null references public.competitors(id) on delete cascade");
    expect(reports).toContain("company_id uuid not null references public.companies(id) on delete cascade");
    expect(reports).toContain("summary text not null");
    expect(reports).toContain("source_url text");
    expect(reports).toContain("category text not null");
    expect(reports).toContain("created_at timestamptz default now()");
  });

  it("enforces allowed risk and report category values", () => {
    expect(normalizedSchema).toContain("risk_level in ('low', 'med', 'high')");
    expect(compactSql(schema)).toContain("category in ('Pricing', 'Product', 'Hiring', 'News')");
  });

  it("adds ownership and report feed indexes", () => {
    expect(normalizedSchema).toContain("create index companies_user_id_idx on public.companies(user_id)");
    expect(normalizedSchema).toContain("create index competitors_company_id_idx on public.competitors(company_id)");
    expect(normalizedSchema).toContain("create index intelligence_reports_company_id_created_at_idx on public.intelligence_reports(company_id, created_at desc)");
    expect(normalizedSchema).toContain("create index intelligence_reports_competitor_id_created_at_idx on public.intelligence_reports(competitor_id, created_at desc)");
  });

  it("enables row level security on every application table", () => {
    for (const table of ["profiles", "companies", "competitors", "intelligence_reports"]) {
      expect(normalizedSchema).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("defines ownership policies for profiles, companies, competitors, and report reads", () => {
    expect(policyBlock(schema, "Users can select own profile")).toContain("for select to authenticated");
    expect(policyBlock(schema, "Users can insert own profile")).toContain("with check (auth.uid() = id)");
    expect(policyBlock(schema, "Users can update own profile")).toContain("using (auth.uid() = id)");
    expect(policyBlock(schema, "Users can delete own profile")).toContain("using (auth.uid() = id)");

    expect(policyBlock(schema, "Users can select own companies")).toContain("using (auth.uid() = user_id)");
    expect(policyBlock(schema, "Users can insert own companies")).toContain("with check (auth.uid() = user_id)");
    expect(policyBlock(schema, "Users can update own companies")).toContain("using (auth.uid() = user_id)");
    expect(policyBlock(schema, "Users can delete own companies")).toContain("using (auth.uid() = user_id)");

    expect(policyBlock(schema, "Users can select competitors for own companies")).toContain("for select to authenticated");
    expect(policyBlock(schema, "Users can insert competitors for own companies")).toContain("with check (exists");
    expect(policyBlock(schema, "Users can update competitors for own companies")).toContain("using (exists");
    expect(policyBlock(schema, "Users can delete competitors for own companies")).toContain("using (exists");

    expect(policyBlock(schema, "Users can select reports for own companies")).toContain("for select to authenticated");
    expect(policyBlock(schema, "Users can select reports for own companies")).toContain("using (exists");
  });

  it("does not grant authenticated users write access to intelligence reports", () => {
    const reportWritePolicies = schema.match(
      /create policy "[^"]+" on public\.intelligence_reports[\s\S]*?for (insert|update|delete|all) to authenticated[\s\S]*?;/gi
    );

    expect(reportWritePolicies).toBeNull();
  });

  it("creates profiles automatically after auth user creation", () => {
    expect(normalizedSchema).toContain("create or replace function public.handle_new_user()");
    expect(normalizedSchema).toContain("insert into public.profiles (id, email)");
    expect(normalizedSchema).toContain("new.id");
    expect(normalizedSchema).toContain("new.email");
    expect(normalizedSchema).toContain("after insert on auth.users");
    expect(normalizedSchema).toContain("execute function public.handle_new_user()");
  });
});

describe("Supabase clients", () => {
  it("keeps the browser client limited to public env", () => {
    const browserClient = read(browserClientPath);

    expect(browserClient).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(browserClient).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(browserClient).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserClient).toContain("createBrowserClient");
  });

  it("keeps the admin client server-only and service-role based", () => {
    const adminClient = read(adminClientPath);

    expect(adminClient).toContain('import "server-only"');
    expect(adminClient).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(adminClient).toContain("createClient");
  });
});
