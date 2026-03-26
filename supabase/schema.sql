create extension if not exists pgcrypto;

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  challenge_date date not null,
  title text not null,
  description text not null default '',
  rules jsonb not null default '[]'::jsonb,
  estimated_minutes integer not null default 5,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  type text not null check (type in ('picture-crossword', 'clue-ladder', 'category-sprint')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, challenge_date)
);

alter table public.daily_challenges enable row level security;

drop policy if exists "public can read published challenges" on public.daily_challenges;
create policy "public can read published challenges"
on public.daily_challenges
for select
to anon, authenticated
using (status = 'published');
