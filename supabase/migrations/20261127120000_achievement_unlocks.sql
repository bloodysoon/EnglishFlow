-- Permanent, server-authoritative achievement unlocks.
-- PROPOSAL ONLY: not applied anywhere. See ../README.md.
-- Run after the existing chain (english-app/supabase/migrations); the catalog
-- seed (20261127120100_achievement_catalog_v1.sql) follows it.
--
--   achievement_catalog           every unit (id, version, readiness, trust source)
--   achievement_trust             which forgeable inputs may back an unlock yet
--   achievement_completionist_v1  The Completionist's 199 frozen prerequisites
--   achievement_unlocks           the ledger: insert-only, owner-readable
--   achievement_sync_state        last sync per learner (throttle)
--   achievement_grant(...)        the only writer; service role only
--
-- Writes to these tables outside achievement_grant need a maintenance
-- session: select set_config('achievements.maintenance', 'on', false);

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
create table if not exists public.achievement_catalog (
  id text primary key check (id ~ '^(badge:[A-Za-z0-9]+|topic:[a-z]+|track:[A-Za-z]+:[1-9][0-9]*)$'),
  version smallint not null check (version >= 0),          -- catalog version that introduced it
  kind text not null check (kind in ('badge', 'tier', 'topic')),
  category text not null check (category in ('learning', 'streaks', 'practice', 'topics', 'duels', 'friends', 'special', 'completionist')),
  secret boolean not null,
  -- Grantable from a sync: 'engine' (the apps' engine) and 'server' (trusted
  -- server statistics, e.g. backend-proposals/duel-achievements). Nothing is
  -- 'server' until such a proposal marks it.
  readiness text not null check (readiness in ('engine', 'server', 'reads', 'guarded', 'rpc', 'backend')),
  trust_source text check (trust_source in ('frozen_days', 'practice_sentences', 'time_zone'))
);

-- Inputs the learner can forge or choose today. A unit built on one is never
-- stored until its source is trusted (after the matching hardening ships).
create table if not exists public.achievement_trust (
  source text primary key check (source in ('frozen_days', 'practice_sentences', 'time_zone')),
  trusted boolean not null default false,
  why text not null
);

create table if not exists public.achievement_completionist_v1 (
  achievement_id text primary key references public.achievement_catalog (id)
);

-- ---------------------------------------------------------------------
-- Ledger
-- ---------------------------------------------------------------------
create table if not exists public.achievement_unlocks (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievement_catalog (id),
  catalog_version smallint not null,
  unlocked_at timestamptz not null default now(),
  -- 'backfill': found on the learner's first sync (earned before the ledger
  -- existed; the date is when it was recorded, not when it was earned).
  source text not null check (source in ('sync', 'backfill')),
  primary key (user_id, achievement_id)
);
create index if not exists achievement_unlocks_achievement_idx on public.achievement_unlocks (achievement_id);

create table if not exists public.achievement_sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_sync_at timestamptz not null,
  syncs integer not null default 0
);

-- ---------------------------------------------------------------------
-- Access: the owner reads their ledger; nobody but achievement_grant writes.
-- ---------------------------------------------------------------------
alter table public.achievement_catalog enable row level security;
alter table public.achievement_trust enable row level security;
alter table public.achievement_completionist_v1 enable row level security;
alter table public.achievement_unlocks enable row level security;
alter table public.achievement_sync_state enable row level security;

revoke all on public.achievement_catalog, public.achievement_trust, public.achievement_completionist_v1,
  public.achievement_unlocks, public.achievement_sync_state from public, anon, authenticated, service_role;
grant select on public.achievement_catalog, public.achievement_unlocks to authenticated;
-- The service role (Supabase grants it everything by default) may read, never
-- write: achievement_grant runs as the owner and is the only writer.
grant select on public.achievement_catalog, public.achievement_trust, public.achievement_completionist_v1,
  public.achievement_unlocks, public.achievement_sync_state to service_role;

drop policy if exists "Catalog is readable" on public.achievement_catalog;
create policy "Catalog is readable" on public.achievement_catalog for select to authenticated using (true);
drop policy if exists "Learners read their unlocks" on public.achievement_unlocks;
create policy "Learners read their unlocks" on public.achievement_unlocks
  for select to authenticated using (user_id = (select auth.uid()));

-- Even the service role (which bypasses RLS) can't change the ledger outside
-- achievement_grant: rows are added once and never changed or removed. The
-- one exception is the account-deletion cascade (the owner is already gone),
-- plus an explicit maintenance session for recovery.
-- Maintenance (migrations, reviewed recovery): the flag is a custom setting
-- any session could set, so it only counts outside the API roles. The 'role'
-- setting is the SET ROLE in force (PostgREST's), unchanged by security definer.
create or replace function public.achievement_maintenance()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('achievements.maintenance', true), '') = 'on'
     and coalesce(current_setting('role', true), 'none') not in ('anon', 'authenticated', 'service_role');
$$;

-- security definer: it must see auth.users whoever deletes (the service role
-- can't read that table); it only reads it.
create or replace function public.achievement_unlocks_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.achievement_maintenance() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'INSERT' then
    if coalesce(current_setting('achievements.writer', true), '') = 'grant' then return new; end if;
    raise exception 'achievement_unlocks_write_denied' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' and not exists (select 1 from auth.users u where u.id = old.user_id) then
    return old;
  end if;
  raise exception 'achievement_unlocks_permanent' using errcode = '42501';
end;
$$;

drop trigger if exists achievement_unlocks_guard on public.achievement_unlocks;
create trigger achievement_unlocks_guard before insert or update or delete on public.achievement_unlocks
  for each row execute function public.achievement_unlocks_guard();

-- Catalog, trust and prerequisite tables change only in migrations.
create or replace function public.achievement_static_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.achievement_maintenance() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception 'achievement_catalog_read_only' using errcode = '42501';
end;
$$;

drop trigger if exists achievement_catalog_guard on public.achievement_catalog;
create trigger achievement_catalog_guard before insert or update or delete on public.achievement_catalog
  for each row execute function public.achievement_static_guard();
drop trigger if exists achievement_trust_guard on public.achievement_trust;
create trigger achievement_trust_guard before insert or update or delete on public.achievement_trust
  for each row execute function public.achievement_static_guard();
drop trigger if exists achievement_completionist_v1_guard on public.achievement_completionist_v1;
create trigger achievement_completionist_v1_guard before insert or update or delete on public.achievement_completionist_v1
  for each row execute function public.achievement_static_guard();

-- TRUNCATE skips row triggers: refuse it outright.
create or replace function public.achievement_truncate_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.achievement_maintenance() then return null; end if;
  raise exception 'achievement_tables_permanent' using errcode = '42501';
end;
$$;

drop trigger if exists achievement_unlocks_no_truncate on public.achievement_unlocks;
create trigger achievement_unlocks_no_truncate before truncate on public.achievement_unlocks
  for each statement execute function public.achievement_truncate_guard();
drop trigger if exists achievement_completionist_v1_no_truncate on public.achievement_completionist_v1;
create trigger achievement_completionist_v1_no_truncate before truncate on public.achievement_completionist_v1
  for each statement execute function public.achievement_truncate_guard();

revoke all on function public.achievement_maintenance() from public, anon, authenticated, service_role;
revoke all on function public.achievement_unlocks_guard() from public, anon, authenticated;
revoke all on function public.achievement_static_guard() from public, anon, authenticated;
revoke all on function public.achievement_truncate_guard() from public, anon, authenticated;

select set_config('achievements.maintenance', 'on', false);
insert into public.achievement_trust (source, trusted, why) values
  ('frozen_days', false, 'profiles.frozen_days is learner-writable until profiles-hardening step 1'),
  ('practice_sentences', false, 'learners may insert their own practice_sentences rows, results included'),
  ('time_zone', false, 'night and early hours use a time zone the client sends; store it on the profile first')
on conflict (source) do nothing;
select set_config('achievements.maintenance', '', false);

-- ---------------------------------------------------------------------
-- achievement_grant: the only writer.
--
-- Called by the achievements-sync Edge Function with the service role,
-- after it has verified the learner's JWT and evaluated the engine on data
-- read *as that learner*. It still trusts nothing it is sent:
--   - the catalog version must be the current one;
--   - every id must exist and be grantable now (readiness 'engine' or 'server');
--   - ids built on an untrusted source are refused;
--   - The Completionist is never taken from the request: it is decided here,
--     from stored rows, after the others are written.
-- Idempotent (on conflict do nothing), serialized per learner (advisory
-- lock), throttled (at most one write pass per 5 s per learner), and it never
-- deletes. Returns the authoritative state.
-- ---------------------------------------------------------------------
create or replace function public.achievement_grant(p_user uuid, p_ids text[], p_version smallint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_current smallint;
  v_first boolean;
  v_throttled boolean;
  v_ok text[];
  v_rejected text[];
  v_new text[] := '{}';
  v_required integer;
  v_have integer;
begin
  if p_user is null or not exists (select 1 from auth.users u where u.id = p_user) then
    raise exception 'achievement_unknown_user' using errcode = '22023';
  end if;
  if cardinality(p_ids) > 1000 then
    raise exception 'achievement_too_many_ids' using errcode = '22023';
  end if;
  select max(c.version) into v_current from public.achievement_catalog c;
  if p_version is distinct from v_current then
    raise exception 'achievement_catalog_mismatch' using errcode = '22023';
  end if;

  -- One sync per learner at a time; a second one waits, then finds nothing new.
  perform pg_advisory_xact_lock(hashtextextended('achievement_grant:' || p_user::text, 0));

  select coalesce(s.last_sync_at > now() - interval '5 seconds', false) into v_throttled
  from public.achievement_sync_state s where s.user_id = p_user;
  v_throttled := coalesce(v_throttled, false);

  select coalesce(array_agg(c.id order by c.id), '{}') into v_ok
  from (select distinct unnest(coalesce(p_ids, '{}')) as id) r
  join public.achievement_catalog c on c.id = r.id
  left join public.achievement_trust t on t.source = c.trust_source
  where c.readiness in ('engine', 'server') and (c.trust_source is null or t.trusted);

  select coalesce(array_agg(r.id order by r.id), '{}') into v_rejected
  from (select distinct unnest(coalesce(p_ids, '{}')) as id) r
  where not (r.id = any (v_ok));

  if not v_throttled then
    v_first := not exists (select 1 from public.achievement_unlocks u where u.user_id = p_user);
    perform set_config('achievements.writer', 'grant', true);

    with ins as (
      insert into public.achievement_unlocks (user_id, achievement_id, catalog_version, source)
      select p_user, i, v_current, case when v_first then 'backfill' else 'sync' end
      from unnest(v_ok) as i
      on conflict (user_id, achievement_id) do nothing
      returning achievement_id
    )
    select coalesce(array_agg(achievement_id order by achievement_id), '{}') into v_new from ins;

    -- The Completionist: all 199 frozen prerequisites already in the ledger.
    select count(*) into v_required from public.achievement_completionist_v1;
    select count(*) into v_have
    from public.achievement_completionist_v1 r
    join public.achievement_unlocks u on u.user_id = p_user and u.achievement_id = r.achievement_id;
    if v_required = 199 and v_have = v_required then
      insert into public.achievement_unlocks (user_id, achievement_id, catalog_version, source)
      values (p_user, 'badge:completionist', v_current, 'sync')
      on conflict (user_id, achievement_id) do nothing;
      if found then v_new := array_append(v_new, 'badge:completionist'); end if;
    end if;

    perform set_config('achievements.writer', '', true);
    insert into public.achievement_sync_state (user_id, last_sync_at, syncs) values (p_user, now(), 1)
    on conflict (user_id) do update set last_sync_at = now(), syncs = public.achievement_sync_state.syncs + 1;
  end if;

  return jsonb_build_object(
    'catalog_version', v_current,
    'throttled', v_throttled,
    'granted', to_jsonb(v_new),
    'rejected', to_jsonb(v_rejected),
    'unlocked', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.achievement_id, 'at', u.unlocked_at, 'source', u.source) order by u.achievement_id)
      from public.achievement_unlocks u where u.user_id = p_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.achievement_grant(uuid, text[], smallint) from public, anon, authenticated;
grant execute on function public.achievement_grant(uuid, text[], smallint) to service_role;
