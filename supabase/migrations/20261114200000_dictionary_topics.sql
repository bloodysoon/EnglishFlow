-- Topics for dictionary words (sport, travel, food...), so the Learn page's
-- word card can draw from chosen topics and parts of speech.
-- Run after 20261114190000_dictionary_pool.sql. Safe to run more than once.
--
-- Topics are filled by hand in supabase/seed/dictionary.sql (5th value of
-- each row, e.g. '{sport,health}'); only the slugs below are allowed
-- (keep in sync with src/features/dictionary/topics.ts).

alter table public.dictionary_entries
  add column if not exists topics text[] not null default '{}';

alter table public.dictionary_entries drop constraint if exists dictionary_entries_topics_check;
alter table public.dictionary_entries
  add constraint dictionary_entries_topics_check check (topics <@ array['sport', 'travel', 'food', 'work', 'education', 'health', 'body', 'home', 'family', 'clothes', 'nature', 'animals', 'city', 'shopping', 'money', 'technology', 'media', 'arts', 'science', 'business', 'feelings', 'time']::text[]);

create index if not exists dictionary_entries_topics_idx on public.dictionary_entries using gin (topics);

-- Every part of speech the word lists give a word ("swim": noun and verb),
-- so the part-of-speech filter finds it under each.
alter table public.dictionary_entries
  add column if not exists parts_of_speech text[] not null default '{}';

-- The new filters change the signature: drop the old one so no overload stays behind.
drop function if exists public.pick_dictionary_words(integer);

-- ---------------------------------------------------------------------
-- pick_dictionary_words: as before (random, easiest open level first),
-- optionally only words with any of p_topics and any of p_parts_of_speech
-- (null or empty = no filter). The returned part of speech is the one the
-- filter asked for, so the card shows that meaning ("swim" as a verb).
-- ---------------------------------------------------------------------

create or replace function public.pick_dictionary_words(
  p_count integer default 3,
  p_topics text[] default null,
  p_parts_of_speech text[] default null
)
returns table (lemma text, part_of_speech text, cefr_level text)
language sql
volatile
security invoker
set search_path = ''
as $$
  with mine as (
    select w.lemma
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = (select auth.uid())
  ),
  open_words as (
    select
      d.lemma,
      coalesce(
        (select p from unnest(p_parts_of_speech) p where p = any (d.parts_of_speech) or p = d.part_of_speech limit 1),
        d.part_of_speech
      ) as part_of_speech,
      d.cefr_level
    from public.dictionary_entries d
    where not exists (select 1 from mine m where m.lemma = d.lemma)
      and (coalesce(cardinality(p_topics), 0) = 0 or d.topics && p_topics)
      and (
        coalesce(cardinality(p_parts_of_speech), 0) = 0
        or d.parts_of_speech && p_parts_of_speech
        or d.part_of_speech = any (p_parts_of_speech)
      )
  )
  select o.lemma, o.part_of_speech, o.cefr_level
  from open_words o
  where o.cefr_level = (select min(cefr_level) from open_words)
  order by random()
  limit least(greatest(coalesce(p_count, 3), 1), 20);
$$;

-- dictionary_topics: how many words each topic has, to show only topics in use.
create or replace function public.dictionary_topics()
returns table (topic text, words integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.topic, count(*)::integer
  from public.dictionary_entries d, unnest(d.topics) as t(topic)
  group by t.topic;
$$;

revoke execute on function public.pick_dictionary_words(integer, text[], text[]) from public, anon;
revoke execute on function public.dictionary_topics() from public, anon;
grant execute on function public.pick_dictionary_words(integer, text[], text[]) to authenticated;
grant execute on function public.dictionary_topics() to authenticated;
