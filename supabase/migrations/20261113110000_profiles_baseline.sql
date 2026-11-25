-- Baseline: what existed before the migration chain began. PROPOSAL.
--
-- public.profiles, its two RLS policies, handle_new_user() and the
-- on_auth_user_created trigger were created in the Supabase dashboard, not
-- by a migration; 20261114130000_profiles.sql starts by assuming them. This
-- file makes a fresh database (local stack, branch, new project) buildable
-- from migrations alone. It goes first in the chain (before
-- 20261113120000_dictionary.sql).
--
-- Production already has every object here, exactly as defined (checked
-- against a schema-only dump on 2026-11-26), so on production this file is
-- recorded as applied with `supabase migration repair --status applied
-- 20261113110000` and never executed. It is idempotent anyway: each object
-- is created only when missing, and nothing existing is altered or dropped.

-- The original table: later migrations add every other column.
create table if not exists public.profiles (
  id uuid not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can read own profile') then
    create policy "Users can read own profile" on public.profiles
      for select to authenticated using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles
      for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
end $$;

-- A profile row for every new account (name and picture from the provider, when given).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
