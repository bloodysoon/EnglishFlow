-- Timeline: also the sentences practised each day.
-- Run after 20261119140000_practice_sentences.sql. Adds to each day:
--   practice: {count, clean, words: [{id, lemma}] (up to 12, distinct)}
--   clean = no grammar mistakes and, when a tense was asked, the right tense.
-- A practice-only day appears with active = false (no XP that day).

create or replace function public.my_timeline()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with events as (
    select x.id, x.created_at, (x.created_at at time zone 'utc')::date as day, x.reason, x.amount, x.word_id, w.lemma, w.cefr_level
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
      count(*) filter (where e.reason = 'word_mastered')::integer as mastered
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
  reviews as (
    select e.*,
      sum(case when e.reason = 'review_forgot' then 1 else 0 end)
        over (partition by e.word_id order by e.created_at, e.id) as streak_id
    from events e
    where e.reason in ('review_remembered', 'review_forgot') and e.word_id is not null
  ),
  moves as (
    select r.day, r.word_id, r.lemma,
      case when r.reason = 'review_forgot' then 1
        else least(5, 1 + sum(case when r.reason = 'review_remembered' then 1 else 0 end)
          over (partition by r.word_id, r.streak_id order by r.created_at, r.id))
      end as box
    from reviews r
  ),
  bx as (
    select b.day, jsonb_object_agg(b.box, jsonb_build_object('count', b.n, 'words', b.words)) as boxes
    from (
      select m.day, m.box, count(*)::integer as n,
        to_jsonb((array_agg(jsonb_build_object('id', m.word_id, 'lemma', m.lemma) order by m.lemma))[1:12]) as words
      from moves m
      where m.lemma is not null
      group by 1, 2
    ) b
    group by b.day
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
  ),
  pr as (
    select p.day, count(*)::integer as n,
      count(*) filter (where p.clean)::integer as clean,
      to_jsonb((array_agg(distinct jsonb_build_object('id', p.word_id, 'lemma', p.lemma)))[1:12]) as words
    from (
      select (ps.created_at at time zone 'utc')::date as day, ps.word_id, w.lemma,
        jsonb_array_length(ps.issues) = 0 and coalesce(ps.tense_ok, true) as clean
      from public.practice_sentences ps
      join public.words w on w.id = ps.word_id
      where ps.user_id = auth.uid()
    ) p
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', d.day,
    'active', ev.day is not null,
    'remembered', coalesce(ev.remembered, 0),
    'forgot', coalesce(ev.forgot, 0),
    'xp', coalesce(ev.xp, 0),
    'mastered', coalesce(ev.mastered, 0),
    'levels', coalesce(lv.levels, '{}'::jsonb),
    'boxes', coalesce(bx.boxes, '{}'::jsonb),
    'added', coalesce(wd.added, 0),
    'known', coalesce(wd.known, 0),
    'words', coalesce(wd.words, '[]'::jsonb),
    'practice', jsonb_build_object(
      'count', coalesce(pr.n, 0),
      'clean', coalesce(pr.clean, 0),
      'words', coalesce(pr.words, '[]'::jsonb)
    )
  ) order by d.day), '[]'::jsonb)
  from (select day from ev union select day from wd union select day from pr) d
  left join ev on ev.day = d.day
  left join lv on lv.day = d.day
  left join bx on bx.day = d.day
  left join wd on wd.day = d.day
  left join pr on pr.day = d.day;
$$;

revoke execute on function public.my_timeline() from public, anon;
grant execute on function public.my_timeline() to authenticated;
