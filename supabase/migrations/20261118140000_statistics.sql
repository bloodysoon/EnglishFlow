-- Statistics page: everything it needs in one small JSON, aggregated in
-- the database from the review log (xp_events). Run after
-- 20261118130000_hard_words_paging.sql.
--   days:    [{day, remembered, forgot, xp}] per UTC day with any event
--   hours:   [{hour, reviews}] per UTC hour of day
--   levels:  [{level, remembered, forgot}] per CEFR level
--   mastery: {count, avg_days} words reaching box 5, days since introduced
-- Security invoker: RLS limits every table to the caller's own rows.

create or replace function public.my_statistics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with events as (
    select (x.created_at at time zone 'utc') as utc_at, x.reason, x.amount, x.word_id
    from public.xp_events x
    where x.user_id = auth.uid()
  )
  select jsonb_build_object(
    'today', current_date,
    'days', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select
          e.utc_at::date as day,
          count(*) filter (where e.reason = 'review_remembered')::integer as remembered,
          count(*) filter (where e.reason = 'review_forgot')::integer as forgot,
          sum(e.amount)::integer as xp
        from events e
        group by 1
      ) d
    ), '[]'::jsonb),
    'hours', coalesce((
      select jsonb_agg(h order by h.hour)
      from (
        select extract(hour from e.utc_at)::integer as hour, count(*)::integer as reviews
        from events e
        where e.reason in ('review_remembered', 'review_forgot')
        group by 1
      ) h
    ), '[]'::jsonb),
    'levels', coalesce((
      select jsonb_agg(l order by l.level)
      from (
        select
          w.cefr_level as level,
          count(*) filter (where e.reason = 'review_remembered')::integer as remembered,
          count(*) filter (where e.reason = 'review_forgot')::integer as forgot
        from events e
        join public.words w on w.id = e.word_id
        where e.reason in ('review_remembered', 'review_forgot') and w.cefr_level is not null
        group by 1
      ) l
    ), '[]'::jsonb),
    'mastery', (
      select jsonb_build_object(
        'count', count(*)::integer,
        'avg_days', round(avg(e.utc_at::date - uw.introduced_on), 1)
      )
      from events e
      join public.user_words uw on uw.user_id = auth.uid() and uw.word_id = e.word_id
      where e.reason = 'word_mastered' and uw.introduced_on is not null
    )
  );
$$;

revoke execute on function public.my_statistics() from public, anon;
grant execute on function public.my_statistics() to authenticated;
