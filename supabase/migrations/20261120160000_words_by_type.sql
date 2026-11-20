-- Statistics: my words per part of speech (noun, verb, adj…), next to the
-- dictionary's count for that type. Run after 20261120150000_words_by_level.sql.
--   [{type, dictionary, known, mastered, learning}], my types only, most words first
--   type '' is "not sure" (custom words without a type)
-- Security invoker: RLS limits user_words to the caller's own rows.

create or replace function public.my_words_by_type()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with mine as (
    select w.part_of_speech as type, coalesce(uw.known, false) as known, uw.box
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = auth.uid()
  ),
  types as (
    select m.type,
      count(*) filter (where m.known)::integer as known,
      count(*) filter (where not m.known and m.box = 5)::integer as mastered,
      count(*) filter (where not m.known and m.box < 5)::integer as learning,
      count(*)::integer as total
    from mine m
    group by m.type
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', t.type,
      'dictionary', (select count(*) from public.dictionary_entries d where d.part_of_speech = t.type),
      'known', t.known,
      'mastered', t.mastered,
      'learning', t.learning
    )
    order by t.total desc, t.type
  ), '[]'::jsonb)
  from types t;
$$;

revoke execute on function public.my_words_by_type() from public, anon;
grant execute on function public.my_words_by_type() to authenticated;
