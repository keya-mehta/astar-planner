-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Creates one private row per student that holds their whole planner.

create table if not exists public.planners (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planners enable row level security;

drop policy if exists "Read own planner"   on public.planners;
drop policy if exists "Create own planner" on public.planners;
drop policy if exists "Update own planner" on public.planners;
drop policy if exists "Delete own planner" on public.planners;

create policy "Read own planner"   on public.planners for select using (auth.uid() = user_id);
create policy "Create own planner" on public.planners for insert with check (auth.uid() = user_id);
create policy "Update own planner" on public.planners for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own planner" on public.planners for delete using (auth.uid() = user_id);
