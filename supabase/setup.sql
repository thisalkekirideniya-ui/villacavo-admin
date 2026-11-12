-- Villa Cavo admin — run this once in Supabase → SQL Editor → New query → Run.

-- Every publish adds one row. The newest row is what the website shows;
-- older rows are the "Publish history" (the admin keeps the last 30).
create table if not exists public.site_versions (
  id         bigint generated always as identity primary key,
  content    jsonb       not null,
  saved_at   timestamptz not null default now()
);

create index if not exists site_versions_saved_at_idx on public.site_versions (saved_at desc);

-- Lock the table: with RLS on and no policies, only the admin's server
-- (using the secret service_role key) can read or write it. The public
-- anon key gets nothing, so nobody can edit the site from the browser.
alter table public.site_versions enable row level security;

-- Public bucket for uploaded photos (used only when Cloudinary is not set up).
-- Anyone can view the photos; only the admin's server can upload or delete.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
