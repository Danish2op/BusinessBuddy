create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  website text,
  linkedin_url text,
  moat_description text,
  team_details text,
  industry text,
  niche text,
  motive text,
  target_age_min integer,
  target_age_max integer,
  target_gender text,
  target_countries text[],
  target_keywords text[],
  business_costing text,
  setup_status text not null default 'draft' check (setup_status in ('draft', 'suggestions_ready', 'complete')),
  monitoring_enabled boolean not null default false,
  ai_generated_profile jsonb,
  constraint companies_user_id_key unique (user_id)
);

create table public.competitor_suggestions (
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

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  comp_name text not null,
  website text,
  linkedin_url text,
  website_domain text,
  source_type text not null default 'ai' check (source_type in ('ai', 'manual')),
  knowledge_block jsonb,
  analysis_summary text,
  risk_level text not null default 'low' check (risk_level in ('low', 'med', 'high')),
  created_at timestamptz default now(),
  last_scanned timestamptz,
  constraint competitors_id_company_id_key unique (id, company_id),
  constraint competitors_company_id_website_domain_key unique (company_id, website_domain)
);

create table public.intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  summary text not null,
  source_url text,
  source_title text,
  category text not null check (category in ('Pricing', 'Product', 'Hiring', 'News')),
  risk_level text not null default 'med' check (risk_level in ('low', 'med', 'high')),
  signal_hash text not null,
  email_sent_at timestamptz,
  email_id text,
  created_at timestamptz default now(),
  constraint intelligence_reports_competitor_company_fk
    foreign key (competitor_id, company_id) references public.competitors(id, company_id) on delete cascade,
  constraint intelligence_reports_company_signal_hash_key unique (company_id, signal_hash)
);

create table public.advisor_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations text[],
  created_at timestamptz default now()
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  agent_type text not null,
  status text not null check (status in ('started', 'succeeded', 'failed', 'skipped')),
  summary text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index companies_user_id_idx on public.companies(user_id);
create index companies_user_id_setup_status_idx on public.companies(user_id, setup_status);
create index competitor_suggestions_company_id_status_idx on public.competitor_suggestions(company_id, status);
create index competitors_company_id_idx on public.competitors(company_id);
create index intelligence_reports_company_id_created_at_idx on public.intelligence_reports(company_id, created_at desc);
create index intelligence_reports_competitor_id_created_at_idx on public.intelligence_reports(competitor_id, created_at desc);
create index advisor_messages_company_id_created_at_idx on public.advisor_messages(company_id, created_at);
create index agent_runs_company_id_created_at_idx on public.agent_runs(company_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.competitor_suggestions enable row level security;
alter table public.competitors enable row level security;
alter table public.intelligence_reports enable row level security;
alter table public.advisor_messages enable row level security;
alter table public.agent_runs enable row level security;

create policy "Users can select own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

create policy "Users can select own companies"
  on public.companies
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own companies"
  on public.companies
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own companies"
  on public.companies
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own companies"
  on public.companies
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can manage suggestions for own companies"
  on public.competitor_suggestions
  for all
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = competitor_suggestions.company_id
      and companies.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.companies
    where companies.id = competitor_suggestions.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can select competitors for own companies"
  on public.competitors
  for select
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = competitors.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can insert competitors for own companies"
  on public.competitors
  for insert
  to authenticated
  with check (exists (
    select 1
    from public.companies
    where companies.id = competitors.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can update competitors for own companies"
  on public.competitors
  for update
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = competitors.company_id
      and companies.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.companies
    where companies.id = competitors.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can delete competitors for own companies"
  on public.competitors
  for delete
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = competitors.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can select reports for own companies"
  on public.intelligence_reports
  for select
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = intelligence_reports.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can manage advisor messages for own companies"
  on public.advisor_messages
  for all
  to authenticated
  using (exists (
    select 1
    from public.companies
    where companies.id = advisor_messages.company_id
      and companies.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.companies
    where companies.id = advisor_messages.company_id
      and companies.user_id = auth.uid()
  ));

create policy "Users can select own agent runs"
  on public.agent_runs
  for select
  to authenticated
  using (exists (
    select 1
    from public.companies
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
