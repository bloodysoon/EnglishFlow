-- Timeline page: one row per UTC day with anything in it, oldest first.
-- Run after 20261118140000_statistics.sql.
--   day, active (any XP event), remembered, forgot, xp, mastered
--   levels:  {A1: reviews, …} that day
--   added, known: my words added that day (known = marked "I know it")
--   words:   up to 12 of them [{id, lemma, known}]
--   mastered_words: words that reached box 5 that day [{id, lemma}]
-- Security invoker: RLS limits every table to the caller's own rows.

create or replace function public.my_timeline()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with events as (
    select (x.created_at at time zone 'utc')::date as day, x.reason, x.amount, x.word_id, w.lemma, w.cefr_level
    from public.xp_events x
    left join public.words w on w.id = x.word_id
    where x.user_id = auth.uid()
  ),
  ev as (
    select
      e.day,
      count(*) filter (where e.reason = 'review_remembered')::integer as remembered,
      count(*) filter (where e.reason = 'review_forgot')::integer as forgot,
      sum(e.amount)::integer as xp,
      count(*) filter (where e.reason = 'word_mastered')::integer as mastered,
      coalesce(
        jsonb_agg(jsonb_build_object('id', e.word_id, 'lemma', e.lemma) order by e.lemma)
          filter (where e.reason = 'word_mastered' and e.lemma is not null),
        '[]'::jsonb
      ) as mastered_words
    from events e
    group by e.day
  ),
  lv as (
    select l.day, jsonb_object_agg(l.cefr_level, l.reviews) as levels
    from (
      select e.day, e.cefr_level, count(*)::integer as reviews
      from events e
      where e.reason in ('review_remembered', 'review_forgot') and e.cefr_level is not null
      group by 1, 2
    ) l
    group by l.day
  ),
  wd as (
    select
      (uw.added_at at time zone 'utc')::date as day,
      count(*)::integer as added,
      count(*) filter (where uw.known)::integer as known,
      to_jsonb((array_agg(jsonb_build_object('id', uw.word_id, 'lemma', w.lemma, 'known', uw.known) order by w.lemma))[1:12]) as words
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = auth.uid()
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', d.day,
    'active', ev.day is not null,
    'remembered', coalesce(ev.remembered, 0),
    'forgot', coalesce(ev.forgot, 0),
    'xp', coalesce(ev.xp, 0),
    'mastered', coalesce(ev.mastered, 0),
    'mastered_words', coalesce(ev.mastered_words, '[]'::jsonb),
    'levels', coalesce(lv.levels, '{}'::jsonb),
    'added', coalesce(wd.added, 0),
    'known', coalesce(wd.known, 0),
    'words', coalesce(wd.words, '[]'::jsonb)
  ) order by d.day), '[]'::jsonb)
  from (select day from ev union select day from wd) d
  left join ev on ev.day = d.day
  left join lv on lv.day = d.day
  left join wd on wd.day = d.day;
$$;

revoke execute on function public.my_timeline() from public, anon;
grant execute on function public.my_timeline() to authenticated;
