-- Plans: free (Rookie), pro (Word Nerd) and unlimited (Legend).
-- Run after 20261114160000_custom_words.sql. Safe to run more than once.
--
-- Plans are granted by hand for now: in the Supabase table editor, insert
-- (or edit) a row in public.subscriptions with the learner's user_id and
-- plan = 'pro' or 'unlimited'. Learners can read their own row but never
-- write it. No row means free.
--
-- Daily limits (keep in sync with src/features/subscription/plans.ts):
--   free:      10 new words (set words and own words together), 5 own words
--   pro:       20 new words, 20 own words
--   unlimited: no limits

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  updated_at timestamptz not null default now()
);

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('free', 'pro', 'unlimited'));

alter table public.subscriptions enable row level security;

drop policy if exists "Users read their own subscription" on public.subscriptions;
create policy "Users read their own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update/delete policies on purpose: only the dashboard
-- (service role) changes plans.

drop function if exists public.is_pro();

create or replace function public.my_plan()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  -- Admins test everything without limits.
  select case
    when public.is_admin() then 'unlimited'
    else coalesce((select s.plan from public.subscriptions s where s.user_id = auth.uid()), 'free')
  end;
$$;

-- Daily limits per plan; null means no limit.
create or replace function public.plan_new_words_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'free' then 10 when 'pro' then 20 end;
$$;

create or replace function public.plan_custom_words_limit(p_plan text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_plan when 'free' then 5 when 'pro' then 20 end;
$$;

revoke execute on function public.my_plan() from public, anon;
grant execute on function public.my_plan() to authenticated;

-- ---------------------------------------------------------------------
-- The functions below are copies of the earlier ones plus the free-plan
-- limits. Grants carry over with create or replace.
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
    where uw.user_id = v_user and uw.due_on is null
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

create or replace function public.add_words_to_my_list(p_word_ids uuid[], p_start_now boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_added integer;
  v_start_now boolean := coalesce(p_start_now, false);
  v_limit integer := public.plan_new_words_limit(public.my_plan());
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_word_ids is null or cardinality(p_word_ids) = 0 or cardinality(p_word_ids) > 200 then
    raise exception 'invalid_words' using errcode = '22023';
  end if;

  -- Words only start today while they fit in the plan's daily limit;
  -- otherwise they wait in the queue like a set does.
  if v_start_now and v_limit is not null then
    v_start_now := (
      select count(*) + cardinality(p_word_ids) <= v_limit
      from public.user_words uw
      where uw.user_id = v_user and uw.introduced_on = current_date
    );
  end if;

  -- Only shared words that are in a published set.
  insert into public.user_words (user_id, word_id, due_on, introduced_on, queue_position)
  select
    v_user,
    w.id,
    case when v_start_now then current_date end,
    case when v_start_now then current_date end,
    min(i.position)
  from public.words w
  join public.word_set_items i on i.word_id = w.id
  join public.word_sets s on s.id = i.set_id and s.is_published
  where w.id = any (p_word_ids) and w.owner_id is null
  group by w.id
  on conflict (user_id, word_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

create or replace function public.add_custom_word(
  p_lemma text,
  p_part_of_speech text,
  p_language text,
  p_translation text,
  p_alternatives text[] default '{}',
  p_example text default null,
  p_ipa text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lemma text := lower(btrim(p_lemma));
  v_pos text := coalesce(btrim(p_part_of_speech), '');
  v_alternatives text[] := coalesce(p_alternatives, '{}');
  v_today_count integer;
  v_plan text := public.my_plan();
  v_custom_limit integer := public.plan_custom_words_limit(v_plan);
  v_new_limit integer := public.plan_new_words_limit(v_plan);
  v_word uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Same rules as customWordSchema in src/features/learning/custom-word.ts.
  if v_lemma is null or char_length(v_lemma) not between 1 and 60
     or v_lemma !~ '^[a-z]+([ ''-][a-z]+)*$' then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if v_pos not in ('', 'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'det', 'intj', 'num', 'phrase') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_language not in ('ru', 'ro') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_translation is null or char_length(btrim(p_translation)) not between 1 and 200
     or cardinality(v_alternatives) > 5
     or exists (select 1 from unnest(v_alternatives) a where char_length(btrim(a)) not between 1 and 200)
     or char_length(coalesce(p_example, '')) > 300
     or char_length(coalesce(p_ipa, '')) > 100 then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  select count(*) into v_today_count
  from public.words w
  where w.owner_id = v_user and w.created_at >= current_date;
  -- A null limit (unlimited) makes the check null, so it never raises.
  if v_today_count >= v_custom_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  -- An own word is a new word too, so it counts toward the daily new words.
  if (
    select count(*) from public.user_words uw
    where uw.user_id = v_user and uw.introduced_on = current_date
  ) >= v_new_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.words (lemma, part_of_speech, ipa, example, source, owner_id)
  values (v_lemma, v_pos, nullif(btrim(p_ipa), ''), nullif(btrim(p_example), ''), 'manual', v_user)
  on conflict (lemma, part_of_speech, owner_id) do update
    set ipa = coalesce(excluded.ipa, public.words.ipa),
        example = coalesce(excluded.example, public.words.example)
  returning id into v_word;

  insert into public.word_translations (word_id, language, translation, alternatives, source, reviewed)
  values (
    v_word,
    p_language,
    btrim(p_translation),
    array(select btrim(a) from unnest(v_alternatives) a),
    'manual',
    true
  )
  on conflict (word_id, language) do update
    set translation = excluded.translation, alternatives = excluded.alternatives;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, v_word, current_date, current_date, 1)
  on conflict (user_id, word_id) do nothing;

  return v_word;
end;
$$;
