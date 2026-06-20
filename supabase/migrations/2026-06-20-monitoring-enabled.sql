alter table public.companies
add column if not exists monitoring_enabled boolean not null default false;
