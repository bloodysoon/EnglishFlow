-- Hard words, page by page: my_hard_words gains p_offset.
-- Run after 20261118120000_hard_words.sql.

-- Drop the one-argument version: next to the new one, a call with only
-- p_limit would be ambiguous.
drop function if exists public.my_hard_words(integer);

create or replace function public.my_hard_words(p_limit integer default 10, p_offset integer default 0)
returns table (
  word_id uuid,
  lemma text,
  box smallint,
  forgot integer,
  reviews integer
)
language sql
stable
-- Security invoker: RLS limits every table to the caller's own rows.
security invoker
set search_path = ''
as $$
  select
    w.id,
    w.lemma,
    uw.box,
    s.forgot,
    s.reviews
  from (
    select
      x.word_id,
      count(*) filter (where x.reason = 'review_forgot')::integer as forgot,
      count(*) filter (where x.reason in ('review_forgot', 'review_remembered'))::integer as reviews
    from public.xp_events x
    where x.user_id = auth.uid() and x.word_id is not null
    group by x.word_id
  ) s
  -- Inner join: words the learner removed drop out of the list.
  join public.user_words uw on uw.user_id = auth.uid() and uw.word_id = s.word_id
  join public.words w on w.id = s.word_id
  -- Forgetting once is noise; twice or more is a pattern.
  where s.forgot >= 2
  order by s.forgot desc, s.forgot::numeric / s.reviews desc, w.lemma, w.id
  limit least(greatest(coalesce(p_limit, 10), 1), 51)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.my_hard_words(integer, integer) from public, anon;
grant execute on function public.my_hard_words(integer, integer) to authenticated;
