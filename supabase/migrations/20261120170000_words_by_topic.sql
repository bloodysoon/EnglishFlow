-- Statistics: my words per topic (sport, food…), next to the dictionary's
-- count for that topic. Run after 20261120160000_words_by_type.sql.
--   [{topic, dictionary, known, mastered, learning}], my topics only, most words first
-- Topics live on dictionary_entries (by lemma); a word with several topics
-- counts in each, and words without a topic are left out.
-- Security invoker: RLS limits user_words to the caller's own rows.

create or replace function public.my_words_by_topic()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with mine as (
    select t.topic, coalesce(uw.known, false) as known, uw.box
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    join public.dictionary_entries d on d.lemma = w.lemma
    cross join unnest(d.topics) as t(topic)
    where uw.user_id = auth.uid()
  ),
  topics as (
    select m.topic,
      count(*) filter (where m.known)::integer as known,
      count(*) filter (where not m.known and m.box = 5)::integer as mastered,
      count(*) filter (where not m.known and m.box < 5)::integer as learning,
      count(*)::integer as total
    from mine m
    group by m.topic
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'topic', t.topic,
      'dictionary', (select count(*) from public.dictionary_entries d where t.topic = any (d.topics)),
      'known', t.known,
      'mastered', t.mastered,
      'learning', t.learning
    )
    order by t.total desc, t.topic
  ), '[]'::jsonb)
  from topics t;
$$;

revoke execute on function public.my_words_by_topic() from public, anon;
grant execute on function public.my_words_by_topic() to authenticated;
