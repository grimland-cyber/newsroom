create table releases (
  id uuid primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_published boolean not null default true,
  media_assets jsonb not null default '[]'::jsonb
);

-- Allow public read access
alter table releases enable row level security;

create policy "Public can read published releases"
  on releases for select
  using (is_published = true);

create policy "Service role full access"
  on releases for all
  using (true)
  with check (true);
