-- Admin panel: one admin (role set by hand), editable defaults and XP
-- rules, content management, read-only learner overview.
--
-- Make yourself admin (Supabase Dashboard → SQL Editor), then log out and
-- in again so the role reaches your session token:
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
--   where email = 'you@example.com';
-- app_metadata cannot be changed by users themselves.
--
-- Run after 20261113120000_dictionary.sql, 20261114120000_progress_xp.sql
-- and 20261114130000_profiles.sql.

-- ---------------------------------------------------------------------
-- Who is admin
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------------------------------------------------------------------
-- App settings (one row): defaults for new learners
-- ---------------------------------------------------------------------

create table public.app_settings (
  id boolean primary key default true check (id),
  default_translation_language text not null default 'ru'
    check (default_translation_language in ('ru', 'ro')),
  default_daily_goal smallint not null default 10 check (default_daily_goal between 1 and 100),
  daily_goal_options smallint[] not null default '{5,10,20}'
    check (cardinality(daily_goal_options) between 1 and 6
       and 1 <= all (daily_goal_options) and 100 >= all (daily_goal_options)),
  updated_at timestamptz not null default now(),
  constraint app_settings_default_goal_is_an_option check (default_daily_goal = any (daily_goal_options))
);

insert into public.app_settings default values on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy "Everyone reads app settings"
  on public.app_settings for select
  to anon, authenticated
  using (true);

create policy "Admins update app settings"
  on public.app_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- New profiles take the current defaults. Falls back to fixed values so a
-- missing settings row can never break sign-up (the profile row is
-- created by the on_auth_user_created trigger).
create or replace function public.app_default_translation_language()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.default_translation_language from public.app_settings s where s.id), 'ru');
$$;

create or replace function public.app_default_daily_goal()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.default_daily_goal from public.app_settings s where s.id), 10::smallint);
$$;

alter table public.profiles
  alter column translation_language set default public.app_default_translation_language(),
  alter column daily_goal set default public.app_default_daily_goal();

-- Goal options are now editable, so the column accepts any sensible
-- number; the settings action checks it against the current options.
alter table public.profiles drop constraint if exists profiles_daily_goal_check;
alter table public.profiles
  add constraint profiles_daily_goal_check check (daily_goal between 1 and 100);

-- ---------------------------------------------------------------------
-- XP rules (one row), read by review_word
-- Defaults mirror DEFAULT_XP_RULES in src/features/leitner/xp.ts
-- (xp.test.ts checks it). Limits keep one event within xp_events.amount
-- (≤ 1000): 100 × 5 and 200 × 5.
-- ---------------------------------------------------------------------

create table public.xp_rules (
  id boolean primary key default true check (id),
  xp_remembered smallint not null default 10 check (xp_remembered between 0 and 100),
  xp_forgot smallint not null default 3 check (xp_forgot between 0 and 100),
  xp_mastered_bonus smallint not null default 50 check (xp_mastered_bonus between 0 and 200),
  multiplier_a1 numeric(3, 1) not null default 1 check (multiplier_a1 between 0.1 and 5),
  multiplier_a2 numeric(3, 1) not null default 1.2 check (multiplier_a2 between 0.1 and 5),
  multiplier_b1 numeric(3, 1) not null default 1.5 check (multiplier_b1 between 0.1 and 5),
  multiplier_b2 numeric(3, 1) not null default 2 check (multiplier_b2 between 0.1 and 5),
  multiplier_c1 numeric(3, 1) not null default 2.5 check (multiplier_c1 between 0.1 and 5),
  multiplier_c2 numeric(3, 1) not null default 3 check (multiplier_c2 between 0.1 and 5),
  updated_at timestamptz not null default now()
);

insert into public.xp_rules default values on conflict (id) do nothing;

alter table public.xp_rules enable row level security;

create policy "Learners read XP rules"
  on public.xp_rules for select
  to authenticated
  using (true);

create policy "Admins update XP rules"
  on public.xp_rules for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Same signature and behaviour as before; the numbers now come from
-- xp_rules. Box intervals stay fixed: they define the Leitner method and
-- appear in the landing copy (boxes.ts LEITNER_BOXES).
create or replace function public.review_word(p_word_id uuid, p_remembered boolean)
returns table (new_box smallint, next_due_on date, xp_awarded integer, mastered boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_box smallint;
  v_due date;
  v_level text;
  v_rules public.xp_rules%rowtype;
  v_new_box smallint;
  v_interval integer;
  v_multiplier numeric;
  v_xp integer;
  v_bonus integer := 0;
  v_mastered boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_remembered is null then
    raise exception 'answer_required' using errcode = '22004';
  end if;

  -- Lock my row so two quick taps cannot both earn XP.
  select uw.box, uw.due_on into v_box, v_due
  from public.user_words uw
  where uw.user_id = v_user and uw.word_id = p_word_id
  for update;

  if not found then
    raise exception 'word_not_in_my_words' using errcode = 'P0002';
  end if;

  -- Only due words count: no farming XP by repeating one word.
  if v_due > current_date then
    raise exception 'not_due' using errcode = 'P0001';
  end if;

  select w.cefr_level into v_level from public.words w where w.id = p_word_id;
  select * into v_rules from public.xp_rules r where r.id;

  -- Leitner rule (boxes.ts nextBox): remembered → up one box, max 5;
  -- forgot → back to box 1.
  v_new_box := case when p_remembered then least(v_box + 1, 5) else 1 end;

  -- Review intervals in days (boxes.ts LEITNER_BOXES).
  v_interval := case v_new_box when 1 then 1 when 2 then 3 when 3 then 7 when 4 then 14 when 5 then 30 end;

  -- XP: base per answer × CEFR multiplier, bonus on mastering. Missing
  -- rules row → the original defaults.
  v_multiplier := coalesce(case v_level
    when 'A1' then v_rules.multiplier_a1
    when 'A2' then v_rules.multiplier_a2
    when 'B1' then v_rules.multiplier_b1
    when 'B2' then v_rules.multiplier_b2
    when 'C1' then v_rules.multiplier_c1
    when 'C2' then v_rules.multiplier_c2
    else v_rules.multiplier_a1
  end, 1);

  v_xp := round(
    (case when p_remembered then coalesce(v_rules.xp_remembered, 10) else coalesce(v_rules.xp_forgot, 3) end)
    * v_multiplier
  );
  v_mastered := p_remembered and v_box = 4;
  if v_mastered then
    v_bonus := round(coalesce(v_rules.xp_mastered_bonus, 50) * v_multiplier);
  end if;

  update public.user_words
  set box = v_new_box,
      due_on = current_date + v_interval,
      last_reviewed_at = now(),
      review_count = review_count + 1
  where user_id = v_user and word_id = p_word_id;

  insert into public.xp_events (user_id, word_id, reason, amount)
  values (v_user, p_word_id, case when p_remembered then 'review_remembered' else 'review_forgot' end, v_xp);

  if v_mastered then
    insert into public.xp_events (user_id, word_id, reason, amount)
    values (v_user, p_word_id, 'word_mastered', v_bonus);
  end if;

  return query select v_new_box, current_date + v_interval, v_xp + v_bonus, v_mastered;
end;
$$;

-- ---------------------------------------------------------------------
-- Content: admins manage word sets, words and translations
-- ---------------------------------------------------------------------

create policy "Admins manage word sets"
  on public.word_sets for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage words"
  on public.words for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage translations"
  on public.word_translations for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage set items"
  on public.word_set_items for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Learners: read-only overview for the admin
-- ---------------------------------------------------------------------

-- auth.users is not reachable through the API, so the list comes from a
-- function that checks the role itself.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed boolean,
  is_admin boolean,
  translation_language text,
  daily_goal smallint,
  word_count bigint,
  xp_total bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    p.display_name,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at is not null,
    coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin',
    p.translation_language,
    p.daily_goal,
    (select count(*) from public.user_words uw where uw.user_id = u.id),
    (select coalesce(sum(x.amount), 0) from public.xp_events x where x.user_id = u.id)
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

-- Only signed-in callers; the function itself rejects non-admins.
revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
