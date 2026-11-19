-- Public profiles: a learner may pick a username and share /u/<username>.
-- Run after 20261119150000_timeline_practice.sql.
--
-- Private by default. The public page reads only through public_profile(),
-- which returns the username and a stats snapshot, and only while
-- is_public is on: no email, no words, no other columns.
-- public_stats is written by the app (src/features/profile) whenever the
-- owner opens their profile or achievements, so it can lag a little.

alter table public.profiles
  add column if not exists username text,
  add column if not exists is_public boolean not null default false,
  add column if not exists public_stats jsonb;

-- Lowercase letters, digits and _, so links are stable and unambiguous.
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles
  add constraint profiles_username_check check (username ~ '^[a-z0-9_]{3,20}$');

-- Nothing to link to without a username.
alter table public.profiles drop constraint if exists profiles_public_needs_username;
alter table public.profiles
  add constraint profiles_public_needs_username check (not is_public or username is not null);

create unique index if not exists profiles_username_key on public.profiles (username);

create or replace function public.public_profile(p_username text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('username', p.username, 'stats', p.public_stats)
  from public.profiles p
  where p.username = lower(p_username) and p.is_public;
$$;

revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;
