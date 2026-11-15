-- Word triage: the Learn page shows random words; the learner says
-- "I know it" (kept as known, no reviews) or "Learn it" (into today's
-- reviews, within the plan's daily limit). Known words can be quizzed;
-- a forgotten one goes back into the reviews.
-- Run after 20261114170000_subscriptions.sql. Safe to run more than once.
--
-- A known word is a user_words row with known = true and due_on null.

alter table public.user_words
  add column if not exists known boolean not null default false;

-- Daily limits (keep in sync with src/features/subscription/plans.ts):
--   free 10 new words, 5 own words; pro 30 new words, 20 own words;
--   unlimited: none.
create or replace function public.plan_new_words_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'free' then 10 when 'pro' then 30 end;
$$;

-- ---------------------------------------------------------------------
-- pick_new_words: random shared words of published sets that are not in
-- my words yet. RLS (security invoker) keeps it to what I may read.
-- shortcut: order by random() reads the whole pool; fine for a few
-- thousand words, switch to tablesample or a random key beyond that.
-- ---------------------------------------------------------------------

create or replace function public.pick_new_words(p_count integer default 5)
returns setof uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select w.id
  from public.words w
  where w.owner_id is null
    and exists (
      select 1
      from public.word_set_items i
      join public.word_sets s on s.id = i.set_id and s.is_published
      where i.word_id = w.id
    )
    and not exists (
      select 1 from public.user_words uw
      where uw.user_id = (select auth.uid()) and uw.word_id = w.id
    )
  order by random()
  limit least(greatest(coalesce(p_count, 5), 1), 20);
$$;

-- pick_known_words: random words I marked as known, for a quiz.
create or replace function public.pick_known_words(p_count integer default 10)
returns setof uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select uw.word_id
  from public.user_words uw
  where uw.user_id = (select auth.uid()) and uw.known
  order by random()
  limit least(greatest(coalesce(p_count, 10), 1), 50);
$$;

-- ---------------------------------------------------------------------
-- triage_word: "I know it" keeps the word as known; "Learn it" puts it
-- in today's reviews (box 1), within the plan's daily new-word limit.
-- ---------------------------------------------------------------------

create or replace function public.triage_word(p_word_id uuid, p_known boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_known is null or not exists (
    select 1
    from public.words w
    join public.word_set_items i on i.word_id = w.id
    join public.word_sets s on s.id = i.set_id and s.is_published
    where w.id = p_word_id and w.owner_id is null
  ) then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  if p_known then
    insert into public.user_words (user_id, word_id, due_on, known)
    values (v_user, p_word_id, null, true)
    on conflict (user_id, word_id) do nothing;
    return;
  end if;

  v_limit := public.plan_new_words_limit(public.my_plan());
  -- A null limit (unlimited) makes the check null, so it never raises.
  if (
    select count(*) from public.user_words uw
    where uw.user_id = v_user and uw.introduced_on = current_date
  ) >= v_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, p_word_id, current_date, current_date, 1)
  on conflict (user_id, word_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------
-- forget_known_word: a quiz showed I forgot a known word: it joins
-- today's reviews in box 1. Not a new word, so no daily limit.
-- ---------------------------------------------------------------------

create or replace function public.forget_known_word(p_word_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.user_words
  set known = false, due_on = current_date, box = 1
  where user_id = v_user and word_id = p_word_id and known;
end;
$$;

revoke execute on function public.pick_new_words(integer) from public, anon;
revoke execute on function public.pick_known_words(integer) from public, anon;
revoke execute on function public.triage_word(uuid, boolean) from public, anon;
revoke execute on function public.forget_known_word(uuid) from public, anon;
grant execute on function public.pick_new_words(integer) to authenticated;
grant execute on function public.pick_known_words(integer) to authenticated;
grant execute on function public.triage_word(uuid, boolean) to authenticated;
grant execute on function public.forget_known_word(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Known words are not in the queue and not in the summary's boxes.
-- (Copies of the earlier functions; grants carry over.)
-- ---------------------------------------------------------------------

create or replace function public.introduce_new_words()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_goal integer;
  v_done_today integer;
  v_moved integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select coalesce(
    (select p.daily_goal from public.profiles p where p.id = v_user),
    public.app_default_daily_goal()
  ) into v_goal;

  -- The plan caps the saved goal.
  v_goal := least(v_goal, coalesce(public.plan_new_words_limit(public.my_plan()), v_goal));

  select count(*) into v_done_today
  from public.user_words uw
  where uw.user_id = v_user and uw.introduced_on = current_date;

  with next_words as (
    select uw.word_id
    from public.user_words uw
    where uw.user_id = v_user and uw.due_on is null and not uw.known
    order by uw.added_at, uw.queue_position
    limit greatest(v_goal - v_done_today, 0)
    for update skip locked
  )
  update public.user_words uw
  set due_on = current_date, introduced_on = current_date, box = 1
  from next_words
  where uw.user_id = v_user and uw.word_id = next_words.word_id;

  get diagnostics v_moved = row_count;
  return v_moved;
end;
$$;

create or replace function public.my_learning_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'words', coalesce((
      select jsonb_agg(g)
      from (
        select uw.box, uw.due_on, uw.introduced_on, uw.known, count(*)::integer as count
        from public.user_words uw
        where uw.user_id = auth.uid()
        group by uw.box, uw.due_on, uw.introduced_on, uw.known
      ) g
    ), '[]'::jsonb),
    'xp_total', (
      select coalesce(sum(x.amount), 0)
      from public.xp_events x
      where x.user_id = auth.uid()
    ),
    'active_days', coalesce((
      select jsonb_agg(d.day order by d.day desc)
      from (
        select distinct (x.created_at at time zone 'utc')::date as day
        from public.xp_events x
        where x.user_id = auth.uid() and x.created_at > now() - interval '400 days'
      ) d
    ), '[]'::jsonb),
    'today', current_date
  );
$$;
