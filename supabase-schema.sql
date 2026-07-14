-- ============================================================
-- Hebrew Newsroom — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists press_releases (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  content       text not null default '',
  excerpt       text,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  is_published  boolean not null default true,
  media_assets  jsonb not null default '[]'::jsonb,
  category      text
);

-- For databases created before the category column existed:
alter table press_releases add column if not exists category text;

-- Index for fast slug lookups
create index if not exists press_releases_slug_idx on press_releases (slug);

-- Index for feed ordering
create index if not exists press_releases_published_at_idx on press_releases (published_at desc);

-- Enable Row Level Security
alter table press_releases enable row level security;

-- Public can read published releases (the newsroom feed)
create policy "Public read published"
  on press_releases for select
  using (is_published = true);

-- Authenticated users (PR team) can do everything
create policy "Auth full access"
  on press_releases for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- After running this SQL:
-- 1. Go to Authentication → Users → Add user
--    and create your PR team logins.
-- 2. Copy your Project URL and anon key from
--    Settings → API into .env.local
-- ============================================================
