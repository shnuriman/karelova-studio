-- Виконати один раз: Supabase → SQL Editor → New query → Run
create table if not exists public.crm_data (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.crm_data enable row level security;
create policy "own row only" on public.crm_data
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
