-- Level rewards and more achievements (src/features/rewards,
-- src/features/achievements). Run after 20261119170000_notification_settings.sql.
--   my_achievement_extras: data for the secret and topic badges
--   frozen_days + use_streak_freezes: streak freezes earned by level
--   showcase: up to three badges pinned on the public profile
--   badge_rarity: how many learners hold each badge

-- ---------------------------------------------------------------------
-- my_achievement_extras(p_tz): counted in the learner's own time zone
-- (an unknown name falls back to UTC).
--   night:    reviews from 00:00 to 04:59
--   early:    reviews from 05:00 to 06:59
--   clean_run: most "remembered" answers in a row
--   phoenix:  words forgotten 3+ times before being mastered (PHOENIX_FALLS)
--   topics:   {topic: words in box 5}
-- Security invoker: RLS limits every table to the caller's own rows.
-- ---------------------------------------------------------------------

create or replace function public.my_achievement_extras(p_tz text default 'UTC')
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_tz text := case
    when exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then p_tz
    else 'UTC'
  end;
begin
  return (
    with reviews as (
      select x.created_at, x.reason, extract(hour from x.created_at at time zone v_tz)::integer as hour
      from public.xp_events x
      where x.user_id = auth.uid() and x.reason in ('review_remembered', 'review_forgot')
    ),
    -- Each "forgot" starts a new run; a run's length is its remembered answers.
    runs as (
      select count(*) filter (where r.reason = 'review_remembered') as len
      from (
        select reason, count(*) filter (where reason = 'review_forgot') over (order by created_at) as run
        from reviews
      ) r
      group by r.run
    ),
    mastered as (
      select x.word_id, max(x.created_at) as at
      from public.xp_events x
      where x.user_id = auth.uid() and x.reason = 'word_mastered'
      group by x.word_id
    )
    select jsonb_build_object(
      'night', (select count(*) from reviews where hour < 5),
      'early', (select count(*) from reviews where hour between 5 and 6),
      'clean_run', coalesce((select max(len) from runs), 0),
      'phoenix', (
        select count(*)
        from mastered m
        where (
          select count(*)
          from public.xp_events f
          where f.user_id = auth.uid() and f.word_id = m.word_id
            and f.reason = 'review_forgot' and f.created_at < m.at
        ) >= 3
      ),
      'topics', coalesce((
        select jsonb_object_agg(s.topic, s.words)
        from (
          select t.topic, count(*)::integer as words
          from public.user_words uw
          join public.words w on w.id = uw.word_id
          join public.dictionary_entries d on d.lemma = w.lemma
          cross join unnest(d.topics) as t(topic)
          where uw.user_id = auth.uid() and uw.box = 5
          group by t.topic
        ) s
      ), '{}'::jsonb)
    )
  );
end;
$$;

revoke execute on function public.my_achievement_extras(text) from public, anon;
grant execute on function public.my_achievement_extras(text) to authenticated;

-- ---------------------------------------------------------------------
-- Streak freezes: one per 5 learner levels (FREEZE_EVERY in
-- src/features/rewards/levels.ts). A freeze fills one missed UTC day.
-- shortcut: owners may update their own profile row (RLS), so a determined
-- learner could add frozen days by hand; move to column grants if that matters.
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists frozen_days date[] not null default '{}';

-- Fills the days missed since the last active (or frozen) day, up to
-- yesterday, when enough freezes are left; returns all frozen days.
create or replace function public.use_streak_freezes()
returns date[]
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_xp bigint;
  v_level integer;
  v_frozen date[];
  v_last date;
  v_missed integer;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(sum(x.amount), 0) into v_xp from public.xp_events x where x.user_id = v_user;
  -- Inverse of xpForLevel (100 * (level - 1) ^ 1.5); may differ by a rounding XP at a boundary.
  v_level := floor(power(greatest(v_xp, 0) / 100.0, 2.0 / 3.0) + 1e-9)::integer + 1;

  select p.frozen_days into v_frozen from public.profiles p where p.id = v_user for update;
  if not found then
    return '{}';
  end if;

  select max(d) into v_last
  from (
    select (x.created_at at time zone 'utc')::date as d from public.xp_events x where x.user_id = v_user
    union all
    select unnest(v_frozen)
  ) s;

  if v_last is null then
    return v_frozen;
  end if;

  v_missed := (current_date - 1) - v_last;
  if v_missed >= 1 and v_missed <= v_level / 5 - cardinality(v_frozen) then
    update public.profiles p
    set frozen_days = v_frozen || array(
      select g::date from generate_series(v_last + 1, current_date - 1, interval '1 day') as g
    )
    where p.id = v_user
    returning p.frozen_days into v_frozen;
  end if;

  return v_frozen;
end;
$$;

revoke execute on function public.use_streak_freezes() from public, anon;
grant execute on function public.use_streak_freezes() to authenticated;

-- ---------------------------------------------------------------------
-- Badge showcase: up to three badge ids, shown first on the profile.
-- The app keeps only earned ones in the public snapshot.
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists showcase text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_showcase_check;
alter table public.profiles
  add constraint profiles_showcase_check check (cardinality(showcase) <= 3);

-- ---------------------------------------------------------------------
-- badge_rarity: learners with a snapshot (public_stats is written whenever
-- someone opens their profile or achievements), and how many hold each
-- badge. Counts only: no names, no rows.
-- ---------------------------------------------------------------------

create or replace function public.badge_rarity()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.profiles p where p.public_stats is not null),
    'counts', coalesce((
      select jsonb_object_agg(s.badge, s.holders)
      from (
        select b.badge, count(*)::integer as holders
        from public.profiles p
        -- The owner can write this column: anything but a list counts as none.
        cross join jsonb_array_elements_text(
          case when jsonb_typeof(p.public_stats -> 'badges') = 'array' then p.public_stats -> 'badges' else '[]' end
        ) as b(badge)
        group by b.badge
      ) s
    ), '{}'::jsonb)
  );
$$;

revoke execute on function public.badge_rarity() from public, anon;
grant execute on function public.badge_rarity() to authenticated;
