-- Supabase Auth + RLS setup for QuarkHabits
-- Run this AFTER backend/supabase-migration.sql

-- 1) Allow Supabase Auth users in legacy "User" table.
alter table public."User" alter column "passwordHash" drop not null;

-- 2) Auto-create user profile row when a new auth user signs up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."User" (id, email, name, "passwordHash")
  values (
    new.id::text,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Usuario'),
    null
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(public."User".name, ''), excluded.name),
      "updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- 3) Enable RLS
alter table public."User" enable row level security;
alter table public."Task" enable row level security;
alter table public."Habit" enable row level security;
alter table public."HabitLog" enable row level security;
alter table public."Event" enable row level security;
alter table public."Content" enable row level security;
alter table public."RoutineBlock" enable row level security;

-- 4) Policies by authenticated user (auth.uid() is uuid, table userId is text).
drop policy if exists "User owns profile" on public."User";
create policy "User owns profile" on public."User"
for all using (id = auth.uid()::text)
with check (id = auth.uid()::text);

drop policy if exists "Task owner policy" on public."Task";
create policy "Task owner policy" on public."Task"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Habit owner policy" on public."Habit";
create policy "Habit owner policy" on public."Habit"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "HabitLog owner policy" on public."HabitLog";
create policy "HabitLog owner policy" on public."HabitLog"
for all using (
  exists (
    select 1 from public."Habit" h
    where h.id = "HabitLog"."habitId"
      and h."userId" = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from public."Habit" h
    where h.id = "HabitLog"."habitId"
      and h."userId" = auth.uid()::text
  )
);

drop policy if exists "Event owner policy" on public."Event";
create policy "Event owner policy" on public."Event"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Content owner policy" on public."Content";
create policy "Content owner policy" on public."Content"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Routine owner policy" on public."RoutineBlock";
create policy "Routine owner policy" on public."RoutineBlock"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);
