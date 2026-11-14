-- Learning loop: starting a set queues its words; each day up to the
-- learner's daily goal of them are introduced (become due). Run after
-- 20261114140000_admin.sql.
--
-- user_words.due_on is now null for a word still waiting in the queue.

alter table public.user_words
  alter column due_on drop not null,
  alter column due_on drop default,
  -- The UTC day the word was introduced (left the queue).
  add column if not exists introduced_on date,
  -- Order inside the queue: the word's position in its set.
  add column if not exists queue_position integer not null default 0;

-- Words added before this migration were due at once: count them as
-- introduced on the day they were added.
update public.user_words
set introduced_on = added_at::date
where introduced_on is null and due_on is not null;

-- "How many did I introduce today?"
create index if not exists user_words_introduced_idx on public.user_words (user_id, introduced_on);

-- ---------------------------------------------------------------------
-- start_word_set: queue every word of a published set (not due yet).
-- Returns how many words were new to me.
-- ---------------------------------------------------------------------

create or replace function public.start_word_set(p_slug text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_added integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.user_words (user_id, word_id, due_on, queue_position)
  select v_user, i.word_id, null, i.position
  from public.word_set_items i
  join public.word_sets s on s.id = i.set_id
  where s.slug = p_slug and s.is_published
  on conflict (user_id, word_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- ---------------------------------------------------------------------
-- introduce_new_words: move up to today's remaining daily goal from the
-- queue into box 1, due today. Safe to call on every visit: once the
-- goal is met for the day it does nothing. Returns how many it moved.
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

revoke execute on function public.introduce_new_words() from public, anon;
grant execute on function public.introduce_new_words() to authenticated;

-- ---------------------------------------------------------------------
-- review_word: as in 20261114140000_admin.sql, but a word still in the
-- queue (due_on is null) cannot be reviewed yet.
-- ---------------------------------------------------------------------

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

  -- Only due words count: no farming XP by repeating one word, and no
  -- skipping the queue.
  if v_due is null or v_due > current_date then
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
-- my_learning_summary: everything the dashboard needs in one small JSON,
-- aggregated in the database (API responses are capped at 1000 rows).
-- Security invoker: RLS limits it to the caller's own rows anyway.
--   words: [{box, due_on, introduced_on, count}] grouped
--   xp_total, active_days (UTC days with XP, last 400 days), today
-- ---------------------------------------------------------------------

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
        select uw.box, uw.due_on, uw.introduced_on, count(*)::integer as count
        from public.user_words uw
        where uw.user_id = auth.uid()
        group by uw.box, uw.due_on, uw.introduced_on
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

revoke execute on function public.my_learning_summary() from public, anon;
grant execute on function public.my_learning_summary() to authenticated;
