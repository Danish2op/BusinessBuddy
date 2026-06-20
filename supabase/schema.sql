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
  ai_generated_profile jsonb
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  comp_name text not null,
  website text,
  analysis_summary text,
  risk_level text not null default 'low' check (risk_level in ('low', 'med', 'high')),
  last_scanned timestamptz,
  constraint competitors_id_company_id_key unique (id, company_id)
);

create table public.intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  summary text not null,
  source_url text,
  category text not null check (category in ('Pricing', 'Product', 'Hiring', 'News')),
  created_at timestamptz default now(),
  constraint intelligence_reports_competitor_company_fk
    foreign key (competitor_id, company_id) references public.competitors(id, company_id) on delete cascade
);

create index companies_user_id_idx on public.companies(user_id);
create index competitors_company_id_idx on public.competitors(company_id);
create index intelligence_reports_company_id_created_at_idx on public.intelligence_reports(company_id, created_at desc);
create index intelligence_reports_competitor_id_created_at_idx on public.intelligence_reports(competitor_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.competitors enable row level security;
alter table public.intelligence_reports enable row level security;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
