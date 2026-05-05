-- QuarkHabits schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor.

create table if not exists public."User" (
  id text primary key,
  email text not null unique,
  "passwordHash" text not null,
  name text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."Task" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  priority text not null default 'medium',
  category text,
  tags text,
  "dueDate" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "Task_userId_idx" on public."Task" ("userId");

create table if not exists public."Habit" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  name text not null,
  frequency text not null default 'daily',
  color text not null default '#6366f1',
  icon text,
  streak int not null default 0,
  "createdAt" timestamptz not null default now()
);
create index if not exists "Habit_userId_idx" on public."Habit" ("userId");

create table if not exists public."HabitLog" (
  id text primary key,
  "habitId" text not null references public."Habit"(id) on delete cascade,
  date text not null,
  completed boolean not null default false,
  comment text,
  unique("habitId", date)
);

alter table public."HabitLog"
  add column if not exists comment text;

create table if not exists public."Event" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  title text not null,
  description text,
  "startTime" timestamptz not null,
  "endTime" timestamptz,
  "allDay" boolean not null default false,
  color text not null default '#6366f1',
  "taskId" text,
  "createdAt" timestamptz not null default now()
);
create index if not exists "Event_userId_idx" on public."Event" ("userId");

create table if not exists public."Content" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  "templateType" text not null,
  topic text not null,
  audience text,
  tone text,
  body text not null,
  starred boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "Content_userId_idx" on public."Content" ("userId");

create table if not exists public."RoutineBlock" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  title text not null,
  "timeSlot" text not null,
  "startTime" text,
  "endTime" text,
  activity text not null,
  recurring boolean not null default true,
  "dayOfWeek" text,
  "planDate" text,
  "order" int not null default 0,
  completed boolean not null default false,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
create index if not exists "RoutineBlock_userId_idx" on public."RoutineBlock" ("userId");

-- Optional: enable row-level security (if you later move to Supabase Auth)
-- alter table public."User" enable row level security;
-- alter table public."Task" enable row level security;
-- alter table public."Habit" enable row level security;
-- alter table public."HabitLog" enable row level security;
-- alter table public."Event" enable row level security;
-- alter table public."Content" enable row level security;
-- alter table public."RoutineBlock" enable row level security;
