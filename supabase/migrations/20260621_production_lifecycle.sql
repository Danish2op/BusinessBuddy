create extension if not exists pgcrypto with schema extensions;

alter table public.companies add column if not exists niche text;
alter table public.companies add column if not exists motive text;
alter table public.companies add column if not exists target_age_min integer;
alter table public.companies add column if not exists target_age_max integer;
alter table public.companies add column if not exists target_gender text;
alter table public.companies add column if not exists target_countries text[];
alter table public.companies add column if not exists target_keywords text[];
alter table public.companies add column if not exists business_costing text;
alter table public.companies add column if not exists setup_status text not null default 'draft';
alter table public.companies add column if not exists monitoring_enabled boolean not null default false;

update public.companies
set monitoring_enabled = coalesce((ai_generated_profile->>'monitoring_enabled')::boolean, false)
where monitoring_enabled is false
  and ai_generated_profile ? 'monitoring_enabled';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_setup_status_check') then
    alter table public.companies
      add constraint companies_setup_status_check check (setup_status in ('draft', 'suggestions_ready', 'complete'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'companies_user_id_key') then
    alter table public.companies
      add constraint companies_user_id_key unique (user_id);
  end if;
end;
$$;

create table if not exists public.competitor_suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  comp_name text not null,
  website text,
  linkedin_url text,
  website_domain text,
  analysis_summary text,
  risk_level text not null default 'med' check (risk_level in ('low', 'med', 'high')),
  status text not null default 'draft' check (status in ('draft', 'accepted', 'rejected')),
  source_type text not null default 'ai' check (source_type in ('ai', 'manual')),
  knowledge_block jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint competitor_suggestions_company_id_website_domain_key unique (company_id, website_domain)
);

alter table public.competitors add column if not exists linkedin_url text;
alter table public.competitors add column if not exists website_domain text;
alter table public.competitors add column if not exists source_type text not null default 'ai';
alter table public.competitors add column if not exists knowledge_block jsonb;
alter table public.competitors add column if not exists created_at timestamptz default now();

update public.competitors
set website_domain = lower(regexp_replace(regexp_replace(website, '^https?://(www\.)?', ''), '/.*$', ''))
where website_domain is null
  and website is not null;

delete from public.competitors a
using public.competitors b
where a.ctid < b.ctid
  and a.company_id = b.company_id
  and a.website_domain is not null
  and a.website_domain = b.website_domain;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'competitors_company_id_website_domain_key') then
    alter table public.competitors
      add constraint competitors_company_id_website_domain_key unique (company_id, website_domain);
  end if;
end;
$$;

alter table public.intelligence_reports add column if not exists title text;
alter table public.intelligence_reports add column if not exists source_title text;
alter table public.intelligence_reports add column if not exists risk_level text not null default 'med';
alter table public.intelligence_reports add column if not exists signal_hash text;
alter table public.intelligence_reports add column if not exists email_sent_at timestamptz;
alter table public.intelligence_reports add column if not exists email_id text;

update public.intelligence_reports
set signal_hash = encode(
  extensions.digest(
    coalesce(competitor_id::text, '') || '|' || coalesce(source_url, '') || '|' || coalesce(summary, ''),
    'sha256'
  ),
  'hex'
)
where signal_hash is null;

delete from public.intelligence_reports a
using public.intelligence_reports b
where a.ctid < b.ctid
  and a.company_id = b.company_id
  and a.signal_hash = b.signal_hash;

alter table public.intelligence_reports alter column signal_hash set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'intelligence_reports_company_signal_hash_key') then
    alter table public.intelligence_reports
      add constraint intelligence_reports_company_signal_hash_key unique (company_id, signal_hash);
  end if;
end;
$$;

create table if not exists public.advisor_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations text[],
  created_at timestamptz default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  agent_type text not null,
  status text not null check (status in ('started', 'succeeded', 'failed', 'skipped')),
  summary text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists companies_user_id_setup_status_idx on public.companies(user_id, setup_status);
create index if not exists competitor_suggestions_company_id_status_idx on public.competitor_suggestions(company_id, status);
create index if not exists advisor_messages_company_id_created_at_idx on public.advisor_messages(company_id, created_at);
create index if not exists agent_runs_company_id_created_at_idx on public.agent_runs(company_id, created_at desc);

alter table public.competitor_suggestions enable row level security;
alter table public.advisor_messages enable row level security;
alter table public.agent_runs enable row level security;

drop policy if exists "Users can manage suggestions for own companies" on public.competitor_suggestions;
create policy "Users can manage suggestions for own companies"
  on public.competitor_suggestions
  for all
  to authenticated
  using (exists (
    select 1 from public.companies
    where companies.id = competitor_suggestions.company_id
      and companies.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.companies
    where companies.id = competitor_suggestions.company_id
      and companies.user_id = auth.uid()
  ));

drop policy if exists "Users can manage advisor messages for own companies" on public.advisor_messages;
create policy "Users can manage advisor messages for own companies"
  on public.advisor_messages
  for all
  to authenticated
  using (exists (
    select 1 from public.companies
    where companies.id = advisor_messages.company_id
      and companies.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.companies
    where companies.id = advisor_messages.company_id
      and companies.user_id = auth.uid()
  ));

drop policy if exists "Users can select own agent runs" on public.agent_runs;
create policy "Users can select own agent runs"
  on public.agent_runs
  for select
  to authenticated
  using (exists (
    select 1 from public.companies
    where companies.id = agent_runs.company_id
      and companies.user_id = auth.uid()
  ));

create or replace function public.finalize_competitors(
  p_company_id uuid,
  p_accepted_ids uuid[],
  p_rejected_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_count integer;
  rejected_count integer;
begin
  if not exists (
    select 1
    from public.companies
    where id = p_company_id
      and user_id = auth.uid()
  ) then
    raise exception 'Company not found';
  end if;

  update public.competitor_suggestions
  set status = 'rejected',
      updated_at = now()
  where company_id = p_company_id
    and id = any(p_rejected_ids)
    and status = 'draft';

  get diagnostics rejected_count = row_count;

  update public.competitor_suggestions
  set status = 'accepted',
      updated_at = now()
  where company_id = p_company_id
    and id = any(p_accepted_ids)
    and status in ('draft', 'accepted');

  insert into public.competitors (
    company_id,
    comp_name,
    website,
    linkedin_url,
    website_domain,
    source_type,
    knowledge_block,
    analysis_summary,
    risk_level
  )
  select
    company_id,
    comp_name,
    website,
    linkedin_url,
    website_domain,
    source_type,
    knowledge_block,
    analysis_summary,
    risk_level
  from public.competitor_suggestions
  where company_id = p_company_id
    and id = any(p_accepted_ids)
    and status = 'accepted'
  on conflict (company_id, website_domain)
  do update set
    comp_name = excluded.comp_name,
    website = coalesce(excluded.website, public.competitors.website),
    linkedin_url = coalesce(excluded.linkedin_url, public.competitors.linkedin_url),
    source_type = excluded.source_type,
    knowledge_block = coalesce(excluded.knowledge_block, public.competitors.knowledge_block),
    analysis_summary = coalesce(excluded.analysis_summary, public.competitors.analysis_summary),
    risk_level = excluded.risk_level;

  get diagnostics accepted_count = row_count;

  update public.companies
  set setup_status = 'complete'
  where id = p_company_id
    and user_id = auth.uid();

  return jsonb_build_object(
    'accepted', accepted_count,
    'rejected', rejected_count
  );
end;
$$;
